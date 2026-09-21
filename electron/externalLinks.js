const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:']);
export function normalizeExternalUrl(_0x3dd91f) {
  try {
    const _0x20630c = new URL(String(_0x3dd91f || '').trim());
    if (!ALLOWED_EXTERNAL_PROTOCOLS.has(_0x20630c.protocol)) return '';
    return ((_0x20630c.username = ''), (_0x20630c.password = ''), _0x20630c.toString());
  } catch {
    return '';
  }
}
export function isExternalUrlAllowed(_0x472f19) {
  return Boolean(normalizeExternalUrl(_0x472f19));
}
export function formatExternalUrlForLog(_0x354114) {
  const _0x318290 = normalizeExternalUrl(_0x354114);
  if (!_0x318290) return '';
  try {
    const _0x23ccda = new URL(_0x318290);
    return '' + _0x23ccda.origin + _0x23ccda.pathname;
  } catch {
    return '';
  }
}
