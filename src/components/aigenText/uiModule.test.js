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
import { createFakePreviewContainer, installPreviewDomStubs } from '../../../tests/testPreviewDom.js';
const restorePreviewDom = installPreviewDomStubs(),
  originalRequestAnimationFrame = globalThis.requestAnimationFrame,
  __dirname = dirname(fileURLToPath(import.meta.url)),
  uiModuleSource = readFileSync(join(__dirname, 'uiModule.js'), 'utf8');
function escapeRegExp(_0x5106d9) {
  return String(_0x5106d9).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
typeof globalThis.requestAnimationFrame !== 'function' &&
  (globalThis.requestAnimationFrame = (_0x21258e) => {
    return (_0x21258e(), 0);
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
    const _0x825065 = buildApimartTextModelMenuHTML('apimart/kimi-k2-instruct'),
      _0xd808b = buildTextModelMenuHTML('gemini-3.1-pro', 'grsai'),
      _0x12e51f = buildTextModelMenuHTML('minimax/minimax-m2.5-highspeed', 'ppio'),
      _0xf8376e = buildRunningHubTextModelMenuHTML(
        'runninghub-model/rhart-text-g-3-flash-preview-cv/image-to-text',
      ),
      _0x392e89 = buildTextModelMenuHTML('volcengine/doubao-seed-2-0-pro-260215', 'volcengine'),
      _0x254974 = buildTextProviderMenuGroupsHTML('gemini-3.1-pro'),
      _0x1641a3 = APIMART_TEXT_MODEL_MENU_ITEMS.map((_0xa02e12) => [_0xa02e12.modelId, _0xa02e12.title]),
      _0x2329f6 = [
        [_0xd808b, '谷歌最新模型gemini3.1'],
        [_0x12e51f, '更低延迟、更高性价比的领先模型'],
        [_0x12e51f, '阿里最强开源模型Qwen2.5'],
        [_0x12e51f, '面向未来的新一代大模型'],
        [_0x12e51f, '月之暗面最新版，超长上下文'],
        [_0x825065, 'APIMart text model'],
        [_0x825065, 'OpenAI-compatible text model'],
        [_0x825065, '极致逻辑与推理性能，OpenAI 巅峰之作'],
        [_0x825065, '旗舰级多模态模型，支持超长文本与深度分析'],
        [_0x825065, '闪电级响应速度，适用于高频率对话与实时任务'],
        [_0xf8376e, '闪电级响应速度，适用于高频率对话与实时任务'],
        [_0xf8376e, '旗舰级多模态模型，支持超长文本与深度分析'],
        [_0x254974, '一个 API 搞定一切——节省 30-70%'],
      ];
    (assert.match(uiModuleSource, /buildTextProviderMenuGroupsHTML\(_activeModel\)/),
      assert.doesNotMatch(uiModuleSource, /buildApimartTextModelMenuHTML\(_activeModel\)/),
      assert.doesNotMatch(uiModuleSource, /return buildTextModelMenuHTML\(_activeModel/),
      assert.doesNotMatch(uiModuleSource, /data-lazy-text-provider=/),
      assert.doesNotMatch(uiModuleSource, /ensureTextProviderSubmenu/),
      assert.match(_0x254974, /grsai-submenu/),
      assert.match(_0x254974, /ppio-submenu/),
      assert.match(_0x254974, /apimart-submenu/),
      assert.match(_0x254974, /runninghub-submenu/),
      assert.match(_0x254974, /volcengine-submenu/),
      assert.match(_0x254974, /images\/volcengine\.svg/),
      assert.doesNotMatch(uiModuleSource, /data-value="deepseek-v3\.2"/),
      assert.doesNotMatch(uiModuleSource, /data-value="apimart\/deepseek-v3\.2"/),
      assert.doesNotMatch(
        uiModuleSource,
        /data-value="(?:minimax\/|qwen\/|deepseek\/|moonshotai\/|runninghub-model\/rhart-text|gemini-3\.1-pro-preview|gemini-3-flash-preview-nothinking|apimart\/gpt-5\.4)/,
      ),
      assert.doesNotMatch(uiModuleSource, /data-aicanvas-toggle/),
      assert.doesNotMatch(uiModuleSource, /aicanvas\/text-/),
      assert.doesNotMatch(uiModuleSource, /AICanvas Text/),
      assert.doesNotMatch(_0x825065, /data-value="deepseek-v3\.2"/),
      assert.doesNotMatch(_0x825065, /data-value="apimart\/deepseek-v3\.2"/));
    for (const [_0x22c47f, _0x422ddd] of _0x1641a3) {
      (assert.match(_0x825065, new RegExp('data-value="' + escapeRegExp(_0x22c47f) + '"')),
        assert.ok(_0x825065.includes('<div class="fmi-title">' + _0x422ddd + '</div>')));
    }
    (assert.ok(_0x825065.includes('<div class="fmi-title">gpt-5.4</div>')),
      assert.ok(_0x825065.includes('<div class="fmi-title">gemini-3.1-pro-preview</div>')),
      assert.ok(_0x825065.includes('<div class="fmi-title">gemini-3-flash-preview-nothinking</div>')));
    for (const [_0x208625, _0x3f582a] of _0x2329f6) {
      assert.ok(
        _0x208625.includes('<div class="fmi-sub">' + _0x3f582a + '</div>'),
        'text model menu should preserve subtitle: ' + _0x3f582a,
      );
    }
    for (const [_0x53d7d0, _0x4043f5] of Object.entries({
      grsai: _0xd808b,
      ppio: _0x12e51f,
      runninghub: _0xf8376e,
      volcengine: _0x392e89,
    })) {
      for (const _0x412ce7 of TEXT_MODEL_MENU_ITEMS_BY_PROVIDER[_0x53d7d0]) {
        (assert.match(_0x4043f5, new RegExp('data-value="' + escapeRegExp(_0x412ce7.modelId) + '"')),
          assert.ok(_0x4043f5.includes('data-provider="' + _0x412ce7.provider + '"')),
          assert.ok(_0x4043f5.includes('<div class="fmi-title">' + _0x412ce7.title + '</div>')));
      }
    }
  }),
  test('aigenText model menu: provider filter can expose only Volcengine', () => {
    const _0x42ac84 = buildTextProviderMenuGroupsHTML('volcengine/doubao-seed-2-0-pro-260215', {
      providers: ['volcengine'],
    });
    (assert.match(_0x42ac84, /volcengine-submenu/),
      assert.match(_0x42ac84, /volcengine\/doubao-seed-2-0-pro-260215/),
      assert.doesNotMatch(_0x42ac84, /apimart-submenu/),
      assert.doesNotMatch(_0x42ac84, /runninghub-submenu/),
      assert.doesNotMatch(_0x42ac84, /grsai-submenu/),
      assert.doesNotMatch(_0x42ac84, /ppio-submenu/));
  }),
  test('aigenText ui: default APIMart text model displays Kimi K2 Instruct', () => {
    (assert.match(uiModuleSource, /this\._data\.model \|\| "apimart\/kimi-k2-instruct"/),
      assert.match(
        uiModuleSource,
        /<span class="img-model-label">\$\{getDisplayModelName\(_activeModel\)\}<\/span>/,
      ),
      assert.equal(getDisplayModelName('apimart/kimi-k2-instruct'), 'Kimi K2 Instruct'));
  }));
function createSubmitButtonStub() {
  const _0x4ce6ea = new Set();
  return {
    disabled: false,
    title: '',
    innerHTML: '',
    style: { color: '', cursor: '' },
    dataset: {},
    classList: {
      add(..._0x475b66) {
        _0x475b66.forEach((_0x247012) => _0x4ce6ea.add(String(_0x247012 || '')));
      },
      remove(..._0x3ca820) {
        _0x3ca820.forEach((_0x57a367) => _0x4ce6ea.delete(String(_0x57a367 || '')));
      },
      contains(_0x31a7d3) {
        return _0x4ce6ea.has(String(_0x31a7d3 || ''));
      },
    },
    setAttribute(_0x29fa4a, _0x20f69f) {
      this.dataset[String(_0x29fa4a || '')] = String(_0x20f69f || '');
    },
  };
}
(test('aigenText ui: 输出区保持只读，不再进入编辑态', () => {
  let _0x5a50b8 = [];
  const _0x4107bc = [],
    _0x3386c9 = createAIGenTextNodeUiModule({
      store: {
        getState: () => ({
          selectedNodeIds: _0x5a50b8,
          nodes: { 'node-text-ui-preview': { outputScrollTop: 0 } },
        }),
        getStateRaw: () => ({ nodes: { 'node-text-ui-preview': { outputScrollTop: 0 } } }),
        setSelectedNodes: (_0x229739) => {
          _0x5a50b8 = _0x229739.slice();
        },
        updateNodeData: (_0x17b1ce, _0x294f95) => {
          _0x4107bc.push([_0x17b1ce, _0x294f95]);
        },
      },
    }),
    _0x2c7b56 = {
      _attrs: {},
      style: {},
      scrollTop: 42,
      setAttribute(_0x4eb694, _0x5cc7bf) {
        this._attrs[String(_0x4eb694 || '')] = String(_0x5cc7bf || '');
      },
      focus() {},
    },
    _0x3c4a4b = Object.assign(Object.create(_0x3386c9), {
      nodeId: 'node-text-ui-preview',
      outputEl: _0x2c7b56,
      _outputScrollTop: 24,
    });
  (_0x3386c9._enterOutputEditMode.call(_0x3c4a4b),
    assert.equal(_0x2c7b56._attrs.contenteditable, 'false'),
    assert.deepEqual(_0x5a50b8, [_0x3c4a4b.nodeId]),
    assert.deepEqual(_0x4107bc, [[_0x3c4a4b.nodeId, { outputScrollTop: 42 }]]),
    assert.match(uiModuleSource, /bindReadonlyTextSelection\(this\.outputEl,\s*\{/),
    assert.match(uiModuleSource, /onActivate: \(\) => this\._enterOutputEditMode\(\)/),
    assert.match(uiModuleSource, /onDeactivate: \(\) => this\._commitOutputScrollTop\(\)/),
    assert.doesNotMatch(uiModuleSource, /outputEl\.style\.userSelect = "none"/));
}),
  test('aigenText ui: 普通滚动也会节流保存 outputScrollTop', async () => {
    let _0x6f4389 = { outputScrollTop: 0 };
    const _0x50f4d7 = [],
      _0x5b3c08 = createAIGenTextNodeUiModule({
        store: {
          getStateRaw: () => ({ nodes: { 'node-text-scroll-save': _0x6f4389 } }),
          updateNodeData: (_0x5b48fa, _0x30a0e9) => {
            (_0x50f4d7.push([_0x5b48fa, _0x30a0e9]), (_0x6f4389 = { ..._0x6f4389, ..._0x30a0e9 }));
          },
        },
      }),
      _0x504058 = { scrollTop: 63 },
      _0x35ae24 = Object.assign(Object.create(_0x5b3c08), {
        nodeId: 'node-text-scroll-save',
        outputEl: _0x504058,
        _outputScrollTop: 0,
      });
    (_0x5b3c08._markOutputScrollTopDirty.call(_0x35ae24),
      assert.equal(_0x35ae24._outputScrollTopDirty, true),
      assert.equal(_0x35ae24._outputScrollTop, 63),
      await new Promise((_0x245d9d) => setTimeout(_0x245d9d, 160)),
      assert.equal(_0x35ae24._outputScrollTopDirty, false),
      assert.deepEqual(_0x50f4d7, [[_0x35ae24.nodeId, { outputScrollTop: 63 }]]),
      assert.match(uiModuleSource, /this\._markOutputScrollTopDirty\(\)/));
  }),
  test('aigenText ui: 预览模式双击输出区也不会进入编辑态', () => {
    let _0x228965 = [];
    const _0x23c2ac = createAIGenTextNodeUiModule({
        store: {
          getState: () => ({ selectedNodeIds: _0x228965 }),
          setSelectedNodes: (_0x31595b) => {
            _0x228965 = _0x31595b.slice();
          },
        },
      }),
      _0x2cadc9 = {
        _attrs: {},
        style: {},
        innerText: '',
        scrollTop: 0,
        setAttribute(_0x378f9f, _0x4c5356) {
          this._attrs[String(_0x378f9f || '')] = String(_0x4c5356 || '');
        },
        getAttribute(_0x571202) {
          return this._attrs[String(_0x571202 || '')] || null;
        },
        focus() {},
      },
      _0x2cc3d7 = Object.assign(Object.create(_0x23c2ac), {
        nodeId: 'node-text-ui-preview-dblclick',
        outputEl: _0x2cadc9,
        _outputScrollTop: 8,
      });
    let _0x109b5a = false,
      _0x22ff9d = false;
    (startPreviewNodeLoading(_0x2cc3d7.nodeId, createFakePreviewContainer()),
      setPreviewMode(true),
      assert.equal(isPreviewNodeLoading(_0x2cc3d7.nodeId), true),
      _0x23c2ac._handlePreviewDblclick.call(_0x2cc3d7, {
        preventDefault() {
          _0x109b5a = true;
        },
        stopPropagation() {
          _0x22ff9d = true;
        },
      }),
      assert.equal(_0x109b5a, false),
      assert.equal(_0x22ff9d, true),
      assert.notEqual(_0x2cadc9._attrs.contenteditable, 'true'),
      assert.equal(isPreviewNodeLoading(_0x2cc3d7.nodeId), true),
      assert.deepEqual(_0x228965, []));
  }),
  test('aigenText state sync: running state shows unified loading instead of prompt validation', () => {
    const _0x510375 = createAIGenTextNodeStateSyncModule({ store: {} }),
      _0x2be29a = Object.assign(Object.create(_0x510375), {
        _data: { isGenerating: true, jobStatus: 'running' },
        promptEl: { innerText: '' },
        btnEl: { disabled: false, style: { cursor: '' } },
      });
    (_0x510375._updateSubmitButtonState.call(_0x2be29a),
      assert.equal(_0x2be29a.btnEl.disabled, true),
      assert.equal(_0x2be29a.btnEl.style.cursor, 'var(--unavailable-cursor)'),
      assert.match(_0x2be29a.btnEl.innerHTML, /animation:spin/));
  }),
  test('aigenText state sync: 复制模式下不使用旧 outputScrollTop 还原滚动位置', () => {
    const _0x1fe58a = createAIGenTextNodeStateSyncModule({
        store: { getState: () => ({ pickConnectMode: {}, nodes: {} }), getIncomingEdges: () => [] },
        getDisplayModelName: (_0x2db9d4) => _0x2db9d4,
      }),
      _0x4c216c = {
        scrollTop: 88,
        classList: {
          contains(_0x3e1bd2) {
            return _0x3e1bd2 === 'is-text-selection-active';
          },
        },
        getAttribute() {
          return 'false';
        },
      };
    let _0x242c4b = 0;
    const _0xf6939 = Object.assign(Object.create(_0x1fe58a), {
      nodeId: 'node-text-scroll-active',
      _data: {},
      _outputScrollTop: 88,
      outputEl: _0x4c216c,
      _renderOutputText: () => {
        _0x242c4b += 1;
      },
      _renderRefBar: () => {},
      _syncPromptBoxSizeFromData: () => {},
      _updateSubmitButtonState: () => {},
    });
    (_0x1fe58a.update.call(_0xf6939, {
      id: _0xf6939.nodeId,
      type: 'ai-text',
      outputText: 'next',
      outputScrollTop: 5,
    }),
      assert.equal(_0x4c216c.scrollTop, 88),
      assert.equal(_0xf6939._outputScrollTop, 88),
      assert.equal(_0x242c4b, 0));
  }),
  test('aigenText state sync: 普通滚动待保存时不使用旧 outputScrollTop 还原滚动位置', () => {
    const _0x1d7564 = createAIGenTextNodeStateSyncModule({
        store: { getState: () => ({ pickConnectMode: {}, nodes: {} }), getIncomingEdges: () => [] },
        getDisplayModelName: (_0x40845e) => _0x40845e,
      }),
      _0x34848a = {
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
    let _0x19efd5 = 0;
    const _0x1305de = Object.assign(Object.create(_0x1d7564), {
      nodeId: 'node-text-scroll-dirty',
      _data: {},
      _lastRenderedOutputText: 'next',
      _outputScrollTop: 88,
      _outputScrollTopDirty: true,
      outputEl: _0x34848a,
      _renderOutputText: () => {
        _0x19efd5 += 1;
      },
      _renderRefBar: () => {},
      _syncPromptBoxSizeFromData: () => {},
      _updateSubmitButtonState: () => {},
    });
    (_0x1d7564.update.call(_0x1305de, {
      id: _0x1305de.nodeId,
      type: 'ai-text',
      outputText: 'next',
      outputScrollTop: 5,
    }),
      assert.equal(_0x34848a.scrollTop, 88),
      assert.equal(_0x1305de._outputScrollTop, 88),
      assert.equal(_0x1305de._outputScrollTopDirty, true),
      assert.equal(_0x19efd5, 0));
  }),
  test('aigenText submit button: empty editor can generate from non-empty text input', () => {
    const _0x6ff54 = 'node-text-target',
      _0x73ef6 = 'node-text-source',
      _0x4f6efd = {
        nodes: {
          [_0x6ff54]: { id: _0x6ff54, type: 'ai-text' },
          [_0x73ef6]: { id: _0x73ef6, type: 'source-text', content: '来自文本入参的提示词' },
        },
      },
      _0x38c091 = [{ id: 'edge-text-input', sourceId: _0x73ef6, targetId: _0x6ff54 }],
      _0x3300ab = createAIGenTextNodeStateSyncModule({
        store: { getState: () => _0x4f6efd, getIncomingEdges: () => _0x38c091 },
      }),
      _0x5ce6c4 = Object.assign(Object.create(_0x3300ab), {
        nodeId: _0x6ff54,
        _data: _0x4f6efd.nodes[_0x6ff54],
        promptEl: { innerText: '', childNodes: [] },
        btnEl: createSubmitButtonStub(),
      });
    (_0x5ce6c4._updateSubmitButtonState(),
      assert.equal(_0x5ce6c4.btnEl.disabled, false),
      assert.equal(_0x5ce6c4.btnEl.style.cursor, ''));
  }));
function makeTextRefClassList(_0xafed15) {
  return {
    contains(_0x2c2078) {
      return String(_0xafed15.className || '')
        .split(/\s+/)
        .includes(_0x2c2078);
    },
    add(..._0x336f9d) {
      const _0x4c17b4 = new Set(
        String(_0xafed15.className || '')
          .split(/\s+/)
          .filter(Boolean),
      );
      (_0x336f9d.forEach((_0x2ad122) => _0x4c17b4.add(String(_0x2ad122 || ''))),
        (_0xafed15.className = Array.from(_0x4c17b4).join(' ')));
    },
    remove(..._0x19417c) {
      const _0x30c1bd = new Set(_0x19417c.map((_0x52087b) => String(_0x52087b || '')));
      _0xafed15.className = String(_0xafed15.className || '')
        .split(/\s+/)
        .filter((_0x43c55b) => _0x43c55b && !_0x30c1bd.has(_0x43c55b))
        .join(' ');
    },
  };
}
function createTextRefFakeElement(_0x587583 = 'div') {
  const _0x4b17a0 = {
    tagName: String(_0x587583 || 'div').toUpperCase(),
    className: '',
    dataset: {},
    attributes: {},
    childNodes: [],
    parentElement: null,
    style: {},
    _innerHTML: '',
    _innerHTMLSetCount: 0,
    classList: null,
    set innerHTML(_0x40c4ab) {
      ((_0x4b17a0._innerHTMLSetCount += 1),
        (_0x4b17a0._innerHTML = String(_0x40c4ab || '')),
        (_0x4b17a0.childNodes = []));
      if (_0x4b17a0._innerHTML.includes('prompt-attachment-btn')) {
        const _0x39c9dd = createTextRefFakeElement('div');
        ((_0x39c9dd.className = 'prompt-attachment-btn'), _0x4b17a0.appendChild(_0x39c9dd));
      }
      if (_0x4b17a0._innerHTML.includes('ref-thumb-container')) {
        const _0x146ba3 = createTextRefFakeElement('div');
        ((_0x146ba3.className = 'ref-thumb-container'), _0x4b17a0.appendChild(_0x146ba3));
      }
    },
    get innerHTML() {
      return _0x4b17a0._innerHTML;
    },
    appendChild(_0x41fe3d) {
      if (_0x41fe3d.parentElement) {
        const _0x1377d5 = _0x41fe3d.parentElement.childNodes.indexOf(_0x41fe3d);
        if (_0x1377d5 >= 0) _0x41fe3d.parentElement.childNodes.splice(_0x1377d5, 1);
      }
      return (
        (_0x41fe3d.parentElement = _0x4b17a0),
        (_0x41fe3d.parentNode = _0x4b17a0),
        _0x4b17a0.childNodes.push(_0x41fe3d),
        _0x41fe3d
      );
    },
    remove() {
      const _0x11baa8 = _0x4b17a0.parentElement;
      if (!_0x11baa8) return;
      const _0x335d95 = _0x11baa8.childNodes.indexOf(_0x4b17a0);
      if (_0x335d95 >= 0) _0x11baa8.childNodes.splice(_0x335d95, 1);
      ((_0x4b17a0.parentElement = null), (_0x4b17a0.parentNode = null));
    },
    setAttribute(_0xa775bc, _0x4577ef) {
      _0x4b17a0.attributes[String(_0xa775bc || '')] = String(_0x4577ef || '');
    },
    addEventListener() {},
    matches(_0x27c15c) {
      if (_0x27c15c.startsWith('.')) return _0x4b17a0.classList.contains(_0x27c15c.slice(1));
      return false;
    },
    querySelector(_0xc9a621) {
      return _0x4b17a0.querySelectorAll(_0xc9a621)[0] || null;
    },
    querySelectorAll(_0x51dc52) {
      const _0x1e028e = [],
        _0x529eb1 = (_0x4adc44) => {
          if (_0x51dc52.startsWith('.')) return _0x4adc44.classList?.contains(_0x51dc52.slice(1));
          return false;
        },
        _0x24989c = (_0x25a390) => {
          _0x25a390.childNodes.forEach((_0x57fa9a) => {
            if (_0x529eb1(_0x57fa9a)) _0x1e028e.push(_0x57fa9a);
            _0x24989c(_0x57fa9a);
          });
        };
      return (_0x24989c(_0x4b17a0), _0x1e028e);
    },
  };
  return ((_0x4b17a0.classList = makeTextRefClassList(_0x4b17a0)), _0x4b17a0);
}
(test('aigenText state sync: ref bar reuses thumbnails when source signature changes', () => {
  const _0x2146b8 = globalThis.document;
  globalThis.document = { createElement: createTextRefFakeElement };
  try {
    const _0x44cbb5 = 'node-text-refbar',
      _0x8811c0 = 'node-image-ref',
      _0x559279 = { id: 'edge-image', sourceId: _0x8811c0, targetId: _0x44cbb5 },
      _0x3f90c2 = {
        pickConnectMode: {},
        nodes: {
          [_0x44cbb5]: { id: _0x44cbb5, type: 'ai-text' },
          [_0x8811c0]: { id: _0x8811c0, type: 'source-image', src: 'data:image/png;base64,a' },
        },
        edges: { [_0x559279.id]: _0x559279 },
      },
      _0x36ed22 = createAIGenTextNodeStateSyncModule({
        store: { getState: () => _0x3f90c2, getIncomingEdges: () => [_0x559279] },
        ensureThumbDecoded: () => {},
        revealRefThumbMedia: () => {},
        _syncPillLabels: () => {},
      }),
      _0x1d1652 = Object.assign(Object.create(_0x36ed22), {
        nodeId: _0x44cbb5,
        refBarEl: createTextRefFakeElement('div'),
        _bindDragSort: () => {},
        _syncBtnIconState: () => {},
      });
    _0x36ed22._renderRefBar.call(_0x1d1652);
    const _0x3f3628 = _0x1d1652.refBarEl.querySelector('.ref-thumb-container'),
      _0x14f12d = _0x3f3628.querySelector('.ref-thumb-wrap'),
      _0x8f1ea4 = _0x1d1652.refBarEl._innerHTMLSetCount;
    (assert.ok(_0x8f1ea4 >= 1),
      (_0x3f90c2.nodes[_0x8811c0] = { ..._0x3f90c2.nodes[_0x8811c0], src: 'data:image/png;base64,b' }),
      _0x36ed22._renderRefBar.call(_0x1d1652),
      assert.equal(_0x1d1652.refBarEl._innerHTMLSetCount, _0x8f1ea4),
      assert.equal(_0x3f3628.querySelector('.ref-thumb-wrap'), _0x14f12d),
      assert.match(_0x14f12d.innerHTML, /base64,b/));
  } finally {
    globalThis.document = _0x2146b8;
  }
}),
  test('aigenText state sync: image ref thumbnails show mask badge only for masked sources', () => {
    const _0x252f95 = globalThis.document;
    globalThis.document = { createElement: createTextRefFakeElement };
    try {
      const _0x85dae8 = 'node-text-mask-refbar',
        _0x1315f0 = 'node-image-masked',
        _0x29b107 = 'node-image-plain',
        _0x542d6f = [
          { id: 'edge-masked', sourceId: _0x1315f0, targetId: _0x85dae8 },
          { id: 'edge-plain', sourceId: _0x29b107, targetId: _0x85dae8 },
        ],
        _0x1deaf1 = {
          pickConnectMode: {},
          nodes: {
            [_0x85dae8]: { id: _0x85dae8, type: 'ai-text' },
            [_0x1315f0]: {
              id: _0x1315f0,
              type: 'source-image',
              src: 'data:image/png;base64,masked',
              maskImageUrl: 'output/mask/manual-mask.png',
            },
            [_0x29b107]: { id: _0x29b107, type: 'source-image', src: 'data:image/png;base64,plain' },
          },
          edges: Object.fromEntries(_0x542d6f.map((_0x19244c) => [_0x19244c.id, _0x19244c])),
        },
        _0x15ac17 = createAIGenTextNodeStateSyncModule({
          store: { getState: () => _0x1deaf1, getIncomingEdges: () => _0x542d6f },
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        }),
        _0x4081a2 = Object.assign(Object.create(_0x15ac17), {
          nodeId: _0x85dae8,
          refBarEl: createTextRefFakeElement('div'),
          _bindDragSort: () => {},
          _syncBtnIconState: () => {},
        });
      _0x15ac17._renderRefBar.call(_0x4081a2);
      const _0x5ab59f = _0x4081a2.refBarEl
        .querySelector('.ref-thumb-container')
        .querySelectorAll('.ref-thumb-wrap');
      (assert.equal(_0x5ab59f.length, 2),
        assert.match(_0x5ab59f[0].innerHTML, /ref-thumb-mask-badge/),
        assert.match(_0x5ab59f[0].innerHTML, />遮罩<\/span>/),
        assert.doesNotMatch(_0x5ab59f[1].innerHTML, /ref-thumb-mask-badge/));
    } finally {
      globalThis.document = _0x252f95;
    }
  }));
