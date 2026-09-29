import test from 'node:test';
import assert from 'node:assert/strict';

import { createTaskStatusFeedback } from './taskStatusFeedback.js';

function createHarness({ waitMs = 600000, mergeMs = 600, now = 1000 } = {}) {
  const timers = [];
  const notifications = [];
  let clock = now;
  const harness = {
    timers,
    notifications,
    setTimer: (callback, ms) => {
      const timer = { callback, ms, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimer: (timer) => {
      if (timer) timer.cleared = true;
    },
    now: () => clock,
    notify: (payload) => notifications.push(payload),
    fire(timer) {
      timers.splice(timers.indexOf(timer), 1);
      timer.callback();
    },
    advance(ms) {
      clock += ms;
    },
  };
  return harness;
}

const ACTIVE = { status: 'waiting' };
const DONE = { status: 'complete' };

test('taskStatusFeedback: 活动任务超时未确认会提示等待较久', () => {
  const harness = createHarness();
  const feedback = createTaskStatusFeedback(harness);
  feedback.observe({ taskId: 't1', status: 'waiting', title: ' 图像 生成 ' }, null);

  assert.equal(harness.timers.length, 1);
  harness.fire(harness.timers[0]);
  assert.deepEqual(harness.notifications, [
    {
      type: 'warn',
      navigation: null,
      body: '图像 生成等待较久，尚未确认完成。点击查看进度，请勿重复提交。',
    },
  ]);
  feedback.destroy();
});

test('taskStatusFeedback: 任务结束时清掉等待提示', () => {
  const harness = createHarness();
  const feedback = createTaskStatusFeedback(harness);
  feedback.observe({ taskId: 't1', status: 'processing', title: 'A' }, null);
  feedback.observe({ taskId: 't1', status: 'complete', title: 'A' }, { status: 'processing' });

  const wait = harness.timers.find((t) => t.ms === 600000);
  assert.equal(wait.cleared, true, '结束即取消等待提示');
  feedback.destroy();
});

test('taskStatusFeedback: 失败任务按会话分组并给出失败原因', () => {
  const harness = createHarness();
  const feedback = createTaskStatusFeedback(harness);
  feedback.observe(
    { taskId: 't1', status: 'failed', title: '视频\n生成', error: '  额度  不足  ', startedAt: 2000, source: 's', projectId: 'p', canvasId: 'c' },
    null,
  );
  assert.equal(harness.timers.length, 1);
  harness.fire(harness.timers[0]);

  assert.deepEqual(harness.notifications, [
    {
      type: 'error',
      navigation: null,
      body: '视频 生成失败：额度 不足',
    },
  ]);
  feedback.destroy();
});

test('taskStatusFeedback: 多项结束合并成一条，先报失败首个的详情', () => {
  const harness = createHarness();
  const feedback = createTaskStatusFeedback(harness);
  const common = { source: 's', projectId: 'p', canvasId: 'c' };
  feedback.observe({ taskId: 'a', status: 'complete', title: 'A', ...common }, ACTIVE);
  feedback.observe({ taskId: 'b', status: 'failed', title: 'B', error: '超时', ...common }, ACTIVE);
  feedback.observe({ taskId: 'c', status: 'failed', title: 'C', error: '取消', ...common }, ACTIVE);

  const mergeTimer = harness.timers.find((t) => t.ms === 600);
  harness.fire(mergeTimer);
  assert.deepEqual(harness.notifications, [
    {
      type: 'error',
      navigation: null,
      body: '多项任务已结束：成功 1 个，失败 2 个。B：超时',
    },
  ]);
  feedback.destroy();
});

test('taskStatusFeedback: 全部成功时不发失败通知', () => {
  const harness = createHarness();
  const feedback = createTaskStatusFeedback(harness);
  feedback.observe({ taskId: 'a', status: 'complete', title: 'A', source: 's', projectId: 'p', canvasId: 'c' }, ACTIVE);
  harness.fire(harness.timers.find((t) => t.ms === 600));
  assert.equal(harness.notifications.length, 0);
  feedback.destroy();
});

test('taskStatusFeedback: 静默与旧任务不通知', () => {
  const harness = createHarness();
  const feedback = createTaskStatusFeedback(harness);
  feedback.observe({ taskId: 'a', status: 'failed', title: 'A', error: 'e', startedAt: 2000 }, null, { silent: true });
  feedback.observe({ taskId: 'b', status: 'failed', title: 'B', error: 'e', startedAt: 500 }, null);
  feedback.observe({ taskId: 'c', status: 'complete', title: 'C' }, null);
  assert.equal(harness.timers.length, 0, '没有安排任何合并通知');
  feedback.destroy();
});

test('taskStatusFeedback: destroy 后全面停摆', () => {
  const harness = createHarness();
  const feedback = createTaskStatusFeedback(harness);
  feedback.observe({ taskId: 't1', status: 'waiting', title: 'A' }, null);
  const wait = harness.timers[0];
  feedback.destroy();
  assert.equal(wait.cleared, true);
  const countAfterDestroy = harness.timers.length;
  feedback.observe({ taskId: 't2', status: 'failed', title: 'B', error: 'x', startedAt: 5000 }, null);
  assert.equal(harness.timers.length, countAfterDestroy, '销毁后不再安排任何计时器');
  assert.equal(harness.notifications.length, 0);
});
