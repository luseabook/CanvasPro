import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LEGACY_STORAGE_MIGRATION_TIMEOUT_MS,
  createMigrationDeadline,
} from './legacyStorageMigrationDeadline.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('常量与返回值形状', () => {
  assert.equal(LEGACY_STORAGE_MIGRATION_TIMEOUT_MS, 20000);
  const deadline = createMigrationDeadline();
  assert.ok(deadline.signal instanceof AbortSignal);
  assert.equal(typeof deadline.dispose, 'function');
  assert.equal(typeof deadline.wait, 'function');
  assert.equal(deadline.signal.aborted, false);
  deadline.dispose();
});

test('dispose 清掉定时器 ⇒ 过期后信号仍未触发', async () => {
  const deadline = createMigrationDeadline(5);
  deadline.dispose();
  await sleep(40);
  assert.equal(deadline.signal.aborted, false);
});

test('超时时长被 Math.max(1, ms) 夹住：负数与 0 也会中止，reason 带专用 code', async () => {
  const deadline = createMigrationDeadline(-5);
  await sleep(40);
  assert.equal(deadline.signal.aborted, true);
  assert.equal(deadline.signal.reason.code, 'LEGACY_STORAGE_MIGRATION_TIMEOUT');
  assert.match(deadline.signal.reason.message, /timed out/);
});

test('wait：已中止时是「同步 throw」而不是 rejected Promise，且不会调用回调', async () => {
  const deadline = createMigrationDeadline(1);
  await sleep(30);
  assert.equal(deadline.signal.aborted, true, '先确认真的已中止');
  let calls = 0;
  assert.throws(
    () => {
      const lazy = deadline.wait(() => {
        calls += 1;
        return 'never';
      });
      return lazy;
    },
    (err) => err.code === 'LEGACY_STORAGE_MIGRATION_TIMEOUT',
  );
  assert.equal(calls, 0);
});

test('wait：未超时则异步执行回调并透传返回值（含异步回调）', async () => {
  const deadline = createMigrationDeadline(5000);
  let sync = true;
  const value = await deadline.wait(() => {
    sync = false;
    return 42;
  });
  assert.equal(value, 42);
  assert.equal(sync, false, '回调经 Promise.resolve().then 延后一拍');
  assert.equal(await deadline.wait(async () => 'async'), 'async');
  deadline.dispose();
});

test('wait：回调自身抛错（同步或异步）原样 reject', async () => {
  const deadline = createMigrationDeadline(5000);
  const boom = new Error('boom');
  await assert.rejects(
    () =>
      deadline.wait(() => {
        throw boom;
      }),
    (err) => err === boom,
  );
  await assert.rejects(
    () =>
      deadline.wait(async () => {
        throw boom;
      }),
    (err) => err === boom,
  );
  deadline.dispose();
});

test('wait：回调飞行中超时 ⇒ 以中止原因 reject，迟到的结果被丢弃', async () => {
  const deadline = createMigrationDeadline(10);
  await assert.rejects(
    () =>
      deadline.wait(async () => {
        await sleep(120);
        return 'late';
      }),
    (err) => err.code === 'LEGACY_STORAGE_MIGRATION_TIMEOUT',
  );
});

test('abort 监听器只挂一次并在 finally 摘除：同一 deadline 连续 wait 不互相串', async () => {
  const deadline = createMigrationDeadline(5000);
  assert.equal(await deadline.wait(() => 1), 1);
  assert.equal(await deadline.wait(() => 2), 2);
  deadline.dispose();
  await sleep(30);
  assert.equal(deadline.signal.aborted, false);
});
