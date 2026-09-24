import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectListeningPortPids,
  probeTcpPortAvailable,
  __startupPortInspectorForTest,
} from './startupPortInspector.js';

const { parseWindowsNetstatPids } = __startupPortInspectorForTest;

const NETSTAT_OUTPUT = [
  'Active Connections',
  '',
  '  Proto  Local Address          Foreign Address        State           PID',
  '  TCP    0.0.0.0:8777           0.0.0.0:0              LISTENING       4123',
  '  TCP    0.0.0.0:8777           127.0.0.1:52344        ESTABLISHED     4123',
  '  TCP    [::]:8777              [::]:0                 LISTENING       5150',
  '  TCP    127.0.0.1:87770        0.0.0.0:0              LISTENING       6161',
  '  TCP    0.0.0.0:9999           0.0.0.0:0              LISTENING       4123',
  '  TCP    0.0.0.0:8777           0.0.0.0:0              LISTENING       4123',
  '  TCP    0.0.0.0:8777           not-enough-columns',
  '',
  '  UDP    0.0.0.0:8777           *:*                                   7171',
].join('\r\n');

test('parseWindowsNetstatPids keeps only LISTENING rows bound to the requested port', () => {
  assert.deepEqual(parseWindowsNetstatPids(NETSTAT_OUTPUT, '8777', 9999), [4123, 5150]);
});

test('parseWindowsNetstatPids drops the current process and malformed rows', () => {
  const rows = [
    '  TCP    0.0.0.0:8777           0.0.0.0:0              LISTENING       4123',
    '  TCP    0.0.0.0:8777           0.0.0.0:0              LISTENING       0',
    '  TCP    0.0.0.0:8777           0.0.0.0:0              LISTENING       not-a-pid',
  ].join('\n');
  assert.deepEqual(parseWindowsNetstatPids(rows, '8777', 4123), []);
});

test('parseWindowsNetstatPids accepts an empty or missing enumeration payload', () => {
  assert.deepEqual(parseWindowsNetstatPids('', '8777', 1), []);
  assert.deepEqual(parseWindowsNetstatPids(null, '8777', 1), []);
});

test('collectListeningPortPids resolves the Windows netstat tool and parses its output', () => {
  const calls = [];
  const pids = collectListeningPortPids('8777', {
    platform: 'win32',
    env: { SystemRoot: 'C:\\Windows' },
    processId: 9999,
    execFileSyncFn: (command, args, options) => {
      calls.push({ command, args, options });
      return NETSTAT_OUTPUT;
    },
  });
  assert.deepEqual(pids, [4123, 5150]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, 'C:\\Windows\\System32\\netstat.exe');
  assert.deepEqual(calls[0].args, ['-ano', '-p', 'tcp']);
  assert.deepEqual(calls[0].options, { encoding: 'utf8', windowsHide: true });
});

test('collectListeningPortPids falls back to the bare netstat name without a Windows root', () => {
  const commands = [];
  collectListeningPortPids('8777', {
    platform: 'win32',
    env: {},
    processId: 1,
    execFileSyncFn: (command) => {
      commands.push(command);
      return '';
    },
  });
  assert.deepEqual(commands, ['netstat.exe']);
});

test('collectListeningPortPids parses lsof output on non-Windows platforms', () => {
  const calls = [];
  const pids = collectListeningPortPids('8777', {
    platform: 'linux',
    processId: 42,
    execFileSyncFn: (command, args, options) => {
      calls.push({ command, args, options });
      return '4123\n5150\n42\n\nnot-a-pid\n';
    },
  });
  assert.deepEqual(pids, [4123, 5150]);
  assert.deepEqual(calls[0], {
    command: 'lsof',
    args: ['-nP', '-iTCP:8777', '-sTCP:LISTEN', '-t'],
    options: { encoding: 'utf8', windowsHide: true },
  });
});

test('collectListeningPortPids treats an lsof exit status of 1 as an empty listener set', () => {
  const pids = collectListeningPortPids('8777', {
    platform: 'darwin',
    processId: 42,
    execFileSyncFn: () => {
      const error = new Error('lsof exited with 1');
      error.status = 1;
      throw error;
    },
  });
  assert.deepEqual(pids, []);
});

test('collectListeningPortPids maps other enumeration failures to a typed error', () => {
  let error = null;
  try {
    collectListeningPortPids('8777', {
      platform: 'darwin',
      processId: 42,
      execFileSyncFn: () => {
        const failure = new Error('spawn lsof ENOENT');
        failure.code = 'ENOENT';
        failure.status = 127;
        failure.syscall = 'spawnSync lsof';
        throw failure;
      },
    });
  } catch (caught) {
    error = caught;
  }
  assert.equal(error?.code, 'AIC_STARTUP_PORT_ENUMERATION_FAILED');
  assert.match(error.message, /^Failed to inspect listeners on port 8777$/);
  assert.equal(error.details.port, '8777');
  assert.equal(error.details.command, 'lsof');
  assert.equal(error.details.failure.code, 'ENOENT');
  assert.equal(error.details.failure.status, 127);
  assert.equal(error.details.failure.syscall, 'spawnSync lsof');
  assert.match(error.cause.message, /spawn lsof ENOENT/);
});

test('collectListeningPortPids does not swallow Windows enumeration failures', () => {
  let error = null;
  try {
    collectListeningPortPids('8777', {
      platform: 'win32',
      env: { SystemRoot: 'C:\\Windows' },
      processId: 42,
      execFileSyncFn: () => {
        const failure = new Error('netstat exited with 1');
        failure.status = 1;
        throw failure;
      },
    });
  } catch (caught) {
    error = caught;
  }
  assert.equal(error?.code, 'AIC_STARTUP_PORT_ENUMERATION_FAILED');
  assert.equal(error.details.command, 'C:\\Windows\\System32\\netstat.exe');
});

function createServerStub({ onListen = null, throwOnListen = null } = {}) {
  const handlers = new Map();
  const server = {
    closeError: null,
    listenCalls: [],
    closeCalls: 0,
    unrefCalls: 0,
    once(event, handler) {
      handlers.set(event, handler);
      return server;
    },
    listen(options, callback) {
      server.listenCalls.push(options);
      if (throwOnListen) throw throwOnListen;
      onListen?.({
        options: options,
        callback: callback,
        emit: (event, payload) => handlers.get(event)?.(payload),
      });
      return server;
    },
    close(callback) {
      server.closeCalls += 1;
      callback(server.closeError);
      return server;
    },
    unref() {
      server.unrefCalls += 1;
    },
  };
  return server;
}

test('probeTcpPortAvailable resolves true for a free port and releases the probe socket', async () => {
  let server = null;
  const result = await probeTcpPortAvailable({
    port: 8777,
    createServerFn: () => {
      server = createServerStub({ onListen: ({ callback }) => callback() });
      return server;
    },
  });
  assert.equal(result, true);
  assert.deepEqual(server.listenCalls, [{ host: '127.0.0.1', port: 8777, exclusive: true }]);
  assert.equal(server.closeCalls, 1);
  assert.equal(server.unrefCalls, 1);
});

test('probeTcpPortAvailable resolves false when the port is already in use', async () => {
  const result = await probeTcpPortAvailable({
    port: 8777,
    createServerFn: () =>
      createServerStub({
        onListen: ({ emit }) => emit('error', Object.assign(new Error('busy'), { code: 'EADDRINUSE' })),
      }),
  });
  assert.equal(result, false);
});

test('probeTcpPortAvailable rejects for unexpected listen errors', async () => {
  const failure = Object.assign(new Error('permission denied'), { code: 'EACCES' });
  await assert.rejects(
    probeTcpPortAvailable({
      port: 8777,
      createServerFn: () => createServerStub({ onListen: ({ emit }) => emit('error', failure) }),
    }),
    (error) => error === failure,
  );
});

test('probeTcpPortAvailable rejects when the probe socket cannot close', async () => {
  const closeError = new Error('close failed');
  await assert.rejects(
    probeTcpPortAvailable({
      port: 8777,
      createServerFn: () => {
        const server = createServerStub({ onListen: ({ callback }) => callback() });
        server.closeError = closeError;
        return server;
      },
    }),
    (error) => error === closeError,
  );
});

test('probeTcpPortAvailable rejects synchronously thrown listen errors', async () => {
  const listenError = new Error('cannot listen');
  await assert.rejects(
    probeTcpPortAvailable({
      port: 8777,
      createServerFn: () => createServerStub({ throwOnListen: listenError }),
    }),
    (error) => error === listenError,
  );
});

test('probeTcpPortAvailable settles exactly once even if the socket reports twice', async () => {
  let server = null;
  const result = await probeTcpPortAvailable({
    port: 8777,
    createServerFn: () => {
      server = createServerStub({
        onListen: ({ callback, emit }) => {
          emit('error', Object.assign(new Error('busy'), { code: 'EADDRINUSE' }));
          callback();
        },
      });
      return server;
    },
  });
  assert.equal(result, false);
  assert.equal(server.closeCalls, 1);
});
