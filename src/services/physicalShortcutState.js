const pressed = new Set();
export function trackPhysicalShortcutKey(_0x48bc34) {
  if (_0x48bc34['code']) pressed['add'](_0x48bc34['code']);
}
export function releasePhysicalShortcutKey(_0x163eb9) {
  pressed['delete'](_0x163eb9['code']);
}
export function clearPhysicalShortcutKeys() {
  pressed['clear']();
}
export function physicalShortcutTokens(_0x2f2ddc) {
  if (_0x2f2ddc['altKey'] && pressed['has']('AltLeft') && pressed['has']('AltRight'))
    return ['AltLeft', 'AltRight'];
  return _0x2f2ddc['altKey'] ? ['Alt'] : [];
}
