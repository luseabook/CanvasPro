import { queryRendererSpatialIndexIds, screenViewportToWorldBounds } from './rendererSpatialIndex.js';
import { resolveRendererVirtualizationTier } from './rendererVirtualization.js';
const BOUNDS_EPSILON = 0.000001;
export const RENDERER_VIEWPORT_PREVIEW_COVERAGE_CONFIG = Object['freeze']({
  maxDirectVisibleNodeCount: 0x80,
  maxRasterAssistedVisibleNodeCount: 0x180,
  minRasterVisibleShare: 0.5,
  rasterAssistedImmediateCreateLimit: 0x10,
});
function finiteNumber(_0x2eb80f, _0x31bafe = 0x0) {
  const _0x754c53 = Number(_0x2eb80f);
  return Number['isFinite'](_0x754c53) ? _0x754c53 : _0x31bafe;
}
function finiteRevision(_0x4fd8bb) {
  const _0x176722 = Number(_0x4fd8bb);
  return Number['isFinite'](_0x176722) ? _0x176722 : null;
}
function normalizeIds(_0x4deed) {
  if (!_0x4deed || typeof _0x4deed[Symbol['iterator']] !== 'function') return '';
  return Array['from'](_0x4deed, (_0x263883) => String(_0x263883 || ''))
    ['filter'](Boolean)
    ['sort']()
    ['join']('\x1f');
}
function buildInteractionSignature(_0x1282a6 = {}) {
  const _0x4adb80 = _0x1282a6['connOverlay'] || {},
    _0x3d8dfa = _0x1282a6['pickConnectMode'] || {};
  return [
    normalizeIds(_0x1282a6['selectedNodeIds']),
    _0x4adb80['active'] === !![] ? 0x1 : 0x0,
    _0x4adb80['srcId'] || '',
    _0x4adb80['hoverId'] || '',
    normalizeIds(_0x4adb80['invalidNodeIds']),
    _0x3d8dfa['active'] === !![] ? 0x1 : 0x0,
    _0x3d8dfa['sourceNodeId'] || _0x3d8dfa['srcId'] || '',
    _0x3d8dfa['hoverNodeId'] || _0x3d8dfa['hoverId'] || '',
    _0x1282a6['ui']?.['showVideoMeta'] === !![] ? 0x1 : 0x0,
  ]['join']('\x1e');
}
function containsBounds(_0x4f653f, _0x4c58fb) {
  if (!_0x4f653f || !_0x4c58fb) return ![];
  return (
    finiteNumber(_0x4c58fb['minX'], Number['NEGATIVE_INFINITY']) >=
      finiteNumber(_0x4f653f['minX'], Number['POSITIVE_INFINITY']) - BOUNDS_EPSILON &&
    finiteNumber(_0x4c58fb['minY'], Number['NEGATIVE_INFINITY']) >=
      finiteNumber(_0x4f653f['minY'], Number['POSITIVE_INFINITY']) - BOUNDS_EPSILON &&
    finiteNumber(_0x4c58fb['maxX'], Number['POSITIVE_INFINITY']) <=
      finiteNumber(_0x4f653f['maxX'], Number['NEGATIVE_INFINITY']) + BOUNDS_EPSILON &&
    finiteNumber(_0x4c58fb['maxY'], Number['POSITIVE_INFINITY']) <=
      finiteNumber(_0x4f653f['maxY'], Number['NEGATIVE_INFINITY']) + BOUNDS_EPSILON
  );
}
export function shouldPrepareRendererViewportPreviewCoverage({
  viewport: _0x165ac3,
  nodeCount: nodeCount = 0x0,
  visibleNodeCount: visibleNodeCount = 0x0,
  rasterVisibleNodeCount: rasterVisibleNodeCount = 0x0,
} = {}) {
  const _0x1d6c95 = Math['max'](0x0, Math['trunc'](finiteNumber(nodeCount, 0x0))),
    _0x100980 = Math['max'](0x0, Math['trunc'](finiteNumber(visibleNodeCount, 0x0)));
  if (resolveRendererVirtualizationTier({ viewport: _0x165ac3, nodeCount: _0x1d6c95 }) === 'default')
    return ![];
  if (_0x100980 <= RENDERER_VIEWPORT_PREVIEW_COVERAGE_CONFIG['maxDirectVisibleNodeCount']) return !![];
  if (_0x100980 > RENDERER_VIEWPORT_PREVIEW_COVERAGE_CONFIG['maxRasterAssistedVisibleNodeCount']) return ![];
  const _0x2e82b0 = Math['max'](0x0, Math['trunc'](finiteNumber(rasterVisibleNodeCount, 0x0)));
  return (
    _0x2e82b0 / Math['max'](0x1, _0x100980) >=
    RENDERER_VIEWPORT_PREVIEW_COVERAGE_CONFIG['minRasterVisibleShare']
  );
}
export function createRendererViewportPreviewCoverage({
  viewport: _0x1e678f,
  containerWidth: _0x1dab5a,
  containerHeight: _0x605a84,
  padding: padding = 0x0,
  nodeCount: nodeCount = 0x0,
  snapshot: snapshot = {},
  spatialIndex: spatialIndex = null,
  presentedNodeIds: presentedNodeIds = null,
  ready: ready = !![],
} = {}) {
  if (ready !== !![]) return null;
  const _0x16698f = Math['max'](0x1, finiteNumber(_0x1dab5a, 0x1)),
    _0x21fccd = Math['max'](0x1, finiteNumber(_0x605a84, 0x1)),
    _0x23f08f = Math['max'](0x0, Math['trunc'](finiteNumber(nodeCount, 0x0)));
  return {
    bounds: screenViewportToWorldBounds({
      viewport: _0x1e678f,
      containerWidth: _0x16698f,
      containerHeight: _0x21fccd,
      padding: padding,
    }),
    containerWidth: _0x16698f,
    containerHeight: _0x21fccd,
    nodeCount: _0x23f08f,
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
    tier: resolveRendererVirtualizationTier({ viewport: _0x1e678f, nodeCount: _0x23f08f }),
  };
}
export function canReuseRendererViewportPreviewCoverage(
  _0x2ef779,
  { viewport: _0x2ec1c5, nodeCount: nodeCount = 0x0, snapshot: snapshot = {} } = {},
) {
  if (!_0x2ef779?.['bounds']) return ![];
  const _0x17ccde = Math['max'](0x0, Math['trunc'](finiteNumber(nodeCount, 0x0))),
    _0x3e8535 = resolveRendererVirtualizationTier({ viewport: _0x2ec1c5, nodeCount: _0x17ccde });
  if (_0x3e8535 === 'default' || _0x2ef779['tier'] === 'default') return ![];
  if (Number(_0x2ef779['nodeCount']) !== _0x17ccde) return ![];
  if (_0x2ef779['nodesRef'] && _0x2ef779['nodesRef'] !== snapshot?.['nodes']) return ![];
  if (
    Object['prototype']['hasOwnProperty']['call'](_0x2ef779, 'nodesRev') &&
    _0x2ef779['nodesRev'] !== finiteRevision(snapshot?.['_nodesRev'])
  )
    return ![];
  if (
    Object['prototype']['hasOwnProperty']['call'](_0x2ef779, 'nodeGeometryRev') &&
    _0x2ef779['nodeGeometryRev'] !== finiteRevision(snapshot?.['_nodeGeometryRev'])
  )
    return ![];
  if (
    Object['prototype']['hasOwnProperty']['call'](_0x2ef779, 'persistRev') &&
    _0x2ef779['persistRev'] !== finiteRevision(snapshot?.['_persistRev'])
  )
    return ![];
  if (
    typeof _0x2ef779['interactionSignature'] === 'string' &&
    _0x2ef779['interactionSignature'] !== buildInteractionSignature(snapshot)
  )
    return ![];
  const _0x2e1503 = screenViewportToWorldBounds({
    viewport: _0x2ec1c5,
    containerWidth: _0x2ef779['containerWidth'],
    containerHeight: _0x2ef779['containerHeight'],
    padding: 0x0,
  });
  if (_0x2ef779['presentedNodeIds'] instanceof Set) {
    if (!_0x2ef779['spatialIndex']) return ![];
    const _0x343371 = queryRendererSpatialIndexIds(_0x2ef779['spatialIndex'], _0x2e1503);
    for (const _0x21080b of _0x343371) {
      if (!_0x2ef779['presentedNodeIds']['has'](_0x21080b)) return ![];
    }
    return !![];
  }
  return containsBounds(_0x2ef779['bounds'], _0x2e1503);
}
