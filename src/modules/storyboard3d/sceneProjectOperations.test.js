import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORYBOARD_3D_ENVIRONMENT_PRESETS,
  applyStoryboard3DEnvironmentPreset,
  applyStoryboard3DShotThumbnail,
  createStoryboard3DShotThumbnailToken,
  deleteStoryboard3DScene,
  duplicateStoryboard3DScene,
  renameStoryboard3DScene,
  reorderStoryboard3DScene,
  replaceStoryboard3DShotFromCurrentView,
  saveStoryboard3DProjectAsCopy,
} from './sceneProjectOperations.js';
import { createStoryboard3DProject, createStoryboard3DScene } from './projectModel.js';

function createSequenceIdFactory() {
  const counts = new Map();
  return (kind) => {
    const count = (counts.get(kind) || 0) + 1;
    counts.set(kind, count);
    return `${kind}-${count}`;
  };
}

test('sceneProjectOperations: applies presets and edits scene ordering', () => {
  const project = createStoryboard3DProject({ idFactory: createSequenceIdFactory(), now: 10 });
  const sceneId = project.scenes[0].id;

  assert.equal(STORYBOARD_3D_ENVIRONMENT_PRESETS.outdoor.groundSize, 200);
  assert.throws(
    () => applyStoryboard3DEnvironmentPreset(project, sceneId, 'missing'),
    /Unsupported/u,
  );

  const withOutdoor = applyStoryboard3DEnvironmentPreset(project, sceneId, 'outdoor', {
    overrides: { groundSize: 0, showGrid: false },
    now: 20,
  });
  assert.equal(withOutdoor.scenes[0].environment.type, 'outdoor');
  assert.equal(withOutdoor.scenes[0].environment.groundSize, 1);
  assert.equal(withOutdoor.scenes[0].environment.showGrid, false);
  assert.equal(withOutdoor.updatedAt, 20);

  const renamed = renameStoryboard3DScene(withOutdoor, sceneId, 'Opening', { now: 30 });
  assert.equal(renamed.scenes[0].name, 'Opening');
  assert.equal(renamed.updatedAt, 30);
  assert.deepEqual(renameStoryboard3DScene(renamed, sceneId, ' ', { now: 40 }), renamed);

  const duplicated = duplicateStoryboard3DScene(renamed, sceneId, {
    name: 'Copy',
    now: 50,
    idFactory: createSequenceIdFactory(),
  });
  assert.equal(duplicated.scenes.length, 2);
  assert.equal(duplicated.scenes[1].name, 'Copy');
  assert.notEqual(duplicated.scenes[1].id, duplicated.scenes[0].id);
  assert.equal(duplicated.scenes[1].shots[0].sceneId, duplicated.scenes[1].id);
  assert.equal(duplicated.activeSceneId, duplicated.scenes[1].id);

  const reordered = reorderStoryboard3DScene(duplicated, duplicated.scenes[1].id, 0, { now: 60 });
  assert.equal(reordered.scenes[0].id, duplicated.scenes[1].id);
  assert.equal(reordered.updatedAt, 60);

  const deleted = deleteStoryboard3DScene(reordered, reordered.scenes[0].id, { now: 70 });
  assert.equal(deleted.scenes.length, 1);
  assert.equal(deleted.activeSceneId, deleted.scenes[0].id);
  assert.deepEqual(deleteStoryboard3DScene(deleted, deleted.scenes[0].id), deleted);
});

test('sceneProjectOperations: saves deep copies and remaps running jobs', () => {
  const project = createStoryboard3DProject({
    id: 'project-a',
    name: 'Original',
    idFactory: createSequenceIdFactory(),
    now: 10,
  });
  project.generationJobs = [
    {
      id: 'job-1',
      sceneId: project.scenes[0].id,
      status: 'running',
      message: 'working',
    },
  ];

  const copy = saveStoryboard3DProjectAsCopy(project, {
    id: 'project-copy',
    name: 'Copy',
    now: 20,
    idFactory: createSequenceIdFactory(),
  });

  assert.equal(copy.id, 'project-copy');
  assert.equal(copy.name, 'Copy');
  assert.notEqual(copy.scenes[0].id, project.scenes[0].id);
  assert.notEqual(copy.scenes[0].shots[0].id, project.scenes[0].shots[0].id);
  assert.equal(copy.scenes[0].shots[0].sceneId, copy.scenes[0].id);
  assert.equal(copy.activeSceneId, copy.scenes[0].id);
  assert.equal(copy.generationJobs[0].status, 'failed');
  assert.notEqual(copy.generationJobs[0].sceneId, project.scenes[0].id);
  assert.equal(copy.createdAt, 20);
  assert.equal(copy.updatedAt, 20);
});

test('sceneProjectOperations: replaces a shot from view and validates thumbnail tokens', () => {
  const initial = createStoryboard3DProject({ idFactory: createSequenceIdFactory(), now: 10 });
  const sceneId = initial.scenes[0].id;
  const shotId = initial.scenes[0].shots[0].id;
  initial.scenes[0].shots[0].thumbnailUrl = 'old-thumb';

  const replaced = replaceStoryboard3DShotFromCurrentView(initial, {
    sceneId,
    shotId,
    camera: {
      position: [1, 2, 3],
      target: [0, 1, 0],
      focalLength: 55,
      near: 0.1,
      far: 500,
      aspectRatio: '16:9',
    },
    now: 20,
  });
  const replacedShot = replaced.scenes[0].shots[0];
  assert.deepEqual(replacedShot.camera.position, [1, 2, 3]);
  assert.equal(replacedShot.camera.focalLength, 55);
  assert.equal('thumbnailUrl' in replacedShot, false);
  assert.equal(replaced.updatedAt, 20);

  const token = createStoryboard3DShotThumbnailToken(sceneId, replacedShot);
  const invalidToken = applyStoryboard3DShotThumbnail(replaced, { ...token, version: 2 }, 'thumb');
  assert.equal(invalidToken.applied, false);
  assert.equal(invalidToken.reason, 'invalid-token');

  const invalidThumb = applyStoryboard3DShotThumbnail(replaced, token, ' ', { now: 30 });
  assert.equal(invalidThumb.applied, false);
  assert.equal(invalidThumb.reason, 'invalid-thumbnail');

  const applied = applyStoryboard3DShotThumbnail(replaced, token, 'thumb', { now: 40 });
  assert.equal(applied.applied, true);
  assert.equal(applied.reason, 'applied');
  assert.equal(applied.project.scenes[0].shots[0].thumbnailUrl, 'thumb');
  assert.equal(applied.project.scenes[0].shots[0].updatedAt, 40);

  const stale = applyStoryboard3DShotThumbnail(applied.project, token, 'stale-thumb', { now: 50 });
  assert.equal(stale.applied, false);
  assert.equal(stale.reason, 'stale-token');
});
