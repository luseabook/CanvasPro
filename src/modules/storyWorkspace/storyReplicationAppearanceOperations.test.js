import test from 'node:test';
import assert from 'node:assert/strict';

import { removeStoryReplicationCharacterAppearance } from './storyReplicationAppearanceOperations.js';

function createState() {
  return {
    data: { project: { sourceMode: 'video-replication' } },
    assetAppearanceIndexes: { 'asset-a': 1 },
    pendingDeleteAssetAppearanceKey: 'pending',
  };
}

function createAsset(overrides = {}) {
  return {
    id: 'asset-a',
    kind: 'character',
    baseAppearanceId: 'appearance-a',
    appearances: [
      { id: 'appearance-a', imageUrl: 'https://example.com/a.png' },
      { id: 'appearance-b', imageUrl: 'https://example.com/b.png' },
    ],
    ...overrides,
  };
}

test('storyReplicationAppearanceOperations removes an appearance and clamps its index', () => {
  const state = createState();
  const asset = createAsset();

  assert.equal(removeStoryReplicationCharacterAppearance(state, asset, 'appearance-b'), true);
  assert.deepEqual(
    asset.appearances.map((appearance) => appearance.id),
    ['appearance-a'],
  );
  assert.equal(asset.baseAppearanceId, 'appearance-a');
  assert.equal(state.assetAppearanceIndexes['asset-a'], 0);
  assert.equal(state.pendingDeleteAssetAppearanceKey, '');
});

test('storyReplicationAppearanceOperations rejects invalid or empty removals', () => {
  const nonReplicationState = { data: { project: { sourceMode: 'story' } } };
  const nonReplicationAsset = createAsset();
  assert.equal(
    removeStoryReplicationCharacterAppearance(
      nonReplicationState,
      nonReplicationAsset,
      'appearance-a',
    ),
    false,
  );
  assert.equal(nonReplicationAsset.appearances.length, 2);

  const state = createState();
  const singleAsset = createAsset({
    baseAppearanceId: 'appearance-a',
    appearances: [{ id: 'appearance-a', imageUrl: '' }],
  });
  assert.equal(
    removeStoryReplicationCharacterAppearance(state, singleAsset, 'appearance-a'),
    false,
  );
  assert.equal(singleAsset.appearances.length, 1);
});
