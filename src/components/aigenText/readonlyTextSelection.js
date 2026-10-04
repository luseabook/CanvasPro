function getCaretRangeFromPoint(dom, value, item) {
  if (typeof dom?.caretRangeFromPoint === 'function') return dom.caretRangeFromPoint(value, item);
  const enabled = dom?.caretPositionFromPoint?.(value, item);
  if (!enabled || typeof dom?.createRange !== 'function') return null;
  const key = dom.createRange();
  return (key.setStart(enabled.offsetNode, enabled.offset), key);
}
function setSelection(dom2, enabled2, enabled3) {
  const enabled4 = dom2?.getSelection?.();
  if (!enabled4 || !enabled2 || !enabled3) return;
  enabled4.removeAllRanges();
  if (typeof enabled4.setBaseAndExtent === 'function') {
    enabled4.setBaseAndExtent(
      enabled2.startContainer,
      enabled2.startOffset,
      enabled3.startContainer,
      enabled3.startOffset,
    );
    return;
  }
  const index = enabled2.startContainer.ownerDocument.createRange();
  (index.setStart(enabled2.startContainer, enabled2.startOffset),
    index.setEnd(enabled3.startContainer, enabled3.startOffset),
    enabled4.addRange(index));
}
function findActiveReadonlyTextRoot(enabled5) {
  if (!enabled5) return null;
  const el = enabled5.nodeType === 1 ? enabled5 : enabled5.parentElement;
  if (!el) return null;
  if (typeof el.closest === 'function') return el.closest('.aigen-text-output.is-text-selection-active');
  let el2 = el;
  while (el2) {
    if (
      el2.classList?.contains?.('aigen-text-output') &&
      el2.classList?.contains?.('is-text-selection-active')
    )
      return el2;
    el2 = el2.parentElement;
  }
  return null;
}
function rangeTouchesActiveReadonlyText(enabled6, el3) {
  if (!enabled6) return false;
  if (
    findActiveReadonlyTextRoot(enabled6.commonAncestorContainer) ||
    findActiveReadonlyTextRoot(enabled6.startContainer) ||
    findActiveReadonlyTextRoot(enabled6.endContainer)
  )
    return true;
  const list = Array.from(el3?.querySelectorAll?.('.aigen-text-output.is-text-selection-active') || []);
  return list.some((item2) => {
    try {
      if (typeof enabled6.intersectsNode === 'function') return enabled6.intersectsNode(item2);
    } catch (result) {
      return false;
    }
    return item2.contains?.(enabled6.startContainer) || item2.contains?.(enabled6.endContainer);
  });
}
export function hasActiveReadonlyTextSelection(dom3 = document) {
  const enabled7 = dom3?.getSelection?.();
  if (!enabled7 || enabled7.isCollapsed || !String(enabled7.toString?.() || '').trim()) return false;
  const data = Number(enabled7.rangeCount) || 0;
  for (let options = 0; options < data; options += 1) {
    if (rangeTouchesActiveReadonlyText(enabled7.getRangeAt(options), dom3)) return true;
  }
  return false;
}
export function bindReadonlyTextSelection(el4, target = {}) {
  if (!el4?.addEventListener) return () => {};
  const el5 = el4.ownerDocument || document,
    source = el5.defaultView || window;
  let enabled8 = false;
  const run = () => {
      if (enabled8) return;
      ((enabled8 = true), el4.classList?.add('is-text-selection-active'), target.onActivate?.());
    },
    handler = () => {
      if (!enabled8) return;
      ((enabled8 = false),
        target.onDeactivate?.(),
        el4.classList?.remove('is-text-selection-active'),
        el5.body?.classList.remove('is-aigen-text-selecting'));
    },
    next = (event) => {
      if (event.button !== 0) return;
      if (!enabled8) return;
      (event.preventDefault(), event.stopPropagation(), el5.body?.classList.add('is-aigen-text-selecting'));
      const caretRangeFromPoint = getCaretRangeFromPoint(el5, event.clientX, event.clientY),
        handler2 = (event2) => {
          const caretRangeFromPoint2 = getCaretRangeFromPoint(el5, event2.clientX, event2.clientY);
          (caretRangeFromPoint &&
            caretRangeFromPoint2 &&
            el4.contains(caretRangeFromPoint.startContainer) &&
            el4.contains(caretRangeFromPoint2.startContainer) &&
            setSelection(source, caretRangeFromPoint, caretRangeFromPoint2),
            event2.preventDefault(),
            event2.stopPropagation());
        },
        current = (entry) => {
          (handler2(entry),
            el5.body?.classList.remove('is-aigen-text-selecting'),
            el5.removeEventListener('pointermove', handler2, true),
            el5.removeEventListener('pointerup', current, true),
            el5.removeEventListener('pointercancel', current, true));
        };
      (el5.addEventListener('pointermove', handler2, true),
        el5.addEventListener('pointerup', current, true),
        el5.addEventListener('pointercancel', current, true));
    },
    record = (event3) => {
      (event3.preventDefault(), event3.stopPropagation(), run());
    },
    payload = (event4) => {
      if (!enabled8 || el4.contains(event4.target)) return;
      handler();
    },
    handle = (event5) => {
      if (event5.key === 'Escape') handler();
    };
  return (
    el4.addEventListener('pointerdown', next, true),
    el4.addEventListener('dblclick', record),
    el5.addEventListener('pointerdown', payload, true),
    el5.addEventListener('keydown', handle, true),
    () => {
      (handler(),
        el4.removeEventListener('pointerdown', next, true),
        el4.removeEventListener('dblclick', record),
        el5.removeEventListener('pointerdown', payload, true),
        el5.removeEventListener('keydown', handle, true));
    }
  );
}
