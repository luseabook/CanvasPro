import test from 'node:test';
import assert from 'node:assert/strict';

test('initialThemeBootstrap: applies the stored theme when the module loads', async () => {
  const originalDocument = globalThis.document;
  const originalLocalStorage = globalThis.localStorage;
  const attributes = [];

  globalThis.document = {
    documentElement: {
      setAttribute(name, value) {
        attributes.push([name, value]);
      },
    },
  };
  globalThis.localStorage = {
    getItem(key) {
      return key === 'ai-canvas-theme' ? 'light' : null;
    },
  };

  try {
    await import(`./initialThemeBootstrap.js?case=${Date.now()}`);
    assert.deepEqual(attributes, [['data-theme', 'light']]);
  } finally {
    globalThis.document = originalDocument;
    globalThis.localStorage = originalLocalStorage;
  }
});
