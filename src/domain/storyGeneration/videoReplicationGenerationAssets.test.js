import test from 'node:test';
import assert from 'node:assert/strict';

import {
  REPLICATION_IMAGE_APPEARANCE_GUIDANCE,
  buildVideoReplicationGenerationAssets,
} from './videoReplicationGenerationAssets.js';

test('videoReplicationGenerationAssets: non-replication calls preserve the original array', () => {
  const assets = [{ kind: 'character' }];
  assert.equal(buildVideoReplicationGenerationAssets(assets, { sourceMode: 'text-to-video' }), assets);
});

test('videoReplicationGenerationAssets: library images become reference appearances', () => {
  const assets = [
    {
      kind: 'character',
      description: 'old',
      appearances: [
        { sourceOrigin: 'library', imageUrl: 'asset://one', name: 'old name', prompt: 'old prompt' },
      ],
    },
  ];
  const result = buildVideoReplicationGenerationAssets(assets, { sourceMode: 'video-replication' });
  assert.notEqual(result, assets);
  assert.equal(result[0].description, REPLICATION_IMAGE_APPEARANCE_GUIDANCE);
  assert.equal(result[0].appearances[0].description, REPLICATION_IMAGE_APPEARANCE_GUIDANCE);
  assert.equal(result[0].appearances[0].prompt, '');
  assert.match(result[0].appearances[0].name, /1$/);
  assert.equal(assets[0].appearances[0].name, 'old name');
});

test('videoReplicationGenerationAssets: non-character and non-library entries keep identity', () => {
  const prop = { kind: 'prop' };
  const character = {
    kind: 'character',
    appearances: [{ sourceOrigin: 'external', imageUrl: 'https://example.test/a.png' }],
  };
  const result = buildVideoReplicationGenerationAssets([prop, character], {
    sourceMode: 'video-replication',
  });
  assert.equal(result[0], prop);
  assert.equal(result[1], character);
});
