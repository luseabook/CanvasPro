import { clearCanvasNearbyVideoWarmup, syncCanvasNearbyVideoWarmup } from './canvasMediaWarmup.js';
import { isNodeInsideViewportPadding } from './rendererVirtualization.js';
import { buildCanvasVideoProxyPromotionPatch } from '../services/canvasMediaLocalService.js';
import {
  cancelVideoProxyMigrationTask,
  getLegacyProjectImportVideoProxyMigration,
  requestVisibleVideoProxyMigration,
  subscribeVideoProxyMigrationUpdates,
} from '../services/mediaTaskService.js';
import { screenToWorld } from './math.js';
import { isViewportPanPreviewActive } from './viewportPanPreview.js';
const DEFAULT_DEBOUNCE_MS = 160,
  LOW_ZOOM_VIDEO_WARMUP_THRESHOLD = 0.45,
  DEFAULT_PROXY_MIGRATION_BATCH_SIZE = 4,
  MAX_PROXY_MIGRATION_BATCH_SIZE = 8,
  MAX_PENDING_PROXY_MIGRATION_UPDATE_COUNT = 120 + MAX_PROXY_MIGRATION_BATCH_SIZE,
  PROXY_MIGRATION_TERMINAL_STATUSES = new Set(['complete', 'failed', 'cancelled']);
function normalizeViewport(box) {
  return {
    x: Number.isFinite(Number(box?.x)) ? Number(box.x) : 0,
    y: Number.isFinite(Number(box?.y)) ? Number(box.y) : 0,
    zoom: Number.isFinite(Number(box?.zoom)) && Number(box.zoom) > 0 ? Number(box.zoom) : 1,
  };
}
function readStoreSnapshot(store) {
  return store?.getStateRaw?.() || store?.getState?.() || {};
}
function getContainerSize(el) {
  return {
    width: Math.max(1, Number(el?.clientWidth) || 1600),
    height: Math.max(1, Number(el?.clientHeight) || 900),
  };
}
function normalizeProxyMigrationBatchSize(value) {
  const count = Math.trunc(Number(value));
  if (!Number.isFinite(count) || count < 1) return DEFAULT_PROXY_MIGRATION_BATCH_SIZE;
  return Math.min(MAX_PROXY_MIGRATION_BATCH_SIZE, count);
}
function sortProxyMigrationNodeIdsByPriority({
  nodeIds: nodeIds,
  nodes: nodes,
  selectedNodeIds: selectedNodeIds,
  viewport: viewport,
  containerEl: containerEl,
}) {
  const selected = new Set(selectedNodeIds || []),
    { width: width, height: height } = getContainerSize(containerEl),
    box2 = screenToWorld(width / 2, height / 2, normalizeViewport(viewport));
  return (nodeIds || [])
    .map((nodeId, index) => {
      const box3 = nodes?.[nodeId] || {},
        item = Number(box3.x || 0) + Number(box3.width || 0) / 2,
        key = Number(box3.y || 0) + Number(box3.height || 0) / 2,
        distanceSq = item - box2.x,
        result = key - box2.y;
      return {
        nodeId: nodeId,
        index: index,
        selected: selected.has(nodeId),
        distanceSq: distanceSq * distanceSq + result * result,
      };
    })
    .sort((data, options) => {
      if (data.selected !== options.selected) return data.selected ? -1 : 1;
      return data.distanceSq - options.distanceSq || data.index - options.index;
    })
    .map((target) => target.nodeId);
}
export function collectVisibleLegacySourceVideoNodeIds({
  nodes: nodes2,
  viewport: viewport2,
  containerEl: containerEl2,
  isLegacySourceVideo: isLegacySourceVideo = getLegacyProjectImportVideoProxyMigration,
  buildProxyPromotionPatch: buildProxyPromotionPatch = buildCanvasVideoProxyPromotionPatch,
} = {}) {
  const box4 = normalizeViewport(viewport2);
  if (box4.zoom > LOW_ZOOM_VIDEO_WARMUP_THRESHOLD) return [];
  const { width: width2, height: height2 } = getContainerSize(containerEl2),
    source = Array.isArray(nodes2) ? nodes2 : Object.values(nodes2 || {}),
    list = [];
  for (const enabled of source) {
    const enabled2 =
      String(enabled?.type || '')
        .trim()
        .toLowerCase() === 'source-video' && !!buildProxyPromotionPatch(enabled);
    if (!enabled?.id || (!isLegacySourceVideo(enabled) && !enabled2)) continue;
    if (!isNodeInsideViewportPadding(enabled, box4, width2, height2, 0)) continue;
    list.push(String(enabled.id));
  }
  return list;
}
function buildCanvasViewportVideoWarmupScopeSignature(state = {}) {
  const box5 = normalizeViewport(state.viewport),
    next = Number.isFinite(Number(state._nodeGeometryRev)) ? Number(state._nodeGeometryRev) : 0,
    current = Array.isArray(state.selectedNodeIds)
      ? state.selectedNodeIds.map((entry) => String(entry || ''))
      : [];
  return [box5.x, box5.y, box5.zoom, next, JSON.stringify(current)].join(':');
}
export function buildCanvasViewportVideoWarmupSignature(options2 = {}) {
  const record = Number.isFinite(Number(options2._sourceVideoRev))
    ? Number(options2._sourceVideoRev)
    : 0;
  return buildCanvasViewportVideoWarmupScopeSignature(options2) + ':' + record;
}
export function createCanvasViewportVideoWarmupController({
  store: store2,
  containerEl: containerEl3,
  debounceMs: debounceMs = DEFAULT_DEBOUNCE_MS,
  syncWarmup: syncWarmup = syncCanvasNearbyVideoWarmup,
  clearWarmup: clearWarmup = clearCanvasNearbyVideoWarmup,
  requestProxyMigration: requestProxyMigration = requestVisibleVideoProxyMigration,
  isLegacySourceVideo: isLegacySourceVideo = getLegacyProjectImportVideoProxyMigration,
  buildProxyPromotionPatch: buildProxyPromotionPatch = buildCanvasVideoProxyPromotionPatch,
  resolveProxyMigrationBatchSize: resolveProxyMigrationBatchSize = () => DEFAULT_PROXY_MIGRATION_BATCH_SIZE,
  proxyMigrationBatchIntervalMs: proxyMigrationBatchIntervalMs = debounceMs,
  isViewportInteractionActive: isViewportInteractionActive = isViewportPanPreviewActive,
  subscribeProxyMigrationUpdates: subscribeProxyMigrationUpdates = subscribeVideoProxyMigrationUpdates,
  cancelProxyMigrationTask: cancelProxyMigrationTask = cancelVideoProxyMigrationTask,
  setTimer: setTimer = setTimeout,
  clearTimer: clearTimer = clearTimeout,
} = {}) {
  if (!store2 || typeof syncWarmup !== 'function' || typeof clearWarmup !== 'function') return () => {};
  const payload = Math.max(120, Math.min(200, Number(debounceMs) || DEFAULT_DEBOUNCE_MS)),
    handle = Math.max(120, Math.min(200, Number(proxyMigrationBatchIntervalMs) || payload));
  let timer = null,
    timer2 = null,
    queuedCount = [],
    enabled3 = '',
    enabled4 = null;
  const map = new Map(),
    map2 = new Map();
  let config = false,
    enabled5 = true,
    scope = '',
    input = '',
    output = null,
    map3 = new Set();
  const run = () => {
      if (timer === null) return false;
      return (clearTimer(timer), (timer = null), true);
    },
    handler = () => {
      ((queuedCount = []), (enabled3 = ''), (enabled4 = null));
      if (timer2 === null) return false;
      return (clearTimer(timer2), (timer2 = null), true);
    },
    handler2 = (value2) => {
      for (const [value3, value4] of map2) {
        if (value4.entry === value2) map2.delete(value3);
      }
    },
    handler3 = (enabled6) => {
      if (!enabled6 || map.get(enabled6.nodeId) !== enabled6) return false;
      return (map.delete(enabled6.nodeId), handler2(enabled6), true);
    },
    handler4 = (options3 = {}) => {
      const value5 = String(options3?.taskId || options3?.id || '').trim();
      if (value5) {
        for (const value6 of map.values()) {
          if (value6.taskId === value5) return value6;
        }
        return null;
      }
      const value7 = String(options3?.nodeId || '').trim(),
        value8 = value7 ? map.get(value7) || null : null;
      return value8?.taskId ? value8 : null;
    },
    handler5 = (event = {}) => {
      const enabled7 = String(event?.taskId || event?.id || '').trim(),
        value9 = String(event?.nodeId || '').trim(),
        response = value9 ? map.get(value9) || null : null,
        entry2 = response?.status === 'submitting' && !response.taskId ? response : null,
        value10 = String(event?.status || '')
          .trim()
          .toLowerCase();
      if (!enabled7 || !entry2) {
        const enabled8 =
          !!enabled7 &&
          PROXY_MIGRATION_TERMINAL_STATUSES.has(value10) &&
          Array.from(map.values()).some(
            (response2) => response2?.status === 'submitting' && !response2?.taskId,
          );
        if (!enabled8) return false;
      }
      if (!map2.has(enabled7))
        while (map2.size >= MAX_PENDING_PROXY_MIGRATION_UPDATE_COUNT) {
          const value11 = map2.keys().next().value;
          map2.delete(value11);
        }
      else map2.delete(enabled7);
      return (map2.set(enabled7, { entry: entry2, event: event }), true);
    },
    handler6 = (value12, value13) => {
      let value14 = null;
      for (const [value15, enabled9] of map2) {
        const value16 = enabled9.entry === value12,
          value17 = !enabled9.entry && value15 === value13;
        (value15 === value13 && (value16 || value17) && (value14 = enabled9.event),
          (value16 || value17) && map2.delete(value15));
      }
      return value14;
    },
    handler7 = (response3) => {
      if (
        !response3 ||
        response3.cancelRequested ||
        response3.status !== 'waiting' ||
        !response3.taskId
      )
        return false;
      response3.cancelRequested = true;
      try {
        void Promise.resolve(cancelProxyMigrationTask(response3.taskId))
          .then((response4) => {
            if (map.get(response3.nodeId) !== response3) return;
            const value18 = String(response4?.task?.status || response4?.status || '')
              .trim()
              .toLowerCase();
            if (value18) response3.status = value18;
            if (PROXY_MIGRATION_TERMINAL_STATUSES.has(value18)) {
              handler3(response3) && handler8();
              return;
            }
            (response4?.skipped === true || response4?.ok === false) &&
              (response3.cancelRequested = false);
          })
          .catch((value19) => {
            ((response3.cancelRequested = false),
              console.warn('[canvasViewportVideoWarmup] proxy migration cancel failed:', value19));
          });
      } catch (value20) {
        ((response3.cancelRequested = false),
          console.warn('[canvasViewportVideoWarmup] proxy migration cancel failed:', value20));
      }
      return true;
    },
    handler9 = (value21) => output === input && !map3.has(value21.nodeId),
    handler10 = () => {
      for (const value22 of map.values()) {
        if (!handler9(value22)) continue;
        handler7(value22);
      }
    },
    handler11 = (nodeId2, signature, viewport3) => {
      const response5 = {
        nodeId: nodeId2,
        taskId: '',
        status: 'submitting',
        signature: signature,
        viewport: viewport3,
        cancelRequested: false,
      };
      map.set(nodeId2, response5);
      try {
        void Promise.resolve(requestProxyMigration(nodeId2))
          .then((response6) => {
            if (map.get(nodeId2) !== response5) return;
            if (!response6 || typeof response6 !== 'object') {
              (handler3(response5), handler8());
              return;
            }
            ((response5.taskId = String(response6.taskId || response6.id || '').trim()),
              (response5.status = String(response6.status || 'waiting')
                .trim()
                .toLowerCase()));
            const value23 = handler6(response5, response5.taskId);
            if (value23) {
              handler12(response5, value23);
              if (map.get(nodeId2) !== response5) return;
            }
            (handler9(response5) && handler7(response5),
              PROXY_MIGRATION_TERMINAL_STATUSES.has(response5.status) &&
                (handler3(response5), handler8()));
          })
          .catch((value24) => {
            (handler3(response5) && handler8(),
              console.warn('[canvasViewportVideoWarmup] proxy migration request failed:', value24));
          });
      } catch (value25) {
        (handler3(response5) && handler8(),
          console.warn('[canvasViewportVideoWarmup] proxy migration request failed:', value25));
      }
    },
    handler13 = (viewport4) => {
      try {
        return isViewportInteractionActive({ viewport: viewport4, containerEl: containerEl3 }) === true;
      } catch {
        return false;
      }
    },
    handler14 = (value26, viewport5) => {
      if (config || !enabled5 || enabled3 !== value26 || input !== value26) return;
      if (handler13(viewport5)) {
        timer2 === null &&
          ((timer2 = setTimer(() => {
            ((timer2 = null), handler14(value26, viewport5));
          }, handle)),
          timer2?.unref?.());
        return;
      }
      let proxyMigrationBatchSize = DEFAULT_PROXY_MIGRATION_BATCH_SIZE;
      try {
        proxyMigrationBatchSize = resolveProxyMigrationBatchSize({
          queuedCount: queuedCount.length,
          viewport: viewport5,
          containerEl: containerEl3,
        });
      } catch {}
      const proxyMigrationBatchSize2 = normalizeProxyMigrationBatchSize(proxyMigrationBatchSize),
        count2 = Math.max(0, proxyMigrationBatchSize2 - map.size);
      if (count2 === 0) return;
      const value27 = queuedCount.splice(0, count2);
      for (const value28 of value27) {
        handler11(value28, value26, viewport5);
      }
      if (queuedCount.length === 0) {
        ((enabled3 = ''), (enabled4 = null));
        return;
      }
    },
    handler8 = () => {
      if (!enabled3 || !enabled4) return;
      handler14(enabled3, enabled4);
    },
    handler12 = (response7, response8 = {}) => {
      const value29 = String(response8.status || '')
        .trim()
        .toLowerCase();
      if (value29) response7.status = value29;
      const value30 = String(response8.taskId || response8.id || '').trim();
      if (value30) response7.taskId = value30;
      handler9(response7) && handler7(response7);
      if (!PROXY_MIGRATION_TERMINAL_STATUSES.has(value29)) return;
      if (!handler3(response7)) return;
      handler8();
    },
    subscribeProxyMigrationUpdates2 = subscribeProxyMigrationUpdates((options4 = {}) => {
      const enabled10 = handler4(options4);
      if (!enabled10) {
        handler5(options4);
        return;
      }
      handler12(enabled10, options4);
    }),
    handler15 = (value31) => {
      if (config || !enabled5) return;
      const box6 = normalizeViewport(value31?.viewport),
        enabled11 = box6.zoom <= LOW_ZOOM_VIDEO_WARMUP_THRESHOLD;
      if (!enabled11) {
        (run(), handler(), (scope = ''), (input = ''), (output = ''), (map3 = new Set()), handler10());
        return;
      }
      const canvasViewportVideoWarmupSignature = buildCanvasViewportVideoWarmupSignature(value31);
      if (canvasViewportVideoWarmupSignature === scope) return;
      const canvasViewportVideoWarmupScopeSignature = buildCanvasViewportVideoWarmupScopeSignature(value31),
        value32 = canvasViewportVideoWarmupScopeSignature !== input;
      ((scope = canvasViewportVideoWarmupSignature),
        (input = canvasViewportVideoWarmupScopeSignature),
        run());
      value32 && handler();
      const value33 = () => {
        timer = null;
        if (config || !enabled5) return;
        const nodes3 = readStoreSnapshot(store2),
          box7 = normalizeViewport(nodes3.viewport);
        if (box7.zoom > LOW_ZOOM_VIDEO_WARMUP_THRESHOLD) {
          scope = '';
          return;
        }
        if (buildCanvasViewportVideoWarmupSignature(nodes3) !== canvasViewportVideoWarmupSignature) return;
        if (handler13(box7)) {
          ((timer = setTimer(value33, payload)), timer?.unref?.());
          return;
        }
        const visibleLegacySourceVideoNodeIds = collectVisibleLegacySourceVideoNodeIds({
          nodes: nodes3.nodes,
          viewport: nodes3.viewport,
          containerEl: containerEl3,
          isLegacySourceVideo: isLegacySourceVideo,
          buildProxyPromotionPatch: buildProxyPromotionPatch,
        });
        ((output = canvasViewportVideoWarmupScopeSignature),
          (map3 = new Set(visibleLegacySourceVideoNodeIds)),
          handler10());
        const map4 = new Set(nodes3.selectedNodeIds || []),
          value34 = {},
          nodeIds2 = [];
        for (const value35 of visibleLegacySourceVideoNodeIds) {
          const proxyPromotionPatch = buildProxyPromotionPatch(nodes3.nodes?.[value35]);
          if (proxyPromotionPatch) {
            if (!map4.has(value35)) value34[value35] = proxyPromotionPatch;
            continue;
          }
          nodeIds2.push(value35);
        }
        const list2 = Object.keys(value34);
        if (list2.length > 0) {
          if (typeof store2.updateNodesData === 'function') store2.updateNodesData(value34);
          else
            for (const value36 of list2) {
              store2.updateNodeData?.(value36, value34[value36]);
            }
        }
        const nodes4 = readStoreSnapshot(store2);
        (syncWarmup({
          canvas: {
            nodes: nodes4.nodes || {},
            viewport: nodes4.viewport,
            selectedNodeIds: nodes4.selectedNodeIds,
          },
          containerEl: containerEl3,
        }),
          (queuedCount = sortProxyMigrationNodeIdsByPriority({
            nodeIds: nodeIds2,
            nodes: nodes4.nodes,
            selectedNodeIds: nodes4.selectedNodeIds,
            viewport: nodes4.viewport,
            containerEl: containerEl3,
          }).filter((value37) => !map.has(value37))),
          (enabled3 = canvasViewportVideoWarmupScopeSignature),
          (enabled4 = box7),
          handler14(canvasViewportVideoWarmupScopeSignature, box7));
      };
      ((timer = setTimer(value33, payload)), timer?.unref?.());
    };
  let value38 = () => {};
  if (typeof store2.subscribeSelector === 'function')
    value38 = store2.subscribeSelector(
      (viewport6) => ({
        viewport: viewport6.viewport,
        selectedNodeIds: viewport6.selectedNodeIds,
        _sourceVideoRev: viewport6._sourceVideoRev,
        _nodeGeometryRev: viewport6._nodeGeometryRev,
      }),
      () => handler15(readStoreSnapshot(store2)),
      {
        isEqual: (value39, value40) =>
          value39?.viewport === value40?.viewport &&
          value39?.selectedNodeIds === value40?.selectedNodeIds &&
          value39?._sourceVideoRev === value40?._sourceVideoRev &&
          value39?._nodeGeometryRev === value40?._nodeGeometryRev,
      },
    );
  else
    typeof store2.subscribeRaw === 'function'
      ? (value38 = store2.subscribeRaw(handler15))
      : handler15(readStoreSnapshot(store2));
  const value41 = () => {
    if (config) return;
    ((config = true),
      run(),
      handler(),
      map.clear(),
      map2.clear(),
      subscribeProxyMigrationUpdates2?.(),
      value38?.(),
      clearWarmup());
  };
  return (
    (value41.setPresentationActive = (value42) => {
      if (config || enabled5 === (value42 === true)) return;
      ((enabled5 = value42 === true), run(), handler(), (scope = ''));
      if (enabled5) handler15(readStoreSnapshot(store2));
      else clearWarmup();
    }),
    value41
  );
}
