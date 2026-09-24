import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryWorkspace, createEpisode } from './storyWorkspaceModel.js';
import { prepareStoryAiSource, createStoryAiTask, parseStoryAiProposal, mergeStoryAiProposal, storyAssetNameKey } from './storyAiModel.js';
const original = '  第一段 😀\r\n\r\n第二段\n\n\n第三段  \n\n';
function splitResponse() {
  return { schemaVersion: 'story-ai-split.v1', episodes: [
    { title: '第一集', start: 1, end: 1, summary: '开端' }, { title: '第二集', start: 2, end: 3, summary: '后续' },
  ] };
}
function assetsResponse() {
  return { schemaVersion: 'story-ai-assets.v1', characters: [{ name: '甲', description: '原文人物', evidence: [1] }], scenes: [{ name: '站台', description: '原文场景', evidence: [2] }] };
}
test('paragraph mapping preserves whitespace, CRLF and Unicode exactly', () => {
  const source = prepareStoryAiSource(original);
  assert.equal(source.paragraphs.length, 3); assert.equal(source.paragraphs.map(p => p.text).join(''), original);
  assert.equal(source.paragraphs[0].start, 0); assert.equal(source.paragraphs.at(-1).end, original.length);
});
test('source limits never silently truncate or trigger automatic batching', () => {
  assert.throws(() => prepareStoryAiSource(' ')); assert.throws(() => prepareStoryAiSource('x'.repeat(40001)));
  assert.throws(() => prepareStoryAiSource(Array(401).fill('段落').join('\n\n')));
});
test('target count is bounded by available paragraphs', () => {
  assert.throws(() => createStoryAiTask('一段', 'split', 2)); assert.throws(() => createStoryAiTask(original, 'split', 1.5));
  assert.throws(() => createStoryAiTask(original, 'unknown'));
});
test('split plan takes scripts only from original, ignoring model-provided replacements', () => {
  const task = createStoryAiTask(original, 'split', 2), response = splitResponse();
  response.episodes[0].script = '模型改写内容不应被使用';
  const result = parseStoryAiProposal(JSON.stringify(response), task);
  assert.equal(result.episodes.map(e => e.script).join(''), original);
  assert.ok(!result.episodes[0].script.includes('模型改写'));
});
test('overlapping, omitted and reordered paragraph ranges are rejected', () => {
  const task = createStoryAiTask(original, 'split', 2);
  for (const [start, end] of [[1, 3], [3, 3], [2, 2], [2, 4], ['2', 3]]) {
    const response = splitResponse(); response.episodes[1].start = start; response.episodes[1].end = end;
    assert.throws(() => parseStoryAiProposal(JSON.stringify(response), task));
  }
});
test('only JSON or one JSON fence is accepted; explanation and wrong schema fail', () => {
  const task = createStoryAiTask(original, 'split', 2), raw = JSON.stringify(splitResponse());
  assert.equal(parseStoryAiProposal('```json\n' + raw + '\n```', task).episodes.length, 2);
  assert.throws(() => parseStoryAiProposal('说明文字' + raw, task));
  assert.throws(() => parseStoryAiProposal(JSON.stringify(assetsResponse()), task));
});
test('assets need valid evidence numbers and unique normalized names', () => {
  const task = createStoryAiTask(original, 'assets');
  for (const evidence of [[], [0], [4], ['1']]) { const value = assetsResponse(); value.characters[0].evidence = evidence; assert.throws(() => parseStoryAiProposal(JSON.stringify(value), task)); }
  const value = assetsResponse(); value.characters = [{ name: 'Ａ', description: 'x', evidence: [1] }, { name: 'a', description: 'y', evidence: [2] }];
  assert.throws(() => parseStoryAiProposal(JSON.stringify(value), task)); assert.equal(storyAssetNameKey(' Ａ '), 'a');
});
test('merge preserves old manual descriptions and image references on name conflict', () => {
  const workspace = createStoryWorkspace(); workspace.characters.push({ id: 'char-1', name: '甲', description: '手工设定', referenceNodeId: 'image-1' });
  const proposal = parseStoryAiProposal(JSON.stringify(assetsResponse()), createStoryAiTask(original, 'assets'));
  const result = mergeStoryAiProposal(workspace, proposal, { characters: [0], scenes: [0] });
  assert.equal(result.skipped, 1); assert.equal(result.added, 1); assert.equal(workspace.scenes.length, 0);
  assert.equal(result.workspace.characters[0].description, '手工设定'); assert.equal(result.workspace.characters[0].referenceNodeId, 'image-1');
});
test('unchecked assets are not silently imported', () => {
  const proposal = parseStoryAiProposal(JSON.stringify(assetsResponse()), createStoryAiTask(original, 'assets'));
  assert.throws(() => mergeStoryAiProposal(createStoryWorkspace(), proposal, { characters: [], scenes: [] }));
});
test('split merge appends with fresh IDs and leaves the source episode unchanged', () => {
  const workspace = createStoryWorkspace(); workspace.episodes[0].script = original;
  const proposal = parseStoryAiProposal(JSON.stringify(splitResponse()), createStoryAiTask(original, 'split', 2));
  const result = mergeStoryAiProposal(workspace, proposal);
  assert.equal(workspace.episodes.length, 1); assert.equal(result.workspace.episodes.length, 3);
  assert.equal(result.workspace.episodes[0].script, original);
  assert.notEqual(result.workspace.episodes[1].id, workspace.episodes[0].id);
});
test('capacity errors are atomic and do not partially merge', () => {
  const workspace = createStoryWorkspace(); workspace.episodes = Array.from({ length: 100 }, () => createEpisode());
  const proposal = parseStoryAiProposal(JSON.stringify(splitResponse()), createStoryAiTask(original, 'split', 2));
  assert.throws(() => mergeStoryAiProposal(workspace, proposal)); assert.equal(workspace.episodes.length, 100);
});
