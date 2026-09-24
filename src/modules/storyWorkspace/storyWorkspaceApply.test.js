import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryWorkspace, createShot, normalizeStoryWorkspace } from './storyWorkspaceModel.js';
import { applyStoryWorkspaceDraft } from './storyWorkspaceApply.js';
import { buildStoryMediaGenerationNode } from './storyMediaModel.js';

function fixture() {
  const workspace = createStoryWorkspace('原项目'); workspace.episodes[0].shots = [createShot('雨夜')];
  const nodes = { workspace: { id: 'workspace', type: 'story-workspace', storyWorkspace: workspace }, old: { id: 'old', type: 'ai-image', apiKey: 'custom-preserved' } };
  const state = { nodes }, writes = [];
  const store = { getStateRaw: () => state, addNode: node => { writes.push('add'); nodes[node.id] = node; },
    updateNodeData: (id, patch) => { writes.push('update'); Object.assign(nodes[id], patch); } };
  const args = { store, commit: () => writes.push('commit'), nodeId: 'workspace', nodesContext: nodes,
    baseSignature: JSON.stringify(normalizeStoryWorkspace(workspace)), draft: structuredClone(workspace) };
  const media = buildStoryMediaGenerationNode({ id: 'media', workspaceNodeId: 'workspace', episodeId: workspace.episodes[0].id,
    shot: workspace.episodes[0].shots[0], kind: 'image', model: { provider: 'vendor', model: 'vendor/model' } });
  return { state, nodes, args, media, writes };
}
test('unchanged draft does not create a history entry', () => {
  const { args, writes } = fixture(); applyStoryWorkspaceDraft(args); assert.deepEqual(writes, []);
});
test('explicit draft apply preserves native node customizations and commits once', () => {
  const { args, writes, nodes } = fixture(); args.draft.title = '新标题';
  const applied = applyStoryWorkspaceDraft(args);
  assert.deepEqual(writes, ['update', 'commit']); assert.equal(nodes.old.apiKey, 'custom-preserved');
  assert.equal(applied.signature, JSON.stringify(nodes.workspace.storyWorkspace));
});
test('creating a media node has one history commit and no generation dispatch dependency', () => {
  const { args, writes, nodes, media } = fixture();
  applyStoryWorkspaceDraft({ ...args, additionalNodes: [media] });
  assert.deepEqual(writes, ['add', 'update', 'commit']); assert.equal(nodes.media.storyMediaSource.shotId, args.draft.episodes[0].shots[0].id);
  assert.equal(nodes.media.isGenerating, undefined);
});
test('changed canvas blocks before any node or workspace mutation', () => {
  const { args, writes, media, state } = fixture(); state.nodes = { ...state.nodes };
  assert.throws(() => applyStoryWorkspaceDraft({ ...args, additionalNodes: [media] })); assert.deepEqual(writes, []);
});
test('concurrent workspace edits block before adding an orphan result node', () => {
  const { args, writes, media, nodes } = fixture(); nodes.workspace.storyWorkspace.title = '其他窗口';
  assert.throws(() => applyStoryWorkspaceDraft({ ...args, additionalNodes: [media] })); assert.deepEqual(writes, []);
});
test('invalid draft or duplicate id is rejected during preflight, not after node creation', () => {
  const { args, writes, media } = fixture(); args.draft.title = 'x'.repeat(301);
  assert.throws(() => applyStoryWorkspaceDraft({ ...args, additionalNodes: [media] })); assert.deepEqual(writes, []);
  args.draft.title = 'valid';
  assert.throws(() => applyStoryWorkspaceDraft({ ...args, additionalNodes: [{ ...media, id: 'old' }] })); assert.deepEqual(writes, []);
});
test('foreign media and oversized batches are rejected before writes', () => {
  const { args, writes, media } = fixture();
  assert.throws(() => applyStoryWorkspaceDraft({ ...args, additionalNodes: [{ ...media, storyMediaSource: { workspaceNodeId: 'other' } }] }));
  assert.throws(() => applyStoryWorkspaceDraft({ ...args, additionalNodes: Array.from({ length: 7 }, (_, i) => ({ ...media, id: `media-${i}` })) }));
  assert.deepEqual(writes, []);
});
test('unlinked media is not deleted by applying the workspace draft', () => {
  const { args, nodes, writes } = fixture(); nodes.accepted = { id: 'accepted', type: 'source-image', localPath: 'output/a.png' };
  args.draft.episodes[0].shots[0].mediaRefs = [];
  applyStoryWorkspaceDraft(args); assert.ok(nodes.accepted); assert.deepEqual(writes, ['update', 'commit']);
});


test('six held generation nodes are applied with one commit, without any generation call', () => {
  const { args, writes, media, nodes } = fixture();
  const additions = Array.from({ length: 6 }, (_, i) => ({ ...media, id: `batch-${i}`,
    storyMediaBatch: { version: 1, batchId: 'batch', state: 'held' } }));
  applyStoryWorkspaceDraft({ ...args, additionalNodes: additions });
  assert.equal(writes.filter(item => item === 'add').length, 6);
  assert.equal(writes.filter(item => item === 'commit').length, 1);
  assert.equal(nodes['batch-5'].storyMediaBatch.state, 'held');
});
test('late batch collision preflight prevents all earlier node additions', () => {
  const { args, writes, media } = fixture();
  const additions = ['new-node', 'old'].map(id => ({ ...media, id, storyMediaBatch: { version: 1, batchId: 'batch', state: 'held' } }));
  assert.throws(() => applyStoryWorkspaceDraft({ ...args, additionalNodes: additions }));
  assert.deepEqual(writes, []);
});