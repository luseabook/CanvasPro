import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchPromptPresetSettingsFromServer, savePromptPresetSettingsToServer } from './promptPresetsApi.js';

const SETTINGS_PATH = '/api/v2/user/presets/settings';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: { 'content-type': 'application/json' },
  });
}

function installFetchStub(handler) {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options: options });
    return handler({ url: String(url), options: options }, calls.length);
  };
  return {
    calls: calls,
    restore: () => {
      globalThis.fetch = originalFetch;
    },
  };
}

async function withFetchStub(handler, run) {
  const stub = installFetchStub(handler);
  try {
    return await run(stub);
  } finally {
    stub.restore();
  }
}

test('settings are read with a local GET on the presets settings path', async () => {
  await withFetchStub(
    () => jsonResponse({ defaultQuickCaptureNodeType: 'ai-video' }),
    async (stub) => {
      const settings = await fetchPromptPresetSettingsFromServer();
      assert.deepEqual(settings, { defaultQuickCaptureNodeType: 'ai-video' });
      assert.equal(stub.calls.length, 1);
      assert.equal(stub.calls[0].url, SETTINGS_PATH);
      assert.equal(stub.calls[0].options.method, 'GET');
    },
  );
});

test('a non-object settings payload degrades to an empty object', async () => {
  await withFetchStub(
    () => jsonResponse(null),
    async () => {
      assert.deepEqual(await fetchPromptPresetSettingsFromServer(), {});
    },
  );
});

test('a transport failure is swallowed and answers an empty object', async () => {
  await withFetchStub(
    () => {
      throw new Error('offline');
    },
    async () => {
      assert.deepEqual(await fetchPromptPresetSettingsFromServer(), {});
    },
  );
});

test('settings are written with a local POST carrying only the node type', async () => {
  await withFetchStub(
    () => jsonResponse({ defaultQuickCaptureNodeType: 'ai-text' }),
    async (stub) => {
      await savePromptPresetSettingsToServer({ defaultQuickCaptureNodeType: 'ai-text' });
      assert.equal(stub.calls.length, 1);
      assert.equal(stub.calls[0].url, SETTINGS_PATH);
      assert.equal(stub.calls[0].options.method, 'POST');
      assert.deepEqual(JSON.parse(stub.calls[0].options.body), {
        defaultQuickCaptureNodeType: 'ai-text',
      });
      assert.equal(stub.calls[0].options.headers['Content-Type'], 'application/json');
    },
  );
});

test('an omitted node type is sent as an empty string', async () => {
  await withFetchStub(
    () => jsonResponse({ defaultQuickCaptureNodeType: '' }),
    async (stub) => {
      await savePromptPresetSettingsToServer();
      assert.deepEqual(JSON.parse(stub.calls[0].options.body), {
        defaultQuickCaptureNodeType: '',
      });
    },
  );
});

test('a failed settings write rejects so the caller can roll its optimistic state back', async () => {
  await withFetchStub(
    () => jsonResponse({ message: 'boom' }, 500),
    async () => {
      await assert.rejects(() =>
        savePromptPresetSettingsToServer({ defaultQuickCaptureNodeType: 'ai-text' }),
      );
    },
  );
});
