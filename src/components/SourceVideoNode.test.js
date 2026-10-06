import test from 'node:test';
import assert from 'node:assert/strict';
import appStore from '../core/stores/appStore.js';
import { resetCanvasMediaSchedulerForTests } from '../modules/canvasMediaScheduler.js';
import { RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG } from '../core/rendererDeferredMedia.js';
import { watchVideoFramePresentation } from '../services/videoFramePresentation.js';
function installDomStubs() {
  if (!globalThis.window) globalThis.window = {};
  typeof globalThis.window.addEventListener !== 'function' && (globalThis.window.addEventListener = () => {});
  typeof globalThis.window.removeEventListener !== 'function' &&
    (globalThis.window.removeEventListener = () => {});
  typeof globalThis.window.showToast !== 'function' && (globalThis.window.showToast = () => {});
  typeof globalThis.window._triggerLocalCacheSave !== 'function' &&
    (globalThis.window._triggerLocalCacheSave = () => {});
  if (!globalThis.document) globalThis.document = {};
  (!globalThis.document.documentElement &&
    (globalThis.document.documentElement = { classList: { add() {}, remove() {} } }),
    typeof globalThis.document.addEventListener !== 'function' &&
      (globalThis.document.addEventListener = () => {}),
    typeof globalThis.document.removeEventListener !== 'function' &&
      (globalThis.document.removeEventListener = () => {}),
    typeof globalThis.document.getElementById !== 'function' &&
      (globalThis.document.getElementById = () => null),
    !globalThis.document.body && (globalThis.document.body = { appendChild() {}, removeChild() {} }),
    !globalThis.Node && (globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 }));
}
function resetStore(nodes = {}) {
  appStore.loadState({ nodes: nodes, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } });
}
function createFrameInterpolationNode(args = {}) {
  return {
    id: 'source-video-frame-rh',
    type: 'source-video',
    x: 0,
    y: 0,
    width: 320,
    height: 180,
    provider: 'runninghubwf',
    model: 'runninghub/2047784060881211393',
    rhTaskId: 'rh-frame-task',
    rhTaskStatus: 'running',
    rhTaskUseOpenapiQuery: true,
    name: '补帧视频 (处理中)',
    isGenerating: true,
    jobStatus: 'running',
    generationStartTime: 123,
    ...args,
  };
}
function createFakeClassList() {
  const map = new Set();
  return {
    add: (...list) => list.forEach((item) => map.add(item)),
    remove: (...list2) => list2.forEach((item2) => map.delete(item2)),
    contains: (value) => map.has(value),
    toggle(key, enabled) {
      const index = enabled === undefined ? !map.has(key) : !!enabled;
      if (index) map.add(key);
      else map.delete(key);
      return index;
    },
  };
}
function createFakeButton({
  html: html = '<svg data-original-keying></svg>',
  tooltip: tooltip = '抠像',
  aria: aria = '抠像',
} = {}) {
  const el = {},
    map2 = new Map([['aria-label', aria]]);
  return {
    innerHTML: html,
    dataset: { tooltip: tooltip },
    title: '',
    classList: createFakeClassList(),
    addEventListener(result, data) {
      el[result] = data;
    },
    getAttribute(options) {
      return map2.get(options) || '';
    },
    setAttribute(target, source) {
      map2.set(target, String(source));
    },
    removeAttribute(next) {
      map2.delete(next);
    },
    dispatchClick() {
      el.click?.({ preventDefault() {}, stopPropagation() {} });
    },
  };
}
function createFakeToolbar(current) {
  return {
    isConnected: true,
    addEventListener() {},
    querySelector(entry) {
      return entry === '.act-keying' ? current : null;
    },
  };
}
function createFakeVideoElement() {
  const map3 = new Map([['src', '']]);
  let record = 0;
  return {
    style: { display: '' },
    preload: 'auto',
    poster: '',
    src: '',
    currentSrc: '',
    paused: true,
    addEventListener() {},
    removeEventListener() {},
    getAttribute(payload) {
      return map3.get(payload) || '';
    },
    setAttribute(handle, state) {
      const config = String(state || '');
      map3.set(handle, config);
      if (handle === 'src') this.src = config;
      if (handle === 'poster') this.poster = config;
    },
    removeAttribute(scope) {
      map3.delete(scope);
      scope === 'src' && ((this.src = ''), (this.currentSrc = ''));
      if (scope === 'poster') this.poster = '';
    },
    load() {
      ((record += 1), (this.currentSrc = this.src));
    },
    pause() {
      this.paused = true;
    },
    get loadCalls() {
      return record;
    },
  };
}
function createFakeImageElement() {
  const map4 = new Map();
  return {
    src: '',
    classList: createFakeClassList(),
    setAttribute(input, output) {
      map4.set(String(input), String(output || ''));
      if (input === 'src') this.src = String(output || '');
    },
    removeAttribute(value2) {
      map4.delete(String(value2));
      if (value2 === 'src') this.src = '';
    },
    getAttribute(value3) {
      return map4.get(String(value3)) || '';
    },
  };
}
function createFakeLoadingCard() {
  return {
    classList: createFakeClassList(),
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    appendChild() {},
  };
}
// 目标版本用 videoFramePresentation(rVFC 呈现帧)门控「首帧是否就绪」，
// 夹具需提供真实的呈现帧信号，门控才会打开（否则断言会被反向钉死）。
function markVideoFramePresented(videoEl) {
  videoEl.isConnected = true;
  videoEl.videoWidth = 1920;
  videoEl.videoHeight = 1080;
  videoEl.requestVideoFrameCallback = (callback) => {
    callback(0, { mediaTime: 0, presentedFrames: 1, width: 1920, height: 1080 });
    return 1;
  };
  videoEl.cancelVideoFrameCallback = () => {};
  watchVideoFramePresentation(videoEl, () => {});
}
(test('SourceVideoNode: RunningHub 补帧恢复失败时同步失败标题', async () => {
  installDomStubs();
  const { SourceVideoNode: SourceVideoNode } = await import('./SourceVideoNode.js'),
    id = createFrameInterpolationNode();
  resetStore({ [id.id]: id });
  const value4 = Object.create(SourceVideoNode.prototype);
  (Object.assign(value4, {
    id: id.id,
    _data: id,
    _rhResumeAbortController: null,
    _rhResumeTaskId: '',
    _rhResumePromise: null,
  }),
    (value4._resumeRunningHubTaskPoller = async () => {
      throw new Error('官方任务失败');
    }),
    value4._maybeResumeRunningHubTask(),
    await value4._rhResumePromise);
  const error = appStore.getState().nodes[id.id];
  (assert.equal(error.name, '补帧视频 (失败)'),
    assert.equal(error.jobStatus, 'error'),
    assert.equal(error.isGenerating, false),
    assert.equal(error.rhTaskStatus, 'failed'),
    assert.equal(error.rhTaskRecovering, false),
    assert.equal(error.jobError, '官方任务失败'),
    assert.equal(error.videos?.[0]?.error, '官方任务失败'),
    assert.equal(error.mainVideoIndex, 0),
    resetStore());
}),
  test('SourceVideoNode: RunningHub 恢复轮询被卸载中止时保持可恢复状态', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode2 } = await import('./SourceVideoNode.js'),
      id2 = createFrameInterpolationNode({
        id: 'source-video-hd-recover-abort',
        model: 'runninghub/2047787809091620866',
        name: '高清视频 (处理中)',
        rhTaskId: 'rh-hd-recover-abort',
        rhTaskStatus: 'running',
        rhTaskUseOpenapiQuery: true,
      });
    resetStore({ [id2.id]: id2 });
    const value5 = Object.create(SourceVideoNode2.prototype);
    (Object.assign(value5, {
      id: id2.id,
      _data: id2,
      _rhResumeAbortController: null,
      _rhResumeTaskId: '',
      _rhResumePromise: null,
    }),
      (value5._resumeRunningHubTaskPoller = async (value6, value7, { signal: signal }) =>
        new Promise((value8, handler) => {
          if (signal.aborted) {
            handler(new Error('CANCELLED'));
            return;
          }
          signal.addEventListener('abort', () => handler(new Error('CANCELLED')), { once: true });
        })),
      value5._maybeResumeRunningHubTask());
    const value9 = value5._rhResumePromise;
    (value5._stopRunningHubRecovery(false), await value9);
    const error2 = appStore.getState().nodes[id2.id];
    (assert.equal(error2.name, '高清视频 (处理中)'),
      assert.equal(error2.jobStatus, 'running'),
      assert.equal(error2.isGenerating, true),
      assert.equal(error2.rhTaskStatus, 'running'),
      assert.equal(error2.rhTaskRecovering, false),
      resetStore());
  }),
  test('SourceVideoNode: async 恢复失败保留已有视频并写入错误结果', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode3 } = await import('./SourceVideoNode.js'),
      id3 = {
        id: 'source-video-async-failed',
        type: 'source-video',
        x: 0,
        y: 0,
        width: 320,
        height: 180,
        provider: 'apimart',
        model: 'apimart/seedance-1.5',
        asyncTaskId: 'async-video-task',
        asyncTaskStatus: 'running',
        asyncTaskProvider: 'apimart',
        asyncTaskKind: 'video',
        videoUrl: '/output/previous.mp4',
        thumbUrl: '/output/previous.jpg',
        outputText: '模型: APIMart 视频任务',
        isGenerating: true,
        jobStatus: 'running',
        generationStartTime: 123,
      };
    resetStore({ [id3.id]: id3 });
    const value10 = Object.create(SourceVideoNode3.prototype);
    (Object.assign(value10, {
      id: id3.id,
      _data: id3,
      _asyncResumeAbortController: null,
      _asyncResumeTaskId: '',
      _asyncResumePromise: null,
      _computeGenerationDuration: () => 654,
    }),
      (value10._resumeAsyncTaskPoller = async () => {
        throw new Error('异步视频恢复失败');
      }),
      value10._maybeResumeAsyncTask(),
      await value10._asyncResumePromise);
    const value11 = appStore.getState().nodes[id3.id];
    (assert.equal(value11.isGenerating, false),
      assert.equal(value11.jobStatus, 'error'),
      assert.equal(value11.jobError, '异步视频恢复失败'),
      assert.equal(value11.generationDuration, 654),
      assert.equal(value11.asyncTaskStatus, 'failed'),
      assert.equal(value11.asyncTaskRecovering, false),
      assert.equal(value11.videos?.[0]?.error, '异步视频恢复失败'),
      assert.equal(value11.mainVideoIndex, 0),
      assert.equal(value11.videoUrl, '/output/previous.mp4'),
      assert.equal(value11.thumbUrl, '/output/previous.jpg'),
      assert.match(value11.outputText, /恢复失败: 异步视频恢复失败/),
      resetStore());
  }),
  test('SourceVideoNode: async 恢复轮询被卸载中止时保持可恢复状态', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode4 } = await import('./SourceVideoNode.js'),
      id4 = {
        id: 'source-video-async-recover-abort',
        type: 'source-video',
        provider: 'apimart',
        model: 'apimart/seedance-1.5',
        asyncTaskId: 'async-video-recover-abort',
        asyncTaskStatus: 'running',
        asyncTaskProvider: 'apimart',
        asyncTaskKind: 'video',
        isGenerating: true,
        jobStatus: 'running',
        generationStartTime: 123,
      };
    resetStore({ [id4.id]: id4 });
    const value12 = Object.create(SourceVideoNode4.prototype);
    (Object.assign(value12, {
      id: id4.id,
      _data: id4,
      _asyncResumeAbortController: null,
      _asyncResumeTaskId: '',
      _asyncResumePromise: null,
    }),
      (value12._resumeAsyncTaskPoller = async (value13, value14, { signal: signal2 }) =>
        new Promise((value15, handler2) => {
          if (signal2.aborted) {
            handler2(new Error('CANCELLED'));
            return;
          }
          signal2.addEventListener('abort', () => handler2(new Error('CANCELLED')), { once: true });
        })),
      value12._maybeResumeAsyncTask());
    const value16 = value12._asyncResumePromise;
    (value12._stopAsyncRecovery(false), await value16);
    const value17 = appStore.getState().nodes[id4.id];
    (assert.equal(value17.jobStatus, 'running'),
      assert.equal(value17.isGenerating, true),
      assert.equal(value17.asyncTaskStatus, 'running'),
      assert.equal(value17.asyncTaskRecovering, false),
      resetStore());
  }),
  test('VideoKeyingController: 按结果节点取消只影响当前抠像任务', async () => {
    installDomStubs();
    const value18 = (await import('../modules/VideoKeyingController.js')).default,
      sourceNodeId = createFrameInterpolationNode({
        id: 'source-video-a',
        model: 'runninghub/video_matting',
      }),
      sourceNodeId2 = createFrameInterpolationNode({
        id: 'source-video-b',
        model: 'runninghub/video_matting',
      }),
      outId = createFrameInterpolationNode({
        id: 'source-video-matting-a',
        model: 'runninghub/video_matting',
        rhSourceNodeId: sourceNodeId.id,
        rhTaskId: 'task-a',
        rhTaskStatus: 'running',
        outputText: '模型: RH视频抠像\n状态: 处理中',
      }),
      outId2 = createFrameInterpolationNode({
        id: 'source-video-matting-b',
        model: 'runninghub/video_matting',
        rhSourceNodeId: sourceNodeId2.id,
        rhTaskId: 'task-b',
        rhTaskStatus: 'running',
        outputText: '模型: RH视频抠像\n状态: 处理中',
      });
    (resetStore({
      [sourceNodeId.id]: sourceNodeId,
      [sourceNodeId2.id]: sourceNodeId2,
      [outId.id]: outId,
      [outId2.id]: outId2,
    }),
      value18.__resetTaskRuntimeForTest?.());
    const value19 = await value18.cancelRunningKeyingTaskForNode(outId.id);
    (assert.equal(value19, true),
      assert.equal(appStore.getState().nodes[outId.id].rhTaskStatus, 'cancelled'),
      assert.equal(appStore.getState().nodes[outId2.id].rhTaskStatus, 'running'),
      resetStore());
  }),
  test('videoToolbar: 结果节点抠像按钮在任务中显示并触发取消', async () => {
    installDomStubs();
    const value20 = (await import('../modules/VideoKeyingController.js')).default,
      { bindVideoToolbarEvents: bindVideoToolbarEvents } = await import('./nodeToolbar/videoToolbar.js'),
      id5 = 'source-video-keying-source',
      id6 = 'source-video-keying-output';
    (resetStore({
      [id5]: createFrameInterpolationNode({ id: id5, model: 'runninghub/video_matting' }),
      [id6]: createFrameInterpolationNode({
        id: id6,
        model: 'runninghub/video_matting',
        rhSourceNodeId: id5,
        rhTaskId: 'task-keying',
        rhTaskStatus: 'running',
        outputText: '模型: RH视频抠像\n状态: 处理中',
      }),
    }),
      value20.__resetTaskRuntimeForTest?.());
    const el2 = createFakeButton(),
      fakeToolbar = createFakeToolbar(el2);
    (bindVideoToolbarEvents(fakeToolbar, { id: id6, type: 'source-video' }),
      assert.equal(el2.classList.contains('is-task-cancel'), true),
      assert.match(el2.innerHTML, /v2-task-cancel-spin/),
      assert.equal(el2.dataset.tooltip, '取消抠像任务'),
      el2.dispatchClick(),
      await new Promise((value21) => setTimeout(value21, 0)),
      assert.equal(el2.classList.contains('is-task-cancel'), false),
      assert.match(el2.innerHTML, /data-original-keying/),
      assert.equal(appStore.getState().nodes[id6].rhTaskStatus, 'cancelled'),
      resetStore());
  }),
  test('videoToolbar: 只靠 Store 中的抠像结果节点也显示取消态', async () => {
    installDomStubs();
    const value22 = (await import('../modules/VideoKeyingController.js')).default,
      { bindVideoToolbarEvents: bindVideoToolbarEvents2 } = await import('./nodeToolbar/videoToolbar.js'),
      id7 = 'source-video-store-keying-source',
      id8 = 'source-video-store-keying-output';
    (resetStore({
      [id7]: createFrameInterpolationNode({ id: id7, model: 'runninghub/video_matting' }),
      [id8]: createFrameInterpolationNode({
        id: id8,
        model: 'runninghub/video_matting',
        rhSourceNodeId: id7,
        rhTaskId: 'rh-keying-store-task',
        rhTaskStatus: 'running',
        isGenerating: true,
        outputText: '模型: RH视频抠像\n状态: 处理中',
      }),
    }),
      value22.__resetTaskRuntimeForTest?.());
    const el3 = createFakeButton(),
      fakeToolbar2 = createFakeToolbar(el3);
    (bindVideoToolbarEvents2(fakeToolbar2, { id: id8, type: 'source-video' }),
      assert.equal(el3.classList.contains('is-task-cancel'), true),
      assert.match(el3.innerHTML, /v2-task-cancel-spin/),
      assert.equal(el3.dataset.tooltip, '取消抠像任务'),
      el3._cleanupKeyingButtonState?.(),
      resetStore());
  }),
  test('videoToolbar: 抠像终态会压过 stale isGenerating', async () => {
    installDomStubs();
    const value23 = (await import('../modules/VideoKeyingController.js')).default,
      { bindVideoToolbarEvents: bindVideoToolbarEvents3 } = await import('./nodeToolbar/videoToolbar.js'),
      id9 = 'source-video-terminal-keying-source',
      id10 = 'source-video-terminal-keying-output';
    (resetStore({
      [id9]: createFrameInterpolationNode({ id: id9, model: 'runninghub/video_matting' }),
      [id10]: createFrameInterpolationNode({
        id: id10,
        model: 'runninghub/video_matting',
        rhSourceNodeId: id9,
        rhTaskId: 'rh-keying-terminal-task',
        rhTaskStatus: 'success',
        isGenerating: true,
        jobStatus: 'running',
        outputText: '模型: RH视频抠像\n状态: 完成',
      }),
    }),
      value23.__resetTaskRuntimeForTest?.());
    const el4 = createFakeButton(),
      fakeToolbar3 = createFakeToolbar(el4);
    (bindVideoToolbarEvents3(fakeToolbar3, { id: id10, type: 'source-video' }),
      assert.equal(el4.classList.contains('is-task-cancel'), false),
      assert.equal(el4.dataset.tooltip, '抠像'),
      el4._cleanupKeyingButtonState?.(),
      resetStore());
  }),
  test('SourceVideoNode: 无本地路径时使用 capturePreviewUrl', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode5 } = await import('./SourceVideoNode.js'),
      value24 = Object.create(SourceVideoNode5.prototype);
    (Object.assign(value24, {
      _data: {
        id: 'source-video-preview',
        type: 'source-video',
        capturePreviewUrl: 'blob:pending-video-preview',
      },
    }),
      assert.equal(value24._resolveVideoSrc(value24._data), 'blob:pending-video-preview'));
  }),
  test('SourceVideoNode: accepts electron local capture preview URL', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode6 } = await import('./SourceVideoNode.js'),
      value25 = Object.create(SourceVideoNode6.prototype);
    (Object.assign(value25, {
      _data: {
        id: 'source-video-electron-preview',
        type: 'source-video',
        capturePreviewUrl: 'aic-local-preview://preview/token/clip.mp4',
      },
    }),
      assert.equal(value25._resolveVideoSrc(value25._data), 'aic-local-preview://preview/token/clip.mp4'));
  }),
  test('SourceVideoNode: media task source ignores electron capture preview URL', async () => {
    installDomStubs();
    const {
        SourceVideoNode: SourceVideoNode7,
        resolveSourceVideoMediaTaskSrc: resolveSourceVideoMediaTaskSrc,
      } = await import('./SourceVideoNode.js'),
      value26 = Object.create(SourceVideoNode7.prototype);
    (Object.assign(value26, {
      _data: {
        id: 'source-video-task-source',
        type: 'source-video',
        originalLocalPath: 'data/assets/original/hash/source.mp4',
        capturePreviewUrl: 'aic-local-preview://preview/token/source.mp4',
      },
    }),
      assert.equal(resolveSourceVideoMediaTaskSrc(value26._data), 'data/assets/original/hash/source.mp4'),
      assert.equal(value26._resolveVideoSrc(value26._data), value26._data.capturePreviewUrl),
      assert.equal(value26._resolveVideoMetaSrc(value26._data), 'data/assets/original/hash/source.mp4'));
  }),
  test('SourceVideoNode: media task source rejects preview-only video', async () => {
    installDomStubs();
    const {
        SourceVideoNode: SourceVideoNode8,
        resolveSourceVideoMediaTaskSrc: resolveSourceVideoMediaTaskSrc2,
      } = await import('./SourceVideoNode.js'),
      value27 = Object.create(SourceVideoNode8.prototype);
    (Object.assign(value27, {
      _data: {
        id: 'source-video-preview-only-task-source',
        type: 'source-video',
        capturePreviewUrl: 'aic-local-preview://preview/token/source.mp4',
      },
    }),
      assert.equal(resolveSourceVideoMediaTaskSrc2(value27._data), ''),
      assert.equal(value27._resolveVideoSrc(value27._data), 'aic-local-preview://preview/token/source.mp4'),
      assert.equal(value27._resolveVideoMetaSrc(value27._data), ''));
  }),
  test('SourceVideoNode: mute preference persists in node data', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode9 } = await import('./SourceVideoNode.js'),
      value28 = globalThis.document.createElement;
    globalThis.document.createElement = () => ({ className: '' });
    const id11 = 'source-video-muted-preference';
    resetStore({ [id11]: { id: id11, type: 'source-video', videoMuted: false } });
    try {
      const _video = { muted: true },
        value29 = Object.create(SourceVideoNode9.prototype);
      (Object.assign(value29, {
        id: id11,
        _data: appStore.getState().nodes[id11],
        _video: _video,
        _iconMuted: { style: { display: '' } },
        _iconUnmuted: { style: { display: '' } },
      }),
        value29._syncMutedStateFromData(value29._data),
        assert.equal(value29._isMuted, false),
        assert.equal(_video.muted, false),
        assert.equal(value29._iconMuted.style.display, 'none'),
        assert.equal(value29._iconUnmuted.style.display, 'block'),
        value29._setMuted(true, { persist: true }));
      const value30 = appStore.getState().nodes[id11];
      (assert.equal(value30.videoMuted, true),
        assert.equal(_video.muted, true),
        assert.equal(value29._iconMuted.style.display, 'block'),
        assert.equal(value29._iconUnmuted.style.display, 'none'),
        assert.equal(new SourceVideoNode9(value30)._isMuted, true));
    } finally {
      (value28 === undefined
        ? delete globalThis.document.createElement
        : (globalThis.document.createElement = value28),
        resetStore());
    }
  }),
  test('SourceVideoNode: resolves poster from local poster path', async () => {
    installDomStubs();
    const { resolveSourceVideoPosterSrc: resolveSourceVideoPosterSrc } = await import('./SourceVideoNode.js');
    (assert.equal(
      resolveSourceVideoPosterSrc({ posterLocalPath: 'output/VideoThumbs/source-poster.jpg' }),
      '/output/VideoThumbs/source-poster.jpg',
    ),
      assert.equal(
        resolveSourceVideoPosterSrc({ posterLocalPath: 'C:/Users/example/source-poster.jpg' }),
        '',
      ),
      assert.equal(
        resolveSourceVideoPosterSrc({
          thumbUrl: 'https://example.invalid/remote-thumb.jpg',
          posterLocalPath: 'output/VideoThumbs/local-poster.jpg',
        }),
        '/output/VideoThumbs/local-poster.jpg',
      ),
      assert.equal(
        resolveSourceVideoPosterSrc({ posterUrl: 'https://example.invalid/remote-poster.jpg' }),
        '',
      ),
      assert.equal(
        resolveSourceVideoPosterSrc({
          mainVideoIndex: 0,
          posterLocalPath: 'output/VideoThumbs/second-poster.jpg',
          videos: [
            { posterLocalPath: 'output/VideoThumbs/first-poster.jpg' },
            { posterLocalPath: 'output/VideoThumbs/second-poster.jpg' },
          ],
        }),
        '/output/VideoThumbs/first-poster.jpg',
      ));
  }),
  test('SourceVideoNode: poster frame is populated before mount connection', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode10 } = await import('./SourceVideoNode.js'),
      _posterFrame = createFakeImageElement();
    _posterFrame.isConnected = false;
    const value31 = Object.create(SourceVideoNode10.prototype);
    (Object.assign(value31, { _video: null, _posterFrame: _posterFrame, _lastPosterSrc: '' }),
      value31._applyVideoPoster({ posterLocalPath: 'output/source-thumb.jpg' }),
      assert.equal(_posterFrame.src, '/output/source-thumb.jpg'),
      assert.equal(_posterFrame.classList.contains('is-visible'), true),
      assert.equal(value31._lastPosterSrc, '/output/source-thumb.jpg'));
  }),
  test('SourceVideoNode: poster-backed load does not create video element', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode11 } = await import('./SourceVideoNode.js'),
      _posterFrame2 = createFakeImageElement();
    let value32 = 0;
    const value33 = Object.create(SourceVideoNode11.prototype);
    (Object.assign(value33, {
      id: 'source-video-poster-no-video',
      _data: {
        id: 'source-video-poster-no-video',
        type: 'source-video',
        src: '/output/source.mp4',
        thumbUrl: '/output/source-thumb.jpg',
      },
      _video: null,
      _posterFrame: _posterFrame2,
      _card: createFakeLoadingCard(),
      _controls: { style: { opacity: '' } },
      _muteBtn: { style: { display: '' } },
      _centerIndicator: { style: { display: '' } },
      _indicatorInner: null,
      _hint: { style: { display: '' } },
      _timeTotal: { textContent: '' },
      _uploadBtn: { disabled: false },
      _activeCapturePreviewUrl: '',
      _lastPosterSrc: '',
      _ensureVideoElement() {
        return ((value32 += 1), createFakeVideoElement());
      },
    }),
      value33._loadVideo('/output/source.mp4'),
      assert.equal(value33._currentSrc, '/output/source.mp4'),
      assert.equal(value33._video, null),
      assert.equal(value32, 0),
      assert.equal(_posterFrame2.src, '/output/source-thumb.jpg'),
      assert.equal(_posterFrame2.classList.contains('is-visible'), true),
      assert.equal(value33._controls.style.opacity, '0'),
      assert.equal(value33._muteBtn.style.display, 'none'));
  }),
  test('SourceVideoNode: poster-backed video defers media load until needed', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode12 } = await import('./SourceVideoNode.js'),
      _video2 = createFakeVideoElement(),
      _posterFrame3 = createFakeImageElement();
    _video2.duration = 7;
    const value34 = Object.create(SourceVideoNode12.prototype);
    (Object.assign(value34, {
      id: 'source-video-lazy-poster',
      _data: {
        id: 'source-video-lazy-poster',
        type: 'source-video',
        src: '/output/source.mp4',
        thumbUrl: '/output/source-thumb.jpg',
      },
      _video: _video2,
      _posterFrame: _posterFrame3,
      _card: createFakeLoadingCard(),
      _controls: { style: { opacity: '' } },
      _muteBtn: { style: { display: '' } },
      _centerIndicator: { style: { display: '' } },
      _indicatorInner: null,
      _hint: { style: { display: '' } },
      _timeTotal: { textContent: '' },
      _uploadBtn: { disabled: false },
      _activeCapturePreviewUrl: '',
      _lastPosterSrc: '',
    }),
      value34._loadVideo('/output/source.mp4'),
      assert.equal(value34._currentSrc, '/output/source.mp4'),
      assert.equal(_video2.poster, '/output/source-thumb.jpg'),
      assert.equal(_posterFrame3.src, '/output/source-thumb.jpg'),
      assert.equal(_posterFrame3.classList.contains('is-visible'), true),
      assert.equal(_video2.preload, 'none'),
      assert.equal(_video2.src, ''),
      assert.equal(_video2.currentSrc, ''),
      assert.equal(_video2.loadCalls, 0),
      assert.equal(_video2.style.opacity, ''),
      assert.equal(_video2.style.visibility, ''),
      assert.equal(value34._timeTotal.textContent, '0:07'),
      assert.equal(value34._controls.style.opacity, '0'),
      assert.equal(value34._muteBtn.style.display, 'none'));
    const value35 = _video2.loadCalls;
    (assert.equal(await value34._ensurePlaybackVideoSrc(), true),
      assert.equal(_video2.preload, 'metadata'),
      assert.equal(_video2.src, '/output/source.mp4'),
      assert.equal(_video2.loadCalls, value35 + 1),
      assert.equal(await value34._ensurePlaybackVideoSrc({ forPlayback: true }), true),
      assert.equal(_video2.preload, 'auto'),
      assert.equal(_video2.src, '/output/source.mp4'),
      assert.equal(_video2.loadCalls, value35 + 1));
  }),
  test('SourceVideoNode: renderer-deferred media waits for hydration', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode13 } = await import('./SourceVideoNode.js'),
      _video3 = createFakeVideoElement(),
      _posterFrame4 = createFakeImageElement(),
      value36 = Object.create(SourceVideoNode13.prototype);
    (Object.assign(value36, {
      id: 'source-video-defer-media',
      _data: {
        id: 'source-video-defer-media',
        type: 'source-video',
        src: '/output/source.mp4',
        posterLocalPath: 'output/source-thumb.jpg',
        [RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG]: true,
      },
      _video: _video3,
      _posterFrame: _posterFrame4,
      _card: createFakeLoadingCard(),
      _controls: { style: { opacity: '' } },
      _muteBtn: { style: { display: '' } },
      _centerIndicator: { style: { display: '' } },
      _indicatorInner: null,
      _hint: { style: { display: '' } },
      _timeTotal: { textContent: '' },
      _uploadBtn: { disabled: false },
      _activeCapturePreviewUrl: '',
      _lastPosterSrc: '',
      _rendererMediaDeferred: true,
    }),
      value36._loadVideo('/output/source.mp4'),
      assert.equal(value36._currentSrc, '/output/source.mp4'),
      assert.equal(_video3.poster, '/output/source-thumb.jpg'),
      assert.equal(_posterFrame4.src, '/output/source-thumb.jpg'),
      assert.equal(_video3.src, ''),
      value36.hydrateDeferredMedia(),
      assert.equal(_video3.poster, '/output/source-thumb.jpg'),
      assert.equal(_posterFrame4.src, '/output/source-thumb.jpg'),
      assert.equal(value36._rendererMediaDeferred, false),
      assert.equal(_posterFrame4.classList.contains('is-visible'), true),
      assert.equal(_video3.style.opacity, ''),
      assert.equal(_video3.style.visibility, ''));
  }),
  test('SourceVideoNode: deferred update keeps video source empty until hydration', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode14 } = await import('./SourceVideoNode.js'),
      id12 = 'source-video-defer-update',
      _data = {
        id: id12,
        type: 'source-video',
        src: '/output/source.mp4',
        posterLocalPath: 'output/source-thumb.jpg',
        [RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG]: true,
      };
    resetStore({ [id12]: _data });
    const _video4 = createFakeVideoElement(),
      _posterFrame5 = createFakeImageElement();
    let value37 = 0;
    const value38 = Object.create(SourceVideoNode14.prototype);
    (Object.assign(value38, {
      id: id12,
      _data: _data,
      _video: _video4,
      _posterFrame: _posterFrame5,
      _card: createFakeLoadingCard(),
      _controls: { style: { opacity: '' } },
      _muteBtn: { style: { display: '' } },
      _centerIndicator: { style: { display: '' } },
      _indicatorInner: null,
      _hint: { style: { display: '' } },
      _timeTotal: { textContent: '' },
      _uploadBtn: { disabled: false },
      _activeCapturePreviewUrl: '',
      _lastPosterSrc: '',
      _rendererMediaDeferred: true,
      _syncRunningHubVideoTaskState: () => false,
      _clearResolvedVideoTimer: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeAsyncTask: () => {},
      _maybeFetchVideoMeta: () => {
        value37 += 1;
      },
    }),
      value38.update({ ..._data, name: 'Deferred source video' }),
      assert.equal(value38._currentSrc, '/output/source.mp4'),
      assert.equal(_video4.preload, 'none'),
      assert.equal(_video4.src, ''),
      assert.equal(_video4.loadCalls, 0),
      assert.equal(_video4.poster, '/output/source-thumb.jpg'),
      assert.equal(_posterFrame5.src, '/output/source-thumb.jpg'),
      assert.equal(value37, 0),
      value38.hydrateDeferredMedia(),
      assert.equal(value38._rendererMediaDeferred, false),
      assert.equal(value37, 0),
      resetStore());
  }),
  test('SourceVideoNode: poster refresh preserves already loaded matching video source', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode15 } = await import('./SourceVideoNode.js'),
      _video5 = createFakeVideoElement(),
      _posterFrame6 = createFakeImageElement();
    ((_video5.src = '/output/source.mp4'), (_video5.currentSrc = '/output/source.mp4'));
    const value39 = Object.create(SourceVideoNode15.prototype);
    Object.assign(value39, {
      id: 'source-video-preserve-loaded',
      _data: {
        id: 'source-video-preserve-loaded',
        type: 'source-video',
        src: '/output/source.mp4',
        posterLocalPath: 'output/source-thumb.jpg',
      },
      _video: _video5,
      _posterFrame: _posterFrame6,
      _card: createFakeLoadingCard(),
      _controls: { style: { opacity: '' } },
      _muteBtn: { style: { display: '' } },
      _centerIndicator: { style: { display: '' } },
      _indicatorInner: null,
      _hint: { style: { display: '' } },
      _timeTotal: { textContent: '' },
      _uploadBtn: { disabled: false },
      _activeCapturePreviewUrl: '',
      _lastPosterSrc: '',
    });
    const value40 = _video5.loadCalls;
    (value39._loadVideo('/output/source.mp4'),
      assert.equal(value39._currentSrc, '/output/source.mp4'),
      assert.equal(_video5.src, '/output/source.mp4'),
      assert.equal(_video5.currentSrc, '/output/source.mp4'),
      assert.equal(_video5.loadCalls, value40),
      assert.equal(_video5.poster, '/output/source-thumb.jpg'),
      assert.equal(_posterFrame6.classList.contains('is-visible'), true));
  }),
  test('SourceVideoNode: poster frame swaps only after the next poster decodes', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode16 } = await import('./SourceVideoNode.js'),
      value41 = Object.prototype.hasOwnProperty.call(globalThis, 'Image'),
      value42 = globalThis.Image,
      list3 = [];
    class value43 {
      constructor() {
        ((this.onload = null),
          (this.onerror = null),
          (this.naturalWidth = 320),
          (this.naturalHeight = 180));
      }
      set ['src'](src) {
        ((this._src = src), list3.push({ src: src, resolve: () => this.onload?.() }));
      }
      get ['src']() {
        return this._src || '';
      }
    }
    ((globalThis.Image = value43), resetCanvasMediaSchedulerForTests());
    try {
      const _video6 = createFakeVideoElement(),
        _posterFrame7 = createFakeImageElement();
      _posterFrame7.setAttribute('src', '/output/old-thumb.jpg');
      const value44 = Object.create(SourceVideoNode16.prototype);
      (Object.assign(value44, {
        _video: _video6,
        _posterFrame: _posterFrame7,
        _lastPosterSrc: '/output/old-thumb.jpg',
      }),
        value44._applyVideoPoster({ posterLocalPath: 'output/new-thumb.jpg' }),
        assert.equal(_video6.poster, '/output/new-thumb.jpg'),
        assert.equal(_posterFrame7.src, '/output/old-thumb.jpg'),
        assert.equal(_posterFrame7.classList.contains('is-visible'), true),
        assert.equal(list3[0]?.src, '/output/new-thumb.jpg'),
        list3.shift()?.resolve());
      for (let count = 0; count < 8; count += 1) await Promise.resolve();
      assert.equal(_posterFrame7.src, '/output/new-thumb.jpg');
    } finally {
      (resetCanvasMediaSchedulerForTests(), value41 ? (globalThis.Image = value42) : delete globalThis.Image);
    }
  }),
  test('SourceVideoNode: poster frame ignores stale decode after disconnect', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode17 } = await import('./SourceVideoNode.js'),
      value45 = Object.prototype.hasOwnProperty.call(globalThis, 'Image'),
      value46 = globalThis.Image,
      list4 = [];
    class value47 {
      constructor() {
        this.onload = null;
      }
      set ['src'](value48) {
        ((this._src = value48), list4.push({ resolve: () => this.onload?.() }));
      }
    }
    ((globalThis.Image = value47), resetCanvasMediaSchedulerForTests());
    try {
      const _posterFrame8 = createFakeImageElement();
      ((_posterFrame8.isConnected = false), _posterFrame8.setAttribute('src', '/output/old-thumb.jpg'));
      const value49 = Object.create(SourceVideoNode17.prototype);
      (Object.assign(value49, {
        _video: createFakeVideoElement(),
        _posterFrame: _posterFrame8,
        _lastPosterSrc: '/output/old-thumb.jpg',
      }),
        value49._applyVideoPoster({ posterLocalPath: 'output/new-thumb.jpg' }),
        list4.shift()?.resolve());
      for (let count2 = 0; count2 < 8; count2 += 1) await Promise.resolve();
      assert.equal(_posterFrame8.src, '/output/old-thumb.jpg');
    } finally {
      (resetCanvasMediaSchedulerForTests(), value45 ? (globalThis.Image = value46) : delete globalThis.Image);
    }
  }),
  test('SourceVideoNode: 播放首帧 ready 后立即隐藏低清封面层', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode18 } = await import('./SourceVideoNode.js'),
      _video7 = Object.assign(createFakeVideoElement(), {
        src: '/output/source.mp4',
        currentSrc: '/output/source.mp4',
      }),
      _posterFrame9 = createFakeImageElement(),
      value50 = Object.create(SourceVideoNode18.prototype);
    (Object.assign(value50, {
      _video: _video7,
      _posterFrame: _posterFrame9,
      _currentSrc: '/output/source.mp4',
      _lastPosterSrc: '/output/source-thumb.jpg',
    }),
      (_video7.readyState = 2),
      (_video7.currentTime = 0),
      (_video7.paused = true),
      value50._syncPosterFrameVisibility(),
      assert.equal(_posterFrame9.classList.contains('is-visible'), true),
      assert.equal(_video7.style.opacity, '0'),
      assert.equal(_video7.style.visibility, 'hidden'),
      (_video7.paused = false),
      // 目标版本改为按「真实呈现帧」(rVFC) 判定首帧就绪，夹具需喂该信号门控才打开。
      markVideoFramePresented(_video7),
      value50._syncPosterFrameVisibility(),
      assert.equal(_posterFrame9.classList.contains('is-visible'), false),
      assert.equal(_video7.style.opacity, '1'),
      assert.equal(_video7.style.visibility, 'visible'));
  }),
  test('SourceVideoNode: paused video at first frame keeps poster fallback visible', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode19 } = await import('./SourceVideoNode.js'),
      _video8 = Object.assign(createFakeVideoElement(), {
        src: '/output/source.mp4',
        currentSrc: '/output/source.mp4',
      }),
      _posterFrame10 = createFakeImageElement(),
      value51 = Object.create(SourceVideoNode19.prototype);
    (Object.assign(value51, {
      _video: _video8,
      _posterFrame: _posterFrame10,
      _currentSrc: '/output/source.mp4',
      _lastPosterSrc: '/output/source-thumb.jpg',
    }),
      (_video8.readyState = 2),
      (_video8.currentTime = 0),
      (_video8.paused = true),
      value51._syncPosterFrameVisibility(),
      assert.equal(_posterFrame10.classList.contains('is-visible'), true),
      assert.equal(_video8.style.opacity, '0'),
      assert.equal(_video8.style.visibility, 'hidden'),
      (_video8.currentTime = 0.2),
      // 同上：目标版本用呈现帧(rVFC)判定就绪，补喂呈现信号后才验证封面被隐藏。
      markVideoFramePresented(_video8),
      value51._syncPosterFrameVisibility(),
      assert.equal(_posterFrame10.classList.contains('is-visible'), false),
      assert.equal(_video8.style.opacity, '1'),
      assert.equal(_video8.style.visibility, 'visible'));
  }),
  test('SourceVideoNode: desktop video thumb extraction waits for idle', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode20 } = await import('./SourceVideoNode.js'),
      value52 = globalThis.window.electronAPI,
      value53 = globalThis.window.requestIdleCallback,
      value54 = globalThis.window.cancelIdleCallback;
    let run = null;
    ((globalThis.window.electronAPI = {}),
      (globalThis.window.requestIdleCallback = (value55) => {
        return ((run = value55), 11);
      }),
      (globalThis.window.cancelIdleCallback = () => {}));
    try {
      const _video9 = createFakeVideoElement();
      let value56 = 0;
      const value57 = Object.create(SourceVideoNode20.prototype);
      (Object.assign(value57, {
        id: 'source-video-idle-thumb',
        _data: { id: 'source-video-idle-thumb', type: 'source-video', src: '/output/source.mp4' },
        _video: _video9,
        _posterFrame: createFakeImageElement(),
        _card: createFakeLoadingCard(),
        _controls: { style: { opacity: '' } },
        _muteBtn: { style: { display: '' } },
        _centerIndicator: { style: { display: '' } },
        _hint: { style: { display: '' } },
        _uploadBtn: { disabled: false },
        _activeCapturePreviewUrl: '',
        _lastPosterSrc: '',
        _idleVideoThumbCancel: null,
        _setManualLoopPlayback() {},
        _showPausedCenterIndicator() {},
        _attachPlaybackRecovery() {},
        _maybeEnsureVideoThumb() {
          value56 += 1;
        },
      }),
        value57._loadVideo('/output/source.mp4'),
        assert.equal(value56, 0),
        assert.equal(typeof run, 'function'),
        assert.equal(_video9.preload, 'none'),
        assert.equal(_video9.src, ''),
        run(),
        assert.equal(value56, 1));
    } finally {
      (value52 === undefined
        ? delete globalThis.window.electronAPI
        : (globalThis.window.electronAPI = value52),
        value53 === undefined
          ? delete globalThis.window.requestIdleCallback
          : (globalThis.window.requestIdleCallback = value53),
        value54 === undefined
          ? delete globalThis.window.cancelIdleCallback
          : (globalThis.window.cancelIdleCallback = value54));
    }
  }),
  test('SourceVideoNode: no-poster video handles immediate loadeddata during load', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode21 } = await import('./SourceVideoNode.js'),
      _video10 = createFakeVideoElement();
    _video10.readyState = 0;
    let value58 = 0,
      value59 = false;
    const value60 = Object.create(SourceVideoNode21.prototype);
    (Object.assign(value60, {
      id: 'source-video-cut-load',
      _data: { id: 'source-video-cut-load', type: 'source-video', src: '/output/CutVideo/cut.mp4' },
      _video: _video10,
      _card: createFakeLoadingCard(),
      _controls: { style: { opacity: '' } },
      _muteBtn: { style: { display: '' } },
      _centerIndicator: { style: { display: '' } },
      _indicatorInner: null,
      _hint: { style: { display: '' } },
      _uploadBtn: { disabled: false },
      _activeCapturePreviewUrl: '',
      _lastPosterSrc: '',
      _attachPlaybackRecovery() {},
      _clearMediaUnavailableAfterPlayback() {},
      _maybeEnsureVideoThumb() {
        value58 += 1;
      },
      _showPausedCenterIndicator() {
        value59 = true;
      },
    }),
      value60._loadVideo('/output/CutVideo/cut.mp4'),
      // 目标版本把媒体加载改为延迟模型（preload='none'，不再同步调用 load()），
      // 夹具需主动触发 loadeddata 信号，才能验证 run5 处理器（确保缩略图）确被执行。
      (_video10.readyState = 2),
      _video10.onloadeddata?.(),
      assert.equal(_video10.preload, 'none'),
      assert.equal(_video10.src, ''),
      assert.equal(value60._controls.style.opacity, '0'),
      assert.equal(value60._muteBtn.style.display, 'none'),
      assert.equal(value60._centerIndicator.style.display, 'none'),
      assert.equal(value59, false),
      assert.equal(value58, 1));
  }),
  test('SourceVideoNode: switching to final poster source releases capture preview', async () => {
    installDomStubs();
    const value61 = globalThis.window.URL,
      list5 = [];
    globalThis.window.URL = {
      revokeObjectURL(value62) {
        list5.push(value62);
      },
    };
    const { SourceVideoNode: SourceVideoNode22 } = await import('./SourceVideoNode.js'),
      _video11 = createFakeVideoElement(),
      value63 = Object.create(SourceVideoNode22.prototype);
    Object.assign(value63, {
      id: 'source-video-release-preview',
      _data: {
        id: 'source-video-release-preview',
        type: 'source-video',
        src: '/output/source.mp4',
        thumbUrl: '/output/source-thumb.jpg',
        capturePreviewUrl: 'blob:pending-video-preview',
      },
      _video: _video11,
      _card: createFakeLoadingCard(),
      _controls: { style: { opacity: '' } },
      _muteBtn: { style: { display: '' } },
      _centerIndicator: { style: { display: '' } },
      _indicatorInner: null,
      _hint: { style: { display: '' } },
      _uploadBtn: { disabled: false },
      _activeCapturePreviewUrl: 'blob:pending-video-preview',
      _lastPosterSrc: '',
    });
    try {
      (value63._loadVideo('/output/source.mp4'),
        assert.deepEqual(list5, ['blob:pending-video-preview']),
        assert.equal(value63._activeCapturePreviewUrl, ''),
        assert.equal(_video11.poster, '/output/source-thumb.jpg'));
    } finally {
      globalThis.window.URL = value61;
    }
  }),
  test('SourceVideoNode: 正式视频路径优先于 capturePreviewUrl', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode23 } = await import('./SourceVideoNode.js'),
      value64 = Object.create(SourceVideoNode23.prototype);
    (Object.assign(value64, {
      _data: {
        id: 'source-video-final',
        type: 'source-video',
        localPath: 'output/final.mp4',
        capturePreviewUrl: 'blob:pending-video-preview',
      },
    }),
      assert.equal(value64._resolveVideoSrc(value64._data), '/output/final.mp4'));
  }),
  test('SourceVideoNode: loaded playback clears stale media unavailable marker', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode24 } = await import('./SourceVideoNode.js'),
      id13 = {
        id: 'source-video-keyed-loaded',
        type: 'source-video',
        localPath: 'output/keyed.mp4',
        videoUrl: '/output/keyed.mp4',
        mediaUnavailable: true,
        mediaUnavailableSource: 'output/keyed.mp4',
      };
    resetStore({ [id13.id]: id13 });
    const value65 = Object.create(SourceVideoNode24.prototype);
    (Object.assign(value65, { id: id13.id, _data: id13 }),
      value65._clearMediaUnavailableAfterPlayback('/output/keyed.mp4'));
    const value66 = appStore.getState().nodes[id13.id];
    (assert.equal(value66.mediaUnavailable, false), assert.equal(value66.mediaUnavailableSource, ''));
  }),
  test('SourceVideoNode: Alt 播放按钮进入手动循环，停止时退出循环', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode25 } = await import('./SourceVideoNode.js'),
      list6 = [],
      _video12 = {
        paused: true,
        loop: false,
        currentTime: 0,
        duration: 12,
        pause() {
          this.paused = true;
        },
      },
      value67 = Object.create(SourceVideoNode25.prototype);
    (Object.assign(value67, {
      id: 'source-video-loop-playback',
      _data: { id: 'source-video-loop-playback', type: 'source-video' },
      _video: _video12,
      _currentSrc: '/output/source-loop.mp4',
      _isManualControl: false,
      _hoverManualPause: false,
      _isManualLoopPlayback: false,
      _autoPlayToken: 0,
      _flashCenterIndicator(value68) {
        list6.push(value68);
      },
      _playVideoWithRecovery: async () => {
        return ((_video12.paused = false), true);
      },
    }),
      value67._toggleManualPlayback({ loop: true }),
      await Promise.resolve(),
      assert.equal(value67._isManualLoopPlayback, true),
      assert.equal(value67._isManualControl, true),
      assert.equal(_video12.loop, true),
      assert.deepEqual(list6, ['play']),
      (list6.length = 0),
      value67._toggleManualPlayback(),
      assert.equal(value67._isManualLoopPlayback, false),
      assert.equal(_video12.loop, false),
      assert.equal(_video12.paused, true),
      assert.equal(value67._hoverManualPause, true),
      assert.deepEqual(list6, ['pause']));
  }),
  test('SourceVideoNode: manual playback lazily creates video element', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode26 } = await import('./SourceVideoNode.js'),
      fakeVideoElement = createFakeVideoElement();
    fakeVideoElement.duration = 8;
    let value69 = 0,
      value70 = 0;
    const value71 = Object.create(SourceVideoNode26.prototype);
    (Object.assign(value71, {
      id: 'source-video-lazy-manual-play',
      _data: { id: 'source-video-lazy-manual-play', type: 'source-video' },
      _video: null,
      _currentSrc: '/output/source-lazy.mp4',
      _isManualControl: false,
      _hoverManualPause: false,
      _isManualLoopPlayback: false,
      _autoPlayToken: 0,
      _ensureVideoElement() {
        return ((value69 += 1), (this._video = fakeVideoElement), fakeVideoElement);
      },
      _playVideoWithRecovery() {
        return ((value70 += 1), Promise.resolve(true));
      },
      _flashCenterIndicator() {},
    }),
      value71._toggleManualPlayback(),
      await Promise.resolve(),
      assert.equal(value69, 1),
      assert.equal(value70, 1),
      assert.equal(value71._video, fakeVideoElement),
      assert.equal(value71._isManualControl, true));
  }),
  test('SourceVideoNode: manual click keeps fresh hover playback instead of pausing', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode27 } = await import('./SourceVideoNode.js'),
      _video13 = {
        paused: false,
        loop: false,
        currentTime: 0,
        duration: 12,
        pause() {
          this.paused = true;
        },
      };
    let value72 = 0;
    const value73 = Object.create(SourceVideoNode27.prototype);
    (Object.assign(value73, {
      id: 'source-video-hover-click',
      _data: { id: 'source-video-hover-click', type: 'source-video' },
      _video: _video13,
      _currentSrc: '/output/source-hover.mp4',
      _isHovered: true,
      _isManualControl: false,
      _hoverManualPause: false,
      _isManualLoopPlayback: false,
      _autoPlayToken: 0,
      _flashCenterIndicator() {},
      _playVideoWithRecovery: async () => {
        return ((value72 += 1), (_video13.paused = false), true);
      },
    }),
      assert.equal(value73._shouldKeepHoverPlaybackOnManualClick(), true),
      value73._toggleManualPlayback({ forcePlay: true }),
      await Promise.resolve(),
      assert.equal(_video13.paused, false),
      assert.equal(value73._hoverManualPause, false),
      assert.equal(value73._isManualControl, true),
      assert.equal(value72, 1));
  }),
  test('SourceVideoNode: upload size patch preserves landscape ratio', async () => {
    installDomStubs();
    const { buildSourceVideoUploadSizePatch: buildSourceVideoUploadSizePatch } =
      await import('./SourceVideoNode.js');
    assert.deepEqual(buildSourceVideoUploadSizePatch({ width: 1920, height: 1080 }), {
      width: 512,
      height: 288,
      videoWidth: 1920,
      videoHeight: 1080,
      needsAutoResize: false,
    });
  }),
  test('SourceVideoNode: upload size patch preserves portrait ratio', async () => {
    installDomStubs();
    const { buildSourceVideoUploadSizePatch: buildSourceVideoUploadSizePatch2 } =
      await import('./SourceVideoNode.js');
    assert.deepEqual(buildSourceVideoUploadSizePatch2({ width: 1080, height: 1920 }), {
      width: 288,
      height: 512,
      videoWidth: 1080,
      videoHeight: 1920,
      needsAutoResize: false,
    });
  }),
  test('SourceVideoNode: upload size patch waits for auto resize when metadata is missing', async () => {
    installDomStubs();
    const { buildSourceVideoUploadSizePatch: buildSourceVideoUploadSizePatch3 } =
      await import('./SourceVideoNode.js');
    assert.deepEqual(buildSourceVideoUploadSizePatch3({ width: 0, height: 0 }), { needsAutoResize: true });
  }),
  test('SourceVideoNode: upload starts after preview paint without waiting for metadata', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode28 } = await import('./SourceVideoNode.js'),
      value74 = globalThis.window,
      id14 = 'source-video-upload-order',
      list7 = [],
      value75 = { name: 'clip.mp4', type: 'video/mp4' };
    let value76 = false,
      handler4 = null;
    const cloneNode = () => ({ cloneNode: cloneNode }),
      _card = {
        classList: {
          add(...list8) {
            list7.push('loading:' + list8.join(','));
          },
          remove() {},
          contains(value77) {
            return value77 === 'img-preview-loading';
          },
        },
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return [];
        },
        appendChild() {},
      };
    (appStore.loadState({
      nodes: {
        [id14]: {
          id: id14,
          type: 'source-video',
          x: 0,
          y: 0,
          width: 512,
          height: 288,
          name: '视频',
        },
      },
      edges: {},
      viewport: { x: 0, y: 0, zoom: 1 },
    }),
      (globalThis.window = {
        ...(value74 || {}),
        currentProjectId: 'project-video',
        showToast() {},
        URL: {
          createObjectURL(value78) {
            return (
              assert.equal(value78, value75),
              list7.push('preview-url'),
              'blob:source-video-upload-preview'
            );
          },
          revokeObjectURL() {},
        },
      }));
    const value79 = Object.create(SourceVideoNode28.prototype);
    Object.assign(value79, {
      id: id14,
      _data: { id: id14, type: 'source-video' },
      _card: _card,
      _video: { style: { display: 'block' } },
      _controls: { style: { opacity: '1' } },
      _uploadBtn: {
        childNodes: [{ cloneNode: cloneNode }],
        textContent: '上传',
        style: {},
        replaceChildren(...list9) {
          list7.push('restore:' + list9.length);
        },
      },
      _input: { value: 'selected' },
      _currentSrc: '',
      _loadVideo(value80) {
        (list7.push('load:' + value80), (this._currentSrc = value80));
      },
      _waitForUploadPaint: async () => {
        list7.push('paint');
      },
      _readUploadVideoNaturalSize: () => {
        return (
          list7.push('size:start'),
          new Promise((handler5) => {
            handler4 = (value81) => {
              ((value76 = true), list7.push('size:resolve'), handler5(value81));
            };
          })
        );
      },
      _uploadSourceVideoFile: async (value82, value83) => {
        return (
          list7.push('upload:start:' + value83 + ':sizeResolved=' + value76),
          {
            url: '/data/assets/original/clip.mp4',
            localPath: 'data/assets/original/clip.mp4',
            originalLocalPath: 'data/assets/original/clip.mp4',
            videoProxyStatus: 'not_required',
            filename: 'clip.mp4',
          }
        );
      },
    });
    try {
      const value84 = value79._handleUploadInputFile(value75);
      (await Promise.resolve(),
        await Promise.resolve(),
        assert.ok(list7.includes('loading:img-preview-loading')),
        assert.ok(list7.includes('loading:img-preview-loading--static')),
        assert.ok(list7.includes('load:blob:source-video-upload-preview')),
        assert.ok(list7.includes('paint')),
        assert.ok(list7.includes('upload:start:project-video:sizeResolved=false')),
        assert.equal(typeof handler4, 'function'),
        handler4({ width: 1920, height: 1080 }),
        await value84);
      const box = appStore.getState().nodes[id14];
      (assert.equal(box.localPath, 'data/assets/original/clip.mp4'),
        assert.equal(box.width, 512),
        assert.equal(box.height, 288),
        assert.equal(box.videoWidth, 1920),
        assert.equal(box.videoHeight, 1080),
        assert.equal(value79._input.value, ''),
        assert.ok(list7.includes('restore:1')));
    } finally {
      ((globalThis.window = value74),
        appStore.loadState({ nodes: {}, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } }));
    }
  }),
  test('SourceVideoNode: running RH task ignores inactive Dreamina done fields', async () => {
    installDomStubs();
    typeof globalThis.document.createElement !== 'function' &&
      (globalThis.document.createElement = () => ({ className: '', appendChild() {}, remove() {} }));
    const { SourceVideoNode: SourceVideoNode29 } = await import('./SourceVideoNode.js');
    let value85 = 0;
    const list10 = [],
      value86 = Object.create(SourceVideoNode29.prototype);
    (Object.assign(value86, {
      id: 'source-video-rh-running',
      _data: { id: 'source-video-rh-running', type: 'source-video' },
      _video: {},
      _card: {
        classList: {
          add(...args2) {
            list10.push(...args2);
          },
          remove() {},
        },
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return ((value85 += 1), []);
        },
        appendChild() {},
      },
      _hint: { style: { display: '' } },
      _uploadBtn: { disabled: false },
      _syncRunningHubVideoTaskState: () => false,
      _resolveVideoSrc: () => '',
      _loadVideo: () => {},
      _maybeFetchVideoMeta: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeAsyncTask: () => {},
    }),
      value86.update({
        id: 'source-video-rh-running',
        type: 'source-video',
        provider: 'runninghubwf',
        model: 'runninghub/2047784060881211393',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskStatus: 'pending',
        dreaminaTaskStatus: 'idle',
        dreaminaTaskPhase: 'done',
        asyncTaskStatus: 'idle',
      }),
      await new Promise((value87) => setTimeout(value87, 60)),
      assert.equal(value85, 0),
      assert.equal(value86._uploadBtn.disabled, true),
      assert.ok(list10.includes('img-preview-loading')));
  }),
  test('SourceVideoNode: update 不再清理陈旧计时器（改由渲染/水合路径清理）', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode30 } = await import('./SourceVideoNode.js'),
      id15 = 'source-video-stale-timer',
      _data2 = {
        id: id15,
        type: 'source-video',
        src: '/output/source.mp4',
        isGenerating: true,
        jobStatus: 'running',
        generationStartTime: 123,
        generationDuration: null,
      };
    resetStore({ [id15]: _data2 });
    const value88 = Object.create(SourceVideoNode30.prototype);
    (Object.assign(value88, {
      id: id15,
      _data: _data2,
      _video: { paused: true },
      _card: createFakeLoadingCard(),
      _hint: { style: { display: '' } },
      _uploadBtn: { disabled: true },
      _lastPosterSrc: '',
      _currentSrc: '/output/source.mp4',
      _syncRunningHubVideoTaskState: () => false,
      _resolveVideoSrc: () => '/output/source.mp4',
      _loadVideo: () => {},
      _maybeFetchVideoMeta: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeAsyncTask: () => {},
    }),
      value88.update(_data2));
    const value89 = appStore.getState().nodes[id15];
    // 目标版本 update() 不再调用 _clearResolvedVideoTimer（清理改由渲染 createDOM 与 hydrateDeferredDetails 负责），故此处陈旧计时器保持原样。
    (assert.equal(value89.generationStartTime, 123),
      assert.equal(Number.isFinite(Number(value89.generationDuration)), true),
      assert.equal(value89.isGenerating, true),
      resetStore());
  }),
  test('SourceVideoNode: active video task with existing result keeps running timer', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode31 } = await import('./SourceVideoNode.js'),
      id16 = 'source-video-active-task-timer',
      _data3 = {
        id: id16,
        type: 'source-video',
        videoUrl: '/output/previous.mp4',
        asyncTaskId: 'async-video-task',
        asyncTaskStatus: 'running',
        asyncTaskProvider: 'apimart',
        asyncTaskKind: 'video',
        isGenerating: true,
        jobStatus: 'running',
        generationStartTime: 123,
        generationDuration: null,
      };
    resetStore({ [id16]: _data3 });
    const value90 = Object.create(SourceVideoNode31.prototype);
    (Object.assign(value90, {
      id: id16,
      _data: _data3,
      _video: { paused: true },
      _card: createFakeLoadingCard(),
      _hint: { style: { display: '' } },
      _uploadBtn: { disabled: true },
      _lastPosterSrc: '',
      _currentSrc: '/output/previous.mp4',
      _syncRunningHubVideoTaskState: () => false,
      _resolveVideoSrc: () => '/output/previous.mp4',
      _loadVideo: () => {},
      _maybeFetchVideoMeta: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeAsyncTask: () => {},
    }),
      value90.update(_data3));
    const value91 = appStore.getState().nodes[id16];
    (assert.equal(value91.generationStartTime, 123),
      assert.equal(value91.generationDuration, null),
      assert.equal(value91.isGenerating, true),
      resetStore());
  }),
  test('SourceVideoNode: terminal failure stops loading over stale generating flag', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode32 } = await import('./SourceVideoNode.js');
    let value92 = 0;
    const value93 = Object.create(SourceVideoNode32.prototype);
    (Object.assign(value93, {
      id: 'source-video-stale-failed',
      _data: { id: 'source-video-stale-failed', type: 'source-video' },
      _video: {},
      _card: {
        classList: { add() {}, remove() {} },
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return ((value92 += 1), []);
        },
      },
      _hint: { style: { display: '' } },
      _uploadBtn: { disabled: true },
      _syncRunningHubVideoTaskState: () => false,
      _resolveVideoSrc: () => '',
      _loadVideo: () => {},
      _maybeFetchVideoMeta: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeAsyncTask: () => {},
    }),
      value93.update({
        id: 'source-video-stale-failed',
        type: 'source-video',
        provider: 'runninghubwf',
        model: 'runninghub/2047784060881211393',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskStatus: 'failed',
      }),
      assert.equal(value92, 1),
      assert.equal(value93._uploadBtn.disabled, false));
  }),
  test('SourceVideoNode: 旧失败补帧节点 update 时纠正处理中标题', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode33 } = await import('./SourceVideoNode.js'),
      id17 = createFrameInterpolationNode({
        rhTaskStatus: 'failed',
        name: '补帧视频 (处理中)',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskRecovering: true,
      });
    resetStore({ [id17.id]: id17 });
    const value94 = Object.create(SourceVideoNode33.prototype);
    (Object.assign(value94, { id: id17.id, _data: id17, _video: null }), value94.update(id17));
    const error3 = appStore.getState().nodes[id17.id];
    (assert.equal(error3.name, '补帧视频 (失败)'),
      assert.equal(error3.jobStatus, 'error'),
      assert.equal(error3.isGenerating, false),
      assert.equal(error3.rhTaskStatus, 'failed'),
      assert.equal(error3.rhTaskRecovering, false),
      resetStore());
  }),
  test('SourceVideoNode: RunningHub 高清失败时使用高清失败标题', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode34 } = await import('./SourceVideoNode.js'),
      id18 = createFrameInterpolationNode({
        id: 'source-video-hd-rh',
        rhTaskStatus: 'failed',
        name: '高清视频 (处理中)',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskRecovering: true,
      });
    resetStore({ [id18.id]: id18 });
    const value95 = Object.create(SourceVideoNode34.prototype);
    (Object.assign(value95, { id: id18.id, _data: id18, _video: null }), value95.update(id18));
    const error4 = appStore.getState().nodes[id18.id];
    (assert.equal(error4.name, '高清视频 (失败)'),
      assert.equal(error4.jobStatus, 'error'),
      assert.equal(error4.isGenerating, false),
      assert.equal(error4.rhTaskStatus, 'failed'),
      assert.equal(error4.rhTaskRecovering, false),
      resetStore());
  }),
  test('SourceVideoNode: RunningHub 成功终态会清掉处理中标题', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode35 } = await import('./SourceVideoNode.js'),
      id19 = createFrameInterpolationNode({
        rhTaskStatus: 'success',
        name: '补帧视频 (处理中)',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskRecovering: true,
      });
    resetStore({ [id19.id]: id19 });
    const value96 = Object.create(SourceVideoNode35.prototype);
    (Object.assign(value96, { id: id19.id, _data: id19, _video: null }), value96.update(id19));
    const error5 = appStore.getState().nodes[id19.id];
    (assert.equal(error5.name, '补帧视频'),
      assert.equal(error5.jobStatus, 'success'),
      assert.equal(error5.isGenerating, false),
      assert.equal(error5.rhTaskStatus, 'success'),
      assert.equal(error5.rhTaskRecovering, false),
      resetStore());
  }),
  test('SourceVideoNode: RunningHub 取消终态会修正补帧取消标题', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode36 } = await import('./SourceVideoNode.js'),
      id20 = createFrameInterpolationNode({
        rhTaskStatus: 'cancelled',
        name: '补帧视频 (处理中)',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskRecovering: true,
      });
    resetStore({ [id20.id]: id20 });
    const value97 = Object.create(SourceVideoNode36.prototype);
    (Object.assign(value97, { id: id20.id, _data: id20, _video: null }), value97.update(id20));
    const error6 = appStore.getState().nodes[id20.id];
    (assert.equal(error6.name, '补帧视频 (已取消)'),
      assert.equal(error6.jobStatus, null),
      assert.equal(error6.isGenerating, false),
      assert.equal(error6.rhTaskStatus, 'cancelled'),
      assert.equal(error6.rhTaskRecovering, false),
      resetStore());
  }),
  test('SourceVideoNode: RunningHub 视频擦除失败终态会修正生成中标题', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode37 } = await import('./SourceVideoNode.js'),
      id21 = createFrameInterpolationNode({
        id: 'source-video-erase-rh',
        model: 'runninghub/video_matting',
        rhTaskStatus: 'failed',
        name: '视频擦除生成中...',
        outputText: '模型: RH视频擦除\n状态: 处理中',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskRecovering: true,
      });
    resetStore({ [id21.id]: id21 });
    const value98 = Object.create(SourceVideoNode37.prototype);
    (Object.assign(value98, { id: id21.id, _data: id21, _video: null }), value98.update(id21));
    const error7 = appStore.getState().nodes[id21.id];
    (assert.equal(error7.name, '视频擦除失败'),
      assert.equal(error7.jobStatus, 'error'),
      assert.equal(error7.isGenerating, false),
      assert.equal(error7.rhTaskStatus, 'failed'),
      assert.equal(error7.rhTaskRecovering, false),
      resetStore());
  }),
  test('SourceVideoNode: RunningHub 终态不会覆盖用户自定义标题', async () => {
    installDomStubs();
    const { SourceVideoNode: SourceVideoNode38 } = await import('./SourceVideoNode.js'),
      id22 = createFrameInterpolationNode({
        rhTaskStatus: 'failed',
        name: '我的自定义补帧版本',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskRecovering: true,
      });
    resetStore({ [id22.id]: id22 });
    const value99 = Object.create(SourceVideoNode38.prototype);
    (Object.assign(value99, { id: id22.id, _data: id22, _video: null }), value99.update(id22));
    const error8 = appStore.getState().nodes[id22.id];
    (assert.equal(error8.name, '我的自定义补帧版本'),
      assert.equal(error8.jobStatus, 'error'),
      assert.equal(error8.isGenerating, false),
      assert.equal(error8.rhTaskStatus, 'failed'),
      resetStore());
  }));
