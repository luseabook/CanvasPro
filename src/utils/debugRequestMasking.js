const SECRET_KEY_NAMES = new Set([
  'apikey',
  'api_key',
  'api-key',
  'modelapikey',
  'model_api_key',
  'model-api-key',
  'cdkey',
  'cd_key',
  'cd-key',
]);
function hasSecretValue(_0x5385e3) {
  return String(_0x5385e3 || '').trim() !== '';
}
function isPlainObject(_0x2f4052) {
  if (!_0x2f4052 || typeof _0x2f4052 !== 'object') return false;
  const _0x469b85 = Object.getPrototypeOf(_0x2f4052);
  return _0x469b85 === Object.prototype || _0x469b85 === null;
}
export function maskDebugSecret(_0x2462ab) {
  return hasSecretValue(_0x2462ab) ? '***' : '';
}
export function maskDebugAuthorization(_0x4a3230) {
  const _0xa8d960 = String(_0x4a3230 || '').trim();
  if (!_0xa8d960) return '';
  if (/^Bearer$/i.test(_0xa8d960)) return '';
  return /^Bearer\s+/i.test(_0xa8d960) ? 'Bearer ***' : '***';
}
export function maskDebugBearer(_0x183197) {
  return hasSecretValue(_0x183197) ? 'Bearer ***' : '';
}
export function maskDebugHeaders(_0x474744) {
  if (!_0x474744 || typeof _0x474744 !== 'object') return _0x474744;
  const _0x396ff2 = { ..._0x474744 };
  for (const _0x96381c of Object.keys(_0x396ff2)) {
    const _0x387fa3 = _0x96381c.toLowerCase();
    if (_0x387fa3 === 'authorization') _0x396ff2[_0x96381c] = maskDebugAuthorization(_0x396ff2[_0x96381c]);
    else
      (_0x387fa3 === 'x-api-key' || _0x387fa3 === 'api-key' || _0x387fa3 === 'cdkey') &&
        (_0x396ff2[_0x96381c] = maskDebugSecret(_0x396ff2[_0x96381c]));
  }
  return _0x396ff2;
}
export function maskDebugPayloadSecrets(_0x50b4d9) {
  if (Array.isArray(_0x50b4d9)) return _0x50b4d9.map((_0x4bfa3a) => maskDebugPayloadSecrets(_0x4bfa3a));
  if (!isPlainObject(_0x50b4d9)) return _0x50b4d9;
  const _0x4df7f1 = {};
  for (const [_0x2ca104, _0xf07cbc] of Object.entries(_0x50b4d9)) {
    const _0x473505 = _0x2ca104.toLowerCase();
    if (SECRET_KEY_NAMES.has(_0x473505)) _0x4df7f1[_0x2ca104] = maskDebugSecret(_0xf07cbc);
    else
      _0x473505 === 'authorization'
        ? (_0x4df7f1[_0x2ca104] = maskDebugAuthorization(_0xf07cbc))
        : (_0x4df7f1[_0x2ca104] = maskDebugPayloadSecrets(_0xf07cbc));
  }
  return _0x4df7f1;
}
