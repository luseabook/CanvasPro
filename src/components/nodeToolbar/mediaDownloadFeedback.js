import { t } from '../../i18n/index.js';
const SUCCESS_MESSAGE_KEYS = Object['freeze']({
  image: 'nodeToolbar.common.imageSaved',
  video: 'nodeToolbar.common.videoSaved',
  audio: 'nodeToolbar.common.audioSaved',
});
function basenameFromPath(_0x284129) {
  return (
    String(_0x284129 || '')
      ['trim']()
      ['split'](/[\\/]/)
      ['filter'](Boolean)
      ['pop']() || ''
  );
}
export function showMediaSaveSuccessToast({
  result: _0x32c641,
  kind: _0x506d49,
  showToast: showToast = globalThis['window']?.['showToast'],
} = {}) {
  const _0xfdb7d9 = SUCCESS_MESSAGE_KEYS[String(_0x506d49 || '')['toLowerCase']()],
    _0x45b9ad = String(_0x32c641?.['path'] || '')['trim']();
  if (_0x32c641?.['success'] !== !![] || !_0x45b9ad || !_0xfdb7d9) return ![];
  if (typeof showToast !== 'function') return ![];
  const _0x2173e7 = String(_0x32c641?.['filename'] || '')['trim']() || basenameFromPath(_0x45b9ad);
  if (!_0x2173e7) return ![];
  return (showToast(t(_0xfdb7d9, { filename: _0x2173e7 }), 'success'), !![]);
}
