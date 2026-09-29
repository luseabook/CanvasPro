export async function encodeTextMediaInputs(_0x3721dc, _0x5ed506, _0x48747e) {
  const _0xa8600b = [];
  for (const _0x3b3a72 of _0x3721dc) {
    if (new RegExp('^data:' + _0x5ed506 + '/[^;]+;base64,', 'i')['test'](_0x3b3a72)) {
      _0xa8600b['push'](_0x3b3a72);
      continue;
    }
    const _0x3405b5 = await _0x48747e(_0x3b3a72);
    let _0x32359a = String(_0x3405b5['type'] || '')
      ['split'](';', 0x1)[0x0]
      ['toLowerCase']();
    if (!_0x32359a || _0x32359a === 'application/octet-stream') {
      const _0x5da421 = String(_0x3b3a72)['split'](/[?#]/, 0x1)[0x0]['split']('.')['pop']()['toLowerCase']();
      _0x32359a =
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
        }[_0x5da421] || '';
    }
    if (!_0x3405b5['size'] || !_0x32359a['startsWith'](_0x5ed506 + '/'))
      throw new Error(
        'Invalid\x20' + _0x5ed506 + '\x20input:\x20missing\x20media\x20content\x20or\x20MIME\x20type',
      );
    const _0xd27c28 = new Uint8Array(await _0x3405b5['arrayBuffer']()),
      _0x49143b = [];
    for (let _0x3187e3 = 0x0; _0x3187e3 < _0xd27c28['length']; _0x3187e3 += 0x8000) {
      _0x49143b['push'](String['fromCharCode'](..._0xd27c28['subarray'](_0x3187e3, _0x3187e3 + 0x8000)));
    }
    _0xa8600b['push']('data:' + _0x32359a + ';base64,' + btoa(_0x49143b['join']('')));
  }
  return _0xa8600b;
}
