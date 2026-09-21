export function createIcon(_0x2d6109, { size: size = 16, strokeWidth: strokeWidth = 2 } = {}) {
  const _0x1dc13c = 'http://www.w3.org/2000/svg',
    _0x4119c5 = document.createElementNS(_0x1dc13c, 'svg');
  (_0x4119c5.setAttribute('width', String(size)),
    _0x4119c5.setAttribute('height', String(size)),
    _0x4119c5.setAttribute('viewBox', '0 0 24 24'),
    _0x4119c5.setAttribute('fill', 'none'),
    _0x4119c5.setAttribute('stroke', 'currentColor'),
    _0x4119c5.setAttribute('stroke-width', String(strokeWidth)),
    _0x4119c5.setAttribute('stroke-linecap', 'round'),
    _0x4119c5.setAttribute('stroke-linejoin', 'round'));
  for (const _0x2f0529 of Array.isArray(_0x2d6109) ? _0x2d6109 : [_0x2d6109]) {
    const _0x18db83 = document.createElementNS(_0x1dc13c, 'path');
    (_0x18db83.setAttribute('d', _0x2f0529), _0x4119c5.appendChild(_0x18db83));
  }
  return _0x4119c5;
}
export function createIconButton({
  title: _0x37ee93,
  icon: _0x27088f,
  onClick: _0x56818d,
  type: type = 'button',
  className: className = '',
}) {
  const _0x2d732b = document.createElement('button');
  return (
    (_0x2d732b.className = ['web-preview-icon-btn', className].filter(Boolean).join(' ')),
    (_0x2d732b.type = type),
    (_0x2d732b.title = _0x37ee93),
    _0x2d732b.appendChild(createIcon(_0x27088f, { size: 15 })),
    typeof _0x56818d === 'function' && _0x2d732b.addEventListener('click', _0x56818d),
    _0x2d732b
  );
}
export function stopNodeDragPropagation(_0x2c1e72) {
  _0x2c1e72.stopPropagation();
}
