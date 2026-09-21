import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractApimartPrivateAvatarAssetUrl,
  pollApimartPrivateAvatarTask,
  submitApimartSeedance2PrivateAvatar,
} from './apimartPrivateAvatarApi.js';
function jsonResponse(_0x3efb85, _0x550540 = 200) {
  return new Response(JSON.stringify(_0x3efb85), {
    status: _0x550540,
    headers: { 'Content-Type': 'application/json' },
  });
}
async function withMockFetch(_0x396329, _0x430515) {
  const _0xf8df02 = globalThis.fetch;
  globalThis.fetch = _0x396329;
  try {
    return await _0x430515();
  } finally {
    globalThis.fetch = _0xf8df02;
  }
}
(test('apimartPrivateAvatarApi: failed task still returns usable asset URL', () => {
  const _0x6efcd9 = extractApimartPrivateAvatarAssetUrl({
    data: {
      status: 'failed',
      result: {
        failed_assets: [{ asset_url: 'asset://failed', status: 'Failed' }],
        usable_assets: [{ asset_url: 'asset://usable', status: 'Active' }],
      },
    },
  });
  assert.equal(_0x6efcd9, 'asset://usable');
}),
  test('apimartPrivateAvatarApi: submit uploads source and polls usable asset', async () => {
    const _0xa5f242 = [];
    (await withMockFetch(
      async (_0x30f7d5, _0x575a16 = {}) => {
        const _0x3eea66 = String(_0x30f7d5);
        _0xa5f242.push({ url: _0x3eea66, options: _0x575a16 });
        if (_0x3eea66 === 'https://source.example.com/avatar.png')
          return new Response(new Blob(['image'], { type: 'image/png' }));
        if (_0x3eea66 === '/api/v2/proxy/apimart-upload') {
          const _0x59f574 = Object.fromEntries(_0x575a16.body.entries());
          return (
            assert.equal(_0x59f574.apiUrl, 'https://api.apimart.ai'),
            jsonResponse({ cdnUrl: 'https://cdn.apimart.ai/files/source.png' })
          );
        }
        if (_0x3eea66 === '/api/v2/proxy/image') {
          const _0x27e237 = JSON.parse(_0x575a16.body);
          return (
            assert.equal(_0x27e237.apiUrl, 'https://api.apimart.ai/v1/seedance2/private-avatar'),
            assert.equal(_0x27e237.apiKey, 'k_apimart'),
            assert.equal(_0x27e237.asset_type, 'Image'),
            assert.deepEqual(_0x27e237.assets, [
              { url: 'https://cdn.apimart.ai/files/source.png', name: 'avatar.png' },
            ]),
            assert.equal('url' in _0x27e237, false),
            assert.equal('name' in _0x27e237, false),
            assert.equal(_0x27e237.group.name, 'aic-seedance2-private-avatar'),
            jsonResponse({ data: { id: 'task-avatar-1', status: 'submitted' } })
          );
        }
        if (
          decodeURIComponent(_0x3eea66) ===
          '/api/v2/proxy/task?apiUrl=https://api.apimart.ai/v1/tasks/task-avatar-1?language=zh'
        )
          return (
            assert.equal(_0x575a16.headers.Authorization, 'Bearer k_apimart'),
            jsonResponse({
              data: {
                id: 'task-avatar-1',
                status: 'failed',
                result: { usable_assets: [{ asset_url: 'asset://seedance-avatar-ok' }] },
              },
            })
          );
        throw new Error('unexpected fetch url: ' + _0x3eea66);
      },
      async () => {
        const _0xc1484e = await submitApimartSeedance2PrivateAvatar({
          apiKey: 'k_apimart',
          apiUrl: 'https://api.apimart.ai/v1',
          url: 'https://source.example.com/avatar.png',
          name: 'avatar.png',
          assetType: 'Image',
          pollIntervalMs: 0,
          maxWaitMs: 0x3e8,
        });
        (assert.equal(_0xc1484e.status, 'passed'),
          assert.equal(_0xc1484e.taskId, 'task-avatar-1'),
          assert.equal(_0xc1484e.assetUrl, 'asset://seedance-avatar-ok'),
          assert.equal(_0xc1484e.sourceUrl, 'https://cdn.apimart.ai/files/source.png'));
      },
    ),
      assert.equal(_0xa5f242.length, 4));
  }),
  test('apimartPrivateAvatarApi: private avatar asset name is capped at APIMart limit', async () => {
    await withMockFetch(
      async (_0x676bd1, _0x4974ba = {}) => {
        const _0x15af95 = String(_0x676bd1);
        if (_0x15af95 === '/api/v2/proxy/image') {
          const _0x238251 = JSON.parse(_0x4974ba.body);
          return (
            assert.equal(_0x238251.assets[0].name, 'x'.repeat(64)),
            assert.equal(_0x238251.assets[0].name.length, 64),
            jsonResponse({ data: { id: 'task-avatar-long-name', status: 'submitted' } })
          );
        }
        throw new Error('unexpected fetch url: ' + _0x15af95);
      },
      async () => {
        const _0x26114c = await submitApimartSeedance2PrivateAvatar({
          apiKey: 'k_apimart',
          apiUrl: 'https://api.apimart.ai',
          url: 'https://cdn.apimart.ai/files/source.png',
          name: 'x'.repeat(90) + '.png',
          assetType: 'Image',
          poll: false,
        });
        assert.equal(_0x26114c.taskId, 'task-avatar-long-name');
      },
    );
  }),
  test('apimartPrivateAvatarApi: missing apiUrl uses domestic APIMart route', async () => {
    await withMockFetch(
      async (_0x5ede51, _0x59b8d4 = {}) => {
        const _0x1a7aac = String(_0x5ede51);
        if (_0x1a7aac === 'https://source.example.com/avatar.png')
          return new Response(new Blob(['image'], { type: 'image/png' }));
        if (_0x1a7aac === '/api/v2/proxy/apimart-upload') {
          const _0x3ce289 = Object.fromEntries(_0x59b8d4.body.entries());
          return (
            assert.equal(_0x3ce289.apiUrl, 'https://api.apib.ai'),
            jsonResponse({ cdnUrl: 'https://cdn.apib.ai/files/source.png' })
          );
        }
        if (_0x1a7aac === '/api/v2/proxy/image') {
          const _0x2bc6ae = JSON.parse(_0x59b8d4.body);
          return (
            assert.equal(_0x2bc6ae.apiUrl, 'https://api.apib.ai/v1/seedance2/private-avatar'),
            jsonResponse({ data: { id: 'task-avatar-domestic', status: 'submitted' } })
          );
        }
        throw new Error('unexpected fetch url: ' + _0x1a7aac);
      },
      async () => {
        const _0x5b6d95 = await submitApimartSeedance2PrivateAvatar({
          apiKey: 'k_apimart',
          url: 'https://source.example.com/avatar.png',
          name: 'avatar.png',
          assetType: 'Image',
          poll: false,
        });
        assert.equal(_0x5b6d95.taskId, 'task-avatar-domestic');
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
      async (_0x3551db) => {
        const _0x185baa = String(_0x3551db);
        if (_0x185baa === 'https://source.example.com/video.mp4')
          return new Response(new Blob(['video'], { type: 'video/mp4' }));
        if (_0x185baa === '/api/v2/proxy/apimart-upload')
          return jsonResponse({ url: 'http://localhost:8777/uploaded/video.mp4' });
        if (_0x185baa === '/api/v2/proxy/image')
          throw new Error('private avatar submit should not be called');
        throw new Error('unexpected fetch url: ' + _0x185baa);
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
      async (_0x1e18c1) => {
        if (
          decodeURIComponent(String(_0x1e18c1)) ===
          '/api/v2/proxy/task?apiUrl=https://api.apib.ai/v1/tasks/task-bad?language=zh'
        )
          return jsonResponse({
            data: { id: 'task-bad', status: 'failed', message: 'face quality too low' },
          });
        throw new Error('unexpected fetch url: ' + String(_0x1e18c1));
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
