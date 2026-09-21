import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveModelExecution } from '../src/manifests/index.js';
function makeJsonResponse(_0x345009, _0x302ff2 = 200) {
  return {
    ok: _0x302ff2 >= 200 && _0x302ff2 < 0x12c,
    status: _0x302ff2,
    headers: {
      get(_0x21ff33) {
        return String(_0x21ff33 || '').toLowerCase() === 'content-type' ? 'application/json' : null;
      },
    },
    json: async () => _0x345009,
    text: async () => JSON.stringify(_0x345009),
  };
}
async function readUploadedAudioMarker(_0x4dfbe6) {
  if (!_0x4dfbe6 || typeof _0x4dfbe6.entries !== 'function') return '';
  for (const [_0x1034ed, _0x55e4aa] of _0x4dfbe6.entries()) {
    if (_0x1034ed === 'file' && _0x55e4aa && typeof _0x55e4aa.text === 'function')
      return await _0x55e4aa.text();
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
  const _0xf4de1 = globalThis.fetch;
  try {
    globalThis.fetch = async (_0x372e00, _0x2a7476 = {}) => {
      const _0x5ac238 = String(_0x372e00);
      if (_0x5ac238 === '/api/config')
        return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
      if (_0x5ac238 === 'https://audio.example/ref.mp3')
        return new Response(new Blob(['ref']), { status: 200 });
      if (_0x5ac238 === 'https://audio.example/target.mp3')
        return new Response(new Blob(['target']), { status: 200 });
      if (_0x5ac238.startsWith('/api/v2/proxy/upload?')) {
        assert.equal(_0x2a7476.headers?.Authorization, 'Bearer k_rh');
        const _0x2a31e1 = await readUploadedAudioMarker(_0x2a7476.body);
        if (_0x2a31e1 === 'ref') return makeJsonResponse({ code: 0x1f4, message: 'upload failed' });
        return makeJsonResponse({
          code: 0,
          data: { download_url: 'https://www.runninghub.cn/' + _0x2a31e1 + '.mp3' },
        });
      }
      if (_0x5ac238 === '/api/v2/proxy/image') throw new Error('不应在参考音色上传失败后继续创建音频任务');
      throw new Error('unexpected fetch url: ' + _0x5ac238);
    };
    const { clearApiConfig: _0x1d050e } = await import('./configApi.js');
    _0x1d050e();
    const { buildGenerateAudioRequest: _0x1fb5b2 } = await import('./aiAudioApi.js');
    await assert.rejects(
      () =>
        _0x1fb5b2({
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
    globalThis.fetch = _0xf4de1;
  }
}),
  test('aiAudioApi: indextts2 单音频带提示词会提交新 App 和 index=0', async () => {
    const _0x4670a3 = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x4c375f) => {
        const _0x8f51fa = String(_0x4c375f);
        if (_0x8f51fa === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        throw new Error('unexpected fetch url: ' + _0x8f51fa);
      };
      const { clearApiConfig: _0x2fc948 } = await import('./configApi.js');
      _0x2fc948();
      const { buildGenerateAudioRequest: _0x9a5180 } = await import('./aiAudioApi.js'),
        _0x41ee29 = await _0x9a5180({
          provider: 'runninghubwf',
          audioWorkflowKey: 'indextts2_clone',
          prompt: '欢迎来到今天的节目',
          audioRefs: [{ url: 'https://www.runninghub.cn/assets/ref.mp3' }],
        });
      (assert.equal(
        _0x41ee29.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/run/ai-app/2067594933602705409',
      ),
        assert.deepEqual(_0x41ee29.body.nodeInfoList, [
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
      globalThis.fetch = _0x4670a3;
    }
  }),
  test('aiAudioApi: indextts2 双音频空提示词会提交 index=2', async () => {
    const _0x5ee30f = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x538a64) => {
        const _0x2d307d = String(_0x538a64);
        if (_0x2d307d === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        throw new Error('unexpected fetch url: ' + _0x2d307d);
      };
      const { clearApiConfig: _0x14a2f6 } = await import('./configApi.js');
      _0x14a2f6();
      const { buildGenerateAudioRequest: _0x1581c0 } = await import('./aiAudioApi.js'),
        _0x5ea33a = await _0x1581c0({
          provider: 'runninghubwf',
          audioWorkflowKey: 'indextts2_clone',
          prompt: '',
          audioRefs: [
            { refSlot: 'audioRef', url: 'https://www.runninghub.cn/assets/ref.mp3' },
            { refSlot: 'audio2', url: 'https://www.runninghub.cn/assets/ref2.mp3' },
          ],
        });
      (assert.equal(
        _0x5ea33a.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/run/ai-app/2067594933602705409',
      ),
        assert.deepEqual(_0x5ea33a.body.nodeInfoList, [
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
      globalThis.fetch = _0x5ee30f;
    }
  }),
  test('aiAudioApi: indextts2 双音频带提示词会提交 index=1', async () => {
    const _0x4c738f = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x5f1f30) => {
        const _0x4eec25 = String(_0x5f1f30);
        if (_0x4eec25 === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        throw new Error('unexpected fetch url: ' + _0x4eec25);
      };
      const { clearApiConfig: _0x29f666 } = await import('./configApi.js');
      _0x29f666();
      const { buildGenerateAudioRequest: _0x9612e2 } = await import('./aiAudioApi.js'),
        _0x46245e = await _0x9612e2({
          provider: 'runninghubwf',
          audioWorkflowKey: 'indextts2_clone',
          prompt: '双音频提示词',
          audioRefs: [
            { refSlot: 'audioRef', url: 'https://www.runninghub.cn/assets/ref.mp3' },
            { refSlot: 'audio2', url: 'https://www.runninghub.cn/assets/ref2.mp3' },
          ],
        });
      (assert.equal(
        _0x46245e.body.nodeInfoList.find((_0x5f169c) => _0x5f169c.nodeId === '60')?.fieldValue,
        '双音频提示词',
      ),
        assert.equal(
          _0x46245e.body.nodeInfoList.find((_0x39acd4) => _0x39acd4.nodeId === '66')?.fieldValue,
          '1',
        ));
    } finally {
      globalThis.fetch = _0x4c738f;
    }
  }),
  test('aiAudioApi: 音色转换空或旧音频槽会归到 audioRef/audioTarget', async () => {
    const _0x25eb88 = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x363ae2) => {
        const _0x1006df = String(_0x363ae2);
        if (_0x1006df === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        throw new Error('unexpected fetch url: ' + _0x1006df);
      };
      const { clearApiConfig: _0x1fe489 } = await import('./configApi.js');
      _0x1fe489();
      const { buildGenerateAudioRequest: _0x48ac66 } = await import('./aiAudioApi.js'),
        _0x306105 = await _0x48ac66({
          provider: 'runninghubwf',
          audioWorkflowKey: 'voice_convert',
          audioRefs: [
            { refSlot: 'audio1', url: 'https://www.runninghub.cn/assets/ref.mp3' },
            { url: 'https://www.runninghub.cn/assets/target.mp3' },
          ],
        });
      assert.deepEqual(_0x306105.body.nodeInfoList, [
        { nodeId: '10', fieldName: 'audio', fieldValue: 'https://www.runninghub.cn/assets/ref.mp3' },
        { nodeId: '5', fieldName: 'audio', fieldValue: 'https://www.runninghub.cn/assets/target.mp3' },
      ]);
    } finally {
      globalThis.fetch = _0x25eb88;
    }
  }),
  test('aiAudioApi: 进阶声音克隆无音频时只提交 prompt 和 index=0', async () => {
    const _0x1ac0fc = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x40721a) => {
        const _0x2fbd97 = String(_0x40721a);
        if (_0x2fbd97 === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        throw new Error('unexpected fetch url: ' + _0x2fbd97);
      };
      const { clearApiConfig: _0x459549 } = await import('./configApi.js');
      _0x459549();
      const { buildGenerateAudioRequest: _0x34c77f } = await import('./aiAudioApi.js'),
        _0x3f4051 = await _0x34c77f({
          provider: 'runninghubwf',
          audioWorkflowKey: 'advanced_voice_clone',
          prompt: '@音频1 你好 @音频2 回答',
          installId: 'install-audio-1',
          audioRefs: [],
        });
      (assert.equal(
        _0x3f4051.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/run/ai-app/2050165249344585729',
      ),
        assert.equal(_0x3f4051.headers['X-AIC-Install-Id'], 'install-audio-1'),
        assert.deepEqual(_0x3f4051.body.nodeInfoList, [
          {
            nodeId: '33',
            fieldName: 'prompt',
            fieldValue: '[speaker_1]: 你好\n[speaker_2]: 回答',
            description: 'prompt',
          },
          { nodeId: '37', fieldName: 'index', fieldValue: '0', description: 'index' },
        ]));
    } finally {
      globalThis.fetch = _0x1ac0fc;
    }
  }),
  test('aiAudioApi: 音频工作流请求从 manifest mapping 生成 nodeInfoList', async () => {
    const _0x1206e4 = resolveModelExecution('indextts2_clone'),
      _0x3baf9e = resolveModelExecution('voice_convert'),
      _0x561c3f = resolveModelExecution('advanced_voice_clone');
    (assert.equal(_0x1206e4?.executionManifest?.mapping?.refAudioNode?.nodeId, '56'),
      assert.equal(_0x1206e4?.executionManifest?.mapping?.audio2Node?.nodeId, '63'),
      assert.equal(_0x1206e4?.executionManifest?.mapping?.promptNode?.nodeId, '60'),
      assert.equal(_0x1206e4?.executionManifest?.mapping?.indexNode?.nodeId, '66'),
      assert.equal(_0x3baf9e?.executionManifest?.mapping?.targetAudioNode?.nodeId, '5'),
      assert.equal(_0x561c3f?.executionManifest?.mapping?.indexNode?.nodeId, '37'));
  }),
  test('aiAudioApi: 进阶声音克隆兼容不带 @ 的音频说话人标签', async () => {
    const _0xbd759c = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x3fa05c) => {
        const _0x475d81 = String(_0x3fa05c);
        if (_0x475d81 === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        throw new Error('unexpected fetch url: ' + _0x475d81);
      };
      const { clearApiConfig: _0x45f2f6 } = await import('./configApi.js');
      _0x45f2f6();
      const { buildGenerateAudioRequest: _0x13134e } = await import('./aiAudioApi.js'),
        _0x5b4964 = await _0x13134e({
          provider: 'runninghubwf',
          audioWorkflowKey: 'advanced_voice_clone',
          prompt: '音频1 你今晚回不回家睡觉阿？ 音频2 不会了你自己睡吧',
          audioRefs: [],
        });
      assert.equal(
        _0x5b4964.body.nodeInfoList.find((_0x49a14f) => _0x49a14f.nodeId === '33')?.fieldValue,
        '[speaker_1]: 你今晚回不回家睡觉阿？\n[speaker_2]: 不会了你自己睡吧',
      );
    } finally {
      globalThis.fetch = _0xbd759c;
    }
  }),
  test('aiAudioApi: 进阶声音克隆映射两个音频槽位和 index=2', async () => {
    const _0x15492f = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x11f44c) => {
        const _0x567853 = String(_0x11f44c);
        if (_0x567853 === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        throw new Error('unexpected fetch url: ' + _0x567853);
      };
      const { clearApiConfig: _0x2ab01a } = await import('./configApi.js');
      _0x2ab01a();
      const { buildGenerateAudioRequest: _0x13ef99 } = await import('./aiAudioApi.js'),
        _0x5947d5 = await _0x13ef99({
          provider: 'runninghubwf',
          audioWorkflowKey: 'advanced_voice_clone',
          prompt: '对白',
          audioRefs: [
            { refSlot: 'audio1', url: 'https://www.runninghub.cn/assets/a1.mp3' },
            { refSlot: 'audio2', url: 'https://www.runninghub.cn/assets/a2.mp3' },
          ],
        });
      assert.deepEqual(_0x5947d5.body.nodeInfoList, [
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
      globalThis.fetch = _0x15492f;
    }
  }),
  test('aiAudioApi: 进阶声音克隆会把旧音频槽归到 audio1 并设置 index=1', async () => {
    const _0x34420d = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x3ce024) => {
        const _0x17cf4a = String(_0x3ce024);
        if (_0x17cf4a === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        throw new Error('unexpected fetch url: ' + _0x17cf4a);
      };
      const { clearApiConfig: _0x2b07c7 } = await import('./configApi.js');
      _0x2b07c7();
      const { buildGenerateAudioRequest: _0x2bead7 } = await import('./aiAudioApi.js'),
        _0x2917ea = await _0x2bead7({
          provider: 'runninghubwf',
          audioWorkflowKey: 'advanced_voice_clone',
          prompt: '我是周杰伦，你是哪位',
          audioRefs: [{ refSlot: 'audioRef', url: 'https://www.runninghub.cn/assets/a1.mp3' }],
        });
      assert.deepEqual(_0x2917ea.body.nodeInfoList, [
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
      globalThis.fetch = _0x34420d;
    }
  }),
  test('aiAudioApi: generateAudio 在创建任务后回调 onTaskMeta', async () => {
    const _0x3fd975 = globalThis.fetch,
      _0x2aa44c = globalThis.setTimeout,
      _0x3092dd = [];
    try {
      ((globalThis.setTimeout = (_0x2507c4, _0x476d5d, ..._0x4b7981) =>
        _0x2aa44c(_0x2507c4, Number(_0x476d5d) > 0x1388 ? Number(_0x476d5d) : 0, ..._0x4b7981)),
        (globalThis.fetch = async (_0x54202b, _0x321654 = {}) => {
          const _0x4ea762 = String(_0x54202b);
          if (_0x4ea762 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
          if (_0x4ea762 === '/api/v2/proxy/image') {
            const _0x378ab6 = JSON.parse(String(_0x321654.body || '{}')),
              _0x4c9d9e = String(_0x378ab6.apiUrl || '');
            if (_0x4c9d9e.includes('/openapi/v2/run/ai-app/'))
              return makeJsonResponse({ code: 0, data: { taskId: 'audio-task-1' } });
            if (_0x4c9d9e.includes('/openapi/v2/query'))
              return makeJsonResponse({
                code: 0,
                data: { status: 'SUCCESS', result: { audioUrl: 'https://cdn.example.com/final.mp3' } },
              });
          }
          throw new Error('unexpected fetch url: ' + _0x4ea762);
        }));
      const { clearApiConfig: _0x251ee9 } = await import('./configApi.js');
      _0x251ee9();
      const { generateAudio: _0x1c5b4a } = await import('./aiAudioApi.js'),
        _0x4e321f = await _0x1c5b4a(buildPayload(), { onTaskMeta: (_0x2ef0f0) => _0x3092dd.push(_0x2ef0f0) });
      (assert.equal(_0x3092dd.length, 1),
        assert.equal(_0x3092dd[0].taskId, 'audio-task-1'),
        assert.equal(_0x3092dd[0].useOpenapiQuery, true),
        assert.equal(_0x3092dd[0].apiKey, 'k_rh'),
        assert.equal(_0x4e321f.taskId, 'audio-task-1'),
        assert.equal(_0x4e321f.audioUrl, 'https://cdn.example.com/final.mp3'));
    } finally {
      ((globalThis.fetch = _0x3fd975), (globalThis.setTimeout = _0x2aa44c));
    }
  }),
  test('aiAudioApi: generateAudio 支持 RunningHub 顶层 task_id', async () => {
    const _0x2c1d58 = globalThis.fetch,
      _0x59c0f9 = globalThis.setTimeout,
      _0x23bea7 = [];
    try {
      ((globalThis.setTimeout = (_0x2dbba5, _0x3c6792, ..._0x35b6db) =>
        _0x59c0f9(_0x2dbba5, Number(_0x3c6792) > 0x1388 ? Number(_0x3c6792) : 0, ..._0x35b6db)),
        (globalThis.fetch = async (_0x17cffc, _0x4f0f4b = {}) => {
          const _0x4e450c = String(_0x17cffc);
          if (_0x4e450c === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
          if (_0x4e450c === '/api/v2/proxy/image') {
            const _0x3663ed = JSON.parse(String(_0x4f0f4b.body || '{}')),
              _0x2e7001 = String(_0x3663ed.apiUrl || '');
            if (_0x2e7001.includes('/openapi/v2/run/ai-app/'))
              return makeJsonResponse({ task_id: 'audio-task-top-level-1' });
            if (_0x2e7001.includes('/openapi/v2/query'))
              return makeJsonResponse({
                code: 0,
                data: {
                  status: 'SUCCESS',
                  result: { audioUrl: 'https://cdn.example.com/final-top-level.mp3' },
                },
              });
          }
          throw new Error('unexpected fetch url: ' + _0x4e450c);
        }));
      const { clearApiConfig: _0x50052e } = await import('./configApi.js');
      _0x50052e();
      const { generateAudio: _0x5357eb } = await import('./aiAudioApi.js'),
        _0x53606c = await _0x5357eb(buildPayload(), { onTaskMeta: (_0x2990af) => _0x23bea7.push(_0x2990af) });
      (assert.equal(_0x23bea7.length, 1),
        assert.equal(_0x23bea7[0].taskId, 'audio-task-top-level-1'),
        assert.equal(_0x53606c.taskId, 'audio-task-top-level-1'),
        assert.equal(_0x53606c.audioUrl, 'https://cdn.example.com/final-top-level.mp3'));
    } finally {
      ((globalThis.fetch = _0x2c1d58), (globalThis.setTimeout = _0x59c0f9));
    }
  }),
  test('aiAudioApi: generateAudio 将音频 VIP 拦截转换为订阅错误', async () => {
    const _0x1a7832 = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x7001cf, _0x366aab = {}) => {
        const _0x4ade02 = String(_0x7001cf);
        if (_0x4ade02 === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        if (_0x4ade02 === '/api/v2/proxy/image') {
          const _0x35a6b9 = JSON.parse(String(_0x366aab.body || '{}'));
          return (
            assert.equal(
              _0x35a6b9.apiUrl,
              'https://www.runninghub.cn/openapi/v2/run/ai-app/2050165249344585729',
            ),
            assert.equal(_0x366aab.headers?.['X-AIC-Install-Id'], 'install-audio-vip'),
            makeJsonResponse({
              code: 'SUBSCRIPTION_REQUIRED',
              message: '该模型为 VIP 模型，请先激活 CDKEY/订阅',
              requiredModelId: 'runninghub/2050165249344585729',
              subscriptionStatus: 'none',
              reasonCode: 'MISSING_INSTALL_ID',
            })
          );
        }
        throw new Error('unexpected fetch url: ' + _0x4ade02);
      };
      const { clearApiConfig: _0x1e315c } = await import('./configApi.js');
      _0x1e315c();
      const { generateAudio: _0x2e9f4f } = await import('./aiAudioApi.js');
      await assert.rejects(
        () =>
          _0x2e9f4f({
            provider: 'runninghubwf',
            audioWorkflowKey: 'advanced_voice_clone',
            prompt: '对白',
            installId: 'install-audio-vip',
            audioRefs: [],
          }),
        (_0x19a814) => {
          return (
            assert.equal(_0x19a814.code, 'SUBSCRIPTION_REQUIRED'),
            assert.equal(_0x19a814.requiredModelId, 'runninghub/2050165249344585729'),
            assert.equal(_0x19a814.subscriptionStatus, 'none'),
            true
          );
        },
      );
    } finally {
      globalThis.fetch = _0x1a7832;
    }
  }),
  test('aiAudioApi: resumeRunningHubAudioTask 可从 query 落地结果', async () => {
    const _0x2e712b = globalThis.fetch,
      _0x2ee9b9 = globalThis.setTimeout;
    try {
      ((globalThis.setTimeout = (_0x560754, _0x36779d, ..._0x2111cc) =>
        _0x2ee9b9(_0x560754, Number(_0x36779d) > 0x1388 ? Number(_0x36779d) : 0, ..._0x2111cc)),
        (globalThis.fetch = async (_0x2191d8, _0x1f7ee1 = {}) => {
          const _0x2d4b48 = String(_0x2191d8);
          if (_0x2d4b48 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
          if (_0x2d4b48 === '/api/v2/proxy/image') {
            const _0x3c2e21 = JSON.parse(String(_0x1f7ee1.body || '{}'));
            if (String(_0x3c2e21.apiUrl || '').includes('/openapi/v2/query'))
              return makeJsonResponse({
                code: 0,
                data: { status: 'SUCCESS', results: [{ url: 'https://cdn.example.com/resume.mp3' }] },
              });
          }
          throw new Error('unexpected fetch url: ' + _0x2d4b48);
        }));
      const { clearApiConfig: _0x3e2945 } = await import('./configApi.js');
      _0x3e2945();
      const { resumeRunningHubAudioTask: _0x5b7ad5 } = await import('./aiAudioApi.js'),
        _0x1ed165 = await _0x5b7ad5('audio-task-2', { apiKey: 'k_rh' });
      (assert.equal(_0x1ed165.taskId, 'audio-task-2'),
        assert.equal(_0x1ed165.audioUrl, 'https://cdn.example.com/resume.mp3'));
    } finally {
      ((globalThis.fetch = _0x2e712b), (globalThis.setTimeout = _0x2ee9b9));
    }
  }),
  test('aiAudioApi: RH 失败时保留错误文案并追加节点详情', async () => {
    const _0x5e9ad3 = globalThis.fetch,
      _0x38565e = globalThis.setTimeout;
    try {
      ((globalThis.setTimeout = (_0x3bc1d3, _0x1d1ac5, ..._0x76d4a5) =>
        _0x38565e(_0x3bc1d3, Number(_0x1d1ac5) > 0x1388 ? Number(_0x1d1ac5) : 0, ..._0x76d4a5)),
        (globalThis.fetch = async (_0xf766ac, _0x54060c = {}) => {
          const _0x541f1f = String(_0xf766ac);
          if (_0x541f1f === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
          if (_0x541f1f === '/api/v2/proxy/image') {
            const _0x39e444 = JSON.parse(String(_0x54060c.body || '{}'));
            if (String(_0x39e444.apiUrl || '').includes('/openapi/v2/query'))
              return makeJsonResponse({
                taskId: 'audio-task-failed-1',
                status: 'FAILED',
                errorCode: '805',
                errorMessage: '工作流运行失败',
                failedReason: { node_id: '992', exception_message: 'Porn' },
              });
          }
          throw new Error('unexpected fetch url: ' + _0x541f1f);
        }));
      const { clearApiConfig: _0x14b7c1 } = await import('./configApi.js');
      _0x14b7c1();
      const { resumeRunningHubAudioTask: _0x317b5b } = await import('./aiAudioApi.js');
      await assert.rejects(
        () => _0x317b5b('audio-task-failed-1', { apiKey: 'k_rh' }),
        (_0x1b59ca) => {
          const _0x16fc6f = String(_0x1b59ca?.message || '');
          return (
            assert.match(_0x16fc6f, /工作流运行失败/),
            assert.match(_0x16fc6f, /node_id: 992/),
            assert.match(_0x16fc6f, /exception_message: Porn/),
            true
          );
        },
      );
    } finally {
      ((globalThis.fetch = _0x5e9ad3), (globalThis.setTimeout = _0x38565e));
    }
  }),
  test('aiAudioApi: buildAudioSeparationRequest 会先上传本地音频并映射到 4/audio', async () => {
    const _0x461c2a = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x3ec45c, _0xa26531 = {}) => {
        const _0x21ccc0 = String(_0x3ec45c);
        if (_0x21ccc0 === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        if (_0x21ccc0 === '/output/input.wav')
          return new Response(new Blob(['local-split'], { type: 'audio/wav' }), { status: 200 });
        if (_0x21ccc0.startsWith('/api/v2/proxy/upload?')) {
          assert.equal(_0xa26531.headers?.Authorization, 'Bearer k_rh');
          const _0x265d93 = await readUploadedAudioMarker(_0xa26531.body);
          return (
            assert.equal(_0x265d93, 'local-split'),
            makeJsonResponse({
              code: 0,
              data: { download_url: 'https://www.runninghub.cn/uploaded/local-split.wav' },
            })
          );
        }
        throw new Error('unexpected fetch url: ' + _0x21ccc0);
      };
      const { clearApiConfig: _0x4e0470 } = await import('./configApi.js');
      _0x4e0470();
      const { buildAudioSeparationRequest: _0x336fe0 } = await import('./aiAudioApi.js'),
        _0x21c20b = await _0x336fe0({
          nodeId: 'source-audio-1',
          audioUrl: '/output/input.wav',
          rhInstanceType: 'plus',
        });
      (assert.equal(
        _0x21c20b.body.apiUrl,
        'https://www.runninghub.cn/openapi/v2/run/ai-app/2047408096384917505',
      ),
        assert.equal(_0x21c20b.body.instanceType, 'plus'),
        assert.equal(_0x21c20b.body.usePersonalQueue, 'false'),
        assert.equal(_0x21c20b.meta?.adapterTrace?.source, 'manifest'),
        assert.equal(_0x21c20b.meta?.adapterTrace?.executionId, 'runninghub.workflow.audio-separation.v1'),
        assert.deepEqual(_0x21c20b.body.nodeInfoList, [
          {
            nodeId: '4',
            fieldName: 'audio',
            fieldValue: 'https://www.runninghub.cn/uploaded/local-split.wav',
            description: 'audio',
          },
        ]));
    } finally {
      globalThis.fetch = _0x461c2a;
    }
  }),
  test('aiAudioApi: buildAudioSeparationRequest 对远端音频也会先走 RH 上传', async () => {
    const _0x2fc9f1 = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x518ba4, _0x4d8165 = {}) => {
        const _0x387754 = String(_0x518ba4);
        if (_0x387754 === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        if (_0x387754 === 'https://audio.example.com/input.mp3')
          return new Response(new Blob(['remote-split'], { type: 'audio/mpeg' }), { status: 200 });
        if (_0x387754.startsWith('/api/v2/proxy/upload?')) {
          assert.equal(_0x4d8165.headers?.Authorization, 'Bearer k_rh');
          const _0x1b4434 = await readUploadedAudioMarker(_0x4d8165.body);
          return (
            assert.equal(_0x1b4434, 'remote-split'),
            makeJsonResponse({
              code: 0,
              data: { download_url: 'https://www.runninghub.cn/uploaded/remote-split.mp3' },
            })
          );
        }
        throw new Error('unexpected fetch url: ' + _0x387754);
      };
      const { clearApiConfig: _0x49af5d } = await import('./configApi.js');
      _0x49af5d();
      const { buildAudioSeparationRequest: _0x4a5a37 } = await import('./aiAudioApi.js'),
        _0x128dca = await _0x4a5a37({ audioUrl: 'https://audio.example.com/input.mp3' });
      assert.equal(
        _0x128dca.body.nodeInfoList[0]?.fieldValue,
        'https://www.runninghub.cn/uploaded/remote-split.mp3',
      );
    } finally {
      globalThis.fetch = _0x2fc9f1;
    }
  }),
  test('aiAudioApi: runAudioSeparation 会按 nodeId 映射人声与背景声', async () => {
    const _0x1294fb = globalThis.fetch,
      _0x427240 = globalThis.setTimeout;
    try {
      ((globalThis.setTimeout = (_0x28fcf8, _0x4247cc, ..._0x47d261) =>
        _0x427240(_0x28fcf8, Number(_0x4247cc) > 0x1388 ? Number(_0x4247cc) : 0, ..._0x47d261)),
        (globalThis.fetch = async (_0x1a1918, _0x3d27c2 = {}) => {
          const _0x255ed5 = String(_0x1a1918);
          if (_0x255ed5 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
          if (_0x255ed5 === '/output/source.mp3')
            return new Response(new Blob(['split-order'], { type: 'audio/mpeg' }), { status: 200 });
          if (_0x255ed5.startsWith('/api/v2/proxy/upload?'))
            return makeJsonResponse({
              code: 0,
              data: { download_url: 'https://www.runninghub.cn/uploaded/source.mp3' },
            });
          if (_0x255ed5 === '/api/v2/proxy/image') {
            const _0x2eee0b = JSON.parse(String(_0x3d27c2.body || '{}')),
              _0x2bc076 = String(_0x2eee0b.apiUrl || '');
            if (_0x2bc076.includes('/openapi/v2/run/ai-app/'))
              return makeJsonResponse({ code: 0, data: { taskId: 'split-task-1' } });
            if (_0x2bc076.includes('/openapi/v2/query'))
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
          throw new Error('unexpected fetch url: ' + _0x255ed5);
        }));
      const { clearApiConfig: _0x12e794 } = await import('./configApi.js');
      _0x12e794();
      const { runAudioSeparation: _0x108361 } = await import('./aiAudioApi.js'),
        _0x23f14b = await _0x108361({ audioUrl: '/output/source.mp3' });
      (assert.equal(_0x23f14b.taskId, 'split-task-1'),
        assert.equal(_0x23f14b.audios[0].audioUrl, 'https://cdn.example.com/vocals.mp3'),
        assert.equal(_0x23f14b.audios[0].nodeId, '5'),
        assert.equal(_0x23f14b.audios[0].role, 'vocals'),
        assert.equal(_0x23f14b.audios[1].audioUrl, 'https://cdn.example.com/background.mp3'),
        assert.equal(_0x23f14b.audios[1].nodeId, '7'),
        assert.equal(_0x23f14b.audios[1].role, 'background'),
        assert.equal(_0x23f14b.audioUrl, 'https://cdn.example.com/vocals.mp3'),
        assert.equal(_0x23f14b.vocalsAudioUrl, 'https://cdn.example.com/vocals.mp3'),
        assert.equal(_0x23f14b.backgroundAudioUrl, 'https://cdn.example.com/background.mp3'));
    } finally {
      ((globalThis.fetch = _0x1294fb), (globalThis.setTimeout = _0x427240));
    }
  }),
  test('aiAudioApi: resumeAudioSeparationTask 会按 nodeId 映射人声与背景声', async () => {
    const _0x391a3f = globalThis.fetch,
      _0x2edac7 = globalThis.setTimeout;
    try {
      ((globalThis.setTimeout = (_0x32fdef, _0x1dfff5, ..._0x2bc124) =>
        _0x2edac7(_0x32fdef, Number(_0x1dfff5) > 0x1388 ? Number(_0x1dfff5) : 0, ..._0x2bc124)),
        (globalThis.fetch = async (_0x3db0c2, _0x3887ab = {}) => {
          const _0x1400ff = String(_0x3db0c2);
          if (_0x1400ff === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
          if (_0x1400ff === '/api/v2/proxy/image') {
            const _0x2629aa = JSON.parse(String(_0x3887ab.body || '{}'));
            if (String(_0x2629aa.apiUrl || '').includes('/openapi/v2/query'))
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
          throw new Error('unexpected fetch url: ' + _0x1400ff);
        }));
      const { clearApiConfig: _0xfc7be8 } = await import('./configApi.js');
      _0xfc7be8();
      const { resumeAudioSeparationTask: _0x1d778e } = await import('./aiAudioApi.js'),
        _0xa2843f = await _0x1d778e('split-task-2', { apiKey: 'k_rh' });
      (assert.equal(_0xa2843f.audios[0].audioUrl, 'https://cdn.example.com/resume-vocals.mp3'),
        assert.equal(_0xa2843f.audios[0].nodeId, '5'),
        assert.equal(_0xa2843f.audios[1].audioUrl, 'https://cdn.example.com/resume-background.mp3'),
        assert.equal(_0xa2843f.audios[1].nodeId, '7'),
        assert.equal(_0xa2843f.vocalsAudioUrl, 'https://cdn.example.com/resume-vocals.mp3'),
        assert.equal(_0xa2843f.backgroundAudioUrl, 'https://cdn.example.com/resume-background.mp3'));
    } finally {
      ((globalThis.fetch = _0x391a3f), (globalThis.setTimeout = _0x2edac7));
    }
  }),
  test('aiAudioApi: resumeAudioSeparationTask 少于两条结果会报错', async () => {
    const _0x2de87f = globalThis.fetch,
      _0x20bbdd = globalThis.setTimeout;
    try {
      ((globalThis.setTimeout = (_0x478db2, _0x5ddfa4, ..._0x5d1602) =>
        _0x20bbdd(_0x478db2, Number(_0x5ddfa4) > 0x1388 ? Number(_0x5ddfa4) : 0, ..._0x5d1602)),
        (globalThis.fetch = async (_0x17838b, _0xd7712a = {}) => {
          const _0x1d6a87 = String(_0x17838b);
          if (_0x1d6a87 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
          if (_0x1d6a87 === '/api/v2/proxy/image') {
            const _0x5b750c = JSON.parse(String(_0xd7712a.body || '{}'));
            if (String(_0x5b750c.apiUrl || '').includes('/openapi/v2/query'))
              return makeJsonResponse({
                code: 0,
                data: { status: 'SUCCESS', results: [{ url: 'https://cdn.example.com/only-one.mp3' }] },
              });
          }
          throw new Error('unexpected fetch url: ' + _0x1d6a87);
        }));
      const { clearApiConfig: _0x4e53a5 } = await import('./configApi.js');
      _0x4e53a5();
      const { resumeAudioSeparationTask: _0x418e3f } = await import('./aiAudioApi.js');
      await assert.rejects(
        () => _0x418e3f('split-task-2', { apiKey: 'k_rh' }),
        /未提取到人声和背景声音频地址/,
      );
    } finally {
      ((globalThis.fetch = _0x2de87f), (globalThis.setTimeout = _0x20bbdd));
    }
  }),
  test('aiAudioApi: generateAudio signal abort 不会误判为失败', async () => {
    const _0x38450f = globalThis.fetch;
    try {
      globalThis.fetch = async (_0x569f02, _0x5c1999 = {}) => {
        const _0x5981a3 = String(_0x569f02);
        if (_0x5981a3 === '/api/config')
          return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
        if (_0x5981a3 === '/api/v2/proxy/image') {
          const _0x523277 = JSON.parse(String(_0x5c1999.body || '{}'));
          if (String(_0x523277.apiUrl || '').includes('/openapi/v2/run/ai-app/'))
            return makeJsonResponse({ code: 0, data: { taskId: 'audio-task-3' } });
        }
        throw new Error('unexpected fetch url: ' + _0x5981a3);
      };
      const { clearApiConfig: _0x19e999 } = await import('./configApi.js');
      _0x19e999();
      const { generateAudio: _0x54f157 } = await import('./aiAudioApi.js'),
        _0x5115a4 = new AbortController();
      await assert.rejects(
        () => _0x54f157(buildPayload(), { signal: _0x5115a4.signal, onTaskMeta: () => _0x5115a4.abort() }),
        (_0x30e611) => _0x30e611?.message === 'CANCELLED',
      );
    } finally {
      globalThis.fetch = _0x38450f;
    }
  }),
  test('aiAudioApi: resumeRunningHubAudioTask 支持 signal abort', async () => {
    const _0x5794c0 = globalThis.fetch,
      _0x262923 = globalThis.setTimeout;
    try {
      ((globalThis.setTimeout = (_0x17c9ed, _0x4fd02b, ..._0x52c5c5) =>
        _0x262923(_0x17c9ed, Number(_0x4fd02b) > 0x1388 ? Number(_0x4fd02b) : 0, ..._0x52c5c5)),
        (globalThis.fetch = async (_0x59bb6a, _0x269663 = {}) => {
          const _0x5702a5 = String(_0x59bb6a);
          if (_0x5702a5 === '/api/config')
            return makeJsonResponse({ providers: { runninghub: { apiUrl: 'https://x/', apiKey: 'k_rh' } } });
          if (_0x5702a5 === '/api/v2/proxy/image') {
            const _0x129294 = JSON.parse(String(_0x269663.body || '{}'));
            if (String(_0x129294.apiUrl || '').includes('/openapi/v2/query'))
              return makeJsonResponse({ code: 0, data: { status: 'RUNNING' } });
          }
          throw new Error('unexpected fetch url: ' + _0x5702a5);
        }));
      const { clearApiConfig: _0x5438aa } = await import('./configApi.js');
      _0x5438aa();
      const { resumeRunningHubAudioTask: _0x4d6096 } = await import('./aiAudioApi.js'),
        _0x5b3be3 = new AbortController();
      (setTimeout(() => _0x5b3be3.abort(), 0),
        await assert.rejects(
          () => _0x4d6096('audio-task-4', { apiKey: 'k_rh' }, { signal: _0x5b3be3.signal }),
          (_0x15a181) => _0x15a181?.message === 'CANCELLED',
        ));
    } finally {
      ((globalThis.fetch = _0x5794c0), (globalThis.setTimeout = _0x262923));
    }
  }));
