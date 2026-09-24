import test from 'node:test';
import { sanitizeMultiCanvasDataForPersistence } from '../../utils/thumbnailPersistence.js';
import assert from 'node:assert/strict';
import { createStoryWorkspace, createShot } from './storyWorkspaceModel.js';
import { createStoryMediaSource } from './storyMediaModel.js';
import { STORY_REFERENCE_VIDEO_MODEL, getStoryReferenceVideoModel, readStoryAcceptedImage, buildStoryReferenceVideoPlan, createStoryReferenceVideoGuard, assertStoryReferenceSource } from './storyReferenceVideo.js';
import { vendorVideoModelApiModelManifests, vendorVideoModelApiExecutionManifests } from '../../manifests/video/modelApi/vendorVideoModelApiManifests.js';
import { getModelApiBodyResolver, getModelApiEndpointResolver } from '../../../api/adapters/modelApiResolvers/index.js';
import { applyStoryWorkspaceDraft } from './storyWorkspaceApply.js';
import { normalizeStoryWorkspace } from './storyWorkspaceModel.js';

function execution() {
  const modelManifest = vendorVideoModelApiModelManifests.find(item => item.modelId === STORY_REFERENCE_VIDEO_MODEL);
  const executionManifest = vendorVideoModelApiExecutionManifests.find(item => item.id === 'runninghub.model-api.video.seedance-2.v1');
  return { modelManifest, executionManifest };
}
function fixture() {
  const workspace = createStoryWorkspace('首帧'), shot = createShot('雨夜');
  const episode = workspace.episodes[0]; episode.shots = [shot];
  const context = { workspaceNodeId: 'workspace', episodeId: episode.id, shotId: shot.id };
  const image = { id: 'image', type: 'source-image', src: '/output/a.png', localPath: 'output/a.png', originalLocalPath: 'output/a.png',
    storyMediaResult: { ...createStoryMediaSource({ ...context, shot, kind: 'image', nodeId: 'image' }), localPath: 'output/a.png', resultKey: 'image-result-1' } };
  shot.mediaRefs = [{ kind: 'image', nodeId: image.id }];
  const nodes = { workspace: { id: 'workspace', type: 'story-workspace', storyWorkspace: workspace }, image };
  const model = getStoryReferenceVideoModel(execution);
  const plan = buildStoryReferenceVideoPlan({ id: 'video', edgeId: 'edge', nodes, ...context, shot, model });
  nodes.video = plan.node;
  const state = { nodes, edges: { edge: plan.edge } };
  const store = { getStateRaw: () => state, getIncomingEdges: id => Object.values(state.edges).filter(edge => edge.targetId === id) };
  const guard = () => createStoryReferenceVideoGuard({ store, nodeId: 'video', resolveExecution: execution });
  const payload = () => ({ provider: 'runninghub', model: STORY_REFERENCE_VIDEO_MODEL, prompt: '雨夜', generationParams: { rh_seedance_2_mode: 'image2video' },
    inputUrls: ['/output/a.png'], images: ['/output/a.png'], inputUrlsBySlot: { firstFrame: '/output/a.png' } });
  return { nodes, shot, context, state, store, guard, payload, plan, image, workspace };
}
test('actual native manifests qualify one explicit modelApi first-frame family', () => {
  assert.equal(getStoryReferenceVideoModel(execution).model, STORY_REFERENCE_VIDEO_MODEL);
  const bad = execution(); bad.executionManifest = { ...bad.executionManifest, adapterType: 'workflow' };
  assert.throws(() => getStoryReferenceVideoModel(() => bad));
});
test('accepted image plan whitelists provenance and uses the original fixed edge slot', () => {
  const f = fixture(); f.image.apiKey = 'never-copy'; f.image.serviceUrl = 'never-copy';
  const result = readStoryAcceptedImage({ nodes: f.nodes, shot: f.shot, context: f.context });
  assert.deepEqual(Object.keys(result).sort(), ['imageNodeId', 'localPath', 'resultKey']);
  assert.equal(f.plan.edge.refSlot, 'firstFrame'); assert.equal(f.plan.node.generationParams.rh_seedance_2_mode, 'image2video');
  assert.equal(f.plan.node.apiKey, undefined); assert.equal(f.plan.node.storyMediaBatch, undefined);
});
test('ordinary native video has no extra guard or confirmation', () => {
  const f = fixture(); delete f.nodes.video.storyMediaReference;
  assert.equal(f.guard(), null);
});
test('confirmation permits one native send, not callback retries', () => {
  const f = fixture(), guard = f.guard(); guard.assertCurrent(f.payload()); guard.beforeSend(f.payload());
  assert.throws(() => guard.beforeSend(f.payload()), /不自动重试/);
});
test('old generation results and native random seed do not block a new manual confirmation', () => {
  const f = fixture(), guard = f.guard();
  f.nodes.video.videoUrl = '/output/old.mp4'; f.nodes.video.videos = [{ localPath: 'output/old.mp4' }]; f.nodes.video.jobStatus = 'success';
  f.nodes.video.generationParams.seed = 42; guard.assertCurrent({ ...f.payload(), generationParams: { ...f.payload().generationParams, seed: 42 } });
});
test('DOM serialization of plain quote entities is not mistaken for edited prompt', () => {
  const f = fixture(); f.shot.videoPrompt = '他说 "走吧"'; f.nodes.video.storyMediaSource.promptText = f.shot.videoPrompt;
  f.nodes.video.prompt = '他说 &quot;走吧&quot;';
  assert.ok(createStoryReferenceVideoGuard({ store: f.store, nodeId: 'video', resolveExecution: execution, getPromptHtml: () => '他说 "走吧"' }));
});
const changes = {
  'canvas switch': f => { f.state.nodes = { ...f.nodes }; },
  'deleted workspace': f => { delete f.nodes.workspace; },
  'changed shot text': f => { f.shot.description = 'changed'; },
  'changed image prompt': f => { f.shot.imagePrompt = 'changed'; },
  'changed accepted binding': f => { f.shot.mediaRefs = []; },
  'changed result identity': f => { f.image.storyMediaResult.resultKey = 'new-result'; },
  'changed actual original path': f => { f.image.originalLocalPath = 'output/other.png'; },
  'changed source src': f => { f.image.src = '/output/other.png'; },
  'remote image': f => { f.image.originalLocalPath = 'https://example.org/a.png'; },
  'missing edge': f => { f.state.edges = {}; },
  'extra edge': f => { f.state.edges.extra = { id: 'extra', sourceId: 'image', targetId: 'video' }; },
  'last frame slot': f => { f.plan.edge.refSlot = 'lastFrame'; },
  'changed model': f => { f.nodes.video.model = 'other'; },
  'changed mode': f => { f.nodes.video.generationParams.rh_seedance_2_mode = 'text2video'; },
  'changed duration': f => { f.nodes.video.generationParams.duration = 10; },
  'asset reference': f => { f.nodes.video.promptAssetInputRefs = [{ type: 'image', url: '/output/other.png' }]; },
  'rich prompt reference': f => { f.nodes.video.prompt = '<span data-node-id="other">image</span>'; },
};
for (const [name, change] of Object.entries(changes)) test(`blocks ${name} across asynchronous preparation`, () => {
  const f = fixture(), guard = f.guard(); change(f); assert.throws(() => guard.assertCurrent(f.payload()));
});
test('actual payload cannot substitute input, extra media, mode, price-relevant parameters or preset prompt', () => {
  const f = fixture(), guard = f.guard();
  for (const patch of [
    { images: ['/output/other.png'] }, { inputUrlsBySlot: { lastFrame: '/output/a.png' } },
    { videos: ['/output/v.mp4'] }, { assetInputRefs: [{ url: '/output/a.png' }] },
    { prompt: 'preset override' }, { generationParams: { rh_seedance_2_mode: 'image2video', duration: 15 } },
  ]) assert.throws(() => guard.assertCurrent({ ...f.payload(), ...patch }));
});
test('source-only result adoption does not need a live model catalog', () => {
  const f = fixture(); assert.equal(assertStoryReferenceSource({ node: f.nodes.video, nodes: f.nodes, shot: f.shot }).imageNodeId, 'image');
  f.shot.mediaRefs = []; assert.throws(() => assertStoryReferenceSource({ node: f.nodes.video, nodes: f.nodes, shot: f.shot }));
});
test('native body and endpoint resolvers map image2video to a firstFrameUrl, not a text route', () => {
  const payload = fixture().payload();
  const body = getModelApiBodyResolver('runninghubSeedance2Video')({ currentBody: { prompt: payload.prompt, rh_seedance_2_mode: 'image2video' }, payload,
    inputImages: ['https://media.example/a.png'], finalUrlsBySlot: { firstFrame: 'https://media.example/a.png' } });
  assert.equal(body.firstFrameUrl, 'https://media.example/a.png'); assert.equal(body.lastFrameUrl, undefined);
  assert.match(getModelApiEndpointResolver('runninghubSeedance2VideoEndpoint')({ payload }), /image-to-video$/);
});
function applyFixture() {
  const f = fixture(), writes = []; delete f.nodes.video; f.state.edges = {};
  Object.assign(f.store, { addNode: node => { writes.push('node'); f.nodes[node.id] = node; },
    addEdge: edge => { writes.push('edge'); f.state.edges[edge.id] = edge; },
    updateNodeData: (id, data) => { writes.push('workspace'); Object.assign(f.nodes[id], data); } });
  const args = { store: f.store, commit: () => writes.push('commit'), nodeId: 'workspace', nodesContext: f.nodes,
    baseSignature: JSON.stringify(normalizeStoryWorkspace(f.workspace)), draft: f.workspace, additionalNodes: [f.plan.node], additionalEdges: [f.plan.edge] };
  return { ...f, args, writes };
}
test('explicit apply creates node and native edge with one history commit, without generation', () => {
  const f = applyFixture(); applyStoryWorkspaceDraft(f.args); assert.deepEqual(f.writes, ['node', 'edge', 'workspace', 'commit']);
});
test('edge collision fails before any partial planned write', () => {
  const f = applyFixture(); f.state.edges.edge = { id: 'edge' };
  assert.throws(() => applyStoryWorkspaceDraft(f.args)); assert.deepEqual(f.writes, []);
});
test('changed image path fails apply preflight before node creation', () => {
  const f = applyFixture(); f.image.src = '/output/changed.png';
  assert.throws(() => applyStoryWorkspaceDraft(f.args)); assert.deepEqual(f.writes, []);
});
test('reference nodes cannot be applied without their edge or mixed into the pure-text batch', () => {
  const f = applyFixture();
  assert.throws(() => applyStoryWorkspaceDraft({ ...f.args, additionalEdges: [] }));
  f.plan.node.storyMediaBatch = { version: 1, batchId: 'b', state: 'held' };
  assert.throws(() => applyStoryWorkspaceDraft(f.args)); assert.deepEqual(f.writes, []);
});

test('accepted video retains frame provenance and detects later image reassociation', () => {
  const f = fixture();
  const node = { storyMediaResult: { ...f.nodes.video.storyMediaSource, referenceImage: { ...f.nodes.video.storyMediaReference } } };
  assert.equal(assertStoryReferenceSource({ node, nodes: f.nodes, shot: f.shot }).localPath, 'output/a.png');
  f.shot.mediaRefs = []; assert.throws(() => assertStoryReferenceSource({ node, nodes: f.nodes, shot: f.shot }));
});
test('thumbnail/display derivative updates do not silently replace the original first frame', () => {
  const f = fixture(), guard = f.guard();
  f.image.displayLocalPath = 'output/display.webp'; f.image.thumbLocalPath = 'output/thumb.webp';
  guard.assertCurrent(f.payload());
});

test('native persistence sanitizer retains first-frame edge and provenance without authorizing a resend', () => {
  const f = fixture();
  const data = { activeCanvasId: 'canvas', canvases: [{ id: 'canvas', nodes: Object.values(f.nodes), edges: [f.plan.edge] }] };
  const saved = JSON.parse(JSON.stringify(sanitizeMultiCanvasDataForPersistence(data)));
  const video = saved.canvases[0].nodes.find(node => node.id === 'video');
  assert.deepEqual(video.storyMediaReference, f.plan.node.storyMediaReference);
  assert.equal(saved.canvases[0].edges[0].refSlot, 'firstFrame');
  assert.equal(video.storyMediaBatch, undefined); // No restored queue or durable send authorization.
});