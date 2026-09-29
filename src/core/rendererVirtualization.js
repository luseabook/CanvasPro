import { queryRendererSpatialIndexIds, screenViewportToWorldBounds } from './rendererSpatialIndex.js';
export const RENDERER_VIRTUALIZATION_CONFIG = Object['freeze']({
  mountPadding: 0x258,
  parkPadding: 0x384,
  denseLowZoomMountPadding: 0x1a4,
  denseLowZoomParkPadding: 0x28a,
  denseLowZoomPreviewPadding: 0x4b0,
  veryDenseLowZoomMountPadding: 0x140,
  veryDenseLowZoomParkPadding: 0x208,
  veryDenseLowZoomPreviewPadding: 0x640,
  denseLowZoomThreshold: 0.45,
  veryDenseLowZoomThreshold: 0.33,
  denseLowZoomMaxMountCandidates: 0x24,
  veryDenseLowZoomMaxMountCandidates: 0x18,
  denseNodeCount: 0x50,
  veryDenseNodeCount: 0x78,
  settleDelayMs: 0x78,
  parkAfterInteractionDelayMs: 0x140,
  batchSize: 0xc,
  structuralFrameBudgetMs: 0x8,
  denseStructuralReconcileDelayMs: 0x2d0,
  veryDenseStructuralReconcileDelayMs: 0x640,
  lowZoomViewportCommitReconcileDelayMs: 0x2d0,
  dragCommitReconcileDelayMs: 0x1e0,
  recentPinMs: 0x7d0,
});
export function resolveRendererVirtualizationTier({ viewport: _0x2862ad, nodeCount: nodeCount = 0x0 } = {}) {
  const _0x241c97 = Number['isFinite'](Number(_0x2862ad?.['zoom'])) ? Number(_0x2862ad['zoom']) : 0x1,
    _0x58b17e = Number['isFinite'](Number(nodeCount)) ? Number(nodeCount) : 0x0;
  if (
    _0x241c97 <= RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomThreshold'] &&
    _0x58b17e >= RENDERER_VIRTUALIZATION_CONFIG['veryDenseNodeCount']
  )
    return 'very-dense-low-zoom';
  if (
    _0x241c97 <= RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomThreshold'] &&
    _0x58b17e >= RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount']
  )
    return 'dense-low-zoom';
  return 'default';
}
export function createRendererStructuralBudget({
  batchSize: batchSize = RENDERER_VIRTUALIZATION_CONFIG['batchSize'],
  frameBudgetMs: frameBudgetMs = RENDERER_VIRTUALIZATION_CONFIG['structuralFrameBudgetMs'],
  now: now = () =>
    typeof performance !== 'undefined' && typeof performance['now'] === 'function'
      ? performance['now']()
      : 0x0,
} = {}) {
  let _0x337675 = batchSize,
    _0x3f5ba9 = 0x0;
  const _0x59b50f = now();
  return {
    hasBudget() {
      return _0x337675 > 0x0 && (_0x3f5ba9 <= 0x0 || !_0x59b50f || now() - _0x59b50f < frameBudgetMs);
    },
    consume() {
      ((_0x337675 -= 0x1), (_0x3f5ba9 += 0x1));
    },
  };
}
export function getRendererStructuralReconcileDelayMs(_0xabbd12) {
  const _0x110910 = Number(_0xabbd12);
  if (!Number['isFinite'](_0x110910)) return 0x0;
  if (_0x110910 >= RENDERER_VIRTUALIZATION_CONFIG['veryDenseNodeCount'])
    return RENDERER_VIRTUALIZATION_CONFIG['veryDenseStructuralReconcileDelayMs'];
  if (_0x110910 >= RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount'])
    return RENDERER_VIRTUALIZATION_CONFIG['denseStructuralReconcileDelayMs'];
  return 0x0;
}
function addNodeAndChildren(_0x647c5, _0x1afa16, _0x23cf7e) {
  if (!_0x1afa16 || _0x647c5['has'](_0x1afa16)) return;
  const _0x112a8f = [_0x1afa16];
  for (let _0x55d321 = 0x0; _0x55d321 < _0x112a8f['length']; _0x55d321 += 0x1) {
    const _0x1b49b3 = _0x112a8f[_0x55d321];
    if (!_0x1b49b3 || _0x647c5['has'](_0x1b49b3)) continue;
    _0x647c5['add'](_0x1b49b3);
    const _0x37af70 = _0x23cf7e?.[_0x1b49b3];
    if (!_0x37af70) continue;
    const _0x35e124 =
      _0x37af70 instanceof Set
        ? _0x37af70
        : Array['isArray'](_0x37af70)
          ? _0x37af70
          : typeof _0x37af70[Symbol['iterator']] === 'function'
            ? _0x37af70
            : [];
    for (const _0x3370ae of _0x35e124) {
      if (!_0x647c5['has'](_0x3370ae)) _0x112a8f['push'](_0x3370ae);
    }
  }
}
function isWebPreviewNode(_0x3cb68c = {}) {
  return (
    String(_0x3cb68c?.['type'] || '')
      ['trim']()
      ['toLowerCase']() === 'web-preview'
  );
}
function isPreferredLowZoomMountNode(_0x425af8 = {}) {
  const _0x5c0c87 = String(_0x425af8?.['type'] || '')
    ['trim']()
    ['toLowerCase']();
  return _0x5c0c87 === 'comment-note' || _0x5c0c87 === 'group' || _0x5c0c87 === 'web-preview';
}
function isHeavyMediaNode(_0x6e8d0 = {}) {
  const _0x3d3feb = String(_0x6e8d0?.['type'] || '')
    ['trim']()
    ['toLowerCase']();
  return (
    _0x3d3feb === 'source-image' ||
    _0x3d3feb === 'ai-image' ||
    _0x3d3feb === 'source-video' ||
    _0x3d3feb === 'video' ||
    _0x3d3feb === 'ai-video' ||
    _0x3d3feb === 'source-audio' ||
    _0x3d3feb === 'audio' ||
    _0x3d3feb === 'ai-audio'
  );
}
function getViewportWorldCenter(_0x45f0f1, _0x39cde2, _0xe5f6d1) {
  const _0x91e900 = screenViewportToWorldBounds({
    viewport: _0x45f0f1,
    containerWidth: _0x39cde2,
    containerHeight: _0xe5f6d1,
    padding: 0x0,
  });
  return {
    x: (_0x91e900['minX'] + _0x91e900['maxX']) / 0x2,
    y: (_0x91e900['minY'] + _0x91e900['maxY']) / 0x2,
  };
}
function getNodeCenterDistanceSq(_0x32b4d3 = {}, _0x750ae = {}) {
  const _0x1a7292 = Number['isFinite'](Number(_0x32b4d3['x'])) ? Number(_0x32b4d3['x']) : 0x0,
    _0x25ac72 = Number['isFinite'](Number(_0x32b4d3['y'])) ? Number(_0x32b4d3['y']) : 0x0,
    _0x1d6b11 = Math['max'](0x1, Number(_0x32b4d3['width']) || 0xa0),
    _0x37db9c = Math['max'](0x1, Number(_0x32b4d3['height']) || 0x78),
    _0x20e23a = _0x1a7292 + _0x1d6b11 / 0x2 - _0x750ae['x'],
    _0x32cdfa = _0x25ac72 + _0x37db9c / 0x2 - _0x750ae['y'];
  return _0x20e23a * _0x20e23a + _0x32cdfa * _0x32cdfa;
}
function collectViewportWebPreviewNodeIds({
  nodes: _0x2c76b4,
  spatialIndex: _0x477d88,
  viewport: _0x231197,
  containerWidth: _0x21296a,
  containerHeight: _0x2ebfb4,
  padding: _0x4055a9,
} = {}) {
  const _0x5bdbc7 = new Set();
  if (!_0x2c76b4 || !_0x231197) return _0x5bdbc7;
  if (_0x477d88) {
    const _0x106f64 = screenViewportToWorldBounds({
      viewport: _0x231197,
      containerWidth: _0x21296a,
      containerHeight: _0x2ebfb4,
      padding: _0x4055a9,
    });
    for (const _0x376225 of queryRendererSpatialIndexIds(_0x477d88, _0x106f64)) {
      if (isWebPreviewNode(_0x2c76b4?.[_0x376225])) _0x5bdbc7['add'](_0x376225);
    }
    return _0x5bdbc7;
  }
  for (const _0x1f6491 of Object['values'](_0x2c76b4 || {})) {
    if (!_0x1f6491?.['id'] || !isWebPreviewNode(_0x1f6491)) continue;
    isNodeInsideViewportPadding(_0x1f6491, _0x231197, _0x21296a, _0x2ebfb4, _0x4055a9) &&
      _0x5bdbc7['add'](_0x1f6491['id']);
  }
  return _0x5bdbc7;
}
export function isNodeInsideViewportPadding(
  _0xc97000,
  _0x3732a7,
  _0x39e46b,
  _0xcb3138,
  _0x3153e6 = 0x0,
  _0x663fd7 = 0x0,
  _0x19c5a7 = 0x0,
) {
  if (!_0xc97000 || !_0x3732a7) return ![];
  const _0x29f3db = Number['isFinite'](_0x3732a7['zoom']) ? _0x3732a7['zoom'] : 0x1,
    _0x3252ac = Number['isFinite'](_0xc97000['x']) ? _0xc97000['x'] : 0x0,
    _0x23c720 = Number['isFinite'](_0xc97000['y']) ? _0xc97000['y'] : 0x0,
    _0x47335e = Number['isFinite'](_0xc97000['width']) ? _0xc97000['width'] : 0x0,
    _0x2beb6b = Number['isFinite'](_0xc97000['height']) ? _0xc97000['height'] : 0x0,
    _0x5b8e2a = Number['isFinite'](_0x663fd7) ? _0x663fd7 : 0x0,
    _0xae1ec5 = Number['isFinite'](_0x19c5a7) ? _0x19c5a7 : 0x0,
    _0x434172 =
      (_0x3252ac + _0x5b8e2a) * _0x29f3db + (Number['isFinite'](_0x3732a7['x']) ? _0x3732a7['x'] : 0x0),
    _0x2b8774 =
      (_0x23c720 + _0xae1ec5) * _0x29f3db + (Number['isFinite'](_0x3732a7['y']) ? _0x3732a7['y'] : 0x0),
    _0xf2db23 = _0x47335e * _0x29f3db,
    _0x19e651 = _0x2beb6b * _0x29f3db;
  return (
    _0x434172 + _0xf2db23 > -_0x3153e6 &&
    _0x434172 < _0x39e46b + _0x3153e6 &&
    _0x2b8774 + _0x19e651 > -_0x3153e6 &&
    _0x2b8774 < _0xcb3138 + _0x3153e6
  );
}
export function collectVirtualKeepAliveNodeIds({
  selectedNodeIds: _0x330d32,
  connOverlay: _0x5c58d4,
  pickConnectMode: _0x2eb694,
  dragContext: _0x452299,
  parentToChildren: _0x558b51,
  pinnedNodeIds: _0x1b7454,
} = {}) {
  const _0xd61e76 = new Set(),
    _0x22515c =
      _0x330d32 instanceof Set ? Array['from'](_0x330d32) : Array['isArray'](_0x330d32) ? _0x330d32 : [];
  _0x22515c['forEach']((_0x3caf6b) => addNodeAndChildren(_0xd61e76, _0x3caf6b, _0x558b51));
  if (_0x452299?.['isDragging'] && _0x452299?.['targetNodeId']) {
    const _0x5d093b = _0x22515c['includes'](_0x452299['targetNodeId'])
      ? _0x22515c
      : [_0x452299['targetNodeId']];
    _0x5d093b['forEach']((_0x5a7e75) => addNodeAndChildren(_0xd61e76, _0x5a7e75, _0x558b51));
  }
  _0x5c58d4?.['srcId'] && _0xd61e76['add'](_0x5c58d4['srcId']);
  _0x5c58d4?.['hoverId'] && _0xd61e76['add'](_0x5c58d4['hoverId']);
  _0x2eb694?.['sourceNodeId'] && _0xd61e76['add'](_0x2eb694['sourceNodeId']);
  _0x2eb694?.['hoverNodeId'] && _0xd61e76['add'](_0x2eb694['hoverNodeId']);
  const _0x4c31db = _0x1b7454 instanceof Set ? _0x1b7454 : Array['isArray'](_0x1b7454) ? _0x1b7454 : [];
  for (const _0x1cc524 of _0x4c31db) {
    _0xd61e76['add'](_0x1cc524);
  }
  return _0xd61e76;
}
export function resolveRendererVirtualizationPadding({
  viewport: _0x1d771a,
  nodeCount: nodeCount = 0x0,
  mountPadding: mountPadding = RENDERER_VIRTUALIZATION_CONFIG['mountPadding'],
  parkPadding: parkPadding = RENDERER_VIRTUALIZATION_CONFIG['parkPadding'],
} = {}) {
  const _0x573394 = Number['isFinite'](_0x1d771a?.['zoom']) ? _0x1d771a['zoom'] : 0x1,
    _0x234a9b = Number['isFinite'](nodeCount) ? nodeCount : 0x0;
  if (
    _0x573394 <= RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomThreshold'] &&
    _0x234a9b >= RENDERER_VIRTUALIZATION_CONFIG['veryDenseNodeCount']
  )
    return {
      mountPadding: RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomMountPadding'],
      parkPadding: RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomParkPadding'],
    };
  if (
    _0x573394 <= RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomThreshold'] &&
    _0x234a9b >= RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount']
  )
    return {
      mountPadding: RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomMountPadding'],
      parkPadding: RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomParkPadding'],
    };
  return { mountPadding: mountPadding, parkPadding: parkPadding };
}
export function resolveRendererPreviewPadding({
  viewport: _0xffb435,
  nodeCount: nodeCount = 0x0,
  mountPadding: mountPadding = RENDERER_VIRTUALIZATION_CONFIG['mountPadding'],
  previewPadding: previewPadding = mountPadding,
} = {}) {
  const _0x44e107 = Number['isFinite'](_0xffb435?.['zoom']) ? _0xffb435['zoom'] : 0x1,
    _0x720122 = Number['isFinite'](nodeCount) ? nodeCount : 0x0,
    _0x1fc44f = Number['isFinite'](Number(previewPadding)) ? Number(previewPadding) : mountPadding;
  if (
    _0x44e107 <= RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomThreshold'] &&
    _0x720122 >= RENDERER_VIRTUALIZATION_CONFIG['veryDenseNodeCount']
  )
    return Math['max'](mountPadding, RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomPreviewPadding']);
  if (
    _0x44e107 <= RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomThreshold'] &&
    _0x720122 >= RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount']
  )
    return Math['max'](mountPadding, RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomPreviewPadding']);
  return Math['max'](mountPadding, _0x1fc44f);
}
export function resolveRendererLowZoomMountLimit({ viewport: _0x421f1b, nodeCount: nodeCount = 0x0 } = {}) {
  const _0x40d8db = Number['isFinite'](_0x421f1b?.['zoom']) ? _0x421f1b['zoom'] : 0x1,
    _0x5d3001 = Number['isFinite'](nodeCount) ? nodeCount : 0x0;
  if (
    _0x40d8db <= RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomThreshold'] &&
    _0x5d3001 >= RENDERER_VIRTUALIZATION_CONFIG['veryDenseNodeCount']
  )
    return RENDERER_VIRTUALIZATION_CONFIG['veryDenseLowZoomMaxMountCandidates'];
  if (
    _0x40d8db <= RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomThreshold'] &&
    _0x5d3001 >= RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount']
  )
    return RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomMaxMountCandidates'];
  return 0x0;
}
function limitLowZoomMountCandidates({
  nodes: _0x5c4f4c,
  mountCandidateIds: _0xfac674,
  keepAliveNodeIds: _0x164702,
  viewport: _0x449fe3,
  containerWidth: _0x284b17,
  containerHeight: _0x565804,
  limit: _0x60a4a8,
} = {}) {
  if (!(_0xfac674 instanceof Set) || !(_0x60a4a8 > 0x0)) return _0xfac674;
  const _0xf97819 = new Set(_0x164702 || []);
  for (const _0x2867c6 of _0xfac674) {
    const _0x5b6b18 = _0x5c4f4c?.[_0x2867c6];
    isPreferredLowZoomMountNode(_0x5b6b18) && _0xf97819['add'](_0x2867c6);
  }
  const _0xb55dde = new Set();
  for (const _0xc1e490 of _0xf97819) {
    if (_0xfac674['has'](_0xc1e490)) _0xb55dde['add'](_0xc1e490);
  }
  const _0x25c5ec = Math['max'](0x0, Math['floor'](_0x60a4a8) - _0xb55dde['size']);
  if (_0x25c5ec <= 0x0) return _0xb55dde;
  const _0x17e539 = getViewportWorldCenter(_0x449fe3, _0x284b17, _0x565804),
    _0x5ca60f = [];
  let _0x1632e6 = 0x0;
  for (const _0x54f636 of _0xfac674) {
    if (_0xb55dde['has'](_0x54f636)) continue;
    const _0x112470 = _0x5c4f4c?.[_0x54f636];
    if (!_0x112470?.['id']) continue;
    if (isHeavyMediaNode(_0x112470)) continue;
    (_0x5ca60f['push']({
      nodeId: _0x54f636,
      distanceSq: getNodeCenterDistanceSq(_0x112470, _0x17e539),
      order: _0x1632e6,
    }),
      (_0x1632e6 += 0x1));
  }
  _0x5ca60f['sort'](
    (_0x194234, _0x6ef39f) =>
      _0x194234['distanceSq'] - _0x6ef39f['distanceSq'] || _0x194234['order'] - _0x6ef39f['order'],
  );
  for (const _0x48441a of _0x5ca60f['slice'](0x0, _0x25c5ec)) {
    _0xb55dde['add'](_0x48441a['nodeId']);
  }
  return _0xb55dde;
}
function finalizeVirtualizationCandidateSets({
  nodes: _0x5dc0f2,
  nodeCount: _0x4cf876,
  mountCandidateIds: _0x26762b,
  previewCandidateIds: previewCandidateIds = _0x26762b,
  parkCandidateIds: _0xb3d060,
  keepAliveNodeIds: _0x49fbb9,
  mountedNodeIds: _0x171534,
  viewport: _0x556ef2,
  containerWidth: _0x84c61a,
  containerHeight: _0x45ae1d,
} = {}) {
  const _0x5d3e36 = resolveRendererLowZoomMountLimit({ viewport: _0x556ef2, nodeCount: _0x4cf876 });
  if (!(_0x5d3e36 > 0x0))
    return {
      keepAliveNodeIds: _0x49fbb9,
      mountCandidateIds: _0x26762b,
      previewCandidateIds: previewCandidateIds,
      parkCandidateIds: _0xb3d060,
    };
  const _0x2246df = limitLowZoomMountCandidates({
      nodes: _0x5dc0f2,
      mountCandidateIds: _0x26762b,
      keepAliveNodeIds: _0x49fbb9,
      viewport: _0x556ef2,
      containerWidth: _0x84c61a,
      containerHeight: _0x45ae1d,
      limit: _0x5d3e36,
    }),
    _0x3c8dd3 =
      _0x171534 instanceof Set ? _0x171534 : Array['isArray'](_0x171534) ? new Set(_0x171534) : new Set();
  for (const _0x104f45 of _0x3c8dd3) {
    if (!_0x104f45 || _0x49fbb9['has'](_0x104f45)) continue;
    if (!_0x2246df['has'](_0x104f45)) _0xb3d060['add'](_0x104f45);
  }
  for (const _0x15efc8 of _0x49fbb9) {
    _0xb3d060['delete'](_0x15efc8);
  }
  return {
    keepAliveNodeIds: _0x49fbb9,
    mountCandidateIds: _0x2246df,
    previewCandidateIds: previewCandidateIds,
    parkCandidateIds: _0xb3d060,
  };
}
export function buildVirtualizationCandidateSets({
  nodes: _0x1d5a65,
  spatialIndex: spatialIndex = null,
  viewport: _0x471042,
  containerWidth: _0x56b083,
  containerHeight: _0x223540,
  selectedNodeIds: _0x56f893,
  connOverlay: _0x5dd954,
  pickConnectMode: _0x344a8b,
  dragContext: _0x275bf8,
  parentToChildren: _0x5a52d8,
  pinnedNodeIds: _0x48db8c,
  mountedNodeIds: _0xec78ce,
  mountPadding: mountPadding = RENDERER_VIRTUALIZATION_CONFIG['mountPadding'],
  parkPadding: parkPadding = RENDERER_VIRTUALIZATION_CONFIG['parkPadding'],
} = {}) {
  const _0x536802 = spatialIndex ? null : Object['values'](_0x1d5a65 || {}),
    _0x147e2e = spatialIndex?.['nodeCount'] ?? _0x536802['length'],
    _0x1470f7 = resolveRendererVirtualizationPadding({
      viewport: _0x471042,
      nodeCount: _0x147e2e,
      mountPadding: mountPadding,
      parkPadding: parkPadding,
    }),
    _0x250639 = resolveRendererPreviewPadding({
      viewport: _0x471042,
      nodeCount: _0x147e2e,
      mountPadding: _0x1470f7['mountPadding'],
    }),
    _0x48a897 = collectVirtualKeepAliveNodeIds({
      selectedNodeIds: _0x56f893,
      connOverlay: _0x5dd954,
      pickConnectMode: _0x344a8b,
      dragContext: _0x275bf8,
      parentToChildren: _0x5a52d8,
      pinnedNodeIds: _0x48db8c,
    });
  for (const _0x9d3add of collectViewportWebPreviewNodeIds({
    nodes: _0x1d5a65,
    spatialIndex: spatialIndex,
    viewport: _0x471042,
    containerWidth: _0x56b083,
    containerHeight: _0x223540,
    padding: _0x1470f7['parkPadding'],
  })) {
    _0x48a897['add'](_0x9d3add);
  }
  const _0x1bc7c7 = new Set(),
    _0x2cd7ee = new Set(),
    _0x554f51 = new Set();
  if (spatialIndex) {
    const _0x566440 = screenViewportToWorldBounds({
        viewport: _0x471042,
        containerWidth: _0x56b083,
        containerHeight: _0x223540,
        padding: _0x1470f7['mountPadding'],
      }),
      _0x1c9cbb = screenViewportToWorldBounds({
        viewport: _0x471042,
        containerWidth: _0x56b083,
        containerHeight: _0x223540,
        padding: _0x1470f7['parkPadding'],
      }),
      _0x269726 =
        _0x250639 > _0x1470f7['mountPadding']
          ? screenViewportToWorldBounds({
              viewport: _0x471042,
              containerWidth: _0x56b083,
              containerHeight: _0x223540,
              padding: _0x250639,
            })
          : _0x566440,
      _0x120e3c = queryRendererSpatialIndexIds(spatialIndex, _0x566440),
      _0xf55a13 = _0x269726 === _0x566440 ? _0x120e3c : queryRendererSpatialIndexIds(spatialIndex, _0x269726),
      _0x1cf7a8 = queryRendererSpatialIndexIds(spatialIndex, _0x1c9cbb);
    for (const _0x4941b9 of _0x48a897) {
      (_0x1bc7c7['add'](_0x4941b9), _0x2cd7ee['add'](_0x4941b9));
    }
    for (const _0x5c458d of _0x120e3c) {
      (_0x1bc7c7['add'](_0x5c458d), _0x2cd7ee['add'](_0x5c458d));
    }
    for (const _0x1b9e32 of _0xf55a13) {
      _0x2cd7ee['add'](_0x1b9e32);
    }
    const _0x57aff2 =
      _0xec78ce instanceof Set
        ? _0xec78ce
        : Array['isArray'](_0xec78ce)
          ? _0xec78ce
          : spatialIndex['nodeIds'] || [];
    for (const _0x291fea of _0x57aff2) {
      if (!_0x291fea || _0x48a897['has'](_0x291fea)) continue;
      if (!_0x1cf7a8['has'](_0x291fea)) _0x554f51['add'](_0x291fea);
    }
    return finalizeVirtualizationCandidateSets({
      nodes: _0x1d5a65,
      nodeCount: _0x147e2e,
      keepAliveNodeIds: _0x48a897,
      mountCandidateIds: _0x1bc7c7,
      previewCandidateIds: _0x2cd7ee,
      parkCandidateIds: _0x554f51,
      mountedNodeIds: _0xec78ce,
      viewport: _0x471042,
      containerWidth: _0x56b083,
      containerHeight: _0x223540,
    });
  }
  for (const _0x47f2a6 of _0x536802) {
    if (!_0x47f2a6?.['id']) continue;
    const _0x4b8102 = _0x47f2a6['id'];
    if (_0x48a897['has'](_0x4b8102)) {
      (_0x1bc7c7['add'](_0x4b8102), _0x2cd7ee['add'](_0x4b8102));
      continue;
    }
    const _0x24c130 = isNodeInsideViewportPadding(
      _0x47f2a6,
      _0x471042,
      _0x56b083,
      _0x223540,
      _0x1470f7['mountPadding'],
    );
    if (_0x24c130) {
      (_0x1bc7c7['add'](_0x4b8102), _0x2cd7ee['add'](_0x4b8102));
      continue;
    }
    if (_0x250639 > _0x1470f7['mountPadding']) {
      const _0x5bd892 = isNodeInsideViewportPadding(_0x47f2a6, _0x471042, _0x56b083, _0x223540, _0x250639);
      _0x5bd892 && _0x2cd7ee['add'](_0x4b8102);
    }
    const _0x2fb9cc = isNodeInsideViewportPadding(
      _0x47f2a6,
      _0x471042,
      _0x56b083,
      _0x223540,
      _0x1470f7['parkPadding'],
    );
    !_0x2fb9cc && _0x554f51['add'](_0x4b8102);
  }
  return finalizeVirtualizationCandidateSets({
    nodes: _0x1d5a65,
    nodeCount: _0x147e2e,
    keepAliveNodeIds: _0x48a897,
    mountCandidateIds: _0x1bc7c7,
    previewCandidateIds: _0x2cd7ee,
    parkCandidateIds: _0x554f51,
    mountedNodeIds: _0xec78ce,
    viewport: _0x471042,
    containerWidth: _0x56b083,
    containerHeight: _0x223540,
  });
}
export function ensureRendererExactVisiblePreviewCandidates({
  virtualizationResult: _0x272042,
  nodes: _0x3414c3,
  spatialIndex: spatialIndex = null,
  viewport: _0x16918d,
  containerWidth: _0x46c308,
  containerHeight: _0x13191e,
  nodeCount: _0x5dd0a4,
} = {}) {
  const _0x54ccac = Number['isFinite'](Number(_0x5dd0a4))
      ? Number(_0x5dd0a4)
      : Object['keys'](_0x3414c3 || {})['length'],
    _0x181040 = Number(_0x16918d?.['zoom']);
  if (
    _0x54ccac < RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount'] ||
    !Number['isFinite'](_0x181040) ||
    _0x181040 > RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomThreshold']
  )
    return _0x272042;
  const _0x379f94 = spatialIndex
      ? queryRendererSpatialIndexIds(
          spatialIndex,
          screenViewportToWorldBounds({
            viewport: _0x16918d,
            containerWidth: _0x46c308,
            containerHeight: _0x13191e,
            padding: 0x0,
          }),
        )
      : new Set(
          Object['values'](_0x3414c3 || {})
            ['filter'](
              (_0x49a741) =>
                _0x49a741?.['id'] &&
                isNodeInsideViewportPadding(_0x49a741, _0x16918d, _0x46c308, _0x13191e, 0x0),
            )
            ['map']((_0x503758) => _0x503758['id']),
        ),
    _0x5193d4 = _0x272042?.['previewCandidateIds'] || _0x272042?.['mountCandidateIds'] || new Set(),
    _0x40aad3 = Array['from'](_0x379f94)['filter']((_0x5b1aed) => !_0x5193d4['has'](_0x5b1aed));
  if (_0x40aad3['length'] === 0x0) return _0x272042;
  return { ..._0x272042, previewCandidateIds: new Set([..._0x5193d4, ..._0x40aad3]) };
}
