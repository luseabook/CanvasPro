import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractApimartPrivateAvatarAssetUrl,
  pollApimartPrivateAvatarTask,
  submitApimartSeedance2PrivateAvatar,
} from './apimartPrivateAvatarApi.js';
function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status: status,
    headers: { 'Content-Type': 'application/json' },
  });
}
async function withMockFetch(item, handler) {
  const key = globalThis.fetch;
  globalThis.fetch = item;
  try {
    return await handler();
  } finally {
    globalThis.fetch = key;
  }
}
(test('apimartPrivateAvatarApi: failed task still returns usable asset URL', () => {
  const extractApimartPrivateAvatarAssetUrl2 = extractApimartPrivateAvatarAssetUrl({
    data: {
      status: 'failed',
      result: {
        failed_assets: [{ asset_url: 'asset://failed', status: 'Failed' }],
        usable_assets: [{ asset_url: 'asset://usable', status: 'Active' }],
      },
    },
  });
  assert.equal(extractApimartPrivateAvatarAssetUrl2, 'asset://usable');
}),
  test('apimartPrivateAvatarApi: submit uploads source and polls usable asset', async () => {
    const list = [];
    (await withMockFetch(
      async (index, options = {}) => {
        const url = String(index);
        list.push({ url: url, options: options });
        if (url === 'https://source.example.com/avatar.png')
          return new Response(new Blob(['image'], { type: 'image/png' }));
        if (url === '/api/v2/proxy/apimart-upload') {
          const result = Object.fromEntries(options.body.entries());
          return (
            assert.equal(result.apiUrl, 'https://api.apimart.ai'),
            jsonResponse({ cdnUrl: 'https://cdn.apimart.ai/files/source.png' })
          );
        }
        if (url === '/api/v2/proxy/image') {
          const data = JSON.parse(options.body);
          return (
            assert.equal(data.apiUrl, 'https://api.apimart.ai/v1/seedance2/private-avatar'),
            assert.equal(data.apiKey, 'k_apimart'),
            assert.equal(data.asset_type, 'Image'),
            assert.deepEqual(data.assets, [
              { url: 'https://cdn.apimart.ai/files/source.png', name: 'avatar.png' },
            ]),
            assert.equal('url' in data, false),
            assert.equal('name' in data, false),
            assert.equal(data.group.name, 'aic-seedance2-private-avatar'),
            jsonResponse({ data: { id: 'task-avatar-1', status: 'submitted' } })
          );
        }
        if (
          decodeURIComponent(url) ===
          '/api/v2/proxy/task?apiUrl=https://api.apimart.ai/v1/tasks/task-avatar-1?language=zh'
        )
          return (
            assert.equal(options.headers.Authorization, 'Bearer k_apimart'),
            jsonResponse({
              data: {
                id: 'task-avatar-1',
                status: 'failed',
                result: { usable_assets: [{ asset_url: 'asset://seedance-avatar-ok' }] },
              },
            })
          );
        throw new Error('unexpected fetch url: ' + url);
      },
      async () => {
        const response = await submitApimartSeedance2PrivateAvatar({
          apiKey: 'k_apimart',
          apiUrl: 'https://api.apimart.ai/v1',
          url: 'https://source.example.com/avatar.png',
          name: 'avatar.png',
          assetType: 'Image',
          pollIntervalMs: 0,
          maxWaitMs: 0x3e8,
        });
        (assert.equal(response.status, 'passed'),
          assert.equal(response.taskId, 'task-avatar-1'),
          assert.equal(response.assetUrl, 'asset://seedance-avatar-ok'),
          assert.equal(response.sourceUrl, 'https://cdn.apimart.ai/files/source.png'));
      },
    ),
      assert.equal(list.length, 4));
  }),
  test('apimartPrivateAvatarApi: private avatar asset name is capped at APIMart limit', async () => {
    await withMockFetch(
      async (target, dom = {}) => {
        const source = String(target);
        if (source === '/api/v2/proxy/image') {
          const next = JSON.parse(dom.body);
          return (
            assert.equal(next.assets[0].name, 'x'.repeat(64)),
            assert.equal(next.assets[0].name.length, 64),
            jsonResponse({ data: { id: 'task-avatar-long-name', status: 'submitted' } })
          );
        }
        throw new Error('unexpected fetch url: ' + source);
      },
      async () => {
        const submitApimartSeedance2PrivateAvatar2 = await submitApimartSeedance2PrivateAvatar({
          apiKey: 'k_apimart',
          apiUrl: 'https://api.apimart.ai',
          url: 'https://cdn.apimart.ai/files/source.png',
          name: 'x'.repeat(90) + '.png',
          assetType: 'Image',
          poll: false,
        });
        assert.equal(submitApimartSeedance2PrivateAvatar2.taskId, 'task-avatar-long-name');
      },
    );
  }),
  test('apimartPrivateAvatarApi: missing apiUrl uses domestic APIMart route', async () => {
    await withMockFetch(
      async (current, dom2 = {}) => {
        const entry = String(current);
        if (entry === 'https://source.example.com/avatar.png')
          return new Response(new Blob(['image'], { type: 'image/png' }));
        if (entry === '/api/v2/proxy/apimart-upload') {
          const record = Object.fromEntries(dom2.body.entries());
          return (
            assert.equal(record.apiUrl, 'https://api.apib.ai'),
            jsonResponse({ cdnUrl: 'https://cdn.apib.ai/files/source.png' })
          );
        }
        if (entry === '/api/v2/proxy/image') {
          const payload = JSON.parse(dom2.body);
          return (
            assert.equal(payload.apiUrl, 'https://api.apib.ai/v1/seedance2/private-avatar'),
            jsonResponse({ data: { id: 'task-avatar-domestic', status: 'submitted' } })
          );
        }
        throw new Error('unexpected fetch url: ' + entry);
      },
      async () => {
        const submitApimartSeedance2PrivateAvatar3 = await submitApimartSeedance2PrivateAvatar({
          apiKey: 'k_apimart',
          url: 'https://source.example.com/avatar.png',
          name: 'avatar.png',
          assetType: 'Image',
          poll: false,
        });
        assert.equal(submitApimartSeedance2PrivateAvatar3.taskId, 'task-avatar-domestic');
      },
    );
  }),
  test('apimartPrivateAvatarApi: rejects existing asset URL before private avatar submit', async () => {
    await assert.rejects(
      () =>
        submitApimartSeedance2PrivateAvatar({
          apiKey: 'k_apimart',
          url: 'asset://seedance-avatar-ok',
          name: 'source.png',
          assetType: 'Image',
          poll: false,
        }),
      /无需再次人脸检测/,
    );
  }),
  test('apimartPrivateAvatarApi: rejects non-public uploaded URL before private avatar submit', async () => {
    await withMockFetch(
      async (handle) => {
        const state = String(handle);
        if (state === 'https://source.example.com/video.mp4')
          return new Response(new Blob(['video'], { type: 'video/mp4' }));
        if (state === '/api/v2/proxy/apimart-upload')
          return jsonResponse({ url: 'http://localhost:8777/uploaded/video.mp4' });
        if (state === '/api/v2/proxy/image') throw new Error('private avatar submit should not be called');
        throw new Error('unexpected fetch url: ' + state);
      },
      async () => {
        await assert.rejects(
          () =>
            submitApimartSeedance2PrivateAvatar({
              apiKey: 'k_apimart',
              url: 'https://source.example.com/video.mp4',
              name: 'source.mp4',
              assetType: 'Video',
              poll: false,
            }),
          /本地地址/,
        );
      },
    );
  }),
  test('apimartPrivateAvatarApi: failed task without usable asset rejects', async () => {
    await withMockFetch(
      async (config) => {
        if (
          decodeURIComponent(String(config)) ===
          '/api/v2/proxy/task?apiUrl=https://api.apib.ai/v1/tasks/task-bad?language=zh'
        )
          return jsonResponse({
            data: { id: 'task-bad', status: 'failed', message: 'face quality too low' },
          });
        throw new Error('unexpected fetch url: ' + String(config));
      },
      async () => {
        await assert.rejects(
          () =>
            pollApimartPrivateAvatarTask({
              apiKey: 'k_apimart',
              taskId: 'task-bad',
              pollIntervalMs: 0,
              maxWaitMs: 100,
            }),
          /face quality too low/,
        );
      },
    );
  }));
