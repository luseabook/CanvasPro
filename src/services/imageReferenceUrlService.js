import { resolveCanvasImagePreviewUrl, resolveCanvasImageThumbUrl } from './canvasMediaLocalService.js';
function pickResultItem(list, value) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const item = Number(value),
    key = Number.isFinite(item) ? Math.max(0, Math.trunc(item)) : 0;
  return list[Math.min(key, list.length - 1)] || null;
}
function firstNonEmptyUrl(...args) {
  for (const index of args) {
    const result = String(index || '').trim();
    if (result) return result;
  }
  return '';
}
function normalizeRemoteHttpImageUrl(data) {
  const enabled = String(data || '').trim();
  if (!enabled) return '';
  try {
    const uRL = new URL(enabled);
    if (uRL.protocol !== 'http:' && uRL.protocol !== 'https:') return '';
    return ((uRL.username = ''), (uRL.password = ''), uRL.href);
  } catch {
    return '';
  }
}
function resolvePendingWebImageUrl(options) {
  const remoteHttpImageUrl = normalizeRemoteHttpImageUrl(options?.webSourceUrl),
    remoteHttpImageUrl2 = normalizeRemoteHttpImageUrl(options?.capturePreviewUrl);
  if (remoteHttpImageUrl2 && (!remoteHttpImageUrl || remoteHttpImageUrl2 === remoteHttpImageUrl))
    return remoteHttpImageUrl2;
  return remoteHttpImageUrl;
}
export function resolveGenerationInputImageUrl(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object') return '';
  if (String(enabled2.type || '') === 'ai-image') {
    const resultItem = pickResultItem(enabled2.images, enabled2.mainImageIndex);
    return firstNonEmptyUrl(
      resolveCanvasImagePreviewUrl(resultItem),
      resolveCanvasImagePreviewUrl(enabled2),
      resolveCanvasImageThumbUrl(resultItem),
      resolveCanvasImageThumbUrl(enabled2),
      resolvePendingWebImageUrl(resultItem),
      resolvePendingWebImageUrl(enabled2),
    );
  }
  return firstNonEmptyUrl(
    resolveCanvasImagePreviewUrl(enabled2),
    resolveCanvasImageThumbUrl(enabled2),
    resolvePendingWebImageUrl(enabled2),
  );
}
