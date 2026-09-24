import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryWorkspace, createShot, normalizeStoryWorkspace } from './storyWorkspaceModel.js';
import { createStoryMediaSource } from './storyMediaModel.js';
import { readStoryClipItems, buildStoryClipPlan, applyStoryClipPlan, createStoryClipExportGuard, validateStoryClipRanges } from './storyClipModel.js';
import { readStoryClipAudioSource, listStoryClipAudioSources, validateStoryClipAudio } from './storyClipMedia.js';
import { normalizeMediaClipState, buildMediaClipExportPayload, buildMediaClipExportSignature } from '../../components/media-clip/mediaClipState.js';
import { sanitizeMultiCanvasDataForPersistence } from '../../utils/thumbnailPersistence.js';

function fixture() {
  const workspace = createStoryWorkspace('混合初剪'), episode = workspace.episodes[0];
  episode.shots = [createShot('静态画面'), createShot('运动画面')]; episode.shots[0].duration = 8;
  const nodes = { workspace: { id: 'workspace', type: 'story-workspace', storyWorkspace: workspace } };
  for (const [index, shot] of episode.shots.entries()) {
    shot.mediaRefs = [];
    for (const kind of ['video', 'image']) {
      const id = `${kind}-${index}`, localPath = `output/${id}.${kind === 'video' ? 'mp4' : 'png'}`;
      nodes[id] = { id, type: `source-${kind}`, src: '/' + localPath, localPath, originalLocalPath: localPath,
        ...(kind === 'video' ? { videoDuration: 6 } : {}), apiKey: 'do-not-copy-secret', serviceUrl: 'do-not-copy-url',
        storyMediaResult: { ...createStoryMediaSource({ workspaceNodeId: 'workspace', episodeId: episode.id, shot, kind, nodeId: id }), localPath, resultKey: id } };
      shot.mediaRefs.push({ kind, nodeId: id });
    }
  }
  nodes.sound = { id: 'sound', type: 'source-audio', src: '/output/narration.wav', localPath: 'output/narration.wav', audioDuration: 20,
    apiKey: 'do-not-copy-secret', serviceUrl: 'do-not-copy-url' };
  const args = { nodes, workspaceNodeId: 'workspace', episode, shotIds: episode.shots.map(shot => shot.id), mediaKinds: { [episode.shots[0].id]: 'image' } };
  const items = readStoryClipItems(args), ranges = items.map(item => ({ shotId: item.shotId, start: 0, end: item.duration }));
  const audio = { source: readStoryClipAudioSource(nodes, 'sound'), start: 1, end: 5, timelineStart: 2, volume: 0.35, muted: false };
  const planArgs = { ...args, id: 'clip', edgeIds: ['edge-0', 'edge-1'], audioEdgeId: 'sound-edge', items, ranges, audio, mediaVersion: 2 };
  const plan = buildStoryClipPlan(planArgs), state = { nodes, edges: {} }, writes = [];
  const store = { getStateRaw: () => state, batch: fn => { writes.push('batch'); fn(); },
    addNode: node => { nodes[node.id] = node; writes.push('node'); }, addEdge: edge => { state.edges[edge.id] = edge; writes.push('edge'); },
    updateNodeData: (id, data) => { Object.assign(nodes[id], data); writes.push('workspace'); } };
  const install = () => { nodes.clip = plan.node; state.edges = Object.fromEntries(plan.edges.map(edge => [edge.id, edge])); };
  const payload = () => buildMediaClipExportPayload({ videoClips: nodes.clip.mediaClip.clips, audioClips: nodes.clip.mediaClip.audioClips });
  const guard = () => createStoryClipExportGuard({ store, nodeId: 'clip', payload: payload(), expectedNodes: nodes });
  const apply = () => applyStoryClipPlan({ store, nodesContext: nodes, workspaceNodeId: 'workspace',
    baseSignature: JSON.stringify(normalizeStoryWorkspace(workspace)), draft: structuredClone(workspace), plan, commit: () => writes.push('history') });
  return { workspace, episode, nodes, args, items, ranges, audio, planArgs, plan, state, writes, store, install, payload, guard, apply };
}

test('video remains the default; missing video never silently falls back to an accepted image', () => {
  const f = fixture(); delete f.nodes['video-0'];
  const rows = readStoryClipItems({ ...f.args, mediaKinds: {} });
  assert.equal(rows.length, 2); assert.ok(rows[0].error);
  assert.equal(readStoryClipItems(f.args)[0].kind, 'image');
});
test('explicit mixed choices follow shot order, not caller or edge insertion order', () => {
  const f = fixture(); const rows = readStoryClipItems({ ...f.args, shotIds: [...f.args.shotIds].reverse() });
  assert.deepEqual(rows.map(item => item.shotId), f.args.shotIds);
  assert.deepEqual(f.plan.node.mediaClip.clips.map(clip => clip.kind), ['image', 'video']);
  assert.equal(f.plan.node.storySequence.version, 2); assert.equal(f.plan.total, 14);
});
test('still default comes from planned duration, survives native normalization and may be explicitly lengthened', () => {
  const f = fixture(); const plan = buildStoryClipPlan({ ...f.planArgs, ranges: [{ ...f.ranges[0], end: 12 }, f.ranges[1]] });
  const sources = plan.edges.map(edge => ({ ...f.nodes[edge.sourceId], __mediaClipEdgeId: edge.id }));
  const normalized = normalizeMediaClipState(plan.node, { videos: sources.filter(n => n.type !== 'source-audio'), audios: sources.filter(n => n.type === 'source-audio') });
  assert.equal(normalized.clips[0].endSec, 12); assert.equal(normalized.clips[0].storyImageDurationSec, 12);
  assert.equal(normalized.audioClips[0].volume, 0.35); assert.equal(normalized.audioClips[0].timelineStartSec, 2);
});
test('ordinary stills without the opt-in field retain the native default, not a guessed new duration', () => {
  const f = fixture(); const source = f.nodes['image-0'];
  const normalized = normalizeMediaClipState({ mediaClip: { clips: [{ id: 'x', sourceKey: source.localPath, startSec: 0, endSec: 12 }] } }, { videos: [source] });
  assert.equal(normalized.clips[0].endSec, 5); assert.equal(normalized.clips[0].storyImageDurationSec, undefined);
});
test('still zero-origin and total capacity are enforced without truncating', () => {
  const f = fixture();
  for (const range of [{ start: 1, end: 8 }, { start: 0, end: 0.01 }, { start: 0, end: 3600 }]) {
    assert.throws(() => validateStoryClipRanges(f.items, [{ shotId: f.items[0].shotId, ...range }, f.ranges[1]]));
  }
});
test('static images require the adopted original, not a preview thumbnail or renamed reference', () => {
  const f = fixture(); f.nodes['image-0'].originalLocalPath = 'output/thumb.png';
  assert.ok(readStoryClipItems(f.args)[0].error);
});
test('selecting one local source-audio copies no credential, service URL or arbitrary settings', () => {
  const f = fixture(); const list = listStoryClipAudioSources(f.nodes);
  assert.deepEqual(Object.keys(readStoryClipAudioSource(f.nodes, 'sound')).sort(), ['duration', 'localPath', 'nodeId']);
  assert.equal(list.length, 1); assert.equal(JSON.stringify(f.plan).includes('do-not-copy'), false);
  f.install(); assert.equal(JSON.stringify(f.guard().request).includes('do-not-copy'), false);
});
test('unknown or generating audio is displayed as unavailable, never sent as a guessed track', () => {
  const f = fixture(); delete f.nodes.sound.audioDuration;
  assert.throws(() => readStoryClipAudioSource(f.nodes, 'sound')); assert.ok(listStoryClipAudioSources(f.nodes)[0].error);
  f.nodes.sound.audioDuration = 20; f.nodes.sound.isGenerating = true;
  assert.throws(() => readStoryClipAudioSource(f.nodes, 'sound'));
});
test('audio settings must fit the selected file and visual duration; no automatic crop, stretch or repeat', () => {
  const f = fixture();
  for (const patch of [{ start: -1 }, { end: 21 }, { end: 1.01 }, { timelineStart: 13 }, { volume: -0.1 }, { volume: 1.1 }, { muted: 'false' }, { start: NaN }]) {
    assert.throws(() => validateStoryClipAudio({ ...f.audio, ...patch }, 14));
  }
  assert.equal(validateStoryClipAudio(null, 14), null);
  assert.equal(validateStoryClipAudio({ ...f.audio, muted: true, volume: 0 }, 14).muted, true);
});
test('apply writes visual/audio edges and draft in one batch and commits history once', () => {
  const f = fixture(); f.apply();
  assert.deepEqual(f.writes, ['batch', 'node', 'edge', 'edge', 'edge', 'workspace', 'history']);
  assert.equal(f.state.edges['sound-edge'].sourceId, 'sound');
});
test('last audio-edge collision or audio replacement stops before any write', () => {
  const a = fixture(); a.state.edges['sound-edge'] = { id: 'sound-edge' }; assert.throws(a.apply); assert.deepEqual(a.writes, []);
  const b = fixture(); b.nodes.sound.audioDuration = 19; assert.throws(b.apply); assert.deepEqual(b.writes, []);
});
test('v2 request carries one explicit audio track including mute/gain while preserving the dedicated task', () => {
  const f = fixture(); f.install(); f.nodes.clip.mediaClip.audioClips[0].muted = true;
  const guard = f.guard();
  assert.equal(guard.request.electronPayload.kind, 'storySequenceExport'); assert.equal(guard.request.electronPayload.args.mediaVersion, 2);
  assert.deepEqual(guard.request.electronPayload.args.audioClips, [{ kind: 'audio', src: 'output/narration.wav', start: 1, end: 5,
    timelineStart: 2, timelineEnd: 6, volume: 0.35, muted: true }]);
  assert.equal(guard.outputSource.version, 2); assert.equal(guard.request.backendBody, undefined);
});
test('original export manifest gain reaches the strict guard; substitution is rejected', () => {
  const f = fixture(); f.install(); const payload = f.payload(); payload.timeline.clips.at(-1).volume = 1;
  assert.throws(() => createStoryClipExportGuard({ store: f.store, nodeId: 'clip', payload }));
});
test('optional audio has to be explicitly bound, not appended through an unrelated edge', () => {
  const f = fixture(); const plan = buildStoryClipPlan({ ...f.planArgs, audio: null });
  f.nodes.clip = plan.node; f.state.edges = Object.fromEntries(plan.edges.map(edge => [edge.id, edge]));
  assert.deepEqual(f.guard().request.electronPayload.args.audioClips, []);
  f.nodes.clip.mediaClip.audioClips.push(f.plan.node.mediaClip.audioClips[0]); assert.throws(f.guard);
});
test('gain participates in native export cache signature without changing the default signature', () => {
  const f = fixture(), clips = f.plan.node.mediaClip.audioClips;
  assert.notEqual(buildMediaClipExportSignature({ audioClips: clips }), buildMediaClipExportSignature({ audioClips: clips.map(c => ({ ...c, volume: 0.8 })) }));
  assert.equal(buildMediaClipExportSignature({ audioClips: clips.map(c => ({ ...c, volume: 1 })) }),
    buildMediaClipExportSignature({ audioClips: clips.map(({ volume, ...c }) => c) }));
});
test('native JSON persistence retains still hold, single audio, mute/gain and source record without dispatch', () => {
  const f = fixture(); f.install();
  const saved = JSON.parse(JSON.stringify(sanitizeMultiCanvasDataForPersistence({ activeCanvasId: 'c', canvases: [{ id: 'c', nodes: Object.values(f.nodes), edges: Object.values(f.state.edges) }] })));
  const node = saved.canvases[0].nodes.find(n => n.id === 'clip');
  assert.deepEqual(node.storySequence, f.plan.node.storySequence); assert.equal(node.mediaClip.clips[0].storyImageDurationSec, 8);
  assert.equal(node.mediaClip.audioClips[0].volume, 0.35); assert.equal(saved.canvases[0].edges.length, 3);
});

const changes = {
  'identical IDs on another canvas': f => { f.state.nodes = structuredClone(f.nodes); },
  'still plan duration': f => { f.episode.shots[0].duration = 9; },
  'still prompt': f => { f.episode.shots[0].imagePrompt = 'changed'; },
  'still result': f => { f.nodes['image-0'].storyMediaResult.resultKey = 'new'; },
  'audio path': f => { f.nodes.sound.localPath = 'output/other.wav'; },
  'audio duration': f => { f.nodes.sound.audioDuration = 19; },
  'audio removal': f => { delete f.nodes.sound; },
  'audio gain': f => { f.nodes.clip.mediaClip.audioClips[0].volume = 0.5; },
  'audio mute': f => { f.nodes.clip.mediaClip.audioClips[0].muted = true; },
  'audio timeline': f => { f.nodes.clip.mediaClip.audioClips[0].timelineStartSec = 3; },
  'second audio': f => { f.nodes.clip.mediaClip.audioClips.push({ ...f.nodes.clip.mediaClip.audioClips[0] }); },
  'edge ordering': f => { f.state.edges['edge-0'].createdAt = 10; },
  'shot ordering': f => { f.episode.shots.reverse(); },
};
for (const [name, change] of Object.entries(changes)) test(`mixed guard rejects late ${name} without writing another canvas`, () => {
  const f = fixture(); f.install(); const guard = f.guard(); change(f); assert.throws(() => guard.assertCurrent()); assert.deepEqual(f.writes, []);
});
