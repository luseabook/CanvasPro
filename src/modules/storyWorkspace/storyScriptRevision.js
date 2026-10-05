import { parseUploadedStoryEpisodeScenes } from './storyScriptImport.js';
export const STORY_SCRIPT_STALE_MESSAGE =
  '剧本已修改，现有分镜与视频已保留；请重新生成分镜脚本后再生成视频。';
export function markStoryEpisodeProductionStale(value) {
  return (
    (value['storyboardStale'] = true),
    delete value['splitDraft'],
    delete value['experimentalSplitDraft'],
    delete value['splitQualityReview'],
    value
  );
}
export function updateStoryEpisodeScriptText(episodeRef, item) {
  if (!episodeRef?.['script']) return false;
  const fullText = String(item ?? '');
  if (episodeRef['script']['fullText'] === fullText) return false;
  return (
    (episodeRef['script'] = {
      ...episodeRef['script'],
      fullText: fullText,
      scenes: parseUploadedStoryEpisodeScenes({
        fullText: fullText,
        episodeRef: episodeRef['script']['episodeRef'] || episodeRef['planningRef'] || episodeRef['id'],
        fallbackHeading: episodeRef['title'],
      }),
      generatedAt: Date['now'](),
    }),
    delete episodeRef['script']['timingReview'],
    delete episodeRef['endingState'],
    delete episodeRef['continuityFacts'],
    markStoryEpisodeProductionStale(episodeRef),
    true
  );
}
export function getStoryEpisodeScriptInputKey(key) {
  return JSON['stringify'](key?.['script'] || null);
}
export function assertStoryEpisodeScriptCurrent(index, result, data) {
  const enabled = index['episodes']?.['find']((options) => options['id'] === result);
  if (!enabled || getStoryEpisodeScriptInputKey(enabled) !== data)
    throw new Error('分镜生成期间剧本已修改，本次旧结果未采用，请按最新正文重新生成。');
}
export function assertStoryEpisodeProductionCurrent(target) {
  if (target?.['storyboardStale']) throw new Error(STORY_SCRIPT_STALE_MESSAGE);
}
export function createStoryEpisodeScriptGuard(handler, source) {
  const episode = handler()['project']?.['sourceMode'] === 'video-replication',
    storyEpisodeScriptInputKey = getStoryEpisodeScriptInputKey(source),
    assertCurrent = () => {
      if (!episode) assertStoryEpisodeScriptCurrent(handler(), source['id'], storyEpisodeScriptInputKey);
    };
  return {
    episode: episode ? source : JSON['parse'](JSON['stringify'](source)),
    assertCurrent: assertCurrent,
    isCurrent: () => {
      try {
        return (assertCurrent(), true);
      } catch {
        return false;
      }
    },
  };
}
