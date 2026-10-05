const DEFAULT_CELL_SIZE = 1024,
  DEFAULT_NODE_WIDTH = 160,
  DEFAULT_NODE_HEIGHT = 120;
let cachedSpatialIndexSignature = '',
  cachedSpatialIndex = null;
function finiteNumber(value, item = 0) {
  const key = Number(value);
  return Number.isFinite(key) ? key : item;
}
function normalizeNodeBounds(box) {
  const minX = finiteNumber(box?.x, 0),
    minY = finiteNumber(box?.y, 0),
    index = Math.max(1, finiteNumber(box?.width, DEFAULT_NODE_WIDTH)),
    result = Math.max(1, finiteNumber(box?.height, DEFAULT_NODE_HEIGHT));
  return { minX: minX, minY: minY, maxX: minX + index, maxY: minY + result };
}
function cellRangeForBounds(data, options) {
  return {
    minCellX: Math.floor(data.minX / options),
    maxCellX: Math.floor(data.maxX / options),
    minCellY: Math.floor(data.minY / options),
    maxCellY: Math.floor(data.maxY / options),
  };
}
function cellKey(target, source) {
  return target + ':' + source;
}
function intersectsBounds(next, current) {
  return (
    next.maxX > current.minX &&
    next.minX < current.maxX &&
    next.maxY > current.minY &&
    next.minY < current.maxY
  );
}
function getViewportWorldCenter(viewport, containerWidth, containerHeight) {
  const worldBounds = screenViewportToWorldBounds({
    viewport: viewport,
    containerWidth: containerWidth,
    containerHeight: containerHeight,
    padding: 0,
  });
  return { x: (worldBounds.minX + worldBounds.maxX) / 2, y: (worldBounds.minY + worldBounds.maxY) / 2 };
}
function getNodeDistanceSqToCenter(enabled, box2) {
  if (!enabled || !box2) return 0;
  const nodeBounds = normalizeNodeBounds(enabled),
    entry = (nodeBounds.minX + nodeBounds.maxX) / 2,
    record = (nodeBounds.minY + nodeBounds.maxY) / 2,
    payload = entry - box2.x,
    handle = record - box2.y;
  return payload * payload + handle * handle;
}
export function screenViewportToWorldBounds({
  viewport: viewport2,
  containerWidth: containerWidth2,
  containerHeight: containerHeight2,
  padding: padding = 0,
} = {}) {
  const state = Math.max(0.0001, finiteNumber(viewport2?.zoom, 1)),
    finiteNumber2 = finiteNumber(viewport2?.x, 0),
    finiteNumber3 = finiteNumber(viewport2?.y, 0),
    config = Math.max(1, finiteNumber(containerWidth2, 1)),
    scope = Math.max(1, finiteNumber(containerHeight2, 1)),
    input = Math.max(0, finiteNumber(padding, 0));
  return {
    minX: (-input - finiteNumber2) / state,
    minY: (-input - finiteNumber3) / state,
    maxX: (config + input - finiteNumber2) / state,
    maxY: (scope + input - finiteNumber3) / state,
  };
}
export function createRendererSpatialIndex(output, { cellSize: cellSize = DEFAULT_CELL_SIZE } = {}) {
  const value2 = Object.values(output || {}),
    cells = new Map(),
    nodesById = new Map(),
    nodeIds = new Set(),
    cellSize2 = Math.max(128, finiteNumber(cellSize, DEFAULT_CELL_SIZE));
  for (const node of value2) {
    const enabled2 = String(node?.id || '').trim();
    if (!enabled2) continue;
    const bounds = normalizeNodeBounds(node),
      cellRangeForBounds2 = cellRangeForBounds(bounds, cellSize2);
    (nodesById.set(enabled2, { node: node, bounds: bounds }), nodeIds.add(enabled2));
    for (let value3 = cellRangeForBounds2.minCellX; value3 <= cellRangeForBounds2.maxCellX; value3 += 1) {
      for (let value4 = cellRangeForBounds2.minCellY; value4 <= cellRangeForBounds2.maxCellY; value4 += 1) {
        const cellKey2 = cellKey(value3, value4);
        let enabled3 = cells.get(cellKey2);
        (!enabled3 && ((enabled3 = new Set()), cells.set(cellKey2, enabled3)), enabled3.add(enabled2));
      }
    }
  }
  return {
    cellSize: cellSize2,
    cells: cells,
    nodesById: nodesById,
    nodeIds: nodeIds,
    nodeCount: nodeIds.size,
  };
}
export function getRendererSpatialIndexNode(value5, value6) {
  const map = value5?.nodeSource;
  if (map instanceof Map) return map.get(value6);
  if (map && typeof map === 'object' && !Array.isArray(map)) return map[value6];
  return value5?.nodesById?.get?.(value6)?.node;
}
export function queryRendererSpatialIndex(enabled4, enabled5) {
  if (!enabled4 || !enabled5) return [];
  const cellRangeForBounds3 = cellRangeForBounds(enabled5, enabled4.cellSize || DEFAULT_CELL_SIZE),
    map2 = new Set(),
    list = [];
  for (let value7 = cellRangeForBounds3.minCellX; value7 <= cellRangeForBounds3.maxCellX; value7 += 1) {
    for (let value8 = cellRangeForBounds3.minCellY; value8 <= cellRangeForBounds3.maxCellY; value8 += 1) {
      const enabled6 = enabled4.cells?.get?.(cellKey(value7, value8));
      if (!enabled6) continue;
      for (const value9 of enabled6) {
        if (map2.has(value9)) continue;
        map2.add(value9);
        const enabled7 = enabled4.nodesById?.get?.(value9);
        if (!enabled7 || !intersectsBounds(enabled7.bounds, enabled5)) continue;
        list.push(enabled7.node);
      }
    }
  }
  return list;
}
export function queryRendererSpatialIndexIds(value10, value11) {
  return new Set(queryRendererSpatialIndex(value10, value11).map((item2) => item2.id));
}
export function clearRendererSpatialIndexCache() {
  ((cachedSpatialIndexSignature = ''), (cachedSpatialIndex = null));
}
export function getCachedRendererSpatialIndex(
  value12,
  { snapshotRev: snapshotRev, nodeCount: nodeCount, denseNodeCount: denseNodeCount = 80 } = {},
) {
  const value13 = Number.isFinite(nodeCount) ? nodeCount : Object.keys(value12 || {}).length;
  if (value13 < denseNodeCount) return (clearRendererSpatialIndexCache(), null);
  const value14 = (Number.isFinite(snapshotRev) ? snapshotRev : 0) + '|' + value13;
  if (cachedSpatialIndex && cachedSpatialIndexSignature === value14) return cachedSpatialIndex;
  return (
    (cachedSpatialIndex = createRendererSpatialIndex(value12)),
    (cachedSpatialIndexSignature = value14),
    cachedSpatialIndex
  );
}
export function collectVirtualizedRenderNodes({
  nodes: nodes,
  virtualizationResult: virtualizationResult,
  spatialIndex: spatialIndex,
  mountedNodeIds: mountedNodeIds,
  viewport: viewport3,
  containerWidth: containerWidth3,
  containerHeight: containerHeight3,
} = {}) {
  const list2 = Object.values(nodes || {});
  if (!spatialIndex) return list2;
  const value15 = new Set();
  for (const value16 of virtualizationResult?.mountCandidateIds || []) {
    value15.add(value16);
  }
  const value17 =
    mountedNodeIds instanceof Set ? mountedNodeIds : Array.isArray(mountedNodeIds) ? mountedNodeIds : [];
  for (const value18 of value17) {
    value15.add(value18);
  }
  const list3 = [];
  for (const value19 of value15) {
    const value20 = nodes?.[value19];
    if (value20?.id) list3.push(value20);
  }
  const enabled8 =
    viewport3 && Number.isFinite(Number(containerWidth3)) && Number.isFinite(Number(containerHeight3));
  if (!enabled8 || list3.length < 2) return list3;
  const viewportWorldCenter = getViewportWorldCenter(viewport3, containerWidth3, containerHeight3),
    map3 = virtualizationResult?.mountCandidateIds || new Set(),
    map4 = virtualizationResult?.keepAliveNodeIds || new Set(),
    map5 = new Map(list2.map((item3, value21) => [String(item3?.id || ''), value21]));
  return list3.sort((item4, value22) => {
    const value23 = String(item4?.id || ''),
      value24 = String(value22?.id || ''),
      value25 = map3.has(value23),
      value26 = map3.has(value24);
    if (value25 !== value26) return value25 ? -1 : 1;
    const value27 = map4.has(value23),
      value28 = map4.has(value24);
    if (value27 !== value28) return value27 ? -1 : 1;
    const center =
      getNodeDistanceSqToCenter(item4, viewportWorldCenter) -
      getNodeDistanceSqToCenter(value22, viewportWorldCenter);
    if (center !== 0) return center;
    return (map5.get(value23) ?? 0) - (map5.get(value24) ?? 0);
  });
}
