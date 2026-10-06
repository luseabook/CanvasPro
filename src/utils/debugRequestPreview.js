import { buildDebugJsonPreview } from './debugImagePreview.js';
import { maskDebugBearer, maskDebugHeaders, maskDebugPayloadSecrets } from './debugRequestMasking.js';
export const DEBUG_WRENCH_ICON_HTML =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
export function applyDebugWrenchIcon(el) {
  if (!el) return;
  el.innerHTML = DEBUG_WRENCH_ICON_HTML;
}
export function buildFinalApiDebugRequest(response, value = {}) {
  const method = value.method || 'POST',
    url = String(response?.url || ''),
    args = { ...(response?.body || {}) },
    apiUrl = String(response?.apiUrl || args.apiUrl || '');
  let item = response?.headers || { 'Content-Type': 'application/json' },
    key = args;
  if (args.apiUrl && url.startsWith('/api/v2/proxy/')) {
    const index = args.apiKey || '';
    ((key = { ...args }),
      delete key.apiUrl,
      delete key.apiKey,
      (item = index ? { 'Content-Type': 'application/json', Authorization: maskDebugBearer(index) } : item));
  } else url === '/api/v2/runninghubwf/run' && (item = { 'Content-Type': 'application/json' });
  return {
    method: method,
    url: url,
    apiUrl: apiUrl,
    headers: maskDebugHeaders(item),
    payload: maskDebugPayloadSecrets(key),
  };
}
export function formatFinalApiDebugRequest(result, data = {}) {
  const response2 = buildFinalApiDebugRequest(result, data);
  return (
    '🎯 [最终发给 API 的参数]\n\nmethod = "' +
    response2.method +
    '"\n\nurl = "' +
    response2.url +
    '"\n\napiUrl = "' +
    response2.apiUrl +
    '"\n\nheaders = ' +
    JSON.stringify(response2.headers, null, 2) +
    '\n\npayload = ' +
    JSON.stringify(response2.payload, null, 2)
  );
}

const LOCAL_PROXY_ONLY_PAYLOAD_KEYS = Object.freeze([
  '__aicAllowTaskProbe',
  '__aicModelCatalogId',
  'installId',
  'install_id',
  'deviceId',
  'device_id',
]);

export function buildFinalApiDebugPreview(options, target = {}) {
  const formatFinalApiDebugRequest2 = formatFinalApiDebugRequest(options, target),
    debugJsonPreview = buildDebugJsonPreview(buildFinalApiDebugRequest(options, target).payload),
    source = formatFinalApiDebugRequest2.length - debugJsonPreview.content.length;
  return {
    outputText: formatFinalApiDebugRequest2,
    images: debugJsonPreview.images.map((args2) => ({
      ...args2,
      start: args2.start + source,
      end: args2.end + source,
    })),
  };
}
