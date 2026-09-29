import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clearRendererViewportMediaPreloadPause,
  syncRendererViewportMediaPreloadPause,
} from './rendererViewportMediaPreloadPause.js';
import {
  getCanvasMediaSchedulerStats,
  resetCanvasMediaSchedulerForTests,
} from '../modules/canvasMediaScheduler.js';

function createTimerHarness() {
  let nextId = 1;
  const timers = new Map();
  return {
    clearTimeout(id) {
      timers.delete(id);
    },
    flushNext() {
      const entry = timers.entries().next().value;
      assert.ok(entry, 'expected a pending timer');
      const [id, timer] = entry;
      timers.delete(id);
      timer.callback();
      return timer.delay;
    },
    get size() {
      return timers.size;
    },
    setTimeout(callback, delay) {
      const id = nextId++;
      timers.set(id, { callback, delay });
      return id;
    },
  };
}

function installTimerHarness(harness) {
  const previous = {
    clearTimeout: globalThis.clearTimeout,
    setTimeout: globalThis.setTimeout,
  };
  globalThis.setTimeout = harness.setTimeout;
  globalThis.clearTimeout = harness.clearTimeout;
  return () => {
    globalThis.clearTimeout = previous.clearTimeout;
    globalThis.setTimeout = previous.setTimeout;
  };
}

test('rendererViewportMediaPreloadPause: pauses the scheduler and resumes from its timer', () => {
  const timers = createTimerHarness();
  const restoreTimers = installTimerHarness(timers);
  resetCanvasMediaSchedulerForTests();

  try {
    syncRendererViewportMediaPreloadPause(true, { autoResumeMs: 25 });
    let stats = getCanvasMediaSchedulerStats();
    assert.equal(stats.imagePreloadPaused, true);
    assert.equal(stats.imagePreloadPausedBypassPriority, 1000);
    assert.equal(timers.size, 1);

    syncRendererViewportMediaPreloadPause(true, { autoResumeMs: 25 });
    assert.equal(timers.size, 1);

    timers.flushNext();
    stats = getCanvasMediaSchedulerStats();
    assert.equal(stats.imagePreloadPaused, false);
  } finally {
    clearRendererViewportMediaPreloadPause();
    restoreTimers();
    resetCanvasMediaSchedulerForTests();
  }
});

test('rendererViewportMediaPreloadPause: rechecks a busy viewport before resuming', () => {
  const timers = createTimerHarness();
  const restoreTimers = installTimerHarness(timers);
  const bodyClasses = new Set(['is-panning']);
  const previousDocument = globalThis.document;
  globalThis.document = {
    body: {
      classList: {
        contains: (name) => bodyClasses.has(name),
      },
    },
  };
  resetCanvasMediaSchedulerForTests();

  try {
    syncRendererViewportMediaPreloadPause(true, { autoResumeMs: 5 });
    assert.equal(timers.flushNext(), 5);
    assert.equal(getCanvasMediaSchedulerStats().imagePreloadPaused, true);
    assert.equal(timers.size, 1);

    bodyClasses.delete('is-panning');
    assert.equal(timers.flushNext(), 180);
    assert.equal(getCanvasMediaSchedulerStats().imagePreloadPaused, false);
  } finally {
    clearRendererViewportMediaPreloadPause();
    restoreTimers();
    resetCanvasMediaSchedulerForTests();
    if (previousDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = previousDocument;
    }
  }
});
