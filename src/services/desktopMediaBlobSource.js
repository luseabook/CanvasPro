const DESKTOP_PREVIEW_URL_CACHE_TTL_MS = 30 * 60 * 0x3e8,
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
function normalizeUrl(_0x65547) {
  const _0x500638 = String(_0x65547 || '').trim();
  if (!_0x500638) return '';
  try {
    return new URL(_0x500638, globalThis.location?.href || 'http://127.0.0.1/').href;
  } catch {
    return _0x500638;
  }
}
function isDesktopRenderer() {
  return !!globalThis.window?.electronAPI;
}
function isDesktopBlobCandidate(_0x2471ec) {
  return (void _0x2471ec, false);
}
function isLoopbackHost(_0x5565f6) {
  const _0x1eb245 = String(_0x5565f6 || '').toLowerCase();
  return (
    _0x1eb245 === 'localhost' || _0x1eb245 === '127.0.0.1' || _0x1eb245 === '::1' || _0x1eb245 === '[::1]'
  );
}
function normalizeDesktopLocalMediaPath(_0x55a773) {
  const _0x3dac0b = String(_0x55a773 || '').trim();
  if (!_0x3dac0b || /^(?:blob:|data:|file:)/i.test(_0x3dac0b) || LOCAL_PREVIEW_SCHEME_RE.test(_0x3dac0b))
    return '';
  let _0x58e461 = _0x3dac0b;
  try {
    const _0x3133e2 = new URL(_0x3dac0b, globalThis.location?.href || 'http://127.0.0.1:8777/'),
      _0x50f5ef = String(globalThis.location?.origin || ''),
      _0x3476a6 =
        /^https?:$/i.test(_0x3133e2.protocol) &&
        ((_0x50f5ef && _0x3133e2.origin === _0x50f5ef) || isLoopbackHost(_0x3133e2.hostname));
    if (!_0x3476a6) return '';
    _0x58e461 = _0x3133e2.pathname;
  } catch {
    _0x58e461 = _0x3dac0b.split(/[?#]/, 1)[0];
  }
  _0x58e461 = String(_0x58e461 || '')
    .replace(/\\/g, '/')
    .split(/[?#]/, 1)[0];
  try {
    _0x58e461 = decodeURIComponent(_0x58e461);
  } catch {}
  _0x58e461 = _0x58e461.replace(/^\/+/, '');
  if (!LOCAL_MEDIA_PATH_PREFIX_RE.test(_0x58e461)) return '';
  return '/' + _0x58e461;
}
function inferMediaMimeType(_0x302863) {
  const _0x1d5bc = String(_0x302863 || '')
    .split(/[?#]/, 1)[0]
    .match(/\.([a-z0-9]+)$/i);
  if (!_0x1d5bc) return '';
  return MEDIA_MIME_BY_EXT[String(_0x1d5bc[1] || '').toLowerCase()] || '';
}
function readPreviewCache(_0x3c6d45) {
  const _0x439ee3 = desktopPreviewUrlCache.get(_0x3c6d45);
  if (!_0x439ee3) return '';
  if (Number(_0x439ee3.expiresAt || 0) <= Date.now()) return (desktopPreviewUrlCache.delete(_0x3c6d45), '');
  return String(_0x439ee3.url || '');
}
function writePreviewCache(_0x572851, _0x132e98) {
  if (!_0x572851 || !_0x132e98) return;
  desktopPreviewUrlCache.set(_0x572851, {
    url: _0x132e98,
    expiresAt: Date.now() + DESKTOP_PREVIEW_URL_CACHE_TTL_MS,
  });
}
function getMediaElementSource(_0x170e1f) {
  return String(_0x170e1f?.getAttribute?.('src') || _0x170e1f?.currentSrc || _0x170e1f?.src || '').trim();
}
export function getMediaElementCurrentSource(_0x42dabd) {
  return getMediaElementSource(_0x42dabd);
}
export function getMediaElementPlaybackSourceKey(_0xdab4de) {
  const _0xa79e1b = getMediaElementSource(_0xdab4de);
  if (!_0xa79e1b) return '';
  const _0x2628a7 = String(_0xdab4de?.dataset?.desktopMediaSourceUrl || '').trim();
  if (_0x2628a7) return _0x2628a7;
  return _0xa79e1b;
}
export function normalizeMediaPlaybackSourceUrl(_0x285f5e) {
  return normalizeUrl(_0x285f5e);
}
export function isMediaElementPlaybackSource(_0x4edced, _0x20099c) {
  const _0xbf99f5 = getMediaElementPlaybackSourceKey(_0x4edced),
    _0x294b75 = normalizeUrl(_0x20099c);
  return !!_0xbf99f5 && !!_0x294b75 && normalizeUrl(_0xbf99f5) === _0x294b75;
}
export function clearDesktopMediaPlaybackSourceMetadata(_0x4adf39) {
  if (!_0x4adf39?.dataset) return;
  delete _0x4adf39.dataset.desktopMediaSourceUrl;
}
function assignMediaElementSource(_0x594aa6, _0xd655b5, _0x53581c = 'auto', _0x233723 = {}) {
  if (!_0x594aa6 || !_0xd655b5) return '';
  const _0x2d9dd9 = normalizeUrl(_0x233723.originalSourceUrl || _0xd655b5),
    _0x4746c0 = normalizeUrl(_0xd655b5),
    _0x22c28c = getMediaElementSource(_0x594aa6),
    _0xf43d3f = String(_0x594aa6?.dataset?.desktopMediaSourceUrl || '').trim();
  if (
    _0x22c28c &&
    (normalizeUrl(_0x22c28c) === _0x4746c0 || (_0xf43d3f && normalizeUrl(_0xf43d3f) === _0x2d9dd9))
  )
    return _0x22c28c;
  _0x594aa6.preload = _0x53581c || _0x594aa6.preload || 'auto';
  _0x594aa6.dataset &&
    (_0x2d9dd9 && _0x4746c0 !== _0x2d9dd9
      ? (_0x594aa6.dataset.desktopMediaSourceUrl = _0x2d9dd9)
      : delete _0x594aa6.dataset.desktopMediaSourceUrl);
  typeof _0x594aa6.setAttribute === 'function'
    ? _0x594aa6.setAttribute('src', _0xd655b5)
    : (_0x594aa6.src = _0xd655b5);
  if (_0x233723.load !== false)
    try {
      _0x594aa6.load?.();
    } catch {}
  return _0xd655b5;
}
export async function resolveDesktopMediaPlaybackUrl(_0x3cd22b) {
  const _0x55ac06 = normalizeUrl(_0x3cd22b);
  if (!isDesktopRenderer()) return _0x55ac06;
  const _0x4797b6 = normalizeDesktopLocalMediaPath(_0x55ac06 || _0x3cd22b);
  if (!_0x4797b6) return _0x55ac06;
  const _0x5566d3 = readPreviewCache(_0x4797b6);
  if (_0x5566d3) return _0x5566d3;
  const _0xa17de3 = globalThis.window?.electronAPI;
  if (typeof _0xa17de3?.getLocalPreviewUrl !== 'function') return _0x55ac06;
  try {
    const _0x8f7d1a = await _0xa17de3.getLocalPreviewUrl({
        localPath: _0x4797b6,
        type: inferMediaMimeType(_0x4797b6),
      }),
      _0x1eb623 = String(_0x8f7d1a?.url || _0x8f7d1a || '').trim();
    if (_0x1eb623) return (writePreviewCache(_0x4797b6, _0x1eb623), _0x1eb623);
  } catch {}
  return _0x55ac06;
}
export async function attachDesktopMediaPlaybackSource(_0xf35ce4, _0x542964, _0x44655e = {}) {
  if (!_0xf35ce4) return '';
  const _0xd31daf = normalizeUrl(_0x542964),
    _0x3c0e27 = isDesktopRenderer() ? await resolveDesktopMediaPlaybackUrl(_0x542964) : _0x542964;
  return assignMediaElementSource(_0xf35ce4, _0x3c0e27, _0x44655e.preload || _0xf35ce4.preload, {
    originalSourceUrl: _0xd31daf,
    load: _0x44655e.load,
  });
}
export async function attachMediaElementPlaybackSource(_0x51bc2b, _0x14f001, _0x7d62ed = {}) {
  if (!_0x51bc2b) return '';
  const _0x3411ce = normalizeUrl(_0x14f001);
  if (!_0x3411ce) return '';
  const _0x5003b5 = isDesktopRenderer() ? await resolveDesktopMediaPlaybackUrl(_0x14f001) : _0x14f001;
  return assignMediaElementSource(_0x51bc2b, _0x5003b5, _0x7d62ed.preload || _0x51bc2b.preload, {
    originalSourceUrl: _0x3411ce,
    load: _0x7d62ed.load,
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
