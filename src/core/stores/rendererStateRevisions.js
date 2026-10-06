import { normalizeCanvasLocalPath, resolveCanvasVideoUrl } from '../../services/canvasMediaLocalService.js';
const NODE_GEOMETRY_KEYS = Object.freeze(['id', 'x', 'y', 'width', 'height']);
function hasGeometryChange(previous, next) {
  return NODE_GEOMETRY_KEYS.some((key) => previous?.[key] !== next?.[key]);
}
function getSourceVideoSignature(node) {
  if (!node || node.type !== 'source-video') return '';
  return JSON.stringify([
    'source-video',
    String(resolveCanvasVideoUrl(node) || ''),
    String(node.videoProxyVersion || '').trim(),
    normalizeCanvasLocalPath(node.pendingVideoProxyLocalPath),
    String(node.pendingVideoProxyVersion || '').trim(),
  ]);
}
function hasSourceVideoChange(previous, next) {
  return getSourceVideoSignature(previous) !== getSourceVideoSignature(next);
}
export function createRendererStateRevisionTracker(state) {
  function bump(key) {
    state[key] = (state[key] || 0) + 1;
  }
  function markRevisions({
    nodes: nodes = false,
    membership: membership = false,
    geometry: geometry = false,
    sourceVideo: sourceVideo = false,
  } = {}) {
    if (nodes) bump('_nodesRev');
    if (membership) bump('_nodeMembershipRev');
    if (geometry) bump('_nodeGeometryRev');
    if (sourceVideo) bump('_sourceVideoRev');
  }
  function createBatch() {
    const pending = { nodes: false, geometry: false, sourceVideo: false };
    return {
      patch(previous, next) {
        ((pending.nodes = true),
          (pending.geometry = pending.geometry || hasGeometryChange(previous, next)),
          (pending.sourceVideo = pending.sourceVideo || hasSourceVideoChange(previous, next)));
      },
      commit() {
        markRevisions(pending);
      },
    };
  }
  return {
    add(node, previousNode) {
      markRevisions({
        nodes: true,
        membership: true,
        geometry: true,
        sourceVideo: hasSourceVideoChange(node, previousNode),
      });
    },
    content() {
      markRevisions({ nodes: true });
    },
    geometry() {
      markRevisions({ nodes: true, geometry: true });
    },
    remove(ids) {
      const removed = (ids || []).map((id) => state.nodes?.[id]).filter(Boolean);
      if (removed.length === 0) return;
      markRevisions({
        nodes: true,
        membership: true,
        geometry: true,
        sourceVideo: removed.some((node) => node.type === 'source-video'),
      });
    },
    patch(previous, next) {
      markRevisions({
        nodes: true,
        geometry: hasGeometryChange(previous, next),
        sourceVideo: hasSourceVideoChange(previous, next),
      });
    },
    batch: createBatch,
    reload() {
      markRevisions({ nodes: true, membership: true, geometry: true, sourceVideo: true });
    },
    renderRequest() {
      bump('_renderRequestRev');
    },
  };
}
