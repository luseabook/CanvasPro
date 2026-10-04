function toFiniteNumber(value) {
  const item = Number(value);
  return Number.isFinite(item) ? item : null;
}
function normalizeEdgeIds(key) {
  if (key instanceof Set) return new Set(key);
  if (Array.isArray(key)) return new Set(key);
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
  if (!nodeId || !snapshot?.nodes?.[nodeId]) return false;
  const width2 = toFiniteNumber(width),
    height2 = toFiniteNumber(height);
  if (width2 === null || height2 === null) return false;
  const index = snapshot.edges || {},
    result = Number.isFinite(snapshot._edgesRev) ? snapshot._edgesRev : 0;
  ensureEdgeIndex?.(index, result);
  const edgeIds = normalizeEdgeIds(nodeToEdgeIds?.get?.(nodeId));
  if (edgeIds.size === 0) return true;
  return (
    renderEdgesByIds?.(
      edgeIds,
      {
        ...snapshot.nodes,
        [nodeId]: { ...snapshot.nodes[nodeId], width: width2, height: height2 },
      },
      snapshot,
    ),
    true
  );
}
export function installNodeResizeGeometryPreviewer(
  enabled,
  handler,
  ensureEdgeIndex2,
  nodeToEdgeIds2,
  renderEdgesByIds2,
) {
  if (!enabled) return false;
  return (
    (enabled.v2Renderer = enabled.v2Renderer || {}),
    (enabled.v2Renderer.previewNodeResizeGeometry = (data) =>
      previewNodeResizeGeometry(data, {
        snapshot: typeof handler === 'function' ? handler() : null,
        ensureEdgeIndex: ensureEdgeIndex2,
        nodeToEdgeIds: nodeToEdgeIds2,
        renderEdgesByIds: renderEdgesByIds2,
      })),
    true
  );
}
