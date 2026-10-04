import test from 'node:test';
import assert from 'node:assert/strict';
import { cropGridTilesToServer, saveOutputFromUrlToServer } from './projectsV2Api.js';
(test('projectsV2Api: cropGridTilesToServer posts normalized grid crop payload', async () => {
  const value = globalThis.fetch;
  let item = '',
    dom = null;
  try {
    globalThis.fetch = async (key, index) => {
      return (
        (item = String(key)),
        (dom = index),
        {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({ success: true, tiles: [{ localPath: 'output/tile.jpg' }] }),
          text: async () => JSON.stringify({ success: true }),
        }
      );
    };
    const server = await cropGridTilesToServer({
      localPath: '/output/source.png',
      cols: '2',
      rows: 2.2,
      ext: 'JPG',
      quality: '88',
      subDir: 'Multiple grids',
    });
    (assert.equal(item, '/api/v2/grid_tiles/crop'),
      assert.equal(dom.method, 'POST'),
      assert.equal(dom.headers['Content-Type'], 'application/json'),
      assert.deepEqual(JSON.parse(dom.body), {
        localPath: '/output/source.png',
        cols: 2,
        rows: 2,
        ext: 'jpg',
        quality: 88,
        subDir: 'Multiple grids',
      }),
      assert.deepEqual(server, { success: true, tiles: [{ localPath: 'output/tile.jpg' }] }));
  } finally {
    globalThis.fetch = value;
  }
}),
  test('projectsV2Api: saveOutputFromUrlToServer reuses same in-flight save', async () => {
    const result = globalThis.fetch;
    let data = 0,
      options = null;
    try {
      globalThis.fetch = async (target, dom2) => {
        return (
          assert.equal(String(target), '/api/v2/save_output_from_url'),
          (data += 1),
          (options = JSON.parse(String(dom2?.body || '{}'))),
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
      const url = 'https://cdn.example.com/deduped-url.png',
        [source, next] = await Promise.all([
          saveOutputFromUrlToServer({ url: url, ext: 'png' }),
          saveOutputFromUrlToServer({ url: url, ext: 'png' }),
        ]);
      (assert.equal(data, 1),
        assert.equal(options.dedupeKey, url),
        assert.equal(source.path, 'output/deduped-url.png'),
        assert.equal(next.path, 'output/deduped-url.png'));
    } finally {
      globalThis.fetch = result;
    }
  }));
