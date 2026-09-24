import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRendererStartupState, rendererStartupState } from './rendererStartupState.js';

test('初始快照固定为 entry / 无失败 / 未 ready', () => {
  const state = createRendererStartupState();
  assert.deepEqual(state.snapshot(), { phase: 'entry', failure: '', ready: false });
});

test('模块级单例可用且形状一致', () => {
  assert.deepEqual(Object.keys(rendererStartupState).sort(), [
    'complete',
    'fail',
    'setPhase',
    'settled',
    'snapshot',
    'subscribe',
  ]);
  assert.deepEqual(rendererStartupState.snapshot(), { phase: 'entry', failure: '', ready: false });
});

test('subscribe 立刻回放当前快照，返回的取消函数可退订', () => {
  const state = createRendererStartupState();
  const seen = [];
  const off = state.subscribe((snap) => seen.push(snap));
  assert.equal(seen.length, 1);
  assert.deepEqual(seen[0], { phase: 'entry', failure: '', ready: false });
  state.setPhase('booting');
  assert.equal(seen.length, 2);
  assert.equal(off(), true, '取消函数返回 Set.delete 的布尔值');
  state.setPhase('mounting');
  assert.equal(seen.length, 2, '退订后不再收到通知');
});

test('complete 要 entry + project 两个标记齐全才转 ready', () => {
  const state = createRendererStartupState();
  state.complete('project');
  assert.deepEqual(state.snapshot(), { phase: 'entry', failure: '', ready: false });
  state.complete('entry');
  assert.equal(state.snapshot().ready, true);
  assert.equal(state.snapshot().phase, 'ready');
});

test('complete 忽略未知标记，setPhase 在 ready 前自由改写 phase', () => {
  const state = createRendererStartupState();
  state.complete('whatever');
  assert.equal(state.snapshot().ready, false);
  state.setPhase('restoring');
  assert.equal(state.snapshot().phase, 'restoring');
  state.complete('entry');
  state.complete('project');
  assert.equal(state.snapshot().phase, 'ready');
});

test('setPhase("ready") 也会直接结算 settled：判据只看快照 ready 而非来源', async () => {
  const state = createRendererStartupState();
  state.setPhase('ready');
  assert.deepEqual(await state.settled, { phase: 'ready', failure: '', ready: true });
});

test('fail 记录原因并结算 settled；重复 fail 返回 false', async () => {
  const state = createRendererStartupState();
  assert.equal(state.fail(), true, '缺省原因 initialization');
  assert.deepEqual(state.snapshot(), { phase: 'entry', failure: 'initialization', ready: false });
  const settled = await state.settled;
  assert.equal(settled.failure, 'initialization');
  assert.equal(settled.ready, false);
  assert.equal(state.fail('other'), false);
  state.setPhase('ready');
  state.complete('entry');
  state.complete('project');
  assert.deepEqual(
    state.snapshot(),
    { phase: 'entry', failure: 'initialization', ready: false },
    '失败后 setPhase/complete 全被短路',
  );
});

test('ready 之后一切变更被冻结（含 fail）', async () => {
  const state = createRendererStartupState();
  state.setPhase('loading');
  state.complete('entry');
  state.complete('project');
  const after = state.snapshot();
  assert.equal(state.fail('too late'), false);
  state.setPhase('gone');
  state.complete('other');
  assert.deepEqual(state.snapshot(), after);
  assert.deepEqual(await state.settled, after);
});

test('通知回调在每个终态前只跑一轮，监听器内读到的快照即最新值', () => {
  const state = createRendererStartupState();
  const views = [];
  state.subscribe(() => {});
  state.subscribe((snap) => views.push(snap.phase));
  state.setPhase('a');
  state.setPhase('b');
  assert.deepEqual(views, ['entry', 'a', 'b'], 'subscribe 的首次回放也算一次');
});
