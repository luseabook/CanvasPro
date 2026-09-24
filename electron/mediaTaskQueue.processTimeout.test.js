import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { MediaTaskProcessTimeoutError, MediaTaskQueue } from './mediaTaskQueue.js';

function createTask() {
  return {
    id: 'probe-task',
    taskId: 'probe-task',
    kind: 'probe',
    status: 'processing',
    progress: 0,
    message: '',
    child: null,
    cancelRequested: false,
  };
}

function createQueue() {
  return new MediaTaskQueue({ concurrency: 1, onUpdate: () => {} });
}

const NODE = process.execPath;

test('MediaTaskProcessTimeoutError carries the timeout context', () => {
  const error = new MediaTaskProcessTimeoutError('F:/runtime/ffmpeg', 1200);
  assert.ok(error instanceof Error);
  assert.equal(error.name, 'MediaTaskProcessTimeoutError');
  assert.equal(error.message, 'ffmpeg timed out after 1200ms');
  assert.equal(error.code, 'MEDIA_TASK_PROCESS_TIMEOUT');
  assert.equal(error.command, 'F:/runtime/ffmpeg');
  assert.equal(error.commandLabel, 'ffmpeg');
  assert.equal(error.timeoutMs, 1200);
  const generic = new MediaTaskProcessTimeoutError('', 5);
  assert.equal(generic.commandLabel, 'media tool');
  assert.equal(generic.command, '');
});

test('runProcess rejects with a timeout error and kills the child', async () => {
  const queue = createQueue(),
    task = createTask(),
    startedAt = Date.now();
  await assert.rejects(
    queue.runProcess(task, NODE, ['-e', 'setTimeout(() => {}, 5000)'], { timeoutMs: 150 }),
    (error) => {
      assert.ok(error instanceof MediaTaskProcessTimeoutError);
      assert.equal(error.code, 'MEDIA_TASK_PROCESS_TIMEOUT');
      assert.equal(error.commandLabel, path.basename(NODE));
      assert.equal(error.timeoutMs, 150);
      return true;
    },
  );
  assert.ok(Date.now() - startedAt < 3000, 'the timeout must not wait for the child to finish');
  assert.equal(task.child, null);
});

test('runProcess resolves normally when the process finishes inside the timeout', async () => {
  const queue = createQueue(),
    task = createTask(),
    result = await queue.runProcess(task, NODE, ['-e', "process.stdout.write('ok')"], {
      timeoutMs: 5000,
    });
  assert.equal(result.code, 0);
  assert.equal(result.stdout.toString('utf8'), 'ok');
  assert.equal(task.child, null);
});

test('a missing or zero timeout keeps the unbounded behaviour', async () => {
  const queue = createQueue(),
    task = createTask(),
    result = await queue.runProcess(task, NODE, ['-e', "process.stdout.write('ok')"], {});
  assert.equal(result.stdout.toString('utf8'), 'ok');
  const second = await queue.runProcess(
    createTask(),
    NODE,
    ['-e', "process.stdout.write('ok')"],
    { timeoutMs: 0 },
  );
  assert.equal(second.stdout.toString('utf8'), 'ok');
});

test('a failing process after the timeout window still reports its own error', async () => {
  const queue = createQueue(),
    task = createTask();
  await assert.rejects(
    queue.runProcess(task, NODE, ['-e', "process.stderr.write('boom'); process.exit(3)"], {
      timeoutMs: 5000,
    }),
    (error) => {
      assert.equal(error instanceof MediaTaskProcessTimeoutError, false);
      assert.equal(error.name, 'Error');
      assert.equal(error.message, 'boom');
      return true;
    },
  );
  assert.equal(task.child, null);
});
