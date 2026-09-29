import test from 'node:test';
import assert from 'node:assert/strict';

import { saveModelApiVideoContent } from './modelApiVideoContent.js';

test('modelApiVideoContent: downloads video content and persists it locally', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    if (calls.length === 1)
      return new Response(new Blob(['video'], { type: 'video/mp4' }), {
        status: 200,
        headers: { 'content-type': 'video/mp4' },
      });
    return new Response(JSON.stringify({ path: 'output/model/video.mp4' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    const result = await saveModelApiVideoContent('https://provider.test/tasks/task-1/', 'secret', {
      providerId: 'custom-provider',
    });
    assert.deepEqual(result, {
      videoUrl: '/output/model/video.mp4',
      localPath: 'output/model/video.mp4',
    });
    assert.equal(
      calls[0].url,
      '/api/v2/proxy/task?apiUrl=' + encodeURIComponent('https://provider.test/tasks/task-1/content'),
    );
    assert.equal(calls[0].options.headers.Authorization, 'Bearer secret');
    assert.match(calls[1].url, /^\/api\/v2\/save_output\?ext=mp4&kind=video$/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('modelApiVideoContent: rejects non-video download responses', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(new Blob(['not-video'], { type: 'text/plain' }), {
      status: 200,
      headers: { 'content-type': 'text/plain' },
    });

  try {
    await assert.rejects(
      () => saveModelApiVideoContent('https://provider.test/tasks/task-1', 'secret'),
      /视频下载未返回有效的视频文件/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
