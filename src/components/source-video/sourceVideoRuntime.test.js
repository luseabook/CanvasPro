import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import appStore from '../../core/stores/appStore.js';
import { desktopBridge } from '../../services/desktopBridge.js';
import {
  hasSourceVideoRecoveryWork,
  isClientFetchableMediaUrl,
  isDesktopRenderer,
  scheduleSourceVideoIdleTask,
  shouldEagerLoadSourceVideoAtCurrentZoom,
  shouldFetchVideoMetaForNodeInfo,
} from './sourceVideoRuntime.js';

const originalDocument = globalThis.document;
const originalGetStateRaw = appStore.getStateRaw;
const originalGetState = appStore.getState;
const originalDesktopDescriptors = {
  isElectron: Object.getOwnPropertyDescriptor(desktopBridge, 'isElectron'),
  isChromeShell: Object.getOwnPropertyDescriptor(desktopBridge, 'isChromeShell'),
};
const originalRequestIdleCallback = globalThis.requestIdleCallback;
const originalCancelIdleCallback = globalThis.cancelIdleCallback;

afterEach(() => {
  appStore.getStateRaw = originalGetStateRaw;
  appStore.getState = originalGetState;
  Object.defineProperty(desktopBridge, 'isElectron', originalDesktopDescriptors.isElectron);
  Object.defineProperty(desktopBridge, 'isChromeShell', originalDesktopDescriptors.isChromeShell);
  if (typeof originalDocument === 'undefined') delete globalThis.document;
  else globalThis.document = originalDocument;
  if (typeof originalRequestIdleCallback === 'undefined') delete globalThis.requestIdleCallback;
  else globalThis.requestIdleCallback = originalRequestIdleCallback;
  if (typeof originalCancelIdleCallback === 'undefined') delete globalThis.cancelIdleCallback;
  else globalThis.cancelIdleCallback = originalCancelIdleCallback;
});

function setDesktopFlags({ isElectron = false, isChromeShell = false } = {}) {
  Object.defineProperty(desktopBridge, 'isElectron', {
    configurable: true,
    get: () => isElectron,
  });
  Object.defineProperty(desktopBridge, 'isChromeShell', {
    configurable: true,
    get: () => isChromeShell,
  });
}

test('sourceVideoRuntime: recognizes fetchable media URLs', () => {
  assert.equal(isClientFetchableMediaUrl('https://cdn.example/video.mp4'), true);
  assert.equal(isClientFetchableMediaUrl('blob:video'), true);
  assert.equal(isClientFetchableMediaUrl('data:video/mp4;base64,AA=='), true);
  assert.equal(isClientFetchableMediaUrl('/data/assets/video.mp4'), true);
  assert.equal(isClientFetchableMediaUrl('//cdn.example/video.mp4'), false);
  assert.equal(isClientFetchableMediaUrl('file:///tmp/video.mp4'), false);
});

test('sourceVideoRuntime: detects desktop renderers and recovery work', () => {
  setDesktopFlags();
  assert.equal(isDesktopRenderer(), false);
  setDesktopFlags({ isChromeShell: true });
  assert.equal(isDesktopRenderer(), true);

  assert.equal(hasSourceVideoRecoveryWork({}), false);
  assert.equal(hasSourceVideoRecoveryWork({ rhTaskId: 'task-1' }), true);
  assert.equal(hasSourceVideoRecoveryWork({ asyncTaskRecovering: true }), true);
});

test('sourceVideoRuntime: zoom and video metadata policy read the app store', () => {
  appStore.getStateRaw = () => ({ viewport: { zoom: 0.6 }, ui: { showVideoMeta: true } });
  assert.equal(shouldEagerLoadSourceVideoAtCurrentZoom(), true);
  assert.equal(shouldFetchVideoMetaForNodeInfo(), true);

  appStore.getStateRaw = () => ({ viewport: { zoom: 0.4 }, ui: { showVideoMeta: false } });
  assert.equal(shouldEagerLoadSourceVideoAtCurrentZoom(), false);
  assert.equal(shouldFetchVideoMetaForNodeInfo(), false);
});

test('sourceVideoRuntime: schedules an idle task once and supports cancellation', () => {
  globalThis.document = {
    body: {
      classList: {
        contains() {
          return false;
        },
      },
    },
  };
  let pending = null;
  let cancelled = null;
  globalThis.requestIdleCallback = (callback) => {
    pending = callback;
    return 17;
  };
  globalThis.cancelIdleCallback = (handle) => {
    cancelled = handle;
  };
  let calls = 0;
  const cancel = scheduleSourceVideoIdleTask(() => {
    calls += 1;
  });

  assert.equal(typeof pending, 'function');
  pending();
  assert.equal(calls, 1);
  cancel();
  assert.equal(cancelled, 17);
});

test('sourceVideoRuntime: rejects non-function idle tasks', () => {
  const cancel = scheduleSourceVideoIdleTask(null);
  assert.equal(typeof cancel, 'function');
  cancel();
});
