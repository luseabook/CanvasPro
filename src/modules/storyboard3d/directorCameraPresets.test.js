import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DIRECTOR_CAMERA_PRESETS,
  createDirectorCameraPreset,
} from './directorCameraPresets.js';
import { createStoryboard3DScene } from './projectModel.js';

test('directorCameraPresets: exposes the supported preset catalog', () => {
  assert.ok(DIRECTOR_CAMERA_PRESETS.length >= 10);
  assert.ok(DIRECTOR_CAMERA_PRESETS.some((preset) => preset.id === 'front-medium'));
  assert.ok(DIRECTOR_CAMERA_PRESETS.some((preset) => preset.id === 'dutch' && preset.roll === 15));
});

test('directorCameraPresets: positions the camera from subject bounds', () => {
  const scene = createStoryboard3DScene({ idFactory: () => 'id' });
  scene.objects.push({
    id: 'hero',
    type: 'character',
    name: 'Hero',
    visible: true,
    locked: false,
    transform: { position: [1, 0, 2], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
    dimensions: [0.65, 1.8, 0.5],
  });

  const camera = createDirectorCameraPreset(scene, {
    preset: 'front-medium',
    objectId: 'hero',
  });
  assert.equal(camera.focalLength, 50);
  assert.equal(camera.roll, 0);
  assert.equal(camera.target.length, 3);
  assert.equal(camera.position.length, 3);
  assert.equal('fov' in camera, false);

  const dutch = createDirectorCameraPreset(scene, {
    preset: 'dutch',
    objectId: 'hero',
  });
  assert.ok(Math.abs(dutch.roll - (15 * Math.PI) / 180) < 1e-12);
  assert.throws(
    () => createDirectorCameraPreset(scene, { preset: 'missing', objectId: 'hero' }),
    Error,
  );
  assert.throws(
    () => createDirectorCameraPreset({ objects: [], shots: [] }, { preset: 'front-medium' }),
    Error,
  );
});
