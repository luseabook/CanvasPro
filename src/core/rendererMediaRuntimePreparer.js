const DEFAULT_IDLE_TIMEOUT_MS = 0xf0,
  DEFAULT_FALLBACK_DELAY_MS = 0x20,
  DEFAULT_BUSY_RETRY_MS = 0x78,
  DEFAULT_MIN_IDLE_BUDGET_MS = 0xc,
  DEFAULT_MAX_QUEUED = 0x18,
  DEFAULT_MAX_PREPARED = 0x4,
  PREBUILD_MEDIA_TYPES = new Set(['source-image', 'source-video']);
function getWindowLike() {
  return typeof window !== 'undefined' ? window : globalThis;
}
function defaultNow() {
  return Number(globalThis['performance']?.['now']?.() || Date['now']());
}
function defaultSchedule(_0x32279d, { timeoutMs: _0x4e4c6a, delayMs: _0x537033 } = {}) {
  const _0x3f15b3 = getWindowLike();
  if (typeof _0x3f15b3['requestIdleCallback'] === 'function')
    return { handle: _0x3f15b3['requestIdleCallback'](_0x32279d, { timeout: _0x4e4c6a }), type: 'idle' };
  return { handle: setTimeout(() => _0x32279d(null), Math['max'](0x0, _0x537033 || 0x0)), type: 'timeout' };
}
function defaultCancel(_0x48c28f, _0x967497) {
  const _0x230e00 = getWindowLike();
  if (_0x967497 === 'idle' && typeof _0x230e00['cancelIdleCallback'] === 'function') {
    _0x230e00['cancelIdleCallback'](_0x48c28f);
    return;
  }
  clearTimeout(_0x48c28f);
}
function normalizeTask(_0x466f75 = {}) {
  const _0x975df6 = String(_0x466f75['nodeId'] || '')['trim']();
  if (!_0x975df6 || typeof _0x466f75['prepare'] !== 'function') return null;
  return {
    nodeId: _0x975df6,
    version: _0x466f75['version'],
    variant: String(_0x466f75['variant'] || ''),
    prepare: _0x466f75['prepare'],
    dispose: typeof _0x466f75['dispose'] === 'function' ? _0x466f75['dispose'] : null,
    isValid: typeof _0x466f75['isValid'] === 'function' ? _0x466f75['isValid'] : null,
  };
}
function isSameTaskVersion(_0x6688aa, _0x34b76f, _0xb82000) {
  return _0x6688aa?.['version'] === _0x34b76f && _0x6688aa?.['variant'] === String(_0xb82000 || '');
}
export function shouldPrebuildRendererMediaRuntime({
  node: _0x298158,
  nodeCount: nodeCount = 0x0,
  veryDenseNodeCount: veryDenseNodeCount = 0x78,
  hasExactVisiblePreview: hasExactVisiblePreview = ![],
  interactionBusy: interactionBusy = ![],
  interactionPriority: interactionPriority = ![],
  deferMediaOnMount: deferMediaOnMount = ![],
  viewportPriorityMediaOnly: viewportPriorityMediaOnly = ![],
  idlePreparationSupported: idlePreparationSupported = !![],
} = {}) {
  const _0x28988a = String(_0x298158?.['type'] || '')
    ['trim']()
    ['toLowerCase']();
  return !!(
    PREBUILD_MEDIA_TYPES['has'](_0x28988a) &&
    Number(nodeCount || 0x0) >= Math['max'](0x1, Number(veryDenseNodeCount) || 0x1) &&
    hasExactVisiblePreview &&
    !interactionBusy &&
    !interactionPriority &&
    deferMediaOnMount &&
    !viewportPriorityMediaOnly &&
    idlePreparationSupported
  );
}
export function createRendererMediaRuntimePreparer({
  isInteractionBusy: _0x4390e0,
  onPrepared: _0x87556f,
  onPrepareError: _0x2080d1,
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
  const _0x423a49 = new Map(),
    _0x24caa5 = new Map();
  let _0x44fbc4 = null,
    _0x253289 = '',
    _0x49665b = ![];
  const _0x2b4a13 = Math['max'](0x1, Math['trunc'](Number(maxQueued) || 0x1)),
    _0xad87eb = Math['max'](0x1, Math['trunc'](Number(maxPrepared) || 0x1));
  function _0x1707da(_0x1ead33) {
    if (!_0x1ead33) return;
    try {
      _0x1ead33['dispose']?.(_0x1ead33['runtime']);
    } catch {}
  }
  function _0x2b3451() {
    if (_0x44fbc4 === null) return;
    (cancelTask(_0x44fbc4, _0x253289), (_0x44fbc4 = null), (_0x253289 = ''));
  }
  function _0x340988(_0x431caa = fallbackDelayMs) {
    if (_0x49665b || _0x44fbc4 !== null || _0x423a49['size'] === 0x0) return;
    const _0x5c4530 = scheduleTask(_0x520b34, { timeoutMs: idleTimeoutMs, delayMs: _0x431caa });
    ((_0x44fbc4 = _0x5c4530?.['handle'] ?? _0x5c4530), (_0x253289 = _0x5c4530?.['type'] || 'timeout'));
  }
  function _0x3282dc(_0x4adf59) {
    const _0x2b5384 = _0x24caa5['get'](_0x4adf59);
    if (!_0x2b5384) return;
    (_0x24caa5['delete'](_0x4adf59), _0x1707da(_0x2b5384));
  }
  function _0xd6fa7a(_0x4f22f7) {
    const _0x67d4ff = String(_0x4f22f7 || '')['trim']();
    if (!_0x67d4ff) return;
    (_0x423a49['delete'](_0x67d4ff), _0x3282dc(_0x67d4ff));
    if (_0x423a49['size'] === 0x0) _0x2b3451();
  }
  function _0x4fc76f() {
    while (_0x24caa5['size'] >= _0xad87eb) {
      const _0x2e0c8b = _0x24caa5['keys']()['next']()['value'];
      if (!_0x2e0c8b) return;
      _0x3282dc(_0x2e0c8b);
    }
  }
  function _0x520b34(_0x1d594a = null) {
    ((_0x44fbc4 = null), (_0x253289 = ''));
    if (_0x49665b) return;
    if (_0x4390e0?.() === !![]) {
      _0x340988(busyRetryMs);
      return;
    }
    if (
      _0x1d594a &&
      _0x1d594a['didTimeout'] !== !![] &&
      typeof _0x1d594a['timeRemaining'] === 'function' &&
      _0x1d594a['timeRemaining']() < Math['max'](0x0, Number(minIdleBudgetMs) || 0x0)
    ) {
      _0x340988(fallbackDelayMs);
      return;
    }
    let _0xc2326c = null;
    while (_0x423a49['size'] > 0x0 && !_0xc2326c) {
      const _0x30cf44 = _0x423a49['entries']()['next']()['value'];
      if (!_0x30cf44) break;
      const [_0x1af75e, _0x3717bc] = _0x30cf44;
      _0x423a49['delete'](_0x1af75e);
      if (_0x3717bc['isValid']?.() === ![]) continue;
      _0xc2326c = _0x3717bc;
    }
    if (!_0xc2326c) {
      if (_0x423a49['size'] > 0x0) _0x340988();
      return;
    }
    let _0x1604d1 = null;
    const _0x55b467 = Number(now()) || 0x0;
    try {
      _0x1604d1 = _0xc2326c['prepare']();
    } catch (_0x4f387e) {
      _0x2080d1?.({ nodeId: _0xc2326c['nodeId'], error: _0x4f387e });
    }
    if (_0x1604d1) {
      const _0x5a8c6b = { ..._0xc2326c, runtime: _0x1604d1 };
      _0xc2326c['isValid']?.() === ![]
        ? _0x1707da(_0x5a8c6b)
        : (_0x4fc76f(),
          _0x24caa5['set'](_0xc2326c['nodeId'], _0x5a8c6b),
          _0x87556f?.({
            nodeId: _0xc2326c['nodeId'],
            durationMs: Math['max'](0x0, (Number(now()) || 0x0) - _0x55b467),
          }));
    }
    if (_0x423a49['size'] > 0x0) _0x340988();
  }
  function _0x68809a(_0x173e7b) {
    const _0x376183 = normalizeTask(_0x173e7b);
    if (!_0x376183 || _0x376183['isValid']?.() === ![]) return ![];
    const _0x16a65e = _0x24caa5['get'](_0x376183['nodeId']);
    if (
      _0x16a65e &&
      isSameTaskVersion(_0x16a65e, _0x376183['version'], _0x376183['variant']) &&
      _0x16a65e['isValid']?.() !== ![]
    )
      return !![];
    if (_0x16a65e) _0x3282dc(_0x376183['nodeId']);
    const _0x4d254f = _0x423a49['get'](_0x376183['nodeId']);
    if (
      _0x4d254f &&
      isSameTaskVersion(_0x4d254f, _0x376183['version'], _0x376183['variant']) &&
      _0x4d254f['isValid']?.() !== ![]
    )
      return !![];
    if (!_0x4d254f && _0x423a49['size'] >= _0x2b4a13) return ![];
    return (_0x423a49['set'](_0x376183['nodeId'], _0x376183), _0x340988(), !![]);
  }
  function _0x205c2a(_0x102cfb, _0x4ce5ca, _0x521ee3 = '') {
    const _0x5e38ed = String(_0x102cfb || '')['trim'](),
      _0x1e5a69 = _0x24caa5['get'](_0x5e38ed);
    if (!_0x1e5a69) return ![];
    if (!isSameTaskVersion(_0x1e5a69, _0x4ce5ca, _0x521ee3) || _0x1e5a69['isValid']?.() === ![])
      return (_0x3282dc(_0x5e38ed), ![]);
    return !![];
  }
  function _0xf11a1f(_0x2d69f6, _0x3095d3, _0x55609a = '') {
    const _0x58d787 = String(_0x2d69f6 || '')['trim']();
    if (!_0x205c2a(_0x58d787, _0x3095d3, _0x55609a)) return null;
    const _0x5df8b2 = _0x24caa5['get'](_0x58d787);
    return (_0x24caa5['delete'](_0x58d787), _0x5df8b2?.['runtime'] || null);
  }
  function _0x3d0e5a(_0x3edc02) {
    const _0x13b98f = _0x3edc02 instanceof Set ? _0x3edc02 : new Set(_0x3edc02 || []);
    for (const _0x3ffe55 of _0x423a49['keys']()) {
      if (!_0x13b98f['has'](_0x3ffe55)) _0x423a49['delete'](_0x3ffe55);
    }
    for (const _0x3445ef of _0x24caa5['keys']()) {
      if (!_0x13b98f['has'](_0x3445ef)) _0x3282dc(_0x3445ef);
    }
    if (_0x423a49['size'] === 0x0) _0x2b3451();
  }
  function _0x11cb4f() {
    ((_0x49665b = !![]), _0x2b3451());
  }
  function _0x44fc11() {
    ((_0x49665b = ![]), _0x340988());
  }
  function _0x71a23c() {
    (_0x2b3451(), _0x423a49['clear']());
    for (const _0x4dff5d of _0x24caa5['values']()) _0x1707da(_0x4dff5d);
    (_0x24caa5['clear'](), (_0x49665b = ![]));
  }
  return {
    clear: _0x71a23c,
    enqueue: _0x68809a,
    flush: _0x520b34,
    forget: _0xd6fa7a,
    hasPrepared: _0x205c2a,
    pause: _0x11cb4f,
    prune: _0x3d0e5a,
    resume: _0x44fc11,
    take: _0xf11a1f,
    getStats: () => ({
      queued: _0x423a49['size'],
      physicalQueued: _0x423a49['size'],
      prepared: _0x24caa5['size'],
      paused: _0x49665b,
    }),
  };
}
