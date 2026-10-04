function getRect(el) {
  const box = el?.getBoundingClientRect?.();
  if (!box) return null;
  const left = Number(box.left ?? 0),
    top = Number(box.top ?? 0),
    count = Number(box.width),
    count2 = Number(box.height),
    value = Number(box.right),
    item = Number(box.bottom),
    width = Number.isFinite(count) && count > 0 ? count : Number.isFinite(value) ? value - left : 0,
    height = Number.isFinite(count2) && count2 > 0 ? count2 : Number.isFinite(item) ? item - top : 0;
  if (
    !Number.isFinite(left) ||
    !Number.isFinite(top) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    return null;
  return {
    left: left,
    top: top,
    width: width,
    height: height,
    right: left + width,
    bottom: top + height,
  };
}
function stripDuplicateIds(el2) {
  if (!el2) return;
  (el2.id && typeof el2.removeAttribute === 'function' && el2.removeAttribute('id'),
    el2.querySelectorAll?.('[id]')?.forEach((item2) => {
      item2.removeAttribute?.('id');
    }));
}
export function playWorkflowSaveFly({
  sourceEl: sourceEl,
  targetEl: targetEl = null,
  documentRef: documentRef = globalThis.document,
  windowRef: windowRef = globalThis.window,
} = {}) {
  const el3 = documentRef || sourceEl?.ownerDocument || globalThis.document,
    enabled = windowRef || globalThis.window;
  if (!el3?.body || !sourceEl || !enabled) return null;
  const key = enabled.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (key) return null;
  const box2 = getRect(sourceEl),
    index = targetEl || el3.getElementById?.('btnWorkflows'),
    box3 = getRect(index);
  if (!box2 || !box3) return null;
  const fly = el3.createElement('div');
  ((fly.className = 'v2-workflow-save-fly'),
    (fly.style.left = box2.left + 'px'),
    (fly.style.top = box2.top + 'px'),
    (fly.style.width = box2.width + 'px'),
    (fly.style.height = box2.height + 'px'));
  const result = sourceEl.cloneNode?.(true);
  result && (stripDuplicateIds(result), fly.appendChild(result));
  el3.body.appendChild(fly);
  const data = box2.left + box2.width / 2,
    options = box2.top + box2.height / 2,
    target = box3.left + box3.width / 2,
    source = box3.top + box3.height / 2,
    next = target - data,
    current = source - options,
    entry = (() => {
      let record = false;
      return () => {
        if (record) return;
        ((record = true),
          fly.remove?.(),
          index?.animate?.(
            [
              { transform: 'scale(1)', filter: 'brightness(1)' },
              { transform: 'scale(1.08)', filter: 'brightness(1.2)' },
              { transform: 'scale(1)', filter: 'brightness(1)' },
            ],
            { duration: 0x104, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
          ));
      };
    })();
  if (typeof fly.animate === 'function') {
    const animation = fly.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: 'translate(' + next + 'px,' + current + 'px) scale(0.12)', opacity: 0.2 },
      ],
      { duration: 0x208, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
    );
    return ((animation.onfinish = entry), (animation.oncancel = entry), { fly: fly, animation: animation });
  }
  return (enabled.setTimeout?.(entry, 0x208), { fly: fly, animation: null });
}
