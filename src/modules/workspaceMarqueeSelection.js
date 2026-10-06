export const WORKSPACE_MARQUEE_DRAG_THRESHOLD = 5;
function normalizeCoordinate(value) {
  const item = Number(value);
  return Number.isFinite(item) ? item : 0;
}
function normalizeSelector(key) {
  return String(key || '').trim();
}
function clamp(index, result, data) {
  return Math.max(result, Math.min(data, index));
}
export function hasWorkspaceMarqueeDrag(
  options,
  target,
  source,
  next,
  current = WORKSPACE_MARQUEE_DRAG_THRESHOLD,
) {
  const coordinate = normalizeCoordinate(source) - normalizeCoordinate(options),
    coordinate2 = normalizeCoordinate(next) - normalizeCoordinate(target);
  return Math.hypot(coordinate, coordinate2) >= Math.max(0, normalizeCoordinate(current));
}
export function createWorkspaceMarqueeRect(entry, record, payload, handle, box = null) {
  let coordinate3 = normalizeCoordinate(entry),
    coordinate4 = normalizeCoordinate(record),
    coordinate5 = normalizeCoordinate(payload),
    coordinate6 = normalizeCoordinate(handle);
  if (box) {
    const coordinate7 = normalizeCoordinate(box.left),
      coordinate8 = normalizeCoordinate(box.top),
      state = Math.max(coordinate7, normalizeCoordinate(box.right)),
      config = Math.max(coordinate8, normalizeCoordinate(box.bottom));
    ((coordinate3 = clamp(coordinate3, coordinate7, state)),
      (coordinate5 = clamp(coordinate5, coordinate7, state)),
      (coordinate4 = clamp(coordinate4, coordinate8, config)),
      (coordinate6 = clamp(coordinate6, coordinate8, config)));
  }
  const left = Math.min(coordinate3, coordinate5),
    top = Math.min(coordinate4, coordinate6),
    right = Math.max(coordinate3, coordinate5),
    bottom = Math.max(coordinate4, coordinate6);
  return {
    left: left,
    top: top,
    right: right,
    bottom: bottom,
    width: right - left,
    height: bottom - top,
  };
}
export function doesWorkspaceMarqueeIntersect(box2, box3) {
  if (!box2 || !box3) return false;
  return !(
    normalizeCoordinate(box3.right) < normalizeCoordinate(box2.left) ||
    normalizeCoordinate(box3.left) > normalizeCoordinate(box2.right) ||
    normalizeCoordinate(box3.bottom) < normalizeCoordinate(box2.top) ||
    normalizeCoordinate(box3.top) > normalizeCoordinate(box2.bottom)
  );
}
export function resolveWorkspaceMarqueeSelection(list = [], list2 = [], { additive: additive = false } = {}) {
  const args = new Set(
    additive && Array.isArray(list2)
      ? list2.map((scope) => String(scope ?? '').trim()).filter(Boolean)
      : [],
  );
  return (
    (Array.isArray(list) ? list : [])
      .map((input) => String(input ?? '').trim())
      .filter(Boolean)
      .forEach((output) => args.add(output)),
    [...args]
  );
}
export function createWorkspaceMarqueeSelectionController({
  root: root,
  documentObject: documentObject,
  windowObject: windowObject,
  getConfig: getConfig,
  surfaceSelector: surfaceSelector,
  resolveSurface: resolveSurface = null,
  blockedControlSelector: blockedControlSelector = '',
  overlayClassName: overlayClassName = '',
  itemSelector: itemSelector,
  getItemId: getItemId,
  hitClassName: hitClassName = 'is-marquee-hit',
  rootClassName: rootClassName = 'is-marquee-selecting',
  dragThreshold: dragThreshold = WORKSPACE_MARQUEE_DRAG_THRESHOLD,
  onActivate: onActivate = null,
  onCommit: onCommit = null,
} = {}) {
  if (!root || !documentObject || !windowObject || typeof getConfig !== 'function')
    throw new Error('workspace marquee selection controller dependencies are incomplete');
  const selector = normalizeSelector(surfaceSelector),
    selector2 = normalizeSelector(blockedControlSelector),
    baseOverlayClassName = normalizeSelector(overlayClassName),
    selector3 = normalizeSelector(itemSelector),
    selector4 = normalizeSelector(hitClassName),
    selector5 = normalizeSelector(rootClassName),
    enabled = typeof getItemId === 'function' ? getItemId : null;
  if (!selector) throw new Error('workspace marquee selection surfaceSelector is required');
  if (!selector3 || !enabled)
    throw new Error('workspace marquee selection itemSelector and getItemId are required');
  let value2 = null,
    enabled2 = false;
  const run = () => {
      const el = typeof root.querySelectorAll === 'function' ? root : value2?.surface,
        value3 = value2?.itemSelector || selector3,
        value4 = value2?.hitClassName || selector4;
      value3 &&
        value4 &&
        el?.querySelectorAll?.(value3).forEach((el2) => el2.classList.remove(value4));
      value2?.overlay?.remove?.();
      const value5 = value2?.rootClassName || selector5;
      if (value5) root.classList.remove(value5);
    },
    update = (event) => {
      const event2 = value2;
      if (!event2 || event2.pointerId !== event.pointerId) return false;
      if (
        !event2.active &&
        !hasWorkspaceMarqueeDrag(
          event2.startX,
          event2.startY,
          event.clientX,
          event.clientY,
          event2.dragThreshold,
        )
      )
        return false;
      if (!event2.active) {
        ((event2.active = true),
          (event2.overlay = documentObject.createElement('div')),
          (event2.overlay.className = [event2.baseOverlayClassName, event2.overlayClassName]
            .filter(Boolean)
            .join(' ')),
          event2.overlay.setAttribute('aria-hidden', 'true'),
          root.appendChild(event2.overlay));
        if (event2.rootClassName) root.classList.add(event2.rootClassName);
        onActivate?.();
        try {
          root.setPointerCapture?.(event.pointerId);
        } catch {}
      }
      (event.preventDefault(), event.stopPropagation());
      const left2 = createWorkspaceMarqueeRect(
        event2.startX,
        event2.startY,
        event.clientX,
        event.clientY,
        event2.surface.getBoundingClientRect(),
      );
      Object.assign(event2.overlay.style, {
        left: left2.left + 'px',
        top: left2.top + 'px',
        width: left2.width + 'px',
        height: left2.height + 'px',
      });
      const list3 = [];
      return (
        event2.surface.querySelectorAll(event2.itemSelector).forEach((el3) => {
          const doesWorkspaceMarqueeIntersect2 = doesWorkspaceMarqueeIntersect(
            left2,
            el3.getBoundingClientRect(),
          );
          event2.hitClassName &&
            el3.classList.toggle(event2.hitClassName, doesWorkspaceMarqueeIntersect2);
          if (doesWorkspaceMarqueeIntersect2) list3.push(String(event2.getItemId(el3) || '').trim());
        }),
        (event2.hitIds = list3.filter(Boolean)),
        true
      );
    },
    finish = (event3, { cancelled: cancelled = false } = {}) => {
      const additive2 = value2;
      if (!additive2 || additive2.pointerId !== event3.pointerId) return false;
      if (additive2.active && !cancelled) update(event3);
      const enabled3 = additive2.active && !cancelled,
        value6 = enabled3
          ? resolveWorkspaceMarqueeSelection(additive2.hitIds, additive2.initialSelectedIds, {
              additive: additive2.additive,
            })
          : [];
      (run(), (value2 = null));
      try {
        root.hasPointerCapture?.(event3.pointerId) &&
          root.releasePointerCapture(event3.pointerId);
      } catch {}
      if (!enabled3) return false;
      return (
        event3.preventDefault(),
        event3.stopPropagation(),
        (enabled2 = true),
        windowObject.setTimeout(() => {
          enabled2 = false;
        }, 0),
        additive2.commit(value6),
        onCommit?.(value6),
        true
      );
    },
    cancel = () => {
      const event4 = value2;
      (run(), (value2 = null));
      if (!event4) return false;
      try {
        root.hasPointerCapture?.(event4.pointerId) &&
          root.releasePointerCapture(event4.pointerId);
      } catch {}
      return true;
    },
    value7 = (value8) => update(value8),
    value9 = (value10) => finish(value10),
    value11 = (value12) => finish(value12, { cancelled: true });
  return (
    windowObject.addEventListener?.('pointermove', value7, true),
    windowObject.addEventListener?.('pointerup', value9, true),
    windowObject.addEventListener?.('pointercancel', value11, true),
    {
      begin(pointerId) {
        if (
          pointerId.button !== 0 ||
          pointerId.isPrimary === false ||
          (pointerId.pointerType && pointerId.pointerType !== 'mouse')
        )
          return false;
        const surface = resolveSurface
          ? resolveSurface(pointerId)
          : pointerId.target.closest?.(selector);
        if (!surface || !root.contains(surface)) return false;
        const commit = getConfig(surface);
        if (
          !commit?.enabled ||
          typeof commit.commit !== 'function' ||
          commit.canBegin?.(pointerId) === false
        )
          return false;
        const selector6 = normalizeSelector(commit.blockedControlSelector ?? selector2),
          itemSelector2 = normalizeSelector(commit.itemSelector || selector3),
          getItemId2 = typeof commit.getItemId === 'function' ? commit.getItemId : enabled,
          enabled4 = selector6 ? pointerId.target.closest?.(selector6) : null;
        if (enabled4 && !enabled4.matches?.(itemSelector2)) return false;
        return (
          cancel(),
          (value2 = {
            pointerId: pointerId.pointerId,
            startX: Number(pointerId.clientX) || 0,
            startY: Number(pointerId.clientY) || 0,
            additive:
              typeof commit.additive === 'boolean'
                ? commit.additive
                : pointerId.shiftKey === true ||
                  pointerId.ctrlKey === true ||
                  pointerId.metaKey === true,
            initialSelectedIds: Array.isArray(commit.selectedIds) ? [...commit.selectedIds] : [],
            hitIds: [],
            active: false,
            overlay: null,
            baseOverlayClassName: baseOverlayClassName,
            overlayClassName: normalizeSelector(commit.overlayClassName),
            itemSelector: itemSelector2,
            hitClassName: normalizeSelector(commit.hitClassName ?? selector4),
            rootClassName: normalizeSelector(commit.rootClassName ?? selector5),
            getItemId: getItemId2,
            dragThreshold: Math.max(0, normalizeCoordinate(commit.dragThreshold ?? dragThreshold)),
            surface: surface,
            commit: commit.commit,
          }),
          true
        );
      },
      update: update,
      finish: finish,
      cancel: cancel,
      consumeClick(event5) {
        if (!enabled2) return false;
        return ((enabled2 = false), event5.preventDefault(), event5.stopPropagation(), true);
      },
      destroy() {
        (cancel(),
          windowObject.removeEventListener?.('pointermove', value7, true),
          windowObject.removeEventListener?.('pointerup', value9, true),
          windowObject.removeEventListener?.('pointercancel', value11, true));
      },
    }
  );
}
