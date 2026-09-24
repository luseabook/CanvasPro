import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryWorkspace, createShot, normalizeStoryWorkspace } from './storyWorkspaceModel.js';
import { createStoryMediaSource } from './storyMediaModel.js';
import { readStoryClipItems, buildStoryClipPlan, applyStoryClipPlan, createStoryClipExportGuard, validateStoryClipRanges, validateStoryClipOutput } from './storyClipModel.js';
import { buildMediaClipExportPayload, normalizeMediaClipState } from '../../components/media-clip/mediaClipState.js';
import { sanitizeMultiCanvasDataForPersistence } from '../../utils/thumbnailPersistence.js';

function fixture() {
  const workspace = createStoryWorkspace('项目'), episode = workspace.episodes[0];
  episode.shots = [createShot('雨夜'), createShot('清晨')];
  const nodes = { workspace: { id: 'workspace', type: 'story-workspace', storyWorkspace: workspace } };
  episode.shots.forEach((shot, index) => {
    const id = `video-${index}`, localPath = `output/${index}.mp4`;
    nodes[id] = { id, type: 'source-video', src: '/' + localPath, localPath, videoDuration: 5 + index,
      apiKey: 'must-not-copy', serviceUrl: 'must-not-copy', storyMediaResult: {
        ...createStoryMediaSource({ workspaceNodeId: 'workspace', episodeId: episode.id, shot, kind: 'video', nodeId: id }),
        localPath, resultKey: `result-${index}` } };
    shot.mediaRefs = [{ kind: 'video', nodeId: id }];
  });
  const args = { nodes, workspaceNodeId: 'workspace', episode, shotIds: episode.shots.map(shot => shot.id) };
  const items = readStoryClipItems(args), ranges = items.map(item => ({ shotId: item.shotId, start: 0, end: item.duration }));
  const planArgs = { ...args, id: 'clip', edgeIds: ['edge-0', 'edge-1'], items, ranges };
  const plan = buildStoryClipPlan(planArgs), state = { nodes, edges: {} }, writes = [];
  const store = { getStateRaw: () => state, batch: callback => { writes.push('batch-start'); callback(); writes.push('batch-end'); },
    addNode: node => { writes.push('node'); nodes[node.id] = node; }, addEdge: edge => { writes.push('edge'); state.edges[edge.id] = edge; },
    updateNodeData: (id, patch) => { writes.push('workspace'); Object.assign(nodes[id], patch); } };
  const apply = () => applyStoryClipPlan({ store, nodesContext: nodes, workspaceNodeId: 'workspace',
    baseSignature: JSON.stringify(normalizeStoryWorkspace(workspace)), draft: structuredClone(workspace), plan, commit: () => writes.push('commit') });
  const install = () => { nodes.clip = plan.node; state.edges = Object.fromEntries(plan.edges.map(edge => [edge.id, edge])); };
  const payload = () => buildMediaClipExportPayload({ videoClips: nodes.clip.mediaClip.clips, audioClips: [] });
  const guard = () => createStoryClipExportGuard({ store, nodeId: 'clip', payload: payload() });
  return { workspace, episode, nodes, args, items, ranges, planArgs, plan, state, writes, store, apply, install, payload, guard };
}
test('selected shots follow episode order, never checkbox insertion order', () => {
  const f = fixture(); const items = readStoryClipItems({ ...f.args, shotIds: [...f.args.shotIds].reverse() });
  assert.deepEqual(items.map(item => item.shotId), f.args.shotIds);
});
test('uses recorded full duration, not storyboard planned duration; no copied secrets', () => {
  const f = fixture(); assert.equal(f.plan.total, 11); assert.equal(f.items[1].plannedDuration, 5);
  assert.equal(JSON.stringify(f.plan).includes('must-not-copy'), false);
});
test('native normalizer retains explicit clip ranges and deterministic edge identities', () => {
  const f = fixture(); const plan = buildStoryClipPlan({ ...f.planArgs, ranges: f.ranges.map(range => ({ ...range, start: 1, end: 3 })) });
  const sources = plan.edges.map(edge => ({ ...f.nodes[edge.sourceId], __mediaClipEdgeId: edge.id }));
  const state = normalizeMediaClipState(plan.node, { videos: sources, audios: [] });
  assert.deepEqual(state.clips.map(clip => [clip.id, clip.startSec, clip.endSec, clip.timelineStartSec]), [['edge-0', 1, 3, 0], ['edge-1', 1, 3, 2]]);
});
test('missing result is reported as a row error, never silently removed', () => {
  const f = fixture(); delete f.nodes['video-1']; const items = readStoryClipItems(f.args);
  assert.equal(items.length, 2); assert.ok(items[1].error); assert.throws(() => validateStoryClipRanges(items, f.ranges));
});
test('unknown duration does not fall back to a guessed storyboard length', () => {
  const f = fixture(); delete f.nodes['video-0'].videoDuration;
  assert.match(readStoryClipItems(f.args)[0].error, /时长/);
});
test('range validation rejects blank/nonnumeric, negative, short and overlong intervals', () => {
  const f = fixture();
  for (const patch of [{ start: NaN }, { start: '' }, { start: -1 }, { end: 0.01 }, { end: 20 }]) {
    assert.throws(() => validateStoryClipRanges(f.items, [{ ...f.ranges[0], ...patch }, f.ranges[1]]));
  }
});
test('selection limit and duplicates fail rather than truncating', () => {
  const f = fixture();
  for (const shotIds of [[], [f.args.shotIds[0], f.args.shotIds[0]], Array(61).fill('shot')]) assert.throws(() => readStoryClipItems({ ...f.args, shotIds }));
});
test('source replacement between preview and apply blocks the plan', () => {
  const f = fixture(); f.nodes['video-0'].storyMediaResult.resultKey = 'new-result';
  assert.throws(() => buildStoryClipPlan(f.planArgs));
});
test('apply publishes node and all edges together with one history commit', () => {
  const f = fixture(); f.apply();
  assert.deepEqual(f.writes, ['batch-start', 'node', 'edge', 'edge', 'workspace', 'batch-end', 'commit']);
  assert.equal(f.nodes.clip.type, 'media-clip');
});
test('last edge collision is caught before the first write', () => {
  const f = fixture(); f.state.edges['edge-1'] = { id: 'edge-1' }; assert.throws(f.apply); assert.deepEqual(f.writes, []);
});
test('canvas identity and absent batching API block apply', () => {
  const f = fixture(); f.state.nodes = { ...f.nodes }; assert.throws(f.apply); assert.deepEqual(f.writes, []);
  f.state.nodes = f.nodes; delete f.store.batch; assert.throws(f.apply); assert.deepEqual(f.writes, []);
});
test('concurrent workspace edit blocks apply using the captured base signature', () => {
  const f = fixture(), signature = JSON.stringify(normalizeStoryWorkspace(f.workspace)); f.workspace.title = 'other';
  assert.throws(() => applyStoryClipPlan({ store: f.store, nodesContext: f.nodes, workspaceNodeId: 'workspace', baseSignature: signature, draft: f.workspace, plan: f.plan, commit() {} }));
  assert.deepEqual(f.writes, []);
});
test('plain media clip nodes remain unguarded', () => {
  const f = fixture(); f.install(); delete f.nodes.clip.storySequence;
  assert.equal(f.guard(), null);
});
test('native payload becomes a dedicated local task with a strict whitelist', () => {
  const f = fixture(); f.install(); const guard = f.guard(); guard.assertCurrent();
  assert.equal(guard.request.electronPayload.kind, 'storySequenceExport');
  assert.deepEqual(Object.keys(guard.request.electronPayload.args).sort(), ['clips', 'duration']);
  assert.equal(guard.request.backendBody, undefined);
});
test('native trims are accepted before confirmation while preserving source order', () => {
  const f = fixture(); f.install(); const clips = f.nodes.clip.mediaClip.clips;
  clips[0].endSec = 3; clips[0].timelineEndSec = 3; clips[1].timelineStartSec = 3; clips[1].timelineEndSec = 9;
  assert.equal(f.guard().outputSource.total, 9);
});
const changes = {
  'canvas switch': f => { f.state.nodes = { ...f.nodes }; },
  'owner deletion': f => { delete f.nodes.workspace; },
  'new shot': f => { f.episode.shots.push(createShot('新镜头')); },
  'shot order': f => { f.episode.shots.reverse(); },
  'shot prompt': f => { f.episode.shots[0].videoPrompt = 'changed'; },
  'accepted binding': f => { f.episode.shots[0].mediaRefs = []; },
  'source path': f => { f.nodes['video-0'].localPath = 'output/other.mp4'; },
  'source result': f => { f.nodes['video-0'].storyMediaResult.resultKey = 'new'; },
  'duration metadata': f => { f.nodes['video-0'].videoDuration = 4; },
  'edge deletion': f => { delete f.state.edges['edge-1']; },
  'extra edge': f => { f.state.edges.extra = { id: 'extra', sourceId: 'video-0', targetId: 'clip' }; },
  'audio insertion': f => { f.nodes.clip.mediaClip.audioClips = [{ sourceKey: 'output/music.mp3' }]; },
  'clip deletion': f => { f.nodes.clip.mediaClip.clips.pop(); },
  'timeline gap': f => { f.nodes.clip.mediaClip.clips[1].timelineStartSec += 1; },
  'post-confirm trim': f => { f.nodes.clip.mediaClip.clips[1].endSec = 3; f.nodes.clip.mediaClip.clips[1].timelineEndSec = 8; },
};
for (const [name, change] of Object.entries(changes)) test(`render guard blocks ${name} during asynchronous work`, () => {
  const f = fixture(); f.install(); const guard = f.guard(); change(f); assert.throws(() => guard.assertCurrent());
});
test('native payload substitution and silent clip omission are rejected', () => {
  const f = fixture(); f.install();
  const payload = f.payload(); payload.timeline.clips[1].sourceKey = 'output/other.mp4';
  assert.throws(() => createStoryClipExportGuard({ store: f.store, nodeId: 'clip', payload }));
  payload.timeline.clips.pop(); assert.throws(() => createStoryClipExportGuard({ store: f.store, nodeId: 'clip', payload }));
});
test('cosmetic movement and lastOutput do not invalidate approved input', () => {
  const f = fixture(); f.install(); const guard = f.guard();
  f.nodes.clip.x = 200; f.nodes.clip.mediaClip.lastOutput = { localPath: 'output/old.mp4' }; guard.assertCurrent();
});
test('output requires explicit success and a supported local video', () => {
  assert.equal(validateStoryClipOutput({ success: true, localPath: 'output/ClipVideo/a.mp4', videoDuration: 2 }), 'output/ClipVideo/a.mp4');
  for (const result of [{}, { success: false, localPath: 'output/a.mp4' }, { success: true, localPath: 'https://example.org/a.mp4', videoDuration: 2 }]) assert.throws(() => validateStoryClipOutput(result));
});
test('native serializer retains timeline, edges and source records without starting a task', () => {
  const f = fixture(); f.install();
  const saved = JSON.parse(JSON.stringify(sanitizeMultiCanvasDataForPersistence({ activeCanvasId: 'c', canvases: [{ id: 'c', nodes: Object.values(f.nodes), edges: Object.values(f.state.edges) }] })));
  const node = saved.canvases[0].nodes.find(item => item.id === 'clip');
  assert.deepEqual(node.storySequence, f.plan.node.storySequence); assert.equal(saved.canvases[0].edges.length, 2);
  assert.equal(node.mediaClip.clips.length, 2); assert.equal(node.isGenerating, undefined);
});

test('stale marked component cannot turn into an ordinary export on another canvas', () => {
  const f = fixture(); f.install(); const payload = f.payload();
  f.state.nodes = {};
  assert.throws(() => createStoryClipExportGuard({ store: f.store, nodeId: 'clip', payload, expectedNodes: f.nodes, requireMarked: true }));
});
test('even identical copied IDs on another canvas do not authorize the old component', () => {
  const f = fixture(); f.install(); const payload = f.payload(); f.state.nodes = structuredClone(f.nodes);
  assert.throws(() => createStoryClipExportGuard({ store: f.store, nodeId: 'clip', payload, expectedNodes: f.nodes, requireMarked: true }));
});