import test from 'node:test';
import assert from 'node:assert/strict';
import { createRhAiAppPersistence } from './rhAiAppPersistence.js';

const STORAGE_KEY = 'aiCanvas.runningHubAiApp.savedApps.v1';

function makeStorage(over = {}) {
  return {
    items: new Map(),
    failWith: 'failWith' in over ? over.failWith : null,
    setItem(key, value) {
      if (this.failWith) throw this.failWith;
      this.items.set(key, value);
    },
  };
}

function makeBridge(over = {}) {
  return {
    available: 'available' in over ? over.available : true,
    result: 'result' in over ? over.result : { ok: true },
    writes: [],
    isAvailable() {
      return this.available;
    },
    async write(snapshot) {
      this.writes.push(snapshot);
      return this.result;
    },
  };
}

test('writes through the bridge and reports ok', async () => {
  const bridge = makeBridge();
  const committed = [];
  const save = createRhAiAppPersistence({ externalBridge: bridge, storage: null, onWarning: () => {} });
  const snapshot = { savedApps: [{ id: 'a' }] };
  const result = await save(() => snapshot, { onCommitted: () => committed.push('done') });
  assert.deepEqual(result, { ok: true });
  assert.deepEqual(bridge.writes, [snapshot]);
  assert.deepEqual(committed, ['done']);
});

test('skips the bridge when it is unavailable', async () => {
  const bridge = makeBridge({ available: false });
  const save = createRhAiAppPersistence({ externalBridge: bridge, storage: null, onWarning: () => {} });
  await save(() => ({ savedApps: [] }), {});
  assert.deepEqual(bridge.writes, []);
});

test('propagates the bridge error message', async () => {
  const bridge = makeBridge({ result: { ok: false, error: '磁盘已满' } });
  const save = createRhAiAppPersistence({ externalBridge: bridge, storage: null, onWarning: () => {} });
  await assert.rejects(() => save(() => ({}), {}), /磁盘已满/);
});

test('uses a default message when the bridge fails without one', async () => {
  const bridge = makeBridge({ result: { ok: false } });
  const save = createRhAiAppPersistence({ externalBridge: bridge, storage: null, onWarning: () => {} });
  await assert.rejects(() => save(() => ({}), {}), /模型文件保存失败，请重试/);
});

test('mirrors savedApps into local storage when saveApps is set', async () => {
  const bridge = makeBridge({ available: false });
  const storage = makeStorage();
  const save = createRhAiAppPersistence({ externalBridge: bridge, storage, onWarning: () => {} });
  await save(() => ({ savedApps: [{ id: 'one' }] }), { saveApps: true });
  assert.equal(storage.items.get(STORAGE_KEY), JSON.stringify([{ id: 'one' }]));
});

test('swallows a local-storage failure when the bridge already committed', async () => {
  const bridge = makeBridge();
  const storage = makeStorage({ failWith: new Error('quota') });
  const warnings = [];
  const committed = [];
  const save = createRhAiAppPersistence({
    externalBridge: bridge,
    storage,
    onWarning: (...args) => warnings.push(args),
  });
  const result = await save(() => ({ savedApps: [] }), {
    saveApps: true,
    onCommitted: () => committed.push('done'),
  });
  assert.deepEqual(result, { ok: true });
  assert.deepEqual(committed, ['done']);
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0][1].message, 'quota');
});

test('rethrows a local-storage failure when the bridge is unavailable', async () => {
  const bridge = makeBridge({ available: false });
  const storage = makeStorage({ failWith: new Error('quota') });
  const save = createRhAiAppPersistence({ externalBridge: bridge, storage, onWarning: () => {} });
  await assert.rejects(() => save(() => ({ savedApps: [] }), { saveApps: true }), /quota/);
});

test('rejects when saveApps is set but storage cannot be written', async () => {
  const bridge = makeBridge({ available: false });
  const save = createRhAiAppPersistence({ externalBridge: bridge, storage: {}, onWarning: () => {} });
  await assert.rejects(() => save(() => ({ savedApps: [] }), { saveApps: true }), /模型存储不可用/);
});

test('serializes overlapping saves', async () => {
  const bridge = makeBridge({ available: false });
  const save = createRhAiAppPersistence({ externalBridge: bridge, storage: null, onWarning: () => {} });
  const order = [];
  let releaseFirst;
  const first = save(
    () => {
      order.push('read-first');
      return { savedApps: [] };
    },
    { onCommitted: () => order.push('commit-first') },
  );
  const second = save(
    () => {
      order.push('read-second');
      return { savedApps: [] };
    },
    { onCommitted: () => order.push('commit-second') },
  );
  await second;
  assert.deepEqual(order, ['read-first', 'commit-first', 'read-second', 'commit-second']);
  await first;
  releaseFirst?.();
});

test('keeps the queue alive after a rejected save', async () => {
  let failing = true;
  const bridge = {
    isAvailable: () => true,
    async write() {
      if (failing) throw new Error('boom');
      return { ok: true };
    },
  };
  const save = createRhAiAppPersistence({ externalBridge: bridge, storage: null, onWarning: () => {} });
  await assert.rejects(() => save(() => ({}), {}), /boom/);
  failing = false;
  const result = await save(() => ({ savedApps: [] }), {});
  assert.deepEqual(result, { ok: true });
});
