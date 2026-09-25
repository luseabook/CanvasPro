import { parseUploadedStoryEpisodeScenes } from './storyScriptImport.js';
export const STORY_SCRIPT_STALE_MESSAGE =
  '剧本已修改，现有分镜与视频已保留；请重新生成分镜脚本后再生成视频。';
export function markStoryEpisodeProductionStale(_0x31ff20) {
  return (
    (_0x31ff20['storyboardStale'] = !![]),
    delete _0x31ff20['splitDraft'],
    delete _0x31ff20['experimentalSplitDraft'],
    delete _0x31ff20['splitQualityReview'],
    _0x31ff20
  );
}
export function updateStoryEpisodeScriptText(_0x5edaf9, _0x2ce2e7) {
  if (!_0x5edaf9?.['script']) return ![];
  const _0x512d5d = String(_0x2ce2e7 ?? '');
  if (_0x5edaf9['script']['fullText'] === _0x512d5d) return ![];
  return (
    (_0x5edaf9['script'] = {
      ..._0x5edaf9['script'],
      fullText: _0x512d5d,
      scenes: parseUploadedStoryEpisodeScenes({
        fullText: _0x512d5d,
        episodeRef: _0x5edaf9['script']['episodeRef'] || _0x5edaf9['planningRef'] || _0x5edaf9['id'],
        fallbackHeading: _0x5edaf9['title'],
      }),
      generatedAt: Date['now'](),
    }),
    delete _0x5edaf9['script']['timingReview'],
    delete _0x5edaf9['endingState'],
    delete _0x5edaf9['continuityFacts'],
    markStoryEpisodeProductionStale(_0x5edaf9),
    !![]
  );
}
export function getStoryEpisodeScriptInputKey(_0x17abc8) {
  return JSON['stringify'](_0x17abc8?.['script'] || null);
}
export function assertStoryEpisodeScriptCurrent(_0x15545d, _0x4cc158, _0x5689c6) {
  const _0x25f833 = _0x15545d['episodes']?.['find']((_0x49ef45) => _0x49ef45['id'] === _0x4cc158);
  if (!_0x25f833 || getStoryEpisodeScriptInputKey(_0x25f833) !== _0x5689c6)
    throw new Error('分镜生成期间剧本已修改，本次旧结果未采用，请按最新正文重新生成。');
}
export function assertStoryEpisodeProductionCurrent(_0x2386e8) {
  if (_0x2386e8?.['storyboardStale']) throw new Error(STORY_SCRIPT_STALE_MESSAGE);
}
export function createStoryEpisodeScriptGuard(_0x18dd11, _0x1ec156) {
  const _0x505d85 = _0x18dd11()['project']?.['sourceMode'] === 'video-replication',
    _0x312398 = getStoryEpisodeScriptInputKey(_0x1ec156),
    _0x25d9af = () => {
      if (!_0x505d85) assertStoryEpisodeScriptCurrent(_0x18dd11(), _0x1ec156['id'], _0x312398);
    };
  return {
    episode: _0x505d85 ? _0x1ec156 : JSON['parse'](JSON['stringify'](_0x1ec156)),
    assertCurrent: _0x25d9af,
    isCurrent: () => {
      try {
        return (_0x25d9af(), !![]);
      } catch {
        return ![];
      }
    },
  };
}
