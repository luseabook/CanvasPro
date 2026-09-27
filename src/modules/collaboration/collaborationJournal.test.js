import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollaborationJournal } from './collaborationJournal.js';

// 最小假 IndexedDB：open 异步回调 onupgradeneeded/onsuccess；事务在请求执行后异步 oncomplete
function createFakeIndexedDB(over = {}) {
  const stores = new Map();
  const log = { opens: [], transactions: [], closed: 0, versionchangeHandlers: [], held: [] };
  const failTx = 'failTx' in over ? over.failTx : null;
  const factory = {
    open(name, version) {
      log.opens.push([name, version]);
      const request = { result: null, error: null };
      setImmediate(() => {
        if ('openError' in over) {
          request.error = over.openError;
          request.onerror?.();
          return;
        }
        if (over.blocked) {
          request.onblocked?.();
          return;
        }
        const db = {
          createObjectStore(storeName) {
            stores.set(storeName, new Map());
          },
          transaction(storeName, mode) {
            log.transactions.push([storeName, mode]);
            const tx = { error: null };
            const map = stores.get(storeName);
            const store = {
              get: (key) => ({ result: structuredClone(map.get(key)) }),
              put: (value, key) => (map.set(key, structuredClone(value)), { result: key }),
              delete: (key) => (map.delete(key), { result: undefined }),
            };
            tx.objectStore = () => store;
            const settle = () => {
              if (failTx && failTx(mode)) {
                tx.error = 'txError' in over ? over.txError : null;
                tx.onabort?.();
              } else tx.oncomplete?.();
            };
            if (over.manual) log.held.push(settle);
            else setImmediate(settle);
            return tx;
          },
          close() {
            log.closed++;
          },
        };
        request.result = db;
        if (!stores.has('pending')) request.onupgradeneeded?.();
        request.onsuccess?.();
        log.versionchangeHandlers.push(db.onversionchange);
      });
      return request;
    },
  };
  return { factory, stores, log };
}

const ids = { roomId: 'room-1', actorId: 'actor-1', clientId: 'client-1' };
const KEY = JSON.stringify(['room-1', 'actor-1', 'client-1']);

test('createCollaborationJournal：没有 IndexedDB 时 available 为 false，读写都得 null', async () => {
  const journal = createCollaborationJournal({ ...ids, indexedDB: null });
  assert.equal(journal.available, false);
  assert.equal(await journal.read(), null);
  assert.equal(await journal.write({ a: 1 }), null);
  assert.equal(await journal.clear(), null);
  await journal.close();
});

test('createCollaborationJournal：写入带 schema:1，键为 [roomId, actorId, clientId] 的 JSON', async () => {
  const { factory, stores, log } = createFakeIndexedDB();
  const journal = createCollaborationJournal({ ...ids, indexedDB: factory });
  assert.equal(journal.available, true);
  const record = { changes: [{ id: 'n1' }], schema: 99 };
  assert.equal(await journal.write(record), KEY);
  assert.deepEqual(stores.get('pending').get(KEY), { changes: [{ id: 'n1' }], schema: 1 });
  // 写入的是拷贝
  record.changes.push({ id: 'n2' });
  assert.deepEqual(await journal.read(), { changes: [{ id: 'n1' }], schema: 1 });
  assert.deepEqual(log.opens, [['aicanvas-collaboration-recovery', 1]]);
  assert.deepEqual(log.transactions, [
    ['pending', 'readwrite'],
    ['pending', 'readonly'],
  ]);
});

test('createCollaborationJournal：clear 删除本键，不影响其他客户端的记录', async () => {
  const { factory, stores } = createFakeIndexedDB();
  const a = createCollaborationJournal({ ...ids, indexedDB: factory });
  const b = createCollaborationJournal({ ...ids, clientId: 'client-2', indexedDB: factory });
  await a.write({ v: 'a' });
  await b.write({ v: 'b' });
  await a.clear();
  assert.equal(await a.read(), undefined);
  assert.deepEqual(await b.read(), { v: 'b', schema: 1 });
  assert.equal(stores.get('pending').size, 1);
});

test('createCollaborationJournal：数据库只打开一次，操作按调用顺序串行', async () => {
  const { factory, log } = createFakeIndexedDB();
  const journal = createCollaborationJournal({ ...ids, indexedDB: factory });
  const results = await Promise.all([
    journal.write({ n: 1 }),
    journal.read(),
    journal.write({ n: 2 }),
    journal.read(),
    journal.clear(),
    journal.read(),
  ]);
  assert.deepEqual(results, [KEY, { n: 1, schema: 1 }, KEY, { n: 2, schema: 1 }, undefined, undefined]);
  assert.equal(log.opens.length, 1);
});

test('createCollaborationJournal：上一个事务完成前不开启下一个事务', async () => {
  const { factory, log } = createFakeIndexedDB({ manual: true });
  const journal = createCollaborationJournal({ ...ids, indexedDB: factory });
  const write = journal.write({ n: 1 });
  const read = journal.read();
  const settle = () => new Promise((resolve) => setImmediate(resolve));
  for (let i = 0; i < 5; i++) await settle();
  assert.deepEqual(log.transactions, [['pending', 'readwrite']]);
  log.held.shift()();
  assert.equal(await write, KEY);
  for (let i = 0; i < 5; i++) await settle();
  assert.deepEqual(log.transactions, [
    ['pending', 'readwrite'],
    ['pending', 'readonly'],
  ]);
  log.held.shift()();
  assert.deepEqual(await read, { n: 1, schema: 1 });
});

test('createCollaborationJournal：事务中止时拒绝并带事务错误或默认文案，后续操作不受影响', async () => {
  let fail = true;
  const { factory } = createFakeIndexedDB({ failTx: (mode) => fail && mode === 'readwrite' });
  const journal = createCollaborationJournal({ ...ids, indexedDB: factory });
  await assert.rejects(journal.write({ n: 1 }), { message: '无法写入协作恢复存储' });
  fail = false;
  assert.equal(await journal.write({ n: 2 }), KEY);
  assert.deepEqual(await journal.read(), { n: 2, schema: 1 });

  const txError = new Error('QuotaExceeded');
  const other = createFakeIndexedDB({ failTx: () => true, txError });
  const j2 = createCollaborationJournal({ ...ids, indexedDB: other.factory });
  await assert.rejects(j2.clear(), (err) => err === txError);
});

test('createCollaborationJournal：打开失败或被占用时拒绝', async () => {
  const openError = new Error('open failed');
  const failed = createCollaborationJournal({
    ...ids,
    indexedDB: createFakeIndexedDB({ openError }).factory,
  });
  await assert.rejects(failed.read(), (err) => err === openError);
  const blocked = createCollaborationJournal({
    ...ids,
    indexedDB: createFakeIndexedDB({ blocked: true }).factory,
  });
  await assert.rejects(blocked.read(), { message: '协作恢复存储正被其他窗口占用' });
  // 打开失败后 close 不抛错
  await failed.close();
});

test('createCollaborationJournal：close 等待排队操作后关闭连接；versionchange 时自动关闭', async () => {
  const { factory, log } = createFakeIndexedDB();
  const journal = createCollaborationJournal({ ...ids, indexedDB: factory });
  const pending = journal.write({ n: 1 });
  await journal.close();
  assert.equal(await pending, KEY);
  assert.equal(log.closed, 1);
  log.versionchangeHandlers[0]();
  assert.equal(log.closed, 2);
  // 从未打开过时 close 什么都不做
  const idle = createFakeIndexedDB();
  await createCollaborationJournal({ ...ids, indexedDB: idle.factory }).close();
  assert.equal(idle.log.opens.length, 0);
});
