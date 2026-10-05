import { hasRendererPriorityMediaWork } from './rendererPriorityMediaWork.js';
import { buildRendererScenePlan } from './rendererScenePlan.js';
import {
  getCachedRendererSpatialIndex,
  queryRendererSpatialIndexIds,
  screenViewportToWorldBounds,
} from './rendererSpatialIndex.js';
import { RENDERER_VIRTUALIZATION_CONFIG } from './rendererVirtualization.js';
const PRIORITY_MEDIA_VIEWPORT_PADDING = 200;
function resolveNodeCount(value, item, key) {
  if (Number['isFinite'](key)) return Number(key);
  if (Number['isFinite'](value?.['_nodeCount'])) return Number(value['_nodeCount']);
  return Object['keys'](item || {})['length'];
}
function resolveGeometryRev(index, result, data) {
  if (Number['isFinite'](data)) return Number(data);
  if (Number['isFinite'](index?.['_nodeGeometryRev'])) return Number(index['_nodeGeometryRev']);
  if (Number['isFinite'](index?.['_persistRev'])) return Number(index['_persistRev']);
  return result;
}
function normalizeContainerRect(box) {
  return Object['freeze']({
    width: Number['isFinite'](box?.['width']) ? box['width'] : 0,
    height: Number['isFinite'](box?.['height']) ? box['height'] : 0,
  });
}
export function createRendererFramePlan({
  snapshot: snapshot = null,
  nodes: nodes = snapshot?.['nodes'] || {},
  viewport: viewport = snapshot?.['viewport'] || { x: 0, y: 0, zoom: 1 },
  containerRect: containerRect,
  nodeCount: nodeCount,
  geometryRev: geometryRev,
} = {}) {
  const nodeCount2 = resolveNodeCount(snapshot, nodes, nodeCount),
    geometryRev2 = resolveGeometryRev(snapshot, nodeCount2, geometryRev),
    containerWidth = normalizeContainerRect(containerRect);
  let enabled = false,
    args = null,
    enabled2 = false,
    hasRendererPriorityMediaWork2 = false;
  function getSpatialIndex() {
    if (!enabled) {
      args = getCachedRendererSpatialIndex(nodes, {
        geometryRev: geometryRev2,
        nodeCount: nodeCount2,
        denseNodeCount: RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount'],
      });
      if (args) args = { ...args, frameQueryCache: new Map() };
      enabled = true;
    }
    return args;
  }
  function candidateNodeIds() {
    const enabled3 = getSpatialIndex();
    if (!enabled3) return undefined;
    return queryRendererSpatialIndexIds(
      enabled3,
      screenViewportToWorldBounds({
        viewport: viewport,
        containerWidth: containerWidth['width'],
        containerHeight: containerWidth['height'],
        padding: PRIORITY_MEDIA_VIEWPORT_PADDING,
      }),
    );
  }
  function hasPriorityMediaWork({ needed: needed = true } = {}) {
    if (!needed) return false;
    return (
      !enabled2 &&
        ((hasRendererPriorityMediaWork2 = hasRendererPriorityMediaWork({
          nodes: nodes,
          selectedNodeIds: snapshot?.['selectedNodeIds'],
          connOverlay: snapshot?.['connOverlay'],
          pickConnectMode: snapshot?.['pickConnectMode'],
          viewport: viewport,
          containerWidth: containerWidth['width'],
          containerHeight: containerWidth['height'],
          viewportPadding: PRIORITY_MEDIA_VIEWPORT_PADDING,
          candidateNodeIds: candidateNodeIds(),
        })),
        (enabled2 = true)),
      hasRendererPriorityMediaWork2
    );
  }
  return Object['freeze']({
    nodeCount: nodeCount2,
    viewport: viewport,
    containerRect: containerWidth,
    getSpatialIndex: getSpatialIndex,
    hasPriorityMediaWork: hasPriorityMediaWork,
    buildScenePlan(args2 = {}) {
      return buildRendererScenePlan({
        ...args2,
        nodes: nodes,
        spatialIndex: getSpatialIndex(),
        viewport: viewport,
        containerRect: containerWidth,
      });
    },
  });
}
