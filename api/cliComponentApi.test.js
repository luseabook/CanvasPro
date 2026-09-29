import test from 'node:test';
import assert from 'node:assert/strict';

import { CLI_COMPONENT_CHANGED, ensureCliComponent, fetchCliComponents } from './cliComponentApi.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('cliComponentApi: loads component status', async () => {
  const originalFetch = globalThis.fetch;
  const component = { provider: 'codex', phase: 'ready', installed: true };
  try {
    globalThis.fetch = async () =>
      jsonResponse({
        components: { codex: component },
      });

    assert.deepEqual(await fetchCliComponents(), { components: { codex: component } });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('cliComponentApi: installs a component and broadcasts completion', async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const calls = [];
  const events = [];
  try {
    globalThis.window = {
      dispatchEvent(event) {
        events.push(event);
        return true;
      },
    };
    globalThis.fetch = async (url, options = {}) => {
      calls.push({ url, options });
      if (String(url) === '/api/v2/cli-providers/components')
        return jsonResponse({
          components: {
            codex: { provider: 'codex', phase: 'missing', installed: false },
          },
        });
      if (String(url) === '/api/v2/cli-providers/codex/install-component')
        return jsonResponse({
          provider: 'codex',
          phase: 'ready',
          installed: true,
        });
      throw new Error(`unexpected url: ${url}`);
    };

    const result = await ensureCliComponent('codex');

    assert.deepEqual(result, { provider: 'codex', phase: 'ready', installed: true });
    assert.equal(calls.length, 2);
    assert.equal(calls[1].options.method, 'POST');
    assert.equal(events.length, 1);
    assert.equal(events[0].type, CLI_COMPONENT_CHANGED);
    assert.deepEqual(events[0].detail, result);
  } finally {
    globalThis.fetch = originalFetch;
    if (typeof originalWindow === 'undefined') delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});

test('cliComponentApi: rejects malformed component payloads', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => jsonResponse({ components: [] });
    await assert.rejects(fetchCliComponents());
  } finally {
    globalThis.fetch = originalFetch;
  }
});
