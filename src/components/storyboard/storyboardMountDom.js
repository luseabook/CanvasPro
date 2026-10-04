import { buildStoryboardGridTemplate } from '../../core/storyboardCellUtils.js';
const SVG_NS = 'http://www.w3.org/2000/svg';
export function createStoryboardScaleWrap() {
  const el = document.createElement('div');
  return (
    (el.className = 'storyboard-scale-wrap'),
    Object.assign(el.style, {
      width: '100%',
      height: '100%',
      position: 'relative',
      transformOrigin: 'top left',
      transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
    }),
    el
  );
}
export function createStoryboardContainer() {
  const el2 = document.createElement('div');
  return (
    (el2.className = 'storyboard-container'),
    Object.assign(el2.style, {
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '16px',
      border: '1.5px solid var(--stroke-10)',
      background: 'var(--bg-node)',
      boxShadow: 'var(--shadow-surface)',
    }),
    el2
  );
}
export function createStoryboardGridElement(value) {
  const el3 = document.createElement('div');
  return (
    (el3.className = 'cells-grid'),
    Object.assign(el3.style, {
      position: 'absolute',
      inset: '0',
      display: 'grid',
      gap: '0px',
      background: 'transparent',
      zIndex: '1',
    }),
    (el3.style.gridTemplateColumns = buildStoryboardGridTemplate(value.columns, value.cols)),
    (el3.style.gridTemplateRows = buildStoryboardGridTemplate(value.rowTracks, value.rows)),
    el3
  );
}
function createCollapsedGridIcon() {
  const el4 = document.createElementNS(SVG_NS, 'svg');
  return (
    el4.setAttribute('width', '20'),
    el4.setAttribute('height', '20'),
    el4.setAttribute('viewBox', '0 0 24 24'),
    el4.setAttribute('fill', 'none'),
    el4.setAttribute('stroke', 'currentColor'),
    el4.setAttribute('stroke-width', '2'),
    (el4.style.color = 'var(--text-secondary)'),
    [
      ['3', '3'],
      ['14', '3'],
      ['14', '14'],
      ['3', '14'],
    ].forEach(([item, key]) => {
      const el5 = document.createElementNS(SVG_NS, 'rect');
      (el5.setAttribute('x', item),
        el5.setAttribute('y', key),
        el5.setAttribute('width', '7'),
        el5.setAttribute('height', '7'),
        el4.appendChild(el5));
    }),
    el4
  );
}
export function createStoryboardCollapsedBadge(index) {
  const el6 = document.createElement('div');
  ((el6.className = 'sb-collapsed-badge'),
    Object.assign(el6.style, {
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
  const el7 = document.createElement('span');
  return (
    Object.assign(el7.style, { color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }),
    (el7.textContent = String(index)),
    el6.appendChild(createCollapsedGridIcon()),
    el6.appendChild(el7),
    el6
  );
}
export function createStoryboardHint(result) {
  const el8 = document.createElement('div');
  return (
    (el8.className = 'v2-storyboard-hint'),
    Object.assign(el8.style, {
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
    (el8.textContent = result ? '拖拽单元格进行互换，或拖出生成新图' : '双击进入分镜编辑'),
    el8
  );
}
