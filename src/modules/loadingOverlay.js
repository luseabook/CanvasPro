const pendingLoadings = new WeakMap();
function normalizeVariant(_0x22cb0e = {}) {
  return _0x22cb0e && _0x22cb0e.variant === 'static' ? 'static' : 'full';
}
function applyLoadingVariant(_0x4eaf52, _0x2ff52f) {
  (_0x4eaf52.classList.add('img-preview-loading'),
    _0x2ff52f === 'static'
      ? _0x4eaf52.classList.add('img-preview-loading--static')
      : _0x4eaf52.classList.remove('img-preview-loading--static'));
}
export function startLoading(_0x513d23, _0x349220 = {}) {
  if (!_0x513d23) return;
  const _0x465ac4 = normalizeVariant(_0x349220),
    _0xd3e171 = pendingLoadings.get(_0x513d23);
  if (_0xd3e171) {
    _0xd3e171.variant = _0x465ac4;
    return;
  }
  if (
    _0x513d23.classList?.contains?.('img-preview-loading') ||
    _0x513d23.querySelector?.('.img-loading-overlay')
  ) {
    applyLoadingVariant(_0x513d23, _0x465ac4);
    return;
  }
  const _0x2ff6be = { variant: _0x465ac4 };
  (pendingLoadings.set(_0x513d23, _0x2ff6be),
    setTimeout(() => {
      if (pendingLoadings.get(_0x513d23) !== _0x2ff6be) return;
      if (_0x513d23.querySelector('.img-loading-overlay')) return;
      applyLoadingVariant(_0x513d23, _0x2ff6be.variant);
      const _0x13a319 = document.createElement('div');
      _0x13a319.className = 'img-loading-overlay';
      if (_0x2ff6be.variant !== 'static') {
        const _0x599eed = document.createElement('div');
        ((_0x599eed.className = 'img-loading-shimmer'), _0x13a319.appendChild(_0x599eed));
      }
      _0x513d23.appendChild(_0x13a319);
    }, 50));
}
export function stopLoading(_0x300ee9) {
  if (!_0x300ee9) return;
  (pendingLoadings.delete(_0x300ee9),
    _0x300ee9.classList.remove('img-preview-loading'),
    _0x300ee9.classList.remove('img-preview-loading--static'),
    _0x300ee9.querySelectorAll('.img-loading-overlay').forEach((_0x3c20ad) => _0x3c20ad.remove()));
}
