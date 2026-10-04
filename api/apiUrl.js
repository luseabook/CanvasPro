export function getApiBase() {
  try {
    if (typeof location !== 'undefined' && location.protocol === 'file:') return 'http://127.0.0.1:8777';
  } catch {}
  return '';
}
export function buildApiUrl(value) {
  const apiBase = getApiBase(),
    enabled = String(value || '');
  if (!enabled) return apiBase || '';
  if (!enabled.startsWith('/')) return apiBase + '/' + enabled;
  return '' + apiBase + enabled;
}
