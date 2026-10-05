import {
  MANY_EDGES_THRESHOLD,
  createEdgeVisibilityIndex,
  queryEdgeVisibilityIndex,
} from './rendererEdgeVisibilityIndex.js';
import { createNodeGeometryOverlay } from './nodeGeometryOverlay.js';
const EDGE_CUT_BOUNDS_EPSILON = 0.001,
  EDGE_CUT_DEFAULT_NODE_WIDTH = 260,
  EDGE_CUT_DEFAULT_NODE_HEIGHT = 100;
export function resolveEdgeCutNodeGeometry(box) {
  if (!box) return null;
  return {
    x: box['x'],
    y: box['y'],
    width: box?.['width'] || EDGE_CUT_DEFAULT_NODE_WIDTH,
    height: box?.['height'] || EDGE_CUT_DEFAULT_NODE_HEIGHT,
  };
}
export function resolveEdgeCutSegment(value, item) {
  const box2 = resolveEdgeCutNodeGeometry(item?.[value?.['sourceId']]),
    box3 = resolveEdgeCutNodeGeometry(item?.[value?.['targetId']]);
  if (!box2 || !box3) return null;
  return {
    startX: box2['x'] + box2['width'],
    startY: box2['y'] + box2['height'] / 2,
    endX: box3['x'],
    endY: box3['y'] + box3['height'] / 2,
  };
}
export function createEdgeCutCandidateIndex(
  key,
  index,
  { threshold: threshold = MANY_EDGES_THRESHOLD } = {},
) {
  const list = [],
    list2 = [],
    result = Object['create'](null);
  for (const [data, args] of Object['entries'](key || {})) {
    const enabled = String(data || '');
    if (!enabled['trim']() || !args) continue;
    (list2['push'](enabled), list['push'](args['id'] === enabled ? args : { ...args, id: enabled }));
    for (const options of [args['sourceId'], args['targetId']]) {
      const enabled2 = index?.[options];
      if (!enabled2 || result[options]) continue;
      const box4 = resolveEdgeCutNodeGeometry(enabled2);
      (box4['width'] !== enabled2['width'] || box4['height'] !== enabled2['height']) &&
        (result[options] = { width: box4['width'], height: box4['height'] });
    }
  }
  const target = Math['max'](0, Number(threshold) || 0),
    source =
      list['length'] >= target
        ? createEdgeVisibilityIndex(list, createNodeGeometryOverlay(index, result))
        : null;
  return { edgeIds: list2, index: source };
}
export function createEdgeCutQueryBounds(next, current, entry, record, payload = EDGE_CUT_BOUNDS_EPSILON) {
  const enabled3 = [next, current, entry, record]['map'](Number);
  if (!enabled3['every'](Number['isFinite'])) return null;
  const [handle, state, config, scope] = enabled3,
    input = Math['max'](EDGE_CUT_BOUNDS_EPSILON, Number(payload) || 0);
  return {
    minX: Math['min'](handle, config) - input,
    maxX: Math['max'](handle, config) + input,
    minY: Math['min'](state, scope) - input,
    maxY: Math['max'](state, scope) + input,
  };
}
export function queryEdgeCutCandidateIds(enabled4, output, value2, value3, value4) {
  const value5 = Array['isArray'](enabled4?.['edgeIds']) ? enabled4['edgeIds'] : [];
  if (!enabled4?.['index']) return value5;
  const edgeCutQueryBounds = createEdgeCutQueryBounds(output, value2, value3, value4);
  if (!edgeCutQueryBounds) return value5;
  return queryEdgeVisibilityIndex(enabled4['index'], edgeCutQueryBounds);
}
