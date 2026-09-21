const CLIPBOARD_GRAPH_SCHEMA_VERSION = 1;
function deepClone(_0x1d1bef) {
  return JSON.parse(JSON.stringify(_0x1d1bef));
}
function normalizeNodeId(_0x517451) {
  return String(_0x517451 || '').trim();
}
function normalizeEdgeList(_0x4e48d0) {
  if (Array.isArray(_0x4e48d0)) return _0x4e48d0;
  if (_0x4e48d0 && typeof _0x4e48d0 === 'object') return Object.values(_0x4e48d0);
  return [];
}
function normalizeNodeList(_0x5a5e61) {
  if (Array.isArray(_0x5a5e61)) return _0x5a5e61;
  if (Array.isArray(_0x5a5e61?.nodes)) return _0x5a5e61.nodes;
  return [];
}
export function buildClipboardGraphSnapshot({
  nodesById: nodesById = {},
  edgesById: edgesById = {},
  selectedIds: selectedIds = [],
  sanitizeNode: sanitizeNode = null,
} = {}) {
  const _0x42b7ac = Array.isArray(selectedIds) ? selectedIds : [],
    _0x3a5529 = new Set(),
    _0x29fbdd = [];
  for (const _0xb6929b of _0x42b7ac) {
    const _0x39b785 = normalizeNodeId(_0xb6929b);
    if (!_0x39b785 || _0x3a5529.has(_0x39b785)) continue;
    const _0x5c746e = nodesById?.[_0x39b785];
    if (!_0x5c746e || typeof _0x5c746e !== 'object') continue;
    const _0x18684b = deepClone(_0x5c746e),
      _0x546306 = typeof sanitizeNode === 'function' ? sanitizeNode(_0x18684b) : _0x18684b;
    if (!_0x546306 || typeof _0x546306 !== 'object') continue;
    (_0x3a5529.add(_0x39b785), _0x29fbdd.push(_0x546306));
  }
  const _0xadb3f1 = [];
  for (const _0x3e057d of normalizeEdgeList(edgesById)) {
    if (!_0x3e057d || typeof _0x3e057d !== 'object') continue;
    const _0x5d51e6 = normalizeNodeId(_0x3e057d.sourceId),
      _0x38dc0e = normalizeNodeId(_0x3e057d.targetId);
    if (!_0x5d51e6 || !_0x38dc0e) continue;
    if (!_0x3a5529.has(_0x5d51e6) || !_0x3a5529.has(_0x38dc0e)) continue;
    _0xadb3f1.push(deepClone(_0x3e057d));
  }
  return { schemaVersion: CLIPBOARD_GRAPH_SCHEMA_VERSION, nodes: _0x29fbdd, edges: _0xadb3f1 };
}
export function normalizeClipboardGraphPayload(_0x3903a2) {
  const _0x713262 = normalizeNodeList(_0x3903a2).filter(
      (_0x1f05c1) => _0x1f05c1 && typeof _0x1f05c1 === 'object',
    ),
    _0x5bfeb1 = normalizeEdgeList(_0x3903a2?.edges).filter(
      (_0x2f7490) => _0x2f7490 && typeof _0x2f7490 === 'object',
    );
  if (_0x713262.length === 0) return null;
  return {
    schemaVersion: CLIPBOARD_GRAPH_SCHEMA_VERSION,
    nodes: deepClone(_0x713262),
    edges: deepClone(_0x5bfeb1),
  };
}
export function prepareClipboardGraphPaste({
  graph: _0x465e4f,
  x: x = 0,
  y: y = 0,
  generateNodeId: generateNodeId = null,
  generateEdgeId: generateEdgeId = null,
  sanitizeNode: sanitizeNode = null,
} = {}) {
  const _0x8687bb = normalizeClipboardGraphPayload(_0x465e4f);
  if (!_0x8687bb) return { nodes: [], edges: [], newIds: [], idMap: {} };
  const _0x259667 = Number.isFinite(Number(x)) ? Number(x) : 0,
    _0x5b5105 = Number.isFinite(Number(y)) ? Number(y) : 0;
  let _0x3015f3 = Infinity,
    _0x4c151c = Infinity;
  for (const _0x13f267 of _0x8687bb.nodes) {
    const _0x340218 = Number(_0x13f267.x),
      _0x2e145e = Number(_0x13f267.y);
    if (Number.isFinite(_0x340218)) _0x3015f3 = Math.min(_0x3015f3, _0x340218);
    if (Number.isFinite(_0x2e145e)) _0x4c151c = Math.min(_0x4c151c, _0x2e145e);
  }
  if (!Number.isFinite(_0x3015f3)) _0x3015f3 = 0;
  if (!Number.isFinite(_0x4c151c)) _0x4c151c = 0;
  const _0x535723 = {},
    _0x5eee9f = [],
    _0x5d6268 = [],
    _0xae7ee7 = Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  _0x8687bb.nodes.forEach((_0x33269e, _0x2686c9) => {
    const _0x1d9d93 = deepClone(_0x33269e),
      _0x243090 = normalizeNodeId(_0x1d9d93.id) || 'clipboard-node-' + _0x2686c9,
      _0x29c8f6 =
        typeof generateNodeId === 'function'
          ? generateNodeId(_0x243090, _0x2686c9, _0x1d9d93)
          : _0x243090 + '_copy_' + _0xae7ee7 + '_' + _0x2686c9,
      _0xcf07a1 = Number(_0x1d9d93.x),
      _0x453939 = Number(_0x1d9d93.y),
      _0x5ba78d = Number.isFinite(_0xcf07a1) ? _0xcf07a1 - _0x3015f3 : 0,
      _0xad4099 = Number.isFinite(_0x453939) ? _0x453939 - _0x4c151c : 0;
    ((_0x1d9d93.id = _0x29c8f6),
      (_0x1d9d93.x = _0x259667 + _0x5ba78d),
      (_0x1d9d93.y = _0x5b5105 + _0xad4099));
    const _0x38a25e = typeof sanitizeNode === 'function' ? sanitizeNode(_0x1d9d93) : _0x1d9d93;
    if (!_0x38a25e || typeof _0x38a25e !== 'object') return;
    ((_0x535723[_0x243090] = _0x29c8f6), _0x5eee9f.push(_0x38a25e), _0x5d6268.push(_0x29c8f6));
  });
  const _0x4fb567 = [];
  return (
    _0x8687bb.edges.forEach((_0x56c18f, _0x5bf73d) => {
      const _0x1b738d = normalizeNodeId(_0x56c18f.sourceId),
        _0x35a486 = normalizeNodeId(_0x56c18f.targetId),
        _0x43c845 = _0x535723[_0x1b738d],
        _0xb1e5fe = _0x535723[_0x35a486];
      if (!_0x43c845 || !_0xb1e5fe) return;
      const _0xf1709d =
        typeof generateEdgeId === 'function'
          ? generateEdgeId(normalizeNodeId(_0x56c18f.id), _0x5bf73d, _0x56c18f)
          : 'edge_copy_' + _0xae7ee7 + '_' + _0x5bf73d;
      _0x4fb567.push({ ...deepClone(_0x56c18f), id: _0xf1709d, sourceId: _0x43c845, targetId: _0xb1e5fe });
    }),
    { nodes: _0x5eee9f, edges: _0x4fb567, newIds: _0x5d6268, idMap: _0x535723 }
  );
}
