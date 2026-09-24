import test from 'node:test';
import assert from 'node:assert/strict';
import { selectAgentLoopPlanAction } from './agentLoopPlanSelection.js';

function okValidator(plan) {
  return { ok: true, plan };
}

function makeFingerprint() {
  return (action) => action.id;
}

test('无候选动作时返回原始 plan 与其校验结果', () => {
  const raw = { status: 'planning' };
  const seen = [];
  const out = selectAgentLoopPlanAction({
    rawPlan: raw,
    actions: [],
    validate: (plan) => {
      seen.push(plan);
      return { ok: false, plan, error: 'E' };
    },
    fingerprint: makeFingerprint(),
  });
  assert.equal(out.plan, raw);
  assert.deepEqual(seen, [raw]);
  assert.equal(out.validation.error, 'E');
});

test('actions 非数组按空集处理', () => {
  const raw = { status: 'planning' };
  const out = selectAgentLoopPlanAction({ rawPlan: raw, actions: null, validate: okValidator });
  assert.equal(out.plan, raw);
  assert.equal(out.validation.ok, true);
});

test('单候选：包装成 actions 长度为 1 的 plan 后直接返回', () => {
  const a0 = { id: 'a0' };
  const out = selectAgentLoopPlanAction({
    rawPlan: { status: 'executing', step: 3 },
    actions: [a0],
    validate: okValidator,
    fingerprint: makeFingerprint(),
  });
  assert.deepEqual(out.plan, { status: 'executing', step: 3, actions: [a0] });
  assert.equal(out.validation.plan, out.plan);
});

test('多候选且首个未完成：只取首个并保留校验返回的 plan', () => {
  const calls = [];
  const out = selectAgentLoopPlanAction({
    rawPlan: {},
    actions: [{ id: 'a0' }, { id: 'a1' }],
    validate: (plan) => {
      calls.push(plan.actions[0].id);
      return okValidator(plan);
    },
    fingerprint: makeFingerprint(),
    completedFingerprints: ['a9'],
  });
  assert.deepEqual(calls, ['a0']);
  assert.deepEqual(out.plan.actions, [{ id: 'a0' }]);
});

test('首个已完成时前移并回调 onCompletedPrefix，直到命中未完成者', () => {
  const seen = [];
  const completed = [];
  const out = selectAgentLoopPlanAction({
    rawPlan: {},
    actions: [{ id: 'a0' }, { id: 'a1' }, { id: 'a2' }],
    validate: okValidator,
    fingerprint: makeFingerprint(),
    completedFingerprints: ['a0', 'a1'],
    onCompletedPrefix: (action, index) => completed.push([action.id, index]),
  });
  assert.deepEqual(completed, [
    ['a0', 0],
    ['a1', 1],
  ]);
  assert.deepEqual(out.plan.actions, [{ id: 'a2' }]);
  assert.deepEqual(seen, []);
});

test('校验失败时立刻返回该候选的 plan 与失败结果', () => {
  const out = selectAgentLoopPlanAction({
    rawPlan: {},
    actions: [{ id: 'a0' }, { id: 'a1' }],
    validate: (plan) => (plan.actions[0].id === 'a1' ? { ok: false, plan, error: 'BAD' } : okValidator(plan)),
    fingerprint: makeFingerprint(),
    completedFingerprints: ['a0'],
  });
  assert.deepEqual(out.plan.actions, [{ id: 'a1' }]);
  assert.equal(out.validation.ok, false);
  assert.equal(out.validation.error, 'BAD');
});

test('全部已完成：循环跑完返回**初始**首个候选（游标只在命中时前移）', () => {
  const out = selectAgentLoopPlanAction({
    rawPlan: {},
    actions: [{ id: 'a0' }, { id: 'a1' }],
    validate: okValidator,
    fingerprint: makeFingerprint(),
    completedFingerprints: ['a0', 'a1'],
  });
  assert.deepEqual(out.plan.actions, [{ id: 'a0' }]);
});

test('fingerprint 取的是校验返回 plan 内的动作（可被校验器归一化）', () => {
  const out = selectAgentLoopPlanAction({
    rawPlan: {},
    actions: [{ id: 'a0' }, { id: 'a1' }],
    validate: (plan) => okValidator({ ...plan, actions: [{ ...plan.actions[0], id: 'normalized' }] }),
    fingerprint: (action) => action.id,
    completedFingerprints: ['normalized'],
    onCompletedPrefix: () => {},
  });
  assert.deepEqual(out.plan.actions, [{ id: 'a0' }]);
});

test('onCompletedPrefix 缺省时不抛', () => {
  const out = selectAgentLoopPlanAction({
    rawPlan: {},
    actions: [{ id: 'a0' }, { id: 'a1' }],
    validate: okValidator,
    fingerprint: makeFingerprint(),
    completedFingerprints: [],
  });
  assert.deepEqual(out.plan.actions, [{ id: 'a0' }]);
});
