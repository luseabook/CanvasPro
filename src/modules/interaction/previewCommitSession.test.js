import test from 'node:test';
import assert from 'node:assert/strict';

import { createPreviewCommitSession } from './previewCommitSession.js';

function withManualFrames(run) {
  const frames = [];
  globalThis.requestAnimationFrame = (callback) => {
    frames.push(callback);
    return frames.length;
  };
  globalThis.cancelAnimationFrame = (id) => {
    if (id > 0) frames[id - 1] = null;
  };
  try {
    return run({
      frames,
      flush() {
        const pending = frames.slice();
        for (const callback of pending) if (callback) callback();
      },
    });
  } finally {
    delete globalThis.requestAnimationFrame;
    delete globalThis.cancelAnimationFrame;
  }
}

function makeSession(over = {}) {
  const applied = [];
  const session = createPreviewCommitSession({ applyPreview: (value) => applied.push(value) });
  return { session, applied, ...over };
}

test('未 begin 时 getPreview 为 null、isActive 为假、commit 为 null', () => {
  const { session, applied } = makeSession();
  assert.equal(session.getPreview(), null);
  assert.equal(session.isActive(), false);
  assert.equal(session.commit(), null);
  assert.deepEqual(applied, []);
});

test('begin 直接提供基准预览但不标记更新', () => {
  const { session, applied } = makeSession();
  session.begin({ x: 1, y: 2 });
  assert.equal(session.isActive(), true);
  assert.deepEqual(session.getPreview(), { x: 1, y: 2 });
  assert.equal(session.commit(), null);
  assert.deepEqual(applied, []);
});

test('begin 非布尔真值时仍视为激活', () => {
  const { session } = makeSession();
  session.begin(0);
  assert.equal(session.isActive(), true);
  assert.equal(session.getPreview(), 0);
  assert.equal(session.commit(), null);
});

test('无 rAF 环境 update 同步落地并立即回调 applyPreview', () => {
  const { session, applied } = makeSession();
  session.update({ x: 5, y: 6 });
  assert.equal(session.isActive(), true);
  assert.deepEqual(applied, [{ x: 5, y: 6 }]);
  assert.deepEqual(session.commit(), { x: 5, y: 6 });
  assert.equal(session.isActive(), false);
});

test('update 在未 begin 时自动补一次 begin', () => {
  const { session, applied } = makeSession();
  session.update({ x: 9, y: 9 });
  assert.equal(session.isActive(), true);
  assert.deepEqual(applied, [{ x: 9, y: 9 }]);
});

test('同一帧内多次 update 只登记最后一次并只排一帧', () => {
  withManualFrames(({ frames, flush }) => {
    const { session, applied } = makeSession();
    session.update({ x: 1, y: 1 });
    session.update({ x: 2, y: 2 });
    assert.equal(frames.length, 1);
    assert.deepEqual(applied, []);
    assert.deepEqual(session.getPreview(), { x: 2, y: 2 });
    flush();
    assert.deepEqual(applied, [{ x: 2, y: 2 }]);
  });
});

test('帧回调推进后重复执行是空操作', () => {
  withManualFrames(({ flush }) => {
    const { session, applied } = makeSession();
    session.update({ x: 3, y: 3 });
    flush();
    flush();
    assert.deepEqual(applied, [{ x: 3, y: 3 }]);
  });
});

test('commit 会先补发待处理帧再结算', () => {
  withManualFrames(({ flush }) => {
    const { session, applied } = makeSession();
    session.update({ x: 4, y: 4 });
    assert.deepEqual(applied, []);
    assert.deepEqual(session.commit(), { x: 4, y: 4 });
    assert.deepEqual(applied, [{ x: 4, y: 4 }]);
    assert.equal(session.isActive(), false);
    flush();
    assert.deepEqual(applied, [{ x: 4, y: 4 }]);
  });
});

test('cancel 撤销排帧，登记的值不再落地', () => {
  withManualFrames(({ frames, flush }) => {
    const { session, applied } = makeSession();
    session.update({ x: 7, y: 7 });
    session.cancel();
    assert.equal(session.isActive(), false);
    assert.equal(session.getPreview(), null);
    assert.equal(frames[0], null);
    flush();
    assert.deepEqual(applied, []);
    assert.equal(session.commit(), null);
  });
});

test('cancel 后重新 begin 但未 update 时 commit 为 null', () => {
  const { session, applied } = makeSession();
  session.begin({ x: 1, y: 1 });
  session.update({ x: 2, y: 2 });
  session.cancel();
  session.begin({ x: 8, y: 8 });
  assert.equal(session.commit(), null);
  assert.deepEqual(applied, [{ x: 2, y: 2 }]);
});

test('cancel 之后可重新 begin 并正常结算', () => {
  const { session, applied } = makeSession();
  session.update({ x: 1, y: 1 });
  session.cancel();
  session.begin({ x: 0, y: 0 });
  session.update({ x: 42, y: 43 });
  assert.deepEqual(applied, [
    { x: 1, y: 1 },
    { x: 42, y: 43 },
  ]);
  assert.deepEqual(session.commit(), { x: 42, y: 43 });
});

test('缺少 applyPreview 也可用', () => {
  const session = createPreviewCommitSession();
  session.update({ x: 1, y: 1 });
  assert.deepEqual(session.commit(), { x: 1, y: 1 });
});
