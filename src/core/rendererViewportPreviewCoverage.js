import { queryRendererSpatialIndexIds, screenViewportToWorldBounds } from './rendererSpatialIndex.js';
import { resolveRendererVirtualizationTier } from './rendererVirtualization.js';
const BOUNDS_EPSILON = 0.000001;
export const RENDERER_VIEWPORT_PREVIEW_COVERAGE_CONFIG = Object['freeze']({
  maxDirectVisibleNodeCount: 128,
  maxRasterAssistedVisibleNodeCount: 384,
  minRasterVisibleShare: 0.5,
  rasterAssistedImmediateCreateLimit: 16,
});
function finiteNumber(value, item = 0) {
  const key = Number(value);
  return Number['isFinite'](key) ? key : item;
}
function finiteRevision(index) {
  const result = Number(index);
  return Number['isFinite'](result) ? result : null;
}
function normalizeIds(enabled) {
  if (!enabled || typeof enabled[Symbol['iterator']] !== 'function') return '';
  return Array['from'](enabled, (data) => String(data || ''))
    ['filter'](Boolean)
    ['sort']()
    ['join']('\x1f');
}
function buildInteractionSignature(state = {}) {
  const options = state['connOverlay'] || {},
    target = state['pickConnectMode'] || {};
  return [
    normalizeIds(state['selectedNodeIds']),
    options['active'] === true ? 1 : 0,
    options['srcId'] || '',
    options['hoverId'] || '',
    normalizeIds(options['invalidNodeIds']),
    target['active'] === true ? 1 : 0,
    target['sourceNodeId'] || target['srcId'] || '',
    target['hoverNodeId'] || target['hoverId'] || '',
    state['ui']?.['showVideoMeta'] === true ? 1 : 0,
  ]['join']('\x1e');
}
function containsBounds(enabled2, enabled3) {
  if (!enabled2 || !enabled3) return false;
  return (
    finiteNumber(enabled3['minX'], Number['NEGATIVE_INFINITY']) >=
      finiteNumber(enabled2['minX'], Number['POSITIVE_INFINITY']) - BOUNDS_EPSILON &&
    finiteNumber(enabled3['minY'], Number['NEGATIVE_INFINITY']) >=
      finiteNumber(enabled2['minY'], Number['POSITIVE_INFINITY']) - BOUNDS_EPSILON &&
    finiteNumber(enabled3['maxX'], Number['POSITIVE_INFINITY']) <=
      finiteNumber(enabled2['maxX'], Number['NEGATIVE_INFINITY']) + BOUNDS_EPSILON &&
    finiteNumber(enabled3['maxY'], Number['POSITIVE_INFINITY']) <=
      finiteNumber(enabled2['maxY'], Number['NEGATIVE_INFINITY']) + BOUNDS_EPSILON
  );
}
export function shouldPrepareRendererViewportPreviewCoverage({
  viewport: viewport,
  nodeCount: nodeCount = 0,
  visibleNodeCount: visibleNodeCount = 0,
  rasterVisibleNodeCount: rasterVisibleNodeCount = 0,
} = {}) {
  const nodeCount2 = Math['max'](0, Math['trunc'](finiteNumber(nodeCount, 0))),
    source = Math['max'](0, Math['trunc'](finiteNumber(visibleNodeCount, 0)));
  if (resolveRendererVirtualizationTier({ viewport: viewport, nodeCount: nodeCount2 }) === 'default')
    return false;
  if (source <= RENDERER_VIEWPORT_PREVIEW_COVERAGE_CONFIG['maxDirectVisibleNodeCount']) return true;
  if (source > RENDERER_VIEWPORT_PREVIEW_COVERAGE_CONFIG['maxRasterAssistedVisibleNodeCount']) return false;
  const next = Math['max'](0, Math['trunc'](finiteNumber(rasterVisibleNodeCount, 0)));
  return (
    next / Math['max'](1, source) >= RENDERER_VIEWPORT_PREVIEW_COVERAGE_CONFIG['minRasterVisibleShare']
  );
}
export function createRendererViewportPreviewCoverage({
  viewport: viewport2,
  containerWidth: containerWidth,
  containerHeight: containerHeight,
  padding: padding = 0,
  nodeCount: nodeCount = 0,
  snapshot: snapshot = {},
  spatialIndex: spatialIndex = null,
  presentedNodeIds: presentedNodeIds = null,
  ready: ready = true,
} = {}) {
  if (ready !== true) return null;
  const containerWidth2 = Math['max'](1, finiteNumber(containerWidth, 1)),
    containerHeight2 = Math['max'](1, finiteNumber(containerHeight, 1)),
    nodeCount3 = Math['max'](0, Math['trunc'](finiteNumber(nodeCount, 0)));
  return {
    bounds: screenViewportToWorldBounds({
      viewport: viewport2,
      containerWidth: containerWidth2,
      containerHeight: containerHeight2,
      padding: padding,
    }),
    containerWidth: containerWidth2,
    containerHeight: containerHeight2,
    nodeCount: nodeCount3,
    nodesRef: snapshot?.['nodes'] || null,
    nodesRev: finiteRevision(snapshot?.['_nodesRev']),
    nodeGeometryRev: finiteRevision(snapshot?.['_nodeGeometryRev']),
    persistRev: finiteRevision(snapshot?.['_persistRev']),
    interactionSignature: buildInteractionSignature(snapshot),
    spatialIndex: spatialIndex,
    presentedNodeIds:
      presentedNodeIds && typeof presentedNodeIds[Symbol['iterator']] === 'function'
        ? new Set(presentedNodeIds)
        : null,
    tier: resolveRendererVirtualizationTier({ viewport: viewport2, nodeCount: nodeCount3 }),
  };
}
export function canReuseRendererViewportPreviewCoverage(
  containerWidth3,
  { viewport: viewport3, nodeCount: nodeCount = 0, snapshot: snapshot = {} } = {},
) {
  if (!containerWidth3?.['bounds']) return false;
  const nodeCount4 = Math['max'](0, Math['trunc'](finiteNumber(nodeCount, 0))),
    rendererVirtualizationTier = resolveRendererVirtualizationTier({
      viewport: viewport3,
      nodeCount: nodeCount4,
    });
  if (rendererVirtualizationTier === 'default' || containerWidth3['tier'] === 'default') return false;
  if (Number(containerWidth3['nodeCount']) !== nodeCount4) return false;
  if (containerWidth3['nodesRef'] && containerWidth3['nodesRef'] !== snapshot?.['nodes']) return false;
  if (
    Object['prototype']['hasOwnProperty']['call'](containerWidth3, 'nodesRev') &&
    containerWidth3['nodesRev'] !== finiteRevision(snapshot?.['_nodesRev'])
  )
    return false;
  if (
    Object['prototype']['hasOwnProperty']['call'](containerWidth3, 'nodeGeometryRev') &&
    containerWidth3['nodeGeometryRev'] !== finiteRevision(snapshot?.['_nodeGeometryRev'])
  )
    return false;
  if (
    Object['prototype']['hasOwnProperty']['call'](containerWidth3, 'persistRev') &&
    containerWidth3['persistRev'] !== finiteRevision(snapshot?.['_persistRev'])
  )
    return false;
  if (
    typeof containerWidth3['interactionSignature'] === 'string' &&
    containerWidth3['interactionSignature'] !== buildInteractionSignature(snapshot)
  )
    return false;
  const worldBounds = screenViewportToWorldBounds({
    viewport: viewport3,
    containerWidth: containerWidth3['containerWidth'],
    containerHeight: containerWidth3['containerHeight'],
    padding: 0,
  });
  if (containerWidth3['presentedNodeIds'] instanceof Set) {
    if (!containerWidth3['spatialIndex']) return false;
    const queryRendererSpatialIndexIds2 = queryRendererSpatialIndexIds(
      containerWidth3['spatialIndex'],
      worldBounds,
    );
    for (const current of queryRendererSpatialIndexIds2) {
      if (!containerWidth3['presentedNodeIds']['has'](current)) return false;
    }
    return true;
  }
  return containsBounds(containerWidth3['bounds'], worldBounds);
}
