import { t } from '../../i18n/index.js';
function storyboardImageRuntimeText(_0x21883f, _0x5ef200 = {}) {
  return t('storyboard.imageRuntime.' + _0x21883f, _0x5ef200);
}
export function loadStoryboardSourceImage(_0x14da8e) {
  if (typeof Image !== 'function') return Promise.reject(new Error('Image API unavailable'));
  return new Promise((_0x572a3a, _0x87f4f8) => {
    const _0x14fb0a = new Image();
    ((_0x14fb0a.crossOrigin = 'anonymous'),
      (_0x14fb0a.onload = () => _0x572a3a(_0x14fb0a)),
      (_0x14fb0a.onerror = () => _0x87f4f8(new Error(storyboardImageRuntimeText('sourceImageLoadFailed')))),
      (_0x14fb0a.src = _0x14da8e));
  });
}
export function isLoadedImageElement(_0x39bf03) {
  if (!_0x39bf03) return false;
  if ('complete' in _0x39bf03 && _0x39bf03.complete !== true) return false;
  const _0x2258a1 =
    'naturalWidth' in _0x39bf03 ||
    'naturalHeight' in _0x39bf03 ||
    'width' in _0x39bf03 ||
    'height' in _0x39bf03;
  if (!_0x2258a1) return true;
  const _0xa5b218 = Math.trunc(Number(_0x39bf03.naturalWidth || _0x39bf03.width) || 0),
    _0x63e600 = Math.trunc(Number(_0x39bf03.naturalHeight || _0x39bf03.height) || 0);
  return _0xa5b218 > 0 && _0x63e600 > 0;
}
export function getImageElementSource(_0x579c44) {
  return String(_0x579c44?.getAttribute?.('src') || _0x579c44?.currentSrc || _0x579c44?.src || '').trim();
}
export function isExpectedImageSource(_0x2f2a36, _0x42aac9 = '') {
  const _0x502449 = String(_0x42aac9 || '').trim();
  if (!_0x502449) return true;
  const _0x47ee6d = getImageElementSource(_0x2f2a36);
  return !_0x47ee6d || _0x47ee6d === _0x502449;
}
export function getLoadedStoryboardSourceImageForCell({
  cellEls: _0x342dbb,
  backdropEl: _0x483b5f,
  index: _0x406a28,
  sourceUrl: sourceUrl = '',
} = {}) {
  const _0x5514f5 = _0x342dbb?.[_0x406a28] || null,
    _0x237583 = [
      ...(_0x5514f5?.querySelectorAll?.('.storyboard-cell-source-cache') || []),
      ...(_0x5514f5?.querySelectorAll?.('.storyboard-cell-img--source-crop') || []),
      _0x483b5f,
    ].filter(Boolean);
  for (const _0x3222fb of _0x237583) {
    if (isLoadedImageElement(_0x3222fb) && isExpectedImageSource(_0x3222fb, sourceUrl)) return _0x3222fb;
  }
  return null;
}
export async function resolveStoryboardCommitSourceImage({
  index: _0x2299ad,
  sourceUrl: _0x3d16ca,
  imageCache: _0x38890b,
  cellEls: _0x498db8,
  backdropEl: _0x2e89a2,
  loadImage: loadImage = loadStoryboardSourceImage,
} = {}) {
  const _0x474aa3 = String(_0x3d16ca || '').trim();
  if (!_0x474aa3) return null;
  const _0x487698 = _0x38890b.get(_0x474aa3);
  if (_0x487698) {
    if (typeof _0x487698.then === 'function') {
      const _0xcfc1f6 = await _0x487698;
      if (_0xcfc1f6) _0x38890b.set(_0x474aa3, _0xcfc1f6);
      return _0xcfc1f6 || null;
    }
    return _0x487698;
  }
  const _0x1d0ecc = getLoadedStoryboardSourceImageForCell({
    cellEls: _0x498db8,
    backdropEl: _0x2e89a2,
    index: _0x2299ad,
    sourceUrl: _0x474aa3,
  });
  if (_0x1d0ecc) return (_0x38890b.set(_0x474aa3, _0x1d0ecc), _0x1d0ecc);
  const _0x50d56e = loadImage(_0x474aa3).catch(() => null);
  _0x38890b.set(_0x474aa3, _0x50d56e);
  const _0x41c085 = await _0x50d56e;
  if (_0x41c085) return (_0x38890b.set(_0x474aa3, _0x41c085), _0x41c085);
  return (_0x38890b.delete(_0x474aa3), null);
}
