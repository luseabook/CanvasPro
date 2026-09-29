import test from 'node:test';
import assert from 'node:assert/strict';

import {
  HIDDEN_MODEL_PROVIDER_IDS,
  isModelManifestPubliclyListed,
  isModelProviderPubliclyListed,
} from './modelCatalogVisibility.js';

test('modelCatalogVisibility: hides configured providers case-insensitively', () => {
  assert.deepEqual(HIDDEN_MODEL_PROVIDER_IDS, ['ppio']);
  assert.equal(isModelProviderPubliclyListed('acme'), true);
  assert.equal(isModelProviderPubliclyListed('  ACME  '), true);
  assert.equal(isModelProviderPubliclyListed('PPIO'), false);
  assert.equal(isModelProviderPubliclyListed(''), false);
  assert.equal(isModelProviderPubliclyListed(null), false);
});

test('modelCatalogVisibility: derives manifest visibility from provider', () => {
  assert.equal(isModelManifestPubliclyListed({ provider: 'acme' }), true);
  assert.equal(isModelManifestPubliclyListed({ provider: 'ppio' }), false);
  assert.equal(isModelManifestPubliclyListed(null), false);
});
