import { isNodeType } from '../modules/registry.js';
import { getRefKindByNodeType, hasNodeTypeBetaBadge, normalizeNodeType } from '../modules/nodeMeta.js';
import { getDragContext } from './interaction.js';
import { getViewportPanPreview } from './viewportPanPreview.js';
import { getAlignableSelectionNodes, computeSelectionBounds } from './math.js';
import {
  isPerfProbeEnabled,
  recordEdgeRedrawSample,
  recordRenderFrameSample,
} from '../modules/perf/perfProbe.js';
import {
  buildVirtualizationCandidateSets,
  createRendererStructuralBudget,
  getRendererStructuralReconcileDelayMs,
  isNodeInsideViewportPadding,
  RENDERER_VIRTUALIZATION_CONFIG,
} from './rendererVirtualization.js';
import {
  clearRendererSpatialIndexCache,
  collectVirtualizedRenderNodes,
  getCachedRendererSpatialIndex,
} from './rendererSpatialIndex.js';
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
import { getAIGenerationDefaultSizeByType } from '../services/fileService.js';
import { buildGroupOutputMembershipSignature } from '../modules/groupDynamicOutput.js';
import { getMediaComposeButtonLabel, getSelectedMediaComposeKind } from '../modules/mediaComposeSelection.js';
import { getSelectedSyncPlayableVideoCount } from '../modules/videoSyncPlayback.js';
import {
  createContextMenuEl,
  createPickConnectBannerEl,
  renderContextMenu,
  renderPickConnectBanner,
} from './rendererOverlays.js';
import { createRendererInteractionGraceController } from './rendererInteractionGrace.js';
import { createRendererPresentationSubscription } from './rendererPresentationSubscription.js';
import { createRendererFramePlan } from './rendererFramePlan.js';
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
import { createRendererMediaPresentationCoordinator } from './rendererMediaPresentationCoordinator.js';
import { createRendererSourceVideoSlotLifecycle } from './rendererSourceVideoSlotLifecycle.js';
import { resolveRendererVideoMediaLeaseKey } from './rendererVideoMediaResidency.js';
import { syncRendererBridge } from './rendererBridge.js';
import { resolveModelProvider } from '../manifests/index.js';
import { syncNodeMediaLodMode } from './rendererNodeMediaLod.js';
import { buildRendererNodeSignature } from './rendererNodeSignature.js';
import { syncNodeResultClass } from './rendererNodeResultState.js';
import { syncNodeMediaMetricsDataset } from '../modules/nodeMediaMetrics.js';
import { createRendererNodeRuntimeBridge } from './rendererNodeRuntimeBridge.js';
import {
  disposePreparedRendererNodeRuntime,
  prepareRendererNodeRuntime,
} from './rendererNodeRuntimeFactory.js';
import {
  createRendererMediaRuntimePreparer,
  shouldPrebuildRendererMediaRuntime,
} from './rendererMediaRuntimePreparer.js';
import { shouldDeferInitialVideoMediaOnMount } from './rendererPriorityMediaWork.js';
import {
  isRendererRuntimeDiagnosticsEnabled,
  recordRendererRuntimeDiagnostic,
} from './rendererRuntimeDiagnostics.js';
import {
  buildRendererDragTargetSet,
  buildSelectedNodeRankMap,
  getRendererDefaultNodeLabel,
  getRendererNodeZIndex,
  shouldSkipInitialMediaNodeUpdate,
  syncRendererFastPreviewPresentationOwner,
} from './rendererNodePresentation.js';
import { t } from '../i18n/index.js';
import { setCanvasMediaSchedulerPaused } from '../modules/canvasMediaScheduler.js';
let _schedulePreparedMediaRuntimeCommit = null;
const _componentMap = new Map(),
  _nodeRuntimeBridge = createRendererNodeRuntimeBridge({
    getInstance: (value) => _componentMap.get(value),
  }),
  _nodeDataSnapshotMap = new Map(),
  _wrapperMap = new Map();
let _msHiddenNodeIds = new Set();
const _multiSelectRenderCache = {
    geometrySig: '',
    runBtnDisabled: null,
    resetBtnVisible: null,
    composeBtnVisible: null,
    composeBtnKind: '',
  },
  _alignPanelRenderCache = { centerSig: '', buttonStateSig: '' },
  _mountedNodeIds = new Set(),
  _parkedNodeIds = new Set(),
  _parkedWrapperMap = new Map(),
  _pendingNodeDataMap = new Map(),
  _nodeTypeSnapshotMap = new Map(),
  _nodePinReasons = new Map(),
  _rendererInteractionGrace = createRendererInteractionGraceController({
    delayMs: RENDERER_VIRTUALIZATION_CONFIG.parkAfterInteractionDelayMs,
    getDragContext: getDragContext,
    onBusyStateChange: setCanvasMediaSchedulerPaused,
  }),
  _fastPreviewLifecycle = createRendererFastPreviewLifecycleTracker(),
  _sourceVideoSlotLifecycle = createRendererSourceVideoSlotLifecycle({
    getNode: (item) => _currentSnapshot?.nodes?.[item],
    getWrapper: (key) => _wrapperMap.get(key),
    releasePreview: (index) => _fastPreviewLayer.releaseNode(index),
    forgetScheduledRelease: (result) => _fastPreviewRelease.forget(result),
  }),
  _fastPreviewLayer = createRendererFastPreviewLayer({
    getWrapper: (data) => _wrapperMap.get(data),
    isMounted: (options) => _mountedNodeIds.has(options),
    resolveMediaPresentationReady: _sourceVideoSlotLifecycle.resolveMediaPresentationReady,
    onPresentationOwnerChanged: ({ active: active, wrapper: wrapper }) => {
      syncRendererFastPreviewPresentationOwner(wrapper, active);
    },
    onMediaPresented: () => {
      if (_rendererInteractionGrace.isBusy()) return;
      _schedulePreparedMediaRuntimeCommit?.();
    },
  }),
  _fastPreviewContinuation = createRendererFastPreviewContinuationController({
    sync: (...args) => _fastPreviewLayer.sync(...args),
  }),
  _fastPreviewRelease = createFastPreviewReleaseScheduler({
    getWrapper: (target) => _wrapperMap.get(target),
    hasPreview: (source) => _fastPreviewLayer.hasNodePreview(source),
    isMounted: (next) => _mountedNodeIds.has(next),
    isInteractionBusy: _rendererInteractionGrace.isBusy,
    resolveMediaPresentationReady: _sourceVideoSlotLifecycle.resolveMediaPresentationReady,
    releasePreview: (current) => _fastPreviewLayer.releaseNode(current),
  }),
  _rasterPreviewCoordinator = createRendererRasterPreviewCoordinator({
    isDomMediaPresented: (entry, record) => _fastPreviewLayer.isNodePresentationReady(entry, record),
    onRasterHandoffFrame: _fastPreviewLayer.stageRasterHandoffFrame,
    onRasterMediaClaimed: (payload) => {
      _fastPreviewContinuation.excludeNodes(payload);
      for (const handle of payload) _fastPreviewLayer.removeNode(handle, { collect: false });
    },
    onMediaPresented: () => {
      if (_rendererInteractionGrace.isBusy()) return;
      _schedulePreparedMediaRuntimeCommit?.();
    },
  }),
  _mediaPresentation = createRendererMediaPresentationCoordinator({
    getNode: (state) => _currentSnapshot?.nodes?.[state],
    getComponent: (config) => _componentMap.get(config),
    getWrapper: (scope) => _wrapperMap.get(scope),
    getParkedWrapper: (input) => _parkedWrapperMap.get(input),
    getWrappers: () => _wrapperMap.values(),
    getParkedWrappers: () => _parkedWrapperMap.values(),
    isMounted: (output) => _mountedNodeIds.has(output),
    isInteractionBusy: _rendererInteractionGrace.isBusy,
    isPinned: (value2) => _getNodePinSet(value2, false)?.size > 0,
    isSelected: (value3) => {
      const list = _currentSnapshot?.selectedNodeIds;
      return Array.isArray(list) ? list.includes(value3) : list?.has?.(value3) === true;
    },
    preview: _fastPreviewLayer,
    previewRelease: _fastPreviewRelease,
    videoSlots: _sourceVideoSlotLifecycle,
    batchSize: 2,
    presentedMediaLeaseMs: 600,
    maxRetainedPresentedMedia: 3,
  }),
  {
    media: _rendererDeferredMedia,
    details: _nodeDetailHydration,
    residency: _videoMediaResidency,
    videoBackpressure: _videoHydrationBackpressure,
  } = _mediaPresentation,
  _edgeLayer = createRendererEdgeLayer({
    getContainerSize: _getEdgeContainerSize,
    nowMs: _nowMs,
    recordRedrawSample: recordEdgeRedrawSample,
  }),
  _edgeDomCache = _edgeLayer.getDomCache(),
  _nodeToEdgeIds = new Map(),
  _incomingEdgeIdsByTarget = new Map(),
  SELECTION_RELATED_HIGHLIGHT_COLORS = Object.freeze([
    'white',
    'blue',
    'green',
    'cyan',
    'purple',
    'red',
    'yellow',
  ]);
const _rendererMediaRuntimePreparer = createRendererMediaRuntimePreparer({
  isInteractionBusy: _rendererInteractionGrace.isBusy,
  onPrepared: ({ nodeId, durationMs }) => {
    (isRendererRuntimeDiagnosticsEnabled() &&
      recordRendererRuntimeDiagnostic({
        kind: 'renderer-media-runtime-prepared',
        nodeId,
        durationMs,
      }),
      _schedulePreparedMediaRuntimeCommit?.());
  },
  onPrepareError: ({ nodeId, error }) => {
    console.error('[Renderer] media runtime prepare failed:', nodeId, error);
  },
});
let _edgeIndexRev = -1,
  _edgeEntriesRev = -1,
  _edgeEntriesSource = null,
  _edgeEntriesCache = [],
  _cachedContainerWidth = null,
  _cachedContainerHeight = null,
  _lastFullEdgeRenderSignature = '',
  _edgeDomClearedSinceLastFull = false,
  _lastVirtualCandidateSignature = '',
  _lastVirtualCandidateResult = null,
  _containerSizeSourceEl = null,
  _containerResizeObserver = null,
  _containerResizeHandler = null,
  _timerRafId = null,
  _currentSnapshot = null,
  _runningTimers = new Set(),
  _lastTimerSyncRev = -1;
const MANIFEST_MODEL_NODE_TYPES = new Set(['ai-image', 'ai-text', 'ai-video', 'ai-audio']);
export function refreshManifestModelNodeUis() {
  const refreshedNodeIds = [],
    remountedNodeIds = [];
  for (const [value4, value5] of [..._componentMap.entries()]) {
    const enabled = _currentSnapshot?.nodes?.[value4];
    if (!enabled || !MANIFEST_MODEL_NODE_TYPES.has(normalizeNodeType(enabled.type))) continue;
    if (typeof value5?.refreshModelRegistryUi === 'function')
      try {
        (value5.refreshModelRegistryUi(), refreshedNodeIds.push(value4));
        continue;
      } catch (value6) {
        console.warn('[Renderer] refresh model registry UI failed:', value6);
      }
    (_destroyNode(value4), remountedNodeIds.push(value4));
  }
  return { refreshedNodeIds: refreshedNodeIds, remountedNodeIds: remountedNodeIds };
}
function _hideTimer(value7) {
  const value8 = _wrapperMap.get(value7),
    el = value8?.__v2_timer_el;
  if (!el) return;
  el.textContent = '';
  if (el.style.display !== 'none') el.style.display = 'none';
}
function _cancelTimerLoopIfNeeded() {
  (_timerRafId !== null && typeof cancelAnimationFrame === 'function' && cancelAnimationFrame(_timerRafId),
    (_timerRafId = null));
}
function _ensureTimerLoopActive() {
  if (_runningTimers.size === 0) return;
  _timerRafId === null &&
    typeof requestAnimationFrame === 'function' &&
    (_timerRafId = requestAnimationFrame(_updateTimers));
}
function _hasResolvedMediaValue(enabled2, list2) {
  return (
    !!enabled2 &&
    typeof enabled2 === 'object' &&
    list2.some((item2) => !!String(enabled2?.[item2] || '').trim())
  );
}
function _isResolvedSourceMediaNode(value9) {
  if (isNodeType(value9, 'source-audio'))
    return _hasResolvedMediaValue(value9, ['src', 'audioUrl', 'localPath', 'resultUrl']);
  if (
    !isNodeType(value9, 'source-video') ||
    !!String(value9?.rhTaskId || value9?.asyncTaskId || value9?.dreaminaSubmitId || '').trim() ||
    value9?.rhTaskRecovering === true ||
    value9?.asyncTaskRecovering === true ||
    value9?.dreaminaTaskRecovering === true
  )
    return false;
  const list3 = Array.isArray(value9?.videos) ? value9.videos : [];
  return (
    _hasResolvedMediaValue(value9, [
      'src',
      'videoUrl',
      'localPath',
      'displayLocalPath',
      'originalLocalPath',
      'resultUrl',
      'capturePreviewUrl',
    ]) ||
    list3.some((item3) =>
      _hasResolvedMediaValue(item3, [
        'url',
        'videoUrl',
        'localPath',
        'displayLocalPath',
        'originalLocalPath',
        'resultUrl',
        'sourceUrl',
      ]),
    )
  );
}
function _isRunningTimerNode(value10) {
  return !!(
    value10?.generationStartTime &&
    value10.generationDuration == null &&
    !_isResolvedSourceMediaNode(value10)
  );
}
function _syncRunningTimerForNode(value11, value12, { hide: hide = false } = {}) {
  if (_isRunningTimerNode(value12)) {
    (_runningTimers.add(value11), _ensureTimerLoopActive());
    return;
  }
  if (_runningTimers.delete(value11) && hide) _hideTimer(value11);
  else hide && _hideTimer(value11);
  _runningTimers.size === 0 && _cancelTimerLoopIfNeeded();
}
function _updateTimers() {
  if (!_currentSnapshot || _runningTimers.size === 0) {
    _timerRafId = null;
    return;
  }
  const list4 = [];
  for (const value13 of _runningTimers) {
    const enabled3 = _currentSnapshot.nodes?.[value13];
    if (
      !enabled3 ||
      !enabled3.generationStartTime ||
      enabled3.generationDuration != null ||
      _isResolvedSourceMediaNode(enabled3)
    ) {
      list4.push(value13);
      continue;
    }
    const value14 = _wrapperMap.get(value13),
      el2 = value14?.__v2_timer_el;
    if (el2) {
      const value15 = Date.now() - enabled3.generationStartTime;
      el2.textContent = _formatNodeTimerText(enabled3, value15);
      if (el2.style.display === 'none') el2.style.display = '';
    }
  }
  list4.length > 0 &&
    list4.forEach((item4) => {
      (_runningTimers.delete(item4), _hideTimer(item4));
    });
  if (_runningTimers.size === 0) {
    _timerRafId = null;
    return;
  }
  _timerRafId = requestAnimationFrame(_updateTimers);
}
function _syncRunningTimers(value16) {
  const value17 = Number.isFinite(value16?._persistRev)
    ? value16._persistRev
    : Number.isFinite(value16?._nodeCount)
      ? value16._nodeCount
      : 0;
  if (value17 === _lastTimerSyncRev) return;
  _lastTimerSyncRev = value17;
  const value18 = value16?.nodes || {};
  for (const value19 of Array.from(_runningTimers)) {
    _syncRunningTimerForNode(value19, value18[value19], { hide: true });
  }
  for (const [value20, value21] of Object.entries(value18)) {
    if (!_isRunningTimerNode(value21)) continue;
    const enabled4 = String(value21?.id || value20 || '').trim();
    if (!enabled4) continue;
    _syncRunningTimerForNode(enabled4, value21);
  }
  _ensureTimerLoopActive();
}
function _clearRunningTimerState() {
  (_cancelTimerLoopIfNeeded(), _runningTimers.clear(), (_lastTimerSyncRev = -1), (_currentSnapshot = null));
}
function _getNodePinSet(value22, value23 = false) {
  let enabled5 = _nodePinReasons.get(value22);
  return (
    !enabled5 && value23 && ((enabled5 = new Set()), _nodePinReasons.set(value22, enabled5)),
    enabled5 || null
  );
}
function _getPinnedNodeIds() {
  const value24 = new Set();
  for (const [value25, value26] of _nodePinReasons.entries()) {
    value26 && value26.size > 0 && value24.add(value25);
  }
  return value24;
}
function _clearNodePin(value27) {
  _nodePinReasons.delete(value27);
}
function _clearAnchoredUiForNode(enabled6) {
  if (!enabled6) return;
  const value28 = _componentMap.get(enabled6);
  value28 && typeof value28.highlightCell === 'function' && value28.highlightCell(-1);
}
function _resolveVideoMediaLeaseKey(value29, value30) {
  const value31 = _sourceVideoSlotLifecycle.isManagedNode(value29)
    ? _sourceVideoSlotLifecycle.read(value29)
    : null;
  return resolveRendererVideoMediaLeaseKey(value30, value31);
}
function _parkNode(value32) {
  const el3 = _wrapperMap.get(value32);
  if (!el3) return null;
  _sourceVideoSlotLifecycle.isManagedNode(value32) &&
    (_sourceVideoSlotLifecycle.syncVisibility(value32, 'far'),
    _sourceVideoSlotLifecycle.setResidency(value32, 'parked'));
  return (
    _mediaPresentation.forgetHydration(value32),
    _syncRunningTimerForNode(value32, null, { hide: true }),
    el3.isConnected && el3.remove(),
    _videoMediaResidency.park(value32, {
      retainPresentedMedia: (() => {
        const value33 = _componentMap.get(value32);
        try {
          return value33?.hasPresentedRendererMedia?.() === true;
        } catch {
          return false;
        }
      })(),
      leaseKey: _resolveVideoMediaLeaseKey(value32, _currentSnapshot?.nodes?.[value32]),
    }),
    _mountedNodeIds.delete(value32),
    _parkedNodeIds.add(value32),
    _parkedWrapperMap.set(value32, el3),
    _fastPreviewLifecycle.record(_nodeTypeSnapshotMap.get(value32)),
    _clearAnchoredUiForNode(value32),
    _nodeRuntimeBridge.unregister(value32),
    el3
  );
}
function _mountNode(value34, el4) {
  const el5 = _wrapperMap.get(value34);
  if (!el5) return null;
  return (
    _videoMediaResidency.unpark(value34),
    !el5.isConnected && el4.appendChild(el5),
    _parkedWrapperMap.delete(value34),
    _parkedNodeIds.delete(value34),
    _mountedNodeIds.add(value34),
    _sourceVideoSlotLifecycle.setResidency(value34, 'mounted'),
    _fastPreviewLifecycle.record(_nodeTypeSnapshotMap.get(value34)),
    _nodeRuntimeBridge.register(value34),
    el5
  );
}
function _flushMountBatch(el6, enabled7) {
  if (!el6 || !enabled7) return;
  if (enabled7.childNodes && enabled7.childNodes.length === 0) return;
  el6.appendChild(enabled7);
}
function _destroyNode(value35) {
  (_rendererMediaRuntimePreparer.forget(value35),
    _mediaPresentation.forget(value35),
    _syncRunningTimerForNode(value35, null, { hide: true }));
  const value36 = _componentMap.get(value35);
  try {
    value36 && typeof value36.unmount === 'function' && value36.unmount();
  } catch {}
  const el7 = _wrapperMap.get(value35) || _parkedWrapperMap.get(value35);
  (el7 && el7.isConnected && el7.remove(),
    _componentMap.delete(value35),
    _nodeDataSnapshotMap.delete(value35),
    _wrapperMap.delete(value35),
    _mountedNodeIds.delete(value35),
    _parkedNodeIds.delete(value35),
    _parkedWrapperMap.delete(value35),
    _pendingNodeDataMap.delete(value35),
    _nodeTypeSnapshotMap.delete(value35),
    _nodeRuntimeBridge.unregister(value35),
    _sourceVideoSlotLifecycle.isManagedNode(value35) && _sourceVideoSlotLifecycle.forget(value35),
    _clearNodePin(value35),
    _fastPreviewLayer.discardNode(value35),
    _fastPreviewContinuation.excludeNodes([value35]));
}
function _syncRendererBridge() {
  syncRendererBridge(typeof window === 'undefined' ? null : window, {
    componentMap: _componentMap,
    wrapperMap: _wrapperMap,
    mountedNodeIds: _mountedNodeIds,
    nodeToEdgeIds: _nodeToEdgeIds,
    getEdgeLayerStats: _edgeLayer.getStats,
    hitTestEdgeAtScreenPoint: _edgeLayer.hitTestEdgeAtScreenPoint,
    prepareDynamicEdges: _edgeLayer.prepareDynamicEdges,
    setEdgeInteractionHighlight: _edgeLayer.setActiveEdge,
    setHoveredEdge: _edgeLayer.setHoveredEdge,
    markViewportInteractionBusy: _markRasterMediaInteractionBusy,
    releaseViewportInteractionBusy: _releaseRasterMediaInteractionBusy,
    captureRasterPreviewNode: _rasterPreviewCoordinator.captureNodeFrame,
    excludeRasterPreviewNode: _rasterPreviewCoordinator.excludeNode,
    syncFastPreviewDragProxy: _fastPreviewLayer.syncNodeDragPreview,
    releaseFastPreviewForPlayback(enabled8) {
      if (!enabled8) return false;
      if (_sourceVideoSlotLifecycle.isManagedNode(enabled8)) return false;
      const enabled9 = _fastPreviewLayer.releaseNode(enabled8) === true;
      if (!enabled9) return false;
      const el8 = _wrapperMap.get(enabled8);
      return (
        el8?.dataset && (el8.dataset.fastPreviewReleasedForPlayback = '1'),
        _fastPreviewRelease.forget(enabled8),
        true
      );
    },
    prepareMediaSlotSource(value37, value38, value39 = {}) {
      return _sourceVideoSlotLifecycle.prepareSource(value37, value38, value39);
    },
    reportMediaSlotFrame: _sourceVideoSlotLifecycle.reportFrame,
    pinNode(enabled10, value40 = 'src/ui/') {
      if (!enabled10) return;
      const _getNodePinSet2 = _getNodePinSet(enabled10, true);
      _getNodePinSet2.add(String(value40 || 'src/ui/'));
    },
    unpinNode(enabled11, value41 = 'src/ui/') {
      if (!enabled11) return;
      const map = _getNodePinSet(enabled11, false);
      if (!map) return;
      (map.delete(String(value41 || 'src/ui/')), map.size === 0 && _nodePinReasons.delete(enabled11));
    },
  });
}
function _markRasterMediaInteractionBusy() {
  (_rendererInteractionGrace.markBusy(), _rasterPreviewCoordinator.setMediaLoadingBusy(true));
}
function _releaseRasterMediaInteractionBusy() {
  (_rasterPreviewCoordinator.setMediaLoadingBusy(false), _schedulePreparedMediaRuntimeCommit?.());
}
function _rebuildEdgeIndex(value42) {
  (_nodeToEdgeIds.clear(), _incomingEdgeIdsByTarget.clear());
  for (const enabled12 of Object.values(value42 || {})) {
    if (!enabled12) continue;
    const value43 = enabled12.sourceId,
      value44 = enabled12.targetId;
    if (value43) {
      let enabled13 = _nodeToEdgeIds.get(value43);
      (!enabled13 && ((enabled13 = new Set()), _nodeToEdgeIds.set(value43, enabled13)),
        enabled13.add(enabled12.id));
    }
    if (value44) {
      let enabled14 = _nodeToEdgeIds.get(value44);
      !enabled14 && ((enabled14 = new Set()), _nodeToEdgeIds.set(value44, enabled14));
      enabled14.add(enabled12.id);
      let list5 = _incomingEdgeIdsByTarget.get(value44);
      (!list5 && ((list5 = []), _incomingEdgeIdsByTarget.set(value44, list5)), list5.push(enabled12.id));
    }
  }
}
function _ensureEdgeIndex(value45, value46) {
  const value47 = typeof value46 === 'number' ? value46 : 0;
  if (value47 === _edgeIndexRev) return;
  (_rebuildEdgeIndex(value45), (_edgeIndexRev = value47));
}
function _getEdgeEntries(value48, value49) {
  const value50 = typeof value49 === 'number',
    value51 = value50 ? value49 : 0,
    value52 = value50
      ? value51 === _edgeEntriesRev
      : value51 === _edgeEntriesRev && value48 === _edgeEntriesSource;
  if (value52) return _edgeEntriesCache;
  return (
    (_edgeEntriesCache = Object.values(value48 || {})),
    (_edgeEntriesRev = value51),
    (_edgeEntriesSource = value48 || null),
    _edgeEntriesCache
  );
}
function _buildSelectionRelatedSets(value53, value54) {
  const map2 = value53 instanceof Set ? value53 : new Set(Array.isArray(value53) ? value53 : []),
    relatedNodeIds = new Set(),
    relatedEdgeIds = new Set();
  if (map2.size === 0) return { relatedNodeIds: relatedNodeIds, relatedEdgeIds: relatedEdgeIds };
  for (const value55 of map2) {
    const enabled15 = _nodeToEdgeIds.get(value55);
    if (!enabled15) continue;
    for (const enabled16 of enabled15) {
      if (!enabled16 || relatedEdgeIds.has(enabled16)) continue;
      const enabled17 = value54?.[enabled16];
      if (!enabled17?.id) continue;
      const value56 = enabled17.sourceId,
        value57 = enabled17.targetId,
        enabled18 = map2.has(value56),
        enabled19 = map2.has(value57);
      if (!enabled18 && !enabled19) continue;
      relatedEdgeIds.add(enabled17.id);
      if (value56 && !enabled18) relatedNodeIds.add(value56);
      if (value57 && !enabled19) relatedNodeIds.add(value57);
    }
  }
  return { relatedNodeIds: relatedNodeIds, relatedEdgeIds: relatedEdgeIds };
}
function _normalizeSelectionRelatedHighlightColor(value58) {
  const value59 = String(value58 || '').trim();
  return SELECTION_RELATED_HIGHLIGHT_COLORS.includes(value59) ? value59 : 'white';
}
function _syncContainerSizeCache(value60 = _containerSizeSourceEl) {
  const el9 = value60 || _containerSizeSourceEl || null,
    value61 = el9 ? Number(el9.clientWidth) : Number(window.innerWidth),
    value62 = el9 ? Number(el9.clientHeight) : Number(window.innerHeight);
  return (
    (_cachedContainerWidth = Number.isFinite(value61) ? value61 : Number(window.innerWidth)),
    (_cachedContainerHeight = Number.isFinite(value62) ? value62 : Number(window.innerHeight)),
    { width: _cachedContainerWidth, height: _cachedContainerHeight }
  );
}
function _nowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}
function _hasCachedContainerSize() {
  return Number.isFinite(_cachedContainerWidth) && Number.isFinite(_cachedContainerHeight);
}
function _getCachedContainerSize(value63 = _containerSizeSourceEl, timer = {}) {
  const value64 = value63 || _containerSizeSourceEl || null,
    enabled20 = typeof ResizeObserver === 'function' && !!_containerResizeObserver,
    value65 =
      timer?.refresh === true ||
      !_hasCachedContainerSize() ||
      !enabled20 ||
      (value64 && _containerSizeSourceEl && value64 !== _containerSizeSourceEl);
  if (value65) return _syncContainerSizeCache(value64);
  return { width: _cachedContainerWidth, height: _cachedContainerHeight };
}
function _getEdgeContainerSize(value66) {
  const _nowMs2 = _nowMs(),
    box = _getCachedContainerSize(value66 || _containerSizeSourceEl),
    _nowMs3 = _nowMs();
  return {
    containerW: Number.isFinite(box.width) ? box.width : 0,
    containerH: Number.isFinite(box.height) ? box.height : 0,
    layoutReadMs: Math.max(0, _nowMs3 - _nowMs2),
  };
}
function _invalidateFullEdgeRenderSignature({ clearedDom: clearedDom = false } = {}) {
  ((_lastFullEdgeRenderSignature = ''), clearedDom && (_edgeDomClearedSinceLastFull = true));
}
function _normalizeSignaturePart(list6) {
  if (list6 === null || list6 === undefined) return null;
  if (typeof list6 === 'number') return Number.isFinite(list6) ? list6 : null;
  if (typeof list6 === 'boolean') return list6;
  if (typeof list6 === 'string') return list6;
  if (Array.isArray(list6)) return list6.map((item5) => _normalizeSignaturePart(item5));
  if (typeof list6 === 'object') {
    const value67 = {};
    for (const value68 of Object.keys(list6).sort()) {
      value67[value68] = _normalizeSignaturePart(list6[value68]);
    }
    return value67;
  }
  return String(list6);
}
function _buildVirtualizationCandidateSignature({
  snapshotRev: snapshotRev,
  nodeCount: nodeCount,
  viewport: viewport,
  selectedNodeIds: selectedNodeIds,
  connOverlay: connOverlay,
  pickConnectMode: pickConnectMode,
  dragContext: dragContext,
  pinnedNodeIds: pinnedNodeIds,
  containerW: containerW,
  containerH: containerH,
} = {}) {
  const selectedNodeIds2 = Array.from(
      selectedNodeIds instanceof Set
        ? selectedNodeIds
        : Array.isArray(selectedNodeIds)
          ? selectedNodeIds
          : [],
    )
      .map((item6) => String(item6))
      .sort(),
    pinnedNodeIds2 = Array.from(
      pinnedNodeIds instanceof Set ? pinnedNodeIds : Array.isArray(pinnedNodeIds) ? pinnedNodeIds : [],
    )
      .map((item7) => String(item7))
      .sort();
  return JSON.stringify(
    _normalizeSignaturePart({
      snapshotRev: snapshotRev,
      nodeCount: nodeCount,
      viewport: {
        x: Number.isFinite(viewport?.x) ? viewport.x : 0,
        y: Number.isFinite(viewport?.y) ? viewport.y : 0,
        zoom: Number.isFinite(viewport?.zoom) ? viewport.zoom : 1,
      },
      selectedNodeIds: selectedNodeIds2,
      connOverlay: { srcId: connOverlay?.srcId ?? null, hoverId: connOverlay?.hoverId ?? null },
      pickConnectMode: {
        active: !!pickConnectMode?.active,
        sourceNodeId: pickConnectMode?.sourceNodeId ?? null,
        hoverNodeId: pickConnectMode?.hoverNodeId ?? null,
        handleDirection: pickConnectMode?.handleDirection ?? null,
      },
      dragContext: {
        isDragging: !!dragContext?.isDragging,
        targetNodeId: dragContext?.targetNodeId ?? null,
        pendingDx: Number.isFinite(dragContext?.pendingDx) ? dragContext.pendingDx : 0,
        pendingDy: Number.isFinite(dragContext?.pendingDy) ? dragContext.pendingDy : 0,
      },
      pinnedNodeIds: pinnedNodeIds2,
      containerW: Number.isFinite(containerW) ? containerW : 0,
      containerH: Number.isFinite(containerH) ? containerH : 0,
    }),
  );
}
export function buildRendererVirtualizationSignature(options2 = {}) {
  return _buildVirtualizationCandidateSignature(options2);
}
function _notifyVirtualizationProbe(value69) {
  const enabled21 = typeof window !== 'undefined' ? window.__rendererVirtualizationProbe : null;
  if (!enabled21 || typeof enabled21.onCandidateSignatureEvaluated !== 'function') return;
  try {
    enabled21.onCandidateSignatureEvaluated(value69);
  } catch {}
}
function _collectMovedNodeIds(value70, value71) {
  const map3 = new Set(value70.selectedNodeIds || []),
    value72 = value71?.targetNodeId || null;
  if (value72) map3.add(value72);
  const value73 = value70._parentToChildren || {},
    list7 = Array.from(map3);
  for (let value74 = 0; value74 < list7.length; value74++) {
    const value75 = list7[value74],
      enabled22 = value73[value75];
    if (!enabled22 || enabled22.size === 0) continue;
    for (const value76 of enabled22) {
      !map3.has(value76) && (map3.add(value76), list7.push(value76));
    }
  }
  return map3;
}
function _resolveDragRenderOffset(value77, enabled23) {
  if (!enabled23?.isDragging) return null;
  const movedNodeIds = _collectMovedNodeIds(value77, enabled23);
  if (!movedNodeIds || movedNodeIds.size === 0) return null;
  return {
    movedNodeIds: movedNodeIds,
    dx: Number.isFinite(enabled23.pendingDx) ? enabled23.pendingDx : 0,
    dy: Number.isFinite(enabled23.pendingDy) ? enabled23.pendingDy : 0,
  };
}
function _v2FormatNodeLabelText(value78) {
  const list8 = String(value78 || '').trim();
  if (!list8) return '';
  const value79 = /^[\x00-\x7F]*$/.test(list8);
  if (value79 && list8.length > 20) return list8.slice(0, 20) + '...';
  return list8;
}
function _v2GetNodeLabelKind(value80) {
  const refKindByNodeType = getRefKindByNodeType(value80);
  if (
    refKindByNodeType === 'text' ||
    refKindByNodeType === 'image' ||
    refKindByNodeType === 'video' ||
    refKindByNodeType === 'audio'
  )
    return refKindByNodeType;
  return '';
}
function _v2ClearNodeLabelTooltip(el10) {
  if (!el10) return;
  const run = (value81, value82 = '') => {
    if (typeof el10.removeAttribute === 'function') el10.removeAttribute(value81);
    else el10.attributes && typeof el10.attributes.delete === 'function' && el10.attributes.delete(value81);
    value82 && el10.dataset && value82 in el10.dataset && delete el10.dataset[value82];
  };
  run('title');
  if ('title' in el10) el10.title = '';
  (run('data-tooltip', 'tooltip'),
    run('data-tooltip-right', 'tooltipRight'),
    run('data-tooltip-source', 'tooltipSource'),
    run('data-native-title', 'nativeTitle'));
}
function _v2SetNodeLabelContent(
  el11,
  {
    labelKind: labelKind,
    displayLabelText: displayLabelText,
    defaultName: defaultName,
    isBeta: isBeta,
    fullLabelText: fullLabelText,
  },
) {
  if (!el11) return;
  _v2ClearNodeLabelTooltip(el11);
  const list9 = [];
  if (labelKind) {
    const el12 = document.createElement('span');
    ((el12.className = 'node-label-icon'),
      el12.setAttribute('aria-hidden', 'true'),
      (el12.dataset.labelKind = labelKind),
      (el12.textContent = labelKind === 'text' ? 'T' : ''),
      list9.push(el12));
  }
  const el13 = document.createElement('span');
  ((el13.className = 'node-label-text'),
    (el13.textContent = displayLabelText || defaultName),
    list9.push(el13));
  if (isBeta) {
    const el14 = document.createElement('span');
    ((el14.className = 'v2-node-beta-pill'),
      (el14.textContent = 'Beta'),
      list9.push(el14),
      (el11.dataset.betaLabel = fullLabelText));
  } else {
    if ('betaLabel' in el11.dataset) delete el11.dataset.betaLabel;
  }
  el11.replaceChildren(...list9);
}
function _v2EscapeHtml(value83) {
  return String(value83 || '').replace(/[&<>"']/g, (value84) => {
    if (value84 === '&') return '&amp;';
    if (value84 === '<') return '&lt;';
    if (value84 === '>') return '&gt;';
    if (value84 === '"') return '&quot;';
    return '&#39;';
  });
}
function _getDreaminaTimerPhaseTitle(enabled24) {
  if (!enabled24 || !isNodeType(enabled24, 'ai-video')) return '';
  const modelProvider =
    resolveModelProvider(enabled24.model, enabled24.provider, { allowPrefixInference: false }) === 'dreamina';
  if (!modelProvider) return '';
  const value85 = String(enabled24.dreaminaTaskPhase || '')
      .trim()
      .toLowerCase(),
    value86 = String(enabled24.dreaminaTaskStatus || '')
      .trim()
      .toLowerCase();
  if (value85 === 'failed' || value86 === 'failed') return t('coreUi.renderer.dreaminaPhase.failed');
  if (value85 === 'syncing') return t('coreUi.renderer.dreaminaPhase.syncing');
  if (value85 === 'queued') return t('coreUi.renderer.dreaminaPhase.queued');
  if (value85 === 'generating') return t('coreUi.renderer.dreaminaPhase.generating');
  if (value85 === 'done') return t('coreUi.renderer.dreaminaPhase.done');
  const value87 = String(enabled24.dreaminaTaskLabel || '').trim();
  return value87 || '';
}
function _formatNodeTimerText(value88, value89) {
  const value90 = Math.max(0, Number(value89) || 0),
    value91 = Math.floor(value90 / 0x3e8),
    value92 = Math.floor((value90 % 0x3e8) / 100),
    value93 = value91 + '.' + value92 + 's',
    _getDreaminaTimerPhaseTitle2 = _getDreaminaTimerPhaseTitle(value88);
  return _getDreaminaTimerPhaseTitle2 ? _getDreaminaTimerPhaseTitle2 + ' · ' + value93 : value93;
}
export function formatVideoMetaText({ fps: fps, frames: frames, width: width, height: height } = {}) {
  const count = Number(fps),
    count2 = Number(frames);
  if (!Number.isFinite(count) || count <= 0 || !Number.isFinite(count2) || count2 <= 0) return '';
  const fps2 =
      Math.abs(count - Math.round(count)) < 0.01
        ? String(Math.round(count))
        : String(Number(count.toFixed(2))),
    count3 = Number(width),
    count4 = Number(height),
    enabled25 = Number.isFinite(count3) && count3 > 0 && Number.isFinite(count4) && count4 > 0,
    t2 = t('coreUi.renderer.videoMeta.framesFps', { frames: Math.round(count2), fps: fps2 });
  if (!enabled25) return t2;
  return Math.round(count3) + '×' + Math.round(count4) + ' · ' + t2;
}
function _getGroupColorWithOpacity(value94, value95) {
  const enabled26 = value94.match(/var\(--([^)]+)\)/);
  if (!enabled26) return value94;
  const value96 = enabled26[1];
  return 'var(--' + value96 + '-' + value95 + ')';
}
export function clearRendererCache() {
  _rendererMediaRuntimePreparer.clear();
  console.log('[Renderer] 执行全盘物理清盘...');
  const value97 = new Set([
    ..._componentMap.keys(),
    ..._wrapperMap.keys(),
    ..._parkedWrapperMap.keys(),
    ..._mountedNodeIds,
    ..._parkedNodeIds,
  ]);
  for (const value98 of value97) {
    _destroyNode(value98);
  }
  (_clearRenderedEdgesFromDocument(),
    _msHiddenNodeIds.clear(),
    (_multiSelectRenderCache.geometrySig = ''),
    (_multiSelectRenderCache.runBtnDisabled = null),
    (_multiSelectRenderCache.resetBtnVisible = null),
    (_multiSelectRenderCache.composeBtnVisible = null),
    (_multiSelectRenderCache.composeBtnKind = ''),
    (_alignPanelRenderCache.centerSig = ''),
    (_alignPanelRenderCache.buttonStateSig = ''),
    _edgeLayer.reset(),
    clearCachedEdgeVisibilityIndex(),
    _nodeToEdgeIds.clear(),
    _incomingEdgeIdsByTarget.clear(),
    (_edgeIndexRev = -1),
    (_edgeEntriesRev = -1),
    (_edgeEntriesSource = null),
    (_edgeEntriesCache = []),
    (_cachedContainerWidth = null),
    (_cachedContainerHeight = null),
    (_lastFullEdgeRenderSignature = ''),
    (_edgeDomClearedSinceLastFull = false),
    (_lastVirtualCandidateSignature = ''),
    (_lastVirtualCandidateResult = null),
    clearRendererSpatialIndexCache(),
    (_containerSizeSourceEl = null),
    _rendererInteractionGrace.reset(),
    _nodePinReasons.clear(),
    _pendingNodeDataMap.clear(),
    _nodeTypeSnapshotMap.clear(),
    _mediaPresentation.clear(),
    _sourceVideoSlotLifecycle.reset(),
    _fastPreviewContinuation.reset(),
    _fastPreviewLifecycle.reset(),
    _fastPreviewLayer.clear(),
    _rasterPreviewCoordinator.reset(),
    cancelRendererFastPreviewMediaPreloads({ includeActive: true, reason: 'renderer-cache-clear' }),
    _clearRunningTimerState());
}
((window._edgeDomCache = _edgeDomCache), _syncRendererBridge());
function _isNodeVisible(value99, value100, value101, value102, value103 = 0, value104 = 0) {
  return isNodeInsideViewportPadding(value99, value100, value101, value102, 200, value103, value104);
}
function _renderCullingOnly(value105, value106, value107, value108 = {}) {
  const enabled27 = value108?.hideInvisible !== false,
    { width: width2, height: height2 } = _getCachedContainerSize(value105.parentElement || value105);
  for (const value109 of Object.values(value106 || {})) {
    const el15 = _wrapperMap.get(value109.id);
    if (!el15 || !el15.isConnected) continue;
    const _isNodeVisible2 = _isNodeVisible(value109, value107, width2, height2);
    if (!_isNodeVisible2) {
      if (!enabled27) continue;
      _syncRunningTimerForNode(value109.id, null, { hide: true });
      if (el15.style.display !== 'none') el15.style.display = 'none';
    } else {
      _syncRunningTimerForNode(value109.id, value109);
      if (el15.style.display === 'none') el15.style.display = '';
    }
  }
}
export function initRenderer(el16, el17, value110) {
  ((el17.style.transformOrigin = '0 0'),
    (el17.style.position = 'absolute'),
    (el17.style.top = '0'),
    (el17.style.left = '0'));
  const el18 = _createSvgLayer();
  el17.prepend(el18);
  const value111 = el18.querySelector('svg');
  ((_containerSizeSourceEl = el17.parentElement || el16), _syncContainerSizeCache(_containerSizeSourceEl));
  typeof ResizeObserver === 'function' &&
    _containerSizeSourceEl &&
    ((_containerResizeObserver = new ResizeObserver(() => {
      _syncContainerSizeCache(_containerSizeSourceEl);
    })),
    _containerResizeObserver.observe(_containerSizeSourceEl));
  const el19 = _createPickerEl();
  el16.appendChild(el19);
  const el20 = createPickConnectBannerEl();
  el16.appendChild(el20);
  const el21 = _createMultiSelectBoxEl(value110);
  el17.appendChild(el21);
  const el22 = _createAlignCenterPanelEl();
  el17.appendChild(el22);
  const el23 = _createSelectionRectEl();
  el16.appendChild(el23);
  const el24 = createContextMenuEl();
  (el16.appendChild(el24), _syncRendererBridge());
  const _presentationSubscription = createRendererPresentationSubscription({
    onSnapshot: (value112) => {
      _currentSnapshot = value112;
    },
    render: (value112) => {
      (_syncRunningTimers(value112), run2(value112));
    },
    onSuspend: () => {
      (run3(), _rendererMediaRuntimePreparer.pause(), _mediaPresentation.pause());
    },
    onResume: () => {
      (_mediaPresentation.resume(), _rendererMediaRuntimePreparer.resume());
    },
  });
  let value113 = -1,
    value114 = -1,
    count5 = 0,
    setTimeout2 = null,
    requestAnimationFrame2 = null;
  function run3() {
    (setTimeout2 !== null && (clearTimeout(setTimeout2), (setTimeout2 = null)),
      requestAnimationFrame2 !== null &&
        (cancelAnimationFrame(requestAnimationFrame2), (requestAnimationFrame2 = null)));
  }
  function run4(value115 = RENDERER_VIRTUALIZATION_CONFIG.settleDelayMs) {
    if (!_presentationSubscription.isActive()) return;
    (run3(),
      (setTimeout2 = setTimeout(
        () => {
          setTimeout2 = null;
          if (requestAnimationFrame2 !== null) return;
          requestAnimationFrame2 = requestAnimationFrame(() => {
            requestAnimationFrame2 = null;
            if (_presentationSubscription.hasPendingFrame()) return;
            if (!_currentSnapshot) return;
            if (_rendererInteractionGrace.isBusy()) {
              run4(value115);
              return;
            }
            run2(_currentSnapshot);
          });
        },
        Math.max(0, value115),
      )));
  }
  const _schedulePreparedMediaRuntimeCommitForRenderer = () => run4(0);
  _schedulePreparedMediaRuntimeCommit = _schedulePreparedMediaRuntimeCommitForRenderer;
  installNodeResizeGeometryPreviewer(
    typeof window === 'undefined' ? null : window,
    () => _currentSnapshot,
    _ensureEdgeIndex,
    _nodeToEdgeIds,
    (value116, value117, value118) =>
      _renderEdgesByIds(value111, value116, value118.edges || {}, value117, value118.viewport, el16),
  );
  function run5(nodes) {
    const value119 =
        typeof nodes._nodeCount === 'number' ? nodes._nodeCount : Object.keys(nodes.nodes || {}).length,
      edgesRev = typeof nodes._edgesRev === 'number' ? nodes._edgesRev : 0,
      value120 = edgesRev !== value114;
    (value119 !== value113 || value120) &&
      ((value113 = value119),
      (value114 = edgesRev),
      _cleanupNodes(el17, nodes.nodes),
      _cleanupEdges(value111, nodes.edges));
    _ensureEdgeIndex(nodes.edges, edgesRev);
    const relatedEdgeIds2 =
        nodes.ui?.selectionRelatedHighlightEnabled === false
          ? { relatedNodeIds: new Set(), relatedEdgeIds: new Set() }
          : _buildSelectionRelatedSets(nodes.selectedNodeIds, nodes.edges),
      _normalizeSelectionRelatedHighlightColor2 = _normalizeSelectionRelatedHighlightColor(
        nodes.ui?.selectionRelatedHighlightColor,
      ),
      deferParking = _rendererInteractionGrace.getRemainingMs(),
      { hasPendingStructuralOps: hasPendingStructuralOps, deferredParkCount: deferredParkCount = 0 } =
        _renderNodes(
          el17,
          nodes.nodes,
          nodes.selectedNodeIds,
          relatedEdgeIds2.relatedNodeIds,
          _normalizeSelectionRelatedHighlightColor2,
          nodes.connOverlay,
          nodes.pickConnectMode,
          nodes.viewport,
          nodes.edges,
          nodes._parentToChildren,
          nodes.ui && typeof nodes.ui.showVideoMeta === 'boolean' ? nodes.ui.showVideoMeta : false,
          nodes,
          { deferParking: deferParking > 0 },
        ),
      value121 = nodes.edges || {},
      edgeEntries = _getEdgeEntries(value121, edgesRev),
      value122 = edgeEntries.length,
      el25 = document.documentElement,
      enabled28 = value122 >= MANY_EDGES_THRESHOLD;
    if (enabled28) !el25.classList.contains('has-many-edges') && el25.classList.add('has-many-edges');
    else el25.classList.contains('has-many-edges') && el25.classList.remove('has-many-edges');
    const dragContext2 = getDragContext(),
      dragOffsetCtx = _resolveDragRenderOffset(nodes, dragContext2),
      enabled29 = nodes.ui?.connectionLinesVisible !== false,
      edgePathStyle = normalizeConnectionLineStyle(nodes.ui?.connectionLineStyle);
    let containerW2 = null,
      cachedEdgeGeometrySignature = '',
      cachedEdgeVisibilityIndex = null;
    function geometrySignature() {
      if (!enabled28) return '';
      if (!cachedEdgeGeometrySignature)
        cachedEdgeGeometrySignature = getCachedEdgeGeometrySignature(edgeEntries, nodes.nodes, {
          edgesRev: edgesRev,
          geometryRev: 0,
        });
      return cachedEdgeGeometrySignature;
    }
    function edgeVisibilityIndex() {
      if (!enabled29 || !enabled28) return null;
      if (!cachedEdgeVisibilityIndex)
        cachedEdgeVisibilityIndex = getCachedEdgeVisibilityIndex(edgeEntries, nodes.nodes, {
          edgesRev: edgesRev,
          geometryRev: 0,
          geometrySignature: geometrySignature(),
        });
      return cachedEdgeVisibilityIndex;
    }
    function run6(enabled30 = false) {
      !containerW2 && (containerW2 = _getEdgeContainerSize(el16));
      const renderSignature = buildFullEdgeRenderSignature({
        edgeEntries: edgeEntries,
        nodes: nodes.nodes,
        viewport: nodes.viewport,
        dragOffsetCtx: dragOffsetCtx,
        relatedEdgeIds: relatedEdgeIds2.relatedEdgeIds,
        containerW: containerW2.containerW,
        containerH: containerW2.containerH,
        edgesRev: edgesRev,
        geometryRev: 0,
        geometrySignature: geometrySignature(),
        edgePathStyle: edgePathStyle,
      });
      if (!enabled30 && renderSignature === _lastFullEdgeRenderSignature) return null;
      return {
        containerSize: containerW2,
        renderSignature: renderSignature,
        geometryRevisionKey: 'edges:' + edgesRev + ':geometry:0',
        pathStyle: edgePathStyle,
      };
    }
    if (!enabled29) _clearRenderedEdges(value111);
    else {
      if (value120) {
        if (value120) _ensureEdgeIndex(nodes.edges, edgesRev);
        const args2 = run6(true);
        _renderEdges(
          value111,
          value121,
          nodes.nodes,
          nodes.viewport,
          el16,
          dragOffsetCtx,
          relatedEdgeIds2.relatedEdgeIds,
          edgeEntries,
          'edges-rev-changed',
          { ...args2, edgeVisibilityIndex: edgeVisibilityIndex() },
        );
      } else {
        if (dragContext2.isDragging) {
          _ensureEdgeIndex(nodes.edges, edgesRev);
          const enabled31 = dragOffsetCtx?.movedNodeIds || _collectMovedNodeIds(nodes, dragContext2),
            value123 = new Set();
          for (const value124 of enabled31) {
            const enabled32 = _nodeToEdgeIds.get(value124);
            if (!enabled32) continue;
            for (const value125 of enabled32) value123.add(value125);
          }
          if (value123.size > 0)
            _renderEdgesByIds(
              value111,
              value123,
              value121,
              nodes.nodes,
              nodes.viewport,
              el16,
              dragOffsetCtx,
              relatedEdgeIds2.relatedEdgeIds,
              { containerSize: containerW2 || null, pathStyle: edgePathStyle },
            );
          else {
            if (!enabled31 || enabled31.size === 0) {
              const args3 = run6(false);
              args3 &&
                _renderEdges(
                  value111,
                  value121,
                  nodes.nodes,
                  nodes.viewport,
                  el16,
                  dragOffsetCtx,
                  relatedEdgeIds2.relatedEdgeIds,
                  edgeEntries,
                  'drag-related-edges-unavailable',
                  { ...args3, edgeVisibilityIndex: edgeVisibilityIndex() },
                );
            }
          }
        } else {
          const args4 = run6(false);
          args4 &&
            _renderEdges(
              value111,
              value121,
              nodes.nodes,
              nodes.viewport,
              el16,
              dragOffsetCtx,
              relatedEdgeIds2.relatedEdgeIds,
              edgeEntries,
              'steady',
              { ...args4, edgeVisibilityIndex: edgeVisibilityIndex() },
            );
        }
      }
    }
    (_renderPicker(el19, nodes.picker, value110),
      _renderSelectionRect(el23, nodes.selectionBox),
      _renderMultiSelectBox(
        el21,
        nodes.selectedNodeIds,
        nodes.nodes,
        nodes.viewport,
        nodes.ui?.imageVideoNodeResizeEnabled === true,
      ),
      _renderAlignCenterPanel(el22, nodes.selectedNodeIds, nodes.nodes, nodes.ui),
      renderContextMenu(el24, nodes.contextMenu),
      renderPickConnectBanner(el20, nodes.pickConnectMode));
    if (hasPendingStructuralOps) run4(getRendererStructuralReconcileDelayMs(value119));
    else deferredParkCount > 0 && deferParking > 0 && run4(deferParking + 16);
  }
  function run2(enabled33) {
    if (!_presentationSubscription.isActive() || !enabled33) return;
    const isPerfProbeEnabled2 = isPerfProbeEnabled(),
      value126 =
        isPerfProbeEnabled2 && typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : 0;
    let mode = 'steady';
    try {
      const dragContext3 = getDragContext(),
        enabled34 = typeof document !== 'undefined' ? document.body?.classList : null,
        value127 = !!enabled34?.contains?.('is-panning'),
        value128 = !!enabled34?.contains?.('is-viewport-animating'),
        value129 = !!enabled34?.contains?.('is-zooming'),
        value130 =
          typeof enabled33._nodeCount === 'number'
            ? enabled33._nodeCount
            : Object.keys(enabled33.nodes || {}).length,
        value131 = typeof enabled33._edgesRev === 'number' ? enabled33._edgesRev : 0,
        value132 =
          (dragContext3.isDragging || dragContext3.isDraggingCell) && dragContext3.isCommittingDrag !== true,
        enabled35 = value132 && (value130 !== value113 || value131 !== value114),
        value133 =
          dragContext3.isPanning || dragContext3.assistPanActive
            ? getViewportPanPreview() || enabled33.viewport
            : enabled33.viewport;
      value128 ||
      dragContext3.isPanning ||
      dragContext3.assistPanActive ||
      value127 ||
      value132 ||
      value129 ||
      enabled35
        ? _rendererMediaRuntimePreparer.pause()
        : _rendererMediaRuntimePreparer.resume();
      _renderViewport(el17, value133, enabled33.ui?.titleFollowsCanvasZoom === true);
      if (value128) {
        (_rendererInteractionGrace.markBusy(), (mode = 'viewport-animating'));
        if (el18.style.display === 'none') el18.style.display = '';
        run4();
        return;
      }
      if (dragContext3.isPanning || dragContext3.assistPanActive || value127) {
        (_rendererInteractionGrace.markBusy(), (mode = 'panning'));
        const value134 = performance.now();
        value134 - count5 > 80 && ((count5 = value134), _renderCullingOnly(el17, enabled33.nodes, value133));
        if (el18.style.display === 'none') el18.style.display = '';
        run4();
        return;
      }
      if (value132 && !enabled35) {
        (_rendererInteractionGrace.markBusy(), (mode = 'dragging'));
        if (el18.style.display === 'none') el18.style.display = '';
        run4();
        return;
      }
      if (value129) {
        (_rendererInteractionGrace.markBusy(), (mode = 'zooming'));
        if (el18.style.display === 'none') el18.style.display = '';
        run4();
        return;
      }
      enabled35
        ? (_rendererInteractionGrace.markBusy(), (mode = 'dragging-structural'))
        : (run3(), _rendererInteractionGrace.markIdle());
      if (el18.style.display === 'none') el18.style.display = '';
      (run5(enabled33), !enabled35 && _mediaPresentation.resume());
    } finally {
      if (
        isPerfProbeEnabled2 &&
        typeof performance !== 'undefined' &&
        typeof performance.now === 'function'
      ) {
        const nodeCount2 =
          typeof enabled33._nodeCount === 'number'
            ? enabled33._nodeCount
            : Object.keys(enabled33.nodes || {}).length;
        recordRenderFrameSample({
          mode: mode,
          durationMs: performance.now() - value126,
          nodeCount: nodeCount2,
          edgeCount: Object.keys(enabled33.edges || {}).length,
          mountedNodeCount: _mountedNodeIds.size,
          parkedNodeCount: _parkedNodeIds.size,
          ..._fastPreviewLayer.getStats(),
        });
      }
    }
  }
  function flushNode(enabled36) {
    if (!enabled36) return false;
    const pickMode = _currentSnapshot,
      node = pickMode?.nodes?.[enabled36];
    if (!node) return false;
    const enabled37 = _componentMap.get(enabled36),
      el26 = _wrapperMap.get(enabled36);
    if (!enabled37 || typeof enabled37.update !== 'function') return false;
    if (!_mountedNodeIds.has(enabled36) || !el26?.isConnected) return false;
    const map4 = new Set(pickMode.selectedNodeIds || []),
      isSelected = map4.has(enabled36),
      map5 = _buildSelectionRelatedSets(map4, pickMode.edges || {}).relatedNodeIds,
      isSelectionRelated = !isSelected && map5.has(enabled36),
      inEdgeSig = _getIncomingEdgeSignature(enabled36, pickMode.edges || {}, pickMode.nodes || {}),
      mediaLodMode = syncNodeMediaLodMode(el26, node, pickMode.viewport),
      rendererNodeSignature = buildRendererNodeSignature({
        node: node,
        inEdgeSig: inEdgeSig,
        pickMode: pickMode.pickConnectMode,
        isSelected: isSelected,
        isSelectionRelated: isSelectionRelated,
        showVideoMeta: pickMode.ui?.showVideoMeta === true,
        viewport: pickMode.viewport,
        mediaLodMode: mediaLodMode,
      });
    return (
      _pendingNodeDataMap.delete(enabled36),
      _nodeDataSnapshotMap.set(enabled36, rendererNodeSignature),
      enabled37.update(node),
      true
    );
  }
  function flushNodes(value135) {
    const list10 = Array.isArray(value135) ? value135 : [value135];
    let value136 = false;
    for (const value137 of new Set(list10.filter(Boolean))) {
      value136 = flushNode(value137) || value136;
    }
    return value136;
  }
  typeof window !== 'undefined' &&
    ((window.v2Renderer = window.v2Renderer || {}),
    Object.assign(window.v2Renderer, { flushNode: flushNode, flushNodes: flushNodes }));
  _presentationSubscription.connect(value110);
  const value138 = () => {
    (_presentationSubscription.dispose(),
      _rendererMediaRuntimePreparer.clear(),
      _schedulePreparedMediaRuntimeCommit === _schedulePreparedMediaRuntimeCommitForRenderer &&
        (_schedulePreparedMediaRuntimeCommit = null),
      run3(),
      _containerResizeObserver && (_containerResizeObserver.disconnect(), (_containerResizeObserver = null)),
      (_containerResizeHandler = null),
      (_containerSizeSourceEl = null),
      _mediaPresentation.clear(),
      _sourceVideoSlotLifecycle.reset(),
      _rasterPreviewCoordinator.reset(),
      _clearRunningTimerState(),
      el18?.remove?.(),
      el19?.remove?.(),
      el20?.remove?.(),
      el21?.remove?.(),
      el22?.remove?.(),
      el23?.remove?.(),
      el24?.remove?.());
  };
  value138.setPresentationActive = _presentationSubscription.setActive;
  return value138;
}
function _renderViewport(el27, box2, value139 = false) {
  !el27._willChangeSet && ((el27.style.willChange = 'transform'), (el27._willChangeSet = true));
  const value140 = '0 0';
  el27.style.transformOrigin !== value140 && (el27.style.transformOrigin = value140);
  const value141 = 'translate3d(' + box2.x + 'px, ' + box2.y + 'px, 0) scale(' + box2.zoom + ')';
  (el27._lastTransform !== value141 && ((el27.style.transform = value141), (el27._lastTransform = value141)),
    _syncZoomCssVars(box2.zoom, value139));
}
let _lastZoomInv = null,
  _lastZoomInvRaw = null,
  _lastNodeLabelComp = null,
  _lastNodeLabelCompAt = 0;
function _syncZoomCssVars(value142, value143 = false) {
  const el28 = typeof document !== 'undefined' ? document.documentElement : null;
  if (!el28) return;
  const el29 = typeof document !== 'undefined' && document && document.body ? document.body : null,
    value144 =
      typeof performance !== 'undefined' && performance && typeof performance.now === 'function'
        ? performance.now()
        : Date.now(),
    value145 = 0.2 + 0.05 * 1.8,
    count6 = typeof value142 === 'number' && isFinite(value142) ? value142 : 1,
    value146 = count6 > 0 ? count6 : 1,
    value147 = Math.min(1 / value146, 1 / value145),
    value148 = 1 / value146,
    value149 = count6 > 0 ? Math.pow(1 / count6, 0.35) : 1,
    value150 = value143 === true ? Math.min(value149, 1.6) : 1;
  _lastZoomInv !== value147 && ((_lastZoomInv = value147), el28.style.setProperty('--zoom-inv', value147));
  _lastZoomInvRaw !== value148 &&
    ((_lastZoomInvRaw = value148), el28.style.setProperty('--zoom-inv-raw', value148));
  const value151 = value143 === true && !!(el29 && el29.classList.contains('is-zooming'));
  if (value151 && value144 - _lastNodeLabelCompAt < 120 && _lastNodeLabelComp !== null) return;
  (_lastNodeLabelComp !== value150 &&
    ((_lastNodeLabelComp = value150), el28.style.setProperty('--node-label-comp', value150)),
    (_lastNodeLabelCompAt = value144));
}
function _buildGroupOutputOrderSignature(value152, value153) {
  const list11 = [],
    value154 = Array.isArray(value152?.groupOutputSourceOrder)
      ? value152.groupOutputSourceOrder.map((item8) => String(item8 || '').trim()).join('>')
      : '';
  if (value154) list11.push('global:' + value154);
  const value155 = String(value153 || '').trim(),
    value156 = value152?.groupOutputSourceOrderByTarget,
    value157 =
      value155 &&
      value156 &&
      typeof value156 === 'object' &&
      !Array.isArray(value156) &&
      Array.isArray(value156[value155])
        ? value156[value155].map((item9) => String(item9 || '').trim()).join('>')
        : '';
  if (value157) list11.push('target:' + value157);
  return list11.join('|');
}
function _getIncomingEdgeSignature(value158, value159, value160) {
  const list12 = [],
    value161 = String(value160?.[value158]?.parentId || '').trim(),
    list13 = [['direct', value158]];
  if (value161 && isNodeType(value160?.[value161], 'group')) list13.push(['shared:' + value161, value161]);
  for (const [value162, value163] of list13) {
    for (const value164 of _incomingEdgeIdsByTarget.get(value163) || []) {
      const enabled38 = value159?.[value164];
      if (!enabled38 || enabled38.targetId !== value163) continue;
      const value165 = value160?.[enabled38.sourceId],
        value166 = typeof value165?._bizRev === 'number' ? value165._bizRev : 0,
        value167 = String(enabled38.refSlot || ''),
        _buildGroupOutputOrderSignature2 = _buildGroupOutputOrderSignature(enabled38, value158);
      list12.push(
        value162 +
          ':' +
          enabled38.id +
          ':' +
          enabled38.sourceId +
          ':' +
          value167 +
          ':' +
          value166 +
          ':' +
          buildGroupOutputMembershipSignature(value165, value160) +
          ':' +
          _buildGroupOutputOrderSignature2,
      );
    }
  }
  return list12.join(',');
}
function isRendererMediaRuntimeInteractionPriority({
  nodeId: nodeId2,
  isSelected: isSelected2,
  isSelectionRelated: isSelectionRelated2,
  dragTargets: dragTargets,
  connOverlay: connOverlay2,
  pickMode: pickMode2,
} = {}) {
  if (!nodeId2) return false;
  return !!(
    isSelected2 ||
    isSelectionRelated2 ||
    dragTargets?.has?.(nodeId2) ||
    connOverlay2?.srcId === nodeId2 ||
    connOverlay2?.hoverId === nodeId2 ||
    pickMode2?.sourceNodeId === nodeId2 ||
    pickMode2?.hoverNodeId === nodeId2
  );
}
function _collectExactVisiblePreviewNodeIds(canvasEl) {
  const el30 = canvasEl?.querySelector?.('.v2-fast-preview-layer');
  if (!el30) return new Set();
  const value168 = new Set();
  for (const el31 of el30.children || []) {
    const value169 = String(el31?.dataset?.nodeId || '').trim();
    if (value169 && el31?.dataset?.hasMedia === '1') value168.add(value169);
  }
  return value168;
}
function _registerNodeRuntime(enabled39) {
  if (!enabled39?.nodeId || !enabled39.wrapperEl || !enabled39.instance) return null;
  const el32 = document.getElementById(enabled39.nodeId);
  return (
    el32 && el32 !== enabled39.wrapperEl && !_wrapperMap.has(enabled39.nodeId) && el32.remove(),
    _componentMap.set(enabled39.nodeId, enabled39.instance),
    _wrapperMap.set(enabled39.nodeId, enabled39.wrapperEl),
    _nodeTypeSnapshotMap.set(enabled39.nodeId, enabled39.canonicalType),
    enabled39
  );
}
function _createNodeRuntime(
  node2,
  selectedNodeSet,
  selectedNodeRankMap,
  dragContext4,
  dragTargets2,
  options3 = {},
) {
  return _registerNodeRuntime(
    prepareRendererNodeRuntime({
      node: node2,
      selectedNodeSet: selectedNodeSet,
      selectedNodeRankMap: selectedNodeRankMap,
      dragContext: dragContext4,
      dragTargets: dragTargets2,
      options: options3,
    }),
  );
}
function _ensureVideoMetaEl(el33, value170) {
  if (!el33.__v2_video_meta_el) {
    const el34 = document.createElement('div');
    ((el34.className = 'node-video-meta'),
      (el34.dataset.nodeId = value170),
      (el34.dataset.visible = '0'),
      (el34.textContent = ''),
      el33.appendChild(el34),
      (el33.__v2_video_meta_el = el34));
  }
}
function _syncMountedNodePresentation({
  wrapperEl: wrapperEl,
  node: node3,
  nodeId: nodeId3,
  selectedNodeSet: selectedNodeSet2,
  selectedNodeRankMap: selectedNodeRankMap2,
  connOverlay: connOverlay3,
  pickMode: pickMode3,
  viewport: viewport2,
  containerW: containerW3,
  containerH: containerH2,
  dragContext: dragContext5,
  dragTargets: dragTargets3,
  showVideoMeta: showVideoMeta,
  relatedNodeIds: relatedNodeIds2,
  relatedHighlightColor: relatedHighlightColor,
  inEdgeSig: inEdgeSig2,
  signature: signature,
  skipInstanceUpdate: skipInstanceUpdate = false,
}) {
  const value171 = node3.x + ',' + node3.y + ',' + node3.width + ',' + node3.height,
    value172 = wrapperEl._posKey !== value171,
    value173 = dragContext5?.isDragging && dragTargets3 && dragTargets3.has(nodeId3),
    value174 = value173 ? (Number.isFinite(dragContext5.pendingDx) ? dragContext5.pendingDx : 0) : 0,
    value175 = value173 ? (Number.isFinite(dragContext5.pendingDy) ? dragContext5.pendingDy : 0) : 0,
    _isNodeVisible3 = _isNodeVisible(node3, viewport2, containerW3, containerH2, value174, value175),
    value176 = _componentMap.get(nodeId3);
  (syncNodeMediaLodMode(wrapperEl, node3, viewport2), syncNodeMediaMetricsDataset(wrapperEl, node3));
  value172 &&
    ((wrapperEl._posKey = value171),
    (!dragTargets3 || !dragTargets3.has(nodeId3)) &&
      (wrapperEl.style.transform = 'translate(' + node3.x + 'px, ' + node3.y + 'px)'),
    (wrapperEl.style.width = node3.width + 'px'),
    (wrapperEl.style.height = node3.height + 'px'));
  isNodeType(node3, ['source-video', 'ai-video']) && _ensureVideoMetaEl(wrapperEl, nodeId3);
  dragContext5.isDragging
    ? dragTargets3 &&
      dragTargets3.has(nodeId3) &&
      (dragContext5.hasMoved || !dragContext5.wasSelectedOnDown) &&
      wrapperEl.classList.add('is-ui-hidden')
    : wrapperEl.classList.remove('is-ui-hidden');
  if (!_isNodeVisible3) {
    value176 &&
      typeof value176.syncSelectionState === 'function' &&
      value176.syncSelectionState({ selected: false, singleSelected: false, visible: false });
    _syncRunningTimerForNode(nodeId3, null, { hide: true });
    wrapperEl.style.display !== 'none' && (wrapperEl.style.display = 'none');
    value176?.update &&
      !skipInstanceUpdate &&
      signature !== _nodeDataSnapshotMap.get(nodeId3) &&
      (_nodeDataSnapshotMap.set(nodeId3, signature), value176.update(node3));
    return;
  }
  wrapperEl.style.display === 'none' && (wrapperEl.style.display = '');
  const isSelected3 = selectedNodeSet2.has(nodeId3),
    value177 = !isSelected3 && relatedNodeIds2?.has(nodeId3),
    value178 = wrapperEl.classList.contains('selected');
  isSelected3 !== value178 &&
    (isSelected3
      ? wrapperEl.classList.add('selected', 'v2-selected')
      : (wrapperEl.classList.remove('selected', 'v2-selected'), (wrapperEl.style.outline = '')));
  if (value177) {
    wrapperEl.classList.add('selection-related');
    const value179 =
      'selection-related-color-' + _normalizeSelectionRelatedHighlightColor(relatedHighlightColor);
    for (const value180 of SELECTION_RELATED_HIGHLIGHT_COLORS) {
      const value181 = 'selection-related-color-' + value180;
      if (value181 !== value179) wrapperEl.classList.remove(value181);
    }
    wrapperEl.classList.add(value179);
  } else {
    wrapperEl.classList.remove('selection-related');
    for (const value182 of SELECTION_RELATED_HIGHLIGHT_COLORS) {
      wrapperEl.classList.remove('selection-related-color-' + value182);
    }
  }
  _nodeDetailHydration.isNodeDetailActive({
    node: node3,
    nodeId: nodeId3,
    isSelected: isSelected3,
    connOverlay: connOverlay3,
    pickMode: pickMode3,
    relatedNodeIds: relatedNodeIds2,
  }) && _nodeDetailHydration.hydrateNodeDetails(nodeId3, wrapperEl);
  value176 &&
    typeof value176.syncSelectionState === 'function' &&
    value176.syncSelectionState({
      selected: isSelected3,
      singleSelected: selectedNodeSet2.size === 1,
      visible: true,
    });
  const rendererNodeZIndex = getRendererNodeZIndex(
    node3,
    isSelected3,
    selectedNodeRankMap2?.get?.(nodeId3) ?? -1,
    {
      isFocused:
        typeof document !== 'undefined' &&
        !!document.activeElement &&
        wrapperEl.contains(document.activeElement),
    },
  );
  wrapperEl.style.zIndex !== rendererNodeZIndex && (wrapperEl.style.zIndex = rendererNodeZIndex);
  if (isNodeType(node3, 'group')) {
    const value183 = node3.color || 'var(--indigo)',
      _getGroupColorWithOpacity2 = _getGroupColorWithOpacity(value183, '60'),
      _getGroupColorWithOpacity3 = _getGroupColorWithOpacity(value183, '05');
    (wrapperEl.style.borderColor !== _getGroupColorWithOpacity2 &&
      (wrapperEl.style.borderColor = _getGroupColorWithOpacity2),
      wrapperEl.style.backgroundColor !== _getGroupColorWithOpacity3 &&
        (wrapperEl.style.backgroundColor = _getGroupColorWithOpacity3),
      wrapperEl.style.getPropertyValue('--current-group-color') !== value183 &&
        wrapperEl.style.setProperty('--current-group-color', value183));
  }
  const el35 = wrapperEl.__v2_name_el,
    nodeType = normalizeNodeType(node3.type),
    labelKind2 = el35 ? _v2GetNodeLabelKind(nodeType) : '';
  if (el35) {
    if (labelKind2) {
      if (el35.dataset.labelKind !== labelKind2) el35.dataset.labelKind = labelKind2;
    } else 'labelKind' in el35.dataset && delete el35.dataset.labelKind;
  }
  if (el35 && el35.contentEditable !== 'true') {
    const defaultName2 = getRendererDefaultNodeLabel(node3),
      isBeta2 = hasNodeTypeBetaBadge(nodeType),
      fullLabelText2 = node3.name || defaultName2,
      displayLabelText2 = _v2FormatNodeLabelText(fullLabelText2);
    ((el35.dataset.fullName = fullLabelText2),
      (el35.dataset.isBeta = isBeta2 ? '1' : '0'),
      _v2ClearNodeLabelTooltip(el35));
    const el36 = el35.querySelector('.node-label-icon'),
      el37 = el35.querySelector('.node-label-text'),
      value184 = displayLabelText2 || defaultName2,
      value185 = el36?.dataset.labelKind || '';
    (value185 !== labelKind2 ||
      el37?.textContent !== value184 ||
      (isBeta2 ? el35.dataset.betaLabel !== fullLabelText2 : 'betaLabel' in el35.dataset)) &&
      _v2SetNodeLabelContent(el35, {
        labelKind: labelKind2,
        displayLabelText: displayLabelText2,
        defaultName: defaultName2,
        isBeta: isBeta2,
        fullLabelText: fullLabelText2,
      });
  }
  const el38 = wrapperEl.__v2_timer_el;
  if (el38) {
    let _formatNodeTimerText2 = '',
      value186 = false;
    const _isResolvedSourceMediaNode2 = _isResolvedSourceMediaNode(node3);
    if (!_isResolvedSourceMediaNode2 && node3.generationStartTime && node3.generationDuration == null) {
      const value187 = Date.now() - node3.generationStartTime;
      ((_formatNodeTimerText2 = _formatNodeTimerText(node3, value187)), (value186 = true));
    } else
      !_isResolvedSourceMediaNode2 &&
        typeof node3.generationDuration === 'number' &&
        ((_formatNodeTimerText2 = _formatNodeTimerText(node3, node3.generationDuration)), (value186 = true));
    value186
      ? (el38.textContent !== _formatNodeTimerText2 && (el38.textContent = _formatNodeTimerText2),
        (el38.style.color = isSelected3 ? 'var(--text-primary)' : 'var(--white-40)'),
        el38.style.display === 'none' && (el38.style.display = ''))
      : (el38.textContent && (el38.textContent = ''),
        el38.style.display !== 'none' && (el38.style.display = 'none'));
  }
  _syncRunningTimerForNode(nodeId3, node3);
  const el39 = wrapperEl.__v2_video_meta_el;
  if (el39) {
    if (!showVideoMeta) {
      if (el39.dataset.visible !== '0') el39.dataset.visible = '0';
    } else {
      const fps3 = Number(node3.videoFps),
        frames2 = Number(node3.videoFrameCount),
        width3 = Number(node3.videoWidth),
        height3 = Number(node3.videoHeight),
        value188 = Number.isFinite(fps3) && fps3 > 0 && Number.isFinite(frames2) && frames2 > 0,
        value189 = value188 ? '1' : '0';
      el39.dataset.visible !== value189 && (el39.dataset.visible = value189);
      if (value188) {
        const formatVideoMetaText2 = formatVideoMetaText({
          fps: fps3,
          frames: frames2,
          width: width3,
          height: height3,
        });
        el39.textContent !== formatVideoMetaText2 && (el39.textContent = formatVideoMetaText2);
      }
    }
  }
  if (value176?.update && signature !== _nodeDataSnapshotMap.get(nodeId3)) {
    _nodeDataSnapshotMap.set(nodeId3, signature);
    if (!skipInstanceUpdate) value176.update(node3);
  }
  const value190 = pickMode3 && pickMode3.active && nodeId3 === pickMode3.sourceNodeId,
    isNodeType2 = isNodeType(node3, 'storyboard') && node3.isEditing;
  if ((connOverlay3 && connOverlay3.srcId) || value190 || isNodeType2) {
    if (nodeId3 === connOverlay3?.srcId || value190 || isNodeType2)
      (wrapperEl.classList.add('conn-src'), wrapperEl.classList.remove('conn-invalid'));
    else
      connOverlay3?.invalidNodeIds?.includes(nodeId3)
        ? (wrapperEl.classList.add('conn-invalid'), wrapperEl.classList.remove('conn-src'))
        : wrapperEl.classList.remove('conn-invalid', 'conn-src');
  } else wrapperEl.classList.remove('conn-invalid', 'conn-src');
  if (value190 || isNodeType2)
    (wrapperEl.style.setProperty(
      'box-shadow',
      '0 0 0 2px var(--white-70), 0 0 20px 0 var(--white-40)',
      'important',
    ),
      wrapperEl.style.setProperty('border-radius', '16px', 'important'));
  else
    wrapperEl.style.getPropertyPriority('box-shadow') === 'important' &&
      (wrapperEl.style.removeProperty('box-shadow'), wrapperEl.style.removeProperty('border-radius'));
  const value191 = pickMode3 && pickMode3.active && pickMode3.hoverNodeId === nodeId3;
  if ((connOverlay3 && connOverlay3.hoverId === nodeId3) || value191) {
    if (!wrapperEl.classList.contains('conn-hoverTarget')) {
      wrapperEl.classList.add('conn-hoverTarget');
      const value192 = window.getComputedStyle(wrapperEl).borderRadius;
      let count7 = parseFloat(value192);
      if (isNaN(count7) || count7 <= 0) count7 = 16;
      wrapperEl.style.setProperty('--hover-br', count7 + 4 + 'px');
    }
    let value193 = false;
    if (connOverlay3 && connOverlay3.side === 'left') value193 = true;
    else value191 && pickMode3 && pickMode3.handleDirection === 'left' && (value193 = true);
    value193
      ? (wrapperEl.classList.add('conn-hover-output'), wrapperEl.classList.remove('conn-hover-input'))
      : (wrapperEl.classList.add('conn-hover-input'), wrapperEl.classList.remove('conn-hover-output'));
  } else
    wrapperEl.classList.contains('conn-hoverTarget') &&
      (wrapperEl.classList.remove('conn-hoverTarget', 'conn-hover-input', 'conn-hover-output'),
      wrapperEl.style.removeProperty('--hover-br'));
  syncNodeResultClass(wrapperEl, node3, isNodeType);
}
function _renderNodes(
  canvasEl,
  nodes2,
  selectedNodeIds3,
  relatedNodeIds3,
  relatedHighlightColor2,
  connOverlay4,
  value194,
  value195,
  value196,
  value197,
  value198,
  snapshot = null,
  deferInitialPlanning = {},
) {
  const pickConnectMode2 = value194,
    viewport3 = value195 || { x: 0, y: 0, zoom: 1 },
    value199 = value196 || {},
    parentToChildren = value197 || {},
    showVideoMeta2 = value198 !== false,
    value200 = deferInitialPlanning?.deferParking === true,
    dragContext6 = getDragContext(),
    selectedNodeSet3 = selectedNodeIds3 instanceof Set ? selectedNodeIds3 : new Set(selectedNodeIds3 || []),
    selectedNodeRankMap3 = buildSelectedNodeRankMap(selectedNodeIds3),
    activeNodeIds = buildRendererDragTargetSet({
      dragContext: dragContext6,
      selectedNodeSet: selectedNodeSet3,
      parentToChildren: parentToChildren,
    }),
    interactionBusy = _rendererInteractionGrace.isBusy(),
    { width: width4, height: height4 } = _getCachedContainerSize(canvasEl.parentElement || canvasEl),
    nodeCount3 = Number.isFinite(snapshot?._nodeCount)
      ? snapshot._nodeCount
      : Object.keys(nodes2 || {}).length,
    snapshotRev2 = Number.isFinite(snapshot?._persistRev) ? snapshot._persistRev : nodeCount3,
    pinnedNodeIds3 = _getPinnedNodeIds(),
    spatialIndex = getCachedRendererSpatialIndex(nodes2, {
      snapshotRev: snapshotRev2,
      nodeCount: nodeCount3,
      denseNodeCount: RENDERER_VIRTUALIZATION_CONFIG.denseNodeCount,
    }),
    signature2 = _buildVirtualizationCandidateSignature({
      snapshotRev: snapshotRev2,
      nodeCount: nodeCount3,
      viewport: viewport3,
      selectedNodeIds: selectedNodeIds3,
      connOverlay: connOverlay4,
      pickConnectMode: pickConnectMode2,
      dragContext: dragContext6,
      pinnedNodeIds: pinnedNodeIds3,
      containerW: width4,
      containerH: height4,
    });
  let mountCandidateIds = _lastVirtualCandidateResult;
  const cacheHit = signature2 === _lastVirtualCandidateSignature && !!mountCandidateIds;
  !cacheHit &&
    ((mountCandidateIds = buildVirtualizationCandidateSets({
      nodes: nodes2,
      spatialIndex: spatialIndex,
      viewport: viewport3,
      containerWidth: width4,
      containerHeight: height4,
      selectedNodeIds: selectedNodeIds3,
      connOverlay: connOverlay4,
      pickConnectMode: pickConnectMode2,
      dragContext: dragContext6,
      parentToChildren: parentToChildren,
      pinnedNodeIds: pinnedNodeIds3,
      mountedNodeIds: _mountedNodeIds,
    })),
    (_lastVirtualCandidateSignature = signature2),
    (_lastVirtualCandidateResult = mountCandidateIds));
  const rendererFramePlan = createRendererFramePlan({
      snapshot: snapshot,
      nodes: nodes2,
      viewport: viewport3,
      containerRect: { width: width4, height: height4 },
      nodeCount: nodeCount3,
      geometryRev: snapshotRev2,
    }),
    mountCandidateIds2 = rendererFramePlan.buildScenePlan({
      mountCandidateIds: mountCandidateIds.mountCandidateIds,
      previewCandidateIds: mountCandidateIds.previewCandidateIds,
      parkCandidateIds: mountCandidateIds.parkCandidateIds,
      selectedNodeIds: selectedNodeSet3,
      activeNodeIds: activeNodeIds,
      keepAliveNodeIds: mountCandidateIds.keepAliveNodeIds,
      mountedNodeIds: _mountedNodeIds,
      includeParkIds: false,
      deferInitialPlanning: deferInitialPlanning?.deferInitialRasterPlanning === true,
    });
  mountCandidateIds = {
    ...mountCandidateIds,
    mountCandidateIds: mountCandidateIds2.fullSurfaceIds,
    previewCandidateIds: mountCandidateIds2.presentationSurfaceIds,
    parkCandidateIds: mountCandidateIds2.fullSurfaceReleaseIds,
    scenePlan: mountCandidateIds2,
  };
  const freezeRasterSurface = _rasterPreviewCoordinator.sync({
    canvasEl: canvasEl,
    nodes: nodes2,
    scenePlan: mountCandidateIds2,
    selectedNodeIds: selectedNodeSet3,
    dragNodeIds: activeNodeIds,
    connOverlay: connOverlay4,
    pickConnectMode: pickConnectMode2,
    viewport: viewport3,
    viewportBusy: interactionBusy,
    containerWidth: width4,
    containerHeight: height4,
    mediaLoadingBusy: interactionBusy,
    freezeRasterSurface: interactionBusy,
    lockRasterParticipation: deferInitialPlanning?.lockRasterParticipation === true,
    deferInitialPlanning: deferInitialPlanning?.deferInitialRasterPlanning === true,
    releaseFullSurface(value201) {
      const el40 = _wrapperMap.get(value201);
      if (!el40?.style || el40.classList?.contains?.('is-dragging')) return;
      el40.style.display = 'none';
      _syncRunningTimerForNode(value201, null, { hide: true });
    },
  });
  _notifyVirtualizationProbe({
    signature: signature2,
    cacheHit: cacheHit,
    snapshotRev: snapshotRev2,
    containerW: width4,
    containerH: height4,
    spatialIndex: !!spatialIndex,
    nodeCount: nodeCount3,
    mountCandidateCount: mountCandidateIds.mountCandidateIds?.size || 0,
    previewCandidateCount: mountCandidateIds.previewCandidateIds?.size || 0,
    parkCandidateCount: mountCandidateIds.parkCandidateIds?.size || 0,
    keepAliveCount: mountCandidateIds.keepAliveNodeIds?.size || 0,
  });
  const { mountCandidateIds: mountCandidateIds3 } = mountCandidateIds,
    isPreviewCandidate = freezeRasterSurface.domPreviewCandidateIds || mountCandidateIds.previewCandidateIds,
    mediaSourceOwnerIds = freezeRasterSurface.domPreviewMediaSourceOwnerIds || new Set(),
    requiredImmediateMediaSourceOwnerIds = new Set([
      ...mediaSourceOwnerIds,
      ...[...mountCandidateIds2.exactVisibleGenerationBusyIds].filter(
        (item10) => !mountCandidateIds2.fullSurfaceIds.has(item10) || !_mountedNodeIds.has(item10),
      ),
    ]),
    map6 = freezeRasterSurface.releasableFullSurfaceIds || mountCandidateIds.parkCandidateIds,
    virtualizedRenderNodes = collectVirtualizedRenderNodes({
      nodes: nodes2,
      virtualizationResult: mountCandidateIds,
      spatialIndex: spatialIndex,
      mountedNodeIds: _mountedNodeIds,
      viewport: viewport3,
      containerWidth: width4,
      containerHeight: height4,
    }),
    rendererStructuralBudget = createRendererStructuralBudget(),
    exactVisiblePreviewNodeIds = _collectExactVisiblePreviewNodeIds(canvasEl);
  _rendererMediaRuntimePreparer.prune(mountCandidateIds3);
  let hasPendingStructuralOps2 = false,
    deferredParkCount2 = 0,
    enabled40 = null;
  for (const node4 of virtualizedRenderNodes) {
    if (!node4?.id) continue;
    const nodeId4 = node4.id;
    let wrapperEl2 = _wrapperMap.get(nodeId4),
      instance = _componentMap.get(nodeId4),
      deferDetailsOnMount = false;
    const nodeType2 = normalizeNodeType(node4.type),
      value202 = _nodeTypeSnapshotMap.get(nodeId4);
    wrapperEl2 &&
      instance &&
      value202 &&
      value202 !== nodeType2 &&
      (_destroyNode(nodeId4), (wrapperEl2 = null), (instance = null));
    const isSelected4 = selectedNodeSet3.has(nodeId4),
      isSelectionRelated3 = !isSelected4 && relatedNodeIds3?.has?.(nodeId4),
      enabled41 = _mountedNodeIds.has(nodeId4) && !!wrapperEl2?.isConnected;
    _sourceVideoSlotLifecycle.isManagedNode(nodeId4) &&
      _sourceVideoSlotLifecycle.syncViewportVisibility(nodeId4, {
        isSelected: isSelected4,
        isPreviewCandidate: isPreviewCandidate.has(nodeId4),
        isVisible: _isNodeVisible(node4, viewport3, width4, height4),
      });
    const value203 = _sourceVideoSlotLifecycle.shouldRetainPresentedSurface(nodeId4),
      enabled42 = mountCandidateIds3.has(nodeId4) || value203 || (enabled41 && !map6.has(nodeId4));
    let value204 = false;
    if (!enabled42) {
      if (wrapperEl2 && instance) {
        const enabled43 = _pendingNodeDataMap.get(nodeId4);
        (!enabled43 || enabled43.node !== node4) &&
          _pendingNodeDataMap.set(nodeId4, { node: node4, signature: null });
      }
      if (enabled41 && map6.has(nodeId4)) {
        if (value200) {
          deferredParkCount2 += 1;
          continue;
        }
        rendererStructuralBudget.hasBudget()
          ? (_parkNode(nodeId4), rendererStructuralBudget.consume())
          : (hasPendingStructuralOps2 = true);
      }
      continue;
    }
    if (!instance || !wrapperEl2) {
      if (!rendererStructuralBudget.hasBudget()) {
        hasPendingStructuralOps2 = true;
        continue;
      }
      deferDetailsOnMount = _nodeDetailHydration.shouldDeferNodeDetails({
        node: node4,
        nodeId: nodeId4,
        isSelected: isSelected4,
        connOverlay: connOverlay4,
        pickMode: pickConnectMode2,
        relatedNodeIds: relatedNodeIds3,
        viewport: viewport3,
        mountCandidateCount: mountCandidateIds3.size,
      });
      const deferMediaOnMount =
          deferDetailsOnMount ||
          shouldDeferInitialVideoMediaOnMount({
            node: node4,
            nodeId: nodeId4,
            isSelected: isSelected4,
            isSelectionRelated: isSelectionRelated3,
            dragTargets: activeNodeIds,
            nodeCount: nodeCount3,
            mountCandidateCount: mountCandidateIds3.size,
          }),
        runtimeOptions = {
          deferDetailsOnMount: deferDetailsOnMount,
          deferMediaOnMount,
          eagerVideoPreviewOnMount: false,
        },
        runtimeVariant = [
          deferDetailsOnMount ? 'details-deferred' : 'details-live',
          deferMediaOnMount ? 'media-deferred' : 'media-live',
          'eager-live',
        ].join('|'),
        hasPreparedRuntime = _rendererMediaRuntimePreparer.hasPrepared(nodeId4, node4, runtimeVariant),
        interactionPriority = isRendererMediaRuntimeInteractionPriority({
          nodeId: nodeId4,
          isSelected: isSelected4,
          isSelectionRelated: isSelectionRelated3,
          dragTargets: activeNodeIds,
          connOverlay: connOverlay4,
          pickMode: pickConnectMode2,
        }),
        shouldPrebuildRuntime = shouldPrebuildRendererMediaRuntime({
          node: node4,
          nodeCount: nodeCount3,
          veryDenseNodeCount: RENDERER_VIRTUALIZATION_CONFIG.veryDenseNodeCount,
          hasExactVisiblePreview: exactVisiblePreviewNodeIds.has(nodeId4),
          interactionBusy,
          interactionPriority,
          deferMediaOnMount,
          viewportPriorityMediaOnly: false,
          idlePreparationSupported: typeof requestIdleCallback === 'function',
        });
      if (!hasPreparedRuntime && shouldPrebuildRuntime) {
        _rendererMediaRuntimePreparer.enqueue({
          nodeId: nodeId4,
          version: node4,
          variant: runtimeVariant,
          isValid: () => _currentSnapshot?.nodes?.[nodeId4] === node4 && !_componentMap.has(nodeId4),
          prepare: () =>
            prepareRendererNodeRuntime({
              node: node4,
              selectedNodeSet: selectedNodeSet3,
              selectedNodeRankMap: selectedNodeRankMap3,
              dragContext: dragContext6,
              dragTargets: activeNodeIds,
              options: { ...runtimeOptions, prebuildOffscreen: true },
            }),
          dispose: disposePreparedRendererNodeRuntime,
        });
        continue;
      }
      !hasPreparedRuntime && !shouldPrebuildRuntime && _rendererMediaRuntimePreparer.forget(nodeId4);
      const preparedRuntime = hasPreparedRuntime
          ? _rendererMediaRuntimePreparer.take(nodeId4, node4, runtimeVariant)
          : null,
        registeredRuntime = preparedRuntime
          ? _registerNodeRuntime(preparedRuntime)
          : _createNodeRuntime(
              node4,
              selectedNodeSet3,
              selectedNodeRankMap3,
              dragContext6,
              activeNodeIds,
              runtimeOptions,
            );
      if (!registeredRuntime) {
        preparedRuntime && disposePreparedRendererNodeRuntime(preparedRuntime);
        hasPendingStructuralOps2 = true;
        continue;
      }
      ({ wrapperEl: wrapperEl2, instance: instance } = registeredRuntime);
      (!enabled40 && (enabled40 = document.createDocumentFragment()),
        _mountNode(nodeId4, enabled40),
        (value204 = true),
        rendererStructuralBudget.consume());
    } else {
      if (!enabled41) {
        if (!rendererStructuralBudget.hasBudget()) {
          hasPendingStructuralOps2 = true;
          continue;
        }
        (!enabled40 && (enabled40 = document.createDocumentFragment()),
          _mountNode(nodeId4, enabled40),
          (value204 = true),
          rendererStructuralBudget.consume());
      }
    }
    (value204 || wrapperEl2?.dataset?.detailStage === 'deferred') &&
      _nodeDetailHydration.syncNodeDetailMountStage({
        wrapperEl: wrapperEl2,
        node: node4,
        nodeId: nodeId4,
        isSelected: isSelected4,
        connOverlay: connOverlay4,
        pickMode: pickConnectMode2,
        relatedNodeIds: relatedNodeIds3,
        viewport: viewport3,
        mountCandidateCount: mountCandidateIds3.size,
        autoHydrate: false,
      });
    const value205 = _pendingNodeDataMap.get(nodeId4),
      node5 = value205?.node || node4,
      inEdgeSig3 = _getIncomingEdgeSignature(nodeId4, value199, nodes2),
      mediaLodMode2 = syncNodeMediaLodMode(wrapperEl2, node5, viewport3),
      signature3 = buildRendererNodeSignature({
        node: node5,
        inEdgeSig: inEdgeSig3,
        pickMode: pickConnectMode2,
        isSelected: isSelected4,
        isSelectionRelated: isSelectionRelated3,
        showVideoMeta: showVideoMeta2,
        viewport: viewport3,
        mediaLodMode: mediaLodMode2,
      });
    (_syncMountedNodePresentation({
      wrapperEl: wrapperEl2,
      node: node5,
      nodeId: nodeId4,
      selectedNodeSet: selectedNodeSet3,
      selectedNodeRankMap: selectedNodeRankMap3,
      connOverlay: connOverlay4,
      pickMode: pickConnectMode2,
      viewport: viewport3,
      containerW: width4,
      containerH: height4,
      dragContext: dragContext6,
      dragTargets: activeNodeIds,
      showVideoMeta: showVideoMeta2,
      relatedNodeIds: relatedNodeIds3,
      relatedHighlightColor: relatedHighlightColor2,
      inEdgeSig: inEdgeSig3,
      signature: signature3,
      skipInstanceUpdate: shouldSkipInitialMediaNodeUpdate(node5, value204),
    }),
      value205 && _pendingNodeDataMap.delete(nodeId4));
  }
  return (
    _flushMountBatch(canvasEl, enabled40),
    syncRendererFastPreviewAfterNodeRender({
      continuation: _fastPreviewContinuation,
      layer: _fastPreviewLayer,
      canvasEl: canvasEl,
      nodes: nodes2,
      previewCandidateIds: isPreviewCandidate,
      selectedNodeSet: selectedNodeSet3,
      candidateSignature: signature2,
      hasPendingStructuralOps: hasPendingStructuralOps2,
      connOverlay: connOverlay4,
      pickConnectMode: pickConnectMode2,
      nodeCount: nodeCount3,
      viewport: viewport3,
      containerWidth: width4,
      containerHeight: height4,
      dragContext: dragContext6,
      dragTargets: activeNodeIds,
      freezeRasterSurface: freezeRasterSurface.freezeActive === true,
      mediaSourceOwnerIds: mediaSourceOwnerIds,
      requiredImmediateMediaSourceOwnerIds: requiredImmediateMediaSourceOwnerIds,
      viewportBusy: interactionBusy,
      ..._fastPreviewLifecycle.getContinuationOptions(),
    }),
    { hasPendingStructuralOps: hasPendingStructuralOps2, deferredParkCount: deferredParkCount2 }
  );
}
function _cleanupNodes(el41, value206) {
  let value207 = false;
  const map7 = new Set(Object.keys(value206 || {})),
    value208 = new Set([
      ..._componentMap.keys(),
      ..._wrapperMap.keys(),
      ..._parkedWrapperMap.keys(),
      ..._mountedNodeIds,
      ..._parkedNodeIds,
    ]);
  for (const value209 of value208) {
    !map7.has(value209) && (_destroyNode(value209), (value207 = true));
  }
  el41.querySelectorAll('.v2-node').forEach((el42) => {
    const value210 = el42.id || el42.dataset.nodeId;
    value210 && !map7.has(value210) && (el42.remove(), (value207 = true));
  });
  if (value207) {
    const el43 = document.getElementById('v2-side-plus-holder');
    el43 && el43.children.length > 0 && el43.replaceChildren();
  }
}
function _createSvgLayer() {
  const el44 = document.createElement('div');
  ((el44.id = 'v2-edges-wrapper'),
    (el44.style.position = 'absolute'),
    (el44.style.top = '0'),
    (el44.style.left = '0'),
    (el44.style.width = '100%'),
    (el44.style.height = '100%'),
    (el44.style.pointerEvents = 'none'),
    (el44.style.zIndex = '5'));
  const el45 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  return (
    (el45.id = 'v2-edges'),
    (el45.style.overflow = 'visible'),
    (el45.style.pointerEvents = 'none'),
    el44.appendChild(el45),
    el44
  );
}
function _renderEdgesByIds(
  svgEl,
  edgeIds,
  edges,
  nodes3,
  viewport4,
  containerEl,
  dragOffsetCtx2 = null,
  relatedEdgeIds3 = null,
  options4 = {},
) {
  const value211 = _edgeLayer.renderPartial({
    svgEl: svgEl,
    edgeIds: edgeIds,
    edges: edges,
    nodes: nodes3,
    viewport: viewport4,
    containerEl: containerEl,
    dragOffsetCtx: dragOffsetCtx2,
    relatedEdgeIds: relatedEdgeIds3,
    options: options4,
  });
  if (value211.mutated) _invalidateFullEdgeRenderSignature();
}
function _renderEdges(
  svgEl2,
  edges2,
  nodes4,
  viewport5,
  containerEl2,
  dragOffsetCtx3 = null,
  relatedEdgeIds4 = null,
  edgeEntries2 = null,
  reason = 'steady',
  args5 = {},
) {
  _edgeLayer.renderFull({
    svgEl: svgEl2,
    edges: edges2,
    nodes: nodes4,
    viewport: viewport5,
    containerEl: containerEl2,
    dragOffsetCtx: dragOffsetCtx3,
    relatedEdgeIds: relatedEdgeIds4,
    edgeEntries: edgeEntries2,
    reason: reason,
    options: {
      ...args5,
      clearedDom: _edgeDomClearedSinceLastFull === true,
    },
  });
  args5?.renderSignature && (_lastFullEdgeRenderSignature = args5.renderSignature);
  _edgeDomClearedSinceLastFull = false;
}
function _clearRenderedEdges(value212) {
  const count8 = _edgeLayer.clearRenderedEdges(value212);
  count8 > 0 && _invalidateFullEdgeRenderSignature({ clearedDom: true });
}
function _clearRenderedEdgesFromDocument() {
  if (typeof document === 'undefined') {
    _edgeLayer.reset();
    return;
  }
  const value213 = document.getElementById?.('v2-edges');
  (value213 && _clearRenderedEdges(value213),
    document.getElementById?.('v2-draft-edge')?.remove?.(),
    document.querySelectorAll?.('.v2-edge-thumbnail').forEach((el46) => el46.remove()),
    document.querySelectorAll?.('[id^="v2-thumb-"]').forEach((el47) => el47.remove()));
}
function _cleanupEdges(value214, value215) {
  const count9 = _edgeLayer.cleanupEdges(value214, value215);
  (document.querySelectorAll('.v2-edge-thumbnail').forEach((el48) => el48.remove()),
    document.querySelectorAll('[id^="v2-thumb-"]').forEach((el49) => el49.remove()),
    count9 > 0 && _invalidateFullEdgeRenderSignature({ clearedDom: true }));
}
function _renderEdgeThumbnails_REMOVED(value216, value217, value218) {
  for (const value219 of Object.values(value217)) {
  }
}
function _createPickerEl() {
  const el50 = document.createElement('div');
  return (
    (el50.id = 'v2-picker'),
    (el50.dataset.uiStop = '1'),
    Object.assign(el50.style, {
      position: 'fixed',
      display: 'none',
      flexDirection: 'column',
      gap: '4px',
      background: 'var(--preset-menu-bg)',
      border: '1px solid var(--preset-menu-border)',
      borderRadius: 'var(--radius-18)',
      padding: '8px',
      minWidth: '160px',
      boxShadow: 'var(--preset-menu-shadow)',
      backdropFilter: 'blur(var(--preset-menu-blur))',
      zIndex: '1000',
      fontFamily: 'inherit',
    }),
    el50
  );
}
function _renderPicker(el51, enabled44, value220) {
  if (!enabled44.visible) {
    ((el51.style.display = 'none'), el51.replaceChildren());
    return;
  }
  ((el51.style.display = 'flex'),
    (el51.style.left = enabled44.screenX + 'px'),
    (el51.style.top = enabled44.screenY + 'px'));
  if (el51.children.length > 0) return;
  const el52 = document.createElement('div');
  ((el52.textContent = t('coreUi.renderer.picker.addNode')),
    Object.assign(el52.style, {
      fontSize: '11px',
      color: 'var(--text-muted)',
      padding: '2px 4px 6px',
      borderBottom: '1px solid var(--white-08)',
      marginBottom: '4px',
      userSelect: 'none',
    }),
    el51.appendChild(el52));
  const width5 = getAIGenerationDefaultSizeByType('ai-text'),
    width6 = getAIGenerationDefaultSizeByType('ai-image'),
    width7 = getAIGenerationDefaultSizeByType('ai-video'),
    value221 = [
      {
        type: 'ai-text',
        label: t('coreUi.renderer.picker.items.aiText'),
        defaultLabel: t('coreUi.renderer.picker.defaults.aiText'),
        width: width5.width,
        height: width5.height,
      },
      {
        type: 'ai-image',
        label: t('coreUi.renderer.picker.items.aiImage'),
        defaultLabel: t('coreUi.renderer.picker.defaults.aiImage'),
        width: width6.width,
        height: width6.height,
      },
      {
        type: 'ai-video',
        label: t('coreUi.renderer.picker.items.aiVideo'),
        defaultLabel: t('coreUi.renderer.picker.defaults.aiVideo'),
        width: width7.width,
        height: width7.height,
      },
      {
        type: 'ai-audio',
        label: t('coreUi.renderer.picker.items.aiAudio'),
        defaultLabel: t('coreUi.renderer.picker.defaults.aiAudio'),
        width: getAIGenerationDefaultSizeByType('ai-audio').width,
        height: getAIGenerationDefaultSizeByType('ai-audio').height,
      },
    ];
  for (const {
    type: type,
    label: label,
    defaultLabel: defaultLabel,
    width: width8,
    height: height5,
  } of value221) {
    const el53 = document.createElement('button');
    ((el53.textContent = label),
      (el53.dataset.nodeType = type),
      (el53.dataset.defaultLabel = defaultLabel),
      (el53.dataset.width = String(width8)),
      (el53.dataset.height = String(height5)),
      Object.assign(el53.style, {
        background: 'var(--blue-10)',
        border: '1px solid var(--blue-25)',
        borderRadius: '6px',
        color: 'var(--blue)',
        fontSize: '13px',
        padding: '7px 12px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s',
      }),
      el51.appendChild(el53));
  }
}
function _createSelectionRectEl() {
  const el54 = document.createElement('div');
  return (
    (el54.id = 'v2-selection-rect'),
    Object.assign(el54.style, {
      position: 'absolute',
      border: '1px dashed var(--white-50)',
      backgroundColor: 'var(--white-02)',
      pointerEvents: 'none',
      display: 'none',
      zIndex: '1000',
    }),
    el54
  );
}
function _renderSelectionRect(el55, enabled45) {
  if (!enabled45 || !enabled45.active) {
    el55.style.display = 'none';
    return;
  }
  el55.style.display = 'block';
  const value222 = Math.min(enabled45.x1, enabled45.x2),
    value223 = Math.min(enabled45.y1, enabled45.y2),
    value224 = Math.abs(enabled45.x2 - enabled45.x1),
    value225 = Math.abs(enabled45.y2 - enabled45.y1);
  ((el55.style.left = value222 + 'px'),
    (el55.style.top = value223 + 'px'),
    (el55.style.width = value224 + 'px'),
    (el55.style.height = value225 + 'px'));
}
function _createMultiSelectBoxEl(value226) {
  const el56 = document.createElement('div');
  ((el56.id = 'v2-multi-select-box'), (el56.className = 'v2-multi-select-box'));
  const el57 = document.createElement('div');
  ((el57.className = 'v2-multi-select-tab'), (el57.dataset.uiStop = '1'));
  const value227 = 'http://www.w3.org/2000/svg',
    handler = (value228 = '2') => {
      const el58 = document.createElementNS(value227, 'svg');
      return (
        el58.setAttribute('viewBox', '0 0 24 24'),
        el58.setAttribute('fill', 'none'),
        el58.setAttribute('stroke', 'currentColor'),
        el58.setAttribute('stroke-width', value228),
        el58.setAttribute('stroke-linecap', 'round'),
        el58.setAttribute('stroke-linejoin', 'round'),
        el58
      );
    },
    handler2 = (value229, value230, value231) => {
      const el59 = document.createElement('button');
      return (
        (el59.type = 'button'),
        (el59.className = 'v2-multi-select-btn'),
        (el59.dataset.uiAction = value229),
        (el59.title = value230),
        el59.setAttribute('aria-label', value230),
        el59.replaceChildren(value231),
        el59
      );
    },
    handler3 = (el60, value232) => {
      const el61 = document.createElementNS(value227, 'path');
      return (el61.setAttribute('d', value232), el60.appendChild(el61), el61);
    },
    el62 = handler('2.5'),
    el63 = document.createElementNS(value227, 'polygon');
  (el63.setAttribute('points', '5 3 19 12 5 21 5 3'), el62.appendChild(el63));
  const el64 = handler2('ms-sync-video-play', t('coreUi.renderer.multiSelect.syncVideoPlay'), el62);
  el64.style.display = 'none';
  const value233 = handler('2');
  [
    'M12 3l1.2 4.1L17 8.3l-3.8 1.2L12 13.5l-1.2-4-3.8-1.2 3.8-1.2L12 3z',
    'M18 14l.7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14z',
    'M6 13l.8 2.7L9.5 16.5l-2.7.8L6 20l-.8-2.7-2.7-.8 2.7-.8L6 13z',
  ].forEach((item11) => handler3(value233, item11));
  const value234 = handler2('ms-run-selected', t('coreUi.renderer.multiSelect.runSelected'), value233),
    el65 = handler('1.8'),
    el66 = document.createElementNS(value227, 'polygon');
  (el66.setAttribute('points', '12 2 20 12 16 12 16 22 8 22 8 12 4 12 12 2'), el65.appendChild(el66));
  const value235 = handler2('ms-asset', t('coreUi.renderer.multiSelect.createAsset'), el65),
    el67 = handler('2');
  for (const [value236, value237] of [
    [3, 3],
    [14, 3],
    [14, 14],
    [3, 14],
  ]) {
    const el68 = document.createElementNS(value227, 'rect');
    (el68.setAttribute('x', String(value236)),
      el68.setAttribute('y', String(value237)),
      el68.setAttribute('width', '7'),
      el68.setAttribute('height', '7'),
      el67.appendChild(el68));
  }
  const value238 = handler2('ms-group', t('coreUi.renderer.multiSelect.group'), el67),
    el69 = handler('2'),
    el70 = document.createElementNS(value227, 'path');
  el70.setAttribute('d', 'M3 12a9 9 0 0 1 15.36-6.36');
  const el71 = document.createElementNS(value227, 'path');
  el71.setAttribute('d', 'M21 12a9 9 0 0 1-15.36 6.36');
  const el72 = document.createElementNS(value227, 'polyline');
  el72.setAttribute('points', '21 3 21 9 15 9');
  const el73 = document.createElementNS(value227, 'polyline');
  (el73.setAttribute('points', '3 21 3 15 9 15'),
    el69.appendChild(el70),
    el69.appendChild(el71),
    el69.appendChild(el72),
    el69.appendChild(el73));
  const el74 = handler2('ms-reset-image-size', t('coreUi.renderer.multiSelect.resetDefaultSize'), el69);
  el74.style.display = 'none';
  const el75 = handler('2'),
    el76 = document.createElementNS(value227, 'rect');
  (el76.setAttribute('x', '3'),
    el76.setAttribute('y', '5'),
    el76.setAttribute('width', '18'),
    el76.setAttribute('height', '14'),
    el76.setAttribute('rx', '2'),
    el75.appendChild(el76),
    handler3(el75, 'M3 9h18'),
    handler3(el75, 'M7 5l4 4'),
    handler3(el75, 'M13 5l4 4'));
  const el77 = handler2('ms-compose-video', t('coreUi.renderer.multiSelect.composeVideo'), el75);
  el77.style.display = 'none';
  const value239 = handler('2');
  [
    'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    'M3 10h18',
    'M12 10v10',
  ].forEach((item12) => handler3(value239, item12));
  const el78 = handler2('ms-create-collage', t('coreUi.renderer.multiSelect.createCollage'), value239);
  return (
    (el78.style.display = 'none'),
    el57.appendChild(value234),
    el57.appendChild(el64),
    el57.appendChild(value235),
    el57.appendChild(value238),
    el57.appendChild(el74),
    el57.appendChild(el78),
    el57.appendChild(el77),
    el56.appendChild(el57),
    el56
  );
}
function _createAlignCenterPanelEl() {
  const el79 = document.createElement('div');
  ((el79.id = 'v2-align-center-panel'),
    (el79.className = 'v2-align-center-panel'),
    (el79.dataset.uiStop = '1'),
    (el79.style.display = 'none'));
  const value240 = 'http://www.w3.org/2000/svg',
    value241 = {
      'ms-align-left': ['M4 4v16', 'M8 7h10', 'M8 12h7', 'M8 17h9'],
      'ms-align-h-center': ['M12 4v16', 'M7 7h10', 'M9 12h6', 'M8 17h8'],
      'ms-align-right': ['M20 4v16', 'M6 7h10', 'M9 12h7', 'M7 17h9'],
      'ms-align-top': ['M4 4h16', 'M7 8v10', 'M12 8v7', 'M17 8v9'],
      'ms-align-v-center': ['M4 12h16', 'M7 7v10', 'M12 9v6', 'M17 8v8'],
      'ms-align-bottom': ['M4 20h16', 'M7 6v10', 'M12 9v7', 'M17 7v9'],
      'ms-distribute-h': ['M3 20h18', 'M5 8h3v8H5z', 'M11 5h3v11h-3z', 'M17 10h3v6h-3z'],
      'ms-distribute-v': ['M20 3v18', 'M8 5h8v3H8z', 'M5 11h11v3H5z', 'M10 17h6v3h-6z'],
    },
    list14 = [
      { action: 'ms-align-left', tooltip: t('coreUi.renderer.align.left'), slot: 'slot-1' },
      { action: 'ms-align-h-center', tooltip: t('coreUi.renderer.align.hCenter'), slot: 'slot-2' },
      { action: 'ms-align-right', tooltip: t('coreUi.renderer.align.right'), slot: 'slot-3' },
      { action: 'ms-align-top', tooltip: t('coreUi.renderer.align.top'), slot: 'slot-4' },
      { action: 'ms-align-bottom', tooltip: t('coreUi.renderer.align.bottom'), slot: 'slot-6' },
      { action: 'ms-distribute-h', tooltip: t('coreUi.renderer.align.distributeH'), slot: 'slot-7' },
      { action: 'ms-align-v-center', tooltip: t('coreUi.renderer.align.vCenter'), slot: 'slot-8' },
      { action: 'ms-distribute-v', tooltip: t('coreUi.renderer.align.distributeV'), slot: 'slot-9' },
    ];
  return (
    list14.forEach((item13) => {
      const el80 = document.createElement('button');
      ((el80.type = 'button'),
        (el80.className = 'v2-align-center-btn ' + item13.slot),
        (el80.dataset.uiAction = item13.action),
        (el80.dataset.tooltip = item13.tooltip),
        el80.setAttribute('aria-label', item13.tooltip));
      const el81 = document.createElementNS(value240, 'svg');
      (el81.setAttribute('width', '16'),
        el81.setAttribute('height', '16'),
        el81.setAttribute('viewBox', '0 0 24 24'),
        el81.setAttribute('fill', 'none'),
        el81.setAttribute('stroke', 'currentColor'),
        el81.setAttribute('stroke-width', '2'),
        el81.setAttribute('stroke-linecap', 'round'),
        el81.setAttribute('stroke-linejoin', 'round'));
      const list15 = value241[item13.action] || [];
      (list15.forEach((item14) => {
        const el82 = document.createElementNS(value240, 'path');
        (el82.setAttribute('d', item14), el81.appendChild(el82));
      }),
        el80.appendChild(el81),
        el79.appendChild(el80));
    }),
    el79
  );
}
function _renderAlignCenterPanel(el83, value242, value243, value244 = {}) {
  if (!el83) return;
  const value245 = String(value244?.alignFeatureTriggerMode || 'click'),
    value246 = value244?.alignFeatureEnabled !== false && value245 !== 'off',
    value247 = value244?.alignPanelVisible === true,
    list16 = Array.isArray(value242) ? value242 : [],
    list17 = getAlignableSelectionNodes(value243 || {}, list16),
    enabled46 = value246 && value247 && list16.length >= 2 && list17.length >= 2;
  if (!enabled46) {
    if (el83.style.display !== 'none') el83.style.display = 'none';
    ((_alignPanelRenderCache.centerSig = ''), (_alignPanelRenderCache.buttonStateSig = ''));
    return;
  }
  const box3 = value244?.alignPanelAnchorWorld,
    value248 = !!box3 && Number.isFinite(box3.x) && Number.isFinite(box3.y);
  let value249 = 0,
    value250 = 0;
  if (value248) ((value249 = Number(box3.x)), (value250 = Number(box3.y)));
  else {
    const selectionBounds = computeSelectionBounds(list17);
    if (!selectionBounds) {
      if (el83.style.display !== 'none') el83.style.display = 'none';
      ((_alignPanelRenderCache.centerSig = ''), (_alignPanelRenderCache.buttonStateSig = ''));
      return;
    }
    ((value249 = selectionBounds.centerX), (value250 = selectionBounds.centerY));
  }
  if (el83.style.display !== 'block') el83.style.display = 'block';
  const value251 = value249.toFixed(2) + '|' + value250.toFixed(2);
  _alignPanelRenderCache.centerSig !== value251 &&
    ((_alignPanelRenderCache.centerSig = value251),
    (el83.style.left = value249 + 'px'),
    (el83.style.top = value250 + 'px'));
  const enabled47 = list17.length >= 2,
    value252 = enabled47 ? '1' : '0';
  if (_alignPanelRenderCache.buttonStateSig !== value252) {
    _alignPanelRenderCache.buttonStateSig = value252;
    const list18 = el83._actionButtons || Array.from(el83.querySelectorAll('button[data-ui-action]'));
    ((el83._actionButtons = list18),
      list18.forEach((el84) => {
        const value253 = el84.dataset.uiAction,
          value254 = value253 === 'ms-distribute-h' || value253 === 'ms-distribute-v',
          value255 = value254 ? !enabled47 : false;
        ((el84.disabled = value255), el84.classList.toggle('is-disabled', value255));
      }));
  }
}
function _renderMultiSelectBox(el85, list19, value256, value257, value258 = false) {
  const enabled48 = list19 && list19.length >= 2,
    handler4 = (enabled49, { mountedOnly: mountedOnly = false } = {}) => {
      if (!enabled49) return null;
      if (mountedOnly && !_mountedNodeIds.has(enabled49)) return null;
      return _wrapperMap.get(enabled49) || _parkedWrapperMap.get(enabled49) || null;
    },
    handler5 = (el86) => {
      if (!el86) return;
      const el87 = el86.querySelector('.node-floating-toolbar'),
        el88 = el86.querySelector('.group-toolbar'),
        el89 = el86.querySelector('.text-prompt-panel');
      if (el87) el87.style.display = '';
      if (el88) el88.style.display = '';
      if (el89) el89.style.display = '';
    },
    handler6 = (el90) => {
      if (!el90) return;
      const el91 = el90.querySelector('.node-floating-toolbar'),
        el92 = el90.querySelector('.group-toolbar'),
        el93 = el90.querySelector('.text-prompt-panel');
      if (el91) el91.style.display = 'none';
      if (el92) el92.style.display = 'none';
      if (el93) el93.style.display = 'none';
    };
  if (!enabled48) {
    for (const value259 of _msHiddenNodeIds) {
      handler5(handler4(value259));
    }
    _msHiddenNodeIds = new Set();
  } else {
    const map8 = new Set(list19 || []),
      value260 = new Set();
    for (const value261 of _msHiddenNodeIds) {
      if (map8.has(value261)) continue;
      handler5(handler4(value261));
    }
    for (const value262 of map8) {
      const enabled50 = handler4(value262, { mountedOnly: true });
      if (!enabled50) continue;
      (handler6(enabled50), value260.add(value262));
    }
    _msHiddenNodeIds = value260;
  }
  if (!enabled48) {
    if (el85.style.display !== 'none') el85.style.display = 'none';
    ((_multiSelectRenderCache.geometrySig = ''),
      (_multiSelectRenderCache.runBtnDisabled = null),
      (_multiSelectRenderCache.resetBtnVisible = null),
      (_multiSelectRenderCache.composeBtnVisible = null),
      (_multiSelectRenderCache.composeBtnKind = ''));
    return;
  }
  const el94 = el85.querySelector('.v2-multi-select-tab button[data-ui-action="ms-sync-video-play"]'),
    el95 = el85.querySelector('.v2-multi-select-tab button[data-ui-action="ms-run-selected"]'),
    el96 = el85.querySelector('.v2-multi-select-tab button[data-ui-action="ms-compose-video"]'),
    el97 = el85.querySelector('.v2-multi-select-tab button[data-ui-action="ms-reset-image-size"]'),
    el98 = el85.querySelector('.v2-multi-select-tab button[data-ui-action="ms-create-collage"]');
  if (el94) el94.style.display = getSelectedSyncPlayableVideoCount(value256, list19) >= 2 ? '' : 'none';
  if (el95) {
    el95.style.display = '';
    let enabled51 = false;
    for (const value263 of list19) {
      if (isNodeType(value256[value263], ['ai-text', 'ai-image', 'ai-video', 'ai-audio'])) {
        enabled51 = true;
        break;
      }
    }
    const value264 = !enabled51;
    ((_multiSelectRenderCache.runBtnDisabled = value264),
      (el95.disabled = value264),
      el95.classList.toggle('is-disabled', value264));
  }
  if (el97) {
    let value265 = false;
    for (const value266 of list19) {
      const enabled52 = value256[value266],
        value267 =
          !!enabled52 && isNodeType(enabled52, ['source-image', 'source-video', 'ai-image', 'ai-video']);
      if (value267) {
        value265 = true;
        break;
      }
    }
    const value268 = value258 && value265;
    _multiSelectRenderCache.resetBtnVisible !== value268 &&
      ((_multiSelectRenderCache.resetBtnVisible = value268), (el97.style.display = value268 ? '' : 'none'));
  }
  if (el98) {
    const count10 = list19.filter((item15) =>
      isNodeType(value256[item15], ['source-image', 'ai-image', 'storyboard']),
    ).length;
    el98.style.display = count10 >= 2 ? '' : 'none';
  }
  if (el96) {
    const selectedMediaComposeKind = getSelectedMediaComposeKind(value256, list19),
      value269 = !!selectedMediaComposeKind;
    _multiSelectRenderCache.composeBtnVisible !== value269 &&
      ((_multiSelectRenderCache.composeBtnVisible = value269), (el96.style.display = value269 ? '' : 'none'));
    if (_multiSelectRenderCache.composeBtnKind !== selectedMediaComposeKind) {
      _multiSelectRenderCache.composeBtnKind = selectedMediaComposeKind;
      const mediaComposeButtonLabel = getMediaComposeButtonLabel(selectedMediaComposeKind);
      ((el96.dataset.composeKind = selectedMediaComposeKind),
        (el96.dataset.tooltip = mediaComposeButtonLabel),
        el96.setAttribute('aria-label', mediaComposeButtonLabel));
    }
  }
  let value270 = Infinity,
    value271 = Infinity,
    value272 = -Infinity,
    value273 = -Infinity,
    count11 = 0;
  list19.forEach((item16) => {
    const box4 = value256[item16];
    if (!box4) return;
    count11++;
    const value274 = box4.width || 0x104,
      value275 = box4.height || 100;
    let value276 = box4.x,
      value277 = box4.y,
      value278 = box4.x + value274,
      value279 = box4.y + value275;
    (box4.type !== 'group' && (value277 -= 30),
      (value270 = Math.min(value270, value276)),
      (value271 = Math.min(value271, value277)),
      (value272 = Math.max(value272, value278)),
      (value273 = Math.max(value273, value279)));
  });
  if (count11 < 2) {
    if (el85.style.display !== 'none') el85.style.display = 'none';
    _multiSelectRenderCache.geometrySig = '';
    return;
  }
  if (el85.style.display !== 'block') el85.style.display = 'block';
  const value280 = 18,
    value281 = value270 - value280,
    value282 = value271 - value280,
    value283 = value272 - value270 + value280 * 2,
    value284 = value273 - value271 + value280 * 2,
    value285 =
      value281.toFixed(2) + '|' + value282.toFixed(2) + '|' + value283.toFixed(2) + '|' + value284.toFixed(2);
  _multiSelectRenderCache.geometrySig !== value285 &&
    ((_multiSelectRenderCache.geometrySig = value285),
    (el85.style.left = value281 + 'px'),
    (el85.style.top = value282 + 'px'),
    (el85.style.width = value283 + 'px'),
    (el85.style.height = value284 + 'px'));
}
