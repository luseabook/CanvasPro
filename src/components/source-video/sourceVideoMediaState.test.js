import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveCanvasVideoPosterUrl } from '../../services/canvasMediaLocalService.js';
import {
  resolveSourceVideoMediaTaskSrc,
  resolveSourceVideoPosterSrc,
} from './sourceVideoMediaState.js';

test('sourceVideoMediaState: poster resolution delegates to the canvas video poster resolver', () => {
  const nodeData = {
    mainVideoIndex: 1,
    posterLocalPath: 'output/root-poster.jpg',
    videos: [
      { posterLocalPath: 'output/first-poster.jpg' },
      { posterLocalPath: 'output/second-poster.jpg' },
    ],
  };

  assert.equal(resolveSourceVideoPosterSrc(nodeData), resolveCanvasVideoPosterUrl(nodeData));
  assert.equal(resolveSourceVideoPosterSrc(nodeData), '/output/second-poster.jpg');
  assert.equal(
    resolveSourceVideoPosterSrc({ posterUrl: 'https://example.invalid/poster.jpg' }),
    '',
  );
});

test('sourceVideoMediaState: task source prefers root fields, then the selected video', () => {
  assert.equal(
    resolveSourceVideoMediaTaskSrc({
      localPath: 'output/root-video.mp4',
      mainVideoIndex: 1,
      videos: [
        { localPath: 'output/first-video.mp4' },
        { localPath: 'output/second-video.mp4' },
      ],
    }),
    'output/root-video.mp4',
  );

  assert.equal(
    resolveSourceVideoMediaTaskSrc({
      mainVideoIndex: 1,
      videos: [
        { localPath: 'output/first-video.mp4' },
        { localPath: 'output/second-video.mp4' },
      ],
    }),
    'output/second-video.mp4',
  );

  assert.equal(
    resolveSourceVideoMediaTaskSrc({
      mainVideoIndex: 9,
      videos: [{ resultUrl: '/output/fallback-video.mp4' }],
    }),
    'output/fallback-video.mp4',
  );

  assert.equal(
    resolveSourceVideoMediaTaskSrc({
      src: 'aic-local-preview://preview/token/source.mp4',
    }),
    '',
  );
});
