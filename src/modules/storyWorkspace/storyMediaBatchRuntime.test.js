import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryMediaBatchRuntime } from './storyMediaBatchRuntime.js';
import { buildStoryMediaGenerationNode, readStoryMediaTask } from './storyMediaModel.js';
import { createShot } from './storyWorkspaceModel.js';
import { sanitizeNodeForPersistence } from '../../utils/thumbnailPersistence.js';

function fixture() {
  const shot = { ...createShot('街道雨夜'), id: 'shot-a' }, model = { provider: 'vendor', model: 'vendor/image' };
  const node = buildStoryMediaGenerationNode({ id: 'node-a', workspaceNodeId: 'workspace-a', episodeId: 'episode-a', shot, kind: 'image', model });
  node.storyMediaBatch = { version: 1, batchId: 'batch-a', state: 'held' };
  const state = { nodes: { [node.id]: node } }, pins = new Set(), calls = [], updates = [];
  let valid = true, catalog = [model], edges = [], runtimeOverride;
  const runtime = {
    getGenerationStatus: () => ({ jobStatus: state.nodes[node.id]?.jobStatus || 'idle', isGenerating: state.nodes[node.id]?.isGenerating === true }),
    runGeneration: async options => { calls.push(options); Object.assign(state.nodes[node.id], { jobStatus: 'success', generationStartTime: 1, images: [{ localPath: 'output/a.png' }] }); },
  };
  const deps = { items: [{ nodeId: node.id, shotId: shot.id, kind: 'image' }], batchId: 'batch-a', workspaceNodeId: 'workspace-a', episodeId: 'episode-a',
    getShot: () => shot, assertCurrent: () => { if (!valid) throw Error('context changed'); },
    store: { getStateRaw: () => state, getIncomingEdges: () => edges,
      updateNodeData: (id, patch) => { updates.push(patch); Object.assign(state.nodes[id], patch); } },
    registry: { get: () => runtimeOverride === undefined ? runtime : runtimeOverride },
    renderer: { pinNode: id => pins.add(id), unpinNode: id => pins.delete(id), flushNodes: () => {} },
    getModels: () => catalog, commit: () => {}, tick: async () => {},
  };
  return { deps, node, shot, model, state, pins, calls, updates, runtime,
    setValid: value => { valid = value; }, setModels: value => { catalog = value; }, setEdges: value => { edges = value; }, setRuntime: value => { runtimeOverride = value; } };
}
async function acquire(f) { return createStoryMediaBatchRuntime(f.deps)(() => true); }

test('preparation pins public runtimes without a generation request, cleanup is idempotent', async () => {
  const f = fixture(), lease = await acquire(f); assert.equal(f.pins.size, 1); assert.deepEqual(f.calls, []);
  lease.release(); lease.release(); assert.equal(f.pins.size, 0);
});
test('only an empty options object reaches the original public runtime', async () => {
  const f = fixture(); f.node.apiKey = 'private'; f.node.baseUrl = 'https://private.invalid'; f.node.generationParams = { apiKey: 'hidden', duration: 5 };
  let review; f.deps.onReview = values => { review = values; };
  const lease = await acquire(f); lease.markAttempt(f.node.id); await lease.invoke(f.node.id);
  assert.deepEqual(f.calls, [{}]); assert.equal(JSON.stringify(review).includes('private'), false);
  assert.equal(JSON.stringify(review).includes('hidden'), false); assert.deepEqual(Object.keys(f.updates[0]), ['storyMediaBatch']); lease.release();
});
test('invocation requires the persisted-in-canvas attempt boundary', async () => {
  const f = fixture(), lease = await acquire(f); assert.throws(() => lease.invoke(f.node.id)); assert.deepEqual(f.calls, []); lease.release();
});
test('a single native invocation cannot be replayed through the lease', async () => {
  const f = fixture(), lease = await acquire(f); lease.markAttempt(f.node.id); await lease.invoke(f.node.id);
  assert.throws(() => lease.invoke(f.node.id)); assert.throws(() => lease.markAttempt(f.node.id)); assert.equal(f.calls.length, 1); lease.release();
});
test('attempt markers survive the actual persistence sanitizer and block re-preparation', async () => {
  const f = fixture(), lease = await acquire(f); lease.markAttempt(f.node.id); lease.release();
  const restored = JSON.parse(JSON.stringify(sanitizeNodeForPersistence(f.node)));
  assert.equal(restored.storyMediaBatch.state, 'attempted'); f.state.nodes[f.node.id] = restored;
  await assert.rejects(acquire(f)); assert.deepEqual(f.calls, []);
});
test('a history commit failure leaves a conservative marker but never directly invokes generation', async () => {
  const f = fixture(); f.deps.commit = () => { throw Error('commit failed'); };
  const lease = await acquire(f); assert.throws(() => lease.markAttempt(f.node.id));
  assert.equal(f.node.storyMediaBatch.state, 'attempted'); assert.deepEqual(f.calls, []); lease.release();
});
test('native status, task identifiers and generation timestamps block preparation', async () => {
  for (const patch of [{ jobStatus: 'success' }, { isGenerating: true }, { rhTaskId: 'task' }, { asyncTaskId: 'task' },
    { dreaminaSubmitId: 'task' }, { generationStartTime: 123 }, { generationStartedAt: 123 }, { asyncTaskStatus: 'pending' }]) {
    const f = fixture(); Object.assign(f.node, patch); await assert.rejects(acquire(f)); assert.equal(f.pins.size, 0); assert.deepEqual(f.calls, []);
  }
});
test('a native busy runtime prevents dispatch even when store status is idle', async () => {
  const f = fixture(); f.runtime.getGenerationStatus = () => ({ isGenerating: true });
  await assert.rejects(acquire(f)); assert.equal(f.pins.size, 0);
});
test('wrong source, prompt change or unavailable model prevents preparation', async () => {
  const a = fixture(); a.node.storyMediaSource.shotId = 'other'; await assert.rejects(acquire(a));
  const b = fixture(); b.shot.description = 'changed'; await assert.rejects(acquire(b));
  const c = fixture(); c.setModels([]); await assert.rejects(acquire(c));
});
test('new graph edges and prompt asset references are never silently included', async () => {
  const a = fixture(); a.setEdges([{ sourceId: 'private-image' }]); await assert.rejects(acquire(a));
  const b = fixture(); b.node.promptAssetInputRefs = [{ assetId: 'private-image' }]; await assert.rejects(acquire(b));
  const c = fixture(), lease = await acquire(c); c.setEdges([{ sourceId: 'later-image' }]); assert.throws(() => lease.verify(c.node.id)); lease.release();
});
test('parameter and prompt mutations after review invalidate approval', async () => {
  const f = fixture(), lease = await acquire(f); f.node.generationParams = { resolution: '4K' };
  assert.throws(() => lease.markAttempt(f.node.id)); assert.deepEqual(f.calls, []); lease.release();
});
test('viewport-only changes do not invalidate a reviewed request', async () => {
  const f = fixture(), lease = await acquire(f); f.node.x = 100; f.node.width = 512;
  assert.doesNotThrow(() => lease.verify(f.node.id)); lease.release();
});
test('canvas replacement and runtime remount invalidate approval', async () => {
  const f = fixture(), lease = await acquire(f); f.state.nodes = { ...f.state.nodes };
  assert.throws(() => lease.verify(f.node.id)); lease.release();
  const g = fixture(), other = await acquire(g); g.setRuntime({ ...g.runtime }); assert.throws(() => other.verify(g.node.id)); other.release();
});
test('a context change caused by the attempt commit is checked before invoke', async () => {
  const f = fixture(); f.deps.commit = () => f.setValid(false);
  const lease = await acquire(f); lease.markAttempt(f.node.id); assert.throws(() => lease.invoke(f.node.id)); assert.deepEqual(f.calls, []); lease.release();
});
test('mount timeout releases pins and performs no generation', async () => {
  const f = fixture(); f.setRuntime(null); await assert.rejects(acquire(f)); assert.equal(f.pins.size, 0); assert.deepEqual(f.calls, []);
});
test('cancelled preparation releases pinned nodes without invoking runtimes', async () => {
  const f = fixture(); await assert.rejects(createStoryMediaBatchRuntime(f.deps)(() => false)); assert.equal(f.pins.size, 0); assert.deepEqual(f.calls, []);
});
test('one missing public method fails safely, without calling private node methods', async () => {
  const f = fixture(); delete f.runtime.runGeneration; f.runtime._onGenerate = () => { throw Error('must not call'); };
  await assert.rejects(acquire(f)); assert.deepEqual(f.calls, []);
});
test('successful result classification requires a native generationStartTime and local originals', async () => {
  const f = fixture(), lease = await acquire(f); lease.markAttempt(f.node.id); await lease.invoke(f.node.id);
  assert.equal(lease.inspect(f.node.id).state, 'succeeded'); delete f.node.generationStartTime;
  assert.equal(lease.inspect(f.node.id).state, 'unknown'); lease.release();
});
test('partial, remote-only and missing results pause for attention', async () => {
  const f = fixture(), lease = await acquire(f); lease.markAttempt(f.node.id); await lease.invoke(f.node.id);
  f.node.images.push({ error: 'partial failure' }); assert.equal(lease.inspect(f.node.id).state, 'attention');
  f.node.images = [{ imageUrl: 'https://remote.invalid/a.png' }]; assert.equal(lease.inspect(f.node.id).state, 'attention'); lease.release();
});
test('a still-running result cannot authorize continuation after early return', async () => {
  const f = fixture(), lease = await acquire(f); lease.markAttempt(f.node.id); await lease.invoke(f.node.id);
  f.node.isGenerating = true; assert.equal(lease.inspect(f.node.id).state, 'unknown'); assert.throws(() => lease.assertNoLocalRunning()); lease.release();
});
test('failure and missing native start observations are unknown, not no-charge successes', async () => {
  const f = fixture(), lease = await acquire(f);
  assert.equal(lease.inspect(f.node.id).state, 'unknown'); f.node.jobStatus = 'error';
  assert.equal(lease.inspect(f.node.id).state, 'unknown'); lease.release();
});
test('selection keys use actual native generationStartTime even if output path is reused', () => {
  const f = fixture(); Object.assign(f.node, { jobStatus: 'success', images: [{ localPath: 'output/a.png' }], generationStartTime: 1 });
  const context = { workspaceNodeId: 'workspace-a', episodeId: 'episode-a', shotId: f.shot.id };
  const oldKey = readStoryMediaTask(f.node, context, f.shot).results[0].key;
  f.node.generationStartTime = 2; assert.notEqual(readStoryMediaTask(f.node, context, f.shot).results[0].key, oldKey);
});
test('oversized comparison data fails closed and does not appear in the review', async () => {
  const f = fixture(); f.node.extra = 'x'.repeat(256 * 1024); await assert.rejects(acquire(f)); assert.equal(f.pins.size, 0);
});
