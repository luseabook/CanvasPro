function normalizeText(value) {
  return String(value || '')['trim']();
}
function getStableKeyPart(item, key) {
  return normalizeText(item) || key;
}
export function buildStoryLinkedCanvasName(options = {}, index = {}) {
  const text = normalizeText(options['title']) || '剧本项目',
    count = Math['max'](0x0, Math['trunc'](Number(index?.['number']) || 0x0));
  return count > 0x0 ? text + '\x20·\x20第\x20' + count + '\x20集' : text;
}
export function buildStoryClipCanvasBindingKey({
  episode: episode = {},
  clip: clip = {},
  episodeIndex: episodeIndex = 0x0,
  clipIndex: clipIndex = 0x0,
} = {}) {
  const stableKeyPart = getStableKeyPart(
      episode['id'] || episode['planningRef'],
      'episode-' + (Math['max'](0x0, Number(episodeIndex) || 0x0) + 0x1),
    ),
    stableKeyPart2 = getStableKeyPart(
      clip['id'] || clip['planningRef'],
      'clip-' + (Math['max'](0x0, Number(clipIndex) || 0x0) + 0x1),
    );
  return 'episode:' + stableKeyPart + ':clip:' + stableKeyPart2;
}
