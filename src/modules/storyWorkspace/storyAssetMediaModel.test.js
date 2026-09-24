import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryWorkspace, createShot, normalizeStoryWorkspace, episodeStoryboardRows } from './storyWorkspaceModel.js';
import { applyStoryWorkspaceDraft } from './storyWorkspaceApply.js';
import { buildStoryMediaGenerationNode, readStoryMediaTask } from './storyMediaModel.js';
import { storyAssetPrompt, createStoryAssetSource, selectStoryAssets, buildStoryAssetGenerationNode, readStoryAssetTask,
  buildStoryAssetResultNode, readStoryAssetAcceptedImage, normalizeStoryAssetReference, assertStoryAssetReference,
  assertStoryAssetReferences, assertStoryAssetReferenceChanges } from './storyAssetMediaModel.js';
import { sanitizeMultiCanvasDataForPersistence } from '../../utils/thumbnailPersistence.js';

function fixture(assetKind = 'characters') {
  const workspace = createStoryWorkspace('资料项目');
  const asset = { id: 'asset-a', name: '雨夜旅人', description: '蓝色外套，站在雨中', referenceNodeId: '', apiKey: 'do-not-copy' };
  workspace[assetKind] = [asset];
  const model = { provider: 'vendor', model: 'vendor/image', apiKey: 'do-not-copy', url: 'do-not-copy' };
  const context = { workspaceNodeId: 'workspace', assetKind, assetId: asset.id };
  const generation = buildStoryAssetGenerationNode({ id: 'gen', ...context, asset, model, batchId: 'batch' });
  Object.assign(generation, { jobStatus: 'success', generationStartTime: 101, images: [{ originalLocalPath: 'output/asset.png', thumbLocalPath: 'output/thumb.png' }] });
  const nodes = { workspace: { id: 'workspace', type: 'story-workspace', storyWorkspace: workspace }, gen: generation };
  const task = readStoryAssetTask(generation, context, asset);
  const result = buildStoryAssetResultNode({ id: 'accepted', node: generation, context, asset, index: 0, expectedKey: task.results[0].key });
  const state = { nodes, edges: {} }, writes = [];
  const store = { getStateRaw: () => state, batch: fn => { writes.push('batch'); fn(); }, addNode: node => { writes.push('node'); nodes[node.id] = node; },
    updateNodeData: (id, data) => { writes.push('workspace'); Object.assign(nodes[id], data); } };
  const apply = (additionalNodes = [], draft = workspace) => applyStoryWorkspaceDraft({ store, commit: () => writes.push('history'), nodeId: 'workspace',
    nodesContext: nodes, baseSignature: JSON.stringify(normalizeStoryWorkspace(workspace)), draft: structuredClone(draft), additionalNodes });
  const bind = () => { nodes.accepted = result; asset.referenceNodeId = result.id; asset.referenceImage = readStoryAssetAcceptedImage({ nodes, context, asset, nodeId: result.id }); };
  return { workspace, asset, model, context, generation, nodes, task, result, state, writes, store, apply, bind, assetKind };
}

test('asset prompt includes only explicit name/description and an inert category label', () => {
  const f = fixture(); assert.equal(storyAssetPrompt(f.asset, 'characters'), '人物参考图\n名称：雨夜旅人\n设定：蓝色外套，站在雨中');
  assert.equal(f.generation.storyMediaSource, undefined); assert.equal(f.generation.storyAssetSource.assetId, f.asset.id);
  assert.equal(JSON.stringify(f.generation).includes('do-not-copy'), false);
});
test('source tags never invent an episode or shot ID', () => {
  const f = fixture('scenes'); const source = createStoryAssetSource({ ...f.context, asset: f.asset, nodeId: 'node' });
  assert.equal(source.assetKind, 'scenes'); assert.equal(source.episodeId, undefined); assert.equal(source.shotId, undefined);
});
test('HTML in description is escaped for the original image prompt, never a media pill', () => {
  const f = fixture(); f.asset.description = '<script>alert(1)</script> & <img src=x>';
  const node = buildStoryAssetGenerationNode({ id: 'fresh', ...f.context, asset: f.asset, model: f.model, batchId: 'batch' });
  assert.match(node.prompt, /&lt;script&gt;/); assert.equal(node.prompt.includes('<img'), false);
});
test('blank and oversized asset prompts reject rather than silently truncate', () => {
  const f = fixture();
  for (const patch of [{ name: '' }, { description: '' }, { name: 'x'.repeat(301) }, { description: 'x'.repeat(20000) }]) {
    assert.throws(() => storyAssetPrompt({ ...f.asset, ...patch }, 'characters'));
  }
});
test('selection is one to six unique assets in workspace order, not click order', () => {
  const f = fixture(); f.workspace.characters.push({ ...f.asset, id: 'asset-b' });
  assert.deepEqual(selectStoryAssets(f.workspace, 'characters', ['asset-b', 'asset-a']).map(a => a.id), ['asset-a', 'asset-b']);
  for (const ids of [[], ['asset-a', 'asset-a'], ['missing'], Array(7).fill('asset-a')]) assert.throws(() => selectStoryAssets(f.workspace, 'characters', ids));
});
test('result adoption uses the local original and original generation timestamp, not a thumbnail', () => {
  const f = fixture(); assert.equal(f.result.localPath, 'output/asset.png'); assert.equal(f.result.storyAssetResult.resultIndex, 0);
  assert.equal(f.result.storyMediaResult, undefined); assert.equal(f.asset.referenceNodeId, '');
  f.generation.generationStartTime = 102;
  assert.throws(() => buildStoryAssetResultNode({ id: 'later', node: f.generation, context: f.context, asset: f.asset, index: 0, expectedKey: f.task.results[0].key }));
});
test('model catalog is not a dependency of reading, adopting or binding an existing local result', () => {
  const f = fixture(); delete f.generation.model; delete f.generation.provider;
  assert.equal(readStoryAssetTask(f.generation, f.context, f.asset).results.length, 1); f.bind();
  assert.doesNotThrow(() => assertStoryAssetReference({ nodes: f.nodes, workspaceNodeId: 'workspace', assetKind: 'characters', asset: f.asset }));
});
test('partly failed or remote results keep real array indices and cannot become local originals', () => {
  const f = fixture(); f.generation.images = [{ error: 'failed' }, { imageUrl: 'https://example.com/a.png' }, { originalLocalPath: 'output/b.png' }];
  const task = readStoryAssetTask(f.generation, f.context, f.asset); assert.equal(task.rejectedCount, 2); assert.equal(task.results[0].index, 2);
});
test('source node clone with another ID cannot claim an existing asset task or adopted result', () => {
  const f = fixture(); assert.equal(readStoryAssetTask({ ...f.generation, id: 'clone' }, f.context, f.asset), null);
  f.nodes.clone = { ...f.result, id: 'clone' };
  assert.throws(() => readStoryAssetAcceptedImage({ nodes: f.nodes, context: f.context, asset: f.asset, nodeId: 'clone' }));
});
test('adoption batches the source node and full draft, commits once and does not bind a reference', () => {
  const f = fixture(); f.apply([f.result]); assert.deepEqual(f.writes, ['batch', 'node', 'workspace', 'history']);
  assert.equal(f.nodes.workspace.storyWorkspace.characters[0].referenceNodeId, '');
});
test('the same local result cannot be adopted twice, while the first source remains untouched', () => {
  const f = fixture(); f.apply([f.result]); f.writes.length = 0;
  const duplicate = { ...f.result, id: 'duplicate', storyAssetResult: { ...f.result.storyAssetResult, nodeId: 'duplicate' } };
  assert.throws(() => f.apply([duplicate]), /已采纳/); assert.deepEqual(f.writes, []); assert.ok(f.nodes.accepted);
});
test('late result or edge-ID collision stops before the first node write', () => {
  const a = fixture(); a.generation.images[0].originalLocalPath = 'output/changed.png'; assert.throws(() => a.apply([a.result])); assert.deepEqual(a.writes, []);
  const b = fixture(); b.state.edges.accepted = { id: 'accepted' }; assert.throws(() => b.apply([b.result])); assert.deepEqual(b.writes, []);
});
test('canvas and workspace base-signature conflicts do not create orphaned result nodes', () => {
  const f = fixture(), baseSignature = JSON.stringify(normalizeStoryWorkspace(f.workspace)); f.workspace.title = 'other edit';
  assert.throws(() => applyStoryWorkspaceDraft({ store: f.store, commit() {}, nodeId: 'workspace', nodesContext: f.nodes,
    baseSignature, draft: f.workspace, additionalNodes: [f.result] })); assert.deepEqual(f.writes, []);
  f.state.nodes = { ...f.nodes }; assert.throws(() => f.apply([f.result])); assert.deepEqual(f.writes, []);
});
test('six homogeneous held asset images share one batch and history commit', () => {
  const f = fixture(); f.workspace.characters = Array.from({ length: 6 }, (_, i) => ({ ...f.asset, id: `asset-${i}` }));
  const nodes = f.workspace.characters.map((asset, i) => buildStoryAssetGenerationNode({ id: `new-${i}`, ...f.context, asset, model: f.model, batchId: 'batch' }));
  f.apply(nodes); assert.equal(f.writes.filter(x => x === 'batch').length, 1); assert.equal(f.writes.filter(x => x === 'node').length, 6);
  assert.equal(f.writes.filter(x => x === 'history').length, 1);
});
test('mixed asset/shot additions and missing batch API are rejected before mutation', () => {
  const f = fixture(); const shot = createShot('shot'); f.workspace.episodes[0].shots = [shot];
  const shotNode = buildStoryMediaGenerationNode({ id: 'shot-node', workspaceNodeId: 'workspace', episodeId: f.workspace.episodes[0].id, shot, kind: 'image', model: f.model });
  shotNode.storyMediaBatch = { version: 1, batchId: 'batch', state: 'held' };
  const assetNode = buildStoryAssetGenerationNode({ id: 'asset-node', ...f.context, asset: f.asset, model: f.model, batchId: 'batch' });
  assert.throws(() => f.apply([shotNode, assetNode])); assert.deepEqual(f.writes, []);
  delete f.store.batch; assert.throws(() => f.apply([assetNode])); assert.deepEqual(f.writes, []);
});
test('explicit reference metadata is whitelisted and survives workspace/serializer JSON round trips', () => {
  const f = fixture(); f.bind(); f.asset.referenceImage.apiKey = 'do-not-copy';
  const normalized = normalizeStoryWorkspace(f.workspace); assert.equal(normalized.characters[0].referenceImage.apiKey, undefined);
  const saved = JSON.parse(JSON.stringify(sanitizeMultiCanvasDataForPersistence({ activeCanvasId: 'c', canvases: [{ id: 'c', nodes: [f.nodes.workspace, f.result], edges: [] }] })));
  assert.equal(saved.canvases[0].nodes[1].storyAssetResult.assetId, f.asset.id);
  assert.equal(normalizeStoryWorkspace(saved.canvases[0].nodes[0].storyWorkspace).characters[0].referenceImage.localPath, 'output/asset.png');
});
test('editing a description keeps the old reference record, but prevents quietly using it in a new storyboard', () => {
  const f = fixture(); f.bind(); const previous = structuredClone(f.workspace); f.asset.description = 'new description';
  assert.doesNotThrow(() => assertStoryAssetReferenceChanges({ previous, workspace: f.workspace, workspaceNodeId: 'workspace', nodes: f.nodes }));
  assert.throws(() => assertStoryAssetReferences({ workspace: f.workspace, workspaceNodeId: 'workspace', nodes: f.nodes }));
  assert.equal(f.asset.referenceNodeId, 'accepted');
});
test('an unrelated stale asset reference does not block a storyboard which never uses that asset', () => {
  const f = fixture(); f.bind(); delete f.nodes.accepted;
  const episode = f.workspace.episodes[0]; episode.shots = [createShot('unrelated')];
  assert.doesNotThrow(() => assertStoryAssetReferences({ workspace: f.workspace, workspaceNodeId: 'workspace', nodes: f.nodes, episode }));
  episode.shots[0].characterIds = [f.asset.id];
  assert.throws(() => assertStoryAssetReferences({ workspace: f.workspace, workspaceNodeId: 'workspace', nodes: f.nodes, episode }));
});
test('a validated explicit binding reaches original storyboard character/scene reference columns', () => {
  for (const kind of ['characters', 'scenes']) {
    const f = fixture(kind); f.bind(); const shot = createShot('framing');
    if (kind === 'characters') shot.characterIds = [f.asset.id]; else shot.sceneId = f.asset.id;
    const episode = f.workspace.episodes[0]; episode.shots = [shot];
    assertStoryAssetReferences({ workspace: f.workspace, workspaceNodeId: 'workspace', nodes: f.nodes, episode });
    assert.equal(episodeStoryboardRows(f.workspace, episode, f.nodes)[0][kind === 'characters' ? '角色图' : '参考'], '/output/asset.png');
  }
});
test('legacy manual references without asset provenance retain their original behavior', () => {
  const f = fixture(); f.asset.referenceNodeId = 'manual'; f.nodes.manual = { id: 'manual', type: 'source-image', src: '/output/manual.png' };
  assert.doesNotThrow(() => assertStoryAssetReferences({ workspace: f.workspace, workspaceNodeId: 'workspace', nodes: f.nodes }));
  assert.equal(normalizeStoryWorkspace(f.workspace).characters[0].referenceImage, undefined);
});
test('legacy shot result parsing remains independently owned and does not claim asset tasks', () => {
  const f = fixture(); assert.equal(readStoryMediaTask(f.generation, { workspaceNodeId: 'workspace' }, {}), null);
  assert.equal(readStoryAssetTask({ ...f.generation, storyMediaSource: {} }, f.context, f.asset), null);
});

const changedReferences = {
  'missing image': f => { delete f.nodes.accepted; },
  'local original path': f => { f.result.originalLocalPath = 'output/other.png'; },
  'actual source URL': f => { f.result.src = '/output/other.png'; },
  'result key': f => { f.result.storyAssetResult.resultKey = 'new-result'; },
  'asset name': f => { f.asset.name = 'other'; },
  'foreign owner': f => { f.result.storyAssetResult.workspaceNodeId = 'foreign'; },
  'foreign asset': f => { f.result.storyAssetResult.assetId = 'foreign'; },
  'lost binding provenance': f => { delete f.asset.referenceImage; },
};
for (const [name, change] of Object.entries(changedReferences)) test(`explicit reference refuses ${name}`, () => {
  const f = fixture(); f.bind(); change(f);
  assert.throws(() => assertStoryAssetReference({ nodes: f.nodes, workspaceNodeId: 'workspace', assetKind: 'characters', asset: f.asset }));
});
for (const path of ['https://example.com/a.png', 'C:/a.png', 'output/../a.png', 'output/%2e%2e/a.png', 'output/a.png?key=x']) {
  test(`reference metadata refuses unsafe path ${path}`, () => {
    assert.throws(() => normalizeStoryAssetReference({ version: 1, nodeId: 'image', resultKey: 'result', localPath: path }, 'image'));
  });
}
