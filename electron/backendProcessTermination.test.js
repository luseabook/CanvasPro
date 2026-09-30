import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stopSpawnedServerProcess,
  terminateProcessTree,
} from './backendProcessTermination.js';

test('terminateProcessTree force-kills the complete Windows process tree', () => {
  const calls = [];
  terminateProcessTree(4123, {
    platform: 'win32',
    force: true,
    resolveTaskkill: () => 'C:\\Windows\\System32\\taskkill.exe',
    execFileSync: (command, args, options) => calls.push({ command, args, options }),
  });

  assert.deepEqual(calls, [
    {
      command: 'C:\\Windows\\System32\\taskkill.exe',
      args: ['/PID', '4123', '/T', '/F'],
      options: { stdio: 'ignore', windowsHide: true },
    },
  ]);
});

test('stopSpawnedServerProcess terminates the spawned backend tree and reports success', () => {
  const calls = [];
  const stopped = stopSpawnedServerProcess(
    { pid: 9876 },
    {
      platform: 'win32',
      terminate: (pid, options) => calls.push({ pid, options }),
    },
  );

  assert.equal(stopped, true);
  assert.deepEqual(calls, [{ pid: 9876, options: { force: true } }]);
});

test('stopSpawnedServerProcess falls back to child.kill when no pid is available', () => {
  const calls = [];
  const stopped = stopSpawnedServerProcess({
    pid: undefined,
    kill: () => calls.push('kill'),
  });

  assert.equal(stopped, true);
  assert.deepEqual(calls, ['kill']);
});

test('stopSpawnedServerProcess retries with child.kill when taskkill fails', () => {
  const calls = [];
  const stopped = stopSpawnedServerProcess(
    {
      pid: 4321,
      kill: () => calls.push('kill'),
    },
    {
      platform: 'win32',
      terminate: () => {
        throw new Error('taskkill failed');
      },
    },
  );

  assert.equal(stopped, true);
  assert.deepEqual(calls, ['kill']);
});
