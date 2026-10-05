export async function detectCollaborationMediaContentType(list) {
  const list2 = new Uint8Array(await list['slice'](0, 4096)['arrayBuffer']()),
    list3 = new TextDecoder()['decode'](list2),
    handler = (value, item) => String['fromCharCode'](...list2['slice'](value, value + item)),
    handler2 = (list4) => list4['every']((key, index) => list2[index] === key);
  if (handler2([137, 80, 78, 71, 13, 10, 26, 10])) return 'image/png';
  if (handler2([0xff, 216, 0xff])) return 'image/jpeg';
  if (/^GIF8[79]a/['test'](list3)) return 'image/gif';
  if (handler(0, 2) === 'BM' && list2['length'] >= 14) return 'image/bmp';
  if (handler(0, 4) === 'RIFF') {
    const result = handler(8, 4);
    if (result === 'WEBP') return 'image/webp';
    if (result === 'AVI ') return 'video/x-msvideo';
    if (result === 'WAVE') return 'audio/wav';
  }
  if (handler(4, 4) === 'ftyp' && list2['length'] >= 16) {
    const data = handler(8, 4),
      options = Math['min'](new DataView(list2['buffer'])['getUint32'](0), list2['length']),
      list5 = [];
    for (let target = 16; target + 4 <= options; target += 4) list5['push'](handler(target, 4));
    if ([data, ...list5]['some']((source) => ['avif', 'avis']['includes'](source))) return 'image/avif';
    if (['M4A ', 'M4B ']['includes'](data)) return 'audio/mp4';
    if (data === 'qt  ') return 'video/quicktime';
    if (/^(?:isom|iso[2-9]|mp4[12]|M4V |avc1|dash)$/['test'](data))
      return list['type']['split'](';')[0] === 'audio/mp4' ? 'audio/mp4' : 'video/mp4';
  }
  if (handler2([26, 69, 223, 163])) {
    if (list3['includes']('webm')) return list['type']['startsWith']('audio/') ? 'audio/webm' : 'video/webm';
    if (list3['includes']('matroska')) return 'video/x-matroska';
  }
  if (handler(0, 4) === 'fLaC') return 'audio/flac';
  if (handler(0, 3) === 'ID3') return 'audio/mpeg';
  if (handler(0, 4) === 'OggS') return 'audio/ogg';
  if (list2[0] === 0xff && (list2[1] & 246) === 240) return 'audio/aac';
  if (list2[0] === 0xff && (list2[1] & 224) === 224 && (list2[1] & 6) !== 0) return 'audio/mpeg';
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
