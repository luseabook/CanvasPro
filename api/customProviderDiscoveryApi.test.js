import test from 'node:test';
import assert from 'node:assert/strict';

import {
  analyzeCustomProviderDocumentation,
  buildCustomProviderManifestDraft,
  deleteCustomProviderManifestBundle,
  discoverCustomProvider,
  listCustomProviderManifestBundles,
  saveCustomProviderManifestBundle,
  validateCustomProviderManifestDraft,
} from './customProviderDiscoveryApi.js';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('customProviderDiscoveryApi: unwraps discovery and manifest operations', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    if (url === '/api/v2/custom-providers/manifest-bundles') {
      return jsonResponse({ bundles: [{ id: 'bundle-1' }] });
    }
    return jsonResponse({ ok: url });
  };

  try {
    assert.deepEqual(await discoverCustomProvider({ baseUrl: 'https://api.test' }), {
      ok: '/api/v2/custom-providers/discover',
    });
    assert.deepEqual(await buildCustomProviderManifestDraft({ provider: {} }), {
      ok: '/api/v2/custom-providers/build-manifest-draft',
    });
    assert.deepEqual(await validateCustomProviderManifestDraft({ draft: true }), {
      ok: '/api/v2/custom-providers/validate-manifest-draft',
    });
    assert.deepEqual(await saveCustomProviderManifestBundle({ id: 'a' }), {
      ok: '/api/v2/custom-providers/save-manifest-bundle',
    });
    assert.deepEqual(await listCustomProviderManifestBundles(), {
      bundles: [{ id: 'bundle-1' }],
    });
    assert.deepEqual(await deleteCustomProviderManifestBundle(' id/with space '), {
      ok: '/api/v2/custom-providers/manifest-bundles/id%2Fwith%20space',
    });

    assert.deepEqual(
      calls.map(({ url, options }) => [url, options.method || 'GET']),
      [
        ['/api/v2/custom-providers/discover', 'POST'],
        ['/api/v2/custom-providers/build-manifest-draft', 'POST'],
        ['/api/v2/custom-providers/validate-manifest-draft', 'POST'],
        ['/api/v2/custom-providers/save-manifest-bundle', 'POST'],
        ['/api/v2/custom-providers/manifest-bundles', 'GET'],
        ['/api/v2/custom-providers/manifest-bundles/id%2Fwith%20space', 'DELETE'],
      ],
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('customProviderDiscoveryApi: rejects API envelopes that are not successful', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => jsonResponse({ error: 'discovery failed' }, 500);
  try {
    await assert.rejects(() => discoverCustomProvider({}), /discovery failed/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('customProviderDiscoveryApi: returns a server bundle without invoking an agent', async () => {
  const originalFetch = globalThis.fetch;
  let requestCalls = 0;
  let postedBody;
  globalThis.fetch = async (_url, options) => {
    postedBody = JSON.parse(options.body);
    return jsonResponse({ bundle: { id: 'compiled' }, needsAgent: true });
  };

  try {
    const result = await analyzeCustomProviderDocumentation(
      {
        provider: { providerId: 'p', name: ' Provider ', baseUrl: 'https://api.test' },
        models: [{ upstreamModelId: ' model-1 ', kind: ' IMAGE ' }],
        documentationUrl: 'https://docs.test',
      },
      {
        settings: { provider: 'agent-provider', model: 'agent-model' },
        request: async () => {
          requestCalls += 1;
          return '{}';
        },
      },
    );

    assert.deepEqual(result, { bundle: { id: 'compiled' }, needsAgent: true });
    assert.equal(requestCalls, 0);
    assert.deepEqual(postedBody.models, [{ upstreamModelId: 'model-1', kind: 'image' }]);
    assert.equal(postedBody.provider.name, 'Provider');
    assert.equal(postedBody.provider.baseUrl, 'https://api.test');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('customProviderDiscoveryApi: validates and compiles an agent contract', async () => {
  const originalFetch = globalThis.fetch;
  const fetchCalls = [];
  const requestCalls = [];
  const agentContract = { modelResults: [], profiles: [], warnings: [] };
  globalThis.fetch = async (url, options = {}) => {
    fetchCalls.push({ url, body: options.body ? JSON.parse(options.body) : null });
    if (fetchCalls.length === 1) {
      return jsonResponse({
        needsAgent: true,
        document: {
          source: 'local_document',
          url: 'https://docs.test/api',
          fingerprint: 'fp-1',
          text: 'local docs',
        },
      });
    }
    return jsonResponse({
      analysis: { agentReview: { needsRepair: false } },
      bundle: { id: 'compiled' },
    });
  };

  try {
    const result = await analyzeCustomProviderDocumentation(
      {
        provider: { providerId: 'p', name: 'Provider', baseUrl: 'https://api.test' },
        models: [{ upstreamModelId: 'image-1', kind: 'image' }],
        documentationDocument: { name: 'docs.md', contentType: 'text/markdown', text: 'local docs' },
      },
      {
        settings: { provider: 'agent-provider', model: 'agent-model', webSearch: true },
        request: async (request) => {
          requestCalls.push(request);
          return JSON.stringify(agentContract);
        },
      },
    );

    assert.equal(result.bundle.id, 'compiled');
    assert.equal(requestCalls.length, 1);
    assert.equal(requestCalls[0].provider, 'agent-provider');
    assert.equal(requestCalls[0].model, 'agent-model');
    assert.equal(requestCalls[0].temperature, 0);
    assert.equal(requestCalls[0].webSearch, false);
    assert.match(requestCalls[0].prompt, /image-1/);
    assert.equal(fetchCalls.length, 2);
    assert.deepEqual(fetchCalls[1].body.agentAnalysis, agentContract);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('customProviderDiscoveryApi: repairs an invalid agent response once', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCount = 0;
  const prompts = [];
  globalThis.fetch = async () => {
    fetchCount += 1;
    if (fetchCount === 1) {
      return jsonResponse({
        needsAgent: true,
        document: { source: 'local_document', url: '', fingerprint: 'fp', text: 'docs' },
      });
    }
    return jsonResponse({
      analysis: { agentReview: { needsRepair: false } },
      bundle: { id: 'repaired' },
    });
  };

  try {
    const result = await analyzeCustomProviderDocumentation(
      {
        provider: { providerId: 'p', name: 'Provider', baseUrl: 'https://api.test' },
        models: [{ upstreamModelId: 'm1', kind: 'image' }],
        documentationDocument: { name: 'docs.md', text: 'docs' },
      },
      {
        settings: { provider: 'agent-provider', model: 'agent-model' },
        request: async ({ prompt }) => {
          prompts.push(prompt);
          return prompts.length === 1
            ? 'not json'
            : JSON.stringify({ modelResults: [], profiles: [], warnings: [] });
        },
      },
    );

    assert.equal(result.bundle.id, 'repaired');
    assert.equal(prompts.length, 2);
    assert.match(prompts[1], /previous response was invalid|previousResponse/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
