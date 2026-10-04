import test from 'node:test';
import assert from 'node:assert/strict';
import { processInputVideos, processInputVideosPreserveOrder } from './videoUploadApi.js';
function makeJsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status: status,
    headers: { 'Content-Type': 'application/json' },
  });
}
async function readUploadMarker(map) {
  if (!map || typeof map.entries !== 'function') return '';
  for (const [item, response] of map.entries()) {
    if (item === 'file' && response && typeof response.text === 'function') return await response.text();
  }
  return '';
}
async function withMockFetch(key, handler) {
  const index = globalThis.fetch;
  globalThis.fetch = key;
  try {
    return await handler();
  } finally {
    globalThis.fetch = index;
  }
}
(test('videoUploadApi: processInputVideos 默认按输入顺序返回成功项', async () => {
  await withMockFetch(
    async (result, dom = {}) => {
      const data = String(result);
      if (data.startsWith('https://video.example/')) {
        const options = data.split('/').pop()?.replace('.mp4', '') || '';
        return new Response(new Blob([options]), { status: 200 });
      }
      if (data.startsWith('/api/v2/proxy/upload?')) {
        assert.equal(dom.headers?.Authorization, 'Bearer k');
        const uploadMarker = await readUploadMarker(dom.body);
        return makeJsonResponse({
          code: 0,
          data: { download_url: 'https://www.runninghub.cn/' + uploadMarker + '.mp4' },
        });
      }
      throw new Error('unexpected fetch url: ' + data);
    },
    async () => {
      const processInputVideos2 = await processInputVideos(
        ['https://video.example/a.mp4', '', 'https://video.example/b.mp4'],
        'k',
      );
      assert.deepEqual(processInputVideos2, [
        'https://www.runninghub.cn/a.mp4',
        'https://www.runninghub.cn/b.mp4',
      ]);
    },
  );
}),
  test('videoUploadApi: processInputVideosPreserveOrder 保留失败和空白槽位', async () => {
    await withMockFetch(
      async (target, dom2 = {}) => {
        const source = String(target);
        if (source.startsWith('https://video.example/')) {
          const next = source.split('/').pop()?.replace('.mp4', '') || '';
          return new Response(new Blob([next]), { status: 200 });
        }
        if (source.startsWith('/api/v2/proxy/upload?')) {
          assert.equal(dom2.headers?.Authorization, 'Bearer k');
          const uploadMarker2 = await readUploadMarker(dom2.body);
          if (uploadMarker2 === 'b') return makeJsonResponse({ code: 0x1f4, message: 'upload failed' });
          return makeJsonResponse({
            code: 0,
            data: { download_url: 'https://www.runninghub.cn/' + uploadMarker2 + '.mp4' },
          });
        }
        throw new Error('unexpected fetch url: ' + source);
      },
      async () => {
        const processInputVideosPreserveOrder2 = await processInputVideosPreserveOrder(
          ['https://video.example/a.mp4', '', 'https://video.example/b.mp4', 'https://video.example/c.mp4'],
          'k',
        );
        assert.deepEqual(processInputVideosPreserveOrder2, [
          'https://www.runninghub.cn/a.mp4',
          '',
          '',
          'https://www.runninghub.cn/c.mp4',
        ]);
      },
    );
  }),
  test('videoUploadApi: APIMART 上传携带 API Key 并返回 CDN URL', async () => {
    const list = [];
    await withMockFetch(
      async (current, dom3 = {}) => {
        const entry = String(current);
        if (entry === 'https://video.example/source.mp4')
          return new Response(new Blob(['source'], { type: 'video/mp4' }), { status: 200 });
        if (entry === '/api/v2/proxy/apimart-upload') {
          assert.equal(dom3.method, 'POST');
          const record = Object.fromEntries(dom3.body.entries());
          return (
            assert.equal(record.contentType, 'video/mp4'),
            assert.equal(record.fileExtension, 'mp4'),
            assert.equal(record.apiKey, 'k_apimart'),
            assert.equal(record.apiUrl, 'https://api.apib.ai'),
            list.push(await record.file.text()),
            makeJsonResponse({ cdnUrl: 'https://cdn.apimart.ai/files/source.mp4' })
          );
        }
        throw new Error('unexpected fetch url: ' + entry);
      },
      async () => {
        const processInputVideos3 = await processInputVideos(
          ['https://video.example/source.mp4'],
          'k_apimart',
          {
            provider: 'apimart',
          },
        );
        (assert.deepEqual(processInputVideos3, ['https://cdn.apimart.ai/files/source.mp4']),
          assert.deepEqual(list, ['source']));
      },
    );
  }),
  test('videoUploadApi: APIMART CDN 视频不会重复上传', async () => {
    await withMockFetch(
      async (payload) => {
        throw new Error('unexpected fetch url: ' + String(payload));
      },
      async () => {
        const processInputVideos4 = await processInputVideos(
          ['https://cdn.apimart.ai/files/existing.mp4'],
          'k_apimart',
          { provider: 'apimart' },
        );
        assert.deepEqual(processInputVideos4, ['https://cdn.apimart.ai/files/existing.mp4']);
      },
    );
  }),
  test('videoUploadApi: APIMART asset URL 不会重复上传', async () => {
    await withMockFetch(
      async (handle) => {
        throw new Error('unexpected fetch url: ' + String(handle));
      },
      async () => {
        const processInputVideos5 = await processInputVideos(['asset://seedance/avatar-video'], 'k_apimart', {
          provider: 'apimart',
        });
        assert.deepEqual(processInputVideos5, ['asset://seedance/avatar-video']);
      },
    );
  }));
