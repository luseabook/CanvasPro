import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORYBOARD_3D_FOCAL_LENGTH_PRESETS,
  analyzeStoryboard3DCamera,
  appendShotFromCurrentView,
  aspectRatioToNumber,
  createShotFromCurrentView,
  createShotThumbnailRenderRequest,
  deleteStoryboard3DShot,
  deriveStoryboard3DCameraOptics,
  duplicateStoryboard3DShot,
  executeShotThumbnailRenderRequest,
  inferStoryboard3DShotAngle,
  inferStoryboard3DShotSize,
  normalizeAspectRatio,
  normalizeStoryboard3DCameraState,
  renameStoryboard3DShot,
  reorderStoryboard3DShot,
  restoreStoryboard3DCameraFromShot,
  setStoryboard3DCameraFocalLength,
  updateShot,
} from './cameraShotSystem.js';
import { createStoryboard3DScene } from './projectModel.js';

function createSequenceIdFactory() {
  const counts = new Map();
  return (kind) => {
    const count = (counts.get(kind) || 0) + 1;
    counts.set(kind, count);
    return `${kind}-${count}`;
  };
}

test('cameraShotSystem: normalizes camera state and optical ratios', () => {
  const camera = normalizeStoryboard3DCameraState({
    position: { x: 'invalid' },
    target: [1, 2, 3],
    focalLength: 999,
    near: -1,
    far: 0,
    aspectRatio: ' 4 : 3 ',
  });

  assert.deepEqual(camera.position, [5, 4, 7]);
  assert.deepEqual(camera.target, [1, 2, 3]);
  assert.equal(camera.focalLength, 200);
  assert.equal(camera.near, 0.001);
  assert.equal(camera.far, 0.002);
  assert.equal(camera.aspectRatio, '4:3');
  assert.deepEqual(STORYBOARD_3D_FOCAL_LENGTH_PRESETS, [15, 35, 55, 75, 105, 135, 155, 200]);
  assert.equal(normalizeAspectRatio('bad'), '16:9');
  assert.equal(aspectRatioToNumber('16:9'), 16 / 9);
  assert.equal(setStoryboard3DCameraFocalLength(camera, 10).focalLength, 15);
  assert.equal(restoreStoryboard3DCameraFromShot({ camera }).focalLength, 200);
  assert.throws(() => restoreStoryboard3DCameraFromShot({}), /camera/u);
});

test('cameraShotSystem: derives optics and infers shot size and angle', () => {
  const optics = deriveStoryboard3DCameraOptics({
    focalLength: 35,
    aspectRatio: '16:9',
  });
  assert.ok(optics.horizontalFov > optics.verticalFov);
  assert.ok(optics.verticalFov > 0);

  assert.equal(inferStoryboard3DShotSize({ camera: { focalLength: 135 } }), 'ECU');
  assert.equal(inferStoryboard3DShotSize({ camera: { focalLength: 24 } }), 'LS');
  assert.equal(
    inferStoryboard3DShotAngle({
      camera: { position: [0, 10, 0], target: [0, 0, 0] },
      subjectBounds: { min: [-1, 0, -1], max: [1, 2, 1] },
    }),
    'top',
  );
  assert.equal(
    inferStoryboard3DShotAngle({
      camera: { position: [0, 1, -5], target: [0, 1, 0] },
      subjectBounds: { min: [-1, 0, -1], max: [1, 2, 1] },
      subjectForward: [0, 0, 1],
    }),
    'rear',
  );
  assert.equal(inferStoryboard3DShotAngle({ compositionHint: 'overShoulder' }), 'overShoulder');

  const analysis = analyzeStoryboard3DCamera({
    camera: { position: [0, 1, 5], target: [0, 1, 0] },
    subjectBounds: { min: [-0.7, 0, -0.5], max: [0.7, 1.7, 0.5] },
  });
  assert.equal(typeof analysis.shotSize, 'string');
  assert.equal(typeof analysis.shotAngle, 'string');
});

test('cameraShotSystem: appends, duplicates, reorders, renames, and deletes shots', () => {
  const idFactory = createSequenceIdFactory();
  const scene = createStoryboard3DScene({
    name: 'Opening',
    shotName: 'Wide',
    now: 10,
    idFactory,
  });
  const appended = appendShotFromCurrentView({
    scene,
    camera: { position: [2, 2, 5], target: [0, 1, 0], focalLength: 75 },
    name: 'Close',
    subjectBounds: { min: [-0.5, 0, -0.5], max: [0.5, 1.8, 0.5] },
    now: 20,
    idFactory,
  });

  assert.equal(scene.shots.length, 1);
  assert.equal(appended.shots.length, 2);
  assert.equal(appended.activeShotId, appended.shots[1].id);
  assert.ok(appended.shots[1].cameraId);
  assert.ok(appended.objects.some((object) => object.id === appended.shots[1].cameraId));
  assert.equal(typeof appended.shots[1].shotSize, 'string');

  const duplicated = duplicateStoryboard3DShot(appended, appended.activeShotId, {
    name: 'Close Copy',
    now: 30,
    idFactory,
  });
  assert.equal(duplicated.shots.length, 3);
  assert.equal(duplicated.activeShotId, duplicated.shots[2].id);
  assert.equal(duplicated.shots[2].name, 'Close Copy');

  const renamed = renameStoryboard3DShot(
    duplicated,
    duplicated.activeShotId,
    'Hero',
    { now: 40 },
  );
  assert.equal(renamed.shots[2].name, 'Hero');
  assert.equal(renamed.shots[2].updatedAt, 40);

  const reordered = reorderStoryboard3DShot(renamed, renamed.activeShotId, 0);
  assert.equal(reordered.shots[0].name, 'Hero');
  assert.deepEqual(reordered.shots.map((shot) => shot.order), [0, 1, 2]);

  const deleted = deleteStoryboard3DShot(reordered, duplicated.activeShotId);
  assert.equal(deleted.shots.length, 2);
  assert.equal(deleted.objects.some((object) => object.id === duplicated.shots[2].cameraId), false);
  assert.doesNotThrow(() =>
    updateShot(deleted, deleted.activeShotId, (shot) => ({ ...shot, description: 'updated' })),
  );
});

test('cameraShotSystem: creates and executes bounded thumbnail requests', async () => {
  const scene = createStoryboard3DScene({ idFactory: createSequenceIdFactory() });
  const shot = createShotFromCurrentView({
    scene,
    camera: { position: [1, 2, 3], target: [0, 1, 0], focalLength: 35 },
    name: 'Thumbnail',
    idFactory: createSequenceIdFactory(),
  });
  const request = createShotThumbnailRenderRequest(shot, {
    width: 10,
    height: 9999,
    format: 'image/gif',
    quality: 2,
  });

  assert.equal(request.kind, 'storyboard3d-shot-thumbnail');
  assert.equal(request.version, 1);
  assert.equal(request.output.width, 64);
  assert.equal(request.output.height, 4096);
  assert.equal(request.output.format, 'image/webp');
  assert.equal(request.output.quality, 1);

  const result = await executeShotThumbnailRenderRequest(request, {
    async renderShotThumbnail(clonedRequest) {
      return { ...clonedRequest, rendered: true };
    },
  });
  assert.equal(result.rendered, true);
  assert.equal(result.shotId, shot.id);
  await assert.rejects(
    executeShotThumbnailRenderRequest({ ...request, kind: 'other' }, {}),
    /Unsupported/u,
  );
  await assert.rejects(executeShotThumbnailRenderRequest(request, {}), /adapter/u);
});
