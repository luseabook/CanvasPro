import test from 'node:test';
import assert from 'node:assert/strict';
import { processInputImages, processInputImagesPreserveOrder, uploadToRunningHub } from './imageUploadApi.js';
import { pickFreeImageHostUrl, uploadToFreeImageHost, 免费图床 } from './freeImageHostApi.js';
const sleep = (_0x235ce0) => new Promise((_0x297564) => setTimeout(_0x297564, _0x235ce0));
function createResponse(_0x31263e, _0x226891 = {}) {
  return new Response(_0x31263e, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ..._0x226891,
  });
}
async function readUploadMarker(_0x19ff8f) {
  if (!_0x19ff8f || typeof _0x19ff8f.entries !== 'function') return '';
  for (const [_0x3660b4, _0x5c04d2] of _0x19ff8f.entries()) {
    if (_0x3660b4 !== 'file' && _0x3660b4 !== 'files[]') continue;
    if (_0x5c04d2 && typeof _0x5c04d2.text === 'function') return await _0x5c04d2.text();
  }
  return '';
}
async function withMockFetch(_0xa2d5b, _0x431250) {
  const _0x41dce8 = globalThis.fetch;
  globalThis.fetch = _0xa2d5b;
  try {
    return await _0x431250();
  } finally {
    globalThis.fetch = _0x41dce8;
  }
}
function isProxyUploadTo(_0x248c08, _0xa1e4f) {
  const _0x10458c = String(_0x248c08 || '');
  if (!_0x10458c.startsWith('/api/v2/proxy/upload?')) return false;
  const _0x48aa9c = _0x10458c.slice(_0x10458c.indexOf('?') + 1);
  return new URLSearchParams(_0x48aa9c).get('apiUrl') === _0xa1e4f;
}
function isUguuProxyUpload(_0x29a5d7) {
  return isProxyUploadTo(_0x29a5d7, 'https://uguu.se/upload');
}
function isTelegraphProxyUpload(_0x454a2a) {
  return isProxyUploadTo(_0x454a2a, 'https://telegra.ph/upload');
}
(test('imageUploadApi: processInputImages 空入参返回空数组', async () => {
  (assert.deepEqual(await processInputImages(null, 'k'), []),
    assert.deepEqual(await processInputImages([], 'k'), []));
}),
  test('imageUploadApi: processInputImagesPreserveOrder 空/空白会保序输出空串', async () => {
    const _0x351ffa = await processInputImagesPreserveOrder(['', '   '], 'k');
    (assert.equal(_0x351ffa.length, 2), assert.equal(_0x351ffa[0], ''), assert.equal(_0x351ffa[1], ''));
  }),
  test('imageUploadApi: processInputImages 并发上传完成顺序不同也保持输入顺序', async () => {
    const _0x267e02 = { a: 20, b: 30, c: 5 };
    await withMockFetch(
      async (_0x29daf2, _0x592efd = {}) => {
        const _0x3e38fe = String(_0x29daf2 || '');
        if (_0x3e38fe.startsWith('https://input.example/')) {
          const _0x1b3d22 = _0x3e38fe.split('/').pop();
          return new Response(new Blob([_0x1b3d22]), { status: 200 });
        }
        if (isTelegraphProxyUpload(_0x3e38fe)) {
          const _0x50a78b = await readUploadMarker(_0x592efd.body);
          return (
            await sleep(_0x267e02[_0x50a78b] || 0),
            createResponse(JSON.stringify([{ src: '/' + _0x50a78b + '.png' }]))
          );
        }
        throw new Error('unexpected fetch: ' + _0x3e38fe);
      },
      async () => {
        const _0x4ef46c = await processInputImages(
          ['https://input.example/a', 'https://input.example/b', 'https://input.example/c'],
          '',
          { compress: false },
        );
        assert.deepEqual(_0x4ef46c, [
          'https://telegra.ph/a.png',
          'https://telegra.ph/b.png',
          'https://telegra.ph/c.png',
        ]);
      },
    );
  }),
  test('imageUploadApi: 免费图床方法使用 Uguu 代理上传并返回 URL', async () => {
    (assert.equal(免费图床, uploadToFreeImageHost),
      assert.equal(
        pickFreeImageHostUrl({ files: [{ url: 'https://uguu.se/free-ref.png' }] }),
        'https://uguu.se/free-ref.png',
      ),
      await withMockFetch(
        async (_0x101662, _0x92350 = {}) => {
          const _0x17d67d = String(_0x101662 || '');
          if (isUguuProxyUpload(_0x17d67d)) {
            (assert.equal(_0x92350.method, 'POST'), assert.equal(_0x92350.headers?.Authorization, undefined));
            const _0x407d6a = Object.fromEntries(_0x92350.body.entries());
            return (
              assert.ok(_0x407d6a['files[]']),
              assert.equal(await _0x407d6a['files[]'].text(), 'free-image'),
              createResponse(
                JSON.stringify({
                  success: true,
                  files: [{ url: 'https://uguu.se/uploaded/free-image.png' }],
                }),
              )
            );
          }
          throw new Error('unexpected fetch: ' + _0x17d67d);
        },
        async () => {
          const _0xd86f8e = await uploadToFreeImageHost(new Blob(['free-image'], { type: 'image/png' }));
          assert.equal(_0xd86f8e, 'https://uguu.se/uploaded/free-image.png');
        },
      ));
  }),
  test('imageUploadApi: processInputImages 可复用免费图床 provider', async () => {
    await withMockFetch(
      async (_0x9cb3ed, _0x18815b = {}) => {
        const _0x58da65 = String(_0x9cb3ed || '');
        if (_0x58da65 === 'https://input.example/free.png')
          return new Response(new Blob(['free-ref'], { type: 'image/png' }), { status: 200 });
        if (isUguuProxyUpload(_0x58da65)) {
          const _0x5ef709 = await readUploadMarker(_0x18815b.body);
          return createResponse(
            JSON.stringify({
              success: true,
              files: [{ url: 'https://uguu.se/uploaded/' + _0x5ef709 + '.png' }],
            }),
          );
        }
        throw new Error('unexpected fetch: ' + _0x58da65);
      },
      async () => {
        const _0x4cd7e1 = await processInputImages(['https://input.example/free.png'], '', {
          compress: false,
          provider: 'freeImageHost',
        });
        assert.deepEqual(_0x4cd7e1, ['https://uguu.se/uploaded/free-ref.png']);
      },
    );
  }),
  test('imageUploadApi: preferFree 免费图床网络失败时会自动回退 Telegraph', async () => {
    const _0x47f7ff = [];
    await withMockFetch(
      async (_0x150a06, _0xf25070 = {}) => {
        const _0x522320 = String(_0x150a06 || '');
        _0x47f7ff.push(_0x522320);
        if (_0x522320 === 'https://input.example/free-fallback.png')
          return new Response(new Blob(['fallback-ref'], { type: 'image/png' }), { status: 200 });
        if (isUguuProxyUpload(_0x522320)) throw new Error('network down');
        if (isTelegraphProxyUpload(_0x522320)) {
          const _0x4d4888 = await readUploadMarker(_0xf25070.body);
          return createResponse(JSON.stringify([{ src: '/' + _0x4d4888 + '.png' }]));
        }
        throw new Error('unexpected fetch: ' + _0x522320);
      },
      async () => {
        const _0x42be1f = await processInputImages(['https://input.example/free-fallback.png'], '', {
          compress: false,
          provider: 'grsai',
          preferFree: true,
          strictUpload: true,
        });
        (assert.deepEqual(_0x42be1f, ['https://telegra.ph/fallback-ref.png']),
          assert.ok(_0x47f7ff.some(isUguuProxyUpload)),
          assert.ok(_0x47f7ff.some(isTelegraphProxyUpload)));
      },
    );
  }),
  test('imageUploadApi: RunningHUB upload accepts alternate url fields and reports provider errors', async () => {
    (await withMockFetch(
      async (_0x23dc25, _0x2f1457 = {}) => {
        const _0x2124ea = String(_0x23dc25 || '');
        if (_0x2124ea.startsWith('/api/v2/proxy/upload?'))
          return (
            assert.equal(_0x2f1457.headers?.Authorization, 'Bearer k_rh_model'),
            createResponse(
              JSON.stringify({
                code: 0,
                data: { fileUrl: 'https://www.runninghub.cn/uploaded/file-url.png' },
              }),
            )
          );
        throw new Error('unexpected fetch: ' + _0x2124ea);
      },
      async () => {
        const _0x35dcfc = await uploadToRunningHub(
          new Blob(['rh-image'], { type: 'image/png' }),
          'k_rh_model',
        );
        assert.equal(_0x35dcfc, 'https://www.runninghub.cn/uploaded/file-url.png');
      },
    ),
      await withMockFetch(
        async (_0x31bbb9) => {
          const _0x359101 = String(_0x31bbb9 || '');
          if (_0x359101.startsWith('/api/v2/proxy/upload?'))
            return createResponse(JSON.stringify({ code: 0x191, errorMessage: 'invalid model api key' }));
          throw new Error('unexpected fetch: ' + _0x359101);
        },
        async () => {
          await assert.rejects(
            () => uploadToRunningHub(new Blob(['rh-image'], { type: 'image/png' }), 'bad_key'),
            /invalid model api key.*401/,
          );
        },
      ));
  }),
  test('imageUploadApi: processInputImagesPreserveOrder 上传失败时保留空槽位', async () => {
    await withMockFetch(
      async (_0x99bf93, _0x145755 = {}) => {
        const _0x162bad = String(_0x99bf93 || '');
        if (_0x162bad.startsWith('https://input.example/')) {
          const _0x1015d4 = _0x162bad.split('/').pop();
          return new Response(new Blob([_0x1015d4]), { status: 200 });
        }
        if (isTelegraphProxyUpload(_0x162bad)) {
          const _0x17c435 = await readUploadMarker(_0x145755.body);
          if (_0x17c435 === 'b')
            return createResponse('upload failed', {
              status: 0x1f4,
              headers: { 'Content-Type': 'text/plain' },
            });
          return createResponse(JSON.stringify([{ src: '/' + _0x17c435 + '.png' }]));
        }
        throw new Error('unexpected fetch: ' + _0x162bad);
      },
      async () => {
        const _0x4ba859 = await processInputImagesPreserveOrder(
          ['https://input.example/a', 'https://input.example/b', 'https://input.example/c'],
          '',
          { compress: false },
        );
        assert.deepEqual(_0x4ba859, ['https://telegra.ph/a.png', '', 'https://telegra.ph/c.png']);
      },
    );
  }),
  test('imageUploadApi: 重复 URL 和空白输入不会破坏顺序', async () => {
    await withMockFetch(
      async (_0x46cf40, _0x226ba8 = {}) => {
        const _0x1c07da = String(_0x46cf40 || '');
        if (_0x1c07da.startsWith('https://input.example/')) {
          const _0x4d061a = _0x1c07da.split('/').pop();
          return new Response(new Blob([_0x4d061a]), { status: 200 });
        }
        if (isTelegraphProxyUpload(_0x1c07da)) {
          const _0x33ac3c = await readUploadMarker(_0x226ba8.body);
          return createResponse(JSON.stringify([{ src: '/' + _0x33ac3c + '.png' }]));
        }
        throw new Error('unexpected fetch: ' + _0x1c07da);
      },
      async () => {
        const _0x5c46fa = await processInputImages(
          ['https://input.example/a', '', 'https://input.example/a', 'https://input.example/b'],
          '',
          { compress: false },
        );
        assert.deepEqual(_0x5c46fa, [
          'https://telegra.ph/a.png',
          'https://telegra.ph/a.png',
          'https://telegra.ph/b.png',
        ]);
        const _0x3b284a = await processInputImagesPreserveOrder(
          ['https://input.example/a', '   ', 'https://input.example/a', 'https://input.example/b'],
          '',
          { compress: false },
        );
        assert.deepEqual(_0x3b284a, [
          'https://telegra.ph/a.png',
          '',
          'https://telegra.ph/a.png',
          'https://telegra.ph/b.png',
        ]);
      },
    );
  }),
  test('imageUploadApi: APIMART 上传携带 API Key 并返回 URL', async () => {
    const _0x5518b0 = [];
    await withMockFetch(
      async (_0x4638e3, _0x312bd4 = {}) => {
        const _0x3b758f = String(_0x4638e3 || '');
        if (_0x3b758f === 'https://input.example/ref.png')
          return new Response(new Blob(['ref'], { type: 'image/png' }), { status: 200 });
        if (_0x3b758f === '/api/v2/proxy/apimart-upload') {
          assert.equal(_0x312bd4.method, 'POST');
          const _0x5cda53 = Object.fromEntries(_0x312bd4.body.entries());
          return (
            assert.equal(_0x5cda53.contentType, 'image/png'),
            assert.equal(_0x5cda53.fileExtension, 'png'),
            assert.equal(_0x5cda53.apiKey, 'k_apimart'),
            assert.equal(_0x5cda53.apiUrl, 'https://api.apib.ai'),
            _0x5518b0.push(await _0x5cda53.file.text()),
            createResponse(JSON.stringify({ url: 'https://upload.apimart.ai/files/ref.png' }))
          );
        }
        throw new Error('unexpected fetch: ' + _0x3b758f);
      },
      async () => {
        const _0x440c8c = await processInputImages(['https://input.example/ref.png'], 'k_apimart', {
          compress: false,
          provider: 'apimart',
        });
        (assert.deepEqual(_0x440c8c, ['https://upload.apimart.ai/files/ref.png']),
          assert.deepEqual(_0x5518b0, ['ref']));
      },
    );
  }),
  test('imageUploadApi: APIMART CDN 图片不会重复上传', async () => {
    await withMockFetch(
      async (_0x45d711) => {
        throw new Error('unexpected fetch: ' + String(_0x45d711));
      },
      async () => {
        const _0x38ec38 = await processInputImages(
          ['https://cdn.apimart.ai/files/existing.png'],
          'k_apimart',
          { compress: false, provider: 'apimart' },
        );
        assert.deepEqual(_0x38ec38, ['https://cdn.apimart.ai/files/existing.png']);
      },
    );
  }),
  test('imageUploadApi: APIMART asset URL 不会重复上传', async () => {
    await withMockFetch(
      async (_0xbcdffe) => {
        throw new Error('unexpected fetch: ' + String(_0xbcdffe));
      },
      async () => {
        const _0x35f39d = await processInputImages(['asset://seedance/avatar-image'], 'k_apimart', {
          compress: false,
          provider: 'apimart',
        });
        assert.deepEqual(_0x35f39d, ['asset://seedance/avatar-image']);
      },
    );
  }));
