import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getPersonReplacementPromptReferenceReviewMessage,
  syncPersonReplacementPromptReferences,
} from './personReplacementPromptReferenceReview.js';

const sourceRef = 'data/assets/source.png';
const targetRef = 'data/assets/target.png';

function createProject(overrides = {}) {
  return {
    id: 'project-1',
    characters: [
      {
        id: 'target-a',
        name: 'Target A',
        appearances: [{ id: 'appearance-a', name: 'Base', imageUrl: targetRef }],
      },
    ],
    mappings: [{ sourceCharacterId: 'source-a', targetCharacterId: 'target-a' }],
    shots: [],
    ...overrides,
  };
}

function createShot(overrides = {}) {
  return {
    id: 'shot-1',
    keyframeRef: sourceRef,
    frame: { width: 1600, height: 900 },
    people: [
      {
        id: 'person-a',
        sourceCharacterId: 'source-a',
        targetCharacterId: 'target-a',
        targetAppearanceId: 'appearance-a',
        bbox: { x: 0.1, y: 0.2, width: 0.2, height: 0.3 },
      },
    ],
    imagePrompt: '保持构图，人物参考图2。',
    ...overrides,
  };
}

test('personReplacementPromptReferenceReview: sync captures current image slots', () => {
  const project = createProject({
    shots: [createShot({ imagePrompt: '保持构图，人物参考图2。' })],
  });
  const current = createProject({
    shots: [createShot({ imagePrompt: '保持构图，人物参考图2。' })],
  });
  const synced = syncPersonReplacementPromptReferences(project, current);

  assert.deepEqual(synced.shots[0].imagePromptReferences, [
    {
      slot: 2,
      key: '/data/assets/target.png',
    },
  ]);
});

test('personReplacementPromptReferenceReview: removing plain image mentions clears stale bindings', () => {
  const current = createProject({
    shots: [
      createShot({
        imagePrompt: '不要引用图片。',
        imagePromptReferences: [{ slot: 2, key: '/data/assets/target.png' }],
      }),
    ],
  });
  const synced = syncPersonReplacementPromptReferences(current, current);

  assert.equal(Object.hasOwn(synced.shots[0], 'imagePromptReferences'), false);
  assert.equal(synced.shots[0].imagePrompt, '不要引用图片。');
});

test('personReplacementPromptReferenceReview: reference pills are not treated as plain mentions', () => {
  const current = createProject({
    shots: [
      createShot({
        imagePrompt:
          '<span class="ref-pill" data-asset-id="asset-2">图2</span>保持人物一致。',
        imagePromptReferences: [{ slot: 2, key: '/data/assets/target.png' }],
      }),
    ],
  });
  const synced = syncPersonReplacementPromptReferences(current, current);

  assert.equal(Object.hasOwn(synced.shots[0], 'imagePromptReferences'), false);
});

test('personReplacementPromptReferenceReview: changed bindings produce an actionable message', () => {
  const shot = {
    imagePrompt: '人物参考图2。',
    imagePromptReferences: [{ slot: 2, key: '/data/assets/old.png' }],
  };
  const promptPackage = {
    referenceImages: [{ slot: 2, ref: 'data/assets/new.png' }],
  };

  assert.equal(
    getPersonReplacementPromptReferenceReviewMessage(shot, promptPackage),
    '参考图绑定已变化，请检查并编辑提示词中的图2后再生成，或改用 @ 引用素材。',
  );
  assert.equal(
    getPersonReplacementPromptReferenceReviewMessage(
      {
        ...shot,
        imagePromptReferences: [{ slot: 2, key: '/data/assets/new.png' }],
      },
      promptPackage,
    ),
    '',
  );
  assert.equal(
    getPersonReplacementPromptReferenceReviewMessage(
      {
        ...shot,
        imagePromptReferences: [{ slot: 3, key: '/data/assets/old.png' }],
      },
      promptPackage,
    ),
    '',
  );
});
