import test from 'node:test';
import assert from 'node:assert/strict';
import { buildImageRequest } from './PpioAdapter.js';
function createCtx() {
  return {
    getProviderConfig(_0x139a55) {
      if (_0x139a55 === 'ppio') return { apiUrl: 'https://api.ppio.example.com', apiKey: 'k_ppio' };
      if (_0x139a55 === 'grsai') return { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' };
      return {};
    },
    async processInputImages(_0x58c9af = []) {
      return Array.isArray(_0x58c9af) ? _0x58c9af.filter(Boolean) : [];
    },
  };
}
function parseSize(_0x2b7f31) {
  const _0x3e1344 = String(_0x2b7f31 || ''),
    _0x56f4a3 = _0x3e1344.match(/^(\d+)x(\d+)$/);
  if (!_0x56f4a3) return null;
  return { width: Number(_0x56f4a3[1]), height: Number(_0x56f4a3[2]) };
}
(test('PpioAdapter: 自适应默认回退 1:1，但支持 resolvedRatioLabel 覆盖', async () => {
  const _0x1659ea = createCtx(),
    _0x5542ef = await buildImageRequest(
      { model: 'ppio/seedream-4.0', prompt: 'p', imageSize: '2K', aspectRatio: '自适应', inputUrls: [] },
      'p',
      _0x1659ea,
    );
  assert.equal(_0x5542ef.body.size, '2048x2048');
  const _0x2d61f9 = await buildImageRequest(
    {
      model: 'ppio/seedream-4.0',
      prompt: 'p',
      imageSize: '2K',
      aspectRatio: '自适应',
      resolvedRatioLabel: '16:9',
      inputUrls: [],
    },
    'p',
    _0x1659ea,
  );
  assert.equal(_0x2d61f9.body.size, '2752x1536');
  const _0x5bb557 = await buildImageRequest(
    { model: 'ppio/seedream-4.0', prompt: 'p', imageSize: '2K', aspectRatio: '', inputUrls: [] },
    'p',
    _0x1659ea,
  );
  assert.equal(_0x5bb557.body.size, '2048x2048');
}),
  test('PpioAdapter: all quality and ratio mappings satisfy pixel bounds and 64 alignment', async () => {
    const _0x294423 = createCtx(),
      _0x3f7cb3 = ['1K', '2K', '3K', '4K'],
      _0x51ba86 = ['1:1', '9:16', '16:9', '3:4', '4:3', '3:2', '2:3', '5:4', '4:5', '21:9'],
      _0x2742c2 = 0xa00 * 0x5a0,
      _0x4eb2fb = 0x9ec290,
      _0x2ff52f = 1 / 16,
      _0x29141c = 16;
    for (const _0x5bc967 of _0x3f7cb3) {
      for (const _0x2c7cf7 of _0x51ba86) {
        const _0x480f37 = await buildImageRequest(
            {
              model: 'ppio/seedream-5.0-lite',
              prompt: 'p',
              imageSize: _0x5bc967,
              aspectRatio: _0x2c7cf7,
              inputUrls: [],
            },
            'p',
            _0x294423,
          ),
          _0x2b11b6 = parseSize(_0x480f37.body.size);
        assert.ok(_0x2b11b6, 'invalid size format: ' + _0x480f37.body.size);
        const _0x309629 = _0x2b11b6.width * _0x2b11b6.height,
          _0x3a5335 = _0x2b11b6.width / _0x2b11b6.height;
        (assert.equal(_0x2b11b6.width % 64, 0, '瀹芥湭64瀵归綈: ' + _0x480f37.body.size),
          assert.equal(_0x2b11b6.height % 64, 0, 'height is not 64-aligned: ' + _0x480f37.body.size),
          assert.ok(_0x309629 >= _0x2742c2, 'pixel count is too small: ' + _0x480f37.body.size),
          assert.ok(_0x309629 <= _0x4eb2fb, 'pixel count is too large: ' + _0x480f37.body.size),
          assert.ok(_0x3a5335 >= _0x2ff52f, 'ratio is too small: ' + _0x480f37.body.size),
          assert.ok(_0x3a5335 <= _0x29141c, 'ratio is too large: ' + _0x480f37.body.size));
      }
    }
  }),
  test('PpioAdapter: 多图输入按上传处理后的顺序写入请求体', async () => {
    const _0x166eb5 = [],
      _0x52f8cd = {
        ...createCtx(),
        async processInputImages(_0x31f562 = []) {
          return (
            _0x166eb5.push(..._0x31f562),
            _0x31f562.map((_0x212d30) => 'https://uploaded.example/' + String(_0x212d30).split('/').pop())
          );
        },
      },
      _0x3ab13d = await buildImageRequest(
        {
          model: 'ppio/seedream-4.0',
          prompt: 'p',
          imageSize: '2K',
          aspectRatio: '1:1',
          inputUrls: [
            'https://local.example/target.png',
            'https://local.example/source.png',
            'https://local.example/style.png',
          ],
        },
        'p',
        _0x52f8cd,
      );
    (assert.deepEqual(_0x166eb5, [
      'https://local.example/target.png',
      'https://local.example/source.png',
      'https://local.example/style.png',
    ]),
      assert.deepEqual(_0x3ab13d.body.images, [
        'https://uploaded.example/target.png',
        'https://uploaded.example/source.png',
        'https://uploaded.example/style.png',
      ]));
  }));
