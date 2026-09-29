export const COMFYUI_CONNECTION_TARGETS = Object['freeze'](['local', 'cloud']);
export const COMFYUI_LOCAL_DEFAULT_URL = '127.0.0.1:8188';
export function normalizeComfyUiFormUrl(_0x5a12b7, _0x41d348 = '') {
  const _0x174251 = String(_0x5a12b7 || _0x41d348 || '')['trim']();
  if (!_0x174251) return '';
  const _0x37490e = /^[a-z][a-z0-9+.-]*:\/\//i['test'](_0x174251);
  try {
    const _0x4e270d = new URL(_0x37490e ? _0x174251 : 'http://' + _0x174251);
    return (
      (_0x4e270d['search'] = ''),
      (_0x4e270d['hash'] = ''),
      _0x4e270d['toString']()['replace'](/\/+$/, '')
    );
  } catch {
    const _0xd36206 = _0x174251['replace'](/[?#].*$/, '')['replace'](/\/+$/, '');
    if (!_0xd36206) return '';
    return _0x37490e ? _0xd36206 : 'http://' + _0xd36206;
  }
}
export function normalizeComfyUiConnectionTarget(_0x5ade12 = '') {
  const _0x38df17 = String(_0x5ade12 || '')
    ['trim']()
    ['toLowerCase']();
  return COMFYUI_CONNECTION_TARGETS['includes'](_0x38df17) ? _0x38df17 : '';
}
export function getComfyUiStatusElementId(_0x572cca = '') {
  const _0x56c55e = normalizeComfyUiConnectionTarget(_0x572cca);
  return 'providerTestStatus-comfyui' + (_0x56c55e ? '-' + _0x56c55e : '');
}
export function isComfyUiEndpointConfigured(_0x42e701 = {}, _0x39467f = '') {
  const _0x124183 = normalizeComfyUiConnectionTarget(_0x39467f),
    _0x4aa61b = _0x42e701?.['providers']?.['comfyui'] || {},
    _0x21b904 =
      _0x124183 === 'cloud' ? _0x4aa61b['cloudApiUrl'] : _0x4aa61b['apiUrl'] || COMFYUI_LOCAL_DEFAULT_URL;
  return Boolean(String(_0x21b904 || '')['trim']());
}
export function getComfyUiEndpointStatusEntries(_0x163d5a = {}) {
  const _0x35273b = _0x163d5a?.['providers']?.['comfyui'] || {},
    _0x50e596 = _0x35273b?.['connectionVerification']?.['capabilities'] || {};
  return COMFYUI_CONNECTION_TARGETS['map']((_0xfdf23e) => {
    if (!isComfyUiEndpointConfigured(_0x163d5a, _0xfdf23e))
      return { target: _0xfdf23e, tone: 'unconfigured', textKey: 'statuses.unconfigured' };
    if (_0x50e596?.[_0xfdf23e]?.['status'] === 'passed')
      return { target: _0xfdf23e, tone: 'success', textKey: 'diagnostics.passed' };
    if (_0x50e596?.[_0xfdf23e]?.['status'] === 'failed')
      return { target: _0xfdf23e, tone: 'danger', textKey: 'diagnostics.notPassed' };
    return { target: _0xfdf23e, tone: 'configured', textKey: 'statuses.configured' };
  });
}
