import test from 'node:test';
import assert from 'node:assert/strict';
import { createEpisode, createShot, createStoryWorkspace, episodeStoryboardRows } from './storyWorkspaceModel.js';
import { parseStoryAiJson, createStoryAiTask, parseStoryAiProposal } from './storyAiModel.js';
import { createStoryAiShotsTask, parseStoryAiShotsProposal, mergeStoryAiShotsProposal } from './storyAiShotsModel.js';
function fixture() {
  const workspace = createStoryWorkspace();
  workspace.synopsis = 'NOT_SENT_SYNOPSIS';
  workspace.episodes[0].script = '甲进入站台。\r\n\r\n甲说：“你好”。\n\n雨停了。😀  ';
  workspace.episodes.push(createEpisode('其他集', 'NOT_SENT_EPISODE'));
  workspace.characters.push({ id: 'char-one', name: '甲', description: '穿灰外套', referenceNodeId: 'PRIVATE_IMAGE_NODE' },
    { id: 'char-secret', name: '乙', description: 'NOT_SENT_UNSELECTED', referenceNodeId: '' });
  workspace.scenes.push({ id: 'scene-one', name: '站台', description: '有长椅', referenceNodeId: 'scene-image' });
  const task = createStoryAiShotsTask(workspace, workspace.episodes[0].id, { count: 2, characterIds: ['char-one'], sceneIds: ['scene-one'], direction: '节奏舒缓' });
  return { workspace, task };
}
function response() {
  return { schemaVersion: 'story-ai-shots.v1', shots: [
    { start: 1, end: 2, duration: 5, size: '中景', scene: 'S1', characters: ['C1'], description: '甲进入站台并打招呼', dialogue: '你好', action: '走入', mood: '', characterNotes: '', imagePrompt: '站台上的甲', videoPrompt: '缓慢推进', sound: '' },
    { start: 2, end: 3, duration: 4, size: '近景', scene: 'S1', characters: ['C1'], description: '雨停，甲抬头', dialogue: '', action: '抬头', mood: '', characterNotes: '', imagePrompt: '雨后站台', videoPrompt: '镜头轻微上移', sound: '雨声减弱' },
  ] };
}
function parse(task, value = response()) { return parseStoryAiShotsProposal(JSON.stringify(value), task); }

test('request only includes explicitly selected names/descriptions; no internal IDs, other episodes or bindings', () => {
  const { task } = fixture();
  const payload = task.systemPrompt + task.prompt;
  for (const hidden of ['char-one', 'scene-one', 'PRIVATE_IMAGE_NODE', 'scene-image', 'NOT_SENT_SYNOPSIS', 'NOT_SENT_EPISODE', 'NOT_SENT_UNSELECTED']) assert.ok(!payload.includes(hidden), hidden);
  assert.ok(payload.includes('穿灰外套')); assert.ok(payload.includes('C1')); assert.ok(payload.includes('节奏舒缓'));
});
test('no context is sent by default', () => {
  const { workspace } = fixture(), task = createStoryAiShotsTask(workspace, workspace.episodes[0].id);
  assert.equal(task.context.characters.length, 0); assert.equal(task.context.scenes.length, 0); assert.ok(!task.prompt.includes('穿灰外套'));
});
test('shot count, direction and asset selection are bounded before sending', () => {
  const { workspace } = fixture(), id = workspace.episodes[0].id;
  for (const count of [0, 33, 2.5, NaN]) assert.throws(() => createStoryAiShotsTask(workspace, id, { count }));
  assert.throws(() => createStoryAiShotsTask(workspace, id, { direction: 'x'.repeat(1001) }));
  assert.throws(() => createStoryAiShotsTask(workspace, id, { characterIds: ['missing'] }));
  assert.throws(() => createStoryAiShotsTask(workspace, id, { characterIds: ['char-one', 'char-one'] }));
});
test('overlong selected descriptions and too many selected assets are rejected, not trimmed', () => {
  const { workspace } = fixture(), id = workspace.episodes[0].id;
  workspace.characters[0].description = 'x'.repeat(4001);
  assert.throws(() => createStoryAiShotsTask(workspace, id, { characterIds: ['char-one'] }));
  workspace.characters = Array.from({ length: 21 }, (_, index) => ({ id: `c-${index}`, name: '甲', description: '', referenceNodeId: '' }));
  assert.throws(() => createStoryAiShotsTask(workspace, id, { characterIds: workspace.characters.map(item => item.id) }));
});
test('combined prompt limit also covers context and escaped source text', () => {
  const { workspace } = fixture(); workspace.episodes[0].script = 'x'.repeat(39000);
  workspace.characters = Array.from({ length: 3 }, (_, index) => ({ id: `c-${index}`, name: '甲', description: 'y'.repeat(3990), referenceNodeId: '' }));
  assert.throws(() => createStoryAiShotsTask(workspace, workspace.episodes[0].id, { characterIds: workspace.characters.map(item => item.id) }));
});
test('total context limit rejects otherwise valid individual descriptions', () => {
  const { workspace } = fixture();
  workspace.characters = Array.from({ length: 5 }, (_, index) => ({ id: `c-${index}`, name: '甲', description: 'x'.repeat(3500), referenceNodeId: '' }));
  assert.throws(() => createStoryAiShotsTask(workspace, workspace.episodes[0].id, { characterIds: workspace.characters.map(item => item.id) }));
});
test('per-episode capacity is checked before requesting the full proposal', () => {
  const { workspace } = fixture(); workspace.episodes[0].shots = Array.from({ length: 299 }, () => createShot());
  assert.throws(() => createStoryAiShotsTask(workspace, workspace.episodes[0].id, { count: 2 }));
});
test('whole-workspace shot capacity is checked before request', () => {
  const { workspace } = fixture(); workspace.episodes[0].shots.push(createShot());
  for (let i = 0; i < 6; i++) { const episode = createEpisode(); episode.shots = Array.from({ length: 300 }, () => createShot()); workspace.episodes.push(episode); }
  workspace.episodes[1].shots = Array.from({ length: 198 }, () => createShot());
  assert.throws(() => createStoryAiShotsTask(workspace, workspace.episodes[0].id, { count: 2 }));
});
test('JSON fenced response resolves aliases to stable local IDs', () => {
  const { task } = fixture(), proposal = parseStoryAiShotsProposal('```json\n' + JSON.stringify(response()) + '\n```', task);
  assert.deepEqual(proposal.shots[0].characterIds, ['char-one']); assert.equal(proposal.shots[0].sceneId, 'scene-one');
  assert.equal(proposal.sourceScript, task.source.text);
});
test('wrong version, count, mixed prose and oversized JSON are rejected', () => {
  const { task } = fixture();
  const wrong = response(); wrong.schemaVersion = 'unknown'; assert.throws(() => parse(task, wrong));
  const few = response(); few.shots.pop(); assert.throws(() => parse(task, few));
  assert.throws(() => parseStoryAiShotsProposal('说明' + JSON.stringify(response()), task));
  assert.throws(() => parseStoryAiShotsProposal(' '.repeat(262145), task));
});
test('coverage forbids gaps, backwards ranges, bounds violations and omitted ending', () => {
  const { task } = fixture();
  for (const ranges of [[[2, 2], [2, 3]], [[1, 1], [3, 3]], [[1, 3], [2, 2]], [[1, 2], [2, 2]], [[1, 2], [2, 4]], [[1, 2], [0, 3]]]) {
    const value = response(); ranges.forEach(([start, end], i) => Object.assign(value.shots[i], { start, end })); assert.throws(() => parse(task, value));
  }
});
test('multiple shots may share the same paragraph without losing source coverage', () => {
  const { workspace } = fixture(); workspace.episodes[0].script = '一个段落，可拆成多个镜头。';
  const task = createStoryAiShotsTask(workspace, workspace.episodes[0].id, { count: 2 });
  const value = response(); value.shots.forEach(shot => Object.assign(shot, { start: 1, end: 1, characters: [], scene: '' }));
  assert.equal(parse(task, value).shots.length, 2);
});
test('non-numeric, zero, negative, oversized durations and invalid text are rejected', () => {
  const { task } = fixture();
  for (const duration of ['5', 0, 0.01, -1, 121, null]) { const value = response(); value.shots[0].duration = duration; assert.throws(() => parse(task, value)); }
  for (const description of ['', 'x'.repeat(2001), {}]) { const value = response(); value.shots[0].description = description; assert.throws(() => parse(task, value)); }
});
test('unknown or duplicate asset aliases cannot become project references', () => {
  const { task } = fixture();
  for (const characters of [['C2'], ['甲'], ['C1', 'C1'], ['__proto__'], null]) { const value = response(); value.shots[0].characters = characters; assert.throws(() => parse(task, value)); }
  const value = response(); value.shots[0].scene = 'S99'; assert.throws(() => parse(task, value));
});
test('merge appends only selected shots with fresh IDs, preserving manual content and source', () => {
  const { workspace, task } = fixture(); workspace.episodes[0].shots.push(createShot('人工镜头'));
  const before = JSON.stringify(workspace), proposal = parse(task); proposal.shots[1].id = 'untrusted-model-id';
  const result = mergeStoryAiShotsProposal(workspace, proposal, [1]);
  assert.equal(JSON.stringify(workspace), before); assert.equal(result.firstShotIndex, 1); assert.equal(result.added, 1);
  assert.equal(result.workspace.episodes[0].shots.length, 2); assert.equal(result.workspace.episodes[0].shots[0].description, '人工镜头');
  assert.equal(result.workspace.episodes[0].script, task.source.text); assert.notEqual(result.workspace.episodes[0].shots[1].id, 'untrusted-model-id');
});
test('selection preserves proposal order and rejects empty, repeated or invalid indices', () => {
  const { workspace, task } = fixture(), proposal = parse(task);
  for (const indices of [[], [0, 0], [-1], [2], ['0']]) assert.throws(() => mergeStoryAiShotsProposal(workspace, proposal, indices));
  const result = mergeStoryAiShotsProposal(workspace, proposal, [1, 0]);
  assert.equal(result.workspace.episodes[0].shots[0].description, proposal.shots[0].description);
});
test('changed source text, deleted episode or changed selected asset blocks stale merge', () => {
  for (const mutate of [w => { w.episodes[0].script += '改动'; }, w => { w.episodes.shift(); }, w => { w.characters[0].description = '新设定'; }, w => { w.scenes = []; }]) {
    const { workspace, task } = fixture(), proposal = parse(task); mutate(workspace); const before = JSON.stringify(workspace);
    assert.throws(() => mergeStoryAiShotsProposal(workspace, proposal, [0])); assert.equal(JSON.stringify(workspace), before);
  }
});
test('merge capacity failure is atomic and does not append the first shot partially', () => {
  const { workspace, task } = fixture(), proposal = parse(task); workspace.episodes[0].shots = Array.from({ length: 299 }, () => createShot());
  const before = JSON.stringify(workspace); assert.throws(() => mergeStoryAiShotsProposal(workspace, proposal, [0, 1])); assert.equal(JSON.stringify(workspace), before);
});
test('generated fields and bound references reach the existing storyboard row mapper', () => {
  const { workspace, task } = fixture(), result = mergeStoryAiShotsProposal(workspace, parse(task), [0]);
  const rows = episodeStoryboardRows(result.workspace, result.workspace.episodes[0], { PRIVATE_IMAGE_NODE: { type: 'source-image', src: '/api/v2/assets/character.png' }, 'scene-image': { type: 'source-image', src: '/api/v2/assets/scene.png' } });
  assert.equal(rows[0]['对白'], '你好'); assert.equal(rows[0]['角色'], '甲'); assert.equal(rows[0]['场景'], '站台'); assert.equal(rows[0]['时长'], '5');
  assert.equal(rows[0]['角色描述'], '甲：穿灰外套'); assert.equal(rows[0]['角色图'], '/api/v2/assets/character.png'); assert.equal(rows[0]['参考'], '/api/v2/assets/scene.png');
});
test('shared JSON helper keeps prior split parser contract intact', () => {
  assert.throws(() => parseStoryAiJson('[]'));
  const task = createStoryAiTask('第一段\n\n第二段', 'split', 1);
  const value = { schemaVersion: 'story-ai-split.v1', episodes: [{ title: '一集', start: 1, end: 2, summary: '' }] };
  assert.equal(parseStoryAiProposal(JSON.stringify(value), task).episodes[0].script, task.source.text);
});
