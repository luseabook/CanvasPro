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
  getViewportScreenCenter,
  getViewportScreenBounds,
} from './math.js';
import { commit } from '../modules/history.js';
import { setClipboard, getClipboard, getClipboardGraph } from '../modules/clipboard.js';
import {
  captureEditableSelection,
  getEditableTextTarget,
  isEditableTextTargetInGroupedNode,
  showTextInputContextMenu,
  TEXT_CONTEXT_MENU_TARGET_SELECTOR,
} from '../modules/textInputContextMenu.js';
import { rafSampleLatest } from '../utils/dom.js';
import { createDragController } from '../modules/interaction/DragController.js';
import { createEdgeCuttingController } from '../modules/interaction/edgeCuttingController.js';
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
import { resolveAutoPanVelocity } from '../modules/interaction/viewportAutoPan.js';
import { createViewportPreviewCoordinator } from '../modules/interaction/viewportPreviewCoordinator.js';
import { createInteractionCommandAdapter } from '../modules/interaction/interactionCommandAdapter.js';
import { createCanvasContextMenuController } from '../modules/interaction/canvasContextMenuController.js';
import { removeContextMenus } from '../modules/interaction/contextMenuPresenter.js';
import {
  NODE_CREATION_UPLOAD_ITEM,
  PICKER_NODE_CREATION_SECTION_IDS,
  getNodeCreationMenuSections,
} from '../modules/nodeCreationMenuCatalog.js';
import { createNodeCreationMenuIcon } from '../modules/nodeCreationMenuIcons.js';
import {
  beginViewportPanPreview,
  cancelViewportPanPreview,
  flushViewportPanPreview,
  getViewportPanPreview,
  isViewportPanPreviewActive,
  updateViewportPanPreview,
} from './viewportPanPreview.js';
import { syncRendererViewportMediaPreloadPause } from './rendererViewportMediaPreloadPause.js';
import { PANORAMA_SCENE_DEFAULT_SIZE } from '../modules/panoramaSceneNode/sceneNode.js';
import { STORYBOARD_SCRIPT_DEFAULT_SIZE } from './storyboardScriptFactory.js';
import {
  getAIGenerationDefaultSizeByType,
  getAIGenerationNodeSize,
  getNodeDefaultSize,
  handleFileDrop,
} from '../services/fileService.js';
import { buildAppCanvasNodeData } from '../modules/app/canvasNodeDataFactory.js';
import { openAppCanvasFilePicker } from '../modules/app/appCanvasDropImport.js';
import { t } from '../i18n/index.js';
const graphStore = appStore?.['graphStore'] || graphStore_2 || appStore,
  uiStore = appStore?.['uiStore'] || uiStore_2 || appStore,
  workspaceStore = appStore?.['workspaceStore'] || workspaceStore_2 || appStore,
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
    focusNodes: (value) => window['v2FocusOnNodes']?.(value),
    translate: t,
    showToast: (...args) => window['showToast']?.(...args),
    scheduleFrame: (item) => requestAnimationFrame(item),
    windowObject: typeof window !== 'undefined' ? window : null,
  }),
  canvasContextMenuController = createCanvasContextMenuController({
    store: appStore,
    graphStore: graphStore,
    commandAdapter: interactionCommandAdapter,
    getShortcuts: getShortcuts,
    onUploadFile: ({ screenX: screenX, screenY: screenY }) => {
      openCanvasUploadAt(screenX, screenY);
    },
    windowObject: typeof window !== 'undefined' ? window : null,
    documentObject: typeof document !== 'undefined' ? document : null,
  }),
  EDGE_INTERACTION_LITE_CLASS = 'is-edge-interaction-lite',
  EDGE_INTERACTION_LITE_MIN_ZOOM = 0.24,
  EDGE_INTERACTION_LITE_MAX_ZOOM = 0.48,
  EDGE_INTERACTION_LITE_MIN_EDGES = 3,
  PAN_ACTIVATION_DISTANCE_PX = 3;
function isDevModeOn() {
  return window['DEV_MODE'] === true || document['body']?.['classList']?.['contains']('dev-mode');
}
function openCanvasUploadAt(clientX, clientY) {
  return openAppCanvasFilePicker({
    documentObject: document,
    projectId: window['currentProjectId'] || 'default_v2_project',
    handleFileDrop: handleFileDrop,
    commit: commit,
    clientX: clientX,
    clientY: clientY,
    onUnsupported: () => {
      window['showToast']?.(t('canvasInteraction.toasts.unsupportedUpload'), 'warning');
    },
    onError: (key) => {
      (console['error']('[Canvas] resource import failed:', key),
        window['showToast']?.(t('previewUpload.uploadFailed'), 'warning'));
    },
  });
}
function _shouldUseEdgeInteractionLite(index) {
  const result = Number(index?.['viewport']?.['zoom']) || 1,
    data = Object['keys'](index?.['edges'] || {})['length'],
    options = typeof window !== 'undefined' ? window['_edgeDomCache'] : null;
  return (
    result >= EDGE_INTERACTION_LITE_MIN_ZOOM &&
    result <= EDGE_INTERACTION_LITE_MAX_ZOOM &&
    data >= EDGE_INTERACTION_LITE_MIN_EDGES &&
    options &&
    options['size'] > 0
  );
}
function _setEdgeInteractionLite(enabled) {
  if (typeof document === 'undefined' || !document?.['body']?.['classList']) return;
  document['body']['classList']['toggle'](EDGE_INTERACTION_LITE_CLASS, !!enabled);
}
function getStateRaw() {
  return { ...graphStore['getStateRaw'](), ...uiStore['getStateRaw'](), ...workspaceStore['getStateRaw']() };
}
function getState() {
  return { ...graphStore['getState'](), ...uiStore['getState'](), ...workspaceStore['getState']() };
}
function nowMs() {
  return typeof performance !== 'undefined' && performance && typeof performance['now'] === 'function'
    ? performance['now']()
    : Date['now']();
}
function getMountedNodeCountForPerf() {
  const target =
    typeof window !== 'undefined' && typeof window['v2Renderer']?.['getMountedNodeCount'] === 'function'
      ? window['v2Renderer']['getMountedNodeCount']()
      : 0;
  return Number['isFinite'](target) ? target : 0;
}
function markViewportInteractionBusyForRenderer() {
  try {
    window['v2Renderer']?.['markViewportInteractionBusy']?.();
  } catch {}
}
function releaseViewportInteractionBusyForRenderer() {
  try {
    window['v2Renderer']?.['releaseViewportInteractionBusy']?.();
  } catch {}
}
const VIEWPORT_MEDIA_PRELOAD_HOLD_MS = 900,
  VIEWPORT_MEDIA_PRELOAD_RESUME_AFTER_PAN_MS = 220;
let viewportMediaPreloadPauseHeld = false;
function holdViewportMediaPreloadsForPan() {
  ((viewportMediaPreloadPauseHeld = true),
    syncRendererViewportMediaPreloadPause(true, { autoResumeMs: VIEWPORT_MEDIA_PRELOAD_HOLD_MS }));
}
function releaseViewportMediaPreloadsAfterPan() {
  if (!viewportMediaPreloadPauseHeld) return;
  ((viewportMediaPreloadPauseHeld = false),
    syncRendererViewportMediaPreloadPause(true, {
      autoResumeMs: VIEWPORT_MEDIA_PRELOAD_RESUME_AFTER_PAN_MS,
    }));
}
const edgeCuttingController = createEdgeCuttingController({
  graphStore: graphStore,
  getStateRaw: getStateRaw,
  commit: commit,
  checkBBoxIntersection: checkBBoxIntersection,
  checkLineIntersection: checkLineIntersection,
  getCutEdgeKeys: () => getShortcuts?.()?.['cut-edge']?.['keys'],
});
edgeCuttingController['install'](typeof window !== 'undefined' ? window : null);
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
    panActivated: false,
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
function _clearStoryboardHighlight(enabled2) {
  if (!enabled2) return;
  window['v2Renderer']?.['highlightDropSlot']?.(enabled2, { kind: 'storyboard', index: -1 });
}
function _resetDragContext() {
  dragContext?.['isDragging'] && endDragFpsSession('node-drag');
  dragContext?.['isPanning'] && dragContext?.['panActivated'] && endPanFpsSession('canvas-pan');
  const source = dragContext?.['lastHoverNodeId'] || null;
  if (source) _clearStoryboardHighlight(source);
  ((dragContext = _createIdleDragContext()),
    document['body']['classList']['remove'](
      'is-panning',
      'is-dragging',
      'is-edge-interaction-lite',
      'is-dragging-heavy-edges',
    ),
    document['querySelectorAll']('.is-ui-hidden')['forEach']((el) =>
      el['classList']['remove']('is-ui-hidden'),
    ),
    document['querySelectorAll']('.v2-node.is-dragging')['forEach']((el2) =>
      el2['classList']['remove']('is-dragging'),
    ),
    stopAutoPan(),
    _sampledPointerMove?.['cancel']?.(),
    cancelPendingViewportUpdate(),
    cancelViewportPanPreview(),
    releaseViewportMediaPreloadsAfterPan());
}
function _resetCellDragContext() {
  const next = dragContext?.['lastHoverNodeId'] || null;
  if (next) _clearStoryboardHighlight(next);
  (dragContext?.['sourceCellEl'] && dragContext['sourceCellEl']['classList']['remove']('is-drag-source'),
    dragContext?.['ghostEl']?.['remove']?.(),
    (dragContext = _createIdleDragContext()),
    document['body']['classList']['remove'](
      'is-panning',
      'is-dragging',
      'is-edge-interaction-lite',
      'is-dragging-heavy-edges',
    ),
    stopAutoPan(),
    _sampledPointerMove?.['cancel']?.(),
    cancelPendingViewportUpdate(),
    cancelViewportPanPreview(),
    releaseViewportMediaPreloadsAfterPan());
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
    updatePreview(box) {
      updateViewportPanPreview(box['x'], box['y'], box['zoom']);
    },
    flushPreview: flushViewportPanPreview,
    getPreview: getViewportPanPreview,
    isPreviewActive: isViewportPanPreviewActive,
  }),
  zoomController = createZoomController({ store: appStore, viewportPreview: wheelViewportPreview }),
  wheelPanController = createWheelPanController({ store: appStore, viewportPreview: wheelViewportPreview });
setDragContextGetter(() => dragContext);
let viewportRafId = null,
  pendingViewportUpdate = null,
  assistPanMirrorTimer = 0,
  pendingAssistPanMirrorViewport = null;
function syncSidePlusToLastPointer(options2 = {}) {
  const run =
    typeof window !== 'undefined' && typeof window['_v2UpdateSidePlusNow'] === 'function'
      ? window['_v2UpdateSidePlusNow']
      : typeof window !== 'undefined'
        ? window['_v2UpdateSidePlus']
        : null;
  typeof run === 'function' && run(lastMouseScreenX, lastMouseScreenY, options2);
}
let sidePlusPostPanSyncToken = 0;
function scheduleSidePlusSyncAfterPanPaint() {
  const current = ++sidePlusPostPanSyncToken;
  requestAnimationFrame(() => {
    setTimeout(() => {
      if (current !== sidePlusPostPanSyncToken) return;
      if (
        dragContext['isDragging'] ||
        dragContext['isPanning'] ||
        dragContext['isConnecting'] ||
        dragContext['isBoxSelecting'] ||
        dragContext['isDraggingCell']
      )
        return;
      syncSidePlusToLastPointer();
    }, 0);
  });
}
function updateViewportBatched(x, y, zoom) {
  ((pendingViewportUpdate = { x: x, y: y, zoom: zoom }),
    !viewportRafId && (viewportRafId = requestAnimationFrame(flushViewportUpdate)));
}
function flushViewportUpdate() {
  viewportRafId = null;
  if (pendingViewportUpdate) {
    const { x: x2, y: y2, zoom: zoom2 } = pendingViewportUpdate;
    ((pendingViewportUpdate = null),
      graphStore['updateViewport'](x2, y2, zoom2),
      syncSidePlusToLastPointer());
  }
}
function cancelPendingViewportUpdate() {
  (viewportRafId && (cancelAnimationFrame(viewportRafId), (viewportRafId = null)),
    (pendingViewportUpdate = null));
}
function flushAssistPanStoreMirror() {
  assistPanMirrorTimer = 0;
  const box2 = pendingAssistPanMirrorViewport;
  pendingAssistPanMirrorViewport = null;
  if (!box2 || !dragContext?.['assistPanActive']) return;
  (graphStore['updateViewport'](box2['x'], box2['y'], box2['zoom']),
    syncSidePlusToLastPointer());
}
function scheduleAssistPanStoreMirror(args2) {
  pendingAssistPanMirrorViewport = args2 ? { ...args2 } : null;
  if (assistPanMirrorTimer) return;
  assistPanMirrorTimer = window['setTimeout'](flushAssistPanStoreMirror, 32);
}
function cancelAssistPanStoreMirror() {
  (assistPanMirrorTimer && (window['clearTimeout'](assistPanMirrorTimer), (assistPanMirrorTimer = 0)),
    (pendingAssistPanMirrorViewport = null));
}
function _commitAssistPanPreview() {
  if (!dragContext?.['assistPanActive']) return null;
  releaseViewportMediaPreloadsAfterPan();
  const box3 = flushViewportPanPreview();
  (cancelAssistPanStoreMirror(),
    (dragContext['assistPanActive'] = false),
    (dragContext['assistPanViewport'] = null),
    cancelPendingViewportUpdate(),
    window['_v2FlushMinimapViewportPreview']?.(box3));
  if (!box3) return (syncSidePlusToLastPointer(), null);
  const run2 = () => {
    (graphStore['updateViewport'](box3['x'], box3['y'], box3['zoom']),
      graphStore['markViewportPersist']?.());
  };
  return (
    typeof graphStore['batch'] === 'function' ? graphStore['batch'](run2) : run2(),
    syncSidePlusToLastPointer(),
    box3
  );
}
let autoPanReqId = null,
  autoPanState = { dx: 0, dy: 0 },
  lastMouseScreenX = 0,
  lastMouseScreenY = 0,
  _autoPanPendingDx = null,
  _autoPanPendingDy = null;
export function stopAutoPan() {
  autoPanReqId && (cancelAnimationFrame(autoPanReqId), (autoPanReqId = null));
}
function autoPanLoop() {
  if (!autoPanReqId) return;
  const { viewport: viewport } = getStateRaw(),
    { dx: dx, dy: dy } = resolveAutoPanVelocity(
      { dx: _autoPanPendingDx, dy: _autoPanPendingDy },
      autoPanState,
    );
  (dx !== autoPanState['dx'] || dy !== autoPanState['dy']) &&
    ((autoPanState['dx'] = dx), (autoPanState['dy'] = dy));
  ((_autoPanPendingDx = null), (_autoPanPendingDy = null));
  const x3 = viewport['x'] - autoPanState['dx'],
    y3 = viewport['y'] - autoPanState['dy'];
  updateViewportBatched(x3, y3, viewport['zoom']);
  if (dragContext['isDragging']) {
    const stateRaw = getStateRaw(),
      { nodes: nodes } = stateRaw,
      { x: x4, y: y4 } = screenToWorld(lastMouseScreenX, lastMouseScreenY, {
        ...viewport,
        x: x3,
        y: y3,
      });
    dragController['updateDraggingNodes'](
      dragContext,
      lastMouseScreenX,
      lastMouseScreenY,
      x4,
      y4,
      x4,
      y4,
      stateRaw,
    );
  }
  autoPanReqId = requestAnimationFrame(autoPanLoop);
}
function checkAutoPan(entry, record) {
  ((lastMouseScreenX = entry), (lastMouseScreenY = record));
  if (!dragContext['isDragging'] && !dragContext['isBoxSelecting'] && !dragContext['isConnecting']) {
    stopAutoPan();
    return;
  }
  const payload = 60,
    handle = 15;
  let count = 0,
    count2 = 0;
  const stateRaw2 = getStateRaw()['viewport'] || {},
    box4 = getViewportScreenBounds(stateRaw2, window['innerWidth'], window['innerHeight']);
  if (entry < box4['left'] + payload) count = -handle;
  else {
    if (entry > box4['right'] - payload) count = handle;
  }
  if (record < box4['top'] + payload) count2 = -handle;
  else {
    if (record > box4['bottom'] - payload) count2 = handle;
  }
  count !== 0 || count2 !== 0
    ? ((_autoPanPendingDx = count),
      (_autoPanPendingDy = count2),
      !autoPanReqId && (autoPanReqId = requestAnimationFrame(autoPanLoop)))
    : stopAutoPan();
}
export function handlePointerDown(state, config, enabled3 = false, scope = false, event = null) {
  (zoomController['settleWheelZoom'](), (lastMouseScreenX = state), (lastMouseScreenY = config));
  const stateRaw3 = getStateRaw(),
    { viewport: viewport2 } = stateRaw3,
    { x: x5, y: y5 } = screenToWorld(state, config, viewport2),
    input = stateRaw3['pickConnectMode'];
  if (input && input['active']) {
    if (event?.['button'] === 2) {
      (event['stopPropagation']?.(), event['stopImmediatePropagation']?.());
      return;
    }
    const output = event && event['target'] && event['target']['closest']('.v2-node');
    if (output) return;
  }
  if (!enabled3 && dragController['tryStartTitleDrag'](dragContext, event, x5, y5)) {
    beginDragFpsSession('node-drag');
    return;
  }
  if (
    !enabled3 &&
    edgeController['tryStartHandleConnect'](dragContext, event, x5, y5, viewport2)
  )
    return;
  if (enabled3) {
    ((dragContext['isPanning'] = true),
      (dragContext['panActivated'] = false),
      (dragContext['panStartX'] = state),
      (dragContext['panStartY'] = config),
      (dragContext['panStartViewportX'] = viewport2['x']),
      (dragContext['panStartViewportY'] = viewport2['y']),
      (dragContext['panStartZoom'] = viewport2['zoom']),
      (dragContext['panStartPerf'] = 0),
      (dragContext['panMoveCount'] = 0),
      (dragContext['panMinimapPreviewCount'] = 0));
    return;
  }
  if (
    dragController['tryStartNodeDrag'](
      dragContext,
      state,
      config,
      x5,
      y5,
      scope,
      event,
    )
  ) {
    dragContext['isDragging'] && beginDragFpsSession('node-drag');
    return;
  }
  if (!enabled3 && !event?.['ctrlKey']) {
    selectionController['startBoxSelecting'](dragContext, state, config);
    return;
  }
}
function _activateCanvasPanIfNeeded(value2, value3) {
  if (!dragContext['isPanning']) return false;
  if (dragContext['panActivated']) return true;
  const value4 = value2 - dragContext['panStartX'],
    value5 = value3 - dragContext['panStartY'];
  if (Math['hypot'](value4, value5) < PAN_ACTIVATION_DISTANCE_PX) return false;
  const value6 = {
    x: dragContext['panStartViewportX'],
    y: dragContext['panStartViewportY'],
    zoom: dragContext['panStartZoom'],
  };
  return (
    (dragContext['panActivated'] = true),
    (dragContext['panStartPerf'] = nowMs()),
    (dragContext['panMinimapPreviewCount'] = Number(window['_v2GetMinimapPreviewFlushCount']?.()) || 0),
    markViewportInteractionBusyForRenderer(),
    holdViewportMediaPreloadsForPan(),
    beginPanFpsSession('canvas-pan'),
    beginViewportPanPreview(value6),
    window['_v2ScheduleMinimapViewportPreview']?.(value6, { force: true }),
    document['body']['classList']['add']('is-panning'),
    _setEdgeInteractionLite(_shouldUseEdgeInteractionLite(getStateRaw())),
    true
  );
}
function _handlePointerMoveImpl(value7, value8, enabled4 = false, e = null) {
  const value9 = lastMouseScreenX,
    value10 = lastMouseScreenY;
  ((lastMouseScreenX = value7), (lastMouseScreenY = value8));
  if (dragContext['isPanning']) {
    if (!_activateCanvasPanIfNeeded(value7, value8)) return;
    const value11 = value7 - dragContext['panStartX'],
      value12 = value8 - dragContext['panStartY'],
      box5 = {
        x: dragContext['panStartViewportX'] + value11,
        y: dragContext['panStartViewportY'] + value12,
        zoom: dragContext['panStartZoom'],
      };
    ((dragContext['panMoveCount'] = (dragContext['panMoveCount'] || 0) + 1),
      updateViewportPanPreview(box5['x'], box5['y'], box5['zoom']),
      window['_v2ScheduleMinimapViewportPreview']?.(box5));
    return;
  }
  dragContext['assistPanActive'] && !enabled4 && _commitAssistPanPreview();
  let args3 = getStateRaw(),
    { viewport: viewport3, nodes: nodes2 } = args3;
  if ((dragContext['isDragging'] || dragContext['isConnecting']) && enabled4) {
    stopAutoPan();
    if (!dragContext['assistPanActive']) {
      (flushViewportUpdate(),
        (args3 = getStateRaw()),
        ({ viewport: viewport3, nodes: nodes2 } = args3));
      const value13 = { ...viewport3 };
      ((dragContext['assistPanActive'] = true),
        (dragContext['assistPanViewport'] = value13),
        holdViewportMediaPreloadsForPan(),
        beginViewportPanPreview(value13),
        window['_v2ScheduleMinimapViewportPreview']?.(value13, { force: true }));
    }
    const value14 = value7 - value9,
      value15 = value8 - value10,
      x6 = dragContext['assistPanViewport'] || viewport3,
      viewport4 = {
        ...x6,
        x: x6['x'] + value14,
        y: x6['y'] + value15,
        zoom: x6['zoom'],
      };
    ((dragContext['assistPanViewport'] = viewport4),
      updateViewportPanPreview(viewport4['x'], viewport4['y'], viewport4['zoom']),
      scheduleAssistPanStoreMirror(viewport4),
      window['_v2ScheduleMinimapViewportPreview']?.(viewport4));
    const { x: x7, y: y6 } = screenToWorld(value7, value8, viewport4);
    if (dragContext['isConnecting']) {
      edgeController['updateHandleConnect'](
        dragContext,
        value7,
        value8,
        x7,
        y6,
        viewport4,
        nodes2,
        args3['connOverlay'],
      );
      return;
    }
    const value16 = { ...args3, viewport: viewport4 };
    dragController['updateDraggingNodes'](
      dragContext,
      value7,
      value8,
      x7,
      y6,
      x7,
      y6,
      value16,
    );
    return;
  }
  let { x: x8, y: y7 } = screenToWorld(value7, value8, viewport3);
  const value17 = x8,
    value18 = y7;
  if (edgeCuttingController['handlePointerMove']({ e: e, worldX: x8, worldY: y7 }))
    return;
  if (dragContext['isConnecting']) {
    edgeController['updateHandleConnect'](
      dragContext,
      value7,
      value8,
      x8,
      y7,
      viewport3,
      nodes2,
      args3['connOverlay'],
    );
    return;
  }
  if (dragContext['isBoxSelecting']) {
    selectionController['updateBoxSelecting'](dragContext, value7, value8);
    return;
  }
  if (dragContext['isDraggingCell']) {
    dragController['updateDraggingCell'](dragContext, value7, value8, x8, y7, nodes2);
    return;
  }
  if (!dragContext['isDragging']) return;
  (dragController['updateDraggingNodes'](
    dragContext,
    value7,
    value8,
    x8,
    y7,
    value17,
    value18,
    args3,
  ),
    checkAutoPan(value7, value8));
}
const _sampledPointerMove = rafSampleLatest(_handlePointerMoveImpl);
export function handlePointerMove(value19, value20, value21 = null) {
  const enabled5 = value21?.['__aiCanvasLeftDragHeld'] === true;
  if (value21 && value21['buttons'] === 0 && !enabled5) {
    if (
      dragContext['isDragging'] ||
      dragContext['isPanning'] ||
      dragContext['isConnecting'] ||
      dragContext['isBoxSelecting'] ||
      dragContext['isDraggingCell']
    ) {
      handlePointerUp(value19, value20);
      return;
    }
  }
  if (enabled5 && dragContext['assistPanActive']) {
    (_sampledPointerMove['cancel']?.(), _handlePointerMoveImpl(value19, value20, false, value21));
    return;
  }
  const value22 = !!(value21 && (value21['buttons'] & 4) !== 0),
    value23 =
      (dragContext['isDragging'] || dragContext['isConnecting']) &&
      (value22 || window['_spaceHeld'] === true);
  _sampledPointerMove(value19, value20, value23, value21);
}
export function handlePointerUp(value24 = 0, value25 = 0, value26 = false) {
  if (
    !dragContext['isDragging'] &&
    !dragContext['isPanning'] &&
    !dragContext['isConnecting'] &&
    !dragContext['isBoxSelecting'] &&
    !dragContext['isDraggingCell']
  ) {
    edgeCuttingController['hasActiveSession']() && edgeCuttingController['finishSession']();
    return;
  }
  let value27 = false;
  const value28 = !!dragContext['isPanning'],
    value29 = !!dragContext['isDragging'],
    value30 = value28 && dragContext['panActivated'] === true,
    value31 = dragContext['panStartPerf'] || nowMs(),
    moveCount = dragContext['panMoveCount'] || 0,
    value32 = dragContext['panMinimapPreviewCount'] || 0;
  stopAutoPan();
  if (value30) {
    markViewportInteractionBusyForRenderer();
    const box6 = flushViewportPanPreview(),
      value33 =
        Number(window['_v2FlushMinimapViewportPreview']?.(box6)) ||
        Number(window['_v2GetMinimapPreviewFlushCount']?.()) ||
        value32;
    (endPanFpsSession('canvas-pan'), cancelPendingViewportUpdate());
    const run3 = () => {
      (box6 && graphStore['updateViewport'](box6['x'], box6['y'], box6['zoom']),
        graphStore['markViewportPersist']());
    };
    typeof graphStore['batch'] === 'function' ? graphStore['batch'](run3) : run3();
    const value34 =
        (typeof graphStore['getStateRaw'] === 'function' && graphStore['getStateRaw']()) || getStateRaw(),
      finalX = box6 || value34?.['viewport'] || {};
    recordCanvasPanSample({
      durationMs: nowMs() - value31,
      moveCount: moveCount,
      committed: !!box6,
      nodeCount: Number['isFinite'](value34?.['_nodeCount'])
        ? value34['_nodeCount']
        : Object['keys'](value34?.['nodes'] || {})['length'],
      edgeCount: Object['keys'](value34?.['edges'] || {})['length'],
      mountedNodeCount: getMountedNodeCountForPerf(),
      minimapPreviewCount: Math['max'](0, value33 - value32),
      finalX: finalX['x'],
      finalY: finalX['y'],
      finalZoom: finalX['zoom'],
    });
  } else dragContext['assistPanActive'] ? _commitAssistPanPreview() : flushViewportUpdate();
  if (dragContext['isDraggingCell']) {
    const value35 = dragController['finishDraggingCell'](dragContext, value24, value25);
    _resetCellDragContext();
    if (value35['didAct']) _deferCommit();
    return;
  }
  if (dragContext['isConnecting'])
    value27 = edgeController['finishHandleConnect'](dragContext, value24, value25) || value27;
  else {
    if (dragContext['isBoxSelecting']) {
      const value36 = selectionController['finishBoxSelecting'](dragContext, value24, value25);
      value27 = value36['didAct'] || value27;
    } else {
      if (dragContext['isDragging']) {
        const value37 = dragController['finishDraggingNodes'](dragContext, value24, value25, value26);
        if (value37['earlyCommit']) {
          (window['_clearSnapGuideLines']?.(), _resetDragContext(), releaseViewportMediaPreloadsAfterPan());
          return;
        }
        value27 = value37['didAct'] || value27;
      }
    }
  }
  (window['_clearSnapGuideLines']?.(), _resetDragContext());
  if (value29) {
    const stateRaw4 = getStateRaw()?.['selectedNodeIds'] || [];
    window['v2Renderer']?.['flushSelection']?.(stateRaw4, { settleInteraction: true });
  }
  value30 &&
    (releaseViewportInteractionBusyForRenderer(),
    releaseViewportMediaPreloadsAfterPan(),
    scheduleSidePlusSyncAfterPanPaint());
  if (value27) commit();
}
export function handleWheel(value38, value39, value40, value41) {
  zoomController['handleWheel'](value38, value39, value40, value41);
}
export function handleWheelPan(value42, value43, value44) {
  return wheelPanController['handleWheelPan'](value42, value43, value44);
}
export function settleWheelZoom() {
  return zoomController['settleWheelZoom']();
}
export function settleWheelPan() {
  return wheelPanController['settleWheelPan']();
}
export function getDragContext() {
  return { ...dragContext };
}
export function getInteractionRenderState() {
  return {
    isDragging: !!dragContext['isDragging'],
    isDraggingCell: !!dragContext['isDraggingCell'],
    isCommittingDrag: dragContext['isCommittingDrag'] === true,
    isPanning: !!dragContext['isPanning'] && dragContext['panActivated'] === true,
    assistPanActive: !!dragContext['assistPanActive'],
    targetNodeId: dragContext['targetNodeId'] || null,
    pendingDx: Number['isFinite'](dragContext['pendingDx']) ? dragContext['pendingDx'] : 0,
    pendingDy: Number['isFinite'](dragContext['pendingDy']) ? dragContext['pendingDy'] : 0,
    hasMoved: !!dragContext['hasMoved'],
    wasSelectedOnDown: !!dragContext['wasSelectedOnDown'],
  };
}
export function handleDoubleClick(value45, value46) {
  const { viewport: viewport5, nodes: nodes3 } = getStateRaw(),
    { x: x9, y: y8 } = screenToWorld(value45, value46, viewport5);
  for (const box7 of Object['values'](nodes3)) {
    const isPointInRect2 = isPointInRect(
      x9,
      y8,
      box7['x'],
      box7['y'],
      box7['width'],
      box7['height'],
    );
    if (isPointInRect2) return;
  }
  uiStore['showPicker'](value45, value46, x9, y8);
}
export function handleContextMenu(value47, value48) {
  return canvasContextMenuController['handleNodeContextMenu'](value47, value48);
}
export function cloneNodesWithEdges(ids, dx2 = 16, dy2 = 16) {
  const response = interactionCommandAdapter['executeCanvasCommand']('node.duplicate', {
    ids: ids,
    dx: dx2,
    dy: dy2,
    edgePolicy: 'all-touching',
  });
  return response['ok'] ? response['result']?.['idMap'] || {} : {};
}
export function executeCanvasCommand(value49, value50 = {}) {
  return interactionCommandAdapter['executeCanvasCommand'](value49, value50);
}
export function executeCommand(value51, value52 = {}) {
  if (interactionCommandAdapter['execute'](value51, value52)) return;
  console['warn']('Unknown command: ', value51);
}
export function isValidConnection(value53, value54) {
  return isValidConnection_2(value53, value54);
}
export function initConnectionHandles(value55) {
  return initConnectionHandles_2(value55);
}
export function initPickConnect(value56) {
  return initPickConnect_2(value56);
}
export function initCanvasContextMenu(el3) {
  if (!el3) return;
  el3['addEventListener'](
    'contextmenu',
    (event2) => {
      if (!isEditableTextTargetInGroupedNode(event2['target'], getStateRaw()['nodes'])) return;
      event2['__aiCanvasGroupedEditableContextMenu'] = true;
    },
    { capture: true },
  );
  function run4(value57) {
    if (
      value57 === 'ai-text' ||
      value57 === 'ai-image' ||
      value57 === 'ai-video' ||
      value57 === 'ai-audio'
    )
      return getAIGenerationDefaultSizeByType(value57);
    if (value57 === 'panorama-scene' || value57 === 'panorama-360') return PANORAMA_SCENE_DEFAULT_SIZE;
    if (value57 === 'storyboard-script') return STORYBOARD_SCRIPT_DEFAULT_SIZE;
    return getNodeDefaultSize(value57);
  }
  function run5(type, x10, y9) {
    const width = run4(type['type']),
      extra =
        type['type'] === 'source-image' || type['type'] === 'source-video'
          ? { needsAutoResize: true }
          : {};
    executeCommand('create_node', {
      type: type['type'],
      x: x10 - width['width'] / 2,
      y: y9 - width['height'] / 2,
      width: width['width'],
      height: width['height'],
      name: type['defaultName'] || type['label'],
      extra: extra,
    });
  }
  function run6(value58, value59, value60 = false) {
    (document['querySelector']('#v2PickerOverlay')?.['remove'](), removeContextMenus());
    const { viewport: viewport6 } = getStateRaw();
    let value61, value62;
    if (value60) {
      const box8 = getViewportScreenCenter(viewport6, window['innerWidth'], window['innerHeight']),
        box9 = screenToWorld(box8['x'], box8['y'], viewport6);
      ((value61 = box9['x']), (value62 = box9['y']));
    } else {
      const box10 = screenToWorld(value58, value59, viewport6);
      ((value61 = box10['x']), (value62 = box10['y']));
    }
    const el4 = document['createElement']('div');
    el4['id'] = 'v2PickerOverlay';
    const box11 = getViewportScreenBounds(viewport6, window['innerWidth'], window['innerHeight']),
      value63 = Math['min'](440, Math['max'](220, box11['right'] - box11['left'] - 24)),
      value64 = Math['max'](
        box11['left'] + 12,
        Math['min'](value58, box11['right'] - value63 - 12),
      ),
      value65 = box11['top'] + 12,
      value66 = Math['max'](value65, Math['min'](value59, box11['bottom'] - 500)),
      el5 = document['createElement']('div');
    ((el5['className'] = 'v2-node-picker v2-node-menu-compact'),
      (el5['style']['left'] = value64 + 'px'),
      (el5['style']['top'] = value66 + 'px'),
      (el5['style']['width'] = value63 + 'px'));
    const run7 = (value67) => {
        const el6 = document['createElement']('div');
        el6['className'] = 'v2-menu-section';
        const value68 = document['createElement']('div');
        value68['className'] = 'v2-menu-rule';
        const el7 = document['createElement']('span');
        return (
          (el7['className'] = 'v2-menu-title'),
          (el7['textContent'] = value67),
          el6['appendChild'](el7),
          el6['appendChild'](value68),
          el6
        );
      },
      handler = (value69, handler2) => {
        const el8 = document['createElement']('button');
        el8['className'] = 'v2-menu-row' + (value69['desc'] ? ' has-desc' : '');
        const el9 = document['createElement']('div');
        ((el9['className'] = 'v2-menu-ico'), el9['replaceChildren']());
        if (value69['iconEl']) el9['appendChild'](value69['iconEl']['cloneNode'](true));
        el8['appendChild'](el9);
        const el10 = document['createElement']('div');
        el10['className'] = 'v2-menu-txt-wrap';
        const el11 = document['createElement']('span');
        ((el11['className'] = 'v2-menu-lbl'), (el11['textContent'] = value69['label']));
        if (value69['badge']) {
          const el12 = document['createElement']('span');
          ((el12['textContent'] = value69['badge']),
            (el12['className'] = 'v2-badge-beta'),
            el11['appendChild'](el12));
        }
        el10['appendChild'](el11);
        if (value69['desc']) {
          const el13 = document['createElement']('span');
          ((el13['className'] = 'v2-menu-sub'),
            (el13['textContent'] = value69['desc']),
            el10['appendChild'](el13));
        }
        return (
          el8['appendChild'](el10),
          el8['addEventListener']('click', (event3) => {
            (event3['stopPropagation'](), handler2(event3));
          }),
          el8
        );
      },
      stroke = 'var(--white-50)',
      value70 = 'http://www.w3.org/2000/svg',
      handler3 = (value71, value72) => {
        const el14 = document['createElementNS'](value70, 'svg');
        return (
          el14['setAttribute']('width', '18'),
          el14['setAttribute']('height', '18'),
          el14['setAttribute']('viewBox', '0 0 24 24'),
          el14['setAttribute']('fill', 'none'),
          el14['setAttribute']('stroke', value71),
          el14['setAttribute']('stroke-width', String(value72)),
          el14
        );
      },
      handler4 = (value73) => {
        const el15 = handler3(value73, 1.8),
          el16 = document['createElementNS'](value70, 'rect');
        (el16['setAttribute']('x', '4'),
          el16['setAttribute']('y', '4'),
          el16['setAttribute']('width', '16'),
          el16['setAttribute']('height', '16'),
          el16['setAttribute']('rx', '2'));
        const el17 = document['createElementNS'](value70, 'path');
        el17['setAttribute']('d', 'M8 9h8');
        const el18 = document['createElementNS'](value70, 'path');
        el18['setAttribute']('d', 'M8 13h6');
        const el19 = document['createElementNS'](value70, 'path');
        return (
          el19['setAttribute']('d', 'M15 20v-4h5'),
          el15['appendChild'](el16),
          el15['appendChild'](el17),
          el15['appendChild'](el18),
          el15['appendChild'](el19),
          el15
        );
      },
      handler5 = (value74) => {
        const el20 = handler3(value74, 1.8),
          el21 = document['createElementNS'](value70, 'circle');
        (el21['setAttribute']('cx', '12'),
          el21['setAttribute']('cy', '12'),
          el21['setAttribute']('r', '8.5'));
        const el22 = document['createElementNS'](value70, 'path');
        el22['setAttribute']('d', 'M3.5 12h17');
        const el23 = document['createElementNS'](value70, 'path');
        el23['setAttribute']('d', 'M12 3.5c2.4 2.6 3.5 5.4 3.5 8.5S14.4 17.9 12 20.5');
        const el24 = document['createElementNS'](value70, 'path');
        el24['setAttribute']('d', 'M12 3.5C9.6 6.1 8.5 8.9 8.5 12s1.1 5.9 3.5 8.5');
        const el25 = document['createElementNS'](value70, 'path');
        el25['setAttribute']('d', 'M6.1 6.1c3.4 1.8 8.4 1.8 11.8 0');
        const el26 = document['createElementNS'](value70, 'path');
        return (
          el26['setAttribute']('d', 'M6.1 17.9c3.4-1.8 8.4-1.8 11.8 0'),
          el20['appendChild'](el21),
          el20['appendChild'](el22),
          el20['appendChild'](el23),
          el20['appendChild'](el24),
          el20['appendChild'](el25),
          el20['appendChild'](el26),
          el20
        );
      },
      handler6 = (value75) => {
        const el27 = handler3(value75, 1.8),
          el28 = document['createElementNS'](value70, 'rect');
        (el28['setAttribute']('x', '3'),
          el28['setAttribute']('y', '4'),
          el28['setAttribute']('width', '18'),
          el28['setAttribute']('height', '16'),
          el28['setAttribute']('rx', '2'),
          el27['appendChild'](el28),
          ['9', '14']['forEach']((value76) => {
            const el29 = document['createElementNS'](value70, 'line');
            (el29['setAttribute']('x1', '3'),
              el29['setAttribute']('y1', value76),
              el29['setAttribute']('x2', '21'),
              el29['setAttribute']('y2', value76),
              el27['appendChild'](el29));
          }));
        const el30 = document['createElementNS'](value70, 'line');
        return (
          el30['setAttribute']('x1', '8'),
          el30['setAttribute']('y1', '4'),
          el30['setAttribute']('x2', '8'),
          el30['setAttribute']('y2', '20'),
          el27['appendChild'](el30),
          el27
        );
      },
      handler7 = (value77) => {
        const el31 = handler3(value77, 1.8),
          el32 = document['createElementNS'](value70, 'rect');
        return (
          el32['setAttribute']('x', '3'),
          el32['setAttribute']('y', '3'),
          el32['setAttribute']('width', '18'),
          el32['setAttribute']('height', '18'),
          el32['setAttribute']('rx', '2'),
          el31['appendChild'](el32),
          ['9', '15']['forEach']((value78) => {
            const el33 = document['createElementNS'](value70, 'line');
            (el33['setAttribute']('x1', '3'),
              el33['setAttribute']('y1', value78),
              el33['setAttribute']('x2', '21'),
              el33['setAttribute']('y2', value78),
              el31['appendChild'](el33));
            const el34 = document['createElementNS'](value70, 'line');
            (el34['setAttribute']('x1', value78),
              el34['setAttribute']('y1', '3'),
              el34['setAttribute']('x2', value78),
              el34['setAttribute']('y2', '21'),
              el31['appendChild'](el34));
          }),
          el31
        );
      },
      handler8 = () => {
        const el35 = handler3('var(--gold)', 1.8),
          el36 = document['createElementNS'](value70, 'path');
        return (
          el36['setAttribute'](
            'd',
            'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
          ),
          el35['appendChild'](el36),
          el35
        );
      },
      iconEl = () => {
        const el37 = handler3('var(--white-50)', 1.8),
          el38 = document['createElementNS'](value70, 'path');
        el38['setAttribute'](
          'd',
          'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
        );
        const el39 = document['createElementNS'](value70, 'polyline');
        el39['setAttribute']('points', '17 8 12 3 7 8');
        const el40 = document['createElementNS'](value70, 'line');
        return (
          el40['setAttribute']('x1', '12'),
          el40['setAttribute']('y1', '3'),
          el40['setAttribute']('x2', '12'),
          el40['setAttribute']('y2', '15'),
          el37['appendChild'](el38),
          el37['appendChild'](el39),
          el37['appendChild'](el40),
          el37
        );
      },
      handler9 = (value79) => {
        const el41 = handler3(value79, 1.8),
          el42 = document['createElementNS'](value70, 'path');
        el42['setAttribute']('d', 'M6 3v12a3 3 0 0 0 3 3h12');
        const el43 = document['createElementNS'](value70, 'path');
        el43['setAttribute']('d', 'M3 6h12a3 3 0 0 1 3 3v12');
        const el44 = document['createElementNS'](value70, 'path');
        return (
          el44['setAttribute']('d', 'M3 3l18 18'),
          el41['appendChild'](el42),
          el41['appendChild'](el43),
          el41['appendChild'](el44),
          el41
        );
      },
      handler10 = (value80) => {
        const el45 = handler3(value80, 1.8),
          el46 = document['createElementNS'](value70, 'rect');
        (el46['setAttribute']('x', '3'),
          el46['setAttribute']('y', '4'),
          el46['setAttribute']('width', '18'),
          el46['setAttribute']('height', '16'),
          el46['setAttribute']('rx', '2'));
        const el47 = document['createElementNS'](value70, 'path');
        el47['setAttribute']('d', 'M3 10h18');
        const el48 = document['createElementNS'](value70, 'path');
        return (
          el48['setAttribute']('d', 'M12 10v10'),
          el45['appendChild'](el46),
          el45['appendChild'](el47),
          el45['appendChild'](el48),
          el45
        );
      },
      handler11 = (value81) => {
        const el49 = handler3(value81, 1.8),
          el50 = document['createElementNS'](value70, 'rect');
        (el50['setAttribute']('x', '3'),
          el50['setAttribute']('y', '4'),
          el50['setAttribute']('width', '18'),
          el50['setAttribute']('height', '16'),
          el50['setAttribute']('rx', '2'));
        const el51 = document['createElementNS'](value70, 'path');
        el51['setAttribute']('d', 'M7 8h10');
        const el52 = document['createElementNS'](value70, 'path');
        el52['setAttribute']('d', 'M7 15c2.2-3 4.6-3 6.8 0 1.1 1.5 2.2 1.5 3.2 0');
        const el53 = document['createElementNS'](value70, 'path');
        return (
          el53['setAttribute']('d', 'M14.5 11.5l2.5-2.5 2 2-2.5 2.5-2.7.7.7-2.7z'),
          el49['appendChild'](el50),
          el49['appendChild'](el51),
          el49['appendChild'](el52),
          el49['appendChild'](el53),
          el49
        );
      },
      handler12 = (value82) => {
        const el54 = handler3(value82, 1.8),
          el55 = document['createElementNS'](value70, 'circle');
        (el55['setAttribute']('cx', '12'),
          el55['setAttribute']('cy', '12'),
          el55['setAttribute']('r', '9'));
        const el56 = document['createElementNS'](value70, 'path');
        el56['setAttribute']('d', 'M3 12h18');
        const el57 = document['createElementNS'](value70, 'path');
        el57['setAttribute']('d', 'M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21');
        const el58 = document['createElementNS'](value70, 'path');
        return (
          el58['setAttribute']('d', 'M12 3C9.7 5.5 8.5 8.5 8.5 12S9.7 18.5 12 21'),
          el54['appendChild'](el55),
          el54['appendChild'](el56),
          el54['appendChild'](el57),
          el54['appendChild'](el58),
          el54
        );
      },
      iconEl2 = {
        'ai-text': () =>
          createNodeCreationMenuIcon('ai-text', { documentObject: document, stroke: stroke }),
        'ai-image': () =>
          createNodeCreationMenuIcon('ai-image', { documentObject: document, stroke: stroke }),
        'ai-video': () =>
          createNodeCreationMenuIcon('ai-video', { documentObject: document, stroke: stroke }),
        'ai-audio': () =>
          createNodeCreationMenuIcon('ai-audio', { documentObject: document, stroke: stroke }),
        'comment-note': () => handler4(stroke),
        'panorama-scene': () => handler5(stroke),
        'panorama-360': () => handler5(stroke),
        storyboard: () => handler7(stroke),
        'storyboard-script': () => handler6(stroke),
        collage: () => handler10(stroke),
        whiteboard: () => handler11(stroke),
        'web-preview': () => handler12(stroke),
        'media-clip': () => handler9(stroke),
        debug: () => handler8(),
      },
      list = getNodeCreationMenuSections(PICKER_NODE_CREATION_SECTION_IDS, {
        includeDevOnly: isDevModeOn(),
      }),
      el59 = document['createElement']('div');
    el59['className'] = 'v2-node-picker-layout';
    const el60 = document['createElement']('div');
    ((el60['className'] = 'v2-node-picker-column v2-node-picker-column-primary'),
      (el60['dataset']['nodePickerColumn'] = 'primary'));
    const el61 = document['createElement']('div');
    ((el61['className'] = 'v2-node-picker-column v2-node-picker-column-function'),
      (el61['dataset']['nodePickerColumn'] = 'function'),
      el59['appendChild'](el60),
      el59['appendChild'](el61),
      el5['appendChild'](el59),
      list['forEach']((value83) => {
        const el62 = document['createElement']('section');
        ((el62['className'] = 'v2-node-picker-section v2-node-menu-section'),
          (el62['dataset']['nodePickerSection'] = value83['id']),
          el62['appendChild'](run7(value83['label'])),
          value83['items']['forEach']((key2) => {
            const w = run4(key2['type']);
            el62['appendChild'](
              handler(
                {
                  key: key2['type'],
                  label: key2['label'],
                  w: w['width'],
                  h: w['height'],
                  badge: key2['badge'],
                  desc: key2['subtitle'],
                  iconEl: iconEl2[key2['type']]?.(),
                },
                () => {
                  (el4['remove'](), run5(key2, value61, value62));
                },
              ),
            );
          }));
        const el63 = value83['id'] === 'function' ? el61 : el60;
        el63['appendChild'](el62);
      }));
    const el64 = document['createElement']('section');
    ((el64['className'] = 'v2-node-picker-section v2-node-menu-section'),
      (el64['dataset']['nodePickerSection'] = 'resource'),
      el64['appendChild'](run7(t('canvasInteraction.contextMenu.addResource'))),
      el64['appendChild'](
        handler(
          {
            label: NODE_CREATION_UPLOAD_ITEM['label'],
            desc: NODE_CREATION_UPLOAD_ITEM['subtitle'],
            iconBg: 'var(--white-05)',
            iconEl: iconEl(),
          },
          () => {
            (el4['remove'](), openCanvasUploadAt(value58, value59));
          },
        ),
      ),
      el60['appendChild'](el64),
      el4['appendChild'](el5),
      document['body']['appendChild'](el4));
    const box12 = el5['getBoundingClientRect'](),
      value84 = Math['max'](value65, box11['bottom'] - box12['height'] - 12),
      value85 = Number['parseFloat'](el5['style']['top']) || value59;
    ((el5['style']['top'] = Math['min'](Math['max'](value65, value85), value84) + 'px'),
      el4['addEventListener']('click', () => el4['remove']()));
  }
  (el3['addEventListener']('dblclick', (event4) => {
    if (event4['target']['closest']('.v2-node')) return;
    (event4['preventDefault'](),
      event4['stopPropagation'](),
      run6(event4['clientX'], event4['clientY']));
  }),
    el3['addEventListener']('contextmenu', (screenX2) => {
      if (screenX2['defaultPrevented']) return;
      const anchorNodeId = screenX2['target']['closest']('.v2-node'),
        enabled6 = screenX2['target']['closest']('.v2-canvas-stage');
      if (!anchorNodeId && !enabled6) return;
      const pasteTarget = getEditableTextTarget(screenX2['target']);
      if (!pasteTarget && screenX2['target']['closest'](TEXT_CONTEXT_MENU_TARGET_SELECTOR)) return;
      (screenX2['preventDefault'](), screenX2['stopPropagation']());
      const enabled7 = window['getSelection']();
      if (!anchorNodeId && enabled7 && !enabled7['isCollapsed'])
        try {
          enabled7['removeAllRanges']();
        } catch {}
      const value86 = enabled7 ? enabled7['toString']()['trim']() : '';
      let value87 = false;
      if (enabled7 && value86 && enabled7['rangeCount'] > 0 && !enabled7['isCollapsed']) {
        const value88 = screenX2['target'];
        for (let value89 = 0; value89 < enabled7['rangeCount']; value89++) {
          const value90 = enabled7['getRangeAt'](value89);
          try {
            if (value90['intersectsNode'](value88)) {
              value87 = true;
              break;
            }
          } catch {}
        }
      }
      if (value86 && value87) {
        canvasContextMenuController['handleTextContextMenu'](
          screenX2['clientX'],
          screenX2['clientY'],
          value86,
          {
            anchorNodeId: anchorNodeId?.['dataset']?.['nodeId'] || anchorNodeId?.['id'] || null,
            pasteTarget: pasteTarget,
            pasteSelection: pasteTarget ? captureEditableSelection(pasteTarget) : null,
          },
        );
        return;
      }
      if (pasteTarget) {
        showTextInputContextMenu({
          target: pasteTarget,
          screenX: screenX2['clientX'],
          screenY: screenX2['clientY'],
          snapshot: captureEditableSelection(pasteTarget),
        });
        return;
      }
      if (anchorNodeId) {
        handleContextMenu(screenX2['clientX'], screenX2['clientY']);
        return;
      }
      canvasContextMenuController['showCanvasContextMenu'](screenX2['clientX'], screenX2['clientY']);
    }),
    (initCanvasContextMenu['_showPicker'] = run6));
}
export function handleTextContextMenu(value91, value92, value93, value94 = {}) {
  return canvasContextMenuController['handleTextContextMenu'](value91, value92, value93, value94);
}
