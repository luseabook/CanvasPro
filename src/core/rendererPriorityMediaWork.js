import { isNodeType } from '../modules/registry.js';
import {
  resolveCanvasAudioUrl,
  resolveCanvasVideoDisplayUrl,
  resolveCanvasVideoPosterUrl,
  resolveCanvasVideoUrl,
} from '../services/canvasMediaLocalService.js';
import {
  isNodeInsideViewportPadding,
  RENDERER_VIRTUALIZATION_CONFIG,
  resolveRendererLowZoomMountLimit,
} from './rendererVirtualization.js';
const PRIORITY_MEDIA_TYPES = Object.freeze([
    'source-video',
    'video',
    'ai-video',
    'source-audio',
    'audio',
    'ai-audio',
  ]),
  PRIORITY_VIDEO_TYPES = Object.freeze(['source-video', 'video', 'ai-video']);
function hasResolvedVideo(value) {
  if (!isNodeType(value, PRIORITY_VIDEO_TYPES)) return false;
  if (resolveCanvasVideoDisplayUrl(value)) return true;
  const list = Array.isArray(value?.videos) ? value.videos : [];
  return list.some((item) => !!resolveCanvasVideoDisplayUrl(item));
}
export function resolveRendererLowZoomRealVideoNodeIds({
  nodes: nodes,
  candidateNodeIds: candidateNodeIds,
  selectedNodeIds: selectedNodeIds,
  priorityNodeIds: priorityNodeIds,
  viewport: viewport,
  nodeCount: nodeCount = 0,
  containerWidth: containerWidth,
  containerHeight: containerHeight,
} = {}) {
  const map = new Set(),
    rendererLowZoomMountLimit = resolveRendererLowZoomMountLimit({
      viewport: viewport,
      nodeCount: nodeCount,
    });
  if (rendererLowZoomMountLimit <= 0) return map;
  const key = nodes && typeof nodes === 'object' ? nodes : {},
    map2 = candidateNodeIds instanceof Set ? candidateNodeIds : new Set(candidateNodeIds || []),
    index =
      selectedNodeIds instanceof Set
        ? Array.from(selectedNodeIds)
        : Array.isArray(selectedNodeIds)
          ? selectedNodeIds
          : [];
  for (const result of index) {
    const data = key[result];
    if (!map2.has(result) || !hasResolvedVideo(data)) continue;
    map.add(result);
  }
  const count = Number(containerWidth),
    count2 = Number(containerHeight);
  if (!(count > 0) || !(count2 > 0) || map.size >= rendererLowZoomMountLimit) return map;
  const options = priorityNodeIds instanceof Set ? priorityNodeIds : new Set(priorityNodeIds || []);
  for (const target of options) {
    if (map.has(target) || !map2.has(target)) continue;
    const source = key[target];
    if (!hasResolvedVideo(source) || !isNodeInsideViewportPadding(source, viewport, count, count2, 0))
      continue;
    map.add(target);
    if (map.size >= rendererLowZoomMountLimit) return map;
  }
  for (const next of map2) {
    if (map.has(next)) continue;
    const current = key[next];
    if (!hasResolvedVideo(current) || !isNodeInsideViewportPadding(current, viewport, count, count2, 0))
      continue;
    map.add(next);
    if (map.size >= rendererLowZoomMountLimit) break;
  }
  return map;
}
export function syncRendererPendingSourceVideoActivationIds({
  nodes: nodes2,
  sourceKeysByNodeId: sourceKeysByNodeId,
  pendingNodeIds: pendingNodeIds,
  isPresented: isPresented,
  scanNodes: scanNodes = true,
} = {}) {
  const entry = nodes2 && typeof nodes2 === 'object' ? nodes2 : {},
    map3 = sourceKeysByNodeId instanceof Map ? sourceKeysByNodeId : new Map(),
    map4 = pendingNodeIds instanceof Set ? pendingNodeIds : new Set();
  if (scanNodes !== false) {
    const map5 = new Set();
    for (const [enabled, record] of Object.entries(entry)) {
      if (!enabled || !isNodeType(record, 'source-video')) continue;
      map5.add(enabled);
      const enabled2 = String(resolveCanvasVideoUrl(record) || '').trim(),
        payload = String(map3.get(enabled) || '').trim();
      if (enabled2 && enabled2 !== payload) map4.add(enabled);
      else !enabled2 && map4.delete(enabled);
      map3.set(enabled, enabled2);
    }
    for (const handle of map3.keys()) {
      if (map5.has(handle)) continue;
      (map3.delete(handle), map4.delete(handle));
    }
  }
  if (typeof isPresented === 'function')
    for (const state of Array.from(map4)) {
      const enabled3 = String(map3.get(state) || '').trim();
      (!enabled3 || isPresented(state, enabled3) === true) && map4.delete(state);
    }
  return map4;
}
export function applyRendererLowZoomRealVideoCandidates(args, config) {
  if (!(config instanceof Set) || config.size === 0) return args;
  const mountCandidateIds = new Set(args?.mountCandidateIds),
    parkCandidateIds = new Set(args?.parkCandidateIds);
  for (const scope of config) {
    (mountCandidateIds.add(scope), parkCandidateIds.delete(scope));
  }
  return { ...args, mountCandidateIds: mountCandidateIds, parkCandidateIds: parkCandidateIds };
}
function hasResolvedPriorityMedia(input) {
  if (!isNodeType(input, PRIORITY_MEDIA_TYPES)) return false;
  if (isNodeType(input, ['source-audio', 'audio', 'ai-audio'])) return !!resolveCanvasAudioUrl(input);
  return hasResolvedVideo(input);
}
function collectActiveNodeIds({
  selectedNodeIds: selectedNodeIds2,
  connOverlay: connOverlay,
  pickConnectMode: pickConnectMode,
} = {}) {
  const output = new Set(
    selectedNodeIds2 instanceof Set
      ? selectedNodeIds2
      : Array.isArray(selectedNodeIds2)
        ? selectedNodeIds2
        : [],
  );
  return (
    [
      connOverlay?.srcId,
      connOverlay?.hoverId,
      pickConnectMode?.sourceNodeId,
      pickConnectMode?.srcId,
      pickConnectMode?.hoverNodeId,
      pickConnectMode?.hoverId,
    ].forEach((value2) => {
      if (value2) output.add(value2);
    }),
    output
  );
}
export function hasRendererPriorityMediaWork({
  nodes: nodes3,
  selectedNodeIds: selectedNodeIds3,
  connOverlay: connOverlay2,
  pickConnectMode: pickConnectMode2,
  viewport: viewport2,
  containerWidth: containerWidth2,
  containerHeight: containerHeight2,
  viewportPadding: viewportPadding = 200,
  candidateNodeIds: candidateNodeIds2,
} = {}) {
  const value3 = nodes3 && typeof nodes3 === 'object' ? nodes3 : {},
    activeNodeIds = collectActiveNodeIds({
      selectedNodeIds: selectedNodeIds3,
      connOverlay: connOverlay2,
      pickConnectMode: pickConnectMode2,
    });
  for (const value4 of activeNodeIds) {
    if (hasResolvedPriorityMedia(value3[value4])) return true;
  }
  const count3 = Number(containerWidth2),
    count4 = Number(containerHeight2);
  if (!viewport2 || !(count3 > 0) || !(count4 > 0)) return false;
  const run = (value5) =>
    hasResolvedPriorityMedia(value5) &&
    isNodeInsideViewportPadding(value5, viewport2, count3, count4, viewportPadding);
  if (candidateNodeIds2 != null && typeof candidateNodeIds2[Symbol.iterator] === 'function') {
    for (const value6 of candidateNodeIds2) {
      if (run(value3[value6])) return true;
    }
    return false;
  }
  return Object.values(value3).some(run);
}
export function shouldDeferInitialVideoMediaOnMount({
  node: node,
  nodeId: nodeId,
  isSelected: isSelected,
  isSelectionRelated: isSelectionRelated,
  dragTargets: dragTargets,
  nodeCount: nodeCount = 0,
  mountCandidateCount: mountCandidateCount = 0,
} = {}) {
  if (!nodeId || !isNodeType(node, ['source-video', 'video', 'ai-video'])) return false;
  if (isSelected || isSelectionRelated || dragTargets?.has?.(nodeId)) return false;
  return (
    Number(nodeCount || 0) >= RENDERER_VIRTUALIZATION_CONFIG.veryDenseNodeCount ||
    Number(mountCandidateCount || 0) >= 12
  );
}
export function shouldEagerPosterlessSourceVideoOnMount({
  node: node2,
  isVisibleVideoMediaNode: isVisibleVideoMediaNode,
} = {}) {
  if (!isVisibleVideoMediaNode || !isNodeType(node2, 'source-video')) return false;
  return !!resolveCanvasVideoUrl(node2) && !resolveCanvasVideoPosterUrl(node2);
}
export const __rendererPriorityMediaWorkForTest = { hasResolvedPriorityMedia: hasResolvedPriorityMedia };
