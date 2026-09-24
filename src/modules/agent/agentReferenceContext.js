const DEFAULT_RECENT_CREATION_GROUP_LIMIT = 0x8,
  DEFAULT_RECENT_CREATED_NODE_LIMIT = 0xc;
function normalizeId(_0x5d08f6) {
  return String(_0x5d08f6 || '')['trim']();
}
export function buildAgentReferenceContext({
  canvas: canvas = {},
  operationLedger: operationLedger = [],
  creationGroupLimit: creationGroupLimit = DEFAULT_RECENT_CREATION_GROUP_LIMIT,
  createdNodeLimit: createdNodeLimit = DEFAULT_RECENT_CREATED_NODE_LIMIT,
} = {}) {
  const _0x29070d = new Set(
      (Array['isArray'](canvas['nodes']) ? canvas['nodes'] : [])
        ['map']((_0x2414b9) => normalizeId(_0x2414b9?.['id'] || _0x2414b9?.['nodeId']))
        ['filter'](Boolean),
    ),
    _0x1becab = [],
    _0x5cf335 = [],
    _0x2350d0 = new Set(),
    _0x3adb1c = Array['isArray'](operationLedger) ? operationLedger : [];
  for (let _0x27391d = _0x3adb1c['length'] - 0x1; _0x27391d >= 0x0; _0x27391d -= 0x1) {
    if (_0x5cf335['length'] >= creationGroupLimit || _0x1becab['length'] >= createdNodeLimit) break;
    const _0x175be7 = _0x3adb1c[_0x27391d] || {};
    if (_0x175be7['status'] !== 'success' || _0x175be7['ok'] === ![]) continue;
    const _0x1b3af9 = (Array['isArray'](_0x175be7['createdNodeIds']) ? _0x175be7['createdNodeIds'] : [])
      ['map'](normalizeId)
      ['filter']((_0x4203ef) => _0x4203ef && _0x29070d['has'](_0x4203ef) && !_0x2350d0['has'](_0x4203ef))
      ['slice'](0x0, Math['max'](0x0, createdNodeLimit - _0x1becab['length']));
    if (_0x1b3af9['length'] === 0x0) continue;
    (_0x1b3af9['forEach']((_0x1e62b6) => _0x2350d0['add'](_0x1e62b6)),
      _0x1becab['push'](..._0x1b3af9),
      _0x5cf335['push']({
        operationId: normalizeId(_0x175be7['id'] || _0x175be7['operationId']),
        runId: normalizeId(_0x175be7['runId']),
        commandId: normalizeId(_0x175be7['commandId']),
        nodeIds: _0x1b3af9,
        completedAt: Number(_0x175be7['completedAt'] || _0x175be7['startedAt'] || 0x0),
      }));
  }
  return { recentCreatedNodeIds: _0x1becab, recentCreationGroups: _0x5cf335 };
}
