import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStoryMediaRefs, storyMediaPrompt, createStoryMediaSource, collectStoryMediaModels,
  buildStoryMediaGenerationNode, readStoryMediaTask, buildStoryMediaResultNode, storyMediaBindingStatus } from './storyMediaModel.js';
import { createStoryWorkspace, createShot, normalizeStoryWorkspace, parseStoryWorkspaceJson, duplicateEpisode, moveStoryItem } from './storyWorkspaceModel.js';
import { sanitizeMultiCanvasDataForPersistence } from '../../utils/thumbnailPersistence.js';

const shot = { ...createShot('雨夜街道'), id: 'shot-a', imagePrompt: '<风> & "雨"\n第二行', videoPrompt: '缓慢推镜' };
const context = { workspaceNodeId: 'workspace-a', episodeId: 'episode-a', shotId: shot.id };
const model = { provider: 'vendor', model: 'vendor/model' };
function generation(kind = 'image') {
  return buildStoryMediaGenerationNode({ id: 'generation-a', ...context, shot, kind, model });
}
function success(kind = 'image') {
  const node = generation(kind); node.jobStatus = 'success'; node.generationStartTime = 123;
  node[kind === 'image' ? 'images' : 'videos'] = [{ localPath: kind === 'image' ? 'output/a.png' : 'output/a.mp4' }];
  return node;
}
function adopt(node = success(), overrides = {}) {
  const key = readStoryMediaTask(node, context, shot)?.results[0]?.key;
  return buildStoryMediaResultNode({ id: 'accepted-a', node, context, shot, index: 0, expectedKey: key, ...overrides });
}
function workspace() {
  const value = createStoryWorkspace('测试'); value.episodes[0].id = context.episodeId;
  value.episodes[0].shots = [structuredClone(shot)]; return value;
}
function manifest(kind = 'image') {
  return { ...model, modelId: model.model, displayName: 'Test', kind, outputType: kind, adapterType: 'modelApi', inputSlots: { allowedKinds: ['text'], minByKind: {} } };
}
function collect(candidate = manifest(), execution = candidate) {
  return collectStoryMediaModels([candidate], () => ({ modelManifest: candidate, executionManifest: execution }), 'image');
}

test('legacy workspace remains compatible without invented media fields', () => {
  const value = normalizeStoryWorkspace(workspace()); assert.equal('mediaRefs' in value.episodes[0].shots[0], false);
});
test('media refs are a defensive whitelist, never a credential/media payload', () => {
  const refs = normalizeStoryMediaRefs([{ kind: 'image', nodeId: 'accepted-a', apiKey: 'secret', localPath: 'output/secret.png', extra: {} }]);
  assert.deepEqual(refs, [{ kind: 'image', nodeId: 'accepted-a' }]);
});
test('refs reject invalid type, duplicate kinds, reserved ids, null and overflow', () => {
  for (const value of [null, {}, [{ kind: 'audio', nodeId: 'a' }], [{ kind: 'image', nodeId: '__proto__' }],
    [{ kind: 'image', nodeId: 'a' }, { kind: 'image', nodeId: 'b' }], Array(3).fill({ kind: 'image', nodeId: 'a' })]) {
    assert.throws(() => normalizeStoryMediaRefs(value));
  }
});
test('prompt copies only the selected textual field or description, not assets or credentials', () => {
  assert.equal(storyMediaPrompt(shot, 'video'), '缓慢推镜');
  assert.equal(storyMediaPrompt({ ...shot, imagePrompt: ' ', sourceUrl: 'https://private.invalid', apiKey: 'secret' }, 'image'), '雨夜街道');
  assert.throws(() => storyMediaPrompt({ description: ' ' }, 'image'));
  assert.throws(() => storyMediaPrompt({ imagePrompt: 'a'.repeat(20001) }, 'image'));
});
test('generation factory escapes markup and never spreads template secrets or settings', () => {
  const node = buildStoryMediaGenerationNode({ id: 'generation-a', ...context, shot, kind: 'image', model: { ...model, apiKey: 'secret', baseUrl: 'https://private.invalid', generationParams: { arbitrary: true } } });
  assert.equal(node.prompt, '&lt;风&gt; &amp; &quot;雨&quot;<br>第二行');
  assert.equal(JSON.stringify(node).includes('secret'), false); assert.equal('generationParams' in node, false);
  assert.equal('assetInputRefs' in node, false); assert.equal('isGenerating' in node, false);
});
test('sources reject missing or invalid stable ids', () => {
  assert.throws(() => createStoryMediaSource({ ...context, shot, kind: 'image', nodeId: '../x' }));
});
test('catalog requires matching registered model and execution contracts', () => {
  assert.equal(collect().length, 1);
  assert.equal(collect(manifest(), { ...manifest(), provider: 'other' }).length, 0);
  assert.equal(collect(manifest(), null).length, 0);
  assert.equal(collect({ ...manifest(), adapterType: 'workflow' }).length, 0);
});
test('catalog excludes required media inputs, other output kinds and unsafe identities', () => {
  assert.equal(collect({ ...manifest(), inputSlots: { allowedKinds: ['text', 'image'], minByKind: { image: 1 } } }).length, 0);
  assert.equal(collect({ ...manifest(), outputType: 'video' }).length, 0);
  assert.equal(collect({ ...manifest(), modelId: 'https://private.invalid' }).length, 0);
  assert.equal(collect({ ...manifest(), inputSlots: { allowedKinds: ['image'] } }).length, 0);
});
test('catalog errors are isolated and duplicate identities do not create extra choices', () => {
  const entry = manifest();
  assert.deepEqual(collectStoryMediaModels([entry], () => { throw Error('unavailable'); }, 'image'), []);
  assert.equal(collectStoryMediaModels([entry, entry], () => ({ modelManifest: entry, executionManifest: entry }), 'image').length, 1);
});
test('task matching requires workspace, episode, shot and original node identity', () => {
  const node = success();
  for (const bad of [{ workspaceNodeId: 'other' }, { episodeId: 'other' }, { shotId: 'other' }]) assert.equal(readStoryMediaTask(node, { ...context, ...bad }, shot), null);
  assert.equal(readStoryMediaTask({ ...node, id: 'cloned-node' }, context, shot), null);
});
test('reordering shots does not change media ownership', () => {
  const other = { ...shot, id: 'shot-b' }, moved = moveStoryItem([shot, other], shot.id, 1);
  assert.equal(readStoryMediaTask(success(), context, moved[1]).current, true);
});
test('changed prompt prevents adoption while original generation results are retained', () => {
  const node = success(), changed = { ...shot, imagePrompt: '改变' };
  assert.equal(readStoryMediaTask(node, context, changed).current, false);
  assert.throws(() => adopt(node, { shot: changed })); assert.equal(node.images.length, 1);
});
test('pending, unknown and failed tasks cannot expose stale successful outputs for adoption', () => {
  for (const jobStatus of ['running', 'pending', 'queued', 'error', 'cancelled', '', undefined]) {
    const node = { ...success(), jobStatus }; assert.equal(readStoryMediaTask(node, context, shot).results.length, 0); assert.throws(() => adopt(node));
  }
  assert.equal(readStoryMediaTask({ ...success(), isGenerating: true }, context, shot).results.length, 0);
});
test('multiple results retain actual indices and reject individual failures', () => {
  const node = success(); node.images = [{ error: 'failed', localPath: 'output/a.png' }, { localPath: 'output/b.png' }];
  const task = readStoryMediaTask(node, context, shot); assert.equal(task.results.length, 1); assert.equal(task.results[0].index, 1);
  const accepted = adopt(node, { index: 1 }); assert.equal(accepted.localPath, 'output/b.png');
});
test('single video result fields can be adopted without an array', () => {
  const node = success('video'); delete node.videos; node.videoUrl = '/output/clip.mp4';
  assert.equal(adopt(node).type, 'source-video');
});
test('an old selection cannot silently adopt a different result or generation attempt', () => {
  const node = success(), key = readStoryMediaTask(node, context, shot).results[0].key;
  node.images[0].localPath = 'output/b.png'; assert.throws(() => adopt(node, { expectedKey: key }));
  node.images[0].localPath = 'output/a.png'; node.generationStartTime++; assert.throws(() => adopt(node, { expectedKey: key }));
});
test('a bad explicit original is never replaced with a local thumbnail or proxy', () => {
  const node = success(); node.images = [{ originalLocalPath: 'https://remote.invalid/a.png', localPath: 'output/thumb.png', thumbUrl: '/output/thumb.png' }];
  assert.equal(readStoryMediaTask(node, context, shot).results.length, 0);
  node.images = [{ thumbUrl: '/output/thumb.png' }]; assert.equal(readStoryMediaTask(node, context, shot).results.length, 0);
});
for (const path of ['https://remote.invalid/a.png', 'blob:temporary', 'data:image/png;base64,aaa', 'file:///C:/a.png', '../output/a.png', 'output/../a.png', 'output/a.mp4', '//host/output/a.png']) {
  test(`image result refuses unsafe or mismatched original: ${path}`, () => {
    const node = success(); node.images = [{ localPath: path }]; assert.equal(readStoryMediaTask(node, context, shot).results.length, 0);
  });
}
test('accepted node is an independent standard source node, not a live pointer to regenerated outputs', () => {
  const node = success(), accepted = adopt(node); node.images[0].localPath = 'output/new.png';
  assert.equal(accepted.localPath, 'output/a.png'); assert.equal(accepted.src, '/output/a.png');
  assert.equal('model' in accepted, false); assert.equal('images' in accepted, false);
  const ref = { kind: 'image', nodeId: accepted.id };
  assert.match(storyMediaBindingStatus(ref, { [accepted.id]: accepted }, context, shot), /已关联本地/);
});
test('binding survives a missing generation node but reports a missing accepted source node', () => {
  const accepted = adopt(), ref = { kind: 'image', nodeId: accepted.id };
  assert.match(storyMediaBindingStatus(ref, { [accepted.id]: accepted }, context, shot), /已关联本地/);
  assert.match(storyMediaBindingStatus(ref, {}, context, shot), /已缺失/);
});
test('binding detects foreign workspace, changed accepted media and stale shot prompt', () => {
  const accepted = adopt(), ref = { kind: 'image', nodeId: accepted.id }, nodes = { [accepted.id]: accepted };
  assert.match(storyMediaBindingStatus(ref, nodes, { ...context, workspaceNodeId: 'other' }, shot), /来源不符/);
  assert.match(storyMediaBindingStatus(ref, nodes, context, { ...shot, imagePrompt: '新提示' }), /旧提示词/);
  accepted.src = '/output/different.png'; assert.match(storyMediaBindingStatus(ref, nodes, context, shot), /已更换/);
});
test('workspace JSON preserves refs without requiring referenced nodes or a model catalog', () => {
  const value = workspace(); value.episodes[0].shots[0].mediaRefs = [{ kind: 'image', nodeId: 'missing-result' }];
  assert.deepEqual(parseStoryWorkspaceJson(JSON.stringify(value)).episodes[0].shots[0].mediaRefs, value.episodes[0].shots[0].mediaRefs);
});
test('duplicating an episode clears media ownership and keeps original refs intact', () => {
  const value = workspace(); value.episodes[0].shots[0].mediaRefs = [{ kind: 'image', nodeId: 'accepted-a' }];
  const copy = duplicateEpisode(value.episodes[0]); assert.equal(copy.shots[0].mediaRefs, undefined);
  assert.notEqual(copy.shots[0].id, shot.id); assert.equal(value.episodes[0].shots[0].mediaRefs.length, 1);
});
test('actual persistence sanitizer plus JSON roundtrip preserves source tags and selected results', () => {
  const accepted = adopt(), value = workspace(); value.episodes[0].shots[0].mediaRefs = [{ kind: 'image', nodeId: accepted.id }];
  const data = { activeCanvasId: 'canvas-a', canvases: [{ id: 'canvas-a', nodes: [
    { id: context.workspaceNodeId, type: 'story-workspace', storyWorkspace: value }, success(), accepted,
  ], edges: [] }] };
  const saved = JSON.parse(JSON.stringify(sanitizeMultiCanvasDataForPersistence(data)));
  const nodes = Object.fromEntries(saved.canvases[0].nodes.map(node => [node.id, node]));
  const restored = normalizeStoryWorkspace(nodes[context.workspaceNodeId].storyWorkspace), restoredShot = restored.episodes[0].shots[0];
  assert.equal(readStoryMediaTask(nodes['generation-a'], context, restoredShot).results.length, 1);
  assert.match(storyMediaBindingStatus(restoredShot.mediaRefs[0], nodes, context, restoredShot), /已关联本地/);
});
test('result collections are bounded instead of silently dropping items', () => {
  const node = success(); node.images = Array(101).fill({ localPath: 'output/a.png' });
  assert.equal(readStoryMediaTask(node, context, shot).results.length, 0);
});
