const SAFE_LOCAL_PATH_PREFIXES = Object.freeze(['data/uploads/', 'data/assets/', 'output/']),
  BLOCKED_SCHEME_RE = /^(?:blob|data|file|javascript):/i,
  HTTP_SCHEME_RE = /^https?:/i,
  ANY_SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i,
  WINDOWS_ABSOLUTE_RE = /^[a-zA-Z]:\//;
function normalizeText(_0x81cd60) {
  return String(_0x81cd60 || '').trim();
}
function safeDecode(_0x5921f4) {
  try {
    return decodeURIComponent(_0x5921f4);
  } catch {
    return _0x5921f4;
  }
}
function isLocalHttpUrl(_0x46fc8e) {
  const _0x17d793 = String(_0x46fc8e?.hostname || '').toLowerCase();
  if (!_0x17d793) return false;
  if (
    _0x17d793 === 'localhost' ||
    _0x17d793 === '127.0.0.1' ||
    _0x17d793 === '0.0.0.0' ||
    _0x17d793 === '::1' ||
    _0x17d793 === '[::1]'
  )
    return true;
  const _0x19535a = normalizeText(globalThis.location?.origin);
  return !!_0x19535a && _0x46fc8e.origin === _0x19535a;
}
function extractPathCandidate(_0x15b065) {
  if (!_0x15b065 || typeof _0x15b065 !== 'object' || Array.isArray(_0x15b065)) return _0x15b065;
  const _0x218576 = _0x15b065.result && typeof _0x15b065.result === 'object' ? _0x15b065.result : null,
    _0x517d54 = _0x15b065.video && typeof _0x15b065.video === 'object' ? _0x15b065.video : null,
    _0x44a250 = _0x15b065.audio && typeof _0x15b065.audio === 'object' ? _0x15b065.audio : null;
  return (
    _0x15b065.localPath ??
    _0x15b065.path ??
    _0x15b065.url ??
    _0x15b065.posterLocalPath ??
    _0x15b065.coverLocalPath ??
    _0x15b065.thumbLocalPath ??
    _0x15b065.displayLocalPath ??
    _0x15b065.originalLocalPath ??
    _0x15b065.waveformLocalPath ??
    _0x517d54?.localPath ??
    _0x517d54?.path ??
    _0x517d54?.url ??
    _0x44a250?.localPath ??
    _0x44a250?.path ??
    _0x44a250?.url ??
    _0x218576?.localPath ??
    _0x218576?.path ??
    _0x218576?.url ??
    _0x218576?.posterLocalPath ??
    _0x218576?.coverLocalPath ??
    _0x218576?.thumbLocalPath ??
    _0x218576?.displayLocalPath ??
    _0x218576?.originalLocalPath ??
    _0x218576?.waveformLocalPath ??
    ''
  );
}
function hasSafeLocalPathPrefix(_0x48ba3e) {
  const _0x5d66ab = normalizeText(_0x48ba3e).replace(/\\/g, '/');
  return SAFE_LOCAL_PATH_PREFIXES.some((_0x362031) => _0x5d66ab.startsWith(_0x362031));
}
export function isSafeVirtualLocalPath(_0x3f5831) {
  const _0x3be8d2 = normalizeText(_0x3f5831).replace(/\\/g, '/');
  if (!_0x3be8d2 || BLOCKED_SCHEME_RE.test(_0x3be8d2) || HTTP_SCHEME_RE.test(_0x3be8d2)) return false;
  if (ANY_SCHEME_RE.test(_0x3be8d2) || WINDOWS_ABSOLUTE_RE.test(_0x3be8d2) || _0x3be8d2.startsWith('//'))
    return false;
  const _0x536e5b = safeDecode(_0x3be8d2.split(/[?#]/, 1)[0]).replace(/^\/+/, ''),
    _0x540701 = _0x536e5b.split('/').filter(Boolean);
  if (_0x540701.some((_0x5da766) => _0x5da766 === '.' || _0x5da766 === '..')) return false;
  return hasSafeLocalPathPrefix(_0x540701.join('/'));
}
export function normalizeLocalPath(_0x23e31f) {
  const _0x39a47b = extractPathCandidate(_0x23e31f),
    _0x1bc264 = normalizeText(_0x39a47b);
  if (!_0x1bc264 || BLOCKED_SCHEME_RE.test(_0x1bc264)) return '';
  if (HTTP_SCHEME_RE.test(_0x1bc264)) return urlToLocalPath(_0x1bc264);
  if (ANY_SCHEME_RE.test(_0x1bc264)) return '';
  let _0x2df268 = _0x1bc264.replace(/\\/g, '/');
  if (WINDOWS_ABSOLUTE_RE.test(_0x2df268) || _0x2df268.startsWith('//')) return '';
  _0x2df268 = safeDecode(_0x2df268.split(/[?#]/, 1)[0]).replace(/^\/+/, '');
  const _0x2da4f4 = [];
  for (const _0x5d0512 of _0x2df268.split('/')) {
    const _0x4d4695 = _0x5d0512.trim();
    if (!_0x4d4695 || _0x4d4695 === '.') continue;
    if (_0x4d4695 === '..') return '';
    _0x2da4f4.push(_0x4d4695);
  }
  const _0xc4bb55 = _0x2da4f4.join('/');
  return hasSafeLocalPathPrefix(_0xc4bb55) ? _0xc4bb55 : '';
}
export function localPathToUrl(_0x2f9cfc) {
  const _0x5218 = normalizeLocalPath(_0x2f9cfc);
  return _0x5218 ? '/' + _0x5218 : '';
}
export function urlToLocalPath(_0x2aaf61) {
  const _0x415e94 = normalizeText(_0x2aaf61);
  if (!_0x415e94 || BLOCKED_SCHEME_RE.test(_0x415e94)) return '';
  if (HTTP_SCHEME_RE.test(_0x415e94))
    try {
      const _0x525712 = new URL(_0x415e94);
      if (!isLocalHttpUrl(_0x525712)) return '';
      return normalizeLocalPath(_0x525712.pathname);
    } catch {
      return '';
    }
  return normalizeLocalPath(_0x415e94);
}
export function pickResultLocalPath(_0x56bafd) {
  return normalizeLocalPath(_0x56bafd);
}
