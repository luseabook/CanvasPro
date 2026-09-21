export const RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG = '__rendererDeferMediaOnMount';
export function shouldDeferRendererMediaOnMount(_0x59bda8 = {}) {
  return _0x59bda8?.[RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG] === true;
}
export function withRendererDeferredMediaHint(_0x560257 = {}, _0x5d968b = false) {
  if (!_0x5d968b) return _0x560257;
  return { ...(_0x560257 || {}), [RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG]: true };
}
const DEFAULT_MEDIA_HYDRATION_BATCH_SIZE = 6,
  DEFAULT_MEDIA_HYDRATION_RETRY_MS = 120,
  DEFAULT_MEDIA_HYDRATION_FALLBACK_MS = 24,
  DEFAULT_MEDIA_HYDRATION_IDLE_TIMEOUT_MS = 180;
function getWindowLike() {
  return typeof window !== 'undefined' ? window : globalThis;
}
export function createRendererDeferredMediaController({
  getComponent: _0x84fadf,
  isInteractionBusy: _0x1da791,
  onHydrateMedia: _0x553660,
  batchSize: batchSize = DEFAULT_MEDIA_HYDRATION_BATCH_SIZE,
} = {}) {
  let _0x13e325 = [],
    _0x33b600 = new Set(),
    _0x1f37aa = null,
    _0x5be506 = '';
  const _0x157fff = Math.max(1, Math.trunc(Number(batchSize) || 1));
  function _0x2317bc() {
    if (_0x1f37aa === null) return;
    const _0x35d6bf = getWindowLike();
    if (_0x5be506 === 'idle' && typeof _0x35d6bf.cancelIdleCallback === 'function')
      _0x35d6bf.cancelIdleCallback(_0x1f37aa);
    else _0x5be506 === 'timeout' && clearTimeout(_0x1f37aa);
    ((_0x1f37aa = null), (_0x5be506 = ''));
  }
  function _0x2b0a9a(_0x1d8ccc = DEFAULT_MEDIA_HYDRATION_FALLBACK_MS) {
    if (_0x1f37aa !== null || _0x13e325.length === 0) return;
    const _0x423ed2 = getWindowLike();
    if (_0x1da791?.()) {
      ((_0x5be506 = 'timeout'), (_0x1f37aa = setTimeout(_0xff8e07, DEFAULT_MEDIA_HYDRATION_RETRY_MS)));
      return;
    }
    if (_0x13e325.length >= _0x157fff * 4) {
      ((_0x5be506 = 'timeout'), (_0x1f37aa = setTimeout(_0xff8e07, Math.max(0, Number(_0x1d8ccc) || 0))));
      return;
    }
    if (typeof _0x423ed2.requestIdleCallback === 'function') {
      ((_0x5be506 = 'idle'),
        (_0x1f37aa = _0x423ed2.requestIdleCallback(_0xff8e07, {
          timeout: DEFAULT_MEDIA_HYDRATION_IDLE_TIMEOUT_MS,
        })));
      return;
    }
    ((_0x5be506 = 'timeout'), (_0x1f37aa = setTimeout(_0xff8e07, Math.max(0, Number(_0x1d8ccc) || 0))));
  }
  function _0x568dcf(_0x2211da) {
    (_0x33b600.delete(_0x2211da), _0x84fadf?.(_0x2211da)?.hydrateDeferredMedia?.(), _0x553660?.(_0x2211da));
  }
  function _0xff8e07(_0xfb2d2b = null) {
    ((_0x1f37aa = null), (_0x5be506 = ''));
    if (_0x13e325.length === 0) return;
    if (_0x1da791?.()) {
      _0x2b0a9a(DEFAULT_MEDIA_HYDRATION_RETRY_MS);
      return;
    }
    const _0x50565a = () => {
      if (!_0xfb2d2b || _0xfb2d2b.didTimeout) return true;
      if (typeof _0xfb2d2b.timeRemaining !== 'function') return true;
      return _0xfb2d2b.timeRemaining() > 3;
    };
    let _0xbe927 = 0;
    while (_0x13e325.length > 0 && _0xbe927 < _0x157fff && _0x50565a()) {
      const _0xc5b088 = _0x13e325.shift();
      if (!_0x33b600.has(_0xc5b088)) continue;
      (_0x568dcf(_0xc5b088), (_0xbe927 += 1));
    }
    if (_0x13e325.length > 0) _0x2b0a9a();
  }
  function _0x50fa38(_0x33ea83) {
    if (!_0x33ea83 || _0x33b600.has(_0x33ea83)) return;
    (_0x33b600.add(_0x33ea83), _0x13e325.push(_0x33ea83), _0x2b0a9a());
  }
  function _0x305dbd(_0x4cdc3f) {
    if (!_0x4cdc3f) return;
    _0x33b600.delete(_0x4cdc3f);
  }
  function _0x22f4de() {
    (_0x2317bc(), (_0x13e325 = []), (_0x33b600 = new Set()));
  }
  return {
    clear: _0x22f4de,
    enqueue: _0x50fa38,
    flush: _0xff8e07,
    forget: _0x305dbd,
    resume: _0x2b0a9a,
    getQueuedCount: () => _0x33b600.size,
  };
}
