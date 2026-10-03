import { isNodeType } from '../modules/registry.js';
export const NODE_DETAIL_DEFERRED_CLASS = 'v2-node-detail-deferred';
const NODE_DETAIL_LOW_ZOOM_THRESHOLD = 0.45,
  NODE_DETAIL_DEFERRED_STAGE = 'deferred',
  NODE_DETAIL_HYDRATED_STAGE = 'hydrated',
  NODE_DETAIL_HYDRATION_BATCH_SIZE = 24,
  NODE_DETAIL_DEFER_VISIBLE_COUNT = 48,
  NODE_DETAIL_HYDRATION_BUSY_RETRY_MS = 120,
  NODE_DETAIL_HYDRATION_FALLBACK_MS = 24,
  NODE_DETAIL_HYDRATION_IDLE_TIMEOUT_MS = 120;
export function createNodeDetailHydrationController({
  getWrapper: _0x42afdb,
  getParkedWrapper: _0xd860e1,
  getWrappers: _0x589c70,
  getParkedWrappers: _0x52d3fc,
  isMounted: _0x2827ed,
  isInteractionBusy: _0x32804f,
  onHydrateNodeDetails: _0x31f84d,
} = {}) {
  let _0x332a4d = [],
    _0x15dc6f = new Set(),
    _0x3414de = null,
    _0x463457 = '',
    _0x4bc7d2 = false;
  function _0x305474() {
    if (_0x3414de === null) return;
    if (_0x463457 === 'idle' && typeof cancelIdleCallback === 'function') cancelIdleCallback(_0x3414de);
    else _0x463457 === 'timeout' && clearTimeout(_0x3414de);
    ((_0x3414de = null), (_0x463457 = ''));
  }
  function _0x16e45a(_0x271034, _0x2b1d3a = _0x42afdb?.(_0x271034)) {
    if (!_0x271034 || !_0x2b1d3a) return;
    const _0x475078 =
      _0x2b1d3a.classList.contains(NODE_DETAIL_DEFERRED_CLASS) ||
      _0x2b1d3a.dataset?.detailStage === NODE_DETAIL_DEFERRED_STAGE;
    if (!_0x475078 && _0x2b1d3a.dataset?.detailStage === NODE_DETAIL_HYDRATED_STAGE) return;
    (_0x15dc6f.delete(_0x271034), _0x2b1d3a.classList.remove(NODE_DETAIL_DEFERRED_CLASS));
    if (_0x2b1d3a.dataset) _0x2b1d3a.dataset.detailStage = NODE_DETAIL_HYDRATED_STAGE;
    _0x31f84d?.(_0x271034, _0x2b1d3a);
  }
  function _0x1d96f7() {
    if (_0x4bc7d2 || _0x3414de !== null) return;
    if (_0x32804f?.()) {
      ((_0x463457 = 'timeout'),
        (_0x3414de = setTimeout(() => _0x160f0a(), NODE_DETAIL_HYDRATION_BUSY_RETRY_MS)));
      return;
    }
    if (_0x332a4d.length >= NODE_DETAIL_HYDRATION_BATCH_SIZE * 3) {
      ((_0x463457 = 'timeout'),
        (_0x3414de = setTimeout(() => _0x160f0a(), NODE_DETAIL_HYDRATION_FALLBACK_MS)));
      return;
    }
    if (typeof requestIdleCallback === 'function') {
      ((_0x463457 = 'idle'),
        (_0x3414de = requestIdleCallback(_0x160f0a, { timeout: NODE_DETAIL_HYDRATION_IDLE_TIMEOUT_MS })));
      return;
    }
    ((_0x463457 = 'timeout'), (_0x3414de = setTimeout(() => _0x160f0a(), NODE_DETAIL_HYDRATION_FALLBACK_MS)));
  }
  function _0x160f0a(_0x5d3dde = null) {
    ((_0x3414de = null), (_0x463457 = ''));
    if (_0x4bc7d2) return;
    if (_0x32804f?.()) {
      _0x1d96f7();
      return;
    }
    let _0x43115c = 0;
    const _0x4b588b = () => {
      if (!_0x5d3dde || _0x5d3dde.didTimeout) return true;
      if (typeof _0x5d3dde.timeRemaining !== 'function') return true;
      return _0x5d3dde.timeRemaining() > 2;
    };
    while (_0x332a4d.length > 0 && _0x43115c < NODE_DETAIL_HYDRATION_BATCH_SIZE && _0x4b588b()) {
      const _0x21ed32 = _0x332a4d.shift();
      if (!_0x15dc6f.delete(_0x21ed32)) continue;
      const _0x2c623b = _0x42afdb?.(_0x21ed32);
      if (!_0x2c623b || !_0x2827ed?.(_0x21ed32) || !_0x2c623b.isConnected) continue;
      (_0x16e45a(_0x21ed32, _0x2c623b), (_0x43115c += 1));
    }
    if (_0x332a4d.length > 0) _0x1d96f7();
  }
  function _0x399396(_0x937cb) {
    if (!_0x937cb || _0x15dc6f.has(_0x937cb)) return;
    (_0x15dc6f.add(_0x937cb), _0x332a4d.push(_0x937cb), _0x1d96f7());
  }
  function _0x59a1de() {
    ((_0x4bc7d2 = true), _0x305474());
  }
  function _0x1f55a3() {
    _0x4bc7d2 = false;
    if (_0x332a4d.length === 0) return;
    _0x1d96f7();
  }
  function _0xa44d48(_0x53f158, _0x26458e, { autoHydrate: autoHydrate = true } = {}) {
    if (!_0x53f158 || !_0x26458e) return;
    _0x53f158.classList.add(NODE_DETAIL_DEFERRED_CLASS);
    if (_0x53f158.dataset) _0x53f158.dataset.detailStage = NODE_DETAIL_DEFERRED_STAGE;
    if (autoHydrate) _0x399396(_0x26458e);
    else _0x15dc6f.delete(_0x26458e);
  }
  function _0x4a54c4(_0x292cd3, { removeClass: removeClass = true } = {}) {
    if (!_0x292cd3) return;
    _0x15dc6f.delete(_0x292cd3);
    const _0x3ddca3 = _0x42afdb?.(_0x292cd3) || _0xd860e1?.(_0x292cd3);
    removeClass &&
      _0x3ddca3 &&
      (_0x3ddca3.classList.remove(NODE_DETAIL_DEFERRED_CLASS),
      _0x3ddca3.dataset && _0x3ddca3.dataset.detailStage && delete _0x3ddca3.dataset.detailStage);
  }
  function _0x166318() {
    (_0x305474(), (_0x332a4d = []), (_0x15dc6f = new Set()));
    for (const _0x4a6ccb of _0x589c70?.() || []) {
      (_0x4a6ccb?.classList?.remove?.(NODE_DETAIL_DEFERRED_CLASS),
        _0x4a6ccb?.dataset && _0x4a6ccb.dataset.detailStage && delete _0x4a6ccb.dataset.detailStage);
    }
    for (const _0x1fc126 of _0x52d3fc?.() || []) {
      (_0x1fc126?.classList?.remove?.(NODE_DETAIL_DEFERRED_CLASS),
        _0x1fc126?.dataset && _0x1fc126.dataset.detailStage && delete _0x1fc126.dataset.detailStage);
    }
  }
  function _0x21fd84({
    node: _0x36658c,
    nodeId: _0x49887f,
    isSelected: _0x3e9929,
    connOverlay: _0x366cb5,
    pickMode: _0x407811,
    relatedNodeIds: _0x51c5a6,
  } = {}) {
    if (_0x3e9929) return true;
    if (_0x51c5a6?.has?.(_0x49887f)) return true;
    if (_0x366cb5?.srcId === _0x49887f || _0x366cb5?.hoverId === _0x49887f) return true;
    if (_0x407811?.sourceNodeId === _0x49887f || _0x407811?.hoverNodeId === _0x49887f) return true;
    return !!(_0x36658c?.isImagesExpanded || _0x36658c?.isVideosExpanded);
  }
  function _0x4ca8df({
    node: _0xae873d,
    nodeId: _0x308dee,
    isSelected: _0x2936fa,
    connOverlay: _0x1be309,
    pickMode: _0x4f6f6f,
    relatedNodeIds: _0x41632a,
    viewport: _0x5b22cd,
    mountCandidateCount: _0x4f6040,
  } = {}) {
    if (!_0xae873d?.id) return false;
    if (isNodeType(_0xae873d, ['group', 'comment-note', 'web-preview'])) return false;
    if (
      _0x21fd84({
        node: _0xae873d,
        nodeId: _0x308dee,
        isSelected: _0x2936fa,
        connOverlay: _0x1be309,
        pickMode: _0x4f6f6f,
        relatedNodeIds: _0x41632a,
      })
    )
      return false;
    const _0x149de9 = Number.isFinite(_0x5b22cd?.zoom) ? _0x5b22cd.zoom : 1;
    return (
      _0x149de9 <= NODE_DETAIL_LOW_ZOOM_THRESHOLD || Number(_0x4f6040 || 0) >= NODE_DETAIL_DEFER_VISIBLE_COUNT
    );
  }
  function _0x5182db({
    wrapperEl: _0xa42e6a,
    node: _0x20bd59,
    nodeId: _0x520483,
    isSelected: _0x4024cd,
    connOverlay: _0xa0dec7,
    pickMode: _0x194244,
    relatedNodeIds: _0x28e87d,
    viewport: _0x1e5fcf,
    mountCandidateCount: _0x5793eb,
    autoHydrate: autoHydrate = true,
  } = {}) {
    if (!_0xa42e6a || !_0x520483) return;
    _0x4ca8df({
      node: _0x20bd59,
      nodeId: _0x520483,
      isSelected: _0x4024cd,
      connOverlay: _0xa0dec7,
      pickMode: _0x194244,
      relatedNodeIds: _0x28e87d,
      viewport: _0x1e5fcf,
      mountCandidateCount: _0x5793eb,
    })
      ? _0xa44d48(_0xa42e6a, _0x520483, { autoHydrate: autoHydrate })
      : _0x16e45a(_0x520483, _0xa42e6a);
  }
  return {
    clearNodeDetailHydrationState: _0x166318,
    forgetNodeDetailHydration: _0x4a54c4,
    hydrateNodeDetails: _0x16e45a,
    isNodeDetailActive: _0x21fd84,
    pause: _0x59a1de,
    resumeNodeDetailHydration: _0x1f55a3,
    shouldDeferNodeDetails: _0x4ca8df,
    syncNodeDetailMountStage: _0x5182db,
  };
}
