import test from 'node:test';
import assert from 'node:assert/strict';

import { buildDebugJsonPreview, resolveDebugImageSource } from './debugImagePreview.js';

test('debugImagePreview: safe local images resolve and videos or masked values do not', () => {
  assert.equal(resolveDebugImageSource('data/uploads/a.png'), '/data/uploads/a.png');
  assert.equal(resolveDebugImageSource('output/a.jpg'), '/output/a.jpg');
  assert.equal(resolveDebugImageSource('https://example.com/a.png'), 'https://example.com/a.png');
  assert.equal(resolveDebugImageSource('a.mp4'), '');
  assert.equal(resolveDebugImageSource('***'), '');
  assert.equal(resolveDebugImageSource(''), '');
});

test('debugImagePreview: image context records source ranges and dotted paths', () => {
  const preview = buildDebugJsonPreview(
    { imageUrl: 'data/uploads/a.png', nested: { image: 'output/b.jpg' } },
    { imageContext: true },
  );
  assert.equal(preview.images.length, 2);
  assert.deepEqual(
    preview.images.map(({ src, path }) => ({ src, path })),
    [
      { src: '/data/uploads/a.png', path: 'imageUrl' },
      { src: '/output/b.jpg', path: 'nested.image' },
    ],
  );
  assert.equal(JSON.parse(preview.content).nested.image, 'output/b.jpg');
});

test('debugImagePreview: non-image context still returns formatted JSON without image ranges', () => {
  const preview = buildDebugJsonPreview({ localPath: 'data/uploads/a.png' });
  assert.deepEqual(preview.images, []);
  assert.match(preview.content, /data\/uploads\/a\.png/);
});
