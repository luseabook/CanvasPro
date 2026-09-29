import { isNodeType } from '../modules/registry.js';
import {
  getRefKindByNodeType,
  hasNodeTypeBetaBadge,
  normalizeNodeType,
} from '../modules/nodeMeta.js';
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
import { createNodeDetailHydrationController } from './rendererNodeDetailHydration.js';
import { createRendererInteractionGraceController } from './rendererInteractionGrace.js';
import { createRendererPresentationSubscription } from './rendererPresentationSubscription.js';
import { createRendererDeferredMediaController } from './rendererDeferredMedia.js';
import { createRendererFastPreviewLayer } from './rendererFastPreviewLayer.js';
import { createFastPreviewReleaseScheduler } from './rendererFastPreviewRelease.js';
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
} from './rendererNodePresentation.js';
import { t } from '../i18n/index.js';
import { setCanvasMediaSchedulerPaused } from '../modules/canvasMediaScheduler.js';
let _schedulePreparedMediaRuntimeCommit = null;
const _componentMap = new Map(),
  _nodeRuntimeBridge = createRendererNodeRuntimeBridge({
    getInstance: (_0xecbd03) => _componentMap.get(_0xecbd03),
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
  _fastPreviewLayer = createRendererFastPreviewLayer({
    getWrapper: (_0x3c5282) => _wrapperMap.get(_0x3c5282),
    isMounted: (_0x2bcb8b) => _mountedNodeIds.has(_0x2bcb8b),
  }),
  _fastPreviewRelease = createFastPreviewReleaseScheduler({
    getWrapper: (_0x5897de) => _wrapperMap.get(_0x5897de),
    isInteractionBusy: _rendererInteractionGrace.isBusy,
    releasePreview: (_0x2546bc) => _fastPreviewLayer.releaseNode(_0x2546bc),
  }),
  _rendererDeferredMedia = createRendererDeferredMediaController({
    getComponent: (_0x53f5fc) => _componentMap.get(_0x53f5fc),
    isInteractionBusy: _rendererInteractionGrace.isBusy,
    onHydrateMedia: _fastPreviewRelease.schedule,
  }),
  _nodeDetailHydration = createNodeDetailHydrationController({
    getWrapper: (_0x5e3125) => _wrapperMap.get(_0x5e3125),
    getParkedWrapper: (_0x4c8cbf) => _parkedWrapperMap.get(_0x4c8cbf),
    getWrappers: () => _wrapperMap.values(),
    getParkedWrappers: () => _parkedWrapperMap.values(),
    isMounted: (_0x273e74) => _mountedNodeIds.has(_0x273e74),
    isInteractionBusy: _rendererInteractionGrace.isBusy,
    onHydrateNodeDetails: (_0x32277d) => {
      (_fastPreviewLayer.retainNode(_0x32277d), _rendererDeferredMedia.enqueue(_0x32277d));
    },
  }),
  _edgeDomCache = new Map(),
  _edgeEndpointSignatureCache = new Map(),
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
  const _0x410294 = [],
    _0x4637a5 = [];
  for (const [_0x3a9604, _0x47a3bc] of [..._componentMap.entries()]) {
    const _0x397700 = _currentSnapshot?.nodes?.[_0x3a9604];
    if (!_0x397700 || !MANIFEST_MODEL_NODE_TYPES.has(normalizeNodeType(_0x397700.type))) continue;
    if (typeof _0x47a3bc?.refreshModelRegistryUi === 'function')
      try {
        (_0x47a3bc.refreshModelRegistryUi(), _0x410294.push(_0x3a9604));
        continue;
      } catch (_0x25873e) {
        console.warn('[Renderer] refresh model registry UI failed:', _0x25873e);
      }
    (_destroyNode(_0x3a9604), _0x4637a5.push(_0x3a9604));
  }
  return { refreshedNodeIds: _0x410294, remountedNodeIds: _0x4637a5 };
}
function _hideTimer(_0x276321) {
  const _0x33432 = _wrapperMap.get(_0x276321),
    _0x2c2c18 = _0x33432?.__v2_timer_el;
  if (!_0x2c2c18) return;
  _0x2c2c18.textContent = '';
  if (_0x2c2c18.style.display !== 'none') _0x2c2c18.style.display = 'none';
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
function _hasResolvedMediaValue(_0x4f2a69, _0x4c0fe6) {
  return (
    !!_0x4f2a69 &&
    typeof _0x4f2a69 === 'object' &&
    _0x4c0fe6.some((_0x5a76dc) => !!String(_0x4f2a69?.[_0x5a76dc] || '').trim())
  );
}
function _isResolvedSourceMediaNode(_0x1b6598) {
  if (isNodeType(_0x1b6598, 'source-audio'))
    return _hasResolvedMediaValue(_0x1b6598, ['src', 'audioUrl', 'localPath', 'resultUrl']);
  if (
    !isNodeType(_0x1b6598, 'source-video') ||
    !!String(_0x1b6598?.rhTaskId || _0x1b6598?.asyncTaskId || _0x1b6598?.dreaminaSubmitId || '').trim() ||
    _0x1b6598?.rhTaskRecovering === true ||
    _0x1b6598?.asyncTaskRecovering === true ||
    _0x1b6598?.dreaminaTaskRecovering === true
  )
    return false;
  const _0x58a2af = Array.isArray(_0x1b6598?.videos) ? _0x1b6598.videos : [];
  return (
    _hasResolvedMediaValue(_0x1b6598, [
      'src',
      'videoUrl',
      'localPath',
      'displayLocalPath',
      'originalLocalPath',
      'resultUrl',
      'capturePreviewUrl',
    ]) ||
    _0x58a2af.some((_0x119e7b) =>
      _hasResolvedMediaValue(_0x119e7b, [
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
function _isRunningTimerNode(_0x1f6e4f) {
  return !!(
    _0x1f6e4f?.generationStartTime &&
    _0x1f6e4f.generationDuration == null &&
    !_isResolvedSourceMediaNode(_0x1f6e4f)
  );
}
function _syncRunningTimerForNode(_0x4bdf88, _0x507822, { hide: hide = false } = {}) {
  if (_isRunningTimerNode(_0x507822)) {
    (_runningTimers.add(_0x4bdf88), _ensureTimerLoopActive());
    return;
  }
  if (_runningTimers.delete(_0x4bdf88) && hide) _hideTimer(_0x4bdf88);
  else hide && _hideTimer(_0x4bdf88);
  _runningTimers.size === 0 && _cancelTimerLoopIfNeeded();
}
function _updateTimers() {
  if (!_currentSnapshot || _runningTimers.size === 0) {
    _timerRafId = null;
    return;
  }
  const _0xba33e0 = [];
  for (const _0x4a181e of _runningTimers) {
    const _0x464dfe = _currentSnapshot.nodes?.[_0x4a181e];
    if (
      !_0x464dfe ||
      !_0x464dfe.generationStartTime ||
      _0x464dfe.generationDuration != null ||
      _isResolvedSourceMediaNode(_0x464dfe)
    ) {
      _0xba33e0.push(_0x4a181e);
      continue;
    }
    const _0x3446b3 = _wrapperMap.get(_0x4a181e),
      _0x5336e2 = _0x3446b3?.__v2_timer_el;
    if (_0x5336e2) {
      const _0x259848 = Date.now() - _0x464dfe.generationStartTime;
      _0x5336e2.textContent = _formatNodeTimerText(_0x464dfe, _0x259848);
      if (_0x5336e2.style.display === 'none') _0x5336e2.style.display = '';
    }
  }
  _0xba33e0.length > 0 &&
    _0xba33e0.forEach((_0x445707) => {
      (_runningTimers.delete(_0x445707), _hideTimer(_0x445707));
    });
  if (_runningTimers.size === 0) {
    _timerRafId = null;
    return;
  }
  _timerRafId = requestAnimationFrame(_updateTimers);
}
function _syncRunningTimers(_0x787c25) {
  const _0x1f6162 = Number.isFinite(_0x787c25?._persistRev)
    ? _0x787c25._persistRev
    : Number.isFinite(_0x787c25?._nodeCount)
      ? _0x787c25._nodeCount
      : 0;
  if (_0x1f6162 === _lastTimerSyncRev) return;
  _lastTimerSyncRev = _0x1f6162;
  const _0x3656b6 = _0x787c25?.nodes || {};
  for (const _0x1a35bc of Array.from(_runningTimers)) {
    _syncRunningTimerForNode(_0x1a35bc, _0x3656b6[_0x1a35bc], { hide: true });
  }
  for (const [_0x900bf9, _0x300278] of Object.entries(_0x3656b6)) {
    if (!_isRunningTimerNode(_0x300278)) continue;
    const _0xadc9b1 = String(_0x300278?.id || _0x900bf9 || '').trim();
    if (!_0xadc9b1) continue;
    _syncRunningTimerForNode(_0xadc9b1, _0x300278);
  }
  _ensureTimerLoopActive();
}
function _clearRunningTimerState() {
  (_cancelTimerLoopIfNeeded(), _runningTimers.clear(), (_lastTimerSyncRev = -1), (_currentSnapshot = null));
}
function _getNodePinSet(_0x3adcbe, _0x23e4f7 = false) {
  let _0x370956 = _nodePinReasons.get(_0x3adcbe);
  return (
    !_0x370956 && _0x23e4f7 && ((_0x370956 = new Set()), _nodePinReasons.set(_0x3adcbe, _0x370956)),
    _0x370956 || null
  );
}
function _getPinnedNodeIds() {
  const _0x319270 = new Set();
  for (const [_0x46169e, _0x5ad117] of _nodePinReasons.entries()) {
    _0x5ad117 && _0x5ad117.size > 0 && _0x319270.add(_0x46169e);
  }
  return _0x319270;
}
function _clearNodePin(_0x505f7b) {
  _nodePinReasons.delete(_0x505f7b);
}
function _clearAnchoredUiForNode(_0x5f47d9) {
  if (!_0x5f47d9) return;
  const _0x38cd19 = _componentMap.get(_0x5f47d9);
  _0x38cd19 && typeof _0x38cd19.highlightCell === 'function' && _0x38cd19.highlightCell(-1);
}
function _parkNode(_0x2883a2) {
  const _0x3d51fd = _wrapperMap.get(_0x2883a2);
  if (!_0x3d51fd) return null;
  return (
    _nodeDetailHydration.forgetNodeDetailHydration(_0x2883a2),
    _rendererDeferredMedia.forget(_0x2883a2),
    _fastPreviewRelease.forget(_0x2883a2),
    _syncRunningTimerForNode(_0x2883a2, null, { hide: true }),
    _0x3d51fd.isConnected && _0x3d51fd.remove(),
    _mountedNodeIds.delete(_0x2883a2),
    _parkedNodeIds.add(_0x2883a2),
    _parkedWrapperMap.set(_0x2883a2, _0x3d51fd),
    _clearAnchoredUiForNode(_0x2883a2),
    _nodeRuntimeBridge.unregister(_0x2883a2),
    _0x3d51fd
  );
}
function _mountNode(_0x65fed0, _0x450728) {
  const _0x118cc9 = _wrapperMap.get(_0x65fed0);
  if (!_0x118cc9) return null;
  return (
    !_0x118cc9.isConnected && _0x450728.appendChild(_0x118cc9),
    _parkedWrapperMap.delete(_0x65fed0),
    _parkedNodeIds.delete(_0x65fed0),
    _mountedNodeIds.add(_0x65fed0),
    _nodeRuntimeBridge.register(_0x65fed0),
    _0x118cc9
  );
}
function _flushMountBatch(_0x2ff5b6, _0x1af636) {
  if (!_0x2ff5b6 || !_0x1af636) return;
  if (_0x1af636.childNodes && _0x1af636.childNodes.length === 0) return;
  _0x2ff5b6.appendChild(_0x1af636);
}
function _destroyNode(_0x17af1e) {
  (_rendererMediaRuntimePreparer.forget(_0x17af1e),
    _nodeDetailHydration.forgetNodeDetailHydration(_0x17af1e),
    _rendererDeferredMedia.forget(_0x17af1e),
    _fastPreviewRelease.forget(_0x17af1e),
    _syncRunningTimerForNode(_0x17af1e, null, { hide: true }));
  const _0x17a345 = _componentMap.get(_0x17af1e);
  try {
    _0x17a345 && typeof _0x17a345.unmount === 'function' && _0x17a345.unmount();
  } catch {}
  const _0x4c886a = _wrapperMap.get(_0x17af1e) || _parkedWrapperMap.get(_0x17af1e);
  (_0x4c886a && _0x4c886a.isConnected && _0x4c886a.remove(),
    _componentMap.delete(_0x17af1e),
    _nodeDataSnapshotMap.delete(_0x17af1e),
    _wrapperMap.delete(_0x17af1e),
    _mountedNodeIds.delete(_0x17af1e),
    _parkedNodeIds.delete(_0x17af1e),
    _parkedWrapperMap.delete(_0x17af1e),
    _pendingNodeDataMap.delete(_0x17af1e),
    _nodeTypeSnapshotMap.delete(_0x17af1e),
    _nodeRuntimeBridge.unregister(_0x17af1e),
    _clearNodePin(_0x17af1e),
    _fastPreviewLayer.removeNode(_0x17af1e));
}
function _syncRendererBridge() {
  if (typeof window === 'undefined') return;
  ((window.v2Renderer = window.v2Renderer || {}),
    Object.assign(window.v2Renderer, {
      nodeInstances: _componentMap,
      wrapperMap: _wrapperMap,
      isNodeMounted(_0x93e64b) {
        return !!(_0x93e64b && _mountedNodeIds.has(_0x93e64b) && _wrapperMap.get(_0x93e64b)?.isConnected);
      },
      getMountedWrapper(_0x3cba34) {
        if (!_0x3cba34 || !_mountedNodeIds.has(_0x3cba34)) return null;
        const _0xdc4ffd = _wrapperMap.get(_0x3cba34);
        return _0xdc4ffd?.isConnected ? _0xdc4ffd : null;
      },
      getEdgeIdsForNode(_0x15e2c6) {
        if (!_0x15e2c6) return [];
        const _0x582c60 = _nodeToEdgeIds.get(_0x15e2c6);
        return _0x582c60 ? Array.from(_0x582c60) : [];
      },
      markViewportInteractionBusy: _rendererInteractionGrace.markBusy,
      pinNode(_0x2043d9, _0x37f8e4 = 'src/ui/') {
        if (!_0x2043d9) return;
        const _0x3d3b9d = _getNodePinSet(_0x2043d9, true);
        _0x3d3b9d.add(String(_0x37f8e4 || 'src/ui/'));
      },
      unpinNode(_0x44dc77, _0x442b64 = 'src/ui/') {
        if (!_0x44dc77) return;
        const _0x18dc87 = _getNodePinSet(_0x44dc77, false);
        if (!_0x18dc87) return;
        (_0x18dc87.delete(String(_0x442b64 || 'src/ui/')),
          _0x18dc87.size === 0 && _nodePinReasons.delete(_0x44dc77));
      },
    }));
}
function _rebuildEdgeIndex(_0x2c906e) {
  (_nodeToEdgeIds.clear(), _incomingEdgeIdsByTarget.clear());
  for (const _0x484a72 of Object.values(_0x2c906e || {})) {
    if (!_0x484a72) continue;
    const _0x2f93b1 = _0x484a72.sourceId,
      _0x5f11a4 = _0x484a72.targetId;
    if (_0x2f93b1) {
      let _0xfaa17 = _nodeToEdgeIds.get(_0x2f93b1);
      (!_0xfaa17 && ((_0xfaa17 = new Set()), _nodeToEdgeIds.set(_0x2f93b1, _0xfaa17)),
        _0xfaa17.add(_0x484a72.id));
    }
    if (_0x5f11a4) {
      let _0x574e62 = _nodeToEdgeIds.get(_0x5f11a4);
      !_0x574e62 && ((_0x574e62 = new Set()), _nodeToEdgeIds.set(_0x5f11a4, _0x574e62));
      _0x574e62.add(_0x484a72.id);
      let _0x298c85 = _incomingEdgeIdsByTarget.get(_0x5f11a4);
      (!_0x298c85 && ((_0x298c85 = []), _incomingEdgeIdsByTarget.set(_0x5f11a4, _0x298c85)),
        _0x298c85.push(_0x484a72.id));
    }
  }
}
function _ensureEdgeIndex(_0x5a47a4, _0x46ff48) {
  const _0x275c7d = typeof _0x46ff48 === 'number' ? _0x46ff48 : 0;
  if (_0x275c7d === _edgeIndexRev) return;
  (_rebuildEdgeIndex(_0x5a47a4), (_edgeIndexRev = _0x275c7d));
}
function _getEdgeEntries(_0x3aabff, _0x1ba81e) {
  const _0x41d18b = typeof _0x1ba81e === 'number',
    _0x2dbc15 = _0x41d18b ? _0x1ba81e : 0,
    _0xdbaf2f = _0x41d18b
      ? _0x2dbc15 === _edgeEntriesRev
      : _0x2dbc15 === _edgeEntriesRev && _0x3aabff === _edgeEntriesSource;
  if (_0xdbaf2f) return _edgeEntriesCache;
  return (
    (_edgeEntriesCache = Object.values(_0x3aabff || {})),
    (_edgeEntriesRev = _0x2dbc15),
    (_edgeEntriesSource = _0x3aabff || null),
    _edgeEntriesCache
  );
}
function _buildSelectionRelatedSets(_0xe2985f, _0x4a9b27) {
  const _0x5c1e91 = _0xe2985f instanceof Set ? _0xe2985f : new Set(Array.isArray(_0xe2985f) ? _0xe2985f : []),
    _0xdfb18f = new Set(),
    _0x3bd824 = new Set();
  if (_0x5c1e91.size === 0) return { relatedNodeIds: _0xdfb18f, relatedEdgeIds: _0x3bd824 };
  for (const _0x107d67 of _0x5c1e91) {
    const _0x4de6d5 = _nodeToEdgeIds.get(_0x107d67);
    if (!_0x4de6d5) continue;
    for (const _0x525235 of _0x4de6d5) {
      if (!_0x525235 || _0x3bd824.has(_0x525235)) continue;
      const _0x4c9589 = _0x4a9b27?.[_0x525235];
      if (!_0x4c9589?.id) continue;
      const _0x3c38e8 = _0x4c9589.sourceId,
        _0xce8e08 = _0x4c9589.targetId,
        _0x1da90c = _0x5c1e91.has(_0x3c38e8),
        _0x5f321b = _0x5c1e91.has(_0xce8e08);
      if (!_0x1da90c && !_0x5f321b) continue;
      _0x3bd824.add(_0x4c9589.id);
      if (_0x3c38e8 && !_0x1da90c) _0xdfb18f.add(_0x3c38e8);
      if (_0xce8e08 && !_0x5f321b) _0xdfb18f.add(_0xce8e08);
    }
  }
  return { relatedNodeIds: _0xdfb18f, relatedEdgeIds: _0x3bd824 };
}
function _normalizeSelectionRelatedHighlightColor(_0x391acf) {
  const _0x5a9be9 = String(_0x391acf || '').trim();
  return SELECTION_RELATED_HIGHLIGHT_COLORS.includes(_0x5a9be9) ? _0x5a9be9 : 'white';
}
function _syncContainerSizeCache(_0x46a905 = _containerSizeSourceEl) {
  const _0x2a605c = _0x46a905 || _containerSizeSourceEl || null,
    _0x665ec9 = _0x2a605c ? Number(_0x2a605c.clientWidth) : Number(window.innerWidth),
    _0x5ea22f = _0x2a605c ? Number(_0x2a605c.clientHeight) : Number(window.innerHeight);
  return (
    (_cachedContainerWidth = Number.isFinite(_0x665ec9) ? _0x665ec9 : Number(window.innerWidth)),
    (_cachedContainerHeight = Number.isFinite(_0x5ea22f) ? _0x5ea22f : Number(window.innerHeight)),
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
function _getCachedContainerSize(_0x4bed07 = _containerSizeSourceEl, _0x174bcb = {}) {
  const _0x594966 = _0x4bed07 || _containerSizeSourceEl || null,
    _0x2f1031 = typeof ResizeObserver === 'function' && !!_containerResizeObserver,
    _0x71244e =
      _0x174bcb?.refresh === true ||
      !_hasCachedContainerSize() ||
      !_0x2f1031 ||
      (_0x594966 && _containerSizeSourceEl && _0x594966 !== _containerSizeSourceEl);
  if (_0x71244e) return _syncContainerSizeCache(_0x594966);
  return { width: _cachedContainerWidth, height: _cachedContainerHeight };
}
function _getEdgeContainerSize(_0x5d4fe6) {
  const _0x589c75 = _nowMs(),
    _0x742b94 = _getCachedContainerSize(_0x5d4fe6 || _containerSizeSourceEl),
    _0x4fac22 = _nowMs();
  return {
    containerW: Number.isFinite(_0x742b94.width) ? _0x742b94.width : 0,
    containerH: Number.isFinite(_0x742b94.height) ? _0x742b94.height : 0,
    layoutReadMs: Math.max(0, _0x4fac22 - _0x589c75),
  };
}
function _invalidateFullEdgeRenderSignature({ clearedDom: clearedDom = false } = {}) {
  ((_lastFullEdgeRenderSignature = ''), clearedDom && (_edgeDomClearedSinceLastFull = true));
}
function _syncEdgeHighlightClass(_0x175534, _0x5c019f, _0xfd0e66) {
  if (!_0x175534?.groupEl?.classList || !_0x5c019f) return;
  const _0x3eaa0d = !!_0xfd0e66?.has?.(_0x5c019f);
  if (_0x175534.highlighted === _0x3eaa0d) return;
  (_0x3eaa0d
    ? _0x175534.groupEl.classList.add('connection-highlighted')
    : _0x175534.groupEl.classList.remove('connection-highlighted'),
    (_0x175534.highlighted = _0x3eaa0d));
}
function _formatEdgeSignatureNumber(_0xdb7d50) {
  const _0xef4fd = Number(_0xdb7d50);
  return Number.isFinite(_0xef4fd) ? _0xef4fd.toFixed(1) : '0.0';
}
function _appendSortedSetSignature(_0x18a181, _0x3c2a66, _0x328939) {
  if (!(_0x328939 instanceof Set) || _0x328939.size === 0) {
    _0x18a181.push(_0x3c2a66 + ':');
    return;
  }
  _0x18a181.push(_0x3c2a66 + ':' + Array.from(_0x328939).sort().join(','));
}
function _buildFullEdgeRenderSignature({
  edgeEntries: _0x415d62,
  nodes: _0xc97fb,
  viewport: _0xb8dad7,
  dragOffsetCtx: _0x4d73d0,
  relatedEdgeIds: _0x2ae469,
  containerW: _0x383076,
  containerH: _0xb0d914,
}) {
  const _0xb8fcaa = _0xb8dad7 || { x: 0, y: 0, zoom: 1 },
    _0x59935a = _0x4d73d0?.movedNodeIds instanceof Set ? _0x4d73d0.movedNodeIds : null,
    _0x363433 = Number.isFinite(_0x4d73d0?.dx) ? _0x4d73d0.dx : 0,
    _0x565776 = Number.isFinite(_0x4d73d0?.dy) ? _0x4d73d0.dy : 0,
    _0x573401 = [
      'edge-full',
      'vp:' +
        _formatEdgeSignatureNumber(_0xb8fcaa.x) +
        ':' +
        _formatEdgeSignatureNumber(_0xb8fcaa.y) +
        ':' +
        _formatEdgeSignatureNumber(_0xb8fcaa.zoom || 1),
      'box:' + _formatEdgeSignatureNumber(_0x383076) + ':' + _formatEdgeSignatureNumber(_0xb0d914),
      'drag:' + _formatEdgeSignatureNumber(_0x363433) + ':' + _formatEdgeSignatureNumber(_0x565776),
    ];
  (_appendSortedSetSignature(_0x573401, 'dragIds', _0x59935a),
    _appendSortedSetSignature(_0x573401, 'highlight', _0x2ae469));
  for (const _0x5de1f8 of _0x415d62 || []) {
    if (!_0x5de1f8?.id) continue;
    const _0x4d7e22 = _0xc97fb?.[_0x5de1f8.sourceId],
      _0x837d80 = _0xc97fb?.[_0x5de1f8.targetId];
    if (!_0x4d7e22 || !_0x837d80) {
      _0x573401.push(
        'e:' +
          _0x5de1f8.id +
          ':' +
          (_0x5de1f8.sourceId || '') +
          ':' +
          (_0x5de1f8.targetId || '') +
          ':missing',
      );
      continue;
    }
    const _0x354b5c = _0x59935a && _0x59935a.has(_0x5de1f8.sourceId) ? _0x363433 : 0,
      _0x303f37 = _0x59935a && _0x59935a.has(_0x5de1f8.sourceId) ? _0x565776 : 0,
      _0x2dbad1 = _0x59935a && _0x59935a.has(_0x5de1f8.targetId) ? _0x363433 : 0,
      _0x4c7e41 = _0x59935a && _0x59935a.has(_0x5de1f8.targetId) ? _0x565776 : 0,
      _0x13140 = Number(_0x4d7e22.x || 0) + _0x354b5c,
      _0x518ffc = Number(_0x4d7e22.y || 0) + _0x303f37,
      _0x23ce64 = Number(_0x837d80.x || 0) + _0x2dbad1,
      _0x575e78 = Number(_0x837d80.y || 0) + _0x4c7e41,
      _0x3e6121 = _0x13140 + Number(_0x4d7e22.width ?? 0),
      _0x461787 = _0x518ffc + Number(_0x4d7e22.height ?? 0) / 2,
      _0x549c34 = _0x23ce64,
      _0x4cea0e = _0x575e78 + Number(_0x837d80.height ?? 0) / 2;
    _0x573401.push(
      'e:' +
        _0x5de1f8.id +
        ':' +
        (_0x5de1f8.sourceId || '') +
        ':' +
        (_0x5de1f8.targetId || '') +
        ':' +
        _formatEdgeSignatureNumber(_0x3e6121) +
        ':' +
        _formatEdgeSignatureNumber(_0x461787) +
        ':' +
        _formatEdgeSignatureNumber(_0x549c34) +
        ':' +
        _formatEdgeSignatureNumber(_0x4cea0e),
    );
  }
  return _0x573401.join('|');
}
function _normalizeSignaturePart(_0xb9ad11) {
  if (_0xb9ad11 === null || _0xb9ad11 === undefined) return null;
  if (typeof _0xb9ad11 === 'number') return Number.isFinite(_0xb9ad11) ? _0xb9ad11 : null;
  if (typeof _0xb9ad11 === 'boolean') return _0xb9ad11;
  if (typeof _0xb9ad11 === 'string') return _0xb9ad11;
  if (Array.isArray(_0xb9ad11)) return _0xb9ad11.map((_0x5ca158) => _normalizeSignaturePart(_0x5ca158));
  if (typeof _0xb9ad11 === 'object') {
    const _0x5482b6 = {};
    for (const _0x5e5d2c of Object.keys(_0xb9ad11).sort()) {
      _0x5482b6[_0x5e5d2c] = _normalizeSignaturePart(_0xb9ad11[_0x5e5d2c]);
    }
    return _0x5482b6;
  }
  return String(_0xb9ad11);
}
function _buildVirtualizationCandidateSignature({
  snapshotRev: _0x3014e3,
  nodeCount: _0x5eeced,
  viewport: _0x404d19,
  selectedNodeIds: _0x8259ac,
  connOverlay: _0xfe0f47,
  pickConnectMode: _0x415c6a,
  dragContext: _0x58ef55,
  pinnedNodeIds: _0x1bca05,
  containerW: _0x1b8d65,
  containerH: _0x3f7353,
} = {}) {
  const _0x1f5351 = Array.from(
      _0x8259ac instanceof Set ? _0x8259ac : Array.isArray(_0x8259ac) ? _0x8259ac : [],
    )
      .map((_0x33902a) => String(_0x33902a))
      .sort(),
    _0x2e4a7f = Array.from(_0x1bca05 instanceof Set ? _0x1bca05 : Array.isArray(_0x1bca05) ? _0x1bca05 : [])
      .map((_0x3386f4) => String(_0x3386f4))
      .sort();
  return JSON.stringify(
    _normalizeSignaturePart({
      snapshotRev: _0x3014e3,
      nodeCount: _0x5eeced,
      viewport: {
        x: Number.isFinite(_0x404d19?.x) ? _0x404d19.x : 0,
        y: Number.isFinite(_0x404d19?.y) ? _0x404d19.y : 0,
        zoom: Number.isFinite(_0x404d19?.zoom) ? _0x404d19.zoom : 1,
      },
      selectedNodeIds: _0x1f5351,
      connOverlay: { srcId: _0xfe0f47?.srcId ?? null, hoverId: _0xfe0f47?.hoverId ?? null },
      pickConnectMode: {
        active: !!_0x415c6a?.active,
        sourceNodeId: _0x415c6a?.sourceNodeId ?? null,
        hoverNodeId: _0x415c6a?.hoverNodeId ?? null,
        handleDirection: _0x415c6a?.handleDirection ?? null,
      },
      dragContext: {
        isDragging: !!_0x58ef55?.isDragging,
        targetNodeId: _0x58ef55?.targetNodeId ?? null,
        pendingDx: Number.isFinite(_0x58ef55?.pendingDx) ? _0x58ef55.pendingDx : 0,
        pendingDy: Number.isFinite(_0x58ef55?.pendingDy) ? _0x58ef55.pendingDy : 0,
      },
      pinnedNodeIds: _0x2e4a7f,
      containerW: Number.isFinite(_0x1b8d65) ? _0x1b8d65 : 0,
      containerH: Number.isFinite(_0x3f7353) ? _0x3f7353 : 0,
    }),
  );
}
export function buildRendererVirtualizationSignature(_0x14d920 = {}) {
  return _buildVirtualizationCandidateSignature(_0x14d920);
}
function _notifyVirtualizationProbe(_0x5eff6e) {
  const _0x354fca = typeof window !== 'undefined' ? window.__rendererVirtualizationProbe : null;
  if (!_0x354fca || typeof _0x354fca.onCandidateSignatureEvaluated !== 'function') return;
  try {
    _0x354fca.onCandidateSignatureEvaluated(_0x5eff6e);
  } catch {}
}
function _collectMovedNodeIds(_0x5afbd4, _0x53758e) {
  const _0x204f46 = new Set(_0x5afbd4.selectedNodeIds || []),
    _0x11ff25 = _0x53758e?.targetNodeId || null;
  if (_0x11ff25) _0x204f46.add(_0x11ff25);
  const _0x521738 = _0x5afbd4._parentToChildren || {},
    _0x2189ca = Array.from(_0x204f46);
  for (let _0x514522 = 0; _0x514522 < _0x2189ca.length; _0x514522++) {
    const _0xbbddc6 = _0x2189ca[_0x514522],
      _0x11e1f1 = _0x521738[_0xbbddc6];
    if (!_0x11e1f1 || _0x11e1f1.size === 0) continue;
    for (const _0xc0bbb5 of _0x11e1f1) {
      !_0x204f46.has(_0xc0bbb5) && (_0x204f46.add(_0xc0bbb5), _0x2189ca.push(_0xc0bbb5));
    }
  }
  return _0x204f46;
}
function _resolveDragRenderOffset(_0x534fa5, _0xc11dae) {
  if (!_0xc11dae?.isDragging) return null;
  const _0x3fe7c6 = _collectMovedNodeIds(_0x534fa5, _0xc11dae);
  if (!_0x3fe7c6 || _0x3fe7c6.size === 0) return null;
  return {
    movedNodeIds: _0x3fe7c6,
    dx: Number.isFinite(_0xc11dae.pendingDx) ? _0xc11dae.pendingDx : 0,
    dy: Number.isFinite(_0xc11dae.pendingDy) ? _0xc11dae.pendingDy : 0,
  };
}
function _v2FormatNodeLabelText(_0x507628) {
  const _0x5bc28e = String(_0x507628 || '').trim();
  if (!_0x5bc28e) return '';
  const _0x290106 = /^[\x00-\x7F]*$/.test(_0x5bc28e);
  if (_0x290106 && _0x5bc28e.length > 20) return _0x5bc28e.slice(0, 20) + '...';
  return _0x5bc28e;
}
function _v2GetNodeLabelKind(_0x46838c) {
  const _0x266292 = getRefKindByNodeType(_0x46838c);
  if (_0x266292 === 'text' || _0x266292 === 'image' || _0x266292 === 'video' || _0x266292 === 'audio')
    return _0x266292;
  return '';
}
function _v2ClearNodeLabelTooltip(_0x465565) {
  if (!_0x465565) return;
  const _0x3af031 = (_0x255048, _0x31492d = '') => {
    if (typeof _0x465565.removeAttribute === 'function') _0x465565.removeAttribute(_0x255048);
    else
      _0x465565.attributes &&
        typeof _0x465565.attributes.delete === 'function' &&
        _0x465565.attributes.delete(_0x255048);
    _0x31492d && _0x465565.dataset && _0x31492d in _0x465565.dataset && delete _0x465565.dataset[_0x31492d];
  };
  _0x3af031('title');
  if ('title' in _0x465565) _0x465565.title = '';
  (_0x3af031('data-tooltip', 'tooltip'),
    _0x3af031('data-tooltip-right', 'tooltipRight'),
    _0x3af031('data-tooltip-source', 'tooltipSource'),
    _0x3af031('data-native-title', 'nativeTitle'));
}
function _v2SetNodeLabelContent(
  _0x5dc255,
  {
    labelKind: _0x39ff1b,
    displayLabelText: _0x2aa4ab,
    defaultName: _0x2a324d,
    isBeta: _0x5785de,
    fullLabelText: _0x55afe8,
  },
) {
  if (!_0x5dc255) return;
  _v2ClearNodeLabelTooltip(_0x5dc255);
  const _0x2ea164 = [];
  if (_0x39ff1b) {
    const _0x572d89 = document.createElement('span');
    ((_0x572d89.className = 'node-label-icon'),
      _0x572d89.setAttribute('aria-hidden', 'true'),
      (_0x572d89.dataset.labelKind = _0x39ff1b),
      (_0x572d89.textContent = _0x39ff1b === 'text' ? 'T' : ''),
      _0x2ea164.push(_0x572d89));
  }
  const _0xe2ee96 = document.createElement('span');
  ((_0xe2ee96.className = 'node-label-text'),
    (_0xe2ee96.textContent = _0x2aa4ab || _0x2a324d),
    _0x2ea164.push(_0xe2ee96));
  if (_0x5785de) {
    const _0x1eb5fb = document.createElement('span');
    ((_0x1eb5fb.className = 'v2-node-beta-pill'),
      (_0x1eb5fb.textContent = 'Beta'),
      _0x2ea164.push(_0x1eb5fb),
      (_0x5dc255.dataset.betaLabel = _0x55afe8));
  } else {
    if ('betaLabel' in _0x5dc255.dataset) delete _0x5dc255.dataset.betaLabel;
  }
  _0x5dc255.replaceChildren(..._0x2ea164);
}
function _v2EscapeHtml(_0x24f615) {
  return String(_0x24f615 || '').replace(/[&<>"']/g, (_0x4516b0) => {
    if (_0x4516b0 === '&') return '&amp;';
    if (_0x4516b0 === '<') return '&lt;';
    if (_0x4516b0 === '>') return '&gt;';
    if (_0x4516b0 === '"') return '&quot;';
    return '&#39;';
  });
}
function _getDreaminaTimerPhaseTitle(_0x2d5045) {
  if (!_0x2d5045 || !isNodeType(_0x2d5045, 'ai-video')) return '';
  const _0x1e1b34 =
    resolveModelProvider(_0x2d5045.model, _0x2d5045.provider, { allowPrefixInference: false }) === 'dreamina';
  if (!_0x1e1b34) return '';
  const _0x1a89d8 = String(_0x2d5045.dreaminaTaskPhase || '')
      .trim()
      .toLowerCase(),
    _0x263bfe = String(_0x2d5045.dreaminaTaskStatus || '')
      .trim()
      .toLowerCase();
  if (_0x1a89d8 === 'failed' || _0x263bfe === 'failed') return t('coreUi.renderer.dreaminaPhase.failed');
  if (_0x1a89d8 === 'syncing') return t('coreUi.renderer.dreaminaPhase.syncing');
  if (_0x1a89d8 === 'queued') return t('coreUi.renderer.dreaminaPhase.queued');
  if (_0x1a89d8 === 'generating') return t('coreUi.renderer.dreaminaPhase.generating');
  if (_0x1a89d8 === 'done') return t('coreUi.renderer.dreaminaPhase.done');
  const _0x57da88 = String(_0x2d5045.dreaminaTaskLabel || '').trim();
  return _0x57da88 || '';
}
function _formatNodeTimerText(_0x4b5436, _0x27ced3) {
  const _0x386687 = Math.max(0, Number(_0x27ced3) || 0),
    _0x363186 = Math.floor(_0x386687 / 0x3e8),
    _0x479989 = Math.floor((_0x386687 % 0x3e8) / 100),
    _0x4b22d2 = _0x363186 + '.' + _0x479989 + 's',
    _0x4f026c = _getDreaminaTimerPhaseTitle(_0x4b5436);
  return _0x4f026c ? _0x4f026c + ' · ' + _0x4b22d2 : _0x4b22d2;
}
export function formatVideoMetaText({
  fps: _0x2ea08c,
  frames: _0x34d53e,
  width: _0x1819ba,
  height: _0x4196db,
} = {}) {
  const _0x52fccf = Number(_0x2ea08c),
    _0x20a690 = Number(_0x34d53e);
  if (!Number.isFinite(_0x52fccf) || _0x52fccf <= 0 || !Number.isFinite(_0x20a690) || _0x20a690 <= 0)
    return '';
  const _0x1f3a5c =
      Math.abs(_0x52fccf - Math.round(_0x52fccf)) < 0.01
        ? String(Math.round(_0x52fccf))
        : String(Number(_0x52fccf.toFixed(2))),
    _0x2db588 = Number(_0x1819ba),
    _0x4c785d = Number(_0x4196db),
    _0x56a856 = Number.isFinite(_0x2db588) && _0x2db588 > 0 && Number.isFinite(_0x4c785d) && _0x4c785d > 0,
    _0x48021c = t('coreUi.renderer.videoMeta.framesFps', { frames: Math.round(_0x20a690), fps: _0x1f3a5c });
  if (!_0x56a856) return _0x48021c;
  return Math.round(_0x2db588) + '×' + Math.round(_0x4c785d) + ' · ' + _0x48021c;
}
function _getGroupColorWithOpacity(_0x2750f8, _0x1081c8) {
  const _0x393a9f = _0x2750f8.match(/var\(--([^)]+)\)/);
  if (!_0x393a9f) return _0x2750f8;
  const _0x56c2d2 = _0x393a9f[1];
  return 'var(--' + _0x56c2d2 + '-' + _0x1081c8 + ')';
}
export function clearRendererCache() {
  _rendererMediaRuntimePreparer.clear();
  console.log('[Renderer] 执行全盘物理清盘...');
  const _0x86851f = new Set([
    ..._componentMap.keys(),
    ..._wrapperMap.keys(),
    ..._parkedWrapperMap.keys(),
    ..._mountedNodeIds,
    ..._parkedNodeIds,
  ]);
  for (const _0x58be1a of _0x86851f) {
    _destroyNode(_0x58be1a);
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
    _edgeDomCache.clear(),
    _edgeEndpointSignatureCache.clear(),
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
    _nodeDetailHydration.clearNodeDetailHydrationState(),
    _rendererDeferredMedia.clear(),
    _fastPreviewRelease.clear(),
    _fastPreviewLayer.clear(),
    _clearRunningTimerState());
}
((window._edgeDomCache = _edgeDomCache), _syncRendererBridge());
function _isNodeVisible(_0xdb0b39, _0x59b94c, _0x2ea928, _0x4f871d, _0x10366b = 0, _0x22b884 = 0) {
  return isNodeInsideViewportPadding(_0xdb0b39, _0x59b94c, _0x2ea928, _0x4f871d, 200, _0x10366b, _0x22b884);
}
function _renderCullingOnly(_0x5b8536, _0x3d0a46, _0x3d12b6, _0x5eea7a = {}) {
  const _0x292c52 = _0x5eea7a?.hideInvisible !== false,
    { width: _0x5d4fe8, height: _0x2577f5 } = _getCachedContainerSize(_0x5b8536.parentElement || _0x5b8536);
  for (const _0x1fa098 of Object.values(_0x3d0a46 || {})) {
    const _0xba328e = _wrapperMap.get(_0x1fa098.id);
    if (!_0xba328e || !_0xba328e.isConnected) continue;
    const _0x41e24d = _isNodeVisible(_0x1fa098, _0x3d12b6, _0x5d4fe8, _0x2577f5);
    if (!_0x41e24d) {
      if (!_0x292c52) continue;
      _syncRunningTimerForNode(_0x1fa098.id, null, { hide: true });
      if (_0xba328e.style.display !== 'none') _0xba328e.style.display = 'none';
    } else {
      _syncRunningTimerForNode(_0x1fa098.id, _0x1fa098);
      if (_0xba328e.style.display === 'none') _0xba328e.style.display = '';
    }
  }
}
export function initRenderer(_0x290e05, _0x50065c, _0x1df4a5) {
  ((_0x50065c.style.transformOrigin = '0 0'),
    (_0x50065c.style.position = 'absolute'),
    (_0x50065c.style.top = '0'),
    (_0x50065c.style.left = '0'));
  const _0x2e6a9c = _createSvgLayer();
  _0x50065c.prepend(_0x2e6a9c);
  const _0x1f858c = _0x2e6a9c.querySelector('svg');
  ((_containerSizeSourceEl = _0x50065c.parentElement || _0x290e05),
    _syncContainerSizeCache(_containerSizeSourceEl));
  typeof ResizeObserver === 'function' &&
    _containerSizeSourceEl &&
    ((_containerResizeObserver = new ResizeObserver(() => {
      _syncContainerSizeCache(_containerSizeSourceEl);
    })),
    _containerResizeObserver.observe(_containerSizeSourceEl));
  const _0x496ecf = _createPickerEl();
  _0x290e05.appendChild(_0x496ecf);
  const _0x8cf9be = createPickConnectBannerEl();
  _0x290e05.appendChild(_0x8cf9be);
  const _0x2882b3 = _createMultiSelectBoxEl(_0x1df4a5);
  _0x50065c.appendChild(_0x2882b3);
  const _0x21dacb = _createAlignCenterPanelEl();
  _0x50065c.appendChild(_0x21dacb);
  const _0x22f85d = _createSelectionRectEl();
  _0x290e05.appendChild(_0x22f85d);
  const _0xa653f4 = createContextMenuEl();
  (_0x290e05.appendChild(_0xa653f4), _syncRendererBridge());
  const _presentationSubscription = createRendererPresentationSubscription({
    onSnapshot: (_0x58bb73) => {
      _currentSnapshot = _0x58bb73;
    },
    render: (_0x58bb73) => {
      (_syncRunningTimers(_0x58bb73), _0x19f4ce(_0x58bb73));
    },
    onSuspend: () => {
      (_0x4e7d6e(), _rendererMediaRuntimePreparer.pause());
    },
    onResume: () => {
      _rendererMediaRuntimePreparer.resume();
    },
  });
  let _0x4d6a84 = -1,
    _0x749f98 = -1,
    _0x50eeb5 = 0,
    _0x2db68f = null,
    _0xaaf6b3 = null;
  function _0x4e7d6e() {
    (_0x2db68f !== null && (clearTimeout(_0x2db68f), (_0x2db68f = null)),
      _0xaaf6b3 !== null && (cancelAnimationFrame(_0xaaf6b3), (_0xaaf6b3 = null)));
  }
  function _0x58868c(_0x5c3ff2 = RENDERER_VIRTUALIZATION_CONFIG.settleDelayMs) {
    if (!_presentationSubscription.isActive()) return;
    (_0x4e7d6e(),
      (_0x2db68f = setTimeout(
        () => {
          _0x2db68f = null;
          if (_0xaaf6b3 !== null) return;
          _0xaaf6b3 = requestAnimationFrame(() => {
            _0xaaf6b3 = null;
            if (_presentationSubscription.hasPendingFrame()) return;
            if (!_currentSnapshot) return;
            if (_rendererInteractionGrace.isBusy()) {
              _0x58868c(_0x5c3ff2);
              return;
            }
            _0x19f4ce(_currentSnapshot);
          });
        },
        Math.max(0, _0x5c3ff2),
      )));
  }
  const _schedulePreparedMediaRuntimeCommitForRenderer = () => _0x58868c(0);
  _schedulePreparedMediaRuntimeCommit = _schedulePreparedMediaRuntimeCommitForRenderer;
  installNodeResizeGeometryPreviewer(
    typeof window === 'undefined' ? null : window,
    () => _currentSnapshot,
    _ensureEdgeIndex,
    _nodeToEdgeIds,
    (_0x17881d, _0x212aad, _0x535ac4) =>
      _renderEdgesByIds(
        _0x1f858c,
        _0x17881d,
        _0x535ac4.edges || {},
        _0x212aad,
        _0x535ac4.viewport,
        _0x290e05,
      ),
  );
  function _0xf2ac69(_0x2c0ce5) {
    const _0x7a22ce =
        typeof _0x2c0ce5._nodeCount === 'number'
          ? _0x2c0ce5._nodeCount
          : Object.keys(_0x2c0ce5.nodes || {}).length,
      _0x3dddde = typeof _0x2c0ce5._edgesRev === 'number' ? _0x2c0ce5._edgesRev : 0,
      _0x235422 = _0x3dddde !== _0x749f98;
    (_0x7a22ce !== _0x4d6a84 || _0x235422) &&
      ((_0x4d6a84 = _0x7a22ce),
      (_0x749f98 = _0x3dddde),
      _cleanupNodes(_0x50065c, _0x2c0ce5.nodes),
      _cleanupEdges(_0x1f858c, _0x2c0ce5.edges));
    _ensureEdgeIndex(_0x2c0ce5.edges, _0x3dddde);
    const _0x13c2e0 =
        _0x2c0ce5.ui?.selectionRelatedHighlightEnabled === false
          ? { relatedNodeIds: new Set(), relatedEdgeIds: new Set() }
          : _buildSelectionRelatedSets(_0x2c0ce5.selectedNodeIds, _0x2c0ce5.edges),
      _0x43f35b = _normalizeSelectionRelatedHighlightColor(_0x2c0ce5.ui?.selectionRelatedHighlightColor),
      _0x2685db = _rendererInteractionGrace.getRemainingMs(),
      { hasPendingStructuralOps: _0x2a2a80, deferredParkCount: deferredParkCount = 0 } = _renderNodes(
        _0x50065c,
        _0x2c0ce5.nodes,
        _0x2c0ce5.selectedNodeIds,
        _0x13c2e0.relatedNodeIds,
        _0x43f35b,
        _0x2c0ce5.connOverlay,
        _0x2c0ce5.pickConnectMode,
        _0x2c0ce5.viewport,
        _0x2c0ce5.edges,
        _0x2c0ce5._parentToChildren,
        _0x2c0ce5.ui && typeof _0x2c0ce5.ui.showVideoMeta === 'boolean' ? _0x2c0ce5.ui.showVideoMeta : false,
        _0x2c0ce5,
        { deferParking: _0x2685db > 0 },
      ),
      _0x59e95d = _0x2c0ce5.edges || {},
      _0x1ba630 = _getEdgeEntries(_0x59e95d, _0x3dddde),
      _0x4e5a6f = _0x1ba630.length,
      _0x25b848 = document.documentElement,
      _0x16131c = _0x4e5a6f >= 0x190;
    if (_0x16131c)
      !_0x25b848.classList.contains('has-many-edges') && _0x25b848.classList.add('has-many-edges');
    else _0x25b848.classList.contains('has-many-edges') && _0x25b848.classList.remove('has-many-edges');
    const _0x5e2ea0 = getDragContext(),
      _0x48ab70 = _resolveDragRenderOffset(_0x2c0ce5, _0x5e2ea0),
      _0x5a8d94 = _0x2c0ce5.ui?.connectionLinesVisible !== false;
    let _0x520f4c = null;
    function _0x24c487(_0x3c8bf7 = false) {
      !_0x520f4c && (_0x520f4c = _getEdgeContainerSize(_0x290e05));
      const _0x36b56a = _buildFullEdgeRenderSignature({
        edgeEntries: _0x1ba630,
        nodes: _0x2c0ce5.nodes,
        viewport: _0x2c0ce5.viewport,
        dragOffsetCtx: _0x48ab70,
        relatedEdgeIds: _0x13c2e0.relatedEdgeIds,
        containerW: _0x520f4c.containerW,
        containerH: _0x520f4c.containerH,
      });
      if (!_0x3c8bf7 && _0x36b56a === _lastFullEdgeRenderSignature) return null;
      return { containerSize: _0x520f4c, renderSignature: _0x36b56a };
    }
    if (!_0x5a8d94) _clearRenderedEdges(_0x1f858c);
    else {
      if (_0x235422) {
        if (_0x235422) _ensureEdgeIndex(_0x2c0ce5.edges, _0x3dddde);
        const _0x333363 = _0x24c487(true);
        _renderEdges(
          _0x1f858c,
          _0x59e95d,
          _0x2c0ce5.nodes,
          _0x2c0ce5.viewport,
          _0x290e05,
          _0x48ab70,
          _0x13c2e0.relatedEdgeIds,
          _0x1ba630,
          'edges-rev-changed',
          _0x333363,
        );
      } else {
        if (_0x5e2ea0.isDragging) {
          _ensureEdgeIndex(_0x2c0ce5.edges, _0x3dddde);
          const _0x2e7dff = _0x48ab70?.movedNodeIds || _collectMovedNodeIds(_0x2c0ce5, _0x5e2ea0),
            _0x487924 = new Set();
          for (const _0x245de3 of _0x2e7dff) {
            const _0xfc2fb7 = _nodeToEdgeIds.get(_0x245de3);
            if (!_0xfc2fb7) continue;
            for (const _0xcfe92d of _0xfc2fb7) _0x487924.add(_0xcfe92d);
          }
          if (_0x487924.size > 0)
            _renderEdgesByIds(
              _0x1f858c,
              _0x487924,
              _0x59e95d,
              _0x2c0ce5.nodes,
              _0x2c0ce5.viewport,
              _0x290e05,
              _0x48ab70,
              _0x13c2e0.relatedEdgeIds,
              { containerSize: _0x520f4c || null },
            );
          else {
            if (!_0x2e7dff || _0x2e7dff.size === 0) {
              const _0x34ea0c = _0x24c487(false);
              _0x34ea0c &&
                _renderEdges(
                  _0x1f858c,
                  _0x59e95d,
                  _0x2c0ce5.nodes,
                  _0x2c0ce5.viewport,
                  _0x290e05,
                  _0x48ab70,
                  _0x13c2e0.relatedEdgeIds,
                  _0x1ba630,
                  'drag-related-edges-unavailable',
                  _0x34ea0c,
                );
            }
          }
        } else {
          const _0x3b376f = _0x24c487(false);
          _0x3b376f &&
            _renderEdges(
              _0x1f858c,
              _0x59e95d,
              _0x2c0ce5.nodes,
              _0x2c0ce5.viewport,
              _0x290e05,
              _0x48ab70,
              _0x13c2e0.relatedEdgeIds,
              _0x1ba630,
              'steady',
              _0x3b376f,
            );
        }
      }
    }
    (_renderPicker(_0x496ecf, _0x2c0ce5.picker, _0x1df4a5),
      _renderSelectionRect(_0x22f85d, _0x2c0ce5.selectionBox),
      _renderMultiSelectBox(
        _0x2882b3,
        _0x2c0ce5.selectedNodeIds,
        _0x2c0ce5.nodes,
        _0x2c0ce5.viewport,
        _0x2c0ce5.ui?.imageVideoNodeResizeEnabled === true,
      ),
      _renderAlignCenterPanel(_0x21dacb, _0x2c0ce5.selectedNodeIds, _0x2c0ce5.nodes, _0x2c0ce5.ui),
      renderContextMenu(_0xa653f4, _0x2c0ce5.contextMenu),
      renderPickConnectBanner(_0x8cf9be, _0x2c0ce5.pickConnectMode));
    if (_0x2a2a80) _0x58868c(getRendererStructuralReconcileDelayMs(_0x7a22ce));
    else deferredParkCount > 0 && _0x2685db > 0 && _0x58868c(_0x2685db + 16);
  }
  function _0x19f4ce(_0x4ddc65) {
    if (!_presentationSubscription.isActive() || !_0x4ddc65) return;
    const _0x4af397 = isPerfProbeEnabled(),
      _0x510a2c =
        _0x4af397 && typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : 0;
    let _0xe4fe0d = 'steady';
    try {
      const _0x6b61ce = getDragContext(),
        _0x45ab1e = typeof document !== 'undefined' ? document.body?.classList : null,
        _0xf6e30e = !!_0x45ab1e?.contains?.('is-panning'),
        _0x5bd547 = !!_0x45ab1e?.contains?.('is-viewport-animating'),
        _0x1f9623 = !!_0x45ab1e?.contains?.('is-zooming'),
        _0x462f76 =
          typeof _0x4ddc65._nodeCount === 'number'
            ? _0x4ddc65._nodeCount
            : Object.keys(_0x4ddc65.nodes || {}).length,
        _0x283810 = typeof _0x4ddc65._edgesRev === 'number' ? _0x4ddc65._edgesRev : 0,
        _0x41e773 = (_0x6b61ce.isDragging || _0x6b61ce.isDraggingCell) && _0x6b61ce.isCommittingDrag !== true,
        _0x1a12df = _0x41e773 && (_0x462f76 !== _0x4d6a84 || _0x283810 !== _0x749f98),
        _0x22fb80 =
          _0x6b61ce.isPanning || _0x6b61ce.assistPanActive
            ? getViewportPanPreview() || _0x4ddc65.viewport
            : _0x4ddc65.viewport;
      _0x5bd547 ||
      _0x6b61ce.isPanning ||
      _0x6b61ce.assistPanActive ||
      _0xf6e30e ||
      _0x41e773 ||
      _0x1f9623 ||
      _0x1a12df
        ? _rendererMediaRuntimePreparer.pause()
        : _rendererMediaRuntimePreparer.resume();
      _renderViewport(_0x50065c, _0x22fb80, _0x4ddc65.ui?.titleFollowsCanvasZoom === true);
      if (_0x5bd547) {
        (_rendererInteractionGrace.markBusy(), (_0xe4fe0d = 'viewport-animating'));
        if (_0x2e6a9c.style.display === 'none') _0x2e6a9c.style.display = '';
        _0x58868c();
        return;
      }
      if (_0x6b61ce.isPanning || _0x6b61ce.assistPanActive || _0xf6e30e) {
        (_rendererInteractionGrace.markBusy(), (_0xe4fe0d = 'panning'));
        const _0xa4f6ba = performance.now();
        _0xa4f6ba - _0x50eeb5 > 80 &&
          ((_0x50eeb5 = _0xa4f6ba), _renderCullingOnly(_0x50065c, _0x4ddc65.nodes, _0x22fb80));
        if (_0x2e6a9c.style.display === 'none') _0x2e6a9c.style.display = '';
        _0x58868c();
        return;
      }
      if (_0x41e773 && !_0x1a12df) {
        (_rendererInteractionGrace.markBusy(), (_0xe4fe0d = 'dragging'));
        if (_0x2e6a9c.style.display === 'none') _0x2e6a9c.style.display = '';
        _0x58868c();
        return;
      }
      if (_0x1f9623) {
        (_rendererInteractionGrace.markBusy(), (_0xe4fe0d = 'zooming'));
        if (_0x2e6a9c.style.display === 'none') _0x2e6a9c.style.display = '';
        _0x58868c();
        return;
      }
      _0x1a12df
        ? (_rendererInteractionGrace.markBusy(), (_0xe4fe0d = 'dragging-structural'))
        : (_0x4e7d6e(), _rendererInteractionGrace.markIdle());
      if (_0x2e6a9c.style.display === 'none') _0x2e6a9c.style.display = '';
      (_0xf2ac69(_0x4ddc65),
        !_0x1a12df && (_nodeDetailHydration.resumeNodeDetailHydration(), _rendererDeferredMedia.resume()));
    } finally {
      if (_0x4af397 && typeof performance !== 'undefined' && typeof performance.now === 'function') {
        const _0x2c6c2a =
          typeof _0x4ddc65._nodeCount === 'number'
            ? _0x4ddc65._nodeCount
            : Object.keys(_0x4ddc65.nodes || {}).length;
        recordRenderFrameSample({
          mode: _0xe4fe0d,
          durationMs: performance.now() - _0x510a2c,
          nodeCount: _0x2c6c2a,
          edgeCount: Object.keys(_0x4ddc65.edges || {}).length,
          mountedNodeCount: _mountedNodeIds.size,
          parkedNodeCount: _parkedNodeIds.size,
          ..._fastPreviewLayer.getStats(),
        });
      }
    }
  }
  function _0x40c520(_0x590417) {
    if (!_0x590417) return false;
    const _0x5df59e = _currentSnapshot,
      _0x91f22c = _0x5df59e?.nodes?.[_0x590417];
    if (!_0x91f22c) return false;
    const _0x1471f9 = _componentMap.get(_0x590417),
      _0x4a3aa7 = _wrapperMap.get(_0x590417);
    if (!_0x1471f9 || typeof _0x1471f9.update !== 'function') return false;
    if (!_mountedNodeIds.has(_0x590417) || !_0x4a3aa7?.isConnected) return false;
    const _0x2a7fd3 = new Set(_0x5df59e.selectedNodeIds || []),
      _0x29bf69 = _0x2a7fd3.has(_0x590417),
      _0x326567 = _buildSelectionRelatedSets(_0x2a7fd3, _0x5df59e.edges || {}).relatedNodeIds,
      _0x399d80 = !_0x29bf69 && _0x326567.has(_0x590417),
      _0x5419a7 = _getIncomingEdgeSignature(_0x590417, _0x5df59e.edges || {}, _0x5df59e.nodes || {}),
      _0xe60be9 = syncNodeMediaLodMode(_0x4a3aa7, _0x91f22c, _0x5df59e.viewport),
      _0x44034c = buildRendererNodeSignature({
        node: _0x91f22c,
        inEdgeSig: _0x5419a7,
        pickMode: _0x5df59e.pickConnectMode,
        isSelected: _0x29bf69,
        isSelectionRelated: _0x399d80,
        showVideoMeta: _0x5df59e.ui?.showVideoMeta === true,
        viewport: _0x5df59e.viewport,
        mediaLodMode: _0xe60be9,
      });
    return (
      _pendingNodeDataMap.delete(_0x590417),
      _nodeDataSnapshotMap.set(_0x590417, _0x44034c),
      _0x1471f9.update(_0x91f22c),
      true
    );
  }
  function _0x6ea2e9(_0x17ccf4) {
    const _0x3b1202 = Array.isArray(_0x17ccf4) ? _0x17ccf4 : [_0x17ccf4];
    let _0x374ef6 = false;
    for (const _0x3421b6 of new Set(_0x3b1202.filter(Boolean))) {
      _0x374ef6 = _0x40c520(_0x3421b6) || _0x374ef6;
    }
    return _0x374ef6;
  }
  typeof window !== 'undefined' &&
    ((window.v2Renderer = window.v2Renderer || {}),
    Object.assign(window.v2Renderer, { flushNode: _0x40c520, flushNodes: _0x6ea2e9 }));
  _presentationSubscription.connect(_0x1df4a5);
  const _0x4830cf = () => {
      (_presentationSubscription.dispose(),
        _rendererMediaRuntimePreparer.clear(),
        _schedulePreparedMediaRuntimeCommit === _schedulePreparedMediaRuntimeCommitForRenderer &&
          (_schedulePreparedMediaRuntimeCommit = null),
        _0x4e7d6e(),
        _containerResizeObserver &&
          (_containerResizeObserver.disconnect(), (_containerResizeObserver = null)),
        (_containerResizeHandler = null),
        (_containerSizeSourceEl = null),
        _nodeDetailHydration.clearNodeDetailHydrationState(),
        _clearRunningTimerState(),
        _0x2e6a9c?.remove?.(),
        _0x496ecf?.remove?.(),
        _0x8cf9be?.remove?.(),
        _0x2882b3?.remove?.(),
        _0x21dacb?.remove?.(),
        _0x22f85d?.remove?.(),
        _0xa653f4?.remove?.());
    };
  _0x4830cf.setPresentationActive = _presentationSubscription.setActive;
  return _0x4830cf;
}
function _renderViewport(_0x594e4d, _0x4ddaf8, _0x5d47c5 = false) {
  !_0x594e4d._willChangeSet &&
    ((_0x594e4d.style.willChange = 'transform'), (_0x594e4d._willChangeSet = true));
  const _0x63d76f = '0 0';
  _0x594e4d.style.transformOrigin !== _0x63d76f && (_0x594e4d.style.transformOrigin = _0x63d76f);
  const _0x3a2b0a =
    'translate3d(' + _0x4ddaf8.x + 'px, ' + _0x4ddaf8.y + 'px, 0) scale(' + _0x4ddaf8.zoom + ')';
  (_0x594e4d._lastTransform !== _0x3a2b0a &&
    ((_0x594e4d.style.transform = _0x3a2b0a), (_0x594e4d._lastTransform = _0x3a2b0a)),
    _syncZoomCssVars(_0x4ddaf8.zoom, _0x5d47c5));
}
let _lastZoomInv = null,
  _lastZoomInvRaw = null,
  _lastNodeLabelComp = null,
  _lastNodeLabelCompAt = 0;
function _syncZoomCssVars(_0x591cbb, _0x21e158 = false) {
  const _0xc7c420 = typeof document !== 'undefined' ? document.documentElement : null;
  if (!_0xc7c420) return;
  const _0x223837 = typeof document !== 'undefined' && document && document.body ? document.body : null,
    _0x15e82a =
      typeof performance !== 'undefined' && performance && typeof performance.now === 'function'
        ? performance.now()
        : Date.now(),
    _0x4da970 = 0.2 + 0.05 * 1.8,
    _0x264f7a = typeof _0x591cbb === 'number' && isFinite(_0x591cbb) ? _0x591cbb : 1,
    _0x53d53c = _0x264f7a > 0 ? _0x264f7a : 1,
    _0x1c257e = Math.min(1 / _0x53d53c, 1 / _0x4da970),
    _0x5e85b3 = 1 / _0x53d53c,
    _0x249bbc = _0x264f7a > 0 ? Math.pow(1 / _0x264f7a, 0.35) : 1,
    _0x5e7f0b = _0x21e158 === true ? Math.min(_0x249bbc, 1.6) : 1;
  _lastZoomInv !== _0x1c257e &&
    ((_lastZoomInv = _0x1c257e), _0xc7c420.style.setProperty('--zoom-inv', _0x1c257e));
  _lastZoomInvRaw !== _0x5e85b3 &&
    ((_lastZoomInvRaw = _0x5e85b3), _0xc7c420.style.setProperty('--zoom-inv-raw', _0x5e85b3));
  const _0x3b330d = _0x21e158 === true && !!(_0x223837 && _0x223837.classList.contains('is-zooming'));
  if (_0x3b330d && _0x15e82a - _lastNodeLabelCompAt < 120 && _lastNodeLabelComp !== null) return;
  (_lastNodeLabelComp !== _0x5e7f0b &&
    ((_lastNodeLabelComp = _0x5e7f0b), _0xc7c420.style.setProperty('--node-label-comp', _0x5e7f0b)),
    (_lastNodeLabelCompAt = _0x15e82a));
}
function _buildGroupOutputOrderSignature(_0x587e34, _0xf766e8) {
  const _0x593bb7 = [],
    _0xca312d = Array.isArray(_0x587e34?.groupOutputSourceOrder)
      ? _0x587e34.groupOutputSourceOrder.map((_0x3be72e) => String(_0x3be72e || '').trim()).join('>')
      : '';
  if (_0xca312d) _0x593bb7.push('global:' + _0xca312d);
  const _0xef7200 = String(_0xf766e8 || '').trim(),
    _0x11f6c8 = _0x587e34?.groupOutputSourceOrderByTarget,
    _0x2071fc =
      _0xef7200 &&
      _0x11f6c8 &&
      typeof _0x11f6c8 === 'object' &&
      !Array.isArray(_0x11f6c8) &&
      Array.isArray(_0x11f6c8[_0xef7200])
        ? _0x11f6c8[_0xef7200].map((_0x337d14) => String(_0x337d14 || '').trim()).join('>')
        : '';
  if (_0x2071fc) _0x593bb7.push('target:' + _0x2071fc);
  return _0x593bb7.join('|');
}
function _getIncomingEdgeSignature(_0x191098, _0x482106, _0x4f85db) {
  const _0x225564 = [],
    _0x5818ad = String(_0x4f85db?.[_0x191098]?.parentId || '').trim(),
    _0x45dae7 = [['direct', _0x191098]];
  if (_0x5818ad && isNodeType(_0x4f85db?.[_0x5818ad], 'group'))
    _0x45dae7.push(['shared:' + _0x5818ad, _0x5818ad]);
  for (const [_0x30ad1c, _0x5de252] of _0x45dae7) {
    for (const _0x8d8b26 of _incomingEdgeIdsByTarget.get(_0x5de252) || []) {
      const _0xdf1f60 = _0x482106?.[_0x8d8b26];
      if (!_0xdf1f60 || _0xdf1f60.targetId !== _0x5de252) continue;
      const _0x59e089 = _0x4f85db?.[_0xdf1f60.sourceId],
        _0x462779 = typeof _0x59e089?._bizRev === 'number' ? _0x59e089._bizRev : 0,
        _0x1778a2 = String(_0xdf1f60.refSlot || ''),
        _0x1f66c6 = _buildGroupOutputOrderSignature(_0xdf1f60, _0x191098);
      _0x225564.push(
        _0x30ad1c +
          ':' +
          _0xdf1f60.id +
          ':' +
          _0xdf1f60.sourceId +
          ':' +
          _0x1778a2 +
          ':' +
          _0x462779 +
          ':' +
          buildGroupOutputMembershipSignature(_0x59e089, _0x4f85db) +
          ':' +
          _0x1f66c6,
      );
    }
  }
  return _0x225564.join(',');
}
function isRendererMediaRuntimeInteractionPriority({
  nodeId: _0x2ac779,
  isSelected: _0x1304fc,
  isSelectionRelated: _0x518052,
  dragTargets: _0x20474f,
  connOverlay: _0x1d5f76,
  pickMode: _0x11ee59,
} = {}) {
  if (!_0x2ac779) return false;
  return !!(
    _0x1304fc ||
    _0x518052 ||
    _0x20474f?.has?.(_0x2ac779) ||
    _0x1d5f76?.srcId === _0x2ac779 ||
    _0x1d5f76?.hoverId === _0x2ac779 ||
    _0x11ee59?.sourceNodeId === _0x2ac779 ||
    _0x11ee59?.hoverNodeId === _0x2ac779
  );
}
function _collectExactVisiblePreviewNodeIds(_0x757360) {
  const _0x2f95be = _0x757360?.querySelector?.('.v2-fast-preview-layer');
  if (!_0x2f95be) return new Set();
  const _0x5a6e6a = new Set();
  for (const _0x2896ea of _0x2f95be.children || []) {
    const _0x4d10f5 = String(_0x2896ea?.dataset?.nodeId || '').trim();
    if (_0x4d10f5 && _0x2896ea?.dataset?.hasMedia === '1') _0x5a6e6a.add(_0x4d10f5);
  }
  return _0x5a6e6a;
}
function _registerNodeRuntime(_0x16d9df) {
  if (!_0x16d9df?.nodeId || !_0x16d9df.wrapperEl || !_0x16d9df.instance) return null;
  const _0x47bac9 = document.getElementById(_0x16d9df.nodeId);
  return (
    _0x47bac9 &&
      _0x47bac9 !== _0x16d9df.wrapperEl &&
      !_wrapperMap.has(_0x16d9df.nodeId) &&
      _0x47bac9.remove(),
    _componentMap.set(_0x16d9df.nodeId, _0x16d9df.instance),
    _wrapperMap.set(_0x16d9df.nodeId, _0x16d9df.wrapperEl),
    _nodeTypeSnapshotMap.set(_0x16d9df.nodeId, _0x16d9df.canonicalType),
    _0x16d9df
  );
}
function _createNodeRuntime(_0x5ab9e4, _0x517b31, _0x1764c9, _0x1e0288, _0x143163, _0x30241c = {}) {
  return _registerNodeRuntime(
    prepareRendererNodeRuntime({
      node: _0x5ab9e4,
      selectedNodeSet: _0x517b31,
      selectedNodeRankMap: _0x1764c9,
      dragContext: _0x1e0288,
      dragTargets: _0x143163,
      options: _0x30241c,
    }),
  );
}
function _ensureVideoMetaEl(_0x2109a3, _0x38759a) {
  if (!_0x2109a3.__v2_video_meta_el) {
    const _0x296c63 = document.createElement('div');
    ((_0x296c63.className = 'node-video-meta'),
      (_0x296c63.dataset.nodeId = _0x38759a),
      (_0x296c63.dataset.visible = '0'),
      (_0x296c63.textContent = ''),
      _0x2109a3.appendChild(_0x296c63),
      (_0x2109a3.__v2_video_meta_el = _0x296c63));
  }
}
function _syncMountedNodePresentation({
  wrapperEl: _0x53b86a,
  node: _0x285af9,
  nodeId: _0x47e2c6,
  selectedNodeSet: _0x3ca6e5,
  selectedNodeRankMap: _0x2e2368,
  connOverlay: _0x305df9,
  pickMode: _0x20dca6,
  viewport: _0x5a34cc,
  containerW: _0x1763f5,
  containerH: _0x4e86ad,
  dragContext: _0x4c0cb3,
  dragTargets: _0x1bceab,
  showVideoMeta: _0xe1b01c,
  relatedNodeIds: _0x15461b,
  relatedHighlightColor: _0x7bdab1,
  inEdgeSig: _0xeb515a,
  signature: _0x8f9c6c,
  skipInstanceUpdate: skipInstanceUpdate = false,
}) {
  const _0x1cdb58 = _0x285af9.x + ',' + _0x285af9.y + ',' + _0x285af9.width + ',' + _0x285af9.height,
    _0xe71526 = _0x53b86a._posKey !== _0x1cdb58,
    _0x1f1a12 = _0x4c0cb3?.isDragging && _0x1bceab && _0x1bceab.has(_0x47e2c6),
    _0x5c4dae = _0x1f1a12 ? (Number.isFinite(_0x4c0cb3.pendingDx) ? _0x4c0cb3.pendingDx : 0) : 0,
    _0x207507 = _0x1f1a12 ? (Number.isFinite(_0x4c0cb3.pendingDy) ? _0x4c0cb3.pendingDy : 0) : 0,
    _0x46f8de = _isNodeVisible(_0x285af9, _0x5a34cc, _0x1763f5, _0x4e86ad, _0x5c4dae, _0x207507),
    _0x2daa30 = _componentMap.get(_0x47e2c6);
  (syncNodeMediaLodMode(_0x53b86a, _0x285af9, _0x5a34cc), syncNodeMediaMetricsDataset(_0x53b86a, _0x285af9));
  _0xe71526 &&
    ((_0x53b86a._posKey = _0x1cdb58),
    (!_0x1bceab || !_0x1bceab.has(_0x47e2c6)) &&
      (_0x53b86a.style.transform = 'translate(' + _0x285af9.x + 'px, ' + _0x285af9.y + 'px)'),
    (_0x53b86a.style.width = _0x285af9.width + 'px'),
    (_0x53b86a.style.height = _0x285af9.height + 'px'));
  isNodeType(_0x285af9, ['source-video', 'ai-video']) && _ensureVideoMetaEl(_0x53b86a, _0x47e2c6);
  _0x4c0cb3.isDragging
    ? _0x1bceab &&
      _0x1bceab.has(_0x47e2c6) &&
      (_0x4c0cb3.hasMoved || !_0x4c0cb3.wasSelectedOnDown) &&
      _0x53b86a.classList.add('is-ui-hidden')
    : _0x53b86a.classList.remove('is-ui-hidden');
  if (!_0x46f8de) {
    _0x2daa30 &&
      typeof _0x2daa30.syncSelectionState === 'function' &&
      _0x2daa30.syncSelectionState({ selected: false, singleSelected: false, visible: false });
    _syncRunningTimerForNode(_0x47e2c6, null, { hide: true });
    _0x53b86a.style.display !== 'none' && (_0x53b86a.style.display = 'none');
    _0x2daa30?.update &&
      !skipInstanceUpdate &&
      _0x8f9c6c !== _nodeDataSnapshotMap.get(_0x47e2c6) &&
      (_nodeDataSnapshotMap.set(_0x47e2c6, _0x8f9c6c), _0x2daa30.update(_0x285af9));
    return;
  }
  _0x53b86a.style.display === 'none' && (_0x53b86a.style.display = '');
  const _0x2521ff = _0x3ca6e5.has(_0x47e2c6),
    _0x4b9702 = !_0x2521ff && _0x15461b?.has(_0x47e2c6),
    _0x458801 = _0x53b86a.classList.contains('selected');
  _0x2521ff !== _0x458801 &&
    (_0x2521ff
      ? _0x53b86a.classList.add('selected', 'v2-selected')
      : (_0x53b86a.classList.remove('selected', 'v2-selected'), (_0x53b86a.style.outline = '')));
  if (_0x4b9702) {
    _0x53b86a.classList.add('selection-related');
    const _0x1f4a0e = 'selection-related-color-' + _normalizeSelectionRelatedHighlightColor(_0x7bdab1);
    for (const _0x290f43 of SELECTION_RELATED_HIGHLIGHT_COLORS) {
      const _0x3c47f8 = 'selection-related-color-' + _0x290f43;
      if (_0x3c47f8 !== _0x1f4a0e) _0x53b86a.classList.remove(_0x3c47f8);
    }
    _0x53b86a.classList.add(_0x1f4a0e);
  } else {
    _0x53b86a.classList.remove('selection-related');
    for (const _0xbcbee5 of SELECTION_RELATED_HIGHLIGHT_COLORS) {
      _0x53b86a.classList.remove('selection-related-color-' + _0xbcbee5);
    }
  }
  _nodeDetailHydration.isNodeDetailActive({
    node: _0x285af9,
    nodeId: _0x47e2c6,
    isSelected: _0x2521ff,
    connOverlay: _0x305df9,
    pickMode: _0x20dca6,
    relatedNodeIds: _0x15461b,
  }) && _nodeDetailHydration.hydrateNodeDetails(_0x47e2c6, _0x53b86a);
  _0x2daa30 &&
    typeof _0x2daa30.syncSelectionState === 'function' &&
    _0x2daa30.syncSelectionState({
      selected: _0x2521ff,
      singleSelected: _0x3ca6e5.size === 1,
      visible: true,
    });
  const _0x2a8990 = getRendererNodeZIndex(_0x285af9, _0x2521ff, _0x2e2368?.get?.(_0x47e2c6) ?? -1, {
    isFocused:
      typeof document !== 'undefined' &&
      !!document.activeElement &&
      _0x53b86a.contains(document.activeElement),
  });
  _0x53b86a.style.zIndex !== _0x2a8990 && (_0x53b86a.style.zIndex = _0x2a8990);
  if (isNodeType(_0x285af9, 'group')) {
    const _0x1d3b4a = _0x285af9.color || 'var(--indigo)',
      _0x539dce = _getGroupColorWithOpacity(_0x1d3b4a, '60'),
      _0x2b7cfa = _getGroupColorWithOpacity(_0x1d3b4a, '05');
    (_0x53b86a.style.borderColor !== _0x539dce && (_0x53b86a.style.borderColor = _0x539dce),
      _0x53b86a.style.backgroundColor !== _0x2b7cfa && (_0x53b86a.style.backgroundColor = _0x2b7cfa),
      _0x53b86a.style.getPropertyValue('--current-group-color') !== _0x1d3b4a &&
        _0x53b86a.style.setProperty('--current-group-color', _0x1d3b4a));
  }
  const _0x55e1ab = _0x53b86a.__v2_name_el,
    _0x56f00d = normalizeNodeType(_0x285af9.type),
    _0x2ad267 = _0x55e1ab ? _v2GetNodeLabelKind(_0x56f00d) : '';
  if (_0x55e1ab) {
    if (_0x2ad267) {
      if (_0x55e1ab.dataset.labelKind !== _0x2ad267) _0x55e1ab.dataset.labelKind = _0x2ad267;
    } else 'labelKind' in _0x55e1ab.dataset && delete _0x55e1ab.dataset.labelKind;
  }
  if (_0x55e1ab && _0x55e1ab.contentEditable !== 'true') {
    const _0x512d59 = getRendererDefaultNodeLabel(_0x285af9),
      _0x32876f = hasNodeTypeBetaBadge(_0x56f00d),
      _0x446a52 = _0x285af9.name || _0x512d59,
      _0x2ad032 = _v2FormatNodeLabelText(_0x446a52);
    ((_0x55e1ab.dataset.fullName = _0x446a52),
      (_0x55e1ab.dataset.isBeta = _0x32876f ? '1' : '0'),
      _v2ClearNodeLabelTooltip(_0x55e1ab));
    const _0x2294e3 = _0x55e1ab.querySelector('.node-label-icon'),
      _0x416a07 = _0x55e1ab.querySelector('.node-label-text'),
      _0x22b840 = _0x2ad032 || _0x512d59,
      _0x117f84 = _0x2294e3?.dataset.labelKind || '';
    (_0x117f84 !== _0x2ad267 ||
      _0x416a07?.textContent !== _0x22b840 ||
      (_0x32876f ? _0x55e1ab.dataset.betaLabel !== _0x446a52 : 'betaLabel' in _0x55e1ab.dataset)) &&
      _v2SetNodeLabelContent(_0x55e1ab, {
        labelKind: _0x2ad267,
        displayLabelText: _0x2ad032,
        defaultName: _0x512d59,
        isBeta: _0x32876f,
        fullLabelText: _0x446a52,
      });
  }
  const _0x47ff1c = _0x53b86a.__v2_timer_el;
  if (_0x47ff1c) {
    let _0x2b6769 = '',
      _0x4a5658 = false;
    const _0x1b03df = _isResolvedSourceMediaNode(_0x285af9);
    if (!_0x1b03df && _0x285af9.generationStartTime && _0x285af9.generationDuration == null) {
      const _0x312e4f = Date.now() - _0x285af9.generationStartTime;
      ((_0x2b6769 = _formatNodeTimerText(_0x285af9, _0x312e4f)), (_0x4a5658 = true));
    } else
      !_0x1b03df &&
        typeof _0x285af9.generationDuration === 'number' &&
        ((_0x2b6769 = _formatNodeTimerText(_0x285af9, _0x285af9.generationDuration)), (_0x4a5658 = true));
    _0x4a5658
      ? (_0x47ff1c.textContent !== _0x2b6769 && (_0x47ff1c.textContent = _0x2b6769),
        (_0x47ff1c.style.color = _0x2521ff ? 'var(--text-primary)' : 'var(--white-40)'),
        _0x47ff1c.style.display === 'none' && (_0x47ff1c.style.display = ''))
      : (_0x47ff1c.textContent && (_0x47ff1c.textContent = ''),
        _0x47ff1c.style.display !== 'none' && (_0x47ff1c.style.display = 'none'));
  }
  _syncRunningTimerForNode(_0x47e2c6, _0x285af9);
  const _0x49743a = _0x53b86a.__v2_video_meta_el;
  if (_0x49743a) {
    if (!_0xe1b01c) {
      if (_0x49743a.dataset.visible !== '0') _0x49743a.dataset.visible = '0';
    } else {
      const _0x2f3e46 = Number(_0x285af9.videoFps),
        _0x43c1f8 = Number(_0x285af9.videoFrameCount),
        _0x3ac1d9 = Number(_0x285af9.videoWidth),
        _0x344fdd = Number(_0x285af9.videoHeight),
        _0x4f3a9f =
          Number.isFinite(_0x2f3e46) && _0x2f3e46 > 0 && Number.isFinite(_0x43c1f8) && _0x43c1f8 > 0,
        _0x52b152 = _0x4f3a9f ? '1' : '0';
      _0x49743a.dataset.visible !== _0x52b152 && (_0x49743a.dataset.visible = _0x52b152);
      if (_0x4f3a9f) {
        const _0x12ec03 = formatVideoMetaText({
          fps: _0x2f3e46,
          frames: _0x43c1f8,
          width: _0x3ac1d9,
          height: _0x344fdd,
        });
        _0x49743a.textContent !== _0x12ec03 && (_0x49743a.textContent = _0x12ec03);
      }
    }
  }
  if (_0x2daa30?.update && _0x8f9c6c !== _nodeDataSnapshotMap.get(_0x47e2c6)) {
    _nodeDataSnapshotMap.set(_0x47e2c6, _0x8f9c6c);
    if (!skipInstanceUpdate) _0x2daa30.update(_0x285af9);
  }
  const _0xdd60fd = _0x20dca6 && _0x20dca6.active && _0x47e2c6 === _0x20dca6.sourceNodeId,
    _0x484bb3 = isNodeType(_0x285af9, 'storyboard') && _0x285af9.isEditing;
  if ((_0x305df9 && _0x305df9.srcId) || _0xdd60fd || _0x484bb3) {
    if (_0x47e2c6 === _0x305df9?.srcId || _0xdd60fd || _0x484bb3)
      (_0x53b86a.classList.add('conn-src'), _0x53b86a.classList.remove('conn-invalid'));
    else
      _0x305df9?.invalidNodeIds?.includes(_0x47e2c6)
        ? (_0x53b86a.classList.add('conn-invalid'), _0x53b86a.classList.remove('conn-src'))
        : _0x53b86a.classList.remove('conn-invalid', 'conn-src');
  } else _0x53b86a.classList.remove('conn-invalid', 'conn-src');
  if (_0xdd60fd || _0x484bb3)
    (_0x53b86a.style.setProperty(
      'box-shadow',
      '0 0 0 2px var(--white-70), 0 0 20px 0 var(--white-40)',
      'important',
    ),
      _0x53b86a.style.setProperty('border-radius', '16px', 'important'));
  else
    _0x53b86a.style.getPropertyPriority('box-shadow') === 'important' &&
      (_0x53b86a.style.removeProperty('box-shadow'), _0x53b86a.style.removeProperty('border-radius'));
  const _0x353b53 = _0x20dca6 && _0x20dca6.active && _0x20dca6.hoverNodeId === _0x47e2c6;
  if ((_0x305df9 && _0x305df9.hoverId === _0x47e2c6) || _0x353b53) {
    if (!_0x53b86a.classList.contains('conn-hoverTarget')) {
      _0x53b86a.classList.add('conn-hoverTarget');
      const _0x1b4f65 = window.getComputedStyle(_0x53b86a).borderRadius;
      let _0x454bda = parseFloat(_0x1b4f65);
      if (isNaN(_0x454bda) || _0x454bda <= 0) _0x454bda = 16;
      _0x53b86a.style.setProperty('--hover-br', _0x454bda + 4 + 'px');
    }
    let _0x4cbfe0 = false;
    if (_0x305df9 && _0x305df9.side === 'left') _0x4cbfe0 = true;
    else _0x353b53 && _0x20dca6 && _0x20dca6.handleDirection === 'left' && (_0x4cbfe0 = true);
    _0x4cbfe0
      ? (_0x53b86a.classList.add('conn-hover-output'), _0x53b86a.classList.remove('conn-hover-input'))
      : (_0x53b86a.classList.add('conn-hover-input'), _0x53b86a.classList.remove('conn-hover-output'));
  } else
    _0x53b86a.classList.contains('conn-hoverTarget') &&
      (_0x53b86a.classList.remove('conn-hoverTarget', 'conn-hover-input', 'conn-hover-output'),
      _0x53b86a.style.removeProperty('--hover-br'));
  syncNodeResultClass(_0x53b86a, _0x285af9, isNodeType);
}
function _renderNodes(
  _0x757360,
  _0x4b355d,
  _0x37e07e,
  _0x1677db,
  _0x4f36a4,
  _0x54d2e1,
  _0x28f8b5,
  _0x5b8986,
  _0x3020b0,
  _0xa903ea,
  _0x353034,
  _0x3716f9 = null,
  _0x4730fc = {},
) {
  const _0x18682e = _0x28f8b5,
    _0x676f3a = _0x5b8986 || { x: 0, y: 0, zoom: 1 },
    _0x543c8d = _0x3020b0 || {},
    _0x17c51c = _0xa903ea || {},
    _0x59aa60 = _0x353034 !== false,
    _0x13d938 = _0x4730fc?.deferParking === true,
    _0x4adfff = getDragContext(),
    _0x44e39b = _0x37e07e instanceof Set ? _0x37e07e : new Set(_0x37e07e || []),
    _0x4037dc = buildSelectedNodeRankMap(_0x37e07e),
    _0x5987f3 = buildRendererDragTargetSet({
      dragContext: _0x4adfff,
      selectedNodeSet: _0x44e39b,
      parentToChildren: _0x17c51c,
    }),
    { width: _0x460fc9, height: _0x379dc0 } = _getCachedContainerSize(_0x757360.parentElement || _0x757360),
    _0x3ed32d = Number.isFinite(_0x3716f9?._nodeCount)
      ? _0x3716f9._nodeCount
      : Object.keys(_0x4b355d || {}).length,
    _0x2f4dd1 = Number.isFinite(_0x3716f9?._persistRev) ? _0x3716f9._persistRev : _0x3ed32d,
    _0x55741a = _getPinnedNodeIds(),
    _0x4c23a = getCachedRendererSpatialIndex(_0x4b355d, {
      snapshotRev: _0x2f4dd1,
      nodeCount: _0x3ed32d,
      denseNodeCount: RENDERER_VIRTUALIZATION_CONFIG.denseNodeCount,
    }),
    _0x3a852d = _buildVirtualizationCandidateSignature({
      snapshotRev: _0x2f4dd1,
      nodeCount: _0x3ed32d,
      viewport: _0x676f3a,
      selectedNodeIds: _0x37e07e,
      connOverlay: _0x54d2e1,
      pickConnectMode: _0x18682e,
      dragContext: _0x4adfff,
      pinnedNodeIds: _0x55741a,
      containerW: _0x460fc9,
      containerH: _0x379dc0,
    });
  let _0x47b692 = _lastVirtualCandidateResult;
  const _0x2e247e = _0x3a852d === _lastVirtualCandidateSignature && !!_0x47b692;
  !_0x2e247e &&
    ((_0x47b692 = buildVirtualizationCandidateSets({
      nodes: _0x4b355d,
      spatialIndex: _0x4c23a,
      viewport: _0x676f3a,
      containerWidth: _0x460fc9,
      containerHeight: _0x379dc0,
      selectedNodeIds: _0x37e07e,
      connOverlay: _0x54d2e1,
      pickConnectMode: _0x18682e,
      dragContext: _0x4adfff,
      parentToChildren: _0x17c51c,
      pinnedNodeIds: _0x55741a,
      mountedNodeIds: _mountedNodeIds,
    })),
    (_lastVirtualCandidateSignature = _0x3a852d),
    (_lastVirtualCandidateResult = _0x47b692));
  _notifyVirtualizationProbe({
    signature: _0x3a852d,
    cacheHit: _0x2e247e,
    snapshotRev: _0x2f4dd1,
    containerW: _0x460fc9,
    containerH: _0x379dc0,
    spatialIndex: !!_0x4c23a,
    nodeCount: _0x3ed32d,
    mountCandidateCount: _0x47b692.mountCandidateIds?.size || 0,
    parkCandidateCount: _0x47b692.parkCandidateIds?.size || 0,
    keepAliveCount: _0x47b692.keepAliveNodeIds?.size || 0,
  });
  const { mountCandidateIds: _0x186ec4, parkCandidateIds: _0x41faeb } = _0x47b692,
    _0x50e3ad = collectVirtualizedRenderNodes({
      nodes: _0x4b355d,
      virtualizationResult: _0x47b692,
      spatialIndex: _0x4c23a,
      mountedNodeIds: _mountedNodeIds,
      viewport: _0x676f3a,
      containerWidth: _0x460fc9,
      containerHeight: _0x379dc0,
    }),
    _0x129f6f = createRendererStructuralBudget(),
    exactVisiblePreviewNodeIds = _collectExactVisiblePreviewNodeIds(_0x757360);
  _rendererMediaRuntimePreparer.prune(_0x186ec4);
  const interactionBusy = _rendererInteractionGrace.isBusy();
  let _0x38ea0f = false,
    _0x21ef5e = 0,
    _0x2cc9b8 = null;
  for (const _0x360a17 of _0x50e3ad) {
    if (!_0x360a17?.id) continue;
    const _0x563f60 = _0x360a17.id;
    let _0x540ac2 = _wrapperMap.get(_0x563f60),
      _0x2e4456 = _componentMap.get(_0x563f60),
      _0x52b5ea = false;
    const _0x16f7d5 = normalizeNodeType(_0x360a17.type),
      _0x1d267c = _nodeTypeSnapshotMap.get(_0x563f60);
    _0x540ac2 &&
      _0x2e4456 &&
      _0x1d267c &&
      _0x1d267c !== _0x16f7d5 &&
      (_destroyNode(_0x563f60), (_0x540ac2 = null), (_0x2e4456 = null));
    const _0x9714e9 = _mountedNodeIds.has(_0x563f60) && !!_0x540ac2?.isConnected,
      _0x1aa0a5 = _0x186ec4.has(_0x563f60) || (_0x9714e9 && !_0x41faeb.has(_0x563f60));
    let _0x4664c2 = false;
    if (!_0x1aa0a5) {
      if (_0x540ac2 && _0x2e4456) {
        const _0x2c97e4 = _pendingNodeDataMap.get(_0x563f60);
        (!_0x2c97e4 || _0x2c97e4.node !== _0x360a17) &&
          _pendingNodeDataMap.set(_0x563f60, { node: _0x360a17, signature: null });
      }
      if (_0x9714e9 && _0x41faeb.has(_0x563f60)) {
        if (_0x13d938) {
          _0x21ef5e += 1;
          continue;
        }
        _0x129f6f.hasBudget() ? (_parkNode(_0x563f60), _0x129f6f.consume()) : (_0x38ea0f = true);
      }
      continue;
    }
    const _0x457bb9 = _0x44e39b.has(_0x563f60),
      _0x4a3aea = !_0x457bb9 && _0x1677db?.has?.(_0x563f60);
    if (!_0x2e4456 || !_0x540ac2) {
      if (!_0x129f6f.hasBudget()) {
        _0x38ea0f = true;
        continue;
      }
      _0x52b5ea = _nodeDetailHydration.shouldDeferNodeDetails({
        node: _0x360a17,
        nodeId: _0x563f60,
        isSelected: _0x457bb9,
        connOverlay: _0x54d2e1,
        pickMode: _0x18682e,
        relatedNodeIds: _0x1677db,
        viewport: _0x676f3a,
        mountCandidateCount: _0x186ec4.size,
      });
      const deferMediaOnMount =
          _0x52b5ea ||
          shouldDeferInitialVideoMediaOnMount({
            node: _0x360a17,
            nodeId: _0x563f60,
            isSelected: _0x457bb9,
            isSelectionRelated: _0x4a3aea,
            dragTargets: _0x5987f3,
            nodeCount: _0x3ed32d,
            mountCandidateCount: _0x186ec4.size,
          }),
        runtimeOptions = {
          deferDetailsOnMount: _0x52b5ea,
          deferMediaOnMount,
          eagerVideoPreviewOnMount: false,
        },
        runtimeVariant = [
          _0x52b5ea ? 'details-deferred' : 'details-live',
          deferMediaOnMount ? 'media-deferred' : 'media-live',
          'eager-live',
        ].join('|'),
        hasPreparedRuntime = _rendererMediaRuntimePreparer.hasPrepared(
          _0x563f60,
          _0x360a17,
          runtimeVariant,
        ),
        interactionPriority = isRendererMediaRuntimeInteractionPriority({
          nodeId: _0x563f60,
          isSelected: _0x457bb9,
          isSelectionRelated: _0x4a3aea,
          dragTargets: _0x5987f3,
          connOverlay: _0x54d2e1,
          pickMode: _0x18682e,
        }),
        shouldPrebuildRuntime = shouldPrebuildRendererMediaRuntime({
          node: _0x360a17,
          nodeCount: _0x3ed32d,
          veryDenseNodeCount: RENDERER_VIRTUALIZATION_CONFIG.veryDenseNodeCount,
          hasExactVisiblePreview: exactVisiblePreviewNodeIds.has(_0x563f60),
          interactionBusy,
          interactionPriority,
          deferMediaOnMount,
          viewportPriorityMediaOnly: false,
          idlePreparationSupported: typeof requestIdleCallback === 'function',
        });
      if (!hasPreparedRuntime && shouldPrebuildRuntime) {
        _rendererMediaRuntimePreparer.enqueue({
          nodeId: _0x563f60,
          version: _0x360a17,
          variant: runtimeVariant,
          isValid: () =>
            _currentSnapshot?.nodes?.[_0x563f60] === _0x360a17 && !_componentMap.has(_0x563f60),
          prepare: () =>
            prepareRendererNodeRuntime({
              node: _0x360a17,
              selectedNodeSet: _0x44e39b,
              selectedNodeRankMap: _0x4037dc,
              dragContext: _0x4adfff,
              dragTargets: _0x5987f3,
              options: { ...runtimeOptions, prebuildOffscreen: true },
            }),
          dispose: disposePreparedRendererNodeRuntime,
        });
        continue;
      }
      !hasPreparedRuntime && !shouldPrebuildRuntime && _rendererMediaRuntimePreparer.forget(_0x563f60);
      const preparedRuntime = hasPreparedRuntime
          ? _rendererMediaRuntimePreparer.take(_0x563f60, _0x360a17, runtimeVariant)
          : null,
        registeredRuntime = preparedRuntime
          ? _registerNodeRuntime(preparedRuntime)
          : _createNodeRuntime(
              _0x360a17,
              _0x44e39b,
              _0x4037dc,
              _0x4adfff,
              _0x5987f3,
              runtimeOptions,
            );
      if (!registeredRuntime) {
        preparedRuntime && disposePreparedRendererNodeRuntime(preparedRuntime);
        _0x38ea0f = true;
        continue;
      }
      ({ wrapperEl: _0x540ac2, instance: _0x2e4456 } = registeredRuntime);
      (!_0x2cc9b8 && (_0x2cc9b8 = document.createDocumentFragment()),
        _mountNode(_0x563f60, _0x2cc9b8),
        (_0x4664c2 = true),
        _0x129f6f.consume());
    } else {
      if (!_0x9714e9) {
        if (!_0x129f6f.hasBudget()) {
          _0x38ea0f = true;
          continue;
        }
        (!_0x2cc9b8 && (_0x2cc9b8 = document.createDocumentFragment()),
          _mountNode(_0x563f60, _0x2cc9b8),
          (_0x4664c2 = true),
          _0x129f6f.consume());
      }
    }
    (_0x4664c2 || _0x540ac2?.dataset?.detailStage === 'deferred') &&
      _nodeDetailHydration.syncNodeDetailMountStage({
        wrapperEl: _0x540ac2,
        node: _0x360a17,
        nodeId: _0x563f60,
        isSelected: _0x457bb9,
        connOverlay: _0x54d2e1,
        pickMode: _0x18682e,
        relatedNodeIds: _0x1677db,
        viewport: _0x676f3a,
        mountCandidateCount: _0x186ec4.size,
        autoHydrate: false,
      });
    const _0x1f5e15 = _pendingNodeDataMap.get(_0x563f60),
      _0x7d4a8f = _0x1f5e15?.node || _0x360a17,
      _0x3abed5 = _getIncomingEdgeSignature(_0x563f60, _0x543c8d, _0x4b355d),
      _0x593891 = syncNodeMediaLodMode(_0x540ac2, _0x7d4a8f, _0x676f3a),
      _0x5d2fba = buildRendererNodeSignature({
        node: _0x7d4a8f,
        inEdgeSig: _0x3abed5,
        pickMode: _0x18682e,
        isSelected: _0x457bb9,
        isSelectionRelated: _0x4a3aea,
        showVideoMeta: _0x59aa60,
        viewport: _0x676f3a,
        mediaLodMode: _0x593891,
      });
    (_syncMountedNodePresentation({
      wrapperEl: _0x540ac2,
      node: _0x7d4a8f,
      nodeId: _0x563f60,
      selectedNodeSet: _0x44e39b,
      selectedNodeRankMap: _0x4037dc,
      connOverlay: _0x54d2e1,
      pickMode: _0x18682e,
      viewport: _0x676f3a,
      containerW: _0x460fc9,
      containerH: _0x379dc0,
      dragContext: _0x4adfff,
      dragTargets: _0x5987f3,
      showVideoMeta: _0x59aa60,
      relatedNodeIds: _0x1677db,
      relatedHighlightColor: _0x4f36a4,
      inEdgeSig: _0x3abed5,
      signature: _0x5d2fba,
      skipInstanceUpdate: shouldSkipInitialMediaNodeUpdate(_0x7d4a8f, _0x4664c2),
    }),
      _0x1f5e15 && _pendingNodeDataMap.delete(_0x563f60));
  }
  return (
    _flushMountBatch(_0x757360, _0x2cc9b8),
    _fastPreviewLayer.sync(_0x757360, _0x4b355d, _0x186ec4, _0x44e39b),
    { hasPendingStructuralOps: _0x38ea0f, deferredParkCount: _0x21ef5e }
  );
}
function _cleanupNodes(_0x2ad727, _0x33f0a3) {
  let _0x5cf419 = false;
  const _0x27ee49 = new Set(Object.keys(_0x33f0a3 || {})),
    _0x6d5041 = new Set([
      ..._componentMap.keys(),
      ..._wrapperMap.keys(),
      ..._parkedWrapperMap.keys(),
      ..._mountedNodeIds,
      ..._parkedNodeIds,
    ]);
  for (const _0x1779b4 of _0x6d5041) {
    !_0x27ee49.has(_0x1779b4) && (_destroyNode(_0x1779b4), (_0x5cf419 = true));
  }
  _0x2ad727.querySelectorAll('.v2-node').forEach((_0x4ac960) => {
    const _0x275b36 = _0x4ac960.id || _0x4ac960.dataset.nodeId;
    _0x275b36 && !_0x27ee49.has(_0x275b36) && (_0x4ac960.remove(), (_0x5cf419 = true));
  });
  if (_0x5cf419) {
    const _0xdd3304 = document.getElementById('v2-side-plus-holder');
    _0xdd3304 && _0xdd3304.children.length > 0 && _0xdd3304.replaceChildren();
  }
}
function _createSvgLayer() {
  const _0x555df5 = document.createElement('div');
  ((_0x555df5.id = 'v2-edges-wrapper'),
    (_0x555df5.style.position = 'absolute'),
    (_0x555df5.style.top = '0'),
    (_0x555df5.style.left = '0'),
    (_0x555df5.style.width = '100%'),
    (_0x555df5.style.height = '100%'),
    (_0x555df5.style.pointerEvents = 'none'),
    (_0x555df5.style.zIndex = '5'));
  const _0x546035 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  return (
    (_0x546035.id = 'v2-edges'),
    (_0x546035.style.overflow = 'visible'),
    (_0x546035.style.pointerEvents = 'none'),
    _0x555df5.appendChild(_0x546035),
    _0x555df5
  );
}
function _renderEdgesByIds(
  _0x312e87,
  _0x28b02b,
  _0x202f86,
  _0x40956d,
  _0x3df112,
  _0xc99a03,
  _0x5cb7c4 = null,
  _0x4d8540 = null,
  _0x44b1fb = {},
) {
  const _0x592d68 = _nowMs(),
    _0x6f7082 = _0x3df112 || { x: 0, y: 0, zoom: 1 },
    _0x3506bc = _0x44b1fb?.containerSize || _getEdgeContainerSize(_0xc99a03),
    _0x585199 = _0x3506bc.containerW,
    _0x3dd2b5 = _0x3506bc.containerH,
    _0x40011e = _nowMs(),
    _0x4268bb = 200,
    _0x57620d = _0x5cb7c4?.movedNodeIds instanceof Set ? _0x5cb7c4.movedNodeIds : null,
    _0x49b04e = Number.isFinite(_0x5cb7c4?.dx) ? _0x5cb7c4.dx : 0,
    _0xaf30f4 = Number.isFinite(_0x5cb7c4?.dy) ? _0x5cb7c4.dy : 0;
  function _0x14692f(_0x59d2b3, _0x32209c, _0x151ec7, _0x1f2ea4) {
    const { x: _0x454435, y: _0x3da06c, zoom: _0x13ff95 } = _0x6f7082,
      _0x48fe7a = _0x59d2b3 * _0x13ff95 + _0x454435,
      _0x2c1046 = _0x32209c * _0x13ff95 + _0x3da06c,
      _0x43e9d5 = _0x151ec7 * _0x13ff95 + _0x454435,
      _0x15be8d = _0x1f2ea4 * _0x13ff95 + _0x3da06c,
      _0x2b3799 = Math.min(_0x48fe7a, _0x43e9d5),
      _0x512433 = Math.min(_0x2c1046, _0x15be8d),
      _0x55054e = Math.max(_0x48fe7a, _0x43e9d5),
      _0x41830e = Math.max(_0x2c1046, _0x15be8d);
    return (
      _0x55054e > -_0x4268bb &&
      _0x2b3799 < _0x585199 + _0x4268bb &&
      _0x41830e > -_0x4268bb &&
      _0x512433 < _0x3dd2b5 + _0x4268bb
    );
  }
  const _0x2d7f17 = [];
  let _0x7546be = 0,
    _0x22e80c = 0,
    _0x38d6e7 = 0,
    _0x39aecb = 0,
    _0x357e02 = 0;
  for (const _0x1e02a6 of _0x28b02b) {
    const _0x49ed52 = _0x202f86[_0x1e02a6];
    if (!_0x49ed52) continue;
    const _0x2dd423 = _0x40956d[_0x49ed52.sourceId],
      _0x46a386 = _0x40956d[_0x49ed52.targetId];
    if (!_0x2dd423 || !_0x46a386) continue;
    const _0x36f0d3 = _0x57620d && _0x57620d.has(_0x49ed52.sourceId) ? _0x49b04e : 0,
      _0x54b026 = _0x57620d && _0x57620d.has(_0x49ed52.sourceId) ? _0xaf30f4 : 0,
      _0x56b9de = _0x57620d && _0x57620d.has(_0x49ed52.targetId) ? _0x49b04e : 0,
      _0x2489b0 = _0x57620d && _0x57620d.has(_0x49ed52.targetId) ? _0xaf30f4 : 0,
      _0x4a7a99 = _0x2dd423.x + _0x36f0d3,
      _0x328040 = _0x2dd423.y + _0x54b026,
      _0x4fdda6 = _0x46a386.x + _0x56b9de,
      _0x41f48c = _0x46a386.y + _0x2489b0,
      _0x139eaf = _0x4a7a99 + (_0x2dd423.width ?? 0),
      _0x20e46f = _0x328040 + (_0x2dd423.height ?? 0) / 2,
      _0x229c2b = _0x4fdda6,
      _0x5b1192 = _0x41f48c + (_0x46a386.height ?? 0) / 2,
      _0x128ee0 = _0x14692f(_0x139eaf, _0x20e46f, _0x229c2b, _0x5b1192),
      _0x424e5c =
        _0x139eaf.toFixed(1) +
        ',' +
        _0x20e46f.toFixed(1) +
        ',' +
        _0x229c2b.toFixed(1) +
        ',' +
        _0x5b1192.toFixed(1),
      _0x416452 = _edgeEndpointSignatureCache.get(_0x49ed52.id);
    let _0xedb41d = _edgeDomCache.get(_0x49ed52.id);
    const _0x3f4688 = !_0xedb41d || _0x416452 !== _0x424e5c;
    if (!_0x128ee0) {
      _0x357e02 += 1;
      _0xedb41d?.groupEl?.isConnected && (_0xedb41d.groupEl.remove(), (_0x38d6e7 += 1));
      (_edgeDomCache.delete(_0x49ed52.id), _edgeEndpointSignatureCache.delete(_0x49ed52.id));
      continue;
    }
    _0x7546be += 1;
    if (!_0xedb41d) {
      const _0x2b1abf = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      ((_0x2b1abf.id = 'edge-group-' + _0x49ed52.id),
        _0x2b1abf.setAttribute('class', 'connection-group'),
        _0x2b1abf.setAttribute('data-conn-id', _0x49ed52.id),
        _0x312e87.appendChild(_0x2b1abf));
      const _0x5ee162 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      (_0x5ee162.setAttribute('class', 'connection-bg'), _0x2b1abf.appendChild(_0x5ee162));
      const _0x561616 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      (_0x561616.setAttribute('class', 'connection-main'),
        _0x2b1abf.appendChild(_0x561616),
        (_0xedb41d = { groupEl: _0x2b1abf, hoverPath: _0x5ee162, pathEl: _0x561616, highlighted: null }),
        _edgeDomCache.set(_0x49ed52.id, _0xedb41d),
        (_0x22e80c += 1));
    } else _0x39aecb += 1;
    _syncEdgeHighlightClass(_0xedb41d, _0x49ed52.id, _0x4d8540);
    if (_0x3f4688) {
      const _0x7a357a = Math.max(Math.abs(_0x229c2b - _0x139eaf) * 0.5, 60),
        _0x430d2a =
          'M ' +
          _0x139eaf +
          ' ' +
          _0x20e46f +
          ' C ' +
          (_0x139eaf + _0x7a357a) +
          ' ' +
          _0x20e46f +
          ', ' +
          (_0x229c2b - _0x7a357a) +
          ' ' +
          _0x5b1192 +
          ', ' +
          _0x229c2b +
          ' ' +
          _0x5b1192;
      _0x2d7f17.push({
        domCache: _0xedb41d,
        d: _0x430d2a,
        endpointSignature: _0x424e5c,
        edgeId: _0x49ed52.id,
      });
    }
  }
  const _0x5b1227 = _nowMs();
  for (const _0x263562 of _0x2d7f17) {
    (_0x263562.domCache.hoverPath.setAttribute('d', _0x263562.d),
      _0x263562.domCache.pathEl.setAttribute('d', _0x263562.d),
      _edgeEndpointSignatureCache.set(_0x263562.edgeId, _0x263562.endpointSignature));
  }
  const _0x21eba6 = _nowMs();
  (_0x2d7f17.length > 0 || _0x22e80c > 0 || _0x38d6e7 > 0) && _invalidateFullEdgeRenderSignature();
  const _0x4cc9bc = _nowMs(),
    _0x11a3d1 = _0x28b02b instanceof Set ? _0x28b02b.size : _0x2d7f17.length;
  recordEdgeRedrawSample('partial', _0x4cc9bc - _0x592d68, {
    reason: 'drag-related-edges',
    edgeCount: _0x11a3d1,
    visibleEdgeCount: _0x7546be,
    updatedCount: _0x2d7f17.length,
    createdCount: _0x22e80c,
    removedCount: _0x38d6e7,
    reusedCount: _0x39aecb,
    skippedInvisibleCount: _0x357e02,
    cacheSize: _edgeDomCache.size,
    layoutReadMs: _0x3506bc.layoutReadMs,
    pathBuildMs: Math.max(0, _0x5b1227 - _0x40011e),
    domWriteMs: Math.max(0, _0x21eba6 - _0x5b1227),
    clearedDom: false,
  });
}
function _renderEdges(
  _0x860ab4,
  _0x2826c1,
  _0x57c703,
  _0x1889f6,
  _0x248971,
  _0x5513f2 = null,
  _0x11154a = null,
  _0x57c361 = null,
  _0x1b3c6a = 'steady',
  _0x4f77a1 = {},
) {
  const _0x57de3f = _nowMs(),
    _0x5988aa = _0x1889f6 || { x: 0, y: 0, zoom: 1 },
    _0x58c911 = _0x4f77a1?.containerSize || _getEdgeContainerSize(_0x248971),
    _0x6a1f5b = _0x58c911.containerW,
    _0x76168e = _0x58c911.containerH,
    _0x23cbbc = _edgeDomClearedSinceLastFull === true,
    _0x4b6650 = _nowMs(),
    _0x49fe4d = 200,
    _0x5d4939 = _0x5513f2?.movedNodeIds instanceof Set ? _0x5513f2.movedNodeIds : null,
    _0x231cf7 = Number.isFinite(_0x5513f2?.dx) ? _0x5513f2.dx : 0,
    _0x15c093 = Number.isFinite(_0x5513f2?.dy) ? _0x5513f2.dy : 0;
  function _0x5232ac(_0xfa5410, _0x37bae6, _0x177033, _0x4ceaf5) {
    const { x: _0x476a2e, y: _0x517a89, zoom: _0x8c2d15 } = _0x5988aa,
      _0x10d3eb = _0xfa5410 * _0x8c2d15 + _0x476a2e,
      _0x2ff0fa = _0x37bae6 * _0x8c2d15 + _0x517a89,
      _0x2da173 = _0x177033 * _0x8c2d15 + _0x476a2e,
      _0x3f4df0 = _0x4ceaf5 * _0x8c2d15 + _0x517a89,
      _0x1de674 = Math.min(_0x10d3eb, _0x2da173),
      _0x166d7b = Math.min(_0x2ff0fa, _0x3f4df0),
      _0x42dcdb = Math.max(_0x10d3eb, _0x2da173),
      _0x3fe5d7 = Math.max(_0x2ff0fa, _0x3f4df0);
    return (
      _0x42dcdb > -_0x49fe4d &&
      _0x1de674 < _0x6a1f5b + _0x49fe4d &&
      _0x3fe5d7 > -_0x49fe4d &&
      _0x166d7b < _0x76168e + _0x49fe4d
    );
  }
  const _0x3f0dba = [];
  let _0x2b1be5 = 0,
    _0x1849e6 = 0,
    _0x34bf01 = 0,
    _0x1fbf51 = 0,
    _0x469a95 = 0;
  const _0x3ec10a = Array.isArray(_0x57c361) ? _0x57c361 : Object.values(_0x2826c1 || {});
  for (const _0x53967f of _0x3ec10a) {
    const _0x3565b5 = _0x57c703[_0x53967f.sourceId],
      _0x3f1f4b = _0x57c703[_0x53967f.targetId];
    if (!_0x3565b5 || !_0x3f1f4b) continue;
    const _0x30a4ef = _0x5d4939 && _0x5d4939.has(_0x53967f.sourceId) ? _0x231cf7 : 0,
      _0x4428e6 = _0x5d4939 && _0x5d4939.has(_0x53967f.sourceId) ? _0x15c093 : 0,
      _0x25fd19 = _0x5d4939 && _0x5d4939.has(_0x53967f.targetId) ? _0x231cf7 : 0,
      _0x18bc21 = _0x5d4939 && _0x5d4939.has(_0x53967f.targetId) ? _0x15c093 : 0,
      _0x1ed2bf = _0x3565b5.x + _0x30a4ef,
      _0x425b75 = _0x3565b5.y + _0x4428e6,
      _0x2db3a9 = _0x3f1f4b.x + _0x25fd19,
      _0xae445a = _0x3f1f4b.y + _0x18bc21,
      _0x12d111 = _0x1ed2bf + (_0x3565b5.width ?? 0),
      _0x14cab3 = _0x425b75 + (_0x3565b5.height ?? 0) / 2,
      _0xa67b1b = _0x2db3a9,
      _0x1080d0 = _0xae445a + (_0x3f1f4b.height ?? 0) / 2,
      _0xb831d8 = _0x5232ac(_0x12d111, _0x14cab3, _0xa67b1b, _0x1080d0),
      _0xc9a5c0 =
        _0x12d111.toFixed(1) +
        ',' +
        _0x14cab3.toFixed(1) +
        ',' +
        _0xa67b1b.toFixed(1) +
        ',' +
        _0x1080d0.toFixed(1),
      _0x2c3435 = _edgeEndpointSignatureCache.get(_0x53967f.id);
    let _0x7d2ab = _edgeDomCache.get(_0x53967f.id);
    const _0x52b574 = !_0x7d2ab || _0x2c3435 !== _0xc9a5c0;
    if (!_0xb831d8) {
      _0x469a95 += 1;
      _0x7d2ab?.groupEl?.isConnected && (_0x7d2ab.groupEl.remove(), (_0x34bf01 += 1));
      (_edgeDomCache.delete(_0x53967f.id), _edgeEndpointSignatureCache.delete(_0x53967f.id));
      continue;
    }
    _0x2b1be5 += 1;
    if (!_0x7d2ab) {
      const _0x45895e = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      ((_0x45895e.id = 'edge-group-' + _0x53967f.id),
        _0x45895e.setAttribute('class', 'connection-group'),
        _0x45895e.setAttribute('data-conn-id', _0x53967f.id),
        _0x860ab4.appendChild(_0x45895e));
      const _0x3721eb = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      (_0x3721eb.setAttribute('class', 'connection-bg'), _0x45895e.appendChild(_0x3721eb));
      const _0x256453 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      (_0x256453.setAttribute('class', 'connection-main'),
        _0x45895e.appendChild(_0x256453),
        (_0x7d2ab = { groupEl: _0x45895e, hoverPath: _0x3721eb, pathEl: _0x256453, highlighted: null }),
        _edgeDomCache.set(_0x53967f.id, _0x7d2ab),
        (_0x1849e6 += 1));
    } else _0x1fbf51 += 1;
    _syncEdgeHighlightClass(_0x7d2ab, _0x53967f.id, _0x11154a);
    if (_0x52b574) {
      const _0x4551d1 = Math.max(Math.abs(_0xa67b1b - _0x12d111) * 0.5, 60),
        _0xa24ef3 =
          'M ' +
          _0x12d111 +
          ' ' +
          _0x14cab3 +
          ' C ' +
          (_0x12d111 + _0x4551d1) +
          ' ' +
          _0x14cab3 +
          ', ' +
          (_0xa67b1b - _0x4551d1) +
          ' ' +
          _0x1080d0 +
          ', ' +
          _0xa67b1b +
          ' ' +
          _0x1080d0;
      _0x3f0dba.push({
        domCache: _0x7d2ab,
        d: _0xa24ef3,
        endpointSignature: _0xc9a5c0,
        edgeId: _0x53967f.id,
      });
    }
  }
  const _0x22e2dc = _nowMs();
  for (const _0x54efbe of _0x3f0dba) {
    (_0x54efbe.domCache.hoverPath.setAttribute('d', _0x54efbe.d),
      _0x54efbe.domCache.pathEl.setAttribute('d', _0x54efbe.d),
      _edgeEndpointSignatureCache.set(_0x54efbe.edgeId, _0x54efbe.endpointSignature));
  }
  const _0x3c61a8 = _nowMs();
  _0x4f77a1?.renderSignature && (_lastFullEdgeRenderSignature = _0x4f77a1.renderSignature);
  _edgeDomClearedSinceLastFull = false;
  const _0x2b5084 = _nowMs();
  recordEdgeRedrawSample('full', _0x2b5084 - _0x57de3f, {
    reason: _0x1b3c6a,
    edgeCount: _0x3ec10a.length,
    visibleEdgeCount: _0x2b1be5,
    updatedCount: _0x3f0dba.length,
    createdCount: _0x1849e6,
    removedCount: _0x34bf01,
    reusedCount: _0x1fbf51,
    skippedInvisibleCount: _0x469a95,
    cacheSize: _edgeDomCache.size,
    layoutReadMs: _0x58c911.layoutReadMs,
    pathBuildMs: Math.max(0, _0x22e2dc - _0x4b6650),
    domWriteMs: Math.max(0, _0x3c61a8 - _0x22e2dc),
    clearedDom: _0x23cbbc,
  });
}
function _clearRenderedEdges(_0x3d7480) {
  if (!_0x3d7480) return;
  let _0x40a2c2 = 0;
  (_0x3d7480.querySelectorAll('.connection-group').forEach((_0x12e267) => {
    const _0x28bcbf = _0x12e267.getAttribute('data-conn-id');
    (_0x28bcbf && (_edgeDomCache.delete(_0x28bcbf), _edgeEndpointSignatureCache.delete(_0x28bcbf)),
      _0x12e267.remove(),
      (_0x40a2c2 += 1));
  }),
    _0x3d7480.querySelectorAll('path').forEach((_0x6b28dd) => {
      if (_0x6b28dd.id === 'v2-draft-edge') return;
      if (!_0x6b28dd.id.startsWith('edge-') && !_0x6b28dd.id.startsWith('hover-edge-')) return;
      const _0x42f128 = _0x6b28dd.id.replace('hover-edge-', '').replace('edge-', '');
      (_edgeDomCache.delete(_0x42f128),
        _edgeEndpointSignatureCache.delete(_0x42f128),
        _0x6b28dd.remove(),
        (_0x40a2c2 += 1));
    }),
    _0x40a2c2 > 0 && _invalidateFullEdgeRenderSignature({ clearedDom: true }));
}
function _clearRenderedEdgesFromDocument() {
  if (typeof document === 'undefined') return;
  const _0x3be291 = document.getElementById?.('v2-edges');
  (_0x3be291 && _clearRenderedEdges(_0x3be291),
    document.getElementById?.('v2-draft-edge')?.remove?.(),
    document.querySelectorAll?.('.v2-edge-thumbnail').forEach((_0x5cec39) => _0x5cec39.remove()),
    document.querySelectorAll?.('[id^="v2-thumb-"]').forEach((_0xc6b343) => _0xc6b343.remove()));
}
function _cleanupEdges(_0xf153b8, _0x38acd6) {
  let _0x43cb9c = 0;
  const _0x5cfe2b = _0xf153b8.querySelectorAll('g.connection-group');
  for (const _0x5dbe76 of _0x5cfe2b) {
    const _0x5d1dd9 = _0x5dbe76.getAttribute('data-conn-id');
    !_0x38acd6[_0x5d1dd9] &&
      (_0x5dbe76.remove(),
      (_0x43cb9c += 1),
      _edgeDomCache.delete(_0x5d1dd9),
      _edgeEndpointSignatureCache.delete(_0x5d1dd9));
  }
  const _0x40610e = _0xf153b8.querySelectorAll('path');
  for (const _0x35c5ab of _0x40610e) {
    if (_0x35c5ab.id === 'v2-draft-edge') continue;
    if (_0x35c5ab.id.startsWith('edge-') || _0x35c5ab.id.startsWith('hover-edge-')) {
      const _0x43fbd1 = _0x35c5ab.id.replace('hover-edge-', '').replace('edge-', '');
      !_0x38acd6[_0x43fbd1] &&
        (_0x35c5ab.remove(),
        (_0x43cb9c += 1),
        _edgeDomCache.delete(_0x43fbd1),
        _edgeEndpointSignatureCache.delete(_0x43fbd1));
    }
  }
  (document.querySelectorAll('.v2-edge-thumbnail').forEach((_0x2fa06a) => _0x2fa06a.remove()),
    document.querySelectorAll('[id^="v2-thumb-"]').forEach((_0x250aad) => _0x250aad.remove()),
    _0x43cb9c > 0 && _invalidateFullEdgeRenderSignature({ clearedDom: true }));
}
function _renderEdgeThumbnails_REMOVED(_0x2e856d, _0x49371f, _0x1e41eb) {
  for (const _0x529055 of Object.values(_0x49371f)) {
  }
}
function _createPickerEl() {
  const _0x1a9480 = document.createElement('div');
  return (
    (_0x1a9480.id = 'v2-picker'),
    (_0x1a9480.dataset.uiStop = '1'),
    Object.assign(_0x1a9480.style, {
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
    _0x1a9480
  );
}
function _renderPicker(_0x124770, _0xdf7299, _0x27eaaa) {
  if (!_0xdf7299.visible) {
    ((_0x124770.style.display = 'none'), _0x124770.replaceChildren());
    return;
  }
  ((_0x124770.style.display = 'flex'),
    (_0x124770.style.left = _0xdf7299.screenX + 'px'),
    (_0x124770.style.top = _0xdf7299.screenY + 'px'));
  if (_0x124770.children.length > 0) return;
  const _0x2a73e5 = document.createElement('div');
  ((_0x2a73e5.textContent = t('coreUi.renderer.picker.addNode')),
    Object.assign(_0x2a73e5.style, {
      fontSize: '11px',
      color: 'var(--text-muted)',
      padding: '2px 4px 6px',
      borderBottom: '1px solid var(--white-08)',
      marginBottom: '4px',
      userSelect: 'none',
    }),
    _0x124770.appendChild(_0x2a73e5));
  const _0x450806 = getAIGenerationDefaultSizeByType('ai-text'),
    _0x512dfb = getAIGenerationDefaultSizeByType('ai-image'),
    _0x181f62 = getAIGenerationDefaultSizeByType('ai-video'),
    _0x1eadc5 = [
      {
        type: 'ai-text',
        label: t('coreUi.renderer.picker.items.aiText'),
        defaultLabel: t('coreUi.renderer.picker.defaults.aiText'),
        width: _0x450806.width,
        height: _0x450806.height,
      },
      {
        type: 'ai-image',
        label: t('coreUi.renderer.picker.items.aiImage'),
        defaultLabel: t('coreUi.renderer.picker.defaults.aiImage'),
        width: _0x512dfb.width,
        height: _0x512dfb.height,
      },
      {
        type: 'ai-video',
        label: t('coreUi.renderer.picker.items.aiVideo'),
        defaultLabel: t('coreUi.renderer.picker.defaults.aiVideo'),
        width: _0x181f62.width,
        height: _0x181f62.height,
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
    type: _0x32a19d,
    label: _0x2ced09,
    defaultLabel: _0x1366d6,
    width: _0x1f5568,
    height: _0x182a17,
  } of _0x1eadc5) {
    const _0x2683b8 = document.createElement('button');
    ((_0x2683b8.textContent = _0x2ced09),
      (_0x2683b8.dataset.nodeType = _0x32a19d),
      (_0x2683b8.dataset.defaultLabel = _0x1366d6),
      (_0x2683b8.dataset.width = String(_0x1f5568)),
      (_0x2683b8.dataset.height = String(_0x182a17)),
      Object.assign(_0x2683b8.style, {
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
      _0x124770.appendChild(_0x2683b8));
  }
}
function _createSelectionRectEl() {
  const _0x2b90d7 = document.createElement('div');
  return (
    (_0x2b90d7.id = 'v2-selection-rect'),
    Object.assign(_0x2b90d7.style, {
      position: 'absolute',
      border: '1px dashed var(--white-50)',
      backgroundColor: 'var(--white-02)',
      pointerEvents: 'none',
      display: 'none',
      zIndex: '1000',
    }),
    _0x2b90d7
  );
}
function _renderSelectionRect(_0x12dfc1, _0x455463) {
  if (!_0x455463 || !_0x455463.active) {
    _0x12dfc1.style.display = 'none';
    return;
  }
  _0x12dfc1.style.display = 'block';
  const _0x1eb1c2 = Math.min(_0x455463.x1, _0x455463.x2),
    _0x18b3fb = Math.min(_0x455463.y1, _0x455463.y2),
    _0x498700 = Math.abs(_0x455463.x2 - _0x455463.x1),
    _0x58f42b = Math.abs(_0x455463.y2 - _0x455463.y1);
  ((_0x12dfc1.style.left = _0x1eb1c2 + 'px'),
    (_0x12dfc1.style.top = _0x18b3fb + 'px'),
    (_0x12dfc1.style.width = _0x498700 + 'px'),
    (_0x12dfc1.style.height = _0x58f42b + 'px'));
}
function _createMultiSelectBoxEl(_0x4868e9) {
  const _0x42ab5f = document.createElement('div');
  ((_0x42ab5f.id = 'v2-multi-select-box'), (_0x42ab5f.className = 'v2-multi-select-box'));
  const _0x23dfac = document.createElement('div');
  ((_0x23dfac.className = 'v2-multi-select-tab'), (_0x23dfac.dataset.uiStop = '1'));
  const _0x485cab = 'http://www.w3.org/2000/svg',
    _0x1ee113 = (_0x146659 = '2') => {
      const _0x387f2f = document.createElementNS(_0x485cab, 'svg');
      return (
        _0x387f2f.setAttribute('viewBox', '0 0 24 24'),
        _0x387f2f.setAttribute('fill', 'none'),
        _0x387f2f.setAttribute('stroke', 'currentColor'),
        _0x387f2f.setAttribute('stroke-width', _0x146659),
        _0x387f2f.setAttribute('stroke-linecap', 'round'),
        _0x387f2f.setAttribute('stroke-linejoin', 'round'),
        _0x387f2f
      );
    },
    _0x1489cc = (_0x1db563, _0x45ad6e, _0x480c0b) => {
      const _0x2ede84 = document.createElement('button');
      return (
        (_0x2ede84.type = 'button'),
        (_0x2ede84.className = 'v2-multi-select-btn'),
        (_0x2ede84.dataset.uiAction = _0x1db563),
        (_0x2ede84.title = _0x45ad6e),
        _0x2ede84.setAttribute('aria-label', _0x45ad6e),
        _0x2ede84.replaceChildren(_0x480c0b),
        _0x2ede84
      );
    },
    _0x2edbca = (_0x429389, _0x154aa7) => {
      const _0x4ad503 = document.createElementNS(_0x485cab, 'path');
      return (_0x4ad503.setAttribute('d', _0x154aa7), _0x429389.appendChild(_0x4ad503), _0x4ad503);
    },
    _0x5d4ace = _0x1ee113('2.5'),
    _0x2e6686 = document.createElementNS(_0x485cab, 'polygon');
  (_0x2e6686.setAttribute('points', '5 3 19 12 5 21 5 3'), _0x5d4ace.appendChild(_0x2e6686));
  const _0x1445ea = _0x1489cc(
    'ms-sync-video-play',
    t('coreUi.renderer.multiSelect.syncVideoPlay'),
    _0x5d4ace,
  );
  _0x1445ea.style.display = 'none';
  const _0x5400f0 = _0x1ee113('2');
  [
    'M12 3l1.2 4.1L17 8.3l-3.8 1.2L12 13.5l-1.2-4-3.8-1.2 3.8-1.2L12 3z',
    'M18 14l.7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14z',
    'M6 13l.8 2.7L9.5 16.5l-2.7.8L6 20l-.8-2.7-2.7-.8 2.7-.8L6 13z',
  ].forEach((_0x1c2a65) => _0x2edbca(_0x5400f0, _0x1c2a65));
  const _0x36504e = _0x1489cc('ms-run-selected', t('coreUi.renderer.multiSelect.runSelected'), _0x5400f0),
    _0x5013b7 = _0x1ee113('1.8'),
    _0x379668 = document.createElementNS(_0x485cab, 'polygon');
  (_0x379668.setAttribute('points', '12 2 20 12 16 12 16 22 8 22 8 12 4 12 12 2'),
    _0x5013b7.appendChild(_0x379668));
  const _0x16e5b1 = _0x1489cc('ms-asset', t('coreUi.renderer.multiSelect.createAsset'), _0x5013b7),
    _0x4c8773 = _0x1ee113('2');
  for (const [_0x2d30a9, _0x2a9872] of [
    [3, 3],
    [14, 3],
    [14, 14],
    [3, 14],
  ]) {
    const _0x3859bd = document.createElementNS(_0x485cab, 'rect');
    (_0x3859bd.setAttribute('x', String(_0x2d30a9)),
      _0x3859bd.setAttribute('y', String(_0x2a9872)),
      _0x3859bd.setAttribute('width', '7'),
      _0x3859bd.setAttribute('height', '7'),
      _0x4c8773.appendChild(_0x3859bd));
  }
  const _0x23b913 = _0x1489cc('ms-group', t('coreUi.renderer.multiSelect.group'), _0x4c8773),
    _0x3e7fab = _0x1ee113('2'),
    _0x49ad01 = document.createElementNS(_0x485cab, 'path');
  _0x49ad01.setAttribute('d', 'M3 12a9 9 0 0 1 15.36-6.36');
  const _0x346293 = document.createElementNS(_0x485cab, 'path');
  _0x346293.setAttribute('d', 'M21 12a9 9 0 0 1-15.36 6.36');
  const _0x3f70b4 = document.createElementNS(_0x485cab, 'polyline');
  _0x3f70b4.setAttribute('points', '21 3 21 9 15 9');
  const _0x2d8c80 = document.createElementNS(_0x485cab, 'polyline');
  (_0x2d8c80.setAttribute('points', '3 21 3 15 9 15'),
    _0x3e7fab.appendChild(_0x49ad01),
    _0x3e7fab.appendChild(_0x346293),
    _0x3e7fab.appendChild(_0x3f70b4),
    _0x3e7fab.appendChild(_0x2d8c80));
  const _0x2e4200 = _0x1489cc(
    'ms-reset-image-size',
    t('coreUi.renderer.multiSelect.resetDefaultSize'),
    _0x3e7fab,
  );
  _0x2e4200.style.display = 'none';
  const _0x1e2636 = _0x1ee113('2'),
    _0x3ad8d5 = document.createElementNS(_0x485cab, 'rect');
  (_0x3ad8d5.setAttribute('x', '3'),
    _0x3ad8d5.setAttribute('y', '5'),
    _0x3ad8d5.setAttribute('width', '18'),
    _0x3ad8d5.setAttribute('height', '14'),
    _0x3ad8d5.setAttribute('rx', '2'),
    _0x1e2636.appendChild(_0x3ad8d5),
    _0x2edbca(_0x1e2636, 'M3 9h18'),
    _0x2edbca(_0x1e2636, 'M7 5l4 4'),
    _0x2edbca(_0x1e2636, 'M13 5l4 4'));
  const _0x42ffda = _0x1489cc('ms-compose-video', t('coreUi.renderer.multiSelect.composeVideo'), _0x1e2636);
  _0x42ffda.style.display = 'none';
  const _0x5d0900 = _0x1ee113('2');
  [
    'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    'M3 10h18',
    'M12 10v10',
  ].forEach((_0x52581b) => _0x2edbca(_0x5d0900, _0x52581b));
  const _0x14a426 = _0x1489cc('ms-create-collage', t('coreUi.renderer.multiSelect.createCollage'), _0x5d0900);
  return (
    (_0x14a426.style.display = 'none'),
    _0x23dfac.appendChild(_0x36504e),
    _0x23dfac.appendChild(_0x1445ea),
    _0x23dfac.appendChild(_0x16e5b1),
    _0x23dfac.appendChild(_0x23b913),
    _0x23dfac.appendChild(_0x2e4200),
    _0x23dfac.appendChild(_0x14a426),
    _0x23dfac.appendChild(_0x42ffda),
    _0x42ab5f.appendChild(_0x23dfac),
    _0x42ab5f
  );
}
function _createAlignCenterPanelEl() {
  const _0x389c25 = document.createElement('div');
  ((_0x389c25.id = 'v2-align-center-panel'),
    (_0x389c25.className = 'v2-align-center-panel'),
    (_0x389c25.dataset.uiStop = '1'),
    (_0x389c25.style.display = 'none'));
  const _0x229bc4 = 'http://www.w3.org/2000/svg',
    _0x361a81 = {
      'ms-align-left': ['M4 4v16', 'M8 7h10', 'M8 12h7', 'M8 17h9'],
      'ms-align-h-center': ['M12 4v16', 'M7 7h10', 'M9 12h6', 'M8 17h8'],
      'ms-align-right': ['M20 4v16', 'M6 7h10', 'M9 12h7', 'M7 17h9'],
      'ms-align-top': ['M4 4h16', 'M7 8v10', 'M12 8v7', 'M17 8v9'],
      'ms-align-v-center': ['M4 12h16', 'M7 7v10', 'M12 9v6', 'M17 8v8'],
      'ms-align-bottom': ['M4 20h16', 'M7 6v10', 'M12 9v7', 'M17 7v9'],
      'ms-distribute-h': ['M3 20h18', 'M5 8h3v8H5z', 'M11 5h3v11h-3z', 'M17 10h3v6h-3z'],
      'ms-distribute-v': ['M20 3v18', 'M8 5h8v3H8z', 'M5 11h11v3H5z', 'M10 17h6v3h-6z'],
    },
    _0xc61d0f = [
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
    _0xc61d0f.forEach((_0x7bdb41) => {
      const _0x25a691 = document.createElement('button');
      ((_0x25a691.type = 'button'),
        (_0x25a691.className = 'v2-align-center-btn ' + _0x7bdb41.slot),
        (_0x25a691.dataset.uiAction = _0x7bdb41.action),
        (_0x25a691.dataset.tooltip = _0x7bdb41.tooltip),
        _0x25a691.setAttribute('aria-label', _0x7bdb41.tooltip));
      const _0x23b925 = document.createElementNS(_0x229bc4, 'svg');
      (_0x23b925.setAttribute('width', '16'),
        _0x23b925.setAttribute('height', '16'),
        _0x23b925.setAttribute('viewBox', '0 0 24 24'),
        _0x23b925.setAttribute('fill', 'none'),
        _0x23b925.setAttribute('stroke', 'currentColor'),
        _0x23b925.setAttribute('stroke-width', '2'),
        _0x23b925.setAttribute('stroke-linecap', 'round'),
        _0x23b925.setAttribute('stroke-linejoin', 'round'));
      const _0x1d3d5e = _0x361a81[_0x7bdb41.action] || [];
      (_0x1d3d5e.forEach((_0x25fdfe) => {
        const _0x698ea0 = document.createElementNS(_0x229bc4, 'path');
        (_0x698ea0.setAttribute('d', _0x25fdfe), _0x23b925.appendChild(_0x698ea0));
      }),
        _0x25a691.appendChild(_0x23b925),
        _0x389c25.appendChild(_0x25a691));
    }),
    _0x389c25
  );
}
function _renderAlignCenterPanel(_0x270eb9, _0x3986c5, _0x2b1297, _0xbd4da3 = {}) {
  if (!_0x270eb9) return;
  const _0x24ee1e = String(_0xbd4da3?.alignFeatureTriggerMode || 'click'),
    _0x2ad217 = _0xbd4da3?.alignFeatureEnabled !== false && _0x24ee1e !== 'off',
    _0x487118 = _0xbd4da3?.alignPanelVisible === true,
    _0x3262db = Array.isArray(_0x3986c5) ? _0x3986c5 : [],
    _0x4a5943 = getAlignableSelectionNodes(_0x2b1297 || {}, _0x3262db),
    _0x216854 = _0x2ad217 && _0x487118 && _0x3262db.length >= 2 && _0x4a5943.length >= 2;
  if (!_0x216854) {
    if (_0x270eb9.style.display !== 'none') _0x270eb9.style.display = 'none';
    ((_alignPanelRenderCache.centerSig = ''), (_alignPanelRenderCache.buttonStateSig = ''));
    return;
  }
  const _0x44ecfa = _0xbd4da3?.alignPanelAnchorWorld,
    _0x2453f3 = !!_0x44ecfa && Number.isFinite(_0x44ecfa.x) && Number.isFinite(_0x44ecfa.y);
  let _0x2c4f26 = 0,
    _0x4ecd57 = 0;
  if (_0x2453f3) ((_0x2c4f26 = Number(_0x44ecfa.x)), (_0x4ecd57 = Number(_0x44ecfa.y)));
  else {
    const _0x1930fa = computeSelectionBounds(_0x4a5943);
    if (!_0x1930fa) {
      if (_0x270eb9.style.display !== 'none') _0x270eb9.style.display = 'none';
      ((_alignPanelRenderCache.centerSig = ''), (_alignPanelRenderCache.buttonStateSig = ''));
      return;
    }
    ((_0x2c4f26 = _0x1930fa.centerX), (_0x4ecd57 = _0x1930fa.centerY));
  }
  if (_0x270eb9.style.display !== 'block') _0x270eb9.style.display = 'block';
  const _0x2f7b88 = _0x2c4f26.toFixed(2) + '|' + _0x4ecd57.toFixed(2);
  _alignPanelRenderCache.centerSig !== _0x2f7b88 &&
    ((_alignPanelRenderCache.centerSig = _0x2f7b88),
    (_0x270eb9.style.left = _0x2c4f26 + 'px'),
    (_0x270eb9.style.top = _0x4ecd57 + 'px'));
  const _0x5ca79b = _0x4a5943.length >= 2,
    _0x1cb7d0 = _0x5ca79b ? '1' : '0';
  if (_alignPanelRenderCache.buttonStateSig !== _0x1cb7d0) {
    _alignPanelRenderCache.buttonStateSig = _0x1cb7d0;
    const _0x4df843 =
      _0x270eb9._actionButtons || Array.from(_0x270eb9.querySelectorAll('button[data-ui-action]'));
    ((_0x270eb9._actionButtons = _0x4df843),
      _0x4df843.forEach((_0xd0ccb7) => {
        const _0xe5b973 = _0xd0ccb7.dataset.uiAction,
          _0x4b4e76 = _0xe5b973 === 'ms-distribute-h' || _0xe5b973 === 'ms-distribute-v',
          _0x4108b9 = _0x4b4e76 ? !_0x5ca79b : false;
        ((_0xd0ccb7.disabled = _0x4108b9), _0xd0ccb7.classList.toggle('is-disabled', _0x4108b9));
      }));
  }
}
function _renderMultiSelectBox(_0x150855, _0x515ee7, _0x5ce393, _0x19702e, _0xd32360 = false) {
  const _0x5aed7c = _0x515ee7 && _0x515ee7.length >= 2,
    _0x1bec7c = (_0x598cc1, { mountedOnly: mountedOnly = false } = {}) => {
      if (!_0x598cc1) return null;
      if (mountedOnly && !_mountedNodeIds.has(_0x598cc1)) return null;
      return _wrapperMap.get(_0x598cc1) || _parkedWrapperMap.get(_0x598cc1) || null;
    },
    _0x4a5158 = (_0x535e50) => {
      if (!_0x535e50) return;
      const _0x1e574e = _0x535e50.querySelector('.node-floating-toolbar'),
        _0x2e6393 = _0x535e50.querySelector('.group-toolbar'),
        _0x469acf = _0x535e50.querySelector('.text-prompt-panel');
      if (_0x1e574e) _0x1e574e.style.display = '';
      if (_0x2e6393) _0x2e6393.style.display = '';
      if (_0x469acf) _0x469acf.style.display = '';
    },
    _0x4629bd = (_0x352a73) => {
      if (!_0x352a73) return;
      const _0xa9987f = _0x352a73.querySelector('.node-floating-toolbar'),
        _0x385c5f = _0x352a73.querySelector('.group-toolbar'),
        _0x5aa061 = _0x352a73.querySelector('.text-prompt-panel');
      if (_0xa9987f) _0xa9987f.style.display = 'none';
      if (_0x385c5f) _0x385c5f.style.display = 'none';
      if (_0x5aa061) _0x5aa061.style.display = 'none';
    };
  if (!_0x5aed7c) {
    for (const _0x54f225 of _msHiddenNodeIds) {
      _0x4a5158(_0x1bec7c(_0x54f225));
    }
    _msHiddenNodeIds = new Set();
  } else {
    const _0x496252 = new Set(_0x515ee7 || []),
      _0x440319 = new Set();
    for (const _0x383b34 of _msHiddenNodeIds) {
      if (_0x496252.has(_0x383b34)) continue;
      _0x4a5158(_0x1bec7c(_0x383b34));
    }
    for (const _0x286255 of _0x496252) {
      const _0x5cbf7e = _0x1bec7c(_0x286255, { mountedOnly: true });
      if (!_0x5cbf7e) continue;
      (_0x4629bd(_0x5cbf7e), _0x440319.add(_0x286255));
    }
    _msHiddenNodeIds = _0x440319;
  }
  if (!_0x5aed7c) {
    if (_0x150855.style.display !== 'none') _0x150855.style.display = 'none';
    ((_multiSelectRenderCache.geometrySig = ''),
      (_multiSelectRenderCache.runBtnDisabled = null),
      (_multiSelectRenderCache.resetBtnVisible = null),
      (_multiSelectRenderCache.composeBtnVisible = null),
      (_multiSelectRenderCache.composeBtnKind = ''));
    return;
  }
  const _0x36a5c0 = _0x150855.querySelector(
      '.v2-multi-select-tab button[data-ui-action="ms-sync-video-play"]',
    ),
    _0x51329f = _0x150855.querySelector('.v2-multi-select-tab button[data-ui-action="ms-run-selected"]'),
    _0x57715a = _0x150855.querySelector('.v2-multi-select-tab button[data-ui-action="ms-compose-video"]'),
    _0x350faa = _0x150855.querySelector('.v2-multi-select-tab button[data-ui-action="ms-reset-image-size"]'),
    _0x2744b4 = _0x150855.querySelector('.v2-multi-select-tab button[data-ui-action="ms-create-collage"]');
  if (_0x36a5c0)
    _0x36a5c0.style.display = getSelectedSyncPlayableVideoCount(_0x5ce393, _0x515ee7) >= 2 ? '' : 'none';
  if (_0x51329f) {
    _0x51329f.style.display = '';
    let _0x161889 = false;
    for (const _0x8c82e5 of _0x515ee7) {
      if (isNodeType(_0x5ce393[_0x8c82e5], ['ai-text', 'ai-image', 'ai-video', 'ai-audio'])) {
        _0x161889 = true;
        break;
      }
    }
    const _0x3283a4 = !_0x161889;
    ((_multiSelectRenderCache.runBtnDisabled = _0x3283a4),
      (_0x51329f.disabled = _0x3283a4),
      _0x51329f.classList.toggle('is-disabled', _0x3283a4));
  }
  if (_0x350faa) {
    let _0x311206 = false;
    for (const _0x1aec2e of _0x515ee7) {
      const _0x11f4a3 = _0x5ce393[_0x1aec2e],
        _0x25849d =
          !!_0x11f4a3 && isNodeType(_0x11f4a3, ['source-image', 'source-video', 'ai-image', 'ai-video']);
      if (_0x25849d) {
        _0x311206 = true;
        break;
      }
    }
    const _0x4da47a = _0xd32360 && _0x311206;
    _multiSelectRenderCache.resetBtnVisible !== _0x4da47a &&
      ((_multiSelectRenderCache.resetBtnVisible = _0x4da47a),
      (_0x350faa.style.display = _0x4da47a ? '' : 'none'));
  }
  if (_0x2744b4) {
    const _0x2aeec1 = _0x515ee7.filter((_0x58adfe) =>
      isNodeType(_0x5ce393[_0x58adfe], ['source-image', 'ai-image', 'storyboard']),
    ).length;
    _0x2744b4.style.display = _0x2aeec1 >= 2 ? '' : 'none';
  }
  if (_0x57715a) {
    const _0x329130 = getSelectedMediaComposeKind(_0x5ce393, _0x515ee7),
      _0x48a0ce = !!_0x329130;
    _multiSelectRenderCache.composeBtnVisible !== _0x48a0ce &&
      ((_multiSelectRenderCache.composeBtnVisible = _0x48a0ce),
      (_0x57715a.style.display = _0x48a0ce ? '' : 'none'));
    if (_multiSelectRenderCache.composeBtnKind !== _0x329130) {
      _multiSelectRenderCache.composeBtnKind = _0x329130;
      const _0x2e029f = getMediaComposeButtonLabel(_0x329130);
      ((_0x57715a.dataset.composeKind = _0x329130),
        (_0x57715a.dataset.tooltip = _0x2e029f),
        _0x57715a.setAttribute('aria-label', _0x2e029f));
    }
  }
  let _0x3be71a = Infinity,
    _0x5853a7 = Infinity,
    _0x9e50a = -Infinity,
    _0x33b1c0 = -Infinity,
    _0x3e9330 = 0;
  _0x515ee7.forEach((_0x675cec) => {
    const _0xcc374d = _0x5ce393[_0x675cec];
    if (!_0xcc374d) return;
    _0x3e9330++;
    const _0xd8a82d = _0xcc374d.width || 0x104,
      _0x45a88d = _0xcc374d.height || 100;
    let _0x3b957a = _0xcc374d.x,
      _0x74923d = _0xcc374d.y,
      _0x3db09e = _0xcc374d.x + _0xd8a82d,
      _0x6245c8 = _0xcc374d.y + _0x45a88d;
    (_0xcc374d.type !== 'group' && (_0x74923d -= 30),
      (_0x3be71a = Math.min(_0x3be71a, _0x3b957a)),
      (_0x5853a7 = Math.min(_0x5853a7, _0x74923d)),
      (_0x9e50a = Math.max(_0x9e50a, _0x3db09e)),
      (_0x33b1c0 = Math.max(_0x33b1c0, _0x6245c8)));
  });
  if (_0x3e9330 < 2) {
    if (_0x150855.style.display !== 'none') _0x150855.style.display = 'none';
    _multiSelectRenderCache.geometrySig = '';
    return;
  }
  if (_0x150855.style.display !== 'block') _0x150855.style.display = 'block';
  const _0x53212a = 18,
    _0x2c395f = _0x3be71a - _0x53212a,
    _0x96f9f6 = _0x5853a7 - _0x53212a,
    _0x31503b = _0x9e50a - _0x3be71a + _0x53212a * 2,
    _0x266579 = _0x33b1c0 - _0x5853a7 + _0x53212a * 2,
    _0x5b011b =
      _0x2c395f.toFixed(2) +
      '|' +
      _0x96f9f6.toFixed(2) +
      '|' +
      _0x31503b.toFixed(2) +
      '|' +
      _0x266579.toFixed(2);
  _multiSelectRenderCache.geometrySig !== _0x5b011b &&
    ((_multiSelectRenderCache.geometrySig = _0x5b011b),
    (_0x150855.style.left = _0x2c395f + 'px'),
    (_0x150855.style.top = _0x96f9f6 + 'px'),
    (_0x150855.style.width = _0x31503b + 'px'),
    (_0x150855.style.height = _0x266579 + 'px'));
}
