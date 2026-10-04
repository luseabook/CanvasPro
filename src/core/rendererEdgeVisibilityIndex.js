export const MANY_EDGES_THRESHOLD = 0x60;
export const EDGE_RENDER_ALL_LOW_ZOOM_THRESHOLD = 0.22;
export const EDGE_RENDER_ALL_MAX_EDGE_COUNT = 0x12c;
const EDGE_VISIBILITY_CELL_SIZE = 0x400,
  MAX_EDGE_VISIBILITY_CELLS = 0x40;
let cachedEdgeVisibilityIndexSignature = '',
  cachedEdgeVisibilityIndexNodes = null,
  cachedEdgeVisibilityIndex = null,
  cachedEdgeGeometrySignatureKey = '',
  cachedEdgeGeometrySignatureNodes = null,
  cachedEdgeGeometrySignature = '';
function formatEdgeSignatureNumber(value) {
  const item = Number(value);
  return Number['isFinite'](item) ? item['toFixed'](0x1) : '0.0';
}
function updateStringHash(key, index) {
  const list = String(index);
  let result = key >>> 0x0;
  for (let data = 0x0; data < list['length']; data += 0x1) {
    ((result ^= list['charCodeAt'](data)), (result = Math['imul'](result, 0x1000193) >>> 0x0));
  }
  return result;
}
function appendSortedSetSignature(list2, options, target) {
  if (!(target instanceof Set) || target['size'] === 0x0) {
    list2['push'](options + ':');
    return;
  }
  list2['push'](options + ':' + Array['from'](target)['sort']()['join'](','));
}
function normalizeEdgeLodZoom(box) {
  const count = Number(box?.['zoom']);
  return Number['isFinite'](count) && count > 0x0 ? count : 0x1;
}
export function shouldRenderAllEdgesAtLowZoom({
  edgeCount: edgeCount,
  viewport: viewport,
  maxEdgeCount: maxEdgeCount = EDGE_RENDER_ALL_MAX_EDGE_COUNT,
  lowZoomThreshold: lowZoomThreshold = EDGE_RENDER_ALL_LOW_ZOOM_THRESHOLD,
} = {}) {
  const count2 = Number(edgeCount) || 0x0;
  if (count2 <= 0x0 || count2 > maxEdgeCount) return ![];
  return normalizeEdgeLodZoom(viewport) <= lowZoomThreshold;
}
function edgeVisibilityCellCoord(source, next = EDGE_VISIBILITY_CELL_SIZE) {
  return Math['floor']((Number(source) || 0x0) / next);
}
function edgeVisibilityCellKey(current, entry) {
  return current + ':' + entry;
}
function pushEdgeVisibilityCell(map, record, payload, handle) {
  const edgeVisibilityCellKey2 = edgeVisibilityCellKey(record, payload);
  let list3 = map['get'](edgeVisibilityCellKey2);
  (!list3 && ((list3 = []), map['set'](edgeVisibilityCellKey2, list3)), list3['push'](handle));
}
function intersectsEdgeVisibilityBounds(state, config) {
  return (
    state['maxX'] > config['minX'] &&
    state['minX'] < config['maxX'] &&
    state['maxY'] > config['minY'] &&
    state['minY'] < config['maxY']
  );
}
function computeEdgeWorldBounds(enabled, scope) {
  if (!enabled?.['id']) return null;
  const box2 = scope?.[enabled['sourceId']],
    box3 = scope?.[enabled['targetId']];
  if (!box2 || !box3) return null;
  const input = Number(box2['x'] || 0x0),
    output = Number(box2['y'] || 0x0),
    value2 = Number(box3['x'] || 0x0),
    value3 = Number(box3['y'] || 0x0),
    value4 = input + Number(box2['width'] ?? 0x0),
    value5 = output + Number(box2['height'] ?? 0x0) / 0x2,
    value6 = value2,
    value7 = value3 + Number(box3['height'] ?? 0x0) / 0x2,
    value8 = Math['max'](Math['abs'](value6 - value4) * 0.5, 0x3c);
  return {
    minX: Math['min'](value4, value6, value4 + value8, value6 - value8),
    maxX: Math['max'](value4, value6, value4 + value8, value6 - value8),
    minY: Math['min'](value5, value7),
    maxY: Math['max'](value5, value7),
  };
}
export function createEdgeVisibilityIndex(value9, value10) {
  const cells = new Map(),
    spanningEdgeIds = new Set(),
    edgeBounds = new Map(),
    edgesById = new Map(),
    edgeOrder = new Map();
  let value11 = 0x0;
  for (const value12 of value9 || []) {
    const enabled2 = String(value12?.['id'] || '')['trim']();
    if (!enabled2) continue;
    const edgeWorldBounds = computeEdgeWorldBounds(value12, value10);
    if (!edgeWorldBounds) continue;
    (edgeBounds['set'](enabled2, edgeWorldBounds),
      edgesById['set'](enabled2, value12),
      edgeOrder['set'](enabled2, value11),
      (value11 += 0x1));
    const edgeVisibilityCellCoord2 = edgeVisibilityCellCoord(edgeWorldBounds['minX']),
      edgeVisibilityCellCoord3 = edgeVisibilityCellCoord(edgeWorldBounds['maxX']),
      edgeVisibilityCellCoord4 = edgeVisibilityCellCoord(edgeWorldBounds['minY']),
      edgeVisibilityCellCoord5 = edgeVisibilityCellCoord(edgeWorldBounds['maxY']);
    if (
      (edgeVisibilityCellCoord3 - edgeVisibilityCellCoord2 + 0x1) *
        (edgeVisibilityCellCoord5 - edgeVisibilityCellCoord4 + 0x1) >
      MAX_EDGE_VISIBILITY_CELLS
    ) {
      spanningEdgeIds['add'](enabled2);
      continue;
    }
    for (let value13 = edgeVisibilityCellCoord2; value13 <= edgeVisibilityCellCoord3; value13 += 0x1) {
      for (let value14 = edgeVisibilityCellCoord4; value14 <= edgeVisibilityCellCoord5; value14 += 0x1) {
        pushEdgeVisibilityCell(cells, value13, value14, enabled2);
      }
    }
  }
  return {
    cellSize: EDGE_VISIBILITY_CELL_SIZE,
    cells: cells,
    spanningEdgeIds: spanningEdgeIds,
    edgeBounds: edgeBounds,
    edgesById: edgesById,
    edgeOrder: edgeOrder,
    edgeCount: edgeOrder['size'],
  };
}
export function clearCachedEdgeVisibilityIndex() {
  ((cachedEdgeVisibilityIndexSignature = ''),
    (cachedEdgeVisibilityIndexNodes = null),
    (cachedEdgeVisibilityIndex = null),
    (cachedEdgeGeometrySignatureKey = ''),
    (cachedEdgeGeometrySignatureNodes = null),
    (cachedEdgeGeometrySignature = ''));
}
export function getCachedEdgeGeometrySignature(
  list4,
  value15,
  { edgesRev: edgesRev = 0x0, geometryRev: geometryRev = 0x0 } = {},
) {
  const value16 = Array['isArray'](list4) ? list4['length'] : 0x0,
    value17 =
      value16 +
      ':' +
      (Number['isFinite'](edgesRev) ? edgesRev : 0x0) +
      ':' +
      (Number['isFinite'](geometryRev) ? geometryRev : 0x0);
  if (
    cachedEdgeGeometrySignature &&
    cachedEdgeGeometrySignatureKey === value17 &&
    cachedEdgeGeometrySignatureNodes === value15
  )
    return cachedEdgeGeometrySignature;
  const value18 = Number['isFinite'](edgesRev) ? edgesRev : 0x0,
    value19 = Number['isFinite'](geometryRev) ? geometryRev : 0x0;
  let updateStringHash2 = 0x811c9dc5;
  updateStringHash2 = updateStringHash(updateStringHash2, 'geom:' + value16 + ':' + value18 + ':' + value19);
  for (const enabled3 of list4 || []) {
    if (!enabled3?.['id']) continue;
    const box4 = value15?.[enabled3['sourceId']],
      box5 = value15?.[enabled3['targetId']];
    if (!box4 || !box5) {
      updateStringHash2 = updateStringHash(
        updateStringHash2,
        'e:' +
          enabled3['id'] +
          ':' +
          (enabled3['sourceId'] || '') +
          ':' +
          (enabled3['targetId'] || '') +
          ':missing',
      );
      continue;
    }
    const value20 = Number(box4['x'] || 0x0) + Number(box4['width'] ?? 0x0),
      value21 = Number(box4['y'] || 0x0) + Number(box4['height'] ?? 0x0) / 0x2,
      value22 = Number(box5['x'] || 0x0),
      value23 = Number(box5['y'] || 0x0) + Number(box5['height'] ?? 0x0) / 0x2;
    updateStringHash2 = updateStringHash(
      updateStringHash2,
      'e:' +
        enabled3['id'] +
        ':' +
        (enabled3['sourceId'] || '') +
        ':' +
        (enabled3['targetId'] || '') +
        ':' +
        formatEdgeSignatureNumber(value20) +
        ':' +
        formatEdgeSignatureNumber(value21) +
        ':' +
        formatEdgeSignatureNumber(value22) +
        ':' +
        formatEdgeSignatureNumber(value23),
    );
  }
  return (
    (cachedEdgeGeometrySignatureKey = value17),
    (cachedEdgeGeometrySignatureNodes = value15 || null),
    (cachedEdgeGeometrySignature =
      'geom:' + value16 + ':' + value18 + ':' + value19 + ':' + updateStringHash2['toString'](0x24)),
    cachedEdgeGeometrySignature
  );
}
export function getCachedEdgeVisibilityIndex(
  list5,
  value24,
  {
    edgesRev: edgesRev = 0x0,
    geometryRev: geometryRev = 0x0,
    threshold: threshold = MANY_EDGES_THRESHOLD,
    geometrySignature: geometrySignature = '',
  } = {},
) {
  const value25 = Array['isArray'](list5) ? list5['length'] : 0x0;
  if (value25 < threshold) return (clearCachedEdgeVisibilityIndex(), null);
  const value26 =
      typeof geometrySignature === 'string' && geometrySignature
        ? geometrySignature
        : String(Number['isFinite'](geometryRev) ? geometryRev : 0x0),
    value27 = value25 + ':' + (Number['isFinite'](edgesRev) ? edgesRev : 0x0) + ':' + value26;
  if (
    cachedEdgeVisibilityIndex &&
    cachedEdgeVisibilityIndexSignature === value27 &&
    cachedEdgeVisibilityIndexNodes === value24
  )
    return cachedEdgeVisibilityIndex;
  return (
    (cachedEdgeVisibilityIndex = createEdgeVisibilityIndex(list5, value24)),
    (cachedEdgeVisibilityIndexSignature = value27),
    (cachedEdgeVisibilityIndexNodes = value24 || null),
    cachedEdgeVisibilityIndex
  );
}
export function queryEdgeVisibilityIndex(enabled4, enabled5) {
  if (!enabled4 || !enabled5 || !(enabled4['cells'] instanceof Map)) return [];
  const edgeVisibilityCellCoord6 = edgeVisibilityCellCoord(enabled5['minX'], enabled4['cellSize']),
    edgeVisibilityCellCoord7 = edgeVisibilityCellCoord(enabled5['maxX'], enabled4['cellSize']),
    edgeVisibilityCellCoord8 = edgeVisibilityCellCoord(enabled5['minY'], enabled4['cellSize']),
    edgeVisibilityCellCoord9 = edgeVisibilityCellCoord(enabled5['maxY'], enabled4['cellSize']),
    map2 = new Set(),
    handler = (value28) => {
      if (map2['has'](value28)) return;
      const value29 = enabled4['edgeBounds']?.['get']?.(value28);
      if (value29 && intersectsEdgeVisibilityBounds(value29, enabled5)) map2['add'](value28);
    },
    value30 =
      (edgeVisibilityCellCoord7 - edgeVisibilityCellCoord6 + 0x1) *
      (edgeVisibilityCellCoord9 - edgeVisibilityCellCoord8 + 0x1);
  if (value30 > Math['max'](MAX_EDGE_VISIBILITY_CELLS, enabled4['cells']['size'])) {
    for (const value31 of enabled4['edgeBounds']['keys']()) handler(value31);
  } else {
    for (const value32 of enabled4['spanningEdgeIds'] || []) handler(value32);
    for (let value33 = edgeVisibilityCellCoord6; value33 <= edgeVisibilityCellCoord7; value33 += 0x1) {
      for (let value34 = edgeVisibilityCellCoord8; value34 <= edgeVisibilityCellCoord9; value34 += 0x1) {
        const list6 = enabled4['cells']['get'](edgeVisibilityCellKey(value33, value34));
        if (!list6 || list6['length'] === 0x0) continue;
        for (const value35 of list6) handler(value35);
      }
    }
  }
  return Array['from'](map2)['sort']((value36, value37) => {
    const value38 = enabled4['edgeOrder']?.['get']?.(value36) ?? Infinity,
      value39 = enabled4['edgeOrder']?.['get']?.(value37) ?? Infinity;
    return value38 - value39;
  });
}
export function buildFullEdgeRenderSignature({
  edgeEntries: edgeEntries,
  nodes: nodes,
  viewport: viewport2,
  dragOffsetCtx: dragOffsetCtx,
  relatedEdgeIds: relatedEdgeIds,
  containerW: containerW,
  containerH: containerH,
  edgesRev: edgesRev = 0x0,
  geometryRev: geometryRev = 0x0,
  threshold: threshold = MANY_EDGES_THRESHOLD,
  geometrySignature: geometrySignature = '',
  edgePathStyle: edgePathStyle = 'curve',
}) {
  const box6 = viewport2 || { x: 0x0, y: 0x0, zoom: 0x1 },
    map3 = dragOffsetCtx?.['movedNodeIds'] instanceof Set ? dragOffsetCtx['movedNodeIds'] : null,
    count3 = Number['isFinite'](dragOffsetCtx?.['dx']) ? dragOffsetCtx['dx'] : 0x0,
    count4 = Number['isFinite'](dragOffsetCtx?.['dy']) ? dragOffsetCtx['dy'] : 0x0,
    value40 = Array['isArray'](edgeEntries) ? edgeEntries['length'] : 0x0,
    enabled6 = (map3 && map3['size'] > 0x0) || count3 !== 0x0 || count4 !== 0x0,
    list7 = [
      'edge-full',
      'vp:' +
        formatEdgeSignatureNumber(box6['x']) +
        ':' +
        formatEdgeSignatureNumber(box6['y']) +
        ':' +
        formatEdgeSignatureNumber(box6['zoom'] || 0x1),
      'box:' + formatEdgeSignatureNumber(containerW) + ':' + formatEdgeSignatureNumber(containerH),
      'drag:' + formatEdgeSignatureNumber(count3) + ':' + formatEdgeSignatureNumber(count4),
      'path:' + String(edgePathStyle || 'curve'),
    ];
  (appendSortedSetSignature(list7, 'dragIds', map3),
    appendSortedSetSignature(list7, 'highlight', relatedEdgeIds));
  if (value40 >= threshold && !enabled6) {
    const value41 =
      typeof geometrySignature === 'string' && geometrySignature
        ? geometrySignature
        : getCachedEdgeGeometrySignature(edgeEntries, nodes, {
            edgesRev: edgesRev,
            geometryRev: geometryRev,
          });
    return (
      list7['push'](
        'compact:' + value40 + ':' + (Number['isFinite'](edgesRev) ? edgesRev : 0x0) + ':' + value41,
      ),
      list7['join']('|')
    );
  }
  for (const enabled7 of edgeEntries || []) {
    if (!enabled7?.['id']) continue;
    const box7 = nodes?.[enabled7['sourceId']],
      box8 = nodes?.[enabled7['targetId']];
    if (!box7 || !box8) {
      list7['push'](
        'e:' +
          enabled7['id'] +
          ':' +
          (enabled7['sourceId'] || '') +
          ':' +
          (enabled7['targetId'] || '') +
          ':missing',
      );
      continue;
    }
    const value42 = map3 && map3['has'](enabled7['sourceId']) ? count3 : 0x0,
      value43 = map3 && map3['has'](enabled7['sourceId']) ? count4 : 0x0,
      value44 = map3 && map3['has'](enabled7['targetId']) ? count3 : 0x0,
      value45 = map3 && map3['has'](enabled7['targetId']) ? count4 : 0x0,
      value46 = Number(box7['x'] || 0x0) + value42,
      value47 = Number(box7['y'] || 0x0) + value43,
      value48 = Number(box8['x'] || 0x0) + value44,
      value49 = Number(box8['y'] || 0x0) + value45,
      value50 = value46 + Number(box7['width'] ?? 0x0),
      value51 = value47 + Number(box7['height'] ?? 0x0) / 0x2,
      value52 = value48,
      value53 = value49 + Number(box8['height'] ?? 0x0) / 0x2;
    list7['push'](
      'e:' +
        enabled7['id'] +
        ':' +
        (enabled7['sourceId'] || '') +
        ':' +
        (enabled7['targetId'] || '') +
        ':' +
        formatEdgeSignatureNumber(value50) +
        ':' +
        formatEdgeSignatureNumber(value51) +
        ':' +
        formatEdgeSignatureNumber(value52) +
        ':' +
        formatEdgeSignatureNumber(value53),
    );
  }
  return list7['join']('|');
}
