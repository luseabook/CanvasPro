export function removeStoryboardCustomGridOverlay(el) {
  return (el?.remove?.(), null);
}
export function applyStoryboardCustomGridLineSize(el2, value, item) {
  const key = Math.max(0, Number(item) || 0),
    index = Math.max(1, Math.round(key)) + 'px',
    result = Math.max(0.5, key / 2) + 'px',
    data = Math.max(18, Math.round(key)) + 'px';
  if (typeof el2.style?.setProperty === 'function')
    (el2.style.setProperty('--storyboard-grid-line-size', index),
      el2.style.setProperty('--storyboard-grid-line-half-size', result));
  else
    el2.style &&
      ((el2.style['--storyboard-grid-line-size'] = index),
      (el2.style['--storyboard-grid-line-half-size'] = result));
  if (value === 'columns') el2.style.width = data;
  else el2.style.height = data;
}
function createGridLine({
  editable: editable,
  axis: axis,
  index: index2,
  position: position,
  lineSize: lineSize,
  onPointerDown: onPointerDown,
}) {
  const el3 = document.createElement(editable ? 'button' : 'div');
  if (editable) el3.type = 'button';
  const options = axis === 'columns';
  ((el3.className = editable
    ? 'storyboard-custom-grid-handle storyboard-custom-grid-handle-' + (options ? 'vertical' : 'horizontal')
    : 'storyboard-custom-grid-line storyboard-custom-grid-line-' + (options ? 'vertical' : 'horizontal')),
    (el3.dataset.axis = axis),
    (el3.dataset.index = String(index2)),
    el3.setAttribute('aria-label', options ? 'Move vertical split line' : 'Move horizontal split line'));
  if (options) el3.style.left = position;
  else el3.style.top = position;
  return (
    applyStoryboardCustomGridLineSize(el3, axis, lineSize),
    editable && el3.addEventListener('pointerdown', (target) => onPointerDown?.(target, axis, index2)),
    el3
  );
}
export function renderStoryboardCustomGridOverlay({
  grid: grid,
  overlay: overlay,
  editable: editable2,
  layout: layout,
  lineSize: lineSize2,
  getLinePosition: getLinePosition,
  onPointerDown: onPointerDown2,
} = {}) {
  if (!grid) return overlay || null;
  const enabled = layout.cols > 1 || layout.rows > 1;
  if (!enabled) return removeStoryboardCustomGridOverlay(overlay);
  let el4 = overlay;
  (!el4 || el4.parentNode !== grid) &&
    ((el4 = document.createElement('div')),
    (el4.className = 'storyboard-custom-grid-overlay'),
    grid.appendChild(el4));
  (el4.replaceChildren(), el4.classList.toggle('is-editable', editable2));
  const source = layout.columns.reduce((item2, next) => item2 + next, 0),
    current = layout.rowTracks.reduce((item3, entry) => item3 + entry, 0);
  let record = 0;
  for (let index3 = 0; index3 < layout.columns.length - 1; index3 += 1) {
    ((record += layout.columns[index3]),
      el4.appendChild(
        createGridLine({
          editable: editable2,
          axis: 'columns',
          index: index3,
          position: getLinePosition(record, source),
          lineSize: lineSize2,
          onPointerDown: onPointerDown2,
        }),
      ));
  }
  let payload = 0;
  for (let index4 = 0; index4 < layout.rowTracks.length - 1; index4 += 1) {
    ((payload += layout.rowTracks[index4]),
      el4.appendChild(
        createGridLine({
          editable: editable2,
          axis: 'rows',
          index: index4,
          position: getLinePosition(payload, current),
          lineSize: lineSize2,
          onPointerDown: onPointerDown2,
        }),
      ));
  }
  return el4;
}
