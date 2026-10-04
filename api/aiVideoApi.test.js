import test from 'node:test';
import assert from 'node:assert/strict';
import { __test__, buildGenerateVideoRequest, generateVideo, resumeAsyncVideoTask } from './aiVideoApi.js';
(test('processVideoTaskResult should parse RunningHub array url into multi videos', () => {
  const value = {
      code: 0,
      data: [{ url: ['https://cdn.example.com/a.mp4', 'https://cdn.example.com/b.mp4'] }],
    },
    item = __test__.processVideoTaskResult(value, 'runninghubwf');
  (assert.equal(item.isBatch, true),
    assert.ok(Array.isArray(item.videos)),
    assert.equal(item.videos.length, 2),
    assert.equal(item.videos[0].videoUrl, 'https://cdn.example.com/a.mp4'),
    assert.equal(item.videos[1].videoUrl, 'https://cdn.example.com/b.mp4'));
}),
  test('processVideoTaskResult should prefer manifest responseMapping result paths', () => {
    const key = { vendorEnvelope: { assets: [{ href: 'https://cdn.example.com/manifest-path.mp4' }] } },
      index = __test__.processVideoTaskResult(key, 'apimart', {
        responseMapping: { resultPaths: ['vendorEnvelope.assets[].href'] },
      });
    assert.equal(index.videoUrl, 'https://cdn.example.com/manifest-path.mp4');
  }),
  test('processVideoTaskResult should parse Agnes official video_url mapping', () => {
    const result = {
        id: 'agnes-task-1',
        status: 'completed',
        video_url: 'https://storage.googleapis.com/agnes/video.mp4',
      },
      data = __test__.processVideoTaskResult(result, 'agnes', {
        responseMapping: { resultPaths: ['video_url', 'output.video'] },
      });
    assert.equal(data.videoUrl, 'https://storage.googleapis.com/agnes/video.mp4');
  }),
  test('processVideoTaskResult should parse RunningHub snake_case video result fields', () => {
    const options = {
        code: 0,
        data: [
          {
            file_url: 'https://cdn.example.com/rh-video-file?id=abc',
            thumbnail_url: 'https://cdn.example.com/rh-video-file.jpg',
          },
        ],
      },
      target = __test__.processVideoTaskResult(options, 'runninghubwf');
    (assert.equal(target.videoUrl, 'https://cdn.example.com/rh-video-file?id=abc'),
      assert.equal(target.thumbUrl, 'https://cdn.example.com/rh-video-file.jpg'));
  }),
  test('processVideoTaskResult should parse RunningHub download_url video result fields', () => {
    const source = {
        code: 0,
        data: { outputs: [{ download_url: 'https://cdn.example.com/rh-download-video?id=xyz' }] },
      },
      next = __test__.processVideoTaskResult(source, 'runninghubwf');
    assert.equal(next.videoUrl, 'https://cdn.example.com/rh-download-video?id=xyz');
  }),
  test('processVideoTaskResult should prefer typed RunningHub video over audio url', () => {
    const current = {
        code: 0,
        data: [
          { type: 'audio', url: 'https://cdn.example.com/rh-lipsync-audio?id=abc' },
          { type: 'video', url: 'https://cdn.example.com/rh-lipsync-video?id=xyz' },
        ],
      },
      entry = __test__.processVideoTaskResult(current, 'runninghubwf');
    (assert.equal(entry.videoUrl, 'https://cdn.example.com/rh-lipsync-video?id=xyz'),
      assert.equal(entry.videos.length, 1));
  }),
  test('extractVideoUrls should ignore thumbnail-only objects when a video url exists', () => {
    const record = __test__.extractVideoUrls({
      result: {
        videos: [
          {
            url: 'https://cdn.example.com/result-video.mp4',
            thumbnail_url: 'https://cdn.example.com/result-video.jpg',
          },
        ],
      },
    });
    assert.deepEqual(record, ['https://cdn.example.com/result-video.mp4']);
  }),
  test('buildGenerateVideoRequest should build Dreamina route-specific request', async () => {
    const dom = await buildGenerateVideoRequest({
      provider: 'dreamina',
      model: 'dreamina/3.5pro',
      prompt: 'season changes',
      dreaminaRouteMode: 'frames2video',
      inputUrls: ['/a.png', '/b.png'],
      duration: 6,
      resolution: '1080p',
    });
    (assert.equal(dom.url, '/api/v2/dreamina/frames2video'),
      assert.equal(dom.body.first, '/a.png'),
      assert.equal(dom.body.last, '/b.png'),
      assert.equal(dom.body.modelVersion, '3.5pro'));
  }),
  test('buildGenerateVideoRequest should normalize legacy seedance model to Dreamina', async () => {
    const dom2 = await buildGenerateVideoRequest({
      model: 'seedance-2.0-fast',
      prompt: 'two people talking',
      duration: 4,
    });
    (assert.equal(dom2.url, '/api/v2/dreamina/text2video'),
      assert.equal(dom2.body.modelVersion, 'seedance2.0fast'));
  }),
  test('buildGenerateVideoRequest should use BERNINI RunningHub video workflow manifest', async () => {
    const { clearApiConfig: clearApiConfig } = await import('./configApi.js');
    clearApiConfig();
    const payload = globalThis.fetch;
    let dom3;
    try {
      ((globalThis.fetch = async (handle) => {
        if (String(handle) === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiKey: 'k_runninghub' } } });
        throw new Error('unexpected fetch url: ' + String(handle));
      }),
        (dom3 = await buildGenerateVideoRequest({
          provider: 'runninghubwf',
          model: 'runninghub/2062515720147259393',
          apiKey: 'k_runninghub',
          prompt: 'text to video',
          rhVideoResolution: 0x340,
          rhBerniniAspectRatio: '16:9',
        })));
    } finally {
      globalThis.fetch = payload;
    }
    const run = (state, config) =>
      dom3.body.nodeInfoList.find((item2) => item2.nodeId === state && item2.fieldName === config);
    (assert.equal(dom3.url, '/api/v2/proxy/image'),
      assert.equal(dom3.isAsync, true),
      assert.equal(dom3.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/2062515720147259393'),
      assert.equal(dom3.body.instanceType, 'default'),
      assert.equal(run('34', 'value')?.fieldValue, '0'),
      assert.equal(run('17', 'value')?.fieldValue, '832'),
      assert.equal(run('18', 'value')?.fieldValue, '472'));
  }),
  test('buildGenerateVideoRequest should fail unregistered prefixed model without provider inference', async () => {
    await assert.rejects(
      () => buildGenerateVideoRequest({ model: 'apimart/unregistered-video-model', prompt: 'city lights' }),
      /Video model API manifest missing: apimart\/unregistered-video-model/,
    );
  }),
  test('buildGenerateVideoRequest should use APIMart video modelApi manifest', async () => {
    const { clearApiConfig: clearApiConfig2 } = await import('./configApi.js');
    clearApiConfig2();
    const scope = globalThis.fetch;
    try {
      globalThis.fetch = async (input) => {
        if (String(input) === '/api/config')
          return makeJsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        throw new Error('unexpected fetch url: ' + String(input));
      };
      const dom4 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/doubao-seedance-2.0-fast',
        prompt: 'city lights',
        aspectRatio: '9:16',
        duration: 5,
      });
      (assert.equal(dom4.adapterTrace?.source, 'manifest'),
        assert.equal(dom4.adapterTrace?.executionId, 'apimart.model-api.video.doubao-seedance-2-fast.v1'),
        assert.equal(dom4.body.apiUrl, 'https://api.apimart.ai/v1/videos/generations'),
        assert.equal(dom4.body.model, 'doubao-seedance-2.0-fast'),
        assert.equal(dom4.body.size, '9:16'),
        assert.equal(dom4.taskPolling?.urlTemplate, 'https://api.apimart.ai/v1/tasks/{taskId}?language=zh'));
    } finally {
      globalThis.fetch = scope;
    }
  }),
  test('buildGenerateVideoRequest should use APIMart domestic route for endpoint and polling', async () => {
    const { clearApiConfig: clearApiConfig3 } = await import('./configApi.js');
    clearApiConfig3();
    const output = globalThis.fetch;
    try {
      globalThis.fetch = async (value2) => {
        if (String(value2) === '/api/config')
          return makeJsonResponse({ providers: { apimart: { routeId: 'domestic2', apiKey: 'k_apimart' } } });
        throw new Error('unexpected fetch url: ' + String(value2));
      };
      const dom5 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/doubao-seedance-2.0-fast',
        prompt: 'city lights',
        aspectRatio: '9:16',
        duration: 5,
      });
      (assert.equal(dom5.body.apiUrl, 'https://api.aishuch.com/v1/videos/generations'),
        assert.equal(dom5.taskPolling?.urlTemplate, 'https://api.aishuch.com/v1/tasks/{taskId}?language=zh'));
    } finally {
      globalThis.fetch = output;
    }
  }),
  test('buildGenerateVideoRequest should pass APIMart Seedance 2.0 private avatar asset URLs', async () => {
    const { clearApiConfig: clearApiConfig4 } = await import('./configApi.js');
    clearApiConfig4();
    const value3 = globalThis.fetch;
    try {
      globalThis.fetch = async (value4) => {
        if (String(value4) === '/api/config')
          return makeJsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        throw new Error('unexpected fetch url: ' + String(value4));
      };
      const dom6 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/doubao-seedance-2.0-fast',
        prompt: 'make a smooth transition',
        first: '/data/uploads/first.png',
        last: '/data/uploads/last.png',
        inputUrls: ['/data/uploads/first.png', '/data/uploads/last.png'],
        providerAssetRefs: [
          {
            provider: 'apimart',
            capability: 'seedance2PrivateAvatar',
            status: 'passed',
            sourceKind: 'image',
            sourceUrl: '/data/uploads/first.png',
            assetUrl: 'asset://private-first',
          },
          {
            provider: 'apimart',
            capability: 'seedance2PrivateAvatar',
            status: 'passed',
            sourceKind: 'image',
            sourceUrl: '/data/uploads/last.png',
            assetUrl: 'asset://private-last',
          },
        ],
      });
      assert.deepEqual(dom6.body.image_with_roles, [
        { url: 'asset://private-first', role: 'first_frame' },
        { url: 'asset://private-last', role: 'last_frame' },
      ]);
    } finally {
      globalThis.fetch = value3;
    }
  }),
  test('buildGenerateVideoRequest should use Volcengine Seedance 2.0 official task body', async () => {
    const { clearApiConfig: clearApiConfig5 } = await import('./configApi.js');
    clearApiConfig5();
    const value5 = globalThis.fetch,
      list = [];
    try {
      globalThis.fetch = async (value6, dom7 = {}) => {
        const value7 = String(value6);
        if (value7 === '/api/config')
          return makeJsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_volcengine' },
            },
          });
        if (value7 === '/local/first.png')
          return makeBlobResponse(new Blob(['first'], { type: 'image/png' }), 200, 'image/png');
        if (value7 === '/local/last.png')
          return makeBlobResponse(new Blob(['last'], { type: 'image/png' }), 200, 'image/png');
        if (value7.startsWith('/api/v2/proxy/upload?')) {
          const uRL = new URL('http://local' + value7).searchParams.get('apiUrl');
          assert.equal(uRL, 'https://uguu.se/upload');
          const value8 = Object.fromEntries(dom7.body.entries()),
            value9 = await value8['files[]'].text();
          return (list.push(value9), makeJsonResponse({ url: 'https://uguu.example/' + value9 + '.png' }));
        }
        throw new Error('unexpected fetch url: ' + value7);
      };
      const dom8 = await buildGenerateVideoRequest({
        provider: 'volcengine',
        model: 'volcengine/seedance-2.0',
        prompt: 'camera transition',
        inputUrlsBySlot: { firstFrame: '/local/first.png', lastFrame: '/local/last.png' },
        generationParams: {
          volcengine_seedance_2_mode: 'frames2video',
          aspectRatio: '16:9',
          resolution: '1080p',
          duration: 7,
          generateAudio: false,
          seed: '42',
        },
      });
      (assert.deepEqual(list, ['first', 'last']),
        assert.equal(dom8.adapterTrace?.source, 'manifest'),
        assert.equal(dom8.adapterTrace?.executionId, 'volcengine.model-api.video.seedance-2.v1'),
        assert.equal(dom8.body.apiUrl, 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks'),
        assert.equal(dom8.body.apiKey, 'k_volcengine'),
        assert.equal(dom8.body.model, 'doubao-seedance-2-0-260128'),
        assert.deepEqual(dom8.body.content, [
          { type: 'text', text: 'camera transition' },
          { type: 'image_url', image_url: { url: 'https://uguu.example/first.png' }, role: 'first_frame' },
          { type: 'image_url', image_url: { url: 'https://uguu.example/last.png' }, role: 'last_frame' },
        ]),
        assert.equal(dom8.body.resolution, '1080p'),
        assert.equal(dom8.body.ratio, '16:9'),
        assert.equal(dom8.body.duration, 7),
        assert.equal(dom8.body.generate_audio, false),
        assert.equal(dom8.body.seed, 42),
        assert.equal(
          dom8.taskPolling?.urlTemplate,
          'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/{taskId}',
        ));
    } finally {
      globalThis.fetch = value5;
    }
  }),
  test('buildGenerateVideoRequest should infer Volcengine Seedance text from empty inputs', async () => {
    const { clearApiConfig: clearApiConfig6 } = await import('./configApi.js');
    clearApiConfig6();
    const value10 = globalThis.fetch;
    try {
      globalThis.fetch = async (value11) => {
        if (String(value11) === '/api/config')
          return makeJsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_volcengine' },
            },
          });
        throw new Error('unexpected fetch url: ' + String(value11));
      };
      const dom9 = await buildGenerateVideoRequest({
        provider: 'volcengine',
        model: 'volcengine/seedance-2.0-fast',
        prompt: 'a quiet lake at sunrise',
      });
      (assert.equal(dom9.body.model, 'doubao-seedance-2-0-fast-260128'),
        assert.deepEqual(dom9.body.content, [{ type: 'text', text: 'a quiet lake at sunrise' }]),
        assert.equal(dom9.body.resolution, '720p'),
        assert.equal(dom9.body.ratio, 'adaptive'));
    } finally {
      globalThis.fetch = value10;
    }
  }),
  test('buildGenerateVideoRequest should use Volcengine Seedance 2.0 Mini backend model', async () => {
    const { clearApiConfig: clearApiConfig7 } = await import('./configApi.js');
    clearApiConfig7();
    const value12 = globalThis.fetch;
    try {
      globalThis.fetch = async (value13) => {
        if (String(value13) === '/api/config')
          return makeJsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_volcengine' },
            },
          });
        throw new Error('unexpected fetch url: ' + String(value13));
      };
      const dom10 = await buildGenerateVideoRequest({
        provider: 'volcengine',
        model: 'volcengine/seedance-2.0-mini',
        prompt: 'a small paper boat on the sea',
      });
      (assert.equal(dom10.adapterTrace?.source, 'manifest'),
        assert.equal(dom10.adapterTrace?.executionId, 'volcengine.model-api.video.seedance-2-mini.v1'),
        assert.equal(
          dom10.body.apiUrl,
          'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks',
        ),
        assert.equal(dom10.body.model, 'doubao-seedance-2-0-mini-260615'),
        assert.deepEqual(dom10.body.content, [{ type: 'text', text: 'a small paper boat on the sea' }]),
        assert.equal(dom10.body.resolution, '720p'),
        assert.equal(dom10.body.ratio, 'adaptive'));
    } finally {
      globalThis.fetch = value12;
    }
  }),
  test('buildGenerateVideoRequest should infer Volcengine Seedance image from one first frame', async () => {
    const { clearApiConfig: clearApiConfig8 } = await import('./configApi.js');
    clearApiConfig8();
    const value14 = globalThis.fetch;
    try {
      globalThis.fetch = async (value15, dom11 = {}) => {
        const value16 = String(value15);
        if (value16 === '/api/config')
          return makeJsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_volcengine' },
            },
          });
        if (value16 === '/local/first.png')
          return makeBlobResponse(new Blob(['first'], { type: 'image/png' }), 200, 'image/png');
        if (value16.startsWith('/api/v2/proxy/upload?')) {
          const uRL2 = new URL('http://local' + value16).searchParams.get('apiUrl');
          assert.equal(uRL2, 'https://uguu.se/upload');
          const value17 = Object.fromEntries(dom11.body.entries()),
            value18 = await value17['files[]'].text();
          return makeJsonResponse({ url: 'https://uguu.example/' + value18 + '.png' });
        }
        throw new Error('unexpected fetch url: ' + value16);
      };
      const dom12 = await buildGenerateVideoRequest({
        provider: 'volcengine',
        model: 'volcengine/seedance-2.0',
        prompt: 'make the subject smile',
        dreaminaRouteMode: 'frames2video',
        images: ['/local/first.png'],
        inputUrls: ['/local/first.png'],
      });
      assert.deepEqual(dom12.body.content, [
        { type: 'text', text: 'make the subject smile' },
        { type: 'image_url', image_url: { url: 'https://uguu.example/first.png' }, role: 'first_frame' },
      ]);
    } finally {
      globalThis.fetch = value14;
    }
  }),
  test('buildGenerateVideoRequest should map Volcengine Seedance multimodal references', async () => {
    const { clearApiConfig: clearApiConfig9 } = await import('./configApi.js');
    clearApiConfig9();
    const value19 = globalThis.fetch;
    try {
      globalThis.fetch = async (value20, dom13 = {}) => {
        const value21 = String(value20);
        if (value21 === '/api/config')
          return makeJsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_volcengine' },
              apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
            },
          });
        if (value21 === '/local/ref.png')
          return makeBlobResponse(new Blob(['image'], { type: 'image/png' }), 200, 'image/png');
        if (value21 === '/local/ref.mp4')
          return makeBlobResponse(new Blob(['video'], { type: 'video/mp4' }), 200, 'video/mp4');
        if (value21 === '/local/ref.mp3')
          return makeBlobResponse(new Blob(['audio'], { type: 'audio/mpeg' }), 200, 'audio/mpeg');
        if (value21.startsWith('/api/v2/proxy/upload?')) {
          const uRL3 = new URL('http://local' + value21).searchParams.get('apiUrl');
          assert.equal(uRL3, 'https://uguu.se/upload');
          const value22 = Object.fromEntries(dom13.body.entries()),
            value23 = await value22['files[]'].text();
          return makeJsonResponse({ url: 'https://uguu.example/' + value23 + '.png' });
        }
        if (value21 === '/api/v2/proxy/apimart-upload') {
          const value24 = Object.fromEntries(dom13.body.entries());
          (assert.equal(value24.apiKey, 'k_apimart'), assert.equal(value24.apiUrl, 'https://api.apimart.ai'));
          const value25 = await value24.file.text();
          if (value25 === 'video')
            return (
              assert.equal(value24.contentType, 'video/mp4'),
              assert.equal(value24.fileExtension, 'mp4'),
              makeJsonResponse({ cdnUrl: 'https://cdn.apimart.ai/ref.mp4' })
            );
          if (value25 === 'audio')
            return (
              assert.equal(value24.contentType, 'audio/mpeg'),
              assert.equal(value24.fileExtension, 'mp3'),
              makeJsonResponse({ cdnUrl: 'https://cdn.apimart.ai/ref.mp3' })
            );
        }
        throw new Error('unexpected fetch url: ' + value21);
      };
      const dom14 = await buildGenerateVideoRequest({
        provider: 'volcengine',
        model: 'volcengine/seedance-2.0-fast',
        prompt: 'mix references',
        inputUrls: ['/local/ref.png'],
        videos: ['/local/ref.mp4'],
        audios: ['/local/ref.mp3'],
        generationParams: {
          volcengine_seedance_2_mode: 'multimodal2video',
          aspectRatio: 'adaptive',
          resolution: '1080p',
          duration: 6,
        },
      });
      (assert.equal(dom14.body.model, 'doubao-seedance-2-0-fast-260128'),
        assert.equal(dom14.body.resolution, '720p'),
        assert.equal(dom14.body.ratio, 'adaptive'),
        assert.deepEqual(dom14.body.content, [
          { type: 'text', text: 'mix references' },
          {
            type: 'image_url',
            image_url: { url: 'https://uguu.example/image.png' },
            role: 'reference_image',
          },
          {
            type: 'video_url',
            video_url: { url: 'https://cdn.apimart.ai/ref.mp4' },
            role: 'reference_video',
          },
          {
            type: 'audio_url',
            audio_url: { url: 'https://cdn.apimart.ai/ref.mp3' },
            role: 'reference_audio',
          },
        ]));
    } finally {
      globalThis.fetch = value19;
    }
  }),
  test('buildGenerateVideoRequest should require APIMart key for local Volcengine Seedance video and audio inputs', async () => {
    const { clearApiConfig: clearApiConfig10 } = await import('./configApi.js');
    clearApiConfig10();
    const value26 = globalThis.fetch;
    try {
      ((globalThis.fetch = async (value27) => {
        const value28 = String(value27);
        if (value28 === '/api/config')
          return makeJsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_volcengine' },
              apimart: { apiUrl: 'https://api.apimart.ai', apiKey: '' },
            },
          });
        if (value28 === '/local/ref.mp4')
          return makeBlobResponse(new Blob(['video'], { type: 'video/mp4' }), 200, 'video/mp4');
        if (value28 === '/local/ref.mp3')
          return makeBlobResponse(new Blob(['audio'], { type: 'audio/mpeg' }), 200, 'audio/mpeg');
        throw new Error('unexpected fetch url: ' + value28);
      }),
        await assert.rejects(
          () =>
            buildGenerateVideoRequest({
              provider: 'volcengine',
              model: 'volcengine/seedance-2.0-fast',
              prompt: 'local video reference',
              videos: ['/local/ref.mp4'],
              generationParams: { volcengine_seedance_2_mode: 'multimodal2video' },
            }),
          /APIMART API Key 未配置，无法上传素材/,
        ),
        await assert.rejects(
          () =>
            buildGenerateVideoRequest({
              provider: 'volcengine',
              model: 'volcengine/seedance-2.0-fast',
              prompt: 'local audio reference',
              videos: ['https://cdn.apimart.ai/ref.mp4'],
              audios: ['/local/ref.mp3'],
              generationParams: { volcengine_seedance_2_mode: 'multimodal2video' },
            }),
          /APIMART API Key 未配置，无法上传素材/,
        ));
    } finally {
      globalThis.fetch = value26;
    }
  }),
  test('buildGenerateVideoRequest should map APIMart video API body fields per manifest', async () => {
    const { clearApiConfig: clearApiConfig11 } = await import('./configApi.js');
    clearApiConfig11();
    const value29 = globalThis.fetch;
    try {
      globalThis.fetch = async (value30) => {
        if (String(value30) === '/api/config')
          return makeJsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        throw new Error('unexpected fetch url: ' + String(value30));
      };
      const dom15 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/grok-imagine-1.0',
        prompt: 'a dog running on a sunny beach',
      });
      (assert.equal(dom15.body.model, 'grok-imagine-1.0-video-apimart'),
        assert.equal(dom15.body.size, '16:9'),
        assert.equal(dom15.body.duration, 6),
        assert.equal(dom15.body.quality, '480p'),
        assert.equal('image_urls' in dom15.body, false),
        assert.equal('generation_type' in dom15.body, false));
      const inputUrls = Array.from(
          { length: 8 },
          (value31, value32) => 'https://cdn.apimart.ai/grok-ref-' + (value32 + 1) + '.png',
        ),
        dom16 = await buildGenerateVideoRequest({
          provider: 'apimart',
          model: 'apimart/grok-imagine-1.0',
          prompt: 'turn these references into a natural video',
          inputUrls: inputUrls,
          generationParams: { aspectRatio: '2:3', duration: 45, quality: '720p' },
        });
      (assert.equal(dom16.adapterTrace?.source, 'manifest'),
        assert.equal(dom16.adapterTrace?.executionId, 'apimart.model-api.video.grok-imagine-1.v1'),
        assert.equal(dom16.body.model, 'grok-imagine-1.0-video-apimart'),
        assert.equal(dom16.body.size, '2:3'),
        assert.equal(dom16.body.duration, 30),
        assert.equal(dom16.body.quality, '720p'),
        assert.deepEqual(dom16.body.image_urls, inputUrls.slice(0, 7)));
      const dom17 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/omni-flash-ext',
        prompt: 'a cinematic product video with smooth camera movement',
        inputUrls: [
          'https://cdn.apimart.ai/omni-scene.png',
          'https://cdn.apimart.ai/omni-character.png',
          'https://cdn.apimart.ai/omni-product.png',
        ],
        generationParams: { aspectRatio: '9:16', duration: 10, resolution: '4k' },
      });
      (assert.equal(dom17.adapterTrace?.source, 'manifest'),
        assert.equal(dom17.adapterTrace?.executionId, 'apimart.model-api.video.omni-flash-ext.v1'),
        assert.equal(dom17.body.model, 'Omni-Flash-Ext'),
        assert.equal(dom17.body.duration, 10),
        assert.equal(dom17.body.resolution, '4k'),
        assert.equal(dom17.body.aspect_ratio, '9:16'),
        assert.deepEqual(dom17.body.image_urls, [
          'https://cdn.apimart.ai/omni-scene.png',
          'https://cdn.apimart.ai/omni-character.png',
          'https://cdn.apimart.ai/omni-product.png',
        ]));
      const dom18 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/omni-flash-ext',
        prompt: 'a girl is dancing happily in a sunny garden',
        generationParams: { duration: 7, resolution: '1080p' },
      });
      (assert.equal(dom18.body.model, 'Omni-Flash-Ext'),
        assert.equal(dom18.body.duration, 6),
        assert.equal(dom18.body.resolution, '1080p'),
        assert.equal(dom18.body.aspect_ratio, '16:9'),
        assert.equal('image_urls' in dom18.body, false));
      const dom19 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/omni-flash-ext',
        prompt: 'use the source motion and keep the product identity',
        inputUrls: ['https://cdn.apimart.ai/omni-product.png'],
        videos: ['https://cdn.apimart.ai/omni-motion.mp4'],
        generationParams: { duration: 10, resolution: '1080p' },
      });
      (assert.equal(dom19.body.model, 'Omni-Flash-Ext'),
        assert.deepEqual(dom19.body.image_urls, ['https://cdn.apimart.ai/omni-product.png']),
        assert.deepEqual(dom19.body.video_urls, ['https://cdn.apimart.ai/omni-motion.mp4']),
        assert.equal('duration' in dom19.body, false));
      const dom20 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/omni-flash-ext',
        prompt: 'follow this motion reference',
        videos: ['https://cdn.apimart.ai/omni-motion-only.mp4'],
        generationParams: { duration: 8 },
      });
      (assert.deepEqual(dom20.body.video_urls, ['https://cdn.apimart.ai/omni-motion-only.mp4']),
        assert.equal('image_urls' in dom20.body, false),
        assert.equal('duration' in dom20.body, false),
        await assert.rejects(
          () =>
            buildGenerateVideoRequest({
              provider: 'apimart',
              model: 'apimart/omni-flash-ext',
              prompt: 'blend two references',
              inputUrls: ['https://cdn.apimart.ai/omni-a.png', 'https://cdn.apimart.ai/omni-b.png'],
            }),
          /Gemini Omni Flash supports only 1 or 3 reference images/,
        ));
      const dom21 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/veo3-fast',
        prompt: 'city lights',
        inputUrls: ['https://cdn.apimart.ai/veo-first.png', 'https://cdn.apimart.ai/veo-last.png'],
        generationParams: {
          mode: 'quality',
          generation_type: 'reference',
          aspectRatio: '9:16',
          resolution: '1080p',
          duration: 6,
          official_fallback: true,
        },
      });
      (assert.equal(dom21.body.model, 'veo3.1-quality'),
        assert.equal(dom21.body.aspect_ratio, '9:16'),
        assert.equal(dom21.body.generation_type, 'frame'),
        assert.deepEqual(dom21.body.image_urls, [
          'https://cdn.apimart.ai/veo-first.png',
          'https://cdn.apimart.ai/veo-last.png',
        ]),
        assert.equal(dom21.body.resolution, '1080p'),
        assert.equal(dom21.body.duration, 8),
        assert.equal(dom21.body.enable_gif, false),
        assert.equal('official_fallback' in dom21.body, false),
        assert.equal('quality' in dom21.body, false));
      const dom22 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/veo3-fast',
        prompt: 'city lights',
        generationParams: { aspectRatio: '自适应', resolution: '720p', duration: 8 },
      });
      (assert.equal(dom22.body.aspect_ratio, '16:9'),
        assert.equal(dom22.body.model, 'veo3.1-fast'),
        assert.equal('generation_type' in dom22.body, false));
      const dom23 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/veo3-fast',
        prompt: 'city lights',
        generationParams: { mode: 'bad-mode', generation_type: 'frame' },
      });
      (assert.equal(dom23.body.model, 'veo3.1-fast'),
        assert.equal('generation_type' in dom23.body, false),
        assert.equal('image_urls' in dom23.body, false));
      const dom24 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/veo3-fast',
        prompt: 'single image video',
        inputUrls: ['https://cdn.apimart.ai/veo-single.png'],
        generationParams: { mode: 'fast', generation_type: 'frame' },
      });
      (assert.equal(dom24.body.model, 'veo3.1-fast'),
        assert.equal(dom24.body.generation_type, 'frame'),
        assert.deepEqual(dom24.body.image_urls, ['https://cdn.apimart.ai/veo-single.png']));
      const dom25 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/veo3-fast',
        prompt: 'reference mode without image',
        generationParams: { mode: 'fast', generation_type: 'reference' },
      });
      (assert.equal(dom25.body.model, 'veo3.1-fast'),
        assert.equal('generation_type' in dom25.body, false),
        assert.equal('image_urls' in dom25.body, false),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'apimart',
            model: 'apimart/veo3-fast',
            prompt: 'too many frames',
            inputUrls: [
              'https://cdn.apimart.ai/veo-first.png',
              'https://cdn.apimart.ai/veo-middle.png',
              'https://cdn.apimart.ai/veo-last.png',
            ],
            generationParams: { mode: 'fast', generation_type: 'frame' },
          }),
          /VEO3 首尾帧模式最多接入 2 张图片/,
        ));
      const dom26 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/veo3-fast',
        prompt: 'fixed slots',
        inputUrlsBySlot: {
          firstFrame: 'https://cdn.apimart.ai/veo-first-slot.png',
          lastFrame: 'https://cdn.apimart.ai/veo-last-slot.png',
        },
        generationParams: { mode: 'fast', generation_type: 'frame', aspectRatio: '16:9' },
      });
      (assert.equal(dom26.body.model, 'veo3.1-fast'),
        assert.equal(dom26.body.generation_type, 'frame'),
        assert.deepEqual(dom26.body.image_urls, [
          'https://cdn.apimart.ai/veo-first-slot.png',
          'https://cdn.apimart.ai/veo-last-slot.png',
        ]));
      const dom27 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/veo3-fast',
        prompt: 'gif high resolution',
        generationParams: { resolution: '1080p', enable_gif: true },
      });
      (assert.equal(dom27.body.resolution, '720p'), assert.equal(dom27.body.enable_gif, true));
      const dom28 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/minimax-hailuo',
        prompt: '[推进]一只猫咪在花园中奔跑，镜头缓缓推进特写',
        inputUrlsBySlot: {
          firstFrame: 'https://cdn.apimart.ai/hailuo-first.png',
          lastFrame: 'https://cdn.apimart.ai/hailuo-last.png',
        },
        generationParams: {
          duration: 10,
          resolution: '1080p',
          prompt_optimizer: false,
          fast_pretreatment: true,
          watermark: true,
        },
      });
      (assert.equal(dom28.body.model, 'MiniMax-Hailuo-02'),
        assert.equal(dom28.body.resolution, '1080p'),
        assert.equal(dom28.body.duration, 5),
        assert.equal(dom28.body.prompt_optimizer, false),
        assert.equal(dom28.body.fast_pretreatment, true),
        assert.equal(dom28.body.watermark, true),
        assert.equal(dom28.body.first_frame_image, 'https://cdn.apimart.ai/hailuo-first.png'),
        assert.equal(dom28.body.last_frame_image, 'https://cdn.apimart.ai/hailuo-last.png'));
      const dom29 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/hailuo-02',
        prompt: '一只可爱的猫咪在草地上奔跑',
        generationParams: { duration: 10, resolution: '768p' },
      });
      (assert.equal(dom29.body.model, 'MiniMax-Hailuo-02'),
        assert.equal(dom29.body.duration, 10),
        assert.equal(dom29.body.prompt_optimizer, true),
        assert.equal(dom29.body.fast_pretreatment, false),
        assert.equal(dom29.body.watermark, false),
        assert.equal('first_frame_image' in dom29.body, false));
      const dom30 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/minimax-hailuo-2.3',
        prompt: '[推进]一只猫咪在花园中奔跑，镜头缓缓推进特写',
        inputUrlsBySlot: {
          firstFrame: 'https://cdn.apimart.ai/hailuo-23-first.png',
          lastFrame: 'https://cdn.apimart.ai/hailuo-23-stale-last.png',
        },
        generationParams: {
          mode: 'standard',
          duration: 10,
          resolution: '1080p',
          prompt_optimizer: false,
          fast_pretreatment: true,
          watermark: true,
        },
      });
      (assert.equal(dom30.body.model, 'MiniMax-Hailuo-2.3'),
        assert.equal(dom30.body.resolution, '1080p'),
        assert.equal(dom30.body.duration, 6),
        assert.equal(dom30.body.prompt_optimizer, false),
        assert.equal(dom30.body.fast_pretreatment, true),
        assert.equal(dom30.body.watermark, true),
        assert.equal(dom30.body.first_frame_image, 'https://cdn.apimart.ai/hailuo-23-first.png'),
        assert.equal('last_frame_image' in dom30.body, false));
      const dom31 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/minimax-hailuo-2.3',
        prompt: '首帧中的小猫向镜头跑来',
        inputUrls: ['https://cdn.apimart.ai/hailuo-23-fast-first.png'],
        generationParams: { mode: 'fast', duration: 10, resolution: '768p' },
      });
      (assert.equal(dom31.body.model, 'MiniMax-Hailuo-2.3-Fast'),
        assert.equal(dom31.body.duration, 10),
        assert.equal(dom31.body.first_frame_image, 'https://cdn.apimart.ai/hailuo-23-fast-first.png'),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'apimart',
            model: 'apimart/minimax-hailuo-2.3',
            prompt: 'fast requires a first frame',
            generationParams: { mode: 'fast' },
          }),
          /Hailuo 2\.3 Fast requires first_frame_image/,
        ));
      const dom32 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/happyhorse-1.0',
        prompt: 'running horse',
        inputUrls: ['https://cdn.apimart.ai/ref-1.png'],
        generationParams: {
          happyhorse_mode: 'image',
          aspectRatio: '16:9',
          resolution: '720P',
          duration: 5,
          seed: '42',
          watermark: true,
        },
      });
      (assert.equal(dom32.body.model, 'happyhorse-1.0'),
        assert.equal('size' in dom32.body, false),
        assert.equal(dom32.body.seed, 42),
        assert.equal(dom32.body.watermark, true),
        assert.equal(dom32.body.first_frame_image, 'https://cdn.apimart.ai/ref-1.png'),
        assert.equal('image_urls' in dom32.body, false),
        assert.equal('video_url' in dom32.body, false));
      const dom33 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/happyhorse-1.0',
        prompt: 'slotted horse',
        inputUrlsBySlot: { firstFrame: 'https://cdn.apimart.ai/head.png' },
        generationParams: { happyhorse_mode: 'image' },
      });
      (assert.equal(dom33.body.first_frame_image, 'https://cdn.apimart.ai/head.png'),
        assert.equal('image_urls' in dom33.body, false));
      const dom34 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/happyhorse-1.0',
        prompt: 'reference horse',
        inputUrls: ['https://cdn.apimart.ai/ref-1.png', 'https://cdn.apimart.ai/ref-2.png'],
        generationParams: {
          happyhorse_mode: 'reference',
          aspectRatio: '16:9',
          resolution: '1080P',
          duration: 5,
        },
      });
      (assert.deepEqual(dom34.body.image_urls, [
        'https://cdn.apimart.ai/ref-1.png',
        'https://cdn.apimart.ai/ref-2.png',
      ]),
        assert.equal(dom34.body.size, '16:9'),
        assert.equal('first_frame_image' in dom34.body, false));
      const dom35 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/happyhorse-1.0',
        prompt: 'running horse',
        inputUrls: ['https://cdn.apimart.ai/ref-1.png'],
        generationParams: {
          happyhorse_mode: 'image',
          aspectRatio: '自适应',
          resolution: '1080P',
          duration: 5,
        },
      });
      (assert.equal('size' in dom35.body, false),
        assert.equal(dom35.body.first_frame_image, 'https://cdn.apimart.ai/ref-1.png'));
      const dom36 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/happyhorse-1.0',
        prompt: 'edit video',
        inputUrls: ['https://cdn.apimart.ai/style-ref.png'],
        videos: ['https://cdn.apimart.ai/source.mp4'],
        generationParams: {
          happyhorse_mode: 'edit',
          audio_setting: 'origin',
          aspectRatio: '16:9',
          resolution: '1080P',
          duration: 5,
        },
      });
      (assert.equal(dom36.body.video_url, 'https://cdn.apimart.ai/source.mp4'),
        assert.deepEqual(dom36.body.image_urls, ['https://cdn.apimart.ai/style-ref.png']),
        assert.equal(dom36.body.audio_setting, 'origin'),
        assert.equal('duration' in dom36.body, false),
        assert.equal('size' in dom36.body, false));
      const dom37 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/happyhorse-1.0',
        prompt: 'default image mode',
        inputUrls: ['https://cdn.apimart.ai/default-ref.png'],
      });
      assert.equal(dom37.body.first_frame_image, 'https://cdn.apimart.ai/default-ref.png');
      const dom38 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/happyhorse-1.0',
        prompt: 'text only horse',
      });
      (assert.equal('first_frame_image' in dom38.body, false),
        assert.equal('image_urls' in dom38.body, false),
        assert.equal('video_url' in dom38.body, false),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'apimart',
            model: 'apimart/happyhorse-1.0',
            prompt: '',
            generationParams: { happyhorse_mode: 'auto' },
          }),
          /prompt is required/,
        ));
      const dom39 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/wan2.7',
        prompt: 'sync to reference',
        inputUrls: ['https://cdn.apimart.ai/ref-image.png'],
        audios: ['https://cdn.apimart.ai/ref-audio.mp3'],
        generationParams: {
          aspectRatio: '1:1',
          resolution: '1080P',
          duration: 6,
          negative_prompt: 'low quality',
          prompt_extend: false,
          watermark: true,
          seed: '7',
        },
      });
      (assert.deepEqual(dom39.body.image_urls, ['https://cdn.apimart.ai/ref-image.png']),
        assert.equal(dom39.body.audio_url, 'https://cdn.apimart.ai/ref-audio.mp3'),
        assert.equal('size' in dom39.body, false),
        assert.equal(dom39.body.negative_prompt, 'low quality'),
        assert.equal(dom39.body.prompt_extend, false),
        assert.equal(dom39.body.watermark, true),
        assert.equal(dom39.body.seed, 7));
      const dom40 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/wan2.7',
        prompt: 'slot ordered frames',
        inputUrlsBySlot: {
          lastFrame: 'https://cdn.apimart.ai/wan-last.png',
          firstFrame: 'https://cdn.apimart.ai/wan-first.png',
        },
        generationParams: { resolution: '1080P', duration: 6 },
      });
      (assert.deepEqual(dom40.body.image_urls, [
        'https://cdn.apimart.ai/wan-first.png',
        'https://cdn.apimart.ai/wan-last.png',
      ]),
        assert.equal('size' in dom40.body, false));
      const dom41 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/wan2.7',
        prompt: 'reference character and motion',
        inputUrls: ['https://cdn.apimart.ai/ref-character.png'],
        videos: ['https://cdn.apimart.ai/ref-motion.mp4'],
        audios: ['https://cdn.apimart.ai/ref-voice.mp3'],
        generationParams: { wan27_mode: 'reference', resolution: '1080P', duration: 8 },
      });
      (assert.equal(dom41.body.model, 'wan2.7-r2v'),
        assert.deepEqual(dom41.body.image_with_roles, [
          {
            url: 'https://cdn.apimart.ai/ref-character.png',
            role: 'reference_image',
            reference_voice: 'https://cdn.apimart.ai/ref-voice.mp3',
          },
        ]),
        assert.deepEqual(dom41.body.video_urls, ['https://cdn.apimart.ai/ref-motion.mp4']),
        assert.equal('image_urls' in dom41.body, false),
        assert.equal('audio_url' in dom41.body, false));
      const dom42 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/wan2.7',
        prompt: 'reference motion',
        videos: ['https://cdn.apimart.ai/ref-motion.mp4'],
        generationParams: { wan27_mode: 'reference', resolution: '1080P', duration: 8 },
      });
      (assert.equal(dom42.body.model, 'wan2.7-r2v'),
        assert.deepEqual(dom42.body.video_urls, ['https://cdn.apimart.ai/ref-motion.mp4']),
        assert.equal('image_with_roles' in dom42.body, false),
        assert.equal('audio_url' in dom42.body, false));
      const dom43 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/wan2.7',
        prompt: 'change the outfit',
        videos: ['https://cdn.apimart.ai/original.mp4', 'https://cdn.apimart.ai/reference.mp4'],
        generationParams: { wan27_mode: 'edit', resolution: '1080P', duration: 0 },
      });
      (assert.equal(dom43.body.model, 'wan2.7-videoedit'),
        assert.deepEqual(dom43.body.video_urls, [
          'https://cdn.apimart.ai/original.mp4',
          'https://cdn.apimart.ai/reference.mp4',
        ]),
        assert.equal('image_urls' in dom43.body, false));
      const dom44 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/wan2.7',
        prompt: 'text only',
        generationParams: { aspectRatio: '1:1', resolution: '1080P', duration: 6 },
      });
      (assert.equal(dom44.body.size, '1:1'),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'apimart',
            model: 'apimart/wan2.7',
            prompt: 'bad media mix',
            inputUrls: ['https://cdn.apimart.ai/ref-image.png'],
            videos: ['https://cdn.apimart.ai/ref-video.mp4'],
          }),
          /image_urls cannot be used with video_urls/,
        ),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'apimart',
            model: 'apimart/wan2.7',
            prompt: 'bad media mix',
            videos: ['https://cdn.apimart.ai/ref-video.mp4'],
            audios: ['https://cdn.apimart.ai/ref-audio.mp3'],
          }),
          /video_urls cannot be used with audio_url/,
        ),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'apimart',
            model: 'apimart/wan2.6',
            prompt: 'removed model',
          }),
          /Video model API manifest missing/,
        ),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'apimart',
            model: 'apimart/kling-v2-6',
            prompt: 'removed model',
          }),
          /Video model API manifest missing/,
        ));
      const dom45 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/kling-v3',
        prompt: 'cinematic motion',
        inputUrls: ['https://cdn.apimart.ai/kling-ref.png'],
        generationParams: {
          resolution: '4k',
          aspectRatio: '9:16',
          duration: 10,
          audio: true,
          watermark: true,
          seed: '42',
          negative_prompt: 'blur',
        },
      });
      (assert.equal(dom45.body.mode, '4k'),
        assert.equal(dom45.body.aspect_ratio, '9:16'),
        assert.equal(dom45.body.audio, true),
        assert.equal(dom45.body.watermark, true),
        assert.equal('seed' in dom45.body, false),
        assert.equal(dom45.body.negative_prompt, 'blur'),
        assert.deepEqual(dom45.body.image_urls, ['https://cdn.apimart.ai/kling-ref.png']),
        assert.equal('multi_shot' in dom45.body, false));
      const dom46 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/kling-v3',
        prompt: 'transition from start to end',
        inputUrlsBySlot: {
          lastFrame: 'https://cdn.apimart.ai/kling-last.png',
          firstFrame: 'https://cdn.apimart.ai/kling-first.png',
        },
        generationParams: {
          resolution: 'std',
          aspectRatio: '16:9',
          duration: 5,
          audio: true,
          multi_shot: true,
        },
      });
      (assert.deepEqual(dom46.body.image_urls, [
        'https://cdn.apimart.ai/kling-first.png',
        'https://cdn.apimart.ai/kling-last.png',
      ]),
        assert.equal(dom46.body.audio, true),
        assert.equal('multi_shot' in dom46.body, false));
      const dom47 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/kling-v3-omni',
        prompt: 'start and end frame transition',
        inputUrlsBySlot: {
          lastFrame: 'https://cdn.apimart.ai/omni-last.png',
          firstFrame: 'https://cdn.apimart.ai/omni-first.png',
        },
        generationParams: {
          kling_v3_omni_mode: 'image',
          resolution: 'pro',
          aspectRatio: '9:16',
          duration: 6,
          audio: true,
          multi_shot: true,
        },
      });
      (assert.equal(dom47.body.model, 'kling-v3-omni'),
        assert.equal(dom47.body.mode, 'pro'),
        assert.equal(dom47.body.aspect_ratio, '9:16'),
        assert.equal(dom47.body.audio, true),
        assert.deepEqual(dom47.body.image_with_roles, [
          { url: 'https://cdn.apimart.ai/omni-first.png', role: 'first_frame' },
          { url: 'https://cdn.apimart.ai/omni-last.png', role: 'last_frame' },
        ]),
        assert.equal('image_urls' in dom47.body, false),
        assert.equal('multi_shot' in dom47.body, false),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'apimart',
            model: 'apimart/kling-v3-omni',
            prompt: 'end frame only',
            inputUrlsBySlot: { lastFrame: 'https://cdn.apimart.ai/omni-last.png' },
            generationParams: { kling_v3_omni_mode: 'image', resolution: 'pro' },
          }),
          /Kling V3 Omni last_frame requires first_frame input/,
        ));
      const dom48 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/kling-v3-omni',
        prompt: 'reference subject and motion',
        inputUrlsBySlot: { referenceImage: 'https://cdn.apimart.ai/omni-ref.png' },
        videos: ['https://cdn.apimart.ai/omni-feature.mov'],
        generationParams: {
          kling_v3_omni_mode: 'reference',
          resolution: '4k',
          aspectRatio: '16:9',
          duration: 5,
          audio: true,
        },
      });
      (assert.equal(dom48.body.mode, '4k'),
        assert.deepEqual(dom48.body.image_with_roles, [
          { url: 'https://cdn.apimart.ai/omni-ref.png', role: 'reference' },
        ]),
        assert.deepEqual(dom48.body.video_list, [
          {
            video_url: 'https://cdn.apimart.ai/omni-feature.mov',
            refer_type: 'feature',
            keep_original_sound: 'no',
          },
        ]),
        assert.equal('audio' in dom48.body, false),
        assert.equal('image_urls' in dom48.body, false));
      const dom49 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/kling-v3-omni',
        prompt: 'change the scene',
        videos: ['https://cdn.apimart.ai/omni-base.mp4'],
        generationParams: {
          kling_v3_omni_mode: 'edit',
          resolution: 'std',
          aspectRatio: '1:1',
          duration: 10,
          audio: true,
        },
      });
      (assert.deepEqual(dom49.body.video_list, [
        { video_url: 'https://cdn.apimart.ai/omni-base.mp4', refer_type: 'base', keep_original_sound: 'no' },
      ]),
        assert.equal(dom49.body.mode, 'std'),
        assert.equal('image_urls' in dom49.body, false),
        assert.equal('image_with_roles' in dom49.body, false),
        assert.equal('audio' in dom49.body, false),
        assert.equal('duration' in dom49.body, false),
        assert.equal('aspect_ratio' in dom49.body, false),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'apimart',
            model: 'apimart/kling-v3-omni',
            prompt: 'missing reference',
            generationParams: { kling_v3_omni_mode: 'reference' },
          }),
          /Kling V3 Omni reference mode requires image or video input/,
        ));
      const dom50 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/kling-video-o1',
        prompt: '让@图片1走向@图片2',
        inputUrls: ['https://cdn.apimart.ai/o1-ref-1.png', 'https://cdn.apimart.ai/o1-ref-2.png'],
        generationParams: { resolution: 'pro', aspectRatio: '16:9', duration: 5 },
      });
      (assert.equal(dom50.body.model, 'kling-video-o1'),
        assert.equal(dom50.body.mode, 'pro'),
        assert.equal(dom50.body.prompt, '让<<<image_1>>>走向<<<image_2>>>'),
        assert.deepEqual(dom50.body.image_urls, [
          'https://cdn.apimart.ai/o1-ref-1.png',
          'https://cdn.apimart.ai/o1-ref-2.png',
        ]),
        assert.equal('video_list' in dom50.body, false));
      const dom51 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/kling-video-o1',
        prompt: 'use @图片1 as subject reference',
        inputUrls: ['https://cdn.apimart.ai/o1-feature-ref.png'],
        videos: ['https://cdn.apimart.ai/o1-feature.mp4'],
        klingO1VideoRole: 'feature',
        generationParams: { resolution: 'std', aspectRatio: '9:16', duration: 10 },
      });
      (assert.equal(dom51.body.prompt, 'use <<<image_1>>> as subject reference'),
        assert.deepEqual(dom51.body.image_urls, ['https://cdn.apimart.ai/o1-feature-ref.png']),
        assert.deepEqual(dom51.body.video_list, [
          {
            video_url: 'https://cdn.apimart.ai/o1-feature.mp4',
            refer_type: 'feature',
            keep_original_sound: 'no',
          },
        ]),
        assert.equal(dom51.body.duration, 10),
        assert.equal(dom51.body.aspect_ratio, '9:16'));
      const dom52 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/kling-video-o1',
        prompt: 'edit source video',
        videos: ['https://cdn.apimart.ai/o1-base.mp4'],
        klingO1VideoRole: 'base',
        generationParams: { resolution: 'pro', aspectRatio: '1:1', duration: 10, keep_original_sound: true },
      });
      (assert.deepEqual(dom52.body.video_list, [
        { video_url: 'https://cdn.apimart.ai/o1-base.mp4', refer_type: 'base', keep_original_sound: 'yes' },
      ]),
        assert.equal('image_urls' in dom52.body, false),
        assert.equal('duration' in dom52.body, false),
        assert.equal('aspect_ratio' in dom52.body, false),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'apimart',
            model: 'apimart/kling-video-o1',
            prompt: 'invalid edit video with image',
            inputUrls: ['https://cdn.apimart.ai/o1-invalid-ref.png'],
            videos: ['https://cdn.apimart.ai/o1-base.mp4'],
            klingO1VideoRole: 'base',
          }),
          /Kling O1 base video cannot be used with image_urls/,
        ));
      const dom53 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/viduq3',
        prompt: 'reference motion',
        inputUrls: ['https://cdn.apimart.ai/vidu-ref-a.png'],
        generationParams: {
          vidu_q3_generation_mode: 'reference',
          mode: 'viduq3',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 8,
        },
      });
      (assert.equal(dom53.body.model, 'viduq3'),
        assert.equal(dom53.body.aspect_ratio, '16:9'),
        assert.equal('audio' in dom53.body, false),
        assert.deepEqual(dom53.body.image_urls, ['https://cdn.apimart.ai/vidu-ref-a.png']));
      const dom54 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/viduq3',
        prompt: 'reference mix',
        inputUrls: ['https://cdn.apimart.ai/vidu-mix-ref.png'],
        generationParams: {
          vidu_q3_generation_mode: 'reference',
          mode: 'viduq3-mix',
          resolution: '540p',
          duration: 1,
        },
      });
      (assert.equal(dom54.body.model, 'viduq3-mix'),
        assert.equal(dom54.body.resolution, '720p'),
        assert.equal(dom54.body.duration, 1));
      const dom55 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/viduq3',
        prompt: 'animated product shot',
        inputUrls: ['https://cdn.apimart.ai/vidu-ref.png'],
        generationParams: {
          vidu_q3_generation_mode: 'video',
          mode: 'viduq3-pro',
          aspectRatio: '16:9',
          resolution: '1080P',
          duration: 12,
        },
      });
      (assert.equal(dom55.body.model, 'viduq3-pro'),
        assert.equal(dom55.body.resolution, '1080p'),
        assert.equal(dom55.body.audio, true),
        assert.equal('aspect_ratio' in dom55.body, false),
        assert.deepEqual(dom55.body.image_urls, ['https://cdn.apimart.ai/vidu-ref.png']));
      const dom56 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/viduq3',
        prompt: 'text only default',
      });
      (assert.equal(dom56.body.model, 'viduq3-turbo'),
        assert.equal(dom56.body.duration, 5),
        assert.equal(dom56.body.resolution, '720p'),
        assert.equal(dom56.body.audio, true),
        assert.equal('image_urls' in dom56.body, false),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'apimart',
            model: 'apimart/viduq3',
            prompt: 'missing required image',
            generationParams: { vidu_q3_generation_mode: 'reference', mode: 'viduq3' },
          }),
          /reference mode requires 1-7 image inputs/,
        ),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'apimart',
            model: 'apimart/viduq3',
            prompt: 'too many video generation frames',
            inputUrls: [
              'https://cdn.apimart.ai/vidu-a.png',
              'https://cdn.apimart.ai/vidu-b.png',
              'https://cdn.apimart.ai/vidu-c.png',
            ],
          }),
          /video generation mode supports at most 2 image inputs/,
        ),
        await assert.rejects(
          buildGenerateVideoRequest({ provider: 'apimart', model: 'apimart/viduq3', prompt: '' }),
          /Vidu Q3 prompt is required/,
        ));
    } finally {
      globalThis.fetch = value29;
    }
  }));
function makeJsonResponse(value33, ok = 200) {
  return {
    ok: ok >= 200 && ok < 0x12c,
    status: ok,
    headers: {
      get(value34) {
        return String(value34 || '').toLowerCase() === 'content-type' ? 'application/json' : null;
      },
    },
    json: async () => value33,
    text: async () => JSON.stringify(value33),
  };
}
function makeTextResponse(value35, ok2 = 200, value36 = 'text/plain') {
  return {
    ok: ok2 >= 200 && ok2 < 0x12c,
    status: ok2,
    headers: {
      get(value37) {
        return String(value37 || '').toLowerCase() === 'content-type' ? value36 : null;
      },
    },
    json: async () => JSON.parse(value35),
    text: async () => value35,
  };
}
function makeBlobResponse(value38, ok3 = 200, value39 = 'video/mp4') {
  return {
    ok: ok3 >= 200 && ok3 < 0x12c,
    status: ok3,
    headers: {
      get(value40) {
        return String(value40 || '').toLowerCase() === 'content-type' ? value39 : null;
      },
    },
    blob: async () => value38,
    json: async () => ({}),
    text: async () => '',
  };
}
(test('buildGenerateVideoRequest should map RunningHub Kling O1 mixed endpoints', async () => {
  const { clearApiConfig: clearApiConfig12 } = await import('./configApi.js');
  clearApiConfig12();
  const value41 = globalThis.fetch;
  try {
    globalThis.fetch = async (value42) => {
      if (String(value42) === '/api/config')
        return makeJsonResponse({
          providers: {
            runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
          },
        });
      throw new Error('unexpected fetch url: ' + String(value42));
    };
    const dom57 = await buildGenerateVideoRequest({
      provider: 'runninghub',
      model: 'runninghub-model/kling-video-o1',
      prompt: 'city lights',
      generationParams: { resolution: 'std', aspectRatio: '16:9', duration: 5 },
    });
    (assert.equal(dom57.body.apiKey, 'k_runninghub_model'),
      assert.equal(dom57.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/kling-video-o1/text-to-video'),
      assert.equal(dom57.body.prompt, 'city lights'),
      assert.equal(dom57.body.mode, 'std'),
      assert.equal(dom57.body.aspectRatio, '16:9'),
      assert.equal(dom57.body.duration, '5'),
      assert.equal('model' in dom57.body, false),
      assert.equal(dom57.useOpenapiQuery, true));
    const dom58 = await buildGenerateVideoRequest({
      provider: 'runninghub',
      model: 'runninghub-model/kling-video-o1',
      prompt: 'adaptive ratio',
      generationParams: { aspectRatio: '自适应' },
    });
    assert.equal(dom58.body.aspectRatio, '16:9');
    const dom59 = await buildGenerateVideoRequest({
      provider: 'runninghub',
      model: 'runninghub-model/kling-video-o1',
      prompt: '让 @图片1 慢慢转身',
      inputUrls: ['https://www.runninghub.cn/assets/o1-first.png'],
      generationParams: { aspectRatio: '9:16', duration: 10 },
    });
    (assert.equal(dom59.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/kling-video-o1/image-to-video'),
      assert.equal(dom59.body.prompt, '让 <<<image_1>>> 慢慢转身'),
      assert.equal(dom59.body.firstImageUrl, 'https://www.runninghub.cn/assets/o1-first.png'),
      assert.equal(dom59.body.duration, '10'),
      assert.equal('lastImageUrl' in dom59.body, false));
    const dom60 = await buildGenerateVideoRequest({
      provider: 'runninghub',
      model: 'runninghub-model/kling-video-o1',
      prompt: '从 @图片1 过渡到 @图片2',
      inputUrlsBySlot: {
        firstFrame: 'https://www.runninghub.cn/assets/o1-first.png',
        lastFrame: 'https://www.runninghub.cn/assets/o1-last.png',
      },
      generationParams: { aspectRatio: '1:1' },
    });
    (assert.equal(dom60.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/kling-video-o1/start-to-end'),
      assert.equal(dom60.body.prompt, '从 <<<image_1>>> 过渡到 <<<image_2>>>'),
      assert.equal(dom60.body.firstImageUrl, 'https://www.runninghub.cn/assets/o1-first.png'),
      assert.equal(dom60.body.lastImageUrl, 'https://www.runninghub.cn/assets/o1-last.png'));
    const dom61 = await buildGenerateVideoRequest({
      provider: 'runninghub',
      model: 'runninghub-model/kling-video-o1',
      prompt: '参考 @图片1 和 @视频1 的动作',
      inputUrlsBySlot: { referenceImage: 'https://www.runninghub.cn/assets/o1-ref.png' },
      videos: ['https://www.runninghub.cn/assets/o1-ref.mp4'],
      generationParams: { rh_kling_o1_generation_mode: 'reference', keep_original_sound: true },
    });
    (assert.equal(
      dom61.body.apiUrl,
      'https://www.runninghub.cn/openapi/v2/kling-video-o1-std/refrence-to-video',
    ),
      assert.deepEqual(dom61.body.imageUrls, ['https://www.runninghub.cn/assets/o1-ref.png']),
      assert.equal(dom61.body.videoUrl, 'https://www.runninghub.cn/assets/o1-ref.mp4'),
      assert.equal(dom61.body.keepOriginalSound, true),
      assert.equal('firstImageUrl' in dom61.body, false));
    const dom62 = await buildGenerateVideoRequest({
      provider: 'runninghub',
      model: 'runninghub-model/kling-video-o1',
      prompt: 'remove background people',
      videos: ['https://www.runninghub.cn/assets/o1-edit.mp4'],
      generationParams: {
        rh_kling_o1_generation_mode: 'edit',
        mode: 'pro',
        aspectRatio: '1:1',
        duration: 10,
        keep_original_sound: true,
      },
    });
    (assert.equal(dom62.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/kling-video-o1-std/edit-video'),
      assert.equal(dom62.body.mode, 'std'),
      assert.equal(dom62.body.prompt, 'remove background people'),
      assert.equal(dom62.body.videoUrl, 'https://www.runninghub.cn/assets/o1-edit.mp4'),
      assert.equal(dom62.body.keepOriginalSound, true),
      assert.equal('aspectRatio' in dom62.body, false),
      assert.equal('duration' in dom62.body, false),
      assert.equal('imageUrls' in dom62.body, false),
      await assert.rejects(
        buildGenerateVideoRequest({
          provider: 'runninghub',
          model: 'runninghub-model/kling-video-o1',
          prompt: 'missing video',
          inputUrls: ['https://www.runninghub.cn/assets/o1-ref.png'],
          generationParams: { rh_kling_o1_generation_mode: 'reference' },
        }),
        /reference mode requires 1 video input/,
      ));
  } finally {
    globalThis.fetch = value41;
  }
}),
  test('buildGenerateVideoRequest should map RunningHub Hailuo 02 mixed endpoints', async () => {
    const { clearApiConfig: clearApiConfig13 } = await import('./configApi.js');
    clearApiConfig13();
    const value43 = globalThis.fetch;
    try {
      globalThis.fetch = async (value44) => {
        if (String(value44) === '/api/config')
          return makeJsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
            },
          });
        throw new Error('unexpected fetch url: ' + String(value44));
      };
      const dom63 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo-02',
        prompt: 'city lights',
        generationParams: { rh_hailuo_02_quality: 'standard', duration: 10, enablePromptExpansion: false },
      });
      (assert.equal(dom63.body.apiKey, 'k_runninghub_model'),
        assert.equal(
          dom63.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/t2v-standard',
        ),
        assert.equal(dom63.body.prompt, 'city lights'),
        assert.equal(dom63.body.duration, '10'),
        assert.equal(dom63.body.enablePromptExpansion, false),
        assert.equal('model' in dom63.body, false),
        assert.equal(dom63.useOpenapiQuery, true));
      const dom64 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo-02',
        prompt: '首帧过渡到尾帧',
        inputUrlsBySlot: {
          firstFrame: 'https://www.runninghub.cn/assets/hailuo-first.png',
          lastFrame: 'https://www.runninghub.cn/assets/hailuo-last.png',
        },
        generationParams: { rh_hailuo_02_quality: 'standard', duration: 6 },
      });
      (assert.equal(dom64.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/i2v-standard'),
        assert.equal(dom64.body.firstImageUrl, 'https://www.runninghub.cn/assets/hailuo-first.png'),
        assert.equal(dom64.body.lastImageUrl, 'https://www.runninghub.cn/assets/hailuo-last.png'),
        assert.equal(dom64.body.duration, '6'));
      const dom65 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo-02',
        prompt: 'pro text video',
        generationParams: { rh_hailuo_02_quality: 'pro', duration: 10 },
      });
      (assert.equal(dom65.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/t2v-pro'),
        assert.equal('duration' in dom65.body, false));
      const dom66 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo02',
        prompt: 'pro image video',
        inputUrls: ['https://www.runninghub.cn/assets/hailuo-pro-first.png'],
        generationParams: { rh_hailuo_02_quality: 'pro' },
      });
      (assert.equal(dom66.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/i2v-pro'),
        assert.equal(dom66.body.firstImageUrl, 'https://www.runninghub.cn/assets/hailuo-pro-first.png'),
        assert.equal('lastImageUrl' in dom66.body, false),
        assert.equal('duration' in dom66.body, false));
      const dom67 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo-02',
        prompt: 'fast image video',
        inputUrlsBySlot: { firstFrame: 'https://www.runninghub.cn/assets/hailuo-fast-first.png' },
        generationParams: { rh_hailuo_02_quality: 'fast', duration: 10 },
      });
      (assert.equal(dom67.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/fast'),
        assert.equal(dom67.body.imageUrl, 'https://www.runninghub.cn/assets/hailuo-fast-first.png'),
        assert.equal('firstImageUrl' in dom67.body, false),
        assert.equal(dom67.body.duration, '10'),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'runninghub',
            model: 'runninghub-model/hailuo-02',
            prompt: 'fast requires first image',
            generationParams: { rh_hailuo_02_quality: 'fast' },
          }),
          /Hailuo 02 Fast requires imageUrl/,
        ),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'runninghub',
            model: 'runninghub-model/hailuo-02',
            prompt: 'pro cannot use tail frame',
            inputUrlsBySlot: {
              firstFrame: 'https://www.runninghub.cn/assets/hailuo-pro-first.png',
              lastFrame: 'https://www.runninghub.cn/assets/hailuo-pro-last.png',
            },
            generationParams: { rh_hailuo_02_quality: 'pro' },
          }),
          /Hailuo 02 Pro supports only firstImageUrl/,
        ));
    } finally {
      globalThis.fetch = value43;
    }
  }),
  test('buildGenerateVideoRequest should map RunningHub Hailuo 2.3 mixed endpoints', async () => {
    const { clearApiConfig: clearApiConfig14 } = await import('./configApi.js');
    clearApiConfig14();
    const value45 = globalThis.fetch;
    try {
      globalThis.fetch = async (value46) => {
        if (String(value46) === '/api/config')
          return makeJsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
            },
          });
        throw new Error('unexpected fetch url: ' + String(value46));
      };
      const dom68 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo-2.3',
        prompt: 'city lights',
        generationParams: { rh_hailuo_23_quality: 'standard', duration: 10, enablePromptExpansion: false },
      });
      (assert.equal(dom68.body.apiKey, 'k_runninghub_model'),
        assert.equal(
          dom68.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/t2v-standard',
        ),
        assert.equal(dom68.body.duration, '10'),
        assert.equal(dom68.body.enablePromptExpansion, false),
        assert.equal('model' in dom68.body, false),
        assert.equal('aspectRatio' in dom68.body, false),
        assert.equal(dom68.useOpenapiQuery, true));
      const dom69 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo-2.3',
        prompt: '让首帧动起来',
        inputUrlsBySlot: { firstFrame: 'https://www.runninghub.cn/assets/hailuo-23-first.png' },
        generationParams: { rh_hailuo_23_quality: 'standard', duration: 6 },
      });
      (assert.equal(
        dom69.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/i2v-standard',
      ),
        assert.equal(dom69.body.imageUrl, 'https://www.runninghub.cn/assets/hailuo-23-first.png'),
        assert.equal(dom69.body.duration, '6'),
        assert.equal('firstImageUrl' in dom69.body, false),
        assert.equal('lastImageUrl' in dom69.body, false));
      const dom70 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo-2.3',
        prompt: 'pro text video',
        generationParams: { rh_hailuo_23_quality: 'pro', duration: 10 },
      });
      (assert.equal(dom70.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/t2v-pro'),
        assert.equal('duration' in dom70.body, false));
      const dom71 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo23',
        prompt: 'pro image video',
        inputUrls: ['https://www.runninghub.cn/assets/hailuo-23-pro-first.png'],
        generationParams: { rh_hailuo_23_quality: 'pro' },
      });
      (assert.equal(
        dom71.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/image-to-video-pro',
      ),
        assert.equal(dom71.body.imageUrl, 'https://www.runninghub.cn/assets/hailuo-23-pro-first.png'),
        assert.equal('firstImageUrl' in dom71.body, false),
        assert.equal('duration' in dom71.body, false));
      const dom72 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo-2.3',
        prompt: 'fast image video',
        inputUrlsBySlot: { firstFrame: 'https://www.runninghub.cn/assets/hailuo-23-fast-first.png' },
        generationParams: { rh_hailuo_23_quality: 'fast', duration: 10 },
      });
      (assert.equal(
        dom72.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3-fast/image-to-video',
      ),
        assert.equal(dom72.body.duration, '10'),
        assert.equal(dom72.body.imageUrl, 'https://www.runninghub.cn/assets/hailuo-23-fast-first.png'),
        assert.equal('firstImageUrl' in dom72.body, false));
      const dom73 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo-2.3',
        prompt: 'fast pro image video',
        inputUrlsBySlot: { firstFrame: 'https://www.runninghub.cn/assets/hailuo-23-fast-pro-first.png' },
        generationParams: { rh_hailuo_23_quality: 'fastPro', duration: 10 },
      });
      (assert.equal(
        dom73.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3-fast-pro/image-to-video',
      ),
        assert.equal(dom73.body.duration, '6'),
        assert.equal(dom73.body.imageUrl, 'https://www.runninghub.cn/assets/hailuo-23-fast-pro-first.png'),
        assert.equal('firstImageUrl' in dom73.body, false),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'runninghub',
            model: 'runninghub-model/hailuo-2.3',
            prompt: 'fast requires first image',
            generationParams: { rh_hailuo_23_quality: 'fast' },
          }),
          /Hailuo 2\.3 Fast requires imageUrl/,
        ),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'runninghub',
            model: 'runninghub-model/hailuo-2.3',
            prompt: 'only one image',
            inputUrls: [
              'https://www.runninghub.cn/assets/hailuo-23-a.png',
              'https://www.runninghub.cn/assets/hailuo-23-b.png',
            ],
          }),
          /Hailuo 2\.3 supports only imageUrl/,
        ));
    } finally {
      globalThis.fetch = value45;
    }
  }),
  test('buildGenerateVideoRequest should map RunningHub Veo3 mixed endpoints', async () => {
    const { clearApiConfig: clearApiConfig15 } = await import('./configApi.js');
    clearApiConfig15();
    const value47 = globalThis.fetch;
    let value48 = 0;
    try {
      globalThis.fetch = async (value49) => {
        if (String(value49) === '/api/config')
          return makeJsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
            },
          });
        if (String(value49) === 'https://source.local/veo3-dup.png')
          return {
            ok: true,
            status: 200,
            headers: { get: () => 'image/png' },
            blob: async () => new Blob(['veo3-dup'], { type: 'image/png' }),
            text: async () => '',
          };
        if (String(value49).includes('/api/v2/proxy/upload'))
          return (
            (value48 += 1),
            makeJsonResponse({
              data: { download_url: 'https://www.runninghub.cn/uploaded/veo3-dup-' + value48 + '.png' },
            })
          );
        throw new Error('unexpected fetch url: ' + String(value49));
      };
      const dom74 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/veo3',
        prompt: 'low fast text',
        generationParams: {
          rh_veo3_channel: 'lowCost',
          mode: 'fast',
          aspectRatio: '自适应',
          duration: 6,
          resolution: '4k',
          generateAudio: true,
        },
      });
      (assert.equal(dom74.body.apiKey, 'k_runninghub_model'),
        assert.equal(
          dom74.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/text-to-video',
        ),
        assert.equal(dom74.body.prompt, 'low fast text'),
        assert.equal(dom74.body.resolution, '720p'),
        assert.equal(dom74.body.duration, '8'),
        assert.equal(dom74.body.aspectRatio, '16:9'),
        assert.equal('model' in dom74.body, false),
        assert.equal('generateAudio' in dom74.body, false),
        assert.equal(dom74.useOpenapiQuery, true));
      const dom75 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/veo3.1',
        prompt: 'low image',
        inputUrls: ['https://www.runninghub.cn/assets/veo3-first.png'],
        generationParams: { rh_veo3_channel: 'lowCost', mode: 'fast' },
      });
      (assert.equal(
        dom75.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/image-to-video',
      ),
        assert.deepEqual(dom75.body.imageUrls, ['https://www.runninghub.cn/assets/veo3-first.png']));
      const dom76 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/veo3.1',
        prompt: 'low image duplicate slot',
        inputUrls: ['https://source.local/veo3-dup.png'],
        inputUrlsBySlot: { firstFrame: 'https://source.local/veo3-dup.png' },
        generationParams: { rh_veo3_channel: 'lowCost', mode: 'fast' },
      });
      (assert.equal(
        dom76.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/image-to-video',
      ),
        assert.deepEqual(dom76.body.imageUrls, ['https://www.runninghub.cn/uploaded/veo3-dup-1.png']),
        assert.equal(value48, 1),
        assert.equal('firstFrameUrl' in dom76.body, false),
        assert.equal('lastFrameUrl' in dom76.body, false));
      const dom77 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/veo3',
        prompt: 'low pro frames',
        inputUrlsBySlot: {
          firstFrame: 'https://www.runninghub.cn/assets/veo3-first.png',
          lastFrame: 'https://www.runninghub.cn/assets/veo3-last.png',
        },
        generationParams: { rh_veo3_channel: 'lowCost', mode: 'pro', aspectRatio: '9:16' },
      });
      (assert.equal(
        dom77.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro/start-end-to-video',
      ),
        assert.equal(dom77.body.firstFrameUrl, 'https://www.runninghub.cn/assets/veo3-first.png'),
        assert.equal(dom77.body.lastFrameUrl, 'https://www.runninghub.cn/assets/veo3-last.png'),
        assert.equal(dom77.body.aspectRatio, '9:16'));
      const dom78 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/veo3',
        prompt: 'official pro text',
        generationParams: {
          rh_veo3_channel: 'official',
          mode: 'pro',
          aspectRatio: '9:16',
          duration: 6,
          resolution: '4k',
          generateAudio: true,
        },
      });
      (assert.equal(
        dom78.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/text-to-video',
      ),
        assert.equal(dom78.body.resolution, '4k'),
        assert.equal(dom78.body.duration, '6'),
        assert.equal(dom78.body.generateAudio, true));
      const dom79 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/veo3',
        prompt: 'official reference',
        inputUrlsBySlot: { referenceImage: 'https://www.runninghub.cn/assets/veo3-ref-a.png' },
        inputUrls: ['https://www.runninghub.cn/assets/veo3-ref-b.png'],
        generationParams: {
          rh_veo3_channel: 'official',
          mode: 'fast',
          generation_type: 'reference',
          aspectRatio: '16:9',
        },
      });
      (assert.equal(
        dom79.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/reference-to-video',
      ),
        assert.deepEqual(dom79.body.imageUrls, [
          'https://www.runninghub.cn/assets/veo3-ref-a.png',
          'https://www.runninghub.cn/assets/veo3-ref-b.png',
        ]),
        assert.equal('duration' in dom79.body, false),
        assert.equal(dom79.body.aspectRatio, '16:9'));
      const dom80 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/veo3',
        videos: ['https://www.runninghub.cn/assets/veo3-extend.mp4'],
        generationParams: {
          rh_veo3_channel: 'official',
          mode: 'fast',
          generation_type: 'extend',
          resolution: '1080p',
          aspectRatio: '9:16',
          duration: 8,
          generateAudio: true,
        },
      });
      (assert.equal(
        dom80.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/video-extend',
      ),
        assert.equal(dom80.body.video, 'https://www.runninghub.cn/assets/veo3-extend.mp4'),
        assert.equal(dom80.body.resolution, '1080p'),
        assert.equal('prompt' in dom80.body, false),
        assert.equal('duration' in dom80.body, false),
        assert.equal('aspectRatio' in dom80.body, false),
        assert.equal('generateAudio' in dom80.body, false));
      const dom81 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/veo3',
        prompt: 'official lite frames',
        inputUrlsBySlot: {
          firstFrame: 'https://www.runninghub.cn/assets/veo3-lite-first.png',
          lastFrame: 'https://www.runninghub.cn/assets/veo3-lite-last.png',
        },
        generationParams: { rh_veo3_channel: 'official', mode: 'lite', duration: 8, generateAudio: true },
      });
      (assert.equal(
        dom81.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-lite-official/start-end-to-video',
      ),
        assert.equal(dom81.body.firstImageUrl, 'https://www.runninghub.cn/assets/veo3-lite-first.png'),
        assert.equal(dom81.body.lastImageUrl, 'https://www.runninghub.cn/assets/veo3-lite-last.png'),
        assert.equal('duration' in dom81.body, false),
        assert.equal('generateAudio' in dom81.body, false),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'runninghub',
            model: 'runninghub-model/veo3',
            prompt: 'official fast start-end is not published',
            inputUrlsBySlot: {
              firstFrame: 'https://www.runninghub.cn/assets/veo3-fast-first.png',
              lastFrame: 'https://www.runninghub.cn/assets/veo3-fast-last.png',
            },
            generationParams: { rh_veo3_channel: 'official', mode: 'fast' },
          }),
          /official Fast\/Pro start-end endpoint is not published/,
        ));
    } finally {
      globalThis.fetch = value47;
    }
  }),
  test('buildGenerateVideoRequest should map RunningHub Kling V3.0 mixed endpoints', async () => {
    const { clearApiConfig: clearApiConfig16 } = await import('./configApi.js');
    clearApiConfig16();
    const value50 = globalThis.fetch;
    try {
      globalThis.fetch = async (value51) => {
        if (String(value51) === '/api/config')
          return makeJsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
            },
          });
        throw new Error('unexpected fetch url: ' + String(value51));
      };
      const dom82 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/kling-v3',
        prompt: 'kling v3 text',
        generationParams: {
          resolution: 'std',
          aspectRatio: '自适应',
          duration: 2,
          audio: true,
          cfgScale: 0.83,
          shotType: 'intelligence',
          negative_prompt: 'blur',
        },
      });
      (assert.equal(dom82.body.apiKey, 'k_runninghub_model'),
        assert.equal(dom82.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/kling-v3.0-std/text-to-video'),
        assert.equal(dom82.body.prompt, 'kling v3 text'),
        assert.equal(dom82.body.aspectRatio, '16:9'),
        assert.equal(dom82.body.duration, '3'),
        assert.equal(dom82.body.sound, true),
        assert.equal(dom82.body.cfgScale, 0.8),
        assert.equal(dom82.body.multiShot, false),
        assert.equal(dom82.body.shotType, 'intelligence'),
        assert.equal(dom82.body.negativePrompt, 'blur'),
        assert.equal('model' in dom82.body, false),
        assert.equal(dom82.useOpenapiQuery, true));
      const dom83 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/kling-v3.0',
        prompt: 'start to end',
        inputUrlsBySlot: {
          firstFrame: 'https://www.runninghub.cn/assets/kling-first.png',
          lastFrame: 'https://www.runninghub.cn/assets/kling-last.png',
        },
        generationParams: { resolution: 'pro', aspectRatio: '1:1', duration: 15 },
      });
      (assert.equal(dom83.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/kling-v3.0-pro/image-to-video'),
        assert.equal(dom83.body.firstImageUrl, 'https://www.runninghub.cn/assets/kling-first.png'),
        assert.equal(dom83.body.lastImageUrl, 'https://www.runninghub.cn/assets/kling-last.png'),
        assert.equal('aspectRatio' in dom83.body, false));
      const dom84 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/kling-v30',
        prompt: 'kling v3 4k text',
        generationParams: { resolution: '4k', aspectRatio: '9:16', duration: 15 },
      });
      (assert.equal(dom84.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/kling-v3-4k/text-to-video'),
        assert.equal(dom84.body.duration, '15'),
        assert.equal(dom84.body.aspectRatio, '9:16'));
      const dom85 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/kling-v3',
        prompt: 'kling v3 4k image',
        inputUrlsBySlot: { firstFrame: 'https://www.runninghub.cn/assets/kling-4k.png' },
        generationParams: { resolution: '4k', aspectRatio: '自适应' },
      });
      (assert.equal(dom85.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/kling-v3-4k/image-to-video'),
        assert.equal(dom85.body.imageUrl, 'https://www.runninghub.cn/assets/kling-4k.png'),
        assert.equal('firstImageUrl' in dom85.body, false),
        assert.equal('aspectRatio' in dom85.body, false),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'runninghub',
            model: 'runninghub-model/kling-v3',
            prompt: '4k frames',
            inputUrlsBySlot: {
              firstFrame: 'https://www.runninghub.cn/assets/kling-4k-first.png',
              lastFrame: 'https://www.runninghub.cn/assets/kling-4k-last.png',
            },
            generationParams: { resolution: '4k' },
          }),
          /4K image-to-video supports only one imageUrl/,
        ),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'runninghub',
            model: 'runninghub-model/kling-v3',
            prompt: 'video unsupported',
            videos: ['https://www.runninghub.cn/assets/kling-source.mp4'],
          }),
          /does not accept video input/,
        ));
    } finally {
      globalThis.fetch = value50;
    }
  }),
  test('buildGenerateVideoRequest should map RunningHub Kling O3 mixed endpoints', async () => {
    const { clearApiConfig: clearApiConfig17 } = await import('./configApi.js');
    clearApiConfig17();
    const value52 = globalThis.fetch;
    try {
      globalThis.fetch = async (value53) => {
        if (String(value53) === '/api/config')
          return makeJsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
            },
          });
        throw new Error('unexpected fetch url: ' + String(value53));
      };
      const dom86 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/kling-o3',
        prompt: 'kling o3 text',
        generationParams: {
          resolution: 'std',
          aspectRatio: '自适应',
          duration: 2,
          audio: true,
          shotType: 'customize',
        },
      });
      (assert.equal(dom86.body.apiKey, 'k_runninghub_model'),
        assert.equal(
          dom86.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/text-to-video',
        ),
        assert.equal(dom86.body.prompt, 'kling o3 text'),
        assert.equal(dom86.body.aspectRatio, '16:9'),
        assert.equal(dom86.body.duration, '3'),
        assert.equal(dom86.body.sound, true),
        assert.equal(dom86.body.multiShot, false),
        assert.equal(dom86.body.shotType, 'customize'),
        assert.equal('model' in dom86.body, false),
        assert.equal(dom86.useOpenapiQuery, true));
      const dom87 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/kling-video-o3',
        prompt: 'o3 start to end',
        inputUrlsBySlot: {
          firstFrame: 'https://www.runninghub.cn/assets/o3-first.png',
          lastFrame: 'https://www.runninghub.cn/assets/o3-last.png',
        },
        generationParams: { resolution: 'pro', aspectRatio: '1:1', duration: 15 },
      });
      (assert.equal(
        dom87.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/image-to-video',
      ),
        assert.equal(dom87.body.firstImageUrl, 'https://www.runninghub.cn/assets/o3-first.png'),
        assert.equal(dom87.body.lastImageUrl, 'https://www.runninghub.cn/assets/o3-last.png'),
        assert.equal('aspectRatio' in dom87.body, false));
      const dom88 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/kling-o3',
        prompt: 'kling o3 4k text',
        generationParams: { resolution: '4k', aspectRatio: '9:16', duration: 15 },
      });
      (assert.equal(
        dom88.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/text-to-video',
      ),
        assert.equal(dom88.body.duration, '15'),
        assert.equal(dom88.body.aspectRatio, '9:16'));
      const dom89 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/kling-o3',
        prompt: 'kling o3 4k image',
        inputUrlsBySlot: { firstFrame: 'https://www.runninghub.cn/assets/o3-4k.png' },
        generationParams: { resolution: '4k', aspectRatio: '自适应' },
      });
      (assert.equal(
        dom89.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/image-to-video',
      ),
        assert.equal(dom89.body.firstImageUrl, 'https://www.runninghub.cn/assets/o3-4k.png'),
        assert.equal('aspectRatio' in dom89.body, false));
      const dom90 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/kling-o3',
        prompt: '参考 @图片1 和 @视频1 的动作',
        inputUrlsBySlot: { referenceImage: 'https://www.runninghub.cn/assets/o3-ref.png' },
        videos: ['https://www.runninghub.cn/assets/o3-ref.mp4'],
        generationParams: {
          resolution: 'pro',
          kling_v3_omni_mode: 'reference',
          aspectRatio: '16:9',
          duration: 5,
          keep_original_sound: true,
          audio: false,
          shotType: 'customize',
        },
      });
      (assert.equal(
        dom90.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/reference-to-video',
      ),
        assert.deepEqual(dom90.body.imageUrls, ['https://www.runninghub.cn/assets/o3-ref.png']),
        assert.equal(dom90.body.videoUrl, 'https://www.runninghub.cn/assets/o3-ref.mp4'),
        assert.equal(dom90.body.keepOriginalSound, true),
        assert.equal(dom90.body.aspectRatio, '16:9'),
        assert.equal(dom90.body.duration, '5'),
        assert.equal(dom90.body.sound, false),
        assert.equal('shotType' in dom90.body, false));
      const dom91 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/kling-o3',
        prompt: 'o3 4k reference',
        inputUrlsBySlot: { referenceImage: 'https://www.runninghub.cn/assets/o3-4k-ref.png' },
        generationParams: { resolution: '4k', kling_v3_omni_mode: 'reference', shotType: 'customize' },
      });
      (assert.equal(
        dom91.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/reference-to-video',
      ),
        assert.equal(dom91.body.shotType, 'customize'));
      const dom92 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/kling-o3',
        prompt: 'Change the time to night',
        inputUrlsBySlot: { editRefImage: 'https://www.runninghub.cn/assets/o3-edit-ref.png' },
        videos: ['https://www.runninghub.cn/assets/o3-edit.mp4'],
        generationParams: {
          resolution: 'std',
          kling_v3_omni_mode: 'edit',
          keep_original_sound: true,
          audio: true,
          duration: 9,
        },
      });
      (assert.equal(dom92.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/video-edit'),
        assert.equal(dom92.body.videoUrl, 'https://www.runninghub.cn/assets/o3-edit.mp4'),
        assert.deepEqual(dom92.body.imageUrls, ['https://www.runninghub.cn/assets/o3-edit-ref.png']),
        assert.equal(dom92.body.keepOriginalSound, true),
        assert.equal('duration' in dom92.body, false),
        assert.equal('sound' in dom92.body, false),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'runninghub',
            model: 'runninghub-model/kling-o3',
            prompt: '4k frames',
            inputUrlsBySlot: {
              firstFrame: 'https://www.runninghub.cn/assets/o3-4k-first.png',
              lastFrame: 'https://www.runninghub.cn/assets/o3-4k-last.png',
            },
            generationParams: { resolution: '4k' },
          }),
          /4K image-to-video supports only one firstImageUrl/,
        ),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'runninghub',
            model: 'runninghub-model/kling-o3',
            prompt: '4k edit',
            videos: ['https://www.runninghub.cn/assets/o3-edit.mp4'],
            generationParams: { resolution: '4k', kling_v3_omni_mode: 'edit' },
          }),
          /4K does not support video edit/,
        ));
    } finally {
      globalThis.fetch = value52;
    }
  }),
  test('buildGenerateVideoRequest should map RunningHub Seedance 2.0 mixed endpoints', async () => {
    const { clearApiConfig: clearApiConfig18 } = await import('./configApi.js');
    clearApiConfig18();
    const value54 = globalThis.fetch;
    try {
      globalThis.fetch = async (value55) => {
        if (String(value55) === '/api/config')
          return makeJsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
            },
          });
        throw new Error('unexpected fetch url: ' + String(value55));
      };
      const dom93 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/seedance-2.0',
        prompt: 'seedance text',
        generationParams: {
          rh_seedance_2_mode: 'text2video',
          resolution: '4k',
          aspectRatio: '自适应',
          duration: 15,
          generateAudio: true,
          webSearch: true,
          seed: '42',
        },
      });
      (assert.equal(dom93.body.apiKey, 'k_runninghub_model'),
        assert.equal(
          dom93.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/text-to-video',
        ),
        assert.equal(dom93.body.prompt, 'seedance text'),
        assert.equal(dom93.body.resolution, '4k'),
        assert.equal(dom93.body.duration, '15'),
        assert.equal(dom93.body.ratio, '16:9'),
        assert.equal(dom93.body.generateAudio, true),
        assert.equal(dom93.body.webSearch, true),
        assert.equal(dom93.body.returnLastFrame, false),
        assert.equal(dom93.body.seed, 42),
        assert.equal('model' in dom93.body, false),
        assert.equal('firstFrameUrl' in dom93.body, false),
        assert.equal('imageUrls' in dom93.body, false),
        assert.equal('conversionSlots' in dom93.body, false),
        assert.equal(dom93.useOpenapiQuery, true));
      const dom94 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/seedance2.0',
        prompt: 'seedance frames',
        inputUrlsBySlot: {
          firstFrame: 'https://www.runninghub.cn/assets/seedance-first.png',
          lastFrame: 'https://www.runninghub.cn/assets/seedance-last.png',
        },
        generationParams: {
          rh_seedance_2_model: 'standard',
          rh_seedance_2_mode: 'frames2video',
          resolution: 'native1080p',
          aspectRatio: '21:9',
          duration: 4,
          generateAudio: false,
          webSearch: true,
          realPersonMode: true,
        },
      });
      (assert.equal(
        dom94.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0/image-to-video',
      ),
        assert.equal(dom94.body.resolution, 'native1080p'),
        assert.equal(dom94.body.duration, '4'),
        assert.equal(dom94.body.ratio, '21:9'),
        assert.equal(dom94.body.generateAudio, false),
        assert.equal(dom94.body.firstFrameUrl, 'https://www.runninghub.cn/assets/seedance-first.png'),
        assert.equal(dom94.body.lastFrameUrl, 'https://www.runninghub.cn/assets/seedance-last.png'),
        assert.equal(dom94.body.realPersonMode, true),
        assert.equal(dom94.body.returnLastFrame, false),
        assert.deepEqual(dom94.body.conversionSlots, ['all']),
        assert.equal('webSearch' in dom94.body, false),
        assert.equal('imageUrls' in dom94.body, false));
      const dom95 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/seedance-2.0',
        prompt: 'seedance reference',
        inputUrlsBySlot: { referenceImage: 'https://www.runninghub.cn/assets/seedance-ref.png' },
        inputUrls: ['https://www.runninghub.cn/assets/seedance-ref-2.png'],
        videos: ['https://www.runninghub.cn/assets/seedance-ref.mp4'],
        audios: ['https://www.runninghub.cn/assets/seedance-ref.mp3'],
        generationParams: {
          rh_seedance_2_model: 'fast',
          rh_seedance_2_mode: 'multimodal2video',
          aspectRatio: '3:4',
          generateAudio: false,
        },
      });
      (assert.equal(
        dom95.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/multimodal-video',
      ),
        assert.deepEqual(dom95.body.imageUrls, [
          'https://www.runninghub.cn/assets/seedance-ref.png',
          'https://www.runninghub.cn/assets/seedance-ref-2.png',
        ]),
        assert.deepEqual(dom95.body.videoUrls, ['https://www.runninghub.cn/assets/seedance-ref.mp4']),
        assert.deepEqual(dom95.body.audioUrls, ['https://www.runninghub.cn/assets/seedance-ref.mp3']),
        assert.equal(dom95.body.ratio, '3:4'),
        assert.equal(dom95.body.generateAudio, false),
        assert.equal('firstFrameUrl' in dom95.body, false),
        assert.equal('webSearch' in dom95.body, false),
        assert.equal('conversionSlots' in dom95.body, false),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'runninghub',
            model: 'runninghub-model/seedance-2.0',
            prompt: 'audio only',
            audios: ['https://www.runninghub.cn/assets/seedance-ref.mp3'],
            generationParams: { rh_seedance_2_mode: 'multimodal2video' },
          }),
          /multimodal mode requires image or video input/,
        ));
    } finally {
      globalThis.fetch = value54;
    }
  }),
  test('buildGenerateVideoRequest should map RunningHub HappyHorse 1.0 mixed endpoints', async () => {
    const { clearApiConfig: clearApiConfig19 } = await import('./configApi.js');
    clearApiConfig19();
    const value56 = globalThis.fetch;
    try {
      globalThis.fetch = async (value57) => {
        if (String(value57) === '/api/config')
          return makeJsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
            },
          });
        throw new Error('unexpected fetch url: ' + String(value57));
      };
      const dom96 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/happyhorse-1.0',
        prompt: 'happyhorse text',
        generationParams: { resolution: '1080P', aspectRatio: '自适应', duration: 16, seed: '42' },
      });
      (assert.equal(dom96.body.apiKey, 'k_runninghub_model'),
        assert.equal(
          dom96.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/text-to-video',
        ),
        assert.equal(dom96.body.prompt, 'happyhorse text'),
        assert.equal(dom96.body.resolution, '1080p'),
        assert.equal(dom96.body.duration, '15'),
        assert.equal(dom96.body.aspectRatio, '16:9'),
        assert.equal(dom96.body.seed, 42),
        assert.equal('model' in dom96.body, false),
        assert.equal('audioSetting' in dom96.body, false),
        assert.equal(dom96.useOpenapiQuery, true));
      const dom97 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/happyhorse',
        prompt: 'happyhorse image',
        inputUrlsBySlot: { firstFrame: 'https://www.runninghub.cn/assets/happyhorse-first.png' },
        generationParams: { happyhorse_mode: 'image', resolution: '720P', aspectRatio: '1:1', duration: 3 },
      });
      (assert.equal(
        dom97.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/image-to-video',
      ),
        assert.equal(dom97.body.imageUrl, 'https://www.runninghub.cn/assets/happyhorse-first.png'),
        assert.equal(dom97.body.resolution, '720p'),
        assert.equal(dom97.body.duration, '3'),
        assert.equal('aspectRatio' in dom97.body, false),
        assert.equal('imageUrls' in dom97.body, false));
      const dom98 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/happyhorse-1.0',
        prompt: 'happyhorse reference',
        inputUrlsBySlot: { referenceImage: 'https://www.runninghub.cn/assets/happyhorse-ref.png' },
        inputUrls: ['https://www.runninghub.cn/assets/happyhorse-ref-2.png'],
        generationParams: {
          happyhorse_mode: 'reference',
          aspectRatio: '3:4',
          resolution: '1080P',
          duration: 5,
        },
      });
      (assert.equal(
        dom98.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/reference-to-video',
      ),
        assert.deepEqual(dom98.body.imageUrls, [
          'https://www.runninghub.cn/assets/happyhorse-ref.png',
          'https://www.runninghub.cn/assets/happyhorse-ref-2.png',
        ]),
        assert.equal(dom98.body.aspectRatio, '3:4'),
        assert.equal('imageUrl' in dom98.body, false));
      const dom99 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/happyhorse-1.0',
        prompt: 'happyhorse edit',
        inputUrlsBySlot: { editRefImage: 'https://www.runninghub.cn/assets/happyhorse-edit-ref.png' },
        videos: ['https://www.runninghub.cn/assets/happyhorse-source.mp4'],
        generationParams: {
          happyhorse_mode: 'edit',
          audio_setting: 'origin',
          resolution: '1080P',
          duration: 9,
        },
      });
      (assert.equal(
        dom99.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/video-edit',
      ),
        assert.equal(dom99.body.videoUrl, 'https://www.runninghub.cn/assets/happyhorse-source.mp4'),
        assert.deepEqual(dom99.body.imageUrls, ['https://www.runninghub.cn/assets/happyhorse-edit-ref.png']),
        assert.equal(dom99.body.audioSetting, 'origin'),
        assert.equal('duration' in dom99.body, false),
        assert.equal('aspectRatio' in dom99.body, false));
      const dom100 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/happyhorse-1.0',
        prompt: 'default image mode',
        inputUrls: ['https://www.runninghub.cn/assets/happyhorse-default.png'],
      });
      (assert.equal(
        dom100.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/image-to-video',
      ),
        assert.equal(dom100.body.imageUrl, 'https://www.runninghub.cn/assets/happyhorse-default.png'));
      const dom101 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/happyhorse-1.0',
        prompt: 'text only happyhorse',
      });
      (assert.equal(
        dom101.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/text-to-video',
      ),
        assert.equal('imageUrl' in dom101.body, false),
        assert.equal('imageUrls' in dom101.body, false),
        assert.equal('videoUrl' in dom101.body, false));
    } finally {
      globalThis.fetch = value56;
    }
  }),
  test('buildGenerateVideoRequest should map RunningHub Wan2.7 mixed endpoints', async () => {
    const { clearApiConfig: clearApiConfig20 } = await import('./configApi.js');
    clearApiConfig20();
    const value58 = globalThis.fetch;
    try {
      globalThis.fetch = async (value59) => {
        if (String(value59) === '/api/config')
          return makeJsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
            },
          });
        throw new Error('unexpected fetch url: ' + String(value59));
      };
      const dom102 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/wan2.7',
        prompt: 'wan text',
        generationParams: {
          wan27_mode: 'image',
          aspectRatio: '自适应',
          duration: 4,
          resolution: '1080P',
          prompt_extend: false,
          negative_prompt: 'blur',
        },
      });
      (assert.equal(dom102.body.apiKey, 'k_runninghub_model'),
        assert.equal(
          dom102.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/text-to-video',
        ),
        assert.equal(dom102.body.prompt, 'wan text'),
        assert.equal(dom102.body.resolution, '1080P'),
        assert.equal(dom102.body.duration, '5'),
        assert.equal(dom102.body.aspectRatio, '16:9'),
        assert.equal(dom102.body.promptExtend, false),
        assert.equal(dom102.body.negativePrompt, 'blur'),
        assert.equal('model' in dom102.body, false),
        assert.equal(dom102.useOpenapiQuery, true));
      const dom103 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/wan27',
        prompt: 'wan frames',
        inputUrlsBySlot: {
          firstFrame: 'https://www.runninghub.cn/assets/wan-first.png',
          lastFrame: 'https://www.runninghub.cn/assets/wan-last.png',
        },
        generationParams: { wan27_mode: 'image', duration: 8 },
      });
      (assert.equal(
        dom103.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/image-to-video',
      ),
        assert.equal(dom103.body.firstImageUrl, 'https://www.runninghub.cn/assets/wan-first.png'),
        assert.equal(dom103.body.lastImageUrl, 'https://www.runninghub.cn/assets/wan-last.png'),
        assert.equal('aspectRatio' in dom103.body, false));
      const dom104 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/wan2.7',
        prompt: 'continue video',
        videos: ['https://www.runninghub.cn/assets/wan-source.mp4'],
        audios: ['https://www.runninghub.cn/assets/wan-audio.mp3'],
        generationParams: { wan27_mode: 'video', duration: 15, negative_prompt: 'low quality' },
      });
      (assert.equal(dom104.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/video-extend'),
        assert.equal(dom104.body.videoUrl, 'https://www.runninghub.cn/assets/wan-source.mp4'),
        assert.equal(dom104.body.audioUrl, 'https://www.runninghub.cn/assets/wan-audio.mp3'),
        assert.equal(dom104.body.negativePrompt, 'low quality'));
      const dom105 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/wan2.7',
        prompt: 'reference video',
        inputUrlsBySlot: { referenceImage: 'https://www.runninghub.cn/assets/wan-ref.png' },
        videos: ['https://www.runninghub.cn/assets/wan-ref.mp4'],
        generationParams: { wan27_mode: 'reference', aspectRatio: '9:16' },
      });
      (assert.equal(
        dom105.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/reference-to-video',
      ),
        assert.deepEqual(dom105.body.imageUrls, ['https://www.runninghub.cn/assets/wan-ref.png']),
        assert.deepEqual(dom105.body.videoUrls, ['https://www.runninghub.cn/assets/wan-ref.mp4']),
        assert.equal(dom105.body.aspectRatio, '9:16'));
      const dom106 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/wan2.7',
        prompt: 'edit video',
        inputUrlsBySlot: { editRefImage: 'https://www.runninghub.cn/assets/wan-edit-ref.png' },
        videos: ['https://www.runninghub.cn/assets/wan-original.mp4'],
        generationParams: { wan27_mode: 'edit', duration: 0 },
      });
      (assert.equal(dom106.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/video-edit'),
        assert.equal(dom106.body.videoUrl, 'https://www.runninghub.cn/assets/wan-original.mp4'),
        assert.deepEqual(dom106.body.imageUrls, ['https://www.runninghub.cn/assets/wan-edit-ref.png']),
        assert.equal(dom106.body.duration, '0'),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'runninghub',
            model: 'runninghub-model/wan2.7',
            prompt: 'reference audio unsupported',
            inputUrls: ['https://www.runninghub.cn/assets/wan-ref.png'],
            audios: ['https://www.runninghub.cn/assets/wan-audio.mp3'],
            generationParams: { wan27_mode: 'reference' },
          }),
          /reference mode does not accept audio input/,
        ),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'runninghub',
            model: 'runninghub-model/wan2.7',
            prompt: 'edit two videos unsupported',
            videos: [
              'https://www.runninghub.cn/assets/wan-original.mp4',
              'https://www.runninghub.cn/assets/wan-reference.mp4',
            ],
            generationParams: { wan27_mode: 'edit' },
          }),
          /video edit accepts only one original video/,
        ));
    } finally {
      globalThis.fetch = value58;
    }
  }),
  test('buildGenerateVideoRequest should not duplicate RunningHub slot images into generic inputs', async () => {
    const { clearApiConfig: clearApiConfig21 } = await import('./configApi.js');
    clearApiConfig21();
    const value60 = globalThis.fetch;
    let value61 = 0;
    try {
      globalThis.fetch = async (value62) => {
        const list2 = String(value62);
        if (list2 === '/api/config')
          return makeJsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
            },
          });
        if (list2.startsWith('https://source.local/rh-slot-dup-'))
          return {
            ok: true,
            status: 200,
            headers: { get: () => 'image/png' },
            blob: async () => new Blob([list2], { type: 'image/png' }),
            text: async () => '',
          };
        if (list2.includes('/api/v2/proxy/upload'))
          return (
            (value61 += 1),
            makeJsonResponse({
              data: { download_url: 'https://www.runninghub.cn/uploaded/rh-slot-dup-' + value61 + '.png' },
            })
          );
        throw new Error('unexpected fetch url: ' + list2);
      };
      const value63 = [
        {
          name: 'kling-o1',
          payload: { model: 'runninghub-model/kling-video-o1', generationParams: { aspectRatio: '9:16' } },
          expect: (value64, value65) => {
            (assert.equal(
              value64.apiUrl,
              'https://www.runninghub.cn/openapi/v2/kling-video-o1/image-to-video',
            ),
              assert.equal(value64.firstImageUrl, value65),
              assert.equal('lastImageUrl' in value64, false));
          },
        },
        {
          name: 'hailuo-02',
          payload: {
            model: 'runninghub-model/hailuo-02',
            generationParams: { rh_hailuo_02_quality: 'standard' },
          },
          expect: (value66, value67) => {
            (assert.equal(
              value66.apiUrl,
              'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/i2v-standard',
            ),
              assert.equal(value66.firstImageUrl, value67),
              assert.equal('lastImageUrl' in value66, false));
          },
        },
        {
          name: 'hailuo-23',
          payload: {
            model: 'runninghub-model/hailuo-2.3',
            generationParams: { rh_hailuo_23_quality: 'standard' },
          },
          expect: (value68, value69) => {
            (assert.equal(
              value68.apiUrl,
              'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/i2v-standard',
            ),
              assert.equal(value68.imageUrl, value69),
              assert.equal('firstImageUrl' in value68, false),
              assert.equal('lastImageUrl' in value68, false));
          },
        },
        {
          name: 'kling-v3-4k',
          payload: { model: 'runninghub-model/kling-v3', generationParams: { resolution: '4k' } },
          expect: (value70, value71) => {
            (assert.equal(value70.apiUrl, 'https://www.runninghub.cn/openapi/v2/kling-v3-4k/image-to-video'),
              assert.equal(value70.imageUrl, value71),
              assert.equal('firstImageUrl' in value70, false),
              assert.equal('lastImageUrl' in value70, false));
          },
        },
        {
          name: 'kling-o3-4k',
          payload: { model: 'runninghub-model/kling-o3', generationParams: { resolution: '4k' } },
          expect: (value72, value73) => {
            (assert.equal(
              value72.apiUrl,
              'https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/image-to-video',
            ),
              assert.equal(value72.firstImageUrl, value73),
              assert.equal('lastImageUrl' in value72, false));
          },
        },
        {
          name: 'seedance-2',
          payload: {
            model: 'runninghub-model/seedance-2.0',
            generationParams: { rh_seedance_2_mode: 'image2video' },
          },
          expect: (value74, value75) => {
            (assert.equal(
              value74.apiUrl,
              'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/image-to-video',
            ),
              assert.equal(value74.firstFrameUrl, value75),
              assert.equal('lastFrameUrl' in value74, false));
          },
        },
        {
          name: 'happyhorse',
          payload: {
            model: 'runninghub-model/happyhorse-1.0',
            generationParams: { happyhorse_mode: 'image' },
          },
          expect: (value76, value77) => {
            (assert.equal(
              value76.apiUrl,
              'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/image-to-video',
            ),
              assert.equal(value76.imageUrl, value77),
              assert.equal('imageUrls' in value76, false));
          },
        },
        {
          name: 'wan-27',
          payload: { model: 'runninghub-model/wan2.7', generationParams: { wan27_mode: 'image' } },
          expect: (value78, value79) => {
            (assert.equal(
              value78.apiUrl,
              'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/image-to-video',
            ),
              assert.equal(value78.firstImageUrl, value79),
              assert.equal('lastImageUrl' in value78, false));
          },
        },
      ];
      for (const prompt of value63) {
        const firstFrame = 'https://source.local/rh-slot-dup-' + prompt.name + '.png',
          value80 = value61,
          dom107 = await buildGenerateVideoRequest({
            provider: 'runninghub',
            prompt: prompt.name + ' duplicate slot',
            ...prompt.payload,
            inputUrls: [firstFrame],
            inputUrlsBySlot: { firstFrame: firstFrame },
          });
        (assert.equal(value61, value80 + 1, prompt.name + ' should upload the slotted source only once'),
          prompt.expect(dom107.body, 'https://www.runninghub.cn/uploaded/rh-slot-dup-' + value61 + '.png'));
      }
    } finally {
      globalThis.fetch = value60;
    }
  }),
  test('aiVideoApi: RunningHub model API video polls openapi query', async () => {
    const value81 = globalThis.fetch,
      handler = globalThis.setTimeout,
      list3 = [],
      list4 = [],
      list5 = [];
    try {
      globalThis.setTimeout = (value82, value83, ...args) =>
        handler(value82, Number(value83) > 0x1388 ? Number(value83) : 0, ...args);
      const { clearApiConfig: clearApiConfig22 } = await import('./configApi.js');
      (clearApiConfig22(),
        (globalThis.fetch = async (value84, dom108 = {}) => {
          const value85 = String(value84);
          if (value85 === '/api/config')
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
              },
            });
          if (value85 === '/api/v2/proxy/image') {
            const value86 = JSON.parse(String(dom108.body || '{}'));
            if (value86.apiUrl === 'https://www.runninghub.cn/openapi/v2/query')
              return (
                list5.push(value86),
                makeJsonResponse({
                  code: 0,
                  status: 'SUCCESS',
                  results: [{ url: 'https://www.runninghub.cn/result/o1-final.mp4', outputType: 'video' }],
                })
              );
            return (
              list4.push(value86),
              makeJsonResponse({
                taskId: 'rh-o1-task-1',
                status: 'SUBMITTED',
                errorCode: 0,
                errorMessage: '',
                results: null,
              })
            );
          }
          if (value85 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/rh-o1-final.mp4' });
          throw new Error('unexpected fetch url: ' + value85);
        }));
      const generateVideo2 = await generateVideo(
        {
          provider: 'runninghub',
          model: 'runninghub-model/kling-video-o1',
          prompt: 'city lights',
          generationParams: { aspectRatio: '16:9', duration: 5 },
        },
        { onTaskMeta: (value87) => list3.push(value87) },
      );
      (assert.equal(list4.length, 1),
        assert.equal(list4[0].apiUrl, 'https://www.runninghub.cn/openapi/v2/kling-video-o1/text-to-video'),
        assert.equal(list5.length, 1),
        assert.equal(list5[0].apiKey, 'k_runninghub_model'),
        assert.equal(list5[0].taskId, 'rh-o1-task-1'),
        assert.equal(list3[0]?.taskId, 'rh-o1-task-1'),
        assert.equal(list3[0]?.useOpenapiQuery, true),
        assert.equal(generateVideo2.videoUrl, '/output/rh-o1-final.mp4'),
        assert.equal(generateVideo2.sourceUrl, 'https://www.runninghub.cn/result/o1-final.mp4'));
    } finally {
      ((globalThis.fetch = value81), (globalThis.setTimeout = handler));
    }
  }),
  test('aiVideoApi: apimart 异步视频会回调 onTaskMeta 且支持 resumeAsyncVideoTask', async () => {
    const value88 = globalThis.fetch,
      handler2 = globalThis.setTimeout,
      list6 = [],
      list7 = [];
    try {
      globalThis.setTimeout = (value89, value90, ...args2) =>
        handler2(value89, Number(value90) > 0x1388 ? Number(value90) : 0, ...args2);
      const { clearApiConfig: clearApiConfig23 } = await import('./configApi.js');
      (clearApiConfig23(),
        (globalThis.fetch = async (value91, response = {}) => {
          const value92 = String(value91);
          if (value92 === '/api/config')
            return makeJsonResponse({
              providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
            });
          if (value92 === '/api/v2/proxy/image')
            return makeJsonResponse({ data: [{ task_id: 'task-video-1', status: 'submitted' }] });
          if (value92.startsWith('/api/v2/proxy/task?'))
            return (
              list7.push(value92),
              assert.equal(response.headers?.Authorization, 'Bearer k_apimart'),
              makeJsonResponse({
                status: 'success',
                result: { video_url: 'https://cdn.example.com/final-video.mp4' },
              })
            );
          if (value92 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/final-video.mp4' });
          throw new Error('unexpected fetch url: ' + value92);
        }));
      const value93 = {
          provider: 'apimart',
          model: 'apimart/luma-ray-v2',
          prompt: 'sunset city',
          aspectRatio: '16:9',
          videoSize: 'standard',
        },
        generateVideo3 = await generateVideo(value93, { onTaskMeta: (value94) => list6.push(value94) });
      (assert.equal(list6.length, 1),
        assert.equal(list6[0].taskId, 'task-video-1'),
        assert.equal(list6[0].provider, 'apimart'),
        assert.equal(list6[0].kind, 'video'),
        assert.equal(generateVideo3.videoUrl, '/output/final-video.mp4'),
        assert.equal(generateVideo3.sourceUrl, 'https://cdn.example.com/final-video.mp4'),
        assert.equal(generateVideo3.localPath, 'output/final-video.mp4'),
        assert.equal(generateVideo3.videos[0].localPath, 'output/final-video.mp4'));
      const resumeAsyncVideoTask2 = await resumeAsyncVideoTask('task-video-2', {
        provider: 'apimart',
        model: 'apimart/luma-ray-v2',
      });
      (assert.equal(resumeAsyncVideoTask2.videoUrl, '/output/final-video.mp4'),
        assert.equal(resumeAsyncVideoTask2.sourceUrl, 'https://cdn.example.com/final-video.mp4'),
        assert.equal(resumeAsyncVideoTask2.localPath, 'output/final-video.mp4'),
        assert.equal(resumeAsyncVideoTask2.videos[0].localPath, 'output/final-video.mp4'),
        assert.ok(list7.every((list8) => list8.includes('%3Flanguage%3Dzh'))));
    } finally {
      ((globalThis.fetch = value88), (globalThis.setTimeout = handler2));
    }
  }),
  test('aiVideoApi: apimart result.videos 轮询结果保留缩略图并保存本地', async () => {
    const value95 = globalThis.fetch,
      handler3 = globalThis.setTimeout;
    try {
      globalThis.setTimeout = (value96, value97, ...args3) =>
        handler3(value96, Number(value97) > 0x1388 ? Number(value97) : 0, ...args3);
      const { clearApiConfig: clearApiConfig24 } = await import('./configApi.js');
      (clearApiConfig24(),
        (globalThis.fetch = async (value98, response2 = {}) => {
          const value99 = String(value98);
          if (value99 === '/api/config')
            return makeJsonResponse({
              providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
            });
          if (value99 === '/api/v2/proxy/image')
            return makeJsonResponse({ data: [{ task_id: 'task-seedance-video-1', status: 'submitted' }] });
          if (value99.startsWith('/api/v2/proxy/task?'))
            return (
              assert.equal(response2.headers?.Authorization, 'Bearer k_apimart'),
              makeJsonResponse({
                status: 'completed',
                result: {
                  videos: [
                    {
                      url: 'https://cdn.example.com/seedance-final.mp4',
                      thumbnail_url: 'https://cdn.example.com/seedance-final.jpg',
                    },
                  ],
                },
              })
            );
          if (value99 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/seedance-final.mp4' });
          throw new Error('unexpected fetch url: ' + value99);
        }));
      const generateVideo4 = await generateVideo({
        provider: 'apimart',
        model: 'apimart/doubao-seedance-2.0-fast',
        prompt: 'sunset city',
        aspectRatio: '16:9',
        resolution: '720p',
        duration: 5,
      });
      (assert.equal(generateVideo4.videoUrl, '/output/seedance-final.mp4'),
        assert.equal(generateVideo4.sourceUrl, 'https://cdn.example.com/seedance-final.mp4'),
        assert.equal(generateVideo4.thumbUrl, 'https://cdn.example.com/seedance-final.jpg'),
        assert.equal(generateVideo4.localPath, 'output/seedance-final.mp4'),
        assert.equal(generateVideo4.videos[0].localPath, 'output/seedance-final.mp4'));
    } finally {
      ((globalThis.fetch = value95), (globalThis.setTimeout = handler3));
    }
  }),
  test('aiVideoApi: apimart seedance 失败任务立即抛出轮询错误信息', async () => {
    const value100 = globalThis.fetch,
      handler4 = globalThis.setTimeout;
    let value101 = 0;
    try {
      globalThis.setTimeout = (value102, value103, ...args4) =>
        handler4(value102, Number(value103) > 0x1388 ? Number(value103) : 0, ...args4);
      const { clearApiConfig: clearApiConfig25 } = await import('./configApi.js');
      (clearApiConfig25(),
        (globalThis.fetch = async (value104, response3 = {}) => {
          const value105 = String(value104);
          if (value105 === '/api/config')
            return makeJsonResponse({
              providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
            });
          if (value105 === '/api/v2/proxy/image')
            return makeJsonResponse({
              code: 200,
              data: [{ task_id: 'task-seedance-failed', status: 'submitted' }],
            });
          if (value105.startsWith('/api/v2/proxy/task?'))
            return (
              (value101 += 1),
              assert.equal(response3.headers?.Authorization, 'Bearer k_apimart'),
              makeJsonResponse({
                code: 200,
                data: {
                  id: 'task-seedance-failed',
                  status: 'failed',
                  progress: 100,
                  error: { code: 0x190, message: 'Seedance upstream failed', type: 'invalid_request' },
                },
              })
            );
          throw new Error('unexpected fetch url: ' + value105);
        }),
        await assert.rejects(
          generateVideo({
            provider: 'apimart',
            model: 'apimart/doubao-seedance-2.0-fast',
            prompt: 'sunset city',
            aspectRatio: '16:9',
            resolution: '720p',
            duration: 5,
          }),
          (error) => String(error?.message || '').includes('Seedance upstream failed'),
        ),
        assert.equal(value101, 1));
    } finally {
      ((globalThis.fetch = value100), (globalThis.setTimeout = handler4));
    }
  }),
  test('aiVideoApi: Agnes 视频完成后返回 output.video 链接', async () => {
    const value106 = globalThis.fetch,
      handler5 = globalThis.setTimeout,
      list9 = [],
      video = 'https://cdn.agnes-ai.com/api/video-content/agnes-task-1?token=ok';
    try {
      globalThis.setTimeout = (value107, value108, ...args5) =>
        handler5(value107, Number(value108) > 0x1388 ? Number(value108) : 0, ...args5);
      const { clearApiConfig: clearApiConfig26 } = await import('./configApi.js');
      (clearApiConfig26(),
        (globalThis.fetch = async (value109, dom109 = {}) => {
          const value110 = String(value109);
          if (value110 === '/api/config')
            return makeJsonResponse({
              providers: { agnes: { apiUrl: 'https://apihub.agnes-ai.com', apiKey: 'k_agnes' } },
            });
          if (value110 === '/api/v2/proxy/image') {
            const value111 = JSON.parse(String(dom109.body || '{}'));
            return (
              assert.equal(value111.apiUrl, 'https://apihub.agnes-ai.com/v1/videos'),
              assert.equal(value111.apiKey, 'k_agnes'),
              assert.equal(value111.model, 'agnes-video-v2.0'),
              makeJsonResponse({ id: 'agnes-task-1', status: 'queued' })
            );
          }
          if (value110.startsWith('/api/v2/proxy/task?'))
            return (
              list9.push(new URL(value110, 'http://local.test').searchParams.get('apiUrl')),
              assert.equal(dom109.headers?.Authorization, 'Bearer k_agnes'),
              makeJsonResponse({ id: 'agnes-task-1', status: 'completed', output: { video: video } })
            );
          if (value110 === '/api/v2/save_output_from_url') {
            const response4 = JSON.parse(String(dom109.body || '{}'));
            return (
              assert.equal(response4.url, video),
              makeJsonResponse({ path: 'output/agnes-task-1.mp4' })
            );
          }
          throw new Error('unexpected fetch url: ' + value110);
        }));
      const generateVideo5 = await generateVideo({
        provider: 'agnes',
        model: 'agnes/agnes-video-v2.0',
        prompt: 'slow camera move',
        generationParams: { aspectRatio: '16:9', duration: 5 },
      });
      (assert.deepEqual(list9, ['https://apihub.agnes-ai.com/v1/videos/agnes-task-1']),
        assert.equal(generateVideo5.videoUrl, '/output/agnes-task-1.mp4'),
        assert.equal(generateVideo5.sourceUrl, video),
        assert.equal(generateVideo5.localPath, 'output/agnes-task-1.mp4'));
    } finally {
      ((globalThis.fetch = value106), (globalThis.setTimeout = handler5));
    }
  }),
  test('aiVideoApi: 异步视频完成但无结果地址时不继续空轮询', async () => {
    const value112 = globalThis.fetch,
      handler6 = globalThis.setTimeout;
    let value113 = 0;
    try {
      globalThis.setTimeout = (value114, value115, ...args6) =>
        handler6(value114, Number(value115) > 0x1388 ? Number(value115) : 0, ...args6);
      const { clearApiConfig: clearApiConfig27 } = await import('./configApi.js');
      (clearApiConfig27(),
        (globalThis.fetch = async (value116, response5 = {}) => {
          const value117 = String(value116);
          if (value117 === '/api/config')
            return makeJsonResponse({
              providers: { agnes: { apiUrl: 'https://apihub.agnes-ai.com', apiKey: 'k_agnes' } },
            });
          if (value117 === '/api/v2/proxy/image')
            return makeJsonResponse({ id: 'agnes-task-no-url', status: 'processing' });
          if (value117.startsWith('/api/v2/proxy/task?'))
            return (
              (value113 += 1),
              assert.equal(response5.headers?.Authorization, 'Bearer k_agnes'),
              makeJsonResponse({ id: 'agnes-task-no-url', status: 'completed' })
            );
          throw new Error('unexpected fetch url: ' + value117);
        }),
        await assert.rejects(
          generateVideo({ provider: 'agnes', model: 'agnes/agnes-video-v2.0', prompt: 'slow camera move' }),
          /无法从服务器响应中提取视频地址/,
        ),
        assert.equal(value113, 1));
    } finally {
      ((globalThis.fetch = value112), (globalThis.setTimeout = handler6));
    }
  }),
  test('aiVideoApi: RunningHub 工作流视频顶层 task_id 必须继续走 openapi 查询', async () => {
    const value118 = globalThis.fetch,
      handler7 = globalThis.setTimeout,
      list10 = [],
      list11 = [];
    try {
      globalThis.setTimeout = (value119, value120, ...args7) =>
        handler7(value119, Number(value120) > 0x1388 ? Number(value120) : 0, ...args7);
      const { clearApiConfig: clearApiConfig28 } = await import('./configApi.js');
      (clearApiConfig28(),
        (globalThis.fetch = async (value121, dom110 = {}) => {
          const url = String(value121);
          let body = null;
          if (dom110.body && typeof dom110.body === 'string')
            try {
              body = JSON.parse(dom110.body);
            } catch {
              body = null;
            }
          list11.push({ url: url, method: String(dom110.method || 'GET'), body: body });
          if (url === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiKey: 'k_runninghub' } } });
          if (url === '/api/v2/proxy/image') {
            const list12 = String(body?.apiUrl || '');
            if (list12.includes('/openapi/v2/run/ai-app/2041741496667348994'))
              return makeJsonResponse({ task_id: 'task-rh-v54-top-level', status: 'submitted' });
            if (list12.includes('/openapi/v2/query'))
              return makeJsonResponse({
                status: 'COMPLETED',
                results: [{ url: 'https://cdn.example.com/rh-v54.mp4' }],
              });
          }
          if (url === '/api/v2/save_output_from_url') return makeJsonResponse({ path: 'output/rh-v54.mp4' });
          if (url.startsWith('/api/v2/proxy/task?'))
            throw new Error('unexpected fallback to /api/v2/proxy/task');
          throw new Error('unexpected fetch url: ' + url);
        }));
      const generateVideo6 = await generateVideo(
        {
          provider: 'runninghubwf',
          model: 'runninghub/2041741496667348994',
          prompt: 'sunset city',
          aspectRatio: '16:9',
          resolution: '1080p',
          videoSize: '1080p',
          duration: 5,
          apiKey: 'k_runninghub',
          videoUrl: 'https://www.runninghub.cn/mock-input-video.mp4',
          inputUrls: ['https://www.runninghub.cn/mock-input-image.png'],
        },
        { onTaskMeta: (value122) => list10.push(value122) },
      );
      (assert.equal(list10.length, 1),
        assert.equal(list10[0].taskId, 'task-rh-v54-top-level'),
        assert.equal(list10[0].useOpenapiQuery, true),
        assert.equal(generateVideo6.videoUrl, '/output/rh-v54.mp4'),
        assert.equal(generateVideo6.sourceUrl, 'https://cdn.example.com/rh-v54.mp4'),
        assert.equal(generateVideo6.localPath, 'output/rh-v54.mp4'),
        assert.equal(generateVideo6.videos[0].localPath, 'output/rh-v54.mp4'),
        assert.ok(
          list11.some(
            (dom111) =>
              dom111.url === '/api/v2/proxy/image' &&
              String(dom111.body?.apiUrl || '').includes('/openapi/v2/query'),
          ),
        ),
        assert.ok(!list11.some((response6) => response6.url.startsWith('/api/v2/proxy/task?'))));
    } finally {
      ((globalThis.fetch = value118), (globalThis.setTimeout = handler7));
    }
  }),
  test('aiVideoApi: RunningHub ai-app 查询仅返回 fileUrl 时也应结束轮询', async () => {
    const value123 = globalThis.fetch,
      handler8 = globalThis.setTimeout,
      list13 = [];
    try {
      globalThis.setTimeout = (value124, value125, ...args8) =>
        handler8(value124, Number(value125) > 0x1388 ? Number(value125) : 0, ...args8);
      const { clearApiConfig: clearApiConfig29 } = await import('./configApi.js');
      (clearApiConfig29(),
        (globalThis.fetch = async (value126, dom112 = {}) => {
          const url2 = String(value126);
          let body2 = null;
          if (dom112.body && typeof dom112.body === 'string')
            try {
              body2 = JSON.parse(dom112.body);
            } catch {
              body2 = null;
            }
          list13.push({ url: url2, body: body2 });
          if (url2 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiKey: 'k_runninghub' } } });
          if (url2 === '/api/v2/proxy/image') {
            const list14 = String(body2?.apiUrl || '');
            if (list14.includes('/openapi/v2/run/ai-app/2054101324521844738'))
              return makeJsonResponse({ data: { id: 'task-rh-lipsync-fileurl' }, status: 'submitted' });
            if (list14.includes('/openapi/v2/query'))
              return makeJsonResponse({
                code: 0,
                data: [{ file_url: 'https://cdn.example.com/rh-lipsync-fileurl?id=123' }],
              });
          }
          if (url2 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/rh-lipsync-fileurl.mp4' });
          throw new Error('unexpected fetch url: ' + url2);
        }));
      const generateVideo7 = await generateVideo({
        provider: 'runninghubwf',
        model: 'runninghub/2054101324521844738',
        prompt: 'talk',
        apiKey: 'k_runninghub',
        videoUrl: 'https://www.runninghub.cn/mock-input-video.mp4',
        audioUrl: 'https://www.runninghub.cn/mock-input-audio.mp3',
        rhLipSyncInputIndex: 1,
        rhVideoFrames: 20,
        rhVideoResolution: 0x400,
      });
      (assert.equal(generateVideo7.videoUrl, '/output/rh-lipsync-fileurl.mp4'),
        assert.equal(generateVideo7.sourceUrl, 'https://cdn.example.com/rh-lipsync-fileurl?id=123'),
        assert.equal(generateVideo7.localPath, 'output/rh-lipsync-fileurl.mp4'),
        assert.equal(generateVideo7.videos[0].localPath, 'output/rh-lipsync-fileurl.mp4'),
        assert.equal(
          list13.filter((dom113) => String(dom113.body?.apiUrl || '').includes('/openapi/v2/query')).length,
          1,
        ));
    } finally {
      ((globalThis.fetch = value123), (globalThis.setTimeout = handler8));
    }
  }),
  test('aiVideoApi: RunningHub ai-app 保存接口失败时仍用本地兜底结果回填 videos', async () => {
    const value127 = globalThis.fetch,
      handler9 = globalThis.setTimeout,
      list15 = [],
      fileUrl = 'https://cdn.example.com/口型结果.mp4?token=abc';
    try {
      globalThis.setTimeout = (value128, value129, ...args9) =>
        handler9(value128, Number(value129) > 0x1388 ? Number(value129) : 0, ...args9);
      const { clearApiConfig: clearApiConfig30 } = await import('./configApi.js');
      (clearApiConfig30(),
        (globalThis.fetch = async (value130, dom114 = {}) => {
          const url3 = String(value130);
          let body3 = null;
          if (dom114.body && typeof dom114.body === 'string')
            try {
              body3 = JSON.parse(dom114.body);
            } catch {
              body3 = null;
            }
          list15.push({ url: url3, body: body3 });
          if (url3 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiKey: 'k_runninghub' } } });
          if (url3 === '/api/v2/proxy/image') {
            const list16 = String(body3?.apiUrl || '');
            if (list16.includes('/openapi/v2/run/ai-app/2054101324521844738'))
              return makeJsonResponse({
                data: { id: 'task-rh-lipsync-client-fallback' },
                status: 'submitted',
              });
            if (list16.includes('/openapi/v2/query'))
              return makeJsonResponse({ code: 0, data: [{ type: 'video', fileUrl: fileUrl }] });
          }
          if (url3 === '/api/v2/save_output_from_url')
            return makeJsonResponse(
              { error: "Download failed: 'ascii' codec can't encode characters in position 45-47" },
              0x1f6,
            );
          if (url3 === fileUrl) return makeBlobResponse(new Blob([new Uint8Array([1, 2, 3])]));
          if (url3 === '/api/v2/save_output?ext=mp4')
            return makeJsonResponse({ path: 'output/rh-lipsync-fallback.mp4' });
          throw new Error('unexpected fetch url: ' + url3);
        }));
      const generateVideo8 = await generateVideo({
        provider: 'runninghubwf',
        model: 'runninghub/2054101324521844738',
        prompt: 'talk',
        apiKey: 'k_runninghub',
        videoUrl: 'https://www.runninghub.cn/mock-input-video.mp4',
        audioUrl: 'https://www.runninghub.cn/mock-input-audio.mp3',
        rhLipSyncInputIndex: 1,
        rhVideoFrames: 20,
        rhVideoResolution: 0x400,
      });
      (assert.equal(generateVideo8.videoUrl, '/output/rh-lipsync-fallback.mp4'),
        assert.equal(generateVideo8.sourceUrl, fileUrl),
        assert.equal(generateVideo8.localPath, 'output/rh-lipsync-fallback.mp4'),
        assert.equal(generateVideo8.videos[0].videoUrl, '/output/rh-lipsync-fallback.mp4'),
        assert.equal(generateVideo8.videos[0].localPath, 'output/rh-lipsync-fallback.mp4'),
        assert.ok(list15.some((response7) => response7.url === '/api/v2/save_output?ext=mp4')));
    } finally {
      ((globalThis.fetch = value127), (globalThis.setTimeout = handler9));
    }
  }),
  test('aiVideoApi: RunningHub ai-app 创建响应 data 字符串也应作为 taskId 轮询', async () => {
    const value131 = globalThis.fetch,
      handler10 = globalThis.setTimeout,
      list17 = [];
    try {
      globalThis.setTimeout = (value132, value133, ...args10) =>
        handler10(value132, Number(value133) > 0x1388 ? Number(value133) : 0, ...args10);
      const { clearApiConfig: clearApiConfig31 } = await import('./configApi.js');
      (clearApiConfig31(),
        (globalThis.fetch = async (value134, dom115 = {}) => {
          const value135 = String(value134);
          let value136 = null;
          if (dom115.body && typeof dom115.body === 'string')
            try {
              value136 = JSON.parse(dom115.body);
            } catch {
              value136 = null;
            }
          if (value135 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiKey: 'k_runninghub' } } });
          if (value135 === '/api/v2/proxy/image') {
            const list18 = String(value136?.apiUrl || '');
            if (list18.includes('/openapi/v2/run/ai-app/2054101324521844738'))
              return makeJsonResponse({ code: 0, data: 'task-rh-lipsync-string' });
            if (list18.includes('/openapi/v2/query'))
              return (
                assert.equal(value136?.taskId, 'task-rh-lipsync-string'),
                makeJsonResponse({
                  taskId: 'task-rh-lipsync-string',
                  status: 'SUCCESS',
                  results: [{ url: 'https://cdn.example.com/rh-lipsync-string.mp4', outputType: 'mp4' }],
                })
              );
          }
          if (value135 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/rh-lipsync-string.mp4' });
          throw new Error('unexpected fetch url: ' + value135);
        }));
      const generateVideo9 = await generateVideo(
        {
          provider: 'runninghubwf',
          model: 'runninghub/2054101324521844738',
          prompt: 'talk',
          apiKey: 'k_runninghub',
          videoUrl: 'https://www.runninghub.cn/mock-input-video.mp4',
          audioUrl: 'https://www.runninghub.cn/mock-input-audio.mp3',
          rhLipSyncInputIndex: 1,
          rhVideoFrames: 20,
          rhVideoResolution: 0x400,
        },
        { onTaskMeta: (value137) => list17.push(value137) },
      );
      (assert.equal(list17[0]?.taskId, 'task-rh-lipsync-string'),
        assert.equal(list17[0]?.useOpenapiQuery, true),
        assert.equal(generateVideo9.videoUrl, '/output/rh-lipsync-string.mp4'),
        assert.equal(generateVideo9.sourceUrl, 'https://cdn.example.com/rh-lipsync-string.mp4'),
        assert.equal(generateVideo9.localPath, 'output/rh-lipsync-string.mp4'),
        assert.equal(generateVideo9.videos[0].localPath, 'output/rh-lipsync-string.mp4'));
    } finally {
      ((globalThis.fetch = value131), (globalThis.setTimeout = handler10));
    }
  }),
  test('aiVideoApi: RunningHub ai-app 创建响应 SSE data 行也应解析 taskId', async () => {
    const value138 = globalThis.fetch,
      handler11 = globalThis.setTimeout;
    try {
      globalThis.setTimeout = (value139, value140, ...args11) =>
        handler11(value139, Number(value140) > 0x1388 ? Number(value140) : 0, ...args11);
      const { clearApiConfig: clearApiConfig32 } = await import('./configApi.js');
      (clearApiConfig32(),
        (globalThis.fetch = async (value141, dom116 = {}) => {
          const value142 = String(value141);
          let value143 = null;
          if (dom116.body && typeof dom116.body === 'string')
            try {
              value143 = JSON.parse(dom116.body);
            } catch {
              value143 = null;
            }
          if (value142 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiKey: 'k_runninghub' } } });
          if (value142 === '/api/v2/proxy/image') {
            const list19 = String(value143?.apiUrl || '');
            if (list19.includes('/openapi/v2/run/ai-app/2054101324521844738'))
              return makeTextResponse(
                'data: {"code":0,"data":{"taskId":"task-rh-lipsync-sse"},"status":"submitted"}\n\n',
                200,
                'text/event-stream',
              );
            if (list19.includes('/openapi/v2/query'))
              return (
                assert.equal(value143?.taskId, 'task-rh-lipsync-sse'),
                makeJsonResponse({
                  code: 0,
                  data: {
                    status: 'SUCCESS',
                    outputs: [{ fileUrl: 'https://cdn.example.com/rh-lipsync-sse.mp4' }],
                  },
                })
              );
          }
          if (value142 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/rh-lipsync-sse.mp4' });
          throw new Error('unexpected fetch url: ' + value142);
        }));
      const generateVideo10 = await generateVideo({
        provider: 'runninghubwf',
        model: 'runninghub/2054101324521844738',
        prompt: 'talk',
        apiKey: 'k_runninghub',
        videoUrl: 'https://www.runninghub.cn/mock-input-video.mp4',
        audioUrl: 'https://www.runninghub.cn/mock-input-audio.mp3',
        rhLipSyncInputIndex: 1,
        rhVideoFrames: 20,
        rhVideoResolution: 0x400,
      });
      (assert.equal(generateVideo10.videoUrl, '/output/rh-lipsync-sse.mp4'),
        assert.equal(generateVideo10.sourceUrl, 'https://cdn.example.com/rh-lipsync-sse.mp4'),
        assert.equal(generateVideo10.localPath, 'output/rh-lipsync-sse.mp4'),
        assert.equal(generateVideo10.videos[0].localPath, 'output/rh-lipsync-sse.mp4'));
    } finally {
      ((globalThis.fetch = value138), (globalThis.setTimeout = handler11));
    }
  }));
