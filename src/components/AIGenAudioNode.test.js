import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  _resetPreviewRuntimeForTests,
  isPreviewNodeLoading,
  stopPreviewNodeLoading,
} from '../modules/previewMode.js';
import { createPreviewContainer as createFakePreviewContainer, installDomEnvironment as installPreviewDomStubs } from '../../tools/dom-test-environment.mjs';
import {
  _resetAssetMentionRegistryForTests,
  setAssetMentionAssets,
} from '../modules/assetMentionRegistry.js';
import { buildUiSchemaParamPatch, renderModelUiSchemaControls } from './aigenImage/uiSchemaRenderer.js';
const originalGlobals = {
    window: globalThis.window,
    document: globalThis.document,
    Node: globalThis.Node,
    navigator: globalThis.navigator,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
  },
  restorePreviewDom = installPreviewDomStubs();
if (!globalThis.window) globalThis.window = {};
typeof globalThis.window.addEventListener !== 'function' && (globalThis.window.addEventListener = () => {});
typeof globalThis.window.removeEventListener !== 'function' &&
  (globalThis.window.removeEventListener = () => {});
typeof globalThis.window.showToast !== 'function' && (globalThis.window.showToast = () => {});
typeof globalThis.window._triggerLocalCacheSave !== 'function' &&
  (globalThis.window._triggerLocalCacheSave = () => {});
!globalThis.document && (globalThis.document = {});
!globalThis.document.documentElement &&
  (globalThis.document.documentElement = { classList: { add() {}, remove() {} } });
typeof globalThis.document.addEventListener !== 'function' &&
  (globalThis.document.addEventListener = () => {});
typeof globalThis.document.removeEventListener !== 'function' &&
  (globalThis.document.removeEventListener = () => {});
typeof globalThis.document.getElementById !== 'function' && (globalThis.document.getElementById = () => null);
!globalThis.document.body && (globalThis.document.body = { appendChild() {}, removeChild() {} });
!globalThis.Node && (globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 });
!globalThis.navigator && (globalThis.navigator = { userAgent: 'node-test', platform: 'node' });
typeof globalThis.requestAnimationFrame !== 'function' &&
  (globalThis.requestAnimationFrame = (_0x3ce4b1) => setTimeout(() => _0x3ce4b1(Date.now()), 0));
typeof globalThis.cancelAnimationFrame !== 'function' &&
  (globalThis.cancelAnimationFrame = (_0x403172) => clearTimeout(_0x403172));
let store,
  AIGenAudioNode,
  originalStoreFns = null;
function restoreStore() {
  if (!store || !originalStoreFns) return;
  ((store.getState = originalStoreFns.getState),
    (store.getIncomingEdges = originalStoreFns.getIncomingEdges),
    (store.updateNodeData = originalStoreFns.updateNodeData));
}
(test.before(async () => {
  const _0x374bc8 = await import('../core/stores/appStore.js');
  store = _0x374bc8.default;
  const _0x17386a = await import('./AIGenAudioNode.js');
  ((AIGenAudioNode = _0x17386a.AIGenAudioNode),
    (originalStoreFns = {
      getState: store.getState,
      getIncomingEdges: store.getIncomingEdges,
      updateNodeData: store.updateNodeData,
    }));
}),
  test.afterEach(() => {
    (_resetPreviewRuntimeForTests(), _resetAssetMentionRegistryForTests(), restoreStore());
  }),
  test.after(() => {
    (_resetPreviewRuntimeForTests(), restoreStore());
    if (typeof originalGlobals.window === 'undefined') delete globalThis.window;
    else globalThis.window = originalGlobals.window;
    if (typeof originalGlobals.document === 'undefined') delete globalThis.document;
    else globalThis.document = originalGlobals.document;
    if (typeof originalGlobals.Node === 'undefined') delete globalThis.Node;
    else globalThis.Node = originalGlobals.Node;
    if (typeof originalGlobals.navigator === 'undefined') delete globalThis.navigator;
    else
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        writable: true,
        value: originalGlobals.navigator,
      });
    (typeof originalGlobals.requestAnimationFrame === 'undefined'
      ? delete globalThis.requestAnimationFrame
      : (globalThis.requestAnimationFrame = originalGlobals.requestAnimationFrame),
      typeof originalGlobals.cancelAnimationFrame === 'undefined'
        ? delete globalThis.cancelAnimationFrame
        : (globalThis.cancelAnimationFrame = originalGlobals.cancelAnimationFrame),
      restorePreviewDom());
  }));
function createPromptTextNode(_0x4ee39c = '') {
  return { nodeType: 3, textContent: String(_0x4ee39c || '') };
}
function createPromptElementNode({
  tagName: tagName = 'SPAN',
  className: className = '',
  dataset: dataset = {},
  textContent: textContent = '',
  childNodes: childNodes = [],
} = {}) {
  const _0x55d9f8 = String(className || '')
    .split(/\s+/)
    .filter(Boolean);
  return {
    nodeType: 1,
    tagName: tagName,
    className: className,
    classList: {
      contains(_0x370fef) {
        return _0x55d9f8.includes(String(_0x370fef || ''));
      },
    },
    dataset: { ...dataset },
    textContent: String(textContent || ''),
    childNodes: Array.isArray(childNodes) ? childNodes : [],
  };
}
function createPromptPillNode(_0x322aed, _0x22877e) {
  return createPromptElementNode({
    className: 'ref-pill',
    dataset: { label: String(_0x322aed || ''), nodeId: String(_0x22877e || '') },
    textContent: String(_0x322aed || ''),
  });
}
function collectPromptInnerText(_0x2aef58) {
  return (Array.isArray(_0x2aef58) ? _0x2aef58 : [])
    .map((_0xca0a21) => {
      const _0x348e20 = Number(_0xca0a21?.nodeType);
      if (_0x348e20 === 3) return String(_0xca0a21?.textContent || '');
      if (_0x348e20 !== 1) return '';
      if (String(_0xca0a21?.tagName || '').toUpperCase() === 'BR') return '\n';
      const _0x1cd5f6 = Array.isArray(_0xca0a21?.childNodes) ? _0xca0a21.childNodes : [];
      if (_0x1cd5f6.length > 0) return collectPromptInnerText(_0x1cd5f6);
      return String(_0xca0a21?.textContent || '');
    })
    .join('');
}
function createPromptEl(_0x22fbb7 = 'test prompt') {
  if (Array.isArray(_0x22fbb7)) {
    const _0x14fd17 = collectPromptInnerText(_0x22fbb7);
    return { innerText: _0x14fd17, textContent: _0x14fd17, childNodes: _0x22fbb7 };
  }
  const _0x336f45 = String(_0x22fbb7 || '');
  return { innerText: _0x336f45, textContent: _0x336f45, childNodes: [createPromptTextNode(_0x336f45)] };
}
function createButtonStub() {
  const _0x37591d = new Set();
  return {
    disabled: false,
    title: '',
    innerHTML: '',
    style: { color: '', cursor: '' },
    _attrs: new Map(),
    classList: {
      add(..._0xde7cda) {
        _0xde7cda.forEach((_0x1dbc5c) => _0x37591d.add(String(_0x1dbc5c || '')));
      },
      remove(..._0x41cdba) {
        _0x41cdba.forEach((_0x59b556) => _0x37591d.delete(String(_0x59b556 || '')));
      },
      toggle(_0x51b23f, _0x21a63a) {
        const _0x43e316 = String(_0x51b23f || '');
        if (_0x21a63a === true) return (_0x37591d.add(_0x43e316), true);
        if (_0x21a63a === false) return (_0x37591d.delete(_0x43e316), false);
        if (_0x37591d.has(_0x43e316)) return (_0x37591d.delete(_0x43e316), false);
        return (_0x37591d.add(_0x43e316), true);
      },
      contains(_0x1b6c76) {
        return _0x37591d.has(String(_0x1b6c76 || ''));
      },
    },
    setAttribute(_0x1c3bbc, _0x5830af) {
      this._attrs.set(String(_0x1c3bbc || ''), String(_0x5830af || ''));
    },
    removeAttribute(_0x150c00) {
      this._attrs.delete(String(_0x150c00 || ''));
    },
  };
}
function createTestContext({
  targetId: _0x1f1b9d,
  nodeData: nodeData = {},
  nodes: nodes = {},
  incomingEdges: incomingEdges = [],
  prompt: prompt = 'test prompt',
} = {}) {
  const _0x539c87 = {
    nodes: {
      ...nodes,
      [_0x1f1b9d]: {
        id: _0x1f1b9d,
        type: 'ai-audio',
        audioWorkflowKey: 'indextts2_clone',
        audioWorkflowLabel: 'indextts2音色克隆',
        provider: 'runninghubwf',
        ...nodeData,
      },
    },
  };
  ((store.getState = () => _0x539c87),
    (store.getIncomingEdges = (_0x2c48f7) =>
      incomingEdges.filter((_0x20267b) => _0x20267b.targetId === _0x2c48f7)),
    (store.updateNodeData = (_0x15c76f, _0x11e7ca) => {
      const _0x5e45aa = _0x539c87.nodes?.[_0x15c76f] || {};
      _0x539c87.nodes[_0x15c76f] = { ..._0x5e45aa, ..._0x11e7ca };
    }));
  const _0x37e0e4 = new AIGenAudioNode(_0x539c87.nodes[_0x1f1b9d]);
  return ((_0x37e0e4.promptEl = createPromptEl(prompt)), { ctx: _0x37e0e4, state: _0x539c87 });
}
(test('aigenAudio: prompt editor wires @ mention trigger and keyboard handling', () => {
  const _0x5b1abd = readFileSync(new URL('./AIGenAudioNode.js', import.meta.url), 'utf8');
  (assert.match(
    _0x5b1abd,
    /from ['"]\.\.\/modules\/nodePromptShared\.js['"];[\s\S]*this\.promptEl\.addEventListener\(['"]input['"],[\s\S]*_checkAtTrigger\(this,\s*[\w$]+\)/,
  ),
    assert.match(
      _0x5b1abd,
      /this\.promptEl\.addEventListener\(['"]keydown['"],[\s\S]*_handleMentionMenuKeyboard\([\w$]+\)[\s\S]*_handlePillKeyboard\(this,\s*[\w$]+\)/,
    ));
}),
  test('aigenAudio payload: ref-pill 文本引用会替换为真实文本', () => {
    const _0xb98f09 = 'node-audio-text-pill',
      _0x4d0bde = 'node-audio-text-ref-pill',
      { ctx: _0x3fbf27 } = createTestContext({
        targetId: _0xb98f09,
        nodes: { [_0x4d0bde]: { id: _0x4d0bde, type: 'source-text', text: '来自音频文本节点的提示词' } },
        incomingEdges: [
          { id: 'edge-audio-text-pill', sourceId: _0x4d0bde, targetId: _0xb98f09, refSlot: '' },
        ],
        prompt: [
          createPromptTextNode('旁白 '),
          createPromptPillNode('@文本1', _0x4d0bde),
          createPromptTextNode(' 开场'),
        ],
      }),
      { payload: _0x5eede1 } = _0x3fbf27._buildPayloadSnapshot();
    (assert.equal(_0x5eede1.prompt, '旁白 来自音频文本节点的提示词 开场'),
      assert.deepEqual(_0x5eede1.textInputs, ['来自音频文本节点的提示词']));
  }),
  test('aigenAudio payload: 手打 @文本1 会替换为真实文本', () => {
    const _0x38cde9 = 'node-audio-text-mention',
      _0x366a0f = 'node-audio-text-ref-mention',
      { ctx: _0x389a89 } = createTestContext({
        targetId: _0x38cde9,
        nodes: { [_0x366a0f]: { id: _0x366a0f, type: 'source-text', outputText: '直接替换的音频文本' } },
        incomingEdges: [
          { id: 'edge-audio-text-mention', sourceId: _0x366a0f, targetId: _0x38cde9, refSlot: '' },
        ],
        prompt: '旁白 @文本1 开场',
      }),
      { payload: _0x31ba3c } = _0x389a89._buildPayloadSnapshot();
    assert.equal(_0x31ba3c.prompt, '旁白 直接替换的音频文本 开场');
  }),
  test('aigenAudio payload: 未显式引用的文本入边会前置到 prompt', () => {
    const _0x18c89a = 'node-audio-text-prepend',
      _0x38d7df = 'node-audio-text-ref-prepend',
      { ctx: _0xda6ecf } = createTestContext({
        targetId: _0x18c89a,
        nodes: { [_0x38d7df]: { id: _0x38d7df, type: 'source-text', content: '前置的音频文本入参' } },
        incomingEdges: [
          { id: 'edge-audio-text-prepend', sourceId: _0x38d7df, targetId: _0x18c89a, refSlot: '' },
        ],
        prompt: '主体音频描述',
      }),
      { payload: _0x28313a } = _0xda6ecf._buildPayloadSnapshot();
    assert.equal(_0x28313a.prompt, '前置的音频文本入参\n主体音频描述');
  }),
  test('aigenAudio payload: ai-text 入参无输出时使用 prompt 作为文本内容', () => {
    const _0x5baf95 = 'node-audio-ai-text-prompt',
      _0x5b5f83 = 'node-audio-ai-text-prompt-ref',
      { ctx: _0x10107a } = createTestContext({
        targetId: _0x5baf95,
        nodes: { [_0x5b5f83]: { id: _0x5b5f83, type: 'ai-text', prompt: '来自生成文本节点的音频提示词' } },
        incomingEdges: [
          { id: 'edge-audio-ai-text-prompt', sourceId: _0x5b5f83, targetId: _0x5baf95, refSlot: '' },
        ],
        prompt: '主体音频描述',
      }),
      { payload: _0x369ec1 } = _0x10107a._buildPayloadSnapshot();
    assert.equal(_0x369ec1.prompt, '来自生成文本节点的音频提示词\n主体音频描述');
  }),
  test('aigenAudio payload: 模板触发也会解析文本入参且不影响音频引用', () => {
    const _0xb27a45 = 'node-audio-template-text',
      _0x43e593 = 'node-audio-template-text-ref',
      _0x2c8e27 = 'node-audio-template-audio-ref',
      { ctx: _0x149146 } = createTestContext({
        targetId: _0xb27a45,
        nodes: {
          [_0x43e593]: { id: _0x43e593, type: 'source-text', text: '模板里的文本入参' },
          [_0x2c8e27]: { id: _0x2c8e27, type: 'source-audio', localPath: 'output/ref.mp3' },
        },
        incomingEdges: [
          { id: 'edge-audio-template-text', sourceId: _0x43e593, targetId: _0xb27a45, refSlot: '' },
          { id: 'edge-audio-template-audio', sourceId: _0x2c8e27, targetId: _0xb27a45, refSlot: 'audioRef' },
        ],
      }),
      { payload: _0x4388c6 } = _0x149146._buildPayloadSnapshot('生成音频：@文本1');
    (assert.equal(_0x4388c6.prompt, '生成音频： 模板里的文本入参'),
      assert.deepEqual(_0x4388c6.audioRefs, [
        {
          edgeId: 'edge-audio-template-audio',
          sourceId: _0x2c8e27,
          sourceType: 'source-audio',
          refSlot: 'audioRef',
          url: '/output/ref.mp3',
        },
      ]));
  }),
  test('aigenAudio payload: /预设模板支持用户输入默认值', () => {
    const _0xd6191c = 'node-audio-template-fallback',
      { ctx: _0x2f6875 } = createTestContext({ targetId: _0xd6191c, prompt: '' }),
      _0x2524e4 = _0x2f6875._buildPayloadSnapshot('生成音频：{用户输入 || 默认音效}');
    (assert.equal(_0x2524e4.payload.prompt, '生成音频：默认音效'),
      (_0x2f6875.promptEl = createPromptEl('雨夜脚步声')));
    const _0x654bc7 = _0x2f6875._buildPayloadSnapshot('生成音频：{用户输入 || 默认音效}');
    assert.equal(_0x654bc7.payload.prompt, '生成音频：雨夜脚步声');
  }),
  test('aigenAudio payload: hidden asset audio refs fill RunningHub audio inputs', () => {
    const _0x3acb4b = 'node-audio-hidden-asset';
    setAssetMentionAssets([
      {
        id: 'asset-audio-hidden',
        items: [
          {
            name: 'voice',
            type: 'source-audio',
            nodeData: { type: 'source-audio', localPath: 'output/hidden-voice.mp3' },
          },
        ],
      },
    ]);
    const { ctx: _0x11c32a } = createTestContext({
        targetId: _0x3acb4b,
        nodeData: { promptAssetInputRefs: [{ assetId: 'asset-audio-hidden', itemIndex: 0, type: 'audio' }] },
        prompt: '请克隆这段声音',
      }),
      { payload: _0x31851e, validation: _0x52b746 } = _0x11c32a._buildPayloadSnapshot();
    (assert.equal(_0x52b746.ok, true),
      assert.equal(_0x31851e.prompt, '请克隆这段声音'),
      assert.deepEqual(_0x31851e.audioRefs, [
        {
          edgeId: '',
          sourceId: '',
          sourceType: 'asset-audio',
          refSlot: 'audioRef',
          url: '/output/hidden-voice.mp3',
          assetId: 'asset-audio-hidden',
          assetIndex: 0,
        },
      ]));
  }),
  test('aigenAudio payload: indextts2 按固定槽采集两段音频且允许空提示词', () => {
    const _0x255164 = 'node-audio-indextts2-two-audios',
      _0x10752a = 'node-audio-indextts2-ref-1',
      _0xdba617 = 'node-audio-indextts2-ref-2',
      { ctx: _0x4cfda5 } = createTestContext({
        targetId: _0x255164,
        nodes: {
          [_0x10752a]: { id: _0x10752a, type: 'source-audio', localPath: 'output/clone-voice.mp3' },
          [_0xdba617]: { id: _0xdba617, type: 'source-audio', localPath: 'output/audio-2.mp3' },
        },
        incomingEdges: [
          { id: 'edge-audio-indextts2-ref-1', sourceId: _0x10752a, targetId: _0x255164, refSlot: '' },
          {
            id: 'edge-audio-indextts2-ref-2',
            sourceId: _0xdba617,
            targetId: _0x255164,
            refSlot: 'audioTarget',
          },
        ],
        prompt: '',
      }),
      { payload: _0x31df7f, validation: _0x5404e8 } = _0x4cfda5._buildPayloadSnapshot();
    (assert.equal(_0x5404e8.ok, true),
      assert.equal(_0x31df7f.prompt, ''),
      assert.deepEqual(
        _0x31df7f.audioRefs.map((_0x4b493d) => [_0x4b493d.sourceId, _0x4b493d.refSlot, _0x4b493d.url]),
        [
          [_0x10752a, 'audioRef', '/output/clone-voice.mp3'],
          [_0xdba617, 'audio2', '/output/audio-2.mp3'],
        ],
      ));
  }),
  test('aigenAudio payload: indextts2 单音频空提示词会被拦截', () => {
    const _0x18f98e = 'node-audio-indextts2-one-audio-empty-prompt',
      _0x2209df = 'node-audio-indextts2-single-ref',
      { ctx: _0x2bfc40 } = createTestContext({
        targetId: _0x18f98e,
        nodes: { [_0x2209df]: { id: _0x2209df, type: 'source-audio', localPath: 'output/clone-voice.mp3' } },
        incomingEdges: [
          {
            id: 'edge-audio-indextts2-single-ref',
            sourceId: _0x2209df,
            targetId: _0x18f98e,
            refSlot: 'audioRef',
          },
        ],
        prompt: '',
      }),
      { validation: _0x111b9a } = _0x2bfc40._buildPayloadSnapshot();
    (assert.equal(_0x111b9a.ok, false), assert.match(_0x111b9a.message, /提示词|prompt/i));
  }),
  test('aigenAudio ui schema: RunningHub audio workflows render instance controls', () => {
    ['indextts2_clone', 'voice_convert', 'advanced_voice_clone'].forEach((_0x176aaa) => {
      const _0x19eb77 = renderModelUiSchemaControls(
        _0x176aaa,
        { generationParams: { rhInstanceType: 'plus' } },
        { placement: 'instance', variant: 'instanceToggle' },
      );
      (assert.match(_0x19eb77, /data-ui-schema-field="rhInstanceType"/),
        assert.match(_0x19eb77, /rh-vram-btn/),
        assert.match(_0x19eb77, />48G</));
    });
  }),
  test('aigenAudio ui schema: instance control patch writes only generationParams', () => {
    const _0x1cc0a9 = buildUiSchemaParamPatch(
      {
        model: 'indextts2_clone',
        rhInstanceType: 'default',
        generationParams: { rhInstanceType: 'default' },
      },
      'rhInstanceType',
      'plus',
    );
    (assert.deepEqual(_0x1cc0a9, {
      generationParams: { rhInstanceType: 'plus' },
      generationParamsByModel: { indextts2_clone: { rhInstanceType: 'plus' } },
    }),
      assert.equal(Object.prototype.hasOwnProperty.call(_0x1cc0a9, 'rhInstanceType'), false));
  }),
  test('aigenAudio payload: 进阶声音克隆使用音频1/音频2槽位且允许无音频', () => {
    const _0x47cad8 = 'node-audio-advanced-no-audio',
      { ctx: _0x45d211 } = createTestContext({
        targetId: _0x47cad8,
        nodeData: {
          audioWorkflowKey: 'advanced_voice_clone',
          audioWorkflowLabel: '进阶声音克隆',
          model: 'advanced_voice_clone',
        },
        prompt: '音频1 你好 音频2 回答 音频1 再问',
      }),
      { payload: _0x124697, validation: _0x57b1c2 } = _0x45d211._buildPayloadSnapshot();
    (assert.equal(_0x57b1c2.ok, true),
      assert.equal(_0x124697.audioWorkflowKey, 'advanced_voice_clone'),
      assert.equal(_0x124697.prompt, '[speaker_1]: 你好\n[speaker_2]: 回答\n[speaker_1]: 再问'),
      assert.deepEqual(_0x124697.audioRefs, []));
  }),
  test('aigenAudio: 进阶声音克隆无音频时允许生成随机音色 TTS', async () => {
    const _0x3bd4f1 = 'node-audio-advanced-build-no-audio',
      { ctx: _0x5c7159 } = createTestContext({
        targetId: _0x3bd4f1,
        nodeData: {
          audioWorkflowKey: 'advanced_voice_clone',
          audioWorkflowLabel: '进阶声音克隆',
          model: 'advanced_voice_clone',
        },
        prompt: '用温柔女声说：今晚月色真好。',
      });
    let _0x808981 = false;
    _0x5c7159._resolveAudioDurationSec = async () => {
      return ((_0x808981 = true), 0);
    };
    const _0x5bf96a = await _0x5c7159._buildPayload();
    (assert.ok(_0x5bf96a),
      assert.equal(_0x5bf96a.audioWorkflowKey, 'advanced_voice_clone'),
      assert.deepEqual(_0x5bf96a.audioRefs, []),
      assert.equal(_0x808981, false));
  }),
  test('aigenAudio payload: 进阶声音克隆按连接顺序填入两个固定音频槽', () => {
    const _0x1be47e = 'node-audio-advanced-slots',
      _0x3552f9 = 'node-audio-advanced-ref-1',
      _0x28402f = 'node-audio-advanced-ref-2',
      { ctx: _0x517233 } = createTestContext({
        targetId: _0x1be47e,
        nodeData: {
          audioWorkflowKey: 'advanced_voice_clone',
          audioWorkflowLabel: '进阶声音克隆',
          model: 'advanced_voice_clone',
        },
        nodes: {
          [_0x3552f9]: { id: _0x3552f9, type: 'source-audio', localPath: 'output/a1.mp3' },
          [_0x28402f]: { id: _0x28402f, type: 'source-audio', localPath: 'output/a2.mp3' },
        },
        incomingEdges: [
          { id: 'edge-audio-advanced-1', sourceId: _0x3552f9, targetId: _0x1be47e, refSlot: 'audio1' },
          { id: 'edge-audio-advanced-2', sourceId: _0x28402f, targetId: _0x1be47e, refSlot: 'audio2' },
        ],
        prompt: '双人对话',
      }),
      { payload: _0x1fe099, validation: _0x241c72 } = _0x517233._buildPayloadSnapshot();
    (assert.equal(_0x241c72.ok, true),
      assert.deepEqual(_0x1fe099.audioRefs, [
        {
          edgeId: 'edge-audio-advanced-1',
          sourceId: _0x3552f9,
          sourceType: 'source-audio',
          refSlot: 'audio1',
          url: '/output/a1.mp3',
        },
        {
          edgeId: 'edge-audio-advanced-2',
          sourceId: _0x28402f,
          sourceType: 'source-audio',
          refSlot: 'audio2',
          url: '/output/a2.mp3',
        },
      ]));
  }),
  test('aigenAudio payload: 进阶声音克隆会把空或旧音频槽归到 audio1/audio2', () => {
    const _0x22867e = 'node-audio-advanced-stale-slots',
      _0x2742bf = 'node-audio-advanced-stale-ref-1',
      _0x96e5f8 = 'node-audio-advanced-stale-ref-2',
      { ctx: _0x2f43c0 } = createTestContext({
        targetId: _0x22867e,
        nodeData: {
          audioWorkflowKey: 'advanced_voice_clone',
          audioWorkflowLabel: '进阶声音克隆',
          model: 'advanced_voice_clone',
        },
        nodes: {
          [_0x2742bf]: { id: _0x2742bf, type: 'source-audio', localPath: 'output/a1.mp3' },
          [_0x96e5f8]: { id: _0x96e5f8, type: 'source-audio', localPath: 'output/a2.mp3' },
        },
        incomingEdges: [
          {
            id: 'edge-audio-advanced-stale-1',
            sourceId: _0x2742bf,
            targetId: _0x22867e,
            refSlot: 'audioRef',
          },
          { id: 'edge-audio-advanced-stale-2', sourceId: _0x96e5f8, targetId: _0x22867e },
        ],
        prompt: '双人对话',
      }),
      { payload: _0x468338, validation: _0xd24ecc } = _0x2f43c0._buildPayloadSnapshot();
    (assert.equal(_0xd24ecc.ok, true),
      assert.deepEqual(
        _0x468338.audioRefs.map((_0x232071) => [_0x232071.sourceId, _0x232071.refSlot, _0x232071.url]),
        [
          [_0x2742bf, 'audio1', '/output/a1.mp3'],
          [_0x96e5f8, 'audio2', '/output/a2.mp3'],
        ],
      ));
  }),
  test('aigenAudio: 进阶声音克隆生成前拦截超过 15 秒音频', async () => {
    const _0x1701fd = 'node-audio-advanced-duration',
      _0x430696 = 'node-audio-advanced-duration-ref',
      { ctx: _0x360e6a } = createTestContext({
        targetId: _0x1701fd,
        nodeData: {
          audioWorkflowKey: 'advanced_voice_clone',
          audioWorkflowLabel: '进阶声音克隆',
          model: 'advanced_voice_clone',
        },
        nodes: { [_0x430696]: { id: _0x430696, type: 'source-audio', localPath: 'output/too-long.mp3' } },
        incomingEdges: [
          { id: 'edge-audio-advanced-duration', sourceId: _0x430696, targetId: _0x1701fd, refSlot: 'audio1' },
        ],
        prompt: '双人对话',
      }),
      _0x367e87 = [],
      _0x3274ee = globalThis.window.showToast;
    ((globalThis.window.showToast = (_0x8647ae, _0x2155e7) => _0x367e87.push([_0x8647ae, _0x2155e7])),
      (_0x360e6a._resolveAudioDurationSec = async () => 15.2));
    try {
      const _0x194940 = await _0x360e6a._buildPayload();
      (assert.equal(_0x194940, null),
        assert.equal(_0x367e87.length, 1),
        assert.match(_0x367e87[0][0], /3~15 秒/),
        assert.equal(_0x367e87[0][1], 'warn'));
    } finally {
      globalThis.window.showToast = _0x3274ee;
    }
  }),
  test('aigenAudio: 进阶声音克隆生成前拦截少于 3 秒音频', async () => {
    const _0x30f8b9 = 'node-audio-advanced-duration-short',
      _0x2338db = 'node-audio-advanced-duration-short-ref',
      { ctx: _0x4b0528 } = createTestContext({
        targetId: _0x30f8b9,
        nodeData: {
          audioWorkflowKey: 'advanced_voice_clone',
          audioWorkflowLabel: '进阶声音克隆',
          model: 'advanced_voice_clone',
        },
        nodes: { [_0x2338db]: { id: _0x2338db, type: 'source-audio', localPath: 'output/too-short.mp3' } },
        incomingEdges: [
          {
            id: 'edge-audio-advanced-duration-short',
            sourceId: _0x2338db,
            targetId: _0x30f8b9,
            refSlot: 'audio1',
          },
        ],
        prompt: '音频1说：你终于来了。',
      }),
      _0x5ea59f = [],
      _0x2d294f = globalThis.window.showToast;
    ((globalThis.window.showToast = (_0xe6f441, _0x4ed0a8) => _0x5ea59f.push([_0xe6f441, _0x4ed0a8])),
      (_0x4b0528._resolveAudioDurationSec = async () => 2.9));
    try {
      const _0xfe0884 = await _0x4b0528._buildPayload();
      (assert.equal(_0xfe0884, null),
        assert.equal(_0x5ea59f.length, 1),
        assert.match(_0x5ea59f[0][0], /3~15 秒/),
        assert.equal(_0x5ea59f[0][1], 'warn'));
    } finally {
      globalThis.window.showToast = _0x2d294f;
    }
  }),
  test('aigenAudio: 音频工作流用法提示随 manifest 切换', () => {
    const _0x1f1ea8 = 'node-audio-advanced-help-tip',
      { ctx: _0x2a2ecc, state: _0x51e912 } = createTestContext({
        targetId: _0x1f1ea8,
        nodeData: {
          audioWorkflowKey: 'advanced_voice_clone',
          audioWorkflowLabel: '进阶声音克隆',
          model: 'advanced_voice_clone',
        },
      });
    (assert.match(_0x2a2ecc._getGenerationNodeHelpText(), /进阶声音克隆用法/),
      (_0x51e912.nodes[_0x1f1ea8] = {
        ..._0x51e912.nodes[_0x1f1ea8],
        audioWorkflowKey: 'indextts2_clone',
        model: 'indextts2_clone',
      }),
      (_0x2a2ecc._data = _0x51e912.nodes[_0x1f1ea8]),
      assert.match(_0x2a2ecc._getGenerationNodeHelpText(), /indextts2音色克隆用法/),
      (_0x51e912.nodes[_0x1f1ea8] = {
        ..._0x51e912.nodes[_0x1f1ea8],
        audioWorkflowKey: 'voice_convert',
        model: 'voice_convert',
      }),
      (_0x2a2ecc._data = _0x51e912.nodes[_0x1f1ea8]),
      assert.match(_0x2a2ecc._getGenerationNodeHelpText(), /音色转换用法/));
  }),
  test('aigenAudio: 旧 RunningHub 模型 ID 不再作为工作流 alias', () => {
    const _0xf65daf = 'node-audio-advanced-help-tip-model-id',
      { ctx: _0x2cc4d6 } = createTestContext({
        targetId: _0xf65daf,
        nodeData: {
          audioWorkflowKey: 'runninghub/2050165249344585729',
          model: 'runninghub/2050165249344585729',
        },
      });
    assert.equal(_0x2cc4d6._getCurrentWorkflow().key, 'indextts2_clone');
  }),
  test('aigenAudio: 进阶声音克隆中文标签也会显示用法提示', () => {
    const _0x126882 = 'node-audio-advanced-help-tip-label',
      { ctx: _0x5f2f1e } = createTestContext({
        targetId: _0x126882,
        nodeData: {
          audioWorkflowKey: '进阶声音克隆',
          audioWorkflowLabel: '进阶声音克隆',
          model: '进阶声音克隆',
        },
      });
    (assert.equal(_0x5f2f1e._getCurrentWorkflow().key, 'advanced_voice_clone'),
      assert.match(_0x5f2f1e._getGenerationNodeHelpText(), /进阶声音克隆用法/));
  }),
  test('aigenAudio: 进阶声音克隆未授权时打开订阅弹窗且不构建 payload', async () => {
    const _0x2be5c2 = 'node-audio-advanced-vip',
      { ctx: _0x31ee3c } = createTestContext({
        targetId: _0x2be5c2,
        nodeData: {
          audioWorkflowKey: 'advanced_voice_clone',
          audioWorkflowLabel: '进阶声音克隆',
          model: 'advanced_voice_clone',
        },
        prompt: '双人对话',
      }),
      _0x323614 = globalThis.window.isModelAllowedBySubscription,
      _0x30770a = globalThis.window.openSubscriptionDialog,
      _0x3bf1ab = globalThis.window.ensureSubscriptionInstallId,
      _0x109688 = [];
    let _0x4eb132 = false;
    ((globalThis.window.isModelAllowedBySubscription = () => false),
      (globalThis.window.openSubscriptionDialog = (_0x515977) => _0x109688.push(_0x515977)),
      (globalThis.window.ensureSubscriptionInstallId = async () => 'install-should-not-run'),
      (_0x31ee3c._buildPayload = async () => {
        return ((_0x4eb132 = true), { prompt: '不应构建' });
      }),
      (_0x31ee3c._updateSubmitButtonState = () => {}));
    try {
      (await _0x31ee3c._onGenerate(),
        assert.equal(_0x4eb132, false),
        assert.equal(_0x109688.length, 1),
        assert.deepEqual(_0x109688[0], {
          modelId: 'runninghub/2050165249344585729',
          provider: 'runninghubwf',
        }));
    } finally {
      ((globalThis.window.isModelAllowedBySubscription = _0x323614),
        (globalThis.window.openSubscriptionDialog = _0x30770a),
        (globalThis.window.ensureSubscriptionInstallId = _0x3bf1ab));
    }
  }),
  test('aigenAudio: 选择进阶声音克隆时未授权会先打开订阅弹窗', () => {
    const _0x1d9d8d = 'node-audio-advanced-select-vip',
      { ctx: _0x11f805, state: _0x39df3a } = createTestContext({
        targetId: _0x1d9d8d,
        nodeData: {
          audioWorkflowKey: 'indextts2_clone',
          audioWorkflowLabel: 'indextts2音色克隆',
          model: 'indextts2_clone',
        },
        prompt: '旁白正文',
      }),
      _0x24b74a = globalThis.window.isModelAllowedBySubscription,
      _0x1a79f5 = globalThis.window.openSubscriptionDialog,
      _0xf22fe3 = [];
    ((globalThis.window.isModelAllowedBySubscription = () => false),
      (globalThis.window.openSubscriptionDialog = (_0x46b363) => _0xf22fe3.push(_0x46b363)));
    try {
      (_0x11f805._setSelectedWorkflow('advanced_voice_clone'),
        assert.equal(_0x39df3a.nodes[_0x1d9d8d].audioWorkflowKey, 'indextts2_clone'),
        assert.equal(_0xf22fe3.length, 1),
        assert.equal(_0xf22fe3[0].modelId, 'runninghub/2050165249344585729'),
        assert.equal(_0xf22fe3[0].provider, 'runninghubwf'),
        assert.equal(typeof _0xf22fe3[0].onSuccess, 'function'));
    } finally {
      ((globalThis.window.isModelAllowedBySubscription = _0x24b74a),
        (globalThis.window.openSubscriptionDialog = _0x1a79f5));
    }
  }),
  test('aigenAudio: 进阶声音克隆授权成功回调后完成模型选择', () => {
    const _0x35d1ed = 'node-audio-advanced-select-success',
      { ctx: _0x11bc11, state: _0x3e4207 } = createTestContext({
        targetId: _0x35d1ed,
        nodeData: {
          audioWorkflowKey: 'indextts2_clone',
          audioWorkflowLabel: 'indextts2音色克隆',
          model: 'indextts2_clone',
        },
        prompt: '旁白正文',
      }),
      _0x70c7cf = globalThis.window.isModelAllowedBySubscription,
      _0x26afaa = globalThis.window.openSubscriptionDialog;
    let _0x46898a = false,
      _0x3e8c99 = null;
    ((globalThis.window.isModelAllowedBySubscription = () => _0x46898a),
      (globalThis.window.openSubscriptionDialog = (_0x29321f) => {
        _0x3e8c99 = _0x29321f.onSuccess;
      }));
    try {
      (_0x11bc11._setSelectedWorkflow('advanced_voice_clone'),
        assert.equal(_0x3e4207.nodes[_0x35d1ed].audioWorkflowKey, 'indextts2_clone'),
        (_0x46898a = true),
        _0x3e8c99(),
        assert.equal(_0x3e4207.nodes[_0x35d1ed].audioWorkflowKey, 'advanced_voice_clone'),
        assert.equal(_0x3e4207.nodes[_0x35d1ed].audioWorkflowLabel, '进阶声音克隆'),
        assert.equal(_0x3e4207.nodes[_0x35d1ed].model, 'advanced_voice_clone'));
    } finally {
      ((globalThis.window.isModelAllowedBySubscription = _0x70c7cf),
        (globalThis.window.openSubscriptionDialog = _0x26afaa));
    }
  }),
  test('aigenAudio payload: manifest instance param is read from generationParams', () => {
    const _0x370588 = 'node-audio-instance-generation-params',
      { ctx: _0x43a6c5 } = createTestContext({
        targetId: _0x370588,
        nodeData: {
          audioWorkflowKey: 'indextts2_clone',
          audioWorkflowLabel: 'indextts2音色克隆',
          model: 'indextts2_clone',
          rhInstanceType: 'default',
          generationParams: { rhInstanceType: 'plus' },
        },
        nodes: {
          'audio-ref-instance': {
            id: 'audio-ref-instance',
            type: 'source-audio',
            localPath: 'output/ref.mp3',
          },
        },
        incomingEdges: [
          {
            id: 'edge-audio-instance',
            sourceId: 'audio-ref-instance',
            targetId: _0x370588,
            refSlot: 'audioRef',
          },
        ],
        prompt: '旁白正文',
      }),
      { payload: _0x255824 } = _0x43a6c5._buildPayloadSnapshot();
    assert.equal(_0x255824.rhInstanceType, 'plus');
  }),
  test('aigenAudio state sync: refSlot changes trigger ref bar refresh', () => {
    const _0x4019e5 = globalThis.document,
      _0x52ce4c = 'node-audio-refslot-refresh',
      _0x53f5d4 = [
        { id: 'edge-audio-ref', sourceId: 'audio-ref', targetId: _0x52ce4c, refSlot: 'audioRef' },
        { id: 'edge-text-ref', sourceId: 'text-ref', targetId: _0x52ce4c, refSlot: 'textRef' },
      ];
    try {
      globalThis.document = { ...globalThis.document, activeElement: null };
      const { ctx: _0x31f038, state: _0x1bc7c6 } = createTestContext({
        targetId: _0x52ce4c,
        nodes: {
          'audio-ref': { id: 'audio-ref', type: 'source-audio', localPath: 'output/ref.mp3', _bizRev: 1 },
          'text-ref': { id: 'text-ref', type: 'source-text', text: '旁白', _bizRev: 1 },
        },
        incomingEdges: _0x53f5d4,
      });
      let _0x3b4400 = 0;
      ((_0x31f038._renderRefBar = () => {
        _0x3b4400 += 1;
      }),
        (_0x31f038._refreshWorkflowUi = () => {}),
        (_0x31f038._syncPickConnectVisualState = () => {}),
        (_0x31f038._maybeResumeRunningHubTask = () => {}),
        (_0x31f038._updateSubmitButtonState = () => {}),
        (_0x31f038.promptEl = { innerHTML: '', style: { removeProperty() {} }, querySelectorAll: () => [] }),
        _0x31f038.update(_0x1bc7c6.nodes[_0x52ce4c]),
        assert.equal(_0x3b4400, 1),
        (_0x53f5d4[0] = { ..._0x53f5d4[0], refSlot: 'textRef' }),
        (_0x53f5d4[1] = { ..._0x53f5d4[1], refSlot: 'audioRef' }),
        _0x31f038.update(_0x1bc7c6.nodes[_0x52ce4c]),
        assert.equal(_0x3b4400, 2));
    } finally {
      if (typeof _0x4019e5 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x4019e5;
    }
  }),
  test('aigenAudio workflow selection initializes schema defaults and preserves memory', () => {
    const _0x56ed9c = 'node-audio-schema-selection-memory',
      { ctx: _0x4cd6ad, state: _0x3dc7de } = createTestContext({
        targetId: _0x56ed9c,
        nodeData: {
          audioWorkflowKey: 'indextts2_clone',
          audioWorkflowLabel: 'indextts2音色克隆',
          model: 'indextts2_clone',
          generationParams: { rhInstanceType: 'plus' },
          generationParamsByModel: { voice_convert: { rhInstanceType: 'plus' } },
        },
        prompt: '旁白正文',
      });
    (_0x4cd6ad._setSelectedWorkflow('voice_convert'),
      assert.equal(_0x3dc7de.nodes[_0x56ed9c].audioWorkflowKey, 'voice_convert'),
      assert.equal(_0x3dc7de.nodes[_0x56ed9c].generationParams.rhInstanceType, 'plus'),
      assert.deepEqual(_0x3dc7de.nodes[_0x56ed9c].generationParamsByModel, {
        indextts2_clone: { rhInstanceType: 'plus' },
        voice_convert: { rhInstanceType: 'plus' },
      }));
  }),
  test('aigenAudio: 开发者模式下 /预设 仅回填最终提示词不直接生成', async () => {
    const _0x2ce8b3 = globalThis.window.DEV_MODE;
    globalThis.window.DEV_MODE = true;
    try {
      const _0x314687 = 'node-audio-template-dev-preview',
        { ctx: _0x54b105, state: _0x2a44f9 } = createTestContext({ targetId: _0x314687, prompt: '旁白正文' });
      let _0x2d0865 = false;
      ((_0x54b105._buildPayload = async () => ({ prompt: '生成音频：旁白正文' })),
        (_0x54b105._updateSubmitButtonState = () => {}),
        (_0x54b105._stopRunningHubRecovery = () => {}),
        (_0x54b105._setGeneratingUi = () => {
          _0x2d0865 = true;
        }),
        (_0x54b105.previewEl = {}),
        (_0x54b105.btnEl = null),
        await _0x54b105._onGenerate('生成音频：{用户输入}'),
        assert.equal(_0x2d0865, false),
        assert.equal(_0x2a44f9.nodes[_0x314687].prompt, '生成音频：旁白正文'),
        assert.equal(_0x54b105.promptEl.innerHTML, '生成音频：旁白正文'));
    } finally {
      globalThis.window.DEV_MODE = _0x2ce8b3;
    }
  }),
  test('aigenAudio: 预览模式下点击生成只启动假加载不发请求', async () => {
    const _0x1896df = globalThis.window.PREVIEW_MODE;
    globalThis.window.PREVIEW_MODE = true;
    try {
      const _0x32e1bf = 'node-audio-preview-loading',
        { ctx: _0x8f6e68 } = createTestContext({ targetId: _0x32e1bf });
      let _0x183865 = false;
      ((_0x8f6e68.previewEl = createFakePreviewContainer()),
        (_0x8f6e68.btnEl = createButtonStub()),
        (_0x8f6e68._updateSubmitButtonState = () => {}),
        (_0x8f6e68._buildPayload = async () => {
          return ((_0x183865 = true), { prompt: '预览模式不应走到这里' });
        }),
        await _0x8f6e68._onGenerate(),
        assert.equal(_0x183865, false),
        assert.equal(isPreviewNodeLoading(_0x32e1bf), true),
        assert.equal(_0x8f6e68.btnEl.disabled, true),
        assert.match(_0x8f6e68.btnEl.innerHTML, /animation:spin/),
        stopPreviewNodeLoading(_0x32e1bf),
        assert.equal(_0x8f6e68.btnEl.disabled, false),
        assert.doesNotMatch(_0x8f6e68.btnEl.innerHTML, /animation:spin/));
    } finally {
      globalThis.window.PREVIEW_MODE = _0x1896df;
    }
  }),
  test('aigenAudio submit button: running task state is read from unified selector', () => {
    const _0x2aaa44 = 'node-audio-running-button-state',
      { ctx: _0x332257, state: _0x3cbdbb } = createTestContext({
        targetId: _0x2aaa44,
        nodeData: { rhTaskId: 'rh-audio-running', rhTaskStatus: 'running', isGenerating: false },
      });
    ((_0x332257.btnEl = createButtonStub()),
      (_0x332257._isGenerating = false),
      (_0x3cbdbb.nodes[_0x2aaa44] = {
        ..._0x3cbdbb.nodes[_0x2aaa44],
        rhTaskId: 'rh-audio-running',
        rhTaskStatus: 'running',
      }),
      _0x332257._updateSubmitButtonState(),
      assert.equal(_0x332257.btnEl.disabled, false),
      assert.equal(_0x332257.btnEl.style.cursor, ''),
      assert.equal(_0x332257.btnEl.classList.contains('is-task-cancel'), true),
      assert.match(_0x332257.btnEl.innerHTML, /v2-task-cancel-spin/),
      (_0x332257._rhCancelInFlight = true),
      _0x332257._updateSubmitButtonState(),
      assert.equal(_0x332257.btnEl.disabled, true),
      assert.equal(_0x332257.btnEl.style.cursor, 'var(--unavailable-cursor)'));
  }),
  test('aigenAudio task orchestration: running RH store state cancels even when local flag is stale', async () => {
    const _0x1308db = 'node-audio-running-store-cancels',
      { ctx: _0x31bfce, state: _0x3e0a63 } = createTestContext({
        targetId: _0x1308db,
        nodeData: {
          rhTaskId: 'rh-audio-running',
          rhTaskStatus: 'running',
          jobStatus: 'running',
          isGenerating: true,
        },
      });
    let _0x1718c2 = 0,
      _0x57a0ac = 0;
    ((_0x31bfce._isGenerating = false),
      (_0x31bfce._cancelRunningHubWorkflowTask = async () => {
        _0x1718c2 += 1;
      }),
      (_0x31bfce._onGenerate = async () => {
        _0x57a0ac += 1;
      }),
      (_0x3e0a63.nodes[_0x1308db] = {
        ..._0x3e0a63.nodes[_0x1308db],
        rhTaskId: 'rh-audio-running',
        rhTaskStatus: 'running',
        jobStatus: 'running',
        isGenerating: true,
      }),
      await _0x31bfce._handleGenerateOrCancel(),
      assert.equal(_0x1718c2, 1),
      assert.equal(_0x57a0ac, 0));
  }),
  test('aigenAudio submit button: terminal store state overrides stale local busy flag', () => {
    const _0xbb4324 = 'node-audio-terminal-overrides-local-busy',
      { ctx: _0x2e64ec, state: _0x548c44 } = createTestContext({
        targetId: _0xbb4324,
        nodeData: {
          rhTaskId: 'rh-audio-failed',
          rhTaskStatus: 'failed',
          jobStatus: 'error',
          isGenerating: true,
        },
      });
    ((_0x2e64ec.btnEl = createButtonStub()),
      _0x2e64ec.btnEl.classList.add('is-task-cancel'),
      (_0x2e64ec.btnEl.innerHTML = '<svg><g class="v2-task-cancel-spin"></g></svg>'),
      (_0x2e64ec._isGenerating = true),
      (_0x548c44.nodes[_0xbb4324] = {
        ..._0x548c44.nodes[_0xbb4324],
        rhTaskStatus: 'failed',
        jobStatus: 'error',
        isGenerating: true,
      }),
      _0x2e64ec._setGeneratingUi(true),
      assert.equal(_0x2e64ec.btnEl.classList.contains('is-task-cancel'), false),
      assert.doesNotMatch(_0x2e64ec.btnEl.innerHTML, /v2-task-cancel-spin/));
  }),
  test('aigenAudio state sync: running RH state keeps preview loading over previous result', async () => {
    const _0xf1f3e4 = 'node-audio-rh-existing-result-loading',
      { ctx: _0x4d3cf9, state: _0x315834 } = createTestContext({
        targetId: _0xf1f3e4,
        nodeData: {
          audioUrl: '/output/previous.mp3',
          src: '/output/previous.mp3',
          localPath: 'output/previous.mp3',
          rhTaskId: 'rh-audio-running',
          rhTaskStatus: 'running',
          isGenerating: true,
          jobStatus: 'running',
        },
      });
    ((_0x4d3cf9.previewEl = createFakePreviewContainer()),
      (_0x4d3cf9._syncPromptBoxSizeFromData = () => {}),
      (_0x4d3cf9._syncWorkflowDefaults = () => {}),
      (_0x4d3cf9._enforceWorkflowAudioInputLimit = () => {}),
      (_0x4d3cf9._applyResultWideLayout = () => {}),
      (_0x4d3cf9._setAudioPreviewResultState = () => {}),
      (_0x4d3cf9._syncStatusOverlay = () => {}),
      (_0x4d3cf9._refreshWorkflowUi = () => {}),
      (_0x4d3cf9._renderRefBar = () => {}),
      (_0x4d3cf9._syncPickConnectVisualState = () => {}),
      (_0x4d3cf9._maybeResumeRunningHubTask = () => {}),
      (_0x4d3cf9._updateSubmitButtonState = () => {}),
      _0x4d3cf9.update(_0x315834.nodes[_0xf1f3e4]),
      await new Promise((_0x4b8bde) => setTimeout(_0x4b8bde, 70)),
      assert.equal(_0x4d3cf9.previewEl.classList.contains('img-preview-loading'), true),
      assert.equal(!!_0x4d3cf9.previewEl.querySelector('.img-loading-overlay'), true));
  }),
  test('aigenAudio result renderer: stores persisted audio patch through unified renderer', async () => {
    const _0x7e1293 = 'node-audio-result-renderer',
      { ctx: _0x185cc6, state: _0x8e9933 } = createTestContext({ targetId: _0x7e1293 }),
      _0x2cf0e2 = [];
    let _0x1bd3b2 = null,
      _0x41c307 = null;
    ((_0x185cc6._persistAudioOutput = async (_0x2775c7) => {
      return (_0x2cf0e2.push(_0x2775c7), { localPath: 'output/final.mp3', audioDuration: 7.5 });
    }),
      (_0x185cc6._dispatchGenerationHistoryAudio = (_0xa42629) => {
        _0x1bd3b2 = _0xa42629;
      }),
      (_0x185cc6._applyResultWideLayout = (_0x321220) => {
        _0x41c307 = _0x321220;
      }));
    const _0x47e4e7 = await _0x185cc6._applyAudioResultAndStore(
        { audioUrl: 'https://cdn.example.com/final.mp3' },
        Date.now() - 10,
      ),
      _0x53ecad = _0x8e9933.nodes[_0x7e1293];
    (assert.deepEqual(_0x2cf0e2, ['https://cdn.example.com/final.mp3']),
      assert.equal(_0x53ecad.jobStatus, 'success'),
      assert.equal(_0x53ecad.jobError, null),
      assert.equal(_0x53ecad.audioUrl, '/output/final.mp3'),
      assert.equal(_0x53ecad.src, '/output/final.mp3'),
      assert.equal(_0x53ecad.localPath, 'output/final.mp3'),
      assert.equal(_0x53ecad.audioDuration, 7.5),
      assert.equal(_0x53ecad.rhStatusMessage, null),
      assert.equal(_0x47e4e7.finalUrl, '/output/final.mp3'),
      assert.equal(_0x47e4e7.finalLocalPath, 'output/final.mp3'),
      assert.equal(_0x1bd3b2.audioUrl, '/output/final.mp3'),
      assert.equal(_0x1bd3b2.audioDuration, 7.5),
      assert.equal(_0x41c307.audioUrl, '/output/final.mp3'),
      assert.equal(_0x41c307.audioDuration, 7.5));
  }));
