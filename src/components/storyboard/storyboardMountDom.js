import { buildStoryboardGridTemplate } from '../../core/storyboardCellUtils.js';
const SVG_NS = 'http://www.w3.org/2000/svg';
export function createStoryboardScaleWrap() {
  const _0x18de1d = document.createElement('div');
  return (
    (_0x18de1d.className = 'storyboard-scale-wrap'),
    Object.assign(_0x18de1d.style, {
      width: '100%',
      height: '100%',
      position: 'relative',
      transformOrigin: 'top left',
      transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
    }),
    _0x18de1d
  );
}
export function createStoryboardContainer() {
  const _0x30d226 = document.createElement('div');
  return (
    (_0x30d226.className = 'storyboard-container'),
    Object.assign(_0x30d226.style, {
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '16px',
      border: '1.5px solid var(--stroke-10)',
      background: 'var(--bg-node)',
      boxShadow: 'var(--shadow-surface)',
    }),
    _0x30d226
  );
}
export function createStoryboardGridElement(_0x1083a3) {
  const _0x469899 = document.createElement('div');
  return (
    (_0x469899.className = 'cells-grid'),
    Object.assign(_0x469899.style, {
      position: 'absolute',
      inset: '0',
      display: 'grid',
      gap: '0px',
      background: 'transparent',
      zIndex: '1',
    }),
    (_0x469899.style.gridTemplateColumns = buildStoryboardGridTemplate(_0x1083a3.columns, _0x1083a3.cols)),
    (_0x469899.style.gridTemplateRows = buildStoryboardGridTemplate(_0x1083a3.rowTracks, _0x1083a3.rows)),
    _0x469899
  );
}
function createCollapsedGridIcon() {
  const _0x119a53 = document.createElementNS(SVG_NS, 'svg');
  return (
    _0x119a53.setAttribute('width', '20'),
    _0x119a53.setAttribute('height', '20'),
    _0x119a53.setAttribute('viewBox', '0 0 24 24'),
    _0x119a53.setAttribute('fill', 'none'),
    _0x119a53.setAttribute('stroke', 'currentColor'),
    _0x119a53.setAttribute('stroke-width', '2'),
    (_0x119a53.style.color = 'var(--text-secondary)'),
    [
      ['3', '3'],
      ['14', '3'],
      ['14', '14'],
      ['3', '14'],
    ].forEach(([_0x77b587, _0x2c3183]) => {
      const _0x33a716 = document.createElementNS(SVG_NS, 'rect');
      (_0x33a716.setAttribute('x', _0x77b587),
        _0x33a716.setAttribute('y', _0x2c3183),
        _0x33a716.setAttribute('width', '7'),
        _0x33a716.setAttribute('height', '7'),
        _0x119a53.appendChild(_0x33a716));
    }),
    _0x119a53
  );
}
export function createStoryboardCollapsedBadge(_0x1b17d0) {
  const _0x5452ca = document.createElement('div');
  ((_0x5452ca.className = 'sb-collapsed-badge'),
    Object.assign(_0x5452ca.style, {
      position: 'absolute',
      top: '8px',
      right: '8px',
      background: 'var(--black-60)',
      backdropFilter: 'blur(4px)',
      borderRadius: '10px',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      zIndex: '10',
      transition: 'background 0.2s',
    }));
  const _0xdd214 = document.createElement('span');
  return (
    Object.assign(_0xdd214.style, { color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }),
    (_0xdd214.textContent = String(_0x1b17d0)),
    _0x5452ca.appendChild(createCollapsedGridIcon()),
    _0x5452ca.appendChild(_0xdd214),
    _0x5452ca
  );
}
export function createStoryboardHint(_0xda1632) {
  const _0x517c20 = document.createElement('div');
  return (
    (_0x517c20.className = 'v2-storyboard-hint'),
    Object.assign(_0x517c20.style, {
      position: 'absolute',
      top: 'calc(100% + 18px)',
      left: '50%',
      transform: 'translateX(-50%) scale(var(--zoom-inv, 1))',
      color: 'var(--text-primary)',
      fontSize: '16px',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      transition: 'all 0.2s',
      zIndex: '100',
      textShadow: '0 2px 4px var(--black-50)',
    }),
    (_0x517c20.textContent = _0xda1632 ? '拖拽单元格进行互换，或拖出生成新图' : '双击进入分镜编辑'),
    _0x517c20
  );
}
