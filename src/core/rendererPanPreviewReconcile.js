import { getInteractionRenderState } from './interaction.js';
import { getViewportPanPreview, VIEWPORT_PAN_PREVIEW_FRAME_EVENT } from './viewportPanPreview.js';
import { readViewportInteractionState } from './viewportInteractionState.js';
import {
  getRendererStructuralReconcileDelayMs,
  RENDERER_VIRTUALIZATION_CONFIG,
} from './rendererVirtualization.js';
import { canReuseRendererViewportPreviewCoverage } from './rendererViewportPreviewCoverage.js';
import { resolveViewportInteractionReconcileDelay } from './rendererInteractionRenderPolicy.js';
import {
  isRendererRuntimeDiagnosticsEnabled,
  recordRendererRuntimeDiagnostic,
} from './rendererRuntimeDiagnostics.js';
const DENSE_PAN_PREVIEW_RECONCILE_INTERVAL_MS = 96,
  PAN_MEDIA_LOOKAHEAD_REFRESH_MS = 160,
  DENSE_PAN_PREVIEW_HIGH_ZOOM_BUCKET_PX = 240,
  DENSE_ZOOM_PREVIEW_RECONCILE_INTERVAL_MS = 160;
function getWindowLike() {
  return typeof window !== 'undefined' ? window : globalThis;
}
function requestFrame(handler) {
  const windowLike = getWindowLike();
  if (typeof windowLike?.requestAnimationFrame === 'function')
    return windowLike.requestAnimationFrame(handler);
  return setTimeout(() => handler(Date.now()), 16);
}
function cancelFrame(value) {
  const windowLike2 = getWindowLike();
  if (typeof windowLike2?.cancelAnimationFrame === 'function') {
    windowLike2.cancelAnimationFrame(value);
    return;
  }
  clearTimeout(value);
}
function normalizeViewport(item, key = null) {
  const box = item && typeof item === 'object' ? item : {},
    box2 = key && typeof key === 'object' ? key : {},
    index = Number(box.x),
    result = Number(box.y),
    data = Number(box.zoom),
    options = Number(box2.x),
    target = Number(box2.y),
    source = Number(box2.zoom),
    zoom = Number.isFinite(data) ? data : Number.isFinite(source) ? source : 1;
  return {
    x: Number.isFinite(index) ? index : Number.isFinite(options) ? options : 0,
    y: Number.isFinite(result) ? result : Number.isFinite(target) ? target : 0,
    zoom: zoom > 0 ? zoom : 1,
  };
}
function nowMs() {
  return typeof performance !== 'undefined' && performance && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}
function quantizeSigned(next, current) {
  const entry = Math.max(1, Number(current) || 1);
  return Math.trunc(Number(next || 0) / entry) * entry;
}
function getDensePanPreviewBucket(box3, record) {
  const payload = Number(box3?.zoom) || 1,
    handle = Number(record) || 0;
  if (handle < RENDERER_VIRTUALIZATION_CONFIG.denseNodeCount) return null;
  const state =
      payload <= RENDERER_VIRTUALIZATION_CONFIG.veryDenseLowZoomThreshold &&
      handle >= RENDERER_VIRTUALIZATION_CONFIG.veryDenseNodeCount,
    config =
      payload <= RENDERER_VIRTUALIZATION_CONFIG.denseLowZoomThreshold &&
      handle >= RENDERER_VIRTUALIZATION_CONFIG.denseNodeCount,
    bucketSize = state ? 192 : config ? 64 : DENSE_PAN_PREVIEW_HIGH_ZOOM_BUCKET_PX;
  return {
    key:
      quantizeSigned(box3.x, bucketSize) +
      ':' +
      quantizeSigned(box3.y, bucketSize) +
      ':' +
      payload.toFixed(3),
    bucketSize: bucketSize,
  };
}
function addNodeAndChildren(map, enabled, scope) {
  if (!enabled || map.has(enabled)) return;
  map.add(enabled);
  const enabled2 = scope?.[enabled];
  if (!enabled2) return;
  const input = enabled2 instanceof Set ? enabled2 : Array.isArray(enabled2) ? enabled2 : [];
  for (const output of input) {
    addNodeAndChildren(map, output, scope);
  }
}
function collectActiveDragNodeIds({
  dragContext: dragContext,
  selectedNodeIds: selectedNodeIds,
  parentToChildren: parentToChildren,
} = {}) {
  const value2 = new Set();
  if (!dragContext?.isDragging || dragContext.isCommittingDrag === true) return value2;
  const value3 = dragContext.targetNodeId || null,
    list = Array.isArray(selectedNodeIds) ? selectedNodeIds : [],
    value4 = value3 && list.includes(value3) ? list : value3 ? [value3] : [];
  for (const value5 of value4) {
    addNodeAndChildren(value2, value5, parentToChildren);
  }
  return value2;
}
function omitNodeIds(value6, map2) {
  if (!map2 || map2.size === 0) return value6;
  const value7 = {};
  for (const [value8, value9] of Object.entries(value6 || {})) {
    if (!map2.has(value8)) value7[value8] = value9;
  }
  return value7;
}
export function createRendererPanPreviewReconciler({
  canvasEl: canvasEl,
  svgWrapper: svgWrapper,
  getSnapshot: getSnapshot,
  hasPendingStoreRender: hasPendingStoreRender,
  markBusy: markBusy,
  renderViewport: renderViewport,
  renderNodes: renderNodes,
  buildSelectionRelatedSets: buildSelectionRelatedSets,
  normalizeSelectionRelatedHighlightColor: normalizeSelectionRelatedHighlightColor,
  scheduleDeferredReconcile: scheduleDeferredReconcile,
  now: now = nowMs,
} = {}) {
  const el = getWindowLike(),
    isRendererRuntimeDiagnosticsEnabled2 = isRendererRuntimeDiagnosticsEnabled();
  let requestFrame2 = null,
    value10 = null,
    value11 = '',
    value12 = 0,
    value13 = null,
    value14 = null,
    value15 = 0;
  function run() {
    (requestFrame2 !== null && (cancelFrame(requestFrame2), (requestFrame2 = null)), (value10 = null));
  }
  function run2(snapshot, viewport, { allowIdleViewportOnly: allowIdleViewportOnly = false } = {}) {
    if (!snapshot || !viewport) return null;
    const interactionState = getInteractionRenderState(),
      viewportInteractionState = readViewportInteractionState({ interactionState: interactionState }),
      enabled3 = viewportInteractionState.isViewportBusy
        ? viewportInteractionState
        : readViewportInteractionState({ interactionState: interactionState, panPreviewActive: true });
    if (
      !allowIdleViewportOnly &&
      !enabled3.isPanning &&
      !enabled3.isZooming &&
      !enabled3.isViewportAnimating
    )
      return null;
    const nodeCount =
        typeof snapshot._nodeCount === 'number'
          ? snapshot._nodeCount
          : Object.keys(snapshot.nodes || {}).length,
      mode = enabled3.isViewportAnimating || (enabled3.isZooming && !enabled3.isPanning),
      enabled4 = enabled3.isZooming && !enabled3.isPanning && !enabled3.isViewportAnimating,
      value16 = enabled3.isPanning && !mode,
      bucketKey = value16 ? getDensePanPreviewBucket(viewport, nodeCount) : null;
    let enabled5 = false;
    if (bucketKey && value13) {
      if (
        (viewport.zoom <= RENDERER_VIRTUALIZATION_CONFIG.veryDenseLowZoomThreshold ||
          now() - value12 < PAN_MEDIA_LOOKAHEAD_REFRESH_MS) &&
        canReuseRendererViewportPreviewCoverage(value13, {
          viewport: viewport,
          nodeCount: nodeCount,
          snapshot: snapshot,
        })
      )
        return (
          isRendererRuntimeDiagnosticsEnabled2 &&
            recordRendererRuntimeDiagnostic({
              kind: 'pan-preview-coverage-reuse',
              nodeCount: nodeCount,
              viewport: { ...viewport },
            }),
          { skipped: true, hasPendingStructuralOps: false, priorityMediaWork: false, nodeCount: nodeCount }
        );
      ((value13 = null), (enabled5 = true));
    } else !bucketKey && (value13 = null);
    if (bucketKey) {
      const now2 = now();
      if (
        !enabled5 &&
        bucketKey.key === value11 &&
        now2 - value12 < DENSE_PAN_PREVIEW_RECONCILE_INTERVAL_MS
      )
        return (
          isRendererRuntimeDiagnosticsEnabled2 &&
            recordRendererRuntimeDiagnostic({
              kind: 'pan-preview-reconcile-skip',
              nodeCount: nodeCount,
              bucketKey: bucketKey.key,
            }),
          { skipped: true, hasPendingStructuralOps: false, nodeCount: nodeCount }
        );
      ((value11 = bucketKey.key), (value12 = now2));
    } else ((value11 = ''), (value12 = 0));
    (markBusy?.(), renderViewport?.(canvasEl, viewport, snapshot.ui?.titleFollowsCanvasZoom === true));
    if (svgWrapper?.style?.display === 'none') svgWrapper.style.display = '';
    const value17 = typeof now === 'function' ? now() : nowMs(),
      elapsedMs = value17 - value15;
    if (
      enabled4 &&
      value14 &&
      elapsedMs >= 0 &&
      elapsedMs < DENSE_ZOOM_PREVIEW_RECONCILE_INTERVAL_MS &&
      canReuseRendererViewportPreviewCoverage(value14, {
        viewport: viewport,
        nodeCount: nodeCount,
        snapshot: snapshot,
      })
    )
      return (
        isRendererRuntimeDiagnosticsEnabled2 &&
          recordRendererRuntimeDiagnostic({
            kind: 'zoom-preview-reconcile-skip',
            nodeCount: nodeCount,
            elapsedMs: elapsedMs,
            viewport: { ...viewport },
          }),
        { skipped: true, hasPendingStructuralOps: false, priorityMediaWork: false, nodeCount: nodeCount }
      );
    !enabled4 && ((value14 = null), (value15 = 0));
    const value18 =
        snapshot.ui?.selectionRelatedHighlightEnabled === false
          ? { relatedNodeIds: new Set(), relatedEdgeIds: new Set() }
          : buildSelectionRelatedSets?.(snapshot.selectedNodeIds, snapshot.edges) || {
              relatedNodeIds: new Set(),
              relatedEdgeIds: new Set(),
            },
      value19 = normalizeSelectionRelatedHighlightColor?.(snapshot.ui?.selectionRelatedHighlightColor),
      activeDragNodeIds = collectActiveDragNodeIds({
        dragContext: interactionState,
        selectedNodeIds: snapshot.selectedNodeIds,
        parentToChildren: snapshot._parentToChildren,
      }),
      omitNodeIds2 = omitNodeIds(snapshot.nodes, activeDragNodeIds),
      priorityMediaWork = false,
      viewportPriorityMediaOnly = false,
      previewOnly = true,
      value20 = isRendererRuntimeDiagnosticsEnabled2 ? nowMs() : 0,
      value21 = isRendererRuntimeDiagnosticsEnabled2 ? nowMs() : 0,
      value22 = renderNodes?.(
        canvasEl,
        omitNodeIds2,
        snapshot.selectedNodeIds,
        value18.relatedNodeIds,
        value19,
        snapshot.connOverlay,
        snapshot.pickConnectMode,
        viewport,
        snapshot.edges,
        snapshot._parentToChildren,
        snapshot.ui && typeof snapshot.ui.showVideoMeta === 'boolean'
          ? snapshot.ui.showVideoMeta
          : false,
        snapshot,
        {
          deferParking: true,
          previewOnly: previewOnly,
          mode: mode ? 'zoom-lod-preview' : 'pan-preview',
          lockRasterParticipation: !mode,
          suspendNewMediaSrc: !viewportPriorityMediaOnly,
          viewportPriorityMediaOnly: viewportPriorityMediaOnly,
        },
      );
    enabled4 && ((value14 = value22?.previewCoverage || null), (value15 = value17));
    bucketKey && (value13 = value22?.previewCoverage || null);
    if (isRendererRuntimeDiagnosticsEnabled2) {
      const renderNodesMs = nowMs();
      recordRendererRuntimeDiagnostic({
        kind: 'pan-preview-reconcile',
        nodeCount: nodeCount,
        previewOnly: previewOnly,
        priorityMediaWork: priorityMediaWork,
        renderNodesMs: renderNodesMs - value21,
        durationMs: renderNodesMs - value20,
        viewport: { ...viewport },
      });
    }
    const hasPendingStructuralOps = value22?.hasPendingStructuralOps === true;
    return {
      hasPendingStructuralOps: hasPendingStructuralOps,
      priorityMediaWork: priorityMediaWork,
      nodeCount: nodeCount,
    };
  }
  function run3(args) {
    value10 = args ? { ...args } : null;
    if (requestFrame2 !== null) return;
    requestFrame2 = requestFrame(() => {
      requestFrame2 = null;
      if (hasPendingStoreRender?.()) {
        const value23 = value10;
        value10 = null;
        if (value23) run3(value23);
        return;
      }
      const enabled6 = getSnapshot?.(),
        value24 = value10;
      value10 = null;
      if (!enabled6) return;
      const viewport2 = normalizeViewport(value24 || getViewportPanPreview(), enabled6.viewport),
        hasPriorityMediaWork = run2(enabled6, viewport2);
      if (hasPriorityMediaWork?.hasPendingStructuralOps) run3(viewport2);
      else
        hasPriorityMediaWork &&
          hasPriorityMediaWork.skipped !== true &&
          scheduleDeferredReconcile?.(
            resolveViewportInteractionReconcileDelay({
              hasPriorityMediaWork: hasPriorityMediaWork.priorityMediaWork === true,
              fallbackDelayMs: getRendererStructuralReconcileDelayMs(hasPriorityMediaWork.nodeCount),
            }),
          );
    });
  }
  const value25 = (value26) => {
    const enabled7 = value26?.detail?.viewport || getViewportPanPreview() || null;
    if (!enabled7) return;
    if (hasPendingStoreRender?.()) {
      run3(enabled7);
      return;
    }
    requestFrame2 !== null && (cancelFrame(requestFrame2), (requestFrame2 = null), (value10 = null));
    const enabled8 = getSnapshot?.();
    if (!enabled8) return;
    const viewport3 = normalizeViewport(enabled7, enabled8.viewport),
      hasPriorityMediaWork2 = run2(enabled8, viewport3);
    if (hasPriorityMediaWork2?.hasPendingStructuralOps) run3(viewport3);
    else
      hasPriorityMediaWork2 &&
        hasPriorityMediaWork2.skipped !== true &&
        scheduleDeferredReconcile?.(
          resolveViewportInteractionReconcileDelay({
            hasPriorityMediaWork: hasPriorityMediaWork2.priorityMediaWork === true,
            fallbackDelayMs: getRendererStructuralReconcileDelayMs(hasPriorityMediaWork2.nodeCount),
          }),
        );
  };
  return (
    el?.addEventListener?.(VIEWPORT_PAN_PREVIEW_FRAME_EVENT, value25),
    {
      reconcileViewportOnly(value27, value28) {
        return run2(value27, value28, { allowIdleViewportOnly: true });
      },
      dispose() {
        (run(),
          (value11 = ''),
          (value12 = 0),
          (value13 = null),
          (value14 = null),
          (value15 = 0),
          el?.removeEventListener?.(VIEWPORT_PAN_PREVIEW_FRAME_EVENT, value25));
      },
    }
  );
}
