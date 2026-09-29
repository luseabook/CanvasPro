import test from 'node:test';
import assert from 'node:assert/strict';

import { DirectorTimelineEditing } from './directorTimelineEditing.js';

function createAnimation() {
  const camera = {
    position: [5, 4, 7],
    target: [0, 1.2, 0],
    focalLength: 35,
    near: 0.1,
    far: 1000,
    aspectRatio: '16:9',
  };
  return {
    duration: 4,
    fps: 24,
    loop: false,
    cameraKeyframes: [
      { id: 'camera-a', time: 0, camera, easing: 'ease-in-out' },
      { id: 'camera-b', time: 2, camera: { ...camera, position: [4, 4, 7] } },
    ],
    objectTracks: [
      {
        objectId: 'hero',
        positionKeyframes: [{ id: 'hero-a', time: 1, value: [0, 0, 0] }],
        rotationKeyframes: [],
        scaleKeyframes: [],
      },
    ],
    actionClips: [],
    cameraConstraintClips: [],
    motionClips: [],
  };
}

function createHarness() {
  const shot = { id: 'shot-a', animation: createAnimation() };
  const scene = {
    id: 'scene-a',
    objects: [
      { id: 'hero', type: 'character', name: 'Hero', transform: { position: [0, 0, 0] } },
      { id: 'prop', type: 'prop', name: 'Prop', transform: { position: [1, 0, 0] } },
    ],
  };
  const mutations = [];
  const samples = [];
  let selectedKeyframe = null;
  let renders = 0;
  const timeline = {
    playbackRate: 1.5,
    selectedKeyframe,
    clips: { handleKey: () => false },
    isDrawerOpen: () => true,
    multiView: { layer: null },
    getRoot: () => null,
    _context: () => ({ shot, scene }),
    _timeForShot: () => 1,
    _sampleAt: (time) => samples.push(time),
    _mutateAnimation(type, label, mutate) {
      mutations.push([type, label]);
      shot.animation = mutate(shot.animation);
    },
    syncPreview() {},
    requestRender() {
      renders += 1;
    },
    stopPlayback() {},
    setMessage() {},
  };
  const controller = new DirectorTimelineEditing(timeline);
  return {
    controller,
    getAnimation: () => shot.animation,
    getRenders: () => renders,
    mutations,
    samples,
    setSelectedKeyframe(value) {
      selectedKeyframe = value;
      timeline.selectedKeyframe = value;
    },
  };
}

function target(matchesSelector, dataset = {}, values = {}) {
  return {
    target: {
      matches: (selector) => selector.split(',').map((part) => part.trim()).includes(matchesSelector),
      closest: () => null,
      dataset,
      value: '',
      checked: false,
      type: 'text',
      ...values,
    },
  };
}

test('directorTimelineEditing: renders transport, unit, and batch controls', () => {
  const harness = createHarness();
  const html = harness.controller.render();

  assert.match(html, /data-timeline-editing/);
  assert.match(html, /data-timeline-rate/);
  assert.match(html, /<option value="1.5" selected>1.5/);
  assert.match(html, /data-timeline-unit/);
  assert.match(html, /data-storyboard-3d-action="timeline-edit-prev"/);
  assert.match(html, /data-timeline-snap checked/);
  assert.match(html, /data-timeline-batch-target/);
  assert.match(html, /data-timeline-selected-count>0/);
});

test('directorTimelineEditing: handles transport and editing commands', () => {
  const harness = createHarness();
  const { controller } = harness;

  assert.equal(controller.handleClick('timeline-edit-prev'), true);
  assert.equal(controller.handleClick('timeline-edit-next'), true);
  assert.equal(harness.samples.length, 2);
  assert.ok(Math.abs(harness.samples[0] - (1 - 1 / 24)) < 1e-9);
  assert.ok(Math.abs(harness.samples[1] - (1 + 1 / 24)) < 1e-9);

  assert.equal(controller.handleClick('timeline-edit-select-all'), true);
  assert.equal(controller.selected.size, 3);
  assert.equal(controller.handleClick('timeline-edit-copy'), true);
  assert.equal(controller.clipboard.length, 3);
  assert.equal(controller.handleClick('timeline-edit-paste'), true);
  assert.equal(harness.mutations.at(-1)[0], 'timeline-edit');
  assert.equal(harness.getRenders(), 5);

  controller.zoom = 2;
  controller.handleClick('timeline-edit-zoom-in');
  controller.handleClick('timeline-edit-zoom-out');
  controller.handleClick('timeline-edit-fit');
  assert.equal(controller.zoom, 1);
});

test('directorTimelineEditing: changes rate, unit, snapping, and selected shifts', () => {
  const harness = createHarness();
  const { controller } = harness;

  assert.equal(
    controller.handleChange(
      target('[data-timeline-rate]', {}, { type: 'number', value: '2' }),
    ),
    true,
  );
  assert.equal(controller.timeline.playbackRate, 2);
  assert.equal(
    controller.handleChange(
      target('[data-timeline-unit]', {}, { type: 'select-one', value: 'frames' }),
    ),
    true,
  );
  assert.equal(controller.unit, 'frames');
  assert.equal(
    controller.handleChange(
      target('[data-timeline-snap]', {}, { type: 'checkbox', checked: false }),
    ),
    true,
  );
  assert.equal(controller.snap, false);

  controller.selected = new Set(['camera:::camera-a']);
  assert.equal(
    controller.handleChange(
      target('[data-timeline-shift]', {}, { type: 'number', value: '1' }),
    ),
    true,
  );
  assert.equal(harness.getAnimation().cameraKeyframes[0].time, 1);
});

test('directorTimelineEditing: edits camera keyframe values and easing', () => {
  const harness = createHarness();
  harness.setSelectedKeyframe({ type: 'camera', keyframeId: 'camera-b' });
  const { controller } = harness;

  assert.equal(
    controller.handleChange(
      target(
        '[data-director-camera-key]',
        { directorCameraKey: 'focalLength' },
        { type: 'number', value: '50' },
      ),
    ),
    true,
  );
  assert.equal(harness.getAnimation().cameraKeyframes[1].camera.focalLength, 50);
  assert.equal('fov' in harness.getAnimation().cameraKeyframes[1].camera, false);

  assert.equal(
    controller.handleChange(
      target(
        '[data-director-camera-key-easing]',
        {},
        { type: 'select-one', value: 'linear' },
      ),
    ),
    true,
  );
  assert.equal(harness.getAnimation().cameraKeyframes[1].easing, 'linear');
});
