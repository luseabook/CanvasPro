import test from 'node:test';
import assert from 'node:assert/strict';
import appStore from '../core/stores/appStore.js';
import { buildSourceMediaNodePayload } from '../services/fileService.js';
import {
  __resetVideoReverseDepsForTest,
  __setVideoReverseDepsForTest,
  runVideoReverseFromNode,
} from './VideoReverseController.js';
function installDomStubs() {
  if (!globalThis.window) globalThis.window = {};
  ((globalThis.window.showToast = () => {}),
    (globalThis.window._triggerLocalCacheSave = () => {}),
    (globalThis.window.v2FocusOnNodes = () => {}),
    (globalThis.window.v2NodeAvoidOverlap = false),
    (globalThis.window.v2NodeDirection = 'right'),
    (globalThis.window.v2NodeSpacing = 120));
}
function resetStore() {
  appStore.loadState({ nodes: {}, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } });
}
function addSourceVideoNode(_0x401f9c = {}) {
  const _0x3952f8 = buildSourceMediaNodePayload({
    id: 'source-video-1',
    type: 'source-video',
    x: 10,
    y: 20,
    width: 0x200,
    height: 0x120,
    name: '原始视频',
    localPath: 'output/source-video-1.mp4',
    src: '/output/source-video-1.mp4',
    needsAutoResize: false,
    fixedSize: true,
    ..._0x401f9c,
  });
  return (appStore.addNode(_0x3952f8), _0x3952f8.id);
}
function getCreatedNodes() {
  return Object.values(appStore.getState().nodes || {}).filter(
    (_0x50732e) => _0x50732e.id !== 'source-video-1',
  );
}
(test.beforeEach(() => {
  (installDomStubs(), resetStore(), __resetVideoReverseDepsForTest());
}),
  test.afterEach(() => {
    (__resetVideoReverseDepsForTest(), resetStore());
  }),
  test('VideoReverseController: 成功后按新节点设置创建倒放视频节点', async () => {
    addSourceVideoNode();
    let _0x4b38db = null,
      _0x4e3d4d = null;
    ((globalThis.window.v2FocusOnNodes = (_0x2a57bf) => {
      _0x4e3d4d = [..._0x2a57bf];
    }),
      __setVideoReverseDepsForTest({
        reverseVideoImpl: async (_0xa44ce5) => {
          return (
            (_0x4b38db = _0xa44ce5),
            {
              success: true,
              filename: 'reverse_fixed.mp4',
              localPath: 'output/ReverseVideo/reverse_fixed.mp4',
              url: '/output/ReverseVideo/reverse_fixed.mp4',
              videoWidth: 0x280,
              videoHeight: 0x168,
              videoDuration: 2,
              fps: 30,
            }
          );
        },
      }));
    const _0x519a81 = await runVideoReverseFromNode('source-video-1');
    (assert.deepEqual(_0x4b38db, { src: 'output/source-video-1.mp4', nodeId: 'source-video-1' }),
      assert.ok(_0x519a81?.videoId));
    const _0x17cbce = getCreatedNodes();
    assert.equal(_0x17cbce.length, 1);
    const _0x14a9d2 = _0x17cbce[0];
    (assert.equal(_0x14a9d2.type, 'source-video'),
      assert.equal(_0x14a9d2.name, '倒放视频：原始视频'),
      assert.equal(_0x14a9d2.x, 0x282),
      assert.equal(_0x14a9d2.y, 20),
      assert.equal(_0x14a9d2.src, '/output/ReverseVideo/reverse_fixed.mp4'),
      assert.equal(_0x14a9d2.videoUrl, '/output/ReverseVideo/reverse_fixed.mp4'),
      assert.equal(_0x14a9d2.localPath, 'output/ReverseVideo/reverse_fixed.mp4'),
      assert.equal(_0x14a9d2.fileName, 'reverse_fixed.mp4'),
      assert.equal(_0x14a9d2.videoWidth, 0x280),
      assert.equal(_0x14a9d2.videoHeight, 0x168),
      assert.equal(_0x14a9d2.jobStatus, 'success'),
      assert.equal(_0x14a9d2.videos?.[0]?.localPath, 'output/ReverseVideo/reverse_fixed.mp4'),
      assert.deepEqual(appStore.getState().selectedNodeIds, [_0x14a9d2.id]),
      assert.deepEqual(_0x4e3d4d, ['source-video-1', _0x14a9d2.id]));
  }),
  test('VideoReverseController: 失败时不创建结果节点', async () => {
    addSourceVideoNode();
    const _0x5df044 = [];
    ((globalThis.window.showToast = (_0x1f6105, _0x53342d) => {
      _0x5df044.push({ message: _0x1f6105, type: _0x53342d });
    }),
      __setVideoReverseDepsForTest({
        reverseVideoImpl: async () => {
          throw new Error('ffmpeg failed');
        },
      }));
    const _0x1ee5e7 = await runVideoReverseFromNode('source-video-1');
    (assert.equal(_0x1ee5e7, null),
      assert.equal(getCreatedNodes().length, 0),
      assert.ok(
        _0x5df044.some(
          (_0x43f584) => _0x43f584.type === 'error' && String(_0x43f584.message).includes('ffmpeg failed'),
        ),
      ));
  }));
