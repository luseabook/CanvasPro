import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import {
  MediaTaskQueue,
  MediaTaskCancelledError,
  MediaTaskProcessTimeoutError,
  createProcessStartError,
  __parseFfmpegTimeSecondsForTest,
} from './mediaTaskQueue.js';

const ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,255}$/;
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function waitFor(predicate, label = 'condition') {
  for (let i = 0; i < 200; i += 1) {
    if (predicate()) return;
    await tick();
  }
  throw new Error('Timed out waiting for ' + label);
}

function createSpawnDouble() {
  const calls = [];
  const impl = (command, args, options) => {
    const child = new EventEmitter();
    child.command = command;
    child.args = args;
    child.options = options;
    child.killed = false;
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.stdin = {
      ended: undefined,
      end(value) {
        this.ended = value;
      },
    };
    child.kill = () => {
      child.killed = true;
    };
    calls.push({ command, args, options, child });
    return child;
  };
  return { impl, calls };
}

test('enqueue rejects a missing kind and an unregistered kind', () => {
  const queue = new MediaTaskQueue();
  assert.throws(() => queue.enqueue({}), { message: 'Missing media task kind' });
  assert.throws(() => queue.enqueue({ kind: 'ghost' }), {
    message: 'Unsupported media task kind: ghost',
  });
});

test('enqueue generates a valid task ID and reports the initial snapshot', () => {
  const queue = new MediaTaskQueue({ concurrency: 2 });
  queue.setHandler('demo', () => new Promise(() => {}));
  const snapshot = queue.enqueue({ kind: 'demo', nodeId: 'n1', assetId: 'a1' });
  assert.match(snapshot.taskId, ID_RE);
  assert.match(snapshot.taskId, /^media-task-/);
  assert.equal(snapshot.nodeId, 'n1');
  assert.equal(snapshot.assetId, 'a1');
  assert.equal(snapshot.kind, 'demo');
  assert.equal(snapshot.status, 'processing');
  assert.equal(snapshot.progress, 0.01);
});

test('enqueue refuses an invalid or duplicated caller supplied ID', () => {
  const queue = new MediaTaskQueue();
  queue.setHandler('demo', () => new Promise(() => {}));
  assert.throws(() => queue.enqueue({ kind: 'demo', taskId: ' has space' }), {
    message: 'Invalid media task ID',
  });
  assert.throws(() => queue.enqueue({ kind: 'demo', taskId: '-leading-dash' }), {
    message: 'Invalid media task ID',
  });
  queue.enqueue({ kind: 'demo', taskId: 'fixed-1' });
  assert.throws(() => queue.enqueue({ kind: 'demo', taskId: 'fixed-1' }), {
    message: 'Duplicate media task ID; inspect the existing task instead of retrying',
  });
});

test('snapshot exposes purpose, cancellable, priority and stage', () => {
  const queue = new MediaTaskQueue();
  queue.setHandler('demo', () => new Promise(() => {}));
  const snapshot = queue.enqueue({
    kind: 'demo',
    purpose: 'migrate',
    cancellable: true,
    priority: 42,
  });
  assert.equal(snapshot.purpose, 'migrate');
  assert.equal(snapshot.cancellable, true);
  assert.equal(snapshot.priority, 42);
  assert.equal(snapshot.stage, '');
  const plain = queue.enqueue({ kind: 'demo' });
  assert.equal(plain.purpose, '');
  assert.equal(plain.cancellable, false);
  assert.equal(plain.priority, 0);
});

test('priority is normalized and clamped to the documented range', () => {
  const queue = new MediaTaskQueue({ concurrency: 4 });
  queue.setHandler('demo', () => new Promise(() => {}));
  assert.equal(queue.enqueue({ kind: 'demo', priority: 999 }).priority, 100);
  assert.equal(queue.enqueue({ kind: 'demo', priority: -999 }).priority, -100);
  assert.equal(queue.enqueue({ kind: 'demo', priority: 12.9 }).priority, 12);
  assert.equal(queue.enqueue({ kind: 'demo', priority: 'nope' }).priority, 0);
});

test('a higher priority task is dequeued before older waiting tasks', async () => {
  const gates = new Map();
  const queue = new MediaTaskQueue({
    concurrency: 1,
    handlers: {
      demo: (task) => {
        const gate = deferred();
        gates.set(task.taskId, gate);
        return gate.promise;
      },
    },
  });
  const first = queue.enqueue({ kind: 'demo', taskId: 'first' });
  assert.equal(first.status, 'processing');
  queue.enqueue({ kind: 'demo', taskId: 'low', priority: 0 });
  queue.enqueue({ kind: 'demo', taskId: 'high', priority: 7 });
  assert.equal(queue.get('high').status, 'waiting');
  gates.get('first').resolve({});
  await waitFor(() => queue.get('high').status === 'processing', 'high priority dequeue');
  assert.equal(queue.get('low').status, 'waiting');
});

test('migration identity dedupes concurrent tasks and releases after completion', async () => {
  const gates = new Map();
  const queue = new MediaTaskQueue({
    concurrency: 2,
    handlers: {
      demo: (task) => {
        const gate = deferred();
        gates.set(task.taskId, gate);
        return gate.promise;
      },
    },
  });
  const first = queue.enqueue({ kind: 'demo', migrationKey: 'asset-1', purpose: 'migrate' });
  const second = queue.enqueue({ kind: 'demo', migrationKey: 'asset-1', purpose: 'migrate' });
  assert.equal(second.taskId, first.taskId);
  assert.equal(queue.list().length, 1);
  const otherPurpose = queue.enqueue({ kind: 'demo', migrationKey: 'asset-1', purpose: 'other' });
  assert.notEqual(otherPurpose.taskId, first.taskId);
  const withoutKey = queue.enqueue({ kind: 'demo' });
  const withoutKeyAgain = queue.enqueue({ kind: 'demo' });
  assert.notEqual(withoutKeyAgain.taskId, withoutKey.taskId);
  gates.get(first.taskId).resolve({});
  await waitFor(() => queue.get(first.taskId).status === 'complete', 'first completion');
  const afterFinish = queue.enqueue({ kind: 'demo', migrationKey: 'asset-1', purpose: 'migrate' });
  assert.notEqual(afterFinish.taskId, first.taskId);
});

test('cancel reports a missing task', () => {
  const queue = new MediaTaskQueue();
  assert.deepEqual(queue.cancel('nope'), { ok: false, error: 'Task not found' });
});

test('cancel of a waiting task finishes it without starting the handler', async () => {
  const gates = new Map();
  const runs = [];
  const queue = new MediaTaskQueue({
    concurrency: 1,
    handlers: {
      demo: (task) => {
        runs.push(task.taskId);
        const gate = deferred();
        gates.set(task.taskId, gate);
        return gate.promise;
      },
    },
  });
  queue.enqueue({ kind: 'demo', taskId: 'busy' });
  queue.enqueue({ kind: 'demo', taskId: 'queued' });
  const result = queue.cancel('queued');
  assert.equal(result.ok, true);
  assert.equal(result.task.status, 'cancelled');
  assert.equal(result.task.message, 'Cancelled');
  assert.deepEqual(runs, ['busy']);
  gates.get('busy').resolve({});
});

test('cancel of a running task kills the child and settles as cancelled', async () => {
  const spawnDouble = createSpawnDouble();
  const queue = new MediaTaskQueue({
    concurrency: 1,
    spawnImpl: spawnDouble.impl,
    handlers: {
      transcode: (task, q) => q.runProcess(task, 'ffmpeg', ['-i', 'in.mp4'], {}),
    },
  });
  queue.enqueue({ kind: 'transcode', taskId: 'run-1' });
  await waitFor(() => spawnDouble.calls.length === 1, 'spawn');
  const result = queue.cancel('run-1');
  assert.equal(result.ok, true);
  assert.equal(result.task.message, 'Cancelling');
  assert.equal(spawnDouble.calls[0].child.killed, true);
  spawnDouble.calls[0].child.emit('exit', 0, null);
  await waitFor(() => queue.get('run-1').status === 'cancelled', 'cancelled status');
  assert.equal(queue.get('run-1').error, '');
});

test('cancel with onlyIfWaiting skips a started task and a finished task', async () => {
  const gates = new Map();
  const queue = new MediaTaskQueue({
    concurrency: 1,
    handlers: {
      demo: (task) => {
        const gate = deferred();
        gates.set(task.taskId, gate);
        return gate.promise;
      },
    },
  });
  queue.enqueue({ kind: 'demo', taskId: 'run' });
  const started = queue.cancel('run', { onlyIfWaiting: true });
  assert.deepEqual(started, {
    ok: true,
    skipped: true,
    reason: 'task-already-started',
    task: started.task,
  });
  assert.equal(queue.get('run').status, 'processing');
  gates.get('run').resolve({});
  await waitFor(() => queue.get('run').status === 'complete', 'completion');
  const finished = queue.cancel('run', { onlyIfWaiting: true });
  assert.equal(finished.skipped, true);
  assert.equal(finished.reason, 'task-already-finished');
  assert.equal(finished.task.status, 'complete');
});

test('emitProgress updates message and stage and ignores terminal tasks', async () => {
  const gates = new Map();
  const queue = new MediaTaskQueue({
    concurrency: 1,
    handlers: {
      demo: (task) => {
        const gate = deferred();
        gates.set(task.taskId, gate);
        return gate.promise;
      },
    },
  });
  const created = queue.enqueue({ kind: 'demo', taskId: 'p1' });
  const raw = { ...created, status: 'processing' };
  queue.emitProgress(raw, 0.5, 'Halfway', { stage: 'encoding' });
  assert.equal(raw.progress, 0.5);
  assert.equal(raw.message, 'Halfway');
  assert.equal(raw.stage, 'encoding');
  queue.emitProgress(raw, 2, '', { stage: 'done' });
  assert.equal(raw.progress, 1);
  assert.equal(raw.stage, 'done');
  const terminal = { ...created, status: 'complete', progress: 1, message: 'Complete', stage: '' };
  queue.emitProgress(terminal, 0.2, 'ignored', { stage: 'ignored' });
  assert.equal(terminal.progress, 1);
  assert.equal(terminal.message, 'Complete');
  assert.equal(terminal.stage, '');
  gates.get('p1').resolve({});
});

test('onUpdate and onActivity fire in order and onSnapshot observes the raw task', async () => {
  const order = [];
  const observed = [];
  const queue = new MediaTaskQueue({
    concurrency: 1,
    onUpdate: (snapshot) => order.push('update:' + snapshot.status),
    onActivity: (activity) => order.push('activity:' + activity.totalCount),
    onSnapshot: (snapshot, task) => observed.push([snapshot.taskId, task.id, task.status]),
    handlers: { demo: () => Promise.resolve({}) },
  });
  queue.enqueue({ kind: 'demo', taskId: 'obs-1' });
  await waitFor(() => queue.get('obs-1').status === 'complete', 'completion');
  assert.deepEqual(order, [
    'update:waiting',
    'activity:1',
    'update:processing',
    'activity:1',
    'update:complete',
    'activity:0',
  ]);
  assert.deepEqual(observed[observed.length - 1], ['obs-1', 'obs-1', 'complete']);
});

test('a throwing onSnapshot observer does not fail the task', async () => {
  const queue = new MediaTaskQueue({
    concurrency: 1,
    onSnapshot: () => {
      throw new Error('observer exploded');
    },
    handlers: { demo: () => Promise.resolve({ value: 7 }) },
  });
  const created = queue.enqueue({ kind: 'demo', taskId: 'obs-2' });
  assert.equal(created.taskId, 'obs-2');
  await waitFor(() => queue.get('obs-2').status === 'complete', 'completion');
  assert.deepEqual(queue.get('obs-2').result, { value: 7 });
});

test('getActivity reports active, waiting and averaged progress', async () => {
  const gates = new Map();
  const queue = new MediaTaskQueue({
    concurrency: 1,
    handlers: {
      demo: (task, q) => {
        const gate = deferred();
        gates.set(task.taskId, gate);
        q.emitProgress(task, 0.4);
        return gate.promise;
      },
    },
  });
  queue.enqueue({ kind: 'demo', taskId: 'a1' });
  queue.enqueue({ kind: 'demo', taskId: 'a2' });
  const activity = queue.getActivity();
  assert.equal(activity.activeCount, 1);
  assert.equal(activity.waitingCount, 1);
  assert.equal(activity.totalCount, 2);
  assert.equal(activity.progress, 0.4);
  assert.deepEqual(activity.activeTasks.map((t) => t.taskId), ['a1']);
  gates.get('a1').resolve({});
});

test('list clamps the limit and supports an exact task lookup', async () => {
  const queue = new MediaTaskQueue({ concurrency: 4 });
  queue.setHandler('demo', () => new Promise(() => {}));
  queue.enqueue({ kind: 'demo', taskId: 'l1' });
  queue.enqueue({ kind: 'demo', taskId: 'l2' });
  assert.equal(queue.list({ limit: 0 }).length, 2);
  assert.equal(queue.list({ limit: 500 }).length, 2);
  assert.deepEqual(
    queue.list({ taskId: 'l2' }).map((t) => t.taskId),
    ['l2'],
  );
  assert.deepEqual(queue.list({ taskId: 'missing' }), []);
  assert.throws(() => queue.list({ taskId: '   ' }), { message: 'Invalid media task ID' });
  assert.throws(() => queue.list({ taskId: 7 }), { message: 'Invalid media task ID' });
  assert.throws(() => queue.list({ taskId: 'bad\x01id' }), { message: 'Invalid media task ID' });
  assert.throws(() => queue.list({ taskId: 'x'.repeat(257) }), { message: 'Invalid media task ID' });
});

test('runProcess resolves with captured stdout and stderr', async () => {
  const spawnDouble = createSpawnDouble();
  const queue = new MediaTaskQueue({ concurrency: 1, spawnImpl: spawnDouble.impl });
  const gate = deferred();
  queue.setHandler('transcode', (task, q) =>
    q.runProcess(task, 'ffmpeg', ['-version'], { durationSec: 4 }).then((out) => {
      gate.resolve(out);
      return out;
    }),
  );
  queue.enqueue({ kind: 'transcode', taskId: 'rp-1' });
  await waitFor(() => spawnDouble.calls.length === 1, 'spawn');
  const child = spawnDouble.calls[0].child;
  assert.deepEqual(spawnDouble.calls[0].args, ['-version']);
  assert.deepEqual(spawnDouble.calls[0].options.stdio, ['ignore', 'pipe', 'pipe']);
  assert.equal(spawnDouble.calls[0].options.windowsHide, true);
  child.stdout.emit('data', Buffer.from('he'));
  child.stdout.emit('data', Buffer.from('llo'));
  child.stderr.emit('data', Buffer.from('time=00:00:02.00 '));
  child.emit('exit', 0, null);
  const captured = await gate.promise;
  assert.equal(captured.stdout.toString('utf8'), 'hello');
  assert.equal(captured.stderr.toString('utf8'), 'time=00:00:02.00 ');
  assert.equal(captured.code, 0);
});

test('runProcess feeds input on stdin and switches stdio to pipe', async () => {
  const spawnDouble = createSpawnDouble();
  const queue = new MediaTaskQueue({ concurrency: 1, spawnImpl: spawnDouble.impl });
  const gate = deferred();
  queue.setHandler('pipe', (task, q) =>
    q.runProcess(task, 'ffmpeg', ['-i', 'pipe:0'], { input: 'raw-bytes' }).then((out) => {
      gate.resolve(out);
      return out;
    }),
  );
  queue.enqueue({ kind: 'pipe', taskId: 'pipe-1' });
  await waitFor(() => spawnDouble.calls.length === 1, 'spawn');
  const record = spawnDouble.calls[0];
  assert.deepEqual(record.options.stdio, ['pipe', 'pipe', 'pipe']);
  assert.equal(record.child.stdin.ended, 'raw-bytes');
  record.child.emit('exit', 0, null);
  await gate.promise;
});

test('runProcess rejects with stderr text on a non-zero exit', async () => {
  const spawnDouble = createSpawnDouble();
  const queue = new MediaTaskQueue({ concurrency: 1, spawnImpl: spawnDouble.impl });
  queue.setHandler('fail', (task, q) => q.runProcess(task, 'ffmpeg', []));
  queue.enqueue({ kind: 'fail', taskId: 'fail-1' });
  await waitFor(() => spawnDouble.calls.length === 1, 'spawn');
  spawnDouble.calls[0].child.stderr.emit('data', Buffer.from('  conversion failed  \n'));
  spawnDouble.calls[0].child.emit('exit', 3, null);
  await waitFor(() => queue.get('fail-1').status === 'failed', 'failed status');
  assert.equal(queue.get('fail-1').error, 'conversion failed');
});

test('runProcess falls back to the exit code when stderr is empty', async () => {
  const spawnDouble = createSpawnDouble();
  const queue = new MediaTaskQueue({ concurrency: 1, spawnImpl: spawnDouble.impl });
  queue.setHandler('fail', (task, q) => q.runProcess(task, 'ffmpeg', []));
  queue.enqueue({ kind: 'fail', taskId: 'fail-2' });
  await waitFor(() => spawnDouble.calls.length === 1, 'spawn');
  spawnDouble.calls[0].child.emit('exit', 9, null);
  await waitFor(() => queue.get('fail-2').status === 'failed', 'failed status');
  assert.equal(queue.get('fail-2').error, 'ffmpeg exited with 9');
});

test('runProcess retries a retryable synchronous spawn failure then succeeds', async () => {
  const spawnDouble = createSpawnDouble();
  let attempt = 0;
  const queue = new MediaTaskQueue({
    concurrency: 1,
    spawnImpl: (command, args, options) => {
      attempt += 1;
      if (attempt < 3) {
        const error = new Error('resource busy');
        error.code = 'EBUSY';
        throw error;
      }
      return spawnDouble.impl(command, args, options);
    },
  });
  queue.setHandler('retry', (task, q) =>
    q.runProcess(task, 'ffmpeg', [], { spawnMaxAttempts: 3, spawnRetryDelayMs: 0 }),
  );
  queue.enqueue({ kind: 'retry', taskId: 'retry-1' });
  await waitFor(() => spawnDouble.calls.length === 1, 'eventual spawn');
  assert.equal(attempt, 3);
  spawnDouble.calls[0].child.emit('exit', 0, null);
  await waitFor(() => queue.get('retry-1').status === 'complete', 'completion');
});

test('runProcess surfaces a non-retryable spawn failure as a start error', async () => {
  const queue = new MediaTaskQueue({
    concurrency: 1,
    spawnImpl: () => {
      const error = new Error('spawn ffmpeg ENOENT');
      error.code = 'ENOENT';
      error.errno = -4058;
      throw error;
    },
  });
  queue.setHandler('retry', (task, q) => q.runProcess(task, 'ffmpeg', ['-i', 'x.mp4']));
  queue.enqueue({ kind: 'retry', taskId: 'start-1' });
  await waitFor(() => queue.get('start-1').status === 'failed', 'failed status');
  assert.match(queue.get('start-1').error, /^Failed to start ffmpeg: spawn ffmpeg ENOENT$/);
});

test('runProcess retries a retryable error event and gives up after the attempt cap', async () => {
  const spawnDouble = createSpawnDouble();
  const queue = new MediaTaskQueue({
    concurrency: 1,
    spawnImpl: spawnDouble.impl,
  });
  queue.setHandler('retry', (task, q) =>
    q.runProcess(task, 'ffmpeg', [], { spawnMaxAttempts: 2, spawnRetryDelayMs: 0 }),
  );
  queue.enqueue({ kind: 'retry', taskId: 'evt-1' });
  await waitFor(() => spawnDouble.calls.length === 1, 'first spawn');
  const firstError = new Error('temporarily unavailable');
  firstError.code = 'UNKNOWN';
  spawnDouble.calls[0].child.emit('error', firstError);
  await waitFor(() => spawnDouble.calls.length === 2, 'second spawn');
  const secondError = new Error('still busy');
  secondError.code = 'EACCES';
  spawnDouble.calls[1].child.emit('error', secondError);
  await waitFor(() => queue.get('evt-1').status === 'failed', 'failed status');
  assert.match(queue.get('evt-1').error, /^Failed to start ffmpeg: still busy$/);
  assert.equal(spawnDouble.calls.length, 2);
});

test('runProcess rejects with a timeout error and kills the child', async () => {
  const spawnDouble = createSpawnDouble();
  const queue = new MediaTaskQueue({ concurrency: 1, spawnImpl: spawnDouble.impl });
  queue.setHandler('slow', (task, q) => q.runProcess(task, 'ffmpeg', [], { timeoutMs: 5 }));
  queue.enqueue({ kind: 'slow', taskId: 'to-1' });
  await waitFor(() => spawnDouble.calls.length === 1, 'spawn');
  await waitFor(() => queue.get('to-1').status === 'failed', 'timeout');
  assert.equal(queue.get('to-1').error, 'ffmpeg timed out after 5ms');
  assert.equal(spawnDouble.calls[0].child.killed, true);
});

test('runProcess refuses to spawn once cancellation was requested', async () => {
  const spawnDouble = createSpawnDouble();
  const queue = new MediaTaskQueue({ concurrency: 1, spawnImpl: spawnDouble.impl });
  let worker = null;
  queue.setHandler('solo', async (task, q) => {
    worker = deferred();
    await worker.promise;
    return q.runProcess(task, 'ffmpeg', []);
  });
  queue.enqueue({ kind: 'solo', taskId: 'pre-1' });
  await waitFor(() => queue.get('pre-1').status === 'processing' && worker, 'running');
  queue.cancel('pre-1');
  worker.resolve({});
  await waitFor(() => queue.get('pre-1').status === 'cancelled', 'cancelled status');
  const snapshot = queue.get('pre-1');
  assert.equal(snapshot.message, 'Cancelled');
  assert.equal(snapshot.error, '');
  assert.equal(spawnDouble.calls.length, 0);
});

test('MediaTaskCancelledError and MediaTaskProcessTimeoutError keep their identity', () => {
  const cancelled = new MediaTaskCancelledError();
  assert.equal(cancelled.name, 'MediaTaskCancelledError');
  assert.equal(cancelled.message, 'Media task cancelled');
  const timeout = new MediaTaskProcessTimeoutError('C:/tools/ffmpeg.exe', 2500);
  assert.equal(timeout.name, 'MediaTaskProcessTimeoutError');
  assert.equal(timeout.code, 'MEDIA_TASK_PROCESS_TIMEOUT');
  assert.equal(timeout.commandLabel, 'ffmpeg.exe');
  assert.equal(timeout.timeoutMs, 2500);
  assert.equal(timeout.message, 'ffmpeg.exe timed out after 2500ms');
});

test('createProcessStartError copies the cause diagnostics', () => {
  const cause = new Error('spawn failed');
  cause.code = 'EACCES';
  cause.errno = -4092;
  cause.syscall = 'spawn ffmpeg';
  cause.path = 'C:/tools/ffmpeg.exe';
  const error = createProcessStartError('C:/tools/ffmpeg.exe', ['-i', 'a'], { cwd: 'F:/work' }, cause, 2);
  assert.equal(error.name, 'MediaTaskProcessStartError');
  assert.equal(error.commandLabel, 'ffmpeg.exe');
  assert.deepEqual(error.args, ['-i', 'a']);
  assert.equal(error.cwd, 'F:/work');
  assert.equal(error.attempt, 2);
  assert.equal(error.code, 'EACCES');
  assert.equal(error.errno, -4092);
  assert.equal(error.syscall, 'spawn ffmpeg');
  assert.equal(error.path, 'C:/tools/ffmpeg.exe');
  assert.equal(error.cause, cause);
});

test('__parseFfmpegTimeSecondsForTest reads ffmpeg progress output', () => {
  assert.equal(__parseFfmpegTimeSecondsForTest('frame=1 time=00:00:02.50 bitrate=1'), 2.5);
  assert.equal(__parseFfmpegTimeSecondsForTest('time=01:02:03.25 '), 3723.25);
  assert.equal(__parseFfmpegTimeSecondsForTest('time=00:00:00.00'), 0);
  assert.equal(__parseFfmpegTimeSecondsForTest('no progress here'), null);
});
