function normalizeText(value) {
  return String(value || '')['trim']();
}
function getStableKeyPart(item, key) {
  return normalizeText(item) || key;
}
export function buildStoryLinkedCanvasName(options = {}, index = {}) {
  const text = normalizeText(options['title']) || '剧本项目',
    count = Math['max'](0, Math['trunc'](Number(index?.['number']) || 0));
  return count > 0 ? text + ' · 第 ' + count + ' 集' : text;
}
export function buildStoryClipCanvasBindingKey({
  episode: episode = {},
  clip: clip = {},
  episodeIndex: episodeIndex = 0,
  clipIndex: clipIndex = 0,
} = {}) {
  const stableKeyPart = getStableKeyPart(
      episode['id'] || episode['planningRef'],
      'episode-' + (Math['max'](0, Number(episodeIndex) || 0) + 1),
    ),
    stableKeyPart2 = getStableKeyPart(
      clip['id'] || clip['planningRef'],
      'clip-' + (Math['max'](0, Number(clipIndex) || 0) + 1),
    );
  return 'episode:' + stableKeyPart + ':clip:' + stableKeyPart2;
}
