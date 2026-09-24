import assert from 'node:assert/strict';
import test from 'node:test';

import { agentRunStepInternals, buildAgentRunSteps } from './agentRunSteps.js';

const EVENTS = [
  { runId: 'r1', type: 'approval.requested', step: 1, ts: 1 },
  { runId: 'r1', type: 'approval.confirmed', step: 1, ts: 2 },
  { runId: 'r1', type: 'tool.completed', step: 2, commandId: 'node.create', ok: true, ts: 3 },
  { runId: 'r1', type: 'tool.completed', step: 3, commandId: 'unknown.cmd', ok: false, ts: 4 },
  { runId: 'r1', type: 'task.waiting', step: 4, ts: 5 },
  { runId: 'r1', type: 'task.resumed', step: 4, status: 'failed', ts: 6 },
];

test('执行步骤：无法确定 runId 时返回空数组', () => {
  assert.deepEqual(buildAgentRunSteps({}), []);
  assert.deepEqual(buildAgentRunSteps({ runEvents: [{ type: 'tool.completed', ts: 1 }] }), []);
});

test('执行步骤：无 currentRun 时从末条事件回推 runId', () => {
  const steps = buildAgentRunSteps({ runEvents: EVENTS });
  assert.ok(steps.every((step) => step.key.startsWith('r1:')));
});

test('执行步骤：审批请求与确认合并为同一条', () => {
  const steps = buildAgentRunSteps({ runEvents: EVENTS });
  assert.deepEqual(steps[0], {
    key: 'r1:approval:1',
    label: '已确认执行',
    status: 'success',
    step: 1,
    ts: 2,
  });
  assert.equal(
    steps.some((step) => step.label === '等待确认'),
    false,
  );
});

test('执行步骤：未确认的审批停在 waiting', () => {
  const steps = buildAgentRunSteps({
    runEvents: [{ runId: 'r', type: 'approval.requested', step: 2, ts: 9 }],
  });
  assert.deepEqual(steps, [{ key: 'r:approval:2', label: '等待确认', status: 'waiting', step: 2, ts: 9 }]);
});

test('执行步骤：审批取消改写为 cancelled', () => {
  const steps = buildAgentRunSteps({
    runEvents: [
      { runId: 'r', type: 'approval.requested', ts: 1 },
      { runId: 'r', type: 'approval.cancelled', ts: 2 },
    ],
  });
  assert.equal(steps.length, 1);
  assert.deepEqual(
    { label: steps[0].label, status: steps[0].status },
    {
      label: '已取消执行',
      status: 'cancelled',
    },
  );
});

test('执行步骤：孤立 approval.cancelled / task.resumed 不产生步骤', () => {
  assert.deepEqual(
    buildAgentRunSteps({ runEvents: [{ runId: 'r', type: 'approval.cancelled', ts: 1 }] }),
    [],
  );
  assert.deepEqual(buildAgentRunSteps({ runEvents: [{ runId: 'r', type: 'task.resumed', ts: 1 }] }), []);
});

test('执行步骤：工具完成按 commandId 建步并本地化标签', () => {
  const steps = buildAgentRunSteps({ runEvents: EVENTS });
  assert.deepEqual(steps[1], {
    key: 'r1:tool:2:node.create',
    label: '创建节点',
    status: 'success',
    commandId: 'node.create',
    step: 2,
    ts: 3,
  });
  assert.equal(steps[2].label, 'unknown.cmd');
  assert.equal(steps[2].status, 'failed');
});

test('执行步骤：仅严格 ok===false 算失败，缺省与 null 均视为成功', () => {
  const steps = buildAgentRunSteps({
    runEvents: [
      { runId: 'r', type: 'tool.completed', step: 1, commandId: 'graph.connect', ts: 1 },
      { runId: 'r', type: 'tool.completed', step: 2, commandId: 'layout.align', ok: null, ts: 2 },
      { runId: 'r', type: 'tool.completed', step: 3, commandId: 'node.setPrompt', ok: false, ts: 3 },
    ],
  });
  assert.deepEqual(
    steps.map((step) => step.status),
    ['success', 'success', 'failed'],
  );
});

test('执行步骤：等待任务与恢复合并为同一条', () => {
  const steps = buildAgentRunSteps({ runEvents: EVENTS });
  assert.deepEqual(steps[3], {
    key: 'r1:task-wait:4',
    label: '生成任务失败',
    status: 'failed',
    step: 4,
    ts: 6,
  });
});

test('执行步骤：任务恢复成功时给出已完成标签', () => {
  const steps = buildAgentRunSteps({
    runEvents: [
      { runId: 'r', type: 'task.waiting', step: 1, ts: 1 },
      { runId: 'r', type: 'task.resumed', step: 1, status: 'success', ts: 2 },
    ],
  });
  assert.deepEqual(
    { label: steps[0].label, status: steps[0].status },
    {
      label: '生成任务已完成',
      status: 'success',
    },
  );
});

test('执行步骤：只保留目标 run 的事件并按 ts 升序', () => {
  const steps = buildAgentRunSteps({
    currentRun: { id: 'b', status: 'success' },
    runEvents: [
      { runId: 'a', type: 'tool.completed', commandId: 'node.create', ts: 5 },
      { runId: 'b', type: 'tool.completed', commandId: 'node.setModel', ts: 20 },
      { runId: 'b', type: 'tool.completed', commandId: 'node.create', ts: 10 },
    ],
  });
  assert.deepEqual(
    steps.map((step) => step.label),
    ['创建节点', '设置模型', '任务完成'],
  );
  assert.equal(steps[2].key, 'b:terminal');
});

test('执行步骤：非终态 currentRun 追加 :current 且标签随状态变化', () => {
  const cases = [
    ['planning', '规划下一步'],
    ['executing', '执行画布动作'],
    ['running', '处理中'],
  ];
  for (const [status, label] of cases) {
    const steps = buildAgentRunSteps({ currentRun: { id: 'r', status, step: 3 } });
    assert.equal(steps.length, 1);
    assert.deepEqual(
      { key: steps[0].key, label: steps[0].label, step: steps[0].step },
      {
        key: 'r:current',
        label,
        step: 3,
      },
    );
    assert.equal(typeof steps[0].ts, 'number');
  }
});

test('执行步骤：waiting_tasks 且已有等待步时不再追加 :current', () => {
  const steps = buildAgentRunSteps({
    currentRun: { id: 'r', status: 'waiting_tasks' },
    runEvents: [{ runId: 'r', type: 'task.waiting', step: 1, ts: 1 }],
  });
  assert.deepEqual(
    steps.map((step) => step.key),
    ['r:task-wait:1'],
  );
});

test('执行步骤：waiting_tasks 无等待步时仍追加 :current', () => {
  const steps = buildAgentRunSteps({ currentRun: { id: 'r', status: 'waiting_tasks' } });
  assert.deepEqual(
    { key: steps[0].key, label: steps[0].label, status: steps[0].status },
    {
      key: 'r:current',
      label: '等待生成任务完成',
      status: 'running',
    },
  );
});

test('执行步骤：终态 currentRun 追加 :terminal 并给出对应文案', () => {
  const cases = [
    ['success', '任务完成', 'success'],
    ['stopped', '任务已停止', 'cancelled'],
    ['cancelled', '任务已取消', 'cancelled'],
    ['failed', '任务失败', 'failed'],
  ];
  for (const [status, label, normalized] of cases) {
    const steps = buildAgentRunSteps({ currentRun: { id: 'r', status } });
    assert.deepEqual(
      { key: steps[0].key, label: steps[0].label, status: steps[0].status },
      { key: 'r:terminal', label, status: normalized },
      status,
    );
  }
});

test('执行步骤：最多保留末 8 条', () => {
  const runEvents = Array.from({ length: 12 }, (_, index) => ({
    runId: 'r',
    type: 'tool.completed',
    step: index,
    commandId: 'node.create',
    ts: index,
  }));
  const steps = buildAgentRunSteps({ runEvents });
  assert.equal(steps.length, 8);
  assert.equal(steps[0].step, 4);
  assert.equal(steps[7].step, 11);
});

test('执行步骤：runEvents 非数组时容错为空', () => {
  const steps = buildAgentRunSteps({ runEvents: 'x', currentRun: { id: 'r', status: 'success' } });
  assert.equal(steps[0].key, 'r:terminal');
});

test('执行步骤：内部工具函数导出且冻结', () => {
  assert.ok(Object.isFrozen(agentRunStepInternals));
  assert.deepEqual(Object.keys(agentRunStepInternals).sort(), ['commandLabel', 'normalizeStatus']);
});

test('执行步骤：normalizeStatus 归一五类状态并保留未知值', () => {
  const cases = [
    ['DONE', 'success'],
    ['Succeeded', 'success'],
    ['chat', 'success'],
    ['error', 'failed'],
    ['canceled', 'cancelled'],
    ['stopped', 'cancelled'],
    ['need_confirmation', 'waiting'],
    ['pending', 'running'],
    ['', 'pending'],
    ['weird', 'weird'],
  ];
  for (const [input, expected] of cases)
    assert.equal(agentRunStepInternals.normalizeStatus(input), expected, input);
});

test('执行步骤：commandLabel 命中表内文案，否则回落', () => {
  const label = agentRunStepInternals.commandLabel;
  assert.equal(label('layout.arrangeGrid'), '网格排列');
  assert.equal(label('collage.createFromSelection'), '创建拼贴');
  assert.equal(label('generation.runBatch'), '批量生成内容');
  assert.equal(label('custom.cmd'), 'custom.cmd');
  assert.equal(label(''), '执行画布动作');
  assert.equal(label(null), '执行画布动作');
});
