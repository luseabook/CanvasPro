import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeAgentOperation,
  normalizeAgentOperationLedger,
  normalizeAgentTaskBinding,
  normalizeAgentTaskBindings,
  normalizeAgentResumeCheckpoint,
} from './agentDurableRunState.js';

const NOW = 1_700_000_000_000;

function baseOperation(overrides = {}) {
  return { id: 'op1', runId: 'run1', commandId: 'node.create', ...overrides };
}

test('操作记录：缺 id / runId / commandId 任一即返回 null，operationId 可替代 id', () => {
  assert.equal(normalizeAgentOperation({ runId: 'r', commandId: 'c' }, NOW), null);
  assert.equal(normalizeAgentOperation({ id: '  ', runId: 'r', commandId: 'c' }, NOW), null);
  assert.equal(normalizeAgentOperation({ id: 'o', runId: 'r' }, NOW), null);
  assert.equal(
    normalizeAgentOperation({ operationId: 'viaAlias', runId: 'r', commandId: 'c' }, NOW).id,
    'viaAlias',
  );
  assert.equal(normalizeAgentOperation(null, NOW), null);
  assert.equal(normalizeAgentOperation(['x'], NOW), null);
});

test('操作记录：status 缺省 pending，ok 为三态（true / false / 其它一律 null）', () => {
  assert.equal(normalizeAgentOperation(baseOperation(), NOW).status, 'pending');
  assert.equal(normalizeAgentOperation(baseOperation({ status: '  running ' }), NOW).status, 'running');
  assert.equal(normalizeAgentOperation(baseOperation({ ok: true }), NOW).ok, true);
  assert.equal(normalizeAgentOperation(baseOperation({ ok: false }), NOW).ok, false);
  assert.equal(normalizeAgentOperation(baseOperation({ ok: 'true' }), NOW).ok, null);
  assert.equal(normalizeAgentOperation(baseOperation({ ok: null }), NOW).ok, null);
});

test('操作记录：step 取整且非负，repairAttempts 钳在 [0,1]，短字段各自截断', () => {
  const op = normalizeAgentOperation(
    baseOperation({
      step: -3.7,
      repairAttempts: 9,
      fingerprint: 'f'.repeat(200),
      errorCode: 'e'.repeat(200),
      verificationStatus: 'v'.repeat(60),
    }),
    NOW,
  );
  assert.equal(op.step, 0);
  assert.equal(normalizeAgentOperation(baseOperation({ step: 2.9 }), NOW).step, 2);
  assert.equal(op.repairAttempts, 1);
  assert.equal(normalizeAgentOperation(baseOperation({ repairAttempts: -5 }), NOW).repairAttempts, 0);
  assert.equal(op.fingerprint.length, 120);
  assert.equal(op.errorCode.length, 120);
  assert.equal(op.verificationStatus.length, 40);
});

test('操作记录：startedAt 非正或非有限时回落入参 now，completedAt 回落 startedAt 而非 now', () => {
  assert.equal(normalizeAgentOperation(baseOperation({ startedAt: 0 }), NOW).startedAt, NOW);
  assert.equal(normalizeAgentOperation(baseOperation({ startedAt: 'abc' }), NOW).startedAt, NOW);
  assert.equal(normalizeAgentOperation(baseOperation({ startedAt: -9 }), NOW).startedAt, NOW);
  assert.equal(normalizeAgentOperation(baseOperation({ startedAt: 111 }), NOW).startedAt, 111);
  assert.equal(normalizeAgentOperation(baseOperation({ startedAt: 111 }), NOW).completedAt, 0);
  assert.equal(
    normalizeAgentOperation(baseOperation({ startedAt: 111, completedAt: 'x' }), NOW).completedAt,
    111,
  );
  assert.equal(
    normalizeAgentOperation(baseOperation({ startedAt: 111, completedAt: 222 }), NOW).completedAt,
    222,
  );
});

test('操作记录：创建节点/边列表去空去重并截 24 项', () => {
  const op = normalizeAgentOperation(
    baseOperation({
      createdNodeIds: [
        'a',
        ' a ',
        '',
        '  b',
        'c',
        'd',
        'e',
        'f',
        'g',
        'h',
        'i',
        'j',
        'k',
        'l',
        'm',
        'n',
        'o',
        'p',
        'q',
        'r',
        's',
        't',
        'u',
        'v',
        'w',
      ],
      createdEdgeIds: 'not-an-array',
    }),
    NOW,
  );
  assert.deepEqual(op.createdNodeIds, [
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
  ]);
  assert.equal(op.createdNodeIds.length, 23);
  assert.deepEqual(op.createdEdgeIds, []);
});

test('台账：过滤无效项并只保留最后 120 条', () => {
  const many = Array.from({ length: 130 }, (_, index) =>
    baseOperation({ id: `op${index}`, startedAt: index + 1 }),
  );
  const ledger = normalizeAgentOperationLedger(many, NOW);
  assert.equal(ledger.length, 120);
  assert.equal(ledger[0].id, 'op10');
  assert.equal(ledger.at(-1).id, 'op129');
  assert.deepEqual(normalizeAgentOperationLedger('nope', NOW), []);
  assert.deepEqual(
    normalizeAgentOperationLedger([baseOperation(), { runId: 'r' }, null], NOW).map((item) => item.id),
    ['op1'],
  );
});

test('任务绑定：须同时具备 id 与 nodeId / targetNodeId，targetNodeId 回落 nodeId', () => {
  assert.equal(normalizeAgentTaskBinding({ id: 'b1' }), null);
  assert.equal(normalizeAgentTaskBinding({ nodeId: 'n1' }), null);
  assert.equal(normalizeAgentTaskBinding(['x']), null);
  const binding = normalizeAgentTaskBinding({ id: 'b1', targetNodeId: '  n9 ', status: 'running' });
  assert.equal(binding.nodeId, 'n9');
  assert.equal(binding.targetNodeId, 'n9');
  assert.equal(binding.commandId, 'generation.run');
  assert.equal(binding.taskId, '');
  assert.equal(binding.notifiedTerminal, false);
  assert.ok(Number.isFinite(binding.createdAt) && binding.createdAt > 0);
});

test('任务绑定列表：丢弃无效项并截最后 24 条，notifiedTerminal 严格 true', () => {
  const items = Array.from({ length: 30 }, (_, index) => ({
    id: `b${index}`,
    nodeId: `n${index}`,
    notifiedTerminal: index === 29 ? true : 'yes',
  }));
  const list = normalizeAgentTaskBindings([...items, null, { id: 'bad' }]);
  assert.equal(list.length, 24);
  assert.equal(list[0].id, 'b6');
  assert.equal(list.at(-1).id, 'b29');
  assert.equal(list.at(-1).notifiedTerminal, true);
  assert.equal(list[0].notifiedTerminal, false);
  assert.deepEqual(normalizeAgentTaskBindings(undefined), []);
});

test('检查点：originalMessage / conversationId / projectId 缺任一即 null', () => {
  const base = { originalMessage: 'm', conversationId: 'c1', projectId: 'p1' };
  assert.equal(normalizeAgentResumeCheckpoint({ conversationId: 'c', projectId: 'p' }), null);
  assert.equal(
    normalizeAgentResumeCheckpoint({ originalMessage: '  ', conversationId: 'c', projectId: 'p' }),
    null,
  );
  assert.equal(normalizeAgentResumeCheckpoint({ originalMessage: 'm', projectId: 'p' }), null);
  assert.equal(normalizeAgentResumeCheckpoint({ originalMessage: 'm', conversationId: 'c' }), null);
  assert.equal(normalizeAgentResumeCheckpoint([]), null);
  const ok = normalizeAgentResumeCheckpoint(base);
  assert.equal(ok.originalMessage, 'm');
  assert.equal(ok.runId, '');
  assert.equal(ok.step, 0);
});

test('检查点：pendingKind 缺省 interrupted，confirmation 归一为 interrupted', () => {
  const base = { originalMessage: 'm', conversationId: 'c', projectId: 'p' };
  assert.equal(normalizeAgentResumeCheckpoint(base).pendingKind, 'interrupted');
  assert.equal(
    normalizeAgentResumeCheckpoint({ ...base, pendingKind: 'confirmation' }).pendingKind,
    'interrupted',
  );
  assert.equal(
    normalizeAgentResumeCheckpoint({ ...base, pendingKind: 'waiting_tasks' }).pendingKind,
    'waiting_tasks',
  );
});

test('检查点：precreatedNode 仅在 nodeId 与 type 齐备时才出键', () => {
  const base = { originalMessage: 'm', conversationId: 'c', projectId: 'p' };
  assert.equal('precreatedNode' in normalizeAgentResumeCheckpoint(base), false);
  assert.equal(
    'precreatedNode' in normalizeAgentResumeCheckpoint({ ...base, precreatedNode: { nodeId: 'n1' } }),
    false,
  );
  assert.equal('precreatedNode' in normalizeAgentResumeCheckpoint({ ...base, precreatedNode: ['x'] }), false);
  assert.deepEqual(
    normalizeAgentResumeCheckpoint({ ...base, precreatedNode: { nodeId: ' n1 ', type: ' ai-image ' } })
      .precreatedNode,
    { nodeId: 'n1', type: 'ai-image' },
  );
});

test('检查点：工具结果需 commandId，message 截 480、errorCode 截 120、列表截 24', () => {
  const results = Array.from({ length: 30 }, (_, index) => ({
    commandId: `c${index}`,
    step: 1.9,
    ok: index === 29,
    status: ' done ',
    errorCode: 'e'.repeat(200),
    message: 'x'.repeat(600),
  }));
  const checkpoint = normalizeAgentResumeCheckpoint({
    originalMessage: 'm',
    conversationId: 'c',
    projectId: 'p',
    toolResults: [...results, { step: 1 }, ['nested'], null],
  });
  assert.equal(checkpoint.toolResults.length, 24);
  assert.equal(checkpoint.toolResults[0].commandId, 'c6');
  assert.equal(checkpoint.toolResults[0].step, 1);
  assert.equal(checkpoint.toolResults[0].ok, false);
  assert.equal(checkpoint.toolResults[0].status, 'done');
  assert.equal(checkpoint.toolResults[0].errorCode.length, 120);
  assert.equal(checkpoint.toolResults[0].message.length, 480);
  assert.equal(checkpoint.toolResults.at(-1).ok, true);
  assert.deepEqual(
    normalizeAgentResumeCheckpoint({ originalMessage: 'm', conversationId: 'c', projectId: 'p' }).toolResults,
    [],
  );
});

test('检查点：failedFingerprints 丢弃空键与非正计数，键截 120 且最多 24 项', () => {
  const failedFingerprints = {};
  for (let index = 0; index < 30; index += 1) failedFingerprints[`f${index}`] = index === 0 ? 0 : 1;
  failedFingerprints[''] = 3;
  const checkpoint = normalizeAgentResumeCheckpoint({
    originalMessage: 'm',
    conversationId: 'c',
    projectId: 'p',
    failedFingerprints,
  });
  assert.equal(checkpoint.failedFingerprints.f0, undefined);
  assert.equal(Object.hasOwn(checkpoint.failedFingerprints, ''), false);
  assert.equal(Object.keys(checkpoint.failedFingerprints).length, 24);
  assert.equal(checkpoint.failedFingerprints.f1, 1);
  assert.equal(checkpoint.failedFingerprints.f24, 1);
  assert.equal(checkpoint.failedFingerprints.f25, undefined);
  const slicedKeys = normalizeAgentResumeCheckpoint({
    originalMessage: 'm',
    conversationId: 'c',
    projectId: 'p',
    failedFingerprints: { ['p'.repeat(200)]: 2, neg: -3, nan: 'abc', str: '4' },
  });
  assert.deepEqual(slicedKeys.failedFingerprints, { ['p'.repeat(120)]: 2, str: 4 });
});

test('检查点：溯源与 plannerExtra 恒在，inputRefs 取 nodeId 或 id 并截 12 项', () => {
  const checkpoint = normalizeAgentResumeCheckpoint({
    originalMessage: 'm',
    conversationId: 'c',
    projectId: 'p',
    runtimeProvenance: { createdNodeIds: ['n1', '', 'n1'], createdEdgeIds: 'no' },
    plannerExtra: {
      targetKind: ' ai-video ',
      inputRefs: [
        ...Array.from({ length: 15 }, (_, index) => ({ nodeId: `n${index}` })),
        { id: 'byId', name: '  名称  ', type: 'ai-text', kind: 'reference', source: 'canvas' },
        { nope: 1 },
        null,
      ],
    },
  });
  assert.deepEqual(checkpoint.runtimeProvenance, { createdNodeIds: ['n1'], createdEdgeIds: [] });
  assert.equal(checkpoint.plannerExtra.targetKind, 'ai-video');
  assert.equal(checkpoint.plannerExtra.inputRefs.length, 12);
  assert.equal(checkpoint.plannerExtra.inputRefs[0].nodeId, 'n0');
  assert.deepEqual(
    normalizeAgentResumeCheckpoint({ originalMessage: 'm', conversationId: 'c', projectId: 'p' })
      .plannerExtra,
    {
      targetKind: '',
      inputRefs: [],
    },
  );
  const single = normalizeAgentResumeCheckpoint({
    originalMessage: 'm',
    conversationId: 'c',
    projectId: 'p',
    plannerExtra: { inputRefs: [{ id: 'byId', name: 'x'.repeat(200), label: 'fallback' }] },
  });
  assert.deepEqual(single.plannerExtra.inputRefs, [
    { nodeId: 'byId', type: '', kind: '', name: `${'x'.repeat(117)}...`, source: '' },
  ]);
});

test('检查点：动作预算、重试计数取整非负，长文本按预算截断并以省略号收尾', () => {
  const checkpoint = normalizeAgentResumeCheckpoint({
    originalMessage: 'y'.repeat(4500),
    conversationId: 'c',
    projectId: 'p',
    step: 3.9,
    actionBudget: { duplicateNodeLimit: -2, duplicatedNodeCount: 4.4 },
    noActionRetryCount: 2.9,
    clarificationAnswer: 'a'.repeat(1300),
    recoveryInstruction: 'r'.repeat(1300),
    completedFingerprints: ['a', 'a', ' b '],
    disclosedCommandIds: ['node.create'],
    disclosedModelIds: ['gpt'],
  });
  assert.equal(checkpoint.originalMessage.length, 4000);
  assert.equal(checkpoint.originalMessage.endsWith('...'), true);
  assert.equal(checkpoint.step, 3);
  assert.deepEqual(checkpoint.actionBudget, { duplicateNodeLimit: 0, duplicatedNodeCount: 4 });
  assert.equal(checkpoint.noActionRetryCount, 2);
  assert.equal(checkpoint.clarificationAnswer.length, 1200);
  assert.equal(checkpoint.recoveryInstruction.length, 1200);
  assert.deepEqual(checkpoint.completedFingerprints, ['a', 'b']);
  assert.deepEqual(checkpoint.disclosedCommandIds, ['node.create']);
  assert.deepEqual(checkpoint.disclosedModelIds, ['gpt']);
});
