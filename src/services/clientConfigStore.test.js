import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getClientConfig,
  loadClientConfig,
  onClientConfigChange,
  resetClientConfigStore,
} from './clientConfigStore.js';

function stubFetch(impl) {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  return () => {
    globalThis.fetch = original;
  };
}

function jsonResponse(body, { ok = true } = {}) {
  return {
    ok,
    json: async () => body,
  };
}

test('clientConfigStore: caches the config and unwraps the data envelope', async () => {
  resetClientConfigStore();
  let calls = 0;
  const restore = stubFetch(async () => {
    calls += 1;
    return jsonResponse({ data: { configVersion: 3, product_display_name: 'Canvas' } });
  });
  try {
    assert.equal(getClientConfig(), null);
    const config = await loadClientConfig();
    assert.equal(config.configVersion, 3);
    await loadClientConfig();
    assert.equal(calls, 1, '第二次读取应命中缓存，不再打本地服务');
    assert.equal(getClientConfig().product_display_name, 'Canvas');
  } finally {
    restore();
    resetClientConfigStore();
  }
});

test('clientConfigStore: accepts a bare object payload without an envelope', async () => {
  resetClientConfigStore();
  const restore = stubFetch(async () => jsonResponse({ configVersion: 1 }));
  try {
    assert.equal((await loadClientConfig()).configVersion, 1);
  } finally {
    restore();
    resetClientConfigStore();
  }
});

test('clientConfigStore: failures stay silent and never throw into the UI', async () => {
  resetClientConfigStore();
  const restore = stubFetch(async () => {
    throw new Error('本地服务未就绪');
  });
  try {
    assert.equal(await loadClientConfig(), null);
    assert.equal(getClientConfig(), null);
  } finally {
    restore();
    resetClientConfigStore();
  }
});

test('clientConfigStore: non-ok responses and non-object bodies are ignored', async () => {
  resetClientConfigStore();
  const restore = stubFetch(async () => jsonResponse('nope', { ok: false }));
  try {
    assert.equal(await loadClientConfig(), null);
  } finally {
    restore();
    resetClientConfigStore();
  }

  const restore2 = stubFetch(async () => jsonResponse(null));
  try {
    assert.equal(await loadClientConfig(), null);
  } finally {
    restore2();
    resetClientConfigStore();
  }
});

test('clientConfigStore: concurrent callers share one in-flight request', async () => {
  resetClientConfigStore();
  let calls = 0;
  const restore = stubFetch(async () => {
    calls += 1;
    return jsonResponse({ configVersion: 9 });
  });
  try {
    const results = await Promise.all([loadClientConfig(), loadClientConfig()]);
    assert.equal(calls, 1);
    assert.deepEqual(results, [{ configVersion: 9 }, { configVersion: 9 }]);
  } finally {
    restore();
    resetClientConfigStore();
  }
});

test('clientConfigStore: subscribers are notified on refresh', async () => {
  resetClientConfigStore();
  const seen = [];
  const restore = stubFetch(async () => jsonResponse({ configVersion: 2 }));
  const unsubscribe = onClientConfigChange((config) => seen.push(config?.configVersion));
  try {
    await loadClientConfig();
    await loadClientConfig({ force: true });
    assert.deepEqual(seen, [2, 2]);
  } finally {
    unsubscribe();
    restore();
    resetClientConfigStore();
  }
});

test('clientConfigStore: a later subscriber receives the cached value immediately', async () => {
  resetClientConfigStore();
  const restore = stubFetch(async () => jsonResponse({ configVersion: 5 }));
  try {
    await loadClientConfig();
    let observed = null;
    const unsubscribe = onClientConfigChange((config) => {
      observed = config?.configVersion;
    });
    assert.equal(observed, 5);
    unsubscribe();
  } finally {
    restore();
    resetClientConfigStore();
  }
});

test('clientConfigStore: a throwing subscriber does not break the others', async () => {
  resetClientConfigStore();
  const restore = stubFetch(async () => jsonResponse({ configVersion: 6 }));
  let observed = null;
  const bad = onClientConfigChange(() => {
    throw new Error('订阅者自己炸了');
  });
  const good = onClientConfigChange((config) => {
    observed = config?.configVersion;
  });
  try {
    await loadClientConfig();
    assert.equal(observed, 6);
  } finally {
    bad();
    good();
    restore();
    resetClientConfigStore();
  }
});

test('clientConfigStore: non-function subscribers are rejected', () => {
  const unsubscribe = onClientConfigChange('not a function');
  assert.equal(typeof unsubscribe, 'function');
  unsubscribe();
});
