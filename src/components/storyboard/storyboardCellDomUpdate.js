import { cloneReusableStoryboardCellImage } from './storyboardCellContent.js';
export function updateStoryboardCellDOM({
  cellEl: _0x453a94,
  cell: _0x20a196,
  reusableImageMap: reusableImageMap = null,
  getCellDisplayImageUrl: _0x10d792,
  getCellResidualImageUrl: _0x358a55,
  createContentNode: _0x4a6ff8,
  applyCropStyles: _0x12d610,
} = {}) {
  if (!_0x20a196) return;
  const _0x46dce1 = _0x453a94?.querySelector?.('.cell-content-wrap') || null;
  if (!_0x46dce1) return;
  const _0x3bbb68 = _0x10d792?.(_0x20a196) || '',
    _0x5c1f38 = !_0x3bbb68,
    _0x58c440 = _0x46dce1.firstElementChild;
  if (_0x5c1f38) {
    const _0x1b3ec3 = !!_0x358a55?.(_0x20a196),
      _0x43afc2 = _0x58c440?.classList?.contains('storyboard-empty-residual') === true,
      _0x54dfb9 = _0x58c440?.classList?.contains('empty-placeholder') === true && !_0x43afc2;
    if ((_0x1b3ec3 && _0x43afc2) || (!_0x1b3ec3 && _0x54dfb9)) {
      _0x12d610?.();
      return;
    }
  } else {
    if (_0x58c440 && _0x58c440.tagName === 'IMG' && _0x58c440.getAttribute('src') === _0x3bbb68) {
      _0x12d610?.();
      return;
    }
  }
  if (!_0x5c1f38 && _0x58c440 && _0x58c440.tagName === 'IMG') {
    const _0x534dc3 = cloneReusableStoryboardCellImage(_0x3bbb68, reusableImageMap);
    if (_0x534dc3) {
      (delete _0x46dce1.__storyboardPendingSrc, _0x46dce1.replaceChildren(_0x534dc3), _0x12d610?.());
      return;
    }
  }
  const _0x10aa0c = _0x4a6ff8?.(_0x20a196);
  if (!_0x5c1f38 && _0x58c440 && _0x58c440.tagName === 'IMG' && _0x10aa0c?.tagName === 'IMG') {
    const _0x6f6c24 = _0x3bbb68;
    ((_0x46dce1.__storyboardPendingSrc = _0x6f6c24),
      _0x46dce1
        .querySelectorAll('.storyboard-cell-img.is-cell-preloading')
        .forEach((_0xee7656) => _0xee7656.remove()));
    const _0x2ee98f = () => {
      if (_0x46dce1.__storyboardPendingSrc !== _0x6f6c24) return;
      (_0x10aa0c.classList.remove('is-cell-preloading', 'is-cell-ready'),
        _0x46dce1.replaceChildren(_0x10aa0c),
        _0x12d610?.(),
        delete _0x46dce1.__storyboardPendingSrc);
    };
    if (_0x10aa0c.complete && _0x10aa0c.naturalWidth > 0) {
      _0x2ee98f();
      return;
    }
    let _0x5ec76c = false;
    const _0x2fcb1a = () => {
      if (_0x5ec76c) return;
      if (_0x46dce1.__storyboardPendingSrc !== _0x6f6c24) return;
      ((_0x5ec76c = true), _0x10aa0c.classList.add('is-cell-ready'), setTimeout(_0x2ee98f, 60));
    };
    (_0x10aa0c.classList.add('is-cell-preloading'),
      _0x10aa0c.addEventListener('load', _0x2fcb1a, { once: true }),
      _0x46dce1.appendChild(_0x10aa0c));
    _0x10aa0c.complete && _0x10aa0c.naturalWidth > 0 && _0x2fcb1a();
    return;
  }
  (delete _0x46dce1.__storyboardPendingSrc, _0x46dce1.replaceChildren());
  if (_0x10aa0c) _0x46dce1.appendChild(_0x10aa0c);
  _0x12d610?.();
}
