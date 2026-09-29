import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyPersonReplacementShotSceneReference,
  assignPersonReplacementShotPersonMapping,
  clearPersonReplacementShotPersonMappings,
  reconcilePersonReplacementShotGenerationState,
} from './personReplacementShotMapping.js';

test('personReplacementShotMapping: reconciles only selected shots and keeps running generations', () => {
  const project = {
    workspace: {
      imageGeneration: { status: 'succeeded', shotId: 'shot-a' },
      videoGeneration: { status: 'succeeded', shotId: 'shot-a' },
      imageGenerationsByShotId: {
        'shot-a': { status: 'running', shotId: 'shot-a' },
      },
      videoGenerationsByShotId: {
        'shot-a': { status: 'running', shotId: 'shot-a' },
      },
    },
  };

  assert.equal(
    reconcilePersonReplacementShotGenerationState(project, new Set()),
    project,
    '空集合直接返回原项目',
  );

  const reconciled = reconcilePersonReplacementShotGenerationState(project, new Set(['shot-a', 'shot-b']));
  assert.notEqual(reconciled, project);
  assert.equal(reconciled.workspace.imageGenerationsByShotId['shot-a'].status, 'running');
  assert.equal(reconciled.workspace.videoGenerationsByShotId['shot-a'].status, 'running');
  assert.deepEqual(reconciled.workspace.imageGenerationsByShotId['shot-b'], {
    status: 'idle',
    shotId: 'shot-b',
    error: '',
  });
  assert.deepEqual(reconciled.workspace.videoGenerationsByShotId['shot-b'], {
    status: 'idle',
    shotId: 'shot-b',
    error: '',
  });
  assert.equal(reconciled.workspace.imageGeneration.shotId, 'shot-a');
  assert.equal(reconciled.workspace.videoGeneration.shotId, 'shot-a');
});

test('personReplacementShotMapping: scene reference changes require a concrete scene appearance', () => {
  const project = {
    scenes: [
      {
        id: 'scene-a',
        appearances: [{ id: 'appearance-a', imageUrl: 'data/scene.png' }],
      },
    ],
    shots: [{ id: 'shot-a', sceneReference: {}, people: [] }],
    workspace: {},
  };

  const changed = applyPersonReplacementShotSceneReference(
    project,
    { shotId: 'shot-a', sceneId: 'scene-a', appearanceId: 'appearance-a' },
    { reason: 'scene-picked' },
  );

  assert.equal(changed.reason, 'scene-picked');
  assert.deepEqual(changed.project.shots[0].sceneReference, {
    sceneId: 'scene-a',
    appearanceId: 'appearance-a',
  });
  assert.deepEqual([...changed.changedShotIds], ['shot-a']);
  assert.equal(
    applyPersonReplacementShotSceneReference(
      changed.project,
      { shotId: 'shot-a', sceneId: 'scene-a', appearanceId: 'appearance-a' },
    ),
    null,
    '相同引用不重复产生变更',
  );
  assert.equal(
    applyPersonReplacementShotSceneReference(
      project,
      { shotId: 'shot-a', sceneId: 'scene-a', appearanceId: 'missing' },
    ),
    null,
  );
  assert.equal(applyPersonReplacementShotSceneReference(project, { shotId: 'missing' }), null);
});

test('personReplacementShotMapping: clearing a person mapping clears all matching binding occurrences', () => {
  const project = {
    mappings: [{ sourceCharacterId: 'source-a', targetCharacterId: 'target-a' }],
    shots: [
      {
        id: 'shot-a',
        people: [
          {
            id: 'person-a',
            label: 'A',
            sourceCharacterId: 'source-a',
            targetCharacterId: 'target-a',
            targetAppearanceId: 'appearance-a',
          },
        ],
      },
      {
        id: 'shot-b',
        people: [
          {
            id: 'person-b',
            label: 'A',
            sourceCharacterId: 'source-a',
            targetCharacterId: 'target-a',
            targetAppearanceId: 'appearance-a',
          },
        ],
      },
    ],
    workspace: {},
  };

  const cleared = clearPersonReplacementShotPersonMappings(
    project,
    { shotId: 'shot-a', personId: 'person-a' },
    { reason: 'mapping-cleared' },
  );

  assert.equal(cleared.reason, 'mapping-cleared');
  assert.deepEqual([...cleared.changedShotIds].sort(), ['shot-a', 'shot-b']);
  assert.deepEqual(cleared.project.mappings, []);
  for (const shot of cleared.project.shots) {
    assert.equal(shot.people[0].targetCharacterId, '');
    assert.equal(shot.people[0].targetAppearanceId, '');
  }
  assert.equal(
    clearPersonReplacementShotPersonMappings(cleared.project, {
      shotId: 'shot-a',
      personId: 'person-a',
    }),
    null,
    '再次清理已无变更时返回 null',
  );
});

test('personReplacementShotMapping: assigning mappings validates scope and avoids no-op results', () => {
  const project = {
    mappings: [],
    shots: [
      {
        id: 'shot-a',
        people: [
          {
            id: 'person-a',
            label: 'A',
            sourceCharacterId: 'source-a',
            targetCharacterId: '',
            targetAppearanceId: '',
          },
        ],
      },
    ],
    workspace: {},
  };

  assert.equal(
    assignPersonReplacementShotPersonMapping(project, {
      shotId: 'shot-a',
      personId: 'person-a',
      targetCharacterId: 'target-a',
      targetAppearanceId: '',
      scope: 'current',
    }),
    null,
    '目标形象必填',
  );

  const currentShot = assignPersonReplacementShotPersonMapping(project, {
    shotId: 'shot-a',
    personId: 'person-a',
    targetCharacterId: 'target-a',
    targetAppearanceId: 'appearance-a',
    scope: 'current',
  });
  assert.equal(currentShot.reason, 'person-mapping-current-shot');
  assert.equal(currentShot.project.shots[0].people[0].targetCharacterId, 'target-a');
  assert.deepEqual(currentShot.project.mappings, []);
  assert.equal(
    assignPersonReplacementShotPersonMapping(currentShot.project, {
      shotId: 'shot-a',
      personId: 'person-a',
      targetCharacterId: 'target-a',
      targetAppearanceId: 'appearance-a',
      scope: 'current',
    }),
    null,
  );

  const global = assignPersonReplacementShotPersonMapping(project, {
    shotId: 'shot-a',
    personId: 'person-a',
    targetCharacterId: 'target-a',
    targetAppearanceId: 'appearance-a',
    scope: 'all',
  });
  assert.equal(global.reason, 'person-mapping');
  assert.deepEqual(global.project.mappings, [
    { sourceCharacterId: 'source-a', targetCharacterId: 'target-a' },
  ]);
});
