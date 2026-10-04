export function createRendererInteractionGraceController({
  delayMs: delayMs = 0,
  getNow: getNow = defaultNow,
  getDragContext: getDragContext = null,
  onBusyStateChange: onBusyStateChange = null,
} = {}) {
  let now = 0,
    value = false;
  function run(item) {
    const key = item === true;
    if (value === key) return;
    ((value = key), onBusyStateChange?.(key));
  }
  function markBusy() {
    ((now = getNow()), run(true));
  }
  function markIdle() {
    run(false);
  }
  function getRemainingMs() {
    const count = Number(delayMs);
    if (!Number.isFinite(count) || count <= 0 || !now) return 0;
    const now2 = getNow() - now;
    return Math.max(0, count - Math.max(0, now2));
  }
  function reset() {
    ((now = 0), run(false));
  }
  function isBusy() {
    const index = typeof getDragContext === 'function' ? getDragContext() || {} : {};
    if (
      index.isPanning ||
      index.isDragging ||
      index.isConnecting ||
      index.isBoxSelecting ||
      index.isDraggingCell
    )
      return true;
    const result = typeof document !== 'undefined' ? document.body?.classList : null;
    return !!(
      result?.contains?.('is-panning') ||
      result?.contains?.('is-zooming') ||
      result?.contains?.('is-viewport-animating')
    );
  }
  return {
    getRemainingMs: getRemainingMs,
    isBusy: isBusy,
    markIdle: markIdle,
    markBusy: markBusy,
    reset: reset,
  };
}
function defaultNow() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now();
  return Date.now();
}
