export function createIcon(value, { size: size = 16, strokeWidth: strokeWidth = 2 } = {}) {
  const item = 'http://www.w3.org/2000/svg',
    el = document.createElementNS(item, 'svg');
  (el.setAttribute('width', String(size)),
    el.setAttribute('height', String(size)),
    el.setAttribute('viewBox', '0 0 24 24'),
    el.setAttribute('fill', 'none'),
    el.setAttribute('stroke', 'currentColor'),
    el.setAttribute('stroke-width', String(strokeWidth)),
    el.setAttribute('stroke-linecap', 'round'),
    el.setAttribute('stroke-linejoin', 'round'));
  for (const key of Array.isArray(value) ? value : [value]) {
    const el2 = document.createElementNS(item, 'path');
    (el2.setAttribute('d', key), el.appendChild(el2));
  }
  return el;
}
export function createIconButton({
  title: title,
  icon: icon,
  onClick: onClick,
  type: type = 'button',
  className: className = '',
}) {
  const el3 = document.createElement('button');
  return (
    (el3.className = ['web-preview-icon-btn', className].filter(Boolean).join(' ')),
    (el3.type = type),
    (el3.title = title),
    el3.appendChild(createIcon(icon, { size: 15 })),
    typeof onClick === 'function' && el3.addEventListener('click', onClick),
    el3
  );
}
export function stopNodeDragPropagation(event) {
  event.stopPropagation();
}
