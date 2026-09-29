import test from 'node:test';
import assert from 'node:assert/strict';

import { createImageLoadDiagnostics, getImageLoadTiming } from './imageLoadDiagnostics.js';

test('imageLoadDiagnostics: disabled diagnostics return no-op methods', () => {
  let scheduled = 0;
  const diagnostics = createImageLoadDiagnostics('disabled', {
    enabled: false,
    schedule() {
      scheduled += 1;
      return 1;
    },
  });

  diagnostics.mark('started');
  diagnostics.finish();

  assert.equal(scheduled, 0);
});

test('imageLoadDiagnostics: records stages, reports paint, and closes once', () => {
  const reports = [];
  let scheduledCallback = null;
  let unrefCalls = 0;
  let cancelCalls = 0;
  const diagnostics = createImageLoadDiagnostics('node-1', {
    enabled: true,
    now: () => 125,
    schedule(callback) {
      scheduledCallback = callback;
      return {
        unref() {
          unrefCalls += 1;
        },
      };
    },
    cancel(handle) {
      cancelCalls += 1;
      assert.equal(handle?.unref !== undefined, true);
    },
    report(event) {
      reports.push(event);
    },
  });

  diagnostics.mark('started', { source: 'test' });
  diagnostics.mark('paint-opportunity');
  diagnostics.finish();
  diagnostics.finish();
  scheduledCallback();

  assert.equal(unrefCalls, 1);
  assert.equal(cancelCalls, 1);
  assert.equal(reports.length, 2);
  assert.equal(reports[0].context.reason, 'paint-opportunity');
  assert.deepEqual(reports[0].context.events, [
    { stage: 'started', elapsedMs: 0, source: 'test' },
    { stage: 'paint-opportunity', elapsedMs: 0 },
  ]);
  assert.equal(reports[1].context.reason, 'closed');
  assert.equal(reports[1].context.consumer, 'node-1');
});

test('imageLoadDiagnostics: reports natural image dimensions and visibility fallback', () => {
  const timing = getImageLoadTiming({
    src: 'data:image/png;base64,AA',
    currentSrc: '',
    naturalWidth: 640,
    naturalHeight: 360,
  });

  assert.deepEqual(timing, {
    width: 640,
    height: 360,
    resourceDurationMs: null,
    transferBytes: null,
    documentVisible: globalThis.document?.visibilityState || 'unknown',
  });
});
