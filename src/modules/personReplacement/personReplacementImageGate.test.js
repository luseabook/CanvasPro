import test from 'node:test';
import assert from 'node:assert/strict';

import { registerManifestBundle } from '../../manifests/index.js';
import {
  openAiCliImageExecutionManifests,
  openAiCliImageModelManifests,
} from '../../manifests/image/localRuntime/openAiCliImageManifest.js';
import { buildPersonReplacementImageGate } from './personReplacementImageGate.js';

const sourceReference = { role: 'source-keyframe', ref: 'data/source.png' };

function buildPromptPackage(overrides = {}) {
  return {
    promptMode: 'regular',
    referenceImages: [sourceReference],
    activePersonIds: [],
    mappedPersonIds: [],
    missingLocatorPersonIds: [],
    unmappedPersonIds: [],
    unresolvedOrientationPersonIds: [],
    overflowPersonIds: [],
    ...overrides,
  };
}

test('personReplacementImageGate: manual mode still requires a source image and then becomes eligible', () => {
  const missing = buildPersonReplacementImageGate({
    promptPackage: buildPromptPackage({
      promptMode: 'manual',
      referenceImages: [],
    }),
  });
  assert.equal(missing.manual, true);
  assert.equal(missing.eligible, false);
  assert.deepEqual(missing.blockers, ['missing-source']);
  assert.match(missing.message, /选择待修改的原图/);

  const ready = buildPersonReplacementImageGate({
    promptPackage: buildPromptPackage({ promptMode: 'manual' }),
  });
  assert.equal(ready.manual, true);
  assert.equal(ready.eligible, true);
  assert.deepEqual(ready.blockers, []);
});

test('personReplacementImageGate: missing person boxes take precedence over later mapping errors', () => {
  const gate = buildPersonReplacementImageGate({
    promptPackage: buildPromptPackage({
      activePersonIds: ['person-a'],
      missingLocatorPersonIds: ['person-a'],
      unmappedPersonIds: ['person-a'],
    }),
  });

  assert.equal(gate.eligible, false);
  assert.equal(gate.blockers[0], 'missing-person-box');
  assert.equal(gate.blockers.includes('missing-locator'), true);
  assert.equal(gate.blockers.includes('missing-mapping'), true);
  assert.match(gate.message, /拖到首帧人物框/);
});

test('personReplacementImageGate: unresolved orientation blocks an otherwise mapped shot', () => {
  const gate = buildPersonReplacementImageGate({
    promptPackage: buildPromptPackage({
      activePersonIds: ['person-a'],
      mappedPersonIds: ['person-a'],
      unresolvedOrientationPersonIds: ['person-a'],
    }),
  });

  assert.equal(gate.eligible, false);
  assert.equal(gate.mappingComplete, false);
  assert.deepEqual(gate.blockers, ['missing-orientation']);
  assert.match(gate.message, /未确认朝向/);
});

test('personReplacementImageGate: duplicate role labels are detected from boxed people', () => {
  const gate = buildPersonReplacementImageGate({
    shot: {
      people: [
        { id: 'person-a', label: 'A', locator: { bbox: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 } } },
        { id: 'person-b', label: 'A', locator: { bbox: { x: 0.5, y: 0.1, width: 0.2, height: 0.2 } } },
      ],
    },
    promptPackage: buildPromptPackage({
      activePersonIds: ['person-a', 'person-b'],
      mappedPersonIds: ['person-a', 'person-b'],
    }),
  });

  assert.equal(gate.eligible, false);
  assert.deepEqual(gate.duplicateRoleLabels, ['A']);
  assert.deepEqual(gate.blockers, ['duplicate-role']);
  assert.match(gate.message, /角色不能重复/);
});

test('personReplacementImageGate: scene-only packages do not require person mappings', () => {
  const gate = buildPersonReplacementImageGate({
    promptPackage: buildPromptPackage({
      sceneReferenceSlot: 2,
      mappedPersonIds: [],
    }),
  });

  assert.equal(gate.sceneOnly, true);
  assert.equal(gate.eligible, true);
  assert.equal(gate.mappingComplete, false);
});

test('personReplacementImageGate: developer-only test mode and image overflow are explicit blockers', () => {
  registerManifestBundle({
    sourceId: 'test.openai-cli-image',
    executions: openAiCliImageExecutionManifests,
    models: openAiCliImageModelManifests,
  });

  const previousWindow = globalThis.window;
  globalThis.window = { DEV_MODE: false };
  try {
    const testMode = buildPersonReplacementImageGate({
      promptPackage: buildPromptPackage({ promptMode: 'annotated-source-test' }),
    });
    assert.equal(testMode.blockers[0], 'developer-mode');
    assert.equal(testMode.blockers.includes('missing-person-box'), true);
    assert.match(testMode.message, /测试模式仅限开发者/);
  } finally {
    if (typeof previousWindow === 'undefined') delete globalThis.window;
    else globalThis.window = previousWindow;
  }

  const imageLimit = buildPersonReplacementImageGate({
    modelId: 'openai-cli/image-generation',
    promptPackage: buildPromptPackage({
      referenceImages: [
        sourceReference,
        { role: 'target-character', ref: 'data/ref-2.png' },
        { role: 'target-character', ref: 'data/ref-3.png' },
        { role: 'target-character', ref: 'data/ref-4.png' },
        { role: 'target-character', ref: 'data/ref-5.png' },
        { role: 'target-character', ref: 'data/ref-6.png' },
      ],
      activePersonIds: ['person-a'],
      mappedPersonIds: ['person-a'],
    }),
  });

  assert.equal(imageLimit.enforceImageLimit, true);
  assert.equal(imageLimit.eligible, false);
  assert.deepEqual(imageLimit.blockers, ['image-limit']);
  assert.match(imageLimit.message, /最多支持 5 张输入图片/);
});
