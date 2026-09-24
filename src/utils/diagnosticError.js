const MAX_ERROR_CHAIN_LENGTH = 0x4,
  MAX_ERROR_MESSAGE_LENGTH = 0x7d0,
  MAX_ERROR_STACK_LENGTH = 0x2710,
  ERROR_METADATA_KEYS = ['type', 'provider', 'code', 'status', 'retryable'];
function boundedText(_0x150138, _0x5be576) {
  const _0x4e9339 = typeof _0x150138 === 'string' ? _0x150138 : '';
  return _0x4e9339['length'] > _0x5be576
    ? _0x4e9339['slice'](0x0, _0x5be576) + '...\x20[truncated]'
    : _0x4e9339;
}
function serializeError(_0x134ad9, _0x4d5d78, _0xe9e4f3) {
  if (_0x4d5d78 >= MAX_ERROR_CHAIN_LENGTH) return '[MaxDepth]';
  const _0x4d5ffa = _0x134ad9 !== null && typeof _0x134ad9 === 'object';
  if (_0x4d5ffa && _0xe9e4f3['has'](_0x134ad9)) return '[Circular]';
  if (_0x4d5ffa) _0xe9e4f3['add'](_0x134ad9);
  const _0x358cd5 = {
    name: boundedText(_0x134ad9?.['name'], 0xa0) || 'Error',
    message: boundedText(
      _0x4d5ffa ? _0x134ad9['message'] : String(_0x134ad9 ?? ''),
      MAX_ERROR_MESSAGE_LENGTH,
    ),
    stack: boundedText(_0x134ad9?.['stack'], MAX_ERROR_STACK_LENGTH),
  };
  for (const _0x19637c of ERROR_METADATA_KEYS) {
    const _0x4b12ee = _0x134ad9?.[_0x19637c];
    if (typeof _0x4b12ee === 'string')
      _0x358cd5[_0x19637c] = boundedText(_0x4b12ee, MAX_ERROR_MESSAGE_LENGTH);
    else
      (typeof _0x4b12ee === 'number' || typeof _0x4b12ee === 'boolean') && (_0x358cd5[_0x19637c] = _0x4b12ee);
  }
  _0x134ad9?.['cause'] !== undefined &&
    _0x134ad9['cause'] !== null &&
    (_0x358cd5['cause'] = serializeError(_0x134ad9['cause'], _0x4d5d78 + 0x1, _0xe9e4f3));
  if (_0x4d5ffa) _0xe9e4f3['delete'](_0x134ad9);
  return _0x358cd5;
}
export function serializeDiagnosticError(_0x20acd9) {
  return serializeError(_0x20acd9, 0x0, new Set());
}
