import test from 'node:test';
import assert from 'node:assert/strict';
import { createAIGenerateNodeStateSyncModule, resolveRefImageRenderSources } from './stateSyncModule.js';
import { createAIGenerateNodeUiModule } from './uiModule.js';
function createButtonStub() {
  const map = new Set(['is-rh-busy']);
  return {
    disabled: true,
    title: 'busy',
    innerHTML: '<svg style="animation:spin 1s linear infinite"></svg>',
    style: { color: 'var(--white)', cursor: '' },
    classList: {
      add(value) {
        map.add(String(value || ''));
      },
      remove(item) {
        map.delete(String(item || ''));
      },
      contains(key) {
        return map.has(String(key || ''));
      },
    },
  };
}
function createIdleButtonStub() {
  const map2 = new Set();
  return {
    disabled: false,
    title: '',
    innerHTML: '',
    style: { color: '', cursor: '' },
    dataset: {},
    classList: {
      add(...list) {
        list.forEach((item2) => map2.add(String(item2 || '')));
      },
      remove(...list2) {
        list2.forEach((item3) => map2.delete(String(item3 || '')));
      },
      toggle(index, result) {
        const data = String(index || '');
        if (result === true) return (map2.add(data), true);
        if (result === false) return (map2.delete(data), false);
        if (map2.has(data)) return (map2.delete(data), false);
        return (map2.add(data), true);
      },
      contains(options) {
        return map2.has(String(options || ''));
      },
    },
    setAttribute(target, source) {
      this.dataset[String(target || '')] = String(source || '');
    },
    removeAttribute(next) {
      delete this.dataset[String(next || '')];
    },
  };
}
class FakeClassList {
  constructor(current) {
    this.owner = current;
  }
  ['_tokens']() {
    return String(this.owner.className || '')
      .split(/\s+/)
      .filter(Boolean);
  }
  ['contains'](entry) {
    return this._tokens().includes(String(entry || ''));
  }
  ['add'](...list3) {
    const record = new Set(this._tokens());
    (list3.forEach((item4) => record.add(String(item4 || ''))),
      (this.owner.className = Array.from(record).join(' ')));
  }
  ['remove'](...list4) {
    const map3 = new Set(list4.map((item5) => String(item5 || '')));
    this.owner.className = this._tokens()
      .filter((item6) => !map3.has(item6))
      .join(' ');
  }
  ['toggle'](payload, handle) {
    const state = String(payload || ''),
      enabled = this.contains(state),
      config = handle === undefined ? !enabled : Boolean(handle);
    if (config) this.add(state);
    else this.remove(state);
    return config;
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
  set ['innerHTML'](scope) {
    this._innerHTML = String(scope || '');
    if (!this._innerHTML.includes('ref-thumb-container')) return;
    this.children = [];
    const fakeElement = new FakeElement({ className: 'prompt-attachment-btn' }),
      el = new FakeElement({ className: 'ref-thumb-container' });
    (this.appendChild(fakeElement),
      this.appendChild(el),
      this._innerHTML.includes('data-ref-slot="replaceTarget"') &&
        el.appendChild(
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
        el.appendChild(
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
    const list5 = this.parentNode.children,
      count = list5.indexOf(this);
    return count >= 0 ? list5[count + 1] || null : null;
  }
  ['appendChild'](el2) {
    if (el2.parentNode) el2.remove();
    return (this.children.push(el2), (el2.parentNode = this), (el2.parentElement = this), el2);
  }
  ['insertBefore'](el3, input) {
    if (el3.parentNode) el3.remove();
    const count2 = input ? this.children.indexOf(input) : -1;
    if (count2 >= 0) this.children.splice(count2, 0, el3);
    else this.children.push(el3);
    return ((el3.parentNode = this), (el3.parentElement = this), el3);
  }
  ['remove']() {
    if (!this.parentNode) return;
    const list6 = this.parentNode.children,
      count3 = list6.indexOf(this);
    if (count3 >= 0) list6.splice(count3, 1);
    ((this.parentNode = null), (this.parentElement = null));
  }
  ['replaceWith'](el4) {
    if (!this.parentNode) return;
    const el5 = this.parentNode,
      list7 = el5.children,
      count4 = list7.indexOf(this);
    if (count4 < 0) return;
    if (el4.parentNode) el4.remove();
    ((list7[count4] = el4),
      (el4.parentNode = el5),
      (el4.parentElement = el5),
      (this.parentNode = null),
      (this.parentElement = null));
  }
  ['setAttribute'](output, value2) {
    this.attributes[String(output)] = String(value2);
  }
  ['getAttribute'](value3) {
    return this.attributes[String(value3)];
  }
  ['addEventListener'](value4, value5) {
    if (!this.listeners.has(value4)) this.listeners.set(value4, []);
    this.listeners.get(value4).push(value5);
  }
  ['dispatch'](value6, value7) {
    for (const run of this.listeners.get(value6) || []) run(value7);
  }
  ['matches'](value8) {
    if (value8 === '.ref-thumb-wrap') return this.classList.contains('ref-thumb-wrap');
    if (value8 === '.ref-thumb-container') return this.classList.contains('ref-thumb-container');
    if (value8 === '[data-slot]') return !!this.dataset.slot;
    return matchesFakeSelector(this, value8);
  }
  ['closest'](value9) {
    let value10 = this;
    while (value10) {
      if (value10.matches(value9)) return value10;
      value10 = value10.parentElement;
    }
    return null;
  }
  ['querySelector'](value11) {
    return this.querySelectorAll(value11)[0] || null;
  }
  ['querySelectorAll'](value12) {
    const list8 = [],
      item7 = (el6) => {
        if (matchesFakeSelector(el6, value12)) list8.push(el6);
        el6.children.forEach(item7);
      };
    return (this.children.forEach(item7), list8);
  }
}
function matchesFakeSelector(el7, value13) {
  if (value13 === '.prompt-attachment-btn') return el7.classList.contains('prompt-attachment-btn');
  if (value13 === '.ref-thumb-container') return el7.classList.contains('ref-thumb-container');
  if (value13 === '.ref-thumb-wrap') return el7.classList.contains('ref-thumb-wrap');
  if (value13 === '.ref-thumb-wrap.is-drop-allow')
    return el7.classList.contains('ref-thumb-wrap') && el7.classList.contains('is-drop-allow');
  const value14 = value13.match(/^\.ref-upload-slot\[data-ref-slot="([^"]+)"\]$/);
  if (value14) return el7.classList.contains('ref-upload-slot') && el7.dataset.refSlot === value14[1];
  const value15 = value13.match(/^\[data-ref-slot="([^"]+)"\]$/);
  if (value15) return el7.dataset.refSlot === value15[1];
  const value16 = value13.match(/^\[data-slot="([^"]+)"\]$/);
  if (value16) return el7.dataset.slot === value16[1];
  if (value13 === '[data-slot]') return !!el7.dataset.slot;
  return false;
}
function createDragEvent(target2) {
  return {
    target: target2,
    dataTransfer: { effectAllowed: '', dropEffect: '', setData() {} },
    preventDefault() {},
    stopPropagation() {},
  };
}
(test('aigenImage state sync: 列表缩略图优先 thumbLocalPath，hover 预览优先 displayLocalPath', () => {
  const refImageRenderSources = resolveRefImageRenderSources({
    id: 'src-image-1',
    type: 'source-image',
    originalLocalPath: 'output/original.png',
    displayLocalPath: 'output/display.jpg',
    thumbLocalPath: 'output/thumb.jpg',
  });
  assert.deepEqual(refImageRenderSources, {
    thumbSrc: '/output/thumb.jpg',
    previewSrc: '/output/display.jpg',
  });
}),
  test('aigenImage state sync: hover 预览缺少 displayLocalPath 时回退 originalLocalPath', () => {
    const refImageRenderSources2 = resolveRefImageRenderSources({
      id: 'src-image-2',
      type: 'source-image',
      originalLocalPath: 'output/original.png',
      thumbLocalPath: 'output/thumb.jpg',
    });
    assert.deepEqual(refImageRenderSources2, {
      thumbSrc: '/output/thumb.jpg',
      previewSrc: '/output/original.png',
    });
  }),
  test('aigenImage state sync: ai-image 顶层缺失时回退 main image 的本地派生图', () => {
    const refImageRenderSources3 = resolveRefImageRenderSources({
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
    assert.deepEqual(refImageRenderSources3, {
      thumbSrc: '/output/final-thumb.jpg',
      previewSrc: '/output/final-display.jpg',
    });
  }),
  test('aigenImage state sync: 顶层本地字段仍优先于 main image', () => {
    const refImageRenderSources4 = resolveRefImageRenderSources({
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
    assert.deepEqual(refImageRenderSources4, {
      thumbSrc: '/output/top-level-thumb.jpg',
      previewSrc: '/output/top-level-display.jpg',
    });
  }),
  test('aigenImage state sync: 旧节点只有 blob 缩略图时 hover 预览回退到同一张图', () => {
    const refImageRenderSources5 = resolveRefImageRenderSources(
      { id: 'src-image-legacy-blob', type: 'source-image' },
      { thumbBlobUrl: 'blob:legacy-thumb' },
    );
    assert.deepEqual(refImageRenderSources5, {
      thumbSrc: 'blob:legacy-thumb',
      previewSrc: 'blob:legacy-thumb',
    });
  }),
  test('aigenImage state sync: terminal Dreamina state clears loading UI', () => {
    const value17 = globalThis.document;
    globalThis.document = { activeElement: null };
    try {
      const id = 'node-state-sync-dreamina-terminal',
        _data = {
          selectedNodeIds: [],
          pickConnectMode: {},
          nodes: { [id]: { id: id, model: 'dreamina/4.1', provider: 'dreamina' } },
          edges: {},
        };
      let value18 = 0,
        value19 = 0,
        value20 = 0,
        value21 = 0;
      const aIGenerateNodeStateSyncModule = createAIGenerateNodeStateSyncModule({
          store: { getState: () => _data, getIncomingEdges: () => [] },
          getImage: async () => null,
          getDisplayModelName: (value22) => value22,
          stopLoading: () => {
            value18 += 1;
          },
        }),
        value23 = Object.assign(Object.create(aIGenerateNodeStateSyncModule), {
          nodeId: id,
          _data: _data.nodes[id],
          _isGenerating: true,
          _dreaminaActiveSubmitId: 'sid-terminal',
          _refThumbObjectUrls: new Map(),
          previewEl: {},
          btnEl: createButtonStub(),
          promptEl: { innerHTML: '', innerText: 'prompt' },
          _normalizeDreaminaNodeData: (value24) => value24,
          _loadAndDisplayImage: () => {},
          _applyMaskPreview: () => {},
          _applyModelParamVisibility: () => {},
          _stopDreaminaRecovery: () => {
            value19 += 1;
          },
          _maybeResumeDreaminaTaskImpl: () => {
            value20 += 1;
          },
          _updateSubmitButtonState: () => {
            value21 += 1;
          },
        });
      (aIGenerateNodeStateSyncModule.update.call(value23, {
        id: id,
        model: 'dreamina/4.1',
        provider: 'dreamina',
        jobStatus: 'error',
        dreaminaTaskStatus: 'error',
        dreaminaTaskPhase: 'generating',
        isGenerating: false,
      }),
        assert.equal(value23._isGenerating, false),
        assert.equal(value23._dreaminaActiveSubmitId, ''),
        assert.equal(value18, 1),
        assert.equal(value19, 1),
        assert.equal(value20, 0),
        assert.equal(value21, 1),
        assert.equal(value23.btnEl.classList.contains('is-rh-busy'), false),
        assert.equal(value23.btnEl.title, '生成'),
        assert.doesNotMatch(value23.btnEl.innerHTML, /animation:spin/));
    } finally {
      typeof value17 === 'undefined' ? delete globalThis.document : (globalThis.document = value17);
    }
  }),
  test('aigenImage state sync: running RH task keeps loading when inactive Dreamina fields are done', () => {
    const value25 = globalThis.document;
    globalThis.document = { activeElement: null };
    try {
      const id2 = 'node-state-sync-rh-running',
        _data2 = {
          selectedNodeIds: [],
          pickConnectMode: {},
          nodes: {
            [id2]: { id: id2, model: 'runninghub/2044874075721441281', provider: 'runninghubwf' },
          },
          edges: {},
        };
      let value26 = 0,
        value27 = 0,
        value28 = 0;
      const aIGenerateNodeStateSyncModule2 = createAIGenerateNodeStateSyncModule({
          store: { getState: () => _data2, getIncomingEdges: () => [] },
          getImage: async () => null,
          getDisplayModelName: (value29) => value29,
          startLoading: () => {
            value26 += 1;
          },
          stopLoading: () => {
            value27 += 1;
          },
        }),
        value30 = Object.assign(Object.create(aIGenerateNodeStateSyncModule2), {
          nodeId: id2,
          _data: _data2.nodes[id2],
          _isGenerating: true,
          _refThumbObjectUrls: new Map(),
          previewEl: {},
          btnEl: createButtonStub(),
          promptEl: { innerHTML: '', innerText: 'prompt' },
          _normalizeDreaminaNodeData: (value31) => value31,
          _loadAndDisplayImage: () => {},
          _applyMaskPreview: () => {},
          _applyModelParamVisibility: () => {},
          _maybeResumeRunningHubTaskImpl: () => {
            value28 += 1;
          },
          _maybeResumeDreaminaTaskImpl: () => {},
          _maybeResumeAsyncTaskImpl: () => {},
          _updateSubmitButtonState: () => {},
        });
      (aIGenerateNodeStateSyncModule2.update.call(value30, {
        id: id2,
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
        assert.equal(value30._isGenerating, true),
        assert.equal(value26, 1),
        assert.equal(value27, 0),
        assert.equal(value28, 1),
        assert.equal(value30.btnEl.classList.contains('is-rh-busy'), true),
        assert.match(value30.btnEl.innerHTML, /animation:spin/));
    } finally {
      typeof value25 === 'undefined' ? delete globalThis.document : (globalThis.document = value25);
    }
  }),
  test('aigenImage state sync: live running state restarts loading after remount', () => {
    const value32 = globalThis.document;
    globalThis.document = { activeElement: null };
    try {
      const id3 = 'node-state-sync-live-running',
        _data3 = {
          selectedNodeIds: [],
          pickConnectMode: {},
          nodes: { [id3]: { id: id3, model: 'volcengine/seedream-4.0', provider: 'volcengine' } },
          edges: {},
        };
      let value33 = 0,
        value34 = 0;
      const aIGenerateNodeStateSyncModule3 = createAIGenerateNodeStateSyncModule({
          store: { getState: () => _data3, getIncomingEdges: () => [] },
          getImage: async () => null,
          getDisplayModelName: (value35) => value35,
          startLoading: () => {
            value33 += 1;
          },
          stopLoading: () => {
            value34 += 1;
          },
        }),
        value36 = Object.assign(Object.create(aIGenerateNodeStateSyncModule3), {
          nodeId: id3,
          _data: _data3.nodes[id3],
          _isGenerating: false,
          _refThumbObjectUrls: new Map(),
          previewEl: {},
          btnEl: createIdleButtonStub(),
          promptEl: { innerHTML: '', innerText: 'prompt' },
          _normalizeDreaminaNodeData: (value37) => value37,
          _loadAndDisplayImage: () => {},
          _applyMaskPreview: () => {},
          _applyModelParamVisibility: () => {},
          _maybeResumeRunningHubTaskImpl: () => {},
          _maybeResumeDreaminaTaskImpl: () => {},
          _maybeResumeAsyncTaskImpl: () => {},
          _updateSubmitButtonState: () => {},
        });
      (aIGenerateNodeStateSyncModule3.update.call(value36, {
        id: id3,
        model: 'volcengine/seedream-4.0',
        provider: 'volcengine',
        isGenerating: true,
        jobStatus: 'running',
        generationStartTime: 1000,
        generationDuration: null,
      }),
        assert.equal(value36._isGenerating, true),
        assert.equal(value33, 1),
        assert.equal(value34, 0));
    } finally {
      typeof value32 === 'undefined' ? delete globalThis.document : (globalThis.document = value32);
    }
  }),
  test('aigenImage submit button: running RH state renders cancel button from unified state', () => {
    const id4 = 'node-image-rh-running-button-state',
      _data4 = {
        nodes: {
          [id4]: {
            id: id4,
            model: 'runninghub/2044874075721441281',
            provider: 'runninghubwf',
            rhTaskId: 'rh-image-running',
            rhTaskStatus: 'running',
            jobStatus: 'running',
            isGenerating: true,
          },
        },
      },
      aIGenerateNodeUiModule = createAIGenerateNodeUiModule({
        store: { getState: () => _data4, getIncomingEdges: () => [] },
      }),
      value38 = Object.assign(Object.create(aIGenerateNodeUiModule), {
        nodeId: id4,
        _data: _data4.nodes[id4],
        _rhCancelInFlight: false,
        promptEl: { innerText: 'prompt' },
        btnEl: createIdleButtonStub(),
        _isRunninghubWorkflowModel: () => true,
      });
    (aIGenerateNodeUiModule._updateSubmitButtonState.call(value38),
      assert.equal(value38.btnEl.disabled, false),
      assert.equal(value38.btnEl.style.cursor, ''),
      assert.equal(value38.btnEl.classList.contains('is-task-cancel'), true),
      assert.match(value38.btnEl.innerHTML, /v2-task-cancel-spin/),
      (value38._rhCancelInFlight = true),
      aIGenerateNodeUiModule._updateSubmitButtonState.call(value38),
      assert.equal(value38.btnEl.disabled, true),
      assert.equal(value38.btnEl.style.cursor, 'var(--unavailable-cursor)'),
      assert.equal(value38.btnEl.classList.contains('is-task-cancel'), true),
      (_data4.nodes[id4] = {
        ..._data4.nodes[id4],
        rhTaskStatus: 'failed',
        jobStatus: 'error',
        isGenerating: true,
      }),
      (value38._data = _data4.nodes[id4]),
      (value38._rhCancelInFlight = false),
      aIGenerateNodeUiModule._updateSubmitButtonState.call(value38),
      assert.equal(value38.btnEl.classList.contains('is-task-cancel'), false),
      assert.doesNotMatch(value38.btnEl.innerHTML, /v2-task-cancel-spin/));
  }),
  test('aigenImage submit button: finished async status is terminal and unlocks generation', () => {
    const id5 = 'node-image-grsai-finished-button-state',
      _data5 = {
        nodes: {
          [id5]: {
            id: id5,
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
      aIGenerateNodeUiModule2 = createAIGenerateNodeUiModule({
        store: { getState: () => _data5, getIncomingEdges: () => [] },
      }),
      value39 = Object.assign(Object.create(aIGenerateNodeUiModule2), {
        nodeId: id5,
        _data: _data5.nodes[id5],
        promptEl: { innerText: 'prompt' },
        btnEl: createIdleButtonStub(),
        _isRunninghubWorkflowModel: () => false,
      });
    (aIGenerateNodeUiModule2._updateSubmitButtonState.call(value39),
      assert.equal(value39.btnEl.disabled, false),
      assert.equal(value39.btnEl.style.cursor, ''),
      assert.doesNotMatch(value39.btnEl.innerHTML, /animation:spin/));
  }),
  test('aigenImage submit button: empty editor can generate from non-empty text input', () => {
    const id6 = 'node-image-text-input-button',
      id7 = 'node-image-text-input-source',
      _data6 = {
        nodes: {
          [id6]: { id: id6, type: 'ai-image', model: 'gpt-image-2', provider: 'grsai' },
          [id7]: { id: id7, type: 'source-text', text: '用文本入参生成一张海报' },
        },
      },
      value40 = [{ id: 'edge-image-text-input', sourceId: id7, targetId: id6 }],
      aIGenerateNodeUiModule3 = createAIGenerateNodeUiModule({
        store: { getState: () => _data6, getIncomingEdges: () => value40 },
      }),
      value41 = Object.assign(Object.create(aIGenerateNodeUiModule3), {
        nodeId: id6,
        _data: _data6.nodes[id6],
        promptEl: { innerText: '', childNodes: [] },
        btnEl: createIdleButtonStub(),
        _isRunninghubWorkflowModel: () => false,
      });
    (aIGenerateNodeUiModule3._updateSubmitButtonState.call(value41),
      assert.equal(value41.btnEl.disabled, false),
      assert.equal(value41.btnEl.style.cursor, ''));
  }),
  test('aigenImage submit button: Agnes image input can generate without prompt', () => {
    const id8 = 'node-agnes-image-input-button',
      id9 = 'node-agnes-image-input-source',
      _data7 = {
        nodes: {
          [id8]: {
            id: id8,
            type: 'ai-image',
            model: 'agnes/agnes-image-2.0-flash',
            provider: 'agnes',
          },
          [id9]: { id: id9, type: 'source-image', imageUrl: 'https://cdn.example.com/input.png' },
        },
        edges: {
          'edge-agnes-image-input': {
            id: 'edge-agnes-image-input',
            sourceId: id9,
            targetId: id8,
          },
        },
      },
      value42 = Object.values(_data7.edges),
      aIGenerateNodeUiModule4 = createAIGenerateNodeUiModule({
        store: { getState: () => _data7, getIncomingEdges: () => value42 },
      }),
      value43 = Object.assign(Object.create(aIGenerateNodeUiModule4), {
        nodeId: id8,
        _data: _data7.nodes[id8],
        promptEl: { innerText: '', childNodes: [] },
        btnEl: createIdleButtonStub(),
        _isRunninghubWorkflowModel: () => false,
      });
    (aIGenerateNodeUiModule4._updateSubmitButtonState.call(value43),
      assert.equal(value43.btnEl.disabled, false),
      assert.equal(value43.btnEl.style.cursor, ''));
  }),
  test('aigenImage ui normalize: APIMart Seedream manifest models are preserved', () => {
    const id10 = 'node-apimart-seedream-preserve',
      value44 = {
        nodes: {
          [id10]: { id: id10, model: 'apimart/seedream-4.0', provider: 'apimart', imageSize: '4K' },
        },
      },
      list9 = [],
      aIGenerateNodeUiModule5 = createAIGenerateNodeUiModule({
        store: {
          getState: () => value44,
          updateNodeData: (id11, patch) => list9.push({ id: id11, patch: patch }),
        },
      }),
      value45 = Object.assign(Object.create(aIGenerateNodeUiModule5), { nodeId: id10 }),
      value46 = aIGenerateNodeUiModule5._normalizeLegacySeedreamModel.call(value45, value44.nodes[id10]);
    (assert.equal(value46.model, 'apimart/seedream-4.0'),
      assert.equal(value46.provider, 'apimart'),
      assert.equal(value46.imageSize, '4K'),
      assert.deepEqual(list9, []));
  }),
  test('aigenImage state sync: person replace V3 fixed image slots can swap', async () => {
    const value47 = globalThis.document;
    globalThis.document = { createElement: (tagName2) => new FakeElement({ tagName: tagName2 }) };
    const id12 = 'node-person-replace-v3';
    try {
      const _data8 = {
          selectedNodeIds: [],
          pickConnectMode: {},
          nodes: {
            [id12]: {
              id: id12,
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
            edgeA: { id: 'edgeA', sourceId: 'imageA', targetId: id12, refSlot: 'replaceTarget' },
            edgeB: { id: 'edgeB', sourceId: 'imageB', targetId: id12, refSlot: 'replacedImage' },
          },
        },
        list10 = [],
        store = {
          getState: () => _data8,
          getIncomingEdges: (value48) =>
            Object.values(_data8.edges).filter((item8) => item8.targetId === value48),
          updateEdgesBatch(removeIds, addedEdges) {
            list10.push({ removeIds: removeIds, addedEdges: addedEdges });
          },
        },
        aIGenerateNodeStateSyncModule4 = createAIGenerateNodeStateSyncModule({
          store: store,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        }),
        refBarEl = new FakeElement({ className: 'node-ref-bar' }),
        value49 = Object.assign(Object.create(aIGenerateNodeStateSyncModule4), {
          nodeId: id12,
          _data: _data8.nodes[id12],
          _refThumbObjectUrls: new Map(),
          refBarEl: refBarEl,
          promptEl: { innerText: '', querySelectorAll: () => [] },
        });
      await aIGenerateNodeStateSyncModule4._renderRefBarImpl.call(value49);
      const el8 = refBarEl.querySelector('[data-ref-slot="replaceTarget"]'),
        el9 = refBarEl.querySelector('[data-ref-slot="replacedImage"]'),
        el10 = refBarEl.querySelector('.ref-thumb-container');
      (assert.equal(el8.dataset.slot, 'replaceTarget'),
        assert.equal(el9.dataset.slot, 'replacedImage'),
        assert.equal(el8.dataset.kind, 'image'),
        assert.equal(el9.dataset.kind, 'image'),
        assert.equal(el8.getAttribute('draggable'), 'true'),
        assert.equal(el9.getAttribute('draggable'), 'true'),
        assert.equal(el8.classList.contains('ref-upload-slot'), false),
        assert.equal(el9.classList.contains('ref-upload-slot'), false),
        el10.dispatch('dragstart', createDragEvent(el8)),
        assert.equal(el8.classList.contains('is-dragging'), true),
        el10.dispatch('dragover', createDragEvent(el9)),
        assert.equal(el9.classList.contains('is-drop-allow'), true),
        assert.deepEqual(
          el10.children.map((el11) => el11.dataset.edgeId || ''),
          ['edgeA', 'edgeB'],
        ),
        el10.dispatch('drop', createDragEvent(el9)),
        assert.equal(el9.classList.contains('is-drop-allow'), false),
        el10.dispatch('dragend', createDragEvent(el8)),
        assert.equal(el8.classList.contains('is-dragging'), false),
        assert.equal(list10.length, 1),
        assert.deepEqual(list10[0].removeIds, ['edgeA', 'edgeB']),
        assert.deepEqual(
          list10[0].addedEdges.map((item9) => [item9.id, item9.refSlot]),
          [
            ['edgeA', 'replacedImage'],
            ['edgeB', 'replaceTarget'],
          ],
        ));
      for (const value50 of list10[0].removeIds) {
        delete _data8.edges[value50];
      }
      for (const value51 of list10[0].addedEdges) {
        _data8.edges[value51.id] = value51;
      }
      await aIGenerateNodeStateSyncModule4._renderRefBarImpl.call(value49);
      const el12 = refBarEl.querySelector('[data-ref-slot="replaceTarget"]'),
        el13 = refBarEl.querySelector('[data-ref-slot="replacedImage"]');
      (assert.equal(el12.dataset.edgeId, 'edgeB'),
        assert.equal(el12.dataset.sourceId, 'imageB'),
        assert.equal(el13.dataset.edgeId, 'edgeA'),
        assert.equal(el13.dataset.sourceId, 'imageA'));
    } finally {
      if (typeof value47 === 'undefined') delete globalThis.document;
      else globalThis.document = value47;
    }
  }),
  test('aigenImage state sync: modelApi fixed image slots render from manifest', async () => {
    const value52 = globalThis.document;
    globalThis.document = { createElement: (tagName3) => new FakeElement({ tagName: tagName3 }) };
    const id13 = 'node-youchuan-fixed-slots';
    try {
      const _data9 = {
          selectedNodeIds: [id13],
          pickConnectMode: {},
          nodes: {
            [id13]: {
              id: id13,
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
            edgeMain: { id: 'edgeMain', sourceId: 'mainImage', targetId: id13, refSlot: 'imageUrl' },
            edgeStyle: { id: 'edgeStyle', sourceId: 'styleImage', targetId: id13, refSlot: 'sref' },
          },
        },
        store2 = {
          getState: () => _data9,
          getStateRaw: () => _data9,
          getIncomingEdges: (value53) =>
            Object.values(_data9.edges).filter((item10) => item10.targetId === value53),
          updateEdgesBatch() {},
        },
        aIGenerateNodeStateSyncModule5 = createAIGenerateNodeStateSyncModule({
          store: store2,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        }),
        refBarEl2 = new FakeElement({ className: 'node-ref-bar' }),
        value54 = Object.assign(Object.create(aIGenerateNodeStateSyncModule5), {
          nodeId: id13,
          _data: _data9.nodes[id13],
          _refThumbObjectUrls: new Map(),
          refBarEl: refBarEl2,
          promptEl: { innerText: '', querySelectorAll: () => [] },
        });
      await aIGenerateNodeStateSyncModule5._renderRefBarImpl.call(value54);
      const el14 = refBarEl2.querySelector('[data-ref-slot="imageUrl"]'),
        el15 = refBarEl2.querySelector('[data-ref-slot="cref"]'),
        el16 = refBarEl2.querySelector('[data-ref-slot="sref"]');
      (assert.equal(el14.dataset.edgeId, 'edgeMain'),
        assert.equal(el14.dataset.kind, 'image'),
        assert.equal(el15.classList.contains('ref-upload-slot'), true),
        assert.equal(el16.dataset.edgeId, 'edgeStyle'),
        assert.equal(el16.dataset.sourceId, 'styleImage'));
    } finally {
      if (typeof value52 === 'undefined') delete globalThis.document;
      else globalThis.document = value52;
    }
  }),
  test('aigenImage state sync: Midjourney V7 renders only main and style fixed slots', async () => {
    const value55 = globalThis.document;
    globalThis.document = { createElement: (tagName4) => new FakeElement({ tagName: tagName4 }) };
    const id14 = 'node-youchuan-v7-fixed-slots';
    try {
      const _data10 = {
          selectedNodeIds: [id14],
          pickConnectMode: {},
          nodes: {
            [id14]: {
              id: id14,
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
            edgeMain: { id: 'edgeMain', sourceId: 'mainImage', targetId: id14, refSlot: 'imageUrl' },
            edgeStyle: { id: 'edgeStyle', sourceId: 'styleImage', targetId: id14, refSlot: 'sref' },
          },
        },
        store3 = {
          getState: () => _data10,
          getStateRaw: () => _data10,
          getIncomingEdges: (value56) =>
            Object.values(_data10.edges).filter((item11) => item11.targetId === value56),
          updateEdgesBatch() {},
        },
        aIGenerateNodeStateSyncModule6 = createAIGenerateNodeStateSyncModule({
          store: store3,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        }),
        refBarEl3 = new FakeElement({ className: 'node-ref-bar' }),
        value57 = Object.assign(Object.create(aIGenerateNodeStateSyncModule6), {
          nodeId: id14,
          _data: _data10.nodes[id14],
          _refThumbObjectUrls: new Map(),
          refBarEl: refBarEl3,
          promptEl: { innerText: '', querySelectorAll: () => [] },
        });
      await aIGenerateNodeStateSyncModule6._renderRefBarImpl.call(value57);
      const el17 = refBarEl3.querySelector('[data-ref-slot="imageUrl"]'),
        value58 = refBarEl3.querySelector('[data-ref-slot="cref"]'),
        el18 = refBarEl3.querySelector('[data-ref-slot="sref"]');
      (assert.equal(el17.dataset.edgeId, 'edgeMain'),
        assert.equal(el17.dataset.kind, 'image'),
        assert.equal(value58, null),
        assert.equal(el18.dataset.edgeId, 'edgeStyle'),
        assert.equal(el18.dataset.sourceId, 'styleImage'));
    } finally {
      if (typeof value55 === 'undefined') delete globalThis.document;
      else globalThis.document = value55;
    }
  }),
  test('aigenImage state sync: RunningHub image X renders one manifest fixed image slot', async () => {
    const value59 = globalThis.document;
    globalThis.document = { createElement: (tagName5) => new FakeElement({ tagName: tagName5 }) };
    const id15 = 'node-rh-image-x-fixed-slot';
    try {
      const _data11 = {
          selectedNodeIds: [id15],
          pickConnectMode: {},
          nodes: {
            [id15]: {
              id: id15,
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
            edgeRef: { id: 'edgeRef', sourceId: 'refImage', targetId: id15, refSlot: 'imageUrl' },
          },
        },
        store4 = {
          getState: () => _data11,
          getStateRaw: () => _data11,
          getIncomingEdges: (value60) =>
            Object.values(_data11.edges).filter((item12) => item12.targetId === value60),
          updateEdgesBatch() {},
        },
        aIGenerateNodeStateSyncModule7 = createAIGenerateNodeStateSyncModule({
          store: store4,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        }),
        refBarEl4 = new FakeElement({ className: 'node-ref-bar' }),
        value61 = Object.assign(Object.create(aIGenerateNodeStateSyncModule7), {
          nodeId: id15,
          _data: _data11.nodes[id15],
          _refThumbObjectUrls: new Map(),
          refBarEl: refBarEl4,
          promptEl: { innerText: '', querySelectorAll: () => [] },
        });
      await aIGenerateNodeStateSyncModule7._renderRefBarImpl.call(value61);
      const el19 = refBarEl4.querySelector('[data-ref-slot="imageUrl"]'),
        value62 = refBarEl4.querySelector('[data-ref-slot="sref"]');
      (assert.equal(el19.dataset.edgeId, 'edgeRef'),
        assert.equal(el19.dataset.kind, 'image'),
        assert.equal(value62, null));
    } finally {
      if (typeof value59 === 'undefined') delete globalThis.document;
      else globalThis.document = value59;
    }
  }),
  test('aigenImage state sync: refSlot changes trigger immediate ref bar refresh', () => {
    const value63 = globalThis.document,
      id16 = 'node-person-replace-v3-refresh',
      _data12 = {
        selectedNodeIds: [id16],
        pickConnectMode: {},
        nodes: {
          [id16]: {
            id: id16,
            type: 'ai-image',
            model: 'runninghub/2041177685895946242',
            provider: 'runninghubwf',
          },
          imageA: { id: 'imageA', type: 'source-image', _bizRev: 1 },
          imageB: { id: 'imageB', type: 'source-image', _bizRev: 1 },
        },
        edges: {
          edgeA: { id: 'edgeA', sourceId: 'imageA', targetId: id16, refSlot: 'replaceTarget' },
          edgeB: { id: 'edgeB', sourceId: 'imageB', targetId: id16, refSlot: 'replacedImage' },
        },
      };
    try {
      globalThis.document = { activeElement: null };
      const store5 = {
          getState: () => _data12,
          getStateRaw: () => _data12,
          getIncomingEdges: (value64) =>
            Object.values(_data12.edges).filter((item13) => item13.targetId === value64),
        },
        aIGenerateNodeStateSyncModule8 = createAIGenerateNodeStateSyncModule({
          store: store5,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        });
      let value65 = 0;
      const value66 = Object.assign(Object.create(aIGenerateNodeStateSyncModule8), {
        nodeId: id16,
        _data: _data12.nodes[id16],
        promptEl: { innerHTML: '', querySelectorAll: () => [] },
        _normalizeDreaminaNodeData: (value67) => value67,
        _loadAndDisplayImage: () => {},
        _applyMaskPreview: () => {},
        _applyModelParamVisibility: () => {},
        _updateSubmitButtonState: () => {},
        _renderRefBar: () => {
          value65 += 1;
        },
      });
      (aIGenerateNodeStateSyncModule8.update.call(value66, _data12.nodes[id16]),
        assert.equal(value65, 1),
        (_data12.edges.edgeA = { ..._data12.edges.edgeA, refSlot: 'replacedImage' }),
        (_data12.edges.edgeB = { ..._data12.edges.edgeB, refSlot: 'replaceTarget' }),
        aIGenerateNodeStateSyncModule8.update.call(value66, _data12.nodes[id16]),
        assert.equal(value65, 2));
    } finally {
      if (typeof value63 === 'undefined') delete globalThis.document;
      else globalThis.document = value63;
    }
  }),
  test('aigenImage state sync: thumbnail order changes trigger immediate ref bar refresh', () => {
    const value68 = globalThis.document,
      id17 = 'node-image-order-refresh',
      _data13 = {
        selectedNodeIds: [id17],
        pickConnectMode: {},
        nodes: {
          [id17]: {
            id: id17,
            type: 'ai-image',
            model: 'apimart/nano-banana-2',
            provider: 'apimart',
          },
          imageA: { id: 'imageA', type: 'source-image', _bizRev: 1 },
          imageB: { id: 'imageB', type: 'source-image', _bizRev: 1 },
        },
        edges: {
          edgeA: { id: 'edgeA', sourceId: 'imageA', targetId: id17 },
          edgeB: { id: 'edgeB', sourceId: 'imageB', targetId: id17 },
        },
      };
    try {
      globalThis.document = { activeElement: null };
      const store6 = {
          getState: () => _data13,
          getStateRaw: () => _data13,
          getIncomingEdges: (value69) =>
            Object.values(_data13.edges).filter((item14) => item14.targetId === value69),
        },
        aIGenerateNodeStateSyncModule9 = createAIGenerateNodeStateSyncModule({
          store: store6,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        });
      let value70 = 0;
      const value71 = Object.assign(Object.create(aIGenerateNodeStateSyncModule9), {
        nodeId: id17,
        _data: _data13.nodes[id17],
        promptEl: { innerHTML: '', querySelectorAll: () => [] },
        _normalizeDreaminaNodeData: (value72) => value72,
        _loadAndDisplayImage: () => {},
        _applyMaskPreview: () => {},
        _applyModelParamVisibility: () => {},
        _updateSubmitButtonState: () => {},
        _renderRefBar: () => {
          value70 += 1;
        },
      });
      (aIGenerateNodeStateSyncModule9.update.call(value71, _data13.nodes[id17]),
        assert.equal(value70, 1),
        (_data13.edges = { edgeB: _data13.edges.edgeB, edgeA: _data13.edges.edgeA }),
        aIGenerateNodeStateSyncModule9.update.call(value71, _data13.nodes[id17]),
        assert.equal(value70, 2));
    } finally {
      if (typeof value68 === 'undefined') delete globalThis.document;
      else globalThis.document = value68;
    }
  }),
  test('aigenImage state sync: person replace V2.1 model keeps empty upload slot', async () => {
    const value73 = globalThis.document;
    globalThis.document = { createElement: (tagName6) => new FakeElement({ tagName: tagName6 }) };
    const id18 = 'node-person-replace-v21';
    try {
      const _data14 = {
          selectedNodeIds: [],
          pickConnectMode: {},
          nodes: {
            [id18]: {
              id: id18,
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
            edgeA: { id: 'edgeA', sourceId: 'imageA', targetId: id18, refSlot: 'replaceTarget' },
          },
        },
        store7 = {
          getState: () => _data14,
          getIncomingEdges: (value74) =>
            Object.values(_data14.edges).filter((item15) => item15.targetId === value74),
          updateEdgesBatch() {},
        },
        aIGenerateNodeStateSyncModule10 = createAIGenerateNodeStateSyncModule({
          store: store7,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        }),
        refBarEl5 = new FakeElement({ className: 'node-ref-bar' }),
        value75 = Object.assign(Object.create(aIGenerateNodeStateSyncModule10), {
          nodeId: id18,
          _data: _data14.nodes[id18],
          _refThumbObjectUrls: new Map(),
          refBarEl: refBarEl5,
          promptEl: { innerText: '', querySelectorAll: () => [] },
        });
      await aIGenerateNodeStateSyncModule10._renderRefBarImpl.call(value75);
      const el20 = refBarEl5.querySelector('[data-ref-slot="replaceTarget"]'),
        el21 = refBarEl5.querySelector('[data-ref-slot="replacedImage"]');
      (assert.equal(el20.classList.contains('ref-upload-slot'), false),
        assert.equal(el20.getAttribute('draggable'), 'true'),
        assert.equal(el21.classList.contains('ref-upload-slot'), true),
        assert.equal(el21.dataset.refSlot, 'replacedImage'),
        assert.equal(el21.dataset.slot, 'replacedImage'),
        assert.equal(el21.dataset.kind, 'image'),
        assert.equal(el21.getAttribute('draggable'), 'false'));
    } finally {
      if (typeof value73 === 'undefined') delete globalThis.document;
      else globalThis.document = value73;
    }
  }),
  test('aigenImage state sync: anime real image input changes trigger adaptive ratio', async () => {
    const value76 = globalThis.document,
      id19 = 'anime-real-node',
      _data15 = {
        pickConnectMode: {},
        nodes: {
          [id19]: {
            id: id19,
            type: 'ai-image',
            model: 'runninghub/1994718111704158209',
            provider: 'runninghubwf',
            aspectRatio: '自适应',
          },
          imageA: { id: 'imageA', type: 'source-image', width: 900, height: 1600, _bizRev: 1 },
          imageB: { id: 'imageB', type: 'source-image', width: 1600, height: 900, _bizRev: 1 },
        },
        edges: { edgeA: { id: 'edgeA', sourceId: 'imageA', targetId: id19 } },
      };
    try {
      globalThis.document = {
        activeElement: null,
        createElement: (tagName7) => new FakeElement({ tagName: tagName7 }),
      };
      const store8 = {
          getState: () => _data15,
          getIncomingEdges: (value77) =>
            Object.values(_data15.edges).filter((item16) => item16.targetId === value77),
        },
        aIGenerateNodeStateSyncModule11 = createAIGenerateNodeStateSyncModule({
          store: store8,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        });
      let value78 = 0;
      const value79 = Object.assign(Object.create(aIGenerateNodeStateSyncModule11), {
        nodeId: id19,
        _data: _data15.nodes[id19],
        refBarEl: new FakeElement(),
        _refThumbObjectUrls: new Map(),
        runAdaptiveRatio: () => {
          value78 += 1;
        },
        promptEl: { innerText: '', querySelectorAll: () => [] },
      });
      (await aIGenerateNodeStateSyncModule11._renderRefBarImpl.call(value79),
        await new Promise((value80) => setTimeout(value80, 70)),
        assert.equal(value78, 1),
        (_data15.edges.edgeA = { ..._data15.edges.edgeA, sourceId: 'imageB' }),
        await aIGenerateNodeStateSyncModule11._renderRefBarImpl.call(value79),
        await new Promise((value81) => setTimeout(value81, 70)),
        assert.equal(value78, 2));
    } finally {
      if (typeof value76 === 'undefined') delete globalThis.document;
      else globalThis.document = value76;
    }
  }),
  test('aigenImage state sync: group output order changes trigger adaptive ratio', async () => {
    const value82 = globalThis.document,
      id20 = 'schema-image-node',
      _data16 = {
        pickConnectMode: {},
        nodes: {
          [id20]: {
            id: id20,
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
            width: 900,
            height: 1600,
            _bizRev: 1,
          },
          imageB: {
            id: 'imageB',
            type: 'source-image',
            parentId: 'group',
            width: 1600,
            height: 900,
            _bizRev: 1,
          },
        },
        edges: {
          groupEdge: {
            id: 'groupEdge',
            sourceId: 'group',
            targetId: id20,
            groupOutputSourceOrder: ['imageA', 'imageB'],
          },
        },
      },
      handler = () =>
        _data16.edges.groupEdge.groupOutputSourceOrder.map((sourceId) => ({
          ..._data16.edges.groupEdge,
          id: 'groupEdge::group-output::' + sourceId,
          sourceId: sourceId,
          isGroupOutput: true,
          outputGroupId: 'group',
          groupOutputEdgeId: 'groupEdge',
          effectiveTargetId: id20,
        }));
    try {
      globalThis.document = {
        activeElement: null,
        createElement: (tagName8) => new FakeElement({ tagName: tagName8 }),
      };
      const store9 = {
          getState: () => _data16,
          getIncomingEdges: (value83) => (value83 === id20 ? handler() : []),
        },
        aIGenerateNodeStateSyncModule12 = createAIGenerateNodeStateSyncModule({
          store: store9,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        });
      let value84 = 0;
      const value85 = Object.assign(Object.create(aIGenerateNodeStateSyncModule12), {
        nodeId: id20,
        _data: _data16.nodes[id20],
        refBarEl: new FakeElement(),
        _refThumbObjectUrls: new Map(),
        runAdaptiveRatio: () => {
          value84 += 1;
        },
        promptEl: { innerText: '', querySelectorAll: () => [] },
      });
      (await aIGenerateNodeStateSyncModule12._renderRefBarImpl.call(value85),
        await new Promise((value86) => setTimeout(value86, 70)),
        assert.equal(value84, 1),
        (_data16.edges.groupEdge = {
          ..._data16.edges.groupEdge,
          groupOutputSourceOrder: ['imageB', 'imageA'],
        }),
        await aIGenerateNodeStateSyncModule12._renderRefBarImpl.call(value85),
        await new Promise((value87) => setTimeout(value87, 70)),
        assert.equal(value84, 2));
    } finally {
      if (typeof value82 === 'undefined') delete globalThis.document;
      else globalThis.document = value82;
    }
  }),
  test('aigenImage state sync: group first output removal triggers adaptive ratio while ref bar hidden', async () => {
    const value88 = globalThis.document,
      id21 = 'schema-image-node',
      _data17 = {
        pickConnectMode: {},
        selectedNodeIds: [],
        nodes: {
          [id21]: {
            id: id21,
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
            width: 900,
            height: 1600,
            _bizRev: 1,
          },
          imageB: {
            id: 'imageB',
            type: 'source-image',
            parentId: 'group',
            width: 1600,
            height: 900,
            _bizRev: 1,
          },
        },
        edges: {
          groupEdge: {
            id: 'groupEdge',
            sourceId: 'group',
            targetId: id21,
            groupOutputSourceOrder: ['imageA', 'imageB'],
          },
        },
      },
      handler2 = () =>
        _data17.edges.groupEdge.groupOutputSourceOrder
          .filter((item17) => _data17.nodes[item17]?.parentId === 'group')
          .map((sourceId2) => ({
            ..._data17.edges.groupEdge,
            id: 'groupEdge::group-output::' + sourceId2,
            sourceId: sourceId2,
            isGroupOutput: true,
            outputGroupId: 'group',
            groupOutputEdgeId: 'groupEdge',
            effectiveTargetId: id21,
          }));
    try {
      globalThis.document = {
        activeElement: null,
        createElement: (tagName9) => new FakeElement({ tagName: tagName9 }),
      };
      const store10 = {
          getState: () => _data17,
          getIncomingEdges: (value89) => (value89 === id21 ? handler2() : []),
        },
        aIGenerateNodeStateSyncModule13 = createAIGenerateNodeStateSyncModule({
          store: store10,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
          getDisplayModelName: (value90) => value90,
        });
      let value91 = 0,
        value92 = 0;
      const value93 = Object.assign(Object.create(aIGenerateNodeStateSyncModule13), {
        nodeId: id21,
        _data: _data17.nodes[id21],
        _root: new FakeElement(),
        _refThumbObjectUrls: new Map(),
        _normalizeDreaminaNodeData: (value94) => value94,
        _loadAndDisplayImage: () => {},
        _applyMaskPreview: () => {},
        _applyModelParamVisibility: () => {},
        _updateSubmitButtonState: () => {},
        _renderRefBar: () => {
          value92 += 1;
        },
        runAdaptiveRatio: () => {
          value91 += 1;
        },
        promptEl: { innerHTML: '', innerText: '', querySelectorAll: () => [] },
      });
      (aIGenerateNodeStateSyncModule13.update.call(value93, _data17.nodes[id21]),
        await new Promise((value95) => setTimeout(value95, 70)),
        assert.equal(value91, 1),
        assert.equal(value92, 0),
        (_data17.nodes.imageA = { ..._data17.nodes.imageA, parentId: '' }),
        aIGenerateNodeStateSyncModule13.update.call(value93, _data17.nodes[id21]),
        await new Promise((value96) => setTimeout(value96, 70)),
        assert.equal(value91, 2),
        assert.equal(value92, 0));
    } finally {
      if (typeof value88 === 'undefined') delete globalThis.document;
      else globalThis.document = value88;
    }
  }),
  test('aigenImage state sync: schema adaptive ratio triggers display resize on input change', async () => {
    const value97 = globalThis.document,
      id22 = 'schema-image-node',
      _data18 = {
        pickConnectMode: {},
        nodes: {
          [id22]: {
            id: id22,
            type: 'ai-image',
            model: 'apimart/nano-banana-2',
            provider: 'apimart',
            generationParams: { aspectRatio: '自适应' },
          },
          imageA: { id: 'imageA', type: 'source-image', width: 900, height: 1600, _bizRev: 1 },
          imageB: { id: 'imageB', type: 'source-image', width: 1600, height: 900, _bizRev: 1 },
        },
        edges: { edgeA: { id: 'edgeA', sourceId: 'imageA', targetId: id22 } },
      };
    try {
      globalThis.document = {
        activeElement: null,
        createElement: (tagName10) => new FakeElement({ tagName: tagName10 }),
      };
      const store11 = {
          getState: () => _data18,
          getIncomingEdges: (value98) =>
            Object.values(_data18.edges).filter((item18) => item18.targetId === value98),
        },
        aIGenerateNodeStateSyncModule14 = createAIGenerateNodeStateSyncModule({
          store: store11,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        });
      let value99 = 0;
      const value100 = Object.assign(Object.create(aIGenerateNodeStateSyncModule14), {
        nodeId: id22,
        _data: _data18.nodes[id22],
        refBarEl: new FakeElement(),
        _refThumbObjectUrls: new Map(),
        runAdaptiveRatio: () => {
          value99 += 1;
        },
        promptEl: { innerText: '', querySelectorAll: () => [] },
      });
      (await aIGenerateNodeStateSyncModule14._renderRefBarImpl.call(value100),
        await new Promise((value101) => setTimeout(value101, 70)),
        assert.equal(value99, 1),
        (_data18.nodes[id22].generationParams.aspectRatio = '16:9'),
        (_data18.edges.edgeA = { ..._data18.edges.edgeA, sourceId: 'imageB' }),
        await aIGenerateNodeStateSyncModule14._renderRefBarImpl.call(value100),
        await new Promise((value102) => setTimeout(value102, 70)),
        assert.equal(value99, 1));
    } finally {
      if (typeof value97 === 'undefined') delete globalThis.document;
      else globalThis.document = value97;
    }
  }));
