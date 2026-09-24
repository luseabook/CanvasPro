import test from 'node:test';
import assert from 'node:assert/strict';
import { MediaTaskQueue } from './mediaTaskQueue.js';
import { registerMediaTaskIpcHandlers } from './ipc/mediaTaskIpc.js';
function fixture(count = 510) {
  const queue = new MediaTaskQueue();
  queue._pump = () => assert.fail('query must not schedule tasks');
  for (let i = 1; i <= count; i++) queue.tasks.set(`t-${i}`, {
    id: `t-${i}`, kind: 'storySequenceExport', nodeId: 'clip', status: 'complete',
    payload: { apiKey: 'never expose', src: 'output/input.mp4' }, progress: 1,
    createdAt: i, finishedAt: i + 1, result: { success: true, localPath: `output/${i}.mp4` },
  });
  return queue;
}
test('recent list remains descending and capped at 500', () => {
  const queue = fixture(); const rows = queue.list({ limit: 900 });
  assert.equal(rows.length, 500); assert.equal(rows[0].taskId, 't-510');
});
test('exact lookup finds tasks older than recent-list cap', () => {
  const queue = fixture(); assert.equal(queue.list({ limit: 500 }).some(t => t.taskId === 't-1'), false);
  assert.equal(queue.list({ taskId: ' t-1 ' })[0].taskId, 't-1');
});
test('missing ID returns empty, not a new failed task', () => {
  const queue = fixture(1); assert.deepEqual(queue.list({ taskId: 'absent' }), []); assert.equal(queue.tasks.size, 1);
});
test('invalid exact identifiers fail rather than widening to all tasks', () => {
  const queue = fixture(1);
  for (const taskId of ['', 5, null, 'a'.repeat(257), 't\n1']) assert.throws(() => queue.list({ taskId }));
});
test('lookup snapshot does not expose payload or credentials', () => {
  const [task] = fixture(1).list({ taskId: 't-1' });
  assert.equal(task.payload, undefined); assert.equal(JSON.stringify(task).includes('never expose'), false);
});
test('queries do not change waiting, active or task state', () => {
  const queue = fixture(1); const before = JSON.stringify([...queue.tasks]); queue.list({ taskId: 't-1' });
  assert.equal(JSON.stringify([...queue.tasks]), before); assert.equal(queue.active, 0); assert.equal(queue.waiting.length, 0);
});
test('existing IPC forwards exact query and preserves ordinary list', () => {
  const handlers = new Map(), requests = [];
  registerMediaTaskIpcHandlers({ ipcMain: { handle: (name, fn) => handlers.set(name, fn) },
    getMediaTaskQueue: () => ({ list: request => { requests.push(request); return []; } }) });
  handlers.get('mediaTask:list')({}, { taskId: 't-1', limit: 500 });
  handlers.get('mediaTask:list')({}, { limit: 120 });
  assert.deepEqual(requests, [{ taskId: 't-1', limit: 500 }, { limit: 120 }]);
  assert.equal(handlers.size, 3);
});
test('host restart yields no invented history', () => {
  assert.deepEqual(new MediaTaskQueue().list({ taskId: 't-1' }), []);
});
