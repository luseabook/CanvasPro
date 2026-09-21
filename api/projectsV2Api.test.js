import test from 'node:test';
import assert from 'node:assert/strict';
import { cropGridTilesToServer, saveOutputFromUrlToServer } from './projectsV2Api.js';
(test('projectsV2Api: cropGridTilesToServer posts normalized grid crop payload', async () => {
  const _0x3bff0a = globalThis.fetch;
  let _0x3c9d2e = '',
    _0x617622 = null;
  try {
    globalThis.fetch = async (_0x44b4bf, _0x2d1966) => {
      return (
        (_0x3c9d2e = String(_0x44b4bf)),
        (_0x617622 = _0x2d1966),
        {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({ success: true, tiles: [{ localPath: 'output/tile.jpg' }] }),
          text: async () => JSON.stringify({ success: true }),
        }
      );
    };
    const _0x5578c7 = await cropGridTilesToServer({
      localPath: '/output/source.png',
      cols: '2',
      rows: 2.2,
      ext: 'JPG',
      quality: '88',
      subDir: 'Multiple grids',
    });
    (assert.equal(_0x3c9d2e, '/api/v2/grid_tiles/crop'),
      assert.equal(_0x617622.method, 'POST'),
      assert.equal(_0x617622.headers['Content-Type'], 'application/json'),
      assert.deepEqual(JSON.parse(_0x617622.body), {
        localPath: '/output/source.png',
        cols: 2,
        rows: 2,
        ext: 'jpg',
        quality: 88,
        subDir: 'Multiple grids',
      }),
      assert.deepEqual(_0x5578c7, { success: true, tiles: [{ localPath: 'output/tile.jpg' }] }));
  } finally {
    globalThis.fetch = _0x3bff0a;
  }
}),
  test('projectsV2Api: saveOutputFromUrlToServer reuses same in-flight save', async () => {
    const _0xbf215e = globalThis.fetch;
    let _0x3a9591 = 0,
      _0x2b817c = null;
    try {
      globalThis.fetch = async (_0x11e176, _0x546084) => {
        return (
          assert.equal(String(_0x11e176), '/api/v2/save_output_from_url'),
          (_0x3a9591 += 1),
          (_0x2b817c = JSON.parse(String(_0x546084?.body || '{}'))),
          await Promise.resolve(),
          {
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: async () => ({
              success: true,
              path: 'output/deduped-url.png',
              localPath: 'output/deduped-url.png',
              url: '/output/deduped-url.png',
            }),
            text: async () => JSON.stringify({ success: true }),
          }
        );
      };
      const _0x123232 = 'https://cdn.example.com/deduped-url.png',
        [_0x54e4f3, _0x10133a] = await Promise.all([
          saveOutputFromUrlToServer({ url: _0x123232, ext: 'png' }),
          saveOutputFromUrlToServer({ url: _0x123232, ext: 'png' }),
        ]);
      (assert.equal(_0x3a9591, 1),
        assert.equal(_0x2b817c.dedupeKey, _0x123232),
        assert.equal(_0x54e4f3.path, 'output/deduped-url.png'),
        assert.equal(_0x10133a.path, 'output/deduped-url.png'));
    } finally {
      globalThis.fetch = _0xbf215e;
    }
  }));
