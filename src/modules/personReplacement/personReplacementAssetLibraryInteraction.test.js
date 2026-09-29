import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  addPersonReplacementAppearanceToLibraryWithFly,
  getNewPersonReplacementLibraryAssets,
  playPersonReplacementLibraryAssetsIntoProjectTab,
  requestPersonReplacementLibraryAssignment,
} from './personReplacementAssetLibraryInteraction.js';
import { PERSON_REPLACEMENT_WORKSPACE_INTENTS } from './personReplacementWorkspaceIntentPort.js';

test('personReplacementAssetLibraryInteraction: asks the user to select a compatible library item', () => {
  const toasts = [];
  const calls = [];

  const result = requestPersonReplacementLibraryAssignment({
    project: { libraryAssets: [{ id: 'audio-1', mediaKind: 'audio', audioUrl: '   ' }] },
    selectedAssetIds: ['audio-1'],
    targetKind: 'audio',
    root: {},
    documentObject: {},
    windowObject: { showToast: (...args) => toasts.push(args) },
    hasWorkspaceIntent: () => false,
    runIntent: (...args) => calls.push(args),
  });

  assert.equal(result, undefined);
  assert.deepEqual(toasts, [['请选择总素材中的音频后再加入项目。', 'warn']]);
  assert.equal(calls.length, 0);
});

test('personReplacementAssetLibraryInteraction: forwards valid audio references to the character intent', () => {
  const calls = [];
  const result = requestPersonReplacementLibraryAssignment({
    project: {
      libraryAssets: [
        {
          id: 'audio-1',
          mediaKind: 'audio',
          audioUrl: 'data/uploads/voice.wav',
          sourceAssetId: 'source-audio',
          sourceItemIndex: 2,
        },
      ],
    },
    selectedAssetIds: ['audio-1'],
    targetKind: 'audio',
    root: {
      querySelector: () => null,
      querySelectorAll: () => [],
    },
    documentObject: {},
    windowObject: {},
    hasWorkspaceIntent: () => false,
    runIntent: (...args) => {
      calls.push(args);
      return { addedCount: 0 };
    },
  });

  assert.deepEqual(result, { addedCount: 0 });
  assert.deepEqual(calls, [
    [
      PERSON_REPLACEMENT_WORKSPACE_INTENTS.ADD_LIBRARY_ASSETS_TO_CHARACTERS,
      { assetRefs: [{ assetId: 'source-audio', itemIndex: 2 }] },
    ],
  ]);
});

test('personReplacementAssetLibraryInteraction: blocks scene imports when the workspace capability is missing', () => {
  const toasts = [];
  const result = requestPersonReplacementLibraryAssignment({
    project: {
      libraryAssets: [
        {
          id: 'scene-1',
          mediaKind: 'image',
          sourceUrl: 'data/uploads/scene.png',
          sourceAssetId: 'source-scene',
        },
      ],
    },
    selectedAssetIds: ['scene-1'],
    targetKind: 'scene',
    root: {},
    documentObject: {},
    windowObject: { showToast: (...args) => toasts.push(args) },
    hasWorkspaceIntent: () => false,
    runIntent: () => {
      throw new Error('must not run');
    },
  });

  assert.equal(result, undefined);
  assert.deepEqual(toasts, [['当前场景素材导入能力尚未初始化。', 'warn']]);
});

test('personReplacementAssetLibraryInteraction: filters out source items already present in the project', () => {
  const additions = [
    { sourceAssetId: 'asset-1', sourceItemIndex: 0 },
    { sourceAssetId: 'asset-1', sourceItemIndex: 1 },
    { sourceAssetId: 'asset-2', sourceItemIndex: 0 },
  ];
  const project = {
    characters: [
      { sourceOrigin: 'library', sourceAssetId: 'asset-1', sourceItemIndex: 0 },
      { sourceOrigin: 'workspace', sourceAssetId: 'asset-2', sourceItemIndex: 0 },
    ],
  };

  assert.deepEqual(getNewPersonReplacementLibraryAssets(project, additions, 'character'), [
    { sourceAssetId: 'asset-1', sourceItemIndex: 1 },
    { sourceAssetId: 'asset-2', sourceItemIndex: 0 },
  ]);
  assert.deepEqual(getNewPersonReplacementLibraryAssets(project, additions, 'audio'), additions);
});

test('personReplacementAssetLibraryInteraction: fly animation requires the target tab and a visible source', () => {
  assert.equal(
    playPersonReplacementLibraryAssetsIntoProjectTab(
      { querySelector: () => null, querySelectorAll: () => [] },
      [{ id: 'asset-1' }],
      1,
      'character',
      {},
      {},
    ),
    false,
  );
  assert.equal(
    playPersonReplacementLibraryAssetsIntoProjectTab(
      {
        querySelector: () => ({}),
        querySelectorAll: () => [],
      },
      [{ id: 'asset-1' }],
      1,
      'character',
      {},
      {},
    ),
    true,
  );
  assert.equal(
    playPersonReplacementLibraryAssetsIntoProjectTab(
      {
        querySelector: () => ({}),
        querySelectorAll: () => [],
      },
      [{ id: 'asset-1' }],
      0,
      'character',
      {},
      {},
    ),
    false,
  );
});

test('personReplacementAssetLibraryInteraction: appearance upload returns null until the backend accepts it', async () => {
  const calls = [];
  const result = await addPersonReplacementAppearanceToLibraryWithFly(
    { querySelector: () => null },
    { id: 'character-1' },
    { id: 'appearance-1' },
    { id: 'project-1' },
    async (project, ids) => {
      calls.push([project, ids]);
      return { ok: false };
    },
    {},
    {},
  );

  assert.equal(result, null);
  assert.deepEqual(calls, [
    [{ id: 'project-1' }, { characterId: 'character-1', appearanceId: 'appearance-1' }],
  ]);
});
