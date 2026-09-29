import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_COMFYUI_BASE_URL,
  buildComfyUiViewUrl,
  buildImageRequest,
  collectComfyUiOutputFiles,
  normalizeComfyUiBaseUrl,
  normalizeComfyUiHistoryResult,
  shouldAllowCloudComfyUiBaseUrl,
} from './ComfyUiAdapter.js';

test('ComfyUiAdapter: normalizes local and cloud base URLs', () => {
  assert.equal(normalizeComfyUiBaseUrl(''), DEFAULT_COMFYUI_BASE_URL);
  assert.equal(normalizeComfyUiBaseUrl('localhost:8188/path/?x=1#hash'), 'http://localhost:8188/path');
  assert.equal(normalizeComfyUiBaseUrl('https://cloud.test/base/?x=1#hash'), 'https://cloud.test/base');
});

test('ComfyUiAdapter: allows only public cloud endpoints', () => {
  assert.equal(shouldAllowCloudComfyUiBaseUrl('https://comfy.example.com'), true);
  assert.equal(shouldAllowCloudComfyUiBaseUrl('http://8.8.8.8:8188'), true);
  assert.equal(shouldAllowCloudComfyUiBaseUrl('http://localhost:8188'), false);
  assert.equal(shouldAllowCloudComfyUiBaseUrl('http://10.0.0.1:8188'), false);
  assert.equal(shouldAllowCloudComfyUiBaseUrl('http://172.16.0.2:8188'), false);
  assert.equal(shouldAllowCloudComfyUiBaseUrl('http://192.168.1.2:8188'), false);
  assert.equal(shouldAllowCloudComfyUiBaseUrl('http://[::1]:8188'), false);
  assert.equal(shouldAllowCloudComfyUiBaseUrl('http://[fd00::1]:8188'), false);
});

test('ComfyUiAdapter: builds encoded view URLs and marks approved cloud bases', () => {
  assert.equal(
    buildComfyUiViewUrl(
      'http://127.0.0.1:8188/',
      { filename: 'a b.png', subfolder: 'x/y', type: 'output' },
      { allowCloudBaseUrl: false },
    ),
    '/api/v2/comfyui/view?baseUrl=http%3A%2F%2F127.0.0.1%3A8188&filename=a+b.png&type=output&subfolder=x%2Fy',
  );
  const cloud = buildComfyUiViewUrl('https://cloud.test', { filename: 'a.png' }, { allowCloudBaseUrl: true });
  assert.match(cloud, /allowCloudBaseUrl=1/);
  assert.match(cloud, /type=output/);
});

test('ComfyUiAdapter: collects only requested output nodes and infers media types', () => {
  const files = collectComfyUiOutputFiles(
    {
      promptId: {
        outputs: {
          1: {
            images: [{ filename: 'a.png' }],
            gifs: [{ filename: 'b.gif', subfolder: 'animations' }],
            audio: [{ filename: 'c.mp3', type: 'temp' }],
          },
          2: {
            images: [{ filename: 'ignored.png' }],
          },
        },
      },
    },
    { outputNodes: ['1'] },
  );

  assert.deepEqual(files, [
    {
      nodeId: '1',
      filename: 'a.png',
      subfolder: '',
      type: 'output',
      mediaType: 'image',
      format: '',
    },
    {
      nodeId: '1',
      filename: 'b.gif',
      subfolder: 'animations',
      type: 'output',
      mediaType: 'video',
      format: '',
    },
    {
      nodeId: '1',
      filename: 'c.mp3',
      subfolder: '',
      type: 'temp',
      mediaType: 'audio',
      format: '',
    },
  ]);
});

test('ComfyUiAdapter: normalizes completed and failed history results', () => {
  const completed = normalizeComfyUiHistoryResult(
    {
      outputs: {
        1: {
          images: [{ filename: 'a.png' }],
          gifs: [{ filename: 'b.gif' }],
          audio: [{ filename: 'c.mp3' }],
        },
      },
    },
    { baseUrl: 'http://127.0.0.1:8188', allowCloudBaseUrl: false },
  );

  assert.equal(completed.status, 'COMPLETED');
  assert.equal(completed.images.length, 1);
  assert.equal(completed.videos.length, 1);
  assert.equal(completed.audios.length, 1);
  assert.deepEqual(completed.image_urls, [completed.images[0].url]);
  assert.deepEqual(completed.video_urls, [completed.videos[0].url]);
  assert.deepEqual(completed.audio_urls, [completed.audios[0].url]);
  assert.equal(completed.results[0].imageUrl, completed.images[0].url);
  assert.equal(completed.results[1].videoUrl, completed.videos[0].url);
  assert.equal(completed.results[2].audioUrl, completed.audios[0].url);

  const failed = normalizeComfyUiHistoryResult({
    promptId: { status: 'error', error: { message: 'node exploded' } },
  });
  assert.equal(failed.status, 'FAILED');
  assert.equal(failed.message, 'node exploded');
  assert.deepEqual(failed.images, []);

  assert.deepEqual(normalizeComfyUiHistoryResult({ outputs: {} }), {
    status: 'RUNNING',
    images: [],
    videos: [],
    audios: [],
    results: [],
  });
});

test('ComfyUiAdapter: rejects missing workflow manifests', async () => {
  await assert.rejects(
    () => buildImageRequest({ model: 'missing-comfy-model' }, 'draw'),
    /ComfyUI workflow manifest missing/,
  );
});
