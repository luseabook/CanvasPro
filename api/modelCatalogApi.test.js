import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BINGHUO_MODEL_CATALOG_PATH,
  ModelCatalogApiError,
  fetchBinghuoModelCatalog,
} from './modelCatalogApi.js';

test('modelCatalogApi: requires install and device identities', async () => {
  await assert.rejects(
    () => fetchBinghuoModelCatalog({ installId: '', deviceId: 'device' }),
    ModelCatalogApiError,
  );
});

test('modelCatalogApi: sends cache headers and handles not-modified responses', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(null, {
      status: 304,
      headers: {
        ETag: '"catalog-v2"',
        'Cache-Control': 'max-age=60',
        'Last-Modified': 'Mon, 01 Jan 2024 00:00:00 GMT',
      },
    });
  };

  try {
    const result = await fetchBinghuoModelCatalog({
      installId: ' install-1 ',
      deviceId: ' device-1 ',
      etag: ' "catalog-v1" ',
    });
    assert.deepEqual(result, {
      status: 'not-modified',
      bundle: null,
      httpStatus: 304,
      etag: '"catalog-v2"',
      cacheControl: 'max-age=60',
      lastModified: 'Mon, 01 Jan 2024 00:00:00 GMT',
    });
    assert.equal(request.url, BINGHUO_MODEL_CATALOG_PATH);
    assert.equal(request.options.headers['X-AIC-Install-Id'], 'install-1');
    assert.equal(request.options.headers['X-AIC-Device-Id'], 'device-1');
    assert.equal(request.options.headers['If-None-Match'], '"catalog-v1"');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('modelCatalogApi: returns bundles and surfaces HTTP failures', async () => {
  const originalFetch = globalThis.fetch;
  const responses = [
    new Response(JSON.stringify({ models: [{ id: 'model-1' }] }), {
      status: 200,
      headers: { 'content-type': 'application/json', ETag: '"v2"' },
    }),
    new Response(JSON.stringify({ message: 'catalog denied' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    }),
  ];
  globalThis.fetch = async () => responses.shift();

  try {
    const result = await fetchBinghuoModelCatalog({
      installId: 'i',
      deviceId: 'd',
    });
    assert.equal(result.status, 'ok');
    assert.deepEqual(result.bundle, { models: [{ id: 'model-1' }] });
    await assert.rejects(
      () => fetchBinghuoModelCatalog({ installId: 'i', deviceId: 'd' }),
      (error) =>
        error instanceof ModelCatalogApiError && error.status === 403 && error.message === 'catalog denied',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
