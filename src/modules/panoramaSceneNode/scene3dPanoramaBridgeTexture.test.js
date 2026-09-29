import test from 'node:test';
import assert from 'node:assert/strict';

import {
  abortPanoramaTextureLoad,
  cancelPanoramaFullLoad,
  loadPanoramaBridgeTexture,
  schedulePanoramaFullLoad,
} from './scene3dPanoramaBridgeTexture.js';
import { t } from '../../i18n/index.js';

function createBridge() {
  const bridge = {
    _panoramaLoadToken: 'tok-1',
    _panoramaSphere: { material: { map: null, needsUpdate: false }, visible: false },
    _panoramaTexture: null,
    _loadedPanoramaUrl: '',
    _pendingPanoramaUrl: '',
    _panoramaTextureAbortController: null,
    _panoramaFullLoadFrame: null,
    statuses: [],
    renders: 0,
    synced: 0,
    scheduled: [],
    onPanoramaStatusChange(status) {
      bridge.statuses.push(status);
    },
    requestRender() {
      bridge.renders += 1;
    },
    _syncPanoramaCanvasVisibility() {
      bridge.synced += 1;
    },
  };
  return bridge;
}

function createTexture() {
  return {
    colorSpace: '',
    minFilter: '',
    magFilter: '',
    generateMipmaps: false,
    anisotropy: 0,
    repeat: { set() {} },
    offset: { set() {} },
    disposed: false,
    dispose() { this.disposed = true; },
  };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('scene3dPanoramaBridgeTexture: 令牌不符时直接忽略加载请求', async () => {
  const bridge = createBridge();
  loadPanoramaBridgeTexture(bridge, 'u1', { token: 'tok-other' });
  assert.equal(bridge._pendingPanoramaUrl, '');
  assert.equal(bridge.statuses.length, 0);
});

test('scene3dPanoramaBridgeTexture: 加载成功会把贴图挂到球面并广播状态', async () => {
  const bridge = createBridge();
  const texture = createTexture();
  bridge._panoramaTextureSourceLoader = (url, { signal }) => {
    assert.equal(url, 'u1');
    assert.equal(signal.aborted, false);
    return texture;
  };
  loadPanoramaBridgeTexture(bridge, 'u1', { token: 'tok-1' });

  assert.equal(bridge._pendingPanoramaUrl, 'u1');
  assert.deepEqual(bridge.statuses, [{ isLoaded: false, error: null }], '尚无贴图先报加载中');
  await settle();

  assert.equal(bridge._panoramaTexture, texture);
  assert.equal(bridge._panoramaSphere.material.map, texture);
  assert.equal(bridge._panoramaSphere.material.needsUpdate, true);
  assert.equal(bridge._panoramaSphere.visible, true);
  assert.equal(bridge._loadedPanoramaUrl, 'u1');
  assert.equal(bridge._pendingPanoramaUrl, '');
  assert.equal(bridge._panoramaTextureAbortController, null);
  assert.deepEqual(bridge.statuses[1], { isLoaded: true, error: null });
  assert.equal(bridge.renders, 1);
  assert.equal(bridge.synced, 1);
});

test('scene3dPanoramaBridgeTexture: 加载完成后令牌失效会丢弃贴图', async () => {
  const bridge = createBridge();
  const texture = createTexture();
  let resolveLoad;
  bridge._panoramaTextureSourceLoader = () => new Promise((resolve) => (resolveLoad = resolve));
  loadPanoramaBridgeTexture(bridge, 'u1', { token: 'tok-1' });
  bridge._panoramaLoadToken = 'tok-2';
  resolveLoad(texture);
  await settle();

  assert.equal(texture.disposed, true, '过期贴图直接释放');
  assert.equal(bridge._panoramaSphere.material.map, null);
  assert.equal(bridge.renders, 0);
});

test('scene3dPanoramaBridgeTexture: 加载失败广播失败文案并回到可见性基线', async () => {
  const bridge = createBridge();
  bridge._panoramaTextureSourceLoader = () => Promise.reject(new Error('bad'));
  loadPanoramaBridgeTexture(bridge, 'u1', { token: 'tok-1' });
  await settle();

  assert.equal(bridge._pendingPanoramaUrl, '');
  assert.equal(bridge._panoramaSphere.visible, false);
  assert.deepEqual(bridge.statuses[1], { isLoaded: false, error: t('panoramaSceneNode.errors.panoramaLoadFailed') });
  assert.equal(bridge.statuses[1].error, '全景图加载失败');
});

test('scene3dPanoramaBridgeTexture: 中断会转发 abort 并清掉控制器', async () => {
  const bridge = createBridge();
  const controller = new AbortController();
  bridge._panoramaTextureAbortController = controller;
  abortPanoramaTextureLoad(bridge);
  assert.equal(bridge._panoramaTextureAbortController, null);
  assert.equal(controller.signal.aborted, true);
  abortPanoramaTextureLoad(bridge);
  abortPanoramaTextureLoad(null);
});

test('scene3dPanoramaBridgeTexture: 全量加载按帧调度且可取消', async () => {
  const frames = [];
  const originalRaf = globalThis.requestAnimationFrame;
  const originalCaf = globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame = (callback) => {
    frames.push(callback);
    return frames.length;
  };
  globalThis.cancelAnimationFrame = (id) => frames.splice(id - 1, 1, null);
  try {
    const bridge = createBridge();
    bridge._loadPanoramaTexture = (url, options) => bridge.scheduled.push([url, options]);

    schedulePanoramaFullLoad(bridge, 'full', 'tok-other');
    assert.equal(bridge._panoramaFullLoadFrame, null, '令牌不符不调度');

    schedulePanoramaFullLoad(bridge, 'full', 'tok-1');
    const frameId = bridge._panoramaFullLoadFrame;
    assert.ok(frameId !== null);
    schedulePanoramaFullLoad(bridge, 'full', 'tok-1');
    assert.equal(bridge._panoramaFullLoadFrame, frameId, '已有排程不重复排');

    frames[0]();
    assert.equal(bridge._panoramaFullLoadFrame, null);
    assert.deepEqual(bridge.scheduled, [['full', { token: 'tok-1', isPreview: false, fullUrl: '' }]]);

    schedulePanoramaFullLoad(bridge, 'full2', 'tok-1');
    cancelPanoramaFullLoad(bridge);
    assert.equal(bridge._panoramaFullLoadFrame, null);
    cancelPanoramaFullLoad(bridge);
    cancelPanoramaFullLoad(null);
  } finally {
    globalThis.requestAnimationFrame = originalRaf;
    globalThis.cancelAnimationFrame = originalCaf;
  }
});

test('scene3dPanoramaBridgeTexture: 预览加载成功后可顺带调度全量加载', async () => {
  const bridge = createBridge();
  bridge._panoramaTextureSourceLoader = () => createTexture();
  bridge._schedulePanoramaFullLoad = (url, token) => bridge.scheduled.push([url, token]);
  loadPanoramaBridgeTexture(bridge, 'preview', { token: 'tok-1', isPreview: true, fullUrl: 'full' });
  await settle();
  assert.deepEqual(bridge.scheduled, [['full', 'tok-1']]);
});
