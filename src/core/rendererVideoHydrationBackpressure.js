const DEFAULT_PRIORITY_COOLDOWN_MS = 0x38,
  DEFAULT_LONG_FRAME_THRESHOLD_MS = 0x32,
  DEFAULT_MAX_NON_PRIORITY_BLOCK_MS = 0xa0;
function getWindowLike() {
  return typeof window !== 'undefined' ? window : globalThis;
}
function defaultNow() {
  return Number(globalThis['performance']?.['now']?.() || Date['now']());
}
function defaultRequestFrame(handler) {
  const windowLike = getWindowLike();
  if (typeof windowLike?.['requestAnimationFrame'] === 'function')
    return windowLike['requestAnimationFrame'](handler);
  return setTimeout(() => handler(defaultNow()), 0x10);
}
function defaultCancelFrame(value) {
  const windowLike2 = getWindowLike();
  if (typeof windowLike2?.['cancelAnimationFrame'] === 'function') {
    windowLike2['cancelAnimationFrame'](value);
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
  let enabled = !![],
    requestFrame2 = null,
    requestFrame3 = null,
    item = 0x0,
    key = 0x0,
    enabled2 = !![],
    value2 = null,
    enabled3 = ![];
  const run = () => {
      if (requestFrame2 !== null) return;
      requestFrame2 = requestFrame(() => {
        ((requestFrame2 = null), (enabled = !![]));
      });
    },
    handler2 = () => {
      if (requestFrame3 !== null) return;
      requestFrame3 = requestFrame(() => {
        requestFrame3 = null;
        const index = Number(now()) || 0x0,
          result = Math['max'](0x0, index - key);
        key = index;
        const data = value2 === null ? 0x0 : Math['max'](0x0, index - value2);
        if (
          index >= item &&
          (result <= Math['max'](0x10, Number(longFrameThresholdMs) || 0x0) ||
            data >= Math['max'](0x0, Number(maxNonPriorityBlockMs) || 0x0))
        ) {
          ((enabled2 = !![]), (enabled3 = !![]));
          return;
        }
        handler2();
      });
    };
  function markPriorityWork() {
    const options = Number(now()) || 0x0;
    if (enabled3) return;
    (value2 === null && (value2 = options),
      (item = Math['max'](item, options + Math['max'](0x0, Number(priorityCooldownMs) || 0x0))),
      (key = options),
      (enabled2 = ![]),
      handler2());
  }
  function tryAcquire({ priority: priority = ![] } = {}) {
    if (priority) return (markPriorityWork(), !![]);
    if (!enabled3 && (!enabled2 || (Number(now()) || 0x0) < item)) return ![];
    if (!enabled) return ![];
    return (
      (enabled = ![]),
      enabled3 && ((enabled3 = ![]), (value2 = null), (item = 0x0), (enabled2 = !![])),
      run(),
      !![]
    );
  }
  function reset() {
    if (requestFrame2 !== null) cancelFrame(requestFrame2);
    if (requestFrame3 !== null) cancelFrame(requestFrame3);
    ((requestFrame2 = null),
      (requestFrame3 = null),
      (item = 0x0),
      (key = 0x0),
      (enabled2 = !![]),
      (value2 = null),
      (enabled3 = ![]),
      (enabled = !![]));
  }
  return { markPriorityWork: markPriorityWork, reset: reset, tryAcquire: tryAcquire };
}
export const __rendererVideoHydrationBackpressureForTest = {
  DEFAULT_LONG_FRAME_THRESHOLD_MS: DEFAULT_LONG_FRAME_THRESHOLD_MS,
  DEFAULT_MAX_NON_PRIORITY_BLOCK_MS: DEFAULT_MAX_NON_PRIORITY_BLOCK_MS,
  DEFAULT_PRIORITY_COOLDOWN_MS: DEFAULT_PRIORITY_COOLDOWN_MS,
};
