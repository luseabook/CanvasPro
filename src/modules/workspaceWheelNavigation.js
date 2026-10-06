import { scrollClosestElementHorizontallyWithWheel } from './workspaceHorizontalWheel.js';
const WORKSPACE_SCROLLABLE_OVERFLOW_VALUES = new Set(['auto', 'scroll', 'overlay']);
function normalizeSelector(value) {
  return String(value || '').trim();
}
export function hasWorkspaceScrollableOverflow(el, item) {
  const key =
      WORKSPACE_SCROLLABLE_OVERFLOW_VALUES.has(String(item?.overflowY || '')) &&
      Number(el?.scrollHeight || 0) > Number(el?.clientHeight || 0),
    index =
      WORKSPACE_SCROLLABLE_OVERFLOW_VALUES.has(String(item?.overflowX || '')) &&
      Number(el?.scrollWidth || 0) > Number(el?.clientWidth || 0);
  return key || index;
}
export function shouldPreserveWorkspaceNestedWheel(
  el2,
  {
    nestedSelector: nestedSelector = '',
    boundaryRoot: boundaryRoot = null,
    boundarySelector: boundarySelector = '',
    getComputedStyle: getComputedStyle = null,
  } = {},
) {
  const selector = normalizeSelector(nestedSelector),
    result = selector ? el2?.closest?.(selector) : null;
  if (result && (!boundaryRoot || boundaryRoot.contains?.(result))) return true;
  const run =
    getComputedStyle ||
    el2?.ownerDocument?.defaultView?.getComputedStyle?.bind(
      el2.ownerDocument.defaultView,
    );
  if (typeof run !== 'function') return false;
  const selector2 = normalizeSelector(boundarySelector);
  for (let data = el2; data; data = data.parentElement) {
    if (hasWorkspaceScrollableOverflow(data, run(data))) return true;
    if (data === boundaryRoot || (selector2 && data.matches?.(selector2))) break;
  }
  return false;
}
export function captureWorkspaceScrollPosition(enabled) {
  if (!enabled) return null;
  return {
    top: Math.max(0, Number(enabled.scrollTop) || 0),
    left: Math.max(0, Number(enabled.scrollLeft) || 0),
  };
}
export function restoreWorkspaceScrollPosition(enabled2, box) {
  if (!enabled2 || !box) return false;
  return (
    (enabled2.scrollTop = Math.max(0, Number(box.top) || 0)),
    (enabled2.scrollLeft = Math.max(0, Number(box.left) || 0)),
    true
  );
}
export function captureWorkspaceNestedScrollPositions(el3, list = []) {
  if (!el3?.querySelectorAll || !Array.isArray(list)) return null;
  const list2 = [];
  return (
    list.map(normalizeSelector)
      .filter(Boolean)
      .forEach((selector3) => {
        [...el3.querySelectorAll(selector3)].forEach((options, index2) => {
          list2.push({
            selector: selector3,
            index: index2,
            ...captureWorkspaceScrollPosition(options),
          });
        });
      }),
    list2.length ? list2 : null
  );
}
export function restoreWorkspaceNestedScrollPositions(el4, list3) {
  if (!el4?.querySelectorAll || !Array.isArray(list3) || !list3.length) return false;
  const map = new Map();
  let restoreWorkspaceScrollPosition2 = false;
  return (
    list3.forEach((target) => {
      const selector4 = normalizeSelector(target?.selector);
      if (!selector4) return;
      !map.has(selector4) && map.set(selector4, [...el4.querySelectorAll(selector4)]);
      const enabled3 = map.get(selector4)[target.index];
      if (!enabled3) return;
      restoreWorkspaceScrollPosition2 =
        restoreWorkspaceScrollPosition(enabled3, target) || restoreWorkspaceScrollPosition2;
    }),
    restoreWorkspaceScrollPosition2
  );
}
export function scrollWorkspaceTrackWithWheel(source, next, current = {}) {
  const selector5 = normalizeSelector(next);
  if (!selector5) return false;
  return scrollClosestElementHorizontallyWithWheel(source, selector5, current);
}
