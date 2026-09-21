import { attachMediaElementPlaybackSource } from '../services/desktopMediaBlobSource.js';
export function getVideoElementSource(_0x32b60c) {
  return String(_0x32b60c?.getAttribute?.('src') || _0x32b60c?.currentSrc || _0x32b60c?.src || '').trim();
}
export function setVideoKeyingMediaKeepAlive(_0x41c49b, _0x1a1960) {
  if (!_0x41c49b?.dataset) return;
  if (_0x1a1960) {
    _0x41c49b.dataset.desktopMediaKeepAlive = 'video-keying';
    return;
  }
  _0x41c49b.dataset.desktopMediaKeepAlive === 'video-keying' &&
    delete _0x41c49b.dataset.desktopMediaKeepAlive;
}
export async function attachVideoKeyingPlaybackSource(_0x1f3170, _0x41a2b3, _0x46f566 = 'metadata') {
  const _0x50a5c1 = String(_0x41a2b3 || '').trim();
  if (!_0x1f3170 || !_0x50a5c1) return false;
  return (
    await attachMediaElementPlaybackSource(_0x1f3170, _0x50a5c1, { preload: _0x46f566 }),
    !!getVideoElementSource(_0x1f3170)
  );
}
function seekTo(_0x28f665, _0x341a31) {
  return new Promise((_0x173919, _0x5afb1e) => {
    let _0x9eb692 = false;
    const _0x38ff9a = () => {
        (_0x28f665.removeEventListener('seeked', _0x1a1a87),
          _0x28f665.removeEventListener('error', _0x292814));
      },
      _0x1a1a87 = () => {
        if (_0x9eb692) return;
        ((_0x9eb692 = true), _0x38ff9a(), _0x173919());
      },
      _0x292814 = () => {
        if (_0x9eb692) return;
        ((_0x9eb692 = true), _0x38ff9a(), _0x5afb1e(new Error('video seek error')));
      };
    (_0x28f665.addEventListener('seeked', _0x1a1a87),
      _0x28f665.addEventListener('error', _0x292814),
      (_0x28f665.currentTime = Math.max(0, _0x341a31)));
  });
}
function waitForLoadedMetadata(_0x443182) {
  return new Promise((_0x13b613, _0x18fedb) => {
    const _0x557e55 = () => _0x13b613(),
      _0x2cf3e0 = () => _0x18fedb(new Error('video load error'));
    (_0x443182.addEventListener('loadedmetadata', _0x557e55, { once: true }),
      _0x443182.addEventListener('error', _0x2cf3e0, { once: true }));
  });
}
export async function renderVideoKeyingThumbs({
  src: _0x16e78a,
  thumbs: _0x4af583,
  token: _0x469119,
  isCurrent: _0x4573ba,
  readDurationSec: _0x307031,
  onDuration: _0xb0c75e,
}) {
  const _0x752b56 = Array.isArray(_0x4af583) ? _0x4af583 : [],
    _0x24cc9a = String(_0x16e78a || '').trim();
  if (!_0x24cc9a || !_0x752b56.length) return;
  let _0x16d315, _0x521574, _0x1d4b59;
  const _0x515f24 = () => _0x4573ba?.(_0x469119) === true;
  try {
    ((_0x16d315 = document.createElement('video')),
      (_0x16d315.muted = true),
      (_0x16d315.playsInline = true),
      (_0x16d315.crossOrigin = 'anonymous'),
      (_0x16d315.preload = 'auto'),
      await attachVideoKeyingPlaybackSource(_0x16d315, _0x24cc9a, 'auto'),
      await waitForLoadedMetadata(_0x16d315));
    if (!_0x515f24()) return;
    const _0x3af014 = Number(_0x307031?.(_0x16d315) || 0);
    if (_0x3af014 > 0) _0xb0c75e?.(_0x3af014);
    ((_0x521574 = document.createElement('canvas')),
      (_0x521574.width = 120),
      (_0x521574.height = 68),
      (_0x1d4b59 = _0x521574.getContext('2d', { willReadFrequently: false })));
    if (!_0x1d4b59) return;
    for (let _0x13ee2 = 0; _0x13ee2 < _0x752b56.length; _0x13ee2 += 1) {
      if (!_0x515f24()) return;
      const _0x5161c3 = (_0x3af014 * (_0x13ee2 + 0.5)) / _0x752b56.length;
      await seekTo(_0x16d315, _0x5161c3);
      if (!_0x515f24()) return;
      _0x1d4b59.drawImage(_0x16d315, 0, 0, _0x521574.width, _0x521574.height);
      const _0x181d86 = _0x521574.toDataURL('image/jpeg', 0.72),
        _0x5d29a8 = _0x752b56[_0x13ee2];
      if (_0x5d29a8) _0x5d29a8.style.backgroundImage = 'url("' + _0x181d86 + '")';
    }
  } catch {
  } finally {
    _0x16d315 && (_0x16d315.removeAttribute('src'), _0x16d315.load?.());
    if (_0x521574) _0x521574.width = _0x521574.height = 0;
  }
}
