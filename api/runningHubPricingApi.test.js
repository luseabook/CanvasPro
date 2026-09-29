import test from 'node:test';
import assert from 'node:assert/strict';

import {
  fetchRunningHubPricing,
  resolveRunningHubPricingContext,
} from './runningHubPricingApi.js';

function createResolvedImageManifest() {
  return {
    modelManifest: {
      kind: 'image',
      provider: 'runninghub',
      modelId: 'test/runninghub-pricing-image',
      displayName: 'Pricing image',
      uiSchema: { fields: [] },
    },
    executionManifest: {
      kind: 'image',
      provider: 'runninghub',
      adapterType: 'modelApi',
      endpoint: '/openapi/v2/pricing-test',
      model: 'pricing-test',
      bodyMapping: [],
      responseMapping: {},
      extensions: {},
    },
  };
}

test('runningHubPricingApi: resolves international-only profiles and credential scope', () => {
  const profileRequests = [];
  const manifest = {
    kind: 'image',
    provider: 'runninghub',
    modelId: 'runninghub-model/veo3',
    displayName: 'Veo 3',
    uiSchema: { fields: [] },
  };
  const execution = { kind: 'image', adapterType: 'modelApi', extensions: {} };
  const resolve = (apiKey) =>
    resolveRunningHubPricingContext(
      { providerProfileId: 'runninghub', prompt: 'draw', imageSize: '1024' },
      { modelManifest: manifest, executionManifest: execution },
      { imageSize: '1024' },
      (profileId) => {
        profileRequests.push(profileId);
        return { modelApiKey: apiKey };
      },
    );

  const first = resolve('international-key');
  const sameCredential = resolve('international-key');
  const changedCredential = resolve('other-key');

  assert.deepEqual(profileRequests, [
    'runninghub-international',
    'runninghub-international',
    'runninghub-international',
  ]);
  assert.equal(first.baseUrl, 'https://www.runninghub.ai');
  assert.equal(first.apiKey, 'international-key');
  assert.equal(first.persist, false);
  assert.equal(first.debounceMs, 350);
  assert.equal(typeof first.params.generationParams, 'object');
  assert.equal(first.params.generationParams.duration, 8);
  assert.equal(first.params.prompt, 'draw');
  assert.equal(first.key, sameCredential.key);
  assert.notEqual(first.key, changedCredential.key);

  assert.equal(
    resolveRunningHubPricingContext(
      {},
      {
        modelManifest: { ...manifest, kind: 'text' },
        executionManifest: execution,
      },
      {},
      () => ({ modelApiKey: 'unused' }),
    ),
    null,
  );
  assert.equal(
    resolveRunningHubPricingContext(
      {},
      {
        modelManifest: manifest,
        executionManifest: { ...execution, extensions: { resolverOwnsInputs: true } },
      },
      {},
      () => ({ modelApiKey: 'unused' }),
    ),
    null,
  );
});

test('runningHubPricingApi: rewrites the request to the price preview endpoint', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        estimatedPrice: 1.25,
        currency: 'USD',
        isFreeThisCall: true,
      }),
    };
  };

  try {
    const result = await fetchRunningHubPricing({
      apiKey: 'pricing-key',
      baseUrl: 'https://www.runninghub.cn',
      kind: 'image',
      references: [{ type: 'image', url: 'https://assets.example/input.png' }],
      hasReferences: true,
      params: {
        prompt: 'draw',
        generationParams: {},
      },
      resolved: createResolvedImageManifest(),
    });

    assert.equal(calls.length, 1);
    const requestUrl = new URL(calls[0].url, 'https://local.example');
    assert.equal(
      requestUrl.searchParams.get('apiUrl'),
      'https://www.runninghub.cn/openapi/v2/price-preview/pricing-test',
    );
    assert.deepEqual(calls[0].options.headers, {
      'Content-Type': 'application/json',
      Authorization: 'Bearer pricing-key',
    });
    assert.deepEqual(JSON.parse(calls[0].options.body), {});
    assert.deepEqual(result, {
      estimatedPrice: 1.25,
      currency: 'USD',
      isFreeThisCall: true,
      excludesReferenceUsage: true,
      referenceBasis: 'textToImage',
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('runningHubPricingApi: surfaces credential and quote failures', async () => {
  const originalFetch = globalThis.fetch;
  const request = {
    apiKey: 'pricing-key',
    baseUrl: 'https://www.runninghub.cn',
    kind: 'image',
    params: { prompt: 'draw', generationParams: {} },
    resolved: createResolvedImageManifest(),
  };

  try {
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ errorCode: '1014' }),
    });
    await assert.rejects(
      () => fetchRunningHubPricing(request),
      (error) => /Key.*API/u.test(error.message),
    );

    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ estimatedPrice: '1.25', currency: 'USD' }),
    });
    await assert.rejects(
      () => fetchRunningHubPricing(request),
      /\u53c2\u8003\u4ef7\u6682\u4e0d\u53ef\u7528/u,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
