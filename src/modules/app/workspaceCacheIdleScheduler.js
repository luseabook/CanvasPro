const DEFAULT_RETRY_DELAY_MS = 0xfa,
  DEFAULT_MIN_IDLE_BUDGET_MS = 0xc,
  DEFAULT_IDLE_TIMEOUT_MS = 0x5dc;
function normalizeDelay(value, fallback = 0x0) {
  const numeric = Number(value);
  return Number['isFinite'](numeric) && numeric >= 0x0 ? numeric : fallback;
}
function hasIdleBudget(deadline, minBudgetMs) {
  if (!deadline || typeof deadline !== 'object') return !![];
  if (deadline['didTimeout'] === !![]) return ![];
  return (
    typeof deadline['timeRemaining'] !== 'function' || Number(deadline['timeRemaining']()) >= minBudgetMs
  );
}
export function isWorkspaceCacheInteractionBusy({
  documentRef: documentRef = globalThis['document'],
  CanvasTabManager: CanvasTabManager = null,
} = {}) {
  if (CanvasTabManager?.['_isVisualSnapshotInteractionBusy']?.() === !![]) return !![];
  const bodyClassList = documentRef?.['body']?.['classList'],
    rootClassList = documentRef?.['documentElement']?.['classList'],
    canvasClassList = documentRef?.['getElementById']?.('v2-canvas')?.['classList'];
  return Boolean(
    bodyClassList?.['contains']?.('is-dragging') ||
    bodyClassList?.['contains']?.('is-panning') ||
    bodyClassList?.['contains']?.('is-zooming') ||
    bodyClassList?.['contains']?.('is-viewport-animating') ||
    bodyClassList?.['contains']?.('pick-connect-active') ||
    rootClassList?.['contains']?.('is-connecting-mode') ||
    canvasClassList?.['contains']?.('is-connecting'),
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
  const retryDelay = normalizeDelay(retryDelayMs, DEFAULT_RETRY_DELAY_MS),
    minIdleBudget = normalizeDelay(minIdleBudgetMs, DEFAULT_MIN_IDLE_BUDGET_MS),
    idleTimeout = normalizeDelay(idleTimeoutMs, DEFAULT_IDLE_TIMEOUT_MS);
  let generation = 0x0,
    timeoutHandle = null,
    idleHandle = null,
    pending = ![];
  const clearTimer = () => {
      (timeoutHandle !== null && typeof clearTimeoutFn === 'function' && clearTimeoutFn(timeoutHandle),
        (timeoutHandle = null));
    },
    clearIdle = () => {
      (idleHandle !== null && typeof cancelIdleCallbackFn === 'function' && cancelIdleCallbackFn(idleHandle),
        (idleHandle = null));
    },
    clearAll = () => {
      (clearTimer(), clearIdle());
    },
    invokeRun = () => {
      try {
        const result = run?.();
        result && typeof result['catch'] === 'function' && void result['catch'](onError);
      } catch (error) {
        onError(error);
      }
    },
    isCurrent = (candidate) => pending && candidate === generation;
  let scheduleAfterDelay;
  const runIfIdle = (candidate, deadline = null) => {
      if (!isCurrent(candidate)) return;
      if (!hasIdleBudget(deadline, minIdleBudget) || isBusy()) {
        scheduleAfterDelay(candidate, retryDelay);
        return;
      }
      ((pending = ![]), invokeRun());
    },
    scheduleIdleRun = (candidate) => {
      if (!isCurrent(candidate)) return;
      if (typeof requestIdleCallbackFn === 'function') {
        idleHandle = requestIdleCallbackFn(
          (deadline) => {
            ((idleHandle = null), runIfIdle(candidate, deadline));
          },
          { timeout: idleTimeout },
        );
        return;
      }
      if (typeof setTimeoutFn === 'function') {
        ((timeoutHandle = setTimeoutFn(() => {
          ((timeoutHandle = null), runIfIdle(candidate));
        }, 0x0)),
          timeoutHandle?.['unref']?.());
        return;
      }
      runIfIdle(candidate);
    };
  scheduleAfterDelay = (candidate, delayMs) => {
    if (!isCurrent(candidate)) return;
    if (typeof setTimeoutFn !== 'function') {
      scheduleIdleRun(candidate);
      return;
    }
    ((timeoutHandle = setTimeoutFn(() => {
      ((timeoutHandle = null), scheduleIdleRun(candidate));
    }, normalizeDelay(delayMs))),
      timeoutHandle?.['unref']?.());
  };
  const cancel = () => {
      ((generation += 0x1), (pending = ![]), clearAll());
    },
    schedule = ({ delayMs: delayMs = 0x0 } = {}) => {
      ((generation += 0x1), (pending = !![]), clearAll());
      const scheduled = generation;
      return (scheduleAfterDelay(scheduled, delayMs), scheduled);
    };
  return Object['freeze']({
    schedule: schedule,
    cancel: cancel,
    isPending: () => pending,
    getGeneration: () => generation,
  });
}
