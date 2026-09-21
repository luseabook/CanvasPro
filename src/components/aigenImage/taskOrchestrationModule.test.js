import test from 'node:test';
import assert from 'node:assert/strict';
import { createAIGenerateNodeTaskOrchestrationModule } from './taskOrchestrationModule.js';
import {
  _resetPreviewRuntimeForTests,
  isPreviewNodeLoading,
  stopPreviewNodeLoading,
} from '../../modules/previewMode.js';
import { createFakePreviewContainer, installPreviewDomStubs } from '../../../tests/testPreviewDom.js';
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
function createStore(_0x23e6ce, _0x22775f = []) {
  return {
    getState() {
      return _0x23e6ce;
    },
    getIncomingEdges(_0x280853) {
      return _0x22775f.filter((_0x19d0db) => _0x19d0db.targetId === _0x280853);
    },
    updateNodeData(_0x4a6565, _0x13e050) {
      const _0x283b6e = _0x23e6ce.nodes?.[_0x4a6565] || {};
      _0x23e6ce.nodes[_0x4a6565] = { ..._0x283b6e, ..._0x13e050 };
    },
  };
}
function createPromptTextNode(_0x349bef = '') {
  return { nodeType: Node.TEXT_NODE, textContent: String(_0x349bef || '') };
}
function createPromptElementNode({
  tagName: tagName = 'SPAN',
  className: className = '',
  dataset: dataset = {},
  textContent: textContent = '',
  childNodes: childNodes = [],
} = {}) {
  const _0x5c839b = String(className || '')
    .split(/\s+/)
    .filter(Boolean);
  return {
    nodeType: Node.ELEMENT_NODE,
    tagName: tagName,
    className: className,
    classList: {
      contains(_0x1f1df4) {
        return _0x5c839b.includes(String(_0x1f1df4 || ''));
      },
    },
    dataset: { ...dataset },
    textContent: String(textContent || ''),
    childNodes: Array.isArray(childNodes) ? childNodes : [],
  };
}
function createAssetPromptPillNode(_0x76067a, _0x2b1490, _0x4facf5, _0xf532c3) {
  return createPromptElementNode({
    className: 'ref-pill',
    dataset: {
      label: String(_0x76067a || ''),
      refOrigin: 'asset',
      assetId: String(_0x2b1490 || ''),
      assetIndex: String(_0x4facf5),
      refType: String(_0xf532c3 || ''),
    },
    textContent: String(_0x76067a || ''),
  });
}
function createNodePromptPillNode(_0x10841b, _0x8a9efc, _0x104338 = 'image') {
  return createPromptElementNode({
    className: 'ref-pill',
    dataset: {
      label: String(_0x10841b || ''),
      nodeId: String(_0x8a9efc || ''),
      refType: String(_0x104338 || ''),
    },
    textContent: String(_0x10841b || ''),
  });
}
function collectPromptInnerText(_0xf1dcd3) {
  return (Array.isArray(_0xf1dcd3) ? _0xf1dcd3 : [])
    .map((_0x1a16d6) => {
      const _0x8d2ec = Number(_0x1a16d6?.nodeType);
      if (_0x8d2ec === Node.TEXT_NODE) return String(_0x1a16d6?.textContent || '');
      if (_0x8d2ec !== Node.ELEMENT_NODE) return '';
      if (String(_0x1a16d6?.tagName || '').toUpperCase() === 'BR') return '\n';
      const _0x236c68 = Array.isArray(_0x1a16d6?.childNodes) ? _0x1a16d6.childNodes : [];
      if (_0x236c68.length > 0) return collectPromptInnerText(_0x236c68);
      return String(_0x1a16d6?.textContent || '');
    })
    .join('');
}
function createPromptEl(_0x66b7e6 = 'test prompt') {
  if (Array.isArray(_0x66b7e6)) {
    const _0x315e06 = collectPromptInnerText(_0x66b7e6);
    return { innerText: _0x315e06, textContent: _0x315e06, childNodes: _0x66b7e6 };
  }
  return { innerText: _0x66b7e6, textContent: _0x66b7e6, childNodes: [createPromptTextNode(_0x66b7e6)] };
}
function createButtonStub() {
  const _0x2a6594 = new Set();
  return {
    disabled: false,
    title: '',
    innerHTML: '',
    style: { color: '', cursor: '' },
    _attrs: new Map(),
    classList: {
      add(_0xd0c089) {
        _0x2a6594.add(String(_0xd0c089 || ''));
      },
      remove(_0x4d024d) {
        _0x2a6594.delete(String(_0x4d024d || ''));
      },
      contains(_0x25cd51) {
        return _0x2a6594.has(String(_0x25cd51 || ''));
      },
    },
    setAttribute(_0x35f30c, _0x50b156) {
      this._attrs.set(String(_0x35f30c || ''), String(_0x50b156 || ''));
    },
    removeAttribute(_0x4894c0) {
      this._attrs.delete(String(_0x4894c0 || ''));
    },
  };
}
function createTestContext({
  targetId: _0x463842,
  nodeData: _0x235d21,
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
  const _0x15b2e7 = (_0x1a69ba) => {
      const _0x392ac2 = getModelManifest(_0x1a69ba?.model),
        _0x49c3e5 = Array.isArray(_0x392ac2?.uiSchema?.fields) ? _0x392ac2.uiSchema.fields : [];
      if (!_0x49c3e5.length) return { ..._0x1a69ba };
      const _0x45e693 =
        _0x1a69ba?.generationParams &&
        typeof _0x1a69ba.generationParams === 'object' &&
        !Array.isArray(_0x1a69ba.generationParams)
          ? { ..._0x1a69ba.generationParams }
          : {};
      return (
        _0x49c3e5.forEach((_0x2c5b89) => {
          const _0x53c510 = String(_0x2c5b89?.id || '').trim();
          _0x53c510 &&
            _0x45e693[_0x53c510] === undefined &&
            Object.prototype.hasOwnProperty.call(_0x1a69ba, _0x53c510) &&
            (_0x45e693[_0x53c510] = _0x1a69ba[_0x53c510]);
        }),
        { ..._0x1a69ba, generationParams: _0x45e693 }
      );
    },
    _0x2ea73b = stateOverride || { nodes: { ...nodes, [_0x463842]: _0x15b2e7(_0x235d21) } };
  if (!_0x2ea73b.nodes || typeof _0x2ea73b.nodes !== 'object') _0x2ea73b.nodes = {};
  !_0x2ea73b.nodes?.[_0x463842] && (_0x2ea73b.nodes[_0x463842] = _0x15b2e7(_0x235d21));
  const _0x27e9a9 = storeImpl || createStore(_0x2ea73b, incomingEdges),
    _0x143726 = createAIGenerateNodeTaskOrchestrationModule({
      store: _0x27e9a9,
      getRefKindByNodeType: (_0x19d98d) =>
        _0x19d98d === 'source-image' || _0x19d98d === 'image' || _0x19d98d === 'ai-image'
          ? 'image'
          : _0x19d98d === 'source-text' || _0x19d98d === 'ai-text'
            ? 'text'
            : null,
      getImage: async () => null,
      ensureConfig: ensureConfigImpl,
      getProviderConfig: getProviderConfigImpl,
      api: apiImpl,
      startLoading: startLoadingImpl,
      stopLoading: stopLoadingImpl,
    }),
    _0x54d314 = Object.assign(Object.create(_0x143726), {
      nodeId: _0x463842,
      _data: _0x2ea73b.nodes[_0x463842],
      promptEl: promptEl || createPromptEl(promptText),
      _isRunninghubWorkflowModel(_0xd384da, _0x220fbc) {
        if (typeof isRunninghubWorkflowModelImpl === 'function')
          return isRunninghubWorkflowModelImpl(_0xd384da, _0x220fbc);
        return false;
      },
    });
  return { ctx: _0x54d314, proto: _0x143726, state: _0x2ea73b, store: _0x27e9a9 };
}
(test('aigenImage task orchestration: running RH store state cancels even when local flag is stale', async () => {
  const _0x33c700 = 'node-image-running-store-cancels',
    {
      proto: _0x407f65,
      ctx: _0x2893e5,
      state: _0x1e5801,
    } = createTestContext({
      targetId: _0x33c700,
      nodeData: {
        id: _0x33c700,
        model: 'runninghub/2044874075721441281',
        provider: 'runninghubwf',
        rhTaskId: 'rh-running',
        rhTaskStatus: 'running',
        jobStatus: 'running',
        isGenerating: true,
      },
      isRunninghubWorkflowModelImpl: () => true,
    });
  let _0x5926a8 = 0,
    _0x21c3b6 = 0;
  ((_0x2893e5._isGenerating = false),
    (_0x2893e5._cancelRunningHubWorkflowTask = async () => {
      _0x5926a8 += 1;
    }),
    (_0x2893e5._onGenerate = async () => {
      _0x21c3b6 += 1;
    }),
    (_0x1e5801.nodes[_0x33c700] = {
      ..._0x1e5801.nodes[_0x33c700],
      rhTaskId: 'rh-running',
      rhTaskStatus: 'running',
      jobStatus: 'running',
      isGenerating: true,
    }),
    await _0x407f65._handleGenerateOrCancel.call(_0x2893e5),
    assert.equal(_0x5926a8, 1),
    assert.equal(_0x21c3b6, 0));
}),
  test('aigenImage task orchestration: /预设模板在空输入时回退默认值且不残留占位符', async () => {
    const _0x2c3ffc = 'node-ai-image-template-default-fallback',
      { proto: _0x350dc2, ctx: _0x334ba3 } = createTestContext({
        targetId: _0x2c3ffc,
        nodeData: {
          id: _0x2c3ffc,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        promptText: '',
      }),
      _0x291ae3 = await _0x350dc2._buildPayload.call(_0x334ba3, '故事/描述：{用户输入 || 一段简短剧情}');
    (assert.ok(_0x291ae3),
      assert.equal(_0x291ae3.prompt, '故事/描述：一段简短剧情'),
      assert.equal(_0x291ae3.prompt.includes('{{'), false));
  }),
  test('aigenImage task orchestration: 图像内置对象预设无输入时不生成', async () => {
    const _0x771e1 = globalThis.window.showToast,
      _0x4b6d43 = [];
    globalThis.window.showToast = (_0x31ea5a, _0x15cd91) => {
      _0x4b6d43.push({ message: _0x31ea5a, type: _0x15cd91 });
    };
    try {
      const _0x1ad5f4 = 'node-ai-image-static-template-empty',
        { proto: _0x265777, ctx: _0x45cecb } = createTestContext({
          targetId: _0x1ad5f4,
          nodeData: {
            id: _0x1ad5f4,
            model: 'nano-banana-pro-vt',
            provider: 'grsai',
            aspectRatio: '1:1',
            imageSize: '2K',
            batchSize: 1,
          },
          promptText: '',
        }),
        _0x5257c8 = await _0x265777._buildPayload.call(_0x45cecb, {
          type: 'static',
          text: '故事/描述：{用户输入 || 一段简短剧情}',
          requireInput: true,
          emptyInputMessage: '请输入提示词或添加参考图片',
        });
      (assert.equal(_0x5257c8, null),
        assert.deepEqual(_0x4b6d43, [{ message: '请输入提示词或添加参考图片', type: 'warn' }]));
    } finally {
      globalThis.window.showToast = _0x771e1;
    }
  }),
  test('aigenImage task orchestration: 图像内置对象预设使用连线文本入参', async () => {
    const _0x278721 = 'node-ai-image-static-template-linked-text',
      _0x57177c = 'source-text-for-static-template',
      { proto: _0x1b6fe, ctx: _0x6f1c54 } = createTestContext({
        targetId: _0x278721,
        nodeData: {
          id: _0x278721,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        nodes: { [_0x57177c]: { id: _0x57177c, type: 'ai-text', outputText: '雨夜赛博街区' } },
        incomingEdges: [{ id: 'edge-linked-text-static-template', sourceId: _0x57177c, targetId: _0x278721 }],
        promptText: '',
      }),
      _0x39c64f = await _0x1b6fe._buildPayload.call(_0x6f1c54, {
        type: 'static',
        text: '故事/描述：{用户输入 || 一段简短剧情}',
        requireInput: true,
        emptyInputMessage: '请输入提示词或添加参考图片',
      });
    (assert.ok(_0x39c64f), assert.equal(_0x39c64f.prompt, '故事/描述：雨夜赛博街区'));
  }),
  test('aigenImage task orchestration: /预设模板在有输入时注入用户输入且不残留占位符', async () => {
    const _0xa502de = 'node-ai-image-template-use-user-input',
      { proto: _0x186bcb, ctx: _0x50f0e4 } = createTestContext({
        targetId: _0xa502de,
        nodeData: {
          id: _0xa502de,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        promptText: '夜雨中的街道追逐',
      }),
      _0x2e3217 = await _0x186bcb._buildPayload.call(_0x50f0e4, '故事/描述：{用户输入 || 一段简短剧情}');
    (assert.ok(_0x2e3217),
      assert.equal(_0x2e3217.prompt, '故事/描述：夜雨中的街道追逐'),
      assert.equal(_0x2e3217.prompt.includes('{{'), false));
  }),
  test('aigenImage task orchestration: 开发者模式下 /预设 仅回填最终提示词不直接生成', async () => {
    const _0x397cc1 = globalThis.window.DEV_MODE;
    globalThis.window.DEV_MODE = true;
    try {
      const _0x2d305a = 'node-ai-image-template-dev-preview';
      let _0x439887 = false;
      const {
        proto: _0x5110b3,
        ctx: _0x5679c1,
        state: _0x386929,
      } = createTestContext({
        targetId: _0x2d305a,
        nodeData: {
          id: _0x2d305a,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        promptText: '夜雨中的街道追逐',
        apiImpl: {
          generateImage: async () => {
            return ((_0x439887 = true), { imageUrl: '/output/test.png' });
          },
        },
      });
      (await _0x5110b3._onGenerate.call(_0x5679c1, '故事/描述：{用户输入 || 一段简短剧情}'),
        assert.equal(_0x439887, false),
        assert.equal(_0x386929.nodes[_0x2d305a].prompt, '故事/描述：夜雨中的街道追逐'),
        assert.equal(_0x5679c1.promptEl.innerHTML, '故事/描述：夜雨中的街道追逐'));
    } finally {
      globalThis.window.DEV_MODE = _0x397cc1;
    }
  }),
  test('aigenImage task orchestration: 预览模式下点击生成只启动假加载不发请求', async () => {
    const _0x266bad = globalThis.window.PREVIEW_MODE;
    globalThis.window.PREVIEW_MODE = true;
    try {
      const _0x454a99 = 'node-ai-image-preview-loading';
      let _0x284389 = false;
      const { proto: _0x53d376, ctx: _0x382ff5 } = createTestContext({
        targetId: _0x454a99,
        nodeData: {
          id: _0x454a99,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        apiImpl: {
          generateImage: async () => {
            return ((_0x284389 = true), { imageUrl: '/output/test.png' });
          },
        },
      });
      ((_0x382ff5.previewEl = createFakePreviewContainer()),
        (_0x382ff5.btnEl = createButtonStub()),
        await _0x53d376._onGenerate.call(_0x382ff5),
        assert.equal(_0x284389, false),
        assert.equal(isPreviewNodeLoading(_0x454a99), true),
        assert.equal(_0x382ff5.btnEl.disabled, true),
        assert.match(_0x382ff5.btnEl.innerHTML, /animation:spin/),
        stopPreviewNodeLoading(_0x454a99),
        assert.equal(_0x382ff5.btnEl.disabled, false),
        assert.doesNotMatch(_0x382ff5.btnEl.innerHTML, /animation:spin/));
    } finally {
      globalThis.window.PREVIEW_MODE = _0x266bad;
    }
  }),
  test('aigenImage task orchestration: asset image mentions send type placeholders in prompt order', async () => {
    const _0x2937d3 = 'node-ai-image-asset-mentions';
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
    const { proto: _0x31b53d, ctx: _0x468b11 } = createTestContext({
        targetId: _0x2937d3,
        nodeData: {
          id: _0x2937d3,
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
      _0x32cfcb = await _0x31b53d._buildPayload.call(_0x468b11);
    (assert.equal(_0x32cfcb.prompt, '@图片1 and @图片2'),
      assert.deepEqual(_0x32cfcb.inputUrls, ['/data/assets/person1.png', '/data/assets/person2.png']));
  }),
  test('aigenImage task orchestration: thumbnail reorder keeps inputUrls aligned with image labels', async () => {
    const _0xf1d53f = 'node-ai-image-reordered-thumb-labels',
      _0x5f5720 = 'node-ref-scene-image',
      _0x55c55a = 'node-ref-woman-image',
      { proto: _0x5cd927, ctx: _0x4b9473 } = createTestContext({
        targetId: _0xf1d53f,
        nodeData: {
          id: _0xf1d53f,
          model: 'apimart/gpt-image-2',
          provider: 'apimart',
          aspectRatio: '1:1',
          imageSize: '1K',
          batchSize: 1,
          generationParams: { mode: 'official', aspectRatio: '1:1', imageSize: '1K' },
        },
        nodes: {
          [_0x5f5720]: {
            id: _0x5f5720,
            type: 'source-image',
            originalLocalPath: 'data/uploads/scene.png',
            width: 0x640,
            height: 0x384,
          },
          [_0x55c55a]: {
            id: _0x55c55a,
            type: 'source-image',
            originalLocalPath: 'data/uploads/woman.png',
            width: 0x384,
            height: 0x640,
          },
        },
        incomingEdges: [
          { id: 'edge-scene-first-after-drag', sourceId: _0x5f5720, targetId: _0xf1d53f },
          { id: 'edge-woman-second-after-drag', sourceId: _0x55c55a, targetId: _0xf1d53f },
        ],
        promptEl: createPromptEl([
          createNodePromptPillNode('@图片2', _0x55c55a, 'image'),
          createPromptTextNode(' 的女人替换到 '),
          createNodePromptPillNode('@图片1', _0x5f5720, 'image'),
          createPromptTextNode(' 的场景里面'),
        ]),
      }),
      _0x2a4e44 = await _0x5cd927._buildPayload.call(_0x4b9473);
    (assert.equal(_0x2a4e44.prompt, '@图片2 的女人替换到 @图片1 的场景里面'),
      assert.deepEqual(_0x2a4e44.inputUrls, ['/data/uploads/scene.png', '/data/uploads/woman.png']));
  }),
  test('aigenImage task orchestration: RunningHub workflow payload reads hidden image asset refs', async () => {
    const _0x291f30 = 'node-ai-image-hidden-asset';
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
    const { proto: _0x54a1bf, ctx: _0x1dbb70 } = createTestContext({
        targetId: _0x291f30,
        nodeData: {
          id: _0x291f30,
          model: 'runninghub/1994718111704158209',
          provider: 'runninghubwf',
          aspectRatio: '1:1',
          batchSize: 1,
          generationParams: { rhAnimeRealResolution: 0x6e0, rhInstanceType: 'plus' },
          promptAssetInputRefs: [{ assetId: 'asset-hidden-image', itemIndex: 0, type: 'image' }],
        },
        promptText: 'portrait',
      }),
      _0x301cf5 = await _0x54a1bf._buildPayload.call(_0x1dbb70);
    (assert.equal(_0x301cf5.prompt, 'portrait'),
      assert.equal(_0x301cf5.rhAnimeRealResolution, 0x6e0),
      assert.equal(_0x301cf5.rhResolution, 0x6e0),
      assert.equal(_0x301cf5.rhInstanceType, 'plus'),
      assert.deepEqual(_0x301cf5.inputUrls, ['/data/assets/hidden-person.png']));
  }),
  test('aigenImage task orchestration: person replace payload uses refSlot order for manifest model ids', async () => {
    const _0x131b97 = ['runninghub/2041177685895946242', 'runninghub/2050313968069165058'];
    for (const _0x412792 of _0x131b97) {
      const _0xddcd13 = 'node-person-replace-' + _0x412792.slice(-4),
        _0xc51146 = _0xddcd13 + '-target',
        _0x1c362b = _0xddcd13 + '-source',
        { proto: _0x80facd, ctx: _0x3aaecf } = createTestContext({
          targetId: _0xddcd13,
          nodeData: {
            id: _0xddcd13,
            model: _0x412792,
            provider: 'runninghubwf',
            aspectRatio: '1:1',
            batchSize: 1,
            generationParams: {
              rhResolution: _0x412792.endsWith('5058') ? 0x500 : 0x640,
              rhInstanceType: 'plus',
            },
          },
          nodes: {
            [_0xc51146]: {
              id: _0xc51146,
              type: 'source-image',
              originalLocalPath: 'data/uploads/target.png',
            },
            [_0x1c362b]: {
              id: _0x1c362b,
              type: 'source-image',
              originalLocalPath: 'data/uploads/source.png',
            },
          },
          incomingEdges: [
            {
              id: _0xddcd13 + '-edge-source',
              sourceId: _0x1c362b,
              targetId: _0xddcd13,
              refSlot: 'replacedImage',
            },
            {
              id: _0xddcd13 + '-edge-target',
              sourceId: _0xc51146,
              targetId: _0xddcd13,
              refSlot: 'replaceTarget',
            },
          ],
          promptText: 'replace',
        }),
        _0x582435 = await _0x80facd._buildPayload.call(_0x3aaecf);
      (assert.deepEqual(
        _0x582435.inputUrls,
        ['/data/uploads/target.png', '/data/uploads/source.png'],
        _0x412792,
      ),
        assert.equal(_0x582435.rhResolution, _0x412792.endsWith('5058') ? 0x500 : 0x640),
        assert.equal(_0x582435.rhInstanceType, 'plus'));
    }
  }),
  test('aigenImage task orchestration: modelApi fixed image slots produce inputUrlsBySlot', async () => {
    const _0x21f6a6 = 'node-youchuan-v6-slots',
      _0x8f3a1e = 'node-youchuan-main',
      _0xdbae4e = 'node-youchuan-cref',
      _0x8792bb = 'node-youchuan-sref',
      { proto: _0x1b0a07, ctx: _0x362172 } = createTestContext({
        targetId: _0x21f6a6,
        nodeData: {
          id: _0x21f6a6,
          type: 'ai-image',
          model: 'runninghub-model/youchuan-v6',
          provider: 'runninghub',
          generationParams: { aspectRatio: '1:1', quality: '1' },
        },
        nodes: {
          [_0x8f3a1e]: { id: _0x8f3a1e, type: 'source-image', originalLocalPath: 'data/uploads/main.png' },
          [_0xdbae4e]: { id: _0xdbae4e, type: 'source-image', originalLocalPath: 'data/uploads/cref.png' },
          [_0x8792bb]: { id: _0x8792bb, type: 'source-image', originalLocalPath: 'data/uploads/sref.png' },
        },
        incomingEdges: [
          { id: 'edge-sref', sourceId: _0x8792bb, targetId: _0x21f6a6, refSlot: 'sref' },
          { id: 'edge-main', sourceId: _0x8f3a1e, targetId: _0x21f6a6, refSlot: 'imageUrl' },
          { id: 'edge-cref', sourceId: _0xdbae4e, targetId: _0x21f6a6, refSlot: 'cref' },
        ],
        promptText: 'portrait',
        getProviderConfigImpl: () => ({ modelApiKey: 'mk' }),
      }),
      _0x2465f1 = await _0x1b0a07._buildPayload.call(_0x362172);
    (assert.deepEqual(_0x2465f1.inputUrlsBySlot, {
      imageUrl: '/data/uploads/main.png',
      cref: '/data/uploads/cref.png',
      sref: '/data/uploads/sref.png',
    }),
      assert.deepEqual(_0x2465f1.inputUrls, [
        '/data/uploads/sref.png',
        '/data/uploads/main.png',
        '/data/uploads/cref.png',
      ]));
  }),
  test('aigenImage task orchestration: Midjourney V7 fixed image slots omit missing role slot', async () => {
    const _0x4d242a = 'node-youchuan-v7-slots',
      _0x33fc28 = 'node-youchuan-v7-main',
      _0x4a4ecb = 'node-youchuan-v7-sref',
      { proto: _0x3bd89f, ctx: _0x46098b } = createTestContext({
        targetId: _0x4d242a,
        nodeData: {
          id: _0x4d242a,
          type: 'ai-image',
          model: 'runninghub-model/youchuan-v7',
          provider: 'runninghub',
          generationParams: { aspectRatio: '1:1', quality: '1' },
        },
        nodes: {
          [_0x33fc28]: { id: _0x33fc28, type: 'source-image', originalLocalPath: 'data/uploads/v7-main.png' },
          [_0x4a4ecb]: { id: _0x4a4ecb, type: 'source-image', originalLocalPath: 'data/uploads/v7-sref.png' },
        },
        incomingEdges: [
          { id: 'edge-v7-sref', sourceId: _0x4a4ecb, targetId: _0x4d242a, refSlot: 'sref' },
          { id: 'edge-v7-main', sourceId: _0x33fc28, targetId: _0x4d242a, refSlot: 'imageUrl' },
        ],
        promptText: 'portrait',
        getProviderConfigImpl: () => ({ modelApiKey: 'mk' }),
      }),
      _0x164941 = await _0x3bd89f._buildPayload.call(_0x46098b);
    (assert.deepEqual(_0x164941.inputUrlsBySlot, {
      imageUrl: '/data/uploads/v7-main.png',
      sref: '/data/uploads/v7-sref.png',
    }),
      assert.equal(_0x164941.inputUrlsBySlot.cref, undefined),
      assert.deepEqual(_0x164941.inputUrls, ['/data/uploads/v7-sref.png', '/data/uploads/v7-main.png']));
  }),
  test('aigenImage task orchestration: RunningHub image X single fixed slot produces imageUrl input', async () => {
    const _0x379b1d = 'node-rh-image-x-slot',
      _0x1a0d54 = 'node-rh-image-x-ref',
      { proto: _0x1082b7, ctx: _0xa1ca95 } = createTestContext({
        targetId: _0x379b1d,
        nodeData: {
          id: _0x379b1d,
          type: 'ai-image',
          model: 'runninghub-model/rhart-image-g',
          provider: 'runninghub',
        },
        nodes: {
          [_0x1a0d54]: {
            id: _0x1a0d54,
            type: 'source-image',
            originalLocalPath: 'data/uploads/image-x-ref.png',
          },
        },
        incomingEdges: [
          { id: 'edge-image-x-main', sourceId: _0x1a0d54, targetId: _0x379b1d, refSlot: 'imageUrl' },
        ],
        promptText: 'polish the reference',
        getProviderConfigImpl: () => ({ modelApiKey: 'mk' }),
      }),
      _0x1518e6 = await _0x1082b7._buildPayload.call(_0xa1ca95);
    (assert.deepEqual(_0x1518e6.inputUrlsBySlot, { imageUrl: '/data/uploads/image-x-ref.png' }),
      assert.deepEqual(_0x1518e6.inputUrls, ['/data/uploads/image-x-ref.png']),
      assert.equal(_0x1518e6.provider, 'runninghub'),
      assert.equal(_0x1518e6.rhModelRoute, 'low'),
      assert.equal(_0x1518e6.imageSize, '1K'),
      assert.equal(_0x1518e6.aspectRatio, '1:1'),
      assert.equal(_0x1518e6.batchSize, 1),
      assert.equal(_0x1518e6.numImages, undefined),
      assert.equal(_0x1518e6.outputFormat, undefined),
      assert.equal(_0x1518e6.suppressAspectRatio, undefined));
  }),
  test('aigenImage task orchestration: person replace adaptive ratio uses manifest source slot', async () => {
    const _0x2ee65c = ['runninghub/2041177685895946242', 'runninghub/2050313968069165058'];
    for (const _0x58b38c of _0x2ee65c) {
      const _0x1cc149 = 'node-person-replace-ratio-' + _0x58b38c.slice(-4),
        _0x3cd286 = _0x1cc149 + '-target',
        _0x1b5325 = _0x1cc149 + '-source',
        { proto: _0x20ffb8, ctx: _0x1fdf3b } = createTestContext({
          targetId: _0x1cc149,
          nodeData: {
            id: _0x1cc149,
            model: _0x58b38c,
            provider: 'runninghubwf',
            batchSize: 1,
            generationParams: { rhResolution: _0x58b38c.endsWith('5058') ? 0x500 : 0x640 },
          },
          nodes: {
            [_0x3cd286]: {
              id: _0x3cd286,
              type: 'source-image',
              originalLocalPath: 'data/uploads/target.png',
              width: 0x640,
              height: 0x384,
            },
            [_0x1b5325]: {
              id: _0x1b5325,
              type: 'source-image',
              originalLocalPath: 'data/uploads/source.png',
              width: 0x384,
              height: 0x640,
            },
          },
          incomingEdges: [
            {
              id: _0x1cc149 + '-edge-target',
              sourceId: _0x3cd286,
              targetId: _0x1cc149,
              refSlot: 'replaceTarget',
            },
            {
              id: _0x1cc149 + '-edge-source',
              sourceId: _0x1b5325,
              targetId: _0x1cc149,
              refSlot: 'replacedImage',
            },
          ],
          promptText: 'replace',
        }),
        _0x5e89c4 = await _0x20ffb8._buildPayload.call(_0x1fdf3b);
      (assert.deepEqual(
        _0x5e89c4.inputUrls,
        ['/data/uploads/target.png', '/data/uploads/source.png'],
        _0x58b38c,
      ),
        assert.equal(_0x5e89c4.resolvedRatioLabel, '9:16', _0x58b38c),
        assert.equal(_0x5e89c4.adaptiveSource, 'input-media', _0x58b38c));
    }
  }),
  test('aigenImage task orchestration: GRSAI 有参考图+自适应时透传 API auto', async () => {
    const _0x25f5f2 = 'node-ai-image-1',
      _0x5eff4c = 'node-ref-image-1',
      { proto: _0x57cbb0, ctx: _0x476626 } = createTestContext({
        targetId: _0x25f5f2,
        nodeData: {
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
        },
        nodes: {
          [_0x5eff4c]: {
            id: _0x5eff4c,
            type: 'source-image',
            imageUrl: 'https://img.example.com/ref.png',
            width: 0x640,
            height: 0x384,
          },
        },
        incomingEdges: [{ id: 'edge-1', sourceId: _0x5eff4c, targetId: _0x25f5f2, refSlot: '' }],
      }),
      _0x3be02d = await _0x57cbb0._buildPayload.call(_0x476626);
    (assert.equal(_0x3be02d.aspectRatio, 'auto'),
      assert.equal(_0x3be02d.suppressAspectRatio, undefined),
      assert.equal(_0x3be02d.resolvedRatioLabel, 'auto'),
      assert.equal(_0x3be02d.adaptiveSource, 'input-media'),
      assert.equal(_0x3be02d.ratioCapability, 'aspectRatio'),
      assert.deepEqual(_0x3be02d.inputUrls, ['https://img.example.com/ref.png']));
  }),
  test('aigenImage task orchestration: source-image 生成入参优先使用原图本地路径', async () => {
    const _0x4bcd3d = 'node-ai-image-source-original-first',
      _0x269c23 = 'node-ref-image-source-original-first',
      { proto: _0x4f27f0, ctx: _0x27125a } = createTestContext({
        targetId: _0x4bcd3d,
        nodeData: {
          id: _0x4bcd3d,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        nodes: {
          [_0x269c23]: {
            id: _0x269c23,
            type: 'source-image',
            originalLocalPath: 'data/uploads/original.png',
            displayLocalPath: 'data/uploads/display.webp',
            thumbLocalPath: 'data/uploads/thumb.webp',
            thumbUrl: 'https://img.example.com/thumb.png',
            width: 0x640,
            height: 0x384,
          },
        },
        incomingEdges: [
          { id: 'edge-source-original-first', sourceId: _0x269c23, targetId: _0x4bcd3d, refSlot: '' },
        ],
      }),
      _0x379f0c = await _0x4f27f0._buildPayload.call(_0x27125a);
    assert.deepEqual(_0x379f0c.inputUrls, ['/data/uploads/original.png']);
  }),
  test('aigenImage task orchestration: localized reference parser keeps Chinese aliases in English locale', async () => {
    setLocale('en-US', { persist: false, notify: false });
    try {
      const _0x20dc39 = 'node-ai-image-source-alias-en',
        _0xca6d65 = 'node-ref-image-source-alias-en',
        { proto: _0x57b892, ctx: _0x5f3115 } = createTestContext({
          targetId: _0x20dc39,
          nodeData: {
            id: _0x20dc39,
            model: 'nano-banana-pro-vt',
            provider: 'grsai',
            aspectRatio: '1:1',
            imageSize: '2K',
            batchSize: 1,
          },
          nodes: {
            [_0xca6d65]: {
              id: _0xca6d65,
              type: 'source-image',
              originalLocalPath: 'data/uploads/alias-original.png',
            },
          },
          incomingEdges: [
            { id: 'edge-source-alias-en', sourceId: _0xca6d65, targetId: _0x20dc39, refSlot: '' },
          ],
          promptText: 'edit @图片1',
        }),
        _0x2eac15 = await _0x57b892._buildPayload.call(_0x5f3115);
      assert.deepEqual(_0x2eac15.inputUrls, ['/data/uploads/alias-original.png']);
    } finally {
      setLocale(DEFAULT_LOCALE, { persist: false, notify: false });
    }
  }),
  test('aigenImage task orchestration: ai-image 生成入参优先使用主图原图本地路径', async () => {
    const _0x2705d9 = 'node-ai-image-ai-original-first',
      _0xcb078c = 'node-ref-ai-image-original-first',
      { proto: _0x5a7690, ctx: _0x3a9bd9 } = createTestContext({
        targetId: _0x2705d9,
        nodeData: {
          id: _0x2705d9,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        nodes: {
          [_0xcb078c]: {
            id: _0xcb078c,
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
            width: 0x4b0,
            height: 0x4b0,
          },
        },
        incomingEdges: [
          { id: 'edge-ai-original-first', sourceId: _0xcb078c, targetId: _0x2705d9, refSlot: '' },
        ],
      }),
      _0x19ae8a = await _0x5a7690._buildPayload.call(_0x3a9bd9);
    assert.deepEqual(_0x19ae8a.inputUrls, ['/data/uploads/main-original.png']);
  }),
  test('aigenImage task orchestration: PPIO 有参考图+自适应时不设置 suppressAspectRatio', async () => {
    const _0x327749 = 'node-ai-image-2',
      _0x5d8ef6 = 'node-ref-image-2',
      { proto: _0x3cf21c, ctx: _0x56b05b } = createTestContext({
        targetId: _0x327749,
        nodeData: { model: 'ppio/seedream-5.0-lite', aspectRatio: '自适应', imageSize: '2K', batchSize: 1 },
        nodes: {
          [_0x5d8ef6]: {
            id: _0x5d8ef6,
            type: 'source-image',
            imageUrl: 'https://img.example.com/ref-ppio.png',
            width: 0x438,
            height: 0x546,
          },
        },
        incomingEdges: [{ id: 'edge-2', sourceId: _0x5d8ef6, targetId: _0x327749, refSlot: '' }],
      }),
      _0x25eafa = await _0x3cf21c._buildPayload.call(_0x56b05b),
      _0x44b20f = await _0x3cf21c._buildResumePayload.call(_0x56b05b, _0x56b05b._data);
    (assert.equal(_0x25eafa.aspectRatio, '4:5'),
      assert.equal(_0x25eafa.suppressAspectRatio, undefined),
      assert.equal(_0x25eafa.provider, 'ppio'),
      assert.equal(_0x44b20f.provider, 'ppio'),
      assert.deepEqual(_0x25eafa.inputUrls, ['https://img.example.com/ref-ppio.png']));
  }),
  test('aigenImage task orchestration: grsai 有入参时自适应保持 API auto', async () => {
    const _0x37097d = 'node-ai-image-grsai-input-first',
      _0x423912 = 'node-ref-image-grsai-input-first',
      { proto: _0x477314, ctx: _0x209a3e } = createTestContext({
        targetId: _0x37097d,
        nodeData: {
          id: _0x37097d,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
          width: 0x384,
          height: 0x384,
        },
        nodes: {
          [_0x423912]: {
            id: _0x423912,
            type: 'source-image',
            imageUrl: 'https://img.example.com/ref-grsai-169.png',
            width: 0x640,
            height: 0x384,
          },
        },
        incomingEdges: [
          { id: 'edge-grsai-input-first', sourceId: _0x423912, targetId: _0x37097d, refSlot: '' },
        ],
      }),
      _0x2543f4 = await _0x477314._buildPayload.call(_0x209a3e);
    (assert.equal(_0x2543f4.provider, 'grsai'),
      assert.equal(_0x2543f4.aspectRatio, 'auto'),
      assert.equal(_0x2543f4.resolvedRatioLabel, 'auto'),
      assert.equal(_0x2543f4.adaptiveSource, 'input-media'));
  }),
  test('aigenImage task orchestration: GRSAI 未设置 aspectRatio 时默认 API auto', async () => {
    const _0x44ccfb = 'node-ai-image-default-adaptive',
      { proto: _0x41c34e, ctx: _0x56db7b } = createTestContext({
        targetId: _0x44ccfb,
        nodeData: {
          id: _0x44ccfb,
          model: 'nano-banana-pro-vt',
          provider: 'grsai',
          imageSize: '2K',
          batchSize: 1,
          width: 0x640,
          height: 0x384,
        },
        incomingEdges: [],
      }),
      _0x49813a = await _0x41c34e._buildPayload.call(_0x56db7b);
    (assert.equal(_0x49813a.aspectRatio, 'auto'),
      assert.equal(_0x49813a.resolvedRatioLabel, 'auto'),
      assert.equal(_0x49813a.adaptiveSource, 'display'));
  }),
  test('aigenImage task orchestration: 自适应无图像入参时使用显示区域比例映射', async () => {
    const _0x308128 = 'node-ai-image-3',
      _0x328f0c = 'node-ref-text-3',
      { proto: _0x1e086a, ctx: _0x5e4a91 } = createTestContext({
        targetId: _0x308128,
        nodeData: {
          id: _0x308128,
          model: 'ppio/seedream-5.0-lite',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
          width: 0x6a4,
          height: 0x384,
        },
        nodes: {
          [_0x328f0c]: { id: _0x328f0c, type: 'source-text', text: 'hello', width: 0x834, height: 0x12c },
        },
        incomingEdges: [{ id: 'edge-3', sourceId: _0x328f0c, targetId: _0x308128, refSlot: '' }],
      }),
      _0x31d026 = await _0x1e086a._buildPayload.call(_0x5e4a91);
    (assert.equal(_0x31d026.aspectRatio, '16:9'),
      assert.equal(_0x31d026.adaptiveSource, 'display'),
      assert.equal(_0x31d026.resolvedRatioLabel, '16:9'));
  }),
  test('aigenImage task orchestration: ai-text 入参无输出时使用 prompt 作为文本内容', async () => {
    const _0x37c429 = 'node-ai-image-text-prompt-ref',
      _0x3ca58e = 'node-ai-text-prompt-ref',
      { proto: _0x32d555, ctx: _0x9549a4 } = createTestContext({
        targetId: _0x37c429,
        nodeData: {
          id: _0x37c429,
          model: 'ppio/seedream-5.0-lite',
          aspectRatio: '1:1',
          imageSize: '2K',
          batchSize: 1,
        },
        nodes: { [_0x3ca58e]: { id: _0x3ca58e, type: 'ai-text', prompt: '来自生成文本节点的提示词' } },
        incomingEdges: [
          { id: 'edge-ai-image-text-prompt', sourceId: _0x3ca58e, targetId: _0x37c429, refSlot: '' },
        ],
        promptText: '主体画面',
      }),
      _0x1ddc07 = await _0x32d555._buildPayload.call(_0x9549a4);
    (assert.equal(_0x1ddc07.prompt, '来自生成文本节点的提示词\n主体画面'),
      assert.deepEqual(_0x1ddc07.inputUrls, []));
  }),
  test('aigenImage task orchestration: Dreamina 自适应 + 16:9 入参图透传 16:9', async () => {
    const _0x50c2fb = 'node-ai-image-dreamina-1',
      _0x257d0c = 'node-ref-image-dreamina-1',
      { proto: _0x5045b7, ctx: _0x486c73 } = createTestContext({
        targetId: _0x50c2fb,
        nodeData: {
          model: 'dreamina/5.0',
          provider: 'dreamina',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
        },
        nodes: {
          [_0x257d0c]: {
            id: _0x257d0c,
            type: 'source-image',
            imageUrl: 'https://img.example.com/dreamina-169.png',
            width: 0x640,
            height: 0x384,
          },
        },
        incomingEdges: [{ id: 'edge-dreamina-1', sourceId: _0x257d0c, targetId: _0x50c2fb, refSlot: '' }],
      }),
      _0x5974e5 = await _0x5045b7._buildPayload.call(_0x486c73);
    (assert.equal(_0x5974e5.provider, 'dreamina'), assert.equal(_0x5974e5.aspectRatio, '16:9'));
  }),
  test('aigenImage task orchestration: 自适应入参优先使用真实媒体尺寸', async () => {
    const _0x5f2a98 = 'node-ai-image-real-media-size',
      _0x63e467 = 'node-ref-image-real-media-size',
      { proto: _0x37969c, ctx: _0x15c760 } = createTestContext({
        targetId: _0x5f2a98,
        nodeData: {
          model: 'dreamina/5.0',
          provider: 'dreamina',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
          width: 0x640,
          height: 0x384,
        },
        nodes: {
          [_0x63e467]: {
            id: _0x63e467,
            type: 'source-image',
            imageUrl: 'https://img.example.com/portrait-real.png',
            width: 0x640,
            height: 0x384,
            imageWidth: 0x384,
            imageHeight: 0x640,
          },
        },
        incomingEdges: [
          { id: 'edge-real-media-size', sourceId: _0x63e467, targetId: _0x5f2a98, refSlot: '' },
        ],
      }),
      _0x39c41f = await _0x37969c._buildPayload.call(_0x15c760);
    (assert.equal(_0x39c41f.provider, 'dreamina'),
      assert.equal(_0x39c41f.aspectRatio, '9:16'),
      assert.equal(_0x39c41f.resolvedRatioLabel, '9:16'),
      assert.equal(_0x39c41f.adaptiveSource, 'input-media'));
  }),
  test('aigenImage task orchestration: Dreamina 生成入参保留原图本地路径', async () => {
    const _0x3d382a = 'node-ai-image-dreamina-original-first',
      _0xd3ccee = 'node-ref-image-dreamina-original-first',
      { proto: _0x1b8680, ctx: _0x8d2670 } = createTestContext({
        targetId: _0x3d382a,
        nodeData: {
          id: _0x3d382a,
          model: 'dreamina/5.0',
          provider: 'dreamina',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
        },
        nodes: {
          [_0xd3ccee]: {
            id: _0xd3ccee,
            type: 'source-image',
            originalLocalPath: 'data/uploads/dreamina-original.png',
            displayLocalPath: 'data/uploads/dreamina-display.webp',
            thumbLocalPath: 'data/uploads/dreamina-thumb.webp',
            thumbUrl: 'https://img.example.com/dreamina-thumb.png',
            width: 0x640,
            height: 0x384,
          },
        },
        incomingEdges: [
          { id: 'edge-dreamina-original-first', sourceId: _0xd3ccee, targetId: _0x3d382a, refSlot: '' },
        ],
      }),
      _0x4f210c = await _0x1b8680._buildPayload.call(_0x8d2670);
    (assert.equal(_0x4f210c.provider, 'dreamina'),
      assert.deepEqual(_0x4f210c.inputUrls, ['/data/uploads/dreamina-original.png']));
  }),
  test('aigenImage task orchestration: Dreamina 自适应 + 非标准比例映射最近支持比例', async () => {
    const _0x23eb46 = 'node-ai-image-dreamina-2',
      _0x2847e9 = 'node-ref-image-dreamina-2',
      { proto: _0x17b0ad, ctx: _0x3337d7 } = createTestContext({
        targetId: _0x23eb46,
        nodeData: {
          model: 'dreamina/4.5',
          provider: 'dreamina',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
        },
        nodes: {
          [_0x2847e9]: {
            id: _0x2847e9,
            type: 'source-image',
            imageUrl: 'https://img.example.com/dreamina-non-standard.png',
            width: 0x4e2,
            height: 0x3e8,
          },
        },
        incomingEdges: [{ id: 'edge-dreamina-2', sourceId: _0x2847e9, targetId: _0x23eb46, refSlot: '' }],
      }),
      _0x17182a = await _0x17b0ad._buildPayload.call(_0x3337d7);
    (assert.equal(_0x17182a.provider, 'dreamina'), assert.equal(_0x17182a.aspectRatio, '4:3'));
  }),
  test('aigenImage task orchestration: Dreamina 自适应 + 无图像入参时 fallback 为 1:1', async () => {
    const _0x3c1adf = 'node-ai-image-dreamina-3',
      { proto: _0x2a690b, ctx: _0x14879e } = createTestContext({
        targetId: _0x3c1adf,
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
      _0x59bce7 = await _0x2a690b._buildPayload.call(_0x14879e);
    (assert.equal(_0x59bce7.provider, 'dreamina'), assert.equal(_0x59bce7.aspectRatio, '1:1'));
  }),
  test('aigenImage task orchestration: 无入参时自适应优先使用显示区域比例', async () => {
    const _0x58542c = 'node-ai-image-display-ratio',
      { proto: _0x7889db, ctx: _0xb8b8f0 } = createTestContext({
        targetId: _0x58542c,
        nodeData: {
          id: _0x58542c,
          model: 'dreamina/5.0',
          provider: 'dreamina',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
          width: 0x5dc,
          height: 0x384,
        },
        incomingEdges: [],
      }),
      _0xd0d818 = await _0x7889db._buildPayload.call(_0xb8b8f0);
    (assert.equal(_0xd0d818.aspectRatio, '16:9'),
      assert.equal(_0xd0d818.adaptiveSource, 'display'),
      assert.equal(_0xd0d818.resolvedRatioLabel, '16:9'));
  }),
  test('aigenImage task orchestration: async pending 且无 taskId 时触发兜底重提', async () => {
    const _0x297ef7 = 'node-ai-image-fallback-1',
      { proto: _0x1f98a3, ctx: _0x383997 } = createTestContext({
        targetId: _0x297ef7,
        nodeData: {
          model: 'ppio/seedream-4.0',
          provider: 'ppio',
          asyncTaskProvider: 'ppio',
          asyncTaskKind: 'image',
          asyncTaskStatus: 'pending',
          asyncTaskId: '',
          generationStartTime: Date.now() - 0x320,
          generationDuration: null,
          images: [],
        },
      });
    let _0x32f30a = 0;
    ((_0x383997._onGenerate = async () => {
      _0x32f30a += 1;
    }),
      (_0x383997._stopAsyncRecovery = () => {}),
      (_0x383997._isGenerating = false),
      await _0x1f98a3._maybeResumeAsyncTaskImpl.call(_0x383997),
      assert.equal(_0x32f30a, 1));
  }),
  test('aigenImage task orchestration: async pending 且无 taskId 但已有结果时不触发重提', async () => {
    const _0x44d452 = 'node-ai-image-fallback-2',
      { proto: _0x1ed43c, ctx: _0x4b7e86 } = createTestContext({
        targetId: _0x44d452,
        nodeData: {
          model: 'ppio/seedream-4.0',
          provider: 'ppio',
          asyncTaskProvider: 'ppio',
          asyncTaskKind: 'image',
          asyncTaskStatus: 'pending',
          asyncTaskId: '',
          generationStartTime: Date.now() - 0x320,
          generationDuration: null,
          imageUrl: '/output/ok.png',
          images: [{ imageUrl: '/output/ok.png' }],
        },
      });
    let _0x597a2e = 0,
      _0x2b1454 = 0;
    ((_0x4b7e86._onGenerate = async () => {
      _0x597a2e += 1;
    }),
      (_0x4b7e86._stopAsyncRecovery = () => {
        _0x2b1454 += 1;
      }),
      (_0x4b7e86._isGenerating = false),
      await _0x1ed43c._maybeResumeAsyncTaskImpl.call(_0x4b7e86),
      assert.equal(_0x597a2e, 0),
      assert.equal(_0x2b1454, 1));
  }),
  test('aigenImage task orchestration: RunningHub recovery writes terminal state through runtime', async () => {
    const _0xbaee84 = 'node-ai-image-rh-runtime-recovery',
      _0x3d1244 = Date.now() - 0xea60,
      {
        proto: _0x567ff6,
        ctx: _0x5e179d,
        state: _0x55f681,
      } = createTestContext({
        targetId: _0xbaee84,
        nodeData: {
          id: _0xbaee84,
          model: 'runninghub/1994718111704158209',
          provider: 'runninghubwf',
          rhTaskId: 'rh-image-resume-success',
          rhTaskStatus: 'running',
          rhTaskStartedAt: _0x3d1244,
          rhTaskUseOpenapiQuery: true,
          generationStartTime: _0x3d1244,
          generationDuration: null,
          isGenerating: true,
          images: [],
        },
        isRunninghubWorkflowModelImpl: () => true,
        apiImpl: {
          resumeRunningHubImageTask: async (_0x3b44b3, _0x5093a9, _0x425f0d) => {
            return (
              assert.equal(_0x3b44b3, 'rh-image-resume-success'),
              assert.equal(_0x5093a9.provider, 'runninghubwf'),
              assert.equal(_0x425f0d.useOpenapiQuery, true),
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
    ((_0x5e179d._isGenerating = false),
      (_0x5e179d._buildResumePayload = async () => ({
        model: 'runninghub/1994718111704158209',
        provider: 'runninghubwf',
        apiKey: 'k_rh',
      })),
      (_0x5e179d._persistRunningHubResumeCache = () => {}),
      (_0x5e179d._updateSubmitButtonState = () => {}),
      await _0x567ff6._maybeResumeRunningHubTaskImpl.call(_0x5e179d));
    _0x5e179d._rhResumePromise && (await _0x5e179d._rhResumePromise);
    const _0x205ad0 = _0x55f681.nodes[_0xbaee84];
    (assert.equal(_0x205ad0.isGenerating, false),
      assert.equal(_0x205ad0.jobStatus, 'success'),
      assert.equal(_0x205ad0.rhTaskId, 'rh-image-resume-success'),
      assert.equal(_0x205ad0.rhTaskStatus, 'success'),
      assert.equal(_0x205ad0.rhTaskRecovering, false),
      assert.equal(_0x205ad0.imageUrl, '/output/resumed.png'),
      assert.equal(_0x205ad0.thumbUrl, '/output/resumed-thumb.png'),
      assert.equal(_0x205ad0.localPath, 'output/resumed.png'));
  }),
  test('aigenImage task orchestration: async recovery writes terminal state through runtime', async () => {
    const _0x5a8497 = 'node-ai-image-async-runtime-recovery',
      _0x396722 = Date.now() - 0xea60;
    let _0x2ee9c5 = 0;
    const {
      proto: _0x1131ed,
      ctx: _0x25edac,
      state: _0x26f0ac,
    } = createTestContext({
      targetId: _0x5a8497,
      nodeData: {
        id: _0x5a8497,
        model: 'ppio/seedream-4.0',
        provider: 'ppio',
        asyncTaskProvider: 'ppio',
        asyncTaskKind: 'image',
        asyncTaskId: 'async-image-resume-success',
        asyncTaskStatus: 'running',
        asyncTaskStartedAt: _0x396722,
        generationStartTime: _0x396722,
        generationDuration: null,
        isGenerating: true,
        images: [],
      },
      apiImpl: {
        resumeAsyncImageTask: async (_0x20aefb, _0x9d0401, _0x193c15) => {
          return (
            (_0x2ee9c5 += 1),
            assert.equal(_0x20aefb, 'async-image-resume-success'),
            assert.equal(_0x9d0401.provider, 'ppio'),
            assert.ok(_0x193c15?.signal),
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
    ((_0x25edac._isGenerating = false),
      (_0x25edac._buildResumePayload = async () => ({
        model: 'ppio/seedream-4.0',
        provider: 'ppio',
        apiKey: 'k_ppio',
      })),
      (_0x25edac._persistAsyncResumeCache = () => {}),
      (_0x25edac._updateSubmitButtonState = () => {}),
      await _0x1131ed._maybeResumeAsyncTaskImpl.call(_0x25edac));
    _0x25edac._asyncResumePromise && (await _0x25edac._asyncResumePromise);
    const _0x32686c = _0x26f0ac.nodes[_0x5a8497];
    (assert.equal(_0x2ee9c5, 1),
      assert.equal(_0x32686c.isGenerating, false),
      assert.equal(_0x32686c.jobStatus, 'success'),
      assert.equal(_0x32686c.asyncTaskId, 'async-image-resume-success'),
      assert.equal(_0x32686c.asyncTaskStatus, 'success'),
      assert.equal(_0x32686c.asyncTaskProvider, 'ppio'),
      assert.equal(_0x32686c.asyncTaskKind, 'image'),
      assert.equal(_0x32686c.asyncTaskRecovering, false),
      assert.equal(_0x32686c.imageUrl, '/output/async-resumed.png'),
      assert.equal(_0x32686c.thumbUrl, '/output/async-resumed-thumb.png'),
      assert.equal(_0x32686c.localPath, 'output/async-resumed.png'));
  }),
  test('aigenImage task orchestration: async recovery local abort keeps timer running', async () => {
    const _0x3b227f = 'node-ai-image-async-runtime-pause',
      _0x1f8a8b = Date.now() - 0xea60;
    let _0xdc5bdd = null;
    const {
      proto: _0x572912,
      ctx: _0x1d9881,
      state: _0x39acb1,
    } = createTestContext({
      targetId: _0x3b227f,
      nodeData: {
        id: _0x3b227f,
        model: 'ppio/seedream-4.0',
        provider: 'ppio',
        asyncTaskProvider: 'ppio',
        asyncTaskKind: 'image',
        asyncTaskId: 'async-image-resume-pause',
        asyncTaskStatus: 'running',
        asyncTaskStartedAt: _0x1f8a8b,
        generationStartTime: _0x1f8a8b,
        generationDuration: null,
        isGenerating: true,
        images: [],
      },
      apiImpl: {
        resumeAsyncImageTask: async (_0x36f6ba, _0x4c36cb, _0x3e1751) =>
          new Promise((_0x414ed3, _0x174ee7) => {
            ((_0xdc5bdd = _0x3e1751?.signal || null),
              _0xdc5bdd?.addEventListener?.('abort', () => {
                const _0x3892f8 = new Error('CANCELLED');
                ((_0x3892f8.name = 'AbortError'), _0x174ee7(_0x3892f8));
              }));
          }),
      },
    });
    ((_0x1d9881._isGenerating = false),
      (_0x1d9881._buildResumePayload = async () => ({
        model: 'ppio/seedream-4.0',
        provider: 'ppio',
        apiKey: 'k_ppio',
      })),
      (_0x1d9881._persistAsyncResumeCache = () => {}),
      (_0x1d9881._updateSubmitButtonState = () => {}),
      await _0x572912._maybeResumeAsyncTaskImpl.call(_0x1d9881));
    for (let _0x482d25 = 0; _0x482d25 < 5 && !_0xdc5bdd; _0x482d25 += 1) {
      await new Promise((_0x291881) => setImmediate(_0x291881));
    }
    assert.ok(_0xdc5bdd);
    const _0x755cd3 = _0x1d9881._asyncResumePromise;
    _0x1d9881._stopAsyncRecovery(false);
    if (_0x755cd3) await _0x755cd3;
    const _0x2005e2 = _0x39acb1.nodes[_0x3b227f];
    (assert.equal(_0x2005e2.isGenerating, true),
      assert.equal(_0x2005e2.jobStatus, 'running'),
      assert.equal(_0x2005e2.generationStartTime, _0x1f8a8b),
      assert.equal(_0x2005e2.generationDuration, null),
      assert.equal(_0x2005e2.asyncTaskId, 'async-image-resume-pause'),
      assert.equal(_0x2005e2.asyncTaskStatus, 'running'),
      assert.equal(_0x2005e2.asyncTaskRecovering, false));
  }),
  test('aigenImage task orchestration: Dreamina recovery writes terminal state through runtime', async () => {
    const _0x8e60bd = 'node-ai-image-dreamina-runtime-recovery',
      _0x132abc = Date.now() - 0xea60;
    let _0x5d18f6 = 0;
    const {
      proto: _0x1be6f3,
      ctx: _0x2ad89c,
      state: _0x2d4450,
    } = createTestContext({
      targetId: _0x8e60bd,
      nodeData: {
        id: _0x8e60bd,
        model: 'dreamina/4.1',
        provider: 'dreamina',
        dreaminaSubmitId: 'sid-dreamina-success',
        dreaminaTaskStatus: 'pending',
        dreaminaTaskPhase: 'generating',
        dreaminaTaskLabel: '生成中',
        dreaminaTaskStartedAt: _0x132abc,
        dreaminaTaskLastCheckedAt: Date.now() - 0x7530,
        dreaminaTaskRecovering: false,
        generationStartTime: _0x132abc,
        generationDuration: null,
        isGenerating: true,
        images: [],
      },
      apiImpl: {
        resumeDreaminaImageTask: async (_0x2bc526, _0x19d122, _0x23a2e0) => {
          return (
            (_0x5d18f6 += 1),
            assert.equal(_0x2bc526, 'sid-dreamina-success'),
            assert.equal(_0x19d122.provider, 'dreamina'),
            assert.ok(_0x23a2e0?.signal),
            {
              imageUrl: '/output/dreamina-resumed.png',
              thumbUrl: '/output/dreamina-resumed-thumb.png',
              localPath: 'output/dreamina-resumed.png',
            }
          );
        },
      },
    });
    ((_0x2ad89c._isGenerating = false),
      (_0x2ad89c._buildResumePayload = async () => ({ model: 'dreamina/4.1', provider: 'dreamina' })),
      (_0x2ad89c._persistDreaminaResumeCache = () => {}),
      (_0x2ad89c._updateSubmitButtonState = () => {}),
      await _0x1be6f3._maybeResumeDreaminaTaskImpl.call(_0x2ad89c));
    _0x2ad89c._dreaminaResumePromise && (await _0x2ad89c._dreaminaResumePromise);
    const _0x642bc1 = _0x2d4450.nodes[_0x8e60bd];
    (assert.equal(_0x5d18f6, 1),
      assert.equal(_0x642bc1.isGenerating, false),
      assert.equal(_0x642bc1.jobStatus, 'success'),
      assert.equal(_0x642bc1.dreaminaSubmitId, 'sid-dreamina-success'),
      assert.equal(_0x642bc1.dreaminaTaskStatus, 'success'),
      assert.equal(_0x642bc1.dreaminaTaskPhase, 'done'),
      assert.equal(_0x642bc1.dreaminaTaskLabel, '已完成'),
      assert.equal(_0x642bc1.dreaminaTaskRecovering, false),
      assert.equal(_0x642bc1.imageUrl, '/output/dreamina-resumed.png'),
      assert.equal(_0x642bc1.thumbUrl, '/output/dreamina-resumed-thumb.png'),
      assert.equal(_0x642bc1.localPath, 'output/dreamina-resumed.png'));
  }),
  test('aigenImage task orchestration: stale Dreamina running task resumes and surfaces fail reason', async () => {
    const _0x7475c4 = 'node-ai-image-dreamina-stale-recovery',
      _0x4fae83 = Date.now() - 0xea60,
      {
        proto: _0x2c3bc0,
        ctx: _0x1d1fb2,
        state: _0x3a846a,
      } = createTestContext({
        targetId: _0x7475c4,
        nodeData: {
          id: _0x7475c4,
          model: 'dreamina/4.1',
          provider: 'dreamina',
          dreaminaSubmitId: 'sid-dreamina-fail',
          dreaminaTaskStatus: 'pending',
          dreaminaTaskPhase: 'generating',
          dreaminaTaskLabel: '生成中',
          dreaminaTaskStartedAt: _0x4fae83,
          dreaminaTaskLastCheckedAt: Date.now() - 0x7530,
          dreaminaTaskRecovering: false,
          generationStartTime: _0x4fae83,
          generationDuration: null,
          isGenerating: true,
          images: [],
        },
        apiImpl: {
          resumeDreaminaImageTask: async (_0x270264) => {
            assert.equal(_0x270264, 'sid-dreamina-fail');
            throw new Error('generation failed: final generation failed');
          },
        },
      });
    ((_0x1d1fb2._isGenerating = true),
      (_0x1d1fb2._buildResumePayload = async () => ({ model: 'dreamina/4.1', provider: 'dreamina' })),
      (_0x1d1fb2._persistDreaminaResumeCache = () => {}),
      (_0x1d1fb2._updateSubmitButtonState = () => {}),
      await _0x2c3bc0._maybeResumeDreaminaTaskImpl.call(_0x1d1fb2),
      assert.ok(_0x1d1fb2._dreaminaResumePromise),
      await _0x1d1fb2._dreaminaResumePromise);
    const _0x1b14eb = _0x3a846a.nodes[_0x7475c4];
    (assert.equal(_0x1b14eb.isGenerating, false),
      assert.equal(_0x1b14eb.jobStatus, 'error'),
      assert.equal(_0x1b14eb.jobError, 'generation failed: final generation failed'),
      assert.equal(_0x1b14eb.dreaminaTaskStatus, 'failed'),
      assert.equal(_0x1b14eb.dreaminaTaskPhase, 'failed'),
      assert.equal(_0x1b14eb.dreaminaTaskLabel, 'generation failed: final generation failed'),
      assert.equal(_0x1b14eb.dreaminaTaskRecovering, false));
  }),
  test('aigenImage task orchestration: persisted Dreamina running task resumes even with fresh lastChecked', async () => {
    const _0x5d171f = 'node-ai-image-dreamina-persisted-recovery',
      _0x59e59b = Date.now() - 0xea60,
      {
        proto: _0x2a15e8,
        ctx: _0x2a5c1a,
        state: _0x4e0ce3,
      } = createTestContext({
        targetId: _0x5d171f,
        nodeData: {
          id: _0x5d171f,
          model: 'dreamina/4.1',
          provider: 'dreamina',
          dreaminaSubmitId: 'sid-dreamina-persisted-fail',
          dreaminaTaskStatus: 'pending',
          dreaminaTaskPhase: 'syncing',
          dreaminaTaskLabel: '正在同步结果',
          dreaminaTaskStartedAt: _0x59e59b,
          dreaminaTaskLastCheckedAt: Date.now(),
          dreaminaTaskRecovering: false,
          generationStartTime: _0x59e59b,
          generationDuration: null,
          isGenerating: true,
          images: [],
        },
        apiImpl: {
          resumeDreaminaImageTask: async (_0x4efc45) => {
            assert.equal(_0x4efc45, 'sid-dreamina-persisted-fail');
            throw new Error('generation failed: final generation failed');
          },
        },
      });
    ((_0x2a5c1a._isGenerating = true),
      (_0x2a5c1a._dreaminaActiveSubmitId = ''),
      (_0x2a5c1a._buildResumePayload = async () => ({ model: 'dreamina/4.1', provider: 'dreamina' })),
      (_0x2a5c1a._persistDreaminaResumeCache = () => {}),
      (_0x2a5c1a._updateSubmitButtonState = () => {}),
      await _0x2a15e8._maybeResumeDreaminaTaskImpl.call(_0x2a5c1a),
      assert.ok(_0x2a5c1a._dreaminaResumePromise),
      await _0x2a5c1a._dreaminaResumePromise);
    const _0x50629b = _0x4e0ce3.nodes[_0x5d171f];
    (assert.equal(_0x50629b.isGenerating, false),
      assert.equal(_0x50629b.jobStatus, 'error'),
      assert.equal(_0x50629b.dreaminaTaskStatus, 'failed'),
      assert.equal(_0x50629b.dreaminaTaskPhase, 'failed'));
  }),
  test('aigenImage task orchestration: Dreamina recovery does not abort itself on reentrant state update', async () => {
    const _0x187ab1 = 'node-ai-image-dreamina-reentrant-recovery',
      _0x275580 = Date.now() - 0xea60,
      {
        proto: _0x3ec7d6,
        ctx: _0x6e037e,
        state: _0x17c723,
        store: _0x347420,
      } = createTestContext({
        targetId: _0x187ab1,
        nodeData: {
          id: _0x187ab1,
          model: 'dreamina/4.1',
          provider: 'dreamina',
          dreaminaSubmitId: 'sid-dreamina-reentrant-fail',
          dreaminaTaskStatus: 'pending',
          dreaminaTaskPhase: 'generating',
          dreaminaTaskLabel: '生成中',
          dreaminaTaskStartedAt: _0x275580,
          dreaminaTaskLastCheckedAt: Date.now() - 0x7530,
          dreaminaTaskRecovering: false,
          generationStartTime: _0x275580,
          generationDuration: null,
          isGenerating: true,
          images: [],
        },
        apiImpl: {
          resumeDreaminaImageTask: async (_0x5c3777) => {
            (assert.equal(_0x5c3777, 'sid-dreamina-reentrant-fail'), await Promise.resolve());
            throw new Error('generation failed: final generation failed');
          },
        },
      });
    ((_0x6e037e._isGenerating = true),
      (_0x6e037e._buildResumePayload = async () => ({ model: 'dreamina/4.1', provider: 'dreamina' })),
      (_0x6e037e._persistDreaminaResumeCache = () => {}),
      (_0x6e037e._updateSubmitButtonState = () => {}));
    const _0x14ddbf = _0x347420.updateNodeData.bind(_0x347420);
    let _0xe7fd4a = false;
    ((_0x347420.updateNodeData = (_0x3e0428, _0x2fbee6) => {
      (_0x14ddbf(_0x3e0428, _0x2fbee6),
        !_0xe7fd4a &&
          _0x2fbee6?.dreaminaTaskRecovering === true &&
          ((_0xe7fd4a = true), void _0x3ec7d6._maybeResumeDreaminaTaskImpl.call(_0x6e037e)));
    }),
      await _0x3ec7d6._maybeResumeDreaminaTaskImpl.call(_0x6e037e),
      await _0x6e037e._dreaminaResumePromise);
    const _0x49c049 = _0x17c723.nodes[_0x187ab1];
    (assert.equal(_0xe7fd4a, true),
      assert.equal(_0x49c049.isGenerating, false),
      assert.equal(_0x49c049.jobStatus, 'error'),
      assert.equal(_0x49c049.dreaminaTaskStatus, 'failed'),
      assert.equal(_0x49c049.dreaminaTaskRecovering, false));
  }),
  test('aigenImage task orchestration: Dreamina failed progress finalizes and stops loading', async () => {
    const _0x575287 = 'node-ai-image-dreamina-progress-fail',
      _0x4fb274 = {};
    let _0x1f2c82 = 0,
      _0x4d6034 = 0;
    const {
      proto: _0x58db53,
      ctx: _0x4b0a18,
      state: _0x2429ec,
    } = createTestContext({
      targetId: _0x575287,
      nodeData: {
        id: _0x575287,
        model: 'dreamina/4.1',
        provider: 'dreamina',
        aspectRatio: '1:1',
        imageSize: '2K',
        batchSize: 1,
      },
      apiImpl: {
        generateImage: async (_0x2c856c, _0x49f881 = {}) => {
          (_0x49f881.onTaskMeta?.({ taskId: 'sid-dreamina-progress-fail' }),
            _0x49f881.onProgress?.({
              submitId: 'sid-dreamina-progress-fail',
              status: 'failed',
              phase: 'failed',
              label: 'policy rejected',
              failReason: 'policy rejected',
              raw: { status: 'failed' },
            }));
          const _0x171aa3 = _0x2429ec.nodes[_0x575287];
          (assert.equal(_0x171aa3.isGenerating, false),
            assert.equal(_0x171aa3.jobStatus, 'error'),
            assert.equal(_0x171aa3.jobError, 'policy rejected'),
            assert.equal(_0x171aa3.dreaminaTaskStatus, 'failed'),
            assert.equal(_0x171aa3.dreaminaTaskPhase, 'failed'),
            assert.equal(_0x4d6034, 1));
          throw new Error('policy rejected');
        },
      },
      startLoadingImpl: (_0x54dcd9) => {
        (assert.equal(_0x54dcd9, _0x4fb274), (_0x1f2c82 += 1));
      },
      stopLoadingImpl: (_0x93455b) => {
        (assert.equal(_0x93455b, _0x4fb274), (_0x4d6034 += 1));
      },
    });
    ((_0x4b0a18.previewEl = _0x4fb274),
      (_0x4b0a18.btnEl = createButtonStub()),
      (_0x4b0a18._updateSubmitButtonState = () => {}),
      await _0x58db53._onGenerate.call(_0x4b0a18));
    const _0x36d4da = _0x2429ec.nodes[_0x575287];
    (assert.equal(_0x1f2c82, 1),
      assert.ok(_0x4d6034 >= 1),
      assert.equal(_0x4b0a18._isGenerating, false),
      assert.equal(_0x4b0a18.btnEl.classList.contains('is-rh-busy'), false),
      assert.doesNotMatch(_0x4b0a18.btnEl.innerHTML, /animation:spin/),
      assert.equal(_0x36d4da.isGenerating, false),
      assert.equal(_0x36d4da.jobStatus, 'error'),
      assert.equal(_0x36d4da.jobError, 'policy rejected'),
      assert.equal(_0x36d4da.dreaminaTaskRecovering, false),
      assert.ok(Number(_0x36d4da.generationDuration) >= 0),
      assert.equal(_0x36d4da.images?.[0]?.error, 'policy rejected'),
      assert.equal(_0x36d4da.mainImageIndex, 0),
      assert.equal(_0x36d4da.imageUrl, ''));
  }),
  test('aigenImage task orchestration: APIMart 错误结果会结束加载并标记失败', async () => {
    const _0x239e3d = 'node-ai-image-apimart-error',
      {
        proto: _0x242224,
        ctx: _0x47e6e3,
        state: _0x1d1e60,
      } = createTestContext({
        targetId: _0x239e3d,
        nodeData: {
          id: _0x239e3d,
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
    await _0x242224._onGenerate.call(_0x47e6e3);
    const _0x5d7e51 = _0x1d1e60.nodes[_0x239e3d];
    (assert.equal(_0x5d7e51.isGenerating, false),
      assert.equal(_0x5d7e51.jobStatus, 'error'),
      assert.equal(_0x5d7e51.jobError, 'APIMart 任务报错：找不到任务 id'),
      assert.equal(_0x5d7e51.asyncTaskStatus, 'failed'),
      assert.equal(_0x5d7e51.images?.[0]?.error, 'APIMart 任务报错：找不到任务 id'));
  }),
  test('aigenImage task orchestration: mixed batch failure keeps successful images', async () => {
    const _0x684cad = 'node-ai-image-mixed-batch',
      {
        proto: _0x30b743,
        ctx: _0x16c730,
        state: _0x2343b7,
      } = createTestContext({
        targetId: _0x684cad,
        nodeData: {
          id: _0x684cad,
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
    await _0x30b743._onGenerate.call(_0x16c730);
    const _0xdc473 = _0x2343b7.nodes[_0x684cad];
    (assert.equal(_0xdc473.isGenerating, false),
      assert.equal(_0xdc473.jobStatus, 'success'),
      assert.equal(_0xdc473.jobError, null),
      assert.equal(_0xdc473.images?.length, 4),
      assert.equal(_0xdc473.images?.[0]?.error, 'policy rejected'),
      assert.equal(_0xdc473.mainImageIndex, 1),
      assert.equal(_0xdc473.imageUrl, '/output/a.png'),
      assert.equal(_0xdc473.localPath, 'output/a.png'));
  }),
  test('aigenImage task orchestration: Volcengine 直连生成不伪装成异步任务', async () => {
    const _0x4b9163 = 'node-ai-image-volcengine-loading',
      _0xe3d8f0 = {};
    let _0x2ace1e = 0;
    const {
      proto: _0x3cc5b6,
      ctx: _0x4834f9,
      state: _0x473a35,
    } = createTestContext({
      targetId: _0x4b9163,
      nodeData: {
        id: _0x4b9163,
        model: 'volcengine/seedream-4.0',
        provider: 'volcengine',
        aspectRatio: '1:1',
        imageSize: '2K',
        batchSize: 1,
      },
      apiImpl: {
        generateImage: async (_0x414828, _0x145102 = {}) => {
          assert.equal(Boolean(_0x145102.signal), false);
          const _0x1a77fb = _0x473a35.nodes[_0x4b9163];
          return (
            assert.equal(_0x1a77fb.isGenerating, true),
            assert.equal(_0x1a77fb.jobStatus, 'running'),
            assert.equal(_0x1a77fb.asyncTaskProvider, ''),
            assert.equal(_0x1a77fb.asyncTaskStatus, 'idle'),
            _0x145102.onTaskMeta?.({
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
      startLoadingImpl: (_0x3b9854) => {
        (assert.equal(_0x3b9854, _0xe3d8f0), (_0x2ace1e += 1));
      },
    });
    ((_0x4834f9.previewEl = _0xe3d8f0),
      (_0x4834f9.btnEl = createButtonStub()),
      (_0x4834f9._updateSubmitButtonState = () => {}),
      await _0x3cc5b6._onGenerate.call(_0x4834f9));
    const _0x10fe79 = _0x473a35.nodes[_0x4b9163];
    (assert.equal(_0x2ace1e, 1),
      assert.equal(_0x10fe79.isGenerating, false),
      assert.equal(_0x10fe79.jobStatus, 'success'),
      assert.equal(_0x10fe79.asyncTaskProvider, ''),
      assert.equal(_0x10fe79.asyncTaskKind, 'image'),
      assert.equal(_0x10fe79.asyncTaskStatus, 'idle'),
      assert.equal(_0x10fe79.imageUrl, '/output/volcengine.png'));
  }),
  test('aigenImage task orchestration: Volcengine 缺少 API Key 时生成前拦截', async () => {
    const _0x2ff6b0 = 'node-ai-image-volcengine-missing-key',
      _0x322893 = {},
      _0xbf0d70 = globalThis.window.showToast,
      _0x407488 = [];
    let _0x2e687f = 0,
      _0x21513a = 0;
    try {
      globalThis.window.showToast = (_0x34e4a6, _0x21dba0) => {
        _0x407488.push({ message: _0x34e4a6, type: _0x21dba0 });
      };
      const {
        proto: _0xbd18c2,
        ctx: _0x5dc427,
        state: _0x2f68c1,
      } = createTestContext({
        targetId: _0x2ff6b0,
        nodeData: {
          id: _0x2ff6b0,
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
            return ((_0x2e687f += 1), { imageUrl: '/output/should-not-run.png' });
          },
        },
        startLoadingImpl: (_0x14970e) => {
          (assert.equal(_0x14970e, _0x322893), (_0x21513a += 1));
        },
      });
      ((_0x5dc427.previewEl = _0x322893),
        (_0x5dc427.btnEl = createButtonStub()),
        await _0xbd18c2._onGenerate.call(_0x5dc427));
      const _0x297aeb = _0x2f68c1.nodes[_0x2ff6b0];
      (assert.equal(_0x2e687f, 0),
        assert.equal(_0x21513a, 0),
        assert.equal(_0x297aeb.isGenerating, undefined),
        assert.deepEqual(_0x407488, [{ message: '请先在设置里填写火山方舟 API Key', type: 'warn' }]));
    } finally {
      globalThis.window.showToast = _0xbf0d70;
    }
  }),
  test('aigenImage task orchestration: manifest modelApi reads ordinary params from generationParams', async () => {
    const _0x104b79 = 'node-ai-image-apimart-manifest-params',
      { proto: _0x10ef12, ctx: _0x347fcd } = createTestContext({
        targetId: _0x104b79,
        nodeData: {
          id: _0x104b79,
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
      _0x18f307 = await _0x10ef12._buildPayload.call(_0x347fcd);
    (assert.equal(_0x18f307.model, 'apimart/nano-banana-2'),
      assert.equal(_0x18f307.provider, 'apimart'),
      assert.equal(_0x18f307.mode, 'official'),
      assert.equal(_0x18f307.imageSize, '4K'),
      assert.equal(_0x18f307.aspectRatio, '1:8'),
      assert.equal(_0x18f307.google_search, true),
      assert.equal(_0x18f307.google_image_search, true),
      assert.equal(_0x18f307.batchSize, 2));
  }),
  test('aigenImage task orchestration: Agnes image input starts loading without prompt', async () => {
    const _0x241058 = 'node-ai-image-agnes-image-input',
      _0x4ecebe = 'node-ai-image-agnes-source',
      _0x1685c0 = {};
    let _0x57b933 = 0,
      _0x36d550 = 0,
      _0x21a20e = null;
    const {
      proto: _0x411e3e,
      ctx: _0x13a17a,
      state: _0x43899d,
    } = createTestContext({
      targetId: _0x241058,
      nodes: {
        [_0x4ecebe]: { id: _0x4ecebe, type: 'source-image', imageUrl: 'https://cdn.example.com/input.png' },
      },
      incomingEdges: [{ id: 'edge-agnes-image', sourceId: _0x4ecebe, targetId: _0x241058 }],
      nodeData: {
        id: _0x241058,
        model: 'agnes/agnes-image-2.0-flash',
        provider: 'agnes',
        generationParams: { aspectRatio: '16:9', imageSize: '1K', batchSize: 1 },
      },
      promptText: '',
      getProviderConfigImpl: () => ({ apiKey: 'k_agnes' }),
      apiImpl: {
        generateImage: async (_0x116a3e) => {
          return ((_0x21a20e = _0x116a3e), { imageUrl: '/output/agnes.png' });
        },
      },
      startLoadingImpl: (_0x242c58) => {
        (assert.equal(_0x242c58, _0x1685c0), (_0x57b933 += 1));
      },
      stopLoadingImpl: (_0x4c73df) => {
        (assert.equal(_0x4c73df, _0x1685c0), (_0x36d550 += 1));
      },
    });
    ((_0x13a17a.previewEl = _0x1685c0),
      (_0x13a17a.btnEl = createButtonStub()),
      await _0x411e3e._onGenerate.call(_0x13a17a),
      assert.equal(_0x57b933, 1),
      assert.equal(_0x36d550, 1),
      assert.equal(_0x21a20e?.provider, 'agnes'),
      assert.equal(_0x21a20e?.model, 'agnes/agnes-image-2.0-flash'),
      assert.deepEqual(_0x21a20e?.inputUrls, ['https://cdn.example.com/input.png']),
      assert.equal(_0x43899d.nodes[_0x241058].jobStatus, 'success'));
  }),
  test('aigenImage task orchestration: generation start keeps existing preview under loading overlay', async () => {
    const _0x5a0fc9 = 'node-ai-image-stale-error-start';
    let _0x412c20 = null,
      _0x3d9641 = 0;
    const {
      proto: _0x459447,
      ctx: _0x3832a3,
      state: _0x129c42,
    } = createTestContext({
      targetId: _0x5a0fc9,
      nodeData: {
        id: _0x5a0fc9,
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
          return ((_0x412c20 = _0x129c42.nodes[_0x5a0fc9]), { imageUrl: '/output/retry.png' });
        },
      },
      startLoadingImpl: () => {
        _0x3d9641 += 1;
      },
    });
    ((_0x3832a3.btnEl = createButtonStub()),
      await _0x459447._onGenerate.call(_0x3832a3),
      assert.equal(_0x3d9641, 1),
      assert.deepEqual(_0x412c20?.images, [{ error: 'previous failure', imageUrl: '', thumbUrl: '' }]),
      assert.equal(_0x412c20?.imageUrl, ''),
      assert.equal(_0x412c20?.jobStatus, 'running'),
      assert.equal(_0x129c42.nodes[_0x5a0fc9].jobStatus, 'success'),
      assert.equal(_0x129c42.nodes[_0x5a0fc9].imageUrl, '/output/retry.png'));
  }),
  test('aigenImage task orchestration: Agnes image start clears stale task family terminal states', async () => {
    const _0x186e42 = 'node-ai-image-agnes-stale-task-family-start',
      _0x4a836a = {};
    let _0x2114cf = null,
      _0x1b4937 = 0;
    const {
      proto: _0x55dcb3,
      ctx: _0x30d2bb,
      state: _0x1add25,
    } = createTestContext({
      targetId: _0x186e42,
      nodeData: {
        id: _0x186e42,
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
          return ((_0x2114cf = _0x1add25.nodes[_0x186e42]), { imageUrl: '/output/agnes-retry.png' });
        },
      },
      startLoadingImpl: (_0x32a658) => {
        (assert.equal(_0x32a658, _0x4a836a), (_0x1b4937 += 1));
      },
    });
    ((_0x30d2bb.previewEl = _0x4a836a),
      (_0x30d2bb.btnEl = createButtonStub()),
      await _0x55dcb3._onGenerate.call(_0x30d2bb),
      assert.equal(_0x1b4937, 1),
      assert.equal(_0x2114cf?.isGenerating, true),
      assert.equal(_0x2114cf?.jobStatus, 'running'),
      assert.equal(_0x2114cf?.rhTaskId, ''),
      assert.equal(_0x2114cf?.rhTaskStatus, 'idle'),
      assert.equal(_0x2114cf?.dreaminaSubmitId, ''),
      assert.equal(_0x2114cf?.dreaminaTaskStatus, 'idle'),
      assert.equal(_0x2114cf?.dreaminaTaskPhase, 'idle'),
      assert.equal(_0x2114cf?.asyncTaskId, ''),
      assert.equal(_0x2114cf?.asyncTaskStatus, 'idle'),
      assert.equal(shouldShowGenerationBusyUi(_0x2114cf), true),
      assert.equal(_0x1add25.nodes[_0x186e42].jobStatus, 'success'),
      assert.equal(_0x1add25.nodes[_0x186e42].imageUrl, '/output/agnes-retry.png'));
  }),
  test('aigenImage task orchestration: API throw 会结束加载并标记失败', async () => {
    const _0x59533d = 'node-ai-image-throw-error',
      {
        proto: _0x5b46be,
        ctx: _0x5af32e,
        state: _0x3e4549,
      } = createTestContext({
        targetId: _0x59533d,
        nodeData: {
          id: _0x59533d,
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
    await _0x5b46be._onGenerate.call(_0x5af32e);
    const _0x377fa7 = _0x3e4549.nodes[_0x59533d];
    (assert.equal(_0x377fa7.isGenerating, false),
      assert.equal(_0x377fa7.jobStatus, 'error'),
      assert.equal(_0x377fa7.jobError, 'PPIO 创建任务失败'),
      assert.equal(_0x377fa7.asyncTaskStatus, 'failed'),
      assert.equal(_0x377fa7.images?.[0]?.error, 'PPIO 创建任务失败'),
      assert.equal(_0x377fa7.mainImageIndex, 0),
      assert.equal(_0x377fa7.imageUrl, ''));
  }),
  test('aigenImage task orchestration: API 返回单个错误对象会结束加载并标记失败', async () => {
    const _0x25751b = 'node-ai-image-object-error',
      {
        proto: _0x2f9a60,
        ctx: _0x3eec46,
        state: _0x4a3177,
      } = createTestContext({
        targetId: _0x25751b,
        nodeData: {
          id: _0x25751b,
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
    await _0x2f9a60._onGenerate.call(_0x3eec46);
    const _0x13543a = _0x4a3177.nodes[_0x25751b];
    (assert.equal(_0x13543a.isGenerating, false),
      assert.equal(_0x13543a.jobStatus, 'error'),
      assert.equal(_0x13543a.jobError, 'GRSAI 无法解析图片地址'),
      assert.equal(_0x13543a.asyncTaskStatus, 'failed'));
  }),
  test('aigenImage task orchestration: 缺少 taskId 错误会结束加载并标记失败', async () => {
    const _0x4a6e14 = 'node-ai-image-missing-task-id',
      {
        proto: _0x55aae1,
        ctx: _0x206390,
        state: _0x30cf2f,
      } = createTestContext({
        targetId: _0x4a6e14,
        nodeData: {
          id: _0x4a6e14,
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
    await _0x55aae1._onGenerate.call(_0x206390);
    const _0x475194 = _0x30cf2f.nodes[_0x4a6e14];
    (assert.equal(_0x475194.isGenerating, false),
      assert.equal(_0x475194.jobStatus, 'error'),
      assert.equal(_0x475194.jobError, '缺少异步图片任务ID，无法恢复'),
      assert.equal(_0x475194.asyncTaskStatus, 'failed'));
  }),
  test('aigenImage task orchestration: 成功结果会结束加载并标记成功', async () => {
    const _0x34cabd = 'node-ai-image-success',
      {
        proto: _0x5b0eb4,
        ctx: _0x280873,
        state: _0x37fa26,
      } = createTestContext({
        targetId: _0x34cabd,
        nodeData: {
          id: _0x34cabd,
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
    await _0x5b0eb4._onGenerate.call(_0x280873);
    const _0x4f380c = _0x37fa26.nodes[_0x34cabd];
    (assert.equal(_0x4f380c.isGenerating, false),
      assert.equal(_0x4f380c.jobStatus, 'success'),
      assert.equal(_0x4f380c.jobError, null),
      assert.equal(_0x4f380c.asyncTaskStatus, 'success'),
      assert.equal(_0x4f380c.imageUrl, '/output/success.png'));
  }),
  test('aigenImage task orchestration: GRSAI direct success unlocks repeated generation', async () => {
    const _0x25398f = 'node-ai-image-grsai-repeat-success',
      _0x2a6671 = {};
    let _0x42d09e = 0,
      _0x4f91a3 = 0,
      _0x2961b3 = 0;
    const {
      proto: _0x1e9e4c,
      ctx: _0x57ffe5,
      state: _0x186988,
    } = createTestContext({
      targetId: _0x25398f,
      nodeData: {
        id: _0x25398f,
        model: 'nano-banana-2',
        provider: 'grsai',
        aspectRatio: '1:1',
        imageSize: '2K',
        batchSize: 1,
      },
      promptText: 'repeatable prompt',
      apiImpl: {
        generateImage: async (_0xcc9f96, _0x30a7c5 = {}) => {
          return (
            (_0x42d09e += 1),
            _0x30a7c5.onTaskMeta?.({ taskId: 'grsai-direct-' + _0x42d09e, provider: 'grsai' }),
            {
              imageUrl: '/output/grsai-direct-' + _0x42d09e + '.png',
              sourceUrl: 'https://img.example.com/grsai-direct-' + _0x42d09e + '.png',
              thumbUrl: '/output/grsai-direct-' + _0x42d09e + '.png',
            }
          );
        },
      },
      startLoadingImpl: (_0x106e8c) => {
        (assert.equal(_0x106e8c, _0x2a6671), (_0x4f91a3 += 1));
      },
      stopLoadingImpl: (_0x4a33bd) => {
        (assert.equal(_0x4a33bd, _0x2a6671), (_0x2961b3 += 1));
      },
    });
    ((_0x57ffe5.previewEl = _0x2a6671),
      (_0x57ffe5.btnEl = createButtonStub()),
      await _0x1e9e4c._onGenerate.call(_0x57ffe5),
      assert.equal(_0x57ffe5._isGenerating, false),
      assert.equal(_0x57ffe5.btnEl.disabled, false),
      assert.doesNotMatch(_0x57ffe5.btnEl.innerHTML, /animation:spin/),
      await _0x1e9e4c._onGenerate.call(_0x57ffe5));
    const _0x47d34f = _0x186988.nodes[_0x25398f];
    (assert.equal(_0x42d09e, 2),
      assert.equal(_0x4f91a3, 2),
      assert.equal(_0x2961b3, 2),
      assert.equal(_0x57ffe5._isGenerating, false),
      assert.equal(_0x57ffe5.btnEl.disabled, false),
      assert.equal(_0x47d34f.isGenerating, false),
      assert.equal(_0x47d34f.jobStatus, 'success'),
      assert.equal(_0x47d34f.asyncTaskId, 'grsai-direct-2'),
      assert.equal(_0x47d34f.asyncTaskStatus, 'success'),
      assert.equal(_0x47d34f.imageUrl, '/output/grsai-direct-2.png'));
  }),
  test('aigenImage task orchestration: RunningHub cancel writes visible interruption message', async () => {
    const _0x3c98fb = 'node-ai-image-rh-cancel-visible';
    let _0x55cdc2 = 0;
    const _0x28ab06 = {
        signal: { aborted: false },
        abort() {
          this.signal.aborted = true;
        },
      },
      {
        proto: _0x49822a,
        ctx: _0x1bfb51,
        state: _0xf24a59,
      } = createTestContext({
        targetId: _0x3c98fb,
        nodeData: {
          id: _0x3c98fb,
          model: 'runninghub/2041177685895946242',
          provider: 'runninghubwf',
          generationStartTime: 0x3e8,
          rhTaskStartedAt: 0x3e8,
          rhTaskId: 'rh-cancel-visible',
          rhTaskStatus: 'running',
          rhTaskUseOpenapiQuery: true,
          isGenerating: true,
          jobStatus: 'running',
        },
        apiImpl: {
          cancelRunningHubWorkflowTask: async ({ apiKey: _0x4cd715, taskId: _0x40a0f7 }) => {
            return (
              assert.equal(_0x4cd715, 'k_rh'),
              assert.equal(_0x40a0f7, 'rh-cancel-visible'),
              { code: 0, msg: 'cancelled by user' }
            );
          },
        },
        stopLoadingImpl: () => {
          _0x55cdc2 += 1;
        },
      });
    ((_0x1bfb51._isGenerating = true),
      (_0x1bfb51._rhApiKey = 'k_rh'),
      (_0x1bfb51._rhTaskId = 'rh-cancel-visible'),
      (_0x1bfb51._rhAbortController = _0x28ab06),
      (_0x1bfb51.btnEl = createButtonStub()),
      (_0x1bfb51._updateSubmitButtonState = () => {}),
      await _0x49822a._cancelRunningHubWorkflowTask.call(_0x1bfb51));
    const _0x124d17 = _0xf24a59.nodes[_0x3c98fb];
    (assert.equal(_0x124d17.isGenerating, false),
      assert.equal(_0x124d17.jobStatus, 'cancelled'),
      assert.equal(_0x124d17.rhTaskStatus, 'cancelled'),
      assert.equal(_0x124d17.rhStatusMessage, 'cancelled by user'),
      assert.equal(_0x124d17.rhStatusCode, 0),
      assert.equal(_0x124d17.rhTaskRecovering, false),
      assert.equal(_0x28ab06.signal.aborted, true),
      assert.equal(_0x55cdc2, 1),
      assert.equal(_0x1bfb51._isGenerating, false),
      assert.doesNotMatch(_0x1bfb51.btnEl.innerHTML, /animation:spin/));
  }),
  test('aigenImage task orchestration: unmount aborts local generation polling', () => {
    const _0x4f6bc4 = 'node-ai-image-unmount-preserves-task',
      _0x1119cf = {
        signal: { aborted: false },
        abort() {
          this.signal.aborted = true;
        },
      },
      { proto: _0x23e759, ctx: _0x21ef59 } = createTestContext({
        targetId: _0x4f6bc4,
        nodeData: {
          id: _0x4f6bc4,
          model: 'runninghub/2041177685895946242',
          provider: 'runninghubwf',
          isGenerating: true,
          jobStatus: 'running',
        },
      });
    ((_0x21ef59._rhAbortController = _0x1119cf),
      _0x23e759.unmount.call(_0x21ef59),
      assert.equal(_0x1119cf.signal.aborted, true),
      assert.equal(_0x21ef59._rhAbortController, null));
  }),
  test('aigenImage task orchestration: RunningHub NanoBanana 自适应无参考图时按显示区 1600x900 映射 16:9', async () => {
    const _0x26bdd8 = 'node-ai-image-rh-nano-1',
      { proto: _0x1e0b88, ctx: _0x4bd3a0 } = createTestContext({
        targetId: _0x26bdd8,
        nodeData: {
          id: _0x26bdd8,
          model: 'runninghub-model/rhart-image-v1',
          provider: 'runninghub',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
          width: 0x640,
          height: 0x384,
        },
        nodes: {},
        incomingEdges: [],
      }),
      _0x1f7361 = await _0x1e0b88._buildPayload.call(_0x4bd3a0);
    (assert.equal(_0x1f7361.provider, 'runninghub'), assert.equal(_0x1f7361.aspectRatio, '16:9'));
  }),
  test('aigenImage task orchestration: RunningHub NanoBanana 自适应无参考图时非标准 1700x900 就近映射 16:9', async () => {
    const _0xbc0e97 = 'node-ai-image-rh-nano-2',
      { proto: _0x4ae185, ctx: _0x221fc0 } = createTestContext({
        targetId: _0xbc0e97,
        nodeData: {
          id: _0xbc0e97,
          model: 'runninghub-model/rhart-image-v1-official',
          provider: 'runninghub',
          aspectRatio: 'auto',
          imageSize: '2K',
          batchSize: 1,
          width: 0x6a4,
          height: 0x384,
        },
        nodes: {},
        incomingEdges: [],
      }),
      _0x4e5780 = await _0x4ae185._buildPayload.call(_0x221fc0);
    (assert.equal(_0x4e5780.provider, 'runninghub'), assert.equal(_0x4e5780.aspectRatio, '16:9'));
  }),
  test('aigenImage task orchestration: RunningHub GPT image 2 official 使用扩展比例', async () => {
    const _0x5d32a6 = 'node-ai-image-rh-gpt2-official',
      { proto: _0x457c17, ctx: _0x30979c } = createTestContext({
        targetId: _0x5d32a6,
        nodeData: {
          id: _0x5d32a6,
          model: 'runninghub-model/rhart-image-g-2-official',
          provider: 'runninghub',
          aspectRatio: '1:8',
          imageSize: '4K',
          batchSize: 1,
          width: 0x384,
          height: 0x6a4,
        },
        nodes: {},
        incomingEdges: [],
      }),
      _0x3aa28d = await _0x457c17._buildPayload.call(_0x30979c);
    (assert.equal(_0x3aa28d.provider, 'runninghub'),
      assert.equal(_0x3aa28d.model, 'runninghub-model/rhart-image-g-2-official'),
      assert.equal(_0x3aa28d.aspectRatio, '9:21'));
  }),
  test('aigenImage task orchestration: RunningHub GPT image 2 official 保留 1K', async () => {
    const _0x5bc4b2 = 'node-ai-image-rh-gpt2-official-1k',
      { proto: _0x223737, ctx: _0x132dc5 } = createTestContext({
        targetId: _0x5bc4b2,
        nodeData: {
          id: _0x5bc4b2,
          model: 'runninghub-model/rhart-image-g-2-official',
          provider: 'runninghub',
          aspectRatio: '1:1',
          imageSize: '1K',
          batchSize: 1,
          width: 0x384,
          height: 0x384,
        },
        nodes: {},
        incomingEdges: [],
      }),
      _0x1079b6 = await _0x223737._buildPayload.call(_0x132dc5);
    (assert.equal(_0x1079b6.provider, 'runninghub'),
      assert.equal(_0x1079b6.model, 'runninghub-model/rhart-image-g-2-official'),
      assert.equal(_0x1079b6.imageSize, '1K'),
      assert.equal(_0x1079b6.aspectRatio, '1:1'));
  }),
  test('aigenImage task orchestration: 非 NanoBanana 模型自适应无参考图按显示区域映射', async () => {
    const _0xc675c4 = 'node-ai-image-non-nano-1',
      { proto: _0x1e4d69, ctx: _0x45a1c1 } = createTestContext({
        targetId: _0xc675c4,
        nodeData: {
          id: _0xc675c4,
          model: 'ppio/seedream-5.0-lite',
          provider: 'ppio',
          aspectRatio: '自适应',
          imageSize: '2K',
          batchSize: 1,
          width: 0x6a4,
          height: 0x384,
        },
        nodes: {},
        incomingEdges: [],
      }),
      _0x4a3b18 = await _0x1e4d69._buildPayload.call(_0x45a1c1);
    (assert.equal(_0x4a3b18.provider, 'ppio'), assert.equal(_0x4a3b18.aspectRatio, '16:9'));
  }),
  test('aigenImage task orchestration: _buildResumePayload 按模型前缀推断 provider 与 key', async () => {
    const _0x6a4127 = {
        runninghub: { apiKey: 'k_runninghub', modelApiKey: 'k_runninghub_model' },
        runninghubwf: { apiKey: 'k_runninghub_wf' },
        dreamina: { apiKey: 'k_dreamina' },
        ppio: { apiKey: 'k_ppio' },
        apimart: { apiKey: 'k_apimart' },
        grsai: { apiKey: 'k_grsai' },
      },
      _0x3c0c54 = [
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
    for (const _0x125cb5 of _0x3c0c54) {
      const { proto: _0x1c1948, ctx: _0x21ae6d } = createTestContext({
          targetId: 'node-ai-image-model-resume-' + _0x125cb5.expectedProvider,
          nodeData: {
            id: 'node-ai-image-model-resume-' + _0x125cb5.expectedProvider,
            model: _0x125cb5.model,
            provider: '',
            imageSize: '2K',
            batchSize: 1,
          },
          getProviderConfigImpl: (_0x551dd1) => _0x6a4127[_0x551dd1] || {},
          isRunninghubWorkflowModelImpl: () => _0x125cb5.isWorkflow === true,
        }),
        _0x3cb07a = await _0x1c1948._buildResumePayload.call(_0x21ae6d, _0x21ae6d._data);
      (assert.equal(_0x3cb07a.provider, _0x125cb5.expectedProvider, _0x125cb5.name),
        assert.equal(_0x3cb07a.apiKey, _0x125cb5.expectedApiKey, _0x125cb5.name),
        assert.equal(_0x3cb07a.model, _0x125cb5.expectedModel || _0x125cb5.model, _0x125cb5.name));
    }
  }),
  test('aigenImage task orchestration: RunningHub model API payload does not use workflow key', async () => {
    const { proto: _0xbc7bf0, ctx: _0x497cf1 } = createTestContext({
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
        getProviderConfigImpl: (_0x59f15b) =>
          _0x59f15b === 'runninghub' ? { apiKey: 'k_runninghub_workflow_only' } : {},
      }),
      _0x2967ea = await _0xbc7bf0._buildPayload.call(_0x497cf1);
    (assert.equal(_0x2967ea.provider, 'runninghub'), assert.equal(_0x2967ea.apiKey, ''));
  }),
  test('aigenImage task orchestration: 模型族恢复分类稳定', () => {
    const { proto: _0x1038f6, ctx: _0x405c13 } = createTestContext({
      targetId: 'node-ai-image-recovery-matrix',
      nodeData: {
        id: 'node-ai-image-recovery-matrix',
        model: 'runninghub-model/rhart-image-v1',
        provider: 'runninghub',
        imageSize: '2K',
        batchSize: 1,
      },
      isRunninghubWorkflowModelImpl: (_0x395f4e) => String(_0x395f4e || '').startsWith('runninghub/'),
    });
    (assert.equal(
      _0x1038f6._isRunningHubRecoverableRunningTask.call(_0x405c13, {
        model: 'runninghub-model/rhart-image-v1',
        provider: 'runninghub',
        rhTaskId: 'rh-task-1',
        rhTaskStatus: 'pending',
      }),
      true,
    ),
      assert.equal(
        _0x1038f6._isRunningHubRecoverableRunningTask.call(_0x405c13, {
          model: 'runninghub/2041177685895946242',
          provider: '',
          rhTaskId: 'rh-task-2',
          rhTaskStatus: 'RUNNING',
        }),
        true,
      ),
      assert.equal(
        _0x1038f6._isRunningHubRecoverableRunningTask.call(_0x405c13, {
          model: 'runninghub-model/rhart-image-v1',
          provider: 'runninghub',
          rhTaskId: 'rh-task-3',
          rhTaskStatus: 'success',
        }),
        false,
      ),
      assert.equal(
        _0x1038f6._isDreaminaRecoverableRunningTask.call(_0x405c13, {
          model: 'dreamina/4.5',
          provider: 'dreamina',
          dreaminaSubmitId: 'dm-task-1',
          dreaminaTaskStatus: 'pending',
          dreaminaTaskPhase: 'generating',
        }),
        true,
      ),
      assert.equal(
        _0x1038f6._isDreaminaRecoverableRunningTask.call(_0x405c13, {
          model: 'dreamina/4.5',
          provider: 'dreamina',
          dreaminaSubmitId: 'dm-task-2',
          dreaminaTaskStatus: 'success',
          dreaminaTaskPhase: 'done',
        }),
        false,
      ),
      assert.equal(
        _0x1038f6._isDreaminaRecoverableRunningTask.call(_0x405c13, {
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
        _0x1038f6._isDreaminaRecoverableRunningTask.call(_0x405c13, {
          model: 'dreamina/4.5',
          provider: 'dreamina',
          dreaminaSubmitId: 'dm-task-status-error',
          dreaminaTaskStatus: 'error',
          dreaminaTaskPhase: 'generating',
        }),
        false,
      ),
      assert.equal(
        _0x1038f6._isAsyncRecoverableRunningTask.call(_0x405c13, {
          model: 'ppio/seedream-5.0-lite',
          asyncTaskProvider: 'ppio',
          asyncTaskKind: 'image',
          asyncTaskId: 'async-task-1',
          asyncTaskStatus: 'running',
        }),
        true,
      ),
      assert.equal(
        _0x1038f6._isAsyncRecoverableRunningTask.call(_0x405c13, {
          model: 'apimart/flux-kontext-pro',
          asyncTaskProvider: 'apimart',
          asyncTaskKind: 'image',
          asyncTaskId: 'async-task-2',
          asyncTaskStatus: 'submitted',
        }),
        true,
      ),
      assert.equal(
        _0x1038f6._isAsyncRecoverableRunningTask.call(_0x405c13, {
          model: 'runninghub-model/rhart-image-v1',
          asyncTaskProvider: 'runninghub',
          asyncTaskKind: 'image',
          asyncTaskId: 'async-task-3',
          asyncTaskStatus: 'running',
        }),
        false,
      ),
      assert.equal(
        _0x1038f6._isAsyncRecoverableRunningTask.call(_0x405c13, {
          model: 'grsai/seedream-4.0',
          asyncTaskProvider: 'grsai',
          asyncTaskKind: 'image',
          asyncTaskId: 'async-task-4',
          asyncTaskStatus: 'running',
        }),
        true,
      ),
      assert.equal(
        _0x1038f6._isAsyncRecoverableRunningTask.call(_0x405c13, {
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
    const _0x45e9e0 = 'node-ai-image-rh-workflow-empty-prompt',
      _0x2e46d2 = { runninghubwf: { apiKey: 'k_runninghub_wf' } },
      { proto: _0x27725d, ctx: _0x33f0fc } = createTestContext({
        targetId: _0x45e9e0,
        nodeData: {
          id: _0x45e9e0,
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
          { id: 'edge-rh-workflow-ref', sourceId: 'node-rh-workflow-ref', targetId: _0x45e9e0, refSlot: '' },
        ],
        promptText: '',
        getProviderConfigImpl: (_0x2a9fc5) => _0x2e46d2[_0x2a9fc5] || {},
        isRunninghubWorkflowModelImpl: (_0x48ca45) => _0x48ca45 === 'runninghub/2050306122774532097',
      }),
      _0x9a5ad3 = await _0x27725d._buildPayload.call(_0x33f0fc);
    (assert.ok(_0x9a5ad3),
      assert.equal(_0x9a5ad3.provider, 'runninghubwf'),
      assert.equal(_0x9a5ad3.apiKey, 'k_runninghub_wf'),
      assert.equal(_0x9a5ad3.prompt, ''));
  }),
  test('aigenImage task orchestration: Qwen image edit requires at least one reference image', async () => {
    const _0x4887fc = 'node-ai-image-qwen-edit-no-ref',
      _0x43c593 = globalThis.window.showToast,
      _0x563283 = [];
    globalThis.window.showToast = (_0x8e52ee, _0x408d04) => {
      _0x563283.push({ message: _0x8e52ee, type: _0x408d04 });
    };
    try {
      const { proto: _0x74c9f4, ctx: _0x4ff723 } = createTestContext({
          targetId: _0x4887fc,
          nodeData: {
            id: _0x4887fc,
            model: 'runninghub/2050306122774532097',
            provider: 'runninghubwf',
            aspectRatio: '16:9',
            imageSize: '2K',
            batchSize: 1,
          },
          promptText: 'edit',
          incomingEdges: [],
          isRunninghubWorkflowModelImpl: (_0x28ebbe) => String(_0x28ebbe || '').startsWith('runninghub/'),
        }),
        _0x58d18c = await _0x74c9f4._buildPayload.call(_0x4ff723);
      (assert.equal(_0x58d18c, null),
        assert.deepEqual(_0x563283, [{ message: '请先添加至少一张参考图再生成', type: 'warn' }]));
    } finally {
      globalThis.window.showToast = _0x43c593;
    }
  }),
  test('aigenImage task orchestration: Qwen image edit reads schema params and normalizes unsupported 4K size', async () => {
    const _0x5edc50 = 'node-ai-image-qwen-edit-defaults',
      _0x3f9024 = ['qwen-ref-1', 'qwen-ref-2', 'qwen-ref-3', 'qwen-ref-4'],
      _0x309950 = Object.fromEntries(
        _0x3f9024.map((_0x4edbf5, _0x26e516) => [
          _0x4edbf5,
          {
            id: _0x4edbf5,
            type: 'source-image',
            originalLocalPath: 'data/uploads/qwen-' + (_0x26e516 + 1) + '.png',
            width: 0x640,
            height: 0x384,
          },
        ]),
      ),
      _0x3448a6 = { runninghubwf: { apiKey: 'k_runninghub_wf' } },
      { proto: _0x47acbf, ctx: _0x2d0bd6 } = createTestContext({
        targetId: _0x5edc50,
        nodeData: {
          id: _0x5edc50,
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
        nodes: _0x309950,
        incomingEdges: _0x3f9024.map((_0x5302d8, _0x37b587) => ({
          id: 'edge-qwen-' + (_0x37b587 + 1),
          sourceId: _0x5302d8,
          targetId: _0x5edc50,
        })),
        promptText: 'keep identity',
        getProviderConfigImpl: (_0x3cc751) => _0x3448a6[_0x3cc751] || {},
        isRunninghubWorkflowModelImpl: (_0x283887) => String(_0x283887 || '').startsWith('runninghub/'),
      }),
      _0x9e9dd2 = await _0x47acbf._buildPayload.call(_0x2d0bd6);
    (assert.ok(_0x9e9dd2),
      assert.equal(_0x9e9dd2.provider, 'runninghubwf'),
      assert.equal(_0x9e9dd2.model, 'runninghub/2050306122774532097'),
      assert.equal(_0x9e9dd2.apiKey, 'k_runninghub_wf'),
      assert.equal(_0x9e9dd2.prompt, 'keep identity'),
      assert.equal(_0x9e9dd2.imageSize, '2K'),
      assert.equal(_0x9e9dd2.aspectRatio, '16:9'),
      assert.equal(_0x9e9dd2.batchSize, 1),
      assert.equal(_0x9e9dd2.ratioCapability, 'dimensions'),
      assert.equal(_0x9e9dd2.rhInstanceType, 'plus'),
      assert.equal(_0x9e9dd2.rhQwenEditMode, 'qwen2509'),
      assert.equal(_0x9e9dd2.rhQwenFirstImageMode, 'depth'),
      assert.deepEqual(_0x9e9dd2.inputUrls, [
        '/data/uploads/qwen-1.png',
        '/data/uploads/qwen-2.png',
        '/data/uploads/qwen-3.png',
      ]));
  }),
  test('aigenImage task orchestration: GRSAI NanobananaPRO legacy VIP/4K uses supported payload', async () => {
    const _0x381263 = async ({
      imageSize: _0x58f16b,
      model: _0x4ccf1,
      expectedModel: expectedModel = _0x4ccf1,
      expectedMode: expectedMode = 'vip',
      expectedImageSize: expectedImageSize = '2K',
    }) => {
      const _0x23866b = 'node-ai-image-nb-pro-vip-' + _0x58f16b + '-' + _0x4ccf1,
        { proto: _0x144511, ctx: _0x38e6ad } = createTestContext({
          targetId: _0x23866b,
          nodeData: {
            id: _0x23866b,
            model: _0x4ccf1,
            provider: 'grsai',
            aspectRatio: '1:1',
            imageSize: _0x58f16b,
            batchSize: 1,
          },
        }),
        _0x31a6e1 = await _0x144511._buildPayload.call(_0x38e6ad),
        _0x5a5879 = await _0x144511._buildResumePayload.call(_0x38e6ad, _0x38e6ad._data);
      (assert.equal(_0x31a6e1.model, expectedModel),
        assert.equal(_0x5a5879.model, expectedModel),
        assert.equal(_0x31a6e1.provider, 'grsai'),
        assert.equal(_0x5a5879.provider, 'grsai'),
        assert.equal(_0x31a6e1.mode, expectedMode),
        assert.equal(_0x31a6e1.imageSize, expectedImageSize),
        assert.equal(Object.prototype.hasOwnProperty.call(_0x5a5879, 'mode'), false));
    };
    (await _0x381263({ imageSize: '2K', model: 'nano-banana-pro-vip' }),
      await _0x381263({ imageSize: '4K', model: 'nano-banana-pro-vip' }),
      await _0x381263({ imageSize: '2K', model: 'nano-banana-pro-4k-vip', expectedImageSize: '4K' }));
  }),
  test('aigenImage task orchestration: GRSAI Nanobanana2 CL keeps CL and disables 4K payload', async () => {
    const _0x447da4 = async ({
      imageSize: _0x2c1e12,
      model: _0x4405a6,
      expectedModel: expectedModel = _0x4405a6,
      expectedMode: expectedMode = 'cl',
      expectedImageSize: expectedImageSize = '2K',
    }) => {
      const _0x40aa68 = 'node-ai-image-nb2-cl-' + _0x2c1e12 + '-' + _0x4405a6,
        { proto: _0x424647, ctx: _0x173b9c } = createTestContext({
          targetId: _0x40aa68,
          nodeData: {
            id: _0x40aa68,
            model: _0x4405a6,
            provider: 'grsai',
            aspectRatio: '1:1',
            imageSize: _0x2c1e12,
            batchSize: 1,
          },
        }),
        _0x2f0f9a = await _0x424647._buildPayload.call(_0x173b9c),
        _0x4c84c0 = await _0x424647._buildResumePayload.call(_0x173b9c, _0x173b9c._data);
      (assert.equal(_0x2f0f9a.model, expectedModel),
        assert.equal(_0x4c84c0.model, expectedModel),
        assert.equal(_0x2f0f9a.provider, 'grsai'),
        assert.equal(_0x4c84c0.provider, 'grsai'),
        assert.equal(_0x2f0f9a.mode, expectedMode),
        assert.equal(_0x2f0f9a.imageSize, expectedImageSize),
        assert.equal(Object.prototype.hasOwnProperty.call(_0x4c84c0, 'mode'), false));
    };
    (await _0x447da4({ imageSize: '2K', model: 'nano-banana-2-cl' }),
      await _0x447da4({ imageSize: '4K', model: 'nano-banana-2-cl' }),
      await _0x447da4({ imageSize: '2K', model: 'nano-banana-2-4k-cl', expectedImageSize: '4K' }));
  }),
  test('aigenImage task orchestration: manifest GRSAI nano-banana-2 passes mode selector and normalizes 4K', async () => {
    const _0x9c78d2 = async ({
      imageSize: _0x3229c8,
      mode: _0x353154,
      expectedMode: expectedMode = _0x353154,
      expectedImageSize: expectedImageSize = _0x3229c8,
    }) => {
      const _0x108d44 = 'node-ai-image-grsai-manifest-mode-' + _0x3229c8 + '-' + _0x353154,
        { proto: _0x13a1d0, ctx: _0x59b236 } = createTestContext({
          targetId: _0x108d44,
          nodeData: {
            id: _0x108d44,
            model: 'nano-banana-2',
            provider: 'grsai',
            generationParams: { imageSize: _0x3229c8, aspectRatio: '1:1', mode: _0x353154 },
            batchSize: 1,
          },
        }),
        _0x278ce3 = await _0x13a1d0._buildPayload.call(_0x59b236),
        _0x21c5df = await _0x13a1d0._buildResumePayload.call(_0x59b236, _0x59b236._data);
      (assert.equal(_0x278ce3.model, 'nano-banana-2'),
        assert.equal(_0x21c5df.model, 'nano-banana-2'),
        assert.equal(_0x278ce3.provider, 'grsai'),
        assert.equal(_0x21c5df.provider, 'grsai'),
        assert.equal(_0x278ce3.mode, expectedMode),
        assert.equal(_0x278ce3.imageSize, expectedImageSize),
        assert.equal(Object.prototype.hasOwnProperty.call(_0x21c5df, 'mode'), false));
    };
    (await _0x9c78d2({ imageSize: '2K', mode: 'normal' }),
      await _0x9c78d2({ imageSize: '2K', mode: 'cl' }),
      await _0x9c78d2({ imageSize: '4K', mode: 'cl' }),
      await _0x9c78d2({ imageSize: '4K', mode: 'normal', expectedImageSize: '2K' }));
  }),
  test('aigenImage task orchestration: manifest GRSAI pro modes keep VT/CL/VIP and normalize 4K', async () => {
    const _0xbbc9df = async ({
      imageSize: _0x274013,
      mode: _0x32fc18,
      expectedMode: expectedMode = _0x32fc18,
      expectedImageSize: expectedImageSize = _0x274013,
    }) => {
      const _0x44710f = 'node-ai-image-grsai-pro-manifest-mode-' + _0x274013 + '-' + _0x32fc18,
        { proto: _0x480fbd, ctx: _0x52d467 } = createTestContext({
          targetId: _0x44710f,
          nodeData: {
            id: _0x44710f,
            model: 'nano-banana-pro',
            provider: 'grsai',
            generationParams: { imageSize: _0x274013, aspectRatio: '1:1', mode: _0x32fc18 },
            batchSize: 1,
          },
        }),
        _0x4eeb64 = await _0x480fbd._buildPayload.call(_0x52d467),
        _0x46806f = await _0x480fbd._buildResumePayload.call(_0x52d467, _0x52d467._data);
      (assert.equal(_0x4eeb64.model, 'nano-banana-pro'),
        assert.equal(_0x46806f.model, 'nano-banana-pro'),
        assert.equal(_0x4eeb64.provider, 'grsai'),
        assert.equal(_0x46806f.provider, 'grsai'),
        assert.equal(_0x4eeb64.mode, expectedMode),
        assert.equal(_0x4eeb64.imageSize, expectedImageSize),
        assert.equal(Object.prototype.hasOwnProperty.call(_0x46806f, 'mode'), false));
    };
    (await _0xbbc9df({ imageSize: '2K', mode: 'normal' }),
      await _0xbbc9df({ imageSize: '2K', mode: 'vt' }),
      await _0xbbc9df({ imageSize: '2K', mode: 'cl' }),
      await _0xbbc9df({ imageSize: '2K', mode: 'vip' }),
      await _0xbbc9df({ imageSize: '4K', mode: 'vip' }),
      await _0xbbc9df({ imageSize: '4K', mode: 'normal', expectedImageSize: '2K' }),
      await _0xbbc9df({ imageSize: '4K', mode: 'vt', expectedImageSize: '2K' }),
      await _0xbbc9df({ imageSize: '4K', mode: 'cl', expectedImageSize: '2K' }));
  }),
  test('aigenImage task orchestration: GRSAI nanobanana cleans legacy UI params', async () => {
    const _0x52a2df = 'node-ai-image-grsai-nano-clean-legacy-params',
      { proto: _0x47c405, ctx: _0x1bd3ea } = createTestContext({
        targetId: _0x52a2df,
        nodeData: {
          id: _0x52a2df,
          model: 'nano-banana',
          provider: 'grsai',
          width: 0x640,
          height: 0x384,
          generationParams: { imageSize: '3K', aspectRatio: '自适应', mode: 'normal', batchSize: 1 },
        },
      }),
      _0x24f806 = await _0x47c405._buildPayload.call(_0x1bd3ea);
    (assert.equal(_0x24f806.imageSize, '2K'),
      assert.equal(_0x24f806.aspectRatio, 'auto'),
      assert.equal(_0x24f806.resolvedRatioLabel, 'auto'));
  }),
  test('aigenImage task orchestration: GRSAI GPT image 2 常规模式只保留 1K', async () => {
    for (const { storedModel: _0x552adc, imageSize: _0x194715 } of [
      { storedModel: 'gpt-image-2', imageSize: '1K' },
      { storedModel: 'gpt-image-2', imageSize: '2K' },
      { storedModel: 'gpt-image-2', imageSize: '4K' },
      { storedModel: 'gpt-image-2', imageSize: undefined },
    ]) {
      const _0x3957b0 = 'node-ai-image-gpt-image-2-1k-' + _0x552adc + '-' + (_0x194715 || 'default'),
        { proto: _0x273cbd, ctx: _0x103b3e } = createTestContext({
          targetId: _0x3957b0,
          nodeData: {
            id: _0x3957b0,
            model: _0x552adc,
            provider: 'grsai',
            generationParams: {
              mode: 'normal',
              aspectRatio: '9:21',
              ...(_0x194715 ? { imageSize: _0x194715 } : {}),
              batchSize: 1,
            },
          },
        }),
        _0x103af5 = await _0x273cbd._buildPayload.call(_0x103b3e),
        _0x484d0d = await _0x273cbd._buildResumePayload.call(_0x103b3e, _0x103b3e._data);
      (assert.equal(_0x103af5.model, _0x552adc),
        assert.equal(_0x484d0d.model, _0x552adc),
        assert.equal(_0x103af5.provider, 'grsai'),
        assert.equal(_0x484d0d.provider, 'grsai'),
        assert.equal(_0x103af5.mode, 'normal'),
        assert.equal(_0x103af5.imageSize, '1K'),
        assert.equal(_0x103af5.aspectRatio, '9:21'),
        assert.equal(_0x103af5.resolvedRatioLabel, '9:21'));
    }
  }),
  test('aigenImage task orchestration: GRSAI GPT image 2 VIP 模式保留全部画质', async () => {
    const _0x465a87 = async ({ imageSize: _0x462d7c, storedModel: _0x35ca38, aspectRatio: _0x371004 }) => {
      const _0x1f0da1 = 'node-ai-image-gpt-image-2-vip-mode-' + _0x462d7c + '-' + _0x35ca38,
        { proto: _0x2df8d1, ctx: _0x267110 } = createTestContext({
          targetId: _0x1f0da1,
          nodeData: {
            id: _0x1f0da1,
            model: _0x35ca38,
            provider: 'grsai',
            generationParams: { mode: 'vip', aspectRatio: _0x371004, imageSize: _0x462d7c, batchSize: 1 },
          },
        }),
        _0x535fa6 = await _0x2df8d1._buildPayload.call(_0x267110),
        _0x4ad36b = await _0x2df8d1._buildResumePayload.call(_0x267110, _0x267110._data);
      (assert.equal(_0x535fa6.model, _0x35ca38),
        assert.equal(_0x4ad36b.model, _0x35ca38),
        assert.equal(_0x535fa6.provider, 'grsai'),
        assert.equal(_0x535fa6.mode, 'vip'),
        assert.equal(_0x535fa6.imageSize, _0x462d7c),
        assert.equal(_0x535fa6.aspectRatio, _0x371004),
        assert.equal(_0x535fa6.resolvedRatioLabel, _0x371004));
    };
    (await _0x465a87({ imageSize: '1K', storedModel: 'gpt-image-2', aspectRatio: '9:16' }),
      await _0x465a87({ imageSize: '2K', storedModel: 'gpt-image-2', aspectRatio: '9:21' }),
      await _0x465a87({ imageSize: '4K', storedModel: 'gpt-image-2', aspectRatio: '2:1' }),
      await _0x465a87({ imageSize: '4K', storedModel: 'gpt-image-2-vip', aspectRatio: '9:21' }));
  }),
  test('aigenImage task orchestration: GRSAI GPT image 2 4K 保留官方支持比例', async () => {
    const _0x189f20 = 'node-ai-image-gpt-image-2-4k-fallback',
      { proto: _0x209859, ctx: _0x22e895 } = createTestContext({
        targetId: _0x189f20,
        nodeData: {
          id: _0x189f20,
          model: 'gpt-image-2',
          provider: 'grsai',
          generationParams: { mode: 'vip', aspectRatio: '1:1', imageSize: '4K', batchSize: 1 },
          width: 0x1f4,
          height: 0x1f4,
        },
      }),
      _0x365977 = await _0x209859._buildPayload.call(_0x22e895);
    (assert.equal(_0x365977.model, 'gpt-image-2'),
      assert.equal(_0x365977.provider, 'grsai'),
      assert.equal(_0x365977.mode, 'vip'),
      assert.equal(_0x365977.imageSize, '4K'),
      assert.equal(_0x365977.aspectRatio, '1:1'),
      assert.equal(_0x365977.resolvedRatioLabel, '1:1'));
  }),
  test('aigenImage task orchestration: APIMart Seedream 5 lite 保留 3K 和支持比例', async () => {
    const _0x52d39 = 'node-ai-image-apimart-seedream-5-lite',
      { proto: _0x43e415, ctx: _0x1bc0e9 } = createTestContext({
        targetId: _0x52d39,
        nodeData: {
          id: _0x52d39,
          model: 'apimart/seedream-5.0-lite',
          provider: 'apimart',
          aspectRatio: '21:9',
          imageSize: '3K',
          generationParams: { aspectRatio: '21:9', imageSize: '3K' },
          batchSize: 4,
        },
      }),
      _0x3e5d37 = await _0x43e415._buildPayload.call(_0x1bc0e9);
    (assert.equal(_0x3e5d37.provider, 'apimart'),
      assert.equal(_0x3e5d37.model, 'apimart/seedream-5.0-lite'),
      assert.equal(_0x3e5d37.imageSize, '3K'),
      assert.equal(_0x3e5d37.aspectRatio, '21:9'),
      assert.equal(_0x3e5d37.resolvedRatioLabel, '21:9'),
      assert.equal(_0x3e5d37.batchSize, 4));
  }),
  test('aigenImage task orchestration: APIMart Qwen image 2.0 使用文档比例和生成数量', async () => {
    const _0x50f3ed = 'node-ai-image-apimart-qwen-image',
      { proto: _0x1f3ee7, ctx: _0x2f1fb4 } = createTestContext({
        targetId: _0x50f3ed,
        nodeData: {
          id: _0x50f3ed,
          model: 'apimart/qwen-image-2.0',
          provider: 'apimart',
          aspectRatio: '自适应',
          imageSize: '3K',
          generationParams: { mode: 'pro', aspectRatio: '自适应', imageSize: '3K', batchSize: 6 },
          width: 0x640,
          height: 0x384,
          batchSize: 1,
        },
      }),
      _0x3e98df = await _0x1f3ee7._buildPayload.call(_0x2f1fb4);
    (assert.equal(_0x3e98df.provider, 'apimart'),
      assert.equal(_0x3e98df.model, 'apimart/qwen-image-2.0'),
      assert.equal(_0x3e98df.mode, 'pro'),
      assert.equal(_0x3e98df.imageSize, '1K'),
      assert.equal(_0x3e98df.aspectRatio, '16:9'),
      assert.equal(_0x3e98df.resolvedRatioLabel, '16:9'),
      assert.equal(_0x3e98df.batchSize, 6));
  }),
  test('aigenImage task orchestration: APIMart Z-Image-Turbo 自适应转为真实比例并透传智能改写', async () => {
    const _0x390b6c = 'node-ai-image-apimart-z-image-turbo',
      { proto: _0x57043a, ctx: _0x3a1e2e } = createTestContext({
        targetId: _0x390b6c,
        nodeData: {
          id: _0x390b6c,
          model: 'apimart/z-image-turbo',
          provider: 'apimart',
          aspectRatio: '自适应',
          imageSize: '3K',
          generationParams: { aspectRatio: '自适应', imageSize: '3K', prompt_extend: true, batchSize: 4 },
          width: 0x640,
          height: 0x384,
          batchSize: 1,
        },
      }),
      _0x166865 = await _0x57043a._buildPayload.call(_0x3a1e2e);
    (assert.equal(_0x166865.provider, 'apimart'),
      assert.equal(_0x166865.model, 'apimart/z-image-turbo'),
      assert.equal(_0x166865.imageSize, '1K'),
      assert.equal(_0x166865.aspectRatio, '16:9'),
      assert.equal(_0x166865.resolvedRatioLabel, '16:9'),
      assert.equal(_0x166865.prompt_extend, true),
      assert.equal(_0x166865.batchSize, 4));
  }),
  test('aigenImage task orchestration: APIMart Wan 2.7 收集图片入参并按入参比例自适应', async () => {
    const _0x4f5ca3 = 'node-ai-image-apimart-wan',
      _0x1575d7 = 'node-ref-apimart-wan',
      { proto: _0x556c23, ctx: _0x411306 } = createTestContext({
        targetId: _0x4f5ca3,
        nodeData: {
          id: _0x4f5ca3,
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
          width: 0x640,
          height: 0x384,
          batchSize: 1,
        },
        nodes: {
          [_0x1575d7]: {
            id: _0x1575d7,
            type: 'source-image',
            imageUrl: 'https://cdn.apimart.ai/ref-wan.png',
            width: 0x384,
            height: 0x640,
          },
        },
        incomingEdges: [{ id: 'edge-apimart-wan', sourceId: _0x1575d7, targetId: _0x4f5ca3, refSlot: '' }],
      }),
      _0x32c556 = await _0x556c23._buildPayload.call(_0x411306);
    (assert.equal(_0x32c556.provider, 'apimart'),
      assert.equal(_0x32c556.model, 'apimart/wan2.7-image'),
      assert.equal(_0x32c556.mode, 'pro'),
      assert.equal(_0x32c556.imageSize, '4K'),
      assert.equal(_0x32c556.aspectRatio, '9:16'),
      assert.equal(_0x32c556.resolvedRatioLabel, '9:16'),
      assert.equal(_0x32c556.thinking_mode, false),
      assert.equal(_0x32c556.batchSize, 4),
      assert.deepEqual(_0x32c556.inputUrls, ['https://cdn.apimart.ai/ref-wan.png']));
  }),
  test('aigenImage task orchestration: APIMart Seedream 有参考图时自适应透传 API auto', async () => {
    const _0xb36093 = 'node-ai-image-apimart-seedream-auto',
      _0x447dc4 = 'node-ref-apimart-seedream-auto',
      { proto: _0xd4f48b, ctx: _0x12a060 } = createTestContext({
        targetId: _0xb36093,
        nodeData: {
          id: _0xb36093,
          model: 'apimart/seedream-4.0',
          provider: 'apimart',
          aspectRatio: 'auto',
          imageSize: '2K',
          generationParams: { aspectRatio: 'auto', imageSize: '2K' },
          batchSize: 1,
        },
        nodes: {
          [_0x447dc4]: {
            id: _0x447dc4,
            type: 'source-image',
            imageUrl: 'https://img.example.com/seedream-ref.png',
            width: 0x640,
            height: 0x384,
          },
        },
        incomingEdges: [
          { id: 'edge-apimart-seedream-auto', sourceId: _0x447dc4, targetId: _0xb36093, refSlot: '' },
        ],
      }),
      _0x26ecf3 = await _0xd4f48b._buildPayload.call(_0x12a060);
    (assert.equal(_0x26ecf3.provider, 'apimart'),
      assert.equal(_0x26ecf3.model, 'apimart/seedream-4.0'),
      assert.equal(_0x26ecf3.aspectRatio, 'auto'),
      assert.equal(_0x26ecf3.resolvedRatioLabel, 'auto'),
      assert.equal(_0x26ecf3.ratioCapability, 'size'),
      assert.deepEqual(_0x26ecf3.inputUrls, ['https://img.example.com/seedream-ref.png']));
  }),
  test('aigenImage task orchestration: APIMart GPT image 2 透传新增比例', async () => {
    const _0x436807 = 'node-ai-image-apimart-gpt-image-2-ratio',
      { proto: _0x36d173, ctx: _0x33e193 } = createTestContext({
        targetId: _0x436807,
        nodeData: {
          id: _0x436807,
          model: 'apimart/gpt-image-2',
          provider: 'apimart',
          aspectRatio: '2:1',
          imageSize: '2K',
          generationParams: { mode: 'official', aspectRatio: '2:1', imageSize: '2K', quality: 'high' },
          batchSize: 1,
        },
      }),
      _0x464a67 = await _0x36d173._buildPayload.call(_0x33e193);
    (assert.equal(_0x464a67.provider, 'apimart'),
      assert.equal(_0x464a67.model, 'apimart/gpt-image-2'),
      assert.equal(_0x464a67.mode, 'official'),
      assert.equal(_0x464a67.imageSize, '2K'),
      assert.equal(_0x464a67.quality, 'high'),
      assert.equal(_0x464a67.aspectRatio, '2:1'),
      assert.equal(_0x464a67.resolvedRatioLabel, '2:1'));
  }),
  test('aigenImage task orchestration: APIMart GPT image 2 4K 不生成非法比例', async () => {
    const _0x124e03 = 'node-ai-image-apimart-gpt-image-2-4k',
      { proto: _0xacb716, ctx: _0x216672 } = createTestContext({
        targetId: _0x124e03,
        nodeData: {
          id: _0x124e03,
          model: 'apimart/gpt-image-2',
          provider: 'apimart',
          aspectRatio: '1:1',
          imageSize: '4K',
          generationParams: { aspectRatio: '1:1', imageSize: '4K' },
          width: 0x1f4,
          height: 0x1f4,
          batchSize: 1,
        },
      }),
      _0x4ba784 = await _0xacb716._buildPayload.call(_0x216672);
    (assert.equal(_0x4ba784.imageSize, '4K'),
      assert.equal(_0x4ba784.aspectRatio, '16:9'),
      assert.equal(_0x4ba784.resolvedRatioLabel, '16:9'));
  }),
  test('aigenImage task orchestration: APIMart GPT image 2 4K 自适应只解析到可用比例', async () => {
    const _0x4b9843 = 'node-ai-image-apimart-gpt-image-2-4k-auto',
      { proto: _0x1d3aa0, ctx: _0x24b85e } = createTestContext({
        targetId: _0x4b9843,
        nodeData: {
          id: _0x4b9843,
          model: 'apimart/gpt-image-2',
          provider: 'apimart',
          aspectRatio: '自适应',
          imageSize: '4K',
          generationParams: { aspectRatio: '自适应', imageSize: '4K' },
          width: 0x1f4,
          height: 0x1f4,
          batchSize: 1,
        },
      }),
      _0x4e116d = await _0x1d3aa0._buildPayload.call(_0x24b85e);
    (assert.equal(_0x4e116d.imageSize, '4K'),
      assert.equal(_0x4e116d.aspectRatio, '16:9'),
      assert.equal(_0x4e116d.resolvedRatioLabel, '16:9'));
  }));
