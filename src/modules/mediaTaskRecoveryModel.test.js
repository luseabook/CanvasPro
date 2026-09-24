import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSerializedCanvasData } from '../utils/thumbnailPersistence.js';
import {
  normalizeRecoveryTaskId, readMediaTaskList, findMediaTask, describeRecoverableTask,
  buildRecoveredMediaFields, hasRecoveredMediaTask, recoverMediaTaskResult,
  createMediaTaskListRefresh, mediaTaskOwnsGuardedWriteback,
} from './mediaTaskRecoveryModel.js';
function task(patch = {}) {
  return { taskId: 'task-1', kind: 'storySequenceExport', nodeId: 'old-clip', status: 'complete',
    createdAt: 10, finishedAt: 20, result: { success: true, localPath: 'output/ClipVideo/a.mp4',
      path: 'output/ClipVideo/a.mp4', videoDuration: 5, videoWidth: 1920, videoHeight: 1080, fps: 30 }, ...patch };
}
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
function fixture() {
  const f = { preview: task(), nodes: {}, writes: 0, commits: 0, queries: 0 };
  f.state = { nodes: f.nodes };
  f.api = { list: async () => { f.queries++; return [structuredClone(f.preview)]; }, enqueue: () => assert.fail('must not enqueue'), cancel: () => assert.fail('must not cancel') };
  f.store = { getStateRaw: () => f.state, batch: fn => fn(), addNode: n => { f.writes++; f.state.nodes[n.id] = n; }, setSelectedNodes: ids => { f.selected = ids; } };
  f.args = { api: f.api, preview: structuredClone(f.preview), store: f.store, confirm: () => true,
    buildNode: d => buildRecoveredMediaFields(d, 'recovered', 25), commit: () => { f.commits++; } };
  return f;
}
test('task IDs are bounded and normalized', () => {
  assert.equal(normalizeRecoveryTaskId(' task-1 '), 'task-1');
  for (const id of ['', null, 9, 'a'.repeat(257), 'a\nb']) assert.throws(() => normalizeRecoveryTaskId(id));
});
test('query uses only original list, bounded to 500', async () => {
  let request; await readMediaTaskList({ list: async r => { request = r; return []; } }, { taskId: 't' });
  assert.deepEqual(request, { limit: 500, taskId: 't' });
});
test('missing bridge and malformed list fail closed', async () => {
  await assert.rejects(readMediaTaskList(null));
  for (const rows of [null, {}, Array(501).fill(task())]) await assert.rejects(readMediaTaskList({ list: () => rows }));
});
test('query timeout does not enqueue or cancel', async () => {
  const f = fixture(); f.api.list = () => new Promise(() => {});
  await assert.rejects(readMediaTaskList(f.api, {}, 1), /超时/); assert.equal(f.writes, 0);
});
test('old host result list is filtered by exact ID, never first match', async () => {
  const api = { list: () => [task({ taskId: 'other' }), task()] };
  assert.equal((await findMediaTask(api, 'task-1')).taskId, 'task-1');
});
test('absent and duplicate task IDs do not become failed or recovered', async () => {
  await assert.rejects(findMediaTask({ list: () => [] }, 't'), /不代表未执行/);
  await assert.rejects(findMediaTask({ list: () => [task(), task()] }, 'task-1'), /重复/);
});
for (const [label, change] of Object.entries({
  waiting: t => { t.status = 'waiting'; }, failed: t => { t.status = 'failed'; },
  unknown: t => { t.status = 'alien'; }, cancelled: t => { t.status = 'cancelled'; },
  unsuccessful: t => { t.result.success = false; }, vendor: t => { t.source = 'generation'; },
  unsupported: t => { t.kind = 'videoPoster'; }, missingTime: t => { t.createdAt = 0; },
  unknownDuration: t => { t.result.videoDuration = 0; }, inconsistentPath: t => { t.result.path = 'output/b.mp4'; },
})) test('recovery rejects ' + label, () => { const t = task(); change(t); assert.throws(() => describeRecoverableTask(t)); });
for (const path of ['https://x/a.mp4', 'C:/a.mp4', 'output/../a.mp4', 'output/%61.mp4', 'output/a.mp4?x', 'output/a\\b.mp4', 'output//a.mp4', 'data/assets/a.mp4', 'output/a.png']) {
  test('reject unsafe or unsupported result path ' + path, () => {
    const t = task(); t.result.localPath = path; delete t.result.path; assert.throws(() => describeRecoverableTask(t));
  });
}
test('all four verified kinds recover only their intended media', () => {
  for (const kind of ['storySequenceExport', 'mediaClipExport', 'videoReverse']) assert.equal(describeRecoverableTask(task({ kind })).mediaType, 'video');
  const audio = describeRecoverableTask(task({ kind: 'audioCompose', result: { success: true, localPath: 'output/ComposeAudio/a.mp3' } }));
  assert.equal(audio.mediaType, 'audio'); assert.equal(audio.duration, 0);
  assert.equal(buildRecoveredMediaFields(audio, 'a').type, 'source-audio');
});
test('new independent fields exclude credentials, original node state and story attribution', () => {
  const t = task(); t.result.apiKey = 'secret'; t.result.storySequenceOutput = { bad: true }; t.result.url = 'https://other/a';
  const fields = buildRecoveredMediaFields(describeRecoverableTask(t), 'new', 25);
  assert.equal(fields.id, 'new'); assert.equal(fields.src, '/output/ClipVideo/a.mp4');
  for (const key of ['apiKey', 'storySequenceOutput', 'mediaTaskId', 'storyMediaResult', 'isGenerating']) assert.equal(fields[key], undefined);
  assert.equal(fields.mediaTaskRecovery.originalNodeId, 'old-clip');
  assert.equal(JSON.stringify(fields).includes('secret'), false);
});
test('successful recovery does two reads and one explicit independent write/history', async () => {
  const f = fixture(); const node = await recoverMediaTaskResult(f.args);
  assert.equal(f.queries, 2); assert.equal(f.writes, 1); assert.equal(f.commits, 1); assert.deepEqual(f.selected, [node.id]);
  assert.equal(hasRecoveredMediaTask(JSON.parse(JSON.stringify(f.nodes)), describeRecoverableTask(task())), true);
});
test('confirmation declined does not add or commit', async () => {
  const f = fixture(); f.args.confirm = () => false;
  assert.equal(await recoverMediaTaskResult(f.args), null); assert.equal(f.writes, 0); assert.equal(f.queries, 1);
});
test('task changed since preview is rejected before confirmation', async () => {
  const f = fixture(); f.preview.result.videoDuration = 6; f.args.confirm = () => assert.fail('must not confirm stale data');
  await assert.rejects(recoverMediaTaskResult(f.args), /变化/); assert.equal(f.writes, 0);
});
test('task changed while confirmation pending is rejected', async () => {
  const f = fixture(); f.args.confirm = () => { f.preview.result.videoDuration = 6; return true; };
  await assert.rejects(recoverMediaTaskResult(f.args), /变化/); assert.equal(f.writes, 0);
});
test('canvas switched during host query, even with copied IDs, never receives output', async () => {
  const f = fixture(); f.api.list = () => { f.state.nodes = { ...f.nodes }; return [f.preview]; };
  await assert.rejects(recoverMediaTaskResult(f.args), /画布/); assert.equal(f.writes, 0);
});
test('canvas switch during confirmation prevents writes', async () => {
  const f = fixture(); f.args.confirm = () => { f.state.nodes = {}; return true; };
  await assert.rejects(recoverMediaTaskResult(f.args)); assert.equal(f.writes, 0);
});
test('closed query panel prevents writes', async () => {
  const f = fixture(); f.args.isCurrent = () => false;
  await assert.rejects(recoverMediaTaskResult(f.args)); assert.equal(f.writes, 0);
});
test('duplicate recorded recovery is blocked, including saved/reopened nodes', async () => {
  const f = fixture(); await recoverMediaTaskResult(f.args); f.state.nodes = JSON.parse(JSON.stringify(f.nodes));
  await assert.rejects(recoverMediaTaskResult(f.args), /已有/); assert.equal(f.writes, 1);
});
test('original same-ID node is neither overwritten nor used as provenance', async () => {
  const f = fixture(); f.nodes['old-clip'] = { id: 'old-clip', secret: 'unchanged' };
  await recoverMediaTaskResult(f.args); assert.deepEqual(f.nodes['old-clip'], { id: 'old-clip', secret: 'unchanged' });
});
test('concurrent recovery on one store is blocked without an extra query', async () => {
  const f = fixture(), d = deferred(); f.args.confirm = () => d.promise;
  const first = recoverMediaTaskResult(f.args);
  await assert.rejects(recoverMediaTaskResult(f.args), /正在/); d.resolve(false); await first;
  assert.equal(f.queries, 1);
});
test('node ID collision and missing batch capability prevent writes', async () => {
  for (const mode of ['id', 'batch']) {
    const f = fixture(); if (mode === 'id') f.nodes.recovered = {}; else delete f.store.batch;
    await assert.rejects(recoverMediaTaskResult(f.args)); assert.equal(f.writes, 0);
  }
});
test('failed query releases the per-store lock for explicit next action', async () => {
  const f = fixture(); f.api.list = () => { throw Error('read failed'); };
  await assert.rejects(recoverMediaTaskResult(f.args)); f.api.list = () => [f.preview];
  await recoverMediaTaskResult(f.args); assert.equal(f.writes, 1);
});
test('new events take precedence over late list snapshots', async () => {
  const d = deferred(), rows = []; const reader = createMediaTaskListRefresh({ api: { list: () => d.promise }, onTask: t => rows.push(t) });
  const pending = reader.refresh(); reader.noteEvent(task()); d.resolve([task({ status: 'processing' }), task({ taskId: 'other' })]);
  await pending; assert.deepEqual(rows.map(t => t.taskId), ['other']);
});
test('overlapping refreshes cannot apply an older read', async () => {
  const a = deferred(), b = deferred(), rows = []; let calls = 0;
  const reader = createMediaTaskListRefresh({ api: { list: () => (++calls === 1 ? a.promise : b.promise) }, onTask: t => rows.push(t) });
  const first = reader.refresh(), second = reader.refresh(); b.resolve([task()]); await second; a.resolve([task({ status: 'waiting' })]);
  assert.equal(await first, false); assert.equal(rows.length, 1); assert.equal(rows[0].status, 'complete');
});
test('hide/clear invalidates a pending refresh', async () => {
  const d = deferred(); const reader = createMediaTaskListRefresh({ api: { list: () => d.promise }, onTask: () => assert.fail('stale write') });
  const pending = reader.refresh(); reader.invalidate(); d.resolve([task()]); assert.equal(await pending, false);
});
test('only story sequence events bypass generic automatic node writes', () => {
  assert.equal(mediaTaskOwnsGuardedWriteback(task()), true);
  for (const kind of ['videoPoster', 'mediaClipExport', 'videoReverse', 'audioCompose']) assert.equal(mediaTaskOwnsGuardedWriteback({ kind }), false);
});

test('original persistence sanitizer retains recovery provenance and local source', () => {
  const fields = buildRecoveredMediaFields(describeRecoverableTask(task()), 'restored', 25);
  const saved = JSON.parse(JSON.stringify(sanitizeSerializedCanvasData({ nodes: { restored: fields }, edges: {} })));
  assert.equal(hasRecoveredMediaTask(saved.nodes, describeRecoverableTask(task())), true);
  assert.equal(saved.nodes.restored.localPath, 'output/ClipVideo/a.mp4');
});
test('history failure reports the existing node rather than pretending rollback', async () => {
  const f = fixture(); f.args.commit = () => { throw Error('history failed'); };
  await assert.rejects(recoverMediaTaskResult(f.args), /已写入/); assert.equal(f.writes, 1);
  await assert.rejects(recoverMediaTaskResult(f.args), /已有/); assert.equal(f.writes, 1);
});
test('event bookkeeping cap invalidates old refresh safely', async () => {
  const d = deferred(); const reader = createMediaTaskListRefresh({ api: { list: () => d.promise }, onTask: () => assert.fail('old read') });
  const pending = reader.refresh(); for (let i = 0; i < 1001; i++) reader.noteEvent({ taskId: `e-${i}` });
  d.resolve([task()]); assert.equal(await pending, false);
});