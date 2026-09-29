import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORYBOARD_3D_PROJECT_VERSION,
  STORYBOARD_3D_SHOT_ANGLES,
  STORYBOARD_3D_SHOT_SIZES,
  createDefaultStoryboard3DCameraState,
  createDefaultStoryboard3DTransform,
  createStoryboard3DCameraObject,
  createStoryboard3DProject,
  createStoryboard3DScene,
  getActiveStoryboard3DScene,
  getActiveStoryboard3DShot,
  getStoryboard3DCameraStateFromObject,
  migrateStoryboard3DProject,
  summarizeStoryboard3DProject,
  syncStoryboard3DCameraObjectFromShot,
  syncStoryboard3DShotFromCameraObject,
} from './projectModel.js';

function createSequenceIdFactory() {
  const counts = new Map();
  return (kind) => {
    const count = (counts.get(kind) || 0) + 1;
    counts.set(kind, count);
    return `${kind}-${count}`;
  };
}

test('projectModel: creates linked scene, shot, and camera objects', () => {
  const idFactory = createSequenceIdFactory();
  const scene = createStoryboard3DScene({
    name: 'Opening',
    shotName: 'Wide',
    environmentType: 'studio',
    now: 100,
    idFactory,
  });
  const project = createStoryboard3DProject({
    name: 'Demo',
    sceneName: 'Opening',
    shotName: 'Wide',
    now: 100,
    idFactory,
  });

  assert.equal(STORYBOARD_3D_PROJECT_VERSION, 2);
  assert.deepEqual(STORYBOARD_3D_SHOT_SIZES, ['EST', 'ELS', 'LS', 'MLS', 'MED', 'MCU', 'CU', 'ECU']);
  assert.deepEqual(STORYBOARD_3D_SHOT_ANGLES, ['eye', 'high', 'low', 'top', 'overShoulder', 'profile', 'rear']);
  assert.deepEqual(createDefaultStoryboard3DTransform(), {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  });
  assert.deepEqual(createDefaultStoryboard3DCameraState(), {
    position: [5, 4, 7],
    target: [0, 1.2, 0],
    focalLength: 35,
    near: 0.1,
    far: 1000,
    aspectRatio: '16:9',
  });

  assert.equal(scene.id, 'scene-1');
  assert.equal(scene.objects[0].id, 'camera-1');
  assert.equal(scene.objects[0].name, 'Wide 摄像机');
  assert.equal(scene.shots[0].id, 'shot-1');
  assert.equal(scene.shots[0].cameraId, 'camera-1');
  assert.equal(scene.activeShotId, 'shot-1');
  assert.equal(scene.environment.type, 'studio');
  assert.equal(project.id, 'project-1');
  assert.equal(project.scenes.length, 1);
  assert.equal(project.scenes[0].id, 'scene-2');
  assert.equal(project.scenes[0].objects[0].id, 'camera-2');
  assert.equal(project.scenes[0].shots[0].id, 'shot-2');
  assert.equal(project.activeSceneId, project.scenes[0].id);
  assert.deepEqual(summarizeStoryboard3DProject(project), {
    sceneCount: 1,
    shotCount: 1,
    objectCount: 1,
  });
  assert.equal(getActiveStoryboard3DScene(project), project.scenes[0]);
  assert.equal(getActiveStoryboard3DShot(project), project.scenes[0].shots[0]);
});

test('projectModel: synchronizes shot and camera object state in both directions', () => {
  const scene = createStoryboard3DScene({ idFactory: createSequenceIdFactory() });
  let cameraObject = scene.objects[0];
  const shot = scene.shots[0];
  shot.camera = {
    ...shot.camera,
    position: [1, 2, 3],
    target: [0, 2, 0],
    focalLength: 70,
    near: 0.2,
    far: 500,
    aspectRatio: '4:3',
    fov: 55,
    roll: 0.25,
  };

  cameraObject = syncStoryboard3DCameraObjectFromShot(scene, shot);
  assert.equal(cameraObject, scene.objects[0]);
  assert.deepEqual(cameraObject.transform.position, [1, 2, 3]);
  assert.deepEqual(cameraObject.target, [0, 2, 0]);
  assert.equal(cameraObject.focalLength, 70);
  assert.equal(cameraObject.far, 500);
  assert.equal(cameraObject.aspectRatio, '4:3');
  assert.equal(cameraObject.fov, 55);
  assert.equal(cameraObject.transform.rotation[2], 0.25);

  const previousTransform = {
    position: [...cameraObject.transform.position],
    rotation: [...cameraObject.transform.rotation],
  };
  cameraObject.transform.position = [4, 3, 3];
  cameraObject.transform.rotation[1] = Math.PI / 2;

  assert.equal(
    syncStoryboard3DShotFromCameraObject(scene, cameraObject.id, { previousTransform }),
    shot,
  );
  assert.deepEqual(shot.camera.position, [4, 3, 3]);
  assert.deepEqual(shot.animation.cameraKeyframes[0].camera.position, [4, 3, 3]);
  assert.equal(getStoryboard3DCameraStateFromObject(cameraObject).roll, 0.25);
});

test('projectModel: migrates legacy projects and rejects future versions', () => {
  const fallback = { id: 'fallback', scenes: [] };
  const fallbackResult = migrateStoryboard3DProject(null, { fallbackProject: fallback });
  assert.deepEqual(fallbackResult, fallback);
  assert.notEqual(fallbackResult, fallback);

  const migrated = migrateStoryboard3DProject(
    {
      id: 'project-a',
      version: 1,
      name: '',
      createdAt: -10,
      updatedAt: 'invalid',
      scenes: [
        {
          id: 'scene-a',
          objects: [
            {
              id: 'hero',
              type: 'character',
              name: 'Hero',
              transform: { position: [1, 2, 3] },
            },
            {
              id: 'camera-a',
              type: 'camera',
              name: 'Camera',
              focalLength: 0,
              target: [0, 1, 0],
            },
          ],
          shots: [
            {
              id: 'shot-a',
              cameraId: 'camera-a',
              camera: { position: [1, 2, 3] },
              shotSize: 'invalid',
              shotAngle: 'sideways',
            },
          ],
          activeShotId: 'missing',
        },
      ],
      activeSceneId: 'missing',
    },
    { now: 100, idFactory: createSequenceIdFactory() },
  );

  assert.equal(migrated.version, STORYBOARD_3D_PROJECT_VERSION);
  assert.equal(migrated.name, '3D Storyboard');
  assert.equal(migrated.scenes[0].id, 'scene-a');
  assert.equal(migrated.scenes[0].shots[0].id, 'shot-a');
  assert.equal(migrated.scenes[0].shots[0].shotSize, 'MED');
  assert.equal(migrated.scenes[0].shots[0].shotAngle, 'eye');
  assert.equal(migrated.scenes[0].activeShotId, 'shot-a');
  assert.equal(migrated.activeSceneId, 'scene-a');
  assert.equal(migrated.createdAt, 0);
  assert.equal(migrated.updatedAt, 0);
  assert.equal(summarizeStoryboard3DProject(migrated).objectCount, 2);

  assert.throws(
    () => migrateStoryboard3DProject({ version: STORYBOARD_3D_PROJECT_VERSION + 1 }),
    /Unsupported 3D storyboard project version/u,
  );
});
