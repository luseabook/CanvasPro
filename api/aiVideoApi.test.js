import test from 'node:test';
import assert from 'node:assert/strict';
import { __test__, buildGenerateVideoRequest, generateVideo, resumeAsyncVideoTask } from './aiVideoApi.js';
(test('processVideoTaskResult should parse RunningHub array url into multi videos', () => {
  const _0x3ad94f = {
      code: 0,
      data: [{ url: ['https://cdn.example.com/a.mp4', 'https://cdn.example.com/b.mp4'] }],
    },
    _0xa1f2f2 = __test__.processVideoTaskResult(_0x3ad94f, 'runninghubwf');
  (assert.equal(_0xa1f2f2.isBatch, true),
    assert.ok(Array.isArray(_0xa1f2f2.videos)),
    assert.equal(_0xa1f2f2.videos.length, 2),
    assert.equal(_0xa1f2f2.videos[0].videoUrl, 'https://cdn.example.com/a.mp4'),
    assert.equal(_0xa1f2f2.videos[1].videoUrl, 'https://cdn.example.com/b.mp4'));
}),
  test('processVideoTaskResult should prefer manifest responseMapping result paths', () => {
    const _0x3a299c = { vendorEnvelope: { assets: [{ href: 'https://cdn.example.com/manifest-path.mp4' }] } },
      _0x10dd76 = __test__.processVideoTaskResult(_0x3a299c, 'apimart', {
        responseMapping: { resultPaths: ['vendorEnvelope.assets[].href'] },
      });
    assert.equal(_0x10dd76.videoUrl, 'https://cdn.example.com/manifest-path.mp4');
  }),
  test('processVideoTaskResult should parse Agnes official video_url mapping', () => {
    const _0x47c0b8 = {
        id: 'agnes-task-1',
        status: 'completed',
        video_url: 'https://storage.googleapis.com/agnes/video.mp4',
      },
      _0xfc7f71 = __test__.processVideoTaskResult(_0x47c0b8, 'agnes', {
        responseMapping: { resultPaths: ['video_url', 'output.video'] },
      });
    assert.equal(_0xfc7f71.videoUrl, 'https://storage.googleapis.com/agnes/video.mp4');
  }),
  test('processVideoTaskResult should parse RunningHub snake_case video result fields', () => {
    const _0x2d7ca1 = {
        code: 0,
        data: [
          {
            file_url: 'https://cdn.example.com/rh-video-file?id=abc',
            thumbnail_url: 'https://cdn.example.com/rh-video-file.jpg',
          },
        ],
      },
      _0x1b37b1 = __test__.processVideoTaskResult(_0x2d7ca1, 'runninghubwf');
    (assert.equal(_0x1b37b1.videoUrl, 'https://cdn.example.com/rh-video-file?id=abc'),
      assert.equal(_0x1b37b1.thumbUrl, 'https://cdn.example.com/rh-video-file.jpg'));
  }),
  test('processVideoTaskResult should parse RunningHub download_url video result fields', () => {
    const _0x5edf20 = {
        code: 0,
        data: { outputs: [{ download_url: 'https://cdn.example.com/rh-download-video?id=xyz' }] },
      },
      _0x295c00 = __test__.processVideoTaskResult(_0x5edf20, 'runninghubwf');
    assert.equal(_0x295c00.videoUrl, 'https://cdn.example.com/rh-download-video?id=xyz');
  }),
  test('processVideoTaskResult should prefer typed RunningHub video over audio url', () => {
    const _0x160b8d = {
        code: 0,
        data: [
          { type: 'audio', url: 'https://cdn.example.com/rh-lipsync-audio?id=abc' },
          { type: 'video', url: 'https://cdn.example.com/rh-lipsync-video?id=xyz' },
        ],
      },
      _0xb7f459 = __test__.processVideoTaskResult(_0x160b8d, 'runninghubwf');
    (assert.equal(_0xb7f459.videoUrl, 'https://cdn.example.com/rh-lipsync-video?id=xyz'),
      assert.equal(_0xb7f459.videos.length, 1));
  }),
  test('extractVideoUrls should ignore thumbnail-only objects when a video url exists', () => {
    const _0x41baf0 = __test__.extractVideoUrls({
      result: {
        videos: [
          {
            url: 'https://cdn.example.com/result-video.mp4',
            thumbnail_url: 'https://cdn.example.com/result-video.jpg',
          },
        ],
      },
    });
    assert.deepEqual(_0x41baf0, ['https://cdn.example.com/result-video.mp4']);
  }),
  test('buildGenerateVideoRequest should build Dreamina route-specific request', async () => {
    const _0x4d7395 = await buildGenerateVideoRequest({
      provider: 'dreamina',
      model: 'dreamina/3.5pro',
      prompt: 'season changes',
      dreaminaRouteMode: 'frames2video',
      inputUrls: ['/a.png', '/b.png'],
      duration: 6,
      resolution: '1080p',
    });
    (assert.equal(_0x4d7395.url, '/api/v2/dreamina/frames2video'),
      assert.equal(_0x4d7395.body.first, '/a.png'),
      assert.equal(_0x4d7395.body.last, '/b.png'),
      assert.equal(_0x4d7395.body.modelVersion, '3.5pro'));
  }),
  test('buildGenerateVideoRequest should normalize legacy seedance model to Dreamina', async () => {
    const _0xcbf3c0 = await buildGenerateVideoRequest({
      model: 'seedance-2.0-fast',
      prompt: 'two people talking',
      duration: 4,
    });
    (assert.equal(_0xcbf3c0.url, '/api/v2/dreamina/text2video'),
      assert.equal(_0xcbf3c0.body.modelVersion, 'seedance2.0fast'));
  }),
  test('buildGenerateVideoRequest should use BERNINI RunningHub video workflow manifest', async () => {
    const { clearApiConfig: _0x58af68 } = await import('./configApi.js');
    _0x58af68();
    const _0xb38b1 = globalThis.fetch;
    let _0x1ad8c3;
    try {
      ((globalThis.fetch = async (_0x51114a) => {
        if (String(_0x51114a) === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiKey: 'k_runninghub' } } });
        throw new Error('unexpected fetch url: ' + String(_0x51114a));
      }),
        (_0x1ad8c3 = await buildGenerateVideoRequest({
          provider: 'runninghubwf',
          model: 'runninghub/2062515720147259393',
          apiKey: 'k_runninghub',
          prompt: 'text to video',
          rhVideoResolution: 0x340,
          rhBerniniAspectRatio: '16:9',
        })));
    } finally {
      globalThis.fetch = _0xb38b1;
    }
    const _0xeada1a = (_0x1decc8, _0xae1db4) =>
      _0x1ad8c3.body.nodeInfoList.find(
        (_0x3c357b) => _0x3c357b.nodeId === _0x1decc8 && _0x3c357b.fieldName === _0xae1db4,
      );
    (assert.equal(_0x1ad8c3.url, '/api/v2/proxy/image'),
      assert.equal(_0x1ad8c3.isAsync, true),
      assert.equal(
        _0x1ad8c3.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/run/ai-app/2062515720147259393',
      ),
      assert.equal(_0x1ad8c3.body.instanceType, 'default'),
      assert.equal(_0xeada1a('34', 'value')?.fieldValue, '0'),
      assert.equal(_0xeada1a('17', 'value')?.fieldValue, '832'),
      assert.equal(_0xeada1a('18', 'value')?.fieldValue, '472'));
  }),
  test('buildGenerateVideoRequest should fail unregistered prefixed model without provider inference', async () => {
    await assert.rejects(
      () => buildGenerateVideoRequest({ model: 'apimart/unregistered-video-model', prompt: 'city lights' }),
      /Video model API manifest missing: apimart\/unregistered-video-model/,
    );
  }),
  test('buildGenerateVideoRequest should use APIMart video modelApi manifest', async () => {
    const { clearApiConfig: _0xa86836 } = await import('./configApi.js');
    _0xa86836();
    const _0x4d0180 = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x25dc26) => {
        if (String(_0x25dc26) === '/api/config')
          return makeJsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        throw new Error('unexpected fetch url: ' + String(_0x25dc26));
      };
      const _0x4b906c = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/doubao-seedance-2.0-fast',
        prompt: 'city lights',
        aspectRatio: '9:16',
        duration: 5,
      });
      (assert.equal(_0x4b906c.adapterTrace?.source, 'manifest'),
        assert.equal(
          _0x4b906c.adapterTrace?.executionId,
          'apimart.model-api.video.doubao-seedance-2-fast.v1',
        ),
        assert.equal(_0x4b906c.body.apiUrl, 'https://api.apimart.ai/v1/videos/generations'),
        assert.equal(_0x4b906c.body.model, 'doubao-seedance-2.0-fast'),
        assert.equal(_0x4b906c.body.size, '9:16'),
        assert.equal(
          _0x4b906c.taskPolling?.urlTemplate,
          'https://api.apimart.ai/v1/tasks/{taskId}?language=zh',
        ));
    } finally {
      globalThis.fetch = _0x4d0180;
    }
  }),
  test('buildGenerateVideoRequest should use APIMart domestic route for endpoint and polling', async () => {
    const { clearApiConfig: _0x36da3b } = await import('./configApi.js');
    _0x36da3b();
    const _0x3053d2 = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x4d6840) => {
        if (String(_0x4d6840) === '/api/config')
          return makeJsonResponse({ providers: { apimart: { routeId: 'domestic2', apiKey: 'k_apimart' } } });
        throw new Error('unexpected fetch url: ' + String(_0x4d6840));
      };
      const _0x19a69b = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/doubao-seedance-2.0-fast',
        prompt: 'city lights',
        aspectRatio: '9:16',
        duration: 5,
      });
      (assert.equal(_0x19a69b.body.apiUrl, 'https://api.aishuch.com/v1/videos/generations'),
        assert.equal(
          _0x19a69b.taskPolling?.urlTemplate,
          'https://api.aishuch.com/v1/tasks/{taskId}?language=zh',
        ));
    } finally {
      globalThis.fetch = _0x3053d2;
    }
  }),
  test('buildGenerateVideoRequest should pass APIMart Seedance 2.0 private avatar asset URLs', async () => {
    const { clearApiConfig: _0xc01e63 } = await import('./configApi.js');
    _0xc01e63();
    const _0x22f3d9 = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x97c0d1) => {
        if (String(_0x97c0d1) === '/api/config')
          return makeJsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        throw new Error('unexpected fetch url: ' + String(_0x97c0d1));
      };
      const _0x41501d = await buildGenerateVideoRequest({
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
      assert.deepEqual(_0x41501d.body.image_with_roles, [
        { url: 'asset://private-first', role: 'first_frame' },
        { url: 'asset://private-last', role: 'last_frame' },
      ]);
    } finally {
      globalThis.fetch = _0x22f3d9;
    }
  }),
  test('buildGenerateVideoRequest should use Volcengine Seedance 2.0 official task body', async () => {
    const { clearApiConfig: _0x56d71d } = await import('./configApi.js');
    _0x56d71d();
    const _0x547230 = globalThis.fetch,
      _0x329578 = [];
    try {
      globalThis.fetch = async (_0x29b49f, _0x750ca2 = {}) => {
        const _0xa5739b = String(_0x29b49f);
        if (_0xa5739b === '/api/config')
          return makeJsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_volcengine' },
            },
          });
        if (_0xa5739b === '/local/first.png')
          return makeBlobResponse(new Blob(['first'], { type: 'image/png' }), 200, 'image/png');
        if (_0xa5739b === '/local/last.png')
          return makeBlobResponse(new Blob(['last'], { type: 'image/png' }), 200, 'image/png');
        if (_0xa5739b.startsWith('/api/v2/proxy/upload?')) {
          const _0x3738ef = new URL('http://local' + _0xa5739b).searchParams.get('apiUrl');
          assert.equal(_0x3738ef, 'https://uguu.se/upload');
          const _0x40dd69 = Object.fromEntries(_0x750ca2.body.entries()),
            _0x5c9e42 = await _0x40dd69['files[]'].text();
          return (
            _0x329578.push(_0x5c9e42),
            makeJsonResponse({ url: 'https://uguu.example/' + _0x5c9e42 + '.png' })
          );
        }
        throw new Error('unexpected fetch url: ' + _0xa5739b);
      };
      const _0x3ab71d = await buildGenerateVideoRequest({
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
      (assert.deepEqual(_0x329578, ['first', 'last']),
        assert.equal(_0x3ab71d.adapterTrace?.source, 'manifest'),
        assert.equal(_0x3ab71d.adapterTrace?.executionId, 'volcengine.model-api.video.seedance-2.v1'),
        assert.equal(
          _0x3ab71d.body.apiUrl,
          'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks',
        ),
        assert.equal(_0x3ab71d.body.apiKey, 'k_volcengine'),
        assert.equal(_0x3ab71d.body.model, 'doubao-seedance-2-0-260128'),
        assert.deepEqual(_0x3ab71d.body.content, [
          { type: 'text', text: 'camera transition' },
          { type: 'image_url', image_url: { url: 'https://uguu.example/first.png' }, role: 'first_frame' },
          { type: 'image_url', image_url: { url: 'https://uguu.example/last.png' }, role: 'last_frame' },
        ]),
        assert.equal(_0x3ab71d.body.resolution, '1080p'),
        assert.equal(_0x3ab71d.body.ratio, '16:9'),
        assert.equal(_0x3ab71d.body.duration, 7),
        assert.equal(_0x3ab71d.body.generate_audio, false),
        assert.equal(_0x3ab71d.body.seed, 42),
        assert.equal(
          _0x3ab71d.taskPolling?.urlTemplate,
          'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/{taskId}',
        ));
    } finally {
      globalThis.fetch = _0x547230;
    }
  }),
  test('buildGenerateVideoRequest should infer Volcengine Seedance text from empty inputs', async () => {
    const { clearApiConfig: _0x5dade5 } = await import('./configApi.js');
    _0x5dade5();
    const _0x51cb9f = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x2a89b1) => {
        if (String(_0x2a89b1) === '/api/config')
          return makeJsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_volcengine' },
            },
          });
        throw new Error('unexpected fetch url: ' + String(_0x2a89b1));
      };
      const _0x34a08c = await buildGenerateVideoRequest({
        provider: 'volcengine',
        model: 'volcengine/seedance-2.0-fast',
        prompt: 'a quiet lake at sunrise',
      });
      (assert.equal(_0x34a08c.body.model, 'doubao-seedance-2-0-fast-260128'),
        assert.deepEqual(_0x34a08c.body.content, [{ type: 'text', text: 'a quiet lake at sunrise' }]),
        assert.equal(_0x34a08c.body.resolution, '720p'),
        assert.equal(_0x34a08c.body.ratio, 'adaptive'));
    } finally {
      globalThis.fetch = _0x51cb9f;
    }
  }),
  test('buildGenerateVideoRequest should use Volcengine Seedance 2.0 Mini backend model', async () => {
    const { clearApiConfig: _0x148ff2 } = await import('./configApi.js');
    _0x148ff2();
    const _0x3f895e = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x3e2f8d) => {
        if (String(_0x3e2f8d) === '/api/config')
          return makeJsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_volcengine' },
            },
          });
        throw new Error('unexpected fetch url: ' + String(_0x3e2f8d));
      };
      const _0xebad54 = await buildGenerateVideoRequest({
        provider: 'volcengine',
        model: 'volcengine/seedance-2.0-mini',
        prompt: 'a small paper boat on the sea',
      });
      (assert.equal(_0xebad54.adapterTrace?.source, 'manifest'),
        assert.equal(_0xebad54.adapterTrace?.executionId, 'volcengine.model-api.video.seedance-2-mini.v1'),
        assert.equal(
          _0xebad54.body.apiUrl,
          'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks',
        ),
        assert.equal(_0xebad54.body.model, 'doubao-seedance-2-0-mini-260615'),
        assert.deepEqual(_0xebad54.body.content, [{ type: 'text', text: 'a small paper boat on the sea' }]),
        assert.equal(_0xebad54.body.resolution, '720p'),
        assert.equal(_0xebad54.body.ratio, 'adaptive'));
    } finally {
      globalThis.fetch = _0x3f895e;
    }
  }),
  test('buildGenerateVideoRequest should infer Volcengine Seedance image from one first frame', async () => {
    const { clearApiConfig: _0x48ae31 } = await import('./configApi.js');
    _0x48ae31();
    const _0x16f6f1 = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x28f77c, _0x2dbad7 = {}) => {
        const _0x2db12f = String(_0x28f77c);
        if (_0x2db12f === '/api/config')
          return makeJsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_volcengine' },
            },
          });
        if (_0x2db12f === '/local/first.png')
          return makeBlobResponse(new Blob(['first'], { type: 'image/png' }), 200, 'image/png');
        if (_0x2db12f.startsWith('/api/v2/proxy/upload?')) {
          const _0x10e84b = new URL('http://local' + _0x2db12f).searchParams.get('apiUrl');
          assert.equal(_0x10e84b, 'https://uguu.se/upload');
          const _0x1528f8 = Object.fromEntries(_0x2dbad7.body.entries()),
            _0x2fa018 = await _0x1528f8['files[]'].text();
          return makeJsonResponse({ url: 'https://uguu.example/' + _0x2fa018 + '.png' });
        }
        throw new Error('unexpected fetch url: ' + _0x2db12f);
      };
      const _0x29bb5d = await buildGenerateVideoRequest({
        provider: 'volcengine',
        model: 'volcengine/seedance-2.0',
        prompt: 'make the subject smile',
        dreaminaRouteMode: 'frames2video',
        images: ['/local/first.png'],
        inputUrls: ['/local/first.png'],
      });
      assert.deepEqual(_0x29bb5d.body.content, [
        { type: 'text', text: 'make the subject smile' },
        { type: 'image_url', image_url: { url: 'https://uguu.example/first.png' }, role: 'first_frame' },
      ]);
    } finally {
      globalThis.fetch = _0x16f6f1;
    }
  }),
  test('buildGenerateVideoRequest should map Volcengine Seedance multimodal references', async () => {
    const { clearApiConfig: _0x25ff67 } = await import('./configApi.js');
    _0x25ff67();
    const _0x3c8e83 = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x348767, _0x116c1a = {}) => {
        const _0x19c192 = String(_0x348767);
        if (_0x19c192 === '/api/config')
          return makeJsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_volcengine' },
              apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
            },
          });
        if (_0x19c192 === '/local/ref.png')
          return makeBlobResponse(new Blob(['image'], { type: 'image/png' }), 200, 'image/png');
        if (_0x19c192 === '/local/ref.mp4')
          return makeBlobResponse(new Blob(['video'], { type: 'video/mp4' }), 200, 'video/mp4');
        if (_0x19c192 === '/local/ref.mp3')
          return makeBlobResponse(new Blob(['audio'], { type: 'audio/mpeg' }), 200, 'audio/mpeg');
        if (_0x19c192.startsWith('/api/v2/proxy/upload?')) {
          const _0x56582a = new URL('http://local' + _0x19c192).searchParams.get('apiUrl');
          assert.equal(_0x56582a, 'https://uguu.se/upload');
          const _0x367dca = Object.fromEntries(_0x116c1a.body.entries()),
            _0x2ddd4b = await _0x367dca['files[]'].text();
          return makeJsonResponse({ url: 'https://uguu.example/' + _0x2ddd4b + '.png' });
        }
        if (_0x19c192 === '/api/v2/proxy/apimart-upload') {
          const _0x456522 = Object.fromEntries(_0x116c1a.body.entries());
          (assert.equal(_0x456522.apiKey, 'k_apimart'),
            assert.equal(_0x456522.apiUrl, 'https://api.apimart.ai'));
          const _0x5e0d62 = await _0x456522.file.text();
          if (_0x5e0d62 === 'video')
            return (
              assert.equal(_0x456522.contentType, 'video/mp4'),
              assert.equal(_0x456522.fileExtension, 'mp4'),
              makeJsonResponse({ cdnUrl: 'https://cdn.apimart.ai/ref.mp4' })
            );
          if (_0x5e0d62 === 'audio')
            return (
              assert.equal(_0x456522.contentType, 'audio/mpeg'),
              assert.equal(_0x456522.fileExtension, 'mp3'),
              makeJsonResponse({ cdnUrl: 'https://cdn.apimart.ai/ref.mp3' })
            );
        }
        throw new Error('unexpected fetch url: ' + _0x19c192);
      };
      const _0x2e0c5a = await buildGenerateVideoRequest({
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
      (assert.equal(_0x2e0c5a.body.model, 'doubao-seedance-2-0-fast-260128'),
        assert.equal(_0x2e0c5a.body.resolution, '720p'),
        assert.equal(_0x2e0c5a.body.ratio, 'adaptive'),
        assert.deepEqual(_0x2e0c5a.body.content, [
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
      globalThis.fetch = _0x3c8e83;
    }
  }),
  test('buildGenerateVideoRequest should require APIMart key for local Volcengine Seedance video and audio inputs', async () => {
    const { clearApiConfig: _0x27671b } = await import('./configApi.js');
    _0x27671b();
    const _0x20405b = globalThis.fetch;
    try {
      ((globalThis.fetch = async (_0x30db6b) => {
        const _0x327e6b = String(_0x30db6b);
        if (_0x327e6b === '/api/config')
          return makeJsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_volcengine' },
              apimart: { apiUrl: 'https://api.apimart.ai', apiKey: '' },
            },
          });
        if (_0x327e6b === '/local/ref.mp4')
          return makeBlobResponse(new Blob(['video'], { type: 'video/mp4' }), 200, 'video/mp4');
        if (_0x327e6b === '/local/ref.mp3')
          return makeBlobResponse(new Blob(['audio'], { type: 'audio/mpeg' }), 200, 'audio/mpeg');
        throw new Error('unexpected fetch url: ' + _0x327e6b);
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
      globalThis.fetch = _0x20405b;
    }
  }),
  test('buildGenerateVideoRequest should map APIMart video API body fields per manifest', async () => {
    const { clearApiConfig: _0x2ec677 } = await import('./configApi.js');
    _0x2ec677();
    const _0x45dfb1 = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x88b32f) => {
        if (String(_0x88b32f) === '/api/config')
          return makeJsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        throw new Error('unexpected fetch url: ' + String(_0x88b32f));
      };
      const _0x37da18 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/grok-imagine-1.0',
        prompt: 'a dog running on a sunny beach',
      });
      (assert.equal(_0x37da18.body.model, 'grok-imagine-1.0-video-apimart'),
        assert.equal(_0x37da18.body.size, '16:9'),
        assert.equal(_0x37da18.body.duration, 6),
        assert.equal(_0x37da18.body.quality, '480p'),
        assert.equal('image_urls' in _0x37da18.body, false),
        assert.equal('generation_type' in _0x37da18.body, false));
      const _0x31bbc5 = Array.from(
          { length: 8 },
          (_0x26a3d2, _0x56d31a) => 'https://cdn.apimart.ai/grok-ref-' + (_0x56d31a + 1) + '.png',
        ),
        _0x2938f6 = await buildGenerateVideoRequest({
          provider: 'apimart',
          model: 'apimart/grok-imagine-1.0',
          prompt: 'turn these references into a natural video',
          inputUrls: _0x31bbc5,
          generationParams: { aspectRatio: '2:3', duration: 45, quality: '720p' },
        });
      (assert.equal(_0x2938f6.adapterTrace?.source, 'manifest'),
        assert.equal(_0x2938f6.adapterTrace?.executionId, 'apimart.model-api.video.grok-imagine-1.v1'),
        assert.equal(_0x2938f6.body.model, 'grok-imagine-1.0-video-apimart'),
        assert.equal(_0x2938f6.body.size, '2:3'),
        assert.equal(_0x2938f6.body.duration, 30),
        assert.equal(_0x2938f6.body.quality, '720p'),
        assert.deepEqual(_0x2938f6.body.image_urls, _0x31bbc5.slice(0, 7)));
      const _0x398f33 = await buildGenerateVideoRequest({
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
      (assert.equal(_0x398f33.adapterTrace?.source, 'manifest'),
        assert.equal(_0x398f33.adapterTrace?.executionId, 'apimart.model-api.video.omni-flash-ext.v1'),
        assert.equal(_0x398f33.body.model, 'Omni-Flash-Ext'),
        assert.equal(_0x398f33.body.duration, 10),
        assert.equal(_0x398f33.body.resolution, '4k'),
        assert.equal(_0x398f33.body.aspect_ratio, '9:16'),
        assert.deepEqual(_0x398f33.body.image_urls, [
          'https://cdn.apimart.ai/omni-scene.png',
          'https://cdn.apimart.ai/omni-character.png',
          'https://cdn.apimart.ai/omni-product.png',
        ]));
      const _0x5c0050 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/omni-flash-ext',
        prompt: 'a girl is dancing happily in a sunny garden',
        generationParams: { duration: 7, resolution: '1080p' },
      });
      (assert.equal(_0x5c0050.body.model, 'Omni-Flash-Ext'),
        assert.equal(_0x5c0050.body.duration, 6),
        assert.equal(_0x5c0050.body.resolution, '1080p'),
        assert.equal(_0x5c0050.body.aspect_ratio, '16:9'),
        assert.equal('image_urls' in _0x5c0050.body, false));
      const _0x25511b = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/omni-flash-ext',
        prompt: 'use the source motion and keep the product identity',
        inputUrls: ['https://cdn.apimart.ai/omni-product.png'],
        videos: ['https://cdn.apimart.ai/omni-motion.mp4'],
        generationParams: { duration: 10, resolution: '1080p' },
      });
      (assert.equal(_0x25511b.body.model, 'Omni-Flash-Ext'),
        assert.deepEqual(_0x25511b.body.image_urls, ['https://cdn.apimart.ai/omni-product.png']),
        assert.deepEqual(_0x25511b.body.video_urls, ['https://cdn.apimart.ai/omni-motion.mp4']),
        assert.equal('duration' in _0x25511b.body, false));
      const _0xdcd626 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/omni-flash-ext',
        prompt: 'follow this motion reference',
        videos: ['https://cdn.apimart.ai/omni-motion-only.mp4'],
        generationParams: { duration: 8 },
      });
      (assert.deepEqual(_0xdcd626.body.video_urls, ['https://cdn.apimart.ai/omni-motion-only.mp4']),
        assert.equal('image_urls' in _0xdcd626.body, false),
        assert.equal('duration' in _0xdcd626.body, false),
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
      const _0x2821ba = await buildGenerateVideoRequest({
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
      (assert.equal(_0x2821ba.body.model, 'veo3.1-quality'),
        assert.equal(_0x2821ba.body.aspect_ratio, '9:16'),
        assert.equal(_0x2821ba.body.generation_type, 'frame'),
        assert.deepEqual(_0x2821ba.body.image_urls, [
          'https://cdn.apimart.ai/veo-first.png',
          'https://cdn.apimart.ai/veo-last.png',
        ]),
        assert.equal(_0x2821ba.body.resolution, '1080p'),
        assert.equal(_0x2821ba.body.duration, 8),
        assert.equal(_0x2821ba.body.enable_gif, false),
        assert.equal('official_fallback' in _0x2821ba.body, false),
        assert.equal('quality' in _0x2821ba.body, false));
      const _0x20efa8 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/veo3-fast',
        prompt: 'city lights',
        generationParams: { aspectRatio: '自适应', resolution: '720p', duration: 8 },
      });
      (assert.equal(_0x20efa8.body.aspect_ratio, '16:9'),
        assert.equal(_0x20efa8.body.model, 'veo3.1-fast'),
        assert.equal('generation_type' in _0x20efa8.body, false));
      const _0x21a1c6 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/veo3-fast',
        prompt: 'city lights',
        generationParams: { mode: 'bad-mode', generation_type: 'frame' },
      });
      (assert.equal(_0x21a1c6.body.model, 'veo3.1-fast'),
        assert.equal('generation_type' in _0x21a1c6.body, false),
        assert.equal('image_urls' in _0x21a1c6.body, false));
      const _0x23fb2d = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/veo3-fast',
        prompt: 'single image video',
        inputUrls: ['https://cdn.apimart.ai/veo-single.png'],
        generationParams: { mode: 'fast', generation_type: 'frame' },
      });
      (assert.equal(_0x23fb2d.body.model, 'veo3.1-fast'),
        assert.equal(_0x23fb2d.body.generation_type, 'frame'),
        assert.deepEqual(_0x23fb2d.body.image_urls, ['https://cdn.apimart.ai/veo-single.png']));
      const _0x4727fc = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/veo3-fast',
        prompt: 'reference mode without image',
        generationParams: { mode: 'fast', generation_type: 'reference' },
      });
      (assert.equal(_0x4727fc.body.model, 'veo3.1-fast'),
        assert.equal('generation_type' in _0x4727fc.body, false),
        assert.equal('image_urls' in _0x4727fc.body, false),
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
      const _0xfeccfd = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/veo3-fast',
        prompt: 'fixed slots',
        inputUrlsBySlot: {
          firstFrame: 'https://cdn.apimart.ai/veo-first-slot.png',
          lastFrame: 'https://cdn.apimart.ai/veo-last-slot.png',
        },
        generationParams: { mode: 'fast', generation_type: 'frame', aspectRatio: '16:9' },
      });
      (assert.equal(_0xfeccfd.body.model, 'veo3.1-fast'),
        assert.equal(_0xfeccfd.body.generation_type, 'frame'),
        assert.deepEqual(_0xfeccfd.body.image_urls, [
          'https://cdn.apimart.ai/veo-first-slot.png',
          'https://cdn.apimart.ai/veo-last-slot.png',
        ]));
      const _0x51c887 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/veo3-fast',
        prompt: 'gif high resolution',
        generationParams: { resolution: '1080p', enable_gif: true },
      });
      (assert.equal(_0x51c887.body.resolution, '720p'), assert.equal(_0x51c887.body.enable_gif, true));
      const _0x5bd77e = await buildGenerateVideoRequest({
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
      (assert.equal(_0x5bd77e.body.model, 'MiniMax-Hailuo-02'),
        assert.equal(_0x5bd77e.body.resolution, '1080p'),
        assert.equal(_0x5bd77e.body.duration, 5),
        assert.equal(_0x5bd77e.body.prompt_optimizer, false),
        assert.equal(_0x5bd77e.body.fast_pretreatment, true),
        assert.equal(_0x5bd77e.body.watermark, true),
        assert.equal(_0x5bd77e.body.first_frame_image, 'https://cdn.apimart.ai/hailuo-first.png'),
        assert.equal(_0x5bd77e.body.last_frame_image, 'https://cdn.apimart.ai/hailuo-last.png'));
      const _0x28e5f3 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/hailuo-02',
        prompt: '一只可爱的猫咪在草地上奔跑',
        generationParams: { duration: 10, resolution: '768p' },
      });
      (assert.equal(_0x28e5f3.body.model, 'MiniMax-Hailuo-02'),
        assert.equal(_0x28e5f3.body.duration, 10),
        assert.equal(_0x28e5f3.body.prompt_optimizer, true),
        assert.equal(_0x28e5f3.body.fast_pretreatment, false),
        assert.equal(_0x28e5f3.body.watermark, false),
        assert.equal('first_frame_image' in _0x28e5f3.body, false));
      const _0x31c744 = await buildGenerateVideoRequest({
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
      (assert.equal(_0x31c744.body.model, 'MiniMax-Hailuo-2.3'),
        assert.equal(_0x31c744.body.resolution, '1080p'),
        assert.equal(_0x31c744.body.duration, 6),
        assert.equal(_0x31c744.body.prompt_optimizer, false),
        assert.equal(_0x31c744.body.fast_pretreatment, true),
        assert.equal(_0x31c744.body.watermark, true),
        assert.equal(_0x31c744.body.first_frame_image, 'https://cdn.apimart.ai/hailuo-23-first.png'),
        assert.equal('last_frame_image' in _0x31c744.body, false));
      const _0x4793e5 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/minimax-hailuo-2.3',
        prompt: '首帧中的小猫向镜头跑来',
        inputUrls: ['https://cdn.apimart.ai/hailuo-23-fast-first.png'],
        generationParams: { mode: 'fast', duration: 10, resolution: '768p' },
      });
      (assert.equal(_0x4793e5.body.model, 'MiniMax-Hailuo-2.3-Fast'),
        assert.equal(_0x4793e5.body.duration, 10),
        assert.equal(_0x4793e5.body.first_frame_image, 'https://cdn.apimart.ai/hailuo-23-fast-first.png'),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'apimart',
            model: 'apimart/minimax-hailuo-2.3',
            prompt: 'fast requires a first frame',
            generationParams: { mode: 'fast' },
          }),
          /Hailuo 2\.3 Fast requires first_frame_image/,
        ));
      const _0x448257 = await buildGenerateVideoRequest({
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
      (assert.equal(_0x448257.body.model, 'happyhorse-1.0'),
        assert.equal('size' in _0x448257.body, false),
        assert.equal(_0x448257.body.seed, 42),
        assert.equal(_0x448257.body.watermark, true),
        assert.equal(_0x448257.body.first_frame_image, 'https://cdn.apimart.ai/ref-1.png'),
        assert.equal('image_urls' in _0x448257.body, false),
        assert.equal('video_url' in _0x448257.body, false));
      const _0x23cbcd = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/happyhorse-1.0',
        prompt: 'slotted horse',
        inputUrlsBySlot: { firstFrame: 'https://cdn.apimart.ai/head.png' },
        generationParams: { happyhorse_mode: 'image' },
      });
      (assert.equal(_0x23cbcd.body.first_frame_image, 'https://cdn.apimart.ai/head.png'),
        assert.equal('image_urls' in _0x23cbcd.body, false));
      const _0x5001bd = await buildGenerateVideoRequest({
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
      (assert.deepEqual(_0x5001bd.body.image_urls, [
        'https://cdn.apimart.ai/ref-1.png',
        'https://cdn.apimart.ai/ref-2.png',
      ]),
        assert.equal(_0x5001bd.body.size, '16:9'),
        assert.equal('first_frame_image' in _0x5001bd.body, false));
      const _0x1fa18e = await buildGenerateVideoRequest({
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
      (assert.equal('size' in _0x1fa18e.body, false),
        assert.equal(_0x1fa18e.body.first_frame_image, 'https://cdn.apimart.ai/ref-1.png'));
      const _0x357472 = await buildGenerateVideoRequest({
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
      (assert.equal(_0x357472.body.video_url, 'https://cdn.apimart.ai/source.mp4'),
        assert.deepEqual(_0x357472.body.image_urls, ['https://cdn.apimart.ai/style-ref.png']),
        assert.equal(_0x357472.body.audio_setting, 'origin'),
        assert.equal('duration' in _0x357472.body, false),
        assert.equal('size' in _0x357472.body, false));
      const _0x330ae8 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/happyhorse-1.0',
        prompt: 'default image mode',
        inputUrls: ['https://cdn.apimart.ai/default-ref.png'],
      });
      assert.equal(_0x330ae8.body.first_frame_image, 'https://cdn.apimart.ai/default-ref.png');
      const _0x2ea583 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/happyhorse-1.0',
        prompt: 'text only horse',
      });
      (assert.equal('first_frame_image' in _0x2ea583.body, false),
        assert.equal('image_urls' in _0x2ea583.body, false),
        assert.equal('video_url' in _0x2ea583.body, false),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'apimart',
            model: 'apimart/happyhorse-1.0',
            prompt: '',
            generationParams: { happyhorse_mode: 'auto' },
          }),
          /prompt is required/,
        ));
      const _0x27508a = await buildGenerateVideoRequest({
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
      (assert.deepEqual(_0x27508a.body.image_urls, ['https://cdn.apimart.ai/ref-image.png']),
        assert.equal(_0x27508a.body.audio_url, 'https://cdn.apimart.ai/ref-audio.mp3'),
        assert.equal('size' in _0x27508a.body, false),
        assert.equal(_0x27508a.body.negative_prompt, 'low quality'),
        assert.equal(_0x27508a.body.prompt_extend, false),
        assert.equal(_0x27508a.body.watermark, true),
        assert.equal(_0x27508a.body.seed, 7));
      const _0x1cc076 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/wan2.7',
        prompt: 'slot ordered frames',
        inputUrlsBySlot: {
          lastFrame: 'https://cdn.apimart.ai/wan-last.png',
          firstFrame: 'https://cdn.apimart.ai/wan-first.png',
        },
        generationParams: { resolution: '1080P', duration: 6 },
      });
      (assert.deepEqual(_0x1cc076.body.image_urls, [
        'https://cdn.apimart.ai/wan-first.png',
        'https://cdn.apimart.ai/wan-last.png',
      ]),
        assert.equal('size' in _0x1cc076.body, false));
      const _0x181a60 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/wan2.7',
        prompt: 'reference character and motion',
        inputUrls: ['https://cdn.apimart.ai/ref-character.png'],
        videos: ['https://cdn.apimart.ai/ref-motion.mp4'],
        audios: ['https://cdn.apimart.ai/ref-voice.mp3'],
        generationParams: { wan27_mode: 'reference', resolution: '1080P', duration: 8 },
      });
      (assert.equal(_0x181a60.body.model, 'wan2.7-r2v'),
        assert.deepEqual(_0x181a60.body.image_with_roles, [
          {
            url: 'https://cdn.apimart.ai/ref-character.png',
            role: 'reference_image',
            reference_voice: 'https://cdn.apimart.ai/ref-voice.mp3',
          },
        ]),
        assert.deepEqual(_0x181a60.body.video_urls, ['https://cdn.apimart.ai/ref-motion.mp4']),
        assert.equal('image_urls' in _0x181a60.body, false),
        assert.equal('audio_url' in _0x181a60.body, false));
      const _0x418c71 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/wan2.7',
        prompt: 'reference motion',
        videos: ['https://cdn.apimart.ai/ref-motion.mp4'],
        generationParams: { wan27_mode: 'reference', resolution: '1080P', duration: 8 },
      });
      (assert.equal(_0x418c71.body.model, 'wan2.7-r2v'),
        assert.deepEqual(_0x418c71.body.video_urls, ['https://cdn.apimart.ai/ref-motion.mp4']),
        assert.equal('image_with_roles' in _0x418c71.body, false),
        assert.equal('audio_url' in _0x418c71.body, false));
      const _0x196f3a = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/wan2.7',
        prompt: 'change the outfit',
        videos: ['https://cdn.apimart.ai/original.mp4', 'https://cdn.apimart.ai/reference.mp4'],
        generationParams: { wan27_mode: 'edit', resolution: '1080P', duration: 0 },
      });
      (assert.equal(_0x196f3a.body.model, 'wan2.7-videoedit'),
        assert.deepEqual(_0x196f3a.body.video_urls, [
          'https://cdn.apimart.ai/original.mp4',
          'https://cdn.apimart.ai/reference.mp4',
        ]),
        assert.equal('image_urls' in _0x196f3a.body, false));
      const _0x7e7aeb = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/wan2.7',
        prompt: 'text only',
        generationParams: { aspectRatio: '1:1', resolution: '1080P', duration: 6 },
      });
      (assert.equal(_0x7e7aeb.body.size, '1:1'),
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
      const _0x259e0e = await buildGenerateVideoRequest({
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
      (assert.equal(_0x259e0e.body.mode, '4k'),
        assert.equal(_0x259e0e.body.aspect_ratio, '9:16'),
        assert.equal(_0x259e0e.body.audio, true),
        assert.equal(_0x259e0e.body.watermark, true),
        assert.equal('seed' in _0x259e0e.body, false),
        assert.equal(_0x259e0e.body.negative_prompt, 'blur'),
        assert.deepEqual(_0x259e0e.body.image_urls, ['https://cdn.apimart.ai/kling-ref.png']),
        assert.equal('multi_shot' in _0x259e0e.body, false));
      const _0x546e4b = await buildGenerateVideoRequest({
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
      (assert.deepEqual(_0x546e4b.body.image_urls, [
        'https://cdn.apimart.ai/kling-first.png',
        'https://cdn.apimart.ai/kling-last.png',
      ]),
        assert.equal(_0x546e4b.body.audio, true),
        assert.equal('multi_shot' in _0x546e4b.body, false));
      const _0x176aaa = await buildGenerateVideoRequest({
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
      (assert.equal(_0x176aaa.body.model, 'kling-v3-omni'),
        assert.equal(_0x176aaa.body.mode, 'pro'),
        assert.equal(_0x176aaa.body.aspect_ratio, '9:16'),
        assert.equal(_0x176aaa.body.audio, true),
        assert.deepEqual(_0x176aaa.body.image_with_roles, [
          { url: 'https://cdn.apimart.ai/omni-first.png', role: 'first_frame' },
          { url: 'https://cdn.apimart.ai/omni-last.png', role: 'last_frame' },
        ]),
        assert.equal('image_urls' in _0x176aaa.body, false),
        assert.equal('multi_shot' in _0x176aaa.body, false),
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
      const _0x21df02 = await buildGenerateVideoRequest({
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
      (assert.equal(_0x21df02.body.mode, '4k'),
        assert.deepEqual(_0x21df02.body.image_with_roles, [
          { url: 'https://cdn.apimart.ai/omni-ref.png', role: 'reference' },
        ]),
        assert.deepEqual(_0x21df02.body.video_list, [
          {
            video_url: 'https://cdn.apimart.ai/omni-feature.mov',
            refer_type: 'feature',
            keep_original_sound: 'no',
          },
        ]),
        assert.equal('audio' in _0x21df02.body, false),
        assert.equal('image_urls' in _0x21df02.body, false));
      const _0x57595d = await buildGenerateVideoRequest({
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
      (assert.deepEqual(_0x57595d.body.video_list, [
        { video_url: 'https://cdn.apimart.ai/omni-base.mp4', refer_type: 'base', keep_original_sound: 'no' },
      ]),
        assert.equal(_0x57595d.body.mode, 'std'),
        assert.equal('image_urls' in _0x57595d.body, false),
        assert.equal('image_with_roles' in _0x57595d.body, false),
        assert.equal('audio' in _0x57595d.body, false),
        assert.equal('duration' in _0x57595d.body, false),
        assert.equal('aspect_ratio' in _0x57595d.body, false),
        await assert.rejects(
          buildGenerateVideoRequest({
            provider: 'apimart',
            model: 'apimart/kling-v3-omni',
            prompt: 'missing reference',
            generationParams: { kling_v3_omni_mode: 'reference' },
          }),
          /Kling V3 Omni reference mode requires image or video input/,
        ));
      const _0x44e123 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/kling-video-o1',
        prompt: '让@图片1走向@图片2',
        inputUrls: ['https://cdn.apimart.ai/o1-ref-1.png', 'https://cdn.apimart.ai/o1-ref-2.png'],
        generationParams: { resolution: 'pro', aspectRatio: '16:9', duration: 5 },
      });
      (assert.equal(_0x44e123.body.model, 'kling-video-o1'),
        assert.equal(_0x44e123.body.mode, 'pro'),
        assert.equal(_0x44e123.body.prompt, '让<<<image_1>>>走向<<<image_2>>>'),
        assert.deepEqual(_0x44e123.body.image_urls, [
          'https://cdn.apimart.ai/o1-ref-1.png',
          'https://cdn.apimart.ai/o1-ref-2.png',
        ]),
        assert.equal('video_list' in _0x44e123.body, false));
      const _0x59ab32 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/kling-video-o1',
        prompt: 'use @图片1 as subject reference',
        inputUrls: ['https://cdn.apimart.ai/o1-feature-ref.png'],
        videos: ['https://cdn.apimart.ai/o1-feature.mp4'],
        klingO1VideoRole: 'feature',
        generationParams: { resolution: 'std', aspectRatio: '9:16', duration: 10 },
      });
      (assert.equal(_0x59ab32.body.prompt, 'use <<<image_1>>> as subject reference'),
        assert.deepEqual(_0x59ab32.body.image_urls, ['https://cdn.apimart.ai/o1-feature-ref.png']),
        assert.deepEqual(_0x59ab32.body.video_list, [
          {
            video_url: 'https://cdn.apimart.ai/o1-feature.mp4',
            refer_type: 'feature',
            keep_original_sound: 'no',
          },
        ]),
        assert.equal(_0x59ab32.body.duration, 10),
        assert.equal(_0x59ab32.body.aspect_ratio, '9:16'));
      const _0x582483 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/kling-video-o1',
        prompt: 'edit source video',
        videos: ['https://cdn.apimart.ai/o1-base.mp4'],
        klingO1VideoRole: 'base',
        generationParams: { resolution: 'pro', aspectRatio: '1:1', duration: 10, keep_original_sound: true },
      });
      (assert.deepEqual(_0x582483.body.video_list, [
        { video_url: 'https://cdn.apimart.ai/o1-base.mp4', refer_type: 'base', keep_original_sound: 'yes' },
      ]),
        assert.equal('image_urls' in _0x582483.body, false),
        assert.equal('duration' in _0x582483.body, false),
        assert.equal('aspect_ratio' in _0x582483.body, false),
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
      const _0x3f1d2f = await buildGenerateVideoRequest({
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
      (assert.equal(_0x3f1d2f.body.model, 'viduq3'),
        assert.equal(_0x3f1d2f.body.aspect_ratio, '16:9'),
        assert.equal('audio' in _0x3f1d2f.body, false),
        assert.deepEqual(_0x3f1d2f.body.image_urls, ['https://cdn.apimart.ai/vidu-ref-a.png']));
      const _0x532bcf = await buildGenerateVideoRequest({
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
      (assert.equal(_0x532bcf.body.model, 'viduq3-mix'),
        assert.equal(_0x532bcf.body.resolution, '720p'),
        assert.equal(_0x532bcf.body.duration, 1));
      const _0x53d98e = await buildGenerateVideoRequest({
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
      (assert.equal(_0x53d98e.body.model, 'viduq3-pro'),
        assert.equal(_0x53d98e.body.resolution, '1080p'),
        assert.equal(_0x53d98e.body.audio, true),
        assert.equal('aspect_ratio' in _0x53d98e.body, false),
        assert.deepEqual(_0x53d98e.body.image_urls, ['https://cdn.apimart.ai/vidu-ref.png']));
      const _0x421904 = await buildGenerateVideoRequest({
        provider: 'apimart',
        model: 'apimart/viduq3',
        prompt: 'text only default',
      });
      (assert.equal(_0x421904.body.model, 'viduq3-turbo'),
        assert.equal(_0x421904.body.duration, 5),
        assert.equal(_0x421904.body.resolution, '720p'),
        assert.equal(_0x421904.body.audio, true),
        assert.equal('image_urls' in _0x421904.body, false),
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
      globalThis.fetch = _0x45dfb1;
    }
  }));
function makeJsonResponse(_0x112014, _0x4d6714 = 200) {
  return {
    ok: _0x4d6714 >= 200 && _0x4d6714 < 0x12c,
    status: _0x4d6714,
    headers: {
      get(_0x561206) {
        return String(_0x561206 || '').toLowerCase() === 'content-type' ? 'application/json' : null;
      },
    },
    json: async () => _0x112014,
    text: async () => JSON.stringify(_0x112014),
  };
}
function makeTextResponse(_0x38bbf8, _0x3c0716 = 200, _0x2e2411 = 'text/plain') {
  return {
    ok: _0x3c0716 >= 200 && _0x3c0716 < 0x12c,
    status: _0x3c0716,
    headers: {
      get(_0x1a7d91) {
        return String(_0x1a7d91 || '').toLowerCase() === 'content-type' ? _0x2e2411 : null;
      },
    },
    json: async () => JSON.parse(_0x38bbf8),
    text: async () => _0x38bbf8,
  };
}
function makeBlobResponse(_0x43a9d0, _0x19cd56 = 200, _0x588af9 = 'video/mp4') {
  return {
    ok: _0x19cd56 >= 200 && _0x19cd56 < 0x12c,
    status: _0x19cd56,
    headers: {
      get(_0x35896e) {
        return String(_0x35896e || '').toLowerCase() === 'content-type' ? _0x588af9 : null;
      },
    },
    blob: async () => _0x43a9d0,
    json: async () => ({}),
    text: async () => '',
  };
}
(test('buildGenerateVideoRequest should map RunningHub Kling O1 mixed endpoints', async () => {
  const { clearApiConfig: _0x282b05 } = await import('./configApi.js');
  _0x282b05();
  const _0x1af526 = globalThis.fetch;
  try {
    globalThis.fetch = async (_0x519df2) => {
      if (String(_0x519df2) === '/api/config')
        return makeJsonResponse({
          providers: {
            runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
          },
        });
      throw new Error('unexpected fetch url: ' + String(_0x519df2));
    };
    const _0x70e243 = await buildGenerateVideoRequest({
      provider: 'runninghub',
      model: 'runninghub-model/kling-video-o1',
      prompt: 'city lights',
      generationParams: { resolution: 'std', aspectRatio: '16:9', duration: 5 },
    });
    (assert.equal(_0x70e243.body.apiKey, 'k_runninghub_model'),
      assert.equal(
        _0x70e243.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/kling-video-o1/text-to-video',
      ),
      assert.equal(_0x70e243.body.prompt, 'city lights'),
      assert.equal(_0x70e243.body.mode, 'std'),
      assert.equal(_0x70e243.body.aspectRatio, '16:9'),
      assert.equal(_0x70e243.body.duration, '5'),
      assert.equal('model' in _0x70e243.body, false),
      assert.equal(_0x70e243.useOpenapiQuery, true));
    const _0x59bc82 = await buildGenerateVideoRequest({
      provider: 'runninghub',
      model: 'runninghub-model/kling-video-o1',
      prompt: 'adaptive ratio',
      generationParams: { aspectRatio: '自适应' },
    });
    assert.equal(_0x59bc82.body.aspectRatio, '16:9');
    const _0x3873d5 = await buildGenerateVideoRequest({
      provider: 'runninghub',
      model: 'runninghub-model/kling-video-o1',
      prompt: '让 @图片1 慢慢转身',
      inputUrls: ['https://www.runninghub.cn/assets/o1-first.png'],
      generationParams: { aspectRatio: '9:16', duration: 10 },
    });
    (assert.equal(
      _0x3873d5.body.apiUrl,
      'https://www.runninghub.cn/openapi/v2/kling-video-o1/image-to-video',
    ),
      assert.equal(_0x3873d5.body.prompt, '让 <<<image_1>>> 慢慢转身'),
      assert.equal(_0x3873d5.body.firstImageUrl, 'https://www.runninghub.cn/assets/o1-first.png'),
      assert.equal(_0x3873d5.body.duration, '10'),
      assert.equal('lastImageUrl' in _0x3873d5.body, false));
    const _0x3e3e47 = await buildGenerateVideoRequest({
      provider: 'runninghub',
      model: 'runninghub-model/kling-video-o1',
      prompt: '从 @图片1 过渡到 @图片2',
      inputUrlsBySlot: {
        firstFrame: 'https://www.runninghub.cn/assets/o1-first.png',
        lastFrame: 'https://www.runninghub.cn/assets/o1-last.png',
      },
      generationParams: { aspectRatio: '1:1' },
    });
    (assert.equal(_0x3e3e47.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/kling-video-o1/start-to-end'),
      assert.equal(_0x3e3e47.body.prompt, '从 <<<image_1>>> 过渡到 <<<image_2>>>'),
      assert.equal(_0x3e3e47.body.firstImageUrl, 'https://www.runninghub.cn/assets/o1-first.png'),
      assert.equal(_0x3e3e47.body.lastImageUrl, 'https://www.runninghub.cn/assets/o1-last.png'));
    const _0x5a3ae4 = await buildGenerateVideoRequest({
      provider: 'runninghub',
      model: 'runninghub-model/kling-video-o1',
      prompt: '参考 @图片1 和 @视频1 的动作',
      inputUrlsBySlot: { referenceImage: 'https://www.runninghub.cn/assets/o1-ref.png' },
      videos: ['https://www.runninghub.cn/assets/o1-ref.mp4'],
      generationParams: { rh_kling_o1_generation_mode: 'reference', keep_original_sound: true },
    });
    (assert.equal(
      _0x5a3ae4.body.apiUrl,
      'https://www.runninghub.cn/openapi/v2/kling-video-o1-std/refrence-to-video',
    ),
      assert.deepEqual(_0x5a3ae4.body.imageUrls, ['https://www.runninghub.cn/assets/o1-ref.png']),
      assert.equal(_0x5a3ae4.body.videoUrl, 'https://www.runninghub.cn/assets/o1-ref.mp4'),
      assert.equal(_0x5a3ae4.body.keepOriginalSound, true),
      assert.equal('firstImageUrl' in _0x5a3ae4.body, false));
    const _0x5493c9 = await buildGenerateVideoRequest({
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
    (assert.equal(
      _0x5493c9.body.apiUrl,
      'https://www.runninghub.cn/openapi/v2/kling-video-o1-std/edit-video',
    ),
      assert.equal(_0x5493c9.body.mode, 'std'),
      assert.equal(_0x5493c9.body.prompt, 'remove background people'),
      assert.equal(_0x5493c9.body.videoUrl, 'https://www.runninghub.cn/assets/o1-edit.mp4'),
      assert.equal(_0x5493c9.body.keepOriginalSound, true),
      assert.equal('aspectRatio' in _0x5493c9.body, false),
      assert.equal('duration' in _0x5493c9.body, false),
      assert.equal('imageUrls' in _0x5493c9.body, false),
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
    globalThis.fetch = _0x1af526;
  }
}),
  test('buildGenerateVideoRequest should map RunningHub Hailuo 02 mixed endpoints', async () => {
    const { clearApiConfig: _0x2d7ad5 } = await import('./configApi.js');
    _0x2d7ad5();
    const _0x3d50eb = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x4325dd) => {
        if (String(_0x4325dd) === '/api/config')
          return makeJsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
            },
          });
        throw new Error('unexpected fetch url: ' + String(_0x4325dd));
      };
      const _0x432ac3 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo-02',
        prompt: 'city lights',
        generationParams: { rh_hailuo_02_quality: 'standard', duration: 10, enablePromptExpansion: false },
      });
      (assert.equal(_0x432ac3.body.apiKey, 'k_runninghub_model'),
        assert.equal(
          _0x432ac3.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/t2v-standard',
        ),
        assert.equal(_0x432ac3.body.prompt, 'city lights'),
        assert.equal(_0x432ac3.body.duration, '10'),
        assert.equal(_0x432ac3.body.enablePromptExpansion, false),
        assert.equal('model' in _0x432ac3.body, false),
        assert.equal(_0x432ac3.useOpenapiQuery, true));
      const _0xe33120 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo-02',
        prompt: '首帧过渡到尾帧',
        inputUrlsBySlot: {
          firstFrame: 'https://www.runninghub.cn/assets/hailuo-first.png',
          lastFrame: 'https://www.runninghub.cn/assets/hailuo-last.png',
        },
        generationParams: { rh_hailuo_02_quality: 'standard', duration: 6 },
      });
      (assert.equal(
        _0xe33120.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/i2v-standard',
      ),
        assert.equal(_0xe33120.body.firstImageUrl, 'https://www.runninghub.cn/assets/hailuo-first.png'),
        assert.equal(_0xe33120.body.lastImageUrl, 'https://www.runninghub.cn/assets/hailuo-last.png'),
        assert.equal(_0xe33120.body.duration, '6'));
      const _0x31c373 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo-02',
        prompt: 'pro text video',
        generationParams: { rh_hailuo_02_quality: 'pro', duration: 10 },
      });
      (assert.equal(_0x31c373.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/t2v-pro'),
        assert.equal('duration' in _0x31c373.body, false));
      const _0x49dae5 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo02',
        prompt: 'pro image video',
        inputUrls: ['https://www.runninghub.cn/assets/hailuo-pro-first.png'],
        generationParams: { rh_hailuo_02_quality: 'pro' },
      });
      (assert.equal(_0x49dae5.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/i2v-pro'),
        assert.equal(_0x49dae5.body.firstImageUrl, 'https://www.runninghub.cn/assets/hailuo-pro-first.png'),
        assert.equal('lastImageUrl' in _0x49dae5.body, false),
        assert.equal('duration' in _0x49dae5.body, false));
      const _0xf672ec = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo-02',
        prompt: 'fast image video',
        inputUrlsBySlot: { firstFrame: 'https://www.runninghub.cn/assets/hailuo-fast-first.png' },
        generationParams: { rh_hailuo_02_quality: 'fast', duration: 10 },
      });
      (assert.equal(_0xf672ec.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/fast'),
        assert.equal(_0xf672ec.body.imageUrl, 'https://www.runninghub.cn/assets/hailuo-fast-first.png'),
        assert.equal('firstImageUrl' in _0xf672ec.body, false),
        assert.equal(_0xf672ec.body.duration, '10'),
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
      globalThis.fetch = _0x3d50eb;
    }
  }),
  test('buildGenerateVideoRequest should map RunningHub Hailuo 2.3 mixed endpoints', async () => {
    const { clearApiConfig: _0x35d7fc } = await import('./configApi.js');
    _0x35d7fc();
    const _0xc7fa22 = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x4221c0) => {
        if (String(_0x4221c0) === '/api/config')
          return makeJsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
            },
          });
        throw new Error('unexpected fetch url: ' + String(_0x4221c0));
      };
      const _0x388dc9 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo-2.3',
        prompt: 'city lights',
        generationParams: { rh_hailuo_23_quality: 'standard', duration: 10, enablePromptExpansion: false },
      });
      (assert.equal(_0x388dc9.body.apiKey, 'k_runninghub_model'),
        assert.equal(
          _0x388dc9.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/t2v-standard',
        ),
        assert.equal(_0x388dc9.body.duration, '10'),
        assert.equal(_0x388dc9.body.enablePromptExpansion, false),
        assert.equal('model' in _0x388dc9.body, false),
        assert.equal('aspectRatio' in _0x388dc9.body, false),
        assert.equal(_0x388dc9.useOpenapiQuery, true));
      const _0x2276cb = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo-2.3',
        prompt: '让首帧动起来',
        inputUrlsBySlot: { firstFrame: 'https://www.runninghub.cn/assets/hailuo-23-first.png' },
        generationParams: { rh_hailuo_23_quality: 'standard', duration: 6 },
      });
      (assert.equal(
        _0x2276cb.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/i2v-standard',
      ),
        assert.equal(_0x2276cb.body.imageUrl, 'https://www.runninghub.cn/assets/hailuo-23-first.png'),
        assert.equal(_0x2276cb.body.duration, '6'),
        assert.equal('firstImageUrl' in _0x2276cb.body, false),
        assert.equal('lastImageUrl' in _0x2276cb.body, false));
      const _0x3409f8 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo-2.3',
        prompt: 'pro text video',
        generationParams: { rh_hailuo_23_quality: 'pro', duration: 10 },
      });
      (assert.equal(_0x3409f8.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/t2v-pro'),
        assert.equal('duration' in _0x3409f8.body, false));
      const _0x28fdb4 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo23',
        prompt: 'pro image video',
        inputUrls: ['https://www.runninghub.cn/assets/hailuo-23-pro-first.png'],
        generationParams: { rh_hailuo_23_quality: 'pro' },
      });
      (assert.equal(
        _0x28fdb4.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/image-to-video-pro',
      ),
        assert.equal(_0x28fdb4.body.imageUrl, 'https://www.runninghub.cn/assets/hailuo-23-pro-first.png'),
        assert.equal('firstImageUrl' in _0x28fdb4.body, false),
        assert.equal('duration' in _0x28fdb4.body, false));
      const _0x53f902 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo-2.3',
        prompt: 'fast image video',
        inputUrlsBySlot: { firstFrame: 'https://www.runninghub.cn/assets/hailuo-23-fast-first.png' },
        generationParams: { rh_hailuo_23_quality: 'fast', duration: 10 },
      });
      (assert.equal(
        _0x53f902.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3-fast/image-to-video',
      ),
        assert.equal(_0x53f902.body.duration, '10'),
        assert.equal(_0x53f902.body.imageUrl, 'https://www.runninghub.cn/assets/hailuo-23-fast-first.png'),
        assert.equal('firstImageUrl' in _0x53f902.body, false));
      const _0x530e96 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/hailuo-2.3',
        prompt: 'fast pro image video',
        inputUrlsBySlot: { firstFrame: 'https://www.runninghub.cn/assets/hailuo-23-fast-pro-first.png' },
        generationParams: { rh_hailuo_23_quality: 'fastPro', duration: 10 },
      });
      (assert.equal(
        _0x530e96.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3-fast-pro/image-to-video',
      ),
        assert.equal(_0x530e96.body.duration, '6'),
        assert.equal(
          _0x530e96.body.imageUrl,
          'https://www.runninghub.cn/assets/hailuo-23-fast-pro-first.png',
        ),
        assert.equal('firstImageUrl' in _0x530e96.body, false),
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
      globalThis.fetch = _0xc7fa22;
    }
  }),
  test('buildGenerateVideoRequest should map RunningHub Veo3 mixed endpoints', async () => {
    const { clearApiConfig: _0x5ce584 } = await import('./configApi.js');
    _0x5ce584();
    const _0x6a497b = globalThis.fetch;
    let _0x519d0f = 0;
    try {
      globalThis.fetch = async (_0x4def6b) => {
        if (String(_0x4def6b) === '/api/config')
          return makeJsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
            },
          });
        if (String(_0x4def6b) === 'https://source.local/veo3-dup.png')
          return {
            ok: true,
            status: 200,
            headers: { get: () => 'image/png' },
            blob: async () => new Blob(['veo3-dup'], { type: 'image/png' }),
            text: async () => '',
          };
        if (String(_0x4def6b).includes('/api/v2/proxy/upload'))
          return (
            (_0x519d0f += 1),
            makeJsonResponse({
              data: { download_url: 'https://www.runninghub.cn/uploaded/veo3-dup-' + _0x519d0f + '.png' },
            })
          );
        throw new Error('unexpected fetch url: ' + String(_0x4def6b));
      };
      const _0x14e841 = await buildGenerateVideoRequest({
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
      (assert.equal(_0x14e841.body.apiKey, 'k_runninghub_model'),
        assert.equal(
          _0x14e841.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/text-to-video',
        ),
        assert.equal(_0x14e841.body.prompt, 'low fast text'),
        assert.equal(_0x14e841.body.resolution, '720p'),
        assert.equal(_0x14e841.body.duration, '8'),
        assert.equal(_0x14e841.body.aspectRatio, '16:9'),
        assert.equal('model' in _0x14e841.body, false),
        assert.equal('generateAudio' in _0x14e841.body, false),
        assert.equal(_0x14e841.useOpenapiQuery, true));
      const _0x2e9eff = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/veo3.1',
        prompt: 'low image',
        inputUrls: ['https://www.runninghub.cn/assets/veo3-first.png'],
        generationParams: { rh_veo3_channel: 'lowCost', mode: 'fast' },
      });
      (assert.equal(
        _0x2e9eff.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/image-to-video',
      ),
        assert.deepEqual(_0x2e9eff.body.imageUrls, ['https://www.runninghub.cn/assets/veo3-first.png']));
      const _0x340b01 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/veo3.1',
        prompt: 'low image duplicate slot',
        inputUrls: ['https://source.local/veo3-dup.png'],
        inputUrlsBySlot: { firstFrame: 'https://source.local/veo3-dup.png' },
        generationParams: { rh_veo3_channel: 'lowCost', mode: 'fast' },
      });
      (assert.equal(
        _0x340b01.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/image-to-video',
      ),
        assert.deepEqual(_0x340b01.body.imageUrls, ['https://www.runninghub.cn/uploaded/veo3-dup-1.png']),
        assert.equal(_0x519d0f, 1),
        assert.equal('firstFrameUrl' in _0x340b01.body, false),
        assert.equal('lastFrameUrl' in _0x340b01.body, false));
      const _0x8d261a = await buildGenerateVideoRequest({
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
        _0x8d261a.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro/start-end-to-video',
      ),
        assert.equal(_0x8d261a.body.firstFrameUrl, 'https://www.runninghub.cn/assets/veo3-first.png'),
        assert.equal(_0x8d261a.body.lastFrameUrl, 'https://www.runninghub.cn/assets/veo3-last.png'),
        assert.equal(_0x8d261a.body.aspectRatio, '9:16'));
      const _0x468aac = await buildGenerateVideoRequest({
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
        _0x468aac.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/text-to-video',
      ),
        assert.equal(_0x468aac.body.resolution, '4k'),
        assert.equal(_0x468aac.body.duration, '6'),
        assert.equal(_0x468aac.body.generateAudio, true));
      const _0x23f8ed = await buildGenerateVideoRequest({
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
        _0x23f8ed.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/reference-to-video',
      ),
        assert.deepEqual(_0x23f8ed.body.imageUrls, [
          'https://www.runninghub.cn/assets/veo3-ref-a.png',
          'https://www.runninghub.cn/assets/veo3-ref-b.png',
        ]),
        assert.equal('duration' in _0x23f8ed.body, false),
        assert.equal(_0x23f8ed.body.aspectRatio, '16:9'));
      const _0x356f47 = await buildGenerateVideoRequest({
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
        _0x356f47.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/video-extend',
      ),
        assert.equal(_0x356f47.body.video, 'https://www.runninghub.cn/assets/veo3-extend.mp4'),
        assert.equal(_0x356f47.body.resolution, '1080p'),
        assert.equal('prompt' in _0x356f47.body, false),
        assert.equal('duration' in _0x356f47.body, false),
        assert.equal('aspectRatio' in _0x356f47.body, false),
        assert.equal('generateAudio' in _0x356f47.body, false));
      const _0x4faa62 = await buildGenerateVideoRequest({
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
        _0x4faa62.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-lite-official/start-end-to-video',
      ),
        assert.equal(_0x4faa62.body.firstImageUrl, 'https://www.runninghub.cn/assets/veo3-lite-first.png'),
        assert.equal(_0x4faa62.body.lastImageUrl, 'https://www.runninghub.cn/assets/veo3-lite-last.png'),
        assert.equal('duration' in _0x4faa62.body, false),
        assert.equal('generateAudio' in _0x4faa62.body, false),
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
      globalThis.fetch = _0x6a497b;
    }
  }),
  test('buildGenerateVideoRequest should map RunningHub Kling V3.0 mixed endpoints', async () => {
    const { clearApiConfig: _0x345548 } = await import('./configApi.js');
    _0x345548();
    const _0xd4ed1f = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x451621) => {
        if (String(_0x451621) === '/api/config')
          return makeJsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
            },
          });
        throw new Error('unexpected fetch url: ' + String(_0x451621));
      };
      const _0x4eff10 = await buildGenerateVideoRequest({
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
      (assert.equal(_0x4eff10.body.apiKey, 'k_runninghub_model'),
        assert.equal(
          _0x4eff10.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/kling-v3.0-std/text-to-video',
        ),
        assert.equal(_0x4eff10.body.prompt, 'kling v3 text'),
        assert.equal(_0x4eff10.body.aspectRatio, '16:9'),
        assert.equal(_0x4eff10.body.duration, '3'),
        assert.equal(_0x4eff10.body.sound, true),
        assert.equal(_0x4eff10.body.cfgScale, 0.8),
        assert.equal(_0x4eff10.body.multiShot, false),
        assert.equal(_0x4eff10.body.shotType, 'intelligence'),
        assert.equal(_0x4eff10.body.negativePrompt, 'blur'),
        assert.equal('model' in _0x4eff10.body, false),
        assert.equal(_0x4eff10.useOpenapiQuery, true));
      const _0x24d11b = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/kling-v3.0',
        prompt: 'start to end',
        inputUrlsBySlot: {
          firstFrame: 'https://www.runninghub.cn/assets/kling-first.png',
          lastFrame: 'https://www.runninghub.cn/assets/kling-last.png',
        },
        generationParams: { resolution: 'pro', aspectRatio: '1:1', duration: 15 },
      });
      (assert.equal(
        _0x24d11b.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/kling-v3.0-pro/image-to-video',
      ),
        assert.equal(_0x24d11b.body.firstImageUrl, 'https://www.runninghub.cn/assets/kling-first.png'),
        assert.equal(_0x24d11b.body.lastImageUrl, 'https://www.runninghub.cn/assets/kling-last.png'),
        assert.equal('aspectRatio' in _0x24d11b.body, false));
      const _0x125e2c = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/kling-v30',
        prompt: 'kling v3 4k text',
        generationParams: { resolution: '4k', aspectRatio: '9:16', duration: 15 },
      });
      (assert.equal(_0x125e2c.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/kling-v3-4k/text-to-video'),
        assert.equal(_0x125e2c.body.duration, '15'),
        assert.equal(_0x125e2c.body.aspectRatio, '9:16'));
      const _0x2c6b7c = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/kling-v3',
        prompt: 'kling v3 4k image',
        inputUrlsBySlot: { firstFrame: 'https://www.runninghub.cn/assets/kling-4k.png' },
        generationParams: { resolution: '4k', aspectRatio: '自适应' },
      });
      (assert.equal(_0x2c6b7c.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/kling-v3-4k/image-to-video'),
        assert.equal(_0x2c6b7c.body.imageUrl, 'https://www.runninghub.cn/assets/kling-4k.png'),
        assert.equal('firstImageUrl' in _0x2c6b7c.body, false),
        assert.equal('aspectRatio' in _0x2c6b7c.body, false),
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
      globalThis.fetch = _0xd4ed1f;
    }
  }),
  test('buildGenerateVideoRequest should map RunningHub Kling O3 mixed endpoints', async () => {
    const { clearApiConfig: _0x4020d8 } = await import('./configApi.js');
    _0x4020d8();
    const _0x480040 = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x322e0d) => {
        if (String(_0x322e0d) === '/api/config')
          return makeJsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
            },
          });
        throw new Error('unexpected fetch url: ' + String(_0x322e0d));
      };
      const _0x3a447a = await buildGenerateVideoRequest({
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
      (assert.equal(_0x3a447a.body.apiKey, 'k_runninghub_model'),
        assert.equal(
          _0x3a447a.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/text-to-video',
        ),
        assert.equal(_0x3a447a.body.prompt, 'kling o3 text'),
        assert.equal(_0x3a447a.body.aspectRatio, '16:9'),
        assert.equal(_0x3a447a.body.duration, '3'),
        assert.equal(_0x3a447a.body.sound, true),
        assert.equal(_0x3a447a.body.multiShot, false),
        assert.equal(_0x3a447a.body.shotType, 'customize'),
        assert.equal('model' in _0x3a447a.body, false),
        assert.equal(_0x3a447a.useOpenapiQuery, true));
      const _0x2aa453 = await buildGenerateVideoRequest({
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
        _0x2aa453.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/image-to-video',
      ),
        assert.equal(_0x2aa453.body.firstImageUrl, 'https://www.runninghub.cn/assets/o3-first.png'),
        assert.equal(_0x2aa453.body.lastImageUrl, 'https://www.runninghub.cn/assets/o3-last.png'),
        assert.equal('aspectRatio' in _0x2aa453.body, false));
      const _0x539853 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/kling-o3',
        prompt: 'kling o3 4k text',
        generationParams: { resolution: '4k', aspectRatio: '9:16', duration: 15 },
      });
      (assert.equal(
        _0x539853.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/text-to-video',
      ),
        assert.equal(_0x539853.body.duration, '15'),
        assert.equal(_0x539853.body.aspectRatio, '9:16'));
      const _0x2c4afd = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/kling-o3',
        prompt: 'kling o3 4k image',
        inputUrlsBySlot: { firstFrame: 'https://www.runninghub.cn/assets/o3-4k.png' },
        generationParams: { resolution: '4k', aspectRatio: '自适应' },
      });
      (assert.equal(
        _0x2c4afd.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/image-to-video',
      ),
        assert.equal(_0x2c4afd.body.firstImageUrl, 'https://www.runninghub.cn/assets/o3-4k.png'),
        assert.equal('aspectRatio' in _0x2c4afd.body, false));
      const _0xe70d82 = await buildGenerateVideoRequest({
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
        _0xe70d82.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/reference-to-video',
      ),
        assert.deepEqual(_0xe70d82.body.imageUrls, ['https://www.runninghub.cn/assets/o3-ref.png']),
        assert.equal(_0xe70d82.body.videoUrl, 'https://www.runninghub.cn/assets/o3-ref.mp4'),
        assert.equal(_0xe70d82.body.keepOriginalSound, true),
        assert.equal(_0xe70d82.body.aspectRatio, '16:9'),
        assert.equal(_0xe70d82.body.duration, '5'),
        assert.equal(_0xe70d82.body.sound, false),
        assert.equal('shotType' in _0xe70d82.body, false));
      const _0x59c2d7 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/kling-o3',
        prompt: 'o3 4k reference',
        inputUrlsBySlot: { referenceImage: 'https://www.runninghub.cn/assets/o3-4k-ref.png' },
        generationParams: { resolution: '4k', kling_v3_omni_mode: 'reference', shotType: 'customize' },
      });
      (assert.equal(
        _0x59c2d7.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/reference-to-video',
      ),
        assert.equal(_0x59c2d7.body.shotType, 'customize'));
      const _0x2ff826 = await buildGenerateVideoRequest({
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
      (assert.equal(
        _0x2ff826.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/video-edit',
      ),
        assert.equal(_0x2ff826.body.videoUrl, 'https://www.runninghub.cn/assets/o3-edit.mp4'),
        assert.deepEqual(_0x2ff826.body.imageUrls, ['https://www.runninghub.cn/assets/o3-edit-ref.png']),
        assert.equal(_0x2ff826.body.keepOriginalSound, true),
        assert.equal('duration' in _0x2ff826.body, false),
        assert.equal('sound' in _0x2ff826.body, false),
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
      globalThis.fetch = _0x480040;
    }
  }),
  test('buildGenerateVideoRequest should map RunningHub Seedance 2.0 mixed endpoints', async () => {
    const { clearApiConfig: _0x6af3e4 } = await import('./configApi.js');
    _0x6af3e4();
    const _0x16b00e = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x34e798) => {
        if (String(_0x34e798) === '/api/config')
          return makeJsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
            },
          });
        throw new Error('unexpected fetch url: ' + String(_0x34e798));
      };
      const _0x28782d = await buildGenerateVideoRequest({
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
      (assert.equal(_0x28782d.body.apiKey, 'k_runninghub_model'),
        assert.equal(
          _0x28782d.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/text-to-video',
        ),
        assert.equal(_0x28782d.body.prompt, 'seedance text'),
        assert.equal(_0x28782d.body.resolution, '4k'),
        assert.equal(_0x28782d.body.duration, '15'),
        assert.equal(_0x28782d.body.ratio, '16:9'),
        assert.equal(_0x28782d.body.generateAudio, true),
        assert.equal(_0x28782d.body.webSearch, true),
        assert.equal(_0x28782d.body.returnLastFrame, false),
        assert.equal(_0x28782d.body.seed, 42),
        assert.equal('model' in _0x28782d.body, false),
        assert.equal('firstFrameUrl' in _0x28782d.body, false),
        assert.equal('imageUrls' in _0x28782d.body, false),
        assert.equal('conversionSlots' in _0x28782d.body, false),
        assert.equal(_0x28782d.useOpenapiQuery, true));
      const _0x16955d = await buildGenerateVideoRequest({
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
        _0x16955d.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0/image-to-video',
      ),
        assert.equal(_0x16955d.body.resolution, 'native1080p'),
        assert.equal(_0x16955d.body.duration, '4'),
        assert.equal(_0x16955d.body.ratio, '21:9'),
        assert.equal(_0x16955d.body.generateAudio, false),
        assert.equal(_0x16955d.body.firstFrameUrl, 'https://www.runninghub.cn/assets/seedance-first.png'),
        assert.equal(_0x16955d.body.lastFrameUrl, 'https://www.runninghub.cn/assets/seedance-last.png'),
        assert.equal(_0x16955d.body.realPersonMode, true),
        assert.equal(_0x16955d.body.returnLastFrame, false),
        assert.deepEqual(_0x16955d.body.conversionSlots, ['all']),
        assert.equal('webSearch' in _0x16955d.body, false),
        assert.equal('imageUrls' in _0x16955d.body, false));
      const _0x42f647 = await buildGenerateVideoRequest({
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
        _0x42f647.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/multimodal-video',
      ),
        assert.deepEqual(_0x42f647.body.imageUrls, [
          'https://www.runninghub.cn/assets/seedance-ref.png',
          'https://www.runninghub.cn/assets/seedance-ref-2.png',
        ]),
        assert.deepEqual(_0x42f647.body.videoUrls, ['https://www.runninghub.cn/assets/seedance-ref.mp4']),
        assert.deepEqual(_0x42f647.body.audioUrls, ['https://www.runninghub.cn/assets/seedance-ref.mp3']),
        assert.equal(_0x42f647.body.ratio, '3:4'),
        assert.equal(_0x42f647.body.generateAudio, false),
        assert.equal('firstFrameUrl' in _0x42f647.body, false),
        assert.equal('webSearch' in _0x42f647.body, false),
        assert.equal('conversionSlots' in _0x42f647.body, false),
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
      globalThis.fetch = _0x16b00e;
    }
  }),
  test('buildGenerateVideoRequest should map RunningHub HappyHorse 1.0 mixed endpoints', async () => {
    const { clearApiConfig: _0x51daf6 } = await import('./configApi.js');
    _0x51daf6();
    const _0x23cc47 = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x55980c) => {
        if (String(_0x55980c) === '/api/config')
          return makeJsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
            },
          });
        throw new Error('unexpected fetch url: ' + String(_0x55980c));
      };
      const _0x1ed09c = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/happyhorse-1.0',
        prompt: 'happyhorse text',
        generationParams: { resolution: '1080P', aspectRatio: '自适应', duration: 16, seed: '42' },
      });
      (assert.equal(_0x1ed09c.body.apiKey, 'k_runninghub_model'),
        assert.equal(
          _0x1ed09c.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/text-to-video',
        ),
        assert.equal(_0x1ed09c.body.prompt, 'happyhorse text'),
        assert.equal(_0x1ed09c.body.resolution, '1080p'),
        assert.equal(_0x1ed09c.body.duration, '15'),
        assert.equal(_0x1ed09c.body.aspectRatio, '16:9'),
        assert.equal(_0x1ed09c.body.seed, 42),
        assert.equal('model' in _0x1ed09c.body, false),
        assert.equal('audioSetting' in _0x1ed09c.body, false),
        assert.equal(_0x1ed09c.useOpenapiQuery, true));
      const _0xbcbb0a = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/happyhorse',
        prompt: 'happyhorse image',
        inputUrlsBySlot: { firstFrame: 'https://www.runninghub.cn/assets/happyhorse-first.png' },
        generationParams: { happyhorse_mode: 'image', resolution: '720P', aspectRatio: '1:1', duration: 3 },
      });
      (assert.equal(
        _0xbcbb0a.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/image-to-video',
      ),
        assert.equal(_0xbcbb0a.body.imageUrl, 'https://www.runninghub.cn/assets/happyhorse-first.png'),
        assert.equal(_0xbcbb0a.body.resolution, '720p'),
        assert.equal(_0xbcbb0a.body.duration, '3'),
        assert.equal('aspectRatio' in _0xbcbb0a.body, false),
        assert.equal('imageUrls' in _0xbcbb0a.body, false));
      const _0x3ec45c = await buildGenerateVideoRequest({
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
        _0x3ec45c.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/reference-to-video',
      ),
        assert.deepEqual(_0x3ec45c.body.imageUrls, [
          'https://www.runninghub.cn/assets/happyhorse-ref.png',
          'https://www.runninghub.cn/assets/happyhorse-ref-2.png',
        ]),
        assert.equal(_0x3ec45c.body.aspectRatio, '3:4'),
        assert.equal('imageUrl' in _0x3ec45c.body, false));
      const _0x2c8fbc = await buildGenerateVideoRequest({
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
        _0x2c8fbc.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/video-edit',
      ),
        assert.equal(_0x2c8fbc.body.videoUrl, 'https://www.runninghub.cn/assets/happyhorse-source.mp4'),
        assert.deepEqual(_0x2c8fbc.body.imageUrls, [
          'https://www.runninghub.cn/assets/happyhorse-edit-ref.png',
        ]),
        assert.equal(_0x2c8fbc.body.audioSetting, 'origin'),
        assert.equal('duration' in _0x2c8fbc.body, false),
        assert.equal('aspectRatio' in _0x2c8fbc.body, false));
      const _0x3e26bd = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/happyhorse-1.0',
        prompt: 'default image mode',
        inputUrls: ['https://www.runninghub.cn/assets/happyhorse-default.png'],
      });
      (assert.equal(
        _0x3e26bd.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/image-to-video',
      ),
        assert.equal(_0x3e26bd.body.imageUrl, 'https://www.runninghub.cn/assets/happyhorse-default.png'));
      const _0x44d6c5 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/happyhorse-1.0',
        prompt: 'text only happyhorse',
      });
      (assert.equal(
        _0x44d6c5.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/text-to-video',
      ),
        assert.equal('imageUrl' in _0x44d6c5.body, false),
        assert.equal('imageUrls' in _0x44d6c5.body, false),
        assert.equal('videoUrl' in _0x44d6c5.body, false));
    } finally {
      globalThis.fetch = _0x23cc47;
    }
  }),
  test('buildGenerateVideoRequest should map RunningHub Wan2.7 mixed endpoints', async () => {
    const { clearApiConfig: _0x388abd } = await import('./configApi.js');
    _0x388abd();
    const _0x968c9b = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x4ff6ae) => {
        if (String(_0x4ff6ae) === '/api/config')
          return makeJsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
            },
          });
        throw new Error('unexpected fetch url: ' + String(_0x4ff6ae));
      };
      const _0x1a63b7 = await buildGenerateVideoRequest({
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
      (assert.equal(_0x1a63b7.body.apiKey, 'k_runninghub_model'),
        assert.equal(
          _0x1a63b7.body.apiUrl,
          'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/text-to-video',
        ),
        assert.equal(_0x1a63b7.body.prompt, 'wan text'),
        assert.equal(_0x1a63b7.body.resolution, '1080P'),
        assert.equal(_0x1a63b7.body.duration, '5'),
        assert.equal(_0x1a63b7.body.aspectRatio, '16:9'),
        assert.equal(_0x1a63b7.body.promptExtend, false),
        assert.equal(_0x1a63b7.body.negativePrompt, 'blur'),
        assert.equal('model' in _0x1a63b7.body, false),
        assert.equal(_0x1a63b7.useOpenapiQuery, true));
      const _0x1bab06 = await buildGenerateVideoRequest({
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
        _0x1bab06.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/image-to-video',
      ),
        assert.equal(_0x1bab06.body.firstImageUrl, 'https://www.runninghub.cn/assets/wan-first.png'),
        assert.equal(_0x1bab06.body.lastImageUrl, 'https://www.runninghub.cn/assets/wan-last.png'),
        assert.equal('aspectRatio' in _0x1bab06.body, false));
      const _0x441807 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/wan2.7',
        prompt: 'continue video',
        videos: ['https://www.runninghub.cn/assets/wan-source.mp4'],
        audios: ['https://www.runninghub.cn/assets/wan-audio.mp3'],
        generationParams: { wan27_mode: 'video', duration: 15, negative_prompt: 'low quality' },
      });
      (assert.equal(
        _0x441807.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/video-extend',
      ),
        assert.equal(_0x441807.body.videoUrl, 'https://www.runninghub.cn/assets/wan-source.mp4'),
        assert.equal(_0x441807.body.audioUrl, 'https://www.runninghub.cn/assets/wan-audio.mp3'),
        assert.equal(_0x441807.body.negativePrompt, 'low quality'));
      const _0x2ed82b = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/wan2.7',
        prompt: 'reference video',
        inputUrlsBySlot: { referenceImage: 'https://www.runninghub.cn/assets/wan-ref.png' },
        videos: ['https://www.runninghub.cn/assets/wan-ref.mp4'],
        generationParams: { wan27_mode: 'reference', aspectRatio: '9:16' },
      });
      (assert.equal(
        _0x2ed82b.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/reference-to-video',
      ),
        assert.deepEqual(_0x2ed82b.body.imageUrls, ['https://www.runninghub.cn/assets/wan-ref.png']),
        assert.deepEqual(_0x2ed82b.body.videoUrls, ['https://www.runninghub.cn/assets/wan-ref.mp4']),
        assert.equal(_0x2ed82b.body.aspectRatio, '9:16'));
      const _0x59ef56 = await buildGenerateVideoRequest({
        provider: 'runninghub',
        model: 'runninghub-model/wan2.7',
        prompt: 'edit video',
        inputUrlsBySlot: { editRefImage: 'https://www.runninghub.cn/assets/wan-edit-ref.png' },
        videos: ['https://www.runninghub.cn/assets/wan-original.mp4'],
        generationParams: { wan27_mode: 'edit', duration: 0 },
      });
      (assert.equal(_0x59ef56.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/video-edit'),
        assert.equal(_0x59ef56.body.videoUrl, 'https://www.runninghub.cn/assets/wan-original.mp4'),
        assert.deepEqual(_0x59ef56.body.imageUrls, ['https://www.runninghub.cn/assets/wan-edit-ref.png']),
        assert.equal(_0x59ef56.body.duration, '0'),
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
      globalThis.fetch = _0x968c9b;
    }
  }),
  test('buildGenerateVideoRequest should not duplicate RunningHub slot images into generic inputs', async () => {
    const { clearApiConfig: _0x59a8da } = await import('./configApi.js');
    _0x59a8da();
    const _0x170f55 = globalThis.fetch;
    let _0x4ff466 = 0;
    try {
      globalThis.fetch = async (_0x237810) => {
        const _0x355ced = String(_0x237810);
        if (_0x355ced === '/api/config')
          return makeJsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
            },
          });
        if (_0x355ced.startsWith('https://source.local/rh-slot-dup-'))
          return {
            ok: true,
            status: 200,
            headers: { get: () => 'image/png' },
            blob: async () => new Blob([_0x355ced], { type: 'image/png' }),
            text: async () => '',
          };
        if (_0x355ced.includes('/api/v2/proxy/upload'))
          return (
            (_0x4ff466 += 1),
            makeJsonResponse({
              data: { download_url: 'https://www.runninghub.cn/uploaded/rh-slot-dup-' + _0x4ff466 + '.png' },
            })
          );
        throw new Error('unexpected fetch url: ' + _0x355ced);
      };
      const _0x8e0484 = [
        {
          name: 'kling-o1',
          payload: { model: 'runninghub-model/kling-video-o1', generationParams: { aspectRatio: '9:16' } },
          expect: (_0x23fb65, _0x2e9fb4) => {
            (assert.equal(
              _0x23fb65.apiUrl,
              'https://www.runninghub.cn/openapi/v2/kling-video-o1/image-to-video',
            ),
              assert.equal(_0x23fb65.firstImageUrl, _0x2e9fb4),
              assert.equal('lastImageUrl' in _0x23fb65, false));
          },
        },
        {
          name: 'hailuo-02',
          payload: {
            model: 'runninghub-model/hailuo-02',
            generationParams: { rh_hailuo_02_quality: 'standard' },
          },
          expect: (_0x409618, _0x307f89) => {
            (assert.equal(
              _0x409618.apiUrl,
              'https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/i2v-standard',
            ),
              assert.equal(_0x409618.firstImageUrl, _0x307f89),
              assert.equal('lastImageUrl' in _0x409618, false));
          },
        },
        {
          name: 'hailuo-23',
          payload: {
            model: 'runninghub-model/hailuo-2.3',
            generationParams: { rh_hailuo_23_quality: 'standard' },
          },
          expect: (_0x33cd3b, _0x4fc102) => {
            (assert.equal(
              _0x33cd3b.apiUrl,
              'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/i2v-standard',
            ),
              assert.equal(_0x33cd3b.imageUrl, _0x4fc102),
              assert.equal('firstImageUrl' in _0x33cd3b, false),
              assert.equal('lastImageUrl' in _0x33cd3b, false));
          },
        },
        {
          name: 'kling-v3-4k',
          payload: { model: 'runninghub-model/kling-v3', generationParams: { resolution: '4k' } },
          expect: (_0x286249, _0x2e0496) => {
            (assert.equal(
              _0x286249.apiUrl,
              'https://www.runninghub.cn/openapi/v2/kling-v3-4k/image-to-video',
            ),
              assert.equal(_0x286249.imageUrl, _0x2e0496),
              assert.equal('firstImageUrl' in _0x286249, false),
              assert.equal('lastImageUrl' in _0x286249, false));
          },
        },
        {
          name: 'kling-o3-4k',
          payload: { model: 'runninghub-model/kling-o3', generationParams: { resolution: '4k' } },
          expect: (_0x57f19e, _0x15ce72) => {
            (assert.equal(
              _0x57f19e.apiUrl,
              'https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/image-to-video',
            ),
              assert.equal(_0x57f19e.firstImageUrl, _0x15ce72),
              assert.equal('lastImageUrl' in _0x57f19e, false));
          },
        },
        {
          name: 'seedance-2',
          payload: {
            model: 'runninghub-model/seedance-2.0',
            generationParams: { rh_seedance_2_mode: 'image2video' },
          },
          expect: (_0x39ad18, _0x155f2f) => {
            (assert.equal(
              _0x39ad18.apiUrl,
              'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/image-to-video',
            ),
              assert.equal(_0x39ad18.firstFrameUrl, _0x155f2f),
              assert.equal('lastFrameUrl' in _0x39ad18, false));
          },
        },
        {
          name: 'happyhorse',
          payload: {
            model: 'runninghub-model/happyhorse-1.0',
            generationParams: { happyhorse_mode: 'image' },
          },
          expect: (_0x59579e, _0x46dea3) => {
            (assert.equal(
              _0x59579e.apiUrl,
              'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/image-to-video',
            ),
              assert.equal(_0x59579e.imageUrl, _0x46dea3),
              assert.equal('imageUrls' in _0x59579e, false));
          },
        },
        {
          name: 'wan-27',
          payload: { model: 'runninghub-model/wan2.7', generationParams: { wan27_mode: 'image' } },
          expect: (_0x38f64d, _0x17afbc) => {
            (assert.equal(
              _0x38f64d.apiUrl,
              'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/image-to-video',
            ),
              assert.equal(_0x38f64d.firstImageUrl, _0x17afbc),
              assert.equal('lastImageUrl' in _0x38f64d, false));
          },
        },
      ];
      for (const _0x1ef45c of _0x8e0484) {
        const _0x28eeb0 = 'https://source.local/rh-slot-dup-' + _0x1ef45c.name + '.png',
          _0x30a04d = _0x4ff466,
          _0x1229ba = await buildGenerateVideoRequest({
            provider: 'runninghub',
            prompt: _0x1ef45c.name + ' duplicate slot',
            ..._0x1ef45c.payload,
            inputUrls: [_0x28eeb0],
            inputUrlsBySlot: { firstFrame: _0x28eeb0 },
          });
        (assert.equal(
          _0x4ff466,
          _0x30a04d + 1,
          _0x1ef45c.name + ' should upload the slotted source only once',
        ),
          _0x1ef45c.expect(
            _0x1229ba.body,
            'https://www.runninghub.cn/uploaded/rh-slot-dup-' + _0x4ff466 + '.png',
          ));
      }
    } finally {
      globalThis.fetch = _0x170f55;
    }
  }),
  test('aiVideoApi: RunningHub model API video polls openapi query', async () => {
    const _0x36528b = globalThis.fetch,
      _0x2b1934 = globalThis.setTimeout,
      _0x24781c = [],
      _0x4be59f = [],
      _0xd086f0 = [];
    try {
      globalThis.setTimeout = (_0x136108, _0x4ff7ea, ..._0x5df228) =>
        _0x2b1934(_0x136108, Number(_0x4ff7ea) > 0x1388 ? Number(_0x4ff7ea) : 0, ..._0x5df228);
      const { clearApiConfig: _0x5071dd } = await import('./configApi.js');
      (_0x5071dd(),
        (globalThis.fetch = async (_0x426216, _0x2c5771 = {}) => {
          const _0x1aae27 = String(_0x426216);
          if (_0x1aae27 === '/api/config')
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: 'https://www.runninghub.cn', modelApiKey: 'k_runninghub_model' },
              },
            });
          if (_0x1aae27 === '/api/v2/proxy/image') {
            const _0x580543 = JSON.parse(String(_0x2c5771.body || '{}'));
            if (_0x580543.apiUrl === 'https://www.runninghub.cn/openapi/v2/query')
              return (
                _0xd086f0.push(_0x580543),
                makeJsonResponse({
                  code: 0,
                  status: 'SUCCESS',
                  results: [{ url: 'https://www.runninghub.cn/result/o1-final.mp4', outputType: 'video' }],
                })
              );
            return (
              _0x4be59f.push(_0x580543),
              makeJsonResponse({
                taskId: 'rh-o1-task-1',
                status: 'SUBMITTED',
                errorCode: 0,
                errorMessage: '',
                results: null,
              })
            );
          }
          if (_0x1aae27 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/rh-o1-final.mp4' });
          throw new Error('unexpected fetch url: ' + _0x1aae27);
        }));
      const _0x1d67f9 = await generateVideo(
        {
          provider: 'runninghub',
          model: 'runninghub-model/kling-video-o1',
          prompt: 'city lights',
          generationParams: { aspectRatio: '16:9', duration: 5 },
        },
        { onTaskMeta: (_0x25a9cb) => _0x24781c.push(_0x25a9cb) },
      );
      (assert.equal(_0x4be59f.length, 1),
        assert.equal(
          _0x4be59f[0].apiUrl,
          'https://www.runninghub.cn/openapi/v2/kling-video-o1/text-to-video',
        ),
        assert.equal(_0xd086f0.length, 1),
        assert.equal(_0xd086f0[0].apiKey, 'k_runninghub_model'),
        assert.equal(_0xd086f0[0].taskId, 'rh-o1-task-1'),
        assert.equal(_0x24781c[0]?.taskId, 'rh-o1-task-1'),
        assert.equal(_0x24781c[0]?.useOpenapiQuery, true),
        assert.equal(_0x1d67f9.videoUrl, '/output/rh-o1-final.mp4'),
        assert.equal(_0x1d67f9.sourceUrl, 'https://www.runninghub.cn/result/o1-final.mp4'));
    } finally {
      ((globalThis.fetch = _0x36528b), (globalThis.setTimeout = _0x2b1934));
    }
  }),
  test('aiVideoApi: apimart 异步视频会回调 onTaskMeta 且支持 resumeAsyncVideoTask', async () => {
    const _0x2a8f9d = globalThis.fetch,
      _0x2e8e82 = globalThis.setTimeout,
      _0x323527 = [],
      _0x14abc7 = [];
    try {
      globalThis.setTimeout = (_0x122de5, _0x2295dd, ..._0x51f831) =>
        _0x2e8e82(_0x122de5, Number(_0x2295dd) > 0x1388 ? Number(_0x2295dd) : 0, ..._0x51f831);
      const { clearApiConfig: _0x2bd5f9 } = await import('./configApi.js');
      (_0x2bd5f9(),
        (globalThis.fetch = async (_0x5e5c8e, _0x4ed88d = {}) => {
          const _0x1557a1 = String(_0x5e5c8e);
          if (_0x1557a1 === '/api/config')
            return makeJsonResponse({
              providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
            });
          if (_0x1557a1 === '/api/v2/proxy/image')
            return makeJsonResponse({ data: [{ task_id: 'task-video-1', status: 'submitted' }] });
          if (_0x1557a1.startsWith('/api/v2/proxy/task?'))
            return (
              _0x14abc7.push(_0x1557a1),
              assert.equal(_0x4ed88d.headers?.Authorization, 'Bearer k_apimart'),
              makeJsonResponse({
                status: 'success',
                result: { video_url: 'https://cdn.example.com/final-video.mp4' },
              })
            );
          if (_0x1557a1 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/final-video.mp4' });
          throw new Error('unexpected fetch url: ' + _0x1557a1);
        }));
      const _0x566f0c = {
          provider: 'apimart',
          model: 'apimart/luma-ray-v2',
          prompt: 'sunset city',
          aspectRatio: '16:9',
          videoSize: 'standard',
        },
        _0x3398a = await generateVideo(_0x566f0c, { onTaskMeta: (_0x6499aa) => _0x323527.push(_0x6499aa) });
      (assert.equal(_0x323527.length, 1),
        assert.equal(_0x323527[0].taskId, 'task-video-1'),
        assert.equal(_0x323527[0].provider, 'apimart'),
        assert.equal(_0x323527[0].kind, 'video'),
        assert.equal(_0x3398a.videoUrl, '/output/final-video.mp4'),
        assert.equal(_0x3398a.sourceUrl, 'https://cdn.example.com/final-video.mp4'),
        assert.equal(_0x3398a.localPath, 'output/final-video.mp4'),
        assert.equal(_0x3398a.videos[0].localPath, 'output/final-video.mp4'));
      const _0x28cadc = await resumeAsyncVideoTask('task-video-2', {
        provider: 'apimart',
        model: 'apimart/luma-ray-v2',
      });
      (assert.equal(_0x28cadc.videoUrl, '/output/final-video.mp4'),
        assert.equal(_0x28cadc.sourceUrl, 'https://cdn.example.com/final-video.mp4'),
        assert.equal(_0x28cadc.localPath, 'output/final-video.mp4'),
        assert.equal(_0x28cadc.videos[0].localPath, 'output/final-video.mp4'),
        assert.ok(_0x14abc7.every((_0x1b75a8) => _0x1b75a8.includes('%3Flanguage%3Dzh'))));
    } finally {
      ((globalThis.fetch = _0x2a8f9d), (globalThis.setTimeout = _0x2e8e82));
    }
  }),
  test('aiVideoApi: apimart result.videos 轮询结果保留缩略图并保存本地', async () => {
    const _0x538b55 = globalThis.fetch,
      _0x1fbadf = globalThis.setTimeout;
    try {
      globalThis.setTimeout = (_0x128072, _0x1d26eb, ..._0x4b5053) =>
        _0x1fbadf(_0x128072, Number(_0x1d26eb) > 0x1388 ? Number(_0x1d26eb) : 0, ..._0x4b5053);
      const { clearApiConfig: _0x1752ef } = await import('./configApi.js');
      (_0x1752ef(),
        (globalThis.fetch = async (_0x59a608, _0x5314cc = {}) => {
          const _0x51bbbb = String(_0x59a608);
          if (_0x51bbbb === '/api/config')
            return makeJsonResponse({
              providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
            });
          if (_0x51bbbb === '/api/v2/proxy/image')
            return makeJsonResponse({ data: [{ task_id: 'task-seedance-video-1', status: 'submitted' }] });
          if (_0x51bbbb.startsWith('/api/v2/proxy/task?'))
            return (
              assert.equal(_0x5314cc.headers?.Authorization, 'Bearer k_apimart'),
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
          if (_0x51bbbb === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/seedance-final.mp4' });
          throw new Error('unexpected fetch url: ' + _0x51bbbb);
        }));
      const _0x5b851f = await generateVideo({
        provider: 'apimart',
        model: 'apimart/doubao-seedance-2.0-fast',
        prompt: 'sunset city',
        aspectRatio: '16:9',
        resolution: '720p',
        duration: 5,
      });
      (assert.equal(_0x5b851f.videoUrl, '/output/seedance-final.mp4'),
        assert.equal(_0x5b851f.sourceUrl, 'https://cdn.example.com/seedance-final.mp4'),
        assert.equal(_0x5b851f.thumbUrl, 'https://cdn.example.com/seedance-final.jpg'),
        assert.equal(_0x5b851f.localPath, 'output/seedance-final.mp4'),
        assert.equal(_0x5b851f.videos[0].localPath, 'output/seedance-final.mp4'));
    } finally {
      ((globalThis.fetch = _0x538b55), (globalThis.setTimeout = _0x1fbadf));
    }
  }),
  test('aiVideoApi: apimart seedance 失败任务立即抛出轮询错误信息', async () => {
    const _0x3f5c86 = globalThis.fetch,
      _0xab53a1 = globalThis.setTimeout;
    let _0x3741c8 = 0;
    try {
      globalThis.setTimeout = (_0x5c291e, _0x1c4501, ..._0x10f777) =>
        _0xab53a1(_0x5c291e, Number(_0x1c4501) > 0x1388 ? Number(_0x1c4501) : 0, ..._0x10f777);
      const { clearApiConfig: _0x3798ae } = await import('./configApi.js');
      (_0x3798ae(),
        (globalThis.fetch = async (_0x58926c, _0x33cb36 = {}) => {
          const _0x3ef150 = String(_0x58926c);
          if (_0x3ef150 === '/api/config')
            return makeJsonResponse({
              providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
            });
          if (_0x3ef150 === '/api/v2/proxy/image')
            return makeJsonResponse({
              code: 200,
              data: [{ task_id: 'task-seedance-failed', status: 'submitted' }],
            });
          if (_0x3ef150.startsWith('/api/v2/proxy/task?'))
            return (
              (_0x3741c8 += 1),
              assert.equal(_0x33cb36.headers?.Authorization, 'Bearer k_apimart'),
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
          throw new Error('unexpected fetch url: ' + _0x3ef150);
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
          (_0x347a87) => String(_0x347a87?.message || '').includes('Seedance upstream failed'),
        ),
        assert.equal(_0x3741c8, 1));
    } finally {
      ((globalThis.fetch = _0x3f5c86), (globalThis.setTimeout = _0xab53a1));
    }
  }),
  test('aiVideoApi: Agnes 视频完成后返回 output.video 链接', async () => {
    const _0x3b6c52 = globalThis.fetch,
      _0x3c5aa3 = globalThis.setTimeout,
      _0x564b68 = [],
      _0x1b7286 = 'https://cdn.agnes-ai.com/api/video-content/agnes-task-1?token=ok';
    try {
      globalThis.setTimeout = (_0xf1c29f, _0x234682, ..._0x51504b) =>
        _0x3c5aa3(_0xf1c29f, Number(_0x234682) > 0x1388 ? Number(_0x234682) : 0, ..._0x51504b);
      const { clearApiConfig: _0x485839 } = await import('./configApi.js');
      (_0x485839(),
        (globalThis.fetch = async (_0x3c0370, _0x24fb00 = {}) => {
          const _0x30d53f = String(_0x3c0370);
          if (_0x30d53f === '/api/config')
            return makeJsonResponse({
              providers: { agnes: { apiUrl: 'https://apihub.agnes-ai.com', apiKey: 'k_agnes' } },
            });
          if (_0x30d53f === '/api/v2/proxy/image') {
            const _0x30d563 = JSON.parse(String(_0x24fb00.body || '{}'));
            return (
              assert.equal(_0x30d563.apiUrl, 'https://apihub.agnes-ai.com/v1/videos'),
              assert.equal(_0x30d563.apiKey, 'k_agnes'),
              assert.equal(_0x30d563.model, 'agnes-video-v2.0'),
              makeJsonResponse({ id: 'agnes-task-1', status: 'queued' })
            );
          }
          if (_0x30d53f.startsWith('/api/v2/proxy/task?'))
            return (
              _0x564b68.push(new URL(_0x30d53f, 'http://local.test').searchParams.get('apiUrl')),
              assert.equal(_0x24fb00.headers?.Authorization, 'Bearer k_agnes'),
              makeJsonResponse({ id: 'agnes-task-1', status: 'completed', output: { video: _0x1b7286 } })
            );
          if (_0x30d53f === '/api/v2/save_output_from_url') {
            const _0x1eeacc = JSON.parse(String(_0x24fb00.body || '{}'));
            return (
              assert.equal(_0x1eeacc.url, _0x1b7286),
              makeJsonResponse({ path: 'output/agnes-task-1.mp4' })
            );
          }
          throw new Error('unexpected fetch url: ' + _0x30d53f);
        }));
      const _0x2b424c = await generateVideo({
        provider: 'agnes',
        model: 'agnes/agnes-video-v2.0',
        prompt: 'slow camera move',
        generationParams: { aspectRatio: '16:9', duration: 5 },
      });
      (assert.deepEqual(_0x564b68, ['https://apihub.agnes-ai.com/v1/videos/agnes-task-1']),
        assert.equal(_0x2b424c.videoUrl, '/output/agnes-task-1.mp4'),
        assert.equal(_0x2b424c.sourceUrl, _0x1b7286),
        assert.equal(_0x2b424c.localPath, 'output/agnes-task-1.mp4'));
    } finally {
      ((globalThis.fetch = _0x3b6c52), (globalThis.setTimeout = _0x3c5aa3));
    }
  }),
  test('aiVideoApi: 异步视频完成但无结果地址时不继续空轮询', async () => {
    const _0x1610a1 = globalThis.fetch,
      _0xc3dc9f = globalThis.setTimeout;
    let _0x3de1ec = 0;
    try {
      globalThis.setTimeout = (_0x1da205, _0xf7ddd1, ..._0x1da1b7) =>
        _0xc3dc9f(_0x1da205, Number(_0xf7ddd1) > 0x1388 ? Number(_0xf7ddd1) : 0, ..._0x1da1b7);
      const { clearApiConfig: _0x2be430 } = await import('./configApi.js');
      (_0x2be430(),
        (globalThis.fetch = async (_0x133e23, _0x4cdcbb = {}) => {
          const _0xe2b0aa = String(_0x133e23);
          if (_0xe2b0aa === '/api/config')
            return makeJsonResponse({
              providers: { agnes: { apiUrl: 'https://apihub.agnes-ai.com', apiKey: 'k_agnes' } },
            });
          if (_0xe2b0aa === '/api/v2/proxy/image')
            return makeJsonResponse({ id: 'agnes-task-no-url', status: 'processing' });
          if (_0xe2b0aa.startsWith('/api/v2/proxy/task?'))
            return (
              (_0x3de1ec += 1),
              assert.equal(_0x4cdcbb.headers?.Authorization, 'Bearer k_agnes'),
              makeJsonResponse({ id: 'agnes-task-no-url', status: 'completed' })
            );
          throw new Error('unexpected fetch url: ' + _0xe2b0aa);
        }),
        await assert.rejects(
          generateVideo({ provider: 'agnes', model: 'agnes/agnes-video-v2.0', prompt: 'slow camera move' }),
          /无法从服务器响应中提取视频地址/,
        ),
        assert.equal(_0x3de1ec, 1));
    } finally {
      ((globalThis.fetch = _0x1610a1), (globalThis.setTimeout = _0xc3dc9f));
    }
  }),
  test('aiVideoApi: RunningHub 工作流视频顶层 task_id 必须继续走 openapi 查询', async () => {
    const _0x13dfda = globalThis.fetch,
      _0x447bda = globalThis.setTimeout,
      _0x4c809d = [],
      _0x5158e5 = [];
    try {
      globalThis.setTimeout = (_0x392f35, _0x510dce, ..._0x5de4bd) =>
        _0x447bda(_0x392f35, Number(_0x510dce) > 0x1388 ? Number(_0x510dce) : 0, ..._0x5de4bd);
      const { clearApiConfig: _0x323d59 } = await import('./configApi.js');
      (_0x323d59(),
        (globalThis.fetch = async (_0x3a6bc3, _0x4b3772 = {}) => {
          const _0x3f5283 = String(_0x3a6bc3);
          let _0x3c4542 = null;
          if (_0x4b3772.body && typeof _0x4b3772.body === 'string')
            try {
              _0x3c4542 = JSON.parse(_0x4b3772.body);
            } catch {
              _0x3c4542 = null;
            }
          _0x5158e5.push({ url: _0x3f5283, method: String(_0x4b3772.method || 'GET'), body: _0x3c4542 });
          if (_0x3f5283 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiKey: 'k_runninghub' } } });
          if (_0x3f5283 === '/api/v2/proxy/image') {
            const _0x110ae2 = String(_0x3c4542?.apiUrl || '');
            if (_0x110ae2.includes('/openapi/v2/run/ai-app/2041741496667348994'))
              return makeJsonResponse({ task_id: 'task-rh-v54-top-level', status: 'submitted' });
            if (_0x110ae2.includes('/openapi/v2/query'))
              return makeJsonResponse({
                status: 'COMPLETED',
                results: [{ url: 'https://cdn.example.com/rh-v54.mp4' }],
              });
          }
          if (_0x3f5283 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/rh-v54.mp4' });
          if (_0x3f5283.startsWith('/api/v2/proxy/task?'))
            throw new Error('unexpected fallback to /api/v2/proxy/task');
          throw new Error('unexpected fetch url: ' + _0x3f5283);
        }));
      const _0x40938e = await generateVideo(
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
        { onTaskMeta: (_0x583ce6) => _0x4c809d.push(_0x583ce6) },
      );
      (assert.equal(_0x4c809d.length, 1),
        assert.equal(_0x4c809d[0].taskId, 'task-rh-v54-top-level'),
        assert.equal(_0x4c809d[0].useOpenapiQuery, true),
        assert.equal(_0x40938e.videoUrl, '/output/rh-v54.mp4'),
        assert.equal(_0x40938e.sourceUrl, 'https://cdn.example.com/rh-v54.mp4'),
        assert.equal(_0x40938e.localPath, 'output/rh-v54.mp4'),
        assert.equal(_0x40938e.videos[0].localPath, 'output/rh-v54.mp4'),
        assert.ok(
          _0x5158e5.some(
            (_0x17ff38) =>
              _0x17ff38.url === '/api/v2/proxy/image' &&
              String(_0x17ff38.body?.apiUrl || '').includes('/openapi/v2/query'),
          ),
        ),
        assert.ok(!_0x5158e5.some((_0x366496) => _0x366496.url.startsWith('/api/v2/proxy/task?'))));
    } finally {
      ((globalThis.fetch = _0x13dfda), (globalThis.setTimeout = _0x447bda));
    }
  }),
  test('aiVideoApi: RunningHub ai-app 查询仅返回 fileUrl 时也应结束轮询', async () => {
    const _0x2c7ca0 = globalThis.fetch,
      _0xfa30ff = globalThis.setTimeout,
      _0x2457f5 = [];
    try {
      globalThis.setTimeout = (_0x3ba010, _0x49f584, ..._0x2e5654) =>
        _0xfa30ff(_0x3ba010, Number(_0x49f584) > 0x1388 ? Number(_0x49f584) : 0, ..._0x2e5654);
      const { clearApiConfig: _0x45291d } = await import('./configApi.js');
      (_0x45291d(),
        (globalThis.fetch = async (_0xc512a, _0x400b53 = {}) => {
          const _0x8acc62 = String(_0xc512a);
          let _0x5db796 = null;
          if (_0x400b53.body && typeof _0x400b53.body === 'string')
            try {
              _0x5db796 = JSON.parse(_0x400b53.body);
            } catch {
              _0x5db796 = null;
            }
          _0x2457f5.push({ url: _0x8acc62, body: _0x5db796 });
          if (_0x8acc62 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiKey: 'k_runninghub' } } });
          if (_0x8acc62 === '/api/v2/proxy/image') {
            const _0x43a303 = String(_0x5db796?.apiUrl || '');
            if (_0x43a303.includes('/openapi/v2/run/ai-app/2054101324521844738'))
              return makeJsonResponse({ data: { id: 'task-rh-lipsync-fileurl' }, status: 'submitted' });
            if (_0x43a303.includes('/openapi/v2/query'))
              return makeJsonResponse({
                code: 0,
                data: [{ file_url: 'https://cdn.example.com/rh-lipsync-fileurl?id=123' }],
              });
          }
          if (_0x8acc62 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/rh-lipsync-fileurl.mp4' });
          throw new Error('unexpected fetch url: ' + _0x8acc62);
        }));
      const _0x3db1e9 = await generateVideo({
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
      (assert.equal(_0x3db1e9.videoUrl, '/output/rh-lipsync-fileurl.mp4'),
        assert.equal(_0x3db1e9.sourceUrl, 'https://cdn.example.com/rh-lipsync-fileurl?id=123'),
        assert.equal(_0x3db1e9.localPath, 'output/rh-lipsync-fileurl.mp4'),
        assert.equal(_0x3db1e9.videos[0].localPath, 'output/rh-lipsync-fileurl.mp4'),
        assert.equal(
          _0x2457f5.filter((_0x1149dc) => String(_0x1149dc.body?.apiUrl || '').includes('/openapi/v2/query'))
            .length,
          1,
        ));
    } finally {
      ((globalThis.fetch = _0x2c7ca0), (globalThis.setTimeout = _0xfa30ff));
    }
  }),
  test('aiVideoApi: RunningHub ai-app 保存接口失败时仍用本地兜底结果回填 videos', async () => {
    const _0x45ba13 = globalThis.fetch,
      _0x130cea = globalThis.setTimeout,
      _0x3eda57 = [],
      _0x5b8a5c = 'https://cdn.example.com/口型结果.mp4?token=abc';
    try {
      globalThis.setTimeout = (_0x11bcd3, _0x598579, ..._0x44f1fa) =>
        _0x130cea(_0x11bcd3, Number(_0x598579) > 0x1388 ? Number(_0x598579) : 0, ..._0x44f1fa);
      const { clearApiConfig: _0x1216f9 } = await import('./configApi.js');
      (_0x1216f9(),
        (globalThis.fetch = async (_0x56bbc4, _0x25b3de = {}) => {
          const _0x4d0cdd = String(_0x56bbc4);
          let _0x17ea5c = null;
          if (_0x25b3de.body && typeof _0x25b3de.body === 'string')
            try {
              _0x17ea5c = JSON.parse(_0x25b3de.body);
            } catch {
              _0x17ea5c = null;
            }
          _0x3eda57.push({ url: _0x4d0cdd, body: _0x17ea5c });
          if (_0x4d0cdd === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiKey: 'k_runninghub' } } });
          if (_0x4d0cdd === '/api/v2/proxy/image') {
            const _0x116ce4 = String(_0x17ea5c?.apiUrl || '');
            if (_0x116ce4.includes('/openapi/v2/run/ai-app/2054101324521844738'))
              return makeJsonResponse({
                data: { id: 'task-rh-lipsync-client-fallback' },
                status: 'submitted',
              });
            if (_0x116ce4.includes('/openapi/v2/query'))
              return makeJsonResponse({ code: 0, data: [{ type: 'video', fileUrl: _0x5b8a5c }] });
          }
          if (_0x4d0cdd === '/api/v2/save_output_from_url')
            return makeJsonResponse(
              { error: "Download failed: 'ascii' codec can't encode characters in position 45-47" },
              0x1f6,
            );
          if (_0x4d0cdd === _0x5b8a5c) return makeBlobResponse(new Blob([new Uint8Array([1, 2, 3])]));
          if (_0x4d0cdd === '/api/v2/save_output?ext=mp4')
            return makeJsonResponse({ path: 'output/rh-lipsync-fallback.mp4' });
          throw new Error('unexpected fetch url: ' + _0x4d0cdd);
        }));
      const _0x369a48 = await generateVideo({
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
      (assert.equal(_0x369a48.videoUrl, '/output/rh-lipsync-fallback.mp4'),
        assert.equal(_0x369a48.sourceUrl, _0x5b8a5c),
        assert.equal(_0x369a48.localPath, 'output/rh-lipsync-fallback.mp4'),
        assert.equal(_0x369a48.videos[0].videoUrl, '/output/rh-lipsync-fallback.mp4'),
        assert.equal(_0x369a48.videos[0].localPath, 'output/rh-lipsync-fallback.mp4'),
        assert.ok(_0x3eda57.some((_0x2121b6) => _0x2121b6.url === '/api/v2/save_output?ext=mp4')));
    } finally {
      ((globalThis.fetch = _0x45ba13), (globalThis.setTimeout = _0x130cea));
    }
  }),
  test('aiVideoApi: RunningHub ai-app 创建响应 data 字符串也应作为 taskId 轮询', async () => {
    const _0x5c6ad1 = globalThis.fetch,
      _0x3958a6 = globalThis.setTimeout,
      _0x452400 = [];
    try {
      globalThis.setTimeout = (_0x150428, _0x51909e, ..._0x1ce986) =>
        _0x3958a6(_0x150428, Number(_0x51909e) > 0x1388 ? Number(_0x51909e) : 0, ..._0x1ce986);
      const { clearApiConfig: _0x1df973 } = await import('./configApi.js');
      (_0x1df973(),
        (globalThis.fetch = async (_0x4c6ee4, _0x4fe3d8 = {}) => {
          const _0x3cc852 = String(_0x4c6ee4);
          let _0x40ca90 = null;
          if (_0x4fe3d8.body && typeof _0x4fe3d8.body === 'string')
            try {
              _0x40ca90 = JSON.parse(_0x4fe3d8.body);
            } catch {
              _0x40ca90 = null;
            }
          if (_0x3cc852 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiKey: 'k_runninghub' } } });
          if (_0x3cc852 === '/api/v2/proxy/image') {
            const _0xe72024 = String(_0x40ca90?.apiUrl || '');
            if (_0xe72024.includes('/openapi/v2/run/ai-app/2054101324521844738'))
              return makeJsonResponse({ code: 0, data: 'task-rh-lipsync-string' });
            if (_0xe72024.includes('/openapi/v2/query'))
              return (
                assert.equal(_0x40ca90?.taskId, 'task-rh-lipsync-string'),
                makeJsonResponse({
                  taskId: 'task-rh-lipsync-string',
                  status: 'SUCCESS',
                  results: [{ url: 'https://cdn.example.com/rh-lipsync-string.mp4', outputType: 'mp4' }],
                })
              );
          }
          if (_0x3cc852 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/rh-lipsync-string.mp4' });
          throw new Error('unexpected fetch url: ' + _0x3cc852);
        }));
      const _0x13da8e = await generateVideo(
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
        { onTaskMeta: (_0x3e38cf) => _0x452400.push(_0x3e38cf) },
      );
      (assert.equal(_0x452400[0]?.taskId, 'task-rh-lipsync-string'),
        assert.equal(_0x452400[0]?.useOpenapiQuery, true),
        assert.equal(_0x13da8e.videoUrl, '/output/rh-lipsync-string.mp4'),
        assert.equal(_0x13da8e.sourceUrl, 'https://cdn.example.com/rh-lipsync-string.mp4'),
        assert.equal(_0x13da8e.localPath, 'output/rh-lipsync-string.mp4'),
        assert.equal(_0x13da8e.videos[0].localPath, 'output/rh-lipsync-string.mp4'));
    } finally {
      ((globalThis.fetch = _0x5c6ad1), (globalThis.setTimeout = _0x3958a6));
    }
  }),
  test('aiVideoApi: RunningHub ai-app 创建响应 SSE data 行也应解析 taskId', async () => {
    const _0x116dc0 = globalThis.fetch,
      _0x5f537a = globalThis.setTimeout;
    try {
      globalThis.setTimeout = (_0x2e978e, _0x39fbbb, ..._0x10f022) =>
        _0x5f537a(_0x2e978e, Number(_0x39fbbb) > 0x1388 ? Number(_0x39fbbb) : 0, ..._0x10f022);
      const { clearApiConfig: _0x11e3bd } = await import('./configApi.js');
      (_0x11e3bd(),
        (globalThis.fetch = async (_0x26c35b, _0x2806bf = {}) => {
          const _0x59d776 = String(_0x26c35b);
          let _0x5532f1 = null;
          if (_0x2806bf.body && typeof _0x2806bf.body === 'string')
            try {
              _0x5532f1 = JSON.parse(_0x2806bf.body);
            } catch {
              _0x5532f1 = null;
            }
          if (_0x59d776 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiKey: 'k_runninghub' } } });
          if (_0x59d776 === '/api/v2/proxy/image') {
            const _0x378fb5 = String(_0x5532f1?.apiUrl || '');
            if (_0x378fb5.includes('/openapi/v2/run/ai-app/2054101324521844738'))
              return makeTextResponse(
                'data: {"code":0,"data":{"taskId":"task-rh-lipsync-sse"},"status":"submitted"}\n\n',
                200,
                'text/event-stream',
              );
            if (_0x378fb5.includes('/openapi/v2/query'))
              return (
                assert.equal(_0x5532f1?.taskId, 'task-rh-lipsync-sse'),
                makeJsonResponse({
                  code: 0,
                  data: {
                    status: 'SUCCESS',
                    outputs: [{ fileUrl: 'https://cdn.example.com/rh-lipsync-sse.mp4' }],
                  },
                })
              );
          }
          if (_0x59d776 === '/api/v2/save_output_from_url')
            return makeJsonResponse({ path: 'output/rh-lipsync-sse.mp4' });
          throw new Error('unexpected fetch url: ' + _0x59d776);
        }));
      const _0x1de6e6 = await generateVideo({
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
      (assert.equal(_0x1de6e6.videoUrl, '/output/rh-lipsync-sse.mp4'),
        assert.equal(_0x1de6e6.sourceUrl, 'https://cdn.example.com/rh-lipsync-sse.mp4'),
        assert.equal(_0x1de6e6.localPath, 'output/rh-lipsync-sse.mp4'),
        assert.equal(_0x1de6e6.videos[0].localPath, 'output/rh-lipsync-sse.mp4'));
    } finally {
      ((globalThis.fetch = _0x116dc0), (globalThis.setTimeout = _0x5f537a));
    }
  }));
