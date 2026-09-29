import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createStoryAssetLocalEvidenceScenes,
  createStoryAssetLocalExtractionBatches,
  createStoryAssetLocalExtractionChunks,
  extractStoryAssetMentionsLocal,
} from './storyAssetLocalExtractionApi.js';

test('storyAssetLocalExtractionApi: creates overlapping chunks and bounded batches', () => {
  const chunks = createStoryAssetLocalExtractionChunks(
    [{ ref: 'scene-1', episodeRef: 'episode-1', body: 'a'.repeat(650) }],
    { maxChunkCharacters: 300, overlapCharacters: 50 },
  );

  assert.deepEqual(
    chunks.map(({ start, end }) => [start, end]),
    [
      [0, 300],
      [250, 550],
      [500, 650],
    ],
  );
  assert.deepEqual(createStoryAssetLocalExtractionBatches([1, 2, 3, 4, 5], { batchSize: 2 }), [
    [1, 2],
    [3, 4],
    [5],
  ]);
});

test('storyAssetLocalExtractionApi: normalizes local mentions and builds evidence scenes', async () => {
  const progress = [];
  const response = await extractStoryAssetMentionsLocal({
    sourceScenes: [
      {
        ref: 'scene-1',
        episodeRef: 'episode-1',
        body: 'Hero meets Hero in Market.',
      },
    ],
    localExtract: async (batch) => ({
      model: 'local-model',
      device: 'cpu',
      precision: 'fp16',
      chunks: [
        {
          id: batch[0].id,
          entities: [
            {
              kind: 'character',
              text: 'Hero, Hero',
              start: 0,
              end: 4,
              probability: 1.5,
            },
            { kind: 'scene', text: 'Market', start: 19, end: 25 },
            { kind: 'unknown', text: 'ignored', start: 0, end: 7 },
          ],
        },
      ],
    }),
    onProgress: (entry) => progress.push(entry),
  });

  assert.equal(response.model, 'local-model');
  assert.equal(response.device, 'cpu');
  assert.equal(response.precision, 'fp16');
  assert.deepEqual(
    response.mentions.map((mention) => ({
      kind: mention.kind,
      text: mention.text,
      start: mention.start,
      end: mention.end,
    })),
    [
      { kind: 'character', text: 'Hero', start: 0, end: 4 },
      { kind: 'scene', text: 'Market', start: 19, end: 25 },
    ],
  );
  assert.equal(response.mentions[0].probability, 1);
  assert.equal(progress.length, 2);

  const evidenceScenes = createStoryAssetLocalEvidenceScenes(
    [{ ref: 'scene-1', body: 'Hero meets Hero in Market.' }],
    response.mentions,
  );
  assert.deepEqual(evidenceScenes[0].localEntityCandidates, {
    character: ['Hero'],
    scene: ['Market'],
    prop: [],
  });
  assert.match(evidenceScenes[0].body, /PP-UIE 本地候选/);
});
