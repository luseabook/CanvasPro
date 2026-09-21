import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVideoNodePreviewControlsModule } from './previewControlsModule.js';
import { setLocale } from '../../i18n/index.js';
async function flushAsyncSave() {
  (await Promise.resolve(),
    await Promise.resolve(),
    await new Promise((_0x15442a) => setTimeout(_0x15442a, 0)));
}
(test('previewControlsModule: capture frame adds preview node before async save', async () => {
  const _0x498b76 = globalThis.document,
    _0x53929a = globalThis.window,
    _0x5e14f6 = globalThis.URL,
    _0x5e118a = [],
    _0x456ace = [],
    _0x7f7c8a = {
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
  let _0x23c856;
  const _0x2e7a17 = new Promise((_0x396249) => {
    _0x23c856 = _0x396249;
  });
  ((globalThis.document = {
    createElement(_0x3cb0d3) {
      return (
        assert.equal(_0x3cb0d3, 'canvas'),
        {
          width: 0,
          height: 0,
          getContext(_0x28e8e1) {
            return (assert.equal(_0x28e8e1, '2d'), { drawImage() {} });
          },
          toBlob(_0x11d6d4, _0x5cc8ed) {
            _0x11d6d4(new Blob(['frame'], { type: _0x5cc8ed }));
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
  const _0xc8ac2c = {
    getState() {
      return _0x7f7c8a;
    },
    getStateRaw() {
      return _0x7f7c8a;
    },
    addNode(_0xa4385d) {
      (_0x5e118a.push(_0xa4385d), (_0x7f7c8a.nodes[_0xa4385d.id] = _0xa4385d));
    },
    updateNodeData(_0x33f24b, _0x36eae0) {
      (_0x456ace.push({ id: _0x33f24b, patch: _0x36eae0 }),
        (_0x7f7c8a.nodes[_0x33f24b] = { ..._0x7f7c8a.nodes[_0x33f24b], ..._0x36eae0 }));
    },
  };
  setLocale('en-US', { persist: false, notify: false });
  try {
    const _0x45d6d8 = createVideoNodePreviewControlsModule({
        store: _0xc8ac2c,
        saveOutputBlob: () => _0x2e7a17,
        VideoKeyingController: null,
        getAutoMediaSizeByShortSide: () => ({ width: 160, height: 90 }),
        buildSourceMediaNodePayload: (_0x19373d) => ({
          localPath: '',
          originalLocalPath: '',
          displayLocalPath: '',
          thumbLocalPath: '',
          ..._0x19373d,
        }),
        calcSafeSpawnPosNearNode: () => ({ x: 120, y: 240 }),
      }),
      _0x4607c0 = Object.create(_0x45d6d8);
    ((_0x4607c0.nodeId = 'videoNode'),
      (_0x4607c0._getActivePreviewVideoEl = () => ({
        src: 'video.mp4',
        currentSrc: '',
        readyState: 2,
        videoWidth: 0x280,
        videoHeight: 0x168,
        currentTime: 0.5,
      })),
      (_0x4607c0._getActiveVideoDuration = () => 2),
      await _0x4607c0._captureCurrentFrameFromActiveVideo(),
      assert.equal(_0x5e118a.length, 1),
      assert.equal(_0x5e118a[0].type, 'source-image'),
      assert.equal(_0x5e118a[0].name, 'Captured frame 13'),
      assert.equal(_0x5e118a[0].capturePreviewUrl, 'blob:ai-video-frame'),
      assert.equal(_0x5e118a[0].captureSavePending, true),
      assert.equal(_0x5e118a[0].localPath, ''),
      assert.equal(_0x456ace.length, 0),
      _0x23c856({
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
    const _0x2766f1 = _0x7f7c8a.nodes[_0x5e118a[0].id];
    (assert.equal(_0x2766f1.captureSavePending, false),
      assert.equal(_0x2766f1.captureSaveError, null),
      assert.equal(_0x2766f1.localPath, 'output/ai-frame.png'),
      assert.equal(_0x2766f1.displayLocalPath, 'output/_derived/display/ai-frame.display.jpg'),
      assert.equal(_0x2766f1.thumbLocalPath, 'output/_derived/thumb/ai-frame.thumb.jpg'),
      assert.equal(_0x2766f1.fileName, 'ai-frame.png'));
  } finally {
    (typeof _0x498b76 === 'undefined' ? delete globalThis.document : (globalThis.document = _0x498b76),
      typeof _0x53929a === 'undefined' ? delete globalThis.window : (globalThis.window = _0x53929a),
      typeof _0x5e14f6 === 'undefined' ? delete globalThis.URL : (globalThis.URL = _0x5e14f6),
      setLocale('zh-CN', { persist: false, notify: false }));
  }
}),
  test('previewControlsModule: mute preference persists in node data', () => {
    const _0x209a3b = { nodes: { videoNode: { id: 'videoNode', videoMuted: false } } },
      _0x21caa6 = [],
      _0x409bab = {
        getState() {
          return _0x209a3b;
        },
        updateNodeData(_0x4ac8e4, _0x2c7a64) {
          (_0x21caa6.push({ id: _0x4ac8e4, patch: _0x2c7a64 }),
            (_0x209a3b.nodes[_0x4ac8e4] = { ..._0x209a3b.nodes[_0x4ac8e4], ..._0x2c7a64 }));
        },
      },
      _0x23f6d7 = createVideoNodePreviewControlsModule({
        store: _0x409bab,
        saveOutputBlob: async () => ({}),
        VideoKeyingController: { isActiveFor: () => false },
        getAutoMediaSizeByShortSide: () => ({ width: 160, height: 90 }),
        buildSourceMediaNodePayload: (_0x1f3757) => _0x1f3757,
        calcSafeSpawnPosNearNode: () => ({ x: 0, y: 0 }),
      }),
      _0x25fc23 = { muted: true },
      _0x1cf356 = Object.create(_0x23f6d7);
    (Object.assign(_0x1cf356, {
      nodeId: 'videoNode',
      _data: _0x209a3b.nodes.videoNode,
      previewEl: {
        querySelectorAll(_0x31015b) {
          return (assert.equal(_0x31015b, 'video'), [_0x25fc23]);
        },
      },
      _multiLayerEls: [],
      _expandPanel: null,
      _muteIconMutedEl: { style: { display: '' } },
      _muteIconUnmutedEl: { style: { display: '' } },
      _syncMuteBtnIcon() {
        return _0x23f6d7._syncMuteBtnIconImpl.call(this);
      },
    }),
      _0x1cf356._syncMutedStateFromNodeData(_0x209a3b.nodes.videoNode),
      assert.equal(_0x1cf356._isMuted, false),
      assert.equal(_0x25fc23.muted, false),
      assert.equal(_0x1cf356._muteIconMutedEl.style.display, 'none'),
      assert.equal(_0x1cf356._muteIconUnmutedEl.style.display, ''),
      _0x1cf356._setPreviewMuted(true, { persist: true }),
      _0x1cf356._applyMuteStateToPreviewVideos(),
      _0x1cf356._syncMuteBtnIcon(),
      assert.deepEqual(_0x21caa6, [{ id: 'videoNode', patch: { videoMuted: true } }]),
      assert.equal(_0x209a3b.nodes.videoNode.videoMuted, true),
      assert.equal(_0x25fc23.muted, true),
      assert.equal(_0x1cf356._muteIconMutedEl.style.display, ''),
      assert.equal(_0x1cf356._muteIconUnmutedEl.style.display, 'none'));
  }),
  test('previewControlsModule: Alt 播放按钮开启循环，暂停时清理循环状态', async () => {
    const _0x43b164 = createVideoNodePreviewControlsModule({
        store: { getState: () => ({ nodes: {} }) },
        saveOutputBlob: async () => ({}),
        VideoKeyingController: { isActiveFor: () => false },
        getAutoMediaSizeByShortSide: () => ({ width: 160, height: 90 }),
        buildSourceMediaNodePayload: (_0x2207ac) => _0x2207ac,
        calcSafeSpawnPosNearNode: () => ({ x: 0, y: 0 }),
      }),
      _0x4a1d33 = {
        paused: true,
        loop: false,
        getAttribute(_0x595f87) {
          return _0x595f87 === 'src' ? 'video.mp4' : '';
        },
        pause() {
          this.paused = true;
        },
      };
    let _0x5ca810 = 0;
    const _0x44b363 = [],
      _0x280055 = Object.create(_0x43b164);
    (Object.assign(_0x280055, {
      _isManualControl: false,
      _hoverManualPause: false,
      _isManualLoopPlayback: false,
      _autoPlayToken: 0,
      _playPreviewVideoWithRecovery: async () => {
        return ((_0x4a1d33.paused = false), true);
      },
      _flashCenterIndicator(_0x49bfb8) {
        _0x44b363.push(_0x49bfb8);
      },
      _showPausedCenterIndicator() {
        _0x44b363.push('paused');
      },
      _syncVideoControlsFromVideo() {
        _0x5ca810 += 1;
      },
    }),
      _0x280055._toggleVideoPlayPause(_0x4a1d33, { loop: true }),
      await Promise.resolve(),
      assert.equal(_0x280055._isManualLoopPlayback, true),
      assert.equal(_0x280055._isManualControl, true),
      assert.equal(_0x4a1d33.loop, true),
      assert.equal(_0x4a1d33.paused, false),
      assert.deepEqual(_0x44b363, ['play']),
      assert.equal(_0x5ca810, 1),
      (_0x44b363.length = 0),
      _0x280055._toggleVideoPlayPause(_0x4a1d33),
      assert.equal(_0x280055._isManualLoopPlayback, false),
      assert.equal(_0x4a1d33.loop, false),
      assert.equal(_0x4a1d33.paused, true),
      assert.equal(_0x280055._hoverManualPause, true),
      assert.deepEqual(_0x44b363, ['paused']),
      assert.equal(_0x5ca810, 2));
  }));
