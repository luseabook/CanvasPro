import test from 'node:test';
import assert from 'node:assert/strict';
function installFetchMockForConfig(value) {
  globalThis.fetch = async (item) => {
    const key = String(item);
    if (key !== '/api/config') throw new Error('unexpected fetch url: ' + key);
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => value,
      text: async () => JSON.stringify(value),
    };
  };
}
(test('aiImageApi: grsai 无 apiKey 时抛出 AUTH_ERROR', async () => {
  const index = globalThis.fetch;
  try {
    installFetchMockForConfig({
      providers: { grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' } },
    });
    const { clearApiConfig: clearApiConfig } = await import('./configApi.js');
    clearApiConfig();
    const { buildGenerateImageRequest: buildGenerateImageRequest } = await import('./aiImageApi.js');
    try {
      (await buildGenerateImageRequest({ prompt: 'p', model: 'nano-banana-pro-vt' }),
        assert.fail('should throw'));
    } catch (error) {
      (assert.equal(error?.name, 'ApiError'),
        assert.equal(error?.type, 'AUTH_ERROR'),
        assert.equal(error?.provider, 'grsai'));
    }
  } finally {
    globalThis.fetch = index;
  }
}),
  test('aiImageApi: ppio seedream branch uses proxy/image without requiring inputUrls', async () => {
    const result = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          ppio: { apiUrl: 'https://ppio.example.com/', apiKey: 'k_ppio' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: clearApiConfig2 } = await import('./configApi.js');
      clearApiConfig2();
      const { buildGenerateImageRequest: buildGenerateImageRequest2 } = await import('./aiImageApi.js'),
        dom = await buildGenerateImageRequest2({
          prompt: 'p',
          model: 'ppio/seedream-5.0-lite',
          aspectRatio: '16：9',
        });
      (assert.equal(dom.url, '/api/v2/proxy/image'),
        assert.ok(String(dom.body.apiUrl).includes('/v3/seedream-5.0-lite')),
        assert.equal(dom.body.size, '2752x1536'),
        assert.equal(dom.adapterTrace?.source, 'manifest'),
        assert.equal(dom.adapterTrace?.executionId, 'ppio.model-api.seedream-5-lite.v1'));
    } finally {
      globalThis.fetch = result;
    }
  }),
  test('aiImageApi: volcengine seedream models use Ark images endpoint', async () => {
    const data = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_ark' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: clearApiConfig3 } = await import('./configApi.js');
      clearApiConfig3();
      const { buildGenerateImageRequest: buildGenerateImageRequest3 } = await import('./aiImageApi.js'),
        dom2 = await buildGenerateImageRequest3({
          prompt: 'p',
          provider: 'volcengine',
          model: 'volcengine/seedream-5.0',
          aspectRatio: '16:9',
          imageSize: '2K',
          inputUrls: [],
        });
      (assert.equal(dom2.url, '/api/v2/proxy/image'),
        assert.equal(dom2.body.apiUrl, 'https://ark.cn-beijing.volces.com/api/v3/images/generations'),
        assert.equal(dom2.body.apiKey, 'k_ark'),
        assert.equal(dom2.body.model, 'doubao-seedream-5-0-260128'),
        assert.equal(dom2.body.size, '2848x1600'),
        assert.equal(dom2.body.response_format, 'url'),
        assert.equal(dom2.body.watermark, false),
        assert.equal(dom2.body.sequential_image_generation, 'disabled'),
        assert.equal(dom2.body.sequential_image_generation_options, undefined),
        assert.equal(dom2.adapterTrace?.executionId, 'volcengine.model-api.seedream-5.v1'));
      const dom3 = await buildGenerateImageRequest3({
        prompt: 'p',
        provider: 'volcengine',
        model: 'volcengine/seedream-4.5',
        aspectRatio: '1:1',
        imageSize: '4K',
        batchSize: 4,
        inputUrls: [],
      });
      (assert.equal(dom3.body.model, 'doubao-seedream-4-5-251128'),
        assert.equal(dom3.body.size, '2880x2880'),
        assert.equal(dom3.body.sequential_image_generation, 'auto'),
        assert.equal(dom3.body.sequential_image_generation_options?.max_images, 4));
      const dom4 = await buildGenerateImageRequest3({
        prompt: 'p',
        provider: 'volcengine',
        model: 'volcengine/seedream-4.0',
        aspectRatio: '3:2',
        imageSize: '1K',
        inputUrls: [],
      });
      (assert.equal(dom4.body.model, 'doubao-seedream-4-0-250828'), assert.equal(dom4.body.size, '1256x840'));
    } finally {
      globalThis.fetch = data;
    }
  }),
  test('aiImageApi: volcengine seedream reference images upload through free image host', async () => {
    const options = globalThis.fetch,
      list = [];
    try {
      globalThis.fetch = async (target, dom5 = {}) => {
        const source = String(target);
        if (source === '/api/config')
          return makeJsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_ark' },
            },
          });
        if (source === '/local/ref.png') return makeBlobResponse('seedream-ref-image', 'image/png');
        if (source.startsWith('/api/v2/proxy/upload?')) {
          assert.equal(dom5.headers?.Authorization, undefined);
          const uRL = new URL('http://local' + source).searchParams.get('apiUrl');
          assert.equal(uRL, 'https://uguu.se/upload');
          const next = Object.fromEntries(dom5.body.entries());
          return (
            assert.ok(next['files[]']),
            list.push(await next['files[]'].text()),
            makeJsonResponse({ success: true, files: [{ url: 'https://uguu.se/uploaded/seedream-ref.png' }] })
          );
        }
        throw new Error('unexpected fetch url: ' + source);
      };
      const { clearApiConfig: clearApiConfig4 } = await import('./configApi.js');
      clearApiConfig4();
      const { buildGenerateImageRequest: buildGenerateImageRequest4 } = await import('./aiImageApi.js'),
        dom6 = await buildGenerateImageRequest4({
          prompt: 'p',
          provider: 'volcengine',
          model: 'volcengine/seedream-4.0',
          aspectRatio: '1:1',
          imageSize: '2K',
          inputUrls: ['/local/ref.png'],
        });
      (assert.equal(dom6.url, '/api/v2/proxy/image'),
        assert.equal(dom6.body.apiUrl, 'https://ark.cn-beijing.volces.com/api/v3/images/generations'),
        assert.deepEqual(dom6.body.image, ['https://uguu.se/uploaded/seedream-ref.png']),
        assert.deepEqual(list, ['seedream-ref-image']));
    } finally {
      globalThis.fetch = options;
    }
  }),
  test('aiImageApi: volcengine direct image response with id does not poll', async () => {
    const current = globalThis.fetch,
      entry = globalThis.window;
    let record = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (payload) => {
          const handle = String(payload);
          if (handle === '/api/config')
            return makeJsonResponse({
              providers: {
                volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_ark' },
                grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
              },
            });
          if (handle === '/api/v2/proxy/image')
            return makeTextResponse(
              JSON.stringify({
                id: 'ark-direct-response-1',
                created: 0x6a18a500,
                data: [{ url: 'https://ark.example.com/seedream.png' }],
              }),
            );
          if (handle.startsWith('/api/v2/proxy/task?')) {
            record += 1;
            throw new Error('unexpected task poll: ' + handle);
          }
          if (handle === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/volcengine-direct.png' });
          throw new Error('unexpected fetch url: ' + handle);
        }));
      const { clearApiConfig: clearApiConfig5 } = await import('./configApi.js');
      clearApiConfig5();
      const { generateImage: generateImage } = await import('./aiImageApi.js'),
        state = await generateImage({
          prompt: 'cat',
          provider: 'volcengine',
          model: 'volcengine/seedream-4.0',
          inputUrls: [],
          aspectRatio: '1:1',
          imageSize: '2K',
        });
      (assert.equal(record, 0),
        assert.equal(state.localPath, 'output/volcengine-direct.png'),
        assert.equal(state.imageUrl, '/output/volcengine-direct.png'));
    } finally {
      ((globalThis.fetch = current), (globalThis.window = entry));
    }
  }),
  test('aiImageApi: dreamina versioned model forwards modelVersion', async () => {
    const config = globalThis.fetch;
    try {
      installFetchMockForConfig({ providers: {} });
      const { clearApiConfig: clearApiConfig6 } = await import('./configApi.js');
      clearApiConfig6();
      const { buildGenerateImageRequest: buildGenerateImageRequest5 } = await import('./aiImageApi.js'),
        dom7 = await buildGenerateImageRequest5({
          prompt: 'p',
          provider: 'dreamina',
          model: 'dreamina/4.5',
          aspectRatio: '1:1',
          imageSize: '2K',
          inputUrls: [],
        });
      (assert.equal(dom7.url, '/api/v2/dreamina/text2image'),
        assert.equal(dom7.body.modelVersion, '4.5'),
        assert.equal(dom7.body.ratio, '1:1'),
        assert.equal(dom7.body.resolutionType, '2k'));
    } finally {
      globalThis.fetch = config;
    }
  }));
function makeJsonResponse(scope, ok = 200) {
  return {
    ok: ok >= 200 && ok < 0x12c,
    status: ok,
    headers: {
      get(input) {
        return String(input || '').toLowerCase() === 'content-type' ? 'application/json' : null;
      },
    },
    json: async () => scope,
    text: async () => JSON.stringify(scope),
  };
}
function makeTextResponse(output, ok2 = 200) {
  const value2 = String(output || '');
  return {
    ok: ok2 >= 200 && ok2 < 0x12c,
    status: ok2,
    headers: {
      get(value3) {
        return String(value3 || '').toLowerCase() === 'content-type' ? 'text/plain' : null;
      },
    },
    json: async () => JSON.parse(value2),
    text: async () => value2,
  };
}
function makeBlobResponse(value4, type = 'image/png', status = 200) {
  return new Response(new Blob([String(value4 || '')], { type: type }), {
    status: status,
    headers: { 'Content-Type': type },
  });
}
function makeTextResponseWithHeaders(value5, value6 = {}, ok3 = 200) {
  const value7 = String(value5 || ''),
    value8 = Object.fromEntries(
      Object.entries(value6 || {}).map(([value9, value10]) => [
        String(value9 || '').toLowerCase(),
        String(value10 || ''),
      ]),
    );
  return {
    ok: ok3 >= 200 && ok3 < 0x12c,
    status: ok3,
    headers: {
      get(value11) {
        const value12 = String(value11 || '').toLowerCase();
        if (value12 === 'content-type') return 'text/plain';
        return value8[value12] || null;
      },
    },
    json: async () => JSON.parse(value7),
    text: async () => value7,
  };
}
function getProxyTaskApiUrl(value13) {
  const uRL2 = new URL(String(value13 || ''), 'http://localhost');
  return uRL2.searchParams.get('apiUrl') || '';
}
(test('aiImageApi: dreamina image2image with auto ratio does not forward ratio', async () => {
  const value14 = globalThis.fetch;
  try {
    installFetchMockForConfig({ providers: {} });
    const { clearApiConfig: clearApiConfig7 } = await import('./configApi.js');
    clearApiConfig7();
    const { buildGenerateImageRequest: buildGenerateImageRequest6 } = await import('./aiImageApi.js'),
      dom8 = await buildGenerateImageRequest6({
        prompt: 'p',
        provider: 'dreamina',
        model: 'dreamina/5.0',
        aspectRatio: 'auto',
        imageSize: '4K',
        inputUrls: ['/data/uploads/a.png'],
      });
    (assert.equal(dom8.url, '/api/v2/dreamina/image2image'),
      assert.ok(!Object.prototype.hasOwnProperty.call(dom8.body, 'ratio')),
      assert.equal(dom8.body.modelVersion, '5.0'),
      assert.equal(dom8.body.resolutionType, '4k'));
  } finally {
    globalThis.fetch = value14;
  }
}),
  test('aiImageApi: dreamina text2image with auto ratio forwards 1:1', async () => {
    const value15 = globalThis.fetch;
    try {
      installFetchMockForConfig({ providers: {} });
      const { clearApiConfig: clearApiConfig8 } = await import('./configApi.js');
      clearApiConfig8();
      const { buildGenerateImageRequest: buildGenerateImageRequest7 } = await import('./aiImageApi.js'),
        dom9 = await buildGenerateImageRequest7({
          prompt: 'p',
          provider: 'dreamina',
          model: 'dreamina/4.1',
          aspectRatio: 'auto',
          inputUrls: [],
        });
      (assert.equal(dom9.url, '/api/v2/dreamina/text2image'),
        assert.equal(dom9.body.ratio, '1:1'),
        assert.equal(dom9.body.modelVersion, '4.1'));
    } finally {
      globalThis.fetch = value15;
    }
  }),
  test('aiImageApi: grsai suppressAspectRatio=true 时不透传 aspectRatio', async () => {
    const value16 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: 'k_grsai' } },
      });
      const { clearApiConfig: clearApiConfig9 } = await import('./configApi.js');
      clearApiConfig9();
      const { buildGenerateImageRequest: buildGenerateImageRequest8 } = await import('./aiImageApi.js'),
        dom10 = await buildGenerateImageRequest8({
          prompt: 'p',
          provider: 'grsai',
          model: 'nano-banana-pro-vt',
          aspectRatio: '16:9',
          suppressAspectRatio: true,
          inputUrls: [],
        });
      (assert.equal(dom10.url, '/api/v2/proxy/image'),
        assert.equal(dom10.body.aspectRatio, undefined),
        assert.deepEqual(dom10.body.images, []),
        assert.equal(dom10.body.replyType, 'json'));
    } finally {
      globalThis.fetch = value16;
    }
  }),
  test('aiImageApi: grsai gpt-image-2 uses official /v1/api/generate body shape', async () => {
    const value17 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: 'k_grsai' } },
      });
      const { clearApiConfig: clearApiConfig10 } = await import('./configApi.js');
      clearApiConfig10();
      const { buildGenerateImageRequest: buildGenerateImageRequest9 } = await import('./aiImageApi.js'),
        dom11 = await buildGenerateImageRequest9({
          prompt: 'p',
          provider: 'grsai',
          model: 'gpt-image-2',
          mode: 'normal',
          aspectRatio: '9:21',
          imageSize: '4K',
          inputUrls: [],
        });
      (assert.equal(dom11.url, '/api/v2/proxy/image'),
        assert.equal(dom11.body.apiUrl, 'https://api.grsai.example.com/v1/api/generate'),
        assert.equal(dom11.body.model, 'gpt-image-2'),
        assert.deepEqual(dom11.body.images, []),
        assert.equal(dom11.body.replyType, 'json'),
        assert.equal(dom11.body.imageSize, undefined),
        assert.equal(dom11.body.aspectRatio, '832x1920'));
      const dom12 = await buildGenerateImageRequest9({
        prompt: 'p',
        provider: 'grsai',
        model: 'gpt-image-2',
        mode: 'vip',
        aspectRatio: '2:1',
        imageSize: '4K',
        inputUrls: [],
      });
      (assert.equal(dom12.body.apiUrl, 'https://api.grsai.example.com/v1/api/generate'),
        assert.equal(dom12.body.model, 'gpt-image-2-vip'),
        assert.deepEqual(dom12.body.images, []),
        assert.equal(dom12.body.replyType, 'json'),
        assert.equal(dom12.body.imageSize, undefined),
        assert.equal(dom12.body.aspectRatio, '3840x1920'));
    } finally {
      globalThis.fetch = value17;
    }
  }),
  test('aiImageApi: grsai missing manifest rejects instead of manual request fallback', async () => {
    const value18 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: 'k_grsai' } },
      });
      const { clearApiConfig: clearApiConfig11 } = await import('./configApi.js');
      clearApiConfig11();
      const { buildGenerateImageRequest: buildGenerateImageRequest10 } = await import('./aiImageApi.js');
      await assert.rejects(
        () =>
          buildGenerateImageRequest10({
            prompt: 'p',
            provider: 'grsai',
            model: 'grsai/unregistered-model',
            inputUrls: [],
          }),
        /GRSAI image model API manifest missing: grsai\/unregistered-model/,
      );
    } finally {
      globalThis.fetch = value18;
    }
  }),
  test('aiImageApi: grsai nano-banana manifest builds request', async () => {
    const value19 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: 'k_grsai' } },
      });
      const { clearApiConfig: clearApiConfig12 } = await import('./configApi.js');
      clearApiConfig12();
      const { buildGenerateImageRequest: buildGenerateImageRequest11 } = await import('./aiImageApi.js'),
        dom13 = await buildGenerateImageRequest11({
          prompt: 'p',
          provider: 'grsai',
          model: 'nano-banana-2',
          aspectRatio: '16:9',
          imageSize: '4K',
          batchSize: 2,
          inputUrls: [],
        });
      (assert.equal(dom13.url, '/api/v2/proxy/image'),
        assert.equal(dom13.body.apiUrl, 'https://api.grsai.example.com/v1/api/generate'),
        assert.equal(dom13.body.apiKey, 'k_grsai'),
        assert.equal(dom13.body.model, 'nano-banana-2'),
        assert.equal(dom13.body.prompt, 'p'),
        assert.deepEqual(dom13.body.images, []),
        assert.equal(dom13.body.replyType, 'json'),
        assert.equal(dom13.body.imageSize, '2K'),
        assert.equal(dom13.body.aspectRatio, '16:9'),
        assert.equal(dom13.body.batchSize, undefined),
        assert.equal(dom13.adapterTrace?.source, 'manifest'),
        assert.equal(dom13.adapterTrace?.executionId, 'grsai.model-api.nano-banana-2.v1'));
    } finally {
      globalThis.fetch = value19;
    }
  }),
  test('aiImageApi: grsai nano-banana request uses documented size and ratio enums', async () => {
    const value20 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: 'k_grsai' } },
      });
      const { clearApiConfig: clearApiConfig13 } = await import('./configApi.js');
      clearApiConfig13();
      const { buildGenerateImageRequest: buildGenerateImageRequest12 } = await import('./aiImageApi.js'),
        dom14 = await buildGenerateImageRequest12({
          prompt: 'p',
          provider: 'grsai',
          model: 'nano-banana',
          aspectRatio: '自适应',
          imageSize: '3K',
          inputUrls: [],
        });
      (assert.equal(dom14.body.imageSize, '2K'), assert.equal(dom14.body.aspectRatio, 'auto'));
      const dom15 = await buildGenerateImageRequest12({
        prompt: 'p',
        provider: 'grsai',
        model: 'nano-banana-pro',
        aspectRatio: '1:8',
        imageSize: 'bogus',
        inputUrls: [],
      });
      (assert.equal(dom15.body.imageSize, '2K'), assert.equal(dom15.body.aspectRatio, '9:16'));
      const dom16 = await buildGenerateImageRequest12({
        prompt: 'p',
        provider: 'grsai',
        model: 'nano-banana-pro',
        mode: 'vip',
        aspectRatio: '16:9',
        imageSize: '4K',
        inputUrls: [],
      });
      (assert.equal(dom16.body.model, 'nano-banana-pro-4k-vip'),
        assert.equal(dom16.body.imageSize, '4K'),
        assert.equal(dom16.body.aspectRatio, '16:9'));
      const dom17 = await buildGenerateImageRequest12({
        prompt: 'p',
        provider: 'grsai',
        model: 'nano-banana-2',
        aspectRatio: '1:8',
        imageSize: '4K',
        inputUrls: [],
      });
      (assert.equal(dom17.body.imageSize, '2K'), assert.equal(dom17.body.aspectRatio, '1:8'));
      const dom18 = await buildGenerateImageRequest12({
        prompt: 'p',
        provider: 'grsai',
        model: 'nano-banana-2',
        mode: 'cl',
        aspectRatio: '1:8',
        imageSize: '4K',
        inputUrls: [],
      });
      (assert.equal(dom18.body.model, 'nano-banana-2-4k-cl'),
        assert.equal(dom18.body.imageSize, '4K'),
        assert.equal(dom18.body.aspectRatio, '1:8'));
    } finally {
      globalThis.fetch = value20;
    }
  }),
  test('aiImageApi: apimart suppressAspectRatio=true 时不透传 size', async () => {
    const value21 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: clearApiConfig14 } = await import('./configApi.js');
      clearApiConfig14();
      const { buildGenerateImageRequest: buildGenerateImageRequest13 } = await import('./aiImageApi.js'),
        dom19 = await buildGenerateImageRequest13({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/nano-banana-pro',
          aspectRatio: '16:9',
          suppressAspectRatio: true,
          inputUrls: [],
        });
      (assert.equal(dom19.url, '/api/v2/proxy/image'), assert.equal(dom19.body.size, undefined));
    } finally {
      globalThis.fetch = value21;
    }
  }),
  test('aiImageApi: APIMart routeId domestic2 builds aishuch image endpoint', async () => {
    const value22 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { routeId: 'domestic2', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: clearApiConfig15 } = await import('./configApi.js');
      clearApiConfig15();
      const { buildGenerateImageRequest: buildGenerateImageRequest14 } = await import('./aiImageApi.js'),
        dom20 = await buildGenerateImageRequest14({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/nano-banana-2',
          aspectRatio: '16:9',
          inputUrls: [],
        });
      (assert.equal(dom20.url, '/api/v2/proxy/image'),
        assert.equal(dom20.body.apiUrl, 'https://api.aishuch.com/v1/images/generations'));
    } finally {
      globalThis.fetch = value22;
    }
  }),
  test('aiImageApi: apimart gpt-image-2 4K uses supported size values', async () => {
    const value23 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: clearApiConfig16 } = await import('./configApi.js');
      clearApiConfig16();
      const { buildGenerateImageRequest: buildGenerateImageRequest15 } = await import('./aiImageApi.js'),
        dom21 = await buildGenerateImageRequest15({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/gpt-image-2',
          aspectRatio: '9:21',
          imageSize: '4K',
          inputUrls: [],
        });
      (assert.equal(dom21.body.model, 'gpt-image-2'),
        assert.equal(dom21.body.resolution, '4k'),
        assert.equal(dom21.body.size, '9:21'),
        assert.equal(dom21.body.n, 1),
        assert.equal(dom21.body.quality, undefined),
        assert.equal(dom21.body.official_fallback, undefined));
      const dom22 = await buildGenerateImageRequest15({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/gpt-image-2',
        aspectRatio: '1:1',
        imageSize: '4K',
        inputUrls: [],
      });
      (assert.equal(dom22.body.resolution, '4k'),
        assert.equal(dom22.body.size, '16:9'),
        assert.equal(dom22.body.n, 1),
        assert.equal(dom22.body.quality, undefined));
      const dom23 = await buildGenerateImageRequest15({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/gpt-image-2',
        mode: 'official',
        aspectRatio: '2:1',
        imageSize: '4K',
        batchSize: 4,
        inputUrls: [],
      });
      (assert.equal(dom23.body.model, 'gpt-image-2-official'),
        assert.equal(dom23.body.resolution, '4k'),
        assert.equal(dom23.body.size, '2:1'),
        assert.equal(dom23.body.n, 1),
        assert.equal(dom23.body.quality, 'medium'),
        assert.equal(dom23.body.official_fallback, undefined));
      const dom24 = await buildGenerateImageRequest15({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/gpt-image-2',
        mode: 'official',
        quality: 'high',
        aspectRatio: '2:1',
        imageSize: '4K',
        inputUrls: [],
      });
      (assert.equal(dom24.body.model, 'gpt-image-2-official'), assert.equal(dom24.body.quality, 'high'));
    } finally {
      globalThis.fetch = value23;
    }
  }),
  test('aiImageApi: apimart qwen-image-2.0 uses documented model, size, resolution, and n', async () => {
    const value24 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: clearApiConfig17 } = await import('./configApi.js');
      clearApiConfig17();
      const { buildGenerateImageRequest: buildGenerateImageRequest16 } = await import('./aiImageApi.js'),
        dom25 = await buildGenerateImageRequest16({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/qwen-image-2.0',
          mode: 'standard',
          aspectRatio: '16:9',
          imageSize: '2K',
          inputUrls: [],
        });
      (assert.equal(dom25.body.model, 'qwen-image-2.0'),
        assert.equal(dom25.body.resolution, '2K'),
        assert.equal(dom25.body.size, '16:9'),
        assert.equal(dom25.body.n, 1),
        assert.equal(dom25.body.official_fallback, undefined),
        assert.equal(dom25.adapterTrace?.executionId, 'apimart.model-api.qwen-image-2.v1'));
      const dom26 = await buildGenerateImageRequest16({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/qwen-image-2.0',
        mode: 'pro',
        aspectRatio: '5:4',
        imageSize: '4K',
        batchSize: 9,
        inputUrls: [],
      });
      (assert.equal(dom26.body.model, 'qwen-image-2.0-pro'),
        assert.equal(dom26.body.resolution, '1K'),
        assert.equal(dom26.body.size, '4:3'),
        assert.equal(dom26.body.n, 6));
      const dom27 = await buildGenerateImageRequest16({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/qwen-image-2.0',
        mode: 'standard',
        aspectRatio: '自适应',
        resolvedRatioLabel: '16:9',
        imageSize: '2K',
        batchSize: 2,
        inputUrls: [],
      });
      (assert.equal(dom27.body.model, 'qwen-image-2.0'),
        assert.equal(dom27.body.resolution, '2K'),
        assert.equal(dom27.body.size, '16:9'),
        assert.notEqual(dom27.body.size, '自适应'),
        assert.notEqual(dom27.body.size, 'auto'),
        assert.equal(dom27.body.n, 2));
    } finally {
      globalThis.fetch = value24;
    }
  }),
  test('aiImageApi: apimart z-image-turbo uses documented body without n', async () => {
    const value25 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: clearApiConfig18 } = await import('./configApi.js');
      clearApiConfig18();
      const { buildGenerateImageRequest: buildGenerateImageRequest17 } = await import('./aiImageApi.js'),
        dom28 = await buildGenerateImageRequest17({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/z-image-turbo',
          aspectRatio: '16:9',
          imageSize: '2K',
          inputUrls: [],
        });
      (assert.equal(dom28.body.model, 'z-image-turbo'),
        assert.equal(dom28.body.resolution, '2K'),
        assert.equal(dom28.body.size, '16:9'),
        assert.equal(dom28.body.prompt_extend, false),
        assert.equal(dom28.body.n, undefined),
        assert.equal(dom28.body.image_urls, undefined),
        assert.equal(dom28.adapterTrace?.executionId, 'apimart.model-api.z-image-turbo.v1'));
      const dom29 = await buildGenerateImageRequest17({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/z-image-turbo',
        aspectRatio: '5:4',
        imageSize: '4K',
        batchSize: 4,
        prompt_extend: 'true',
        inputUrls: ['https://img.example.com/ref.png'],
      });
      (assert.equal(dom29.body.model, 'z-image-turbo'),
        assert.equal(dom29.body.resolution, '1K'),
        assert.equal(dom29.body.size, '4:3'),
        assert.equal(dom29.body.prompt_extend, true),
        assert.equal(dom29.body.n, undefined),
        assert.equal(dom29.body.image_urls, undefined));
      const dom30 = await buildGenerateImageRequest17({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/z-image-turbo',
        aspectRatio: '自适应',
        resolvedRatioLabel: '16:9',
        imageSize: '2K',
        batchSize: 4,
        inputUrls: [],
      });
      (assert.equal(dom30.body.size, '16:9'),
        assert.notEqual(dom30.body.size, '自适应'),
        assert.notEqual(dom30.body.size, 'auto'),
        assert.equal(dom30.body.n, undefined));
    } finally {
      globalThis.fetch = value25;
    }
  }),
  test('aiImageApi: apimart wan2.7-image uses documented model, inputs, and n', async () => {
    const value26 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: clearApiConfig19 } = await import('./configApi.js');
      clearApiConfig19();
      const { buildGenerateImageRequest: buildGenerateImageRequest18 } = await import('./aiImageApi.js'),
        dom31 = await buildGenerateImageRequest18({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/wan2.7-image',
          mode: 'standard',
          aspectRatio: '16:9',
          imageSize: '4K',
          batchSize: 4,
          inputUrls: [],
        });
      (assert.equal(dom31.body.model, 'wan2.7-image'),
        assert.equal(dom31.body.resolution, '2K'),
        assert.equal(dom31.body.size, '16:9'),
        assert.equal(dom31.body.n, 4),
        assert.equal(dom31.body.thinking_mode, true),
        assert.equal(dom31.body.image_urls, undefined),
        assert.equal(dom31.adapterTrace?.executionId, 'apimart.model-api.wan2-7-image.v1'));
      const dom32 = await buildGenerateImageRequest18({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/wan2.7-image',
        mode: 'pro',
        aspectRatio: '5:4',
        imageSize: '4K',
        thinking_mode: false,
        batchSize: 9,
        inputUrls: [],
      });
      (assert.equal(dom32.body.model, 'wan2.7-image-pro'),
        assert.equal(dom32.body.resolution, '4K'),
        assert.equal(dom32.body.size, '4:3'),
        assert.equal(dom32.body.n, 4),
        assert.equal(dom32.body.thinking_mode, false));
      const dom33 = await buildGenerateImageRequest18({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/wan2.7-image',
        mode: 'pro',
        aspectRatio: '自适应',
        resolvedRatioLabel: '9:16',
        imageSize: '4K',
        batchSize: 2,
        inputUrls: ['https://cdn.apimart.ai/ref-a.png', 'https://cdn.apimart.ai/ref-b.png'],
      });
      (assert.equal(dom33.body.model, 'wan2.7-image-pro'),
        assert.equal(dom33.body.resolution, '2K'),
        assert.equal(dom33.body.size, '9:16'),
        assert.equal(dom33.body.n, 2),
        assert.equal(dom33.body.thinking_mode, true),
        assert.deepEqual(dom33.body.image_urls, [
          'https://cdn.apimart.ai/ref-a.png',
          'https://cdn.apimart.ai/ref-b.png',
        ]),
        assert.notEqual(dom33.body.size, '自适应'),
        assert.notEqual(dom33.body.size, 'auto'));
    } finally {
      globalThis.fetch = value26;
    }
  }),
  test('aiImageApi: apimart nano-banana-2 supports extra size ratios', async () => {
    const value27 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: clearApiConfig20 } = await import('./configApi.js');
      clearApiConfig20();
      const { buildGenerateImageRequest: buildGenerateImageRequest19 } = await import('./aiImageApi.js'),
        dom34 = await buildGenerateImageRequest19({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/nano-banana-2',
          aspectRatio: '1:8',
          imageSize: '2K',
          inputUrls: [],
        });
      (assert.equal(dom34.body.model, 'gemini-3.1-flash-image-preview'),
        assert.equal(dom34.body.resolution, '2K'),
        assert.equal(dom34.body.size, '1:8'),
        assert.equal(dom34.body.n, 1),
        assert.equal(dom34.body.google_search, false),
        assert.equal(dom34.body.google_image_search, false),
        assert.equal(dom34.body.official_fallback, undefined),
        assert.equal(dom34.adapterTrace?.source, 'manifest'),
        assert.equal(dom34.adapterTrace?.executionId, 'apimart.model-api.nano-banana-2.v1'));
      const dom35 = await buildGenerateImageRequest19({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/nano-banana-2',
        mode: 'official',
        aspectRatio: '16:9',
        imageSize: '4K',
        batchSize: 4,
        google_search: true,
        google_image_search: true,
        inputUrls: [],
      });
      (assert.equal(dom35.body.model, 'gemini-3.1-flash-image-preview-official'),
        assert.equal(dom35.body.resolution, '4K'),
        assert.equal(dom35.body.size, '16:9'),
        assert.equal(dom35.body.n, 1),
        assert.equal(dom35.body.google_search, true),
        assert.equal(dom35.body.google_image_search, true),
        assert.equal(dom35.body.official_fallback, undefined));
      const dom36 = await buildGenerateImageRequest19({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/nano-banana-2',
        aspectRatio: '1:1',
        imageSize: '2K',
        google_search: false,
        google_image_search: true,
        inputUrls: [],
      });
      (assert.equal(dom36.body.google_search, true), assert.equal(dom36.body.google_image_search, true));
      const dom37 = await buildGenerateImageRequest19({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/nano-banana-2',
        aspectRatio: '1:1',
        imageSize: '0.5K',
        inputUrls: [],
      });
      (assert.equal(dom37.body.resolution, '2K'), assert.equal(dom37.body.size, '1:1'));
      const dom38 = await buildGenerateImageRequest19({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/nano-banana-2',
        aspectRatio: '1:1',
        imageSize: '3K',
        inputUrls: [],
      });
      assert.equal(dom38.body.resolution, '2K');
    } finally {
      globalThis.fetch = value27;
    }
  }),
  test('aiImageApi: apimart nano-banana-pro supports mode and fixed n=1', async () => {
    const value28 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: clearApiConfig21 } = await import('./configApi.js');
      clearApiConfig21();
      const { buildGenerateImageRequest: buildGenerateImageRequest20 } = await import('./aiImageApi.js'),
        dom39 = await buildGenerateImageRequest20({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/nano-banana-pro',
          mode: 'official',
          aspectRatio: '21:9',
          imageSize: '4K',
          batchSize: 4,
          inputUrls: [],
        });
      (assert.equal(dom39.body.model, 'gemini-3-pro-image-preview-official'),
        assert.equal(dom39.body.resolution, '4K'),
        assert.equal(dom39.body.size, '21:9'),
        assert.equal(dom39.body.n, 1),
        assert.equal(dom39.body.official_fallback, undefined),
        assert.equal(dom39.adapterTrace?.executionId, 'apimart.model-api.nano-banana-pro.v1'));
      const dom40 = await buildGenerateImageRequest20({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/nano-banana-pro',
        aspectRatio: '1:1',
        imageSize: '3K',
        batchSize: 9,
        inputUrls: [],
      });
      (assert.equal(dom40.body.model, 'gemini-3-pro-image-preview'),
        assert.equal(dom40.body.resolution, '2K'),
        assert.equal(dom40.body.n, 1));
    } finally {
      globalThis.fetch = value28;
    }
  }),
  test('aiImageApi: apimart nano-banana supports official mode and 1K-only resolution', async () => {
    const value29 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: clearApiConfig22 } = await import('./configApi.js');
      clearApiConfig22();
      const { buildGenerateImageRequest: buildGenerateImageRequest21 } = await import('./aiImageApi.js'),
        dom41 = await buildGenerateImageRequest21({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/nano-banana-dot',
          mode: 'official',
          aspectRatio: '21:9',
          imageSize: '4K',
          batchSize: 4,
          inputUrls: [],
        });
      (assert.equal(dom41.body.model, 'gemini-2.5-flash-image-preview-official'),
        assert.equal(dom41.body.resolution, '1K'),
        assert.equal(dom41.body.size, '21:9'),
        assert.equal(dom41.body.n, 1),
        assert.equal(dom41.body.official_fallback, undefined),
        assert.equal(dom41.adapterTrace?.executionId, 'apimart.model-api.nano-banana-dot.v1'));
      const dom42 = await buildGenerateImageRequest21({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/nano-banana-dot',
        aspectRatio: '1:1',
        imageSize: '3K',
        batchSize: 9,
        inputUrls: [],
      });
      (assert.equal(dom42.body.model, 'gemini-2.5-flash-image-preview'),
        assert.equal(dom42.body.resolution, '1K'),
        assert.equal(dom42.body.n, 1));
    } finally {
      globalThis.fetch = value29;
    }
  }),
  test('aiImageApi: apimart seedream request uses documented size/resolution', async () => {
    const value30 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: clearApiConfig23 } = await import('./configApi.js');
      clearApiConfig23();
      const { buildGenerateImageRequest: buildGenerateImageRequest22 } = await import('./aiImageApi.js'),
        dom43 = await buildGenerateImageRequest22({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/seedream-4.5',
          aspectRatio: '16:9',
          imageSize: '2K',
          batchSize: 4,
          inputUrls: [],
        });
      (assert.equal(dom43.url, '/api/v2/proxy/image'),
        assert.equal(dom43.body.model, 'doubao-seedream-4.5'),
        assert.equal(dom43.body.size, '16:9'),
        assert.equal(dom43.body.resolution, '2K'),
        assert.equal(dom43.body.n, 1),
        assert.equal(dom43.body.width, undefined),
        assert.equal(dom43.body.height, undefined));
      const dom44 = await buildGenerateImageRequest22({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/seedream-4.0',
        aspectRatio: '9:21',
        imageSize: '1K',
        batchSize: 4,
        inputUrls: [],
      });
      (assert.equal(dom44.body.model, 'doubao-seedream-4.0'),
        assert.equal(dom44.body.size, '9:21'),
        assert.equal(dom44.body.resolution, '1K'),
        assert.equal(dom44.body.n, 1));
      const dom45 = await buildGenerateImageRequest22({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/seedream-5.0-lite',
        aspectRatio: '21:9',
        imageSize: '3K',
        batchSize: 4,
        inputUrls: [],
      });
      (assert.equal(dom45.body.model, 'doubao-seedream-5.0-lite'),
        assert.equal(dom45.body.size, '21:9'),
        assert.equal(dom45.body.resolution, '3K'),
        assert.equal(dom45.body.n, 1));
    } finally {
      globalThis.fetch = value30;
    }
  }),
  test('aiImageApi: runninghub-model branch uses proxy/image', async () => {
    const value31 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: clearApiConfig24 } = await import('./configApi.js');
      clearApiConfig24();
      const { buildGenerateImageRequest: buildGenerateImageRequest23 } = await import('./aiImageApi.js'),
        dom46 = await buildGenerateImageRequest23({
          prompt: 'p',
          model: 'runninghub-model/rhart-image-v1',
          inputUrls: [],
        });
      (assert.equal(dom46.url, '/api/v2/proxy/image'),
        assert.ok(String(dom46.body.apiUrl).includes('/openapi/v2/rhart-image-v1/')),
        assert.equal(dom46.adapterTrace?.source, 'manifest'),
        assert.equal(dom46.adapterTrace?.executionId, 'runninghub.model-api.rhart-image-v1.v1'));
    } finally {
      globalThis.fetch = value31;
    }
  }),
  test('aiImageApi: runninghub-model gpt-image-2 无参考图走 text-to-image 且透传 resolution', async () => {
    const value32 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: clearApiConfig25 } = await import('./configApi.js');
      clearApiConfig25();
      const { buildGenerateImageRequest: buildGenerateImageRequest24 } = await import('./aiImageApi.js'),
        dom47 = await buildGenerateImageRequest24({
          prompt: 'p',
          model: 'runninghub-model/rhart-image-g-2',
          imageSize: '1K',
          inputUrls: [],
        });
      (assert.equal(dom47.url, '/api/v2/proxy/image'),
        assert.equal(dom47.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/rhart-image-g-2/text-to-image'),
        assert.equal(dom47.body.resolution, '1k'),
        assert.equal(dom47.body.imageUrls, undefined),
        assert.equal(dom47.adapterTrace?.source, 'manifest'));
    } finally {
      globalThis.fetch = value32;
    }
  }),
  test('aiImageApi: runninghub-model grok 4.2 official route uses official endpoints', async () => {
    const value33 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: clearApiConfig26 } = await import('./configApi.js');
      clearApiConfig26();
      const { buildGenerateImageRequest: buildGenerateImageRequest25 } = await import('./aiImageApi.js'),
        dom48 = await buildGenerateImageRequest25({
          prompt: 'p',
          model: 'runninghub-model/rhart-image-g',
          rhModelRoute: 'official',
          aspectRatio: '16:9',
          inputUrls: [],
        });
      (assert.equal(dom48.url, '/api/v2/proxy/image'),
        assert.equal(
          dom48.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/rhart-image-x-official/text-to-image',
        ),
        assert.equal(dom48.body.aspectRatio, '16:9'),
        assert.equal(dom48.body.outputFormat, undefined),
        assert.equal(dom48.body.resolution, undefined),
        assert.equal(dom48.body.model, undefined));
      const dom49 = await buildGenerateImageRequest25({
        prompt: 'p',
        model: 'runninghub-model/rhart-image-g',
        rhModelRoute: 'official',
        aspectRatio: '9:16',
        inputUrlsBySlot: { imageUrl: 'https://www.runninghub.cn/input-x.png' },
      });
      (assert.equal(dom49.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/rhart-image-x-official/edit'),
        assert.equal(dom49.body.image, 'https://www.runninghub.cn/input-x.png'),
        assert.equal(dom49.body.imageUrl, undefined),
        assert.equal(dom49.body.aspectRatio, undefined),
        assert.equal(dom49.body.outputFormat, undefined));
    } finally {
      globalThis.fetch = value33;
    }
  }),
  test('aiImageApi: runninghub-model manifest image-to-image attaches uploaded URLs', async () => {
    const value34 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: clearApiConfig27 } = await import('./configApi.js');
      clearApiConfig27();
      const { buildGenerateImageRequest: buildGenerateImageRequest26 } = await import('./aiImageApi.js'),
        dom50 = await buildGenerateImageRequest26({
          prompt: 'p',
          model: 'runninghub-model/rhart-image-n-g31-flash',
          inputUrls: ['https://www.runninghub.cn/input.png'],
          imageSize: '2K',
          aspectRatio: '1:4',
        });
      (assert.equal(dom50.url, '/api/v2/proxy/image'),
        assert.equal(
          dom50.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/rhart-image-n-g31-flash/image-to-image',
        ),
        assert.deepEqual(dom50.body.imageUrls, ['https://www.runninghub.cn/input.png']),
        assert.equal(dom50.body.apiKey, 'k_rhm'),
        assert.equal(dom50.body.resolution, '2k'),
        assert.equal(dom50.body.aspectRatio, '1:4'),
        assert.equal(dom50.adapterTrace?.source, 'manifest'),
        assert.equal(dom50.adapterTrace?.executionId, 'runninghub.model-api.rhart-image-n-g31-flash.v1'));
    } finally {
      globalThis.fetch = value34;
    }
  }),
  test('aiImageApi: runninghub-model youchuan uses named slot request body', async () => {
    const value35 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: clearApiConfig28 } = await import('./configApi.js');
      clearApiConfig28();
      const { buildGenerateImageRequest: buildGenerateImageRequest27 } = await import('./aiImageApi.js'),
        dom51 = await buildGenerateImageRequest27({
          prompt: 'p',
          model: 'runninghub-model/youchuan-v81',
          inputUrlsBySlot: {
            imageUrl: 'https://www.runninghub.cn/main.png',
            sref: 'https://www.runninghub.cn/style.png',
          },
          aspectRatio: '3:4',
          quality: '4',
          iw: '2',
          sw: '300',
          hd: 'true',
        });
      (assert.equal(dom51.url, '/api/v2/proxy/image'),
        assert.equal(dom51.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v81'),
        assert.equal(dom51.body.apiKey, 'k_rhm'),
        assert.equal(dom51.body.resolution, undefined),
        assert.equal(dom51.body.imageUrls, undefined),
        assert.equal(dom51.body.imageUrl, 'https://www.runninghub.cn/main.png'),
        assert.equal(dom51.body.sref, 'https://www.runninghub.cn/style.png'),
        assert.equal(dom51.body.quality, '4'),
        assert.equal(dom51.body.iw, 2),
        assert.equal(dom51.body.sw, 0x12c),
        assert.equal(dom51.body.hd, true));
      const dom52 = await buildGenerateImageRequest27({
        prompt: 'p',
        model: 'runninghub-model/youchuan-v7',
        inputUrlsBySlot: {
          imageUrl: 'https://www.runninghub.cn/v7-main.png',
          sref: 'https://www.runninghub.cn/v7-style.png',
        },
        aspectRatio: '16:9',
        quality: '2',
        iw: '2',
        sw: '250',
        sv: '4',
        ow: '150',
        stop: '90',
        cw: '80',
        hd: 'true',
        raw: 'true',
        tile: 'false',
      });
      (assert.equal(dom52.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v7'),
        assert.equal(dom52.body.resolution, undefined),
        assert.equal(dom52.body.imageUrls, undefined),
        assert.equal(dom52.body.imageUrl, 'https://www.runninghub.cn/v7-main.png'),
        assert.equal(dom52.body.sref, 'https://www.runninghub.cn/v7-style.png'),
        assert.equal(dom52.body.cref, undefined),
        assert.equal(dom52.body.cw, undefined),
        assert.equal(dom52.body.stop, undefined),
        assert.equal(dom52.body.hd, undefined),
        assert.equal(dom52.body.quality, '2'),
        assert.equal(dom52.body.iw, 2),
        assert.equal(dom52.body.sw, 250),
        assert.equal(dom52.body.sv, 4),
        assert.equal(dom52.body.ow, 150),
        assert.equal(dom52.body.raw, true),
        assert.equal(dom52.body.tile, false));
    } finally {
      globalThis.fetch = value35;
    }
  }),
  test('aiImageApi: runninghub-model local input upload uses modelApiKey', async () => {
    const value36 = globalThis.fetch;
    try {
      globalThis.fetch = async (value37, response = {}) => {
        const value38 = String(value37);
        if (value38 === '/api/config')
          return makeJsonResponse({
            providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' } },
          });
        if (value38 === '/local/rh-input.png') return makeBlobResponse('rh-local-image');
        if (value38.startsWith('/api/v2/proxy/upload?'))
          return (
            assert.equal(response.headers?.Authorization, 'Bearer k_rhm'),
            makeJsonResponse({
              code: 0,
              data: { download_url: 'https://www.runninghub.cn/uploaded/rh-input.png' },
            })
          );
        throw new Error('unexpected fetch url: ' + value38);
      };
      const { clearApiConfig: clearApiConfig29 } = await import('./configApi.js');
      clearApiConfig29();
      const { buildGenerateImageRequest: buildGenerateImageRequest28 } = await import('./aiImageApi.js'),
        dom53 = await buildGenerateImageRequest28({
          prompt: 'p',
          model: 'runninghub-model/rhart-image-n-g31-flash',
          inputUrls: ['/local/rh-input.png'],
          imageSize: '2K',
          aspectRatio: '1:1',
        });
      (assert.equal(dom53.body.apiKey, 'k_rhm'),
        assert.deepEqual(dom53.body.imageUrls, ['https://www.runninghub.cn/uploaded/rh-input.png']));
    } finally {
      globalThis.fetch = value36;
    }
  }),
  test('aiImageApi: runninghub-model local input upload failure reports provider error', async () => {
    const value39 = globalThis.fetch;
    try {
      globalThis.fetch = async (value40, response2 = {}) => {
        const value41 = String(value40);
        if (value41 === '/api/config')
          return makeJsonResponse({
            providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' } },
          });
        if (value41 === '/local/rh-bad-key.png') return makeBlobResponse('rh-local-image');
        if (value41.startsWith('/api/v2/proxy/upload?'))
          return (
            assert.equal(response2.headers?.Authorization, 'Bearer k_rhm'),
            makeJsonResponse({ code: 0x191, errorMessage: 'invalid model api key' })
          );
        throw new Error('unexpected fetch url: ' + value41);
      };
      const { clearApiConfig: clearApiConfig30 } = await import('./configApi.js');
      clearApiConfig30();
      const { buildGenerateImageRequest: buildGenerateImageRequest29 } = await import('./aiImageApi.js');
      await assert.rejects(
        () =>
          buildGenerateImageRequest29({
            prompt: 'p',
            model: 'runninghub-model/rhart-image-n-g31-flash',
            inputUrls: ['/local/rh-bad-key.png'],
            imageSize: '2K',
            aspectRatio: '1:1',
          }),
        /RunningHUB .*invalid model api key.*401/,
      );
    } finally {
      globalThis.fetch = value39;
    }
  }),
  test('aiImageApi: runninghub-model does not fall back to workflow apiKey', async () => {
    const value42 = globalThis.fetch;
    try {
      globalThis.fetch = async (value43) => {
        const value44 = String(value43);
        if (value44 === '/api/config')
          return makeJsonResponse({
            providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh_workflow_only' } },
          });
        throw new Error('unexpected fetch url: ' + value44);
      };
      const { clearApiConfig: clearApiConfig31 } = await import('./configApi.js');
      clearApiConfig31();
      const { buildGenerateImageRequest: buildGenerateImageRequest30 } = await import('./aiImageApi.js');
      await assert.rejects(
        () =>
          buildGenerateImageRequest30({
            prompt: 'p',
            model: 'runninghub-model/rhart-image-n-g31-flash',
            inputUrls: ['https://www.runninghub.cn/input.png'],
            imageSize: '2K',
            aspectRatio: '1:1',
          }),
        /API Key/,
      );
    } finally {
      globalThis.fetch = value42;
    }
  }),
  test('aiImageApi: runninghub-model gpt-image-2 official 无参考图走官方 text-to-image', async () => {
    const value45 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: clearApiConfig32 } = await import('./configApi.js');
      clearApiConfig32();
      const { buildGenerateImageRequest: buildGenerateImageRequest31 } = await import('./aiImageApi.js'),
        dom54 = await buildGenerateImageRequest31({
          prompt: 'p',
          model: 'runninghub-model/rhart-image-g-2-official',
          aspectRatio: '2：1',
          imageSize: '4K',
          inputUrls: [],
        });
      (assert.equal(dom54.url, '/api/v2/proxy/image'),
        assert.equal(
          dom54.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/rhart-image-g-2-official/text-to-image',
        ),
        assert.equal(dom54.body.aspectRatio, '2:1'),
        assert.equal(dom54.body.resolution, '4k'),
        assert.equal(dom54.body.quality, 'medium'),
        assert.equal(dom54.body.imageUrls, undefined),
        assert.equal(dom54.adapterTrace?.source, 'manifest'));
      const dom55 = await buildGenerateImageRequest31({
        prompt: 'p',
        model: 'runninghub-model/rhart-image-g-2',
        rhModelRoute: 'official',
        aspectRatio: '16:9',
        imageSize: '2K',
        inputUrls: [],
      });
      (assert.equal(
        dom55.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-image-g-2-official/text-to-image',
      ),
        assert.equal(dom55.body.aspectRatio, '16:9'),
        assert.equal(dom55.body.resolution, '2k'),
        assert.equal(dom55.body.quality, 'medium'));
    } finally {
      globalThis.fetch = value45;
    }
  }),
  test('aiImageApi: runninghub-model suppressAspectRatio=true 时不透传 aspectRatio', async () => {
    const value46 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' } },
      });
      const { clearApiConfig: clearApiConfig33 } = await import('./configApi.js');
      clearApiConfig33();
      const { buildGenerateImageRequest: buildGenerateImageRequest32 } = await import('./aiImageApi.js'),
        dom56 = await buildGenerateImageRequest32({
          prompt: 'p',
          model: 'runninghub-model/rhart-image-v1',
          aspectRatio: '16:9',
          suppressAspectRatio: true,
          inputUrls: [],
        });
      (assert.equal(dom56.url, '/api/v2/proxy/image'),
        assert.equal(dom56.body.aspectRatio, undefined),
        assert.equal(dom56.adapterTrace?.source, 'manifest'));
    } finally {
      globalThis.fetch = value46;
    }
  }),
  test('aiImageApi: runninghub-model missing manifest rejects instead of legacy fallback', async () => {
    const value47 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' } },
      });
      const { clearApiConfig: clearApiConfig34 } = await import('./configApi.js');
      clearApiConfig34();
      const { buildGenerateImageRequest: buildGenerateImageRequest33 } = await import('./aiImageApi.js');
      await assert.rejects(
        () =>
          buildGenerateImageRequest33({
            prompt: 'p',
            model: 'runninghub-model/unregistered-model',
            inputUrls: [],
          }),
        /RunningHub model API manifest missing/,
      );
    } finally {
      globalThis.fetch = value47;
    }
  }),
  test('aiImageApi: runninghubwf image workflow without manifest rejects', async () => {
    const value48 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' } },
      });
      const { clearApiConfig: clearApiConfig35 } = await import('./configApi.js');
      clearApiConfig35();
      const { buildGenerateImageRequest: buildGenerateImageRequest34 } = await import('./aiImageApi.js');
      await assert.rejects(
        () =>
          buildGenerateImageRequest34({
            prompt: 'p',
            model: 'runninghub/123',
            inputUrls: [],
            rhInstanceType: 'default',
            cameraAngle: { rotation: 0, pitch: 0, scale: 0.5 },
          }),
        /workflow manifest missing/,
      );
    } finally {
      globalThis.fetch = value48;
    }
  }),
  test('aiImageApi: RunningHub ai-app 请求用 header 携带 installId 且不污染远端 body', async () => {
    const value49 = globalThis.fetch,
      value50 = globalThis.window,
      list2 = [];
    try {
      ((globalThis.window = {
        __aicInstallId: 'install-image-vip',
        currentProjectId: 'proj-test',
        location: { href: 'http://localhost/' },
      }),
        (globalThis.fetch = async (value51, headers = {}) => {
          const value52 = String(value51);
          if (value52 === '/api/config')
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: 'https://www.runninghub.cn', apiKey: 'k_wf', modelApiKey: 'k_model' },
              },
            });
          if (value52 === '/api/v2/proxy/image') {
            const body = JSON.parse(String(headers.body || '{}'));
            list2.push({ headers: headers.headers || {}, body: body });
            if (String(body.apiUrl || '').includes('/openapi/v2/run/ai-app/'))
              return makeJsonResponse({ code: 0, data: { taskId: 'rh-image-vip-1' } });
            return makeJsonResponse({
              code: 0,
              data: { status: 'SUCCESS', results: [{ url: 'https://img.example.com/rh-image-vip.png' }] },
            });
          }
          if (value52 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/rh-image-vip.png' });
          throw new Error('unexpected fetch url: ' + value52);
        }));
      const { clearApiConfig: clearApiConfig36 } = await import('./configApi.js');
      clearApiConfig36();
      const { generateImage: generateImage2 } = await import('./aiImageApi.js'),
        value53 = await generateImage2({
          provider: 'runninghubwf',
          model: 'runninghub/1994718111704158209',
          prompt: 'portrait',
          inputUrls: ['https://www.runninghub.cn/ref.png'],
          installId: 'install-image-vip',
        });
      (assert.equal(value53.localPath, 'output/rh-image-vip.png'),
        assert.equal(list2[0]?.headers?.['X-AIC-Install-Id'], 'install-image-vip'),
        assert.equal(list2[0]?.body?.installId, undefined),
        assert.equal(
          list2[0]?.body?.apiUrl,
          'https://www.runninghub.cn/openapi/v2/run/ai-app/1994718111704158209',
        ));
    } finally {
      ((globalThis.fetch = value49), (globalThis.window = value50));
    }
  }),
  test('aiImageApi: RunningHub modelApi 请求用 header 携带 installId 且不污染厂商 body', async () => {
    const value54 = globalThis.fetch,
      value55 = globalThis.window,
      list3 = [];
    try {
      ((globalThis.window = {
        __aicInstallId: 'install-model-api',
        currentProjectId: 'proj-test',
        location: { href: 'http://localhost/' },
      }),
        (globalThis.fetch = async (value56, headers2 = {}) => {
          const value57 = String(value56);
          if (value57 === '/api/config')
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: 'https://www.runninghub.cn', apiKey: 'k_wf', modelApiKey: 'k_model' },
              },
            });
          if (value57 === '/api/v2/proxy/image') {
            const body2 = JSON.parse(String(headers2.body || '{}'));
            return (
              list3.push({ headers: headers2.headers || {}, body: body2 }),
              makeJsonResponse({
                taskId: 'rh-model-api-1',
                status: 'SUCCESS',
                results: [{ url: 'https://img.example.com/rh-model-api.png' }],
              })
            );
          }
          if (value57 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/rh-model-api.png' });
          throw new Error('unexpected fetch url: ' + value57);
        }));
      const { clearApiConfig: clearApiConfig37 } = await import('./configApi.js');
      clearApiConfig37();
      const { generateImage: generateImage3 } = await import('./aiImageApi.js'),
        value58 = await generateImage3({
          provider: 'runninghub',
          model: 'runninghub-model/youchuan-v81',
          prompt: 'portrait',
          aspectRatio: '16:9',
          quality: '1',
        });
      (assert.equal(value58.localPath, 'output/rh-model-api.png'),
        assert.equal(list3[0]?.headers?.['X-AIC-Install-Id'], 'install-model-api'),
        assert.equal(list3[0]?.body?.installId, undefined),
        assert.equal(
          list3[0]?.body?.apiUrl,
          'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v81',
        ));
    } finally {
      ((globalThis.fetch = value54), (globalThis.window = value55));
    }
  }),
  test('aiImageApi: RunningHub ai-app preserves 19-digit numeric taskId for persistence and query', async () => {
    const value59 = globalThis.fetch,
      handler = globalThis.setTimeout,
      value60 = globalThis.window,
      list4 = [],
      list5 = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value61, value62, ...args) =>
          handler(value61, Number(value62) > 0x1388 ? Number(value62) : 0, ...args)),
        (globalThis.fetch = async (value63, dom57 = {}) => {
          const value64 = String(value63);
          if (value64 === '/api/config')
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: 'https://www.runninghub.cn', apiKey: 'k_wf', modelApiKey: 'k_model' },
              },
            });
          if (value64 === '/api/v2/proxy/image') {
            const value65 = JSON.parse(String(dom57.body || '{}')),
              list6 = String(value65.apiUrl || '');
            if (list6.includes('/openapi/v2/run/ai-app/2050306122774532097'))
              return makeTextResponse('{"code":0,"data":{"taskId":2050557211150823426}}');
            if (list6.includes('/openapi/v2/query'))
              return (
                list5.push(String(value65.taskId || '')),
                makeJsonResponse({
                  code: 0,
                  data: {
                    status: 'SUCCESS',
                    results: [{ url: 'https://img.example.com/rh-qwen-final.png' }],
                  },
                })
              );
          }
          if (value64 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/rh-qwen-final.png' });
          throw new Error('unexpected fetch url: ' + value64);
        }));
      const { clearApiConfig: clearApiConfig38 } = await import('./configApi.js');
      clearApiConfig38();
      const { generateImage: generateImage4 } = await import('./aiImageApi.js'),
        value66 = await generateImage4(
          {
            provider: 'runninghubwf',
            model: 'runninghub/2050306122774532097',
            prompt: 'edit',
            inputUrls: ['https://www.runninghub.cn/input.png'],
            imageSize: '1K',
            aspectRatio: '1:1',
          },
          { onTaskMeta: (value67) => list4.push(value67) },
        );
      (assert.equal(list4.length, 1),
        assert.equal(list4[0].taskId, '2050557211150823426'),
        assert.equal(list5[0], '2050557211150823426'),
        assert.equal(value66.localPath, 'output/rh-qwen-final.png'));
    } finally {
      ((globalThis.fetch = value59), (globalThis.setTimeout = handler), (globalThis.window = value60));
    }
  }),
  test('aiImageApi: runninghub-model async task calls onTaskMeta and supports resume', async () => {
    const value68 = globalThis.fetch,
      handler2 = globalThis.setTimeout,
      value69 = globalThis.window,
      list7 = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value70, value71, ...args2) =>
          handler2(value70, Number(value71) > 0x1388 ? Number(value71) : 0, ...args2)),
        (globalThis.fetch = async (value72, dom58 = {}) => {
          const value73 = String(value72);
          if (value73 === '/api/config')
            return makeJsonResponse({
              providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' } },
            });
          if (value73 === '/api/v2/proxy/image') {
            const value74 = JSON.parse(String(dom58.body || '{}')),
              list8 = String(value74.apiUrl || '');
            if (list8.includes('/openapi/v2/query'))
              return makeJsonResponse({
                code: 0,
                data: { status: 'SUCCESS', results: [{ url: 'https://img.example.com/final.png' }] },
              });
            return makeTextResponse(JSON.stringify({ status: 'RUNNING', taskId: 'task-image-1' }));
          }
          if (value73 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/final.png' });
          throw new Error('unexpected fetch url: ' + value73);
        }));
      const { clearApiConfig: clearApiConfig39 } = await import('./configApi.js');
      clearApiConfig39();
      const { generateImage: generateImage5, resumeRunningHubImageTask: resumeRunningHubImageTask } =
          await import('./aiImageApi.js'),
        value75 = { prompt: 'p', model: 'runninghub-model/rhart-image-v1', inputUrls: [] },
        value76 = await generateImage5(value75, { onTaskMeta: (value77) => list7.push(value77) });
      (assert.equal(list7.length, 1),
        assert.equal(list7[0].taskId, 'task-image-1'),
        assert.equal(list7[0].useOpenapiQuery, true),
        assert.equal(value76.localPath, 'output/final.png'),
        assert.equal(value76.imageUrl, '/output/final.png'));
      const value78 = await resumeRunningHubImageTask('task-image-2', value75);
      (assert.equal(value78.localPath, 'output/final.png'),
        assert.equal(value78.imageUrl, '/output/final.png'));
    } finally {
      ((globalThis.fetch = value68), (globalThis.setTimeout = handler2), (globalThis.window = value69));
    }
  }),
  test('aiImageApi: runninghub-model poll timeout keeps polling task instead of failing', async () => {
    const value79 = globalThis.fetch,
      handler3 = globalThis.setTimeout,
      value80 = globalThis.window;
    let count = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value81, value82, ...args3) =>
          handler3(value81, Number(value82) > 0x1388 ? Number(value82) : 0, ...args3)),
        (globalThis.fetch = async (value83, dom59 = {}) => {
          const value84 = String(value83);
          if (value84 === '/api/config')
            return makeJsonResponse({
              providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' } },
            });
          if (value84 === '/api/v2/proxy/image') {
            const value85 = JSON.parse(String(dom59.body || '{}')),
              list9 = String(value85.apiUrl || '');
            if (list9.includes('/openapi/v2/query')) {
              count += 1;
              if (count === 1) {
                const error2 = new Error('The operation was aborted.');
                error2.name = 'AbortError';
                throw error2;
              }
              return makeJsonResponse({
                code: 0,
                data: {
                  status: 'SUCCESS',
                  results: [{ url: 'https://img.example.com/final-after-timeout.png' }],
                },
              });
            }
            return makeTextResponse(JSON.stringify({ status: 'RUNNING', taskId: 'task-image-timeout-1' }));
          }
          if (value84 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/final-after-timeout.png' });
          throw new Error('unexpected fetch url: ' + value84);
        }));
      const { clearApiConfig: clearApiConfig40 } = await import('./configApi.js');
      clearApiConfig40();
      const { generateImage: generateImage6 } = await import('./aiImageApi.js'),
        value86 = await generateImage6({
          prompt: 'p',
          model: 'runninghub-model/rhart-image-v1',
          inputUrls: [],
        });
      (assert.equal(count, 2), assert.equal(value86.localPath, 'output/final-after-timeout.png'));
    } finally {
      ((globalThis.fetch = value79), (globalThis.setTimeout = handler3), (globalThis.window = value80));
    }
  }),
  test('aiImageApi: runninghub-model polls when create response has task_id and submitted', async () => {
    const value87 = globalThis.fetch,
      handler4 = globalThis.setTimeout,
      value88 = globalThis.window,
      list10 = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value89, value90, ...args4) =>
          handler4(value89, Number(value90) > 0x1388 ? Number(value90) : 0, ...args4)),
        (globalThis.fetch = async (value91, dom60 = {}) => {
          const value92 = String(value91);
          if (value92 === '/api/config')
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: 'https://www.runninghub.cn', apiKey: 'k_wf', modelApiKey: 'k_model' },
              },
            });
          if (value92 === '/api/v2/proxy/image') {
            const value93 = JSON.parse(String(dom60.body || '{}')),
              list11 = String(value93.apiUrl || '');
            if (list11.includes('/openapi/v2/query'))
              return makeJsonResponse({
                code: 0,
                data: {
                  status: 'SUCCESS',
                  results: [{ url: 'https://img.example.com/rh-submitted-final.png' }],
                },
              });
            return makeTextResponse(
              JSON.stringify({ task_id: '2044473210820767746', status: 'submitted', source: 'body-probe' }),
            );
          }
          if (value92 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/rh-submitted-final.png' });
          throw new Error('unexpected fetch url: ' + value92);
        }));
      const { clearApiConfig: clearApiConfig41 } = await import('./configApi.js');
      clearApiConfig41();
      const { generateImage: generateImage7 } = await import('./aiImageApi.js'),
        value94 = await generateImage7(
          { provider: 'runninghub', model: 'runninghub-model/rhart-image-v1', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (value95) => list10.push(value95) },
        );
      (assert.equal(list10.length, 1),
        assert.equal(list10[0].taskId, '2044473210820767746'),
        assert.equal(value94.localPath, 'output/rh-submitted-final.png'),
        assert.equal(value94.imageUrl, '/output/rh-submitted-final.png'));
    } finally {
      ((globalThis.fetch = value87), (globalThis.setTimeout = handler4), (globalThis.window = value88));
    }
  }),
  test('aiImageApi: runninghubwf resume keeps polling submitted array snapshots until success', async () => {
    const value96 = globalThis.fetch,
      handler5 = globalThis.setTimeout,
      value97 = globalThis.window;
    let count2 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value98, value99, ...args5) =>
          handler5(value98, Number(value99) > 0x1388 ? Number(value99) : 0, ...args5)),
        (globalThis.fetch = async (value100, value101 = {}) => {
          const value102 = String(value100);
          if (value102 === '/api/config')
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: 'https://www.runninghub.cn', apiKey: 'k_wf', modelApiKey: 'k_model' },
              },
            });
          if (value102 === '/api/v2/runninghubwf/query') {
            count2 += 1;
            if (count2 === 1)
              return makeJsonResponse({
                code: 0,
                data: [{ taskId: 'wf-task-submitted-1', status: 'submitted' }],
              });
            return makeJsonResponse({
              code: 0,
              data: [
                {
                  taskId: 'wf-task-submitted-1',
                  status: 'succeeded',
                  url: 'https://img.example.com/wf-submitted-final.png',
                },
              ],
            });
          }
          if (value102 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/wf-submitted-final.png' });
          throw new Error('unexpected fetch url: ' + value102);
        }));
      const { clearApiConfig: clearApiConfig42 } = await import('./configApi.js');
      clearApiConfig42();
      const { resumeRunningHubImageTask: resumeRunningHubImageTask2 } = await import('./aiImageApi.js'),
        value103 = await resumeRunningHubImageTask2(
          'wf-task-submitted-1',
          { provider: 'runninghubwf', model: 'runninghub-query-snapshot-test', prompt: 'cat', inputUrls: [] },
          { useOpenapiQuery: false, maxPolls: 2, pollIntervalMs: 0 },
        );
      (assert.equal(count2, 2),
        assert.equal(value103.localPath, 'output/wf-submitted-final.png'),
        assert.equal(value103.imageUrl, '/output/wf-submitted-final.png'));
    } finally {
      ((globalThis.fetch = value96), (globalThis.setTimeout = handler5), (globalThis.window = value97));
    }
  }),
  test('aiImageApi: runninghubwf 查询数组快照仅含 fileUrl 时也应识别为已出图', async () => {
    const value104 = globalThis.fetch,
      handler6 = globalThis.setTimeout,
      value105 = globalThis.window;
    let count3 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value106, value107, ...args6) =>
          handler6(value106, Number(value107) > 0x1388 ? Number(value107) : 0, ...args6)),
        (globalThis.fetch = async (value108, value109 = {}) => {
          const value110 = String(value108);
          if (value110 === '/api/config')
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: 'https://www.runninghub.cn', apiKey: 'k_wf', modelApiKey: 'k_model' },
              },
            });
          if (value110 === '/api/v2/runninghubwf/query') {
            count3 += 1;
            if (count3 === 1)
              return makeJsonResponse({
                code: 0,
                data: [
                  { fileUrl: 'https://img.example.com/wf-fileurl-final.png', fileType: 'png', nodeId: '521' },
                ],
              });
          }
          if (value110 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/wf-fileurl-final.png' });
          throw new Error('unexpected fetch url: ' + value110);
        }));
      const { clearApiConfig: clearApiConfig43 } = await import('./configApi.js');
      clearApiConfig43();
      const { resumeRunningHubImageTask: resumeRunningHubImageTask3 } = await import('./aiImageApi.js'),
        value111 = await resumeRunningHubImageTask3('wf-task-fileurl-1', {
          provider: 'runninghubwf',
          model: 'runninghub-query-fileurl-test',
        });
      (assert.equal(count3, 1),
        assert.equal(value111.localPath, 'output/wf-fileurl-final.png'),
        assert.equal(value111.imageUrl, '/output/wf-fileurl-final.png'));
    } finally {
      ((globalThis.fetch = value104), (globalThis.setTimeout = handler6), (globalThis.window = value105));
    }
  }),
  test('aiImageApi: resumeRunningHubImageTask returns CANCELLED when aborted', async () => {
    const value112 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' } },
      });
      const { clearApiConfig: clearApiConfig44 } = await import('./configApi.js');
      clearApiConfig44();
      const { resumeRunningHubImageTask: resumeRunningHubImageTask4 } = await import('./aiImageApi.js'),
        signal = new AbortController();
      (signal.abort(),
        await assert.rejects(
          () =>
            resumeRunningHubImageTask4(
              'task-image-abort',
              { model: 'runninghub-model/rhart-image-v1' },
              { signal: signal.signal },
            ),
          (error3) => error3?.message === 'CANCELLED',
        ));
    } finally {
      globalThis.fetch = value112;
    }
  }),
  test('aiImageApi: RunningHub OpenAPI softTimeout 返回 pending 而不是失败', async () => {
    const value113 = globalThis.fetch;
    let value114 = 0;
    try {
      globalThis.fetch = async (value115, dom61 = {}) => {
        const value116 = String(value115);
        if (value116 === '/api/v2/proxy/image') {
          const value117 = JSON.parse(String(dom61.body || '{}'));
          return (
            assert.ok(String(value117.apiUrl || '').includes('/openapi/v2/query')),
            (value114 += 1),
            makeJsonResponse({ code: 0, data: { taskId: 'rh-pending-1', status: 'RUNNING' } })
          );
        }
        throw new Error('unexpected fetch url: ' + value116);
      };
      const { clearApiConfig: clearApiConfig45 } = await import('./configApi.js');
      clearApiConfig45();
      const { resumeRunningHubImageTask: resumeRunningHubImageTask5 } = await import('./aiImageApi.js'),
        value118 = await resumeRunningHubImageTask5(
          'rh-pending-1',
          { provider: 'runninghubwf', model: 'runninghub/2044874075721441281', apiKey: 'k_rh' },
          { useOpenapiQuery: true, softTimeout: true, maxPolls: 2, pollIntervalMs: 0 },
        );
      (assert.equal(value114, 2),
        assert.deepEqual(value118, {
          pending: true,
          taskId: 'rh-pending-1',
          status: 'running',
          message: '任务仍在 RunningHub 生成中',
        }));
    } finally {
      globalThis.fetch = value113;
    }
  }),
  test('aiImageApi: RunningHub OpenAPI 804/813 继续轮询直到成功', async () => {
    const value119 = globalThis.fetch,
      value120 = globalThis.window;
    let count4 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (value121, dom62 = {}) => {
          const value122 = String(value121);
          if (value122 === '/api/v2/proxy/image') {
            const value123 = JSON.parse(String(dom62.body || '{}'));
            (assert.ok(String(value123.apiUrl || '').includes('/openapi/v2/query')), (count4 += 1));
            if (count4 === 1) return makeJsonResponse({ code: 0x324, msg: '运行中' });
            if (count4 === 2) return makeJsonResponse({ code: 0x32d, msg: '排队中' });
            return makeJsonResponse({
              code: 0,
              data: { status: 'SUCCESS', results: [{ url: 'https://img.example.com/rh-openapi-final.png' }] },
            });
          }
          if (value122 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/rh-openapi-final.png' });
          throw new Error('unexpected fetch url: ' + value122);
        }));
      const { clearApiConfig: clearApiConfig46 } = await import('./configApi.js');
      clearApiConfig46();
      const { resumeRunningHubImageTask: resumeRunningHubImageTask6 } = await import('./aiImageApi.js'),
        value124 = await resumeRunningHubImageTask6(
          'rh-openapi-code-1',
          { provider: 'runninghubwf', model: 'runninghub/2044874075721441281', apiKey: 'k_rh' },
          { useOpenapiQuery: true, maxPolls: 3, pollIntervalMs: 0 },
        );
      (assert.equal(count4, 3),
        assert.equal(value124.localPath, 'output/rh-openapi-final.png'),
        assert.equal(value124.imageUrl, '/output/rh-openapi-final.png'));
    } finally {
      ((globalThis.fetch = value119), (globalThis.window = value120));
    }
  }),
  test('aiImageApi: RunningHub OpenAPI SUCCESS 无图时继续轮询下一轮', async () => {
    const value125 = globalThis.fetch,
      value126 = globalThis.window;
    let count5 = 0,
      value127 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (value128, value129 = {}) => {
          const value130 = String(value128);
          if (value130 === '/api/v2/proxy/image') {
            count5 += 1;
            if (count5 === 1) return makeJsonResponse({ code: 0, data: { status: 'SUCCESS', results: [] } });
            return makeJsonResponse({
              code: 0,
              data: { status: 'SUCCESS', results: [{ url: 'https://img.example.com/rh-delayed-url.png' }] },
            });
          }
          if (value130 === '/api/v2/save_output_from_url')
            return ((value127 += 1), makeJsonResponse({ path: 'output/rh-delayed-url.png' }));
          throw new Error('unexpected fetch url: ' + value130);
        }));
      const { clearApiConfig: clearApiConfig47 } = await import('./configApi.js');
      clearApiConfig47();
      const { resumeRunningHubImageTask: resumeRunningHubImageTask7 } = await import('./aiImageApi.js'),
        value131 = await resumeRunningHubImageTask7(
          'rh-delayed-url-1',
          { provider: 'runninghubwf', model: 'runninghub/2044874075721441281', apiKey: 'k_rh' },
          { useOpenapiQuery: true, maxPolls: 2, pollIntervalMs: 0 },
        );
      (assert.equal(count5, 2),
        assert.equal(value127, 1),
        assert.equal(value131.localPath, 'output/rh-delayed-url.png'));
    } finally {
      ((globalThis.fetch = value125), (globalThis.window = value126));
    }
  }),
  test('aiImageApi: same RunningHub image resume is single-flight', async () => {
    const value132 = globalThis.fetch,
      value133 = globalThis.window;
    let value134 = 0,
      value135 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (value136, value137 = {}) => {
          const value138 = String(value136);
          if (value138 === '/api/v2/proxy/image')
            return (
              (value134 += 1),
              await Promise.resolve(),
              makeJsonResponse({
                code: 0,
                data: {
                  status: 'SUCCESS',
                  results: [{ url: 'https://img.example.com/rh-single-flight.png' }],
                },
              })
            );
          if (value138 === '/api/v2/save_output_from_url')
            return (
              (value135 += 1),
              await Promise.resolve(),
              makeJsonResponse({ path: 'output/rh-single-flight.png' })
            );
          throw new Error('unexpected fetch url: ' + value138);
        }));
      const { clearApiConfig: clearApiConfig48 } = await import('./configApi.js');
      clearApiConfig48();
      const { resumeRunningHubImageTask: resumeRunningHubImageTask8 } = await import('./aiImageApi.js'),
        value139 = { provider: 'runninghubwf', model: 'runninghub/2044874075721441281', apiKey: 'k_rh' },
        value140 = { useOpenapiQuery: true, maxPolls: 1, pollIntervalMs: 0 },
        [value141, value142] = await Promise.all([
          resumeRunningHubImageTask8('rh-single-flight-1', value139, value140),
          resumeRunningHubImageTask8('rh-single-flight-1', value139, value140),
        ]);
      (assert.equal(value134, 1),
        assert.equal(value135, 1),
        assert.equal(value141.localPath, 'output/rh-single-flight.png'),
        assert.equal(value142.localPath, 'output/rh-single-flight.png'));
    } finally {
      ((globalThis.fetch = value132), (globalThis.window = value133));
    }
  }),
  test('aiImageApi: RunningHub OpenAPI 明确失败时 softTimeout 也应抛错', async () => {
    const value143 = globalThis.fetch;
    try {
      globalThis.fetch = async (value144) => {
        const value145 = String(value144);
        if (value145 === '/api/v2/proxy/image')
          return makeJsonResponse({
            code: 0,
            data: { taskId: 'rh-failed-1', status: 'FAILED', message: '执行失败' },
          });
        throw new Error('unexpected fetch url: ' + value145);
      };
      const { clearApiConfig: clearApiConfig49 } = await import('./configApi.js');
      clearApiConfig49();
      const { resumeRunningHubImageTask: resumeRunningHubImageTask9 } = await import('./aiImageApi.js');
      await assert.rejects(
        () =>
          resumeRunningHubImageTask9(
            'rh-failed-1',
            { provider: 'runninghubwf', model: 'runninghub/2044874075721441281', apiKey: 'k_rh' },
            { useOpenapiQuery: true, softTimeout: true, maxPolls: 2, pollIntervalMs: 0 },
          ),
        (error4) => String(error4?.message || '').includes('执行失败'),
      );
    } finally {
      globalThis.fetch = value143;
    }
  }),
  test('aiImageApi: dreamina image submit calls onTaskMeta and supports resumeDreaminaImageTask', async () => {
    const value146 = globalThis.fetch,
      handler7 = globalThis.setTimeout,
      list12 = [];
    let value147 = 0;
    try {
      ((globalThis.setTimeout = (value148, value149, ...args7) =>
        handler7(value148, Number(value149) > 0x1388 ? Number(value149) : 0, ...args7)),
        (globalThis.fetch = async (value150, value151 = {}) => {
          const list13 = String(value150);
          if (list13 === '/api/config') return makeJsonResponse({ providers: {} });
          if (list13 === '/api/v2/dreamina/text2image')
            return makeJsonResponse({ success: true, submitId: 'sid-dm-1' });
          if (list13.startsWith('/api/v2/dreamina/query_result?') && list13.includes('submitId=sid-dm-1'))
            return makeJsonResponse({
              success: true,
              submitId: 'sid-dm-1',
              status: 'success',
              outputs: [{ localPath: 'output/dreamina/img-1.png' }],
            });
          if (list13.startsWith('/api/v2/dreamina/query_result?') && list13.includes('submitId=sid-dm-2'))
            return (
              (value147 += 1),
              await Promise.resolve(),
              makeJsonResponse({
                success: true,
                submitId: 'sid-dm-2',
                status: 'success',
                outputs: [{ localPath: 'output/dreamina/img-2.png' }],
              })
            );
          throw new Error('unexpected fetch url: ' + list13);
        }));
      const { clearApiConfig: clearApiConfig50 } = await import('./configApi.js');
      clearApiConfig50();
      const { generateImage: generateImage8, resumeDreaminaImageTask: resumeDreaminaImageTask } =
          await import('./aiImageApi.js'),
        value152 = {
          provider: 'dreamina',
          model: 'dreamina/4.5',
          prompt: 'cat',
          inputUrls: [],
          aspectRatio: '1:1',
          imageSize: '2K',
        },
        value153 = await generateImage8(value152, { onTaskMeta: (value154) => list12.push(value154) });
      (assert.equal(list12.length, 1),
        assert.equal(list12[0].taskId, 'sid-dm-1'),
        assert.equal(list12[0].provider, 'dreamina'),
        assert.equal(list12[0].kind, 'image'),
        assert.equal(value153.localPath, 'output/dreamina/img-1.png'),
        assert.equal(value153.imageUrl, '/output/dreamina/img-1.png'));
      const [value155, value156] = await Promise.all([
        resumeDreaminaImageTask('sid-dm-2', value152),
        resumeDreaminaImageTask('sid-dm-2', value152),
      ]);
      (assert.equal(value147, 1),
        assert.equal(value155.localPath, 'output/dreamina/img-2.png'),
        assert.equal(value155.imageUrl, '/output/dreamina/img-2.png'),
        assert.equal(value156.localPath, 'output/dreamina/img-2.png'));
    } finally {
      ((globalThis.fetch = value146), (globalThis.setTimeout = handler7));
    }
  }),
  test('aiImageApi: apimart async task calls onTaskMeta and supports resumeAsyncImageTask', async () => {
    const value157 = globalThis.fetch,
      handler8 = globalThis.setTimeout,
      value158 = globalThis.window,
      list14 = [],
      list15 = [];
    let value159 = false,
      value160 = 0,
      value161 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value162, value163, ...args8) =>
          handler8(value162, Number(value163) > 0x1388 ? Number(value163) : 0, ...args8)),
        (globalThis.fetch = async (value164, value165 = {}) => {
          const value166 = String(value164);
          if (value166 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: '' },
              },
            });
          if (value166 === '/api/v2/proxy/image')
            return makeTextResponse(
              JSON.stringify({ data: [{ task_id: 'task-apimart-1', status: 'submitted' }] }),
            );
          if (value166.startsWith('/api/v2/proxy/task?'))
            return (
              list15.push(value166),
              value159 && ((value160 += 1), await Promise.resolve()),
              makeJsonResponse({
                status: 'success',
                results: [{ url: 'https://img.example.com/apimart-final.png' }],
              })
            );
          if (value166 === '/api/v2/save_output_from_url')
            return (
              value159 && ((value161 += 1), await Promise.resolve()),
              makeJsonResponse({ path: 'output/apimart-final.png' })
            );
          throw new Error('unexpected fetch url: ' + value166);
        }));
      const { clearApiConfig: clearApiConfig51 } = await import('./configApi.js');
      clearApiConfig51();
      const { generateImage: generateImage9, resumeAsyncImageTask: resumeAsyncImageTask } =
          await import('./aiImageApi.js'),
        value167 = { provider: 'apimart', model: 'apimart/nano-banana-2', prompt: 'cat', inputUrls: [] },
        value168 = await generateImage9(value167, { onTaskMeta: (value169) => list14.push(value169) });
      (assert.equal(list14.length, 1),
        assert.equal(list14[0].taskId, 'task-apimart-1'),
        assert.equal(list14[0].provider, 'apimart'),
        assert.equal(list14[0].kind, 'image'),
        assert.equal(value168.localPath, 'output/apimart-final.png'),
        assert.equal(value168.imageUrl, '/output/apimart-final.png'),
        (value159 = true));
      const [value170, value171] = await Promise.all([
        resumeAsyncImageTask('task-apimart-2', value167),
        resumeAsyncImageTask('task-apimart-2', value167),
      ]);
      (assert.equal(value160, 1),
        assert.equal(value161, 1),
        assert.equal(value170.localPath, 'output/apimart-final.png'),
        assert.equal(value170.imageUrl, '/output/apimart-final.png'),
        assert.equal(value171.localPath, 'output/apimart-final.png'),
        assert.ok(list15.every((list16) => list16.includes('%3Flanguage%3Dzh'))));
    } finally {
      ((globalThis.fetch = value157), (globalThis.setTimeout = handler8), (globalThis.window = value158));
    }
  }),
  test('aiImageApi: apimart Nano banana repeats batchSize with fixed request n=1', async () => {
    const value172 = globalThis.fetch,
      handler9 = globalThis.setTimeout,
      value173 = globalThis.window,
      list17 = [];
    let value174 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value175, value176, ...args9) =>
          handler9(value175, Number(value176) > 0x1388 ? Number(value176) : 0, ...args9)),
        (globalThis.fetch = async (value177, dom63 = {}) => {
          const value178 = String(value177);
          if (value178 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: '' },
              },
            });
          if (value178 === '/api/v2/proxy/image') {
            const value179 = JSON.parse(String(dom63.body || '{}'));
            list17.push(value179);
            const task_id = 'task-apimart-pro-n4-' + list17.length;
            return makeTextResponse(JSON.stringify({ data: [{ task_id: task_id, status: 'submitted' }] }));
          }
          if (value178.startsWith('/api/v2/proxy/task?')) {
            const proxyTaskApiUrl = getProxyTaskApiUrl(value178),
              value180 = proxyTaskApiUrl.match(
                /^https:\/\/api\.apimart\.ai\/v1\/tasks\/task-apimart-pro-n4-(\d+)\?language=zh$/,
              );
            assert.ok(value180);
            const value181 = value180[1];
            return makeJsonResponse({
              status: 'success',
              results: [{ url: 'https://img.example.com/apimart-pro-n4-' + value181 + '.png' }],
            });
          }
          if (value178 === '/api/v2/save_output_from_url')
            return (
              (value174 += 1),
              makeJsonResponse({ path: 'output/apimart-pro-n4-' + value174 + '.png' })
            );
          throw new Error('unexpected fetch url: ' + value178);
        }));
      const { clearApiConfig: clearApiConfig52 } = await import('./configApi.js');
      clearApiConfig52();
      const { generateImage: generateImage10 } = await import('./aiImageApi.js'),
        value182 = await generateImage10({
          provider: 'apimart',
          model: 'apimart/nano-banana-pro',
          prompt: 'dog',
          mode: 'standard',
          imageSize: '2K',
          aspectRatio: '1:1',
          batchSize: 4,
          inputUrls: [],
        });
      (assert.equal(list17.length, 4),
        assert.deepEqual(
          list17.map((item2) => item2.model),
          [
            'gemini-3-pro-image-preview',
            'gemini-3-pro-image-preview',
            'gemini-3-pro-image-preview',
            'gemini-3-pro-image-preview',
          ],
        ),
        assert.deepEqual(
          list17.map((item3) => item3.n),
          [1, 1, 1, 1],
        ),
        assert.equal(value182?.isBatch, true),
        assert.equal(value182?.images?.length, 4),
        assert.equal(value174, 4));
    } finally {
      ((globalThis.fetch = value172), (globalThis.setTimeout = handler9), (globalThis.window = value173));
    }
  }),
  test('aiImageApi: apimart gpt-image-2 repeats batchSize with fixed request n=1', async () => {
    const value183 = globalThis.fetch,
      value184 = globalThis.window,
      list18 = [];
    let value185 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (value186, dom64 = {}) => {
          const value187 = String(value186);
          if (value187 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: '' },
              },
            });
          if (value187 === '/api/v2/proxy/image') {
            const value188 = JSON.parse(String(dom64.body || '{}'));
            return (
              list18.push(value188),
              makeTextResponse(
                JSON.stringify({
                  results: Array.from({ length: 1 }, (value189, value190) => ({
                    url:
                      'https://img.example.com/apimart-' +
                      value188.model +
                      '-' +
                      list18.length +
                      '-' +
                      (value190 + 1) +
                      '.png',
                  })),
                }),
              )
            );
          }
          if (value187 === '/api/v2/save_output_from_url')
            return (
              (value185 += 1),
              makeJsonResponse({ path: 'output/apimart-gpt-image-2-' + value185 + '.png' })
            );
          throw new Error('unexpected fetch url: ' + value187);
        }));
      const { clearApiConfig: clearApiConfig53 } = await import('./configApi.js');
      clearApiConfig53();
      const { generateImage: generateImage11 } = await import('./aiImageApi.js'),
        value191 = await generateImage11({
          provider: 'apimart',
          model: 'apimart/gpt-image-2',
          prompt: 'dog',
          mode: 'standard',
          imageSize: '2K',
          aspectRatio: '1:1',
          batchSize: 4,
          inputUrls: [],
        });
      (assert.equal(list18.length, 4),
        assert.deepEqual(
          list18.map((item4) => item4.model),
          ['gpt-image-2', 'gpt-image-2', 'gpt-image-2', 'gpt-image-2'],
        ),
        assert.deepEqual(
          list18.map((item5) => item5.n),
          [1, 1, 1, 1],
        ),
        assert.equal(value191?.isBatch, true),
        assert.equal(value191?.images?.length, 4),
        assert.equal(value185, 4),
        (list18.length = 0),
        (value185 = 0));
      const value192 = await generateImage11({
        provider: 'apimart',
        model: 'apimart/gpt-image-2',
        prompt: 'dog',
        mode: 'official',
        imageSize: '2K',
        aspectRatio: '1:1',
        batchSize: 4,
        inputUrls: [],
      });
      (assert.equal(list18.length, 4),
        assert.deepEqual(
          list18.map((item6) => item6.model),
          ['gpt-image-2-official', 'gpt-image-2-official', 'gpt-image-2-official', 'gpt-image-2-official'],
        ),
        assert.deepEqual(
          list18.map((item7) => item7.n),
          [1, 1, 1, 1],
        ),
        assert.equal(value192?.isBatch, true),
        assert.equal(value192?.images?.length, 4),
        assert.equal(value185, 4));
    } finally {
      ((globalThis.fetch = value183), (globalThis.window = value184));
    }
  }),
  test('aiImageApi: apimart qwen-image-2.0 submits provider n once', async () => {
    const value193 = globalThis.fetch,
      value194 = globalThis.window,
      list19 = [];
    let value195 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (value196, dom65 = {}) => {
          const value197 = String(value196);
          if (value197 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: '' },
              },
            });
          if (value197 === '/api/v2/proxy/image') {
            const length = JSON.parse(String(dom65.body || '{}'));
            return (
              list19.push(length),
              makeTextResponse(
                JSON.stringify({
                  results: Array.from({ length: length.n }, (value198, value199) => ({
                    url: 'https://img.example.com/apimart-qwen-' + (value199 + 1) + '.png',
                  })),
                }),
              )
            );
          }
          if (value197 === '/api/v2/save_output_from_url')
            return ((value195 += 1), makeJsonResponse({ path: 'output/apimart-qwen-' + value195 + '.png' }));
          throw new Error('unexpected fetch url: ' + value197);
        }));
      const { clearApiConfig: clearApiConfig54 } = await import('./configApi.js');
      clearApiConfig54();
      const { generateImage: generateImage12 } = await import('./aiImageApi.js'),
        value200 = await generateImage12({
          provider: 'apimart',
          model: 'apimart/qwen-image-2.0',
          prompt: 'dog',
          mode: 'pro',
          imageSize: '2K',
          aspectRatio: '16:9',
          batchSize: 4,
          inputUrls: [],
        });
      (assert.equal(list19.length, 1),
        assert.equal(list19[0]?.model, 'qwen-image-2.0-pro'),
        assert.equal(list19[0]?.resolution, '2K'),
        assert.equal(list19[0]?.size, '16:9'),
        assert.equal(list19[0]?.n, 4),
        assert.equal(value200?.isBatch, true),
        assert.equal(value200?.images?.length, 4),
        assert.equal(value195, 4));
    } finally {
      ((globalThis.fetch = value193), (globalThis.window = value194));
    }
  }),
  test('aiImageApi: apimart z-image-turbo repeats batchSize without n', async () => {
    const value201 = globalThis.fetch,
      value202 = globalThis.window,
      list20 = [];
    let value203 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (value204, dom66 = {}) => {
          const value205 = String(value204);
          if (value205 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: '' },
              },
            });
          if (value205 === '/api/v2/proxy/image') {
            const value206 = JSON.parse(String(dom66.body || '{}'));
            return (
              list20.push(value206),
              makeTextResponse(
                JSON.stringify({
                  results: [{ url: 'https://img.example.com/apimart-z-image-' + list20.length + '.png' }],
                }),
              )
            );
          }
          if (value205 === '/api/v2/save_output_from_url')
            return (
              (value203 += 1),
              makeJsonResponse({ path: 'output/apimart-z-image-' + value203 + '.png' })
            );
          throw new Error('unexpected fetch url: ' + value205);
        }));
      const { clearApiConfig: clearApiConfig55 } = await import('./configApi.js');
      clearApiConfig55();
      const { generateImage: generateImage13 } = await import('./aiImageApi.js'),
        value207 = await generateImage13({
          provider: 'apimart',
          model: 'apimart/z-image-turbo',
          prompt: 'dog',
          imageSize: '2K',
          aspectRatio: '16:9',
          prompt_extend: true,
          batchSize: 4,
          inputUrls: [],
        });
      (assert.equal(list20.length, 4),
        assert.deepEqual(
          list20.map((item8) => item8.model),
          ['z-image-turbo', 'z-image-turbo', 'z-image-turbo', 'z-image-turbo'],
        ),
        assert.deepEqual(
          list20.map((item9) => item9.n),
          [undefined, undefined, undefined, undefined],
        ),
        assert.deepEqual(
          list20.map((item10) => item10.prompt_extend),
          [true, true, true, true],
        ),
        assert.equal(value207?.isBatch, true),
        assert.equal(value207?.images?.length, 4),
        assert.equal(value203, 4));
    } finally {
      ((globalThis.fetch = value201), (globalThis.window = value202));
    }
  }),
  test('aiImageApi: apimart wan2.7-image submits provider n once with image inputs', async () => {
    const value208 = globalThis.fetch,
      value209 = globalThis.window,
      list21 = [];
    let value210 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (value211, dom67 = {}) => {
          const value212 = String(value211);
          if (value212 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: '' },
              },
            });
          if (value212 === '/api/v2/proxy/image') {
            const length2 = JSON.parse(String(dom67.body || '{}'));
            return (
              list21.push(length2),
              makeTextResponse(
                JSON.stringify({
                  results: Array.from({ length: length2.n }, (value213, value214) => ({
                    url: 'https://img.example.com/apimart-wan-' + (value214 + 1) + '.png',
                  })),
                }),
              )
            );
          }
          if (value212 === '/api/v2/save_output_from_url')
            return ((value210 += 1), makeJsonResponse({ path: 'output/apimart-wan-' + value210 + '.png' }));
          throw new Error('unexpected fetch url: ' + value212);
        }));
      const { clearApiConfig: clearApiConfig56 } = await import('./configApi.js');
      clearApiConfig56();
      const { generateImage: generateImage14 } = await import('./aiImageApi.js'),
        value215 = await generateImage14({
          provider: 'apimart',
          model: 'apimart/wan2.7-image',
          prompt: 'dog',
          mode: 'pro',
          imageSize: '4K',
          aspectRatio: '自适应',
          resolvedRatioLabel: '16:9',
          batchSize: 4,
          inputUrls: ['https://cdn.apimart.ai/ref.png'],
        });
      (assert.equal(list21.length, 1),
        assert.equal(list21[0]?.model, 'wan2.7-image-pro'),
        assert.equal(list21[0]?.resolution, '2K'),
        assert.equal(list21[0]?.size, '16:9'),
        assert.equal(list21[0]?.n, 4),
        assert.equal(list21[0]?.thinking_mode, true),
        assert.deepEqual(list21[0]?.image_urls, ['https://cdn.apimart.ai/ref.png']),
        assert.equal(value215?.isBatch, true),
        assert.equal(value215?.images?.length, 4),
        assert.equal(value210, 4));
    } finally {
      ((globalThis.fetch = value208), (globalThis.window = value209));
    }
  }),
  test('aiImageApi: apimart seedream repeats batchSize with fixed request n=1', async () => {
    const value216 = globalThis.fetch,
      value217 = globalThis.window,
      list22 = [];
    let value218 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (value219, dom68 = {}) => {
          const value220 = String(value219);
          if (value220 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: '' },
              },
            });
          if (value220 === '/api/v2/proxy/image') {
            const value221 = JSON.parse(String(dom68.body || '{}'));
            return (
              list22.push(value221),
              makeTextResponse(
                JSON.stringify({
                  results: Array.from({ length: 1 }, (value222, value223) => ({
                    url:
                      'https://img.example.com/apimart-' +
                      value221.model +
                      '-' +
                      list22.length +
                      '-' +
                      (value223 + 1) +
                      '.png',
                  })),
                }),
              )
            );
          }
          if (value220 === '/api/v2/save_output_from_url')
            return (
              (value218 += 1),
              makeJsonResponse({ path: 'output/apimart-seedream-' + value218 + '.png' })
            );
          throw new Error('unexpected fetch url: ' + value220);
        }));
      const { clearApiConfig: clearApiConfig57 } = await import('./configApi.js');
      clearApiConfig57();
      const { generateImage: generateImage15 } = await import('./aiImageApi.js'),
        value224 = await generateImage15({
          provider: 'apimart',
          model: 'apimart/seedream-4.5',
          prompt: 'dog',
          imageSize: '2K',
          aspectRatio: '16:9',
          batchSize: 4,
          inputUrls: [],
        });
      (assert.equal(list22.length, 4),
        assert.deepEqual(
          list22.map((item11) => item11.model),
          ['doubao-seedream-4.5', 'doubao-seedream-4.5', 'doubao-seedream-4.5', 'doubao-seedream-4.5'],
        ),
        assert.deepEqual(
          list22.map((item12) => item12.n),
          [1, 1, 1, 1],
        ),
        assert.equal(value224?.isBatch, true),
        assert.equal(value224?.images?.length, 4),
        assert.equal(value218, 4),
        (list22.length = 0),
        (value218 = 0));
      const value225 = await generateImage15({
        provider: 'apimart',
        model: 'apimart/seedream-5.0-lite',
        prompt: 'dog',
        imageSize: '3K',
        aspectRatio: '21:9',
        batchSize: 4,
        inputUrls: [],
      });
      (assert.equal(list22.length, 4),
        assert.deepEqual(
          list22.map((item13) => item13.model),
          [
            'doubao-seedream-5.0-lite',
            'doubao-seedream-5.0-lite',
            'doubao-seedream-5.0-lite',
            'doubao-seedream-5.0-lite',
          ],
        ),
        assert.deepEqual(
          list22.map((item14) => item14.n),
          [1, 1, 1, 1],
        ),
        assert.equal(list22[0]?.resolution, '3K'),
        assert.equal(list22[0]?.size, '21:9'),
        assert.equal(value225?.isBatch, true),
        assert.equal(value225?.images?.length, 4),
        assert.equal(value218, 4));
    } finally {
      ((globalThis.fetch = value216), (globalThis.window = value217));
    }
  }),
  test('aiImageApi: apimart gpt-image-2 创建与轮询兼容官方 result.images 结构', async () => {
    const value226 = globalThis.fetch,
      handler10 = globalThis.setTimeout,
      value227 = globalThis.window,
      list23 = [];
    let count6 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value228, value229, ...args10) =>
          handler10(value228, Number(value229) > 0x1388 ? Number(value229) : 0, ...args10)),
        (globalThis.fetch = async (value230, dom69 = {}) => {
          const list24 = String(value230);
          if (list24 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com/v1/', apiKey: 'k_grsai' },
              },
            });
          if (list24 === '/api/v2/proxy/image') {
            const value231 = JSON.parse(String(dom69.body || '{}'));
            return (
              assert.equal(value231.apiUrl, 'https://api.apimart.ai/v1/images/generations'),
              assert.equal(value231.model, 'gpt-image-2'),
              assert.equal(value231.resolution, '2k'),
              assert.equal(value231.size, '16:9'),
              makeTextResponse(
                JSON.stringify({ data: [{ task_id: 'task-apimart-gpt-image-2', status: 'submitted' }] }),
              )
            );
          }
          if (list24.startsWith('/api/v2/proxy/task?'))
            return (
              (count6 += 1),
              assert.ok(
                list24.includes(
                  encodeURIComponent('https://api.apimart.ai/v1/tasks/task-apimart-gpt-image-2?language=zh'),
                ),
              ),
              makeJsonResponse({
                status: 'success',
                data: { result: { images: [{ url: ['https://img.example.com/apimart-gpt-image-2.png'] }] } },
              })
            );
          if (list24 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/apimart-gpt-image-2.png' });
          throw new Error('unexpected fetch url: ' + list24);
        }));
      const { clearApiConfig: clearApiConfig58 } = await import('./configApi.js');
      clearApiConfig58();
      const { generateImage: generateImage16 } = await import('./aiImageApi.js'),
        value232 = await generateImage16(
          {
            provider: 'apimart',
            model: 'apimart/gpt-image-2',
            prompt: 'cat',
            aspectRatio: '16:9',
            imageSize: '2K',
            inputUrls: [],
          },
          { onTaskMeta: (value233) => list23.push(value233) },
        );
      (assert.equal(list23.length, 1),
        assert.equal(list23[0].taskId, 'task-apimart-gpt-image-2'),
        assert.equal(list23[0].provider, 'apimart'),
        assert.ok(count6 >= 1),
        assert.equal(value232.localPath, 'output/apimart-gpt-image-2.png'),
        assert.equal(value232.imageUrl, '/output/apimart-gpt-image-2.png'));
    } finally {
      ((globalThis.fetch = value226), (globalThis.setTimeout = handler10), (globalThis.window = value227));
    }
  }),
  test('aiImageApi: apimart model without explicit provider still resumes as apimart async task', async () => {
    const value234 = globalThis.fetch,
      handler11 = globalThis.setTimeout,
      value235 = globalThis.window,
      list25 = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value236, value237, ...args11) =>
          handler11(value236, Number(value237) > 0x1388 ? Number(value237) : 0, ...args11)),
        (globalThis.fetch = async (value238, value239 = {}) => {
          const list26 = String(value238);
          if (list26 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (list26 === '/api/v2/proxy/image')
            return makeTextResponse(
              JSON.stringify({ data: [{ task_id: 'task-apimart-model-only', status: 'submitted' }] }),
            );
          if (list26.startsWith('/api/v2/proxy/task?'))
            return (
              assert.ok(
                list26.includes(
                  encodeURIComponent('https://api.apimart.ai/v1/tasks/task-apimart-model-only?language=zh'),
                ),
              ),
              makeJsonResponse({
                status: 'success',
                results: [{ url: 'https://img.example.com/apimart-model-only-final.png' }],
              })
            );
          if (list26 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/apimart-model-only-final.png' });
          throw new Error('unexpected fetch url: ' + list26);
        }));
      const { clearApiConfig: clearApiConfig59 } = await import('./configApi.js');
      clearApiConfig59();
      const { generateImage: generateImage17 } = await import('./aiImageApi.js'),
        value240 = { model: 'apimart/nano-banana-2', prompt: 'cat', inputUrls: [] },
        value241 = await generateImage17(value240, { onTaskMeta: (value242) => list25.push(value242) });
      (assert.equal(list25.length, 1),
        assert.equal(list25[0].taskId, 'task-apimart-model-only'),
        assert.equal(list25[0].provider, 'apimart'),
        assert.equal(list25[0].kind, 'image'),
        assert.equal(value241.localPath, 'output/apimart-model-only-final.png'),
        assert.equal(value241.imageUrl, '/output/apimart-model-only-final.png'));
    } finally {
      ((globalThis.fetch = value234), (globalThis.setTimeout = handler11), (globalThis.window = value235));
    }
  }),
  test('aiImageApi: provider=apimart + 裸模型时优先走 apimart', async () => {
    const value243 = globalThis.fetch,
      handler12 = globalThis.setTimeout,
      value244 = globalThis.window;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value245, value246, ...args12) =>
          handler12(value245, Number(value246) > 0x1388 ? Number(value246) : 0, ...args12)),
        (globalThis.fetch = async (value247, dom70 = {}) => {
          const list27 = String(value247);
          if (list27 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (list27 === '/api/v2/proxy/image') {
            const value248 = JSON.parse(String(dom70.body || '{}'));
            return (
              assert.ok(String(value248.apiUrl || '').includes('api.apimart.ai')),
              makeTextResponse(
                JSON.stringify({
                  data: [{ task_id: 'task-apimart-provider-priority', status: 'submitted' }],
                }),
              )
            );
          }
          if (list27.startsWith('/api/v2/proxy/task?'))
            return (
              assert.ok(
                list27.includes(
                  encodeURIComponent(
                    'https://api.apimart.ai/v1/tasks/task-apimart-provider-priority?language=zh',
                  ),
                ),
              ),
              makeJsonResponse({
                status: 'success',
                results: [{ url: 'https://img.example.com/apimart-provider-priority.png' }],
              })
            );
          if (list27 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/apimart-provider-priority.png' });
          throw new Error('unexpected fetch url: ' + list27);
        }));
      const { clearApiConfig: clearApiConfig60 } = await import('./configApi.js');
      clearApiConfig60();
      const { generateImage: generateImage18 } = await import('./aiImageApi.js'),
        value249 = await generateImage18({
          provider: 'apimart',
          model: 'nano-banana-2',
          prompt: 'cat',
          inputUrls: [],
        });
      assert.equal(value249.localPath, 'output/apimart-provider-priority.png');
    } finally {
      ((globalThis.fetch = value243), (globalThis.setTimeout = handler12), (globalThis.window = value244));
    }
  }),
  test('aiImageApi: provider=ppio + 裸模型时优先走 ppio', async () => {
    const value250 = globalThis.fetch,
      handler13 = globalThis.setTimeout,
      value251 = globalThis.window;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value252, value253, ...args13) =>
          handler13(value252, Number(value253) > 0x1388 ? Number(value253) : 0, ...args13)),
        (globalThis.fetch = async (value254) => {
          const value255 = String(value254);
          if (value255 === '/api/config')
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: 'https://api.ppinfra.com', apiKey: 'k_ppio' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          throw new Error('unexpected fetch url: ' + value255);
        }));
      const { clearApiConfig: clearApiConfig61 } = await import('./configApi.js');
      clearApiConfig61();
      const { buildGenerateImageRequest: buildGenerateImageRequest35 } = await import('./aiImageApi.js'),
        dom71 = await buildGenerateImageRequest35({
          provider: 'ppio',
          model: 'seedream-5.0-lite',
          prompt: 'cat',
          inputUrls: [],
        });
      (assert.equal(dom71.adapterTrace?.source, 'manifest'),
        assert.equal(dom71.body.apiUrl, 'https://api.ppinfra.com/v3/seedream-5.0-lite'),
        assert.equal(dom71.body.prompt, 'cat'));
    } finally {
      ((globalThis.fetch = value250), (globalThis.setTimeout = handler13), (globalThis.window = value251));
    }
  }),
  test('aiImageApi: unregistered bare model rejects without default GRSAI routing', async () => {
    const value256 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
      });
      const { clearApiConfig: clearApiConfig62 } = await import('./configApi.js');
      clearApiConfig62();
      const { buildGenerateImageRequest: buildGenerateImageRequest36 } = await import('./aiImageApi.js');
      await assert.rejects(
        () => buildGenerateImageRequest36({ model: 'unregistered-bare-model', prompt: 'cat', inputUrls: [] }),
        /Image model API manifest missing: unregistered-bare-model/,
      );
    } finally {
      globalThis.fetch = value256;
    }
  }),
  test('aiImageApi: grsai async task can render image even when create response has no status', async () => {
    const value257 = globalThis.fetch,
      handler14 = globalThis.setTimeout,
      value258 = globalThis.window,
      list28 = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value259, value260, ...args14) =>
          handler14(value259, Number(value260) > 0x1388 ? Number(value260) : 0, ...args14)),
        (globalThis.fetch = async (value261, dom72 = {}) => {
          const value262 = String(value261);
          if (value262 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (value262 === '/api/v2/proxy/image') {
            const value263 = JSON.parse(String(dom72.body || '{}')),
              value264 = String(value263.apiUrl || '');
            if (value264.endsWith('/v1/api/generate'))
              return makeTextResponse(JSON.stringify({ data: { task_id: 'task-grsai-1' } }));
            throw new Error('unexpected apiUrl: ' + value264);
          }
          if (value262.startsWith('/api/v2/proxy/task?')) {
            const proxyTaskApiUrl2 = getProxyTaskApiUrl(value262);
            return (
              assert.equal(proxyTaskApiUrl2, 'https://api.grsai.example.com/v1/api/result?id=task-grsai-1'),
              makeJsonResponse({
                id: 'task-grsai-1',
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/grsai-final.png' }],
              })
            );
          }
          if (value262 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-final.png' });
          throw new Error('unexpected fetch url: ' + value262);
        }));
      const { clearApiConfig: clearApiConfig63 } = await import('./configApi.js');
      clearApiConfig63();
      const { generateImage: generateImage19 } = await import('./aiImageApi.js'),
        value265 = { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
        value266 = await generateImage19(value265, { onTaskMeta: (value267) => list28.push(value267) });
      (assert.equal(list28.length, 1),
        assert.equal(list28[0].taskId, 'task-grsai-1'),
        assert.equal(list28[0].provider, 'grsai'),
        assert.equal(list28[0].kind, 'image'),
        assert.equal(value266.localPath, 'output/grsai-final.png'),
        assert.equal(value266.imageUrl, '/output/grsai-final.png'));
    } finally {
      ((globalThis.fetch = value257), (globalThis.setTimeout = handler14), (globalThis.window = value258));
    }
  }),
  test('aiImageApi: grsai generate succeeded results render without polling', async () => {
    const value268 = globalThis.fetch,
      value269 = globalThis.window,
      list29 = [];
    let value270 = false;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (value271, dom73 = {}) => {
          const value272 = String(value271);
          if (value272 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com/v1/', apiKey: 'k_grsai' } },
            });
          if (value272 === '/api/v2/proxy/image') {
            const value273 = JSON.parse(String(dom73.body || '{}'));
            return (
              assert.equal(value273.apiUrl, 'https://api.grsai.example.com/v1/api/generate'),
              assert.deepEqual(value273.images, []),
              assert.equal(value273.replyType, 'json'),
              makeTextResponse(
                JSON.stringify({
                  id: '7-d28fb618-a9a8-4931-9a02-6b8ecfafd493',
                  status: 'succeeded',
                  results: [
                    { url: 'https://file5.aitohumanize.com/file/64e00628c80e4d339eb2fbc085bb3966.png' },
                  ],
                }),
              )
            );
          }
          if (value272.startsWith('/api/v2/proxy/task?')) {
            value270 = true;
            throw new Error('unexpected polling url: ' + value272);
          }
          if (value272 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-direct-final.png' });
          throw new Error('unexpected fetch url: ' + value272);
        }));
      const { clearApiConfig: clearApiConfig64 } = await import('./configApi.js');
      clearApiConfig64();
      const { generateImage: generateImage20 } = await import('./aiImageApi.js'),
        value274 = await generateImage20(
          { provider: 'grsai', model: 'nano-banana-2', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (value275) => list29.push(value275) },
        );
      (assert.equal(value270, false),
        assert.equal(list29.length, 0),
        assert.equal(value274.localPath, 'output/grsai-direct-final.png'),
        assert.equal(value274.imageUrl, '/output/grsai-direct-final.png'));
    } finally {
      ((globalThis.fetch = value268), (globalThis.window = value269));
    }
  }),
  test('aiImageApi: grsai polling uses GET /v1/api/result', async () => {
    const value276 = globalThis.fetch,
      handler15 = globalThis.setTimeout,
      value277 = globalThis.window,
      list30 = [];
    let value278 = false;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value279, value280, ...args15) =>
          handler15(value279, Number(value280) > 0x1388 ? Number(value280) : 0, ...args15)),
        (globalThis.fetch = async (value281, dom74 = {}) => {
          const value282 = String(value281);
          if (value282 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (value282 === '/api/v2/proxy/image') {
            const value283 = JSON.parse(String(dom74.body || '{}')),
              value284 = String(value283.apiUrl || '');
            if (value284.endsWith('/v1/api/generate'))
              return makeTextResponse('data: {"result":{"task_id":"task-grsai-fallback-1"}}\n\n');
            throw new Error('unexpected apiUrl: ' + value284);
          }
          if (value282.startsWith('/api/v2/proxy/task?')) {
            const proxyTaskApiUrl3 = getProxyTaskApiUrl(value282);
            return (
              (value278 = true),
              assert.equal(
                proxyTaskApiUrl3,
                'https://api.grsai.example.com/v1/api/result?id=task-grsai-fallback-1',
              ),
              makeJsonResponse({
                id: 'task-grsai-fallback-1',
                status: 'finished',
                output: { images: [{ url: 'https://img.example.com/grsai-fallback-final.png' }] },
              })
            );
          }
          if (value282 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-fallback-final.png' });
          throw new Error('unexpected fetch url: ' + value282);
        }));
      const { clearApiConfig: clearApiConfig65 } = await import('./configApi.js');
      clearApiConfig65();
      const { generateImage: generateImage21 } = await import('./aiImageApi.js'),
        value285 = { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
        value286 = await generateImage21(value285, { onTaskMeta: (value287) => list30.push(value287) });
      (assert.equal(list30.length, 1),
        assert.equal(list30[0].taskId, 'task-grsai-fallback-1'),
        assert.equal(list30[0].provider, 'grsai'),
        assert.equal(list30[0].kind, 'image'),
        assert.equal(value278, true),
        assert.equal(value286.localPath, 'output/grsai-fallback-final.png'),
        assert.equal(value286.imageUrl, '/output/grsai-fallback-final.png'));
    } finally {
      ((globalThis.fetch = value276), (globalThis.setTimeout = handler15), (globalThis.window = value277));
    }
  }),
  test('aiImageApi: resumeAsyncImageTask 支持 grsai 恢复', async () => {
    const value288 = globalThis.fetch,
      value289 = globalThis.setTimeout,
      value290 = globalThis.window;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (handler16) => {
          if (typeof handler16 === 'function') handler16();
          return 0;
        }),
        (globalThis.fetch = async (value291, value292 = {}) => {
          const value293 = String(value291);
          if (value293 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com/v1/', apiKey: 'k_grsai' } },
            });
          if (value293.startsWith('/api/v2/proxy/task?')) {
            const proxyTaskApiUrl4 = getProxyTaskApiUrl(value293);
            return (
              assert.equal(
                proxyTaskApiUrl4,
                'https://api.grsai.example.com/v1/api/result?id=task-grsai-resume-1',
              ),
              makeJsonResponse({
                id: 'task-grsai-resume-1',
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/grsai-resume-final.png' }],
              })
            );
          }
          if (value293 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-resume-final.png' });
          throw new Error('unexpected fetch url: ' + value293);
        }));
      const { clearApiConfig: clearApiConfig66 } = await import('./configApi.js');
      clearApiConfig66();
      const { resumeAsyncImageTask: resumeAsyncImageTask2 } = await import('./aiImageApi.js'),
        value294 = await resumeAsyncImageTask2('task-grsai-resume-1', {
          provider: 'grsai',
          model: 'nano-banana-2',
        });
      (assert.equal(value294.localPath, 'output/grsai-resume-final.png'),
        assert.equal(value294.imageUrl, '/output/grsai-resume-final.png'));
    } finally {
      ((globalThis.fetch = value288), (globalThis.setTimeout = value289), (globalThis.window = value290));
    }
  }),
  test('aiImageApi: grsai SSE renders directly when task_id arrives before results', async () => {
    const value295 = globalThis.fetch,
      handler17 = globalThis.setTimeout,
      value296 = globalThis.window,
      list31 = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value297, value298, ...args16) =>
          handler17(value297, Number(value298) > 0x1388 ? Number(value298) : 0, ...args16)),
        (globalThis.fetch = async (value299, dom75 = {}) => {
          const value300 = String(value299);
          if (value300 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (value300 === '/api/v2/proxy/image') {
            const value301 = JSON.parse(String(dom75.body || '{}')),
              value302 = String(value301.apiUrl || '');
            if (value302.endsWith('/v1/api/generate'))
              return makeTextResponse(
                'data: {"data":{"task_id":"task-grsai-sse-direct-1"},"status":"pending"}\n\ndata: {"status":"succeeded","results":[{"url":"https://img.example.com/grsai-sse-direct-1.png"}]}\n\n',
              );
          }
          if (value300 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-sse-direct-1.png' });
          if (value300.startsWith('/api/v2/proxy/task?'))
            return makeJsonResponse({ message: 'should-not-poll' }, 0x1f4);
          throw new Error('unexpected fetch url: ' + value300);
        }));
      const { clearApiConfig: clearApiConfig67 } = await import('./configApi.js');
      clearApiConfig67();
      const { generateImage: generateImage22 } = await import('./aiImageApi.js'),
        value303 = await generateImage22(
          { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (value304) => list31.push(value304) },
        );
      (assert.equal(list31.length, 0),
        assert.equal(value303.localPath, 'output/grsai-sse-direct-1.png'),
        assert.equal(value303.imageUrl, '/output/grsai-sse-direct-1.png'));
    } finally {
      ((globalThis.fetch = value295), (globalThis.setTimeout = handler17), (globalThis.window = value296));
    }
  }),
  test('aiImageApi: grsai polls create response id through /v1/api/result', async () => {
    const value305 = globalThis.fetch,
      handler18 = globalThis.setTimeout,
      value306 = globalThis.window,
      list32 = [];
    let value307 = false;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value308, value309, ...args17) =>
          handler18(value308, Number(value309) > 0x1388 ? Number(value309) : 0, ...args17)),
        (globalThis.fetch = async (value310, dom76 = {}) => {
          const value311 = String(value310);
          if (value311 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (value311 === '/api/v2/proxy/image') {
            const value312 = JSON.parse(String(dom76.body || '{}')),
              value313 = String(value312.apiUrl || '');
            return (
              assert.equal(value313, 'https://api.grsai.example.com/v1/api/generate'),
              makeTextResponse(JSON.stringify({ status: 'pending', data: { id: 'task-grsai-result-1' } }))
            );
          }
          if (value311.startsWith('/api/v2/proxy/task?')) {
            const proxyTaskApiUrl5 = getProxyTaskApiUrl(value311);
            return (
              (value307 = true),
              assert.equal(
                proxyTaskApiUrl5,
                'https://api.grsai.example.com/v1/api/result?id=task-grsai-result-1',
              ),
              makeJsonResponse({
                id: 'task-grsai-result-1',
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/grsai-result-1.png' }],
              })
            );
          }
          if (value311 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-result-1.png' });
          throw new Error('unexpected fetch url: ' + value311);
        }));
      const { clearApiConfig: clearApiConfig68 } = await import('./configApi.js');
      clearApiConfig68();
      const { generateImage: generateImage23 } = await import('./aiImageApi.js'),
        value314 = await generateImage23(
          { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (value315) => list32.push(value315) },
        );
      (assert.equal(list32.length, 1),
        assert.equal(list32[0].taskId, 'task-grsai-result-1'),
        assert.equal(list32[0].provider, 'grsai'),
        assert.equal(value307, true),
        assert.equal(value314.localPath, 'output/grsai-result-1.png'),
        assert.equal(value314.imageUrl, '/output/grsai-result-1.png'));
    } finally {
      ((globalThis.fetch = value305), (globalThis.setTimeout = handler18), (globalThis.window = value306));
    }
  }),
  test('aiImageApi: ppio async task calls onTaskMeta and supports resumeAsyncImageTask even without create status', async () => {
    const value316 = globalThis.fetch,
      handler19 = globalThis.setTimeout,
      value317 = globalThis.window,
      list33 = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value318, value319, ...args18) =>
          handler19(value318, Number(value319) > 0x1388 ? Number(value319) : 0, ...args18)),
        (globalThis.fetch = async (value320, value321 = {}) => {
          const value322 = String(value320);
          if (value322 === '/api/config')
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: 'https://api.ppio.com', apiKey: 'k_ppio' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (value322 === '/api/v2/proxy/image')
            return makeTextResponse(JSON.stringify({ task_id: 'task-ppio-1' }));
          if (value322.startsWith('/api/v2/proxy/task?'))
            return makeJsonResponse({
              status: 'SUCCEEDED',
              results: [{ url: 'https://img.example.com/ppio-final.png' }],
            });
          if (value322 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/ppio-final.png' });
          throw new Error('unexpected fetch url: ' + value322);
        }));
      const { clearApiConfig: clearApiConfig69 } = await import('./configApi.js');
      clearApiConfig69();
      const { generateImage: generateImage24, resumeAsyncImageTask: resumeAsyncImageTask3 } =
          await import('./aiImageApi.js'),
        value323 = { provider: 'ppio', model: 'ppio/seedream-5.0-lite', prompt: 'cat', inputUrls: [] },
        value324 = await generateImage24(value323, { onTaskMeta: (value325) => list33.push(value325) });
      (assert.equal(list33.length, 1),
        assert.equal(list33[0].taskId, 'task-ppio-1'),
        assert.equal(list33[0].provider, 'ppio'),
        assert.equal(list33[0].kind, 'image'),
        assert.equal(value324.localPath, 'output/ppio-final.png'),
        assert.equal(value324.imageUrl, '/output/ppio-final.png'));
      const value326 = await resumeAsyncImageTask3('task-ppio-2', value323);
      (assert.equal(value326.localPath, 'output/ppio-final.png'),
        assert.equal(value326.imageUrl, '/output/ppio-final.png'));
    } finally {
      ((globalThis.fetch = value316), (globalThis.setTimeout = handler19), (globalThis.window = value317));
    }
  }),
  test('aiImageApi: ppio extracts task ID from multiline data even when the final frame has no task_id', async () => {
    const value327 = globalThis.fetch,
      handler20 = globalThis.setTimeout,
      value328 = globalThis.window,
      list34 = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value329, value330, ...args19) =>
          handler20(value329, Number(value330) > 0x1388 ? Number(value330) : 0, ...args19)),
        (globalThis.fetch = async (value331, value332 = {}) => {
          const value333 = String(value331);
          if (value333 === '/api/config')
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: 'https://api.ppio.com', apiKey: 'k_ppio' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (value333 === '/api/v2/proxy/image')
            return makeTextResponse(
              'data: {"task_id":"task-ppio-sse-1","status":"submitted"}\n\ndata: {"status":"pending"}\n\n',
            );
          if (value333.startsWith('/api/v2/proxy/task?'))
            return makeJsonResponse({
              status: 'success',
              results: [{ url: 'https://img.example.com/ppio-sse-1.png' }],
            });
          if (value333 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/ppio-sse-1.png' });
          throw new Error('unexpected fetch url: ' + value333);
        }));
      const { clearApiConfig: clearApiConfig70 } = await import('./configApi.js');
      clearApiConfig70();
      const { generateImage: generateImage25 } = await import('./aiImageApi.js'),
        value334 = await generateImage25(
          { provider: 'ppio', model: 'ppio/seedream-5.0-lite', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (value335) => list34.push(value335) },
        );
      (assert.equal(list34.length, 1),
        assert.equal(list34[0].taskId, 'task-ppio-sse-1'),
        assert.equal(list34[0].provider, 'ppio'),
        assert.equal(value334.localPath, 'output/ppio-sse-1.png'));
    } finally {
      ((globalThis.fetch = value327), (globalThis.setTimeout = handler20), (globalThis.window = value328));
    }
  }),
  test('aiImageApi: ppio polls when create response data is a string task ID', async () => {
    const value336 = globalThis.fetch,
      handler21 = globalThis.setTimeout,
      value337 = globalThis.window,
      list35 = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value338, value339, ...args20) =>
          handler21(value338, Number(value339) > 0x1388 ? Number(value339) : 0, ...args20)),
        (globalThis.fetch = async (value340, value341 = {}) => {
          const value342 = String(value340);
          if (value342 === '/api/config')
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: 'https://api.ppio.com', apiKey: 'k_ppio' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (value342 === '/api/v2/proxy/image')
            return makeTextResponse(JSON.stringify({ data: 'task-ppio-data-string-1' }));
          if (value342.startsWith('/api/v2/proxy/task?'))
            return makeJsonResponse({
              status: 'success',
              results: [{ url: 'https://img.example.com/ppio-data-string-1.png' }],
            });
          if (value342 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/ppio-data-string-1.png' });
          throw new Error('unexpected fetch url: ' + value342);
        }));
      const { clearApiConfig: clearApiConfig71 } = await import('./configApi.js');
      clearApiConfig71();
      const { generateImage: generateImage26 } = await import('./aiImageApi.js'),
        value343 = await generateImage26(
          { provider: 'ppio', model: 'ppio/seedream-5.0-lite', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (value344) => list35.push(value344) },
        );
      (assert.equal(list35.length, 1),
        assert.equal(list35[0].taskId, 'task-ppio-data-string-1'),
        assert.equal(list35[0].provider, 'ppio'),
        assert.equal(value343.localPath, 'output/ppio-data-string-1.png'));
    } finally {
      ((globalThis.fetch = value336), (globalThis.setTimeout = handler21), (globalThis.window = value337));
    }
  }),
  test('aiImageApi: grsai polls when create response body lacks task_id but header has x-task-id', async () => {
    const value345 = globalThis.fetch,
      handler22 = globalThis.setTimeout,
      value346 = globalThis.window,
      list36 = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value347, value348, ...args21) =>
          handler22(value347, Number(value348) > 0x1388 ? Number(value348) : 0, ...args21)),
        (globalThis.fetch = async (value349, dom77 = {}) => {
          const value350 = String(value349);
          if (value350 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (value350 === '/api/v2/proxy/image') {
            const value351 = JSON.parse(String(dom77.body || '{}')),
              value352 = String(value351.apiUrl || '');
            if (value352.endsWith('/v1/api/generate'))
              return makeTextResponseWithHeaders(JSON.stringify({ status: 'pending' }), {
                'x-task-id': 'task-grsai-header-1',
              });
            throw new Error('unexpected apiUrl: ' + value352);
          }
          if (value350.startsWith('/api/v2/proxy/task?')) {
            const proxyTaskApiUrl6 = getProxyTaskApiUrl(value350);
            return (
              assert.equal(
                proxyTaskApiUrl6,
                'https://api.grsai.example.com/v1/api/result?id=task-grsai-header-1',
              ),
              makeJsonResponse({
                id: 'task-grsai-header-1',
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/grsai-header-1.png' }],
              })
            );
          }
          if (value350 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-header-1.png' });
          throw new Error('unexpected fetch url: ' + value350);
        }));
      const { clearApiConfig: clearApiConfig72 } = await import('./configApi.js');
      clearApiConfig72();
      const { generateImage: generateImage27 } = await import('./aiImageApi.js'),
        value353 = await generateImage27(
          { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (value354) => list36.push(value354) },
        );
      (assert.equal(list36.length, 1),
        assert.equal(list36[0].taskId, 'task-grsai-header-1'),
        assert.equal(list36[0].provider, 'grsai'),
        assert.equal(value353.localPath, 'output/grsai-header-1.png'));
    } finally {
      ((globalThis.fetch = value345), (globalThis.setTimeout = handler22), (globalThis.window = value346));
    }
  }),
  test('aiImageApi: grsai polls when create response task field is the task ID', async () => {
    const value355 = globalThis.fetch,
      handler23 = globalThis.setTimeout,
      value356 = globalThis.window,
      list37 = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value357, value358, ...args22) =>
          handler23(value357, Number(value358) > 0x1388 ? Number(value358) : 0, ...args22)),
        (globalThis.fetch = async (value359, dom78 = {}) => {
          const value360 = String(value359);
          if (value360 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (value360 === '/api/v2/proxy/image') {
            const value361 = JSON.parse(String(dom78.body || '{}')),
              value362 = String(value361.apiUrl || '');
            if (value362.endsWith('/v1/api/generate'))
              return makeTextResponse(JSON.stringify({ status: 'pending', task: 'task-grsai-task-key-1' }));
            throw new Error('unexpected apiUrl: ' + value362);
          }
          if (value360.startsWith('/api/v2/proxy/task?')) {
            const proxyTaskApiUrl7 = getProxyTaskApiUrl(value360);
            return (
              assert.equal(
                proxyTaskApiUrl7,
                'https://api.grsai.example.com/v1/api/result?id=task-grsai-task-key-1',
              ),
              makeJsonResponse({
                id: 'task-grsai-task-key-1',
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/grsai-task-key-1.png' }],
              })
            );
          }
          if (value360 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-task-key-1.png' });
          throw new Error('unexpected fetch url: ' + value360);
        }));
      const { clearApiConfig: clearApiConfig73 } = await import('./configApi.js');
      clearApiConfig73();
      const { generateImage: generateImage28 } = await import('./aiImageApi.js'),
        value363 = await generateImage28(
          { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (value364) => list37.push(value364) },
        );
      (assert.equal(list37.length, 1),
        assert.equal(list37[0].taskId, 'task-grsai-task-key-1'),
        assert.equal(list37[0].provider, 'grsai'),
        assert.equal(value363.localPath, 'output/grsai-task-key-1.png'));
    } finally {
      ((globalThis.fetch = value355), (globalThis.setTimeout = handler23), (globalThis.window = value356));
    }
  }),
  test('aiImageApi: grsai polls when create response has success and task_id', async () => {
    const value365 = globalThis.fetch,
      handler24 = globalThis.setTimeout,
      value366 = globalThis.window,
      list38 = [];
    let count7 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value367, value368, ...args23) =>
          handler24(value367, Number(value368) > 0x1388 ? Number(value368) : 0, ...args23)),
        (globalThis.fetch = async (value369, dom79 = {}) => {
          const value370 = String(value369);
          if (value370 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (value370 === '/api/v2/proxy/image') {
            const value371 = JSON.parse(String(dom79.body || '{}')),
              value372 = String(value371.apiUrl || '');
            if (value372.endsWith('/v1/api/generate'))
              return makeTextResponse(
                JSON.stringify({ status: 'success', data: { task_id: 'task-grsai-success-ack' } }),
              );
            throw new Error('unexpected apiUrl: ' + value372);
          }
          if (value370.startsWith('/api/v2/proxy/task?')) {
            const proxyTaskApiUrl8 = getProxyTaskApiUrl(value370);
            return (
              (count7 += 1),
              assert.equal(
                proxyTaskApiUrl8,
                'https://api.grsai.example.com/v1/api/result?id=task-grsai-success-ack',
              ),
              makeJsonResponse({
                id: 'task-grsai-success-ack',
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/grsai-success-ack.png' }],
              })
            );
          }
          if (value370 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-success-ack.png' });
          throw new Error('unexpected fetch url: ' + value370);
        }));
      const { clearApiConfig: clearApiConfig74 } = await import('./configApi.js');
      clearApiConfig74();
      const { generateImage: generateImage29 } = await import('./aiImageApi.js'),
        value373 = await generateImage29(
          { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (value374) => list38.push(value374) },
        );
      (assert.equal(list38.length, 1),
        assert.equal(list38[0].taskId, 'task-grsai-success-ack'),
        assert.ok(count7 >= 1),
        assert.equal(value373.localPath, 'output/grsai-success-ack.png'));
    } finally {
      ((globalThis.fetch = value365), (globalThis.setTimeout = handler24), (globalThis.window = value366));
    }
  }),
  test('aiImageApi: grsai polls when non-JSON create response text contains task_id', async () => {
    const value375 = globalThis.fetch,
      handler25 = globalThis.setTimeout,
      value376 = globalThis.window,
      list39 = [];
    let count8 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value377, value378, ...args24) =>
          handler25(value377, Number(value378) > 0x1388 ? Number(value378) : 0, ...args24)),
        (globalThis.fetch = async (value379, dom80 = {}) => {
          const value380 = String(value379);
          if (value380 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (value380 === '/api/v2/proxy/image') {
            const value381 = JSON.parse(String(dom80.body || '{}')),
              value382 = String(value381.apiUrl || '');
            if (value382.endsWith('/v1/api/generate'))
              return makeTextResponse('status=success, task_id=task-grsai-plain-text');
            throw new Error('unexpected apiUrl: ' + value382);
          }
          if (value380.startsWith('/api/v2/proxy/task?')) {
            const proxyTaskApiUrl9 = getProxyTaskApiUrl(value380);
            return (
              (count8 += 1),
              assert.equal(
                proxyTaskApiUrl9,
                'https://api.grsai.example.com/v1/api/result?id=task-grsai-plain-text',
              ),
              makeJsonResponse({
                id: 'task-grsai-plain-text',
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/grsai-plain-text.png' }],
              })
            );
          }
          if (value380 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-plain-text.png' });
          throw new Error('unexpected fetch url: ' + value380);
        }));
      const { clearApiConfig: clearApiConfig75 } = await import('./configApi.js');
      clearApiConfig75();
      const { generateImage: generateImage30 } = await import('./aiImageApi.js'),
        value383 = await generateImage30(
          { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (value384) => list39.push(value384) },
        );
      (assert.equal(list39.length, 1),
        assert.equal(list39[0].taskId, 'task-grsai-plain-text'),
        assert.ok(count8 >= 1),
        assert.equal(value383.localPath, 'output/grsai-plain-text.png'));
    } finally {
      ((globalThis.fetch = value375), (globalThis.setTimeout = handler25), (globalThis.window = value376));
    }
  }),
  test('aiImageApi: ppio polls when create response has success and task_id', async () => {
    const value385 = globalThis.fetch,
      handler26 = globalThis.setTimeout,
      value386 = globalThis.window,
      list40 = [];
    let count9 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value387, value388, ...args25) =>
          handler26(value387, Number(value388) > 0x1388 ? Number(value388) : 0, ...args25)),
        (globalThis.fetch = async (value389, value390 = {}) => {
          const value391 = String(value389);
          if (value391 === '/api/config')
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: 'https://api.ppio.com', apiKey: 'k_ppio' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (value391 === '/api/v2/proxy/image')
            return makeTextResponse(JSON.stringify({ status: 'success', task_id: 'task-ppio-success-ack' }));
          if (value391.startsWith('/api/v2/proxy/task?'))
            return (
              (count9 += 1),
              makeJsonResponse({
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/ppio-success-ack.png' }],
              })
            );
          if (value391 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/ppio-success-ack.png' });
          throw new Error('unexpected fetch url: ' + value391);
        }));
      const { clearApiConfig: clearApiConfig76 } = await import('./configApi.js');
      clearApiConfig76();
      const { generateImage: generateImage31 } = await import('./aiImageApi.js'),
        value392 = await generateImage31(
          { provider: 'ppio', model: 'ppio/seedream-5.0-lite', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (value393) => list40.push(value393) },
        );
      (assert.equal(list40.length, 1),
        assert.equal(list40[0].taskId, 'task-ppio-success-ack'),
        assert.ok(count9 >= 1),
        assert.equal(value392.localPath, 'output/ppio-success-ack.png'));
    } finally {
      ((globalThis.fetch = value385), (globalThis.setTimeout = handler26), (globalThis.window = value386));
    }
  }),
  test('aiImageApi: provider/model mismatch rejects instead of GRSAI routing', async () => {
    const value394 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          ppio: { apiUrl: 'https://api.ppio.com', apiKey: 'k_ppio' },
          grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
        },
      });
      const { clearApiConfig: clearApiConfig77 } = await import('./configApi.js');
      clearApiConfig77();
      const { buildGenerateImageRequest: buildGenerateImageRequest37 } = await import('./aiImageApi.js');
      await assert.rejects(
        () =>
          buildGenerateImageRequest37({
            provider: 'grsai',
            model: 'ppio/seedream-5.0-lite',
            prompt: 'cat',
            inputUrls: [],
          }),
        /GRSAI image model API manifest missing: ppio\/seedream-5.0-lite/,
      );
    } finally {
      globalThis.fetch = value394;
    }
  }),
  test('aiImageApi: grsai 裸模型 + provider=runninghubwf 时按 provider 优先走 runninghubwf', async () => {
    const value395 = globalThis.fetch,
      handler27 = globalThis.setTimeout,
      value396 = globalThis.window;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value397, value398, ...args26) =>
          handler27(value397, Number(value398) > 0x1388 ? Number(value398) : 0, ...args26)),
        (globalThis.fetch = async (value399, value400 = {}) => {
          const value401 = String(value399);
          if (value401 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          throw new Error('unexpected fetch url: ' + value401);
        }));
      const { clearApiConfig: clearApiConfig78 } = await import('./configApi.js');
      clearApiConfig78();
      const { generateImage: generateImage32 } = await import('./aiImageApi.js');
      await assert.rejects(
        () =>
          generateImage32({
            provider: 'runninghubwf',
            model: 'nano-banana-pro-vt',
            prompt: 'cat',
            inputUrls: [],
          }),
        /RunningHUB 请求|RunningHUB/,
      );
    } finally {
      ((globalThis.fetch = value395), (globalThis.setTimeout = handler27), (globalThis.window = value396));
    }
  }),
  test('aiImageApi: calls onTaskMeta first when create response has task_id and immediate results', async () => {
    const value402 = globalThis.fetch,
      handler28 = globalThis.setTimeout,
      value403 = globalThis.window,
      list41 = [];
    let value404 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value405, value406, ...args27) =>
          handler28(value405, Number(value406) > 0x1388 ? Number(value406) : 0, ...args27)),
        (globalThis.fetch = async (value407) => {
          const value408 = String(value407);
          if (value408 === '/api/config')
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: 'https://api.ppio.com', apiKey: 'k_ppio' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (value408 === '/api/v2/proxy/image')
            return makeTextResponse(
              JSON.stringify({
                status: 'success',
                task_id: 'task-ppio-direct-result',
                results: [{ url: 'https://img.example.com/ppio-direct-result.png' }],
              }),
            );
          if (value408.startsWith('/api/v2/proxy/task?'))
            return (
              (value404 += 1),
              makeJsonResponse({
                status: 'success',
                results: [{ url: 'https://img.example.com/ppio-direct-result.png' }],
              })
            );
          if (value408 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/ppio-direct-result.png' });
          throw new Error('unexpected fetch url: ' + value408);
        }));
      const { clearApiConfig: clearApiConfig79 } = await import('./configApi.js');
      clearApiConfig79();
      const { generateImage: generateImage33 } = await import('./aiImageApi.js'),
        value409 = await generateImage33(
          { provider: 'ppio', model: 'ppio/seedream-5.0-lite', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (value410) => list41.push(value410) },
        );
      (assert.equal(list41.length, 1),
        assert.equal(list41[0].taskId, 'task-ppio-direct-result'),
        assert.equal(list41[0].provider, 'ppio'),
        assert.equal(value404, 0),
        assert.equal(value409.localPath, 'output/ppio-direct-result.png'),
        assert.equal(value409.imageUrl, '/output/ppio-direct-result.png'));
    } finally {
      ((globalThis.fetch = value402), (globalThis.setTimeout = handler28), (globalThis.window = value403));
    }
  }),
  test('aiImageApi: ppio extracts nested task field as task ID and polls', async () => {
    const value411 = globalThis.fetch,
      handler29 = globalThis.setTimeout,
      value412 = globalThis.window,
      list42 = [];
    let count10 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value413, value414, ...args28) =>
          handler29(value413, Number(value414) > 0x1388 ? Number(value414) : 0, ...args28)),
        (globalThis.fetch = async (value415) => {
          const value416 = String(value415);
          if (value416 === '/api/config')
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: 'https://api.ppio.com', apiKey: 'k_ppio' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (value416 === '/api/v2/proxy/image')
            return makeTextResponse(
              JSON.stringify({ data: { task: { id: 'task-ppio-nested-1', status: 'pending' } } }),
            );
          if (value416.startsWith('/api/v2/proxy/task?'))
            return (
              (count10 += 1),
              makeJsonResponse({
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/ppio-nested-1.png' }],
              })
            );
          if (value416 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/ppio-nested-1.png' });
          throw new Error('unexpected fetch url: ' + value416);
        }));
      const { clearApiConfig: clearApiConfig80 } = await import('./configApi.js');
      clearApiConfig80();
      const { generateImage: generateImage34 } = await import('./aiImageApi.js'),
        value417 = await generateImage34(
          { provider: 'ppio', model: 'ppio/seedream-5.0-lite', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (value418) => list42.push(value418) },
        );
      (assert.equal(list42.length, 1),
        assert.equal(list42[0].taskId, 'task-ppio-nested-1'),
        assert.equal(list42[0].provider, 'ppio'),
        assert.ok(count10 >= 1),
        assert.equal(value417.localPath, 'output/ppio-nested-1.png'),
        assert.equal(value417.imageUrl, '/output/ppio-nested-1.png'));
    } finally {
      ((globalThis.fetch = value411), (globalThis.setTimeout = handler29), (globalThis.window = value412));
    }
  }),
  test('aiImageApi: apimart polls when create response has success and task_id', async () => {
    const value419 = globalThis.fetch,
      handler30 = globalThis.setTimeout,
      value420 = globalThis.window,
      list43 = [];
    let count11 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value421, value422, ...args29) =>
          handler30(value421, Number(value422) > 0x1388 ? Number(value422) : 0, ...args29)),
        (globalThis.fetch = async (value423, value424 = {}) => {
          const value425 = String(value423);
          if (value425 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (value425 === '/api/v2/proxy/image')
            return makeTextResponse(
              JSON.stringify({ status: 'success', data: { task_id: 'task-apimart-success-ack' } }),
            );
          if (value425.startsWith('/api/v2/proxy/task?'))
            return (
              (count11 += 1),
              makeJsonResponse({
                status: 'success',
                results: [{ url: 'https://img.example.com/apimart-success-ack.png' }],
              })
            );
          if (value425 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/apimart-success-ack.png' });
          throw new Error('unexpected fetch url: ' + value425);
        }));
      const { clearApiConfig: clearApiConfig81 } = await import('./configApi.js');
      clearApiConfig81();
      const { generateImage: generateImage35 } = await import('./aiImageApi.js'),
        value426 = await generateImage35(
          { provider: 'apimart', model: 'apimart/nano-banana-2', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (value427) => list43.push(value427) },
        );
      (assert.equal(list43.length, 1),
        assert.equal(list43[0].taskId, 'task-apimart-success-ack'),
        assert.ok(count11 >= 1),
        assert.equal(value426.localPath, 'output/apimart-success-ack.png'));
    } finally {
      ((globalThis.fetch = value419), (globalThis.setTimeout = handler30), (globalThis.window = value420));
    }
  }),
  test('aiImageApi: apimart create response with invalid only id should not be accepted', async () => {
    const value428 = globalThis.fetch,
      handler31 = globalThis.setTimeout,
      value429 = globalThis.window,
      list44 = [];
    let count12 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value430, value431, ...args30) =>
          handler31(value430, Number(value431) > 0x1388 ? Number(value431) : 0, ...args30)),
        (globalThis.fetch = async (value432, value433 = {}) => {
          const value434 = String(value432);
          if (value434 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (value434 === '/api/v2/proxy/image')
            return makeTextResponse(
              JSON.stringify({
                status: 'success',
                data: { id: 'resp-apimart-only-id-1', status: 'submitted' },
              }),
            );
          if (value434.startsWith('/api/v2/proxy/task?'))
            return (
              (count12 += 1),
              makeJsonResponse({ code: 0x190, message: 'invalid task id' }, { status: 0x190 })
            );
          if (value434 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/apimart-only-id.png' });
          throw new Error('unexpected fetch url: ' + value434);
        }));
      const { clearApiConfig: clearApiConfig82 } = await import('./configApi.js');
      clearApiConfig82();
      const { generateImage: generateImage36 } = await import('./aiImageApi.js');
      (await assert.rejects(
        () =>
          generateImage36(
            { provider: 'apimart', model: 'apimart/nano-banana-2', prompt: 'cat', inputUrls: [] },
            { onTaskMeta: (value435) => list44.push(value435) },
          ),
        /APIMart|task|id|提取|解析/i,
      ),
        assert.equal(list44.length, 0),
        assert.ok(count12 >= 1));
    } finally {
      ((globalThis.fetch = value428), (globalThis.setTimeout = handler31), (globalThis.window = value429));
    }
  }),
  test('aiImageApi: grsai gpt-image-2 创建走 /v1/api/generate 且查询走 /v1/api/result', async () => {
    const value436 = globalThis.fetch,
      handler32 = globalThis.setTimeout,
      value437 = globalThis.window,
      list45 = [];
    let value438 = false,
      value439 = false;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value440, value441, ...args31) =>
          handler32(value440, Number(value441) > 0x1388 ? Number(value441) : 0, ...args31)),
        (globalThis.fetch = async (value442, dom81 = {}) => {
          const value443 = String(value442);
          if (value443 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com/v1/', apiKey: 'k_grsai' } },
            });
          if (value443 === '/api/v2/proxy/image') {
            const value444 = JSON.parse(String(dom81.body || '{}')),
              value445 = String(value444.apiUrl || '');
            if (value445.endsWith('/v1/api/generate'))
              return (
                (value438 = true),
                assert.equal(value444.model, 'gpt-image-2-vip'),
                assert.deepEqual(value444.images, []),
                assert.equal(value444.replyType, 'json'),
                assert.equal(value444.aspectRatio, '2880x2880'),
                assert.equal(value444.imageSize, undefined),
                makeTextResponse(
                  JSON.stringify({ status: 'pending', data: { task_id: 'task-grsai-gpt-image-2-1' } }),
                )
              );
            throw new Error('unexpected apiUrl: ' + value445);
          }
          if (value443.startsWith('/api/v2/proxy/task?')) {
            const proxyTaskApiUrl10 = getProxyTaskApiUrl(value443);
            return (
              (value439 = true),
              assert.equal(
                proxyTaskApiUrl10,
                'https://api.grsai.example.com/v1/api/result?id=task-grsai-gpt-image-2-1',
              ),
              makeJsonResponse({
                id: 'task-grsai-gpt-image-2-1',
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/grsai-gpt-image-2-final.png' }],
              })
            );
          }
          if (value443 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-gpt-image-2-final.png' });
          throw new Error('unexpected fetch url: ' + value443);
        }));
      const { clearApiConfig: clearApiConfig83 } = await import('./configApi.js');
      clearApiConfig83();
      const { generateImage: generateImage37 } = await import('./aiImageApi.js'),
        value446 = await generateImage37(
          {
            provider: 'grsai',
            model: 'gpt-image-2',
            mode: 'vip',
            prompt: 'cat',
            imageSize: '4K',
            inputUrls: [],
          },
          { onTaskMeta: (value447) => list45.push(value447) },
        );
      (assert.equal(value438, true),
        assert.equal(value439, true),
        assert.equal(list45.length, 1),
        assert.equal(list45[0].taskId, 'task-grsai-gpt-image-2-1'),
        assert.equal(list45[0].provider, 'grsai'),
        assert.equal(value446.localPath, 'output/grsai-gpt-image-2-final.png'),
        assert.equal(value446.imageUrl, '/output/grsai-gpt-image-2-final.png'));
    } finally {
      ((globalThis.fetch = value436), (globalThis.setTimeout = handler32), (globalThis.window = value437));
    }
  }),
  test('aiImageApi: grsai mixed image results preserve failed slot', async () => {
    const value448 = globalThis.fetch,
      handler33 = globalThis.setTimeout,
      value449 = globalThis.window,
      list46 = [];
    let value450 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value451, value452, ...args32) =>
          handler33(value451, Number(value452) > 0x1388 ? Number(value452) : 0, ...args32)),
        (globalThis.fetch = async (value453, dom82 = {}) => {
          const value454 = String(value453);
          if (value454 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (value454 === '/api/v2/proxy/image') {
            const value455 = JSON.parse(String(dom82.body || '{}')),
              value456 = String(value455.apiUrl || '');
            if (value456.endsWith('/v1/api/generate'))
              return makeTextResponse(
                JSON.stringify({ status: 'pending', data: { task_id: 'task-grsai-mixed-1' } }),
              );
            throw new Error('unexpected apiUrl: ' + value456);
          }
          if (value454.startsWith('/api/v2/proxy/task?')) {
            const proxyTaskApiUrl11 = getProxyTaskApiUrl(value454);
            return (
              assert.equal(
                proxyTaskApiUrl11,
                'https://api.grsai.example.com/v1/api/result?id=task-grsai-mixed-1',
              ),
              makeJsonResponse({
                id: 'task-grsai-mixed-1',
                status: 'succeeded',
                results: [
                  { status: 'failed', message: '内容违规' },
                  { url: 'https://img.example.com/grsai-mixed-a.png' },
                  { url: 'https://img.example.com/grsai-mixed-b.png' },
                  { url: 'https://img.example.com/grsai-mixed-c.png' },
                ],
              })
            );
          }
          if (value454 === '/api/v2/save_output_from_url')
            return ((value450 += 1), makeJsonResponse({ path: 'output/grsai-mixed-' + value450 + '.png' }));
          throw new Error('unexpected fetch url: ' + value454);
        }));
      const { clearApiConfig: clearApiConfig84 } = await import('./configApi.js');
      clearApiConfig84();
      const { generateImage: generateImage38 } = await import('./aiImageApi.js'),
        value457 = await generateImage38(
          {
            provider: 'grsai',
            model: 'gpt-image-2',
            mode: 'vip',
            prompt: 'cat',
            imageSize: '2K',
            batchSize: 1,
            inputUrls: [],
          },
          { onTaskMeta: (value458) => list46.push(value458) },
        );
      (assert.equal(list46.length, 1),
        assert.equal(list46[0].taskId, 'task-grsai-mixed-1'),
        assert.equal(value457?.isBatch, true),
        assert.equal(value457?.images?.length, 4),
        assert.equal(value457.images[0].error, '内容违规'),
        assert.equal(value457.images[0].imageUrl, ''),
        assert.equal(value457.images[1].localPath, 'output/grsai-mixed-1.png'),
        assert.equal(value457.images[2].localPath, 'output/grsai-mixed-2.png'),
        assert.equal(value457.images[3].localPath, 'output/grsai-mixed-3.png'),
        assert.equal(value450, 3));
    } finally {
      ((globalThis.fetch = value448), (globalThis.setTimeout = handler33), (globalThis.window = value449));
    }
  }),
  test('aiImageApi: apimart request_id should be probed and rejected when it is not a task id', async () => {
    const value459 = globalThis.fetch,
      handler34 = globalThis.setTimeout,
      value460 = globalThis.window,
      list47 = [];
    let value461 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value462, value463, ...args33) =>
          handler34(value462, Number(value463) > 0x1388 ? Number(value463) : 0, ...args33)),
        (globalThis.fetch = async (value464, value465 = {}) => {
          const value466 = String(value464);
          if (value466 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (value466 === '/api/v2/proxy/image')
            return makeTextResponse(
              JSON.stringify({
                status: 'success',
                data: { request_id: 'req-apimart-not-task', status: 'submitted' },
              }),
            );
          if (value466.startsWith('/api/v2/proxy/task?'))
            return (
              (value461 += 1),
              makeJsonResponse({ code: 0x190, message: 'Invalid task ID' }, { status: 0x190 })
            );
          if (value466 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/should-not-save.png' });
          throw new Error('unexpected fetch url: ' + value466);
        }));
      const { clearApiConfig: clearApiConfig85 } = await import('./configApi.js');
      clearApiConfig85();
      const { generateImage: generateImage39 } = await import('./aiImageApi.js');
      (await assert.rejects(
        () =>
          generateImage39(
            { provider: 'apimart', model: 'apimart/nano-banana-2', prompt: 'cat', inputUrls: [] },
            { onTaskMeta: (value467) => list47.push(value467) },
          ),
        /APIMart|task|id|提取|解析|图片地址/i,
      ),
        assert.equal(list47.length, 0),
        assert.equal(value461, 0));
    } finally {
      ((globalThis.fetch = value459), (globalThis.setTimeout = handler34), (globalThis.window = value460));
    }
  }),
  test('aiImageApi: apimart create response with only id probes task endpoint before polling', async () => {
    const value468 = globalThis.fetch,
      handler35 = globalThis.setTimeout,
      value469 = globalThis.window,
      list48 = [];
    let count13 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value470, value471, ...args34) =>
          handler35(value470, Number(value471) > 0x1388 ? Number(value471) : 0, ...args34)),
        (globalThis.fetch = async (value472, value473 = {}) => {
          const list49 = String(value472);
          if (list49 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (list49 === '/api/v2/proxy/image')
            return makeTextResponse(
              JSON.stringify({
                status: 'success',
                data: { id: 'task-apimart-only-id-valid', status: 'submitted' },
              }),
            );
          if (list49.startsWith('/api/v2/proxy/task?'))
            return (
              (count13 += 1),
              assert.ok(
                list49.includes(
                  encodeURIComponent(
                    'https://api.apimart.ai/v1/tasks/task-apimart-only-id-valid?language=zh',
                  ),
                ),
              ),
              makeJsonResponse(
                count13 === 1
                  ? { status: 'running' }
                  : {
                      status: 'success',
                      results: [{ url: 'https://img.example.com/apimart-only-id-valid.png' }],
                    },
              )
            );
          if (list49 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/apimart-only-id-valid.png' });
          throw new Error('unexpected fetch url: ' + list49);
        }));
      const { clearApiConfig: clearApiConfig86 } = await import('./configApi.js');
      clearApiConfig86();
      const { generateImage: generateImage40 } = await import('./aiImageApi.js'),
        value474 = await generateImage40(
          { provider: 'apimart', model: 'apimart/nano-banana-2', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (value475) => list48.push(value475) },
        );
      (assert.equal(list48.length, 1),
        assert.equal(list48[0].taskId, 'task-apimart-only-id-valid'),
        assert.ok(count13 >= 2),
        assert.equal(value474.localPath, 'output/apimart-only-id-valid.png'));
    } finally {
      ((globalThis.fetch = value468), (globalThis.setTimeout = handler35), (globalThis.window = value469));
    }
  }),
  test('aiImageApi: grsai stops immediately when polling returns sensitive content violation', async () => {
    const value476 = globalThis.fetch,
      handler36 = globalThis.setTimeout,
      value477 = globalThis.window,
      list50 = [];
    let value478 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value479, value480, ...args35) =>
          handler36(value479, Number(value480) > 0x1388 ? Number(value480) : 0, ...args35)),
        (globalThis.fetch = async (value481, dom83 = {}) => {
          const value482 = String(value481);
          if (value482 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (value482 === '/api/v2/proxy/image') {
            const value483 = JSON.parse(String(dom83.body || '{}')),
              value484 = String(value483.apiUrl || '');
            if (value484.endsWith('/v1/api/generate'))
              return makeTextResponse(
                JSON.stringify({ status: 'pending', data: { task_id: 'task-grsai-sensitive-1' } }),
              );
            throw new Error('unexpected apiUrl: ' + value484);
          }
          if (value482.startsWith('/api/v2/proxy/task?')) {
            const proxyTaskApiUrl12 = getProxyTaskApiUrl(value482);
            return (
              (value478 += 1),
              assert.equal(
                proxyTaskApiUrl12,
                'https://api.grsai.example.com/v1/api/result?id=task-grsai-sensitive-1',
              ),
              makeJsonResponse({
                status: 'pending',
                message:
                  'The input or output was flagged as sensitive. Please try again with different inputs.',
                data: { id: 'task-grsai-sensitive-1' },
              })
            );
          }
          if (value482 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/should-not-save.png' });
          throw new Error('unexpected fetch url: ' + value482);
        }));
      const { clearApiConfig: clearApiConfig87 } = await import('./configApi.js');
      clearApiConfig87();
      const { generateImage: generateImage41 } = await import('./aiImageApi.js');
      (await assert.rejects(
        () =>
          generateImage41(
            { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
            { onTaskMeta: (value485) => list50.push(value485) },
          ),
        /过滤|违规|sensitive/i,
      ),
        assert.equal(list50.length, 1),
        assert.equal(list50[0].taskId, 'task-grsai-sensitive-1'),
        assert.equal(value478, 1));
    } finally {
      ((globalThis.fetch = value476), (globalThis.setTimeout = handler36), (globalThis.window = value477));
    }
  }),
  test('aiImageApi: grsai 轮询只走 /v1/api/result 并最终落盘', async () => {
    const value486 = globalThis.fetch,
      handler37 = globalThis.setTimeout,
      value487 = globalThis.window,
      list51 = [];
    let value488 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (value489, value490, ...args36) =>
          handler37(value489, Number(value490) > 0x1388 ? Number(value490) : 0, ...args36)),
        (globalThis.fetch = async (value491, dom84 = {}) => {
          const value492 = String(value491);
          if (value492 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (value492 === '/api/v2/proxy/image') {
            const value493 = JSON.parse(String(dom84.body || '{}')),
              value494 = String(value493.apiUrl || '');
            if (value494.endsWith('/v1/api/generate'))
              return makeTextResponse(
                JSON.stringify({ status: 'pending', data: { task_id: 'task-grsai-probe-1' } }),
              );
            throw new Error('unexpected apiUrl: ' + value494);
          }
          if (value492.startsWith('/api/v2/proxy/task?')) {
            const proxyTaskApiUrl13 = getProxyTaskApiUrl(value492);
            return (
              (value488 += 1),
              assert.equal(
                proxyTaskApiUrl13,
                'https://api.grsai.example.com/v1/api/result?id=task-grsai-probe-1',
              ),
              makeJsonResponse({
                id: 'task-grsai-probe-1',
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/grsai-probe-final.png' }],
              })
            );
          }
          if (value492 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-probe-final.png' });
          throw new Error('unexpected fetch url: ' + value492);
        }));
      const { clearApiConfig: clearApiConfig88 } = await import('./configApi.js');
      clearApiConfig88();
      const { generateImage: generateImage42 } = await import('./aiImageApi.js'),
        value495 = await generateImage42(
          { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (value496) => list51.push(value496) },
        );
      (assert.equal(list51.length, 1),
        assert.equal(list51[0].taskId, 'task-grsai-probe-1'),
        assert.equal(value488, 1),
        assert.equal(value495.localPath, 'output/grsai-probe-final.png'),
        assert.equal(value495.imageUrl, '/output/grsai-probe-final.png'));
    } finally {
      ((globalThis.fetch = value486), (globalThis.setTimeout = handler37), (globalThis.window = value487));
    }
  }));
