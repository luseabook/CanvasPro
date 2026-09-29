import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isCustomProviderAssetUploadProvider,
  isReusableCustomProviderAssetUrl,
  uploadToCustomProviderAsset,
} from './customProviderAssetUploadApi.js';

function namedBlob(content, name, type) {
  const blob = new Blob([content], { type });
  Object.defineProperty(blob, 'name', { value: name });
  return blob;
}

const baseOptions = {
  apiUrl: 'https://upload.test/v1/assets',
  multipartField: 'file',
  responsePath: 'data.items[0].url',
  forceProviderUpload: true,
};

test('customProviderAssetUploadApi: recognizes provider aliases', () => {
  assert.equal(isCustomProviderAssetUploadProvider('custom-provider-asset'), true);
  assert.equal(isCustomProviderAssetUploadProvider(' custom_provider_asset '), true);
  assert.equal(isCustomProviderAssetUploadProvider('customprovider'), false);
});

test('customProviderAssetUploadApi: reuses only same-origin uploaded asset URLs', () => {
  assert.equal(
    isReusableCustomProviderAssetUrl(
      'https://cdn.test/assets/uploads/a.png?token=1',
      'https://cdn.test/v1/generate',
    ),
    true,
  );
  assert.equal(
    isReusableCustomProviderAssetUrl(
      'https://other.test/assets/uploads/a.png',
      'https://cdn.test/v1/generate',
    ),
    false,
  );
  assert.equal(
    isReusableCustomProviderAssetUrl('https://cdn.test/tmp/a.png', 'https://cdn.test/v1/generate'),
    false,
  );
  assert.equal(isReusableCustomProviderAssetUrl('', 'https://cdn.test'), false);
});

test('customProviderAssetUploadApi: validates files, options, size, and extension', async () => {
  await assert.rejects(() => uploadToCustomProviderAsset(null, 'key', baseOptions), /文件不能为空/);
  await assert.rejects(() => uploadToCustomProviderAsset(new Blob(['x']), '', baseOptions), /API Key 未配置/);
  await assert.rejects(
    () =>
      uploadToCustomProviderAsset(new Blob(['x']), 'key', {
        ...baseOptions,
        apiUrl: 'file:///tmp/a',
      }),
    /缺少安全的上传地址/,
  );
  await assert.rejects(
    () =>
      uploadToCustomProviderAsset(new Blob(['x']), 'key', {
        ...baseOptions,
        multipartField: 'not valid',
      }),
    /上传字段无效/,
  );
  await assert.rejects(
    () =>
      uploadToCustomProviderAsset(new Blob(['x']), 'key', {
        ...baseOptions,
        responsePath: 'data/url',
      }),
    /返回路径无效/,
  );

  const oversized = namedBlob('12345', 'photo.png', 'image/png');
  await assert.rejects(
    () =>
      uploadToCustomProviderAsset(oversized, 'key', {
        ...baseOptions,
        maxBytes: 4,
        allowedExtensions: ['png'],
      }),
    /超过 1MB 限制/,
  );
  await assert.rejects(
    () =>
      uploadToCustomProviderAsset(namedBlob('x', 'photo.gif', 'image/gif'), 'key', {
        ...baseOptions,
        allowedExtensions: ['png'],
      }),
    /不支持 .gif 格式/,
  );
});

test('customProviderAssetUploadApi: posts multipart data and resolves a nested URL', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ data: { items: [{ url: 'https://cdn.test/a.png' }] } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    const url = await uploadToCustomProviderAsset(
      namedBlob('image', 'photo.png', 'image/png'),
      'secret-key',
      {
        ...baseOptions,
        maxBytes: 1024,
        allowedExtensions: ['png'],
        formFields: { model: 'image-model', purpose: 'edit', ignored: 'value' },
      },
    );

    assert.equal(url, 'https://cdn.test/a.png');
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /^\/api\/v2\/proxy\/upload\?apiUrl=/);
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(calls[0].options.headers.Authorization, 'Bearer secret-key');
    assert.ok(calls[0].options.body instanceof FormData);
    assert.equal(calls[0].options.body.get('file').name, 'asset.png');
    assert.equal(calls[0].options.body.get('model'), 'image-model');
    assert.equal(calls[0].options.body.get('purpose'), 'edit');
    assert.equal(calls[0].options.body.has('ignored'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
