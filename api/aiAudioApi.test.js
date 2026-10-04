import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveModelExecution } from '../src/manifests/index.js';
function makeJsonResponse(value, ok = 200) {
  return {
    ok: ok >= 200 && ok < 0x12c,
    status: ok,
    headers: {
      get(item) {
        return String(item || '').toLowerCase() === 'content-type' ? 'application/json' : null;
      },
    },
    json: async () => value,
    text: async () => JSON.stringify(value),
  };
}
async function readUploadedAudioMarker(map) {
  if (!map || typeof map.entries !== 'function') return '';
  for (const [key, response] of map.entries()) {
    if (key === 'file' && response && typeof response.text === 'function') return await response.text();
  }
  return '';
}
function buildPayload() {
  return {
    provider: 'runninghubwf',
    audioWorkflowKey: 'indextts2_clone',
    prompt: 'test audio',
    audioRefs: [{ refSlot: 'audioRef', url: 'https://www.runninghub.cn/assets/ref.mp3' }],
    textInputs: [],
  };
}
(test('aiAudioApi: 音频上传失败不会压缩槽位导致参考音色错位', async () => {
  const index = globalThis.fetch;
  try {
    globalThis.fetch = async (result, dom = {}) => {
      const data = String(result);
      if (data === '/api/config')
        return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
      if (data === 'https://audio.example/ref.mp3') return new Response(new Blob(['ref']), { status: 200 });
      if (data === 'https://audio.example/target.mp3')
        return new Response(new Blob(['target']), { status: 200 });
      if (data.startsWith('/api/v2/proxy/upload?')) {
        assert.equal(dom.headers?.Authorization, 'Bearer k_rh');
        const uploadedAudioMarker = await readUploadedAudioMarker(dom.body);
        if (uploadedAudioMarker === 'ref') return makeJsonResponse({ code: 0x1f4, message: 'upload failed' });
        return makeJsonResponse({
          code: 0,
          data: { download_url: 'https://www.runninghub.cn/' + uploadedAudioMarker + '.mp3' },
        });
      }
      if (data === '/api/v2/proxy/image') throw new Error('不应在参考音色上传失败后继续创建音频任务');
      throw new Error('unexpected fetch url: ' + data);
    };
    const { clearApiConfig: clearApiConfig } = await import('./configApi.js');
    clearApiConfig();
    const { buildGenerateAudioRequest: buildGenerateAudioRequest } = await import('./aiAudioApi.js');
    await assert.rejects(
      () =>
        buildGenerateAudioRequest({
          provider: 'runninghubwf',
          audioWorkflowKey: 'indextts2_clone',
          prompt: 'test audio',
          audioRefs: [
            { refSlot: 'audioRef', url: 'https://audio.example/ref.mp3' },
            { refSlot: 'audioTarget', url: 'https://audio.example/target.mp3' },
          ],
        }),
      /indextts2音色克隆需要参考音色/,
    );
  } finally {
    globalThis.fetch = index;
  }
}),
  test('aiAudioApi: indextts2 单音频带提示词会提交新 App 和 index=0', async () => {
    const options = globalThis.fetch;
    try {
      globalThis.fetch = async (target) => {
        const source = String(target);
        if (source === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        throw new Error('unexpected fetch url: ' + source);
      };
      const { clearApiConfig: clearApiConfig2 } = await import('./configApi.js');
      clearApiConfig2();
      const { buildGenerateAudioRequest: buildGenerateAudioRequest2 } = await import('./aiAudioApi.js'),
        dom2 = await buildGenerateAudioRequest2({
          provider: 'runninghubwf',
          audioWorkflowKey: 'indextts2_clone',
          prompt: '欢迎来到今天的节目',
          audioRefs: [{ url: 'https://www.runninghub.cn/assets/ref.mp3' }],
        });
      (assert.equal(dom2.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/2067594933602705409'),
        assert.deepEqual(dom2.body.nodeInfoList, [
          {
            nodeId: '56',
            fieldName: 'audio',
            fieldValue: 'https://www.runninghub.cn/assets/ref.mp3',
            description: '克隆声音',
          },
          { nodeId: '60', fieldName: 'value', fieldValue: '欢迎来到今天的节目', description: '提示词' },
          { nodeId: '66', fieldName: 'index', fieldValue: '0', description: '模型选择' },
        ]));
    } finally {
      globalThis.fetch = options;
    }
  }),
  test('aiAudioApi: indextts2 双音频空提示词会提交 index=2', async () => {
    const next = globalThis.fetch;
    try {
      globalThis.fetch = async (current) => {
        const entry = String(current);
        if (entry === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        throw new Error('unexpected fetch url: ' + entry);
      };
      const { clearApiConfig: clearApiConfig3 } = await import('./configApi.js');
      clearApiConfig3();
      const { buildGenerateAudioRequest: buildGenerateAudioRequest3 } = await import('./aiAudioApi.js'),
        dom3 = await buildGenerateAudioRequest3({
          provider: 'runninghubwf',
          audioWorkflowKey: 'indextts2_clone',
          prompt: '',
          audioRefs: [
            { refSlot: 'audioRef', url: 'https://www.runninghub.cn/assets/ref.mp3' },
            { refSlot: 'audio2', url: 'https://www.runninghub.cn/assets/ref2.mp3' },
          ],
        });
      (assert.equal(dom3.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/2067594933602705409'),
        assert.deepEqual(dom3.body.nodeInfoList, [
          {
            nodeId: '56',
            fieldName: 'audio',
            fieldValue: 'https://www.runninghub.cn/assets/ref.mp3',
            description: '克隆声音',
          },
          {
            nodeId: '63',
            fieldName: 'audio',
            fieldValue: 'https://www.runninghub.cn/assets/ref2.mp3',
            description: '音频2',
          },
          { nodeId: '60', fieldName: 'value', fieldValue: '', description: '提示词' },
          { nodeId: '66', fieldName: 'index', fieldValue: '2', description: '模型选择' },
        ]));
    } finally {
      globalThis.fetch = next;
    }
  }),
  test('aiAudioApi: indextts2 双音频带提示词会提交 index=1', async () => {
    const record = globalThis.fetch;
    try {
      globalThis.fetch = async (payload) => {
        const handle = String(payload);
        if (handle === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        throw new Error('unexpected fetch url: ' + handle);
      };
      const { clearApiConfig: clearApiConfig4 } = await import('./configApi.js');
      clearApiConfig4();
      const { buildGenerateAudioRequest: buildGenerateAudioRequest4 } = await import('./aiAudioApi.js'),
        dom4 = await buildGenerateAudioRequest4({
          provider: 'runninghubwf',
          audioWorkflowKey: 'indextts2_clone',
          prompt: '双音频提示词',
          audioRefs: [
            { refSlot: 'audioRef', url: 'https://www.runninghub.cn/assets/ref.mp3' },
            { refSlot: 'audio2', url: 'https://www.runninghub.cn/assets/ref2.mp3' },
          ],
        });
      (assert.equal(
        dom4.body.nodeInfoList.find((item2) => item2.nodeId === '60')?.fieldValue,
        '双音频提示词',
      ),
        assert.equal(dom4.body.nodeInfoList.find((item3) => item3.nodeId === '66')?.fieldValue, '1'));
    } finally {
      globalThis.fetch = record;
    }
  }),
  test('aiAudioApi: 音色转换空或旧音频槽会归到 audioRef/audioTarget', async () => {
    const state = globalThis.fetch;
    try {
      globalThis.fetch = async (config) => {
        const scope = String(config);
        if (scope === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        throw new Error('unexpected fetch url: ' + scope);
      };
      const { clearApiConfig: clearApiConfig5 } = await import('./configApi.js');
      clearApiConfig5();
      const { buildGenerateAudioRequest: buildGenerateAudioRequest5 } = await import('./aiAudioApi.js'),
        dom5 = await buildGenerateAudioRequest5({
          provider: 'runninghubwf',
          audioWorkflowKey: 'voice_convert',
          audioRefs: [
            { refSlot: 'audio1', url: 'https://www.runninghub.cn/assets/ref.mp3' },
            { url: 'https://www.runninghub.cn/assets/target.mp3' },
          ],
        });
      assert.deepEqual(dom5.body.nodeInfoList, [
        { nodeId: '10', fieldName: 'audio', fieldValue: 'https://www.runninghub.cn/assets/ref.mp3' },
        { nodeId: '5', fieldName: 'audio', fieldValue: 'https://www.runninghub.cn/assets/target.mp3' },
      ]);
    } finally {
      globalThis.fetch = state;
    }
  }),
  test('aiAudioApi: 进阶声音克隆无音频时只提交 prompt 和 index=0', async () => {
    const input = globalThis.fetch;
    try {
      globalThis.fetch = async (output) => {
        const value2 = String(output);
        if (value2 === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        throw new Error('unexpected fetch url: ' + value2);
      };
      const { clearApiConfig: clearApiConfig6 } = await import('./configApi.js');
      clearApiConfig6();
      const { buildGenerateAudioRequest: buildGenerateAudioRequest6 } = await import('./aiAudioApi.js'),
        dom6 = await buildGenerateAudioRequest6({
          provider: 'runninghubwf',
          audioWorkflowKey: 'advanced_voice_clone',
          prompt: '@音频1 你好 @音频2 回答',
          installId: 'install-audio-1',
          audioRefs: [],
        });
      (assert.equal(dom6.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/2050165249344585729'),
        assert.equal(dom6.headers['X-AIC-Install-Id'], 'install-audio-1'),
        assert.deepEqual(dom6.body.nodeInfoList, [
          {
            nodeId: '33',
            fieldName: 'prompt',
            fieldValue: '[speaker_1]: 你好\n[speaker_2]: 回答',
            description: 'prompt',
          },
          { nodeId: '37', fieldName: 'index', fieldValue: '0', description: 'index' },
        ]));
    } finally {
      globalThis.fetch = input;
    }
  }),
  test('aiAudioApi: 音频工作流请求从 manifest mapping 生成 nodeInfoList', async () => {
    const modelExecution = resolveModelExecution('indextts2_clone'),
      modelExecution2 = resolveModelExecution('voice_convert'),
      modelExecution3 = resolveModelExecution('advanced_voice_clone');
    (assert.equal(modelExecution?.executionManifest?.mapping?.refAudioNode?.nodeId, '56'),
      assert.equal(modelExecution?.executionManifest?.mapping?.audio2Node?.nodeId, '63'),
      assert.equal(modelExecution?.executionManifest?.mapping?.promptNode?.nodeId, '60'),
      assert.equal(modelExecution?.executionManifest?.mapping?.indexNode?.nodeId, '66'),
      assert.equal(modelExecution2?.executionManifest?.mapping?.targetAudioNode?.nodeId, '5'),
      assert.equal(modelExecution3?.executionManifest?.mapping?.indexNode?.nodeId, '37'));
  }),
  test('aiAudioApi: 进阶声音克隆兼容不带 @ 的音频说话人标签', async () => {
    const value3 = globalThis.fetch;
    try {
      globalThis.fetch = async (value4) => {
        const value5 = String(value4);
        if (value5 === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        throw new Error('unexpected fetch url: ' + value5);
      };
      const { clearApiConfig: clearApiConfig7 } = await import('./configApi.js');
      clearApiConfig7();
      const { buildGenerateAudioRequest: buildGenerateAudioRequest7 } = await import('./aiAudioApi.js'),
        dom7 = await buildGenerateAudioRequest7({
          provider: 'runninghubwf',
          audioWorkflowKey: 'advanced_voice_clone',
          prompt: '音频1 你今晚回不回家睡觉阿？ 音频2 不会了你自己睡吧',
          audioRefs: [],
        });
      assert.equal(
        dom7.body.nodeInfoList.find((item4) => item4.nodeId === '33')?.fieldValue,
        '[speaker_1]: 你今晚回不回家睡觉阿？\n[speaker_2]: 不会了你自己睡吧',
      );
    } finally {
      globalThis.fetch = value3;
    }
  }),
  test('aiAudioApi: 进阶声音克隆映射两个音频槽位和 index=2', async () => {
    const value6 = globalThis.fetch;
    try {
      globalThis.fetch = async (value7) => {
        const value8 = String(value7);
        if (value8 === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        throw new Error('unexpected fetch url: ' + value8);
      };
      const { clearApiConfig: clearApiConfig8 } = await import('./configApi.js');
      clearApiConfig8();
      const { buildGenerateAudioRequest: buildGenerateAudioRequest8 } = await import('./aiAudioApi.js'),
        dom8 = await buildGenerateAudioRequest8({
          provider: 'runninghubwf',
          audioWorkflowKey: 'advanced_voice_clone',
          prompt: '对白',
          audioRefs: [
            { refSlot: 'audio1', url: 'https://www.runninghub.cn/assets/a1.mp3' },
            { refSlot: 'audio2', url: 'https://www.runninghub.cn/assets/a2.mp3' },
          ],
        });
      assert.deepEqual(dom8.body.nodeInfoList, [
        {
          nodeId: '1',
          fieldName: 'audio',
          fieldValue: 'https://www.runninghub.cn/assets/a1.mp3',
          description: 'audio',
        },
        {
          nodeId: '25',
          fieldName: 'audio',
          fieldValue: 'https://www.runninghub.cn/assets/a2.mp3',
          description: 'audio',
        },
        { nodeId: '33', fieldName: 'prompt', fieldValue: '对白', description: 'prompt' },
        { nodeId: '37', fieldName: 'index', fieldValue: '2', description: 'index' },
      ]);
    } finally {
      globalThis.fetch = value6;
    }
  }),
  test('aiAudioApi: 进阶声音克隆会把旧音频槽归到 audio1 并设置 index=1', async () => {
    const value9 = globalThis.fetch;
    try {
      globalThis.fetch = async (value10) => {
        const value11 = String(value10);
        if (value11 === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        throw new Error('unexpected fetch url: ' + value11);
      };
      const { clearApiConfig: clearApiConfig9 } = await import('./configApi.js');
      clearApiConfig9();
      const { buildGenerateAudioRequest: buildGenerateAudioRequest9 } = await import('./aiAudioApi.js'),
        dom9 = await buildGenerateAudioRequest9({
          provider: 'runninghubwf',
          audioWorkflowKey: 'advanced_voice_clone',
          prompt: '我是周杰伦，你是哪位',
          audioRefs: [{ refSlot: 'audioRef', url: 'https://www.runninghub.cn/assets/a1.mp3' }],
        });
      assert.deepEqual(dom9.body.nodeInfoList, [
        {
          nodeId: '1',
          fieldName: 'audio',
          fieldValue: 'https://www.runninghub.cn/assets/a1.mp3',
          description: 'audio',
        },
        { nodeId: '33', fieldName: 'prompt', fieldValue: '我是周杰伦，你是哪位', description: 'prompt' },
        { nodeId: '37', fieldName: 'index', fieldValue: '1', description: 'index' },
      ]);
    } finally {
      globalThis.fetch = value9;
    }
  }),
  test('aiAudioApi: generateAudio 在创建任务后回调 onTaskMeta', async () => {
    const value12 = globalThis.fetch,
      handler = globalThis.setTimeout,
      list = [];
    try {
      ((globalThis.setTimeout = (value13, value14, ...args) =>
        handler(value13, Number(value14) > 0x1388 ? Number(value14) : 0, ...args)),
        (globalThis.fetch = async (value15, dom10 = {}) => {
          const value16 = String(value15);
          if (value16 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
          if (value16 === '/api/v2/proxy/image') {
            const value17 = JSON.parse(String(dom10.body || '{}')),
              list2 = String(value17.apiUrl || '');
            if (list2.includes('/openapi/v2/run/ai-app/'))
              return makeJsonResponse({ code: 0, data: { taskId: 'audio-task-1' } });
            if (list2.includes('/openapi/v2/query'))
              return makeJsonResponse({
                code: 0,
                data: { status: 'SUCCESS', result: { audioUrl: 'https://cdn.example.com/final.mp3' } },
              });
          }
          throw new Error('unexpected fetch url: ' + value16);
        }));
      const { clearApiConfig: clearApiConfig10 } = await import('./configApi.js');
      clearApiConfig10();
      const { generateAudio: generateAudio } = await import('./aiAudioApi.js'),
        value18 = await generateAudio(buildPayload(), { onTaskMeta: (value19) => list.push(value19) });
      (assert.equal(list.length, 1),
        assert.equal(list[0].taskId, 'audio-task-1'),
        assert.equal(list[0].useOpenapiQuery, true),
        assert.equal(list[0].apiKey, 'k_rh'),
        assert.equal(value18.taskId, 'audio-task-1'),
        assert.equal(value18.audioUrl, 'https://cdn.example.com/final.mp3'));
    } finally {
      ((globalThis.fetch = value12), (globalThis.setTimeout = handler));
    }
  }),
  test('aiAudioApi: generateAudio 支持 RunningHub 顶层 task_id', async () => {
    const value20 = globalThis.fetch,
      handler2 = globalThis.setTimeout,
      list3 = [];
    try {
      ((globalThis.setTimeout = (value21, value22, ...args2) =>
        handler2(value21, Number(value22) > 0x1388 ? Number(value22) : 0, ...args2)),
        (globalThis.fetch = async (value23, dom11 = {}) => {
          const value24 = String(value23);
          if (value24 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
          if (value24 === '/api/v2/proxy/image') {
            const value25 = JSON.parse(String(dom11.body || '{}')),
              list4 = String(value25.apiUrl || '');
            if (list4.includes('/openapi/v2/run/ai-app/'))
              return makeJsonResponse({ task_id: 'audio-task-top-level-1' });
            if (list4.includes('/openapi/v2/query'))
              return makeJsonResponse({
                code: 0,
                data: {
                  status: 'SUCCESS',
                  result: { audioUrl: 'https://cdn.example.com/final-top-level.mp3' },
                },
              });
          }
          throw new Error('unexpected fetch url: ' + value24);
        }));
      const { clearApiConfig: clearApiConfig11 } = await import('./configApi.js');
      clearApiConfig11();
      const { generateAudio: generateAudio2 } = await import('./aiAudioApi.js'),
        value26 = await generateAudio2(buildPayload(), { onTaskMeta: (value27) => list3.push(value27) });
      (assert.equal(list3.length, 1),
        assert.equal(list3[0].taskId, 'audio-task-top-level-1'),
        assert.equal(value26.taskId, 'audio-task-top-level-1'),
        assert.equal(value26.audioUrl, 'https://cdn.example.com/final-top-level.mp3'));
    } finally {
      ((globalThis.fetch = value20), (globalThis.setTimeout = handler2));
    }
  }),
  test('aiAudioApi: generateAudio 将音频 VIP 拦截转换为订阅错误', async () => {
    const value28 = globalThis.fetch;
    try {
      globalThis.fetch = async (value29, dom12 = {}) => {
        const value30 = String(value29);
        if (value30 === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        if (value30 === '/api/v2/proxy/image') {
          const value31 = JSON.parse(String(dom12.body || '{}'));
          return (
            assert.equal(
              value31.apiUrl,
              'https://www.runninghub.cn/openapi/v2/run/ai-app/2050165249344585729',
            ),
            assert.equal(dom12.headers?.['X-AIC-Install-Id'], 'install-audio-vip'),
            makeJsonResponse({
              code: 'SUBSCRIPTION_REQUIRED',
              message: '该模型为 VIP 模型，请先激活 CDKEY/订阅',
              requiredModelId: 'runninghub/2050165249344585729',
              subscriptionStatus: 'none',
              reasonCode: 'MISSING_INSTALL_ID',
            })
          );
        }
        throw new Error('unexpected fetch url: ' + value30);
      };
      const { clearApiConfig: clearApiConfig12 } = await import('./configApi.js');
      clearApiConfig12();
      const { generateAudio: generateAudio3 } = await import('./aiAudioApi.js');
      await assert.rejects(
        () =>
          generateAudio3({
            provider: 'runninghubwf',
            audioWorkflowKey: 'advanced_voice_clone',
            prompt: '对白',
            installId: 'install-audio-vip',
            audioRefs: [],
          }),
        (value32) => {
          return (
            assert.equal(value32.code, 'SUBSCRIPTION_REQUIRED'),
            assert.equal(value32.requiredModelId, 'runninghub/2050165249344585729'),
            assert.equal(value32.subscriptionStatus, 'none'),
            true
          );
        },
      );
    } finally {
      globalThis.fetch = value28;
    }
  }),
  test('aiAudioApi: resumeRunningHubAudioTask 可从 query 落地结果', async () => {
    const value33 = globalThis.fetch,
      handler3 = globalThis.setTimeout;
    try {
      ((globalThis.setTimeout = (value34, value35, ...args3) =>
        handler3(value34, Number(value35) > 0x1388 ? Number(value35) : 0, ...args3)),
        (globalThis.fetch = async (value36, dom13 = {}) => {
          const value37 = String(value36);
          if (value37 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
          if (value37 === '/api/v2/proxy/image') {
            const value38 = JSON.parse(String(dom13.body || '{}'));
            if (String(value38.apiUrl || '').includes('/openapi/v2/query'))
              return makeJsonResponse({
                code: 0,
                data: { status: 'SUCCESS', results: [{ url: 'https://cdn.example.com/resume.mp3' }] },
              });
          }
          throw new Error('unexpected fetch url: ' + value37);
        }));
      const { clearApiConfig: clearApiConfig13 } = await import('./configApi.js');
      clearApiConfig13();
      const { resumeRunningHubAudioTask: resumeRunningHubAudioTask } = await import('./aiAudioApi.js'),
        value39 = await resumeRunningHubAudioTask('audio-task-2', { apiKey: 'k_rh' });
      (assert.equal(value39.taskId, 'audio-task-2'),
        assert.equal(value39.audioUrl, 'https://cdn.example.com/resume.mp3'));
    } finally {
      ((globalThis.fetch = value33), (globalThis.setTimeout = handler3));
    }
  }),
  test('aiAudioApi: RH 失败时保留错误文案并追加节点详情', async () => {
    const value40 = globalThis.fetch,
      handler4 = globalThis.setTimeout;
    try {
      ((globalThis.setTimeout = (value41, value42, ...args4) =>
        handler4(value41, Number(value42) > 0x1388 ? Number(value42) : 0, ...args4)),
        (globalThis.fetch = async (value43, dom14 = {}) => {
          const value44 = String(value43);
          if (value44 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
          if (value44 === '/api/v2/proxy/image') {
            const value45 = JSON.parse(String(dom14.body || '{}'));
            if (String(value45.apiUrl || '').includes('/openapi/v2/query'))
              return makeJsonResponse({
                taskId: 'audio-task-failed-1',
                status: 'FAILED',
                errorCode: '805',
                errorMessage: '工作流运行失败',
                failedReason: { node_id: '992', exception_message: 'Porn' },
              });
          }
          throw new Error('unexpected fetch url: ' + value44);
        }));
      const { clearApiConfig: clearApiConfig14 } = await import('./configApi.js');
      clearApiConfig14();
      const { resumeRunningHubAudioTask: resumeRunningHubAudioTask2 } = await import('./aiAudioApi.js');
      await assert.rejects(
        () => resumeRunningHubAudioTask2('audio-task-failed-1', { apiKey: 'k_rh' }),
        (error) => {
          const value46 = String(error?.message || '');
          return (
            assert.match(value46, /工作流运行失败/),
            assert.match(value46, /node_id: 992/),
            assert.match(value46, /exception_message: Porn/),
            true
          );
        },
      );
    } finally {
      ((globalThis.fetch = value40), (globalThis.setTimeout = handler4));
    }
  }),
  test('aiAudioApi: buildAudioSeparationRequest 会先上传本地音频并映射到 4/audio', async () => {
    const value47 = globalThis.fetch;
    try {
      globalThis.fetch = async (value48, dom15 = {}) => {
        const value49 = String(value48);
        if (value49 === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        if (value49 === '/output/input.wav')
          return new Response(new Blob(['local-split'], { type: 'audio/wav' }), { status: 200 });
        if (value49.startsWith('/api/v2/proxy/upload?')) {
          assert.equal(dom15.headers?.Authorization, 'Bearer k_rh');
          const uploadedAudioMarker2 = await readUploadedAudioMarker(dom15.body);
          return (
            assert.equal(uploadedAudioMarker2, 'local-split'),
            makeJsonResponse({
              code: 0,
              data: { download_url: 'https://www.runninghub.cn/uploaded/local-split.wav' },
            })
          );
        }
        throw new Error('unexpected fetch url: ' + value49);
      };
      const { clearApiConfig: clearApiConfig15 } = await import('./configApi.js');
      clearApiConfig15();
      const { buildAudioSeparationRequest: buildAudioSeparationRequest } = await import('./aiAudioApi.js'),
        dom16 = await buildAudioSeparationRequest({
          nodeId: 'source-audio-1',
          audioUrl: '/output/input.wav',
          rhInstanceType: 'plus',
        });
      (assert.equal(dom16.body.apiUrl, 'https://www.runninghub.cn/openapi/v2/run/ai-app/2047408096384917505'),
        assert.equal(dom16.body.instanceType, 'plus'),
        assert.equal(dom16.body.usePersonalQueue, 'false'),
        assert.equal(dom16.meta?.adapterTrace?.source, 'manifest'),
        assert.equal(dom16.meta?.adapterTrace?.executionId, 'runninghub.workflow.audio-separation.v1'),
        assert.deepEqual(dom16.body.nodeInfoList, [
          {
            nodeId: '4',
            fieldName: 'audio',
            fieldValue: 'https://www.runninghub.cn/uploaded/local-split.wav',
            description: 'audio',
          },
        ]));
    } finally {
      globalThis.fetch = value47;
    }
  }),
  test('aiAudioApi: buildAudioSeparationRequest 对远端音频也会先走 RH 上传', async () => {
    const value50 = globalThis.fetch;
    try {
      globalThis.fetch = async (value51, dom17 = {}) => {
        const value52 = String(value51);
        if (value52 === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        if (value52 === 'https://audio.example.com/input.mp3')
          return new Response(new Blob(['remote-split'], { type: 'audio/mpeg' }), { status: 200 });
        if (value52.startsWith('/api/v2/proxy/upload?')) {
          assert.equal(dom17.headers?.Authorization, 'Bearer k_rh');
          const uploadedAudioMarker3 = await readUploadedAudioMarker(dom17.body);
          return (
            assert.equal(uploadedAudioMarker3, 'remote-split'),
            makeJsonResponse({
              code: 0,
              data: { download_url: 'https://www.runninghub.cn/uploaded/remote-split.mp3' },
            })
          );
        }
        throw new Error('unexpected fetch url: ' + value52);
      };
      const { clearApiConfig: clearApiConfig16 } = await import('./configApi.js');
      clearApiConfig16();
      const { buildAudioSeparationRequest: buildAudioSeparationRequest2 } = await import('./aiAudioApi.js'),
        dom18 = await buildAudioSeparationRequest2({ audioUrl: 'https://audio.example.com/input.mp3' });
      assert.equal(
        dom18.body.nodeInfoList[0]?.fieldValue,
        'https://www.runninghub.cn/uploaded/remote-split.mp3',
      );
    } finally {
      globalThis.fetch = value50;
    }
  }),
  test('aiAudioApi: runAudioSeparation 会按 nodeId 映射人声与背景声', async () => {
    const value53 = globalThis.fetch,
      handler5 = globalThis.setTimeout;
    try {
      ((globalThis.setTimeout = (value54, value55, ...args5) =>
        handler5(value54, Number(value55) > 0x1388 ? Number(value55) : 0, ...args5)),
        (globalThis.fetch = async (value56, dom19 = {}) => {
          const value57 = String(value56);
          if (value57 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
          if (value57 === '/output/source.mp3')
            return new Response(new Blob(['split-order'], { type: 'audio/mpeg' }), { status: 200 });
          if (value57.startsWith('/api/v2/proxy/upload?'))
            return makeJsonResponse({
              code: 0,
              data: { download_url: 'https://www.runninghub.cn/uploaded/source.mp3' },
            });
          if (value57 === '/api/v2/proxy/image') {
            const value58 = JSON.parse(String(dom19.body || '{}')),
              list5 = String(value58.apiUrl || '');
            if (list5.includes('/openapi/v2/run/ai-app/'))
              return makeJsonResponse({ code: 0, data: { taskId: 'split-task-1' } });
            if (list5.includes('/openapi/v2/query'))
              return makeJsonResponse({
                code: 0,
                data: {
                  status: 'SUCCESS',
                  results: [
                    { nodeId: '7', url: 'https://cdn.example.com/background.mp3' },
                    { nodeId: '5', url: 'https://cdn.example.com/vocals.mp3' },
                  ],
                },
              });
          }
          throw new Error('unexpected fetch url: ' + value57);
        }));
      const { clearApiConfig: clearApiConfig17 } = await import('./configApi.js');
      clearApiConfig17();
      const { runAudioSeparation: runAudioSeparation } = await import('./aiAudioApi.js'),
        value59 = await runAudioSeparation({ audioUrl: '/output/source.mp3' });
      (assert.equal(value59.taskId, 'split-task-1'),
        assert.equal(value59.audios[0].audioUrl, 'https://cdn.example.com/vocals.mp3'),
        assert.equal(value59.audios[0].nodeId, '5'),
        assert.equal(value59.audios[0].role, 'vocals'),
        assert.equal(value59.audios[1].audioUrl, 'https://cdn.example.com/background.mp3'),
        assert.equal(value59.audios[1].nodeId, '7'),
        assert.equal(value59.audios[1].role, 'background'),
        assert.equal(value59.audioUrl, 'https://cdn.example.com/vocals.mp3'),
        assert.equal(value59.vocalsAudioUrl, 'https://cdn.example.com/vocals.mp3'),
        assert.equal(value59.backgroundAudioUrl, 'https://cdn.example.com/background.mp3'));
    } finally {
      ((globalThis.fetch = value53), (globalThis.setTimeout = handler5));
    }
  }),
  test('aiAudioApi: resumeAudioSeparationTask 会按 nodeId 映射人声与背景声', async () => {
    const value60 = globalThis.fetch,
      handler6 = globalThis.setTimeout;
    try {
      ((globalThis.setTimeout = (value61, value62, ...args6) =>
        handler6(value61, Number(value62) > 0x1388 ? Number(value62) : 0, ...args6)),
        (globalThis.fetch = async (value63, dom20 = {}) => {
          const value64 = String(value63);
          if (value64 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
          if (value64 === '/api/v2/proxy/image') {
            const value65 = JSON.parse(String(dom20.body || '{}'));
            if (String(value65.apiUrl || '').includes('/openapi/v2/query'))
              return makeJsonResponse({
                code: 0,
                data: {
                  status: 'SUCCESS',
                  results: [
                    { nodeId: '7', url: 'https://cdn.example.com/resume-background.mp3' },
                    { nodeId: '5', url: 'https://cdn.example.com/resume-vocals.mp3' },
                  ],
                },
              });
          }
          throw new Error('unexpected fetch url: ' + value64);
        }));
      const { clearApiConfig: clearApiConfig18 } = await import('./configApi.js');
      clearApiConfig18();
      const { resumeAudioSeparationTask: resumeAudioSeparationTask } = await import('./aiAudioApi.js'),
        value66 = await resumeAudioSeparationTask('split-task-2', { apiKey: 'k_rh' });
      (assert.equal(value66.audios[0].audioUrl, 'https://cdn.example.com/resume-vocals.mp3'),
        assert.equal(value66.audios[0].nodeId, '5'),
        assert.equal(value66.audios[1].audioUrl, 'https://cdn.example.com/resume-background.mp3'),
        assert.equal(value66.audios[1].nodeId, '7'),
        assert.equal(value66.vocalsAudioUrl, 'https://cdn.example.com/resume-vocals.mp3'),
        assert.equal(value66.backgroundAudioUrl, 'https://cdn.example.com/resume-background.mp3'));
    } finally {
      ((globalThis.fetch = value60), (globalThis.setTimeout = handler6));
    }
  }),
  test('aiAudioApi: resumeAudioSeparationTask 少于两条结果会报错', async () => {
    const value67 = globalThis.fetch,
      handler7 = globalThis.setTimeout;
    try {
      ((globalThis.setTimeout = (value68, value69, ...args7) =>
        handler7(value68, Number(value69) > 0x1388 ? Number(value69) : 0, ...args7)),
        (globalThis.fetch = async (value70, dom21 = {}) => {
          const value71 = String(value70);
          if (value71 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
          if (value71 === '/api/v2/proxy/image') {
            const value72 = JSON.parse(String(dom21.body || '{}'));
            if (String(value72.apiUrl || '').includes('/openapi/v2/query'))
              return makeJsonResponse({
                code: 0,
                data: { status: 'SUCCESS', results: [{ url: 'https://cdn.example.com/only-one.mp3' }] },
              });
          }
          throw new Error('unexpected fetch url: ' + value71);
        }));
      const { clearApiConfig: clearApiConfig19 } = await import('./configApi.js');
      clearApiConfig19();
      const { resumeAudioSeparationTask: resumeAudioSeparationTask2 } = await import('./aiAudioApi.js');
      await assert.rejects(
        () => resumeAudioSeparationTask2('split-task-2', { apiKey: 'k_rh' }),
        /未提取到人声和背景声音频地址/,
      );
    } finally {
      ((globalThis.fetch = value67), (globalThis.setTimeout = handler7));
    }
  }),
  test('aiAudioApi: generateAudio signal abort 不会误判为失败', async () => {
    const value73 = globalThis.fetch;
    try {
      globalThis.fetch = async (value74, dom22 = {}) => {
        const value75 = String(value74);
        if (value75 === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        if (value75 === '/api/v2/proxy/image') {
          const value76 = JSON.parse(String(dom22.body || '{}'));
          if (String(value76.apiUrl || '').includes('/openapi/v2/run/ai-app/'))
            return makeJsonResponse({ code: 0, data: { taskId: 'audio-task-3' } });
        }
        throw new Error('unexpected fetch url: ' + value75);
      };
      const { clearApiConfig: clearApiConfig20 } = await import('./configApi.js');
      clearApiConfig20();
      const { generateAudio: generateAudio4 } = await import('./aiAudioApi.js'),
        signal = new AbortController();
      await assert.rejects(
        () => generateAudio4(buildPayload(), { signal: signal.signal, onTaskMeta: () => signal.abort() }),
        (error2) => error2?.message === 'CANCELLED',
      );
    } finally {
      globalThis.fetch = value73;
    }
  }),
  test('aiAudioApi: resumeRunningHubAudioTask 支持 signal abort', async () => {
    const value77 = globalThis.fetch,
      handler8 = globalThis.setTimeout;
    try {
      ((globalThis.setTimeout = (value78, value79, ...args8) =>
        handler8(value78, Number(value79) > 0x1388 ? Number(value79) : 0, ...args8)),
        (globalThis.fetch = async (value80, dom23 = {}) => {
          const value81 = String(value80);
          if (value81 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
          if (value81 === '/api/v2/proxy/image') {
            const value82 = JSON.parse(String(dom23.body || '{}'));
            if (String(value82.apiUrl || '').includes('/openapi/v2/query'))
              return makeJsonResponse({ code: 0, data: { status: 'RUNNING' } });
          }
          throw new Error('unexpected fetch url: ' + value81);
        }));
      const { clearApiConfig: clearApiConfig21 } = await import('./configApi.js');
      clearApiConfig21();
      const { resumeRunningHubAudioTask: resumeRunningHubAudioTask3 } = await import('./aiAudioApi.js'),
        signal2 = new AbortController();
      (setTimeout(() => signal2.abort(), 0),
        await assert.rejects(
          () => resumeRunningHubAudioTask3('audio-task-4', { apiKey: 'k_rh' }, { signal: signal2.signal }),
          (error3) => error3?.message === 'CANCELLED',
        ));
    } finally {
      ((globalThis.fetch = value77), (globalThis.setTimeout = handler8));
    }
  }));
