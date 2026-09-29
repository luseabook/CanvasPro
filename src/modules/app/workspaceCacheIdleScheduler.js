const DEFAULT_RETRY_DELAY_MS = 0xfa,
  DEFAULT_MIN_IDLE_BUDGET_MS = 0xc,
  DEFAULT_IDLE_TIMEOUT_MS = 0x5dc;
function normalizeDelay(_0x4f0f08, _0x13dfca = 0x0) {
  const _0x1e877f = Number(_0x4f0f08);
  return Number['isFinite'](_0x1e877f) && _0x1e877f >= 0x0 ? _0x1e877f : _0x13dfca;
}
function hasIdleBudget(_0xd7c878, _0x39e82f) {
  if (!_0xd7c878 || typeof _0xd7c878 !== 'object') return !![];
  if (_0xd7c878['didTimeout'] === !![]) return ![];
  return (
    typeof _0xd7c878['timeRemaining'] !== 'function' || Number(_0xd7c878['timeRemaining']()) >= _0x39e82f
  );
}
export function isWorkspaceCacheInteractionBusy({
  documentRef: documentRef = globalThis['document'],
  CanvasTabManager: CanvasTabManager = null,
} = {}) {
  if (CanvasTabManager?.['_isVisualSnapshotInteractionBusy']?.() === !![]) return !![];
  const _0xd01f25 = documentRef?.['body']?.['classList'],
    _0x4e16da = documentRef?.['documentElement']?.['classList'],
    _0x307925 = documentRef?.['getElementById']?.('v2-canvas')?.['classList'];
  return Boolean(
    _0xd01f25?.['contains']?.('is-dragging') ||
    _0xd01f25?.['contains']?.('is-panning') ||
    _0xd01f25?.['contains']?.('is-zooming') ||
    _0xd01f25?.['contains']?.('is-viewport-animating') ||
    _0xd01f25?.['contains']?.('pick-connect-active') ||
    _0x4e16da?.['contains']?.('is-connecting-mode') ||
    _0x307925?.['contains']?.('is-connecting'),
  );
}
export function createWorkspaceCacheIdleScheduler({
  run: _0x3725ef,
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
  const _0x2e1019 = normalizeDelay(retryDelayMs, DEFAULT_RETRY_DELAY_MS),
    _0x4fab21 = normalizeDelay(minIdleBudgetMs, DEFAULT_MIN_IDLE_BUDGET_MS),
    _0x3d92db = normalizeDelay(idleTimeoutMs, DEFAULT_IDLE_TIMEOUT_MS);
  let _0x3ad7a8 = 0x0,
    _0x184c58 = null,
    _0x50c7de = null,
    _0x4eda4a = ![];
  const _0x340f01 = () => {
      (_0x184c58 !== null && typeof clearTimeoutFn === 'function' && clearTimeoutFn(_0x184c58),
        (_0x184c58 = null));
    },
    _0x4e6c4d = () => {
      (_0x50c7de !== null && typeof cancelIdleCallbackFn === 'function' && cancelIdleCallbackFn(_0x50c7de),
        (_0x50c7de = null));
    },
    _0x34349f = () => {
      (_0x340f01(), _0x4e6c4d());
    },
    _0x1a9a58 = () => {
      try {
        const _0xd6fb3f = _0x3725ef?.();
        _0xd6fb3f && typeof _0xd6fb3f['catch'] === 'function' && void _0xd6fb3f['catch'](onError);
      } catch (_0x182a0c) {
        onError(_0x182a0c);
      }
    },
    _0x31f771 = (_0x449c6f) => _0x4eda4a && _0x449c6f === _0x3ad7a8;
  let _0x39296a;
  const _0x3e6821 = (_0x531764, _0x4e6aba = null) => {
      if (!_0x31f771(_0x531764)) return;
      if (!hasIdleBudget(_0x4e6aba, _0x4fab21) || isBusy()) {
        _0x39296a(_0x531764, _0x2e1019);
        return;
      }
      ((_0x4eda4a = ![]), _0x1a9a58());
    },
    _0x421e9b = (_0x28b2a1) => {
      if (!_0x31f771(_0x28b2a1)) return;
      if (typeof requestIdleCallbackFn === 'function') {
        _0x50c7de = requestIdleCallbackFn(
          (_0x21ce85) => {
            ((_0x50c7de = null), _0x3e6821(_0x28b2a1, _0x21ce85));
          },
          { timeout: _0x3d92db },
        );
        return;
      }
      if (typeof setTimeoutFn === 'function') {
        ((_0x184c58 = setTimeoutFn(() => {
          ((_0x184c58 = null), _0x3e6821(_0x28b2a1));
        }, 0x0)),
          _0x184c58?.['unref']?.());
        return;
      }
      _0x3e6821(_0x28b2a1);
    };
  _0x39296a = (_0x3f4a34, _0xf36a10) => {
    if (!_0x31f771(_0x3f4a34)) return;
    if (typeof setTimeoutFn !== 'function') {
      _0x421e9b(_0x3f4a34);
      return;
    }
    ((_0x184c58 = setTimeoutFn(() => {
      ((_0x184c58 = null), _0x421e9b(_0x3f4a34));
    }, normalizeDelay(_0xf36a10))),
      _0x184c58?.['unref']?.());
  };
  const _0x2541c7 = () => {
      ((_0x3ad7a8 += 0x1), (_0x4eda4a = ![]), _0x34349f());
    },
    _0x543b37 = ({ delayMs: delayMs = 0x0 } = {}) => {
      ((_0x3ad7a8 += 0x1), (_0x4eda4a = !![]), _0x34349f());
      const _0xf1a8c3 = _0x3ad7a8;
      return (_0x39296a(_0xf1a8c3, delayMs), _0xf1a8c3);
    };
  return Object['freeze']({
    schedule: _0x543b37,
    cancel: _0x2541c7,
    isPending: () => _0x4eda4a,
    getGeneration: () => _0x3ad7a8,
  });
}
