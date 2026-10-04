import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPreviewContainer as createFakePreviewContainer,
  installDomEnvironment as installPreviewDomStubs,
} from '../../tools/dom-test-environment.mjs';
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
  const map = new Set();
  return {
    disabled: false,
    title: '',
    innerHTML: '',
    style: {},
    dataset: {},
    classList: {
      add(...list) {
        list.forEach((item) => map.add(String(item || '')));
      },
      remove(...list2) {
        list2.forEach((item2) => map.delete(String(item2 || '')));
      },
      toggle(value, key) {
        const index = String(value || '');
        if (key === true) return (map.add(index), true);
        if (key === false) return (map.delete(index), false);
        if (map.has(index)) return (map.delete(index), false);
        return (map.add(index), true);
      },
      contains(result) {
        return map.has(String(result || ''));
      },
    },
    setAttribute(data, options) {
      this.dataset[String(data || '')] = String(options || '');
    },
    removeAttribute(target) {
      delete this.dataset[String(target || '')];
    },
  };
}
function createElementStub() {
  return { ...createButtonStub(), querySelectorAll: () => [] };
}
(test('AIGenVideoNode: renderer-deferred media skips video DOM until hydration', async () => {
  const id = 'node-video-deferred-media',
    source = {
      id: id,
      type: 'ai-video',
      model: 'apimart/seedance-test',
      provider: 'apimart',
      videos: [{ videoUrl: '/output/a.mp4', thumbUrl: '/output/a.jpg' }],
      [RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG]: true,
    };
  store.loadState({ nodes: { [id]: source }, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } });
  const aIGenVideoNode = new AIGenVideoNode(source);
  let next = null;
  ((aIGenVideoNode.previewEl = createFakePreviewContainer()),
    (aIGenVideoNode._placeholderEl = { style: {}, querySelector: () => null }),
    (aIGenVideoNode._setVideoOverlaysVisible = (current) => {
      next = current;
    }),
    await aIGenVideoNode._loadAndDisplayVideo(),
    assert.equal(aIGenVideoNode._deferredVideoViewRefreshPending, true),
    assert.equal(aIGenVideoNode._placeholderEl.style.display, 'none'),
    assert.equal(next, false),
    assert.equal(aIGenVideoNode._multiVideosContainer, null),
    assert.ok(String(aIGenVideoNode._deferredPosterImgEl?.src || '').includes('/output/a.jpg')));
  let entry = 0,
    record = 0;
  ((aIGenVideoNode._loadAndDisplayVideo = () => {
    entry += 1;
  }),
    (aIGenVideoNode._renderRefBar = () => {
      record += 1;
    }),
    (aIGenVideoNode._updateSubmitButtonState = () => {}),
    (aIGenVideoNode._renderRefBarPendingWhenVisible = true),
    aIGenVideoNode.hydrateDeferredMedia(),
    assert.equal(aIGenVideoNode._rendererMediaDeferred, false),
    assert.equal(entry, 1),
    assert.equal(record, 1));
}),
  test('AIGenVideoNode: running RH state keeps preview loading over previous result', async () => {
    const id2 = 'node-video-rh-existing-result-loading',
      args = {
        id: id2,
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
    store.loadState({ nodes: { [id2]: args }, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } });
    const aIGenVideoNode2 = new AIGenVideoNode(args);
    ((aIGenVideoNode2.previewEl = createFakePreviewContainer()),
      (aIGenVideoNode2.promptEl = { ...createElementStub(), innerHTML: '', innerText: '' }),
      (aIGenVideoNode2.btnEl = createButtonStub()),
      (aIGenVideoNode2.footerEl = null),
      (aIGenVideoNode2._placeholderEl = { style: {}, querySelector: () => null }),
      (aIGenVideoNode2._root = { querySelectorAll: () => [] }),
      (aIGenVideoNode2._normalizeDreaminaNodeData = (payload) => payload),
      (aIGenVideoNode2._isRunninghubWorkflowModel = () => true),
      (aIGenVideoNode2._loadAndDisplayVideo = () => {}),
      (aIGenVideoNode2._maybeResumeDreaminaTaskImpl = () => {}),
      (aIGenVideoNode2._maybeResumeRunningHubTaskImpl = () => {}),
      (aIGenVideoNode2._maybeResumeAsyncTaskImpl = () => {}),
      (aIGenVideoNode2._syncPromptBoxSizeFromData = () => {}),
      (aIGenVideoNode2._syncGenerationNodeHelpTip = () => {}),
      (aIGenVideoNode2._renderRefBar = () => {}),
      (aIGenVideoNode2._syncBtnIconState = () => {}),
      (aIGenVideoNode2._setVideoOverlaysVisible = () => {}),
      aIGenVideoNode2.update(args),
      await new Promise((handle) => setTimeout(handle, 70)),
      assert.equal(aIGenVideoNode2.previewEl.classList.contains('img-preview-loading'), true),
      assert.equal(!!aIGenVideoNode2.previewEl.querySelector('.img-loading-overlay'), true),
      assert.equal(aIGenVideoNode2.btnEl.classList.contains('is-task-cancel'), true),
      assert.match(aIGenVideoNode2.btnEl.innerHTML, /v2-task-cancel-spin/));
    const state = { ...args, isGenerating: true, jobStatus: 'error', rhTaskStatus: 'failed' };
    (store.loadState({ nodes: { [id2]: state }, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } }),
      aIGenVideoNode2.update(state),
      assert.equal(aIGenVideoNode2.btnEl.classList.contains('is-task-cancel'), false),
      assert.doesNotMatch(aIGenVideoNode2.btnEl.innerHTML, /v2-task-cancel-spin/));
  }),
  test('AIGenVideoNode: result videos clear inner no-result class', () => {
    const id3 = 'node-video-result-clears-no-result',
      args2 = {
        id: id3,
        type: 'ai-video',
        model: 'apimart/seedance-test',
        provider: 'apimart',
        videos: [],
      };
    store.loadState({ nodes: { [id3]: args2 }, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } });
    const aIGenVideoNode3 = new AIGenVideoNode(args2);
    ((aIGenVideoNode3.previewEl = createFakePreviewContainer()),
      (aIGenVideoNode3.promptEl = { innerHTML: '', innerText: '' }),
      (aIGenVideoNode3.btnEl = createButtonStub()),
      (aIGenVideoNode3.footerEl = null),
      (aIGenVideoNode3._placeholderEl = { style: {}, querySelector: () => null }),
      (aIGenVideoNode3._root = createElementStub()),
      aIGenVideoNode3._root.classList.add('no-result'),
      (aIGenVideoNode3._normalizeDreaminaNodeData = (config) => config),
      (aIGenVideoNode3._isRunninghubWorkflowModel = () => false),
      (aIGenVideoNode3._isDreaminaVideoNode = () => false),
      (aIGenVideoNode3._getDreaminaEffectiveNodeData = (scope) => scope),
      (aIGenVideoNode3._loadAndDisplayVideo = () => {}),
      (aIGenVideoNode3._maybeResumeDreaminaTaskImpl = () => {}),
      (aIGenVideoNode3._maybeResumeRunningHubTaskImpl = () => {}),
      (aIGenVideoNode3._maybeResumeAsyncTaskImpl = () => {}),
      (aIGenVideoNode3._syncPromptBoxSizeFromData = () => {}),
      (aIGenVideoNode3._syncGenerationNodeHelpTip = () => {}),
      (aIGenVideoNode3._renderRefBar = () => {}),
      (aIGenVideoNode3._syncBtnIconState = () => {}),
      (aIGenVideoNode3._setVideoOverlaysVisible = () => {}));
    const input = { ...args2, videos: [{ localPath: 'output/final.mp4' }] };
    (store.loadState({ nodes: { [id3]: input }, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } }),
      aIGenVideoNode3.update(input),
      assert.equal(aIGenVideoNode3._root.classList.contains('no-result'), false));
  }),
  test('AIGenVideoNode: adaptive ratio reacts to input order changes', async () => {
    const id4 = 'node-video-adaptive-order',
      output = {
        id: id4,
        type: 'ai-video',
        model: 'apimart/seedance-test',
        provider: 'apimart',
        aspectRatio: '自适应',
      },
      edgeA = { id: 'edgeA', sourceId: 'imageA', targetId: id4 },
      edgeB = { id: 'edgeB', sourceId: 'imageB', targetId: id4 };
    store.loadState({
      nodes: {
        [id4]: output,
        imageA: { id: 'imageA', type: 'source-image', width: 0x384, height: 0x640 },
        imageB: { id: 'imageB', type: 'source-image', width: 0x640, height: 0x384 },
      },
      edges: { edgeA: edgeA, edgeB: edgeB },
      viewport: { x: 0, y: 0, zoom: 1 },
    });
    const aIGenVideoNode4 = new AIGenVideoNode(output);
    ((aIGenVideoNode4.previewEl = createFakePreviewContainer()),
      (aIGenVideoNode4.promptEl = { ...createElementStub(), innerHTML: '', innerText: '' }),
      (aIGenVideoNode4.btnEl = createButtonStub()),
      (aIGenVideoNode4.footerEl = null),
      (aIGenVideoNode4._placeholderEl = { style: {}, querySelector: () => null }),
      (aIGenVideoNode4._root = { querySelectorAll: () => [] }),
      (aIGenVideoNode4._normalizeDreaminaNodeData = (value2) => value2),
      (aIGenVideoNode4._isRunninghubWorkflowModel = () => false),
      (aIGenVideoNode4._isDreaminaVideoNode = () => false),
      (aIGenVideoNode4._getDreaminaEffectiveNodeData = (value3) => value3),
      (aIGenVideoNode4._loadAndDisplayVideo = () => {}),
      (aIGenVideoNode4._maybeResumeDreaminaTaskImpl = () => {}),
      (aIGenVideoNode4._maybeResumeRunningHubTaskImpl = () => {}),
      (aIGenVideoNode4._maybeResumeAsyncTaskImpl = () => {}),
      (aIGenVideoNode4._syncPromptBoxSizeFromData = () => {}),
      (aIGenVideoNode4._syncGenerationNodeHelpTip = () => {}),
      (aIGenVideoNode4._renderRefBar = () => {}),
      (aIGenVideoNode4._syncBtnIconState = () => {}),
      (aIGenVideoNode4._setVideoOverlaysVisible = () => {}));
    let value4 = 0;
    ((aIGenVideoNode4._runAdaptiveRatio = () => {
      value4 += 1;
    }),
      aIGenVideoNode4.update(output),
      await new Promise((value5) => setTimeout(value5, 70)),
      assert.equal(value4, 0),
      store.updateEdgesBatch(['edgeA', 'edgeB'], [edgeB, edgeA]),
      aIGenVideoNode4.update(store.getState().nodes[id4]),
      await new Promise((value6) => setTimeout(value6, 70)),
      assert.equal(value4, 1));
  }),
  test('AIGenVideoNode: skips preview reload when only non-preview data changes', () => {
    const id5 = 'node-video-preview-sig',
      args3 = {
        id: id5,
        type: 'ai-video',
        model: 'apimart/seedance-test',
        provider: 'apimart',
        prompt: 'first prompt',
        videos: [{ localPath: 'output/final-a.mp4', videoWidth: 0x500, videoHeight: 0x2d0 }],
        _bizRev: 1,
      };
    store.loadState({ nodes: { [id5]: args3 }, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } });
    const aIGenVideoNode5 = new AIGenVideoNode(args3);
    ((aIGenVideoNode5.previewEl = createFakePreviewContainer()),
      (aIGenVideoNode5.promptEl = { ...createElementStub(), innerHTML: '', innerText: '' }),
      (aIGenVideoNode5.btnEl = createButtonStub()),
      (aIGenVideoNode5.footerEl = null),
      (aIGenVideoNode5._placeholderEl = { style: {}, querySelector: () => null }),
      (aIGenVideoNode5._root = createElementStub()),
      (aIGenVideoNode5._normalizeDreaminaNodeData = (value7) => value7),
      (aIGenVideoNode5._isRunninghubWorkflowModel = () => false),
      (aIGenVideoNode5._isDreaminaVideoNode = () => false),
      (aIGenVideoNode5._getDreaminaEffectiveNodeData = (value8) => value8),
      (aIGenVideoNode5._maybeResumeDreaminaTaskImpl = () => {}),
      (aIGenVideoNode5._maybeResumeRunningHubTaskImpl = () => {}),
      (aIGenVideoNode5._maybeResumeAsyncTaskImpl = () => {}),
      (aIGenVideoNode5._syncPromptBoxSizeFromData = () => {}),
      (aIGenVideoNode5._syncGenerationNodeHelpTip = () => {}),
      (aIGenVideoNode5._renderRefBar = () => {}),
      (aIGenVideoNode5._syncBtnIconState = () => {}),
      (aIGenVideoNode5._setVideoOverlaysVisible = () => {}),
      (aIGenVideoNode5._syncWorkflowDefaults = () => {}),
      (aIGenVideoNode5._enforceWorkflowAudioInputLimit = () => {}),
      (aIGenVideoNode5._getCurrentWorkflow = () => ({ key: 'default' })),
      (aIGenVideoNode5._refreshWorkflowUi = () => {}),
      (aIGenVideoNode5._syncPickConnectVisualState = () => {}),
      (aIGenVideoNode5._updateSubmitButtonState = () => {}));
    let value9 = 0;
    ((aIGenVideoNode5._loadAndDisplayVideo = () => {
      value9 += 1;
    }),
      aIGenVideoNode5.update(args3),
      assert.equal(value9, 1));
    const args4 = { ...args3, prompt: 'second prompt', _bizRev: 2 };
    (store.loadState({ nodes: { [id5]: args4 }, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } }),
      aIGenVideoNode5.update(args4),
      assert.equal(value9, 1));
    const value10 = {
      ...args4,
      videos: [{ localPath: 'output/final-b.mp4', videoWidth: 0x500, videoHeight: 0x2d0 }],
      _bizRev: 3,
    };
    (store.loadState({ nodes: { [id5]: value10 }, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } }),
      aIGenVideoNode5.update(value10),
      assert.equal(value9, 2));
  }));
