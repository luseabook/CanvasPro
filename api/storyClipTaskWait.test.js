import test from 'node:test';
import assert from 'node:assert/strict';
import { waitForStoryClipTask } from './storyClipTaskWait.js';

function fixture(tasks = []) {
  let listener, removed = 0, listed = 0;
  const bridge = { onUpdate: fn => { listener = fn; return () => { removed++; }; }, list: async () => { listed++; return tasks; } };
  return { bridge, emit: task => listener(task), removed: () => removed, listed: () => listed };
}
test('reads a terminal task that completed before enqueue reply without re-enqueuing', async () => {
  const f = fixture([{ taskId: 't', status: 'complete', result: { localPath: 'output/a.mp4' } }]);
  const result = await waitForStoryClipTask(f.bridge, 't');
  assert.equal(result.localPath, 'output/a.mp4'); assert.equal(f.listed(), 1); assert.equal(f.removed(), 1);
});
test('initial failed snapshot rejects and removes the subscription immediately', async () => {
  const f = fixture(); await assert.rejects(waitForStoryClipTask(f.bridge, 't', { initial: { taskId: 't', status: 'failed', error: 'bad range' } }), /bad range/);
  assert.equal(f.removed(), 1); assert.equal(f.listed(), 0);
});
test('ignores unrelated tasks and settles only once across list/event races', async () => {
  const f = fixture(), promise = waitForStoryClipTask(f.bridge, 't');
  f.emit({ taskId: 'other', status: 'failed' }); f.emit({ taskId: 't', status: 'complete', result: { success: true } });
  f.emit({ taskId: 't', status: 'failed' }); assert.equal((await promise).success, true); assert.equal(f.removed(), 1);
});
test('timeout releases listener but never cancels or re-enqueues a host task', async () => {
  const f = fixture(); f.bridge.cancel = () => assert.fail('must not cancel'); f.bridge.enqueue = () => assert.fail('must not resend');
  await assert.rejects(waitForStoryClipTask(f.bridge, 't', { timeout: 1 }), /仍可能运行/); assert.equal(f.removed(), 1);
});
test('synchronous terminal event during subscription is cleaned up', async () => {
  let removed = 0;
  const bridge = { onUpdate: fn => { fn({ taskId: 't', status: 'complete', result: { success: true } }); return () => removed++; }, list: async () => [] };
  assert.equal((await waitForStoryClipTask(bridge, 't')).success, true); assert.equal(removed, 1);
});
test('missing desktop task-query interface fails without any request', async () => {
  await assert.rejects(waitForStoryClipTask({}, 't'), /查询不可用/);
});
