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
  (installDomStubs(), resetStore(), __resetVideoReverseDepsForTest());
}),
  test.afterEach(() => {
    (__resetVideoReverseDepsForTest(), resetStore());
  }),
  test('VideoReverseController: 成功后按新节点设置创建倒放视频节点', async () => {
    addSourceVideoNode();
    let value = null,
      key = null;
    ((globalThis.window.v2FocusOnNodes = (args2) => {
      key = [...args2];
    }),
      __setVideoReverseDepsForTest({
        reverseVideoImpl: async (index) => {
          return (
            (value = index),
            {
              success: true,
              filename: 'reverse_fixed.mp4',
              localPath: 'output/ReverseVideo/reverse_fixed.mp4',
              url: '/output/ReverseVideo/reverse_fixed.mp4',
              videoWidth: 640,
              videoHeight: 360,
              videoDuration: 2,
              fps: 30,
            }
          );
        },
      }));
    const runVideoReverseFromNode2 = await runVideoReverseFromNode('source-video-1');
    (assert.deepEqual(value, { src: 'output/source-video-1.mp4', nodeId: 'source-video-1' }),
      assert.ok(runVideoReverseFromNode2?.videoId));
    const list = getCreatedNodes();
    assert.equal(list.length, 1);
    const box = list[0];
    (assert.equal(box.type, 'source-video'),
      assert.equal(box.name, '倒放视频：原始视频'),
      assert.equal(box.x, 642),
      assert.equal(box.y, 20),
      assert.equal(box.src, '/output/ReverseVideo/reverse_fixed.mp4'),
      assert.equal(box.videoUrl, '/output/ReverseVideo/reverse_fixed.mp4'),
      assert.equal(box.localPath, 'output/ReverseVideo/reverse_fixed.mp4'),
      assert.equal(box.fileName, 'reverse_fixed.mp4'),
      assert.equal(box.videoWidth, 640),
      assert.equal(box.videoHeight, 360),
      assert.equal(box.jobStatus, 'success'),
      assert.equal(box.videos?.[0]?.localPath, 'output/ReverseVideo/reverse_fixed.mp4'),
      assert.deepEqual(appStore.getState().selectedNodeIds, [box.id]),
      assert.deepEqual(key, ['source-video-1', box.id]));
  }),
  test('VideoReverseController: 失败时不创建结果节点', async () => {
    addSourceVideoNode();
    const list2 = [];
    ((globalThis.window.showToast = (message, type) => {
      list2.push({ message: message, type: type });
    }),
      __setVideoReverseDepsForTest({
        reverseVideoImpl: async () => {
          throw new Error('ffmpeg failed');
        },
      }));
    const runVideoReverseFromNode3 = await runVideoReverseFromNode('source-video-1');
    (assert.equal(runVideoReverseFromNode3, null),
      assert.equal(getCreatedNodes().length, 0),
      assert.ok(
        list2.some((error) => error.type === 'error' && String(error.message).includes('ffmpeg failed')),
      ));
  }));
