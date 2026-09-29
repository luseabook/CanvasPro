import test from 'node:test';
import assert from 'node:assert/strict';

import { createPromptExpansionMotion } from './promptExpansionMotion.js';

function createAnimation() {
  let resolveFinished;
  const finished = new Promise((resolve) => {
    resolveFinished = resolve;
  });
  return {
    cancelCalls: 0,
    finished,
    resolveFinished,
    cancel() {
      this.cancelCalls += 1;
    },
  };
}

function createMotionHarness({ reducedMotion = false } = {}) {
  const animations = [];
  const view = {
    getComputedStyle: () => ({ opacity: '0.4' }),
    matchMedia: () => ({ matches: reducedMotion }),
  };
  const element = {
    ownerDocument: { defaultView: view },
    getBoundingClientRect: () => ({ x: 10, y: 20, width: 100, height: 50 }),
    animate(keyframes, options) {
      const animation = createAnimation();
      animations.push({ target: this, keyframes, options, animation });
      return animation;
    },
  };
  return { element, animations };
}

test('promptExpansionMotion: finishes immediately when reduced motion is enabled', () => {
  const harness = createMotionHarness({ reducedMotion: true });
  let finished = 0;
  createPromptExpansionMotion(harness.element).play(
    { x: 0, y: 0, width: 200, height: 100 },
    { x: 30, y: 40, width: 200, height: 100 },
    {
      onFinish: () => {
        finished += 1;
      },
    },
  );

  assert.equal(finished, 1);
  assert.equal(harness.animations.length, 0);
});

test('promptExpansionMotion: animates from the source box to the target box and finishes', async () => {
  const harness = createMotionHarness();
  const overlay = {
    animate(keyframes, options) {
      const animation = createAnimation();
      harness.animations.push({ target: this, keyframes, options, animation });
      return animation;
    },
  };
  let finished = 0;
  const motion = createPromptExpansionMotion(harness.element);

  motion.play(
    { x: 0, y: 0, width: 200, height: 100 },
    { x: 30, y: 40, width: 300, height: 150 },
    {
      overlay,
      onFinish: () => {
        finished += 1;
      },
    },
  );

  assert.equal(harness.animations.length, 2);
  const [{ keyframes, options, animation }, overlayAnimation] = harness.animations;
  assert.deepEqual(keyframes[0], {
    transform: 'translate(-10px, -20px) scale(2, 2)',
    transformOrigin: '0 0',
    filter: 'blur(0px)',
  });
  assert.deepEqual(keyframes[2], {
    transform: 'translate(20px, 20px) scale(3, 3)',
    transformOrigin: '0 0',
    filter: 'blur(0px)',
  });
  assert.equal(options.duration, 320);
  assert.deepEqual(overlayAnimation.keyframes, { opacity: [0, 1] });
  assert.equal(overlayAnimation.options, options);

  animation.resolveFinished();
  await Promise.resolve();
  assert.equal(finished, 1);
});

test('promptExpansionMotion: skips animation when required dimensions are unavailable', () => {
  const harness = createMotionHarness();
  harness.element.getBoundingClientRect = () => ({ x: 0, y: 0, width: 0, height: 0 });
  let finished = 0;
  createPromptExpansionMotion(harness.element).play({ x: 0, y: 0, width: 200, height: 100 }, null, {
    onFinish: () => {
      finished += 1;
    },
  });

  assert.equal(finished, 1);
  assert.equal(harness.animations.length, 0);
});
