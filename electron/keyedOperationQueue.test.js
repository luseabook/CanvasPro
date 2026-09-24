import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCaseInsensitivePathKey, createKeyedOperationQueue } from './keyedOperationQueue.js';

test('operations sharing a key run strictly one after another', async () => {
  const queue = createKeyedOperationQueue(),
    order = [];
  let releaseFirst;
  const first = queue.run('same', async () => {
    order.push('first-start');
    await new Promise((resolve) => {
      releaseFirst = resolve;
    });
    order.push('first-end');
    return 1;
  });
  const second = queue.run('same', async () => {
    order.push('second-start');
    return 2;
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(order, ['first-start']);
  releaseFirst();
  assert.equal(await first, 1);
  assert.equal(await second, 2);
  assert.deepEqual(order, ['first-start', 'first-end', 'second-start']);
});

test('different keys are not serialized against each other', async () => {
  const queue = createKeyedOperationQueue(),
    order = [];
  let releaseA;
  const a = queue.run('a', async () => {
    order.push('a-start');
    await new Promise((resolve) => {
      releaseA = resolve;
    });
    order.push('a-end');
  });
  const b = queue.run('b', async () => {
    order.push('b-start');
  });
  await b;
  assert.deepEqual(order, ['a-start', 'b-start']);
  releaseA();
  await a;
});

test('a rejected operation does not block the next one on the same key', async () => {
  const queue = createKeyedOperationQueue();
  await assert.rejects(
    queue.run('k', async () => {
      throw new Error('boom');
    }),
    /boom/,
  );
  assert.equal(
    await queue.run('k', async () => 'after'),
    'after',
  );
});

test('the returned promise rejects with the operation error and the chain is released', async () => {
  const queue = createKeyedOperationQueue();
  await assert.rejects(queue.run('k', async () => Promise.reject(new Error('nope'))), /nope/);
  assert.equal(queue.pendingKeyCount, 0);
});

test('keys are trimmed and blank keys are rejected', async () => {
  const queue = createKeyedOperationQueue();
  assert.equal(
    await queue.run('  spaced  ', async () => 'ok'),
    'ok',
  );
  await assert.rejects(queue.run('   ', async () => 'never'), /operation key must be a non-empty string/);
  await assert.rejects(queue.run(null, async () => 'never'), /operation key must be a non-empty string/);
});

test('a non-function operation and a non-function normalizeKey are rejected', async () => {
  const queue = createKeyedOperationQueue();
  await assert.rejects(queue.run('k', 'not a function'), /operation must be a function/);
  assert.throws(() => createKeyedOperationQueue({ normalizeKey: 1 }), /normalizeKey must be a function/);
});

test('a custom normalizeKey collapses different keys onto one chain', async () => {
  const queue = createKeyedOperationQueue({ normalizeKey: (key) => String(key).toLowerCase() }),
    order = [];
  let releaseFirst;
  const first = queue.run('FILE.TXT', async () => {
    order.push('upper');
    await new Promise((resolve) => {
      releaseFirst = resolve;
    });
  });
  const second = queue.run('file.txt', async () => order.push('lower'));
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(order, ['upper']);
  releaseFirst();
  await first;
  await second;
  assert.deepEqual(order, ['upper', 'lower']);
});

test('pendingKeyCount tracks the number of distinct in-flight keys', async () => {
  const queue = createKeyedOperationQueue();
  let releaseA;
  let releaseB;
  const a = queue.run('a', () => new Promise((resolve) => {
    releaseA = resolve;
  }));
  const b = queue.run('b', () => new Promise((resolve) => {
    releaseB = resolve;
  }));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(queue.pendingKeyCount, 2);
  releaseA();
  releaseB();
  await Promise.all([a, b]);
  assert.equal(queue.pendingKeyCount, 0);
});

test('createCaseInsensitivePathKey lowercases only on Windows and macOS', () => {
  const key = createCaseInsensitivePathKey('C:\\Data\\Assets\\A.PNG');
  if (process.platform === 'win32' || process.platform === 'darwin')
    assert.equal(key, 'c:\\data\\assets\\a.png');
  else assert.equal(key, 'C:\\Data\\Assets\\A.PNG');
  assert.throws(() => createCaseInsensitivePathKey('  '), /operation key must be a non-empty string/);
});
