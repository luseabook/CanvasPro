const SAFE_LOCAL_PATH_PREFIXES = Object.freeze(['data/uploads/', 'data/assets/', 'output/']),
  BLOCKED_SCHEME_RE = /^(?:blob|data|file|javascript):/i,
  HTTP_SCHEME_RE = /^https?:/i,
  ANY_SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i,
  WINDOWS_ABSOLUTE_RE = /^[a-zA-Z]:\//;
function normalizeText(value) {
  return String(value || '').trim();
}
function safeDecode(item) {
  try {
    return decodeURIComponent(item);
  } catch {
    return item;
  }
}
function isLocalHttpUrl(key) {
  const enabled = String(key?.hostname || '').toLowerCase();
  if (!enabled) return false;
  if (
    enabled === 'localhost' ||
    enabled === '127.0.0.1' ||
    enabled === '0.0.0.0' ||
    enabled === '::1' ||
    enabled === '[::1]'
  )
    return true;
  const text = normalizeText(globalThis.location?.origin);
  return !!text && key.origin === text;
}
function extractPathCandidate(response) {
  if (!response || typeof response !== 'object' || Array.isArray(response)) return response;
  const response2 = response.result && typeof response.result === 'object' ? response.result : null,
    response3 = response.video && typeof response.video === 'object' ? response.video : null,
    response4 = response.audio && typeof response.audio === 'object' ? response.audio : null;
  return (
    response.localPath ??
    response.path ??
    response.url ??
    response.posterLocalPath ??
    response.coverLocalPath ??
    response.thumbLocalPath ??
    response.displayLocalPath ??
    response.originalLocalPath ??
    response.waveformLocalPath ??
    response3?.localPath ??
    response3?.path ??
    response3?.url ??
    response4?.localPath ??
    response4?.path ??
    response4?.url ??
    response2?.localPath ??
    response2?.path ??
    response2?.url ??
    response2?.posterLocalPath ??
    response2?.coverLocalPath ??
    response2?.thumbLocalPath ??
    response2?.displayLocalPath ??
    response2?.originalLocalPath ??
    response2?.waveformLocalPath ??
    ''
  );
}
function hasSafeLocalPathPrefix(index) {
  const text2 = normalizeText(index).replace(/\\/g, '/');
  return SAFE_LOCAL_PATH_PREFIXES.some((item2) => text2.startsWith(item2));
}
export function isSafeVirtualLocalPath(result) {
  const text3 = normalizeText(result).replace(/\\/g, '/');
  if (!text3 || BLOCKED_SCHEME_RE.test(text3) || HTTP_SCHEME_RE.test(text3)) return false;
  if (ANY_SCHEME_RE.test(text3) || WINDOWS_ABSOLUTE_RE.test(text3) || text3.startsWith('//')) return false;
  const safeDecode2 = safeDecode(text3.split(/[?#]/, 1)[0]).replace(/^\/+/, ''),
    list = safeDecode2.split('/').filter(Boolean);
  if (list.some((item3) => item3 === '.' || item3 === '..')) return false;
  return hasSafeLocalPathPrefix(list.join('/'));
}
export function normalizeLocalPath(data) {
  const extractPathCandidate2 = extractPathCandidate(data),
    text4 = normalizeText(extractPathCandidate2);
  if (!text4 || BLOCKED_SCHEME_RE.test(text4)) return '';
  if (HTTP_SCHEME_RE.test(text4)) return urlToLocalPath(text4);
  if (ANY_SCHEME_RE.test(text4)) return '';
  let safeDecode3 = text4.replace(/\\/g, '/');
  if (WINDOWS_ABSOLUTE_RE.test(safeDecode3) || safeDecode3.startsWith('//')) return '';
  safeDecode3 = safeDecode(safeDecode3.split(/[?#]/, 1)[0]).replace(/^\/+/, '');
  const list2 = [];
  for (const options of safeDecode3.split('/')) {
    const enabled2 = options.trim();
    if (!enabled2 || enabled2 === '.') continue;
    if (enabled2 === '..') return '';
    list2.push(enabled2);
  }
  const target = list2.join('/');
  return hasSafeLocalPathPrefix(target) ? target : '';
}
export function localPathToUrl(source) {
  const localPath = normalizeLocalPath(source);
  return localPath ? '/' + localPath : '';
}
export function urlToLocalPath(next) {
  const text5 = normalizeText(next);
  if (!text5 || BLOCKED_SCHEME_RE.test(text5)) return '';
  if (HTTP_SCHEME_RE.test(text5))
    try {
      const uRL = new URL(text5);
      if (!isLocalHttpUrl(uRL)) return '';
      return normalizeLocalPath(uRL.pathname);
    } catch {
      return '';
    }
  return normalizeLocalPath(text5);
}
export function pickResultLocalPath(current) {
  return normalizeLocalPath(current);
}
