import { createNodeGeometryOverlay } from './nodeGeometryOverlay.js';
import { previewNodeGeometry } from './rendererGeometryPreview.js';
function toFiniteNumber(value) {
  const item = Number(value);
  return Number['isFinite'](item) ? item : null;
}
function normalizeEdgeIds(key) {
  if (key instanceof Set) return new Set(key);
  if (Array['isArray'](key)) return new Set(key);
  return new Set();
}
export function previewNodeResizeGeometry(
  { nodeId: nodeId, width: width, height: height } = {},
  {
    snapshot: snapshot,
    ensureEdgeIndex: ensureEdgeIndex,
    nodeToEdgeIds: nodeToEdgeIds,
    renderEdgesByIds: renderEdgesByIds,
  } = {},
) {
  if (!nodeId || !snapshot?.['nodes']?.[nodeId]) return ![];
  const width2 = toFiniteNumber(width),
    height2 = toFiniteNumber(height);
  if (width2 === null || height2 === null) return ![];
  const index = snapshot['edges'] || {},
    result = Number['isFinite'](snapshot['_edgesRev']) ? snapshot['_edgesRev'] : 0x0;
  ensureEdgeIndex?.(index, result);
  const edgeIds = normalizeEdgeIds(nodeToEdgeIds?.['get']?.(nodeId));
  if (edgeIds['size'] === 0x0) return !![];
  return (
    renderEdgesByIds?.(
      edgeIds,
      createNodeGeometryOverlay(snapshot['nodes'], { [nodeId]: { width: width2, height: height2 } }),
      snapshot,
    ),
    !![]
  );
}
export function installNodeResizeGeometryPreviewer(bridge, snapshot2, ensureEdgeIndex2, nodeToEdgeIds2, renderEdgesByIds2) {
  if (!bridge) return ![];
  bridge['v2Renderer'] = bridge['v2Renderer'] || {};
  const cache = new Map();
  return (
    (bridge['v2Renderer']['previewNodeGeometry'] = (data) =>
      previewNodeGeometry(data, {
        snapshot: snapshot2?.(),
        bridge: bridge['v2Renderer'],
        ensureEdgeIndex: ensureEdgeIndex2,
        nodeToEdgeIds: nodeToEdgeIds2,
        renderEdgesByIds: renderEdgesByIds2,
        cache: cache,
      })),
    (bridge['v2Renderer']['previewNodeResizeGeometry'] = (options) =>
      previewNodeResizeGeometry(options, {
        snapshot: typeof snapshot2 === 'function' ? snapshot2() : null,
        ensureEdgeIndex: ensureEdgeIndex2,
        nodeToEdgeIds: nodeToEdgeIds2,
        renderEdgesByIds: renderEdgesByIds2,
      })),
    !![]
  );
}
