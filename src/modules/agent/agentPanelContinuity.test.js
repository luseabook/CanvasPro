import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentPanelContinuity } from './agentPanelContinuity.js';

function harness(conversation = { projectId: 'p1', id: 'c1' }, history = ['h1'], count = history.length) {
  const state = { conversation, history, count };
  const panel = createAgentPanelContinuity({
    getConversation: () => state.conversation,
    getHistory: () => state.history,
    getMessageCount: () => state.count,
  });
  return { panel, state };
}

test('capture 产出 [projectId, conversationId] 身份与 epoch 0', () => {
  const { panel } = harness();
  assert.deepEqual(panel.capture(), { identity: '["p1","c1"]', epoch: 0 });
});

test('getConversation 返回空值时身份为两个空串', () => {
  assert.equal(harness(null).panel.capture().identity, '["",""]');
  assert.equal(harness({}).panel.capture().identity, '["",""]');
  assert.equal(harness({ projectId: 'p9' }).panel.capture().identity, '["p9",""]');
});

test('isCurrent 只在身份与 epoch 同时匹配时为真', () => {
  const { panel, state } = harness();
  const token = panel.capture();
  assert.equal(panel.isCurrent(token), true);
  state.conversation = { projectId: 'p2', id: 'c1' };
  assert.equal(panel.isCurrent(token), false);
});

test('isCurrent 对伪造 token 与非对象入参皆为假', () => {
  const { panel } = harness();
  assert.equal(panel.isCurrent({ identity: '["p1","c1"]', epoch: 1 }), false);
  assert.equal(panel.isCurrent(null), false);
  assert.equal(panel.isCurrent(), false);
});

test('invalidate 递增 epoch 并清掉已记住的关闭快照', () => {
  const { panel, state } = harness();
  const token = panel.capture();
  panel.rememberClosed();
  assert.equal(panel.canResume(), true);
  state.count = 9;
  panel.invalidate();
  assert.equal(panel.capture().epoch, 1);
  assert.equal(panel.isCurrent(token), false);
  assert.equal(panel.canResume(), false);
});

test('rememberClosed 后 isSameConversation 只看身份、canResume 还看历史与条数', () => {
  const { panel, state } = harness();
  panel.rememberClosed();
  assert.equal(panel.isSameConversation(), true);
  state.history = ['h1', 'h2'];
  assert.equal(panel.isSameConversation(), true);
  assert.equal(panel.canResume(), false);
});

test('条数变化亦使 canResume 为假（历史内容未变）', () => {
  const { panel, state } = harness();
  panel.rememberClosed();
  state.count = 7;
  assert.equal(panel.canResume(), false);
});

test('未 rememberClosed 时 canResume / isSameConversation 为假', () => {
  const { panel } = harness();
  assert.equal(panel.isSameConversation(), false);
  assert.equal(panel.canResume(), false);
});

test('destroy 后所有判定失效且不再恢复', () => {
  const { panel, state } = harness();
  const token = panel.capture();
  panel.rememberClosed();
  panel.destroy();
  assert.equal(token.epoch, 0);
  assert.equal(panel.capture().epoch, 1);
  assert.equal(panel.isCurrent(token), false);
  assert.equal(panel.canResume(), false);
  assert.equal(panel.isSameConversation(), false);
  state.count = 1;
  assert.equal(panel.canResume(), false);
});

test('destroy 之后再 rememberClosed 仍因 destroyed 而不可恢复', () => {
  const { panel } = harness();
  panel.destroy();
  panel.rememberClosed();
  assert.equal(panel.isSameConversation(), true);
  assert.equal(panel.canResume(), false);
});
