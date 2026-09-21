const DEFAULT_KEEPALIVE_INTERVAL_MS = 0x3a98,
  DEFAULT_KEEPALIVE_TIMEOUT_MS = 0x3e8,
  DEFAULT_RUNTIME_INFO_PATH = '/api/v2/runtime/info',
  DEFAULT_BLOCKER_REASON = 'local-runtime-keepalive';
function isWindowWarmable(_0x4c114d) {
  if (!_0x4c114d || _0x4c114d.isDestroyed?.()) return false;
  if (!_0x4c114d.isVisible?.()) return false;
  if (_0x4c114d.isMinimized?.()) return false;
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
  let _0x256194 = null,
    _0x1be03b = false;
  function _0x166c05() {
    return isWindowWarmable(getWindow?.());
  }
  async function _0x1c0df0(_0x9f1df2 = 'keepalive') {
    if (_0x1be03b || !_0x166c05() || typeof requestLocalJson !== 'function') return false;
    _0x1be03b = true;
    try {
      return (await requestLocalJson(runtimeInfoPath, timeoutMs), true);
    } catch (_0x54289b) {
      return (
        logDiagnosticEvent?.({
          type: 'local_runtime.keep_alive_failed',
          level: 'debug',
          source: 'main',
          message: 'Local runtime keep-alive request failed',
          context: { reason: _0x9f1df2 },
          error: _0x54289b,
        }),
        false
      );
    } finally {
      _0x1be03b = false;
    }
  }
  function _0x207b16() {
    if (_0x256194 || !(intervalMs > 0)) return;
    ((_0x256194 = setInterval(() => {
      void _0x1c0df0('interval');
    }, intervalMs)),
      _0x256194.unref?.());
  }
  function _0x4b601c() {
    (_0x256194 && (clearInterval(_0x256194), (_0x256194 = null)),
      setPowerSaveBlocker?.(blockerReason, false));
  }
  function _0x3bec96(_0x6d3a10 = 'start') {
    if (!_0x166c05()) return (setPowerSaveBlocker?.(blockerReason, false), Promise.resolve(false));
    return (
      setPowerSaveBlocker?.(blockerReason, true, 'prevent-app-suspension'),
      _0x207b16(),
      _0x1c0df0(_0x6d3a10)
    );
  }
  function _0x2c7f10(_0x50b945 = 'window-state') {
    if (_0x166c05()) return _0x3bec96(_0x50b945);
    return (_0x4b601c(), Promise.resolve(false));
  }
  return {
    ping: _0x1c0df0,
    refresh: _0x2c7f10,
    shouldKeepWarm: _0x166c05,
    start: _0x3bec96,
    stop: _0x4b601c,
  };
}
export const __localRuntimeKeepAliveForTest = {
  DEFAULT_KEEPALIVE_INTERVAL_MS: DEFAULT_KEEPALIVE_INTERVAL_MS,
  DEFAULT_KEEPALIVE_TIMEOUT_MS: DEFAULT_KEEPALIVE_TIMEOUT_MS,
  DEFAULT_RUNTIME_INFO_PATH: DEFAULT_RUNTIME_INFO_PATH,
  DEFAULT_BLOCKER_REASON: DEFAULT_BLOCKER_REASON,
  isWindowWarmable: isWindowWarmable,
};
