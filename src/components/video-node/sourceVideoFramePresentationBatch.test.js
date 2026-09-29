import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  __sourceVideoFramePresentationBatchForTest,
  hasReportedSourceVideoMediaSlotFrame,
  reportSourceVideoMediaSlotFrameOnce,
  scheduleSourceVideoFramePresentationCommit,
} from './sourceVideoFramePresentationBatch.js';

const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
const originalWindow = globalThis.window;

afterEach(() => {
  __sourceVideoFramePresentationBatchForTest.reset();
  if (typeof originalRequestAnimationFrame === 'undefined') delete globalThis.requestAnimationFrame;
  else globalThis.requestAnimationFrame = originalRequestAnimationFrame;
  if (typeof originalWindow === 'undefined') delete globalThis.window;
  else globalThis.window = originalWindow;
});

test('sourceVideoFramePresentationBatch: coalesces current commits into one animation frame', () => {
  const callbacks = [];
  globalThis.requestAnimationFrame = (callback) => {
    callbacks.push(callback);
    return callbacks.length;
  };
  const calls = [];
  const card = {
    classList: { remove() {} },
    querySelectorAll() {
      return [];
    },
  };
  const node = {
    _currentSrc: 'blob:video-1',
    _video: {},
    _card: card,
    _isCurrentRendererMediaSlotToken(_sourceKey, token) {
      return token.sourceEpoch === 4;
    },
    _restorePausedFirstFrameNudge() {
      return false;
    },
    _syncPosterFrameVisibility() {
      calls.push('poster');
    },
    _getRendererVideoPresentationFacts() {
      return { width: 1920, height: 1080 };
    },
    _removeNativePosterForPresentedSource() {
      calls.push('remove-poster');
    },
    _releaseFastPreviewForPlaybackIfReady() {
      calls.push('release-preview');
    },
    _syncRendererPlaybackPin() {
      calls.push('pin');
    },
  };

  assert.equal(scheduleSourceVideoFramePresentationCommit(node, 'blob:video-1', { sourceEpoch: 4 }), true);
  assert.equal(scheduleSourceVideoFramePresentationCommit(node, 'blob:video-1', { sourceEpoch: 4 }), true);
  assert.equal(callbacks.length, 1);

  callbacks[0]();
  assert.deepEqual(calls, ['poster', 'remove-poster', 'release-preview', 'pin']);
});

test('sourceVideoFramePresentationBatch: ignores stale commits', () => {
  globalThis.requestAnimationFrame = undefined;
  let renderCalls = 0;
  const node = {
    _currentSrc: 'blob:current',
    _video: {},
    _isCurrentRendererMediaSlotToken: () => false,
    _restorePausedFirstFrameNudge: () => false,
    _syncPosterFrameVisibility() {
      renderCalls += 1;
    },
  };

  assert.equal(scheduleSourceVideoFramePresentationCommit(node, 'blob:stale', { sourceEpoch: 1 }), true);
  assert.equal(renderCalls, 0);
});

test('sourceVideoFramePresentationBatch: reports a slot frame once per video/source/epoch', () => {
  const reports = [];
  globalThis.window = {
    v2Renderer: {
      reportMediaSlotFrame(nodeId, payload) {
        reports.push([nodeId, payload]);
        return true;
      },
    },
  };
  const node = {
    id: 'node-1',
    _video: { id: 'video-el' },
    _getRendererVideoPresentationFacts() {
      return { width: 1280, height: 720 };
    },
  };

  assert.equal(
    reportSourceVideoMediaSlotFrameOnce(node, {
      sourceKey: 'blob:source',
      mediaSlotToken: { sourceEpoch: 2 },
    }),
    true,
  );
  assert.equal(
    reportSourceVideoMediaSlotFrameOnce(node, {
      sourceKey: 'blob:source',
      mediaSlotToken: { sourceEpoch: 2 },
    }),
    true,
  );
  assert.equal(reports.length, 1);
  assert.equal(
    hasReportedSourceVideoMediaSlotFrame(node, {
      sourceKey: 'blob:source',
      mediaSlotToken: { sourceEpoch: 2 },
    }),
    true,
  );

  assert.equal(
    reportSourceVideoMediaSlotFrameOnce(node, {
      sourceKey: 'blob:source',
      mediaSlotToken: { sourceEpoch: 3 },
    }),
    true,
  );
  assert.equal(reports.length, 2);
});
