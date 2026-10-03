import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PROVIDER_MODEL_CATALOG_PROVIDER_IDS,
  applyProviderModelCatalog,
  buildProviderModelsUrl,
  collectEnabledVendorModels,
  getProviderModelCatalogOwnerProviderId,
  inferProviderModelKind,
  isProviderModelCatalogProvider,
  mergeProviderModelCatalog,
  normalizeProviderModelListPayload,
  readProviderModelCatalog,
} from './providerModelCatalog.js';

test('providerModelCatalog: covers both Agnes lines only', () => {
  assert.deepEqual([...PROVIDER_MODEL_CATALOG_PROVIDER_IDS], ['agnes-domestic', 'agnes']);
  assert.equal(isProviderModelCatalogProvider('agnes'), true);
  assert.equal(isProviderModelCatalogProvider('agnes-domestic'), true);
  assert.equal(isProviderModelCatalogProvider('grsai'), false);
});

test('providerModelCatalog: both lines share one model id prefix', () => {
  assert.equal(getProviderModelCatalogOwnerProviderId('agnes-domestic'), 'agnes');
  assert.equal(getProviderModelCatalogOwnerProviderId('agnes'), 'agnes');
});

test('providerModelCatalog: builds the models url for bare, versioned and full endpoints', () => {
  assert.equal(
    buildProviderModelsUrl('agnes', 'https://apihub.agnes-ai.com'),
    'https://apihub.agnes-ai.com/v1/models',
  );
  assert.equal(
    buildProviderModelsUrl('agnes', 'https://apihub.agnes-ai.com/'),
    'https://apihub.agnes-ai.com/v1/models',
  );
  assert.equal(
    buildProviderModelsUrl('agnes', 'https://apihub.agnes-ai.com/v1'),
    'https://apihub.agnes-ai.com/v1/models',
  );
  assert.equal(
    buildProviderModelsUrl('agnes-domestic', 'https://api.agnes-ai.cn/v1/chat/completions'),
    'https://api.agnes-ai.cn/v1/models',
  );
});

test('providerModelCatalog: falls back to the provider default url and refuses gemini paths', () => {
  assert.equal(buildProviderModelsUrl('agnes-domestic', ''), 'https://api.agnes-ai.cn/v1/models');
  assert.equal(
    buildProviderModelsUrl('agnes', 'https://example.com/v1beta/models/gemini:generateContent'),
    '',
  );
});

test('providerModelCatalog: infers kind from the vendor id', () => {
  assert.equal(inferProviderModelKind('agnes', 'agnes-image-2.5-flash'), 'image');
  assert.equal(inferProviderModelKind('agnes', 'agnes-video-2.5'), 'video');
  assert.equal(inferProviderModelKind('agnes', 'agnes-video-v2.0'), 'video');
  assert.equal(inferProviderModelKind('agnes', 'agnes-3.0-flash'), 'text');
  assert.equal(inferProviderModelKind('agnes', 'agnes-2.5-pro-alpha'), 'text');
});

test('providerModelCatalog: normalizes the live /v1/models payload', () => {
  const payload = {
    data: [
      { id: 'agnes-3.0-flash', object: 'model', created: 1626777600 },
      { id: 'agnes-2.5-flash' },
      { id: 'agnes-3.0-flash' },
      { id: '  ' },
    ],
    object: 'list',
    success: true,
  };
  assert.deepEqual(
    normalizeProviderModelListPayload(payload).map((entry) => entry.id),
    ['agnes-2.5-flash', 'agnes-3.0-flash'],
  );
  assert.deepEqual(normalizeProviderModelListPayload(['b', 'a', 'b']), [
    { id: 'a', created: 0 },
    { id: 'b', created: 0 },
  ]);
  assert.deepEqual(normalizeProviderModelListPayload(null), []);
});

test('providerModelCatalog: re-fetch keeps the previous selection and kind', () => {
  const previous = [
    { id: 'agnes-3.0-flash', kind: 'text', enabled: true },
    { id: 'agnes-image-2.5-flash', kind: 'image', enabled: false },
  ];
  const merged = mergeProviderModelCatalog('agnes', previous, [
    { id: 'agnes-3.0-flash' },
    { id: 'agnes-image-2.5-flash' },
    { id: 'agnes-4.0-flash' },
  ]);
  assert.deepEqual(merged, [
    { id: 'agnes-3.0-flash', kind: 'text', enabled: true },
    { id: 'agnes-4.0-flash', kind: 'text', enabled: false },
    { id: 'agnes-image-2.5-flash', kind: 'image', enabled: false },
  ]);
});

test('providerModelCatalog: applying a selection stores it on the provider entry', () => {
  const stored = applyProviderModelCatalog(
    { apiKey: 'k', routeId: 'demo' },
    {
      fetchedAt: '2026-01-01T00:00:00.000Z',
      models: [
        { id: 'agnes-3.0-flash', kind: 'text', enabled: true },
        { id: 'agnes-image-2.5-flash', kind: 'image', enabled: true },
        { id: 'agnes-video-2.5', kind: 'video', enabled: false },
      ],
    },
  );
  assert.equal(stored.apiKey, 'k');
  assert.equal(stored.routeId, 'demo');
  assert.equal(readProviderModelCatalog(stored).fetchedAt, '2026-01-01T00:00:00.000Z');
  assert.deepEqual(readProviderModelCatalog(stored).models, [
    { id: 'agnes-3.0-flash', kind: 'text', enabled: true },
    { id: 'agnes-image-2.5-flash', kind: 'image', enabled: true },
    { id: 'agnes-video-2.5', kind: 'video', enabled: false },
  ]);
});

test('providerModelCatalog: empty selection clears the catalog', () => {
  assert.deepEqual(applyProviderModelCatalog({ apiKey: 'k' }, { models: [] }), { apiKey: 'k' });
  const stored = applyProviderModelCatalog(
    { apiKey: 'k' },
    { fetchedAt: '2026-01-01T00:00:00.000Z', models: [{ id: 'agnes-3.0-flash', enabled: false }] },
  );
  assert.equal(stored.apiKey, 'k');
  assert.deepEqual(readProviderModelCatalog(stored).models, [
    { id: 'agnes-3.0-flash', kind: 'text', enabled: false },
  ]);
});

test('providerModelCatalog: collects enabled models across both lines', () => {
  const collected = collectEnabledVendorModels({
    providers: {
      agnes: { modelCatalog: { models: [{ id: 'agnes-3.0-flash', kind: 'text', enabled: true }] } },
      'agnes-domestic': {
        modelCatalog: { models: [{ id: 'agnes-3.0-flash', kind: 'text', enabled: true }] },
      },
      grsai: { modelCatalog: { models: [{ id: 'gemini-3.1-pro', kind: 'text', enabled: true }] } },
    },
  });
  assert.deepEqual([...collected.keys()], ['agnes-3.0-flash']);
  assert.deepEqual(collected.get('agnes-3.0-flash').providerIds, ['agnes-domestic', 'agnes']);
});
