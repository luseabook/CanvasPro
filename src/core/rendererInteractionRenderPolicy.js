import {
  RENDERER_VIRTUALIZATION_CONFIG,
  resolveRendererLowZoomMountLimit,
} from './rendererVirtualization.js';
import { NODE_DETAIL_DEFERRED_CLASS } from './rendererNodeDetailHydration.js';
import { shouldShowGenerationBusyUi } from './generationTaskUiState.js';
import { isNodeType } from '../modules/registry.js';
const DENSE_INTERACTION_STRUCTURAL_BATCH_SIZE = 1,
  DENSE_INTERACTION_STRUCTURAL_FRAME_BUDGET_MS = 2,
  DENSE_SETTLED_STRUCTURAL_BATCH_SIZE = 2,
  DENSE_SETTLED_STRUCTURAL_FRAME_BUDGET_MS = 6,
  DENSE_SETTLED_FULL_IMAGE_STRUCTURAL_BATCH_SIZE = 1,
  DENSE_SETTLED_FULL_IMAGE_STRUCTURAL_FRAME_BUDGET_MS = 4,
  DENSE_SETTLED_FULL_IMAGE_TAIL_BATCH_SIZE = 1,
  DENSE_SETTLED_FULL_IMAGE_TAIL_FRAME_BUDGET_MS = 4,
  DENSE_SETTLED_FULL_IMAGE_TAIL_PENDING_COUNT = 4,
  HEAVY_MEDIA_MOUNT_TYPES = new Set(['source-image', 'ai-image', 'source-video', 'ai-video', 'video']),
  DENSE_MEDIA_VIEWPORT_COMMIT_DEFER_MAX_ZOOM = 0.95,
  DENSE_MEDIA_VIEWPORT_COMMIT_RECONCILE_DELAY_MS = 480,
  VIDEO_MEDIA_MOUNT_TYPES = new Set(['source-video', 'ai-video', 'video']),
  DENSE_SETTLED_HEAVY_UPDATE_BATCH_SIZE = 1,
  DENSE_SETTLED_HEAVY_UPDATE_FRAME_BUDGET_MS = 6,
  PRIORITY_MEDIA_INTERACTION_RECONCILE_DELAY_MS = 32,
  EXTREME_DENSE_RELATED_VIDEO_DETAIL_NODE_COUNT = 512,
  EXTREME_DENSE_RELATED_VIDEO_DETAIL_MAX_ZOOM = 1.05,
  DENSE_STRUCTURAL_EDGE_DEFER_COUNT = 320;
export function shouldDeferDenseStructuralEdgeRender({
  renderMode: renderMode2,
  nodeStructureChanged: nodeStructureChanged = false,
  edgesRevChanged: edgesRevChanged = false,
  nodeCount: nodeCount = 0,
  edgeCount: edgeCount = 0,
  connectionLinesVisible: connectionLinesVisible = true,
} = {}) {
  return (
    renderMode2 === 'viewport-jump' &&
    nodeStructureChanged &&
    edgesRevChanged &&
    connectionLinesVisible &&
    Number(nodeCount) >= DENSE_STRUCTURAL_EDGE_DEFER_COUNT &&
    Number(edgeCount) >= DENSE_STRUCTURAL_EDGE_DEFER_COUNT
  );
}
export function shouldUseDenseStructuralEdgeOnlyFollowup({
  deferDenseStructuralFrame: deferDenseStructuralFrame = false,
  deferDenseStructuralEdgeRender: deferDenseStructuralEdgeRender = false,
  hasPendingStructuralOps: hasPendingStructuralOps = false,
} = {}) {
  return (
    deferDenseStructuralFrame !== true &&
    deferDenseStructuralEdgeRender === true &&
    hasPendingStructuralOps !== true
  );
}
export function shouldPrepareDenseStructuralEdgeFollowup({
  deferDenseStructuralFrame: deferDenseStructuralFrame = false,
  deferDenseStructuralEdgeRender: deferDenseStructuralEdgeRender = false,
  connectionLinesVisible: connectionLinesVisible = true,
  isManyEdges: isManyEdges = false,
} = {}) {
  return (
    deferDenseStructuralFrame !== true &&
    deferDenseStructuralEdgeRender === true &&
    connectionLinesVisible === true &&
    isManyEdges === true
  );
}
export function createHeavyMediaUpdateFrameBudget({
  nodeCount: nodeCount = 0,
  batchSize: batchSize = DENSE_SETTLED_HEAVY_UPDATE_BATCH_SIZE,
  frameBudgetMs: frameBudgetMs = DENSE_SETTLED_HEAVY_UPDATE_FRAME_BUDGET_MS,
  now: now = () =>
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : 0,
} = {}) {
  const enabled = Number(nodeCount || 0) >= RENDERER_VIRTUALIZATION_CONFIG.denseNodeCount,
    value = Number(now()) || 0;
  let count = 0;
  return {
    shouldDefer(options = {}) {
      if (!enabled || !HEAVY_MEDIA_MOUNT_TYPES.has(options?.node?.type)) return false;
      const item = Math.max(0, (Number(now()) || 0) - value),
        enabled2 = count >= batchSize || item >= frameBudgetMs;
      if (!enabled2) return false;
      if (
        count === 0 &&
        (shouldShowGenerationBusyUi(options.node) || isRendererInteractionPriorityNode(options))
      )
        return false;
      return true;
    },
    consume(value2 = null) {
      if (value2 && !HEAVY_MEDIA_MOUNT_TYPES.has(value2?.type)) return;
      count += 1;
    },
  };
}
export function shouldForceDeferActiveNodeDetails({
  nodeId: nodeId,
  dragContext: dragContext,
  dragTargets: dragTargets,
} = {}) {
  return !!(
    nodeId &&
    dragContext?.isDragging &&
    dragContext.isCommittingDrag !== true &&
    dragTargets?.has?.(nodeId)
  );
}
export function shouldDeferHeavyMediaForInteractionGrace({
  remainingMs: remainingMs = 0,
  viewport: viewport,
  nodeCount: nodeCount = 0,
  hasPriorityMediaWork: hasPriorityMediaWork = false,
} = {}) {
  if (hasPriorityMediaWork) return false;
  if (!(Number(remainingMs) > 0)) return false;
  return resolveRendererLowZoomMountLimit({ viewport: viewport, nodeCount: nodeCount }) > 0;
}
export function shouldPauseViewportMediaForInteractionGrace({
  remainingMs: remainingMs = 0,
  viewport: viewport2,
  nodeCount: nodeCount = 0,
  hasPriorityMediaWork: hasPriorityMediaWork = false,
} = {}) {
  return shouldDeferHeavyMediaForInteractionGrace({
    remainingMs: remainingMs,
    viewport: viewport2,
    nodeCount: nodeCount,
    hasPriorityMediaWork: hasPriorityMediaWork,
  });
}
export function resolveViewportCommitReconcileDelay({
  viewport: viewport3,
  nodeCount: nodeCount = 0,
  hasPriorityMediaWork: hasPriorityMediaWork = false,
} = {}) {
  if (hasPriorityMediaWork) return 0;
  if (resolveRendererLowZoomMountLimit({ viewport: viewport3, nodeCount: nodeCount }) > 0)
    return RENDERER_VIRTUALIZATION_CONFIG.lowZoomViewportCommitReconcileDelayMs;
  const key = Number.isFinite(viewport3?.zoom) ? viewport3.zoom : 1;
  if (
    Number(nodeCount || 0) >= RENDERER_VIRTUALIZATION_CONFIG.veryDenseNodeCount &&
    key <= DENSE_MEDIA_VIEWPORT_COMMIT_DEFER_MAX_ZOOM
  )
    return DENSE_MEDIA_VIEWPORT_COMMIT_RECONCILE_DELAY_MS;
  return 0;
}
export function resolveViewportInteractionReconcileDelay({
  hasPriorityMediaWork: hasPriorityMediaWork = false,
  fallbackDelayMs: fallbackDelayMs = RENDERER_VIRTUALIZATION_CONFIG.settleDelayMs,
} = {}) {
  const index = Number(fallbackDelayMs),
    result = Number.isFinite(index)
      ? Math.max(0, index)
      : RENDERER_VIRTUALIZATION_CONFIG.settleDelayMs;
  if (!hasPriorityMediaWork) return result;
  return Math.min(result, PRIORITY_MEDIA_INTERACTION_RECONCILE_DELAY_MS);
}
export function shouldHydratePriorityMediaDuringViewportInteraction({
  interactionActive: interactionActive = false,
  hasPriorityMediaWork: hasPriorityMediaWork = false,
} = {}) {
  return hasPriorityMediaWork === true && interactionActive !== true;
}
export function shouldDeferHeavyMediaMount({
  node: node,
  nodeId: nodeId2,
  isSelected: isSelected,
  isSelectionRelated: isSelectionRelated,
  dragTargets: dragTargets2,
  connOverlay: connOverlay,
  pickMode: pickMode,
  options: options2,
} = {}) {
  if (options2?.deferHeavyMediaMount !== true) return false;
  if (!nodeId2 || !HEAVY_MEDIA_MOUNT_TYPES.has(node?.type)) return false;
  return !isRendererInteractionPriorityNode({
    nodeId: nodeId2,
    isSelected: isSelected,
    isSelectionRelated: isSelectionRelated,
    dragTargets: dragTargets2,
    connOverlay: connOverlay,
    pickMode: pickMode,
  });
}
export function shouldDeferHeavyMediaUpdate({
  node: node2,
  nodeId: nodeId3,
  viewportBusyForPreview: viewportBusyForPreview,
  nodeCount: nodeCount2,
  skipInstanceUpdate: skipInstanceUpdate,
} = {}) {
  if (skipInstanceUpdate === true) return false;
  if (viewportBusyForPreview !== true) return false;
  if (Number(nodeCount2 || 0) < RENDERER_VIRTUALIZATION_CONFIG.denseNodeCount) return false;
  if (!nodeId3 || !isVideoHeavyMediaNode(node2)) return false;
  return !shouldShowGenerationBusyUi(node2);
}
export function shouldKeepHiddenHeavyMediaUpdatePending({
  node: node3,
  nodeId: nodeId4,
  isSelected: isSelected2,
  dragTargets: dragTargets3,
} = {}) {
  if (!nodeId4 || !HEAVY_MEDIA_MOUNT_TYPES.has(node3?.type)) return false;
  if (isSelected2 || dragTargets3?.has?.(nodeId4)) return false;
  return !shouldShowGenerationBusyUi(node3);
}
export function shouldKeepHeavyMediaPreviewOnly({
  node: node4,
  nodeId: nodeId5,
  isSelected: isSelected3,
  isSelectionRelated: isSelectionRelated2,
  dragTargets: dragTargets4,
  connOverlay: connOverlay2,
  pickMode: pickMode2,
  viewport: viewport4,
  nodeCount: nodeCount3,
} = {}) {
  if (!nodeId5 || !HEAVY_MEDIA_MOUNT_TYPES.has(node4?.type)) return false;
  if (
    isRendererInteractionPriorityNode({
      nodeId: nodeId5,
      isSelected: isSelected3,
      isSelectionRelated: isSelectionRelated2,
      dragTargets: dragTargets4,
      connOverlay: connOverlay2,
      pickMode: pickMode2,
    })
  )
    return false;
  return resolveRendererLowZoomMountLimit({ viewport: viewport4, nodeCount: nodeCount3 }) > 0;
}
function isInactiveHeavyMediaNode({
  node: node5,
  nodeId: nodeId6,
  isSelected: isSelected4,
  isSelectionRelated: isSelectionRelated3,
  dragTargets: dragTargets5,
  connOverlay: connOverlay3,
  pickMode: pickMode3,
} = {}) {
  if (!nodeId6 || !HEAVY_MEDIA_MOUNT_TYPES.has(node5?.type)) return false;
  if (
    isRendererInteractionPriorityNode({
      nodeId: nodeId6,
      isSelected: isSelected4,
      isSelectionRelated: isSelectionRelated3,
      dragTargets: dragTargets5,
      connOverlay: connOverlay3,
      pickMode: pickMode3,
    })
  )
    return false;
  return true;
}
function isVideoHeavyMediaNode(options3 = {}) {
  return VIDEO_MEDIA_MOUNT_TYPES.has(options3?.type);
}
function isRendererInteractionPriorityNode({
  nodeId: nodeId7,
  isSelected: isSelected5,
  isSelectionRelated: isSelectionRelated4,
  dragTargets: dragTargets6,
  connOverlay: connOverlay4,
  pickMode: pickMode4,
} = {}) {
  if (!nodeId7) return false;
  return !!(
    isSelected5 ||
    isSelectionRelated4 ||
    dragTargets6?.has?.(nodeId7) ||
    connOverlay4?.srcId === nodeId7 ||
    connOverlay4?.hoverId === nodeId7 ||
    pickMode4?.sourceNodeId === nodeId7 ||
    pickMode4?.hoverNodeId === nodeId7
  );
}
export function shouldHydrateVideoMediaImmediately(options4 = {}) {
  return !!(isVideoHeavyMediaNode(options4?.node) && isRendererInteractionPriorityNode(options4));
}
export function createHeavyMediaPreviewOnlyDecider({
  viewport: viewport5,
  nodeCount: nodeCount4,
  lowZoomRealVideoNodeIds: lowZoomRealVideoNodeIds,
  fullEligibleVisibleImageNodeIds: fullEligibleVisibleImageNodeIds,
} = {}) {
  const rendererLowZoomMountLimit = resolveRendererLowZoomMountLimit({
    viewport: viewport5,
    nodeCount: nodeCount4,
  });
  if (rendererLowZoomMountLimit > 0)
    return (options5 = {}) => {
      if (
        isNodeType(options5?.node, ['source-image', 'ai-image']) &&
        fullEligibleVisibleImageNodeIds?.has?.(options5?.nodeId)
      )
        return false;
      if (
        isVideoHeavyMediaNode(options5?.node) &&
        lowZoomRealVideoNodeIds?.has?.(options5?.nodeId)
      )
        return false;
      return isInactiveHeavyMediaNode(options5);
    };
  return () => false;
}
export function shouldForceDeferRelatedVideoDetails({
  node: node6,
  nodeId: nodeId8,
  isSelected: isSelected6,
  isSelectionRelated: isSelectionRelated5,
  dragTargets: dragTargets7,
  viewport: viewport6,
  nodeCount: nodeCount5,
  mountCandidateCount: mountCandidateCount,
  options: options6,
} = {}) {
  if (!nodeId8 || !isNodeType(node6, ['ai-video'])) return false;
  if (isSelected6 || !isSelectionRelated5 || dragTargets7?.has?.(nodeId8)) return false;
  if (node6?.isVideosExpanded === true || node6?.isImagesExpanded === true) return false;
  const data = Number.isFinite(viewport6?.zoom) ? viewport6.zoom : 1;
  return (
    void mountCandidateCount,
    void options6,
    !!(
      Number(nodeCount5 || 0) >= EXTREME_DENSE_RELATED_VIDEO_DETAIL_NODE_COUNT &&
      data <= EXTREME_DENSE_RELATED_VIDEO_DETAIL_MAX_ZOOM
    )
  );
}
export function shouldQueueNodeDetailHydration({
  wrapperEl: wrapperEl,
  nodeId: nodeId9,
  isSelected: isSelected7,
  isSelectionRelated: isSelectionRelated6,
  dragTargets: dragTargets8,
  connOverlay: connOverlay5,
  pickMode: pickMode5,
  viewportBusyForPreview: viewportBusyForPreview2,
  mountCandidateCount: mountCandidateCount2,
  nodeCount: nodeCount6,
  options: options7,
} = {}) {
  const enabled3 =
    wrapperEl?.classList?.contains?.(NODE_DETAIL_DEFERRED_CLASS) ||
    wrapperEl?.dataset?.detailStage === 'deferred';
  if (!enabled3) return false;
  if (
    isRendererInteractionPriorityNode({
      nodeId: nodeId9,
      isSelected: isSelected7,
      isSelectionRelated: isSelectionRelated6,
      dragTargets: dragTargets8,
      connOverlay: connOverlay5,
      pickMode: pickMode5,
    })
  )
    return false;
  const target =
    viewportBusyForPreview2 ||
    options7?.deferParking === true ||
    options7?.deferHeavyMediaMount === true;
  if (target) return true;
  if (isSelectionRelated6) return false;
  const count2 = Number(mountCandidateCount2 || 0),
    count3 = Number(nodeCount6 || 0);
  return count2 >= 24 || count3 >= 120;
}
export function getRendererStructuralBudgetOptions({
  dragContext: dragContext2,
  viewportBusy: viewportBusy = false,
  fullEligibleVisibleImageCount: fullEligibleVisibleImageCount = 0,
  fullImageSettleReady: fullImageSettleReady = false,
  nodeCount: nodeCount7,
  pendingFullEligibleVisibleImageCount: pendingFullEligibleVisibleImageCount = 0,
  renderMode: renderMode = 'steady',
  viewport: viewport7,
} = {}) {
  const nodeCount8 = Number(nodeCount7) || 0;
  if (nodeCount8 < RENDERER_VIRTUALIZATION_CONFIG.denseNodeCount) return {};
  const rendererLowZoomMountLimit2 =
      resolveRendererLowZoomMountLimit({ viewport: viewport7, nodeCount: nodeCount8 }) > 0,
    enabled4 =
      viewportBusy ||
      rendererLowZoomMountLimit2 ||
      dragContext2?.isDragging ||
      dragContext2?.isDraggingCell;
  if (enabled4)
    return {
      batchSize: DENSE_INTERACTION_STRUCTURAL_BATCH_SIZE,
      frameBudgetMs: DENSE_INTERACTION_STRUCTURAL_FRAME_BUDGET_MS,
    };
  if (nodeCount8 >= RENDERER_VIRTUALIZATION_CONFIG.veryDenseNodeCount) {
    const source =
        renderMode === 'steady' &&
        fullImageSettleReady === true &&
        Number(fullEligibleVisibleImageCount) > 0,
      batchSize2 =
        source &&
        Number(pendingFullEligibleVisibleImageCount) > 0 &&
        Number(pendingFullEligibleVisibleImageCount) <= DENSE_SETTLED_FULL_IMAGE_TAIL_PENDING_COUNT;
    return {
      batchSize: batchSize2
        ? DENSE_SETTLED_FULL_IMAGE_TAIL_BATCH_SIZE
        : source
          ? DENSE_SETTLED_FULL_IMAGE_STRUCTURAL_BATCH_SIZE
          : DENSE_SETTLED_STRUCTURAL_BATCH_SIZE,
      frameBudgetMs: batchSize2
        ? DENSE_SETTLED_FULL_IMAGE_TAIL_FRAME_BUDGET_MS
        : source
          ? DENSE_SETTLED_FULL_IMAGE_STRUCTURAL_FRAME_BUDGET_MS
          : DENSE_SETTLED_STRUCTURAL_FRAME_BUDGET_MS,
    };
  }
  if (!enabled4 && nodeCount8 < RENDERER_VIRTUALIZATION_CONFIG.veryDenseNodeCount) return {};
  return {};
}
