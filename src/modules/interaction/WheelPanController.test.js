import test from 'node:test';
import assert from 'node:assert/strict';
import { getCanvasMediaSchedulerStats, resetCanvasMediaSchedulerForTests } from '../canvasMediaScheduler.js';
import { createWheelPanController } from './WheelPanController.js';

const OWNER = 'wheel-pan';
const END_DELAY_MS = 160;
const RESUME_DELAY_MS = 120;

function createHarness({ acquireResult = { x: 100, y: 200, zoom: 1 }, commitResult = { x: 70, y: 240, zoom: 1 } } = {}) {
  const calls = { acquire: [], update: [], commit: [] };
  const viewportPreview = {
    acquire: (owner, viewport) => {
      calls.acquire.push([owner, viewport]);
      return acquireResult;
    },
    update: (owner, next) => calls.update.push([owner, next]),
    commit: (owner) => {
      calls.commit.push(owner);
      return commitResult;
    },
  };

  const timers = new Map();
  let timerSeq = 0;
  const clearedTimers = [];
  const scheduleTimer = (callback, delayMs) => {
    timerSeq += 1;
    timers.set(timerSeq, { callback, delayMs });
    return timerSeq;
  };
  const clearScheduledTimer = (handle) => {
    clearedTimers.push(handle);
    timers.delete(handle);
  };

  const frames = new Map();
  let frameSeq = 0;
  const cancelFrames = [];
  const requestFrame = (callback) => {
    frameSeq += 1;
    frames.set(frameSeq, callback);
    return frameSeq;
  };
  const cancelFrame = (handle) => {
    cancelFrames.push(handle);
    frames.delete(handle);
  };

  const storeUpdates = [];
  let persistMarks = 0;
  const store = {
    getStateRaw: () => ({ viewport: { x: 10, y: 20, zoom: 1 } }),
    updateViewport: (x, y, zoom) => storeUpdates.push([x, y, zoom]),
    markViewportPersist: () => {
      persistMarks += 1;
    },
  };

  const windowCalls = { sidePlus: [], sidePlusLegacy: [], minimap: [], flush: [], busyMark: 0, busyRelease: 0 };
  const windowObject = {
    _lastMx: 7,
    _lastMy: 9,
    _v2UpdateSidePlusNow: (...args) => windowCalls.sidePlus.push(args),
    _v2UpdateSidePlus: (...args) => windowCalls.sidePlusLegacy.push(args),
    _v2ScheduleMinimapViewportPreview: (...args) => windowCalls.minimap.push(args),
    _v2FlushMinimapViewportPreview: (...args) => windowCalls.flush.push(args),
    v2Renderer: {
      markViewportInteractionBusy: () => {
        windowCalls.busyMark += 1;
      },
      releaseViewportInteractionBusy: () => {
        windowCalls.busyRelease += 1;
      },
    },
  };

  const controller = createWheelPanController({
    store,
    viewportPreview,
    scheduleTimer,
    clearScheduledTimer,
    requestFrame,
    cancelFrame,
  });

  const runTimerByDelay = (delayMs) => {
    for (const [handle, entry] of [...timers]) {
      if (entry.delayMs !== delayMs) continue;
      timers.delete(handle);
      entry.callback();
      return true;
    }
    return false;
  };

  return {
    controller,
    calls,
    storeUpdates,
    windowCalls,
    windowObject,
    timers,
    frames,
    clearedTimers,
    cancelFrames,
    runTimerByDelay,
    persistMarks: () => persistMarks,
  };
}

const withWindow = (windowObject, body) => {
  const original = globalThis.window;
  globalThis.window = windowObject;
  try {
    return body();
  } finally {
    if (original === undefined) delete globalThis.window;
    else globalThis.window = original;
  }
};

test.beforeEach(() => resetCanvasMediaSchedulerForTests());
test.afterEach(() => resetCanvasMediaSchedulerForTests());

test('WheelPanController: 缺少 viewportPreview 的三个方法时直接抛 TypeError', () => {
  assert.throws(() => createWheelPanController(), TypeError);
  assert.throws(() => createWheelPanController({ viewportPreview: {} }), TypeError);
  assert.throws(
    () => createWheelPanController({ viewportPreview: { acquire() {}, update() {} } }),
    (error) => error instanceof TypeError && /viewportPreview is required/.test(error.message),
  );
});

test('WheelPanController: 依赖齐备时返回两个函数', () => {
  const { controller } = createHarness();
  assert.equal(typeof controller.handleWheelPan, 'function');
  assert.equal(typeof controller.settleWheelPan, 'function');
});

test('WheelPanController: 没有实际位移时直接返回 false，不申请预览', () => {
  const harness = createHarness();
  assert.equal(harness.controller.handleWheelPan(0, 0, null), false);
  assert.equal(harness.controller.handleWheelPan(NaN, undefined, null), false);
  assert.deepEqual(harness.calls.acquire, []);
  assert.deepEqual(harness.calls.update, []);
});

test('WheelPanController: 滚动时申请预览、按位移取反更新，并标记忙碌与暂停媒体调度', () => {
  const harness = createHarness();
  withWindow(harness.windowObject, () => {
    assert.equal(harness.controller.handleWheelPan(30, -40, 'target-1'), true);
  });

  assert.deepEqual(harness.calls.acquire, [[OWNER, { x: 10, y: 20, zoom: 1 }]]);
  assert.deepEqual(harness.calls.update, [[OWNER, { x: 70, y: 240, zoom: 1 }]]);
  assert.deepEqual(harness.windowCalls.minimap, [[{ x: 70, y: 240, zoom: 1 }]]);
  assert.equal(harness.windowCalls.busyMark, 1);
  assert.equal(getCanvasMediaSchedulerStats().imagePreloadPaused, true);
  assert.equal(getCanvasMediaSchedulerStats().imagePreloadPausedBypassPriority, 1000);
  assert.equal(harness.timers.size, 1, '只排了一个收尾延时');
  assert.deepEqual([...harness.timers.values()].map((entry) => entry.delayMs), [END_DELAY_MS]);
});

test('WheelPanController: 预览申请失败时不更新预览也不改调度', () => {
  const harness = createHarness({ acquireResult: null });
  withWindow(harness.windowObject, () => {
    assert.equal(harness.controller.handleWheelPan(10, 10, null), false);
  });
  assert.deepEqual(harness.calls.update, []);
  assert.equal(harness.windowCalls.busyMark, 0);
  assert.equal(getCanvasMediaSchedulerStats().imagePreloadPaused, false);
});

test('WheelPanController: 连续滚动只排一帧，帧回调把侧栏推到最新位置一次', () => {
  const harness = createHarness();
  withWindow(harness.windowObject, () => {
    harness.controller.handleWheelPan(10, 0, 'target-1');
    harness.controller.handleWheelPan(10, 0, 'target-2');

    assert.equal(harness.frames.size, 1, '同一帧内的多次滚动合并成一帧');
    const [, callback] = [...harness.frames][0];
    harness.frames.clear();
    callback();
  });

  assert.deepEqual(harness.windowCalls.sidePlus, [[7, 9, { pointerTarget: 'target-2' }]]);
});

test('WheelPanController: 没有 Now 版侧栏更新时回落到旧钩子，两者都没有则静默跳过', () => {
  const harness = createHarness();
  delete harness.windowObject._v2UpdateSidePlusNow;
  withWindow(harness.windowObject, () => {
    harness.controller.handleWheelPan(10, 0, 't');
    [...harness.frames.values()][0]();
  });
  assert.deepEqual(harness.windowCalls.sidePlusLegacy, [[7, 9, { pointerTarget: 't' }]]);

  const silent = createHarness();
  delete silent.windowObject._v2UpdateSidePlusNow;
  delete silent.windowObject._v2UpdateSidePlus;
  withWindow(silent.windowObject, () => {
    silent.controller.handleWheelPan(10, 0, 't');
    assert.doesNotThrow(() => [...silent.frames.values()][0]());
  });
});

test('WheelPanController: 没有 window 时滚动与收尾都不抛错', () => {
  const harness = createHarness();
  const original = globalThis.window;
  delete globalThis.window;
  try {
    assert.equal(harness.controller.handleWheelPan(10, 10, null), true);
    assert.deepEqual(harness.calls.update.length, 1);
    assert.equal(harness.controller.settleWheelPan().x, 70);
  } finally {
    if (original !== undefined) globalThis.window = original;
  }
});

test('WheelPanController: 没滚动过时收尾返回 null', () => {
  const harness = createHarness();
  assert.equal(harness.controller.settleWheelPan(), null);
  assert.deepEqual(harness.calls.commit, []);
  assert.deepEqual(harness.storeUpdates, []);
});

test('WheelPanController: 收尾提交视口、写回 store 并恢复媒体调度', () => {
  const harness = createHarness();
  withWindow(harness.windowObject, () => {
    harness.controller.handleWheelPan(30, -40, 't');
    assert.deepEqual(harness.controller.settleWheelPan(), { x: 70, y: 240, zoom: 1 });
  });

  assert.deepEqual(harness.calls.commit, [OWNER]);
  assert.deepEqual(harness.storeUpdates, [[70, 240, 1]]);
  assert.equal(harness.persistMarks(), 1);
  assert.deepEqual(harness.windowCalls.flush, [[{ x: 70, y: 240, zoom: 1 }]]);
  assert.equal(harness.windowCalls.busyRelease, 1);
  assert.equal(harness.windowCalls.sidePlus.length, 1, '收尾时会顺手把侧栏推到最新位置');

  assert.equal(getCanvasMediaSchedulerStats().imagePreloadPaused, true, '恢复是延时触发的');
  assert.equal(harness.runTimerByDelay(RESUME_DELAY_MS), true);
  assert.equal(getCanvasMediaSchedulerStats().imagePreloadPaused, false);
});

test('WheelPanController: 提交拿不到视口时不写 store，收尾返回 null', () => {
  const harness = createHarness({ commitResult: null });
  withWindow(harness.windowObject, () => {
    harness.controller.handleWheelPan(30, -40, 't');
    assert.equal(harness.controller.settleWheelPan(), null);
  });
  assert.deepEqual(harness.storeUpdates, []);
  assert.equal(harness.persistMarks(), 0);
  assert.deepEqual(harness.windowCalls.flush, []);
});

test('WheelPanController: 收尾延时到期会自动收尾一次', () => {
  const harness = createHarness();
  withWindow(harness.windowObject, () => {
    harness.controller.handleWheelPan(30, -40, 't');
    assert.equal(harness.runTimerByDelay(END_DELAY_MS), true);
  });
  assert.deepEqual(harness.calls.commit, [OWNER]);
  assert.deepEqual(harness.storeUpdates, [[70, 240, 1]]);
});

test('WheelPanController: 再次滚动会取消旧的收尾延时', () => {
  const harness = createHarness();
  withWindow(harness.windowObject, () => {
    harness.controller.handleWheelPan(10, 0, 'a');
    const firstEndTimer = [...harness.timers.values()].find((entry) => entry.delayMs === END_DELAY_MS);
    assert.ok(firstEndTimer);
    harness.controller.handleWheelPan(10, 0, 'b');
  });
  assert.equal(harness.clearedTimers.length, 1, '只清掉了旧的收尾延时');
  assert.equal(harness.timers.size, 1);
});
