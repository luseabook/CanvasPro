export function isGroupNodeData(_0x4eeb65) {
  return String(_0x4eeb65?.type || '').trim() === 'group';
}
export function wouldCreateGroupOutputCycle({
  sourceId: _0xa97a77,
  targetId: _0x2302c4,
  nodes: _0x1d7e98,
  edges: _0x5b0206,
} = {}) {
  const _0x522165 = String(_0xa97a77 || '').trim(),
    _0xbc2cf0 = String(_0x2302c4 || '').trim();
  if (!_0x522165 || !_0xbc2cf0) return false;
  if (_0x522165 === _0xbc2cf0) return true;
  if (!isGroupNodeData(_0x1d7e98?.[_0x522165])) return false;
  if (!isGroupNodeData(_0x1d7e98?.[_0xbc2cf0])) return false;
  const _0xb45fce = [_0xbc2cf0],
    _0x2418f0 = new Set();
  while (_0xb45fce.length > 0) {
    const _0x1bd8ed = _0xb45fce.shift();
    if (!_0x1bd8ed || _0x2418f0.has(_0x1bd8ed)) continue;
    _0x2418f0.add(_0x1bd8ed);
    if (_0x1bd8ed === _0x522165) return true;
    for (const _0x182e86 of Object.values(_0x5b0206 || {})) {
      if (!_0x182e86 || String(_0x182e86.sourceId || '') !== _0x1bd8ed) continue;
      const _0x53325f = String(_0x182e86.targetId || '').trim();
      if (!isGroupNodeData(_0x1d7e98?.[_0x53325f])) continue;
      if (_0x53325f === _0x522165) return true;
      if (!_0x2418f0.has(_0x53325f)) _0xb45fce.push(_0x53325f);
    }
  }
  return false;
}
export function getDirectGroupChildNodes(_0x486feb, _0x12a7fb) {
  const _0x4cde9c = String(_0x12a7fb || '');
  if (!_0x4cde9c) return [];
  return Object.values(_0x486feb || {}).filter((_0x35e289) => {
    if (!_0x35e289 || String(_0x35e289.id || '') === _0x4cde9c) return false;
    if (String(_0x35e289.parentId || '') !== _0x4cde9c) return false;
    return !isGroupNodeData(_0x35e289);
  });
}
export function buildGroupOutputMembershipSignature(_0x4a2787, _0x4a4b2b) {
  if (!isGroupNodeData(_0x4a2787)) return '';
  return getDirectGroupChildNodes(_0x4a4b2b, _0x4a2787.id)
    .map((_0x2ec8c1) => {
      const _0x50d048 = typeof _0x2ec8c1?._bizRev === 'number' ? _0x2ec8c1._bizRev : 0;
      return (_0x2ec8c1.id || '') + ':' + _0x50d048;
    })
    .join('|');
}
function sortGroupChildrenBySavedOutputOrder(_0x1b3999, _0x4270a1) {
  if (!Array.isArray(_0x4270a1) || _0x4270a1.length === 0) return _0x1b3999;
  const _0x1d394b = new Map();
  _0x4270a1.forEach((_0x440c04, _0x46f36b) => {
    const _0x187a37 = String(_0x440c04 || '').trim();
    _0x187a37 && !_0x1d394b.has(_0x187a37) && _0x1d394b.set(_0x187a37, _0x46f36b);
  });
  if (_0x1d394b.size === 0) return _0x1b3999;
  return _0x1b3999
    .map((_0x2eeb95, _0xfc1ba7) => ({ node: _0x2eeb95, index: _0xfc1ba7 }))
    .sort((_0x7a8727, _0x31dbba) => {
      const _0x3798e1 = _0x1d394b.has(_0x7a8727.node?.id) ? _0x1d394b.get(_0x7a8727.node.id) : Infinity,
        _0x215505 = _0x1d394b.has(_0x31dbba.node?.id) ? _0x1d394b.get(_0x31dbba.node.id) : Infinity;
      if (_0x3798e1 !== _0x215505) return _0x3798e1 - _0x215505;
      return _0x7a8727.index - _0x31dbba.index;
    })
    .map((_0x418569) => _0x418569.node);
}
export function resolveGroupOutputSourceOrder(_0x326089, _0x4bf2ff) {
  const _0x558bc6 = String(_0x4bf2ff || '').trim(),
    _0x17f03d = _0x326089?.groupOutputSourceOrderByTarget;
  if (
    _0x558bc6 &&
    _0x17f03d &&
    typeof _0x17f03d === 'object' &&
    !Array.isArray(_0x17f03d) &&
    Array.isArray(_0x17f03d[_0x558bc6])
  )
    return _0x17f03d[_0x558bc6];
  const _0x3c7b82 = String(_0x326089?.targetId || '').trim();
  if (_0x558bc6 && _0x3c7b82 && _0x3c7b82 !== _0x558bc6) return [];
  return _0x326089?.groupOutputSourceOrder;
}
export function collectGroupOutputIncomingEdges({
  edge: _0x299ad6,
  groupNode: _0x493723,
  nodes: _0x8dcc10,
  targetId: _0x1fbc1b,
  policy: _0x2e981a,
  counts: _0x23a89e,
  directSourceIds: _0x422e53,
  acceptSource: _0xa861ef,
  canAppendInputKindWithinLimit: _0x36e186,
  reserveInputSlot: reserveInputSlot = null,
}) {
  const _0x19cf92 = String(_0x493723?.id || _0x299ad6?.sourceId || ''),
    _0x21e9ee = [],
    _0x4b6575 = sortGroupChildrenBySavedOutputOrder(
      getDirectGroupChildNodes(_0x8dcc10, _0x19cf92),
      resolveGroupOutputSourceOrder(_0x299ad6, _0x1fbc1b),
    );
  for (const _0x48d63a of _0x4b6575) {
    if (!_0x48d63a?.id || _0x48d63a.id === _0x1fbc1b) continue;
    const _0x1b748b = _0xa861ef(_0x48d63a, _0x299ad6);
    if (!_0x1b748b || _0x422e53.has(_0x48d63a.id)) continue;
    if (!_0x36e186(_0x2e981a, _0x1b748b, _0x23a89e)) continue;
    let _0x6ad57a = '';
    if (typeof reserveInputSlot === 'function') {
      const _0x131145 = { ..._0x299ad6, refSlot: '', sourceId: _0x48d63a.id },
        _0x339b35 = reserveInputSlot(_0x1b748b, _0x131145);
      if (!_0x339b35) continue;
      if (typeof _0x339b35 === 'string') _0x6ad57a = _0x339b35;
    }
    (_0x21e9ee.push({
      ..._0x299ad6,
      id: _0x299ad6.id + '::group-output::' + _0x48d63a.id,
      sourceId: _0x48d63a.id,
      ...(_0x6ad57a ? { refSlot: _0x6ad57a } : null),
      isGroupOutput: true,
      outputGroupId: _0x19cf92,
      groupOutputEdgeId: _0x299ad6.id,
      effectiveTargetId: _0x1fbc1b,
    }),
      _0x422e53.add(_0x48d63a.id),
      (_0x23a89e[_0x1b748b] = (_0x23a89e[_0x1b748b] || 0) + 1));
  }
  return _0x21e9ee;
}
