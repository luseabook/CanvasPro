import { t } from '../../i18n/index.js';
const SVG_NS = 'http://www.w3.org/2000/svg';
function storyboardCellText(value, item = {}) {
  return t('storyboard.cell.' + value, item);
}
function createEmptyPlusIcon() {
  const el = document.createElementNS(SVG_NS, 'svg');
  (el.setAttribute('width', '24'),
    el.setAttribute('height', '24'),
    el.setAttribute('viewBox', '0 0 24 24'),
    el.setAttribute('fill', 'none'),
    el.setAttribute('stroke', 'currentColor'),
    el.setAttribute('stroke-width', '1.5'));
  const el2 = document.createElementNS(SVG_NS, 'path');
  return (el2.setAttribute('d', 'M12 3v18m9-9H3'), el.appendChild(el2), el);
}
export function createStoryboardCellImageElement(key) {
  const el3 = document.createElement('img');
  return (
    (el3.className = 'storyboard-cell-img'),
    el3.setAttribute('src', key),
    (el3.decoding = 'async'),
    (el3.loading = 'eager'),
    (el3.style.width = '100%'),
    (el3.style.height = '100%'),
    (el3.style.objectFit = 'cover'),
    (el3.style.pointerEvents = 'none'),
    el3.addEventListener('error', () => {
      const el4 = el3.parentElement;
      if (!el4) return;
      el4.replaceChildren();
      const el5 = document.createElement('div');
      ((el5.style.color = 'var(--text-muted)'),
        (el5.style.fontSize = '10px'),
        (el5.textContent = storyboardCellText('loadFailed')),
        el4.appendChild(el5));
    }),
    el3
  );
}
function createResidualImage(index) {
  const el6 = document.createElement('img');
  return (
    (el6.className = 'storyboard-empty-residual-img'),
    el6.setAttribute('src', index),
    (el6.decoding = 'async'),
    (el6.loading = 'eager'),
    (el6.style.pointerEvents = 'none'),
    el6
  );
}
function createEmptyPlaceholder(result = 'empty-placeholder') {
  const el7 = document.createElement('div');
  return (
    (el7.className = result),
    (el7.style.color = 'var(--white-10)'),
    el7.appendChild(createEmptyPlusIcon()),
    el7
  );
}
function createEmptyResidualContent(data) {
  const el8 = document.createElement('div');
  return (
    (el8.className = 'storyboard-empty-residual'),
    el8.appendChild(createResidualImage(data)),
    el8.appendChild(createEmptyPlaceholder('empty-placeholder storyboard-empty-cutout')),
    el8
  );
}
function createExtractedCellContent(options, target, source) {
  const el9 = document.createElement('div');
  el9.className = 'storyboard-extracted-cell-content';
  if (source) el9.appendChild(createResidualImage(source));
  const el10 = createStoryboardCellImageElement(target);
  return (el10.classList.add('storyboard-cell-img--extracted-cutout'), el9.appendChild(el10), el9);
}
export function createStoryboardCellContentNode({
  cell: cell,
  finalUrl: finalUrl,
  residualUrl: residualUrl = '',
} = {}) {
  if (!cell) return document.createTextNode('');
  if (!finalUrl) return residualUrl ? createEmptyResidualContent(residualUrl) : createEmptyPlaceholder();
  if (cell.storyboardExtractedCell === true || cell.storyboardLockedCell === true)
    return createExtractedCellContent(cell, finalUrl, residualUrl);
  return createStoryboardCellImageElement(finalUrl);
}
export function buildReusableStoryboardCellImageMap(list) {
  const map = new Map();
  if (!list) return map;
  return (
    list.forEach((el11) => {
      const el12 = el11?.querySelector?.('.cell-content-wrap'),
        enabled = el12?.querySelector?.('.storyboard-cell-img');
      if (!enabled || enabled.tagName !== 'IMG') return;
      const next = enabled.getAttribute('src') || '';
      if (next && !map.has(next)) map.set(next, enabled);
    }),
    map
  );
}
export function cloneReusableStoryboardCellImage(current, map2) {
  const enabled2 = map2?.get?.(current);
  if (!enabled2 || enabled2.tagName !== 'IMG') return null;
  const el13 = enabled2.cloneNode(false);
  return (
    el13.classList.remove('is-cell-preloading', 'is-cell-ready'),
    el13.classList.add('storyboard-cell-img'),
    el13.setAttribute('src', current),
    (el13.decoding = 'async'),
    (el13.loading = 'eager'),
    (el13.style.width = '100%'),
    (el13.style.height = '100%'),
    (el13.style.objectFit = 'cover'),
    (el13.style.pointerEvents = 'none'),
    (el13.style.position = ''),
    (el13.style.inset = ''),
    (el13.style.opacity = ''),
    (el13.style.transition = ''),
    el13
  );
}
