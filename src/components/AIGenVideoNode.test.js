import test from 'node:test';
import assert from 'node:assert/strict';
import { createFakePreviewContainer, installPreviewDomStubs } from '../../tests/testPreviewDom.js';
const restoreDom = installPreviewDomStubs();
((globalThis.window.addEventListener ||= () => {}), (globalThis.window.removeEventListener ||= () => {}));
const { default: store } = await import('../core/stores/appStore.js'),
  { AIGenVideoNode } = await import('./AIGenVideoNode.js'),
  { RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG } = await import('../core/rendererDeferredMedia.js');
(test.afterEach(() => {
  store.loadState({ nodes: {}, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } });
}),
  test.after(() => {
    restoreDom();
  }));
function createButtonStub() {
  const _0x2a5f40 = new Set();
  return {
    disabled: false,
    title: '',
    innerHTML: '',
    style: {},
    dataset: {},
    classList: {
      add(..._0x46b5d4) {
        _0x46b5d4.forEach((_0x3c69b4) => _0x2a5f40.add(String(_0x3c69b4 || '')));
      },
      remove(..._0x320697) {
        _0x320697.forEach((_0x593b53) => _0x2a5f40.delete(String(_0x593b53 || '')));
      },
      toggle(_0x44ce33, _0x315a4e) {
        const _0x22753f = String(_0x44ce33 || '');
        if (_0x315a4e === true) return (_0x2a5f40.add(_0x22753f), true);
        if (_0x315a4e === false) return (_0x2a5f40.delete(_0x22753f), false);
        if (_0x2a5f40.has(_0x22753f)) return (_0x2a5f40.delete(_0x22753f), false);
        return (_0x2a5f40.add(_0x22753f), true);
      },
      contains(_0xf572e2) {
        return _0x2a5f40.has(String(_0xf572e2 || ''));
      },
    },
    setAttribute(_0xf2490a, _0x24f1b9) {
      this.dataset[String(_0xf2490a || '')] = String(_0x24f1b9 || '');
    },
    removeAttribute(_0xc748ca) {
      delete this.dataset[String(_0xc748ca || '')];
    },
  };
}
function createElementStub() {
  return { ...createButtonStub(), querySelectorAll: () => [] };
}
(test('AIGenVideoNode: renderer-deferred media skips video DOM until hydration', async () => {
  const _0x2fbbfa = 'node-video-deferred-media',
    _0x1bcaea = {
      id: _0x2fbbfa,
      type: 'ai-video',
      model: 'apimart/seedance-test',
      provider: 'apimart',
      videos: [{ videoUrl: '/output/a.mp4', thumbUrl: '/output/a.jpg' }],
      [RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG]: true,
    };
  store.loadState({ nodes: { [_0x2fbbfa]: _0x1bcaea }, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } });
  const _0x3a2eb3 = new AIGenVideoNode(_0x1bcaea);
  let _0x4fc19d = null;
  ((_0x3a2eb3.previewEl = createFakePreviewContainer()),
    (_0x3a2eb3._placeholderEl = { style: {}, querySelector: () => null }),
    (_0x3a2eb3._setVideoOverlaysVisible = (_0x45cb33) => {
      _0x4fc19d = _0x45cb33;
    }),
    await _0x3a2eb3._loadAndDisplayVideo(),
    assert.equal(_0x3a2eb3._deferredVideoViewRefreshPending, true),
    assert.equal(_0x3a2eb3._placeholderEl.style.display, 'none'),
    assert.equal(_0x4fc19d, false),
    assert.equal(_0x3a2eb3._multiVideosContainer, null),
    assert.ok(String(_0x3a2eb3._deferredPosterImgEl?.src || '').includes('/output/a.jpg')));
  let _0x5a3bfe = 0,
    _0x50a11a = 0;
  ((_0x3a2eb3._loadAndDisplayVideo = () => {
    _0x5a3bfe += 1;
  }),
    (_0x3a2eb3._renderRefBar = () => {
      _0x50a11a += 1;
    }),
    (_0x3a2eb3._updateSubmitButtonState = () => {}),
    (_0x3a2eb3._renderRefBarPendingWhenVisible = true),
    _0x3a2eb3.hydrateDeferredMedia(),
    assert.equal(_0x3a2eb3._rendererMediaDeferred, false),
    assert.equal(_0x5a3bfe, 1),
    assert.equal(_0x50a11a, 1));
}),
  test('AIGenVideoNode: running RH state keeps preview loading over previous result', async () => {
    const _0x17ab0f = 'node-video-rh-existing-result-loading',
      _0x3d196b = {
        id: _0x17ab0f,
        type: 'ai-video',
        model: 'runninghub/2041741496667348994',
        provider: 'runninghubwf',
        videos: [{ videoUrl: '/output/previous.mp4' }],
        videoUrl: '/output/previous.mp4',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskId: 'rh-running',
        rhTaskStatus: 'pending',
        dreaminaTaskStatus: 'idle',
        dreaminaTaskPhase: 'done',
        asyncTaskStatus: 'idle',
      };
    store.loadState({ nodes: { [_0x17ab0f]: _0x3d196b }, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } });
    const _0x47c347 = new AIGenVideoNode(_0x3d196b);
    ((_0x47c347.previewEl = createFakePreviewContainer()),
      (_0x47c347.promptEl = { ...createElementStub(), innerHTML: '', innerText: '' }),
      (_0x47c347.btnEl = createButtonStub()),
      (_0x47c347.footerEl = null),
      (_0x47c347._placeholderEl = { style: {}, querySelector: () => null }),
      (_0x47c347._root = { querySelectorAll: () => [] }),
      (_0x47c347._normalizeDreaminaNodeData = (_0x1fc509) => _0x1fc509),
      (_0x47c347._isRunninghubWorkflowModel = () => true),
      (_0x47c347._loadAndDisplayVideo = () => {}),
      (_0x47c347._maybeResumeDreaminaTaskImpl = () => {}),
      (_0x47c347._maybeResumeRunningHubTaskImpl = () => {}),
      (_0x47c347._maybeResumeAsyncTaskImpl = () => {}),
      (_0x47c347._syncPromptBoxSizeFromData = () => {}),
      (_0x47c347._syncGenerationNodeHelpTip = () => {}),
      (_0x47c347._renderRefBar = () => {}),
      (_0x47c347._syncBtnIconState = () => {}),
      (_0x47c347._setVideoOverlaysVisible = () => {}),
      _0x47c347.update(_0x3d196b),
      await new Promise((_0x260218) => setTimeout(_0x260218, 70)),
      assert.equal(_0x47c347.previewEl.classList.contains('img-preview-loading'), true),
      assert.equal(!!_0x47c347.previewEl.querySelector('.img-loading-overlay'), true),
      assert.equal(_0x47c347.btnEl.classList.contains('is-task-cancel'), true),
      assert.match(_0x47c347.btnEl.innerHTML, /v2-task-cancel-spin/));
    const _0x3bee5f = { ..._0x3d196b, isGenerating: true, jobStatus: 'error', rhTaskStatus: 'failed' };
    (store.loadState({ nodes: { [_0x17ab0f]: _0x3bee5f }, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } }),
      _0x47c347.update(_0x3bee5f),
      assert.equal(_0x47c347.btnEl.classList.contains('is-task-cancel'), false),
      assert.doesNotMatch(_0x47c347.btnEl.innerHTML, /v2-task-cancel-spin/));
  }),
  test('AIGenVideoNode: result videos clear inner no-result class', () => {
    const _0x5ba10b = 'node-video-result-clears-no-result',
      _0x68c30e = {
        id: _0x5ba10b,
        type: 'ai-video',
        model: 'apimart/seedance-test',
        provider: 'apimart',
        videos: [],
      };
    store.loadState({ nodes: { [_0x5ba10b]: _0x68c30e }, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } });
    const _0x2ae256 = new AIGenVideoNode(_0x68c30e);
    ((_0x2ae256.previewEl = createFakePreviewContainer()),
      (_0x2ae256.promptEl = { innerHTML: '', innerText: '' }),
      (_0x2ae256.btnEl = createButtonStub()),
      (_0x2ae256.footerEl = null),
      (_0x2ae256._placeholderEl = { style: {}, querySelector: () => null }),
      (_0x2ae256._root = createElementStub()),
      _0x2ae256._root.classList.add('no-result'),
      (_0x2ae256._normalizeDreaminaNodeData = (_0x2ae1e6) => _0x2ae1e6),
      (_0x2ae256._isRunninghubWorkflowModel = () => false),
      (_0x2ae256._isDreaminaVideoNode = () => false),
      (_0x2ae256._getDreaminaEffectiveNodeData = (_0x38c9d0) => _0x38c9d0),
      (_0x2ae256._loadAndDisplayVideo = () => {}),
      (_0x2ae256._maybeResumeDreaminaTaskImpl = () => {}),
      (_0x2ae256._maybeResumeRunningHubTaskImpl = () => {}),
      (_0x2ae256._maybeResumeAsyncTaskImpl = () => {}),
      (_0x2ae256._syncPromptBoxSizeFromData = () => {}),
      (_0x2ae256._syncGenerationNodeHelpTip = () => {}),
      (_0x2ae256._renderRefBar = () => {}),
      (_0x2ae256._syncBtnIconState = () => {}),
      (_0x2ae256._setVideoOverlaysVisible = () => {}));
    const _0x5818c5 = { ..._0x68c30e, videos: [{ localPath: 'output/final.mp4' }] };
    (store.loadState({ nodes: { [_0x5ba10b]: _0x5818c5 }, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } }),
      _0x2ae256.update(_0x5818c5),
      assert.equal(_0x2ae256._root.classList.contains('no-result'), false));
  }),
  test('AIGenVideoNode: adaptive ratio reacts to input order changes', async () => {
    const _0x409448 = 'node-video-adaptive-order',
      _0x55893a = {
        id: _0x409448,
        type: 'ai-video',
        model: 'apimart/seedance-test',
        provider: 'apimart',
        aspectRatio: '自适应',
      },
      _0x22b157 = { id: 'edgeA', sourceId: 'imageA', targetId: _0x409448 },
      _0x357e76 = { id: 'edgeB', sourceId: 'imageB', targetId: _0x409448 };
    store.loadState({
      nodes: {
        [_0x409448]: _0x55893a,
        imageA: { id: 'imageA', type: 'source-image', width: 0x384, height: 0x640 },
        imageB: { id: 'imageB', type: 'source-image', width: 0x640, height: 0x384 },
      },
      edges: { edgeA: _0x22b157, edgeB: _0x357e76 },
      viewport: { x: 0, y: 0, zoom: 1 },
    });
    const _0x391d81 = new AIGenVideoNode(_0x55893a);
    ((_0x391d81.previewEl = createFakePreviewContainer()),
      (_0x391d81.promptEl = { ...createElementStub(), innerHTML: '', innerText: '' }),
      (_0x391d81.btnEl = createButtonStub()),
      (_0x391d81.footerEl = null),
      (_0x391d81._placeholderEl = { style: {}, querySelector: () => null }),
      (_0x391d81._root = { querySelectorAll: () => [] }),
      (_0x391d81._normalizeDreaminaNodeData = (_0x2550af) => _0x2550af),
      (_0x391d81._isRunninghubWorkflowModel = () => false),
      (_0x391d81._isDreaminaVideoNode = () => false),
      (_0x391d81._getDreaminaEffectiveNodeData = (_0x364a81) => _0x364a81),
      (_0x391d81._loadAndDisplayVideo = () => {}),
      (_0x391d81._maybeResumeDreaminaTaskImpl = () => {}),
      (_0x391d81._maybeResumeRunningHubTaskImpl = () => {}),
      (_0x391d81._maybeResumeAsyncTaskImpl = () => {}),
      (_0x391d81._syncPromptBoxSizeFromData = () => {}),
      (_0x391d81._syncGenerationNodeHelpTip = () => {}),
      (_0x391d81._renderRefBar = () => {}),
      (_0x391d81._syncBtnIconState = () => {}),
      (_0x391d81._setVideoOverlaysVisible = () => {}));
    let _0x12d135 = 0;
    ((_0x391d81._runAdaptiveRatio = () => {
      _0x12d135 += 1;
    }),
      _0x391d81.update(_0x55893a),
      await new Promise((_0xd24df7) => setTimeout(_0xd24df7, 70)),
      assert.equal(_0x12d135, 0),
      store.updateEdgesBatch(['edgeA', 'edgeB'], [_0x357e76, _0x22b157]),
      _0x391d81.update(store.getState().nodes[_0x409448]),
      await new Promise((_0x1f9044) => setTimeout(_0x1f9044, 70)),
      assert.equal(_0x12d135, 1));
  }),
  test('AIGenVideoNode: skips preview reload when only non-preview data changes', () => {
    const _0x50df48 = 'node-video-preview-sig',
      _0x37baca = {
        id: _0x50df48,
        type: 'ai-video',
        model: 'apimart/seedance-test',
        provider: 'apimart',
        prompt: 'first prompt',
        videos: [{ localPath: 'output/final-a.mp4', videoWidth: 0x500, videoHeight: 0x2d0 }],
        _bizRev: 1,
      };
    store.loadState({ nodes: { [_0x50df48]: _0x37baca }, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } });
    const _0x1283a2 = new AIGenVideoNode(_0x37baca);
    ((_0x1283a2.previewEl = createFakePreviewContainer()),
      (_0x1283a2.promptEl = { ...createElementStub(), innerHTML: '', innerText: '' }),
      (_0x1283a2.btnEl = createButtonStub()),
      (_0x1283a2.footerEl = null),
      (_0x1283a2._placeholderEl = { style: {}, querySelector: () => null }),
      (_0x1283a2._root = createElementStub()),
      (_0x1283a2._normalizeDreaminaNodeData = (_0x11d0d8) => _0x11d0d8),
      (_0x1283a2._isRunninghubWorkflowModel = () => false),
      (_0x1283a2._isDreaminaVideoNode = () => false),
      (_0x1283a2._getDreaminaEffectiveNodeData = (_0x4f598f) => _0x4f598f),
      (_0x1283a2._maybeResumeDreaminaTaskImpl = () => {}),
      (_0x1283a2._maybeResumeRunningHubTaskImpl = () => {}),
      (_0x1283a2._maybeResumeAsyncTaskImpl = () => {}),
      (_0x1283a2._syncPromptBoxSizeFromData = () => {}),
      (_0x1283a2._syncGenerationNodeHelpTip = () => {}),
      (_0x1283a2._renderRefBar = () => {}),
      (_0x1283a2._syncBtnIconState = () => {}),
      (_0x1283a2._setVideoOverlaysVisible = () => {}),
      (_0x1283a2._syncWorkflowDefaults = () => {}),
      (_0x1283a2._enforceWorkflowAudioInputLimit = () => {}),
      (_0x1283a2._getCurrentWorkflow = () => ({ key: 'default' })),
      (_0x1283a2._refreshWorkflowUi = () => {}),
      (_0x1283a2._syncPickConnectVisualState = () => {}),
      (_0x1283a2._updateSubmitButtonState = () => {}));
    let _0x122707 = 0;
    ((_0x1283a2._loadAndDisplayVideo = () => {
      _0x122707 += 1;
    }),
      _0x1283a2.update(_0x37baca),
      assert.equal(_0x122707, 1));
    const _0x395c03 = { ..._0x37baca, prompt: 'second prompt', _bizRev: 2 };
    (store.loadState({ nodes: { [_0x50df48]: _0x395c03 }, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } }),
      _0x1283a2.update(_0x395c03),
      assert.equal(_0x122707, 1));
    const _0x1079fe = {
      ..._0x395c03,
      videos: [{ localPath: 'output/final-b.mp4', videoWidth: 0x500, videoHeight: 0x2d0 }],
      _bizRev: 3,
    };
    (store.loadState({ nodes: { [_0x50df48]: _0x1079fe }, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } }),
      _0x1283a2.update(_0x1079fe),
      assert.equal(_0x122707, 2));
  }));
