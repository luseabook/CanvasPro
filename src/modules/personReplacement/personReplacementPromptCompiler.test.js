import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPersonReplacementPromptPackage,
  compilePersonReplacementPrompt,
  isPersonReplacementSceneOnlyPromptPackage,
} from './personReplacementPromptCompiler.js';

const sourceRef = 'data/assets/source.png';
const targetRef = 'data/assets/target.png';
const sceneRef = 'data/assets/scene.png';

function createProject(overrides = {}) {
  return {
    characters: [
      {
        id: 'target-a',
        name: 'Target A',
        appearances: [{ id: 'appearance-a', name: 'Base', imageUrl: targetRef }],
      },
    ],
    scenes: [
      {
        id: 'scene-a',
        name: 'Scene A',
        appearances: [{ id: 'scene-appearance-a', name: 'Base', imageUrl: sceneRef }],
      },
    ],
    mappings: [{ sourceCharacterId: 'source-a', targetCharacterId: 'target-a' }],
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
    ...overrides,
  };
}

test('promptCompiler: regular mode binds source and target references', () => {
  const promptPackage = buildPersonReplacementPromptPackage({
    project: createProject(),
    shot: createShot(),
  });

  assert.equal(promptPackage.promptMode, 'regular');
  assert.equal(promptPackage.referenceImages.length, 2);
  assert.equal(promptPackage.referenceImages[0].role, 'source-keyframe');
  assert.equal(promptPackage.referenceImages[0].slot, 1);
  assert.equal(promptPackage.referenceImages[1].role, 'target-character');
  assert.equal(promptPackage.referenceImages[1].slot, 2);
  assert.deepEqual(promptPackage.mappedPersonIds, ['person-a']);
  assert.deepEqual(promptPackage.activePersonIds, ['person-a']);
  assert.equal(promptPackage.bindings.length, 1);
  assert.equal(promptPackage.bindings[0].referenceSlot, 2);
  assert.equal(promptPackage.bindings[0].replacementScope, 'full-person');
  assert.equal(
    promptPackage.prompt,
    compilePersonReplacementPrompt({ project: createProject(), shot: createShot() }),
  );
  assert.match(promptPackage.prompt, /图1/);
});

test('promptCompiler: manual mode keeps bindings but suppresses generated prompt', () => {
  const promptPackage = buildPersonReplacementPromptPackage({
    project: createProject(),
    shot: createShot({ replacementPromptMode: 'manual' }),
  });

  assert.equal(promptPackage.promptMode, 'manual');
  assert.equal(promptPackage.prompt, '');
  assert.deepEqual(promptPackage.personMarkers, []);
  assert.equal(promptPackage.bindings.length, 1);
});

test('promptCompiler: positioning mode adds a location guide reference', () => {
  const promptPackage = buildPersonReplacementPromptPackage({
    project: createProject(),
    shot: createShot({ replacementPromptMode: 'positioning' }),
  });

  assert.equal(promptPackage.promptMode, 'positioning');
  assert.ok(promptPackage.locationGuide);
  assert.equal(promptPackage.locationGuide.people.length, 1);
  assert.equal(promptPackage.locationGuideSlot, 3);
  assert.equal(promptPackage.referenceImages.length, 3);
  assert.equal(promptPackage.referenceImages[2].role, 'person-location-guide');
  assert.match(promptPackage.referenceImages[2].ref, /^data:image\/svg\+xml/);
  assert.equal(promptPackage.personMarkers.length, 1);
});

test('promptCompiler: test mode emits an annotated source and source metadata', () => {
  const promptPackage = buildPersonReplacementPromptPackage({
    project: createProject(),
    shot: createShot({ replacementPromptMode: 'annotated-source-test' }),
  });

  assert.equal(promptPackage.promptMode, 'annotated-source-test');
  assert.ok(promptPackage.annotatedSource);
  assert.equal(promptPackage.annotatedSource.sourceRef, sourceRef);
  assert.equal(promptPackage.annotatedSource.people.length, 1);
  assert.equal(promptPackage.referenceImages[0].role, 'source-keyframe');
  assert.equal(promptPackage.referenceImages[0].ref, sourceRef);
});

test('promptCompiler: unmapped people are reported while valid people still bind', () => {
  const shot = createShot({
    people: [
      {
        id: 'person-mapped',
        sourceCharacterId: 'source-a',
        targetCharacterId: 'target-a',
        targetAppearanceId: 'appearance-a',
        bbox: { x: 0.1, y: 0.2, width: 0.2, height: 0.3 },
      },
      {
        id: 'person-unmapped',
        sourceCharacterId: 'source-missing',
        bbox: { x: 0.6, y: 0.2, width: 0.2, height: 0.3 },
      },
    ],
  });
  const promptPackage = buildPersonReplacementPromptPackage({
    project: createProject(),
    shot,
  });

  assert.deepEqual(promptPackage.mappedPersonIds, ['person-mapped']);
  assert.deepEqual(promptPackage.unmappedPersonIds, ['person-unmapped']);
  assert.equal(promptPackage.bindings.length, 1);
});

test('promptCompiler: regular mode reports mapped people without locators', () => {
  const promptPackage = buildPersonReplacementPromptPackage({
    project: createProject(),
    shot: createShot({
      people: [
        {
          id: 'person-no-box',
          sourceCharacterId: 'source-a',
          targetCharacterId: 'target-a',
          targetAppearanceId: 'appearance-a',
        },
      ],
    }),
  });

  assert.deepEqual(promptPackage.missingLocatorPersonIds, ['person-no-box']);
  assert.deepEqual(promptPackage.mappedPersonIds, []);
  assert.deepEqual(promptPackage.bindings, []);
  assert.equal(promptPackage.referenceImages.length, 1);
});

test('promptCompiler: a missing target reference is reported as unmapped', () => {
  const project = createProject({
    mappings: [{ sourceCharacterId: 'source-a', targetCharacterId: 'target-missing' }],
  });
  const promptPackage = buildPersonReplacementPromptPackage({
    project,
    shot: createShot({
      people: [
        { id: 'person-a', sourceCharacterId: 'source-a', bbox: { x: 0.1, y: 0.2, width: 0.2, height: 0.3 } },
      ],
    }),
  });

  assert.deepEqual(promptPackage.mappedPersonIds, []);
  assert.deepEqual(promptPackage.unmappedPersonIds, ['person-a']);
  assert.ok(promptPackage.warnings.some((message) => message.includes('target-missing')));
});

test('promptCompiler: scene-only replacement is detected and bound to the scene image', () => {
  const promptPackage = buildPersonReplacementPromptPackage({
    project: createProject(),
    shot: createShot({
      people: [],
      sceneReference: { sceneId: 'scene-a', appearanceId: 'scene-appearance-a' },
    }),
  });

  assert.equal(promptPackage.sceneReferenceSlot, 2);
  assert.deepEqual(promptPackage.mappedPersonIds, []);
  assert.equal(isPersonReplacementSceneOnlyPromptPackage(promptPackage), true);
  assert.equal(promptPackage.referenceImages[1].role, 'target-scene');
  assert.equal(promptPackage.referenceImages[1].ref, sceneRef);
  assert.ok(promptPackage.prompt.length > 0);
});

test('promptCompiler: missing scene references produce warnings', () => {
  const promptPackage = buildPersonReplacementPromptPackage({
    project: createProject(),
    shot: createShot({
      people: [],
      sceneReference: { sceneId: 'scene-missing' },
    }),
  });

  assert.equal(promptPackage.sceneReferenceSlot, 0);
  assert.equal(isPersonReplacementSceneOnlyPromptPackage(promptPackage), false);
  assert.ok(promptPackage.warnings.some((message) => message.includes('scene-missing')));
});
