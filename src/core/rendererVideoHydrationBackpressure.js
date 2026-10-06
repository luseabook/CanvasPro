const DEFAULT_PRIORITY_COOLDOWN_MS = 56,
  DEFAULT_LONG_FRAME_THRESHOLD_MS = 50,
  DEFAULT_MAX_NON_PRIORITY_BLOCK_MS = 160;
function getWindowLike() {
  return typeof window !== 'undefined' ? window : globalThis;
}
function defaultNow() {
  return Number(globalThis.performance?.now?.() || Date.now());
}
function defaultRequestFrame(handler) {
  const windowLike = getWindowLike();
  if (typeof windowLike?.requestAnimationFrame === 'function')
    return windowLike.requestAnimationFrame(handler);
  return setTimeout(() => handler(defaultNow()), 16);
}
function defaultCancelFrame(value) {
  const windowLike2 = getWindowLike();
  if (typeof windowLike2?.cancelAnimationFrame === 'function') {
    windowLike2.cancelAnimationFrame(value);
    return;
  }
  clearTimeout(value);
}
export function createRendererVideoHydrationBackpressure({
  now: now = defaultNow,
  requestFrame: requestFrame = defaultRequestFrame,
  cancelFrame: cancelFrame = defaultCancelFrame,
  priorityCooldownMs: priorityCooldownMs = DEFAULT_PRIORITY_COOLDOWN_MS,
  longFrameThresholdMs: longFrameThresholdMs = DEFAULT_LONG_FRAME_THRESHOLD_MS,
  maxNonPriorityBlockMs: maxNonPriorityBlockMs = DEFAULT_MAX_NON_PRIORITY_BLOCK_MS,
} = {}) {
  let enabled = true,
    requestFrame2 = null,
    requestFrame3 = null,
    item = 0,
    key = 0,
    enabled2 = true,
    value2 = null,
    enabled3 = false;
  const run = () => {
      if (requestFrame2 !== null) return;
      requestFrame2 = requestFrame(() => {
        ((requestFrame2 = null), (enabled = true));
      });
    },
    handler2 = () => {
      if (requestFrame3 !== null) return;
      requestFrame3 = requestFrame(() => {
        requestFrame3 = null;
        const index = Number(now()) || 0,
          result = Math.max(0, index - key);
        key = index;
        const data = value2 === null ? 0 : Math.max(0, index - value2);
        if (
          index >= item &&
          (result <= Math.max(16, Number(longFrameThresholdMs) || 0) ||
            data >= Math.max(0, Number(maxNonPriorityBlockMs) || 0))
        ) {
          ((enabled2 = true), (enabled3 = true));
          return;
        }
        handler2();
      });
    };
  function markPriorityWork() {
    const options = Number(now()) || 0;
    if (enabled3) return;
    (value2 === null && (value2 = options),
      (item = Math.max(item, options + Math.max(0, Number(priorityCooldownMs) || 0))),
      (key = options),
      (enabled2 = false),
      handler2());
  }
  function tryAcquire({ priority: priority = false } = {}) {
    if (priority) return (markPriorityWork(), true);
    if (!enabled3 && (!enabled2 || (Number(now()) || 0) < item)) return false;
    if (!enabled) return false;
    return (
      (enabled = false),
      enabled3 && ((enabled3 = false), (value2 = null), (item = 0), (enabled2 = true)),
      run(),
      true
    );
  }
  function reset() {
    if (requestFrame2 !== null) cancelFrame(requestFrame2);
    if (requestFrame3 !== null) cancelFrame(requestFrame3);
    ((requestFrame2 = null),
      (requestFrame3 = null),
      (item = 0),
      (key = 0),
      (enabled2 = true),
      (value2 = null),
      (enabled3 = false),
      (enabled = true));
  }
  return { markPriorityWork: markPriorityWork, reset: reset, tryAcquire: tryAcquire };
}
export const __rendererVideoHydrationBackpressureForTest = {
  DEFAULT_LONG_FRAME_THRESHOLD_MS: DEFAULT_LONG_FRAME_THRESHOLD_MS,
  DEFAULT_MAX_NON_PRIORITY_BLOCK_MS: DEFAULT_MAX_NON_PRIORITY_BLOCK_MS,
  DEFAULT_PRIORITY_COOLDOWN_MS: DEFAULT_PRIORITY_COOLDOWN_MS,
};
