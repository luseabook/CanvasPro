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
function addSourceVideoNode(args = {}) {
  const sourceMediaNodePayload = buildSourceMediaNodePayload({
    id: 'source-video-1',
    type: 'source-video',
    x: 10,
    y: 20,
    width: 512,
    height: 288,
    name: '原始视频',
    localPath: 'output/source-video-1.mp4',
    src: '/output/source-video-1.mp4',
    needsAutoResize: false,
    fixedSize: true,
    ...args,
  });
  return (appStore.addNode(sourceMediaNodePayload), sourceMediaNodePayload.id);
}
function getCreatedNodes() {
  return Object.values(appStore.getState().nodes || {}).filter((item) => item.id !== 'source-video-1');
}
(test.beforeEach(() => {
  (installDomStubs(), resetStore(), __resetVideoAudioSeparationDepsForTest());
}),
  test.afterEach(() => {
    (__resetVideoAudioSeparationDepsForTest(), resetStore());
  }),
  test('VideoAudioSeparationController: 成功后创建无声视频和音频节点', async () => {
    addSourceVideoNode();
    let value = null,
      key = null;
    ((globalThis.window.v2FocusOnNodes = (args2) => {
      key = [...args2];
    }),
      __setVideoAudioSeparationDepsForTest({
        separateVideoAudioImpl: async (index) => {
          return (
            (value = index),
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
    const runVideoAudioSeparationFromNode2 = await runVideoAudioSeparationFromNode('source-video-1');
    (assert.deepEqual(value, { src: 'output/source-video-1.mp4' }),
      assert.ok(runVideoAudioSeparationFromNode2?.videoId),
      assert.ok(runVideoAudioSeparationFromNode2?.audioId));
    const list = getCreatedNodes();
    assert.equal(list.length, 2);
    const error = list.find((item2) => item2.type === 'source-video'),
      error2 = list.find((item3) => item3.type === 'source-audio');
    (assert.ok(error),
      assert.ok(error2),
      assert.equal(error.name, '画面自 原始视频'),
      assert.equal(error.src, '/output/SeparateVideo/video_fixed.mp4'),
      assert.equal(error.videoUrl, '/output/SeparateVideo/video_fixed.mp4'),
      assert.equal(error.localPath, 'output/SeparateVideo/video_fixed.mp4'),
      assert.equal(error.jobStatus, 'success'),
      assert.equal(error.videos?.[0]?.localPath, 'output/SeparateVideo/video_fixed.mp4'),
      assert.equal(error2.name, '音频自 原始视频'),
      assert.equal(error2.src, '/output/SeparateAudio/audio_fixed.mp3'),
      assert.equal(error2.audioUrl, '/output/SeparateAudio/audio_fixed.mp3'),
      assert.equal(error2.localPath, 'output/SeparateAudio/audio_fixed.mp3'),
      assert.equal(error2.jobStatus, 'success'),
      assert.deepEqual(appStore.getState().selectedNodeIds, [error.id, error2.id]),
      assert.deepEqual(key, ['source-video-1', error.id, error2.id]));
  }),
  test('VideoAudioSeparationController: 失败时不创建结果节点', async () => {
    addSourceVideoNode();
    const list2 = [];
    ((globalThis.window.showToast = (message, type) => {
      list2.push({ message: message, type: type });
    }),
      __setVideoAudioSeparationDepsForTest({
        separateVideoAudioImpl: async () => {
          throw new Error('当前视频没有可分离的音频');
        },
      }));
    const runVideoAudioSeparationFromNode3 = await runVideoAudioSeparationFromNode('source-video-1');
    (assert.equal(runVideoAudioSeparationFromNode3, null),
      assert.equal(getCreatedNodes().length, 0),
      assert.ok(
        list2.some(
          (error3) => error3.type === 'error' && String(error3.message).includes('当前视频没有可分离的音频'),
        ),
      ));
  }));
