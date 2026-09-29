import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cancelPersonReplacementSlideTransition,
  startPersonReplacementSlideTransition,
} from './personReplacementSlideTransition.js';

const PREFIX = 'person-replacement-slide-';
const EASING = 'cubic-bezier(0.22, 0.72, 0.2, 1)';

function makeSlide({ canAnimate = true, animations = [] } = {}) {
  const calls = [];
  const created = [];
  const slide = {
    calls,
    created,
    animations,
    getAnimations: () => animations,
  };
  if (canAnimate) {
    slide.animate = (keyframes, options) => {
      calls.push({ keyframes, options });
      const animation = {
        id: '',
        cancelCount: 0,
        cancel() {
          this.cancelCount += 1;
        },
      };
      created.push(animation);
      return animation;
    };
  }
  return slide;
}

function taggedAnimation() {
  return {
    id: PREFIX + 'incoming',
    cancelCount: 0,
    cancel() {
      this.cancelCount += 1;
    },
  };
}

test('starts an incoming slide animation with the shared duration and easing', () => {
  const incoming = makeSlide();
  const handle = startPersonReplacementSlideTransition({ incomingSlide: incoming });

  assert.equal(handle.duration, 380);
  assert.equal(incoming.calls.length, 1);
  assert.deepEqual(incoming.calls[0].keyframes, [
    { transform: 'translate3d(100%, 0, 0)' },
    { transform: 'translate3d(0, 0, 0)' },
  ]);
  assert.deepEqual(incoming.calls[0].options, { duration: 380, easing: EASING, fill: 'both' });
  assert.equal(handle.incomingAnimation.id, PREFIX + 'incoming');
  assert.equal(handle.outgoingAnimation, null);
});

test('tags the outgoing animation separately and reverses its direction', () => {
  const incoming = makeSlide();
  const outgoing = makeSlide();
  const handle = startPersonReplacementSlideTransition({
    incomingSlide: incoming,
    outgoingSlide: outgoing,
    direction: 'next',
  });

  assert.equal(handle.outgoingAnimation.id, PREFIX + 'outgoing');
  assert.deepEqual(outgoing.calls[0].keyframes, [
    { transform: 'translate3d(0, 0, 0)' },
    { transform: 'translate3d(-100%, 0, 0)' },
  ]);
});

test('previous direction mirrors the translation of both slides', () => {
  const incoming = makeSlide();
  const outgoing = makeSlide();
  startPersonReplacementSlideTransition({
    incomingSlide: incoming,
    outgoingSlide: outgoing,
    direction: 'previous',
  });

  assert.deepEqual(incoming.calls[0].keyframes, [
    { transform: 'translate3d(-100%, 0, 0)' },
    { transform: 'translate3d(0, 0, 0)' },
  ]);
  assert.deepEqual(outgoing.calls[0].keyframes, [
    { transform: 'translate3d(0, 0, 0)' },
    { transform: 'translate3d(100%, 0, 0)' },
  ]);
});

test('reduced motion collapses the duration to zero but still animates', () => {
  const incoming = makeSlide();
  const queries = [];
  const handle = startPersonReplacementSlideTransition({
    windowObject: {
      matchMedia: (query) => {
        queries.push(query);
        return { matches: true };
      },
    },
    incomingSlide: incoming,
  });

  assert.deepEqual(queries, ['(prefers-reduced-motion: reduce)']);
  assert.equal(handle.duration, 0);
  assert.equal(incoming.calls[0].options.duration, 0);
});

test('a missing window or non-matching query keeps the full duration', () => {
  assert.equal(startPersonReplacementSlideTransition({ incomingSlide: makeSlide() }).duration, 380);
  assert.equal(
    startPersonReplacementSlideTransition({
      windowObject: { matchMedia: () => ({ matches: false }) },
      incomingSlide: makeSlide(),
    }).duration,
    380,
  );
});

test('cancels previously tagged animations on both slides before starting', () => {
  const staleIncoming = taggedAnimation();
  const unrelated = {
    id: 'other-animation',
    cancelCount: 0,
    cancel() {
      this.cancelCount += 1;
    },
  };
  const staleOutgoing = {
    id: PREFIX + 'outgoing',
    cancelCount: 0,
    cancel() {
      this.cancelCount += 1;
    },
  };
  const incoming = makeSlide({ animations: [staleIncoming, unrelated] });
  const outgoing = makeSlide({ animations: [staleOutgoing] });

  startPersonReplacementSlideTransition({ incomingSlide: incoming, outgoingSlide: outgoing });

  assert.equal(staleIncoming.cancelCount, 1);
  assert.equal(unrelated.cancelCount, 0);
  assert.equal(staleOutgoing.cancelCount, 1);
});

test('elements without an animate method yield null animations but a resolved finish', async () => {
  const handle = startPersonReplacementSlideTransition({
    incomingSlide: makeSlide({ canAnimate: false }),
    outgoingSlide: makeSlide({ canAnimate: false }),
  });

  assert.equal(handle.incomingAnimation, null);
  assert.equal(handle.outgoingAnimation, null);
  await handle.finished;
});

test('a missing incoming slide degrades to a resolved finish', async () => {
  const handle = startPersonReplacementSlideTransition({});

  assert.equal(handle.incomingAnimation, null);
  assert.equal(handle.duration, 380);
  await handle.finished;
});

test('the finished promise swallows a rejected animation', async () => {
  const incoming = makeSlide();
  incoming.animate = () => {
    const animation = { id: '', cancel() {} };
    animation.finished = Promise.reject(new Error('aborted'));
    return animation;
  };
  const handle = startPersonReplacementSlideTransition({ incomingSlide: incoming });

  await handle.finished;
});

test('cancels whichever animations the handle carries', () => {
  const incomingAnimation = {
    cancelCount: 0,
    cancel() {
      this.cancelCount += 1;
    },
  };
  const outgoingAnimation = {
    cancelCount: 0,
    cancel() {
      this.cancelCount += 1;
    },
  };

  cancelPersonReplacementSlideTransition({ incomingAnimation, outgoingAnimation });

  assert.equal(incomingAnimation.cancelCount, 1);
  assert.equal(outgoingAnimation.cancelCount, 1);
});

test('cancelling an incomplete handle is a no-op', () => {
  assert.doesNotThrow(() => cancelPersonReplacementSlideTransition({}));
  assert.doesNotThrow(() => cancelPersonReplacementSlideTransition(null));
  assert.doesNotThrow(() => cancelPersonReplacementSlideTransition());
});
