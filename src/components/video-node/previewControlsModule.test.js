import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVideoNodePreviewControlsModule } from './previewControlsModule.js';
import { setLocale } from '../../i18n/index.js';
async function flushAsyncSave() {
  (await Promise.resolve(), await Promise.resolve(), await new Promise((value) => setTimeout(value, 0)));
}
(test('previewControlsModule: capture frame adds preview node before async save', async () => {
  const item = globalThis.document,
    key = globalThis.window,
    index = globalThis.URL,
    list = [],
    list2 = [],
    args = {
      nodes: {
        videoNode: {
          id: 'videoNode',
          x: 100,
          y: 200,
          width: 300,
          height: 180,
          videoFps: 24,
          videoFrameCount: 48,
          videoDuration: 2,
        },
      },
    };
  let run;
  const result = new Promise((data) => {
    run = data;
  });
  ((globalThis.document = {
    createElement(options) {
      return (
        assert.equal(options, 'canvas'),
        {
          width: 0,
          height: 0,
          getContext(target) {
            return (assert.equal(target, '2d'), { drawImage() {} });
          },
          toBlob(handler, type) {
            handler(new Blob(['frame'], { type: type }));
          },
        }
      );
    },
  }),
    (globalThis.URL = {
      createObjectURL() {
        return 'blob:ai-video-frame';
      },
    }),
    (globalThis.window = { URL: globalThis.URL, showToast() {} }));
  const store = {
    getState() {
      return args;
    },
    getStateRaw() {
      return args;
    },
    addNode(source) {
      (list.push(source), (args.nodes[source.id] = source));
    },
    updateNodeData(id, patch) {
      (list2.push({ id: id, patch: patch }), (args.nodes[id] = { ...args.nodes[id], ...patch }));
    },
  };
  setLocale('en-US', { persist: false, notify: false });
  try {
    const videoNodePreviewControlsModule = createVideoNodePreviewControlsModule({
        store: store,
        saveOutputBlob: () => result,
        VideoKeyingController: null,
        getAutoMediaSizeByShortSide: () => ({ width: 160, height: 90 }),
        buildSourceMediaNodePayload: (args2) => ({
          localPath: '',
          originalLocalPath: '',
          displayLocalPath: '',
          thumbLocalPath: '',
          ...args2,
        }),
        calcSafeSpawnPosNearNode: () => ({ x: 120, y: 240 }),
      }),
      next = Object.create(videoNodePreviewControlsModule);
    ((next.nodeId = 'videoNode'),
      (next._getActivePreviewVideoEl = () => ({
        src: 'video.mp4',
        currentSrc: '',
        readyState: 2,
        videoWidth: 640,
        videoHeight: 360,
        currentTime: 0.5,
      })),
      (next._getActiveVideoDuration = () => 2),
      await next._captureCurrentFrameFromActiveVideo(),
      assert.equal(list.length, 1),
      assert.equal(list[0].type, 'source-image'),
      assert.equal(list[0].name, 'Captured frame 13'),
      assert.equal(list[0].capturePreviewUrl, 'blob:ai-video-frame'),
      assert.equal(list[0].captureSavePending, true),
      assert.equal(list[0].localPath, ''),
      assert.equal(list2.length, 0),
      run({
        url: '/output/ai-frame.png',
        localPath: 'output/ai-frame.png',
        originalLocalPath: 'output/ai-frame.png',
        displayLocalPath: 'output/_derived/display/ai-frame.display.jpg',
        thumbLocalPath: 'output/_derived/thumb/ai-frame.thumb.jpg',
        originalWidth: 640,
        originalHeight: 360,
        filename: 'ai-frame.png',
      }),
      await flushAsyncSave());
    const current = args.nodes[list[0].id];
    (assert.equal(current.captureSavePending, false),
      assert.equal(current.captureSaveError, null),
      assert.equal(current.localPath, 'output/ai-frame.png'),
      assert.equal(current.displayLocalPath, 'output/_derived/display/ai-frame.display.jpg'),
      assert.equal(current.thumbLocalPath, 'output/_derived/thumb/ai-frame.thumb.jpg'),
      assert.equal(current.fileName, 'ai-frame.png'));
  } finally {
    (typeof item === 'undefined' ? delete globalThis.document : (globalThis.document = item),
      typeof key === 'undefined' ? delete globalThis.window : (globalThis.window = key),
      typeof index === 'undefined' ? delete globalThis.URL : (globalThis.URL = index),
      setLocale('zh-CN', { persist: false, notify: false }));
  }
}),
  test('previewControlsModule: mute preference persists in node data', () => {
    const _data = { nodes: { videoNode: { id: 'videoNode', videoMuted: false } } },
      list3 = [],
      store2 = {
        getState() {
          return _data;
        },
        updateNodeData(id2, patch2) {
          (list3.push({ id: id2, patch: patch2 }), (_data.nodes[id2] = { ..._data.nodes[id2], ...patch2 }));
        },
      },
      videoNodePreviewControlsModule2 = createVideoNodePreviewControlsModule({
        store: store2,
        saveOutputBlob: async () => ({}),
        VideoKeyingController: { isActiveFor: () => false },
        getAutoMediaSizeByShortSide: () => ({ width: 160, height: 90 }),
        buildSourceMediaNodePayload: (entry) => entry,
        calcSafeSpawnPosNearNode: () => ({ x: 0, y: 0 }),
      }),
      record = { muted: true },
      payload = Object.create(videoNodePreviewControlsModule2);
    (Object.assign(payload, {
      nodeId: 'videoNode',
      _data: _data.nodes.videoNode,
      previewEl: {
        querySelectorAll(handle) {
          return (assert.equal(handle, 'video'), [record]);
        },
      },
      _multiLayerEls: [],
      _expandPanel: null,
      _muteIconMutedEl: { style: { display: '' } },
      _muteIconUnmutedEl: { style: { display: '' } },
      _syncMuteBtnIcon() {
        return videoNodePreviewControlsModule2._syncMuteBtnIconImpl.call(this);
      },
    }),
      payload._syncMutedStateFromNodeData(_data.nodes.videoNode),
      assert.equal(payload._isMuted, false),
      assert.equal(record.muted, false),
      assert.equal(payload._muteIconMutedEl.style.display, 'none'),
      assert.equal(payload._muteIconUnmutedEl.style.display, ''),
      payload._setPreviewMuted(true, { persist: true }),
      payload._applyMuteStateToPreviewVideos(),
      payload._syncMuteBtnIcon(),
      assert.deepEqual(list3, [{ id: 'videoNode', patch: { videoMuted: true } }]),
      assert.equal(_data.nodes.videoNode.videoMuted, true),
      assert.equal(record.muted, true),
      assert.equal(payload._muteIconMutedEl.style.display, ''),
      assert.equal(payload._muteIconUnmutedEl.style.display, 'none'));
  }),
  test('previewControlsModule: 传入 loop 时进入手动循环，暂停时清理循环状态', async () => {
    const videoNodePreviewControlsModule3 = createVideoNodePreviewControlsModule({
        store: { getState: () => ({ nodes: {} }) },
        saveOutputBlob: async () => ({}),
        VideoKeyingController: { isActiveFor: () => false },
        getAutoMediaSizeByShortSide: () => ({ width: 160, height: 90 }),
        buildSourceMediaNodePayload: (state) => state,
        calcSafeSpawnPosNearNode: () => ({ x: 0, y: 0 }),
      }),
      config = {
        paused: true,
        loop: false,
        getAttribute(scope) {
          return scope === 'src' ? 'video.mp4' : '';
        },
        pause() {
          this.paused = true;
        },
      };
    let input = 0;
    const list4 = [],
      output = Object.create(videoNodePreviewControlsModule3);
    (Object.assign(output, {
      _isManualControl: false,
      _hoverManualPause: false,
      _isManualLoopPlayback: false,
      _autoPlayToken: 0,
      _playPreviewVideoWithRecovery: async () => {
        return ((config.paused = false), true);
      },
      _flashCenterIndicator(value2) {
        list4.push(value2);
      },
      _showPausedCenterIndicator() {
        list4.push('paused');
      },
      _syncVideoControlsFromVideo() {
        input += 1;
      },
      // 进度循环在无 rAF 环境会退回 16ms 定时器；本用例只关心同步次数，屏蔽掉以免异步串扰。
      _startVideoProgressLoop() {},
      _cancelVideoProgressLoop() {},
    }),
      output._toggleVideoPlayPause(config, { loop: true }),
      await Promise.resolve(),
      assert.equal(output._isManualLoopPlayback, true),
      assert.equal(output._isManualControl, true),
      assert.equal(config.loop, true),
      assert.equal(config.paused, false),
      assert.deepEqual(list4, ['play']),
      // 2 次：一次来自 _setVideoOverlaysVisible 的结构性同步，一次来自播放成功后的刷新。
      assert.equal(input, 2),
      (list4.length = 0),
      output._toggleVideoPlayPause(config),
      assert.equal(output._isManualLoopPlayback, false),
      assert.equal(config.loop, false),
      assert.equal(config.paused, true),
      assert.equal(output._hoverManualPause, true),
      assert.deepEqual(list4, ['paused']),
      // 再 +2：暂停分支同样先过 _setVideoOverlaysVisible，再同步控件。
      assert.equal(input, 4));
  }));

// ---------------------------------------------------------------------------
// 悬停播放状态机 / 进度循环 / 静音偏好
//
// 这些方法此前整体缺失（上游有、仓库没有），调用点却已经在用
// （节点 unmount 里就调 `_cancelPreviewHoverRetryTimers?.()` 与
// `_disposeVideoProgressInteraction?.()`），所以行为一直静默失效。
// 下面每个用例都从公开导出进入，只断言可观察结果。
// ---------------------------------------------------------------------------

function createDeps(overrides = {}) {
  return {
    store: { getState: () => ({ nodes: {} }), getStateRaw: () => ({ nodes: {} }) },
    saveOutputBlob: async () => ({}),
    VideoKeyingController: { isActiveFor: () => false },
    getAutoMediaSizeByShortSide: () => ({ width: 160, height: 90 }),
    buildSourceMediaNodePayload: (payload) => payload,
    calcSafeSpawnPosNearNode: () => ({ x: 0, y: 0 }),
    ...overrides,
  };
}

test('previewControlsModule: 悬停重试定时器可登记并一次性清理', async () => {
  const controls = createVideoNodePreviewControlsModule(createDeps()),
    node = Object.create(controls),
    fired = [];
  const firstTimer = node._schedulePreviewHoverTimer(() => fired.push('first'), 0);
  node._schedulePreviewHoverTimer(() => fired.push('second'), 600);
  (assert.notEqual(firstTimer, null),
    assert.equal(node._previewHoverRetryTimers.size, 2),
    assert.equal(node._cancelPreviewHoverRetryTimers(), 2),
    assert.equal(node._previewHoverRetryTimers.size, 0));
  await new Promise((resolve) => setTimeout(resolve, 12));
  (assert.deepEqual(fired, [], '清理后不应再触发回调'),
    assert.equal(node._cancelPreviewHoverRetryTimers(), 0, '空集合上调用应幂等返回 0'),
    assert.equal(node._schedulePreviewHoverTimer(null, 0), null, '非函数入参不入队'));
}),
  test('previewControlsModule: 悬停离开时按手动播放状态决定是否保留呈现', () => {
    const controls = createVideoNodePreviewControlsModule(createDeps());
    // 场景一：纯悬停播放 —— 离开要暂停、清 loop、收回控件。
    const hoverVideoEl = {
        paused: false,
        loop: true,
        pause() {
          this.paused = true;
        },
      },
      hoverVisibility = [],
      hoverNode = Object.create(controls);
    (Object.assign(hoverNode, {
      nodeId: 'videoNode',
      _isHovered: true,
      _isManualControl: false,
      _hoverManualPause: true,
      _autoPlayToken: 3,
      _getActivePreviewVideoEl: () => hoverVideoEl,
      _logPreviewVideoPlaybackEvent: () => {},
      _setVideoOverlaysVisible: (visible) => hoverVisibility.push(visible),
      _hoverPlaybackLifecycle: { deactivate: () => hoverVisibility.push('deactivated') },
    }),
      assert.equal(hoverNode._deactivatePreviewHoverPlayback(), true),
      assert.equal(hoverVideoEl.loop, false),
      assert.equal(hoverVideoEl.paused, true),
      assert.equal(hoverNode._isHovered, false),
      assert.equal(hoverNode._hoverManualPause, false),
      assert.equal(hoverNode._autoPlayToken, 4, '非手动播放时离开要作废在途播放'),
      assert.deepEqual(hoverVisibility, [false, 'deactivated']));
    // 场景二：手动播放中 —— 只清悬停标记，画面与循环都保留。
    const manualVideoEl = {
        paused: false,
        loop: true,
        pause() {
          this.paused = true;
        },
      },
      manualVisibility = [],
      manualNode = Object.create(controls);
    (Object.assign(manualNode, {
      nodeId: 'videoNode',
      _isManualControl: true,
      _autoPlayToken: 5,
      _getActivePreviewVideoEl: () => manualVideoEl,
      _logPreviewVideoPlaybackEvent: () => {},
      _setVideoOverlaysVisible: (visible) => manualVisibility.push(visible),
    }),
      assert.equal(manualNode._deactivatePreviewHoverPlayback(), true),
      assert.equal(manualVideoEl.loop, true),
      assert.equal(manualVideoEl.paused, false),
      assert.equal(manualNode._autoPlayToken, 5, '手动播放时不应作废播放'),
      assert.equal(manualNode._isManualControl, true),
      assert.deepEqual(manualVisibility, [true]));
  }),
  test('previewControlsModule: 低倍缩放或已有播放接管时拒绝悬停播放', () => {
    const denseStore = {
        getState: () => ({ nodes: { videoNode: {} } }),
        getStateRaw: () => ({
          viewport: { zoom: 0.2 },
          _nodeCount: 200,
          nodes: { videoNode: {} },
          selectedNodeIds: [],
        }),
      },
      denseNode = Object.create(
        createVideoNodePreviewControlsModule(createDeps({ store: denseStore })),
      );
    (Object.assign(denseNode, { nodeId: 'videoNode' }),
      assert.equal(
        denseNode.activatePreviewHoverPlayback(),
        false,
        '极低缩放下不应激活悬停播放',
      ));
    // 同一节点已被 videoClip 预览接管时也要让路。
    const clipStore = {
        getState: () => ({ nodes: { videoNode: {} } }),
        getStateRaw: () => ({
          nodes: { videoNode: {} },
          videoClip: { active: true, nodeId: 'videoNode' },
        }),
      },
      clipNode = Object.create(
        createVideoNodePreviewControlsModule(createDeps({ store: clipStore })),
      );
    (Object.assign(clipNode, { nodeId: 'videoNode' }),
      assert.equal(clipNode.activatePreviewHoverPlayback(), false));
  }),
  test('previewControlsModule: 任务失败时收起预览控件', () => {
    const failedStore = {
        getState: () => ({ nodes: { videoNode: { jobStatus: 'error' } } }),
        getStateRaw: () => ({ nodes: { videoNode: { jobStatus: 'error' } } }),
      },
      visibility = [],
      node = Object.create(
        createVideoNodePreviewControlsModule(createDeps({ store: failedStore })),
      );
    (Object.assign(node, {
      nodeId: 'videoNode',
      _setVideoOverlaysVisible: (visible) => visibility.push(visible),
    }),
      assert.equal(node.activatePreviewHoverPlayback(), false),
      assert.deepEqual(visibility, [false]));
  }),
  test('previewControlsModule: 切换语言后刷新控件提示文案', () => {
    const controls = createVideoNodePreviewControlsModule(createDeps()),
      node = Object.create(controls),
      muteBtn = { dataset: {}, setAttribute() {} },
      snapBtn = { dataset: {}, setAttribute() {} },
      playBtn = {
        dataset: {},
        children: [],
        setAttribute() {},
        replaceChildren() {
          this.children = [];
        },
        appendChild(icon) {
          this.children.push(icon);
        },
      },
      originalDocument = globalThis.document;
    globalThis.document = {
      createElementNS() {
        const attrs = {};
        return {
          style: {},
          attrs: attrs,
          children: [],
          setAttribute(name, value) {
            attrs[name] = value;
          },
          appendChild(child) {
            this.children.push(child);
          },
        };
      },
    };
    try {
      (Object.assign(node, {
        _muteBtnEl: muteBtn,
        _snapBtnEl: snapBtn,
        _playBtnEl: playBtn,
        _getActivePreviewVideoEl: () => ({ paused: true }),
      }),
        setLocale('en-US', { persist: false, notify: false }),
        node._syncPreviewControlLocaleTexts(),
        assert.equal(muteBtn.dataset.tooltip, 'Toggle mute'),
        assert.equal(snapBtn.dataset.tooltip, 'Capture current frame'),
        assert.equal(playBtn.dataset.tooltip, 'Play (Shift+click to loop)'),
        setLocale('zh-CN', { persist: false, notify: false }),
        node._syncPreviewControlLocaleTexts(),
        assert.equal(muteBtn.dataset.tooltip, '切换静音'),
        assert.equal(snapBtn.dataset.tooltip, '截取当前帧'),
        assert.equal(playBtn.dataset.tooltip, '播放（Shift+点击循环）'));
    } finally {
      typeof originalDocument === 'undefined'
        ? delete globalThis.document
        : (globalThis.document = originalDocument);
    }
  }),
  test('previewControlsModule: 进度循环只跟随当前播放的视频，暂停即停', () => {
    const originalWindow = globalThis.window,
      pendingFrames = new Map();
    let frameSeq = 0;
    globalThis.window = {
      requestAnimationFrame(callback) {
        frameSeq += 1;
        return (pendingFrames.set(frameSeq, callback), frameSeq);
      },
      cancelAnimationFrame(handle) {
        pendingFrames.delete(handle);
      },
    };
    try {
      const controls = createVideoNodePreviewControlsModule(createDeps()),
        node = Object.create(controls),
        synced = [],
        videoEl = { paused: false, ended: false };
      (Object.assign(node, {
        _getActivePreviewVideoEl: () => videoEl,
        _syncVideoControlsFromVideo: (target) => synced.push(target),
      }),
        node._startVideoProgressLoop(videoEl));
      const firstFrame = node._progressRaf;
      (assert.ok(firstFrame > 0),
        node._startVideoProgressLoop(videoEl),
        assert.equal(node._progressRaf, firstFrame, '同一视频重复启动不应新建帧'),
        pendingFrames.get(firstFrame)(),
        assert.deepEqual(synced, [videoEl], '推进一步应同步一次进度'),
        assert.ok(node._progressRaf > firstFrame, '在播时继续排下一帧'),
        (videoEl.paused = true),
        node._startVideoProgressLoop(videoEl),
        assert.equal(node._progressRaf, 0, '暂停后应停止循环'),
        node._cancelVideoProgressLoop(),
        assert.equal(node._progressRafVideoEl, null));
    } finally {
      typeof originalWindow === 'undefined'
        ? delete globalThis.window
        : (globalThis.window = originalWindow);
    }
  }),
  test('previewControlsModule: 无 rAF 环境用定时器兜底调度进度帧', async () => {
    const originalWindow = globalThis.window;
    (delete globalThis.window, delete globalThis.requestAnimationFrame);
    try {
      const controls = createVideoNodePreviewControlsModule(createDeps()),
        node = Object.create(controls);
      let called = 0;
      const handle = node._requestVideoProgressFrame(() => {
        called += 1;
      });
      assert.equal(typeof handle, 'object', '定时器兜底返回 Timeout 句柄');
      await new Promise((resolve) => setTimeout(resolve, 24));
      (assert.equal(called, 1), node._cancelVideoProgressFrame(handle));
    } finally {
      if (typeof originalWindow !== 'undefined') globalThis.window = originalWindow;
    }
  }),
  test('previewControlsModule: 卸载时释放进度拖拽会话并作废在途 seek', () => {
    const controls = createVideoNodePreviewControlsModule(createDeps()),
      node = Object.create(controls);
    let disposeCount = 0;
    (Object.assign(node, {
      _progressDragSession: {
        dispose() {
          disposeCount += 1;
          return true;
        },
      },
      _isProgressDragging: true,
      _isProgressSeeking: true,
      _progressSeekToken: 7,
    }),
      node._disposeVideoProgressInteraction(),
      assert.equal(disposeCount, 1),
      assert.equal(node._progressDragSession, null),
      assert.equal(node._isProgressDragging, false),
      assert.equal(node._isProgressSeeking, false),
      assert.equal(node._progressSeekToken, 8, '递增 token 让队列里的旧 seek 失效'));
  }),
  test('previewControlsModule: 节点未显式设置静音时跟随全局默认开声音开关', () => {
    const loudStore = {
        getState: () => ({ nodes: { videoNode: {} } }),
        getStateRaw: () => ({ ui: { videoAudioDefaultEnabled: true }, nodes: {} }),
      },
      node = Object.create(
        createVideoNodePreviewControlsModule(createDeps({ store: loudStore })),
      ),
      appliedMuted = [];
    (Object.assign(node, {
      nodeId: 'videoNode',
      _data: {},
      _multiLayerEls: [],
      previewEl: { querySelectorAll: () => [] },
      _muteIconMutedEl: { style: {} },
      _muteIconUnmutedEl: { style: {} },
      _applyMuteStateToPreviewVideos() {
        appliedMuted.push(this._isMuted);
      },
      _syncMuteBtnIcon() {},
    }),
      node._syncMutedStateFromNodeData({}),
      assert.equal(node._isMuted, false, '全局默认开声音时未设置过的节点应不静音'),
      node._syncMutedStateFromNodeData({ videoMuted: true }),
      assert.equal(node._isMuted, true, '节点显式设置优先于全局开关'),
      assert.deepEqual(appliedMuted, [false, true]));
  });

