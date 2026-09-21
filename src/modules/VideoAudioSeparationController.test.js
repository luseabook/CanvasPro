import test from 'node:test';
import assert from 'node:assert/strict';
import appStore from '../core/stores/appStore.js';
import { buildSourceMediaNodePayload } from '../services/fileService.js';
import {
  __resetVideoAudioSeparationDepsForTest,
  __setVideoAudioSeparationDepsForTest,
  runVideoAudioSeparationFromNode,
} from './VideoAudioSeparationController.js';
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
function addSourceVideoNode(_0x246833 = {}) {
  const _0x16dbd3 = buildSourceMediaNodePayload({
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
    ..._0x246833,
  });
  return (appStore.addNode(_0x16dbd3), _0x16dbd3.id);
}
function getCreatedNodes() {
  return Object.values(appStore.getState().nodes || {}).filter(
    (_0x200e1c) => _0x200e1c.id !== 'source-video-1',
  );
}
(test.beforeEach(() => {
  (installDomStubs(), resetStore(), __resetVideoAudioSeparationDepsForTest());
}),
  test.afterEach(() => {
    (__resetVideoAudioSeparationDepsForTest(), resetStore());
  }),
  test('VideoAudioSeparationController: 成功后创建无声视频和音频节点', async () => {
    addSourceVideoNode();
    let _0x370899 = null,
      _0x217701 = null;
    ((globalThis.window.v2FocusOnNodes = (_0x348704) => {
      _0x217701 = [..._0x348704];
    }),
      __setVideoAudioSeparationDepsForTest({
        separateVideoAudioImpl: async (_0x2547b2) => {
          return (
            (_0x370899 = _0x2547b2),
            {
              success: true,
              video: {
                filename: 'video_fixed.mp4',
                localPath: 'output/SeparateVideo/video_fixed.mp4',
                url: '/output/SeparateVideo/video_fixed.mp4',
              },
              audio: {
                filename: 'audio_fixed.mp3',
                localPath: 'output/SeparateAudio/audio_fixed.mp3',
                url: '/output/SeparateAudio/audio_fixed.mp3',
              },
            }
          );
        },
      }));
    const _0x119be9 = await runVideoAudioSeparationFromNode('source-video-1');
    (assert.deepEqual(_0x370899, { src: 'output/source-video-1.mp4' }),
      assert.ok(_0x119be9?.videoId),
      assert.ok(_0x119be9?.audioId));
    const _0x51ce6f = getCreatedNodes();
    assert.equal(_0x51ce6f.length, 2);
    const _0x478bc9 = _0x51ce6f.find((_0x2d2407) => _0x2d2407.type === 'source-video'),
      _0x333eaa = _0x51ce6f.find((_0x3b6656) => _0x3b6656.type === 'source-audio');
    (assert.ok(_0x478bc9),
      assert.ok(_0x333eaa),
      assert.equal(_0x478bc9.name, '画面自 原始视频'),
      assert.equal(_0x478bc9.src, '/output/SeparateVideo/video_fixed.mp4'),
      assert.equal(_0x478bc9.videoUrl, '/output/SeparateVideo/video_fixed.mp4'),
      assert.equal(_0x478bc9.localPath, 'output/SeparateVideo/video_fixed.mp4'),
      assert.equal(_0x478bc9.jobStatus, 'success'),
      assert.equal(_0x478bc9.videos?.[0]?.localPath, 'output/SeparateVideo/video_fixed.mp4'),
      assert.equal(_0x333eaa.name, '音频自 原始视频'),
      assert.equal(_0x333eaa.src, '/output/SeparateAudio/audio_fixed.mp3'),
      assert.equal(_0x333eaa.audioUrl, '/output/SeparateAudio/audio_fixed.mp3'),
      assert.equal(_0x333eaa.localPath, 'output/SeparateAudio/audio_fixed.mp3'),
      assert.equal(_0x333eaa.jobStatus, 'success'),
      assert.deepEqual(appStore.getState().selectedNodeIds, [_0x478bc9.id, _0x333eaa.id]),
      assert.deepEqual(_0x217701, ['source-video-1', _0x478bc9.id, _0x333eaa.id]));
  }),
  test('VideoAudioSeparationController: 失败时不创建结果节点', async () => {
    addSourceVideoNode();
    const _0x131c7b = [];
    ((globalThis.window.showToast = (_0x26763c, _0x511d4a) => {
      _0x131c7b.push({ message: _0x26763c, type: _0x511d4a });
    }),
      __setVideoAudioSeparationDepsForTest({
        separateVideoAudioImpl: async () => {
          throw new Error('当前视频没有可分离的音频');
        },
      }));
    const _0x579928 = await runVideoAudioSeparationFromNode('source-video-1');
    (assert.equal(_0x579928, null),
      assert.equal(getCreatedNodes().length, 0),
      assert.ok(
        _0x131c7b.some(
          (_0x3a9cda) =>
            _0x3a9cda.type === 'error' && String(_0x3a9cda.message).includes('当前视频没有可分离的音频'),
        ),
      ));
  }));
