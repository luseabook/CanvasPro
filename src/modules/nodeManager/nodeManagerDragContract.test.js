import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NODE_MANAGER_DRAG_MIME, hasNodeManagerDragType } from './nodeManagerDragContract.js';

test('nodeManagerDragContract: MIME 常量与节点管理器拖拽契约一致', () => {
  assert.equal(NODE_MANAGER_DRAG_MIME, 'application/x-aicanvas-node-id');
});

test('nodeManagerDragContract: types 含目标 MIME 时判定为节点管理器拖拽', () => {
  assert.equal(hasNodeManagerDragType({ types: [NODE_MANAGER_DRAG_MIME] }), true);
  assert.equal(hasNodeManagerDragType({ types: ['text/plain', NODE_MANAGER_DRAG_MIME] }), true);
});

test('nodeManagerDragContract: types 不含目标 MIME 时判定为否', () => {
  assert.equal(hasNodeManagerDragType({ types: ['text/plain'] }), false);
  assert.equal(hasNodeManagerDragType({ types: [] }), false);
});

test('nodeManagerDragContract: types 缺失或为空值时安全返回 false', () => {
  assert.equal(hasNodeManagerDragType(), false);
  assert.equal(hasNodeManagerDragType({}), false);
  assert.equal(hasNodeManagerDragType({ types: undefined }), false);
  assert.equal(hasNodeManagerDragType({ types: null }), false);
});

test('nodeManagerDragContract: 大小写不同不视为命中（MIME 精确匹配）', () => {
  assert.equal(hasNodeManagerDragType({ types: [NODE_MANAGER_DRAG_MIME.toUpperCase()] }), false);
});

test('nodeManagerDragContract: 接受任意可迭代 types 集合', () => {
  assert.equal(hasNodeManagerDragType({ types: new Set([NODE_MANAGER_DRAG_MIME]) }), true);
  assert.equal(hasNodeManagerDragType({ types: new Set(['text/plain']) }), false);
});
