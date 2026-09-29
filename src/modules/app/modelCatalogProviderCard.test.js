import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bindModelCatalogProviderCardVisibility,
  isModelCatalogProviderVisible,
} from './modelCatalogProviderCard.js';

const READY_CATALOG = { provider: 'OpenAI', status: 'ready', modelCount: 3 };

test('modelCatalogProviderCard: 两个导出都是函数', () => {
  assert.equal(typeof isModelCatalogProviderVisible, 'function');
  assert.equal(typeof bindModelCatalogProviderCardVisibility, 'function');
});

test('modelCatalogProviderCard: provider 去空白大小写无关，providerId 不能为空', () => {
  assert.equal(isModelCatalogProviderVisible(READY_CATALOG, 'openai'), true);
  assert.equal(isModelCatalogProviderVisible(READY_CATALOG, 'OPENAI'), true);
  assert.equal(isModelCatalogProviderVisible(READY_CATALOG, '  OpenAI  '), true);
  assert.equal(isModelCatalogProviderVisible({ provider: ' p ', status: 'ready', modelCount: 1 }, 'p'), true);
  assert.equal(isModelCatalogProviderVisible(READY_CATALOG, 'anthropic'), false);

  for (const providerId of ['', '   ', undefined, null, 0, false, {}]) {
    assert.equal(isModelCatalogProviderVisible(READY_CATALOG, providerId), false, String(providerId));
  }
  for (const provider of [undefined, null, '', 0, false, 'openai-x', '  ']) {
    assert.equal(
      isModelCatalogProviderVisible({ provider, status: 'ready', modelCount: 1 }, 'openai'),
      false,
      String(provider),
    );
  }
  assert.equal(isModelCatalogProviderVisible(READY_CATALOG), false);
});

test('modelCatalogProviderCard: status 必须严格等于 ready', () => {
  for (const status of [
    'Ready',
    'READY',
    ' ready ',
    'pending',
    'failed',
    '',
    undefined,
    null,
    true,
    1,
    {},
  ]) {
    assert.equal(
      isModelCatalogProviderVisible({ provider: 'p', status, modelCount: 2 }, 'p'),
      false,
      String(status),
    );
  }
  assert.equal(isModelCatalogProviderVisible({ provider: 'p', status: 'ready', modelCount: 2 }, 'p'), true);
});

test('modelCatalogProviderCard: modelCount 需有限正数，数字字符串与 true 也算', () => {
  for (const modelCount of [
    0,
    -1,
    -0,
    'abc',
    NaN,
    Infinity,
    -Infinity,
    null,
    undefined,
    '',
    [],
    {},
    false,
    '0',
  ]) {
    assert.equal(
      isModelCatalogProviderVisible({ provider: 'p', status: 'ready', modelCount }, 'p'),
      false,
      String(modelCount),
    );
  }
  for (const modelCount of [1, 2.5, '3', true]) {
    assert.equal(
      isModelCatalogProviderVisible({ provider: 'p', status: 'ready', modelCount }, 'p'),
      true,
      String(modelCount),
    );
  }
  assert.ok(-0 === 0);
  assert.equal(Object.is(-0, 0), false);
});

test('modelCatalogProviderCard: 非对象状态一律不可见', () => {
  for (const state of [null, undefined, {}, 'openai', 7, false, []]) {
    assert.equal(isModelCatalogProviderVisible(state, 'openai'), false, String(state));
  }
  assert.equal(isModelCatalogProviderVisible(), false);
});

test('modelCatalogProviderCard: 缺少 card 时返回空抑制器', () => {
  for (const over of [{}, { card: null }, { card: undefined }, { card: 0 }, { card: '' }]) {
    const dispose = bindModelCatalogProviderCardVisibility(over);
    assert.equal(typeof dispose, 'function', String(over.card));
    assert.equal(dispose(), undefined, String(over.card));
  }
});

test('modelCatalogProviderCard: 缺 store 时按空切片即时求值', () => {
  const card = { hidden: 'unset' };
  const dispose = bindModelCatalogProviderCardVisibility({ card });
  assert.equal(card.hidden, true);
  assert.equal(typeof dispose, 'function');
  assert.equal(dispose(), undefined);
});

test('modelCatalogProviderCard: 绑定即按 modelCatalog 切片即时求值', () => {
  const visible = { hidden: 'unset' };
  bindModelCatalogProviderCardVisibility({
    store: {
      getStateRaw: () => ({
        modelCatalog: { provider: ' OpenAI ', status: 'ready', modelCount: 2 },
        subscription: { plan: 'pro' },
      }),
    },
    card: visible,
    providerId: 'openai',
  });
  assert.equal(visible.hidden, false);

  const hidden = { hidden: 'unset' };
  bindModelCatalogProviderCardVisibility({
    store: {
      getStateRaw: () => ({ modelCatalog: { provider: 'OpenAI', status: 'ready', modelCount: 0 } }),
    },
    card: hidden,
    providerId: 'openai',
  });
  assert.equal(hidden.hidden, true);
});

test('modelCatalogProviderCard: 优先走 subscribeSelector 并返回其抑制器', () => {
  const registrations = [];
  const card = { hidden: 'unset' };
  const dispose = bindModelCatalogProviderCardVisibility({
    store: {
      subscribeSelector: (selector, callback) => {
        registrations.push({ selector, callback });
        return 'disposed';
      },
    },
    card,
    providerId: 'OPENAI',
  });
  assert.equal(registrations.length, 1);
  assert.equal(dispose, 'disposed');
  assert.equal(card.hidden, 'unset');
  assert.deepEqual(registrations[0].selector({ modelCatalog: READY_CATALOG }), READY_CATALOG);
  assert.deepEqual(registrations[0].selector(undefined), {});
  assert.deepEqual(registrations[0].selector({ subscription: { plan: 'pro' } }), {});
  registrations[0].callback(READY_CATALOG);
  assert.equal(card.hidden, false);
  registrations[0].callback({ provider: 'openai', status: 'ready', modelCount: -1 });
  assert.equal(card.hidden, true);
});

test('modelCatalogProviderCard: subscribe 推送时按各自 providerId 更新 hidden', () => {
  const listeners = [];
  const store = {
    getStateRaw: () => ({ modelCatalog: { provider: 'p', status: 'ready', modelCount: 1 } }),
    subscribe: (callback) => {
      listeners.push(callback);
      return () => {
        const index = listeners.indexOf(callback);
        if (index >= 0) listeners.splice(index, 1);
      };
    },
  };
  const card = { hidden: 'unset' };
  bindModelCatalogProviderCardVisibility({ store, card, providerId: 'p' });
  assert.equal(card.hidden, false);
  for (const listener of [...listeners]) {
    listener({ modelCatalog: { provider: 'p', status: 'ready', modelCount: 0 } });
  }
  assert.equal(card.hidden, true);
  for (const listener of [...listeners]) {
    listener({ modelCatalog: {} });
  }
  assert.equal(card.hidden, true);
  for (const listener of [...listeners]) {
    listener({ modelCatalog: { provider: 'p', status: 'ready', modelCount: 5 } });
  }
  assert.equal(card.hidden, false);
});

test('modelCatalogProviderCard: 同一 catalog 下每张卡按各自 providerId 判定', () => {
  const store = {
    getStateRaw: () => ({
      modelCatalog: { provider: 'anthropic', status: 'ready', modelCount: 4 },
    }),
  };
  const openaiCard = { hidden: 'unset' };
  const anthropicCard = { hidden: 'unset' };
  bindModelCatalogProviderCardVisibility({ store, card: openaiCard, providerId: 'openai' });
  bindModelCatalogProviderCardVisibility({ store, card: anthropicCard, providerId: 'ANTHROPIC' });
  assert.equal(openaiCard.hidden, true);
  assert.equal(anthropicCard.hidden, false);
});

test('modelCatalogProviderCard: 空 store 视为空切片', () => {
  const card = { hidden: 'unset' };
  const dispose = bindModelCatalogProviderCardVisibility({ store: {}, card, providerId: 'p' });
  assert.equal(card.hidden, true);
  assert.equal(typeof dispose, 'function');
  assert.equal(dispose(), undefined);
});
