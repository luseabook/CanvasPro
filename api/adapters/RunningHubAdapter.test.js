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
    const modelExecution = resolveModelExecution('runninghub/2041177685895946242');
    assert.equal(modelExecution?.executionManifest?.mapping?.imageNodes?.[0], '45');
    const value = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_target', 'u_source'],
        processInputImagesPreserveOrder: async (item) =>
          Array.isArray(item) && item[0] === '' && item[1] === ''
            ? ['', '']
            : Array.isArray(item) && item[0] === 'm_target' && item[1] === 'm_source'
              ? ['mask_0', 'mask_1']
              : ['u_target', 'u_source'],
      },
      dom = await buildImageRequest(
        {
          model: 'runninghub/2041177685895946242',
          inputUrls: ['local_target', 'local_source'],
          rhResolution: 1600,
          rhInstanceType: 'plus',
        },
        'a prompt',
        value,
      );
    (assert.equal(dom.url, '/api/v2/proxy/image'),
      assert.equal(dom.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/2041177685895946242'),
      assert.equal(dom.body.apiKey, 'k'),
      assert.equal(dom.body.instanceType, 'plus'),
      assert.ok(Array.isArray(dom.body.nodeInfoList)));
    const list = dom.body.nodeInfoList,
      handler = (key, index) => list.find((item2) => item2.nodeId === key && item2.fieldName === index);
    (assert.equal(handler('45', 'image')?.fieldValue, 'u_target'),
      assert.equal(handler('40', 'image')?.fieldValue, 'u_source'),
      assert.equal(handler('594', 'value')?.fieldValue, 'a prompt'),
      assert.equal(handler('400', 'value')?.fieldValue, '1600'),
      assert.equal(handler('1180', 'image'), undefined),
      assert.equal(handler('1185', 'boolean'), undefined),
      assert.equal(handler('1177', 'image'), undefined),
      assert.equal(handler('1186', 'boolean'), undefined));
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
    const modelExecution2 = resolveModelExecution('runninghub/2053902968243671041');
    (assert.equal(modelExecution2?.modelManifest?.displayName, '控制摄像机'),
      assert.equal(modelExecution2?.executionManifest?.mapping?.promptNode?.prefix, '<sks> '));
    const dom2 = await buildImageRequest(
      { model: 'runninghub/2053902968243671041', inputUrls: ['local_image'] },
      'switch the camera perspective: wide shot, front view, eye-level shot',
      {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['uploaded_image'],
        processInputImagesPreserveOrder: async () => ['uploaded_image'],
      },
    );
    (assert.equal(dom2.url, '/api/v2/proxy/image'),
      assert.equal(dom2.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/2053902968243671041'),
      assert.equal(dom2.body.apiKey, 'k'),
      assert.equal(dom2.body.instanceType, 'default'),
      assert.equal(dom2.body.usePersonalQueue, 'false'));
    const list2 = dom2.body.nodeInfoList,
      handler2 = (result, data) => list2.find((item3) => item3.nodeId === result && item3.fieldName === data);
    (assert.deepEqual(
      list2.map((item4) => item4.nodeId),
      ['16', '23'],
    ),
      assert.equal(handler2('16', 'image')?.fieldValue, 'uploaded_image'),
      assert.equal(handler2('16', 'image')?.description, '载入图像'),
      assert.equal(handler2('23', 'value')?.description, '提示词'),
      assert.equal(
        handler2('23', 'value')?.fieldValue,
        '<sks> switch the camera perspective: wide shot, front view, eye-level shot',
      ));
  }),
  test('RunningHubAdapter 人物替换人物替换 V2.1: nodeInfoList 映射正确', async () => {
    const modelExecution3 = resolveModelExecution('runninghub/2050313968069165058');
    (assert.equal(modelExecution3?.modelManifest?.displayName, '人物替换人物替换V2.1'),
      assert.equal(modelExecution3?.executionManifest?.mapping?.imageNodes?.[0], '258'));
    const options = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_target', 'u_source'],
        processInputImagesPreserveOrder: async (target) =>
          Array.isArray(target) && target[0] === '' && target[1] === '' ? ['', ''] : ['u_target', 'u_source'],
      },
      dom3 = await buildImageRequest(
        {
          model: 'runninghub/2050313968069165058',
          inputUrls: ['local_target', 'local_source'],
          rhResolution: 1600,
          rhInstanceType: 'plus',
        },
        'a prompt',
        options,
      );
    (assert.equal(dom3.url, '/api/v2/proxy/image'),
      assert.equal(dom3.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/2050313968069165058'),
      assert.equal(dom3.body.apiKey, 'k'),
      assert.equal(dom3.body.instanceType, 'plus'),
      assert.deepEqual(dom3.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.person-replace-v21.v1',
        modelId: 'runninghub/2050313968069165058',
      }));
    const list3 = dom3.body.nodeInfoList,
      handler3 = (source, next) => list3.find((item5) => item5.nodeId === source && item5.fieldName === next);
    (assert.equal(handler3('258', 'image')?.fieldValue, 'u_target'),
      assert.equal(handler3('265', 'image')?.fieldValue, 'u_source'),
      assert.equal(handler3('232', 'value')?.fieldValue, 'a prompt'),
      assert.equal(handler3('233', 'value')?.fieldValue, '1600'),
      assert.equal(handler3('257', 'image'), undefined),
      assert.equal(handler3('259', 'boolean'), undefined),
      assert.equal(handler3('255', 'image'), undefined),
      assert.equal(handler3('262', 'boolean'), undefined));
  }),
  test('RunningHubAdapter 漫画转真人：使用新版 ai-app 并映射节点参数', async () => {
    const modelExecution4 = resolveModelExecution('runninghub/1994718111704158209');
    (assert.equal(modelExecution4?.modelManifest?.displayName, '漫画转真人'),
      assert.equal(modelExecution4?.executionManifest?.mapping?.imageNodes?.[0], '851'));
    const current = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_ref'],
      },
      dom4 = await buildImageRequest(
        {
          model: 'runninghub/1994718111704158209',
          inputUrls: ['local_ref'],
          rhAnimeRealResolution: 1600,
          rhInstanceType: 'plus',
        },
        'realistic portrait',
        current,
      );
    (assert.equal(dom4.url, '/api/v2/proxy/image'),
      assert.equal(dom4.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/1994718111704158209'),
      assert.equal(dom4.body.apiKey, 'k'),
      assert.equal(dom4.body.instanceType, 'plus'),
      assert.deepEqual(dom4.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.anime-real.v1',
        modelId: 'runninghub/1994718111704158209',
      }),
      assert.ok(Array.isArray(dom4.body.nodeInfoList)));
    const list4 = dom4.body.nodeInfoList,
      handler4 = (entry, record) =>
        list4.find((item6) => item6.nodeId === entry && item6.fieldName === record);
    (assert.equal(handler4('851', 'image')?.fieldValue, 'u_ref'),
      assert.equal(handler4('945', 'value')?.fieldValue, '1600'),
      assert.equal(handler4('967', 'value')?.fieldValue, 'realistic portrait'));
  }),
  test('RunningHubAdapter Qwen image edit: maps one image with default mode values and 1.5K size', async () => {
    const modelExecution5 = resolveModelExecution('runninghub/2050306122774532097');
    (assert.equal(modelExecution5?.modelManifest?.displayName, 'Qwen-图像编辑'),
      assert.equal(modelExecution5?.executionManifest?.submitMode, 'openapi-v2-ai-app'));
    const payload = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_ref_1'],
      },
      dom5 = await buildImageRequest(
        {
          model: 'runninghub/2050306122774532097',
          inputUrls: ['local_ref_1'],
          aspectRatio: '1:1',
          imageSize: '1.5K',
          rhInstanceType: 'default',
        },
        'edit the image',
        payload,
      );
    (assert.equal(dom5.url, '/api/v2/proxy/image'),
      assert.equal(dom5.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/2050306122774532097'),
      assert.equal(dom5.body.apiKey, 'k'),
      assert.equal(dom5.body.instanceType, 'default'),
      assert.deepEqual(dom5.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.qwen-image-edit.v1',
        modelId: 'runninghub/2050306122774532097',
      }));
    const list5 = dom5.body.nodeInfoList,
      handler5 = (handle, state) =>
        list5.find((item7) => item7.nodeId === handle && item7.fieldName === state);
    (assert.equal(handler5('151', 'image')?.fieldValue, 'u_ref_1'),
      assert.equal(handler5('152', 'image'), undefined),
      assert.equal(handler5('157', 'image'), undefined),
      assert.equal(handler5('148', 'value')?.fieldValue, 'edit the image'),
      assert.equal(handler5('112', 'width')?.fieldValue, '1536'),
      assert.equal(handler5('112', 'height')?.fieldValue, '1536'),
      assert.equal(handler5('227', 'index')?.fieldValue, '0'),
      assert.equal(handler5('231', 'index')?.fieldValue, '1'),
      assert.equal(handler5('265', 'value')?.fieldValue, '0'));
  }),
  test('RunningHubAdapter Qwen image edit: maps three images, 2509 mode, depth control, and 16:9 2K size', async () => {
    const config = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_ref_1', 'u_ref_2', 'u_ref_3', 'u_ref_4'],
      },
      dom6 = await buildImageRequest(
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
        config,
      );
    assert.equal(dom6.body.instanceType, 'plus');
    const list6 = dom6.body.nodeInfoList,
      handler6 = (scope, input) => list6.find((item8) => item8.nodeId === scope && item8.fieldName === input);
    (assert.equal(handler6('151', 'image')?.fieldValue, 'u_ref_1'),
      assert.equal(handler6('152', 'image')?.fieldValue, 'u_ref_2'),
      assert.equal(handler6('157', 'image')?.fieldValue, 'u_ref_3'),
      assert.equal(
        list6.some((item9) => item9.fieldValue === 'u_ref_4'),
        false,
      ),
      assert.equal(handler6('148', 'value')?.fieldValue, 'keep the product consistent'),
      assert.equal(handler6('112', 'width')?.fieldValue, '1920'),
      assert.equal(handler6('112', 'height')?.fieldValue, '1088'),
      assert.equal(handler6('227', 'index')?.fieldValue, '2'),
      assert.equal(handler6('231', 'index')?.fieldValue, '0'),
      assert.equal(handler6('265', 'value')?.fieldValue, '2'));
  }),
  test('RunningHubAdapter Qwen image edit: requires at least one image', async () => {
    const output = { getProviderConfig: () => ({ apiKey: 'k' }), processInputImages: async () => [] };
    await assert.rejects(
      () => buildImageRequest({ model: 'runninghub/2050306122774532097', inputUrls: [] }, 'edit', output),
      /请先添加至少一张参考图再生成/,
    );
  }),
  test('RunningHubAdapter 人物替换图片编辑 V3: mask 存在时写入 1180/1185 与 1177/1186', async () => {
    const value2 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_target', 'u_source'],
        processInputImagesPreserveOrder: async (value3) =>
          Array.isArray(value3) && value3[0] === '' && value3[1] === ''
            ? ['', '']
            : Array.isArray(value3) && value3[0] === 'm_target' && value3[1] === 'm_source'
              ? ['mask_0', 'mask_1']
              : ['u_target', 'u_source'],
      },
      dom7 = await buildImageRequest(
        {
          model: 'runninghub/2041177685895946242',
          inputUrls: ['local_target', 'local_source'],
          inputMaskUrls: ['m_target', 'm_source'],
          rhResolution: 1440,
          rhInstanceType: 'default',
        },
        'p',
        value2,
      ),
      list7 = dom7.body.nodeInfoList,
      handler7 = (value4, value5) =>
        list7.find((item10) => item10.nodeId === value4 && item10.fieldName === value5);
    (assert.equal(handler7('1180', 'image')?.fieldValue, 'mask_0'),
      assert.equal(handler7('1185', 'boolean')?.fieldValue, 'true'),
      assert.equal(handler7('1177', 'image')?.fieldValue, 'mask_1'),
      assert.equal(handler7('1186', 'boolean')?.fieldValue, 'true'));
  }),
  test('RunningHubAdapter 人物替换图片编辑 V3: 提示词为空时 594 使用默认 "4k,高清画质"', async () => {
    const value6 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_target', 'u_source'],
        processInputImagesPreserveOrder: async (value7) =>
          Array.isArray(value7) && value7[0] === '' && value7[1] === '' ? ['', ''] : ['u_target', 'u_source'],
      },
      dom8 = await buildImageRequest(
        {
          model: 'runninghub/2041177685895946242',
          inputUrls: ['local_target', 'local_source'],
          rhResolution: 1440,
          rhInstanceType: 'default',
        },
        '   ',
        value6,
      ),
      list8 = dom8.body.nodeInfoList,
      handler8 = (value8, value9) =>
        list8.find((item11) => item11.nodeId === value8 && item11.fieldName === value9);
    assert.equal(handler8('594', 'value')?.fieldValue, '4k,高清画质');
  }),
  test('RunningHubAdapter 人物替换人物替换 V2.1: mask 与默认提示词映射正确', async () => {
    const value10 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_target', 'u_source'],
        processInputImagesPreserveOrder: async (value11) =>
          Array.isArray(value11) && value11[0] === 'm_target' && value11[1] === 'm_source'
            ? ['mask_0', 'mask_1']
            : Array.isArray(value11) && value11[0] === '' && value11[1] === ''
              ? ['', '']
              : ['u_target', 'u_source'],
      },
      dom9 = await buildImageRequest(
        {
          model: 'runninghub/2050313968069165058',
          inputUrls: ['local_target', 'local_source'],
          inputMaskUrls: ['m_target', 'm_source'],
          rhResolution: 1440,
          rhInstanceType: 'default',
        },
        '   ',
        value10,
      ),
      list9 = dom9.body.nodeInfoList,
      handler9 = (value12, value13) =>
        list9.find((item12) => item12.nodeId === value12 && item12.fieldName === value13);
    (assert.equal(handler9('257', 'image')?.fieldValue, 'mask_0'),
      assert.equal(handler9('259', 'boolean')?.fieldValue, 'true'),
      assert.equal(handler9('255', 'image')?.fieldValue, 'mask_1'),
      assert.equal(handler9('262', 'boolean')?.fieldValue, 'true'),
      assert.equal(handler9('232', 'value')?.fieldValue, '4K'),
      assert.equal(handler9('233', 'value')?.fieldValue, '1440'));
  }),
  test('RunningHubAdapter 人物替换人物替换 V2.1: 默认模式允许 1440/1600/1920', async () => {
    const value14 = globalThis.window;
    globalThis.window = { ADVANCED_MODE: false };
    try {
      const value15 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_target', 'u_source'],
        processInputImagesPreserveOrder: async (value16) =>
          Array.isArray(value16) && value16[0] === '' && value16[1] === ''
            ? ['', '']
            : ['u_target', 'u_source'],
      };
      for (const rhResolution of [1440, 1600, 1920]) {
        const dom10 = await buildImageRequest(
            {
              model: 'runninghub/2050313968069165058',
              inputUrls: ['local_target', 'local_source'],
              rhResolution: rhResolution,
            },
            'prompt',
            value15,
          ),
          value17 = dom10.body.nodeInfoList.find(
            (item13) => item13.nodeId === '233' && item13.fieldName === 'value',
          );
        assert.equal(value17?.fieldValue, String(rhResolution));
      }
    } finally {
      if (typeof value14 === 'undefined') delete globalThis.window;
      else globalThis.window = value14;
    }
  }),
  test('RunningHubAdapter 视频擦除：nodeInfoList 映射正确（117/122/105/63）', async () => {
    const value18 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputVideos: async () => ['https://www.runninghub.cn/uploaded-video.mp4'],
        processInputImages: async () => ['https://www.runninghub.cn/uploaded-mask.png'],
      },
      { buildVideoRequest: buildVideoRequest2 } = await import('./RunningHubAdapter.js'),
      dom11 = await buildVideoRequest2(
        {
          model: 'runninghub/video_matting',
          videoUrl: 'https://www.runninghub.cn/test.mp4',
          maskImageDataUrl: 'data:image/png;base64,ZmFrZQ==',
          sourceFrameCount: 77,
        },
        '',
        value18,
      );
    (assert.equal(dom11.url, '/api/v2/video/matting/run'),
      assert.equal(dom11.useOpenapiQuery, true),
      assert.equal(dom11.body.apiKey, 'k'),
      assert.equal(dom11.body.appId, '2042569732972355585'),
      assert.equal(dom11.body.instanceType, 'default'),
      assert.equal(dom11.body.usePersonalQueue, 'false'),
      assert.ok(Array.isArray(dom11.body.nodeInfoList)));
    const list10 = dom11.body.nodeInfoList,
      handler10 = (value19, value20) =>
        list10.find((item14) => item14.nodeId === value19 && item14.fieldName === value20);
    (assert.equal(handler10('117', 'video')?.fieldValue, 'https://www.runninghub.cn/uploaded-video.mp4'),
      assert.equal(handler10('117', 'frame_load_cap')?.fieldValue, '77'),
      assert.equal(handler10('122', 'value')?.fieldValue, '24'),
      assert.equal(handler10('105', 'value')?.fieldValue, '1024'),
      assert.equal(handler10('63', 'image')?.fieldValue, 'https://www.runninghub.cn/uploaded-mask.png'),
      assert.equal(
        list10.some((item15) => item15.nodeId === '71'),
        false,
      ),
      assert.equal(
        list10.some((item16) => item16.nodeId === '72'),
        false,
      ),
      assert.equal(
        list10.some((item17) => item17.nodeId === '67'),
        false,
      ),
      assert.equal(
        list10.some((item18) => item18.nodeId === '35'),
        false,
      ));
  }),
  test('RunningHubAdapter 视频抠像：默认模式允许 30 帧', async () => {
    const value21 = globalThis.window;
    globalThis.window = { ADVANCED_MODE: false };
    try {
      const value22 = {
          getProviderConfig: () => ({ apiKey: 'k' }),
          processInputVideos: async () => ['https://www.runninghub.cn/uploaded-video.mp4'],
          processInputImages: async () => ['https://www.runninghub.cn/uploaded-mask.png'],
        },
        dom12 = await buildVideoRequest(
          {
            model: 'runninghub/video_matting',
            videoUrl: 'https://www.runninghub.cn/test.mp4',
            maskImageDataUrl: 'data:image/png;base64,ZmFrZQ==',
            sourceFrameCount: 77,
            rhVideoFps: 30,
          },
          '',
          value22,
        ),
        handler11 = (value23, value24) =>
          dom12.body.nodeInfoList.find((item19) => item19.nodeId === value23 && item19.fieldName === value24);
      assert.equal(handler11('122', 'value')?.fieldValue, '30');
    } finally {
      if (typeof value21 === 'undefined') delete globalThis.window;
      else globalThis.window = value21;
    }
  }),
  test('RunningHubAdapter 视频抠像：上传源视频并正确映射抠像模式（55/video + 67/index）', async () => {
    const value25 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputVideos: async () => ['https://www.runninghub.cn/uploaded-video.mp4'],
      },
      value26 = [
        { rhMaskMode: 'Sec', expected: '0' },
        { rhMaskMode: 'Sam3', expected: '1' },
        { rhMaskMode: 'MA2', expected: '2' },
        { rhMaskMode: 'MatAnyone2', expected: '2' },
        { rhMaskMode: undefined, expected: '0' },
        { rhMaskMode: 'unknown', expected: '0' },
      ];
    for (const { rhMaskMode: rhMaskMode, expected: expected } of value26) {
      const dom13 = await buildVideoRequest(
          {
            model: 'runninghub/video_matting',
            videoUrl: 'https://www.runninghub.cn/test.mp4',
            pos_points: '[{"x":1,"y":2}]',
            neg_points: '[]',
            frame_index: 12,
            rhMaskMode: rhMaskMode,
          },
          '',
          value25,
        ),
        list11 = dom13.body.nodeInfoList,
        handler12 = (value27, value28) =>
          list11.find((item20) => item20.nodeId === value27 && item20.fieldName === value28);
      (assert.equal(handler12('55', 'video')?.fieldValue, 'https://www.runninghub.cn/uploaded-video.mp4'),
        assert.equal(handler12('67', 'index')?.fieldValue, expected, 'rhMaskMode=' + String(rhMaskMode)));
    }
  }),
  test('RunningHubAdapter 视频抠像: 缺少视频上传能力时抛错', async () => {
    const value29 = { getProviderConfig: () => ({ apiKey: 'k' }) };
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
        value29,
      ),
      /缺少 RunningHUB 视频上传能力/,
    );
  }),
  test('RunningHubAdapter 视频抠像: 视频上传失败时抛错', async () => {
    const value30 = { getProviderConfig: () => ({ apiKey: 'k' }), processInputVideos: async () => [] };
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
        value30,
      ),
      /源视频上传失败/,
    );
  }),
  test('RunningHubAdapter LTX2.3: nodeInfoList 映射正确', async () => {
    const modelExecution6 = resolveModelExecution('runninghub/2039336644536442882');
    (assert.equal(modelExecution6?.modelManifest?.displayName, 'LTX2.3唱歌数字人'),
      assert.equal(modelExecution6?.executionManifest?.mapping?.preset, undefined),
      assert.equal(
        modelExecution6?.executionManifest?.mapping?.nodeInfoList?.find((item21) => item21.nodeId === '303')
          ?.source,
        'prompt',
      ),
      assert.equal(
        modelExecution6?.executionManifest?.mapping?.nodeInfoList?.find((item22) => item22.nodeId === '332')
          ?.source,
        'audioInput',
      ));
    const value31 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_img'],
      },
      { buildVideoRequest: buildVideoRequest3 } = await import('./RunningHubAdapter.js'),
      dom14 = await buildVideoRequest3(
        {
          model: 'runninghub/2039336644536442882',
          inputUrls: ['local_img'],
          audioUrl: 'https://www.runninghub.cn/test.mp3',
          rhVideoResolution: 1024,
          rhVideoFps: 24,
          rhVideoSeconds: 6,
          rhInstanceType: 'default',
        },
        'a prompt',
        value31,
      );
    (assert.equal(dom14.url, '/api/v2/runninghubwf/run'),
      assert.equal(dom14.body.apiKey, 'k'),
      assert.equal(dom14.body.workflowId, '2039336644536442882'),
      assert.equal(dom14.body.instanceType, 'default'),
      assert.deepEqual(dom14.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.video-ltx23.v1',
        modelId: 'runninghub/2039336644536442882',
      }),
      assert.ok(Array.isArray(dom14.body.nodeInfoList)));
    const list12 = dom14.body.nodeInfoList,
      handler13 = (value32, value33) =>
        list12.find((item23) => item23.nodeId === value32 && item23.fieldName === value33);
    (assert.equal(handler13('303', 'value')?.fieldValue, 'a prompt'),
      assert.equal(handler13('347', 'value')?.fieldValue, '1024'),
      assert.equal(handler13('346', 'value')?.fieldValue, '24'),
      assert.equal(handler13('349', 'value')?.fieldValue, '6'),
      assert.equal(handler13('269', 'image')?.fieldValue, 'u_img'),
      assert.equal(handler13('332', 'audio')?.fieldValue, 'https://www.runninghub.cn/test.mp3'));
  }),
  test('RunningHubAdapter 商业级数字人：ai-app 节点映射正确', async () => {
    const modelExecution7 = resolveModelExecution('runninghub/2055639633148563458');
    (assert.equal(modelExecution7?.modelManifest?.displayName, '商业级数字人'),
      assert.equal(modelExecution7?.modelManifest?.description, '主攻唱歌音频'),
      assert.equal(modelExecution7?.executionManifest?.mapping?.preset, undefined),
      assert.equal(
        modelExecution7?.executionManifest?.mapping?.nodeInfoList?.find((item24) => item24.nodeId === '100')
          ?.source,
        'imageInput',
      ),
      assert.equal(
        modelExecution7?.executionManifest?.mapping?.nodeInfoList?.find((item25) => item25.nodeId === '119')
          ?.source,
        'audioInput',
      ));
    const value34 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_img'],
      },
      dom15 = await buildVideoRequest(
        {
          model: 'runninghub/2055639633148563458',
          inputUrls: ['local_img'],
          audioUrl: 'https://www.runninghub.cn/song.mp3',
          generationParams: {
            rhVideoResolution: 1280,
            rhDigitalHumanMotionAmplitude: '2',
            rhDigitalHumanSceneMotionAmplitude: '1',
          },
          rhInstanceType: 'plus',
        },
        '',
        value34,
      );
    (assert.equal(dom15.url, '/api/v2/proxy/image'),
      assert.equal(dom15.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/2055639633148563458'),
      assert.equal(dom15.body.apiKey, 'k'),
      assert.equal(dom15.body.instanceType, 'plus'),
      assert.equal(dom15.body.usePersonalQueue, 'false'),
      assert.deepEqual(dom15.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.video-commercial-digital-human.v1',
        modelId: 'runninghub/2055639633148563458',
      }));
    const list13 = dom15.body.nodeInfoList,
      handler14 = (value35, value36) =>
        list13.find((item26) => item26.nodeId === value35 && item26.fieldName === value36);
    (assert.equal(handler14('100', 'image')?.fieldValue, 'u_img'),
      assert.equal(handler14('119', 'audio')?.fieldValue, 'https://www.runninghub.cn/song.mp3'),
      assert.equal(handler14('114', 'value')?.fieldValue, '1280'),
      assert.equal(handler14('118', 'value')?.fieldValue, '150'),
      assert.equal(handler14('117', 'value')?.fieldValue, '女人在唱歌，镜头晃动'),
      assert.equal(handler14('201', 'value')?.fieldValue, '2'),
      assert.equal(handler14('204', 'value')?.fieldValue, '1'));
  }),
  test('RunningHubAdapter 视频编辑-基础版：manifest 映射源视频和参考图', async () => {
    const modelExecution8 = resolveModelExecution('runninghub/1971148165531475969');
    (assert.equal(modelExecution8?.modelManifest?.displayName, '视频编辑-基础版'),
      assert.equal(modelExecution8?.executionManifest?.mapping?.preset, undefined),
      assert.equal(
        modelExecution8?.executionManifest?.mapping?.nodeInfoList?.find((item27) => item27.nodeId === '237')
          ?.source,
        'videoInput',
      ),
      assert.equal(
        modelExecution8?.executionManifest?.mapping?.nodeInfoList?.find((item28) => item28.nodeId === '234')
          ?.source,
        'imageInput',
      ));
    const value37 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_ref'],
      },
      dom16 = await buildVideoRequest(
        {
          model: 'runninghub/1971148165531475969',
          videoUrl: 'https://www.runninghub.cn/source.mp4',
          inputUrls: ['local_ref'],
          rhVideoFps: 16,
          rhVideoResolution: 1024,
          rhVideoFrames: 90,
          rhEnableMask: true,
        },
        'basic prompt',
        value37,
      );
    (assert.equal(dom16.url, '/api/v2/proxy/image'),
      assert.equal(dom16.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/1971148165531475969'),
      assert.deepEqual(dom16.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.video-basic.v1',
        modelId: 'runninghub/1971148165531475969',
      }));
    const list14 = dom16.body.nodeInfoList,
      handler15 = (value38, value39) =>
        list14.find((item29) => item29.nodeId === value38 && item29.fieldName === value39);
    (assert.equal(handler15('237', 'video')?.fieldValue, 'https://www.runninghub.cn/source.mp4'),
      assert.equal(handler15('234', 'image')?.fieldValue, 'u_ref'),
      assert.equal(handler15('397', 'value')?.fieldValue, '16'),
      assert.equal(handler15('222', 'value')?.fieldValue, '1024'),
      assert.equal(handler15('392', 'value')?.fieldValue, '90'),
      assert.equal(handler15('235', 'value')?.fieldValue, 'basic prompt'),
      assert.equal(handler15('396', 'value')?.fieldValue, 'true'));
  }),
  test('RunningHubAdapter 视频去字幕V2：通用 manifest 映射单视频和高级参数', async () => {
    const modelExecution9 = resolveModelExecution('runninghub/2060613773890768898');
    (assert.equal(modelExecution9?.modelManifest?.displayName, '视频去字幕V2'),
      assert.equal(modelExecution9?.executionManifest?.extensions?.payloadResolver, undefined),
      assert.equal(modelExecution9?.executionManifest?.appId, '2060613773890768898'),
      assert.equal(
        modelExecution9?.executionManifest?.mapping?.nodeInfoList?.find(
          (item30) => item30.nodeId === '1' && item30.fieldName === 'video',
        )?.source,
        'videoInput',
      ));
    let value40 = [];
    const value41 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async (value42) => {
          return ((value40 = value42), ['https://www.runninghub.cn/uploaded-mask.png']);
        },
      },
      dom17 = await buildVideoRequest(
        {
          model: 'runninghub/2060613773890768898',
          videoUrl: 'https://www.runninghub.cn/source.mp4',
          generationParams: { rhWatermarkRemoveMode: 'mode2', rhRemoveWatermark: true },
          maskImageDataUrl: '/data/mask/manual-mask.png',
          rhVideoFrames: 12,
          rhVideoFps: 30,
          rhVideoResolution: 960,
        },
        '',
        value41,
      );
    (assert.deepEqual(value40, ['/data/mask/manual-mask.png']),
      assert.equal(dom17.url, '/api/v2/proxy/image'),
      assert.equal(dom17.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/2060613773890768898'),
      assert.equal(dom17.body.apiKey, 'k'),
      assert.equal(dom17.body.instanceType, 'default'),
      assert.equal(dom17.body.usePersonalQueue, 'false'),
      assert.deepEqual(dom17.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.video-watermark-removal-v2.v1',
        modelId: 'runninghub/2060613773890768898',
      }));
    const list15 = dom17.body.nodeInfoList,
      handler16 = (value43, value44) =>
        list15.find((item31) => item31.nodeId === value43 && item31.fieldName === value44);
    (assert.equal(handler16('1', 'video')?.fieldValue, 'https://www.runninghub.cn/source.mp4'),
      assert.equal(handler16('134', 'value')?.fieldValue, '1'),
      assert.equal(handler16('1', 'frame_load_cap')?.fieldValue, '12'),
      assert.equal(handler16('85', 'value')?.fieldValue, '30'),
      assert.equal(handler16('31', 'value')?.fieldValue, '960'),
      assert.equal(handler16('144', 'value')?.fieldValue, 'true'),
      assert.equal(handler16('326', 'index')?.fieldValue, '1'),
      assert.equal(handler16('329', 'image')?.fieldValue, 'https://www.runninghub.cn/uploaded-mask.png'));
  }),
  test('RunningHubAdapter 视频去字幕V2：缺省参数保持接口示例默认值', async () => {
    const value45 = { getProviderConfig: () => ({ apiKey: 'k' }) },
      dom18 = await buildVideoRequest(
        { model: 'runninghub/2060613773890768898', videoUrl: 'https://www.runninghub.cn/source.mp4' },
        '',
        value45,
      ),
      handler17 = (value46, value47) =>
        dom18.body.nodeInfoList.find((item32) => item32.nodeId === value46 && item32.fieldName === value47);
    (assert.equal(handler17('134', 'value')?.fieldValue, '0'),
      assert.equal(handler17('1', 'frame_load_cap')?.fieldValue, '0'),
      assert.equal(handler17('85', 'value')?.fieldValue, '24'),
      assert.equal(handler17('31', 'value')?.fieldValue, '960'),
      assert.equal(handler17('144', 'value')?.fieldValue, 'false'),
      assert.equal(handler17('326', 'index'), undefined),
      assert.equal(handler17('329', 'image'), undefined));
  }),
  test('RunningHubAdapter 视频对口型：ai-app 节点映射正确', async () => {
    const modelExecution10 = resolveModelExecution('runninghub/2054101324521844738');
    (assert.equal(modelExecution10?.modelManifest?.displayName, '视频对口型'),
      assert.equal(modelExecution10?.executionManifest?.mapping?.preset, undefined),
      assert.equal(
        modelExecution10?.executionManifest?.mapping?.nodeInfoList?.find((item33) => item33.nodeId === '383')
          ?.source,
        'videoInput',
      ),
      assert.equal(
        modelExecution10?.executionManifest?.mapping?.nodeInfoList?.find((item34) => item34.nodeId === '390')
          ?.source,
        'imageInput',
      ),
      assert.equal(
        modelExecution10?.executionManifest?.mapping?.nodeInfoList?.find((item35) => item35.nodeId === '367')
          ?.source,
        'audioInput',
      ));
    const value48 = { getProviderConfig: () => ({ apiKey: 'k' }), processInputImages: async () => [] },
      dom19 = await buildVideoRequest(
        {
          model: 'runninghub/2054101324521844738',
          videoUrl: 'https://www.runninghub.cn/source.mp4',
          audioUrl: 'https://www.runninghub.cn/audio.mp3',
          rhVideoFrames: 120,
          rhVideoResolution: 512,
          rhInstanceType: 'plus',
          rhLipSyncInputIndex: 1,
          prompt: 'lip sync prompt',
        },
        'ignored fallback',
        value48,
      );
    (assert.equal(dom19.url, '/api/v2/proxy/image'),
      assert.equal(dom19.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/2054101324521844738'),
      assert.equal(dom19.body.apiKey, 'k'),
      assert.equal(dom19.body.instanceType, 'plus'),
      assert.equal(dom19.body.usePersonalQueue, 'false'),
      assert.deepEqual(dom19.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.video-lipsync.v1',
        modelId: 'runninghub/2054101324521844738',
      }));
    const list16 = dom19.body.nodeInfoList,
      handler18 = (value49, value50) =>
        list16.find((item36) => item36.nodeId === value49 && item36.fieldName === value50);
    (assert.equal(handler18('383', 'video')?.fieldValue, 'https://www.runninghub.cn/source.mp4'),
      assert.equal(handler18('390', 'image'), undefined),
      assert.equal(handler18('410', 'value')?.fieldValue, '120'),
      assert.equal(handler18('392', 'value')?.fieldValue, '832'),
      assert.equal(handler18('367', 'audio')?.fieldValue, 'https://www.runninghub.cn/audio.mp3'),
      assert.equal(handler18('393', 'value')?.fieldValue, 'lip sync prompt'),
      assert.equal(handler18('409', 'index')?.fieldValue, '1'));
  }),
  test('RunningHubAdapter 视频对口型：图片入参写入参考图节点并切 index=0', async () => {
    const value51 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async () => ['u_ref'],
      },
      dom20 = await buildVideoRequest(
        {
          model: 'runninghub/2054101324521844738',
          inputUrls: ['local-ref'],
          audioUrl: 'https://www.runninghub.cn/audio.mp3',
          rhVideoFrames: 20,
          rhVideoResolution: 1024,
          rhLipSyncInputIndex: 0,
          prompt: 'lip sync from image',
        },
        '',
        value51,
      ),
      list17 = dom20.body.nodeInfoList,
      handler19 = (value52, value53) =>
        list17.find((item37) => item37.nodeId === value52 && item37.fieldName === value53);
    (assert.equal(handler19('390', 'image')?.fieldValue, 'u_ref'),
      assert.equal(handler19('383', 'video'), undefined),
      assert.equal(handler19('410', 'value')?.fieldValue, '20'),
      assert.equal(handler19('392', 'value')?.fieldValue, '1024'),
      assert.equal(handler19('367', 'audio')?.fieldValue, 'https://www.runninghub.cn/audio.mp3'),
      assert.equal(handler19('393', 'value')?.fieldValue, 'lip sync from image'),
      assert.equal(handler19('409', 'index')?.fieldValue, '0'));
  }),
  test('RunningHubAdapter 视频高清 VIP：通用 manifest 映射模式和源视频', async () => {
    const modelExecution11 = resolveModelExecution('runninghub/2047787809091620866');
    (assert.equal(modelExecution11?.modelManifest?.displayName, '视频高清 VIP'),
      assert.equal(modelExecution11?.executionManifest?.mapping?.preset, undefined),
      assert.equal(
        modelExecution11?.executionManifest?.mapping?.nodeInfoList?.find((item38) => item38.nodeId === '10')
          ?.source,
        'param',
      ));
    const value54 = { getProviderConfig: () => ({ apiKey: 'k' }) },
      dom21 = await buildVideoRequest(
        {
          model: 'runninghub/2047787809091620866',
          videoUrl: 'https://www.runninghub.cn/source.mp4',
          hdMode: 'sharp',
          rhInstanceType: 'plus',
        },
        '',
        value54,
      );
    (assert.equal(dom21.url, '/api/v2/proxy/image'),
      assert.equal(dom21.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/2047787809091620866'),
      assert.equal(dom21.body.instanceType, 'plus'),
      assert.deepEqual(dom21.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.video-hd-vip.v1',
        modelId: 'runninghub/2047787809091620866',
      }));
    const list18 = dom21.body.nodeInfoList,
      handler20 = (value55, value56) =>
        list18.find((item39) => item39.nodeId === value55 && item39.fieldName === value56);
    (assert.equal(handler20('10', 'index')?.fieldValue, '1'),
      assert.equal(handler20('12', 'video')?.fieldValue, 'https://www.runninghub.cn/source.mp4'));
  }),
  test('RunningHubAdapter 视频编辑 V5.4 使用 ai-app 并按节点规则映射', async () => {
    const modelExecution12 = resolveModelExecution('runninghub/2041741496667348994');
    (assert.equal(modelExecution12?.modelManifest?.displayName, '视频编辑V5.4'),
      assert.equal(modelExecution12?.executionManifest?.mapping?.preset, undefined),
      assert.equal(modelExecution12?.executionManifest?.extensions?.payloadResolver, 'runninghubVideoV54'),
      assert.equal(modelExecution12?.executionManifest?.mapping?.sourceVideoNode?.nodeId, '237'),
      assert.equal(modelExecution12?.executionManifest?.mapping?.specialModeNode?.nodeId, '1063'));
    const value57 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async (value58) => {
          const value59 = String(value58?.[0] || '');
          if (value59 === 'ref_local') return ['u_ref'];
          if (value59 === 'first_local') return ['u_first'];
          return [];
        },
      },
      dom22 = await buildVideoRequest(
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
          rhVideoResolution: 1280,
          specialMode: 'cameraMove',
          rhInstanceType: 'plus',
        },
        'a prompt',
        value57,
      );
    (assert.equal(dom22.url, '/api/v2/proxy/image'),
      assert.equal(dom22.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/2041741496667348994'),
      assert.equal(dom22.body.apiKey, 'k'),
      assert.equal(dom22.body.instanceType, 'plus'),
      assert.deepEqual(dom22.adapterTrace, {
        source: 'manifest',
        executionId: 'runninghub.workflow.video-v54.v1',
        modelId: 'runninghub/2041741496667348994',
      }));
    const list19 = dom22.body.nodeInfoList,
      handler21 = (value60, value61) =>
        list19.find((item40) => item40.nodeId === value60 && item40.fieldName === value61);
    (assert.equal(handler21('235', 'value')?.fieldValue, 'a prompt'),
      assert.equal(handler21('915', 'value')?.fieldValue, 'true'),
      assert.equal(handler21('977', 'value')?.fieldValue, '1'),
      assert.equal(handler21('222', 'value')?.fieldValue, '1280'),
      assert.equal(handler21('1077', 'value')?.fieldValue, '30'),
      assert.equal(handler21('237', 'frame_load_cap')?.fieldValue, '88'),
      assert.equal(handler21('237', 'video')?.fieldValue, 'https://www.runninghub.cn/source.mp4'),
      assert.equal(handler21('234', 'image')?.fieldValue, 'u_ref'),
      assert.equal(handler21('1021', 'video')?.fieldValue, 'https://www.runninghub.cn/mask.mp4'),
      assert.equal(handler21('429', 'image')?.fieldValue, 'u_first'),
      assert.equal(handler21('988', 'value')?.fieldValue, '1'),
      assert.equal(handler21('1078', 'value'), undefined),
      assert.equal(handler21('240', 'value'), undefined),
      assert.equal(handler21('979', 'index'), undefined),
      assert.equal(handler21('1076', 'value'), undefined),
      assert.equal(handler21('1063', 'index')?.fieldValue, '2'),
      assert.equal(handler21('1081', 'index'), undefined),
      assert.equal(handler21('1113', 'value'), undefined),
      assert.equal(handler21('1100', 'value'), undefined));
  }),
  test('RunningHubAdapter 视频编辑V5.4：长视频叠加开启 1081 且抖胸幅度大于 0 时写入节点', async () => {
    const value62 = { getProviderConfig: () => ({ apiKey: 'k' }), processInputImages: async () => [] },
      dom23 = await buildVideoRequest(
        {
          model: 'runninghub/2041741496667348994',
          videoUrl: 'https://www.runninghub.cn/source.mp4',
          controlMode: 'efficiency',
          frameRate: 24,
          frameCount: 77,
          rhVideoResolution: 832,
          specialMode: 'longVideoOverlay',
          rhBreastJiggle: 0.35,
        },
        'overlay prompt',
        value62,
      ),
      list20 = dom23.body.nodeInfoList,
      handler22 = (value63, value64) =>
        list20.find((item41) => item41.nodeId === value63 && item41.fieldName === value64);
    (assert.equal(handler22('1063', 'index')?.fieldValue, '1'),
      assert.equal(handler22('1081', 'index')?.fieldValue, '1'),
      assert.equal(handler22('1113', 'value')?.fieldValue, '0.35'),
      assert.equal(handler22('1113', 'value')?.description, '抖胸幅度'),
      assert.equal(handler22('1100', 'value')?.fieldValue, 'true'),
      assert.equal(handler22('1100', 'value')?.description, '是否开抖胸'));
  }),
  test('RunningHubAdapter 视频编辑V5.4：仅在满足条件时加入可选节点并回退默认提示词', async () => {
    const value65 = { getProviderConfig: () => ({ apiKey: 'k' }), processInputImages: async () => [] },
      dom24 = await buildVideoRequest(
        {
          model: 'runninghub/2041741496667348994',
          videoUrl: 'https://www.runninghub.cn/source.mp4',
          controlMode: 'efficiency',
          subtractSubject: false,
          frameRate: 24,
          frameCount: 77,
          rhVideoResolution: 832,
        },
        '   ',
        value65,
      ),
      list21 = dom24.body.nodeInfoList,
      handler23 = (value66, value67) =>
        list21.find((item42) => item42.nodeId === value66 && item42.fieldName === value67);
    (assert.equal(handler23('235', 'value')?.fieldValue, '4K，高质量'),
      assert.equal(handler23('977', 'value')?.fieldValue, '0'),
      assert.equal(handler23('1021', 'video'), undefined),
      assert.equal(handler23('429', 'image'), undefined),
      assert.equal(handler23('988', 'value'), undefined),
      assert.equal(handler23('1078', 'value'), undefined),
      assert.equal(handler23('240', 'value'), undefined),
      assert.equal(handler23('979', 'index'), undefined),
      assert.equal(handler23('1076', 'value'), undefined),
      assert.equal(handler23('1063', 'index'), undefined),
      assert.equal(handler23('1081', 'index'), undefined),
      assert.equal(handler23('1113', 'value'), undefined),
      assert.equal(handler23('1100', 'value'), undefined));
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
      name: name,
      modelId: modelId,
      displayName: displayName,
      appId: appId,
      executionId: executionId,
      hasEnhancedMotionControl: hasEnhancedMotionControl = false,
    }) => {
      test('RunningHubAdapter ' + name + ' uses generic ai-app nodeInfoList mapping', async () => {
        const modelExecution13 = resolveModelExecution(modelId);
        (assert.equal(modelExecution13?.modelManifest?.displayName, displayName),
          assert.equal(modelExecution13?.executionManifest?.mapping?.preset, undefined),
          assert.equal(modelExecution13?.executionManifest?.extensions?.payloadResolver, undefined));
        const value68 = {
            getProviderConfig: () => ({ apiKey: 'k' }),
            processInputImages: async (value69) =>
              String(value69?.[0] || '') === 'ref_local' ? ['u_ref'] : [],
          },
          generationParams = {
            rhVideoResolution: 832,
            rhVideoFps: 24,
            rhVideoFrames: 300,
            rhScail2PersonCount: 2,
            rhScailDetectPrompt: 'person, face',
            rhScail2ReplaceSubject: true,
          };
        hasEnhancedMotionControl && (generationParams.rhScailV2EnhancedMotionControl = true);
        const dom25 = await buildVideoRequest(
          {
            model: modelId,
            videoUrl: 'https://www.runninghub.cn/source.mp4',
            inputUrls: ['ref_local'],
            generationParams: generationParams,
            rhInstanceType: 'plus',
          },
          '   ',
          value68,
        );
        (assert.equal(dom25.url, '/api/v2/proxy/image'),
          assert.equal(dom25.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/' + appId),
          assert.equal(dom25.body.apiKey, 'k'),
          assert.equal(dom25.body.instanceType, 'plus'),
          assert.deepEqual(dom25.adapterTrace, {
            source: 'manifest',
            executionId: executionId,
            modelId: modelId,
          }));
        const list22 = dom25.body.nodeInfoList,
          list23 = [
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
        hasEnhancedMotionControl && list23.push(['458', 'value']);
        assert.deepEqual(
          list22.map((item43) => [item43.nodeId, item43.fieldName]),
          list23,
        );
        const run = (value70, value71) =>
          list22.find((item44) => item44.nodeId === value70 && item44.fieldName === value71);
        (assert.equal(run('336', 'video')?.fieldValue, 'https://www.runninghub.cn/source.mp4'),
          assert.equal(run('338', 'image')?.fieldValue, 'u_ref'),
          assert.equal(run('444', 'value')?.fieldValue, 'true'),
          assert.equal(run('324', 'value')?.fieldValue, '832'),
          assert.equal(run('383', 'value')?.fieldValue, '2'),
          assert.equal(run('318', 'value')?.fieldValue, 'person, face'),
          assert.equal(run('317', 'value')?.fieldValue, ''),
          assert.equal(run('336', 'force_rate')?.fieldValue, '24'),
          assert.equal(run('336', 'frame_load_cap')?.fieldValue, '300'),
          assert.equal(run('458', 'value')?.fieldValue, hasEnhancedMotionControl ? 'true' : undefined));
      });
    },
  ),
  test('RunningHubAdapter Scail V2 defaults enhanced motion control to false', async () => {
    const value72 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async (value73) => (String(value73?.[0] || '') === 'ref_local' ? ['u_ref'] : []),
      },
      dom26 = await buildVideoRequest(
        {
          model: 'runninghub/2065463417577762818',
          videoUrl: 'https://www.runninghub.cn/source.mp4',
          inputUrls: ['ref_local'],
        },
        '',
        value72,
      ),
      handler24 = (value74, value75) =>
        dom26.body.nodeInfoList.find((item45) => item45.nodeId === value74 && item45.fieldName === value75);
    (assert.equal(handler24('458', 'value')?.fieldValue, 'false'),
      assert.equal(handler24('458', 'value')?.description, '强化动作控制'),
      assert.equal(handler24('324', 'value')?.fieldValue, '1024'),
      assert.equal(handler24('318', 'value')?.fieldValue, 'person'),
      assert.equal(handler24('318', 'value')?.description, '检测识别提示词'));
  }),
  test('RunningHubAdapter Scail detect prompt preserves explicit empty value', async () => {
    const value76 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async (value77) => (String(value77?.[0] || '') === 'ref_local' ? ['u_ref'] : []),
      },
      dom27 = await buildVideoRequest(
        {
          model: 'runninghub/2064961300823896065',
          videoUrl: 'https://www.runninghub.cn/source.mp4',
          inputUrls: ['ref_local'],
          generationParams: { rhScailDetectPrompt: '' },
        },
        '',
        value76,
      ),
      handler25 = (value78, value79) =>
        dom27.body.nodeInfoList.find((item46) => item46.nodeId === value78 && item46.fieldName === value79);
    (assert.equal(handler25('318', 'value')?.fieldValue, ''),
      assert.equal(handler25('324', 'value')?.fieldValue, '1024'));
  }),
  test('RunningHubAdapter 视频编辑V5.4：源视频转传失败时给出网络或上传提示', async () => {
    const value80 = globalThis.fetch,
      value81 = { getProviderConfig: () => ({ apiKey: 'k' }), processInputImages: async () => [] };
    try {
      ((globalThis.fetch = async (value82) => {
        const value83 = String(value82 || '');
        if (value83 === 'https://video.example/fail.mp4')
          return new Response('network timeout', { status: 504 });
        throw new Error('unexpected fetch url: ' + value83);
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
                rhVideoResolution: 832,
              },
              'a prompt',
              value81,
            ),
          /源视频上传失败，可能是网络延迟/,
        ));
    } finally {
      globalThis.fetch = value80;
    }
  }),
  test('RunningHubAdapter BERNINI V1: maps input modes, fixed params, and 8-aligned dimensions', async () => {
    const modelExecution14 = resolveModelExecution('runninghub/2062515720147259393');
    (assert.equal(modelExecution14?.modelManifest?.displayName, '新全能视频替换BERNINI V1'),
      assert.equal(
        modelExecution14?.executionManifest?.extensions?.payloadResolver,
        'runninghubBerniniVideoReplaceV1',
      ));
    const value84 = {
        getProviderConfig: () => ({ apiKey: 'k' }),
        processInputImages: async (value85) => (String(value85?.[0] || '') === 'ref_local' ? ['u_ref'] : []),
      },
      handler26 = async (args, value86 = 'bernini prompt') =>
        buildVideoRequest(
          {
            model: 'runninghub/2062515720147259393',
            rhVideoResolution: 832,
            rhBerniniAspectRatio: '16:9',
            rhInstanceType: 'plus',
            ...args,
          },
          value86,
          value84,
        ),
      handler27 = (dom28, value87, value88) =>
        dom28.body.nodeInfoList.find((item47) => item47.nodeId === value87 && item47.fieldName === value88),
      dom29 = await handler26({}, 'text only');
    (assert.equal(dom29.body.instanceType, 'plus'),
      assert.equal(dom29.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/2062515720147259393'),
      assert.equal(handler27(dom29, '34', 'value')?.fieldValue, '0'),
      assert.equal(handler27(dom29, '31', 'video'), undefined),
      assert.equal(handler27(dom29, '32', 'image'), undefined),
      assert.equal(handler27(dom29, '31', 'force_rate')?.fieldValue, '24'),
      assert.equal(handler27(dom29, '19', 'value')?.fieldValue, '121'),
      assert.equal(handler27(dom29, '17', 'value')?.fieldValue, '832'),
      assert.equal(handler27(dom29, '18', 'value')?.fieldValue, '472'),
      assert.equal(handler27(dom29, '53', 'value')?.fieldValue, 'text only'));
    const value89 = await handler26({ rhVideoFps: 30, rhVideoFrames: 180 });
    (assert.equal(handler27(value89, '31', 'force_rate')?.fieldValue, '30'),
      assert.equal(handler27(value89, '19', 'value')?.fieldValue, '180'));
    const value90 = await handler26({ rhBerniniAspectRatio: '自适应', resolvedRatioLabel: '9:16' });
    (assert.equal(handler27(value90, '17', 'value')?.fieldValue, '472'),
      assert.equal(handler27(value90, '18', 'value')?.fieldValue, '832'));
    const value91 = await handler26({ inputUrls: ['ref_local'] });
    (assert.equal(handler27(value91, '34', 'value')?.fieldValue, '1'),
      assert.equal(handler27(value91, '32', 'image')?.fieldValue, 'u_ref'));
    const value92 = await handler26({ inputUrls: ['ref_local'], rhBerniniFunction: 'r2v' });
    assert.equal(handler27(value92, '34', 'value')?.fieldValue, '3');
    const value93 = await handler26({ videoUrl: 'https://www.runninghub.cn/source.mp4' });
    (assert.equal(handler27(value93, '34', 'value')?.fieldValue, '2'),
      assert.equal(handler27(value93, '31', 'video')?.fieldValue, 'https://www.runninghub.cn/source.mp4'));
    const value94 = await handler26({
      videoUrl: 'https://www.runninghub.cn/source.mp4',
      rhBerniniFunction: 'mv2v',
    });
    assert.equal(handler27(value94, '34', 'value')?.fieldValue, '8');
    const value95 = await handler26({
      videoUrl: 'https://www.runninghub.cn/source.mp4',
      inputUrls: ['ref_local'],
    });
    (assert.equal(handler27(value95, '34', 'value')?.fieldValue, '4'),
      assert.equal(handler27(value95, '32', 'image')?.fieldValue, 'u_ref'),
      assert.equal(handler27(value95, '100', 'video'), undefined));
    const value96 = await handler26({
      videoUrl: 'https://www.runninghub.cn/source.mp4',
      inputUrls: ['ref_local'],
      rhBerniniFunction: 'rv2v',
    });
    assert.equal(handler27(value96, '34', 'value')?.fieldValue, '5');
    const value97 = await handler26({
      videoUrl: 'https://www.runninghub.cn/source.mp4',
      inputUrls: ['ref_local'],
      rhBerniniFunction: 'vrc2v',
    });
    assert.equal(handler27(value97, '34', 'value')?.fieldValue, '7');
    const value98 = await handler26({
      videoUrl: 'https://www.runninghub.cn/source.mp4',
      inputUrls: ['ref_local'],
      referenceVideoUrl: 'https://www.runninghub.cn/reference.mp4',
    });
    (assert.equal(handler27(value98, '34', 'value')?.fieldValue, '6'),
      assert.equal(handler27(value98, '32', 'image'), undefined),
      assert.equal(
        handler27(value98, '100', 'video')?.fieldValue,
        'https://www.runninghub.cn/reference.mp4',
      ));
  }),
  test('RunningHubAdapter 视频工作流旧 ID 缺少 manifest 时直接报错', async () => {
    const value99 = { getProviderConfig: () => ({ apiKey: 'k' }), processInputImages: async () => [] };
    await assert.rejects(
      () =>
        buildVideoRequest(
          {
            model: 'runninghub/2037339851183366146',
            videoUrl: 'https://www.runninghub.cn/source.mp4',
            frameRate: 24,
            frameCount: 77,
            rhVideoResolution: 832,
            controlMode: 'efficiency',
          },
          'legacy prompt',
          value99,
        ),
      /video workflow manifest missing/,
    );
  }),
  test('RunningHubAdapter 模型 API 在自适应比例下不透传 aspectRatio（兼容扩图）', async () => {
    const value100 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => ['https://example.com/expand.png'],
      },
      dom30 = await buildModelRequest(
        {
          model: 'runninghub-model/rhart-image-v1',
          inputUrls: ['blob:expand'],
          resolvedRatioLabel: '16:9',
          aspectRatio: '自适应',
          imageSize: '2K',
        },
        '保持主体不变，扩展黑边区域',
        value100,
      );
    (assert.equal(dom30.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/rhart-image-v1/edit'),
      assert.equal(dom30.body.apiKey, 'mk'),
      assert.equal(dom30.body.aspectRatio, '16:9'),
      assert.deepEqual(dom30.body.imageUrls, ['https://example.com/expand.png']),
      assert.equal(dom30.adapterTrace?.source, 'manifest'));
  }),
  test('RunningHubAdapter 模型 API 缺少 manifest 时直接报错', async () => {
    const value101 = {
      getProviderConfig: () => ({ modelApiKey: 'mk' }),
      processInputImages: async () => [],
    };
    await assert.rejects(
      () =>
        buildModelRequest(
          { model: 'runninghub-model/unregistered-model', imageSize: '2K' },
          'test',
          value101,
        ),
      /RunningHub model API manifest missing/,
    );
  }),
  test('RunningHubAdapter 模型API会规范化全角比例分隔符（非 seedream）', async () => {
    const value102 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      dom31 = await buildModelRequest(
        { model: 'runninghub-model/rhart-image-n-g31-flash', aspectRatio: '16：9', imageSize: '4K' },
        'test',
        value102,
      );
    (assert.equal(dom31.body.aspectRatio, '16:9'), assert.equal(dom31.body.resolution, '4k'));
  }),
  test('RunningHubAdapter GPT image 2 有参考图时走 image-to-image 且透传 resolution', async () => {
    const value103 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => ['https://example.com/gpt-image-2-ref.png'],
      },
      dom32 = await buildModelRequest(
        {
          model: 'runninghub-model/rhart-image-g-2',
          inputUrls: ['blob:ref'],
          aspectRatio: '1:1',
          imageSize: '2K',
        },
        'test',
        value103,
      );
    (assert.equal(dom32.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/rhart-image-g-2/image-to-image'),
      assert.equal(dom32.body.aspectRatio, '1:1'),
      assert.equal(dom32.body.resolution, '2k'),
      assert.deepEqual(dom32.body.imageUrls, ['https://example.com/gpt-image-2-ref.png']));
  }),
  test('RunningHubAdapter grok 4.2 低价版有参考图时走 image-to-image 且转换 aspectRatio', async () => {
    let value104 = [];
    const value105 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async (value106) => {
          return ((value104 = value106), ['https://example.com/image-x-ref.png']);
        },
      },
      dom33 = await buildModelRequest(
        {
          model: 'runninghub-model/rhart-image-g',
          inputUrlsBySlot: { imageUrl: 'blob:image-x-ref' },
          aspectRatio: '1:1',
          imageSize: '2K',
        },
        'test',
        value105,
      );
    (assert.deepEqual(value104, ['blob:image-x-ref']),
      assert.equal(dom33.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/rhart-image-g/image-to-image'),
      assert.equal(dom33.body.model, 'g-4.2'),
      assert.equal(dom33.body.imageUrl, 'https://example.com/image-x-ref.png'),
      assert.equal(dom33.body.imageUrls, undefined),
      assert.equal(dom33.body.resolution, undefined),
      assert.equal(dom33.body.aspectRatio, '960x960'));
  }),
  test('RunningHubAdapter grok 4.2 低价版无参考图时走 text-to-image 且转换比例枚举', async () => {
    const value107 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      dom34 = await buildModelRequest(
        { model: 'runninghub-model/rhart-image-g', aspectRatio: '16:9', imageSize: '4K' },
        'test',
        value107,
      );
    (assert.equal(dom34.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/rhart-image-g/text-to-image'),
      assert.equal(dom34.body.model, 'g-4.2'),
      assert.equal(dom34.body.imageUrl, undefined),
      assert.equal(dom34.body.imageUrls, undefined),
      assert.equal(dom34.body.resolution, undefined),
      assert.equal(dom34.body.aspectRatio, '1280x720'));
  }),
  test('RunningHubAdapter grok 4.2 官方版文生图走 official text-to-image', async () => {
    const value108 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      dom35 = await buildModelRequest(
        {
          model: 'runninghub-model/rhart-image-g',
          rhModelRoute: 'official',
          aspectRatio: '16:9',
          imageSize: '2K',
        },
        'test',
        value108,
      );
    (assert.equal(
      dom35.body.apiUrl,
      'https://www.runninghub.cn/openapi/v2/rhart-image-x-official/text-to-image',
    ),
      assert.equal(dom35.body.aspectRatio, '16:9'),
      assert.equal(dom35.body.outputFormat, undefined),
      assert.equal(dom35.body.resolution, undefined),
      assert.equal(dom35.body.model, undefined));
  }),
  test('RunningHubAdapter grok 4.2 官方版图片编辑走 edit 且使用 image 字段', async () => {
    let value109 = [];
    const value110 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async (value111) => {
          return ((value109 = value111), ['https://example.com/official-x-ref.png']);
        },
      },
      dom36 = await buildModelRequest(
        {
          model: 'runninghub-model/rhart-image-g',
          rhModelRoute: 'official',
          inputUrlsBySlot: { imageUrl: 'blob:official-x-ref' },
          aspectRatio: '9:16',
        },
        'test',
        value110,
      );
    (assert.deepEqual(value109, ['blob:official-x-ref']),
      assert.equal(dom36.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/rhart-image-x-official/edit'),
      assert.equal(dom36.body.image, 'https://example.com/official-x-ref.png'),
      assert.equal(dom36.body.imageUrl, undefined),
      assert.equal(dom36.body.aspectRatio, undefined),
      assert.equal(dom36.body.outputFormat, undefined),
      assert.equal(dom36.body.resolution, undefined),
      assert.equal(dom36.body.model, undefined));
  }),
  test('RunningHubAdapter Midjourney V6 使用具名图片插槽和条件权重参数', async () => {
    let value112 = [];
    const value113 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async (value114) => {
          return (
            (value112 = value114),
            ['https://example.com/main.png', 'https://example.com/char.png', 'https://example.com/style.png']
          );
        },
      },
      dom37 = await buildModelRequest(
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
        value113,
      );
    (assert.deepEqual(value112, ['blob:main', 'blob:char', 'blob:style']),
      assert.equal(dom37.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v6'),
      assert.equal(dom37.body.resolution, undefined),
      assert.equal(dom37.body.imageUrls, undefined),
      assert.equal(dom37.body.imageUrl, 'https://example.com/main.png'),
      assert.equal(dom37.body.cref, 'https://example.com/char.png'),
      assert.equal(dom37.body.sref, 'https://example.com/style.png'),
      assert.equal(dom37.body.quality, '2'),
      assert.equal(dom37.body.raw, true),
      assert.equal(dom37.body.tile, false),
      assert.equal(dom37.body.iw, 2),
      assert.equal(dom37.body.cw, 80),
      assert.equal(dom37.body.sw, 250),
      assert.equal(dom37.body.sv, 4),
      assert.equal(dom37.body.stop, 90),
      assert.equal(dom37.body.ow, undefined),
      assert.equal(dom37.body.hd, undefined));
  }),
  test('RunningHubAdapter Midjourney V6 连接参考图时补官方默认数值', async () => {
    let value115 = [];
    const value116 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async (value117) => {
          return (
            (value115 = value117),
            ['https://example.com/main.png', 'https://example.com/char.png', 'https://example.com/style.png']
          );
        },
      },
      dom38 = await buildModelRequest(
        {
          model: 'runninghub-model/youchuan-v6',
          inputUrlsBySlot: { imageUrl: 'blob:main', cref: 'blob:char', sref: 'blob:style' },
          aspectRatio: '16:9',
        },
        'test',
        value116,
      );
    (assert.deepEqual(value115, ['blob:main', 'blob:char', 'blob:style']),
      assert.equal(dom38.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v6'),
      assert.equal(dom38.body.imageUrl, 'https://example.com/main.png'),
      assert.equal(dom38.body.cref, 'https://example.com/char.png'),
      assert.equal(dom38.body.sref, 'https://example.com/style.png'),
      assert.equal(dom38.body.quality, '1'),
      assert.equal(dom38.body.chaos, 0),
      assert.equal(dom38.body.stylize, 0),
      assert.equal(dom38.body.weird, 0),
      assert.equal(dom38.body.raw, false),
      assert.equal(dom38.body.iw, 1),
      assert.equal(dom38.body.cw, 100),
      assert.equal(dom38.body.sw, 100),
      assert.equal(dom38.body.sv, 4),
      assert.equal(dom38.body.stop, 100),
      assert.equal(dom38.body.tile, false),
      assert.equal(dom38.body.ow, undefined),
      assert.equal(dom38.body.hd, undefined));
  }),
  test('RunningHubAdapter Midjourney V7 使用具名图片插槽和 V7 参数', async () => {
    let value118 = [];
    const value119 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async (value120) => {
          return (
            (value118 = value120),
            ['https://example.com/main-v7.png', 'https://example.com/style-v7.png']
          );
        },
      },
      dom39 = await buildModelRequest(
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
        value119,
      );
    (assert.deepEqual(value118, ['blob:main', 'blob:style']),
      assert.equal(dom39.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v7'),
      assert.equal(dom39.body.resolution, undefined),
      assert.equal(dom39.body.imageUrls, undefined),
      assert.equal(dom39.body.imageUrl, 'https://example.com/main-v7.png'),
      assert.equal(dom39.body.sref, 'https://example.com/style-v7.png'),
      assert.equal(dom39.body.cref, undefined),
      assert.equal(dom39.body.cw, undefined),
      assert.equal(dom39.body.stop, undefined),
      assert.equal(dom39.body.hd, undefined),
      assert.equal(dom39.body.quality, '2'),
      assert.equal(dom39.body.raw, true),
      assert.equal(dom39.body.tile, false),
      assert.equal(dom39.body.iw, 2),
      assert.equal(dom39.body.sw, 250),
      assert.equal(dom39.body.sv, 4),
      assert.equal(dom39.body.ow, 150));
  }),
  test('RunningHubAdapter Midjourney V7 未连接风格图时不发送 sw', async () => {
    const value121 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => ['https://example.com/main-v7.png'],
      },
      dom40 = await buildModelRequest(
        {
          model: 'runninghub-model/youchuan-v7',
          inputUrlsBySlot: { imageUrl: 'blob:main' },
          aspectRatio: '9:16',
          iw: '2',
          sw: '999',
        },
        'test',
        value121,
      );
    (assert.equal(dom40.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v7'),
      assert.equal(dom40.body.imageUrl, 'https://example.com/main-v7.png'),
      assert.equal(dom40.body.sref, undefined),
      assert.equal(dom40.body.sw, undefined),
      assert.equal(dom40.body.iw, 2),
      assert.equal(dom40.body.quality, '1'),
      assert.equal(dom40.body.chaos, 0),
      assert.equal(dom40.body.stylize, 0),
      assert.equal(dom40.body.weird, 0),
      assert.equal(dom40.body.raw, false),
      assert.equal(dom40.body.sv, 4),
      assert.equal(dom40.body.ow, 100),
      assert.equal(dom40.body.tile, false));
  }),
  test('RunningHubAdapter Midjourney V7 连接参考图时补官方默认数值', async () => {
    const value122 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [
          'https://example.com/main-v7.png',
          'https://example.com/style-v7.png',
        ],
      },
      dom41 = await buildModelRequest(
        {
          model: 'runninghub-model/youchuan-v7',
          inputUrlsBySlot: { imageUrl: 'blob:main', sref: 'blob:style' },
          aspectRatio: '16:9',
        },
        'test',
        value122,
      );
    (assert.equal(dom41.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v7'),
      assert.equal(dom41.body.imageUrl, 'https://example.com/main-v7.png'),
      assert.equal(dom41.body.sref, 'https://example.com/style-v7.png'),
      assert.equal(dom41.body.quality, '1'),
      assert.equal(dom41.body.chaos, 0),
      assert.equal(dom41.body.stylize, 0),
      assert.equal(dom41.body.weird, 0),
      assert.equal(dom41.body.raw, false),
      assert.equal(dom41.body.iw, 1),
      assert.equal(dom41.body.sw, 100),
      assert.equal(dom41.body.sv, 4),
      assert.equal(dom41.body.ow, 100),
      assert.equal(dom41.body.tile, false));
  }),
  test('RunningHubAdapter Midjourney V8.1 使用官方 iw/sw 参数并过滤其他版本残留', async () => {
    const value123 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => ['https://example.com/main.png'],
      },
      dom42 = await buildModelRequest(
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
        value123,
      );
    (assert.equal(dom42.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v81'),
      assert.equal(dom42.body.imageUrl, 'https://example.com/main.png'),
      assert.equal(dom42.body.sref, undefined),
      assert.equal(dom42.body.sw, 999),
      assert.equal(dom42.body.iw, 3),
      assert.equal(dom42.body.quality, '4'),
      assert.equal(dom42.body.hd, true),
      assert.equal(dom42.body.sv, 6),
      assert.equal(dom42.body.weird, undefined),
      assert.equal(dom42.body.stop, undefined),
      assert.equal(dom42.body.ow, undefined),
      assert.equal(dom42.body.tile, undefined));
  }),
  test('RunningHubAdapter Midjourney V8.1 纯文生图使用官方默认 iw/sw body', async () => {
    const value124 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      dom43 = await buildModelRequest({ model: 'runninghub-model/youchuan-v81' }, 'test', value124);
    (assert.equal(dom43.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v81'),
      assert.equal(dom43.body.imageUrl, undefined),
      assert.equal(dom43.body.sref, undefined),
      assert.equal(dom43.body.iw, 1),
      assert.equal(dom43.body.sw, 100),
      assert.equal(dom43.body.quality, '1'),
      assert.equal(dom43.body.chaos, 0),
      assert.equal(dom43.body.stylize, 0),
      assert.equal(dom43.body.raw, false),
      assert.equal(dom43.body.hd, false),
      assert.equal(dom43.body.sv, 6));
  }),
  test('RunningHubAdapter Midjourney 自适应比例发送解析后的官方比例', async () => {
    const value125 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      dom44 = await buildModelRequest(
        { model: 'runninghub-model/youchuan-v81', aspectRatio: '自适应', resolvedRatioLabel: '3:4' },
        'test',
        value125,
      );
    (assert.equal(dom44.body.aspectRatio, '3:4'), assert.notEqual(dom44.body.aspectRatio, '自适应'));
  }),
  test('RunningHubAdapter GPT image 2 无参考图时走 text-to-image 且透传 resolution', async () => {
    const value126 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      dom45 = await buildModelRequest(
        { model: 'runninghub-model/rhart-image-g-2', imageSize: '4K' },
        'test',
        value126,
      );
    (assert.equal(dom45.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/rhart-image-g-2/text-to-image'),
      assert.equal(dom45.body.resolution, '4k'),
      assert.equal(dom45.body.imageUrls, undefined));
  }),
  test('RunningHubAdapter GPT image 2 official 有参考图时走 official image-to-image', async () => {
    const value127 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => ['https://example.com/gpt-image-2-ref.png'],
      },
      dom46 = await buildModelRequest(
        {
          model: 'runninghub-model/rhart-image-g-2-official',
          inputUrls: ['blob:ref'],
          aspectRatio: '2:1',
          imageSize: '4K',
        },
        'test',
        value127,
      );
    (assert.equal(
      dom46.body.apiUrl,
      'https://www.runninghub.cn/openapi/v2/rhart-image-g-2-official/image-to-image',
    ),
      assert.equal(dom46.body.aspectRatio, '2:1'),
      assert.equal(dom46.body.resolution, '4k'),
      assert.equal(dom46.body.quality, 'medium'),
      assert.deepEqual(dom46.body.imageUrls, ['https://example.com/gpt-image-2-ref.png']));
  }),
  test('RunningHubAdapter GPT image 2 official 无参考图时走 official text-to-image', async () => {
    const value128 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      dom47 = await buildModelRequest(
        { model: 'runninghub-model/rhart-image-g-2-official', aspectRatio: '9:21', imageSize: '2K' },
        'test',
        value128,
      );
    (assert.equal(
      dom47.body.apiUrl,
      'https://www.runninghub.cn/openapi/v2/rhart-image-g-2-official/text-to-image',
    ),
      assert.equal(dom47.body.aspectRatio, '9:21'),
      assert.equal(dom47.body.resolution, '2k'),
      assert.equal(dom47.body.quality, 'medium'),
      assert.equal(dom47.body.imageUrls, undefined));
  }),
  test('RunningHubAdapter GPT image 2 父模型官方 route 携带官方 quality', async () => {
    const value129 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => ['https://example.com/gpt-image-2-ref.png'],
      },
      dom48 = await buildModelRequest(
        {
          model: 'runninghub-model/rhart-image-g-2',
          rhModelRoute: 'official',
          aspectRatio: '16:9',
          imageSize: '2K',
        },
        'test',
        value129,
      );
    (assert.equal(
      dom48.body.apiUrl,
      'https://www.runninghub.cn/openapi/v2/rhart-image-g-2-official/text-to-image',
    ),
      assert.equal(dom48.body.resolution, '2k'),
      assert.equal(dom48.body.aspectRatio, '16:9'),
      assert.equal(dom48.body.quality, 'medium'));
    const dom49 = await buildModelRequest(
      {
        model: 'runninghub-model/rhart-image-g-2',
        rhModelRoute: 'official',
        inputUrls: ['blob:ref'],
        aspectRatio: '2:1',
        imageSize: '4K',
      },
      'test',
      value129,
    );
    (assert.equal(
      dom49.body.apiUrl,
      'https://www.runninghub.cn/openapi/v2/rhart-image-g-2-official/image-to-image',
    ),
      assert.equal(dom49.body.resolution, '4k'),
      assert.equal(dom49.body.aspectRatio, '2:1'),
      assert.equal(dom49.body.quality, 'medium'),
      assert.deepEqual(dom49.body.imageUrls, ['https://example.com/gpt-image-2-ref.png']));
  }),
  test('RunningHubAdapter GPT image 2 official 保留 1K resolution', async () => {
    const value130 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      dom50 = await buildModelRequest(
        { model: 'runninghub-model/rhart-image-g-2-official', aspectRatio: '1:1', imageSize: '1K' },
        'test',
        value130,
      );
    (assert.equal(dom50.body.resolution, '1k'), assert.equal(dom50.body.aspectRatio, '1:1'));
  }),
  test('RunningHubAdapter GPT image 2 official 4K 会回落到支持比例', async () => {
    const value131 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      dom51 = await buildModelRequest(
        { model: 'runninghub-model/rhart-image-g-2-official', aspectRatio: '1:1', imageSize: '4K' },
        'test',
        value131,
      );
    (assert.equal(dom51.body.resolution, '4k'), assert.equal(dom51.body.aspectRatio, '16:9'));
  }),
  test('RunningHubAdapter seedream 三个模型均不透传 aspectRatio', async () => {
    const value132 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      value133 = [
        'runninghub-model/seedream-v4',
        'runninghub-model/seedream-v4.5',
        'runninghub-model/seedream-v5-lite',
      ];
    for (const model of value133) {
      const dom52 = await buildModelRequest(
        { model: model, aspectRatio: '16:9', imageSize: '2K' },
        'test',
        value132,
      );
      (assert.equal(dom52.body.aspectRatio, undefined, 'model=' + model),
        assert.equal(dom52.body.resolution, undefined, 'model=' + model),
        assert.equal(dom52.body.width, 2728, 'model=' + model),
        assert.equal(dom52.body.height, 1536, 'model=' + model));
    }
  }),
  test('RunningHubAdapter 模型 API 在默认 1:1 比例下不透传 aspectRatio', async () => {
    const value134 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      dom53 = await buildModelRequest(
        { model: 'runninghub-model/seedream-v4', aspectRatio: '1:1', imageSize: '2K' },
        'test',
        value134,
      );
    (assert.equal(dom53.body.aspectRatio, undefined),
      assert.equal(dom53.body.resolution, undefined),
      assert.equal(dom53.body.width, 2048),
      assert.equal(dom53.body.height, 2048));
  }),
  test('RunningHubAdapter seedream 宽高满足官方约束：8倍数且在512-8192', async () => {
    const value135 = {
        getProviderConfig: () => ({ modelApiKey: 'mk' }),
        processInputImages: async () => [],
      },
      dom54 = await buildModelRequest(
        { model: 'runninghub-model/seedream-v5-lite', aspectRatio: '21:9', imageSize: '4K' },
        'test',
        value135,
      );
    (assert.equal(dom54.body.aspectRatio, undefined),
      assert.equal(dom54.body.resolution, undefined),
      assert.ok(Number.isInteger(dom54.body.width)),
      assert.ok(Number.isInteger(dom54.body.height)),
      assert.equal(dom54.body.width % 8, 0),
      assert.equal(dom54.body.height % 8, 0),
      assert.ok(dom54.body.width >= 512 && dom54.body.width <= 8192),
      assert.ok(dom54.body.height >= 512 && dom54.body.height <= 8192));
  }));
