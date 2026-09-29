import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCanvasVideoPosterUrl } from './canvasMediaLocalService.js';

test('resolveCanvasVideoPosterUrl prefers the main video poster and falls back to root fields', () => {
  assert.equal(
    resolveCanvasVideoPosterUrl({
      mainVideoIndex: 1,
      videos: [{ posterLocalPath: 'output/first.png' }, { thumbLocalPath: 'data/uploads/main.webp' }],
      posterLocalPath: 'output/root.png',
    }),
    '/data/uploads/main.webp',
  );
  assert.equal(
    resolveCanvasVideoPosterUrl({
      videos: [{ posterUrl: 'https://cdn.example/main.png' }],
      previewLocalPath: 'data/assets/root-preview.webp',
    }),
    '/data/assets/root-preview.webp',
  );
});

test('resolveCanvasVideoPosterUrl keeps inline previews and rejects remote or file URLs', () => {
  assert.equal(
    resolveCanvasVideoPosterUrl({ posterUrl: 'data:image/png;base64,AAAA' }),
    'data:image/png;base64,AAAA',
  );
  assert.equal(resolveCanvasVideoPosterUrl({ posterUrl: 'blob:preview-id' }), 'blob:preview-id');
  assert.equal(resolveCanvasVideoPosterUrl({ posterUrl: 'https://cdn.example/main.png' }), '');
  assert.equal(resolveCanvasVideoPosterUrl({ posterUrl: 'file:///C:/secret.png' }), '');
});
