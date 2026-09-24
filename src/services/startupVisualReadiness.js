const STARTUP_LOADER_ID = 'v2-initial-loader',
  STARTUP_VISUAL_FALLBACK_POLL_MS = 0x64;
function readLoaderPresentation(_0x2d4ee5, _0x382396) {
  if (typeof _0x382396?.['getComputedStyle'] === 'function')
    try {
      return _0x382396['getComputedStyle'](_0x2d4ee5);
    } catch {}
  return _0x2d4ee5?.['style'] || null;
}
export function isStartupVisualComplete({
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const _0x38a4b0 = documentObject?.['getElementById']?.(STARTUP_LOADER_ID);
  if (!_0x38a4b0 || _0x38a4b0['isConnected'] === ![] || _0x38a4b0['hidden'] === !![]) return !![];
  const _0x2bb5b8 = readLoaderPresentation(_0x38a4b0, windowObject);
  if (!_0x2bb5b8) return ![];
  const _0xc8d464 = String(_0x2bb5b8['display'] || '')
      ['trim']()
      ['toLowerCase'](),
    _0x3dac3a = String(_0x2bb5b8['visibility'] || '')
      ['trim']()
      ['toLowerCase'](),
    _0x355b17 = Number['parseFloat'](String(_0x2bb5b8['opacity'] || '1'));
  return (
    _0xc8d464 === 'none' || _0x3dac3a === 'hidden' || (Number['isFinite'](_0x355b17) && _0x355b17 <= 0.001)
  );
}
export function waitForStartupVisualComplete({
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
} = {}) {
  if (isStartupVisualComplete({ documentObject: documentObject, windowObject: windowObject }))
    return Promise['resolve']();
  const _0x11f6e1 =
      typeof windowObject?.['setTimeout'] === 'function'
        ? windowObject['setTimeout']['bind'](windowObject)
        : globalThis['setTimeout'],
    _0x18ab37 =
      typeof windowObject?.['clearTimeout'] === 'function'
        ? windowObject['clearTimeout']['bind'](windowObject)
        : globalThis['clearTimeout'];
  return new Promise((_0x45953b) => {
    let _0x3dfb47 = ![],
      _0x2a03b5 = null,
      _0x3cdef5 = null;
    const _0x5687eb = documentObject?.['getElementById']?.(STARTUP_LOADER_ID),
      _0x31e61f = () => {
        if (_0x3dfb47) return;
        ((_0x3dfb47 = !![]),
          _0x2a03b5?.['disconnect']?.(),
          _0x5687eb?.['removeEventListener']?.('animationend', _0x402042),
          _0x5687eb?.['removeEventListener']?.('transitionend', _0x402042),
          _0x3cdef5 !== null && typeof _0x18ab37 === 'function' && _0x18ab37(_0x3cdef5),
          _0x45953b());
      },
      _0x402042 = () => {
        if (isStartupVisualComplete({ documentObject: documentObject, windowObject: windowObject }))
          return (_0x31e61f(), !![]);
        return ![];
      },
      _0x52eaf9 = () => {
        if (_0x3dfb47 || _0x402042()) return;
        typeof _0x11f6e1 === 'function' &&
          (_0x3cdef5 = _0x11f6e1(_0x52eaf9, STARTUP_VISUAL_FALLBACK_POLL_MS));
      },
      _0x1a84a8 = windowObject?.['MutationObserver'] || globalThis['MutationObserver'],
      _0x4e6eb1 =
        documentObject?.['documentElement'] || documentObject?.['getElementById']?.(STARTUP_LOADER_ID);
    typeof _0x1a84a8 === 'function' &&
      _0x4e6eb1 &&
      ((_0x2a03b5 = new _0x1a84a8(_0x402042)),
      _0x2a03b5['observe'](_0x4e6eb1, {
        attributes: !![],
        attributeFilter: ['class', 'hidden', 'style'],
        childList: !![],
        subtree: !![],
      }));
    (_0x5687eb?.['addEventListener']?.('animationend', _0x402042),
      _0x5687eb?.['addEventListener']?.('transitionend', _0x402042));
    if (_0x402042()) return;
    !_0x2a03b5 &&
      typeof _0x11f6e1 === 'function' &&
      (_0x3cdef5 = _0x11f6e1(_0x52eaf9, STARTUP_VISUAL_FALLBACK_POLL_MS));
  });
}
export function createLatestStartupVisualTaskQueue({
  isReady: isReady = () => isStartupVisualComplete(),
  waitUntilReady: waitUntilReady = () => waitForStartupVisualComplete(),
} = {}) {
  let _0x53ff32 = null,
    _0x346260 = null;
  const _0x18401d = () => {
    if (_0x346260) return;
    _0x346260 = Promise['resolve']()
      ['then'](() => waitUntilReady())
      ['catch'](() => {})
      ['then'](() => {
        _0x346260 = null;
        const _0x2db612 = _0x53ff32;
        ((_0x53ff32 = null), _0x2db612?.());
      });
  };
  return {
    clear() {
      _0x53ff32 = null;
    },
    defer(_0x3d8344) {
      if (typeof _0x3d8344 !== 'function' || isReady()) return ![];
      return ((_0x53ff32 = _0x3d8344), _0x18401d(), !![]);
    },
    hasPending() {
      return typeof _0x53ff32 === 'function';
    },
  };
}
