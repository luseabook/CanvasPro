import test from 'node:test';
import assert from 'node:assert/strict';

// A real 1x1 transparent PNG. Its magic bytes (89 50 4E 47 ...) let the extractor's sniffing run
// on genuine base64, exactly like the payload Agnes returns for image-to-image requests.
const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const AGNES_25_MODEL = 'agnes/agnes-image-2.5-flash';

function makeJsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        return String(name || '').toLowerCase() === 'content-type' ? 'application/json' : null;
      },
    },
    json: async () => (typeof body === 'string' ? JSON.parse(body) : body),
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

test('aiImageApi agnes i2i: base64_json response flows through the real generateImage extractor', async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const proxyBodies = [];
  try {
    globalThis.window = { currentProjectId: 'agnes-i2i-test', location: { href: 'http://localhost/' } };
    globalThis.fetch = async (target, init = {}) => {
      const url = String(target);
      // Config bootstrap.
      if (url === '/api/config')
        return makeJsonResponse({
          providers: { agnes: { apiUrl: 'https://api.agnes.example.com/', apiKey: 'k_agnes' } },
        });
      // The reference image is read back as a blob (browser fetch supports data URLs, so does this).
      if (url.startsWith('data:'))
        return new Response(new Blob([Buffer.from(PNG_1X1_BASE64, 'base64')], { type: 'image/png' }), {
          status: 200,
          headers: { 'Content-Type': 'image/png' },
        });
      // Free-image-host upload of the reference image.
      if (url.startsWith('/api/v2/proxy/upload'))
        return makeJsonResponse({
          success: true,
          files: [{ url: 'https://uguu.se/uploaded/agnes-ref.png' }],
        });
      // The image-generation submit goes through the proxy. The mock server answers with the very
      // payload Agnes returns when a reference image is present: an empty url plus a base64 PNG.
      if (url.startsWith('/api/v2/proxy/image')) {
        if (init?.body) proxyBodies.push(String(init.body));
        return makeJsonResponse(JSON.stringify({ data: [{ url: '', b64_json: PNG_1X1_BASE64 }] }));
      }
      // Persist the decoded data URL to the project output directory.
      if (url.startsWith('/api/v2/save_output'))
        return makeJsonResponse({ path: 'output/agnes-i2i.png' });
      // The client-side save of the decoded data URL is not part of this test; let it fail fast.
      throw new Error('unexpected fetch url: ' + url);
    };

    const { clearApiConfig } = await import('./configApi.js');
    clearApiConfig();
    const { buildGenerateImageRequest, generateImage } = await import('./aiImageApi.js');

    const inputImage = 'data:image/png;base64,' + PNG_1X1_BASE64;
    const params = {
      prompt: 'draw a cat',
      provider: 'agnes',
      model: AGNES_25_MODEL,
      inputUrls: [inputImage],
      aspectRatio: '1:1',
    };

    // Sanity: the body resolver forces b64_json whenever a reference image is supplied, i.e. this
    // is exactly the i2i request that produced the reported defect.
    const request = await buildGenerateImageRequest({ ...params });
    assert.equal(request.url, '/api/v2/proxy/image');
    assert.equal(request.body?.extra_body?.response_format, 'b64_json');
    assert.deepEqual(request.body?.extra_body?.image, ['https://uguu.se/uploaded/agnes-ref.png']);

    let outcome = null;
    let thrown = null;
    try {
      outcome = await generateImage({ ...params });
    } catch (error) {
      thrown = error;
    }

    // Before the wiring fix generateImage rejects with a PARSE_ERROR
    // ("无法从服务器响应中提取图片地址") because the extractor never read data[].b64_json.
    assert.equal(thrown, null, 'generateImage must not reject: ' + (thrown && (thrown.message || thrown)));

    const records = Array.isArray(outcome?.images) ? outcome.images : [outcome];
    const sources = records.map((record) => String(record?.sourceUrl || '')).filter(Boolean);
    assert.ok(
      sources.some((source) => source.startsWith('data:image/png;base64,' + PNG_1X1_BASE64)),
      'the decoded PNG data URL must surface as a result sourceUrl; got: ' + JSON.stringify(records),
    );

    // The request that actually reached the proxy must be the i2i request (reference image + b64_json).
    const sentBody = JSON.parse(proxyBodies[proxyBodies.length - 1] || '{}');
    assert.equal(sentBody?.extra_body?.response_format, 'b64_json');
    assert.deepEqual(sentBody?.extra_body?.image, ['https://uguu.se/uploaded/agnes-ref.png']);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.window = originalWindow;
  }
});
