import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseBinghuoPriceCatalog,
  resolveBinghuoPricingContext,
  selectBinghuoPrice,
} from './binghuoPricingApi.js';

test('binghuoPricingApi: expands grouped catalogs and selects compatible prices', () => {
  const catalog = parseBinghuoPriceCatalog({
    ok: true,
    catalog_version: '2026-09-01',
    count: 1,
    models: [
      {
        family: 'video-family',
        status: 'active',
        unit: 'CNY',
        kind: 'video',
        category: 'video',
        billing: 'per_second',
        variants: [{ id: 'video-family-720', resolution: '720p', per_second: 0.5 }],
      },
    ],
  });

  assert.deepEqual(catalog, [
    {
      id: 'video-family-720',
      status: 'active',
      unit: 'CNY',
      kind: 'video',
      category: 'video',
      billing: 'per_second',
      price: { per_second: 0.5 },
      resolutions: ['720p'],
    },
  ]);
  assert.deepEqual(selectBinghuoPrice(catalog, { model: 'video-family-720', kind: 'video' }), {
    amount: 0.5,
    billing: 'per_second',
    currency: 'CNY',
  });
});

test('binghuoPricingApi: rejects malformed or unsupported catalog entries', () => {
  assert.throws(
    () =>
      parseBinghuoPriceCatalog({
        ok: true,
        catalog_version: 'v1',
        count: 2,
        models: [],
      }),
    /BH 价格目录格式无效/,
  );
  assert.throws(
    () =>
      selectBinghuoPrice(
        [
          {
            id: 'image-model',
            status: 'inactive',
            unit: 'CNY',
            kind: 'image',
            billing: 'per_call',
            price: { amount: 1 },
          },
        ],
        { model: 'image-model', kind: 'image' },
      ),
    /BH 当前型号价格暂不可用/,
  );
});

test('binghuoPricingApi: resolves provider context and mode-specific model tokens', () => {
  const context = resolveBinghuoPricingContext(
    { seed: 1 },
    {
      modelManifest: { kind: 'video', displayName: 'Binghuo Video' },
      executionManifest: {
        model: 'base-model',
        modeModels: { fast: { default: 'fast-model' } },
      },
    },
    { mode: 'fast', duration: 5 },
    () => ({ apiKey: ' key-1 ', apiUrl: 'https://bh.test/v1/' }),
  );

  assert.equal(context.baseUrl, 'https://bh.test');
  assert.equal(context.model, 'fast-model');
  assert.equal(context.kind, 'video');
  assert.equal(context.params.generationParams.mode, 'fast');
  assert.match(context.key, /fast-model/);
});
