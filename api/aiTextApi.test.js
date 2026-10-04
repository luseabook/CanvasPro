import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGenerateTextRequest, generateText } from './aiTextApi.js';
import { clearApiConfig } from './configApi.js';
function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status: status,
    headers: { 'Content-Type': 'application/json' },
  });
}
function imageResponse(item, type = 'image/png') {
  return new Response(new Blob([item], { type: type }), {
    status: 200,
    headers: { 'Content-Type': type },
  });
}
async function readUploadMarker(map) {
  if (!map || typeof map.entries !== 'function') return '';
  for (const [key, response] of map.entries()) {
    if (key !== 'file') continue;
    if (response && typeof response.text === 'function') return await response.text();
  }
  return '';
}
function isTelegraphProxyUpload(index) {
  const list = String(index || '');
  if (!list.startsWith('/api/v2/proxy/upload?')) return false;
  const result = list.slice(list.indexOf('?') + 1);
  return new URLSearchParams(result).get('apiUrl') === 'https://telegra.ph/upload';
}
async function withMockFetch(data, handler) {
  const options = globalThis.fetch;
  (clearApiConfig(), (globalThis.fetch = data));
  try {
    return await handler();
  } finally {
    ((globalThis.fetch = options), clearApiConfig());
  }
}
async function withImmediateTimers(handler2) {
  const target = globalThis.setTimeout;
  globalThis.setTimeout = (handler3, source, ...args) => {
    if (typeof handler3 === 'function') handler3(...args);
    return 0;
  };
  try {
    return await handler2();
  } finally {
    globalThis.setTimeout = target;
  }
}
async function withMockCanvasComposition(handler4) {
  const next = globalThis.createImageBitmap,
    current = globalThis.OffscreenCanvas;
  ((globalThis.createImageBitmap = async () => ({ width: 0x280, height: 0x1e0, close() {} })),
    (globalThis.OffscreenCanvas = class entry {
      constructor(record, payload) {
        ((this.width = record),
          (this.height = payload),
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
    return await handler4();
  } finally {
    ((globalThis.createImageBitmap = next), (globalThis.OffscreenCanvas = current));
  }
}
const RUNNINGHUB_FLASH_MODEL = 'runninghub-model/rhart-text-g-3-flash-preview-cv/image-to-text',
  RUNNINGHUB_PRO_MODEL = 'runninghub-model/rhart-text-g-3-pro-preview-cv/image-to-text',
  RUNNINGHUB_QWEN36_PLUS_MODEL = 'qwen/qwen3.6-plus',
  RUNNINGHUB_QWEN3_VL_MODEL = 'qwen/qwen3-vl-235b-a22b-instruct',
  RUNNINGHUB_IMAGE_URL = 'https://www.runninghub.cn/example/input.png';
(test('aiTextApi: OpenAI 兼容请求会把 @图片 映射为 image_url，并保留前后文本', async () => {
  await withMockFetch(
    async (handle) => {
      const state = String(handle || '');
      if (state === '/api/config')
        return jsonResponse({
          providers: { openai: { apiUrl: 'https://api.openai.com', apiKey: 'k_openai' } },
        });
      if (state === '/local/ref.png') return imageResponse('openai-image');
      if (isTelegraphProxyUpload(state)) return jsonResponse([{ src: '/uploaded-openai-ref.png' }]);
      throw new Error('unexpected fetch url: ' + state);
    },
    async () => {
      const dom = await buildGenerateTextRequest({
        provider: 'openai',
        model: 'gpt-4.1-mini',
        prompt: '请详细分析 @图片1 ，并保留这句文字。',
        inputUrls: ['/local/ref.png'],
      });
      (assert.equal(dom.url, '/api/v2/proxy/completions'),
        assert.equal(dom.body.apiUrl, 'https://api.openai.com/v1'),
        assert.equal(dom.body.model, 'gpt-4.1-mini'));
      const config = dom.body.messages[1].content;
      (assert.ok(Array.isArray(config)),
        assert.deepEqual(config, [
          { type: 'text', text: '请详细分析 ' },
          { type: 'image_url', image_url: { url: 'https://telegra.ph/uploaded-openai-ref.png' } },
          { type: 'text', text: ' ，并保留这句文字。' },
        ]));
    },
  );
}),
  test('aiTextApi: Volcengine Doubao Seed text models use Ark Responses API', async () => {
    await withMockFetch(
      async (scope) => {
        const input = String(scope || '');
        if (input === '/api/config')
          return jsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_volcengine' },
            },
          });
        throw new Error('unexpected fetch url: ' + input);
      },
      async () => {
        const output = [
          ['volcengine/doubao-seed-2-0-pro-260215', 'doubao-seed-2-0-pro-260215'],
          ['doubao-seed-2-0-mini-260428', 'doubao-seed-2-0-mini-260428'],
          ['doubao-seed-2-0-lite-260428', 'doubao-seed-2-0-lite-260428'],
        ];
        for (const [model, value2] of output) {
          const dom2 = await buildGenerateTextRequest({
            provider: 'volcengine',
            model: model,
            prompt: 'plain text prompt',
          });
          (assert.equal(dom2.url, '/api/v2/proxy/completions'),
            assert.equal(dom2.body.apiUrl, 'https://ark.cn-beijing.volces.com/api/v3/responses'),
            assert.equal(dom2.body.apiKey, 'k_volcengine'),
            assert.equal(dom2.body.model, value2),
            assert.deepEqual(dom2.body.input, [
              { role: 'user', content: [{ type: 'input_text', text: 'plain text prompt' }] },
            ]));
        }
      },
    );
  }),
  test('aiTextApi: Volcengine media inputs upload through Ark Files API', async () => {
    const value3 = 'https://ark-project.tos-cn-beijing.volces.com/doc_video/ark_vlm_video_input.mp4',
      value4 = '/local/ref.png',
      list2 = [];
    await withMockFetch(
      async (value5, dom3 = {}) => {
        const value6 = String(value5 || '');
        if (value6 === '/api/config')
          return jsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_volcengine' },
            },
          });
        if (value6 === value4) return imageResponse('volcengine-image');
        if (value6 === value3) return imageResponse('volcengine-video', 'video/mp4');
        if (value6.startsWith('/api/v2/proxy/upload?')) {
          assert.equal(dom3.headers?.Authorization, 'Bearer k_volcengine');
          const uRL = new URL('http://local' + value6).searchParams.get('apiUrl');
          assert.equal(uRL, 'https://ark.cn-beijing.volces.com/api/v3/files');
          const value7 = Object.fromEntries(dom3.body.entries());
          (assert.equal(value7.purpose, 'user_data'), list2.push(value7.file?.name || ''));
          const value8 = await value7.file.text();
          if (value8 === 'volcengine-image')
            return jsonResponse({
              object: 'file',
              id: 'file-image-1',
              status: 'active',
              purpose: 'user_data',
            });
          if (value8 === 'volcengine-video')
            return (
              assert.equal(value7['preprocess_configs[video][fps]'], '0.3'),
              jsonResponse({ object: 'file', id: 'file-video-1', status: 'processing', purpose: 'user_data' })
            );
        }
        if (value6.startsWith('/api/v2/proxy/task?')) {
          assert.equal(dom3.headers?.Authorization, 'Bearer k_volcengine');
          const uRL2 = new URL('http://local' + value6).searchParams.get('apiUrl');
          return (
            assert.equal(uRL2, 'https://ark.cn-beijing.volces.com/api/v3/files/file-video-1'),
            jsonResponse({ object: 'file', id: 'file-video-1', status: 'active', purpose: 'user_data' })
          );
        }
        throw new Error('unexpected fetch url: ' + value6);
      },
      async () => {
        const value9 = 'https://ark-project.tos-cn-beijing.volces.com/doc_video/ark_vlm_video_input.mp4',
          dom4 = await buildGenerateTextRequest({
            provider: 'volcengine',
            model: 'volcengine/doubao-seed-2-0-pro-260215',
            prompt: '先看 @图片1 再总结 @视频1 的内容。',
            inputUrls: [value4, value9],
            inputImageUrls: [value4],
            inputVideoUrls: [value9],
          });
        (assert.equal(dom4.body.model, 'doubao-seed-2-0-pro-260215'),
          assert.deepEqual(dom4.body.input[0].content, [
            { type: 'input_text', text: '先看 ' },
            { type: 'input_image', file_id: 'file-image-1' },
            { type: 'input_text', text: ' 再总结 ' },
            { type: 'input_video', file_id: 'file-video-1' },
            { type: 'input_text', text: ' 的内容。' },
          ]),
          assert.deepEqual(list2.sort(), ['ref.png', 'ark_vlm_video_input.mp4'].sort()));
      },
    );
  }),
  test('aiTextApi: Volcengine local video inputs upload through Ark Files API', async () => {
    await withMockFetch(
      async (value10, dom5 = {}) => {
        const value11 = String(value10 || '');
        if (value11 === '/api/config')
          return jsonResponse({
            providers: {
              volcengine: { apiUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiKey: 'k_volcengine' },
            },
          });
        if (value11.endsWith('/local/ref.mp4')) return imageResponse('local-volcengine-video', 'video/mp4');
        if (value11.startsWith('/api/v2/proxy/upload?')) {
          const value12 = Object.fromEntries(dom5.body.entries());
          return (
            assert.equal(await value12.file.text(), 'local-volcengine-video'),
            jsonResponse({ object: 'file', id: 'file-local-video', status: 'active' })
          );
        }
        throw new Error('unexpected fetch url: ' + value11);
      },
      async () => {
        const dom6 = await buildGenerateTextRequest({
          provider: 'volcengine',
          model: 'volcengine/doubao-seed-2-0-pro-260215',
          prompt: '请总结 @视频1',
          inputUrls: ['/local/ref.mp4'],
          inputVideoUrls: ['/local/ref.mp4'],
        });
        assert.deepEqual(dom6.body.input[0].content, [
          { type: 'input_text', text: '请总结 ' },
          { type: 'input_video', file_id: 'file-local-video' },
        ]);
      },
    );
  }),
  test('aiTextApi: custom provider 多图请求会按顺序映射为多个 image_url', async () => {
    await withMockFetch(
      async (value13, dom7 = {}) => {
        const value14 = String(value13 || '');
        if (value14 === '/api/config')
          return jsonResponse({
            providers: {
              openai: {
                apiUrl: 'https://ark.cn-beijing.volces.com/api/v3',
                apiKey: 'k_custom_openai_compatible',
              },
            },
          });
        if (value14 === '/local/first.png') return imageResponse('custom-image-1');
        if (value14 === '/local/second.png') return imageResponse('custom-image-2');
        if (isTelegraphProxyUpload(value14)) {
          const uploadMarker = await readUploadMarker(dom7.body);
          if (uploadMarker === 'custom-image-1') return jsonResponse([{ src: '/uploaded-custom-first.png' }]);
          if (uploadMarker === 'custom-image-2')
            return jsonResponse([{ src: '/uploaded-custom-second.png' }]);
        }
        throw new Error('unexpected fetch url: ' + value14);
      },
      async () => {
        const dom8 = await buildGenerateTextRequest({
          provider: 'custom',
          model: 'doubao-seed-2-0-pro',
          prompt: 'compare @图片1 with @图片2',
          inputUrls: ['/local/first.png', '/local/second.png'],
        });
        (assert.equal(dom8.url, '/api/v2/proxy/completions'),
          assert.equal(dom8.body.apiUrl, 'https://ark.cn-beijing.volces.com/api/v3'),
          assert.equal(dom8.body.apiKey, 'k_custom_openai_compatible'),
          assert.equal(dom8.body.model, 'doubao-seed-2-0-pro'),
          assert.deepEqual(dom8.body.messages[1].content, [
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
      async (value15) => {
        const value16 = String(value15 || '');
        if (value16 === '/api/config')
          return jsonResponse({
            providers: {
              openai: {
                apiUrl: 'https://ark.cn-beijing.volces.com/api/v3',
                apiKey: 'k_custom_openai_compatible',
              },
            },
          });
        throw new Error('unexpected fetch url: ' + value16);
      },
      async () => {
        const dom9 = await buildGenerateTextRequest({
          provider: 'custom',
          model: 'doubao-seed-2-0-pro',
          prompt: 'only text prompt',
        });
        (assert.equal(dom9.url, '/api/v2/proxy/completions'),
          assert.equal(dom9.body.apiUrl, 'https://ark.cn-beijing.volces.com/api/v3'),
          assert.equal(dom9.body.messages[1].content, 'only text prompt'));
      },
    );
  }),
  test('aiTextApi: OpenAI 兼容文本请求会透传 systemPrompt', async () => {
    await withMockFetch(
      async (value17) => {
        const value18 = String(value17 || '');
        if (value18 === '/api/config')
          return jsonResponse({
            providers: {
              openai: { apiUrl: 'https://api.openai-compatible.local', apiKey: 'k_custom_openai_compatible' },
            },
          });
        throw new Error('unexpected fetch url: ' + value18);
      },
      async () => {
        const dom10 = await buildGenerateTextRequest({
          provider: 'custom',
          model: 'gpt-compatible',
          prompt: '用户剧情',
          systemPrompt: '只输出合法 JSON。',
        });
        (assert.equal(dom10.url, '/api/v2/proxy/completions'),
          assert.equal(dom10.body.messages[0].role, 'system'),
          assert.equal(dom10.body.messages[0].content, '只输出合法 JSON。'),
          assert.equal(dom10.body.messages[1].content, '用户剧情'));
      },
    );
  }),
  test('aiTextApi: unregistered provider model fails without legacy routing fallback', async () => {
    await withMockFetch(
      async (value19) => {
        const value20 = String(value19 || '');
        if (value20 === '/api/config')
          return jsonResponse({
            providers: { grsai: { apiUrl: 'https://grsai.dakka.com.cn', apiKey: 'k_grsai' } },
          });
        throw new Error('unexpected fetch url: ' + value20);
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
      async (value21) => {
        const value22 = String(value21 || '');
        if (value22 === '/api/config') return jsonResponse({ providers: {} });
        throw new Error('unexpected fetch url: ' + value22);
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
    const value23 = [
      ['apimart/kimi-k2-instruct', 'kimi-k2-instruct'],
      ['apimart/gpt-5.5', 'gpt-5.5'],
      ['apimart/gpt-5.4-mini', 'gpt-5.4-mini'],
      ['apimart/gemini-3.5-flash', 'gemini-3.5-flash'],
    ];
    await withMockFetch(
      async (value24) => {
        const value25 = String(value24 || '');
        if (value25 === '/api/config')
          return jsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        throw new Error('unexpected fetch url: ' + value25);
      },
      async () => {
        for (const [model2, value26] of value23) {
          const dom11 = await buildGenerateTextRequest({
            provider: 'apimart',
            model: model2,
            prompt: 'plain text prompt',
          });
          (assert.equal(dom11.url, '/api/v2/proxy/completions'),
            assert.equal(dom11.body.apiUrl, 'https://api.apimart.ai/v1/chat/completions'),
            assert.equal(dom11.body.model, value26),
            assert.equal(dom11.body.messages[1].content, 'plain text prompt'));
        }
      },
    );
  }),
  test('aiTextApi: APIMart routeId domestic2 builds aishuch chat endpoint', async () => {
    await withMockFetch(
      async (value27) => {
        const value28 = String(value27 || '');
        if (value28 === '/api/config')
          return jsonResponse({ providers: { apimart: { routeId: 'domestic2', apiKey: 'k_apimart' } } });
        throw new Error('unexpected fetch url: ' + value28);
      },
      async () => {
        const dom12 = await buildGenerateTextRequest({
          provider: 'apimart',
          model: 'apimart/kimi-k2-instruct',
          prompt: 'plain text prompt',
        });
        (assert.equal(dom12.url, '/api/v2/proxy/completions'),
          assert.equal(dom12.body.apiUrl, 'https://api.aishuch.com/v1/chat/completions'),
          assert.equal(dom12.body.model, 'kimi-k2-instruct'));
      },
    );
  }),
  test('aiTextApi: APIMart Gemini 图片请求统一使用 GPT image_url 格式', async () => {
    await withMockFetch(
      async (value29, dom13 = {}) => {
        const value30 = String(value29 || '');
        if (value30 === '/api/config')
          return jsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        if (value30 === '/local/ref.png') return imageResponse('gemini-image');
        if (value30 === '/api/v2/proxy/apimart-upload') {
          const value31 = Object.fromEntries(dom13.body.entries());
          return (
            assert.equal(value31.contentType, 'image/png'),
            assert.equal(value31.fileExtension, 'png'),
            assert.equal(await value31.file.text(), 'gemini-image'),
            jsonResponse({ cdnUrl: 'https://cdn.apimart.ai/files/gemini-ref.png' })
          );
        }
        throw new Error('unexpected fetch url: ' + value30);
      },
      async () => {
        const dom14 = await buildGenerateTextRequest({
          provider: 'apimart',
          model: 'apimart/gemini-3.1-pro-preview',
          prompt: '分析 @图片1 的细节。',
          inputUrls: ['/local/ref.png'],
        });
        (assert.equal(dom14.url, '/api/v2/proxy/completions'),
          assert.equal(dom14.body.apiUrl, 'https://api.apimart.ai/v1/chat/completions'),
          assert.equal(dom14.body.model, 'gemini-3.1-pro-preview'));
        const value32 = dom14.body.messages[1].content;
        (assert.deepEqual(value32[0], { type: 'text', text: '分析 ' }),
          assert.deepEqual(value32[1], {
            type: 'image_url',
            image_url: { url: 'https://cdn.apimart.ai/files/gemini-ref.png' },
          }),
          assert.deepEqual(value32[2], { type: 'text', text: ' 的细节。' }));
      },
    );
  }),
  test('aiTextApi: APIMart Gemini 菜单裸模型名会归一化并使用 GPT 格式', async () => {
    await withMockFetch(
      async (value33, dom15 = {}) => {
        const value34 = String(value33 || '');
        if (value34 === '/api/config')
          return jsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        if (value34 === '/local/ref.png') return imageResponse('gemini-image');
        if (value34 === '/api/v2/proxy/apimart-upload') {
          const value35 = Object.fromEntries(dom15.body.entries());
          return (
            assert.equal(await value35.file.text(), 'gemini-image'),
            jsonResponse({ cdnUrl: 'https://cdn.apimart.ai/files/gemini-ref.png' })
          );
        }
        throw new Error('unexpected fetch url: ' + value34);
      },
      async () => {
        const dom16 = await buildGenerateTextRequest({
          provider: 'apimart',
          model: 'gemini-3.1-pro-preview',
          prompt: '分析 @图片1',
          inputUrls: ['/local/ref.png'],
          inputImageUrls: ['/local/ref.png'],
        });
        (assert.equal(dom16.body.apiUrl, 'https://api.apimart.ai/v1/chat/completions'),
          assert.equal(dom16.body.model, 'gemini-3.1-pro-preview'),
          assert.deepEqual(dom16.body.messages[1].content[1], {
            type: 'image_url',
            image_url: { url: 'https://cdn.apimart.ai/files/gemini-ref.png' },
          }));
      },
    );
  }),
  test('aiTextApi: APIMart 已上传 CDN 图片使用 GPT image_url 且不会重复上传', async () => {
    await withMockFetch(
      async (value36) => {
        const value37 = String(value36 || '');
        if (value37 === '/api/config')
          return jsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        throw new Error('unexpected fetch url: ' + value37);
      },
      async () => {
        const dom17 = await buildGenerateTextRequest({
          provider: 'apimart',
          model: 'apimart/gemini-3-flash-preview-nothinking',
          prompt: '分析 @图片1',
          inputUrls: ['https://upload.apimart.ai/files/existing.webp'],
          inputImageUrls: ['https://upload.apimart.ai/files/existing.webp'],
        });
        (assert.equal(dom17.body.apiUrl, 'https://api.apimart.ai/v1/chat/completions'),
          assert.deepEqual(dom17.body.messages[1].content, [
            { type: 'text', text: '分析 ' },
            { type: 'image_url', image_url: { url: 'https://upload.apimart.ai/files/existing.webp' } },
          ]));
      },
    );
  }),
  test('aiTextApi: APIMart GPT 格式多图上传按 @图片编号映射', async () => {
    await withMockFetch(
      async (value38, dom18 = {}) => {
        const value39 = String(value38 || '');
        if (value39 === '/api/config')
          return jsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        if (value39 === '/local/first.png') return imageResponse('apimart-first');
        if (value39 === '/local/second.png') return imageResponse('apimart-second');
        if (value39 === '/api/v2/proxy/apimart-upload') {
          const value40 = Object.fromEntries(dom18.body.entries()),
            value41 = await value40.file.text();
          if (value41 === 'apimart-first')
            return jsonResponse({ cdnUrl: 'https://cdn.apimart.ai/files/first.png' });
          if (value41 === 'apimart-second')
            return jsonResponse({ cdnUrl: 'https://cdn.apimart.ai/files/second.png' });
        }
        throw new Error('unexpected fetch url: ' + value39);
      },
      async () => {
        const dom19 = await buildGenerateTextRequest({
          provider: 'apimart',
          model: 'apimart/gemini-3-flash-preview-nothinking',
          prompt: '先看 @图片2 再看 @图片1',
          inputUrls: ['/local/first.png', '/local/second.png'],
          inputImageUrls: ['/local/first.png', '/local/second.png'],
        });
        (assert.equal(dom19.body.apiUrl, 'https://api.apimart.ai/v1/chat/completions'),
          assert.deepEqual(dom19.body.messages[1].content, [
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
      async (value42) => {
        const value43 = String(value42 || '');
        if (value43 === '/api/config')
          return jsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        throw new Error('unexpected fetch url: ' + value43);
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
      async (value44) => {
        const value45 = String(value44 || '');
        if (value45 === '/api/config')
          return jsonResponse({
            providers: { apimart: { apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' } },
          });
        throw new Error('unexpected fetch url: ' + value45);
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
      async (value46) => {
        const value47 = String(value46 || '');
        if (value47 === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        throw new Error('unexpected fetch url: ' + value47);
      },
      async () => {
        const dom20 = await buildGenerateTextRequest({
          provider: 'runninghub',
          model: RUNNINGHUB_FLASH_MODEL,
          apiKey: 'payload_key_should_not_win',
          prompt: '请描述图片内容',
          inputImageUrls: [RUNNINGHUB_IMAGE_URL],
        });
        (assert.equal(dom20.url, '/api/v2/proxy/image'),
          assert.equal(
            dom20.body.apiUrl,
            'https://www.runninghub.cn/openapi/v2/rhart-text-g-3-flash-preview-cv/image-to-text',
          ),
          assert.equal(dom20.body.apiKey, 'k_runninghub_model'),
          assert.equal(dom20.body.prompt, '请描述图片内容'),
          assert.equal(dom20.body.imageUrl, RUNNINGHUB_IMAGE_URL),
          assert.equal(dom20.adapterTrace?.source, 'manifest'),
          assert.equal(dom20.adapterTrace?.executionId, 'runninghub.model-api.rhart-text-g-3-flash-cv.v1'),
          assert.deepEqual(Object.keys(dom20.body).sort(), ['apiKey', 'apiUrl', 'imageUrl', 'prompt']));
      },
    );
  }),
  test('aiTextApi: RunningHUB LLM 文本模型走官方 chat completions 端点', async () => {
    await withMockFetch(
      async (value48) => {
        const value49 = String(value48 || '');
        if (value49 === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        throw new Error('unexpected fetch url: ' + value49);
      },
      async () => {
        const dom21 = await buildGenerateTextRequest({
          provider: 'runninghub',
          model: RUNNINGHUB_QWEN36_PLUS_MODEL,
          apiKey: 'payload_key_should_not_win',
          prompt: 'plain text prompt',
        });
        (assert.equal(dom21.url, '/api/v2/proxy/completions'),
          assert.equal(dom21.body.apiUrl, 'https://llm.runninghub.cn/v1/chat/completions'),
          assert.equal(dom21.body.apiKey, 'k_runninghub_model'),
          assert.equal(dom21.body.model, RUNNINGHUB_QWEN36_PLUS_MODEL),
          assert.equal(dom21.body.messages[1].content, 'plain text prompt'),
          assert.equal(dom21.adapterTrace?.source, 'manifest'),
          assert.equal(dom21.adapterTrace?.executionId, 'runninghub.model-api.text.qwen3-6-plus.v1'));
      },
    );
  }),
  test('aiTextApi: RunningHUB LLM 直接返回 choices 时不会把 chat id 当 taskId 轮询', async () => {
    const list3 = [];
    (await withMockFetch(
      async (value50, options2 = {}) => {
        const target2 = String(value50 || '');
        list3.push({ target: target2, options: options2 });
        if (target2 === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        if (target2 === '/api/v2/proxy/completions')
          return jsonResponse({
            id: 'chatcmpl-qwen-direct',
            object: 'chat.completion',
            choices: [
              { message: { role: 'assistant', content: 'Qwen 直接文本结果' }, finish_reason: 'stop' },
            ],
          });
        if (target2 === '/api/v2/proxy/image')
          throw new Error('Qwen chat completion result should not poll task query');
        throw new Error('unexpected fetch url: ' + target2);
      },
      async () => {
        const response2 = await generateText({
          provider: 'runninghub',
          model: RUNNINGHUB_QWEN36_PLUS_MODEL,
          prompt: 'plain text prompt',
        });
        assert.equal(response2.text, 'Qwen 直接文本结果');
      },
    ),
      assert.equal(list3.filter((event) => event.target === '/api/v2/proxy/completions').length, 1),
      assert.equal(list3.filter((event2) => event2.target === '/api/v2/proxy/image').length, 0));
  }),
  test('aiTextApi: RunningHUB LLM 原始 SSE 会合并 delta 文本后直接返回', async () => {
    await withMockFetch(
      async (value51) => {
        const value52 = String(value51 || '');
        if (value52 === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        if (value52 === '/api/v2/proxy/completions')
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
        if (value52 === '/api/v2/proxy/image') throw new Error('Qwen SSE result should not poll task query');
        throw new Error('unexpected fetch url: ' + value52);
      },
      async () => {
        const response3 = await generateText({
          provider: 'runninghub',
          model: RUNNINGHUB_QWEN36_PLUS_MODEL,
          prompt: 'plain text prompt',
        });
        assert.equal(response3.text, 'Qwen SSE 文本');
      },
    );
  }),
  test('aiTextApi: RunningHUB Qwen3-VL 文本节点支持图像入参', async () => {
    await withMockFetch(
      async (value53, response4 = {}) => {
        const value54 = String(value53 || '');
        if (value54 === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        if (value54 === '/local/qwen-vl.png') return imageResponse('qwen-vl-image');
        if (value54.startsWith('/api/v2/proxy/upload?'))
          return (
            assert.equal(response4.headers?.Authorization, 'Bearer k_runninghub_model'),
            jsonResponse({
              code: 0,
              data: { download_url: 'https://www.runninghub.cn/uploaded/qwen-vl.png' },
            })
          );
        throw new Error('unexpected fetch url: ' + value54);
      },
      async () => {
        const dom22 = await buildGenerateTextRequest({
          provider: 'runninghub',
          model: RUNNINGHUB_QWEN3_VL_MODEL,
          prompt: '识别 @图片1 中的文字',
          inputUrls: ['/local/qwen-vl.png'],
          inputImageUrls: ['/local/qwen-vl.png'],
        });
        (assert.equal(dom22.url, '/api/v2/proxy/completions'),
          assert.equal(dom22.body.apiUrl, 'https://llm.runninghub.cn/v1/chat/completions'),
          assert.equal(dom22.body.model, RUNNINGHUB_QWEN3_VL_MODEL),
          assert.deepEqual(dom22.body.messages[1].content, [
            { type: 'text', text: '识别 ' },
            { type: 'image_url', image_url: { url: 'https://www.runninghub.cn/uploaded/qwen-vl.png' } },
            { type: 'text', text: ' 中的文字' },
          ]));
      },
    );
  }),
  test('aiTextApi: RunningHUB local single image uses shared upload helper', async () => {
    await withMockFetch(
      async (value55, response5 = {}) => {
        const value56 = String(value55 || '');
        if (value56 === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        if (value56 === '/local/rh-upload.png') return imageResponse('rh-upload-image');
        if (value56.startsWith('/api/v2/proxy/upload?'))
          return (
            assert.equal(response5.headers?.Authorization, 'Bearer k_runninghub_model'),
            jsonResponse({
              code: 0,
              data: { download_url: 'https://www.runninghub.cn/uploaded/download-url-image.png' },
            })
          );
        throw new Error('unexpected fetch url: ' + value56);
      },
      async () => {
        const dom23 = await buildGenerateTextRequest({
          provider: 'runninghub',
          model: RUNNINGHUB_FLASH_MODEL,
          prompt: 'describe',
          inputImageUrls: ['/local/rh-upload.png'],
        });
        assert.equal(dom23.body.imageUrl, 'https://www.runninghub.cn/uploaded/download-url-image.png');
      },
    );
  }),
  test('aiTextApi: RunningHUB local single image upload failure reports provider error', async () => {
    await withMockFetch(
      async (value57, response6 = {}) => {
        const value58 = String(value57 || '');
        if (value58 === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        if (value58 === '/local/rh-bad-key.png') return imageResponse('rh-bad-key-image');
        if (value58.startsWith('/api/v2/proxy/upload?'))
          return (
            assert.equal(response6.headers?.Authorization, 'Bearer k_runninghub_model'),
            jsonResponse({ code: 0x191, errorMessage: 'invalid model api key' })
          );
        throw new Error('unexpected fetch url: ' + value58);
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
      async (value59) => {
        const value60 = String(value59 || '');
        if (value60 === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: { apiUrl: 'https://www.runninghub.cn', apiKey: 'k_runninghub_workflow_only' },
            },
          });
        throw new Error('unexpected fetch url: ' + value60);
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
    const list4 = [];
    await withMockFetch(
      async (value61, options3 = {}) => {
        const target3 = String(value61 || '');
        list4.push({ target: target3, options: options3 });
        if (target3 === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        if (target3 === '/local/first.png' || target3 === '/local/second.png') return imageResponse(target3);
        if (target3.startsWith('/api/v2/proxy/upload?'))
          return (
            assert.equal(options3.headers?.Authorization, 'Bearer k_runninghub_model'),
            jsonResponse({
              code: 0,
              data: { download_url: 'https://www.runninghub.cn/uploaded/merged-sheet.png' },
            })
          );
        throw new Error('unexpected fetch url: ' + target3);
      },
      async () => {
        await withMockCanvasComposition(async () => {
          const dom24 = await buildGenerateTextRequest({
            provider: 'runninghub',
            model: RUNNINGHUB_PRO_MODEL,
            prompt: '请综合分析这些图片',
            inputImageUrls: ['/local/first.png', '/local/second.png'],
          });
          (assert.equal(dom24.url, '/api/v2/proxy/image'),
            assert.equal(
              dom24.body.apiUrl,
              'https://www.runninghub.cn/openapi/v2/rhart-text-g-3-pro-preview-cv/image-to-text',
            ),
            assert.equal(dom24.body.apiKey, 'k_runninghub_model'),
            assert.equal(dom24.body.prompt, '请综合分析这些图片'),
            assert.equal(dom24.body.imageUrl, 'https://www.runninghub.cn/uploaded/merged-sheet.png'),
            assert.equal(dom24.body.imageUrls, undefined));
        });
      },
    );
    const list5 = list4.filter(
      (event3) => event3.target === '/local/first.png' || event3.target === '/local/second.png',
    );
    assert.equal(list5.length, 2);
    const list6 = list4.filter((event4) => event4.target.startsWith('/api/v2/proxy/upload?'));
    assert.equal(list6.length, 1);
  }),
  test('aiTextApi: RunningHUB 文本请求缺图时会直接报错', async () => {
    await withMockFetch(
      async (value62) => {
        const value63 = String(value62 || '');
        if (value63 === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        throw new Error('unexpected fetch url: ' + value63);
      },
      async () => {
        await assert.rejects(
          () =>
            buildGenerateTextRequest({
              provider: 'runninghub',
              model: RUNNINGHUB_FLASH_MODEL,
              prompt: '请描述图片内容',
            }),
          (error) => {
            return (
              assert.ok(error instanceof Error),
              assert.ok(String(error.message || '').trim().length > 0),
              true
            );
          },
        );
      },
    );
  }),
  test('aiTextApi: RunningHUB 文本生成会在任务成功后返回 results[0].text', async () => {
    const list7 = [];
    await withMockFetch(
      async (value64, options4 = {}) => {
        const target4 = String(value64 || '');
        list7.push({ target: target4, options: options4 });
        if (target4 === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        if (target4 === '/api/v2/proxy/image') {
          const value65 = JSON.parse(String(options4.body || '{}'));
          if (
            value65.apiUrl ===
            'https://www.runninghub.cn/openapi/v2/rhart-text-g-3-pro-preview-cv/image-to-text'
          )
            return jsonResponse({
              taskId: 'task_text_1',
              status: 'RUNNING',
              errorCode: '',
              errorMessage: '',
            });
          if (value65.apiUrl === 'https://www.runninghub.cn/openapi/v2/query')
            return (
              assert.equal(value65.taskId, 'task_text_1'),
              assert.equal(value65.apiKey, 'k_runninghub_model'),
              jsonResponse({
                taskId: 'task_text_1',
                status: 'SUCCESS',
                errorCode: '',
                errorMessage: '',
                results: [{ url: null, outputType: 'text', text: 'RunningHUB 文本结果' }],
              })
            );
        }
        throw new Error('unexpected fetch url: ' + target4);
      },
      async () => {
        await withImmediateTimers(async () => {
          const response7 = await generateText({
            provider: 'runninghub',
            model: RUNNINGHUB_PRO_MODEL,
            prompt: '请详细描述图片',
            inputImageUrls: [RUNNINGHUB_IMAGE_URL],
          });
          assert.equal(response7.text, 'RunningHUB 文本结果');
        });
      },
    );
    const list8 = list7.filter((event5) => event5.target === '/api/v2/proxy/image');
    assert.equal(list8.length, 2);
  }),
  test('aiTextApi: RunningHUB 任务失败时会抛出轮询错误', async () => {
    await withMockFetch(
      async (value66, dom25 = {}) => {
        const value67 = String(value66 || '');
        if (value67 === '/api/config')
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: 'https://www.runninghub.cn',
                apiKey: 'k_runninghub',
                modelApiKey: 'k_runninghub_model',
              },
            },
          });
        if (value67 === '/api/v2/proxy/image') {
          const value68 = JSON.parse(String(dom25.body || '{}'));
          if (
            value68.apiUrl ===
            'https://www.runninghub.cn/openapi/v2/rhart-text-g-3-flash-preview-cv/image-to-text'
          )
            return jsonResponse({
              taskId: 'task_text_failed',
              status: 'RUNNING',
              errorCode: '',
              errorMessage: '',
            });
          if (value68.apiUrl === 'https://www.runninghub.cn/openapi/v2/query')
            return jsonResponse({
              taskId: 'task_text_failed',
              status: 'FAILED',
              errorCode: 'bad_task',
              errorMessage: 'task failed',
            });
        }
        throw new Error('unexpected fetch url: ' + value67);
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
    let value69 = false;
    await withMockFetch(
      async (value70) => {
        const value71 = String(value70 || '');
        if (value71 === '/api/config')
          return jsonResponse({
            providers: { grsai: { apiUrl: 'https://grsai.dakka.com.cn', apiKey: 'k_grsai' } },
          });
        if (value71 === '/local/ref.png') return imageResponse('grsai-image');
        if (isTelegraphProxyUpload(value71))
          return ((value69 = true), jsonResponse([{ src: '/unexpected-telegraph-ref.png' }]));
        if (value71 === 'https://grsai.dakka.com.cn/client/resource/newUploadTokenZH')
          return jsonResponse({
            data: {
              token: 'token_grsai',
              key: 'uploaded/grsai-ref.png',
              url: 'https://upload.grsai.example.com',
              domain: 'https://cdn.grsai.example.com',
            },
          });
        if (value71 === 'https://upload.grsai.example.com') return jsonResponse({ ok: true });
        throw new Error('unexpected fetch url: ' + value71);
      },
      async () => {
        const dom26 = await buildGenerateTextRequest({
          provider: 'grsai',
          model: 'gemini-3.1-pro',
          prompt: 'Please inspect @图片1 and keep the trailing text.',
          inputUrls: ['/local/ref.png'],
        });
        (assert.equal(dom26.url, '/api/v2/proxy/completions'),
          assert.equal(dom26.body.apiUrl, 'https://grsai.dakka.com.cn/v1'),
          assert.equal(dom26.body.apiKey, 'k_grsai'),
          assert.equal(dom26.body.model, 'gemini-3.1-pro'));
        const value72 = dom26.body.messages[1].content;
        (assert.ok(Array.isArray(value72)),
          assert.deepEqual(value72, [
            { type: 'text', text: 'Please inspect ' },
            { type: 'image_url', image_url: { url: 'https://cdn.grsai.example.com/uploaded/grsai-ref.png' } },
            { type: 'text', text: ' and keep the trailing text.' },
          ]),
          assert.equal(value69, false));
      },
    );
  }),
  test('aiTextApi: ppio text manifest uses OpenAI-compatible endpoint', async () => {
    await withMockFetch(
      async (value73) => {
        const value74 = String(value73 || '');
        if (value74 === '/api/config')
          return jsonResponse({
            providers: { ppio: { apiUrl: 'https://api.ppinfra.com', apiKey: 'k_ppio' } },
          });
        throw new Error('unexpected fetch url: ' + value74);
      },
      async () => {
        const dom27 = await buildGenerateTextRequest({
          provider: 'ppio',
          model: 'qwen/qwen3.5-397b-a17b',
          prompt: 'plain text prompt',
        });
        (assert.equal(dom27.url, '/api/v2/proxy/completions'),
          assert.equal(dom27.body.apiUrl, 'https://api.ppinfra.com/openai/v1'),
          assert.equal(dom27.body.apiKey, 'k_ppio'),
          assert.equal(dom27.body.model, 'qwen/qwen3.5-397b-a17b'),
          assert.equal(dom27.body.messages[1].content, 'plain text prompt'));
      },
    );
  }),
  test('aiTextApi: generateText via grsai proxy strips think tags from multimodal responses', async () => {
    let value75 = null;
    await withMockFetch(
      async (value76, dom28 = {}) => {
        const value77 = String(value76 || '');
        if (value77 === '/api/config')
          return jsonResponse({
            providers: { grsai: { apiUrl: 'https://grsai.dakka.com.cn', apiKey: 'k_grsai' } },
          });
        if (value77 === '/local/ref.png') return imageResponse('grsai-image');
        if (value77 === 'https://grsai.dakka.com.cn/client/resource/newUploadTokenZH')
          return jsonResponse({
            data: {
              token: 'token_grsai',
              key: 'uploaded/grsai-ref.png',
              url: 'https://upload.grsai.example.com',
              domain: 'https://cdn.grsai.example.com',
            },
          });
        if (value77 === 'https://upload.grsai.example.com') return jsonResponse({ ok: true });
        if (value77 === '/api/v2/proxy/completions')
          return (
            (value75 = JSON.parse(String(dom28.body || '{}'))),
            jsonResponse({ choices: [{ message: { content: '<think>internal reasoning</think>\n红色' } }] })
          );
        throw new Error('unexpected fetch url: ' + value77);
      },
      async () => {
        const response8 = await generateText({
          provider: 'grsai',
          model: 'gemini-3-pro',
          prompt: '这张图的主颜色是什么？只回答颜色。',
          inputUrls: ['/local/ref.png'],
        });
        (assert.equal(response8.text, '红色'),
          assert.equal(value75?.apiUrl, 'https://grsai.dakka.com.cn/v1'),
          assert.equal(value75?.model, 'gemini-3-pro'),
          assert.ok(Array.isArray(value75?.messages?.[1]?.content)));
      },
    );
  }),
  test('aiTextApi: grsai partial image upload failure keeps mention slots from shifting', async () => {
    await withMockFetch(
      async (value78) => {
        const value79 = String(value78 || '');
        if (value79 === '/api/config')
          return jsonResponse({
            providers: { grsai: { apiUrl: 'https://grsai.dakka.com.cn', apiKey: 'k_grsai' } },
          });
        if (value79 === '/local/first-failed.png') throw new Error('fetch failed');
        if (value79 === '/local/second-ok.png') return imageResponse('grsai-image-2');
        if (value79 === 'https://grsai.dakka.com.cn/client/resource/newUploadTokenZH')
          return jsonResponse({
            data: {
              token: 'token_grsai',
              key: 'uploaded/grsai-ref-2.png',
              url: 'https://upload.grsai.example.com',
              domain: 'https://cdn.grsai.example.com',
            },
          });
        if (value79 === 'https://upload.grsai.example.com') return jsonResponse({ ok: true });
        throw new Error('unexpected fetch url: ' + value79);
      },
      async () => {
        const dom29 = await buildGenerateTextRequest({
          provider: 'grsai',
          model: 'gemini-3.1-pro',
          prompt: 'A @图片1 B @图片2 C',
          inputUrls: ['/local/first-failed.png', '/local/second-ok.png'],
        });
        assert.deepEqual(dom29.body.messages[1].content, [
          { type: 'text', text: 'A @图片1 B ' },
          { type: 'image_url', image_url: { url: 'https://cdn.grsai.example.com/uploaded/grsai-ref-2.png' } },
          { type: 'text', text: ' C' },
        ]);
      },
    );
  }));
