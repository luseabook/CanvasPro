const CLIPBOARD_GRAPH_SCHEMA_VERSION = 1;
function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}
function normalizeNodeId(item) {
  return String(item || '').trim();
}
function normalizeEdgeList(key) {
  if (Array.isArray(key)) return key;
  if (key && typeof key === 'object') return Object.values(key);
  return [];
}
function normalizeNodeList(index) {
  if (Array.isArray(index)) return index;
  if (Array.isArray(index?.nodes)) return index.nodes;
  return [];
}
export function buildClipboardGraphSnapshot({
  nodesById: nodesById = {},
  edgesById: edgesById = {},
  selectedIds: selectedIds = [],
  sanitizeNode: sanitizeNode = null,
} = {}) {
  const result = Array.isArray(selectedIds) ? selectedIds : [],
    map = new Set(),
    nodes = [];
  for (const data of result) {
    const nodeId = normalizeNodeId(data);
    if (!nodeId || map.has(nodeId)) continue;
    const enabled = nodesById?.[nodeId];
    if (!enabled || typeof enabled !== 'object') continue;
    const deepClone2 = deepClone(enabled),
      enabled2 = typeof sanitizeNode === 'function' ? sanitizeNode(deepClone2) : deepClone2;
    if (!enabled2 || typeof enabled2 !== 'object') continue;
    (map.add(nodeId), nodes.push(enabled2));
  }
  const edges = [];
  for (const enabled3 of normalizeEdgeList(edgesById)) {
    if (!enabled3 || typeof enabled3 !== 'object') continue;
    const nodeId2 = normalizeNodeId(enabled3.sourceId),
      nodeId3 = normalizeNodeId(enabled3.targetId);
    if (!nodeId2 || !nodeId3) continue;
    if (!map.has(nodeId2) || !map.has(nodeId3)) continue;
    edges.push(deepClone(enabled3));
  }
  return { schemaVersion: CLIPBOARD_GRAPH_SCHEMA_VERSION, nodes: nodes, edges: edges };
}
export function normalizeClipboardGraphPayload(options) {
  const list = normalizeNodeList(options).filter((item2) => item2 && typeof item2 === 'object'),
    edgeList = normalizeEdgeList(options?.edges).filter((item3) => item3 && typeof item3 === 'object');
  if (list.length === 0) return null;
  return {
    schemaVersion: CLIPBOARD_GRAPH_SCHEMA_VERSION,
    nodes: deepClone(list),
    edges: deepClone(edgeList),
  };
}
export function prepareClipboardGraphPaste({
  graph: graph,
  x: x = 0,
  y: y = 0,
  generateNodeId: generateNodeId = null,
  generateEdgeId: generateEdgeId = null,
  sanitizeNode: sanitizeNode = null,
} = {}) {
  const clipboardGraphPayload = normalizeClipboardGraphPayload(graph);
  if (!clipboardGraphPayload) return { nodes: [], edges: [], newIds: [], idMap: {} };
  const target = Number.isFinite(Number(x)) ? Number(x) : 0,
    source = Number.isFinite(Number(y)) ? Number(y) : 0;
  let next = Infinity,
    current = Infinity;
  for (const box of clipboardGraphPayload.nodes) {
    const entry = Number(box.x),
      record = Number(box.y);
    if (Number.isFinite(entry)) next = Math.min(next, entry);
    if (Number.isFinite(record)) current = Math.min(current, record);
  }
  if (!Number.isFinite(next)) next = 0;
  if (!Number.isFinite(current)) current = 0;
  const idMap = {},
    nodes2 = [],
    newIds = [],
    payload = Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  clipboardGraphPayload.nodes.forEach((item4, handle) => {
    const box2 = deepClone(item4),
      nodeId4 = normalizeNodeId(box2.id) || 'clipboard-node-' + handle,
      state =
        typeof generateNodeId === 'function'
          ? generateNodeId(nodeId4, handle, box2)
          : nodeId4 + '_copy_' + payload + '_' + handle,
      config = Number(box2.x),
      scope = Number(box2.y),
      input = Number.isFinite(config) ? config - next : 0,
      output = Number.isFinite(scope) ? scope - current : 0;
    ((box2.id = state), (box2.x = target + input), (box2.y = source + output));
    const enabled4 = typeof sanitizeNode === 'function' ? sanitizeNode(box2) : box2;
    if (!enabled4 || typeof enabled4 !== 'object') return;
    ((idMap[nodeId4] = state), nodes2.push(enabled4), newIds.push(state));
  });
  const edges2 = [];
  return (
    clipboardGraphPayload.edges.forEach((item5, value2) => {
      const nodeId5 = normalizeNodeId(item5.sourceId),
        nodeId6 = normalizeNodeId(item5.targetId),
        sourceId = idMap[nodeId5],
        targetId = idMap[nodeId6];
      if (!sourceId || !targetId) return;
      const id =
        typeof generateEdgeId === 'function'
          ? generateEdgeId(normalizeNodeId(item5.id), value2, item5)
          : 'edge_copy_' + payload + '_' + value2;
      edges2.push({ ...deepClone(item5), id: id, sourceId: sourceId, targetId: targetId });
    }),
    { nodes: nodes2, edges: edges2, newIds: newIds, idMap: idMap }
  );
}
