import test from 'node:test';
import assert from 'node:assert/strict';

import {
  fetchPersonReplacementWorkspaceFromServer,
  fetchReplacementStudioWorkspaceFromServer,
  savePersonReplacementWorkspaceToServer,
  saveReplacementStudioWorkspaceToServer,
} from './personReplacementWorkspaceApi.js';

test('personReplacementWorkspaceApi: keeps compatibility aliases and local request shape', async () => {
  assert.equal(fetchPersonReplacementWorkspaceFromServer, fetchReplacementStudioWorkspaceFromServer);
  assert.equal(savePersonReplacementWorkspaceToServer, saveReplacementStudioWorkspaceToServer);

  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    if (options.method === 'GET') return new Response(null, { status: 404 });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    assert.equal(await fetchPersonReplacementWorkspaceFromServer(), null);
    assert.deepEqual(await savePersonReplacementWorkspaceToServer({ scene: 'studio' }), {
      success: true,
    });
    assert.equal(calls[0].url, '/api/v2/user/person-replacement-workspace.json');
    assert.deepEqual(JSON.parse(calls[1].options.body), { scene: 'studio' });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
