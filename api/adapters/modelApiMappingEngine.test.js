import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBodyFromMapping,
  resolveMappedResponseValue,
  resolveMappedResponseValues,
} from './modelApiMappingEngine.js';
import { getModelApiBodyResolver, getModelApiEndpointResolver } from './modelApiResolvers/index.js';
(test('modelApi bodyMapping engine builds nested request body from manifest entries', async () => {
  const bodyFromMapping = await buildBodyFromMapping({
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
    transforms: { ratio: (value) => String(value || '').replace(/[：∶﹕]/g, ':') },
  });
  assert.deepEqual(bodyFromMapping, {
    model: 'test-model',
    prompt: 'draw',
    resolution: '2K',
    size: '16:9',
    image_urls: ['https://cdn.example.com/input.png'],
    metadata: { seed: 42, provider: 'apimart' },
  });
}),
  test('modelApi responseMapping resolves wildcard result paths and task ids', () => {
    const item = {
      data: {
        task: { id: 'task-1' },
        result: {
          images: [{ url: 'https://cdn.example.com/a.png' }, { imageUrl: 'https://cdn.example.com/b.png' }],
        },
      },
    };
    (assert.equal(resolveMappedResponseValue(item, ['data.task.id']), 'task-1'),
      assert.deepEqual(resolveMappedResponseValues(item, ['data.result.images[]']), [
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
    const run = getModelApiBodyResolver('grsaiImage'),
      key = run({
        payload: { model: 'nano-banana-2', imageSize: '1K', aspectRatio: '1:1', batchSize: 4 },
        finalPrompt: 'draw',
        modelToken: 'nano-banana-2',
        finalUrls: ['https://cdn.example.com/ref.png'],
      });
    (assert.deepEqual(key.images, ['https://cdn.example.com/ref.png']),
      assert.equal(key.replyType, 'json'),
      assert.equal(key.urls, undefined),
      assert.equal(key.batchSize, undefined),
      assert.equal(key.model, 'nano-banana-2'),
      assert.equal(key.prompt, 'draw'),
      assert.equal(key.imageSize, '1K'),
      assert.equal(key.aspectRatio, '1:1'));
  }),
  test('modelApi grsai resolver normalizes nanobanana API enums', () => {
    const run2 = getModelApiBodyResolver('grsaiImage'),
      index = run2({
        payload: { model: 'nano-banana', imageSize: '3K', aspectRatio: '自适应' },
        finalPrompt: 'draw',
        modelToken: 'nano-banana',
        finalUrls: [],
      });
    (assert.equal(index.imageSize, '2K'), assert.equal(index.aspectRatio, 'auto'));
    const result = run2({
      payload: { model: 'nano-banana-pro', imageSize: 'bogus', aspectRatio: '1:8' },
      finalPrompt: 'draw',
      modelToken: 'nano-banana-pro',
      finalUrls: [],
    });
    (assert.equal(result.imageSize, '2K'), assert.equal(result.aspectRatio, '9:16'));
    const data = run2({
      payload: { model: 'nano-banana-2', imageSize: '4K', aspectRatio: '1:8' },
      finalPrompt: 'draw',
      modelToken: 'nano-banana-2',
      finalUrls: [],
    });
    (assert.equal(data.imageSize, '2K'), assert.equal(data.aspectRatio, '1:8'));
    const options = run2({
      payload: { model: 'nano-banana-2', imageSize: '2K', aspectRatio: '1:8' },
      finalPrompt: 'draw',
      modelToken: 'nano-banana-2-4k-cl',
      finalUrls: [],
    });
    (assert.equal(options.imageSize, '4K'), assert.equal(options.aspectRatio, '1:8'));
    const target = run2({
      payload: { model: 'nano-banana-pro', imageSize: '4K', aspectRatio: '16:9' },
      finalPrompt: 'draw',
      modelToken: 'nano-banana-pro-vip',
      finalUrls: [],
    });
    assert.equal(target.imageSize, '2K');
    const source = run2({
      payload: { model: 'nano-banana-pro', imageSize: '2K', aspectRatio: '16:9' },
      finalPrompt: 'draw',
      modelToken: 'nano-banana-pro-4k-vip',
      finalUrls: [],
    });
    assert.equal(source.imageSize, '4K');
  }),
  test('modelApi grsai gpt-image-2 resolver maps UI ratios to official pixel sizes', () => {
    const run3 = getModelApiBodyResolver('grsaiGptImage2Image'),
      next = run3({
        payload: { model: 'gpt-image-2', imageSize: '4K', aspectRatio: '2:1', batchSize: 4 },
        finalPrompt: 'draw',
        modelToken: 'gpt-image-2-vip',
        finalUrls: ['https://cdn.example.com/ref.png'],
      });
    (assert.equal(next.model, 'gpt-image-2-vip'),
      assert.equal(next.prompt, 'draw'),
      assert.deepEqual(next.images, ['https://cdn.example.com/ref.png']),
      assert.equal(next.replyType, 'json'),
      assert.equal(next.aspectRatio, '3840x1920'),
      assert.equal(next.imageSize, undefined),
      assert.equal(next.batchSize, undefined),
      assert.equal(next.urls, undefined));
    const current = run3({
      payload: { model: 'gpt-image-2', imageSize: '1K', aspectRatio: '9:21' },
      finalPrompt: 'draw',
      modelToken: 'gpt-image-2',
      finalUrls: [],
    });
    (assert.equal(current.model, 'gpt-image-2'), assert.equal(current.aspectRatio, '832x1920'));
    const entry = run3({
      payload: { model: 'gpt-image-2', imageSize: '1K', aspectRatio: '4:3' },
      finalPrompt: 'draw',
      modelToken: 'gpt-image-2',
      finalUrls: [],
    });
    assert.equal(entry.aspectRatio, '1443x1090');
    const record = run3({
      payload: { model: 'gpt-image-2', imageSize: '1K', aspectRatio: '16:9' },
      finalPrompt: 'draw',
      modelToken: 'gpt-image-2-vip',
      finalUrls: [],
    });
    assert.equal(record.aspectRatio, '1280x720');
    const payload = run3({
      payload: { model: 'gpt-image-2', imageSize: '1K', aspectRatio: 'auto' },
      finalPrompt: 'draw',
      modelToken: 'gpt-image-2',
      finalUrls: [],
    });
    assert.equal(payload.aspectRatio, '1024x1024');
  }));
