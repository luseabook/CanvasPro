import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
  normalizeAsrRuntimeVersion,
  readInstalledAsrRuntimeState,
  resolveAsrRuntimeBaseDir,
  resolveAsrRuntimeInstallDir,
  resolveAsrRuntimePythonCommand,
  resolveAsrRuntimeStatePath,
  resolvePreferredRuntimePythonCommand,
} from './pythonRuntimeResolver.js';
import * as asrRuntimeResolver from './asrRuntimeResolver.js';

const ROOT = path.resolve('C:/fixtures/user');

test('win32 prefers the runtime python.exe, then the Scripts shim', () => {
  const runtimeRoot = path.resolve('C:/runtime');
  const python = path.join(runtimeRoot, 'python', 'python.exe');
  assert.equal(
    resolvePreferredRuntimePythonCommand({
      existsSync: (candidate) => candidate === python,
      platform: 'win32',
      runtimeRoot: runtimeRoot,
    }),
    python,
  );
  const scriptsPython = path.join(runtimeRoot, 'python', 'Scripts', 'python.exe');
  assert.equal(
    resolvePreferredRuntimePythonCommand({
      existsSync: (candidate) => candidate === scriptsPython,
      platform: 'win32',
      runtimeRoot: runtimeRoot,
    }),
    scriptsPython,
  );
});

test('posix prefers bin/python3, then bin/python', () => {
  const runtimeRoot = path.resolve('C:/runtime');
  const python3 = path.join(runtimeRoot, 'python', 'bin', 'python3');
  assert.equal(
    resolvePreferredRuntimePythonCommand({
      existsSync: (candidate) => candidate === python3,
      platform: 'linux',
      runtimeRoot: runtimeRoot,
    }),
    python3,
  );
  const python = path.join(runtimeRoot, 'python', 'bin', 'python');
  assert.equal(
    resolvePreferredRuntimePythonCommand({
      existsSync: (candidate) => candidate === python,
      platform: 'darwin',
      runtimeRoot: runtimeRoot,
    }),
    python,
  );
});

test('a bare fallback command is returned when no runtime python exists', () => {
  assert.equal(
    resolvePreferredRuntimePythonCommand({
      existsSync: () => false,
      fallbackCommand: 'python',
      platform: 'win32',
      runtimeRoot: path.resolve('C:/runtime'),
    }),
    'python',
  );
});

test('an absolute fallback command still has to exist on disk', () => {
  const fallback = path.resolve('C:/venv/python.exe');
  assert.equal(
    resolvePreferredRuntimePythonCommand({
      existsSync: () => false,
      fallbackCommand: fallback,
      platform: 'win32',
      runtimeRoot: path.resolve('C:/runtime'),
    }),
    undefined,
  );
});

test('asr runtime paths derive from the user data root', () => {
  assert.equal(resolveAsrRuntimeBaseDir(''), '');
  assert.equal(resolveAsrRuntimeBaseDir('   '), '');
  assert.equal(resolveAsrRuntimeBaseDir(ROOT), path.join(ROOT, 'runtime', 'asr'));
  assert.equal(resolveAsrRuntimeStatePath(''), '');
  assert.equal(resolveAsrRuntimeStatePath(ROOT), path.join(ROOT, 'runtime', 'asr', 'current.json'));
});

test('runtime versions are sanitized and bounded', () => {
  assert.equal(normalizeAsrRuntimeVersion(''), 'unknown');
  assert.equal(normalizeAsrRuntimeVersion('  '), 'unknown');
  assert.equal(normalizeAsrRuntimeVersion('1.2.3'), '1.2.3');
  assert.equal(normalizeAsrRuntimeVersion('1.2.3-beta+build/7'), '1.2.3-beta_build_7');
  assert.equal(normalizeAsrRuntimeVersion('x'.repeat(200)).length, 0x50);
});

test('install dirs are namespaced per sanitized version', () => {
  assert.equal(resolveAsrRuntimeInstallDir({ userDataRoot: '', version: '1.2.3' }), '');
  assert.equal(
    resolveAsrRuntimeInstallDir({ userDataRoot: ROOT, version: '1.2.3+build' }),
    path.join(ROOT, 'runtime', 'asr', 'versions', '1.2.3_build'),
  );
});

test('no state file means no installed runtime', () => {
  assert.equal(readInstalledAsrRuntimeState({ userDataRoot: ROOT, existsSync: () => false }), null);
  assert.equal(readInstalledAsrRuntimeState({ userDataRoot: '' }), null);
});

test('a malformed state file degrades to "not installed" instead of throwing', () => {
  assert.equal(
    readInstalledAsrRuntimeState({
      userDataRoot: ROOT,
      existsSync: () => true,
      readFileSync: () => '{not json',
    }),
    null,
  );
  assert.equal(
    readInstalledAsrRuntimeState({
      userDataRoot: ROOT,
      existsSync: () => true,
      readFileSync: () => '',
    }),
    null,
  );
});

test('a state file pointing outside the asr runtime base dir is rejected', () => {
  assert.equal(
    readInstalledAsrRuntimeState({
      userDataRoot: ROOT,
      existsSync: () => true,
      readFileSync: () => JSON.stringify({ runtimeRoot: path.resolve('C:/elsewhere/runtime') }),
    }),
    null,
  );
  assert.equal(
    readInstalledAsrRuntimeState({
      userDataRoot: ROOT,
      existsSync: () => true,
      readFileSync: () =>
        JSON.stringify({
          runtimeRoot: path.resolve('C:/fixtures/user/runtime/asr-sibling'),
        }),
    }),
    null,
  );
});

test('a state file whose runtime root vanished is rejected', () => {
  const installDir = path.join(ROOT, 'runtime', 'asr', 'versions', '1.2.3');
  assert.equal(
    readInstalledAsrRuntimeState({
      userDataRoot: ROOT,
      existsSync: (candidate) => candidate !== installDir,
      readFileSync: () => JSON.stringify({ version: '1.2.3', runtimeRoot: installDir }),
    }),
    null,
  );
});

test('a valid state file is normalized into a stable shape', () => {
  const installDir = path.join(ROOT, 'runtime', 'asr', 'versions', '1.2.3');
  assert.deepEqual(
    readInstalledAsrRuntimeState({
      userDataRoot: ROOT,
      existsSync: () => true,
      readFileSync: () =>
        JSON.stringify({
          version: '1.2.3',
          runtimeRoot: installDir,
          platform: 'win32',
          arch: 'x64',
          installedAt: 17,
        }),
    }),
    {
      version: '1.2.3',
      runtimeRoot: installDir,
      platform: 'win32',
      arch: 'x64',
      installedAt: 17,
    },
  );
});

test('python command falls back when nothing is installed', () => {
  assert.equal(
    resolveAsrRuntimePythonCommand({
      userDataRoot: ROOT,
      existsSync: () => false,
      fallbackCommand: 'python',
      platform: 'win32',
    }),
    'python',
  );
});

test('python command resolves inside the installed runtime when state is valid', () => {
  const installDir = path.join(ROOT, 'runtime', 'asr', 'versions', '1.2.3');
  const python = path.join(installDir, 'python', 'python.exe');
  assert.equal(
    resolveAsrRuntimePythonCommand({
      userDataRoot: ROOT,
      existsSync: () => true,
      readFileSync: () => JSON.stringify({ version: '1.2.3', runtimeRoot: installDir }),
      fallbackCommand: 'python',
      platform: 'win32',
    }),
    python,
  );
});

test('asrRuntimeResolver re-exports the shared implementations', () => {
  assert.equal(asrRuntimeResolver.resolveAsrRuntimeBaseDir, resolveAsrRuntimeBaseDir);
  assert.equal(asrRuntimeResolver.resolveAsrRuntimeStatePath, resolveAsrRuntimeStatePath);
  assert.equal(asrRuntimeResolver.resolveAsrRuntimeInstallDir, resolveAsrRuntimeInstallDir);
  assert.equal(asrRuntimeResolver.readInstalledAsrRuntimeState, readInstalledAsrRuntimeState);
  assert.equal(asrRuntimeResolver.resolveAsrRuntimePythonCommand, resolveAsrRuntimePythonCommand);
  assert.equal(asrRuntimeResolver.normalizeAsrRuntimeVersion, normalizeAsrRuntimeVersion);
});
