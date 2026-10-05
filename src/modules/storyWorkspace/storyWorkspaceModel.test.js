import test from 'node:test';
import assert from 'node:assert/strict';
import { STORY_WORKSPACE_SCHEMA, createStoryWorkspace, createEpisode, createShot, normalizeStoryWorkspace,
  parseStoryWorkspaceJson, draftShotsFromScript, duplicateEpisode, removeStoryAsset, moveStoryItem,
  episodeStoryboardRows, collectStoryboardEpisode, storyEpisodeCsv, storyWorkspaceMarkdown } from './storyWorkspaceModel.js';
function sample() {
  const workspace = createStoryWorkspace('故事');
  workspace.characters.push({ id: 'char-a', name: '甲', description: '红衣', referenceNodeId: 'img-a' });
  workspace.scenes.push({ id: 'scene-a', name: '站台', description: '雨夜', referenceNodeId: '' });
  workspace.episodes[0].shots.push({ ...createShot('列车进站'), sceneId: 'scene-a', characterIds: ['char-a'] });
  return workspace;
}
test('schema and JSON round trip preserve editable data', () => {
  const value = normalizeStoryWorkspace(sample());
  assert.deepEqual(parseStoryWorkspaceJson(JSON.stringify(value)), value);
  assert.throws(() => parseStoryWorkspaceJson('{"schemaVersion":"other"}'));
  assert.equal(value.schemaVersion, STORY_WORKSPACE_SCHEMA);
});
test('normalization is a defensive copy, not a mutation of snapshots', () => {
  const original = sample(), copy = normalizeStoryWorkspace(original);
  copy.episodes[0].shots[0].description = '改变';
  assert.equal(original.episodes[0].shots[0].description, '列车进站');
});
test('duplicate IDs, dangling references and invalid durations are rejected', () => {
  const value = sample(); value.episodes.push(value.episodes[0]);
  assert.throws(() => normalizeStoryWorkspace(value));
  for (const duration of [0, -1, Infinity, 3601]) {
    const value = sample(); value.episodes[0].shots[0].duration = duration;
    assert.throws(() => normalizeStoryWorkspace(value));
  }
  const dangling = sample(); dangling.episodes[0].shots[0].sceneId = 'missing';
  assert.throws(() => normalizeStoryWorkspace(dangling));
});
test('oversize inputs reject instead of silently truncating', () => {
  const value = sample(); value.episodes[0].script = 'x'.repeat(200001);
  assert.throws(() => normalizeStoryWorkspace(value));
  assert.throws(() => draftShotsFromScript(Array(301).fill('段落').join('\n\n')));
});
test('paragraph draft splitting is deterministic in content, with fresh IDs and placeholder durations', () => {
  const shots = draftShotsFromScript('第一段\r\n仍在第一段\r\n\r\n第二段');
  assert.equal(shots.length, 2); assert.equal(shots[0].description, '第一段\n仍在第一段');
  assert.equal(shots[0].duration, 5); assert.equal(shots[0].dialogue, '');
  assert.notEqual(shots[0].id, draftShotsFromScript('第一段')[0].id);
});
test('removing an asset clears references and leaves original snapshots untouched', () => {
  const value = sample(), next = removeStoryAsset(value, 'characters', 'char-a');
  assert.deepEqual(next.episodes[0].shots[0].characterIds, []);
  assert.deepEqual(value.episodes[0].shots[0].characterIds, ['char-a']);
  assert.equal(removeStoryAsset(value, 'scenes', 'scene-a').episodes[0].shots[0].sceneId, '');
});
test('episode duplication and reordering never share mutable shot arrays', () => {
  const value = sample(), episode = value.episodes[0], copy = duplicateEpisode(episode);
  assert.notEqual(copy.id, episode.id); assert.notEqual(copy.shots[0].id, episode.shots[0].id);
  copy.shots[0].characterIds.push('extra'); assert.equal(episode.shots[0].characterIds.length, 1);
  assert.deepEqual(moveStoryItem([episode, copy], copy.id, -1), [copy, episode]);
});
test('export maps canonical storyboard columns and rejects unsafe reference schemes', () => {
  const value = sample(), episode = value.episodes[0];
  let rows = episodeStoryboardRows(value, episode, { 'img-a': { type: 'source-image', src: '/output/test.png' } });
  assert.equal(rows[0]['场景'], '站台'); assert.equal(rows[0]['角色图'], '/output/test.png');
  rows = episodeStoryboardRows(value, episode, { 'img-a': { type: 'source-image', src: 'javascript:alert(1)' } });
  assert.equal(rows[0]['角色图'], '');
});
test('collection appends without overwriting source; character notes round trip', () => {
  const value = sample(); value.episodes[0].shots[0].characterNotes = '雨中神情';
  const rows = episodeStoryboardRows(value, value.episodes[0]);
  const result = collectStoryboardEpisode(value, { name: '导入', storyboardScript: { rows } });
  assert.equal(value.episodes.length, 1); assert.equal(result.workspace.episodes.length, 2);
  assert.equal(result.workspace.episodes[1].shots[0].characterNotes, '雨中神情');
  assert.throws(() => collectStoryboardEpisode(value, { storyboardScript: { rows: [{ '时长': '3到5秒' }] } }));
});
test('CSV mitigates spreadsheet formula injection and quotes multiline cells', () => {
  const value = sample(); value.episodes[0].shots[0].description = '=HYPERLINK("x")\n第二行';
  const csv = storyEpisodeCsv(value, value.episodes[0]);
  assert.ok(csv.startsWith('\ufeff')); assert.ok(csv.includes("'=HYPERLINK")); assert.ok(csv.includes('""x""'));
});
test('Markdown includes script, assets and shots without executing markup', () => {
  const value = sample(); value.episodes[0].script = '<script>test</script>';
  const markdown = storyWorkspaceMarkdown(value); assert.ok(markdown.includes('列车进站')); assert.ok(markdown.includes('红衣'));
});
