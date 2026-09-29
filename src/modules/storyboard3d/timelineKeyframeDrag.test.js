import test from 'node:test';
import assert from 'node:assert/strict';

import { TimelineKeyframeDrag } from './timelineKeyframeDrag.js';

function createEventTarget() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    removeEventListener(type, handler) {
      if (listeners.get(type) === handler) listeners.delete(type);
    },
    dispatch(type, event) {
      listeners.get(type)?.(event);
    },
  };
}

function createFixture() {
  const roots = [createEventTarget(), createEventTarget()];
  const fakeWindow = createEventTarget();
  fakeWindow.AbortController = AbortController;
  roots.forEach((root) => {
    root.ownerDocument = { defaultView: fakeWindow };
    root.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40 });
  });

  const animation = {
    duration: 4,
    fps: 24,
    loop: false,
    cameraKeyframes: [
      {
        id: 'camera-a',
        time: 0,
        camera: {
          position: [5, 4, 7],
          target: [0, 1.2, 0],
          focalLength: 35,
          near: 0.1,
          far: 1000,
          aspectRatio: '16:9',
        },
      },
    ],
    objectTracks: [],
    actionClips: [],
    cameraConstraintClips: [],
    motionClips: [],
  };
  const shot = { id: 'shot-a', animation };
  const samples = [];
  const mutations = [];
  const messages = [];
  let root = roots[0];
  let renders = 0;
  const key = createEventTarget();
  key.dataset = {
    keyframeId: 'camera-a',
    keyframeTime: '0',
    keyframeType: 'camera',
    objectId: '',
    property: '',
  };
  const lane = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 40 }),
  };
  key.closest = (selector) => {
    if (selector === '[data-keyframe-id]') return key;
    if (selector === '.storyboard-3d-timeline-lane') return lane;
    return null;
  };
  let capturedPointer = null;
  key.style = {
    values: {},
    setProperty(name, value) {
      this.values[name] = value;
    },
  };
  key.setPointerCapture = (pointerId) => {
    capturedPointer = pointerId;
  };
  key.hasPointerCapture = (pointerId) => capturedPointer === pointerId;
  key.releasePointerCapture = (pointerId) => {
    if (capturedPointer === pointerId) capturedPointer = null;
  };

  const timeline = {
    getRoot: () => root,
    _context: () => ({ scene: { id: 'scene-a' }, shot }),
    _sampleAt: (time) => samples.push(time),
    _mutateAnimation(type, label, mutate) {
      mutations.push([type, label]);
      shot.animation = mutate(shot.animation);
    },
    stopPlayback() {},
    requestRender() {
      renders += 1;
    },
    setMessage(message) {
      messages.push(message);
    },
    editing: {
      selected: new Set(['camera:::camera-a']),
      identity: () => 'camera:::camera-a',
      snapTime: (time) => time,
    },
  };
  const drag = new TimelineKeyframeDrag(timeline);
  return {
    drag,
    fakeWindow,
    getAnimation: () => shot.animation,
    getRenders: () => renders,
    key,
    messages,
    mutations,
    roots,
    samples,
    setRoot(value) {
      root = value;
    },
  };
}

test('timelineKeyframeDrag: binds and rebinds root pointer handlers', () => {
  const fixture = createFixture();
  fixture.drag.bind();
  const firstHandler = fixture.roots[0].listeners.get('pointerdown');
  assert.equal(typeof firstHandler, 'function');

  fixture.setRoot(fixture.roots[1]);
  fixture.drag.bind();
  assert.equal(fixture.roots[0].listeners.has('pointerdown'), false);
  assert.equal(typeof fixture.roots[1].listeners.get('pointerdown'), 'function');
  fixture.drag.destroy();
  assert.equal(fixture.roots[1].listeners.has('pointerdown'), false);
});

test('timelineKeyframeDrag: drags a selected camera keyframe and consumes the click', () => {
  const fixture = createFixture();
  fixture.drag.bind();

  fixture.drag.start({
    target: fixture.key,
    button: 0,
    pointerId: 7,
    clientX: 0,
    clientY: 0,
  });
  assert.equal(fixture.drag.session.pointerId, 7);
  assert.equal(fixture.drag.session.moved, false);

  fixture.fakeWindow.dispatch('pointermove', {
    pointerId: 7,
    clientX: 50,
    clientY: 0,
    altKey: false,
    preventDefault() {},
  });
  assert.equal(fixture.drag.session.moved, true);
  assert.equal(fixture.samples.at(-1), 2);
  assert.equal(
    fixture.key.style.values['--storyboard-3d-keyframe-position'],
    '50%',
  );

  fixture.fakeWindow.dispatch('pointerup', {
    pointerId: 7,
    clientX: 50,
    clientY: 0,
  });
  assert.equal(fixture.getAnimation().cameraKeyframes[0].time, 2);
  assert.equal(fixture.mutations.at(-1)[0], 'move-keyframe');
  assert.equal(fixture.getRenders(), 1);
  assert.deepEqual(fixture.messages, []);
  assert.equal(fixture.drag.consumeClick({ detail: 1 }), true);
  assert.equal(fixture.drag.consumeClick({ detail: 1 }), false);
});

test('timelineKeyframeDrag: cancels an active drag and restores the original position', () => {
  const fixture = createFixture();
  fixture.drag.bind();
  fixture.drag.start({
    target: fixture.key,
    button: 0,
    pointerId: 3,
    clientX: 0,
    clientY: 0,
  });
  fixture.fakeWindow.dispatch('pointermove', {
    pointerId: 3,
    clientX: 75,
    clientY: 0,
    altKey: false,
    preventDefault() {},
  });
  fixture.drag.cancel();

  assert.equal(fixture.drag.session, null);
  assert.equal(
    fixture.key.style.values['--storyboard-3d-keyframe-position'],
    '0%',
  );
  assert.equal(fixture.getAnimation().cameraKeyframes[0].time, 0);
  fixture.drag.destroy();
});
