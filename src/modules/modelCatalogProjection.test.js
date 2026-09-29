import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findProjectedModelOption,
  getModelCatalogProviderLabel,
  isPublicModelCatalogEntry,
  projectPublicModelCatalog,
} from './modelCatalogProjection.js';
import { getModelsByKind } from '../manifests/modelRegistry.js';

test('modelCatalogProjection: provider labels are localized and fall back to the provider id', () => {
  assert.equal(getModelCatalogProviderLabel(' runninghubwf '), 'RunningHub 工作流');
  assert.equal(getModelCatalogProviderLabel('volcengine-speech'), '火山语音');
  assert.equal(getModelCatalogProviderLabel('custom-provider'), 'custom-provider');
  assert.equal(getModelCatalogProviderLabel(''), '');
});

test('modelCatalogProjection: public listing rejects kind mismatches and hidden providers', () => {
  assert.equal(
    isPublicModelCatalogEntry('image', {
      kind: 'image',
      provider: 'agnes',
    }),
    true,
  );
  assert.equal(
    isPublicModelCatalogEntry('image', {
      kind: 'video',
      provider: 'agnes',
    }),
    false,
  );
  assert.equal(
    isPublicModelCatalogEntry('image', {
      kind: 'image',
      provider: 'ppio',
    }),
    false,
  );
});

test('modelCatalogProjection: projection filters hidden models and exposes stable display fields', () => {
  const projected = projectPublicModelCatalog('image');

  assert.ok(projected.length > 0);
  assert.equal(projected.some((model) => model.provider === 'ppio'), false);
  assert.equal(projected.every((model) => model.kind === 'image'), true);
  assert.equal(
    projected.every(
      (model) =>
        typeof model.modelId === 'string' &&
        typeof model.providerLabel === 'string' &&
        typeof model.label === 'string' &&
        typeof model.description === 'string' &&
        typeof model.icon === 'string' &&
        typeof model.vip === 'boolean',
    ),
    true,
  );

  const first = projected[0];
  const projectedWithFilter = projectPublicModelCatalog('image', {
    isEligible: (manifest) => manifest.modelId === first.modelId,
  });
  assert.deepEqual(
    projectedWithFilter.map((model) => model.modelId),
    [first.modelId],
  );
  assert.deepEqual(findProjectedModelOption(projected, first.modelId), first);
  assert.equal(findProjectedModelOption(projected, 'missing'), null);
});

test('modelCatalogProjection: known providers receive their catalog icon default', () => {
  const runningHubModel = getModelsByKind('image').find(
    (model) => model.provider === 'runninghubwf',
  );

  assert.ok(runningHubModel);
  const projected = projectPublicModelCatalog('image').find(
    (model) => model.modelId === runningHubModel.modelId,
  );
  assert.equal(projected?.icon, 'images/RH.png');
  assert.equal(projected?.providerLabel, 'RunningHub 工作流');
});
