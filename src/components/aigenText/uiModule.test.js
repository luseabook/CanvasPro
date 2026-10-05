import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAIGenTextNodeUiModule } from './uiModule.js';
import { createAIGenTextNodeStateSyncModule } from './stateSyncModule.js';
import {
  APIMART_TEXT_MODEL_MENU_ITEMS,
  buildApimartTextModelMenuHTML,
  buildRunningHubTextModelMenuHTML,
  buildTextModelMenuHTML,
  buildTextProviderMenuGroupsHTML,
  TEXT_MODEL_MENU_ITEMS_BY_PROVIDER,
} from './apimartTextModelMenu.js';
import { getDisplayModelName } from '../../modules/providers.js';
import {
  _resetPreviewRuntimeForTests,
  isPreviewNodeLoading,
  setPreviewMode,
  startPreviewNodeLoading,
} from '../../modules/previewMode.js';
import {
  createPreviewContainer as createFakePreviewContainer,
  installDomEnvironment as installPreviewDomStubs,
} from '../../../tools/dom-test-environment.mjs';
const restorePreviewDom = installPreviewDomStubs(),
  originalRequestAnimationFrame = globalThis.requestAnimationFrame,
  __dirname = dirname(fileURLToPath(import.meta.url)),
  uiModuleSource = readFileSync(join(__dirname, 'uiModule.js'), 'utf8');
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
typeof globalThis.requestAnimationFrame !== 'function' &&
  (globalThis.requestAnimationFrame = (handler) => {
    return (handler(), 0);
  });
(test.afterEach(() => {
  _resetPreviewRuntimeForTests();
}),
  test.after(() => {
    (_resetPreviewRuntimeForTests(),
      typeof originalRequestAnimationFrame === 'undefined'
        ? delete globalThis.requestAnimationFrame
        : (globalThis.requestAnimationFrame = originalRequestAnimationFrame),
      restorePreviewDom());
  }),
  test('aigenText ui: APIMart menu uses new text model set', () => {
    const list = buildApimartTextModelMenuHTML('apimart/kimi-k2-instruct'),
      grsai = buildTextModelMenuHTML('gemini-3.1-pro', 'grsai'),
      ppio = buildTextModelMenuHTML('minimax/minimax-m2.5-highspeed', 'ppio'),
      runninghub = buildRunningHubTextModelMenuHTML(
        'runninghub-model/rhart-text-g-3-flash-preview-cv/image-to-text',
      ),
      volcengine = buildTextModelMenuHTML('volcengine/doubao-seed-2-0-pro-260215', 'volcengine'),
      textProviderMenuGroupsHTML = buildTextProviderMenuGroupsHTML('gemini-3.1-pro'),
      item = APIMART_TEXT_MODEL_MENU_ITEMS.map((item2) => [item2.modelId, item2.title]),
      key = [
        [grsai, '谷歌最新模型gemini3.1'],
        [ppio, '更低延迟、更高性价比的领先模型'],
        [ppio, '阿里最强开源模型Qwen2.5'],
        [ppio, '面向未来的新一代大模型'],
        [ppio, '月之暗面最新版，超长上下文'],
        [list, 'APIMart text model'],
        [list, 'OpenAI-compatible text model'],
        [list, '极致逻辑与推理性能，OpenAI 巅峰之作'],
        [list, '旗舰级多模态模型，支持超长文本与深度分析'],
        [list, '闪电级响应速度，适用于高频率对话与实时任务'],
        [runninghub, '闪电级响应速度，适用于高频率对话与实时任务'],
        [runninghub, '旗舰级多模态模型，支持超长文本与深度分析'],
        [textProviderMenuGroupsHTML, '一个 API 搞定一切——节省 30-70%'],
      ];
    (assert.match(uiModuleSource, /buildTextProviderMenuGroupsHTML\([\w$]+\)/),
      assert.doesNotMatch(uiModuleSource, /buildApimartTextModelMenuHTML\(_activeModel\)/),
      assert.doesNotMatch(uiModuleSource, /return buildTextModelMenuHTML\(_activeModel/),
      assert.doesNotMatch(uiModuleSource, /data-lazy-text-provider=/),
      assert.doesNotMatch(uiModuleSource, /ensureTextProviderSubmenu/),
      assert.match(textProviderMenuGroupsHTML, /grsai-submenu/),
      assert.match(textProviderMenuGroupsHTML, /ppio-submenu/),
      assert.match(textProviderMenuGroupsHTML, /apimart-submenu/),
      assert.match(textProviderMenuGroupsHTML, /runninghub-submenu/),
      assert.match(textProviderMenuGroupsHTML, /volcengine-submenu/),
      assert.match(textProviderMenuGroupsHTML, /images\/volcengine\.svg/),
      assert.doesNotMatch(uiModuleSource, /data-value="deepseek-v3\.2"/),
      assert.doesNotMatch(uiModuleSource, /data-value="apimart\/deepseek-v3\.2"/),
      assert.doesNotMatch(
        uiModuleSource,
        /data-value="(?:minimax\/|qwen\/|deepseek\/|moonshotai\/|runninghub-model\/rhart-text|gemini-3\.1-pro-preview|gemini-3-flash-preview-nothinking|apimart\/gpt-5\.4)/,
      ),
      assert.doesNotMatch(uiModuleSource, /data-aicanvas-toggle/),
      assert.doesNotMatch(uiModuleSource, /aicanvas\/text-/),
      assert.doesNotMatch(uiModuleSource, /AICanvas Text/),
      assert.doesNotMatch(list, /data-value="deepseek-v3\.2"/),
      assert.doesNotMatch(list, /data-value="apimart\/deepseek-v3\.2"/));
    for (const [index, result] of item) {
      (assert.match(list, new RegExp('data-value="' + escapeRegExp(index) + '"')),
        assert.ok(list.includes('<div class="fmi-title">' + result + '</div>')));
    }
    (assert.ok(list.includes('<div class="fmi-title">gpt-5.4</div>')),
      assert.ok(list.includes('<div class="fmi-title">gemini-3.1-pro-preview</div>')),
      assert.ok(list.includes('<div class="fmi-title">gemini-3-flash-preview-nothinking</div>')));
    for (const [list2, data] of key) {
      assert.ok(
        list2.includes('<div class="fmi-sub">' + data + '</div>'),
        'text model menu should preserve subtitle: ' + data,
      );
    }
    for (const [options, list3] of Object.entries({
      grsai: grsai,
      ppio: ppio,
      runninghub: runninghub,
      volcengine: volcengine,
    })) {
      for (const target of TEXT_MODEL_MENU_ITEMS_BY_PROVIDER[options]) {
        (assert.match(list3, new RegExp('data-value="' + escapeRegExp(target.modelId) + '"')),
          assert.ok(list3.includes('data-provider="' + target.provider + '"')),
          assert.ok(list3.includes('<div class="fmi-title">' + target.title + '</div>')));
      }
    }
  }),
  test('aigenText model menu: provider filter can expose only Volcengine', () => {
    const textProviderMenuGroupsHTML2 = buildTextProviderMenuGroupsHTML(
      'volcengine/doubao-seed-2-0-pro-260215',
      {
        providers: ['volcengine'],
      },
    );
    (assert.match(textProviderMenuGroupsHTML2, /volcengine-submenu/),
      assert.match(textProviderMenuGroupsHTML2, /volcengine\/doubao-seed-2-0-pro-260215/),
      assert.doesNotMatch(textProviderMenuGroupsHTML2, /apimart-submenu/),
      assert.doesNotMatch(textProviderMenuGroupsHTML2, /runninghub-submenu/),
      assert.doesNotMatch(textProviderMenuGroupsHTML2, /grsai-submenu/),
      assert.doesNotMatch(textProviderMenuGroupsHTML2, /ppio-submenu/));
  }),
  test('aigenText ui: default APIMart text model displays Kimi K2 Instruct', () => {
    (assert.match(uiModuleSource, /this\._data\.model\s*\|\|\s*['"]apimart\/kimi-k2-instruct['"]/),
      assert.match(
        uiModuleSource,
        new RegExp(
          'img-model-label[\\s\\S]{0,160}' +
            uiModuleSource.match(/getDisplayModelName:\s*([\w$]+)/)[1] +
            '\\([\\w$]+\\)',
        ),
      ),
      assert.equal(getDisplayModelName('apimart/kimi-k2-instruct'), 'Kimi K2 Instruct'));
  }));
function createSubmitButtonStub() {
  const map = new Set();
  return {
    disabled: false,
    title: '',
    innerHTML: '',
    style: { color: '', cursor: '' },
    dataset: {},
    classList: {
      add(...list4) {
        list4.forEach((item3) => map.add(String(item3 || '')));
      },
      remove(...list5) {
        list5.forEach((item4) => map.delete(String(item4 || '')));
      },
      contains(source) {
        return map.has(String(source || ''));
      },
    },
    setAttribute(next, current) {
      this.dataset[String(next || '')] = String(current || '');
    },
  };
}
(test('aigenText ui: 输出区保持只读，不再进入编辑态', () => {
  let selectedNodeIds = [];
  const list6 = [],
    aIGenTextNodeUiModule = createAIGenTextNodeUiModule({
      store: {
        getState: () => ({
          selectedNodeIds: selectedNodeIds,
          nodes: { 'node-text-ui-preview': { outputScrollTop: 0 } },
        }),
        getStateRaw: () => ({ nodes: { 'node-text-ui-preview': { outputScrollTop: 0 } } }),
        setSelectedNodes: (list7) => {
          selectedNodeIds = list7.slice();
        },
        updateNodeData: (entry, record) => {
          list6.push([entry, record]);
        },
      },
    }),
    outputEl = {
      _attrs: {},
      style: {},
      scrollTop: 42,
      setAttribute(payload, handle) {
        this._attrs[String(payload || '')] = String(handle || '');
      },
      focus() {},
    },
    state = Object.assign(Object.create(aIGenTextNodeUiModule), {
      nodeId: 'node-text-ui-preview',
      outputEl: outputEl,
      _outputScrollTop: 24,
    });
  (aIGenTextNodeUiModule._enterOutputEditMode.call(state),
    assert.equal(outputEl._attrs.contenteditable, 'false'),
    assert.deepEqual(selectedNodeIds, [state.nodeId]),
    assert.deepEqual(list6, [[state.nodeId, { outputScrollTop: 42 }]]),
    assert.match(uiModuleSource, /bindReadonlyTextSelection\(this\.outputEl,\s*\{/),
    assert.match(uiModuleSource, /onActivate: \(\) => this\._enterOutputEditMode\(\)/),
    assert.match(uiModuleSource, /onDeactivate: \(\) => this\._commitOutputScrollTop\(\)/),
    assert.doesNotMatch(uiModuleSource, /outputEl\.style\.userSelect = "none"/));
}),
  test('aigenText ui: 普通滚动也会节流保存 outputScrollTop', async () => {
    let args = { outputScrollTop: 0 };
    const list8 = [],
      aIGenTextNodeUiModule2 = createAIGenTextNodeUiModule({
        store: {
          getStateRaw: () => ({ nodes: { 'node-text-scroll-save': args } }),
          updateNodeData: (config, args2) => {
            (list8.push([config, args2]), (args = { ...args, ...args2 }));
          },
        },
      }),
      outputEl2 = { scrollTop: 63 },
      scope = Object.assign(Object.create(aIGenTextNodeUiModule2), {
        nodeId: 'node-text-scroll-save',
        outputEl: outputEl2,
        _outputScrollTop: 0,
      });
    (aIGenTextNodeUiModule2._markOutputScrollTopDirty.call(scope),
      assert.equal(scope._outputScrollTopDirty, true),
      assert.equal(scope._outputScrollTop, 63),
      await new Promise((input) => setTimeout(input, 160)),
      assert.equal(scope._outputScrollTopDirty, false),
      assert.deepEqual(list8, [[scope.nodeId, { outputScrollTop: 63 }]]),
      assert.match(uiModuleSource, /this\._markOutputScrollTopDirty\(\)/));
  }),
  test('aigenText ui: 预览模式双击输出区也不会进入编辑态', () => {
    let selectedNodeIds2 = [];
    const aIGenTextNodeUiModule3 = createAIGenTextNodeUiModule({
        store: {
          getState: () => ({ selectedNodeIds: selectedNodeIds2 }),
          setSelectedNodes: (list9) => {
            selectedNodeIds2 = list9.slice();
          },
        },
      }),
      outputEl3 = {
        _attrs: {},
        style: {},
        innerText: '',
        scrollTop: 0,
        setAttribute(output, value2) {
          this._attrs[String(output || '')] = String(value2 || '');
        },
        getAttribute(value3) {
          return this._attrs[String(value3 || '')] || null;
        },
        focus() {},
      },
      value4 = Object.assign(Object.create(aIGenTextNodeUiModule3), {
        nodeId: 'node-text-ui-preview-dblclick',
        outputEl: outputEl3,
        _outputScrollTop: 8,
      });
    let value5 = false,
      value6 = false;
    (startPreviewNodeLoading(value4.nodeId, createFakePreviewContainer()),
      setPreviewMode(true),
      assert.equal(isPreviewNodeLoading(value4.nodeId), true),
      aIGenTextNodeUiModule3._handlePreviewDblclick.call(value4, {
        preventDefault() {
          value5 = true;
        },
        stopPropagation() {
          value6 = true;
        },
      }),
      assert.equal(value5, false),
      assert.equal(value6, true),
      assert.notEqual(outputEl3._attrs.contenteditable, 'true'),
      assert.equal(isPreviewNodeLoading(value4.nodeId), true),
      assert.deepEqual(selectedNodeIds2, []));
  }),
  test('aigenText state sync: running state shows unified loading instead of prompt validation', () => {
    const aIGenTextNodeStateSyncModule = createAIGenTextNodeStateSyncModule({ store: {} }),
      value7 = Object.assign(Object.create(aIGenTextNodeStateSyncModule), {
        _data: { isGenerating: true, jobStatus: 'running' },
        promptEl: { innerText: '' },
        btnEl: { disabled: false, style: { cursor: '' } },
      });
    (aIGenTextNodeStateSyncModule._updateSubmitButtonState.call(value7),
      assert.equal(value7.btnEl.disabled, true),
      assert.equal(value7.btnEl.style.cursor, 'var(--unavailable-cursor)'),
      assert.match(value7.btnEl.innerHTML, /animation:spin/));
  }),
  test('aigenText state sync: 复制模式下不使用旧 outputScrollTop 还原滚动位置', () => {
    const aIGenTextNodeStateSyncModule2 = createAIGenTextNodeStateSyncModule({
        store: { getState: () => ({ pickConnectMode: {}, nodes: {} }), getIncomingEdges: () => [] },
        getDisplayModelName: (value8) => value8,
      }),
      outputEl4 = {
        scrollTop: 88,
        classList: {
          contains(value9) {
            return value9 === 'is-text-selection-active';
          },
        },
        getAttribute() {
          return 'false';
        },
      };
    let value10 = 0;
    const id = Object.assign(Object.create(aIGenTextNodeStateSyncModule2), {
      nodeId: 'node-text-scroll-active',
      _data: {},
      _outputScrollTop: 88,
      outputEl: outputEl4,
      _renderOutputText: () => {
        value10 += 1;
      },
      _renderRefBar: () => {},
      _syncPromptBoxSizeFromData: () => {},
      _updateSubmitButtonState: () => {},
    });
    (aIGenTextNodeStateSyncModule2.update.call(id, {
      id: id.nodeId,
      type: 'ai-text',
      outputText: 'next',
      outputScrollTop: 5,
    }),
      assert.equal(outputEl4.scrollTop, 88),
      assert.equal(id._outputScrollTop, 88),
      assert.equal(value10, 0));
  }),
  test('aigenText state sync: 普通滚动待保存时不使用旧 outputScrollTop 还原滚动位置', () => {
    const aIGenTextNodeStateSyncModule3 = createAIGenTextNodeStateSyncModule({
        store: { getState: () => ({ pickConnectMode: {}, nodes: {} }), getIncomingEdges: () => [] },
        getDisplayModelName: (value11) => value11,
      }),
      outputEl5 = {
        scrollTop: 88,
        classList: {
          contains() {
            return false;
          },
        },
        getAttribute() {
          return 'false';
        },
      };
    let value12 = 0;
    const id2 = Object.assign(Object.create(aIGenTextNodeStateSyncModule3), {
      nodeId: 'node-text-scroll-dirty',
      _data: {},
      _lastRenderedOutputText: 'next',
      _outputScrollTop: 88,
      _outputScrollTopDirty: true,
      outputEl: outputEl5,
      _renderOutputText: () => {
        value12 += 1;
      },
      _renderRefBar: () => {},
      _syncPromptBoxSizeFromData: () => {},
      _updateSubmitButtonState: () => {},
    });
    (aIGenTextNodeStateSyncModule3.update.call(id2, {
      id: id2.nodeId,
      type: 'ai-text',
      outputText: 'next',
      outputScrollTop: 5,
    }),
      assert.equal(outputEl5.scrollTop, 88),
      assert.equal(id2._outputScrollTop, 88),
      assert.equal(id2._outputScrollTopDirty, true),
      assert.equal(value12, 1));
  }),
  test('aigenText submit button: empty editor can generate from non-empty text input', () => {
    const id3 = 'node-text-target',
      id4 = 'node-text-source',
      _data = {
        nodes: {
          [id3]: { id: id3, type: 'ai-text' },
          [id4]: { id: id4, type: 'source-text', content: '来自文本入参的提示词' },
        },
      },
      value13 = [{ id: 'edge-text-input', sourceId: id4, targetId: id3 }],
      aIGenTextNodeStateSyncModule4 = createAIGenTextNodeStateSyncModule({
        store: { getState: () => _data, getIncomingEdges: () => value13 },
      }),
      value14 = Object.assign(Object.create(aIGenTextNodeStateSyncModule4), {
        nodeId: id3,
        _data: _data.nodes[id3],
        promptEl: { innerText: '', childNodes: [] },
        btnEl: createSubmitButtonStub(),
      });
    (value14._updateSubmitButtonState(),
      assert.equal(value14.btnEl.disabled, false),
      assert.equal(value14.btnEl.style.cursor, ''));
  }));
function makeTextRefClassList(value15) {
  return {
    contains(value16) {
      return String(value15.className || '')
        .split(/\s+/)
        .includes(value16);
    },
    add(...list10) {
      const value17 = new Set(
        String(value15.className || '')
          .split(/\s+/)
          .filter(Boolean),
      );
      (list10.forEach((item5) => value17.add(String(item5 || ''))),
        (value15.className = Array.from(value17).join(' ')));
    },
    remove(...list11) {
      const map2 = new Set(list11.map((item6) => String(item6 || '')));
      value15.className = String(value15.className || '')
        .split(/\s+/)
        .filter((item7) => item7 && !map2.has(item7))
        .join(' ');
    },
  };
}
function createTextRefFakeElement(value18 = 'div') {
  const el = {
    tagName: String(value18 || 'div').toUpperCase(),
    className: '',
    dataset: {},
    attributes: {},
    childNodes: [],
    parentElement: null,
    style: {},
    _innerHTML: '',
    _innerHTMLSetCount: 0,
    classList: null,
    set innerHTML(value19) {
      ((el._innerHTMLSetCount += 1), (el._innerHTML = String(value19 || '')), (el.childNodes = []));
      if (el._innerHTML.includes('prompt-attachment-btn')) {
        const textRefFakeElement = createTextRefFakeElement('div');
        ((textRefFakeElement.className = 'prompt-attachment-btn'), el.appendChild(textRefFakeElement));
      }
      if (el._innerHTML.includes('ref-thumb-container')) {
        const textRefFakeElement2 = createTextRefFakeElement('div');
        ((textRefFakeElement2.className = 'ref-thumb-container'), el.appendChild(textRefFakeElement2));
      }
    },
    get innerHTML() {
      return el._innerHTML;
    },
    appendChild(el2) {
      if (el2.parentElement) {
        const count = el2.parentElement.childNodes.indexOf(el2);
        if (count >= 0) el2.parentElement.childNodes.splice(count, 1);
      }
      return ((el2.parentElement = el), (el2.parentNode = el), el.childNodes.push(el2), el2);
    },
    remove() {
      const enabled = el.parentElement;
      if (!enabled) return;
      const count2 = enabled.childNodes.indexOf(el);
      if (count2 >= 0) enabled.childNodes.splice(count2, 1);
      ((el.parentElement = null), (el.parentNode = null));
    },
    setAttribute(value20, value21) {
      el.attributes[String(value20 || '')] = String(value21 || '');
    },
    addEventListener() {},
    matches(list12) {
      if (list12.startsWith('.')) return el.classList.contains(list12.slice(1));
      return false;
    },
    querySelector(value22) {
      return el.querySelectorAll(value22)[0] || null;
    },
    querySelectorAll(list13) {
      const list14 = [],
        handler2 = (el3) => {
          if (list13.startsWith('.')) return el3.classList?.contains(list13.slice(1));
          return false;
        },
        handler3 = (value23) => {
          value23.childNodes.forEach((item8) => {
            if (handler2(item8)) list14.push(item8);
            handler3(item8);
          });
        };
      return (handler3(el), list14);
    },
  };
  return ((el.classList = makeTextRefClassList(el)), el);
}
(test('aigenText state sync: ref bar reuses thumbnails when source signature changes', () => {
  const value24 = globalThis.document;
  globalThis.document = { createElement: createTextRefFakeElement };
  try {
    const targetId = 'node-text-refbar',
      sourceId = 'node-image-ref',
      value25 = { id: 'edge-image', sourceId: sourceId, targetId: targetId },
      args3 = {
        pickConnectMode: {},
        nodes: {
          [targetId]: { id: targetId, type: 'ai-text' },
          [sourceId]: { id: sourceId, type: 'source-image', src: 'data:image/png;base64,a' },
        },
        edges: { [value25.id]: value25 },
      },
      aIGenTextNodeStateSyncModule5 = createAIGenTextNodeStateSyncModule({
        store: { getState: () => args3, getIncomingEdges: () => [value25] },
        ensureThumbDecoded: () => {},
        revealRefThumbMedia: () => {},
        _syncPillLabels: () => {},
      }),
      value26 = Object.assign(Object.create(aIGenTextNodeStateSyncModule5), {
        nodeId: targetId,
        refBarEl: createTextRefFakeElement('div'),
        _bindDragSort: () => {},
        _syncBtnIconState: () => {},
      });
    aIGenTextNodeStateSyncModule5._renderRefBar.call(value26);
    const el4 = value26.refBarEl.querySelector('.ref-thumb-container'),
      el5 = el4.querySelector('.ref-thumb-wrap'),
      count3 = value26.refBarEl._innerHTMLSetCount;
    (assert.ok(count3 >= 1),
      (args3.nodes[sourceId] = { ...args3.nodes[sourceId], src: 'data:image/png;base64,b' }),
      aIGenTextNodeStateSyncModule5._renderRefBar.call(value26),
      assert.equal(value26.refBarEl._innerHTMLSetCount, count3),
      assert.equal(el4.querySelector('.ref-thumb-wrap'), el5),
      assert.match(el5.innerHTML, /base64,b/));
  } finally {
    globalThis.document = value24;
  }
}),
  test('aigenText state sync: image ref thumbnails show mask badge only for masked sources', () => {
    const value27 = globalThis.document;
    globalThis.document = { createElement: createTextRefFakeElement };
    try {
      const targetId2 = 'node-text-mask-refbar',
        sourceId2 = 'node-image-masked',
        sourceId3 = 'node-image-plain',
        list15 = [
          { id: 'edge-masked', sourceId: sourceId2, targetId: targetId2 },
          { id: 'edge-plain', sourceId: sourceId3, targetId: targetId2 },
        ],
        value28 = {
          pickConnectMode: {},
          nodes: {
            [targetId2]: { id: targetId2, type: 'ai-text' },
            [sourceId2]: {
              id: sourceId2,
              type: 'source-image',
              src: 'data:image/png;base64,masked',
              maskImageUrl: 'output/mask/manual-mask.png',
            },
            [sourceId3]: { id: sourceId3, type: 'source-image', src: 'data:image/png;base64,plain' },
          },
          edges: Object.fromEntries(list15.map((item9) => [item9.id, item9])),
        },
        aIGenTextNodeStateSyncModule6 = createAIGenTextNodeStateSyncModule({
          store: { getState: () => value28, getIncomingEdges: () => list15 },
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        }),
        value29 = Object.assign(Object.create(aIGenTextNodeStateSyncModule6), {
          nodeId: targetId2,
          refBarEl: createTextRefFakeElement('div'),
          _bindDragSort: () => {},
          _syncBtnIconState: () => {},
        });
      aIGenTextNodeStateSyncModule6._renderRefBar.call(value29);
      const list16 = value29.refBarEl
        .querySelector('.ref-thumb-container')
        .querySelectorAll('.ref-thumb-wrap');
      (assert.equal(list16.length, 2),
        assert.match(list16[0].innerHTML, /ref-thumb-mask-badge/),
        assert.match(list16[0].innerHTML, />遮罩<\/span>/),
        assert.doesNotMatch(list16[1].innerHTML, /ref-thumb-mask-badge/));
    } finally {
      globalThis.document = value27;
    }
  }));
