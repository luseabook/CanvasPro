const free = { ready: !![], allowed: () => !![], wait: Promise['resolve'](!![]), finish() {} };
export function beginNodeEditInteraction(_0x2b5860, _0x40a7dc) {
  return _0x2b5860?.['getGraphMutationPolicy']?.()?.['beginInteraction']?.([...new Set(_0x40a7dc)]) || free;
}
export function deferNodeEditCompletion(
  _0x5e1775,
  _0x401425,
  _0x950aa9 = () => !![],
  _0xe927f4 = globalThis['window'],
) {
  if (!_0x5e1775 || _0x5e1775['ready'] || !_0x5e1775['wait']) return ![];
  let _0x41a280 = ![];
  const _0x1a8df4 = ['pointerdown', 'pointercancel', 'keydown', 'blur'],
    _0xf37d84 = (_0x167d96) => {
      if (_0x41a280) return;
      ((_0x41a280 = !![]), clearTimeout(_0x5d90d5));
      for (const _0x71968d of _0x1a8df4) _0xe927f4?.['removeEventListener']?.(_0x71968d, _0x4be19a, !![]);
      _0x401425(_0x167d96 && _0x5e1775['allowed']() && _0x950aa9());
    },
    _0x4be19a = () => _0xf37d84(![]),
    _0x5d90d5 = setTimeout(_0x4be19a, 0x2710);
  for (const _0x25911b of _0x1a8df4) _0xe927f4?.['addEventListener']?.(_0x25911b, _0x4be19a, !![]);
  return (void _0x5e1775['wait']['then'](_0xf37d84, _0x4be19a), !![]);
}
