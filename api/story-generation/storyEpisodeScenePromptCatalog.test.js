import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createStoryEpisodeSplitCompactSceneCatalog,
  createStoryEpisodeSplitPromptSceneCatalog,
} from './storyEpisodeScenePromptCatalog.js';

const sceneAssets = [
  {
    kind: 'scene',
    id: 'scene-1',
    ref: 'scene-asset-1',
    name: 'Studio',
    description: 'wide room',
    baseAppearanceRef: 'appearance-b',
    appearances: [
      { ref: 'appearance-a', prompt: 'first look' },
      { ref: 'appearance-b', description: 'bright wall' },
    ],
    sourceSceneRefs: ['source-1', 'source-1', 'source-2'],
  },
  {
    kind: 'character',
    ref: 'character-1',
  },
];

test('storyEpisodeScenePromptCatalog builds compact scene entries', () => {
  const catalog = createStoryEpisodeSplitCompactSceneCatalog(sceneAssets, {
    includeSpatialAnchors: true,
  });

  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].code, 's1');
  assert.equal(catalog[0].name, 'Studio');
  assert.equal(catalog[0].ref, 'appearance-b');
  assert.equal(catalog[0].assetRef, 'scene-asset-1');
  assert.deepEqual(catalog[0].sourceSceneRefs, ['source-1', 'source-2']);
  assert.match(catalog[0].spatialAnchor, /bright wall/);
  assert.match(catalog[0].spatialAnchor, /wide room/);
});

test('storyEpisodeScenePromptCatalog includes anchors only for seedance 2.5', () => {
  const seedance25 = createStoryEpisodeSplitPromptSceneCatalog(sceneAssets, 'seedance-2.5');
  const seedance20 = createStoryEpisodeSplitPromptSceneCatalog(sceneAssets, 'seedance-2.0');

  assert.equal(typeof seedance25[0].spatialAnchor, 'string');
  assert.equal('spatialAnchor' in seedance20[0], false);
  assert.deepEqual(Object.keys(seedance20[0]), ['code', 'name']);
});
