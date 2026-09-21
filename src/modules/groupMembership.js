function cleanText(_0x3dda69) {
  return String(_0x3dda69 ?? '').trim();
}
function normalizeNodeList(_0x337cfa) {
  return Array.isArray(_0x337cfa)
    ? _0x337cfa
    : _0x337cfa && typeof _0x337cfa === 'object'
      ? Object.values(_0x337cfa)
      : [];
}
function isGroupNode(_0x2f4343) {
  return cleanText(_0x2f4343?.type).toLowerCase() === 'group';
}
function nodeSize(_0x6774c9) {
  const _0x18ab29 = isGroupNode(_0x6774c9);
  return {
    width: Number(_0x6774c9?.width ?? _0x6774c9?.w) || (_0x18ab29 ? 0x190 : 0x104),
    height: Number(_0x6774c9?.height ?? _0x6774c9?.h) || (_0x18ab29 ? 0x12c : 100),
  };
}
function isNodeContainedInGroup(_0x47fb79, _0x1d6a5d) {
  if (!_0x47fb79 || !_0x1d6a5d) return false;
  const _0x5e64cf = nodeSize(_0x47fb79),
    _0xf327b2 = nodeSize(_0x1d6a5d),
    _0x20bc7a = Number(_0x47fb79.x) || 0,
    _0x4f27b9 = Number(_0x47fb79.y) || 0,
    _0x1cceab = Number(_0x1d6a5d.x) || 0,
    _0x26b26f = Number(_0x1d6a5d.y) || 0;
  return (
    _0x20bc7a >= _0x1cceab &&
    _0x4f27b9 >= _0x26b26f &&
    _0x20bc7a + _0x5e64cf.width <= _0x1cceab + _0xf327b2.width &&
    _0x4f27b9 + _0x5e64cf.height <= _0x26b26f + _0xf327b2.height
  );
}
function findContainingGroup(_0x40c1bb, _0x5d1e92) {
  for (const _0x35c66a of _0x5d1e92) {
    if (isNodeContainedInGroup(_0x40c1bb, _0x35c66a)) return cleanText(_0x35c66a.id);
  }
  return null;
}
export function collectGroupContainmentReparentOps(_0x26560a, _0x19b6ae) {
  const _0xc46869 = normalizeNodeList(_0x26560a).filter(Boolean),
    _0xbac86e = new Map(
      _0xc46869.map((_0x16ba75) => [cleanText(_0x16ba75?.id), _0x16ba75]).filter(([_0x17f3e0]) => _0x17f3e0),
    ),
    _0x133cd4 = Array.isArray(_0x19b6ae) ? _0x19b6ae.map(cleanText).filter(Boolean) : [],
    _0x27cacb = _0xc46869.filter(isGroupNode),
    _0x26d35d = [];
  for (const _0x29fa4f of _0x133cd4) {
    const _0x4984b1 = _0xbac86e.get(_0x29fa4f);
    if (!_0x4984b1) continue;
    if (!isGroupNode(_0x4984b1)) {
      const _0xa63182 = findContainingGroup(_0x4984b1, _0x27cacb);
      (_0x4984b1.parentId || null) !== (_0xa63182 || null) &&
        _0x26d35d.push({ nodeId: _0x29fa4f, parentId: _0xa63182 });
      continue;
    }
    for (const _0x30e769 of _0xc46869) {
      if (isGroupNode(_0x30e769)) continue;
      const _0x4dc88d = cleanText(_0x30e769?.id);
      if (!_0x4dc88d) continue;
      const _0x4fd0 = isNodeContainedInGroup(_0x30e769, _0x4984b1);
      if (_0x4fd0 && _0x30e769.parentId !== _0x29fa4f)
        _0x26d35d.push({ nodeId: _0x4dc88d, parentId: _0x29fa4f });
      else
        !_0x4fd0 && _0x30e769.parentId === _0x29fa4f && _0x26d35d.push({ nodeId: _0x4dc88d, parentId: null });
    }
  }
  return _0x26d35d;
}
