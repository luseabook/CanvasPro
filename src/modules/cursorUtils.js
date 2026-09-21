export function createLinkCursor(_0x2e69f1 = {}) {
  const _0x3336bc = _0x2e69f1 && typeof _0x2e69f1 === 'object' ? _0x2e69f1 : {},
    _0x29224d = { small: 24, medium: 36, large: 48 },
    _0x49ac73 = { small: 4, medium: 6, large: 8 },
    _0x402c0e = Object.prototype.hasOwnProperty.call(_0x29224d, _0x3336bc.size) ? _0x3336bc.size : 'small',
    _0x1ec227 = _0x3336bc.strokeColor || 'white',
    _0x244652 = _0x3336bc.fillColor || 'white',
    _0x362e40 = _0x3336bc.fillOpacity ?? '0.18',
    _0x32e59e = _0x3336bc.fallback || 'crosshair',
    _0x5ac1b1 = _0x29224d[_0x402c0e],
    _0x33776b = _0x49ac73[_0x402c0e],
    _0x52805b =
      '<svg xmlns="http://www.w3.org/2000/svg" width="' +
      _0x5ac1b1 +
      '" height="' +
      _0x5ac1b1 +
      '" viewBox="0 0 24 24" fill="none" stroke="' +
      _0x1ec227 +
      '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l7.07 16.97 2.51-7.39 7.39-2.51L4 4z" fill="' +
      _0x244652 +
      '" fill-opacity="' +
      _0x362e40 +
      '"/><circle cx="20" cy="20" r="2.5" fill="' +
      _0x1ec227 +
      '"/><path d="M12 12 Q 17 12 19 18" stroke-dasharray="3 3"/></svg>';
  return (
    'url("data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(_0x52805b) +
    '") ' +
    _0x33776b +
    ' ' +
    _0x33776b +
    ', ' +
    _0x32e59e
  );
}
export function getCursorSize() {
  return localStorage.getItem('v2-cursor-style') || localStorage.getItem('cursorSize') || 'small';
}
export function applyLinkCursor(_0x5b9516, _0xcf2f18 = {}) {
  const _0x3c4597 = createLinkCursor(_0xcf2f18);
  _0x5b9516.style.setProperty('cursor', _0x3c4597, 'important');
}
export function removeLinkCursor(_0x15bc78) {
  _0x15bc78.style.removeProperty('cursor');
}
