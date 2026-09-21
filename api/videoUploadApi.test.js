import test from 'node:test';
import assert from 'node:assert/strict';
import { processInputVideos, processInputVideosPreserveOrder } from './videoUploadApi.js';
function makeJsonResponse(_0x2e396c, _0x3b6745 = 200) {
  return new Response(JSON.stringify(_0x2e396c), {
    status: _0x3b6745,
    headers: { 'Content-Type': 'application/json' },
  });
}
async function readUploadMarker(_0x459af2) {
  if (!_0x459af2 || typeof _0x459af2.entries !== 'function') return '';
  for (const [_0x3bd6fb, _0x2e76d3] of _0x459af2.entries()) {
    if (_0x3bd6fb === 'file' && _0x2e76d3 && typeof _0x2e76d3.text === 'function')
      return await _0x2e76d3.text();
  }
  return '';
}
async function withMockFetch(_0x13cb03, _0x433f58) {
  const _0x493227 = globalThis.fetch;
  globalThis.fetch = _0x13cb03;
  try {
    return await _0x433f58();
  } finally {
    globalThis.fetch = _0x493227;
  }
}
(test('videoUploadApi: processInputVideos 默认按输入顺序返回成功项', async () => {
  await withMockFetch(
    async (_0x2f6d11, _0x4a0931 = {}) => {
      const _0x47a060 = String(_0x2f6d11);
      if (_0x47a060.startsWith('https://video.example/')) {
        const _0xb91fc9 = _0x47a060.split('/').pop()?.replace('.mp4', '') || '';
        return new Response(new Blob([_0xb91fc9]), { status: 200 });
      }
      if (_0x47a060.startsWith('/api/v2/proxy/upload?')) {
        assert.equal(_0x4a0931.headers?.Authorization, 'Bearer k');
        const _0xa3a21 = await readUploadMarker(_0x4a0931.body);
        return makeJsonResponse({
          code: 0,
          data: { download_url: 'https://www.runninghub.cn/' + _0xa3a21 + '.mp4' },
        });
      }
      throw new Error('unexpected fetch url: ' + _0x47a060);
    },
    async () => {
      const _0x27daf9 = await processInputVideos(
        ['https://video.example/a.mp4', '', 'https://video.example/b.mp4'],
        'k',
      );
      assert.deepEqual(_0x27daf9, ['https://www.runninghub.cn/a.mp4', 'https://www.runninghub.cn/b.mp4']);
    },
  );
}),
  test('videoUploadApi: processInputVideosPreserveOrder 保留失败和空白槽位', async () => {
    await withMockFetch(
      async (_0x42b66e, _0x5009f6 = {}) => {
        const _0x164b98 = String(_0x42b66e);
        if (_0x164b98.startsWith('https://video.example/')) {
          const _0x4c8dc1 = _0x164b98.split('/').pop()?.replace('.mp4', '') || '';
          return new Response(new Blob([_0x4c8dc1]), { status: 200 });
        }
        if (_0x164b98.startsWith('/api/v2/proxy/upload?')) {
          assert.equal(_0x5009f6.headers?.Authorization, 'Bearer k');
          const _0x452053 = await readUploadMarker(_0x5009f6.body);
          if (_0x452053 === 'b') return makeJsonResponse({ code: 0x1f4, message: 'upload failed' });
          return makeJsonResponse({
            code: 0,
            data: { download_url: 'https://www.runninghub.cn/' + _0x452053 + '.mp4' },
          });
        }
        throw new Error('unexpected fetch url: ' + _0x164b98);
      },
      async () => {
        const _0x852969 = await processInputVideosPreserveOrder(
          ['https://video.example/a.mp4', '', 'https://video.example/b.mp4', 'https://video.example/c.mp4'],
          'k',
        );
        assert.deepEqual(_0x852969, [
          'https://www.runninghub.cn/a.mp4',
          '',
          '',
          'https://www.runninghub.cn/c.mp4',
        ]);
      },
    );
  }),
  test('videoUploadApi: APIMART 上传携带 API Key 并返回 CDN URL', async () => {
    const _0x25457d = [];
    await withMockFetch(
      async (_0x2eede1, _0x97ec36 = {}) => {
        const _0xac5200 = String(_0x2eede1);
        if (_0xac5200 === 'https://video.example/source.mp4')
          return new Response(new Blob(['source'], { type: 'video/mp4' }), { status: 200 });
        if (_0xac5200 === '/api/v2/proxy/apimart-upload') {
          assert.equal(_0x97ec36.method, 'POST');
          const _0x23c076 = Object.fromEntries(_0x97ec36.body.entries());
          return (
            assert.equal(_0x23c076.contentType, 'video/mp4'),
            assert.equal(_0x23c076.fileExtension, 'mp4'),
            assert.equal(_0x23c076.apiKey, 'k_apimart'),
            assert.equal(_0x23c076.apiUrl, 'https://api.apib.ai'),
            _0x25457d.push(await _0x23c076.file.text()),
            makeJsonResponse({ cdnUrl: 'https://cdn.apimart.ai/files/source.mp4' })
          );
        }
        throw new Error('unexpected fetch url: ' + _0xac5200);
      },
      async () => {
        const _0x42d750 = await processInputVideos(['https://video.example/source.mp4'], 'k_apimart', {
          provider: 'apimart',
        });
        (assert.deepEqual(_0x42d750, ['https://cdn.apimart.ai/files/source.mp4']),
          assert.deepEqual(_0x25457d, ['source']));
      },
    );
  }),
  test('videoUploadApi: APIMART CDN 视频不会重复上传', async () => {
    await withMockFetch(
      async (_0x21066d) => {
        throw new Error('unexpected fetch url: ' + String(_0x21066d));
      },
      async () => {
        const _0x1e5d61 = await processInputVideos(
          ['https://cdn.apimart.ai/files/existing.mp4'],
          'k_apimart',
          { provider: 'apimart' },
        );
        assert.deepEqual(_0x1e5d61, ['https://cdn.apimart.ai/files/existing.mp4']);
      },
    );
  }),
  test('videoUploadApi: APIMART asset URL 不会重复上传', async () => {
    await withMockFetch(
      async (_0x370707) => {
        throw new Error('unexpected fetch url: ' + String(_0x370707));
      },
      async () => {
        const _0x1993aa = await processInputVideos(['asset://seedance/avatar-video'], 'k_apimart', {
          provider: 'apimart',
        });
        assert.deepEqual(_0x1993aa, ['asset://seedance/avatar-video']);
      },
    );
  }));
