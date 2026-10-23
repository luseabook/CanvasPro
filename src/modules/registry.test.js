import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canCreateConnectedNode,
  getRegisteredConnectionDecision,
  isNodeType,
  registerNode,
} from './registry.js';
import { isValidConnection } from './interaction/EdgeController.js';

class FakeNode {}

test('registry: 没有类型注册策略时，连线裁决返回 undefined（交给通用规则）', () => {
  // undefined 与 false 必须区分开：前者是「没人管」，后者是「明确拒绝」。
  assert.equal(
    getRegisteredConnectionDecision({ id: 'a', type: 'ai-image' }, { id: 'b', type: 'ai-text' }),
    undefined
  );
});

test('registry: 注册的连线策略生效，两端都注册时取交集', () => {
  registerNode('policy-strict', FakeNode, { canConnect: () => false });
  registerNode('policy-loose', FakeNode, { canConnect: () => true });
  registerNode('policy-open', FakeNode, { canConnect: (_from, to) => to.type === 'ai-text' });
  try {
    // 一端明确拒绝 → 拒绝。
    assert.equal(
      getRegisteredConnectionDecision({ type: 'policy-strict' }, { type: 'ai-text' }),
      false
    );
    // 一端放行 → 放行。
    assert.equal(
      getRegisteredConnectionDecision({ type: 'policy-loose' }, { type: 'ai-text' }),
      true
    );
    // 两端都注册：都同意才通过，所以「放行 + 拒绝」是拒绝。
    assert.equal(
      getRegisteredConnectionDecision({ type: 'policy-loose' }, { type: 'policy-strict' }),
      false
    );
    assert.equal(
      getRegisteredConnectionDecision({ type: 'policy-open' }, { type: 'ai-text' }),
      true
    );
    // 策略拿到的是两端节点本身，能按对方类型判断。
    assert.equal(
      getRegisteredConnectionDecision({ type: 'policy-open' }, { type: 'ai-image' }),
      false
    );
  } finally {
    registerNode('policy-strict', FakeNode);
    registerNode('policy-loose', FakeNode);
    registerNode('policy-open', FakeNode);
  }
});

test('registry: 重新注册时未传 canConnect 会清掉旧策略', () => {
  registerNode('policy-reset', FakeNode, { canConnect: () => false });
  assert.equal(
    getRegisteredConnectionDecision({ type: 'policy-reset' }, { type: 'ai-text' }),
    false
  );
  registerNode('policy-reset', FakeNode);
  assert.equal(
    getRegisteredConnectionDecision({ type: 'policy-reset' }, { type: 'ai-text' }),
    undefined
  );
});

test('registry: canCreateConnected: false 挡住「连线即建节点」，且可被重新注册撤销', () => {
  const node = { id: 'n1', type: 'blocked-create' };
  assert.equal(canCreateConnectedNode(node), true);
  registerNode('blocked-create', FakeNode, { canCreateConnected: false });
  assert.equal(canCreateConnectedNode(node), false);
  // 其它类型不受影响。
  assert.equal(canCreateConnectedNode({ id: 'n2', type: 'ai-image' }), true);
  // 没有 type 的入参不炸，按放行处理。
  assert.equal(canCreateConnectedNode(undefined), true);
  registerNode('blocked-create', FakeNode);
  assert.equal(canCreateConnectedNode(node), true);
});

test('registry: isValidConnection 真的走注册策略（接线没断）', () => {
  // 这对类型在通用规则下是合法的；注册 deny 策略后必须变非法，证明 EdgeController 读到了策略。
  const source = { id: 's1', type: 'ai-image' };
  const target = { id: 't1', type: 'ai-text' };
  assert.equal(isValidConnection(source, target), true);
  registerNode('ai-image', FakeNode, { canConnect: () => false });
  try {
    assert.equal(isValidConnection(source, target), false);
  } finally {
    registerNode('ai-image', FakeNode);
  }
  assert.equal(isValidConnection(source, target), true);
});

test('registry: registerNode 的入参校验没被新参数破坏', () => {
  assert.throws(() => registerNode('', FakeNode), TypeError);
  assert.throws(() => registerNode('ok-type', null), TypeError);
  assert.equal(isNodeType({ type: 'ok-type' }, 'ok-type'), true);
});
