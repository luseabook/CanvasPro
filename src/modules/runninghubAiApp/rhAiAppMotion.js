const motions = new WeakMap();
export const reduceMotion = () =>
  globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
export function animatePreviewOrder(list, handler) {
  const map = new Map(list.map((el) => [el, el.getBoundingClientRect()]));
  (handler(),
    list.forEach((el2) => {
      motions.get(el2)?.cancel();
      if (reduceMotion() || el2.matches('.is-dragging, :has(> .is-dragging)')) return;
      const box = map.get(el2),
        box2 = el2.getBoundingClientRect(),
        value = box.left - box2.left,
        item = box.top - box2.top;
      if (Math.abs(value) + Math.abs(item) < 1) return;
      motions.set(
        el2,
        el2.animate?.(
          [{ transform: 'translate(' + value + 'px, ' + item + 'px)' }, { transform: 'translate(0, 0)' }],
          { duration: 210, easing: 'cubic-bezier(0.2, 0, 0.2, 1)' },
        ),
      );
    }));
}
export function showGroupPanel(el3, duration) {
  motions.get(el3)?.cancel();
  if (duration) el3.hidden = false;
  if (reduceMotion() || !el3.animate) {
    el3.hidden = !duration;
    return;
  }
  const list2 = [
      { opacity: 0, transform: 'translateY(6px) scale(.98)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ],
    key = el3.animate(duration ? list2 : list2.slice().reverse(), {
      duration: duration ? 180 : 120,
      easing: 'ease-out',
    });
  (motions.set(el3, key),
    (key.onfinish = () => {
      motions.get(el3) === key && ((el3.hidden = !duration), motions.delete(el3));
    }));
}
