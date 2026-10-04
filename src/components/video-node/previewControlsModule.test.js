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
          width: 0x12c,
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
        videoWidth: 0x280,
        videoHeight: 0x168,
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
        originalWidth: 0x280,
        originalHeight: 0x168,
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
  test('previewControlsModule: Alt 播放按钮开启循环，暂停时清理循环状态', async () => {
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
    }),
      output._toggleVideoPlayPause(config, { loop: true }),
      await Promise.resolve(),
      assert.equal(output._isManualLoopPlayback, true),
      assert.equal(output._isManualControl, true),
      assert.equal(config.loop, true),
      assert.equal(config.paused, false),
      assert.deepEqual(list4, ['play']),
      assert.equal(input, 1),
      (list4.length = 0),
      output._toggleVideoPlayPause(config),
      assert.equal(output._isManualLoopPlayback, false),
      assert.equal(config.loop, false),
      assert.equal(config.paused, true),
      assert.equal(output._hoverManualPause, true),
      assert.deepEqual(list4, ['paused']),
      assert.equal(input, 2));
  }));
