const DEFAULT_KEEPALIVE_INTERVAL_MS = 0x3a98,
  DEFAULT_KEEPALIVE_TIMEOUT_MS = 0x3e8,
  DEFAULT_RUNTIME_INFO_PATH = '/api/v2/runtime/info',
  DEFAULT_BLOCKER_REASON = 'local-runtime-keepalive';
function isWindowWarmable(enabled) {
  if (!enabled || enabled.isDestroyed?.()) return false;
  if (!enabled.isVisible?.()) return false;
  if (enabled.isMinimized?.()) return false;
  return true;
}
export function createLocalRuntimeKeepAliveController({
  getWindow: getWindow = () => null,
  requestLocalJson: requestLocalJson = null,
  setPowerSaveBlocker: setPowerSaveBlocker = null,
  logDiagnosticEvent: logDiagnosticEvent = null,
  intervalMs: intervalMs = DEFAULT_KEEPALIVE_INTERVAL_MS,
  timeoutMs: timeoutMs = DEFAULT_KEEPALIVE_TIMEOUT_MS,
  runtimeInfoPath: runtimeInfoPath = DEFAULT_RUNTIME_INFO_PATH,
  blockerReason: blockerReason = DEFAULT_BLOCKER_REASON,
} = {}) {
  let timer = null,
    value = false;
  function shouldKeepWarm() {
    return isWindowWarmable(getWindow?.());
  }
  async function ping(reason = 'keepalive') {
    if (value || !shouldKeepWarm() || typeof requestLocalJson !== 'function') return false;
    value = true;
    try {
      return (await requestLocalJson(runtimeInfoPath, timeoutMs), true);
    } catch (error) {
      return (
        logDiagnosticEvent?.({
          type: 'local_runtime.keep_alive_failed',
          level: 'debug',
          source: 'main',
          message: 'Local runtime keep-alive request failed',
          context: { reason: reason },
          error: error,
        }),
        false
      );
    } finally {
      value = false;
    }
  }
  function run() {
    if (timer || !(intervalMs > 0)) return;
    ((timer = setInterval(() => {
      void ping('interval');
    }, intervalMs)),
      timer.unref?.());
  }
  function stop() {
    (timer && (clearInterval(timer), (timer = null)), setPowerSaveBlocker?.(blockerReason, false));
  }
  function start(item = 'start') {
    if (!shouldKeepWarm()) return (setPowerSaveBlocker?.(blockerReason, false), Promise.resolve(false));
    return (setPowerSaveBlocker?.(blockerReason, true, 'prevent-app-suspension'), run(), ping(item));
  }
  function refresh(key = 'window-state') {
    if (shouldKeepWarm()) return start(key);
    return (stop(), Promise.resolve(false));
  }
  return {
    ping: ping,
    refresh: refresh,
    shouldKeepWarm: shouldKeepWarm,
    start: start,
    stop: stop,
  };
}
export const __localRuntimeKeepAliveForTest = {
  DEFAULT_KEEPALIVE_INTERVAL_MS: DEFAULT_KEEPALIVE_INTERVAL_MS,
  DEFAULT_KEEPALIVE_TIMEOUT_MS: DEFAULT_KEEPALIVE_TIMEOUT_MS,
  DEFAULT_RUNTIME_INFO_PATH: DEFAULT_RUNTIME_INFO_PATH,
  DEFAULT_BLOCKER_REASON: DEFAULT_BLOCKER_REASON,
  isWindowWarmable: isWindowWarmable,
};
