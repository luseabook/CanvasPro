import test from 'node:test';
import assert from 'node:assert/strict';
import { processInputImages, processInputImagesPreserveOrder, uploadToRunningHub } from './imageUploadApi.js';
import { pickFreeImageHostUrl, uploadToFreeImageHost, 免费图床 } from './freeImageHostApi.js';
const sleep = (value) => new Promise((item) => setTimeout(item, value));
function createResponse(key, args = {}) {
  return new Response(key, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...args,
  });
}
async function readUploadMarker(map) {
  if (!map || typeof map.entries !== 'function') return '';
  for (const [index, response] of map.entries()) {
    if (index !== 'file' && index !== 'files[]') continue;
    if (response && typeof response.text === 'function') return await response.text();
  }
  return '';
}
async function withMockFetch(result, handler) {
  const data = globalThis.fetch;
  globalThis.fetch = result;
  try {
    return await handler();
  } finally {
    globalThis.fetch = data;
  }
}
function isProxyUploadTo(options, target) {
  const list = String(options || '');
  if (!list.startsWith('/api/v2/proxy/upload?')) return false;
  const source = list.slice(list.indexOf('?') + 1);
  return new URLSearchParams(source).get('apiUrl') === target;
}
function isUguuProxyUpload(next) {
  return isProxyUploadTo(next, 'https://uguu.se/upload');
}
function isTelegraphProxyUpload(current) {
  return isProxyUploadTo(current, 'https://telegra.ph/upload');
}
(test('imageUploadApi: processInputImages 空入参返回空数组', async () => {
  (assert.deepEqual(await processInputImages(null, 'k'), []),
    assert.deepEqual(await processInputImages([], 'k'), []));
}),
  test('imageUploadApi: processInputImagesPreserveOrder 空/空白会保序输出空串', async () => {
    const list2 = await processInputImagesPreserveOrder(['', '   '], 'k');
    (assert.equal(list2.length, 2), assert.equal(list2[0], ''), assert.equal(list2[1], ''));
  }),
  test('imageUploadApi: processInputImages 并发上传完成顺序不同也保持输入顺序', async () => {
    const entry = { a: 20, b: 30, c: 5 };
    await withMockFetch(
      async (record, dom = {}) => {
        const payload = String(record || '');
        if (payload.startsWith('https://input.example/')) {
          const handle = payload.split('/').pop();
          return new Response(new Blob([handle]), { status: 200 });
        }
        if (isTelegraphProxyUpload(payload)) {
          const uploadMarker = await readUploadMarker(dom.body);
          return (
            await sleep(entry[uploadMarker] || 0),
            createResponse(JSON.stringify([{ src: '/' + uploadMarker + '.png' }]))
          );
        }
        throw new Error('unexpected fetch: ' + payload);
      },
      async () => {
        const processInputImages2 = await processInputImages(
          ['https://input.example/a', 'https://input.example/b', 'https://input.example/c'],
          '',
          { compress: false },
        );
        assert.deepEqual(processInputImages2, [
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
        async (state, dom2 = {}) => {
          const config = String(state || '');
          if (isUguuProxyUpload(config)) {
            (assert.equal(dom2.method, 'POST'), assert.equal(dom2.headers?.Authorization, undefined));
            const scope = Object.fromEntries(dom2.body.entries());
            return (
              assert.ok(scope['files[]']),
              assert.equal(await scope['files[]'].text(), 'free-image'),
              createResponse(
                JSON.stringify({
                  success: true,
                  files: [{ url: 'https://uguu.se/uploaded/free-image.png' }],
                }),
              )
            );
          }
          throw new Error('unexpected fetch: ' + config);
        },
        async () => {
          const freeImageHost = await uploadToFreeImageHost(new Blob(['free-image'], { type: 'image/png' }));
          assert.equal(freeImageHost, 'https://uguu.se/uploaded/free-image.png');
        },
      ));
  }),
  test('imageUploadApi: processInputImages 可复用免费图床 provider', async () => {
    await withMockFetch(
      async (input, dom3 = {}) => {
        const output = String(input || '');
        if (output === 'https://input.example/free.png')
          return new Response(new Blob(['free-ref'], { type: 'image/png' }), { status: 200 });
        if (isUguuProxyUpload(output)) {
          const uploadMarker2 = await readUploadMarker(dom3.body);
          return createResponse(
            JSON.stringify({
              success: true,
              files: [{ url: 'https://uguu.se/uploaded/' + uploadMarker2 + '.png' }],
            }),
          );
        }
        throw new Error('unexpected fetch: ' + output);
      },
      async () => {
        const processInputImages3 = await processInputImages(['https://input.example/free.png'], '', {
          compress: false,
          provider: 'freeImageHost',
        });
        assert.deepEqual(processInputImages3, ['https://uguu.se/uploaded/free-ref.png']);
      },
    );
  }),
  test('imageUploadApi: preferFree 免费图床网络失败时会自动回退 Telegraph', async () => {
    const list3 = [];
    await withMockFetch(
      async (value2, dom4 = {}) => {
        const value3 = String(value2 || '');
        list3.push(value3);
        if (value3 === 'https://input.example/free-fallback.png')
          return new Response(new Blob(['fallback-ref'], { type: 'image/png' }), { status: 200 });
        if (isUguuProxyUpload(value3)) throw new Error('network down');
        if (isTelegraphProxyUpload(value3)) {
          const uploadMarker3 = await readUploadMarker(dom4.body);
          return createResponse(JSON.stringify([{ src: '/' + uploadMarker3 + '.png' }]));
        }
        throw new Error('unexpected fetch: ' + value3);
      },
      async () => {
        const processInputImages4 = await processInputImages(
          ['https://input.example/free-fallback.png'],
          '',
          {
            compress: false,
            provider: 'grsai',
            preferFree: true,
            strictUpload: true,
          },
        );
        (assert.deepEqual(processInputImages4, ['https://telegra.ph/fallback-ref.png']),
          assert.ok(list3.some(isUguuProxyUpload)),
          assert.ok(list3.some(isTelegraphProxyUpload)));
      },
    );
  }),
  test('imageUploadApi: RunningHUB upload accepts alternate url fields and reports provider errors', async () => {
    (await withMockFetch(
      async (value4, response2 = {}) => {
        const value5 = String(value4 || '');
        if (value5.startsWith('/api/v2/proxy/upload?'))
          return (
            assert.equal(response2.headers?.Authorization, 'Bearer k_rh_model'),
            createResponse(
              JSON.stringify({
                code: 0,
                data: { fileUrl: 'https://www.runninghub.cn/uploaded/file-url.png' },
              }),
            )
          );
        throw new Error('unexpected fetch: ' + value5);
      },
      async () => {
        const runningHub = await uploadToRunningHub(
          new Blob(['rh-image'], { type: 'image/png' }),
          'k_rh_model',
        );
        assert.equal(runningHub, 'https://www.runninghub.cn/uploaded/file-url.png');
      },
    ),
      await withMockFetch(
        async (value6) => {
          const value7 = String(value6 || '');
          if (value7.startsWith('/api/v2/proxy/upload?'))
            return createResponse(JSON.stringify({ code: 401, errorMessage: 'invalid model api key' }));
          throw new Error('unexpected fetch: ' + value7);
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
      async (value8, dom5 = {}) => {
        const value9 = String(value8 || '');
        if (value9.startsWith('https://input.example/')) {
          const value10 = value9.split('/').pop();
          return new Response(new Blob([value10]), { status: 200 });
        }
        if (isTelegraphProxyUpload(value9)) {
          const uploadMarker4 = await readUploadMarker(dom5.body);
          if (uploadMarker4 === 'b')
            return createResponse('upload failed', {
              status: 500,
              headers: { 'Content-Type': 'text/plain' },
            });
          return createResponse(JSON.stringify([{ src: '/' + uploadMarker4 + '.png' }]));
        }
        throw new Error('unexpected fetch: ' + value9);
      },
      async () => {
        const processInputImagesPreserveOrder2 = await processInputImagesPreserveOrder(
          ['https://input.example/a', 'https://input.example/b', 'https://input.example/c'],
          '',
          { compress: false },
        );
        assert.deepEqual(processInputImagesPreserveOrder2, [
          'https://telegra.ph/a.png',
          '',
          'https://telegra.ph/c.png',
        ]);
      },
    );
  }),
  test('imageUploadApi: 重复 URL 和空白输入不会破坏顺序', async () => {
    await withMockFetch(
      async (value11, dom6 = {}) => {
        const value12 = String(value11 || '');
        if (value12.startsWith('https://input.example/')) {
          const value13 = value12.split('/').pop();
          return new Response(new Blob([value13]), { status: 200 });
        }
        if (isTelegraphProxyUpload(value12)) {
          const uploadMarker5 = await readUploadMarker(dom6.body);
          return createResponse(JSON.stringify([{ src: '/' + uploadMarker5 + '.png' }]));
        }
        throw new Error('unexpected fetch: ' + value12);
      },
      async () => {
        const processInputImages5 = await processInputImages(
          ['https://input.example/a', '', 'https://input.example/a', 'https://input.example/b'],
          '',
          { compress: false },
        );
        assert.deepEqual(processInputImages5, [
          'https://telegra.ph/a.png',
          'https://telegra.ph/a.png',
          'https://telegra.ph/b.png',
        ]);
        const processInputImagesPreserveOrder3 = await processInputImagesPreserveOrder(
          ['https://input.example/a', '   ', 'https://input.example/a', 'https://input.example/b'],
          '',
          { compress: false },
        );
        assert.deepEqual(processInputImagesPreserveOrder3, [
          'https://telegra.ph/a.png',
          '',
          'https://telegra.ph/a.png',
          'https://telegra.ph/b.png',
        ]);
      },
    );
  }),
  test('imageUploadApi: APIMART 上传携带 API Key 并返回 URL', async () => {
    const list4 = [];
    await withMockFetch(
      async (value14, dom7 = {}) => {
        const value15 = String(value14 || '');
        if (value15 === 'https://input.example/ref.png')
          return new Response(new Blob(['ref'], { type: 'image/png' }), { status: 200 });
        if (value15 === '/api/v2/proxy/apimart-upload') {
          assert.equal(dom7.method, 'POST');
          const value16 = Object.fromEntries(dom7.body.entries());
          return (
            assert.equal(value16.contentType, 'image/png'),
            assert.equal(value16.fileExtension, 'png'),
            assert.equal(value16.apiKey, 'k_apimart'),
            assert.equal(value16.apiUrl, 'https://api.apib.ai'),
            list4.push(await value16.file.text()),
            createResponse(JSON.stringify({ url: 'https://upload.apimart.ai/files/ref.png' }))
          );
        }
        throw new Error('unexpected fetch: ' + value15);
      },
      async () => {
        const processInputImages6 = await processInputImages(['https://input.example/ref.png'], 'k_apimart', {
          compress: false,
          provider: 'apimart',
        });
        (assert.deepEqual(processInputImages6, ['https://upload.apimart.ai/files/ref.png']),
          assert.deepEqual(list4, ['ref']));
      },
    );
  }),
  test('imageUploadApi: APIMART CDN 图片不会重复上传', async () => {
    await withMockFetch(
      async (value17) => {
        throw new Error('unexpected fetch: ' + String(value17));
      },
      async () => {
        const processInputImages7 = await processInputImages(
          ['https://cdn.apimart.ai/files/existing.png'],
          'k_apimart',
          { compress: false, provider: 'apimart' },
        );
        assert.deepEqual(processInputImages7, ['https://cdn.apimart.ai/files/existing.png']);
      },
    );
  }),
  test('imageUploadApi: APIMART asset URL 不会重复上传', async () => {
    await withMockFetch(
      async (value18) => {
        throw new Error('unexpected fetch: ' + String(value18));
      },
      async () => {
        const processInputImages8 = await processInputImages(['asset://seedance/avatar-image'], 'k_apimart', {
          compress: false,
          provider: 'apimart',
        });
        assert.deepEqual(processInputImages8, ['asset://seedance/avatar-image']);
      },
    );
  }));
