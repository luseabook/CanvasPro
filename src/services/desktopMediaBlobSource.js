import { desktopBridge } from './desktopBridge.js';
const DESKTOP_PREVIEW_URL_CACHE_TTL_MS = 30 * 60 * 1000,
  desktopPreviewUrlCache = new Map(),
  desktopPreviewUrlPendingCache = new Map(),
  LOCAL_MEDIA_PATH_PREFIX_RE = /^(?:\/)?(?:output\/|data\/assets\/|data\/uploads\/)/i,
  LOCAL_PREVIEW_SCHEME_RE = /^aic-local-preview:/i,
  DIRECT_LOCAL_MEDIA_FLAG_RE = /^(1|true|yes|on)$/i,
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
function nowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}
function markMediaSourceAttach(payload = {}) {
  globalThis.window?.__runtimeCompareMark?.('media-source-attach:complete', payload);
}
function isDesktopRenderer() {
  return desktopBridge.mediaPreview.isAvailable();
}
// 诊断开关：强制走直连 http 本地地址，绕过 desktop 本地预览 URL 协商。
function shouldUseDirectLocalMediaSource() {
  const windowObject = globalThis.window || {},
    diagnosticFlag =
      windowObject.__AIC_ALLOW_DIRECT_LOCAL_MEDIA_DIAGNOSTIC__ ??
      globalThis.__AIC_ALLOW_DIRECT_LOCAL_MEDIA_DIAGNOSTIC__;
  if (!DIRECT_LOCAL_MEDIA_FLAG_RE.test(String(diagnosticFlag || '').trim())) return false;
  const directFlag =
    windowObject.__AIC_DIRECT_LOCAL_MEDIA__ ??
    windowObject.__AIC_DESKTOP_MEDIA_DIRECT_HTTP__ ??
    globalThis.__AIC_DIRECT_LOCAL_MEDIA__;
  return DIRECT_LOCAL_MEDIA_FLAG_RE.test(String(directFlag || '').trim());
}
function isDesktopBlobCandidate(item) {
  return (void item, false);
}
function isLoopbackHost(host) {
  const normalized = String(host || '').toLowerCase();
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '[::1]'
  );
}
function normalizeDesktopLocalMediaPath(target) {
  const trimmed = String(target || '').trim();
  if (!trimmed || /^(?:blob:|data:|file:)/i.test(trimmed) || LOCAL_PREVIEW_SCHEME_RE.test(trimmed))
    return '';
  let path = trimmed;
  try {
    const parsed = new URL(trimmed, globalThis.location?.href || 'http://127.0.0.1:8777/'),
      origin = String(globalThis.location?.origin || ''),
      isLocalOrigin =
        /^https?:$/i.test(parsed.protocol) &&
        ((origin && parsed.origin === origin) || isLoopbackHost(parsed.hostname));
    if (!isLocalOrigin) return '';
    path = parsed.pathname;
  } catch {
    path = trimmed.split(/[?#]/, 1)[0];
  }
  path = String(path || '')
    .replace(/\\/g, '/')
    .split(/[?#]/, 1)[0];
  try {
    path = decodeURIComponent(path);
  } catch {}
  path = path.replace(/^\/+/, '');
  if (!LOCAL_MEDIA_PATH_PREFIX_RE.test(path)) return '';
  return '/' + path;
}
function inferMediaMimeType(target) {
  const matched = String(target || '')
    .split(/[?#]/, 1)[0]
    .match(/\.([a-z0-9]+)$/i);
  if (!matched) return '';
  return MEDIA_MIME_BY_EXT[String(matched[1] || '').toLowerCase()] || '';
}
// chrome-shell 下 audio 元素与本地预览地址同源不一致会触发混合内容拦截，
// 这里在 127.0.0.1 / localhost 之间做一次等价改写。
function resolveChromeShellAudioPlaybackUrl(el, url) {
  if (!desktopBridge.isChromeShell || String(el?.tagName || '').toLowerCase() !== 'audio') return url;
  const normalized = normalizeUrl(url),
    localPath = normalizeDesktopLocalMediaPath(normalized);
  if (!localPath) return normalized;
  try {
    const origin = String(globalThis.location?.origin || ''),
      parsed = new URL(normalized);
    if (origin && parsed.origin !== origin) return normalized;
    if (parsed.hostname === '127.0.0.1') parsed.hostname = 'localhost';
    else if (parsed.hostname === 'localhost') parsed.hostname = '127.0.0.1';
    else return normalized;
    return parsed.href;
  } catch {
    return normalized;
  }
}
function readPreviewCache(localPath) {
  const cached = desktopPreviewUrlCache.get(localPath);
  if (!cached) return '';
  if (Number(cached.expiresAt || 0) <= Date.now())
    return (desktopPreviewUrlCache.delete(localPath), '');
  return String(cached.url || '');
}
function writePreviewCache(localPath, url) {
  if (!localPath || !url) return;
  desktopPreviewUrlCache.set(localPath, {
    url: url,
    expiresAt: Date.now() + DESKTOP_PREVIEW_URL_CACHE_TTL_MS,
  });
}
function getMediaElementSource(el) {
  const readAttribute = el?.getAttribute;
  if (typeof readAttribute === 'function')
    return String(readAttribute.call(el, 'src') || el?.src || '').trim();
  return String(el?.src || el?.currentSrc || '').trim();
}
export function getMediaElementCurrentSource(el) {
  return getMediaElementSource(el);
}
export function getMediaElementPlaybackSourceKey(el) {
  const mediaElementSource = getMediaElementSource(el);
  if (!mediaElementSource) return '';
  const originalSourceUrl = String(el?.dataset?.desktopMediaSourceUrl || '').trim();
  if (originalSourceUrl) return originalSourceUrl;
  return mediaElementSource;
}
export function normalizeMediaPlaybackSourceUrl(value) {
  return normalizeUrl(value);
}
export function isMediaElementPlaybackSource(el, handle) {
  const playbackSourceKey = getMediaElementPlaybackSourceKey(el),
    normalizedHandle = normalizeUrl(handle);
  return !!playbackSourceKey && !!normalizedHandle && normalizeUrl(playbackSourceKey) === normalizedHandle;
}
export function clearDesktopMediaPlaybackSourceMetadata(el) {
  if (!el?.dataset) return;
  delete el.dataset.desktopMediaSourceUrl;
}
function assignMediaElementSource(el, url, preload = 'auto', options = {}) {
  if (!el || !url) return '';
  if (typeof options.shouldAssign === 'function' && options.shouldAssign() !== true) return '';
  const startedAt = nowMs(),
    originalSourceUrl = normalizeUrl(options.originalSourceUrl || url),
    playbackUrl = normalizeUrl(url);
  // 本地预览协议需要 CORS 放行才能取帧；已经设过就不必重复赋值。
  let crossOriginChanged = false;
  if (LOCAL_PREVIEW_SCHEME_RE.test(playbackUrl) && 'crossOrigin' in el && el.crossOrigin !== 'anonymous') {
    el.crossOrigin = 'anonymous';
    crossOriginChanged = true;
  }
  const currentSource = getMediaElementSource(el),
    currentOriginalSourceUrl = String(el?.dataset?.desktopMediaSourceUrl || '').trim();
  if (
    !crossOriginChanged &&
    currentSource &&
    (normalizeUrl(currentSource) === playbackUrl ||
      (currentOriginalSourceUrl && normalizeUrl(currentOriginalSourceUrl) === originalSourceUrl))
  )
    return currentSource;
  el.preload = preload || el.preload || 'auto';
  if (el.dataset) {
    if (originalSourceUrl && playbackUrl !== originalSourceUrl)
      el.dataset.desktopMediaSourceUrl = originalSourceUrl;
    else delete el.dataset.desktopMediaSourceUrl;
  }
  typeof el.setAttribute === 'function' ? el.setAttribute('src', url) : (el.src = url);
  try {
    options.onSourceAssigned?.({ originalSourceUrl: originalSourceUrl, playbackUrl: playbackUrl });
  } catch {}
  if (options.load !== false) {
    try {
      el.load?.();
    } catch {}
  }
  return (
    markMediaSourceAttach({
      originalSourceUrl: originalSourceUrl,
      playbackUrl: playbackUrl,
      tag: String(el?.tagName || '').toLowerCase(),
      loadRequested: options.load !== false,
      durationMs: Math.max(0, nowMs() - startedAt),
    }),
    url
  );
}
export async function resolveDesktopMediaPlaybackUrl(input) {
  const normalized = normalizeUrl(input);
  if (desktopBridge.isChromeShell) return normalized;
  if (!isDesktopRenderer()) return normalized;
  const localPath = normalizeDesktopLocalMediaPath(normalized || input);
  if (!localPath) return normalized;
  if (shouldUseDirectLocalMediaSource()) return normalized;
  const cachedUrl = readPreviewCache(localPath);
  if (cachedUrl) return cachedUrl;
  // 同一路径并发请求只打一次桥，其余等同一个 promise。
  const pending = desktopPreviewUrlPendingCache.get(localPath);
  if (pending) return await pending;
  const request = (async () => {
    try {
      const response = await desktopBridge.mediaPreview.getLocalPreviewUrl({
          localPath: localPath,
          type: inferMediaMimeType(localPath),
        }),
        resolvedUrl = String(response?.url || response || '').trim();
      if (resolvedUrl) return (writePreviewCache(localPath, resolvedUrl), resolvedUrl);
    } catch {}
    return normalized;
  })().finally(() => {
    desktopPreviewUrlPendingCache.delete(localPath);
  });
  return (desktopPreviewUrlPendingCache.set(localPath, request), await request);
}
export async function attachDesktopMediaPlaybackSource(el, source, load = {}) {
  if (!el) return '';
  const originalSourceUrl = normalizeUrl(source),
    resolvedUrl = isDesktopRenderer() ? await resolveDesktopMediaPlaybackUrl(source) : source,
    playbackUrl = resolveChromeShellAudioPlaybackUrl(el, resolvedUrl);
  return assignMediaElementSource(el, playbackUrl, load.preload || el.preload, {
    originalSourceUrl: originalSourceUrl,
    load: load.load,
    onSourceAssigned: load.onSourceAssigned,
    shouldAssign: load.shouldAssign,
  });
}
export async function attachMediaElementPlaybackSource(el, source, load = {}) {
  if (!el) return '';
  const originalSourceUrl = normalizeUrl(source);
  if (!originalSourceUrl) return '';
  // 调用方已算好播放地址时直接用它，不再重复协商，也不再做 chrome-shell 改写。
  const explicitPlaybackUrl = String(load.playbackUrl || '').trim(),
    resolvedUrl =
      explicitPlaybackUrl ||
      (isDesktopRenderer() ? await resolveDesktopMediaPlaybackUrl(source) : source),
    playbackUrl = explicitPlaybackUrl
      ? resolvedUrl
      : resolveChromeShellAudioPlaybackUrl(el, resolvedUrl);
  return assignMediaElementSource(el, playbackUrl, load.preload || el.preload, {
    originalSourceUrl: originalSourceUrl,
    load: load.load,
    onSourceAssigned: load.onSourceAssigned,
    shouldAssign: load.shouldAssign,
  });
}
export const __desktopMediaBlobSourceForTest = {
  clearBlobCacheForTest() {
    (desktopPreviewUrlCache.clear(), desktopPreviewUrlPendingCache.clear());
  },
  isDesktopBlobCandidate: isDesktopBlobCandidate,
  normalizeDesktopLocalMediaPath: normalizeDesktopLocalMediaPath,
  normalizeUrl: normalizeUrl,
  resolveDesktopMediaPlaybackUrl: resolveDesktopMediaPlaybackUrl,
};
