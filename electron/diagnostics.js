import yazl from 'yazl';
import { randomUUID } from 'node:crypto';
import {
  appendFileSync,
  closeSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mergeDiagnosticEvidence, summarizeBackendLog } from './diagnosticsEvidence.js';
import { serializeDiagnosticError } from '../src/utils/diagnosticError.js';
import { recordDiagnosticsLaunchVersion } from './diagnosticsLaunchVersion.js';
const DESKTOP_LOG_NAME = 'desktop.log.jsonl',
  ROTATED_DESKTOP_LOG_NAME = DESKTOP_LOG_NAME + '.1',
  INCIDENT_LOG_NAME = 'incidents.log.jsonl',
  INCIDENT_LOG_BYTES = 2 * 1024 * 1024,
  DIAGNOSTIC_README_NAME = 'README.txt',
  DIAGNOSTIC_METADATA_NAME = 'metadata.json',
  AI_DIAGNOSTICS_REPORT_NAME = 'ai-diagnostics-report.json',
  DIAGNOSTIC_PACKAGE_MANIFEST_NAME = 'package-manifest.json',
  DIAGNOSTIC_ERROR_SUMMARY_NAME = 'error-summary.json',
  DEFAULT_MAX_LOG_BYTES = 5 * 1024 * 1024,
  DEFAULT_SERVER_TAIL_BYTES = 1024 * 1024,
  DEFAULT_DESKTOP_TAIL_BYTES = 2 * 1024 * 1024,
  DEFAULT_ROTATED_DESKTOP_TAIL_BYTES = 2 * 1024 * 1024,
  MAX_RECENT_PROBLEMS = 30,
  MAX_STRING_LENGTH = 2000,
  MAX_STACK_LENGTH = 10000,
  MAX_ARRAY_ITEMS = 30,
  MAX_OBJECT_KEYS = 80,
  MAX_DEPTH = 5,
  REDACTED = '[REDACTED]',
  SENSITIVE_KEY_RE =
    /(?:api[-_ ]?key|token|authorization|password|passwd|pwd|cdkey|secret|cookie|session|bearer|access[-_ ]?key|refresh[-_ ]?key)/i,
  PRIVATE_CONTENT_KEY_RE =
    /^(?:prompt|negativePrompt|inputText|sourceText|projectJson|canvasJson|requestBody|responseBody|rawRequest|rawResponse)$/i,
  SAFE_DIAGNOSTIC_KEYS = new Set([
    'dragFpsSessions',
    'panFpsSessions',
    'zoomFpsSessions',
    'resizeFpsSessions',
    'launchSessionId',
    'launchSessionIds',
  ]),
  SENSITIVE_TEXT_NAME = String[
    'raw'
  ]`(?:api[-_ ]?key|token|authorization|password|passwd|pwd|cdkey|secret|cookie|bearer|access[-_ ]?key|refresh[-_ ]?key|prompt|negativePrompt|inputText|sourceText|projectJson|canvasJson|requestBody|responseBody|rawRequest|rawResponse)`,
  PRIVATE_CONTENT_TEXT_NAME = String[
    'raw'
  ]`(?:prompt|negativePrompt|inputText|sourceText|projectJson|canvasJson|requestBody|responseBody|rawRequest|rawResponse)`,
  PRIVATE_CONTENT_ASSIGNMENT_RE = new RegExp(
    String['raw']`((?:["']?${PRIVATE_CONTENT_TEXT_NAME}["']?)\s*[:=]\s*)(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\r\n]*)`,
    'gi',
  ),
  SENSITIVE_ASSIGNMENT_RE = new RegExp(
    String['raw']`((?:["']?${SENSITIVE_TEXT_NAME}["']?)\s*[:=]\s*)(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\s,;\]}]+)`,
    'gi',
  ),
  SENSITIVE_QUERY_RE = new RegExp(String['raw']`([?&]${SENSITIVE_TEXT_NAME}=)[^&#\s]*`, 'gi'),
  BEARER_VALUE_RE = /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi,
  COMMON_SECRET_VALUE_RE = /\b(?:sk|rk|pk)-[A-Za-z0-9_-]{8,}\b/gi;
function normalizeOneLine(value, item = '') {
  return String(value ?? item)
    ['replace'](/\s+/g, ' ')
    ['trim']();
}
function truncateString(key, index = MAX_STRING_LENGTH) {
  const list = String(key ?? '');
  if (list['length'] <= index) return list;
  return list['slice'](0, index) + '... [truncated ' + (list['length'] - index) + ' chars]';
}
function escapeRegExp(result) {
  return String(result || '')['replace'](/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function redactSensitiveText(data) {
  let options = String(data ?? '');
  options = options['replace'](PRIVATE_CONTENT_ASSIGNMENT_RE, '$1' + REDACTED)
    ['replace'](BEARER_VALUE_RE, 'Bearer ' + REDACTED)
    ['replace'](SENSITIVE_QUERY_RE, '$1' + REDACTED)
    ['replace'](SENSITIVE_ASSIGNMENT_RE, '$1' + REDACTED)
    ['replace'](COMMON_SECRET_VALUE_RE, REDACTED);
  const target = String(os['homedir']?.() || '')['trim']();
  if (target) {
    const source = new Set([target, target['replace'](/\\/g, '/')]);
    for (const enabled of source) {
      if (!enabled) continue;
      options = options['replace'](new RegExp(escapeRegExp(enabled), 'gi'), '%USERPROFILE%');
    }
  }
  return options;
}
function sanitizeDiagnosticText(next, current = MAX_STRING_LENGTH) {
  return truncateString(redactSensitiveText(next), current);
}
function isSensitiveDiagnosticKey(entry) {
  const record = String(entry || '');
  if (SAFE_DIAGNOSTIC_KEYS['has'](record)) return false;
  return SENSITIVE_KEY_RE['test'](record) || PRIVATE_CONTENT_KEY_RE['test'](record);
}
export function sanitizeDiagnosticValue(list2, event = {}) {
  const depth = Number(event['depth'] || 0) || 0,
    maxDepth = Math['min'](12, Math['max'](MAX_DEPTH, Number(event['maxDepth']) || MAX_DEPTH)),
    payload = String(event['key'] || '');
  if (isSensitiveDiagnosticKey(payload)) return REDACTED;
  if (list2 == null) return list2;
  const handle = typeof list2;
  if (handle === 'string')
    return sanitizeDiagnosticText(list2, payload === 'stack' ? MAX_STACK_LENGTH : MAX_STRING_LENGTH);
  if (handle === 'number' || handle === 'boolean') return list2;
  if (handle === 'bigint') return String(list2);
  if (handle === 'function') return '[Function]';
  if (handle !== 'object') return sanitizeDiagnosticText(String(list2));
  if (depth >= maxDepth) return '[MaxDepth]';
  if (list2 instanceof Error)
    return sanitizeDiagnosticValue(serializeDiagnosticError(list2), {
      depth: depth,
      maxDepth: maxDepth,
    });
  if (Array['isArray'](list2)) {
    const list3 = list2['slice'](0, MAX_ARRAY_ITEMS)['map']((state) =>
      sanitizeDiagnosticValue(state, { depth: depth + 1, maxDepth: maxDepth }),
    );
    return (
      list2['length'] > MAX_ARRAY_ITEMS &&
        list3['push']('[truncated ' + (list2['length'] - MAX_ARRAY_ITEMS) + ' items]'),
      list3
    );
  }
  const config = {},
    list4 = Object['entries'](list2)['slice'](0, MAX_OBJECT_KEYS);
  for (const [key2, scope] of list4) {
    config[key2] = sanitizeDiagnosticValue(scope, {
      key: key2,
      depth: depth + 1,
      maxDepth: maxDepth,
    });
  }
  const count = Object['keys'](list2)['length'] - list4['length'];
  if (count > 0) config['__truncatedKeys'] = count;
  return config;
}
export function buildDiagnosticLogEntry(error = {}, ts = new Date(), input = {}) {
  const oneLine = normalizeOneLine(error['source'], 'unknown') || 'unknown',
    oneLine2 = normalizeOneLine(error['type'], 'event') || 'event',
    oneLine3 = normalizeOneLine(error['level'], 'info')['toLowerCase'](),
    level = ['debug', 'info', 'warn', 'error']['includes'](oneLine3) ? oneLine3 : 'info',
    error2 = error['error'] instanceof Error ? error['error'] : null,
    args = error['context'] || {},
    output =
      error2 && typeof args === 'object' && !Array['isArray'](args) ? { ...args, error: error2 } : args,
    oneLine4 = normalizeOneLine(input['launchSessionId'] || error['launchSessionId']),
    eventSeq = Number(input['eventSeq'] || error['eventSeq'] || 0) || 0;
  return {
    ts: ts['toISOString'](),
    ...(oneLine4 ? { launchSessionId: truncateString(oneLine4, 120) } : {}),
    ...(eventSeq > 0 ? { eventSeq: eventSeq } : {}),
    type: truncateString(oneLine2, 120),
    level: level,
    source: truncateString(oneLine, 120),
    message: sanitizeDiagnosticText(
      error['message'] || error2?.['message'] || error['error'] || oneLine2,
      MAX_STRING_LENGTH,
    ),
    context: sanitizeDiagnosticValue(output),
    stack: sanitizeDiagnosticText(error['stack'] || error2?.['stack'] || '', MAX_STACK_LENGTH),
  };
}
function ensureDir(value2) {
  return (mkdirSync(value2, { recursive: true }), value2);
}
function safeUnlink(value3) {
  try {
    if (existsSync(value3)) unlinkSync(value3);
  } catch {}
}
function rotateLogIfNeeded(value4, value5) {
  try {
    if (!existsSync(value4)) return;
    const statSync2 = statSync(value4)['size'];
    if (statSync2 < value5) return;
    const value6 = value4 + '.1';
    (safeUnlink(value6), renameSync(value4, value6));
  } catch {}
}
function readTailSnapshot(enabled2, value7) {
  try {
    if (!enabled2 || !existsSync(enabled2))
      return {
        buffer: Buffer['alloc'](0),
        exists: false,
        sourceBytes: 0,
        includedBytes: 0,
        truncated: false,
      };
    const exists = statSync(enabled2);
    if (!exists['isFile']() || exists['size'] <= 0)
      return {
        buffer: Buffer['alloc'](0),
        exists: exists['isFile'](),
        sourceBytes: Math['max'](0, Number(exists['size'] || 0)),
        includedBytes: 0,
        truncated: false,
      };
    const value8 = Math['min'](exists['size'], value7),
      value9 = Math['max'](0, exists['size'] - value8),
      buffer = Buffer['alloc'](value8),
      openSync2 = openSync(enabled2, 'r');
    try {
      readSync(openSync2, buffer, 0, value8, value9);
    } finally {
      closeSync(openSync2);
    }
    return {
      buffer: buffer,
      exists: true,
      sourceBytes: exists['size'],
      includedBytes: buffer['length'],
      truncated: exists['size'] > buffer['length'],
    };
  } catch {
    return {
      buffer: Buffer['alloc'](0),
      exists: false,
      sourceBytes: 0,
      includedBytes: 0,
      truncated: false,
      readFailed: true,
    };
  }
}
function parseJsonlEntries(list5 = []) {
  const list6 = [];
  for (const value10 of list5) {
    const value11 = Buffer['isBuffer'](value10) ? value10['toString']('utf8')['split'](/\r?\n/) : [];
    for (const enabled3 of value11) {
      if (!enabled3['trim']()) continue;
      try {
        const value12 = JSON['parse'](enabled3);
        if (value12 && typeof value12 === 'object') list6['push'](value12);
      } catch {}
    }
  }
  return list6['sort']((value13, value14) =>
    String(value13?.['ts'] || '')['localeCompare'](String(value14?.['ts'] || '')),
  );
}
function sanitizeStructuredLogBuffer(list7) {
  if (!Buffer['isBuffer'](list7) || list7['length'] === 0) return Buffer['alloc'](0);
  const list8 = [];
  for (const enabled4 of list7['toString']('utf8')['split'](/\r?\n/)) {
    if (!enabled4['trim']()) continue;
    try {
      const value15 = JSON['parse'](enabled4);
      list8['push'](JSON['stringify'](sanitizeDiagnosticValue(value15, { maxDepth: 12 })));
    } catch {}
  }
  return Buffer['from'](list8['length'] ? list8['join']('\n') + '\n' : '', 'utf8');
}
function incrementCounter(value16, value17) {
  const oneLine5 = normalizeOneLine(value17, 'unknown') || 'unknown';
  value16[oneLine5] = (value16[oneLine5] || 0) + 1;
}
function sortCounter(value18, value19 = 50) {
  return Object['fromEntries'](
    Object['entries'](value18)
      ['sort'](
        (value20, value21) => value21[1] - value20[1] || value20[0]['localeCompare'](value21[0]),
      )
      ['slice'](0, value19),
  );
}
function buildErrorSummary(eventCount2 = [], generatedAt = {}) {
  const value22 = {},
    value23 = {},
    value24 = {},
    value25 = new Set(),
    map = new Map(),
    problemCount2 = [];
  for (const firstEventAt2 of eventCount2) {
    (incrementCounter(value22, firstEventAt2?.['level'] || 'info'),
      incrementCounter(value23, firstEventAt2?.['source'] || 'unknown'));
    if (firstEventAt2?.['launchSessionId']) {
      const launchSessionId2 = String(firstEventAt2['launchSessionId']);
      value25['add'](launchSessionId2);
      const value26 = map['get'](launchSessionId2) || {
        launchSessionId: launchSessionId2,
        firstEventAt: firstEventAt2?.['ts'] || '',
        lastEventAt: firstEventAt2?.['ts'] || '',
        eventCount: 0,
        problemCount: 0,
        startedAt: '',
        endedAt: '',
      };
      ((value26['lastEventAt'] = firstEventAt2?.['ts'] || value26['lastEventAt']),
        (value26['eventCount'] += 1));
      if (firstEventAt2?.['level'] === 'error' || firstEventAt2?.['level'] === 'warn')
        value26['problemCount'] += 1;
      if (firstEventAt2?.['type'] === 'app.session_started')
        value26['startedAt'] = firstEventAt2?.['ts'] || '';
      if (firstEventAt2?.['type'] === 'app.session_ended') value26['endedAt'] = firstEventAt2?.['ts'] || '';
      map['set'](launchSessionId2, value26);
    }
    if (firstEventAt2?.['level'] !== 'error' && firstEventAt2?.['level'] !== 'warn') continue;
    (incrementCounter(value24, firstEventAt2?.['type'] || 'unknown'),
      problemCount2['push']({
        ts: firstEventAt2?.['ts'] || '',
        launchSessionId: firstEventAt2?.['launchSessionId'] || '',
        eventSeq: Number(firstEventAt2?.['eventSeq'] || 0) || 0,
        type: firstEventAt2?.['type'] || 'unknown',
        level: firstEventAt2?.['level'] || 'warn',
        source: firstEventAt2?.['source'] || 'unknown',
        message: firstEventAt2?.['message'] || '',
        context: firstEventAt2?.['context'] || {},
        stack: sanitizeDiagnosticText(firstEventAt2?.['stack'] || '', 4000),
      }));
  }
  return sanitizeDiagnosticValue(
    {
      schemaVersion: 2,
      generatedAt: generatedAt['generatedAt'] || new Date()['toISOString'](),
      launchSessionId: generatedAt['launchSessionId'] || '',
      eventCount: eventCount2['length'],
      problemCount: problemCount2['length'],
      timeRange: { first: eventCount2[0]?.['ts'] || '', last: eventCount2['at'](-1)?.['ts'] || '' },
      launchSessionIds: Array['from'](value25)['slice'](-20),
      launches: Array['from'](map['values']())
        ['slice'](-20)
        ['map']((args2) => ({ ...args2, normalEndRecorded: Boolean(args2['endedAt']) })),
      levelCounts: sortCounter(value22),
      sourceCounts: sortCounter(value23),
      problemTypeCounts: sortCounter(value24),
      recentProblems: problemCount2['slice'](-MAX_RECENT_PROBLEMS),
      backend: summarizeBackendLog(generatedAt['backendLog'] || ''),
      notes: [
        'Structured counts include retained incident evidence, deduplicated by launchSessionId and eventSeq.',
        'Backend text matches are listed separately and are not included in structured problemCount.',
        'Use launchSessionId, eventSeq, taskId and nodeId to correlate related events when available.',
        'A missing normal end is not proof of a crash: the launch may still be running or logs may be truncated.',
      ],
    },
    { maxDepth: 12 },
  );
}
function sanitizeServerLogBuffer(list9) {
  if (!Buffer['isBuffer'](list9) || list9['length'] === 0) return Buffer['alloc'](0);
  return Buffer['from'](redactSensitiveText(list9['toString']('utf8')), 'utf8');
}
function describePackageFile(name, truncated, kind = {}) {
  return {
    name: name,
    kind: kind['kind'] || 'log',
    included: kind['included'] !== false,
    sourceBytes: Number(truncated?.['sourceBytes'] || 0),
    includedBytes: Number(kind['includedBytes'] ?? truncated?.['includedBytes'] ?? 0),
    truncated: truncated?.['truncated'] === true,
    readFailed: truncated?.['readFailed'] === true,
    redacted: kind['redacted'] === true,
  };
}
function writeZip(value27, value28) {
  return new Promise((value29, value30) => {
    const writeStream = createWriteStream(value28);
    (writeStream['once']('close', value29),
      writeStream['once']('error', value30),
      value27['outputStream']['once']('error', value30),
      value27['outputStream']['pipe'](writeStream),
      value27['end']());
  });
}
function resolveDownloadsDir(value31, value32) {
  try {
    const value33 = value31?.['getPath']?.('downloads');
    if (value33) return ensureDir(value33);
  } catch {}
  return ensureDir(value32);
}
function timestampForFilename(value34 = new Date()) {
  const run = (value35) => String(value35)['padStart'](2, '0');
  return [
    value34['getFullYear'](),
    run(value34['getMonth']() + 1),
    run(value34['getDate']()),
    '-',
    run(value34['getHours']()),
    run(value34['getMinutes']()),
    run(value34['getSeconds']()),
  ]['join']('');
}
function buildReadme() {
  return [
    'SHUO Canvas 诊断包',
    '',
    '请将整个 ZIP 文件发送给开发者用于排查问题。',
    '本诊断包包含运行日志、错误摘要、环境摘要和生成瞬间的脱敏状态快照。',
    '不包含项目文件、画布正文、素材、提示词、API Key 或授权码。',
    'package-manifest.json 会说明日志时间范围、截断和脱敏状态。',
    '',
  ]['join']('\n');
}
export function createDiagnosticsManager(options2 = {}) {
  const logDir = ensureDir(options2['logDir']),
    diagnosticsDir = ensureDir(options2['diagnosticsDir'] || path['join'](logDir, 'diagnostics')),
    desktopLogPath = options2['desktopLogPath'] || path['join'](logDir, DESKTOP_LOG_NAME),
    value36 = path['join'](logDir, INCIDENT_LOG_NAME),
    serverLogPath = options2['serverLogPath'] || '',
    value37 = Number(options2['maxLogBytes'] || DEFAULT_MAX_LOG_BYTES) || DEFAULT_MAX_LOG_BYTES,
    launchSessionId3 = normalizeOneLine(options2['launchSessionId'] || randomUUID()),
    app = options2['app'] || null,
    handler = typeof options2['getMetadata'] === 'function' ? options2['getMetadata'] : () => ({});
  let eventSeq2 = 0,
    enabled5 = false,
    value38 = false,
    launchVersion = null;
  const precedingEvents = [];
  function logEvent(options3 = {}) {
    try {
      (ensureDir(logDir), rotateLogIfNeeded(desktopLogPath, value37), (eventSeq2 += 1));
      const event2 = buildDiagnosticLogEntry(options3, new Date(), {
        launchSessionId: launchSessionId3,
        eventSeq: eventSeq2,
      });
      launchVersion &&
        ['app.startup_failed', 'chrome_shell.startup_failed', 'renderer.chrome_shell_startup_failed'][
          'includes'
        ](event2['type']) &&
        (event2['context'] = { ...event2['context'], launchVersion: launchVersion });
      appendFileSync(desktopLogPath, JSON['stringify'](event2) + '\n', 'utf8');
      if (event2['level'] === 'warn' || event2['level'] === 'error')
        try {
          (rotateLogIfNeeded(value36, INCIDENT_LOG_BYTES),
            appendFileSync(
              value36,
              JSON['stringify']({ event: event2, precedingEvents: precedingEvents }) + '\n',
              'utf8',
            ));
        } catch {}
      precedingEvents['push'](event2);
      if (precedingEvents['length'] > 8) precedingEvents['shift']();
      return { ok: true };
    } catch (error3) {
      return { ok: false, error: String(error3?.['message'] || error3) };
    }
  }
  function getSuggestedPackagePath(value39 = new Date()) {
    const value40 = 'Canvas-Diagnostics-' + timestampForFilename(value39) + '.zip';
    return path['join'](resolveDownloadsDir(app, diagnosticsDir), value40);
  }
  async function createPackage(options4 = {}) {
    const generatedAt2 = new Date();
    logEvent({
      type: 'diagnostics.package_collecting',
      level: 'info',
      source: 'main',
      message: 'Diagnostics package collection started',
    });
    const outputDirectory = String(options4?.['outputPath'] || '')['trim']();
    if (outputDirectory && !path['isAbsolute'](outputDirectory))
      throw new Error('Diagnostics output path must be absolute');
    const path2 = outputDirectory ? path['resolve'](outputDirectory) : getSuggestedPackagePath(generatedAt2);
    ensureDir(path['dirname'](path2));
    const filename = path['basename'](path2),
      value41 = await Promise['resolve'](handler()),
      sanitizeDiagnosticValue2 = sanitizeDiagnosticValue({
        generatedAt: generatedAt2['toISOString'](),
        host: { platform: process['platform'], arch: process['arch'], osRelease: os['release']() },
        diagnostics: { schemaVersion: 2, launchSessionId: launchSessionId3, launchVersion: launchVersion },
        ...(value41 || {}),
      }),
      value42 = desktopLogPath + '.1',
      included = readTailSnapshot(value42, DEFAULT_ROTATED_DESKTOP_TAIL_BYTES),
      tailSnapshot = readTailSnapshot(desktopLogPath, DEFAULT_DESKTOP_TAIL_BYTES),
      tailSnapshot2 = readTailSnapshot(serverLogPath, DEFAULT_SERVER_TAIL_BYTES),
      includedBytes = sanitizeStructuredLogBuffer(included['buffer']),
      includedBytes2 = sanitizeStructuredLogBuffer(tailSnapshot['buffer']),
      backendLog = sanitizeServerLogBuffer(tailSnapshot2['buffer']),
      list10 = [INCIDENT_LOG_NAME, INCIDENT_LOG_NAME + '.1']['map']((name2) => {
        const snapshot = readTailSnapshot(path['join'](logDir, name2), INCIDENT_LOG_BYTES);
        return {
          name: name2,
          snapshot: snapshot,
          buffer: sanitizeStructuredLogBuffer(snapshot['buffer']),
        };
      }),
      diagnosticEvidence = mergeDiagnosticEvidence(
        parseJsonlEntries([includedBytes, includedBytes2]),
        parseJsonlEntries(list10['map']((value43) => value43['buffer'])),
      ),
      structuredLogRange = buildErrorSummary(diagnosticEvidence, {
        generatedAt: generatedAt2['toISOString'](),
        launchSessionId: launchSessionId3,
        backendLog: backendLog['toString']('utf8'),
      }),
      value44 =
        options4?.['aiAnalysisReport'] && typeof options4['aiAnalysisReport'] === 'object'
          ? sanitizeDiagnosticValue(options4['aiAnalysisReport'], { maxDepth: 12 })
          : null,
      includedBytes3 = Buffer['from'](
        JSON['stringify'](sanitizeDiagnosticValue2, null, 2) + '\n',
        'utf8',
      ),
      includedBytes4 = Buffer['from'](JSON['stringify'](structuredLogRange, null, 2) + '\n', 'utf8'),
      includedBytes5 = value44
        ? Buffer['from'](JSON['stringify'](value44, null, 2) + '\n', 'utf8')
        : null,
      includedBytes6 = Buffer['from'](buildReadme(), 'utf8'),
      files = [
        describePackageFile(DIAGNOSTIC_METADATA_NAME, null, {
          kind: 'environment',
          includedBytes: includedBytes3['length'],
        }),
        describePackageFile(DIAGNOSTIC_ERROR_SUMMARY_NAME, null, {
          kind: 'summary',
          includedBytes: includedBytes4['length'],
        }),
        describePackageFile(DESKTOP_LOG_NAME, tailSnapshot, {
          kind: 'structured-log',
          includedBytes: includedBytes2['length'],
          redacted: true,
        }),
        describePackageFile(ROTATED_DESKTOP_LOG_NAME, included, {
          kind: 'structured-log-archive',
          included: included['exists'],
          includedBytes: includedBytes['length'],
          redacted: true,
        }),
        describePackageFile('server.log', tailSnapshot2, {
          kind: 'backend-log',
          includedBytes: backendLog['length'],
          redacted: true,
        }),
        describePackageFile(DIAGNOSTIC_README_NAME, null, {
          kind: 'instructions',
          includedBytes: includedBytes6['length'],
        }),
      ];
    for (const included2 of list10) {
      files['push'](
        describePackageFile(included2['name'], included2['snapshot'], {
          kind: 'incident-evidence',
          included: included2['snapshot']['exists'],
          includedBytes: included2['buffer']['length'],
          redacted: true,
        }),
      );
    }
    includedBytes5 &&
      files['splice'](
        1,
        0,
        describePackageFile(AI_DIAGNOSTICS_REPORT_NAME, null, {
          kind: 'runtime-snapshot',
          includedBytes: includedBytes5['length'],
        }),
      );
    const sanitizeDiagnosticValue3 = sanitizeDiagnosticValue({
        schemaVersion: 1,
        generatedAt: generatedAt2['toISOString'](),
        launchSessionId: launchSessionId3,
        limits: {
          desktopTailBytes: DEFAULT_DESKTOP_TAIL_BYTES,
          rotatedDesktopTailBytes: DEFAULT_ROTATED_DESKTOP_TAIL_BYTES,
          serverTailBytes: DEFAULT_SERVER_TAIL_BYTES,
          recentProblems: MAX_RECENT_PROBLEMS,
          incidentTailBytesPerFile: INCIDENT_LOG_BYTES,
          precedingEventsPerIncident: 8,
        },
        structuredLogRange: structuredLogRange['timeRange'],
        files: files,
        privacy: {
          structuredLogsRedacted: true,
          backendLogRedactedDuringPackaging: true,
          projectFilesIncluded: false,
          assetFilesIncluded: false,
          promptsIncluded: false,
        },
      }),
      value45 = new yazl['ZipFile']();
    (value45['addBuffer'](includedBytes3, DIAGNOSTIC_METADATA_NAME),
      value45['addBuffer'](
        Buffer['from'](JSON['stringify'](sanitizeDiagnosticValue3, null, 2) + '\n', 'utf8'),
        DIAGNOSTIC_PACKAGE_MANIFEST_NAME,
      ),
      value45['addBuffer'](includedBytes4, DIAGNOSTIC_ERROR_SUMMARY_NAME));
    if (includedBytes5) value45['addBuffer'](includedBytes5, AI_DIAGNOSTICS_REPORT_NAME);
    value45['addBuffer'](includedBytes2, DESKTOP_LOG_NAME);
    included['exists'] && value45['addBuffer'](includedBytes, ROTATED_DESKTOP_LOG_NAME);
    value45['addBuffer'](backendLog, 'server.log');
    for (const error4 of list10) {
      if (error4['snapshot']['exists']) value45['addBuffer'](error4['buffer'], error4['name']);
    }
    value45['addBuffer'](includedBytes6, DIAGNOSTIC_README_NAME);
    try {
      return (
        await writeZip(value45, path2),
        logEvent({
          type: 'diagnostics.package_created',
          level: 'info',
          source: 'main',
          message: 'Diagnostics package created',
          context: { filename: filename, outputDirectory: outputDirectory ? 'user-selected' : 'downloads' },
        }),
        { ok: true, path: path2, filename: filename }
      );
    } catch (error5) {
      logEvent({
        type: 'diagnostics.package_failed',
        level: 'error',
        source: 'main',
        message: 'Diagnostics package failed',
        error: error5,
      });
      throw error5;
    }
  }
  function ensureInitialFiles() {
    (ensureDir(logDir),
      !existsSync(desktopLogPath) && writeFileSync(desktopLogPath, '', 'utf8'),
      !enabled5 &&
        ((enabled5 = true),
        (launchVersion = recordDiagnosticsLaunchVersion({ logDir: logDir, app: app })),
        logEvent({
          type: 'app.session_started',
          level: 'info',
          source: 'main',
          message: 'Desktop application session started',
          context: {
            pid: process['pid'],
            packaged: app?.['isPackaged'] === true,
            launchVersion: launchVersion,
          },
        }),
        typeof app?.['once'] === 'function' &&
          app['once']('before-quit', () => {
            if (value38) return;
            ((value38 = true),
              logEvent({
                type: 'app.session_ended',
                level: 'info',
                source: 'main',
                message: 'Desktop application session ended',
              }));
          })));
  }
  return {
    launchSessionId: launchSessionId3,
    logDir: logDir,
    diagnosticsDir: diagnosticsDir,
    desktopLogPath: desktopLogPath,
    serverLogPath: serverLogPath,
    ensureInitialFiles: ensureInitialFiles,
    logEvent: logEvent,
    getSuggestedPackagePath: getSuggestedPackagePath,
    createPackage: createPackage,
  };
}
