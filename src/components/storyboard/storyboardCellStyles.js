import { buildStoryboardCropRect } from '../../core/storyboardCellUtils.js';
export function applyStoryboardDefaultCellImageStyles(_0x2efd7a, _0x11bd44, _0x55437c) {
  const _0x543330 = String(_0x11bd44 || '');
  (_0x2efd7a.getAttribute('src') !== _0x543330 && _0x2efd7a.setAttribute('src', _0x543330),
    _0x2efd7a.classList.remove('storyboard-cell-img--source-crop'),
    (_0x2efd7a.style.position = ''),
    (_0x2efd7a.style.inset = ''),
    (_0x2efd7a.style.left = ''),
    (_0x2efd7a.style.top = ''),
    (_0x2efd7a.style.display = ''),
    (_0x2efd7a.style.width = '100%'),
    (_0x2efd7a.style.height = '100%'),
    (_0x2efd7a.style.objectFit =
      _0x55437c?.storyboardExtractedCell === true || _0x55437c?.storyboardLockedCell === true
        ? 'fill'
        : 'cover'));
}
export function getStoryboardCellDisplaySourceSize(_0x4a677e, _0x4e67be = null, _0x4fa9c0 = {}) {
  const _0x267da2 = Math.trunc(Number(_0x4e67be?.naturalWidth || _0x4e67be?.width) || 0),
    _0x28e1b1 = Math.trunc(Number(_0x4e67be?.naturalHeight || _0x4e67be?.height) || 0);
  return {
    width: Math.max(
      1,
      _0x267da2 ||
        Math.trunc(
          Number(_0x4a677e?.sourceWidth) ||
            Number(_0x4fa9c0?.storyboardSourceWidth) ||
            Number(_0x4fa9c0?.sourceWidth) ||
            Number(_0x4fa9c0?.width) ||
            1,
        ),
    ),
    height: Math.max(
      1,
      _0x28e1b1 ||
        Math.trunc(
          Number(_0x4a677e?.sourceHeight) ||
            Number(_0x4fa9c0?.storyboardSourceHeight) ||
            Number(_0x4fa9c0?.sourceHeight) ||
            Number(_0x4fa9c0?.height) ||
            1,
        ),
    ),
  };
}
export function applyStoryboardSourceCropImageStyles({
  img: _0x4eac42,
  cell: _0x455b0c,
  index: _0x54ccdf,
  sourceUrl: _0x426af4,
  node: _0x4ef668,
  sourceIndex: _0x5c9287,
  isLoadedImageElement: _0x39fa65,
  onImageLoad: _0x5a371e,
} = {}) {
  if (!_0x4eac42 || !_0x426af4) return;
  _0x4eac42.getAttribute('src') !== _0x426af4 && _0x4eac42.setAttribute('src', _0x426af4);
  (_0x4eac42.classList.add('storyboard-cell-img--source-crop'),
    (_0x4eac42.style.display = 'block'),
    (_0x4eac42.style.position = 'absolute'),
    (_0x4eac42.style.inset = ''),
    (_0x4eac42.style.objectFit = 'fill'),
    (_0x4eac42.style.pointerEvents = 'none'));
  const _0x70ea91 = getStoryboardCellDisplaySourceSize(_0x455b0c, _0x4eac42, _0x4ef668),
    _0x109bb3 = buildStoryboardCropRect(_0x4ef668, _0x5c9287 ?? _0x54ccdf, {
      width: _0x70ea91.width,
      height: _0x70ea91.height,
      inset: 0,
    });
  if (!_0x109bb3 || _0x109bb3.sw <= 0 || _0x109bb3.sh <= 0) {
    ((_0x4eac42.style.left = '0'),
      (_0x4eac42.style.top = '0'),
      (_0x4eac42.style.width = '100%'),
      (_0x4eac42.style.height = '100%'));
    return;
  }
  ((_0x4eac42.style.left = -(_0x109bb3.sx / _0x109bb3.sw) * 100 + '%'),
    (_0x4eac42.style.top = -(_0x109bb3.sy / _0x109bb3.sh) * 100 + '%'),
    (_0x4eac42.style.width = (_0x70ea91.width / _0x109bb3.sw) * 100 + '%'),
    (_0x4eac42.style.height = (_0x70ea91.height / _0x109bb3.sh) * 100 + '%'),
    !_0x39fa65?.(_0x4eac42) && _0x4eac42.addEventListener?.('load', _0x5a371e, { once: true }));
}
export function syncStoryboardSourceCacheImage({
  cellEl: _0x577133,
  sourceUrl: _0x48dd9b,
  onReady: onReady = null,
  isLoadedImageElement: _0x25f520,
} = {}) {
  const _0x112e19 = _0x577133?.querySelector?.('.cell-content-wrap') || null;
  if (!_0x112e19) return;
  const _0x4db517 = _0x112e19.querySelector?.('.storyboard-cell-source-cache') || null,
    _0x294d88 = String(_0x48dd9b || '').trim();
  if (!_0x294d88) {
    _0x4db517?.remove?.();
    return;
  }
  const _0x1283e2 = (_0x5f2277) => {
    if (typeof onReady !== 'function' || !_0x5f2277) return;
    if (_0x25f520?.(_0x5f2277)) return;
    _0x5f2277.addEventListener?.('load', onReady, { once: true });
  };
  if (_0x4db517) {
    _0x4db517.getAttribute('src') !== _0x294d88 && _0x4db517.setAttribute('src', _0x294d88);
    _0x1283e2(_0x4db517);
    return;
  }
  const _0x165a7e = document.createElement('img');
  ((_0x165a7e.className = 'storyboard-cell-source-cache storyboard-cell-img--source-crop'),
    _0x165a7e.setAttribute('src', _0x294d88),
    _0x165a7e.setAttribute('aria-hidden', 'true'),
    (_0x165a7e.decoding = 'async'),
    (_0x165a7e.loading = 'eager'),
    _0x112e19.appendChild(_0x165a7e),
    _0x1283e2(_0x165a7e));
}
export function applyStoryboardEmptyCutoutStyles(_0x577418) {
  if (!_0x577418) return;
  const _0x2b72c2 = _0x577418.querySelector?.('.storyboard-empty-cutout') || null;
  if (!_0x2b72c2) return;
  ((_0x2b72c2.style.display = 'flex'),
    (_0x2b72c2.style.position = 'absolute'),
    (_0x2b72c2.style.left = '0'),
    (_0x2b72c2.style.top = '0'),
    (_0x2b72c2.style.width = '100%'),
    (_0x2b72c2.style.height = '100%'));
}
export function applyStoryboardEmptyResidualImageStyles({
  img: _0x3290f6,
  cell: _0x3faad2,
  node: _0x26811f,
  activeBounds: _0x3e32b9,
} = {}) {
  if (!_0x3290f6) return;
  const _0x31c2a3 = String(_0x3faad2?.residualImageMode || '');
  if (_0x31c2a3 !== 'source') {
    ((_0x3290f6.style.position = 'absolute'),
      (_0x3290f6.style.inset = '0'),
      (_0x3290f6.style.left = '0'),
      (_0x3290f6.style.top = '0'),
      (_0x3290f6.style.width = '100%'),
      (_0x3290f6.style.height = '100%'),
      (_0x3290f6.style.objectFit = 'cover'));
    return;
  }
  const _0x140452 = Math.max(
      1,
      Number(_0x3faad2?.residualImageWidth) ||
        Number(_0x3faad2?.sourceWidth) ||
        Number(_0x26811f?.sourceWidth) ||
        1,
    ),
    _0x1cc6d1 = Math.max(
      1,
      Number(_0x3faad2?.residualImageHeight) ||
        Number(_0x3faad2?.sourceHeight) ||
        Number(_0x26811f?.sourceHeight) ||
        1,
    );
  if (!_0x3e32b9 || _0x3e32b9.width <= 0 || _0x3e32b9.height <= 0) {
    ((_0x3290f6.style.position = 'absolute'),
      (_0x3290f6.style.inset = '0'),
      (_0x3290f6.style.width = '100%'),
      (_0x3290f6.style.height = '100%'),
      (_0x3290f6.style.objectFit = 'cover'));
    return;
  }
  const _0xebfd04 = _0x140452 / Math.max(1, Number(_0x26811f?.width) || 1),
    _0x8b1d86 = _0x1cc6d1 / Math.max(1, Number(_0x26811f?.height) || 1),
    _0x450d3d = _0x3e32b9.x0 * _0xebfd04,
    _0x10f3d5 = _0x3e32b9.y0 * _0x8b1d86,
    _0x27b38a = Math.max(1, _0x3e32b9.width * _0xebfd04),
    _0x9e6ede = Math.max(1, _0x3e32b9.height * _0x8b1d86);
  ((_0x3290f6.style.position = 'absolute'),
    (_0x3290f6.style.inset = ''),
    (_0x3290f6.style.left = -(_0x450d3d / _0x27b38a) * 100 + '%'),
    (_0x3290f6.style.top = -(_0x10f3d5 / _0x9e6ede) * 100 + '%'),
    (_0x3290f6.style.width = (_0x140452 / _0x27b38a) * 100 + '%'),
    (_0x3290f6.style.height = (_0x1cc6d1 / _0x9e6ede) * 100 + '%'),
    (_0x3290f6.style.objectFit = 'fill'));
}
export function applyStoryboardCellLayoutStyles({
  cellEl: _0x2ada1b,
  isCustomGridEditing: isCustomGridEditing = false,
  frozen: frozen = null,
  bounds: bounds = null,
} = {}) {
  if (!_0x2ada1b) return;
  if (isCustomGridEditing && frozen) {
    ((_0x2ada1b.style.display = frozen.display),
      (_0x2ada1b.style.position = frozen.position),
      (_0x2ada1b.style.left = frozen.left),
      (_0x2ada1b.style.top = frozen.top),
      (_0x2ada1b.style.width = frozen.width),
      (_0x2ada1b.style.height = frozen.height));
    return;
  }
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
    _0x2ada1b.style.display = 'none';
    return;
  }
  ((_0x2ada1b.style.display = 'flex'),
    (_0x2ada1b.style.position = 'absolute'),
    (_0x2ada1b.style.left = bounds.x0 + 'px'),
    (_0x2ada1b.style.top = bounds.y0 + 'px'),
    (_0x2ada1b.style.width = bounds.width + 'px'),
    (_0x2ada1b.style.height = bounds.height + 'px'));
}
export function captureStoryboardCellVisualState(_0x1b587e) {
  if (!_0x1b587e) return null;
  return _0x1b587e.map((_0x1883b5) => ({
    display: _0x1883b5.style.display || '',
    position: _0x1883b5.style.position || '',
    left: _0x1883b5.style.left || '',
    top: _0x1883b5.style.top || '',
    width: _0x1883b5.style.width || '',
    height: _0x1883b5.style.height || '',
  }));
}
