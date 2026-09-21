export function isSameStringOrder(_0x1c4004, _0x285bf3) {
  if (!Array.isArray(_0x1c4004) || !Array.isArray(_0x285bf3)) return false;
  if (_0x1c4004.length !== _0x285bf3.length) return false;
  for (let _0x1dea16 = 0; _0x1dea16 < _0x1c4004.length; _0x1dea16 += 1) {
    if (String(_0x1c4004[_0x1dea16] ?? '') !== String(_0x285bf3[_0x1dea16] ?? '')) return false;
  }
  return true;
}
