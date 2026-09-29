import test from 'node:test';
import assert from 'node:assert/strict';

import { fetchStoryWorkspaceFromServer, saveStoryWorkspaceToServer } from './storyWorkspaceApi.js';

test('storyWorkspaceApi: reads null and saves workspace data through local endpoints', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    if (options.method === 'GET') return new Response(null, { status: 404 });
    return new Response(JSON.stringify({ saved: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    assert.equal(await fetchStoryWorkspaceFromServer(), null);
    assert.deepEqual(await saveStoryWorkspaceToServer({ projectId: 'project-1' }), {
      saved: true,
    });
    assert.equal(calls[0].url, '/api/v2/user/story-workspace.json');
    assert.equal(calls[0].options.method, 'GET');
    assert.equal(calls[1].url, '/api/v2/user/story-workspace.json');
    assert.equal(calls[1].options.method, 'POST');
    assert.deepEqual(JSON.parse(calls[1].options.body), {
      projectId: 'project-1',
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
