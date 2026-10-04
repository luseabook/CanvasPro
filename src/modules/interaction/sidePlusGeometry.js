import { findClosestNode } from '../../core/math.js';
import { isNodeType } from '../registry.js';
import { createNodeGeometryOverlay } from '../../core/nodeGeometryOverlay.js';
import { readNodeGeometryPreviewEntries } from '../../core/nodeGeometryPreview.js';
export function createSidePlusGeometryOverlay(value, item) {
  const key = Object['create'](null);
  for (const [index, width] of readNodeGeometryPreviewEntries()) {
    Number['isFinite'](width['width']) &&
      Number['isFinite'](width['height']) &&
      (key[index] = { width: width['width'], height: width['height'] });
  }
  return (Object['assign'](key, item), createNodeGeometryOverlay(value, key));
}
export function createGroupSidePlusCandidateIdCache() {
  let result = null,
    data = -0x1,
    list = [];
  return {
    get(options, target) {
      const source = Number['isFinite'](target) ? target : -0x1;
      if (options === result && source === data) return list;
      ((result = options || null), (data = source), (list = []));
      for (const [next, current] of Object['entries'](options || {})) {
        if (!isNodeType(current, 'group')) continue;
        const entry = String(current?.['id'] || next || '')['trim']();
        if (entry) list['push'](entry);
      }
      return list;
    },
  };
}
function getClosestResultDistanceSq(record, payload, handle) {
  const state = payload - Number(record?.['screenRect']?.['cx'] || 0x0),
    config = handle - Number(record?.['screenRect']?.['cy'] || 0x0);
  return state * state + config * config;
}
function getSpatialNodeOrder(scope, input) {
  return scope?.['nodeRects']?.['get']?.(input)?.['order'] ?? Infinity;
}
export function findClosestNodeWithGeometryOverrides({
  screenX: screenX,
  screenY: screenY,
  nodes: nodes,
  geometryNodes: geometryNodes = nodes,
  overrideNodeIds: overrideNodeIds = [],
  viewport: viewport,
  spatialIndex: spatialIndex,
  ignoreGroup: ignoreGroup = ![],
} = {}) {
  const list2 = Array['isArray'](overrideNodeIds)
    ? overrideNodeIds['filter']((output) => !!geometryNodes?.[output])['sort'](
        (value2, value3) =>
          getSpatialNodeOrder(spatialIndex, value2) - getSpatialNodeOrder(spatialIndex, value3),
      )
    : [];
  if (list2['length'] === 0x0)
    return findClosestNode(screenX, screenY, nodes, viewport, ignoreGroup, {
      spatialIndex: spatialIndex,
    });
  const map = new Set(list2),
    closestNode = findClosestNode(screenX, screenY, nodes, viewport, ignoreGroup, {
      spatialIndex: spatialIndex,
      candidateFilter: (value4, value5) => !map['has'](value5),
    }),
    value6 = Object['create'](null);
  for (const value7 of list2) value6[value7] = geometryNodes[value7];
  const closestNode2 = findClosestNode(screenX, screenY, value6, viewport, ignoreGroup);
  if (!closestNode) return closestNode2;
  if (!closestNode2) return closestNode;
  const spatialNodeOrder = getSpatialNodeOrder(spatialIndex, closestNode['nodeId']),
    spatialNodeOrder2 = getSpatialNodeOrder(spatialIndex, closestNode2['nodeId']);
  if (closestNode['isInside'] && closestNode2['isInside'])
    return spatialNodeOrder2 < spatialNodeOrder ? closestNode2 : closestNode;
  if (closestNode['isInside'] !== closestNode2['isInside'])
    return closestNode2['isInside'] ? closestNode2 : closestNode;
  const closestResultDistanceSq = getClosestResultDistanceSq(closestNode, screenX, screenY),
    closestResultDistanceSq2 = getClosestResultDistanceSq(closestNode2, screenX, screenY);
  if (closestResultDistanceSq !== closestResultDistanceSq2)
    return closestResultDistanceSq2 < closestResultDistanceSq ? closestNode2 : closestNode;
  return spatialNodeOrder2 < spatialNodeOrder ? closestNode2 : closestNode;
}
