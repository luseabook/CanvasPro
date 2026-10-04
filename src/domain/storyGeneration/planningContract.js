export const STORY_SCRIPT_MODE_PLOT = 'plot';
export const STORY_SCRIPT_MODE_NARRATION = 'narration';
export const STORY_EPISODE_COUNT_OPTIONS = Object['freeze']([0x3, 0x5, 0xa, 0x14, 0x1e, 0x32]);
export const STORY_EPISODE_COUNT_MAX = 0x64;
export const STORY_SCENE_MAX_SECONDS_OPTIONS = Object['freeze']([0xf, 0x1e]);
function normalizeText(value) {
  return String(value || '')['trim']();
}
export function normalizeStoryScriptMode(item) {
  return normalizeText(item) === STORY_SCRIPT_MODE_NARRATION
    ? STORY_SCRIPT_MODE_NARRATION
    : STORY_SCRIPT_MODE_PLOT;
}
export function normalizeStoryPlanningConstraints({
  episodeCount: episodeCount = STORY_EPISODE_COUNT_OPTIONS[0x0],
  sceneMaxSeconds: sceneMaxSeconds = STORY_SCENE_MAX_SECONDS_OPTIONS[0x1],
} = {}) {
  const count = Number(episodeCount),
    key = Number(sceneMaxSeconds);
  return {
    episodeCount:
      Number['isInteger'](count) && count >= 0x1 && count <= STORY_EPISODE_COUNT_MAX
        ? count
        : STORY_EPISODE_COUNT_OPTIONS[0x0],
    sceneMaxSeconds: STORY_SCENE_MAX_SECONDS_OPTIONS['includes'](key)
      ? key
      : STORY_SCENE_MAX_SECONDS_OPTIONS[0x1],
  };
}
export function validateStoryPlanningConstraints(options = {}) {
  const index = options && typeof options === 'object' && !Array['isArray'](options) ? options : {};
  if (
    Object['prototype']['hasOwnProperty']['call'](index, 'episodeCount') &&
    (!Number['isInteger'](Number(index['episodeCount'])) ||
      Number(index['episodeCount']) < 0x1 ||
      Number(index['episodeCount']) > STORY_EPISODE_COUNT_MAX)
  )
    throw new Error('分集数量必须是 1-' + STORY_EPISODE_COUNT_MAX + ' 的整数。');
  if (
    Object['prototype']['hasOwnProperty']['call'](index, 'sceneMaxSeconds') &&
    !STORY_SCENE_MAX_SECONDS_OPTIONS['includes'](Number(index['sceneMaxSeconds']))
  )
    throw new Error('单片段时长上限必须是 ' + STORY_SCENE_MAX_SECONDS_OPTIONS['join']('、') + ' 秒之一。');
  return normalizeStoryPlanningConstraints(index);
}
