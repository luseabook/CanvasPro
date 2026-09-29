import {
  RENDERER_VIRTUALIZATION_CONFIG,
  resolveRendererLowZoomMountLimit,
} from './rendererVirtualization.js';
import { NODE_DETAIL_DEFERRED_CLASS } from './rendererNodeDetailHydration.js';
import { shouldShowGenerationBusyUi } from './generationTaskUiState.js';
import { isNodeType } from '../modules/registry.js';
const DENSE_INTERACTION_STRUCTURAL_BATCH_SIZE = 0x1,
  DENSE_INTERACTION_STRUCTURAL_FRAME_BUDGET_MS = 0x2,
  DENSE_SETTLED_STRUCTURAL_BATCH_SIZE = 0x2,
  DENSE_SETTLED_STRUCTURAL_FRAME_BUDGET_MS = 0x6,
  DENSE_SETTLED_FULL_IMAGE_STRUCTURAL_BATCH_SIZE = 0x1,
  DENSE_SETTLED_FULL_IMAGE_STRUCTURAL_FRAME_BUDGET_MS = 0x4,
  DENSE_SETTLED_FULL_IMAGE_TAIL_BATCH_SIZE = 0x1,
  DENSE_SETTLED_FULL_IMAGE_TAIL_FRAME_BUDGET_MS = 0x4,
  DENSE_SETTLED_FULL_IMAGE_TAIL_PENDING_COUNT = 0x4,
  HEAVY_MEDIA_MOUNT_TYPES = new Set(['source-image', 'ai-image', 'source-video', 'ai-video', 'video']),
  DENSE_MEDIA_VIEWPORT_COMMIT_DEFER_MAX_ZOOM = 0.95,
  DENSE_MEDIA_VIEWPORT_COMMIT_RECONCILE_DELAY_MS = 0x1e0,
  VIDEO_MEDIA_MOUNT_TYPES = new Set(['source-video', 'ai-video', 'video']),
  DENSE_SETTLED_HEAVY_UPDATE_BATCH_SIZE = 0x1,
  DENSE_SETTLED_HEAVY_UPDATE_FRAME_BUDGET_MS = 0x6,
  PRIORITY_MEDIA_INTERACTION_RECONCILE_DELAY_MS = 0x20,
  EXTREME_DENSE_RELATED_VIDEO_DETAIL_NODE_COUNT = 0x200,
  EXTREME_DENSE_RELATED_VIDEO_DETAIL_MAX_ZOOM = 1.05,
  DENSE_STRUCTURAL_EDGE_DEFER_COUNT = 0x140;
export function shouldDeferDenseStructuralEdgeRender({
  renderMode: _0x2d2069,
  nodeStructureChanged: nodeStructureChanged = ![],
  edgesRevChanged: edgesRevChanged = ![],
  nodeCount: nodeCount = 0x0,
  edgeCount: edgeCount = 0x0,
  connectionLinesVisible: connectionLinesVisible = !![],
} = {}) {
  return (
    _0x2d2069 === 'viewport-jump' &&
    nodeStructureChanged &&
    edgesRevChanged &&
    connectionLinesVisible &&
    Number(nodeCount) >= DENSE_STRUCTURAL_EDGE_DEFER_COUNT &&
    Number(edgeCount) >= DENSE_STRUCTURAL_EDGE_DEFER_COUNT
  );
}
export function shouldUseDenseStructuralEdgeOnlyFollowup({
  deferDenseStructuralFrame: deferDenseStructuralFrame = ![],
  deferDenseStructuralEdgeRender: deferDenseStructuralEdgeRender = ![],
  hasPendingStructuralOps: hasPendingStructuralOps = ![],
} = {}) {
  return (
    deferDenseStructuralFrame !== !![] &&
    deferDenseStructuralEdgeRender === !![] &&
    hasPendingStructuralOps !== !![]
  );
}
export function shouldPrepareDenseStructuralEdgeFollowup({
  deferDenseStructuralFrame: deferDenseStructuralFrame = ![],
  deferDenseStructuralEdgeRender: deferDenseStructuralEdgeRender = ![],
  connectionLinesVisible: connectionLinesVisible = !![],
  isManyEdges: isManyEdges = ![],
} = {}) {
  return (
    deferDenseStructuralFrame !== !![] &&
    deferDenseStructuralEdgeRender === !![] &&
    connectionLinesVisible === !![] &&
    isManyEdges === !![]
  );
}
export function createHeavyMediaUpdateFrameBudget({
  nodeCount: nodeCount = 0x0,
  batchSize: batchSize = DENSE_SETTLED_HEAVY_UPDATE_BATCH_SIZE,
  frameBudgetMs: frameBudgetMs = DENSE_SETTLED_HEAVY_UPDATE_FRAME_BUDGET_MS,
  now: now = () =>
    typeof performance !== 'undefined' && typeof performance['now'] === 'function'
      ? performance['now']()
      : 0x0,
} = {}) {
  const _0x716301 = Number(nodeCount || 0x0) >= RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount'],
    _0x2c4a2f = Number(now()) || 0x0;
  let _0x426aed = 0x0;
  return {
    shouldDefer(_0xc7faac = {}) {
      if (!_0x716301 || !HEAVY_MEDIA_MOUNT_TYPES['has'](_0xc7faac?.['node']?.['type'])) return ![];
      const _0x109cf6 = Math['max'](0x0, (Number(now()) || 0x0) - _0x2c4a2f),
        _0x3029c8 = _0x426aed >= batchSize || _0x109cf6 >= frameBudgetMs;
      if (!_0x3029c8) return ![];
      if (
        _0x426aed === 0x0 &&
        (shouldShowGenerationBusyUi(_0xc7faac['node']) || isRendererInteractionPriorityNode(_0xc7faac))
      )
        return ![];
      return !![];
    },
    consume(_0x38f23c = null) {
      if (_0x38f23c && !HEAVY_MEDIA_MOUNT_TYPES['has'](_0x38f23c?.['type'])) return;
      _0x426aed += 0x1;
    },
  };
}
export function shouldForceDeferActiveNodeDetails({
  nodeId: _0x175469,
  dragContext: _0x4ab457,
  dragTargets: _0x3c44bd,
} = {}) {
  return !!(
    _0x175469 &&
    _0x4ab457?.['isDragging'] &&
    _0x4ab457['isCommittingDrag'] !== !![] &&
    _0x3c44bd?.['has']?.(_0x175469)
  );
}
export function shouldDeferHeavyMediaForInteractionGrace({
  remainingMs: remainingMs = 0x0,
  viewport: _0x5592e3,
  nodeCount: nodeCount = 0x0,
  hasPriorityMediaWork: hasPriorityMediaWork = ![],
} = {}) {
  if (hasPriorityMediaWork) return ![];
  if (!(Number(remainingMs) > 0x0)) return ![];
  return resolveRendererLowZoomMountLimit({ viewport: _0x5592e3, nodeCount: nodeCount }) > 0x0;
}
export function shouldPauseViewportMediaForInteractionGrace({
  remainingMs: remainingMs = 0x0,
  viewport: _0x131cdf,
  nodeCount: nodeCount = 0x0,
  hasPriorityMediaWork: hasPriorityMediaWork = ![],
} = {}) {
  return shouldDeferHeavyMediaForInteractionGrace({
    remainingMs: remainingMs,
    viewport: _0x131cdf,
    nodeCount: nodeCount,
    hasPriorityMediaWork: hasPriorityMediaWork,
  });
}
export function resolveViewportCommitReconcileDelay({
  viewport: _0x2e55e6,
  nodeCount: nodeCount = 0x0,
  hasPriorityMediaWork: hasPriorityMediaWork = ![],
} = {}) {
  if (hasPriorityMediaWork) return 0x0;
  if (resolveRendererLowZoomMountLimit({ viewport: _0x2e55e6, nodeCount: nodeCount }) > 0x0)
    return RENDERER_VIRTUALIZATION_CONFIG['lowZoomViewportCommitReconcileDelayMs'];
  const _0x3d0671 = Number['isFinite'](_0x2e55e6?.['zoom']) ? _0x2e55e6['zoom'] : 0x1;
  if (
    Number(nodeCount || 0x0) >= RENDERER_VIRTUALIZATION_CONFIG['veryDenseNodeCount'] &&
    _0x3d0671 <= DENSE_MEDIA_VIEWPORT_COMMIT_DEFER_MAX_ZOOM
  )
    return DENSE_MEDIA_VIEWPORT_COMMIT_RECONCILE_DELAY_MS;
  return 0x0;
}
export function resolveViewportInteractionReconcileDelay({
  hasPriorityMediaWork: hasPriorityMediaWork = ![],
  fallbackDelayMs: fallbackDelayMs = RENDERER_VIRTUALIZATION_CONFIG['settleDelayMs'],
} = {}) {
  const _0x148323 = Number(fallbackDelayMs),
    _0x357635 = Number['isFinite'](_0x148323)
      ? Math['max'](0x0, _0x148323)
      : RENDERER_VIRTUALIZATION_CONFIG['settleDelayMs'];
  if (!hasPriorityMediaWork) return _0x357635;
  return Math['min'](_0x357635, PRIORITY_MEDIA_INTERACTION_RECONCILE_DELAY_MS);
}
export function shouldHydratePriorityMediaDuringViewportInteraction({
  interactionActive: interactionActive = ![],
  hasPriorityMediaWork: hasPriorityMediaWork = ![],
} = {}) {
  return hasPriorityMediaWork === !![] && interactionActive !== !![];
}
export function shouldDeferHeavyMediaMount({
  node: _0x312bec,
  nodeId: _0x165909,
  isSelected: _0x39f197,
  isSelectionRelated: _0x3aaa06,
  dragTargets: _0x1c405c,
  connOverlay: _0x4df933,
  pickMode: _0xbe64c2,
  options: _0x12d118,
} = {}) {
  if (_0x12d118?.['deferHeavyMediaMount'] !== !![]) return ![];
  if (!_0x165909 || !HEAVY_MEDIA_MOUNT_TYPES['has'](_0x312bec?.['type'])) return ![];
  return !isRendererInteractionPriorityNode({
    nodeId: _0x165909,
    isSelected: _0x39f197,
    isSelectionRelated: _0x3aaa06,
    dragTargets: _0x1c405c,
    connOverlay: _0x4df933,
    pickMode: _0xbe64c2,
  });
}
export function shouldDeferHeavyMediaUpdate({
  node: _0x4d1e4a,
  nodeId: _0x2dabb1,
  viewportBusyForPreview: _0x9e308c,
  nodeCount: _0x3bb48e,
  skipInstanceUpdate: _0x3c0c1e,
} = {}) {
  if (_0x3c0c1e === !![]) return ![];
  if (_0x9e308c !== !![]) return ![];
  if (Number(_0x3bb48e || 0x0) < RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount']) return ![];
  if (!_0x2dabb1 || !isVideoHeavyMediaNode(_0x4d1e4a)) return ![];
  return !shouldShowGenerationBusyUi(_0x4d1e4a);
}
export function shouldKeepHiddenHeavyMediaUpdatePending({
  node: _0x3c0020,
  nodeId: _0x32659a,
  isSelected: _0x2cf892,
  dragTargets: _0x34eada,
} = {}) {
  if (!_0x32659a || !HEAVY_MEDIA_MOUNT_TYPES['has'](_0x3c0020?.['type'])) return ![];
  if (_0x2cf892 || _0x34eada?.['has']?.(_0x32659a)) return ![];
  return !shouldShowGenerationBusyUi(_0x3c0020);
}
export function shouldKeepHeavyMediaPreviewOnly({
  node: _0x36efd4,
  nodeId: _0x47edf6,
  isSelected: _0x3bfc40,
  isSelectionRelated: _0x38d022,
  dragTargets: _0x511a0e,
  connOverlay: _0x12fc0c,
  pickMode: _0x464649,
  viewport: _0x3cea66,
  nodeCount: _0x187648,
} = {}) {
  if (!_0x47edf6 || !HEAVY_MEDIA_MOUNT_TYPES['has'](_0x36efd4?.['type'])) return ![];
  if (
    isRendererInteractionPriorityNode({
      nodeId: _0x47edf6,
      isSelected: _0x3bfc40,
      isSelectionRelated: _0x38d022,
      dragTargets: _0x511a0e,
      connOverlay: _0x12fc0c,
      pickMode: _0x464649,
    })
  )
    return ![];
  return resolveRendererLowZoomMountLimit({ viewport: _0x3cea66, nodeCount: _0x187648 }) > 0x0;
}
function isInactiveHeavyMediaNode({
  node: _0x1e01b4,
  nodeId: _0x48ef2d,
  isSelected: _0x1a1443,
  isSelectionRelated: _0x7dad6,
  dragTargets: _0x4b4061,
  connOverlay: _0x3f72ea,
  pickMode: _0x41e012,
} = {}) {
  if (!_0x48ef2d || !HEAVY_MEDIA_MOUNT_TYPES['has'](_0x1e01b4?.['type'])) return ![];
  if (
    isRendererInteractionPriorityNode({
      nodeId: _0x48ef2d,
      isSelected: _0x1a1443,
      isSelectionRelated: _0x7dad6,
      dragTargets: _0x4b4061,
      connOverlay: _0x3f72ea,
      pickMode: _0x41e012,
    })
  )
    return ![];
  return !![];
}
function isVideoHeavyMediaNode(_0x5a94c5 = {}) {
  return VIDEO_MEDIA_MOUNT_TYPES['has'](_0x5a94c5?.['type']);
}
function isRendererInteractionPriorityNode({
  nodeId: _0x4f85df,
  isSelected: _0x1ed641,
  isSelectionRelated: _0x37a2c6,
  dragTargets: _0x1092df,
  connOverlay: _0x15952,
  pickMode: _0x5dc212,
} = {}) {
  if (!_0x4f85df) return ![];
  return !!(
    _0x1ed641 ||
    _0x37a2c6 ||
    _0x1092df?.['has']?.(_0x4f85df) ||
    _0x15952?.['srcId'] === _0x4f85df ||
    _0x15952?.['hoverId'] === _0x4f85df ||
    _0x5dc212?.['sourceNodeId'] === _0x4f85df ||
    _0x5dc212?.['hoverNodeId'] === _0x4f85df
  );
}
export function shouldHydrateVideoMediaImmediately(_0x582a0d = {}) {
  return !!(isVideoHeavyMediaNode(_0x582a0d?.['node']) && isRendererInteractionPriorityNode(_0x582a0d));
}
export function createHeavyMediaPreviewOnlyDecider({
  viewport: _0x42d0aa,
  nodeCount: _0x556a07,
  lowZoomRealVideoNodeIds: _0x5f4441,
  fullEligibleVisibleImageNodeIds: _0x1499c8,
} = {}) {
  const _0xcf9b47 = resolveRendererLowZoomMountLimit({ viewport: _0x42d0aa, nodeCount: _0x556a07 });
  if (_0xcf9b47 > 0x0)
    return (_0x290b80 = {}) => {
      if (
        isNodeType(_0x290b80?.['node'], ['source-image', 'ai-image']) &&
        _0x1499c8?.['has']?.(_0x290b80?.['nodeId'])
      )
        return ![];
      if (isVideoHeavyMediaNode(_0x290b80?.['node']) && _0x5f4441?.['has']?.(_0x290b80?.['nodeId']))
        return ![];
      return isInactiveHeavyMediaNode(_0x290b80);
    };
  return () => ![];
}
export function shouldForceDeferRelatedVideoDetails({
  node: _0x2cebea,
  nodeId: _0x555644,
  isSelected: _0x55d572,
  isSelectionRelated: _0x2a0ed6,
  dragTargets: _0x2cf17f,
  viewport: _0x27fcdd,
  nodeCount: _0x143b05,
  mountCandidateCount: _0xe8c494,
  options: _0x36e840,
} = {}) {
  if (!_0x555644 || !isNodeType(_0x2cebea, ['ai-video'])) return ![];
  if (_0x55d572 || !_0x2a0ed6 || _0x2cf17f?.['has']?.(_0x555644)) return ![];
  if (_0x2cebea?.['isVideosExpanded'] === !![] || _0x2cebea?.['isImagesExpanded'] === !![]) return ![];
  const _0x31c014 = Number['isFinite'](_0x27fcdd?.['zoom']) ? _0x27fcdd['zoom'] : 0x1;
  return (
    void _0xe8c494,
    void _0x36e840,
    !!(
      Number(_0x143b05 || 0x0) >= EXTREME_DENSE_RELATED_VIDEO_DETAIL_NODE_COUNT &&
      _0x31c014 <= EXTREME_DENSE_RELATED_VIDEO_DETAIL_MAX_ZOOM
    )
  );
}
export function shouldQueueNodeDetailHydration({
  wrapperEl: _0xba5597,
  nodeId: _0x15bd09,
  isSelected: _0x242968,
  isSelectionRelated: _0x118b5e,
  dragTargets: _0x51c9fd,
  connOverlay: _0x3ca299,
  pickMode: _0x4b702f,
  viewportBusyForPreview: _0x17d35f,
  mountCandidateCount: _0x42afaa,
  nodeCount: _0x15c558,
  options: _0x6f4921,
} = {}) {
  const _0x44bde1 =
    _0xba5597?.['classList']?.['contains']?.(NODE_DETAIL_DEFERRED_CLASS) ||
    _0xba5597?.['dataset']?.['detailStage'] === 'deferred';
  if (!_0x44bde1) return ![];
  if (
    isRendererInteractionPriorityNode({
      nodeId: _0x15bd09,
      isSelected: _0x242968,
      isSelectionRelated: _0x118b5e,
      dragTargets: _0x51c9fd,
      connOverlay: _0x3ca299,
      pickMode: _0x4b702f,
    })
  )
    return ![];
  const _0x45d787 =
    _0x17d35f || _0x6f4921?.['deferParking'] === !![] || _0x6f4921?.['deferHeavyMediaMount'] === !![];
  if (_0x45d787) return !![];
  if (_0x118b5e) return ![];
  const _0x568b5b = Number(_0x42afaa || 0x0),
    _0x71352b = Number(_0x15c558 || 0x0);
  return _0x568b5b >= 0x18 || _0x71352b >= 0x78;
}
export function getRendererStructuralBudgetOptions({
  dragContext: _0x2ec4d4,
  viewportBusy: viewportBusy = ![],
  fullEligibleVisibleImageCount: fullEligibleVisibleImageCount = 0x0,
  fullImageSettleReady: fullImageSettleReady = ![],
  nodeCount: _0x200cc8,
  pendingFullEligibleVisibleImageCount: pendingFullEligibleVisibleImageCount = 0x0,
  renderMode: renderMode = 'steady',
  viewport: _0x2842c8,
} = {}) {
  const _0x11517a = Number(_0x200cc8) || 0x0;
  if (_0x11517a < RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount']) return {};
  const _0x3a2065 = resolveRendererLowZoomMountLimit({ viewport: _0x2842c8, nodeCount: _0x11517a }) > 0x0,
    _0x59b4af = viewportBusy || _0x3a2065 || _0x2ec4d4?.['isDragging'] || _0x2ec4d4?.['isDraggingCell'];
  if (_0x59b4af)
    return {
      batchSize: DENSE_INTERACTION_STRUCTURAL_BATCH_SIZE,
      frameBudgetMs: DENSE_INTERACTION_STRUCTURAL_FRAME_BUDGET_MS,
    };
  if (_0x11517a >= RENDERER_VIRTUALIZATION_CONFIG['veryDenseNodeCount']) {
    const _0x26386a =
        renderMode === 'steady' &&
        fullImageSettleReady === !![] &&
        Number(fullEligibleVisibleImageCount) > 0x0,
      _0x5b0da9 =
        _0x26386a &&
        Number(pendingFullEligibleVisibleImageCount) > 0x0 &&
        Number(pendingFullEligibleVisibleImageCount) <= DENSE_SETTLED_FULL_IMAGE_TAIL_PENDING_COUNT;
    return {
      batchSize: _0x5b0da9
        ? DENSE_SETTLED_FULL_IMAGE_TAIL_BATCH_SIZE
        : _0x26386a
          ? DENSE_SETTLED_FULL_IMAGE_STRUCTURAL_BATCH_SIZE
          : DENSE_SETTLED_STRUCTURAL_BATCH_SIZE,
      frameBudgetMs: _0x5b0da9
        ? DENSE_SETTLED_FULL_IMAGE_TAIL_FRAME_BUDGET_MS
        : _0x26386a
          ? DENSE_SETTLED_FULL_IMAGE_STRUCTURAL_FRAME_BUDGET_MS
          : DENSE_SETTLED_STRUCTURAL_FRAME_BUDGET_MS,
    };
  }
  if (!_0x59b4af && _0x11517a < RENDERER_VIRTUALIZATION_CONFIG['veryDenseNodeCount']) return {};
  return {};
}
