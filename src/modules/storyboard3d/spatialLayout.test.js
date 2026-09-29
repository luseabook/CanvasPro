import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyStoryboard3DDiningLayout,
  describeStoryboard3DAssetSpatialMetadata,
  getStoryboard3DAssetSpatialExtent,
  normalizeStoryboard3DGeneratedLayout,
  resolveStoryboard3DAssetSpatialMetadata,
} from './spatialLayout.js';

test('spatialLayout: semantic roles and dimensions are inferred for common assets', () => {
  assert.deepEqual(resolveStoryboard3DAssetSpatialMetadata({ name: 'round table' }), {
    dimensions: { width: 1.2, height: 0.75, depth: 1.2 },
    source: 'semantic',
    anchor: 'ground',
    roles: ['table', 'support'],
    supportHeight: 0.75,
    seatHeight: 0,
  });
  assert.deepEqual(resolveStoryboard3DAssetSpatialMetadata({ name: 'chair' }).roles, ['seat']);
  assert.deepEqual(resolveStoryboard3DAssetSpatialMetadata({ category: 'food' }).roles, ['tabletop-item']);
});

test('spatialLayout: explicit and measured dimensions take precedence', () => {
  assert.deepEqual(
    resolveStoryboard3DAssetSpatialMetadata({
      name: 'x',
      spatial: {
        dimensions: { width: 1, height: 2, depth: 3 },
        roles: ['wall', 'invalid'],
        anchor: 'support',
        supportHeight: 0.5,
      },
    }),
    {
      dimensions: { width: 1, height: 2, depth: 3 },
      source: 'provided',
      anchor: 'support',
      roles: ['wall'],
      supportHeight: 0.5,
      seatHeight: 0,
    },
  );
  const measured = resolveStoryboard3DAssetSpatialMetadata({
    assetRecord: {
      bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 2, z: 3 } },
      defaultScale: 2,
    },
  });
  assert.equal(measured.source, 'measured');
  assert.deepEqual(measured.dimensions, { width: 2, height: 4, depth: 6 });
});

test('spatialLayout: extent and descriptions reflect resolved metadata', () => {
  assert.equal(getStoryboard3DAssetSpatialExtent({ name: 'chair' }), 0.9);
  const description = describeStoryboard3DAssetSpatialMetadata({ name: 'chair' });
  assert.match(description, /source=semantic/);
  assert.match(description, /roles=seat/);
  assert.match(description, /seatY=0\.45m/);
});

test('spatialLayout: generated layout normalizes kind and participant count', () => {
  assert.deepEqual(normalizeStoryboard3DGeneratedLayout({ kind: 'dining', participantCount: 20 }), {
    kind: 'dining',
    participantCount: 8,
  });
  assert.deepEqual(normalizeStoryboard3DGeneratedLayout({ kind: 'other', participantCount: -1 }), {
    kind: 'generic',
    participantCount: 0,
  });
});

test('spatialLayout: dining layout creates missing table, seats, and participants', () => {
  const result = applyStoryboard3DDiningLayout([{ type: 'prop', assetId: 'plate' }], {
    participantCount: 2,
    assets: [
      { id: 'table', name: 'round table' },
      { id: 'chair', name: 'chair' },
      { id: 'plate', name: 'plate', spatial: { roles: ['tabletop-item'] } },
    ],
  });
  assert.equal(result.applied, true);
  assert.equal(result.participantCount, 2);
  assert.equal(result.objects.filter((object) => object.type === 'character').length, 2);
  assert.equal(result.objects.filter((object) => object.assetId === 'chair').length, 2);
  assert.equal(result.objects.find((object) => object.assetId === 'table').name, 'Dining table');
  for (const character of result.objects.filter((object) => object.type === 'character')) {
    assert.equal(character.actionId, 'seated');
    assert.equal(character.actionPlaying, false);
  }
});

test('spatialLayout: dining layout is a no-op without participants', () => {
  const objects = [];
  const result = applyStoryboard3DDiningLayout(objects, { participantCount: 0, assets: [] });
  assert.equal(result.applied, false);
  assert.notEqual(result.objects, objects);
});
