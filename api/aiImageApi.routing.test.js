import test from 'node:test';
import assert from 'node:assert/strict';
function installFetchMockForConfig(_0x471bae) {
  globalThis.fetch = async (_0x5b6a1d) => {
    const _0x2922ee = String(_0x5b6a1d);
    if (_0x2922ee !== '/api/config') throw new Error('unexpected fetch url: ' + _0x2922ee);
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => _0x471bae,
      text: async () => JSON.stringify(_0x471bae),
    };
  };
}
(test('aiImageApi: grsai 无 apiKey 时抛出 AUTH_ERROR', async () => {
  const _0x59dbbd = globalThis.fetch;
  try {
    installFetchMockForConfig({
      providers: { grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' } },
    });
    const { clearApiConfig: _0x35ff74 } = await import('./configApi.js');
    _0x35ff74();
    const { buildGenerateImageRequest: _0x1ea7be } = await import('./aiImageApi.js');
    try {
      (await _0x1ea7be({ prompt: 'p', model: 'nano-banana-pro-vt' }), assert.fail('should throw'));
    } catch (_0x1660b2) {
      (assert.equal(_0x1660b2?.name, 'ApiError'),
        assert.equal(_0x1660b2?.type, 'AUTH_ERROR'),
        assert.equal(_0x1660b2?.provider, 'grsai'));
    }
  } finally {
    globalThis.fetch = _0x59dbbd;
  }
}),
  test('aiImageApi: ppio seedream branch uses proxy/image without requiring inputUrls', async () => {
    const _0x3b9f9d = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          ppio: { apiUrl: 'https://ppio.example.com/', apiKey: 'k_ppio' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: _0x474dbe } = await import('./configApi.js');
      _0x474dbe();
      const { buildGenerateImageRequest: _0x1163f3 } = await import('./aiImageApi.js'),
        _0x5793a2 = await _0x1163f3({ prompt: 'p', model: 'ppio/seedream-5.0-lite', aspectRatio: '16：9' });
      (assert.equal(_0x5793a2.url, '/api/v2/proxy/image'),
        assert.ok(String(_0x5793a2.body.apiUrl).includes('/v3/seedream-5.0-lite')),
        assert.equal(_0x5793a2.body.size, '2752x1536'),
        assert.equal(_0x5793a2.adapterTrace?.source, 'manifest'),
        assert.equal(_0x5793a2.adapterTrace?.executionId, 'ppio.model-api.seedream-5-lite.v1'));
    } finally {
      globalThis.fetch = _0x3b9f9d;
    }
  }),
  test('aiImageApi: volcengine seedream models use Ark images endpoint', async () => {
    const _0x56fa66 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_ark' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: _0x2d44d1 } = await import('./configApi.js');
      _0x2d44d1();
      const { buildGenerateImageRequest: _0x1eee59 } = await import('./aiImageApi.js'),
        _0x38db9c = await _0x1eee59({
          prompt: 'p',
          provider: 'volcengine',
          model: 'volcengine/seedream-5.0',
          aspectRatio: '16:9',
          imageSize: '2K',
          inputUrls: [],
        });
      (assert.equal(_0x38db9c.url, '/api/v2/proxy/image'),
        assert.equal(_0x38db9c.body.apiUrl, 'https://ark.cn-beijing.volces.com/api/v3/images/generations'),
        assert.equal(_0x38db9c.body.apiKey, 'k_ark'),
        assert.equal(_0x38db9c.body.model, 'doubao-seedream-5-0-260128'),
        assert.equal(_0x38db9c.body.size, '2848x1600'),
        assert.equal(_0x38db9c.body.response_format, 'url'),
        assert.equal(_0x38db9c.body.watermark, false),
        assert.equal(_0x38db9c.body.sequential_image_generation, 'disabled'),
        assert.equal(_0x38db9c.body.sequential_image_generation_options, undefined),
        assert.equal(_0x38db9c.adapterTrace?.executionId, 'volcengine.model-api.seedream-5.v1'));
      const _0x1a3435 = await _0x1eee59({
        prompt: 'p',
        provider: 'volcengine',
        model: 'volcengine/seedream-4.5',
        aspectRatio: '1:1',
        imageSize: '4K',
        batchSize: 4,
        inputUrls: [],
      });
      (assert.equal(_0x1a3435.body.model, 'doubao-seedream-4-5-251128'),
        assert.equal(_0x1a3435.body.size, '2880x2880'),
        assert.equal(_0x1a3435.body.sequential_image_generation, 'auto'),
        assert.equal(_0x1a3435.body.sequential_image_generation_options?.max_images, 4));
      const _0x29184d = await _0x1eee59({
        prompt: 'p',
        provider: 'volcengine',
        model: 'volcengine/seedream-4.0',
        aspectRatio: '3:2',
        imageSize: '1K',
        inputUrls: [],
      });
      (assert.equal(_0x29184d.body.model, 'doubao-seedream-4-0-250828'),
        assert.equal(_0x29184d.body.size, '1256x840'));
    } finally {
      globalThis.fetch = _0x56fa66;
    }
  }),
  test('aiImageApi: volcengine seedream reference images upload through free image host', async () => {
    const _0x4bf5a1 = globalThis.fetch,
      _0x8f6ab5 = [];
    try {
      globalThis.fetch = async (_0x2a2224, _0x2e937a = {}) => {
        const _0x486631 = String(_0x2a2224);
        if (_0x486631 === '/api/config')
          return makeJsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_ark' },
            },
          });
        if (_0x486631 === '/local/ref.png') return makeBlobResponse('seedream-ref-image', 'image/png');
        if (_0x486631.startsWith('/api/v2/proxy/upload?')) {
          assert.equal(_0x2e937a.headers?.Authorization, undefined);
          const _0x56a200 = new URL('http://local' + _0x486631).searchParams.get('apiUrl');
          assert.equal(_0x56a200, 'https://uguu.se/upload');
          const _0xf0ed8b = Object.fromEntries(_0x2e937a.body.entries());
          return (
            assert.ok(_0xf0ed8b['files[]']),
            _0x8f6ab5.push(await _0xf0ed8b['files[]'].text()),
            makeJsonResponse({ success: true, files: [{ url: 'https://uguu.se/uploaded/seedream-ref.png' }] })
          );
        }
        throw new Error('unexpected fetch url: ' + _0x486631);
      };
      const { clearApiConfig: _0x2fe53c } = await import('./configApi.js');
      _0x2fe53c();
      const { buildGenerateImageRequest: _0x51cc03 } = await import('./aiImageApi.js'),
        _0x398321 = await _0x51cc03({
          prompt: 'p',
          provider: 'volcengine',
          model: 'volcengine/seedream-4.0',
          aspectRatio: '1:1',
          imageSize: '2K',
          inputUrls: ['/local/ref.png'],
        });
      (assert.equal(_0x398321.url, '/api/v2/proxy/image'),
        assert.equal(_0x398321.body.apiUrl, 'https://ark.cn-beijing.volces.com/api/v3/images/generations'),
        assert.deepEqual(_0x398321.body.image, ['https://uguu.se/uploaded/seedream-ref.png']),
        assert.deepEqual(_0x8f6ab5, ['seedream-ref-image']));
    } finally {
      globalThis.fetch = _0x4bf5a1;
    }
  }),
  test('aiImageApi: volcengine direct image response with id does not poll', async () => {
    const _0x2dc6e7 = globalThis.fetch,
      _0x525366 = globalThis.window;
    let _0x57e90a = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (_0x1f462b) => {
          const _0x4ab169 = String(_0x1f462b);
          if (_0x4ab169 === '/api/config')
            return makeJsonResponse({
              providers: {
                volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_ark' },
                grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
              },
            });
          if (_0x4ab169 === '/api/v2/proxy/image')
            return makeTextResponse(
              JSON.stringify({
                id: 'ark-direct-response-1',
                created: 0x6a18a500,
                data: [{ url: 'https://ark.example.com/seedream.png' }],
              }),
            );
          if (_0x4ab169.startsWith('/api/v2/proxy/task?')) {
            _0x57e90a += 1;
            throw new Error('unexpected task poll: ' + _0x4ab169);
          }
          if (_0x4ab169 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/volcengine-direct.png' });
          throw new Error('unexpected fetch url: ' + _0x4ab169);
        }));
      const { clearApiConfig: _0x218b56 } = await import('./configApi.js');
      _0x218b56();
      const { generateImage: _0xe9449c } = await import('./aiImageApi.js'),
        _0x40368f = await _0xe9449c({
          prompt: 'cat',
          provider: 'volcengine',
          model: 'volcengine/seedream-4.0',
          inputUrls: [],
          aspectRatio: '1:1',
          imageSize: '2K',
        });
      (assert.equal(_0x57e90a, 0),
        assert.equal(_0x40368f.localPath, 'output/volcengine-direct.png'),
        assert.equal(_0x40368f.imageUrl, '/output/volcengine-direct.png'));
    } finally {
      ((globalThis.fetch = _0x2dc6e7), (globalThis.window = _0x525366));
    }
  }),
  test('aiImageApi: dreamina versioned model forwards modelVersion', async () => {
    const _0x6c10e0 = globalThis.fetch;
    try {
      installFetchMockForConfig({ providers: {} });
      const { clearApiConfig: _0x4c4d34 } = await import('./configApi.js');
      _0x4c4d34();
      const { buildGenerateImageRequest: _0x496265 } = await import('./aiImageApi.js'),
        _0x1aa135 = await _0x496265({
          prompt: 'p',
          provider: 'dreamina',
          model: 'dreamina/4.5',
          aspectRatio: '1:1',
          imageSize: '2K',
          inputUrls: [],
        });
      (assert.equal(_0x1aa135.url, '/api/v2/dreamina/text2image'),
        assert.equal(_0x1aa135.body.modelVersion, '4.5'),
        assert.equal(_0x1aa135.body.ratio, '1:1'),
        assert.equal(_0x1aa135.body.resolutionType, '2k'));
    } finally {
      globalThis.fetch = _0x6c10e0;
    }
  }));
function makeJsonResponse(_0x391c7b, _0x4c18a4 = 200) {
  return {
    ok: _0x4c18a4 >= 200 && _0x4c18a4 < 0x12c,
    status: _0x4c18a4,
    headers: {
      get(_0x49c03e) {
        return String(_0x49c03e || '').toLowerCase() === 'content-type' ? 'application/json' : null;
      },
    },
    json: async () => _0x391c7b,
    text: async () => JSON.stringify(_0x391c7b),
  };
}
function makeTextResponse(_0x406c84, _0x1ec24e = 200) {
  const _0x5dd6c9 = String(_0x406c84 || '');
  return {
    ok: _0x1ec24e >= 200 && _0x1ec24e < 0x12c,
    status: _0x1ec24e,
    headers: {
      get(_0x5b4628) {
        return String(_0x5b4628 || '').toLowerCase() === 'content-type' ? 'text/plain' : null;
      },
    },
    json: async () => JSON.parse(_0x5dd6c9),
    text: async () => _0x5dd6c9,
  };
}
function makeBlobResponse(_0x207387, _0x41171e = 'image/png', _0x19180a = 200) {
  return new Response(new Blob([String(_0x207387 || '')], { type: _0x41171e }), {
    status: _0x19180a,
    headers: { 'Content-Type': _0x41171e },
  });
}
function makeTextResponseWithHeaders(_0x28bd64, _0x536fb1 = {}, _0x398c14 = 200) {
  const _0x1473de = String(_0x28bd64 || ''),
    _0x3a2d8a = Object.fromEntries(
      Object.entries(_0x536fb1 || {}).map(([_0x236dc5, _0x4c79f5]) => [
        String(_0x236dc5 || '').toLowerCase(),
        String(_0x4c79f5 || ''),
      ]),
    );
  return {
    ok: _0x398c14 >= 200 && _0x398c14 < 0x12c,
    status: _0x398c14,
    headers: {
      get(_0x3c7638) {
        const _0x5c2ec1 = String(_0x3c7638 || '').toLowerCase();
        if (_0x5c2ec1 === 'content-type') return 'text/plain';
        return _0x3a2d8a[_0x5c2ec1] || null;
      },
    },
    json: async () => JSON.parse(_0x1473de),
    text: async () => _0x1473de,
  };
}
function getProxyTaskApiUrl(_0xe9a908) {
  const _0x28e23e = new URL(String(_0xe9a908 || ''), 'http://localhost');
  return _0x28e23e.searchParams.get('apiUrl') || '';
}
(test('aiImageApi: dreamina image2image with auto ratio does not forward ratio', async () => {
  const _0x4135c7 = globalThis.fetch;
  try {
    installFetchMockForConfig({ providers: {} });
    const { clearApiConfig: _0x973742 } = await import('./configApi.js');
    _0x973742();
    const { buildGenerateImageRequest: _0x3bf695 } = await import('./aiImageApi.js'),
      _0x132b53 = await _0x3bf695({
        prompt: 'p',
        provider: 'dreamina',
        model: 'dreamina/5.0',
        aspectRatio: 'auto',
        imageSize: '4K',
        inputUrls: ['/data/uploads/a.png'],
      });
    (assert.equal(_0x132b53.url, '/api/v2/dreamina/image2image'),
      assert.ok(!Object.prototype.hasOwnProperty.call(_0x132b53.body, 'ratio')),
      assert.equal(_0x132b53.body.modelVersion, '5.0'),
      assert.equal(_0x132b53.body.resolutionType, '4k'));
  } finally {
    globalThis.fetch = _0x4135c7;
  }
}),
  test('aiImageApi: dreamina text2image with auto ratio forwards 1:1', async () => {
    const _0x524c14 = globalThis.fetch;
    try {
      installFetchMockForConfig({ providers: {} });
      const { clearApiConfig: _0x400442 } = await import('./configApi.js');
      _0x400442();
      const { buildGenerateImageRequest: _0x5c46bf } = await import('./aiImageApi.js'),
        _0x54c059 = await _0x5c46bf({
          prompt: 'p',
          provider: 'dreamina',
          model: 'dreamina/4.1',
          aspectRatio: 'auto',
          inputUrls: [],
        });
      (assert.equal(_0x54c059.url, '/api/v2/dreamina/text2image'),
        assert.equal(_0x54c059.body.ratio, '1:1'),
        assert.equal(_0x54c059.body.modelVersion, '4.1'));
    } finally {
      globalThis.fetch = _0x524c14;
    }
  }),
  test('aiImageApi: grsai suppressAspectRatio=true 时不透传 aspectRatio', async () => {
    const _0x5441b7 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: 'k_grsai' } },
      });
      const { clearApiConfig: _0x4f112f } = await import('./configApi.js');
      _0x4f112f();
      const { buildGenerateImageRequest: _0x1022d9 } = await import('./aiImageApi.js'),
        _0x54f48f = await _0x1022d9({
          prompt: 'p',
          provider: 'grsai',
          model: 'nano-banana-pro-vt',
          aspectRatio: '16:9',
          suppressAspectRatio: true,
          inputUrls: [],
        });
      (assert.equal(_0x54f48f.url, '/api/v2/proxy/image'),
        assert.equal(_0x54f48f.body.aspectRatio, undefined),
        assert.deepEqual(_0x54f48f.body.images, []),
        assert.equal(_0x54f48f.body.replyType, 'json'));
    } finally {
      globalThis.fetch = _0x5441b7;
    }
  }),
  test('aiImageApi: grsai gpt-image-2 uses official /v1/api/generate body shape', async () => {
    const _0x21a746 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: 'k_grsai' } },
      });
      const { clearApiConfig: _0xa0543c } = await import('./configApi.js');
      _0xa0543c();
      const { buildGenerateImageRequest: _0x27c452 } = await import('./aiImageApi.js'),
        _0x6422 = await _0x27c452({
          prompt: 'p',
          provider: 'grsai',
          model: 'gpt-image-2',
          mode: 'normal',
          aspectRatio: '9:21',
          imageSize: '4K',
          inputUrls: [],
        });
      (assert.equal(_0x6422.url, '/api/v2/proxy/image'),
        assert.equal(_0x6422.body.apiUrl, 'https://api.grsai.example.com/v1/api/generate'),
        assert.equal(_0x6422.body.model, 'gpt-image-2'),
        assert.deepEqual(_0x6422.body.images, []),
        assert.equal(_0x6422.body.replyType, 'json'),
        assert.equal(_0x6422.body.imageSize, undefined),
        assert.equal(_0x6422.body.aspectRatio, '832x1920'));
      const _0x4fdcd1 = await _0x27c452({
        prompt: 'p',
        provider: 'grsai',
        model: 'gpt-image-2',
        mode: 'vip',
        aspectRatio: '2:1',
        imageSize: '4K',
        inputUrls: [],
      });
      (assert.equal(_0x4fdcd1.body.apiUrl, 'https://api.grsai.example.com/v1/api/generate'),
        assert.equal(_0x4fdcd1.body.model, 'gpt-image-2-vip'),
        assert.deepEqual(_0x4fdcd1.body.images, []),
        assert.equal(_0x4fdcd1.body.replyType, 'json'),
        assert.equal(_0x4fdcd1.body.imageSize, undefined),
        assert.equal(_0x4fdcd1.body.aspectRatio, '3840x1920'));
    } finally {
      globalThis.fetch = _0x21a746;
    }
  }),
  test('aiImageApi: grsai missing manifest rejects instead of manual request fallback', async () => {
    const _0x28b67e = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: 'k_grsai' } },
      });
      const { clearApiConfig: _0x14e6ac } = await import('./configApi.js');
      _0x14e6ac();
      const { buildGenerateImageRequest: _0x7618a7 } = await import('./aiImageApi.js');
      await assert.rejects(
        () => _0x7618a7({ prompt: 'p', provider: 'grsai', model: 'grsai/unregistered-model', inputUrls: [] }),
        /GRSAI image model API manifest missing: grsai\/unregistered-model/,
      );
    } finally {
      globalThis.fetch = _0x28b67e;
    }
  }),
  test('aiImageApi: grsai nano-banana manifest builds request', async () => {
    const _0x53b63a = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: 'k_grsai' } },
      });
      const { clearApiConfig: _0x364975 } = await import('./configApi.js');
      _0x364975();
      const { buildGenerateImageRequest: _0x510667 } = await import('./aiImageApi.js'),
        _0x3a149e = await _0x510667({
          prompt: 'p',
          provider: 'grsai',
          model: 'nano-banana-2',
          aspectRatio: '16:9',
          imageSize: '4K',
          batchSize: 2,
          inputUrls: [],
        });
      (assert.equal(_0x3a149e.url, '/api/v2/proxy/image'),
        assert.equal(_0x3a149e.body.apiUrl, 'https://api.grsai.example.com/v1/api/generate'),
        assert.equal(_0x3a149e.body.apiKey, 'k_grsai'),
        assert.equal(_0x3a149e.body.model, 'nano-banana-2'),
        assert.equal(_0x3a149e.body.prompt, 'p'),
        assert.deepEqual(_0x3a149e.body.images, []),
        assert.equal(_0x3a149e.body.replyType, 'json'),
        assert.equal(_0x3a149e.body.imageSize, '2K'),
        assert.equal(_0x3a149e.body.aspectRatio, '16:9'),
        assert.equal(_0x3a149e.body.batchSize, undefined),
        assert.equal(_0x3a149e.adapterTrace?.source, 'manifest'),
        assert.equal(_0x3a149e.adapterTrace?.executionId, 'grsai.model-api.nano-banana-2.v1'));
    } finally {
      globalThis.fetch = _0x53b63a;
    }
  }),
  test('aiImageApi: grsai nano-banana request uses documented size and ratio enums', async () => {
    const _0x2f3eed = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: 'k_grsai' } },
      });
      const { clearApiConfig: _0x25cd24 } = await import('./configApi.js');
      _0x25cd24();
      const { buildGenerateImageRequest: _0x17b9f3 } = await import('./aiImageApi.js'),
        _0xbbdeb3 = await _0x17b9f3({
          prompt: 'p',
          provider: 'grsai',
          model: 'nano-banana',
          aspectRatio: '自适应',
          imageSize: '3K',
          inputUrls: [],
        });
      (assert.equal(_0xbbdeb3.body.imageSize, '2K'), assert.equal(_0xbbdeb3.body.aspectRatio, 'auto'));
      const _0x4608e4 = await _0x17b9f3({
        prompt: 'p',
        provider: 'grsai',
        model: 'nano-banana-pro',
        aspectRatio: '1:8',
        imageSize: 'bogus',
        inputUrls: [],
      });
      (assert.equal(_0x4608e4.body.imageSize, '2K'), assert.equal(_0x4608e4.body.aspectRatio, '9:16'));
      const _0x1509d6 = await _0x17b9f3({
        prompt: 'p',
        provider: 'grsai',
        model: 'nano-banana-pro',
        mode: 'vip',
        aspectRatio: '16:9',
        imageSize: '4K',
        inputUrls: [],
      });
      (assert.equal(_0x1509d6.body.model, 'nano-banana-pro-4k-vip'),
        assert.equal(_0x1509d6.body.imageSize, '4K'),
        assert.equal(_0x1509d6.body.aspectRatio, '16:9'));
      const _0x15116a = await _0x17b9f3({
        prompt: 'p',
        provider: 'grsai',
        model: 'nano-banana-2',
        aspectRatio: '1:8',
        imageSize: '4K',
        inputUrls: [],
      });
      (assert.equal(_0x15116a.body.imageSize, '2K'), assert.equal(_0x15116a.body.aspectRatio, '1:8'));
      const _0x131704 = await _0x17b9f3({
        prompt: 'p',
        provider: 'grsai',
        model: 'nano-banana-2',
        mode: 'cl',
        aspectRatio: '1:8',
        imageSize: '4K',
        inputUrls: [],
      });
      (assert.equal(_0x131704.body.model, 'nano-banana-2-4k-cl'),
        assert.equal(_0x131704.body.imageSize, '4K'),
        assert.equal(_0x131704.body.aspectRatio, '1:8'));
    } finally {
      globalThis.fetch = _0x2f3eed;
    }
  }),
  test('aiImageApi: apimart suppressAspectRatio=true 时不透传 size', async () => {
    const _0x32bd1b = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: _0x316752 } = await import('./configApi.js');
      _0x316752();
      const { buildGenerateImageRequest: _0x328077 } = await import('./aiImageApi.js'),
        _0x29abe3 = await _0x328077({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/nano-banana-pro',
          aspectRatio: '16:9',
          suppressAspectRatio: true,
          inputUrls: [],
        });
      (assert.equal(_0x29abe3.url, '/api/v2/proxy/image'), assert.equal(_0x29abe3.body.size, undefined));
    } finally {
      globalThis.fetch = _0x32bd1b;
    }
  }),
  test('aiImageApi: APIMart routeId domestic2 builds aishuch image endpoint', async () => {
    const _0x8df5f1 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { routeId: 'domestic2', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: _0x458a5f } = await import('./configApi.js');
      _0x458a5f();
      const { buildGenerateImageRequest: _0x3eac47 } = await import('./aiImageApi.js'),
        _0x17935d = await _0x3eac47({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/nano-banana-2',
          aspectRatio: '16:9',
          inputUrls: [],
        });
      (assert.equal(_0x17935d.url, '/api/v2/proxy/image'),
        assert.equal(_0x17935d.body.apiUrl, 'https://api.aishuch.com/v1/images/generations'));
    } finally {
      globalThis.fetch = _0x8df5f1;
    }
  }),
  test('aiImageApi: apimart gpt-image-2 4K uses supported size values', async () => {
    const _0x5dcb28 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: _0x139cd3 } = await import('./configApi.js');
      _0x139cd3();
      const { buildGenerateImageRequest: _0x5206b3 } = await import('./aiImageApi.js'),
        _0x479bc0 = await _0x5206b3({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/gpt-image-2',
          aspectRatio: '9:21',
          imageSize: '4K',
          inputUrls: [],
        });
      (assert.equal(_0x479bc0.body.model, 'gpt-image-2'),
        assert.equal(_0x479bc0.body.resolution, '4k'),
        assert.equal(_0x479bc0.body.size, '9:21'),
        assert.equal(_0x479bc0.body.n, 1),
        assert.equal(_0x479bc0.body.quality, undefined),
        assert.equal(_0x479bc0.body.official_fallback, undefined));
      const _0x3218fd = await _0x5206b3({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/gpt-image-2',
        aspectRatio: '1:1',
        imageSize: '4K',
        inputUrls: [],
      });
      (assert.equal(_0x3218fd.body.resolution, '4k'),
        assert.equal(_0x3218fd.body.size, '16:9'),
        assert.equal(_0x3218fd.body.n, 1),
        assert.equal(_0x3218fd.body.quality, undefined));
      const _0x83bb50 = await _0x5206b3({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/gpt-image-2',
        mode: 'official',
        aspectRatio: '2:1',
        imageSize: '4K',
        batchSize: 4,
        inputUrls: [],
      });
      (assert.equal(_0x83bb50.body.model, 'gpt-image-2-official'),
        assert.equal(_0x83bb50.body.resolution, '4k'),
        assert.equal(_0x83bb50.body.size, '2:1'),
        assert.equal(_0x83bb50.body.n, 1),
        assert.equal(_0x83bb50.body.quality, 'medium'),
        assert.equal(_0x83bb50.body.official_fallback, undefined));
      const _0x14d4a5 = await _0x5206b3({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/gpt-image-2',
        mode: 'official',
        quality: 'high',
        aspectRatio: '2:1',
        imageSize: '4K',
        inputUrls: [],
      });
      (assert.equal(_0x14d4a5.body.model, 'gpt-image-2-official'),
        assert.equal(_0x14d4a5.body.quality, 'high'));
    } finally {
      globalThis.fetch = _0x5dcb28;
    }
  }),
  test('aiImageApi: apimart qwen-image-2.0 uses documented model, size, resolution, and n', async () => {
    const _0x5bb84d = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: _0xbdd067 } = await import('./configApi.js');
      _0xbdd067();
      const { buildGenerateImageRequest: _0x198892 } = await import('./aiImageApi.js'),
        _0x5e9da2 = await _0x198892({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/qwen-image-2.0',
          mode: 'standard',
          aspectRatio: '16:9',
          imageSize: '2K',
          inputUrls: [],
        });
      (assert.equal(_0x5e9da2.body.model, 'qwen-image-2.0'),
        assert.equal(_0x5e9da2.body.resolution, '2K'),
        assert.equal(_0x5e9da2.body.size, '16:9'),
        assert.equal(_0x5e9da2.body.n, 1),
        assert.equal(_0x5e9da2.body.official_fallback, undefined),
        assert.equal(_0x5e9da2.adapterTrace?.executionId, 'apimart.model-api.qwen-image-2.v1'));
      const _0x2d87f0 = await _0x198892({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/qwen-image-2.0',
        mode: 'pro',
        aspectRatio: '5:4',
        imageSize: '4K',
        batchSize: 9,
        inputUrls: [],
      });
      (assert.equal(_0x2d87f0.body.model, 'qwen-image-2.0-pro'),
        assert.equal(_0x2d87f0.body.resolution, '1K'),
        assert.equal(_0x2d87f0.body.size, '4:3'),
        assert.equal(_0x2d87f0.body.n, 6));
      const _0x351543 = await _0x198892({
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
      (assert.equal(_0x351543.body.model, 'qwen-image-2.0'),
        assert.equal(_0x351543.body.resolution, '2K'),
        assert.equal(_0x351543.body.size, '16:9'),
        assert.notEqual(_0x351543.body.size, '自适应'),
        assert.notEqual(_0x351543.body.size, 'auto'),
        assert.equal(_0x351543.body.n, 2));
    } finally {
      globalThis.fetch = _0x5bb84d;
    }
  }),
  test('aiImageApi: apimart z-image-turbo uses documented body without n', async () => {
    const _0x109227 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: _0x498d0d } = await import('./configApi.js');
      _0x498d0d();
      const { buildGenerateImageRequest: _0x1d2c75 } = await import('./aiImageApi.js'),
        _0x4b2cdf = await _0x1d2c75({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/z-image-turbo',
          aspectRatio: '16:9',
          imageSize: '2K',
          inputUrls: [],
        });
      (assert.equal(_0x4b2cdf.body.model, 'z-image-turbo'),
        assert.equal(_0x4b2cdf.body.resolution, '2K'),
        assert.equal(_0x4b2cdf.body.size, '16:9'),
        assert.equal(_0x4b2cdf.body.prompt_extend, false),
        assert.equal(_0x4b2cdf.body.n, undefined),
        assert.equal(_0x4b2cdf.body.image_urls, undefined),
        assert.equal(_0x4b2cdf.adapterTrace?.executionId, 'apimart.model-api.z-image-turbo.v1'));
      const _0x24fd82 = await _0x1d2c75({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/z-image-turbo',
        aspectRatio: '5:4',
        imageSize: '4K',
        batchSize: 4,
        prompt_extend: 'true',
        inputUrls: ['https://img.example.com/ref.png'],
      });
      (assert.equal(_0x24fd82.body.model, 'z-image-turbo'),
        assert.equal(_0x24fd82.body.resolution, '1K'),
        assert.equal(_0x24fd82.body.size, '4:3'),
        assert.equal(_0x24fd82.body.prompt_extend, true),
        assert.equal(_0x24fd82.body.n, undefined),
        assert.equal(_0x24fd82.body.image_urls, undefined));
      const _0x25c024 = await _0x1d2c75({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/z-image-turbo',
        aspectRatio: '自适应',
        resolvedRatioLabel: '16:9',
        imageSize: '2K',
        batchSize: 4,
        inputUrls: [],
      });
      (assert.equal(_0x25c024.body.size, '16:9'),
        assert.notEqual(_0x25c024.body.size, '自适应'),
        assert.notEqual(_0x25c024.body.size, 'auto'),
        assert.equal(_0x25c024.body.n, undefined));
    } finally {
      globalThis.fetch = _0x109227;
    }
  }),
  test('aiImageApi: apimart wan2.7-image uses documented model, inputs, and n', async () => {
    const _0x4570dd = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: _0x5e9d77 } = await import('./configApi.js');
      _0x5e9d77();
      const { buildGenerateImageRequest: _0x3dc7cc } = await import('./aiImageApi.js'),
        _0x1cb4b9 = await _0x3dc7cc({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/wan2.7-image',
          mode: 'standard',
          aspectRatio: '16:9',
          imageSize: '4K',
          batchSize: 4,
          inputUrls: [],
        });
      (assert.equal(_0x1cb4b9.body.model, 'wan2.7-image'),
        assert.equal(_0x1cb4b9.body.resolution, '2K'),
        assert.equal(_0x1cb4b9.body.size, '16:9'),
        assert.equal(_0x1cb4b9.body.n, 4),
        assert.equal(_0x1cb4b9.body.thinking_mode, true),
        assert.equal(_0x1cb4b9.body.image_urls, undefined),
        assert.equal(_0x1cb4b9.adapterTrace?.executionId, 'apimart.model-api.wan2-7-image.v1'));
      const _0x29bd44 = await _0x3dc7cc({
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
      (assert.equal(_0x29bd44.body.model, 'wan2.7-image-pro'),
        assert.equal(_0x29bd44.body.resolution, '4K'),
        assert.equal(_0x29bd44.body.size, '4:3'),
        assert.equal(_0x29bd44.body.n, 4),
        assert.equal(_0x29bd44.body.thinking_mode, false));
      const _0x29fcae = await _0x3dc7cc({
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
      (assert.equal(_0x29fcae.body.model, 'wan2.7-image-pro'),
        assert.equal(_0x29fcae.body.resolution, '2K'),
        assert.equal(_0x29fcae.body.size, '9:16'),
        assert.equal(_0x29fcae.body.n, 2),
        assert.equal(_0x29fcae.body.thinking_mode, true),
        assert.deepEqual(_0x29fcae.body.image_urls, [
          'https://cdn.apimart.ai/ref-a.png',
          'https://cdn.apimart.ai/ref-b.png',
        ]),
        assert.notEqual(_0x29fcae.body.size, '自适应'),
        assert.notEqual(_0x29fcae.body.size, 'auto'));
    } finally {
      globalThis.fetch = _0x4570dd;
    }
  }),
  test('aiImageApi: apimart nano-banana-2 supports extra size ratios', async () => {
    const _0x5ab533 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: _0x3aceb4 } = await import('./configApi.js');
      _0x3aceb4();
      const { buildGenerateImageRequest: _0x26c6cd } = await import('./aiImageApi.js'),
        _0x4ead7f = await _0x26c6cd({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/nano-banana-2',
          aspectRatio: '1:8',
          imageSize: '2K',
          inputUrls: [],
        });
      (assert.equal(_0x4ead7f.body.model, 'gemini-3.1-flash-image-preview'),
        assert.equal(_0x4ead7f.body.resolution, '2K'),
        assert.equal(_0x4ead7f.body.size, '1:8'),
        assert.equal(_0x4ead7f.body.n, 1),
        assert.equal(_0x4ead7f.body.google_search, false),
        assert.equal(_0x4ead7f.body.google_image_search, false),
        assert.equal(_0x4ead7f.body.official_fallback, undefined),
        assert.equal(_0x4ead7f.adapterTrace?.source, 'manifest'),
        assert.equal(_0x4ead7f.adapterTrace?.executionId, 'apimart.model-api.nano-banana-2.v1'));
      const _0x4cb256 = await _0x26c6cd({
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
      (assert.equal(_0x4cb256.body.model, 'gemini-3.1-flash-image-preview-official'),
        assert.equal(_0x4cb256.body.resolution, '4K'),
        assert.equal(_0x4cb256.body.size, '16:9'),
        assert.equal(_0x4cb256.body.n, 1),
        assert.equal(_0x4cb256.body.google_search, true),
        assert.equal(_0x4cb256.body.google_image_search, true),
        assert.equal(_0x4cb256.body.official_fallback, undefined));
      const _0x1687a5 = await _0x26c6cd({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/nano-banana-2',
        aspectRatio: '1:1',
        imageSize: '2K',
        google_search: false,
        google_image_search: true,
        inputUrls: [],
      });
      (assert.equal(_0x1687a5.body.google_search, true),
        assert.equal(_0x1687a5.body.google_image_search, true));
      const _0x1cde16 = await _0x26c6cd({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/nano-banana-2',
        aspectRatio: '1:1',
        imageSize: '0.5K',
        inputUrls: [],
      });
      (assert.equal(_0x1cde16.body.resolution, '2K'), assert.equal(_0x1cde16.body.size, '1:1'));
      const _0x42b115 = await _0x26c6cd({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/nano-banana-2',
        aspectRatio: '1:1',
        imageSize: '3K',
        inputUrls: [],
      });
      assert.equal(_0x42b115.body.resolution, '2K');
    } finally {
      globalThis.fetch = _0x5ab533;
    }
  }),
  test('aiImageApi: apimart nano-banana-pro supports mode and fixed n=1', async () => {
    const _0x5c13a0 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: _0x514169 } = await import('./configApi.js');
      _0x514169();
      const { buildGenerateImageRequest: _0x55a599 } = await import('./aiImageApi.js'),
        _0x21386c = await _0x55a599({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/nano-banana-pro',
          mode: 'official',
          aspectRatio: '21:9',
          imageSize: '4K',
          batchSize: 4,
          inputUrls: [],
        });
      (assert.equal(_0x21386c.body.model, 'gemini-3-pro-image-preview-official'),
        assert.equal(_0x21386c.body.resolution, '4K'),
        assert.equal(_0x21386c.body.size, '21:9'),
        assert.equal(_0x21386c.body.n, 1),
        assert.equal(_0x21386c.body.official_fallback, undefined),
        assert.equal(_0x21386c.adapterTrace?.executionId, 'apimart.model-api.nano-banana-pro.v1'));
      const _0x39b7de = await _0x55a599({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/nano-banana-pro',
        aspectRatio: '1:1',
        imageSize: '3K',
        batchSize: 9,
        inputUrls: [],
      });
      (assert.equal(_0x39b7de.body.model, 'gemini-3-pro-image-preview'),
        assert.equal(_0x39b7de.body.resolution, '2K'),
        assert.equal(_0x39b7de.body.n, 1));
    } finally {
      globalThis.fetch = _0x5c13a0;
    }
  }),
  test('aiImageApi: apimart nano-banana supports official mode and 1K-only resolution', async () => {
    const _0x23780e = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: _0xe9f2e1 } = await import('./configApi.js');
      _0xe9f2e1();
      const { buildGenerateImageRequest: _0x5c84b0 } = await import('./aiImageApi.js'),
        _0x13be7 = await _0x5c84b0({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/nano-banana-dot',
          mode: 'official',
          aspectRatio: '21:9',
          imageSize: '4K',
          batchSize: 4,
          inputUrls: [],
        });
      (assert.equal(_0x13be7.body.model, 'gemini-2.5-flash-image-preview-official'),
        assert.equal(_0x13be7.body.resolution, '1K'),
        assert.equal(_0x13be7.body.size, '21:9'),
        assert.equal(_0x13be7.body.n, 1),
        assert.equal(_0x13be7.body.official_fallback, undefined),
        assert.equal(_0x13be7.adapterTrace?.executionId, 'apimart.model-api.nano-banana-dot.v1'));
      const _0x37b680 = await _0x5c84b0({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/nano-banana-dot',
        aspectRatio: '1:1',
        imageSize: '3K',
        batchSize: 9,
        inputUrls: [],
      });
      (assert.equal(_0x37b680.body.model, 'gemini-2.5-flash-image-preview'),
        assert.equal(_0x37b680.body.resolution, '1K'),
        assert.equal(_0x37b680.body.n, 1));
    } finally {
      globalThis.fetch = _0x23780e;
    }
  }),
  test('aiImageApi: apimart seedream request uses documented size/resolution', async () => {
    const _0x1ce933 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: _0x40d555 } = await import('./configApi.js');
      _0x40d555();
      const { buildGenerateImageRequest: _0x51a63a } = await import('./aiImageApi.js'),
        _0x11b6e7 = await _0x51a63a({
          prompt: 'p',
          provider: 'apimart',
          model: 'apimart/seedream-4.5',
          aspectRatio: '16:9',
          imageSize: '2K',
          batchSize: 4,
          inputUrls: [],
        });
      (assert.equal(_0x11b6e7.url, '/api/v2/proxy/image'),
        assert.equal(_0x11b6e7.body.model, 'doubao-seedream-4.5'),
        assert.equal(_0x11b6e7.body.size, '16:9'),
        assert.equal(_0x11b6e7.body.resolution, '2K'),
        assert.equal(_0x11b6e7.body.n, 1),
        assert.equal(_0x11b6e7.body.width, undefined),
        assert.equal(_0x11b6e7.body.height, undefined));
      const _0x1a4ef4 = await _0x51a63a({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/seedream-4.0',
        aspectRatio: '9:21',
        imageSize: '1K',
        batchSize: 4,
        inputUrls: [],
      });
      (assert.equal(_0x1a4ef4.body.model, 'doubao-seedream-4.0'),
        assert.equal(_0x1a4ef4.body.size, '9:21'),
        assert.equal(_0x1a4ef4.body.resolution, '1K'),
        assert.equal(_0x1a4ef4.body.n, 1));
      const _0x44efb5 = await _0x51a63a({
        prompt: 'p',
        provider: 'apimart',
        model: 'apimart/seedream-5.0-lite',
        aspectRatio: '21:9',
        imageSize: '3K',
        batchSize: 4,
        inputUrls: [],
      });
      (assert.equal(_0x44efb5.body.model, 'doubao-seedream-5.0-lite'),
        assert.equal(_0x44efb5.body.size, '21:9'),
        assert.equal(_0x44efb5.body.resolution, '3K'),
        assert.equal(_0x44efb5.body.n, 1));
    } finally {
      globalThis.fetch = _0x1ce933;
    }
  }),
  test('aiImageApi: runninghub-model branch uses proxy/image', async () => {
    const _0x406bd4 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: _0x5f1dd7 } = await import('./configApi.js');
      _0x5f1dd7();
      const { buildGenerateImageRequest: _0x5b20b9 } = await import('./aiImageApi.js'),
        _0xe975a2 = await _0x5b20b9({ prompt: 'p', model: 'runninghub-model/rhart-image-v1', inputUrls: [] });
      (assert.equal(_0xe975a2.url, '/api/v2/proxy/image'),
        assert.ok(String(_0xe975a2.body.apiUrl).includes('/openapi/v2/rhart-image-v1/')),
        assert.equal(_0xe975a2.adapterTrace?.source, 'manifest'),
        assert.equal(_0xe975a2.adapterTrace?.executionId, 'runninghub.model-api.rhart-image-v1.v1'));
    } finally {
      globalThis.fetch = _0x406bd4;
    }
  }),
  test('aiImageApi: runninghub-model gpt-image-2 无参考图走 text-to-image 且透传 resolution', async () => {
    const _0x39e0f1 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: _0x5e3d32 } = await import('./configApi.js');
      _0x5e3d32();
      const { buildGenerateImageRequest: _0x54e1d8 } = await import('./aiImageApi.js'),
        _0x2ba754 = await _0x54e1d8({
          prompt: 'p',
          model: 'runninghub-model/rhart-image-g-2',
          imageSize: '1K',
          inputUrls: [],
        });
      (assert.equal(_0x2ba754.url, '/api/v2/proxy/image'),
        assert.equal(
          _0x2ba754.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/rhart-image-g-2/text-to-image',
        ),
        assert.equal(_0x2ba754.body.resolution, '1k'),
        assert.equal(_0x2ba754.body.imageUrls, undefined),
        assert.equal(_0x2ba754.adapterTrace?.source, 'manifest'));
    } finally {
      globalThis.fetch = _0x39e0f1;
    }
  }),
  test('aiImageApi: runninghub-model grok 4.2 official route uses official endpoints', async () => {
    const _0xfb259e = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: _0x5c4e24 } = await import('./configApi.js');
      _0x5c4e24();
      const { buildGenerateImageRequest: _0x53d454 } = await import('./aiImageApi.js'),
        _0x389faa = await _0x53d454({
          prompt: 'p',
          model: 'runninghub-model/rhart-image-g',
          rhModelRoute: 'official',
          aspectRatio: '16:9',
          inputUrls: [],
        });
      (assert.equal(_0x389faa.url, '/api/v2/proxy/image'),
        assert.equal(
          _0x389faa.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/rhart-image-x-official/text-to-image',
        ),
        assert.equal(_0x389faa.body.aspectRatio, '16:9'),
        assert.equal(_0x389faa.body.outputFormat, undefined),
        assert.equal(_0x389faa.body.resolution, undefined),
        assert.equal(_0x389faa.body.model, undefined));
      const _0x2d6599 = await _0x53d454({
        prompt: 'p',
        model: 'runninghub-model/rhart-image-g',
        rhModelRoute: 'official',
        aspectRatio: '9:16',
        inputUrlsBySlot: { imageUrl: 'https://www.runninghub.cn/input-x.png' },
      });
      (assert.equal(
        _0x2d6599.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-image-x-official/edit',
      ),
        assert.equal(_0x2d6599.body.image, 'https://www.runninghub.cn/input-x.png'),
        assert.equal(_0x2d6599.body.imageUrl, undefined),
        assert.equal(_0x2d6599.body.aspectRatio, undefined),
        assert.equal(_0x2d6599.body.outputFormat, undefined));
    } finally {
      globalThis.fetch = _0xfb259e;
    }
  }),
  test('aiImageApi: runninghub-model manifest image-to-image attaches uploaded URLs', async () => {
    const _0x2581e4 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: _0x4b210a } = await import('./configApi.js');
      _0x4b210a();
      const { buildGenerateImageRequest: _0x43d404 } = await import('./aiImageApi.js'),
        _0x363389 = await _0x43d404({
          prompt: 'p',
          model: 'runninghub-model/rhart-image-n-g31-flash',
          inputUrls: ['https://www.runninghub.cn/input.png'],
          imageSize: '2K',
          aspectRatio: '1:4',
        });
      (assert.equal(_0x363389.url, '/api/v2/proxy/image'),
        assert.equal(
          _0x363389.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/rhart-image-n-g31-flash/image-to-image',
        ),
        assert.deepEqual(_0x363389.body.imageUrls, ['https://www.runninghub.cn/input.png']),
        assert.equal(_0x363389.body.apiKey, 'k_rhm'),
        assert.equal(_0x363389.body.resolution, '2k'),
        assert.equal(_0x363389.body.aspectRatio, '1:4'),
        assert.equal(_0x363389.adapterTrace?.source, 'manifest'),
        assert.equal(_0x363389.adapterTrace?.executionId, 'runninghub.model-api.rhart-image-n-g31-flash.v1'));
    } finally {
      globalThis.fetch = _0x2581e4;
    }
  }),
  test('aiImageApi: runninghub-model youchuan uses named slot request body', async () => {
    const _0x31775a = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: _0x46890e } = await import('./configApi.js');
      _0x46890e();
      const { buildGenerateImageRequest: _0x55bd73 } = await import('./aiImageApi.js'),
        _0x3d48c7 = await _0x55bd73({
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
      (assert.equal(_0x3d48c7.url, '/api/v2/proxy/image'),
        assert.equal(
          _0x3d48c7.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v81',
        ),
        assert.equal(_0x3d48c7.body.apiKey, 'k_rhm'),
        assert.equal(_0x3d48c7.body.resolution, undefined),
        assert.equal(_0x3d48c7.body.imageUrls, undefined),
        assert.equal(_0x3d48c7.body.imageUrl, 'https://www.runninghub.cn/main.png'),
        assert.equal(_0x3d48c7.body.sref, 'https://www.runninghub.cn/style.png'),
        assert.equal(_0x3d48c7.body.quality, '4'),
        assert.equal(_0x3d48c7.body.iw, 2),
        assert.equal(_0x3d48c7.body.sw, 0x12c),
        assert.equal(_0x3d48c7.body.hd, true));
      const _0x2e256a = await _0x55bd73({
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
      (assert.equal(_0x2e256a.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v7'),
        assert.equal(_0x2e256a.body.resolution, undefined),
        assert.equal(_0x2e256a.body.imageUrls, undefined),
        assert.equal(_0x2e256a.body.imageUrl, 'https://www.runninghub.cn/v7-main.png'),
        assert.equal(_0x2e256a.body.sref, 'https://www.runninghub.cn/v7-style.png'),
        assert.equal(_0x2e256a.body.cref, undefined),
        assert.equal(_0x2e256a.body.cw, undefined),
        assert.equal(_0x2e256a.body.stop, undefined),
        assert.equal(_0x2e256a.body.hd, undefined),
        assert.equal(_0x2e256a.body.quality, '2'),
        assert.equal(_0x2e256a.body.iw, 2),
        assert.equal(_0x2e256a.body.sw, 250),
        assert.equal(_0x2e256a.body.sv, 4),
        assert.equal(_0x2e256a.body.ow, 150),
        assert.equal(_0x2e256a.body.raw, true),
        assert.equal(_0x2e256a.body.tile, false));
    } finally {
      globalThis.fetch = _0x31775a;
    }
  }),
  test('aiImageApi: runninghub-model local input upload uses modelApiKey', async () => {
    const _0x86668e = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x345984, _0x3082d5 = {}) => {
        const _0x599dca = String(_0x345984);
        if (_0x599dca === '/api/config')
          return makeJsonResponse({
            providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' } },
          });
        if (_0x599dca === '/local/rh-input.png') return makeBlobResponse('rh-local-image');
        if (_0x599dca.startsWith('/api/v2/proxy/upload?'))
          return (
            assert.equal(_0x3082d5.headers?.Authorization, 'Bearer k_rhm'),
            makeJsonResponse({
              code: 0,
              data: { download_url: 'https://www.runninghub.cn/uploaded/rh-input.png' },
            })
          );
        throw new Error('unexpected fetch url: ' + _0x599dca);
      };
      const { clearApiConfig: _0x4f253a } = await import('./configApi.js');
      _0x4f253a();
      const { buildGenerateImageRequest: _0x4f0f42 } = await import('./aiImageApi.js'),
        _0x58db4a = await _0x4f0f42({
          prompt: 'p',
          model: 'runninghub-model/rhart-image-n-g31-flash',
          inputUrls: ['/local/rh-input.png'],
          imageSize: '2K',
          aspectRatio: '1:1',
        });
      (assert.equal(_0x58db4a.body.apiKey, 'k_rhm'),
        assert.deepEqual(_0x58db4a.body.imageUrls, ['https://www.runninghub.cn/uploaded/rh-input.png']));
    } finally {
      globalThis.fetch = _0x86668e;
    }
  }),
  test('aiImageApi: runninghub-model local input upload failure reports provider error', async () => {
    const _0x5c6d34 = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x2fbd77, _0x6405e4 = {}) => {
        const _0x1a15a2 = String(_0x2fbd77);
        if (_0x1a15a2 === '/api/config')
          return makeJsonResponse({
            providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' } },
          });
        if (_0x1a15a2 === '/local/rh-bad-key.png') return makeBlobResponse('rh-local-image');
        if (_0x1a15a2.startsWith('/api/v2/proxy/upload?'))
          return (
            assert.equal(_0x6405e4.headers?.Authorization, 'Bearer k_rhm'),
            makeJsonResponse({ code: 0x191, errorMessage: 'invalid model api key' })
          );
        throw new Error('unexpected fetch url: ' + _0x1a15a2);
      };
      const { clearApiConfig: _0x389155 } = await import('./configApi.js');
      _0x389155();
      const { buildGenerateImageRequest: _0x5ea2ba } = await import('./aiImageApi.js');
      await assert.rejects(
        () =>
          _0x5ea2ba({
            prompt: 'p',
            model: 'runninghub-model/rhart-image-n-g31-flash',
            inputUrls: ['/local/rh-bad-key.png'],
            imageSize: '2K',
            aspectRatio: '1:1',
          }),
        /RunningHUB .*invalid model api key.*401/,
      );
    } finally {
      globalThis.fetch = _0x5c6d34;
    }
  }),
  test('aiImageApi: runninghub-model does not fall back to workflow apiKey', async () => {
    const _0x529c5f = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x46d0ee) => {
        const _0x3c15ed = String(_0x46d0ee);
        if (_0x3c15ed === '/api/config')
          return makeJsonResponse({
            providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh_workflow_only' } },
          });
        throw new Error('unexpected fetch url: ' + _0x3c15ed);
      };
      const { clearApiConfig: _0x29462d } = await import('./configApi.js');
      _0x29462d();
      const { buildGenerateImageRequest: _0x3e751a } = await import('./aiImageApi.js');
      await assert.rejects(
        () =>
          _0x3e751a({
            prompt: 'p',
            model: 'runninghub-model/rhart-image-n-g31-flash',
            inputUrls: ['https://www.runninghub.cn/input.png'],
            imageSize: '2K',
            aspectRatio: '1:1',
          }),
        /API Key/,
      );
    } finally {
      globalThis.fetch = _0x529c5f;
    }
  }),
  test('aiImageApi: runninghub-model gpt-image-2 official 无参考图走官方 text-to-image', async () => {
    const _0x34bbda = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' },
          grsai: { apiUrl: 'https://api.grsai.example.com/', apiKey: '' },
        },
      });
      const { clearApiConfig: _0x40b928 } = await import('./configApi.js');
      _0x40b928();
      const { buildGenerateImageRequest: _0x12df85 } = await import('./aiImageApi.js'),
        _0x348211 = await _0x12df85({
          prompt: 'p',
          model: 'runninghub-model/rhart-image-g-2-official',
          aspectRatio: '2：1',
          imageSize: '4K',
          inputUrls: [],
        });
      (assert.equal(_0x348211.url, '/api/v2/proxy/image'),
        assert.equal(
          _0x348211.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/rhart-image-g-2-official/text-to-image',
        ),
        assert.equal(_0x348211.body.aspectRatio, '2:1'),
        assert.equal(_0x348211.body.resolution, '4k'),
        assert.equal(_0x348211.body.quality, 'medium'),
        assert.equal(_0x348211.body.imageUrls, undefined),
        assert.equal(_0x348211.adapterTrace?.source, 'manifest'));
      const _0x4e743d = await _0x12df85({
        prompt: 'p',
        model: 'runninghub-model/rhart-image-g-2',
        rhModelRoute: 'official',
        aspectRatio: '16:9',
        imageSize: '2K',
        inputUrls: [],
      });
      (assert.equal(
        _0x4e743d.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-image-g-2-official/text-to-image',
      ),
        assert.equal(_0x4e743d.body.aspectRatio, '16:9'),
        assert.equal(_0x4e743d.body.resolution, '2k'),
        assert.equal(_0x4e743d.body.quality, 'medium'));
    } finally {
      globalThis.fetch = _0x34bbda;
    }
  }),
  test('aiImageApi: runninghub-model suppressAspectRatio=true 时不透传 aspectRatio', async () => {
    const _0x53ada8 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' } },
      });
      const { clearApiConfig: _0x5b080c } = await import('./configApi.js');
      _0x5b080c();
      const { buildGenerateImageRequest: _0x60f958 } = await import('./aiImageApi.js'),
        _0x22c57c = await _0x60f958({
          prompt: 'p',
          model: 'runninghub-model/rhart-image-v1',
          aspectRatio: '16:9',
          suppressAspectRatio: true,
          inputUrls: [],
        });
      (assert.equal(_0x22c57c.url, '/api/v2/proxy/image'),
        assert.equal(_0x22c57c.body.aspectRatio, undefined),
        assert.equal(_0x22c57c.adapterTrace?.source, 'manifest'));
    } finally {
      globalThis.fetch = _0x53ada8;
    }
  }),
  test('aiImageApi: runninghub-model missing manifest rejects instead of legacy fallback', async () => {
    const _0x5ad2c6 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' } },
      });
      const { clearApiConfig: _0x1f6432 } = await import('./configApi.js');
      _0x1f6432();
      const { buildGenerateImageRequest: _0x1759b4 } = await import('./aiImageApi.js');
      await assert.rejects(
        () => _0x1759b4({ prompt: 'p', model: 'runninghub-model/unregistered-model', inputUrls: [] }),
        /RunningHub model API manifest missing/,
      );
    } finally {
      globalThis.fetch = _0x5ad2c6;
    }
  }),
  test('aiImageApi: runninghubwf image workflow without manifest rejects', async () => {
    const _0x31da21 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' } },
      });
      const { clearApiConfig: _0x10660c } = await import('./configApi.js');
      _0x10660c();
      const { buildGenerateImageRequest: _0x170f8d } = await import('./aiImageApi.js');
      await assert.rejects(
        () =>
          _0x170f8d({
            prompt: 'p',
            model: 'runninghub/123',
            inputUrls: [],
            rhInstanceType: 'default',
            cameraAngle: { rotation: 0, pitch: 0, scale: 0.5 },
          }),
        /workflow manifest missing/,
      );
    } finally {
      globalThis.fetch = _0x31da21;
    }
  }),
  test('aiImageApi: RunningHub ai-app 请求用 header 携带 installId 且不污染远端 body', async () => {
    const _0x3d2988 = globalThis.fetch,
      _0x2e9d0d = globalThis.window,
      _0x282bed = [];
    try {
      ((globalThis.window = {
        __aicInstallId: 'install-image-vip',
        currentProjectId: 'proj-test',
        location: { href: 'http://localhost/' },
      }),
        (globalThis.fetch = async (_0x256769, _0x12a683 = {}) => {
          const _0x322148 = String(_0x256769);
          if (_0x322148 === '/api/config')
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: 'https://www.runninghub.cn', apiKey: 'k_wf', modelApiKey: 'k_model' },
              },
            });
          if (_0x322148 === '/api/v2/proxy/image') {
            const _0x5658f2 = JSON.parse(String(_0x12a683.body || '{}'));
            _0x282bed.push({ headers: _0x12a683.headers || {}, body: _0x5658f2 });
            if (String(_0x5658f2.apiUrl || '').includes('/openapi/v2/run/ai-app/'))
              return makeJsonResponse({ code: 0, data: { taskId: 'rh-image-vip-1' } });
            return makeJsonResponse({
              code: 0,
              data: { status: 'SUCCESS', results: [{ url: 'https://img.example.com/rh-image-vip.png' }] },
            });
          }
          if (_0x322148 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/rh-image-vip.png' });
          throw new Error('unexpected fetch url: ' + _0x322148);
        }));
      const { clearApiConfig: _0x3c324a } = await import('./configApi.js');
      _0x3c324a();
      const { generateImage: _0x3f98d0 } = await import('./aiImageApi.js'),
        _0x240784 = await _0x3f98d0({
          provider: 'runninghubwf',
          model: 'runninghub/1994718111704158209',
          prompt: 'portrait',
          inputUrls: ['https://www.runninghub.cn/ref.png'],
          installId: 'install-image-vip',
        });
      (assert.equal(_0x240784.localPath, 'output/rh-image-vip.png'),
        assert.equal(_0x282bed[0]?.headers?.['X-AIC-Install-Id'], 'install-image-vip'),
        assert.equal(_0x282bed[0]?.body?.installId, undefined),
        assert.equal(
          _0x282bed[0]?.body?.apiUrl,
          'https://www.runninghub.cn/openapi/v2/run/ai-app/1994718111704158209',
        ));
    } finally {
      ((globalThis.fetch = _0x3d2988), (globalThis.window = _0x2e9d0d));
    }
  }),
  test('aiImageApi: RunningHub modelApi 请求用 header 携带 installId 且不污染厂商 body', async () => {
    const _0x1f0ed0 = globalThis.fetch,
      _0xb820bb = globalThis.window,
      _0x1c81b3 = [];
    try {
      ((globalThis.window = {
        __aicInstallId: 'install-model-api',
        currentProjectId: 'proj-test',
        location: { href: 'http://localhost/' },
      }),
        (globalThis.fetch = async (_0x416e61, _0x429486 = {}) => {
          const _0x367667 = String(_0x416e61);
          if (_0x367667 === '/api/config')
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: 'https://www.runninghub.cn', apiKey: 'k_wf', modelApiKey: 'k_model' },
              },
            });
          if (_0x367667 === '/api/v2/proxy/image') {
            const _0x504252 = JSON.parse(String(_0x429486.body || '{}'));
            return (
              _0x1c81b3.push({ headers: _0x429486.headers || {}, body: _0x504252 }),
              makeJsonResponse({
                taskId: 'rh-model-api-1',
                status: 'SUCCESS',
                results: [{ url: 'https://img.example.com/rh-model-api.png' }],
              })
            );
          }
          if (_0x367667 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/rh-model-api.png' });
          throw new Error('unexpected fetch url: ' + _0x367667);
        }));
      const { clearApiConfig: _0x56b9db } = await import('./configApi.js');
      _0x56b9db();
      const { generateImage: _0x4b2329 } = await import('./aiImageApi.js'),
        _0x3382a8 = await _0x4b2329({
          provider: 'runninghub',
          model: 'runninghub-model/youchuan-v81',
          prompt: 'portrait',
          aspectRatio: '16:9',
          quality: '1',
        });
      (assert.equal(_0x3382a8.localPath, 'output/rh-model-api.png'),
        assert.equal(_0x1c81b3[0]?.headers?.['X-AIC-Install-Id'], 'install-model-api'),
        assert.equal(_0x1c81b3[0]?.body?.installId, undefined),
        assert.equal(
          _0x1c81b3[0]?.body?.apiUrl,
          'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v81',
        ));
    } finally {
      ((globalThis.fetch = _0x1f0ed0), (globalThis.window = _0xb820bb));
    }
  }),
  test('aiImageApi: RunningHub ai-app preserves 19-digit numeric taskId for persistence and query', async () => {
    const _0x4ecae2 = globalThis.fetch,
      _0x30a331 = globalThis.setTimeout,
      _0x2d9cef = globalThis.window,
      _0x3ce461 = [],
      _0x51e8cb = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x39932d, _0x105f48, ..._0x522b3a) =>
          _0x30a331(_0x39932d, Number(_0x105f48) > 0x1388 ? Number(_0x105f48) : 0, ..._0x522b3a)),
        (globalThis.fetch = async (_0x31ffe4, _0xbb632f = {}) => {
          const _0x1eb097 = String(_0x31ffe4);
          if (_0x1eb097 === '/api/config')
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: 'https://www.runninghub.cn', apiKey: 'k_wf', modelApiKey: 'k_model' },
              },
            });
          if (_0x1eb097 === '/api/v2/proxy/image') {
            const _0x40b837 = JSON.parse(String(_0xbb632f.body || '{}')),
              _0x383cb6 = String(_0x40b837.apiUrl || '');
            if (_0x383cb6.includes('/openapi/v2/run/ai-app/2050306122774532097'))
              return makeTextResponse('{"code":0,"data":{"taskId":2050557211150823426}}');
            if (_0x383cb6.includes('/openapi/v2/query'))
              return (
                _0x51e8cb.push(String(_0x40b837.taskId || '')),
                makeJsonResponse({
                  code: 0,
                  data: {
                    status: 'SUCCESS',
                    results: [{ url: 'https://img.example.com/rh-qwen-final.png' }],
                  },
                })
              );
          }
          if (_0x1eb097 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/rh-qwen-final.png' });
          throw new Error('unexpected fetch url: ' + _0x1eb097);
        }));
      const { clearApiConfig: _0x187cec } = await import('./configApi.js');
      _0x187cec();
      const { generateImage: _0x4782b8 } = await import('./aiImageApi.js'),
        _0x43772f = await _0x4782b8(
          {
            provider: 'runninghubwf',
            model: 'runninghub/2050306122774532097',
            prompt: 'edit',
            inputUrls: ['https://www.runninghub.cn/input.png'],
            imageSize: '1K',
            aspectRatio: '1:1',
          },
          { onTaskMeta: (_0x52092e) => _0x3ce461.push(_0x52092e) },
        );
      (assert.equal(_0x3ce461.length, 1),
        assert.equal(_0x3ce461[0].taskId, '2050557211150823426'),
        assert.equal(_0x51e8cb[0], '2050557211150823426'),
        assert.equal(_0x43772f.localPath, 'output/rh-qwen-final.png'));
    } finally {
      ((globalThis.fetch = _0x4ecae2), (globalThis.setTimeout = _0x30a331), (globalThis.window = _0x2d9cef));
    }
  }),
  test('aiImageApi: runninghub-model async task calls onTaskMeta and supports resume', async () => {
    const _0x167b31 = globalThis.fetch,
      _0x3001e4 = globalThis.setTimeout,
      _0x529d96 = globalThis.window,
      _0x443d61 = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0xf29424, _0x3e6287, ..._0x4d1ec6) =>
          _0x3001e4(_0xf29424, Number(_0x3e6287) > 0x1388 ? Number(_0x3e6287) : 0, ..._0x4d1ec6)),
        (globalThis.fetch = async (_0x314e0c, _0xc601d5 = {}) => {
          const _0x5be145 = String(_0x314e0c);
          if (_0x5be145 === '/api/config')
            return makeJsonResponse({
              providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' } },
            });
          if (_0x5be145 === '/api/v2/proxy/image') {
            const _0x3c1808 = JSON.parse(String(_0xc601d5.body || '{}')),
              _0x24bf09 = String(_0x3c1808.apiUrl || '');
            if (_0x24bf09.includes('/openapi/v2/query'))
              return makeJsonResponse({
                code: 0,
                data: { status: 'SUCCESS', results: [{ url: 'https://img.example.com/final.png' }] },
              });
            return makeTextResponse(JSON.stringify({ status: 'RUNNING', taskId: 'task-image-1' }));
          }
          if (_0x5be145 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/final.png' });
          throw new Error('unexpected fetch url: ' + _0x5be145);
        }));
      const { clearApiConfig: _0x2b7907 } = await import('./configApi.js');
      _0x2b7907();
      const { generateImage: _0x3fd109, resumeRunningHubImageTask: _0x4fa653 } =
          await import('./aiImageApi.js'),
        _0x1fd963 = { prompt: 'p', model: 'runninghub-model/rhart-image-v1', inputUrls: [] },
        _0x425d89 = await _0x3fd109(_0x1fd963, { onTaskMeta: (_0x393814) => _0x443d61.push(_0x393814) });
      (assert.equal(_0x443d61.length, 1),
        assert.equal(_0x443d61[0].taskId, 'task-image-1'),
        assert.equal(_0x443d61[0].useOpenapiQuery, true),
        assert.equal(_0x425d89.localPath, 'output/final.png'),
        assert.equal(_0x425d89.imageUrl, '/output/final.png'));
      const _0xd400d1 = await _0x4fa653('task-image-2', _0x1fd963);
      (assert.equal(_0xd400d1.localPath, 'output/final.png'),
        assert.equal(_0xd400d1.imageUrl, '/output/final.png'));
    } finally {
      ((globalThis.fetch = _0x167b31), (globalThis.setTimeout = _0x3001e4), (globalThis.window = _0x529d96));
    }
  }),
  test('aiImageApi: runninghub-model poll timeout keeps polling task instead of failing', async () => {
    const _0xfba563 = globalThis.fetch,
      _0x2d9c96 = globalThis.setTimeout,
      _0x3b247c = globalThis.window;
    let _0x31180e = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x1ef85b, _0x11cf6e, ..._0x2cc128) =>
          _0x2d9c96(_0x1ef85b, Number(_0x11cf6e) > 0x1388 ? Number(_0x11cf6e) : 0, ..._0x2cc128)),
        (globalThis.fetch = async (_0xec1469, _0x31dc65 = {}) => {
          const _0x17359f = String(_0xec1469);
          if (_0x17359f === '/api/config')
            return makeJsonResponse({
              providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' } },
            });
          if (_0x17359f === '/api/v2/proxy/image') {
            const _0x15c0e2 = JSON.parse(String(_0x31dc65.body || '{}')),
              _0x4e4678 = String(_0x15c0e2.apiUrl || '');
            if (_0x4e4678.includes('/openapi/v2/query')) {
              _0x31180e += 1;
              if (_0x31180e === 1) {
                const _0x25687f = new Error('The operation was aborted.');
                _0x25687f.name = 'AbortError';
                throw _0x25687f;
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
          if (_0x17359f === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/final-after-timeout.png' });
          throw new Error('unexpected fetch url: ' + _0x17359f);
        }));
      const { clearApiConfig: _0x6bcd1f } = await import('./configApi.js');
      _0x6bcd1f();
      const { generateImage: _0x4a03ce } = await import('./aiImageApi.js'),
        _0x7fbf37 = await _0x4a03ce({ prompt: 'p', model: 'runninghub-model/rhart-image-v1', inputUrls: [] });
      (assert.equal(_0x31180e, 2), assert.equal(_0x7fbf37.localPath, 'output/final-after-timeout.png'));
    } finally {
      ((globalThis.fetch = _0xfba563), (globalThis.setTimeout = _0x2d9c96), (globalThis.window = _0x3b247c));
    }
  }),
  test('aiImageApi: runninghub-model polls when create response has task_id and submitted', async () => {
    const _0x2d5315 = globalThis.fetch,
      _0x52d2ec = globalThis.setTimeout,
      _0x3a9e8f = globalThis.window,
      _0x21b2eb = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x9fce42, _0x3b91ee, ..._0x5c1c5b) =>
          _0x52d2ec(_0x9fce42, Number(_0x3b91ee) > 0x1388 ? Number(_0x3b91ee) : 0, ..._0x5c1c5b)),
        (globalThis.fetch = async (_0x5b6171, _0x48f14e = {}) => {
          const _0x4d9679 = String(_0x5b6171);
          if (_0x4d9679 === '/api/config')
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: 'https://www.runninghub.cn', apiKey: 'k_wf', modelApiKey: 'k_model' },
              },
            });
          if (_0x4d9679 === '/api/v2/proxy/image') {
            const _0xe22624 = JSON.parse(String(_0x48f14e.body || '{}')),
              _0x286dbf = String(_0xe22624.apiUrl || '');
            if (_0x286dbf.includes('/openapi/v2/query'))
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
          if (_0x4d9679 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/rh-submitted-final.png' });
          throw new Error('unexpected fetch url: ' + _0x4d9679);
        }));
      const { clearApiConfig: _0xc39031 } = await import('./configApi.js');
      _0xc39031();
      const { generateImage: _0x3c77ff } = await import('./aiImageApi.js'),
        _0x49e70f = await _0x3c77ff(
          { provider: 'runninghub', model: 'runninghub-model/rhart-image-v1', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (_0x303cad) => _0x21b2eb.push(_0x303cad) },
        );
      (assert.equal(_0x21b2eb.length, 1),
        assert.equal(_0x21b2eb[0].taskId, '2044473210820767746'),
        assert.equal(_0x49e70f.localPath, 'output/rh-submitted-final.png'),
        assert.equal(_0x49e70f.imageUrl, '/output/rh-submitted-final.png'));
    } finally {
      ((globalThis.fetch = _0x2d5315), (globalThis.setTimeout = _0x52d2ec), (globalThis.window = _0x3a9e8f));
    }
  }),
  test('aiImageApi: runninghubwf resume keeps polling submitted array snapshots until success', async () => {
    const _0x390d27 = globalThis.fetch,
      _0x11ce65 = globalThis.setTimeout,
      _0x133ae3 = globalThis.window;
    let _0x28281c = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x21cdcb, _0xbd8dd7, ..._0x2841f6) =>
          _0x11ce65(_0x21cdcb, Number(_0xbd8dd7) > 0x1388 ? Number(_0xbd8dd7) : 0, ..._0x2841f6)),
        (globalThis.fetch = async (_0x3350d7, _0x4e92f1 = {}) => {
          const _0x112a86 = String(_0x3350d7);
          if (_0x112a86 === '/api/config')
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: 'https://www.runninghub.cn', apiKey: 'k_wf', modelApiKey: 'k_model' },
              },
            });
          if (_0x112a86 === '/api/v2/runninghubwf/query') {
            _0x28281c += 1;
            if (_0x28281c === 1)
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
          if (_0x112a86 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/wf-submitted-final.png' });
          throw new Error('unexpected fetch url: ' + _0x112a86);
        }));
      const { clearApiConfig: _0x2d660e } = await import('./configApi.js');
      _0x2d660e();
      const { resumeRunningHubImageTask: _0x40b090 } = await import('./aiImageApi.js'),
        _0x4bca12 = await _0x40b090(
          'wf-task-submitted-1',
          { provider: 'runninghubwf', model: 'runninghub-query-snapshot-test', prompt: 'cat', inputUrls: [] },
          { useOpenapiQuery: false, maxPolls: 2, pollIntervalMs: 0 },
        );
      (assert.equal(_0x28281c, 2),
        assert.equal(_0x4bca12.localPath, 'output/wf-submitted-final.png'),
        assert.equal(_0x4bca12.imageUrl, '/output/wf-submitted-final.png'));
    } finally {
      ((globalThis.fetch = _0x390d27), (globalThis.setTimeout = _0x11ce65), (globalThis.window = _0x133ae3));
    }
  }),
  test('aiImageApi: runninghubwf 查询数组快照仅含 fileUrl 时也应识别为已出图', async () => {
    const _0x9e1acf = globalThis.fetch,
      _0x1ea2ef = globalThis.setTimeout,
      _0x2e87de = globalThis.window;
    let _0x54325e = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x482b43, _0x33de68, ..._0x5f1a73) =>
          _0x1ea2ef(_0x482b43, Number(_0x33de68) > 0x1388 ? Number(_0x33de68) : 0, ..._0x5f1a73)),
        (globalThis.fetch = async (_0x552846, _0x140c87 = {}) => {
          const _0x2f6193 = String(_0x552846);
          if (_0x2f6193 === '/api/config')
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: 'https://www.runninghub.cn', apiKey: 'k_wf', modelApiKey: 'k_model' },
              },
            });
          if (_0x2f6193 === '/api/v2/runninghubwf/query') {
            _0x54325e += 1;
            if (_0x54325e === 1)
              return makeJsonResponse({
                code: 0,
                data: [
                  { fileUrl: 'https://img.example.com/wf-fileurl-final.png', fileType: 'png', nodeId: '521' },
                ],
              });
          }
          if (_0x2f6193 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/wf-fileurl-final.png' });
          throw new Error('unexpected fetch url: ' + _0x2f6193);
        }));
      const { clearApiConfig: _0x12cf01 } = await import('./configApi.js');
      _0x12cf01();
      const { resumeRunningHubImageTask: _0x8cbc5a } = await import('./aiImageApi.js'),
        _0x20758b = await _0x8cbc5a('wf-task-fileurl-1', {
          provider: 'runninghubwf',
          model: 'runninghub-query-fileurl-test',
        });
      (assert.equal(_0x54325e, 1),
        assert.equal(_0x20758b.localPath, 'output/wf-fileurl-final.png'),
        assert.equal(_0x20758b.imageUrl, '/output/wf-fileurl-final.png'));
    } finally {
      ((globalThis.fetch = _0x9e1acf), (globalThis.setTimeout = _0x1ea2ef), (globalThis.window = _0x2e87de));
    }
  }),
  test('aiImageApi: resumeRunningHubImageTask returns CANCELLED when aborted', async () => {
    const _0x4be9cc = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh', modelApiKey: 'k_rhm' } },
      });
      const { clearApiConfig: _0x589181 } = await import('./configApi.js');
      _0x589181();
      const { resumeRunningHubImageTask: _0x94621a } = await import('./aiImageApi.js'),
        _0x7df8af = new AbortController();
      (_0x7df8af.abort(),
        await assert.rejects(
          () =>
            _0x94621a(
              'task-image-abort',
              { model: 'runninghub-model/rhart-image-v1' },
              { signal: _0x7df8af.signal },
            ),
          (_0x5e8903) => _0x5e8903?.message === 'CANCELLED',
        ));
    } finally {
      globalThis.fetch = _0x4be9cc;
    }
  }),
  test('aiImageApi: RunningHub OpenAPI softTimeout 返回 pending 而不是失败', async () => {
    const _0x2433c2 = globalThis.fetch;
    let _0xc3020d = 0;
    try {
      globalThis.fetch = async (_0x5b3200, _0x1a54a8 = {}) => {
        const _0x1634ad = String(_0x5b3200);
        if (_0x1634ad === '/api/v2/proxy/image') {
          const _0x3ed889 = JSON.parse(String(_0x1a54a8.body || '{}'));
          return (
            assert.ok(String(_0x3ed889.apiUrl || '').includes('/openapi/v2/query')),
            (_0xc3020d += 1),
            makeJsonResponse({ code: 0, data: { taskId: 'rh-pending-1', status: 'RUNNING' } })
          );
        }
        throw new Error('unexpected fetch url: ' + _0x1634ad);
      };
      const { clearApiConfig: _0x4ee633 } = await import('./configApi.js');
      _0x4ee633();
      const { resumeRunningHubImageTask: _0x5c65ad } = await import('./aiImageApi.js'),
        _0x1ac74a = await _0x5c65ad(
          'rh-pending-1',
          { provider: 'runninghubwf', model: 'runninghub/2044874075721441281', apiKey: 'k_rh' },
          { useOpenapiQuery: true, softTimeout: true, maxPolls: 2, pollIntervalMs: 0 },
        );
      (assert.equal(_0xc3020d, 2),
        assert.deepEqual(_0x1ac74a, {
          pending: true,
          taskId: 'rh-pending-1',
          status: 'running',
          message: '任务仍在 RunningHub 生成中',
        }));
    } finally {
      globalThis.fetch = _0x2433c2;
    }
  }),
  test('aiImageApi: RunningHub OpenAPI 804/813 继续轮询直到成功', async () => {
    const _0x2fa046 = globalThis.fetch,
      _0x4a3604 = globalThis.window;
    let _0x4663d6 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (_0x296885, _0x5e8465 = {}) => {
          const _0x5b7c8e = String(_0x296885);
          if (_0x5b7c8e === '/api/v2/proxy/image') {
            const _0x4b234a = JSON.parse(String(_0x5e8465.body || '{}'));
            (assert.ok(String(_0x4b234a.apiUrl || '').includes('/openapi/v2/query')), (_0x4663d6 += 1));
            if (_0x4663d6 === 1) return makeJsonResponse({ code: 0x324, msg: '运行中' });
            if (_0x4663d6 === 2) return makeJsonResponse({ code: 0x32d, msg: '排队中' });
            return makeJsonResponse({
              code: 0,
              data: { status: 'SUCCESS', results: [{ url: 'https://img.example.com/rh-openapi-final.png' }] },
            });
          }
          if (_0x5b7c8e === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/rh-openapi-final.png' });
          throw new Error('unexpected fetch url: ' + _0x5b7c8e);
        }));
      const { clearApiConfig: _0x1db739 } = await import('./configApi.js');
      _0x1db739();
      const { resumeRunningHubImageTask: _0x49af4b } = await import('./aiImageApi.js'),
        _0x5c51c6 = await _0x49af4b(
          'rh-openapi-code-1',
          { provider: 'runninghubwf', model: 'runninghub/2044874075721441281', apiKey: 'k_rh' },
          { useOpenapiQuery: true, maxPolls: 3, pollIntervalMs: 0 },
        );
      (assert.equal(_0x4663d6, 3),
        assert.equal(_0x5c51c6.localPath, 'output/rh-openapi-final.png'),
        assert.equal(_0x5c51c6.imageUrl, '/output/rh-openapi-final.png'));
    } finally {
      ((globalThis.fetch = _0x2fa046), (globalThis.window = _0x4a3604));
    }
  }),
  test('aiImageApi: RunningHub OpenAPI SUCCESS 无图时继续轮询下一轮', async () => {
    const _0x3c1b80 = globalThis.fetch,
      _0x15468a = globalThis.window;
    let _0x5bd525 = 0,
      _0x5decae = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (_0x479ba2, _0x22a616 = {}) => {
          const _0x94f882 = String(_0x479ba2);
          if (_0x94f882 === '/api/v2/proxy/image') {
            _0x5bd525 += 1;
            if (_0x5bd525 === 1)
              return makeJsonResponse({ code: 0, data: { status: 'SUCCESS', results: [] } });
            return makeJsonResponse({
              code: 0,
              data: { status: 'SUCCESS', results: [{ url: 'https://img.example.com/rh-delayed-url.png' }] },
            });
          }
          if (_0x94f882 === '/api/v2/save_output_from_url')
            return ((_0x5decae += 1), makeJsonResponse({ path: 'output/rh-delayed-url.png' }));
          throw new Error('unexpected fetch url: ' + _0x94f882);
        }));
      const { clearApiConfig: _0x2c2f4c } = await import('./configApi.js');
      _0x2c2f4c();
      const { resumeRunningHubImageTask: _0x631ca1 } = await import('./aiImageApi.js'),
        _0x3d394b = await _0x631ca1(
          'rh-delayed-url-1',
          { provider: 'runninghubwf', model: 'runninghub/2044874075721441281', apiKey: 'k_rh' },
          { useOpenapiQuery: true, maxPolls: 2, pollIntervalMs: 0 },
        );
      (assert.equal(_0x5bd525, 2),
        assert.equal(_0x5decae, 1),
        assert.equal(_0x3d394b.localPath, 'output/rh-delayed-url.png'));
    } finally {
      ((globalThis.fetch = _0x3c1b80), (globalThis.window = _0x15468a));
    }
  }),
  test('aiImageApi: same RunningHub image resume is single-flight', async () => {
    const _0x4abe98 = globalThis.fetch,
      _0x5670cf = globalThis.window;
    let _0x32efcf = 0,
      _0x523d08 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (_0x25ab74, _0x453b12 = {}) => {
          const _0x51d3b1 = String(_0x25ab74);
          if (_0x51d3b1 === '/api/v2/proxy/image')
            return (
              (_0x32efcf += 1),
              await Promise.resolve(),
              makeJsonResponse({
                code: 0,
                data: {
                  status: 'SUCCESS',
                  results: [{ url: 'https://img.example.com/rh-single-flight.png' }],
                },
              })
            );
          if (_0x51d3b1 === '/api/v2/save_output_from_url')
            return (
              (_0x523d08 += 1),
              await Promise.resolve(),
              makeJsonResponse({ path: 'output/rh-single-flight.png' })
            );
          throw new Error('unexpected fetch url: ' + _0x51d3b1);
        }));
      const { clearApiConfig: _0x4a9439 } = await import('./configApi.js');
      _0x4a9439();
      const { resumeRunningHubImageTask: _0x47563f } = await import('./aiImageApi.js'),
        _0x533a57 = { provider: 'runninghubwf', model: 'runninghub/2044874075721441281', apiKey: 'k_rh' },
        _0x1dc8e4 = { useOpenapiQuery: true, maxPolls: 1, pollIntervalMs: 0 },
        [_0x210a1f, _0x43e78b] = await Promise.all([
          _0x47563f('rh-single-flight-1', _0x533a57, _0x1dc8e4),
          _0x47563f('rh-single-flight-1', _0x533a57, _0x1dc8e4),
        ]);
      (assert.equal(_0x32efcf, 1),
        assert.equal(_0x523d08, 1),
        assert.equal(_0x210a1f.localPath, 'output/rh-single-flight.png'),
        assert.equal(_0x43e78b.localPath, 'output/rh-single-flight.png'));
    } finally {
      ((globalThis.fetch = _0x4abe98), (globalThis.window = _0x5670cf));
    }
  }),
  test('aiImageApi: RunningHub OpenAPI 明确失败时 softTimeout 也应抛错', async () => {
    const _0x39b017 = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x7d44af) => {
        const _0x1256fd = String(_0x7d44af);
        if (_0x1256fd === '/api/v2/proxy/image')
          return makeJsonResponse({
            code: 0,
            data: { taskId: 'rh-failed-1', status: 'FAILED', message: '执行失败' },
          });
        throw new Error('unexpected fetch url: ' + _0x1256fd);
      };
      const { clearApiConfig: _0x62be01 } = await import('./configApi.js');
      _0x62be01();
      const { resumeRunningHubImageTask: _0x19923e } = await import('./aiImageApi.js');
      await assert.rejects(
        () =>
          _0x19923e(
            'rh-failed-1',
            { provider: 'runninghubwf', model: 'runninghub/2044874075721441281', apiKey: 'k_rh' },
            { useOpenapiQuery: true, softTimeout: true, maxPolls: 2, pollIntervalMs: 0 },
          ),
        (_0x3753b7) => String(_0x3753b7?.message || '').includes('执行失败'),
      );
    } finally {
      globalThis.fetch = _0x39b017;
    }
  }),
  test('aiImageApi: dreamina image submit calls onTaskMeta and supports resumeDreaminaImageTask', async () => {
    const _0x1b2f8c = globalThis.fetch,
      _0x351bcb = globalThis.setTimeout,
      _0x39632b = [];
    let _0x1909fe = 0;
    try {
      ((globalThis.setTimeout = (_0x52b90b, _0x4ea9c2, ..._0xd9b749) =>
        _0x351bcb(_0x52b90b, Number(_0x4ea9c2) > 0x1388 ? Number(_0x4ea9c2) : 0, ..._0xd9b749)),
        (globalThis.fetch = async (_0x323465, _0x351ee6 = {}) => {
          const _0x477ff9 = String(_0x323465);
          if (_0x477ff9 === '/api/config') return makeJsonResponse({ providers: {} });
          if (_0x477ff9 === '/api/v2/dreamina/text2image')
            return makeJsonResponse({ success: true, submitId: 'sid-dm-1' });
          if (
            _0x477ff9.startsWith('/api/v2/dreamina/query_result?') &&
            _0x477ff9.includes('submitId=sid-dm-1')
          )
            return makeJsonResponse({
              success: true,
              submitId: 'sid-dm-1',
              status: 'success',
              outputs: [{ localPath: 'output/dreamina/img-1.png' }],
            });
          if (
            _0x477ff9.startsWith('/api/v2/dreamina/query_result?') &&
            _0x477ff9.includes('submitId=sid-dm-2')
          )
            return (
              (_0x1909fe += 1),
              await Promise.resolve(),
              makeJsonResponse({
                success: true,
                submitId: 'sid-dm-2',
                status: 'success',
                outputs: [{ localPath: 'output/dreamina/img-2.png' }],
              })
            );
          throw new Error('unexpected fetch url: ' + _0x477ff9);
        }));
      const { clearApiConfig: _0x215784 } = await import('./configApi.js');
      _0x215784();
      const { generateImage: _0x896f32, resumeDreaminaImageTask: _0x45142f } =
          await import('./aiImageApi.js'),
        _0x2d92e3 = {
          provider: 'dreamina',
          model: 'dreamina/4.5',
          prompt: 'cat',
          inputUrls: [],
          aspectRatio: '1:1',
          imageSize: '2K',
        },
        _0x31527f = await _0x896f32(_0x2d92e3, { onTaskMeta: (_0xe38fa9) => _0x39632b.push(_0xe38fa9) });
      (assert.equal(_0x39632b.length, 1),
        assert.equal(_0x39632b[0].taskId, 'sid-dm-1'),
        assert.equal(_0x39632b[0].provider, 'dreamina'),
        assert.equal(_0x39632b[0].kind, 'image'),
        assert.equal(_0x31527f.localPath, 'output/dreamina/img-1.png'),
        assert.equal(_0x31527f.imageUrl, '/output/dreamina/img-1.png'));
      const [_0x52a8c5, _0x4d026b] = await Promise.all([
        _0x45142f('sid-dm-2', _0x2d92e3),
        _0x45142f('sid-dm-2', _0x2d92e3),
      ]);
      (assert.equal(_0x1909fe, 1),
        assert.equal(_0x52a8c5.localPath, 'output/dreamina/img-2.png'),
        assert.equal(_0x52a8c5.imageUrl, '/output/dreamina/img-2.png'),
        assert.equal(_0x4d026b.localPath, 'output/dreamina/img-2.png'));
    } finally {
      ((globalThis.fetch = _0x1b2f8c), (globalThis.setTimeout = _0x351bcb));
    }
  }),
  test('aiImageApi: apimart async task calls onTaskMeta and supports resumeAsyncImageTask', async () => {
    const _0x182671 = globalThis.fetch,
      _0x30b909 = globalThis.setTimeout,
      _0x64cb7d = globalThis.window,
      _0x3d4591 = [],
      _0x2f6833 = [];
    let _0x40493d = false,
      _0x59a803 = 0,
      _0x2f4bab = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x13cfd1, _0x57b802, ..._0x593853) =>
          _0x30b909(_0x13cfd1, Number(_0x57b802) > 0x1388 ? Number(_0x57b802) : 0, ..._0x593853)),
        (globalThis.fetch = async (_0x392679, _0x49e597 = {}) => {
          const _0x12a768 = String(_0x392679);
          if (_0x12a768 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: '' },
              },
            });
          if (_0x12a768 === '/api/v2/proxy/image')
            return makeTextResponse(
              JSON.stringify({ data: [{ task_id: 'task-apimart-1', status: 'submitted' }] }),
            );
          if (_0x12a768.startsWith('/api/v2/proxy/task?'))
            return (
              _0x2f6833.push(_0x12a768),
              _0x40493d && ((_0x59a803 += 1), await Promise.resolve()),
              makeJsonResponse({
                status: 'success',
                results: [{ url: 'https://img.example.com/apimart-final.png' }],
              })
            );
          if (_0x12a768 === '/api/v2/save_output_from_url')
            return (
              _0x40493d && ((_0x2f4bab += 1), await Promise.resolve()),
              makeJsonResponse({ path: 'output/apimart-final.png' })
            );
          throw new Error('unexpected fetch url: ' + _0x12a768);
        }));
      const { clearApiConfig: _0x1ed6ce } = await import('./configApi.js');
      _0x1ed6ce();
      const { generateImage: _0x38e10e, resumeAsyncImageTask: _0x4e9f79 } = await import('./aiImageApi.js'),
        _0x2a9b3c = { provider: 'apimart', model: 'apimart/nano-banana-2', prompt: 'cat', inputUrls: [] },
        _0x205cfb = await _0x38e10e(_0x2a9b3c, { onTaskMeta: (_0x4c1385) => _0x3d4591.push(_0x4c1385) });
      (assert.equal(_0x3d4591.length, 1),
        assert.equal(_0x3d4591[0].taskId, 'task-apimart-1'),
        assert.equal(_0x3d4591[0].provider, 'apimart'),
        assert.equal(_0x3d4591[0].kind, 'image'),
        assert.equal(_0x205cfb.localPath, 'output/apimart-final.png'),
        assert.equal(_0x205cfb.imageUrl, '/output/apimart-final.png'),
        (_0x40493d = true));
      const [_0x169269, _0x4d0057] = await Promise.all([
        _0x4e9f79('task-apimart-2', _0x2a9b3c),
        _0x4e9f79('task-apimart-2', _0x2a9b3c),
      ]);
      (assert.equal(_0x59a803, 1),
        assert.equal(_0x2f4bab, 1),
        assert.equal(_0x169269.localPath, 'output/apimart-final.png'),
        assert.equal(_0x169269.imageUrl, '/output/apimart-final.png'),
        assert.equal(_0x4d0057.localPath, 'output/apimart-final.png'),
        assert.ok(_0x2f6833.every((_0x3d25d0) => _0x3d25d0.includes('%3Flanguage%3Dzh'))));
    } finally {
      ((globalThis.fetch = _0x182671), (globalThis.setTimeout = _0x30b909), (globalThis.window = _0x64cb7d));
    }
  }),
  test('aiImageApi: apimart Nano banana repeats batchSize with fixed request n=1', async () => {
    const _0x39e0ee = globalThis.fetch,
      _0x1326d1 = globalThis.setTimeout,
      _0x5ce817 = globalThis.window,
      _0x2a45b6 = [];
    let _0x27c34c = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x538a0f, _0x12f689, ..._0x3011ce) =>
          _0x1326d1(_0x538a0f, Number(_0x12f689) > 0x1388 ? Number(_0x12f689) : 0, ..._0x3011ce)),
        (globalThis.fetch = async (_0x34af9c, _0x2ce98d = {}) => {
          const _0x10a844 = String(_0x34af9c);
          if (_0x10a844 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: '' },
              },
            });
          if (_0x10a844 === '/api/v2/proxy/image') {
            const _0x11f848 = JSON.parse(String(_0x2ce98d.body || '{}'));
            _0x2a45b6.push(_0x11f848);
            const _0x594b38 = 'task-apimart-pro-n4-' + _0x2a45b6.length;
            return makeTextResponse(JSON.stringify({ data: [{ task_id: _0x594b38, status: 'submitted' }] }));
          }
          if (_0x10a844.startsWith('/api/v2/proxy/task?')) {
            const _0x2aeff3 = getProxyTaskApiUrl(_0x10a844),
              _0x1e5f88 = _0x2aeff3.match(
                /^https:\/\/api\.apimart\.ai\/v1\/tasks\/task-apimart-pro-n4-(\d+)\?language=zh$/,
              );
            assert.ok(_0x1e5f88);
            const _0x31dcbf = _0x1e5f88[1];
            return makeJsonResponse({
              status: 'success',
              results: [{ url: 'https://img.example.com/apimart-pro-n4-' + _0x31dcbf + '.png' }],
            });
          }
          if (_0x10a844 === '/api/v2/save_output_from_url')
            return (
              (_0x27c34c += 1),
              makeJsonResponse({ path: 'output/apimart-pro-n4-' + _0x27c34c + '.png' })
            );
          throw new Error('unexpected fetch url: ' + _0x10a844);
        }));
      const { clearApiConfig: _0x71de7f } = await import('./configApi.js');
      _0x71de7f();
      const { generateImage: _0x5bf472 } = await import('./aiImageApi.js'),
        _0x5f7733 = await _0x5bf472({
          provider: 'apimart',
          model: 'apimart/nano-banana-pro',
          prompt: 'dog',
          mode: 'standard',
          imageSize: '2K',
          aspectRatio: '1:1',
          batchSize: 4,
          inputUrls: [],
        });
      (assert.equal(_0x2a45b6.length, 4),
        assert.deepEqual(
          _0x2a45b6.map((_0xddb167) => _0xddb167.model),
          [
            'gemini-3-pro-image-preview',
            'gemini-3-pro-image-preview',
            'gemini-3-pro-image-preview',
            'gemini-3-pro-image-preview',
          ],
        ),
        assert.deepEqual(
          _0x2a45b6.map((_0x4c5523) => _0x4c5523.n),
          [1, 1, 1, 1],
        ),
        assert.equal(_0x5f7733?.isBatch, true),
        assert.equal(_0x5f7733?.images?.length, 4),
        assert.equal(_0x27c34c, 4));
    } finally {
      ((globalThis.fetch = _0x39e0ee), (globalThis.setTimeout = _0x1326d1), (globalThis.window = _0x5ce817));
    }
  }),
  test('aiImageApi: apimart gpt-image-2 repeats batchSize with fixed request n=1', async () => {
    const _0x4693f9 = globalThis.fetch,
      _0x45ded2 = globalThis.window,
      _0x330410 = [];
    let _0x53a301 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (_0x25b9d3, _0xb0a4b0 = {}) => {
          const _0x285eef = String(_0x25b9d3);
          if (_0x285eef === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: '' },
              },
            });
          if (_0x285eef === '/api/v2/proxy/image') {
            const _0x49913d = JSON.parse(String(_0xb0a4b0.body || '{}'));
            return (
              _0x330410.push(_0x49913d),
              makeTextResponse(
                JSON.stringify({
                  results: Array.from({ length: 1 }, (_0x1536dd, _0xb927e6) => ({
                    url:
                      'https://img.example.com/apimart-' +
                      _0x49913d.model +
                      '-' +
                      _0x330410.length +
                      '-' +
                      (_0xb927e6 + 1) +
                      '.png',
                  })),
                }),
              )
            );
          }
          if (_0x285eef === '/api/v2/save_output_from_url')
            return (
              (_0x53a301 += 1),
              makeJsonResponse({ path: 'output/apimart-gpt-image-2-' + _0x53a301 + '.png' })
            );
          throw new Error('unexpected fetch url: ' + _0x285eef);
        }));
      const { clearApiConfig: _0x4fe682 } = await import('./configApi.js');
      _0x4fe682();
      const { generateImage: _0x3222ba } = await import('./aiImageApi.js'),
        _0x5688fc = await _0x3222ba({
          provider: 'apimart',
          model: 'apimart/gpt-image-2',
          prompt: 'dog',
          mode: 'standard',
          imageSize: '2K',
          aspectRatio: '1:1',
          batchSize: 4,
          inputUrls: [],
        });
      (assert.equal(_0x330410.length, 4),
        assert.deepEqual(
          _0x330410.map((_0xd4b8c8) => _0xd4b8c8.model),
          ['gpt-image-2', 'gpt-image-2', 'gpt-image-2', 'gpt-image-2'],
        ),
        assert.deepEqual(
          _0x330410.map((_0x5c3fd5) => _0x5c3fd5.n),
          [1, 1, 1, 1],
        ),
        assert.equal(_0x5688fc?.isBatch, true),
        assert.equal(_0x5688fc?.images?.length, 4),
        assert.equal(_0x53a301, 4),
        (_0x330410.length = 0),
        (_0x53a301 = 0));
      const _0x1e51f2 = await _0x3222ba({
        provider: 'apimart',
        model: 'apimart/gpt-image-2',
        prompt: 'dog',
        mode: 'official',
        imageSize: '2K',
        aspectRatio: '1:1',
        batchSize: 4,
        inputUrls: [],
      });
      (assert.equal(_0x330410.length, 4),
        assert.deepEqual(
          _0x330410.map((_0x185e4d) => _0x185e4d.model),
          ['gpt-image-2-official', 'gpt-image-2-official', 'gpt-image-2-official', 'gpt-image-2-official'],
        ),
        assert.deepEqual(
          _0x330410.map((_0x30ad6e) => _0x30ad6e.n),
          [1, 1, 1, 1],
        ),
        assert.equal(_0x1e51f2?.isBatch, true),
        assert.equal(_0x1e51f2?.images?.length, 4),
        assert.equal(_0x53a301, 4));
    } finally {
      ((globalThis.fetch = _0x4693f9), (globalThis.window = _0x45ded2));
    }
  }),
  test('aiImageApi: apimart qwen-image-2.0 submits provider n once', async () => {
    const _0x46a8c1 = globalThis.fetch,
      _0x33267f = globalThis.window,
      _0x33be60 = [];
    let _0x3679ee = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (_0x3c8637, _0x181ef5 = {}) => {
          const _0x353d5c = String(_0x3c8637);
          if (_0x353d5c === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: '' },
              },
            });
          if (_0x353d5c === '/api/v2/proxy/image') {
            const _0x8921aa = JSON.parse(String(_0x181ef5.body || '{}'));
            return (
              _0x33be60.push(_0x8921aa),
              makeTextResponse(
                JSON.stringify({
                  results: Array.from({ length: _0x8921aa.n }, (_0x46bded, _0x1a945f) => ({
                    url: 'https://img.example.com/apimart-qwen-' + (_0x1a945f + 1) + '.png',
                  })),
                }),
              )
            );
          }
          if (_0x353d5c === '/api/v2/save_output_from_url')
            return (
              (_0x3679ee += 1),
              makeJsonResponse({ path: 'output/apimart-qwen-' + _0x3679ee + '.png' })
            );
          throw new Error('unexpected fetch url: ' + _0x353d5c);
        }));
      const { clearApiConfig: _0x380165 } = await import('./configApi.js');
      _0x380165();
      const { generateImage: _0x3272a6 } = await import('./aiImageApi.js'),
        _0x502dbf = await _0x3272a6({
          provider: 'apimart',
          model: 'apimart/qwen-image-2.0',
          prompt: 'dog',
          mode: 'pro',
          imageSize: '2K',
          aspectRatio: '16:9',
          batchSize: 4,
          inputUrls: [],
        });
      (assert.equal(_0x33be60.length, 1),
        assert.equal(_0x33be60[0]?.model, 'qwen-image-2.0-pro'),
        assert.equal(_0x33be60[0]?.resolution, '2K'),
        assert.equal(_0x33be60[0]?.size, '16:9'),
        assert.equal(_0x33be60[0]?.n, 4),
        assert.equal(_0x502dbf?.isBatch, true),
        assert.equal(_0x502dbf?.images?.length, 4),
        assert.equal(_0x3679ee, 4));
    } finally {
      ((globalThis.fetch = _0x46a8c1), (globalThis.window = _0x33267f));
    }
  }),
  test('aiImageApi: apimart z-image-turbo repeats batchSize without n', async () => {
    const _0x37f181 = globalThis.fetch,
      _0x523de2 = globalThis.window,
      _0x2ea048 = [];
    let _0xd87043 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (_0x46b408, _0x1cbd49 = {}) => {
          const _0x26969f = String(_0x46b408);
          if (_0x26969f === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: '' },
              },
            });
          if (_0x26969f === '/api/v2/proxy/image') {
            const _0xc6662d = JSON.parse(String(_0x1cbd49.body || '{}'));
            return (
              _0x2ea048.push(_0xc6662d),
              makeTextResponse(
                JSON.stringify({
                  results: [{ url: 'https://img.example.com/apimart-z-image-' + _0x2ea048.length + '.png' }],
                }),
              )
            );
          }
          if (_0x26969f === '/api/v2/save_output_from_url')
            return (
              (_0xd87043 += 1),
              makeJsonResponse({ path: 'output/apimart-z-image-' + _0xd87043 + '.png' })
            );
          throw new Error('unexpected fetch url: ' + _0x26969f);
        }));
      const { clearApiConfig: _0x568dfb } = await import('./configApi.js');
      _0x568dfb();
      const { generateImage: _0x399f2f } = await import('./aiImageApi.js'),
        _0x3437b7 = await _0x399f2f({
          provider: 'apimart',
          model: 'apimart/z-image-turbo',
          prompt: 'dog',
          imageSize: '2K',
          aspectRatio: '16:9',
          prompt_extend: true,
          batchSize: 4,
          inputUrls: [],
        });
      (assert.equal(_0x2ea048.length, 4),
        assert.deepEqual(
          _0x2ea048.map((_0x2c47ab) => _0x2c47ab.model),
          ['z-image-turbo', 'z-image-turbo', 'z-image-turbo', 'z-image-turbo'],
        ),
        assert.deepEqual(
          _0x2ea048.map((_0x38cf27) => _0x38cf27.n),
          [undefined, undefined, undefined, undefined],
        ),
        assert.deepEqual(
          _0x2ea048.map((_0x31ce0c) => _0x31ce0c.prompt_extend),
          [true, true, true, true],
        ),
        assert.equal(_0x3437b7?.isBatch, true),
        assert.equal(_0x3437b7?.images?.length, 4),
        assert.equal(_0xd87043, 4));
    } finally {
      ((globalThis.fetch = _0x37f181), (globalThis.window = _0x523de2));
    }
  }),
  test('aiImageApi: apimart wan2.7-image submits provider n once with image inputs', async () => {
    const _0x5ecac7 = globalThis.fetch,
      _0x1fbbe2 = globalThis.window,
      _0x44e223 = [];
    let _0x408ce9 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (_0x36c284, _0x649cd5 = {}) => {
          const _0x76d532 = String(_0x36c284);
          if (_0x76d532 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: '' },
              },
            });
          if (_0x76d532 === '/api/v2/proxy/image') {
            const _0xfbf42e = JSON.parse(String(_0x649cd5.body || '{}'));
            return (
              _0x44e223.push(_0xfbf42e),
              makeTextResponse(
                JSON.stringify({
                  results: Array.from({ length: _0xfbf42e.n }, (_0x4a9b02, _0x2825fb) => ({
                    url: 'https://img.example.com/apimart-wan-' + (_0x2825fb + 1) + '.png',
                  })),
                }),
              )
            );
          }
          if (_0x76d532 === '/api/v2/save_output_from_url')
            return ((_0x408ce9 += 1), makeJsonResponse({ path: 'output/apimart-wan-' + _0x408ce9 + '.png' }));
          throw new Error('unexpected fetch url: ' + _0x76d532);
        }));
      const { clearApiConfig: _0x48ca26 } = await import('./configApi.js');
      _0x48ca26();
      const { generateImage: _0x5d0d4b } = await import('./aiImageApi.js'),
        _0x5453a3 = await _0x5d0d4b({
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
      (assert.equal(_0x44e223.length, 1),
        assert.equal(_0x44e223[0]?.model, 'wan2.7-image-pro'),
        assert.equal(_0x44e223[0]?.resolution, '2K'),
        assert.equal(_0x44e223[0]?.size, '16:9'),
        assert.equal(_0x44e223[0]?.n, 4),
        assert.equal(_0x44e223[0]?.thinking_mode, true),
        assert.deepEqual(_0x44e223[0]?.image_urls, ['https://cdn.apimart.ai/ref.png']),
        assert.equal(_0x5453a3?.isBatch, true),
        assert.equal(_0x5453a3?.images?.length, 4),
        assert.equal(_0x408ce9, 4));
    } finally {
      ((globalThis.fetch = _0x5ecac7), (globalThis.window = _0x1fbbe2));
    }
  }),
  test('aiImageApi: apimart seedream repeats batchSize with fixed request n=1', async () => {
    const _0x4509f3 = globalThis.fetch,
      _0x1cb417 = globalThis.window,
      _0x3f76f8 = [];
    let _0xbcf2f1 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (_0x4c8676, _0x495434 = {}) => {
          const _0x376d34 = String(_0x4c8676);
          if (_0x376d34 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: '' },
              },
            });
          if (_0x376d34 === '/api/v2/proxy/image') {
            const _0x31a0ac = JSON.parse(String(_0x495434.body || '{}'));
            return (
              _0x3f76f8.push(_0x31a0ac),
              makeTextResponse(
                JSON.stringify({
                  results: Array.from({ length: 1 }, (_0x3854f9, _0x22c931) => ({
                    url:
                      'https://img.example.com/apimart-' +
                      _0x31a0ac.model +
                      '-' +
                      _0x3f76f8.length +
                      '-' +
                      (_0x22c931 + 1) +
                      '.png',
                  })),
                }),
              )
            );
          }
          if (_0x376d34 === '/api/v2/save_output_from_url')
            return (
              (_0xbcf2f1 += 1),
              makeJsonResponse({ path: 'output/apimart-seedream-' + _0xbcf2f1 + '.png' })
            );
          throw new Error('unexpected fetch url: ' + _0x376d34);
        }));
      const { clearApiConfig: _0x42a06a } = await import('./configApi.js');
      _0x42a06a();
      const { generateImage: _0xb9d663 } = await import('./aiImageApi.js'),
        _0x1672f1 = await _0xb9d663({
          provider: 'apimart',
          model: 'apimart/seedream-4.5',
          prompt: 'dog',
          imageSize: '2K',
          aspectRatio: '16:9',
          batchSize: 4,
          inputUrls: [],
        });
      (assert.equal(_0x3f76f8.length, 4),
        assert.deepEqual(
          _0x3f76f8.map((_0x49f40e) => _0x49f40e.model),
          ['doubao-seedream-4.5', 'doubao-seedream-4.5', 'doubao-seedream-4.5', 'doubao-seedream-4.5'],
        ),
        assert.deepEqual(
          _0x3f76f8.map((_0x4a4a37) => _0x4a4a37.n),
          [1, 1, 1, 1],
        ),
        assert.equal(_0x1672f1?.isBatch, true),
        assert.equal(_0x1672f1?.images?.length, 4),
        assert.equal(_0xbcf2f1, 4),
        (_0x3f76f8.length = 0),
        (_0xbcf2f1 = 0));
      const _0x2cfe21 = await _0xb9d663({
        provider: 'apimart',
        model: 'apimart/seedream-5.0-lite',
        prompt: 'dog',
        imageSize: '3K',
        aspectRatio: '21:9',
        batchSize: 4,
        inputUrls: [],
      });
      (assert.equal(_0x3f76f8.length, 4),
        assert.deepEqual(
          _0x3f76f8.map((_0x4837ea) => _0x4837ea.model),
          [
            'doubao-seedream-5.0-lite',
            'doubao-seedream-5.0-lite',
            'doubao-seedream-5.0-lite',
            'doubao-seedream-5.0-lite',
          ],
        ),
        assert.deepEqual(
          _0x3f76f8.map((_0x2a14d6) => _0x2a14d6.n),
          [1, 1, 1, 1],
        ),
        assert.equal(_0x3f76f8[0]?.resolution, '3K'),
        assert.equal(_0x3f76f8[0]?.size, '21:9'),
        assert.equal(_0x2cfe21?.isBatch, true),
        assert.equal(_0x2cfe21?.images?.length, 4),
        assert.equal(_0xbcf2f1, 4));
    } finally {
      ((globalThis.fetch = _0x4509f3), (globalThis.window = _0x1cb417));
    }
  }),
  test('aiImageApi: apimart gpt-image-2 创建与轮询兼容官方 result.images 结构', async () => {
    const _0xc7b196 = globalThis.fetch,
      _0x126389 = globalThis.setTimeout,
      _0x297fd2 = globalThis.window,
      _0x1c7612 = [];
    let _0x26ae0b = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x25e353, _0x265e51, ..._0x565c91) =>
          _0x126389(_0x25e353, Number(_0x265e51) > 0x1388 ? Number(_0x265e51) : 0, ..._0x565c91)),
        (globalThis.fetch = async (_0x44f335, _0x195458 = {}) => {
          const _0x41ff68 = String(_0x44f335);
          if (_0x41ff68 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com/v1/', apiKey: 'k_grsai' },
              },
            });
          if (_0x41ff68 === '/api/v2/proxy/image') {
            const _0x378c3f = JSON.parse(String(_0x195458.body || '{}'));
            return (
              assert.equal(_0x378c3f.apiUrl, 'https://api.apimart.ai/v1/images/generations'),
              assert.equal(_0x378c3f.model, 'gpt-image-2'),
              assert.equal(_0x378c3f.resolution, '2k'),
              assert.equal(_0x378c3f.size, '16:9'),
              makeTextResponse(
                JSON.stringify({ data: [{ task_id: 'task-apimart-gpt-image-2', status: 'submitted' }] }),
              )
            );
          }
          if (_0x41ff68.startsWith('/api/v2/proxy/task?'))
            return (
              (_0x26ae0b += 1),
              assert.ok(
                _0x41ff68.includes(
                  encodeURIComponent('https://api.apimart.ai/v1/tasks/task-apimart-gpt-image-2?language=zh'),
                ),
              ),
              makeJsonResponse({
                status: 'success',
                data: { result: { images: [{ url: ['https://img.example.com/apimart-gpt-image-2.png'] }] } },
              })
            );
          if (_0x41ff68 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/apimart-gpt-image-2.png' });
          throw new Error('unexpected fetch url: ' + _0x41ff68);
        }));
      const { clearApiConfig: _0x570ceb } = await import('./configApi.js');
      _0x570ceb();
      const { generateImage: _0x4a1010 } = await import('./aiImageApi.js'),
        _0x3a0b84 = await _0x4a1010(
          {
            provider: 'apimart',
            model: 'apimart/gpt-image-2',
            prompt: 'cat',
            aspectRatio: '16:9',
            imageSize: '2K',
            inputUrls: [],
          },
          { onTaskMeta: (_0x380bd1) => _0x1c7612.push(_0x380bd1) },
        );
      (assert.equal(_0x1c7612.length, 1),
        assert.equal(_0x1c7612[0].taskId, 'task-apimart-gpt-image-2'),
        assert.equal(_0x1c7612[0].provider, 'apimart'),
        assert.ok(_0x26ae0b >= 1),
        assert.equal(_0x3a0b84.localPath, 'output/apimart-gpt-image-2.png'),
        assert.equal(_0x3a0b84.imageUrl, '/output/apimart-gpt-image-2.png'));
    } finally {
      ((globalThis.fetch = _0xc7b196), (globalThis.setTimeout = _0x126389), (globalThis.window = _0x297fd2));
    }
  }),
  test('aiImageApi: apimart model without explicit provider still resumes as apimart async task', async () => {
    const _0x561f86 = globalThis.fetch,
      _0x551e0c = globalThis.setTimeout,
      _0x1a5242 = globalThis.window,
      _0x1d1b2f = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x1774ed, _0x371752, ..._0x7204dd) =>
          _0x551e0c(_0x1774ed, Number(_0x371752) > 0x1388 ? Number(_0x371752) : 0, ..._0x7204dd)),
        (globalThis.fetch = async (_0x4a22ac, _0x57f3a9 = {}) => {
          const _0x205f86 = String(_0x4a22ac);
          if (_0x205f86 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (_0x205f86 === '/api/v2/proxy/image')
            return makeTextResponse(
              JSON.stringify({ data: [{ task_id: 'task-apimart-model-only', status: 'submitted' }] }),
            );
          if (_0x205f86.startsWith('/api/v2/proxy/task?'))
            return (
              assert.ok(
                _0x205f86.includes(
                  encodeURIComponent('https://api.apimart.ai/v1/tasks/task-apimart-model-only?language=zh'),
                ),
              ),
              makeJsonResponse({
                status: 'success',
                results: [{ url: 'https://img.example.com/apimart-model-only-final.png' }],
              })
            );
          if (_0x205f86 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/apimart-model-only-final.png' });
          throw new Error('unexpected fetch url: ' + _0x205f86);
        }));
      const { clearApiConfig: _0x5363cc } = await import('./configApi.js');
      _0x5363cc();
      const { generateImage: _0x269245 } = await import('./aiImageApi.js'),
        _0x58d497 = { model: 'apimart/nano-banana-2', prompt: 'cat', inputUrls: [] },
        _0x2fd59b = await _0x269245(_0x58d497, { onTaskMeta: (_0x55b6cf) => _0x1d1b2f.push(_0x55b6cf) });
      (assert.equal(_0x1d1b2f.length, 1),
        assert.equal(_0x1d1b2f[0].taskId, 'task-apimart-model-only'),
        assert.equal(_0x1d1b2f[0].provider, 'apimart'),
        assert.equal(_0x1d1b2f[0].kind, 'image'),
        assert.equal(_0x2fd59b.localPath, 'output/apimart-model-only-final.png'),
        assert.equal(_0x2fd59b.imageUrl, '/output/apimart-model-only-final.png'));
    } finally {
      ((globalThis.fetch = _0x561f86), (globalThis.setTimeout = _0x551e0c), (globalThis.window = _0x1a5242));
    }
  }),
  test('aiImageApi: provider=apimart + 裸模型时优先走 apimart', async () => {
    const _0x483a31 = globalThis.fetch,
      _0x9b8119 = globalThis.setTimeout,
      _0x400a38 = globalThis.window;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x124502, _0x3a75d8, ..._0xd10a41) =>
          _0x9b8119(_0x124502, Number(_0x3a75d8) > 0x1388 ? Number(_0x3a75d8) : 0, ..._0xd10a41)),
        (globalThis.fetch = async (_0x588111, _0x4512f5 = {}) => {
          const _0x1f95a2 = String(_0x588111);
          if (_0x1f95a2 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (_0x1f95a2 === '/api/v2/proxy/image') {
            const _0x4b26b0 = JSON.parse(String(_0x4512f5.body || '{}'));
            return (
              assert.ok(String(_0x4b26b0.apiUrl || '').includes('api.apimart.ai')),
              makeTextResponse(
                JSON.stringify({
                  data: [{ task_id: 'task-apimart-provider-priority', status: 'submitted' }],
                }),
              )
            );
          }
          if (_0x1f95a2.startsWith('/api/v2/proxy/task?'))
            return (
              assert.ok(
                _0x1f95a2.includes(
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
          if (_0x1f95a2 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/apimart-provider-priority.png' });
          throw new Error('unexpected fetch url: ' + _0x1f95a2);
        }));
      const { clearApiConfig: _0xbe942c } = await import('./configApi.js');
      _0xbe942c();
      const { generateImage: _0x515517 } = await import('./aiImageApi.js'),
        _0x242414 = await _0x515517({
          provider: 'apimart',
          model: 'nano-banana-2',
          prompt: 'cat',
          inputUrls: [],
        });
      assert.equal(_0x242414.localPath, 'output/apimart-provider-priority.png');
    } finally {
      ((globalThis.fetch = _0x483a31), (globalThis.setTimeout = _0x9b8119), (globalThis.window = _0x400a38));
    }
  }),
  test('aiImageApi: provider=ppio + 裸模型时优先走 ppio', async () => {
    const _0x54d3fe = globalThis.fetch,
      _0x237208 = globalThis.setTimeout,
      _0x522b39 = globalThis.window;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0xfc721, _0x503eb5, ..._0x3d72f2) =>
          _0x237208(_0xfc721, Number(_0x503eb5) > 0x1388 ? Number(_0x503eb5) : 0, ..._0x3d72f2)),
        (globalThis.fetch = async (_0x4d73dc) => {
          const _0x246e4c = String(_0x4d73dc);
          if (_0x246e4c === '/api/config')
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: 'https://api.ppinfra.com', apiKey: 'k_ppio' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          throw new Error('unexpected fetch url: ' + _0x246e4c);
        }));
      const { clearApiConfig: _0x44cdf3 } = await import('./configApi.js');
      _0x44cdf3();
      const { buildGenerateImageRequest: _0xa1f1fd } = await import('./aiImageApi.js'),
        _0x207949 = await _0xa1f1fd({
          provider: 'ppio',
          model: 'seedream-5.0-lite',
          prompt: 'cat',
          inputUrls: [],
        });
      (assert.equal(_0x207949.adapterTrace?.source, 'manifest'),
        assert.equal(_0x207949.body.apiUrl, 'https://api.ppinfra.com/v3/seedream-5.0-lite'),
        assert.equal(_0x207949.body.prompt, 'cat'));
    } finally {
      ((globalThis.fetch = _0x54d3fe), (globalThis.setTimeout = _0x237208), (globalThis.window = _0x522b39));
    }
  }),
  test('aiImageApi: unregistered bare model rejects without default GRSAI routing', async () => {
    const _0x209209 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
      });
      const { clearApiConfig: _0x3cbfe1 } = await import('./configApi.js');
      _0x3cbfe1();
      const { buildGenerateImageRequest: _0x4f9ed2 } = await import('./aiImageApi.js');
      await assert.rejects(
        () => _0x4f9ed2({ model: 'unregistered-bare-model', prompt: 'cat', inputUrls: [] }),
        /Image model API manifest missing: unregistered-bare-model/,
      );
    } finally {
      globalThis.fetch = _0x209209;
    }
  }),
  test('aiImageApi: grsai async task can render image even when create response has no status', async () => {
    const _0x4da882 = globalThis.fetch,
      _0x4d6521 = globalThis.setTimeout,
      _0x4e6972 = globalThis.window,
      _0x1afb98 = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x2ec0e6, _0x2f03ae, ..._0x1a45f2) =>
          _0x4d6521(_0x2ec0e6, Number(_0x2f03ae) > 0x1388 ? Number(_0x2f03ae) : 0, ..._0x1a45f2)),
        (globalThis.fetch = async (_0xedc096, _0x52a6f4 = {}) => {
          const _0x2497d8 = String(_0xedc096);
          if (_0x2497d8 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (_0x2497d8 === '/api/v2/proxy/image') {
            const _0x243d18 = JSON.parse(String(_0x52a6f4.body || '{}')),
              _0x1e2c9a = String(_0x243d18.apiUrl || '');
            if (_0x1e2c9a.endsWith('/v1/api/generate'))
              return makeTextResponse(JSON.stringify({ data: { task_id: 'task-grsai-1' } }));
            throw new Error('unexpected apiUrl: ' + _0x1e2c9a);
          }
          if (_0x2497d8.startsWith('/api/v2/proxy/task?')) {
            const _0x55c25d = getProxyTaskApiUrl(_0x2497d8);
            return (
              assert.equal(_0x55c25d, 'https://api.grsai.example.com/v1/api/result?id=task-grsai-1'),
              makeJsonResponse({
                id: 'task-grsai-1',
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/grsai-final.png' }],
              })
            );
          }
          if (_0x2497d8 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-final.png' });
          throw new Error('unexpected fetch url: ' + _0x2497d8);
        }));
      const { clearApiConfig: _0x3b3edc } = await import('./configApi.js');
      _0x3b3edc();
      const { generateImage: _0x506a29 } = await import('./aiImageApi.js'),
        _0x4372ea = { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
        _0x1a2807 = await _0x506a29(_0x4372ea, { onTaskMeta: (_0x41bbcf) => _0x1afb98.push(_0x41bbcf) });
      (assert.equal(_0x1afb98.length, 1),
        assert.equal(_0x1afb98[0].taskId, 'task-grsai-1'),
        assert.equal(_0x1afb98[0].provider, 'grsai'),
        assert.equal(_0x1afb98[0].kind, 'image'),
        assert.equal(_0x1a2807.localPath, 'output/grsai-final.png'),
        assert.equal(_0x1a2807.imageUrl, '/output/grsai-final.png'));
    } finally {
      ((globalThis.fetch = _0x4da882), (globalThis.setTimeout = _0x4d6521), (globalThis.window = _0x4e6972));
    }
  }),
  test('aiImageApi: grsai generate succeeded results render without polling', async () => {
    const _0x3cb764 = globalThis.fetch,
      _0x2ae05e = globalThis.window,
      _0xf44fdb = [];
    let _0x2855c2 = false;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.fetch = async (_0x4a8322, _0x114221 = {}) => {
          const _0x5bb180 = String(_0x4a8322);
          if (_0x5bb180 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com/v1/', apiKey: 'k_grsai' } },
            });
          if (_0x5bb180 === '/api/v2/proxy/image') {
            const _0x33e43b = JSON.parse(String(_0x114221.body || '{}'));
            return (
              assert.equal(_0x33e43b.apiUrl, 'https://api.grsai.example.com/v1/api/generate'),
              assert.deepEqual(_0x33e43b.images, []),
              assert.equal(_0x33e43b.replyType, 'json'),
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
          if (_0x5bb180.startsWith('/api/v2/proxy/task?')) {
            _0x2855c2 = true;
            throw new Error('unexpected polling url: ' + _0x5bb180);
          }
          if (_0x5bb180 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-direct-final.png' });
          throw new Error('unexpected fetch url: ' + _0x5bb180);
        }));
      const { clearApiConfig: _0xc0160d } = await import('./configApi.js');
      _0xc0160d();
      const { generateImage: _0x378672 } = await import('./aiImageApi.js'),
        _0x4041fc = await _0x378672(
          { provider: 'grsai', model: 'nano-banana-2', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (_0x52f8c1) => _0xf44fdb.push(_0x52f8c1) },
        );
      (assert.equal(_0x2855c2, false),
        assert.equal(_0xf44fdb.length, 0),
        assert.equal(_0x4041fc.localPath, 'output/grsai-direct-final.png'),
        assert.equal(_0x4041fc.imageUrl, '/output/grsai-direct-final.png'));
    } finally {
      ((globalThis.fetch = _0x3cb764), (globalThis.window = _0x2ae05e));
    }
  }),
  test('aiImageApi: grsai polling uses GET /v1/api/result', async () => {
    const _0x322fa2 = globalThis.fetch,
      _0x1527fe = globalThis.setTimeout,
      _0x52eff4 = globalThis.window,
      _0x59a163 = [];
    let _0x4b5342 = false;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x3a5b49, _0x49a939, ..._0x432ccd) =>
          _0x1527fe(_0x3a5b49, Number(_0x49a939) > 0x1388 ? Number(_0x49a939) : 0, ..._0x432ccd)),
        (globalThis.fetch = async (_0x54fb09, _0x11982e = {}) => {
          const _0x5995c1 = String(_0x54fb09);
          if (_0x5995c1 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (_0x5995c1 === '/api/v2/proxy/image') {
            const _0x315be1 = JSON.parse(String(_0x11982e.body || '{}')),
              _0x222c50 = String(_0x315be1.apiUrl || '');
            if (_0x222c50.endsWith('/v1/api/generate'))
              return makeTextResponse('data: {"result":{"task_id":"task-grsai-fallback-1"}}\n\n');
            throw new Error('unexpected apiUrl: ' + _0x222c50);
          }
          if (_0x5995c1.startsWith('/api/v2/proxy/task?')) {
            const _0x1fe14f = getProxyTaskApiUrl(_0x5995c1);
            return (
              (_0x4b5342 = true),
              assert.equal(_0x1fe14f, 'https://api.grsai.example.com/v1/api/result?id=task-grsai-fallback-1'),
              makeJsonResponse({
                id: 'task-grsai-fallback-1',
                status: 'finished',
                output: { images: [{ url: 'https://img.example.com/grsai-fallback-final.png' }] },
              })
            );
          }
          if (_0x5995c1 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-fallback-final.png' });
          throw new Error('unexpected fetch url: ' + _0x5995c1);
        }));
      const { clearApiConfig: _0x2d4023 } = await import('./configApi.js');
      _0x2d4023();
      const { generateImage: _0x1b2c87 } = await import('./aiImageApi.js'),
        _0x1d8425 = { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
        _0x39b3ff = await _0x1b2c87(_0x1d8425, { onTaskMeta: (_0x394b6c) => _0x59a163.push(_0x394b6c) });
      (assert.equal(_0x59a163.length, 1),
        assert.equal(_0x59a163[0].taskId, 'task-grsai-fallback-1'),
        assert.equal(_0x59a163[0].provider, 'grsai'),
        assert.equal(_0x59a163[0].kind, 'image'),
        assert.equal(_0x4b5342, true),
        assert.equal(_0x39b3ff.localPath, 'output/grsai-fallback-final.png'),
        assert.equal(_0x39b3ff.imageUrl, '/output/grsai-fallback-final.png'));
    } finally {
      ((globalThis.fetch = _0x322fa2), (globalThis.setTimeout = _0x1527fe), (globalThis.window = _0x52eff4));
    }
  }),
  test('aiImageApi: resumeAsyncImageTask 支持 grsai 恢复', async () => {
    const _0x36a644 = globalThis.fetch,
      _0x5cfe3e = globalThis.setTimeout,
      _0x58ac58 = globalThis.window;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x3cc284) => {
          if (typeof _0x3cc284 === 'function') _0x3cc284();
          return 0;
        }),
        (globalThis.fetch = async (_0x2c0e51, _0x3fbd3b = {}) => {
          const _0x2fa2c6 = String(_0x2c0e51);
          if (_0x2fa2c6 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com/v1/', apiKey: 'k_grsai' } },
            });
          if (_0x2fa2c6.startsWith('/api/v2/proxy/task?')) {
            const _0x122874 = getProxyTaskApiUrl(_0x2fa2c6);
            return (
              assert.equal(_0x122874, 'https://api.grsai.example.com/v1/api/result?id=task-grsai-resume-1'),
              makeJsonResponse({
                id: 'task-grsai-resume-1',
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/grsai-resume-final.png' }],
              })
            );
          }
          if (_0x2fa2c6 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-resume-final.png' });
          throw new Error('unexpected fetch url: ' + _0x2fa2c6);
        }));
      const { clearApiConfig: _0x2d1378 } = await import('./configApi.js');
      _0x2d1378();
      const { resumeAsyncImageTask: _0x146271 } = await import('./aiImageApi.js'),
        _0x1a8e0f = await _0x146271('task-grsai-resume-1', { provider: 'grsai', model: 'nano-banana-2' });
      (assert.equal(_0x1a8e0f.localPath, 'output/grsai-resume-final.png'),
        assert.equal(_0x1a8e0f.imageUrl, '/output/grsai-resume-final.png'));
    } finally {
      ((globalThis.fetch = _0x36a644), (globalThis.setTimeout = _0x5cfe3e), (globalThis.window = _0x58ac58));
    }
  }),
  test('aiImageApi: grsai SSE renders directly when task_id arrives before results', async () => {
    const _0x45a93f = globalThis.fetch,
      _0x1b256d = globalThis.setTimeout,
      _0x481268 = globalThis.window,
      _0x1eab36 = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x4ba23c, _0x2b29b3, ..._0x53c1f0) =>
          _0x1b256d(_0x4ba23c, Number(_0x2b29b3) > 0x1388 ? Number(_0x2b29b3) : 0, ..._0x53c1f0)),
        (globalThis.fetch = async (_0x57395b, _0x270870 = {}) => {
          const _0x12c8c3 = String(_0x57395b);
          if (_0x12c8c3 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (_0x12c8c3 === '/api/v2/proxy/image') {
            const _0x30c2ed = JSON.parse(String(_0x270870.body || '{}')),
              _0x5cdfff = String(_0x30c2ed.apiUrl || '');
            if (_0x5cdfff.endsWith('/v1/api/generate'))
              return makeTextResponse(
                'data: {"data":{"task_id":"task-grsai-sse-direct-1"},"status":"pending"}\n\ndata: {"status":"succeeded","results":[{"url":"https://img.example.com/grsai-sse-direct-1.png"}]}\n\n',
              );
          }
          if (_0x12c8c3 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-sse-direct-1.png' });
          if (_0x12c8c3.startsWith('/api/v2/proxy/task?'))
            return makeJsonResponse({ message: 'should-not-poll' }, 0x1f4);
          throw new Error('unexpected fetch url: ' + _0x12c8c3);
        }));
      const { clearApiConfig: _0x38caa5 } = await import('./configApi.js');
      _0x38caa5();
      const { generateImage: _0x40fb3b } = await import('./aiImageApi.js'),
        _0x552e7a = await _0x40fb3b(
          { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (_0x4159f2) => _0x1eab36.push(_0x4159f2) },
        );
      (assert.equal(_0x1eab36.length, 0),
        assert.equal(_0x552e7a.localPath, 'output/grsai-sse-direct-1.png'),
        assert.equal(_0x552e7a.imageUrl, '/output/grsai-sse-direct-1.png'));
    } finally {
      ((globalThis.fetch = _0x45a93f), (globalThis.setTimeout = _0x1b256d), (globalThis.window = _0x481268));
    }
  }),
  test('aiImageApi: grsai polls create response id through /v1/api/result', async () => {
    const _0x31ceff = globalThis.fetch,
      _0x3f7ea4 = globalThis.setTimeout,
      _0x369553 = globalThis.window,
      _0x33a6d6 = [];
    let _0x3d185c = false;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x39383b, _0x312045, ..._0x15e37d) =>
          _0x3f7ea4(_0x39383b, Number(_0x312045) > 0x1388 ? Number(_0x312045) : 0, ..._0x15e37d)),
        (globalThis.fetch = async (_0x29b8d4, _0x5443e3 = {}) => {
          const _0x984a5e = String(_0x29b8d4);
          if (_0x984a5e === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (_0x984a5e === '/api/v2/proxy/image') {
            const _0x57478d = JSON.parse(String(_0x5443e3.body || '{}')),
              _0x5402a2 = String(_0x57478d.apiUrl || '');
            return (
              assert.equal(_0x5402a2, 'https://api.grsai.example.com/v1/api/generate'),
              makeTextResponse(JSON.stringify({ status: 'pending', data: { id: 'task-grsai-result-1' } }))
            );
          }
          if (_0x984a5e.startsWith('/api/v2/proxy/task?')) {
            const _0x4ab392 = getProxyTaskApiUrl(_0x984a5e);
            return (
              (_0x3d185c = true),
              assert.equal(_0x4ab392, 'https://api.grsai.example.com/v1/api/result?id=task-grsai-result-1'),
              makeJsonResponse({
                id: 'task-grsai-result-1',
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/grsai-result-1.png' }],
              })
            );
          }
          if (_0x984a5e === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-result-1.png' });
          throw new Error('unexpected fetch url: ' + _0x984a5e);
        }));
      const { clearApiConfig: _0x5af7cf } = await import('./configApi.js');
      _0x5af7cf();
      const { generateImage: _0x1a9c75 } = await import('./aiImageApi.js'),
        _0x4d5aee = await _0x1a9c75(
          { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (_0x3a596a) => _0x33a6d6.push(_0x3a596a) },
        );
      (assert.equal(_0x33a6d6.length, 1),
        assert.equal(_0x33a6d6[0].taskId, 'task-grsai-result-1'),
        assert.equal(_0x33a6d6[0].provider, 'grsai'),
        assert.equal(_0x3d185c, true),
        assert.equal(_0x4d5aee.localPath, 'output/grsai-result-1.png'),
        assert.equal(_0x4d5aee.imageUrl, '/output/grsai-result-1.png'));
    } finally {
      ((globalThis.fetch = _0x31ceff), (globalThis.setTimeout = _0x3f7ea4), (globalThis.window = _0x369553));
    }
  }),
  test('aiImageApi: ppio async task calls onTaskMeta and supports resumeAsyncImageTask even without create status', async () => {
    const _0x157026 = globalThis.fetch,
      _0x3ed9c9 = globalThis.setTimeout,
      _0x2dc9c1 = globalThis.window,
      _0x537646 = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0xfad300, _0x383176, ..._0x23e840) =>
          _0x3ed9c9(_0xfad300, Number(_0x383176) > 0x1388 ? Number(_0x383176) : 0, ..._0x23e840)),
        (globalThis.fetch = async (_0x2be1ca, _0x5b52a8 = {}) => {
          const _0x5de97d = String(_0x2be1ca);
          if (_0x5de97d === '/api/config')
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: 'https://api.ppio.com', apiKey: 'k_ppio' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (_0x5de97d === '/api/v2/proxy/image')
            return makeTextResponse(JSON.stringify({ task_id: 'task-ppio-1' }));
          if (_0x5de97d.startsWith('/api/v2/proxy/task?'))
            return makeJsonResponse({
              status: 'SUCCEEDED',
              results: [{ url: 'https://img.example.com/ppio-final.png' }],
            });
          if (_0x5de97d === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/ppio-final.png' });
          throw new Error('unexpected fetch url: ' + _0x5de97d);
        }));
      const { clearApiConfig: _0x218e17 } = await import('./configApi.js');
      _0x218e17();
      const { generateImage: _0x3f91cc, resumeAsyncImageTask: _0x101c54 } = await import('./aiImageApi.js'),
        _0x4895f0 = { provider: 'ppio', model: 'ppio/seedream-5.0-lite', prompt: 'cat', inputUrls: [] },
        _0x4abb79 = await _0x3f91cc(_0x4895f0, { onTaskMeta: (_0x278c37) => _0x537646.push(_0x278c37) });
      (assert.equal(_0x537646.length, 1),
        assert.equal(_0x537646[0].taskId, 'task-ppio-1'),
        assert.equal(_0x537646[0].provider, 'ppio'),
        assert.equal(_0x537646[0].kind, 'image'),
        assert.equal(_0x4abb79.localPath, 'output/ppio-final.png'),
        assert.equal(_0x4abb79.imageUrl, '/output/ppio-final.png'));
      const _0x5358a7 = await _0x101c54('task-ppio-2', _0x4895f0);
      (assert.equal(_0x5358a7.localPath, 'output/ppio-final.png'),
        assert.equal(_0x5358a7.imageUrl, '/output/ppio-final.png'));
    } finally {
      ((globalThis.fetch = _0x157026), (globalThis.setTimeout = _0x3ed9c9), (globalThis.window = _0x2dc9c1));
    }
  }),
  test('aiImageApi: ppio extracts task ID from multiline data even when the final frame has no task_id', async () => {
    const _0x747df6 = globalThis.fetch,
      _0x54590a = globalThis.setTimeout,
      _0x19ebcc = globalThis.window,
      _0x2266ad = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x511792, _0x1f5614, ..._0x360ab0) =>
          _0x54590a(_0x511792, Number(_0x1f5614) > 0x1388 ? Number(_0x1f5614) : 0, ..._0x360ab0)),
        (globalThis.fetch = async (_0x3d721e, _0x19c899 = {}) => {
          const _0x3b9181 = String(_0x3d721e);
          if (_0x3b9181 === '/api/config')
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: 'https://api.ppio.com', apiKey: 'k_ppio' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (_0x3b9181 === '/api/v2/proxy/image')
            return makeTextResponse(
              'data: {"task_id":"task-ppio-sse-1","status":"submitted"}\n\ndata: {"status":"pending"}\n\n',
            );
          if (_0x3b9181.startsWith('/api/v2/proxy/task?'))
            return makeJsonResponse({
              status: 'success',
              results: [{ url: 'https://img.example.com/ppio-sse-1.png' }],
            });
          if (_0x3b9181 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/ppio-sse-1.png' });
          throw new Error('unexpected fetch url: ' + _0x3b9181);
        }));
      const { clearApiConfig: _0xc24388 } = await import('./configApi.js');
      _0xc24388();
      const { generateImage: _0x1417dc } = await import('./aiImageApi.js'),
        _0x24b142 = await _0x1417dc(
          { provider: 'ppio', model: 'ppio/seedream-5.0-lite', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (_0xfb85df) => _0x2266ad.push(_0xfb85df) },
        );
      (assert.equal(_0x2266ad.length, 1),
        assert.equal(_0x2266ad[0].taskId, 'task-ppio-sse-1'),
        assert.equal(_0x2266ad[0].provider, 'ppio'),
        assert.equal(_0x24b142.localPath, 'output/ppio-sse-1.png'));
    } finally {
      ((globalThis.fetch = _0x747df6), (globalThis.setTimeout = _0x54590a), (globalThis.window = _0x19ebcc));
    }
  }),
  test('aiImageApi: ppio polls when create response data is a string task ID', async () => {
    const _0x3080a2 = globalThis.fetch,
      _0x87b508 = globalThis.setTimeout,
      _0x2ffff5 = globalThis.window,
      _0x1a8d8b = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x43c57d, _0x52964c, ..._0x288b60) =>
          _0x87b508(_0x43c57d, Number(_0x52964c) > 0x1388 ? Number(_0x52964c) : 0, ..._0x288b60)),
        (globalThis.fetch = async (_0x4da372, _0x365eb7 = {}) => {
          const _0x23956e = String(_0x4da372);
          if (_0x23956e === '/api/config')
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: 'https://api.ppio.com', apiKey: 'k_ppio' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (_0x23956e === '/api/v2/proxy/image')
            return makeTextResponse(JSON.stringify({ data: 'task-ppio-data-string-1' }));
          if (_0x23956e.startsWith('/api/v2/proxy/task?'))
            return makeJsonResponse({
              status: 'success',
              results: [{ url: 'https://img.example.com/ppio-data-string-1.png' }],
            });
          if (_0x23956e === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/ppio-data-string-1.png' });
          throw new Error('unexpected fetch url: ' + _0x23956e);
        }));
      const { clearApiConfig: _0x49f5ef } = await import('./configApi.js');
      _0x49f5ef();
      const { generateImage: _0xe195f6 } = await import('./aiImageApi.js'),
        _0x24fc95 = await _0xe195f6(
          { provider: 'ppio', model: 'ppio/seedream-5.0-lite', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (_0x58ec4c) => _0x1a8d8b.push(_0x58ec4c) },
        );
      (assert.equal(_0x1a8d8b.length, 1),
        assert.equal(_0x1a8d8b[0].taskId, 'task-ppio-data-string-1'),
        assert.equal(_0x1a8d8b[0].provider, 'ppio'),
        assert.equal(_0x24fc95.localPath, 'output/ppio-data-string-1.png'));
    } finally {
      ((globalThis.fetch = _0x3080a2), (globalThis.setTimeout = _0x87b508), (globalThis.window = _0x2ffff5));
    }
  }),
  test('aiImageApi: grsai polls when create response body lacks task_id but header has x-task-id', async () => {
    const _0x283d40 = globalThis.fetch,
      _0x16b9e6 = globalThis.setTimeout,
      _0x12696e = globalThis.window,
      _0x4eb31f = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x43be58, _0x30c0db, ..._0x3250d5) =>
          _0x16b9e6(_0x43be58, Number(_0x30c0db) > 0x1388 ? Number(_0x30c0db) : 0, ..._0x3250d5)),
        (globalThis.fetch = async (_0x3858e6, _0x3f6255 = {}) => {
          const _0x1f9cac = String(_0x3858e6);
          if (_0x1f9cac === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (_0x1f9cac === '/api/v2/proxy/image') {
            const _0x5cd159 = JSON.parse(String(_0x3f6255.body || '{}')),
              _0x27bfb2 = String(_0x5cd159.apiUrl || '');
            if (_0x27bfb2.endsWith('/v1/api/generate'))
              return makeTextResponseWithHeaders(JSON.stringify({ status: 'pending' }), {
                'x-task-id': 'task-grsai-header-1',
              });
            throw new Error('unexpected apiUrl: ' + _0x27bfb2);
          }
          if (_0x1f9cac.startsWith('/api/v2/proxy/task?')) {
            const _0x79a01b = getProxyTaskApiUrl(_0x1f9cac);
            return (
              assert.equal(_0x79a01b, 'https://api.grsai.example.com/v1/api/result?id=task-grsai-header-1'),
              makeJsonResponse({
                id: 'task-grsai-header-1',
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/grsai-header-1.png' }],
              })
            );
          }
          if (_0x1f9cac === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-header-1.png' });
          throw new Error('unexpected fetch url: ' + _0x1f9cac);
        }));
      const { clearApiConfig: _0x24ff63 } = await import('./configApi.js');
      _0x24ff63();
      const { generateImage: _0x47a8af } = await import('./aiImageApi.js'),
        _0xe05cfb = await _0x47a8af(
          { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (_0x39a996) => _0x4eb31f.push(_0x39a996) },
        );
      (assert.equal(_0x4eb31f.length, 1),
        assert.equal(_0x4eb31f[0].taskId, 'task-grsai-header-1'),
        assert.equal(_0x4eb31f[0].provider, 'grsai'),
        assert.equal(_0xe05cfb.localPath, 'output/grsai-header-1.png'));
    } finally {
      ((globalThis.fetch = _0x283d40), (globalThis.setTimeout = _0x16b9e6), (globalThis.window = _0x12696e));
    }
  }),
  test('aiImageApi: grsai polls when create response task field is the task ID', async () => {
    const _0x219530 = globalThis.fetch,
      _0x6cc029 = globalThis.setTimeout,
      _0x1ba172 = globalThis.window,
      _0x2a24d4 = [];
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x4954b3, _0x23c9e5, ..._0x346b52) =>
          _0x6cc029(_0x4954b3, Number(_0x23c9e5) > 0x1388 ? Number(_0x23c9e5) : 0, ..._0x346b52)),
        (globalThis.fetch = async (_0x35342b, _0x51f9fd = {}) => {
          const _0x5d4366 = String(_0x35342b);
          if (_0x5d4366 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (_0x5d4366 === '/api/v2/proxy/image') {
            const _0xaf381e = JSON.parse(String(_0x51f9fd.body || '{}')),
              _0x2dad57 = String(_0xaf381e.apiUrl || '');
            if (_0x2dad57.endsWith('/v1/api/generate'))
              return makeTextResponse(JSON.stringify({ status: 'pending', task: 'task-grsai-task-key-1' }));
            throw new Error('unexpected apiUrl: ' + _0x2dad57);
          }
          if (_0x5d4366.startsWith('/api/v2/proxy/task?')) {
            const _0x16515e = getProxyTaskApiUrl(_0x5d4366);
            return (
              assert.equal(_0x16515e, 'https://api.grsai.example.com/v1/api/result?id=task-grsai-task-key-1'),
              makeJsonResponse({
                id: 'task-grsai-task-key-1',
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/grsai-task-key-1.png' }],
              })
            );
          }
          if (_0x5d4366 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-task-key-1.png' });
          throw new Error('unexpected fetch url: ' + _0x5d4366);
        }));
      const { clearApiConfig: _0x59aa88 } = await import('./configApi.js');
      _0x59aa88();
      const { generateImage: _0x4d4e19 } = await import('./aiImageApi.js'),
        _0x4218d8 = await _0x4d4e19(
          { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (_0x38e24e) => _0x2a24d4.push(_0x38e24e) },
        );
      (assert.equal(_0x2a24d4.length, 1),
        assert.equal(_0x2a24d4[0].taskId, 'task-grsai-task-key-1'),
        assert.equal(_0x2a24d4[0].provider, 'grsai'),
        assert.equal(_0x4218d8.localPath, 'output/grsai-task-key-1.png'));
    } finally {
      ((globalThis.fetch = _0x219530), (globalThis.setTimeout = _0x6cc029), (globalThis.window = _0x1ba172));
    }
  }),
  test('aiImageApi: grsai polls when create response has success and task_id', async () => {
    const _0x425a12 = globalThis.fetch,
      _0x8f7ba5 = globalThis.setTimeout,
      _0x11537d = globalThis.window,
      _0x4d665b = [];
    let _0x594587 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x1ba758, _0x5b1e52, ..._0x2a3b90) =>
          _0x8f7ba5(_0x1ba758, Number(_0x5b1e52) > 0x1388 ? Number(_0x5b1e52) : 0, ..._0x2a3b90)),
        (globalThis.fetch = async (_0x278de2, _0x123161 = {}) => {
          const _0x4e95b0 = String(_0x278de2);
          if (_0x4e95b0 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (_0x4e95b0 === '/api/v2/proxy/image') {
            const _0x1a27b6 = JSON.parse(String(_0x123161.body || '{}')),
              _0x3bba2c = String(_0x1a27b6.apiUrl || '');
            if (_0x3bba2c.endsWith('/v1/api/generate'))
              return makeTextResponse(
                JSON.stringify({ status: 'success', data: { task_id: 'task-grsai-success-ack' } }),
              );
            throw new Error('unexpected apiUrl: ' + _0x3bba2c);
          }
          if (_0x4e95b0.startsWith('/api/v2/proxy/task?')) {
            const _0x4b5bd6 = getProxyTaskApiUrl(_0x4e95b0);
            return (
              (_0x594587 += 1),
              assert.equal(
                _0x4b5bd6,
                'https://api.grsai.example.com/v1/api/result?id=task-grsai-success-ack',
              ),
              makeJsonResponse({
                id: 'task-grsai-success-ack',
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/grsai-success-ack.png' }],
              })
            );
          }
          if (_0x4e95b0 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-success-ack.png' });
          throw new Error('unexpected fetch url: ' + _0x4e95b0);
        }));
      const { clearApiConfig: _0x2a5e3e } = await import('./configApi.js');
      _0x2a5e3e();
      const { generateImage: _0xbee64b } = await import('./aiImageApi.js'),
        _0x151c72 = await _0xbee64b(
          { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (_0x530618) => _0x4d665b.push(_0x530618) },
        );
      (assert.equal(_0x4d665b.length, 1),
        assert.equal(_0x4d665b[0].taskId, 'task-grsai-success-ack'),
        assert.ok(_0x594587 >= 1),
        assert.equal(_0x151c72.localPath, 'output/grsai-success-ack.png'));
    } finally {
      ((globalThis.fetch = _0x425a12), (globalThis.setTimeout = _0x8f7ba5), (globalThis.window = _0x11537d));
    }
  }),
  test('aiImageApi: grsai polls when non-JSON create response text contains task_id', async () => {
    const _0x505143 = globalThis.fetch,
      _0x438648 = globalThis.setTimeout,
      _0x49c834 = globalThis.window,
      _0xbe2ece = [];
    let _0x49f2a5 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x558b65, _0x56275, ..._0x707905) =>
          _0x438648(_0x558b65, Number(_0x56275) > 0x1388 ? Number(_0x56275) : 0, ..._0x707905)),
        (globalThis.fetch = async (_0x264d4a, _0x3d4ac2 = {}) => {
          const _0x394aac = String(_0x264d4a);
          if (_0x394aac === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (_0x394aac === '/api/v2/proxy/image') {
            const _0x233af6 = JSON.parse(String(_0x3d4ac2.body || '{}')),
              _0x1d57e2 = String(_0x233af6.apiUrl || '');
            if (_0x1d57e2.endsWith('/v1/api/generate'))
              return makeTextResponse('status=success, task_id=task-grsai-plain-text');
            throw new Error('unexpected apiUrl: ' + _0x1d57e2);
          }
          if (_0x394aac.startsWith('/api/v2/proxy/task?')) {
            const _0x446039 = getProxyTaskApiUrl(_0x394aac);
            return (
              (_0x49f2a5 += 1),
              assert.equal(_0x446039, 'https://api.grsai.example.com/v1/api/result?id=task-grsai-plain-text'),
              makeJsonResponse({
                id: 'task-grsai-plain-text',
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/grsai-plain-text.png' }],
              })
            );
          }
          if (_0x394aac === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-plain-text.png' });
          throw new Error('unexpected fetch url: ' + _0x394aac);
        }));
      const { clearApiConfig: _0x4c71ab } = await import('./configApi.js');
      _0x4c71ab();
      const { generateImage: _0xc6d56f } = await import('./aiImageApi.js'),
        _0x296dba = await _0xc6d56f(
          { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (_0x16a07c) => _0xbe2ece.push(_0x16a07c) },
        );
      (assert.equal(_0xbe2ece.length, 1),
        assert.equal(_0xbe2ece[0].taskId, 'task-grsai-plain-text'),
        assert.ok(_0x49f2a5 >= 1),
        assert.equal(_0x296dba.localPath, 'output/grsai-plain-text.png'));
    } finally {
      ((globalThis.fetch = _0x505143), (globalThis.setTimeout = _0x438648), (globalThis.window = _0x49c834));
    }
  }),
  test('aiImageApi: ppio polls when create response has success and task_id', async () => {
    const _0x17a07e = globalThis.fetch,
      _0x35b8e4 = globalThis.setTimeout,
      _0x92a482 = globalThis.window,
      _0x8b6914 = [];
    let _0x27aff9 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x26249a, _0x584a76, ..._0x5cc3a1) =>
          _0x35b8e4(_0x26249a, Number(_0x584a76) > 0x1388 ? Number(_0x584a76) : 0, ..._0x5cc3a1)),
        (globalThis.fetch = async (_0x58cca4, _0x571558 = {}) => {
          const _0xc2b849 = String(_0x58cca4);
          if (_0xc2b849 === '/api/config')
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: 'https://api.ppio.com', apiKey: 'k_ppio' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (_0xc2b849 === '/api/v2/proxy/image')
            return makeTextResponse(JSON.stringify({ status: 'success', task_id: 'task-ppio-success-ack' }));
          if (_0xc2b849.startsWith('/api/v2/proxy/task?'))
            return (
              (_0x27aff9 += 1),
              makeJsonResponse({
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/ppio-success-ack.png' }],
              })
            );
          if (_0xc2b849 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/ppio-success-ack.png' });
          throw new Error('unexpected fetch url: ' + _0xc2b849);
        }));
      const { clearApiConfig: _0x20f054 } = await import('./configApi.js');
      _0x20f054();
      const { generateImage: _0x5f2c6d } = await import('./aiImageApi.js'),
        _0x4681dc = await _0x5f2c6d(
          { provider: 'ppio', model: 'ppio/seedream-5.0-lite', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (_0x2efd6c) => _0x8b6914.push(_0x2efd6c) },
        );
      (assert.equal(_0x8b6914.length, 1),
        assert.equal(_0x8b6914[0].taskId, 'task-ppio-success-ack'),
        assert.ok(_0x27aff9 >= 1),
        assert.equal(_0x4681dc.localPath, 'output/ppio-success-ack.png'));
    } finally {
      ((globalThis.fetch = _0x17a07e), (globalThis.setTimeout = _0x35b8e4), (globalThis.window = _0x92a482));
    }
  }),
  test('aiImageApi: provider/model mismatch rejects instead of GRSAI routing', async () => {
    const _0x12fee4 = globalThis.fetch;
    try {
      installFetchMockForConfig({
        providers: {
          ppio: { apiUrl: 'https://api.ppio.com', apiKey: 'k_ppio' },
          grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
        },
      });
      const { clearApiConfig: _0xef3f9a } = await import('./configApi.js');
      _0xef3f9a();
      const { buildGenerateImageRequest: _0x2f1291 } = await import('./aiImageApi.js');
      await assert.rejects(
        () => _0x2f1291({ provider: 'grsai', model: 'ppio/seedream-5.0-lite', prompt: 'cat', inputUrls: [] }),
        /GRSAI image model API manifest missing: ppio\/seedream-5.0-lite/,
      );
    } finally {
      globalThis.fetch = _0x12fee4;
    }
  }),
  test('aiImageApi: grsai 裸模型 + provider=runninghubwf 时按 provider 优先走 runninghubwf', async () => {
    const _0x185acc = globalThis.fetch,
      _0x104395 = globalThis.setTimeout,
      _0x5df595 = globalThis.window;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x41848b, _0xb981bd, ..._0x292055) =>
          _0x104395(_0x41848b, Number(_0xb981bd) > 0x1388 ? Number(_0xb981bd) : 0, ..._0x292055)),
        (globalThis.fetch = async (_0x15a1c6, _0x4b69c7 = {}) => {
          const _0x41f085 = String(_0x15a1c6);
          if (_0x41f085 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          throw new Error('unexpected fetch url: ' + _0x41f085);
        }));
      const { clearApiConfig: _0x4fc4ba } = await import('./configApi.js');
      _0x4fc4ba();
      const { generateImage: _0x2f1bb4 } = await import('./aiImageApi.js');
      await assert.rejects(
        () =>
          _0x2f1bb4({ provider: 'runninghubwf', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] }),
        /RunningHUB 请求|RunningHUB/,
      );
    } finally {
      ((globalThis.fetch = _0x185acc), (globalThis.setTimeout = _0x104395), (globalThis.window = _0x5df595));
    }
  }),
  test('aiImageApi: calls onTaskMeta first when create response has task_id and immediate results', async () => {
    const _0x5c4873 = globalThis.fetch,
      _0x65bdc8 = globalThis.setTimeout,
      _0xd32f01 = globalThis.window,
      _0x1fc866 = [];
    let _0x2f3927 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x1da41d, _0x4b5bae, ..._0x5ee2a8) =>
          _0x65bdc8(_0x1da41d, Number(_0x4b5bae) > 0x1388 ? Number(_0x4b5bae) : 0, ..._0x5ee2a8)),
        (globalThis.fetch = async (_0x5ebc6c) => {
          const _0x35dee1 = String(_0x5ebc6c);
          if (_0x35dee1 === '/api/config')
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: 'https://api.ppio.com', apiKey: 'k_ppio' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (_0x35dee1 === '/api/v2/proxy/image')
            return makeTextResponse(
              JSON.stringify({
                status: 'success',
                task_id: 'task-ppio-direct-result',
                results: [{ url: 'https://img.example.com/ppio-direct-result.png' }],
              }),
            );
          if (_0x35dee1.startsWith('/api/v2/proxy/task?'))
            return (
              (_0x2f3927 += 1),
              makeJsonResponse({
                status: 'success',
                results: [{ url: 'https://img.example.com/ppio-direct-result.png' }],
              })
            );
          if (_0x35dee1 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/ppio-direct-result.png' });
          throw new Error('unexpected fetch url: ' + _0x35dee1);
        }));
      const { clearApiConfig: _0x1a39aa } = await import('./configApi.js');
      _0x1a39aa();
      const { generateImage: _0x7eb4f7 } = await import('./aiImageApi.js'),
        _0x119603 = await _0x7eb4f7(
          { provider: 'ppio', model: 'ppio/seedream-5.0-lite', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (_0x62571) => _0x1fc866.push(_0x62571) },
        );
      (assert.equal(_0x1fc866.length, 1),
        assert.equal(_0x1fc866[0].taskId, 'task-ppio-direct-result'),
        assert.equal(_0x1fc866[0].provider, 'ppio'),
        assert.equal(_0x2f3927, 0),
        assert.equal(_0x119603.localPath, 'output/ppio-direct-result.png'),
        assert.equal(_0x119603.imageUrl, '/output/ppio-direct-result.png'));
    } finally {
      ((globalThis.fetch = _0x5c4873), (globalThis.setTimeout = _0x65bdc8), (globalThis.window = _0xd32f01));
    }
  }),
  test('aiImageApi: ppio extracts nested task field as task ID and polls', async () => {
    const _0x1c7bcd = globalThis.fetch,
      _0x28d5cf = globalThis.setTimeout,
      _0x461aae = globalThis.window,
      _0x49c61e = [];
    let _0x4b8c72 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x35c959, _0x5f5524, ..._0x2aa5ab) =>
          _0x28d5cf(_0x35c959, Number(_0x5f5524) > 0x1388 ? Number(_0x5f5524) : 0, ..._0x2aa5ab)),
        (globalThis.fetch = async (_0x38f717) => {
          const _0x57ef6c = String(_0x38f717);
          if (_0x57ef6c === '/api/config')
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: 'https://api.ppio.com', apiKey: 'k_ppio' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (_0x57ef6c === '/api/v2/proxy/image')
            return makeTextResponse(
              JSON.stringify({ data: { task: { id: 'task-ppio-nested-1', status: 'pending' } } }),
            );
          if (_0x57ef6c.startsWith('/api/v2/proxy/task?'))
            return (
              (_0x4b8c72 += 1),
              makeJsonResponse({
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/ppio-nested-1.png' }],
              })
            );
          if (_0x57ef6c === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/ppio-nested-1.png' });
          throw new Error('unexpected fetch url: ' + _0x57ef6c);
        }));
      const { clearApiConfig: _0xf4e799 } = await import('./configApi.js');
      _0xf4e799();
      const { generateImage: _0x1a7d3b } = await import('./aiImageApi.js'),
        _0x470960 = await _0x1a7d3b(
          { provider: 'ppio', model: 'ppio/seedream-5.0-lite', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (_0x53abd1) => _0x49c61e.push(_0x53abd1) },
        );
      (assert.equal(_0x49c61e.length, 1),
        assert.equal(_0x49c61e[0].taskId, 'task-ppio-nested-1'),
        assert.equal(_0x49c61e[0].provider, 'ppio'),
        assert.ok(_0x4b8c72 >= 1),
        assert.equal(_0x470960.localPath, 'output/ppio-nested-1.png'),
        assert.equal(_0x470960.imageUrl, '/output/ppio-nested-1.png'));
    } finally {
      ((globalThis.fetch = _0x1c7bcd), (globalThis.setTimeout = _0x28d5cf), (globalThis.window = _0x461aae));
    }
  }),
  test('aiImageApi: apimart polls when create response has success and task_id', async () => {
    const _0x499982 = globalThis.fetch,
      _0x3ea781 = globalThis.setTimeout,
      _0x3b4605 = globalThis.window,
      _0x4558cb = [];
    let _0x335016 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x2294d1, _0x4f86f4, ..._0x4d51d5) =>
          _0x3ea781(_0x2294d1, Number(_0x4f86f4) > 0x1388 ? Number(_0x4f86f4) : 0, ..._0x4d51d5)),
        (globalThis.fetch = async (_0x558d65, _0x1fb7f4 = {}) => {
          const _0x25d981 = String(_0x558d65);
          if (_0x25d981 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (_0x25d981 === '/api/v2/proxy/image')
            return makeTextResponse(
              JSON.stringify({ status: 'success', data: { task_id: 'task-apimart-success-ack' } }),
            );
          if (_0x25d981.startsWith('/api/v2/proxy/task?'))
            return (
              (_0x335016 += 1),
              makeJsonResponse({
                status: 'success',
                results: [{ url: 'https://img.example.com/apimart-success-ack.png' }],
              })
            );
          if (_0x25d981 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/apimart-success-ack.png' });
          throw new Error('unexpected fetch url: ' + _0x25d981);
        }));
      const { clearApiConfig: _0x310b2b } = await import('./configApi.js');
      _0x310b2b();
      const { generateImage: _0x4c72da } = await import('./aiImageApi.js'),
        _0x361a3b = await _0x4c72da(
          { provider: 'apimart', model: 'apimart/nano-banana-2', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (_0x5719d3) => _0x4558cb.push(_0x5719d3) },
        );
      (assert.equal(_0x4558cb.length, 1),
        assert.equal(_0x4558cb[0].taskId, 'task-apimart-success-ack'),
        assert.ok(_0x335016 >= 1),
        assert.equal(_0x361a3b.localPath, 'output/apimart-success-ack.png'));
    } finally {
      ((globalThis.fetch = _0x499982), (globalThis.setTimeout = _0x3ea781), (globalThis.window = _0x3b4605));
    }
  }),
  test('aiImageApi: apimart create response with invalid only id should not be accepted', async () => {
    const _0x247d49 = globalThis.fetch,
      _0x3424e8 = globalThis.setTimeout,
      _0x2de0a6 = globalThis.window,
      _0x4cc49e = [];
    let _0x5acf7b = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x3db2d3, _0x745839, ..._0x4e419f) =>
          _0x3424e8(_0x3db2d3, Number(_0x745839) > 0x1388 ? Number(_0x745839) : 0, ..._0x4e419f)),
        (globalThis.fetch = async (_0x396947, _0x1ccd20 = {}) => {
          const _0xe7bc36 = String(_0x396947);
          if (_0xe7bc36 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (_0xe7bc36 === '/api/v2/proxy/image')
            return makeTextResponse(
              JSON.stringify({
                status: 'success',
                data: { id: 'resp-apimart-only-id-1', status: 'submitted' },
              }),
            );
          if (_0xe7bc36.startsWith('/api/v2/proxy/task?'))
            return (
              (_0x5acf7b += 1),
              makeJsonResponse({ code: 0x190, message: 'invalid task id' }, { status: 0x190 })
            );
          if (_0xe7bc36 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/apimart-only-id.png' });
          throw new Error('unexpected fetch url: ' + _0xe7bc36);
        }));
      const { clearApiConfig: _0x2b19ee } = await import('./configApi.js');
      _0x2b19ee();
      const { generateImage: _0x1795e4 } = await import('./aiImageApi.js');
      (await assert.rejects(
        () =>
          _0x1795e4(
            { provider: 'apimart', model: 'apimart/nano-banana-2', prompt: 'cat', inputUrls: [] },
            { onTaskMeta: (_0x297842) => _0x4cc49e.push(_0x297842) },
          ),
        /APIMart|task|id|提取|解析/i,
      ),
        assert.equal(_0x4cc49e.length, 0),
        assert.ok(_0x5acf7b >= 1));
    } finally {
      ((globalThis.fetch = _0x247d49), (globalThis.setTimeout = _0x3424e8), (globalThis.window = _0x2de0a6));
    }
  }),
  test('aiImageApi: grsai gpt-image-2 创建走 /v1/api/generate 且查询走 /v1/api/result', async () => {
    const _0x588259 = globalThis.fetch,
      _0xdab24c = globalThis.setTimeout,
      _0x51557d = globalThis.window,
      _0x4573eb = [];
    let _0x1ba0ee = false,
      _0x1d2d33 = false;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x525730, _0x58533f, ..._0x1473c0) =>
          _0xdab24c(_0x525730, Number(_0x58533f) > 0x1388 ? Number(_0x58533f) : 0, ..._0x1473c0)),
        (globalThis.fetch = async (_0x59e03b, _0x4aa7d8 = {}) => {
          const _0xf27229 = String(_0x59e03b);
          if (_0xf27229 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com/v1/', apiKey: 'k_grsai' } },
            });
          if (_0xf27229 === '/api/v2/proxy/image') {
            const _0x51757f = JSON.parse(String(_0x4aa7d8.body || '{}')),
              _0x5d73fe = String(_0x51757f.apiUrl || '');
            if (_0x5d73fe.endsWith('/v1/api/generate'))
              return (
                (_0x1ba0ee = true),
                assert.equal(_0x51757f.model, 'gpt-image-2-vip'),
                assert.deepEqual(_0x51757f.images, []),
                assert.equal(_0x51757f.replyType, 'json'),
                assert.equal(_0x51757f.aspectRatio, '2880x2880'),
                assert.equal(_0x51757f.imageSize, undefined),
                makeTextResponse(
                  JSON.stringify({ status: 'pending', data: { task_id: 'task-grsai-gpt-image-2-1' } }),
                )
              );
            throw new Error('unexpected apiUrl: ' + _0x5d73fe);
          }
          if (_0xf27229.startsWith('/api/v2/proxy/task?')) {
            const _0x84149f = getProxyTaskApiUrl(_0xf27229);
            return (
              (_0x1d2d33 = true),
              assert.equal(
                _0x84149f,
                'https://api.grsai.example.com/v1/api/result?id=task-grsai-gpt-image-2-1',
              ),
              makeJsonResponse({
                id: 'task-grsai-gpt-image-2-1',
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/grsai-gpt-image-2-final.png' }],
              })
            );
          }
          if (_0xf27229 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-gpt-image-2-final.png' });
          throw new Error('unexpected fetch url: ' + _0xf27229);
        }));
      const { clearApiConfig: _0xb5520e } = await import('./configApi.js');
      _0xb5520e();
      const { generateImage: _0xcfef47 } = await import('./aiImageApi.js'),
        _0x477d97 = await _0xcfef47(
          {
            provider: 'grsai',
            model: 'gpt-image-2',
            mode: 'vip',
            prompt: 'cat',
            imageSize: '4K',
            inputUrls: [],
          },
          { onTaskMeta: (_0x90b491) => _0x4573eb.push(_0x90b491) },
        );
      (assert.equal(_0x1ba0ee, true),
        assert.equal(_0x1d2d33, true),
        assert.equal(_0x4573eb.length, 1),
        assert.equal(_0x4573eb[0].taskId, 'task-grsai-gpt-image-2-1'),
        assert.equal(_0x4573eb[0].provider, 'grsai'),
        assert.equal(_0x477d97.localPath, 'output/grsai-gpt-image-2-final.png'),
        assert.equal(_0x477d97.imageUrl, '/output/grsai-gpt-image-2-final.png'));
    } finally {
      ((globalThis.fetch = _0x588259), (globalThis.setTimeout = _0xdab24c), (globalThis.window = _0x51557d));
    }
  }),
  test('aiImageApi: grsai mixed image results preserve failed slot', async () => {
    const _0x7bf29 = globalThis.fetch,
      _0x362418 = globalThis.setTimeout,
      _0x3d4a10 = globalThis.window,
      _0x231a91 = [];
    let _0x2b45e7 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x1d8bc5, _0x1719bd, ..._0x1c8d62) =>
          _0x362418(_0x1d8bc5, Number(_0x1719bd) > 0x1388 ? Number(_0x1719bd) : 0, ..._0x1c8d62)),
        (globalThis.fetch = async (_0x2dfa29, _0x15dfaf = {}) => {
          const _0x2d27ee = String(_0x2dfa29);
          if (_0x2d27ee === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (_0x2d27ee === '/api/v2/proxy/image') {
            const _0x594176 = JSON.parse(String(_0x15dfaf.body || '{}')),
              _0x20d32d = String(_0x594176.apiUrl || '');
            if (_0x20d32d.endsWith('/v1/api/generate'))
              return makeTextResponse(
                JSON.stringify({ status: 'pending', data: { task_id: 'task-grsai-mixed-1' } }),
              );
            throw new Error('unexpected apiUrl: ' + _0x20d32d);
          }
          if (_0x2d27ee.startsWith('/api/v2/proxy/task?')) {
            const _0x1f4e13 = getProxyTaskApiUrl(_0x2d27ee);
            return (
              assert.equal(_0x1f4e13, 'https://api.grsai.example.com/v1/api/result?id=task-grsai-mixed-1'),
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
          if (_0x2d27ee === '/api/v2/save_output_from_url')
            return ((_0x2b45e7 += 1), makeJsonResponse({ path: 'output/grsai-mixed-' + _0x2b45e7 + '.png' }));
          throw new Error('unexpected fetch url: ' + _0x2d27ee);
        }));
      const { clearApiConfig: _0x60a008 } = await import('./configApi.js');
      _0x60a008();
      const { generateImage: _0x5a016e } = await import('./aiImageApi.js'),
        _0x17d962 = await _0x5a016e(
          {
            provider: 'grsai',
            model: 'gpt-image-2',
            mode: 'vip',
            prompt: 'cat',
            imageSize: '2K',
            batchSize: 1,
            inputUrls: [],
          },
          { onTaskMeta: (_0x1b406b) => _0x231a91.push(_0x1b406b) },
        );
      (assert.equal(_0x231a91.length, 1),
        assert.equal(_0x231a91[0].taskId, 'task-grsai-mixed-1'),
        assert.equal(_0x17d962?.isBatch, true),
        assert.equal(_0x17d962?.images?.length, 4),
        assert.equal(_0x17d962.images[0].error, '内容违规'),
        assert.equal(_0x17d962.images[0].imageUrl, ''),
        assert.equal(_0x17d962.images[1].localPath, 'output/grsai-mixed-1.png'),
        assert.equal(_0x17d962.images[2].localPath, 'output/grsai-mixed-2.png'),
        assert.equal(_0x17d962.images[3].localPath, 'output/grsai-mixed-3.png'),
        assert.equal(_0x2b45e7, 3));
    } finally {
      ((globalThis.fetch = _0x7bf29), (globalThis.setTimeout = _0x362418), (globalThis.window = _0x3d4a10));
    }
  }),
  test('aiImageApi: apimart request_id should be probed and rejected when it is not a task id', async () => {
    const _0xe39fe = globalThis.fetch,
      _0x38665f = globalThis.setTimeout,
      _0x4fc764 = globalThis.window,
      _0x58d15c = [];
    let _0x5add6c = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x516905, _0xbb35c2, ..._0x547bbd) =>
          _0x38665f(_0x516905, Number(_0xbb35c2) > 0x1388 ? Number(_0xbb35c2) : 0, ..._0x547bbd)),
        (globalThis.fetch = async (_0x32bed8, _0x4592f1 = {}) => {
          const _0x57474e = String(_0x32bed8);
          if (_0x57474e === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (_0x57474e === '/api/v2/proxy/image')
            return makeTextResponse(
              JSON.stringify({
                status: 'success',
                data: { request_id: 'req-apimart-not-task', status: 'submitted' },
              }),
            );
          if (_0x57474e.startsWith('/api/v2/proxy/task?'))
            return (
              (_0x5add6c += 1),
              makeJsonResponse({ code: 0x190, message: 'Invalid task ID' }, { status: 0x190 })
            );
          if (_0x57474e === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/should-not-save.png' });
          throw new Error('unexpected fetch url: ' + _0x57474e);
        }));
      const { clearApiConfig: _0x4afcba } = await import('./configApi.js');
      _0x4afcba();
      const { generateImage: _0xaefb01 } = await import('./aiImageApi.js');
      (await assert.rejects(
        () =>
          _0xaefb01(
            { provider: 'apimart', model: 'apimart/nano-banana-2', prompt: 'cat', inputUrls: [] },
            { onTaskMeta: (_0x5f1b84) => _0x58d15c.push(_0x5f1b84) },
          ),
        /APIMart|task|id|提取|解析|图片地址/i,
      ),
        assert.equal(_0x58d15c.length, 0),
        assert.equal(_0x5add6c, 0));
    } finally {
      ((globalThis.fetch = _0xe39fe), (globalThis.setTimeout = _0x38665f), (globalThis.window = _0x4fc764));
    }
  }),
  test('aiImageApi: apimart create response with only id probes task endpoint before polling', async () => {
    const _0x2f651a = globalThis.fetch,
      _0x58ae0e = globalThis.setTimeout,
      _0x269ec2 = globalThis.window,
      _0x2b02d2 = [];
    let _0x31312a = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x2d7ab1, _0x418618, ..._0x762f9d) =>
          _0x58ae0e(_0x2d7ab1, Number(_0x418618) > 0x1388 ? Number(_0x418618) : 0, ..._0x762f9d)),
        (globalThis.fetch = async (_0x54f19c, _0x4e5a56 = {}) => {
          const _0xe7c9 = String(_0x54f19c);
          if (_0xe7c9 === '/api/config')
            return makeJsonResponse({
              providers: {
                apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
                grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' },
              },
            });
          if (_0xe7c9 === '/api/v2/proxy/image')
            return makeTextResponse(
              JSON.stringify({
                status: 'success',
                data: { id: 'task-apimart-only-id-valid', status: 'submitted' },
              }),
            );
          if (_0xe7c9.startsWith('/api/v2/proxy/task?'))
            return (
              (_0x31312a += 1),
              assert.ok(
                _0xe7c9.includes(
                  encodeURIComponent(
                    'https://api.apimart.ai/v1/tasks/task-apimart-only-id-valid?language=zh',
                  ),
                ),
              ),
              makeJsonResponse(
                _0x31312a === 1
                  ? { status: 'running' }
                  : {
                      status: 'success',
                      results: [{ url: 'https://img.example.com/apimart-only-id-valid.png' }],
                    },
              )
            );
          if (_0xe7c9 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/apimart-only-id-valid.png' });
          throw new Error('unexpected fetch url: ' + _0xe7c9);
        }));
      const { clearApiConfig: _0xb3627d } = await import('./configApi.js');
      _0xb3627d();
      const { generateImage: _0x364423 } = await import('./aiImageApi.js'),
        _0x38f5f5 = await _0x364423(
          { provider: 'apimart', model: 'apimart/nano-banana-2', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (_0x454323) => _0x2b02d2.push(_0x454323) },
        );
      (assert.equal(_0x2b02d2.length, 1),
        assert.equal(_0x2b02d2[0].taskId, 'task-apimart-only-id-valid'),
        assert.ok(_0x31312a >= 2),
        assert.equal(_0x38f5f5.localPath, 'output/apimart-only-id-valid.png'));
    } finally {
      ((globalThis.fetch = _0x2f651a), (globalThis.setTimeout = _0x58ae0e), (globalThis.window = _0x269ec2));
    }
  }),
  test('aiImageApi: grsai stops immediately when polling returns sensitive content violation', async () => {
    const _0x4881e9 = globalThis.fetch,
      _0x5bec1e = globalThis.setTimeout,
      _0x57885f = globalThis.window,
      _0xba598b = [];
    let _0x3584e1 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x55ce50, _0x283364, ..._0x47da) =>
          _0x5bec1e(_0x55ce50, Number(_0x283364) > 0x1388 ? Number(_0x283364) : 0, ..._0x47da)),
        (globalThis.fetch = async (_0x28f6c4, _0x57cf66 = {}) => {
          const _0x3b2ec3 = String(_0x28f6c4);
          if (_0x3b2ec3 === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (_0x3b2ec3 === '/api/v2/proxy/image') {
            const _0x33cbef = JSON.parse(String(_0x57cf66.body || '{}')),
              _0x21c258 = String(_0x33cbef.apiUrl || '');
            if (_0x21c258.endsWith('/v1/api/generate'))
              return makeTextResponse(
                JSON.stringify({ status: 'pending', data: { task_id: 'task-grsai-sensitive-1' } }),
              );
            throw new Error('unexpected apiUrl: ' + _0x21c258);
          }
          if (_0x3b2ec3.startsWith('/api/v2/proxy/task?')) {
            const _0x351fa3 = getProxyTaskApiUrl(_0x3b2ec3);
            return (
              (_0x3584e1 += 1),
              assert.equal(
                _0x351fa3,
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
          if (_0x3b2ec3 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/should-not-save.png' });
          throw new Error('unexpected fetch url: ' + _0x3b2ec3);
        }));
      const { clearApiConfig: _0x2f3718 } = await import('./configApi.js');
      _0x2f3718();
      const { generateImage: _0x9cc2bc } = await import('./aiImageApi.js');
      (await assert.rejects(
        () =>
          _0x9cc2bc(
            { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
            { onTaskMeta: (_0x2bd719) => _0xba598b.push(_0x2bd719) },
          ),
        /过滤|违规|sensitive/i,
      ),
        assert.equal(_0xba598b.length, 1),
        assert.equal(_0xba598b[0].taskId, 'task-grsai-sensitive-1'),
        assert.equal(_0x3584e1, 1));
    } finally {
      ((globalThis.fetch = _0x4881e9), (globalThis.setTimeout = _0x5bec1e), (globalThis.window = _0x57885f));
    }
  }),
  test('aiImageApi: grsai 轮询只走 /v1/api/result 并最终落盘', async () => {
    const _0x12d7dc = globalThis.fetch,
      _0x4c0df6 = globalThis.setTimeout,
      _0x3d4f0b = globalThis.window,
      _0x150bc4 = [];
    let _0x224649 = 0;
    try {
      ((globalThis.window = { currentProjectId: 'proj-test', location: { href: 'http://localhost/' } }),
        (globalThis.setTimeout = (_0x12c5c8, _0x588942, ..._0x4a11f6) =>
          _0x4c0df6(_0x12c5c8, Number(_0x588942) > 0x1388 ? Number(_0x588942) : 0, ..._0x4a11f6)),
        (globalThis.fetch = async (_0x4737e6, _0x10601b = {}) => {
          const _0x326a0f = String(_0x4737e6);
          if (_0x326a0f === '/api/config')
            return makeJsonResponse({
              providers: { grsai: { apiUrl: 'https://api.grsai.example.com', apiKey: 'k_grsai' } },
            });
          if (_0x326a0f === '/api/v2/proxy/image') {
            const _0x576430 = JSON.parse(String(_0x10601b.body || '{}')),
              _0x5274cd = String(_0x576430.apiUrl || '');
            if (_0x5274cd.endsWith('/v1/api/generate'))
              return makeTextResponse(
                JSON.stringify({ status: 'pending', data: { task_id: 'task-grsai-probe-1' } }),
              );
            throw new Error('unexpected apiUrl: ' + _0x5274cd);
          }
          if (_0x326a0f.startsWith('/api/v2/proxy/task?')) {
            const _0x568177 = getProxyTaskApiUrl(_0x326a0f);
            return (
              (_0x224649 += 1),
              assert.equal(_0x568177, 'https://api.grsai.example.com/v1/api/result?id=task-grsai-probe-1'),
              makeJsonResponse({
                id: 'task-grsai-probe-1',
                status: 'succeeded',
                results: [{ url: 'https://img.example.com/grsai-probe-final.png' }],
              })
            );
          }
          if (_0x326a0f === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/grsai-probe-final.png' });
          throw new Error('unexpected fetch url: ' + _0x326a0f);
        }));
      const { clearApiConfig: _0x41b5ce } = await import('./configApi.js');
      _0x41b5ce();
      const { generateImage: _0x1a6ade } = await import('./aiImageApi.js'),
        _0x517000 = await _0x1a6ade(
          { provider: 'grsai', model: 'nano-banana-pro-vt', prompt: 'cat', inputUrls: [] },
          { onTaskMeta: (_0x1cdc47) => _0x150bc4.push(_0x1cdc47) },
        );
      (assert.equal(_0x150bc4.length, 1),
        assert.equal(_0x150bc4[0].taskId, 'task-grsai-probe-1'),
        assert.equal(_0x224649, 1),
        assert.equal(_0x517000.localPath, 'output/grsai-probe-final.png'),
        assert.equal(_0x517000.imageUrl, '/output/grsai-probe-final.png'));
    } finally {
      ((globalThis.fetch = _0x12d7dc), (globalThis.setTimeout = _0x4c0df6), (globalThis.window = _0x3d4f0b));
    }
  }));
