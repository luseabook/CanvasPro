const DEFAULT_RETRY_DELAY_MS = 0xfa,
  DEFAULT_MIN_IDLE_BUDGET_MS = 0xc,
  DEFAULT_IDLE_TIMEOUT_MS = 0x5dc;
function normalizeDelay(value, item = 0x0) {
  const count = Number(value);
  return Number['isFinite'](count) && count >= 0x0 ? count : item;
}
function hasIdleBudget(enabled, key) {
  if (!enabled || typeof enabled !== 'object') return !![];
  if (enabled['didTimeout'] === !![]) return ![];
  return typeof enabled['timeRemaining'] !== 'function' || Number(enabled['timeRemaining']()) >= key;
}
export function isWorkspaceCacheInteractionBusy({
  documentRef: documentRef = globalThis['document'],
  CanvasTabManager: CanvasTabManager = null,
} = {}) {
  if (CanvasTabManager?.['_isVisualSnapshotInteractionBusy']?.() === !![]) return !![];
  const index = documentRef?.['body']?.['classList'],
    result = documentRef?.['documentElement']?.['classList'],
    data = documentRef?.['getElementById']?.('v2-canvas')?.['classList'];
  return Boolean(
    index?.['contains']?.('is-dragging') ||
    index?.['contains']?.('is-panning') ||
    index?.['contains']?.('is-zooming') ||
    index?.['contains']?.('is-viewport-animating') ||
    index?.['contains']?.('pick-connect-active') ||
    result?.['contains']?.('is-connecting-mode') ||
    data?.['contains']?.('is-connecting'),
  );
}
export function createWorkspaceCacheIdleScheduler({
  run: run,
  isBusy: isBusy = () => ![],
  retryDelayMs: retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  minIdleBudgetMs: minIdleBudgetMs = DEFAULT_MIN_IDLE_BUDGET_MS,
  idleTimeoutMs: idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
  setTimeoutFn: setTimeoutFn = globalThis['setTimeout']?.['bind'](globalThis),
  clearTimeoutFn: clearTimeoutFn = globalThis['clearTimeout']?.['bind'](globalThis),
  requestIdleCallbackFn: requestIdleCallbackFn = globalThis['requestIdleCallback']?.['bind'](globalThis),
  cancelIdleCallbackFn: cancelIdleCallbackFn = globalThis['cancelIdleCallback']?.['bind'](globalThis),
  onError: onError = () => {},
} = {}) {
  const delay = normalizeDelay(retryDelayMs, DEFAULT_RETRY_DELAY_MS),
    delay2 = normalizeDelay(minIdleBudgetMs, DEFAULT_MIN_IDLE_BUDGET_MS),
    timeout = normalizeDelay(idleTimeoutMs, DEFAULT_IDLE_TIMEOUT_MS);
  let options = 0x0,
    timer = null,
    requestIdleCallbackFn2 = null,
    enabled2 = ![];
  const run2 = () => {
      (timer !== null && typeof clearTimeoutFn === 'function' && clearTimeoutFn(timer), (timer = null));
    },
    handler = () => {
      (requestIdleCallbackFn2 !== null &&
        typeof cancelIdleCallbackFn === 'function' &&
        cancelIdleCallbackFn(requestIdleCallbackFn2),
        (requestIdleCallbackFn2 = null));
    },
    handler2 = () => {
      (run2(), handler());
    },
    handler3 = () => {
      try {
        const promise = run?.();
        promise && typeof promise['catch'] === 'function' && void promise['catch'](onError);
      } catch (target) {
        onError(target);
      }
    },
    handler4 = (source) => enabled2 && source === options;
  let run3;
  const run4 = (next, current = null) => {
      if (!handler4(next)) return;
      if (!hasIdleBudget(current, delay2) || isBusy()) {
        run3(next, delay);
        return;
      }
      ((enabled2 = ![]), handler3());
    },
    handler5 = (entry) => {
      if (!handler4(entry)) return;
      if (typeof requestIdleCallbackFn === 'function') {
        requestIdleCallbackFn2 = requestIdleCallbackFn(
          (record) => {
            ((requestIdleCallbackFn2 = null), run4(entry, record));
          },
          { timeout: timeout },
        );
        return;
      }
      if (typeof setTimeoutFn === 'function') {
        ((timer = setTimeoutFn(() => {
          ((timer = null), run4(entry));
        }, 0x0)),
          timer?.['unref']?.());
        return;
      }
      run4(entry);
    };
  run3 = (payload, handle) => {
    if (!handler4(payload)) return;
    if (typeof setTimeoutFn !== 'function') {
      handler5(payload);
      return;
    }
    ((timer = setTimeoutFn(() => {
      ((timer = null), handler5(payload));
    }, normalizeDelay(handle))),
      timer?.['unref']?.());
  };
  const cancel = () => {
      ((options += 0x1), (enabled2 = ![]), handler2());
    },
    schedule = ({ delayMs: delayMs = 0x0 } = {}) => {
      ((options += 0x1), (enabled2 = !![]), handler2());
      const state = options;
      return (run3(state, delayMs), state);
    };
  return Object['freeze']({
    schedule: schedule,
    cancel: cancel,
    isPending: () => enabled2,
    getGeneration: () => options,
  });
}
