import { normalizeStoryboardGridGap, STORYBOARD_GRID_GAP_MAX } from '../../core/storyboardCellUtils.js';
export function createStoryboardSplitLinesMenu({ getGap: getGap, onGapChange: onGapChange } = {}) {
  const el = document.createElement('div');
  el.className = 'v2-canvas-ctx-menu v2-sb-dropdown storyboard-split-lines-menu';
  const el2 = document.createElement('div');
  el2.className = 'storyboard-grid-gap-row';
  const el3 = document.createElement('span');
  ((el3.className = 'storyboard-grid-gap-label'), (el3.textContent = '线间距'));
  const el4 = document.createElement('span');
  el4.className = 'storyboard-grid-gap-readout';
  const el5 = document.createElement('div');
  el5.className = 'storyboard-grid-gap-control';
  const el6 = document.createElement('input');
  return (
    (el6.type = 'range'),
    (el6.min = '0'),
    (el6.max = String(STORYBOARD_GRID_GAP_MAX)),
    (el6.step = '1'),
    (el6.value = String(getGap?.() ?? 0)),
    (el4.textContent = el6.value + 'px'),
    el6.addEventListener('input', (event) => {
      event.stopPropagation?.();
      const storyboardGridGap = normalizeStoryboardGridGap(event.target?.value, getGap?.() ?? 0);
      ((el6.value = String(storyboardGridGap)),
        (el4.textContent = storyboardGridGap + 'px'),
        onGapChange?.(storyboardGridGap));
    }),
    el6.addEventListener('pointerdown', (event2) => {
      event2.stopPropagation?.();
    }),
    el5.appendChild(el6),
    el2.appendChild(el3),
    el2.appendChild(el4),
    el.appendChild(el2),
    el.appendChild(el5),
    el
  );
}
export function bindStoryboardSplitLinesMenuDismiss({
  menu: menu,
  anchor: anchor,
  shouldKeepOpen: shouldKeepOpen,
  onDismiss: onDismiss,
} = {}) {
  const value = (event3) => {
    if (shouldKeepOpen?.()) return;
    !menu?.contains?.(event3.target) && !anchor?.contains?.(event3.target) && onDismiss?.();
  };
  return (document.addEventListener('pointerdown', value), value);
}
