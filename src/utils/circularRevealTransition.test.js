import test from 'node:test';
import assert from 'node:assert/strict';

import { runCircularRevealTransition } from './circularRevealTransition.js';

function createTransitionHarness({ reducedMotion = false, throwOnStart = false } = {}) {
  const classNames = new Set();
  const animations = [];
  let updateCallback = null;
  let resolveReady;
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });
  const viewTransition = { ready, finished: Promise.resolve() };
  const documentElement = {
    classList: {
      add(name) {
        classNames.add(name);
      },
      remove(name) {
        classNames.delete(name);
      },
    },
    animate(keyframes, options) {
      animations.push({ keyframes, options });
      return { finished: Promise.resolve() };
    },
  };
  const documentObject = {
    documentElement,
    startViewTransition(callback) {
      if (throwOnStart) throw new Error('unsupported');
      updateCallback = callback;
      return viewTransition;
    },
  };
  const windowObject = {
    innerWidth: 400,
    innerHeight: 300,
    matchMedia() {
      return { matches: reducedMotion };
    },
  };
  return {
    classNames,
    animations,
    documentObject,
    windowObject,
    viewTransition,
    resolveReady,
    runUpdate() {
      return updateCallback?.();
    },
    get updateCallback() {
      return updateCallback;
    },
  };
}

test('circularRevealTransition: falls back immediately for reduced motion', () => {
  const harness = createTransitionHarness({ reducedMotion: true });
  let applyCalls = 0;
  const result = runCircularRevealTransition({
    apply: () => {
      applyCalls += 1;
    },
    documentObject: harness.documentObject,
    windowObject: harness.windowObject,
  });

  assert.equal(result, null);
  assert.equal(applyCalls, 1);
  assert.equal(harness.updateCallback, null);
});

test('circularRevealTransition: applies once and animates from the event point', async () => {
  const harness = createTransitionHarness();
  let applyCalls = 0;
  const pending = runCircularRevealTransition({
    event: { clientX: 100, clientY: 75 },
    apply: () => {
      applyCalls += 1;
    },
    documentObject: harness.documentObject,
    windowObject: harness.windowObject,
    duration: 321,
    easing: 'linear',
    rootClassName: 'reveal-active',
  });

  assert.equal(harness.classNames.has('reveal-active'), true);
  assert.equal(harness.runUpdate(), undefined);
  assert.equal(harness.runUpdate(), undefined);
  assert.equal(applyCalls, 1);

  harness.resolveReady();
  await pending;
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(harness.classNames.has('reveal-active'), false);
  assert.equal(harness.animations.length, 1);
  assert.deepEqual(harness.animations[0].options, {
    duration: 321,
    easing: 'linear',
    pseudoElement: '::view-transition-new(root)',
  });
  assert.match(harness.animations[0].keyframes.clipPath[0], /^circle\(0px at 25% 25%\)$/);
  assert.match(harness.animations[0].keyframes.clipPath[1], /^circle\([0-9.]+% at 25% 25%\)$/);
});

test('circularRevealTransition: recovers from startViewTransition failures', () => {
  const harness = createTransitionHarness({ throwOnStart: true });
  let applyCalls = 0;
  const result = runCircularRevealTransition({
    apply: () => {
      applyCalls += 1;
    },
    documentObject: harness.documentObject,
    windowObject: harness.windowObject,
    rootClassName: 'reveal-active',
  });

  assert.equal(result, null);
  assert.equal(applyCalls, 1);
  assert.equal(harness.classNames.has('reveal-active'), false);
});
