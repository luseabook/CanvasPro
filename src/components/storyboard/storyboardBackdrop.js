export function createStoryboardBackdropImage(_0x6c78a3) {
  if (!_0x6c78a3) return null;
  const _0x1aae0b = document.createElement('img');
  return (
    (_0x1aae0b.className = 'storyboard-source-backdrop'),
    _0x1aae0b.setAttribute('src', _0x6c78a3),
    _0x1aae0b.setAttribute('aria-hidden', 'true'),
    (_0x1aae0b.decoding = 'async'),
    (_0x1aae0b.loading = 'eager'),
    Object.assign(_0x1aae0b.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      objectFit: 'fill',
      opacity: '1',
      pointerEvents: 'none',
      zIndex: '0',
    }),
    _0x1aae0b
  );
}
export function syncStoryboardBackdropImage({
  container: _0x52cc4e,
  grid: _0x4e47b6,
  backdropEl: _0x45e064,
  nextUrl: _0x1d326f,
} = {}) {
  if (!_0x52cc4e) return _0x45e064 || null;
  let _0x5f08a3 = _0x45e064 || _0x52cc4e.querySelector?.('.storyboard-source-backdrop') || null;
  if (!_0x1d326f) return (_0x5f08a3?.remove?.(), null);
  if (!_0x5f08a3) {
    _0x5f08a3 = createStoryboardBackdropImage(_0x1d326f);
    const _0x4a8774 =
      _0x4e47b6 && _0x4e47b6.parentNode === _0x52cc4e ? _0x4e47b6 : _0x52cc4e.firstElementChild || null;
    typeof _0x52cc4e.insertBefore === 'function' && _0x4a8774
      ? _0x52cc4e.insertBefore(_0x5f08a3, _0x4a8774)
      : _0x52cc4e.appendChild(_0x5f08a3);
  } else _0x5f08a3.getAttribute('src') !== _0x1d326f && _0x5f08a3.setAttribute('src', _0x1d326f);
  return _0x5f08a3;
}
