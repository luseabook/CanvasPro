import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBodyFromMapping,
  resolveMappedResponseValue,
  resolveMappedResponseValues,
} from './modelApiMappingEngine.js';
import { getModelApiBodyResolver, getModelApiEndpointResolver } from './modelApiResolvers/index.js';
(test('modelApi bodyMapping engine builds nested request body from manifest entries', async () => {
  const _0x20d61d = await buildBodyFromMapping({
    bodyMapping: [
      { path: 'model', from: 'model' },
      { path: 'prompt', from: 'prompt' },
      { path: 'resolution', from: 'param', field: 'imageSize', defaultValue: '2K' },
      { path: 'size', from: 'param', field: 'aspectRatio', transform: 'ratio', omitWhenEmpty: true },
      { path: 'image_urls', from: 'inputImages', omitWhenEmpty: true },
      { path: 'metadata.seed', from: 'param', field: 'seed', when: { field: 'seed', exists: true } },
      { path: 'metadata.provider', from: 'constant', value: 'apimart' },
    ],
    context: {
      finalPrompt: 'draw',
      modelToken: 'test-model',
      inputImages: ['https://cdn.example.com/input.png'],
      payload: { aspectRatio: '16:9', seed: 42 },
    },
    transforms: { ratio: (_0x56d3b5) => String(_0x56d3b5 || '').replace(/[：∶﹕]/g, ':') },
  });
  assert.deepEqual(_0x20d61d, {
    model: 'test-model',
    prompt: 'draw',
    resolution: '2K',
    size: '16:9',
    image_urls: ['https://cdn.example.com/input.png'],
    metadata: { seed: 42, provider: 'apimart' },
  });
}),
  test('modelApi responseMapping resolves wildcard result paths and task ids', () => {
    const _0x2609cc = {
      data: {
        task: { id: 'task-1' },
        result: {
          images: [{ url: 'https://cdn.example.com/a.png' }, { imageUrl: 'https://cdn.example.com/b.png' }],
        },
      },
    };
    (assert.equal(resolveMappedResponseValue(_0x2609cc, ['data.task.id']), 'task-1'),
      assert.deepEqual(resolveMappedResponseValues(_0x2609cc, ['data.result.images[]']), [
        'https://cdn.example.com/a.png',
        'https://cdn.example.com/b.png',
      ]));
  }),
  test('modelApi resolver lookup is whitelist-only', () => {
    (assert.equal(typeof getModelApiBodyResolver('ppioImageSize'), 'function'),
      assert.equal(typeof getModelApiEndpointResolver('runninghubImageEndpoint'), 'function'),
      assert.equal(getModelApiBodyResolver('unknownResolver'), null),
      assert.equal(getModelApiEndpointResolver('unknownResolver'), null));
  }),
  test('modelApi grsai resolver maps uploaded references to images', () => {
    const _0x56d81e = getModelApiBodyResolver('grsaiImage'),
      _0x3fc615 = _0x56d81e({
        payload: { model: 'nano-banana-2', imageSize: '1K', aspectRatio: '1:1', batchSize: 4 },
        finalPrompt: 'draw',
        modelToken: 'nano-banana-2',
        finalUrls: ['https://cdn.example.com/ref.png'],
      });
    (assert.deepEqual(_0x3fc615.images, ['https://cdn.example.com/ref.png']),
      assert.equal(_0x3fc615.replyType, 'json'),
      assert.equal(_0x3fc615.urls, undefined),
      assert.equal(_0x3fc615.batchSize, undefined),
      assert.equal(_0x3fc615.model, 'nano-banana-2'),
      assert.equal(_0x3fc615.prompt, 'draw'),
      assert.equal(_0x3fc615.imageSize, '1K'),
      assert.equal(_0x3fc615.aspectRatio, '1:1'));
  }),
  test('modelApi grsai resolver normalizes nanobanana API enums', () => {
    const _0x276c64 = getModelApiBodyResolver('grsaiImage'),
      _0x3f84b8 = _0x276c64({
        payload: { model: 'nano-banana', imageSize: '3K', aspectRatio: '自适应' },
        finalPrompt: 'draw',
        modelToken: 'nano-banana',
        finalUrls: [],
      });
    (assert.equal(_0x3f84b8.imageSize, '2K'), assert.equal(_0x3f84b8.aspectRatio, 'auto'));
    const _0x2853af = _0x276c64({
      payload: { model: 'nano-banana-pro', imageSize: 'bogus', aspectRatio: '1:8' },
      finalPrompt: 'draw',
      modelToken: 'nano-banana-pro',
      finalUrls: [],
    });
    (assert.equal(_0x2853af.imageSize, '2K'), assert.equal(_0x2853af.aspectRatio, '9:16'));
    const _0x4b63d1 = _0x276c64({
      payload: { model: 'nano-banana-2', imageSize: '4K', aspectRatio: '1:8' },
      finalPrompt: 'draw',
      modelToken: 'nano-banana-2',
      finalUrls: [],
    });
    (assert.equal(_0x4b63d1.imageSize, '2K'), assert.equal(_0x4b63d1.aspectRatio, '1:8'));
    const _0x45afe2 = _0x276c64({
      payload: { model: 'nano-banana-2', imageSize: '2K', aspectRatio: '1:8' },
      finalPrompt: 'draw',
      modelToken: 'nano-banana-2-4k-cl',
      finalUrls: [],
    });
    (assert.equal(_0x45afe2.imageSize, '4K'), assert.equal(_0x45afe2.aspectRatio, '1:8'));
    const _0x127734 = _0x276c64({
      payload: { model: 'nano-banana-pro', imageSize: '4K', aspectRatio: '16:9' },
      finalPrompt: 'draw',
      modelToken: 'nano-banana-pro-vip',
      finalUrls: [],
    });
    assert.equal(_0x127734.imageSize, '2K');
    const _0x3becee = _0x276c64({
      payload: { model: 'nano-banana-pro', imageSize: '2K', aspectRatio: '16:9' },
      finalPrompt: 'draw',
      modelToken: 'nano-banana-pro-4k-vip',
      finalUrls: [],
    });
    assert.equal(_0x3becee.imageSize, '4K');
  }),
  test('modelApi grsai gpt-image-2 resolver maps UI ratios to official pixel sizes', () => {
    const _0x2989f3 = getModelApiBodyResolver('grsaiGptImage2Image'),
      _0x397b02 = _0x2989f3({
        payload: { model: 'gpt-image-2', imageSize: '4K', aspectRatio: '2:1', batchSize: 4 },
        finalPrompt: 'draw',
        modelToken: 'gpt-image-2-vip',
        finalUrls: ['https://cdn.example.com/ref.png'],
      });
    (assert.equal(_0x397b02.model, 'gpt-image-2-vip'),
      assert.equal(_0x397b02.prompt, 'draw'),
      assert.deepEqual(_0x397b02.images, ['https://cdn.example.com/ref.png']),
      assert.equal(_0x397b02.replyType, 'json'),
      assert.equal(_0x397b02.aspectRatio, '3840x1920'),
      assert.equal(_0x397b02.imageSize, undefined),
      assert.equal(_0x397b02.batchSize, undefined),
      assert.equal(_0x397b02.urls, undefined));
    const _0x4d643d = _0x2989f3({
      payload: { model: 'gpt-image-2', imageSize: '1K', aspectRatio: '9:21' },
      finalPrompt: 'draw',
      modelToken: 'gpt-image-2',
      finalUrls: [],
    });
    (assert.equal(_0x4d643d.model, 'gpt-image-2'), assert.equal(_0x4d643d.aspectRatio, '832x1920'));
    const _0x339481 = _0x2989f3({
      payload: { model: 'gpt-image-2', imageSize: '1K', aspectRatio: '4:3' },
      finalPrompt: 'draw',
      modelToken: 'gpt-image-2',
      finalUrls: [],
    });
    assert.equal(_0x339481.aspectRatio, '1443x1090');
    const _0xd5420c = _0x2989f3({
      payload: { model: 'gpt-image-2', imageSize: '1K', aspectRatio: '16:9' },
      finalPrompt: 'draw',
      modelToken: 'gpt-image-2-vip',
      finalUrls: [],
    });
    assert.equal(_0xd5420c.aspectRatio, '1280x720');
    const _0x5643b8 = _0x2989f3({
      payload: { model: 'gpt-image-2', imageSize: '1K', aspectRatio: 'auto' },
      finalPrompt: 'draw',
      modelToken: 'gpt-image-2',
      finalUrls: [],
    });
    assert.equal(_0x5643b8.aspectRatio, '1024x1024');
  }));
