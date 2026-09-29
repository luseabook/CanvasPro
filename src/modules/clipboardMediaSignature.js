export async function buildClipboardMediaSignature(_0x1ddd2b, _0x2bc967 = _0x1ddd2b?.['type']) {
  if (!_0x1ddd2b || !globalThis['crypto']?.['subtle']) return '';
  try {
    const _0x32fa45 = await globalThis['crypto']['subtle']['digest'](
        'SHA-256',
        await _0x1ddd2b['arrayBuffer'](),
      ),
      _0x108a4e = Array['from'](new Uint8Array(_0x32fa45), (_0x477678) =>
        _0x477678['toString'](0x10)['padStart'](0x2, '0'),
      )['join']('');
    return 'media:' + String(_0x2bc967)['toLowerCase']() + '|sha256:' + _0x108a4e;
  } catch {
    return '';
  }
}
export function clipboardImageBlobFromBase64(_0x5c1184, _0x4151fb = 'image/png') {
  const _0x1316b3 = atob(String(_0x5c1184 || '')),
    _0x450237 = new Uint8Array(_0x1316b3['length']);
  for (let _0x26a24c = 0x0; _0x26a24c < _0x1316b3['length']; _0x26a24c += 0x1)
    _0x450237[_0x26a24c] = _0x1316b3['charCodeAt'](_0x26a24c);
  return new Blob([_0x450237], { type: _0x4151fb });
}
