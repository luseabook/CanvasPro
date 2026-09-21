const HOST_PORT_RE = /^[^:/?#\s]+:\d+(?:[/?#]|$)/,
  EXPLICIT_PROTOCOL_RE = /^[a-zA-Z][a-zA-Z\d+.-]*:/,
  LOCALHOST_RE = /^localhost(?::\d+)?(?:[/?#]|$)/i,
  IPV4_HOST_RE = /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:[/?#]|$)/,
  BRACKETED_HOST_RE = /^\[[0-9a-f:.]+\](?::\d+)?(?:[/?#]|$)/i;
export const WEB_PREVIEW_DEFAULT_SEARCH_URL_TEMPLATE = 'https://www.baidu.com/s?wd={query}';
export function normalizeWebPreviewUrl(_0x3cd477) {
  const _0x3219ef = String(_0x3cd477 || '').trim();
  if (!_0x3219ef) return '';
  const _0x140b3a = !EXPLICIT_PROTOCOL_RE.test(_0x3219ef) || HOST_PORT_RE.test(_0x3219ef),
    _0x4448ca = _0x140b3a ? 'https://' + _0x3219ef : _0x3219ef;
  try {
    const _0x3f7e8f = new URL(_0x4448ca);
    if (_0x3f7e8f.protocol !== 'http:' && _0x3f7e8f.protocol !== 'https:') return '';
    return ((_0x3f7e8f.username = ''), (_0x3f7e8f.password = ''), _0x3f7e8f.toString());
  } catch {
    return '';
  }
}
export function normalizeWebPreviewFaviconUrl(_0x331924) {
  return normalizeWebPreviewUrl(_0x331924);
}
export function isAllowedWebPreviewUrl(_0x4465eb) {
  return Boolean(normalizeWebPreviewUrl(_0x4465eb));
}
function hasUnsafeExplicitProtocol(_0x2f3012) {
  if (HOST_PORT_RE.test(_0x2f3012)) return false;
  if (!EXPLICIT_PROTOCOL_RE.test(_0x2f3012)) return false;
  return !/^https?:/i.test(_0x2f3012);
}
function hasDomainLikeHost(_0x193207) {
  if (/\s/.test(_0x193207)) return false;
  const _0x1b6053 = _0x193207.split(/[/?#]/, 1)[0] || '';
  return (
    _0x1b6053.includes('.') &&
    !_0x1b6053.startsWith('.') &&
    !_0x1b6053.endsWith('.') &&
    !_0x1b6053.includes('..')
  );
}
function looksLikeWebPreviewUrlInput(_0x2962e1) {
  if (EXPLICIT_PROTOCOL_RE.test(_0x2962e1) || HOST_PORT_RE.test(_0x2962e1)) return true;
  if (/\s/.test(_0x2962e1)) return false;
  return (
    LOCALHOST_RE.test(_0x2962e1) ||
    IPV4_HOST_RE.test(_0x2962e1) ||
    BRACKETED_HOST_RE.test(_0x2962e1) ||
    hasDomainLikeHost(_0x2962e1)
  );
}
export function buildWebPreviewSearchUrl(_0x35a34b, { searchUrlTemplate: searchUrlTemplate = '' } = {}) {
  const _0x4e2169 = String(_0x35a34b || '').trim();
  if (!_0x4e2169) return '';
  const _0x596846 = String(searchUrlTemplate || globalThis.window?.webPreviewSearchUrlTemplate || '')
    .trim()
    .includes('{query}')
    ? String(searchUrlTemplate || globalThis.window?.webPreviewSearchUrlTemplate || '').trim()
    : WEB_PREVIEW_DEFAULT_SEARCH_URL_TEMPLATE;
  return normalizeWebPreviewUrl(_0x596846.replace('{query}', encodeURIComponent(_0x4e2169)));
}
export function normalizeWebPreviewAddressInput(_0x53e592, _0x259ab6 = {}) {
  const _0x18f3d9 = String(_0x53e592 || '').trim();
  if (!_0x18f3d9 || hasUnsafeExplicitProtocol(_0x18f3d9)) return '';
  if (looksLikeWebPreviewUrlInput(_0x18f3d9)) {
    const _0x4090a9 = normalizeWebPreviewUrl(_0x18f3d9);
    if (_0x4090a9) return _0x4090a9;
  }
  return buildWebPreviewSearchUrl(_0x18f3d9, _0x259ab6);
}
