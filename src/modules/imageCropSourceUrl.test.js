import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveImageCropSourceUrl } from './imageCropSourceUrl.js';

test('imageCropSourceUrl: 预览地址优先于原始地址', () => {
  assert.equal(
    resolveImageCropSourceUrl({ previewUrl: 'http://x/p.png', src: 'http://x/s.png' }),
    'http://x/p.png',
  );
});

test('imageCropSourceUrl: 预览缺失时回退到原始地址', () => {
  assert.equal(resolveImageCropSourceUrl({ src: 'http://x/s.png' }), 'http://x/s.png');
  assert.equal(resolveImageCropSourceUrl({ localPath: 'data/uploads/o.png' }), '/data/uploads/o.png');
});

test('imageCropSourceUrl: 本地显示路径会转成站点可访问地址', () => {
  assert.equal(
    resolveImageCropSourceUrl({ displayLocalPath: 'data/uploads/a.png' }),
    '/data/uploads/a.png',
  );
});

test('imageCropSourceUrl: 非法本地前缀被忽略，退回原始地址', () => {
  assert.equal(
    resolveImageCropSourceUrl({ displayLocalPath: 'bad/a.png', src: 'http://x/s.png' }),
    'http://x/s.png',
  );
});

test('imageCropSourceUrl: 什么都取不到时返回空串', () => {
  assert.equal(resolveImageCropSourceUrl({}), '');
  assert.equal(resolveImageCropSourceUrl(), '');
});
