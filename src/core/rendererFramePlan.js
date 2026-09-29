import { hasRendererPriorityMediaWork } from './rendererPriorityMediaWork.js';
import { buildRendererScenePlan } from './rendererScenePlan.js';
import {
  getCachedRendererSpatialIndex,
  queryRendererSpatialIndexIds,
  screenViewportToWorldBounds,
} from './rendererSpatialIndex.js';
import { RENDERER_VIRTUALIZATION_CONFIG } from './rendererVirtualization.js';
const PRIORITY_MEDIA_VIEWPORT_PADDING = 0xc8;
function resolveNodeCount(_0x3495e9, _0x393888, _0x3ce160) {
  if (Number['isFinite'](_0x3ce160)) return Number(_0x3ce160);
  if (Number['isFinite'](_0x3495e9?.['_nodeCount'])) return Number(_0x3495e9['_nodeCount']);
  return Object['keys'](_0x393888 || {})['length'];
}
function resolveGeometryRev(_0x55a7de, _0x1237a0, _0x2a81db) {
  if (Number['isFinite'](_0x2a81db)) return Number(_0x2a81db);
  if (Number['isFinite'](_0x55a7de?.['_nodeGeometryRev'])) return Number(_0x55a7de['_nodeGeometryRev']);
  if (Number['isFinite'](_0x55a7de?.['_persistRev'])) return Number(_0x55a7de['_persistRev']);
  return _0x1237a0;
}
function normalizeContainerRect(_0x2b0476) {
  return Object['freeze']({
    width: Number['isFinite'](_0x2b0476?.['width']) ? _0x2b0476['width'] : 0x0,
    height: Number['isFinite'](_0x2b0476?.['height']) ? _0x2b0476['height'] : 0x0,
  });
}
export function createRendererFramePlan({
  snapshot: snapshot = null,
  nodes: nodes = snapshot?.['nodes'] || {},
  viewport: viewport = snapshot?.['viewport'] || { x: 0x0, y: 0x0, zoom: 0x1 },
  containerRect: _0x7abf95,
  nodeCount: _0x568a8c,
  geometryRev: _0x2ba890,
} = {}) {
  const _0x1e046b = resolveNodeCount(snapshot, nodes, _0x568a8c),
    _0x1dec3a = resolveGeometryRev(snapshot, _0x1e046b, _0x2ba890),
    _0x279e36 = normalizeContainerRect(_0x7abf95);
  let _0x353d75 = ![],
    _0x4e275a = null,
    _0x50f467 = ![],
    _0x390fd4 = ![];
  function _0x288022() {
    if (!_0x353d75) {
      _0x4e275a = getCachedRendererSpatialIndex(nodes, {
        geometryRev: _0x1dec3a,
        nodeCount: _0x1e046b,
        denseNodeCount: RENDERER_VIRTUALIZATION_CONFIG['denseNodeCount'],
      });
      if (_0x4e275a) _0x4e275a = { ..._0x4e275a, frameQueryCache: new Map() };
      _0x353d75 = !![];
    }
    return _0x4e275a;
  }
  function _0x18fef2() {
    const _0x531343 = _0x288022();
    if (!_0x531343) return undefined;
    return queryRendererSpatialIndexIds(
      _0x531343,
      screenViewportToWorldBounds({
        viewport: viewport,
        containerWidth: _0x279e36['width'],
        containerHeight: _0x279e36['height'],
        padding: PRIORITY_MEDIA_VIEWPORT_PADDING,
      }),
    );
  }
  function _0x201590({ needed: needed = !![] } = {}) {
    if (!needed) return ![];
    return (
      !_0x50f467 &&
        ((_0x390fd4 = hasRendererPriorityMediaWork({
          nodes: nodes,
          selectedNodeIds: snapshot?.['selectedNodeIds'],
          connOverlay: snapshot?.['connOverlay'],
          pickConnectMode: snapshot?.['pickConnectMode'],
          viewport: viewport,
          containerWidth: _0x279e36['width'],
          containerHeight: _0x279e36['height'],
          viewportPadding: PRIORITY_MEDIA_VIEWPORT_PADDING,
          candidateNodeIds: _0x18fef2(),
        })),
        (_0x50f467 = !![])),
      _0x390fd4
    );
  }
  return Object['freeze']({
    nodeCount: _0x1e046b,
    viewport: viewport,
    containerRect: _0x279e36,
    getSpatialIndex: _0x288022,
    hasPriorityMediaWork: _0x201590,
    buildScenePlan(_0x324a94 = {}) {
      return buildRendererScenePlan({
        ..._0x324a94,
        nodes: nodes,
        spatialIndex: _0x288022(),
        viewport: viewport,
        containerRect: _0x279e36,
      });
    },
  });
}
