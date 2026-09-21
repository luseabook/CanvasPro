const GENERATION_NODE_TYPES = ['ai-image', 'ai-text', 'ai-video', 'ai-audio'],
  IMAGE_RESULT_FIELDS = [
    'src',
    'url',
    'imageUrl',
    'sourceUrl',
    'resultUrl',
    'thumbUrl',
    'localPath',
    'originalLocalPath',
    'displayLocalPath',
    'thumbLocalPath',
    'thumbId',
  ],
  VIDEO_RESULT_FIELDS = [
    'src',
    'url',
    'videoUrl',
    'sourceUrl',
    'resultUrl',
    'videoLocalPath',
    'localPath',
    'originalLocalPath',
    'displayLocalPath',
    'thumbId',
    'thumbUrl',
    'posterUrl',
    'posterLocalPath',
    'thumbLocalPath',
    'videoThumbSrc',
    'videoMetaSrc',
  ],
  AUDIO_RESULT_FIELDS = ['audioUrl', 'url', 'src', 'resultUrl', 'localPath'];
function matchesNodeType(_0x436c49, _0x1dcdd1, _0x1272fc) {
  if (typeof _0x1272fc === 'function') return _0x1272fc(_0x436c49, _0x1dcdd1);
  return String(_0x436c49?.type || '') === _0x1dcdd1;
}
function hasStringValue(_0x1113cd) {
  return String(_0x1113cd || '').trim().length > 0;
}
function hasAnyField(_0x31b645, _0x10b3a0) {
  if (!_0x31b645 || typeof _0x31b645 !== 'object') return false;
  return _0x10b3a0.some((_0x3dbad4) => hasStringValue(_0x31b645[_0x3dbad4]));
}
function hasAnyResultItem(_0x44a7ae, _0x31ba62) {
  if (!Array.isArray(_0x44a7ae)) return false;
  return _0x44a7ae.some((_0x211c70) => hasAnyField(_0x211c70, _0x31ba62));
}
export function hasDisplayableImageResult(_0x26521f) {
  return (
    hasAnyField(_0x26521f, IMAGE_RESULT_FIELDS) || hasAnyResultItem(_0x26521f?.images, IMAGE_RESULT_FIELDS)
  );
}
export function hasDisplayableVideoResult(_0x1fd714) {
  return (
    hasAnyField(_0x1fd714, VIDEO_RESULT_FIELDS) || hasAnyResultItem(_0x1fd714?.videos, VIDEO_RESULT_FIELDS)
  );
}
export function hasDisplayableAudioResult(_0x246dec) {
  return (
    hasAnyField(_0x246dec, AUDIO_RESULT_FIELDS) || hasAnyResultItem(_0x246dec?.audios, AUDIO_RESULT_FIELDS)
  );
}
export function hasDisplayableNodeResult(_0x521a88, _0x514c80) {
  if (matchesNodeType(_0x521a88, 'ai-image', _0x514c80)) return hasDisplayableImageResult(_0x521a88);
  if (matchesNodeType(_0x521a88, 'ai-text', _0x514c80)) return hasStringValue(_0x521a88?.outputText);
  if (matchesNodeType(_0x521a88, 'ai-video', _0x514c80)) return hasDisplayableVideoResult(_0x521a88);
  if (matchesNodeType(_0x521a88, 'ai-audio', _0x514c80)) return hasDisplayableAudioResult(_0x521a88);
  return false;
}
export function isNodeMissingResult(_0x4bcdd9, _0x54da7c) {
  if (
    !_0x4bcdd9 ||
    !GENERATION_NODE_TYPES.some((_0x16556e) => matchesNodeType(_0x4bcdd9, _0x16556e, _0x54da7c))
  )
    return false;
  return !hasDisplayableNodeResult(_0x4bcdd9, _0x54da7c);
}
export function syncNodeResultClass(_0x266cfb, _0x1c54fc, _0x309626) {
  if (!_0x266cfb?.classList) return;
  isNodeMissingResult(_0x1c54fc, _0x309626)
    ? _0x266cfb.classList.add('no-result')
    : _0x266cfb.classList.remove('no-result');
}
