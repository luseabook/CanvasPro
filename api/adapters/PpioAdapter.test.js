import test from 'node:test';
import assert from 'node:assert/strict';
import { buildImageRequest } from './PpioAdapter.js';
function createCtx() {
  return {
    getProviderConfig(value) {
      if (value === 'ppio') return { apiUrl: 'https://api.ppio.example.com', apiKey: 'k_ppio' };
      if (value === 'grsai') return { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' };
      return {};
    },
    async processInputImages(list = []) {
      return Array.isArray(list) ? list.filter(Boolean) : [];
    },
  };
}
function parseSize(item) {
  const key = String(item || ''),
    enabled = key.match(/^(\d+)x(\d+)$/);
  if (!enabled) return null;
  return { width: Number(enabled[1]), height: Number(enabled[2]) };
}
(test('PpioAdapter: 自适应默认回退 1:1，但支持 resolvedRatioLabel 覆盖', async () => {
  const ctx = createCtx(),
    dom = await buildImageRequest(
      { model: 'ppio/seedream-4.0', prompt: 'p', imageSize: '2K', aspectRatio: '自适应', inputUrls: [] },
      'p',
      ctx,
    );
  assert.equal(dom.body.size, '2048x2048');
  const dom2 = await buildImageRequest(
    {
      model: 'ppio/seedream-4.0',
      prompt: 'p',
      imageSize: '2K',
      aspectRatio: '自适应',
      resolvedRatioLabel: '16:9',
      inputUrls: [],
    },
    'p',
    ctx,
  );
  assert.equal(dom2.body.size, '2752x1536');
  const dom3 = await buildImageRequest(
    { model: 'ppio/seedream-4.0', prompt: 'p', imageSize: '2K', aspectRatio: '', inputUrls: [] },
    'p',
    ctx,
  );
  assert.equal(dom3.body.size, '2048x2048');
}),
  test('PpioAdapter: all quality and ratio mappings satisfy pixel bounds and 64 alignment', async () => {
    const ctx2 = createCtx(),
      index = ['1K', '2K', '3K', '4K'],
      result = ['1:1', '9:16', '16:9', '3:4', '4:3', '3:2', '2:3', '5:4', '4:5', '21:9'],
      data = 0xa00 * 0x5a0,
      options = 0x9ec290,
      target = 1 / 16,
      source = 16;
    for (const imageSize of index) {
      for (const aspectRatio of result) {
        const dom4 = await buildImageRequest(
            {
              model: 'ppio/seedream-5.0-lite',
              prompt: 'p',
              imageSize: imageSize,
              aspectRatio: aspectRatio,
              inputUrls: [],
            },
            'p',
            ctx2,
          ),
          box = parseSize(dom4.body.size);
        assert.ok(box, 'invalid size format: ' + dom4.body.size);
        const next = box.width * box.height,
          current = box.width / box.height;
        (assert.equal(box.width % 64, 0, '瀹芥湭64瀵归綈: ' + dom4.body.size),
          assert.equal(box.height % 64, 0, 'height is not 64-aligned: ' + dom4.body.size),
          assert.ok(next >= data, 'pixel count is too small: ' + dom4.body.size),
          assert.ok(next <= options, 'pixel count is too large: ' + dom4.body.size),
          assert.ok(current >= target, 'ratio is too small: ' + dom4.body.size),
          assert.ok(current <= source, 'ratio is too large: ' + dom4.body.size));
      }
    }
  }),
  test('PpioAdapter: 多图输入按上传处理后的顺序写入请求体', async () => {
    const list2 = [],
      entry = {
        ...createCtx(),
        async processInputImages(list3 = []) {
          return (
            list2.push(...list3),
            list3.map((item2) => 'https://uploaded.example/' + String(item2).split('/').pop())
          );
        },
      },
      dom5 = await buildImageRequest(
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
        entry,
      );
    (assert.deepEqual(list2, [
      'https://local.example/target.png',
      'https://local.example/source.png',
      'https://local.example/style.png',
    ]),
      assert.deepEqual(dom5.body.images, [
        'https://uploaded.example/target.png',
        'https://uploaded.example/source.png',
        'https://uploaded.example/style.png',
      ]));
  }));
