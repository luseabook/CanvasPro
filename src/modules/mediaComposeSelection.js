import { t } from '../i18n/index.js';
const VIDEO_COMPOSE_TYPES = new Set(['source-video', 'video', 'ai-video']),
  AUDIO_COMPOSE_TYPES = new Set(['source-audio', 'audio', 'ai-audio']);
function mediaComposeText(_0x1c4ad8, _0x15c366 = {}) {
  return t('mediaProcessing.compose.' + _0x1c4ad8, _0x15c366);
}
const VIDEO_SOURCE_FIELDS = Object.freeze(['localPath', 'src', 'videoUrl', 'url', 'resultUrl']),
  AUDIO_SOURCE_FIELDS = Object.freeze(['localPath', 'audioUrl', 'src', 'url', 'resultUrl']);
function hasAnyMediaSource(_0x325f96, _0x444adb) {
  if (!_0x325f96) return false;
  return _0x444adb.some((_0x3e4862) => String(_0x325f96?.[_0x3e4862] || '').trim());
}
export function getNodeMediaComposeKind(_0x3ee5ab) {
  const _0x190fc9 = String(_0x3ee5ab?.type || '').trim();
  if (VIDEO_COMPOSE_TYPES.has(_0x190fc9) && hasAnyMediaSource(_0x3ee5ab, VIDEO_SOURCE_FIELDS)) return 'video';
  if (AUDIO_COMPOSE_TYPES.has(_0x190fc9) && hasAnyMediaSource(_0x3ee5ab, AUDIO_SOURCE_FIELDS)) return 'audio';
  return '';
}
export function getSelectedMediaComposeKind(_0x240fcc = {}, _0x39f4db = []) {
  const _0x438c94 = Array.isArray(_0x39f4db) ? _0x39f4db : [];
  if (_0x438c94.length < 2) return '';
  let _0x418f34 = '';
  for (const _0x1932ea of _0x438c94) {
    const _0x1c79d0 = getNodeMediaComposeKind(_0x240fcc?.[_0x1932ea]);
    if (!_0x1c79d0) return '';
    if (!_0x418f34) {
      _0x418f34 = _0x1c79d0;
      continue;
    }
    if (_0x418f34 !== _0x1c79d0) return '';
  }
  return _0x418f34;
}
export function getMediaComposeButtonLabel(_0x5dbb8c) {
  if (_0x5dbb8c === 'audio') return mediaComposeText('audio.buttonLabel');
  if (_0x5dbb8c === 'video') return mediaComposeText('video.buttonLabel');
  return mediaComposeText('buttonLabel');
}
export function getOrderedMediaComposeIds(_0x43801c = {}, _0x59278f = [], _0x111a5e = {}) {
  const _0x24a460 = Array.isArray(_0x59278f) ? _0x59278f.slice() : [],
    _0x3e5239 = getSelectedMediaComposeKind(_0x43801c, _0x24a460);
  if (!_0x3e5239) return [];
  const _0x674e40 = _0x24a460.filter(
    (_0x428ade) => getNodeMediaComposeKind(_0x43801c?.[_0x428ade]) === _0x3e5239,
  );
  if (_0x111a5e?.source === 'shift') return _0x674e40;
  return _0x674e40.slice().sort((_0x3bcda3, _0x4336c1) => {
    const _0x2d0821 = _0x43801c?.[_0x3bcda3],
      _0xf0400f = _0x43801c?.[_0x4336c1],
      _0x1845f9 = Number(_0x2d0821?.x) || 0,
      _0x3854a9 = Number(_0xf0400f?.x) || 0;
    if (_0x1845f9 !== _0x3854a9) return _0x1845f9 - _0x3854a9;
    const _0x40d604 = Number(_0x2d0821?.y) || 0,
      _0x11a9a2 = Number(_0xf0400f?.y) || 0;
    if (_0x40d604 !== _0x11a9a2) return _0x40d604 - _0x11a9a2;
    return String(_0x3bcda3).localeCompare(String(_0x4336c1));
  });
}
