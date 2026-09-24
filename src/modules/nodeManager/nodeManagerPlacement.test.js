import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NODE_MANAGER_PLACEMENTS,
  DEFAULT_NODE_MANAGER_PLACEMENT,
  NODE_MANAGER_PLACEMENT_EVENT,
  normalizeNodeManagerPlacement,
} from './nodeManagerPlacement.js';

test('nodeManagerPlacement: 常量集合、默认值与事件名固定', () => {
  (assert.deepEqual([...NODE_MANAGER_PLACEMENTS], ['left', 'right', 'bottom']),
    assert.equal(DEFAULT_NODE_MANAGER_PLACEMENT, 'left'),
    assert.equal(NODE_MANAGER_PLACEMENT_EVENT, 'node-manager-placement-changed'),
    assert.equal(Object.isFrozen(NODE_MANAGER_PLACEMENTS), true));
});

test('nodeManagerPlacement: 合法取值原样返回', () => {
  (assert.equal(normalizeNodeManagerPlacement('left'), 'left'),
    assert.equal(normalizeNodeManagerPlacement('right'), 'right'),
    assert.equal(normalizeNodeManagerPlacement('bottom'), 'bottom'));
});

test('nodeManagerPlacement: 非法取值回退默认 left', () => {
  (assert.equal(normalizeNodeManagerPlacement('top'), 'left'),
    assert.equal(normalizeNodeManagerPlacement(''), 'left'),
    assert.equal(normalizeNodeManagerPlacement(undefined), 'left'),
    assert.equal(normalizeNodeManagerPlacement(null), 'left'),
    assert.equal(normalizeNodeManagerPlacement(0), 'left'),
    assert.equal(normalizeNodeManagerPlacement({}), 'left'));
});

test('nodeManagerPlacement: 大小写与空白不参与归一化（严格匹配）', () => {
  (assert.equal(normalizeNodeManagerPlacement('LEFT'), 'left'),
    assert.equal(normalizeNodeManagerPlacement(' left '), 'left'));
});

test('nodeManagerPlacement: 集合不可变（冻结）', () => {
  assert.throws(() => {
    NODE_MANAGER_PLACEMENTS[0] = 'top';
  });
});
