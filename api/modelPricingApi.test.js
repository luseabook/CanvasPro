import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MODEL_PRICE_TTL,
  createModelPricingCache,
  fetchModelPricing,
} from './modelPricingApi.js';

function createMemoryStorage(initial = []) {
  const values = new Map();
  if (initial.length) values.set('aicanvas.model-pricing.v1', JSON.stringify(initial));
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    values,
  };
}

test('modelPricingApi: deduplicates cached requests and expires them at the TTL', async () => {
  let now = 1_000;
  let calls = 0;
  let resolvePrice;
  const cache = createModelPricingCache({
    now: () => now,
    storage: () => null,
    fetchPrice: () => {
      calls += 1;
      return new Promise((resolve) => {
        resolvePrice = resolve;
      });
    },
  });
  const request = { key: 'apimart|example|model-a', persist: true };

  const first = cache.ensure(request);
  const second = cache.ensure(request);
  await Promise.resolve();
  assert.equal(calls, 1);
  resolvePrice({ amount: 1.25, currency: 'USD' });
  await Promise.all([first, second]);

  assert.equal(calls, 1);
  assert.deepEqual(cache.peek(request).data, { amount: 1.25, currency: 'USD' });
  assert.equal(cache.stale(cache.peek(request)), false);
  now += MODEL_PRICE_TTL - 1;
  assert.equal(cache.stale(cache.peek(request)), false);
  now += 1;
  assert.equal(cache.stale(cache.peek(request)), true);
});

test('modelPricingApi: persists only durable entries and reloads them', async () => {
  const storage = createMemoryStorage();
  const durable = createModelPricingCache({
    now: () => 2_000,
    storage: () => storage,
    fetchPrice: async () => ({ amount: 2, currency: 'USD' }),
  });

  await durable.ensure({ key: 'persist', persist: true });
  await durable.ensure({ key: 'transient', persist: false });

  const persisted = JSON.parse(storage.getItem('aicanvas.model-pricing.v1'));
  assert.deepEqual(
    persisted.map(([key]) => key),
    ['persist'],
  );

  const reloaded = createModelPricingCache({
    now: () => 2_000,
    storage: () => storage,
    fetchPrice: async () => {
      throw new Error('should not fetch');
    },
  });
  assert.equal(reloaded.peek({ key: 'persist' }).data.amount, 2);
  assert.equal(reloaded.peek({ key: 'transient' }), null);
});

test('modelPricingApi: caches failures briefly and falls back to stale data', async () => {
  let now = 0;
  let calls = 0;
  let fail = false;
  const cache = createModelPricingCache({
    now: () => now,
    storage: () => null,
    fetchPrice: async () => {
      calls += 1;
      if (fail) throw new Error('pricing unavailable');
      return { amount: calls, currency: 'USD' };
    },
  });
  const request = { key: 'fail-sensitive' };

  await cache.ensure(request);
  now += MODEL_PRICE_TTL;
  fail = true;
  await assert.rejects(() => cache.ensure(request), /pricing unavailable/u);
  assert.equal(calls, 2);

  const staleFallback = await cache.ensure(request);
  assert.equal(staleFallback.data.amount, 1);
  assert.equal(calls, 2);

  now += 60_001;
  fail = false;
  assert.equal((await cache.ensure(request)).data.amount, 3);
  assert.equal(calls, 3);
});

test('modelPricingApi: surfaces malformed generic pricing responses', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({ success: true, data: null }),
  });

  try {
    await assert.rejects(
      () =>
        fetchModelPricing({
          provider: 'apimart',
          baseUrl: 'https://pricing.example',
          model: 'model-a',
        }),
      /价格暂不可用/u,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
