import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateRawSync } from 'node:zlib';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { buildDiagnosticLogEntry, createDiagnosticsManager, sanitizeDiagnosticValue } from './diagnostics.js';

const REDACTED = '[REDACTED]';

function createTempDir(prefix) {
  return mkdtempSync(path.join(tmpdir(), prefix));
}

function parseJsonl(text) {
  return String(text)
    .split('\n')
    .filter((line) => line.trim())
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
}

function readJsonl(filePath) {
  return parseJsonl(readFileSync(filePath, 'utf8'));
}

function readZipEntries(filePath) {
  const buffer = readFileSync(filePath);
  let endOfCentralDirectory = -1;
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      endOfCentralDirectory = offset;
      break;
    }
  }
  assert.notEqual(endOfCentralDirectory, -1, 'zip central directory not found');
  const entryCount = buffer.readUInt16LE(endOfCentralDirectory + 10);
  let cursor = buffer.readUInt32LE(endOfCentralDirectory + 16);
  const entries = new Map();
  for (let index = 0; index < entryCount; index += 1) {
    assert.equal(buffer.readUInt32LE(cursor), 0x02014b50, 'bad central directory header');
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.toString('utf8', cursor + 46, cursor + 46 + nameLength);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const raw = buffer.subarray(dataStart, dataStart + compressedSize);
    entries.set(name, method === 8 ? inflateRawSync(raw) : Buffer.from(raw));
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function readZipJson(entries, name) {
  return JSON.parse(entries.get(name).toString('utf8'));
}

const SEEDED_STRUCTURED_LINES = [
  {
    ts: '2020-09-24T10:00:00.000Z',
    launchSessionId: 'sid-a',
    eventSeq: 1,
    type: 'app.session_started',
    level: 'info',
    source: 'main',
    message: 'started',
  },
  {
    ts: '2020-09-24T10:00:01.000Z',
    launchSessionId: 'sid-a',
    eventSeq: 2,
    type: 'renderer.pan',
    level: 'warn',
    source: 'renderer',
    message: 'warn',
    context: { apiKey: 'SECRETVALUE' },
  },
  {
    ts: '2020-09-24T10:00:02.000Z',
    launchSessionId: 'sid-a',
    eventSeq: 3,
    type: 'app.session_ended',
    level: 'error',
    source: 'main',
    message: 'failed',
    context: { prompt: 'secret prompt' },
  },
];

function seedLogDir(logDir) {
  writeFileSync(
    path.join(logDir, 'desktop.log.jsonl'),
    SEEDED_STRUCTURED_LINES.map((line) => JSON.stringify(line)).join('\n') + '\nthis is not json\n',
    'utf8',
  );
  writeFileSync(path.join(logDir, 'server.log'), 'backend ok\n[ERROR] boom\napiKey=SECRETVALUE\n', 'utf8');
}

function createManager(logDir, overrides = {}) {
  return createDiagnosticsManager({
    logDir: logDir,
    launchSessionId: 'sid-manager',
    serverLogPath: path.join(logDir, 'server.log'),
    app: null,
    getMetadata: async () => ({ app: { name: 'updream canvas' } }),
    ...overrides,
  });
}

test('sanitizeDiagnosticValue redacts sensitive keys and private content keys', () => {
  const safeKeys = {
    dragFpsSessions: [1],
    panFpsSessions: [2],
    zoomFpsSessions: [3],
    resizeFpsSessions: [4],
    launchSessionId: 'sid',
    launchSessionIds: ['sid'],
  };
  const redactedKeys = [
    'apiKey',
    'API_TOKEN',
    'password',
    'passwd',
    'pwd',
    'cdkey',
    'authorization',
    'cookie',
    'sessionId',
    'bearer',
    'accessKey',
    'refreshKey',
    'prompt',
    'negativePrompt',
    'inputText',
    'sourceText',
    'projectJson',
    'canvasJson',
    'requestBody',
    'responseBody',
    'rawRequest',
    'rawResponse',
  ];
  const input = { ...safeKeys, keep: 'visible' };
  for (const key of redactedKeys) input[key] = 'secret';
  const value = sanitizeDiagnosticValue(input);
  for (const key of Object.keys(safeKeys)) {
    assert.deepEqual(value[key], safeKeys[key], key + ' must stay intact');
  }
  for (const key of redactedKeys) assert.equal(value[key], REDACTED, key + ' must be redacted');
  assert.equal(value.keep, 'visible');
});

test('sanitizeDiagnosticValue redacts nested values by their key', () => {
  const value = sanitizeDiagnosticValue({
    outer: { inner: { apiKey: 'x', list: [{ token: 'y' }, 'plain'] } },
  });
  assert.equal(value.outer.inner.apiKey, REDACTED);
  assert.equal(value.outer.inner.list[0].token, REDACTED);
  assert.equal(value.outer.inner.list[1], 'plain');
});

test('sanitizeDiagnosticValue truncates arrays and wide objects with overflow markers', () => {
  const value = sanitizeDiagnosticValue({
    list: Array.from({ length: 35 }, (unused, index) => index),
    wide: Object.fromEntries(Array.from({ length: 85 }, (unused, index) => ['k' + index, index])),
  });
  assert.equal(value.list.length, 31);
  assert.equal(value.list[30], '[truncated 5 items]');
  assert.equal(value.list[0], 0);
  assert.equal(value.list[29], 29);
  assert.equal(Object.keys(value.wide).length, 81);
  assert.equal(value.wide.__truncatedKeys, 5);
  assert.equal(value.wide.k0, 0);
});

test('sanitizeDiagnosticValue stops at the depth limit and clamps the requested depth', () => {
  const nested = { a: { b: { c: { d: { e: { f: { g: 'deep' } } } } } } };
  const value = sanitizeDiagnosticValue(nested);
  assert.equal(value.a.b.c.d.e, '[MaxDepth]');
  assert.equal(sanitizeDiagnosticValue(nested, { maxDepth: 12 }).a.b.c.d.e.f.g, 'deep');
  assert.equal(sanitizeDiagnosticValue(nested, { maxDepth: 3 }).a.b.c.d.e, '[MaxDepth]');
  assert.equal(sanitizeDiagnosticValue(nested, { maxDepth: 99 }).a.b.c.d.e.f.g, 'deep');
});

test('sanitizeDiagnosticValue serializes Error instances with metadata and cause', () => {
  const error = new Error('call failed apiKey=SECRET9');
  error.code = 500;
  error.cause = new Error('root cause');
  const value = sanitizeDiagnosticValue(error);
  assert.equal(value.name, 'Error');
  assert.equal(value.message, 'call failed apiKey=' + REDACTED);
  assert.equal(typeof value.stack, 'string');
  assert.equal(value.code, 500);
  assert.equal(value.cause.message, 'root cause');
});

test('sanitizeDiagnosticValue redacts secrets embedded in plain strings', () => {
  assert.equal(sanitizeDiagnosticValue('Bearer abcdefghijklmn'), 'Bearer ' + REDACTED);
  assert.equal(sanitizeDiagnosticValue('token=abcdef123'), 'token=' + REDACTED);
  assert.equal(sanitizeDiagnosticValue('key sk-abcdefgh1234'), 'key ' + REDACTED);
  assert.equal(sanitizeDiagnosticValue('ok'), 'ok');
});

test('sanitizeDiagnosticValue leaves a query redaction artifact when a later rule re-matches', () => {
  assert.equal(sanitizeDiagnosticValue('a?token=abc&b=1'), 'a?token=' + REDACTED + ']&b=1');
});

test('sanitizeDiagnosticValue rewrites the home directory to a placeholder', () => {
  const home = homedir();
  assert.equal(sanitizeDiagnosticValue('log at ' + home + '/x'), 'log at %USERPROFILE%/x');
  assert.equal(
    sanitizeDiagnosticValue('log at ' + home.split(path.sep).join('/') + '/x'),
    'log at %USERPROFILE%/x',
  );
});

test('sanitizeDiagnosticValue applies the stack specific length limit per key', () => {
  const long = 'x'.repeat(12000);
  const value = sanitizeDiagnosticValue({ stack: long, message: long });
  assert.equal(value.stack, 'x'.repeat(10000) + '... [truncated 2000 chars]');
  assert.equal(value.message, 'x'.repeat(2000) + '... [truncated 10000 chars]');
});

test('sanitizeDiagnosticValue passes primitives through and stringifies exotic values', () => {
  assert.equal(sanitizeDiagnosticValue(null), null);
  assert.equal(sanitizeDiagnosticValue(undefined), undefined);
  assert.equal(sanitizeDiagnosticValue(0), 0);
  assert.equal(sanitizeDiagnosticValue(false), false);
  assert.equal(sanitizeDiagnosticValue(12n), '12');
  assert.equal(
    sanitizeDiagnosticValue(() => {}),
    '[Function]',
  );
  assert.equal(sanitizeDiagnosticValue(Symbol('tag')), 'Symbol(tag)');
  assert.ok(Number.isNaN(sanitizeDiagnosticValue(NaN)));
});

test('buildDiagnosticLogEntry fills defaults and whitelists the level', () => {
  const entry = buildDiagnosticLogEntry({}, new Date('2026-09-24T12:00:00.000Z'));
  assert.deepEqual(entry, {
    ts: '2026-09-24T12:00:00.000Z',
    type: 'event',
    level: 'info',
    source: 'unknown',
    message: 'event',
    context: {},
    stack: '',
  });
  const levelOf = (level) => buildDiagnosticLogEntry({ type: 't', level: level }).level;
  assert.equal(levelOf('WARN'), 'warn');
  assert.equal(levelOf('Debug'), 'debug');
  assert.equal(levelOf('ERROR'), 'error');
  assert.equal(levelOf('fatal'), 'info');
  assert.equal(levelOf('trace'), 'info');
});

test('buildDiagnosticLogEntry adds launch session metadata only when present', () => {
  const fromOptions = buildDiagnosticLogEntry({ type: 'a' }, new Date(0), {
    launchSessionId: '  sid-a  ',
    eventSeq: 3,
  });
  assert.equal(fromOptions.launchSessionId, 'sid-a');
  assert.equal(fromOptions.eventSeq, 3);
  const fromEvent = buildDiagnosticLogEntry(
    { type: 'a', launchSessionId: 'sid-b', eventSeq: '4' },
    new Date(0),
  );
  assert.equal(fromEvent.launchSessionId, 'sid-b');
  assert.equal(fromEvent.eventSeq, 4);
  const withoutMeta = buildDiagnosticLogEntry({ type: 'a' }, new Date(0), { eventSeq: 0 });
  assert.equal('launchSessionId' in withoutMeta, false);
  assert.equal('eventSeq' in withoutMeta, false);
});

test('buildDiagnosticLogEntry attaches a thrown error to the message, context and stack', () => {
  const error = new Error('boom');
  const entry = buildDiagnosticLogEntry(
    { type: 't', source: 'main', level: 'error', error: error },
    new Date(0),
  );
  assert.equal(entry.message, 'boom');
  assert.equal(entry.context.error.name, 'Error');
  assert.equal(entry.context.error.message, 'boom');
  assert.equal(typeof entry.context.error.stack, 'string');
  assert.ok(entry.stack.startsWith('Error: boom'));
});

test('buildDiagnosticLogEntry keeps an array context untouched when an error is supplied', () => {
  const entry = buildDiagnosticLogEntry(
    { type: 't', context: [1, 2], error: new Error('boom') },
    new Date(0),
  );
  assert.deepEqual(entry.context, [1, 2]);
});

test('buildDiagnosticLogEntry normalizes one line fields and truncates long ones', () => {
  const entry = buildDiagnosticLogEntry({
    type: 'a\n\n  b\tc',
    source: 's'.repeat(200),
    message: 'm'.repeat(3000),
  });
  assert.equal(entry.type, 'a b c');
  assert.equal(entry.source, 's'.repeat(120) + '... [truncated 80 chars]');
  assert.equal(entry.message, 'm'.repeat(2000) + '... [truncated 1000 chars]');
});

test('createDiagnosticsManager exposes its surface and prepares directories', () => {
  const logDir = createTempDir('aic-diag-surface-');
  try {
    const manager = createManager(logDir);
    assert.deepEqual(
      Object.keys(manager).sort(),
      [
        'createPackage',
        'desktopLogPath',
        'diagnosticsDir',
        'ensureInitialFiles',
        'getSuggestedPackagePath',
        'launchSessionId',
        'logDir',
        'logEvent',
        'serverLogPath',
      ].sort(),
    );
    assert.equal(manager.launchSessionId, 'sid-manager');
    assert.equal(manager.logDir, logDir);
    assert.equal(manager.desktopLogPath, path.join(logDir, 'desktop.log.jsonl'));
    assert.equal(manager.diagnosticsDir, path.join(logDir, 'diagnostics'));
    assert.equal(manager.serverLogPath, path.join(logDir, 'server.log'));
    assert.equal(existsSync(manager.diagnosticsDir), true);
    assert.deepEqual(readdirSync(logDir), ['diagnostics']);
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});

test('createDiagnosticsManager derives a session id and honours explicit paths', () => {
  const logDir = createTempDir('aic-diag-derive-');
  try {
    const derived = createDiagnosticsManager({ logDir: logDir });
    assert.match(derived.launchSessionId, /^[0-9a-f-]{36}$/);
    const explicit = createDiagnosticsManager({
      logDir: logDir,
      diagnosticsDir: path.join(logDir, 'custom'),
      desktopLogPath: path.join(logDir, 'custom-desktop.jsonl'),
      serverLogPath: path.join(logDir, 'custom-server.log'),
      maxLogBytes: 1024,
    });
    assert.equal(explicit.diagnosticsDir, path.join(logDir, 'custom'));
    assert.equal(explicit.desktopLogPath, path.join(logDir, 'custom-desktop.jsonl'));
    assert.equal(explicit.serverLogPath, path.join(logDir, 'custom-server.log'));
    assert.equal(existsSync(explicit.diagnosticsDir), true);
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});

test('logEvent appends structured lines with an increasing sequence and the session id', () => {
  const logDir = createTempDir('aic-diag-log-');
  try {
    const manager = createManager(logDir);
    assert.deepEqual(manager.logEvent({ type: 'a', message: '1' }), { ok: true });
    assert.deepEqual(manager.logEvent({ type: 'b', level: 'debug', message: '2' }), { ok: true });
    const lines = readJsonl(manager.desktopLogPath);
    assert.deepEqual(
      lines.map((line) => line.eventSeq),
      [1, 2],
    );
    assert.deepEqual(
      lines.map((line) => line.launchSessionId),
      ['sid-manager', 'sid-manager'],
    );
    assert.equal(lines[1].type, 'b');
    assert.equal(lines[1].level, 'debug');
    assert.equal(existsSync(path.join(logDir, 'incidents.log.jsonl')), false);
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});

test('logEvent writes incident evidence with the eight preceding events', () => {
  const logDir = createTempDir('aic-diag-incident-');
  try {
    const manager = createManager(logDir);
    for (let index = 0; index < 10; index += 1) manager.logEvent({ type: 't' + index, message: 'm' });
    manager.logEvent({ type: 'boom', level: 'error', message: 'bad' });
    const incidents = readJsonl(path.join(logDir, 'incidents.log.jsonl'));
    assert.equal(incidents.length, 1);
    assert.equal(incidents[0].event.type, 'boom');
    assert.equal(incidents[0].event.level, 'error');
    assert.deepEqual(
      incidents[0].precedingEvents.map((event) => event.type),
      ['t2', 't3', 't4', 't5', 't6', 't7', 't8', 't9'],
    );
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});

test('logEvent reports an error when the log target is not a writable file', () => {
  const logDir = createTempDir('aic-diag-bad-');
  try {
    const blocked = path.join(logDir, 'as-dir');
    mkdirSync(blocked);
    const manager = createManager(logDir, { desktopLogPath: blocked });
    const result = manager.logEvent({ type: 'a' });
    assert.equal(result.ok, false);
    assert.match(result.error, /EISDIR|EPERM|EACCES/);
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});

test('ensureInitialFiles creates the log file, launch marker and session events', () => {
  const logDir = createTempDir('aic-diag-initial-');
  try {
    const listeners = new Map();
    const app = {
      getVersion: () => '0.4.12',
      isPackaged: false,
      once: (event, listener) => listeners.set(event, listener),
    };
    const manager = createManager(logDir, { app: app });
    manager.ensureInitialFiles();
    assert.equal(existsSync(manager.desktopLogPath), true);
    assert.deepEqual(JSON.parse(readFileSync(path.join(logDir, 'launch-version.json'), 'utf8')), {
      version: '0.4.12',
    });
    const lines = readJsonl(manager.desktopLogPath);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].type, 'app.session_started');
    assert.equal(lines[0].level, 'info');
    assert.deepEqual(lines[0].context, {
      pid: process.pid,
      packaged: false,
      launchVersion: {
        currentVersion: '0.4.12',
        previousVersion: '',
        versionChanged: null,
        markerSaved: true,
      },
    });
    manager.ensureInitialFiles();
    assert.equal(readJsonl(manager.desktopLogPath).length, 1);
    assert.equal(typeof listeners.get('before-quit'), 'function');
    listeners.get('before-quit')();
    listeners.get('before-quit')();
    const after = readJsonl(manager.desktopLogPath);
    assert.equal(after.length, 2);
    assert.equal(after[1].type, 'app.session_ended');
    assert.deepEqual(readdirSync(logDir).sort(), ['desktop.log.jsonl', 'diagnostics', 'launch-version.json']);
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});

test('ensureInitialFiles keeps an existing log file and logs the session without an app', () => {
  const logDir = createTempDir('aic-diag-existing-');
  try {
    writeFileSync(path.join(logDir, 'desktop.log.jsonl'), '{"ts":"t","type":"seed"}\n', 'utf8');
    const manager = createManager(logDir);
    manager.ensureInitialFiles();
    const lines = readJsonl(manager.desktopLogPath);
    assert.equal(lines[0].type, 'seed');
    assert.equal(lines.length, 2);
    assert.equal(lines[1].type, 'app.session_started');
    assert.deepEqual(lines[1].context, {
      pid: process.pid,
      packaged: false,
      launchVersion: {
        currentVersion: '',
        previousVersion: '',
        versionChanged: null,
        markerSaved: false,
      },
    });
    assert.equal(existsSync(path.join(logDir, 'launch-version.json')), false);
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});

test('getSuggestedPackagePath prefers the downloads folder and falls back to the diagnostics folder', () => {
  const logDir = createTempDir('aic-diag-suggest-');
  const downloads = createTempDir('aic-diag-downloads-');
  const date = new Date(2026, 8, 24, 12, 34, 56);
  const expected = 'Canvas-Diagnostics-20260924-123456.zip';
  try {
    const fromDownloads = createManager(logDir, { app: { getPath: () => downloads } });
    assert.equal(fromDownloads.getSuggestedPackagePath(date), path.join(downloads, expected));
    const throwing = createManager(logDir, {
      app: {
        getPath: () => {
          throw new Error('no downloads folder');
        },
      },
    });
    assert.equal(throwing.getSuggestedPackagePath(date), path.join(throwing.diagnosticsDir, expected));
    const withoutApp = createManager(logDir);
    assert.equal(withoutApp.getSuggestedPackagePath(date), path.join(withoutApp.diagnosticsDir, expected));
  } finally {
    rmSync(logDir, { recursive: true, force: true });
    rmSync(downloads, { recursive: true, force: true });
  }
});

test('createPackage rejects a relative output path before writing anything', async () => {
  const logDir = createTempDir('aic-diag-relative-');
  try {
    const manager = createManager(logDir);
    await assert.rejects(
      () => manager.createPackage({ outputPath: 'relative/diag.zip' }),
      /must be absolute/,
    );
    const lines = readJsonl(manager.desktopLogPath);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].type, 'diagnostics.package_collecting');
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});

test('createPackage writes a redacted diagnostics archive with a manifest and summary', async () => {
  const logDir = createTempDir('aic-diag-package-');
  const outputRoot = createTempDir('aic-diag-out-');
  try {
    seedLogDir(logDir);
    const manager = createManager(logDir, {
      getMetadata: async () => ({
        app: { name: 'updream canvas' },
        extra: { apiKey: 'SECRETVALUE' },
        secrets: { apiKey: 'SECRETVALUE' },
      }),
    });
    const outputPath = path.join(outputRoot, 'packages', 'diag.zip');
    const result = await manager.createPackage({ outputPath: outputPath });
    assert.deepEqual(result, { ok: true, path: outputPath, filename: 'diag.zip' });
    assert.equal(readFileSync(outputPath).subarray(0, 4).toString('binary'), 'PK\x03\x04');

    const entries = readZipEntries(outputPath);
    assert.deepEqual([...entries.keys()].sort(), [
      'README.txt',
      'desktop.log.jsonl',
      'error-summary.json',
      'metadata.json',
      'package-manifest.json',
      'server.log',
    ]);

    const metadata = readZipJson(entries, 'metadata.json');
    assert.equal(metadata.app.name, 'updream canvas');
    assert.equal(metadata.extra.apiKey, REDACTED);
    assert.equal(metadata.secrets, REDACTED);
    assert.equal(metadata.host.platform, process.platform);
    assert.equal(metadata.diagnostics.schemaVersion, 2);
    assert.equal(metadata.diagnostics.launchSessionId, 'sid-manager');
    assert.equal(typeof metadata.generatedAt, 'string');

    const summary = readZipJson(entries, 'error-summary.json');
    assert.equal(summary.schemaVersion, 2);
    assert.equal(summary.launchSessionId, 'sid-manager');
    assert.equal(summary.eventCount, 4);
    assert.equal(summary.problemCount, 2);
    assert.deepEqual(summary.levelCounts, { info: 2, warn: 1, error: 1 });
    assert.deepEqual(summary.sourceCounts, { main: 3, renderer: 1 });
    assert.deepEqual(summary.problemTypeCounts, { 'renderer.pan': 1, 'app.session_ended': REDACTED });
    assert.equal(summary.timeRange.first, '2020-09-24T10:00:00.000Z');
    assert.deepEqual(summary.launchSessionIds, ['sid-a', 'sid-manager']);
    const launchA = summary.launches.find((launch) => launch.launchSessionId === 'sid-a');
    assert.equal(launchA.eventCount, 3);
    assert.equal(launchA.problemCount, 2);
    assert.equal(launchA.startedAt, '2020-09-24T10:00:00.000Z');
    assert.equal(launchA.endedAt, '2020-09-24T10:00:02.000Z');
    assert.equal(launchA.normalEndRecorded, true);
    assert.equal(summary.recentProblems.length, 2);
    assert.deepEqual(
      summary.recentProblems.map((problem) => problem.type),
      ['renderer.pan', 'app.session_ended'],
    );
    assert.equal(summary.recentProblems[0].context.apiKey, REDACTED);
    assert.equal(summary.recentProblems[1].context.prompt, REDACTED);
    assert.equal(summary.backend.matchedLineCount, 1);
    assert.equal(summary.notes.length, 4);

    const packagedDesktopLog = parseJsonl(entries.get('desktop.log.jsonl'));
    assert.equal(packagedDesktopLog.length, 4);
    assert.deepEqual(
      packagedDesktopLog.map((line) => line.type),
      ['app.session_started', 'renderer.pan', 'app.session_ended', 'diagnostics.package_collecting'],
    );
    assert.equal(packagedDesktopLog[1].context.apiKey, REDACTED);
    assert.equal(entries.get('desktop.log.jsonl').toString('utf8').includes('SECRETVALUE'), false);
    const packagedServerLog = entries.get('server.log').toString('utf8');
    assert.equal(packagedServerLog.includes('apiKey=' + REDACTED), true);
    assert.equal(packagedServerLog.includes('SECRETVALUE'), false);

    const manifest = readZipJson(entries, 'package-manifest.json');
    assert.equal(manifest.schemaVersion, 1);
    assert.equal(manifest.launchSessionId, 'sid-manager');
    assert.deepEqual(manifest.structuredLogRange, summary.timeRange);
    assert.deepEqual(
      manifest.files.map((file) => file.name),
      [
        'metadata.json',
        'error-summary.json',
        'desktop.log.jsonl',
        'desktop.log.jsonl.1',
        'server.log',
        'README.txt',
        'incidents.log.jsonl',
        'incidents.log.jsonl.1',
      ],
    );
    assert.deepEqual(
      manifest.files.map((file) => file.kind),
      [
        'environment',
        'summary',
        'structured-log',
        'structured-log-archive',
        'backend-log',
        'instructions',
        'incident-evidence',
        'incident-evidence',
      ],
    );
    assert.deepEqual(
      manifest.files.map((file) => file.included),
      [true, true, true, false, true, true, false, false],
    );
    assert.deepEqual(
      manifest.files.map((file) => file.redacted),
      [false, false, true, true, true, false, true, true],
    );
    assert.equal(manifest.files[2].truncated, false);
    assert.equal(manifest.files[2].readFailed, false);
    assert.deepEqual(manifest.privacy, {
      structuredLogsRedacted: true,
      backendLogRedactedDuringPackaging: true,
      projectFilesIncluded: false,
      assetFilesIncluded: false,
      promptsIncluded: false,
    });
    assert.deepEqual(manifest.limits, {
      desktopTailBytes: 2 * 0x400 * 0x400,
      rotatedDesktopTailBytes: 2 * 0x400 * 0x400,
      serverTailBytes: 0x400 * 0x400,
      recentProblems: 30,
      incidentTailBytesPerFile: 2 * 0x400 * 0x400,
      precedingEventsPerIncident: 8,
    });
    assert.ok(entries.get('README.txt').toString('utf8').includes('package-manifest.json'));

    const logLines = readJsonl(manager.desktopLogPath);
    assert.equal(logLines.length, 5);
    assert.equal(logLines[3].type, 'diagnostics.package_collecting');
    assert.equal(logLines[4].type, 'diagnostics.package_created');
    assert.deepEqual(logLines[4].context, { filename: 'diag.zip', outputDirectory: 'user-selected' });
  } finally {
    rmSync(logDir, { recursive: true, force: true });
    rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('createPackage defaults to the suggested path and includes an AI analysis report', async () => {
  const logDir = createTempDir('aic-diag-suggested-');
  try {
    seedLogDir(logDir);
    const manager = createManager(logDir);
    const result = await manager.createPackage({
      aiAnalysisReport: { summary: 'ok', apiKey: 'SECRETVALUE' },
    });
    assert.match(path.basename(result.path), /^Canvas-Diagnostics-\d{8}-\d{6}\.zip$/);
    assert.equal(result.filename, path.basename(result.path));
    assert.equal(path.dirname(result.path), manager.diagnosticsDir);
    const entries = readZipEntries(result.path);
    assert.equal(entries.has('ai-diagnostics-report.json'), true);
    assert.deepEqual(readZipJson(entries, 'ai-diagnostics-report.json'), { summary: 'ok', apiKey: REDACTED });
    const manifest = readZipJson(entries, 'package-manifest.json');
    assert.equal(manifest.files[1].name, 'ai-diagnostics-report.json');
    assert.equal(manifest.files[1].kind, 'runtime-snapshot');
    const created = readJsonl(manager.desktopLogPath).at(-1);
    assert.equal(created.context.outputDirectory, 'downloads');
    rmSync(result.path, { force: true });
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});

test('createPackage ignores a non-object AI analysis report', async () => {
  const logDir = createTempDir('aic-diag-report-type-');
  const outputRoot = createTempDir('aic-diag-report-out-');
  try {
    const manager = createManager(logDir);
    const outputPath = path.join(outputRoot, 'diag.zip');
    await manager.createPackage({ outputPath: outputPath, aiAnalysisReport: 'not-an-object' });
    const entries = readZipEntries(outputPath);
    assert.equal(entries.has('ai-diagnostics-report.json'), false);
    const manifest = readZipJson(entries, 'package-manifest.json');
    assert.equal(manifest.files[0].name, 'metadata.json');
    assert.equal(manifest.files[1].name, 'error-summary.json');
  } finally {
    rmSync(logDir, { recursive: true, force: true });
    rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('createPackage adds the rotated log and incident evidence when present', async () => {
  const logDir = createTempDir('aic-diag-rotated-');
  const outputRoot = createTempDir('aic-diag-rotated-out-');
  try {
    seedLogDir(logDir);
    writeFileSync(
      path.join(logDir, 'desktop.log.jsonl.1'),
      JSON.stringify({
        ts: '2020-09-24T09:00:00.000Z',
        type: 'old.event',
        level: 'info',
        source: 'main',
        message: 'old',
      }) + '\n',
      'utf8',
    );
    writeFileSync(
      path.join(logDir, 'incidents.log.jsonl'),
      JSON.stringify({
        precedingEvents: [
          {
            ts: '2020-09-24T10:29:59.000Z',
            type: 'before.crash',
            level: 'info',
            source: 'main',
            message: 'before',
          },
        ],
        event: {
          ts: '2020-09-24T10:30:00.000Z',
          type: 'crash.event',
          level: 'error',
          source: 'main',
          message: 'crash',
        },
      }) + '\n',
      'utf8',
    );
    const manager = createManager(logDir);
    const outputPath = path.join(outputRoot, 'diag.zip');
    await manager.createPackage({ outputPath: outputPath });
    const entries = readZipEntries(outputPath);
    assert.deepEqual([...entries.keys()].sort(), [
      'README.txt',
      'desktop.log.jsonl',
      'desktop.log.jsonl.1',
      'error-summary.json',
      'incidents.log.jsonl',
      'metadata.json',
      'package-manifest.json',
      'server.log',
    ]);
    const summary = readZipJson(entries, 'error-summary.json');
    assert.equal(summary.eventCount, 7);
    assert.equal(summary.problemCount, 3);
    assert.deepEqual(
      summary.recentProblems.map((problem) => problem.type),
      ['renderer.pan', 'app.session_ended', 'crash.event'],
    );
    const manifest = readZipJson(entries, 'package-manifest.json');
    const byName = new Map(manifest.files.map((file) => [file.name, file]));
    assert.equal(byName.get('desktop.log.jsonl.1').included, true);
    assert.equal(byName.get('desktop.log.jsonl.1').kind, 'structured-log-archive');
    assert.equal(byName.get('desktop.log.jsonl.1').includedBytes > 0, true);
    assert.equal(byName.get('incidents.log.jsonl').included, true);
    assert.equal(byName.get('incidents.log.jsonl').kind, 'incident-evidence');
    assert.ok(entries.get('desktop.log.jsonl.1').toString('utf8').includes('old.event'));
  } finally {
    rmSync(logDir, { recursive: true, force: true });
    rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('createPackage reports a failure and logs it when the archive cannot be written', async () => {
  const logDir = createTempDir('aic-diag-failed-');
  const outputRoot = createTempDir('aic-diag-failed-out-');
  try {
    const manager = createManager(logDir);
    const blocked = path.join(outputRoot, 'taken.zip');
    mkdirSync(blocked);
    await assert.rejects(() => manager.createPackage({ outputPath: blocked }), /EISDIR|EPERM|EACCES/);
    const lines = readJsonl(manager.desktopLogPath);
    assert.equal(lines.at(-1).type, 'diagnostics.package_failed');
    assert.equal(lines.at(-1).level, 'error');
    assert.equal(typeof lines.at(-1).context.error.message, 'string');
    assert.equal(readdirSync(blocked).length, 0);
  } finally {
    rmSync(logDir, { recursive: true, force: true });
    rmSync(outputRoot, { recursive: true, force: true });
  }
});
