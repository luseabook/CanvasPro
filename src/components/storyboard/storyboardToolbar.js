import { t } from '../../i18n/index.js';
const SVG_NS = 'http://www.w3.org/2000/svg';
export function storyboardToolbarText(value, item = {}) {
  return t('storyboard.toolbar.' + value, item);
}
export function createStoryboardToolbarSvg(key, index, result) {
  const el = document.createElementNS(SVG_NS, 'svg');
  return (
    el.setAttribute('width', String(key)),
    el.setAttribute('height', String(index)),
    el.setAttribute('viewBox', '0 0 24 24'),
    el.setAttribute('fill', 'none'),
    el.setAttribute('stroke', 'currentColor'),
    el.setAttribute('stroke-width', String(result)),
    el
  );
}
function createSvgElement(data, options = {}) {
  const el2 = document.createElementNS(SVG_NS, data);
  for (const [target, source] of Object.entries(options)) {
    el2.setAttribute(target, String(source));
  }
  return el2;
}
export function createStoryboardCustomGridIcon() {
  const el3 = createStoryboardToolbarSvg(16, 16, 2);
  return (
    el3.appendChild(createSvgElement('rect', { x: 4, y: 4, width: 16, height: 16, rx: 2 })),
    el3.appendChild(createSvgElement('path', { d: 'M10 4v16' })),
    el3.appendChild(createSvgElement('path', { d: 'M4 14h16' })),
    el3.appendChild(createSvgElement('circle', { cx: 10, cy: 9, r: 1.6 })),
    el3.appendChild(createSvgElement('circle', { cx: 15, cy: 14, r: 1.6 })),
    el3
  );
}
export function setStoryboardSplitLinesButtonContent(enabled) {
  if (!enabled) return;
  enabled.replaceChildren(createStoryboardCustomGridIcon());
}
function createToolbarChevron() {
  const el4 = createStoryboardToolbarSvg(10, 10, 2.5);
  return (
    el4.classList.add('ftb-chevron'),
    el4.setAttribute('stroke', 'var(--text-primary)'),
    (el4.style.marginLeft = '2px'),
    (el4.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'),
    el4.appendChild(createSvgElement('polyline', { points: '6 9 12 15 18 9' })),
    el4
  );
}
function createToolbarDivider() {
  const el5 = document.createElement('div');
  return (
    (el5.className = 'ftb-divider'),
    Object.assign(el5.style, {
      width: '1px',
      height: '14px',
      background: 'var(--white-10)',
      margin: '0 4px',
    }),
    el5
  );
}
function createAspectButton(aspectRatio) {
  const el6 = document.createElement('button');
  ((el6.className = 'ftb-btn act-aspect'),
    el6.setAttribute('aria-label', storyboardToolbarText('toggleAspect')));
  const el7 = createStoryboardToolbarSvg(14, 14, 2);
  el7.appendChild(createSvgElement('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2, ry: 2 }));
  const el8 = document.createElement('span');
  return (
    (el8.textContent = storyboardToolbarText('aspectLabel', {
      aspectRatio: aspectRatio.aspectRatio || '1:1',
    })),
    el6.appendChild(el7),
    el6.appendChild(el8),
    el6.appendChild(createToolbarChevron()),
    el6
  );
}
function createGridButton(cols) {
  const el9 = document.createElement('button');
  ((el9.className = 'ftb-btn act-grid'), el9.setAttribute('aria-label', storyboardToolbarText('toggleGrid')));
  const el10 = createStoryboardToolbarSvg(14, 14, 2);
  [
    { x: 3, y: 3 },
    { x: 14, y: 3 },
    { x: 14, y: 14 },
    { x: 3, y: 14 },
  ].forEach((x) => {
    el10.appendChild(createSvgElement('rect', { x: x.x, y: x.y, width: 7, height: 7 }));
  });
  const el11 = document.createElement('span');
  return (
    (el11.textContent = storyboardToolbarText('gridLabel', {
      cols: cols.cols || 2,
      rows: cols.rows || 2,
    })),
    el9.appendChild(el10),
    el9.appendChild(el11),
    el9.appendChild(createToolbarChevron()),
    el9
  );
}
function createSplitLinesButton() {
  const el12 = document.createElement('button');
  return (
    (el12.className = 'ftb-btn icon-only storyboard-split-lines-trigger act-split-lines'),
    (el12.dataset.tooltip = storyboardToolbarText('adjustSplitLines')),
    el12.setAttribute('aria-label', storyboardToolbarText('adjustSplitLines')),
    setStoryboardSplitLinesButtonContent(el12),
    el12
  );
}
function createEditButton(next) {
  const el13 = document.createElement('button');
  el13.className = 'ftb-btn icon-only act-edit';
  if (next) el13.classList.add('active');
  ((el13.dataset.tooltip = next ? storyboardToolbarText('exitEdit') : storyboardToolbarText('edit')),
    el13.setAttribute(
      'aria-label',
      next ? storyboardToolbarText('exitEdit') : storyboardToolbarText('edit'),
    ));
  const el14 = createStoryboardToolbarSvg(16, 16, 2);
  return (
    el14.appendChild(createSvgElement('path', { d: 'M12 20h9' })),
    el14.appendChild(
      createSvgElement('path', {
        d: 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z',
      }),
    ),
    el13.appendChild(el14),
    el13
  );
}
function createComposeButton() {
  const el15 = document.createElement('button');
  ((el15.className = 'ftb-btn icon-only act-compose'),
    (el15.dataset.tooltip = storyboardToolbarText('compose')),
    el15.setAttribute('aria-label', storyboardToolbarText('compose')));
  const el16 = createStoryboardToolbarSvg(16, 16, 2);
  return (el16.appendChild(createSvgElement('path', { d: 'M12 3v18m9-9H3' })), el15.appendChild(el16), el15);
}
function createClearButton() {
  const el17 = document.createElement('button');
  ((el17.className = 'ftb-btn icon-only act-clear'),
    (el17.dataset.tooltip = storyboardToolbarText('clear')),
    el17.setAttribute('aria-label', storyboardToolbarText('clear')));
  const el18 = createStoryboardToolbarSvg(16, 16, 2);
  return (
    el18.appendChild(createSvgElement('polyline', { points: '3 6 5 6 21 6' })),
    el18.appendChild(
      createSvgElement('path', {
        d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2',
      }),
    ),
    el17.appendChild(el18),
    el17
  );
}
function createCollapseButton(points) {
  const el19 = document.createElement('button');
  ((el19.className = 'ftb-btn icon-only act-collapse'),
    (el19.dataset.tooltip = points ? storyboardToolbarText('expand') : storyboardToolbarText('collapse')),
    el19.setAttribute(
      'aria-label',
      points ? storyboardToolbarText('expand') : storyboardToolbarText('collapse'),
    ));
  const el20 = createStoryboardToolbarSvg(16, 16, 2);
  return (
    el20.appendChild(
      createSvgElement('polyline', {
        points: points ? '6 9 12 15 18 9' : '18 15 12 9 6 15',
      }),
    ),
    el19.appendChild(el20),
    el19
  );
}
export function createStoryboardToolbar({
  data: data2,
  isEditing: isEditing = false,
  isCollapsed: isCollapsed = false,
} = {}) {
  const el21 = document.createElement('div');
  return (
    (el21.className = 'node-floating-toolbar storyboard-toolbar'),
    Object.assign(el21.style, { display: 'flex', alignItems: 'center', gap: '4px' }),
    el21.appendChild(createAspectButton(data2 || {})),
    el21.appendChild(createGridButton(data2 || {})),
    el21.appendChild(createToolbarDivider()),
    el21.appendChild(createSplitLinesButton()),
    el21.appendChild(createEditButton(isEditing)),
    el21.appendChild(createComposeButton()),
    el21.appendChild(createClearButton()),
    el21.appendChild(createCollapseButton(isCollapsed)),
    el21
  );
}
