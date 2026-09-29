export const STORY_SCRIPT_MODE_PLOT = 'plot';
export const STORY_SCRIPT_MODE_NARRATION = 'narration';
export const STORY_EPISODE_COUNT_OPTIONS = Object['freeze']([0x3, 0x5, 0xa, 0x14, 0x1e, 0x32]);
export const STORY_EPISODE_COUNT_MAX = 0x64;
export const STORY_SCENE_MAX_SECONDS_OPTIONS = Object['freeze']([0xf, 0x1e]);
function normalizeText(_0x1e3114) {
  return String(_0x1e3114 || '')['trim']();
}
export function normalizeStoryScriptMode(_0x3e15c6) {
  return normalizeText(_0x3e15c6) === STORY_SCRIPT_MODE_NARRATION
    ? STORY_SCRIPT_MODE_NARRATION
    : STORY_SCRIPT_MODE_PLOT;
}
export function normalizeStoryPlanningConstraints({
  episodeCount: episodeCount = STORY_EPISODE_COUNT_OPTIONS[0x0],
  sceneMaxSeconds: sceneMaxSeconds = STORY_SCENE_MAX_SECONDS_OPTIONS[0x1],
} = {}) {
  const _0x52f36c = Number(episodeCount),
    _0x2eaf76 = Number(sceneMaxSeconds);
  return {
    episodeCount:
      Number['isInteger'](_0x52f36c) && _0x52f36c >= 0x1 && _0x52f36c <= STORY_EPISODE_COUNT_MAX
        ? _0x52f36c
        : STORY_EPISODE_COUNT_OPTIONS[0x0],
    sceneMaxSeconds: STORY_SCENE_MAX_SECONDS_OPTIONS['includes'](_0x2eaf76)
      ? _0x2eaf76
      : STORY_SCENE_MAX_SECONDS_OPTIONS[0x1],
  };
}
export function validateStoryPlanningConstraints(_0x1cfa41 = {}) {
  const _0x422647 =
    _0x1cfa41 && typeof _0x1cfa41 === 'object' && !Array['isArray'](_0x1cfa41) ? _0x1cfa41 : {};
  if (
    Object['prototype']['hasOwnProperty']['call'](_0x422647, 'episodeCount') &&
    (!Number['isInteger'](Number(_0x422647['episodeCount'])) ||
      Number(_0x422647['episodeCount']) < 0x1 ||
      Number(_0x422647['episodeCount']) > STORY_EPISODE_COUNT_MAX)
  )
    throw new Error('分集数量必须是 1-' + STORY_EPISODE_COUNT_MAX + ' 的整数。');
  if (
    Object['prototype']['hasOwnProperty']['call'](_0x422647, 'sceneMaxSeconds') &&
    !STORY_SCENE_MAX_SECONDS_OPTIONS['includes'](Number(_0x422647['sceneMaxSeconds']))
  )
    throw new Error('单片段时长上限必须是 ' + STORY_SCENE_MAX_SECONDS_OPTIONS['join']('、') + ' 秒之一。');
  return normalizeStoryPlanningConstraints(_0x422647);
}
