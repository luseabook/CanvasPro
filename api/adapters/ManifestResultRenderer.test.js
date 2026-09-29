import test from 'node:test';
import assert from 'node:assert/strict';

import { buildManifestResultPatch, resolveManifestResultValues } from './ManifestResultRenderer.js';

test('ManifestResultRenderer: resolves mapped values before fallbacks and removes duplicates', () => {
  const response = {
    data: {
      items: [{ url: 'https://cdn.test/a.png' }, { url: 'https://cdn.test/b.png' }],
      b64: 'AQID',
      mime: 'image/png',
    },
    imageUrl: 'https://cdn.test/a.png',
    url: 'https://cdn.test/fallback.png',
  };

  assert.deepEqual(
    resolveManifestResultValues(response, {
      executionManifest: {
        kind: 'image',
        result: { imagePaths: ['data.items[].url'] },
        responseMapping: {
          paths: ['data.items[].url'],
          base64Paths: ['data.b64'],
          base64MimeTypePaths: ['data.mime'],
        },
      },
    }),
    [
      'https://cdn.test/a.png',
      'https://cdn.test/b.png',
      'data:image/png;base64,AQID',
      'https://cdn.test/fallback.png',
    ],
  );
});

test('ManifestResultRenderer: builds output patches for each media kind', () => {
  assert.deepEqual(
    buildManifestResultPatch(
      { outputUrl: 'https://cdn.test/image.png' },
      { modelManifest: { outputType: 'image' } },
    ),
    {
      outputUrl: 'https://cdn.test/image.png',
      imageUrl: 'https://cdn.test/image.png',
      sourceUrl: 'https://cdn.test/image.png',
      thumbUrl: 'https://cdn.test/image.png',
    },
  );
  assert.deepEqual(
    buildManifestResultPatch(
      { video_url: 'https://cdn.test/video.mp4' },
      { executionManifest: { kind: 'video' } },
    ),
    {
      outputVideoUrl: 'https://cdn.test/video.mp4',
      videoUrl: 'https://cdn.test/video.mp4',
    },
  );
  assert.deepEqual(
    buildManifestResultPatch({ outputText: 'hello' }, { executionManifest: { kind: 'text' } }),
    { outputText: 'hello' },
  );
});

test('ManifestResultRenderer: returns an empty patch when no result is available', () => {
  assert.deepEqual(buildManifestResultPatch({}, { executionManifest: { kind: 'video' } }), {});
});
