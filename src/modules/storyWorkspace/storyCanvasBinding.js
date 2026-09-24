function normalizeText(_0x12e0e6) {
  return String(_0x12e0e6 || '')['trim']();
}
function getStableKeyPart(_0x2bb3fe, _0x1272af) {
  return normalizeText(_0x2bb3fe) || _0x1272af;
}
export function buildStoryLinkedCanvasName(_0x36e35c = {}, _0x5ecf4d = {}) {
  const _0x54f36 = normalizeText(_0x36e35c['title']) || '剧本项目',
    _0xa1e489 = Math['max'](0x0, Math['trunc'](Number(_0x5ecf4d?.['number']) || 0x0));
  return _0xa1e489 > 0x0 ? _0x54f36 + '\x20·\x20第\x20' + _0xa1e489 + '\x20集' : _0x54f36;
}
export function buildStoryClipCanvasBindingKey({
  episode: episode = {},
  clip: clip = {},
  episodeIndex: episodeIndex = 0x0,
  clipIndex: clipIndex = 0x0,
} = {}) {
  const _0x27a556 = getStableKeyPart(
      episode['id'] || episode['planningRef'],
      'episode-' + (Math['max'](0x0, Number(episodeIndex) || 0x0) + 0x1),
    ),
    _0xde0dd = getStableKeyPart(
      clip['id'] || clip['planningRef'],
      'clip-' + (Math['max'](0x0, Number(clipIndex) || 0x0) + 0x1),
    );
  return 'episode:' + _0x27a556 + ':clip:' + _0xde0dd;
}
