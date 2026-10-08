import test from 'node:test';
import assert from 'node:assert/strict';

import { fetchTutorialContent } from './tutorialContentApi.js';
import { CONTENT_ORIGIN } from '../src/modules/tutorials/tutorialCatalog.js';

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
    assert.equal(request.url, `${CONTENT_ORIGIN}/api/subscription/canvas-content`);
    assert.equal(request.options.cache, 'no-store');
    assert.equal(request.options.credentials, 'omit');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('tutorialContentApi: honours the admin-configured content origin', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url) => {
    request = { url };
    return new Response(
      JSON.stringify({
        schemaVersion: 1,
        revision: 1,
        guide: { enabled: false, title: 'Guide', url: '' },
        tutorials: [],
        updates: [],
        guides: [],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  };

  try {
    await fetchTutorialContent({ timeout: 500, origin: 'https://cdn.example.com' });
    assert.equal(request.url, 'https://cdn.example.com/api/subscription/canvas-content');
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
