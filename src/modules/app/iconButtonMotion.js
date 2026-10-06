export const ICON_BUTTON_ACTIVATION_CLASS = 'is-icon-activating';
export const ICON_BUTTON_ACTIVATION_ANIMATION = 'canvas-chrome-icon-activate';
function defaultRequestFrame(handler) {
  const value = globalThis.requestAnimationFrame;
  if (typeof value === 'function') return value.call(globalThis, handler);
  return (handler(), null);
}
function defaultPrefersReducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
}
export function bindIconButtonMotion(
  item,
  {
    activeClass: activeClass = ICON_BUTTON_ACTIVATION_CLASS,
    animationName: animationName = ICON_BUTTON_ACTIVATION_ANIMATION,
    durationMs: durationMs = 320,
    requestFrame: requestFrame = defaultRequestFrame,
    setTimer: setTimer = globalThis.setTimeout?.bind(globalThis),
    clearTimer: clearTimer = globalThis.clearTimeout?.bind(globalThis),
    prefersReducedMotion: prefersReducedMotion = defaultPrefersReducedMotion,
  } = {},
) {
  const list = [],
    key = new Set(item ? Array.from(item) : []);
  for (const el of key) {
    if (!el?.addEventListener || !el?.classList) continue;
    let index = false,
      result = 0,
      setTimer2 = null;
    const run = () => {
        ((result += 1),
          setTimer2 !== null && (clearTimer?.(setTimer2), (setTimer2 = null)),
          el.classList.remove(activeClass));
      },
      data = () => {
        if (el.disabled || prefersReducedMotion()) {
          run();
          return;
        }
        result += 1;
        const options = result;
        (setTimer2 !== null && (clearTimer?.(setTimer2), (setTimer2 = null)),
          el.classList.remove(activeClass),
          requestFrame(() => {
            if (index || options !== result) return;
            (el.classList.add(activeClass),
              typeof setTimer === 'function' && (setTimer2 = setTimer(run, durationMs)));
          }));
      },
      target = (source) => {
        if (source?.animationName !== animationName) return;
        run();
      };
    (el.addEventListener('click', data),
      el.addEventListener('animationend', target),
      list.push(() => {
        ((index = true),
          run(),
          el.removeEventListener?.('click', data),
          el.removeEventListener?.('animationend', target));
      }));
  }
  return () => {
    list.forEach((handler2) => handler2());
  };
}
