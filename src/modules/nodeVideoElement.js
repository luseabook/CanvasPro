import { getMediaElementCurrentSource } from '../services/desktopMediaBlobSource.js';
export function resolveNodeVideoElement(_0x521b27, _0x1b010a = 0x0) {
  if (!_0x521b27) return null;
  const _0x48d089 = Array['from'](_0x521b27['querySelectorAll']('video')),
    _0x567373 = Math['max'](0x0, Math['trunc'](Number(_0x1b010a) || 0x0));
  let _0x460e06 = null,
    _0x3cb6f7 = null,
    _0x51cdf9 = null;
  for (const _0x5e9943 of _0x48d089) {
    if (!_0x5e9943) continue;
    const _0x4122b6 = Number(_0x5e9943['dataset']?.['idx']),
      _0x5cef6e =
        _0x5e9943['classList']?.['contains']?.('video-player') === !![] ||
        (Number['isFinite'](_0x4122b6) && _0x4122b6 === _0x567373),
      _0x16afef = getMediaElementCurrentSource(_0x5e9943);
    if (_0x5cef6e && !_0x51cdf9) _0x51cdf9 = _0x5e9943;
    if (_0x16afef && (!_0x3cb6f7 || _0x5cef6e)) _0x3cb6f7 = _0x5e9943;
    const _0x49c8f3 = window['getComputedStyle'](_0x5e9943);
    if (_0x49c8f3['display'] === 'none' || _0x49c8f3['visibility'] === 'hidden') continue;
    const _0x8b980d = Number(_0x49c8f3['opacity']);
    if (Number['isFinite'](_0x8b980d) && _0x8b980d <= 0x0) continue;
    const _0x2c815b = _0x5e9943['getBoundingClientRect']();
    if (!_0x2c815b['width'] || !_0x2c815b['height']) continue;
    if (!_0x460e06) _0x460e06 = _0x5e9943;
    if (_0x16afef) return _0x5e9943;
  }
  return _0x3cb6f7 || _0x51cdf9 || _0x460e06 || _0x48d089[0x0] || null;
}
