import test from 'node:test';
import assert from 'node:assert/strict';

import { binghuoVideo } from './binghuoVideoResolvers.js';

test('binghuoVideoResolvers: builds Seedance frame inputs and clears stale fields', () => {
  const body = binghuoVideo({
    currentBody: {
      prompt: 'Animate the shot',
      images: ['stale.png'],
      start_frame: ['stale-first.png'],
      end_frame: ['stale-last.png'],
      reference_videos: ['stale.mp4'],
    },
    payload: { generationParams: { mode: 'frames' } },
    inputImages: ['fallback.png'],
    finalUrlsBySlot: {
      firstFrame: ['first.png'],
      lastFrame: ['last.png'],
    },
    executionManifest: {
      extensions: {
        binghuoVideo: {
          component: 'seedance2',
          supportsFrames: true,
          modeField: 'mode',
          maxImages: 4,
          maxVideos: 1,
          maxAudios: 1,
        },
      },
    },
  });

  assert.deepEqual(body, {
    prompt: 'Animate the shot',
    start_frame: ['first.png'],
    end_frame: ['last.png'],
  });
});

test('binghuoVideoResolvers: builds Seedance reference inputs and validates minimum images', () => {
  const executionManifest = {
    extensions: {
      binghuoVideo: {
        component: 'seedance2',
        supportsFrames: true,
        modeField: 'mode',
        minImages: 1,
        maxImages: 2,
        maxVideos: 1,
        maxAudios: 1,
        audioRequiresImage: true,
      },
    },
  };
  const result = binghuoVideo({
    currentBody: { prompt: 'Reference this' },
    payload: { generationParams: { mode: 'reference' } },
    inputImages: ['image.png'],
    inputVideos: ['video.mp4'],
    inputAudios: ['audio.mp3'],
    finalUrlsBySlot: { referenceImage: ['reference.png'] },
    executionManifest,
  });

  assert.deepEqual(result, {
    prompt: 'Reference this',
    images: ['reference.png', 'image.png'],
    reference_videos: ['video.mp4'],
    reference_audios: ['audio.mp3'],
  });

  assert.throws(
    () =>
      binghuoVideo({
        currentBody: { prompt: 'Reference this' },
        payload: { generationParams: { mode: 'reference' } },
        inputAudios: ['audio.mp3'],
        executionManifest,
      }),
    /至少需要 1 张参考图/,
  );
});

test('binghuoVideoResolvers: validates raw UI schema options', () => {
  assert.throws(
    () =>
      binghuoVideo({
        currentBody: { prompt: 'Prompt' },
        rawPayload: { aspectRatio: '4:3' },
        modelManifest: {
          displayName: 'Video model',
          uiSchema: {
            fields: [
              {
                id: 'aspectRatio',
                label: 'Aspect Ratio',
                type: 'select',
                options: ['16:9'],
              },
            ],
          },
        },
        executionManifest: { extensions: { binghuoVideo: {} } },
      }),
    /不支持/,
  );
});
