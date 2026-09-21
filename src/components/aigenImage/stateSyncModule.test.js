import test from 'node:test';
import assert from 'node:assert/strict';
import { createAIGenerateNodeStateSyncModule, resolveRefImageRenderSources } from './stateSyncModule.js';
import { createAIGenerateNodeUiModule } from './uiModule.js';
function createButtonStub() {
  const _0x975765 = new Set(['is-rh-busy']);
  return {
    disabled: true,
    title: 'busy',
    innerHTML: '<svg style="animation:spin 1s linear infinite"></svg>',
    style: { color: 'var(--white)', cursor: '' },
    classList: {
      add(_0x1355df) {
        _0x975765.add(String(_0x1355df || ''));
      },
      remove(_0x21202c) {
        _0x975765.delete(String(_0x21202c || ''));
      },
      contains(_0xf630f6) {
        return _0x975765.has(String(_0xf630f6 || ''));
      },
    },
  };
}
function createIdleButtonStub() {
  const _0xd20871 = new Set();
  return {
    disabled: false,
    title: '',
    innerHTML: '',
    style: { color: '', cursor: '' },
    dataset: {},
    classList: {
      add(..._0x562a7a) {
        _0x562a7a.forEach((_0x4643c0) => _0xd20871.add(String(_0x4643c0 || '')));
      },
      remove(..._0xb4ea85) {
        _0xb4ea85.forEach((_0x4ee748) => _0xd20871.delete(String(_0x4ee748 || '')));
      },
      toggle(_0x95cec1, _0x3df5e4) {
        const _0x940a2a = String(_0x95cec1 || '');
        if (_0x3df5e4 === true) return (_0xd20871.add(_0x940a2a), true);
        if (_0x3df5e4 === false) return (_0xd20871.delete(_0x940a2a), false);
        if (_0xd20871.has(_0x940a2a)) return (_0xd20871.delete(_0x940a2a), false);
        return (_0xd20871.add(_0x940a2a), true);
      },
      contains(_0x192c3a) {
        return _0xd20871.has(String(_0x192c3a || ''));
      },
    },
    setAttribute(_0x5ec390, _0xbe655d) {
      this.dataset[String(_0x5ec390 || '')] = String(_0xbe655d || '');
    },
    removeAttribute(_0x2f7817) {
      delete this.dataset[String(_0x2f7817 || '')];
    },
  };
}
class FakeClassList {
  constructor(_0x1631f5) {
    this.owner = _0x1631f5;
  }
  ['_tokens']() {
    return String(this.owner.className || '')
      .split(/\s+/)
      .filter(Boolean);
  }
  ['contains'](_0x2f49e9) {
    return this._tokens().includes(String(_0x2f49e9 || ''));
  }
  ['add'](..._0xd11679) {
    const _0x31e5ec = new Set(this._tokens());
    (_0xd11679.forEach((_0x4932d6) => _0x31e5ec.add(String(_0x4932d6 || ''))),
      (this.owner.className = Array.from(_0x31e5ec).join(' ')));
  }
  ['remove'](..._0x3ee8c8) {
    const _0x5851f0 = new Set(_0x3ee8c8.map((_0x50a922) => String(_0x50a922 || '')));
    this.owner.className = this._tokens()
      .filter((_0x1584b4) => !_0x5851f0.has(_0x1584b4))
      .join(' ');
  }
  ['toggle'](_0x422156, _0x19072f) {
    const _0x11d796 = String(_0x422156 || ''),
      _0x248362 = this.contains(_0x11d796),
      _0x272188 = _0x19072f === undefined ? !_0x248362 : Boolean(_0x19072f);
    if (_0x272188) this.add(_0x11d796);
    else this.remove(_0x11d796);
    return _0x272188;
  }
}
class FakeElement {
  constructor({ className: className = '', dataset: dataset = {}, tagName: tagName = 'div' } = {}) {
    ((this.tagName = String(tagName || 'div').toUpperCase()),
      (this.className = className),
      (this.dataset = { ...dataset }),
      (this.style = {}),
      (this.attributes = {}),
      (this.children = []),
      (this.parentNode = null),
      (this.parentElement = null),
      (this.listeners = new Map()),
      (this.classList = new FakeClassList(this)),
      (this._innerHTML = ''));
  }
  get ['innerHTML']() {
    return this._innerHTML;
  }
  set ['innerHTML'](_0x580516) {
    this._innerHTML = String(_0x580516 || '');
    if (!this._innerHTML.includes('ref-thumb-container')) return;
    this.children = [];
    const _0x30b2b6 = new FakeElement({ className: 'prompt-attachment-btn' }),
      _0x48662e = new FakeElement({ className: 'ref-thumb-container' });
    (this.appendChild(_0x30b2b6),
      this.appendChild(_0x48662e),
      this._innerHTML.includes('data-ref-slot="replaceTarget"') &&
        _0x48662e.appendChild(
          new FakeElement({
            className: 'ref-thumb-wrap ref-upload-slot',
            dataset: {
              refSlot: 'replaceTarget',
              slot: this._innerHTML.includes('data-slot="replaceTarget"') ? 'replaceTarget' : '',
              kind: this._innerHTML.includes('data-kind="image"') ? 'image' : '',
            },
          }),
        ),
      this._innerHTML.includes('data-ref-slot="replacedImage"') &&
        _0x48662e.appendChild(
          new FakeElement({
            className: 'ref-thumb-wrap ref-upload-slot',
            dataset: {
              refSlot: 'replacedImage',
              slot: this._innerHTML.includes('data-slot="replacedImage"') ? 'replacedImage' : '',
              kind: this._innerHTML.includes('data-kind="image"') ? 'image' : '',
            },
          }),
        ));
  }
  get ['nextSibling']() {
    if (!this.parentNode) return null;
    const _0x56ed83 = this.parentNode.children,
      _0x16ac73 = _0x56ed83.indexOf(this);
    return _0x16ac73 >= 0 ? _0x56ed83[_0x16ac73 + 1] || null : null;
  }
  ['appendChild'](_0x46545c) {
    if (_0x46545c.parentNode) _0x46545c.remove();
    return (
      this.children.push(_0x46545c),
      (_0x46545c.parentNode = this),
      (_0x46545c.parentElement = this),
      _0x46545c
    );
  }
  ['insertBefore'](_0x53eac6, _0x439788) {
    if (_0x53eac6.parentNode) _0x53eac6.remove();
    const _0x3fc389 = _0x439788 ? this.children.indexOf(_0x439788) : -1;
    if (_0x3fc389 >= 0) this.children.splice(_0x3fc389, 0, _0x53eac6);
    else this.children.push(_0x53eac6);
    return ((_0x53eac6.parentNode = this), (_0x53eac6.parentElement = this), _0x53eac6);
  }
  ['remove']() {
    if (!this.parentNode) return;
    const _0x57bbb6 = this.parentNode.children,
      _0x448d8e = _0x57bbb6.indexOf(this);
    if (_0x448d8e >= 0) _0x57bbb6.splice(_0x448d8e, 1);
    ((this.parentNode = null), (this.parentElement = null));
  }
  ['replaceWith'](_0x30e228) {
    if (!this.parentNode) return;
    const _0x1d4a96 = this.parentNode,
      _0x149638 = _0x1d4a96.children,
      _0x4cf79a = _0x149638.indexOf(this);
    if (_0x4cf79a < 0) return;
    if (_0x30e228.parentNode) _0x30e228.remove();
    ((_0x149638[_0x4cf79a] = _0x30e228),
      (_0x30e228.parentNode = _0x1d4a96),
      (_0x30e228.parentElement = _0x1d4a96),
      (this.parentNode = null),
      (this.parentElement = null));
  }
  ['setAttribute'](_0x1b606c, _0x2015a9) {
    this.attributes[String(_0x1b606c)] = String(_0x2015a9);
  }
  ['getAttribute'](_0x44c1d5) {
    return this.attributes[String(_0x44c1d5)];
  }
  ['addEventListener'](_0x16f127, _0x23aaac) {
    if (!this.listeners.has(_0x16f127)) this.listeners.set(_0x16f127, []);
    this.listeners.get(_0x16f127).push(_0x23aaac);
  }
  ['dispatch'](_0x162edd, _0x330b10) {
    for (const _0x586d5a of this.listeners.get(_0x162edd) || []) _0x586d5a(_0x330b10);
  }
  ['matches'](_0x1f9102) {
    if (_0x1f9102 === '.ref-thumb-wrap') return this.classList.contains('ref-thumb-wrap');
    if (_0x1f9102 === '.ref-thumb-container') return this.classList.contains('ref-thumb-container');
    if (_0x1f9102 === '[data-slot]') return !!this.dataset.slot;
    return matchesFakeSelector(this, _0x1f9102);
  }
  ['closest'](_0x1306f6) {
    let _0x1b1923 = this;
    while (_0x1b1923) {
      if (_0x1b1923.matches(_0x1306f6)) return _0x1b1923;
      _0x1b1923 = _0x1b1923.parentElement;
    }
    return null;
  }
  ['querySelector'](_0x4c94ad) {
    return this.querySelectorAll(_0x4c94ad)[0] || null;
  }
  ['querySelectorAll'](_0xe3a63a) {
    const _0x3f45bb = [],
      _0x4e2542 = (_0x22dedc) => {
        if (matchesFakeSelector(_0x22dedc, _0xe3a63a)) _0x3f45bb.push(_0x22dedc);
        _0x22dedc.children.forEach(_0x4e2542);
      };
    return (this.children.forEach(_0x4e2542), _0x3f45bb);
  }
}
function matchesFakeSelector(_0x89ffc3, _0x175ba8) {
  if (_0x175ba8 === '.prompt-attachment-btn') return _0x89ffc3.classList.contains('prompt-attachment-btn');
  if (_0x175ba8 === '.ref-thumb-container') return _0x89ffc3.classList.contains('ref-thumb-container');
  if (_0x175ba8 === '.ref-thumb-wrap') return _0x89ffc3.classList.contains('ref-thumb-wrap');
  if (_0x175ba8 === '.ref-thumb-wrap.is-drop-allow')
    return _0x89ffc3.classList.contains('ref-thumb-wrap') && _0x89ffc3.classList.contains('is-drop-allow');
  const _0x34c6e6 = _0x175ba8.match(/^\.ref-upload-slot\[data-ref-slot="([^"]+)"\]$/);
  if (_0x34c6e6)
    return _0x89ffc3.classList.contains('ref-upload-slot') && _0x89ffc3.dataset.refSlot === _0x34c6e6[1];
  const _0x58c343 = _0x175ba8.match(/^\[data-ref-slot="([^"]+)"\]$/);
  if (_0x58c343) return _0x89ffc3.dataset.refSlot === _0x58c343[1];
  const _0x5ec186 = _0x175ba8.match(/^\[data-slot="([^"]+)"\]$/);
  if (_0x5ec186) return _0x89ffc3.dataset.slot === _0x5ec186[1];
  if (_0x175ba8 === '[data-slot]') return !!_0x89ffc3.dataset.slot;
  return false;
}
function createDragEvent(_0x2ed3a6) {
  return {
    target: _0x2ed3a6,
    dataTransfer: { effectAllowed: '', dropEffect: '', setData() {} },
    preventDefault() {},
    stopPropagation() {},
  };
}
(test('aigenImage state sync: 列表缩略图优先 thumbLocalPath，hover 预览优先 displayLocalPath', () => {
  const _0x35c474 = resolveRefImageRenderSources({
    id: 'src-image-1',
    type: 'source-image',
    originalLocalPath: 'output/original.png',
    displayLocalPath: 'output/display.jpg',
    thumbLocalPath: 'output/thumb.jpg',
  });
  assert.deepEqual(_0x35c474, { thumbSrc: '/output/thumb.jpg', previewSrc: '/output/display.jpg' });
}),
  test('aigenImage state sync: hover 预览缺少 displayLocalPath 时回退 originalLocalPath', () => {
    const _0x29d376 = resolveRefImageRenderSources({
      id: 'src-image-2',
      type: 'source-image',
      originalLocalPath: 'output/original.png',
      thumbLocalPath: 'output/thumb.jpg',
    });
    assert.deepEqual(_0x29d376, { thumbSrc: '/output/thumb.jpg', previewSrc: '/output/original.png' });
  }),
  test('aigenImage state sync: ai-image 顶层缺失时回退 main image 的本地派生图', () => {
    const _0xc8cfd8 = resolveRefImageRenderSources({
      id: 'src-ai-image-1',
      type: 'ai-image',
      images: [
        { localPath: 'output/first.png' },
        {
          originalLocalPath: 'output/final.png',
          displayLocalPath: 'output/final-display.jpg',
          thumbLocalPath: 'output/final-thumb.jpg',
        },
      ],
      mainImageIndex: 1,
    });
    assert.deepEqual(_0xc8cfd8, {
      thumbSrc: '/output/final-thumb.jpg',
      previewSrc: '/output/final-display.jpg',
    });
  }),
  test('aigenImage state sync: 顶层本地字段仍优先于 main image', () => {
    const _0x2b1596 = resolveRefImageRenderSources({
      id: 'src-ai-image-2',
      type: 'ai-image',
      localPath: 'output/top-level.png',
      displayLocalPath: 'output/top-level-display.jpg',
      thumbLocalPath: 'output/top-level-thumb.jpg',
      images: [
        {
          originalLocalPath: 'output/nested.png',
          displayLocalPath: 'output/nested-display.jpg',
          thumbLocalPath: 'output/nested-thumb.jpg',
        },
      ],
      mainImageIndex: 0,
    });
    assert.deepEqual(_0x2b1596, {
      thumbSrc: '/output/top-level-thumb.jpg',
      previewSrc: '/output/top-level-display.jpg',
    });
  }),
  test('aigenImage state sync: 旧节点只有 blob 缩略图时 hover 预览回退到同一张图', () => {
    const _0x3ea528 = resolveRefImageRenderSources(
      { id: 'src-image-legacy-blob', type: 'source-image' },
      { thumbBlobUrl: 'blob:legacy-thumb' },
    );
    assert.deepEqual(_0x3ea528, { thumbSrc: 'blob:legacy-thumb', previewSrc: 'blob:legacy-thumb' });
  }),
  test('aigenImage state sync: terminal Dreamina state clears loading UI', () => {
    const _0xf6838c = globalThis.document;
    globalThis.document = { activeElement: null };
    try {
      const _0x2199a3 = 'node-state-sync-dreamina-terminal',
        _0x3cf8d8 = {
          selectedNodeIds: [],
          pickConnectMode: {},
          nodes: { [_0x2199a3]: { id: _0x2199a3, model: 'dreamina/4.1', provider: 'dreamina' } },
          edges: {},
        };
      let _0x12757f = 0,
        _0x2fb788 = 0,
        _0x3501df = 0,
        _0x195ff4 = 0;
      const _0x54b6b9 = createAIGenerateNodeStateSyncModule({
          store: { getState: () => _0x3cf8d8, getIncomingEdges: () => [] },
          getImage: async () => null,
          getDisplayModelName: (_0x5a458a) => _0x5a458a,
          stopLoading: () => {
            _0x12757f += 1;
          },
        }),
        _0x2a3e33 = Object.assign(Object.create(_0x54b6b9), {
          nodeId: _0x2199a3,
          _data: _0x3cf8d8.nodes[_0x2199a3],
          _isGenerating: true,
          _dreaminaActiveSubmitId: 'sid-terminal',
          _refThumbObjectUrls: new Map(),
          previewEl: {},
          btnEl: createButtonStub(),
          promptEl: { innerHTML: '', innerText: 'prompt' },
          _normalizeDreaminaNodeData: (_0x58daad) => _0x58daad,
          _loadAndDisplayImage: () => {},
          _applyMaskPreview: () => {},
          _applyModelParamVisibility: () => {},
          _stopDreaminaRecovery: () => {
            _0x2fb788 += 1;
          },
          _maybeResumeDreaminaTaskImpl: () => {
            _0x3501df += 1;
          },
          _updateSubmitButtonState: () => {
            _0x195ff4 += 1;
          },
        });
      (_0x54b6b9.update.call(_0x2a3e33, {
        id: _0x2199a3,
        model: 'dreamina/4.1',
        provider: 'dreamina',
        jobStatus: 'error',
        dreaminaTaskStatus: 'error',
        dreaminaTaskPhase: 'generating',
        isGenerating: false,
      }),
        assert.equal(_0x2a3e33._isGenerating, false),
        assert.equal(_0x2a3e33._dreaminaActiveSubmitId, ''),
        assert.equal(_0x12757f, 1),
        assert.equal(_0x2fb788, 1),
        assert.equal(_0x3501df, 0),
        assert.equal(_0x195ff4, 1),
        assert.equal(_0x2a3e33.btnEl.classList.contains('is-rh-busy'), false),
        assert.equal(_0x2a3e33.btnEl.title, '生成'),
        assert.doesNotMatch(_0x2a3e33.btnEl.innerHTML, /animation:spin/));
    } finally {
      typeof _0xf6838c === 'undefined' ? delete globalThis.document : (globalThis.document = _0xf6838c);
    }
  }),
  test('aigenImage state sync: running RH task keeps loading when inactive Dreamina fields are done', () => {
    const _0x45f2b2 = globalThis.document;
    globalThis.document = { activeElement: null };
    try {
      const _0x452646 = 'node-state-sync-rh-running',
        _0x2e2c6a = {
          selectedNodeIds: [],
          pickConnectMode: {},
          nodes: {
            [_0x452646]: { id: _0x452646, model: 'runninghub/2044874075721441281', provider: 'runninghubwf' },
          },
          edges: {},
        };
      let _0xa71e70 = 0,
        _0x51ea4b = 0,
        _0x1b74d4 = 0;
      const _0x3594fd = createAIGenerateNodeStateSyncModule({
          store: { getState: () => _0x2e2c6a, getIncomingEdges: () => [] },
          getImage: async () => null,
          getDisplayModelName: (_0x1ea2bf) => _0x1ea2bf,
          startLoading: () => {
            _0xa71e70 += 1;
          },
          stopLoading: () => {
            _0x51ea4b += 1;
          },
        }),
        _0xe1d71b = Object.assign(Object.create(_0x3594fd), {
          nodeId: _0x452646,
          _data: _0x2e2c6a.nodes[_0x452646],
          _isGenerating: true,
          _refThumbObjectUrls: new Map(),
          previewEl: {},
          btnEl: createButtonStub(),
          promptEl: { innerHTML: '', innerText: 'prompt' },
          _normalizeDreaminaNodeData: (_0x3f3217) => _0x3f3217,
          _loadAndDisplayImage: () => {},
          _applyMaskPreview: () => {},
          _applyModelParamVisibility: () => {},
          _maybeResumeRunningHubTaskImpl: () => {
            _0x1b74d4 += 1;
          },
          _maybeResumeDreaminaTaskImpl: () => {},
          _maybeResumeAsyncTaskImpl: () => {},
          _updateSubmitButtonState: () => {},
        });
      (_0x3594fd.update.call(_0xe1d71b, {
        id: _0x452646,
        model: 'runninghub/2044874075721441281',
        provider: 'runninghubwf',
        imageUrl: '/output/previous.png',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskStatus: 'pending',
        dreaminaTaskStatus: 'idle',
        dreaminaTaskPhase: 'done',
        asyncTaskStatus: 'idle',
      }),
        assert.equal(_0xe1d71b._isGenerating, true),
        assert.equal(_0xa71e70, 1),
        assert.equal(_0x51ea4b, 0),
        assert.equal(_0x1b74d4, 1),
        assert.equal(_0xe1d71b.btnEl.classList.contains('is-rh-busy'), true),
        assert.match(_0xe1d71b.btnEl.innerHTML, /animation:spin/));
    } finally {
      typeof _0x45f2b2 === 'undefined' ? delete globalThis.document : (globalThis.document = _0x45f2b2);
    }
  }),
  test('aigenImage state sync: live running state restarts loading after remount', () => {
    const _0x1015af = globalThis.document;
    globalThis.document = { activeElement: null };
    try {
      const _0x20c7e7 = 'node-state-sync-live-running',
        _0x53cf8a = {
          selectedNodeIds: [],
          pickConnectMode: {},
          nodes: { [_0x20c7e7]: { id: _0x20c7e7, model: 'volcengine/seedream-4.0', provider: 'volcengine' } },
          edges: {},
        };
      let _0x1dfa70 = 0,
        _0x174fcd = 0;
      const _0x432620 = createAIGenerateNodeStateSyncModule({
          store: { getState: () => _0x53cf8a, getIncomingEdges: () => [] },
          getImage: async () => null,
          getDisplayModelName: (_0x8634e7) => _0x8634e7,
          startLoading: () => {
            _0x1dfa70 += 1;
          },
          stopLoading: () => {
            _0x174fcd += 1;
          },
        }),
        _0x433195 = Object.assign(Object.create(_0x432620), {
          nodeId: _0x20c7e7,
          _data: _0x53cf8a.nodes[_0x20c7e7],
          _isGenerating: false,
          _refThumbObjectUrls: new Map(),
          previewEl: {},
          btnEl: createIdleButtonStub(),
          promptEl: { innerHTML: '', innerText: 'prompt' },
          _normalizeDreaminaNodeData: (_0x23bca6) => _0x23bca6,
          _loadAndDisplayImage: () => {},
          _applyMaskPreview: () => {},
          _applyModelParamVisibility: () => {},
          _maybeResumeRunningHubTaskImpl: () => {},
          _maybeResumeDreaminaTaskImpl: () => {},
          _maybeResumeAsyncTaskImpl: () => {},
          _updateSubmitButtonState: () => {},
        });
      (_0x432620.update.call(_0x433195, {
        id: _0x20c7e7,
        model: 'volcengine/seedream-4.0',
        provider: 'volcengine',
        isGenerating: true,
        jobStatus: 'running',
        generationStartTime: 0x3e8,
        generationDuration: null,
      }),
        assert.equal(_0x433195._isGenerating, true),
        assert.equal(_0x1dfa70, 1),
        assert.equal(_0x174fcd, 0));
    } finally {
      typeof _0x1015af === 'undefined' ? delete globalThis.document : (globalThis.document = _0x1015af);
    }
  }),
  test('aigenImage submit button: running RH state renders cancel button from unified state', () => {
    const _0x4e3a46 = 'node-image-rh-running-button-state',
      _0x1ebd7f = {
        nodes: {
          [_0x4e3a46]: {
            id: _0x4e3a46,
            model: 'runninghub/2044874075721441281',
            provider: 'runninghubwf',
            rhTaskId: 'rh-image-running',
            rhTaskStatus: 'running',
            jobStatus: 'running',
            isGenerating: true,
          },
        },
      },
      _0x572b02 = createAIGenerateNodeUiModule({
        store: { getState: () => _0x1ebd7f, getIncomingEdges: () => [] },
      }),
      _0x9e6dbe = Object.assign(Object.create(_0x572b02), {
        nodeId: _0x4e3a46,
        _data: _0x1ebd7f.nodes[_0x4e3a46],
        _rhCancelInFlight: false,
        promptEl: { innerText: 'prompt' },
        btnEl: createIdleButtonStub(),
        _isRunninghubWorkflowModel: () => true,
      });
    (_0x572b02._updateSubmitButtonState.call(_0x9e6dbe),
      assert.equal(_0x9e6dbe.btnEl.disabled, false),
      assert.equal(_0x9e6dbe.btnEl.style.cursor, ''),
      assert.equal(_0x9e6dbe.btnEl.classList.contains('is-task-cancel'), true),
      assert.match(_0x9e6dbe.btnEl.innerHTML, /v2-task-cancel-spin/),
      (_0x9e6dbe._rhCancelInFlight = true),
      _0x572b02._updateSubmitButtonState.call(_0x9e6dbe),
      assert.equal(_0x9e6dbe.btnEl.disabled, true),
      assert.equal(_0x9e6dbe.btnEl.style.cursor, 'var(--unavailable-cursor)'),
      assert.equal(_0x9e6dbe.btnEl.classList.contains('is-task-cancel'), true),
      (_0x1ebd7f.nodes[_0x4e3a46] = {
        ..._0x1ebd7f.nodes[_0x4e3a46],
        rhTaskStatus: 'failed',
        jobStatus: 'error',
        isGenerating: true,
      }),
      (_0x9e6dbe._data = _0x1ebd7f.nodes[_0x4e3a46]),
      (_0x9e6dbe._rhCancelInFlight = false),
      _0x572b02._updateSubmitButtonState.call(_0x9e6dbe),
      assert.equal(_0x9e6dbe.btnEl.classList.contains('is-task-cancel'), false),
      assert.doesNotMatch(_0x9e6dbe.btnEl.innerHTML, /v2-task-cancel-spin/));
  }),
  test('aigenImage submit button: finished async status is terminal and unlocks generation', () => {
    const _0x709995 = 'node-image-grsai-finished-button-state',
      _0x47ebac = {
        nodes: {
          [_0x709995]: {
            id: _0x709995,
            type: 'ai-image',
            model: 'nano-banana-2',
            provider: 'grsai',
            asyncTaskProvider: 'grsai',
            asyncTaskKind: 'image',
            asyncTaskId: 'task-finished',
            asyncTaskStatus: 'finished',
            jobStatus: 'running',
            isGenerating: true,
          },
        },
      },
      _0x4153c0 = createAIGenerateNodeUiModule({
        store: { getState: () => _0x47ebac, getIncomingEdges: () => [] },
      }),
      _0x410155 = Object.assign(Object.create(_0x4153c0), {
        nodeId: _0x709995,
        _data: _0x47ebac.nodes[_0x709995],
        promptEl: { innerText: 'prompt' },
        btnEl: createIdleButtonStub(),
        _isRunninghubWorkflowModel: () => false,
      });
    (_0x4153c0._updateSubmitButtonState.call(_0x410155),
      assert.equal(_0x410155.btnEl.disabled, false),
      assert.equal(_0x410155.btnEl.style.cursor, ''),
      assert.doesNotMatch(_0x410155.btnEl.innerHTML, /animation:spin/));
  }),
  test('aigenImage submit button: empty editor can generate from non-empty text input', () => {
    const _0x1fc360 = 'node-image-text-input-button',
      _0x5641ce = 'node-image-text-input-source',
      _0x19d72e = {
        nodes: {
          [_0x1fc360]: { id: _0x1fc360, type: 'ai-image', model: 'gpt-image-2', provider: 'grsai' },
          [_0x5641ce]: { id: _0x5641ce, type: 'source-text', text: '用文本入参生成一张海报' },
        },
      },
      _0x293889 = [{ id: 'edge-image-text-input', sourceId: _0x5641ce, targetId: _0x1fc360 }],
      _0xb99df5 = createAIGenerateNodeUiModule({
        store: { getState: () => _0x19d72e, getIncomingEdges: () => _0x293889 },
      }),
      _0x3fc97f = Object.assign(Object.create(_0xb99df5), {
        nodeId: _0x1fc360,
        _data: _0x19d72e.nodes[_0x1fc360],
        promptEl: { innerText: '', childNodes: [] },
        btnEl: createIdleButtonStub(),
        _isRunninghubWorkflowModel: () => false,
      });
    (_0xb99df5._updateSubmitButtonState.call(_0x3fc97f),
      assert.equal(_0x3fc97f.btnEl.disabled, false),
      assert.equal(_0x3fc97f.btnEl.style.cursor, ''));
  }),
  test('aigenImage submit button: Agnes image input can generate without prompt', () => {
    const _0x2d87d5 = 'node-agnes-image-input-button',
      _0x2290ce = 'node-agnes-image-input-source',
      _0xe8657f = {
        nodes: {
          [_0x2d87d5]: {
            id: _0x2d87d5,
            type: 'ai-image',
            model: 'agnes/agnes-image-2.0-flash',
            provider: 'agnes',
          },
          [_0x2290ce]: { id: _0x2290ce, type: 'source-image', imageUrl: 'https://cdn.example.com/input.png' },
        },
        edges: {
          'edge-agnes-image-input': {
            id: 'edge-agnes-image-input',
            sourceId: _0x2290ce,
            targetId: _0x2d87d5,
          },
        },
      },
      _0x4bfce4 = Object.values(_0xe8657f.edges),
      _0x5c9a8a = createAIGenerateNodeUiModule({
        store: { getState: () => _0xe8657f, getIncomingEdges: () => _0x4bfce4 },
      }),
      _0x4ba98e = Object.assign(Object.create(_0x5c9a8a), {
        nodeId: _0x2d87d5,
        _data: _0xe8657f.nodes[_0x2d87d5],
        promptEl: { innerText: '', childNodes: [] },
        btnEl: createIdleButtonStub(),
        _isRunninghubWorkflowModel: () => false,
      });
    (_0x5c9a8a._updateSubmitButtonState.call(_0x4ba98e),
      assert.equal(_0x4ba98e.btnEl.disabled, false),
      assert.equal(_0x4ba98e.btnEl.style.cursor, ''));
  }),
  test('aigenImage ui normalize: APIMart Seedream manifest models are preserved', () => {
    const _0x4e1c81 = 'node-apimart-seedream-preserve',
      _0x26f9c6 = {
        nodes: {
          [_0x4e1c81]: { id: _0x4e1c81, model: 'apimart/seedream-4.0', provider: 'apimart', imageSize: '4K' },
        },
      },
      _0x50be3c = [],
      _0x50a697 = createAIGenerateNodeUiModule({
        store: {
          getState: () => _0x26f9c6,
          updateNodeData: (_0x4ff014, _0x418030) => _0x50be3c.push({ id: _0x4ff014, patch: _0x418030 }),
        },
      }),
      _0x2b7606 = Object.assign(Object.create(_0x50a697), { nodeId: _0x4e1c81 }),
      _0x58a07d = _0x50a697._normalizeLegacySeedreamModel.call(_0x2b7606, _0x26f9c6.nodes[_0x4e1c81]);
    (assert.equal(_0x58a07d.model, 'apimart/seedream-4.0'),
      assert.equal(_0x58a07d.provider, 'apimart'),
      assert.equal(_0x58a07d.imageSize, '4K'),
      assert.deepEqual(_0x50be3c, []));
  }),
  test('aigenImage state sync: person replace V3 fixed image slots can swap', async () => {
    const _0x35a46b = globalThis.document;
    globalThis.document = { createElement: (_0x5354a3) => new FakeElement({ tagName: _0x5354a3 }) };
    const _0x28e85b = 'node-person-replace-v3';
    try {
      const _0x43ab1f = {
          selectedNodeIds: [],
          pickConnectMode: {},
          nodes: {
            [_0x28e85b]: {
              id: _0x28e85b,
              type: 'ai-image',
              model: 'runninghub/2041177685895946242',
              provider: 'runninghubwf',
            },
            imageA: {
              id: 'imageA',
              type: 'source-image',
              thumbLocalPath: 'output/a-thumb.png',
              displayLocalPath: 'output/a-display.png',
              originalLocalPath: 'output/a.png',
            },
            imageB: {
              id: 'imageB',
              type: 'source-image',
              thumbLocalPath: 'output/b-thumb.png',
              displayLocalPath: 'output/b-display.png',
              originalLocalPath: 'output/b.png',
            },
          },
          edges: {
            edgeA: { id: 'edgeA', sourceId: 'imageA', targetId: _0x28e85b, refSlot: 'replaceTarget' },
            edgeB: { id: 'edgeB', sourceId: 'imageB', targetId: _0x28e85b, refSlot: 'replacedImage' },
          },
        },
        _0x442289 = [],
        _0x8b05a = {
          getState: () => _0x43ab1f,
          getIncomingEdges: (_0x58af13) =>
            Object.values(_0x43ab1f.edges).filter((_0x28fc0d) => _0x28fc0d.targetId === _0x58af13),
          updateEdgesBatch(_0x376e61, _0x33c401) {
            _0x442289.push({ removeIds: _0x376e61, addedEdges: _0x33c401 });
          },
        },
        _0x587776 = createAIGenerateNodeStateSyncModule({
          store: _0x8b05a,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        }),
        _0x4625a0 = new FakeElement({ className: 'node-ref-bar' }),
        _0x3eb4e9 = Object.assign(Object.create(_0x587776), {
          nodeId: _0x28e85b,
          _data: _0x43ab1f.nodes[_0x28e85b],
          _refThumbObjectUrls: new Map(),
          refBarEl: _0x4625a0,
          promptEl: { innerText: '', querySelectorAll: () => [] },
        });
      await _0x587776._renderRefBarImpl.call(_0x3eb4e9);
      const _0xb86ac4 = _0x4625a0.querySelector('[data-ref-slot="replaceTarget"]'),
        _0x107e38 = _0x4625a0.querySelector('[data-ref-slot="replacedImage"]'),
        _0x125490 = _0x4625a0.querySelector('.ref-thumb-container');
      (assert.equal(_0xb86ac4.dataset.slot, 'replaceTarget'),
        assert.equal(_0x107e38.dataset.slot, 'replacedImage'),
        assert.equal(_0xb86ac4.dataset.kind, 'image'),
        assert.equal(_0x107e38.dataset.kind, 'image'),
        assert.equal(_0xb86ac4.getAttribute('draggable'), 'true'),
        assert.equal(_0x107e38.getAttribute('draggable'), 'true'),
        assert.equal(_0xb86ac4.classList.contains('ref-upload-slot'), false),
        assert.equal(_0x107e38.classList.contains('ref-upload-slot'), false),
        _0x125490.dispatch('dragstart', createDragEvent(_0xb86ac4)),
        assert.equal(_0xb86ac4.classList.contains('is-dragging'), true),
        _0x125490.dispatch('dragover', createDragEvent(_0x107e38)),
        assert.equal(_0x107e38.classList.contains('is-drop-allow'), true),
        assert.deepEqual(
          _0x125490.children.map((_0x4df815) => _0x4df815.dataset.edgeId || ''),
          ['edgeA', 'edgeB'],
        ),
        _0x125490.dispatch('drop', createDragEvent(_0x107e38)),
        assert.equal(_0x107e38.classList.contains('is-drop-allow'), false),
        _0x125490.dispatch('dragend', createDragEvent(_0xb86ac4)),
        assert.equal(_0xb86ac4.classList.contains('is-dragging'), false),
        assert.equal(_0x442289.length, 1),
        assert.deepEqual(_0x442289[0].removeIds, ['edgeA', 'edgeB']),
        assert.deepEqual(
          _0x442289[0].addedEdges.map((_0x5c534f) => [_0x5c534f.id, _0x5c534f.refSlot]),
          [
            ['edgeA', 'replacedImage'],
            ['edgeB', 'replaceTarget'],
          ],
        ));
      for (const _0xb0fa64 of _0x442289[0].removeIds) {
        delete _0x43ab1f.edges[_0xb0fa64];
      }
      for (const _0x3242ac of _0x442289[0].addedEdges) {
        _0x43ab1f.edges[_0x3242ac.id] = _0x3242ac;
      }
      await _0x587776._renderRefBarImpl.call(_0x3eb4e9);
      const _0x2477b2 = _0x4625a0.querySelector('[data-ref-slot="replaceTarget"]'),
        _0x1c964e = _0x4625a0.querySelector('[data-ref-slot="replacedImage"]');
      (assert.equal(_0x2477b2.dataset.edgeId, 'edgeB'),
        assert.equal(_0x2477b2.dataset.sourceId, 'imageB'),
        assert.equal(_0x1c964e.dataset.edgeId, 'edgeA'),
        assert.equal(_0x1c964e.dataset.sourceId, 'imageA'));
    } finally {
      if (typeof _0x35a46b === 'undefined') delete globalThis.document;
      else globalThis.document = _0x35a46b;
    }
  }),
  test('aigenImage state sync: modelApi fixed image slots render from manifest', async () => {
    const _0x434712 = globalThis.document;
    globalThis.document = { createElement: (_0x38c30d) => new FakeElement({ tagName: _0x38c30d }) };
    const _0x541f48 = 'node-youchuan-fixed-slots';
    try {
      const _0x10d4cd = {
          selectedNodeIds: [_0x541f48],
          pickConnectMode: {},
          nodes: {
            [_0x541f48]: {
              id: _0x541f48,
              type: 'ai-image',
              model: 'runninghub-model/youchuan-v6',
              provider: 'runninghub',
            },
            mainImage: {
              id: 'mainImage',
              type: 'source-image',
              thumbLocalPath: 'output/main-thumb.png',
              displayLocalPath: 'output/main-display.png',
              originalLocalPath: 'output/main.png',
            },
            styleImage: {
              id: 'styleImage',
              type: 'source-image',
              thumbLocalPath: 'output/style-thumb.png',
              displayLocalPath: 'output/style-display.png',
              originalLocalPath: 'output/style.png',
            },
          },
          edges: {
            edgeMain: { id: 'edgeMain', sourceId: 'mainImage', targetId: _0x541f48, refSlot: 'imageUrl' },
            edgeStyle: { id: 'edgeStyle', sourceId: 'styleImage', targetId: _0x541f48, refSlot: 'sref' },
          },
        },
        _0xc061d1 = {
          getState: () => _0x10d4cd,
          getStateRaw: () => _0x10d4cd,
          getIncomingEdges: (_0x2b8f2b) =>
            Object.values(_0x10d4cd.edges).filter((_0x1895f8) => _0x1895f8.targetId === _0x2b8f2b),
          updateEdgesBatch() {},
        },
        _0x499dfc = createAIGenerateNodeStateSyncModule({
          store: _0xc061d1,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        }),
        _0x2837ef = new FakeElement({ className: 'node-ref-bar' }),
        _0x7d5e6c = Object.assign(Object.create(_0x499dfc), {
          nodeId: _0x541f48,
          _data: _0x10d4cd.nodes[_0x541f48],
          _refThumbObjectUrls: new Map(),
          refBarEl: _0x2837ef,
          promptEl: { innerText: '', querySelectorAll: () => [] },
        });
      await _0x499dfc._renderRefBarImpl.call(_0x7d5e6c);
      const _0xd6504b = _0x2837ef.querySelector('[data-ref-slot="imageUrl"]'),
        _0xb32198 = _0x2837ef.querySelector('[data-ref-slot="cref"]'),
        _0x40e18c = _0x2837ef.querySelector('[data-ref-slot="sref"]');
      (assert.equal(_0xd6504b.dataset.edgeId, 'edgeMain'),
        assert.equal(_0xd6504b.dataset.kind, 'image'),
        assert.equal(_0xb32198.classList.contains('ref-upload-slot'), true),
        assert.equal(_0x40e18c.dataset.edgeId, 'edgeStyle'),
        assert.equal(_0x40e18c.dataset.sourceId, 'styleImage'));
    } finally {
      if (typeof _0x434712 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x434712;
    }
  }),
  test('aigenImage state sync: Midjourney V7 renders only main and style fixed slots', async () => {
    const _0xfabdf8 = globalThis.document;
    globalThis.document = { createElement: (_0x8ccf66) => new FakeElement({ tagName: _0x8ccf66 }) };
    const _0x2666e6 = 'node-youchuan-v7-fixed-slots';
    try {
      const _0x1d5575 = {
          selectedNodeIds: [_0x2666e6],
          pickConnectMode: {},
          nodes: {
            [_0x2666e6]: {
              id: _0x2666e6,
              type: 'ai-image',
              model: 'runninghub-model/youchuan-v7',
              provider: 'runninghub',
            },
            mainImage: {
              id: 'mainImage',
              type: 'source-image',
              thumbLocalPath: 'output/main-thumb.png',
              displayLocalPath: 'output/main-display.png',
              originalLocalPath: 'output/main.png',
            },
            styleImage: {
              id: 'styleImage',
              type: 'source-image',
              thumbLocalPath: 'output/style-thumb.png',
              displayLocalPath: 'output/style-display.png',
              originalLocalPath: 'output/style.png',
            },
          },
          edges: {
            edgeMain: { id: 'edgeMain', sourceId: 'mainImage', targetId: _0x2666e6, refSlot: 'imageUrl' },
            edgeStyle: { id: 'edgeStyle', sourceId: 'styleImage', targetId: _0x2666e6, refSlot: 'sref' },
          },
        },
        _0xe38013 = {
          getState: () => _0x1d5575,
          getStateRaw: () => _0x1d5575,
          getIncomingEdges: (_0x36d3c9) =>
            Object.values(_0x1d5575.edges).filter((_0x3c93e2) => _0x3c93e2.targetId === _0x36d3c9),
          updateEdgesBatch() {},
        },
        _0x4efddc = createAIGenerateNodeStateSyncModule({
          store: _0xe38013,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        }),
        _0x1cc0b6 = new FakeElement({ className: 'node-ref-bar' }),
        _0x2a21f9 = Object.assign(Object.create(_0x4efddc), {
          nodeId: _0x2666e6,
          _data: _0x1d5575.nodes[_0x2666e6],
          _refThumbObjectUrls: new Map(),
          refBarEl: _0x1cc0b6,
          promptEl: { innerText: '', querySelectorAll: () => [] },
        });
      await _0x4efddc._renderRefBarImpl.call(_0x2a21f9);
      const _0x36dcb = _0x1cc0b6.querySelector('[data-ref-slot="imageUrl"]'),
        _0x1ff559 = _0x1cc0b6.querySelector('[data-ref-slot="cref"]'),
        _0x11cdce = _0x1cc0b6.querySelector('[data-ref-slot="sref"]');
      (assert.equal(_0x36dcb.dataset.edgeId, 'edgeMain'),
        assert.equal(_0x36dcb.dataset.kind, 'image'),
        assert.equal(_0x1ff559, null),
        assert.equal(_0x11cdce.dataset.edgeId, 'edgeStyle'),
        assert.equal(_0x11cdce.dataset.sourceId, 'styleImage'));
    } finally {
      if (typeof _0xfabdf8 === 'undefined') delete globalThis.document;
      else globalThis.document = _0xfabdf8;
    }
  }),
  test('aigenImage state sync: RunningHub image X renders one manifest fixed image slot', async () => {
    const _0x457f63 = globalThis.document;
    globalThis.document = { createElement: (_0x10438a) => new FakeElement({ tagName: _0x10438a }) };
    const _0x3170ec = 'node-rh-image-x-fixed-slot';
    try {
      const _0x372c4a = {
          selectedNodeIds: [_0x3170ec],
          pickConnectMode: {},
          nodes: {
            [_0x3170ec]: {
              id: _0x3170ec,
              type: 'ai-image',
              model: 'runninghub-model/rhart-image-g',
              provider: 'runninghub',
            },
            refImage: {
              id: 'refImage',
              type: 'source-image',
              thumbLocalPath: 'output/ref-thumb.png',
              displayLocalPath: 'output/ref-display.png',
              originalLocalPath: 'output/ref.png',
            },
          },
          edges: {
            edgeRef: { id: 'edgeRef', sourceId: 'refImage', targetId: _0x3170ec, refSlot: 'imageUrl' },
          },
        },
        _0x291b45 = {
          getState: () => _0x372c4a,
          getStateRaw: () => _0x372c4a,
          getIncomingEdges: (_0x1ed13c) =>
            Object.values(_0x372c4a.edges).filter((_0x33efd1) => _0x33efd1.targetId === _0x1ed13c),
          updateEdgesBatch() {},
        },
        _0x44567c = createAIGenerateNodeStateSyncModule({
          store: _0x291b45,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        }),
        _0x40b651 = new FakeElement({ className: 'node-ref-bar' }),
        _0x3bc42f = Object.assign(Object.create(_0x44567c), {
          nodeId: _0x3170ec,
          _data: _0x372c4a.nodes[_0x3170ec],
          _refThumbObjectUrls: new Map(),
          refBarEl: _0x40b651,
          promptEl: { innerText: '', querySelectorAll: () => [] },
        });
      await _0x44567c._renderRefBarImpl.call(_0x3bc42f);
      const _0x139a9b = _0x40b651.querySelector('[data-ref-slot="imageUrl"]'),
        _0x1fc669 = _0x40b651.querySelector('[data-ref-slot="sref"]');
      (assert.equal(_0x139a9b.dataset.edgeId, 'edgeRef'),
        assert.equal(_0x139a9b.dataset.kind, 'image'),
        assert.equal(_0x1fc669, null));
    } finally {
      if (typeof _0x457f63 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x457f63;
    }
  }),
  test('aigenImage state sync: refSlot changes trigger immediate ref bar refresh', () => {
    const _0x5d25b3 = globalThis.document,
      _0x391207 = 'node-person-replace-v3-refresh',
      _0x571ee4 = {
        selectedNodeIds: [_0x391207],
        pickConnectMode: {},
        nodes: {
          [_0x391207]: {
            id: _0x391207,
            type: 'ai-image',
            model: 'runninghub/2041177685895946242',
            provider: 'runninghubwf',
          },
          imageA: { id: 'imageA', type: 'source-image', _bizRev: 1 },
          imageB: { id: 'imageB', type: 'source-image', _bizRev: 1 },
        },
        edges: {
          edgeA: { id: 'edgeA', sourceId: 'imageA', targetId: _0x391207, refSlot: 'replaceTarget' },
          edgeB: { id: 'edgeB', sourceId: 'imageB', targetId: _0x391207, refSlot: 'replacedImage' },
        },
      };
    try {
      globalThis.document = { activeElement: null };
      const _0x379a21 = {
          getState: () => _0x571ee4,
          getStateRaw: () => _0x571ee4,
          getIncomingEdges: (_0x558abe) =>
            Object.values(_0x571ee4.edges).filter((_0x42135c) => _0x42135c.targetId === _0x558abe),
        },
        _0x20dc03 = createAIGenerateNodeStateSyncModule({
          store: _0x379a21,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        });
      let _0x3f6928 = 0;
      const _0x11c3eb = Object.assign(Object.create(_0x20dc03), {
        nodeId: _0x391207,
        _data: _0x571ee4.nodes[_0x391207],
        promptEl: { innerHTML: '', querySelectorAll: () => [] },
        _normalizeDreaminaNodeData: (_0x4dbd41) => _0x4dbd41,
        _loadAndDisplayImage: () => {},
        _applyMaskPreview: () => {},
        _applyModelParamVisibility: () => {},
        _updateSubmitButtonState: () => {},
        _renderRefBar: () => {
          _0x3f6928 += 1;
        },
      });
      (_0x20dc03.update.call(_0x11c3eb, _0x571ee4.nodes[_0x391207]),
        assert.equal(_0x3f6928, 1),
        (_0x571ee4.edges.edgeA = { ..._0x571ee4.edges.edgeA, refSlot: 'replacedImage' }),
        (_0x571ee4.edges.edgeB = { ..._0x571ee4.edges.edgeB, refSlot: 'replaceTarget' }),
        _0x20dc03.update.call(_0x11c3eb, _0x571ee4.nodes[_0x391207]),
        assert.equal(_0x3f6928, 2));
    } finally {
      if (typeof _0x5d25b3 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x5d25b3;
    }
  }),
  test('aigenImage state sync: thumbnail order changes trigger immediate ref bar refresh', () => {
    const _0x4d61f4 = globalThis.document,
      _0x3628fd = 'node-image-order-refresh',
      _0x583a8d = {
        selectedNodeIds: [_0x3628fd],
        pickConnectMode: {},
        nodes: {
          [_0x3628fd]: {
            id: _0x3628fd,
            type: 'ai-image',
            model: 'apimart/nano-banana-2',
            provider: 'apimart',
          },
          imageA: { id: 'imageA', type: 'source-image', _bizRev: 1 },
          imageB: { id: 'imageB', type: 'source-image', _bizRev: 1 },
        },
        edges: {
          edgeA: { id: 'edgeA', sourceId: 'imageA', targetId: _0x3628fd },
          edgeB: { id: 'edgeB', sourceId: 'imageB', targetId: _0x3628fd },
        },
      };
    try {
      globalThis.document = { activeElement: null };
      const _0xae1aa2 = {
          getState: () => _0x583a8d,
          getStateRaw: () => _0x583a8d,
          getIncomingEdges: (_0x127c52) =>
            Object.values(_0x583a8d.edges).filter((_0x10db6f) => _0x10db6f.targetId === _0x127c52),
        },
        _0x579f74 = createAIGenerateNodeStateSyncModule({
          store: _0xae1aa2,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        });
      let _0x3ad9ff = 0;
      const _0x38c430 = Object.assign(Object.create(_0x579f74), {
        nodeId: _0x3628fd,
        _data: _0x583a8d.nodes[_0x3628fd],
        promptEl: { innerHTML: '', querySelectorAll: () => [] },
        _normalizeDreaminaNodeData: (_0x3e248d) => _0x3e248d,
        _loadAndDisplayImage: () => {},
        _applyMaskPreview: () => {},
        _applyModelParamVisibility: () => {},
        _updateSubmitButtonState: () => {},
        _renderRefBar: () => {
          _0x3ad9ff += 1;
        },
      });
      (_0x579f74.update.call(_0x38c430, _0x583a8d.nodes[_0x3628fd]),
        assert.equal(_0x3ad9ff, 1),
        (_0x583a8d.edges = { edgeB: _0x583a8d.edges.edgeB, edgeA: _0x583a8d.edges.edgeA }),
        _0x579f74.update.call(_0x38c430, _0x583a8d.nodes[_0x3628fd]),
        assert.equal(_0x3ad9ff, 2));
    } finally {
      if (typeof _0x4d61f4 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x4d61f4;
    }
  }),
  test('aigenImage state sync: person replace V2.1 model keeps empty upload slot', async () => {
    const _0x590a0b = globalThis.document;
    globalThis.document = { createElement: (_0xead6d5) => new FakeElement({ tagName: _0xead6d5 }) };
    const _0x4c2b5f = 'node-person-replace-v21';
    try {
      const _0x544d62 = {
          selectedNodeIds: [],
          pickConnectMode: {},
          nodes: {
            [_0x4c2b5f]: {
              id: _0x4c2b5f,
              type: 'ai-image',
              model: 'runninghub/2050313968069165058',
              provider: 'runninghubwf',
            },
            imageA: {
              id: 'imageA',
              type: 'source-image',
              thumbLocalPath: 'output/a-thumb.png',
              displayLocalPath: 'output/a-display.png',
              originalLocalPath: 'output/a.png',
            },
          },
          edges: {
            edgeA: { id: 'edgeA', sourceId: 'imageA', targetId: _0x4c2b5f, refSlot: 'replaceTarget' },
          },
        },
        _0x109f91 = {
          getState: () => _0x544d62,
          getIncomingEdges: (_0x4d9fa5) =>
            Object.values(_0x544d62.edges).filter((_0x104a1f) => _0x104a1f.targetId === _0x4d9fa5),
          updateEdgesBatch() {},
        },
        _0x8ea6c7 = createAIGenerateNodeStateSyncModule({
          store: _0x109f91,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        }),
        _0x5767e7 = new FakeElement({ className: 'node-ref-bar' }),
        _0x422329 = Object.assign(Object.create(_0x8ea6c7), {
          nodeId: _0x4c2b5f,
          _data: _0x544d62.nodes[_0x4c2b5f],
          _refThumbObjectUrls: new Map(),
          refBarEl: _0x5767e7,
          promptEl: { innerText: '', querySelectorAll: () => [] },
        });
      await _0x8ea6c7._renderRefBarImpl.call(_0x422329);
      const _0x11b0c0 = _0x5767e7.querySelector('[data-ref-slot="replaceTarget"]'),
        _0x4c88ee = _0x5767e7.querySelector('[data-ref-slot="replacedImage"]');
      (assert.equal(_0x11b0c0.classList.contains('ref-upload-slot'), false),
        assert.equal(_0x11b0c0.getAttribute('draggable'), 'true'),
        assert.equal(_0x4c88ee.classList.contains('ref-upload-slot'), true),
        assert.equal(_0x4c88ee.dataset.refSlot, 'replacedImage'),
        assert.equal(_0x4c88ee.dataset.slot, 'replacedImage'),
        assert.equal(_0x4c88ee.dataset.kind, 'image'),
        assert.equal(_0x4c88ee.getAttribute('draggable'), 'false'));
    } finally {
      if (typeof _0x590a0b === 'undefined') delete globalThis.document;
      else globalThis.document = _0x590a0b;
    }
  }),
  test('aigenImage state sync: anime real image input changes trigger adaptive ratio', async () => {
    const _0xb3bf0c = globalThis.document,
      _0x3577bb = 'anime-real-node',
      _0xdadbc1 = {
        pickConnectMode: {},
        nodes: {
          [_0x3577bb]: {
            id: _0x3577bb,
            type: 'ai-image',
            model: 'runninghub/1994718111704158209',
            provider: 'runninghubwf',
            aspectRatio: '自适应',
          },
          imageA: { id: 'imageA', type: 'source-image', width: 0x384, height: 0x640, _bizRev: 1 },
          imageB: { id: 'imageB', type: 'source-image', width: 0x640, height: 0x384, _bizRev: 1 },
        },
        edges: { edgeA: { id: 'edgeA', sourceId: 'imageA', targetId: _0x3577bb } },
      };
    try {
      globalThis.document = {
        activeElement: null,
        createElement: (_0x37ddfa) => new FakeElement({ tagName: _0x37ddfa }),
      };
      const _0x176c53 = {
          getState: () => _0xdadbc1,
          getIncomingEdges: (_0x520aea) =>
            Object.values(_0xdadbc1.edges).filter((_0x15d31e) => _0x15d31e.targetId === _0x520aea),
        },
        _0x323957 = createAIGenerateNodeStateSyncModule({
          store: _0x176c53,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        });
      let _0x2b0796 = 0;
      const _0x3dec7c = Object.assign(Object.create(_0x323957), {
        nodeId: _0x3577bb,
        _data: _0xdadbc1.nodes[_0x3577bb],
        refBarEl: new FakeElement(),
        _refThumbObjectUrls: new Map(),
        runAdaptiveRatio: () => {
          _0x2b0796 += 1;
        },
        promptEl: { innerText: '', querySelectorAll: () => [] },
      });
      (await _0x323957._renderRefBarImpl.call(_0x3dec7c),
        await new Promise((_0x3cb921) => setTimeout(_0x3cb921, 70)),
        assert.equal(_0x2b0796, 1),
        (_0xdadbc1.edges.edgeA = { ..._0xdadbc1.edges.edgeA, sourceId: 'imageB' }),
        await _0x323957._renderRefBarImpl.call(_0x3dec7c),
        await new Promise((_0x54c533) => setTimeout(_0x54c533, 70)),
        assert.equal(_0x2b0796, 2));
    } finally {
      if (typeof _0xb3bf0c === 'undefined') delete globalThis.document;
      else globalThis.document = _0xb3bf0c;
    }
  }),
  test('aigenImage state sync: group output order changes trigger adaptive ratio', async () => {
    const _0x1f8fc7 = globalThis.document,
      _0x332819 = 'schema-image-node',
      _0x584ca0 = {
        pickConnectMode: {},
        nodes: {
          [_0x332819]: {
            id: _0x332819,
            type: 'ai-image',
            model: 'apimart/nano-banana-2',
            provider: 'apimart',
            generationParams: { aspectRatio: '自适应' },
          },
          group: { id: 'group', type: 'group' },
          imageA: {
            id: 'imageA',
            type: 'source-image',
            parentId: 'group',
            width: 0x384,
            height: 0x640,
            _bizRev: 1,
          },
          imageB: {
            id: 'imageB',
            type: 'source-image',
            parentId: 'group',
            width: 0x640,
            height: 0x384,
            _bizRev: 1,
          },
        },
        edges: {
          groupEdge: {
            id: 'groupEdge',
            sourceId: 'group',
            targetId: _0x332819,
            groupOutputSourceOrder: ['imageA', 'imageB'],
          },
        },
      },
      _0x9e15ff = () =>
        _0x584ca0.edges.groupEdge.groupOutputSourceOrder.map((_0x44d013) => ({
          ..._0x584ca0.edges.groupEdge,
          id: 'groupEdge::group-output::' + _0x44d013,
          sourceId: _0x44d013,
          isGroupOutput: true,
          outputGroupId: 'group',
          groupOutputEdgeId: 'groupEdge',
          effectiveTargetId: _0x332819,
        }));
    try {
      globalThis.document = {
        activeElement: null,
        createElement: (_0x5a6d3d) => new FakeElement({ tagName: _0x5a6d3d }),
      };
      const _0x5b4053 = {
          getState: () => _0x584ca0,
          getIncomingEdges: (_0x2ca069) => (_0x2ca069 === _0x332819 ? _0x9e15ff() : []),
        },
        _0x1ba444 = createAIGenerateNodeStateSyncModule({
          store: _0x5b4053,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        });
      let _0x100959 = 0;
      const _0x2c0b46 = Object.assign(Object.create(_0x1ba444), {
        nodeId: _0x332819,
        _data: _0x584ca0.nodes[_0x332819],
        refBarEl: new FakeElement(),
        _refThumbObjectUrls: new Map(),
        runAdaptiveRatio: () => {
          _0x100959 += 1;
        },
        promptEl: { innerText: '', querySelectorAll: () => [] },
      });
      (await _0x1ba444._renderRefBarImpl.call(_0x2c0b46),
        await new Promise((_0x421f4c) => setTimeout(_0x421f4c, 70)),
        assert.equal(_0x100959, 1),
        (_0x584ca0.edges.groupEdge = {
          ..._0x584ca0.edges.groupEdge,
          groupOutputSourceOrder: ['imageB', 'imageA'],
        }),
        await _0x1ba444._renderRefBarImpl.call(_0x2c0b46),
        await new Promise((_0x46d55c) => setTimeout(_0x46d55c, 70)),
        assert.equal(_0x100959, 2));
    } finally {
      if (typeof _0x1f8fc7 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x1f8fc7;
    }
  }),
  test('aigenImage state sync: group first output removal triggers adaptive ratio while ref bar hidden', async () => {
    const _0x748806 = globalThis.document,
      _0x4d6adb = 'schema-image-node',
      _0x3563dc = {
        pickConnectMode: {},
        selectedNodeIds: [],
        nodes: {
          [_0x4d6adb]: {
            id: _0x4d6adb,
            type: 'ai-image',
            model: 'apimart/nano-banana-2',
            provider: 'apimart',
            generationParams: { aspectRatio: '自适应' },
          },
          group: { id: 'group', type: 'group' },
          imageA: {
            id: 'imageA',
            type: 'source-image',
            parentId: 'group',
            width: 0x384,
            height: 0x640,
            _bizRev: 1,
          },
          imageB: {
            id: 'imageB',
            type: 'source-image',
            parentId: 'group',
            width: 0x640,
            height: 0x384,
            _bizRev: 1,
          },
        },
        edges: {
          groupEdge: {
            id: 'groupEdge',
            sourceId: 'group',
            targetId: _0x4d6adb,
            groupOutputSourceOrder: ['imageA', 'imageB'],
          },
        },
      },
      _0x33d009 = () =>
        _0x3563dc.edges.groupEdge.groupOutputSourceOrder
          .filter((_0x412029) => _0x3563dc.nodes[_0x412029]?.parentId === 'group')
          .map((_0x421dd6) => ({
            ..._0x3563dc.edges.groupEdge,
            id: 'groupEdge::group-output::' + _0x421dd6,
            sourceId: _0x421dd6,
            isGroupOutput: true,
            outputGroupId: 'group',
            groupOutputEdgeId: 'groupEdge',
            effectiveTargetId: _0x4d6adb,
          }));
    try {
      globalThis.document = {
        activeElement: null,
        createElement: (_0x22b251) => new FakeElement({ tagName: _0x22b251 }),
      };
      const _0x421c20 = {
          getState: () => _0x3563dc,
          getIncomingEdges: (_0x47c5ff) => (_0x47c5ff === _0x4d6adb ? _0x33d009() : []),
        },
        _0x60a7bb = createAIGenerateNodeStateSyncModule({
          store: _0x421c20,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
          getDisplayModelName: (_0x57af56) => _0x57af56,
        });
      let _0x33947d = 0,
        _0x1c61a4 = 0;
      const _0x4c117e = Object.assign(Object.create(_0x60a7bb), {
        nodeId: _0x4d6adb,
        _data: _0x3563dc.nodes[_0x4d6adb],
        _root: new FakeElement(),
        _refThumbObjectUrls: new Map(),
        _normalizeDreaminaNodeData: (_0x4a3204) => _0x4a3204,
        _loadAndDisplayImage: () => {},
        _applyMaskPreview: () => {},
        _applyModelParamVisibility: () => {},
        _updateSubmitButtonState: () => {},
        _renderRefBar: () => {
          _0x1c61a4 += 1;
        },
        runAdaptiveRatio: () => {
          _0x33947d += 1;
        },
        promptEl: { innerHTML: '', innerText: '', querySelectorAll: () => [] },
      });
      (_0x60a7bb.update.call(_0x4c117e, _0x3563dc.nodes[_0x4d6adb]),
        await new Promise((_0x393ec3) => setTimeout(_0x393ec3, 70)),
        assert.equal(_0x33947d, 1),
        assert.equal(_0x1c61a4, 0),
        (_0x3563dc.nodes.imageA = { ..._0x3563dc.nodes.imageA, parentId: '' }),
        _0x60a7bb.update.call(_0x4c117e, _0x3563dc.nodes[_0x4d6adb]),
        await new Promise((_0x5a187b) => setTimeout(_0x5a187b, 70)),
        assert.equal(_0x33947d, 2),
        assert.equal(_0x1c61a4, 0));
    } finally {
      if (typeof _0x748806 === 'undefined') delete globalThis.document;
      else globalThis.document = _0x748806;
    }
  }),
  test('aigenImage state sync: schema adaptive ratio triggers display resize on input change', async () => {
    const _0x5d0f3e = globalThis.document,
      _0x1d8c8c = 'schema-image-node',
      _0x467780 = {
        pickConnectMode: {},
        nodes: {
          [_0x1d8c8c]: {
            id: _0x1d8c8c,
            type: 'ai-image',
            model: 'apimart/nano-banana-2',
            provider: 'apimart',
            generationParams: { aspectRatio: '自适应' },
          },
          imageA: { id: 'imageA', type: 'source-image', width: 0x384, height: 0x640, _bizRev: 1 },
          imageB: { id: 'imageB', type: 'source-image', width: 0x640, height: 0x384, _bizRev: 1 },
        },
        edges: { edgeA: { id: 'edgeA', sourceId: 'imageA', targetId: _0x1d8c8c } },
      };
    try {
      globalThis.document = {
        activeElement: null,
        createElement: (_0x1fb288) => new FakeElement({ tagName: _0x1fb288 }),
      };
      const _0x2128f4 = {
          getState: () => _0x467780,
          getIncomingEdges: (_0x48526f) =>
            Object.values(_0x467780.edges).filter((_0x46697d) => _0x46697d.targetId === _0x48526f),
        },
        _0x419840 = createAIGenerateNodeStateSyncModule({
          store: _0x2128f4,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        });
      let _0x350a3c = 0;
      const _0x20abc2 = Object.assign(Object.create(_0x419840), {
        nodeId: _0x1d8c8c,
        _data: _0x467780.nodes[_0x1d8c8c],
        refBarEl: new FakeElement(),
        _refThumbObjectUrls: new Map(),
        runAdaptiveRatio: () => {
          _0x350a3c += 1;
        },
        promptEl: { innerText: '', querySelectorAll: () => [] },
      });
      (await _0x419840._renderRefBarImpl.call(_0x20abc2),
        await new Promise((_0x4ae5c8) => setTimeout(_0x4ae5c8, 70)),
        assert.equal(_0x350a3c, 1),
        (_0x467780.nodes[_0x1d8c8c].generationParams.aspectRatio = '16:9'),
        (_0x467780.edges.edgeA = { ..._0x467780.edges.edgeA, sourceId: 'imageB' }),
        await _0x419840._renderRefBarImpl.call(_0x20abc2),
        await new Promise((_0x4ad844) => setTimeout(_0x4ad844, 70)),
        assert.equal(_0x350a3c, 1));
    } finally {
      if (typeof _0x5d0f3e === 'undefined') delete globalThis.document;
      else globalThis.document = _0x5d0f3e;
    }
  }));
