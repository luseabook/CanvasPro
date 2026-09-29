export async function detectCollaborationMediaContentType(_0x5e76e2) {
  const _0xf5476c = new Uint8Array(await _0x5e76e2['slice'](0x0, 0x1000)['arrayBuffer']()),
    _0xfceafb = new TextDecoder()['decode'](_0xf5476c),
    _0x38d752 = (_0x2cc148, _0x8bfda3) =>
      String['fromCharCode'](..._0xf5476c['slice'](_0x2cc148, _0x2cc148 + _0x8bfda3)),
    _0x47448e = (_0x53ba40) =>
      _0x53ba40['every']((_0x5a1023, _0x2167fd) => _0xf5476c[_0x2167fd] === _0x5a1023);
  if (_0x47448e([0x89, 0x50, 0x4e, 0x47, 0xd, 0xa, 0x1a, 0xa])) return 'image/png';
  if (_0x47448e([0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (/^GIF8[79]a/['test'](_0xfceafb)) return 'image/gif';
  if (_0x38d752(0x0, 0x2) === 'BM' && _0xf5476c['length'] >= 0xe) return 'image/bmp';
  if (_0x38d752(0x0, 0x4) === 'RIFF') {
    const _0x9e90a2 = _0x38d752(0x8, 0x4);
    if (_0x9e90a2 === 'WEBP') return 'image/webp';
    if (_0x9e90a2 === 'AVI ') return 'video/x-msvideo';
    if (_0x9e90a2 === 'WAVE') return 'audio/wav';
  }
  if (_0x38d752(0x4, 0x4) === 'ftyp' && _0xf5476c['length'] >= 0x10) {
    const _0x1f9e86 = _0x38d752(0x8, 0x4),
      _0x10a85c = Math['min'](new DataView(_0xf5476c['buffer'])['getUint32'](0x0), _0xf5476c['length']),
      _0x538d99 = [];
    for (let _0x1b22f5 = 0x10; _0x1b22f5 + 0x4 <= _0x10a85c; _0x1b22f5 += 0x4)
      _0x538d99['push'](_0x38d752(_0x1b22f5, 0x4));
    if ([_0x1f9e86, ..._0x538d99]['some']((_0x4b98cf) => ['avif', 'avis']['includes'](_0x4b98cf)))
      return 'image/avif';
    if (['M4A ', 'M4B ']['includes'](_0x1f9e86)) return 'audio/mp4';
    if (_0x1f9e86 === 'qt\x20\x20') return 'video/quicktime';
    if (/^(?:isom|iso[2-9]|mp4[12]|M4V |avc1|dash)$/['test'](_0x1f9e86))
      return _0x5e76e2['type']['split'](';')[0x0] === 'audio/mp4' ? 'audio/mp4' : 'video/mp4';
  }
  if (_0x47448e([0x1a, 0x45, 0xdf, 0xa3])) {
    if (_0xfceafb['includes']('webm'))
      return _0x5e76e2['type']['startsWith']('audio/') ? 'audio/webm' : 'video/webm';
    if (_0xfceafb['includes']('matroska')) return 'video/x-matroska';
  }
  if (_0x38d752(0x0, 0x4) === 'fLaC') return 'audio/flac';
  if (_0x38d752(0x0, 0x3) === 'ID3') return 'audio/mpeg';
  if (_0x38d752(0x0, 0x4) === 'OggS') return 'audio/ogg';
  if (_0xf5476c[0x0] === 0xff && (_0xf5476c[0x1] & 0xf6) === 0xf0) return 'audio/aac';
  if (_0xf5476c[0x0] === 0xff && (_0xf5476c[0x1] & 0xe0) === 0xe0 && (_0xf5476c[0x1] & 0x6) !== 0x0)
    return 'audio/mpeg';
  const _0x12ddbf = _0xfceafb['trimStart']()
    ['replace'](/^<\?xml\b[^?]*\?>\s*/i, '')
    ['replace'](/^(?:<!--[\s\S]*?-->\s*)+/, '');
  if (/^<svg(?:\s|>)/i['test'](_0x12ddbf)) return 'image/svg+xml';
  if (/^(?:<!doctype\s+html|<html\b|<head\b|<body\b|[\[{])/i['test'](_0x12ddbf))
    throw Object['assign'](new Error('素材地址返回了网页或错误信息，请检查原始素材是否可访问'), {
      code: 'ASSET_TYPE',
    });
  return '';
}
