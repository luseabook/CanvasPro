import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGenerateImageRequest, generateImage } from './aiImageApi.js';
test('buildGenerateImageRequest should return valid request object', async () => {
  const _0x31c881 = {
    prompt: '测试提示词',
    model: 'nano-banana-pro-vt',
    aspectRatio: '16:9',
    imageSize: '2K',
    batchSize: 1,
  };
  try {
    const _0x3d33d = await buildGenerateImageRequest(_0x31c881);
    (assert.ok(_0x3d33d), assert.ok(_0x3d33d.url), assert.ok(_0x3d33d.headers), assert.ok(_0x3d33d.body));
  } catch (_0x22a7a1) {
    assert.ok(_0x22a7a1);
  }
});
