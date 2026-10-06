import { isNodeInsideViewportPadding } from './rendererVirtualization.js';
import {
  getRendererSpatialIndexNode,
  queryRendererSpatialIndexIds,
  screenViewportToWorldBounds,
} from './rendererSpatialIndex.js';
import { shouldShowGenerationBusyUi } from './generationTaskUiState.js';
import { calculateDenseLowZoomRasterStrength } from './rendererRasterProxyPolicy.js';
function toIdSet(value) {
  if (value instanceof Set) return new Set(value);
  if (Array.isArray(value)) return new Set(value);
  return new Set();
}
function getContainerSize(box) {
  return {
    width: Number.isFinite(box?.width) ? box.width : 0,
    height: Number.isFinite(box?.height) ? box.height : 0,
  };
}
function createSpatialNodeMapView(item, map) {
  const map2 = item?.nodesById;
  if (!(map2 instanceof Map)) return null;
  const run = (key) => {
    if (map instanceof Map) return map.get(key);
    if (map && typeof map === 'object' && !Array.isArray(map)) return map[key];
    return getRendererSpatialIndexNode(item, key);
  };
  return {
    get size() {
      return map2.size;
    },
    get(index) {
      return run(index);
    },
    has(result) {
      return map2.has(result);
    },
    keys() {
      return map2.keys();
    },
    *[Symbol.iterator]() {
      for (const [data] of map2) {
        yield [data, run(data)];
      }
    },
  };
}
function createNodeMap(list, options = null) {
  const spatialNodeMapView = createSpatialNodeMapView(options, list);
  if (spatialNodeMapView) return spatialNodeMapView;
  const map3 = new Map();
  let target = [];
  if (Array.isArray(list)) target = list.map((source) => [source?.id, source]);
  else {
    if (list instanceof Map) target = list.entries();
    else list && typeof list === 'object' && (target = Object.entries(list));
  }
  for (const [next, enabled] of target) {
    if (!enabled || typeof enabled !== 'object') continue;
    const current = enabled.id ?? next;
    if (current == null || current === '') continue;
    map3.set(current, enabled);
  }
  return map3;
}
function getSpatialNodeOrder(entry, record) {
  const payload = entry?.nodesById?.get?.(record)?.order;
  return Number.isFinite(payload) ? payload : 0;
}
function collectViewportRangeIds({
  nodeById: nodeById,
  spatialIndex: spatialIndex2,
  viewport: viewport2,
  width: width,
  height: height,
  padding: padding,
}) {
  if (!spatialIndex2)
    return new Set(
      [...nodeById.keys()].filter((handle) =>
        isNodeInsideViewportPadding(nodeById.get(handle), viewport2, width, height, padding),
      ),
    );
  const worldBounds = screenViewportToWorldBounds({
    viewport: viewport2,
    containerWidth: width,
    containerHeight: height,
    padding: padding,
  });
  return new Set(
    [...queryRendererSpatialIndexIds(spatialIndex2, worldBounds)].filter((state) =>
      isNodeInsideViewportPadding(nodeById.get(state), viewport2, width, height, padding),
    ),
  );
}
function smoothstep(config, scope, input) {
  if (input <= config) return 0;
  if (input >= scope) return 1;
  const output = (input - config) / (scope - config);
  return output * output * (3 - 2 * output);
}
function calculateScenePressure(value2, value3) {
  const smoothstep2 = smoothstep(24, 120, value2),
    smoothstep3 = smoothstep(80, 320, value3);
  return Math.max(smoothstep2, smoothstep3);
}
function calculateProjectedDetail(value4, map4, box2) {
  if (value4.size === 0) return 0;
  const value5 = Number.isFinite(box2?.zoom) && box2.zoom > 0 ? box2.zoom : 1;
  let value6 = 0,
    count = 0;
  for (const value7 of value4) {
    const box3 = map4.get(value7);
    if (!box3) continue;
    const value8 = Math.max(1, Number(box3.width) || 160) * value5,
      value9 = Math.max(1, Number(box3.height) || 120) * value5;
    ((value6 += value8 * value9), (count += 1));
  }
  if (count === 0) return 0;
  const value10 = value6 / count,
    value11 = Math.round(value10 * 1000000000) / 1000000000;
  return smoothstep(1200, 7200, value11);
}
function interpolate(value12, value13, value14) {
  return value12 + (value13 - value12) * value14;
}
function calculateDynamicPadding(value15, value16) {
  const mount = interpolate(420, 96, value15),
    value17 = 720 * value15 * (1 - value16) ** 2,
    preview = Math.max(
      mount,
      interpolate(720, 240, value15) +
        interpolate(240, 0, value16) -
        144 * value15 * value16 +
        value17,
    );
  return {
    mount: mount,
    preview: preview,
    park: Math.max(interpolate(900, 360, value15), preview + 120),
  };
}
function collectLiveIds(map5, ...args) {
  const value18 = new Set();
  for (const value19 of args) {
    for (const value20 of toIdSet(value19)) {
      if (map5.has(value20)) value18.add(value20);
    }
  }
  return value18;
}
function buildSurfaceSignature(args2, args3, args4) {
  return ['full', ...args2, 'proxy', ...args3, 'generation-busy', ...args4].join('\x1f');
}
function getNodeDistanceSquared(box4, box5, value21, value22) {
  const value23 = Number.isFinite(box5?.zoom) && box5.zoom > 0 ? box5.zoom : 1,
    value24 = Number.isFinite(box5?.x) ? box5.x : 0,
    value25 = Number.isFinite(box5?.y) ? box5.y : 0,
    value26 =
      ((Number.isFinite(box4?.x) ? box4.x : 0) +
        (Number.isFinite(box4?.width) ? box4.width : 0) / 2) *
        value23 +
      value24,
    value27 =
      ((Number.isFinite(box4?.y) ? box4.y : 0) +
        (Number.isFinite(box4?.height) ? box4.height : 0) / 2) *
        value23 +
      value25,
    value28 = value26 - value21 / 2,
    value29 = value27 - value22 / 2;
  return value28 * value28 + value29 * value29;
}
export function buildRendererScenePlan({
  nodes: nodes = [],
  spatialIndex: spatialIndex = null,
  viewport: viewport = { x: 0, y: 0, zoom: 1 },
  containerRect: containerRect,
  mountCandidateIds: mountCandidateIds,
  previewCandidateIds: previewCandidateIds,
  parkCandidateIds: parkCandidateIds,
  selectedNodeIds: selectedNodeIds,
  activeNodeIds: activeNodeIds,
  keepAliveNodeIds: keepAliveNodeIds,
  mountedNodeIds: mountedNodeIds,
  fullEligibleVisibleImageNodeIds: fullEligibleVisibleImageNodeIds,
  includeParkIds: includeParkIds = true,
  deferInitialPlanning: deferInitialPlanning = false,
} = {}) {
  const { width: width2, height: height2 } = getContainerSize(containerRect),
    nodeById2 = createNodeMap(nodes, spatialIndex),
    map6 = new Map(),
    handler = (value30) => {
      if (map6.has(value30)) return map6.get(value30);
      const nodeDistanceSquared = getNodeDistanceSquared(
        nodeById2.get(value30),
        viewport,
        width2,
        height2,
      );
      return (map6.set(value30, nodeDistanceSquared), nodeDistanceSquared);
    },
    exactVisibleIds = collectViewportRangeIds({
      nodeById: nodeById2,
      spatialIndex: spatialIndex,
      viewport: viewport,
      width: width2,
      height: height2,
      padding: 0,
    }),
    fullSurfaceIds = new Set(),
    proxySurfaceIds = new Set(),
    pressure = calculateScenePressure(exactVisibleIds.size, nodeById2.size),
    projectedDetail = calculateProjectedDetail(exactVisibleIds, nodeById2, viewport),
    padding2 = calculateDynamicPadding(pressure, projectedDetail),
    smoothstep4 = smoothstep(120, 320, nodeById2.size),
    calculateDenseLowZoomRasterStrength2 = calculateDenseLowZoomRasterStrength(smoothstep4, viewport),
    fullSurfaceBudget = Math.round(
      (48 - 16 * pressure) * projectedDetail * (1 - calculateDenseLowZoomRasterStrength2),
    ),
    map7 = collectLiveIds(nodeById2, mountedNodeIds),
    liveIds = collectLiveIds(nodeById2, selectedNodeIds, activeNodeIds, keepAliveNodeIds),
    list2 = [];
  for (const value31 of exactVisibleIds) {
    shouldShowGenerationBusyUi(nodeById2.get(value31)) && list2.push(value31);
  }
  spatialIndex &&
    list2.length > 1 &&
    list2.sort(
      (value32, value33) =>
        getSpatialNodeOrder(spatialIndex, value32) - getSpatialNodeOrder(spatialIndex, value33),
    );
  const exactVisibleGenerationBusyIds = new Set(list2),
    map8 = collectLiveIds(nodeById2, mountCandidateIds);
  for (const value34 of liveIds) fullSurfaceIds.add(value34);
  if (deferInitialPlanning === true && includeParkIds === false && fullSurfaceBudget === 0) {
    const liveIds2 = collectLiveIds(nodeById2, previewCandidateIds, mountCandidateIds, exactVisibleIds);
    for (const value35 of liveIds2) {
      if (!fullSurfaceIds.has(value35)) proxySurfaceIds.add(value35);
    }
    const fullSurfaceReleaseIds = new Set([...map7].filter((value36) => !fullSurfaceIds.has(value36))),
      presentationSurfaceIds = new Set([...fullSurfaceIds, ...proxySurfaceIds]),
      plannedFullEligibleVisibleImageNodeIds = new Set(
        [...toIdSet(fullEligibleVisibleImageNodeIds)].filter((value37) => fullSurfaceIds.has(value37)),
      );
    return {
      pressure: pressure,
      projectedDetail: projectedDetail,
      padding: padding2,
      fullSurfaceBudget: fullSurfaceBudget,
      exactVisibleIds: exactVisibleIds,
      exactVisibleGenerationBusyIds: exactVisibleGenerationBusyIds,
      fullSurfaceIds: fullSurfaceIds,
      proxySurfaceIds: proxySurfaceIds,
      parkIds: new Set(),
      fullSurfaceReleaseIds: fullSurfaceReleaseIds,
      presentationSurfaceIds: presentationSurfaceIds,
      plannedFullEligibleVisibleImageNodeIds: plannedFullEligibleVisibleImageNodeIds,
      deferredInitialPlanning: true,
      surfaceSignature: buildSurfaceSignature(fullSurfaceIds, proxySurfaceIds, exactVisibleGenerationBusyIds),
    };
  }
  const args5 = collectViewportRangeIds({
      nodeById: nodeById2,
      spatialIndex: spatialIndex,
      viewport: viewport,
      width: width2,
      height: height2,
      padding: padding2.mount,
    }),
    count2 = Math.max(0, fullSurfaceBudget - fullSurfaceIds.size);
  if (count2 > 0) {
    const list3 = [...args5]
      .filter((value38) => !fullSurfaceIds.has(value38))
      .sort((value39, value40) => {
        const count3 = Number(!exactVisibleIds.has(value39)) - Number(!exactVisibleIds.has(value40));
        if (count3 !== 0) return count3;
        const count4 =
          Number(!exactVisibleGenerationBusyIds.has(value39)) -
          Number(!exactVisibleGenerationBusyIds.has(value40));
        if (count4 !== 0) return count4;
        const count5 = Number(!map8.has(value39)) - Number(!map8.has(value40));
        if (count5 !== 0) return count5;
        const count6 = Number(!map7.has(value39)) - Number(!map7.has(value40));
        if (count6 !== 0) return count6;
        const count7 = handler(value39) - handler(value40);
        if (count7 !== 0) return count7;
        return getSpatialNodeOrder(spatialIndex, value39) - getSpatialNodeOrder(spatialIndex, value40);
      });
    for (const value41 of list3.slice(0, count2)) {
      fullSurfaceIds.add(value41);
    }
  }
  const map9 = collectLiveIds(nodeById2, previewCandidateIds),
    value42 = new Set(
      [
        ...collectViewportRangeIds({
          nodeById: nodeById2,
          spatialIndex: spatialIndex,
          viewport: viewport,
          width: width2,
          height: height2,
          padding: padding2.preview,
        }),
      ].sort((value43, value44) => {
        const count8 = Number(!map9.has(value43)) - Number(!map9.has(value44));
        if (count8 !== 0) return count8;
        const count9 = handler(value43) - handler(value44);
        if (count9 !== 0) return count9;
        return getSpatialNodeOrder(spatialIndex, value43) - getSpatialNodeOrder(spatialIndex, value44);
      }),
    );
  for (const value45 of args5) value42.add(value45);
  for (const value46 of exactVisibleIds) {
    value42.add(value46);
  }
  for (const value47 of value42) {
    if (!fullSurfaceIds.has(value47)) proxySurfaceIds.add(value47);
  }
  let parkIds = new Set();
  if (includeParkIds !== false) {
    const map10 = collectLiveIds(nodeById2, parkCandidateIds),
      map11 = collectViewportRangeIds({
        nodeById: nodeById2,
        spatialIndex: spatialIndex,
        viewport: viewport,
        width: width2,
        height: height2,
        padding: padding2.park,
      });
    parkIds = new Set(
      [...nodeById2.keys()]
        .filter((value48) => !map11.has(value48))
        .sort((value49, value50) => {
          const count10 = Number(!map10.has(value49)) - Number(!map10.has(value50));
          if (count10 !== 0) return count10;
          return getSpatialNodeOrder(spatialIndex, value49) - getSpatialNodeOrder(spatialIndex, value50);
        }),
    );
    for (const value51 of map7) {
      !isNodeInsideViewportPadding(nodeById2.get(value51), viewport, width2, height2, padding2.park) &&
        parkIds.add(value51);
    }
    for (const value52 of fullSurfaceIds) parkIds.delete(value52);
    for (const value53 of proxySurfaceIds) parkIds.delete(value53);
  }
  const fullSurfaceReleaseIds2 = new Set([...map7].filter((value54) => !fullSurfaceIds.has(value54))),
    presentationSurfaceIds2 = new Set([...fullSurfaceIds, ...proxySurfaceIds]),
    plannedFullEligibleVisibleImageNodeIds2 = new Set(
      [...toIdSet(fullEligibleVisibleImageNodeIds)].filter((value55) => fullSurfaceIds.has(value55)),
    );
  return {
    pressure: pressure,
    projectedDetail: projectedDetail,
    padding: padding2,
    fullSurfaceBudget: fullSurfaceBudget,
    exactVisibleIds: exactVisibleIds,
    exactVisibleGenerationBusyIds: exactVisibleGenerationBusyIds,
    fullSurfaceIds: fullSurfaceIds,
    proxySurfaceIds: proxySurfaceIds,
    parkIds: parkIds,
    fullSurfaceReleaseIds: fullSurfaceReleaseIds2,
    presentationSurfaceIds: presentationSurfaceIds2,
    plannedFullEligibleVisibleImageNodeIds: plannedFullEligibleVisibleImageNodeIds2,
    surfaceSignature: buildSurfaceSignature(fullSurfaceIds, proxySurfaceIds, exactVisibleGenerationBusyIds),
  };
}
