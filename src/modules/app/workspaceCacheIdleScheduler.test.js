import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWorkspaceCacheIdleScheduler,
  isWorkspaceCacheInteractionBusy,
} from './workspaceCacheIdleScheduler.js';

function classList(names = []) {
  const set = new Set(names);
  return {
    contains: (name) => set.has(name),
  };
}

function documentLike(over = {}) {
  return {
    body: 'body' in over ? over.body : { classList: classList(over.bodyClasses) },
    documentElement:
      'documentElement' in over ? over.documentElement : { classList: classList(over.rootClasses) },
    getElementById: 'getElementById' in over ? over.getElementById : () => null,
    ...(over.canvasClasses ? { getElementById: () => ({ classList: classList(over.canvasClasses) }) } : {}),
  };
}

test('an idle document reports no interaction', () => {
  assert.equal(isWorkspaceCacheInteractionBusy({ documentRef: documentLike() }), false);
  assert.equal(isWorkspaceCacheInteractionBusy({ documentRef: {} }), false);
  assert.equal(isWorkspaceCacheInteractionBusy({ documentRef: null }), false);
});

test('the canvas tab manager hook wins outright', () => {
  let consulted = 0;
  const busy = isWorkspaceCacheInteractionBusy({
    documentRef: documentLike({ bodyClasses: ['is-dragging'] }),
    CanvasTabManager: {
      _isVisualSnapshotInteractionBusy() {
        consulted += 1;
        return true;
      },
    },
  });
  assert.equal(busy, true);
  assert.equal(consulted, 1);
  assert.equal(
    isWorkspaceCacheInteractionBusy({ CanvasTabManager: { _isVisualSnapshotInteractionBusy: () => false } }),
    false,
  );
});

test('every busy class on the body counts', () => {
  for (const name of [
    'is-dragging',
    'is-panning',
    'is-zooming',
    'is-viewport-animating',
    'pick-connect-active',
  ]) {
    assert.equal(
      isWorkspaceCacheInteractionBusy({ documentRef: documentLike({ bodyClasses: [name] }) }),
      true,
    );
  }
});

test('the connecting-mode and canvas classes count too', () => {
  assert.equal(
    isWorkspaceCacheInteractionBusy({ documentRef: documentLike({ rootClasses: ['is-connecting-mode'] }) }),
    true,
  );
  assert.equal(
    isWorkspaceCacheInteractionBusy({ documentRef: documentLike({ canvasClasses: ['is-connecting'] }) }),
    true,
  );
  assert.equal(
    isWorkspaceCacheInteractionBusy({ documentRef: documentLike({ canvasClasses: ['other'] }) }),
    false,
  );
});

test('the busy check defaults to the global document', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    writable: true,
    value: documentLike({ bodyClasses: ['is-panning'] }),
  });
  try {
    assert.equal(isWorkspaceCacheInteractionBusy(), true);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  }
});

function harness(over = {}) {
  const log = { timeouts: [], idles: [], cleared: [], cancelled: [], unrefs: 0, runs: 0, errors: [] };
  const timeoutJobs = new Map();
  const idleJobs = new Map();
  let nextId = 1;
  const run = over.run || (() => {});
  const controller = createWorkspaceCacheIdleScheduler({
    run: () => {
      log.runs += 1;
      return run();
    },
    isBusy: over.isBusy || (() => false),
    onError: over.onError || ((error) => log.errors.push(error)),
    ...('retryDelayMs' in over ? { retryDelayMs: over.retryDelayMs } : {}),
    ...('minIdleBudgetMs' in over ? { minIdleBudgetMs: over.minIdleBudgetMs } : {}),
    ...('idleTimeoutMs' in over ? { idleTimeoutMs: over.idleTimeoutMs } : {}),
    setTimeoutFn:
      'setTimeoutFn' in over
        ? over.setTimeoutFn
        : (callback, delay) => {
            const id = nextId++;
            timeoutJobs.set(id, callback);
            log.timeouts.push({ id, delay });
            return {
              id,
              unref() {
                log.unrefs += 1;
              },
            };
          },
    clearTimeoutFn:
      'clearTimeoutFn' in over
        ? over.clearTimeoutFn
        : (handle) => {
            log.cleared.push(handle?.id);
            timeoutJobs.delete(handle?.id);
          },
    requestIdleCallbackFn:
      'requestIdleCallbackFn' in over
        ? over.requestIdleCallbackFn
        : (callback, options) => {
            const id = nextId++;
            idleJobs.set(id, callback);
            log.idles.push({ id, options });
            return { id };
          },
    cancelIdleCallbackFn:
      'cancelIdleCallbackFn' in over
        ? over.cancelIdleCallbackFn
        : (handle) => {
            log.cancelled.push(handle?.id);
            idleJobs.delete(handle?.id);
          },
  });
  return {
    controller,
    log,
    timeoutJobs,
    idleJobs,
    fireTimeout(id) {
      const callback = timeoutJobs.get(id);
      if (!callback) return false;
      timeoutJobs.delete(id);
      callback();
      return true;
    },
    fireIdle(id, deadline) {
      const callback = idleJobs.get(id);
      if (!callback) return false;
      idleJobs.delete(id);
      callback(deadline);
      return true;
    },
  };
}

test('schedule returns an increasing token and marks itself pending', () => {
  const ctx = harness();
  assert.equal(ctx.controller.getGeneration(), 0);
  assert.equal(ctx.controller.isPending(), false);
  const token = ctx.controller.schedule();
  assert.equal(token, 1);
  assert.equal(ctx.controller.getGeneration(), 1);
  assert.equal(ctx.controller.isPending(), true);
  assert.equal(ctx.controller.schedule(), 2);
  assert.equal(ctx.controller.isPending(), true);
});

test('the whole chain runs through a healthy idle slot', () => {
  const ctx = harness();
  ctx.controller.schedule();
  assert.deepEqual(ctx.log.timeouts, [{ id: 1, delay: 0 }]);
  assert.equal(ctx.log.unrefs, 1);
  ctx.fireTimeout(1);
  assert.deepEqual(ctx.log.idles, [{ id: 2, options: { timeout: 1500 } }]);
  ctx.fireIdle(2, { didTimeout: false, timeRemaining: () => 50 });
  assert.equal(ctx.log.runs, 1);
  assert.equal(ctx.controller.isPending(), false);
});

test('a timed-out idle slot retries on the retry delay', () => {
  const ctx = harness();
  ctx.controller.schedule();
  ctx.fireTimeout(1);
  ctx.fireIdle(2, { didTimeout: true });
  assert.equal(ctx.log.runs, 0);
  assert.equal(ctx.log.timeouts.length, 2);
  assert.equal(ctx.log.timeouts[1].delay, 250);
  assert.equal(ctx.controller.isPending(), true);
});

test('too little remaining budget also retries', () => {
  const ctx = harness();
  ctx.controller.schedule();
  ctx.fireTimeout(1);
  ctx.fireIdle(2, { didTimeout: false, timeRemaining: () => 11 });
  assert.equal(ctx.log.runs, 0);
  assert.equal(ctx.log.timeouts[1].delay, 250);
  const ctx2 = harness();
  ctx2.controller.schedule();
  ctx2.fireTimeout(1);
  ctx2.fireIdle(2, { didTimeout: false, timeRemaining: () => 12 });
  assert.equal(ctx2.log.runs, 1);
});

test('a slot without timeRemaining is treated as having budget', () => {
  const ctx = harness();
  ctx.controller.schedule();
  ctx.fireTimeout(1);
  ctx.fireIdle(2, {});
  assert.equal(ctx.log.runs, 1);
  const ctx2 = harness();
  ctx2.controller.schedule();
  ctx2.fireTimeout(1);
  ctx2.fireIdle(2, null);
  assert.equal(ctx2.log.runs, 1);
});

test('a busy document defers the run', () => {
  const ctx = harness({ isBusy: () => true });
  ctx.controller.schedule();
  ctx.fireTimeout(1);
  ctx.fireIdle(2, { timeRemaining: () => 100 });
  assert.equal(ctx.log.runs, 0);
  assert.equal(ctx.log.timeouts[1].delay, 250);
});

test('without requestIdleCallback a zero-delay timeout stands in', () => {
  const ctx = harness({ requestIdleCallbackFn: undefined });
  ctx.controller.schedule();
  assert.deepEqual(ctx.log.timeouts, [{ id: 1, delay: 0 }]);
  assert.equal(ctx.log.unrefs, 1);
  assert.equal(ctx.log.runs, 0);
  ctx.fireTimeout(1);
  assert.deepEqual(ctx.log.timeouts[1], { id: 2, delay: 0 });
  assert.equal(ctx.log.unrefs, 2);
  ctx.fireTimeout(2);
  assert.equal(ctx.log.runs, 1);
});

test('with no timer facilities at all the run happens inline', () => {
  const ctx = harness({ setTimeoutFn: null, requestIdleCallbackFn: null });
  const token = ctx.controller.schedule();
  assert.equal(token, 1);
  assert.equal(ctx.log.runs, 1);
  assert.equal(ctx.controller.isPending(), false);
});

test('cancel clears both pending handles', () => {
  const ctx = harness();
  ctx.controller.schedule();
  ctx.controller.cancel();
  assert.equal(ctx.controller.isPending(), false);
  assert.deepEqual(ctx.log.cleared, [1]);
  assert.equal(ctx.controller.getGeneration(), 2);
});

test('cancel also clears a registered idle slot', () => {
  const ctx = harness();
  ctx.controller.schedule();
  ctx.fireTimeout(1);
  ctx.controller.cancel();
  assert.deepEqual(ctx.log.cancelled, [2]);
});

test('a superseded slot callback is ignored', () => {
  const captured = [];
  const ctx = harness({
    requestIdleCallbackFn: (callback, options) => {
      captured.push({ callback, options });
      return { id: captured.length };
    },
  });
  ctx.controller.schedule();
  ctx.fireTimeout(1);
  ctx.controller.schedule();
  assert.equal(captured.length, 1);
  captured[0].callback({ timeRemaining: () => 100 });
  assert.equal(ctx.log.runs, 0);
});

test('a throwing run is reported to onError', () => {
  const failure = new Error('boom');
  const ctx = harness({
    run: () => {
      throw failure;
    },
  });
  ctx.controller.schedule();
  ctx.fireTimeout(1);
  ctx.fireIdle(2, null);
  assert.deepEqual(ctx.log.errors, [failure]);
  assert.equal(ctx.controller.isPending(), false);
});

test('a rejecting run is reported to onError', async () => {
  const failure = new Error('async boom');
  const ctx = harness({ run: () => Promise.reject(failure) });
  ctx.controller.schedule();
  ctx.fireTimeout(1);
  ctx.fireIdle(2, null);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(ctx.log.errors, [failure]);
  assert.equal(ctx.controller.isPending(), false);
});

test('a plain return value from run is ignored', async () => {
  const ctx = harness({ run: () => ({ ok: true }) });
  ctx.controller.schedule();
  ctx.fireTimeout(1);
  ctx.fireIdle(2, null);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(ctx.log.errors.length, 0);
  assert.equal(ctx.log.runs, 1);
});

test('invalid delay options normalise to the built-in defaults', () => {
  const ctx = harness({ retryDelayMs: -5 });
  ctx.controller.schedule({ delayMs: 0 });
  ctx.fireTimeout(1);
  ctx.fireIdle(2, { didTimeout: true });
  assert.equal(ctx.log.timeouts[1].delay, 250);
  const nan = harness({ retryDelayMs: Number.NaN });
  nan.controller.schedule();
  nan.fireTimeout(1);
  nan.fireIdle(2, { didTimeout: true });
  assert.equal(nan.log.timeouts[1].delay, 250);
});

test('a zero retry delay is accepted', () => {
  const ctx = harness({ retryDelayMs: 0 });
  ctx.controller.schedule();
  ctx.fireTimeout(1);
  ctx.fireIdle(2, { didTimeout: true });
  assert.equal(ctx.log.timeouts[1].delay, 0);
});

test('a custom idle timeout reaches the idle callback options', () => {
  const ctx = harness({ idleTimeoutMs: 900 });
  ctx.controller.schedule();
  ctx.fireTimeout(1);
  assert.deepEqual(ctx.log.idles, [{ id: 2, options: { timeout: 900 } }]);
});

test('a custom minimum budget tightens the check', () => {
  const ctx = harness({ minIdleBudgetMs: 40 });
  ctx.controller.schedule();
  ctx.fireTimeout(1);
  ctx.fireIdle(2, { timeRemaining: () => 20 });
  assert.equal(ctx.log.runs, 0);
  const ctx2 = harness({ minIdleBudgetMs: 40 });
  ctx2.controller.schedule();
  ctx2.fireTimeout(1);
  ctx2.fireIdle(2, { timeRemaining: () => 41 });
  assert.equal(ctx2.log.runs, 1);
});

test('the schedule token controls its own timer', () => {
  const ctx = harness();
  const token = ctx.controller.schedule({ delayMs: 40 });
  assert.equal(token, 1);
  assert.deepEqual(ctx.log.timeouts, [{ id: 1, delay: 40 }]);
  assert.equal(ctx.controller.isPending(), true);
});

test('the controller surface is frozen', () => {
  const ctx = harness();
  assert.ok(Object.isFrozen(ctx.controller));
  assert.deepEqual(Object.keys(ctx.controller).sort(), ['cancel', 'getGeneration', 'isPending', 'schedule']);
});
