import {
  MANY_EDGES_THRESHOLD,
  queryEdgeVisibilityIndex,
  shouldRenderAllEdgesAtLowZoom,
} from './rendererEdgeVisibilityIndex.js';
import { screenViewportToWorldBounds } from './rendererSpatialIndex.js';
import { screenToWorld } from './math.js';
import { createEdgeHitSpatialIndex } from './rendererEdgeHitIndex.js';
import {
  buildConnectionPathGeometry,
  normalizeConnectionLineStyle,
  resolveConnectionEndpoints,
} from './edgePathGeometry.js';
const SVG_NS = 'http://www.w3.org/2000/svg',
  EDGE_VIEWPORT_PADDING = 200;
export const DEFAULT_EDGE_POOL_BUCKET_COUNT = 8;
function normalizeNumber(value, item = 0) {
  const key = Number(value);
  return Number['isFinite'](key) ? key : item;
}
function normalizeBucketCount(index) {
  return Math['max'](1, Math['floor'](normalizeNumber(index, DEFAULT_EDGE_POOL_BUCKET_COUNT)));
}
export function resolveEdgePoolBucketIndex(result, data = DEFAULT_EDGE_POOL_BUCKET_COUNT) {
  const bucketCount2 = normalizeBucketCount(data),
    list = String(result || '');
  let target = 0x811c9dc5;
  for (let source = 0; source < list['length']; source += 1) {
    ((target ^= list['charCodeAt'](source)), (target = Math['imul'](target, 0x1000193)));
  }
  return (target >>> 0) % bucketCount2;
}
export function buildEdgePathGeometry(enabled, next, current = null, style = 'curve') {
  if (!enabled?.['id']) return null;
  const sourceWidth = next?.[enabled['sourceId']],
    targetWidth = next?.[enabled['targetId']];
  if (!sourceWidth || !targetWidth) return null;
  const map = current?.['movedNodeIds'] instanceof Set ? current['movedNodeIds'] : null,
    number = normalizeNumber(current?.['dx']),
    number2 = normalizeNumber(current?.['dy']),
    entry = map?.['has'](enabled['sourceId']) ? number : 0,
    record = map?.['has'](enabled['sourceId']) ? number2 : 0,
    payload = map?.['has'](enabled['targetId']) ? number : 0,
    handle = map?.['has'](enabled['targetId']) ? number2 : 0,
    sourceX = normalizeNumber(sourceWidth['x']) + entry,
    sourceY = normalizeNumber(sourceWidth['y']) + record,
    targetX = normalizeNumber(targetWidth['x']) + payload,
    targetY = normalizeNumber(targetWidth['y']) + handle,
    args = resolveConnectionEndpoints({
      sourceX: sourceX,
      sourceY: sourceY,
      sourceWidth: sourceWidth['width'],
      sourceHeight: sourceWidth['height'],
      targetX: targetX,
      targetY: targetY,
      targetWidth: targetWidth['width'],
      targetHeight: targetWidth['height'],
    });
  return buildConnectionPathGeometry({ ...args, style: style });
}
export function resolveEdgeVisualOwner({
  poolingEnabled: poolingEnabled = false,
  edge: edge,
  relatedEdgeIds: relatedEdgeIds2,
  movedNodeIds: movedNodeIds,
  forcedDynamicEdgeIds: forcedDynamicEdgeIds,
} = {}) {
  if (!poolingEnabled || !edge?.['id']) return 'individual';
  if (relatedEdgeIds2?.['has']?.(edge['id'])) return 'individual';
  if (forcedDynamicEdgeIds?.['has']?.(edge['id'])) return 'individual';
  if (movedNodeIds?.['has']?.(edge['sourceId']) || movedNodeIds?.['has']?.(edge['targetId']))
    return 'individual';
  return 'pooled';
}
export function buildPooledEdgeVisualBuckets(
  state,
  { bucketCount: bucketCount = DEFAULT_EDGE_POOL_BUCKET_COUNT } = {},
) {
  const length = normalizeBucketCount(bucketCount),
    list2 = Array['from']({ length: length }, (config, index2) => ({
      index: index2,
      edgeIds: [],
      dParts: [],
    }));
  for (const enabled2 of state || []) {
    if (enabled2?.['owner'] !== 'pooled' || !enabled2['edgeId'] || !enabled2['d']) continue;
    const scope = list2[resolveEdgePoolBucketIndex(enabled2['edgeId'], length)];
    (scope['edgeIds']['push'](enabled2['edgeId']), scope['dParts']['push'](enabled2['d']));
  }
  return list2['map']((index3) => ({
    index: index3['index'],
    edgeIds: index3['edgeIds'],
    edgeCount: index3['edgeIds']['length'],
    d: index3['dParts']['join'](' '),
  }));
}
function isEdgeVisible(enabled3, box, input, output, value2) {
  if (!enabled3) return false;
  if (value2) return true;
  const number3 = normalizeNumber(box?.['zoom'], 1),
    number4 = normalizeNumber(box?.['x']),
    number5 = normalizeNumber(box?.['y']),
    value3 = enabled3['startX'] * number3 + number4,
    value4 = enabled3['startY'] * number3 + number5,
    value5 = enabled3['endX'] * number3 + number4,
    value6 = enabled3['endY'] * number3 + number5;
  return (
    Math['max'](value3, value5) > -EDGE_VIEWPORT_PADDING &&
    Math['min'](value3, value5) < input + EDGE_VIEWPORT_PADDING &&
    Math['max'](value4, value6) > -EDGE_VIEWPORT_PADDING &&
    Math['min'](value4, value6) < output + EDGE_VIEWPORT_PADDING
  );
}
export function createRendererEdgeLayer({
  createHitSpatialIndex: createHitSpatialIndex = createEdgeHitSpatialIndex,
  getContainerSize: getContainerSize,
  manyEdgesThreshold: manyEdgesThreshold = MANY_EDGES_THRESHOLD,
  nowMs: nowMs = () =>
    typeof performance !== 'undefined' && typeof performance['now'] === 'function'
      ? performance['now']()
      : Date['now'](),
  poolBucketCount: poolBucketCount = DEFAULT_EDGE_POOL_BUCKET_COUNT,
  recordRedrawSample: recordRedrawSample = () => {},
} = {}) {
  const length2 = normalizeBucketCount(poolBucketCount),
    cacheSize = new Map(),
    forcedDynamicEdgeIds2 = new Set(),
    value7 = Array['from']({ length: length2 }, () => new Map()),
    el = createHitSpatialIndex(),
    map2 = new Set(),
    pooledPathCount = Array['from']({ length: length2 }, () => null);
  let el2 = null,
    el3 = null,
    el4 = null,
    el5 = null,
    interactionVisualCount = null,
    box2 = { x: 0, y: 0, zoom: 1 },
    poolingEnabled2 = false,
    value8 = '',
    value9 = '',
    pooledPathWriteCount = 0;
  function run() {
    return el2?.['ownerDocument'] || globalThis['document'];
  }
  function run2(enabled4) {
    if (!enabled4 || el2 === enabled4) return;
    (clearRenderedEdges(el2), (el2 = enabled4));
  }
  function run3() {
    if (!el2 || !poolingEnabled2) return null;
    (!el3 || el3['parentNode'] !== el2) &&
      ((el3 = run()['createElementNS'](SVG_NS, 'g')),
      (el3['id'] = 'v2-edge-pool'),
      el3['setAttribute']('class', 'connection-pool'),
      el3['setAttribute']('data-edge-visual-layer', 'pooled'),
      el2['prepend'](el3));
    for (let value10 = 0; value10 < length2; value10 += 1) {
      let el6 = pooledPathCount[value10];
      if (el6 && el6['parentNode'] === el3) continue;
      ((el6 = run()['createElementNS'](SVG_NS, 'path')),
        (el6['id'] = 'v2-edge-pool-' + value10),
        el6['setAttribute']('class', 'connection-main connection-pooled-main'),
        el6['setAttribute']('data-edge-pool-bucket', String(value10)),
        el6['setAttribute']('d', ''),
        el3['appendChild'](el6),
        (pooledPathCount[value10] = el6));
    }
    return el3;
  }
  function run4() {
    (el3?.['remove']?.(), (el3 = null));
    for (let value11 = 0; value11 < pooledPathCount['length']; value11 += 1) {
      pooledPathCount[value11] = null;
    }
  }
  function run5(value12) {
    const value13 = value12 === true;
    if (poolingEnabled2 === value13) return;
    ((poolingEnabled2 = value13), el['clear']());
    for (const map3 of value7) map3['clear']();
    map2['clear']();
    if (poolingEnabled2) {
      run3();
      for (let value14 = 0; value14 < length2; value14 += 1) {
        map2['add'](value14);
      }
    } else run4();
  }
  function run6(value15, value16, value17) {
    const edgePoolBucketIndex = resolveEdgePoolBucketIndex(value15, length2),
      map4 = value7[edgePoolBucketIndex],
      value18 = map4['get'](value15);
    if (value17) {
      if (value18 === value16) return false;
      map4['set'](value15, value16);
    } else {
      if (!map4['has'](value15)) return false;
      map4['delete'](value15);
    }
    return (map2['add'](edgePoolBucketIndex), true);
  }
  function run7() {
    if (!poolingEnabled2 || map2['size'] === 0) return 0;
    run3();
    let value19 = 0;
    for (const value20 of map2) {
      const el7 = pooledPathCount[value20];
      if (!el7) continue;
      const map5 = value7[value20],
        value21 = Array['from'](map5['values']())['join'](' ');
      (el7['getAttribute']('d') !== value21 &&
        (el7['setAttribute']('d', value21), (pooledPathWriteCount += 1), (value19 += 1)),
        el7['setAttribute']('data-pooled-edge-count', String(map5['size'])));
    }
    return (map2['clear'](), value19);
  }
  function run8(edgeId) {
    let cache = cacheSize['get'](edgeId);
    if (cache) return { cache: cache, created: false };
    return (
      (cache = {
        edgeId: edgeId,
        groupEl: null,
        hoverPath: null,
        pathEl: null,
        highlighted: null,
        pooled: false,
        d: '',
        geometry: null,
        geometryCacheKey: '',
        order: 0,
      }),
      cacheSize['set'](edgeId, cache),
      { cache: cache, created: true }
    );
  }
  function run9(enabled5) {
    if (!enabled5) return null;
    if (enabled5['groupEl']?.['parentNode'] !== el2) {
      const el8 = run()['createElementNS'](SVG_NS, 'g');
      ((el8['id'] = 'edge-group-' + enabled5['edgeId']),
        el8['setAttribute']('class', 'connection-group'),
        el8['setAttribute']('data-conn-id', enabled5['edgeId']));
      const el9 = run()['createElementNS'](SVG_NS, 'path');
      el9['setAttribute']('class', 'connection-bg');
      if (enabled5['d']) el9['setAttribute']('d', enabled5['d']);
      (el8['appendChild'](el9),
        el2['appendChild'](el8),
        (enabled5['groupEl'] = el8),
        (enabled5['hoverPath'] = el9));
    }
    return enabled5['groupEl'];
  }
  function run10(value22) {
    run9(value22);
    if (value22?.['pathEl']?.['parentNode'] === value22['groupEl']) return value22['pathEl'];
    const el10 = run()['createElementNS'](SVG_NS, 'path');
    el10['setAttribute']('class', 'connection-main');
    if (value22?.['d']) el10['setAttribute']('d', value22['d']);
    return (value22['groupEl']['appendChild'](el10), (value22['pathEl'] = el10), el10);
  }
  function run11(enabled6) {
    if (!enabled6) return false;
    const value23 = enabled6['groupEl']?.['isConnected'] === true;
    return (
      enabled6['groupEl']?.['remove']?.(),
      (enabled6['groupEl'] = null),
      (enabled6['hoverPath'] = null),
      (enabled6['pathEl'] = null),
      (enabled6['highlighted'] = null),
      value23
    );
  }
  function run12(enabled7, enabled8) {
    if (!enabled7?.['groupEl']?.['classList']) return;
    const enabled9 = enabled7['groupEl']['classList']['contains']('connection-highlighted');
    if (enabled8 && !enabled9) enabled7['groupEl']['classList']['add']('connection-highlighted');
    else !enabled8 && enabled9 && enabled7['groupEl']['classList']['remove']('connection-highlighted');
    enabled7['highlighted'] = enabled8;
  }
  function run13(value24, edgeId2, geometry, value25, map6, order = value24?.['order'] || 0, value26 = '') {
    const value27 = value25 === 'pooled',
      enabled10 = value24['pooled'],
      value28 = value24['order'],
      value29 = value24['d'] !== geometry['d'];
    ((value24['d'] = geometry['d']),
      (value24['geometry'] = geometry),
      (value24['geometryCacheKey'] = value26),
      (value24['order'] = order));
    if (value27)
      (run11(value24),
        run6(edgeId2['id'], geometry['d'], true),
        (value29 || !enabled10 || value28 !== order) &&
          el['upsert']({ edgeId: edgeId2['id'], geometry: geometry, order: order }));
    else {
      if (enabled10) el['remove'](edgeId2['id']);
      (run6(edgeId2['id'], geometry['d'], false),
        run9(value24),
        run12(value24, !!map6?.['has']?.(edgeId2['id'])));
      value24['hoverPath']['getAttribute']('d') !== geometry['d'] &&
        value24['hoverPath']['setAttribute']('d', geometry['d']);
      const el11 = run10(value24);
      el11['getAttribute']('d') !== geometry['d'] && el11['setAttribute']('d', geometry['d']);
    }
    return ((value24['pooled'] = value27), value29);
  }
  function run14(value30) {
    const enabled11 = cacheSize['get'](value30);
    if (!enabled11) return false;
    (el['remove'](value30),
      run6(value30, enabled11['d'], false),
      enabled11['groupEl']?.['remove']?.(),
      cacheSize['delete'](value30),
      forcedDynamicEdgeIds2['delete'](value30));
    if (value8 === value30) value8 = '';
    if (value9 === value30) value9 = '';
    return true;
  }
  function run15() {
    if (!el2) return null;
    if (el4?.['parentNode'] === el2) return el4;
    return (
      (el4 = run()['createElementNS'](SVG_NS, 'g')),
      (el4['id'] = 'v2-edge-interaction-group'),
      el4['setAttribute']('class', 'connection-group connection-interaction-group'),
      el4['setAttribute']('data-edge-visual-layer', 'interaction'),
      (el5 = run()['createElementNS'](SVG_NS, 'path')),
      el5['setAttribute']('class', 'connection-bg'),
      (interactionVisualCount = run()['createElementNS'](SVG_NS, 'path')),
      (interactionVisualCount['id'] = 'v2-edge-interaction-highlight'),
      interactionVisualCount['setAttribute']('class', 'connection-main connection-hover-main'),
      el4['appendChild'](el5),
      el4['appendChild'](interactionVisualCount),
      el2['appendChild'](el4),
      el4
    );
  }
  function run16() {
    (el4?.['remove']?.(), (el4 = null), (el5 = null), (interactionVisualCount = null));
  }
  function run17() {
    const value31 = value9 || value8,
      enabled12 = value31 ? cacheSize['get'](value31) : null;
    if (!poolingEnabled2 || !enabled12?.['pooled'] || !enabled12['d']) {
      run16();
      return;
    }
    const el12 = run15();
    (el12['setAttribute']('data-conn-id', value31),
      el5['setAttribute']('d', enabled12['d']),
      interactionVisualCount['setAttribute']('d', enabled12['d']));
  }
  function hitTestEdgeAtScreenPoint(value32, value33, value34 = 10) {
    if (!poolingEnabled2) return null;
    const value35 = Math['max'](0.01, normalizeNumber(box2?.['zoom'], 1)),
      box3 = screenToWorld(value32, value33, box2);
    return (
      el['hitTest'](box3['x'], box3['y'], Math['max'](1, normalizeNumber(value34, 10)) / value35)?.[
        'edgeId'
      ] || null
    );
  }
  function run18(value36, value37) {
    return (
      value37?.['containerSize'] ||
      getContainerSize?.(value36) || { containerW: 0, containerH: 0, layoutReadMs: 0 }
    );
  }
  function run19(value38, value39, value40) {
    recordRedrawSample(value38, Math['max'](0, nowMs() - value39), value40);
  }
  function renderPartial({
    svgEl: svgEl,
    edgeIds: edgeIds,
    edges: edges,
    nodes: nodes,
    viewport: viewport,
    containerEl: containerEl,
    dragOffsetCtx: dragOffsetCtx = null,
    relatedEdgeIds: relatedEdgeIds = null,
    options: options = {},
  } = {}) {
    run2(svgEl);
    const nowMs2 = nowMs(),
      nowMs3 = nowMs(),
      value41 = viewport || { x: 0, y: 0, zoom: 1 },
      connectionLineStyle = normalizeConnectionLineStyle(options?.['pathStyle']);
    box2 = value41;
    const layoutReadMs2 = run18(containerEl, options),
      movedNodeIds2 = dragOffsetCtx?.['movedNodeIds'] instanceof Set ? dragOffsetCtx['movedNodeIds'] : null;
    let visibleEdgeCount = 0,
      createdCount = 0,
      removedCount = 0,
      reusedCount = 0,
      updatedCount = 0,
      skippedInvisibleCount = 0;
    for (const value42 of edgeIds || []) {
      const edge2 = edges?.[value42];
      if (!edge2) continue;
      const edgePathGeometry = buildEdgePathGeometry(edge2, nodes, dragOffsetCtx, connectionLineStyle);
      if (
        !isEdgeVisible(
          edgePathGeometry,
          value41,
          layoutReadMs2['containerW'],
          layoutReadMs2['containerH'],
          false,
        )
      ) {
        skippedInvisibleCount += 1;
        if (run14(value42)) removedCount += 1;
        continue;
      }
      visibleEdgeCount += 1;
      const value43 = run8(value42);
      if (value43['created']) createdCount += 1;
      else reusedCount += 1;
      const edgeVisualOwner = resolveEdgeVisualOwner({
        poolingEnabled: poolingEnabled2,
        edge: edge2,
        relatedEdgeIds: relatedEdgeIds,
        movedNodeIds: movedNodeIds2,
        forcedDynamicEdgeIds: forcedDynamicEdgeIds2,
      });
      run13(value43['cache'], edge2, edgePathGeometry, edgeVisualOwner, relatedEdgeIds) &&
        (updatedCount += 1);
    }
    const nowMs4 = nowMs(),
      count = run7();
    run17();
    const nowMs5 = nowMs(),
      mutated = updatedCount > 0 || createdCount > 0 || removedCount > 0 || count > 0;
    return (
      run19('partial', nowMs2, {
        reason: options?.['reason'] || 'drag-related-edges',
        edgeCount: edgeIds?.['size'] ?? Array['from'](edgeIds || [])['length'],
        visibleEdgeCount: visibleEdgeCount,
        updatedCount: updatedCount,
        createdCount: createdCount,
        removedCount: removedCount,
        reusedCount: reusedCount,
        skippedInvisibleCount: skippedInvisibleCount,
        cacheSize: cacheSize['size'],
        layoutReadMs: layoutReadMs2['layoutReadMs'] || 0,
        pathBuildMs: Math['max'](0, nowMs4 - nowMs3),
        domWriteMs: Math['max'](0, nowMs5 - nowMs4),
        clearedDom: false,
      }),
      { mutated: mutated }
    );
  }
  function renderFull({
    svgEl: svgEl2,
    edges: edges2,
    nodes: nodes2,
    viewport: viewport2,
    containerEl: containerEl2,
    dragOffsetCtx: dragOffsetCtx = null,
    relatedEdgeIds: relatedEdgeIds = null,
    edgeEntries: edgeEntries = null,
    reason: reason = 'steady',
    options: options = {},
  } = {}) {
    run2(svgEl2);
    const nowMs6 = nowMs(),
      nowMs7 = nowMs(),
      viewport3 = viewport2 || { x: 0, y: 0, zoom: 1 },
      connectionLineStyle2 = normalizeConnectionLineStyle(options?.['pathStyle']),
      value44 =
        !dragOffsetCtx &&
        typeof options?.['geometryRevisionKey'] === 'string' &&
        options['geometryRevisionKey']
          ? connectionLineStyle2 + ':' + options['geometryRevisionKey']
          : '';
    box2 = viewport3;
    const containerWidth = run18(containerEl2, options),
      edgeCount = Array['isArray'](edgeEntries) ? edgeEntries : Object['values'](edges2 || {});
    (run5(edgeCount['length'] >= manyEdgesThreshold), forcedDynamicEdgeIds2['clear']());
    const renderAllLowZoomEdges = shouldRenderAllEdgesAtLowZoom({
      edgeCount: edgeCount['length'],
      viewport: viewport3,
    });
    let list3 = edgeCount,
      value45 = null;
    if (options?.['edgeVisibilityIndex'] && !renderAllLowZoomEdges) {
      const worldBounds = screenViewportToWorldBounds({
          viewport: viewport3,
          containerWidth: containerWidth['containerW'],
          containerHeight: containerWidth['containerH'],
          padding: EDGE_VIEWPORT_PADDING,
        }),
        list4 = queryEdgeVisibilityIndex(options['edgeVisibilityIndex'], worldBounds);
      ((value45 = new Set(list4)),
        (list3 = list4['map'](
          (value46) => options['edgeVisibilityIndex']['edgesById']?.['get']?.(value46) || edges2?.[value46],
        )['filter'](Boolean)));
    }
    const movedNodeIds3 =
      dragOffsetCtx?.['movedNodeIds'] instanceof Set ? dragOffsetCtx['movedNodeIds'] : null;
    let visibleEdgeCount2 = 0,
      createdCount2 = 0,
      removedCount2 = 0,
      reusedCount2 = 0,
      updatedCount2 = 0,
      skippedInvisibleCount2 = 0;
    const map7 = value45;
    if (map7) {
      skippedInvisibleCount2 += Math['max'](0, edgeCount['length'] - (map7['size'] || list3['length']));
      for (const value47 of Array['from'](cacheSize['keys']())) {
        if (edges2?.[value47] && map7['has'](value47)) continue;
        if (run14(value47)) removedCount2 += 1;
      }
    }
    let value48 = 0;
    for (const edge3 of list3) {
      const value49 = options?.['edgeVisibilityIndex']?.['edgeOrder']?.['get']?.(edge3?.['id']),
        value50 = Number['isFinite'](value49) ? value49 : value48;
      value48 += 1;
      const value51 = cacheSize['get'](edge3?.['id']),
        value52 =
          value44 && value51?.['geometry'] && value51['geometryCacheKey'] === value44
            ? value51['geometry']
            : buildEdgePathGeometry(edge3, nodes2, dragOffsetCtx, connectionLineStyle2);
      if (
        !isEdgeVisible(
          value52,
          viewport3,
          containerWidth['containerW'],
          containerWidth['containerH'],
          renderAllLowZoomEdges,
        )
      ) {
        skippedInvisibleCount2 += 1;
        if (run14(edge3['id'])) removedCount2 += 1;
        continue;
      }
      visibleEdgeCount2 += 1;
      const value53 = run8(edge3['id']);
      if (value53['created']) createdCount2 += 1;
      else reusedCount2 += 1;
      const edgeVisualOwner2 = resolveEdgeVisualOwner({
        poolingEnabled: poolingEnabled2,
        edge: edge3,
        relatedEdgeIds: relatedEdgeIds,
        movedNodeIds: movedNodeIds3,
      });
      run13(value53['cache'], edge3, value52, edgeVisualOwner2, relatedEdgeIds, value50, value44) &&
        (updatedCount2 += 1);
    }
    const nowMs8 = nowMs();
    (run7(), run17());
    const nowMs9 = nowMs();
    return (
      run19('full', nowMs6, {
        reason: reason,
        edgeCount: edgeCount['length'],
        visibleEdgeCount: visibleEdgeCount2,
        updatedCount: updatedCount2,
        createdCount: createdCount2,
        removedCount: removedCount2,
        reusedCount: reusedCount2,
        skippedInvisibleCount: skippedInvisibleCount2,
        cacheSize: cacheSize['size'],
        layoutReadMs: containerWidth['layoutReadMs'] || 0,
        pathBuildMs: Math['max'](0, nowMs8 - nowMs7),
        domWriteMs: Math['max'](0, nowMs9 - nowMs8),
        clearedDom: options?.['clearedDom'] === true,
        renderAllLowZoomEdges: renderAllLowZoomEdges,
      }),
      { mutated: true }
    );
  }
  function prepareDynamicEdges(value54) {
    let value55 = false;
    for (const value56 of value54 || []) {
      const enabled13 = cacheSize['get'](value56);
      if (!enabled13) continue;
      forcedDynamicEdgeIds2['add'](value56);
      if (!enabled13['pooled']) continue;
      (el['remove'](value56),
        run6(value56, enabled13['d'], false),
        run10(enabled13),
        (enabled13['pooled'] = false),
        (value55 = true));
    }
    return (value55 && (run7(), run17()), value55);
  }
  function settleDynamicEdges({
    svgEl: svgEl3,
    edges: edges3,
    nodes: nodes3,
    viewport: viewport4,
    containerEl: containerEl3,
    relatedEdgeIds: relatedEdgeIds = null,
    options: options = {},
  } = {}) {
    const edgeIds2 = new Set(forcedDynamicEdgeIds2);
    if (edgeIds2['size'] === 0) return { mutated: false };
    return (
      forcedDynamicEdgeIds2['clear'](),
      renderPartial({
        svgEl: svgEl3,
        edgeIds: edgeIds2,
        edges: edges3,
        nodes: nodes3,
        viewport: viewport4,
        containerEl: containerEl3,
        dragOffsetCtx: null,
        relatedEdgeIds: relatedEdgeIds,
        options: options,
      })
    );
  }
  function setHoveredEdge(value57, value58) {
    const enabled14 = String(value57 || '');
    if (value58) value8 = enabled14;
    else {
      if (!enabled14 || value8 === enabled14) value8 = '';
    }
    run17();
  }
  function setActiveEdge(value59, value60) {
    const enabled15 = String(value59 || '');
    if (value60) value9 = enabled15;
    else {
      if (!enabled15 || value9 === enabled15) value9 = '';
    }
    run17();
  }
  function cleanupEdges(value61, value62) {
    run2(value61);
    let value63 = 0;
    for (const value64 of Array['from'](cacheSize['keys']())) {
      if (value62?.[value64]) continue;
      if (run14(value64)) value63 += 1;
    }
    run7();
    for (const el13 of el2?.['querySelectorAll']?.('path') || []) {
      if (el13['id'] === 'v2-draft-edge') continue;
      if (!el13['id']?.['startsWith']?.('edge-') && !el13['id']?.['startsWith']?.('hover-edge-')) continue;
      const value65 = el13['id']['replace']('hover-edge-', '')['replace']('edge-', '');
      if (value62?.[value65]) continue;
      (el13['remove'](), (value63 += 1));
    }
    return value63;
  }
  function clearRenderedEdges(value66 = el2) {
    if (value66 && el2 && value66 !== el2) return 0;
    let value67 = 0;
    for (const value68 of cacheSize['values']()) {
      if (value68['groupEl']?.['isConnected']) value67 += 1;
      value68['groupEl']?.['remove']?.();
    }
    (cacheSize['clear'](), forcedDynamicEdgeIds2['clear'](), el['clear']());
    for (const map8 of value7) map8['clear']();
    map2['clear']();
    if (el3?.['isConnected']) value67 += 1;
    run4();
    if (el4?.['isConnected']) value67 += 1;
    return (run16(), (poolingEnabled2 = false), (value8 = ''), (value9 = ''), value67);
  }
  function reset() {
    const value69 = clearRenderedEdges(el2);
    return ((el2 = null), (pooledPathWriteCount = 0), value69);
  }
  function getStats() {
    let pooledEdgeCount = 0;
    for (const value70 of value7) pooledEdgeCount += value70['size'];
    let individualVisualCount = 0,
      hitPathCount = 0;
    for (const value71 of cacheSize['values']()) {
      if (value71['pathEl']?.['isConnected']) individualVisualCount += 1;
      if (value71['hoverPath']?.['isConnected']) hitPathCount += 1;
    }
    if (el5?.['isConnected']) hitPathCount += 1;
    const hitIndexEdgeCount = el['getStats']();
    return {
      poolingEnabled: poolingEnabled2,
      pooledEdgeCount: pooledEdgeCount,
      pooledPathCount: pooledPathCount['filter']((el14) => el14?.['isConnected'])['length'],
      individualVisualCount: individualVisualCount,
      interactionVisualCount: interactionVisualCount?.['isConnected'] ? 1 : 0,
      hitPathCount: hitPathCount,
      hitIndexEdgeCount: hitIndexEdgeCount['edgeCount'],
      hitIndexCellCount: hitIndexEdgeCount['cellCount'],
      dynamicEdgeCount: forcedDynamicEdgeIds2['size'],
      pooledPathWriteCount: pooledPathWriteCount,
    };
  }
  return {
    cleanupEdges: cleanupEdges,
    clearRenderedEdges: clearRenderedEdges,
    getDomCache: () => cacheSize,
    getStats: getStats,
    hitTestEdgeAtScreenPoint: hitTestEdgeAtScreenPoint,
    prepareDynamicEdges: prepareDynamicEdges,
    renderFull: renderFull,
    renderPartial: renderPartial,
    reset: reset,
    setActiveEdge: setActiveEdge,
    setHoveredEdge: setHoveredEdge,
    settleDynamicEdges: settleDynamicEdges,
  };
}
