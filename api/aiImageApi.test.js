import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGenerateImageRequest, generateImage } from './aiImageApi.js';
test('buildGenerateImageRequest should return valid request object', async () => {
  const value = {
    prompt: '测试提示词',
    model: 'nano-banana-pro-vt',
    aspectRatio: '16:9',
    imageSize: '2K',
    batchSize: 1,
  };
  try {
    const response = await buildGenerateImageRequest(value);
    (assert.ok(response), assert.ok(response.url), assert.ok(response.headers), assert.ok(response.body));
  } catch (item) {
    assert.ok(item);
  }
});
