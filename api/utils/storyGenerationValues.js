export function normalizeText(_0x529ca3) {
  return String(_0x529ca3 || '')['trim']();
}
export function normalizeStringArray(_0x148f2c) {
  return Array['isArray'](_0x148f2c) ? [...new Set(_0x148f2c['map'](normalizeText)['filter'](Boolean))] : [];
}
export function normalizePositiveNumber(_0x3e0665) {
  const _0x1753c0 = Number(_0x3e0665);
  return Number['isFinite'](_0x1753c0) && _0x1753c0 > 0x0 ? _0x1753c0 : 0x0;
}
