import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WHITEBOARD_BACKGROUND_SOURCE_TYPES,
  drawWhiteboardBackgroundImage,
  getWhiteboardBackgroundInputSignature,
  getWhiteboardBackgroundWorldRect,
  getWhiteboardSizeForBackground,
  isWhiteboardBackgroundSourceType,
  resolveWhiteboardBackgroundInput,
} from './whiteboardBackgroundInput.js';

test('whiteboardBackgroundInput: source types are exact and reject text values', () => {
  assert.deepEqual(WHITEBOARD_BACKGROUND_SOURCE_TYPES, ['source-image', 'ai-image']);
  assert.equal(isWhiteboardBackgroundSourceType(' source-image '), true);
  assert.equal(isWhiteboardBackgroundSourceType('source-video'), false);
  assert.equal(isWhiteboardBackgroundSourceType(null), false);
});

test('whiteboardBackgroundInput: latest eligible edge supplies identity and dimensions', () => {
  const nodes = {
    im1: {
      id: 'im1',
      type: 'source-image',
      imageUrl: 'https://cdn.example/a.png',
      imageWidth: 1600,
      imageHeight: 900,
      thumbId: 'thumb-a',
    },
    ai1: {
      id: 'ai1',
      type: 'ai-image',
      images: [
        { imageUrl: 'https://cdn.example/first.png', imageWidth: 100, imageHeight: 100 },
        {
          imageUrl: 'https://cdn.example/main.png',
          imageWidth: 2048,
          imageHeight: 1024,
          thumbId: 'thumb-main',
        },
      ],
      mainImageIndex: 1,
    },
  };
  const input = resolveWhiteboardBackgroundInput({
    whiteboardId: 'wb',
    nodes,
    edges: {
      old: { id: 'old', sourceId: 'im1', targetId: 'wb', createdAt: 1 },
      newest: { id: 'newest', sourceId: 'ai1', targetId: 'wb', createdAt: 3 },
      unrelated: { id: 'other', sourceId: 'im1', targetId: 'other', createdAt: 9 },
    },
  });
  assert.equal(input.edgeId, 'newest');
  assert.equal(input.sourceId, 'ai1');
  assert.equal(input.sourceType, 'ai-image');
  assert.equal(input.url, 'https://cdn.example/main.png');
  assert.equal(input.rawUrl, 'https://cdn.example/main.png');
  assert.equal(input.width, 2048);
  assert.equal(input.height, 1024);
  assert.deepEqual(input.thumbIds, ['thumb-main']);
  assert.match(input.identity, /mainImageIndex=1/);
});

test('whiteboardBackgroundInput: signature includes rendered URLs and cache identity', () => {
  assert.equal(getWhiteboardBackgroundInputSignature(null), '');
  assert.equal(
    getWhiteboardBackgroundInputSignature({
      identity: 'edge=e',
      previewUrls: ['/data/uploads/p.png'],
      fullUrls: ['/data/uploads/f.png'],
      compositionUrls: ['/data/uploads/c.png'],
      width: 10,
      height: 20,
      thumbIds: ['t'],
      thumbnailCacheRefs: ['data/uploads/cache.png'],
    }),
    'edge=e|/data/uploads/p.png|/data/uploads/f.png|/data/uploads/c.png|10|20|t|data/uploads/cache.png',
  );
});

test('whiteboardBackgroundInput: world rect letterboxes and falls back to frame defaults', () => {
  assert.deepEqual(
    getWhiteboardBackgroundWorldRect({
      imageWidth: 200,
      imageHeight: 100,
      frameWidth: 100,
      frameHeight: 100,
    }),
    { x: 0, y: 25, width: 100, height: 50 },
  );
  assert.deepEqual(
    getWhiteboardBackgroundWorldRect({
      imageWidth: 100,
      imageHeight: 200,
      frameWidth: 100,
      frameHeight: 100,
    }),
    { x: 25, y: 0, width: 50, height: 100 },
  );
});

test('whiteboardBackgroundInput: drawing applies viewport translation and zoom', () => {
  const calls = [];
  const ctx = {
    save: () => calls.push(['save']),
    restore: () => calls.push(['restore']),
    drawImage: (...args) => calls.push(['drawImage', ...args]),
    globalAlpha: 0,
  };
  assert.equal(
    drawWhiteboardBackgroundImage({
      ctx,
      image: { id: 'img' },
      viewport: { x: 10, y: 20, zoom: 2 },
      imageWidth: 200,
      imageHeight: 100,
      frameWidth: 100,
      frameHeight: 100,
    }),
    true,
  );
  assert.equal(ctx.globalAlpha, 1);
  assert.deepEqual(calls, [['save'], ['drawImage', { id: 'img' }, -20, 10, 200, 100], ['restore']]);
  assert.equal(drawWhiteboardBackgroundImage({ ctx, image: {}, viewport: { zoom: 0 } }), false);
});

test('whiteboardBackgroundInput: background sizing preserves area and minimum sides', () => {
  assert.equal(getWhiteboardSizeForBackground({ imageWidth: 0, imageHeight: 100 }), null);
  assert.deepEqual(
    getWhiteboardSizeForBackground({
      imageWidth: 400,
      imageHeight: 100,
      currentWidth: 100,
      currentHeight: 100,
      minWidth: 1,
      minHeight: 1,
    }),
    { width: 200, height: 50 },
  );
  assert.deepEqual(
    getWhiteboardSizeForBackground({
      imageWidth: 4,
      imageHeight: 1,
      currentWidth: 1,
      currentHeight: 1,
      minWidth: 50,
      minHeight: 50,
    }),
    { width: 200, height: 50 },
  );
});
