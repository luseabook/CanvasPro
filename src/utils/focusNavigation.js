const NAVIGATION_KEYS = new Set(['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']),
  ATTRIBUTE = 'data-focus-navigation';
export function createFocusNavigation() {
  const map = new Set();
  let value = 'pointer',
    el = null,
    box = null;
  const run = (item) => {
      if (value === item) return;
      ((value = item), map.forEach((el2) => el2.setAttribute?.(ATTRIBUTE, value)));
    },
    key = (event) => {
      if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
      if (!NAVIGATION_KEYS.has(event.key)) return;
      [...map].some((index) => index === event.target || index.contains?.(event.target)) &&
        run('keyboard');
    },
    result = () => run('pointer'),
    data = (x) => {
      const options = !box || box.x !== x.clientX || box.y !== x.clientY;
      box = { x: x.clientX, y: x.clientY };
      if (options || x.movementX || x.movementY) run('pointer');
    },
    removeRoot = (el3) => {
      if (!map.delete(el3)) return;
      (el3.removeEventListener?.('pointerdown', result, true),
        el3.removeEventListener?.('pointermove', data, true),
        el3.removeAttribute?.(ATTRIBUTE),
        !map.size &&
          (el?.removeEventListener?.('keydown', key, true),
          (el = null),
          (value = 'pointer'),
          (box = null)));
    };
  return {
    addRoot(el4) {
      if (!el4 || map.has(el4)) return;
      (!map.size &&
        ((el = el4.ownerDocument?.defaultView || globalThis.window),
        el?.addEventListener?.('keydown', key, true)),
        map.add(el4),
        el4.setAttribute?.(ATTRIBUTE, value),
        el4.addEventListener('pointerdown', result, true),
        el4.addEventListener('pointermove', data, true));
    },
    removeRoot: removeRoot,
    destroy() {
      [...map].forEach(removeRoot);
    },
  };
}
