import test from 'node:test';
import assert from 'node:assert/strict';
import { buildImageRequest, buildVideoRequest } from './ApimartAdapter.js';
function createCtx({ apiUrl: apiUrl = 'https://api.apimart.example.com' } = {}) {
  const calls = [];
  return {
    calls: calls,
    getProviderConfig(value) {
      if (value === 'apimart') return { apiUrl: apiUrl, apiKey: 'k' };
      return {};
    },
    async processInputImages(inputUrls = [], apiKey, options = {}) {
      return (
        calls.push({ type: 'images', inputUrls: inputUrls, apiKey: apiKey, options: options }),
        inputUrls.map((item) => 'https://uploaded.example/' + String(item).split('/').pop())
      );
    },
    async processInputVideos(videoUrls = [], apiKey2, options2 = {}) {
      return (
        calls.push({ type: 'videos', videoUrls: videoUrls, apiKey: apiKey2, options: options2 }),
        videoUrls.map((item2) => 'https://uploaded.example/' + String(item2).split('/').pop())
      );
    },
    async processInputAudios(audioUrls = [], apiKey3, options3 = {}) {
      return (
        calls.push({ type: 'audios', audioUrls: audioUrls, apiKey: apiKey3, options: options3 }),
        audioUrls.map((item3) => 'https://uploaded.example/' + String(item3).split('/').pop())
      );
    },
  };
}
(test('ApimartAdapter: 多图输入按上传处理后的顺序写入 image_urls', async () => {
  const ctx = createCtx(),
    dom = await buildImageRequest(
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
      ctx,
    );
  (assert.deepEqual(dom.body.image_urls, [
    'https://uploaded.example/target.png',
    'https://uploaded.example/source.png',
    'https://uploaded.example/style.png',
  ]),
    assert.equal(ctx.calls[0].options.provider, 'apimart'));
}),
  test('ApimartAdapter: APIMart /v1 base URL is not duplicated', async () => {
    const ctx2 = createCtx({ apiUrl: 'https://api.apimart.example.com/v1' }),
      dom2 = await buildVideoRequest(
        { model: 'apimart/doubao-seedance-2.0', prompt: 'p', aspectRatio: '16:9', duration: 5 },
        'p',
        ctx2,
      );
    assert.equal(dom2.body.apiUrl, 'https://api.apimart.example.com/v1/videos/generations');
  }),
  test('ApimartAdapter: GPT image 2 使用官方模型名并透传小写 resolution/size', async () => {
    const ctx3 = createCtx(),
      dom3 = await buildImageRequest(
        {
          model: 'apimart/gpt-image-2',
          prompt: 'p',
          imageSize: '2K',
          aspectRatio: '16:9',
          resolvedRatioLabel: '16:9',
          inputUrls: ['https://local.example/target.png', 'https://local.example/source.png'],
        },
        'p',
        ctx3,
      );
    (assert.equal(dom3.url, '/api/v2/proxy/image'),
      assert.equal(dom3.body.apiUrl, 'https://api.apimart.example.com/v1/images/generations'),
      assert.equal(dom3.body.model, 'gpt-image-2'),
      assert.equal(dom3.body.resolution, '2k'),
      assert.equal(dom3.body.size, '16:9'),
      assert.deepEqual(dom3.body.image_urls, [
        'https://uploaded.example/target.png',
        'https://uploaded.example/source.png',
      ]),
      assert.equal(ctx3.calls[0].options.provider, 'apimart'));
  }),
  test('ApimartAdapter: GPT image 2 支持 4K 可用横竖比例', async () => {
    const dom4 = await buildImageRequest(
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
    (assert.equal(dom4.body.resolution, '4k'), assert.equal(dom4.body.size, '16:9'));
    const dom5 = await buildImageRequest(
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
    (assert.equal(dom5.body.resolution, '4k'), assert.equal(dom5.body.size, '9:21'));
  }),
  test('ApimartAdapter: GPT image 2 4K 不支持比例回退到可用比例', async () => {
    const ctx4 = createCtx(),
      dom6 = await buildImageRequest(
        {
          model: 'apimart/gpt-image-2',
          prompt: 'p',
          imageSize: '4K',
          aspectRatio: '1:1',
          resolvedRatioLabel: '1:1',
          inputUrls: [],
        },
        'p',
        ctx4,
      );
    (assert.equal(dom6.body.model, 'gpt-image-2'),
      assert.equal(dom6.body.resolution, '4k'),
      assert.equal(dom6.body.size, '16:9'));
  }),
  test('ApimartAdapter: GPT image 2 历史 3K 画质回退到 2k', async () => {
    const ctx5 = createCtx(),
      dom7 = await buildImageRequest(
        {
          model: 'apimart/gpt-image-2',
          prompt: 'p',
          imageSize: '3K',
          aspectRatio: '1:1',
          resolvedRatioLabel: '1:1',
          inputUrls: [],
        },
        'p',
        ctx5,
      );
    (assert.equal(dom7.body.model, 'gpt-image-2'),
      assert.equal(dom7.body.resolution, '2k'),
      assert.equal(dom7.body.size, '1:1'));
  }),
  test('ApimartAdapter: 视频源和参考图使用 APIMART 上传后写入请求', async () => {
    const ctx6 = createCtx(),
      dom8 = await buildVideoRequest(
        {
          model: 'apimart/happyhorse-1.0',
          prompt: 'p',
          aspectRatio: '16:9',
          duration: 5,
          videoUrl: '/data/uploads/source.mp4',
          inputUrls: ['/data/uploads/style.png'],
        },
        'p',
        ctx6,
      );
    (assert.equal(dom8.url, '/api/v2/proxy/image'),
      assert.equal(dom8.body.apiUrl, 'https://api.apimart.example.com/v1/videos/generations'),
      assert.equal(dom8.body.model, 'happyhorse-1.0'),
      assert.equal(dom8.body.video_url, 'https://uploaded.example/source.mp4'),
      assert.deepEqual(dom8.body.image_urls, ['https://uploaded.example/style.png']),
      assert.equal(ctx6.calls[0].type, 'videos'),
      assert.equal(ctx6.calls[0].options.provider, 'apimart'),
      assert.equal(ctx6.calls[1].type, 'images'),
      assert.equal(ctx6.calls[1].options.provider, 'apimart'));
  }),
  test('ApimartAdapter: Seedance 文生视频映射到 APIMart 官方字段', async () => {
    const ctx7 = createCtx(),
      dom9 = await buildVideoRequest(
        {
          model: 'apimart/doubao-seedance-2.0-fast',
          prompt: 'p',
          aspectRatio: '21:9',
          resolution: '720p',
          duration: 8,
        },
        'p',
        ctx7,
      );
    (assert.equal(dom9.body.apiUrl, 'https://api.apimart.example.com/v1/videos/generations'),
      assert.equal(dom9.body.model, 'doubao-seedance-2.0-fast'),
      assert.equal(dom9.body.prompt, 'p'),
      assert.equal(dom9.body.size, '21:9'),
      assert.equal(dom9.body.resolution, '720p'),
      assert.equal(dom9.body.duration, 8),
      assert.equal('quality' in dom9.body, false),
      assert.deepEqual(ctx7.calls, []));
  }),
  test('ApimartAdapter: Seedance 首尾帧写入 image_with_roles', async () => {
    const ctx8 = createCtx(),
      dom10 = await buildVideoRequest(
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
        ctx8,
      );
    (assert.equal(dom10.body.model, 'doubao-seedance-2.0'),
      assert.deepEqual(dom10.body.image_with_roles, [
        { url: 'https://uploaded.example/first.png', role: 'first_frame' },
        { url: 'https://uploaded.example/last.png', role: 'last_frame' },
      ]),
      assert.equal('image_urls' in dom10.body, false),
      assert.equal('video_urls' in dom10.body, false),
      assert.equal(ctx8.calls.length, 1),
      assert.equal(ctx8.calls[0].type, 'images'));
  }),
  test('ApimartAdapter: Seedance 2.0 使用通过人脸检测的 asset URL', async () => {
    const ctx9 = createCtx();
    ctx9.processInputImages = async (inputUrls2 = [], apiKey4, options4 = {}) => {
      return (
        ctx9.calls.push({ type: 'images', inputUrls: inputUrls2, apiKey: apiKey4, options: options4 }),
        inputUrls2.map((item4) =>
          String(item4).startsWith('asset://')
            ? item4
            : 'https://uploaded.example/' + String(item4).split('/').pop(),
        )
      );
    };
    const dom11 = await buildVideoRequest(
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
      ctx9,
    );
    (assert.deepEqual(ctx9.calls[0].inputUrls, ['asset://private-first', 'asset://private-last']),
      assert.deepEqual(dom11.body.image_with_roles, [
        { url: 'asset://private-first', role: 'first_frame' },
        { url: 'asset://private-last', role: 'last_frame' },
      ]));
  }),
  test('ApimartAdapter: 非 Seedance 2.0 不使用人脸检测 asset URL', async () => {
    const ctx10 = createCtx(),
      dom12 = await buildVideoRequest(
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
        ctx10,
      );
    (assert.deepEqual(ctx10.calls[0].inputUrls, ['/data/uploads/first.png', '/data/uploads/last.png']),
      assert.deepEqual(dom12.body.image_with_roles, [
        { url: 'https://uploaded.example/first.png', role: 'first_frame' },
        { url: 'https://uploaded.example/last.png', role: 'last_frame' },
      ]));
  }),
  test('ApimartAdapter: Seedance 多模态参考映射图片视频音频数组', async () => {
    const ctx11 = createCtx(),
      dom13 = await buildVideoRequest(
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
        ctx11,
      );
    (assert.equal(dom13.body.model, 'doubao-seedance-2.0-fast-face'),
      assert.equal(dom13.body.size, 'adaptive'),
      assert.deepEqual(dom13.body.image_urls, [
        'https://uploaded.example/a.png',
        'https://uploaded.example/b.png',
      ]),
      assert.deepEqual(dom13.body.video_urls, ['https://uploaded.example/ref.mp4']),
      assert.deepEqual(dom13.body.audio_urls, ['https://uploaded.example/ref.mp3']),
      assert.deepEqual(
        ctx11.calls.map((item5) => item5.type),
        ['videos', 'images', 'audios'],
      ));
  }),
  test('ApimartAdapter: Seedance 1.5 Pro 使用 aspect_ratio 和生成音频字段', async () => {
    const ctx12 = createCtx(),
      dom14 = await buildVideoRequest(
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
        ctx12,
      );
    (assert.equal(dom14.body.model, 'doubao-seedance-1-5-pro'),
      assert.equal(dom14.body.aspect_ratio, '9:16'),
      assert.equal('size' in dom14.body, false),
      assert.equal(dom14.body.audio, true),
      assert.deepEqual(dom14.body.image_with_roles, [
        { url: 'https://uploaded.example/start.png', role: 'first_frame' },
        { url: 'https://uploaded.example/end.png', role: 'last_frame' },
      ]));
  }),
  test('ApimartAdapter: Seedance 1.0 Pro Quality 使用 aspect_ratio 和首尾帧', async () => {
    const ctx13 = createCtx(),
      dom15 = await buildVideoRequest(
        {
          model: 'apimart/doubao-seedance-1-0-pro-quality',
          prompt: 'p',
          aspectRatio: '4:3',
          duration: 2,
          first: '/data/uploads/day.png',
          last: '/data/uploads/night.png',
        },
        'p',
        ctx13,
      );
    (assert.equal(dom15.body.model, 'doubao-seedance-1-0-pro-quality'),
      assert.equal(dom15.body.aspect_ratio, '4:3'),
      assert.equal(dom15.body.resolution, '1080p'),
      assert.deepEqual(dom15.body.image_with_roles, [
        { url: 'https://uploaded.example/day.png', role: 'first_frame' },
        { url: 'https://uploaded.example/night.png', role: 'last_frame' },
      ]));
  }),
  test('ApimartAdapter: Seedance 1.0 Pro Fast 不接收尾帧', async () => {
    const ctx14 = createCtx();
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
          ctx14,
        ),
      /Fast 不支持尾帧图/,
    );
  }));
