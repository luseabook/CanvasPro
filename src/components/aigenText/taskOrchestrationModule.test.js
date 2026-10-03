import test from 'node:test';
import assert from 'node:assert/strict';
import { createAIGenTextNodeTaskOrchestrationModule } from './taskOrchestrationModule.js';
import {
  _resetPreviewRuntimeForTests,
  isPreviewNodeLoading,
  stopPreviewNodeLoading,
} from '../../modules/previewMode.js';
import { createPreviewContainer as createFakePreviewContainer, installDomEnvironment as installPreviewDomStubs } from '../../../tools/dom-test-environment.mjs';
import { DEFAULT_LOCALE, setLocale } from '../../i18n/index.js';
const originalWindow = globalThis.window,
  originalNodeCtor = globalThis.Node,
  restorePreviewDom = installPreviewDomStubs();
if (!globalThis.window) globalThis.window = {};
typeof globalThis.window.showToast !== 'function' && (globalThis.window.showToast = () => {});
!globalThis.Node && (globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 });
(test.after(() => {
  (_resetPreviewRuntimeForTests(),
    typeof originalWindow === 'undefined' ? delete globalThis.window : (globalThis.window = originalWindow),
    typeof originalNodeCtor === 'undefined' ? delete globalThis.Node : (globalThis.Node = originalNodeCtor),
    restorePreviewDom());
}),
  test('aigenText task orchestration: 预览模式下点击生成只启动假加载不发请求', async () => {
    const _0x27e5d4 = globalThis.window.PREVIEW_MODE;
    globalThis.window.PREVIEW_MODE = true;
    try {
      const _0x393dc9 = 'node-ai-text-preview-loading';
      let _0x24eb89 = false;
      const _0x4795a4 = createAIGenTextNodeTaskOrchestrationModule({
          store: {
            getState: () => ({
              nodes: { [_0x393dc9]: { id: _0x393dc9, model: 'gpt-4o', provider: 'openai' } },
            }),
            getIncomingEdges: () => [],
            updateNodeData() {},
          },
          api: {
            generateText: async () => {
              return ((_0x24eb89 = true), { text: '不会执行' });
            },
          },
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          commit: () => {},
          startLoading: () => {},
          stopLoading: () => {},
          bindRefThumbHoverPreview: () => {},
          getPromptPresets: () => [],
          getCustomTextModels: () => [],
          saveCustomTextModels: () => {},
        }),
        _0x15a2ec = Object.assign(Object.create(_0x4795a4), {
          nodeId: _0x393dc9,
          _data: { id: _0x393dc9, model: 'gpt-4o', provider: 'openai' },
          previewEl: createFakePreviewContainer(),
          promptEl: createPromptEl('请总结这张图'),
          btnEl: createButtonStub(),
        });
      (await _0x4795a4._onGenerate.call(_0x15a2ec),
        assert.equal(_0x24eb89, false),
        assert.equal(isPreviewNodeLoading(_0x393dc9), true),
        assert.equal(_0x15a2ec.btnEl.disabled, true),
        assert.match(_0x15a2ec.btnEl.innerHTML, /animation:spin/),
        stopPreviewNodeLoading(_0x393dc9),
        assert.equal(_0x15a2ec.btnEl.disabled, false),
        assert.doesNotMatch(_0x15a2ec.btnEl.innerHTML, /animation:spin/));
    } finally {
      globalThis.window.PREVIEW_MODE = _0x27e5d4;
    }
  }),
  test('aigenText task orchestration: 加入提示词模式只回填预设不发请求', async () => {
    const _0x48ecb5 = globalThis.window.showToast,
      _0x14fe9f = [];
    globalThis.window.showToast = (..._0x337aaf) => {
      _0x14fe9f.push(_0x337aaf);
    };
    try {
      const _0x200740 = 'node-ai-text-insert-prompt-preset';
      let _0x5e811e = false;
      const {
        proto: _0x6229be,
        ctx: _0x397022,
        state: _0x37edc4,
      } = createTestContext({
        targetId: _0x200740,
        nodeData: { id: _0x200740, model: 'gpt-4o', provider: 'openai' },
        promptText: '夜雨追逐',
        apiImpl: {
          generateText: async () => {
            return ((_0x5e811e = true), { text: '不应生成' });
          },
        },
      });
      (await _0x6229be._onGenerate.call(_0x397022, '改写成分镜：{用户输入}', { insertPrompt: true }),
        assert.equal(_0x5e811e, false),
        assert.equal(_0x37edc4.nodes[_0x200740].prompt, '改写成分镜：夜雨追逐'),
        assert.equal(_0x397022.promptEl.innerHTML, '改写成分镜：夜雨追逐'),
        assert.equal(_0x14fe9f.length, 0));
    } finally {
      globalThis.window.showToast = _0x48ecb5;
    }
  }),
  test.afterEach(() => {
    _resetPreviewRuntimeForTests();
  }),
  test('aigenText task orchestration: start patch enters running and success exits', async () => {
    const _0x377bd8 = 'node-ai-text-start-running';
    let _0xbb638d = 0,
      _0x431f33 = 0,
      _0x364fca;
    const _0xfb3d15 = new Promise((_0x365e88) => {
        _0x364fca = _0x365e88;
      }),
      {
        proto: _0x401c65,
        ctx: _0x9d919f,
        state: _0x52afad,
      } = createTestContext({
        targetId: _0x377bd8,
        nodeData: {
          id: _0x377bd8,
          model: 'gpt-4o',
          provider: 'openai',
          outputText: 'old text',
          isGenerating: false,
          jobStatus: 'success',
          generationDuration: 0x4d2,
        },
        promptText: 'write summary',
        apiImpl: { generateText: async () => _0xfb3d15 },
        startLoadingImpl: () => {
          _0xbb638d += 1;
        },
        stopLoadingImpl: () => {
          _0x431f33 += 1;
        },
      });
    ((_0x9d919f._isGenerating = false),
      (_0x9d919f.btnEl = createButtonStub()),
      (_0x9d919f.previewEl = {}),
      (_0x9d919f._updateSubmitButtonState = () => {}));
    const _0x3ff16d = _0x401c65._onGenerate.call(_0x9d919f);
    (await Promise.resolve(), await Promise.resolve());
    const _0x19f500 = _0x52afad.nodes[_0x377bd8];
    (assert.equal(_0xbb638d, 1),
      assert.equal(_0x431f33, 0),
      assert.equal(_0x19f500.isGenerating, true),
      assert.equal(_0x19f500.jobStatus, 'running'),
      assert.equal(_0x19f500.jobError, null),
      assert.equal(_0x19f500.generationDuration, null),
      _0x364fca({ text: 'new text' }),
      await _0x3ff16d);
    const _0x564509 = _0x52afad.nodes[_0x377bd8];
    (assert.equal(_0x564509.isGenerating, false),
      assert.equal(_0x564509.jobStatus, 'success'),
      assert.equal(_0x564509.jobError, null),
      assert.equal(_0x564509.outputText, 'new text'),
      assert.equal(_0x431f33, 1));
  }),
  test('aigenText task orchestration: timeout failure stays visible in text output', async () => {
    const _0x196c00 = globalThis.window.showToast,
      _0x581b16 = console.error,
      _0x3885da = [];
    ((globalThis.window.showToast = (..._0x422d04) => {
      _0x3885da.push(_0x422d04);
    }),
      (console.error = () => {}));
    try {
      const _0x4b9276 = 'node-ai-text-timeout-output',
        _0x1169df = new Error('请求超时（300秒）');
      _0x1169df.type = 'TIMEOUT';
      let _0x447b4f = '',
        _0x3accfd = 0;
      const {
        proto: _0x1c12a5,
        ctx: _0x2d7063,
        state: _0x51d787,
      } = createTestContext({
        targetId: _0x4b9276,
        nodeData: { id: _0x4b9276, model: 'gemini-3.1-pro', provider: 'grsai' },
        promptText: '你好',
        apiImpl: {
          generateText: async () => {
            throw _0x1169df;
          },
        },
        stopLoadingImpl: () => {
          _0x3accfd += 1;
        },
      });
      ((_0x2d7063._isGenerating = false),
        (_0x2d7063.btnEl = createButtonStub()),
        (_0x2d7063.previewEl = {}),
        (_0x2d7063.outputEl = {}),
        (_0x2d7063._updateSubmitButtonState = () => {}),
        (_0x2d7063._renderOutputText = (_0x1ed241) => {
          _0x447b4f = String(_0x1ed241 || '');
        }));
      const _0x34eb29 = await _0x1c12a5._onGenerate.call(_0x2d7063),
        _0x3ba322 = _0x51d787.nodes[_0x4b9276];
      (assert.equal(_0x34eb29.status, 'failed'),
        assert.equal(_0x3ba322.jobStatus, 'error'),
        assert.equal(_0x3ba322.jobError, '请求超时（300秒）'),
        assert.match(_0x3ba322.outputText, /生成超时/),
        assert.match(_0x447b4f, /生成超时/),
        assert.equal(_0x3885da.length, 0),
        assert.equal(_0x3accfd, 1));
    } finally {
      ((globalThis.window.showToast = _0x196c00), (console.error = _0x581b16));
    }
  }));
function createStore(_0xa75ea8, _0x220fbc = []) {
  return {
    getState() {
      return _0xa75ea8;
    },
    getIncomingEdges(_0x1eb3ca) {
      return _0x220fbc.filter((_0x5adfd9) => _0x5adfd9.targetId === _0x1eb3ca);
    },
    updateNodeData(_0x3bb6f3, _0x5472d4) {
      const _0x2f9117 = _0xa75ea8.nodes?.[_0x3bb6f3] || {};
      _0xa75ea8.nodes[_0x3bb6f3] = { ..._0x2f9117, ..._0x5472d4 };
    },
  };
}
function createPromptEl(_0x48856a = 'describe @图片1') {
  return { innerText: _0x48856a, childNodes: [{ nodeType: Node.TEXT_NODE, textContent: _0x48856a }] };
}
function createButtonStub() {
  const _0x2dfb39 = new Set();
  return {
    disabled: false,
    title: '',
    innerHTML: '',
    style: { color: '', cursor: '' },
    _attrs: new Map(),
    classList: {
      add(_0x4edc93) {
        _0x2dfb39.add(String(_0x4edc93 || ''));
      },
      remove(_0x172062) {
        _0x2dfb39.delete(String(_0x172062 || ''));
      },
      contains(_0xb1eeb0) {
        return _0x2dfb39.has(String(_0xb1eeb0 || ''));
      },
    },
    setAttribute(_0x3181cc, _0x28cb77) {
      this._attrs.set(String(_0x3181cc || ''), String(_0x28cb77 || ''));
    },
    removeAttribute(_0x9ad963) {
      this._attrs.delete(String(_0x9ad963 || ''));
    },
  };
}
function createTestContext({
  targetId: _0x5a68f1,
  nodeData: _0x204a8c,
  nodes: nodes = {},
  incomingEdges: incomingEdges = [],
  promptText: promptText = 'describe @图片1',
  customTextModels: customTextModels = [],
  apiImpl: apiImpl = {},
  startLoadingImpl: startLoadingImpl = () => {},
  stopLoadingImpl: stopLoadingImpl = () => {},
}) {
  const _0x3586bf = { nodes: { ...nodes, [_0x5a68f1]: { ..._0x204a8c } } },
    _0x10e9ab = createStore(_0x3586bf, incomingEdges),
    _0x4c6413 = createAIGenTextNodeTaskOrchestrationModule({
      store: _0x10e9ab,
      api: apiImpl,
      ensureThumbDecoded: () => {},
      revealRefThumbMedia: () => {},
      commit: () => {},
      startLoading: startLoadingImpl,
      stopLoading: stopLoadingImpl,
      bindRefThumbHoverPreview: () => {},
      getPromptPresets: () => [],
      getCustomTextModels: () => customTextModels,
      saveCustomTextModels: () => {},
    }),
    _0x3c6908 = Object.assign(Object.create(_0x4c6413), {
      nodeId: _0x5a68f1,
      _data: _0x3586bf.nodes[_0x5a68f1],
      promptEl: createPromptEl(promptText),
    });
  return { proto: _0x4c6413, ctx: _0x3c6908, state: _0x3586bf, store: _0x10e9ab };
}
(test('aigenText task orchestration: 图片引用优先使用原图本地路径', async () => {
  const _0x46a1a5 = 'node-ai-text-image-original-first',
    _0x446dcc = 'node-ref-image-text-original-first',
    { proto: _0x1b6af0, ctx: _0x1fae5b } = createTestContext({
      targetId: _0x46a1a5,
      nodeData: { id: _0x46a1a5, model: 'gpt-4o', provider: 'openai' },
      nodes: {
        [_0x446dcc]: {
          id: _0x446dcc,
          type: 'source-image',
          originalLocalPath: 'data/uploads/text-original.png',
          displayLocalPath: 'data/uploads/text-display.webp',
          thumbLocalPath: 'data/uploads/text-thumb.webp',
          thumbUrl: 'https://img.example.com/text-thumb.png',
        },
      },
      incomingEdges: [{ id: 'edge-text-original-first', sourceId: _0x446dcc, targetId: _0x46a1a5 }],
    }),
    _0x36a909 = await _0x1b6af0._buildPayload.call(_0x1fae5b);
  (assert.deepEqual(_0x36a909.inputUrls, ['/data/uploads/text-original.png']),
    assert.deepEqual(_0x36a909.inputImageUrls, ['/data/uploads/text-original.png']));
}),
  test('aigenText task orchestration: pending web image url is usable before remote import finishes', async () => {
    const _0x26f2b6 = 'node-ai-text-web-image-pending',
      _0x201c7d = 'node-ref-web-image-pending',
      { proto: _0xc00ee, ctx: _0x413504 } = createTestContext({
        targetId: _0x26f2b6,
        nodeData: { id: _0x26f2b6, model: 'gpt-4o', provider: 'openai' },
        nodes: {
          [_0x201c7d]: {
            id: _0x201c7d,
            type: 'source-image',
            capturePreviewUrl: 'https://cdn.example.com/pending-web-image.png',
            webSourceUrl: 'https://cdn.example.com/pending-web-image.png',
            isGenerating: true,
          },
        },
        incomingEdges: [{ id: 'edge-text-web-image-pending', sourceId: _0x201c7d, targetId: _0x26f2b6 }],
        promptText: 'reverse prompt',
      }),
      _0x4a890a = await _0xc00ee._buildPayload.call(_0x413504);
    (assert.deepEqual(_0x4a890a.inputUrls, ['https://cdn.example.com/pending-web-image.png']),
      assert.deepEqual(_0x4a890a.inputImageUrls, ['https://cdn.example.com/pending-web-image.png']));
  }),
  test('aigenText task orchestration: localized reference parser keeps Chinese aliases in English locale', async () => {
    setLocale('en-US', { persist: false, notify: false });
    try {
      const _0x24cb5c = 'node-ai-text-image-alias-en',
        _0x290d5c = 'node-ref-image-alias-en',
        { proto: _0x34be06, ctx: _0x3134ab } = createTestContext({
          targetId: _0x24cb5c,
          nodeData: { id: _0x24cb5c, model: 'gpt-4o', provider: 'openai' },
          nodes: {
            [_0x290d5c]: {
              id: _0x290d5c,
              type: 'source-image',
              originalLocalPath: 'data/uploads/text-alias.png',
            },
          },
          incomingEdges: [{ id: 'edge-text-alias-en', sourceId: _0x290d5c, targetId: _0x24cb5c }],
          promptText: 'describe @图片1',
        }),
        _0x267672 = await _0x34be06._buildPayload.call(_0x3134ab);
      (assert.deepEqual(_0x267672.inputUrls, ['/data/uploads/text-alias.png']),
        assert.deepEqual(_0x267672.inputImageUrls, ['/data/uploads/text-alias.png']));
    } finally {
      setLocale(DEFAULT_LOCALE, { persist: false, notify: false });
    }
  }),
  test('aigenText task orchestration: 视频引用优先使用原视频本地路径', async () => {
    const _0x1c3ba6 = 'node-ai-text-video-original-first',
      _0x53d18d = 'node-ref-video-text-original-first',
      { proto: _0x27cf5b, ctx: _0x1e43f5 } = createTestContext({
        targetId: _0x1c3ba6,
        nodeData: { id: _0x1c3ba6, model: 'gemini-3-flash-preview-nothinking', provider: 'apimart' },
        nodes: {
          [_0x53d18d]: {
            id: _0x53d18d,
            type: 'source-video',
            localPath: 'data/uploads/text-source-video.mp4',
            thumbUrl: 'https://img.example.com/video-thumb.jpg',
            imageUrl: 'https://img.example.com/video-poster.jpg',
          },
        },
        incomingEdges: [{ id: 'edge-text-video-original-first', sourceId: _0x53d18d, targetId: _0x1c3ba6 }],
        promptText: '分析 @视频1',
      }),
      _0x4edc14 = await _0x27cf5b._buildPayload.call(_0x1e43f5);
    (assert.deepEqual(_0x4edc14.inputUrls, ['/data/uploads/text-source-video.mp4']),
      assert.deepEqual(_0x4edc14.inputImageUrls, []),
      assert.deepEqual(_0x4edc14.inputVideoUrls, ['/data/uploads/text-source-video.mp4']));
  }),
  test('aigenText task orchestration: ai-text 入参无输出时使用 prompt 作为文本内容', async () => {
    const _0x3846c8 = 'node-ai-text-text-prompt-ref',
      _0x4d6206 = 'node-ai-text-prompt-source',
      { proto: _0x50ea86, ctx: _0x55fb51 } = createTestContext({
        targetId: _0x3846c8,
        nodeData: { id: _0x3846c8, model: 'gpt-4o', provider: 'openai' },
        nodes: { [_0x4d6206]: { id: _0x4d6206, type: 'ai-text', prompt: '来自另一个生成文本节点的提示词' } },
        incomingEdges: [{ id: 'edge-ai-text-prompt-ref', sourceId: _0x4d6206, targetId: _0x3846c8 }],
        promptText: '继续扩写',
      }),
      _0x342c06 = await _0x50ea86._buildPayload.call(_0x55fb51);
    (assert.equal(_0x342c06.prompt, '来自另一个生成文本节点的提示词\n继续扩写'),
      assert.deepEqual(_0x342c06.inputUrls, []));
  }),
  test('aigenText task orchestration: 自定义模型会按顺序收集多张图片入参', async () => {
    const _0x32b7dd = 'node-ai-text-custom-multimodal',
      _0x580c8d = 'node-ref-image-custom-first',
      _0x277757 = 'node-ref-image-custom-second',
      _0x35fbce = 'doubao-seed-2-0-pro',
      { proto: _0x9fa7a6, ctx: _0x63cc41 } = createTestContext({
        targetId: _0x32b7dd,
        nodeData: { id: _0x32b7dd, model: _0x35fbce },
        customTextModels: [_0x35fbce],
        nodes: {
          [_0x580c8d]: {
            id: _0x580c8d,
            type: 'source-image',
            originalLocalPath: 'data/uploads/custom-first.png',
          },
          [_0x277757]: {
            id: _0x277757,
            type: 'source-image',
            originalLocalPath: 'data/uploads/custom-second.png',
          },
        },
        incomingEdges: [
          { id: 'edge-custom-first', sourceId: _0x580c8d, targetId: _0x32b7dd },
          { id: 'edge-custom-second', sourceId: _0x277757, targetId: _0x32b7dd },
        ],
        promptText: 'compare @图片1 with @图片2',
      }),
      _0x3a2366 = await _0x9fa7a6._buildPayload.call(_0x63cc41);
    (assert.equal(_0x3a2366.provider, 'custom'),
      assert.equal(_0x3a2366.model, _0x35fbce),
      assert.deepEqual(_0x3a2366.inputUrls, [
        '/data/uploads/custom-first.png',
        '/data/uploads/custom-second.png',
      ]),
      assert.deepEqual(_0x3a2366.inputImageUrls, [
        '/data/uploads/custom-first.png',
        '/data/uploads/custom-second.png',
      ]));
  }),
  test('aigenText task orchestration: 自定义模型即使有图片也需要提示词', async () => {
    const _0x4dcc79 = 'node-ai-text-custom-needs-prompt',
      _0xce863e = 'node-ref-image-custom-needs-prompt',
      _0x34301a = 'doubao-seed-2-0-pro',
      _0x4ac452 = globalThis.window.showToast,
      _0x2bb6dd = [];
    globalThis.window.showToast = (..._0x510488) => {
      _0x2bb6dd.push(_0x510488);
    };
    try {
      const { proto: _0x4cea23, ctx: _0x3b24ef } = createTestContext({
          targetId: _0x4dcc79,
          nodeData: { id: _0x4dcc79, model: _0x34301a },
          customTextModels: [_0x34301a],
          nodes: {
            [_0xce863e]: {
              id: _0xce863e,
              type: 'source-image',
              originalLocalPath: 'data/uploads/custom-needs-prompt.png',
            },
          },
          incomingEdges: [{ id: 'edge-custom-needs-prompt', sourceId: _0xce863e, targetId: _0x4dcc79 }],
          promptText: '',
        }),
        _0x584847 = await _0x4cea23._buildPayload.call(_0x3b24ef);
      (assert.equal(_0x584847, null), assert.deepEqual(_0x2bb6dd, [['请输入提示词后再生成', 'warn']]));
    } finally {
      globalThis.window.showToast = _0x4ac452;
    }
  }));
