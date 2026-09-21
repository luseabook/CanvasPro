import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGenerateTextRequest, generateText } from './aiTextApi.js';
import { clearApiConfig } from './configApi.js';
function jsonResponse(_0x10b1c5, _0x596c8e = 200) {
  return new Response(JSON.stringify(_0x10b1c5), {
    status: _0x596c8e,
    headers: { 'Content-Type': 'application/json' },
  });
}
function imageResponse(_0x5c9921, _0x564ce9 = 'image/png') {
  return new Response(new Blob([_0x5c9921], { type: _0x564ce9 }), {
    status: 200,
    headers: { 'Content-Type': _0x564ce9 },
  });
}
async function readUploadMarker(_0x2f6a41) {
  if (!_0x2f6a41 || typeof _0x2f6a41.entries !== 'function') return '';
  for (const [_0x192e9f, _0x555ba6] of _0x2f6a41.entries()) {
    if (_0x192e9f !== 'file') continue;
    if (_0x555ba6 && typeof _0x555ba6.text === 'function') return await _0x555ba6.text();
  }
  return '';
}
function isTelegraphProxyUpload(_0x167a6e) {
  const _0x2fdd66 = String(_0x167a6e || '');
  if (!_0x2fdd66.startsWith('/api/v2/proxy/upload?')) return false;
  const _0x5aa1b2 = _0x2fdd66.slice(_0x2fdd66.indexOf('?') + 1);
  return new URLSearchParams(_0x5aa1b2).get('apiUrl') === 'https://telegra.ph/upload';
}
async function withMockFetch(_0xfb40fb, _0x1e8445) {
  const _0x2b36cb = globalThis.fetch;
  (clearApiConfig(), (globalThis.fetch = _0xfb40fb));
  try {
    return await _0x1e8445();
  } finally {
    ((globalThis.fetch = _0x2b36cb), clearApiConfig());
  }
}
async function withImmediateTimers(_0x1a3f91) {
  const _0x53f7bc = globalThis.setTimeout;
  globalThis.setTimeout = (_0x4c4441, _0x4a2a81, ..._0x1974ae) => {
    if (typeof _0x4c4441 === 'function') _0x4c4441(..._0x1974ae);
    return 0;
  };
  try {
    return await _0x1a3f91();
  } finally {
    globalThis.setTimeout = _0x53f7bc;
  }
}
async function withMockCanvasComposition(_0x4b78d3) {
  const _0x12ab69 = globalThis.createImageBitmap,
    _0x38e167 = globalThis.OffscreenCanvas;
  ((globalThis.createImageBitmap = async () => ({ width: 0x280, height: 0x1e0, close() {} })),
    (globalThis.OffscreenCanvas = class _0x1c3d68 {
      constructor(_0x5be392, _0x3dafcb) {
        ((this.width = _0x5be392),
          (this.height = _0x3dafcb),
          (this._ctx = {
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 1,
            font: '',
            textAlign: '',
            textBaseline: '',
            fillRect() {},
            drawImage() {},
            strokeRect() {},
            fillText() {},
          }));
      }
      ['getContext']() {
        return this._ctx;
      }
      async ['convertToBlob']() {
        return new Blob(['merged-runninghub-image'], { type: 'image/png' });
      }
    }));
  try {
    return await _0x4b78d3();
  } finally {
    ((globalThis.createImageBitmap = _0x12ab69), (globalThis.OffscreenCanvas = _0x38e167));
  }
}
const RUNNINGHUB_FLASH_MODEL = 'runninghub-model/rhart-text-g-3-flash-preview-cv/image-to-text',
  RUNNINGHUB_PRO_MODEL = 'runninghub-model/rhart-text-g-3-pro-preview-cv/image-to-text',
  RUNNINGHUB_QWEN36_PLUS_MODEL = 'qwen/qwen3.6-plus',
  RUNNINGHUB_QWEN3_VL_MODEL = 'qwen/qwen3-vl-235b-a22b-instruct',
  RUNNINGHUB_IMAGE_URL = 'https://www.runninghub.cn/example/input.png';
(test('aiTextApi: OpenAI 兼容请求会把 @图片 映射为 image_url，并保留前后文本', async () => {
  await withMockFetch(
    async (_0x32c132) => {
      const _0x325a7e = String(_0x32c132 || '');
      if (_0x325a7e === '/api/config')
        return jsonResponse({
          providers: { openai: { apiUrl: 'https://api.openai.com', apiKey: 'k_openai' } },
        });
      if (_0x325a7e === '/local/ref.png') return imageResponse('openai-image');
      if (isTelegraphProxyUpload(_0x325a7e)) return jsonResponse([{ src: '/uploaded-openai-ref.png' }]);
      throw new Error('unexpected fetch url: ' + _0x325a7e);
    },
    async () => {
      const _0x37a411 = await buildGenerateTextRequest({
        provider: 'openai',
        model: 'gpt-4.1-mini',
        prompt: '请详细分析 @图片1 ，并保留这句文字。',
        inputUrls: ['/local/ref.png'],
      });
      (assert.equal(_0x37a411.url, '/api/v2/proxy/completions'),
        assert.equal(_0x37a411.body.apiUrl, 'https://api.openai.com/v1'),
        assert.equal(_0x37a411.body.model, 'gpt-4.1-mini'));
      const _0x2b1f4e = _0x37a411.body.messages[1].content;
      (assert.ok(Array.isArray(_0x2b1f4e)),
        assert.deepEqual(_0x2b1f4e, [
          { type: 'text', text: '请详细分析 ' },
          { type: 'image_url', image_url: { url: 'https://telegra.ph/uploaded-openai-ref.png' } },
          { type: 'text', text: ' ，并保留这句文字。' },
        ]));
    },
  );
}),
  test('aiTextApi: Volcengine Doubao Seed text models use Ark Responses API', async () => {
    await withMockFetch(
      async (_0x544e5d) => {
        const _0x52aee7 = String(_0x544e5d || '');
        if (_0x52aee7 === '/api/config')
          return jsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_volcengine' },
            },
          });
        throw new Error('unexpected fetch url: ' + _0x52aee7);
      },
      async () => {
        const _0x8e15f1 = [
          ['volcengine/doubao-seed-2-0-pro-260215', 'doubao-seed-2-0-pro-260215'],
          ['doubao-seed-2-0-mini-260428', 'doubao-seed-2-0-mini-260428'],
          ['doubao-seed-2-0-lite-260428', 'doubao-seed-2-0-lite-260428'],
        ];
        for (const [_0x2dc19e, _0x32b054] of _0x8e15f1) {
          const _0x319a0c = await buildGenerateTextRequest({
            provider: 'volcengine',
            model: _0x2dc19e,
            prompt: 'plain text prompt',
          });
          (assert.equal(_0x319a0c.url, '/api/v2/proxy/completions'),
            assert.equal(_0x319a0c.body.apiUrl, 'https://ark.cn-beijing.volces.com/api/v3/responses'),
            assert.equal(_0x319a0c.body.apiKey, 'k_volcengine'),
            assert.equal(_0x319a0c.body.model, _0x32b054),
            assert.deepEqual(_0x319a0c.body.input, [
              { role: 'user', content: [{ type: 'input_text', text: 'plain text prompt' }] },
            ]));
        }
      },
    );
  }),
  test('aiTextApi: Volcengine media inputs upload through Ark Files API', async () => {
    const _0x17aa90 = 'https://ark-project.tos-cn-beijing.volces.com/doc_video/ark_vlm_video_input.mp4',
      _0x47206f = '/local/ref.png',
      _0x409e1d = [];
    await withMockFetch(
      async (_0x54fc9d, _0x341ad6 = {}) => {
        const _0x3b878b = String(_0x54fc9d || '');
        if (_0x3b878b === '/api/config')
          return jsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_volcengine' },
            },
          });
        if (_0x3b878b === _0x47206f) return imageResponse('volcengine-image');
        if (_0x3b878b === _0x17aa90) return imageResponse('volcengine-video', 'video/mp4');
        if (_0x3b878b.startsWith('/api/v2/proxy/upload?')) {
          assert.equal(_0x341ad6.headers?.Authorization, 'Bearer k_volcengine');
          const _0x2df476 = new URL('http://local' + _0x3b878b).searchParams.get('apiUrl');
          assert.equal(_0x2df476, 'https://ark.cn-beijing.volces.com/api/v3/files');
          const _0x4a5caa = Object.fromEntries(_0x341ad6.body.entries());
          (assert.equal(_0x4a5caa.purpose, 'user_data'), _0x409e1d.push(_0x4a5caa.file?.name || ''));
          const _0x423032 = await _0x4a5caa.file.text();
          if (_0x423032 === 'volcengine-image')
            return jsonResponse({
              object: 'file',
              id: 'file-image-1',
              status: 'active',
              purpose: 'user_data',
            });
          if (_0x423032 === 'volcengine-video')
            return (
              assert.equal(_0x4a5caa['preprocess_configs[video][fps]'], '0.3'),
              jsonResponse({ object: 'file', id: 'file-video-1', status: 'processing', purpose: 'user_data' })
            );
        }
        if (_0x3b878b.startsWith('/api/v2/proxy/task?')) {
          assert.equal(_0x341ad6.headers?.Authorization, 'Bearer k_volcengine');
          const _0x5ec475 = new URL('http://local' + _0x3b878b).searchParams.get('apiUrl');
          return (
            assert.equal(_0x5ec475, 'https://ark.cn-beijing.volces.com/api/v3/files/file-video-1'),
            jsonResponse({ object: 'file', id: 'file-video-1', status: 'active', purpose: 'user_data' })
          );
        }
        throw new Error('unexpected fetch url: ' + _0x3b878b);
      },
      async () => {
        const _0x36d8ea = 'https://ark-project.tos-cn-beijing.volces.com/doc_video/ark_vlm_video_input.mp4',
          _0x3d33d5 = await buildGenerateTextRequest({
            provider: 'volcengine',
            model: 'volcengine/doubao-seed-2-0-pro-260215',
            prompt: '先看 @图片1 再总结 @视频1 的内容。',
            inputUrls: [_0x47206f, _0x36d8ea],
            inputImageUrls: [_0x47206f],
            inputVideoUrls: [_0x36d8ea],
          });
        (assert.equal(_0x3d33d5.body.model, 'doubao-seed-2-0-pro-260215'),
          assert.deepEqual(_0x3d33d5.body.input[0].content, [
            { type: 'input_text', text: '先看 ' },
            { type: 'input_image', file_id: 'file-image-1' },
            { type: 'input_text', text: ' 再总结 ' },
            { type: 'input_video', file_id: 'file-video-1' },
            { type: 'input_text', text: ' 的内容。' },
          ]),
          assert.deepEqual(_0x409e1d.sort(), ['ref.png', 'ark_vlm_video_input.mp4'].sort()));
      },
    );
  }),
  test('aiTextApi: Volcengine local video inputs upload through Ark Files API', async () => {
    await withMockFetch(
      async (_0xea5f58, _0x4aedaa = {}) => {
        const _0x203d7f = String(_0xea5f58 || '');
        if (_0x203d7f === '/api/config')
          return jsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_volcengine' },
            },
          });
        if (_0x203d7f.endsWith('/local/ref.mp4')) return imageResponse('local-volcengine-video', 'video/mp4');
        if (_0x203d7f.startsWith('/api/v2/proxy/upload?')) {
          const _0x3ee4d1 = Object.fromEntries(_0x4aedaa.body.entries());
          return (
            assert.equal(await _0x3ee4d1.file.text(), 'local-volcengine-video'),
            jsonResponse({ object: 'file', id: 'file-local-video', status: 'active' })
          );
        }
        throw new Error('unexpected fetch url: ' + _0x203d7f);
      },
      async () => {
        const _0x311da2 = await buildGenerateTextRequest({
          provider: 'volcengine',
          model: 'volcengine/doubao-seed-2-0-pro-260215',
          prompt: '请总结 @视频1',
          inputUrls: ['/local/ref.mp4'],
          inputVideoUrls: ['/local/ref.mp4'],
        });
        assert.deepEqual(_0x311da2.body.input[0].content, [
          { type: 'input_text', text: '请总结 ' },
          { type: 'input_video', file_id: 'file-local-video' },
        ]);
      },
    );
  }),
  test('aiTextApi: custom provider 多图请求会按顺序映射为多个 image_url', async () => {
    await withMockFetch(
      async (_0x3257c1, _0x581567 = {}) => {
        const _0x4f8188 = String(_0x3257c1 || '');
        if (_0x4f8188 === '/api/config')
          return jsonResponse({
            providers: {
              openai: {
                apiUrl: 'https://ark.cn-beijing.volces.com/api/v3',
                apiKey: 'k_custom_openai_compatible',
              },
            },
          });
        if (_0x4f8188 === '/local/first.png') return imageResponse('custom-image-1');
        if (_0x4f8188 === '/local/second.png') return imageResponse('custom-image-2');
        if (isTelegraphProxyUpload(_0x4f8188)) {
          const _0x125985 = await readUploadMarker(_0x581567.body);
          if (_0x125985 === 'custom-image-1') return jsonResponse([{ src: '/uploaded-custom-first.png' }]);
          if (_0x125985 === 'custom-image-2') return jsonResponse([{ src: '/uploaded-custom-second.png' }]);
        }
        throw new Error('unexpected fetch url: ' + _0x4f8188);
      },
      async () => {
        const _0x442a97 = await buildGenerateTextRequest({
          provider: 'custom',
          model: 'doubao-seed-2-0-pro',
          prompt: 'compare @图片1 with @图片2',
          inputUrls: ['/local/first.png', '/local/second.png'],
        });
        (assert.equal(_0x442a97.url, '/api/v2/proxy/completions'),
          assert.equal(_0x442a97.body.apiUrl, 'https://ark.cn-beijing.volces.com/api/v3'),
          assert.equal(_0x442a97.body.apiKey, 'k_custom_openai_compatible'),
          assert.equal(_0x442a97.body.model, 'doubao-seed-2-0-pro'),
          assert.deepEqual(_0x442a97.body.messages[1].content, [
            { type: 'text', text: 'compare ' },
            { type: 'image_url', image_url: { url: 'https://telegra.ph/uploaded-custom-first.png' } },
            { type: 'text', text: ' with ' },
            { type: 'image_url', image_url: { url: 'https://telegra.ph/uploaded-custom-second.png' } },
          ]));
      },
    );
  }),
  test('aiTextApi: custom provider 纯文本请求保持字符串 content', async () => {
    await withMockFetch(
      async (_0x19582c) => {
        const _0x4b3774 = String(_0x19582c || '');
        if (_0x4b3774 === '/api/config')
          return jsonResponse({
            providers: {
              openai: {
                apiUrl: 'https://ark.cn-beijing.volces.com/api/v3',
                apiKey: 'k_custom_openai_compatible',
              },
            },
          });
        throw new Error('unexpected fetch url: ' + _0x4b3774);
      },
      async () => {
        const _0xc98ba = await buildGenerateTextRequest({
          provider: 'custom',
          model: 'doubao-seed-2-0-pro',
          prompt: 'only text prompt',
        });
        (assert.equal(_0xc98ba.url, '/api/v2/proxy/completions'),
          assert.equal(_0xc98ba.body.apiUrl, 'https://ark.cn-beijing.volces.com/api/v3'),
          assert.equal(_0xc98ba.body.messages[1].content, 'only text prompt'));
      },
    );
  }),
  test('aiTextApi: OpenAI 兼容文本请求会透传 systemPrompt', async () => {
    await withMockFetch(
      async (_0x36e50f) => {
        const _0x938f95 = String(_0x36e50f || '');
        if (_0x938f95 === '/api/config')
          return jsonResponse({
            providers: {
              openai: { apiUrl: 'https://api.openai-compatible.local', apiKey: 'k_custom_openai_compatible' },
            },
          });
        throw new Error('unexpected fetch url: ' + _0x938f95);
      },
      async () => {
        const _0x32c1bc = await buildGenerateTextRequest({
          provider: 'custom',
          model: 'gpt-compatible',
          prompt: '用户剧情',
          systemPrompt: '只输出合法 JSON。',
        });
        (assert.equal(_0x32c1bc.url, '/api/v2/proxy/completions'),
          assert.equal(_0x32c1bc.body.messages[0].role, 'system'),
          assert.equal(_0x32c1bc.body.messages[0].content, '只输出合法 JSON。'),
          assert.equal(_0x32c1bc.body.messages[1].content, '用户剧情'));
      },
    );
  }),
  test('aiTextApi: unregistered provider model fails without legacy routing fallback', async () => {
    await withMockFetch(
      async (_0x2df8d6) => {
        const _0x59bcf1 = String(_0x2df8d6 || '');
        if (_0x59bcf1 === '/api/config')
          return jsonResponse({
            providers: { grsai: { apiUrl: 'https://grsai.dakka.com.cn', apiKey: 'k_grsai' } },
          });
        throw new Error('unexpected fetch url: ' + _0x59bcf1);
      },
      async () => {
        await assert.rejects(
          () =>
            buildGenerateTextRequest({
              provider: 'grsai',
              model: 'grsai/unregistered-text-model',
              prompt: 'hello',
            }),
          /GRSAI text model API manifest missing: grsai\/unregistered-text-model/,
        );
      },
    );
  }),
  test('aiTextApi: bare unknown model no longer defaults to GRSAI', async () => {
    await withMockFetch(
      async (_0x3c16e8) => {
        const _0x49bca4 = String(_0x3c16e8 || '');
        if (_0x49bca4 === '/api/config') return jsonResponse({ providers: {} });
        throw new Error('unexpected fetch url: ' + _0x49bca4);
      },
      async () => {
        await assert.rejects(
          () => buildGenerateTextRequest({ model: 'gemini-future-unregistered', prompt: 'hello' }),
          /Text model API manifest missing: gemini-future-unregistered/,
        );
      },
    );
  }),
  test('aiTextApi: APIMart new text models strip provider prefix for wire model', async () => {
    const _0xc7817f = [
      ['apimart/kimi-k2-instruct', 'kimi-k2-instruct'],
      ['apimart/gpt-5.5', 'gpt-5.5'],
      ['apimart/gpt-5.4-mini', 'gpt-5.4-mini'],
      ['apimart/gemini-3.5-flash', 'gemini-3.5-flash'],
    ];
    await withMockFetch(
      async (_0x478a91) => {
        const _0x303b7e = String(_0x478a91 || '');
        if (_0x303b7e === '/api/config')
          return jsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        throw new Error('unexpected fetch url: ' + _0x303b7e);
      },
      async () => {
        for (const [_0x356098, _0x4dae3f] of _0xc7817f) {
          const _0x2cf885 = await buildGenerateTextRequest({
            provider: 'apimart',
            model: _0x356098,
            prompt: 'plain text prompt',
          });
          (assert.equal(_0x2cf885.url, '/api/v2/proxy/completions'),
            assert.equal(_0x2cf885.body.apiUrl, 'https://api.apimart.ai/v1/chat/completions'),
            assert.equal(_0x2cf885.body.model, _0x4dae3f),
            assert.equal(_0x2cf885.body.messages[1].content, 'plain text prompt'));
        }
      },
    );
  }),
  test('aiTextApi: APIMart routeId domestic2 builds aishuch chat endpoint', async () => {
    await withMockFetch(
      async (_0x5255c5) => {
        const _0x530ba9 = String(_0x5255c5 || '');
        if (_0x530ba9 === '/api/config')
          return jsonResponse({ providers: { apimart: { routeId: 'domestic2', apiKey: 'k_apimart' } } });
        throw new Error('unexpected fetch url: ' + _0x530ba9);
      },
      async () => {
        const _0x5021dd = await buildGenerateTextRequest({
          provider: 'apimart',
          model: 'apimart/kimi-k2-instruct',
          prompt: 'plain text prompt',
        });
        (assert.equal(_0x5021dd.url, '/api/v2/proxy/completions'),
          assert.equal(_0x5021dd.body.apiUrl, 'https://api.aishuch.com/v1/chat/completions'),
          assert.equal(_0x5021dd.body.model, 'kimi-k2-instruct'));
      },
    );
  }),
  test('aiTextApi: APIMart Gemini 图片请求统一使用 GPT image_url 格式', async () => {
    await withMockFetch(
      async (_0x24ed60, _0x29d674 = {}) => {
        const _0x2d3e81 = String(_0x24ed60 || '');
        if (_0x2d3e81 === '/api/config')
          return jsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        if (_0x2d3e81 === '/local/ref.png') return imageResponse('gemini-image');
        if (_0x2d3e81 === '/api/v2/proxy/apimart-upload') {
          const _0x104b97 = Object.fromEntries(_0x29d674.body.entries());
          return (
            assert.equal(_0x104b97.contentType, 'image/png'),
            assert.equal(_0x104b97.fileExtension, 'png'),
            assert.equal(await _0x104b97.file.text(), 'gemini-image'),
            jsonResponse({ cdnUrl: 'https://cdn.apimart.ai/files/gemini-ref.png' })
          );
        }
        throw new Error('unexpected fetch url: ' + _0x2d3e81);
      },
      async () => {
        const _0x4db10b = await buildGenerateTextRequest({
          provider: 'apimart',
          model: 'apimart/gemini-3.1-pro-preview',
          prompt: '分析 @图片1 的细节。',
          inputUrls: ['/local/ref.png'],
        });
        (assert.equal(_0x4db10b.url, '/api/v2/proxy/completions'),
          assert.equal(_0x4db10b.body.apiUrl, 'https://api.apimart.ai/v1/chat/completions'),
          assert.equal(_0x4db10b.body.model, 'gemini-3.1-pro-preview'));
        const _0x1f75e0 = _0x4db10b.body.messages[1].content;
        (assert.deepEqual(_0x1f75e0[0], { type: 'text', text: '分析 ' }),
          assert.deepEqual(_0x1f75e0[1], {
            type: 'image_url',
            image_url: { url: 'https://cdn.apimart.ai/files/gemini-ref.png' },
          }),
          assert.deepEqual(_0x1f75e0[2], { type: 'text', text: ' 的细节。' }));
      },
    );
  }),
  test('aiTextApi: APIMart Gemini 菜单裸模型名会归一化并使用 GPT 格式', async () => {
    await withMockFetch(
      async (_0x3d3ca8, _0x190f69 = {}) => {
        const _0x1b01c0 = String(_0x3d3ca8 || '');
        if (_0x1b01c0 === '/api/config')
          return jsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        if (_0x1b01c0 === '/local/ref.png') return imageResponse('gemini-image');
        if (_0x1b01c0 === '/api/v2/proxy/apimart-upload') {
          const _0x2f2428 = Object.fromEntries(_0x190f69.body.entries());
          return (
            assert.equal(await _0x2f2428.file.text(), 'gemini-image'),
            jsonResponse({ cdnUrl: 'https://cdn.apimart.ai/files/gemini-ref.png' })
          );
        }
        throw new Error('unexpected fetch url: ' + _0x1b01c0);
      },
      async () => {
        const _0x91e3cb = await buildGenerateTextRequest({
          provider: 'apimart',
          model: 'gemini-3.1-pro-preview',
          prompt: '分析 @图片1',
          inputUrls: ['/local/ref.png'],
          inputImageUrls: ['/local/ref.png'],
        });
        (assert.equal(_0x91e3cb.body.apiUrl, 'https://api.apimart.ai/v1/chat/completions'),
          assert.equal(_0x91e3cb.body.model, 'gemini-3.1-pro-preview'),
          assert.deepEqual(_0x91e3cb.body.messages[1].content[1], {
            type: 'image_url',
            image_url: { url: 'https://cdn.apimart.ai/files/gemini-ref.png' },
          }));
      },
    );
  }),
  test('aiTextApi: APIMart 已上传 CDN 图片使用 GPT image_url 且不会重复上传', async () => {
    await withMockFetch(
      async (_0x6ab156) => {
        const _0xe48c02 = String(_0x6ab156 || '');
        if (_0xe48c02 === '/api/config')
          return jsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        throw new Error('unexpected fetch url: ' + _0xe48c02);
      },
      async () => {
        const _0x1ea9b7 = await buildGenerateTextRequest({
          provider: 'apimart',
          model: 'apimart/gemini-3-flash-preview-nothinking',
          prompt: '分析 @图片1',
          inputUrls: ['https://upload.apimart.ai/files/existing.webp'],
          inputImageUrls: ['https://upload.apimart.ai/files/existing.webp'],
        });
        (assert.equal(_0x1ea9b7.body.apiUrl, 'https://api.apimart.ai/v1/chat/completions'),
          assert.deepEqual(_0x1ea9b7.body.messages[1].content, [
            { type: 'text', text: '分析 ' },
            { type: 'image_url', image_url: { url: 'https://upload.apimart.ai/files/existing.webp' } },
          ]));
      },
    );
  }),
  test('aiTextApi: APIMart GPT 格式多图上传按 @图片编号映射', async () => {
    await withMockFetch(
      async (_0x44697f, _0x56342c = {}) => {
        const _0x27c6d5 = String(_0x44697f || '');
        if (_0x27c6d5 === '/api/config')
          return jsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        if (_0x27c6d5 === '/local/first.png') return imageResponse('apimart-first');
        if (_0x27c6d5 === '/local/second.png') return imageResponse('apimart-second');
        if (_0x27c6d5 === '/api/v2/proxy/apimart-upload') {
          const _0x255194 = Object.fromEntries(_0x56342c.body.entries()),
            _0x97c4f6 = await _0x255194.file.text();
          if (_0x97c4f6 === 'apimart-first')
            return jsonResponse({ cdnUrl: 'https://cdn.apimart.ai/files/first.png' });
          if (_0x97c4f6 === 'apimart-second')
            return jsonResponse({ cdnUrl: 'https://cdn.apimart.ai/files/second.png' });
        }
        throw new Error('unexpected fetch url: ' + _0x27c6d5);
      },
      async () => {
        const _0x1fcda8 = await buildGenerateTextRequest({
          provider: 'apimart',
          model: 'apimart/gemini-3-flash-preview-nothinking',
          prompt: '先看 @图片2 再看 @图片1',
          inputUrls: ['/local/first.png', '/local/second.png'],
          inputImageUrls: ['/local/first.png', '/local/second.png'],
        });
        (assert.equal(_0x1fcda8.body.apiUrl, 'https://api.apimart.ai/v1/chat/completions'),
          assert.deepEqual(_0x1fcda8.body.messages[1].content, [
            { type: 'text', text: '先看 ' },
            { type: 'image_url', image_url: { url: 'https://cdn.apimart.ai/files/second.png' } },
            { type: 'text', text: ' 再看 ' },
            { type: 'image_url', image_url: { url: 'https://cdn.apimart.ai/files/first.png' } },
          ]));
      },
    );
  }),
  test('aiTextApi: APIMart GPT 文本格式遇到视频参考会明确报错', async () => {
    await withMockFetch(
      async (_0x5e244b) => {
        const _0x36f809 = String(_0x5e244b || '');
        if (_0x36f809 === '/api/config')
          return jsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        throw new Error('unexpected fetch url: ' + _0x36f809);
      },
      async () => {
        await assert.rejects(
          () =>
            buildGenerateTextRequest({
              provider: 'apimart',
              model: 'apimart/gemini-3-flash-preview-nothinking',
              prompt: '分析 @视频1 的内容。',
              inputUrls: ['/local/ref.mp4'],
              inputVideoUrls: ['/local/ref.mp4'],
            }),
          /APIMart 文本模型已统一使用 GPT 图文格式/,
        );
      },
    );
  }),
  test('aiTextApi: APIMart GPT 文本格式遇到已上传视频参考也会明确报错', async () => {
    await withMockFetch(
      async (_0x3de90d) => {
        const _0x443473 = String(_0x3de90d || '');
        if (_0x443473 === '/api/config')
          return jsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        throw new Error('unexpected fetch url: ' + _0x443473);
      },
      async () => {
        await assert.rejects(
          () =>
            buildGenerateTextRequest({
              provider: 'apimart',
              model: 'apimart/gemini-3-flash-preview-nothinking',
              prompt: '分析 @视频1',
              inputUrls: ['https://upload.apimart.ai/files/existing.mp4'],
              inputVideoUrls: ['https://upload.apimart.ai/files/existing.mp4'],
            }),
          /APIMart 文本模型已统一使用 GPT 图文格式/,
        );
      },
    );
  }),
  test('aiTextApi: RunningHUB 单图文本请求会走图片代理并优先使用 modelApiKey', async () => {
    await withMockFetch(
      async (_0x310015) => {
        const _0x477861 = String(_0x310015 || '');
        if (_0x477861 === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        throw new Error('unexpected fetch url: ' + _0x477861);
      },
      async () => {
        const _0x4ec91b = await buildGenerateTextRequest({
          provider: 'runninghub',
          model: RUNNINGHUB_FLASH_MODEL,
          apiKey: 'payload_key_should_not_win',
          prompt: '请描述图片内容',
          inputImageUrls: [RUNNINGHUB_IMAGE_URL],
        });
        (assert.equal(_0x4ec91b.url, '/api/v2/proxy/image'),
          assert.equal(
            _0x4ec91b.body.apiUrl,
            'https://www.runninghub.cn/openapi/v2/rhart-text-g-3-flash-preview-cv/image-to-text',
          ),
          assert.equal(_0x4ec91b.body.apiKey, 'k_runninghub_model'),
          assert.equal(_0x4ec91b.body.prompt, '请描述图片内容'),
          assert.equal(_0x4ec91b.body.imageUrl, RUNNINGHUB_IMAGE_URL),
          assert.equal(_0x4ec91b.adapterTrace?.source, 'manifest'),
          assert.equal(
            _0x4ec91b.adapterTrace?.executionId,
            'runninghub.model-api.rhart-text-g-3-flash-cv.v1',
          ),
          assert.deepEqual(Object.keys(_0x4ec91b.body).sort(), ['apiKey', 'apiUrl', 'imageUrl', 'prompt']));
      },
    );
  }),
  test('aiTextApi: RunningHUB LLM 文本模型走官方 chat completions 端点', async () => {
    await withMockFetch(
      async (_0x15bcee) => {
        const _0x3806de = String(_0x15bcee || '');
        if (_0x3806de === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        throw new Error('unexpected fetch url: ' + _0x3806de);
      },
      async () => {
        const _0xf8b15d = await buildGenerateTextRequest({
          provider: 'runninghub',
          model: RUNNINGHUB_QWEN36_PLUS_MODEL,
          apiKey: 'payload_key_should_not_win',
          prompt: 'plain text prompt',
        });
        (assert.equal(_0xf8b15d.url, '/api/v2/proxy/completions'),
          assert.equal(_0xf8b15d.body.apiUrl, 'https://llm.runninghub.cn/v1/chat/completions'),
          assert.equal(_0xf8b15d.body.apiKey, 'k_runninghub_model'),
          assert.equal(_0xf8b15d.body.model, RUNNINGHUB_QWEN36_PLUS_MODEL),
          assert.equal(_0xf8b15d.body.messages[1].content, 'plain text prompt'),
          assert.equal(_0xf8b15d.adapterTrace?.source, 'manifest'),
          assert.equal(_0xf8b15d.adapterTrace?.executionId, 'runninghub.model-api.text.qwen3-6-plus.v1'));
      },
    );
  }),
  test('aiTextApi: RunningHUB LLM 直接返回 choices 时不会把 chat id 当 taskId 轮询', async () => {
    const _0xfef2d0 = [];
    (await withMockFetch(
      async (_0xc64244, _0x4e47cc = {}) => {
        const _0x35d90f = String(_0xc64244 || '');
        _0xfef2d0.push({ target: _0x35d90f, options: _0x4e47cc });
        if (_0x35d90f === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        if (_0x35d90f === '/api/v2/proxy/completions')
          return jsonResponse({
            id: 'chatcmpl-qwen-direct',
            object: 'chat.completion',
            choices: [
              { message: { role: 'assistant', content: 'Qwen 直接文本结果' }, finish_reason: 'stop' },
            ],
          });
        if (_0x35d90f === '/api/v2/proxy/image')
          throw new Error('Qwen chat completion result should not poll task query');
        throw new Error('unexpected fetch url: ' + _0x35d90f);
      },
      async () => {
        const _0x4bb3b7 = await generateText({
          provider: 'runninghub',
          model: RUNNINGHUB_QWEN36_PLUS_MODEL,
          prompt: 'plain text prompt',
        });
        assert.equal(_0x4bb3b7.text, 'Qwen 直接文本结果');
      },
    ),
      assert.equal(
        _0xfef2d0.filter((_0x2674a1) => _0x2674a1.target === '/api/v2/proxy/completions').length,
        1,
      ),
      assert.equal(_0xfef2d0.filter((_0x5f486c) => _0x5f486c.target === '/api/v2/proxy/image').length, 0));
  }),
  test('aiTextApi: RunningHUB LLM 原始 SSE 会合并 delta 文本后直接返回', async () => {
    await withMockFetch(
      async (_0x1cfd2c) => {
        const _0x1c151c = String(_0x1cfd2c || '');
        if (_0x1c151c === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        if (_0x1c151c === '/api/v2/proxy/completions')
          return new Response(
            [
              'data: {"id":"chatcmpl-qwen-sse","choices":[{"delta":{"role":"assistant"}}]}',
              'data: {"choices":[{"delta":{"content":"Qwen "}}]}',
              'data: {"choices":[{"delta":{"content":"SSE 文本"},"finish_reason":"stop"}]}',
              'data: [DONE]',
              '',
            ].join('\n\n'),
            { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
          );
        if (_0x1c151c === '/api/v2/proxy/image')
          throw new Error('Qwen SSE result should not poll task query');
        throw new Error('unexpected fetch url: ' + _0x1c151c);
      },
      async () => {
        const _0x1b98a1 = await generateText({
          provider: 'runninghub',
          model: RUNNINGHUB_QWEN36_PLUS_MODEL,
          prompt: 'plain text prompt',
        });
        assert.equal(_0x1b98a1.text, 'Qwen SSE 文本');
      },
    );
  }),
  test('aiTextApi: RunningHUB Qwen3-VL 文本节点支持图像入参', async () => {
    await withMockFetch(
      async (_0x5bc521, _0x21e1d0 = {}) => {
        const _0xd15cab = String(_0x5bc521 || '');
        if (_0xd15cab === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        if (_0xd15cab === '/local/qwen-vl.png') return imageResponse('qwen-vl-image');
        if (_0xd15cab.startsWith('/api/v2/proxy/upload?'))
          return (
            assert.equal(_0x21e1d0.headers?.Authorization, 'Bearer k_runninghub_model'),
            jsonResponse({
              code: 0,
              data: { download_url: 'https://www.runninghub.cn/uploaded/qwen-vl.png' },
            })
          );
        throw new Error('unexpected fetch url: ' + _0xd15cab);
      },
      async () => {
        const _0x114a69 = await buildGenerateTextRequest({
          provider: 'runninghub',
          model: RUNNINGHUB_QWEN3_VL_MODEL,
          prompt: '识别 @图片1 中的文字',
          inputUrls: ['/local/qwen-vl.png'],
          inputImageUrls: ['/local/qwen-vl.png'],
        });
        (assert.equal(_0x114a69.url, '/api/v2/proxy/completions'),
          assert.equal(_0x114a69.body.apiUrl, 'https://llm.runninghub.cn/v1/chat/completions'),
          assert.equal(_0x114a69.body.model, RUNNINGHUB_QWEN3_VL_MODEL),
          assert.deepEqual(_0x114a69.body.messages[1].content, [
            { type: 'text', text: '识别 ' },
            { type: 'image_url', image_url: { url: 'https://www.runninghub.cn/uploaded/qwen-vl.png' } },
            { type: 'text', text: ' 中的文字' },
          ]));
      },
    );
  }),
  test('aiTextApi: RunningHUB local single image uses shared upload helper', async () => {
    await withMockFetch(
      async (_0x9f84d6, _0x456ec2 = {}) => {
        const _0x5b4f1c = String(_0x9f84d6 || '');
        if (_0x5b4f1c === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        if (_0x5b4f1c === '/local/rh-upload.png') return imageResponse('rh-upload-image');
        if (_0x5b4f1c.startsWith('/api/v2/proxy/upload?'))
          return (
            assert.equal(_0x456ec2.headers?.Authorization, 'Bearer k_runninghub_model'),
            jsonResponse({
              code: 0,
              data: { download_url: 'https://www.runninghub.cn/uploaded/download-url-image.png' },
            })
          );
        throw new Error('unexpected fetch url: ' + _0x5b4f1c);
      },
      async () => {
        const _0x57c587 = await buildGenerateTextRequest({
          provider: 'runninghub',
          model: RUNNINGHUB_FLASH_MODEL,
          prompt: 'describe',
          inputImageUrls: ['/local/rh-upload.png'],
        });
        assert.equal(_0x57c587.body.imageUrl, 'https://www.runninghub.cn/uploaded/download-url-image.png');
      },
    );
  }),
  test('aiTextApi: RunningHUB local single image upload failure reports provider error', async () => {
    await withMockFetch(
      async (_0x598f77, _0x340764 = {}) => {
        const _0x117604 = String(_0x598f77 || '');
        if (_0x117604 === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        if (_0x117604 === '/local/rh-bad-key.png') return imageResponse('rh-bad-key-image');
        if (_0x117604.startsWith('/api/v2/proxy/upload?'))
          return (
            assert.equal(_0x340764.headers?.Authorization, 'Bearer k_runninghub_model'),
            jsonResponse({ code: 0x191, errorMessage: 'invalid model api key' })
          );
        throw new Error('unexpected fetch url: ' + _0x117604);
      },
      async () => {
        await assert.rejects(
          () =>
            buildGenerateTextRequest({
              provider: 'runninghub',
              model: RUNNINGHUB_FLASH_MODEL,
              prompt: 'describe',
              inputImageUrls: ['/local/rh-bad-key.png'],
            }),
          /RunningHUB .*invalid model api key.*401/,
        );
      },
    );
  }),
  test('aiTextApi: RunningHUB model API does not fall back to workflow apiKey', async () => {
    await withMockFetch(
      async (_0x3e1b8a) => {
        const _0x108f1d = String(_0x3e1b8a || '');
        if (_0x108f1d === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', apiKey: 'k_runninghub_workflow_only' },
            },
          });
        throw new Error('unexpected fetch url: ' + _0x108f1d);
      },
      async () => {
        await assert.rejects(
          () =>
            buildGenerateTextRequest({
              provider: 'runninghub',
              model: RUNNINGHUB_FLASH_MODEL,
              prompt: 'describe',
              inputImageUrls: [RUNNINGHUB_IMAGE_URL],
            }),
          /API Key/,
        );
      },
    );
  }),
  test('aiTextApi: RunningHUB 多图文本请求会先合成再上传为单个 imageUrl', async () => {
    const _0x1438ef = [];
    await withMockFetch(
      async (_0x50b10a, _0x41883b = {}) => {
        const _0x43fb7c = String(_0x50b10a || '');
        _0x1438ef.push({ target: _0x43fb7c, options: _0x41883b });
        if (_0x43fb7c === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        if (_0x43fb7c === '/local/first.png' || _0x43fb7c === '/local/second.png')
          return imageResponse(_0x43fb7c);
        if (_0x43fb7c.startsWith('/api/v2/proxy/upload?'))
          return (
            assert.equal(_0x41883b.headers?.Authorization, 'Bearer k_runninghub_model'),
            jsonResponse({
              code: 0,
              data: { download_url: 'https://www.runninghub.cn/uploaded/merged-sheet.png' },
            })
          );
        throw new Error('unexpected fetch url: ' + _0x43fb7c);
      },
      async () => {
        await withMockCanvasComposition(async () => {
          const _0x178413 = await buildGenerateTextRequest({
            provider: 'runninghub',
            model: RUNNINGHUB_PRO_MODEL,
            prompt: '请综合分析这些图片',
            inputImageUrls: ['/local/first.png', '/local/second.png'],
          });
          (assert.equal(_0x178413.url, '/api/v2/proxy/image'),
            assert.equal(
              _0x178413.body.apiUrl,
              'https://www.runninghub.cn/openapi/v2/rhart-text-g-3-pro-preview-cv/image-to-text',
            ),
            assert.equal(_0x178413.body.apiKey, 'k_runninghub_model'),
            assert.equal(_0x178413.body.prompt, '请综合分析这些图片'),
            assert.equal(_0x178413.body.imageUrl, 'https://www.runninghub.cn/uploaded/merged-sheet.png'),
            assert.equal(_0x178413.body.imageUrls, undefined));
        });
      },
    );
    const _0x2d02d4 = _0x1438ef.filter(
      (_0x62a07c) => _0x62a07c.target === '/local/first.png' || _0x62a07c.target === '/local/second.png',
    );
    assert.equal(_0x2d02d4.length, 2);
    const _0x500c08 = _0x1438ef.filter((_0x4fbe7a) => _0x4fbe7a.target.startsWith('/api/v2/proxy/upload?'));
    assert.equal(_0x500c08.length, 1);
  }),
  test('aiTextApi: RunningHUB 文本请求缺图时会直接报错', async () => {
    await withMockFetch(
      async (_0x2a6c8e) => {
        const _0x22f3e1 = String(_0x2a6c8e || '');
        if (_0x22f3e1 === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        throw new Error('unexpected fetch url: ' + _0x22f3e1);
      },
      async () => {
        await assert.rejects(
          () =>
            buildGenerateTextRequest({
              provider: 'runninghub',
              model: RUNNINGHUB_FLASH_MODEL,
              prompt: '请描述图片内容',
            }),
          (_0x731d5c) => {
            return (
              assert.ok(_0x731d5c instanceof Error),
              assert.ok(String(_0x731d5c.message || '').trim().length > 0),
              true
            );
          },
        );
      },
    );
  }),
  test('aiTextApi: RunningHUB 文本生成会在任务成功后返回 results[0].text', async () => {
    const _0x25336d = [];
    await withMockFetch(
      async (_0x463d3f, _0x245d75 = {}) => {
        const _0x571512 = String(_0x463d3f || '');
        _0x25336d.push({ target: _0x571512, options: _0x245d75 });
        if (_0x571512 === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        if (_0x571512 === '/api/v2/proxy/image') {
          const _0x16f8de = JSON.parse(String(_0x245d75.body || '{}'));
          if (
            _0x16f8de.apiUrl ===
            'https://www.runninghub.cn/openapi/v2/rhart-text-g-3-pro-preview-cv/image-to-text'
          )
            return jsonResponse({
              taskId: 'task_text_1',
              status: 'RUNNING',
              errorCode: '',
              errorMessage: '',
            });
          if (_0x16f8de.apiUrl === 'https://www.runninghub.cn/openapi/v2/query')
            return (
              assert.equal(_0x16f8de.taskId, 'task_text_1'),
              assert.equal(_0x16f8de.apiKey, 'k_runninghub_model'),
              jsonResponse({
                taskId: 'task_text_1',
                status: 'SUCCESS',
                errorCode: '',
                errorMessage: '',
                results: [{ url: null, outputType: 'text', text: 'RunningHUB 文本结果' }],
              })
            );
        }
        throw new Error('unexpected fetch url: ' + _0x571512);
      },
      async () => {
        await withImmediateTimers(async () => {
          const _0x4e8bc5 = await generateText({
            provider: 'runninghub',
            model: RUNNINGHUB_PRO_MODEL,
            prompt: '请详细描述图片',
            inputImageUrls: [RUNNINGHUB_IMAGE_URL],
          });
          assert.equal(_0x4e8bc5.text, 'RunningHUB 文本结果');
        });
      },
    );
    const _0x1bcb08 = _0x25336d.filter((_0x87cf47) => _0x87cf47.target === '/api/v2/proxy/image');
    assert.equal(_0x1bcb08.length, 2);
  }),
  test('aiTextApi: RunningHUB 任务失败时会抛出轮询错误', async () => {
    await withMockFetch(
      async (_0x440373, _0x2cf648 = {}) => {
        const _0x50ba88 = String(_0x440373 || '');
        if (_0x50ba88 === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        if (_0x50ba88 === '/api/v2/proxy/image') {
          const _0x23d405 = JSON.parse(String(_0x2cf648.body || '{}'));
          if (
            _0x23d405.apiUrl ===
            'https://www.runninghub.cn/openapi/v2/rhart-text-g-3-flash-preview-cv/image-to-text'
          )
            return jsonResponse({
              taskId: 'task_text_failed',
              status: 'RUNNING',
              errorCode: '',
              errorMessage: '',
            });
          if (_0x23d405.apiUrl === 'https://www.runninghub.cn/openapi/v2/query')
            return jsonResponse({
              taskId: 'task_text_failed',
              status: 'FAILED',
              errorCode: 'bad_task',
              errorMessage: 'task failed',
            });
        }
        throw new Error('unexpected fetch url: ' + _0x50ba88);
      },
      async () => {
        await withImmediateTimers(async () => {
          await assert.rejects(
            () =>
              generateText({
                provider: 'runninghub',
                model: RUNNINGHUB_FLASH_MODEL,
                prompt: '请描述图片',
                inputImageUrls: [RUNNINGHUB_IMAGE_URL],
              }),
            /task failed/,
          );
        });
      },
    );
  }),
  test('aiTextApi: grsai OpenAI-compatible multimodal text requests use proxy/completions', async () => {
    let _0x1bd50f = false;
    await withMockFetch(
      async (_0x17936e) => {
        const _0x59c21e = String(_0x17936e || '');
        if (_0x59c21e === '/api/config')
          return jsonResponse({
            providers: { grsai: { apiUrl: 'https://grsai.dakka.com.cn', apiKey: 'k_grsai' } },
          });
        if (_0x59c21e === '/local/ref.png') return imageResponse('grsai-image');
        if (isTelegraphProxyUpload(_0x59c21e))
          return ((_0x1bd50f = true), jsonResponse([{ src: '/unexpected-telegraph-ref.png' }]));
        if (_0x59c21e === 'https://grsai.dakka.com.cn/client/resource/newUploadTokenZH')
          return jsonResponse({
            data: {
              token: 'token_grsai',
              key: 'uploaded/grsai-ref.png',
              url: 'https://upload.grsai.example.com',
              domain: 'https://cdn.grsai.example.com',
            },
          });
        if (_0x59c21e === 'https://upload.grsai.example.com') return jsonResponse({ ok: true });
        throw new Error('unexpected fetch url: ' + _0x59c21e);
      },
      async () => {
        const _0x81877a = await buildGenerateTextRequest({
          provider: 'grsai',
          model: 'gemini-3.1-pro',
          prompt: 'Please inspect @图片1 and keep the trailing text.',
          inputUrls: ['/local/ref.png'],
        });
        (assert.equal(_0x81877a.url, '/api/v2/proxy/completions'),
          assert.equal(_0x81877a.body.apiUrl, 'https://grsai.dakka.com.cn/v1'),
          assert.equal(_0x81877a.body.apiKey, 'k_grsai'),
          assert.equal(_0x81877a.body.model, 'gemini-3.1-pro'));
        const _0x35060a = _0x81877a.body.messages[1].content;
        (assert.ok(Array.isArray(_0x35060a)),
          assert.deepEqual(_0x35060a, [
            { type: 'text', text: 'Please inspect ' },
            { type: 'image_url', image_url: { url: 'https://cdn.grsai.example.com/uploaded/grsai-ref.png' } },
            { type: 'text', text: ' and keep the trailing text.' },
          ]),
          assert.equal(_0x1bd50f, false));
      },
    );
  }),
  test('aiTextApi: ppio text manifest uses OpenAI-compatible endpoint', async () => {
    await withMockFetch(
      async (_0x2b791d) => {
        const _0x90bf49 = String(_0x2b791d || '');
        if (_0x90bf49 === '/api/config')
          return jsonResponse({
            providers: { ppio: { apiUrl: 'https://api.ppinfra.com', apiKey: 'k_ppio' } },
          });
        throw new Error('unexpected fetch url: ' + _0x90bf49);
      },
      async () => {
        const _0x527e18 = await buildGenerateTextRequest({
          provider: 'ppio',
          model: 'qwen/qwen3.5-397b-a17b',
          prompt: 'plain text prompt',
        });
        (assert.equal(_0x527e18.url, '/api/v2/proxy/completions'),
          assert.equal(_0x527e18.body.apiUrl, 'https://api.ppinfra.com/openai/v1'),
          assert.equal(_0x527e18.body.apiKey, 'k_ppio'),
          assert.equal(_0x527e18.body.model, 'qwen/qwen3.5-397b-a17b'),
          assert.equal(_0x527e18.body.messages[1].content, 'plain text prompt'));
      },
    );
  }),
  test('aiTextApi: generateText via grsai proxy strips think tags from multimodal responses', async () => {
    let _0x51d4bc = null;
    await withMockFetch(
      async (_0x40b932, _0x5148ad = {}) => {
        const _0x5543a1 = String(_0x40b932 || '');
        if (_0x5543a1 === '/api/config')
          return jsonResponse({
            providers: { grsai: { apiUrl: 'https://grsai.dakka.com.cn', apiKey: 'k_grsai' } },
          });
        if (_0x5543a1 === '/local/ref.png') return imageResponse('grsai-image');
        if (_0x5543a1 === 'https://grsai.dakka.com.cn/client/resource/newUploadTokenZH')
          return jsonResponse({
            data: {
              token: 'token_grsai',
              key: 'uploaded/grsai-ref.png',
              url: 'https://upload.grsai.example.com',
              domain: 'https://cdn.grsai.example.com',
            },
          });
        if (_0x5543a1 === 'https://upload.grsai.example.com') return jsonResponse({ ok: true });
        if (_0x5543a1 === '/api/v2/proxy/completions')
          return (
            (_0x51d4bc = JSON.parse(String(_0x5148ad.body || '{}'))),
            jsonResponse({ choices: [{ message: { content: '<think>internal reasoning</think>\n红色' } }] })
          );
        throw new Error('unexpected fetch url: ' + _0x5543a1);
      },
      async () => {
        const _0x4a0385 = await generateText({
          provider: 'grsai',
          model: 'gemini-3-pro',
          prompt: '这张图的主颜色是什么？只回答颜色。',
          inputUrls: ['/local/ref.png'],
        });
        (assert.equal(_0x4a0385.text, '红色'),
          assert.equal(_0x51d4bc?.apiUrl, 'https://grsai.dakka.com.cn/v1'),
          assert.equal(_0x51d4bc?.model, 'gemini-3-pro'),
          assert.ok(Array.isArray(_0x51d4bc?.messages?.[1]?.content)));
      },
    );
  }),
  test('aiTextApi: grsai partial image upload failure keeps mention slots from shifting', async () => {
    await withMockFetch(
      async (_0x1ff3f1) => {
        const _0x193953 = String(_0x1ff3f1 || '');
        if (_0x193953 === '/api/config')
          return jsonResponse({
            providers: { grsai: { apiUrl: 'https://grsai.dakka.com.cn', apiKey: 'k_grsai' } },
          });
        if (_0x193953 === '/local/first-failed.png') throw new Error('fetch failed');
        if (_0x193953 === '/local/second-ok.png') return imageResponse('grsai-image-2');
        if (_0x193953 === 'https://grsai.dakka.com.cn/client/resource/newUploadTokenZH')
          return jsonResponse({
            data: {
              token: 'token_grsai',
              key: 'uploaded/grsai-ref-2.png',
              url: 'https://upload.grsai.example.com',
              domain: 'https://cdn.grsai.example.com',
            },
          });
        if (_0x193953 === 'https://upload.grsai.example.com') return jsonResponse({ ok: true });
        throw new Error('unexpected fetch url: ' + _0x193953);
      },
      async () => {
        const _0x492bac = await buildGenerateTextRequest({
          provider: 'grsai',
          model: 'gemini-3.1-pro',
          prompt: 'A @图片1 B @图片2 C',
          inputUrls: ['/local/first-failed.png', '/local/second-ok.png'],
        });
        assert.deepEqual(_0x492bac.body.messages[1].content, [
          { type: 'text', text: 'A @图片1 B ' },
          { type: 'image_url', image_url: { url: 'https://cdn.grsai.example.com/uploaded/grsai-ref-2.png' } },
          { type: 'text', text: ' C' },
        ]);
      },
    );
  }));
