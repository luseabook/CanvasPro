import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DIRECTOR_AI_TOOLS,
  executeDirectorAICommand,
  normalizeDirectorAIArgs,
} from './directorAICommands.js';
import { createStoryboard3DScene } from './projectModel.js';

function requiredId(value, name) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(name);
  return normalized;
}

function finiteNumber(value, name, { min = -Infinity, max = Infinity } = {}) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < min || normalized > max) {
    throw new Error(name);
  }
  return normalized;
}

function vector3(value, name, fallback) {
  if (value === undefined || value === null) return [...fallback];
  if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite)) {
    throw new Error(name);
  }
  return [...value];
}

const helpers = { requiredId, finiteNumber, vector3 };

test('directorAICommands: normalizes whitelisted commands and rejects invalid arguments', () => {
  assert.deepEqual(DIRECTOR_AI_TOOLS, [
    'setCameraPath',
    'setObjectPath',
    'setCameraMotion',
    'setCameraFollow',
    'addActionClip',
  ]);
  assert.equal(normalizeDirectorAIArgs('unknown', {}, helpers), null);
  assert.throws(
    () => normalizeDirectorAIArgs('setCameraPath', { shotId: 'shot-1', points: [[0, 0, 0]] }, helpers),
    Error,
  );
  assert.throws(
    () =>
      normalizeDirectorAIArgs(
        'setCameraMotion',
        { shotId: 'shot-1', preset: 'unknown' },
        helpers,
      ),
    Error,
  );

  const path = normalizeDirectorAIArgs(
    'setCameraPath',
    { shotId: 'shot-1', points: [[0, 0, 0], [1, 1, 1]], duration: 2, smooth: true },
    helpers,
  );
  assert.deepEqual(path.points, [[0, 0, 0], [1, 1, 1]]);
  assert.equal(path.duration, 2);
  assert.equal(path.smooth, true);

  const follow = normalizeDirectorAIArgs(
    'setCameraFollow',
    { shotId: 'shot-1', mode: 'relative', followObjectId: 'hero' },
    helpers,
  );
  assert.equal(follow.mode, 'relative');
  assert.equal(follow.followObjectId, 'hero');
  assert.deepEqual(follow.followOffset, [0, 2, 5]);
});

test('directorAICommands: executes path, motion, follow, and action commands', () => {
  const scene = createStoryboard3DScene({ idFactory: () => 'id' });
  const shot = scene.shots[0];
  scene.objects.push({
    id: 'hero',
    type: 'character',
    name: 'Hero',
    visible: true,
    locked: false,
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  });

  const motionArgs = normalizeDirectorAIArgs(
    'setCameraMotion',
    { shotId: shot.id, preset: 'push', duration: 2, amount: 2 },
    helpers,
  );
  const motionResult = executeDirectorAICommand(scene, 'setCameraMotion', motionArgs);
  assert.equal(motionResult.changed, true);
  assert.ok(motionResult.result.keyframes > 1);

  const pathArgs = normalizeDirectorAIArgs(
    'setObjectPath',
    {
      shotId: shot.id,
      objectId: 'hero',
      points: [[0, 0, 0], [0, 0, 2]],
      duration: 2,
    },
    helpers,
  );
  const pathResult = executeDirectorAICommand(scene, 'setObjectPath', pathArgs);
  assert.equal(pathResult.changed, true);
  assert.equal(shot.animation.objectTracks[0].objectId, 'hero');

  const followArgs = normalizeDirectorAIArgs(
    'setCameraFollow',
    { shotId: shot.id, mode: 'fixed', followObjectId: 'hero' },
    helpers,
  );
  const followResult = executeDirectorAICommand(scene, 'setCameraFollow', followArgs);
  assert.equal(followResult.changed, true);
  assert.equal(shot.animation.cameraConstraintClips.length, 1);
  assert.equal(shot.animation.cameraConstraintClips[0].followObjectId, 'hero');

  const actionArgs = normalizeDirectorAIArgs(
    'addActionClip',
    { shotId: shot.id, objectId: 'hero', actionId: 'wave-right', duration: 1 },
    helpers,
  );
  const actionResult = executeDirectorAICommand(scene, 'addActionClip', actionArgs);
  assert.equal(actionResult.changed, true);
  assert.equal(shot.animation.actionClips.length, 1);
  assert.equal(shot.animation.actionClips[0].objectId, 'hero');
  assert.equal(executeDirectorAICommand(scene, 'unknown', {}), null);
});

test('directorAICommands: reports missing or locked execution targets', () => {
  const scene = createStoryboard3DScene({ idFactory: () => 'id' });
  const shot = scene.shots[0];
  scene.objects.push({
    id: 'locked-hero',
    type: 'character',
    name: 'Locked',
    visible: true,
    locked: true,
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  });

  assert.throws(
    () => executeDirectorAICommand(scene, 'setCameraMotion', { shotId: 'missing' }),
    Error,
  );
  assert.throws(
    () =>
      executeDirectorAICommand(scene, 'addActionClip', {
        shotId: shot.id,
        objectId: 'locked-hero',
        actionId: 'wave-right',
      }),
    Error,
  );
  assert.throws(
    () =>
      executeDirectorAICommand(scene, 'setCameraFollow', {
        shotId: shot.id,
        followObjectId: 'missing',
      }),
    Error,
  );
});
