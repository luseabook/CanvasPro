import test from 'node:test';
import assert from 'node:assert/strict';
import { createAIGenerateNodeTaskOrchestrationModule } from './taskOrchestrationModule.js';
import {
  _resetPreviewRuntimeForTests,
  isPreviewNodeLoading,
  stopPreviewNodeLoading,
} from '../../modules/previewMode.js';
import {
  createPreviewContainer as createFakePreviewContainer,
  installDomEnvironment as installPreviewDomStubs,
} from '../../../tools/dom-test-environment.mjs';
import {
  _resetAssetMentionRegistryForTests,
  setAssetMentionAssets,
} from '../../modules/assetMentionRegistry.js';
import { getModelManifest } from '../../manifests/index.js';
import { shouldShowGenerationBusyUi } from '../../core/generationTaskUiState.js';
import { DEFAULT_LOCALE, setLocale } from '../../i18n/index.js';
const originalWindow = globalThis.window,
  originalDocument = globalThis.document,
  originalNodeCtor = globalThis.Node,
  restorePreviewDom = installPreviewDomStubs();
if (!globalThis.window) globalThis.window = {};
typeof globalThis.window.showToast !== 'function' && (globalThis.window.showToast = () => {});
!globalThis.Node && (globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 });
!globalThis.document && (globalThis.document = { getElementById: () => null });
(test.after(() => {
  (_resetPreviewRuntimeForTests(),
    typeof originalWindow === 'undefined' ? delete globalThis.window : (globalThis.window = originalWindow),
    typeof originalDocument === 'undefined'
      ? delete globalThis.document
      : (globalThis.document = originalDocument),
    typeof originalNodeCtor === 'undefined' ? delete globalThis.Node : (globalThis.Node = originalNodeCtor),
    restorePreviewDom());
}),
  test.afterEach(() => {
    (_resetPreviewRuntimeForTests(), _resetAssetMentionRegistryForTests());
  }));
function createStore(value, list = []) {
  return {
    getState() {
      return value;
    },
    getIncomingEdges(item) {
      return list.filter((item2) => item2.targetId === item);
    },
    updateNodeData(key, args) {
      const args2 = value.nodes?.[key] || {};
      value.nodes[key] = { ...args2, ...args };
    },
  };
}
function createPromptTextNode(index = '') {
  return { nodeType: Node.TEXT_NODE, textContent: String(index || '') };
}
function createPromptElementNode({
  tagName: tagName = 'SPAN',
  className: className = '',
  dataset: dataset = {},
  textContent: textContent = '',
  childNodes: childNodes = [],
} = {}) {
  const list2 = String(className || '')
    .split(/\s+/)
    .filter(Boolean);
  return {
    nodeType: Node.ELEMENT_NODE,
    tagName: tagName,
    className: className,
    classList: {
      contains(result) {
        return list2.includes(String(result || ''));
      },
    },
    dataset: { ...dataset },
    textContent: String(textContent || ''),
    childNodes: Array.isArray(childNodes) ? childNodes : [],
  };
}
function createAssetPromptPillNode(data, options, target, source) {
  return createPromptElementNode({
    className: 'ref-pill',
    dataset: {
      label: String(data || ''),
      refOrigin: 'asset',
      assetId: String(options || ''),
      assetIndex: String(target),
      refType: String(source || ''),
    },
    textContent: String(data || ''),
  });
}
function createNodePromptPillNode(next, current, entry = 'image') {
  return createPromptElementNode({
    className: 'ref-pill',
    dataset: {
      label: String(next || ''),
      nodeId: String(current || ''),
      refType: String(entry || ''),
    },
    textContent: String(next || ''),
  });
}
function collectPromptInnerText(record) {
  return (Array.isArray(record) ? record : [])
    .map((el) => {
      const payload = Number(el?.nodeType);
      if (payload === Node.TEXT_NODE) return String(el?.textContent || '');
      if (payload !== Node.ELEMENT_NODE) return '';
      if (String(el?.tagName || '').toUpperCase() === 'BR') return '\n';
      const list3 = Array.isArray(el?.childNodes) ? el.childNodes : [];
      if (list3.length > 0) return collectPromptInnerText(list3);
      return String(el?.textContent || '');
    })
    .join('');
}
function createPromptEl(childNodes2 = 'test prompt') {
  if (Array.isArray(childNodes2)) {
    const innerText = collectPromptInnerText(childNodes2);
    return { innerText: innerText, textContent: innerText, childNodes: childNodes2 };
  }
  return {
    innerText: childNodes2,
    textContent: childNodes2,
    childNodes: [createPromptTextNode(childNodes2)],
  };
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
      add(handle) {
        map.add(String(handle || ''));
      },
      remove(state) {
        map.delete(String(state || ''));
      },
      contains(config) {
        return map.has(String(config || ''));
      },
    },
    setAttribute(scope, input) {
      this._attrs.set(String(scope || ''), String(input || ''));
    },
    removeAttribute(output) {
      this._attrs.delete(String(output || ''));
    },
  };
}
function createTestContext({
  targetId: targetId,
  nodeData: nodeData,
  nodes: nodes = {},
  incomingEdges: incomingEdges = [],
  promptText: promptText = 'mountain',
  promptEl: promptEl = null,
  ensureConfigImpl: ensureConfigImpl = async () => {},
  getProviderConfigImpl: getProviderConfigImpl = () => ({ apiKey: 'k_test' }),
  isRunninghubWorkflowModelImpl: isRunninghubWorkflowModelImpl = null,
  apiImpl: apiImpl = { generateImage: async () => ({ imageUrl: '/output/test.png' }) },
  startLoadingImpl: startLoadingImpl = () => {},
  stopLoadingImpl: stopLoadingImpl = () => {},
  storeImpl: storeImpl = null,
  stateOverride: stateOverride = null,
}) {
  const run = (args3) => {
      const modelManifest = getModelManifest(args3?.model),
        list4 = Array.isArray(modelManifest?.uiSchema?.fields) ? modelManifest.uiSchema.fields : [];
      if (!list4.length) return { ...args3 };
      const generationParams =
        args3?.generationParams &&
        typeof args3.generationParams === 'object' &&
        !Array.isArray(args3.generationParams)
          ? { ...args3.generationParams }
          : {};
      return (
        list4.forEach((item3) => {
          const value2 = String(item3?.id || '').trim();
          value2 &&
            generationParams[value2] === undefined &&
            Object.prototype.hasOwnProperty.call(args3, value2) &&
            (generationParams[value2] = args3[value2]);
        }),
        { ...args3, generationParams: generationParams }
      );
    },
    _data = stateOverride || { nodes: { ...nodes, [targetId]: run(nodeData) } };
  if (!_data.nodes || typeof _data.nodes !== 'object') _data.nodes = {};
  !_data.nodes?.[targetId] && (_data.nodes[targetId] = run(nodeData));
  const store = storeImpl || createStore(_data, incomingEdges),
    proto = createAIGenerateNodeTaskOrchestrationModule({
      store: store,
      getRefKindByNodeType: (value3) =>
        value3 === 'source-image' || value3 === 'image' || value3 === 'ai-image'
          ? 'image'
          : value3 === 'source-text' || value3 === 'ai-text'
            ? 'text'
            : null,
      getImage: async () => null,
      ensureConfig: ensureConfigImpl,
      getProviderConfig: getProviderConfigImpl,
      api: apiImpl,
      startLoading: startLoadingImpl,
      stopLoading: stopLoadingImpl,
    }),
    ctx = Object.assign(Object.create(proto), {
      nodeId: targetId,
      _data: _data.nodes[targetId],
      promptEl: promptEl || createPromptEl(promptText),
      _isRunninghubWorkflowModel(value4, value5) {
        if (typeof isRunninghubWorkflowModelImpl === 'function')
          return isRunninghubWorkflowModelImpl(value4, value5);
        return false;
      },
    });
  return { ctx: ctx, proto: proto, state: _data, store: store };
}
(test('aigenImage task orchestration: running RH store state cancels even when local flag is stale', async () => {
  const targetId2 = 'node-image-running-store-cancels',
    {
      proto: proto2,
      ctx: ctx2,
      state: state2,
    } = createTestContext({
      targetId: targetId2,
      nodeData: {
        id: targetId2,
        model: 'runninghub/2044874075721441281',
        provider: 'runninghubwf',
        rhTaskId: 'rh-running',
        rhTaskStatus: 'running',
        jobStatus: 'running',
        isGenerating: true,
      },
      isRunninghubWorkflowModelImpl: () => true,
    });
  let value6 = 0,
    value7 = 0;
  ((ctx2._isGenerating = false),
    (ctx2._cancelRunningHubWorkflowTask = async () => {
      value6 += 1;
    }),
    (ctx2._onGenerate = async () => {
      value7 += 1;
    }),
    (state2.nodes[targetId2] = {
      ...state2.nodes[targetId2],
      rhTaskId: 'rh-running',
      rhTaskStatus: 'running',
      jobStatus: 'running',
      isGenerating: true,
    }),
    await proto2._handleGenerateOrCancel.call(ctx2),
    assert.equal(value6, 1),
    assert.equal(value7, 0));
}),
  test('aigenImage task orchestration: /预设模板在空输入时回退默认值且不残留占位符', async () => {
    const targetId3 = 'node-ai-image-template-default-fallback',
      { proto: proto3, ctx: ctx3 } = createTestContext({
        targetId: targetId3,
        nodeData: {
          id: targetId3,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        promptText: '',
      }),
      value8 = await proto3._buildPayload.call(ctx3, '故事/描述：{用户输入 || 一段简短剧情}');
    (assert.ok(value8),
      assert.equal(value8.prompt, '故事/描述：一段简短剧情'),
      assert.equal(value8.prompt.includes('{{'), false));
  }),
  test('aigenImage task orchestration: 图像内置对象预设无输入时不生成', async () => {
    const value9 = globalThis.window.showToast,
      list5 = [];
    globalThis.window.showToast = (message, type) => {
      list5.push({ message: message, type: type });
    };
    try {
      const targetId4 = 'node-ai-image-static-template-empty',
        { proto: proto4, ctx: ctx4 } = createTestContext({
          targetId: targetId4,
          nodeData: {
            id: targetId4,
            model: 'nano-banana-pro-vt',
            provider: 'grsai',
            aspectRatio: '1:1',
            imageSize: '2K',
            batchSize: 1,
          },
          promptText: '',
        }),
        value10 = await proto4._buildPayload.call(ctx4, {
          type: 'static',
          text: '故事/描述：{用户输入 || 一段简短剧情}',
          requireInput: true,
          emptyInputMessage: '请输入提示词或添加参考图片',
        });
      (assert.equal(value10, null),
        assert.deepEqual(list5, [{ message: '请输入提示词或添加参考图片', type: 'warn' }]));
    } finally {
      globalThis.window.showToast = value9;
    }
  }),
  test('aigenImage task orchestration: 图像内置对象预设使用连线文本入参', async () => {
    const targetId5 = 'node-ai-image-static-template-linked-text',
      id = 'source-text-for-static-template',
      { proto: proto5, ctx: ctx5 } = createTestContext({
        targetId: targetId5,
        nodeData: {
          id: targetId5,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        nodes: { [id]: { id: id, type: 'ai-text', outputText: '雨夜赛博街区' } },
        incomingEdges: [{ id: 'edge-linked-text-static-template', sourceId: id, targetId: targetId5 }],
        promptText: '',
      }),
      value11 = await proto5._buildPayload.call(ctx5, {
        type: 'static',
        text: '故事/描述：{用户输入 || 一段简短剧情}',
        requireInput: true,
        emptyInputMessage: '请输入提示词或添加参考图片',
      });
    (assert.ok(value11), assert.equal(value11.prompt, '故事/描述：雨夜赛博街区'));
  }),
  test('aigenImage task orchestration: /预设模板在有输入时注入用户输入且不残留占位符', async () => {
    const targetId6 = 'node-ai-image-template-use-user-input',
      { proto: proto6, ctx: ctx6 } = createTestContext({
        targetId: targetId6,
        nodeData: {
          id: targetId6,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        promptText: '夜雨中的街道追逐',
      }),
      value12 = await proto6._buildPayload.call(ctx6, '故事/描述：{用户输入 || 一段简短剧情}');
    (assert.ok(value12),
      assert.equal(value12.prompt, '故事/描述：夜雨中的街道追逐'),
      assert.equal(value12.prompt.includes('{{'), false));
  }),
  test('aigenImage task orchestration: 开发者模式下 /预设 仅回填最终提示词不直接生成', async () => {
    const value13 = globalThis.window.DEV_MODE;
    globalThis.window.DEV_MODE = true;
    try {
      const targetId7 = 'node-ai-image-template-dev-preview';
      let value14 = false;
      const {
        proto: proto7,
        ctx: ctx7,
        state: state3,
      } = createTestContext({
        targetId: targetId7,
        nodeData: {
          id: targetId7,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        promptText: '夜雨中的街道追逐',
        apiImpl: {
          generateImage: async () => {
            return ((value14 = true), { imageUrl: '/output/test.png' });
          },
        },
      });
      (await proto7._onGenerate.call(ctx7, '故事/描述：{用户输入 || 一段简短剧情}'),
        assert.equal(value14, false),
        assert.equal(state3.nodes[targetId7].prompt, '故事/描述：夜雨中的街道追逐'),
        assert.equal(ctx7.promptEl.innerHTML, '故事/描述：夜雨中的街道追逐'));
    } finally {
      globalThis.window.DEV_MODE = value13;
    }
  }),
  test('aigenImage task orchestration: 预览模式下点击生成只启动假加载不发请求', async () => {
    const value15 = globalThis.window.PREVIEW_MODE;
    globalThis.window.PREVIEW_MODE = true;
    try {
      const targetId8 = 'node-ai-image-preview-loading';
      let value16 = false;
      const { proto: proto8, ctx: ctx8 } = createTestContext({
        targetId: targetId8,
        nodeData: {
          id: targetId8,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        apiImpl: {
          generateImage: async () => {
            return ((value16 = true), { imageUrl: '/output/test.png' });
          },
        },
      });
      ((ctx8.previewEl = createFakePreviewContainer()),
        (ctx8.btnEl = createButtonStub()),
        await proto8._onGenerate.call(ctx8),
        assert.equal(value16, false),
        assert.equal(isPreviewNodeLoading(targetId8), true),
        assert.equal(ctx8.btnEl.disabled, true),
        assert.match(ctx8.btnEl.innerHTML, /animation:spin/),
        stopPreviewNodeLoading(targetId8),
        assert.equal(ctx8.btnEl.disabled, false),
        assert.doesNotMatch(ctx8.btnEl.innerHTML, /animation:spin/));
    } finally {
      globalThis.window.PREVIEW_MODE = value15;
    }
  }),
  test('aigenImage task orchestration: asset image mentions send type placeholders in prompt order', async () => {
    const targetId9 = 'node-ai-image-asset-mentions';
    setAssetMentionAssets([
      {
        id: 'asset-people',
        items: [
          {
            name: 'person1',
            type: 'source-image',
            nodeData: { type: 'source-image', originalLocalPath: 'data/assets/person1.png' },
          },
          {
            name: 'person2',
            type: 'source-image',
            nodeData: { type: 'source-image', originalLocalPath: 'data/assets/person2.png' },
          },
        ],
      },
    ]);
    const { proto: proto9, ctx: ctx9 } = createTestContext({
        targetId: targetId9,
        nodeData: {
          id: targetId9,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        promptEl: createPromptEl([
          createAssetPromptPillNode('person1', 'asset-people', 0, 'image'),
          createPromptTextNode(' and '),
          createAssetPromptPillNode('person2', 'asset-people', 1, 'image'),
        ]),
      }),
      value17 = await proto9._buildPayload.call(ctx9);
    (assert.equal(value17.prompt, '@图片1 and @图片2'),
      assert.deepEqual(value17.inputUrls, ['/data/assets/person1.png', '/data/assets/person2.png']));
  }),
  test('aigenImage task orchestration: thumbnail reorder keeps inputUrls aligned with image labels', async () => {
    const targetId10 = 'node-ai-image-reordered-thumb-labels',
      id2 = 'node-ref-scene-image',
      id3 = 'node-ref-woman-image',
      { proto: proto10, ctx: ctx10 } = createTestContext({
        targetId: targetId10,
        nodeData: {
          id: targetId10,
          model: 'apimart/gpt-image-2',
          provider: 'apimart',
          aspectRatio: '1:1',
          imageSize: '1K',
          batchSize: 1,
          generationParams: { mode: 'official', aspectRatio: '1:1', imageSize: '1K' },
        },
        nodes: {
          [id2]: {
            id: id2,
            type: 'source-image',
            originalLocalPath: 'data/uploads/scene.png',
            width: 1600,
            height: 900,
          },
          [id3]: {
            id: id3,
            type: 'source-image',
            originalLocalPath: 'data/uploads/woman.png',
            width: 900,
            height: 1600,
          },
        },
        incomingEdges: [
          { id: 'edge-scene-first-after-drag', sourceId: id2, targetId: targetId10 },
          { id: 'edge-woman-second-after-drag', sourceId: id3, targetId: targetId10 },
        ],
        promptEl: createPromptEl([
          createNodePromptPillNode('@图片2', id3, 'image'),
          createPromptTextNode(' 的女人替换到 '),
          createNodePromptPillNode('@图片1', id2, 'image'),
          createPromptTextNode(' 的场景里面'),
        ]),
      }),
      value18 = await proto10._buildPayload.call(ctx10);
    (assert.equal(value18.prompt, '@图片2 的女人替换到 @图片1 的场景里面'),
      assert.deepEqual(value18.inputUrls, ['/data/uploads/scene.png', '/data/uploads/woman.png']));
  }),
  test('aigenImage task orchestration: RunningHub workflow payload reads hidden image asset refs', async () => {
    const targetId11 = 'node-ai-image-hidden-asset';
    setAssetMentionAssets([
      {
        id: 'asset-hidden-image',
        items: [
          {
            name: 'person',
            type: 'source-image',
            nodeData: { type: 'source-image', originalLocalPath: 'data/assets/hidden-person.png' },
          },
        ],
      },
    ]);
    const { proto: proto11, ctx: ctx11 } = createTestContext({
        targetId: targetId11,
        nodeData: {
          id: targetId11,
          model: 'runninghub/1994718111704158209',
          provider: 'runninghubwf',
          aspectRatio: '1:1',
          batchSize: 1,
          generationParams: { rhAnimeRealResolution: 1760, rhInstanceType: 'plus' },
          promptAssetInputRefs: [{ assetId: 'asset-hidden-image', itemIndex: 0, type: 'image' }],
        },
        promptText: 'portrait',
      }),
      value19 = await proto11._buildPayload.call(ctx11);
    (assert.equal(value19.prompt, 'portrait'),
      assert.equal(value19.rhAnimeRealResolution, 1760),
      assert.equal(value19.rhResolution, 1760),
      assert.equal(value19.rhInstanceType, 'plus'),
      assert.deepEqual(value19.inputUrls, ['/data/assets/hidden-person.png']));
  }),
  test('aigenImage task orchestration: person replace payload uses refSlot order for manifest model ids', async () => {
    const value20 = ['runninghub/2041177685895946242', 'runninghub/2050313968069165058'];
    for (const model of value20) {
      const targetId12 = 'node-person-replace-' + model.slice(-4),
        id4 = targetId12 + '-target',
        id5 = targetId12 + '-source',
        { proto: proto12, ctx: ctx12 } = createTestContext({
          targetId: targetId12,
          nodeData: {
            id: targetId12,
            model: model,
            provider: 'runninghubwf',
            aspectRatio: '1:1',
            batchSize: 1,
            generationParams: {
              rhResolution: model.endsWith('5058') ? 1280 : 1600,
              rhInstanceType: 'plus',
            },
          },
          nodes: {
            [id4]: {
              id: id4,
              type: 'source-image',
              originalLocalPath: 'data/uploads/target.png',
            },
            [id5]: {
              id: id5,
              type: 'source-image',
              originalLocalPath: 'data/uploads/source.png',
            },
          },
          incomingEdges: [
            {
              id: targetId12 + '-edge-source',
              sourceId: id5,
              targetId: targetId12,
              refSlot: 'replacedImage',
            },
            {
              id: targetId12 + '-edge-target',
              sourceId: id4,
              targetId: targetId12,
              refSlot: 'replaceTarget',
            },
          ],
          promptText: 'replace',
        }),
        value21 = await proto12._buildPayload.call(ctx12);
      (assert.deepEqual(value21.inputUrls, ['/data/uploads/target.png', '/data/uploads/source.png'], model),
        assert.equal(value21.rhResolution, model.endsWith('5058') ? 1280 : 1600),
        assert.equal(value21.rhInstanceType, 'plus'));
    }
  }),
  test('aigenImage task orchestration: modelApi fixed image slots produce inputUrlsBySlot', async () => {
    const targetId13 = 'node-youchuan-v6-slots',
      id6 = 'node-youchuan-main',
      id7 = 'node-youchuan-cref',
      id8 = 'node-youchuan-sref',
      { proto: proto13, ctx: ctx13 } = createTestContext({
        targetId: targetId13,
        nodeData: {
          id: targetId13,
          type: 'ai-image',
          model: 'runninghub-model/youchuan-v6',
          provider: 'runninghub',
          generationParams: { aspectRatio: '1:1', quality: '1' },
        },
        nodes: {
          [id6]: { id: id6, type: 'source-image', originalLocalPath: 'data/uploads/main.png' },
          [id7]: { id: id7, type: 'source-image', originalLocalPath: 'data/uploads/cref.png' },
          [id8]: { id: id8, type: 'source-image', originalLocalPath: 'data/uploads/sref.png' },
        },
        incomingEdges: [
          { id: 'edge-sref', sourceId: id8, targetId: targetId13, refSlot: 'sref' },
          { id: 'edge-main', sourceId: id6, targetId: targetId13, refSlot: 'imageUrl' },
          { id: 'edge-cref', sourceId: id7, targetId: targetId13, refSlot: 'cref' },
        ],
        promptText: 'portrait',
        getProviderConfigImpl: () => ({ modelApiKey: 'mk' }),
      }),
      value22 = await proto13._buildPayload.call(ctx13);
    (assert.deepEqual(value22.inputUrlsBySlot, {
      imageUrl: '/data/uploads/main.png',
      cref: '/data/uploads/cref.png',
      sref: '/data/uploads/sref.png',
    }),
      assert.deepEqual(value22.inputUrls, [
        '/data/uploads/sref.png',
        '/data/uploads/main.png',
        '/data/uploads/cref.png',
      ]));
  }),
  test('aigenImage task orchestration: Midjourney V7 fixed image slots omit missing role slot', async () => {
    const targetId14 = 'node-youchuan-v7-slots',
      id9 = 'node-youchuan-v7-main',
      id10 = 'node-youchuan-v7-sref',
      { proto: proto14, ctx: ctx14 } = createTestContext({
        targetId: targetId14,
        nodeData: {
          id: targetId14,
          type: 'ai-image',
          model: 'runninghub-model/youchuan-v7',
          provider: 'runninghub',
          generationParams: { aspectRatio: '1:1', quality: '1' },
        },
        nodes: {
          [id9]: { id: id9, type: 'source-image', originalLocalPath: 'data/uploads/v7-main.png' },
          [id10]: { id: id10, type: 'source-image', originalLocalPath: 'data/uploads/v7-sref.png' },
        },
        incomingEdges: [
          { id: 'edge-v7-sref', sourceId: id10, targetId: targetId14, refSlot: 'sref' },
          { id: 'edge-v7-main', sourceId: id9, targetId: targetId14, refSlot: 'imageUrl' },
        ],
        promptText: 'portrait',
        getProviderConfigImpl: () => ({ modelApiKey: 'mk' }),
      }),
      value23 = await proto14._buildPayload.call(ctx14);
    (assert.deepEqual(value23.inputUrlsBySlot, {
      imageUrl: '/data/uploads/v7-main.png',
      sref: '/data/uploads/v7-sref.png',
    }),
      assert.equal(value23.inputUrlsBySlot.cref, undefined),
      assert.deepEqual(value23.inputUrls, ['/data/uploads/v7-sref.png', '/data/uploads/v7-main.png']));
  }),
  test('aigenImage task orchestration: RunningHub image X single fixed slot produces imageUrl input', async () => {
    const targetId15 = 'node-rh-image-x-slot',
      id11 = 'node-rh-image-x-ref',
      { proto: proto15, ctx: ctx15 } = createTestContext({
        targetId: targetId15,
        nodeData: {
          id: targetId15,
          type: 'ai-image',
          model: 'runninghub-model/rhart-image-g',
          provider: 'runninghub',
        },
        nodes: {
          [id11]: {
            id: id11,
            type: 'source-image',
            originalLocalPath: 'data/uploads/image-x-ref.png',
          },
        },
        incomingEdges: [
          { id: 'edge-image-x-main', sourceId: id11, targetId: targetId15, refSlot: 'imageUrl' },
        ],
        promptText: 'polish the reference',
        getProviderConfigImpl: () => ({ modelApiKey: 'mk' }),
      }),
      value24 = await proto15._buildPayload.call(ctx15);
    (assert.deepEqual(value24.inputUrlsBySlot, { imageUrl: '/data/uploads/image-x-ref.png' }),
      assert.deepEqual(value24.inputUrls, ['/data/uploads/image-x-ref.png']),
      assert.equal(value24.provider, 'runninghub'),
      assert.equal(value24.rhModelRoute, 'low'),
      assert.equal(value24.imageSize, '1K'),
      assert.equal(value24.aspectRatio, '1:1'),
      assert.equal(value24.batchSize, 1),
      assert.equal(value24.numImages, undefined),
      assert.equal(value24.outputFormat, undefined),
      assert.equal(value24.suppressAspectRatio, undefined));
  }),
  test('aigenImage task orchestration: person replace adaptive ratio uses manifest source slot', async () => {
    const value25 = ['runninghub/2041177685895946242', 'runninghub/2050313968069165058'];
    for (const model2 of value25) {
      const targetId16 = 'node-person-replace-ratio-' + model2.slice(-4),
        id12 = targetId16 + '-target',
        id13 = targetId16 + '-source',
        { proto: proto16, ctx: ctx16 } = createTestContext({
          targetId: targetId16,
          nodeData: {
            id: targetId16,
            model: model2,
            provider: 'runninghubwf',
            batchSize: 1,
            generationParams: { rhResolution: model2.endsWith('5058') ? 1280 : 1600 },
          },
          nodes: {
            [id12]: {
              id: id12,
              type: 'source-image',
              originalLocalPath: 'data/uploads/target.png',
              width: 1600,
              height: 900,
            },
            [id13]: {
              id: id13,
              type: 'source-image',
              originalLocalPath: 'data/uploads/source.png',
              width: 900,
              height: 1600,
            },
          },
          incomingEdges: [
            {
              id: targetId16 + '-edge-target',
              sourceId: id12,
              targetId: targetId16,
              refSlot: 'replaceTarget',
            },
            {
              id: targetId16 + '-edge-source',
              sourceId: id13,
              targetId: targetId16,
              refSlot: 'replacedImage',
            },
          ],
          promptText: 'replace',
        }),
        value26 = await proto16._buildPayload.call(ctx16);
      (assert.deepEqual(value26.inputUrls, ['/data/uploads/target.png', '/data/uploads/source.png'], model2),
        assert.equal(value26.resolvedRatioLabel, '9:16', model2),
        assert.equal(value26.adaptiveSource, 'input-media', model2));
    }
  }),
  test('aigenImage task orchestration: GRSAI 有参考图+自适应时透传 API auto', async () => {
    const targetId17 = 'node-ai-image-1',
      id14 = 'node-ref-image-1',
      { proto: proto17, ctx: ctx17 } = createTestContext({
        targetId: targetId17,
        nodeData: {
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
        },
        nodes: {
          [id14]: {
            id: id14,
            type: 'source-image',
            imageUrl: 'https://img.example.com/ref.png',
            width: 1600,
            height: 900,
          },
        },
        incomingEdges: [{ id: 'edge-1', sourceId: id14, targetId: targetId17, refSlot: '' }],
      }),
      value27 = await proto17._buildPayload.call(ctx17);
    (assert.equal(value27.aspectRatio, 'auto'),
      assert.equal(value27.suppressAspectRatio, undefined),
      assert.equal(value27.resolvedRatioLabel, 'auto'),
      assert.equal(value27.adaptiveSource, 'input-media'),
      assert.equal(value27.ratioCapability, 'aspectRatio'),
      assert.deepEqual(value27.inputUrls, ['https://img.example.com/ref.png']));
  }),
  test('aigenImage task orchestration: source-image 生成入参优先使用原图本地路径', async () => {
    const targetId18 = 'node-ai-image-source-original-first',
      id15 = 'node-ref-image-source-original-first',
      { proto: proto18, ctx: ctx18 } = createTestContext({
        targetId: targetId18,
        nodeData: {
          id: targetId18,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        nodes: {
          [id15]: {
            id: id15,
            type: 'source-image',
            originalLocalPath: 'data/uploads/original.png',
            displayLocalPath: 'data/uploads/display.webp',
            thumbLocalPath: 'data/uploads/thumb.webp',
            thumbUrl: 'https://img.example.com/thumb.png',
            width: 1600,
            height: 900,
          },
        },
        incomingEdges: [
          { id: 'edge-source-original-first', sourceId: id15, targetId: targetId18, refSlot: '' },
        ],
      }),
      value28 = await proto18._buildPayload.call(ctx18);
    assert.deepEqual(value28.inputUrls, ['/data/uploads/original.png']);
  }),
  test('aigenImage task orchestration: localized reference parser keeps Chinese aliases in English locale', async () => {
    setLocale('en-US', { persist: false, notify: false });
    try {
      const targetId19 = 'node-ai-image-source-alias-en',
        id16 = 'node-ref-image-source-alias-en',
        { proto: proto19, ctx: ctx19 } = createTestContext({
          targetId: targetId19,
          nodeData: {
            id: targetId19,
            model: 'nano-banana-pro-vt',
            provider: 'grsai',
            aspectRatio: '1:1',
            imageSize: '2K',
            batchSize: 1,
          },
          nodes: {
            [id16]: {
              id: id16,
              type: 'source-image',
              originalLocalPath: 'data/uploads/alias-original.png',
            },
          },
          incomingEdges: [{ id: 'edge-source-alias-en', sourceId: id16, targetId: targetId19, refSlot: '' }],
          promptText: 'edit @图片1',
        }),
        value29 = await proto19._buildPayload.call(ctx19);
      assert.deepEqual(value29.inputUrls, ['/data/uploads/alias-original.png']);
    } finally {
      setLocale(DEFAULT_LOCALE, { persist: false, notify: false });
    }
  }),
  test('aigenImage task orchestration: ai-image 生成入参优先使用主图原图本地路径', async () => {
    const targetId20 = 'node-ai-image-ai-original-first',
      id17 = 'node-ref-ai-image-original-first',
      { proto: proto20, ctx: ctx20 } = createTestContext({
        targetId: targetId20,
        nodeData: {
          id: targetId20,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        nodes: {
          [id17]: {
            id: id17,
            type: 'ai-image',
            mainImageIndex: 1,
            localPath: 'data/uploads/node-local.png',
            sourceUrl: 'https://img.example.com/node-source.png',
            thumbUrl: 'https://img.example.com/node-thumb.png',
            images: [
              { originalLocalPath: 'data/uploads/other-original.png' },
              {
                originalLocalPath: 'data/uploads/main-original.png',
                localPath: 'data/uploads/main-local.png',
                sourceUrl: 'https://img.example.com/main-source.png',
                thumbUrl: 'https://img.example.com/main-thumb.png',
              },
            ],
            width: 1200,
            height: 1200,
          },
        },
        incomingEdges: [{ id: 'edge-ai-original-first', sourceId: id17, targetId: targetId20, refSlot: '' }],
      }),
      value30 = await proto20._buildPayload.call(ctx20);
    assert.deepEqual(value30.inputUrls, ['/data/uploads/main-original.png']);
  }),
  test('aigenImage task orchestration: PPIO 有参考图+自适应时不设置 suppressAspectRatio', async () => {
    const targetId21 = 'node-ai-image-2',
      id18 = 'node-ref-image-2',
      { proto: proto21, ctx: ctx21 } = createTestContext({
        targetId: targetId21,
        nodeData: { model: 'ppio/seedream-5.0-lite', aspectRatio: '自适应', imageSize: '2K', batchSize: 1 },
        nodes: {
          [id18]: {
            id: id18,
            type: 'source-image',
            imageUrl: 'https://img.example.com/ref-ppio.png',
            width: 1080,
            height: 1350,
          },
        },
        incomingEdges: [{ id: 'edge-2', sourceId: id18, targetId: targetId21, refSlot: '' }],
      }),
      value31 = await proto21._buildPayload.call(ctx21),
      value32 = await proto21._buildResumePayload.call(ctx21, ctx21._data);
    (assert.equal(value31.aspectRatio, '4:5'),
      assert.equal(value31.suppressAspectRatio, undefined),
      assert.equal(value31.provider, 'ppio'),
      assert.equal(value32.provider, 'ppio'),
      assert.deepEqual(value31.inputUrls, ['https://img.example.com/ref-ppio.png']));
  }),
  test('aigenImage task orchestration: grsai 有入参时自适应保持 API auto', async () => {
    const targetId22 = 'node-ai-image-grsai-input-first',
      id19 = 'node-ref-image-grsai-input-first',
      { proto: proto22, ctx: ctx22 } = createTestContext({
        targetId: targetId22,
        nodeData: {
          id: targetId22,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
          width: 900,
          height: 900,
        },
        nodes: {
          [id19]: {
            id: id19,
            type: 'source-image',
            imageUrl: 'https://img.example.com/ref-grsai-169.png',
            width: 1600,
            height: 900,
          },
        },
        incomingEdges: [{ id: 'edge-grsai-input-first', sourceId: id19, targetId: targetId22, refSlot: '' }],
      }),
      value33 = await proto22._buildPayload.call(ctx22);
    (assert.equal(value33.provider, 'grsai'),
      assert.equal(value33.aspectRatio, 'auto'),
      assert.equal(value33.resolvedRatioLabel, 'auto'),
      assert.equal(value33.adaptiveSource, 'input-media'));
  }),
  test('aigenImage task orchestration: GRSAI 未设置 aspectRatio 时默认 API auto', async () => {
    const targetId23 = 'node-ai-image-default-adaptive',
      { proto: proto23, ctx: ctx23 } = createTestContext({
        targetId: targetId23,
        nodeData: {
          id: targetId23,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          imageSize: '2K',
          batchSize: 1,
          width: 1600,
          height: 900,
        },
        incomingEdges: [],
      }),
      value34 = await proto23._buildPayload.call(ctx23);
    (assert.equal(value34.aspectRatio, 'auto'),
      assert.equal(value34.resolvedRatioLabel, 'auto'),
      assert.equal(value34.adaptiveSource, 'display'));
  }),
  test('aigenImage task orchestration: 自适应无图像入参时使用显示区域比例映射', async () => {
    const targetId24 = 'node-ai-image-3',
      id20 = 'node-ref-text-3',
      { proto: proto24, ctx: ctx24 } = createTestContext({
        targetId: targetId24,
        nodeData: {
          id: targetId24,
          model: 'ppio/seedream-5.0-lite',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
          width: 1700,
          height: 900,
        },
        nodes: {
          [id20]: { id: id20, type: 'source-text', text: 'hello', width: 2100, height: 300 },
        },
        incomingEdges: [{ id: 'edge-3', sourceId: id20, targetId: targetId24, refSlot: '' }],
      }),
      value35 = await proto24._buildPayload.call(ctx24);
    (assert.equal(value35.aspectRatio, '16:9'),
      assert.equal(value35.adaptiveSource, 'display'),
      assert.equal(value35.resolvedRatioLabel, '16:9'));
  }),
  test('aigenImage task orchestration: ai-text 入参无输出时使用 prompt 作为文本内容', async () => {
    const targetId25 = 'node-ai-image-text-prompt-ref',
      id21 = 'node-ai-text-prompt-ref',
      { proto: proto25, ctx: ctx25 } = createTestContext({
        targetId: targetId25,
        nodeData: {
          id: targetId25,
          model: 'ppio/seedream-5.0-lite',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        nodes: { [id21]: { id: id21, type: 'ai-text', prompt: '来自生成文本节点的提示词' } },
        incomingEdges: [
          { id: 'edge-ai-image-text-prompt', sourceId: id21, targetId: targetId25, refSlot: '' },
        ],
        promptText: '主体画面',
      }),
      value36 = await proto25._buildPayload.call(ctx25);
    (assert.equal(value36.prompt, '来自生成文本节点的提示词\n主体画面'),
      assert.deepEqual(value36.inputUrls, []));
  }),
  test('aigenImage task orchestration: Dreamina 自适应 + 16:9 入参图透传 16:9', async () => {
    const targetId26 = 'node-ai-image-dreamina-1',
      id22 = 'node-ref-image-dreamina-1',
      { proto: proto26, ctx: ctx26 } = createTestContext({
        targetId: targetId26,
        nodeData: {
          model: 'dreamina/5.0',
          provider: 'dreamina',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
        },
        nodes: {
          [id22]: {
            id: id22,
            type: 'source-image',
            imageUrl: 'https://img.example.com/dreamina-169.png',
            width: 1600,
            height: 900,
          },
        },
        incomingEdges: [{ id: 'edge-dreamina-1', sourceId: id22, targetId: targetId26, refSlot: '' }],
      }),
      value37 = await proto26._buildPayload.call(ctx26);
    (assert.equal(value37.provider, 'dreamina'), assert.equal(value37.aspectRatio, '16:9'));
  }),
  test('aigenImage task orchestration: 自适应入参优先使用真实媒体尺寸', async () => {
    const targetId27 = 'node-ai-image-real-media-size',
      id23 = 'node-ref-image-real-media-size',
      { proto: proto27, ctx: ctx27 } = createTestContext({
        targetId: targetId27,
        nodeData: {
          model: 'dreamina/5.0',
          provider: 'dreamina',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
          width: 1600,
          height: 900,
        },
        nodes: {
          [id23]: {
            id: id23,
            type: 'source-image',
            imageUrl: 'https://img.example.com/portrait-real.png',
            width: 1600,
            height: 900,
            imageWidth: 900,
            imageHeight: 1600,
          },
        },
        incomingEdges: [{ id: 'edge-real-media-size', sourceId: id23, targetId: targetId27, refSlot: '' }],
      }),
      value38 = await proto27._buildPayload.call(ctx27);
    (assert.equal(value38.provider, 'dreamina'),
      assert.equal(value38.aspectRatio, '9:16'),
      assert.equal(value38.resolvedRatioLabel, '9:16'),
      assert.equal(value38.adaptiveSource, 'input-media'));
  }),
  test('aigenImage task orchestration: Dreamina 生成入参保留原图本地路径', async () => {
    const targetId28 = 'node-ai-image-dreamina-original-first',
      id24 = 'node-ref-image-dreamina-original-first',
      { proto: proto28, ctx: ctx28 } = createTestContext({
        targetId: targetId28,
        nodeData: {
          id: targetId28,
          model: 'dreamina/5.0',
          provider: 'dreamina',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
        },
        nodes: {
          [id24]: {
            id: id24,
            type: 'source-image',
            originalLocalPath: 'data/uploads/dreamina-original.png',
            displayLocalPath: 'data/uploads/dreamina-display.webp',
            thumbLocalPath: 'data/uploads/dreamina-thumb.webp',
            thumbUrl: 'https://img.example.com/dreamina-thumb.png',
            width: 1600,
            height: 900,
          },
        },
        incomingEdges: [
          { id: 'edge-dreamina-original-first', sourceId: id24, targetId: targetId28, refSlot: '' },
        ],
      }),
      value39 = await proto28._buildPayload.call(ctx28);
    (assert.equal(value39.provider, 'dreamina'),
      assert.deepEqual(value39.inputUrls, ['/data/uploads/dreamina-original.png']));
  }),
  test('aigenImage task orchestration: Dreamina 自适应 + 非标准比例映射最近支持比例', async () => {
    const targetId29 = 'node-ai-image-dreamina-2',
      id25 = 'node-ref-image-dreamina-2',
      { proto: proto29, ctx: ctx29 } = createTestContext({
        targetId: targetId29,
        nodeData: {
          model: 'dreamina/4.5',
          provider: 'dreamina',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
        },
        nodes: {
          [id25]: {
            id: id25,
            type: 'source-image',
            imageUrl: 'https://img.example.com/dreamina-non-standard.png',
            width: 1250,
            height: 1000,
          },
        },
        incomingEdges: [{ id: 'edge-dreamina-2', sourceId: id25, targetId: targetId29, refSlot: '' }],
      }),
      value40 = await proto29._buildPayload.call(ctx29);
    (assert.equal(value40.provider, 'dreamina'), assert.equal(value40.aspectRatio, '4:3'));
  }),
  test('aigenImage task orchestration: Dreamina 自适应 + 无图像入参时 fallback 为 1:1', async () => {
    const targetId30 = 'node-ai-image-dreamina-3',
      { proto: proto30, ctx: ctx30 } = createTestContext({
        targetId: targetId30,
        nodeData: {
          model: 'dreamina/4.1',
          provider: 'dreamina',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
        },
        nodes: {},
        incomingEdges: [],
      }),
      value41 = await proto30._buildPayload.call(ctx30);
    (assert.equal(value41.provider, 'dreamina'), assert.equal(value41.aspectRatio, '1:1'));
  }),
  test('aigenImage task orchestration: 无入参时自适应优先使用显示区域比例', async () => {
    const targetId31 = 'node-ai-image-display-ratio',
      { proto: proto31, ctx: ctx31 } = createTestContext({
        targetId: targetId31,
        nodeData: {
          id: targetId31,
          model: 'dreamina/5.0',
          provider: 'dreamina',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
          width: 1500,
          height: 900,
        },
        incomingEdges: [],
      }),
      value42 = await proto31._buildPayload.call(ctx31);
    (assert.equal(value42.aspectRatio, '16:9'),
      assert.equal(value42.adaptiveSource, 'display'),
      assert.equal(value42.resolvedRatioLabel, '16:9'));
  }),
  test('aigenImage task orchestration: async pending 且无 taskId 时触发兜底重提', async () => {
    const targetId32 = 'node-ai-image-fallback-1',
      { proto: proto32, ctx: ctx32 } = createTestContext({
        targetId: targetId32,
        nodeData: {
          model: 'ppio/seedream-4.0',
          provider: 'ppio',
          asyncTaskProvider: 'ppio',
          asyncTaskKind: 'image',
          asyncTaskStatus: 'pending',
          asyncTaskId: '',
          generationStartTime: Date.now() - 800,
          generationDuration: null,
          images: [],
        },
      });
    let value43 = 0;
    ((ctx32._onGenerate = async () => {
      value43 += 1;
    }),
      (ctx32._stopAsyncRecovery = () => {}),
      (ctx32._isGenerating = false),
      await proto32._maybeResumeAsyncTaskImpl.call(ctx32),
      assert.equal(value43, 1));
  }),
  test('aigenImage task orchestration: async pending 且无 taskId 但已有结果时不触发重提', async () => {
    const targetId33 = 'node-ai-image-fallback-2',
      { proto: proto33, ctx: ctx33 } = createTestContext({
        targetId: targetId33,
        nodeData: {
          model: 'ppio/seedream-4.0',
          provider: 'ppio',
          asyncTaskProvider: 'ppio',
          asyncTaskKind: 'image',
          asyncTaskStatus: 'pending',
          asyncTaskId: '',
          generationStartTime: Date.now() - 800,
          generationDuration: null,
          imageUrl: '/output/ok.png',
          images: [{ imageUrl: '/output/ok.png' }],
        },
      });
    let value44 = 0,
      value45 = 0;
    ((ctx33._onGenerate = async () => {
      value44 += 1;
    }),
      (ctx33._stopAsyncRecovery = () => {
        value45 += 1;
      }),
      (ctx33._isGenerating = false),
      await proto33._maybeResumeAsyncTaskImpl.call(ctx33),
      assert.equal(value44, 0),
      assert.equal(value45, 1));
  }),
  test('aigenImage task orchestration: RunningHub recovery writes terminal state through runtime', async () => {
    const targetId34 = 'node-ai-image-rh-runtime-recovery',
      rhTaskStartedAt = Date.now() - 60000,
      {
        proto: proto34,
        ctx: ctx34,
        state: state4,
      } = createTestContext({
        targetId: targetId34,
        nodeData: {
          id: targetId34,
          model: 'runninghub/1994718111704158209',
          provider: 'runninghubwf',
          rhTaskId: 'rh-image-resume-success',
          rhTaskStatus: 'running',
          rhTaskStartedAt: rhTaskStartedAt,
          rhTaskUseOpenapiQuery: true,
          generationStartTime: rhTaskStartedAt,
          generationDuration: null,
          isGenerating: true,
          images: [],
        },
        isRunninghubWorkflowModelImpl: () => true,
        apiImpl: {
          resumeRunningHubImageTask: async (value46, value47, value48) => {
            return (
              assert.equal(value46, 'rh-image-resume-success'),
              assert.equal(value47.provider, 'runninghubwf'),
              assert.equal(value48.useOpenapiQuery, true),
              {
                images: [
                  {
                    imageUrl: '/output/resumed.png',
                    thumbUrl: '/output/resumed-thumb.png',
                    localPath: 'output/resumed.png',
                  },
                ],
              }
            );
          },
        },
      });
    ((ctx34._isGenerating = false),
      (ctx34._buildResumePayload = async () => ({
        model: 'runninghub/1994718111704158209',
        provider: 'runninghubwf',
        apiKey: 'k_rh',
      })),
      (ctx34._persistRunningHubResumeCache = () => {}),
      (ctx34._updateSubmitButtonState = () => {}),
      await proto34._maybeResumeRunningHubTaskImpl.call(ctx34));
    ctx34._rhResumePromise && (await ctx34._rhResumePromise);
    const value49 = state4.nodes[targetId34];
    (assert.equal(value49.isGenerating, false),
      assert.equal(value49.jobStatus, 'success'),
      assert.equal(value49.rhTaskId, 'rh-image-resume-success'),
      assert.equal(value49.rhTaskStatus, 'success'),
      assert.equal(value49.rhTaskRecovering, false),
      assert.equal(value49.imageUrl, '/output/resumed.png'),
      assert.equal(value49.thumbUrl, '/output/resumed-thumb.png'),
      assert.equal(value49.localPath, 'output/resumed.png'));
  }),
  test('aigenImage task orchestration: async recovery writes terminal state through runtime', async () => {
    const targetId35 = 'node-ai-image-async-runtime-recovery',
      asyncTaskStartedAt = Date.now() - 60000;
    let value50 = 0;
    const {
      proto: proto35,
      ctx: ctx35,
      state: state5,
    } = createTestContext({
      targetId: targetId35,
      nodeData: {
        id: targetId35,
        model: 'ppio/seedream-4.0',
        provider: 'ppio',
        asyncTaskProvider: 'ppio',
        asyncTaskKind: 'image',
        asyncTaskId: 'async-image-resume-success',
        asyncTaskStatus: 'running',
        asyncTaskStartedAt: asyncTaskStartedAt,
        generationStartTime: asyncTaskStartedAt,
        generationDuration: null,
        isGenerating: true,
        images: [],
      },
      apiImpl: {
        resumeAsyncImageTask: async (value51, value52, value53) => {
          return (
            (value50 += 1),
            assert.equal(value51, 'async-image-resume-success'),
            assert.equal(value52.provider, 'ppio'),
            assert.ok(value53?.signal),
            {
              images: [
                {
                  imageUrl: '/output/async-resumed.png',
                  thumbUrl: '/output/async-resumed-thumb.png',
                  localPath: 'output/async-resumed.png',
                },
              ],
            }
          );
        },
      },
    });
    ((ctx35._isGenerating = false),
      (ctx35._buildResumePayload = async () => ({
        model: 'ppio/seedream-4.0',
        provider: 'ppio',
        apiKey: 'k_ppio',
      })),
      (ctx35._persistAsyncResumeCache = () => {}),
      (ctx35._updateSubmitButtonState = () => {}),
      await proto35._maybeResumeAsyncTaskImpl.call(ctx35));
    ctx35._asyncResumePromise && (await ctx35._asyncResumePromise);
    const value54 = state5.nodes[targetId35];
    (assert.equal(value50, 1),
      assert.equal(value54.isGenerating, false),
      assert.equal(value54.jobStatus, 'success'),
      assert.equal(value54.asyncTaskId, 'async-image-resume-success'),
      assert.equal(value54.asyncTaskStatus, 'success'),
      assert.equal(value54.asyncTaskProvider, 'ppio'),
      assert.equal(value54.asyncTaskKind, 'image'),
      assert.equal(value54.asyncTaskRecovering, false),
      assert.equal(value54.imageUrl, '/output/async-resumed.png'),
      assert.equal(value54.thumbUrl, '/output/async-resumed-thumb.png'),
      assert.equal(value54.localPath, 'output/async-resumed.png'));
  }),
  test('aigenImage task orchestration: async recovery local abort keeps timer running', async () => {
    const targetId36 = 'node-ai-image-async-runtime-pause',
      asyncTaskStartedAt2 = Date.now() - 60000;
    let el2 = null;
    const {
      proto: proto36,
      ctx: ctx36,
      state: state6,
    } = createTestContext({
      targetId: targetId36,
      nodeData: {
        id: targetId36,
        model: 'ppio/seedream-4.0',
        provider: 'ppio',
        asyncTaskProvider: 'ppio',
        asyncTaskKind: 'image',
        asyncTaskId: 'async-image-resume-pause',
        asyncTaskStatus: 'running',
        asyncTaskStartedAt: asyncTaskStartedAt2,
        generationStartTime: asyncTaskStartedAt2,
        generationDuration: null,
        isGenerating: true,
        images: [],
      },
      apiImpl: {
        resumeAsyncImageTask: async (value55, value56, value57) =>
          new Promise((value58, handler) => {
            ((el2 = value57?.signal || null),
              el2?.addEventListener?.('abort', () => {
                const error = new Error('CANCELLED');
                ((error.name = 'AbortError'), handler(error));
              }));
          }),
      },
    });
    ((ctx36._isGenerating = false),
      (ctx36._buildResumePayload = async () => ({
        model: 'ppio/seedream-4.0',
        provider: 'ppio',
        apiKey: 'k_ppio',
      })),
      (ctx36._persistAsyncResumeCache = () => {}),
      (ctx36._updateSubmitButtonState = () => {}),
      await proto36._maybeResumeAsyncTaskImpl.call(ctx36));
    for (let count = 0; count < 5 && !el2; count += 1) {
      await new Promise((value59) => setImmediate(value59));
    }
    assert.ok(el2);
    const value60 = ctx36._asyncResumePromise;
    ctx36._stopAsyncRecovery(false);
    if (value60) await value60;
    const value61 = state6.nodes[targetId36];
    (assert.equal(value61.isGenerating, true),
      assert.equal(value61.jobStatus, 'running'),
      assert.equal(value61.generationStartTime, asyncTaskStartedAt2),
      assert.equal(value61.generationDuration, null),
      assert.equal(value61.asyncTaskId, 'async-image-resume-pause'),
      assert.equal(value61.asyncTaskStatus, 'running'),
      assert.equal(value61.asyncTaskRecovering, false));
  }),
  test('aigenImage task orchestration: Dreamina recovery writes terminal state through runtime', async () => {
    const targetId37 = 'node-ai-image-dreamina-runtime-recovery',
      dreaminaTaskStartedAt = Date.now() - 60000;
    let value62 = 0;
    const {
      proto: proto37,
      ctx: ctx37,
      state: state7,
    } = createTestContext({
      targetId: targetId37,
      nodeData: {
        id: targetId37,
        model: 'dreamina/4.1',
        provider: 'dreamina',
        dreaminaSubmitId: 'sid-dreamina-success',
        dreaminaTaskStatus: 'pending',
        dreaminaTaskPhase: 'generating',
        dreaminaTaskLabel: '生成中',
        dreaminaTaskStartedAt: dreaminaTaskStartedAt,
        dreaminaTaskLastCheckedAt: Date.now() - 30000,
        dreaminaTaskRecovering: false,
        generationStartTime: dreaminaTaskStartedAt,
        generationDuration: null,
        isGenerating: true,
        images: [],
      },
      apiImpl: {
        resumeDreaminaImageTask: async (value63, value64, value65) => {
          return (
            (value62 += 1),
            assert.equal(value63, 'sid-dreamina-success'),
            assert.equal(value64.provider, 'dreamina'),
            assert.ok(value65?.signal),
            {
              imageUrl: '/output/dreamina-resumed.png',
              thumbUrl: '/output/dreamina-resumed-thumb.png',
              localPath: 'output/dreamina-resumed.png',
            }
          );
        },
      },
    });
    ((ctx37._isGenerating = false),
      (ctx37._buildResumePayload = async () => ({ model: 'dreamina/4.1', provider: 'dreamina' })),
      (ctx37._persistDreaminaResumeCache = () => {}),
      (ctx37._updateSubmitButtonState = () => {}),
      await proto37._maybeResumeDreaminaTaskImpl.call(ctx37));
    ctx37._dreaminaResumePromise && (await ctx37._dreaminaResumePromise);
    const value66 = state7.nodes[targetId37];
    (assert.equal(value62, 1),
      assert.equal(value66.isGenerating, false),
      assert.equal(value66.jobStatus, 'success'),
      assert.equal(value66.dreaminaSubmitId, 'sid-dreamina-success'),
      assert.equal(value66.dreaminaTaskStatus, 'success'),
      assert.equal(value66.dreaminaTaskPhase, 'done'),
      assert.equal(value66.dreaminaTaskLabel, '已完成'),
      assert.equal(value66.dreaminaTaskRecovering, false),
      assert.equal(value66.imageUrl, '/output/dreamina-resumed.png'),
      assert.equal(value66.thumbUrl, '/output/dreamina-resumed-thumb.png'),
      assert.equal(value66.localPath, 'output/dreamina-resumed.png'));
  }),
  test('aigenImage task orchestration: stale Dreamina running task resumes and surfaces fail reason', async () => {
    const targetId38 = 'node-ai-image-dreamina-stale-recovery',
      dreaminaTaskStartedAt2 = Date.now() - 60000,
      {
        proto: proto38,
        ctx: ctx38,
        state: state8,
      } = createTestContext({
        targetId: targetId38,
        nodeData: {
          id: targetId38,
          model: 'dreamina/4.1',
          provider: 'dreamina',
          dreaminaSubmitId: 'sid-dreamina-fail',
          dreaminaTaskStatus: 'pending',
          dreaminaTaskPhase: 'generating',
          dreaminaTaskLabel: '生成中',
          dreaminaTaskStartedAt: dreaminaTaskStartedAt2,
          dreaminaTaskLastCheckedAt: Date.now() - 30000,
          dreaminaTaskRecovering: false,
          generationStartTime: dreaminaTaskStartedAt2,
          generationDuration: null,
          isGenerating: true,
          images: [],
        },
        apiImpl: {
          resumeDreaminaImageTask: async (value67) => {
            assert.equal(value67, 'sid-dreamina-fail');
            throw new Error('generation failed: final generation failed');
          },
        },
      });
    ((ctx38._isGenerating = true),
      (ctx38._buildResumePayload = async () => ({ model: 'dreamina/4.1', provider: 'dreamina' })),
      (ctx38._persistDreaminaResumeCache = () => {}),
      (ctx38._updateSubmitButtonState = () => {}),
      await proto38._maybeResumeDreaminaTaskImpl.call(ctx38),
      assert.ok(ctx38._dreaminaResumePromise),
      await ctx38._dreaminaResumePromise);
    const value68 = state8.nodes[targetId38];
    (assert.equal(value68.isGenerating, false),
      assert.equal(value68.jobStatus, 'error'),
      assert.equal(value68.jobError, 'generation failed: final generation failed'),
      assert.equal(value68.dreaminaTaskStatus, 'failed'),
      assert.equal(value68.dreaminaTaskPhase, 'failed'),
      assert.equal(value68.dreaminaTaskLabel, 'generation failed: final generation failed'),
      assert.equal(value68.dreaminaTaskRecovering, false));
  }),
  test('aigenImage task orchestration: persisted Dreamina running task resumes even with fresh lastChecked', async () => {
    const targetId39 = 'node-ai-image-dreamina-persisted-recovery',
      dreaminaTaskStartedAt3 = Date.now() - 60000,
      {
        proto: proto39,
        ctx: ctx39,
        state: state9,
      } = createTestContext({
        targetId: targetId39,
        nodeData: {
          id: targetId39,
          model: 'dreamina/4.1',
          provider: 'dreamina',
          dreaminaSubmitId: 'sid-dreamina-persisted-fail',
          dreaminaTaskStatus: 'pending',
          dreaminaTaskPhase: 'syncing',
          dreaminaTaskLabel: '正在同步结果',
          dreaminaTaskStartedAt: dreaminaTaskStartedAt3,
          dreaminaTaskLastCheckedAt: Date.now(),
          dreaminaTaskRecovering: false,
          generationStartTime: dreaminaTaskStartedAt3,
          generationDuration: null,
          isGenerating: true,
          images: [],
        },
        apiImpl: {
          resumeDreaminaImageTask: async (value69) => {
            assert.equal(value69, 'sid-dreamina-persisted-fail');
            throw new Error('generation failed: final generation failed');
          },
        },
      });
    ((ctx39._isGenerating = true),
      (ctx39._dreaminaActiveSubmitId = ''),
      (ctx39._buildResumePayload = async () => ({ model: 'dreamina/4.1', provider: 'dreamina' })),
      (ctx39._persistDreaminaResumeCache = () => {}),
      (ctx39._updateSubmitButtonState = () => {}),
      await proto39._maybeResumeDreaminaTaskImpl.call(ctx39),
      assert.ok(ctx39._dreaminaResumePromise),
      await ctx39._dreaminaResumePromise);
    const value70 = state9.nodes[targetId39];
    (assert.equal(value70.isGenerating, false),
      assert.equal(value70.jobStatus, 'error'),
      assert.equal(value70.dreaminaTaskStatus, 'failed'),
      assert.equal(value70.dreaminaTaskPhase, 'failed'));
  }),
  test('aigenImage task orchestration: Dreamina recovery does not abort itself on reentrant state update', async () => {
    const targetId40 = 'node-ai-image-dreamina-reentrant-recovery',
      dreaminaTaskStartedAt4 = Date.now() - 60000,
      {
        proto: proto40,
        ctx: ctx40,
        state: state10,
        store: store2,
      } = createTestContext({
        targetId: targetId40,
        nodeData: {
          id: targetId40,
          model: 'dreamina/4.1',
          provider: 'dreamina',
          dreaminaSubmitId: 'sid-dreamina-reentrant-fail',
          dreaminaTaskStatus: 'pending',
          dreaminaTaskPhase: 'generating',
          dreaminaTaskLabel: '生成中',
          dreaminaTaskStartedAt: dreaminaTaskStartedAt4,
          dreaminaTaskLastCheckedAt: Date.now() - 30000,
          dreaminaTaskRecovering: false,
          generationStartTime: dreaminaTaskStartedAt4,
          generationDuration: null,
          isGenerating: true,
          images: [],
        },
        apiImpl: {
          resumeDreaminaImageTask: async (value71) => {
            (assert.equal(value71, 'sid-dreamina-reentrant-fail'), await Promise.resolve());
            throw new Error('generation failed: final generation failed');
          },
        },
      });
    ((ctx40._isGenerating = true),
      (ctx40._buildResumePayload = async () => ({ model: 'dreamina/4.1', provider: 'dreamina' })),
      (ctx40._persistDreaminaResumeCache = () => {}),
      (ctx40._updateSubmitButtonState = () => {}));
    const run2 = store2.updateNodeData.bind(store2);
    let enabled = false;
    ((store2.updateNodeData = (value72, value73) => {
      (run2(value72, value73),
        !enabled &&
          value73?.dreaminaTaskRecovering === true &&
          ((enabled = true), void proto40._maybeResumeDreaminaTaskImpl.call(ctx40)));
    }),
      await proto40._maybeResumeDreaminaTaskImpl.call(ctx40),
      await ctx40._dreaminaResumePromise);
    const value74 = state10.nodes[targetId40];
    (assert.equal(enabled, true),
      assert.equal(value74.isGenerating, false),
      assert.equal(value74.jobStatus, 'error'),
      assert.equal(value74.dreaminaTaskStatus, 'failed'),
      assert.equal(value74.dreaminaTaskRecovering, false));
  }),
  test('aigenImage task orchestration: Dreamina failed progress finalizes and stops loading', async () => {
    const targetId41 = 'node-ai-image-dreamina-progress-fail',
      value75 = {};
    let value76 = 0,
      count2 = 0;
    const {
      proto: proto41,
      ctx: ctx41,
      state: state11,
    } = createTestContext({
      targetId: targetId41,
      nodeData: {
        id: targetId41,
        model: 'dreamina/4.1',
        provider: 'dreamina',
        aspectRatio: '1:1',
        imageSize: '2K',
        batchSize: 1,
      },
      apiImpl: {
        generateImage: async (value77, value78 = {}) => {
          (value78.onTaskMeta?.({ taskId: 'sid-dreamina-progress-fail' }),
            value78.onProgress?.({
              submitId: 'sid-dreamina-progress-fail',
              status: 'failed',
              phase: 'failed',
              label: 'policy rejected',
              failReason: 'policy rejected',
              raw: { status: 'failed' },
            }));
          const value79 = state11.nodes[targetId41];
          (assert.equal(value79.isGenerating, false),
            assert.equal(value79.jobStatus, 'error'),
            assert.equal(value79.jobError, 'policy rejected'),
            assert.equal(value79.dreaminaTaskStatus, 'failed'),
            assert.equal(value79.dreaminaTaskPhase, 'failed'),
            assert.equal(count2, 1));
          throw new Error('policy rejected');
        },
      },
      startLoadingImpl: (value80) => {
        (assert.equal(value80, value75), (value76 += 1));
      },
      stopLoadingImpl: (value81) => {
        (assert.equal(value81, value75), (count2 += 1));
      },
    });
    ((ctx41.previewEl = value75),
      (ctx41.btnEl = createButtonStub()),
      (ctx41._updateSubmitButtonState = () => {}),
      await proto41._onGenerate.call(ctx41));
    const value82 = state11.nodes[targetId41];
    (assert.equal(value76, 1),
      assert.ok(count2 >= 1),
      assert.equal(ctx41._isGenerating, false),
      assert.equal(ctx41.btnEl.classList.contains('is-rh-busy'), false),
      assert.doesNotMatch(ctx41.btnEl.innerHTML, /animation:spin/),
      assert.equal(value82.isGenerating, false),
      assert.equal(value82.jobStatus, 'error'),
      assert.equal(value82.jobError, 'policy rejected'),
      assert.equal(value82.dreaminaTaskRecovering, false),
      assert.ok(Number(value82.generationDuration) >= 0),
      assert.equal(value82.images?.[0]?.error, 'policy rejected'),
      assert.equal(value82.mainImageIndex, 0),
      assert.equal(value82.imageUrl, ''));
  }),
  test('aigenImage task orchestration: APIMart 错误结果会结束加载并标记失败', async () => {
    const targetId42 = 'node-ai-image-apimart-error',
      {
        proto: proto42,
        ctx: ctx42,
        state: state12,
      } = createTestContext({
        targetId: targetId42,
        nodeData: {
          id: targetId42,
          model: 'apimart/nano-banana-2',
          provider: 'apimart',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        apiImpl: {
          generateImage: async () => [
            { error: 'APIMart 任务报错：找不到任务 id', imageUrl: '', thumbUrl: '' },
          ],
        },
      });
    await proto42._onGenerate.call(ctx42);
    const value83 = state12.nodes[targetId42];
    (assert.equal(value83.isGenerating, false),
      assert.equal(value83.jobStatus, 'error'),
      assert.equal(value83.jobError, 'APIMart 任务报错：找不到任务 id'),
      assert.equal(value83.asyncTaskStatus, 'failed'),
      assert.equal(value83.images?.[0]?.error, 'APIMart 任务报错：找不到任务 id'));
  }),
  test('aigenImage task orchestration: mixed batch failure keeps successful images', async () => {
    const targetId43 = 'node-ai-image-mixed-batch',
      {
        proto: proto43,
        ctx: ctx43,
        state: state13,
      } = createTestContext({
        targetId: targetId43,
        nodeData: {
          id: targetId43,
          model: 'gpt-image-2',
          provider: 'grsai',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 4,
        },
        apiImpl: {
          generateImage: async () => ({
            isBatch: true,
            images: [
              { error: 'policy rejected', imageUrl: '', thumbUrl: '' },
              { imageUrl: '/output/a.png', localPath: 'output/a.png' },
              { imageUrl: '/output/b.png', localPath: 'output/b.png' },
              { imageUrl: '/output/c.png', localPath: 'output/c.png' },
            ],
          }),
        },
      });
    await proto43._onGenerate.call(ctx43);
    const value84 = state13.nodes[targetId43];
    (assert.equal(value84.isGenerating, false),
      assert.equal(value84.jobStatus, 'success'),
      assert.equal(value84.jobError, null),
      assert.equal(value84.images?.length, 4),
      assert.equal(value84.images?.[0]?.error, 'policy rejected'),
      assert.equal(value84.mainImageIndex, 1),
      assert.equal(value84.imageUrl, '/output/a.png'),
      assert.equal(value84.localPath, 'output/a.png'));
  }),
  test('aigenImage task orchestration: Volcengine 直连生成不伪装成异步任务', async () => {
    const targetId44 = 'node-ai-image-volcengine-loading',
      value85 = {};
    let value86 = 0;
    const {
      proto: proto44,
      ctx: ctx44,
      state: state14,
    } = createTestContext({
      targetId: targetId44,
      nodeData: {
        id: targetId44,
        model: 'volcengine/seedream-4.0',
        provider: 'volcengine',
        aspectRatio: '1:1',
        imageSize: '2K',
        batchSize: 1,
      },
      apiImpl: {
        generateImage: async (value87, value88 = {}) => {
          assert.equal(Boolean(value88.signal), false);
          const value89 = state14.nodes[targetId44];
          return (
            assert.equal(value89.isGenerating, true),
            assert.equal(value89.jobStatus, 'running'),
            assert.equal(value89.asyncTaskProvider, ''),
            assert.equal(value89.asyncTaskStatus, 'idle'),
            value88.onTaskMeta?.({
              taskId: 'ark-direct-response-1',
              provider: 'volcengine',
              kind: 'image',
            }),
            {
              imageUrl: '/output/volcengine.png',
              sourceUrl: 'https://ark.example.com/volcengine.png',
              thumbUrl: '/output/volcengine.png',
            }
          );
        },
      },
      startLoadingImpl: (value90) => {
        (assert.equal(value90, value85), (value86 += 1));
      },
    });
    ((ctx44.previewEl = value85),
      (ctx44.btnEl = createButtonStub()),
      (ctx44._updateSubmitButtonState = () => {}),
      await proto44._onGenerate.call(ctx44));
    const value91 = state14.nodes[targetId44];
    (assert.equal(value86, 1),
      assert.equal(value91.isGenerating, false),
      assert.equal(value91.jobStatus, 'success'),
      assert.equal(value91.asyncTaskProvider, ''),
      assert.equal(value91.asyncTaskKind, 'image'),
      assert.equal(value91.asyncTaskStatus, 'idle'),
      assert.equal(value91.imageUrl, '/output/volcengine.png'));
  }),
  test('aigenImage task orchestration: Volcengine 缺少 API Key 时生成前拦截', async () => {
    const targetId45 = 'node-ai-image-volcengine-missing-key',
      value92 = {},
      value93 = globalThis.window.showToast,
      list6 = [];
    let value94 = 0,
      value95 = 0;
    try {
      globalThis.window.showToast = (message2, type2) => {
        list6.push({ message: message2, type: type2 });
      };
      const {
        proto: proto45,
        ctx: ctx45,
        state: state15,
      } = createTestContext({
        targetId: targetId45,
        nodeData: {
          id: targetId45,
          model: 'volcengine/seedream-4.0',
          provider: 'volcengine',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        promptText: 'cat',
        getProviderConfigImpl: () => ({ apiKey: '' }),
        apiImpl: {
          generateImage: async () => {
            return ((value94 += 1), { imageUrl: '/output/should-not-run.png' });
          },
        },
        startLoadingImpl: (value96) => {
          (assert.equal(value96, value92), (value95 += 1));
        },
      });
      ((ctx45.previewEl = value92),
        (ctx45.btnEl = createButtonStub()),
        await proto45._onGenerate.call(ctx45));
      const value97 = state15.nodes[targetId45];
      (assert.equal(value94, 0),
        assert.equal(value95, 0),
        assert.equal(value97.isGenerating, undefined),
        assert.deepEqual(list6, [{ message: '请先在设置里填写火山方舟 API Key', type: 'warn' }]));
    } finally {
      globalThis.window.showToast = value93;
    }
  }),
  test('aigenImage task orchestration: manifest modelApi reads ordinary params from generationParams', async () => {
    const targetId46 = 'node-ai-image-apimart-manifest-params',
      { proto: proto46, ctx: ctx46 } = createTestContext({
        targetId: targetId46,
        nodeData: {
          id: targetId46,
          model: 'apimart/nano-banana-2',
          provider: 'apimart',
          aspectRatio: '16:9',
          imageSize: '2K',
          generationParams: {
            mode: 'official',
            aspectRatio: '1:8',
            imageSize: '4K',
            google_search: false,
            google_image_search: true,
            batchSize: 2,
          },
          batchSize: 4,
        },
        promptText: 'manifest params',
      }),
      value98 = await proto46._buildPayload.call(ctx46);
    (assert.equal(value98.model, 'apimart/nano-banana-2'),
      assert.equal(value98.provider, 'apimart'),
      assert.equal(value98.mode, 'official'),
      assert.equal(value98.imageSize, '4K'),
      assert.equal(value98.aspectRatio, '1:8'),
      assert.equal(value98.google_search, true),
      assert.equal(value98.google_image_search, true),
      assert.equal(value98.batchSize, 2));
  }),
  test('aigenImage task orchestration: Agnes image input starts loading without prompt', async () => {
    const targetId47 = 'node-ai-image-agnes-image-input',
      id26 = 'node-ai-image-agnes-source',
      value99 = {};
    let value100 = 0,
      value101 = 0,
      value102 = null;
    const {
      proto: proto47,
      ctx: ctx47,
      state: state16,
    } = createTestContext({
      targetId: targetId47,
      nodes: {
        [id26]: { id: id26, type: 'source-image', imageUrl: 'https://cdn.example.com/input.png' },
      },
      incomingEdges: [{ id: 'edge-agnes-image', sourceId: id26, targetId: targetId47 }],
      nodeData: {
        id: targetId47,
        model: 'agnes/agnes-image-2.0-flash',
        provider: 'agnes',
        generationParams: { aspectRatio: '16:9', imageSize: '1K', batchSize: 1 },
      },
      promptText: '',
      getProviderConfigImpl: () => ({ apiKey: 'k_agnes' }),
      apiImpl: {
        generateImage: async (value103) => {
          return ((value102 = value103), { imageUrl: '/output/agnes.png' });
        },
      },
      startLoadingImpl: (value104) => {
        (assert.equal(value104, value99), (value100 += 1));
      },
      stopLoadingImpl: (value105) => {
        (assert.equal(value105, value99), (value101 += 1));
      },
    });
    ((ctx47.previewEl = value99),
      (ctx47.btnEl = createButtonStub()),
      await proto47._onGenerate.call(ctx47),
      assert.equal(value100, 1),
      assert.equal(value101, 1),
      assert.equal(value102?.provider, 'agnes'),
      assert.equal(value102?.model, 'agnes/agnes-image-2.0-flash'),
      assert.deepEqual(value102?.inputUrls, ['https://cdn.example.com/input.png']),
      assert.equal(state16.nodes[targetId47].jobStatus, 'success'));
  }),
  test('aigenImage task orchestration: generation start keeps existing preview under loading overlay', async () => {
    const targetId48 = 'node-ai-image-stale-error-start';
    let value106 = null,
      value107 = 0;
    const {
      proto: proto48,
      ctx: ctx48,
      state: state17,
    } = createTestContext({
      targetId: targetId48,
      nodeData: {
        id: targetId48,
        model: 'agnes/agnes-image-2.1-flash',
        provider: 'agnes',
        generationParams: { aspectRatio: '16:9', imageSize: '1K', batchSize: 1 },
        images: [{ error: 'previous failure', imageUrl: '', thumbUrl: '' }],
        imageUrl: '',
        thumbUrl: '',
        jobStatus: 'error',
        isGenerating: false,
      },
      promptText: 'retry this image',
      getProviderConfigImpl: () => ({ apiKey: 'k_agnes' }),
      apiImpl: {
        generateImage: async () => {
          return ((value106 = state17.nodes[targetId48]), { imageUrl: '/output/retry.png' });
        },
      },
      startLoadingImpl: () => {
        value107 += 1;
      },
    });
    ((ctx48.btnEl = createButtonStub()),
      await proto48._onGenerate.call(ctx48),
      assert.equal(value107, 1),
      assert.deepEqual(value106?.images, [{ error: 'previous failure', imageUrl: '', thumbUrl: '' }]),
      assert.equal(value106?.imageUrl, ''),
      assert.equal(value106?.jobStatus, 'running'),
      assert.equal(state17.nodes[targetId48].jobStatus, 'success'),
      assert.equal(state17.nodes[targetId48].imageUrl, '/output/retry.png'));
  }),
  test('aigenImage task orchestration: Agnes image start clears stale task family terminal states', async () => {
    const targetId49 = 'node-ai-image-agnes-stale-task-family-start',
      value108 = {};
    let value109 = null,
      value110 = 0;
    const {
      proto: proto49,
      ctx: ctx49,
      state: state18,
    } = createTestContext({
      targetId: targetId49,
      nodeData: {
        id: targetId49,
        model: 'agnes/agnes-image-2.1-flash',
        provider: 'agnes',
        generationParams: { aspectRatio: '16:9', imageSize: '1K', batchSize: 1 },
        rhTaskId: 'old-rh-task',
        rhTaskStatus: 'failed',
        dreaminaSubmitId: 'old-dreamina-task',
        dreaminaTaskStatus: 'failed',
        dreaminaTaskPhase: 'failed',
        asyncTaskId: 'old-async-task',
        asyncTaskStatus: 'success',
        jobStatus: 'error',
        isGenerating: false,
      },
      promptText: 'retry with Agnes',
      getProviderConfigImpl: () => ({ apiKey: 'k_agnes' }),
      apiImpl: {
        generateImage: async () => {
          return ((value109 = state18.nodes[targetId49]), { imageUrl: '/output/agnes-retry.png' });
        },
      },
      startLoadingImpl: (value111) => {
        (assert.equal(value111, value108), (value110 += 1));
      },
    });
    ((ctx49.previewEl = value108),
      (ctx49.btnEl = createButtonStub()),
      await proto49._onGenerate.call(ctx49),
      assert.equal(value110, 1),
      assert.equal(value109?.isGenerating, true),
      assert.equal(value109?.jobStatus, 'running'),
      assert.equal(value109?.rhTaskId, ''),
      assert.equal(value109?.rhTaskStatus, 'idle'),
      assert.equal(value109?.dreaminaSubmitId, ''),
      assert.equal(value109?.dreaminaTaskStatus, 'idle'),
      assert.equal(value109?.dreaminaTaskPhase, 'idle'),
      assert.equal(value109?.asyncTaskId, ''),
      assert.equal(value109?.asyncTaskStatus, 'idle'),
      assert.equal(shouldShowGenerationBusyUi(value109), true),
      assert.equal(state18.nodes[targetId49].jobStatus, 'success'),
      assert.equal(state18.nodes[targetId49].imageUrl, '/output/agnes-retry.png'));
  }),
  test('aigenImage task orchestration: API throw 会结束加载并标记失败', async () => {
    const targetId50 = 'node-ai-image-throw-error',
      {
        proto: proto50,
        ctx: ctx50,
        state: state19,
      } = createTestContext({
        targetId: targetId50,
        nodeData: {
          id: targetId50,
          model: 'ppio/seedream-5.0-lite',
          provider: 'ppio',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        apiImpl: {
          generateImage: async () => {
            throw new Error('PPIO 创建任务失败');
          },
        },
      });
    await proto50._onGenerate.call(ctx50);
    const value112 = state19.nodes[targetId50];
    (assert.equal(value112.isGenerating, false),
      assert.equal(value112.jobStatus, 'error'),
      assert.equal(value112.jobError, 'PPIO 创建任务失败'),
      assert.equal(value112.asyncTaskStatus, 'failed'),
      assert.equal(value112.images?.[0]?.error, 'PPIO 创建任务失败'),
      assert.equal(value112.mainImageIndex, 0),
      assert.equal(value112.imageUrl, ''));
  }),
  test('aigenImage task orchestration: API 返回单个错误对象会结束加载并标记失败', async () => {
    const targetId51 = 'node-ai-image-object-error',
      {
        proto: proto51,
        ctx: ctx51,
        state: state20,
      } = createTestContext({
        targetId: targetId51,
        nodeData: {
          id: targetId51,
          model: 'nano-banana',
          provider: 'grsai',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        apiImpl: {
          generateImage: async () => ({ error: 'GRSAI 无法解析图片地址', imageUrl: '', thumbUrl: '' }),
        },
      });
    await proto51._onGenerate.call(ctx51);
    const value113 = state20.nodes[targetId51];
    (assert.equal(value113.isGenerating, false),
      assert.equal(value113.jobStatus, 'error'),
      assert.equal(value113.jobError, 'GRSAI 无法解析图片地址'),
      assert.equal(value113.asyncTaskStatus, 'failed'));
  }),
  test('aigenImage task orchestration: 缺少 taskId 错误会结束加载并标记失败', async () => {
    const targetId52 = 'node-ai-image-missing-task-id',
      {
        proto: proto52,
        ctx: ctx52,
        state: state21,
      } = createTestContext({
        targetId: targetId52,
        nodeData: {
          id: targetId52,
          model: 'apimart/nano-banana-2',
          provider: 'apimart',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        apiImpl: {
          generateImage: async () => {
            throw new Error('缺少异步图片任务ID，无法恢复');
          },
        },
      });
    await proto52._onGenerate.call(ctx52);
    const value114 = state21.nodes[targetId52];
    (assert.equal(value114.isGenerating, false),
      assert.equal(value114.jobStatus, 'error'),
      assert.equal(value114.jobError, '缺少异步图片任务ID，无法恢复'),
      assert.equal(value114.asyncTaskStatus, 'failed'));
  }),
  test('aigenImage task orchestration: 成功结果会结束加载并标记成功', async () => {
    const targetId53 = 'node-ai-image-success',
      {
        proto: proto53,
        ctx: ctx53,
        state: state22,
      } = createTestContext({
        targetId: targetId53,
        nodeData: {
          id: targetId53,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        apiImpl: {
          generateImage: async () => ({
            imageUrl: '/output/success.png',
            sourceUrl: 'https://img.example.com/success.png',
            thumbUrl: '/output/success.png',
          }),
        },
      });
    await proto53._onGenerate.call(ctx53);
    const value115 = state22.nodes[targetId53];
    (assert.equal(value115.isGenerating, false),
      assert.equal(value115.jobStatus, 'success'),
      assert.equal(value115.jobError, null),
      assert.equal(value115.asyncTaskStatus, 'success'),
      assert.equal(value115.imageUrl, '/output/success.png'));
  }),
  test('aigenImage task orchestration: GRSAI direct success unlocks repeated generation', async () => {
    const targetId54 = 'node-ai-image-grsai-repeat-success',
      value116 = {};
    let value117 = 0,
      value118 = 0,
      value119 = 0;
    const {
      proto: proto54,
      ctx: ctx54,
      state: state23,
    } = createTestContext({
      targetId: targetId54,
      nodeData: {
        id: targetId54,
        model: 'nano-banana-2',
        provider: 'grsai',
        aspectRatio: '1:1',
        imageSize: '2K',
        batchSize: 1,
      },
      promptText: 'repeatable prompt',
      apiImpl: {
        generateImage: async (value120, value121 = {}) => {
          return (
            (value117 += 1),
            value121.onTaskMeta?.({ taskId: 'grsai-direct-' + value117, provider: 'grsai' }),
            {
              imageUrl: '/output/grsai-direct-' + value117 + '.png',
              sourceUrl: 'https://img.example.com/grsai-direct-' + value117 + '.png',
              thumbUrl: '/output/grsai-direct-' + value117 + '.png',
            }
          );
        },
      },
      startLoadingImpl: (value122) => {
        (assert.equal(value122, value116), (value118 += 1));
      },
      stopLoadingImpl: (value123) => {
        (assert.equal(value123, value116), (value119 += 1));
      },
    });
    ((ctx54.previewEl = value116),
      (ctx54.btnEl = createButtonStub()),
      await proto54._onGenerate.call(ctx54),
      assert.equal(ctx54._isGenerating, false),
      assert.equal(ctx54.btnEl.disabled, false),
      assert.doesNotMatch(ctx54.btnEl.innerHTML, /animation:spin/),
      await proto54._onGenerate.call(ctx54));
    const value124 = state23.nodes[targetId54];
    (assert.equal(value117, 2),
      assert.equal(value118, 2),
      assert.equal(value119, 2),
      assert.equal(ctx54._isGenerating, false),
      assert.equal(ctx54.btnEl.disabled, false),
      assert.equal(value124.isGenerating, false),
      assert.equal(value124.jobStatus, 'success'),
      assert.equal(value124.asyncTaskId, 'grsai-direct-2'),
      assert.equal(value124.asyncTaskStatus, 'success'),
      assert.equal(value124.imageUrl, '/output/grsai-direct-2.png'));
  }),
  test('aigenImage task orchestration: RunningHub cancel writes visible interruption message', async () => {
    const targetId55 = 'node-ai-image-rh-cancel-visible';
    let value125 = 0;
    const value126 = {
        signal: { aborted: false },
        abort() {
          this.signal.aborted = true;
        },
      },
      {
        proto: proto55,
        ctx: ctx55,
        state: state24,
      } = createTestContext({
        targetId: targetId55,
        nodeData: {
          id: targetId55,
          model: 'runninghub/2041177685895946242',
          provider: 'runninghubwf',
          generationStartTime: 1000,
          rhTaskStartedAt: 1000,
          rhTaskId: 'rh-cancel-visible',
          rhTaskStatus: 'running',
          rhTaskUseOpenapiQuery: true,
          isGenerating: true,
          jobStatus: 'running',
        },
        apiImpl: {
          cancelRunningHubWorkflowTask: async ({ apiKey: apiKey, taskId: taskId }) => {
            return (
              assert.equal(apiKey, 'k_rh'),
              assert.equal(taskId, 'rh-cancel-visible'),
              { code: 0, msg: 'cancelled by user' }
            );
          },
        },
        stopLoadingImpl: () => {
          value125 += 1;
        },
      });
    ((ctx55._isGenerating = true),
      (ctx55._rhApiKey = 'k_rh'),
      (ctx55._rhTaskId = 'rh-cancel-visible'),
      (ctx55._rhAbortController = value126),
      (ctx55.btnEl = createButtonStub()),
      (ctx55._updateSubmitButtonState = () => {}),
      await proto55._cancelRunningHubWorkflowTask.call(ctx55));
    const value127 = state24.nodes[targetId55];
    (assert.equal(value127.isGenerating, false),
      assert.equal(value127.jobStatus, 'cancelled'),
      assert.equal(value127.rhTaskStatus, 'cancelled'),
      assert.equal(value127.rhStatusMessage, 'cancelled by user'),
      assert.equal(value127.rhStatusCode, 0),
      assert.equal(value127.rhTaskRecovering, false),
      assert.equal(value126.signal.aborted, true),
      assert.equal(value125, 1),
      assert.equal(ctx55._isGenerating, false),
      assert.doesNotMatch(ctx55.btnEl.innerHTML, /animation:spin/));
  }),
  test('aigenImage task orchestration: unmount aborts local generation polling', () => {
    const targetId56 = 'node-ai-image-unmount-preserves-task',
      value128 = {
        signal: { aborted: false },
        abort() {
          this.signal.aborted = true;
        },
      },
      { proto: proto56, ctx: ctx56 } = createTestContext({
        targetId: targetId56,
        nodeData: {
          id: targetId56,
          model: 'runninghub/2041177685895946242',
          provider: 'runninghubwf',
          isGenerating: true,
          jobStatus: 'running',
        },
      });
    ((ctx56._rhAbortController = value128),
      proto56.unmount.call(ctx56),
      assert.equal(value128.signal.aborted, true),
      assert.equal(ctx56._rhAbortController, null));
  }),
  test('aigenImage task orchestration: RunningHub NanoBanana 自适应无参考图时按显示区 1600x900 映射 16:9', async () => {
    const targetId57 = 'node-ai-image-rh-nano-1',
      { proto: proto57, ctx: ctx57 } = createTestContext({
        targetId: targetId57,
        nodeData: {
          id: targetId57,
          model: 'runninghub-model/rhart-image-v1',
          provider: 'runninghub',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
          width: 1600,
          height: 900,
        },
        nodes: {},
        incomingEdges: [],
      }),
      value129 = await proto57._buildPayload.call(ctx57);
    (assert.equal(value129.provider, 'runninghub'), assert.equal(value129.aspectRatio, '16:9'));
  }),
  test('aigenImage task orchestration: RunningHub NanoBanana 自适应无参考图时非标准 1700x900 就近映射 16:9', async () => {
    const targetId58 = 'node-ai-image-rh-nano-2',
      { proto: proto58, ctx: ctx58 } = createTestContext({
        targetId: targetId58,
        nodeData: {
          id: targetId58,
          model: 'runninghub-model/rhart-image-v1-official',
          provider: 'runninghub',
          aspectRatio: 'auto',
          imageSize: '2K',
          batchSize: 1,
          width: 1700,
          height: 900,
        },
        nodes: {},
        incomingEdges: [],
      }),
      value130 = await proto58._buildPayload.call(ctx58);
    (assert.equal(value130.provider, 'runninghub'), assert.equal(value130.aspectRatio, '16:9'));
  }),
  test('aigenImage task orchestration: RunningHub GPT image 2 official 使用扩展比例', async () => {
    const targetId59 = 'node-ai-image-rh-gpt2-official',
      { proto: proto59, ctx: ctx59 } = createTestContext({
        targetId: targetId59,
        nodeData: {
          id: targetId59,
          model: 'runninghub-model/rhart-image-g-2-official',
          provider: 'runninghub',
          aspectRatio: '1:8',
          imageSize: '4K',
          batchSize: 1,
          width: 900,
          height: 1700,
        },
        nodes: {},
        incomingEdges: [],
      }),
      value131 = await proto59._buildPayload.call(ctx59);
    (assert.equal(value131.provider, 'runninghub'),
      assert.equal(value131.model, 'runninghub-model/rhart-image-g-2-official'),
      assert.equal(value131.aspectRatio, '9:21'));
  }),
  test('aigenImage task orchestration: RunningHub GPT image 2 official 保留 1K', async () => {
    const targetId60 = 'node-ai-image-rh-gpt2-official-1k',
      { proto: proto60, ctx: ctx60 } = createTestContext({
        targetId: targetId60,
        nodeData: {
          id: targetId60,
          model: 'runninghub-model/rhart-image-g-2-official',
          provider: 'runninghub',
          aspectRatio: '1:1',
          imageSize: '1K',
          batchSize: 1,
          width: 900,
          height: 900,
        },
        nodes: {},
        incomingEdges: [],
      }),
      value132 = await proto60._buildPayload.call(ctx60);
    (assert.equal(value132.provider, 'runninghub'),
      assert.equal(value132.model, 'runninghub-model/rhart-image-g-2-official'),
      assert.equal(value132.imageSize, '1K'),
      assert.equal(value132.aspectRatio, '1:1'));
  }),
  test('aigenImage task orchestration: 非 NanoBanana 模型自适应无参考图按显示区域映射', async () => {
    const targetId61 = 'node-ai-image-non-nano-1',
      { proto: proto61, ctx: ctx61 } = createTestContext({
        targetId: targetId61,
        nodeData: {
          id: targetId61,
          model: 'ppio/seedream-5.0-lite',
          provider: 'ppio',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
          width: 1700,
          height: 900,
        },
        nodes: {},
        incomingEdges: [],
      }),
      value133 = await proto61._buildPayload.call(ctx61);
    (assert.equal(value133.provider, 'ppio'), assert.equal(value133.aspectRatio, '16:9'));
  }),
  test('aigenImage task orchestration: _buildResumePayload 按模型前缀推断 provider 与 key', async () => {
    const value134 = {
        runninghub: { apiKey: 'k_runninghub', modelApiKey: 'k_runninghub_model' },
        runninghubwf: { apiKey: 'k_runninghub_wf' },
        dreamina: { apiKey: 'k_dreamina' },
        ppio: { apiKey: 'k_ppio' },
        apimart: { apiKey: 'k_apimart' },
        grsai: { apiKey: 'k_grsai' },
      },
      value135 = [
        {
          name: 'runninghub-model 使用 modelApiKey',
          model: 'runninghub-model/rhart-image-v1',
          expectedProvider: 'runninghub',
          expectedApiKey: 'k_runninghub_model',
        },
        {
          name: 'runninghub 工作流使用 workflow apiKey',
          model: 'runninghub/2041177685895946242',
          expectedProvider: 'runninghubwf',
          expectedApiKey: 'k_runninghub_wf',
          isWorkflow: true,
        },
        {
          name: 'Dreamina manifest 模型按 provider 执行',
          model: 'dreamina/4.5',
          expectedProvider: 'dreamina',
          expectedApiKey: 'k_dreamina',
        },
        {
          name: 'PPIO 模型推断为 ppio',
          model: 'ppio/seedream-5.0-lite',
          expectedProvider: 'ppio',
          expectedApiKey: 'k_ppio',
        },
        {
          name: 'APImart 模型推断为 apimart',
          model: 'apimart/nano-banana-2',
          expectedProvider: 'apimart',
          expectedApiKey: 'k_apimart',
        },
        {
          name: '裸模型默认走 grsai',
          model: 'nano-banana-pro-vt',
          expectedProvider: 'grsai',
          expectedApiKey: 'k_grsai',
        },
      ];
    for (const model3 of value135) {
      const { proto: proto62, ctx: ctx62 } = createTestContext({
          targetId: 'node-ai-image-model-resume-' + model3.expectedProvider,
          nodeData: {
            id: 'node-ai-image-model-resume-' + model3.expectedProvider,
            model: model3.model,
            provider: '',
            imageSize: '2K',
            batchSize: 1,
          },
          getProviderConfigImpl: (value136) => value134[value136] || {},
          isRunninghubWorkflowModelImpl: () => model3.isWorkflow === true,
        }),
        value137 = await proto62._buildResumePayload.call(ctx62, ctx62._data);
      (assert.equal(value137.provider, model3.expectedProvider, model3.name),
        assert.equal(value137.apiKey, model3.expectedApiKey, model3.name),
        assert.equal(value137.model, model3.expectedModel || model3.model, model3.name));
    }
  }),
  test('aigenImage task orchestration: RunningHub model API payload does not use workflow key', async () => {
    const { proto: proto63, ctx: ctx63 } = createTestContext({
        targetId: 'node-ai-image-runninghub-model-no-key-fallback',
        nodeData: {
          id: 'node-ai-image-runninghub-model-no-key-fallback',
          model: 'runninghub-model/rhart-image-v1',
          provider: 'runninghub',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        promptText: 'prompt',
        getProviderConfigImpl: (value138) =>
          value138 === 'runninghub' ? { apiKey: 'k_runninghub_workflow_only' } : {},
      }),
      value139 = await proto63._buildPayload.call(ctx63);
    (assert.equal(value139.provider, 'runninghub'), assert.equal(value139.apiKey, ''));
  }),
  test('aigenImage task orchestration: 模型族恢复分类稳定', () => {
    const { proto: proto64, ctx: ctx64 } = createTestContext({
      targetId: 'node-ai-image-recovery-matrix',
      nodeData: {
        id: 'node-ai-image-recovery-matrix',
        model: 'runninghub-model/rhart-image-v1',
        provider: 'runninghub',
        imageSize: '2K',
        batchSize: 1,
      },
      isRunninghubWorkflowModelImpl: (value140) => String(value140 || '').startsWith('runninghub/'),
    });
    (assert.equal(
      proto64._isRunningHubRecoverableRunningTask.call(ctx64, {
        model: 'runninghub-model/rhart-image-v1',
        provider: 'runninghub',
        rhTaskId: 'rh-task-1',
        rhTaskStatus: 'pending',
      }),
      true,
    ),
      assert.equal(
        proto64._isRunningHubRecoverableRunningTask.call(ctx64, {
          model: 'runninghub/2041177685895946242',
          provider: '',
          rhTaskId: 'rh-task-2',
          rhTaskStatus: 'RUNNING',
        }),
        true,
      ),
      assert.equal(
        proto64._isRunningHubRecoverableRunningTask.call(ctx64, {
          model: 'runninghub-model/rhart-image-v1',
          provider: 'runninghub',
          rhTaskId: 'rh-task-3',
          rhTaskStatus: 'success',
        }),
        false,
      ),
      assert.equal(
        proto64._isDreaminaRecoverableRunningTask.call(ctx64, {
          model: 'dreamina/4.5',
          provider: 'dreamina',
          dreaminaSubmitId: 'dm-task-1',
          dreaminaTaskStatus: 'pending',
          dreaminaTaskPhase: 'generating',
        }),
        true,
      ),
      assert.equal(
        proto64._isDreaminaRecoverableRunningTask.call(ctx64, {
          model: 'dreamina/4.5',
          provider: 'dreamina',
          dreaminaSubmitId: 'dm-task-2',
          dreaminaTaskStatus: 'success',
          dreaminaTaskPhase: 'done',
        }),
        false,
      ),
      assert.equal(
        proto64._isDreaminaRecoverableRunningTask.call(ctx64, {
          model: 'dreamina/4.5',
          provider: 'dreamina',
          dreaminaSubmitId: 'dm-task-error',
          jobStatus: 'error',
          dreaminaTaskStatus: 'pending',
          dreaminaTaskPhase: 'generating',
        }),
        false,
      ),
      assert.equal(
        proto64._isDreaminaRecoverableRunningTask.call(ctx64, {
          model: 'dreamina/4.5',
          provider: 'dreamina',
          dreaminaSubmitId: 'dm-task-status-error',
          dreaminaTaskStatus: 'error',
          dreaminaTaskPhase: 'generating',
        }),
        false,
      ),
      assert.equal(
        proto64._isAsyncRecoverableRunningTask.call(ctx64, {
          model: 'ppio/seedream-5.0-lite',
          asyncTaskProvider: 'ppio',
          asyncTaskKind: 'image',
          asyncTaskId: 'async-task-1',
          asyncTaskStatus: 'running',
        }),
        true,
      ),
      assert.equal(
        proto64._isAsyncRecoverableRunningTask.call(ctx64, {
          model: 'apimart/flux-kontext-pro',
          asyncTaskProvider: 'apimart',
          asyncTaskKind: 'image',
          asyncTaskId: 'async-task-2',
          asyncTaskStatus: 'submitted',
        }),
        true,
      ),
      assert.equal(
        proto64._isAsyncRecoverableRunningTask.call(ctx64, {
          model: 'runninghub-model/rhart-image-v1',
          asyncTaskProvider: 'runninghub',
          asyncTaskKind: 'image',
          asyncTaskId: 'async-task-3',
          asyncTaskStatus: 'running',
        }),
        false,
      ),
      assert.equal(
        proto64._isAsyncRecoverableRunningTask.call(ctx64, {
          model: 'grsai/seedream-4.0',
          asyncTaskProvider: 'grsai',
          asyncTaskKind: 'image',
          asyncTaskId: 'async-task-4',
          asyncTaskStatus: 'running',
        }),
        true,
      ),
      assert.equal(
        proto64._isAsyncRecoverableRunningTask.call(ctx64, {
          model: 'ppio/seedream-5.0-lite',
          asyncTaskProvider: 'ppio',
          asyncTaskKind: 'video',
          asyncTaskId: 'async-task-5',
          asyncTaskStatus: 'running',
        }),
        false,
      ));
  }),
  test('aigenImage task orchestration: RunningHub 工作流模型可空提示词生成', async () => {
    const targetId62 = 'node-ai-image-rh-workflow-empty-prompt',
      value141 = { runninghubwf: { apiKey: 'k_runninghub_wf' } },
      { proto: proto65, ctx: ctx65 } = createTestContext({
        targetId: targetId62,
        nodeData: {
          id: targetId62,
          model: 'runninghub/2050306122774532097',
          provider: '',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        nodes: {
          'node-rh-workflow-ref': {
            id: 'node-rh-workflow-ref',
            type: 'source-image',
            originalLocalPath: 'data/uploads/ref.png',
          },
        },
        incomingEdges: [
          { id: 'edge-rh-workflow-ref', sourceId: 'node-rh-workflow-ref', targetId: targetId62, refSlot: '' },
        ],
        promptText: '',
        getProviderConfigImpl: (value142) => value141[value142] || {},
        isRunninghubWorkflowModelImpl: (value143) => value143 === 'runninghub/2050306122774532097',
      }),
      value144 = await proto65._buildPayload.call(ctx65);
    (assert.ok(value144),
      assert.equal(value144.provider, 'runninghubwf'),
      assert.equal(value144.apiKey, 'k_runninghub_wf'),
      assert.equal(value144.prompt, ''));
  }),
  test('aigenImage task orchestration: Qwen image edit requires at least one reference image', async () => {
    const targetId63 = 'node-ai-image-qwen-edit-no-ref',
      value145 = globalThis.window.showToast,
      list7 = [];
    globalThis.window.showToast = (message3, type3) => {
      list7.push({ message: message3, type: type3 });
    };
    try {
      const { proto: proto66, ctx: ctx66 } = createTestContext({
          targetId: targetId63,
          nodeData: {
            id: targetId63,
            model: 'runninghub/2050306122774532097',
            provider: 'runninghubwf',
            aspectRatio: '16:9',
            imageSize: '2K',
            batchSize: 1,
          },
          promptText: 'edit',
          incomingEdges: [],
          isRunninghubWorkflowModelImpl: (value146) => String(value146 || '').startsWith('runninghub/'),
        }),
        value147 = await proto66._buildPayload.call(ctx66);
      (assert.equal(value147, null),
        assert.deepEqual(list7, [{ message: '请先添加至少一张参考图再生成', type: 'warn' }]));
    } finally {
      globalThis.window.showToast = value145;
    }
  }),
  test('aigenImage task orchestration: Qwen image edit reads schema params and normalizes unsupported 4K size', async () => {
    const targetId64 = 'node-ai-image-qwen-edit-defaults',
      incomingEdges2 = ['qwen-ref-1', 'qwen-ref-2', 'qwen-ref-3', 'qwen-ref-4'],
      nodes2 = Object.fromEntries(
        incomingEdges2.map((id27, value148) => [
          id27,
          {
            id: id27,
            type: 'source-image',
            originalLocalPath: 'data/uploads/qwen-' + (value148 + 1) + '.png',
            width: 1600,
            height: 900,
          },
        ]),
      ),
      value149 = { runninghubwf: { apiKey: 'k_runninghub_wf' } },
      { proto: proto67, ctx: ctx67 } = createTestContext({
        targetId: targetId64,
        nodeData: {
          id: targetId64,
          model: 'runninghub/2050306122774532097',
          provider: 'runninghubwf',
          aspectRatio: '16:9',
          batchSize: 4,
          generationParams: {
            batchSize: 4,
            imageSize: '4K',
            rhInstanceType: 'plus',
            rhQwenEditMode: 'qwen2509',
            rhQwenFirstImageMode: 'depth',
          },
        },
        nodes: nodes2,
        incomingEdges: incomingEdges2.map((sourceId, value150) => ({
          id: 'edge-qwen-' + (value150 + 1),
          sourceId: sourceId,
          targetId: targetId64,
        })),
        promptText: 'keep identity',
        getProviderConfigImpl: (value151) => value149[value151] || {},
        isRunninghubWorkflowModelImpl: (value152) => String(value152 || '').startsWith('runninghub/'),
      }),
      value153 = await proto67._buildPayload.call(ctx67);
    (assert.ok(value153),
      assert.equal(value153.provider, 'runninghubwf'),
      assert.equal(value153.model, 'runninghub/2050306122774532097'),
      assert.equal(value153.apiKey, 'k_runninghub_wf'),
      assert.equal(value153.prompt, 'keep identity'),
      assert.equal(value153.imageSize, '2K'),
      assert.equal(value153.aspectRatio, '16:9'),
      assert.equal(value153.batchSize, 1),
      assert.equal(value153.ratioCapability, 'dimensions'),
      assert.equal(value153.rhInstanceType, 'plus'),
      assert.equal(value153.rhQwenEditMode, 'qwen2509'),
      assert.equal(value153.rhQwenFirstImageMode, 'depth'),
      assert.deepEqual(value153.inputUrls, [
        '/data/uploads/qwen-1.png',
        '/data/uploads/qwen-2.png',
        '/data/uploads/qwen-3.png',
      ]));
  }),
  test('aigenImage task orchestration: GRSAI NanobananaPRO legacy VIP/4K uses supported payload', async () => {
    const run3 = async ({
      imageSize: imageSize,
      model: model4,
      expectedModel: expectedModel = model4,
      expectedMode: expectedMode = 'vip',
      expectedImageSize: expectedImageSize = '2K',
    }) => {
      const targetId65 = 'node-ai-image-nb-pro-vip-' + imageSize + '-' + model4,
        { proto: proto68, ctx: ctx68 } = createTestContext({
          targetId: targetId65,
          nodeData: {
            id: targetId65,
            model: model4,
            provider: 'grsai',
            aspectRatio: '1:1',
            imageSize: imageSize,
            batchSize: 1,
          },
        }),
        value154 = await proto68._buildPayload.call(ctx68),
        value155 = await proto68._buildResumePayload.call(ctx68, ctx68._data);
      (assert.equal(value154.model, expectedModel),
        assert.equal(value155.model, expectedModel),
        assert.equal(value154.provider, 'grsai'),
        assert.equal(value155.provider, 'grsai'),
        assert.equal(value154.mode, expectedMode),
        assert.equal(value154.imageSize, expectedImageSize),
        assert.equal(Object.prototype.hasOwnProperty.call(value155, 'mode'), false));
    };
    (await run3({ imageSize: '2K', model: 'nano-banana-pro-vip' }),
      await run3({ imageSize: '4K', model: 'nano-banana-pro-vip' }),
      await run3({ imageSize: '2K', model: 'nano-banana-pro-4k-vip', expectedImageSize: '4K' }));
  }),
  test('aigenImage task orchestration: GRSAI Nanobanana2 CL keeps CL and disables 4K payload', async () => {
    const run4 = async ({
      imageSize: imageSize2,
      model: model5,
      expectedModel: expectedModel = model5,
      expectedMode: expectedMode = 'cl',
      expectedImageSize: expectedImageSize = '2K',
    }) => {
      const targetId66 = 'node-ai-image-nb2-cl-' + imageSize2 + '-' + model5,
        { proto: proto69, ctx: ctx69 } = createTestContext({
          targetId: targetId66,
          nodeData: {
            id: targetId66,
            model: model5,
            provider: 'grsai',
            aspectRatio: '1:1',
            imageSize: imageSize2,
            batchSize: 1,
          },
        }),
        value156 = await proto69._buildPayload.call(ctx69),
        value157 = await proto69._buildResumePayload.call(ctx69, ctx69._data);
      (assert.equal(value156.model, expectedModel),
        assert.equal(value157.model, expectedModel),
        assert.equal(value156.provider, 'grsai'),
        assert.equal(value157.provider, 'grsai'),
        assert.equal(value156.mode, expectedMode),
        assert.equal(value156.imageSize, expectedImageSize),
        assert.equal(Object.prototype.hasOwnProperty.call(value157, 'mode'), false));
    };
    (await run4({ imageSize: '2K', model: 'nano-banana-2-cl' }),
      await run4({ imageSize: '4K', model: 'nano-banana-2-cl' }),
      await run4({ imageSize: '2K', model: 'nano-banana-2-4k-cl', expectedImageSize: '4K' }));
  }),
  test('aigenImage task orchestration: manifest GRSAI nano-banana-2 passes mode selector and normalizes 4K', async () => {
    const run5 = async ({
      imageSize: imageSize3,
      mode: mode,
      expectedMode: expectedMode = mode,
      expectedImageSize: expectedImageSize = imageSize3,
    }) => {
      const targetId67 = 'node-ai-image-grsai-manifest-mode-' + imageSize3 + '-' + mode,
        { proto: proto70, ctx: ctx70 } = createTestContext({
          targetId: targetId67,
          nodeData: {
            id: targetId67,
            model: 'nano-banana-2',
            provider: 'grsai',
            generationParams: { imageSize: imageSize3, aspectRatio: '1:1', mode: mode },
            batchSize: 1,
          },
        }),
        value158 = await proto70._buildPayload.call(ctx70),
        value159 = await proto70._buildResumePayload.call(ctx70, ctx70._data);
      (assert.equal(value158.model, 'nano-banana-2'),
        assert.equal(value159.model, 'nano-banana-2'),
        assert.equal(value158.provider, 'grsai'),
        assert.equal(value159.provider, 'grsai'),
        assert.equal(value158.mode, expectedMode),
        assert.equal(value158.imageSize, expectedImageSize),
        assert.equal(Object.prototype.hasOwnProperty.call(value159, 'mode'), false));
    };
    (await run5({ imageSize: '2K', mode: 'normal' }),
      await run5({ imageSize: '2K', mode: 'cl' }),
      await run5({ imageSize: '4K', mode: 'cl' }),
      await run5({ imageSize: '4K', mode: 'normal', expectedImageSize: '2K' }));
  }),
  test('aigenImage task orchestration: manifest GRSAI pro modes keep VT/CL/VIP and normalize 4K', async () => {
    const run6 = async ({
      imageSize: imageSize4,
      mode: mode2,
      expectedMode: expectedMode = mode2,
      expectedImageSize: expectedImageSize = imageSize4,
    }) => {
      const targetId68 = 'node-ai-image-grsai-pro-manifest-mode-' + imageSize4 + '-' + mode2,
        { proto: proto71, ctx: ctx71 } = createTestContext({
          targetId: targetId68,
          nodeData: {
            id: targetId68,
            model: 'nano-banana-pro',
            provider: 'grsai',
            generationParams: { imageSize: imageSize4, aspectRatio: '1:1', mode: mode2 },
            batchSize: 1,
          },
        }),
        value160 = await proto71._buildPayload.call(ctx71),
        value161 = await proto71._buildResumePayload.call(ctx71, ctx71._data);
      (assert.equal(value160.model, 'nano-banana-pro'),
        assert.equal(value161.model, 'nano-banana-pro'),
        assert.equal(value160.provider, 'grsai'),
        assert.equal(value161.provider, 'grsai'),
        assert.equal(value160.mode, expectedMode),
        assert.equal(value160.imageSize, expectedImageSize),
        assert.equal(Object.prototype.hasOwnProperty.call(value161, 'mode'), false));
    };
    (await run6({ imageSize: '2K', mode: 'normal' }),
      await run6({ imageSize: '2K', mode: 'vt' }),
      await run6({ imageSize: '2K', mode: 'cl' }),
      await run6({ imageSize: '2K', mode: 'vip' }),
      await run6({ imageSize: '4K', mode: 'vip' }),
      await run6({ imageSize: '4K', mode: 'normal', expectedImageSize: '2K' }),
      await run6({ imageSize: '4K', mode: 'vt', expectedImageSize: '2K' }),
      await run6({ imageSize: '4K', mode: 'cl', expectedImageSize: '2K' }));
  }),
  test('aigenImage task orchestration: GRSAI nanobanana cleans legacy UI params', async () => {
    const targetId69 = 'node-ai-image-grsai-nano-clean-legacy-params',
      { proto: proto72, ctx: ctx72 } = createTestContext({
        targetId: targetId69,
        nodeData: {
          id: targetId69,
          model: 'nano-banana',
          provider: 'grsai',
          width: 1600,
          height: 900,
          generationParams: { imageSize: '3K', aspectRatio: '自适应', mode: 'normal', batchSize: 1 },
        },
      }),
      value162 = await proto72._buildPayload.call(ctx72);
    (assert.equal(value162.imageSize, '2K'),
      assert.equal(value162.aspectRatio, 'auto'),
      assert.equal(value162.resolvedRatioLabel, 'auto'));
  }),
  test('aigenImage task orchestration: GRSAI GPT image 2 常规模式只保留 1K', async () => {
    for (const { storedModel: storedModel, imageSize: imageSize5 } of [
      { storedModel: 'gpt-image-2', imageSize: '1K' },
      { storedModel: 'gpt-image-2', imageSize: '2K' },
      { storedModel: 'gpt-image-2', imageSize: '4K' },
      { storedModel: 'gpt-image-2', imageSize: undefined },
    ]) {
      const targetId70 = 'node-ai-image-gpt-image-2-1k-' + storedModel + '-' + (imageSize5 || 'default'),
        { proto: proto73, ctx: ctx73 } = createTestContext({
          targetId: targetId70,
          nodeData: {
            id: targetId70,
            model: storedModel,
            provider: 'grsai',
            generationParams: {
              mode: 'normal',
              aspectRatio: '9:21',
              ...(imageSize5 ? { imageSize: imageSize5 } : {}),
              batchSize: 1,
            },
          },
        }),
        value163 = await proto73._buildPayload.call(ctx73),
        value164 = await proto73._buildResumePayload.call(ctx73, ctx73._data);
      (assert.equal(value163.model, storedModel),
        assert.equal(value164.model, storedModel),
        assert.equal(value163.provider, 'grsai'),
        assert.equal(value164.provider, 'grsai'),
        assert.equal(value163.mode, 'normal'),
        assert.equal(value163.imageSize, '1K'),
        assert.equal(value163.aspectRatio, '9:21'),
        assert.equal(value163.resolvedRatioLabel, '9:21'));
    }
  }),
  test('aigenImage task orchestration: GRSAI GPT image 2 VIP 模式保留全部画质', async () => {
    const run7 = async ({ imageSize: imageSize6, storedModel: storedModel2, aspectRatio: aspectRatio }) => {
      const targetId71 = 'node-ai-image-gpt-image-2-vip-mode-' + imageSize6 + '-' + storedModel2,
        { proto: proto74, ctx: ctx74 } = createTestContext({
          targetId: targetId71,
          nodeData: {
            id: targetId71,
            model: storedModel2,
            provider: 'grsai',
            generationParams: { mode: 'vip', aspectRatio: aspectRatio, imageSize: imageSize6, batchSize: 1 },
          },
        }),
        value165 = await proto74._buildPayload.call(ctx74),
        value166 = await proto74._buildResumePayload.call(ctx74, ctx74._data);
      (assert.equal(value165.model, storedModel2),
        assert.equal(value166.model, storedModel2),
        assert.equal(value165.provider, 'grsai'),
        assert.equal(value165.mode, 'vip'),
        assert.equal(value165.imageSize, imageSize6),
        assert.equal(value165.aspectRatio, aspectRatio),
        assert.equal(value165.resolvedRatioLabel, aspectRatio));
    };
    (await run7({ imageSize: '1K', storedModel: 'gpt-image-2', aspectRatio: '9:16' }),
      await run7({ imageSize: '2K', storedModel: 'gpt-image-2', aspectRatio: '9:21' }),
      await run7({ imageSize: '4K', storedModel: 'gpt-image-2', aspectRatio: '2:1' }),
      await run7({ imageSize: '4K', storedModel: 'gpt-image-2-vip', aspectRatio: '9:21' }));
  }),
  test('aigenImage task orchestration: GRSAI GPT image 2 4K 保留官方支持比例', async () => {
    const targetId72 = 'node-ai-image-gpt-image-2-4k-fallback',
      { proto: proto75, ctx: ctx75 } = createTestContext({
        targetId: targetId72,
        nodeData: {
          id: targetId72,
          model: 'gpt-image-2',
          provider: 'grsai',
          generationParams: { mode: 'vip', aspectRatio: '1:1', imageSize: '4K', batchSize: 1 },
          width: 500,
          height: 500,
        },
      }),
      value167 = await proto75._buildPayload.call(ctx75);
    (assert.equal(value167.model, 'gpt-image-2'),
      assert.equal(value167.provider, 'grsai'),
      assert.equal(value167.mode, 'vip'),
      assert.equal(value167.imageSize, '4K'),
      assert.equal(value167.aspectRatio, '1:1'),
      assert.equal(value167.resolvedRatioLabel, '1:1'));
  }),
  test('aigenImage task orchestration: APIMart Seedream 5 lite 保留 3K 和支持比例', async () => {
    const targetId73 = 'node-ai-image-apimart-seedream-5-lite',
      { proto: proto76, ctx: ctx76 } = createTestContext({
        targetId: targetId73,
        nodeData: {
          id: targetId73,
          model: 'apimart/seedream-5.0-lite',
          provider: 'apimart',
          aspectRatio: '21:9',
          imageSize: '3K',
          generationParams: { aspectRatio: '21:9', imageSize: '3K' },
          batchSize: 4,
        },
      }),
      value168 = await proto76._buildPayload.call(ctx76);
    (assert.equal(value168.provider, 'apimart'),
      assert.equal(value168.model, 'apimart/seedream-5.0-lite'),
      assert.equal(value168.imageSize, '3K'),
      assert.equal(value168.aspectRatio, '21:9'),
      assert.equal(value168.resolvedRatioLabel, '21:9'),
      assert.equal(value168.batchSize, 4));
  }),
  test('aigenImage task orchestration: APIMart Qwen image 2.0 使用文档比例和生成数量', async () => {
    const targetId74 = 'node-ai-image-apimart-qwen-image',
      { proto: proto77, ctx: ctx77 } = createTestContext({
        targetId: targetId74,
        nodeData: {
          id: targetId74,
          model: 'apimart/qwen-image-2.0',
          provider: 'apimart',
          aspectRatio: '自适应',
          imageSize: '3K',
          generationParams: { mode: 'pro', aspectRatio: '自适应', imageSize: '3K', batchSize: 6 },
          width: 1600,
          height: 900,
          batchSize: 1,
        },
      }),
      value169 = await proto77._buildPayload.call(ctx77);
    (assert.equal(value169.provider, 'apimart'),
      assert.equal(value169.model, 'apimart/qwen-image-2.0'),
      assert.equal(value169.mode, 'pro'),
      assert.equal(value169.imageSize, '1K'),
      assert.equal(value169.aspectRatio, '16:9'),
      assert.equal(value169.resolvedRatioLabel, '16:9'),
      assert.equal(value169.batchSize, 6));
  }),
  test('aigenImage task orchestration: APIMart Z-Image-Turbo 自适应转为真实比例并透传智能改写', async () => {
    const targetId75 = 'node-ai-image-apimart-z-image-turbo',
      { proto: proto78, ctx: ctx78 } = createTestContext({
        targetId: targetId75,
        nodeData: {
          id: targetId75,
          model: 'apimart/z-image-turbo',
          provider: 'apimart',
          aspectRatio: '自适应',
          imageSize: '3K',
          generationParams: { aspectRatio: '自适应', imageSize: '3K', prompt_extend: true, batchSize: 4 },
          width: 1600,
          height: 900,
          batchSize: 1,
        },
      }),
      value170 = await proto78._buildPayload.call(ctx78);
    (assert.equal(value170.provider, 'apimart'),
      assert.equal(value170.model, 'apimart/z-image-turbo'),
      assert.equal(value170.imageSize, '1K'),
      assert.equal(value170.aspectRatio, '16:9'),
      assert.equal(value170.resolvedRatioLabel, '16:9'),
      assert.equal(value170.prompt_extend, true),
      assert.equal(value170.batchSize, 4));
  }),
  test('aigenImage task orchestration: APIMart Wan 2.7 收集图片入参并按入参比例自适应', async () => {
    const targetId76 = 'node-ai-image-apimart-wan',
      id28 = 'node-ref-apimart-wan',
      { proto: proto79, ctx: ctx79 } = createTestContext({
        targetId: targetId76,
        nodeData: {
          id: targetId76,
          model: 'apimart/wan2.7-image',
          provider: 'apimart',
          aspectRatio: '自适应',
          imageSize: '4K',
          generationParams: {
            mode: 'pro',
            aspectRatio: '自适应',
            imageSize: '4K',
            thinking_mode: false,
            batchSize: 4,
          },
          width: 1600,
          height: 900,
          batchSize: 1,
        },
        nodes: {
          [id28]: {
            id: id28,
            type: 'source-image',
            imageUrl: 'https://cdn.apimart.ai/ref-wan.png',
            width: 900,
            height: 1600,
          },
        },
        incomingEdges: [{ id: 'edge-apimart-wan', sourceId: id28, targetId: targetId76, refSlot: '' }],
      }),
      value171 = await proto79._buildPayload.call(ctx79);
    (assert.equal(value171.provider, 'apimart'),
      assert.equal(value171.model, 'apimart/wan2.7-image'),
      assert.equal(value171.mode, 'pro'),
      assert.equal(value171.imageSize, '4K'),
      assert.equal(value171.aspectRatio, '9:16'),
      assert.equal(value171.resolvedRatioLabel, '9:16'),
      assert.equal(value171.thinking_mode, false),
      assert.equal(value171.batchSize, 4),
      assert.deepEqual(value171.inputUrls, ['https://cdn.apimart.ai/ref-wan.png']));
  }),
  test('aigenImage task orchestration: APIMart Seedream 有参考图时自适应透传 API auto', async () => {
    const targetId77 = 'node-ai-image-apimart-seedream-auto',
      id29 = 'node-ref-apimart-seedream-auto',
      { proto: proto80, ctx: ctx80 } = createTestContext({
        targetId: targetId77,
        nodeData: {
          id: targetId77,
          model: 'apimart/seedream-4.0',
          provider: 'apimart',
          aspectRatio: 'auto',
          imageSize: '2K',
          generationParams: { aspectRatio: 'auto', imageSize: '2K' },
          batchSize: 1,
        },
        nodes: {
          [id29]: {
            id: id29,
            type: 'source-image',
            imageUrl: 'https://img.example.com/seedream-ref.png',
            width: 1600,
            height: 900,
          },
        },
        incomingEdges: [
          { id: 'edge-apimart-seedream-auto', sourceId: id29, targetId: targetId77, refSlot: '' },
        ],
      }),
      value172 = await proto80._buildPayload.call(ctx80);
    (assert.equal(value172.provider, 'apimart'),
      assert.equal(value172.model, 'apimart/seedream-4.0'),
      assert.equal(value172.aspectRatio, 'auto'),
      assert.equal(value172.resolvedRatioLabel, 'auto'),
      assert.equal(value172.ratioCapability, 'size'),
      assert.deepEqual(value172.inputUrls, ['https://img.example.com/seedream-ref.png']));
  }),
  test('aigenImage task orchestration: APIMart GPT image 2 透传新增比例', async () => {
    const targetId78 = 'node-ai-image-apimart-gpt-image-2-ratio',
      { proto: proto81, ctx: ctx81 } = createTestContext({
        targetId: targetId78,
        nodeData: {
          id: targetId78,
          model: 'apimart/gpt-image-2',
          provider: 'apimart',
          aspectRatio: '2:1',
          imageSize: '2K',
          generationParams: { mode: 'official', aspectRatio: '2:1', imageSize: '2K', quality: 'high' },
          batchSize: 1,
        },
      }),
      value173 = await proto81._buildPayload.call(ctx81);
    (assert.equal(value173.provider, 'apimart'),
      assert.equal(value173.model, 'apimart/gpt-image-2'),
      assert.equal(value173.mode, 'official'),
      assert.equal(value173.imageSize, '2K'),
      assert.equal(value173.quality, 'high'),
      assert.equal(value173.aspectRatio, '2:1'),
      assert.equal(value173.resolvedRatioLabel, '2:1'));
  }),
  test('aigenImage task orchestration: APIMart GPT image 2 4K 不生成非法比例', async () => {
    const targetId79 = 'node-ai-image-apimart-gpt-image-2-4k',
      { proto: proto82, ctx: ctx82 } = createTestContext({
        targetId: targetId79,
        nodeData: {
          id: targetId79,
          model: 'apimart/gpt-image-2',
          provider: 'apimart',
          aspectRatio: '1:1',
          imageSize: '4K',
          generationParams: { aspectRatio: '1:1', imageSize: '4K' },
          width: 500,
          height: 500,
          batchSize: 1,
        },
      }),
      value174 = await proto82._buildPayload.call(ctx82);
    (assert.equal(value174.imageSize, '4K'),
      assert.equal(value174.aspectRatio, '16:9'),
      assert.equal(value174.resolvedRatioLabel, '16:9'));
  }),
  test('aigenImage task orchestration: APIMart GPT image 2 4K 自适应只解析到可用比例', async () => {
    const targetId80 = 'node-ai-image-apimart-gpt-image-2-4k-auto',
      { proto: proto83, ctx: ctx83 } = createTestContext({
        targetId: targetId80,
        nodeData: {
          id: targetId80,
          model: 'apimart/gpt-image-2',
          provider: 'apimart',
          aspectRatio: '自适应',
          imageSize: '4K',
          generationParams: { aspectRatio: '自适应', imageSize: '4K' },
          width: 500,
          height: 500,
          batchSize: 1,
        },
      }),
      value175 = await proto83._buildPayload.call(ctx83);
    (assert.equal(value175.imageSize, '4K'),
      assert.equal(value175.aspectRatio, '16:9'),
      assert.equal(value175.resolvedRatioLabel, '16:9'));
  }));
