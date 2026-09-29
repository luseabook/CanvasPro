const DEFAULT_PRIORITY_COOLDOWN_MS = 0x38,
  DEFAULT_LONG_FRAME_THRESHOLD_MS = 0x32,
  DEFAULT_MAX_NON_PRIORITY_BLOCK_MS = 0xa0;
function getWindowLike() {
  return typeof window !== 'undefined' ? window : globalThis;
}
function defaultNow() {
  return Number(globalThis['performance']?.['now']?.() || Date['now']());
}
function defaultRequestFrame(_0x19a795) {
  const _0x538c58 = getWindowLike();
  if (typeof _0x538c58?.['requestAnimationFrame'] === 'function')
    return _0x538c58['requestAnimationFrame'](_0x19a795);
  return setTimeout(() => _0x19a795(defaultNow()), 0x10);
}
function defaultCancelFrame(_0x15db55) {
  const _0x2120c0 = getWindowLike();
  if (typeof _0x2120c0?.['cancelAnimationFrame'] === 'function') {
    _0x2120c0['cancelAnimationFrame'](_0x15db55);
    return;
  }
  clearTimeout(_0x15db55);
}
export function createRendererVideoHydrationBackpressure({
  now: now = defaultNow,
  requestFrame: requestFrame = defaultRequestFrame,
  cancelFrame: cancelFrame = defaultCancelFrame,
  priorityCooldownMs: priorityCooldownMs = DEFAULT_PRIORITY_COOLDOWN_MS,
  longFrameThresholdMs: longFrameThresholdMs = DEFAULT_LONG_FRAME_THRESHOLD_MS,
  maxNonPriorityBlockMs: maxNonPriorityBlockMs = DEFAULT_MAX_NON_PRIORITY_BLOCK_MS,
} = {}) {
  let _0x3e4720 = !![],
    _0x125434 = null,
    _0x4ae403 = null,
    _0x2407e7 = 0x0,
    _0x5dfed8 = 0x0,
    _0x4ff371 = !![],
    _0x20180c = null,
    _0x181654 = ![];
  const _0x4f1d64 = () => {
      if (_0x125434 !== null) return;
      _0x125434 = requestFrame(() => {
        ((_0x125434 = null), (_0x3e4720 = !![]));
      });
    },
    _0x2e2243 = () => {
      if (_0x4ae403 !== null) return;
      _0x4ae403 = requestFrame(() => {
        _0x4ae403 = null;
        const _0x4bcbcf = Number(now()) || 0x0,
          _0x3ec6e2 = Math['max'](0x0, _0x4bcbcf - _0x5dfed8);
        _0x5dfed8 = _0x4bcbcf;
        const _0x14025d = _0x20180c === null ? 0x0 : Math['max'](0x0, _0x4bcbcf - _0x20180c);
        if (
          _0x4bcbcf >= _0x2407e7 &&
          (_0x3ec6e2 <= Math['max'](0x10, Number(longFrameThresholdMs) || 0x0) ||
            _0x14025d >= Math['max'](0x0, Number(maxNonPriorityBlockMs) || 0x0))
        ) {
          ((_0x4ff371 = !![]), (_0x181654 = !![]));
          return;
        }
        _0x2e2243();
      });
    };
  function _0x16c1f5() {
    const _0x7289d7 = Number(now()) || 0x0;
    if (_0x181654) return;
    (_0x20180c === null && (_0x20180c = _0x7289d7),
      (_0x2407e7 = Math['max'](_0x2407e7, _0x7289d7 + Math['max'](0x0, Number(priorityCooldownMs) || 0x0))),
      (_0x5dfed8 = _0x7289d7),
      (_0x4ff371 = ![]),
      _0x2e2243());
  }
  function _0x40b808({ priority: priority = ![] } = {}) {
    if (priority) return (_0x16c1f5(), !![]);
    if (!_0x181654 && (!_0x4ff371 || (Number(now()) || 0x0) < _0x2407e7)) return ![];
    if (!_0x3e4720) return ![];
    return (
      (_0x3e4720 = ![]),
      _0x181654 && ((_0x181654 = ![]), (_0x20180c = null), (_0x2407e7 = 0x0), (_0x4ff371 = !![])),
      _0x4f1d64(),
      !![]
    );
  }
  function _0x577d9c() {
    if (_0x125434 !== null) cancelFrame(_0x125434);
    if (_0x4ae403 !== null) cancelFrame(_0x4ae403);
    ((_0x125434 = null),
      (_0x4ae403 = null),
      (_0x2407e7 = 0x0),
      (_0x5dfed8 = 0x0),
      (_0x4ff371 = !![]),
      (_0x20180c = null),
      (_0x181654 = ![]),
      (_0x3e4720 = !![]));
  }
  return { markPriorityWork: _0x16c1f5, reset: _0x577d9c, tryAcquire: _0x40b808 };
}
export const __rendererVideoHydrationBackpressureForTest = {
  DEFAULT_LONG_FRAME_THRESHOLD_MS: DEFAULT_LONG_FRAME_THRESHOLD_MS,
  DEFAULT_MAX_NON_PRIORITY_BLOCK_MS: DEFAULT_MAX_NON_PRIORITY_BLOCK_MS,
  DEFAULT_PRIORITY_COOLDOWN_MS: DEFAULT_PRIORITY_COOLDOWN_MS,
};
