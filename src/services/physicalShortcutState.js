const pressed = new Set();
export function trackPhysicalShortcutKey(value) {
  if (value['code']) pressed['add'](value['code']);
}
export function releasePhysicalShortcutKey(item) {
  pressed['delete'](item['code']);
}
export function clearPhysicalShortcutKeys() {
  pressed['clear']();
}
export function physicalShortcutTokens(key) {
  if (key['altKey'] && pressed['has']('AltLeft') && pressed['has']('AltRight'))
    return ['AltLeft', 'AltRight'];
  return key['altKey'] ? ['Alt'] : [];
}
