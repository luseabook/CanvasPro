export async function encodeTextMediaInputs(value, item, handler) {
  const list = [];
  for (const key of value) {
    if (new RegExp('^data:' + item + '/[^;]+;base64,', 'i')['test'](key)) {
      list['push'](key);
      continue;
    }
    const enabled = await handler(key);
    let enabled2 = String(enabled['type'] || '')
      ['split'](';', 0x1)[0x0]
      ['toLowerCase']();
    if (!enabled2 || enabled2 === 'application/octet-stream') {
      const index = String(key)['split'](/[?#]/, 0x1)[0x0]['split']('.')['pop']()['toLowerCase']();
      enabled2 =
        {
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          webp: 'image/webp',
          gif: 'image/gif',
          bmp: 'image/bmp',
          heic: 'image/heic',
          heif: 'image/heif',
          mp4: 'video/mp4',
          webm: 'video/webm',
          mov: 'video/quicktime',
          mpeg: 'video/mpeg',
          mpg: 'video/mpeg',
          avi: 'video/avi',
          '3gp': 'video/3gpp',
        }[index] || '';
    }
    if (!enabled['size'] || !enabled2['startsWith'](item + '/'))
      throw new Error(
        'Invalid\x20' + item + '\x20input:\x20missing\x20media\x20content\x20or\x20MIME\x20type',
      );
    const list2 = new Uint8Array(await enabled['arrayBuffer']()),
      list3 = [];
    for (let result = 0x0; result < list2['length']; result += 0x8000) {
      list3['push'](String['fromCharCode'](...list2['subarray'](result, result + 0x8000)));
    }
    list['push']('data:' + enabled2 + ';base64,' + btoa(list3['join']('')));
  }
  return list;
}
