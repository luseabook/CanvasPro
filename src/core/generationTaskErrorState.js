export function isGenerationAbortError(_0xdda3c9) {
  if (!_0xdda3c9) return ![];
  if (_0xdda3c9?.['name'] === 'AbortError') return !![];
  return String(_0xdda3c9?.['message'] || '')['trim']() === 'CANCELLED';
}
export function getGenerationErrorMessage(_0x5e81e6, _0x3ea406 = '') {
  const _0xef3815 =
      typeof _0x5e81e6 === 'string' || typeof _0x5e81e6 === 'number' ? _0x5e81e6 : _0x5e81e6?.['message'],
    _0x1304a9 = String(_0xef3815 || '')['trim']();
  if (_0x1304a9) return _0x1304a9;
  return String(_0x3ea406 || '')['trim']();
}
