import test from 'node:test';
import assert from 'node:assert/strict';
import { createAIGenTextNodeTaskOrchestrationModule } from './taskOrchestrationModule.js';
import {
  _resetPreviewRuntimeForTests,
  isPreviewNodeLoading,
  stopPreviewNodeLoading,
} from '../../modules/previewMode.js';
import {
  createPreviewContainer as createFakePreviewContainer,
  installDomEnvironment as installPreviewDomStubs,
} from '../../../tools/dom-test-environment.mjs';
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
    const value = globalThis.window.PREVIEW_MODE;
    globalThis.window.PREVIEW_MODE = true;
    try {
      const id = 'node-ai-text-preview-loading';
      let item = false;
      const aIGenTextNodeTaskOrchestrationModule = createAIGenTextNodeTaskOrchestrationModule({
          store: {
            getState: () => ({
              nodes: { [id]: { id: id, model: 'gpt-4o', provider: 'openai' } },
            }),
            getIncomingEdges: () => [],
            updateNodeData() {},
          },
          api: {
            generateText: async () => {
              return ((item = true), { text: '不会执行' });
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
        key = Object.assign(Object.create(aIGenTextNodeTaskOrchestrationModule), {
          nodeId: id,
          _data: { id: id, model: 'gpt-4o', provider: 'openai' },
          previewEl: createFakePreviewContainer(),
          promptEl: createPromptEl('请总结这张图'),
          btnEl: createButtonStub(),
        });
      (await aIGenTextNodeTaskOrchestrationModule._onGenerate.call(key),
        assert.equal(item, false),
        assert.equal(isPreviewNodeLoading(id), true),
        assert.equal(key.btnEl.disabled, true),
        assert.match(key.btnEl.innerHTML, /animation:spin/),
        stopPreviewNodeLoading(id),
        assert.equal(key.btnEl.disabled, false),
        assert.doesNotMatch(key.btnEl.innerHTML, /animation:spin/));
    } finally {
      globalThis.window.PREVIEW_MODE = value;
    }
  }),
  test('aigenText task orchestration: 加入提示词模式只回填预设不发请求', async () => {
    const index = globalThis.window.showToast,
      list = [];
    globalThis.window.showToast = (...args) => {
      list.push(args);
    };
    try {
      const targetId = 'node-ai-text-insert-prompt-preset';
      let result = false;
      const {
        proto: proto,
        ctx: ctx,
        state: state,
      } = createTestContext({
        targetId: targetId,
        nodeData: { id: targetId, model: 'gpt-4o', provider: 'openai' },
        promptText: '夜雨追逐',
        apiImpl: {
          generateText: async () => {
            return ((result = true), { text: '不应生成' });
          },
        },
      });
      (await proto._onGenerate.call(ctx, '改写成分镜：{用户输入}', { insertPrompt: true }),
        assert.equal(result, false),
        assert.equal(state.nodes[targetId].prompt, '改写成分镜：夜雨追逐'),
        assert.equal(ctx.promptEl.innerHTML, '改写成分镜：夜雨追逐'),
        assert.equal(list.length, 0));
    } finally {
      globalThis.window.showToast = index;
    }
  }),
  test.afterEach(() => {
    _resetPreviewRuntimeForTests();
  }),
  test('aigenText task orchestration: start patch enters running and success exits', async () => {
    const targetId2 = 'node-ai-text-start-running';
    let data = 0,
      options = 0,
      handler;
    const target = new Promise((source) => {
        handler = source;
      }),
      {
        proto: proto2,
        ctx: ctx2,
        state: state2,
      } = createTestContext({
        targetId: targetId2,
        nodeData: {
          id: targetId2,
          model: 'gpt-4o',
          provider: 'openai',
          outputText: 'old text',
          isGenerating: false,
          jobStatus: 'success',
          generationDuration: 1234,
        },
        promptText: 'write summary',
        apiImpl: { generateText: async () => target },
        startLoadingImpl: () => {
          data += 1;
        },
        stopLoadingImpl: () => {
          options += 1;
        },
      });
    ((ctx2._isGenerating = false),
      (ctx2.btnEl = createButtonStub()),
      (ctx2.previewEl = {}),
      (ctx2._updateSubmitButtonState = () => {}));
    const next = proto2._onGenerate.call(ctx2);
    (await Promise.resolve(), await Promise.resolve());
    const current = state2.nodes[targetId2];
    (assert.equal(data, 1),
      assert.equal(options, 0),
      assert.equal(current.isGenerating, true),
      assert.equal(current.jobStatus, 'running'),
      assert.equal(current.jobError, null),
      assert.equal(current.generationDuration, null),
      handler({ text: 'new text' }),
      await next);
    const entry = state2.nodes[targetId2];
    (assert.equal(entry.isGenerating, false),
      assert.equal(entry.jobStatus, 'success'),
      assert.equal(entry.jobError, null),
      assert.equal(entry.outputText, 'new text'),
      assert.equal(options, 1));
  }),
  test('aigenText task orchestration: timeout failure stays visible in text output', async () => {
    const record = globalThis.window.showToast,
      payload = console.error,
      list2 = [];
    ((globalThis.window.showToast = (...args2) => {
      list2.push(args2);
    }),
      (console.error = () => {}));
    try {
      const targetId3 = 'node-ai-text-timeout-output',
        error = new Error('请求超时（300秒）');
      error.type = 'TIMEOUT';
      let handle = '',
        config = 0;
      const {
        proto: proto3,
        ctx: ctx3,
        state: state3,
      } = createTestContext({
        targetId: targetId3,
        nodeData: { id: targetId3, model: 'gemini-3.1-pro', provider: 'grsai' },
        promptText: '你好',
        apiImpl: {
          generateText: async () => {
            throw error;
          },
        },
        stopLoadingImpl: () => {
          config += 1;
        },
      });
      ((ctx3._isGenerating = false),
        (ctx3.btnEl = createButtonStub()),
        (ctx3.previewEl = {}),
        (ctx3.outputEl = {}),
        (ctx3._updateSubmitButtonState = () => {}),
        (ctx3._renderOutputText = (scope) => {
          handle = String(scope || '');
        }));
      const response = await proto3._onGenerate.call(ctx3),
        input = state3.nodes[targetId3];
      (assert.equal(response.status, 'failed'),
        assert.equal(input.jobStatus, 'error'),
        assert.equal(input.jobError, '请求超时（300秒）'),
        assert.match(input.outputText, /生成超时/),
        assert.match(handle, /生成超时/),
        assert.equal(list2.length, 0),
        assert.equal(config, 1));
    } finally {
      ((globalThis.window.showToast = record), (console.error = payload));
    }
  }));
function createStore(output, list3 = []) {
  return {
    getState() {
      return output;
    },
    getIncomingEdges(value2) {
      return list3.filter((item2) => item2.targetId === value2);
    },
    updateNodeData(value3, args3) {
      const args4 = output.nodes?.[value3] || {};
      output.nodes[value3] = { ...args4, ...args3 };
    },
  };
}
function createPromptEl(innerText = 'describe @图片1') {
  return { innerText: innerText, childNodes: [{ nodeType: Node.TEXT_NODE, textContent: innerText }] };
}
function createButtonStub() {
  const map = new Set();
  return {
    disabled: false,
    title: '',
    innerHTML: '',
    style: { color: '', cursor: '' },
    _attrs: new Map(),
    classList: {
      add(value4) {
        map.add(String(value4 || ''));
      },
      remove(value5) {
        map.delete(String(value5 || ''));
      },
      contains(value6) {
        return map.has(String(value6 || ''));
      },
    },
    setAttribute(value7, value8) {
      this._attrs.set(String(value7 || ''), String(value8 || ''));
    },
    removeAttribute(value9) {
      this._attrs.delete(String(value9 || ''));
    },
  };
}
function createTestContext({
  targetId: targetId4,
  nodeData: nodeData,
  nodes: nodes = {},
  incomingEdges: incomingEdges = [],
  promptText: promptText = 'describe @图片1',
  customTextModels: customTextModels = [],
  apiImpl: apiImpl = {},
  startLoadingImpl: startLoadingImpl = () => {},
  stopLoadingImpl: stopLoadingImpl = () => {},
}) {
  const _data = { nodes: { ...nodes, [targetId4]: { ...nodeData } } },
    store = createStore(_data, incomingEdges),
    proto4 = createAIGenTextNodeTaskOrchestrationModule({
      store: store,
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
    ctx4 = Object.assign(Object.create(proto4), {
      nodeId: targetId4,
      _data: _data.nodes[targetId4],
      promptEl: createPromptEl(promptText),
    });
  return { proto: proto4, ctx: ctx4, state: _data, store: store };
}
(test('aigenText task orchestration: 图片引用优先使用原图本地路径', async () => {
  const targetId5 = 'node-ai-text-image-original-first',
    id2 = 'node-ref-image-text-original-first',
    { proto: proto5, ctx: ctx5 } = createTestContext({
      targetId: targetId5,
      nodeData: { id: targetId5, model: 'gpt-4o', provider: 'openai' },
      nodes: {
        [id2]: {
          id: id2,
          type: 'source-image',
          originalLocalPath: 'data/uploads/text-original.png',
          displayLocalPath: 'data/uploads/text-display.webp',
          thumbLocalPath: 'data/uploads/text-thumb.webp',
          thumbUrl: 'https://img.example.com/text-thumb.png',
        },
      },
      incomingEdges: [{ id: 'edge-text-original-first', sourceId: id2, targetId: targetId5 }],
    }),
    value10 = await proto5._buildPayload.call(ctx5);
  (assert.deepEqual(value10.inputUrls, ['/data/uploads/text-original.png']),
    assert.deepEqual(value10.inputImageUrls, ['/data/uploads/text-original.png']));
}),
  test('aigenText task orchestration: pending web image url is usable before remote import finishes', async () => {
    const targetId6 = 'node-ai-text-web-image-pending',
      id3 = 'node-ref-web-image-pending',
      { proto: proto6, ctx: ctx6 } = createTestContext({
        targetId: targetId6,
        nodeData: { id: targetId6, model: 'gpt-4o', provider: 'openai' },
        nodes: {
          [id3]: {
            id: id3,
            type: 'source-image',
            capturePreviewUrl: 'https://cdn.example.com/pending-web-image.png',
            webSourceUrl: 'https://cdn.example.com/pending-web-image.png',
            isGenerating: true,
          },
        },
        incomingEdges: [{ id: 'edge-text-web-image-pending', sourceId: id3, targetId: targetId6 }],
        promptText: 'reverse prompt',
      }),
      value11 = await proto6._buildPayload.call(ctx6);
    (assert.deepEqual(value11.inputUrls, ['https://cdn.example.com/pending-web-image.png']),
      assert.deepEqual(value11.inputImageUrls, ['https://cdn.example.com/pending-web-image.png']));
  }),
  test('aigenText task orchestration: localized reference parser keeps Chinese aliases in English locale', async () => {
    setLocale('en-US', { persist: false, notify: false });
    try {
      const targetId7 = 'node-ai-text-image-alias-en',
        id4 = 'node-ref-image-alias-en',
        { proto: proto7, ctx: ctx7 } = createTestContext({
          targetId: targetId7,
          nodeData: { id: targetId7, model: 'gpt-4o', provider: 'openai' },
          nodes: {
            [id4]: {
              id: id4,
              type: 'source-image',
              originalLocalPath: 'data/uploads/text-alias.png',
            },
          },
          incomingEdges: [{ id: 'edge-text-alias-en', sourceId: id4, targetId: targetId7 }],
          promptText: 'describe @图片1',
        }),
        value12 = await proto7._buildPayload.call(ctx7);
      (assert.deepEqual(value12.inputUrls, ['/data/uploads/text-alias.png']),
        assert.deepEqual(value12.inputImageUrls, ['/data/uploads/text-alias.png']));
    } finally {
      setLocale(DEFAULT_LOCALE, { persist: false, notify: false });
    }
  }),
  test('aigenText task orchestration: 视频引用优先使用原视频本地路径', async () => {
    const targetId8 = 'node-ai-text-video-original-first',
      id5 = 'node-ref-video-text-original-first',
      { proto: proto8, ctx: ctx8 } = createTestContext({
        targetId: targetId8,
        nodeData: { id: targetId8, model: 'gemini-3-flash-preview-nothinking', provider: 'apimart' },
        nodes: {
          [id5]: {
            id: id5,
            type: 'source-video',
            localPath: 'data/uploads/text-source-video.mp4',
            thumbUrl: 'https://img.example.com/video-thumb.jpg',
            imageUrl: 'https://img.example.com/video-poster.jpg',
          },
        },
        incomingEdges: [{ id: 'edge-text-video-original-first', sourceId: id5, targetId: targetId8 }],
        promptText: '分析 @视频1',
      }),
      value13 = await proto8._buildPayload.call(ctx8);
    (assert.deepEqual(value13.inputUrls, ['/data/uploads/text-source-video.mp4']),
      assert.deepEqual(value13.inputImageUrls, []),
      assert.deepEqual(value13.inputVideoUrls, ['/data/uploads/text-source-video.mp4']));
  }),
  test('aigenText task orchestration: ai-text 入参无输出时使用 prompt 作为文本内容', async () => {
    const targetId9 = 'node-ai-text-text-prompt-ref',
      id6 = 'node-ai-text-prompt-source',
      { proto: proto9, ctx: ctx9 } = createTestContext({
        targetId: targetId9,
        nodeData: { id: targetId9, model: 'gpt-4o', provider: 'openai' },
        nodes: { [id6]: { id: id6, type: 'ai-text', prompt: '来自另一个生成文本节点的提示词' } },
        incomingEdges: [{ id: 'edge-ai-text-prompt-ref', sourceId: id6, targetId: targetId9 }],
        promptText: '继续扩写',
      }),
      value14 = await proto9._buildPayload.call(ctx9);
    (assert.equal(value14.prompt, '来自另一个生成文本节点的提示词\n继续扩写'),
      assert.deepEqual(value14.inputUrls, []));
  }),
  test('aigenText task orchestration: 自定义模型会按顺序收集多张图片入参', async () => {
    const targetId10 = 'node-ai-text-custom-multimodal',
      id7 = 'node-ref-image-custom-first',
      id8 = 'node-ref-image-custom-second',
      model = 'doubao-seed-2-0-pro',
      { proto: proto10, ctx: ctx10 } = createTestContext({
        targetId: targetId10,
        nodeData: { id: targetId10, model: model },
        customTextModels: [model],
        nodes: {
          [id7]: {
            id: id7,
            type: 'source-image',
            originalLocalPath: 'data/uploads/custom-first.png',
          },
          [id8]: {
            id: id8,
            type: 'source-image',
            originalLocalPath: 'data/uploads/custom-second.png',
          },
        },
        incomingEdges: [
          { id: 'edge-custom-first', sourceId: id7, targetId: targetId10 },
          { id: 'edge-custom-second', sourceId: id8, targetId: targetId10 },
        ],
        promptText: 'compare @图片1 with @图片2',
      }),
      value15 = await proto10._buildPayload.call(ctx10);
    (assert.equal(value15.provider, 'custom'),
      assert.equal(value15.model, model),
      assert.deepEqual(value15.inputUrls, [
        '/data/uploads/custom-first.png',
        '/data/uploads/custom-second.png',
      ]),
      assert.deepEqual(value15.inputImageUrls, [
        '/data/uploads/custom-first.png',
        '/data/uploads/custom-second.png',
      ]));
  }),
  test('aigenText task orchestration: 自定义模型即使有图片也需要提示词', async () => {
    const targetId11 = 'node-ai-text-custom-needs-prompt',
      id9 = 'node-ref-image-custom-needs-prompt',
      model2 = 'doubao-seed-2-0-pro',
      value16 = globalThis.window.showToast,
      list4 = [];
    globalThis.window.showToast = (...args5) => {
      list4.push(args5);
    };
    try {
      const { proto: proto11, ctx: ctx11 } = createTestContext({
          targetId: targetId11,
          nodeData: { id: targetId11, model: model2 },
          customTextModels: [model2],
          nodes: {
            [id9]: {
              id: id9,
              type: 'source-image',
              originalLocalPath: 'data/uploads/custom-needs-prompt.png',
            },
          },
          incomingEdges: [{ id: 'edge-custom-needs-prompt', sourceId: id9, targetId: targetId11 }],
          promptText: '',
        }),
        value17 = await proto11._buildPayload.call(ctx11);
      (assert.equal(value17, null), assert.deepEqual(list4, [['请输入提示词后再生成', 'warn']]));
    } finally {
      globalThis.window.showToast = value16;
    }
  }));
