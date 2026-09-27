const COLORS = [
  '--blue',
  '--green',
  '--purple',
  '--cyan',
  '--red',
  '--indigo',
  '--group-pink',
  '--warning-text',
];
export function collaborationMemberColor(_0x137cfa) {
  let _0x2185e2 = 0x811c9dc5;
  for (const _0xb75cc5 of String(_0x137cfa?.['id'] || ''))
    _0x2185e2 = Math['imul'](_0x2185e2 ^ _0xb75cc5['charCodeAt'](0x0), 0x1000193) >>> 0x0;
  const _0x222136 = Number['isInteger'](_0x137cfa?.['colorIndex'])
      ? _0x137cfa['colorIndex']
      : _0x2185e2 % 0x18,
    _0x582e8c = 'var(' + COLORS[_0x222136 % COLORS['length']] + ')';
  return _0x222136 < COLORS['length']
    ? _0x582e8c
    : 'color-mix(in srgb, ' +
        _0x582e8c +
        '\x20' +
        (_0x222136 % 0x18 < 0x10 ? 0x46 : 0x2d) +
        '%, var(--text-primary))';
}
