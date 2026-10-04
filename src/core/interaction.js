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
function _shouldUseEdgeInteractionLite(value) {
  const item = Number(value?.viewport?.zoom) || 1,
    key = Object.keys(value?.edges || {}).length,
    index = typeof window !== 'undefined' ? window._edgeDomCache : null;
  return (
    item >= EDGE_INTERACTION_LITE_MIN_ZOOM &&
    item <= EDGE_INTERACTION_LITE_MAX_ZOOM &&
    key >= EDGE_INTERACTION_LITE_MIN_EDGES &&
    index &&
    index.size > 0
  );
}
function _setEdgeInteractionLite(enabled) {
  if (typeof document === 'undefined' || !document?.body?.classList) return;
  document.body.classList.toggle(EDGE_INTERACTION_LITE_CLASS, !!enabled);
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
  const result = typeof window !== 'undefined' ? window.v2Renderer?.wrapperMap : null;
  return result && typeof result.size === 'number' ? result.size : 0;
}
function markViewportInteractionBusyForRenderer() {
  try {
    window.v2Renderer?.markViewportInteractionBusy?.();
  } catch {}
}
let isCuttingMode = false,
  lastCutPos = null;
(window.addEventListener('keydown', (event) => {
  event.key === 'Control' &&
    ((isCuttingMode = true), document.documentElement.classList.add('is-cutting-mode'));
}),
  window.addEventListener('keyup', (event2) => {
    event2.key === 'Control' &&
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
function _asPositiveNumber(data) {
  const count = Number(data);
  return Number.isFinite(count) && count > 0 ? count : 0;
}
function _pickMainResultItem(list, options) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const target = Number(options),
    source = Number.isFinite(target) ? Math.max(0, Math.trunc(target)) : 0;
  return list[source] || list[0] || null;
}
function _parseAspectRatio(next) {
  const enabled2 = String(next || '').trim();
  if (!enabled2) return { w: 0, h: 0 };
  const enabled3 = enabled2.match(/(\d+(?:\.\d+)?)\s*[:：xX/]\s*(\d+(?:\.\d+)?)/);
  if (!enabled3) return { w: 0, h: 0 };
  const w = _asPositiveNumber(enabled3[1]),
    h = _asPositiveNumber(enabled3[2]);
  return { w: w, h: h };
}
function _resolveMediaResultSize(box) {
  if (!box || typeof box !== 'object') return { w: 0, h: 0 };
  if (isNodeType(box, 'source-image'))
    return { w: _asPositiveNumber(box.imageWidth), h: _asPositiveNumber(box.imageHeight) };
  if (isNodeType(box, 'source-video'))
    return {
      w: _asPositiveNumber(box.selectedVideoWidth) || _asPositiveNumber(box.videoWidth),
      h: _asPositiveNumber(box.selectedVideoHeight) || _asPositiveNumber(box.videoHeight),
    };
  if (isNodeType(box, 'ai-image')) {
    const box2 = _pickMainResultItem(box.images, box.mainImageIndex);
    let w2 =
        _asPositiveNumber(box2?.imageWidth) ||
        _asPositiveNumber(box2?.width) ||
        _asPositiveNumber(box.imageWidth),
      h2 =
        _asPositiveNumber(box2?.imageHeight) ||
        _asPositiveNumber(box2?.height) ||
        _asPositiveNumber(box.imageHeight);
    if (!(w2 > 0 && h2 > 0)) {
      const _parseAspectRatio2 = _parseAspectRatio(box.aspectRatio);
      ((w2 = _parseAspectRatio2.w), (h2 = _parseAspectRatio2.h));
    }
    return (
      !(w2 > 0 && h2 > 0) && ((w2 = _asPositiveNumber(box.width)), (h2 = _asPositiveNumber(box.height))),
      { w: w2, h: h2 }
    );
  }
  if (isNodeType(box, 'ai-video')) {
    const _pickMainResultItem2 = _pickMainResultItem(box.videos, box.mainVideoIndex);
    let w3 =
        _asPositiveNumber(box.selectedVideoWidth) ||
        _asPositiveNumber(_pickMainResultItem2?.videoWidth) ||
        _asPositiveNumber(box.videoWidth),
      h3 =
        _asPositiveNumber(box.selectedVideoHeight) ||
        _asPositiveNumber(_pickMainResultItem2?.videoHeight) ||
        _asPositiveNumber(box.videoHeight);
    if (!(w3 > 0 && h3 > 0)) {
      const _parseAspectRatio3 = _parseAspectRatio(box.aspectRatio);
      ((w3 = _parseAspectRatio3.w), (h3 = _parseAspectRatio3.h));
    }
    return (
      !(w3 > 0 && h3 > 0) && ((w3 = _asPositiveNumber(box.width)), (h3 = _asPositiveNumber(box.height))),
      { w: w3, h: h3 }
    );
  }
  return { w: 0, h: 0 };
}
function _resolveSourceMediaResetSize(enabled4) {
  if (!enabled4 || typeof enabled4 !== 'object') return getNodeDefaultSize('source-image');
  const { w: w4, h: h4 } = _resolveMediaResultSize(enabled4);
  if (w4 > 0 && h4 > 0) {
    if (isNodeType(enabled4, ['ai-image', 'ai-video'])) return getAIGenerationNodeSize(w4, h4);
    return getAutoMediaSizeByShortSide(w4, h4);
  }
  if (isNodeType(enabled4, ['ai-image', 'ai-video'])) return getAIGenerationNodeSize();
  if (isNodeType(enabled4, 'source-video')) return getNodeDefaultSize('source-video');
  if (isNodeType(enabled4, 'source-image')) return getNodeDefaultSize('source-image');
  return getNodeDefaultSize('source-image');
}
function _getAiGenerationMenuItem(type, label, name = label) {
  const w5 = getAIGenerationDefaultSizeByType(type);
  return { label: label, name: name, type: type, w: w5.width, h: w5.height };
}
function _getAiGenerationActionLabel(current) {
  if (current === 'ai-image') return t('canvasInteraction.generation.image');
  if (current === 'ai-video') return t('canvasInteraction.generation.video');
  if (current === 'ai-audio') return t('canvasInteraction.generation.audio');
  return t('canvasInteraction.generation.text');
}
function _getAiGenerationNodeName(entry) {
  if (entry === 'ai-image') return t('canvasInteraction.generationNames.image');
  if (entry === 'ai-video') return t('canvasInteraction.generationNames.video');
  if (entry === 'ai-audio') return t('canvasInteraction.generationNames.audio');
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
function _createQuickStoryboardNodeFromPrimary(record, sourceWidth, baseShortSide) {
  if (!sourceWidth || !baseShortSide) return;
  const imageRef = resolveStoryboardSourceImageRef(sourceWidth);
  if (!imageRef) return;
  const id = generateId('storyboard'),
    { nodes: nodes2 } = getStateRaw(),
    width = computeQuickCreateStoryboardSize({
      sourceWidth: sourceWidth.width,
      sourceHeight: sourceWidth.height,
      baseShortSide: baseShortSide.baseShortSide,
    }),
    x = calcSafeSpawnPosNearNode(nodes2, sourceWidth, width.width, width.height),
    storyboardNodePayload = buildStoryboardNodePayload({
      id: id,
      name: t(baseShortSide.nameKey),
      x: x.x,
      y: x.y,
      width: width.width,
      height: width.height,
      cols: baseShortSide.cols,
      rows: baseShortSide.rows,
      aspectRatio: resolveNearestStoryboardAspect(sourceWidth.width, sourceWidth.height),
      cells: buildQuickCreateStoryboardCells({
        cols: baseShortSide.cols,
        rows: baseShortSide.rows,
        imageRef: imageRef,
      }),
    });
  (graphStore.addNode(storyboardNodePayload),
    graphStore.setSelectedNodes([id]),
    commit(),
    window.v2FocusOnNodes && requestAnimationFrame(() => window.v2FocusOnNodes([record, id])));
}
function _createCollageNodeFromSelection(payload) {
  const list2 = Array.isArray(payload) ? payload : [],
    { nodes: nodes3 } = getStateRaw(),
    list3 = list2.map((item2) => nodes3[item2]).filter(Boolean),
    nodes4 = list3.filter(isCollageImageNode);
  if (nodes4.length === 0)
    return (window.showToast?.(t('canvasInteraction.grids.noImages'), 'warning'), null);
  const id2 = generateId('collage'),
    box3 = buildCollageNodeDataFromSelection({
      id: id2,
      nodes: nodes4,
      name: t('canvasInteraction.grids.collageName'),
    });
  if (!box3) return (window.showToast?.(t('canvasInteraction.grids.boundsFailed'), 'error'), null);
  const x2 = calcSafeSpawnPosNearNode(nodes3, box3, box3.width, box3.height);
  return (
    graphStore.addNode({ ...box3, x: x2.x, y: x2.y }),
    graphStore.setSelectedNodes([id2]),
    commit(),
    window.v2FocusOnNodes &&
      requestAnimationFrame(() => window.v2FocusOnNodes([...nodes4.map((item3) => item3.id), id2])),
    window.showToast?.(t('canvasInteraction.grids.created'), 'success'),
    id2
  );
}
function _clearStoryboardHighlight(enabled5) {
  if (!enabled5) return;
  const handle = window.v2Renderer?.nodeInstances?.get(enabled5);
  if (handle && typeof handle.highlightCell === 'function') handle.highlightCell(-1);
}
function _resetDragContext() {
  dragContext?.isDragging && endDragFpsSession('node-drag');
  dragContext?.isPanning && endPanFpsSession('canvas-pan');
  const state = dragContext?.lastHoverNodeId || null;
  if (state) _clearStoryboardHighlight(state);
  ((dragContext = _createIdleDragContext()),
    document.body.classList.remove(
      'is-panning',
      'is-dragging',
      'is-edge-interaction-lite',
      'is-dragging-heavy-edges',
    ),
    document.querySelectorAll('.is-ui-hidden').forEach((el) => el.classList.remove('is-ui-hidden')),
    document.querySelectorAll('.v2-node.is-dragging').forEach((el2) => el2.classList.remove('is-dragging')),
    stopAutoPan(),
    _sampledPointerMove?.cancel?.(),
    cancelPendingViewportUpdate(),
    cancelViewportPanPreview());
}
function _resetCellDragContext() {
  const config = dragContext?.lastHoverNodeId || null;
  if (config) _clearStoryboardHighlight(config);
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
    updatePreview: (box4) => {
      updateViewportPanPreview(box4.x, box4.y, box4.zoom);
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
    focusNodes: (scope) => window.v2FocusOnNodes?.(scope),
    translate: t,
    showToast: (...args) => window.showToast?.(...args),
    scheduleFrame: (input) => requestAnimationFrame(input),
    windowObject: typeof window !== 'undefined' ? window : null,
  });
setDragContextGetter(() => dragContext);
let viewportRafId = null,
  pendingViewportUpdate = null,
  assistPanMirrorTimer = 0,
  pendingAssistPanMirrorViewport = null;
function syncSidePlusToLastPointer(options2 = {}) {
  const run =
    typeof window !== 'undefined' && typeof window._v2UpdateSidePlusNow === 'function'
      ? window._v2UpdateSidePlusNow
      : typeof window !== 'undefined'
        ? window._v2UpdateSidePlus
        : null;
  typeof run === 'function' && run(lastMouseScreenX, lastMouseScreenY, options2);
}
function updateViewportBatched(x3, y, zoom) {
  ((pendingViewportUpdate = { x: x3, y: y, zoom: zoom }),
    !viewportRafId && (viewportRafId = requestAnimationFrame(flushViewportUpdate)));
}
function flushViewportUpdate() {
  viewportRafId = null;
  if (pendingViewportUpdate) {
    const { x: x4, y: y2, zoom: zoom2 } = pendingViewportUpdate;
    ((pendingViewportUpdate = null), graphStore.updateViewport(x4, y2, zoom2), syncSidePlusToLastPointer());
  }
}
function cancelPendingViewportUpdate() {
  (viewportRafId && (cancelAnimationFrame(viewportRafId), (viewportRafId = null)),
    (pendingViewportUpdate = null));
}
function flushAssistPanStoreMirror() {
  assistPanMirrorTimer = 0;
  const box5 = pendingAssistPanMirrorViewport;
  pendingAssistPanMirrorViewport = null;
  if (!box5 || !dragContext?.assistPanActive) return;
  (graphStore.updateViewport(box5.x, box5.y, box5.zoom), syncSidePlusToLastPointer());
}
function scheduleAssistPanStoreMirror(args2) {
  pendingAssistPanMirrorViewport = args2 ? { ...args2 } : null;
  if (assistPanMirrorTimer) return;
  assistPanMirrorTimer = window.setTimeout(flushAssistPanStoreMirror, 32);
}
function cancelAssistPanStoreMirror() {
  (assistPanMirrorTimer && (window.clearTimeout(assistPanMirrorTimer), (assistPanMirrorTimer = 0)),
    (pendingAssistPanMirrorViewport = null));
}
function _commitAssistPanPreview() {
  if (!dragContext?.assistPanActive) return null;
  const box6 = flushViewportPanPreview();
  (cancelAssistPanStoreMirror(),
    (dragContext.assistPanActive = false),
    (dragContext.assistPanViewport = null),
    cancelPendingViewportUpdate(),
    window._v2FlushMinimapViewportPreview?.(box6));
  if (!box6) return (syncSidePlusToLastPointer(), null);
  const run2 = () => {
    (graphStore.updateViewport(box6.x, box6.y, box6.zoom), graphStore.markViewportPersist?.());
  };
  return (
    typeof graphStore.batch === 'function' ? graphStore.batch(run2) : run2(),
    syncSidePlusToLastPointer(),
    box6
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
  const { viewport: viewport } = getStateRaw(),
    output = _autoPanPendingDx || autoPanState.dx,
    value2 = _autoPanPendingDy || autoPanState.dy;
  (output !== autoPanState.dx || value2 !== autoPanState.dy) &&
    ((autoPanState.dx = output), (autoPanState.dy = value2));
  ((_autoPanPendingDx = 0), (_autoPanPendingDy = 0));
  const x5 = viewport.x - autoPanState.dx,
    y3 = viewport.y - autoPanState.dy;
  updateViewportBatched(x5, y3, viewport.zoom);
  if (dragContext.isDragging) {
    const stateRaw = getStateRaw(),
      { nodes: nodes5 } = stateRaw,
      { x: x6, y: y4 } = screenToWorld(lastMouseScreenX, lastMouseScreenY, {
        x: x5,
        y: y3,
        zoom: viewport.zoom,
      });
    dragController.updateDraggingNodes(
      dragContext,
      lastMouseScreenX,
      lastMouseScreenY,
      x6,
      y4,
      x6,
      y4,
      stateRaw,
    );
  }
  autoPanReqId = requestAnimationFrame(autoPanLoop);
}
function checkAutoPan(value3, value4) {
  ((lastMouseScreenX = value3), (lastMouseScreenY = value4));
  if (!dragContext.isDragging && !dragContext.isBoxSelecting && !dragContext.isConnecting) {
    stopAutoPan();
    return;
  }
  const value5 = 60,
    value6 = 15;
  let count2 = 0,
    count3 = 0;
  if (value3 < value5) count2 = -value6;
  else {
    if (value3 > window.innerWidth - value5) count2 = value6;
  }
  if (value4 < value5) count3 = -value6;
  else {
    if (value4 > window.innerHeight - value5) count3 = value6;
  }
  count2 !== 0 || count3 !== 0
    ? ((_autoPanPendingDx = count2),
      (_autoPanPendingDy = count3),
      !autoPanReqId && (autoPanReqId = requestAnimationFrame(autoPanLoop)))
    : stopAutoPan();
}
export function handlePointerDown(value7, value8, enabled6 = false, value9 = false, event3 = null) {
  ((lastMouseScreenX = value7), (lastMouseScreenY = value8));
  const stateRaw2 = getStateRaw(),
    { viewport: viewport2 } = stateRaw2,
    { x: x7, y: y5 } = screenToWorld(value7, value8, viewport2),
    value10 = stateRaw2.pickConnectMode;
  if (value10 && value10.active) {
    if (event3?.button === 2) {
      (event3.stopPropagation?.(), event3.stopImmediatePropagation?.());
      return;
    }
    const value11 = event3 && event3.target && event3.target.closest('.v2-node');
    if (value11) return;
  }
  if (!enabled6 && dragController.tryStartTitleDrag(dragContext, event3, x7, y5)) {
    beginDragFpsSession('node-drag');
    return;
  }
  if (!enabled6 && edgeController.tryStartHandleConnect(dragContext, event3, x7, y5, viewport2)) return;
  if (enabled6) {
    ((dragContext.isPanning = true),
      (dragContext.panStartX = value7),
      (dragContext.panStartY = value8),
      (dragContext.panStartViewportX = viewport2.x),
      (dragContext.panStartViewportY = viewport2.y),
      (dragContext.panStartZoom = viewport2.zoom),
      (dragContext.panStartPerf = nowMs()),
      (dragContext.panMoveCount = 0),
      (dragContext.panMinimapPreviewCount = Number(window._v2GetMinimapPreviewFlushCount?.()) || 0),
      markViewportInteractionBusyForRenderer(),
      beginPanFpsSession('canvas-pan'),
      beginViewportPanPreview(viewport2),
      window._v2ScheduleMinimapViewportPreview?.(viewport2, { force: true }),
      document.body.classList.add('is-panning'),
      _setEdgeInteractionLite(_shouldUseEdgeInteractionLite(stateRaw2)));
    return;
  }
  if (dragController.tryStartNodeDrag(dragContext, value7, value8, x7, y5, value9, event3)) {
    dragContext.isDragging && beginDragFpsSession('node-drag');
    return;
  }
  if (!enabled6 && !event3?.ctrlKey) {
    selectionController.startBoxSelecting(dragContext, value7, value8);
    return;
  }
}
function _handlePointerMoveImpl(value12, value13, enabled7 = false, value14 = null) {
  const value15 = lastMouseScreenX,
    value16 = lastMouseScreenY;
  ((lastMouseScreenX = value12), (lastMouseScreenY = value13));
  if (dragContext.isPanning) {
    const value17 = value12 - dragContext.panStartX,
      value18 = value13 - dragContext.panStartY,
      box7 = {
        x: dragContext.panStartViewportX + value17,
        y: dragContext.panStartViewportY + value18,
        zoom: dragContext.panStartZoom,
      };
    ((dragContext.panMoveCount = (dragContext.panMoveCount || 0) + 1),
      updateViewportPanPreview(box7.x, box7.y, box7.zoom),
      window._v2ScheduleMinimapViewportPreview?.(box7));
    return;
  }
  dragContext.assistPanActive && !enabled7 && _commitAssistPanPreview();
  let args3 = getStateRaw(),
    { viewport: viewport3, nodes: nodes6 } = args3;
  if ((dragContext.isDragging || dragContext.isConnecting) && enabled7) {
    stopAutoPan();
    if (!dragContext.assistPanActive) {
      (flushViewportUpdate(), (args3 = getStateRaw()), ({ viewport: viewport3, nodes: nodes6 } = args3));
      const value19 = { ...viewport3 };
      ((dragContext.assistPanActive = true),
        (dragContext.assistPanViewport = value19),
        beginViewportPanPreview(value19),
        window._v2ScheduleMinimapViewportPreview?.(value19, { force: true }));
    }
    const value20 = value12 - value15,
      value21 = value13 - value16,
      x8 = dragContext.assistPanViewport || viewport3,
      viewport4 = { x: x8.x + value20, y: x8.y + value21, zoom: x8.zoom };
    ((dragContext.assistPanViewport = viewport4),
      updateViewportPanPreview(viewport4.x, viewport4.y, viewport4.zoom),
      scheduleAssistPanStoreMirror(viewport4),
      window._v2ScheduleMinimapViewportPreview?.(viewport4));
    const { x: x9, y: y6 } = screenToWorld(value12, value13, viewport4);
    if (dragContext.isConnecting) {
      edgeController.updateHandleConnect(
        dragContext,
        value12,
        value13,
        x9,
        y6,
        viewport4,
        nodes6,
        args3.connOverlay,
      );
      return;
    }
    const value22 = { ...args3, viewport: viewport4 };
    dragController.updateDraggingNodes(dragContext, value12, value13, x9, y6, x9, y6, value22);
    return;
  }
  let { x: x10, y: y7 } = screenToWorld(value12, value13, viewport3);
  const value23 = x10,
    value24 = y7;
  if (isCuttingMode && value14 && value14.buttons === 1) {
    if (lastCutPos) {
      const stateRaw3 = getStateRaw(),
        list4 = [];
      for (const [value25, value26] of Object.entries(stateRaw3.edges)) {
        const box8 = stateRaw3.nodes[value26.sourceId],
          box9 = stateRaw3.nodes[value26.targetId];
        if (!box8 || !box9) continue;
        const value27 = box8.x + (box8.width || 0x104),
          value28 = box8.y + (box8.height || 100) / 2,
          value29 = box9.x,
          value30 = box9.y + (box9.height || 100) / 2,
          checkBBoxIntersection2 = checkBBoxIntersection(
            lastCutPos.x,
            lastCutPos.y,
            x10,
            y7,
            value27,
            value28,
            value29,
            value30,
          );
        if (!checkBBoxIntersection2) continue;
        const checkLineIntersection2 = checkLineIntersection(
          lastCutPos.x,
          lastCutPos.y,
          x10,
          y7,
          value27,
          value28,
          value29,
          value30,
        );
        checkLineIntersection2 && list4.push(value25);
      }
      list4.length > 0 && graphStore.updateEdgesBatch(list4, []);
    }
    lastCutPos = { x: x10, y: y7 };
    return;
  } else lastCutPos = null;
  if (dragContext.isConnecting) {
    edgeController.updateHandleConnect(
      dragContext,
      value12,
      value13,
      x10,
      y7,
      viewport3,
      nodes6,
      args3.connOverlay,
    );
    return;
  }
  if (dragContext.isBoxSelecting) {
    selectionController.updateBoxSelecting(dragContext, value12, value13);
    return;
  }
  if (dragContext.isDraggingCell) {
    dragController.updateDraggingCell(dragContext, value12, value13, x10, y7, nodes6);
    return;
  }
  if (!dragContext.isDragging) return;
  (dragController.updateDraggingNodes(dragContext, value12, value13, x10, y7, value23, value24, args3),
    checkAutoPan(value12, value13));
}
const _sampledPointerMove = rafSampleLatest(_handlePointerMoveImpl);
export function handlePointerMove(value31, value32, value33 = null) {
  const enabled8 = value33?.__aiCanvasLeftDragHeld === true;
  if (value33 && value33.buttons === 0 && !enabled8) {
    if (
      dragContext.isDragging ||
      dragContext.isPanning ||
      dragContext.isConnecting ||
      dragContext.isBoxSelecting ||
      dragContext.isDraggingCell
    ) {
      handlePointerUp(value31, value32);
      return;
    }
  }
  if (enabled8 && dragContext.assistPanActive) {
    (_sampledPointerMove.cancel?.(), _handlePointerMoveImpl(value31, value32, false, value33));
    return;
  }
  const value34 = !!(value33 && (value33.buttons & 4) !== 0),
    value35 = (dragContext.isDragging || dragContext.isConnecting) && (value34 || window._spaceHeld === true);
  _sampledPointerMove(value31, value32, value35, value33);
}
export function handlePointerUp(value36 = 0, value37 = 0) {
  if (
    !dragContext.isDragging &&
    !dragContext.isPanning &&
    !dragContext.isConnecting &&
    !dragContext.isBoxSelecting &&
    !dragContext.isDraggingCell
  )
    return;
  let value38 = false;
  const value39 = !!dragContext.isPanning,
    value40 = dragContext.panStartPerf || nowMs(),
    moveCount = dragContext.panMoveCount || 0,
    value41 = dragContext.panMinimapPreviewCount || 0;
  stopAutoPan();
  if (value39) {
    markViewportInteractionBusyForRenderer();
    const box10 = flushViewportPanPreview(),
      value42 =
        Number(window._v2FlushMinimapViewportPreview?.(box10)) ||
        Number(window._v2GetMinimapPreviewFlushCount?.()) ||
        value41;
    (endPanFpsSession('canvas-pan'), cancelPendingViewportUpdate());
    const run3 = () => {
      (box10 && graphStore.updateViewport(box10.x, box10.y, box10.zoom), graphStore.markViewportPersist());
    };
    typeof graphStore.batch === 'function' ? graphStore.batch(run3) : run3();
    const value43 =
        (typeof graphStore.getStateRaw === 'function' && graphStore.getStateRaw()) || getStateRaw(),
      finalX = box10 || value43?.viewport || {};
    recordCanvasPanSample({
      durationMs: nowMs() - value40,
      moveCount: moveCount,
      committed: !!box10,
      nodeCount: Number.isFinite(value43?._nodeCount)
        ? value43._nodeCount
        : Object.keys(value43?.nodes || {}).length,
      edgeCount: Object.keys(value43?.edges || {}).length,
      mountedNodeCount: getMountedNodeCountForPerf(),
      minimapPreviewCount: Math.max(0, value42 - value41),
      finalX: finalX.x,
      finalY: finalX.y,
      finalZoom: finalX.zoom,
    });
  } else dragContext.assistPanActive ? _commitAssistPanPreview() : flushViewportUpdate();
  if (dragContext.isDraggingCell) {
    const value44 = dragController.finishDraggingCell(dragContext, value36, value37);
    _resetCellDragContext();
    if (value44.didAct) _deferCommit();
    return;
  }
  if (dragContext.isConnecting)
    value38 = edgeController.finishHandleConnect(dragContext, value36, value37) || value38;
  else {
    if (dragContext.isBoxSelecting) {
      const value45 = selectionController.finishBoxSelecting(dragContext, value36, value37);
      value38 = value45.didAct || value38;
    } else {
      if (dragContext.isDragging) {
        const value46 = dragController.finishDraggingNodes(dragContext, value36, value37);
        if (value46.earlyCommit) {
          (window._clearSnapGuideLines?.(), _resetDragContext());
          return;
        }
        value38 = value46.didAct || value38;
      }
    }
  }
  (window._clearSnapGuideLines?.(), _resetDragContext());
  value39 && syncSidePlusToLastPointer();
  if (value38) commit();
}
export function handleWheel(value47, value48, value49) {
  zoomController.handleWheel(value47, value48, value49);
}
export function handleWheelPan(value50, value51, value52) {
  return wheelPanController.handleWheelPan(value50, value51, value52);
}
export function settleWheelZoom() {
  return flushViewportUpdate();
}
export function settleWheelPan() {
  return wheelPanController.settleWheelPan();
}
export function executeCanvasCommand(value53, value54 = {}) {
  return interactionCommandAdapter.executeCanvasCommand(value53, value54);
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
export function handleDoubleClick(value55, value56) {
  const { viewport: viewport5, nodes: nodes7 } = getStateRaw(),
    { x: x11, y: y8 } = screenToWorld(value55, value56, viewport5);
  for (const box11 of Object.values(nodes7)) {
    const isPointInRect2 = isPointInRect(x11, y8, box11.x, box11.y, box11.width, box11.height);
    if (isPointInRect2) return;
  }
  uiStore.showPicker(value55, value56, x11, y8);
}
export function handleContextMenu(value57, value58) {
  const stateRaw4 = getStateRaw(),
    primaryNodeId = hitTestNode(value57, value58, stateRaw4.nodes, stateRaw4.viewport);
  if (!primaryNodeId) return;
  const list5 = stateRaw4.selectedNodeIds || [];
  !list5.includes(primaryNodeId) && graphStore.setSelectedNodes([primaryNodeId]);
  const targetNodeIds = getStateRaw();
  showNodesContextMenu(value57, value58, {
    primaryNodeId: primaryNodeId,
    targetNodeIds: targetNodeIds.selectedNodeIds,
  });
}
function calcNodesBBox(value59, value60) {
  let x12 = Infinity,
    y9 = Infinity,
    width2 = -Infinity,
    height = -Infinity;
  for (const value61 of value60) {
    const box12 = value59[value61];
    if (!box12) continue;
    const value62 = box12.width || 0x104,
      value63 = box12.height || 100;
    ((x12 = Math.min(x12, box12.x)),
      (y9 = Math.min(y9, box12.y)),
      (width2 = Math.max(width2, box12.x + value62)),
      (height = Math.max(height, box12.y + value63)));
  }
  if (x12 === Infinity) return null;
  return { x: x12, y: y9, width: width2 - x12, height: height - y9 };
}
function showNodesContextMenu(screenX, screenY, value64) {
  removeContextMenus();
  const stateRaw5 = getStateRaw(),
    { nodes: nodes8 } = stateRaw5,
    list6 = Array.isArray(value64?.targetNodeIds) ? value64.targetNodeIds : [],
    list7 = list6.filter((item4) => !!nodes8[item4]);
  if (list7.length === 0) return;
  const sourceId = value64?.primaryNodeId && nodes8[value64.primaryNodeId] ? value64.primaryNodeId : list7[0],
    box13 = sourceId ? nodes8[sourceId] : null,
    calcNodesBBox2 = calcNodesBBox(nodes8, list7),
    list8 = [],
    handler = (label2, kbd, action) => {
      list8.push({ label: label2, kbd: kbd, action: action });
    },
    handler2 = () => {
      list8.push('sep');
    },
    handler3 = (label3, subItems) => {
      list8.push({ label: label3, subItems: subItems });
    };
  (handler(t('canvasInteraction.contextMenu.copyNode'), 'Ctrl C', () => {
    (executeCommand('copy', { ids: [...list7] }),
      window.showToast?.(t('canvasInteraction.toasts.nodeCopied'), 'success'));
  }),
    handler(t('canvasInteraction.contextMenu.cutNode'), 'Ctrl X', () => {
      const ids = [...list7];
      (executeCommand('copy', { ids: ids }),
        executeCommand('delete_nodes', { ids: ids }),
        window.showToast?.(t('canvasInteraction.toasts.nodeCut'), 'success'));
    }),
    handler(t('canvasInteraction.contextMenu.paste'), 'Ctrl V', () => {
      window.dispatchEvent(
        new CustomEvent('v2:canvas-paste-request', { detail: { screenX: screenX, screenY: screenY } }),
      );
    }));
  handler('导出选中节点本地媒体…', '', () => {
    import('../modules/nodeExport/NodeMediaExportDialog.js')
      .then(({ openNodeMediaExportDialog }) => openNodeMediaExportDialog(nodes8, [...list7]))
      .catch(() => window.showToast?.('媒体导出窗口加载失败', 'error'));
  });
  handler('导出视频时间线工程（Premiere XML）…', '', () => {
    import('../modules/timelineExport/TimelineExportDialog.js')
      .then(({ openTimelineExportDialog }) => openTimelineExportDialog(nodes8, [...list7]))
      .catch(() => window.showToast?.('时间线导出窗口加载失败', 'error'));
  });
  const list9 = list7.filter((item5) => isCollageImageNode(nodes8[item5]));
  list9.length >= 2 &&
    handler(t('canvasInteraction.contextMenu.createCollage'), '', () => {
      _createCollageNodeFromSelection(list9);
    });
  if (box13 && list7.length === 1) {
    const value65 = box13.type === 'ai-image' || box13.type === 'source-image' || box13.type === 'storyboard';
    if (value65) {
      const value66 = box13.imageUrl || box13.sourceUrl || box13.src || box13.localPath;
      value66 &&
        handler(t('canvasInteraction.contextMenu.copyImage'), 'Ctrl+Shift+C', () => {
          (box13.id && graphStore.setSelectedNodes([box13.id]),
            window.dispatchEvent(new CustomEvent('shortcut-action', { detail: 'copy-media' })));
        });
    }
  }
  const value67 = (event4) => {
    if (!sourceId || !list7.length) return;
    const point = {
      x: Number.isFinite(Number(event4?.clientX)) ? Number(event4.clientX) : screenX,
      y: Number.isFinite(Number(event4?.clientY)) ? Number(event4.clientY) : screenY,
    };
    (graphStore.setSelectedNodes([...list7]),
      import('../modules/AssetManager.js')
        .then(({ assetManager: assetManager }) => {
          assetManager.showCreatePanel([...list7], null, { placement: 'center', point: point });
        })
        .catch(() => window.showToast?.(t('canvasInteraction.toasts.assetPanelFailed'), 'error')));
  };
  let nodeLocalPathForNativeAction = '',
    canShowItemInFolder2 = false,
    canOpenKnownFolder2 = false;
  box13 &&
    list7.length === 1 &&
    ((nodeLocalPathForNativeAction = resolveNodeLocalPathForNativeAction(box13)),
    (canShowItemInFolder2 = canShowItemInFolder(nodeLocalPathForNativeAction)),
    (canOpenKnownFolder2 = canOpenKnownFolder('output')));
  (box13 || canShowItemInFolder2) &&
    (handler2(),
    box13 && handler(t('canvasInteraction.contextMenu.addAsset'), '', value67),
    canShowItemInFolder2 &&
      handler(t('canvasInteraction.contextMenu.revealAsset'), '', () => {
        showItemInFolder(nodeLocalPathForNativeAction).catch(() =>
          window.showToast?.(t('canvasInteraction.toasts.assetRevealFailed'), 'error'),
        );
      }),
    handler2());
  canOpenKnownFolder2 &&
    (handler(t('canvasInteraction.contextMenu.openOutputFolder'), '', () => {
      openKnownFolder('output').catch(() =>
        window.showToast?.(t('canvasInteraction.toasts.outputFolderFailed'), 'error'),
      );
    }),
    handler2());
  handler(t('canvasInteraction.contextMenu.duplicate'), '', () => {
    const stateRaw6 = getStateRaw(),
      enabled9 = stateRaw6.nodes,
      list10 = (stateRaw6.selectedNodeIds || []).filter((item6) => !!enabled9[item6]),
      value68 = list10.length > 0 ? list10 : [...list7],
      box14 = calcNodesBBox(enabled9, value68),
      value69 = Math.max(0x118, box14?.width || 0),
      value70 = Math.max(0x12c, box14?.height || 0),
      box15 = (sourceId && enabled9[sourceId]) || box14;
    if (!box15) return;
    const box16 = calcSafeSpawnPosNearNode(enabled9, box15, value69, value70),
      value71 = box16.x - box15.x,
      value72 = box16.y - box15.y,
      cloneNodesWithEdges2 = cloneNodesWithEdges(value68, value71, value72);
    (graphStore.setSelectedNodes(Object.values(cloneNodesWithEdges2)),
      window.showToast?.(t('canvasInteraction.toasts.duplicateWithEdgesCreated'), 'success'));
  });
  box13 &&
    list7.length === 1 &&
    (box13.type === 'ai-text' || box13.type === 'source-text') &&
    handler(t('canvasInteraction.contextMenu.copyText'), '', () => {
      const text = box13.outputText || box13.content || '';
      text
        ? navigator.clipboard
            .writeText(text)
            .then(() => {
              (markSystemClipboardWrite({ text: text }),
                window.showToast?.(t('canvasInteraction.toasts.textCopied'), 'success'));
            })
            .catch(() => {
              window.showToast?.(t('canvasInteraction.toasts.copyFailed'), 'error');
            })
        : window.showToast?.(t('canvasInteraction.toasts.noNodeText'), 'warn');
    });
  handler(t('canvasInteraction.contextMenu.deleteNode'), 'Del', () => {
    executeCommand('delete_nodes', { ids: [...list7] });
  });
  if (box13 && list7.length === 1) {
    handler2();
    const list11 = [
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
      list12 = list11.filter((type2) =>
        isValidConnection(box13, { id: '__fake_' + type2.type, type: type2.type }),
      );
    list12.length > 0 &&
      list12.forEach((type3) => {
        handler(type3.label, '', () => {
          const id3 = generateId(type3.type);
          let width3 = type3.w,
            height2 = type3.h;
          if ((type3.type === 'ai-image' || type3.type === 'ai-video') && box13.width && box13.height) {
            const box17 = getAIGenerationNodeSize(box13.width, box13.height);
            ((width3 = box17.width), (height2 = box17.height));
          }
          const { nodes: nodes9 } = getStateRaw(),
            x13 = calcSafeSpawnPosNearNode(nodes9, box13, width3, height2);
          let args4 = {
            id: id3,
            type: type3.type,
            x: x13.x,
            y: x13.y,
            width: width3,
            height: height2,
            name: type3.name,
          };
          (type3.type === 'ai-image' || type3.type === 'ai-video') &&
            !Object.prototype.hasOwnProperty.call(args4, 'aspectRatio') &&
            (args4.aspectRatio = '自适应');
          if (box13.type === type3.type) {
            const box18 = { ...box13 };
            (delete box18.id,
              delete box18.x,
              delete box18.y,
              delete box18.width,
              delete box18.height,
              delete box18.name,
              delete box18.prompt,
              delete box18.outputText,
              stripImageGenerationResultStateForDerivedNode(box18),
              (args4 = { ...box18, ...args4 }));
          }
          graphStore.addNode(args4);
          const addEdgeWithPolicies2 = addEdgeWithPolicies({ sourceId: sourceId, targetId: id3 });
          if (!addEdgeWithPolicies2) {
            const id4 = 'edge-' + sourceId + '-' + id3 + '-' + Date.now();
            graphStore.addEdge({
              id: id4,
              sourceId: sourceId,
              targetId: id3,
              createdAt: Date.now(),
            });
          }
          (graphStore.setSelectedNodes([id3]), commit());
        });
      });
    if (box13 && list7.length === 1) {
      const value73 =
        box13.type === 'ai-image' || box13.type === 'source-image' || box13.type === 'storyboard';
      if (value73) {
        const storyboardSourceImageRef = resolveStoryboardSourceImageRef(box13);
        if (storyboardSourceImageRef) {
          handler2();
          const value74 = STORYBOARD_QUICK_CREATE_PRESETS.map((item7) => ({
            label: t(item7.labelKey),
            action: () => _createQuickStoryboardNodeFromPrimary(sourceId, box13, item7),
          }));
          handler3(t('canvasInteraction.grids.createGrid'), value74);
        }
      }
    }
  }
  showContextMenu(screenX, screenY, list8);
}
export function cloneNodesWithEdges(list13, value75 = 16, value76 = 16) {
  const stateRaw7 = getStateRaw(),
    { nodes: nodes10, edges: edges2 } = stateRaw7,
    sourceId2 = {};
  list13.forEach((item8) => {
    const x14 = nodes10[item8];
    if (!x14) return;
    const id5 = 'node_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    sourceId2[item8] = id5;
    const args5 = JSON.parse(JSON.stringify(x14));
    (stripImageGenerationRuntimeState(args5),
      graphStore.addNode({
        ...args5,
        id: id5,
        x: x14.x + value75,
        y: x14.y + value76,
      }));
  });
  const list14 = [];
  return (
    Object.values(edges2).forEach((args6) => {
      const value77 = list13.includes(args6.sourceId),
        value78 = list13.includes(args6.targetId);
      if (value77 && value78)
        list14.push({
          ...args6,
          id: 'edge_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          sourceId: sourceId2[args6.sourceId],
          targetId: sourceId2[args6.targetId],
        });
      else {
        if (value77)
          list14.push({
            ...args6,
            id: 'edge_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            sourceId: sourceId2[args6.sourceId],
          });
        else
          value78 &&
            list14.push({
              ...args6,
              id: 'edge_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
              targetId: sourceId2[args6.targetId],
            });
      }
    }),
    list14.length > 0 && graphStore.updateEdgesBatch([], list14),
    commit(),
    sourceId2
  );
}
export function executeCommand(value79, sourceNodeId = {}) {
  const nodesById = getStateRaw();
  switch (value79) {
    case 'delete_edge':
      sourceNodeId.id && (graphStore.removeEdge(sourceNodeId.id), commit());
      break;
    case 'delete_nodes':
      sourceNodeId.ids &&
        sourceNodeId.ids.length > 0 &&
        (graphStore.deleteNodes(sourceNodeId.ids), graphStore.clearSelection(), commit());
      break;
    case 'hide_picker':
      uiStore.hidePicker();
      break;
    case 'rename_node':
      sourceNodeId.id &&
        typeof sourceNodeId.name === 'string' &&
        graphStore.renameNode(sourceNodeId.id, sourceNodeId.name);
      break;
    case 'set_pick_connect_mode':
      uiStore.setPickConnectMode({
        active: !!sourceNodeId.active,
        sourceNodeId: sourceNodeId.sourceNodeId !== undefined ? sourceNodeId.sourceNodeId : null,
        handleDirection: sourceNodeId.handleDirection !== undefined ? sourceNodeId.handleDirection : null,
        hoverNodeId: sourceNodeId.hoverNodeId !== undefined ? sourceNodeId.hoverNodeId : null,
      });
      break;
    case 'group':
      if (sourceNodeId.ids && sourceNodeId.ids.length > 1) {
        let x15 = Infinity,
          y10 = Infinity,
          width4 = -Infinity,
          height3 = -Infinity;
        sourceNodeId.ids.forEach((item9) => {
          const box19 = nodesById.nodes[item9];
          if (!box19) return;
          const value80 = box19.x,
            value81 = box19.y,
            value82 = box19.width || 0x104,
            value83 = box19.height || 100;
          ((x15 = Math.min(x15, value80)),
            (y10 = Math.min(y10, value81)),
            (width4 = Math.max(width4, value80 + value82)),
            (height3 = Math.max(height3, value81 + value83)));
        });
        const value84 = 32,
          id6 = generateId('group');
        (graphStore.addNode({
          id: id6,
          type: 'group',
          x: x15 - value84,
          y: y10 - value84 * 1.5,
          width: width4 - x15 + value84 * 2,
          height: height3 - y10 + value84 * 2.5,
          title: t('canvasInteraction.group.newGroup'),
          color: 'var(--indigo)',
        }),
          graphStore.groupNodes(sourceNodeId.ids, id6),
          graphStore.setSelectedNodes([id6]),
          commit());
      }
      break;
    case 'ungroup':
      sourceNodeId.ids &&
        sourceNodeId.ids.length > 0 &&
        (sourceNodeId.ids.forEach((item10) => {
          const value85 = nodesById.nodes[item10];
          value85 &&
            isNodeType(value85, 'group') &&
            (Object.values(nodesById.nodes).forEach((item11) => {
              if (item11.parentId === item10) graphStore.updateNodeData(item11.id, { parentId: undefined });
            }),
            graphStore.deleteNodes([item10]));
        }),
        graphStore.clearSelection(),
        commit());
      break;
    case 'create_node':
      if (sourceNodeId.type) {
        const id7 = generateId(sourceNodeId.type);
        (graphStore.addNode({ id: id7, ...sourceNodeId }), graphStore.setSelectedNodes([id7]), commit());
      }
      break;
    case 'create_collage_from_selection': {
      const value86 = Array.isArray(sourceNodeId.ids) ? sourceNodeId.ids : nodesById.selectedNodeIds || [];
      _createCollageNodeFromSelection(value86);
      break;
    }
    case 'reset_source_media_size':
    case 'reset_source_image_size': {
      const list15 =
          Array.isArray(sourceNodeId.ids) && sourceNodeId.ids.length > 0
            ? sourceNodeId.ids
            : nodesById.selectedNodeIds || [],
        list16 = list15.filter((item12) => {
          const enabled10 = nodesById.nodes[item12];
          return !!enabled10 && isNodeType(enabled10, RESETTABLE_MEDIA_NODE_TYPES);
        });
      if (list16.length === 0) break;
      (graphStore.batch(() => {
        list16.forEach((item13) => {
          const value87 = nodesById.nodes[item13],
            width5 = _resolveSourceMediaResetSize(value87);
          graphStore.updateNodeData(item13, {
            width: width5.width,
            height: width5.height,
            needsAutoResize: false,
          });
        });
      }),
        commit());
      break;
    }
    case 'align_nodes': {
      if (nodesById.ui?.alignFeatureEnabled === false) break;
      const value88 = String(sourceNodeId.mode || '').trim(),
        list17 = Array.isArray(nodesById.selectedNodeIds) ? nodesById.selectedNodeIds : [];
      if (list17.length < 2) break;
      const list18 = getAlignableSelectionNodes(nodesById.nodes, list17);
      if (list18.length < 2) break;
      let distributeTargets = {};
      if (value88 === 'distribute-h') {
        const value89 = Number(nodesById.ui?.alignDistributeGap);
        distributeTargets = computeDistributeTargets(
          list18,
          'horizontal',
          Number.isFinite(value89) ? value89 : 40,
        );
      } else {
        if (value88 === 'distribute-v') {
          const value90 = Number(nodesById.ui?.alignDistributeGap);
          distributeTargets = computeDistributeTargets(
            list18,
            'vertical',
            Number.isFinite(value90) ? value90 : 40,
          );
        } else {
          if (
            value88 === 'left' ||
            value88 === 'h-center' ||
            value88 === 'right' ||
            value88 === 'top' ||
            value88 === 'v-center' ||
            value88 === 'bottom'
          ) {
            const selectionBounds = computeSelectionBounds(list18);
            distributeTargets = computeAlignTargets(list18, value88, selectionBounds);
          } else break;
        }
      }
      const nodeOffsetPlan = buildNodeOffsetPlan(nodesById.nodes, distributeTargets);
      if (Object.keys(nodeOffsetPlan).length === 0) break;
      (graphStore.batch(() => {
        graphStore.moveNodesByOffsets(nodeOffsetPlan);
      }),
        commit());
      break;
    }
    case 'select_all':
      graphStore.setSelectedNodes(Object.keys(nodesById.nodes));
      break;
    case 'copy': {
      const selectedIds =
        Array.isArray(sourceNodeId.ids) && sourceNodeId.ids.length > 0
          ? sourceNodeId.ids
          : Array.isArray(nodesById.selectedNodeIds)
            ? nodesById.selectedNodeIds
            : [];
      if (selectedIds.length > 0) {
        const edges3 = buildClipboardGraphSnapshot({
          nodesById: nodesById.nodes,
          edgesById: nodesById.edges,
          selectedIds: selectedIds,
          sanitizeNode(value91) {
            return (stripImageGenerationRuntimeState(value91), value91);
          },
        });
        edges3.nodes.length > 0 && setClipboard(edges3.nodes, { edges: edges3.edges });
      }
      break;
    }
    case 'export_image':
      console.log('执行导出节点图片', sourceNodeId.id);
      break;
    case 'paste': {
      const graph = getClipboardGraph(),
        nodes11 = graph?.nodes?.length ? graph.nodes : getClipboard();
      if (nodes11 && nodes11.length > 0) {
        const value92 = Date.now(),
          value93 = Math.random().toString(36).slice(2, 5),
          prepareClipboardGraphPaste2 = prepareClipboardGraphPaste({
            graph: graph || { schemaVersion: 1, nodes: nodes11, edges: [] },
            x: sourceNodeId.x,
            y: sourceNodeId.y,
            generateNodeId(value94, value95) {
              return (
                String(value94 || 'node').split('_copy_')[0] + '_copy_' + value92 + '_' + value93 + value95
              );
            },
            generateEdgeId() {
              return generateId('edge');
            },
            sanitizeNode(value96) {
              return (stripImageGenerationRuntimeState(value96), value96);
            },
          });
        prepareClipboardGraphPaste2.nodes.length > 0 &&
          (graphStore.batch(() => {
            (prepareClipboardGraphPaste2.nodes.forEach((item14) => {
              graphStore.addNode(item14);
            }),
              prepareClipboardGraphPaste2.edges.length > 0 &&
                graphStore.updateEdgesBatch([], prepareClipboardGraphPaste2.edges),
              graphStore.setSelectedNodes(prepareClipboardGraphPaste2.newIds));
          }),
          commit());
      }
      break;
    }
    case 'create_group':
      const list19 = sourceNodeId.ids || nodesById.selectedNodeIds;
      if (list19 && list19.length > 0) {
        let value97 = Infinity,
          value98 = Infinity,
          value99 = -Infinity,
          value100 = -Infinity;
        const list20 = list19.map((item15) => nodesById.nodes[item15]).filter(Boolean);
        if (list20.length === 0) break;
        list20.forEach((box20) => {
          ((value97 = Math.min(value97, box20.x)),
            (value98 = Math.min(value98, box20.y)),
            (value99 = Math.max(value99, box20.x + (box20.width || 0))),
            (value100 = Math.max(value100, box20.y + (box20.height || 0))));
        });
        const value101 = 30,
          x16 = value97 - value101,
          y11 = value98 - (value101 + 20),
          width6 = value99 - value97 + value101 * 2,
          height4 = value100 - value98 + value101 * 2 + 20,
          id8 = generateId('group');
        (graphStore.addNode({
          id: id8,
          type: 'group',
          x: x16,
          y: y11,
          width: width6,
          height: height4,
          label: 'New Group',
        }),
          graphStore.groupNodes(list19, id8),
          graphStore.setSelectedNodes([id8]),
          commit());
      }
      break;
    default:
      console.warn('Unknown command: ', value79);
      break;
  }
  uiStore.hideContextMenu();
}
export function isValidConnection(value102, value103) {
  return isValidConnection_2(value102, value103);
}
export function initConnectionHandles(value104) {
  return initConnectionHandles_2(value104);
}
export function initPickConnect(value105) {
  return initPickConnect_2(value105);
}
export function initCanvasContextMenu(el3) {
  if (!el3) return;
  el3.addEventListener(
    'contextmenu',
    (event5) => {
      if (!isEditableTextTargetInGroupedNode(event5.target, getStateRaw().nodes)) return;
      event5.__aiCanvasGroupedEditableContextMenu = true;
    },
    { capture: true },
  );
  function run4({
    key: key2,
    id: id9,
    x: x17,
    y: y12,
    width: width7,
    height: height5,
    name: name2,
    extra: extra = {},
  }) {
    if (key2 === 'panorama-scene')
      return createPanoramaSceneNodeData({
        id: id9,
        x: x17,
        y: y12,
        width: width7,
        height: height5,
        name: name2,
      });
    if (key2 === 'panorama-360')
      return createPanorama360NodeData({
        id: id9,
        x: x17,
        y: y12,
        width: width7,
        height: height5,
        name: name2,
      });
    if (key2 === 'storyboard-script')
      return createStoryboardScriptNodeData({
        id: id9,
        x: x17,
        y: y12,
        width: width7,
        height: height5,
        name: name2,
      });
    if (key2 === 'story-workspace')
      return createStoryWorkspaceNodeData({
        id: id9,
        x: x17,
        y: y12,
        width: width7,
        height: height5,
        name: name2 || t('nodeCreation.items.storyWorkspace.defaultName'),
      });
    if (key2 === 'comfyui-workflow')
      return createComfyWorkflowNodeData({
        id: id9,
        x: x17,
        y: y12,
        width: width7,
        height: height5,
        name: name2 || t('nodeCreation.items.comfyWorkflow.defaultName'),
      });
    if (key2 === 'whiteboard')
      return createWhiteboardNodeData({
        id: id9,
        x: x17,
        y: y12,
        width: width7,
        height: height5,
        name: name2 || t('nodeCreation.items.whiteboard.defaultName'),
      });
    if (key2 === 'collage')
      return createEmptyCollageNodeData({
        id: id9,
        x: x17,
        y: y12,
        width: width7,
        height: height5,
        name: name2 || t('canvasInteraction.grids.collageName'),
      });
    const box21 = {
      id: id9,
      type: key2,
      x: x17,
      y: y12,
      width: width7,
      height: height5,
      name: name2,
      ...extra,
    };
    (key2 === 'ai-image' || key2 === 'ai-video') &&
      !Object.prototype.hasOwnProperty.call(box21, 'aspectRatio') &&
      (box21.aspectRatio = '自适应');
    if (key2 === 'ai-image' || key2 === 'ai-video') {
      const box22 = getAIGenerationNodeSize(width7, height5);
      ((box21.width = box22.width), (box21.height = box22.height));
    }
    if (key2 === 'source-image' || key2 === 'source-video') return buildSourceMediaNodePayload(box21);
    return box21;
  }
  function run5(value106) {
    if (
      value106 === 'ai-text' ||
      value106 === 'ai-image' ||
      value106 === 'ai-video' ||
      value106 === 'ai-audio'
    )
      return getAIGenerationDefaultSizeByType(value106);
    if (value106 === 'panorama-scene' || value106 === 'panorama-360') return PANORAMA_SCENE_DEFAULT_SIZE;
    if (value106 === 'storyboard-script') return STORYBOARD_SCRIPT_DEFAULT_SIZE;
    if (value106 === 'debug') return { width: 0x104, height: 180 };
    return getNodeDefaultSize(value106);
  }
  function run6(key3, x18, y13) {
    const width8 = run5(key3.type),
      id10 = generateId(key3.type),
      extra2 = key3.type === 'source-image' || key3.type === 'source-video' ? { needsAutoResize: true } : {};
    (graphStore.addNode(
      run4({
        id: id10,
        key: key3.type,
        x: x18 - width8.width / 2,
        y: y13 - width8.height / 2,
        width: width8.width,
        height: width8.height,
        name: key3.defaultName || key3.label,
        extra: extra2,
      }),
    ),
      graphStore.setSelectedNodes([id10]),
      commit());
  }
  function run7(value107, value108, value109 = false) {
    (document.querySelector('#v2PickerOverlay')?.remove(), removeContextMenus());
    const { viewport: viewport6 } = getStateRaw();
    let x19, y14;
    if (value109) {
      const value110 = window.innerWidth / 2,
        value111 = window.innerHeight / 2,
        box23 = screenToWorld(value110, value111, viewport6);
      ((x19 = box23.x), (y14 = box23.y));
    } else {
      const box24 = screenToWorld(value107, value108, viewport6);
      ((x19 = box24.x), (y14 = box24.y));
    }
    const el4 = document.createElement('div');
    el4.id = 'v2PickerOverlay';
    const value112 = 0x110,
      value113 = Math.min(value107, window.innerWidth - value112 - 20),
      value114 = Math.max(12, Math.min(value108, window.innerHeight - 0x1f4)),
      el5 = document.createElement('div');
    ((el5.className = 'v2-node-picker'),
      (el5.style.left = value113 + 'px'),
      (el5.style.top = value114 + 'px'),
      (el5.style.width = value112 + 'px'));
    const run8 = (value115) => {
        const el6 = document.createElement('div');
        el6.className = 'v2-menu-section';
        const value116 = document.createElement('div');
        value116.className = 'v2-menu-rule';
        const el7 = document.createElement('span');
        return (
          (el7.className = 'v2-menu-title'),
          (el7.textContent = value115),
          el6.appendChild(el7),
          el6.appendChild(value116),
          el6
        );
      },
      handler4 = (value117, handler5) => {
        const el8 = document.createElement('button');
        el8.className = 'v2-menu-row' + (value117.desc ? ' has-desc' : '');
        const el9 = document.createElement('div');
        ((el9.className = 'v2-menu-ico'), el9.replaceChildren());
        if (value117.iconEl) el9.appendChild(value117.iconEl.cloneNode(true));
        el8.appendChild(el9);
        const el10 = document.createElement('div');
        el10.className = 'v2-menu-txt-wrap';
        const el11 = document.createElement('span');
        ((el11.className = 'v2-menu-lbl'), (el11.textContent = value117.label));
        if (value117.badge) {
          const el12 = document.createElement('span');
          ((el12.textContent = value117.badge), (el12.className = 'v2-badge-beta'), el11.appendChild(el12));
        }
        el10.appendChild(el11);
        if (value117.desc) {
          const el13 = document.createElement('span');
          ((el13.className = 'v2-menu-sub'), (el13.textContent = value117.desc), el10.appendChild(el13));
        }
        return (
          el8.appendChild(el10),
          el8.addEventListener('click', (event6) => {
            (event6.stopPropagation(), handler5(event6));
          }),
          el8
        );
      },
      value118 = 'var(--white-50)',
      value119 = 'http://www.w3.org/2000/svg',
      handler6 = (value120, value121) => {
        const el14 = document.createElementNS(value119, 'svg');
        return (
          el14.setAttribute('width', '18'),
          el14.setAttribute('height', '18'),
          el14.setAttribute('viewBox', '0 0 24 24'),
          el14.setAttribute('fill', 'none'),
          el14.setAttribute('stroke', value120),
          el14.setAttribute('stroke-width', String(value121)),
          el14
        );
      },
      handler7 = (value122) => {
        const el15 = handler6(value122, 1.8),
          el16 = document.createElementNS(value119, 'path');
        el16.setAttribute('d', 'M12 20h9');
        const el17 = document.createElementNS(value119, 'path');
        return (
          el17.setAttribute('d', 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'),
          el15.appendChild(el16),
          el15.appendChild(el17),
          el15
        );
      },
      handler8 = (value123) => {
        const el18 = handler6(value123, 1.8),
          el19 = document.createElementNS(value119, 'rect');
        (el19.setAttribute('x', '3'),
          el19.setAttribute('y', '3'),
          el19.setAttribute('width', '18'),
          el19.setAttribute('height', '18'),
          el19.setAttribute('rx', '3'));
        const el20 = document.createElementNS(value119, 'circle');
        (el20.setAttribute('cx', '8.5'),
          el20.setAttribute('cy', '8.5'),
          el20.setAttribute('r', '1.5'),
          el20.setAttribute('fill', value123));
        const el21 = document.createElementNS(value119, 'polyline');
        return (
          el21.setAttribute('points', '21 15 16 10 5 21'),
          el18.appendChild(el19),
          el18.appendChild(el20),
          el18.appendChild(el21),
          el18
        );
      },
      handler9 = (value124) => {
        const el22 = handler6(value124, 1.8),
          el23 = document.createElementNS(value119, 'rect');
        (el23.setAttribute('x', '2'),
          el23.setAttribute('y', '6'),
          el23.setAttribute('width', '15'),
          el23.setAttribute('height', '12'),
          el23.setAttribute('rx', '2'));
        const el24 = document.createElementNS(value119, 'path');
        return (
          el24.setAttribute('d', 'M17 9l5-3v12l-5-3V9z'),
          el22.appendChild(el23),
          el22.appendChild(el24),
          el22
        );
      },
      handler10 = (value125) => {
        const el25 = handler6(value125, 1.8),
          el26 = document.createElementNS(value119, 'path');
        el26.setAttribute('d', 'M9 18V5l12-2v13');
        const el27 = document.createElementNS(value119, 'circle');
        (el27.setAttribute('cx', '6'), el27.setAttribute('cy', '18'), el27.setAttribute('r', '3'));
        const el28 = document.createElementNS(value119, 'circle');
        return (
          el28.setAttribute('cx', '18'),
          el28.setAttribute('cy', '16'),
          el28.setAttribute('r', '3'),
          el25.appendChild(el26),
          el25.appendChild(el27),
          el25.appendChild(el28),
          el25
        );
      },
      handler11 = (value126) => {
        const el29 = handler6(value126, 1.8),
          el30 = document.createElementNS(value119, 'circle');
        (el30.setAttribute('cx', '12'), el30.setAttribute('cy', '12'), el30.setAttribute('r', '8.5'));
        const el31 = document.createElementNS(value119, 'path');
        el31.setAttribute('d', 'M3.5 12h17');
        const el32 = document.createElementNS(value119, 'path');
        el32.setAttribute('d', 'M12 3.5c2.4 2.6 3.5 5.4 3.5 8.5S14.4 17.9 12 20.5');
        const el33 = document.createElementNS(value119, 'path');
        el33.setAttribute('d', 'M12 3.5C9.6 6.1 8.5 8.9 8.5 12s1.1 5.9 3.5 8.5');
        const el34 = document.createElementNS(value119, 'path');
        el34.setAttribute('d', 'M6.1 6.1c3.4 1.8 8.4 1.8 11.8 0');
        const el35 = document.createElementNS(value119, 'path');
        return (
          el35.setAttribute('d', 'M6.1 17.9c3.4-1.8 8.4-1.8 11.8 0'),
          el29.appendChild(el30),
          el29.appendChild(el31),
          el29.appendChild(el32),
          el29.appendChild(el33),
          el29.appendChild(el34),
          el29.appendChild(el35),
          el29
        );
      },
      handler12 = (value127) => {
        const el36 = handler6(value127, 1.8),
          el37 = document.createElementNS(value119, 'rect');
        (el37.setAttribute('x', '3'),
          el37.setAttribute('y', '4'),
          el37.setAttribute('width', '18'),
          el37.setAttribute('height', '16'),
          el37.setAttribute('rx', '2'),
          el36.appendChild(el37),
          ['9', '14'].forEach((item16) => {
            const el38 = document.createElementNS(value119, 'line');
            (el38.setAttribute('x1', '3'),
              el38.setAttribute('y1', item16),
              el38.setAttribute('x2', '21'),
              el38.setAttribute('y2', item16),
              el36.appendChild(el38));
          }));
        const el39 = document.createElementNS(value119, 'line');
        return (
          el39.setAttribute('x1', '8'),
          el39.setAttribute('y1', '4'),
          el39.setAttribute('x2', '8'),
          el39.setAttribute('y2', '20'),
          el36.appendChild(el39),
          el36
        );
      },
      handler13 = () => {
        const el40 = handler6('var(--gold)', 1.8),
          el41 = document.createElementNS(value119, 'path');
        return (
          el41.setAttribute(
            'd',
            'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
          ),
          el40.appendChild(el41),
          el40
        );
      },
      iconEl = () => {
        const el42 = handler6('var(--white-50)', 1.8),
          el43 = document.createElementNS(value119, 'path');
        el43.setAttribute('d', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4');
        const el44 = document.createElementNS(value119, 'polyline');
        el44.setAttribute('points', '17 8 12 3 7 8');
        const el45 = document.createElementNS(value119, 'line');
        return (
          el45.setAttribute('x1', '12'),
          el45.setAttribute('y1', '3'),
          el45.setAttribute('x2', '12'),
          el45.setAttribute('y2', '15'),
          el42.appendChild(el43),
          el42.appendChild(el44),
          el42.appendChild(el45),
          el42
        );
      },
      handler14 = (value128) => {
        const el46 = handler6(value128, 1.8),
          el47 = document.createElementNS(value119, 'path');
        el47.setAttribute('d', 'M6 3v12a3 3 0 0 0 3 3h12');
        const el48 = document.createElementNS(value119, 'path');
        el48.setAttribute('d', 'M3 6h12a3 3 0 0 1 3 3v12');
        const el49 = document.createElementNS(value119, 'path');
        return (
          el49.setAttribute('d', 'M3 3l18 18'),
          el46.appendChild(el47),
          el46.appendChild(el48),
          el46.appendChild(el49),
          el46
        );
      },
      handler15 = (value129) => {
        const el50 = handler6(value129, 1.8),
          el51 = document.createElementNS(value119, 'rect');
        (el51.setAttribute('x', '3'),
          el51.setAttribute('y', '4'),
          el51.setAttribute('width', '18'),
          el51.setAttribute('height', '16'),
          el51.setAttribute('rx', '2'));
        const el52 = document.createElementNS(value119, 'path');
        el52.setAttribute('d', 'M3 10h18');
        const el53 = document.createElementNS(value119, 'path');
        return (
          el53.setAttribute('d', 'M12 10v10'),
          el50.appendChild(el51),
          el50.appendChild(el52),
          el50.appendChild(el53),
          el50
        );
      },
      handler16 = (value130) => {
        const el54 = handler6(value130, 1.8),
          el55 = document.createElementNS(value119, 'circle');
        (el55.setAttribute('cx', '12'), el55.setAttribute('cy', '12'), el55.setAttribute('r', '9'));
        const el56 = document.createElementNS(value119, 'path');
        el56.setAttribute('d', 'M3 12h18');
        const el57 = document.createElementNS(value119, 'path');
        el57.setAttribute('d', 'M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21');
        const el58 = document.createElementNS(value119, 'path');
        return (
          el58.setAttribute('d', 'M12 3C9.7 5.5 8.5 8.5 8.5 12S9.7 18.5 12 21'),
          el54.appendChild(el55),
          el54.appendChild(el56),
          el54.appendChild(el57),
          el54.appendChild(el58),
          el54
        );
      },
      iconEl2 = {
        'ai-text': () => handler7(value118),
        'ai-image': () => handler8(value118),
        'ai-video': () => handler9(value118),
        'ai-audio': () => handler10(value118),
        'panorama-scene': () => handler11(value118),
        'panorama-360': () => handler11(value118),
        'storyboard-script': () => handler12(value118),
        collage: () => handler15(value118),
        whiteboard: () => handler15(value118),
        'comfyui-workflow': () => handler15(value118),
        'story-workspace': () => handler12(value118),
        'web-preview': () => handler16(value118),
        'media-clip': () => handler14(value118),
        debug: () => handler13(),
      },
      list21 = getNodeCreationMenuSections(PICKER_NODE_CREATION_SECTION_IDS, {
        includeDevOnly: isDevModeOn(),
      });
    (list21.forEach((item17) => {
      (el5.appendChild(run8(item17.label)),
        item17.items.forEach((key4) => {
          const w6 = run5(key4.type);
          el5.appendChild(
            handler4(
              {
                key: key4.type,
                label: key4.label,
                w: w6.width,
                h: w6.height,
                badge: key4.badge,
                desc: key4.subtitle,
                iconEl: iconEl2[key4.type]?.(),
              },
              () => {
                (el4.remove(), run6(key4, x19, y14));
              },
            ),
          );
        }));
    }),
      el5.appendChild(run8(t('canvasInteraction.contextMenu.addResource'))),
      el5.appendChild(
        handler4(
          {
            label: NODE_CREATION_UPLOAD_ITEM.label,
            desc: NODE_CREATION_UPLOAD_ITEM.subtitle,
            iconBg: 'var(--white-05)',
            iconEl: iconEl(),
          },
          () => {
            el4.remove();
            const el59 = document.createElement('input');
            ((el59.type = 'file'),
              (el59.accept = 'image/*,video/*,audio/*'),
              (el59.style.position = 'fixed'),
              (el59.style.left = '-9999px'),
              (el59.style.top = '-9999px'),
              (el59.style.opacity = '0'));
            const run9 = () => {
              ((el59.onchange = null), el59.remove());
            };
            (el59.addEventListener('cancel', run9, { once: true }),
              (el59.onchange = (event7) => {
                const fileName = event7.target.files?.[0];
                run9();
                if (!fileName) return;
                const value131 = String(fileName.type || '').toLowerCase(),
                  enabled11 = value131.startsWith('image/'),
                  enabled12 = value131.startsWith('video/'),
                  enabled13 = value131.startsWith('audio/');
                if (!enabled11 && !enabled12 && !enabled13) {
                  window.showToast?.(t('canvasInteraction.toasts.unsupportedUpload'), 'warning');
                  return;
                }
                let type4 = 'source-image';
                if (enabled12) type4 = 'source-video';
                else enabled13 && (type4 = 'source-audio');
                const { width: width9, height: height6 } = getNodeDefaultSize(type4),
                  name3 = (() => {
                    const enabled14 = String(fileName.name || '').trim();
                    if (!enabled14) return '';
                    const list22 = enabled14.split(/[\\/]/).pop() || '',
                      count4 = list22.lastIndexOf('.');
                    if (count4 <= 0) return list22;
                    return list22.slice(0, count4);
                  })(),
                  id11 = generateId(type4),
                  value132 = {
                    id: id11,
                    type: type4,
                    x: x19 - width9 / 2,
                    y: y14 - height6 / 2,
                    width: width9,
                    height: height6,
                    fileName: fileName.name,
                    name:
                      name3 ||
                      (type4 === 'source-video'
                        ? t('canvasInteraction.uploadTypeNames.video')
                        : type4 === 'source-audio'
                          ? t('canvasInteraction.uploadTypeNames.audio')
                          : t('canvasInteraction.uploadTypeNames.image')),
                    needsAutoResize: type4 === 'source-image' || type4 === 'source-video',
                  };
                (graphStore.addNode(
                  type4 === 'source-image' || type4 === 'source-video'
                    ? buildSourceMediaNodePayload(value132)
                    : value132,
                ),
                  graphStore.setSelectedNodes([id11]),
                  commit(),
                  window.dispatchEvent(
                    new CustomEvent('v2:resource-upload', { detail: { id: id11, file: fileName } }),
                  ));
              }),
              document.body.appendChild(el59),
              el59.click());
          },
        ),
      ),
      el4.appendChild(el5),
      document.body.appendChild(el4));
    const box25 = el5.getBoundingClientRect(),
      value133 = Math.max(12, window.innerHeight - box25.height - 12),
      value134 = Number.parseFloat(el5.style.top) || value108;
    ((el5.style.top = Math.min(Math.max(12, value134), value133) + 'px'),
      el4.addEventListener('click', () => el4.remove()));
  }
  function run10(screenX2, screenY2) {
    const { viewport: viewport7 } = getStateRaw(),
      box26 = screenToWorld(screenX2, screenY2, viewport7),
      x20 = box26.x,
      y15 = box26.y,
      list23 = [],
      handler17 = (label4, kbd2, action2) => {
        list23.push({ label: label4, kbd: kbd2, action: action2 });
      },
      handler18 = () => {
        list23.push('sep');
      },
      handler19 = (label5, subItems2) => {
        list23.push({ label: label5, subItems: subItems2 });
      },
      action3 = (key5, width10, height7, name4) => () => {
        const id12 = generateId(key5);
        (graphStore.addNode(
          run4({
            id: id12,
            key: key5,
            x: x20 - width10 / 2,
            y: y15 - height7 / 2,
            width: width10,
            height: height7,
            name: name4,
            extra: { needsAutoResize: key5 === 'source-image' || key5 === 'source-video' },
          }),
        ),
          graphStore.setSelectedNodes([id12]),
          commit());
      },
      args7 = getNodeCreationMenuSections(CONTEXT_NODE_CREATION_SECTION_IDS, {
        includeDevOnly: isDevModeOn(),
      }).map((label6) => ({
        label: label6.label,
        subItems: label6.items.map((label7) => {
          const box27 = run5(label7.type);
          return {
            label: label7.label,
            desc: label7.subtitle,
            badge: label7.badge,
            action: action3(label7.type, box27.width, box27.height, label7.defaultName || label7.label),
          };
        }),
      }));
    (handler19(t('canvasInteraction.contextMenu.addNode'), [...args7]),
      handler18(),
      handler17(t('canvasInteraction.contextMenu.paste'), 'Ctrl V', () => {
        window.dispatchEvent(
          new CustomEvent('v2:canvas-paste-request', { detail: { screenX: screenX2, screenY: screenY2 } }),
        );
      }),
      handler17(t('canvasInteraction.contextMenu.undo'), 'Ctrl Z', () => undo()),
      handler17(t('canvasInteraction.contextMenu.redo'), 'Ctrl Y', () => redo()),
      showContextMenu(screenX2, screenY2, list23));
  }
  (el3.addEventListener('dblclick', (event8) => {
    if (event8.target.closest('.v2-node')) return;
    (event8.preventDefault(), event8.stopPropagation(), run7(event8.clientX, event8.clientY));
  }),
    el3.addEventListener('contextmenu', (screenX3) => {
      screenX3.preventDefault();
      const anchorNodeId = screenX3.target.closest('.v2-node'),
        pasteTarget = getEditableTextTarget(screenX3.target),
        enabled15 = window.getSelection();
      if (!anchorNodeId && enabled15 && !enabled15.isCollapsed)
        try {
          enabled15.removeAllRanges();
        } catch {}
      const value135 = enabled15 ? enabled15.toString().trim() : '';
      let value136 = false;
      if (enabled15 && value135 && enabled15.rangeCount > 0 && !enabled15.isCollapsed) {
        const value137 = screenX3.target;
        for (let value138 = 0; value138 < enabled15.rangeCount; value138++) {
          const value139 = enabled15.getRangeAt(value138);
          try {
            if (value139.intersectsNode(value137)) {
              value136 = true;
              break;
            }
          } catch {}
        }
      }
      if (value135 && value136) {
        handleTextContextMenu(screenX3.clientX, screenX3.clientY, value135, {
          anchorNodeId: anchorNodeId?.dataset?.nodeId || anchorNodeId?.id || null,
          pasteTarget: pasteTarget,
          pasteSelection: pasteTarget ? captureEditableSelection(pasteTarget) : null,
        });
        return;
      }
      if (pasteTarget) {
        showTextInputContextMenu({
          target: pasteTarget,
          screenX: screenX3.clientX,
          screenY: screenX3.clientY,
          snapshot: captureEditableSelection(pasteTarget),
        });
        return;
      }
      if (anchorNodeId) {
        handleContextMenu(screenX3.clientX, screenX3.clientY);
        return;
      }
      const { selectedNodeIds: selectedNodeIds } = getStateRaw();
      if (selectedNodeIds && selectedNodeIds.length > 0) {
        showNodesContextMenu(screenX3.clientX, screenX3.clientY, {
          primaryNodeId: selectedNodeIds[selectedNodeIds.length - 1],
          targetNodeIds: selectedNodeIds,
        });
        return;
      }
      run10(screenX3.clientX, screenX3.clientY);
    }),
    (initCanvasContextMenu._showPicker = run7));
}
export function handleTextContextMenu(value140, value141, text2, value142 = {}) {
  const list24 = [],
    handler20 = (label8, kbd3, action4) => {
      list24.push({ label: label8, kbd: kbd3, action: action4 });
    },
    handler21 = () => {
      list24.push('sep');
    },
    stateRaw8 = getStateRaw(),
    { viewport: viewport8, nodes: nodes12 } = stateRaw8,
    { x: x21, y: y16 } = screenToWorld(value140, value141, viewport8),
    value143 = String(value142.anchorNodeId || '').trim();
  let value144 =
      value143 && nodes12?.[value143] ? value143 : hitTestNode(value140, value141, nodes12, viewport8),
    box28 = value144 ? nodes12[value144] : null;
  box28 &&
    (graphStore.setSelectedNodes([value144]),
    handler20(t('canvasInteraction.contextMenu.copyNode'), 'Ctrl C', () => {
      (executeCommand('copy'), window.showToast?.(t('canvasInteraction.toasts.nodeCopied'), 'success'));
    }),
    handler20(t('canvasInteraction.contextMenu.cutNode'), 'Ctrl X', () => {
      (executeCommand('copy', { ids: [value144] }),
        executeCommand('delete_nodes', { ids: [value144] }),
        window.showToast?.(t('canvasInteraction.toasts.nodeCut'), 'success'));
    }),
    handler20(t('canvasInteraction.contextMenu.duplicate'), '', () => {
      const list25 = getStateRaw().selectedNodeIds,
        list26 = list25.includes(value144) ? [...list25] : [value144],
        value145 = list26.length === 1 ? box28.height || 0x118 : 0x12c,
        box29 = calcSafeSpawnPosNearNode(nodes12, box28, 0x118, value145),
        value146 = box29.x - box28.x,
        value147 = box29.y - box28.y,
        cloneNodesWithEdges3 = cloneNodesWithEdges(list26, value146, value147);
      (graphStore.setSelectedNodes(Object.values(cloneNodesWithEdges3)),
        window.showToast?.(t('canvasInteraction.toasts.duplicateWithEdgesCreated'), 'success'));
    }));
  handler20(t('canvasInteraction.contextMenu.copyText'), 'Ctrl C', () => {
    navigator.clipboard
      .writeText(text2)
      .then(() => {
        (markSystemClipboardWrite({ text: text2 }),
          window.showToast?.(t('canvasInteraction.toasts.selectedTextCopied'), 'success'));
      })
      .catch(() => {
        window.showToast?.(t('canvasInteraction.toasts.copyFailed'), 'error');
      });
  });
  value142.pasteTarget &&
    handler20(t('canvasInteraction.contextMenu.pasteText'), 'Ctrl V', () => {
      pasteTextIntoEditableFromClipboard(value142.pasteTarget, value142.pasteSelection || null);
    });
  box28 &&
    handler20(t('canvasInteraction.contextMenu.deleteNode'), 'Del', () => {
      (graphStore.deleteNodes([value144]), graphStore.clearSelection(), commit());
    });
  handler21();
  const run11 = (type5, width11, height8, name5) => () => {
    const width12 =
        type5 === 'ai-image' || type5 === 'ai-video'
          ? getAIGenerationNodeSize(width11, height8)
          : { width: width11, height: height8 },
      id13 = generateId(type5);
    let x22 = x21 - width12.width / 2,
      y17 = y16 - width12.height / 2;
    if (box28) {
      const box30 = calcSafeSpawnPosNearNode(nodes12, box28, width12.width, width12.height);
      ((x22 = box30.x), (y17 = box30.y));
    }
    (graphStore.addNode({
      id: id13,
      type: type5,
      x: x22,
      y: y17,
      width: width12.width,
      height: width12.height,
      name: name5,
      prompt: text2,
      needsAutoResize: type5 === 'ai-image' || type5 === 'ai-video',
      ...(type5 === 'ai-image' || type5 === 'ai-video' ? { aspectRatio: '自适应' } : {}),
    }),
      graphStore.setSelectedNodes([id13]),
      commit());
  };
  {
    const box31 = getAIGenerationDefaultSizeByType('ai-text');
    handler20(
      _getAiGenerationActionLabel('ai-text'),
      '',
      run11('ai-text', box31.width, box31.height, _getAiGenerationNodeName('ai-text')),
    );
  }
  {
    const box32 = getAIGenerationDefaultSizeByType('ai-image');
    handler20(
      _getAiGenerationActionLabel('ai-image'),
      '',
      run11('ai-image', box32.width, box32.height, _getAiGenerationNodeName('ai-image')),
    );
  }
  {
    const box33 = getAIGenerationDefaultSizeByType('ai-video');
    handler20(
      _getAiGenerationActionLabel('ai-video'),
      '',
      run11('ai-video', box33.width, box33.height, _getAiGenerationNodeName('ai-video')),
    );
  }
  {
    const box34 = getAIGenerationDefaultSizeByType('ai-audio');
    handler20(
      _getAiGenerationActionLabel('ai-audio'),
      '',
      run11('ai-audio', box34.width, box34.height, _getAiGenerationNodeName('ai-audio')),
    );
  }
  showContextMenu(value140, value141, list24);
}
