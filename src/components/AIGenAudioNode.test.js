import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  _resetPreviewRuntimeForTests,
  isPreviewNodeLoading,
  stopPreviewNodeLoading,
} from '../modules/previewMode.js';
import {
  createPreviewContainer as createFakePreviewContainer,
  installDomEnvironment as installPreviewDomStubs,
} from '../../tools/dom-test-environment.mjs';
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
  (globalThis.requestAnimationFrame = (handler) => setTimeout(() => handler(Date.now()), 0));
typeof globalThis.cancelAnimationFrame !== 'function' &&
  (globalThis.cancelAnimationFrame = (value) => clearTimeout(value));
let store,
  AIGenAudioNode,
  originalStoreFns = null;
function restoreStore() {
  if (!store || !originalStoreFns) return;
  ((store.getState = originalStoreFns.getState),
    (store.getStateRaw = originalStoreFns.getStateRaw),
    (store.getIncomingEdges = originalStoreFns.getIncomingEdges),
    (store.updateNodeData = originalStoreFns.updateNodeData));
}
(test.before(async () => {
  const importValue = await import('../core/stores/appStore.js');
  store = importValue.default;
  const importValue2 = await import('./AIGenAudioNode.js');
  ((AIGenAudioNode = importValue2.AIGenAudioNode),
    (originalStoreFns = {
      getState: store.getState,
      getStateRaw: store.getStateRaw,
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
function createPromptTextNode(item = '') {
  return { nodeType: 3, textContent: String(item || '') };
}
function createPromptElementNode({
  tagName: tagName = 'SPAN',
  className: className = '',
  dataset: dataset = {},
  textContent: textContent = '',
  childNodes: childNodes = [],
} = {}) {
  const list = String(className || '')
    .split(/\s+/)
    .filter(Boolean);
  return {
    nodeType: 1,
    tagName: tagName,
    className: className,
    classList: {
      contains(key) {
        return list.includes(String(key || ''));
      },
    },
    dataset: { ...dataset },
    textContent: String(textContent || ''),
    childNodes: Array.isArray(childNodes) ? childNodes : [],
  };
}
function createPromptPillNode(index, result) {
  return createPromptElementNode({
    className: 'ref-pill',
    dataset: { label: String(index || ''), nodeId: String(result || '') },
    textContent: String(index || ''),
  });
}
function collectPromptInnerText(data) {
  return (Array.isArray(data) ? data : [])
    .map((el) => {
      const count = Number(el?.nodeType);
      if (count === 3) return String(el?.textContent || '');
      if (count !== 1) return '';
      if (String(el?.tagName || '').toUpperCase() === 'BR') return '\n';
      const list2 = Array.isArray(el?.childNodes) ? el.childNodes : [];
      if (list2.length > 0) return collectPromptInnerText(list2);
      return String(el?.textContent || '');
    })
    .join('');
}
function createPromptEl(childNodes2 = 'test prompt') {
  if (Array.isArray(childNodes2)) {
    const innerText = collectPromptInnerText(childNodes2);
    return { innerText: innerText, textContent: innerText, childNodes: childNodes2 };
  }
  const innerText2 = String(childNodes2 || '');
  return { innerText: innerText2, textContent: innerText2, childNodes: [createPromptTextNode(innerText2)] };
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
      add(...list3) {
        list3.forEach((item2) => map.add(String(item2 || '')));
      },
      remove(...list4) {
        list4.forEach((item3) => map.delete(String(item3 || '')));
      },
      toggle(options, target) {
        const source = String(options || '');
        if (target === true) return (map.add(source), true);
        if (target === false) return (map.delete(source), false);
        if (map.has(source)) return (map.delete(source), false);
        return (map.add(source), true);
      },
      contains(next) {
        return map.has(String(next || ''));
      },
    },
    setAttribute(current, entry) {
      this._attrs.set(String(current || ''), String(entry || ''));
    },
    removeAttribute(record) {
      this._attrs.delete(String(record || ''));
    },
  };
}
function createTestContext({
  targetId: targetId,
  nodeData: nodeData = {},
  nodes: nodes = {},
  incomingEdges: incomingEdges = [],
  prompt: prompt = 'test prompt',
} = {}) {
  const state = {
    nodes: {
      ...nodes,
      [targetId]: {
        id: targetId,
        type: 'ai-audio',
        audioWorkflowKey: 'indextts2_clone',
        audioWorkflowLabel: 'indextts2音色克隆',
        provider: 'runninghubwf',
        ...nodeData,
      },
    },
  };
  ((store.getState = () => state),
    (store.getStateRaw = () => state),
    (store.getIncomingEdges = (payload) => incomingEdges.filter((item4) => item4.targetId === payload)),
    (store.updateNodeData = (handle, args) => {
      const args2 = state.nodes?.[handle] || {};
      state.nodes[handle] = { ...args2, ...args };
    }));
  const ctx = new AIGenAudioNode(state.nodes[targetId]);
  return ((ctx.promptEl = createPromptEl(prompt)), { ctx: ctx, state: state });
}
(test('aigenAudio: prompt editor wires @ mention trigger and keyboard handling', () => {
  const fileSync = readFileSync(new URL('./AIGenAudioNode.js', import.meta.url), 'utf8');
  (assert.match(
    fileSync,
    /from ['"]\.\.\/modules\/nodePromptShared\.js['"];[\s\S]*this\.promptEl\.addEventListener\(['"]input['"],[\s\S]*_checkAtTrigger\(this,\s*[\w$]+\)/,
  ),
    assert.match(
      fileSync,
      /this\.promptEl\.addEventListener\(['"]keydown['"],[\s\S]*_handleMentionMenuKeyboard\([\w$]+\)[\s\S]*_handlePillKeyboard\(this,\s*[\w$]+\)/,
    ));
}),
  test('aigenAudio payload: ref-pill 文本引用会替换为真实文本', () => {
    const targetId2 = 'node-audio-text-pill',
      id = 'node-audio-text-ref-pill',
      { ctx: ctx2 } = createTestContext({
        targetId: targetId2,
        nodes: { [id]: { id: id, type: 'source-text', text: '来自音频文本节点的提示词' } },
        incomingEdges: [{ id: 'edge-audio-text-pill', sourceId: id, targetId: targetId2, refSlot: '' }],
        prompt: [
          createPromptTextNode('旁白 '),
          createPromptPillNode('@文本1', id),
          createPromptTextNode(' 开场'),
        ],
      }),
      { payload: payload2 } = ctx2._buildPayloadSnapshot();
    (assert.equal(payload2.prompt, '旁白 来自音频文本节点的提示词 开场'),
      assert.deepEqual(payload2.textInputs, ['来自音频文本节点的提示词']));
  }),
  test('aigenAudio payload: 手打 @文本1 会替换为真实文本', () => {
    const targetId3 = 'node-audio-text-mention',
      id2 = 'node-audio-text-ref-mention',
      { ctx: ctx3 } = createTestContext({
        targetId: targetId3,
        nodes: { [id2]: { id: id2, type: 'source-text', outputText: '直接替换的音频文本' } },
        incomingEdges: [{ id: 'edge-audio-text-mention', sourceId: id2, targetId: targetId3, refSlot: '' }],
        prompt: '旁白 @文本1 开场',
      }),
      { payload: payload3 } = ctx3._buildPayloadSnapshot();
    assert.equal(payload3.prompt, '旁白 直接替换的音频文本 开场');
  }),
  test('aigenAudio payload: 未显式引用的文本入边会前置到 prompt', () => {
    const targetId4 = 'node-audio-text-prepend',
      id3 = 'node-audio-text-ref-prepend',
      { ctx: ctx4 } = createTestContext({
        targetId: targetId4,
        nodes: { [id3]: { id: id3, type: 'source-text', content: '前置的音频文本入参' } },
        incomingEdges: [{ id: 'edge-audio-text-prepend', sourceId: id3, targetId: targetId4, refSlot: '' }],
        prompt: '主体音频描述',
      }),
      { payload: payload4 } = ctx4._buildPayloadSnapshot();
    assert.equal(payload4.prompt, '前置的音频文本入参\n主体音频描述');
  }),
  test('aigenAudio payload: ai-text 入参无输出时使用 prompt 作为文本内容', () => {
    const targetId5 = 'node-audio-ai-text-prompt',
      id4 = 'node-audio-ai-text-prompt-ref',
      { ctx: ctx5 } = createTestContext({
        targetId: targetId5,
        nodes: { [id4]: { id: id4, type: 'ai-text', prompt: '来自生成文本节点的音频提示词' } },
        incomingEdges: [{ id: 'edge-audio-ai-text-prompt', sourceId: id4, targetId: targetId5, refSlot: '' }],
        prompt: '主体音频描述',
      }),
      { payload: payload5 } = ctx5._buildPayloadSnapshot();
    assert.equal(payload5.prompt, '来自生成文本节点的音频提示词\n主体音频描述');
  }),
  test('aigenAudio payload: 模板触发也会解析文本入参且不影响音频引用', () => {
    const targetId6 = 'node-audio-template-text',
      id5 = 'node-audio-template-text-ref',
      id6 = 'node-audio-template-audio-ref',
      { ctx: ctx6 } = createTestContext({
        targetId: targetId6,
        nodes: {
          [id5]: { id: id5, type: 'source-text', text: '模板里的文本入参' },
          [id6]: { id: id6, type: 'source-audio', localPath: 'output/ref.mp3' },
        },
        incomingEdges: [
          { id: 'edge-audio-template-text', sourceId: id5, targetId: targetId6, refSlot: '' },
          { id: 'edge-audio-template-audio', sourceId: id6, targetId: targetId6, refSlot: 'audioRef' },
        ],
      }),
      { payload: payload6 } = ctx6._buildPayloadSnapshot('生成音频：@文本1');
    (assert.equal(payload6.prompt, '生成音频： 模板里的文本入参'),
      assert.deepEqual(payload6.audioRefs, [
        {
          edgeId: 'edge-audio-template-audio',
          sourceId: id6,
          sourceType: 'source-audio',
          refSlot: 'audioRef',
          url: '/output/ref.mp3',
        },
      ]));
  }),
  test('aigenAudio payload: /预设模板支持用户输入默认值', () => {
    const targetId7 = 'node-audio-template-fallback',
      { ctx: ctx7 } = createTestContext({ targetId: targetId7, prompt: '' }),
      config = ctx7._buildPayloadSnapshot('生成音频：{用户输入 || 默认音效}');
    (assert.equal(config.payload.prompt, '生成音频：默认音效'),
      (ctx7.promptEl = createPromptEl('雨夜脚步声')));
    const scope = ctx7._buildPayloadSnapshot('生成音频：{用户输入 || 默认音效}');
    assert.equal(scope.payload.prompt, '生成音频：雨夜脚步声');
  }),
  test('aigenAudio payload: hidden asset audio refs fill RunningHub audio inputs', () => {
    const targetId8 = 'node-audio-hidden-asset';
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
    const { ctx: ctx8 } = createTestContext({
        targetId: targetId8,
        nodeData: { promptAssetInputRefs: [{ assetId: 'asset-audio-hidden', itemIndex: 0, type: 'audio' }] },
        prompt: '请克隆这段声音',
      }),
      { payload: payload7, validation: validation } = ctx8._buildPayloadSnapshot();
    (assert.equal(validation.ok, true),
      assert.equal(payload7.prompt, '请克隆这段声音'),
      assert.deepEqual(payload7.audioRefs, [
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
    const targetId9 = 'node-audio-indextts2-two-audios',
      id7 = 'node-audio-indextts2-ref-1',
      id8 = 'node-audio-indextts2-ref-2',
      { ctx: ctx9 } = createTestContext({
        targetId: targetId9,
        nodes: {
          [id7]: { id: id7, type: 'source-audio', localPath: 'output/clone-voice.mp3' },
          [id8]: { id: id8, type: 'source-audio', localPath: 'output/audio-2.mp3' },
        },
        incomingEdges: [
          { id: 'edge-audio-indextts2-ref-1', sourceId: id7, targetId: targetId9, refSlot: '' },
          {
            id: 'edge-audio-indextts2-ref-2',
            sourceId: id8,
            targetId: targetId9,
            refSlot: 'audioTarget',
          },
        ],
        prompt: '',
      }),
      { payload: payload8, validation: validation2 } = ctx9._buildPayloadSnapshot();
    (assert.equal(validation2.ok, true),
      assert.equal(payload8.prompt, ''),
      assert.deepEqual(
        payload8.audioRefs.map((response) => [response.sourceId, response.refSlot, response.url]),
        [
          [id7, 'audioRef', '/output/clone-voice.mp3'],
          [id8, 'audio2', '/output/audio-2.mp3'],
        ],
      ));
  }),
  test('aigenAudio payload: indextts2 单音频空提示词会被拦截', () => {
    const targetId10 = 'node-audio-indextts2-one-audio-empty-prompt',
      id9 = 'node-audio-indextts2-single-ref',
      { ctx: ctx10 } = createTestContext({
        targetId: targetId10,
        nodes: { [id9]: { id: id9, type: 'source-audio', localPath: 'output/clone-voice.mp3' } },
        incomingEdges: [
          {
            id: 'edge-audio-indextts2-single-ref',
            sourceId: id9,
            targetId: targetId10,
            refSlot: 'audioRef',
          },
        ],
        prompt: '',
      }),
      { validation: validation3 } = ctx10._buildPayloadSnapshot();
    (assert.equal(validation3.ok, false), assert.match(validation3.message, /提示词|prompt/i));
  }),
  test('aigenAudio ui schema: RunningHub audio workflows render instance controls', () => {
    ['indextts2_clone', 'voice_convert', 'advanced_voice_clone'].forEach((item5) => {
      const renderModelUiSchemaControls2 = renderModelUiSchemaControls(
        item5,
        { generationParams: { rhInstanceType: 'plus' } },
        { placement: 'instance', variant: 'instanceToggle' },
      );
      (assert.match(renderModelUiSchemaControls2, /data-ui-schema-field="rhInstanceType"/),
        assert.match(renderModelUiSchemaControls2, /rh-vram-btn/),
        assert.match(renderModelUiSchemaControls2, />48G</));
    });
  }),
  test('aigenAudio ui schema: instance control patch writes only generationParams', () => {
    const uiSchemaParamPatch = buildUiSchemaParamPatch(
      {
        model: 'indextts2_clone',
        rhInstanceType: 'default',
        generationParams: { rhInstanceType: 'default' },
      },
      'rhInstanceType',
      'plus',
    );
    (assert.deepEqual(uiSchemaParamPatch, {
      generationParams: { rhInstanceType: 'plus' },
      generationParamsByModel: { indextts2_clone: { rhInstanceType: 'plus' } },
    }),
      assert.equal(Object.prototype.hasOwnProperty.call(uiSchemaParamPatch, 'rhInstanceType'), false));
  }),
  test('aigenAudio payload: 进阶声音克隆使用音频1/音频2槽位且允许无音频', () => {
    const targetId11 = 'node-audio-advanced-no-audio',
      { ctx: ctx11 } = createTestContext({
        targetId: targetId11,
        nodeData: {
          audioWorkflowKey: 'advanced_voice_clone',
          audioWorkflowLabel: '进阶声音克隆',
          model: 'advanced_voice_clone',
        },
        prompt: '音频1 你好 音频2 回答 音频1 再问',
      }),
      { payload: payload9, validation: validation4 } = ctx11._buildPayloadSnapshot();
    (assert.equal(validation4.ok, true),
      assert.equal(payload9.audioWorkflowKey, 'advanced_voice_clone'),
      assert.equal(payload9.prompt, '[speaker_1]: 你好\n[speaker_2]: 回答\n[speaker_1]: 再问'),
      assert.deepEqual(payload9.audioRefs, []));
  }),
  test('aigenAudio: 进阶声音克隆无音频时允许生成随机音色 TTS', async () => {
    const targetId12 = 'node-audio-advanced-build-no-audio',
      { ctx: ctx12 } = createTestContext({
        targetId: targetId12,
        nodeData: {
          audioWorkflowKey: 'advanced_voice_clone',
          audioWorkflowLabel: '进阶声音克隆',
          model: 'advanced_voice_clone',
        },
        prompt: '用温柔女声说：今晚月色真好。',
      });
    let input = false;
    ctx12._resolveAudioDurationSec = async () => {
      return ((input = true), 0);
    };
    const output = await ctx12._buildPayload();
    (assert.ok(output),
      assert.equal(output.audioWorkflowKey, 'advanced_voice_clone'),
      assert.deepEqual(output.audioRefs, []),
      assert.equal(input, false));
  }),
  test('aigenAudio payload: 进阶声音克隆按连接顺序填入两个固定音频槽', () => {
    const targetId13 = 'node-audio-advanced-slots',
      id10 = 'node-audio-advanced-ref-1',
      id11 = 'node-audio-advanced-ref-2',
      { ctx: ctx13 } = createTestContext({
        targetId: targetId13,
        nodeData: {
          audioWorkflowKey: 'advanced_voice_clone',
          audioWorkflowLabel: '进阶声音克隆',
          model: 'advanced_voice_clone',
        },
        nodes: {
          [id10]: { id: id10, type: 'source-audio', localPath: 'output/a1.mp3' },
          [id11]: { id: id11, type: 'source-audio', localPath: 'output/a2.mp3' },
        },
        incomingEdges: [
          { id: 'edge-audio-advanced-1', sourceId: id10, targetId: targetId13, refSlot: 'audio1' },
          { id: 'edge-audio-advanced-2', sourceId: id11, targetId: targetId13, refSlot: 'audio2' },
        ],
        prompt: '双人对话',
      }),
      { payload: payload10, validation: validation5 } = ctx13._buildPayloadSnapshot();
    (assert.equal(validation5.ok, true),
      assert.deepEqual(payload10.audioRefs, [
        {
          edgeId: 'edge-audio-advanced-1',
          sourceId: id10,
          sourceType: 'source-audio',
          refSlot: 'audio1',
          url: '/output/a1.mp3',
        },
        {
          edgeId: 'edge-audio-advanced-2',
          sourceId: id11,
          sourceType: 'source-audio',
          refSlot: 'audio2',
          url: '/output/a2.mp3',
        },
      ]));
  }),
  test('aigenAudio payload: 进阶声音克隆会把空或旧音频槽归到 audio1/audio2', () => {
    const targetId14 = 'node-audio-advanced-stale-slots',
      id12 = 'node-audio-advanced-stale-ref-1',
      id13 = 'node-audio-advanced-stale-ref-2',
      { ctx: ctx14 } = createTestContext({
        targetId: targetId14,
        nodeData: {
          audioWorkflowKey: 'advanced_voice_clone',
          audioWorkflowLabel: '进阶声音克隆',
          model: 'advanced_voice_clone',
        },
        nodes: {
          [id12]: { id: id12, type: 'source-audio', localPath: 'output/a1.mp3' },
          [id13]: { id: id13, type: 'source-audio', localPath: 'output/a2.mp3' },
        },
        incomingEdges: [
          {
            id: 'edge-audio-advanced-stale-1',
            sourceId: id12,
            targetId: targetId14,
            refSlot: 'audioRef',
          },
          { id: 'edge-audio-advanced-stale-2', sourceId: id13, targetId: targetId14 },
        ],
        prompt: '双人对话',
      }),
      { payload: payload11, validation: validation6 } = ctx14._buildPayloadSnapshot();
    (assert.equal(validation6.ok, true),
      assert.deepEqual(
        payload11.audioRefs.map((response2) => [response2.sourceId, response2.refSlot, response2.url]),
        [
          [id12, 'audio1', '/output/a1.mp3'],
          [id13, 'audio2', '/output/a2.mp3'],
        ],
      ));
  }),
  test('aigenAudio: 进阶声音克隆生成前拦截超过 15 秒音频', async () => {
    const targetId15 = 'node-audio-advanced-duration',
      id14 = 'node-audio-advanced-duration-ref',
      { ctx: ctx15 } = createTestContext({
        targetId: targetId15,
        nodeData: {
          audioWorkflowKey: 'advanced_voice_clone',
          audioWorkflowLabel: '进阶声音克隆',
          model: 'advanced_voice_clone',
        },
        nodes: { [id14]: { id: id14, type: 'source-audio', localPath: 'output/too-long.mp3' } },
        incomingEdges: [
          { id: 'edge-audio-advanced-duration', sourceId: id14, targetId: targetId15, refSlot: 'audio1' },
        ],
        prompt: '双人对话',
      }),
      list5 = [],
      value2 = globalThis.window.showToast;
    ((globalThis.window.showToast = (value3, value4) => list5.push([value3, value4])),
      (ctx15._resolveAudioDurationSec = async () => 15.2));
    try {
      const value5 = await ctx15._buildPayload();
      (assert.equal(value5, null),
        assert.equal(list5.length, 1),
        assert.match(list5[0][0], /3~15 秒/),
        assert.equal(list5[0][1], 'warn'));
    } finally {
      globalThis.window.showToast = value2;
    }
  }),
  test('aigenAudio: 进阶声音克隆生成前拦截少于 3 秒音频', async () => {
    const targetId16 = 'node-audio-advanced-duration-short',
      id15 = 'node-audio-advanced-duration-short-ref',
      { ctx: ctx16 } = createTestContext({
        targetId: targetId16,
        nodeData: {
          audioWorkflowKey: 'advanced_voice_clone',
          audioWorkflowLabel: '进阶声音克隆',
          model: 'advanced_voice_clone',
        },
        nodes: { [id15]: { id: id15, type: 'source-audio', localPath: 'output/too-short.mp3' } },
        incomingEdges: [
          {
            id: 'edge-audio-advanced-duration-short',
            sourceId: id15,
            targetId: targetId16,
            refSlot: 'audio1',
          },
        ],
        prompt: '音频1说：你终于来了。',
      }),
      list6 = [],
      value6 = globalThis.window.showToast;
    ((globalThis.window.showToast = (value7, value8) => list6.push([value7, value8])),
      (ctx16._resolveAudioDurationSec = async () => 2.9));
    try {
      const value9 = await ctx16._buildPayload();
      (assert.equal(value9, null),
        assert.equal(list6.length, 1),
        assert.match(list6[0][0], /3~15 秒/),
        assert.equal(list6[0][1], 'warn'));
    } finally {
      globalThis.window.showToast = value6;
    }
  }),
  test('aigenAudio: 音频工作流用法提示随 manifest 切换', () => {
    const targetId17 = 'node-audio-advanced-help-tip',
      { ctx: ctx17, state: state2 } = createTestContext({
        targetId: targetId17,
        nodeData: {
          audioWorkflowKey: 'advanced_voice_clone',
          audioWorkflowLabel: '进阶声音克隆',
          model: 'advanced_voice_clone',
        },
      });
    (assert.match(ctx17._getGenerationNodeHelpText(), /进阶声音克隆用法/),
      (state2.nodes[targetId17] = {
        ...state2.nodes[targetId17],
        audioWorkflowKey: 'indextts2_clone',
        model: 'indextts2_clone',
      }),
      (ctx17._data = state2.nodes[targetId17]),
      assert.match(ctx17._getGenerationNodeHelpText(), /indextts2音色克隆用法/),
      (state2.nodes[targetId17] = {
        ...state2.nodes[targetId17],
        audioWorkflowKey: 'voice_convert',
        model: 'voice_convert',
      }),
      (ctx17._data = state2.nodes[targetId17]),
      assert.match(ctx17._getGenerationNodeHelpText(), /音色转换用法/));
  }),
  test('aigenAudio: 旧 RunningHub 模型 ID 不再作为工作流 alias', () => {
    const targetId18 = 'node-audio-advanced-help-tip-model-id',
      { ctx: ctx18 } = createTestContext({
        targetId: targetId18,
        nodeData: {
          audioWorkflowKey: 'runninghub/2050165249344585729',
          model: 'runninghub/2050165249344585729',
        },
      });
    assert.equal(ctx18._getCurrentWorkflow().key, 'indextts2_clone');
  }),
  test('aigenAudio: 进阶声音克隆中文标签也会显示用法提示', () => {
    const targetId19 = 'node-audio-advanced-help-tip-label',
      { ctx: ctx19 } = createTestContext({
        targetId: targetId19,
        nodeData: {
          audioWorkflowKey: '进阶声音克隆',
          audioWorkflowLabel: '进阶声音克隆',
          model: '进阶声音克隆',
        },
      });
    (assert.equal(ctx19._getCurrentWorkflow().key, 'advanced_voice_clone'),
      assert.match(ctx19._getGenerationNodeHelpText(), /进阶声音克隆用法/));
  }),
  test('aigenAudio: 进阶声音克隆未授权时打开订阅弹窗且不构建 payload', async () => {
    const targetId20 = 'node-audio-advanced-vip',
      { ctx: ctx20 } = createTestContext({
        targetId: targetId20,
        nodeData: {
          audioWorkflowKey: 'advanced_voice_clone',
          audioWorkflowLabel: '进阶声音克隆',
          model: 'advanced_voice_clone',
        },
        prompt: '双人对话',
      }),
      value10 = globalThis.window.isModelAllowedBySubscription,
      value11 = globalThis.window.openSubscriptionDialog,
      value12 = globalThis.window.ensureSubscriptionInstallId,
      list7 = [];
    let value13 = false;
    ((globalThis.window.isModelAllowedBySubscription = () => false),
      (globalThis.window.openSubscriptionDialog = (value14) => list7.push(value14)),
      (globalThis.window.ensureSubscriptionInstallId = async () => 'install-should-not-run'),
      (ctx20._buildPayload = async () => {
        return ((value13 = true), { prompt: '不应构建' });
      }),
      (ctx20._updateSubmitButtonState = () => {}));
    try {
      (await ctx20._onGenerate(),
        assert.equal(value13, false),
        assert.equal(list7.length, 1),
        assert.deepEqual(list7[0], {
          modelId: 'runninghub/2050165249344585729',
          provider: 'runninghubwf',
        }));
    } finally {
      ((globalThis.window.isModelAllowedBySubscription = value10),
        (globalThis.window.openSubscriptionDialog = value11),
        (globalThis.window.ensureSubscriptionInstallId = value12));
    }
  }),
  test('aigenAudio: 选择进阶声音克隆时未授权会先打开订阅弹窗', () => {
    const targetId21 = 'node-audio-advanced-select-vip',
      { ctx: ctx21, state: state3 } = createTestContext({
        targetId: targetId21,
        nodeData: {
          audioWorkflowKey: 'indextts2_clone',
          audioWorkflowLabel: 'indextts2音色克隆',
          model: 'indextts2_clone',
        },
        prompt: '旁白正文',
      }),
      value15 = globalThis.window.isModelAllowedBySubscription,
      value16 = globalThis.window.openSubscriptionDialog,
      list8 = [];
    ((globalThis.window.isModelAllowedBySubscription = () => false),
      (globalThis.window.openSubscriptionDialog = (value17) => list8.push(value17)));
    try {
      (ctx21._setSelectedWorkflow('advanced_voice_clone'),
        assert.equal(state3.nodes[targetId21].audioWorkflowKey, 'indextts2_clone'),
        assert.equal(list8.length, 1),
        assert.equal(list8[0].modelId, 'runninghub/2050165249344585729'),
        assert.equal(list8[0].provider, 'runninghubwf'),
        assert.equal(typeof list8[0].onSuccess, 'function'));
    } finally {
      ((globalThis.window.isModelAllowedBySubscription = value15),
        (globalThis.window.openSubscriptionDialog = value16));
    }
  }),
  test('aigenAudio: 进阶声音克隆授权成功回调后完成模型选择', () => {
    const targetId22 = 'node-audio-advanced-select-success',
      { ctx: ctx22, state: state4 } = createTestContext({
        targetId: targetId22,
        nodeData: {
          audioWorkflowKey: 'indextts2_clone',
          audioWorkflowLabel: 'indextts2音色克隆',
          model: 'indextts2_clone',
        },
        prompt: '旁白正文',
      }),
      value18 = globalThis.window.isModelAllowedBySubscription,
      value19 = globalThis.window.openSubscriptionDialog;
    let value20 = false,
      handler2 = null;
    ((globalThis.window.isModelAllowedBySubscription = () => value20),
      (globalThis.window.openSubscriptionDialog = (value21) => {
        handler2 = value21.onSuccess;
      }));
    try {
      (ctx22._setSelectedWorkflow('advanced_voice_clone'),
        assert.equal(state4.nodes[targetId22].audioWorkflowKey, 'indextts2_clone'),
        (value20 = true),
        handler2(),
        assert.equal(state4.nodes[targetId22].audioWorkflowKey, 'advanced_voice_clone'),
        assert.equal(state4.nodes[targetId22].audioWorkflowLabel, '进阶声音克隆'),
        assert.equal(state4.nodes[targetId22].model, 'advanced_voice_clone'));
    } finally {
      ((globalThis.window.isModelAllowedBySubscription = value18),
        (globalThis.window.openSubscriptionDialog = value19));
    }
  }),
  test('aigenAudio payload: manifest instance param is read from generationParams', () => {
    const targetId23 = 'node-audio-instance-generation-params',
      { ctx: ctx23 } = createTestContext({
        targetId: targetId23,
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
            targetId: targetId23,
            refSlot: 'audioRef',
          },
        ],
        prompt: '旁白正文',
      }),
      { payload: payload12 } = ctx23._buildPayloadSnapshot();
    assert.equal(payload12.rhInstanceType, 'plus');
  }),
  test('aigenAudio state sync: refSlot changes trigger ref bar refresh', () => {
    const value22 = globalThis.document,
      targetId24 = 'node-audio-refslot-refresh',
      incomingEdges2 = [
        { id: 'edge-audio-ref', sourceId: 'audio-ref', targetId: targetId24, refSlot: 'audioRef' },
        { id: 'edge-text-ref', sourceId: 'text-ref', targetId: targetId24, refSlot: 'textRef' },
      ];
    try {
      globalThis.document = { ...globalThis.document, activeElement: null };
      const { ctx: ctx24, state: state5 } = createTestContext({
        targetId: targetId24,
        nodes: {
          'audio-ref': { id: 'audio-ref', type: 'source-audio', localPath: 'output/ref.mp3', _bizRev: 1 },
          'text-ref': { id: 'text-ref', type: 'source-text', text: '旁白', _bizRev: 1 },
        },
        incomingEdges: incomingEdges2,
      });
      let value23 = 0;
      ((ctx24._renderRefBar = () => {
        value23 += 1;
      }),
        (ctx24._refreshWorkflowUi = () => {}),
        (ctx24._syncPickConnectVisualState = () => {}),
        (ctx24._maybeResumeRunningHubTask = () => {}),
        (ctx24._updateSubmitButtonState = () => {}),
        (ctx24.promptEl = { innerHTML: '', style: { removeProperty() {} }, querySelectorAll: () => [] }),
        ctx24.update(state5.nodes[targetId24]),
        assert.equal(value23, 1),
        (incomingEdges2[0] = { ...incomingEdges2[0], refSlot: 'textRef' }),
        (incomingEdges2[1] = { ...incomingEdges2[1], refSlot: 'audioRef' }),
        ctx24.update(state5.nodes[targetId24]),
        assert.equal(value23, 2));
    } finally {
      if (typeof value22 === 'undefined') delete globalThis.document;
      else globalThis.document = value22;
    }
  }),
  test('aigenAudio workflow selection initializes schema defaults and preserves memory', () => {
    const targetId25 = 'node-audio-schema-selection-memory',
      { ctx: ctx25, state: state6 } = createTestContext({
        targetId: targetId25,
        nodeData: {
          audioWorkflowKey: 'indextts2_clone',
          audioWorkflowLabel: 'indextts2音色克隆',
          model: 'indextts2_clone',
          generationParams: { rhInstanceType: 'plus' },
          generationParamsByModel: { voice_convert: { rhInstanceType: 'plus' } },
        },
        prompt: '旁白正文',
      });
    (ctx25._setSelectedWorkflow('voice_convert'),
      assert.equal(state6.nodes[targetId25].audioWorkflowKey, 'voice_convert'),
      assert.equal(state6.nodes[targetId25].generationParams.rhInstanceType, 'plus'),
      assert.deepEqual(state6.nodes[targetId25].generationParamsByModel, {
        indextts2_clone: { rhInstanceType: 'plus' },
        voice_convert: { rhInstanceType: 'plus' },
      }));
  }),
  test('aigenAudio: 开发者模式下 /预设 仅回填最终提示词不直接生成', async () => {
    const value24 = globalThis.window.DEV_MODE;
    globalThis.window.DEV_MODE = true;
    try {
      const targetId26 = 'node-audio-template-dev-preview',
        { ctx: ctx26, state: state7 } = createTestContext({ targetId: targetId26, prompt: '旁白正文' });
      let value25 = false;
      ((ctx26._buildPayload = async () => ({ prompt: '生成音频：旁白正文' })),
        (ctx26._updateSubmitButtonState = () => {}),
        (ctx26._stopRunningHubRecovery = () => {}),
        (ctx26._setGeneratingUi = () => {
          value25 = true;
        }),
        (ctx26.previewEl = {}),
        (ctx26.btnEl = null),
        await ctx26._onGenerate('生成音频：{用户输入}'),
        assert.equal(value25, false),
        assert.equal(state7.nodes[targetId26].prompt, '生成音频：旁白正文'),
        assert.equal(ctx26.promptEl.innerHTML, '生成音频：旁白正文'));
    } finally {
      globalThis.window.DEV_MODE = value24;
    }
  }),
  test('aigenAudio: 预览模式下点击生成只启动假加载不发请求', async () => {
    const value26 = globalThis.window.PREVIEW_MODE;
    globalThis.window.PREVIEW_MODE = true;
    try {
      const targetId27 = 'node-audio-preview-loading',
        { ctx: ctx27 } = createTestContext({ targetId: targetId27 });
      let value27 = false;
      ((ctx27.previewEl = createFakePreviewContainer()),
        (ctx27.btnEl = createButtonStub()),
        (ctx27._updateSubmitButtonState = () => {}),
        (ctx27._buildPayload = async () => {
          return ((value27 = true), { prompt: '预览模式不应走到这里' });
        }),
        await ctx27._onGenerate(),
        assert.equal(value27, false),
        assert.equal(isPreviewNodeLoading(targetId27), true),
        assert.equal(ctx27.btnEl.disabled, true),
        assert.match(ctx27.btnEl.innerHTML, /animation:spin/),
        stopPreviewNodeLoading(targetId27),
        assert.equal(ctx27.btnEl.disabled, false),
        assert.doesNotMatch(ctx27.btnEl.innerHTML, /animation:spin/));
    } finally {
      globalThis.window.PREVIEW_MODE = value26;
    }
  }),
  test('aigenAudio submit button: running task state is read from unified selector', () => {
    const targetId28 = 'node-audio-running-button-state',
      { ctx: ctx28, state: state8 } = createTestContext({
        targetId: targetId28,
        nodeData: { rhTaskId: 'rh-audio-running', rhTaskStatus: 'running', isGenerating: false },
      });
    ((ctx28.btnEl = createButtonStub()),
      (ctx28._isGenerating = false),
      (state8.nodes[targetId28] = {
        ...state8.nodes[targetId28],
        rhTaskId: 'rh-audio-running',
        rhTaskStatus: 'running',
      }),
      ctx28._updateSubmitButtonState(),
      assert.equal(ctx28.btnEl.disabled, false),
      assert.equal(ctx28.btnEl.style.cursor, ''),
      assert.equal(ctx28.btnEl.classList.contains('is-task-cancel'), true),
      assert.match(ctx28.btnEl.innerHTML, /v2-task-cancel-spin/),
      (ctx28._rhCancelInFlight = true),
      ctx28._updateSubmitButtonState(),
      assert.equal(ctx28.btnEl.disabled, true),
      assert.equal(ctx28.btnEl.style.cursor, 'var(--unavailable-cursor)'));
  }),
  test('aigenAudio task orchestration: running RH store state cancels even when local flag is stale', async () => {
    const targetId29 = 'node-audio-running-store-cancels',
      { ctx: ctx29, state: state9 } = createTestContext({
        targetId: targetId29,
        nodeData: {
          rhTaskId: 'rh-audio-running',
          rhTaskStatus: 'running',
          jobStatus: 'running',
          isGenerating: true,
        },
      });
    let value28 = 0,
      value29 = 0;
    ((ctx29._isGenerating = false),
      (ctx29._cancelRunningHubWorkflowTask = async () => {
        value28 += 1;
      }),
      (ctx29._onGenerate = async () => {
        value29 += 1;
      }),
      (state9.nodes[targetId29] = {
        ...state9.nodes[targetId29],
        rhTaskId: 'rh-audio-running',
        rhTaskStatus: 'running',
        jobStatus: 'running',
        isGenerating: true,
      }),
      await ctx29._handleGenerateOrCancel(),
      assert.equal(value28, 1),
      assert.equal(value29, 0));
  }),
  test('aigenAudio submit button: terminal store state overrides stale local busy flag', () => {
    const targetId30 = 'node-audio-terminal-overrides-local-busy',
      { ctx: ctx30, state: state10 } = createTestContext({
        targetId: targetId30,
        nodeData: {
          rhTaskId: 'rh-audio-failed',
          rhTaskStatus: 'failed',
          jobStatus: 'error',
          isGenerating: true,
        },
      });
    ((ctx30.btnEl = createButtonStub()),
      ctx30.btnEl.classList.add('is-task-cancel'),
      (ctx30.btnEl.innerHTML = '<svg><g class="v2-task-cancel-spin"></g></svg>'),
      (ctx30._isGenerating = true),
      (state10.nodes[targetId30] = {
        ...state10.nodes[targetId30],
        rhTaskStatus: 'failed',
        jobStatus: 'error',
        isGenerating: true,
      }),
      ctx30._setGeneratingUi(true),
      assert.equal(ctx30.btnEl.classList.contains('is-task-cancel'), false),
      assert.doesNotMatch(ctx30.btnEl.innerHTML, /v2-task-cancel-spin/));
  }),
  test('aigenAudio state sync: running RH state keeps preview loading over previous result', async () => {
    const targetId31 = 'node-audio-rh-existing-result-loading',
      { ctx: ctx31, state: state11 } = createTestContext({
        targetId: targetId31,
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
    ((ctx31.previewEl = createFakePreviewContainer()),
      (ctx31._syncPromptBoxSizeFromData = () => {}),
      (ctx31._syncWorkflowDefaults = () => {}),
      (ctx31._enforceWorkflowAudioInputLimit = () => {}),
      (ctx31._applyResultWideLayout = () => {}),
      (ctx31._setAudioPreviewResultState = () => {}),
      (ctx31._syncStatusOverlay = () => {}),
      (ctx31._refreshWorkflowUi = () => {}),
      (ctx31._renderRefBar = () => {}),
      (ctx31._syncPickConnectVisualState = () => {}),
      (ctx31._maybeResumeRunningHubTask = () => {}),
      (ctx31._updateSubmitButtonState = () => {}),
      ctx31.update(state11.nodes[targetId31]),
      await new Promise((value30) => setTimeout(value30, 70)),
      assert.equal(ctx31.previewEl.classList.contains('img-preview-loading'), true),
      assert.equal(!!ctx31.previewEl.querySelector('.img-loading-overlay'), true));
  }),
  test('aigenAudio result renderer: stores persisted audio patch through unified renderer', async () => {
    const targetId32 = 'node-audio-result-renderer',
      { ctx: ctx32, state: state12 } = createTestContext({ targetId: targetId32 }),
      list9 = [];
    let value31 = null,
      value32 = null;
    ((ctx32._persistAudioOutput = async (value33) => {
      return (list9.push(value33), { localPath: 'output/final.mp3', audioDuration: 7.5 });
    }),
      (ctx32._dispatchGenerationHistoryAudio = (value34) => {
        value31 = value34;
      }),
      (ctx32._applyResultWideLayout = (value35) => {
        value32 = value35;
      }));
    const value36 = await ctx32._applyAudioResultAndStore(
        { audioUrl: 'https://cdn.example.com/final.mp3' },
        Date.now() - 10,
      ),
      value37 = state12.nodes[targetId32];
    (assert.deepEqual(list9, ['https://cdn.example.com/final.mp3']),
      assert.equal(value37.jobStatus, 'success'),
      assert.equal(value37.jobError, null),
      assert.equal(value37.audioUrl, '/output/final.mp3'),
      assert.equal(value37.src, '/output/final.mp3'),
      assert.equal(value37.localPath, 'output/final.mp3'),
      assert.equal(value37.audioDuration, 7.5),
      assert.equal(value37.rhStatusMessage, null),
      assert.equal(value36.finalUrl, '/output/final.mp3'),
      assert.equal(value36.finalLocalPath, 'output/final.mp3'),
      assert.equal(value31.audioUrl, '/output/final.mp3'),
      assert.equal(value31.audioDuration, 7.5),
      assert.equal(value32.audioUrl, '/output/final.mp3'),
      assert.equal(value32.audioDuration, 7.5));
  }));
