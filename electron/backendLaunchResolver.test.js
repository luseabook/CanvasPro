import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { resolveBackendLaunchSpec, resolveNativeBackendExecutable } from './backendLaunchResolver.js';

test('resolveNativeBackendExecutable picks the platform specific binary name', () => {
  assert.equal(
    resolveNativeBackendExecutable({ runtimeRoot: '/rt', platform: 'linux' }),
    path.join('/rt', 'backend', 'aicanvas-backend'),
  );
  assert.equal(
    resolveNativeBackendExecutable({ runtimeRoot: 'C:\\rt', platform: 'win32' }),
    'C:\\rt\\backend\\aicanvas-backend.exe',
  );
});

test('resolveBackendLaunchSpec returns the python source spec when the app is not packaged', () => {
  const spec = resolveBackendLaunchSpec({
    appIsPackaged: false,
    appRoot: '/app',
    runtimeRoot: '/rt',
    platform: 'linux',
    existsSync: () => false,
    pythonCommand: '/app/venv/bin/python3',
  });
  assert.deepEqual(spec, {
    kind: 'python-source',
    command: '/app/venv/bin/python3',
    args: ['server.py'],
    cwd: '/app',
  });
});

test('resolveBackendLaunchSpec returns the native backend spec when it exists on disk', () => {
  const probed = [];
  const spec = resolveBackendLaunchSpec({
    appIsPackaged: true,
    appRoot: '/app',
    runtimeRoot: '/rt',
    platform: 'linux',
    existsSync: (candidate) => {
      probed.push(candidate);
      return true;
    },
    pythonCommand: '/app/venv/bin/python3',
  });
  assert.deepEqual(probed, [path.join('/rt', 'backend', 'aicanvas-backend')]);
  assert.deepEqual(spec, {
    kind: 'native-backend',
    command: path.join('/rt', 'backend', 'aicanvas-backend'),
    args: [],
    cwd: '/app',
  });
});

test('resolveBackendLaunchSpec refuses a packaged build without the native backend', () => {
  assert.throws(
    () =>
      resolveBackendLaunchSpec({
        appIsPackaged: true,
        appRoot: 'C:\\app',
        runtimeRoot: 'C:\\rt',
        platform: 'win32',
        existsSync: () => false,
        pythonCommand: 'python',
      }),
    (error) => {
      assert.equal(
        error.message,
        'Packaged backend executable is missing: C:\\rt\\backend\\aicanvas-backend.exe. Rebuild the native backend before packaging.',
      );
      return true;
    },
  );
});
