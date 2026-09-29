import test from 'node:test';
import assert from 'node:assert/strict';

import { createDirectorVideoPlan, sampleDirectorVideoPlan } from './directorVideoPlan.js';
import { createStoryboard3DProject, createStoryboard3DShot } from './projectModel.js';

function createVideoProject() {
  const project = createStoryboard3DProject({
    id: 'project-a',
    idFactory: () => 'id',
    now: 10,
  });
  const scene = project.scenes[0];
  scene.objects.push({
    id: 'hero',
    type: 'character',
    name: 'Hero',
    visible: true,
    locked: false,
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  });
  const second = createStoryboard3DShot({
    id: 'shot-b',
    sceneId: scene.id,
    name: 'Second',
    camera: scene.shots[0].camera,
    cameraId: scene.shots[0].cameraId,
    order: 1,
    now: 10,
    idFactory: () => 'shot',
  });
  scene.shots.push(second);
  scene.activeShotId = second.id;
  return project;
}

test('directorVideoPlan: builds sequential segments and normalizes output', () => {
  const project = createVideoProject();
  const scene = project.scenes[0];
  const plan = createDirectorVideoPlan(scene, scene.shots, {
    scenes: project.scenes,
    aspectRatio: '4:3',
  });

  assert.equal(plan.segments.length, 2);
  assert.equal(plan.duration, 12);
  assert.equal(plan.track, 'all');
  assert.equal(plan.fps, 24);
  assert.equal(plan.segments[0].start, 0);
  assert.equal(plan.segments[0].end, 6);
  assert.equal(plan.segments[1].start, 6);
  assert.equal(plan.segments[1].end, 12);
  assert.equal(plan.segments[0].animation.cameraKeyframes[0].camera.aspectRatio, '4:3');
  assert.equal(plan.objectTransforms.hero.position[0], 0);
});

test('directorVideoPlan: validates an export range and samples across segments', () => {
  const project = createVideoProject();
  const scene = project.scenes[0];
  assert.throws(() => createDirectorVideoPlan(scene, []), Error);
  assert.throws(
    () =>
      createDirectorVideoPlan(scene, scene.shots, {
        videoStart: 6,
        videoEnd: 3,
      }),
    Error,
  );

  const plan = createDirectorVideoPlan(scene, scene.shots, {
    scenes: project.scenes,
    videoStart: 0,
    videoEnd: 9,
  });
  assert.equal(plan.duration, 12);
  assert.equal(plan.segments[1].duration, 6);

  const first = sampleDirectorVideoPlan(plan, 1, scene);
  const second = sampleDirectorVideoPlan(plan, 7, scene);
  assert.equal(first.time, 1);
  assert.equal(second.time, 1);
  assert.equal(typeof first.camera.focalLength, 'number');
  assert.deepEqual(second.objectTransforms, {});
});
