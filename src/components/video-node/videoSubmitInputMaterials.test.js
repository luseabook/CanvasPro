import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveVideoSubmitInputMaterials } from './videoSubmitInputMaterials.js';

test('videoSubmitInputMaterials: deduplicates initial images and enriches matching asset refs', () => {
  const result = resolveVideoSubmitInputMaterials({
    initialImageUrls: ['https://cdn.example/image-a.png'],
    assetInputRefs: [
      {
        type: 'image',
        url: 'https://cdn.example/image-a.png',
        imageSizeBytes: 2048,
        assetRefSource: 'asset-library',
      },
      { type: 'audio', url: '/data/assets/audio.mp3', audioDuration: 7, audioSizeBytes: 1024 },
    ],
  });

  assert.deepEqual(result.modelApi.images, ['https://cdn.example/image-a.png']);
  assert.equal(result.modelApi.imageEntries[0].sizeBytes, 2048);
  assert.equal(result.modelApi.imageEntries[0].assetRefSource, 'asset-library');
  assert.deepEqual(result.modelApi.audios, ['/data/assets/audio.mp3']);
  assert.equal(result.modelApi.audioEntries[0].duration, 7);
  assert.equal(result.modelApi.audioEntries[0].sizeBytes, 1024);
  assert.deepEqual(result.dreamina.images, ['https://cdn.example/image-a.png']);
});

test('videoSubmitInputMaterials: resolves image, video, and audio edges through the media accessor', () => {
  const result = resolveVideoSubmitInputMaterials({
    inEdges: [
      { id: 'edge-image', sourceId: 'image-1', refSlot: 'refImage' },
      { id: 'edge-video', sourceId: 'video-1', refSlot: 'sourceVideo' },
      { id: 'edge-audio', sourceId: 'audio-1', refSlot: 'audio' },
    ],
    nodes: {
      'image-1': { id: 'image-1', type: 'source-image', localPath: 'data/assets/image.png' },
      'video-1': {
        id: 'video-1',
        type: 'source-video',
        videoUrl: 'https://cdn.example/video.mp4',
        videoDuration: 5,
        videoSizeBytes: 4096,
      },
      'audio-1': {
        id: 'audio-1',
        type: 'source-audio',
        localPath: 'data/assets/audio.mp3',
        audioDuration: 3,
      },
    },
    resolveMediaUrl: (url) => `mapped:${url}`,
  });

  assert.deepEqual(result.modelApi.images, ['mapped:/data/assets/image.png']);
  assert.deepEqual(result.modelApi.imageRefs, [
    { refSlot: 'refImage', url: 'mapped:/data/assets/image.png' },
  ]);
  assert.deepEqual(result.modelApi.videos, ['mapped:https://cdn.example/video.mp4']);
  assert.equal(result.modelApi.videoEntries[0].duration, 5);
  assert.equal(result.modelApi.videoEntries[0].sizeBytes, 4096);
  assert.deepEqual(result.modelApi.videoRefs, [
    { refSlot: 'sourceVideo', url: 'mapped:https://cdn.example/video.mp4' },
  ]);
  assert.deepEqual(result.modelApi.audios, ['mapped:/data/assets/audio.mp3']);
  assert.equal(result.modelApi.audioEntries[0].duration, 3);
  assert.deepEqual(result.dreamina.videos, ['mapped:https://cdn.example/video.mp4']);
});

test('videoSubmitInputMaterials: selects the referenced AI video before the main index fallback', () => {
  const result = resolveVideoSubmitInputMaterials({
    inEdges: [{ id: 'edge-video', sourceId: 'ai-video-1', refSlot: 'referenceVideo' }],
    nodes: {
      'ai-video-1': {
        id: 'ai-video-1',
        type: 'ai-video',
        mainVideoIndex: 1,
        videos: [
          { localPath: 'data/assets/first.mp4', videoDuration: 2 },
          { localPath: 'data/assets/selected.mp4', videoDuration: 8, videoSizeBytes: 8192 },
        ],
      },
    },
    resolveMediaUrl: (url) => `mapped:${url}`,
  });

  assert.deepEqual(result.modelApi.videos, ['mapped:/data/assets/selected.mp4']);
  assert.equal(result.modelApi.videoEntries[0].duration, 8);
  assert.equal(result.modelApi.videoEntries[0].sizeBytes, 8192);
  assert.equal(result.assetVideoCount, 0);
});
