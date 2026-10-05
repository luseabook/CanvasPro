function toIdSet(value) {
  if (value instanceof Set) return new Set(value);
  if (Array['isArray'](value)) return new Set(value);
  return new Set();
}
function createNodeAccessor(map) {
  if (map instanceof Map) return (item) => map['get'](item);
  if (Array['isArray'](map)) {
    let map2 = null;
    return (key) => {
      if (!map2) {
        map2 = new Map();
        for (const enabled of map) {
          if (!enabled || typeof enabled !== 'object') continue;
          const index = enabled['id'];
          if (index == null || index === '') continue;
          map2['set'](index, enabled);
        }
      }
      return map2['get'](key);
    };
  }
  if (map && typeof map === 'object')
    return (result) => {
      if (!Object['prototype']['hasOwnProperty']['call'](map, result)) return undefined;
      const data = map[result];
      return data && typeof data === 'object' ? data : undefined;
    };
  return () => undefined;
}
function clampUnit(options) {
  const target = Number(options);
  if (!Number['isFinite'](target)) return 0;
  return Math['max'](0, Math['min'](1, target));
}
function smoothstep(source, next, current) {
  if (current <= source) return 0;
  if (current >= next) return 1;
  const entry = (current - source) / (next - source);
  return entry * entry * (3 - 2 * entry);
}
const DENSE_RASTER_FULL_STRENGTH_ZOOM = 0.4,
  DENSE_RASTER_EXIT_ZOOM = 0.55;
export function calculateDenseLowZoomRasterStrength(record, box) {
  const clampUnit2 = clampUnit(record),
    count = Number(box?.['zoom']),
    payload = Number['isFinite'](count) && count > 0 ? count : 1,
    handle = 1 - smoothstep(DENSE_RASTER_FULL_STRENGTH_ZOOM, DENSE_RASTER_EXIT_ZOOM, payload);
  return clampUnit2 * handle;
}
function addId(state, config) {
  if (config != null && config !== '') state['add'](config);
}
function addIds(scope, input) {
  for (const output of toIdSet(input)) addId(scope, output);
}
function collectDomRequiredIds({
  selectedNodeIds: selectedNodeIds,
  hoveredNodeIds: hoveredNodeIds,
  hoverNodeId: hoverNodeId,
  dragNodeIds: dragNodeIds,
  dragTargets: dragTargets,
  connectingNodeIds: connectingNodeIds,
  connOverlay: connOverlay,
  pickNodeIds: pickNodeIds,
  pickConnectMode: pickConnectMode,
  activeMediaNodeIds: activeMediaNodeIds,
  activeNodeIds: activeNodeIds,
  domRequiredNodeIds: domRequiredNodeIds,
} = {}) {
  const value2 = new Set();
  return (
    [
      selectedNodeIds,
      hoveredNodeIds,
      dragNodeIds,
      dragTargets,
      connectingNodeIds,
      pickNodeIds,
      activeMediaNodeIds,
      activeNodeIds,
      domRequiredNodeIds,
    ]['forEach']((value3) => addIds(value2, value3)),
    addId(value2, hoverNodeId),
    addId(value2, connOverlay?.['srcId']),
    addId(value2, connOverlay?.['hoverId']),
    addIds(value2, connOverlay?.['activeNodeIds']),
    pickConnectMode?.['active'] === true &&
      (addId(value2, pickConnectMode['sourceNodeId']),
      addId(value2, pickConnectMode['srcId']),
      addId(value2, pickConnectMode['hoverNodeId']),
      addId(value2, pickConnectMode['hoverId']),
      addIds(value2, pickConnectMode['activeNodeIds'])),
    value2
  );
}
function isRasterSupported(value4, value5, map3, map4) {
  if (map3['has'](value4)) return true;
  const enabled2 = String(value5?.['type'] || '')
    ['trim']()
    ['toLowerCase']();
  return !!enabled2 && map4['has'](enabled2);
}
function getProjectedMetrics(box2, value6, value7) {
  const value8 = Math['max'](1, Number(box2?.['width']) || 160) * value6,
    value9 = Math['max'](1, Number(box2?.['height']) || 120) * value6,
    area = value8 * value9,
    value10 = 3000 + (8000 - 3000) * value7,
    value11 = 14000 + (40000 - 14000) * value7;
  return { area: area, compactness: 1 - smoothstep(value10, value11, area) };
}
function buildCoverageSignature(value12, value13, value14) {
  const run = (args) => [...args]['map'](String)['sort']();
  return ['full', ...run(value12), 'raster', ...run(value13), 'dom', ...run(value14)]['join']('\x1f');
}
export function planRendererRasterProxies({
  nodes: nodes = [],
  fullSurfaceIds: fullSurfaceIds,
  proxySurfaceIds: proxySurfaceIds,
  exactVisibleIds: exactVisibleIds,
  rasterSupportedNodeIds: rasterSupportedNodeIds,
  rasterSupportedNodeTypes: rasterSupportedNodeTypes,
  previousRasterIds: previousRasterIds,
  viewport: viewport,
  scenePressure: scenePressure = 0,
  ...args2
} = {}) {
  const run2 = createNodeAccessor(nodes),
    map5 = toIdSet(fullSurfaceIds),
    proxyCount = new Set([...toIdSet(proxySurfaceIds)]['filter']((value15) => !map5['has'](value15))),
    exactVisible = toIdSet(exactVisibleIds),
    toIdSet2 = toIdSet(rasterSupportedNodeIds),
    value16 = new Set(
      [...toIdSet(rasterSupportedNodeTypes)]['map']((value17) =>
        String(value17 || '')
          ['trim']()
          ['toLowerCase'](),
      ),
    ),
    retained = toIdSet(previousRasterIds),
    map6 = collectDomRequiredIds(args2),
    active = new Set(),
    domProxyIds = new Set(),
    rasterCandidateCount = [];
  let interactiveDomCount = 0,
    unsupportedDomCount = 0,
    projectedDomCount = 0;
  const count2 = Number(viewport?.['zoom']),
    value18 = Number['isFinite'](count2) && count2 > 0 ? count2 : 1,
    scenePressure2 = clampUnit(scenePressure),
    denseRasterStrength = calculateDenseLowZoomRasterStrength(scenePressure2, viewport);
  for (const id of proxyCount) {
    if (map6['has'](id)) {
      (domProxyIds['add'](id), (interactiveDomCount += 1));
      continue;
    }
    const value19 = run2(id);
    if (!isRasterSupported(id, value19, toIdSet2, value16)) {
      (domProxyIds['add'](id), (unsupportedDomCount += 1));
      continue;
    }
    const args3 = getProjectedMetrics(value19, value18, denseRasterStrength);
    if (args3['compactness'] < 0.2) {
      (domProxyIds['add'](id), (projectedDomCount += 1));
      continue;
    }
    rasterCandidateCount['push']({
      id: id,
      ...args3,
      exactVisible: exactVisible['has'](id),
      retained: retained['has'](id),
    });
  }
  const proxyPressure = smoothstep(12, 72, proxyCount['size']),
    value20 = 1 - (1 - scenePressure2) * (1 - proxyPressure),
    value21 =
      rasterCandidateCount['length'] > 0
        ? rasterCandidateCount['reduce']((value22, value23) => value22 + value23['compactness'], 0) /
          rasterCandidateCount['length']
        : 0,
    activationSignal = value20 * value21,
    rasterShare = smoothstep(0.32, 0.78, activationSignal),
    activationFloor = retained['size'] > 0 ? 0.24 : 0.32,
    value24 = Math['min'](
      rasterCandidateCount['length'],
      activationSignal >= activationFloor ? rasterCandidateCount['length'] : 0,
    );
  rasterCandidateCount['sort']((enabled3, enabled4) => {
    const count3 = Number(!enabled3['exactVisible']) - Number(!enabled4['exactVisible']);
    if (count3 !== 0) return count3;
    const value25 = enabled3['compactness'] + (enabled3['retained'] ? 0.08 : 0),
      value26 = enabled4['compactness'] + (enabled4['retained'] ? 0.08 : 0);
    if (value25 !== value26) return value26 - value25;
    if (enabled3['area'] !== enabled4['area']) return enabled3['area'] - enabled4['area'];
    return String(enabled3['id'])['localeCompare'](String(enabled4['id']));
  });
  for (const value27 of rasterCandidateCount['slice'](0, value24)) {
    active['add'](value27['id']);
  }
  for (const value28 of rasterCandidateCount['slice'](value24)) {
    domProxyIds['add'](value28['id']);
  }
  let reason = 'mixed-raster-dom';
  if (proxyCount['size'] === 0) reason = 'no-proxy-candidates';
  else {
    if (rasterCandidateCount['length'] === 0) reason = 'dom-required-only';
    else {
      if (active['size'] === 0) reason = 'below-raster-load';
      else domProxyIds['size'] === 0 && (reason = 'rasterized-all-proxies');
    }
  }
  let exactVisibleCoveredCount = 0;
  for (const value29 of exactVisible) {
    (map5['has'](value29) || active['has'](value29) || domProxyIds['has'](value29)) &&
      (exactVisibleCoveredCount += 1);
  }
  const signature = buildCoverageSignature(map5, active, domProxyIds);
  return {
    active: active['size'] > 0,
    rasterIds: active,
    domProxyIds: domProxyIds,
    reason: reason,
    signature: signature,
    coverageSignature: signature,
    stats: {
      scenePressure: scenePressure2,
      denseRasterStrength: denseRasterStrength,
      proxyPressure: proxyPressure,
      activationSignal: activationSignal,
      activationFloor: activationFloor,
      rasterShare: rasterShare,
      proxyCount: proxyCount['size'],
      rasterCandidateCount: rasterCandidateCount['length'],
      rasterCount: active['size'],
      domProxyCount: domProxyIds['size'],
      interactiveDomCount: interactiveDomCount,
      unsupportedDomCount: unsupportedDomCount,
      projectedDomCount: projectedDomCount,
      exactVisibleCount: exactVisible['size'],
      exactVisibleCoveredCount: exactVisibleCoveredCount,
      exactVisibleMissingCount: exactVisible['size'] - exactVisibleCoveredCount,
    },
  };
}
