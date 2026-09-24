import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  buildRuntimePythonCertificateEnv,
  buildRuntimeToolEnv,
  resolveRuntimeDreaminaCliPath,
  resolveRuntimePythonCaBundlePath,
  resolveRuntimeRoot,
  resolveRuntimeToolPath,
} from './runtimeAssetResolver.js';

const CACERT_RELATIVE = path.join('site-packages', 'certifi', 'cacert.pem');

function fileSetExists(files) {
  const set = new Set(files.map((entry) => path.resolve(entry)));
  return (candidate) => set.has(path.resolve(String(candidate)));
}

test('resolveRuntimeRoot switches between dev and packaged layouts', () => {
  assert.equal(
    resolveRuntimeRoot({ appIsPackaged: false, appRoot: 'F:/CanvasPro' }),
    path.join('F:/CanvasPro', '.electron-runtime', 'runtime'),
  );
  assert.equal(
    resolveRuntimeRoot({ appIsPackaged: true, resourcesPath: 'F:/app/resources', appRoot: 'F:/ignored' }),
    path.join('F:/app/resources', 'runtime'),
  );
  assert.equal(resolveRuntimeRoot({ appIsPackaged: true, resourcesPath: '' }), '');
  assert.equal(resolveRuntimeRoot({}), '');
});

test('resolveRuntimeToolPath appends .exe on win32 and honours the dev vendor fallback', () => {
  const runtimeRoot = 'F:/app/resources/runtime',
    packagedExe = path.join(runtimeRoot, 'ffmpeg', 'bin', 'ffmpeg.exe'),
    vendorExe = path.join('F:/CanvasPro', 'vendor', 'ffmpeg', 'windows-x64', 'bin', 'ffmpeg.exe');
  assert.equal(
    resolveRuntimeToolPath({
      name: 'ffmpeg',
      runtimeRoot: runtimeRoot,
      appIsPackaged: true,
      platform: 'win32',
      existsSync: fileSetExists([packagedExe]),
    }),
    packagedExe,
  );
  assert.equal(
    resolveRuntimeToolPath({
      name: 'ffmpeg',
      runtimeRoot: runtimeRoot,
      appIsPackaged: false,
      appRoot: 'F:/CanvasPro',
      platform: 'win32',
      existsSync: fileSetExists([vendorExe]),
    }),
    vendorExe,
  );
  assert.equal(
    resolveRuntimeToolPath({
      name: 'ffmpeg',
      runtimeRoot: runtimeRoot,
      appIsPackaged: false,
      appRoot: 'F:/CanvasPro',
      platform: 'linux',
      existsSync: () => false,
    }),
    '',
  );
  assert.equal(resolveRuntimeToolPath({ name: '', runtimeRoot: runtimeRoot }), '');
  assert.equal(resolveRuntimeToolPath({ name: 'ffmpeg', runtimeRoot: '' }), '');
  assert.equal(
    resolveRuntimeToolPath({
      name: 'ffmpeg.exe',
      runtimeRoot: runtimeRoot,
      appIsPackaged: true,
      platform: 'win32',
      existsSync: fileSetExists([path.join(runtimeRoot, 'ffmpeg', 'bin', 'ffmpeg.exe')]),
    }),
    path.join(runtimeRoot, 'ffmpeg', 'bin', 'ffmpeg.exe'),
  );
});

test('resolveRuntimeDreaminaCliPath only reports an existing binary', () => {
  const runtimeRoot = 'F:/runtime',
    dreamina = path.join(runtimeRoot, 'dreamina', 'dreamina.exe');
  assert.equal(
    resolveRuntimeDreaminaCliPath({
      runtimeRoot: runtimeRoot,
      platform: 'win32',
      existsSync: fileSetExists([dreamina]),
    }),
    dreamina,
  );
  assert.equal(
    resolveRuntimeDreaminaCliPath({ runtimeRoot: runtimeRoot, platform: 'win32', existsSync: () => false }),
    '',
  );
  assert.equal(resolveRuntimeDreaminaCliPath({ runtimeRoot: '', existsSync: () => true }), '');
});

test('resolveRuntimePythonCaBundlePath prefers backend, then Lib, then lib/python*', () => {
  const runtimeRoot = 'F:/runtime',
    backendBundle = path.join(runtimeRoot, 'backend', 'certifi', 'cacert.pem'),
    libBundle = path.join(runtimeRoot, 'python', 'Lib', CACERT_RELATIVE),
    pythonLibBundle = path.join(runtimeRoot, 'python', 'lib', 'python3.12', CACERT_RELATIVE);
  assert.equal(
    resolveRuntimePythonCaBundlePath({
      runtimeRoot: runtimeRoot,
      existsSync: fileSetExists([backendBundle, libBundle, pythonLibBundle]),
      readdirSync: () => [{ name: 'python3.12', isDirectory: () => true }],
    }),
    backendBundle,
  );
  assert.equal(
    resolveRuntimePythonCaBundlePath({
      runtimeRoot: runtimeRoot,
      existsSync: fileSetExists([pythonLibBundle]),
      readdirSync: () => [{ name: 'python3.12', isDirectory: () => true }, { name: 'not-python' }],
    }),
    pythonLibBundle,
  );
  assert.equal(
    resolveRuntimePythonCaBundlePath({
      runtimeRoot: runtimeRoot,
      existsSync: () => false,
      readdirSync: () => {
        throw new Error('missing lib dir');
      },
    }),
    '',
  );
  assert.equal(resolveRuntimePythonCaBundlePath({ runtimeRoot: '' }), '');
});

test('buildRuntimePythonCertificateEnv reuses an existing bundle before probing', () => {
  const runtimeRoot = 'F:/runtime',
    existing = 'F:/certs/existing.pem',
    discovered = path.join(runtimeRoot, 'backend', 'certifi', 'cacert.pem');
  assert.deepEqual(
    buildRuntimePythonCertificateEnv({
      runtimeRoot: runtimeRoot,
      env: { SSL_CERT_FILE: existing, REQUESTS_CA_BUNDLE: 'F:/certs/missing.pem' },
      existsSync: fileSetExists([existing, discovered]),
    }),
    { SSL_CERT_FILE: existing, REQUESTS_CA_BUNDLE: existing },
  );
  assert.deepEqual(
    buildRuntimePythonCertificateEnv({
      runtimeRoot: runtimeRoot,
      env: {},
      existsSync: fileSetExists([discovered]),
    }),
    { SSL_CERT_FILE: discovered, REQUESTS_CA_BUNDLE: discovered },
  );
  assert.deepEqual(
    buildRuntimePythonCertificateEnv({ runtimeRoot: runtimeRoot, env: {}, existsSync: () => false }),
    {},
  );
});

test('buildRuntimeToolEnv exposes every runtime tool and only an existing codex binary', () => {
  const runtimeRoot = 'F:/runtime',
    ffmpeg = path.join(runtimeRoot, 'ffmpeg', 'bin', 'ffmpeg.exe'),
    dreamina = path.join(runtimeRoot, 'dreamina', 'dreamina.exe'),
    codex = path.join(runtimeRoot, 'codex', 'codex.exe');
  assert.deepEqual(
    buildRuntimeToolEnv({
      runtimeRoot: runtimeRoot,
      appIsPackaged: true,
      platform: 'win32',
      existsSync: fileSetExists([ffmpeg, dreamina, codex]),
    }),
    {
      AIC_FFMPEG_EXE: ffmpeg,
      AIC_FFPROBE_EXE: '',
      AIC_DREAMINA_CLI_EXE: dreamina,
      AIC_CODEX_CLI_EXE: codex,
    },
  );
  assert.deepEqual(
    buildRuntimeToolEnv({
      runtimeRoot: runtimeRoot,
      appIsPackaged: true,
      platform: 'win32',
      existsSync: fileSetExists([ffmpeg]),
    }),
    {
      AIC_FFMPEG_EXE: ffmpeg,
      AIC_FFPROBE_EXE: '',
      AIC_DREAMINA_CLI_EXE: '',
    },
  );
});
