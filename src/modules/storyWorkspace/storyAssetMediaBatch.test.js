import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStoryAssetGenerationNode, createStoryAssetBatchPolicy } from './storyAssetMediaModel.js';
import { createStoryMediaBatchRuntime } from './storyMediaBatchRuntime.js';
import { createStoryMediaBatchRunner } from './storyMediaBatchRunner.js';
import { sanitizeNodeForPersistence } from '../../utils/thumbnailPersistence.js';

function fixture(count = 1) {
  const assets = Array.from({ length: count }, (_, i) => ({ id: `asset-${i}`, name: `角色${i}`, description: '蓝衣，雨夜', referenceNodeId: 'never-send-image' }));
  const model = { provider: 'vendor', model: 'vendor/image' }, nodes = {}, pins = new Set(), calls = [], writes = [], runtimes = {};
  const items = assets.map((asset, i) => {
    const node = buildStoryAssetGenerationNode({ id: `node-${i}`, workspaceNodeId: 'workspace', assetKind: 'characters', asset, model, batchId: 'batch' });
    nodes[node.id] = node;
    runtimes[node.id] = { getGenerationStatus: () => ({ jobStatus: node.jobStatus || 'idle', isGenerating: !!node.isGenerating }),
      runGeneration: async options => { calls.push({ id: node.id, options }); Object.assign(node, { jobStatus: 'success', generationStartTime: 100 + i, images: [{ localPath: `output/${i}.png` }] }); } };
    return { nodeId: node.id, kind: 'image', assetKind: 'characters', assetId: asset.id };
  });
  const state = { nodes }; let valid = true, catalog = [model], edges = [];
  const deps = { items, batchId: 'batch', workspaceNodeId: 'workspace',
    sourcePolicy: createStoryAssetBatchPolicy({ workspaceNodeId: 'workspace', assetKind: 'characters', getAsset: id => assets.find(asset => asset.id === id) }),
    assertCurrent: () => { if (!valid) throw new Error('workspace changed'); },
    store: { getStateRaw: () => state, getIncomingEdges: () => edges, updateNodeData: (id, patch) => { writes.push(patch); Object.assign(nodes[id], patch); } },
    renderer: { pinNode: id => pins.add(id), unpinNode: id => pins.delete(id), flushNodes() {} }, registry: { get: id => runtimes[id] },
    getModels: () => catalog, commit() {}, tick: async () => {} };
  const prepare = () => createStoryMediaBatchRuntime(deps)(() => true);
  const runner = () => createStoryMediaBatchRunner({ items, prepare: createStoryMediaBatchRuntime(deps), assertCurrent: deps.assertCurrent });
  return { assets, items, nodes, state, runtimes, pins, calls, writes, deps, prepare, runner,
    setValid: value => { valid = value; }, setModels: value => { catalog = value; }, setEdges: value => { edges = value; } };
}

test('asset preparation reuses native public runtimes and performs no generation or automatic binding', async () => {
  const f = fixture(2), lease = await f.prepare(); assert.equal(f.pins.size, 2); assert.deepEqual(f.calls, []);
  assert.equal(f.assets[0].referenceNodeId, 'never-send-image'); lease.release(); assert.equal(f.pins.size, 0);
});
test('asset dispatch passes only empty options and keeps secret-bearing comparison values out of review', async () => {
  const f = fixture(); f.nodes['node-0'].apiKey = 'private-key'; f.nodes['node-0'].serviceUrl = 'private-url';
  let review; f.deps.onReview = value => { review = value; };
  const lease = await f.prepare(); lease.markAttempt('node-0'); await lease.invoke('node-0');
  assert.deepEqual(f.calls, [{ id: 'node-0', options: {} }]); assert.equal(JSON.stringify(review).includes('private'), false);
  assert.equal(JSON.stringify(review).includes('never-send-image'), false); lease.release();
});
test('asset nodes cannot masquerade as shot nodes when no asset source policy is supplied', async () => {
  const f = fixture(); delete f.deps.sourcePolicy; f.deps.getShot = () => null;
  await assert.rejects(f.prepare()); assert.deepEqual(f.calls, []); assert.equal(f.pins.size, 0);
});
test('asset policy has to be complete, not a permissive fallback to ordinary generation', () => {
  const f = fixture(); f.deps.sourcePolicy = { validate() {} };
  assert.throws(() => createStoryMediaBatchRuntime(f.deps)); assert.deepEqual(f.calls, []);
});
test('existing reference bindings never become request media; new edges or pills block the pure-text batch', async () => {
  const a = fixture(); a.setEdges([{ sourceId: 'never-send-image' }]); await assert.rejects(a.prepare()); assert.deepEqual(a.calls, []);
  const b = fixture(); b.nodes['node-0'].promptAssetInputRefs = [{ nodeId: 'never-send-image' }]; await assert.rejects(b.prepare());
});
test('attempt mark and history failure never directly dispatch; the conservative mark is retained', async () => {
  const f = fixture(); f.deps.commit = () => { throw new Error('history failed'); };
  const lease = await f.prepare(); assert.throws(() => lease.markAttempt('node-0')); assert.deepEqual(f.calls, []);
  assert.equal(f.nodes['node-0'].storyMediaBatch.state, 'attempted'); lease.release();
});
test('an asset lease can invoke each native node at most once', async () => {
  const f = fixture(), lease = await f.prepare(); lease.markAttempt('node-0'); await lease.invoke('node-0');
  assert.throws(() => lease.invoke('node-0')); assert.equal(f.calls.length, 1); assert.equal(lease.inspect('node-0').state, 'succeeded'); lease.release();
});
test('real serializer retains the existing no-auto-resend marker on asset nodes', async () => {
  const f = fixture(), lease = await f.prepare(); lease.markAttempt('node-0'); lease.release();
  f.nodes['node-0'] = JSON.parse(JSON.stringify(sanitizeNodeForPersistence(f.nodes['node-0'])));
  await assert.rejects(f.prepare()); assert.deepEqual(f.calls, []);
});
test('six asset items use the existing serial runner in explicit source order', async () => {
  const f = fixture(6), runner = f.runner(); assert.equal(await runner.prepare(), true); assert.deepEqual(f.calls, []);
  await runner.start(); assert.deepEqual(f.calls.map(call => call.id), f.items.map(item => item.nodeId));
  assert.ok(runner.snapshot().jobs.every(job => job.state === 'succeeded')); runner.dispose(); assert.equal(f.pins.size, 0);
});
test('partial results stop the batch and do not silently send the next asset', async () => {
  const f = fixture(2), native = f.runtimes['node-0'].runGeneration;
  f.runtimes['node-0'].runGeneration = async options => { await native(options); f.nodes['node-0'].images.push({ error: 'failed' }); };
  const runner = f.runner(); await runner.prepare(); await runner.start();
  assert.equal(f.calls.length, 1); assert.equal(runner.snapshot().jobs[0].state, 'attention'); assert.equal(runner.snapshot().jobs[1].state, 'held'); runner.dispose();
});
test('missing observed generation start or early native return is not classified as success', async () => {
  const f = fixture(), lease = await f.prepare(); lease.markAttempt('node-0'); await lease.invoke('node-0');
  delete f.nodes['node-0'].generationStartTime; assert.equal(lease.inspect('node-0').state, 'unknown');
  f.nodes['node-0'].isGenerating = true; assert.throws(() => lease.assertNoLocalRunning()); lease.release();
});
test('pausing keeps the current invocation alive and prevents later asset dispatch', async () => {
  const f = fixture(2); let finish;
  const gate = new Promise(resolve => { finish = resolve; });
  const native = f.runtimes['node-0'].runGeneration;
  f.runtimes['node-0'].runGeneration = async options => { await native(options); await gate; };
  const runner = f.runner(); await runner.prepare(); const waiting = runner.start();
  runner.pause(); finish(); await waiting; assert.equal(f.calls.length, 1); assert.equal(runner.snapshot().jobs[1].state, 'held'); runner.dispose();
});
test('closing an in-flight batch releases native pins only after its promise settles', async () => {
  const f = fixture(); let finish;
  f.runtimes['node-0'].runGeneration = () => new Promise(resolve => { finish = resolve; });
  const runner = f.runner(); await runner.prepare(); const waiting = runner.start(); runner.dispose();
  assert.equal(f.pins.size, 1); finish(); await waiting; assert.equal(f.pins.size, 0);
});
test('preparation fails cleanly when a public runtime is missing', async () => {
  const f = fixture(); delete f.runtimes['node-0'].runGeneration;
  await assert.rejects(f.prepare()); assert.equal(f.pins.size, 0); assert.deepEqual(f.calls, []);
});
test('asset result inspection does not require a still-available model catalog', async () => {
  const f = fixture(), lease = await f.prepare(); lease.markAttempt('node-0'); await lease.invoke('node-0'); f.setModels([]);
  assert.equal(lease.inspect('node-0').state, 'succeeded'); lease.release();
});

const mutations = {
  'asset name': f => { f.assets[0].name = 'other'; },
  'asset description': f => { f.assets[0].description = 'other'; },
  'asset removal': f => { f.assets.splice(0, 1); },
  'owner ID': f => { f.nodes['node-0'].storyAssetSource.workspaceNodeId = 'other'; },
  'prompt': f => { f.nodes['node-0'].prompt = 'changed'; },
  'model': f => { f.nodes['node-0'].model = 'other'; },
  'generation parameters': f => { f.nodes['node-0'].generationParams = { n: 4 }; },
  'canvas': f => { f.state.nodes = { ...f.nodes }; },
  'workspace signature': f => { f.setValid(false); },
};
for (const [name, mutate] of Object.entries(mutations)) test(`asset preparation lease rejects later ${name}`, async () => {
  const f = fixture(), lease = await f.prepare(); mutate(f); assert.throws(() => lease.verify('node-0')); assert.deepEqual(f.calls, []); lease.release();
});
