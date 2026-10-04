export async function detectCollaborationMediaContentType(list) {
  const list2 = new Uint8Array(await list['slice'](0x0, 0x1000)['arrayBuffer']()),
    list3 = new TextDecoder()['decode'](list2),
    handler = (value, item) => String['fromCharCode'](...list2['slice'](value, value + item)),
    handler2 = (list4) => list4['every']((key, index) => list2[index] === key);
  if (handler2([0x89, 0x50, 0x4e, 0x47, 0xd, 0xa, 0x1a, 0xa])) return 'image/png';
  if (handler2([0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (/^GIF8[79]a/['test'](list3)) return 'image/gif';
  if (handler(0x0, 0x2) === 'BM' && list2['length'] >= 0xe) return 'image/bmp';
  if (handler(0x0, 0x4) === 'RIFF') {
    const result = handler(0x8, 0x4);
    if (result === 'WEBP') return 'image/webp';
    if (result === 'AVI ') return 'video/x-msvideo';
    if (result === 'WAVE') return 'audio/wav';
  }
  if (handler(0x4, 0x4) === 'ftyp' && list2['length'] >= 0x10) {
    const data = handler(0x8, 0x4),
      options = Math['min'](new DataView(list2['buffer'])['getUint32'](0x0), list2['length']),
      list5 = [];
    for (let target = 0x10; target + 0x4 <= options; target += 0x4) list5['push'](handler(target, 0x4));
    if ([data, ...list5]['some']((source) => ['avif', 'avis']['includes'](source))) return 'image/avif';
    if (['M4A ', 'M4B ']['includes'](data)) return 'audio/mp4';
    if (data === 'qt\x20\x20') return 'video/quicktime';
    if (/^(?:isom|iso[2-9]|mp4[12]|M4V |avc1|dash)$/['test'](data))
      return list['type']['split'](';')[0x0] === 'audio/mp4' ? 'audio/mp4' : 'video/mp4';
  }
  if (handler2([0x1a, 0x45, 0xdf, 0xa3])) {
    if (list3['includes']('webm')) return list['type']['startsWith']('audio/') ? 'audio/webm' : 'video/webm';
    if (list3['includes']('matroska')) return 'video/x-matroska';
  }
  if (handler(0x0, 0x4) === 'fLaC') return 'audio/flac';
  if (handler(0x0, 0x3) === 'ID3') return 'audio/mpeg';
  if (handler(0x0, 0x4) === 'OggS') return 'audio/ogg';
  if (list2[0x0] === 0xff && (list2[0x1] & 0xf6) === 0xf0) return 'audio/aac';
  if (list2[0x0] === 0xff && (list2[0x1] & 0xe0) === 0xe0 && (list2[0x1] & 0x6) !== 0x0) return 'audio/mpeg';
  const next = list3['trimStart']()
    ['replace'](/^<\?xml\b[^?]*\?>\s*/i, '')
    ['replace'](/^(?:<!--[\s\S]*?-->\s*)+/, '');
  if (/^<svg(?:\s|>)/i['test'](next)) return 'image/svg+xml';
  if (/^(?:<!doctype\s+html|<html\b|<head\b|<body\b|[\[{])/i['test'](next))
    throw Object['assign'](new Error('素材地址返回了网页或错误信息，请检查原始素材是否可访问'), {
      code: 'ASSET_TYPE',
    });
  return '';
}
