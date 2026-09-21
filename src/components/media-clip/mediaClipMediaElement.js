import { attachMediaElementPlaybackSource } from '../../services/desktopMediaBlobSource.js';
import { firstNonEmpty, normalizeText } from './mediaClipUtils.js';
export function isRenderableUrl(_0x21bb10) {
  const _0x506d0c = normalizeText(_0x21bb10);
  return /^(?:https?:|data:|blob:|aic-local-preview:|\/)/i.test(_0x506d0c);
}
export function isUsableMediaElement(_0x1150a2) {
  if (!_0x1150a2) return false;
  try {
    const _0x50f809 = window.getComputedStyle(_0x1150a2);
    if (_0x50f809.display === 'none' || _0x50f809.visibility === 'hidden') return false;
    const _0x59a99e = Number(_0x50f809.opacity);
    if (Number.isFinite(_0x59a99e) && _0x59a99e <= 0) return false;
    const _0x5c9021 = _0x1150a2.getBoundingClientRect();
    if (!_0x5c9021.width || !_0x5c9021.height) return false;
  } catch {}
  return true;
}
export function disposeMediaElement(_0x35c100) {
  if (!_0x35c100) return;
  try {
    _0x35c100.pause?.();
  } catch {}
  try {
    (_0x35c100.removeAttribute?.('src'), _0x35c100.load?.());
  } catch {}
}
export function setMediaElementSource(_0x32a30a, _0x53e454) {
  if (!_0x32a30a) return false;
  const _0xd1e1ec = normalizeText(_0x53e454),
    _0x2595d9 = firstNonEmpty(
      _0x32a30a.dataset?.desktopMediaSourceUrl,
      _0x32a30a.dataset?.mediaClipSourceUrl,
      _0x32a30a.getAttribute?.('src'),
      _0x32a30a.currentSrc,
      _0x32a30a.src,
    );
  if (!_0xd1e1ec) {
    if (_0x2595d9) disposeMediaElement(_0x32a30a);
    return (
      _0x32a30a.dataset &&
        (delete _0x32a30a.dataset.desktopMediaSourceUrl, delete _0x32a30a.dataset.mediaClipSourceUrl),
      false
    );
  }
  if (_0x2595d9 === _0xd1e1ec) return false;
  try {
    _0x32a30a.pause?.();
  } catch {}
  if (_0x32a30a.dataset) _0x32a30a.dataset.mediaClipSourceUrl = _0xd1e1ec;
  const _0x5abd73 = attachMediaElementPlaybackSource(_0x32a30a, _0xd1e1ec, {
    preload: _0x32a30a.preload || 'auto',
  }).catch(() => {
    if (!firstNonEmpty(_0x32a30a.getAttribute?.('src'), _0x32a30a.currentSrc, _0x32a30a.src)) {
      _0x32a30a.src = _0xd1e1ec;
      try {
        _0x32a30a.load?.();
      } catch {}
    }
    return firstNonEmpty(_0x32a30a.getAttribute?.('src'), _0x32a30a.currentSrc, _0x32a30a.src);
  });
  return (
    (_0x32a30a.__mediaClipSourcePromise = _0x5abd73),
    void _0x5abd73.finally(() => {
      _0x32a30a.__mediaClipSourcePromise === _0x5abd73 && (_0x32a30a.__mediaClipSourcePromise = null);
    }),
    true
  );
}
