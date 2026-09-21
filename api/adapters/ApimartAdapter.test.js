import test from 'node:test';
import assert from 'node:assert/strict';
import { buildImageRequest, buildVideoRequest } from './ApimartAdapter.js';
function createCtx({ apiUrl: apiUrl = 'https://api.apimart.example.com' } = {}) {
  const _0x2e1ec0 = [];
  return {
    calls: _0x2e1ec0,
    getProviderConfig(_0x4de251) {
      if (_0x4de251 === 'apimart') return { apiUrl: apiUrl, apiKey: 'k' };
      return {};
    },
    async processInputImages(_0x525436 = [], _0x83cdd4, _0x5ea1e2 = {}) {
      return (
        _0x2e1ec0.push({ type: 'images', inputUrls: _0x525436, apiKey: _0x83cdd4, options: _0x5ea1e2 }),
        _0x525436.map((_0x24bc9e) => 'https://uploaded.example/' + String(_0x24bc9e).split('/').pop())
      );
    },
    async processInputVideos(_0xc9ffc8 = [], _0x40b4d1, _0x2d4661 = {}) {
      return (
        _0x2e1ec0.push({ type: 'videos', videoUrls: _0xc9ffc8, apiKey: _0x40b4d1, options: _0x2d4661 }),
        _0xc9ffc8.map((_0x1ab561) => 'https://uploaded.example/' + String(_0x1ab561).split('/').pop())
      );
    },
    async processInputAudios(_0x42389e = [], _0x4426fb, _0x4f027c = {}) {
      return (
        _0x2e1ec0.push({ type: 'audios', audioUrls: _0x42389e, apiKey: _0x4426fb, options: _0x4f027c }),
        _0x42389e.map((_0x2cdb1f) => 'https://uploaded.example/' + String(_0x2cdb1f).split('/').pop())
      );
    },
  };
}
(test('ApimartAdapter: 多图输入按上传处理后的顺序写入 image_urls', async () => {
  const _0x68ac79 = createCtx(),
    _0x4aacaa = await buildImageRequest(
      {
        model: 'apimart/nano-banana-pro',
        prompt: 'p',
        imageSize: '2K',
        aspectRatio: '1:1',
        inputUrls: [
          'https://local.example/target.png',
          'https://local.example/source.png',
          'https://local.example/style.png',
        ],
      },
      'p',
      _0x68ac79,
    );
  (assert.deepEqual(_0x4aacaa.body.image_urls, [
    'https://uploaded.example/target.png',
    'https://uploaded.example/source.png',
    'https://uploaded.example/style.png',
  ]),
    assert.equal(_0x68ac79.calls[0].options.provider, 'apimart'));
}),
  test('ApimartAdapter: APIMart /v1 base URL is not duplicated', async () => {
    const _0x5eab08 = createCtx({ apiUrl: 'https://api.apimart.example.com/v1' }),
      _0xe430be = await buildVideoRequest(
        { model: 'apimart/doubao-seedance-2.0', prompt: 'p', aspectRatio: '16:9', duration: 5 },
        'p',
        _0x5eab08,
      );
    assert.equal(_0xe430be.body.apiUrl, 'https://api.apimart.example.com/v1/videos/generations');
  }),
  test('ApimartAdapter: GPT image 2 使用官方模型名并透传小写 resolution/size', async () => {
    const _0x383410 = createCtx(),
      _0x3f56d6 = await buildImageRequest(
        {
          model: 'apimart/gpt-image-2',
          prompt: 'p',
          imageSize: '2K',
          aspectRatio: '16:9',
          resolvedRatioLabel: '16:9',
          inputUrls: ['https://local.example/target.png', 'https://local.example/source.png'],
        },
        'p',
        _0x383410,
      );
    (assert.equal(_0x3f56d6.url, '/api/v2/proxy/image'),
      assert.equal(_0x3f56d6.body.apiUrl, 'https://api.apimart.example.com/v1/images/generations'),
      assert.equal(_0x3f56d6.body.model, 'gpt-image-2'),
      assert.equal(_0x3f56d6.body.resolution, '2k'),
      assert.equal(_0x3f56d6.body.size, '16:9'),
      assert.deepEqual(_0x3f56d6.body.image_urls, [
        'https://uploaded.example/target.png',
        'https://uploaded.example/source.png',
      ]),
      assert.equal(_0x383410.calls[0].options.provider, 'apimart'));
  }),
  test('ApimartAdapter: GPT image 2 支持 4K 可用横竖比例', async () => {
    const _0x4f2898 = await buildImageRequest(
      {
        model: 'apimart/gpt-image-2',
        prompt: 'p',
        imageSize: '4K',
        aspectRatio: '16:9',
        resolvedRatioLabel: '16:9',
        inputUrls: [],
      },
      'p',
      createCtx(),
    );
    (assert.equal(_0x4f2898.body.resolution, '4k'), assert.equal(_0x4f2898.body.size, '16:9'));
    const _0x23d920 = await buildImageRequest(
      {
        model: 'apimart/gpt-image-2',
        prompt: 'p',
        imageSize: '4K',
        aspectRatio: '9:21',
        resolvedRatioLabel: '9:21',
        inputUrls: [],
      },
      'p',
      createCtx(),
    );
    (assert.equal(_0x23d920.body.resolution, '4k'), assert.equal(_0x23d920.body.size, '9:21'));
  }),
  test('ApimartAdapter: GPT image 2 4K 不支持比例回退到可用比例', async () => {
    const _0xb9ca6a = createCtx(),
      _0x52c025 = await buildImageRequest(
        {
          model: 'apimart/gpt-image-2',
          prompt: 'p',
          imageSize: '4K',
          aspectRatio: '1:1',
          resolvedRatioLabel: '1:1',
          inputUrls: [],
        },
        'p',
        _0xb9ca6a,
      );
    (assert.equal(_0x52c025.body.model, 'gpt-image-2'),
      assert.equal(_0x52c025.body.resolution, '4k'),
      assert.equal(_0x52c025.body.size, '16:9'));
  }),
  test('ApimartAdapter: GPT image 2 历史 3K 画质回退到 2k', async () => {
    const _0x25dbf3 = createCtx(),
      _0x1ac913 = await buildImageRequest(
        {
          model: 'apimart/gpt-image-2',
          prompt: 'p',
          imageSize: '3K',
          aspectRatio: '1:1',
          resolvedRatioLabel: '1:1',
          inputUrls: [],
        },
        'p',
        _0x25dbf3,
      );
    (assert.equal(_0x1ac913.body.model, 'gpt-image-2'),
      assert.equal(_0x1ac913.body.resolution, '2k'),
      assert.equal(_0x1ac913.body.size, '1:1'));
  }),
  test('ApimartAdapter: 视频源和参考图使用 APIMART 上传后写入请求', async () => {
    const _0x98f980 = createCtx(),
      _0x2e6889 = await buildVideoRequest(
        {
          model: 'apimart/happyhorse-1.0',
          prompt: 'p',
          aspectRatio: '16:9',
          duration: 5,
          videoUrl: '/data/uploads/source.mp4',
          inputUrls: ['/data/uploads/style.png'],
        },
        'p',
        _0x98f980,
      );
    (assert.equal(_0x2e6889.url, '/api/v2/proxy/image'),
      assert.equal(_0x2e6889.body.apiUrl, 'https://api.apimart.example.com/v1/videos/generations'),
      assert.equal(_0x2e6889.body.model, 'happyhorse-1.0'),
      assert.equal(_0x2e6889.body.video_url, 'https://uploaded.example/source.mp4'),
      assert.deepEqual(_0x2e6889.body.image_urls, ['https://uploaded.example/style.png']),
      assert.equal(_0x98f980.calls[0].type, 'videos'),
      assert.equal(_0x98f980.calls[0].options.provider, 'apimart'),
      assert.equal(_0x98f980.calls[1].type, 'images'),
      assert.equal(_0x98f980.calls[1].options.provider, 'apimart'));
  }),
  test('ApimartAdapter: Seedance 文生视频映射到 APIMart 官方字段', async () => {
    const _0x1bf430 = createCtx(),
      _0x31ba2f = await buildVideoRequest(
        {
          model: 'apimart/doubao-seedance-2.0-fast',
          prompt: 'p',
          aspectRatio: '21:9',
          resolution: '720p',
          duration: 8,
        },
        'p',
        _0x1bf430,
      );
    (assert.equal(_0x31ba2f.body.apiUrl, 'https://api.apimart.example.com/v1/videos/generations'),
      assert.equal(_0x31ba2f.body.model, 'doubao-seedance-2.0-fast'),
      assert.equal(_0x31ba2f.body.prompt, 'p'),
      assert.equal(_0x31ba2f.body.size, '21:9'),
      assert.equal(_0x31ba2f.body.resolution, '720p'),
      assert.equal(_0x31ba2f.body.duration, 8),
      assert.equal('quality' in _0x31ba2f.body, false),
      assert.deepEqual(_0x1bf430.calls, []));
  }),
  test('ApimartAdapter: Seedance 首尾帧写入 image_with_roles', async () => {
    const _0x3f9c88 = createCtx(),
      _0x59d6c5 = await buildVideoRequest(
        {
          model: 'apimart/doubao-seedance-2.0',
          prompt: 'transition',
          aspectRatio: 'adaptive',
          resolution: '1080p',
          duration: 5,
          first: '/data/uploads/first.png',
          last: '/data/uploads/last.png',
          inputUrls: ['/data/uploads/first.png', '/data/uploads/last.png'],
        },
        'transition',
        _0x3f9c88,
      );
    (assert.equal(_0x59d6c5.body.model, 'doubao-seedance-2.0'),
      assert.deepEqual(_0x59d6c5.body.image_with_roles, [
        { url: 'https://uploaded.example/first.png', role: 'first_frame' },
        { url: 'https://uploaded.example/last.png', role: 'last_frame' },
      ]),
      assert.equal('image_urls' in _0x59d6c5.body, false),
      assert.equal('video_urls' in _0x59d6c5.body, false),
      assert.equal(_0x3f9c88.calls.length, 1),
      assert.equal(_0x3f9c88.calls[0].type, 'images'));
  }),
  test('ApimartAdapter: Seedance 2.0 使用通过人脸检测的 asset URL', async () => {
    const _0x534872 = createCtx();
    _0x534872.processInputImages = async (_0x319890 = [], _0x257684, _0x56108d = {}) => {
      return (
        _0x534872.calls.push({ type: 'images', inputUrls: _0x319890, apiKey: _0x257684, options: _0x56108d }),
        _0x319890.map((_0x1f55a6) =>
          String(_0x1f55a6).startsWith('asset://')
            ? _0x1f55a6
            : 'https://uploaded.example/' + String(_0x1f55a6).split('/').pop(),
        )
      );
    };
    const _0x1ec3e3 = await buildVideoRequest(
      {
        model: 'apimart/doubao-seedance-2.0-fast',
        prompt: 'transition',
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
      },
      'transition',
      _0x534872,
    );
    (assert.deepEqual(_0x534872.calls[0].inputUrls, ['asset://private-first', 'asset://private-last']),
      assert.deepEqual(_0x1ec3e3.body.image_with_roles, [
        { url: 'asset://private-first', role: 'first_frame' },
        { url: 'asset://private-last', role: 'last_frame' },
      ]));
  }),
  test('ApimartAdapter: 非 Seedance 2.0 不使用人脸检测 asset URL', async () => {
    const _0x268d93 = createCtx(),
      _0x3a51b1 = await buildVideoRequest(
        {
          model: 'apimart/doubao-seedance-1-5-pro',
          prompt: 'transition',
          first: '/data/uploads/first.png',
          last: '/data/uploads/last.png',
          providerAssetRefs: [
            {
              provider: 'apimart',
              capability: 'seedance2PrivateAvatar',
              status: 'passed',
              sourceKind: 'image',
              sourceUrl: '/data/uploads/first.png',
              assetUrl: 'asset://private-first',
            },
          ],
        },
        'transition',
        _0x268d93,
      );
    (assert.deepEqual(_0x268d93.calls[0].inputUrls, ['/data/uploads/first.png', '/data/uploads/last.png']),
      assert.deepEqual(_0x3a51b1.body.image_with_roles, [
        { url: 'https://uploaded.example/first.png', role: 'first_frame' },
        { url: 'https://uploaded.example/last.png', role: 'last_frame' },
      ]));
  }),
  test('ApimartAdapter: Seedance 多模态参考映射图片视频音频数组', async () => {
    const _0x4c64b7 = createCtx(),
      _0x16f619 = await buildVideoRequest(
        {
          model: 'apimart/doubao-seedance-2.0-fast-face',
          prompt: 'product ad',
          aspectRatio: '自适应',
          resolution: '720p',
          duration: 11,
          images: ['/data/uploads/a.png', '/data/uploads/b.png'],
          videos: ['/data/uploads/ref.mp4'],
          audios: ['/data/uploads/ref.mp3'],
        },
        'product ad',
        _0x4c64b7,
      );
    (assert.equal(_0x16f619.body.model, 'doubao-seedance-2.0-fast-face'),
      assert.equal(_0x16f619.body.size, 'adaptive'),
      assert.deepEqual(_0x16f619.body.image_urls, [
        'https://uploaded.example/a.png',
        'https://uploaded.example/b.png',
      ]),
      assert.deepEqual(_0x16f619.body.video_urls, ['https://uploaded.example/ref.mp4']),
      assert.deepEqual(_0x16f619.body.audio_urls, ['https://uploaded.example/ref.mp3']),
      assert.deepEqual(
        _0x4c64b7.calls.map((_0x2ec715) => _0x2ec715.type),
        ['videos', 'images', 'audios'],
      ));
  }),
  test('ApimartAdapter: Seedance 1.5 Pro 使用 aspect_ratio 和生成音频字段', async () => {
    const _0x379b52 = createCtx(),
      _0x13f101 = await buildVideoRequest(
        {
          model: 'apimart/doubao-seedance-1-5-pro',
          prompt: 'p',
          aspectRatio: '9:16',
          resolution: '1080p',
          duration: 12,
          audio: true,
          first: '/data/uploads/start.png',
          last: '/data/uploads/end.png',
        },
        'p',
        _0x379b52,
      );
    (assert.equal(_0x13f101.body.model, 'doubao-seedance-1-5-pro'),
      assert.equal(_0x13f101.body.aspect_ratio, '9:16'),
      assert.equal('size' in _0x13f101.body, false),
      assert.equal(_0x13f101.body.audio, true),
      assert.deepEqual(_0x13f101.body.image_with_roles, [
        { url: 'https://uploaded.example/start.png', role: 'first_frame' },
        { url: 'https://uploaded.example/end.png', role: 'last_frame' },
      ]));
  }),
  test('ApimartAdapter: Seedance 1.0 Pro Quality 使用 aspect_ratio 和首尾帧', async () => {
    const _0x34d251 = createCtx(),
      _0x31cb88 = await buildVideoRequest(
        {
          model: 'apimart/doubao-seedance-1-0-pro-quality',
          prompt: 'p',
          aspectRatio: '4:3',
          duration: 2,
          first: '/data/uploads/day.png',
          last: '/data/uploads/night.png',
        },
        'p',
        _0x34d251,
      );
    (assert.equal(_0x31cb88.body.model, 'doubao-seedance-1-0-pro-quality'),
      assert.equal(_0x31cb88.body.aspect_ratio, '4:3'),
      assert.equal(_0x31cb88.body.resolution, '1080p'),
      assert.deepEqual(_0x31cb88.body.image_with_roles, [
        { url: 'https://uploaded.example/day.png', role: 'first_frame' },
        { url: 'https://uploaded.example/night.png', role: 'last_frame' },
      ]));
  }),
  test('ApimartAdapter: Seedance 1.0 Pro Fast 不接收尾帧', async () => {
    const _0x4dd3bf = createCtx();
    await assert.rejects(
      () =>
        buildVideoRequest(
          {
            model: 'apimart/doubao-seedance-1-0-pro-fast',
            prompt: 'p',
            first: '/data/uploads/day.png',
            last: '/data/uploads/night.png',
          },
          'p',
          _0x4dd3bf,
        ),
      /Fast 不支持尾帧图/,
    );
  }));
