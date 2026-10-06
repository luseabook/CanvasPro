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
    if (options.method === 'GET') return new Response(JSON.stringify({workspaceRevision: 3, workspace: {scene: 'loaded'}}), { status: 200, headers: {'content-type':'application/json'} });
    return new Response(JSON.stringify({ success: true, workspaceRevision: 4 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    assert.deepEqual(await fetchPersonReplacementWorkspaceFromServer(), {scene: 'loaded'});
    assert.deepEqual(await savePersonReplacementWorkspaceToServer({ scene: 'studio' }), {
      success: true, workspaceRevision: 4,
    });
    assert.equal(calls[0].url, '/api/v2/user/person-replacement-workspace.json');
    assert.deepEqual(JSON.parse(calls[1].options.body), {
      expectedRevision: 3, workspace: { scene: 'studio' },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('personReplacementWorkspaceApi: exposes revision conflicts with actionable guidance', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({error: 'Workspace revision conflict'}), {
    status: 409, headers: {'content-type': 'application/json'},
  });
  try {
    await assert.rejects(saveReplacementStudioWorkspaceToServer({scene: 'stale'}), error => {
      assert.equal(error.code, 'WORKSPACE_REVISION_CONFLICT');
      assert.match(error.message, /其他窗口更新/);
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
