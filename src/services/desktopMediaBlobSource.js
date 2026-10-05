const DESKTOP_PREVIEW_URL_CACHE_TTL_MS = 30 * 60 * 1000,
  desktopPreviewUrlCache = new Map(),
  LOCAL_MEDIA_PATH_PREFIX_RE = /^(?:\/)?(?:output\/|data\/assets\/|data\/uploads\/)/i,
  LOCAL_PREVIEW_SCHEME_RE = /^aic-local-preview:/i,
  MEDIA_MIME_BY_EXT = {
    mp4: 'video/mp4',
    m4v: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
  };
function normalizeUrl(value) {
  const enabled = String(value || '').trim();
  if (!enabled) return '';
  try {
    return new URL(enabled, globalThis.location?.href || 'http://127.0.0.1/').href;
  } catch {
    return enabled;
  }
}
function isDesktopRenderer() {
  return !!globalThis.window?.electronAPI;
}
function isDesktopBlobCandidate(item) {
  return (void item, false);
}
function isLoopbackHost(key) {
  const index = String(key || '').toLowerCase();
  return index === 'localhost' || index === '127.0.0.1' || index === '::1' || index === '[::1]';
}
function normalizeDesktopLocalMediaPath(result) {
  const enabled2 = String(result || '').trim();
  if (!enabled2 || /^(?:blob:|data:|file:)/i.test(enabled2) || LOCAL_PREVIEW_SCHEME_RE.test(enabled2))
    return '';
  let data = enabled2;
  try {
    const uRL = new URL(enabled2, globalThis.location?.href || 'http://127.0.0.1:8777/'),
      options = String(globalThis.location?.origin || ''),
      enabled3 =
        /^https?:$/i.test(uRL.protocol) &&
        ((options && uRL.origin === options) || isLoopbackHost(uRL.hostname));
    if (!enabled3) return '';
    data = uRL.pathname;
  } catch {
    data = enabled2.split(/[?#]/, 1)[0];
  }
  data = String(data || '')
    .replace(/\\/g, '/')
    .split(/[?#]/, 1)[0];
  try {
    data = decodeURIComponent(data);
  } catch {}
  data = data.replace(/^\/+/, '');
  if (!LOCAL_MEDIA_PATH_PREFIX_RE.test(data)) return '';
  return '/' + data;
}
function inferMediaMimeType(target) {
  const enabled4 = String(target || '')
    .split(/[?#]/, 1)[0]
    .match(/\.([a-z0-9]+)$/i);
  if (!enabled4) return '';
  return MEDIA_MIME_BY_EXT[String(enabled4[1] || '').toLowerCase()] || '';
}
function readPreviewCache(source) {
  const response = desktopPreviewUrlCache.get(source);
  if (!response) return '';
  if (Number(response.expiresAt || 0) <= Date.now()) return (desktopPreviewUrlCache.delete(source), '');
  return String(response.url || '');
}
function writePreviewCache(enabled5, url) {
  if (!enabled5 || !url) return;
  desktopPreviewUrlCache.set(enabled5, {
    url: url,
    expiresAt: Date.now() + DESKTOP_PREVIEW_URL_CACHE_TTL_MS,
  });
}
function getMediaElementSource(next) {
  return String(next?.getAttribute?.('src') || next?.currentSrc || next?.src || '').trim();
}
export function getMediaElementCurrentSource(current) {
  return getMediaElementSource(current);
}
export function getMediaElementPlaybackSourceKey(el) {
  const mediaElementSource = getMediaElementSource(el);
  if (!mediaElementSource) return '';
  const entry = String(el?.dataset?.desktopMediaSourceUrl || '').trim();
  if (entry) return entry;
  return mediaElementSource;
}
export function normalizeMediaPlaybackSourceUrl(record) {
  return normalizeUrl(record);
}
export function isMediaElementPlaybackSource(payload, handle) {
  const mediaElementPlaybackSourceKey = getMediaElementPlaybackSourceKey(payload),
    url2 = normalizeUrl(handle);
  return !!mediaElementPlaybackSourceKey && !!url2 && normalizeUrl(mediaElementPlaybackSourceKey) === url2;
}
export function clearDesktopMediaPlaybackSourceMetadata(el2) {
  if (!el2?.dataset) return;
  delete el2.dataset.desktopMediaSourceUrl;
}
function assignMediaElementSource(el3, enabled6, state = 'auto', config = {}) {
  if (!el3 || !enabled6) return '';
  const url3 = normalizeUrl(config.originalSourceUrl || enabled6),
    url4 = normalizeUrl(enabled6),
    mediaElementSource2 = getMediaElementSource(el3),
    scope = String(el3?.dataset?.desktopMediaSourceUrl || '').trim();
  if (
    mediaElementSource2 &&
    (normalizeUrl(mediaElementSource2) === url4 || (scope && normalizeUrl(scope) === url3))
  )
    return mediaElementSource2;
  el3.preload = state || el3.preload || 'auto';
  el3.dataset &&
    (url3 && url4 !== url3
      ? (el3.dataset.desktopMediaSourceUrl = url3)
      : delete el3.dataset.desktopMediaSourceUrl);
  typeof el3.setAttribute === 'function' ? el3.setAttribute('src', enabled6) : (el3.src = enabled6);
  if (config.load !== false)
    try {
      el3.load?.();
    } catch {}
  return enabled6;
}
export async function resolveDesktopMediaPlaybackUrl(input) {
  const url5 = normalizeUrl(input);
  if (!isDesktopRenderer()) return url5;
  const localPath = normalizeDesktopLocalMediaPath(url5 || input);
  if (!localPath) return url5;
  const previewCache = readPreviewCache(localPath);
  if (previewCache) return previewCache;
  const output = globalThis.window?.electronAPI;
  if (typeof output?.getLocalPreviewUrl !== 'function') return url5;
  try {
    const response2 = await output.getLocalPreviewUrl({
        localPath: localPath,
        type: inferMediaMimeType(localPath),
      }),
      value2 = String(response2?.url || response2 || '').trim();
    if (value2) return (writePreviewCache(localPath, value2), value2);
  } catch {}
  return url5;
}
export async function attachDesktopMediaPlaybackSource(enabled7, value3, load = {}) {
  if (!enabled7) return '';
  const originalSourceUrl = normalizeUrl(value3),
    isDesktopRenderer2 = isDesktopRenderer() ? await resolveDesktopMediaPlaybackUrl(value3) : value3;
  return assignMediaElementSource(enabled7, isDesktopRenderer2, load.preload || enabled7.preload, {
    originalSourceUrl: originalSourceUrl,
    load: load.load,
  });
}
export async function attachMediaElementPlaybackSource(enabled8, value4, load2 = {}) {
  if (!enabled8) return '';
  const originalSourceUrl2 = normalizeUrl(value4);
  if (!originalSourceUrl2) return '';
  const isDesktopRenderer3 = isDesktopRenderer() ? await resolveDesktopMediaPlaybackUrl(value4) : value4;
  return assignMediaElementSource(enabled8, isDesktopRenderer3, load2.preload || enabled8.preload, {
    originalSourceUrl: originalSourceUrl2,
    load: load2.load,
  });
}
export const __desktopMediaBlobSourceForTest = {
  clearBlobCacheForTest() {
    desktopPreviewUrlCache.clear();
  },
  isDesktopBlobCandidate: isDesktopBlobCandidate,
  normalizeDesktopLocalMediaPath: normalizeDesktopLocalMediaPath,
  normalizeUrl: normalizeUrl,
  resolveDesktopMediaPlaybackUrl: resolveDesktopMediaPlaybackUrl,
};
