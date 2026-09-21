import test from 'node:test';
import assert from 'node:assert/strict';
import { buildImageRequest, buildVideoRequest, buildModelRequest } from './RunningHubAdapter.js';
import { getRunningHubWorkflowPayloadResolver } from './runninghubWorkflowResolvers/index.js';
import { resolveModelExecution } from '../../src/manifests/index.js';
(test('RunningHub workflow payload resolvers are whitelist-only', () => {
  (assert.equal(typeof getRunningHubWorkflowPayloadResolver('runninghubVideoV54'), 'function'),
    assert.equal(typeof getRunningHubWorkflowPayloadResolver('runninghubVideoMatting'), 'function'),
    assert.equal(getRunningHubWorkflowPayloadResolver('unknownResolver'), null));
}),
  test('RunningHubAdapter 人物替换图片编辑 V3: nodeInfoList 映射正确', async () => {
    const _0x4a3eab = resolveModelExecution('runninghub/2041177685895946242');
    assert.equal(_0x4a3eab?.executionManifest?.mapping?.imageNodes?.[0], '45');
    const _0x323c42 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_target', 'u_source'],
        processInputImagesPreserveOrder: async (_0x1a7f98) =>
          Array.isArray(_0x1a7f98) && _0x1a7f98[0] === '' && _0x1a7f98[1] === ''
            ? ['', '']
            : Array.isArray(_0x1a7f98) && _0x1a7f98[0] === 'm_target' && _0x1a7f98[1] === 'm_source'
              ? ['mask_0', 'mask_1']
              : ['u_target', 'u_source'],
      },
      _0x46246c = await buildImageRequest(
        {
          model: 'runninghub/2041177685895946242',
          inputUrls: ['local_target', 'local_source'],
          rhResolution: 0x640,
          rhInstanceType: 'plus',
        },
        'a prompt',
        _0x323c42,
      );
    (assert.equal(_0x46246c.url, '/api/v2/proxy/image'),
      assert.equal(
        _0x46246c.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/run/ai-app/2041177685895946242',
      ),
      assert.equal(_0x46246c.body.apiKey, 'k'),
      assert.equal(_0x46246c.body.instanceType, 'plus'),
      assert.ok(Array.isArray(_0x46246c.body.nodeInfoList)));
    const _0x42103e = _0x46246c.body.nodeInfoList,
      _0x2d70a4 = (_0x4e4fa0, _0x1fd385) =>
        _0x42103e.find((_0x8aa3df) => _0x8aa3df.nodeId === _0x4e4fa0 && _0x8aa3df.fieldName === _0x1fd385);
    (assert.equal(_0x2d70a4('45', 'image')?.fieldValue, 'u_target'),
      assert.equal(_0x2d70a4('40', 'image')?.fieldValue, 'u_source'),
      assert.equal(_0x2d70a4('594', 'value')?.fieldValue, 'a prompt'),
      assert.equal(_0x2d70a4('400', 'value')?.fieldValue, '1600'),
      assert.equal(_0x2d70a4('1180', 'image'), undefined),
      assert.equal(_0x2d70a4('1185', 'boolean'), undefined),
      assert.equal(_0x2d70a4('1177', 'image'), undefined),
      assert.equal(_0x2d70a4('1186', 'boolean'), undefined));
  }),
  test('RunningHubAdapter image workflow: missing manifest throws instead of fallback', async () => {
    await assert.rejects(
      () =>
        buildImageRequest(
          { model: 'runninghub/2037743729716498433', inputUrls: ['local_target', 'local_source'] },
          '',
          {
            getProviderConfig: () => ({ apiKey: 'k' }),
            processInputImages: async () => ['u_target', 'u_source'],
            processInputImagesPreserveOrder: async () => ['u_target', 'u_source'],
          },
        ),
      /workflow manifest missing/,
    );
  }),
  test('RunningHubAdapter 控制摄像机: nodeInfoList 映射图片和 <sks> 提示词', async () => {
    const _0x4bc2f1 = resolveModelExecution('runninghub/2053902968243671041');
    (assert.equal(_0x4bc2f1?.modelManifest?.displayName, '控制摄像机'),
      assert.equal(_0x4bc2f1?.executionManifest?.mapping?.promptNode?.prefix, '<sks> '));
    const _0x23faf6 = await buildImageRequest(
      { model: 'runninghub/2053902968243671041', inputUrls: ['local_image'] },
      'switch the camera perspective: wide shot, front view, eye-level shot',
      {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['uploaded_image'],
        processInputImagesPreserveOrder: async () => ['uploaded_image'],
      },
    );
    (assert.equal(_0x23faf6.url, '/api/v2/proxy/image'),
      assert.equal(
        _0x23faf6.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/run/ai-app/2053902968243671041',
      ),
      assert.equal(_0x23faf6.body.apiKey, 'k'),
      assert.equal(_0x23faf6.body.instanceType, 'default'),
      assert.equal(_0x23faf6.body.usePersonalQueue, 'false'));
    const _0x500668 = _0x23faf6.body.nodeInfoList,
      _0x28821c = (_0x16c61d, _0x393e00) =>
        _0x500668.find((_0xf6212) => _0xf6212.nodeId === _0x16c61d && _0xf6212.fieldName === _0x393e00);
    (assert.deepEqual(
      _0x500668.map((_0x574e56) => _0x574e56.nodeId),
      ['16', '23'],
    ),
      assert.equal(_0x28821c('16', 'image')?.fieldValue, 'uploaded_image'),
      assert.equal(_0x28821c('16', 'image')?.description, '载入图像'),
      assert.equal(_0x28821c('23', 'value')?.description, '提示词'),
      assert.equal(
        _0x28821c('23', 'value')?.fieldValue,
        '<sks> switch the camera perspective: wide shot, front view, eye-level shot',
      ));
  }),
  test('RunningHubAdapter 人物替换人物替换 V2.1: nodeInfoList 映射正确', async () => {
    const _0x1c3e95 = resolveModelExecution('runninghub/2050313968069165058');
    (assert.equal(_0x1c3e95?.modelManifest?.displayName, '人物替换人物替换V2.1'),
      assert.equal(_0x1c3e95?.executionManifest?.mapping?.imageNodes?.[0], '258'));
    const _0x288719 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_target', 'u_source'],
        processInputImagesPreserveOrder: async (_0x30d218) =>
          Array.isArray(_0x30d218) && _0x30d218[0] === '' && _0x30d218[1] === ''
            ? ['', '']
            : ['u_target', 'u_source'],
      },
      _0x3d8a62 = await buildImageRequest(
        {
          model: 'runninghub/2050313968069165058',
          inputUrls: ['local_target', 'local_source'],
          rhResolution: 0x640,
          rhInstanceType: 'plus',
        },
        'a prompt',
        _0x288719,
      );
    (assert.equal(_0x3d8a62.url, '/api/v2/proxy/image'),
      assert.equal(
        _0x3d8a62.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/run/ai-app/2050313968069165058',
      ),
      assert.equal(_0x3d8a62.body.apiKey, 'k'),
      assert.equal(_0x3d8a62.body.instanceType, 'plus'),
      assert.deepEqual(_0x3d8a62.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.person-replace-v21.v1',
        modelId: 'runninghub/2050313968069165058',
      }));
    const _0x15eef8 = _0x3d8a62.body.nodeInfoList,
      _0x21cf1a = (_0x1bf7e9, _0x28e1f2) =>
        _0x15eef8.find((_0x287c45) => _0x287c45.nodeId === _0x1bf7e9 && _0x287c45.fieldName === _0x28e1f2);
    (assert.equal(_0x21cf1a('258', 'image')?.fieldValue, 'u_target'),
      assert.equal(_0x21cf1a('265', 'image')?.fieldValue, 'u_source'),
      assert.equal(_0x21cf1a('232', 'value')?.fieldValue, 'a prompt'),
      assert.equal(_0x21cf1a('233', 'value')?.fieldValue, '1600'),
      assert.equal(_0x21cf1a('257', 'image'), undefined),
      assert.equal(_0x21cf1a('259', 'boolean'), undefined),
      assert.equal(_0x21cf1a('255', 'image'), undefined),
      assert.equal(_0x21cf1a('262', 'boolean'), undefined));
  }),
  test('RunningHubAdapter 漫画转真人：使用新版 ai-app 并映射节点参数', async () => {
    const _0x4b88b4 = resolveModelExecution('runninghub/1994718111704158209');
    (assert.equal(_0x4b88b4?.modelManifest?.displayName, '漫画转真人'),
      assert.equal(_0x4b88b4?.executionManifest?.mapping?.imageNodes?.[0], '851'));
    const _0x1752c2 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_ref'],
      },
      _0x2a2809 = await buildImageRequest(
        {
          model: 'runninghub/1994718111704158209',
          inputUrls: ['local_ref'],
          rhAnimeRealResolution: 0x640,
          rhInstanceType: 'plus',
        },
        'realistic portrait',
        _0x1752c2,
      );
    (assert.equal(_0x2a2809.url, '/api/v2/proxy/image'),
      assert.equal(
        _0x2a2809.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/run/ai-app/1994718111704158209',
      ),
      assert.equal(_0x2a2809.body.apiKey, 'k'),
      assert.equal(_0x2a2809.body.instanceType, 'plus'),
      assert.deepEqual(_0x2a2809.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.anime-real.v1',
        modelId: 'runninghub/1994718111704158209',
      }),
      assert.ok(Array.isArray(_0x2a2809.body.nodeInfoList)));
    const _0x7d8e7d = _0x2a2809.body.nodeInfoList,
      _0x1ab75b = (_0x652f53, _0xc4cc3b) =>
        _0x7d8e7d.find((_0x49ec6a) => _0x49ec6a.nodeId === _0x652f53 && _0x49ec6a.fieldName === _0xc4cc3b);
    (assert.equal(_0x1ab75b('851', 'image')?.fieldValue, 'u_ref'),
      assert.equal(_0x1ab75b('945', 'value')?.fieldValue, '1600'),
      assert.equal(_0x1ab75b('967', 'value')?.fieldValue, 'realistic portrait'));
  }),
  test('RunningHubAdapter Qwen image edit: maps one image with default mode values and 1.5K size', async () => {
    const _0x3b9979 = resolveModelExecution('runninghub/2050306122774532097');
    (assert.equal(_0x3b9979?.modelManifest?.displayName, 'Qwen-图像编辑'),
      assert.equal(_0x3b9979?.executionManifest?.submitMode, 'openapi-v2-ai-app'));
    const _0x6a5ac4 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_ref_1'],
      },
      _0xcf5698 = await buildImageRequest(
        {
          model: 'runninghub/2050306122774532097',
          inputUrls: ['local_ref_1'],
          aspectRatio: '1:1',
          imageSize: '1.5K',
          rhInstanceType: 'default',
        },
        'edit the image',
        _0x6a5ac4,
      );
    (assert.equal(_0xcf5698.url, '/api/v2/proxy/image'),
      assert.equal(
        _0xcf5698.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/run/ai-app/2050306122774532097',
      ),
      assert.equal(_0xcf5698.body.apiKey, 'k'),
      assert.equal(_0xcf5698.body.instanceType, 'default'),
      assert.deepEqual(_0xcf5698.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.qwen-image-edit.v1',
        modelId: 'runninghub/2050306122774532097',
      }));
    const _0xee5036 = _0xcf5698.body.nodeInfoList,
      _0x4c9878 = (_0x19fe20, _0x1dad6f) =>
        _0xee5036.find((_0x437e01) => _0x437e01.nodeId === _0x19fe20 && _0x437e01.fieldName === _0x1dad6f);
    (assert.equal(_0x4c9878('151', 'image')?.fieldValue, 'u_ref_1'),
      assert.equal(_0x4c9878('152', 'image'), undefined),
      assert.equal(_0x4c9878('157', 'image'), undefined),
      assert.equal(_0x4c9878('148', 'value')?.fieldValue, 'edit the image'),
      assert.equal(_0x4c9878('112', 'width')?.fieldValue, '1536'),
      assert.equal(_0x4c9878('112', 'height')?.fieldValue, '1536'),
      assert.equal(_0x4c9878('227', 'index')?.fieldValue, '0'),
      assert.equal(_0x4c9878('231', 'index')?.fieldValue, '1'),
      assert.equal(_0x4c9878('265', 'value')?.fieldValue, '0'));
  }),
  test('RunningHubAdapter Qwen image edit: maps three images, 2509 mode, depth control, and 16:9 2K size', async () => {
    const _0x1ab1aa = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_ref_1', 'u_ref_2', 'u_ref_3', 'u_ref_4'],
      },
      _0x34510f = await buildImageRequest(
        {
          model: 'runninghub/2050306122774532097',
          inputUrls: ['local_ref_1', 'local_ref_2', 'local_ref_3', 'local_ref_4'],
          aspectRatio: '16:9',
          imageSize: '2K',
          rhQwenEditMode: 'qwen2509',
          rhQwenFirstImageMode: 'depth',
          rhInstanceType: 'plus',
        },
        'keep the product consistent',
        _0x1ab1aa,
      );
    assert.equal(_0x34510f.body.instanceType, 'plus');
    const _0x7f0438 = _0x34510f.body.nodeInfoList,
      _0x1e304b = (_0x27a87a, _0x178122) =>
        _0x7f0438.find((_0x48f8a6) => _0x48f8a6.nodeId === _0x27a87a && _0x48f8a6.fieldName === _0x178122);
    (assert.equal(_0x1e304b('151', 'image')?.fieldValue, 'u_ref_1'),
      assert.equal(_0x1e304b('152', 'image')?.fieldValue, 'u_ref_2'),
      assert.equal(_0x1e304b('157', 'image')?.fieldValue, 'u_ref_3'),
      assert.equal(
        _0x7f0438.some((_0x2cb795) => _0x2cb795.fieldValue === 'u_ref_4'),
        false,
      ),
      assert.equal(_0x1e304b('148', 'value')?.fieldValue, 'keep the product consistent'),
      assert.equal(_0x1e304b('112', 'width')?.fieldValue, '1920'),
      assert.equal(_0x1e304b('112', 'height')?.fieldValue, '1088'),
      assert.equal(_0x1e304b('227', 'index')?.fieldValue, '2'),
      assert.equal(_0x1e304b('231', 'index')?.fieldValue, '0'),
      assert.equal(_0x1e304b('265', 'value')?.fieldValue, '2'));
  }),
  test('RunningHubAdapter Qwen image edit: requires at least one image', async () => {
    const _0x2d6677 = { getProviderConfig: () => ({ apiKey: 'k' }), processInputImages: async () => [] };
    await assert.rejects(
      () => buildImageRequest({ model: 'runninghub/2050306122774532097', inputUrls: [] }, 'edit', _0x2d6677),
      /请先添加至少一张参考图再生成/,
    );
  }),
  test('RunningHubAdapter 人物替换图片编辑 V3: mask 存在时写入 1180/1185 与 1177/1186', async () => {
    const _0x26d087 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_target', 'u_source'],
        processInputImagesPreserveOrder: async (_0x76a0fc) =>
          Array.isArray(_0x76a0fc) && _0x76a0fc[0] === '' && _0x76a0fc[1] === ''
            ? ['', '']
            : Array.isArray(_0x76a0fc) && _0x76a0fc[0] === 'm_target' && _0x76a0fc[1] === 'm_source'
              ? ['mask_0', 'mask_1']
              : ['u_target', 'u_source'],
      },
      _0x1d1b3a = await buildImageRequest(
        {
          model: 'runninghub/2041177685895946242',
          inputUrls: ['local_target', 'local_source'],
          inputMaskUrls: ['m_target', 'm_source'],
          rhResolution: 0x5a0,
          rhInstanceType: 'default',
        },
        'p',
        _0x26d087,
      ),
      _0x2be31e = _0x1d1b3a.body.nodeInfoList,
      _0x44ef89 = (_0x201ee6, _0x34238d) =>
        _0x2be31e.find((_0x21ecb6) => _0x21ecb6.nodeId === _0x201ee6 && _0x21ecb6.fieldName === _0x34238d);
    (assert.equal(_0x44ef89('1180', 'image')?.fieldValue, 'mask_0'),
      assert.equal(_0x44ef89('1185', 'boolean')?.fieldValue, 'true'),
      assert.equal(_0x44ef89('1177', 'image')?.fieldValue, 'mask_1'),
      assert.equal(_0x44ef89('1186', 'boolean')?.fieldValue, 'true'));
  }),
  test('RunningHubAdapter 人物替换图片编辑 V3: 提示词为空时 594 使用默认 "4k,高清画质"', async () => {
    const _0x5a583e = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_target', 'u_source'],
        processInputImagesPreserveOrder: async (_0x4197f0) =>
          Array.isArray(_0x4197f0) && _0x4197f0[0] === '' && _0x4197f0[1] === ''
            ? ['', '']
            : ['u_target', 'u_source'],
      },
      _0x27ce17 = await buildImageRequest(
        {
          model: 'runninghub/2041177685895946242',
          inputUrls: ['local_target', 'local_source'],
          rhResolution: 0x5a0,
          rhInstanceType: 'default',
        },
        '   ',
        _0x5a583e,
      ),
      _0x15df24 = _0x27ce17.body.nodeInfoList,
      _0xd6610f = (_0x487703, _0x1c5c60) =>
        _0x15df24.find((_0x455611) => _0x455611.nodeId === _0x487703 && _0x455611.fieldName === _0x1c5c60);
    assert.equal(_0xd6610f('594', 'value')?.fieldValue, '4k,高清画质');
  }),
  test('RunningHubAdapter 人物替换人物替换 V2.1: mask 与默认提示词映射正确', async () => {
    const _0x2a39a7 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_target', 'u_source'],
        processInputImagesPreserveOrder: async (_0x592989) =>
          Array.isArray(_0x592989) && _0x592989[0] === 'm_target' && _0x592989[1] === 'm_source'
            ? ['mask_0', 'mask_1']
            : Array.isArray(_0x592989) && _0x592989[0] === '' && _0x592989[1] === ''
              ? ['', '']
              : ['u_target', 'u_source'],
      },
      _0x269385 = await buildImageRequest(
        {
          model: 'runninghub/2050313968069165058',
          inputUrls: ['local_target', 'local_source'],
          inputMaskUrls: ['m_target', 'm_source'],
          rhResolution: 0x5a0,
          rhInstanceType: 'default',
        },
        '   ',
        _0x2a39a7,
      ),
      _0x5da773 = _0x269385.body.nodeInfoList,
      _0x561077 = (_0x3cb8f0, _0x1098c2) =>
        _0x5da773.find((_0x4219fe) => _0x4219fe.nodeId === _0x3cb8f0 && _0x4219fe.fieldName === _0x1098c2);
    (assert.equal(_0x561077('257', 'image')?.fieldValue, 'mask_0'),
      assert.equal(_0x561077('259', 'boolean')?.fieldValue, 'true'),
      assert.equal(_0x561077('255', 'image')?.fieldValue, 'mask_1'),
      assert.equal(_0x561077('262', 'boolean')?.fieldValue, 'true'),
      assert.equal(_0x561077('232', 'value')?.fieldValue, '4K'),
      assert.equal(_0x561077('233', 'value')?.fieldValue, '1440'));
  }),
  test('RunningHubAdapter 人物替换人物替换 V2.1: 默认模式允许 1440/1600/1920', async () => {
    const _0xf5ad5b = globalThis.window;
    globalThis.window = { ADVANCED_MODE: false };
    try {
      const _0x38b5eb = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_target', 'u_source'],
        processInputImagesPreserveOrder: async (_0x4320e0) =>
          Array.isArray(_0x4320e0) && _0x4320e0[0] === '' && _0x4320e0[1] === ''
            ? ['', '']
            : ['u_target', 'u_source'],
      };
      for (const _0xfe870c of [0x5a0, 0x640, 0x780]) {
        const _0x417f81 = await buildImageRequest(
            {
              model: 'runninghub/2050313968069165058',
              inputUrls: ['local_target', 'local_source'],
              rhResolution: _0xfe870c,
            },
            'prompt',
            _0x38b5eb,
          ),
          _0x56cc7e = _0x417f81.body.nodeInfoList.find(
            (_0x53b4f7) => _0x53b4f7.nodeId === '233' && _0x53b4f7.fieldName === 'value',
          );
        assert.equal(_0x56cc7e?.fieldValue, String(_0xfe870c));
      }
    } finally {
      if (typeof _0xf5ad5b === 'undefined') delete globalThis.window;
      else globalThis.window = _0xf5ad5b;
    }
  }),
  test('RunningHubAdapter 视频擦除：nodeInfoList 映射正确（117/122/105/63）', async () => {
    const _0x810b62 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputVideos: async () => ['https://www.runninghub.cn/uploaded-video.mp4'],
        processInputImages: async () => ['https://www.runninghub.cn/uploaded-mask.png'],
      },
      { buildVideoRequest: _0x57e29e } = await import('./RunningHubAdapter.js'),
      _0x20efb7 = await _0x57e29e(
        {
          model: 'runninghub/video_matting',
          videoUrl: 'https://www.runninghub.cn/test.mp4',
          maskImageDataUrl: 'data:image/png;base64,ZmFrZQ==',
          sourceFrameCount: 77,
        },
        '',
        _0x810b62,
      );
    (assert.equal(_0x20efb7.url, '/api/v2/video/matting/run'),
      assert.equal(_0x20efb7.useOpenapiQuery, true),
      assert.equal(_0x20efb7.body.apiKey, 'k'),
      assert.equal(_0x20efb7.body.appId, '2042569732972355585'),
      assert.equal(_0x20efb7.body.instanceType, 'default'),
      assert.equal(_0x20efb7.body.usePersonalQueue, 'false'),
      assert.ok(Array.isArray(_0x20efb7.body.nodeInfoList)));
    const _0x3854ab = _0x20efb7.body.nodeInfoList,
      _0x3d114f = (_0x1f6bd8, _0x29007b) =>
        _0x3854ab.find((_0x493286) => _0x493286.nodeId === _0x1f6bd8 && _0x493286.fieldName === _0x29007b);
    (assert.equal(_0x3d114f('117', 'video')?.fieldValue, 'https://www.runninghub.cn/uploaded-video.mp4'),
      assert.equal(_0x3d114f('117', 'frame_load_cap')?.fieldValue, '77'),
      assert.equal(_0x3d114f('122', 'value')?.fieldValue, '24'),
      assert.equal(_0x3d114f('105', 'value')?.fieldValue, '1024'),
      assert.equal(_0x3d114f('63', 'image')?.fieldValue, 'https://www.runninghub.cn/uploaded-mask.png'),
      assert.equal(
        _0x3854ab.some((_0x24eb56) => _0x24eb56.nodeId === '71'),
        false,
      ),
      assert.equal(
        _0x3854ab.some((_0x2c24ca) => _0x2c24ca.nodeId === '72'),
        false,
      ),
      assert.equal(
        _0x3854ab.some((_0x3b2bb9) => _0x3b2bb9.nodeId === '67'),
        false,
      ),
      assert.equal(
        _0x3854ab.some((_0x229cc7) => _0x229cc7.nodeId === '35'),
        false,
      ));
  }),
  test('RunningHubAdapter 视频抠像：默认模式允许 30 帧', async () => {
    const _0x5edd41 = globalThis.window;
    globalThis.window = { ADVANCED_MODE: false };
    try {
      const _0x59ee2a = {
          getProviderConfig: () => ({ apiKey: 'k' }),
          processInputVideos: async () => ['https://www.runninghub.cn/uploaded-video.mp4'],
          processInputImages: async () => ['https://www.runninghub.cn/uploaded-mask.png'],
        },
        _0x1bda3f = await buildVideoRequest(
          {
            model: 'runninghub/video_matting',
            videoUrl: 'https://www.runninghub.cn/test.mp4',
            maskImageDataUrl: 'data:image/png;base64,ZmFrZQ==',
            sourceFrameCount: 77,
            rhVideoFps: 30,
          },
          '',
          _0x59ee2a,
        ),
        _0x1aee0e = (_0x3b0abd, _0x18753b) =>
          _0x1bda3f.body.nodeInfoList.find(
            (_0x5d9616) => _0x5d9616.nodeId === _0x3b0abd && _0x5d9616.fieldName === _0x18753b,
          );
      assert.equal(_0x1aee0e('122', 'value')?.fieldValue, '30');
    } finally {
      if (typeof _0x5edd41 === 'undefined') delete globalThis.window;
      else globalThis.window = _0x5edd41;
    }
  }),
  test('RunningHubAdapter 视频抠像：上传源视频并正确映射抠像模式（55/video + 67/index）', async () => {
    const _0x46fbbe = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputVideos: async () => ['https://www.runninghub.cn/uploaded-video.mp4'],
      },
      _0x32a1fd = [
        { rhMaskMode: 'Sec', expected: '0' },
        { rhMaskMode: 'Sam3', expected: '1' },
        { rhMaskMode: 'MA2', expected: '2' },
        { rhMaskMode: 'MatAnyone2', expected: '2' },
        { rhMaskMode: undefined, expected: '0' },
        { rhMaskMode: 'unknown', expected: '0' },
      ];
    for (const { rhMaskMode: _0x52244c, expected: _0x474f5b } of _0x32a1fd) {
      const _0x188777 = await buildVideoRequest(
          {
            model: 'runninghub/video_matting',
            videoUrl: 'https://www.runninghub.cn/test.mp4',
            pos_points: '[{"x":1,"y":2}]',
            neg_points: '[]',
            frame_index: 12,
            rhMaskMode: _0x52244c,
          },
          '',
          _0x46fbbe,
        ),
        _0x3d1d40 = _0x188777.body.nodeInfoList,
        _0x23361c = (_0x20da2a, _0x4b925e) =>
          _0x3d1d40.find((_0x2f50c0) => _0x2f50c0.nodeId === _0x20da2a && _0x2f50c0.fieldName === _0x4b925e);
      (assert.equal(_0x23361c('55', 'video')?.fieldValue, 'https://www.runninghub.cn/uploaded-video.mp4'),
        assert.equal(_0x23361c('67', 'index')?.fieldValue, _0x474f5b, 'rhMaskMode=' + String(_0x52244c)));
    }
  }),
  test('RunningHubAdapter 视频抠像: 缺少视频上传能力时抛错', async () => {
    const _0x17818a = { getProviderConfig: () => ({ apiKey: 'k' }) };
    await assert.rejects(
      buildVideoRequest(
        {
          model: 'runninghub/video_matting',
          videoUrl: 'https://www.runninghub.cn/test.mp4',
          pos_points: '[{"x":1,"y":2}]',
          neg_points: '[]',
          frame_index: 12,
        },
        '',
        _0x17818a,
      ),
      /缺少 RunningHUB 视频上传能力/,
    );
  }),
  test('RunningHubAdapter 视频抠像: 视频上传失败时抛错', async () => {
    const _0x49853d = { getProviderConfig: () => ({ apiKey: 'k' }), processInputVideos: async () => [] };
    await assert.rejects(
      buildVideoRequest(
        {
          model: 'runninghub/video_matting',
          videoUrl: 'https://www.runninghub.cn/test.mp4',
          pos_points: '[{"x":1,"y":2}]',
          neg_points: '[]',
          frame_index: 12,
        },
        '',
        _0x49853d,
      ),
      /源视频上传失败/,
    );
  }),
  test('RunningHubAdapter LTX2.3: nodeInfoList 映射正确', async () => {
    const _0x4ce55c = resolveModelExecution('runninghub/2039336644536442882');
    (assert.equal(_0x4ce55c?.modelManifest?.displayName, 'LTX2.3唱歌数字人'),
      assert.equal(_0x4ce55c?.executionManifest?.mapping?.preset, undefined),
      assert.equal(
        _0x4ce55c?.executionManifest?.mapping?.nodeInfoList?.find((_0x19f33d) => _0x19f33d.nodeId === '303')
          ?.source,
        'prompt',
      ),
      assert.equal(
        _0x4ce55c?.executionManifest?.mapping?.nodeInfoList?.find((_0x1e8a28) => _0x1e8a28.nodeId === '332')
          ?.source,
        'audioInput',
      ));
    const _0x2ae54d = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_img'],
      },
      { buildVideoRequest: _0x3ab858 } = await import('./RunningHubAdapter.js'),
      _0x402a3f = await _0x3ab858(
        {
          model: 'runninghub/2039336644536442882',
          inputUrls: ['local_img'],
          audioUrl: 'https://www.runninghub.cn/test.mp3',
          rhVideoResolution: 0x400,
          rhVideoFps: 24,
          rhVideoSeconds: 6,
          rhInstanceType: 'default',
        },
        'a prompt',
        _0x2ae54d,
      );
    (assert.equal(_0x402a3f.url, '/api/v2/runninghubwf/run'),
      assert.equal(_0x402a3f.body.apiKey, 'k'),
      assert.equal(_0x402a3f.body.workflowId, '2039336644536442882'),
      assert.equal(_0x402a3f.body.instanceType, 'default'),
      assert.deepEqual(_0x402a3f.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.video-ltx23.v1',
        modelId: 'runninghub/2039336644536442882',
      }),
      assert.ok(Array.isArray(_0x402a3f.body.nodeInfoList)));
    const _0x694617 = _0x402a3f.body.nodeInfoList,
      _0x37bd12 = (_0x4f31f5, _0x4fc892) =>
        _0x694617.find((_0x48ffe4) => _0x48ffe4.nodeId === _0x4f31f5 && _0x48ffe4.fieldName === _0x4fc892);
    (assert.equal(_0x37bd12('303', 'value')?.fieldValue, 'a prompt'),
      assert.equal(_0x37bd12('347', 'value')?.fieldValue, '1024'),
      assert.equal(_0x37bd12('346', 'value')?.fieldValue, '24'),
      assert.equal(_0x37bd12('349', 'value')?.fieldValue, '6'),
      assert.equal(_0x37bd12('269', 'image')?.fieldValue, 'u_img'),
      assert.equal(_0x37bd12('332', 'audio')?.fieldValue, 'https://www.runninghub.cn/test.mp3'));
  }),
  test('RunningHubAdapter 商业级数字人：ai-app 节点映射正确', async () => {
    const _0x2591f0 = resolveModelExecution('runninghub/2055639633148563458');
    (assert.equal(_0x2591f0?.modelManifest?.displayName, '商业级数字人'),
      assert.equal(_0x2591f0?.modelManifest?.description, '主攻唱歌音频'),
      assert.equal(_0x2591f0?.executionManifest?.mapping?.preset, undefined),
      assert.equal(
        _0x2591f0?.executionManifest?.mapping?.nodeInfoList?.find((_0x34951d) => _0x34951d.nodeId === '100')
          ?.source,
        'imageInput',
      ),
      assert.equal(
        _0x2591f0?.executionManifest?.mapping?.nodeInfoList?.find((_0x1f3b75) => _0x1f3b75.nodeId === '119')
          ?.source,
        'audioInput',
      ));
    const _0x53be8a = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_img'],
      },
      _0x3137d8 = await buildVideoRequest(
        {
          model: 'runninghub/2055639633148563458',
          inputUrls: ['local_img'],
          audioUrl: 'https://www.runninghub.cn/song.mp3',
          generationParams: {
            rhVideoResolution: 0x500,
            rhDigitalHumanMotionAmplitude: '2',
            rhDigitalHumanSceneMotionAmplitude: '1',
          },
          rhInstanceType: 'plus',
        },
        '',
        _0x53be8a,
      );
    (assert.equal(_0x3137d8.url, '/api/v2/proxy/image'),
      assert.equal(
        _0x3137d8.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/run/ai-app/2055639633148563458',
      ),
      assert.equal(_0x3137d8.body.apiKey, 'k'),
      assert.equal(_0x3137d8.body.instanceType, 'plus'),
      assert.equal(_0x3137d8.body.usePersonalQueue, 'false'),
      assert.deepEqual(_0x3137d8.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.video-commercial-digital-human.v1',
        modelId: 'runninghub/2055639633148563458',
      }));
    const _0x2dfc68 = _0x3137d8.body.nodeInfoList,
      _0x3c7808 = (_0x27b64e, _0x4cea56) =>
        _0x2dfc68.find((_0xfe7cc9) => _0xfe7cc9.nodeId === _0x27b64e && _0xfe7cc9.fieldName === _0x4cea56);
    (assert.equal(_0x3c7808('100', 'image')?.fieldValue, 'u_img'),
      assert.equal(_0x3c7808('119', 'audio')?.fieldValue, 'https://www.runninghub.cn/song.mp3'),
      assert.equal(_0x3c7808('114', 'value')?.fieldValue, '1280'),
      assert.equal(_0x3c7808('118', 'value')?.fieldValue, '150'),
      assert.equal(_0x3c7808('117', 'value')?.fieldValue, '女人在唱歌，镜头晃动'),
      assert.equal(_0x3c7808('201', 'value')?.fieldValue, '2'),
      assert.equal(_0x3c7808('204', 'value')?.fieldValue, '1'));
  }),
  test('RunningHubAdapter 视频编辑-基础版：manifest 映射源视频和参考图', async () => {
    const _0x40da33 = resolveModelExecution('runninghub/1971148165531475969');
    (assert.equal(_0x40da33?.modelManifest?.displayName, '视频编辑-基础版'),
      assert.equal(_0x40da33?.executionManifest?.mapping?.preset, undefined),
      assert.equal(
        _0x40da33?.executionManifest?.mapping?.nodeInfoList?.find((_0x1fe9b0) => _0x1fe9b0.nodeId === '237')
          ?.source,
        'videoInput',
      ),
      assert.equal(
        _0x40da33?.executionManifest?.mapping?.nodeInfoList?.find((_0x51733a) => _0x51733a.nodeId === '234')
          ?.source,
        'imageInput',
      ));
    const _0x171643 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_ref'],
      },
      _0x28c047 = await buildVideoRequest(
        {
          model: 'runninghub/1971148165531475969',
          videoUrl: 'https://www.runninghub.cn/source.mp4',
          inputUrls: ['local_ref'],
          rhVideoFps: 16,
          rhVideoResolution: 0x400,
          rhVideoFrames: 90,
          rhEnableMask: true,
        },
        'basic prompt',
        _0x171643,
      );
    (assert.equal(_0x28c047.url, '/api/v2/proxy/image'),
      assert.equal(
        _0x28c047.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/run/ai-app/1971148165531475969',
      ),
      assert.deepEqual(_0x28c047.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.video-basic.v1',
        modelId: 'runninghub/1971148165531475969',
      }));
    const _0x240d87 = _0x28c047.body.nodeInfoList,
      _0x5df407 = (_0x314885, _0x3a46ab) =>
        _0x240d87.find((_0x4f6b22) => _0x4f6b22.nodeId === _0x314885 && _0x4f6b22.fieldName === _0x3a46ab);
    (assert.equal(_0x5df407('237', 'video')?.fieldValue, 'https://www.runninghub.cn/source.mp4'),
      assert.equal(_0x5df407('234', 'image')?.fieldValue, 'u_ref'),
      assert.equal(_0x5df407('397', 'value')?.fieldValue, '16'),
      assert.equal(_0x5df407('222', 'value')?.fieldValue, '1024'),
      assert.equal(_0x5df407('392', 'value')?.fieldValue, '90'),
      assert.equal(_0x5df407('235', 'value')?.fieldValue, 'basic prompt'),
      assert.equal(_0x5df407('396', 'value')?.fieldValue, 'true'));
  }),
  test('RunningHubAdapter 视频去字幕V2：通用 manifest 映射单视频和高级参数', async () => {
    const _0x578270 = resolveModelExecution('runninghub/2060613773890768898');
    (assert.equal(_0x578270?.modelManifest?.displayName, '视频去字幕V2'),
      assert.equal(_0x578270?.executionManifest?.extensions?.payloadResolver, undefined),
      assert.equal(_0x578270?.executionManifest?.appId, '2060613773890768898'),
      assert.equal(
        _0x578270?.executionManifest?.mapping?.nodeInfoList?.find(
          (_0x30c557) => _0x30c557.nodeId === '1' && _0x30c557.fieldName === 'video',
        )?.source,
        'videoInput',
      ));
    let _0x39037c = [];
    const _0x533190 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async (_0x4b2d8b) => {
          return ((_0x39037c = _0x4b2d8b), ['https://www.runninghub.cn/uploaded-mask.png']);
        },
      },
      _0x118751 = await buildVideoRequest(
        {
          model: 'runninghub/2060613773890768898',
          videoUrl: 'https://www.runninghub.cn/source.mp4',
          generationParams: { rhWatermarkRemoveMode: 'mode2', rhRemoveWatermark: true },
          maskImageDataUrl: '/data/mask/manual-mask.png',
          rhVideoFrames: 12,
          rhVideoFps: 30,
          rhVideoResolution: 0x3c0,
        },
        '',
        _0x533190,
      );
    (assert.deepEqual(_0x39037c, ['/data/mask/manual-mask.png']),
      assert.equal(_0x118751.url, '/api/v2/proxy/image'),
      assert.equal(
        _0x118751.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/run/ai-app/2060613773890768898',
      ),
      assert.equal(_0x118751.body.apiKey, 'k'),
      assert.equal(_0x118751.body.instanceType, 'default'),
      assert.equal(_0x118751.body.usePersonalQueue, 'false'),
      assert.deepEqual(_0x118751.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.video-watermark-removal-v2.v1',
        modelId: 'runninghub/2060613773890768898',
      }));
    const _0x3ce0c8 = _0x118751.body.nodeInfoList,
      _0xb1c5f = (_0x130b5a, _0x36d658) =>
        _0x3ce0c8.find((_0x1a8188) => _0x1a8188.nodeId === _0x130b5a && _0x1a8188.fieldName === _0x36d658);
    (assert.equal(_0xb1c5f('1', 'video')?.fieldValue, 'https://www.runninghub.cn/source.mp4'),
      assert.equal(_0xb1c5f('134', 'value')?.fieldValue, '1'),
      assert.equal(_0xb1c5f('1', 'frame_load_cap')?.fieldValue, '12'),
      assert.equal(_0xb1c5f('85', 'value')?.fieldValue, '30'),
      assert.equal(_0xb1c5f('31', 'value')?.fieldValue, '960'),
      assert.equal(_0xb1c5f('144', 'value')?.fieldValue, 'true'),
      assert.equal(_0xb1c5f('326', 'index')?.fieldValue, '1'),
      assert.equal(_0xb1c5f('329', 'image')?.fieldValue, 'https://www.runninghub.cn/uploaded-mask.png'));
  }),
  test('RunningHubAdapter 视频去字幕V2：缺省参数保持接口示例默认值', async () => {
    const _0x3a138c = { getProviderConfig: () => ({ apiKey: 'k' }) },
      _0x7cfb24 = await buildVideoRequest(
        { model: 'runninghub/2060613773890768898', videoUrl: 'https://www.runninghub.cn/source.mp4' },
        '',
        _0x3a138c,
      ),
      _0x3e8dcb = (_0x2ca157, _0x28222b) =>
        _0x7cfb24.body.nodeInfoList.find(
          (_0x40e5b8) => _0x40e5b8.nodeId === _0x2ca157 && _0x40e5b8.fieldName === _0x28222b,
        );
    (assert.equal(_0x3e8dcb('134', 'value')?.fieldValue, '0'),
      assert.equal(_0x3e8dcb('1', 'frame_load_cap')?.fieldValue, '0'),
      assert.equal(_0x3e8dcb('85', 'value')?.fieldValue, '24'),
      assert.equal(_0x3e8dcb('31', 'value')?.fieldValue, '960'),
      assert.equal(_0x3e8dcb('144', 'value')?.fieldValue, 'false'),
      assert.equal(_0x3e8dcb('326', 'index'), undefined),
      assert.equal(_0x3e8dcb('329', 'image'), undefined));
  }),
  test('RunningHubAdapter 视频对口型：ai-app 节点映射正确', async () => {
    const _0x2a5587 = resolveModelExecution('runninghub/2054101324521844738');
    (assert.equal(_0x2a5587?.modelManifest?.displayName, '视频对口型'),
      assert.equal(_0x2a5587?.executionManifest?.mapping?.preset, undefined),
      assert.equal(
        _0x2a5587?.executionManifest?.mapping?.nodeInfoList?.find((_0x3152a9) => _0x3152a9.nodeId === '383')
          ?.source,
        'videoInput',
      ),
      assert.equal(
        _0x2a5587?.executionManifest?.mapping?.nodeInfoList?.find((_0x1a9269) => _0x1a9269.nodeId === '390')
          ?.source,
        'imageInput',
      ),
      assert.equal(
        _0x2a5587?.executionManifest?.mapping?.nodeInfoList?.find((_0x5c8622) => _0x5c8622.nodeId === '367')
          ?.source,
        'audioInput',
      ));
    const _0x2902dc = { getProviderConfig: () => ({ apiKey: 'k' }), processInputImages: async () => [] },
      _0x22d8f9 = await buildVideoRequest(
        {
          model: 'runninghub/2054101324521844738',
          videoUrl: 'https://www.runninghub.cn/source.mp4',
          audioUrl: 'https://www.runninghub.cn/audio.mp3',
          rhVideoFrames: 120,
          rhVideoResolution: 0x200,
          rhInstanceType: 'plus',
          rhLipSyncInputIndex: 1,
          prompt: 'lip sync prompt',
        },
        'ignored fallback',
        _0x2902dc,
      );
    (assert.equal(_0x22d8f9.url, '/api/v2/proxy/image'),
      assert.equal(
        _0x22d8f9.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/run/ai-app/2054101324521844738',
      ),
      assert.equal(_0x22d8f9.body.apiKey, 'k'),
      assert.equal(_0x22d8f9.body.instanceType, 'plus'),
      assert.equal(_0x22d8f9.body.usePersonalQueue, 'false'),
      assert.deepEqual(_0x22d8f9.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.video-lipsync.v1',
        modelId: 'runninghub/2054101324521844738',
      }));
    const _0x4dbf8b = _0x22d8f9.body.nodeInfoList,
      _0x3df287 = (_0x3106e6, _0x4ee6e1) =>
        _0x4dbf8b.find((_0x3934df) => _0x3934df.nodeId === _0x3106e6 && _0x3934df.fieldName === _0x4ee6e1);
    (assert.equal(_0x3df287('383', 'video')?.fieldValue, 'https://www.runninghub.cn/source.mp4'),
      assert.equal(_0x3df287('390', 'image'), undefined),
      assert.equal(_0x3df287('410', 'value')?.fieldValue, '120'),
      assert.equal(_0x3df287('392', 'value')?.fieldValue, '832'),
      assert.equal(_0x3df287('367', 'audio')?.fieldValue, 'https://www.runninghub.cn/audio.mp3'),
      assert.equal(_0x3df287('393', 'value')?.fieldValue, 'lip sync prompt'),
      assert.equal(_0x3df287('409', 'index')?.fieldValue, '1'));
  }),
  test('RunningHubAdapter 视频对口型：图片入参写入参考图节点并切 index=0', async () => {
    const _0x1c4f88 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_ref'],
      },
      _0x2e8488 = await buildVideoRequest(
        {
          model: 'runninghub/2054101324521844738',
          inputUrls: ['local-ref'],
          audioUrl: 'https://www.runninghub.cn/audio.mp3',
          rhVideoFrames: 20,
          rhVideoResolution: 0x400,
          rhLipSyncInputIndex: 0,
          prompt: 'lip sync from image',
        },
        '',
        _0x1c4f88,
      ),
      _0x566cea = _0x2e8488.body.nodeInfoList,
      _0x28d7ad = (_0x1668aa, _0x5df943) =>
        _0x566cea.find((_0x42e10f) => _0x42e10f.nodeId === _0x1668aa && _0x42e10f.fieldName === _0x5df943);
    (assert.equal(_0x28d7ad('390', 'image')?.fieldValue, 'u_ref'),
      assert.equal(_0x28d7ad('383', 'video'), undefined),
      assert.equal(_0x28d7ad('410', 'value')?.fieldValue, '20'),
      assert.equal(_0x28d7ad('392', 'value')?.fieldValue, '1024'),
      assert.equal(_0x28d7ad('367', 'audio')?.fieldValue, 'https://www.runninghub.cn/audio.mp3'),
      assert.equal(_0x28d7ad('393', 'value')?.fieldValue, 'lip sync from image'),
      assert.equal(_0x28d7ad('409', 'index')?.fieldValue, '0'));
  }),
  test('RunningHubAdapter 视频高清 VIP：通用 manifest 映射模式和源视频', async () => {
    const _0x31b08e = resolveModelExecution('runninghub/2047787809091620866');
    (assert.equal(_0x31b08e?.modelManifest?.displayName, '视频高清 VIP'),
      assert.equal(_0x31b08e?.executionManifest?.mapping?.preset, undefined),
      assert.equal(
        _0x31b08e?.executionManifest?.mapping?.nodeInfoList?.find((_0x131de9) => _0x131de9.nodeId === '10')
          ?.source,
        'param',
      ));
    const _0x2270aa = { getProviderConfig: () => ({ apiKey: 'k' }) },
      _0x43327b = await buildVideoRequest(
        {
          model: 'runninghub/2047787809091620866',
          videoUrl: 'https://www.runninghub.cn/source.mp4',
          hdMode: 'sharp',
          rhInstanceType: 'plus',
        },
        '',
        _0x2270aa,
      );
    (assert.equal(_0x43327b.url, '/api/v2/proxy/image'),
      assert.equal(
        _0x43327b.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/run/ai-app/2047787809091620866',
      ),
      assert.equal(_0x43327b.body.instanceType, 'plus'),
      assert.deepEqual(_0x43327b.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.video-hd-vip.v1',
        modelId: 'runninghub/2047787809091620866',
      }));
    const _0x107592 = _0x43327b.body.nodeInfoList,
      _0x46ffda = (_0x3a8b77, _0xbf1d11) =>
        _0x107592.find((_0x4593ba) => _0x4593ba.nodeId === _0x3a8b77 && _0x4593ba.fieldName === _0xbf1d11);
    (assert.equal(_0x46ffda('10', 'index')?.fieldValue, '1'),
      assert.equal(_0x46ffda('12', 'video')?.fieldValue, 'https://www.runninghub.cn/source.mp4'));
  }),
  test('RunningHubAdapter 视频编辑 V5.4 使用 ai-app 并按节点规则映射', async () => {
    const _0x3feb84 = resolveModelExecution('runninghub/2041741496667348994');
    (assert.equal(_0x3feb84?.modelManifest?.displayName, '视频编辑V5.4'),
      assert.equal(_0x3feb84?.executionManifest?.mapping?.preset, undefined),
      assert.equal(_0x3feb84?.executionManifest?.extensions?.payloadResolver, 'runninghubVideoV54'),
      assert.equal(_0x3feb84?.executionManifest?.mapping?.sourceVideoNode?.nodeId, '237'),
      assert.equal(_0x3feb84?.executionManifest?.mapping?.specialModeNode?.nodeId, '1063'));
    const _0x1eed7f = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async (_0x3097f7) => {
          const _0x46beb9 = String(_0x3097f7?.[0] || '');
          if (_0x46beb9 === 'ref_local') return ['u_ref'];
          if (_0x46beb9 === 'first_local') return ['u_first'];
          return [];
        },
      },
      _0x5e18d5 = await buildVideoRequest(
        {
          model: 'runninghub/2041741496667348994',
          videoUrl: 'https://www.runninghub.cn/source.mp4',
          inputUrls: ['ref_local'],
          firstFrameUrl: 'first_local',
          maskVideoUrl: 'https://www.runninghub.cn/mask.mp4',
          characterIntegration: true,
          controlMode: 'stable',
          subtractSubject: true,
          maskExpansion: 31,
          maskRect: true,
          frameRate: 30,
          frameCount: 88,
          rhVideoResolution: 0x500,
          specialMode: 'cameraMove',
          rhInstanceType: 'plus',
        },
        'a prompt',
        _0x1eed7f,
      );
    (assert.equal(_0x5e18d5.url, '/api/v2/proxy/image'),
      assert.equal(
        _0x5e18d5.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/run/ai-app/2041741496667348994',
      ),
      assert.equal(_0x5e18d5.body.apiKey, 'k'),
      assert.equal(_0x5e18d5.body.instanceType, 'plus'),
      assert.deepEqual(_0x5e18d5.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.video-v54.v1',
        modelId: 'runninghub/2041741496667348994',
      }));
    const _0x13f018 = _0x5e18d5.body.nodeInfoList,
      _0x408912 = (_0x4b4368, _0x10ba6a) =>
        _0x13f018.find((_0x10ef1f) => _0x10ef1f.nodeId === _0x4b4368 && _0x10ef1f.fieldName === _0x10ba6a);
    (assert.equal(_0x408912('235', 'value')?.fieldValue, 'a prompt'),
      assert.equal(_0x408912('915', 'value')?.fieldValue, 'true'),
      assert.equal(_0x408912('977', 'value')?.fieldValue, '1'),
      assert.equal(_0x408912('222', 'value')?.fieldValue, '1280'),
      assert.equal(_0x408912('1077', 'value')?.fieldValue, '30'),
      assert.equal(_0x408912('237', 'frame_load_cap')?.fieldValue, '88'),
      assert.equal(_0x408912('237', 'video')?.fieldValue, 'https://www.runninghub.cn/source.mp4'),
      assert.equal(_0x408912('234', 'image')?.fieldValue, 'u_ref'),
      assert.equal(_0x408912('1021', 'video')?.fieldValue, 'https://www.runninghub.cn/mask.mp4'),
      assert.equal(_0x408912('429', 'image')?.fieldValue, 'u_first'),
      assert.equal(_0x408912('988', 'value')?.fieldValue, '1'),
      assert.equal(_0x408912('1078', 'value'), undefined),
      assert.equal(_0x408912('240', 'value'), undefined),
      assert.equal(_0x408912('979', 'index'), undefined),
      assert.equal(_0x408912('1076', 'value'), undefined),
      assert.equal(_0x408912('1063', 'index')?.fieldValue, '2'),
      assert.equal(_0x408912('1081', 'index'), undefined),
      assert.equal(_0x408912('1113', 'value'), undefined),
      assert.equal(_0x408912('1100', 'value'), undefined));
  }),
  test('RunningHubAdapter 视频编辑V5.4：长视频叠加开启 1081 且抖胸幅度大于 0 时写入节点', async () => {
    const _0x5402a2 = { getProviderConfig: () => ({ apiKey: 'k' }), processInputImages: async () => [] },
      _0x44adcf = await buildVideoRequest(
        {
          model: 'runninghub/2041741496667348994',
          videoUrl: 'https://www.runninghub.cn/source.mp4',
          controlMode: 'efficiency',
          frameRate: 24,
          frameCount: 77,
          rhVideoResolution: 0x340,
          specialMode: 'longVideoOverlay',
          rhBreastJiggle: 0.35,
        },
        'overlay prompt',
        _0x5402a2,
      ),
      _0x2ebbcb = _0x44adcf.body.nodeInfoList,
      _0x106056 = (_0x36bea9, _0x5e6e86) =>
        _0x2ebbcb.find((_0x54900b) => _0x54900b.nodeId === _0x36bea9 && _0x54900b.fieldName === _0x5e6e86);
    (assert.equal(_0x106056('1063', 'index')?.fieldValue, '1'),
      assert.equal(_0x106056('1081', 'index')?.fieldValue, '1'),
      assert.equal(_0x106056('1113', 'value')?.fieldValue, '0.35'),
      assert.equal(_0x106056('1113', 'value')?.description, '抖胸幅度'),
      assert.equal(_0x106056('1100', 'value')?.fieldValue, 'true'),
      assert.equal(_0x106056('1100', 'value')?.description, '是否开抖胸'));
  }),
  test('RunningHubAdapter 视频编辑V5.4：仅在满足条件时加入可选节点并回退默认提示词', async () => {
    const _0x1359d6 = { getProviderConfig: () => ({ apiKey: 'k' }), processInputImages: async () => [] },
      _0x5cf407 = await buildVideoRequest(
        {
          model: 'runninghub/2041741496667348994',
          videoUrl: 'https://www.runninghub.cn/source.mp4',
          controlMode: 'efficiency',
          subtractSubject: false,
          frameRate: 24,
          frameCount: 77,
          rhVideoResolution: 0x340,
        },
        '   ',
        _0x1359d6,
      ),
      _0x5c1244 = _0x5cf407.body.nodeInfoList,
      _0x5a96de = (_0x4dba2c, _0x3e5811) =>
        _0x5c1244.find((_0x24344c) => _0x24344c.nodeId === _0x4dba2c && _0x24344c.fieldName === _0x3e5811);
    (assert.equal(_0x5a96de('235', 'value')?.fieldValue, '4K，高质量'),
      assert.equal(_0x5a96de('977', 'value')?.fieldValue, '0'),
      assert.equal(_0x5a96de('1021', 'video'), undefined),
      assert.equal(_0x5a96de('429', 'image'), undefined),
      assert.equal(_0x5a96de('988', 'value'), undefined),
      assert.equal(_0x5a96de('1078', 'value'), undefined),
      assert.equal(_0x5a96de('240', 'value'), undefined),
      assert.equal(_0x5a96de('979', 'index'), undefined),
      assert.equal(_0x5a96de('1076', 'value'), undefined),
      assert.equal(_0x5a96de('1063', 'index'), undefined),
      assert.equal(_0x5a96de('1081', 'index'), undefined),
      assert.equal(_0x5a96de('1113', 'value'), undefined),
      assert.equal(_0x5a96de('1100', 'value'), undefined));
  }),
  [
    {
      name: 'Scail V1',
      modelId: 'runninghub/2064961300823896065',
      displayName: '视频编辑Scail V1',
      appId: '2064961300823896065',
      executionId: 'runninghub.workflow.video-scail2-v1.v1',
    },
    {
      name: 'Scail V2',
      modelId: 'runninghub/2065463417577762818',
      displayName: '视频编辑Scail V2',
      appId: '2065463417577762818',
      executionId: 'runninghub.workflow.video-scail-v2.v1',
      hasEnhancedMotionControl: true,
    },
  ].forEach(
    ({
      name: _0x58c832,
      modelId: _0xc2e03c,
      displayName: _0x26fcbe,
      appId: _0x34c3c2,
      executionId: _0x19db26,
      hasEnhancedMotionControl: hasEnhancedMotionControl = false,
    }) => {
      test('RunningHubAdapter ' + _0x58c832 + ' uses generic ai-app nodeInfoList mapping', async () => {
        const _0x540bce = resolveModelExecution(_0xc2e03c);
        (assert.equal(_0x540bce?.modelManifest?.displayName, _0x26fcbe),
          assert.equal(_0x540bce?.executionManifest?.mapping?.preset, undefined),
          assert.equal(_0x540bce?.executionManifest?.extensions?.payloadResolver, undefined));
        const _0x358481 = {
            getProviderConfig: () => ({ apiKey: 'k' }),
            processInputImages: async (_0x45b9b5) =>
              String(_0x45b9b5?.[0] || '') === 'ref_local' ? ['u_ref'] : [],
          },
          _0x5223f9 = {
            rhVideoResolution: 0x340,
            rhVideoFps: 24,
            rhVideoFrames: 0x12c,
            rhScail2PersonCount: 2,
            rhScailDetectPrompt: 'person, face',
            rhScail2ReplaceSubject: true,
          };
        hasEnhancedMotionControl && (_0x5223f9.rhScailV2EnhancedMotionControl = true);
        const _0x2e0f51 = await buildVideoRequest(
          {
            model: _0xc2e03c,
            videoUrl: 'https://www.runninghub.cn/source.mp4',
            inputUrls: ['ref_local'],
            generationParams: _0x5223f9,
            rhInstanceType: 'plus',
          },
          '   ',
          _0x358481,
        );
        (assert.equal(_0x2e0f51.url, '/api/v2/proxy/image'),
          assert.equal(_0x2e0f51.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/' + _0x34c3c2),
          assert.equal(_0x2e0f51.body.apiKey, 'k'),
          assert.equal(_0x2e0f51.body.instanceType, 'plus'),
          assert.deepEqual(_0x2e0f51.adapterTrace, {
            source: 'manifest',
            executionId: _0x19db26,
            modelId: _0xc2e03c,
          }));
        const _0x9956b4 = _0x2e0f51.body.nodeInfoList,
          _0x1baf33 = [
            ['336', 'video'],
            ['338', 'image'],
            ['444', 'value'],
            ['324', 'value'],
            ['383', 'value'],
            ['318', 'value'],
            ['317', 'value'],
            ['336', 'force_rate'],
            ['336', 'frame_load_cap'],
          ];
        hasEnhancedMotionControl && _0x1baf33.push(['458', 'value']);
        assert.deepEqual(
          _0x9956b4.map((_0x562697) => [_0x562697.nodeId, _0x562697.fieldName]),
          _0x1baf33,
        );
        const _0xd39884 = (_0x4ad999, _0x358cb9) =>
          _0x9956b4.find((_0x5dc58a) => _0x5dc58a.nodeId === _0x4ad999 && _0x5dc58a.fieldName === _0x358cb9);
        (assert.equal(_0xd39884('336', 'video')?.fieldValue, 'https://www.runninghub.cn/source.mp4'),
          assert.equal(_0xd39884('338', 'image')?.fieldValue, 'u_ref'),
          assert.equal(_0xd39884('444', 'value')?.fieldValue, 'true'),
          assert.equal(_0xd39884('324', 'value')?.fieldValue, '832'),
          assert.equal(_0xd39884('383', 'value')?.fieldValue, '2'),
          assert.equal(_0xd39884('318', 'value')?.fieldValue, 'person, face'),
          assert.equal(_0xd39884('317', 'value')?.fieldValue, ''),
          assert.equal(_0xd39884('336', 'force_rate')?.fieldValue, '24'),
          assert.equal(_0xd39884('336', 'frame_load_cap')?.fieldValue, '300'),
          assert.equal(_0xd39884('458', 'value')?.fieldValue, hasEnhancedMotionControl ? 'true' : undefined));
      });
    },
  ),
  test('RunningHubAdapter Scail V2 defaults enhanced motion control to false', async () => {
    const _0x1eb9f2 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async (_0x480e18) =>
          String(_0x480e18?.[0] || '') === 'ref_local' ? ['u_ref'] : [],
      },
      _0x2bd002 = await buildVideoRequest(
        {
          model: 'runninghub/2065463417577762818',
          videoUrl: 'https://www.runninghub.cn/source.mp4',
          inputUrls: ['ref_local'],
        },
        '',
        _0x1eb9f2,
      ),
      _0x437d51 = (_0x596fb7, _0x88fcaa) =>
        _0x2bd002.body.nodeInfoList.find(
          (_0x702130) => _0x702130.nodeId === _0x596fb7 && _0x702130.fieldName === _0x88fcaa,
        );
    (assert.equal(_0x437d51('458', 'value')?.fieldValue, 'false'),
      assert.equal(_0x437d51('458', 'value')?.description, '强化动作控制'),
      assert.equal(_0x437d51('324', 'value')?.fieldValue, '1024'),
      assert.equal(_0x437d51('318', 'value')?.fieldValue, 'person'),
      assert.equal(_0x437d51('318', 'value')?.description, '检测识别提示词'));
  }),
  test('RunningHubAdapter Scail detect prompt preserves explicit empty value', async () => {
    const _0x24c28a = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async (_0x2151fa) =>
          String(_0x2151fa?.[0] || '') === 'ref_local' ? ['u_ref'] : [],
      },
      _0x227f32 = await buildVideoRequest(
        {
          model: 'runninghub/2064961300823896065',
          videoUrl: 'https://www.runninghub.cn/source.mp4',
          inputUrls: ['ref_local'],
          generationParams: { rhScailDetectPrompt: '' },
        },
        '',
        _0x24c28a,
      ),
      _0x1e94c3 = (_0x40214d, _0x376c08) =>
        _0x227f32.body.nodeInfoList.find(
          (_0x1e5200) => _0x1e5200.nodeId === _0x40214d && _0x1e5200.fieldName === _0x376c08,
        );
    (assert.equal(_0x1e94c3('318', 'value')?.fieldValue, ''),
      assert.equal(_0x1e94c3('324', 'value')?.fieldValue, '1024'));
  }),
  test('RunningHubAdapter 视频编辑V5.4：源视频转传失败时给出网络或上传提示', async () => {
    const _0x1340d8 = globalThis.fetch,
      _0x35be9b = { getProviderConfig: () => ({ apiKey: 'k' }), processInputImages: async () => [] };
    try {
      ((globalThis.fetch = async (_0x4f927d) => {
        const _0x19b476 = String(_0x4f927d || '');
        if (_0x19b476 === 'https://video.example/fail.mp4')
          return new Response('network timeout', { status: 0x1f8 });
        throw new Error('unexpected fetch url: ' + _0x19b476);
      }),
        await assert.rejects(
          () =>
            buildVideoRequest(
              {
                model: 'runninghub/2041741496667348994',
                videoUrl: 'https://video.example/fail.mp4',
                controlMode: 'efficiency',
                subtractSubject: false,
                frameRate: 24,
                frameCount: 77,
                rhVideoResolution: 0x340,
              },
              'a prompt',
              _0x35be9b,
            ),
          /源视频上传失败，可能是网络延迟/,
        ));
    } finally {
      globalThis.fetch = _0x1340d8;
    }
  }),
  test('RunningHubAdapter BERNINI V1: maps input modes, fixed params, and 8-aligned dimensions', async () => {
    const _0xd3098c = resolveModelExecution('runninghub/2062515720147259393');
    (assert.equal(_0xd3098c?.modelManifest?.displayName, '新全能视频替换BERNINI V1'),
      assert.equal(
        _0xd3098c?.executionManifest?.extensions?.payloadResolver,
        'runninghubBerniniVideoReplaceV1',
      ));
    const _0x52a61f = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async (_0x2fddd2) =>
          String(_0x2fddd2?.[0] || '') === 'ref_local' ? ['u_ref'] : [],
      },
      _0x5b28ae = async (_0x5ded93, _0x251d18 = 'bernini prompt') =>
        buildVideoRequest(
          {
            model: 'runninghub/2062515720147259393',
            rhVideoResolution: 0x340,
            rhBerniniAspectRatio: '16:9',
            rhInstanceType: 'plus',
            ..._0x5ded93,
          },
          _0x251d18,
          _0x52a61f,
        ),
      _0x400174 = (_0xc1f8d3, _0x1ecf8c, _0xef6817) =>
        _0xc1f8d3.body.nodeInfoList.find(
          (_0x4102ce) => _0x4102ce.nodeId === _0x1ecf8c && _0x4102ce.fieldName === _0xef6817,
        ),
      _0x1e681a = await _0x5b28ae({}, 'text only');
    (assert.equal(_0x1e681a.body.instanceType, 'plus'),
      assert.equal(
        _0x1e681a.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/run/ai-app/2062515720147259393',
      ),
      assert.equal(_0x400174(_0x1e681a, '34', 'value')?.fieldValue, '0'),
      assert.equal(_0x400174(_0x1e681a, '31', 'video'), undefined),
      assert.equal(_0x400174(_0x1e681a, '32', 'image'), undefined),
      assert.equal(_0x400174(_0x1e681a, '31', 'force_rate')?.fieldValue, '24'),
      assert.equal(_0x400174(_0x1e681a, '19', 'value')?.fieldValue, '121'),
      assert.equal(_0x400174(_0x1e681a, '17', 'value')?.fieldValue, '832'),
      assert.equal(_0x400174(_0x1e681a, '18', 'value')?.fieldValue, '472'),
      assert.equal(_0x400174(_0x1e681a, '53', 'value')?.fieldValue, 'text only'));
    const _0x1789ba = await _0x5b28ae({ rhVideoFps: 30, rhVideoFrames: 180 });
    (assert.equal(_0x400174(_0x1789ba, '31', 'force_rate')?.fieldValue, '30'),
      assert.equal(_0x400174(_0x1789ba, '19', 'value')?.fieldValue, '180'));
    const _0x5004a5 = await _0x5b28ae({ rhBerniniAspectRatio: '自适应', resolvedRatioLabel: '9:16' });
    (assert.equal(_0x400174(_0x5004a5, '17', 'value')?.fieldValue, '472'),
      assert.equal(_0x400174(_0x5004a5, '18', 'value')?.fieldValue, '832'));
    const _0x594ad4 = await _0x5b28ae({ inputUrls: ['ref_local'] });
    (assert.equal(_0x400174(_0x594ad4, '34', 'value')?.fieldValue, '1'),
      assert.equal(_0x400174(_0x594ad4, '32', 'image')?.fieldValue, 'u_ref'));
    const _0x2fb26e = await _0x5b28ae({ inputUrls: ['ref_local'], rhBerniniFunction: 'r2v' });
    assert.equal(_0x400174(_0x2fb26e, '34', 'value')?.fieldValue, '3');
    const _0x5f0871 = await _0x5b28ae({ videoUrl: 'https://www.runninghub.cn/source.mp4' });
    (assert.equal(_0x400174(_0x5f0871, '34', 'value')?.fieldValue, '2'),
      assert.equal(_0x400174(_0x5f0871, '31', 'video')?.fieldValue, 'https://www.runninghub.cn/source.mp4'));
    const _0xb1ede = await _0x5b28ae({
      videoUrl: 'https://www.runninghub.cn/source.mp4',
      rhBerniniFunction: 'mv2v',
    });
    assert.equal(_0x400174(_0xb1ede, '34', 'value')?.fieldValue, '8');
    const _0x5ded7c = await _0x5b28ae({
      videoUrl: 'https://www.runninghub.cn/source.mp4',
      inputUrls: ['ref_local'],
    });
    (assert.equal(_0x400174(_0x5ded7c, '34', 'value')?.fieldValue, '4'),
      assert.equal(_0x400174(_0x5ded7c, '32', 'image')?.fieldValue, 'u_ref'),
      assert.equal(_0x400174(_0x5ded7c, '100', 'video'), undefined));
    const _0x3bebcb = await _0x5b28ae({
      videoUrl: 'https://www.runninghub.cn/source.mp4',
      inputUrls: ['ref_local'],
      rhBerniniFunction: 'rv2v',
    });
    assert.equal(_0x400174(_0x3bebcb, '34', 'value')?.fieldValue, '5');
    const _0x1c1db6 = await _0x5b28ae({
      videoUrl: 'https://www.runninghub.cn/source.mp4',
      inputUrls: ['ref_local'],
      rhBerniniFunction: 'vrc2v',
    });
    assert.equal(_0x400174(_0x1c1db6, '34', 'value')?.fieldValue, '7');
    const _0x3550df = await _0x5b28ae({
      videoUrl: 'https://www.runninghub.cn/source.mp4',
      inputUrls: ['ref_local'],
      referenceVideoUrl: 'https://www.runninghub.cn/reference.mp4',
    });
    (assert.equal(_0x400174(_0x3550df, '34', 'value')?.fieldValue, '6'),
      assert.equal(_0x400174(_0x3550df, '32', 'image'), undefined),
      assert.equal(
        _0x400174(_0x3550df, '100', 'video')?.fieldValue,
        'https://www.runninghub.cn/reference.mp4',
      ));
  }),
  test('RunningHubAdapter 视频工作流旧 ID 缺少 manifest 时直接报错', async () => {
    const _0x4864cb = { getProviderConfig: () => ({ apiKey: 'k' }), processInputImages: async () => [] };
    await assert.rejects(
      () =>
        buildVideoRequest(
          {
            model: 'runninghub/2037339851183366146',
            videoUrl: 'https://www.runninghub.cn/source.mp4',
            frameRate: 24,
            frameCount: 77,
            rhVideoResolution: 0x340,
            controlMode: 'efficiency',
          },
          'legacy prompt',
          _0x4864cb,
        ),
      /video workflow manifest missing/,
    );
  }),
  test('RunningHubAdapter 模型 API 在自适应比例下不透传 aspectRatio（兼容扩图）', async () => {
    const _0x489ba3 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => ['https://example.com/expand.png'],
      },
      _0x33b4b5 = await buildModelRequest(
        {
          model: 'runninghub-model/rhart-image-v1',
          inputUrls: ['blob:expand'],
          resolvedRatioLabel: '16:9',
          aspectRatio: '自适应',
          imageSize: '2K',
        },
        '保持主体不变，扩展黑边区域',
        _0x489ba3,
      );
    (assert.equal(_0x33b4b5.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/rhart-image-v1/edit'),
      assert.equal(_0x33b4b5.body.apiKey, 'mk'),
      assert.equal(_0x33b4b5.body.aspectRatio, '16:9'),
      assert.deepEqual(_0x33b4b5.body.imageUrls, ['https://example.com/expand.png']),
      assert.equal(_0x33b4b5.adapterTrace?.source, 'manifest'));
  }),
  test('RunningHubAdapter 模型 API 缺少 manifest 时直接报错', async () => {
    const _0x307b63 = {
      getProviderConfig: () => ({ modelApiKey: 'mk' }),
      processInputImages: async () => [],
    };
    await assert.rejects(
      () =>
        buildModelRequest(
          { model: 'runninghub-model/unregistered-model', imageSize: '2K' },
          'test',
          _0x307b63,
        ),
      /RunningHub model API manifest missing/,
    );
  }),
  test('RunningHubAdapter 模型API会规范化全角比例分隔符（非 seedream）', async () => {
    const _0x5dff36 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      _0x1ed0f5 = await buildModelRequest(
        { model: 'runninghub-model/rhart-image-n-g31-flash', aspectRatio: '16：9', imageSize: '4K' },
        'test',
        _0x5dff36,
      );
    (assert.equal(_0x1ed0f5.body.aspectRatio, '16:9'), assert.equal(_0x1ed0f5.body.resolution, '4k'));
  }),
  test('RunningHubAdapter GPT image 2 有参考图时走 image-to-image 且透传 resolution', async () => {
    const _0x2f8103 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => ['https://example.com/gpt-image-2-ref.png'],
      },
      _0x3d3b15 = await buildModelRequest(
        {
          model: 'runninghub-model/rhart-image-g-2',
          inputUrls: ['blob:ref'],
          aspectRatio: '1:1',
          imageSize: '2K',
        },
        'test',
        _0x2f8103,
      );
    (assert.equal(
      _0x3d3b15.body.apiUrl,
      'https://www.runninghub.cn/openapi/v2/rhart-image-g-2/image-to-image',
    ),
      assert.equal(_0x3d3b15.body.aspectRatio, '1:1'),
      assert.equal(_0x3d3b15.body.resolution, '2k'),
      assert.deepEqual(_0x3d3b15.body.imageUrls, ['https://example.com/gpt-image-2-ref.png']));
  }),
  test('RunningHubAdapter grok 4.2 低价版有参考图时走 image-to-image 且转换 aspectRatio', async () => {
    let _0xfaca32 = [];
    const _0xbf4066 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async (_0x2eff83) => {
          return ((_0xfaca32 = _0x2eff83), ['https://example.com/image-x-ref.png']);
        },
      },
      _0x1e5a98 = await buildModelRequest(
        {
          model: 'runninghub-model/rhart-image-g',
          inputUrlsBySlot: { imageUrl: 'blob:image-x-ref' },
          aspectRatio: '1:1',
          imageSize: '2K',
        },
        'test',
        _0xbf4066,
      );
    (assert.deepEqual(_0xfaca32, ['blob:image-x-ref']),
      assert.equal(
        _0x1e5a98.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/rhart-image-g/image-to-image',
      ),
      assert.equal(_0x1e5a98.body.model, 'g-4.2'),
      assert.equal(_0x1e5a98.body.imageUrl, 'https://example.com/image-x-ref.png'),
      assert.equal(_0x1e5a98.body.imageUrls, undefined),
      assert.equal(_0x1e5a98.body.resolution, undefined),
      assert.equal(_0x1e5a98.body.aspectRatio, '960x960'));
  }),
  test('RunningHubAdapter grok 4.2 低价版无参考图时走 text-to-image 且转换比例枚举', async () => {
    const _0x25acf2 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      _0x4b0c28 = await buildModelRequest(
        { model: 'runninghub-model/rhart-image-g', aspectRatio: '16:9', imageSize: '4K' },
        'test',
        _0x25acf2,
      );
    (assert.equal(_0x4b0c28.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/rhart-image-g/text-to-image'),
      assert.equal(_0x4b0c28.body.model, 'g-4.2'),
      assert.equal(_0x4b0c28.body.imageUrl, undefined),
      assert.equal(_0x4b0c28.body.imageUrls, undefined),
      assert.equal(_0x4b0c28.body.resolution, undefined),
      assert.equal(_0x4b0c28.body.aspectRatio, '1280x720'));
  }),
  test('RunningHubAdapter grok 4.2 官方版文生图走 official text-to-image', async () => {
    const _0x5b4d05 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      _0x143c55 = await buildModelRequest(
        {
          model: 'runninghub-model/rhart-image-g',
          rhModelRoute: 'official',
          aspectRatio: '16:9',
          imageSize: '2K',
        },
        'test',
        _0x5b4d05,
      );
    (assert.equal(
      _0x143c55.body.apiUrl,
      'https://www.runninghub.cn/openapi/v2/rhart-image-x-official/text-to-image',
    ),
      assert.equal(_0x143c55.body.aspectRatio, '16:9'),
      assert.equal(_0x143c55.body.outputFormat, undefined),
      assert.equal(_0x143c55.body.resolution, undefined),
      assert.equal(_0x143c55.body.model, undefined));
  }),
  test('RunningHubAdapter grok 4.2 官方版图片编辑走 edit 且使用 image 字段', async () => {
    let _0x5e2d80 = [];
    const _0x285cc5 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async (_0x51e75e) => {
          return ((_0x5e2d80 = _0x51e75e), ['https://example.com/official-x-ref.png']);
        },
      },
      _0x1b4073 = await buildModelRequest(
        {
          model: 'runninghub-model/rhart-image-g',
          rhModelRoute: 'official',
          inputUrlsBySlot: { imageUrl: 'blob:official-x-ref' },
          aspectRatio: '9:16',
        },
        'test',
        _0x285cc5,
      );
    (assert.deepEqual(_0x5e2d80, ['blob:official-x-ref']),
      assert.equal(_0x1b4073.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/rhart-image-x-official/edit'),
      assert.equal(_0x1b4073.body.image, 'https://example.com/official-x-ref.png'),
      assert.equal(_0x1b4073.body.imageUrl, undefined),
      assert.equal(_0x1b4073.body.aspectRatio, undefined),
      assert.equal(_0x1b4073.body.outputFormat, undefined),
      assert.equal(_0x1b4073.body.resolution, undefined),
      assert.equal(_0x1b4073.body.model, undefined));
  }),
  test('RunningHubAdapter Midjourney V6 使用具名图片插槽和条件权重参数', async () => {
    let _0x352f3b = [];
    const _0x49b46a = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async (_0x15cf5f) => {
          return (
            (_0x352f3b = _0x15cf5f),
            ['https://example.com/main.png', 'https://example.com/char.png', 'https://example.com/style.png']
          );
        },
      },
      _0x16aa35 = await buildModelRequest(
        {
          model: 'runninghub-model/youchuan-v6',
          inputUrlsBySlot: { imageUrl: 'blob:main', cref: 'blob:char', sref: 'blob:style' },
          aspectRatio: '16:9',
          quality: '2',
          chaos: '7',
          stylize: '120',
          weird: '3',
          raw: 'true',
          iw: '2',
          cw: '80',
          sw: '250',
          sv: '4',
          ow: '150',
          stop: '90',
          tile: 'false',
          hd: 'true',
        },
        'test',
        _0x49b46a,
      );
    (assert.deepEqual(_0x352f3b, ['blob:main', 'blob:char', 'blob:style']),
      assert.equal(_0x16aa35.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v6'),
      assert.equal(_0x16aa35.body.resolution, undefined),
      assert.equal(_0x16aa35.body.imageUrls, undefined),
      assert.equal(_0x16aa35.body.imageUrl, 'https://example.com/main.png'),
      assert.equal(_0x16aa35.body.cref, 'https://example.com/char.png'),
      assert.equal(_0x16aa35.body.sref, 'https://example.com/style.png'),
      assert.equal(_0x16aa35.body.quality, '2'),
      assert.equal(_0x16aa35.body.raw, true),
      assert.equal(_0x16aa35.body.tile, false),
      assert.equal(_0x16aa35.body.iw, 2),
      assert.equal(_0x16aa35.body.cw, 80),
      assert.equal(_0x16aa35.body.sw, 250),
      assert.equal(_0x16aa35.body.sv, 4),
      assert.equal(_0x16aa35.body.stop, 90),
      assert.equal(_0x16aa35.body.ow, undefined),
      assert.equal(_0x16aa35.body.hd, undefined));
  }),
  test('RunningHubAdapter Midjourney V6 连接参考图时补官方默认数值', async () => {
    let _0xd9282f = [];
    const _0x131cea = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async (_0x24467a) => {
          return (
            (_0xd9282f = _0x24467a),
            ['https://example.com/main.png', 'https://example.com/char.png', 'https://example.com/style.png']
          );
        },
      },
      _0x72305d = await buildModelRequest(
        {
          model: 'runninghub-model/youchuan-v6',
          inputUrlsBySlot: { imageUrl: 'blob:main', cref: 'blob:char', sref: 'blob:style' },
          aspectRatio: '16:9',
        },
        'test',
        _0x131cea,
      );
    (assert.deepEqual(_0xd9282f, ['blob:main', 'blob:char', 'blob:style']),
      assert.equal(_0x72305d.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v6'),
      assert.equal(_0x72305d.body.imageUrl, 'https://example.com/main.png'),
      assert.equal(_0x72305d.body.cref, 'https://example.com/char.png'),
      assert.equal(_0x72305d.body.sref, 'https://example.com/style.png'),
      assert.equal(_0x72305d.body.quality, '1'),
      assert.equal(_0x72305d.body.chaos, 0),
      assert.equal(_0x72305d.body.stylize, 0),
      assert.equal(_0x72305d.body.weird, 0),
      assert.equal(_0x72305d.body.raw, false),
      assert.equal(_0x72305d.body.iw, 1),
      assert.equal(_0x72305d.body.cw, 100),
      assert.equal(_0x72305d.body.sw, 100),
      assert.equal(_0x72305d.body.sv, 4),
      assert.equal(_0x72305d.body.stop, 100),
      assert.equal(_0x72305d.body.tile, false),
      assert.equal(_0x72305d.body.ow, undefined),
      assert.equal(_0x72305d.body.hd, undefined));
  }),
  test('RunningHubAdapter Midjourney V7 使用具名图片插槽和 V7 参数', async () => {
    let _0xd80bea = [];
    const _0x2a73f3 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async (_0x54f118) => {
          return (
            (_0xd80bea = _0x54f118),
            ['https://example.com/main-v7.png', 'https://example.com/style-v7.png']
          );
        },
      },
      _0xe3278c = await buildModelRequest(
        {
          model: 'runninghub-model/youchuan-v7',
          inputUrlsBySlot: { imageUrl: 'blob:main', sref: 'blob:style' },
          aspectRatio: '16:9',
          quality: '2',
          chaos: '7',
          stylize: '120',
          weird: '3',
          raw: 'true',
          iw: '2',
          sw: '250',
          sv: '4',
          ow: '150',
          stop: '90',
          cw: '80',
          hd: 'true',
          tile: 'false',
        },
        'test',
        _0x2a73f3,
      );
    (assert.deepEqual(_0xd80bea, ['blob:main', 'blob:style']),
      assert.equal(_0xe3278c.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v7'),
      assert.equal(_0xe3278c.body.resolution, undefined),
      assert.equal(_0xe3278c.body.imageUrls, undefined),
      assert.equal(_0xe3278c.body.imageUrl, 'https://example.com/main-v7.png'),
      assert.equal(_0xe3278c.body.sref, 'https://example.com/style-v7.png'),
      assert.equal(_0xe3278c.body.cref, undefined),
      assert.equal(_0xe3278c.body.cw, undefined),
      assert.equal(_0xe3278c.body.stop, undefined),
      assert.equal(_0xe3278c.body.hd, undefined),
      assert.equal(_0xe3278c.body.quality, '2'),
      assert.equal(_0xe3278c.body.raw, true),
      assert.equal(_0xe3278c.body.tile, false),
      assert.equal(_0xe3278c.body.iw, 2),
      assert.equal(_0xe3278c.body.sw, 250),
      assert.equal(_0xe3278c.body.sv, 4),
      assert.equal(_0xe3278c.body.ow, 150));
  }),
  test('RunningHubAdapter Midjourney V7 未连接风格图时不发送 sw', async () => {
    const _0x2f0010 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => ['https://example.com/main-v7.png'],
      },
      _0x22d47a = await buildModelRequest(
        {
          model: 'runninghub-model/youchuan-v7',
          inputUrlsBySlot: { imageUrl: 'blob:main' },
          aspectRatio: '9:16',
          iw: '2',
          sw: '999',
        },
        'test',
        _0x2f0010,
      );
    (assert.equal(_0x22d47a.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v7'),
      assert.equal(_0x22d47a.body.imageUrl, 'https://example.com/main-v7.png'),
      assert.equal(_0x22d47a.body.sref, undefined),
      assert.equal(_0x22d47a.body.sw, undefined),
      assert.equal(_0x22d47a.body.iw, 2),
      assert.equal(_0x22d47a.body.quality, '1'),
      assert.equal(_0x22d47a.body.chaos, 0),
      assert.equal(_0x22d47a.body.stylize, 0),
      assert.equal(_0x22d47a.body.weird, 0),
      assert.equal(_0x22d47a.body.raw, false),
      assert.equal(_0x22d47a.body.sv, 4),
      assert.equal(_0x22d47a.body.ow, 100),
      assert.equal(_0x22d47a.body.tile, false));
  }),
  test('RunningHubAdapter Midjourney V7 连接参考图时补官方默认数值', async () => {
    const _0x5aaf9f = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [
          'https://example.com/main-v7.png',
          'https://example.com/style-v7.png',
        ],
      },
      _0x14ef48 = await buildModelRequest(
        {
          model: 'runninghub-model/youchuan-v7',
          inputUrlsBySlot: { imageUrl: 'blob:main', sref: 'blob:style' },
          aspectRatio: '16:9',
        },
        'test',
        _0x5aaf9f,
      );
    (assert.equal(_0x14ef48.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v7'),
      assert.equal(_0x14ef48.body.imageUrl, 'https://example.com/main-v7.png'),
      assert.equal(_0x14ef48.body.sref, 'https://example.com/style-v7.png'),
      assert.equal(_0x14ef48.body.quality, '1'),
      assert.equal(_0x14ef48.body.chaos, 0),
      assert.equal(_0x14ef48.body.stylize, 0),
      assert.equal(_0x14ef48.body.weird, 0),
      assert.equal(_0x14ef48.body.raw, false),
      assert.equal(_0x14ef48.body.iw, 1),
      assert.equal(_0x14ef48.body.sw, 100),
      assert.equal(_0x14ef48.body.sv, 4),
      assert.equal(_0x14ef48.body.ow, 100),
      assert.equal(_0x14ef48.body.tile, false));
  }),
  test('RunningHubAdapter Midjourney V8.1 使用官方 iw/sw 参数并过滤其他版本残留', async () => {
    const _0x2ba9dd = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => ['https://example.com/main.png'],
      },
      _0x4fa79c = await buildModelRequest(
        {
          model: 'runninghub-model/youchuan-v81',
          inputUrlsBySlot: { imageUrl: 'blob:main' },
          aspectRatio: '9:16',
          quality: '4',
          iw: '3',
          sw: '999',
          hd: 'true',
          weird: '3',
          stop: '90',
          ow: '150',
          tile: 'true',
        },
        'test',
        _0x2ba9dd,
      );
    (assert.equal(_0x4fa79c.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v81'),
      assert.equal(_0x4fa79c.body.imageUrl, 'https://example.com/main.png'),
      assert.equal(_0x4fa79c.body.sref, undefined),
      assert.equal(_0x4fa79c.body.sw, 0x3e7),
      assert.equal(_0x4fa79c.body.iw, 3),
      assert.equal(_0x4fa79c.body.quality, '4'),
      assert.equal(_0x4fa79c.body.hd, true),
      assert.equal(_0x4fa79c.body.sv, 6),
      assert.equal(_0x4fa79c.body.weird, undefined),
      assert.equal(_0x4fa79c.body.stop, undefined),
      assert.equal(_0x4fa79c.body.ow, undefined),
      assert.equal(_0x4fa79c.body.tile, undefined));
  }),
  test('RunningHubAdapter Midjourney V8.1 纯文生图使用官方默认 iw/sw body', async () => {
    const _0x1b7d61 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      _0x3e6804 = await buildModelRequest({ model: 'runninghub-model/youchuan-v81' }, 'test', _0x1b7d61);
    (assert.equal(_0x3e6804.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v81'),
      assert.equal(_0x3e6804.body.imageUrl, undefined),
      assert.equal(_0x3e6804.body.sref, undefined),
      assert.equal(_0x3e6804.body.iw, 1),
      assert.equal(_0x3e6804.body.sw, 100),
      assert.equal(_0x3e6804.body.quality, '1'),
      assert.equal(_0x3e6804.body.chaos, 0),
      assert.equal(_0x3e6804.body.stylize, 0),
      assert.equal(_0x3e6804.body.raw, false),
      assert.equal(_0x3e6804.body.hd, false),
      assert.equal(_0x3e6804.body.sv, 6));
  }),
  test('RunningHubAdapter Midjourney 自适应比例发送解析后的官方比例', async () => {
    const _0x313904 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      _0x259fb1 = await buildModelRequest(
        { model: 'runninghub-model/youchuan-v81', aspectRatio: '自适应', resolvedRatioLabel: '3:4' },
        'test',
        _0x313904,
      );
    (assert.equal(_0x259fb1.body.aspectRatio, '3:4'), assert.notEqual(_0x259fb1.body.aspectRatio, '自适应'));
  }),
  test('RunningHubAdapter GPT image 2 无参考图时走 text-to-image 且透传 resolution', async () => {
    const _0x1a4641 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      _0x38b50c = await buildModelRequest(
        { model: 'runninghub-model/rhart-image-g-2', imageSize: '4K' },
        'test',
        _0x1a4641,
      );
    (assert.equal(
      _0x38b50c.body.apiUrl,
      'https://www.runninghub.cn/openapi/v2/rhart-image-g-2/text-to-image',
    ),
      assert.equal(_0x38b50c.body.resolution, '4k'),
      assert.equal(_0x38b50c.body.imageUrls, undefined));
  }),
  test('RunningHubAdapter GPT image 2 official 有参考图时走 official image-to-image', async () => {
    const _0x3766c0 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => ['https://example.com/gpt-image-2-ref.png'],
      },
      _0xaadf78 = await buildModelRequest(
        {
          model: 'runninghub-model/rhart-image-g-2-official',
          inputUrls: ['blob:ref'],
          aspectRatio: '2:1',
          imageSize: '4K',
        },
        'test',
        _0x3766c0,
      );
    (assert.equal(
      _0xaadf78.body.apiUrl,
      'https://www.runninghub.cn/openapi/v2/rhart-image-g-2-official/image-to-image',
    ),
      assert.equal(_0xaadf78.body.aspectRatio, '2:1'),
      assert.equal(_0xaadf78.body.resolution, '4k'),
      assert.equal(_0xaadf78.body.quality, 'medium'),
      assert.deepEqual(_0xaadf78.body.imageUrls, ['https://example.com/gpt-image-2-ref.png']));
  }),
  test('RunningHubAdapter GPT image 2 official 无参考图时走 official text-to-image', async () => {
    const _0x47ac67 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      _0x10bbe2 = await buildModelRequest(
        { model: 'runninghub-model/rhart-image-g-2-official', aspectRatio: '9:21', imageSize: '2K' },
        'test',
        _0x47ac67,
      );
    (assert.equal(
      _0x10bbe2.body.apiUrl,
      'https://www.runninghub.cn/openapi/v2/rhart-image-g-2-official/text-to-image',
    ),
      assert.equal(_0x10bbe2.body.aspectRatio, '9:21'),
      assert.equal(_0x10bbe2.body.resolution, '2k'),
      assert.equal(_0x10bbe2.body.quality, 'medium'),
      assert.equal(_0x10bbe2.body.imageUrls, undefined));
  }),
  test('RunningHubAdapter GPT image 2 父模型官方 route 携带官方 quality', async () => {
    const _0x7394a8 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => ['https://example.com/gpt-image-2-ref.png'],
      },
      _0x4829bb = await buildModelRequest(
        {
          model: 'runninghub-model/rhart-image-g-2',
          rhModelRoute: 'official',
          aspectRatio: '16:9',
          imageSize: '2K',
        },
        'test',
        _0x7394a8,
      );
    (assert.equal(
      _0x4829bb.body.apiUrl,
      'https://www.runninghub.cn/openapi/v2/rhart-image-g-2-official/text-to-image',
    ),
      assert.equal(_0x4829bb.body.resolution, '2k'),
      assert.equal(_0x4829bb.body.aspectRatio, '16:9'),
      assert.equal(_0x4829bb.body.quality, 'medium'));
    const _0x450d39 = await buildModelRequest(
      {
        model: 'runninghub-model/rhart-image-g-2',
        rhModelRoute: 'official',
        inputUrls: ['blob:ref'],
        aspectRatio: '2:1',
        imageSize: '4K',
      },
      'test',
      _0x7394a8,
    );
    (assert.equal(
      _0x450d39.body.apiUrl,
      'https://www.runninghub.cn/openapi/v2/rhart-image-g-2-official/image-to-image',
    ),
      assert.equal(_0x450d39.body.resolution, '4k'),
      assert.equal(_0x450d39.body.aspectRatio, '2:1'),
      assert.equal(_0x450d39.body.quality, 'medium'),
      assert.deepEqual(_0x450d39.body.imageUrls, ['https://example.com/gpt-image-2-ref.png']));
  }),
  test('RunningHubAdapter GPT image 2 official 保留 1K resolution', async () => {
    const _0x39eac8 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      _0x545a2f = await buildModelRequest(
        { model: 'runninghub-model/rhart-image-g-2-official', aspectRatio: '1:1', imageSize: '1K' },
        'test',
        _0x39eac8,
      );
    (assert.equal(_0x545a2f.body.resolution, '1k'), assert.equal(_0x545a2f.body.aspectRatio, '1:1'));
  }),
  test('RunningHubAdapter GPT image 2 official 4K 会回落到支持比例', async () => {
    const _0x3af5e1 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      _0x1c954b = await buildModelRequest(
        { model: 'runninghub-model/rhart-image-g-2-official', aspectRatio: '1:1', imageSize: '4K' },
        'test',
        _0x3af5e1,
      );
    (assert.equal(_0x1c954b.body.resolution, '4k'), assert.equal(_0x1c954b.body.aspectRatio, '16:9'));
  }),
  test('RunningHubAdapter seedream 三个模型均不透传 aspectRatio', async () => {
    const _0x1c4d65 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      _0x543829 = [
        'runninghub-model/seedream-v4',
        'runninghub-model/seedream-v4.5',
        'runninghub-model/seedream-v5-lite',
      ];
    for (const _0x4d840e of _0x543829) {
      const _0xd5ab4e = await buildModelRequest(
        { model: _0x4d840e, aspectRatio: '16:9', imageSize: '2K' },
        'test',
        _0x1c4d65,
      );
      (assert.equal(_0xd5ab4e.body.aspectRatio, undefined, 'model=' + _0x4d840e),
        assert.equal(_0xd5ab4e.body.resolution, undefined, 'model=' + _0x4d840e),
        assert.equal(_0xd5ab4e.body.width, 0xaa8, 'model=' + _0x4d840e),
        assert.equal(_0xd5ab4e.body.height, 0x600, 'model=' + _0x4d840e));
    }
  }),
  test('RunningHubAdapter 模型 API 在默认 1:1 比例下不透传 aspectRatio', async () => {
    const _0xfe21c8 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      _0x45f822 = await buildModelRequest(
        { model: 'runninghub-model/seedream-v4', aspectRatio: '1:1', imageSize: '2K' },
        'test',
        _0xfe21c8,
      );
    (assert.equal(_0x45f822.body.aspectRatio, undefined),
      assert.equal(_0x45f822.body.resolution, undefined),
      assert.equal(_0x45f822.body.width, 0x800),
      assert.equal(_0x45f822.body.height, 0x800));
  }),
  test('RunningHubAdapter seedream 宽高满足官方约束：8倍数且在512-8192', async () => {
    const _0x1aeb94 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      _0x53b2d8 = await buildModelRequest(
        { model: 'runninghub-model/seedream-v5-lite', aspectRatio: '21:9', imageSize: '4K' },
        'test',
        _0x1aeb94,
      );
    (assert.equal(_0x53b2d8.body.aspectRatio, undefined),
      assert.equal(_0x53b2d8.body.resolution, undefined),
      assert.ok(Number.isInteger(_0x53b2d8.body.width)),
      assert.ok(Number.isInteger(_0x53b2d8.body.height)),
      assert.equal(_0x53b2d8.body.width % 8, 0),
      assert.equal(_0x53b2d8.body.height % 8, 0),
      assert.ok(_0x53b2d8.body.width >= 0x200 && _0x53b2d8.body.width <= 0x2000),
      assert.ok(_0x53b2d8.body.height >= 0x200 && _0x53b2d8.body.height <= 0x2000));
  }));
