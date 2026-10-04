const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:']);
export function normalizeExternalUrl(value) {
  try {
    const uRL = new URL(String(value || '').trim());
    if (!ALLOWED_EXTERNAL_PROTOCOLS.has(uRL.protocol)) return '';
    return ((uRL.username = ''), (uRL.password = ''), uRL.toString());
  } catch {
    return '';
  }
}
export function isExternalUrlAllowed(item) {
  return Boolean(normalizeExternalUrl(item));
}
export function formatExternalUrlForLog(key) {
  const externalUrl = normalizeExternalUrl(key);
  if (!externalUrl) return '';
  try {
    const uRL2 = new URL(externalUrl);
    return '' + uRL2.origin + uRL2.pathname;
  } catch {
    return '';
  }
}
