export const STORYBOARD_3D_SELECTION_DRAG_THRESHOLD = 4;
function finite(value, item = 0) {
  const key = Number(value);
  return Number.isFinite(key) ? key : item;
}
export function createStoryboard3DSelectionRect(event = {}, event2 = {}) {
  const finite2 = finite(event.clientX),
    finite3 = finite(event.clientY),
    finite4 = finite(event2.clientX, finite2),
    finite5 = finite(event2.clientY, finite3),
    left = Math.min(finite2, finite4),
    top = Math.min(finite3, finite5),
    right = Math.max(finite2, finite4),
    bottom = Math.max(finite3, finite5);
  return {
    left: left,
    top: top,
    right: right,
    bottom: bottom,
    width: right - left,
    height: bottom - top,
  };
}
export function hasStoryboard3DSelectionDragMoved(box) {
  return Math.max(box?.width || 0, box?.height || 0) >= STORYBOARD_3D_SELECTION_DRAG_THRESHOLD;
}
export function mergeStoryboard3DBoxSelection({
  initialObjectIds: initialObjectIds = [],
  hitObjectIds: hitObjectIds = [],
  additive: additive = false,
  toggle: toggle = false,
} = {}) {
  const args = [...new Set(initialObjectIds.filter(Boolean))],
    list = [...new Set(hitObjectIds.filter(Boolean))];
  if (toggle) {
    const map = new Set(args);
    return (
      list.forEach((index) => {
        if (map.has(index)) map.delete(index);
        else map.add(index);
      }),
      [...map]
    );
  }
  if (additive) return [...new Set([...args, ...list])];
  return list;
}
