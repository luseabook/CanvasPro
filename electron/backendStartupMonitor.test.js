import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackendStartupMonitor, launchMonitoredBackendProcess } from './backendStartupMonitor.js';

function createFakeChild() {
  const handlers = new Map();
  const child = {
    exitCode: null,
    signalCode: null,
    killed: false,
    stdout: { piped: [], pipe: (target, options) => child.stdout.piped.push([target, options]) },
    stderr: { piped: [], pipe: (target, options) => child.stderr.piped.push([target, options]) },
    once: (event, handler) => {
      handlers.set(event, handler);
    },
  };
  return {
    child: child,
    emit(event, ...args) {
      const handler = handlers.get(event);
      if (handler) handler(...args);
    },
    has(event) {
      return handlers.has(event);
    },
  };
}

function createFakeLogStream() {
  const calls = [];
  return {
    calls: calls,
    end: () => calls.push('end'),
  };
}

test('createBackendStartupMonitor requires a child emitting once', () => {
  assert.throws(() => createBackendStartupMonitor(), TypeError);
  assert.throws(() => createBackendStartupMonitor({ child: {} }), /Backend child process is required/);
});

test('createBackendStartupMonitor subscribes to error/exit/close and exposes failure/markReady', () => {
  const fake = createFakeChild();
  const monitor = createBackendStartupMonitor({ child: fake.child });
  assert.equal(fake.has('error'), true);
  assert.equal(fake.has('exit'), true);
  assert.equal(fake.has('close'), true);
  assert.equal(typeof monitor.markReady, 'function');
  assert.equal(monitor.failure instanceof Promise, true);
  monitor.failure.catch(() => {});
});

test('a spawn error rejects the failure promise and notifies onError', async () => {
  const fake = createFakeChild();
  const seen = [];
  const thrown = new Error('spawn ENOENT');
  const monitor = createBackendStartupMonitor({
    child: fake.child,
    onError: (error) => seen.push(error),
  });
  fake.emit('error', thrown);
  await assert.rejects(
    () => monitor.failure,
    (error) =>
      error['code'] === 'BACKEND_SPAWN_ERROR' &&
      error['cause'] === thrown &&
      /Failed to spawn local backend: spawn ENOENT/.test(error.message),
  );
  assert.deepEqual(seen, [thrown]);
});

test('an early exit rejects with BACKEND_EXITED_BEFORE_READY and forwards onExit', async () => {
  const fake = createFakeChild();
  const seen = [];
  const monitor = createBackendStartupMonitor({
    child: fake.child,
    onExit: (code, signal) => seen.push([code, signal]),
  });
  fake.emit('exit', 3, 'SIGKILL');
  await assert.rejects(
    () => monitor.failure,
    (error) =>
      error['code'] === 'BACKEND_EXITED_BEFORE_READY' &&
      error['details']['exitCode'] === 3 &&
      error['details']['signal'] === 'SIGKILL' &&
      /code=3, signal=SIGKILL/.test(error.message),
  );
  assert.deepEqual(seen, [[3, 'SIGKILL']]);
});

test('markReady keeps the failure promise pending across a later error', () => {
  const fake = createFakeChild();
  const seen = [];
  const monitor = createBackendStartupMonitor({
    child: fake.child,
    onError: (error) => seen.push(error),
  });
  monitor.markReady();
  fake.emit('error', new Error('late crash'));
  monitor.failure.catch(() => {});
  assert.deepEqual(seen, []);
});

test('markReady keeps the failure promise pending across a later exit but still forwards onExit', () => {
  const fake = createFakeChild();
  const seen = [];
  const monitor = createBackendStartupMonitor({
    child: fake.child,
    onExit: (code, signal) => seen.push([code, signal]),
  });
  monitor.markReady();
  fake.emit('exit', 0, null);
  monitor.failure.catch(() => {});
  assert.deepEqual(seen, [[0, null]]);
});

test('the failure settles on the first error and ignores a later exit', async () => {
  const fake = createFakeChild();
  const exits = [];
  const monitor = createBackendStartupMonitor({
    child: fake.child,
    onExit: (code, signal) => exits.push([code, signal]),
  });
  fake.emit('error', new Error('first'));
  fake.emit('exit', 1, null);
  await assert.rejects(
    () => monitor.failure,
    (error) => /Failed to spawn local backend: first/.test(error.message),
  );
  assert.deepEqual(exits, [[1, null]]);
});

test('a close event notifies onClose without settling the failure', () => {
  const fake = createFakeChild();
  const seen = [];
  const monitor = createBackendStartupMonitor({
    child: fake.child,
    onClose: (code, signal) => seen.push([code, signal]),
  });
  fake.emit('close', 0, null);
  monitor.failure.catch(() => {});
  assert.deepEqual(seen, [[0, null]]);
});

test('missing callbacks never throw', () => {
  const fake = createFakeChild();
  const monitor = createBackendStartupMonitor({ child: fake.child });
  monitor.failure.catch(() => {});
  assert.doesNotThrow(() => {
    fake.emit('error', new Error('x'));
    fake.emit('exit', 1, null);
    fake.emit('close', 1, null);
  });
});

test('launchMonitoredBackendProcess requires a spawn function', () => {
  assert.throws(() => launchMonitoredBackendProcess(), TypeError);
  assert.throws(
    () => launchMonitoredBackendProcess({ command: 'py', spawnProcess: 'nope' }),
    /Backend process launcher is required/,
  );
});

test('launchMonitoredBackendProcess pipes stdout and stderr without ending the stream', () => {
  const fake = createFakeChild();
  const logStream = createFakeLogStream();
  const spawned = [];
  const launched = launchMonitoredBackendProcess({
    spawnProcess: (command, args, options) => {
      spawned.push([command, args, options]);
      return fake.child;
    },
    command: 'py',
    args: ['-3', 'server.py'],
    options: { cwd: '/tmp' },
    logStream: logStream,
  });
  launched.failure.catch(() => {});
  assert.deepEqual(spawned, [['py', ['-3', 'server.py'], { cwd: '/tmp' }]]);
  assert.deepEqual(fake.child.stdout.piped, [[logStream, { end: false }]]);
  assert.deepEqual(fake.child.stderr.piped, [[logStream, { end: false }]]);
  assert.equal(launched.child, fake.child);
  assert.equal(typeof launched.markReady, 'function');
  assert.equal(typeof launched.closeLog, 'function');
});

test('launchMonitoredBackendProcess skips piping when no log stream is given', () => {
  const fake = createFakeChild();
  const launched = launchMonitoredBackendProcess({
    spawnProcess: () => fake.child,
    command: 'py',
  });
  launched.failure.catch(() => {});
  assert.deepEqual(fake.child.stdout.piped, []);
  assert.deepEqual(fake.child.stderr.piped, []);
});

test('launchMonitoredBackendProcess maps a synchronous spawn throw', () => {
  const logStream = createFakeLogStream();
  const seen = [];
  const thrown = new Error('EACCES');
  assert.throws(
    () =>
      launchMonitoredBackendProcess({
        spawnProcess: () => {
          throw thrown;
        },
        command: 'py',
        logStream: logStream,
        onSpawnError: (error) => seen.push(error),
      }),
    (error) =>
      error['code'] === 'BACKEND_SPAWN_ERROR' &&
      error['cause'] === thrown &&
      /Failed to spawn local backend: EACCES/.test(error.message),
  );
  assert.deepEqual(seen, [thrown]);
  assert.deepEqual(logStream.calls, ['end']);
});

test('launchMonitoredBackendProcess maps an asynchronous spawn error and closes the log once', async () => {
  const fake = createFakeChild();
  const logStream = createFakeLogStream();
  const seen = [];
  const launched = launchMonitoredBackendProcess({
    spawnProcess: () => fake.child,
    command: 'py',
    logStream: logStream,
    onSpawnError: (error) => seen.push(error),
  });
  fake.emit('error', new Error('boom'));
  fake.emit('close', 1, null);
  await assert.rejects(
    () => launched.failure,
    (error) => error['code'] === 'BACKEND_SPAWN_ERROR',
  );
  assert.equal(seen.length, 1);
  assert.deepEqual(logStream.calls, ['end']);
});

test('launchMonitoredBackendProcess suppresses onExit after a spawn error', () => {
  const fake = createFakeChild();
  const exits = [];
  const launched = launchMonitoredBackendProcess({
    spawnProcess: () => fake.child,
    command: 'py',
    onExit: (code, signal) => exits.push([code, signal]),
  });
  launched.failure.catch(() => {});
  fake.emit('error', new Error('boom'));
  fake.emit('exit', 1, null);
  assert.deepEqual(exits, []);
});

test('launchMonitoredBackendProcess forwards onExit for a clean run', () => {
  const fake = createFakeChild();
  const exits = [];
  const launched = launchMonitoredBackendProcess({
    spawnProcess: () => fake.child,
    command: 'py',
    onExit: (code, signal) => exits.push([code, signal]),
  });
  launched.failure.catch(() => {});
  fake.emit('exit', 0, null);
  assert.deepEqual(exits, [[0, null]]);
});

test('launchMonitoredBackendProcess closeLog is idempotent', () => {
  const fake = createFakeChild();
  const logStream = createFakeLogStream();
  const launched = launchMonitoredBackendProcess({
    spawnProcess: () => fake.child,
    command: 'py',
    logStream: logStream,
  });
  launched.failure.catch(() => {});
  launched.closeLog();
  launched.closeLog();
  fake.emit('close', 0, null);
  assert.deepEqual(logStream.calls, ['end']);
});

test('launchMonitoredBackendProcess markReady keeps the failure pending', async () => {
  const fake = createFakeChild();
  const launched = launchMonitoredBackendProcess({
    spawnProcess: () => fake.child,
    command: 'py',
  });
  launched.markReady();
  fake.emit('error', new Error('late'));
  let settled = false;
  launched.failure.then(
    () => {
      settled = true;
    },
    () => {
      settled = true;
    },
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(settled, false);
});
