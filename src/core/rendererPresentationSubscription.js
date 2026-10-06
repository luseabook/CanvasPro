export function createRendererPresentationSubscription({
  onSnapshot: onSnapshot,
  flushSelection: flushSelection,
  render: render,
  onSuspend: onSuspend,
  onResume: onResume,
  requestFrame: requestFrame = (value) => requestAnimationFrame(value),
  cancelFrame: cancelFrame = (item) => cancelAnimationFrame(item),
} = {}) {
  let enabled = true,
    enabled2 = false,
    requestFrame2 = null,
    value2 = null,
    key = null,
    index = null;
  const cancelPending = () => {
      if (requestFrame2 !== null) cancelFrame(requestFrame2);
      ((requestFrame2 = null), (value2 = null));
    },
    handler = (result) => {
      if (enabled2) return;
      key = result;
      if (enabled && flushSelection?.(result)) return;
      (onSnapshot?.(result), (value2 = result));
      if (!enabled || requestFrame2 !== null) return;
      requestFrame2 = requestFrame(() => {
        requestFrame2 = null;
        const data = value2;
        value2 = null;
        if (enabled && !enabled2) render(data);
      });
    };
  return {
    connect(options) {
      (onResume?.(), (index = options.subscribeRaw(handler)));
    },
    isActive: () => enabled && !enabled2,
    hasPendingFrame: () => requestFrame2 !== null,
    cancelPending: cancelPending,
    clearPendingSnapshot: () => {
      value2 = null;
    },
    setActive(target) {
      if (enabled2 || enabled === (target === true)) return;
      enabled = target === true;
      if (!enabled) (cancelPending(), onSuspend?.());
      else {
        onResume?.();
        if (key) handler(key);
      }
    },
    dispose() {
      ((enabled2 = true), cancelPending(), index?.(), (value2 = key = null));
    },
  };
}
