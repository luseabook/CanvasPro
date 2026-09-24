import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isExpectedBackendProcess,
  inspectBackendProcesses,
  findVerifiedBackendProcessPids,
  __backendProcessIdentityForTest,
} from './backendProcessIdentity.js';

const { WINDOWS_PROCESS_QUERY_SCRIPT, normalizeExecutablePath } = __backendProcessIdentityForTest;
const PID_ENV_NAME = 'AIC_BACKEND_IDENTITY_PIDS_BASE64';

function windowsRow({ pid, executablePath, commandLine }) {
  return { pid: pid, executablePath: executablePath, commandLine: commandLine };
}

test('isExpectedBackendProcess accepts a source run python backend', () => {
  assert.equal(
    isExpectedBackendProcess(
      {
        executablePath: '/usr/bin/python3',
        commandLine: 'python3 /app/server.py --host=127.0.0.1 --port=8777',
      },
      {
        appIsPackaged: false,
        appRoot: '/app',
        backendCommand: 'python3',
        host: '127.0.0.1',
        port: 8777,
        platform: 'linux',
      },
    ),
    true,
  );
});

test('isExpectedBackendProcess rejects a source run with an unexpected executable basename', () => {
  assert.equal(
    isExpectedBackendProcess(
      { executablePath: '/usr/bin/node', commandLine: 'node /app/server.py --host=127.0.0.1 --port=8777' },
      {
        appIsPackaged: false,
        appRoot: '/app',
        backendCommand: 'python3',
        host: '127.0.0.1',
        port: 8777,
        platform: 'linux',
      },
    ),
    false,
  );
});

test('isExpectedBackendProcess requires an absolute python command to match exactly', () => {
  const expectations = {
    appIsPackaged: false,
    appRoot: '/app',
    backendCommand: '/app/venv/bin/python3',
    host: '127.0.0.1',
    port: 8777,
    platform: 'linux',
  };
  assert.equal(
    isExpectedBackendProcess(
      {
        executablePath: '/app/venv/bin/python3',
        commandLine: '/app/venv/bin/python3 /app/server.py --host=127.0.0.1 --port=8777',
      },
      expectations,
    ),
    true,
  );
  assert.equal(
    isExpectedBackendProcess(
      {
        executablePath: '/usr/bin/python3',
        commandLine: '/usr/bin/python3 /app/server.py --host=127.0.0.1 --port=8777',
      },
      expectations,
    ),
    false,
  );
});

test('isExpectedBackendProcess accepts the bare server.py fallback for a source run', () => {
  assert.equal(
    isExpectedBackendProcess(
      { executablePath: 'python', commandLine: 'python server.py --host=127.0.0.1 --port=8777' },
      {
        appIsPackaged: false,
        appRoot: '/app',
        backendCommand: 'python',
        host: '127.0.0.1',
        port: 8777,
        platform: 'linux',
      },
    ),
    true,
  );
});

test('isExpectedBackendProcess matches the packaged Windows binary exactly', () => {
  const expectations = {
    appIsPackaged: true,
    appRoot: 'C:\\app',
    backendCommand: 'C:\\rt\\backend\\aicanvas-backend.exe',
    host: '127.0.0.1',
    port: 8777,
    platform: 'win32',
  };
  assert.equal(
    isExpectedBackendProcess(
      {
        executablePath: 'C:\\rt\\backend\\aicanvas-backend.exe',
        commandLine: 'C:\\rt\\backend\\aicanvas-backend.exe --host=127.0.0.1 --port=8777',
      },
      expectations,
    ),
    true,
  );
  assert.equal(
    isExpectedBackendProcess(
      {
        executablePath: 'C:\\other\\aicanvas-backend.exe',
        commandLine: 'C:\\other\\aicanvas-backend.exe --host=127.0.0.1 --port=8777',
      },
      expectations,
    ),
    false,
  );
});

test('isExpectedBackendProcess lets a packaged mac build match through the command line', () => {
  assert.equal(
    isExpectedBackendProcess(
      { executablePath: '', commandLine: '/rt/backend/aicanvas-backend --host=127.0.0.1 --port=8777' },
      {
        appIsPackaged: true,
        appRoot: '/app',
        backendCommand: '/rt/backend/aicanvas-backend',
        host: '127.0.0.1',
        port: 8777,
        platform: 'darwin',
      },
    ),
    true,
  );
});

test('isExpectedBackendProcess normalizes quoted Windows executable paths', () => {
  assert.equal(
    normalizeExecutablePath('"C:\\rt\\backend\\aicanvas-backend.exe"', 'win32'),
    'c:\\rt\\backend\\aicanvas-backend.exe',
  );
  assert.equal(normalizeExecutablePath('"/rt/Backend/AICanvas"', 'darwin'), '/rt/Backend/AICanvas');
});

test('isExpectedBackendProcess rejects rows without the launch arguments', () => {
  const expectations = {
    appIsPackaged: false,
    appRoot: '/app',
    backendCommand: 'python3',
    host: '127.0.0.1',
    port: 8777,
    platform: 'linux',
  };
  assert.equal(
    isExpectedBackendProcess(
      { executablePath: 'python3', commandLine: 'python3 /app/server.py --host=127.0.0.1' },
      expectations,
    ),
    false,
  );
  assert.equal(
    isExpectedBackendProcess(
      { executablePath: 'python3', commandLine: 'python3 /app/server.py --port=8777' },
      expectations,
    ),
    false,
  );
  assert.equal(
    isExpectedBackendProcess(
      { executablePath: 'python3', commandLine: '/app/server.py --host=127.0.0.1 --port=8777' },
      { ...expectations, backendCommand: '' },
    ),
    false,
  );
  assert.equal(isExpectedBackendProcess({ executablePath: '', commandLine: '' }, expectations), false);
});

test('inspectBackendProcesses returns nothing without pids and never spawns', () => {
  let spawned = 0;
  assert.deepEqual(
    inspectBackendProcesses({
      pids: [],
      platform: 'win32',
      spawnProcess: () => {
        spawned += 1;
      },
    }),
    [],
  );
  assert.equal(spawned, 0);
});

test('inspectBackendProcesses decodes the Windows PowerShell identity payload', () => {
  const rows = [
    windowsRow({
      pid: 4123,
      executablePath: 'C:\\rt\\backend\\aicanvas-backend.exe',
      commandLine: 'C:\\rt\\backend\\aicanvas-backend.exe --host=127.0.0.1 --port=8777',
    }),
  ];
  const calls = [];
  const result = inspectBackendProcesses({
    pids: ['4123', 4123, -1],
    platform: 'win32',
    env: { SystemRoot: 'C:\\Windows' },
    spawnProcess: (command, args, options) => {
      calls.push({ command: command, args: args, options: options });
      return { status: 0, stdout: Buffer.from(JSON.stringify(rows), 'utf8').toString('base64'), stderr: '' };
    },
  });
  assert.deepEqual(result, rows);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
  assert.deepEqual(calls[0].args, [
    '-NoLogo',
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    WINDOWS_PROCESS_QUERY_SCRIPT,
  ]);
  assert.equal(calls[0].options.timeout, 5000);
  assert.equal(calls[0].options.windowsHide, true);
  assert.equal(calls[0].options.env.SystemRoot, 'C:\\Windows');
  assert.equal(calls[0].options.env[PID_ENV_NAME], Buffer.from('[4123]', 'utf8').toString('base64'));
});

test('inspectBackendProcesses ignores a Windows payload that is not an array', () => {
  const result = inspectBackendProcesses({
    pids: [4123],
    platform: 'win32',
    env: {},
    spawnProcess: () => ({ status: 0, stdout: Buffer.from('{"pid":4123}', 'utf8').toString('base64') }),
  });
  assert.deepEqual(result, []);
});

test('inspectBackendProcesses reports Windows process query failures', () => {
  assert.throws(
    () =>
      inspectBackendProcesses({
        pids: [4123],
        platform: 'win32',
        env: { SystemRoot: 'C:\\Windows' },
        spawnProcess: () => ({ status: 1, stdout: '', stderr: 'denied' }),
      }),
    (error) => {
      assert.equal(error.code, 'AIC_STARTUP_PORT_IDENTITY_CHECK_FAILED');
      assert.match(error.message, /^Failed to inspect Windows processes that own the startup port$/);
      assert.equal(error.details.command, 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
      assert.equal(error.details.failure.status, 1);
      assert.equal(error.details.failure.stderr, 'denied');
      return true;
    },
  );
});

test('inspectBackendProcesses maps a thrown Windows spawn to an identity error', () => {
  const spawnFailure = Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' });
  assert.throws(
    () =>
      inspectBackendProcesses({
        pids: [4123],
        platform: 'win32',
        env: {},
        spawnProcess: () => {
          throw spawnFailure;
        },
      }),
    (error) => {
      assert.equal(error.code, 'AIC_STARTUP_PORT_IDENTITY_CHECK_FAILED');
      assert.equal(error.cause, spawnFailure);
      assert.equal(error.details.command, 'powershell.exe');
      assert.equal(error.details.failure.code, 'ENOENT');
      return true;
    },
  );
});

test('inspectBackendProcesses rejects a malformed Windows identity payload', () => {
  assert.throws(
    () =>
      inspectBackendProcesses({
        pids: [4123],
        platform: 'win32',
        env: {},
        spawnProcess: () => ({ status: 0, stdout: 'not-base64-json' }),
      }),
    (error) => {
      assert.equal(error.code, 'AIC_STARTUP_PORT_IDENTITY_CHECK_FAILED');
      assert.equal(error.message, 'Windows process identity output was invalid');
      return true;
    },
  );
});

test('inspectBackendProcesses queries posix processes one by one', () => {
  const calls = [];
  const result = inspectBackendProcesses({
    pids: [4123, 5150],
    platform: 'linux',
    spawnProcess: (command, args, options) => {
      calls.push({ command: command, args: args, options: options });
      return { status: 0, stdout: 'python /app/server.py --host=127.0.0.1 --port=8777\n' };
    },
  });
  assert.deepEqual(calls, [
    {
      command: 'ps',
      args: ['-p', '4123', '-o', 'comm=', '-o', 'args='],
      options: { encoding: 'utf8', timeout: 5000 },
    },
    {
      command: 'ps',
      args: ['-p', '5150', '-o', 'comm=', '-o', 'args='],
      options: { encoding: 'utf8', timeout: 5000 },
    },
  ]);
  assert.deepEqual(result, [
    { pid: 4123, executablePath: '', commandLine: 'python /app/server.py --host=127.0.0.1 --port=8777' },
    { pid: 5150, executablePath: '', commandLine: 'python /app/server.py --host=127.0.0.1 --port=8777' },
  ]);
});

test('inspectBackendProcesses skips posix pids that have already exited', () => {
  const result = inspectBackendProcesses({
    pids: [4123, 5150],
    platform: 'darwin',
    spawnProcess: () => ({ status: 1, stdout: '' }),
  });
  assert.deepEqual(result, []);
});

test('inspectBackendProcesses reports posix query failures with the offending pid', () => {
  assert.throws(
    () =>
      inspectBackendProcesses({
        pids: [4123],
        platform: 'darwin',
        spawnProcess: () => ({ status: 2, stderr: 'ps: illegal option' }),
      }),
    (error) => {
      assert.equal(error.code, 'AIC_STARTUP_PORT_IDENTITY_CHECK_FAILED');
      assert.equal(error.message, 'Failed to inspect process 4123 that owns the startup port');
      return true;
    },
  );
});

test('findVerifiedBackendProcessPids keeps only requested and expected processes', () => {
  const inspected = [];
  const result = findVerifiedBackendProcessPids({
    pids: ['4123', 4123, '5150', '6161'],
    appIsPackaged: false,
    appRoot: '/app',
    backendCommand: 'python3',
    host: '127.0.0.1',
    port: 8777,
    platform: 'linux',
    inspectProcesses: (pids) => {
      inspected.push(pids);
      return [
        {
          pid: 4123,
          executablePath: '/usr/bin/python3',
          commandLine: 'python3 /app/server.py --host=127.0.0.1 --port=8777',
        },
        {
          pid: 5150,
          executablePath: '/usr/bin/node',
          commandLine: 'node /app/server.py --host=127.0.0.1 --port=8777',
        },
        {
          pid: 6161,
          executablePath: '/usr/bin/python3',
          commandLine: 'python3 /app/server.py --host=127.0.0.1 --port=8777',
        },
        {
          pid: 9999,
          executablePath: '/usr/bin/python3',
          commandLine: 'python3 /app/server.py --host=127.0.0.1 --port=8777',
        },
      ];
    },
  });
  assert.deepEqual(inspected, [[4123, 5150, 6161]]);
  assert.deepEqual(result, [4123, 6161]);
});

test('findVerifiedBackendProcessPids short circuits an empty request without inspecting', () => {
  let inspected = 0;
  const result = findVerifiedBackendProcessPids({
    pids: [],
    inspectProcesses: () => {
      inspected += 1;
      return [];
    },
  });
  assert.deepEqual(result, []);
  assert.equal(inspected, 1);
});
