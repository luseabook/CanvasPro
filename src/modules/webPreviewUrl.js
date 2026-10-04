const HOST_PORT_RE = /^[^:/?#\s]+:\d+(?:[/?#]|$)/,
  EXPLICIT_PROTOCOL_RE = /^[a-zA-Z][a-zA-Z\d+.-]*:/,
  LOCALHOST_RE = /^localhost(?::\d+)?(?:[/?#]|$)/i,
  IPV4_HOST_RE = /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:[/?#]|$)/,
  BRACKETED_HOST_RE = /^\[[0-9a-f:.]+\](?::\d+)?(?:[/?#]|$)/i;
export const WEB_PREVIEW_DEFAULT_SEARCH_URL_TEMPLATE = 'https://www.baidu.com/s?wd={query}';
export function normalizeWebPreviewUrl(value) {
  const enabled = String(value || '').trim();
  if (!enabled) return '';
  const item = !EXPLICIT_PROTOCOL_RE.test(enabled) || HOST_PORT_RE.test(enabled),
    key = item ? 'https://' + enabled : enabled;
  try {
    const uRL = new URL(key);
    if (uRL.protocol !== 'http:' && uRL.protocol !== 'https:') return '';
    return ((uRL.username = ''), (uRL.password = ''), uRL.toString());
  } catch {
    return '';
  }
}
export function normalizeWebPreviewFaviconUrl(index) {
  return normalizeWebPreviewUrl(index);
}
export function isAllowedWebPreviewUrl(result) {
  return Boolean(normalizeWebPreviewUrl(result));
}
function hasUnsafeExplicitProtocol(data) {
  if (HOST_PORT_RE.test(data)) return false;
  if (!EXPLICIT_PROTOCOL_RE.test(data)) return false;
  return !/^https?:/i.test(data);
}
function hasDomainLikeHost(options) {
  if (/\s/.test(options)) return false;
  const list = options.split(/[/?#]/, 1)[0] || '';
  return list.includes('.') && !list.startsWith('.') && !list.endsWith('.') && !list.includes('..');
}
function looksLikeWebPreviewUrlInput(target) {
  if (EXPLICIT_PROTOCOL_RE.test(target) || HOST_PORT_RE.test(target)) return true;
  if (/\s/.test(target)) return false;
  return (
    LOCALHOST_RE.test(target) ||
    IPV4_HOST_RE.test(target) ||
    BRACKETED_HOST_RE.test(target) ||
    hasDomainLikeHost(target)
  );
}
export function buildWebPreviewSearchUrl(source, { searchUrlTemplate: searchUrlTemplate = '' } = {}) {
  const enabled2 = String(source || '').trim();
  if (!enabled2) return '';
  const next = String(searchUrlTemplate || globalThis.window?.webPreviewSearchUrlTemplate || '')
    .trim()
    .includes('{query}')
    ? String(searchUrlTemplate || globalThis.window?.webPreviewSearchUrlTemplate || '').trim()
    : WEB_PREVIEW_DEFAULT_SEARCH_URL_TEMPLATE;
  return normalizeWebPreviewUrl(next.replace('{query}', encodeURIComponent(enabled2)));
}
export function normalizeWebPreviewAddressInput(current, entry = {}) {
  const enabled3 = String(current || '').trim();
  if (!enabled3 || hasUnsafeExplicitProtocol(enabled3)) return '';
  if (looksLikeWebPreviewUrlInput(enabled3)) {
    const webPreviewUrl = normalizeWebPreviewUrl(enabled3);
    if (webPreviewUrl) return webPreviewUrl;
  }
  return buildWebPreviewSearchUrl(enabled3, entry);
}
