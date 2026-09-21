import { queryRendererSpatialIndexIds, screenViewportToWorldBounds } from './rendererSpatialIndex.js';
export const RENDERER_VIRTUALIZATION_CONFIG = Object.freeze({
  mountPadding: 0x258,
  parkPadding: 0x384,
  denseLowZoomMountPadding: 0x1a4,
  denseLowZoomParkPadding: 0x28a,
  veryDenseLowZoomMountPadding: 0x140,
  veryDenseLowZoomParkPadding: 0x208,
  denseLowZoomThreshold: 0.45,
  veryDenseLowZoomThreshold: 0.32,
  denseNodeCount: 80,
  veryDenseNodeCount: 120,
  settleDelayMs: 120,
  parkAfterInteractionDelayMs: 0x708,
  batchSize: 12,
  structuralFrameBudgetMs: 8,
  denseStructuralReconcileDelayMs: 0x2d0,
  veryDenseStructuralReconcileDelayMs: 0x640,
  recentPinMs: 0x7d0,
});
export function createRendererStructuralBudget({
  batchSize: batchSize = RENDERER_VIRTUALIZATION_CONFIG.batchSize,
  frameBudgetMs: frameBudgetMs = RENDERER_VIRTUALIZATION_CONFIG.structuralFrameBudgetMs,
  now: now = () =>
    typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : 0,
} = {}) {
  let _0x5f2dc9 = batchSize,
    _0x3fec73 = 0;
  const _0x52fd4e = now();
  return {
    hasBudget() {
      return _0x5f2dc9 > 0 && (_0x3fec73 <= 0 || !_0x52fd4e || now() - _0x52fd4e < frameBudgetMs);
    },
    consume() {
      ((_0x5f2dc9 -= 1), (_0x3fec73 += 1));
    },
  };
}
export function getRendererStructuralReconcileDelayMs(_0x34b3f5) {
  const _0x5643d7 = Number(_0x34b3f5);
  if (!Number.isFinite(_0x5643d7)) return 0;
  if (_0x5643d7 >= RENDERER_VIRTUALIZATION_CONFIG.veryDenseNodeCount)
    return RENDERER_VIRTUALIZATION_CONFIG.veryDenseStructuralReconcileDelayMs;
  if (_0x5643d7 >= RENDERER_VIRTUALIZATION_CONFIG.denseNodeCount)
    return RENDERER_VIRTUALIZATION_CONFIG.denseStructuralReconcileDelayMs;
  return 0;
}
function addNodeAndChildren(_0x1e9851, _0x46647d, _0xff3b36) {
  if (!_0x46647d || _0x1e9851.has(_0x46647d)) return;
  const _0x2c097f = [_0x46647d];
  for (let _0x468c55 = 0; _0x468c55 < _0x2c097f.length; _0x468c55 += 1) {
    const _0x3c260c = _0x2c097f[_0x468c55];
    if (!_0x3c260c || _0x1e9851.has(_0x3c260c)) continue;
    _0x1e9851.add(_0x3c260c);
    const _0x2e75ea = _0xff3b36?.[_0x3c260c];
    if (!_0x2e75ea) continue;
    const _0x5ed5b9 =
      _0x2e75ea instanceof Set
        ? _0x2e75ea
        : Array.isArray(_0x2e75ea)
          ? _0x2e75ea
          : typeof _0x2e75ea[Symbol.iterator] === 'function'
            ? _0x2e75ea
            : [];
    for (const _0x34a7c2 of _0x5ed5b9) {
      if (!_0x1e9851.has(_0x34a7c2)) _0x2c097f.push(_0x34a7c2);
    }
  }
}
function isWebPreviewNode(_0x3253a2 = {}) {
  return (
    String(_0x3253a2?.type || '')
      .trim()
      .toLowerCase() === 'web-preview'
  );
}
function collectViewportWebPreviewNodeIds({
  nodes: _0x3384ea,
  spatialIndex: _0x44d1e2,
  viewport: _0x3d7404,
  containerWidth: _0x1b2df0,
  containerHeight: _0x124f72,
  padding: _0x3dddc4,
} = {}) {
  const _0x1fbf87 = new Set();
  if (!_0x3384ea || !_0x3d7404) return _0x1fbf87;
  if (_0x44d1e2) {
    const _0x3a5bd5 = screenViewportToWorldBounds({
      viewport: _0x3d7404,
      containerWidth: _0x1b2df0,
      containerHeight: _0x124f72,
      padding: _0x3dddc4,
    });
    for (const _0x5ce0d7 of queryRendererSpatialIndexIds(_0x44d1e2, _0x3a5bd5)) {
      if (isWebPreviewNode(_0x3384ea?.[_0x5ce0d7])) _0x1fbf87.add(_0x5ce0d7);
    }
    return _0x1fbf87;
  }
  for (const _0x4fbd69 of Object.values(_0x3384ea || {})) {
    if (!_0x4fbd69?.id || !isWebPreviewNode(_0x4fbd69)) continue;
    isNodeInsideViewportPadding(_0x4fbd69, _0x3d7404, _0x1b2df0, _0x124f72, _0x3dddc4) &&
      _0x1fbf87.add(_0x4fbd69.id);
  }
  return _0x1fbf87;
}
export function isNodeInsideViewportPadding(
  _0x135dcf,
  _0x2e234b,
  _0x406e1e,
  _0x584e33,
  _0x17db53 = 0,
  _0x9a25f3 = 0,
  _0x5be1c4 = 0,
) {
  if (!_0x135dcf || !_0x2e234b) return false;
  const _0x281157 = Number.isFinite(_0x2e234b.zoom) ? _0x2e234b.zoom : 1,
    _0x2dcb71 = Number.isFinite(_0x135dcf.x) ? _0x135dcf.x : 0,
    _0x54e5e2 = Number.isFinite(_0x135dcf.y) ? _0x135dcf.y : 0,
    _0x37d557 = Number.isFinite(_0x135dcf.width) ? _0x135dcf.width : 0,
    _0x27a176 = Number.isFinite(_0x135dcf.height) ? _0x135dcf.height : 0,
    _0x144587 = Number.isFinite(_0x9a25f3) ? _0x9a25f3 : 0,
    _0xb008a4 = Number.isFinite(_0x5be1c4) ? _0x5be1c4 : 0,
    _0x9df1bd = (_0x2dcb71 + _0x144587) * _0x281157 + (Number.isFinite(_0x2e234b.x) ? _0x2e234b.x : 0),
    _0xb53a47 = (_0x54e5e2 + _0xb008a4) * _0x281157 + (Number.isFinite(_0x2e234b.y) ? _0x2e234b.y : 0),
    _0x1be91e = _0x37d557 * _0x281157,
    _0x292227 = _0x27a176 * _0x281157;
  return (
    _0x9df1bd + _0x1be91e > -_0x17db53 &&
    _0x9df1bd < _0x406e1e + _0x17db53 &&
    _0xb53a47 + _0x292227 > -_0x17db53 &&
    _0xb53a47 < _0x584e33 + _0x17db53
  );
}
export function collectVirtualKeepAliveNodeIds({
  selectedNodeIds: _0x326b1a,
  connOverlay: _0x6b7220,
  pickConnectMode: _0x3e7b4b,
  dragContext: _0xda643f,
  parentToChildren: _0xc3b440,
  pinnedNodeIds: _0x19d9ac,
} = {}) {
  const _0x527615 = new Set(),
    _0x5094cc = _0x326b1a instanceof Set ? Array.from(_0x326b1a) : Array.isArray(_0x326b1a) ? _0x326b1a : [];
  _0x5094cc.forEach((_0x44eb7e) => addNodeAndChildren(_0x527615, _0x44eb7e, _0xc3b440));
  if (_0xda643f?.isDragging && _0xda643f?.targetNodeId) {
    const _0x125054 = _0x5094cc.includes(_0xda643f.targetNodeId) ? _0x5094cc : [_0xda643f.targetNodeId];
    _0x125054.forEach((_0x34a9fb) => addNodeAndChildren(_0x527615, _0x34a9fb, _0xc3b440));
  }
  _0x6b7220?.srcId && _0x527615.add(_0x6b7220.srcId);
  _0x6b7220?.hoverId && _0x527615.add(_0x6b7220.hoverId);
  _0x3e7b4b?.sourceNodeId && _0x527615.add(_0x3e7b4b.sourceNodeId);
  _0x3e7b4b?.hoverNodeId && _0x527615.add(_0x3e7b4b.hoverNodeId);
  const _0x514c84 = _0x19d9ac instanceof Set ? _0x19d9ac : Array.isArray(_0x19d9ac) ? _0x19d9ac : [];
  for (const _0x9fe262 of _0x514c84) {
    _0x527615.add(_0x9fe262);
  }
  return _0x527615;
}
export function resolveRendererVirtualizationPadding({
  viewport: _0x125541,
  nodeCount: nodeCount = 0,
  mountPadding: mountPadding = RENDERER_VIRTUALIZATION_CONFIG.mountPadding,
  parkPadding: parkPadding = RENDERER_VIRTUALIZATION_CONFIG.parkPadding,
} = {}) {
  const _0x3bedbe = Number.isFinite(_0x125541?.zoom) ? _0x125541.zoom : 1,
    _0x52758a = Number.isFinite(nodeCount) ? nodeCount : 0;
  if (
    _0x3bedbe <= RENDERER_VIRTUALIZATION_CONFIG.veryDenseLowZoomThreshold &&
    _0x52758a >= RENDERER_VIRTUALIZATION_CONFIG.veryDenseNodeCount
  )
    return {
      mountPadding: RENDERER_VIRTUALIZATION_CONFIG.veryDenseLowZoomMountPadding,
      parkPadding: RENDERER_VIRTUALIZATION_CONFIG.veryDenseLowZoomParkPadding,
    };
  if (
    _0x3bedbe <= RENDERER_VIRTUALIZATION_CONFIG.denseLowZoomThreshold &&
    _0x52758a >= RENDERER_VIRTUALIZATION_CONFIG.denseNodeCount
  )
    return {
      mountPadding: RENDERER_VIRTUALIZATION_CONFIG.denseLowZoomMountPadding,
      parkPadding: RENDERER_VIRTUALIZATION_CONFIG.denseLowZoomParkPadding,
    };
  return { mountPadding: mountPadding, parkPadding: parkPadding };
}
export function buildVirtualizationCandidateSets({
  nodes: _0x9b97c0,
  spatialIndex: spatialIndex = null,
  viewport: _0x5d5ba9,
  containerWidth: _0x49636f,
  containerHeight: _0x3ca48a,
  selectedNodeIds: _0x365712,
  connOverlay: _0x124d0b,
  pickConnectMode: _0x47ed53,
  dragContext: _0x37da6b,
  parentToChildren: _0x113c0a,
  pinnedNodeIds: _0x101d15,
  mountedNodeIds: _0x79017f,
  mountPadding: mountPadding = RENDERER_VIRTUALIZATION_CONFIG.mountPadding,
  parkPadding: parkPadding = RENDERER_VIRTUALIZATION_CONFIG.parkPadding,
} = {}) {
  const _0x35d198 = spatialIndex ? null : Object.values(_0x9b97c0 || {}),
    _0x40a3e1 = spatialIndex?.nodeCount ?? _0x35d198.length,
    _0x53c155 = resolveRendererVirtualizationPadding({
      viewport: _0x5d5ba9,
      nodeCount: _0x40a3e1,
      mountPadding: mountPadding,
      parkPadding: parkPadding,
    }),
    _0x3c7a50 = collectVirtualKeepAliveNodeIds({
      selectedNodeIds: _0x365712,
      connOverlay: _0x124d0b,
      pickConnectMode: _0x47ed53,
      dragContext: _0x37da6b,
      parentToChildren: _0x113c0a,
      pinnedNodeIds: _0x101d15,
    });
  for (const _0x31c1fc of collectViewportWebPreviewNodeIds({
    nodes: _0x9b97c0,
    spatialIndex: spatialIndex,
    viewport: _0x5d5ba9,
    containerWidth: _0x49636f,
    containerHeight: _0x3ca48a,
    padding: _0x53c155.parkPadding,
  })) {
    _0x3c7a50.add(_0x31c1fc);
  }
  const _0x42a957 = new Set(),
    _0xca7f15 = new Set();
  if (spatialIndex) {
    const _0x6f23d2 = screenViewportToWorldBounds({
        viewport: _0x5d5ba9,
        containerWidth: _0x49636f,
        containerHeight: _0x3ca48a,
        padding: _0x53c155.mountPadding,
      }),
      _0x4c61fa = screenViewportToWorldBounds({
        viewport: _0x5d5ba9,
        containerWidth: _0x49636f,
        containerHeight: _0x3ca48a,
        padding: _0x53c155.parkPadding,
      }),
      _0xbe4f30 = queryRendererSpatialIndexIds(spatialIndex, _0x6f23d2),
      _0x28fecd = queryRendererSpatialIndexIds(spatialIndex, _0x4c61fa);
    for (const _0x46277e of _0x3c7a50) {
      _0x42a957.add(_0x46277e);
    }
    for (const _0x20ae3a of _0xbe4f30) {
      _0x42a957.add(_0x20ae3a);
    }
    const _0x52b06a =
      _0x79017f instanceof Set
        ? _0x79017f
        : Array.isArray(_0x79017f)
          ? _0x79017f
          : spatialIndex.nodeIds || [];
    for (const _0x17ab83 of _0x52b06a) {
      if (!_0x17ab83 || _0x3c7a50.has(_0x17ab83)) continue;
      if (!_0x28fecd.has(_0x17ab83)) _0xca7f15.add(_0x17ab83);
    }
    return { keepAliveNodeIds: _0x3c7a50, mountCandidateIds: _0x42a957, parkCandidateIds: _0xca7f15 };
  }
  for (const _0x13f573 of _0x35d198) {
    if (!_0x13f573?.id) continue;
    const _0x1b00f9 = _0x13f573.id;
    if (_0x3c7a50.has(_0x1b00f9)) {
      _0x42a957.add(_0x1b00f9);
      continue;
    }
    const _0x5c0e0b = isNodeInsideViewportPadding(
      _0x13f573,
      _0x5d5ba9,
      _0x49636f,
      _0x3ca48a,
      _0x53c155.mountPadding,
    );
    if (_0x5c0e0b) {
      _0x42a957.add(_0x1b00f9);
      continue;
    }
    const _0x1073fd = isNodeInsideViewportPadding(
      _0x13f573,
      _0x5d5ba9,
      _0x49636f,
      _0x3ca48a,
      _0x53c155.parkPadding,
    );
    !_0x1073fd && _0xca7f15.add(_0x1b00f9);
  }
  return { keepAliveNodeIds: _0x3c7a50, mountCandidateIds: _0x42a957, parkCandidateIds: _0xca7f15 };
}
