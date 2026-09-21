export function getApiBase() {
  try {
    if (typeof location !== 'undefined' && location.protocol === 'file:') return 'http://127.0.0.1:8777';
  } catch {}
  return '';
}
export function buildApiUrl(_0x174b15) {
  const _0x1a7c60 = getApiBase(),
    _0xbda103 = String(_0x174b15 || '');
  if (!_0xbda103) return _0x1a7c60 || '';
  if (!_0xbda103.startsWith('/')) return _0x1a7c60 + '/' + _0xbda103;
  return '' + _0x1a7c60 + _0xbda103;
}
