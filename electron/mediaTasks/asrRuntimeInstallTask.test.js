// Offline tests for the ASR runtime installer. No process is spawned and no network
// is reached: `fetchImpl` and the media-task queue are injected, and the archive is a
// real temporary ZIP built with yazl.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import yazl from 'yazl';

import { createAsrRuntimeInstallMediaTaskHandler, selectAsrRuntimePackage } from './asrRuntimeInstallTask.js';

function makeRoot(t) {
  const base = mkdtempSync(path.join(tmpdir(), 'asr-runtime-install-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  return base;
}

function pythonEntryName(platform) {
  return platform === 'win32' ? 'python/python.exe' : 'python/bin/python3';
}

async function buildZip(dir, entries) {
  const archivePath = path.join(dir, 'asr-runtime.zip');
  const zip = new yazl.ZipFile();
  for (const [name, bytes] of entries) zip.addBuffer(bytes, name);
  await new Promise((resolve, reject) => {
    const stream = createWriteStream(archivePath);
    zip.once('error', reject);
    stream.once('error', reject);
    stream.once('close', resolve);
    zip.outputStream.pipe(stream);
    zip.end();
  });
  const bytes = readFileSync(archivePath);
  rmSync(archivePath, { force: true });
  return bytes;
}

function fetchReturning(bytes, { status = 200, withLength = true } = {}) {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    return {
      ok: status >= 200 && status < 300,
      status: status,
      headers: {
        get: (name) =>
          withLength && String(name).toLowerCase() === 'content-length'
            ? String(bytes.length)
            : null,
      },
      body: Readable.from([bytes]),
      json: async () => JSON.parse(bytes.toString('utf8')),
    };
  };
  return { fetchImpl: fetchImpl, calls: calls };
}

function recordingQueue() {
  const progress = [];
  const processes = [];
  return {
    progress: progress,
    processes: processes,
    queue: {
      emitProgress: (task, value, message, extra) => {
        progress.push({ value: value, message: message, stage: extra?.stage || '' });
      },
      runProcess: async (task, command, args, options) => {
        processes.push({ command: command, args: args, options: options });
        return { stdout: Buffer.alloc(0), stderr: Buffer.alloc(0), code: 0, signal: null };
      },
    },
  };
}

function statePathFor(userDataRoot) {
  return path.join(userDataRoot, 'runtime', 'asr', 'current.json');
}

async function makeInstalledRuntime(userDataRoot, { platform = 'win32', version = '1.2.3' } = {}) {
  const installDir = path.join(userDataRoot, 'runtime', 'asr', 'versions', version);
  const python = path.join(installDir, pythonEntryName(platform));
  mkdirSync(path.dirname(python), { recursive: true });
  writeFileSync(python, 'stub');
  mkdirSync(path.dirname(statePathFor(userDataRoot)), { recursive: true });
  writeFileSync(
    statePathFor(userDataRoot),
    JSON.stringify({
      version: version,
      runtimeRoot: installDir,
      platform: platform,
      arch: 'x64',
      sha256: 'a'.repeat(64),
      installedAt: 5,
    }),
  );
  return { installDir: installDir, python: python };
}

function task(overrides = {}) {
  return { id: 'task-one', payload: { args: {} }, ...overrides };
}

test('package selection matches the running platform and arch', () => {
  const manifest = {
    packages: [
      { platform: 'linux', arch: 'x64', url: 'https://example.invalid/linux.zip' },
      { platform: 'win32', arch: 'arm64', url: 'https://example.invalid/arm64.zip' },
      { platform: 'Win32 ', arch: 'x64', url: 'https://example.invalid/win64.zip', version: '9.1' },
    ],
  };
  const selected = selectAsrRuntimePackage(manifest, { platform: 'win32', arch: 'x64' });
  assert.equal(selected.url, 'https://example.invalid/win64.zip');
  assert.equal(selected.version, '9.1');
  assert.equal(selectAsrRuntimePackage(manifest, { platform: 'win32', arch: 'ia32' }), null);
});

test('package selection ignores entries with no usable download location', () => {
  assert.equal(
    selectAsrRuntimePackage(
      { packages: [{ platform: 'win32', arch: 'x64', url: 'ftp://example.invalid/x.zip' }] },
      { platform: 'win32', arch: 'x64' },
    ),
    null,
  );
  assert.equal(
    selectAsrRuntimePackage({ packages: [{ platform: 'win32', arch: 'x64' }] }, {
      platform: 'win32',
      arch: 'x64',
    }),
    null,
  );
});

test('package selection accepts a mirror-only entry and a bare manifest', () => {
  const mirrorOnly = selectAsrRuntimePackage(
    {
      packages: [
        {
          platform: 'win32',
          arch: 'x64',
          mirrors: [{ url: 'https://mirror.invalid/x.zip' }, 'not-a-url'],
        },
      ],
    },
    { platform: 'win32', arch: 'x64' },
  );
  assert.deepEqual(mirrorOnly.mirrors, ['https://mirror.invalid/x.zip']);
  assert.equal(
    selectAsrRuntimePackage(
      { platform: 'win32', arch: 'x64', url: 'https://example.invalid/bare.zip' },
      { platform: 'win32', arch: 'x64' },
    ).url,
    'https://example.invalid/bare.zip',
  );
});

test('an unavailable user data directory fails before any download', async (t) => {
  const root = makeRoot(t);
  const { fetchImpl, calls } = fetchReturning(Buffer.from('{}'));
  const handler = createAsrRuntimeInstallMediaTaskHandler({
    appRoot: root,
    fetchImpl: fetchImpl,
    getUserDataRoot: () => '',
    platform: 'win32',
    arch: 'x64',
  });
  await assert.rejects(handler(task(), recordingQueue().queue), /User data directory is unavailable/);
  assert.equal(calls.length, 0);
});

test('an already installed runtime is reused without touching the network', async (t) => {
  const userDataRoot = makeRoot(t);
  const installed = await makeInstalledRuntime(userDataRoot);
  const rec = recordingQueue();
  const handler = createAsrRuntimeInstallMediaTaskHandler({
    appRoot: userDataRoot,
    fetchImpl: async () => {
      throw new Error('network must not be used');
    },
    getUserDataRoot: () => userDataRoot,
    platform: 'win32',
    arch: 'x64',
  });
  const result = await handler(task(), rec.queue);
  assert.deepEqual(result, {
    success: true,
    available: true,
    source: 'installed',
    pythonCommand: installed.python,
  });
  assert.deepEqual(rec.progress.map((entry) => entry.stage), ['asr-runtime-check']);
  assert.equal(rec.processes.length, 0);
});

test('a bundled python is smoke-tested before falling back to a download', async (t) => {
  const userDataRoot = makeRoot(t);
  const rec = recordingQueue();
  const handler = createAsrRuntimeInstallMediaTaskHandler({
    appRoot: userDataRoot,
    fetchImpl: async () => {
      throw new Error('network must not be used');
    },
    getUserDataRoot: () => userDataRoot,
    resolveFallbackPythonCommand: () => process.execPath,
    platform: 'win32',
    arch: 'x64',
  });
  const result = await handler(task(), rec.queue);
  assert.deepEqual(result, {
    success: true,
    available: true,
    source: 'bundled',
    pythonCommand: process.execPath,
  });
  assert.equal(rec.processes.length, 1);
  assert.equal(rec.processes[0].command, process.execPath);
  assert.equal(rec.processes[0].args.length, 2);
  assert.equal(rec.processes[0].args[0], '-c');
  assert.match(rec.processes[0].args[1], /^import torch; import torchaudio; import funasr; import modelscope; from nemo\.collections\.asr\.models import SortformerEncLabelModel; print\('asr runtime smoke ok'\)$/);
  assert.equal(rec.processes[0].options.progressMessage, 'Verifying subtitle component');
});

test('a downloaded package is verified, extracted, smoke-tested and recorded as current', async (t) => {
  const userDataRoot = makeRoot(t);
  const work = makeRoot(t);
  const archive = await buildZip(work, [
    [pythonEntryName('win32'), Buffer.from('stub')],
    ['python/Lib/site.py', Buffer.from('stub')],
  ]);
  const sha256 = createHash('sha256').update(archive).digest('hex');
  const manifest = Buffer.from(
    JSON.stringify({
      packages: [
        {
          platform: 'win32',
          arch: 'x64',
          url: 'https://example.invalid/asr-runtime.zip',
          sha256: sha256,
          version: '3.4.5',
          size: archive.length,
        },
      ],
    }),
  );
  const { fetchImpl, calls } = fetchReturning(archive);
  const rec = recordingQueue();
  const handler = createAsrRuntimeInstallMediaTaskHandler({
    appRoot: userDataRoot,
    fetchImpl: async (url) => (url.includes('manifest') ? fetchReturning(manifest).fetchImpl(url) : fetchImpl(url)),
    getAsrRuntimeManifestUrl: () => 'https://example.invalid/manifest.json',
    getUserDataRoot: () => userDataRoot,
    platform: 'win32',
    arch: 'x64',
  });
  const result = await handler(task(), rec.queue);

  const installDir = path.join(userDataRoot, 'runtime', 'asr', 'versions', '3.4.5');
  assert.deepEqual(result, {
    success: true,
    available: true,
    source: 'downloaded',
    version: '3.4.5',
    runtimeRoot: installDir,
  });
  assert.deepEqual(calls, ['https://example.invalid/asr-runtime.zip']);
  assert.ok(existsSync(path.join(installDir, 'python', 'python.exe')));
  assert.ok(existsSync(path.join(installDir, 'python', 'Lib', 'site.py')));

  const state = JSON.parse(readFileSync(statePathFor(userDataRoot), 'utf8'));
  assert.equal(state.version, '3.4.5');
  assert.equal(state.runtimeRoot, installDir);
  assert.equal(state.platform, 'win32');
  assert.equal(state.arch, 'x64');
  assert.equal(state.sha256, sha256);
  assert.equal(state.manifestUrl, 'https://example.invalid/manifest.json');
  assert.ok(Number.isFinite(state.installedAt) && state.installedAt > 0);

  assert.ok(!existsSync(path.join(userDataRoot, 'runtime', 'asr', '_tmp', 'task-one')));
  assert.deepEqual(
    rec.progress.map((entry) => entry.stage),
    ['asr-runtime-check', 'asr-runtime-manifest', 'asr-runtime-download', 'asr-runtime-extract', 'asr-runtime-verify'],
  );
  assert.equal(rec.progress[0].value, 0.03);
  assert.equal(rec.progress[2].message, 'Downloading subtitle component 100%');
  assert.ok(Math.abs(rec.progress[2].value - 0.6) < 1e-9);
  assert.equal(rec.processes.length, 1);
  assert.equal(rec.processes[0].command, path.join(installDir, 'python', 'python.exe'));
});

test('a single nested directory inside the archive is unwrapped', async (t) => {
  const userDataRoot = makeRoot(t);
  const work = makeRoot(t);
  const archive = await buildZip(work, [[path.posix.join('nested', pythonEntryName('linux')), Buffer.from('stub')]]);
  const manifest = Buffer.from(
    JSON.stringify({
      packages: [{ platform: 'linux', arch: 'x64', url: 'https://example.invalid/x.zip', version: '1.0.0' }],
    }),
  );
  const handler = createAsrRuntimeInstallMediaTaskHandler({
    appRoot: userDataRoot,
    fetchImpl: async (url) =>
      url.includes('manifest') ? fetchReturning(manifest).fetchImpl(url) : fetchReturning(archive).fetchImpl(url),
    getAsrRuntimeManifestUrl: () => 'https://example.invalid/manifest.json',
    getUserDataRoot: () => userDataRoot,
    platform: 'linux',
    arch: 'x64',
  });
  const result = await handler(task(), recordingQueue().queue);
  const installDir = path.join(userDataRoot, 'runtime', 'asr', 'versions', '1.0.0');
  assert.equal(result.runtimeRoot, installDir);
  assert.ok(existsSync(path.join(installDir, 'python', 'bin', 'python3')));
});

test('a checksum mismatch aborts before extracting and records nothing', async (t) => {
  const userDataRoot = makeRoot(t);
  const work = makeRoot(t);
  const archive = await buildZip(work, [[pythonEntryName('win32'), Buffer.from('stub')]]);
  const manifest = Buffer.from(
    JSON.stringify({
      packages: [
        {
          platform: 'win32',
          arch: 'x64',
          url: 'https://example.invalid/x.zip',
          sha256: 'b'.repeat(64),
          version: '1.0.0',
        },
      ],
    }),
  );
  const handler = createAsrRuntimeInstallMediaTaskHandler({
    appRoot: userDataRoot,
    fetchImpl: async (url) =>
      url.includes('manifest') ? fetchReturning(manifest).fetchImpl(url) : fetchReturning(archive).fetchImpl(url),
    getAsrRuntimeManifestUrl: () => 'https://example.invalid/manifest.json',
    getUserDataRoot: () => userDataRoot,
    platform: 'win32',
    arch: 'x64',
  });
  await assert.rejects(handler(task(), recordingQueue().queue), /checksum verification failed/);
  assert.ok(!existsSync(statePathFor(userDataRoot)));
  assert.ok(!existsSync(path.join(userDataRoot, 'runtime', 'asr', 'versions', '1.0.0')));
});

test('an archive without a python runtime is rejected', async (t) => {
  const userDataRoot = makeRoot(t);
  const work = makeRoot(t);
  const archive = await buildZip(work, [['docs/readme.txt', Buffer.from('no python here')]]);
  const manifest = Buffer.from(
    JSON.stringify({
      packages: [{ platform: 'win32', arch: 'x64', url: 'https://example.invalid/x.zip', version: '1.0.0' }],
    }),
  );
  const handler = createAsrRuntimeInstallMediaTaskHandler({
    appRoot: userDataRoot,
    fetchImpl: async (url) =>
      url.includes('manifest') ? fetchReturning(manifest).fetchImpl(url) : fetchReturning(archive).fetchImpl(url),
    getAsrRuntimeManifestUrl: () => 'https://example.invalid/manifest.json',
    getUserDataRoot: () => userDataRoot,
    platform: 'win32',
    arch: 'x64',
  });
  await assert.rejects(
    handler(task(), recordingQueue().queue),
    /archive must contain a python runtime directory/,
  );
  assert.ok(!existsSync(statePathFor(userDataRoot)));
});

test('an unconfigured manifest URL fails with an explicit message', async (t) => {
  const userDataRoot = makeRoot(t);
  const handler = createAsrRuntimeInstallMediaTaskHandler({
    appRoot: userDataRoot,
    fetchImpl: async () => {
      throw new Error('network must not be used');
    },
    getAsrRuntimeManifestUrl: () => '   ',
    getUserDataRoot: () => userDataRoot,
    platform: 'win32',
    arch: 'x64',
  });
  await assert.rejects(
    handler(task({ payload: { args: { manifestUrl: 'file:///etc/passwd' } } }), recordingQueue().queue),
    /manifest URL is not configured/,
  );
});

test('a manifest HTTP failure surfaces the status code', async (t) => {
  const userDataRoot = makeRoot(t);
  const handler = createAsrRuntimeInstallMediaTaskHandler({
    appRoot: userDataRoot,
    fetchImpl: async () => ({ ok: false, status: 503, headers: { get: () => null } }),
    getAsrRuntimeManifestUrl: () => 'https://example.invalid/manifest.json',
    getUserDataRoot: () => userDataRoot,
    platform: 'win32',
    arch: 'x64',
  });
  await assert.rejects(handler(task(), recordingQueue().queue), /manifest request failed: HTTP 503/);
});

test('a manifest without a package for this platform and arch fails clearly', async (t) => {
  const userDataRoot = makeRoot(t);
  const manifest = Buffer.from(
    JSON.stringify({ packages: [{ platform: 'linux', arch: 'x64', url: 'https://example.invalid/x.zip' }] }),
  );
  const handler = createAsrRuntimeInstallMediaTaskHandler({
    appRoot: userDataRoot,
    fetchImpl: async () => fetchReturning(manifest).fetchImpl('https://example.invalid/manifest.json'),
    getAsrRuntimeManifestUrl: () => 'https://example.invalid/manifest.json',
    getUserDataRoot: () => userDataRoot,
    platform: 'win32',
    arch: 'x64',
  });
  await assert.rejects(handler(task(), recordingQueue().queue), /No ASR runtime package for win32-x64/);
});

test('forceRepair bypasses the installed runtime and reinstalls', async (t) => {
  const userDataRoot = makeRoot(t);
  await makeInstalledRuntime(userDataRoot, { version: '0.0.1' });
  const work = makeRoot(t);
  const archive = await buildZip(work, [[pythonEntryName('win32'), Buffer.from('stub')]]);
  const manifest = Buffer.from(
    JSON.stringify({
      packages: [{ platform: 'win32', arch: 'x64', url: 'https://example.invalid/x.zip', version: '7.0.0' }],
    }),
  );
  const rec = recordingQueue();
  const handler = createAsrRuntimeInstallMediaTaskHandler({
    appRoot: userDataRoot,
    fetchImpl: async (url) =>
      url.includes('manifest') ? fetchReturning(manifest).fetchImpl(url) : fetchReturning(archive).fetchImpl(url),
    getAsrRuntimeManifestUrl: () => 'https://example.invalid/manifest.json',
    getUserDataRoot: () => userDataRoot,
    platform: 'win32',
    arch: 'x64',
  });
  const result = await handler(task({ payload: { args: { forceRepair: true } } }), rec.queue);
  assert.equal(result.source, 'downloaded');
  assert.equal(result.version, '7.0.0');
  assert.ok(existsSync(path.join(result.runtimeRoot, 'python', 'python.exe')));
  assert.equal(JSON.parse(readFileSync(statePathFor(userDataRoot), 'utf8')).version, '7.0.0');
});
