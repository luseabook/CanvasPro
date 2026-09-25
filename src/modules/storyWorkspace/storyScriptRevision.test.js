import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORY_SCRIPT_STALE_MESSAGE,
  assertStoryEpisodeProductionCurrent,
  assertStoryEpisodeScriptCurrent,
  createStoryEpisodeScriptGuard,
  getStoryEpisodeScriptInputKey,
  markStoryEpisodeProductionStale,
  updateStoryEpisodeScriptText,
} from './storyScriptRevision.js';

// 剧集最小构造；覆盖项写成 'k' in over ? over.k : 默认值
function makeEpisode(over = {}) {
  return {
    id: 'id' in over ? over.id : 'ep-1',
    title: 'title' in over ? over.title : '第一集',
    planningRef: 'planningRef' in over ? over.planningRef : undefined,
    script:
      'script' in over
        ? over.script
        : { fullText: '旧正文', episodeRef: 'ref-1', scenes: [], timingReview: { ok: 1 } },
    splitDraft: { a: 1 },
    experimentalSplitDraft: { b: 1 },
    splitQualityReview: { c: 1 },
    endingState: { d: 1 },
    continuityFacts: ['e'],
  };
}

const STALE_ERROR = '分镜生成期间剧本已修改，本次旧结果未采用，请按最新正文重新生成。';

test('STORY_SCRIPT_STALE_MESSAGE：提示分镜与视频已保留、需要重新生成分镜脚本', () => {
  assert.equal(
    STORY_SCRIPT_STALE_MESSAGE,
    '剧本已修改，现有分镜与视频已保留；请重新生成分镜脚本后再生成视频。',
  );
});

test('markStoryEpisodeProductionStale：原地标记过期并删除拆分草稿与质检结果', () => {
  const episode = makeEpisode();
  const returned = markStoryEpisodeProductionStale(episode);
  assert.equal(returned, episode);
  assert.equal(episode.storyboardStale, true);
  assert.equal('splitDraft' in episode, false);
  assert.equal('experimentalSplitDraft' in episode, false);
  assert.equal('splitQualityReview' in episode, false);
  assert.deepEqual(episode.endingState, { d: 1 });
});

test('updateStoryEpisodeScriptText：没有剧本或正文未变时返回 false 且不改动', () => {
  const noScript = makeEpisode({ script: null });
  assert.equal(updateStoryEpisodeScriptText(noScript, '新正文'), false);
  assert.equal(noScript.storyboardStale, undefined);
  const same = makeEpisode();
  const before = same.script;
  assert.equal(updateStoryEpisodeScriptText(same, '旧正文'), false);
  assert.equal(same.script, before);
  assert.deepEqual(same.splitDraft, { a: 1 });
});

test('updateStoryEpisodeScriptText：正文变化时重建剧本对象、重新切场次并清掉下游产物', (t) => {
  t.mock.method(Date, 'now', () => 1_700_000_000_000);
  const episode = makeEpisode();
  const oldScript = episode.script;
  assert.equal(updateStoryEpisodeScriptText(episode, '林远推门进来。\n苏晴没有抬头。'), true);
  assert.notEqual(episode.script, oldScript);
  assert.equal(episode.script.fullText, '林远推门进来。\n苏晴没有抬头。');
  assert.equal(episode.script.episodeRef, 'ref-1');
  assert.equal(episode.script.generatedAt, 1_700_000_000_000);
  assert.equal('timingReview' in episode.script, false);
  assert.deepEqual(oldScript.timingReview, { ok: 1 });
  // 没有场次标题时整段作为一个兜底场次，标题取剧集标题，ref 以剧本 episodeRef 为前缀
  assert.equal(episode.script.scenes.length, 1);
  assert.equal(episode.script.scenes[0].ref, 'ref-1-scene-1');
  assert.equal(episode.script.scenes[0].heading, '第一集');
  assert.equal(episode.script.scenes[0].source, 'upload-fallback');
  assert.equal(episode.storyboardStale, true);
  for (const key of [
    'endingState',
    'continuityFacts',
    'splitDraft',
    'experimentalSplitDraft',
    'splitQualityReview',
  ]) {
    assert.equal(key in episode, false, key);
  }
});

test('updateStoryEpisodeScriptText：场次 ref 依次取剧本 episodeRef、planningRef、剧集 id；空值当空串', () => {
  const byPlanning = makeEpisode({ planningRef: 'plan-9', script: { fullText: 'x' } });
  updateStoryEpisodeScriptText(byPlanning, '新的一段');
  assert.equal(byPlanning.script.scenes[0].ref, 'plan-9-scene-1');
  const byId = makeEpisode({ id: 'ep-42', script: { fullText: 'x' } });
  updateStoryEpisodeScriptText(byId, '新的一段');
  assert.equal(byId.script.scenes[0].ref, 'ep-42-scene-1');
  const cleared = makeEpisode();
  assert.equal(updateStoryEpisodeScriptText(cleared, null), true);
  assert.equal(cleared.script.fullText, '');
  assert.deepEqual(cleared.script.scenes, []);
});

test('getStoryEpisodeScriptInputKey：以剧本 JSON 作为比较键，缺剧本时为 "null"', () => {
  assert.equal(getStoryEpisodeScriptInputKey({ script: { fullText: 'a' } }), '{"fullText":"a"}');
  assert.equal(getStoryEpisodeScriptInputKey({}), 'null');
  assert.equal(getStoryEpisodeScriptInputKey(null), 'null');
});

test('assertStoryEpisodeScriptCurrent：剧集不存在或剧本键变化时报错，一致时通过', () => {
  const episode = makeEpisode();
  const key = getStoryEpisodeScriptInputKey(episode);
  const project = { episodes: [episode] };
  assert.doesNotThrow(() => assertStoryEpisodeScriptCurrent(project, 'ep-1', key));
  assert.throws(() => assertStoryEpisodeScriptCurrent(project, 'ep-404', key), { message: STALE_ERROR });
  assert.throws(() => assertStoryEpisodeScriptCurrent({}, 'ep-1', key), { message: STALE_ERROR });
  episode.script = { ...episode.script, fullText: '改过了' };
  assert.throws(() => assertStoryEpisodeScriptCurrent(project, 'ep-1', key), { message: STALE_ERROR });
});

test('assertStoryEpisodeProductionCurrent：剧集被标记过期时抛出过期提示', () => {
  assert.doesNotThrow(() => assertStoryEpisodeProductionCurrent({}));
  assert.doesNotThrow(() => assertStoryEpisodeProductionCurrent(null));
  assert.throws(() => assertStoryEpisodeProductionCurrent({ storyboardStale: true }), {
    message: STORY_SCRIPT_STALE_MESSAGE,
  });
});

test('createStoryEpisodeScriptGuard：普通项目给出深拷贝，剧本改动后 assertCurrent 报错、isCurrent 为 false', () => {
  const episode = makeEpisode();
  const state = { project: { sourceMode: 'script' }, episodes: [episode] };
  const guard = createStoryEpisodeScriptGuard(() => state, episode);
  assert.notEqual(guard.episode, episode);
  assert.deepEqual(guard.episode, JSON.parse(JSON.stringify(episode)));
  assert.equal(guard.isCurrent(), true);
  assert.doesNotThrow(() => guard.assertCurrent());
  state.episodes = [{ ...episode, script: { ...episode.script, fullText: '别人改了' } }];
  assert.equal(guard.isCurrent(), false);
  assert.throws(() => guard.assertCurrent(), { message: STALE_ERROR });
});

test('createStoryEpisodeScriptGuard：视频复刻项目直接用原对象，且不做剧本一致性检查', () => {
  const episode = makeEpisode();
  let project = { sourceMode: 'video-replication' };
  const state = () => ({ project, episodes: [] });
  const guard = createStoryEpisodeScriptGuard(state, episode);
  assert.equal(guard.episode, episode);
  assert.equal(guard.isCurrent(), true);
  assert.doesNotThrow(() => guard.assertCurrent());
  // 模式在创建时就定下来，之后项目切回普通模式也不影响这个守卫
  project = { sourceMode: 'script' };
  assert.equal(guard.isCurrent(), true);
});
