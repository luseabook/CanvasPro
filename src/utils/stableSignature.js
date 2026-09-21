export function createStableSignature(_0x38fbbb) {
  if (_0x38fbbb === null || _0x38fbbb === undefined) return String(_0x38fbbb);
  if (typeof _0x38fbbb !== 'object') return JSON.stringify(_0x38fbbb);
  if (Array.isArray(_0x38fbbb))
    return '[' + _0x38fbbb.map((_0x192eb4) => createStableSignature(_0x192eb4)).join(',') + ']';
  const _0x578675 = Object.keys(_0x38fbbb).sort();
  return (
    '{' +
    _0x578675
      .map((_0x3841b6) => JSON.stringify(_0x3841b6) + ':' + createStableSignature(_0x38fbbb[_0x3841b6]))
      .join(',') +
    '}'
  );
}
