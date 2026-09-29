import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PERSON_REPLACEMENT_CHARACTER_ASSET_PROMPT_PRESETS,
  appendPersonReplacementImageResult,
  applyPersonReplacementCharacterAssetPromptPreset,
  createPersonReplacementImageGenerationMappingRevision,
  getRecoverablePersonReplacementImageTask,
  normalizePersonReplacementAssetPromptPresetId,
  normalizePersonReplacementImageGenerationState,
  normalizePersonReplacementImageGenerationsByShotId,
  resolveGeneratedPersonReplacementAppearanceName,
  resolvePersonReplacementImageGenerationParams,
  resolvePersonReplacementImageGenerationState,
  resolvePersonReplacementImageGenerationUiRefreshScope,
  updatePersonReplacementImageGenerationState,
} from './personReplacementImageGeneration.js';

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

test('personReplacementImageGeneration: prompt presets normalize and apply in replacement mode', () => {
  assert.deepEqual(
    PERSON_REPLACEMENT_CHARACTER_ASSET_PROMPT_PRESETS.map((preset) => preset.id),
    ['none', 'character-three-view', 'character-three-view-face'],
  );
  assert.equal(normalizePersonReplacementAssetPromptPresetId('missing'), 'character-three-view');
  assert.equal(normalizePersonReplacementAssetPromptPresetId('none'), 'none');
  assert.equal(resolveGeneratedPersonReplacementAppearanceName('character-three-view', 2), '人物三视图');
  assert.equal(resolveGeneratedPersonReplacementAppearanceName('', 3), '形象 3');
  assert.equal(
    applyPersonReplacementCharacterAssetPromptPreset('character-three-view', '红大衣角色'),
    '生成全身三视图，右边放正视图，45度的侧视图，后视图，红大衣角色',
  );
});

test('personReplacementImageGeneration: state normalization preserves active task identity', () => {
  const state = normalizePersonReplacementImageGenerationState({
    status: 'QUEUED',
    shotId: ' shot-1 ',
    taskId: 'task-1',
    modelId: 'model-1',
    provider: 'provider-1',
    providerProfileId: 'profile-1',
    requestId: 'request-1',
    promptEnhancement: {
      prompt: 'enhanced',
      modelId: 'enhancer',
    },
    unsupported: true,
  });

  assert.deepEqual(state, {
    status: 'queued',
    shotId: 'shot-1',
    error: '',
    requestId: 'request-1',
    promptEnhancement: {
      prompt: 'enhanced',
      modelId: 'enhancer',
      provider: '',
      providerProfileId: '',
      createdAt: '',
      analysis: {},
    },
    taskId: 'task-1',
    modelId: 'model-1',
    provider: 'provider-1',
    providerProfileId: 'profile-1',
  });
  assert.equal(getRecoverablePersonReplacementImageTask(state).taskId, 'task-1');
  assert.equal(
    getRecoverablePersonReplacementImageTask({ status: 'queued', shotId: 'shot-1' }),
    null,
  );
});

test('personReplacementImageGeneration: state updates keep the active task and per-shot history', () => {
  const updated = updatePersonReplacementImageGenerationState(
    {
      imageGeneration: { status: 'running', shotId: 'shot-a', taskId: 'task-a', modelId: 'model' },
      imageGenerationsByShotId: {
        'shot-a': { status: 'queued', shotId: 'shot-a' },
      },
    },
    {
      status: 'queued',
      shotId: 'shot-b',
      taskId: 'task-b',
      modelId: 'model',
    },
  );

  assert.equal(updated.imageGeneration.shotId, 'shot-b');
  assert.deepEqual(Object.keys(updated.imageGenerationsByShotId), ['shot-a', 'shot-b']);
  assert.equal(resolvePersonReplacementImageGenerationState(updated, 'shot-a').status, 'queued');
  assert.equal(resolvePersonReplacementImageGenerationState(updated, 'shot-b').taskId, 'task-b');
  assert.deepEqual(
    normalizePersonReplacementImageGenerationsByShotId(
      {
        'shot-a': { status: 'succeeded', shotId: 'shot-a' },
        stale: { status: 'running', shotId: 'stale' },
      },
      [{ id: 'shot-a' }, { id: 'shot-b' }],
      { status: 'running', shotId: 'shot-b', taskId: 'task-b', modelId: 'model' },
    ),
    {
      'shot-a': {
        status: 'succeeded',
        shotId: 'shot-a',
        error: '',
      },
      'shot-b': {
        status: 'running',
        shotId: 'shot-b',
        error: '',
        taskId: 'task-b',
        modelId: 'model',
      },
    },
  );
});

test('personReplacementImageGeneration: mapping and UI revisions change only with visible state', () => {
  const project = createProject();
  const shot = createShot();
  const revision = createPersonReplacementImageGenerationMappingRevision({ project, shot });

  assert.equal(createPersonReplacementImageGenerationMappingRevision({ project, shot }), revision);
  assert.notEqual(
    createPersonReplacementImageGenerationMappingRevision({
      project: createProject({
        characters: [
          {
            id: 'target-a',
            name: 'Target A',
            appearances: [{ id: 'appearance-a', name: 'Base', imageUrl: 'data/assets/next.png' }],
          },
        ],
      }),
      shot,
    }),
    revision,
  );

  const before = {
    shots: [{ id: 'shot-1', replacementImageRef: 'data/assets/a.png' }],
    workspace: {
      selectedShotId: 'shot-1',
      imageGenerationsByShotId: {},
    },
  };
  assert.equal(
    resolvePersonReplacementImageGenerationUiRefreshScope(before, {
      ...before,
      shots: [{ id: 'shot-1', replacementImageRef: 'data/assets/b.png' }],
    }),
    'selected-shot',
  );
  assert.equal(
    resolvePersonReplacementImageGenerationUiRefreshScope(before, {
      ...before,
      shots: [
        { id: 'shot-1', replacementImageRef: 'data/assets/a.png' },
        { id: 'shot-2', replacementImageRef: 'data/assets/b.png' },
      ],
    }),
    'timeline',
  );
  assert.equal(resolvePersonReplacementImageGenerationUiRefreshScope(before, before), '');
});

test('personReplacementImageGeneration: adaptive params and result history stay deterministic', () => {
  const params = resolvePersonReplacementImageGenerationParams({
    modelId: 'apimart/gpt-image-2',
    generationParams: { aspectRatio: '自适应', imageSize: '2K' },
    sourceImageSize: { width: 1920, height: 1080 },
  });

  assert.deepEqual(params, {
    provider: 'apimart',
    generationParams: {
      mode: 'standard',
      quality: 'medium',
      imageSize: '2K',
      aspectRatio: '16:9',
      batchSize: 1,
    },
    requestedAspectRatio: '自适应',
    resolvedAspectRatio: '16:9',
    adaptiveSource: 'input-media',
  });

  const shot = {
    replacementImage: {
      results: [{ imageUrl: 'data/assets/a.png' }],
    },
  };
  assert.deepEqual(
    appendPersonReplacementImageResult(shot, { imageUrl: 'data/assets/a.png' }),
    {
      results: [{ imageUrl: 'data/assets/a.png' }],
      activeIndex: 0,
    },
  );
  assert.deepEqual(
    appendPersonReplacementImageResult(shot, { imageUrl: 'data/assets/b.png' }),
    {
      results: [
        { imageUrl: 'data/assets/a.png' },
        { imageUrl: 'data/assets/b.png' },
      ],
      activeIndex: 1,
    },
  );
});
