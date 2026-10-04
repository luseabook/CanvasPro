export function beginStoryboardCustomGridLineDrag({
  event: event,
  axis: axis,
  index: index,
  grid: grid,
  rootEl: rootEl,
  layout: layout,
  endDrag: endDrag,
  onDragMove: onDragMove,
  ensureVisualState: ensureVisualState,
} = {}) {
  (event?.preventDefault?.(), event?.stopPropagation?.());
  if (!grid || !layout) return null;
  (endDrag?.(), ensureVisualState?.());
  const onMove = (value) => onDragMove?.(value),
    onEnd = () => endDrag?.(),
    item = {
      axis: axis,
      index: index,
      startClientX: Number(event?.clientX) || 0,
      startClientY: Number(event?.clientY) || 0,
      startColumns: [...layout.columns],
      startRows: [...layout.rowTracks],
      rect: grid.getBoundingClientRect(),
      onMove: onMove,
      onEnd: onEnd,
    };
  rootEl?.classList?.add('is-custom-grid-dragging');
  try {
    event?.currentTarget?.setPointerCapture?.(event.pointerId);
  } catch (key) {}
  return (
    document.addEventListener('pointermove', onMove),
    document.addEventListener('pointerup', onEnd, { once: true }),
    document.addEventListener('pointercancel', onEnd, { once: true }),
    item
  );
}
export function buildStoryboardCustomGridDragDraft({
  event: event2,
  drag: drag,
  draft: draft,
  adjustTracks: adjustTracks,
} = {}) {
  if (!drag || !draft) return null;
  const columns = drag.axis === 'columns',
    result = columns ? drag.rect.width : drag.rect.height,
    data = Math.max(1, result),
    options = columns
      ? (Number(event2?.clientX) || 0) - drag.startClientX
      : (Number(event2?.clientY) || 0) - drag.startClientY,
    list = columns ? drag.startColumns : drag.startRows,
    target = list.reduce((item2, source) => item2 + source, 0),
    next = adjustTracks?.(list, drag.index, (options / data) * target);
  if (!Array.isArray(next)) return null;
  return { columns: columns ? next : draft.columns, rows: columns ? draft.rows : next };
}
export function endStoryboardCustomGridLineDrag({ drag: drag2, rootEl: rootEl2 } = {}) {
  if (!drag2) return null;
  return (
    document.removeEventListener('pointermove', drag2.onMove),
    document.removeEventListener('pointerup', drag2.onEnd),
    document.removeEventListener('pointercancel', drag2.onEnd),
    rootEl2?.classList?.remove('is-custom-grid-dragging'),
    null
  );
}
