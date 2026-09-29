import test from 'node:test';
import assert from 'node:assert/strict';

import { fetchTutorialContent } from './tutorialContentApi.js';

test('tutorialContentApi: fetches and normalizes remote tutorial content', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(
      JSON.stringify({
        schemaVersion: 1,
        revision: 7,
        guide: { enabled: false, title: 'Guide', url: '' },
        tutorials: [],
        updates: [],
        guides: [],
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  };

  try {
    const catalog = await fetchTutorialContent({ timeout: 500 });
    assert.equal(catalog.revision, 7);
    assert.equal(catalog.guide.enabled, false);
    assert.equal(request.url, 'https://api.ashuoai.com/api/subscription/canvas-content');
    assert.equal(request.options.cache, 'no-store');
    assert.equal(request.options.credentials, 'omit');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('tutorialContentApi: reports HTTP failures', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 503 });

  try {
    await assert.rejects(() => fetchTutorialContent(), /教程加载失败/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
