import test from 'node:test';
import assert from 'node:assert/strict';

import { fetchCanvasShortcuts, saveCanvasShortcuts } from './canvasShortcutsApi.js';

test('canvasShortcutsApi: loads and saves shortcut catalogs', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  try {
    globalThis.fetch = async (url, options = {}) => {
      calls.push({ url, options });
      const data =
        options.method === 'GET'
          ? { catalog: { undo: ['Ctrl+Z'] }, revision: 1 }
          : { catalog: { undo: ['Meta+Z'] }, revision: 2 };
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    assert.deepEqual(await fetchCanvasShortcuts(), {
      catalog: { undo: ['Ctrl+Z'] },
      revision: 1,
    });
    assert.deepEqual(await saveCanvasShortcuts({ undo: ['Meta+Z'] }, 1), {
      catalog: { undo: ['Meta+Z'] },
      revision: 2,
    });

    assert.equal(calls[0].url, '/api/v2/canvas-shortcuts');
    assert.equal(calls[0].options.method, 'GET');
    assert.equal(calls[1].url, '/api/v2/canvas-shortcuts');
    assert.equal(calls[1].options.method, 'POST');
    assert.deepEqual(JSON.parse(calls[1].options.body), {
      catalog: { undo: ['Meta+Z'] },
      revision: 1,
      developerMode: true,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
