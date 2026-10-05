export async function encodeTextMediaInputs(value, item, handler) {
  const list = [];
  for (const key of value) {
    if (new RegExp('^data:' + item + '/[^;]+;base64,', 'i')['test'](key)) {
      list['push'](key);
      continue;
    }
    const enabled = await handler(key);
    let enabled2 = String(enabled['type'] || '')
      ['split'](';', 1)[0]
      ['toLowerCase']();
    if (!enabled2 || enabled2 === 'application/octet-stream') {
      const index = String(key)['split'](/[?#]/, 1)[0]['split']('.')['pop']()['toLowerCase']();
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
        'Invalid ' + item + ' input: missing media content or MIME type',
      );
    const list2 = new Uint8Array(await enabled['arrayBuffer']()),
      list3 = [];
    for (let result = 0; result < list2['length']; result += 32768) {
      list3['push'](String['fromCharCode'](...list2['subarray'](result, result + 32768)));
    }
    list['push']('data:' + enabled2 + ';base64,' + btoa(list3['join']('')));
  }
  return list;
}
