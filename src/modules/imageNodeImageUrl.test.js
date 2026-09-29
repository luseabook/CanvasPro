import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveImageNodeDisplayUrl,
  resolveImageNodeOriginalUrl,
  resolveImageNodePreviewUrl,
  resolveImageNodeUrl,
} from './imageNodeImageUrl.js';

test('imageNodeImageUrl: 本地路径只认 data/uploads、data/assets、output 三种前缀', () => {
  assert.equal(resolveImageNodePreviewUrl({ displayLocalPath: 'data/uploads/a.png' }), '/data/uploads/a.png');
  assert.equal(resolveImageNodePreviewUrl({ displayLocalPath: 'data/assets/a.png' }), '/data/assets/a.png');
  assert.equal(resolveImageNodePreviewUrl({ displayLocalPath: 'output/a.png' }), '/output/a.png');
  assert.equal(
    resolveImageNodePreviewUrl({ displayLocalPath: 'elsewhere/a.png' }),
    '',
    '前缀不在白名单里的本地路径会被 localPathToUrl 判空',
  );
});

test('imageNodeImageUrl: 主图由 mainImageIndex 指定，越界时取不到图', () => {
  const node = {
    mainImageIndex: 1,
    images: [{ displayUrl: 'http://x/1.png' }, { displayUrl: 'http://x/2.png' }],
  };
  assert.equal(resolveImageNodePreviewUrl(node), 'http://x/2.png');
  assert.equal(
    resolveImageNodePreviewUrl({ mainImageIndex: 9, images: [{ displayUrl: 'http://x/1.png' }] }),
    '',
  );
  assert.equal(
    resolveImageNodePreviewUrl({ mainImageIndex: 9, displayUrl: 'http://x/node.png' }),
    'http://x/node.png',
    '主图取不到时还有节点级地址兜底',
  );
});

test('imageNodeImageUrl: 本地路径整体优先于远程地址', () => {
  assert.equal(
    resolveImageNodePreviewUrl({ previewUrl: 'http://x/p.png', displayLocalPath: 'data/uploads/l.png' }),
    '/data/uploads/l.png',
  );
  assert.equal(
    resolveImageNodeDisplayUrl({ thumbUrl: 'http://x/t.png', previewLocalPath: 'data/uploads/p.png' }),
    '/data/uploads/p.png',
  );
});

test('imageNodeImageUrl: 展示地址在预览之后才轮到缩略图', () => {
  assert.equal(resolveImageNodeDisplayUrl({ thumbUrl: 'http://x/t.png' }), 'http://x/t.png');
  assert.equal(resolveImageNodeDisplayUrl({ thumbnailUrl: 'http://x/tn.png' }), 'http://x/tn.png');
  assert.equal(
    resolveImageNodeDisplayUrl({ previewUrl: 'http://x/p.png', thumbUrl: 'http://x/t.png' }),
    'http://x/p.png',
  );
});

test('imageNodeImageUrl: 原始地址优先本地路径，再按 src → sourceUrl → imageUrl → displayUrl → thumbUrl 兜底', () => {
  assert.equal(
    resolveImageNodeOriginalUrl({ localPath: 'data/uploads/o.png', src: 'http://x/s.png' }),
    '/data/uploads/o.png',
  );
  assert.equal(resolveImageNodeOriginalUrl({ src: 'http://x/s.png' }), 'http://x/s.png');
  assert.equal(resolveImageNodeOriginalUrl({ sourceUrl: 'http://x/source.png' }), 'http://x/source.png');
  assert.equal(resolveImageNodeOriginalUrl({ imageUrl: 'http://x/image.png' }), 'http://x/image.png');
  assert.equal(resolveImageNodeOriginalUrl({ thumbUrl: 'http://x/thumb.png' }), 'http://x/thumb.png');
});

test('imageNodeImageUrl: resolveImageNodeUrl 默认偏原始图，preferPreview 时偏展示图', () => {
  const node = { thumbUrl: 'http://x/t.png', src: 'http://x/s.png' };
  assert.equal(resolveImageNodeUrl(node), 'http://x/s.png');
  assert.equal(resolveImageNodeUrl(node, { preferPreview: true }), 'http://x/t.png');
});

test('imageNodeImageUrl: 拿不到任何地址时统一返回空串', () => {
  assert.equal(resolveImageNodePreviewUrl(), '');
  assert.equal(resolveImageNodeDisplayUrl({}), '');
  assert.equal(resolveImageNodeOriginalUrl(), '');
  assert.equal(resolveImageNodeUrl(), '');
  assert.equal(resolveImageNodeUrl({}, { preferPreview: true }), '');
});
