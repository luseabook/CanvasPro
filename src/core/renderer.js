import { isNodeType } from '../modules/registry.js';
import { createRendererPresentationSubscription } from './rendererPresentationSubscription.js';
import { hasNodeTypeBetaBadge, normalizeNodeType } from '../modules/nodeMeta.js';
import { getInteractionRenderState } from './interaction.js';
import { getViewportPanPreview } from './viewportPanPreview.js';
import { createRendererPanPreviewReconciler } from './rendererPanPreviewReconcile.js';
import { readViewportInteractionState } from './viewportInteractionState.js';
import {
  isPerfProbeEnabled,
  recordEdgeRedrawSample,
  recordRenderFrameSample,
  recordRendererNodeLifecycleSample,
} from '../modules/perf/perfProbe.js';
import {
  buildVirtualizationCandidateSets,
  createRendererStructuralBudget,
  ensureRendererExactVisiblePreviewCandidates,
  getRendererStructuralReconcileDelayMs,
  isNodeInsideViewportPadding,
  RENDERER_VIRTUALIZATION_CONFIG,
  resolveRendererLowZoomMountLimit,
} from './rendererVirtualization.js';
import { createRendererFramePlan } from './rendererFramePlan.js';
import { clearRendererSpatialIndexCache, collectVirtualizedRenderNodes } from './rendererSpatialIndex.js';
import {
  buildFullEdgeRenderSignature,
  clearCachedEdgeVisibilityIndex,
  getCachedEdgeGeometrySignature,
  getCachedEdgeVisibilityIndex,
  MANY_EDGES_THRESHOLD,
} from './rendererEdgeVisibilityIndex.js';
import { createRendererEdgeLayer } from './rendererEdgeLayer.js';
import { normalizeConnectionLineStyle } from './edgePathGeometry.js';
import { installNodeResizeGeometryPreviewer } from './rendererResizePreview.js';
import { buildGroupOutputMembershipSignature } from '../modules/groupDynamicOutput.js';
import { syncRendererBridge } from './rendererBridge.js';
import { createPickConnectBannerEl, renderPickConnectBanner } from './rendererOverlays.js';
import { createRendererSelectionOverlay } from './rendererSelectionOverlay.js';
import { createRendererMediaPresentationCoordinator } from './rendererMediaPresentationCoordinator.js';
import { createRendererInteractionGraceController } from './rendererInteractionGrace.js';
import { createRendererVisibleAudioSurfaceHydrationPass } from './rendererDeferredMedia.js';
import {
  cancelRendererFastPreviewMediaPreloads,
  createRendererFastPreviewLayer,
} from './rendererFastPreviewLayer.js';
import { createRendererRasterPreviewCoordinator } from './rendererRasterPreviewCoordinator.js';
import {
  createRendererFastPreviewContinuationController,
  createRendererFastPreviewLifecycleTracker,
  syncRendererFastPreviewAfterNodeRender,
} from './rendererFastPreviewContinuation.js';
import { createFastPreviewReleaseScheduler } from './rendererFastPreviewRelease.js';
import { createRendererSourceVideoSlotLifecycle } from './rendererSourceVideoSlotLifecycle.js';
import { resolveRendererVideoMediaLeaseKey } from './rendererVideoMediaResidency.js';
import { cancelCanvasVisibleMediaWarmupPreloads } from './canvasMediaWarmup.js';
import { buildRendererVirtualizationSignature } from './rendererVirtualizationSignature.js';
import { consumeRendererNodeDragCommitHint } from './rendererCommitHints.js';
import {
  createHeavyMediaPreviewOnlyDecider,
  createHeavyMediaUpdateFrameBudget,
  getRendererStructuralBudgetOptions,
  resolveViewportInteractionReconcileDelay,
  shouldDeferDenseStructuralEdgeRender,
  shouldDeferHeavyMediaForInteractionGrace,
  shouldDeferHeavyMediaMount,
  shouldDeferHeavyMediaUpdate,
  shouldForceDeferActiveNodeDetails,
  shouldForceDeferRelatedVideoDetails,
  shouldHydratePriorityMediaDuringViewportInteraction,
  shouldHydrateVideoMediaImmediately,
  shouldKeepHiddenHeavyMediaUpdatePending,
  shouldPauseViewportMediaForInteractionGrace,
  shouldPrepareDenseStructuralEdgeFollowup,
  shouldQueueNodeDetailHydration,
  shouldUseDenseStructuralEdgeOnlyFollowup,
} from './rendererInteractionRenderPolicy.js';
import {
  applyRendererLowZoomRealVideoCandidates,
  resolveRendererLowZoomRealVideoNodeIds,
  shouldDeferInitialVideoMediaOnMount,
  syncRendererPendingSourceVideoActivationIds,
} from './rendererPriorityMediaWork.js';
import {
  applyRendererFullEligibleImageCandidates,
  collectFullEligibleVisibleImageNodeIds,
  prioritizeFullEligibleVisibleImageNodes,
  syncNodeMediaLodMode,
} from './rendererNodeMediaLod.js';
import {
  createRendererNodeLifecycleStats,
  recordRendererLifecycleDuration,
  recordRendererLifecycleSkippedUpdate,
} from './rendererNodeLifecyclePerf.js';
import { buildRendererNodeSignature } from './rendererNodeSignature.js';
import { syncNodeResultClass } from './rendererNodeResultState.js';
import { syncNodeMediaMetricsDataset } from '../modules/nodeMediaMetrics.js';
import { createRendererNodeRuntimeBridge } from './rendererNodeRuntimeBridge.js';
import {
  disposePreparedRendererNodeRuntime,
  prepareRendererNodeRuntime,
} from './rendererNodeRuntimeFactory.js';
import { createRendererNodeTimerController } from './rendererNodeTimerController.js';
import {
  buildRendererDragTargetSet,
  buildSelectedNodeRankMap,
  clearRendererNodeLabelTooltip,
  formatRendererNodeLabelText,
  formatVideoMetaText,
  getRendererDefaultNodeLabel,
  getRendererGroupColorWithOpacity,
  getRendererNodeLabelKind,
  getRendererNodeZIndex,
  setRendererNodeLabelContent,
  shouldSkipInitialMediaNodeUpdate,
  syncRendererFastPreviewPresentationOwner,
  syncRendererNodeDragTransform,
  syncRendererNodePresentationZIndex,
} from './rendererNodePresentation.js';
import { createRendererSelectionFastPath } from './rendererSelectionFastPath.js';
import {
  clearRendererViewportMediaPreloadPause,
  syncRendererViewportMediaPreloadPause,
} from './rendererViewportMediaPreloadPause.js';
import { renderViewport } from './rendererViewportTransform.js';
import {
  createRendererViewportPreviewCoverage,
  RENDERER_VIEWPORT_PREVIEW_COVERAGE_CONFIG,
  shouldPrepareRendererViewportPreviewCoverage,
} from './rendererViewportPreviewCoverage.js';
import { createRendererViewportJumpDetector } from './rendererViewportJumpDetector.js';
import {
  createRendererMediaRuntimePreparer,
  shouldPrebuildRendererMediaRuntime,
} from './rendererMediaRuntimePreparer.js';
import {
  installRendererRuntimeDiagnosticAccess,
  isRendererRuntimeDiagnosticsEnabled,
  recordRendererRuntimeDiagnostic,
} from './rendererRuntimeDiagnostics.js';
import { resolveGenerationUiState } from './generationTaskUiState.js';
import { getRendererPickerNodeTypes } from './rendererPickerCatalog.js';
import { t } from '../i18n/index.js';
import {
  resolveCanvasVideoDisplayUrl,
  resolveCanvasVideoPosterUrl,
} from '../services/canvasMediaLocalService.js';
export { buildRendererVirtualizationSignature };
export { formatVideoMetaText };
const _componentMap = new Map(),
  _nodeRuntimeBridge = createRendererNodeRuntimeBridge({
    getInstance: (value) => _componentMap['get'](value),
  }),
  _nodeDataSnapshotMap = new Map(),
  _sourceVideoSourceKeySnapshotMap = new Map(),
  _pendingSourceVideoActivationIds = new Set();
let _sourceVideoActivationRev = null,
  _sourceVideoActivationNodesRef = null,
  _resetSelectionFastPath = null;
const _wrapperMap = new Map(),
  _nodeTimerController = createRendererNodeTimerController({
    getWrapper: (item) => _wrapperMap['get'](item),
  }),
  _mountedNodeIds = new Set(),
  _parkedNodeIds = new Set(),
  _parkedWrapperMap = new Map(),
  _selectionOverlay = createRendererSelectionOverlay({
    getWrapper: (key) => _wrapperMap['get'](key) || _parkedWrapperMap['get'](key) || null,
    isMounted: (index) => _mountedNodeIds['has'](index),
  }),
  _fastPreviewLifecycle = createRendererFastPreviewLifecycleTracker(),
  _pendingNodeDataMap = new Map(),
  _nodeTypeSnapshotMap = new Map(),
  _nodePinReasons = new Map(),
  MANIFEST_MODEL_NODE_TYPES = new Set(['ai-image', 'ai-text', 'ai-video', 'ai-audio']);
let _rendererRuntimeDiagnosticRenderState = { previewOnly: ![], viewportBusy: ![] };
const _rendererRuntimeDiagnosticsEnabled = isRendererRuntimeDiagnosticsEnabled();
installRendererRuntimeDiagnosticAccess((nodeId) => {
  const rendererMediaDeferred = _componentMap['get'](nodeId),
    wrapperVideoCount = _wrapperMap['get'](nodeId);
  return {
    nodeId: nodeId,
    mounted: _mountedNodeIds['has'](nodeId),
    parked: _parkedNodeIds['has'](nodeId),
    rendererMediaDeferred: rendererMediaDeferred?.['_rendererMediaDeferred'] === !![],
    pinReasons: Array['from'](_nodePinReasons['get'](nodeId) || []),
    wrapperVideoCount: wrapperVideoCount?.['querySelectorAll']?.('video')?.['length'] || 0x0,
    ..._rendererRuntimeDiagnosticRenderState,
  };
});
const _rendererInteractionGrace = createRendererInteractionGraceController({
  delayMs: RENDERER_VIRTUALIZATION_CONFIG['parkAfterInteractionDelayMs'],
  getDragContext: getInteractionRenderState,
});
let _schedulePreparedMediaRuntimeCommit = null;
const _rendererMediaRuntimePreparer = createRendererMediaRuntimePreparer({
    isInteractionBusy: _rendererInteractionGrace['isBusy'],
    onPrepared: ({ nodeId: nodeId2, durationMs: durationMs }) => {
      (_rendererRuntimeDiagnosticsEnabled &&
        recordRendererRuntimeDiagnostic({
          kind: 'renderer-media-runtime-prepared',
          nodeId: nodeId2,
          durationMs: durationMs,
        }),
        _schedulePreparedMediaRuntimeCommit?.());
    },
    onPrepareError: ({ nodeId: nodeId3, error: error }) => {
      console['warn']('[Renderer] media runtime prebuild failed:', nodeId3, error);
    },
  }),
  _sourceVideoSlotLifecycle = createRendererSourceVideoSlotLifecycle({
    getNode: (result) => _currentSnapshot?.['nodes']?.[result],
    getWrapper: (data) => _wrapperMap['get'](data),
    releasePreview: (options) => _fastPreviewLayer['releaseNode'](options),
    forgetScheduledRelease: (target) => _fastPreviewRelease['forget'](target),
  }),
  _fastPreviewLayer = createRendererFastPreviewLayer({
    getWrapper: (source) => _wrapperMap['get'](source),
    isMounted: (next) => _mountedNodeIds['has'](next),
    resolveMediaPresentationReady: _sourceVideoSlotLifecycle['resolveMediaPresentationReady'],
    onPresentationOwnerChanged: ({ active: active, wrapper: wrapper }) => {
      syncRendererFastPreviewPresentationOwner(wrapper, active);
    },
    onMediaPresented: () => {
      if (_rendererInteractionGrace['isBusy']()) return;
      _schedulePreparedMediaRuntimeCommit?.();
    },
  }),
  _fastPreviewContinuation = createRendererFastPreviewContinuationController({
    sync: (...args) => _fastPreviewLayer['sync'](...args),
  }),
  _fastPreviewRelease = createFastPreviewReleaseScheduler({
    getWrapper: (current) => _wrapperMap['get'](current),
    hasPreview: (entry) => _fastPreviewLayer['hasNodePreview'](entry),
    isMounted: (record) => _mountedNodeIds['has'](record),
    isInteractionBusy: _rendererInteractionGrace['isBusy'],
    resolveMediaPresentationReady: _sourceVideoSlotLifecycle['resolveMediaPresentationReady'],
    releasePreview: (payload) => _fastPreviewLayer['releaseNode'](payload),
  }),
  _rasterPreviewCoordinator = createRendererRasterPreviewCoordinator({
    isDomMediaPresented: (handle, state) =>
      _fastPreviewLayer['isNodePresentationReady'](handle, state),
    onRasterHandoffFrame: _fastPreviewLayer['stageRasterHandoffFrame'],
    onRasterMediaClaimed: (config) => {
      _fastPreviewContinuation['excludeNodes'](config);
      for (const scope of config) _fastPreviewLayer['removeNode'](scope, { collect: ![] });
    },
    onMediaPresented: () => {
      if (_rendererInteractionGrace['isBusy']()) return;
      _schedulePreparedMediaRuntimeCommit?.();
    },
  });
function _markRasterMediaInteractionBusy() {
  (_rendererInteractionGrace['markBusy'](), _rasterPreviewCoordinator['setMediaLoadingBusy'](!![]));
}
function _releaseRasterMediaInteractionBusy() {
  (_rasterPreviewCoordinator['setMediaLoadingBusy'](![]), _schedulePreparedMediaRuntimeCommit?.());
}
const RENDERER_DEFERRED_MEDIA_HYDRATION_BATCH_SIZE = 0x2,
  RENDERER_VIDEO_MEDIA_RESIDENCY_PADDING = 0x78,
  RENDERER_INACTIVE_PRESENTED_MEDIA_LEASE_MS = 0x258,
  RENDERER_INACTIVE_PRESENTED_MEDIA_LEASE_LIMIT = 0x3,
  RENDERER_FULL_SURFACE_RELEASE_BATCH_SIZE = 0xc,
  RENDERER_FULL_SURFACE_RELEASE_FRAME_BUDGET_MS = 0x4,
  VISIBLE_VIDEO_STRUCTURAL_RECONCILE_DELAY_MS = 0x0,
  _mediaPresentation = createRendererMediaPresentationCoordinator({
    getNode: (input) => _currentSnapshot?.['nodes']?.[input],
    getComponent: (output) => _componentMap['get'](output),
    getWrapper: (value2) => _wrapperMap['get'](value2),
    getParkedWrapper: (value3) => _parkedWrapperMap['get'](value3),
    getWrappers: () => _wrapperMap['values'](),
    getParkedWrappers: () => _parkedWrapperMap['values'](),
    isMounted: (value4) => _mountedNodeIds['has'](value4),
    isInteractionBusy: _rendererInteractionGrace['isBusy'],
    isPinned: (value5) => _getNodePinSet(value5, ![])?.['size'] > 0x0,
    isSelected: (value6) => {
      const list = _currentSnapshot?.['selectedNodeIds'];
      return Array['isArray'](list)
        ? list['includes'](value6)
        : list?.['has']?.(value6) === !![];
    },
    preview: _fastPreviewLayer,
    previewRelease: _fastPreviewRelease,
    videoSlots: _sourceVideoSlotLifecycle,
    batchSize: RENDERER_DEFERRED_MEDIA_HYDRATION_BATCH_SIZE,
    presentedMediaLeaseMs: RENDERER_INACTIVE_PRESENTED_MEDIA_LEASE_MS,
    maxRetainedPresentedMedia: RENDERER_INACTIVE_PRESENTED_MEDIA_LEASE_LIMIT,
    onHydrateDiagnostic: _rendererRuntimeDiagnosticsEnabled
      ? (args2) => recordRendererRuntimeDiagnostic({ kind: 'renderer-media-hydrate', ...args2 })
      : null,
    onParkSuspendDiagnostic: _rendererRuntimeDiagnosticsEnabled
      ? (args3) =>
          recordRendererRuntimeDiagnostic({
            kind: 'video-media-suspend',
            reason: 'park',
            suspended: !![],
            ...args3,
          })
      : null,
  }),
  {
    media: _rendererDeferredMedia,
    details: _nodeDetailHydration,
    residency: _videoMediaResidency,
    videoBackpressure: _videoHydrationBackpressure,
  } = _mediaPresentation,
  _viewportJumpDetector = createRendererViewportJumpDetector(),
  _edgeLayer = createRendererEdgeLayer({
    getContainerSize: _getEdgeContainerSize,
    nowMs: _nowMs,
    recordRedrawSample: recordEdgeRedrawSample,
  }),
  _edgeDomCache = _edgeLayer['getDomCache'](),
  _nodeToEdgeIds = new Map(),
  _incomingEdgeIdsByTarget = new Map(),
  FULL_ELIGIBLE_VISIBLE_IMAGE_RECONCILE_DELAY_MS = 0x0,
  FULL_ELIGIBLE_VISIBLE_IMAGE_SETTLED_BUDGET_DELAY_MS = 0xdc,
  HIGH_ZOOM_STALE_WARMUP_PRELOAD_CANCEL_PRIORITY_LIMIT = 0x96,
  HIGH_ZOOM_STALE_FAST_PREVIEW_PRELOAD_CANCEL_PRIORITY_LIMIT = 0x50,
  HIGH_ZOOM_STALE_PRELOAD_CANCEL_THROTTLE_MS = 0xdc,
  VIEWPORT_INTERACTION_PRELOAD_CANCEL_THROTTLE_MS = 0xb4,
  VIEWPORT_INTERACTION_WARMUP_CANCEL_PRIORITY_LIMIT = 0x96,
  VIEWPORT_INTERACTION_FAST_PREVIEW_CANCEL_PRIORITY_LIMIT = 0x50;
let _lastHighZoomStalePreloadCancelAt = 0x0,
  _lastViewportInteractionPreloadCancelAt = 0x0,
  _lastViewportJumpAt = 0x0;
const SELECTION_RELATED_HIGHLIGHT_COLORS = Object['freeze']([
  'white',
  'blue',
  'green',
  'cyan',
  'purple',
  'red',
  'yellow',
]);
function cancelStaleLowPriorityPreloadsForHighZoom(value7) {
  if (value7 !== !![]) return;
  const value8 =
    typeof performance !== 'undefined' && performance && typeof performance['now'] === 'function'
      ? performance['now']()
      : Date['now']();
  if (
    _lastHighZoomStalePreloadCancelAt > 0x0 &&
    value8 - _lastHighZoomStalePreloadCancelAt < HIGH_ZOOM_STALE_PRELOAD_CANCEL_THROTTLE_MS
  )
    return;
  ((_lastHighZoomStalePreloadCancelAt = value8),
    cancelCanvasVisibleMediaWarmupPreloads({
      includeActive: ![],
      belowPriority: HIGH_ZOOM_STALE_WARMUP_PRELOAD_CANCEL_PRIORITY_LIMIT,
      reason: 'high zoom viewport media priority',
    }),
    cancelRendererFastPreviewMediaPreloads({
      includeActive: ![],
      belowPriority: HIGH_ZOOM_STALE_FAST_PREVIEW_PRELOAD_CANCEL_PRIORITY_LIMIT,
      reason: 'high zoom viewport media priority',
    }));
}
function cancelQueuedViewportInteractionPreloads(value9) {
  if (value9 !== !![]) return;
  const value10 =
    typeof performance !== 'undefined' && performance && typeof performance['now'] === 'function'
      ? performance['now']()
      : Date['now']();
  if (
    _lastViewportInteractionPreloadCancelAt > 0x0 &&
    value10 - _lastViewportInteractionPreloadCancelAt < VIEWPORT_INTERACTION_PRELOAD_CANCEL_THROTTLE_MS
  )
    return;
  ((_lastViewportInteractionPreloadCancelAt = value10),
    cancelCanvasVisibleMediaWarmupPreloads({
      includeActive: ![],
      belowPriority: VIEWPORT_INTERACTION_WARMUP_CANCEL_PRIORITY_LIMIT,
      reason: 'viewport interaction',
    }),
    cancelRendererFastPreviewMediaPreloads({
      includeActive: ![],
      belowPriority: VIEWPORT_INTERACTION_FAST_PREVIEW_CANCEL_PRIORITY_LIMIT,
      reason: 'viewport interaction',
    }));
}
function isViewportPriorityImageNode({
  node: node,
  nodeId: nodeId4,
  mountCandidateIds: mountCandidateIds,
  viewport: viewport,
  containerW: containerW,
  containerH: containerH,
  isSelected: isSelected,
  isSelectionRelated: isSelectionRelated,
} = {}) {
  if (!nodeId4 || !isNodeType(node, ['source-image', 'ai-image'])) return ![];
  if (!mountCandidateIds?.['has']?.(nodeId4)) return ![];
  if (isSelected || isSelectionRelated) return !![];
  return _isNodeVisible(node, viewport, containerW, containerH);
}
function isRendererMediaRuntimeInteractionPriority({
  nodeId: nodeId5,
  isSelected: isSelected2,
  isSelectionRelated: isSelectionRelated2,
  dragTargets: dragTargets,
  connOverlay: connOverlay,
  pickMode: pickMode,
} = {}) {
  if (!nodeId5) return ![];
  return !!(
    isSelected2 ||
    isSelectionRelated2 ||
    dragTargets?.['has']?.(nodeId5) ||
    connOverlay?.['srcId'] === nodeId5 ||
    connOverlay?.['hoverId'] === nodeId5 ||
    pickMode?.['sourceNodeId'] === nodeId5 ||
    pickMode?.['hoverNodeId'] === nodeId5
  );
}
let _edgeIndexRev = -0x1,
  _edgeEntriesRev = -0x1,
  _edgeEntriesSource = null,
  _edgeEntriesCache = [],
  _cachedContainerWidth = null,
  _cachedContainerHeight = null,
  _lastFullEdgeRenderSignature = '',
  _edgeDomClearedSinceLastFull = ![],
  _lastVirtualCandidateSignature = '',
  _lastVirtualCandidateResult = null,
  _containerSizeSourceEl = null,
  _containerResizeObserver = null,
  _containerResizeHandler = null,
  _currentSnapshot = null;
function _getNodePinSet(value11, value12 = ![]) {
  let enabled = _nodePinReasons['get'](value11);
  return (
    !enabled && value12 && ((enabled = new Set()), _nodePinReasons['set'](value11, enabled)),
    enabled || null
  );
}
function _getPinnedNodeIds() {
  const value13 = new Set();
  for (const [value14, value15] of _nodePinReasons['entries']()) {
    value15 && value15['size'] > 0x0 && value13['add'](value14);
  }
  return value13;
}
function _clearNodePin(value16) {
  _nodePinReasons['delete'](value16);
}
function _clearAnchoredUiForNode(enabled2) {
  if (!enabled2) return;
  const value17 = _componentMap['get'](enabled2);
  value17 && typeof value17['highlightCell'] === 'function' && value17['highlightCell'](-0x1);
}
function _resolveVideoMediaLeaseKey(value18, value19) {
  const value20 = _sourceVideoSlotLifecycle['isManagedNode'](value18)
    ? _sourceVideoSlotLifecycle['read'](value18)
    : null;
  return resolveRendererVideoMediaLeaseKey(value19, value20);
}
function _parkNode(value21) {
  const el = _wrapperMap['get'](value21);
  if (!el) return null;
  _sourceVideoSlotLifecycle['isManagedNode'](value21) &&
    (_sourceVideoSlotLifecycle['syncVisibility'](value21, 'far'),
    _sourceVideoSlotLifecycle['setResidency'](value21, 'parked'));
  (_mediaPresentation['forgetHydration'](value21), _nodeTimerController['hideNode'](value21));
  el['isConnected'] && el['remove']();
  const value22 = _componentMap['get'](value21);
  let retainPresentedMedia = ![];
  try {
    retainPresentedMedia = value22?.['hasPresentedRendererMedia']?.() === !![];
  } catch {}
  return (
    _videoMediaResidency['park'](value21, {
      retainPresentedMedia: retainPresentedMedia,
      leaseKey: _resolveVideoMediaLeaseKey(value21, _currentSnapshot?.['nodes']?.[value21]),
    }),
    _mountedNodeIds['delete'](value21),
    _parkedNodeIds['add'](value21),
    _parkedWrapperMap['set'](value21, el),
    _fastPreviewLifecycle['record'](_nodeTypeSnapshotMap['get'](value21)),
    _clearAnchoredUiForNode(value21),
    _nodeRuntimeBridge['unregister'](value21),
    el
  );
}
function _mountNode(value23, el2) {
  const el3 = _wrapperMap['get'](value23);
  if (!el3) return null;
  return (
    _videoMediaResidency['unpark'](value23),
    !el3['isConnected'] && el2['appendChild'](el3),
    _parkedWrapperMap['delete'](value23),
    _parkedNodeIds['delete'](value23),
    _mountedNodeIds['add'](value23),
    _sourceVideoSlotLifecycle['setResidency'](value23, 'mounted'),
    _fastPreviewLifecycle['record'](_nodeTypeSnapshotMap['get'](value23)),
    _nodeRuntimeBridge['register'](value23),
    el3
  );
}
function _flushMountBatch(el4, enabled3) {
  if (!el4 || !enabled3) return;
  if (enabled3['childNodes'] && enabled3['childNodes']['length'] === 0x0) return;
  el4['appendChild'](enabled3);
}
function _destroyNode(value24) {
  (_rendererMediaRuntimePreparer['forget'](value24),
    _mediaPresentation['forget'](value24),
    _nodeTimerController['hideNode'](value24));
  const value25 = _componentMap['get'](value24);
  try {
    value25 && typeof value25['unmount'] === 'function' && value25['unmount']();
  } catch {}
  const el5 = _wrapperMap['get'](value24) || _parkedWrapperMap['get'](value24);
  (el5 && el5['isConnected'] && el5['remove'](),
    _componentMap['delete'](value24),
    _nodeDataSnapshotMap['delete'](value24),
    _sourceVideoSourceKeySnapshotMap['delete'](value24),
    _pendingSourceVideoActivationIds['delete'](value24),
    _wrapperMap['delete'](value24),
    _mountedNodeIds['delete'](value24),
    _parkedNodeIds['delete'](value24),
    _parkedWrapperMap['delete'](value24),
    _pendingNodeDataMap['delete'](value24),
    _nodeTypeSnapshotMap['delete'](value24),
    _nodeRuntimeBridge['unregister'](value24),
    _sourceVideoSlotLifecycle['isManagedNode'](value24) && _sourceVideoSlotLifecycle['forget'](value24),
    _clearNodePin(value24),
    _fastPreviewLayer['discardNode'](value24));
}
function _syncRendererBridge() {
  syncRendererBridge(typeof window === 'undefined' ? null : window, {
    componentMap: _componentMap,
    wrapperMap: _wrapperMap,
    mountedNodeIds: _mountedNodeIds,
    nodeToEdgeIds: _nodeToEdgeIds,
    getEdgeLayerStats: _edgeLayer['getStats'],
    hitTestEdgeAtScreenPoint: _edgeLayer['hitTestEdgeAtScreenPoint'],
    prepareDynamicEdges: _edgeLayer['prepareDynamicEdges'],
    setEdgeInteractionHighlight: _edgeLayer['setActiveEdge'],
    setHoveredEdge: _edgeLayer['setHoveredEdge'],
    markViewportInteractionBusy: _markRasterMediaInteractionBusy,
    releaseViewportInteractionBusy: _releaseRasterMediaInteractionBusy,
    captureRasterPreviewNode: _rasterPreviewCoordinator['captureNodeFrame'],
    excludeRasterPreviewNode: _rasterPreviewCoordinator['excludeNode'],
    syncFastPreviewDragProxy: _fastPreviewLayer['syncNodeDragPreview'],
    releaseFastPreviewForPlayback(enabled4) {
      if (!enabled4) return ![];
      if (_sourceVideoSlotLifecycle['isManagedNode'](enabled4)) return ![];
      const enabled5 = _fastPreviewLayer['releaseNode'](enabled4) === !![];
      if (!enabled5) return ![];
      const el6 = _wrapperMap['get'](enabled4);
      return (
        el6?.['dataset'] && (el6['dataset']['fastPreviewReleasedForPlayback'] = '1'),
        _fastPreviewRelease['forget'](enabled4),
        !![]
      );
    },
    prepareMediaSlotSource(value26, value27, value28 = {}) {
      return _sourceVideoSlotLifecycle['prepareSource'](value26, value27, value28);
    },
    reportMediaSlotFrame: _sourceVideoSlotLifecycle['reportFrame'],
    pinNode(nodeId6, value29 = 'src/ui/') {
      if (!nodeId6) return;
      const _getNodePinSet2 = _getNodePinSet(nodeId6, !![]);
      (_getNodePinSet2['add'](String(value29 || 'src/ui/')),
        _rendererRuntimeDiagnosticsEnabled &&
          recordRendererRuntimeDiagnostic({
            kind: 'renderer-node-pin',
            nodeId: nodeId6,
            reason: String(value29 || 'src/ui/'),
            pinReasons: Array['from'](_getNodePinSet2),
          }));
    },
    unpinNode(nodeId7, value30 = 'src/ui/') {
      if (!nodeId7) return;
      const map = _getNodePinSet(nodeId7, ![]);
      if (!map) return;
      (map['delete'](String(value30 || 'src/ui/')),
        map['size'] === 0x0 &&
          (_nodePinReasons['delete'](nodeId7), _schedulePreparedMediaRuntimeCommit?.()),
        _rendererRuntimeDiagnosticsEnabled &&
          recordRendererRuntimeDiagnostic({
            kind: 'renderer-node-unpin',
            nodeId: nodeId7,
            reason: String(value30 || 'src/ui/'),
            pinReasons: Array['from'](map),
          }));
    },
  });
}
function _rebuildEdgeIndex(value31) {
  (_nodeToEdgeIds['clear'](), _incomingEdgeIdsByTarget['clear']());
  for (const enabled6 of value31 || []) {
    if (!enabled6) continue;
    const value32 = enabled6['sourceId'],
      value33 = enabled6['targetId'];
    if (value32) {
      let enabled7 = _nodeToEdgeIds['get'](value32);
      (!enabled7 && ((enabled7 = new Set()), _nodeToEdgeIds['set'](value32, enabled7)),
        enabled7['add'](enabled6['id']));
    }
    if (value33) {
      let enabled8 = _nodeToEdgeIds['get'](value33);
      !enabled8 && ((enabled8 = new Set()), _nodeToEdgeIds['set'](value33, enabled8));
      enabled8['add'](enabled6['id']);
      let list2 = _incomingEdgeIdsByTarget['get'](value33);
      (!list2 && ((list2 = []), _incomingEdgeIdsByTarget['set'](value33, list2)),
        list2['push'](enabled6['id']));
    }
  }
}
function _ensureEdgeIndex(value34, value35) {
  const value36 = typeof value35 === 'number' ? value35 : 0x0;
  if (value36 === _edgeIndexRev) return;
  const value37 = value34 || {},
    value38 = Object['values'](value37);
  (_rebuildEdgeIndex(value38),
    (_edgeIndexRev = value36),
    (_edgeEntriesCache = value38),
    (_edgeEntriesRev = value36),
    (_edgeEntriesSource = value37));
}
function _getEdgeEntries(value39, value40) {
  const value41 = typeof value40 === 'number',
    value42 = value41 ? value40 : 0x0,
    value43 = value41
      ? value42 === _edgeEntriesRev
      : value42 === _edgeEntriesRev && value39 === _edgeEntriesSource;
  if (value43) return _edgeEntriesCache;
  return (
    (_edgeEntriesCache = Object['values'](value39 || {})),
    (_edgeEntriesRev = value42),
    (_edgeEntriesSource = value39 || null),
    _edgeEntriesCache
  );
}
function _buildSelectionRelatedSets(value44, value45) {
  const map2 =
      value44 instanceof Set ? value44 : new Set(Array['isArray'](value44) ? value44 : []),
    relatedNodeIds = new Set(),
    relatedEdgeIds = new Set();
  if (map2['size'] === 0x0) return { relatedNodeIds: relatedNodeIds, relatedEdgeIds: relatedEdgeIds };
  for (const value46 of map2) {
    const enabled9 = _nodeToEdgeIds['get'](value46);
    if (!enabled9) continue;
    for (const enabled10 of enabled9) {
      if (!enabled10 || relatedEdgeIds['has'](enabled10)) continue;
      const enabled11 = value45?.[enabled10];
      if (!enabled11?.['id']) continue;
      const value47 = enabled11['sourceId'],
        value48 = enabled11['targetId'],
        enabled12 = map2['has'](value47),
        enabled13 = map2['has'](value48);
      if (!enabled12 && !enabled13) continue;
      relatedEdgeIds['add'](enabled11['id']);
      if (value47 && !enabled12) relatedNodeIds['add'](value47);
      if (value48 && !enabled13) relatedNodeIds['add'](value48);
    }
  }
  return { relatedNodeIds: relatedNodeIds, relatedEdgeIds: relatedEdgeIds };
}
function _normalizeSelectionRelatedHighlightColor(value49) {
  const value50 = String(value49 || '')['trim']();
  return SELECTION_RELATED_HIGHLIGHT_COLORS['includes'](value50) ? value50 : 'white';
}
function _syncContainerSizeCache(value51 = _containerSizeSourceEl) {
  const el7 = value51 || _containerSizeSourceEl || null,
    value52 = el7 ? Number(el7['clientWidth']) : Number(window['innerWidth']),
    value53 = el7 ? Number(el7['clientHeight']) : Number(window['innerHeight']);
  return (
    (_cachedContainerWidth = Number['isFinite'](value52) ? value52 : Number(window['innerWidth'])),
    (_cachedContainerHeight = Number['isFinite'](value53) ? value53 : Number(window['innerHeight'])),
    { width: _cachedContainerWidth, height: _cachedContainerHeight }
  );
}
function _nowMs() {
  return typeof performance !== 'undefined' && typeof performance['now'] === 'function'
    ? performance['now']()
    : Date['now']();
}
function _hasCachedContainerSize() {
  return Number['isFinite'](_cachedContainerWidth) && Number['isFinite'](_cachedContainerHeight);
}
function _getCachedContainerSize(value54 = _containerSizeSourceEl, timer = {}) {
  const value55 = value54 || _containerSizeSourceEl || null,
    enabled14 = typeof ResizeObserver === 'function' && !!_containerResizeObserver,
    value56 =
      timer?.['refresh'] === !![] ||
      !_hasCachedContainerSize() ||
      !enabled14 ||
      (value55 && _containerSizeSourceEl && value55 !== _containerSizeSourceEl);
  if (value56) return _syncContainerSizeCache(value55);
  return { width: _cachedContainerWidth, height: _cachedContainerHeight };
}
function _getEdgeContainerSize(value57) {
  const _nowMs2 = _nowMs(),
    box = _getCachedContainerSize(_containerSizeSourceEl || value57),
    _nowMs3 = _nowMs();
  return {
    containerW: Number['isFinite'](box['width']) ? box['width'] : 0x0,
    containerH: Number['isFinite'](box['height']) ? box['height'] : 0x0,
    layoutReadMs: Math['max'](0x0, _nowMs3 - _nowMs2),
  };
}
function _invalidateFullEdgeRenderSignature({ clearedDom: clearedDom = ![] } = {}) {
  ((_lastFullEdgeRenderSignature = ''), clearedDom && (_edgeDomClearedSinceLastFull = !![]));
}
function _notifyVirtualizationProbe(value58) {
  const enabled15 = typeof window !== 'undefined' ? window['__rendererVirtualizationProbe'] : null;
  if (!enabled15 || typeof enabled15['onCandidateSignatureEvaluated'] !== 'function') return;
  try {
    enabled15['onCandidateSignatureEvaluated'](value58);
  } catch {}
}
function _collectMovedNodeIds(state2, value59) {
  const map3 = new Set(state2['selectedNodeIds'] || []),
    value60 = value59?.['targetNodeId'] || null;
  if (value60) map3['add'](value60);
  const value61 = state2['_parentToChildren'] || {},
    list3 = Array['from'](map3);
  for (let value62 = 0x0; value62 < list3['length']; value62++) {
    const value63 = list3[value62],
      enabled16 = value61[value63];
    if (!enabled16 || enabled16['size'] === 0x0) continue;
    for (const value64 of enabled16) {
      !map3['has'](value64) && (map3['add'](value64), list3['push'](value64));
    }
  }
  return map3;
}
function _resolveDragRenderOffset(value65, enabled17) {
  if (!enabled17?.['isDragging']) return null;
  const movedNodeIds = _collectMovedNodeIds(value65, enabled17);
  if (!movedNodeIds || movedNodeIds['size'] === 0x0) return null;
  return {
    movedNodeIds: movedNodeIds,
    dx: Number['isFinite'](enabled17['pendingDx']) ? enabled17['pendingDx'] : 0x0,
    dy: Number['isFinite'](enabled17['pendingDy']) ? enabled17['pendingDy'] : 0x0,
  };
}
export function clearRendererCache() {
  (_rendererMediaRuntimePreparer['clear'](), console['log']('[Renderer] 执行全盘物理清盘...'));
  const value66 = new Set([
    ..._componentMap['keys'](),
    ..._wrapperMap['keys'](),
    ..._parkedWrapperMap['keys'](),
    ..._mountedNodeIds,
    ..._parkedNodeIds,
  ]);
  for (const value67 of value66) {
    _destroyNode(value67);
  }
  (_clearRenderedEdgesFromDocument(),
    _edgeLayer['reset'](),
    _selectionOverlay['reset'](),
    _nodeToEdgeIds['clear'](),
    _incomingEdgeIdsByTarget['clear'](),
    (_edgeIndexRev = -0x1),
    (_edgeEntriesRev = -0x1),
    (_edgeEntriesSource = null),
    (_edgeEntriesCache = []),
    clearCachedEdgeVisibilityIndex(),
    (_cachedContainerWidth = null),
    (_cachedContainerHeight = null),
    (_lastFullEdgeRenderSignature = ''),
    (_edgeDomClearedSinceLastFull = ![]),
    (_lastVirtualCandidateSignature = ''),
    (_lastVirtualCandidateResult = null),
    _fastPreviewContinuation['reset'](),
    _fastPreviewLifecycle['reset'](),
    _sourceVideoSlotLifecycle['reset'](),
    _sourceVideoSourceKeySnapshotMap['clear'](),
    _pendingSourceVideoActivationIds['clear'](),
    (_sourceVideoActivationRev = null),
    (_sourceVideoActivationNodesRef = null),
    clearRendererSpatialIndexCache(),
    _resetSelectionFastPath?.(),
    (_containerSizeSourceEl = null),
    _rendererInteractionGrace['reset'](),
    _viewportJumpDetector['reset'](),
    (_lastViewportJumpAt = 0x0),
    clearRendererViewportMediaPreloadPause(),
    _nodePinReasons['clear'](),
    _pendingNodeDataMap['clear'](),
    _nodeTypeSnapshotMap['clear'](),
    _mediaPresentation['clear'](),
    _fastPreviewLayer['clear'](),
    _rasterPreviewCoordinator['reset'](),
    _nodeTimerController['clear'](),
    (_currentSnapshot = null));
}
export function refreshManifestModelNodeUis() {
  const refreshedNodeIds = [],
    remountedNodeIds = [];
  for (const [value68, value69] of [..._componentMap['entries']()]) {
    const enabled18 = _currentSnapshot?.['nodes']?.[value68];
    if (!enabled18 || !MANIFEST_MODEL_NODE_TYPES['has'](normalizeNodeType(enabled18['type']))) continue;
    if (typeof value69?.['refreshModelRegistryUi'] === 'function')
      try {
        (value69['refreshModelRegistryUi'](), refreshedNodeIds['push'](value68));
        continue;
      } catch (value70) {
        console['warn']('[Renderer] refresh model registry UI failed:', value70);
      }
    (_destroyNode(value68), remountedNodeIds['push'](value68));
  }
  return { refreshedNodeIds: refreshedNodeIds, remountedNodeIds: remountedNodeIds };
}
((window['_edgeDomCache'] = _edgeDomCache), _syncRendererBridge());
function _isNodeVisible(value71, value72, value73, value74, value75 = 0x0, value76 = 0x0) {
  return isNodeInsideViewportPadding(value71, value72, value73, value74, 0xc8, value75, value76);
}
function _renderCullingOnly(value77, value78, value79, value80 = {}) {
  const enabled19 = value80?.['hideInvisible'] !== ![],
    { width: width, height: height } = _getCachedContainerSize(
      value77['parentElement'] || value77,
    );
  for (const value81 of _mountedNodeIds) {
    const enabled20 = value78?.[value81];
    if (!enabled20) continue;
    const el8 = _wrapperMap['get'](value81);
    if (!el8 || !el8['isConnected'] || el8['classList']?.['contains']?.('is-dragging'))
      continue;
    const _isNodeVisible2 = _isNodeVisible(enabled20, value79, width, height);
    if (!_isNodeVisible2) {
      if (!enabled19) continue;
      _nodeTimerController['hideNode'](value81);
      if (el8['style']['display'] !== 'none') el8['style']['display'] = 'none';
    } else {
      _nodeTimerController['trackNode'](value81, enabled20);
      if (el8['style']['display'] === 'none') el8['style']['display'] = '';
    }
  }
}
export function initRenderer(containerEl, canvasEl, value82) {
  ((canvasEl['style']['transformOrigin'] = '0 0'),
    (canvasEl['style']['position'] = 'absolute'),
    (canvasEl['style']['top'] = '0'),
    (canvasEl['style']['left'] = '0'));
  const svgWrapper = _createSvgLayer();
  canvasEl['prepend'](svgWrapper);
  const svgEl = svgWrapper['querySelector']('svg');
  ((_containerSizeSourceEl = canvasEl['parentElement'] || containerEl),
    _syncContainerSizeCache(_containerSizeSourceEl));
  typeof ResizeObserver === 'function' &&
    _containerSizeSourceEl &&
    ((_containerResizeObserver = new ResizeObserver(() => {
      _syncContainerSizeCache(_containerSizeSourceEl);
    })),
    _containerResizeObserver['observe'](_containerSizeSourceEl));
  const el9 = _createPickerEl();
  containerEl['appendChild'](el9);
  const el10 = createPickConnectBannerEl();
  (containerEl['appendChild'](el10), _selectionOverlay['mount'](canvasEl));
  const el11 = _createSelectionRectEl();
  (containerEl['appendChild'](el11), _syncRendererBridge());
  const hasPendingRender = createRendererPresentationSubscription({
    onSnapshot: (value83) => {
      _currentSnapshot = value83;
    },
    flushSelection: (value84) => rendererSelectionFastPath['flushSelectionOnlySnapshot'](value84),
    render: (value85) => {
      (_nodeTimerController['syncSnapshot'](value85), run(value85));
    },
    onSuspend: () => {
      (run2(),
        rendererSelectionFastPath['reset'](),
        _rendererMediaRuntimePreparer['pause'](),
        _mediaPresentation['pause'](),
        _nodeTimerController['clear'](),
        cancelCanvasVisibleMediaWarmupPreloads());
    },
    onResume: () => {
      (_mediaPresentation['resume'](), _rendererMediaRuntimePreparer['resume']());
    },
  });
  let value86 = -0x1,
    value87 = -0x1,
    value88 = -0x1;
  const run3 = (value89, value90) =>
    Number['isFinite'](value89?.['_nodeMembershipRev']) ? value89['_nodeMembershipRev'] : value90;
  let count = 0x0,
    setTimeout2 = null,
    requestAnimationFrame2 = null,
    value91 = !![],
    enabled21 = ![],
    value92 = null;
  function run4(enabled22, enabled23, mode, framePlan) {
    if (!enabled22 || !enabled23) return null;
    const value93 =
      enabled22['ui']?.['selectionRelatedHighlightEnabled'] === ![]
        ? { relatedNodeIds: new Set() }
        : _buildSelectionRelatedSets(enabled22['selectedNodeIds'], enabled22['edges']);
    return _renderNodes(
      canvasEl,
      enabled22['nodes'],
      enabled22['selectedNodeIds'],
      value93['relatedNodeIds'],
      _normalizeSelectionRelatedHighlightColor(enabled22['ui']?.['selectionRelatedHighlightColor']),
      enabled22['connOverlay'],
      enabled22['pickConnectMode'],
      enabled23,
      enabled22['edges'],
      enabled22['_parentToChildren'],
      enabled22['ui']?.['showVideoMeta'] === !![],
      enabled22,
      { deferParking: !![], mode: mode, viewportPriorityMediaOnly: !![], framePlan: framePlan },
    );
  }
  function run2() {
    (setTimeout2 !== null && (clearTimeout(setTimeout2), (setTimeout2 = null)),
      requestAnimationFrame2 !== null && (cancelAnimationFrame(requestAnimationFrame2), (requestAnimationFrame2 = null)));
  }
  function scheduleDeferredReconcile(
    value94 = RENDERER_VIRTUALIZATION_CONFIG['settleDelayMs'],
    { bypassInteractionGrace: bypassInteractionGrace = ![], edgeOnlySnapshot: edgeOnlySnapshot = null } = {},
  ) {
    run2();
    if (!hasPendingRender['isActive']()) return;
    ((value91 = edgeOnlySnapshot === null),
      (setTimeout2 = setTimeout(
        () => {
          setTimeout2 = null;
          if (requestAnimationFrame2 !== null) return;
          requestAnimationFrame2 = requestAnimationFrame(() => {
            requestAnimationFrame2 = null;
            if (hasPendingRender['hasPendingFrame']()) {
              scheduleDeferredReconcile(value94, {
                bypassInteractionGrace: bypassInteractionGrace,
                edgeOnlySnapshot: edgeOnlySnapshot,
              });
              return;
            }
            if (!_currentSnapshot) return;
            if (!bypassInteractionGrace && _rendererInteractionGrace['isBusy']()) {
              scheduleDeferredReconcile(value94, {
                bypassInteractionGrace: bypassInteractionGrace,
                edgeOnlySnapshot: edgeOnlySnapshot,
              });
              return;
            }
            run(_currentSnapshot, {
              skipNodesForDenseEdgeFollowup:
                edgeOnlySnapshot !== null && _currentSnapshot === edgeOnlySnapshot,
            });
          });
        },
        Math['max'](0x0, value94),
      )));
  }
  const value95 = () => {
    if (requestAnimationFrame2 !== null && value91) return;
    scheduleDeferredReconcile(0x0);
  };
  _schedulePreparedMediaRuntimeCommit = value95;
  const rendererSelectionFastPath = createRendererSelectionFastPath({
      ensureEdgeIndex: _ensureEdgeIndex,
      buildSelectionRelatedSets: _buildSelectionRelatedSets,
      hasPendingRender: hasPendingRender['hasPendingFrame'],
      cancelPendingRender: hasPendingRender['cancelPending'],
      setCurrentSnapshot: (value96) => {
        ((_currentSnapshot = value96), hasPendingRender['clearPendingSnapshot']());
      },
      consumeViewport: (value97) => _viewportJumpDetector['consume'](value97),
      flushSelectionUpdate: (value98, value99) => run5(value98, value99),
      renderAffectedEdges: (value100, pathStyle, value101) => {
        if (value100['size'] === 0x0 || pathStyle['ui']?.['connectionLinesVisible'] === ![]) return;
        _renderEdgesByIds(
          svgEl,
          value100,
          pathStyle['edges'] || {},
          pathStyle['nodes'] || {},
          pathStyle['viewport'],
          containerEl,
          null,
          value101,
          { pathStyle: pathStyle['ui']?.['connectionLineStyle'] },
        );
      },
      renderSelectionOverlays: (value102) => {
        _selectionOverlay['render'](value102);
      },
    }),
    value103 = () => rendererSelectionFastPath['reset']();
  _resetSelectionFastPath = value103;
  const rendererPanPreviewReconciler = createRendererPanPreviewReconciler({
    canvasEl: canvasEl,
    svgWrapper: svgWrapper,
    getSnapshot: () => _currentSnapshot,
    hasPendingStoreRender: hasPendingRender['hasPendingFrame'],
    markBusy: _rendererInteractionGrace['markBusy'],
    renderViewport: renderViewport,
    renderNodes: _renderNodes,
    buildSelectionRelatedSets: _buildSelectionRelatedSets,
    normalizeSelectionRelatedHighlightColor: _normalizeSelectionRelatedHighlightColor,
    scheduleDeferredReconcile: scheduleDeferredReconcile,
  });
  installNodeResizeGeometryPreviewer(
    typeof window === 'undefined' ? null : window,
    () => _currentSnapshot,
    _ensureEdgeIndex,
    _nodeToEdgeIds,
    (value104, value105, pathStyle2) =>
      _renderEdgesByIds(
        svgEl,
        value104,
        pathStyle2['edges'] || {},
        value105,
        pathStyle2['viewport'],
        containerEl,
        null,
        null,
        { pathStyle: pathStyle2['ui']?.['connectionLineStyle'] },
      ),
  );
  function run6(viewport2, renderMode = 'steady', framePlan2, { skipNodes: skipNodes = ![] } = {}) {
    const nodeCount = Number['isFinite'](framePlan2?.['nodeCount'])
        ? framePlan2['nodeCount']
        : typeof viewport2['_nodeCount'] === 'number'
          ? viewport2['_nodeCount']
          : Object['keys'](viewport2['nodes'] || {})['length'],
      value106 = run3(viewport2, nodeCount),
      edgesRev = typeof viewport2['_edgesRev'] === 'number' ? viewport2['_edgesRev'] : 0x0,
      geometryRev = Number['isFinite'](viewport2['_nodeGeometryRev'])
        ? viewport2['_nodeGeometryRev']
        : Number['isFinite'](viewport2['_persistRev'])
          ? viewport2['_persistRev']
          : nodeCount,
      edgesRevChanged = edgesRev !== value88,
      nodeStructureChanged = nodeCount !== value86 || value106 !== value87,
      value107 =
        skipNodes || (value92 === viewport2 && renderMode === 'steady' && !nodeStructureChanged && !edgesRevChanged);
    value92 !== null && (value92 = null);
    (nodeStructureChanged || edgesRevChanged) &&
      ((value86 = nodeCount),
      (value87 = value106),
      (value88 = edgesRev),
      _cleanupNodes(canvasEl, viewport2['nodes']),
      _cleanupEdges(svgEl, viewport2['edges']));
    _ensureEdgeIndex(viewport2['edges'], edgesRev);
    const relatedEdgeIds2 =
        viewport2['ui']?.['selectionRelatedHighlightEnabled'] === ![]
          ? { relatedNodeIds: new Set(), relatedEdgeIds: new Set() }
          : _buildSelectionRelatedSets(viewport2['selectedNodeIds'], viewport2['edges']),
      _normalizeSelectionRelatedHighlightColor2 = _normalizeSelectionRelatedHighlightColor(
        viewport2['ui']?.['selectionRelatedHighlightColor'],
      ),
      remainingMs = _rendererInteractionGrace['getRemainingMs'](),
      needed = shouldDeferHeavyMediaForInteractionGrace({
        remainingMs: remainingMs,
        viewport: viewport2['viewport'],
        nodeCount: nodeCount,
        hasPriorityMediaWork: ![],
      }),
      hasPriorityMediaWork = framePlan2?.['hasPriorityMediaWork']?.({ needed: needed }) === !![],
      deferHeavyMediaMount = shouldDeferHeavyMediaForInteractionGrace({
        remainingMs: remainingMs,
        viewport: viewport2['viewport'],
        nodeCount: nodeCount,
        hasPriorityMediaWork: hasPriorityMediaWork,
      }),
      value108 = viewport2['edges'] || {},
      edgeEntries = _getEdgeEntries(value108, edgesRev),
      edgeCount = edgeEntries['length'],
      connectionLinesVisible = viewport2['ui']?.['connectionLinesVisible'] !== ![],
      deferInitialRasterPlanning = shouldDeferDenseStructuralEdgeRender({
        renderMode: renderMode,
        nodeStructureChanged: nodeStructureChanged,
        edgesRevChanged: edgesRevChanged,
        nodeCount: nodeCount,
        edgeCount: edgeCount,
        connectionLinesVisible: connectionLinesVisible,
      }),
      deferDenseStructuralEdgeRender = deferInitialRasterPlanning || enabled21;
    if (deferInitialRasterPlanning) enabled21 = !![];
    else enabled21 && (enabled21 = ![]);
    const {
        hasPendingStructuralOps: hasPendingStructuralOps,
        deferredParkCount: deferredParkCount = 0x0,
        hasPendingVisibleVideoMounts: hasPendingVisibleVideoMounts = ![],
        hasPendingFullEligibleVisibleImageMounts: hasPendingFullEligibleVisibleImageMounts = ![],
      } = value107
        ? {
            hasPendingStructuralOps: ![],
            deferredParkCount: 0x0,
            hasPendingVisibleVideoMounts: ![],
            hasPendingFullEligibleVisibleImageMounts: ![],
          }
        : _renderNodes(
            canvasEl,
            viewport2['nodes'],
            viewport2['selectedNodeIds'],
            relatedEdgeIds2['relatedNodeIds'],
            _normalizeSelectionRelatedHighlightColor2,
            viewport2['connOverlay'],
            viewport2['pickConnectMode'],
            viewport2['viewport'],
            viewport2['edges'],
            viewport2['_parentToChildren'],
            viewport2['ui'] && typeof viewport2['ui']['showVideoMeta'] === 'boolean'
              ? viewport2['ui']['showVideoMeta']
              : ![],
            viewport2,
            {
              mode: renderMode,
              deferHeavyMediaMount: deferHeavyMediaMount,
              deferParking: remainingMs > 0x0,
              fullImageSettleReady:
                _lastViewportJumpAt <= 0x0 ||
                _nowMs() - _lastViewportJumpAt >= FULL_ELIGIBLE_VISIBLE_IMAGE_SETTLED_BUDGET_DELAY_MS,
              deferInitialRasterPlanning: deferInitialRasterPlanning,
              framePlan: framePlan2,
            },
          ),
      el12 = document['documentElement'],
      isManyEdges = edgeCount >= MANY_EDGES_THRESHOLD;
    if (isManyEdges)
      !el12['classList']['contains']('has-many-edges') &&
        el12['classList']['add']('has-many-edges');
    else
      el12['classList']['contains']('has-many-edges') &&
        el12['classList']['remove']('has-many-edges');
    const interactionRenderState = getInteractionRenderState(),
      dragOffsetCtx = _resolveDragRenderOffset(viewport2, interactionRenderState),
      edgePathStyle = normalizeConnectionLineStyle(viewport2['ui']?.['connectionLineStyle']);
    let containerW2 = null,
      cachedEdgeGeometrySignature = '',
      cachedEdgeVisibilityIndex = null;
    function geometrySignature() {
      if (!isManyEdges) return '';
      return (
        !cachedEdgeGeometrySignature &&
          (cachedEdgeGeometrySignature = getCachedEdgeGeometrySignature(edgeEntries, viewport2['nodes'], {
            edgesRev: edgesRev,
            geometryRev: geometryRev,
          })),
        cachedEdgeGeometrySignature
      );
    }
    function edgeVisibilityIndex() {
      if (!connectionLinesVisible || !isManyEdges) return null;
      return (
        !cachedEdgeVisibilityIndex &&
          (cachedEdgeVisibilityIndex = getCachedEdgeVisibilityIndex(edgeEntries, viewport2['nodes'], {
            edgesRev: edgesRev,
            geometryRev: geometryRev,
            geometrySignature: geometrySignature(),
          })),
        cachedEdgeVisibilityIndex
      );
    }
    function run7(enabled24 = ![]) {
      !containerW2 && (containerW2 = _getEdgeContainerSize(containerEl));
      const renderSignature = buildFullEdgeRenderSignature({
        edgeEntries: edgeEntries,
        nodes: viewport2['nodes'],
        viewport: viewport2['viewport'],
        dragOffsetCtx: dragOffsetCtx,
        relatedEdgeIds: relatedEdgeIds2['relatedEdgeIds'],
        containerW: containerW2['containerW'],
        containerH: containerW2['containerH'],
        edgesRev: edgesRev,
        geometryRev: geometryRev,
        geometrySignature: geometrySignature(),
        edgePathStyle: edgePathStyle,
      });
      if (!enabled24 && renderSignature === _lastFullEdgeRenderSignature) return null;
      return {
        containerSize: containerW2,
        renderSignature: renderSignature,
        geometryRevisionKey: 'edges:' + edgesRev + '|nodes:' + geometryRev,
        pathStyle: edgePathStyle,
      };
    }
    if (deferDenseStructuralEdgeRender)
      (_invalidateFullEdgeRenderSignature(),
        shouldPrepareDenseStructuralEdgeFollowup({
          deferDenseStructuralFrame: deferInitialRasterPlanning,
          deferDenseStructuralEdgeRender: deferDenseStructuralEdgeRender,
          connectionLinesVisible: connectionLinesVisible,
          isManyEdges: isManyEdges,
        }) && edgeVisibilityIndex());
    else {
      if (!connectionLinesVisible) _clearRenderedEdges(svgEl);
      else {
        if (edgesRevChanged) {
          if (edgesRevChanged) _ensureEdgeIndex(viewport2['edges'], edgesRev);
          const args4 = run7(!![]);
          _renderEdges(
            svgEl,
            value108,
            viewport2['nodes'],
            viewport2['viewport'],
            containerEl,
            dragOffsetCtx,
            relatedEdgeIds2['relatedEdgeIds'],
            edgeEntries,
            'edges-rev-changed',
            { ...args4, edgeVisibilityIndex: edgeVisibilityIndex() },
          );
        } else {
          if (interactionRenderState['isDragging']) {
            _ensureEdgeIndex(viewport2['edges'], edgesRev);
            const enabled25 = dragOffsetCtx?.['movedNodeIds'] || _collectMovedNodeIds(viewport2, interactionRenderState),
              value109 = new Set();
            for (const value110 of enabled25) {
              const enabled26 = _nodeToEdgeIds['get'](value110);
              if (!enabled26) continue;
              for (const value111 of enabled26) value109['add'](value111);
            }
            if (value109['size'] > 0x0)
              _renderEdgesByIds(
                svgEl,
                value109,
                value108,
                viewport2['nodes'],
                viewport2['viewport'],
                containerEl,
                dragOffsetCtx,
                relatedEdgeIds2['relatedEdgeIds'],
                { containerSize: containerW2 || null, pathStyle: edgePathStyle },
              );
            else {
              if (!enabled25 || enabled25['size'] === 0x0) {
                const args5 = run7(![]);
                args5 &&
                  _renderEdges(
                    svgEl,
                    value108,
                    viewport2['nodes'],
                    viewport2['viewport'],
                    containerEl,
                    dragOffsetCtx,
                    relatedEdgeIds2['relatedEdgeIds'],
                    edgeEntries,
                    'drag-related-edges-unavailable',
                    { ...args5, edgeVisibilityIndex: edgeVisibilityIndex() },
                  );
              }
            }
          } else {
            const args6 = run7(![]);
            args6 &&
              _renderEdges(
                svgEl,
                value108,
                viewport2['nodes'],
                viewport2['viewport'],
                containerEl,
                dragOffsetCtx,
                relatedEdgeIds2['relatedEdgeIds'],
                edgeEntries,
                'steady',
                { ...args6, edgeVisibilityIndex: edgeVisibilityIndex() },
              );
          }
        }
      }
    }
    (_renderPicker(el9, viewport2['picker'], value82),
      _renderSelectionRect(el11, viewport2['selectionBox']),
      _selectionOverlay['render'](viewport2),
      renderPickConnectBanner(el10, viewport2['pickConnectMode']));
    if (deferDenseStructuralEdgeRender) {
      const edgeOnlySnapshot2 = shouldUseDenseStructuralEdgeOnlyFollowup({
        deferDenseStructuralFrame: deferInitialRasterPlanning,
        deferDenseStructuralEdgeRender: deferDenseStructuralEdgeRender,
        hasPendingStructuralOps: hasPendingStructuralOps,
      });
      ((value92 = edgeOnlySnapshot2 ? viewport2 : null),
        scheduleDeferredReconcile(0x0, { bypassInteractionGrace: !![], edgeOnlySnapshot: edgeOnlySnapshot2 ? viewport2 : null }));
    } else {
      if (hasPendingStructuralOps) {
        const rendererLowZoomMountLimit =
          resolveRendererLowZoomMountLimit({ viewport: viewport2['viewport'], nodeCount: nodeCount }) > 0x0;
        scheduleDeferredReconcile(
          Math['min'](
            getRendererStructuralReconcileDelayMs(nodeCount),
            hasPendingVisibleVideoMounts
              ? VISIBLE_VIDEO_STRUCTURAL_RECONCILE_DELAY_MS
              : hasPendingFullEligibleVisibleImageMounts
                ? FULL_ELIGIBLE_VISIBLE_IMAGE_RECONCILE_DELAY_MS
                : rendererLowZoomMountLimit
                  ? 0x168
                  : 0x60,
          ),
          { bypassInteractionGrace: hasPendingFullEligibleVisibleImageMounts === !![] },
        );
      } else remainingMs > 0x0 && scheduleDeferredReconcile(remainingMs + 0x10);
    }
    rendererSelectionFastPath['rememberRenderedSnapshot'](viewport2);
  }
  function run(snapshot, { skipNodesForDenseEdgeFollowup: skipNodesForDenseEdgeFollowup = ![] } = {}) {
    if (!snapshot || !hasPendingRender['isActive']()) return;
    const isPerfProbeEnabled2 = isPerfProbeEnabled(),
      value112 =
        isPerfProbeEnabled2 && typeof performance !== 'undefined' && typeof performance['now'] === 'function'
          ? performance['now']()
          : 0x0;
    let mode2 = 'steady';
    try {
      const interactionState = getInteractionRenderState(),
        viewportPanPreview = getViewportPanPreview(),
        viewportInteractionState = readViewportInteractionState({ interactionState: interactionState }),
        interactionActive =
          viewportPanPreview && !viewportInteractionState['isViewportBusy']
            ? readViewportInteractionState({ interactionState: interactionState, panPreviewActive: !![] })
            : viewportInteractionState,
        nodeCount2 =
          typeof snapshot['_nodeCount'] === 'number'
            ? snapshot['_nodeCount']
            : Object['keys'](snapshot['nodes'] || {})['length'],
        value113 = run3(snapshot, nodeCount2),
        value114 = typeof snapshot['_edgesRev'] === 'number' ? snapshot['_edgesRev'] : 0x0,
        value115 =
          (interactionState['isDragging'] || interactionState['isDraggingCell']) && interactionState['isCommittingDrag'] !== !![],
        enabled27 = nodeCount2 !== value86 || value113 !== value87,
        enabled28 = value115 && (enabled27 || value114 !== value88),
        value116 = !interactionActive['isViewportBusy'] && _viewportJumpDetector['consume'](snapshot['viewport']);
      (interactionActive['isViewportBusy'] || value115 || value116) && _rendererMediaRuntimePreparer['pause']();
      const remainingMs2 = _rendererInteractionGrace['getRemainingMs'](),
        viewport3 = interactionActive['isViewportBusy'] ? viewportPanPreview || snapshot['viewport'] : snapshot['viewport'];
      let value117 = null;
      const run8 = () => {
          return (
            (value117 ||= createRendererFramePlan({
              snapshot: snapshot,
              viewport: viewport3,
              containerRect: _getCachedContainerSize(_containerSizeSourceEl),
              nodeCount: nodeCount2,
            })),
            value117
          );
        },
        value118 =
          interactionActive['isViewportBusy'] !== !![] &&
          value116 !== !![] &&
          shouldPauseViewportMediaForInteractionGrace({
            remainingMs: remainingMs2,
            viewport: snapshot['viewport'],
            nodeCount: nodeCount2,
            hasPriorityMediaWork: ![],
          }),
        hasPriorityMediaWork2 = value118 ? run8()['hasPriorityMediaWork']() : ![],
        value119 =
          interactionActive['isViewportBusy'] ||
          value116 ||
          shouldPauseViewportMediaForInteractionGrace({
            remainingMs: remainingMs2,
            viewport: snapshot['viewport'],
            nodeCount: nodeCount2,
            hasPriorityMediaWork: hasPriorityMediaWork2,
          });
      (syncRendererViewportMediaPreloadPause(value119), cancelQueuedViewportInteractionPreloads(value119));
      const shouldHydratePriorityMediaDuringViewportInteraction2 = shouldHydratePriorityMediaDuringViewportInteraction({
          interactionActive:
            interactionActive['isViewportAnimating'] || interactionActive['isPanning'] || interactionActive['isZooming'],
          hasPriorityMediaWork: hasPriorityMediaWork2,
        }),
        viewportInteractionReconcileDelay = resolveViewportInteractionReconcileDelay({ hasPriorityMediaWork: hasPriorityMediaWork2 });
      renderViewport(canvasEl, viewport3, snapshot['ui']?.['titleFollowsCanvasZoom'] === !![]);
      if (interactionActive['isViewportAnimating']) {
        (_rendererInteractionGrace['markBusy'](),
          (mode2 = shouldHydratePriorityMediaDuringViewportInteraction2 ? 'viewport-animating-priority-media' : 'viewport-animating'));
        if (svgWrapper['style']['display'] === 'none') svgWrapper['style']['display'] = '';
        shouldHydratePriorityMediaDuringViewportInteraction2 && run4(snapshot, viewport3, mode2, run8());
        scheduleDeferredReconcile(viewportInteractionReconcileDelay);
        return;
      }
      if (interactionActive['isPanning']) {
        (_rendererInteractionGrace['markBusy'](), (mode2 = 'panning'));
        const value120 = performance['now']();
        value120 - count > 0x50 &&
          ((count = value120), _renderCullingOnly(canvasEl, snapshot['nodes'], viewport3));
        if (svgWrapper['style']['display'] === 'none') svgWrapper['style']['display'] = '';
        scheduleDeferredReconcile(viewportInteractionReconcileDelay);
        return;
      }
      if (value115 && !enabled28) {
        (_rendererInteractionGrace['markBusy'](), (mode2 = 'dragging'));
        if (svgWrapper['style']['display'] === 'none') svgWrapper['style']['display'] = '';
        scheduleDeferredReconcile();
        return;
      }
      if (interactionActive['isZooming']) {
        (_rendererInteractionGrace['markBusy'](),
          (mode2 = shouldHydratePriorityMediaDuringViewportInteraction2 ? 'zooming-priority-media' : 'zooming'));
        if (svgWrapper['style']['display'] === 'none') svgWrapper['style']['display'] = '';
        shouldHydratePriorityMediaDuringViewportInteraction2 && run4(snapshot, viewport3, mode2, run8());
        scheduleDeferredReconcile(viewportInteractionReconcileDelay);
        return;
      }
      if (consumeRendererNodeDragCommitHint() && !enabled27 && value114 === value88) {
        ((mode2 = 'drag-commit-deferred'), _rendererInteractionGrace['markBusy']());
        if (svgWrapper['style']['display'] === 'none') svgWrapper['style']['display'] = '';
        scheduleDeferredReconcile(RENDERER_VIRTUALIZATION_CONFIG['dragCommitReconcileDelayMs']);
        return;
      }
      if (enabled28) (_rendererInteractionGrace['markBusy'](), (mode2 = 'dragging-structural'));
      else
        value116
          ? (_rendererInteractionGrace['markBusy'](),
            (mode2 = 'viewport-jump'),
            (_lastViewportJumpAt = _nowMs()),
            run2())
          : (run2(), _rendererInteractionGrace['markIdle']());
      if (svgWrapper['style']['display'] === 'none') svgWrapper['style']['display'] = '';
      (run6(
        snapshot,
        skipNodesForDenseEdgeFollowup ? 'dense-edge-followup' : mode2,
        skipNodesForDenseEdgeFollowup ? null : run8(),
        { skipNodes: skipNodesForDenseEdgeFollowup },
      ),
        !enabled28 && (_mediaPresentation['resume'](), _rendererMediaRuntimePreparer['resume']()));
    } finally {
      if (isPerfProbeEnabled2 && typeof performance !== 'undefined' && typeof performance['now'] === 'function') {
        const nodeCount3 =
          typeof snapshot['_nodeCount'] === 'number'
            ? snapshot['_nodeCount']
            : Object['keys'](snapshot['nodes'] || {})['length'];
        recordRenderFrameSample({
          mode: mode2,
          durationMs: performance['now']() - value112,
          nodeCount: nodeCount3,
          edgeCount: Object['keys'](snapshot['edges'] || {})['length'],
          mountedNodeCount: _mountedNodeIds['size'],
          parkedNodeCount: _parkedNodeIds['size'],
          ..._fastPreviewLayer['getStats'](),
        });
      }
    }
  }
  function flushNode(enabled29) {
    if (!enabled29 || !hasPendingRender['isActive']()) return ![];
    const pickMode2 = _currentSnapshot,
      node2 = pickMode2?.['nodes']?.[enabled29];
    if (!node2) return ![];
    const enabled30 = _componentMap['get'](enabled29),
      el13 = _wrapperMap['get'](enabled29);
    if (!enabled30 || typeof enabled30['update'] !== 'function') return ![];
    if (!_mountedNodeIds['has'](enabled29) || !el13?.['isConnected']) return ![];
    const map4 = new Set(pickMode2['selectedNodeIds'] || []),
      isSelected3 = map4['has'](enabled29),
      map5 = _buildSelectionRelatedSets(map4, pickMode2['edges'] || {})['relatedNodeIds'],
      isSelectionRelated3 = !isSelected3 && map5['has'](enabled29),
      inEdgeSig = _getIncomingEdgeSignature(enabled29, pickMode2['edges'] || {}, pickMode2['nodes'] || {}),
      mediaLodMode2 = syncNodeMediaLodMode(el13, node2, pickMode2['viewport']),
      rendererNodeSignature = buildRendererNodeSignature({
        node: node2,
        inEdgeSig: inEdgeSig,
        pickMode: pickMode2['pickConnectMode'],
        isSelected: isSelected3,
        isSelectionRelated: isSelectionRelated3,
        showVideoMeta: pickMode2['ui']?.['showVideoMeta'] === !![],
        viewport: pickMode2['viewport'],
        mediaLodMode: mediaLodMode2,
      });
    return (
      _pendingNodeDataMap['delete'](enabled29),
      _nodeDataSnapshotMap['set'](enabled29, rendererNodeSignature),
      enabled30['update'](node2),
      !![]
    );
  }
  function flushNodes(value121) {
    const list4 = Array['isArray'](value121) ? value121 : [value121];
    let value122 = ![];
    for (const value123 of new Set(list4['filter'](Boolean))) {
      value122 = flushNode(value123) || value122;
    }
    return value122;
  }
  function flushSelection(value124, value125 = {}) {
    if (!hasPendingRender['isActive']()) return ![];
    if (value125?.['settleInteraction'] === !![]) {
      const edges = _currentSnapshot;
      if (edges && edges['ui']?.['connectionLinesVisible'] !== ![]) {
        const relatedEdgeIds3 =
            edges['ui']?.['selectionRelatedHighlightEnabled'] === ![]
              ? { relatedEdgeIds: new Set() }
              : _buildSelectionRelatedSets(edges['selectedNodeIds'] || [], edges['edges'] || {}),
          value126 = _edgeLayer['settleDynamicEdges']({
            svgEl: svgEl,
            edges: edges['edges'] || {},
            nodes: edges['nodes'] || {},
            viewport: edges['viewport'],
            containerEl: containerEl,
            relatedEdgeIds: relatedEdgeIds3['relatedEdgeIds'],
            options: { pathStyle: edges['ui']?.['connectionLineStyle'] },
          });
        if (value126['mutated']) _invalidateFullEdgeRenderSignature();
      }
      return run5(value124);
    }
    if (
      rendererSelectionFastPath['flushSelectionOnlySnapshot'](_currentSnapshot, {
        allowPendingRaf: !![],
        cancelPendingRaf: !![],
      })
    )
      return !![];
    return run5(value124);
  }
  function run5(enabled31, skipInstanceUpdate2 = {}) {
    if (!enabled31) return ![];
    const parentToChildren = _currentSnapshot,
      enabled32 = parentToChildren?.['nodes'] || {};
    if (!parentToChildren || !enabled32) return ![];
    const list5 = Array['isArray'](enabled31) ? enabled31 : [enabled31],
      value127 = Array['isArray'](parentToChildren['selectedNodeIds']) ? parentToChildren['selectedNodeIds'] : [],
      selectedNodeSet = new Set(value127),
      selectedNodeRankMap = buildSelectedNodeRankMap(value127),
      value128 = parentToChildren['edges'] || {},
      value129 = typeof parentToChildren['_edgesRev'] === 'number' ? parentToChildren['_edgesRev'] : 0x0;
    _ensureEdgeIndex(value128, value129);
    const value130 =
        parentToChildren['ui']?.['selectionRelatedHighlightEnabled'] === ![]
          ? { relatedNodeIds: new Set() }
          : _buildSelectionRelatedSets(selectedNodeSet, value128),
      relatedNodeIds2 = value130['relatedNodeIds'] || new Set(),
      relatedHighlightColor = _normalizeSelectionRelatedHighlightColor(
        parentToChildren['ui']?.['selectionRelatedHighlightColor'],
      ),
      viewport4 = parentToChildren['viewport'] || { x: 0x0, y: 0x0, zoom: 0x1 },
      { width: width2, height: height2 } = _getCachedContainerSize(
        canvasEl['parentElement'] || canvasEl,
      ),
      dragContext = getInteractionRenderState(),
      dragTargets2 = buildRendererDragTargetSet({
        dragContext: dragContext,
        selectedNodeSet: selectedNodeSet,
        parentToChildren: parentToChildren['_parentToChildren'] || {},
      }),
      showVideoMeta =
        parentToChildren['ui'] && typeof parentToChildren['ui']['showVideoMeta'] === 'boolean'
          ? parentToChildren['ui']['showVideoMeta']
          : ![];
    let value131 = ![];
    for (const nodeId8 of new Set(list5['filter'](Boolean))) {
      const node3 = enabled32[nodeId8],
        wrapperEl = _wrapperMap['get'](nodeId8);
      if (!node3 || !_mountedNodeIds['has'](nodeId8) || !wrapperEl?.['isConnected']) continue;
      const isSelected4 = selectedNodeSet['has'](nodeId8),
        isSelectionRelated4 = !isSelected4 && relatedNodeIds2['has'](nodeId8),
        inEdgeSig2 = _getIncomingEdgeSignature(nodeId8, value128, enabled32),
        mediaLodMode3 = syncNodeMediaLodMode(wrapperEl, node3, viewport4),
        signature = buildRendererNodeSignature({
          node: node3,
          inEdgeSig: inEdgeSig2,
          pickMode: parentToChildren['pickConnectMode'],
          isSelected: isSelected4,
          isSelectionRelated: isSelectionRelated4,
          showVideoMeta: showVideoMeta,
          viewport: viewport4,
          mediaLodMode: mediaLodMode3,
        });
      _syncMountedNodePresentation({
        wrapperEl: wrapperEl,
        node: node3,
        nodeId: nodeId8,
        selectedNodeSet: selectedNodeSet,
        selectedNodeRankMap: selectedNodeRankMap,
        connOverlay: parentToChildren['connOverlay'],
        pickMode: parentToChildren['pickConnectMode'],
        viewport: viewport4,
        containerW: width2,
        containerH: height2,
        dragContext: dragContext,
        dragTargets: dragTargets2,
        showVideoMeta: showVideoMeta,
        relatedNodeIds: relatedNodeIds2,
        relatedHighlightColor: relatedHighlightColor,
        inEdgeSig: inEdgeSig2,
        signature: signature,
        mediaLodMode: mediaLodMode3,
        skipInstanceUpdate: skipInstanceUpdate2?.['skipInstanceUpdate'] !== ![],
      });
      if (
        shouldHydrateVideoMediaImmediately({
          node: node3,
          nodeId: nodeId8,
          isSelected: isSelected4,
          isSelectionRelated: isSelectionRelated4,
          dragTargets: dragTargets2,
          connOverlay: parentToChildren['connOverlay'],
          pickMode: parentToChildren['pickConnectMode'],
        })
      ) {
        if (_componentMap['get'](nodeId8)?.['_rendererMediaDeferred'] === !![])
          _videoHydrationBackpressure['markPriorityWork']();
        _rendererDeferredMedia['hydrateNow'](nodeId8);
      }
      value131 = !![];
    }
    return value131;
  }
  typeof window !== 'undefined' &&
    ((window['v2Renderer'] = window['v2Renderer'] || {}),
    Object['assign'](window['v2Renderer'], {
      flushNode: flushNode,
      flushNodes: flushNodes,
      flushSelection: flushSelection,
    }));
  hasPendingRender['connect'](value82);
  const value132 = () => {
    (hasPendingRender['dispose'](),
      rendererSelectionFastPath['reset'](),
      _resetSelectionFastPath === value103 && (_resetSelectionFastPath = null),
      run2(),
      rendererPanPreviewReconciler['dispose'](),
      _rendererMediaRuntimePreparer['clear'](),
      _schedulePreparedMediaRuntimeCommit === value95 && (_schedulePreparedMediaRuntimeCommit = null),
      _fastPreviewContinuation['reset'](),
      _containerResizeObserver &&
        (_containerResizeObserver['disconnect'](), (_containerResizeObserver = null)),
      (_containerResizeHandler = null),
      (_containerSizeSourceEl = null),
      _mediaPresentation['clear'](),
      _sourceVideoSourceKeySnapshotMap['clear'](),
      _pendingSourceVideoActivationIds['clear'](),
      (_sourceVideoActivationRev = null),
      (_sourceVideoActivationNodesRef = null),
      _nodeTimerController['clear'](),
      (_currentSnapshot = null),
      clearRendererViewportMediaPreloadPause(),
      svgWrapper?.['remove']?.(),
      el9?.['remove']?.(),
      el10?.['remove']?.(),
      _selectionOverlay['unmount'](),
      el11?.['remove']?.());
  };
  return ((value132['setPresentationActive'] = hasPendingRender['setActive']), value132);
}
function _buildGroupOutputOrderSignature(value133, value134) {
  const list6 = [],
    value135 = Array['isArray'](value133?.['groupOutputSourceOrder'])
      ? value133['groupOutputSourceOrder']
          ['map']((value136) => String(value136 || '')['trim']())
          ['join']('>')
      : '';
  if (value135) list6['push']('global:' + value135);
  const value137 = String(value134 || '')['trim'](),
    value138 = value133?.['groupOutputSourceOrderByTarget'],
    value139 =
      value137 &&
      value138 &&
      typeof value138 === 'object' &&
      !Array['isArray'](value138) &&
      Array['isArray'](value138[value137])
        ? value138[value137]['map']((value140) => String(value140 || '')['trim']())['join']('>')
        : '';
  if (value139) list6['push']('target:' + value139);
  return list6['join']('|');
}
function _getIncomingEdgeSignature(value141, value142, value143) {
  const list7 = [],
    value144 = String(value143?.[value141]?.['parentId'] || '')['trim'](),
    list8 = [['direct', value141]];
  if (value144 && isNodeType(value143?.[value144], 'group'))
    list8['push'](['shared:' + value144, value144]);
  for (const [value145, value146] of list8) {
    for (const value147 of _incomingEdgeIdsByTarget['get'](value146) || []) {
      const enabled33 = value142?.[value147];
      if (!enabled33 || enabled33['targetId'] !== value146) continue;
      const value148 = value143?.[enabled33['sourceId']],
        value149 = typeof value148?.['_bizRev'] === 'number' ? value148['_bizRev'] : 0x0,
        value150 = String(enabled33['refSlot'] || ''),
        _buildGroupOutputOrderSignature2 = _buildGroupOutputOrderSignature(enabled33, value141);
      list7['push'](
        value145 +
          ':' +
          enabled33['id'] +
          ':' +
          enabled33['sourceId'] +
          ':' +
          value150 +
          ':' +
          value149 +
          ':' +
          buildGroupOutputMembershipSignature(value148, value143) +
          ':' +
          _buildGroupOutputOrderSignature2,
      );
    }
  }
  return list7['join'](',');
}
function _registerNodeRuntime(enabled34) {
  if (!enabled34?.['nodeId'] || !enabled34['wrapperEl'] || !enabled34['instance']) return null;
  const el14 = document['getElementById'](enabled34['nodeId']);
  return (
    el14 &&
      el14 !== enabled34['wrapperEl'] &&
      !_wrapperMap['has'](enabled34['nodeId']) &&
      el14['remove'](),
    _componentMap['set'](enabled34['nodeId'], enabled34['instance']),
    _wrapperMap['set'](enabled34['nodeId'], enabled34['wrapperEl']),
    _nodeTypeSnapshotMap['set'](enabled34['nodeId'], enabled34['canonicalType']),
    enabled34
  );
}
function _createNodeRuntime(node4, selectedNodeSet2, selectedNodeRankMap2, dragContext2, dragTargets3, options2 = {}) {
  return _registerNodeRuntime(
    prepareRendererNodeRuntime({
      node: node4,
      selectedNodeSet: selectedNodeSet2,
      selectedNodeRankMap: selectedNodeRankMap2,
      dragContext: dragContext2,
      dragTargets: dragTargets3,
      options: options2,
    }),
  );
}
function _ensureVideoMetaEl(el15, value151) {
  if (!el15['__v2_video_meta_el']) {
    const el16 = document['createElement']('div');
    ((el16['className'] = 'node-video-meta'),
      (el16['dataset']['nodeId'] = value151),
      (el16['dataset']['visible'] = '0'),
      (el16['textContent'] = ''),
      el15['appendChild'](el16),
      (el15['__v2_video_meta_el'] = el16));
  }
}
function _buildNodePresentationStableKey({
  node: node5,
  nodeId: nodeId9,
  signature: signature2,
  visible: visible,
  isSelected: isSelected5,
  isSelectionRelated: isSelectionRelated5,
  relatedHighlightColor: relatedHighlightColor2,
  connOverlay: connOverlay2,
  pickMode: pickMode3,
  showVideoMeta: showVideoMeta2,
  focused: focused,
} = {}) {
  const value152 = connOverlay2?.['srcId'] === nodeId9 ? '1' : '0',
    value153 = connOverlay2?.['hoverId'] === nodeId9 ? '1' : '0',
    value154 = connOverlay2?.['invalidNodeIds']?.['includes']?.(nodeId9) ? '1' : '0',
    value155 = pickMode3?.['active'] && pickMode3['sourceNodeId'] === nodeId9 ? '1' : '0',
    value156 = pickMode3?.['active'] && pickMode3['hoverNodeId'] === nodeId9 ? '1' : '0',
    value157 =
      showVideoMeta2 && isNodeType(node5, ['source-video', 'ai-video'])
        ? [
            node5?.['videoFps'] || '',
            node5?.['videoFrameCount'] || '',
            node5?.['videoWidth'] || '',
            node5?.['videoHeight'] || '',
          ]['join'](',')
        : '';
  return [
    signature2 || '',
    visible ? '1' : '0',
    isSelected5 ? '1' : '0',
    isSelectionRelated5 ? '1' : '0',
    relatedHighlightColor2 || '',
    value152,
    value153,
    value154,
    String(connOverlay2?.['side'] || ''),
    value155,
    value156,
    String(pickMode3?.['handleDirection'] || ''),
    showVideoMeta2 ? '1' : '0',
    value157,
    node5?.['generationStartTime'] || '',
    node5?.['generationDuration'] ?? '',
    resolveGenerationUiState(node5),
    focused ? '1' : '0',
  ]['join']('|');
}
function _syncMountedNodePresentation({
  wrapperEl: wrapperEl2,
  node: node6,
  nodeId: nodeId10,
  selectedNodeSet: selectedNodeSet3,
  selectedNodeRankMap: selectedNodeRankMap3,
  connOverlay: connOverlay3,
  pickMode: pickMode4,
  viewport: viewport5,
  containerW: containerW3,
  containerH: containerH2,
  dragContext: dragContext3,
  dragTargets: dragTargets4,
  showVideoMeta: showVideoMeta3,
  relatedNodeIds: relatedNodeIds3,
  relatedHighlightColor: relatedHighlightColor3,
  inEdgeSig: inEdgeSig3,
  signature: signature3,
  mediaLodMode: mediaLodMode = null,
  skipInstanceUpdate: skipInstanceUpdate = ![],
  deferInstanceUpdate: deferInstanceUpdate = ![],
  mountedThisFrame: mountedThisFrame = ![],
  lifecycleStats: lifecycleStats = null,
  allowActiveDetailHydration: allowActiveDetailHydration = !![],
}) {
  let deferredUpdate = ![],
    didUpdate = ![];
  const value158 =
      node6['x'] + ',' + node6['y'] + ',' + node6['width'] + ',' + node6['height'],
    positionChanged = wrapperEl2['_posKey'] !== value158,
    active2 = dragContext3?.['isDragging'] && dragTargets4 && dragTargets4['has'](nodeId10),
    offsetX = active2 ? (Number['isFinite'](dragContext3['pendingDx']) ? dragContext3['pendingDx'] : 0x0) : 0x0,
    offsetY = active2 ? (Number['isFinite'](dragContext3['pendingDy']) ? dragContext3['pendingDy'] : 0x0) : 0x0,
    visible2 = _isNodeVisible(node6, viewport5, containerW3, containerH2, offsetX, offsetY),
    value159 = _componentMap['get'](nodeId10);
  mediaLodMode === null && syncNodeMediaLodMode(wrapperEl2, node6, viewport5);
  positionChanged &&
    ((wrapperEl2['_posKey'] = value158),
    (wrapperEl2['style']['width'] = node6['width'] + 'px'),
    (wrapperEl2['style']['height'] = node6['height'] + 'px'));
  syncRendererNodeDragTransform(wrapperEl2, node6, {
    active: active2,
    offsetX: offsetX,
    offsetY: offsetY,
    positionChanged: positionChanged,
  });
  isNodeType(node6, ['source-video', 'ai-video']) && _ensureVideoMetaEl(wrapperEl2, nodeId10);
  const value160 = dragContext3['isDragging'] === !![] && dragTargets4?.['has']?.(nodeId10) === !![];
  value160 ? wrapperEl2['classList']['add']('is-dragging') : wrapperEl2['classList']['remove']('is-dragging');
  value160 && (dragContext3['hasMoved'] || !dragContext3['wasSelectedOnDown'])
    ? wrapperEl2['classList']['add']('is-ui-hidden')
    : wrapperEl2['classList']['remove']('is-ui-hidden');
  const isSelected6 = selectedNodeSet3['has'](nodeId10),
    isSelectionRelated6 = !isSelected6 && relatedNodeIds3?.['has'](nodeId10);
  if (!visible2) {
    value159 &&
      typeof value159['syncSelectionState'] === 'function' &&
      value159['syncSelectionState']({ selected: ![], singleSelected: ![], visible: ![] });
    _nodeTimerController['hideNode'](nodeId10);
    wrapperEl2['style']['display'] !== 'none' && (wrapperEl2['style']['display'] = 'none');
    if (
      value159?.['update'] &&
      !skipInstanceUpdate &&
      signature3 !== _nodeDataSnapshotMap['get'](nodeId10)
    ) {
      const shouldKeepHiddenHeavyMediaUpdatePending2 = shouldKeepHiddenHeavyMediaUpdatePending({
        node: node6,
        nodeId: nodeId10,
        isSelected: isSelected6,
        dragTargets: dragTargets4,
      });
      if (deferInstanceUpdate || shouldKeepHiddenHeavyMediaUpdatePending2)
        (_pendingNodeDataMap['set'](nodeId10, { node: node6, signature: signature3 }),
          recordRendererLifecycleSkippedUpdate(lifecycleStats));
      else {
        _nodeDataSnapshotMap['set'](nodeId10, signature3);
        const value161 = lifecycleStats ? _nowMs() : 0x0;
        (value159['update'](node6),
          (didUpdate = !![]),
          lifecycleStats &&
            recordRendererLifecycleDuration(
              lifecycleStats,
              'update',
              node6,
              _nowMs() - value161,
              'hidden',
            ));
      }
    } else
      value159?.['update'] &&
        skipInstanceUpdate &&
        signature3 !== _nodeDataSnapshotMap['get'](nodeId10) &&
        recordRendererLifecycleSkippedUpdate(lifecycleStats);
    return { deferredUpdate: deferredUpdate, didUpdate: didUpdate };
  }
  wrapperEl2['style']['display'] === 'none' && (wrapperEl2['style']['display'] = '');
  const focused2 =
      typeof document !== 'undefined' &&
      !!document['activeElement'] &&
      wrapperEl2['contains'](document['activeElement']),
    _buildNodePresentationStableKey2 = _buildNodePresentationStableKey({
      node: node6,
      nodeId: nodeId10,
      signature: signature3,
      visible: visible2,
      isSelected: isSelected6,
      isSelectionRelated: isSelectionRelated6,
      relatedHighlightColor: relatedHighlightColor3,
      connOverlay: connOverlay3,
      pickMode: pickMode4,
      showVideoMeta: showVideoMeta3,
      focused: focused2,
    });
  if (
    !mountedThisFrame &&
    !active2 &&
    wrapperEl2['dataset']?.['detailStage'] !== 'deferred' &&
    _nodeDataSnapshotMap['get'](nodeId10) === signature3 &&
    wrapperEl2['_presentationStableKey'] === _buildNodePresentationStableKey2
  )
    return { deferredUpdate: ![], didUpdate: ![] };
  ((wrapperEl2['_presentationStableKey'] = _buildNodePresentationStableKey2), syncNodeMediaMetricsDataset(wrapperEl2, node6));
  const shouldForceDeferActiveNodeDetails2 = shouldForceDeferActiveNodeDetails({
      nodeId: nodeId10,
      dragContext: dragContext3,
      dragTargets: dragTargets4,
    }),
    value162 = wrapperEl2['classList']['contains']('selected');
  isSelected6 !== value162 &&
    (isSelected6
      ? wrapperEl2['classList']['add']('selected', 'v2-selected')
      : (wrapperEl2['classList']['remove']('selected', 'v2-selected'), (wrapperEl2['style']['outline'] = '')));
  if (isSelectionRelated6) {
    wrapperEl2['classList']['add']('selection-related');
    const value163 = 'selection-related-color-' + _normalizeSelectionRelatedHighlightColor(relatedHighlightColor3);
    for (const value164 of SELECTION_RELATED_HIGHLIGHT_COLORS) {
      const value165 = 'selection-related-color-' + value164;
      if (value165 !== value163) wrapperEl2['classList']['remove'](value165);
    }
    wrapperEl2['classList']['add'](value163);
  } else {
    wrapperEl2['classList']['remove']('selection-related');
    for (const value166 of SELECTION_RELATED_HIGHLIGHT_COLORS) {
      wrapperEl2['classList']['remove']('selection-related-color-' + value166);
    }
  }
  if (
    allowActiveDetailHydration !== ![] &&
    !shouldForceDeferActiveNodeDetails2 &&
    _nodeDetailHydration['isNodeDetailActive']({
      node: node6,
      nodeId: nodeId10,
      isSelected: isSelected6,
      connOverlay: connOverlay3,
      pickMode: pickMode4,
      relatedNodeIds: relatedNodeIds3,
    })
  ) {
    if (
      isNodeType(node6, ['source-video', 'ai-video', 'video']) &&
      wrapperEl2?.['dataset']?.['detailStage'] === 'deferred'
    )
      _videoHydrationBackpressure['markPriorityWork']();
    _nodeDetailHydration['hydrateNodeDetails'](nodeId10, wrapperEl2);
  }
  value159 &&
    typeof value159['syncSelectionState'] === 'function' &&
    value159['syncSelectionState']({
      selected: isSelected6,
      singleSelected: selectedNodeSet3['size'] === 0x1,
      visible: !![],
    });
  const rendererNodeZIndex = getRendererNodeZIndex(node6, isSelected6, selectedNodeRankMap3?.['get']?.(nodeId10) ?? -0x1, {
    isFocused: focused2,
  });
  syncRendererNodePresentationZIndex(wrapperEl2, rendererNodeZIndex);
  if (isNodeType(node6, 'group')) {
    const value167 = node6['color'] || 'var(--indigo)',
      rendererGroupColorWithOpacity = getRendererGroupColorWithOpacity(value167, '60'),
      rendererGroupColorWithOpacity2 = getRendererGroupColorWithOpacity(value167, '05');
    (wrapperEl2['style']['borderColor'] !== rendererGroupColorWithOpacity && (wrapperEl2['style']['borderColor'] = rendererGroupColorWithOpacity),
      wrapperEl2['style']['backgroundColor'] !== rendererGroupColorWithOpacity2 &&
        (wrapperEl2['style']['backgroundColor'] = rendererGroupColorWithOpacity2),
      wrapperEl2['style']['getPropertyValue']('--current-group-color') !== value167 &&
        wrapperEl2['style']['setProperty']('--current-group-color', value167));
  }
  const el17 = wrapperEl2['__v2_name_el'],
    nodeType = normalizeNodeType(node6['type']),
    labelKind = el17 ? getRendererNodeLabelKind(nodeType) : '';
  if (el17) {
    if (labelKind) {
      if (el17['dataset']['labelKind'] !== labelKind) el17['dataset']['labelKind'] = labelKind;
    } else 'labelKind' in el17['dataset'] && delete el17['dataset']['labelKind'];
  }
  if (el17 && el17['contentEditable'] !== 'true') {
    const defaultName = getRendererDefaultNodeLabel(node6),
      isBeta = hasNodeTypeBetaBadge(nodeType),
      fullLabelText = node6['name'] || defaultName,
      displayLabelText = formatRendererNodeLabelText(fullLabelText);
    ((el17['dataset']['fullName'] = fullLabelText),
      (el17['dataset']['isBeta'] = isBeta ? '1' : '0'),
      clearRendererNodeLabelTooltip(el17));
    const el18 = el17['querySelector']('.node-label-icon'),
      el19 = el17['querySelector']('.node-label-text'),
      value168 = displayLabelText || defaultName,
      value169 = el18?.['dataset']['labelKind'] || '';
    (value169 !== labelKind ||
      el19?.['textContent'] !== value168 ||
      (isBeta ? el17['dataset']['betaLabel'] !== fullLabelText : 'betaLabel' in el17['dataset'])) &&
      setRendererNodeLabelContent(el17, {
        labelKind: labelKind,
        displayLabelText: displayLabelText,
        defaultName: defaultName,
        isBeta: isBeta,
        fullLabelText: fullLabelText,
      });
  }
  _nodeTimerController['renderNode'](nodeId10, node6, { selected: isSelected6 });
  const el20 = wrapperEl2['__v2_video_meta_el'];
  if (el20) {
    if (!showVideoMeta3) {
      if (el20['dataset']['visible'] !== '0') el20['dataset']['visible'] = '0';
    } else {
      const fps = Number(node6['videoFps']),
        frames = Number(node6['videoFrameCount']),
        width3 = Number(node6['videoWidth']),
        height3 = Number(node6['videoHeight']),
        enabled35 =
          Number['isFinite'](fps) &&
          fps > 0x0 &&
          Number['isFinite'](frames) &&
          frames > 0x0,
        value170 = enabled35 ? '1' : '0';
      el20['dataset']['visible'] !== value170 && (el20['dataset']['visible'] = value170);
      if (!enabled35 && typeof value159?.['requestVideoMetaForNodeInfo'] === 'function')
        void value159['requestVideoMetaForNodeInfo'](node6);
      if (enabled35) {
        const formatVideoMetaText2 = formatVideoMetaText({
          fps: fps,
          frames: frames,
          width: width3,
          height: height3,
        });
        el20['textContent'] !== formatVideoMetaText2 && (el20['textContent'] = formatVideoMetaText2);
      }
    }
  }
  if (value159?.['update'] && signature3 !== _nodeDataSnapshotMap['get'](nodeId10)) {
    if (skipInstanceUpdate) _nodeDataSnapshotMap['set'](nodeId10, signature3);
    else
      deferInstanceUpdate
        ? ((deferredUpdate = !![]), recordRendererLifecycleSkippedUpdate(lifecycleStats))
        : _nodeDataSnapshotMap['set'](nodeId10, signature3);
    if (!skipInstanceUpdate && !deferInstanceUpdate) {
      const value171 = lifecycleStats ? _nowMs() : 0x0;
      (value159['update'](node6), (didUpdate = !![]));
      if (lifecycleStats) {
        const breakdown = value159?.['_lastUpdatePerfBreakdown'] || null;
        recordRendererLifecycleDuration(
          lifecycleStats,
          'update',
          node6,
          _nowMs() - value171,
          'visible',
          { breakdown: breakdown },
        );
      }
    } else skipInstanceUpdate && recordRendererLifecycleSkippedUpdate(lifecycleStats);
  }
  const value172 = pickMode4 && pickMode4['active'] && nodeId10 === pickMode4['sourceNodeId'],
    isNodeType2 = isNodeType(node6, 'storyboard') && node6['isEditing'];
  if ((connOverlay3 && connOverlay3['srcId']) || value172 || isNodeType2) {
    if (nodeId10 === connOverlay3?.['srcId'] || value172 || isNodeType2)
      (wrapperEl2['classList']['add']('conn-src'), wrapperEl2['classList']['remove']('conn-invalid'));
    else
      connOverlay3?.['invalidNodeIds']?.['includes'](nodeId10)
        ? (wrapperEl2['classList']['add']('conn-invalid'), wrapperEl2['classList']['remove']('conn-src'))
        : wrapperEl2['classList']['remove']('conn-invalid', 'conn-src');
  } else wrapperEl2['classList']['remove']('conn-invalid', 'conn-src');
  wrapperEl2['classList']['toggle']('is-source-highlighted', Boolean(value172 || isNodeType2));
  const value173 = pickMode4 && pickMode4['active'] && pickMode4['hoverNodeId'] === nodeId10;
  if ((connOverlay3 && connOverlay3['hoverId'] === nodeId10) || value173) {
    if (!wrapperEl2['classList']['contains']('conn-hoverTarget')) {
      wrapperEl2['classList']['add']('conn-hoverTarget');
      const value174 = window['getComputedStyle'](wrapperEl2)['borderRadius'];
      let count2 = parseFloat(value174);
      if (isNaN(count2) || count2 <= 0x0) count2 = 0x10;
      wrapperEl2['style']['setProperty']('--hover-br', count2 + 0x4 + 'px');
    }
    let value175 = ![];
    if (connOverlay3 && connOverlay3['side'] === 'left') value175 = !![];
    else value173 && pickMode4 && pickMode4['handleDirection'] === 'left' && (value175 = !![]);
    value175
      ? (wrapperEl2['classList']['add']('conn-hover-output'),
        wrapperEl2['classList']['remove']('conn-hover-input'))
      : (wrapperEl2['classList']['add']('conn-hover-input'),
        wrapperEl2['classList']['remove']('conn-hover-output'));
  } else
    wrapperEl2['classList']['contains']('conn-hoverTarget') &&
      (wrapperEl2['classList']['remove']('conn-hoverTarget', 'conn-hover-input', 'conn-hover-output'),
      wrapperEl2['style']['removeProperty']('--hover-br'));
  return (
    syncNodeResultClass(wrapperEl2, node6, isNodeType),
    { deferredUpdate: deferredUpdate, didUpdate: didUpdate }
  );
}
function _renderNodesImpl(
  canvasEl2,
  nodes,
  selectedNodeIds,
  relatedNodeIds4,
  relatedHighlightColor4,
  connOverlay4,
  value176,
  value177,
  value178,
  value179,
  value180,
  snapshot2 = null,
  interactionBusy = {},
) {
  const pickConnectMode = value176,
    viewport6 = value177 || { x: 0x0, y: 0x0, zoom: 0x1 },
    value181 = value178 || {},
    parentToChildren2 = value179 || {},
    showVideoMeta4 = value180 !== ![],
    value182 = interactionBusy?.['deferParking'] === !![],
    dragContext4 = getInteractionRenderState(),
    selectedNodeSet4 = selectedNodeIds instanceof Set ? selectedNodeIds : new Set(selectedNodeIds || []),
    selectedNodeRankMap4 = buildSelectedNodeRankMap(selectedNodeIds),
    activeNodeIds = buildRendererDragTargetSet({
      dragContext: dragContext4,
      selectedNodeSet: selectedNodeSet4,
      parentToChildren: parentToChildren2,
    }),
    value183 = _rendererRuntimeDiagnosticsEnabled ? _nowMs() : 0x0,
    value184 = interactionBusy?.['framePlan'] || null,
    { width: width4, height: height4 } =
      value184?.['containerRect'] || _getCachedContainerSize(canvasEl2['parentElement'] || canvasEl2),
    nodeCount4 = Number['isFinite'](value184?.['nodeCount'])
      ? value184['nodeCount']
      : Number['isFinite'](snapshot2?.['_nodeCount'])
        ? snapshot2['_nodeCount']
        : Object['keys'](nodes || {})['length'],
    snapshotRev = Number['isFinite'](snapshot2?.['_nodesRev'])
      ? snapshot2['_nodesRev']
      : Number['isFinite'](snapshot2?.['_persistRev'])
        ? snapshot2['_persistRev']
        : nodeCount4,
    value185 = Number['isFinite'](snapshot2?.['_sourceVideoRev'])
      ? snapshot2['_sourceVideoRev']
      : Number['isFinite'](snapshot2?.['_persistRev'])
        ? snapshot2['_persistRev']
        : null,
    enabled36 = interactionBusy?.['deferInitialRasterPlanning'] === !![],
    pinnedNodeIds = _getPinnedNodeIds(),
    value186 =
      value184 ||
      createRendererFramePlan({
        snapshot: snapshot2,
        nodes: nodes,
        viewport: viewport6,
        containerRect: { width: width4, height: height4 },
        nodeCount: nodeCount4,
      }),
    spatialIndex = value186['getSpatialIndex'](),
    signature4 = buildRendererVirtualizationSignature({
      snapshotRev: snapshotRev,
      nodeCount: nodeCount4,
      viewport: viewport6,
      selectedNodeIds: selectedNodeIds,
      connOverlay: connOverlay4,
      pickConnectMode: pickConnectMode,
      dragContext: dragContext4,
      pinnedNodeIds: pinnedNodeIds,
      containerW: width4,
      containerH: height4,
    });
  let virtualizationResult = _lastVirtualCandidateResult;
  const cacheHit = signature4 === _lastVirtualCandidateSignature && !!virtualizationResult;
  !cacheHit &&
    ((virtualizationResult = buildVirtualizationCandidateSets({
      nodes: nodes,
      spatialIndex: spatialIndex,
      viewport: viewport6,
      containerWidth: width4,
      containerHeight: height4,
      selectedNodeIds: selectedNodeIds,
      connOverlay: connOverlay4,
      pickConnectMode: pickConnectMode,
      dragContext: dragContext4,
      parentToChildren: parentToChildren2,
      pinnedNodeIds: pinnedNodeIds,
      mountedNodeIds: _mountedNodeIds,
    })),
    (_lastVirtualCandidateSignature = signature4),
    (_lastVirtualCandidateResult = virtualizationResult));
  virtualizationResult = ensureRendererExactVisiblePreviewCandidates({
    virtualizationResult: virtualizationResult,
    nodes: nodes,
    spatialIndex: spatialIndex,
    viewport: viewport6,
    containerWidth: width4,
    containerHeight: height4,
    nodeCount: nodeCount4,
  });
  const scanNodes =
    value185 === null ||
    _sourceVideoActivationNodesRef !== nodes ||
    _sourceVideoActivationRev !== value185;
  !enabled36 &&
    (syncRendererPendingSourceVideoActivationIds({
      nodes: nodes,
      sourceKeysByNodeId: _sourceVideoSourceKeySnapshotMap,
      pendingNodeIds: _pendingSourceVideoActivationIds,
      scanNodes: scanNodes,
      isPresented: (value187, value188) => {
        const value189 = _sourceVideoSlotLifecycle['read'](value187);
        return value189['surface'] === 'media' && value189['sourceKey'] === value188;
      },
    }),
    scanNodes && ((_sourceVideoActivationRev = value185), (_sourceVideoActivationNodesRef = nodes)));
  const lowZoomRealVideoNodeIds = resolveRendererLowZoomRealVideoNodeIds({
    nodes: nodes,
    candidateNodeIds: virtualizationResult['previewCandidateIds'],
    selectedNodeIds: selectedNodeIds,
    priorityNodeIds: _pendingSourceVideoActivationIds,
    viewport: viewport6,
    nodeCount: nodeCount4,
    containerWidth: width4,
    containerHeight: height4,
  });
  virtualizationResult = applyRendererLowZoomRealVideoCandidates(virtualizationResult, lowZoomRealVideoNodeIds);
  const fullEligibleVisibleImageNodeIds = enabled36
    ? new Set()
    : collectFullEligibleVisibleImageNodeIds({
        nodes: nodes,
        candidateNodeIds: virtualizationResult['previewCandidateIds'],
        viewport: viewport6,
        isVisible: (value190) =>
          isNodeInsideViewportPadding(value190, viewport6, width4, height4, 0x0),
        getPreviousMode: (value191) =>
          String(_wrapperMap['get'](value191)?.['dataset']?.['mediaLodMode'] || '')['trim'](),
        interactionBusy:
          interactionBusy?.['viewportBusy'] === !![] ||
          interactionBusy?.['previewOnly'] === !![] ||
          _rendererInteractionGrace['isBusy'](),
      });
  virtualizationResult = applyRendererFullEligibleImageCandidates(virtualizationResult, fullEligibleVisibleImageNodeIds);
  const mountCandidateIds2 = value186['buildScenePlan']({
      mountCandidateIds: virtualizationResult['mountCandidateIds'],
      previewCandidateIds: virtualizationResult['previewCandidateIds'],
      parkCandidateIds: virtualizationResult['parkCandidateIds'],
      selectedNodeIds: selectedNodeSet4,
      activeNodeIds: activeNodeIds,
      keepAliveNodeIds: virtualizationResult['keepAliveNodeIds'],
      mountedNodeIds: _mountedNodeIds,
      fullEligibleVisibleImageNodeIds: fullEligibleVisibleImageNodeIds,
      includeParkIds: ![],
      deferInitialPlanning: interactionBusy?.['deferInitialRasterPlanning'] === !![],
    }),
    value192 = signature4 + '|scene:' + mountCandidateIds2['surfaceSignature'],
    { plannedFullEligibleVisibleImageNodeIds: plannedFullEligibleVisibleImageNodeIds } = mountCandidateIds2;
  ((virtualizationResult = {
    ...virtualizationResult,
    mountCandidateIds: mountCandidateIds2['fullSurfaceIds'],
    previewCandidateIds: mountCandidateIds2['presentationSurfaceIds'],
    parkCandidateIds: mountCandidateIds2['fullSurfaceReleaseIds'],
    scenePlan: mountCandidateIds2,
  }),
    _notifyVirtualizationProbe({
      signature: signature4,
      cacheHit: cacheHit,
      snapshotRev: snapshotRev,
      containerW: width4,
      containerH: height4,
      spatialIndex: !!spatialIndex,
      nodeCount: nodeCount4,
      mountCandidateCount: virtualizationResult['mountCandidateIds']?.['size'] || 0x0,
      previewCandidateCount: virtualizationResult['previewCandidateIds']?.['size'] || 0x0,
      parkCandidateCount: virtualizationResult['parkCandidateIds']?.['size'] || 0x0,
      keepAliveCount: virtualizationResult['keepAliveNodeIds']?.['size'] || 0x0,
      scenePressure: mountCandidateIds2['pressure'],
      sceneFullSurfaceBudget: mountCandidateIds2['fullSurfaceBudget'],
      sceneFullSurfaceCount: mountCandidateIds2['fullSurfaceIds']['size'],
      sceneProxySurfaceCount: mountCandidateIds2['proxySurfaceIds']['size'],
    }));
  _rendererRuntimeDiagnosticsEnabled &&
    recordRendererRuntimeDiagnostic({
      kind: 'renderer-virtualization',
      mode: interactionBusy?.['mode'] || 'steady',
      cacheHit: cacheHit,
      nodeCount: nodeCount4,
      mountCandidateCount: virtualizationResult['mountCandidateIds']?.['size'] || 0x0,
      previewCandidateCount: virtualizationResult['previewCandidateIds']?.['size'] || 0x0,
      parkCandidateCount: virtualizationResult['parkCandidateIds']?.['size'] || 0x0,
      fullEligibleVisibleImageCount: fullEligibleVisibleImageNodeIds['size'],
      plannedFullEligibleVisibleImageCount: plannedFullEligibleVisibleImageNodeIds['size'],
      scenePressure: mountCandidateIds2['pressure'],
      sceneFullSurfaceBudget: mountCandidateIds2['fullSurfaceBudget'],
      sceneFullSurfaceCount: mountCandidateIds2['fullSurfaceIds']['size'],
      sceneProxySurfaceCount: mountCandidateIds2['proxySurfaceIds']['size'],
      fullImageSettleReady: interactionBusy?.['fullImageSettleReady'] === !![],
      durationMs: _nowMs() - value183,
      viewport: { ...viewport6 },
    });
  const { mountCandidateIds: mountCandidateIds3 } = virtualizationResult;
  let { parkCandidateIds: parkCandidateIds } = virtualizationResult;
  interactionBusy?.['viewportPriorityMediaOnly'] !== !![] && _rendererMediaRuntimePreparer['prune'](mountCandidateIds3);
  const candidateNodeIds = virtualizationResult['previewCandidateIds'] || mountCandidateIds3,
    fullEligiblePreviewImageNodeIds = enabled36
      ? new Set()
      : collectFullEligibleVisibleImageNodeIds({
          nodes: nodes,
          candidateNodeIds: candidateNodeIds,
          viewport: viewport6,
          isVisible: () => !![],
          getPreviousMode: (value193) =>
            String(_wrapperMap['get'](value193)?.['dataset']?.['mediaLodMode'] || '')['trim'](),
          interactionBusy:
            interactionBusy?.['viewportBusy'] === !![] ||
            interactionBusy?.['previewOnly'] === !![] ||
            _rendererInteractionGrace['isBusy'](),
        }),
    viewportBusy =
      interactionBusy?.['viewportBusy'] === !![] ||
      interactionBusy?.['deferParking'] === !![] ||
      interactionBusy?.['deferHeavyMediaMount'] === !![] ||
      _rendererInteractionGrace['isBusy'](),
    mediaLoadingBusy = viewportBusy || interactionBusy?.['previewOnly'] === !![],
    suppressNewMedia =
      viewportBusy && resolveRendererLowZoomMountLimit({ viewport: viewport6, nodeCount: nodeCount4 }) <= 0x0,
    freezeActive = _rasterPreviewCoordinator['sync']({
      canvasEl: canvasEl2,
      nodes: nodes,
      scenePlan: mountCandidateIds2,
      selectedNodeIds: selectedNodeSet4,
      dragNodeIds: activeNodeIds,
      connOverlay: connOverlay4,
      pickConnectMode: pickConnectMode,
      viewport: viewport6,
      viewportBusy: viewportBusy,
      containerWidth: width4,
      containerHeight: height4,
      mediaLoadingBusy: mediaLoadingBusy,
      freezeRasterSurface: viewportBusy,
      lockRasterParticipation: interactionBusy?.['lockRasterParticipation'] === !![],
      deferInitialPlanning: interactionBusy?.['deferInitialRasterPlanning'] === !![],
      releaseFullSurface(value194) {
        const el21 = _wrapperMap['get'](value194);
        if (!el21?.['style'] || el21['classList']?.['contains']?.('is-dragging')) return;
        ((el21['style']['display'] = 'none'), _nodeTimerController['hideNode'](value194));
      },
    }),
    suspendNewMediaSrc =
      interactionBusy?.['suspendNewMediaSrc'] === !![] || (freezeActive['freezeActive'] === !![] && mediaLoadingBusy);
  parkCandidateIds = freezeActive['releasableFullSurfaceIds'];
  const { domPreviewCandidateIds: domPreviewCandidateIds, domPreviewMediaSourceOwnerIds: domPreviewMediaSourceOwnerIds } = freezeActive,
    args7 = [...mountCandidateIds2['exactVisibleGenerationBusyIds']]['filter'](
      (value195) => !mountCandidateIds2['fullSurfaceIds']['has'](value195) || !_mountedNodeIds['has'](value195),
    ),
    requiredImmediateMediaSourceOwnerIds = new Set([...domPreviewMediaSourceOwnerIds, ...args7]);
  isPerfProbeEnabled() &&
    (canvasEl2['__aicanvasPerfRasterCoordinatorStats'] = {
      claimedRasterNodeIds: [...freezeActive['rasterIds']],
      domPreviewCandidateNodeIds: [...domPreviewCandidateIds],
      domPreviewMediaSourceOwnerNodeIds: [...domPreviewMediaSourceOwnerIds],
      freezeActive: freezeActive['freezeActive'] === !![],
      viewportBusyForPreview: viewportBusy,
      viewportBusyOption: interactionBusy?.['viewportBusy'] === !![],
      deferParkingOption: interactionBusy?.['deferParking'] === !![],
      deferHeavyMediaMountOption: interactionBusy?.['deferHeavyMediaMount'] === !![],
      interactionGraceBusy: _rendererInteractionGrace['isBusy'](),
      policy: { ...(freezeActive['policy']?.['stats'] || {}) },
    });
  const candidateSignature = value192 + '|raster:' + freezeActive['signature'],
    previewCandidateIds =
      mountCandidateIds2['exactVisibleGenerationBusyIds']['size'] > 0x0
        ? new Set([...domPreviewCandidateIds, ...mountCandidateIds2['exactVisibleGenerationBusyIds']])
        : domPreviewCandidateIds;
  cancelStaleLowPriorityPreloadsForHighZoom(suppressNewMedia);
  if (interactionBusy?.['previewOnly'] === !![]) {
    _fastPreviewContinuation['reset']();
    const visibleNodeCount = mountCandidateIds2['exactVisibleIds']['size'];
    let rasterVisibleNodeCount = 0x0;
    if (
      visibleNodeCount > RENDERER_VIEWPORT_PREVIEW_COVERAGE_CONFIG['maxDirectVisibleNodeCount'] &&
      visibleNodeCount <= RENDERER_VIEWPORT_PREVIEW_COVERAGE_CONFIG['maxRasterAssistedVisibleNodeCount']
    )
      for (const value196 of mountCandidateIds2['exactVisibleIds']) {
        freezeActive['rasterIds']['has'](value196) && (rasterVisibleNodeCount += 0x1);
      }
    const previewCoverageEligible = shouldPrepareRendererViewportPreviewCoverage({
        viewport: viewport6,
        nodeCount: nodeCount4,
        visibleNodeCount: visibleNodeCount,
        rasterVisibleNodeCount: rasterVisibleNodeCount,
      }),
      requiredImmediateCreateLimit =
        previewCoverageEligible && visibleNodeCount > RENDERER_VIEWPORT_PREVIEW_COVERAGE_CONFIG['maxDirectVisibleNodeCount'];
    _fastPreviewLayer['sync'](canvasEl2, nodes, previewCandidateIds, selectedNodeSet4, {
      connOverlay: connOverlay4,
      pickConnectMode: pickConnectMode,
      nodeCount: nodeCount4,
      viewport: viewport6,
      containerWidth: width4,
      containerHeight: height4,
      freezeRasterSurface: freezeActive['freezeActive'] === !![],
      previewOnly: !![],
      deferVisibleMediaSrc: interactionBusy?.['deferInitialRasterPlanning'] === !![],
      suppressNewMedia: suppressNewMedia,
      mediaSourceOwnerIds: domPreviewMediaSourceOwnerIds,
      requiredImmediateMediaSourceOwnerIds: requiredImmediateMediaSourceOwnerIds,
      requiredImmediateCreateLimit: requiredImmediateCreateLimit
        ? RENDERER_VIEWPORT_PREVIEW_COVERAGE_CONFIG['rasterAssistedImmediateCreateLimit']
        : undefined,
      viewportBusy: viewportBusy,
      dragContext: dragContext4,
      dragTargets: activeNodeIds,
      suspendNewMediaSrc: suspendNewMediaSrc,
      fullEligibleVisibleImageNodeIds: fullEligibleVisibleImageNodeIds,
      fullEligiblePreviewImageNodeIds: fullEligiblePreviewImageNodeIds,
    });
    let previewCoverageCreated = null,
      ready = ![],
      presentedNodeCount = 0x0,
      missingExactVisibleNodeCount = [];
    if (previewCoverageEligible) {
      const presentedNodeIds = new Set();
      for (const value197 of mountCandidateIds2['presentationSurfaceIds']) {
        const el22 = _wrapperMap['get'](value197),
          value198 =
            _mountedNodeIds['has'](value197) &&
            el22 &&
            el22['isConnected'] !== ![] &&
            el22['style']?.['display'] !== 'none';
        (value198 ||
          freezeActive['rasterIds']['has'](value197) ||
          _fastPreviewLayer['hasNodePreview'](value197)) &&
          presentedNodeIds['add'](value197);
      }
      ((missingExactVisibleNodeCount = [...mountCandidateIds2['exactVisibleIds']]['filter']((value199) => !presentedNodeIds['has'](value199))),
        (ready = missingExactVisibleNodeCount['length'] === 0x0),
        (presentedNodeCount = presentedNodeIds['size']),
        (previewCoverageCreated = createRendererViewportPreviewCoverage({
          viewport: viewport6,
          containerWidth: width4,
          containerHeight: height4,
          padding: mountCandidateIds2['padding']['preview'],
          nodeCount: nodeCount4,
          snapshot: snapshot2,
          spatialIndex: spatialIndex,
          presentedNodeIds: presentedNodeIds,
          ready: ready,
        })));
    }
    return (
      isPerfProbeEnabled() &&
        (canvasEl2['__aicanvasPerfViewportPreviewCoverageStats'] = {
          exactVisibleNodeCount: visibleNodeCount,
          rasterVisibleNodeCount: rasterVisibleNodeCount,
          previewCoverageEligible: previewCoverageEligible,
          previewCoverageReady: ready,
          previewCoverageCreated: previewCoverageCreated !== null,
          presentedNodeCount: presentedNodeCount,
          missingExactVisibleNodeCount: missingExactVisibleNodeCount['length'],
          missingExactVisibleNodeTypes: missingExactVisibleNodeCount['reduce']((value200, value201) => {
            const value202 = String(nodes?.[value201]?.['type'] || 'unknown');
            return ((value200[value202] = Number(value200[value202] || 0x0) + 0x1), value200);
          }, {}),
        }),
      {
        hasPendingStructuralOps: ![],
        deferredParkCount: 0x0,
        hasPendingVisibleVideoMounts: ![],
        hasPendingFullEligibleVisibleImageMounts: ![],
        previewCoverage: previewCoverageCreated,
      }
    );
  }
  const renderNodeCount = prioritizeFullEligibleVisibleImageNodes(
      collectVirtualizedRenderNodes({
        nodes: nodes,
        virtualizationResult: virtualizationResult,
        spatialIndex: spatialIndex,
        mountedNodeIds: _mountedNodeIds,
        viewport: viewport6,
        containerWidth: width4,
        containerHeight: height4,
      }),
      fullEligibleVisibleImageNodeIds,
    ),
    pendingFullEligibleVisibleImageCount = Array['from'](plannedFullEligibleVisibleImageNodeIds)['filter']((value203) => !_mountedNodeIds['has'](value203))[
      'length'
    ],
    lifecycleStats2 = isPerfProbeEnabled()
      ? createRendererNodeLifecycleStats({
          mode: interactionBusy?.['mode'] || 'steady',
          nodeCount: nodeCount4,
          renderNodeCount: renderNodeCount['length'],
          mountCandidateCount: mountCandidateIds3['size'],
          parkCandidateCount: parkCandidateIds['size'],
          viewportBusy: viewportBusy,
        })
      : null,
    rendererStructuralBudget = createRendererStructuralBudget(
      getRendererStructuralBudgetOptions({
        viewportBusy: viewportBusy,
        cacheHit: cacheHit,
        dragContext: dragContext4,
        fullEligibleVisibleImageCount: plannedFullEligibleVisibleImageNodeIds['size'],
        fullImageSettleReady: interactionBusy?.['fullImageSettleReady'] === !![],
        nodeCount: nodeCount4,
        pendingFullEligibleVisibleImageCount: pendingFullEligibleVisibleImageCount,
        renderMode: interactionBusy?.['mode'] || 'steady',
        viewport: viewport6,
      }),
    ),
    rendererStructuralBudget2 = createRendererStructuralBudget({
      batchSize: RENDERER_FULL_SURFACE_RELEASE_BATCH_SIZE,
      frameBudgetMs: RENDERER_FULL_SURFACE_RELEASE_FRAME_BUDGET_MS,
    });
  let hasPendingStructuralOps2 = ![],
    deferredParkCount2 = 0x0,
    enabled37 = null;
  const heavyMediaUpdateFrameBudget = createHeavyMediaUpdateFrameBudget({ nodeCount: nodeCount4, now: _nowMs });
  let hasPendingVisibleVideoMounts2 = ![],
    hasPendingFullEligibleVisibleImageMounts2 = ![],
    mountedHeavyMediaThisFrame = ![],
    updatedHeavyMediaThisFrame = ![],
    hasPendingStructuralVideoMounts = ![];
  const value204 = nodeCount4 >= RENDERER_VIRTUALIZATION_CONFIG['veryDenseNodeCount'],
    handler = createHeavyMediaPreviewOnlyDecider({
      viewport: viewport6,
      nodeCount: nodeCount4,
      lowZoomRealVideoNodeIds: lowZoomRealVideoNodeIds,
      fullEligibleVisibleImageNodeIds: plannedFullEligibleVisibleImageNodeIds,
    }),
    handler2 = createRendererVisibleAudioSurfaceHydrationPass({
      viewport: viewport6,
      nodeCount: nodeCount4,
      deferredMedia: _rendererDeferredMedia,
    });
  for (const node7 of renderNodeCount) {
    if (!node7?.['id']) continue;
    const nodeId11 = node7['id'];
    let wrapperEl3 = _wrapperMap['get'](nodeId11),
      instance = _componentMap['get'](nodeId11),
      deferMediaOnMount = ![];
    const nodeType2 = normalizeNodeType(node7['type']),
      isNodeType3 = isNodeType(node7, 'source-video');
    isNodeType3 &&
      _sourceVideoSlotLifecycle['syncViewportVisibility'](nodeId11, {
        isSelected: selectedNodeSet4['has'](nodeId11),
        isPreviewCandidate: candidateNodeIds['has'](nodeId11),
        isVisible: _isNodeVisible(node7, viewport6, width4, height4),
      });
    const value205 = _nodeTypeSnapshotMap['get'](nodeId11);
    wrapperEl3 &&
      instance &&
      value205 &&
      value205 !== nodeType2 &&
      (_destroyNode(nodeId11), (wrapperEl3 = null), (instance = null));
    const enabled38 = _mountedNodeIds['has'](nodeId11) && !!wrapperEl3?.['isConnected'],
      value206 = _sourceVideoSlotLifecycle['shouldRetainPresentedSurface'](nodeId11),
      enabled39 = value206 || mountCandidateIds3['has'](nodeId11) || (enabled38 && !parkCandidateIds['has'](nodeId11));
    let mountedThisFrame2 = ![],
      value207 = ![];
    if (!enabled39) {
      if (wrapperEl3 && instance) {
        const enabled40 = _pendingNodeDataMap['get'](nodeId11);
        (!enabled40 || enabled40['node'] !== node7) &&
          _pendingNodeDataMap['set'](nodeId11, { node: node7, signature: null });
      }
      if (enabled38 && parkCandidateIds['has'](nodeId11)) {
        if (value182) {
          deferredParkCount2 += 0x1;
          continue;
        }
        if (rendererStructuralBudget2['hasBudget']()) {
          const value208 = lifecycleStats2 ? _nowMs() : 0x0;
          (_parkNode(nodeId11),
            lifecycleStats2 &&
              recordRendererLifecycleDuration(lifecycleStats2, 'park', node7, _nowMs() - value208, 'park'),
            rendererStructuralBudget2['consume']());
        } else hasPendingStructuralOps2 = !![];
      }
      continue;
    }
    const isSelected7 = selectedNodeSet4['has'](nodeId11),
      isSelectionRelated7 = !isSelected7 && relatedNodeIds4?.['has']?.(nodeId11),
      isNodeType4 = isNodeType(node7, ['source-video', 'ai-video', 'video']),
      isVisibleVideoMediaNode = isNodeType4 && _isNodeVisible(node7, viewport6, width4, height4);
    if (isNodeType4) {
      const withinResidency =
        lowZoomRealVideoNodeIds['has'](nodeId11) ||
        resolveRendererLowZoomMountLimit({ viewport: viewport6, nodeCount: nodeCount4 }) <= 0x0;
      _videoMediaResidency['sync'](nodeId11, {
        withinResidency:
          withinResidency &&
          isNodeInsideViewportPadding(
            node7,
            viewport6,
            width4,
            height4,
            RENDERER_VIDEO_MEDIA_RESIDENCY_PADDING,
          ),
        leaseKey: _resolveVideoMediaLeaseKey(nodeId11, node7),
      });
    }
    const enabled41 = isVisibleVideoMediaNode && !!resolveCanvasVideoDisplayUrl(node7);
    if (interactionBusy?.['viewportPriorityMediaOnly'] === !![] && !enabled41) continue;
    const value209 = lowZoomRealVideoNodeIds['has'](nodeId11),
      shouldHydrateVideoMediaImmediately2 = shouldHydrateVideoMediaImmediately({
        node: node7,
        nodeId: nodeId11,
        isSelected: isSelected7,
        isSelectionRelated: isSelectionRelated7,
        dragTargets: activeNodeIds,
        connOverlay: connOverlay4,
        pickMode: pickConnectMode,
      }),
      shouldForceDeferRelatedVideoDetails2 = shouldForceDeferRelatedVideoDetails({
        node: node7,
        nodeId: nodeId11,
        isSelected: isSelected7,
        isSelectionRelated: isSelectionRelated7,
        dragTargets: activeNodeIds,
        viewport: viewport6,
        mountCandidateCount: mountCandidateIds3['size'],
        nodeCount: nodeCount4,
        options: interactionBusy,
      }),
      isViewportPriorityImageNode2 = isViewportPriorityImageNode({
        node: node7,
        nodeId: nodeId11,
        mountCandidateIds: mountCandidateIds3,
        viewport: viewport6,
        containerW: width4,
        containerH: height4,
        isSelected: isSelected7,
        isSelectionRelated: isSelectionRelated7,
      }),
      enabled42 = plannedFullEligibleVisibleImageNodeIds['has'](nodeId11);
    if (!instance || !wrapperEl3) {
      if (
        handler({
          node: node7,
          nodeId: nodeId11,
          isSelected: isSelected7,
          isSelectionRelated: isSelectionRelated7,
          isVisibleVideoMediaNode: isVisibleVideoMediaNode,
          dragTargets: activeNodeIds,
          connOverlay: connOverlay4,
          pickMode: pickConnectMode,
          viewport: viewport6,
          nodeCount: nodeCount4,
        })
      )
        continue;
      if (
        !enabled42 &&
        shouldDeferHeavyMediaMount({
          node: node7,
          nodeId: nodeId11,
          isSelected: isSelected7,
          isSelectionRelated: isSelectionRelated7,
          dragTargets: activeNodeIds,
          connOverlay: connOverlay4,
          pickMode: pickConnectMode,
          options: interactionBusy,
        })
      ) {
        hasPendingStructuralOps2 = !![];
        if (isNodeType4) hasPendingStructuralVideoMounts = !![];
        if (isVisibleVideoMediaNode) hasPendingVisibleVideoMounts2 = !![];
        continue;
      }
      if (
        !enabled42 &&
        heavyMediaUpdateFrameBudget['shouldDefer']({
          node: node7,
          nodeId: nodeId11,
          isSelected: isSelected7,
          isSelectionRelated: isSelectionRelated7,
          dragTargets: activeNodeIds,
          connOverlay: connOverlay4,
          pickMode: pickConnectMode,
        })
      ) {
        hasPendingStructuralOps2 = !![];
        if (isNodeType4) hasPendingStructuralVideoMounts = !![];
        if (isVisibleVideoMediaNode) hasPendingVisibleVideoMounts2 = !![];
        enabled42 && (hasPendingFullEligibleVisibleImageMounts2 = !![]);
        continue;
      }
      if (value204 && isNodeType4 && mountedHeavyMediaThisFrame && !shouldHydrateVideoMediaImmediately2) {
        ((hasPendingStructuralOps2 = !![]), (hasPendingStructuralVideoMounts = !![]));
        if (isVisibleVideoMediaNode) hasPendingVisibleVideoMounts2 = !![];
        continue;
      }
      const enabled43 = rendererStructuralBudget['hasBudget']();
      if (!enabled43 && !shouldHydrateVideoMediaImmediately2) {
        hasPendingStructuralOps2 = !![];
        if (isNodeType4) hasPendingStructuralVideoMounts = !![];
        if (isVisibleVideoMediaNode) hasPendingVisibleVideoMounts2 = !![];
        enabled42 && (hasPendingFullEligibleVisibleImageMounts2 = !![]);
        continue;
      }
      const deferDetailsOnMount = _nodeDetailHydration['shouldDeferNodeDetails']({
          node: node7,
          nodeId: nodeId11,
          isSelected: isSelected7,
          connOverlay: connOverlay4,
          pickMode: pickConnectMode,
          relatedNodeIds: relatedNodeIds4,
          viewport: viewport6,
          mountCandidateCount: mountCandidateIds3['size'],
          nodeCount: nodeCount4,
          forceDeferActiveNodeDetails:
            shouldForceDeferActiveNodeDetails({
              nodeId: nodeId11,
              dragContext: dragContext4,
              dragTargets: activeNodeIds,
            }) ||
            (interactionBusy?.['viewportPriorityMediaOnly'] === !![] && isNodeType3 && !shouldHydrateVideoMediaImmediately2) ||
            shouldForceDeferRelatedVideoDetails2,
        }),
        eagerVideoPreviewOnMount = ![],
        shouldDeferInitialVideoMediaOnMount2 = shouldDeferInitialVideoMediaOnMount({
          node: node7,
          nodeId: nodeId11,
          isSelected: isSelected7,
          isSelectionRelated: isSelectionRelated7,
          dragTargets: activeNodeIds,
          nodeCount: nodeCount4,
          mountCandidateCount: mountCandidateIds3['size'],
        });
      ((deferMediaOnMount = (deferDetailsOnMount || shouldDeferInitialVideoMediaOnMount2) && !eagerVideoPreviewOnMount),
        (value207 =
          deferMediaOnMount && (!deferDetailsOnMount || isVisibleVideoMediaNode) && (!isNodeType4 || !resolveCanvasVideoPosterUrl(node7))));
      const args8 = {
          deferDetailsOnMount: deferDetailsOnMount,
          deferMediaOnMount: deferMediaOnMount,
          eagerVideoPreviewOnMount: eagerVideoPreviewOnMount,
        },
        variant = [
          deferDetailsOnMount ? 'details-deferred' : 'details-ready',
          deferMediaOnMount ? 'media-deferred' : 'media-ready',
          eagerVideoPreviewOnMount ? 'video-eager' : 'video-lazy',
        ]['join']('|'),
        enabled44 = _rendererMediaRuntimePreparer['hasPrepared'](nodeId11, node7, variant),
        interactionPriority = isRendererMediaRuntimeInteractionPriority({
          nodeId: nodeId11,
          isSelected: isSelected7,
          isSelectionRelated: isSelectionRelated7,
          dragTargets: activeNodeIds,
          connOverlay: connOverlay4,
          pickMode: pickConnectMode,
        }),
        shouldPrebuildRendererMediaRuntime2 = shouldPrebuildRendererMediaRuntime({
          node: node7,
          nodeCount: nodeCount4,
          veryDenseNodeCount: RENDERER_VIRTUALIZATION_CONFIG['veryDenseNodeCount'],
          hasExactVisiblePreview: domPreviewCandidateIds['has'](nodeId11) && domPreviewMediaSourceOwnerIds['has'](nodeId11),
          interactionBusy: viewportBusy,
          interactionPriority: interactionPriority,
          deferMediaOnMount: deferMediaOnMount,
          eagerVideoPreviewOnMount: eagerVideoPreviewOnMount,
          viewportPriorityMediaOnly: interactionBusy?.['viewportPriorityMediaOnly'] === !![],
          idlePreparationSupported: typeof requestIdleCallback === 'function',
        });
      if (!enabled44 && shouldPrebuildRendererMediaRuntime2) {
        (_rendererMediaRuntimePreparer['enqueue']({
          nodeId: nodeId11,
          version: node7,
          variant: variant,
          isValid: () =>
            _currentSnapshot?.['nodes']?.[nodeId11] === node7 && !_componentMap['has'](nodeId11),
          prepare: () =>
            prepareRendererNodeRuntime({
              node: node7,
              selectedNodeSet: selectedNodeSet4,
              selectedNodeRankMap: selectedNodeRankMap4,
              dragContext: dragContext4,
              dragTargets: activeNodeIds,
              options: { ...args8, prebuildOffscreen: !![] },
            }),
          dispose: disposePreparedRendererNodeRuntime,
        }),
          (hasPendingStructuralOps2 = !![]));
        if (isNodeType4) hasPendingStructuralVideoMounts = !![];
        if (isVisibleVideoMediaNode) hasPendingVisibleVideoMounts2 = !![];
        enabled42 && (hasPendingFullEligibleVisibleImageMounts2 = !![]);
        continue;
      }
      !enabled44 && !shouldPrebuildRendererMediaRuntime2 && _rendererMediaRuntimePreparer['forget'](nodeId11);
      if (isVisibleVideoMediaNode && !shouldHydrateVideoMediaImmediately2 && !_videoHydrationBackpressure['tryAcquire']()) {
        hasPendingStructuralOps2 = hasPendingStructuralVideoMounts = hasPendingVisibleVideoMounts2 = !![];
        continue;
      }
      const value210 = lifecycleStats2 ? _nowMs() : 0x0,
        value211 = enabled44 ? _rendererMediaRuntimePreparer['take'](nodeId11, node7, variant) : null;
      ({ wrapperEl: wrapperEl3, instance: instance } = value211
        ? _registerNodeRuntime(value211)
        : _createNodeRuntime(node7, selectedNodeSet4, selectedNodeRankMap4, dragContext4, activeNodeIds, args8));
      lifecycleStats2 &&
        recordRendererLifecycleDuration(
          lifecycleStats2,
          'create',
          node7,
          _nowMs() - value210,
          value211 ? 'commit-prepared-runtime' : deferMediaOnMount ? 'create-deferred-media' : 'create',
        );
      !enabled37 && (enabled37 = document['createDocumentFragment']());
      (_mountNode(nodeId11, enabled37), (mountedThisFrame2 = !![]), heavyMediaUpdateFrameBudget['consume'](node7));
      if (shouldHydrateVideoMediaImmediately2) _videoHydrationBackpressure['markPriorityWork']();
      if (isNodeType4) mountedHeavyMediaThisFrame = !![];
      if (enabled43) rendererStructuralBudget['consume']();
    } else {
      if (!enabled38) {
        if (
          !enabled42 &&
          heavyMediaUpdateFrameBudget['shouldDefer']({
            node: node7,
            nodeId: nodeId11,
            isSelected: isSelected7,
            isSelectionRelated: isSelectionRelated7,
            dragTargets: activeNodeIds,
            connOverlay: connOverlay4,
            pickMode: pickConnectMode,
          })
        ) {
          hasPendingStructuralOps2 = !![];
          if (isNodeType4) hasPendingStructuralVideoMounts = !![];
          if (isVisibleVideoMediaNode) hasPendingVisibleVideoMounts2 = !![];
          enabled42 && (hasPendingFullEligibleVisibleImageMounts2 = !![]);
          continue;
        }
        if (value204 && isNodeType4 && mountedHeavyMediaThisFrame && !shouldHydrateVideoMediaImmediately2) {
          ((hasPendingStructuralOps2 = !![]), (hasPendingStructuralVideoMounts = !![]));
          if (isVisibleVideoMediaNode) hasPendingVisibleVideoMounts2 = !![];
          continue;
        }
        const enabled45 = rendererStructuralBudget['hasBudget']();
        if (!enabled45 && !shouldHydrateVideoMediaImmediately2) {
          hasPendingStructuralOps2 = !![];
          if (isNodeType4) hasPendingStructuralVideoMounts = !![];
          if (isVisibleVideoMediaNode) hasPendingVisibleVideoMounts2 = !![];
          enabled42 && (hasPendingFullEligibleVisibleImageMounts2 = !![]);
          continue;
        }
        if (isVisibleVideoMediaNode && !shouldHydrateVideoMediaImmediately2 && !_videoHydrationBackpressure['tryAcquire']()) {
          hasPendingStructuralOps2 = hasPendingStructuralVideoMounts = hasPendingVisibleVideoMounts2 = !![];
          continue;
        }
        !enabled37 && (enabled37 = document['createDocumentFragment']());
        const value212 = lifecycleStats2 ? _nowMs() : 0x0;
        _mountNode(nodeId11, enabled37);
        lifecycleStats2 &&
          recordRendererLifecycleDuration(lifecycleStats2, 'remount', node7, _nowMs() - value212, 'remount');
        ((mountedThisFrame2 = !![]), heavyMediaUpdateFrameBudget['consume'](node7));
        if (shouldHydrateVideoMediaImmediately2) _videoHydrationBackpressure['markPriorityWork']();
        if (isNodeType4) mountedHeavyMediaThisFrame = !![];
        if (enabled45) rendererStructuralBudget['consume']();
      } else
        isViewportPriorityImageNode2 &&
          wrapperEl3?.['dataset']?.['detailStage'] === 'deferred' &&
          (_nodeDetailHydration['hydrateNodeDetails'](nodeId11, wrapperEl3),
          _rendererDeferredMedia['hydrateNow'](nodeId11));
    }
    const deferHydrate = shouldQueueNodeDetailHydration({
        wrapperEl: wrapperEl3,
        nodeId: nodeId11,
        isSelected: isSelected7,
        isSelectionRelated: isSelectionRelated7,
        dragTargets: activeNodeIds,
        connOverlay: connOverlay4,
        pickMode: pickConnectMode,
        viewportBusyForPreview: viewportBusy,
        mountCandidateCount: mountCandidateIds3['size'],
        nodeCount: nodeCount4,
        options: interactionBusy,
      }),
      enabled46 =
        nodeCount4 >= 0x78 &&
        isNodeType(node7, ['ai-video', 'ai-audio']) &&
        !isSelected7 &&
        (!isSelectionRelated7 || shouldForceDeferRelatedVideoDetails2) &&
        !activeNodeIds?.['has']?.(nodeId11) &&
        connOverlay4?.['srcId'] !== nodeId11 &&
        connOverlay4?.['hoverId'] !== nodeId11 &&
        pickConnectMode?.['sourceNodeId'] !== nodeId11 &&
        pickConnectMode?.['hoverNodeId'] !== nodeId11 &&
        node7?.['isVideosExpanded'] !== !![] &&
        node7?.['isImagesExpanded'] !== !![];
    (mountedThisFrame2 || wrapperEl3?.['dataset']?.['detailStage'] === 'deferred') &&
      (_nodeDetailHydration['syncNodeDetailMountStage']({
        wrapperEl: wrapperEl3,
        node: node7,
        nodeId: nodeId11,
        isSelected: isSelected7,
        connOverlay: connOverlay4,
        pickMode: pickConnectMode,
        relatedNodeIds: relatedNodeIds4,
        viewport: viewport6,
        mountCandidateCount: mountCandidateIds3['size'],
        nodeCount: nodeCount4,
        autoHydrate:
          !enabled46 &&
          isNodeType(node7, ['source-video', 'ai-video', 'video', 'source-audio', 'ai-audio', 'audio']),
        deferHydrate: deferHydrate,
        forceDeferActiveNodeDetails:
          shouldForceDeferActiveNodeDetails({
            nodeId: nodeId11,
            dragContext: dragContext4,
            dragTargets: activeNodeIds,
          }) ||
          (interactionBusy?.['viewportPriorityMediaOnly'] === !![] && isNodeType3 && !shouldHydrateVideoMediaImmediately2) ||
          shouldForceDeferRelatedVideoDetails2,
      }),
      mountedThisFrame2 &&
        isNodeType(node7, ['source-video', 'ai-video', 'video', 'source-audio', 'ai-audio', 'audio']) &&
        !enabled46 &&
        shouldQueueNodeDetailHydration({
          wrapperEl: wrapperEl3,
          nodeId: nodeId11,
          isSelected: isSelected7,
          isSelectionRelated: isSelectionRelated7,
          dragTargets: activeNodeIds,
          connOverlay: connOverlay4,
          pickMode: pickConnectMode,
          viewportBusyForPreview: viewportBusy,
          mountCandidateCount: mountCandidateIds3['size'],
          nodeCount: nodeCount4,
          options: interactionBusy,
        }) &&
        _nodeDetailHydration['enqueueNodeDetailHydration'](nodeId11));
    const value213 = _pendingNodeDataMap['get'](nodeId11),
      node8 = value213?.['node'] || node7,
      inEdgeSig4 = _getIncomingEdgeSignature(nodeId11, value181, nodes),
      mediaLodMode4 = syncNodeMediaLodMode(wrapperEl3, node8, viewport6, { interactionBusy: viewportBusy }),
      signature5 = buildRendererNodeSignature({
        node: node8,
        inEdgeSig: inEdgeSig4,
        pickMode: pickConnectMode,
        isSelected: isSelected7,
        isSelectionRelated: isSelectionRelated7,
        showVideoMeta: showVideoMeta4,
        viewport: viewport6,
        mediaLodMode: mediaLodMode4,
      }),
      skipInstanceUpdate3 = shouldSkipInitialMediaNodeUpdate(node8, mountedThisFrame2),
      value214 =
        isNodeType4 &&
        _isNodeVisible(node8, viewport6, width4, height4) &&
        (value209 ||
          shouldHydrateVideoMediaImmediately2 ||
          resolveRendererLowZoomMountLimit({ viewport: viewport6, nodeCount: nodeCount4 }) <= 0x0) &&
        instance?.['prepareRendererVisibleVideoPreview']?.() === !![],
      _syncMountedNodePresentation2 = _syncMountedNodePresentation({
        wrapperEl: wrapperEl3,
        node: node8,
        nodeId: nodeId11,
        selectedNodeSet: selectedNodeSet4,
        selectedNodeRankMap: selectedNodeRankMap4,
        connOverlay: connOverlay4,
        pickMode: pickConnectMode,
        viewport: viewport6,
        containerW: width4,
        containerH: height4,
        dragContext: dragContext4,
        dragTargets: activeNodeIds,
        showVideoMeta: showVideoMeta4,
        relatedNodeIds: relatedNodeIds4,
        relatedHighlightColor: relatedHighlightColor4,
        inEdgeSig: inEdgeSig4,
        signature: signature5,
        mediaLodMode: mediaLodMode4,
        skipInstanceUpdate: skipInstanceUpdate3,
        deferInstanceUpdate:
          shouldDeferHeavyMediaUpdate({
            node: node8,
            nodeId: nodeId11,
            viewportBusyForPreview: viewportBusy,
            nodeCount: nodeCount4,
            skipInstanceUpdate: skipInstanceUpdate3,
          }) ||
          (!mountedThisFrame2 &&
            heavyMediaUpdateFrameBudget['shouldDefer']({
              node: node8,
              nodeId: nodeId11,
              isSelected: isSelected7,
              isSelectionRelated: isSelectionRelated7,
              dragTargets: activeNodeIds,
              connOverlay: connOverlay4,
              pickMode: pickConnectMode,
            })),
        mountedThisFrame: mountedThisFrame2,
        lifecycleStats: lifecycleStats2,
        allowActiveDetailHydration: !deferHydrate && !enabled46,
      });
    if (_syncMountedNodePresentation2?.['deferredUpdate']) {
      hasPendingStructuralOps2 = !![];
      if (isNodeType4) hasPendingStructuralVideoMounts = !![];
      if (isVisibleVideoMediaNode) hasPendingVisibleVideoMounts2 = !![];
    }
    if (_syncMountedNodePresentation2?.['didUpdate']) {
      heavyMediaUpdateFrameBudget['consume'](node8);
      if (isNodeType4) updatedHeavyMediaThisFrame = !![];
    }
    if (value207 || value214) {
      _fastPreviewLayer['retainNode'](nodeId11);
      if (value214) {
        if (mountedThisFrame2) _rendererDeferredMedia['hydrateNow'](nodeId11);
        else _rendererDeferredMedia['enqueue'](nodeId11, { urgent: !![] });
      } else _rendererDeferredMedia['enqueue'](nodeId11);
    }
    const isVisible = _isNodeVisible(node8, viewport6, width4, height4);
    (handler2({
      node: node8,
      nodeId: nodeId11,
      isVisible: isVisible,
      isSelected: isSelected7,
      component: instance,
    }),
      value213 && _pendingNodeDataMap['delete'](nodeId11));
  }
  const count3 = enabled37?.['childNodes']?.['length'] || 0x0,
    value215 = lifecycleStats2 && count3 > 0x0 ? _nowMs() : 0x0;
  _flushMountBatch(canvasEl2, enabled37);
  if (lifecycleStats2 && count3 > 0x0) {
    const _nowMs4 = _nowMs() - value215;
    ((lifecycleStats2['mountBatchCount'] += count3),
      (lifecycleStats2['mountBatchFlushMs'] += _nowMs4),
      (lifecycleStats2['mountBatchFlushMaxMs'] = Math['max'](lifecycleStats2['mountBatchFlushMaxMs'], _nowMs4)));
  }
  return (
    syncRendererFastPreviewAfterNodeRender({
      continuation: _fastPreviewContinuation,
      layer: _fastPreviewLayer,
      canvasEl: canvasEl2,
      nodes: nodes,
      previewCandidateIds: previewCandidateIds,
      selectedNodeSet: selectedNodeSet4,
      candidateSignature: candidateSignature,
      hasPendingStructuralOps: hasPendingStructuralOps2,
      connOverlay: connOverlay4,
      pickConnectMode: pickConnectMode,
      nodeCount: nodeCount4,
      viewport: viewport6,
      containerWidth: width4,
      containerHeight: height4,
      freezeRasterSurface: freezeActive['freezeActive'] === !![],
      deferVisibleMediaSrc: interactionBusy?.['deferInitialRasterPlanning'] === !![],
      suppressNewMedia: suppressNewMedia,
      mediaSourceOwnerIds: domPreviewMediaSourceOwnerIds,
      requiredImmediateMediaSourceOwnerIds: requiredImmediateMediaSourceOwnerIds,
      viewportBusy: viewportBusy,
      dragContext: dragContext4,
      dragTargets: activeNodeIds,
      suspendNewMediaSrc: suspendNewMediaSrc,
      fullEligibleVisibleImageNodeIds: fullEligibleVisibleImageNodeIds,
      fullEligiblePreviewImageNodeIds: fullEligiblePreviewImageNodeIds,
      ..._fastPreviewLifecycle['getContinuationOptions'](),
      mountedHeavyMediaThisFrame: mountedHeavyMediaThisFrame,
      updatedHeavyMediaThisFrame: updatedHeavyMediaThisFrame,
      hasPendingStructuralVideoMounts: hasPendingStructuralVideoMounts,
    }),
    lifecycleStats2 && recordRendererNodeLifecycleSample(lifecycleStats2),
    {
      hasPendingStructuralOps: hasPendingStructuralOps2,
      deferredParkCount: deferredParkCount2,
      hasPendingVisibleVideoMounts: hasPendingVisibleVideoMounts2,
      hasPendingFullEligibleVisibleImageMounts: hasPendingFullEligibleVisibleImageMounts2,
    }
  );
}
function _renderNodes(...args9) {
  if (!_rendererRuntimeDiagnosticsEnabled) return _renderNodesImpl(...args9);
  const _nowMs5 = _nowMs(),
    previewOnly = args9[0xc] || {},
    value216 = args9[0x1] || {},
    value217 = args9[0xb] || null,
    nodeCount5 = Number['isFinite'](previewOnly?.['framePlan']?.['nodeCount'])
      ? previewOnly['framePlan']['nodeCount']
      : Number['isFinite'](value217?.['_nodeCount'])
        ? value217['_nodeCount']
        : Object['keys'](value216)['length'];
  _rendererRuntimeDiagnosticRenderState = {
    previewOnly: previewOnly?.['previewOnly'] === !![],
    viewportBusy:
      previewOnly?.['viewportBusy'] === !![] ||
      previewOnly?.['deferParking'] === !![] ||
      previewOnly?.['deferHeavyMediaMount'] === !![] ||
      _rendererInteractionGrace['isBusy'](),
  };
  try {
    return _renderNodesImpl(...args9);
  } finally {
    recordRendererRuntimeDiagnostic({
      kind: 'render-nodes',
      mode: previewOnly?.['mode'] || 'steady',
      previewOnly: previewOnly?.['previewOnly'] === !![],
      nodeCount: nodeCount5,
      durationMs: _nowMs() - _nowMs5,
    });
  }
}
function _cleanupNodes(el23, value218) {
  let value219 = ![];
  const map6 = new Set(Object['keys'](value218 || {})),
    value220 = new Set([
      ..._componentMap['keys'](),
      ..._wrapperMap['keys'](),
      ..._parkedWrapperMap['keys'](),
      ..._mountedNodeIds,
      ..._parkedNodeIds,
    ]);
  for (const value221 of value220) {
    !map6['has'](value221) && (_destroyNode(value221), (value219 = !![]));
  }
  el23['querySelectorAll']('.v2-node')['forEach']((el24) => {
    const value222 = el24['id'] || el24['dataset']['nodeId'];
    value222 && !map6['has'](value222) && (el24['remove'](), (value219 = !![]));
  });
  if (value219) {
    const el25 = document['getElementById']('v2-side-plus-holder');
    el25 && el25['children']['length'] > 0x0 && el25['replaceChildren']();
  }
}
function _createSvgLayer() {
  const el26 = document['createElement']('div');
  ((el26['id'] = 'v2-edges-wrapper'),
    (el26['style']['position'] = 'absolute'),
    (el26['style']['top'] = '0'),
    (el26['style']['left'] = '0'),
    (el26['style']['width'] = '100%'),
    (el26['style']['height'] = '100%'),
    (el26['style']['pointerEvents'] = 'none'),
    (el26['style']['zIndex'] = '5'));
  const el27 = document['createElementNS']('http://www.w3.org/2000/svg', 'svg');
  return (
    (el27['id'] = 'v2-edges'),
    (el27['style']['overflow'] = 'visible'),
    (el27['style']['pointerEvents'] = 'none'),
    el26['appendChild'](el27),
    el26
  );
}
function _renderEdgesByIds(
  svgEl2,
  edgeIds,
  edges2,
  nodes2,
  viewport7,
  containerEl2,
  dragOffsetCtx2 = null,
  relatedEdgeIds4 = null,
  options3 = {},
) {
  const value223 = _edgeLayer['renderPartial']({
    svgEl: svgEl2,
    edgeIds: edgeIds,
    edges: edges2,
    nodes: nodes2,
    viewport: viewport7,
    containerEl: containerEl2,
    dragOffsetCtx: dragOffsetCtx2,
    relatedEdgeIds: relatedEdgeIds4,
    options: options3,
  });
  if (value223['mutated']) _invalidateFullEdgeRenderSignature();
}
function _renderEdges(
  svgEl3,
  edges3,
  nodes3,
  viewport8,
  containerEl3,
  dragOffsetCtx3 = null,
  relatedEdgeIds5 = null,
  edgeEntries2 = null,
  reason = 'steady',
  args10 = {},
) {
  (_edgeLayer['renderFull']({
    svgEl: svgEl3,
    edges: edges3,
    nodes: nodes3,
    viewport: viewport8,
    containerEl: containerEl3,
    dragOffsetCtx: dragOffsetCtx3,
    relatedEdgeIds: relatedEdgeIds5,
    edgeEntries: edgeEntries2,
    reason: reason,
    options: { ...args10, clearedDom: _edgeDomClearedSinceLastFull === !![] },
  }),
    args10?.['renderSignature'] && (_lastFullEdgeRenderSignature = args10['renderSignature']),
    (_edgeDomClearedSinceLastFull = ![]));
}
function _clearRenderedEdges(value224) {
  const count4 = _edgeLayer['clearRenderedEdges'](value224);
  count4 > 0x0 && _invalidateFullEdgeRenderSignature({ clearedDom: !![] });
}
function _clearRenderedEdgesFromDocument() {
  if (typeof document === 'undefined') {
    _edgeLayer['reset']();
    return;
  }
  const value225 = document['getElementById']?.('v2-edges');
  (_clearRenderedEdges(value225),
    document['getElementById']?.('v2-draft-edge')?.['remove']?.(),
    document['querySelectorAll']?.('.v2-edge-thumbnail')['forEach']((el28) => el28['remove']()),
    document['querySelectorAll']?.('[id^="v2-thumb-"]')['forEach']((el29) => el29['remove']()));
}
function _cleanupEdges(value226, value227) {
  const count5 = _edgeLayer['cleanupEdges'](value226, value227);
  (document['querySelectorAll']('.v2-edge-thumbnail')['forEach']((el30) => el30['remove']()),
    document['querySelectorAll']('[id^="v2-thumb-"]')['forEach']((el31) => el31['remove']()),
    count5 > 0x0 && _invalidateFullEdgeRenderSignature({ clearedDom: !![] }));
}
function _createPickerEl() {
  const el32 = document['createElement']('div');
  return (
    (el32['id'] = 'v2-picker'),
    (el32['dataset']['uiStop'] = '1'),
    Object['assign'](el32['style'], {
      position: 'fixed',
      display: 'none',
      flexDirection: 'column',
      gap: '4px',
      background: 'var(--preset-menu-bg)',
      border: '1px\x20solid\x20var(--preset-menu-border)',
      borderRadius: 'var(--radius-18)',
      padding: '8px',
      minWidth: '160px',
      boxShadow: 'var(--preset-menu-shadow)',
      backdropFilter: 'blur(var(--preset-menu-blur))',
      zIndex: '1000',
      fontFamily: 'inherit',
    }),
    el32
  );
}
function _renderPicker(el33, enabled47, value228) {
  if (!enabled47['visible']) {
    ((el33['style']['display'] = 'none'), el33['replaceChildren']());
    return;
  }
  ((el33['style']['display'] = 'flex'),
    (el33['style']['left'] = enabled47['screenX'] + 'px'),
    (el33['style']['top'] = enabled47['screenY'] + 'px'));
  if (el33['children']['length'] > 0x0) return;
  const el34 = document['createElement']('div');
  ((el34['textContent'] = t('coreUi.renderer.picker.addNode')),
    Object['assign'](el34['style'], {
      fontSize: '11px',
      color: 'var(--text-muted)',
      padding: '2px 4px 6px',
      borderBottom: '1px solid var(--white-08)',
      marginBottom: '4px',
      userSelect: 'none',
    }),
    el33['appendChild'](el34));
  const rendererPickerNodeTypes = getRendererPickerNodeTypes();
  for (const {
    type: type,
    label: label,
    defaultLabel: defaultLabel,
    width: width5,
    height: height5,
  } of rendererPickerNodeTypes) {
    const el35 = document['createElement']('button');
    ((el35['textContent'] = label),
      (el35['dataset']['nodeType'] = type),
      (el35['dataset']['defaultLabel'] = defaultLabel),
      (el35['dataset']['width'] = String(width5)),
      (el35['dataset']['height'] = String(height5)),
      Object['assign'](el35['style'], {
        background: 'var(--blue-10)',
        border: '1px solid var(--blue-25)',
        borderRadius: '6px',
        color: 'var(--blue)',
        fontSize: '13px',
        padding: '7px 12px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background\x200.15s',
      }),
      el33['appendChild'](el35));
  }
}
function _createSelectionRectEl() {
  const el36 = document['createElement']('div');
  return (
    (el36['id'] = 'v2-selection-rect'),
    Object['assign'](el36['style'], {
      position: 'absolute',
      border: '1px dashed var(--white-50)',
      backgroundColor: 'var(--white-02)',
      pointerEvents: 'none',
      display: 'none',
      zIndex: '1000',
    }),
    el36
  );
}
function _renderSelectionRect(el37, enabled48) {
  if (!enabled48 || !enabled48['active']) {
    el37['style']['display'] = 'none';
    return;
  }
  el37['style']['display'] = 'block';
  const value229 = Math['min'](enabled48['x1'], enabled48['x2']),
    value230 = Math['min'](enabled48['y1'], enabled48['y2']),
    value231 = Math['abs'](enabled48['x2'] - enabled48['x1']),
    value232 = Math['abs'](enabled48['y2'] - enabled48['y1']);
  ((el37['style']['left'] = value229 + 'px'),
    (el37['style']['top'] = value230 + 'px'),
    (el37['style']['width'] = value231 + 'px'),
    (el37['style']['height'] = value232 + 'px'));
}
