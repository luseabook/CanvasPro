import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAgentReferenceContext } from './agentReferenceContext.js';

const CANVAS = { nodes: [{ id: 'n1' }, { nodeId: 'n2' }, { id: 'n3' }, {}] };

const LEDGER = [
  { id: 'op0', status: 'success', createdNodeIds: ['n9'], completedAt: 5 },
  {
    id: 'op1',
    status: 'success',
    runId: 'r1',
    commandId: 'c1',
    createdNodeIds: ['n1', 'n2'],
    completedAt: 10,
  },
  { id: 'op2', status: 'failed', createdNodeIds: ['n3'] },
  { id: 'op3', ok: false, status: 'success', createdNodeIds: ['n3'] },
  { id: 'op4', status: 'success', createdNodeIds: ['n2', 'n3'], startedAt: 20 },
];

test('引用上下文：无画布无台账时返回两组空数组', () => {
  assert.deepEqual(buildAgentReferenceContext({}), {
    recentCreatedNodeIds: [],
    recentCreationGroups: [],
  });
});

test('引用上下文：自后向前收集，节点 id 取 id 或 nodeId', () => {
  const result = buildAgentReferenceContext({ canvas: CANVAS, operationLedger: LEDGER });
  assert.deepEqual(result.recentCreatedNodeIds, ['n2', 'n3', 'n1']);
  assert.deepEqual(
    result.recentCreationGroups.map((group) => group.operationId),
    ['op4', 'op1'],
  );
});

test('引用上下文：跳过非 success 与 ok===false 的操作', () => {
  const result = buildAgentReferenceContext({ canvas: CANVAS, operationLedger: LEDGER });
  assert.equal(
    result.recentCreationGroups.some((group) => ['op2', 'op3'].includes(group.operationId)),
    false,
  );
});

test('引用上下文：丢弃不在画布上的节点，并按节点去重', () => {
  const result = buildAgentReferenceContext({ canvas: CANVAS, operationLedger: LEDGER });
  assert.equal(result.recentCreatedNodeIds.includes('n9'), false);
  assert.equal(result.recentCreatedNodeIds.filter((id) => id === 'n2').length, 1);
  assert.deepEqual(result.recentCreationGroups[1].nodeIds, ['n1']);
});

test('引用上下文：组记录带 runId/commandId，缺失时归一为空串', () => {
  const result = buildAgentReferenceContext({ canvas: CANVAS, operationLedger: LEDGER });
  assert.deepEqual(result.recentCreationGroups[0], {
    operationId: 'op4',
    runId: '',
    commandId: '',
    nodeIds: ['n2', 'n3'],
    completedAt: 20,
  });
  assert.deepEqual(result.recentCreationGroups[1], {
    operationId: 'op1',
    runId: 'r1',
    commandId: 'c1',
    nodeIds: ['n1'],
    completedAt: 10,
  });
});

test('引用上下文：completedAt 依次回退 completedAt / startedAt / 0', () => {
  const canvas = { nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] };
  const result = buildAgentReferenceContext({
    canvas,
    operationLedger: [
      { operationId: 'g1', status: 'success', createdNodeIds: ['a'], completedAt: 1 },
      { operationId: 'g2', status: 'success', createdNodeIds: ['b'], startedAt: 2 },
      { operationId: 'g3', status: 'success', createdNodeIds: ['c'] },
    ],
  });
  assert.deepEqual(
    result.recentCreationGroups.map((group) => [group.operationId, group.completedAt]),
    [
      ['g3', 0],
      ['g2', 2],
      ['g1', 1],
    ],
  );
});

test('引用上下文：operationId 可取自 id 或 operationId', () => {
  const canvas = { nodes: [{ id: 'a' }] };
  const keyed = buildAgentReferenceContext({
    canvas,
    operationLedger: [{ operationId: 'byOperationId', status: 'success', createdNodeIds: ['a'] }],
  });
  assert.equal(keyed.recentCreationGroups[0].operationId, 'byOperationId');
});

test('引用上下文：creationGroupLimit 命中即停止回溯', () => {
  const result = buildAgentReferenceContext({
    canvas: CANVAS,
    operationLedger: LEDGER,
    creationGroupLimit: 1,
  });
  assert.deepEqual(result.recentCreatedNodeIds, ['n2', 'n3']);
  assert.equal(result.recentCreationGroups.length, 1);
});

test('引用上下文：createdNodeLimit 命中即停止并截断单组', () => {
  const result = buildAgentReferenceContext({
    canvas: CANVAS,
    operationLedger: LEDGER,
    createdNodeLimit: 1,
  });
  assert.deepEqual(result.recentCreatedNodeIds, ['n2']);
  assert.deepEqual(result.recentCreationGroups[0].nodeIds, ['n2']);
  assert.equal(result.recentCreationGroups.length, 1);
});

test('引用上下文：缺省画布与非数组台账按空处理', () => {
  assert.deepEqual(buildAgentReferenceContext({ canvas: undefined, operationLedger: 'x' }), {
    recentCreatedNodeIds: [],
    recentCreationGroups: [],
  });
  assert.deepEqual(buildAgentReferenceContext(), {
    recentCreatedNodeIds: [],
    recentCreationGroups: [],
  });
});

test('引用上下文：非数组画布节点导致无 id 可匹配', () => {
  assert.deepEqual(
    buildAgentReferenceContext({ canvas: { nodes: 'x' }, operationLedger: LEDGER }).recentCreatedNodeIds,
    [],
  );
});

test('引用上下文：空 createdNodeIds 与假 id 被忽略', () => {
  const result = buildAgentReferenceContext({
    canvas: CANVAS,
    operationLedger: [
      { id: 'e1', status: 'success', createdNodeIds: [] },
      { id: 'e2', status: 'success', createdNodeIds: ['', null, '  '] },
      { id: 'e3', status: 'success', createdNodeIds: [' n1 '] },
    ],
  });
  assert.deepEqual(result.recentCreatedNodeIds, ['n1']);
  assert.equal(result.recentCreationGroups.length, 1);
  assert.equal(result.recentCreationGroups[0].operationId, 'e3');
});
