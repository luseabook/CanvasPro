import test from 'node:test';
import assert from 'node:assert/strict';

import { createStoryAssetEvidenceDossiers } from './storyAssetEvidenceDossier.js';

test('storyAssetEvidenceDossier: prioritizes mentioned scenes and alias evidence', () => {
  const scenes = [
    {
      ref: 'scene-1',
      episodeRef: 'episode-1',
      episodeNumber: 1,
      heading: 'Opening',
      body: 'Hero enters the market.',
    },
    {
      ref: 'scene-2',
      episodeRef: 'episode-1',
      episodeNumber: 1,
      heading: 'Street',
      body: 'A courier passes by.',
    },
    {
      ref: 'scene-3',
      episodeRef: 'episode-2',
      episodeNumber: 2,
      heading: 'Return',
      body: '阿黎 returns to the market.',
    },
  ];
  const assets = [
    {
      ref: 'asset-1',
      kind: 'character',
      name: 'Hero (阿黎)',
      role: 'lead',
      description: 'main character',
      sourceEpisodeRefs: ['episode-1', 'episode-2'],
      sourceSceneRefs: ['scene-1', 'scene-3'],
      appearances: [
        {
          ref: 'appearance-1',
          name: 'Hero',
          description: 'lead',
          sourceSceneRefs: ['scene-3', 'scene-1'],
        },
      ],
    },
  ];

  const dossiers = createStoryAssetEvidenceDossiers(assets, scenes, {
    maxScenes: 2,
    maxCharacters: 700,
  });

  assert.equal(dossiers.length, 1);
  assert.equal(dossiers[0].assetRef, 'asset-1');
  assert.deepEqual(
    dossiers[0].evidence.map((item) => item.sourceSceneRef),
    ['scene-3', 'scene-1'],
  );
  assert.deepEqual(dossiers[0].inventoryHints.appearances[0].sourceSceneRefs, ['scene-3', 'scene-1']);
});

test('storyAssetEvidenceDossier: can omit source mappings while retaining evidence', () => {
  const dossiers = createStoryAssetEvidenceDossiers(
    [
      {
        ref: 'asset-2',
        kind: 'prop',
        name: 'Key',
        sourceSceneRefs: ['scene-1'],
        appearances: [],
      },
    ],
    [
      {
        ref: 'scene-1',
        episodeRef: 'episode-1',
        episodeNumber: 1,
        heading: 'Desk',
        body: 'A brass Key rests on the desk.',
      },
    ],
    { includeSourceMappings: false },
  );

  assert.equal('sourceSceneRefs' in dossiers[0], false);
  assert.equal(dossiers[0].evidence.length, 1);
});
