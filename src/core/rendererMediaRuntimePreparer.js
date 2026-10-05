const DEFAULT_IDLE_TIMEOUT_MS = 240,
  DEFAULT_FALLBACK_DELAY_MS = 32,
  DEFAULT_BUSY_RETRY_MS = 120,
  DEFAULT_MIN_IDLE_BUDGET_MS = 12,
  DEFAULT_MAX_QUEUED = 24,
  DEFAULT_MAX_PREPARED = 4,
  PREBUILD_MEDIA_TYPES = new Set(['source-image', 'source-video']);
function getWindowLike() {
  return typeof window !== 'undefined' ? window : globalThis;
}
function defaultNow() {
  return Number(globalThis['performance']?.['now']?.() || Date['now']());
}
function defaultSchedule(handler, { timeoutMs: timeoutMs, delayMs: delayMs } = {}) {
  const handle = getWindowLike();
  if (typeof handle['requestIdleCallback'] === 'function')
    return { handle: handle['requestIdleCallback'](handler, { timeout: timeoutMs }), type: 'idle' };
  return { handle: setTimeout(() => handler(null), Math['max'](0, delayMs || 0)), type: 'timeout' };
}
function defaultCancel(value, item) {
  const windowLike = getWindowLike();
  if (item === 'idle' && typeof windowLike['cancelIdleCallback'] === 'function') {
    windowLike['cancelIdleCallback'](value);
    return;
  }
  clearTimeout(value);
}
function normalizeTask(version = {}) {
  const nodeId = String(version['nodeId'] || '')['trim']();
  if (!nodeId || typeof version['prepare'] !== 'function') return null;
  return {
    nodeId: nodeId,
    version: version['version'],
    variant: String(version['variant'] || ''),
    prepare: version['prepare'],
    dispose: typeof version['dispose'] === 'function' ? version['dispose'] : null,
    isValid: typeof version['isValid'] === 'function' ? version['isValid'] : null,
  };
}
function isSameTaskVersion(key, index, result) {
  return key?.['version'] === index && key?.['variant'] === String(result || '');
}
export function shouldPrebuildRendererMediaRuntime({
  node: node,
  nodeCount: nodeCount = 0,
  veryDenseNodeCount: veryDenseNodeCount = 120,
  hasExactVisiblePreview: hasExactVisiblePreview = false,
  interactionBusy: interactionBusy = false,
  interactionPriority: interactionPriority = false,
  deferMediaOnMount: deferMediaOnMount = false,
  viewportPriorityMediaOnly: viewportPriorityMediaOnly = false,
  idlePreparationSupported: idlePreparationSupported = true,
} = {}) {
  const data = String(node?.['type'] || '')
    ['trim']()
    ['toLowerCase']();
  return !!(
    PREBUILD_MEDIA_TYPES['has'](data) &&
    Number(nodeCount || 0) >= Math['max'](1, Number(veryDenseNodeCount) || 1) &&
    hasExactVisiblePreview &&
    !interactionBusy &&
    !interactionPriority &&
    deferMediaOnMount &&
    !viewportPriorityMediaOnly &&
    idlePreparationSupported
  );
}
export function createRendererMediaRuntimePreparer({
  isInteractionBusy: isInteractionBusy,
  onPrepared: onPrepared,
  onPrepareError: onPrepareError,
  now: now = defaultNow,
  scheduleTask: scheduleTask = defaultSchedule,
  cancelTask: cancelTask = defaultCancel,
  idleTimeoutMs: idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
  fallbackDelayMs: fallbackDelayMs = DEFAULT_FALLBACK_DELAY_MS,
  busyRetryMs: busyRetryMs = DEFAULT_BUSY_RETRY_MS,
  minIdleBudgetMs: minIdleBudgetMs = DEFAULT_MIN_IDLE_BUDGET_MS,
  maxQueued: maxQueued = DEFAULT_MAX_QUEUED,
  maxPrepared: maxPrepared = DEFAULT_MAX_PREPARED,
} = {}) {
  const queued = new Map(),
    prepared = new Map();
  let value2 = null,
    options = '',
    paused = false;
  const target = Math['max'](1, Math['trunc'](Number(maxQueued) || 1)),
    source = Math['max'](1, Math['trunc'](Number(maxPrepared) || 1));
  function run(enabled) {
    if (!enabled) return;
    try {
      enabled['dispose']?.(enabled['runtime']);
    } catch {}
  }
  function run2() {
    if (value2 === null) return;
    (cancelTask(value2, options), (value2 = null), (options = ''));
  }
  function run3(delayMs2 = fallbackDelayMs) {
    if (paused || value2 !== null || queued['size'] === 0) return;
    const scheduleTask2 = scheduleTask(flush, { timeoutMs: idleTimeoutMs, delayMs: delayMs2 });
    ((value2 = scheduleTask2?.['handle'] ?? scheduleTask2), (options = scheduleTask2?.['type'] || 'timeout'));
  }
  function run4(next) {
    const enabled2 = prepared['get'](next);
    if (!enabled2) return;
    (prepared['delete'](next), run(enabled2));
  }
  function forget(current) {
    const enabled3 = String(current || '')['trim']();
    if (!enabled3) return;
    (queued['delete'](enabled3), run4(enabled3));
    if (queued['size'] === 0) run2();
  }
  function run5() {
    while (prepared['size'] >= source) {
      const enabled4 = prepared['keys']()['next']()['value'];
      if (!enabled4) return;
      run4(enabled4);
    }
  }
  function flush(value3 = null) {
    ((value2 = null), (options = ''));
    if (paused) return;
    if (isInteractionBusy?.() === true) {
      run3(busyRetryMs);
      return;
    }
    if (
      value3 &&
      value3['didTimeout'] !== true &&
      typeof value3['timeRemaining'] === 'function' &&
      value3['timeRemaining']() < Math['max'](0, Number(minIdleBudgetMs) || 0)
    ) {
      run3(fallbackDelayMs);
      return;
    }
    let nodeId2 = null;
    while (queued['size'] > 0 && !nodeId2) {
      const enabled5 = queued['entries']()['next']()['value'];
      if (!enabled5) break;
      const [entry, record] = enabled5;
      queued['delete'](entry);
      if (record['isValid']?.() === false) continue;
      nodeId2 = record;
    }
    if (!nodeId2) {
      if (queued['size'] > 0) run3();
      return;
    }
    let runtime = null;
    const payload = Number(now()) || 0;
    try {
      runtime = nodeId2['prepare']();
    } catch (error) {
      onPrepareError?.({ nodeId: nodeId2['nodeId'], error: error });
    }
    if (runtime) {
      const state = { ...nodeId2, runtime: runtime };
      nodeId2['isValid']?.() === false
        ? run(state)
        : (run5(),
          prepared['set'](nodeId2['nodeId'], state),
          onPrepared?.({
            nodeId: nodeId2['nodeId'],
            durationMs: Math['max'](0, (Number(now()) || 0) - payload),
          }));
    }
    if (queued['size'] > 0) run3();
  }
  function enqueue(config) {
    const task = normalizeTask(config);
    if (!task || task['isValid']?.() === false) return false;
    const scope = prepared['get'](task['nodeId']);
    if (scope && isSameTaskVersion(scope, task['version'], task['variant']) && scope['isValid']?.() !== false)
      return true;
    if (scope) run4(task['nodeId']);
    const enabled6 = queued['get'](task['nodeId']);
    if (
      enabled6 &&
      isSameTaskVersion(enabled6, task['version'], task['variant']) &&
      enabled6['isValid']?.() !== false
    )
      return true;
    if (!enabled6 && queued['size'] >= target) return false;
    return (queued['set'](task['nodeId'], task), run3(), true);
  }
  function hasPrepared(input, output, value4 = '') {
    const value5 = String(input || '')['trim'](),
      enabled7 = prepared['get'](value5);
    if (!enabled7) return false;
    if (!isSameTaskVersion(enabled7, output, value4) || enabled7['isValid']?.() === false)
      return (run4(value5), false);
    return true;
  }
  function take(value6, value7, value8 = '') {
    const value9 = String(value6 || '')['trim']();
    if (!hasPrepared(value9, value7, value8)) return null;
    const value10 = prepared['get'](value9);
    return (prepared['delete'](value9), value10?.['runtime'] || null);
  }
  function prune(value11) {
    const map = value11 instanceof Set ? value11 : new Set(value11 || []);
    for (const value12 of queued['keys']()) {
      if (!map['has'](value12)) queued['delete'](value12);
    }
    for (const value13 of prepared['keys']()) {
      if (!map['has'](value13)) run4(value13);
    }
    if (queued['size'] === 0) run2();
  }
  function pause() {
    ((paused = true), run2());
  }
  function resume() {
    ((paused = false), run3());
  }
  function clear() {
    (run2(), queued['clear']());
    for (const value14 of prepared['values']()) run(value14);
    (prepared['clear'](), (paused = false));
  }
  return {
    clear: clear,
    enqueue: enqueue,
    flush: flush,
    forget: forget,
    hasPrepared: hasPrepared,
    pause: pause,
    prune: prune,
    resume: resume,
    take: take,
    getStats: () => ({
      queued: queued['size'],
      physicalQueued: queued['size'],
      prepared: prepared['size'],
      paused: paused,
    }),
  };
}
