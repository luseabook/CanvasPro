import appStore, {
  graphStore as graphStore_2,
  uiStore as uiStore_2,
  workspaceStore as workspaceStore_2,
} from './stores/appStore.js';
import { isNodeType } from '../modules/registry.js';
import { getShortcuts } from '../modules/shortcuts.js';
import {
  screenToWorld,
  isPointInRect,
  isRectIntersect,
  checkLineIntersection,
  checkBBoxIntersection,
  hitTestNode,
  findAvailablePosition,
  generateId,
  getAlignableSelectionNodes,
  computeSelectionBounds,
  computeAlignTargets,
  computeDistributeTargets,
  buildNodeOffsetPlan,
} from './math.js';
import { commit, redo, undo } from '../modules/history.js';
import {
  setClipboard,
  getClipboard,
  getClipboardGraph,
  markSystemClipboardWrite,
} from '../modules/clipboard.js';
import { buildClipboardGraphSnapshot, prepareClipboardGraphPaste } from '../modules/clipboardGraph.js';
import {
  captureEditableSelection,
  getEditableTextTarget,
  isEditableTextTargetInGroupedNode,
  pasteTextIntoEditableFromClipboard,
  showTextInputContextMenu,
} from '../modules/textInputContextMenu.js';
import { calcSafeSpawnPosNearNode } from '../modules/nodeSpawn.js';
import { rafSampleLatest } from '../utils/dom.js';
import {
  stripImageGenerationResultStateForDerivedNode,
  stripImageGenerationRuntimeState,
} from './imageTaskRuntimeState.js';
import {
  buildQuickCreateStoryboardCells,
  buildStoryboardNodePayload,
  computeQuickCreateStoryboardSize,
  resolveNearestStoryboardAspect,
  resolveStoryboardSourceImageRef,
} from './storyboardFactory.js';
import {
  buildCollageNodeDataFromSelection,
  createEmptyCollageNodeData,
  isCollageImageNode,
} from '../modules/collage/collageFactory.js';
import { createWhiteboardNodeData } from '../modules/whiteboard/whiteboardModel.js';
import { createComfyWorkflowNodeData } from '../modules/comfyui/comfyWorkflowModel.js';
import { createStoryWorkspaceNodeData } from '../modules/storyWorkspace/storyWorkspaceModel.js';
import { createDragController } from '../modules/interaction/DragController.js';
import {
  beginDragFpsSession,
  beginPanFpsSession,
  endDragFpsSession,
  endPanFpsSession,
  recordCanvasPanSample,
} from '../modules/perf/perfProbe.js';
import {
  createEdgeController,
  initConnectionHandles as initConnectionHandles_2,
  initPickConnect as initPickConnect_2,
  isValidConnection as isValidConnection_2,
  addEdgeWithPolicies,
  setDragContextGetter,
} from '../modules/interaction/EdgeController.js';
import { createSelectionController } from '../modules/interaction/SelectionController.js';
import { createZoomController } from '../modules/interaction/ZoomController.js';
import { createWheelPanController } from '../modules/interaction/WheelPanController.js';
import { createInteractionCommandAdapter } from '../modules/interaction/interactionCommandAdapter.js';
import { createViewportPreviewCoordinator } from '../modules/interaction/viewportPreviewCoordinator.js';
import { removeContextMenus, showContextMenu } from '../modules/interaction/contextMenuPresenter.js';
import { buildAppCanvasNodeData } from '../modules/app/canvasNodeDataFactory.js';
import {
  CONTEXT_NODE_CREATION_SECTION_IDS,
  NODE_CREATION_UPLOAD_ITEM,
  PICKER_NODE_CREATION_SECTION_IDS,
  getNodeCreationMenuSections,
} from '../modules/nodeCreationMenuCatalog.js';
import {
  beginViewportPanPreview,
  cancelViewportPanPreview,
  flushViewportPanPreview,
  getViewportPanPreview,
  isViewportPanPreviewActive,
  updateViewportPanPreview,
} from './viewportPanPreview.js';
import {
  createPanorama360NodeData,
  createPanoramaSceneNodeData,
  PANORAMA_SCENE_DEFAULT_SIZE,
} from '../modules/panoramaSceneNode/sceneNode.js';
import { createStoryboardScriptNodeData, STORYBOARD_SCRIPT_DEFAULT_SIZE } from './storyboardScriptFactory.js';
import {
  buildSourceMediaNodePayload,
  getAIGenerationDefaultSizeByType,
  getAIGenerationNodeSize,
  getAutoMediaSizeByShortSide,
  getNodeDefaultSize,
} from '../services/fileService.js';
import {
  canOpenKnownFolder,
  canShowItemInFolder,
  openKnownFolder,
  resolveNodeLocalPathForNativeAction,
  showItemInFolder,
} from '../services/nativeFileActionService.js';
import { t } from '../i18n/index.js';
const graphStore = appStore?.graphStore || graphStore_2 || appStore,
  uiStore = appStore?.uiStore || uiStore_2 || appStore,
  workspaceStore = appStore?.workspaceStore || workspaceStore_2 || appStore,
  EDGE_INTERACTION_LITE_CLASS = 'is-edge-interaction-lite',
  EDGE_INTERACTION_LITE_MIN_ZOOM = 0.24,
  EDGE_INTERACTION_LITE_MAX_ZOOM = 0.48,
  EDGE_INTERACTION_LITE_MIN_EDGES = 3;
function isDevModeOn() {
  return window.DEV_MODE === true || document.body?.classList?.contains('dev-mode');
}
function _shouldUseEdgeInteractionLite(_0x12cd02) {
  const _0x530e6a = Number(_0x12cd02?.viewport?.zoom) || 1,
    _0x51dd5b = Object.keys(_0x12cd02?.edges || {}).length,
    _0x4f2159 = typeof window !== 'undefined' ? window._edgeDomCache : null;
  return (
    _0x530e6a >= EDGE_INTERACTION_LITE_MIN_ZOOM &&
    _0x530e6a <= EDGE_INTERACTION_LITE_MAX_ZOOM &&
    _0x51dd5b >= EDGE_INTERACTION_LITE_MIN_EDGES &&
    _0x4f2159 &&
    _0x4f2159.size > 0
  );
}
function _setEdgeInteractionLite(_0x3e39fb) {
  if (typeof document === 'undefined' || !document?.body?.classList) return;
  document.body.classList.toggle(EDGE_INTERACTION_LITE_CLASS, !!_0x3e39fb);
}
function getStateRaw() {
  return { ...graphStore.getStateRaw(), ...uiStore.getStateRaw(), ...workspaceStore.getStateRaw() };
}
function getState() {
  return { ...graphStore.getState(), ...uiStore.getState(), ...workspaceStore.getState() };
}
function nowMs() {
  return typeof performance !== 'undefined' && performance && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}
function getMountedNodeCountForPerf() {
  const _0x2931c9 = typeof window !== 'undefined' ? window.v2Renderer?.wrapperMap : null;
  return _0x2931c9 && typeof _0x2931c9.size === 'number' ? _0x2931c9.size : 0;
}
function markViewportInteractionBusyForRenderer() {
  try {
    window.v2Renderer?.markViewportInteractionBusy?.();
  } catch {}
}
let isCuttingMode = false,
  lastCutPos = null;
(window.addEventListener('keydown', (_0x8d3364) => {
  _0x8d3364.key === 'Control' &&
    ((isCuttingMode = true), document.documentElement.classList.add('is-cutting-mode'));
}),
  window.addEventListener('keyup', (_0x588bf6) => {
    _0x588bf6.key === 'Control' &&
      ((isCuttingMode = false),
      (lastCutPos = null),
      document.documentElement.classList.remove('is-cutting-mode'));
  }));
function _createIdleDragContext() {
  return {
    isDragging: false,
    targetNodeId: null,
    lastWorldX: 0,
    lastWorldY: 0,
    pendingDx: 0,
    pendingDy: 0,
    hasMoved: false,
    wasSelectedOnDown: false,
    dragSource: null,
    titleDragPendingSelectNodeId: null,
    titleDragActivated: false,
    titleDragStartScreenX: 0,
    titleDragStartScreenY: 0,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    panStartViewportX: 0,
    panStartViewportY: 0,
    panStartZoom: 1,
    panStartPerf: 0,
    panMoveCount: 0,
    panMinimapPreviewCount: 0,
    assistPanActive: false,
    assistPanViewport: null,
    isConnecting: false,
    connectSourceId: null,
    isBoxSelecting: false,
    boxStartX: 0,
    boxStartY: 0,
    isDraggingCell: false,
    sourceCellIndex: -1,
    draggedCellData: null,
    ghostEl: null,
    sourceCellEl: null,
    lastHoverNodeId: null,
    lastHoverCellIndex: -1,
  };
}
let dragContext = _createIdleDragContext();
const RESETTABLE_MEDIA_NODE_TYPES = ['source-image', 'source-video', 'ai-image', 'ai-video'];
function _asPositiveNumber(_0x518a74) {
  const _0x342a1a = Number(_0x518a74);
  return Number.isFinite(_0x342a1a) && _0x342a1a > 0 ? _0x342a1a : 0;
}
function _pickMainResultItem(_0x96ac86, _0x20c4c9) {
  if (!Array.isArray(_0x96ac86) || _0x96ac86.length === 0) return null;
  const _0x46bf0c = Number(_0x20c4c9),
    _0x56e09 = Number.isFinite(_0x46bf0c) ? Math.max(0, Math.trunc(_0x46bf0c)) : 0;
  return _0x96ac86[_0x56e09] || _0x96ac86[0] || null;
}
function _parseAspectRatio(_0xca81c6) {
  const _0x573766 = String(_0xca81c6 || '').trim();
  if (!_0x573766) return { w: 0, h: 0 };
  const _0x8f8b5f = _0x573766.match(/(\d+(?:\.\d+)?)\s*[:：xX/]\s*(\d+(?:\.\d+)?)/);
  if (!_0x8f8b5f) return { w: 0, h: 0 };
  const _0x4cdefc = _asPositiveNumber(_0x8f8b5f[1]),
    _0x82baac = _asPositiveNumber(_0x8f8b5f[2]);
  return { w: _0x4cdefc, h: _0x82baac };
}
function _resolveMediaResultSize(_0x2ffd5d) {
  if (!_0x2ffd5d || typeof _0x2ffd5d !== 'object') return { w: 0, h: 0 };
  if (isNodeType(_0x2ffd5d, 'source-image'))
    return { w: _asPositiveNumber(_0x2ffd5d.imageWidth), h: _asPositiveNumber(_0x2ffd5d.imageHeight) };
  if (isNodeType(_0x2ffd5d, 'source-video'))
    return {
      w: _asPositiveNumber(_0x2ffd5d.selectedVideoWidth) || _asPositiveNumber(_0x2ffd5d.videoWidth),
      h: _asPositiveNumber(_0x2ffd5d.selectedVideoHeight) || _asPositiveNumber(_0x2ffd5d.videoHeight),
    };
  if (isNodeType(_0x2ffd5d, 'ai-image')) {
    const _0x21b784 = _pickMainResultItem(_0x2ffd5d.images, _0x2ffd5d.mainImageIndex);
    let _0x1119f4 =
        _asPositiveNumber(_0x21b784?.imageWidth) ||
        _asPositiveNumber(_0x21b784?.width) ||
        _asPositiveNumber(_0x2ffd5d.imageWidth),
      _0x15209d =
        _asPositiveNumber(_0x21b784?.imageHeight) ||
        _asPositiveNumber(_0x21b784?.height) ||
        _asPositiveNumber(_0x2ffd5d.imageHeight);
    if (!(_0x1119f4 > 0 && _0x15209d > 0)) {
      const _0x44cc4d = _parseAspectRatio(_0x2ffd5d.aspectRatio);
      ((_0x1119f4 = _0x44cc4d.w), (_0x15209d = _0x44cc4d.h));
    }
    return (
      !(_0x1119f4 > 0 && _0x15209d > 0) &&
        ((_0x1119f4 = _asPositiveNumber(_0x2ffd5d.width)), (_0x15209d = _asPositiveNumber(_0x2ffd5d.height))),
      { w: _0x1119f4, h: _0x15209d }
    );
  }
  if (isNodeType(_0x2ffd5d, 'ai-video')) {
    const _0x1bcaf2 = _pickMainResultItem(_0x2ffd5d.videos, _0x2ffd5d.mainVideoIndex);
    let _0x5496a0 =
        _asPositiveNumber(_0x2ffd5d.selectedVideoWidth) ||
        _asPositiveNumber(_0x1bcaf2?.videoWidth) ||
        _asPositiveNumber(_0x2ffd5d.videoWidth),
      _0x1f437d =
        _asPositiveNumber(_0x2ffd5d.selectedVideoHeight) ||
        _asPositiveNumber(_0x1bcaf2?.videoHeight) ||
        _asPositiveNumber(_0x2ffd5d.videoHeight);
    if (!(_0x5496a0 > 0 && _0x1f437d > 0)) {
      const _0x26d933 = _parseAspectRatio(_0x2ffd5d.aspectRatio);
      ((_0x5496a0 = _0x26d933.w), (_0x1f437d = _0x26d933.h));
    }
    return (
      !(_0x5496a0 > 0 && _0x1f437d > 0) &&
        ((_0x5496a0 = _asPositiveNumber(_0x2ffd5d.width)), (_0x1f437d = _asPositiveNumber(_0x2ffd5d.height))),
      { w: _0x5496a0, h: _0x1f437d }
    );
  }
  return { w: 0, h: 0 };
}
function _resolveSourceMediaResetSize(_0x4e7c5c) {
  if (!_0x4e7c5c || typeof _0x4e7c5c !== 'object') return getNodeDefaultSize('source-image');
  const { w: _0x302de5, h: _0x51014b } = _resolveMediaResultSize(_0x4e7c5c);
  if (_0x302de5 > 0 && _0x51014b > 0) {
    if (isNodeType(_0x4e7c5c, ['ai-image', 'ai-video'])) return getAIGenerationNodeSize(_0x302de5, _0x51014b);
    return getAutoMediaSizeByShortSide(_0x302de5, _0x51014b);
  }
  if (isNodeType(_0x4e7c5c, ['ai-image', 'ai-video'])) return getAIGenerationNodeSize();
  if (isNodeType(_0x4e7c5c, 'source-video')) return getNodeDefaultSize('source-video');
  if (isNodeType(_0x4e7c5c, 'source-image')) return getNodeDefaultSize('source-image');
  return getNodeDefaultSize('source-image');
}
function _getAiGenerationMenuItem(_0x1a82b2, _0x29188e, _0x13eefb = _0x29188e) {
  const _0x28fbff = getAIGenerationDefaultSizeByType(_0x1a82b2);
  return { label: _0x29188e, name: _0x13eefb, type: _0x1a82b2, w: _0x28fbff.width, h: _0x28fbff.height };
}
function _getAiGenerationActionLabel(_0x1f9c49) {
  if (_0x1f9c49 === 'ai-image') return t('canvasInteraction.generation.image');
  if (_0x1f9c49 === 'ai-video') return t('canvasInteraction.generation.video');
  if (_0x1f9c49 === 'ai-audio') return t('canvasInteraction.generation.audio');
  return t('canvasInteraction.generation.text');
}
function _getAiGenerationNodeName(_0x3bb72f) {
  if (_0x3bb72f === 'ai-image') return t('canvasInteraction.generationNames.image');
  if (_0x3bb72f === 'ai-video') return t('canvasInteraction.generationNames.video');
  if (_0x3bb72f === 'ai-audio') return t('canvasInteraction.generationNames.audio');
  return t('canvasInteraction.generationNames.text');
}
const STORYBOARD_QUICK_CREATE_PRESETS = Object.freeze([
  {
    labelKey: 'canvasInteraction.grids.grid4',
    nameKey: 'canvasInteraction.grids.grid4',
    cols: 2,
    rows: 2,
    baseShortSide: 0x190,
  },
  {
    labelKey: 'canvasInteraction.grids.grid9',
    nameKey: 'canvasInteraction.grids.grid9',
    cols: 3,
    rows: 3,
    baseShortSide: 0x1c2,
  },
  {
    labelKey: 'canvasInteraction.grids.grid16',
    nameKey: 'canvasInteraction.grids.grid16',
    cols: 4,
    rows: 4,
    baseShortSide: 0x1f4,
  },
  {
    labelKey: 'canvasInteraction.grids.grid25',
    nameKey: 'canvasInteraction.grids.grid25',
    cols: 5,
    rows: 5,
    baseShortSide: 0x226,
  },
]);
function _createQuickStoryboardNodeFromPrimary(_0x3bbe32, _0x8b92db, _0x5840f2) {
  if (!_0x8b92db || !_0x5840f2) return;
  const _0x58e909 = resolveStoryboardSourceImageRef(_0x8b92db);
  if (!_0x58e909) return;
  const _0x43a928 = generateId('storyboard'),
    { nodes: _0x44510e } = getStateRaw(),
    _0xd78389 = computeQuickCreateStoryboardSize({
      sourceWidth: _0x8b92db.width,
      sourceHeight: _0x8b92db.height,
      baseShortSide: _0x5840f2.baseShortSide,
    }),
    _0x1e3f04 = calcSafeSpawnPosNearNode(_0x44510e, _0x8b92db, _0xd78389.width, _0xd78389.height),
    _0x5cb365 = buildStoryboardNodePayload({
      id: _0x43a928,
      name: t(_0x5840f2.nameKey),
      x: _0x1e3f04.x,
      y: _0x1e3f04.y,
      width: _0xd78389.width,
      height: _0xd78389.height,
      cols: _0x5840f2.cols,
      rows: _0x5840f2.rows,
      aspectRatio: resolveNearestStoryboardAspect(_0x8b92db.width, _0x8b92db.height),
      cells: buildQuickCreateStoryboardCells({
        cols: _0x5840f2.cols,
        rows: _0x5840f2.rows,
        imageRef: _0x58e909,
      }),
    });
  (graphStore.addNode(_0x5cb365),
    graphStore.setSelectedNodes([_0x43a928]),
    commit(),
    window.v2FocusOnNodes && requestAnimationFrame(() => window.v2FocusOnNodes([_0x3bbe32, _0x43a928])));
}
function _createCollageNodeFromSelection(_0x3119f1) {
  const _0x84ca35 = Array.isArray(_0x3119f1) ? _0x3119f1 : [],
    { nodes: _0x2d00e5 } = getStateRaw(),
    _0x3c17e6 = _0x84ca35.map((_0x5e70ec) => _0x2d00e5[_0x5e70ec]).filter(Boolean),
    _0x1f4005 = _0x3c17e6.filter(isCollageImageNode);
  if (_0x1f4005.length === 0)
    return (window.showToast?.(t('canvasInteraction.grids.noImages'), 'warning'), null);
  const _0x42d669 = generateId('collage'),
    _0x460f6c = buildCollageNodeDataFromSelection({
      id: _0x42d669,
      nodes: _0x1f4005,
      name: t('canvasInteraction.grids.collageName'),
    });
  if (!_0x460f6c) return (window.showToast?.(t('canvasInteraction.grids.boundsFailed'), 'error'), null);
  const _0x52417f = calcSafeSpawnPosNearNode(_0x2d00e5, _0x460f6c, _0x460f6c.width, _0x460f6c.height);
  return (
    graphStore.addNode({ ..._0x460f6c, x: _0x52417f.x, y: _0x52417f.y }),
    graphStore.setSelectedNodes([_0x42d669]),
    commit(),
    window.v2FocusOnNodes &&
      requestAnimationFrame(() =>
        window.v2FocusOnNodes([..._0x1f4005.map((_0x100157) => _0x100157.id), _0x42d669]),
      ),
    window.showToast?.(t('canvasInteraction.grids.created'), 'success'),
    _0x42d669
  );
}
function _clearStoryboardHighlight(_0x51ebe4) {
  if (!_0x51ebe4) return;
  const _0x483689 = window.v2Renderer?.nodeInstances?.get(_0x51ebe4);
  if (_0x483689 && typeof _0x483689.highlightCell === 'function') _0x483689.highlightCell(-1);
}
function _resetDragContext() {
  dragContext?.isDragging && endDragFpsSession('node-drag');
  dragContext?.isPanning && endPanFpsSession('canvas-pan');
  const _0x682b33 = dragContext?.lastHoverNodeId || null;
  if (_0x682b33) _clearStoryboardHighlight(_0x682b33);
  ((dragContext = _createIdleDragContext()),
    document.body.classList.remove(
      'is-panning',
      'is-dragging',
      'is-edge-interaction-lite',
      'is-dragging-heavy-edges',
    ),
    document
      .querySelectorAll('.is-ui-hidden')
      .forEach((_0x502ff5) => _0x502ff5.classList.remove('is-ui-hidden')),
    document
      .querySelectorAll('.v2-node.is-dragging')
      .forEach((_0x2ac9e1) => _0x2ac9e1.classList.remove('is-dragging')),
    stopAutoPan(),
    _sampledPointerMove?.cancel?.(),
    cancelPendingViewportUpdate(),
    cancelViewportPanPreview());
}
function _resetCellDragContext() {
  const _0x4e9e17 = dragContext?.lastHoverNodeId || null;
  if (_0x4e9e17) _clearStoryboardHighlight(_0x4e9e17);
  (dragContext?.sourceCellEl && dragContext.sourceCellEl.classList.remove('is-drag-source'),
    dragContext?.ghostEl?.remove?.(),
    (dragContext = _createIdleDragContext()),
    document.body.classList.remove(
      'is-panning',
      'is-dragging',
      'is-edge-interaction-lite',
      'is-dragging-heavy-edges',
    ),
    stopAutoPan(),
    _sampledPointerMove?.cancel?.(),
    cancelPendingViewportUpdate(),
    cancelViewportPanPreview());
}
function _deferCommit() {
  requestAnimationFrame(() => {
    setTimeout(() => commit(), 0);
  });
}
const dragController = createDragController({
    store: appStore,
    isNodeType: isNodeType,
    getShortcuts: getShortcuts,
    hitTestNode: hitTestNode,
    screenToWorld: screenToWorld,
    generateId: generateId,
    cloneNodesWithEdges: cloneNodesWithEdges,
    commit: commit,
  }),
  edgeController = createEdgeController(),
  selectionController = createSelectionController({
    store: appStore,
    screenToWorld: screenToWorld,
    isNodeType: isNodeType,
    isValidConnection: isValidConnection_2,
  }),
  wheelViewportPreview = createViewportPreviewCoordinator({
    beginPreview: beginViewportPanPreview,
    updatePreview: (_0x2f61a4) => {
      updateViewportPanPreview(_0x2f61a4.x, _0x2f61a4.y, _0x2f61a4.zoom);
    },
    flushPreview: flushViewportPanPreview,
    getPreview: getViewportPanPreview,
    isPreviewActive: isViewportPanPreviewActive,
  }),
  zoomController = createZoomController({ store: appStore }),
  wheelPanController = createWheelPanController({
    store: appStore,
    viewportPreview: wheelViewportPreview,
  }),
  interactionCommandAdapter = createInteractionCommandAdapter({
    store: appStore,
    graphStore: graphStore,
    uiStore: uiStore,
    commit: commit,
    buildNodeData: buildAppCanvasNodeData,
    getNodeDefaultSize: getNodeDefaultSize,
    getAIGenerationDefaultSizeByType: getAIGenerationDefaultSizeByType,
    getAIGenerationNodeSize: getAIGenerationNodeSize,
    connectNodes: addEdgeWithPolicies,
    clipboard: {
      getClipboard: getClipboard,
      getClipboardGraph: getClipboardGraph,
      setClipboard: setClipboard,
    },
    focusNodes: (_0x4faaf2) => window.v2FocusOnNodes?.(_0x4faaf2),
    translate: t,
    showToast: (..._0x18ec7c) => window.showToast?.(..._0x18ec7c),
    scheduleFrame: (_0x4da98c) => requestAnimationFrame(_0x4da98c),
    windowObject: typeof window !== 'undefined' ? window : null,
  });
setDragContextGetter(() => dragContext);
let viewportRafId = null,
  pendingViewportUpdate = null,
  assistPanMirrorTimer = 0,
  pendingAssistPanMirrorViewport = null;
function syncSidePlusToLastPointer(_0x4687f7 = {}) {
  const _0x50998d =
    typeof window !== 'undefined' && typeof window._v2UpdateSidePlusNow === 'function'
      ? window._v2UpdateSidePlusNow
      : typeof window !== 'undefined'
        ? window._v2UpdateSidePlus
        : null;
  typeof _0x50998d === 'function' && _0x50998d(lastMouseScreenX, lastMouseScreenY, _0x4687f7);
}
function updateViewportBatched(_0x5287a1, _0x22aa88, _0xc1ec8b) {
  ((pendingViewportUpdate = { x: _0x5287a1, y: _0x22aa88, zoom: _0xc1ec8b }),
    !viewportRafId && (viewportRafId = requestAnimationFrame(flushViewportUpdate)));
}
function flushViewportUpdate() {
  viewportRafId = null;
  if (pendingViewportUpdate) {
    const { x: _0x10a312, y: _0x58fbc4, zoom: _0x24d946 } = pendingViewportUpdate;
    ((pendingViewportUpdate = null),
      graphStore.updateViewport(_0x10a312, _0x58fbc4, _0x24d946),
      syncSidePlusToLastPointer());
  }
}
function cancelPendingViewportUpdate() {
  (viewportRafId && (cancelAnimationFrame(viewportRafId), (viewportRafId = null)),
    (pendingViewportUpdate = null));
}
function flushAssistPanStoreMirror() {
  assistPanMirrorTimer = 0;
  const _0x1931e9 = pendingAssistPanMirrorViewport;
  pendingAssistPanMirrorViewport = null;
  if (!_0x1931e9 || !dragContext?.assistPanActive) return;
  (graphStore.updateViewport(_0x1931e9.x, _0x1931e9.y, _0x1931e9.zoom), syncSidePlusToLastPointer());
}
function scheduleAssistPanStoreMirror(_0x2e437d) {
  pendingAssistPanMirrorViewport = _0x2e437d ? { ..._0x2e437d } : null;
  if (assistPanMirrorTimer) return;
  assistPanMirrorTimer = window.setTimeout(flushAssistPanStoreMirror, 32);
}
function cancelAssistPanStoreMirror() {
  (assistPanMirrorTimer && (window.clearTimeout(assistPanMirrorTimer), (assistPanMirrorTimer = 0)),
    (pendingAssistPanMirrorViewport = null));
}
function _commitAssistPanPreview() {
  if (!dragContext?.assistPanActive) return null;
  const _0x51f1bc = flushViewportPanPreview();
  (cancelAssistPanStoreMirror(),
    (dragContext.assistPanActive = false),
    (dragContext.assistPanViewport = null),
    cancelPendingViewportUpdate(),
    window._v2FlushMinimapViewportPreview?.(_0x51f1bc));
  if (!_0x51f1bc) return (syncSidePlusToLastPointer(), null);
  const _0x141d81 = () => {
    (graphStore.updateViewport(_0x51f1bc.x, _0x51f1bc.y, _0x51f1bc.zoom), graphStore.markViewportPersist?.());
  };
  return (
    typeof graphStore.batch === 'function' ? graphStore.batch(_0x141d81) : _0x141d81(),
    syncSidePlusToLastPointer(),
    _0x51f1bc
  );
}
let autoPanReqId = null,
  autoPanState = { dx: 0, dy: 0 },
  lastMouseScreenX = 0,
  lastMouseScreenY = 0,
  _autoPanPendingDx = 0,
  _autoPanPendingDy = 0;
export function stopAutoPan() {
  autoPanReqId && (cancelAnimationFrame(autoPanReqId), (autoPanReqId = null));
}
function autoPanLoop() {
  if (!autoPanReqId) return;
  const { viewport: _0x724857 } = getStateRaw(),
    _0x227475 = _autoPanPendingDx || autoPanState.dx,
    _0xe40de7 = _autoPanPendingDy || autoPanState.dy;
  (_0x227475 !== autoPanState.dx || _0xe40de7 !== autoPanState.dy) &&
    ((autoPanState.dx = _0x227475), (autoPanState.dy = _0xe40de7));
  ((_autoPanPendingDx = 0), (_autoPanPendingDy = 0));
  const _0x3829eb = _0x724857.x - autoPanState.dx,
    _0x305486 = _0x724857.y - autoPanState.dy;
  updateViewportBatched(_0x3829eb, _0x305486, _0x724857.zoom);
  if (dragContext.isDragging) {
    const _0x2f981a = getStateRaw(),
      { nodes: _0x388959 } = _0x2f981a,
      { x: _0x5a2673, y: _0x26a940 } = screenToWorld(lastMouseScreenX, lastMouseScreenY, {
        x: _0x3829eb,
        y: _0x305486,
        zoom: _0x724857.zoom,
      });
    dragController.updateDraggingNodes(
      dragContext,
      lastMouseScreenX,
      lastMouseScreenY,
      _0x5a2673,
      _0x26a940,
      _0x5a2673,
      _0x26a940,
      _0x2f981a,
    );
  }
  autoPanReqId = requestAnimationFrame(autoPanLoop);
}
function checkAutoPan(_0xdb1563, _0x44b566) {
  ((lastMouseScreenX = _0xdb1563), (lastMouseScreenY = _0x44b566));
  if (!dragContext.isDragging && !dragContext.isBoxSelecting && !dragContext.isConnecting) {
    stopAutoPan();
    return;
  }
  const _0x157340 = 60,
    _0x467a07 = 15;
  let _0x23a609 = 0,
    _0x30883a = 0;
  if (_0xdb1563 < _0x157340) _0x23a609 = -_0x467a07;
  else {
    if (_0xdb1563 > window.innerWidth - _0x157340) _0x23a609 = _0x467a07;
  }
  if (_0x44b566 < _0x157340) _0x30883a = -_0x467a07;
  else {
    if (_0x44b566 > window.innerHeight - _0x157340) _0x30883a = _0x467a07;
  }
  _0x23a609 !== 0 || _0x30883a !== 0
    ? ((_autoPanPendingDx = _0x23a609),
      (_autoPanPendingDy = _0x30883a),
      !autoPanReqId && (autoPanReqId = requestAnimationFrame(autoPanLoop)))
    : stopAutoPan();
}
export function handlePointerDown(
  _0x287cf4,
  _0x1a2b0d,
  _0x572780 = false,
  _0x3d0898 = false,
  _0x13c365 = null,
) {
  ((lastMouseScreenX = _0x287cf4), (lastMouseScreenY = _0x1a2b0d));
  const _0x3bcb19 = getStateRaw(),
    { viewport: _0x59a1df } = _0x3bcb19,
    { x: _0x123c5e, y: _0x483cd7 } = screenToWorld(_0x287cf4, _0x1a2b0d, _0x59a1df),
    _0x3d45e4 = _0x3bcb19.pickConnectMode;
  if (_0x3d45e4 && _0x3d45e4.active) {
    if (_0x13c365?.button === 2) {
      (_0x13c365.stopPropagation?.(), _0x13c365.stopImmediatePropagation?.());
      return;
    }
    const _0x577ceb = _0x13c365 && _0x13c365.target && _0x13c365.target.closest('.v2-node');
    if (_0x577ceb) return;
  }
  if (!_0x572780 && dragController.tryStartTitleDrag(dragContext, _0x13c365, _0x123c5e, _0x483cd7)) {
    beginDragFpsSession('node-drag');
    return;
  }
  if (
    !_0x572780 &&
    edgeController.tryStartHandleConnect(dragContext, _0x13c365, _0x123c5e, _0x483cd7, _0x59a1df)
  )
    return;
  if (_0x572780) {
    ((dragContext.isPanning = true),
      (dragContext.panStartX = _0x287cf4),
      (dragContext.panStartY = _0x1a2b0d),
      (dragContext.panStartViewportX = _0x59a1df.x),
      (dragContext.panStartViewportY = _0x59a1df.y),
      (dragContext.panStartZoom = _0x59a1df.zoom),
      (dragContext.panStartPerf = nowMs()),
      (dragContext.panMoveCount = 0),
      (dragContext.panMinimapPreviewCount = Number(window._v2GetMinimapPreviewFlushCount?.()) || 0),
      markViewportInteractionBusyForRenderer(),
      beginPanFpsSession('canvas-pan'),
      beginViewportPanPreview(_0x59a1df),
      window._v2ScheduleMinimapViewportPreview?.(_0x59a1df, { force: true }),
      document.body.classList.add('is-panning'),
      _setEdgeInteractionLite(_shouldUseEdgeInteractionLite(_0x3bcb19)));
    return;
  }
  if (
    dragController.tryStartNodeDrag(
      dragContext,
      _0x287cf4,
      _0x1a2b0d,
      _0x123c5e,
      _0x483cd7,
      _0x3d0898,
      _0x13c365,
    )
  ) {
    dragContext.isDragging && beginDragFpsSession('node-drag');
    return;
  }
  if (!_0x572780 && !_0x13c365?.ctrlKey) {
    selectionController.startBoxSelecting(dragContext, _0x287cf4, _0x1a2b0d);
    return;
  }
}
function _handlePointerMoveImpl(_0x2bfcc5, _0x1cefcc, _0x157406 = false, _0x4450fe = null) {
  const _0x13acd5 = lastMouseScreenX,
    _0x55159a = lastMouseScreenY;
  ((lastMouseScreenX = _0x2bfcc5), (lastMouseScreenY = _0x1cefcc));
  if (dragContext.isPanning) {
    const _0x2cc3df = _0x2bfcc5 - dragContext.panStartX,
      _0x3e8076 = _0x1cefcc - dragContext.panStartY,
      _0x522fc6 = {
        x: dragContext.panStartViewportX + _0x2cc3df,
        y: dragContext.panStartViewportY + _0x3e8076,
        zoom: dragContext.panStartZoom,
      };
    ((dragContext.panMoveCount = (dragContext.panMoveCount || 0) + 1),
      updateViewportPanPreview(_0x522fc6.x, _0x522fc6.y, _0x522fc6.zoom),
      window._v2ScheduleMinimapViewportPreview?.(_0x522fc6));
    return;
  }
  dragContext.assistPanActive && !_0x157406 && _commitAssistPanPreview();
  let _0x5c632b = getStateRaw(),
    { viewport: _0x51baac, nodes: _0x354d67 } = _0x5c632b;
  if ((dragContext.isDragging || dragContext.isConnecting) && _0x157406) {
    stopAutoPan();
    if (!dragContext.assistPanActive) {
      (flushViewportUpdate(),
        (_0x5c632b = getStateRaw()),
        ({ viewport: _0x51baac, nodes: _0x354d67 } = _0x5c632b));
      const _0xc4f79b = { ..._0x51baac };
      ((dragContext.assistPanActive = true),
        (dragContext.assistPanViewport = _0xc4f79b),
        beginViewportPanPreview(_0xc4f79b),
        window._v2ScheduleMinimapViewportPreview?.(_0xc4f79b, { force: true }));
    }
    const _0x4a7d6b = _0x2bfcc5 - _0x13acd5,
      _0x83f551 = _0x1cefcc - _0x55159a,
      _0x383aa1 = dragContext.assistPanViewport || _0x51baac,
      _0x53cccc = { x: _0x383aa1.x + _0x4a7d6b, y: _0x383aa1.y + _0x83f551, zoom: _0x383aa1.zoom };
    ((dragContext.assistPanViewport = _0x53cccc),
      updateViewportPanPreview(_0x53cccc.x, _0x53cccc.y, _0x53cccc.zoom),
      scheduleAssistPanStoreMirror(_0x53cccc),
      window._v2ScheduleMinimapViewportPreview?.(_0x53cccc));
    const { x: _0x46d3f0, y: _0x2aa75c } = screenToWorld(_0x2bfcc5, _0x1cefcc, _0x53cccc);
    if (dragContext.isConnecting) {
      edgeController.updateHandleConnect(
        dragContext,
        _0x2bfcc5,
        _0x1cefcc,
        _0x46d3f0,
        _0x2aa75c,
        _0x53cccc,
        _0x354d67,
        _0x5c632b.connOverlay,
      );
      return;
    }
    const _0x3a9d2e = { ..._0x5c632b, viewport: _0x53cccc };
    dragController.updateDraggingNodes(
      dragContext,
      _0x2bfcc5,
      _0x1cefcc,
      _0x46d3f0,
      _0x2aa75c,
      _0x46d3f0,
      _0x2aa75c,
      _0x3a9d2e,
    );
    return;
  }
  let { x: _0x323ff5, y: _0x411bdd } = screenToWorld(_0x2bfcc5, _0x1cefcc, _0x51baac);
  const _0x46ce48 = _0x323ff5,
    _0x35a94e = _0x411bdd;
  if (isCuttingMode && _0x4450fe && _0x4450fe.buttons === 1) {
    if (lastCutPos) {
      const _0x1c357e = getStateRaw(),
        _0x191bc6 = [];
      for (const [_0x4f448a, _0x466318] of Object.entries(_0x1c357e.edges)) {
        const _0x46a35c = _0x1c357e.nodes[_0x466318.sourceId],
          _0x4f8ca1 = _0x1c357e.nodes[_0x466318.targetId];
        if (!_0x46a35c || !_0x4f8ca1) continue;
        const _0x57ed9e = _0x46a35c.x + (_0x46a35c.width || 0x104),
          _0x4142f0 = _0x46a35c.y + (_0x46a35c.height || 100) / 2,
          _0x382ddf = _0x4f8ca1.x,
          _0xe575e4 = _0x4f8ca1.y + (_0x4f8ca1.height || 100) / 2,
          _0x2400a7 = checkBBoxIntersection(
            lastCutPos.x,
            lastCutPos.y,
            _0x323ff5,
            _0x411bdd,
            _0x57ed9e,
            _0x4142f0,
            _0x382ddf,
            _0xe575e4,
          );
        if (!_0x2400a7) continue;
        const _0x22112b = checkLineIntersection(
          lastCutPos.x,
          lastCutPos.y,
          _0x323ff5,
          _0x411bdd,
          _0x57ed9e,
          _0x4142f0,
          _0x382ddf,
          _0xe575e4,
        );
        _0x22112b && _0x191bc6.push(_0x4f448a);
      }
      _0x191bc6.length > 0 && graphStore.updateEdgesBatch(_0x191bc6, []);
    }
    lastCutPos = { x: _0x323ff5, y: _0x411bdd };
    return;
  } else lastCutPos = null;
  if (dragContext.isConnecting) {
    edgeController.updateHandleConnect(
      dragContext,
      _0x2bfcc5,
      _0x1cefcc,
      _0x323ff5,
      _0x411bdd,
      _0x51baac,
      _0x354d67,
      _0x5c632b.connOverlay,
    );
    return;
  }
  if (dragContext.isBoxSelecting) {
    selectionController.updateBoxSelecting(dragContext, _0x2bfcc5, _0x1cefcc);
    return;
  }
  if (dragContext.isDraggingCell) {
    dragController.updateDraggingCell(dragContext, _0x2bfcc5, _0x1cefcc, _0x323ff5, _0x411bdd, _0x354d67);
    return;
  }
  if (!dragContext.isDragging) return;
  (dragController.updateDraggingNodes(
    dragContext,
    _0x2bfcc5,
    _0x1cefcc,
    _0x323ff5,
    _0x411bdd,
    _0x46ce48,
    _0x35a94e,
    _0x5c632b,
  ),
    checkAutoPan(_0x2bfcc5, _0x1cefcc));
}
const _sampledPointerMove = rafSampleLatest(_handlePointerMoveImpl);
export function handlePointerMove(_0x151ac8, _0x37d159, _0x4a9542 = null) {
  const _0x3afcba = _0x4a9542?.__aiCanvasLeftDragHeld === true;
  if (_0x4a9542 && _0x4a9542.buttons === 0 && !_0x3afcba) {
    if (
      dragContext.isDragging ||
      dragContext.isPanning ||
      dragContext.isConnecting ||
      dragContext.isBoxSelecting ||
      dragContext.isDraggingCell
    ) {
      handlePointerUp(_0x151ac8, _0x37d159);
      return;
    }
  }
  if (_0x3afcba && dragContext.assistPanActive) {
    (_sampledPointerMove.cancel?.(), _handlePointerMoveImpl(_0x151ac8, _0x37d159, false, _0x4a9542));
    return;
  }
  const _0x4c7e9b = !!(_0x4a9542 && (_0x4a9542.buttons & 4) !== 0),
    _0x160995 =
      (dragContext.isDragging || dragContext.isConnecting) && (_0x4c7e9b || window._spaceHeld === true);
  _sampledPointerMove(_0x151ac8, _0x37d159, _0x160995, _0x4a9542);
}
export function handlePointerUp(_0x4bd087 = 0, _0x16cc0f = 0) {
  if (
    !dragContext.isDragging &&
    !dragContext.isPanning &&
    !dragContext.isConnecting &&
    !dragContext.isBoxSelecting &&
    !dragContext.isDraggingCell
  )
    return;
  let _0x204d4b = false;
  const _0xdb97a9 = !!dragContext.isPanning,
    _0x715a7c = dragContext.panStartPerf || nowMs(),
    _0x5b4cee = dragContext.panMoveCount || 0,
    _0xba2cd7 = dragContext.panMinimapPreviewCount || 0;
  stopAutoPan();
  if (_0xdb97a9) {
    markViewportInteractionBusyForRenderer();
    const _0x29ad82 = flushViewportPanPreview(),
      _0x38e706 =
        Number(window._v2FlushMinimapViewportPreview?.(_0x29ad82)) ||
        Number(window._v2GetMinimapPreviewFlushCount?.()) ||
        _0xba2cd7;
    (endPanFpsSession('canvas-pan'), cancelPendingViewportUpdate());
    const _0x25f1e4 = () => {
      (_0x29ad82 && graphStore.updateViewport(_0x29ad82.x, _0x29ad82.y, _0x29ad82.zoom),
        graphStore.markViewportPersist());
    };
    typeof graphStore.batch === 'function' ? graphStore.batch(_0x25f1e4) : _0x25f1e4();
    const _0x1d30a6 =
        (typeof graphStore.getStateRaw === 'function' && graphStore.getStateRaw()) || getStateRaw(),
      _0x255d5c = _0x29ad82 || _0x1d30a6?.viewport || {};
    recordCanvasPanSample({
      durationMs: nowMs() - _0x715a7c,
      moveCount: _0x5b4cee,
      committed: !!_0x29ad82,
      nodeCount: Number.isFinite(_0x1d30a6?._nodeCount)
        ? _0x1d30a6._nodeCount
        : Object.keys(_0x1d30a6?.nodes || {}).length,
      edgeCount: Object.keys(_0x1d30a6?.edges || {}).length,
      mountedNodeCount: getMountedNodeCountForPerf(),
      minimapPreviewCount: Math.max(0, _0x38e706 - _0xba2cd7),
      finalX: _0x255d5c.x,
      finalY: _0x255d5c.y,
      finalZoom: _0x255d5c.zoom,
    });
  } else dragContext.assistPanActive ? _commitAssistPanPreview() : flushViewportUpdate();
  if (dragContext.isDraggingCell) {
    const _0x49281c = dragController.finishDraggingCell(dragContext, _0x4bd087, _0x16cc0f);
    _resetCellDragContext();
    if (_0x49281c.didAct) _deferCommit();
    return;
  }
  if (dragContext.isConnecting)
    _0x204d4b = edgeController.finishHandleConnect(dragContext, _0x4bd087, _0x16cc0f) || _0x204d4b;
  else {
    if (dragContext.isBoxSelecting) {
      const _0x2994a0 = selectionController.finishBoxSelecting(dragContext, _0x4bd087, _0x16cc0f);
      _0x204d4b = _0x2994a0.didAct || _0x204d4b;
    } else {
      if (dragContext.isDragging) {
        const _0x57ed74 = dragController.finishDraggingNodes(dragContext, _0x4bd087, _0x16cc0f);
        if (_0x57ed74.earlyCommit) {
          (window._clearSnapGuideLines?.(), _resetDragContext());
          return;
        }
        _0x204d4b = _0x57ed74.didAct || _0x204d4b;
      }
    }
  }
  (window._clearSnapGuideLines?.(), _resetDragContext());
  _0xdb97a9 && syncSidePlusToLastPointer();
  if (_0x204d4b) commit();
}
export function handleWheel(_0x35cc98, _0x1f9727, _0x1a360a) {
  zoomController.handleWheel(_0x35cc98, _0x1f9727, _0x1a360a);
}
export function handleWheelPan(_0x340ba0, _0x4847ca, _0x29e9eb) {
  return wheelPanController.handleWheelPan(_0x340ba0, _0x4847ca, _0x29e9eb);
}
export function settleWheelZoom() {
  return flushViewportUpdate();
}
export function settleWheelPan() {
  return wheelPanController.settleWheelPan();
}
export function executeCanvasCommand(_0x119242, _0x2e6b49 = {}) {
  return interactionCommandAdapter.executeCanvasCommand(_0x119242, _0x2e6b49);
}
export function getDragContext() {
  return { ...dragContext };
}
export function getInteractionRenderState() {
  return {
    isDragging: !!dragContext.isDragging,
    isDraggingCell: !!dragContext.isDraggingCell,
    isCommittingDrag: dragContext.isCommittingDrag === true,
    isPanning: !!dragContext.isPanning,
    assistPanActive: !!dragContext.assistPanActive,
    targetNodeId: dragContext.targetNodeId || null,
    pendingDx: Number.isFinite(dragContext.pendingDx) ? dragContext.pendingDx : 0,
    pendingDy: Number.isFinite(dragContext.pendingDy) ? dragContext.pendingDy : 0,
    hasMoved: !!dragContext.hasMoved,
    wasSelectedOnDown: !!dragContext.wasSelectedOnDown,
  };
}
export function handleDoubleClick(_0x14a175, _0x56e5fb) {
  const { viewport: _0x390385, nodes: _0xea3627 } = getStateRaw(),
    { x: _0x3a8987, y: _0x170784 } = screenToWorld(_0x14a175, _0x56e5fb, _0x390385);
  for (const _0x4d090c of Object.values(_0xea3627)) {
    const _0x21eef0 = isPointInRect(
      _0x3a8987,
      _0x170784,
      _0x4d090c.x,
      _0x4d090c.y,
      _0x4d090c.width,
      _0x4d090c.height,
    );
    if (_0x21eef0) return;
  }
  uiStore.showPicker(_0x14a175, _0x56e5fb, _0x3a8987, _0x170784);
}
export function handleContextMenu(_0x4cbcf7, _0x4ca990) {
  const _0x4c5cdf = getStateRaw(),
    _0x5b6ae2 = hitTestNode(_0x4cbcf7, _0x4ca990, _0x4c5cdf.nodes, _0x4c5cdf.viewport);
  if (!_0x5b6ae2) return;
  const _0x475e16 = _0x4c5cdf.selectedNodeIds || [];
  !_0x475e16.includes(_0x5b6ae2) && graphStore.setSelectedNodes([_0x5b6ae2]);
  const _0x2260bd = getStateRaw();
  showNodesContextMenu(_0x4cbcf7, _0x4ca990, {
    primaryNodeId: _0x5b6ae2,
    targetNodeIds: _0x2260bd.selectedNodeIds,
  });
}
function calcNodesBBox(_0x4736d9, _0x5dbcc9) {
  let _0x4cb8a3 = Infinity,
    _0x238554 = Infinity,
    _0x2bb8df = -Infinity,
    _0x1d1f17 = -Infinity;
  for (const _0x5beacd of _0x5dbcc9) {
    const _0x336625 = _0x4736d9[_0x5beacd];
    if (!_0x336625) continue;
    const _0x4f56b9 = _0x336625.width || 0x104,
      _0xc60d0d = _0x336625.height || 100;
    ((_0x4cb8a3 = Math.min(_0x4cb8a3, _0x336625.x)),
      (_0x238554 = Math.min(_0x238554, _0x336625.y)),
      (_0x2bb8df = Math.max(_0x2bb8df, _0x336625.x + _0x4f56b9)),
      (_0x1d1f17 = Math.max(_0x1d1f17, _0x336625.y + _0xc60d0d)));
  }
  if (_0x4cb8a3 === Infinity) return null;
  return { x: _0x4cb8a3, y: _0x238554, width: _0x2bb8df - _0x4cb8a3, height: _0x1d1f17 - _0x238554 };
}
function showNodesContextMenu(_0x361e2e, _0x4f4904, _0x5912c5) {
  removeContextMenus();
  const _0x508c6d = getStateRaw(),
    { nodes: _0x25f1fe } = _0x508c6d,
    _0xa6439a = Array.isArray(_0x5912c5?.targetNodeIds) ? _0x5912c5.targetNodeIds : [],
    _0x592d17 = _0xa6439a.filter((_0x422139) => !!_0x25f1fe[_0x422139]);
  if (_0x592d17.length === 0) return;
  const _0x2d44e2 =
      _0x5912c5?.primaryNodeId && _0x25f1fe[_0x5912c5.primaryNodeId] ? _0x5912c5.primaryNodeId : _0x592d17[0],
    _0x5daa21 = _0x2d44e2 ? _0x25f1fe[_0x2d44e2] : null,
    _0x4b28dc = calcNodesBBox(_0x25f1fe, _0x592d17),
    _0x342b20 = [],
    _0xfa722a = (_0x525b19, _0x5a8750, _0x590826) => {
      _0x342b20.push({ label: _0x525b19, kbd: _0x5a8750, action: _0x590826 });
    },
    _0xa6c79d = () => {
      _0x342b20.push('sep');
    },
    _0xe9c94b = (_0x15b0e5, _0x446bf1) => {
      _0x342b20.push({ label: _0x15b0e5, subItems: _0x446bf1 });
    };
  (_0xfa722a(t('canvasInteraction.contextMenu.copyNode'), 'Ctrl C', () => {
    (executeCommand('copy', { ids: [..._0x592d17] }),
      window.showToast?.(t('canvasInteraction.toasts.nodeCopied'), 'success'));
  }),
    _0xfa722a(t('canvasInteraction.contextMenu.cutNode'), 'Ctrl X', () => {
      const _0xc5fa3b = [..._0x592d17];
      (executeCommand('copy', { ids: _0xc5fa3b }),
        executeCommand('delete_nodes', { ids: _0xc5fa3b }),
        window.showToast?.(t('canvasInteraction.toasts.nodeCut'), 'success'));
    }),
    _0xfa722a(t('canvasInteraction.contextMenu.paste'), 'Ctrl V', () => {
      window.dispatchEvent(
        new CustomEvent('v2:canvas-paste-request', { detail: { screenX: _0x361e2e, screenY: _0x4f4904 } }),
      );
    }));
  _0xfa722a('导出选中节点本地媒体…', '', () => {
    import('../modules/nodeExport/NodeMediaExportDialog.js')
      .then(({ openNodeMediaExportDialog }) => openNodeMediaExportDialog(_0x25f1fe, [..._0x592d17]))
      .catch(() => window.showToast?.('媒体导出窗口加载失败', 'error'));
  });
  _0xfa722a('导出视频时间线工程（Premiere XML）…', '', () => {
    import('../modules/timelineExport/TimelineExportDialog.js')
      .then(({ openTimelineExportDialog }) => openTimelineExportDialog(_0x25f1fe, [..._0x592d17]))
      .catch(() => window.showToast?.('时间线导出窗口加载失败', 'error'));
  });
  const _0x3b68b0 = _0x592d17.filter((_0x3b4150) => isCollageImageNode(_0x25f1fe[_0x3b4150]));
  _0x3b68b0.length >= 2 &&
    _0xfa722a(t('canvasInteraction.contextMenu.createCollage'), '', () => {
      _createCollageNodeFromSelection(_0x3b68b0);
    });
  if (_0x5daa21 && _0x592d17.length === 1) {
    const _0x513548 =
      _0x5daa21.type === 'ai-image' || _0x5daa21.type === 'source-image' || _0x5daa21.type === 'storyboard';
    if (_0x513548) {
      const _0x19facf = _0x5daa21.imageUrl || _0x5daa21.sourceUrl || _0x5daa21.src || _0x5daa21.localPath;
      _0x19facf &&
        _0xfa722a(t('canvasInteraction.contextMenu.copyImage'), 'Ctrl+Shift+C', () => {
          (_0x5daa21.id && graphStore.setSelectedNodes([_0x5daa21.id]),
            window.dispatchEvent(new CustomEvent('shortcut-action', { detail: 'copy-media' })));
        });
    }
  }
  const _0x5e5a2b = (_0x18e32e) => {
    if (!_0x2d44e2 || !_0x592d17.length) return;
    const _0x5e2f30 = {
      x: Number.isFinite(Number(_0x18e32e?.clientX)) ? Number(_0x18e32e.clientX) : _0x361e2e,
      y: Number.isFinite(Number(_0x18e32e?.clientY)) ? Number(_0x18e32e.clientY) : _0x4f4904,
    };
    (graphStore.setSelectedNodes([..._0x592d17]),
      import('../modules/AssetManager.js')
        .then(({ assetManager: _0x307c53 }) => {
          _0x307c53.showCreatePanel([..._0x592d17], null, { placement: 'center', point: _0x5e2f30 });
        })
        .catch(() => window.showToast?.(t('canvasInteraction.toasts.assetPanelFailed'), 'error')));
  };
  let _0x277489 = '',
    _0x25b902 = false,
    _0x1cf524 = false;
  _0x5daa21 &&
    _0x592d17.length === 1 &&
    ((_0x277489 = resolveNodeLocalPathForNativeAction(_0x5daa21)),
    (_0x25b902 = canShowItemInFolder(_0x277489)),
    (_0x1cf524 = canOpenKnownFolder('output')));
  (_0x5daa21 || _0x25b902) &&
    (_0xa6c79d(),
    _0x5daa21 && _0xfa722a(t('canvasInteraction.contextMenu.addAsset'), '', _0x5e5a2b),
    _0x25b902 &&
      _0xfa722a(t('canvasInteraction.contextMenu.revealAsset'), '', () => {
        showItemInFolder(_0x277489).catch(() =>
          window.showToast?.(t('canvasInteraction.toasts.assetRevealFailed'), 'error'),
        );
      }),
    _0xa6c79d());
  _0x1cf524 &&
    (_0xfa722a(t('canvasInteraction.contextMenu.openOutputFolder'), '', () => {
      openKnownFolder('output').catch(() =>
        window.showToast?.(t('canvasInteraction.toasts.outputFolderFailed'), 'error'),
      );
    }),
    _0xa6c79d());
  _0xfa722a(t('canvasInteraction.contextMenu.duplicate'), '', () => {
    const _0x18ed2d = getStateRaw(),
      _0x3a794f = _0x18ed2d.nodes,
      _0x2b7454 = (_0x18ed2d.selectedNodeIds || []).filter((_0x668ab2) => !!_0x3a794f[_0x668ab2]),
      _0x2ec659 = _0x2b7454.length > 0 ? _0x2b7454 : [..._0x592d17],
      _0x1dcc84 = calcNodesBBox(_0x3a794f, _0x2ec659),
      _0x3f8bc9 = Math.max(0x118, _0x1dcc84?.width || 0),
      _0x1799f6 = Math.max(0x12c, _0x1dcc84?.height || 0),
      _0x20ba65 = (_0x2d44e2 && _0x3a794f[_0x2d44e2]) || _0x1dcc84;
    if (!_0x20ba65) return;
    const _0x149b36 = calcSafeSpawnPosNearNode(_0x3a794f, _0x20ba65, _0x3f8bc9, _0x1799f6),
      _0x32a6da = _0x149b36.x - _0x20ba65.x,
      _0xfded6b = _0x149b36.y - _0x20ba65.y,
      _0x240f58 = cloneNodesWithEdges(_0x2ec659, _0x32a6da, _0xfded6b);
    (graphStore.setSelectedNodes(Object.values(_0x240f58)),
      window.showToast?.(t('canvasInteraction.toasts.duplicateWithEdgesCreated'), 'success'));
  });
  _0x5daa21 &&
    _0x592d17.length === 1 &&
    (_0x5daa21.type === 'ai-text' || _0x5daa21.type === 'source-text') &&
    _0xfa722a(t('canvasInteraction.contextMenu.copyText'), '', () => {
      const _0x6a8b29 = _0x5daa21.outputText || _0x5daa21.content || '';
      _0x6a8b29
        ? navigator.clipboard
            .writeText(_0x6a8b29)
            .then(() => {
              (markSystemClipboardWrite({ text: _0x6a8b29 }),
                window.showToast?.(t('canvasInteraction.toasts.textCopied'), 'success'));
            })
            .catch(() => {
              window.showToast?.(t('canvasInteraction.toasts.copyFailed'), 'error');
            })
        : window.showToast?.(t('canvasInteraction.toasts.noNodeText'), 'warn');
    });
  _0xfa722a(t('canvasInteraction.contextMenu.deleteNode'), 'Del', () => {
    executeCommand('delete_nodes', { ids: [..._0x592d17] });
  });
  if (_0x5daa21 && _0x592d17.length === 1) {
    _0xa6c79d();
    const _0x2152d7 = [
        _getAiGenerationMenuItem(
          'ai-text',
          _getAiGenerationActionLabel('ai-text'),
          _getAiGenerationNodeName('ai-text'),
        ),
        _getAiGenerationMenuItem(
          'ai-image',
          _getAiGenerationActionLabel('ai-image'),
          _getAiGenerationNodeName('ai-image'),
        ),
        _getAiGenerationMenuItem(
          'ai-video',
          _getAiGenerationActionLabel('ai-video'),
          _getAiGenerationNodeName('ai-video'),
        ),
        _getAiGenerationMenuItem(
          'ai-audio',
          _getAiGenerationActionLabel('ai-audio'),
          _getAiGenerationNodeName('ai-audio'),
        ),
      ],
      _0x21f4db = _0x2152d7.filter((_0x4f980e) =>
        isValidConnection(_0x5daa21, { id: '__fake_' + _0x4f980e.type, type: _0x4f980e.type }),
      );
    _0x21f4db.length > 0 &&
      _0x21f4db.forEach((_0x31db3f) => {
        _0xfa722a(_0x31db3f.label, '', () => {
          const _0x49b837 = generateId(_0x31db3f.type);
          let _0x4a62fe = _0x31db3f.w,
            _0x400469 = _0x31db3f.h;
          if (
            (_0x31db3f.type === 'ai-image' || _0x31db3f.type === 'ai-video') &&
            _0x5daa21.width &&
            _0x5daa21.height
          ) {
            const _0x27eebf = getAIGenerationNodeSize(_0x5daa21.width, _0x5daa21.height);
            ((_0x4a62fe = _0x27eebf.width), (_0x400469 = _0x27eebf.height));
          }
          const { nodes: _0xe395da } = getStateRaw(),
            _0x278c7d = calcSafeSpawnPosNearNode(_0xe395da, _0x5daa21, _0x4a62fe, _0x400469);
          let _0x29446d = {
            id: _0x49b837,
            type: _0x31db3f.type,
            x: _0x278c7d.x,
            y: _0x278c7d.y,
            width: _0x4a62fe,
            height: _0x400469,
            name: _0x31db3f.name,
          };
          (_0x31db3f.type === 'ai-image' || _0x31db3f.type === 'ai-video') &&
            !Object.prototype.hasOwnProperty.call(_0x29446d, 'aspectRatio') &&
            (_0x29446d.aspectRatio = '自适应');
          if (_0x5daa21.type === _0x31db3f.type) {
            const _0x3471bf = { ..._0x5daa21 };
            (delete _0x3471bf.id,
              delete _0x3471bf.x,
              delete _0x3471bf.y,
              delete _0x3471bf.width,
              delete _0x3471bf.height,
              delete _0x3471bf.name,
              delete _0x3471bf.prompt,
              delete _0x3471bf.outputText,
              stripImageGenerationResultStateForDerivedNode(_0x3471bf),
              (_0x29446d = { ..._0x3471bf, ..._0x29446d }));
          }
          graphStore.addNode(_0x29446d);
          const _0x18bc42 = addEdgeWithPolicies({ sourceId: _0x2d44e2, targetId: _0x49b837 });
          if (!_0x18bc42) {
            const _0x591778 = 'edge-' + _0x2d44e2 + '-' + _0x49b837 + '-' + Date.now();
            graphStore.addEdge({
              id: _0x591778,
              sourceId: _0x2d44e2,
              targetId: _0x49b837,
              createdAt: Date.now(),
            });
          }
          (graphStore.setSelectedNodes([_0x49b837]), commit());
        });
      });
    if (_0x5daa21 && _0x592d17.length === 1) {
      const _0x8fb380 =
        _0x5daa21.type === 'ai-image' || _0x5daa21.type === 'source-image' || _0x5daa21.type === 'storyboard';
      if (_0x8fb380) {
        const _0x39104f = resolveStoryboardSourceImageRef(_0x5daa21);
        if (_0x39104f) {
          _0xa6c79d();
          const _0x395535 = STORYBOARD_QUICK_CREATE_PRESETS.map((_0x541983) => ({
            label: t(_0x541983.labelKey),
            action: () => _createQuickStoryboardNodeFromPrimary(_0x2d44e2, _0x5daa21, _0x541983),
          }));
          _0xe9c94b(t('canvasInteraction.grids.createGrid'), _0x395535);
        }
      }
    }
  }
  showContextMenu(_0x361e2e, _0x4f4904, _0x342b20);
}
export function cloneNodesWithEdges(_0x4539de, _0x54d550 = 16, _0x1ebc9a = 16) {
  const _0x5f1b6e = getStateRaw(),
    { nodes: _0xdf33c4, edges: _0x23bf36 } = _0x5f1b6e,
    _0x3011ea = {};
  _0x4539de.forEach((_0x12a1bc) => {
    const _0x30ce21 = _0xdf33c4[_0x12a1bc];
    if (!_0x30ce21) return;
    const _0x28b871 = 'node_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    _0x3011ea[_0x12a1bc] = _0x28b871;
    const _0x24d460 = JSON.parse(JSON.stringify(_0x30ce21));
    (stripImageGenerationRuntimeState(_0x24d460),
      graphStore.addNode({
        ..._0x24d460,
        id: _0x28b871,
        x: _0x30ce21.x + _0x54d550,
        y: _0x30ce21.y + _0x1ebc9a,
      }));
  });
  const _0x36c440 = [];
  return (
    Object.values(_0x23bf36).forEach((_0x4c97b5) => {
      const _0x5ae3d3 = _0x4539de.includes(_0x4c97b5.sourceId),
        _0x174b6b = _0x4539de.includes(_0x4c97b5.targetId);
      if (_0x5ae3d3 && _0x174b6b)
        _0x36c440.push({
          ..._0x4c97b5,
          id: 'edge_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          sourceId: _0x3011ea[_0x4c97b5.sourceId],
          targetId: _0x3011ea[_0x4c97b5.targetId],
        });
      else {
        if (_0x5ae3d3)
          _0x36c440.push({
            ..._0x4c97b5,
            id: 'edge_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            sourceId: _0x3011ea[_0x4c97b5.sourceId],
          });
        else
          _0x174b6b &&
            _0x36c440.push({
              ..._0x4c97b5,
              id: 'edge_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
              targetId: _0x3011ea[_0x4c97b5.targetId],
            });
      }
    }),
    _0x36c440.length > 0 && graphStore.updateEdgesBatch([], _0x36c440),
    commit(),
    _0x3011ea
  );
}
export function executeCommand(_0x1a4395, _0x46b65a = {}) {
  const _0x36fee0 = getStateRaw();
  switch (_0x1a4395) {
    case 'delete_edge':
      _0x46b65a.id && (graphStore.removeEdge(_0x46b65a.id), commit());
      break;
    case 'delete_nodes':
      _0x46b65a.ids &&
        _0x46b65a.ids.length > 0 &&
        (graphStore.deleteNodes(_0x46b65a.ids), graphStore.clearSelection(), commit());
      break;
    case 'hide_picker':
      uiStore.hidePicker();
      break;
    case 'rename_node':
      _0x46b65a.id &&
        typeof _0x46b65a.name === 'string' &&
        graphStore.renameNode(_0x46b65a.id, _0x46b65a.name);
      break;
    case 'set_pick_connect_mode':
      uiStore.setPickConnectMode({
        active: !!_0x46b65a.active,
        sourceNodeId: _0x46b65a.sourceNodeId !== undefined ? _0x46b65a.sourceNodeId : null,
        handleDirection: _0x46b65a.handleDirection !== undefined ? _0x46b65a.handleDirection : null,
        hoverNodeId: _0x46b65a.hoverNodeId !== undefined ? _0x46b65a.hoverNodeId : null,
      });
      break;
    case 'group':
      if (_0x46b65a.ids && _0x46b65a.ids.length > 1) {
        let _0x572263 = Infinity,
          _0x374843 = Infinity,
          _0xf5ca69 = -Infinity,
          _0x55e90d = -Infinity;
        _0x46b65a.ids.forEach((_0x2a9272) => {
          const _0x1b2630 = _0x36fee0.nodes[_0x2a9272];
          if (!_0x1b2630) return;
          const _0x472d51 = _0x1b2630.x,
            _0x57e9c3 = _0x1b2630.y,
            _0x3f5c7f = _0x1b2630.width || 0x104,
            _0x4eaa56 = _0x1b2630.height || 100;
          ((_0x572263 = Math.min(_0x572263, _0x472d51)),
            (_0x374843 = Math.min(_0x374843, _0x57e9c3)),
            (_0xf5ca69 = Math.max(_0xf5ca69, _0x472d51 + _0x3f5c7f)),
            (_0x55e90d = Math.max(_0x55e90d, _0x57e9c3 + _0x4eaa56)));
        });
        const _0x20373d = 32,
          _0x541ac8 = generateId('group');
        (graphStore.addNode({
          id: _0x541ac8,
          type: 'group',
          x: _0x572263 - _0x20373d,
          y: _0x374843 - _0x20373d * 1.5,
          width: _0xf5ca69 - _0x572263 + _0x20373d * 2,
          height: _0x55e90d - _0x374843 + _0x20373d * 2.5,
          title: t('canvasInteraction.group.newGroup'),
          color: 'var(--indigo)',
        }),
          graphStore.groupNodes(_0x46b65a.ids, _0x541ac8),
          graphStore.setSelectedNodes([_0x541ac8]),
          commit());
      }
      break;
    case 'ungroup':
      _0x46b65a.ids &&
        _0x46b65a.ids.length > 0 &&
        (_0x46b65a.ids.forEach((_0x4d8268) => {
          const _0x27838d = _0x36fee0.nodes[_0x4d8268];
          _0x27838d &&
            isNodeType(_0x27838d, 'group') &&
            (Object.values(_0x36fee0.nodes).forEach((_0x1ce603) => {
              if (_0x1ce603.parentId === _0x4d8268)
                graphStore.updateNodeData(_0x1ce603.id, { parentId: undefined });
            }),
            graphStore.deleteNodes([_0x4d8268]));
        }),
        graphStore.clearSelection(),
        commit());
      break;
    case 'create_node':
      if (_0x46b65a.type) {
        const _0xfdffb8 = generateId(_0x46b65a.type);
        (graphStore.addNode({ id: _0xfdffb8, ..._0x46b65a }),
          graphStore.setSelectedNodes([_0xfdffb8]),
          commit());
      }
      break;
    case 'create_collage_from_selection': {
      const _0x362f6e = Array.isArray(_0x46b65a.ids) ? _0x46b65a.ids : _0x36fee0.selectedNodeIds || [];
      _createCollageNodeFromSelection(_0x362f6e);
      break;
    }
    case 'reset_source_media_size':
    case 'reset_source_image_size': {
      const _0x3195b1 =
          Array.isArray(_0x46b65a.ids) && _0x46b65a.ids.length > 0
            ? _0x46b65a.ids
            : _0x36fee0.selectedNodeIds || [],
        _0x1fdd9f = _0x3195b1.filter((_0xc67e68) => {
          const _0x369fbd = _0x36fee0.nodes[_0xc67e68];
          return !!_0x369fbd && isNodeType(_0x369fbd, RESETTABLE_MEDIA_NODE_TYPES);
        });
      if (_0x1fdd9f.length === 0) break;
      (graphStore.batch(() => {
        _0x1fdd9f.forEach((_0x416b24) => {
          const _0x39cb2f = _0x36fee0.nodes[_0x416b24],
            _0xcf5b67 = _resolveSourceMediaResetSize(_0x39cb2f);
          graphStore.updateNodeData(_0x416b24, {
            width: _0xcf5b67.width,
            height: _0xcf5b67.height,
            needsAutoResize: false,
          });
        });
      }),
        commit());
      break;
    }
    case 'align_nodes': {
      if (_0x36fee0.ui?.alignFeatureEnabled === false) break;
      const _0x5ad98f = String(_0x46b65a.mode || '').trim(),
        _0x502ded = Array.isArray(_0x36fee0.selectedNodeIds) ? _0x36fee0.selectedNodeIds : [];
      if (_0x502ded.length < 2) break;
      const _0x12c56b = getAlignableSelectionNodes(_0x36fee0.nodes, _0x502ded);
      if (_0x12c56b.length < 2) break;
      let _0x23bc81 = {};
      if (_0x5ad98f === 'distribute-h') {
        const _0x39e0ed = Number(_0x36fee0.ui?.alignDistributeGap);
        _0x23bc81 = computeDistributeTargets(
          _0x12c56b,
          'horizontal',
          Number.isFinite(_0x39e0ed) ? _0x39e0ed : 40,
        );
      } else {
        if (_0x5ad98f === 'distribute-v') {
          const _0x1e0783 = Number(_0x36fee0.ui?.alignDistributeGap);
          _0x23bc81 = computeDistributeTargets(
            _0x12c56b,
            'vertical',
            Number.isFinite(_0x1e0783) ? _0x1e0783 : 40,
          );
        } else {
          if (
            _0x5ad98f === 'left' ||
            _0x5ad98f === 'h-center' ||
            _0x5ad98f === 'right' ||
            _0x5ad98f === 'top' ||
            _0x5ad98f === 'v-center' ||
            _0x5ad98f === 'bottom'
          ) {
            const _0x1b5f1a = computeSelectionBounds(_0x12c56b);
            _0x23bc81 = computeAlignTargets(_0x12c56b, _0x5ad98f, _0x1b5f1a);
          } else break;
        }
      }
      const _0x2c5528 = buildNodeOffsetPlan(_0x36fee0.nodes, _0x23bc81);
      if (Object.keys(_0x2c5528).length === 0) break;
      (graphStore.batch(() => {
        graphStore.moveNodesByOffsets(_0x2c5528);
      }),
        commit());
      break;
    }
    case 'select_all':
      graphStore.setSelectedNodes(Object.keys(_0x36fee0.nodes));
      break;
    case 'copy': {
      const _0x13707e =
        Array.isArray(_0x46b65a.ids) && _0x46b65a.ids.length > 0
          ? _0x46b65a.ids
          : Array.isArray(_0x36fee0.selectedNodeIds)
            ? _0x36fee0.selectedNodeIds
            : [];
      if (_0x13707e.length > 0) {
        const _0x55ee6e = buildClipboardGraphSnapshot({
          nodesById: _0x36fee0.nodes,
          edgesById: _0x36fee0.edges,
          selectedIds: _0x13707e,
          sanitizeNode(_0x1d10cb) {
            return (stripImageGenerationRuntimeState(_0x1d10cb), _0x1d10cb);
          },
        });
        _0x55ee6e.nodes.length > 0 && setClipboard(_0x55ee6e.nodes, { edges: _0x55ee6e.edges });
      }
      break;
    }
    case 'export_image':
      console.log('执行导出节点图片', _0x46b65a.id);
      break;
    case 'paste': {
      const _0x2bc496 = getClipboardGraph(),
        _0x5c4e6f = _0x2bc496?.nodes?.length ? _0x2bc496.nodes : getClipboard();
      if (_0x5c4e6f && _0x5c4e6f.length > 0) {
        const _0x5738db = Date.now(),
          _0x338fd7 = Math.random().toString(36).slice(2, 5),
          _0x5e34b5 = prepareClipboardGraphPaste({
            graph: _0x2bc496 || { schemaVersion: 1, nodes: _0x5c4e6f, edges: [] },
            x: _0x46b65a.x,
            y: _0x46b65a.y,
            generateNodeId(_0x1c4dd8, _0x25e294) {
              return (
                String(_0x1c4dd8 || 'node').split('_copy_')[0] +
                '_copy_' +
                _0x5738db +
                '_' +
                _0x338fd7 +
                _0x25e294
              );
            },
            generateEdgeId() {
              return generateId('edge');
            },
            sanitizeNode(_0x1f8ee3) {
              return (stripImageGenerationRuntimeState(_0x1f8ee3), _0x1f8ee3);
            },
          });
        _0x5e34b5.nodes.length > 0 &&
          (graphStore.batch(() => {
            (_0x5e34b5.nodes.forEach((_0x1c38c9) => {
              graphStore.addNode(_0x1c38c9);
            }),
              _0x5e34b5.edges.length > 0 && graphStore.updateEdgesBatch([], _0x5e34b5.edges),
              graphStore.setSelectedNodes(_0x5e34b5.newIds));
          }),
          commit());
      }
      break;
    }
    case 'create_group':
      const _0x281d25 = _0x46b65a.ids || _0x36fee0.selectedNodeIds;
      if (_0x281d25 && _0x281d25.length > 0) {
        let _0x386ce4 = Infinity,
          _0x88fcc3 = Infinity,
          _0x1d1731 = -Infinity,
          _0xfb821e = -Infinity;
        const _0x3d3dae = _0x281d25.map((_0x19766c) => _0x36fee0.nodes[_0x19766c]).filter(Boolean);
        if (_0x3d3dae.length === 0) break;
        _0x3d3dae.forEach((_0x6284af) => {
          ((_0x386ce4 = Math.min(_0x386ce4, _0x6284af.x)),
            (_0x88fcc3 = Math.min(_0x88fcc3, _0x6284af.y)),
            (_0x1d1731 = Math.max(_0x1d1731, _0x6284af.x + (_0x6284af.width || 0))),
            (_0xfb821e = Math.max(_0xfb821e, _0x6284af.y + (_0x6284af.height || 0))));
        });
        const _0x395f0f = 30,
          _0x55a028 = _0x386ce4 - _0x395f0f,
          _0x50fdac = _0x88fcc3 - (_0x395f0f + 20),
          _0x1c4865 = _0x1d1731 - _0x386ce4 + _0x395f0f * 2,
          _0x272250 = _0xfb821e - _0x88fcc3 + _0x395f0f * 2 + 20,
          _0x440915 = generateId('group');
        (graphStore.addNode({
          id: _0x440915,
          type: 'group',
          x: _0x55a028,
          y: _0x50fdac,
          width: _0x1c4865,
          height: _0x272250,
          label: 'New Group',
        }),
          graphStore.groupNodes(_0x281d25, _0x440915),
          graphStore.setSelectedNodes([_0x440915]),
          commit());
      }
      break;
    default:
      console.warn('Unknown command: ', _0x1a4395);
      break;
  }
  uiStore.hideContextMenu();
}
export function isValidConnection(_0x2b0a88, _0x4870c8) {
  return isValidConnection_2(_0x2b0a88, _0x4870c8);
}
export function initConnectionHandles(_0x303ffe) {
  return initConnectionHandles_2(_0x303ffe);
}
export function initPickConnect(_0x248600) {
  return initPickConnect_2(_0x248600);
}
export function initCanvasContextMenu(_0x1d7319) {
  if (!_0x1d7319) return;
  _0x1d7319.addEventListener(
    'contextmenu',
    (_0x5d18fa) => {
      if (!isEditableTextTargetInGroupedNode(_0x5d18fa.target, getStateRaw().nodes)) return;
      _0x5d18fa.__aiCanvasGroupedEditableContextMenu = true;
    },
    { capture: true },
  );
  function _0xbf3b26({
    key: _0x39c6b7,
    id: _0x10760e,
    x: _0x557619,
    y: _0x11182e,
    width: _0x7ecc36,
    height: _0x4587eb,
    name: _0x301c37,
    extra: extra = {},
  }) {
    if (_0x39c6b7 === 'panorama-scene')
      return createPanoramaSceneNodeData({
        id: _0x10760e,
        x: _0x557619,
        y: _0x11182e,
        width: _0x7ecc36,
        height: _0x4587eb,
        name: _0x301c37,
      });
    if (_0x39c6b7 === 'panorama-360')
      return createPanorama360NodeData({
        id: _0x10760e,
        x: _0x557619,
        y: _0x11182e,
        width: _0x7ecc36,
        height: _0x4587eb,
        name: _0x301c37,
      });
    if (_0x39c6b7 === 'storyboard-script')
      return createStoryboardScriptNodeData({
        id: _0x10760e,
        x: _0x557619,
        y: _0x11182e,
        width: _0x7ecc36,
        height: _0x4587eb,
        name: _0x301c37,
      });
    if (_0x39c6b7 === 'story-workspace')
      return createStoryWorkspaceNodeData({
        id: _0x10760e, x: _0x557619, y: _0x11182e,
        width: _0x7ecc36, height: _0x4587eb,
        name: _0x301c37 || t('nodeCreation.items.storyWorkspace.defaultName'),
      });
    if (_0x39c6b7 === 'comfyui-workflow')
      return createComfyWorkflowNodeData({
        id: _0x10760e, x: _0x557619, y: _0x11182e,
        width: _0x7ecc36, height: _0x4587eb,
        name: _0x301c37 || t('nodeCreation.items.comfyWorkflow.defaultName'),
      });
    if (_0x39c6b7 === 'whiteboard')
      return createWhiteboardNodeData({
        id: _0x10760e, x: _0x557619, y: _0x11182e,
        width: _0x7ecc36, height: _0x4587eb,
        name: _0x301c37 || t('nodeCreation.items.whiteboard.defaultName'),
      });
    if (_0x39c6b7 === 'collage')
      return createEmptyCollageNodeData({
        id: _0x10760e,
        x: _0x557619,
        y: _0x11182e,
        width: _0x7ecc36,
        height: _0x4587eb,
        name: _0x301c37 || t('canvasInteraction.grids.collageName'),
      });
    const _0x43c60e = {
      id: _0x10760e,
      type: _0x39c6b7,
      x: _0x557619,
      y: _0x11182e,
      width: _0x7ecc36,
      height: _0x4587eb,
      name: _0x301c37,
      ...extra,
    };
    (_0x39c6b7 === 'ai-image' || _0x39c6b7 === 'ai-video') &&
      !Object.prototype.hasOwnProperty.call(_0x43c60e, 'aspectRatio') &&
      (_0x43c60e.aspectRatio = '自适应');
    if (_0x39c6b7 === 'ai-image' || _0x39c6b7 === 'ai-video') {
      const _0x12cec2 = getAIGenerationNodeSize(_0x7ecc36, _0x4587eb);
      ((_0x43c60e.width = _0x12cec2.width), (_0x43c60e.height = _0x12cec2.height));
    }
    if (_0x39c6b7 === 'source-image' || _0x39c6b7 === 'source-video')
      return buildSourceMediaNodePayload(_0x43c60e);
    return _0x43c60e;
  }
  function _0x29c241(_0x24d5ef) {
    if (
      _0x24d5ef === 'ai-text' ||
      _0x24d5ef === 'ai-image' ||
      _0x24d5ef === 'ai-video' ||
      _0x24d5ef === 'ai-audio'
    )
      return getAIGenerationDefaultSizeByType(_0x24d5ef);
    if (_0x24d5ef === 'panorama-scene' || _0x24d5ef === 'panorama-360') return PANORAMA_SCENE_DEFAULT_SIZE;
    if (_0x24d5ef === 'storyboard-script') return STORYBOARD_SCRIPT_DEFAULT_SIZE;
    if (_0x24d5ef === 'debug') return { width: 0x104, height: 180 };
    return getNodeDefaultSize(_0x24d5ef);
  }
  function _0x4b801a(_0x4fabd1, _0xbcc856, _0x5a7cdc) {
    const _0x2bbdae = _0x29c241(_0x4fabd1.type),
      _0x305dd6 = generateId(_0x4fabd1.type),
      _0x1e8b75 =
        _0x4fabd1.type === 'source-image' || _0x4fabd1.type === 'source-video'
          ? { needsAutoResize: true }
          : {};
    (graphStore.addNode(
      _0xbf3b26({
        id: _0x305dd6,
        key: _0x4fabd1.type,
        x: _0xbcc856 - _0x2bbdae.width / 2,
        y: _0x5a7cdc - _0x2bbdae.height / 2,
        width: _0x2bbdae.width,
        height: _0x2bbdae.height,
        name: _0x4fabd1.defaultName || _0x4fabd1.label,
        extra: _0x1e8b75,
      }),
    ),
      graphStore.setSelectedNodes([_0x305dd6]),
      commit());
  }
  function _0x4e3a6f(_0xef0868, _0x2ec2f1, _0x4a6ea4 = false) {
    (document.querySelector('#v2PickerOverlay')?.remove(), removeContextMenus());
    const { viewport: _0x4cca36 } = getStateRaw();
    let _0x202935, _0x3010b7;
    if (_0x4a6ea4) {
      const _0x1540e3 = window.innerWidth / 2,
        _0xd57438 = window.innerHeight / 2,
        _0x298a30 = screenToWorld(_0x1540e3, _0xd57438, _0x4cca36);
      ((_0x202935 = _0x298a30.x), (_0x3010b7 = _0x298a30.y));
    } else {
      const _0x320a7d = screenToWorld(_0xef0868, _0x2ec2f1, _0x4cca36);
      ((_0x202935 = _0x320a7d.x), (_0x3010b7 = _0x320a7d.y));
    }
    const _0x155a0c = document.createElement('div');
    _0x155a0c.id = 'v2PickerOverlay';
    const _0xdd5a63 = 0x110,
      _0x429aa7 = Math.min(_0xef0868, window.innerWidth - _0xdd5a63 - 20),
      _0x1b3e34 = Math.max(12, Math.min(_0x2ec2f1, window.innerHeight - 0x1f4)),
      _0x3b365f = document.createElement('div');
    ((_0x3b365f.className = 'v2-node-picker'),
      (_0x3b365f.style.left = _0x429aa7 + 'px'),
      (_0x3b365f.style.top = _0x1b3e34 + 'px'),
      (_0x3b365f.style.width = _0xdd5a63 + 'px'));
    const _0x56c6e5 = (_0x124b82) => {
        const _0x53437a = document.createElement('div');
        _0x53437a.className = 'v2-menu-section';
        const _0x38ac14 = document.createElement('div');
        _0x38ac14.className = 'v2-menu-rule';
        const _0x160826 = document.createElement('span');
        return (
          (_0x160826.className = 'v2-menu-title'),
          (_0x160826.textContent = _0x124b82),
          _0x53437a.appendChild(_0x160826),
          _0x53437a.appendChild(_0x38ac14),
          _0x53437a
        );
      },
      _0x2be17d = (_0x2f4cbd, _0x52a625) => {
        const _0x124fac = document.createElement('button');
        _0x124fac.className = 'v2-menu-row' + (_0x2f4cbd.desc ? ' has-desc' : '');
        const _0x49c374 = document.createElement('div');
        ((_0x49c374.className = 'v2-menu-ico'), _0x49c374.replaceChildren());
        if (_0x2f4cbd.iconEl) _0x49c374.appendChild(_0x2f4cbd.iconEl.cloneNode(true));
        _0x124fac.appendChild(_0x49c374);
        const _0x3aed2 = document.createElement('div');
        _0x3aed2.className = 'v2-menu-txt-wrap';
        const _0x2f19c9 = document.createElement('span');
        ((_0x2f19c9.className = 'v2-menu-lbl'), (_0x2f19c9.textContent = _0x2f4cbd.label));
        if (_0x2f4cbd.badge) {
          const _0x34df43 = document.createElement('span');
          ((_0x34df43.textContent = _0x2f4cbd.badge),
            (_0x34df43.className = 'v2-badge-beta'),
            _0x2f19c9.appendChild(_0x34df43));
        }
        _0x3aed2.appendChild(_0x2f19c9);
        if (_0x2f4cbd.desc) {
          const _0xf7dcd8 = document.createElement('span');
          ((_0xf7dcd8.className = 'v2-menu-sub'),
            (_0xf7dcd8.textContent = _0x2f4cbd.desc),
            _0x3aed2.appendChild(_0xf7dcd8));
        }
        return (
          _0x124fac.appendChild(_0x3aed2),
          _0x124fac.addEventListener('click', (_0x6c4de5) => {
            (_0x6c4de5.stopPropagation(), _0x52a625(_0x6c4de5));
          }),
          _0x124fac
        );
      },
      _0x8aa9ee = 'var(--white-50)',
      _0x1a80c9 = 'http://www.w3.org/2000/svg',
      _0x50a42a = (_0x201719, _0x2266ce) => {
        const _0x5b1282 = document.createElementNS(_0x1a80c9, 'svg');
        return (
          _0x5b1282.setAttribute('width', '18'),
          _0x5b1282.setAttribute('height', '18'),
          _0x5b1282.setAttribute('viewBox', '0 0 24 24'),
          _0x5b1282.setAttribute('fill', 'none'),
          _0x5b1282.setAttribute('stroke', _0x201719),
          _0x5b1282.setAttribute('stroke-width', String(_0x2266ce)),
          _0x5b1282
        );
      },
      _0x53ef7d = (_0x30b14f) => {
        const _0x49cdd0 = _0x50a42a(_0x30b14f, 1.8),
          _0x2566b9 = document.createElementNS(_0x1a80c9, 'path');
        _0x2566b9.setAttribute('d', 'M12 20h9');
        const _0x4e837d = document.createElementNS(_0x1a80c9, 'path');
        return (
          _0x4e837d.setAttribute('d', 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'),
          _0x49cdd0.appendChild(_0x2566b9),
          _0x49cdd0.appendChild(_0x4e837d),
          _0x49cdd0
        );
      },
      _0x3c5a72 = (_0x17b5d2) => {
        const _0x34f842 = _0x50a42a(_0x17b5d2, 1.8),
          _0x4377c8 = document.createElementNS(_0x1a80c9, 'rect');
        (_0x4377c8.setAttribute('x', '3'),
          _0x4377c8.setAttribute('y', '3'),
          _0x4377c8.setAttribute('width', '18'),
          _0x4377c8.setAttribute('height', '18'),
          _0x4377c8.setAttribute('rx', '3'));
        const _0x981850 = document.createElementNS(_0x1a80c9, 'circle');
        (_0x981850.setAttribute('cx', '8.5'),
          _0x981850.setAttribute('cy', '8.5'),
          _0x981850.setAttribute('r', '1.5'),
          _0x981850.setAttribute('fill', _0x17b5d2));
        const _0x11a015 = document.createElementNS(_0x1a80c9, 'polyline');
        return (
          _0x11a015.setAttribute('points', '21 15 16 10 5 21'),
          _0x34f842.appendChild(_0x4377c8),
          _0x34f842.appendChild(_0x981850),
          _0x34f842.appendChild(_0x11a015),
          _0x34f842
        );
      },
      _0x53f083 = (_0x15bda9) => {
        const _0x1ca600 = _0x50a42a(_0x15bda9, 1.8),
          _0x21155b = document.createElementNS(_0x1a80c9, 'rect');
        (_0x21155b.setAttribute('x', '2'),
          _0x21155b.setAttribute('y', '6'),
          _0x21155b.setAttribute('width', '15'),
          _0x21155b.setAttribute('height', '12'),
          _0x21155b.setAttribute('rx', '2'));
        const _0x1475b8 = document.createElementNS(_0x1a80c9, 'path');
        return (
          _0x1475b8.setAttribute('d', 'M17 9l5-3v12l-5-3V9z'),
          _0x1ca600.appendChild(_0x21155b),
          _0x1ca600.appendChild(_0x1475b8),
          _0x1ca600
        );
      },
      _0xdf5592 = (_0x2e1eb8) => {
        const _0x351dea = _0x50a42a(_0x2e1eb8, 1.8),
          _0x50520b = document.createElementNS(_0x1a80c9, 'path');
        _0x50520b.setAttribute('d', 'M9 18V5l12-2v13');
        const _0x50681e = document.createElementNS(_0x1a80c9, 'circle');
        (_0x50681e.setAttribute('cx', '6'),
          _0x50681e.setAttribute('cy', '18'),
          _0x50681e.setAttribute('r', '3'));
        const _0x23ee04 = document.createElementNS(_0x1a80c9, 'circle');
        return (
          _0x23ee04.setAttribute('cx', '18'),
          _0x23ee04.setAttribute('cy', '16'),
          _0x23ee04.setAttribute('r', '3'),
          _0x351dea.appendChild(_0x50520b),
          _0x351dea.appendChild(_0x50681e),
          _0x351dea.appendChild(_0x23ee04),
          _0x351dea
        );
      },
      _0x3fa974 = (_0x1f751a) => {
        const _0x4debfa = _0x50a42a(_0x1f751a, 1.8),
          _0x42d953 = document.createElementNS(_0x1a80c9, 'circle');
        (_0x42d953.setAttribute('cx', '12'),
          _0x42d953.setAttribute('cy', '12'),
          _0x42d953.setAttribute('r', '8.5'));
        const _0x24332f = document.createElementNS(_0x1a80c9, 'path');
        _0x24332f.setAttribute('d', 'M3.5 12h17');
        const _0x803a7b = document.createElementNS(_0x1a80c9, 'path');
        _0x803a7b.setAttribute('d', 'M12 3.5c2.4 2.6 3.5 5.4 3.5 8.5S14.4 17.9 12 20.5');
        const _0x1a6daa = document.createElementNS(_0x1a80c9, 'path');
        _0x1a6daa.setAttribute('d', 'M12 3.5C9.6 6.1 8.5 8.9 8.5 12s1.1 5.9 3.5 8.5');
        const _0x456a5f = document.createElementNS(_0x1a80c9, 'path');
        _0x456a5f.setAttribute('d', 'M6.1 6.1c3.4 1.8 8.4 1.8 11.8 0');
        const _0x2d22c2 = document.createElementNS(_0x1a80c9, 'path');
        return (
          _0x2d22c2.setAttribute('d', 'M6.1 17.9c3.4-1.8 8.4-1.8 11.8 0'),
          _0x4debfa.appendChild(_0x42d953),
          _0x4debfa.appendChild(_0x24332f),
          _0x4debfa.appendChild(_0x803a7b),
          _0x4debfa.appendChild(_0x1a6daa),
          _0x4debfa.appendChild(_0x456a5f),
          _0x4debfa.appendChild(_0x2d22c2),
          _0x4debfa
        );
      },
      _0x1c7de0 = (_0x4ebdce) => {
        const _0x20f3c5 = _0x50a42a(_0x4ebdce, 1.8),
          _0x56689b = document.createElementNS(_0x1a80c9, 'rect');
        (_0x56689b.setAttribute('x', '3'),
          _0x56689b.setAttribute('y', '4'),
          _0x56689b.setAttribute('width', '18'),
          _0x56689b.setAttribute('height', '16'),
          _0x56689b.setAttribute('rx', '2'),
          _0x20f3c5.appendChild(_0x56689b),
          ['9', '14'].forEach((_0x7e1612) => {
            const _0x2f1e23 = document.createElementNS(_0x1a80c9, 'line');
            (_0x2f1e23.setAttribute('x1', '3'),
              _0x2f1e23.setAttribute('y1', _0x7e1612),
              _0x2f1e23.setAttribute('x2', '21'),
              _0x2f1e23.setAttribute('y2', _0x7e1612),
              _0x20f3c5.appendChild(_0x2f1e23));
          }));
        const _0x335b3e = document.createElementNS(_0x1a80c9, 'line');
        return (
          _0x335b3e.setAttribute('x1', '8'),
          _0x335b3e.setAttribute('y1', '4'),
          _0x335b3e.setAttribute('x2', '8'),
          _0x335b3e.setAttribute('y2', '20'),
          _0x20f3c5.appendChild(_0x335b3e),
          _0x20f3c5
        );
      },
      _0x48c687 = () => {
        const _0x2e7206 = _0x50a42a('var(--gold)', 1.8),
          _0x2c03a9 = document.createElementNS(_0x1a80c9, 'path');
        return (
          _0x2c03a9.setAttribute(
            'd',
            'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
          ),
          _0x2e7206.appendChild(_0x2c03a9),
          _0x2e7206
        );
      },
      _0x19bd03 = () => {
        const _0x2a802c = _0x50a42a('var(--white-50)', 1.8),
          _0x4c9ce9 = document.createElementNS(_0x1a80c9, 'path');
        _0x4c9ce9.setAttribute('d', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4');
        const _0x24ac08 = document.createElementNS(_0x1a80c9, 'polyline');
        _0x24ac08.setAttribute('points', '17 8 12 3 7 8');
        const _0x1870ae = document.createElementNS(_0x1a80c9, 'line');
        return (
          _0x1870ae.setAttribute('x1', '12'),
          _0x1870ae.setAttribute('y1', '3'),
          _0x1870ae.setAttribute('x2', '12'),
          _0x1870ae.setAttribute('y2', '15'),
          _0x2a802c.appendChild(_0x4c9ce9),
          _0x2a802c.appendChild(_0x24ac08),
          _0x2a802c.appendChild(_0x1870ae),
          _0x2a802c
        );
      },
      _0x3c2b58 = (_0x5cfa5b) => {
        const _0x473b45 = _0x50a42a(_0x5cfa5b, 1.8),
          _0x51b5c5 = document.createElementNS(_0x1a80c9, 'path');
        _0x51b5c5.setAttribute('d', 'M6 3v12a3 3 0 0 0 3 3h12');
        const _0x1005b8 = document.createElementNS(_0x1a80c9, 'path');
        _0x1005b8.setAttribute('d', 'M3 6h12a3 3 0 0 1 3 3v12');
        const _0x2fb70e = document.createElementNS(_0x1a80c9, 'path');
        return (
          _0x2fb70e.setAttribute('d', 'M3 3l18 18'),
          _0x473b45.appendChild(_0x51b5c5),
          _0x473b45.appendChild(_0x1005b8),
          _0x473b45.appendChild(_0x2fb70e),
          _0x473b45
        );
      },
      _0x5ae89d = (_0x2999fa) => {
        const _0x9afcb9 = _0x50a42a(_0x2999fa, 1.8),
          _0xd79b46 = document.createElementNS(_0x1a80c9, 'rect');
        (_0xd79b46.setAttribute('x', '3'),
          _0xd79b46.setAttribute('y', '4'),
          _0xd79b46.setAttribute('width', '18'),
          _0xd79b46.setAttribute('height', '16'),
          _0xd79b46.setAttribute('rx', '2'));
        const _0x559724 = document.createElementNS(_0x1a80c9, 'path');
        _0x559724.setAttribute('d', 'M3 10h18');
        const _0x77c3ed = document.createElementNS(_0x1a80c9, 'path');
        return (
          _0x77c3ed.setAttribute('d', 'M12 10v10'),
          _0x9afcb9.appendChild(_0xd79b46),
          _0x9afcb9.appendChild(_0x559724),
          _0x9afcb9.appendChild(_0x77c3ed),
          _0x9afcb9
        );
      },
      _0x213904 = (_0x395218) => {
        const _0x5ca04a = _0x50a42a(_0x395218, 1.8),
          _0x538ebb = document.createElementNS(_0x1a80c9, 'circle');
        (_0x538ebb.setAttribute('cx', '12'),
          _0x538ebb.setAttribute('cy', '12'),
          _0x538ebb.setAttribute('r', '9'));
        const _0x3eee68 = document.createElementNS(_0x1a80c9, 'path');
        _0x3eee68.setAttribute('d', 'M3 12h18');
        const _0x4e63ca = document.createElementNS(_0x1a80c9, 'path');
        _0x4e63ca.setAttribute('d', 'M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21');
        const _0x224829 = document.createElementNS(_0x1a80c9, 'path');
        return (
          _0x224829.setAttribute('d', 'M12 3C9.7 5.5 8.5 8.5 8.5 12S9.7 18.5 12 21'),
          _0x5ca04a.appendChild(_0x538ebb),
          _0x5ca04a.appendChild(_0x3eee68),
          _0x5ca04a.appendChild(_0x4e63ca),
          _0x5ca04a.appendChild(_0x224829),
          _0x5ca04a
        );
      },
      _0x44ca26 = {
        'ai-text': () => _0x53ef7d(_0x8aa9ee),
        'ai-image': () => _0x3c5a72(_0x8aa9ee),
        'ai-video': () => _0x53f083(_0x8aa9ee),
        'ai-audio': () => _0xdf5592(_0x8aa9ee),
        'panorama-scene': () => _0x3fa974(_0x8aa9ee),
        'panorama-360': () => _0x3fa974(_0x8aa9ee),
        'storyboard-script': () => _0x1c7de0(_0x8aa9ee),
        collage: () => _0x5ae89d(_0x8aa9ee),
        whiteboard: () => _0x5ae89d(_0x8aa9ee),
        'comfyui-workflow': () => _0x5ae89d(_0x8aa9ee),
        'story-workspace': () => _0x1c7de0(_0x8aa9ee),
        'web-preview': () => _0x213904(_0x8aa9ee),
        'media-clip': () => _0x3c2b58(_0x8aa9ee),
        debug: () => _0x48c687(),
      },
      _0x35b5a2 = getNodeCreationMenuSections(PICKER_NODE_CREATION_SECTION_IDS, {
        includeDevOnly: isDevModeOn(),
      });
    (_0x35b5a2.forEach((_0x3ec6c2) => {
      (_0x3b365f.appendChild(_0x56c6e5(_0x3ec6c2.label)),
        _0x3ec6c2.items.forEach((_0x43a98a) => {
          const _0x4abace = _0x29c241(_0x43a98a.type);
          _0x3b365f.appendChild(
            _0x2be17d(
              {
                key: _0x43a98a.type,
                label: _0x43a98a.label,
                w: _0x4abace.width,
                h: _0x4abace.height,
                badge: _0x43a98a.badge,
                desc: _0x43a98a.subtitle,
                iconEl: _0x44ca26[_0x43a98a.type]?.(),
              },
              () => {
                (_0x155a0c.remove(), _0x4b801a(_0x43a98a, _0x202935, _0x3010b7));
              },
            ),
          );
        }));
    }),
      _0x3b365f.appendChild(_0x56c6e5(t('canvasInteraction.contextMenu.addResource'))),
      _0x3b365f.appendChild(
        _0x2be17d(
          {
            label: NODE_CREATION_UPLOAD_ITEM.label,
            desc: NODE_CREATION_UPLOAD_ITEM.subtitle,
            iconBg: 'var(--white-05)',
            iconEl: _0x19bd03(),
          },
          () => {
            _0x155a0c.remove();
            const _0x107688 = document.createElement('input');
            ((_0x107688.type = 'file'),
              (_0x107688.accept = 'image/*,video/*,audio/*'),
              (_0x107688.style.position = 'fixed'),
              (_0x107688.style.left = '-9999px'),
              (_0x107688.style.top = '-9999px'),
              (_0x107688.style.opacity = '0'));
            const _0x3e888d = () => {
              ((_0x107688.onchange = null), _0x107688.remove());
            };
            (_0x107688.addEventListener('cancel', _0x3e888d, { once: true }),
              (_0x107688.onchange = (_0x16c7c5) => {
                const _0x37ca89 = _0x16c7c5.target.files?.[0];
                _0x3e888d();
                if (!_0x37ca89) return;
                const _0x55b107 = String(_0x37ca89.type || '').toLowerCase(),
                  _0x45c080 = _0x55b107.startsWith('image/'),
                  _0x4a77b4 = _0x55b107.startsWith('video/'),
                  _0x31b360 = _0x55b107.startsWith('audio/');
                if (!_0x45c080 && !_0x4a77b4 && !_0x31b360) {
                  window.showToast?.(t('canvasInteraction.toasts.unsupportedUpload'), 'warning');
                  return;
                }
                let _0x134972 = 'source-image';
                if (_0x4a77b4) _0x134972 = 'source-video';
                else _0x31b360 && (_0x134972 = 'source-audio');
                const { width: _0x4a51bf, height: _0x20f5b8 } = getNodeDefaultSize(_0x134972),
                  _0x7aa436 = (() => {
                    const _0x474542 = String(_0x37ca89.name || '').trim();
                    if (!_0x474542) return '';
                    const _0x21a88f = _0x474542.split(/[\\/]/).pop() || '',
                      _0x85c046 = _0x21a88f.lastIndexOf('.');
                    if (_0x85c046 <= 0) return _0x21a88f;
                    return _0x21a88f.slice(0, _0x85c046);
                  })(),
                  _0xa7d40c = generateId(_0x134972),
                  _0x12d322 = {
                    id: _0xa7d40c,
                    type: _0x134972,
                    x: _0x202935 - _0x4a51bf / 2,
                    y: _0x3010b7 - _0x20f5b8 / 2,
                    width: _0x4a51bf,
                    height: _0x20f5b8,
                    fileName: _0x37ca89.name,
                    name:
                      _0x7aa436 ||
                      (_0x134972 === 'source-video'
                        ? t('canvasInteraction.uploadTypeNames.video')
                        : _0x134972 === 'source-audio'
                          ? t('canvasInteraction.uploadTypeNames.audio')
                          : t('canvasInteraction.uploadTypeNames.image')),
                    needsAutoResize: _0x134972 === 'source-image' || _0x134972 === 'source-video',
                  };
                (graphStore.addNode(
                  _0x134972 === 'source-image' || _0x134972 === 'source-video'
                    ? buildSourceMediaNodePayload(_0x12d322)
                    : _0x12d322,
                ),
                  graphStore.setSelectedNodes([_0xa7d40c]),
                  commit(),
                  window.dispatchEvent(
                    new CustomEvent('v2:resource-upload', { detail: { id: _0xa7d40c, file: _0x37ca89 } }),
                  ));
              }),
              document.body.appendChild(_0x107688),
              _0x107688.click());
          },
        ),
      ),
      _0x155a0c.appendChild(_0x3b365f),
      document.body.appendChild(_0x155a0c));
    const _0x501f82 = _0x3b365f.getBoundingClientRect(),
      _0x4518ed = Math.max(12, window.innerHeight - _0x501f82.height - 12),
      _0x2e71d9 = Number.parseFloat(_0x3b365f.style.top) || _0x2ec2f1;
    ((_0x3b365f.style.top = Math.min(Math.max(12, _0x2e71d9), _0x4518ed) + 'px'),
      _0x155a0c.addEventListener('click', () => _0x155a0c.remove()));
  }
  function _0x444c27(_0x2503bb, _0x9e1d99) {
    const { viewport: _0x504fa7 } = getStateRaw(),
      _0x3e5f60 = screenToWorld(_0x2503bb, _0x9e1d99, _0x504fa7),
      _0x4c01cf = _0x3e5f60.x,
      _0xf6d570 = _0x3e5f60.y,
      _0x107c0b = [],
      _0x343f33 = (_0x2b7d08, _0x507929, _0x3b78b6) => {
        _0x107c0b.push({ label: _0x2b7d08, kbd: _0x507929, action: _0x3b78b6 });
      },
      _0x18e0c7 = () => {
        _0x107c0b.push('sep');
      },
      _0x33eb9a = (_0x4fb923, _0x53a0e2) => {
        _0x107c0b.push({ label: _0x4fb923, subItems: _0x53a0e2 });
      },
      _0x363ca3 = (_0xd82ad3, _0x39ed3d, _0x5cdc3f, _0x2090d0) => () => {
        const _0x5476c4 = generateId(_0xd82ad3);
        (graphStore.addNode(
          _0xbf3b26({
            id: _0x5476c4,
            key: _0xd82ad3,
            x: _0x4c01cf - _0x39ed3d / 2,
            y: _0xf6d570 - _0x5cdc3f / 2,
            width: _0x39ed3d,
            height: _0x5cdc3f,
            name: _0x2090d0,
            extra: { needsAutoResize: _0xd82ad3 === 'source-image' || _0xd82ad3 === 'source-video' },
          }),
        ),
          graphStore.setSelectedNodes([_0x5476c4]),
          commit());
      },
      _0x5eea3a = getNodeCreationMenuSections(CONTEXT_NODE_CREATION_SECTION_IDS, {
        includeDevOnly: isDevModeOn(),
      }).map((_0x1c9be1) => ({
        label: _0x1c9be1.label,
        subItems: _0x1c9be1.items.map((_0x26409c) => {
          const _0x4549a9 = _0x29c241(_0x26409c.type);
          return {
            label: _0x26409c.label,
            desc: _0x26409c.subtitle,
            badge: _0x26409c.badge,
            action: _0x363ca3(
              _0x26409c.type,
              _0x4549a9.width,
              _0x4549a9.height,
              _0x26409c.defaultName || _0x26409c.label,
            ),
          };
        }),
      }));
    (_0x33eb9a(t('canvasInteraction.contextMenu.addNode'), [..._0x5eea3a]),
      _0x18e0c7(),
      _0x343f33(t('canvasInteraction.contextMenu.paste'), 'Ctrl V', () => {
        window.dispatchEvent(
          new CustomEvent('v2:canvas-paste-request', { detail: { screenX: _0x2503bb, screenY: _0x9e1d99 } }),
        );
      }),
      _0x343f33(t('canvasInteraction.contextMenu.undo'), 'Ctrl Z', () => undo()),
      _0x343f33(t('canvasInteraction.contextMenu.redo'), 'Ctrl Y', () => redo()),
      showContextMenu(_0x2503bb, _0x9e1d99, _0x107c0b));
  }
  (_0x1d7319.addEventListener('dblclick', (_0x2b277f) => {
    if (_0x2b277f.target.closest('.v2-node')) return;
    (_0x2b277f.preventDefault(),
      _0x2b277f.stopPropagation(),
      _0x4e3a6f(_0x2b277f.clientX, _0x2b277f.clientY));
  }),
    _0x1d7319.addEventListener('contextmenu', (_0x2ec0b2) => {
      _0x2ec0b2.preventDefault();
      const _0x31dea5 = _0x2ec0b2.target.closest('.v2-node'),
        _0x31718f = getEditableTextTarget(_0x2ec0b2.target),
        _0x14e365 = window.getSelection();
      if (!_0x31dea5 && _0x14e365 && !_0x14e365.isCollapsed)
        try {
          _0x14e365.removeAllRanges();
        } catch {}
      const _0x54c5cc = _0x14e365 ? _0x14e365.toString().trim() : '';
      let _0x576539 = false;
      if (_0x14e365 && _0x54c5cc && _0x14e365.rangeCount > 0 && !_0x14e365.isCollapsed) {
        const _0x1b9277 = _0x2ec0b2.target;
        for (let _0x1ce156 = 0; _0x1ce156 < _0x14e365.rangeCount; _0x1ce156++) {
          const _0x5578d8 = _0x14e365.getRangeAt(_0x1ce156);
          try {
            if (_0x5578d8.intersectsNode(_0x1b9277)) {
              _0x576539 = true;
              break;
            }
          } catch {}
        }
      }
      if (_0x54c5cc && _0x576539) {
        handleTextContextMenu(_0x2ec0b2.clientX, _0x2ec0b2.clientY, _0x54c5cc, {
          anchorNodeId: _0x31dea5?.dataset?.nodeId || _0x31dea5?.id || null,
          pasteTarget: _0x31718f,
          pasteSelection: _0x31718f ? captureEditableSelection(_0x31718f) : null,
        });
        return;
      }
      if (_0x31718f) {
        showTextInputContextMenu({
          target: _0x31718f,
          screenX: _0x2ec0b2.clientX,
          screenY: _0x2ec0b2.clientY,
          snapshot: captureEditableSelection(_0x31718f),
        });
        return;
      }
      if (_0x31dea5) {
        handleContextMenu(_0x2ec0b2.clientX, _0x2ec0b2.clientY);
        return;
      }
      const { selectedNodeIds: _0x21a558 } = getStateRaw();
      if (_0x21a558 && _0x21a558.length > 0) {
        showNodesContextMenu(_0x2ec0b2.clientX, _0x2ec0b2.clientY, {
          primaryNodeId: _0x21a558[_0x21a558.length - 1],
          targetNodeIds: _0x21a558,
        });
        return;
      }
      _0x444c27(_0x2ec0b2.clientX, _0x2ec0b2.clientY);
    }),
    (initCanvasContextMenu._showPicker = _0x4e3a6f));
}
export function handleTextContextMenu(_0x14af30, _0x384b99, _0x28f8cc, _0x43d3f8 = {}) {
  const _0x4bf422 = [],
    _0x2373bf = (_0x107be5, _0x38af50, _0x14837c) => {
      _0x4bf422.push({ label: _0x107be5, kbd: _0x38af50, action: _0x14837c });
    },
    _0x5b770b = () => {
      _0x4bf422.push('sep');
    },
    _0x4521c2 = getStateRaw(),
    { viewport: _0x5a3218, nodes: _0x5ba430 } = _0x4521c2,
    { x: _0x2fc16b, y: _0xc7502d } = screenToWorld(_0x14af30, _0x384b99, _0x5a3218),
    _0x3ffd48 = String(_0x43d3f8.anchorNodeId || '').trim();
  let _0x1ef8ff =
      _0x3ffd48 && _0x5ba430?.[_0x3ffd48]
        ? _0x3ffd48
        : hitTestNode(_0x14af30, _0x384b99, _0x5ba430, _0x5a3218),
    _0x2e0778 = _0x1ef8ff ? _0x5ba430[_0x1ef8ff] : null;
  _0x2e0778 &&
    (graphStore.setSelectedNodes([_0x1ef8ff]),
    _0x2373bf(t('canvasInteraction.contextMenu.copyNode'), 'Ctrl C', () => {
      (executeCommand('copy'), window.showToast?.(t('canvasInteraction.toasts.nodeCopied'), 'success'));
    }),
    _0x2373bf(t('canvasInteraction.contextMenu.cutNode'), 'Ctrl X', () => {
      (executeCommand('copy', { ids: [_0x1ef8ff] }),
        executeCommand('delete_nodes', { ids: [_0x1ef8ff] }),
        window.showToast?.(t('canvasInteraction.toasts.nodeCut'), 'success'));
    }),
    _0x2373bf(t('canvasInteraction.contextMenu.duplicate'), '', () => {
      const _0x4cb71b = getStateRaw().selectedNodeIds,
        _0x3def8a = _0x4cb71b.includes(_0x1ef8ff) ? [..._0x4cb71b] : [_0x1ef8ff],
        _0x236597 = _0x3def8a.length === 1 ? _0x2e0778.height || 0x118 : 0x12c,
        _0x5c17b0 = calcSafeSpawnPosNearNode(_0x5ba430, _0x2e0778, 0x118, _0x236597),
        _0x44c474 = _0x5c17b0.x - _0x2e0778.x,
        _0x1dc599 = _0x5c17b0.y - _0x2e0778.y,
        _0x1373bc = cloneNodesWithEdges(_0x3def8a, _0x44c474, _0x1dc599);
      (graphStore.setSelectedNodes(Object.values(_0x1373bc)),
        window.showToast?.(t('canvasInteraction.toasts.duplicateWithEdgesCreated'), 'success'));
    }));
  _0x2373bf(t('canvasInteraction.contextMenu.copyText'), 'Ctrl C', () => {
    navigator.clipboard
      .writeText(_0x28f8cc)
      .then(() => {
        (markSystemClipboardWrite({ text: _0x28f8cc }),
          window.showToast?.(t('canvasInteraction.toasts.selectedTextCopied'), 'success'));
      })
      .catch(() => {
        window.showToast?.(t('canvasInteraction.toasts.copyFailed'), 'error');
      });
  });
  _0x43d3f8.pasteTarget &&
    _0x2373bf(t('canvasInteraction.contextMenu.pasteText'), 'Ctrl V', () => {
      pasteTextIntoEditableFromClipboard(_0x43d3f8.pasteTarget, _0x43d3f8.pasteSelection || null);
    });
  _0x2e0778 &&
    _0x2373bf(t('canvasInteraction.contextMenu.deleteNode'), 'Del', () => {
      (graphStore.deleteNodes([_0x1ef8ff]), graphStore.clearSelection(), commit());
    });
  _0x5b770b();
  const _0x591335 = (_0xc92c48, _0x55d15e, _0x488ddc, _0x403ed1) => () => {
    const _0x3432b9 =
        _0xc92c48 === 'ai-image' || _0xc92c48 === 'ai-video'
          ? getAIGenerationNodeSize(_0x55d15e, _0x488ddc)
          : { width: _0x55d15e, height: _0x488ddc },
      _0x5baab0 = generateId(_0xc92c48);
    let _0x509abe = _0x2fc16b - _0x3432b9.width / 2,
      _0x43398a = _0xc7502d - _0x3432b9.height / 2;
    if (_0x2e0778) {
      const _0x1ab80d = calcSafeSpawnPosNearNode(_0x5ba430, _0x2e0778, _0x3432b9.width, _0x3432b9.height);
      ((_0x509abe = _0x1ab80d.x), (_0x43398a = _0x1ab80d.y));
    }
    (graphStore.addNode({
      id: _0x5baab0,
      type: _0xc92c48,
      x: _0x509abe,
      y: _0x43398a,
      width: _0x3432b9.width,
      height: _0x3432b9.height,
      name: _0x403ed1,
      prompt: _0x28f8cc,
      needsAutoResize: _0xc92c48 === 'ai-image' || _0xc92c48 === 'ai-video',
      ...(_0xc92c48 === 'ai-image' || _0xc92c48 === 'ai-video' ? { aspectRatio: '自适应' } : {}),
    }),
      graphStore.setSelectedNodes([_0x5baab0]),
      commit());
  };
  {
    const _0x1e6a19 = getAIGenerationDefaultSizeByType('ai-text');
    _0x2373bf(
      _getAiGenerationActionLabel('ai-text'),
      '',
      _0x591335('ai-text', _0x1e6a19.width, _0x1e6a19.height, _getAiGenerationNodeName('ai-text')),
    );
  }
  {
    const _0x2a9021 = getAIGenerationDefaultSizeByType('ai-image');
    _0x2373bf(
      _getAiGenerationActionLabel('ai-image'),
      '',
      _0x591335('ai-image', _0x2a9021.width, _0x2a9021.height, _getAiGenerationNodeName('ai-image')),
    );
  }
  {
    const _0x56bad6 = getAIGenerationDefaultSizeByType('ai-video');
    _0x2373bf(
      _getAiGenerationActionLabel('ai-video'),
      '',
      _0x591335('ai-video', _0x56bad6.width, _0x56bad6.height, _getAiGenerationNodeName('ai-video')),
    );
  }
  {
    const _0x4a3743 = getAIGenerationDefaultSizeByType('ai-audio');
    _0x2373bf(
      _getAiGenerationActionLabel('ai-audio'),
      '',
      _0x591335('ai-audio', _0x4a3743.width, _0x4a3743.height, _getAiGenerationNodeName('ai-audio')),
    );
  }
  showContextMenu(_0x14af30, _0x384b99, _0x4bf422);
}
