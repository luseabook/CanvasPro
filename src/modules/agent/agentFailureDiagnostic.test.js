import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAgentPlannerDiagnostic,
  buildAgentExecutionDiagnostic,
  buildAgentPlannerRecovery,
  agentFailureDiagnosticInternals,
} from './agentFailureDiagnostic.js';

const { classifyPlannerFailure, normalizeErrorCode } = agentFailureDiagnosticInternals;

test('错误码规范化：大写、非字母数字转下划线、截 80，空值才用兜底码', () => {
  assert.equal(normalizeErrorCode('  agent.plan-failed  '), 'AGENT.PLAN-FAILED');
  assert.equal(normalizeErrorCode('bad code/with spaces'), 'BAD_CODE_WITH_SPACES');
  assert.equal(normalizeErrorCode('x'.repeat(120)).length, 80);
  assert.equal(normalizeErrorCode('', 'FALLBACK'), 'FALLBACK');
  assert.equal(normalizeErrorCode('   ', 'FALLBACK'), 'FALLBACK');
  assert.equal(normalizeErrorCode(), '');
  assert.equal(normalizeErrorCode(undefined, undefined), '');
});

test('规划期归因：reason 为 no_action 时优先于一切其它信号', () => {
  assert.equal(classifyPlannerFailure({ reason: 'no_action' }), 'PLANNER_NO_ACTION');
  assert.equal(
    classifyPlannerFailure({ reason: 'no_action', validation: { errorCode: 'AGENT_PLAN_FAILED' } }),
    'PLANNER_NO_ACTION',
  );
  assert.equal(
    classifyPlannerFailure({ reason: 'other', validation: null, cause: '' }),
    'PLANNER_REQUEST_ERROR',
  );
});

test('规划期归因：模型自报失败、三枚不可执行码，及其它校验错误依次命中', () => {
  assert.equal(
    classifyPlannerFailure({ validation: { errorCode: 'agent_plan_failed' } }),
    'PLANNER_REPORTED_FAILURE',
  );
  for (const code of ['UNKNOWN_AGENT_ACTION', 'DEFERRED_AGENT_ACTION', 'BLOCKED_AGENT_ACTION']) {
    assert.equal(
      classifyPlannerFailure({ validation: { errorCode: code }, cause: 'timeout' }),
      'PLANNER_UNSUPPORTED_ACTION',
      code,
    );
  }
  assert.equal(
    classifyPlannerFailure({ validation: { errorCode: 'ARG_MISMATCH' }, cause: 'network unreachable' }),
    'PLANNER_INVALID_ACTION',
  );
});

test('规划期归因：无校验错误时按 cause 文本分鉴权、限流、超时、网络', () => {
  const cases = [
    ['HTTP 401 Unauthorized', 'PLANNER_AUTH_ERROR'],
    ['status 403 forbidden', 'PLANNER_AUTH_ERROR'],
    ['missing api_key', 'PLANNER_AUTH_ERROR'],
    ['authentication failed', 'PLANNER_AUTH_ERROR'],
    ['Error 429', 'PLANNER_RATE_LIMITED'],
    ['rate limited, too many requests', 'PLANNER_RATE_LIMITED'],
    ['quota exceeded', 'PLANNER_RATE_LIMITED'],
    ['request timeout', 'PLANNER_TIMEOUT'],
    ['deadline exceeded', 'PLANNER_TIMEOUT'],
    ['fetch failed', 'PLANNER_NETWORK_ERROR'],
    ['ECONNRESET', 'PLANNER_NETWORK_ERROR'],
    ['you are offline', 'PLANNER_NETWORK_ERROR'],
    ['backend said no', 'PLANNER_REQUEST_ERROR'],
  ];
  for (const [cause, expected] of cases) {
    assert.equal(classifyPlannerFailure({ cause }), expected, cause);
  }
});

test('规划诊断：阶段标签与文案取自语言包，步数至少为 1，completedSteps 只数 ok===true', () => {
  const diagnostic = buildAgentPlannerDiagnostic({
    locale: 'zh-CN',
    loopState: {
      step: 0,
      toolResults: [{ ok: true }, { ok: false }, { ok: 'true' }, null, { ok: true }],
      validationFeedback: [{ commandId: 'fb.cmd' }],
    },
    cause: 'fetch failed',
  });
  assert.equal(diagnostic.phase, 'planning');
  assert.equal(diagnostic.phaseLabel, '规划阶段');
  assert.equal(diagnostic.errorCode, 'PLANNER_NETWORK_ERROR');
  assert.equal(diagnostic.summary, '模型服务网络请求失败');
  assert.equal(diagnostic.detail, '未收到可执行的规划结果，可以从当前检查点继续。');
  assert.equal(diagnostic.step, 1);
  assert.equal(diagnostic.completedSteps, 2);
  assert.equal(diagnostic.retryable, true);
  assert.equal(diagnostic.sourceErrorCode, '');
  assert.equal(diagnostic.commandId, 'fb.cmd');
  assert.equal(buildAgentPlannerDiagnostic({}).step, 1);
  assert.equal(buildAgentPlannerDiagnostic({}).completedSteps, 0);
});

test('规划诊断：错误码与命令优先取 validation，否则回落最后一条校验反馈', () => {
  const diagnostic = buildAgentPlannerDiagnostic({
    locale: 'en-US',
    validation: {
      errorCode: 'unknown agent action',
      plan: { actions: [{ type: '  node.create  ' }] },
    },
    loopState: { step: 2.9, validationFeedback: [{ commandId: 'ignored' }] },
  });
  assert.equal(diagnostic.sourceErrorCode, 'UNKNOWN_AGENT_ACTION');
  assert.equal(diagnostic.commandId, 'node.create');
  assert.equal(diagnostic.step, 3);
  assert.equal(diagnostic.phaseLabel, 'Planning');
  assert.equal(diagnostic.summary, 'Planner action is unavailable');
});

test('规划诊断：未知错误码走请求失败兜底文案，非 en 语言一律 zh-CN', () => {
  const diagnostic = buildAgentPlannerDiagnostic({ locale: 'ja-JP', validation: { errorCode: 'WEIRD' } });
  assert.equal(diagnostic.errorCode, 'PLANNER_INVALID_ACTION');
  assert.equal(diagnostic.phaseLabel, '规划阶段');
  const fallbackCopy = buildAgentPlannerDiagnostic({ locale: 'zh-Hant', cause: 'timeout' });
  assert.equal(fallbackCopy.errorCode, 'PLANNER_TIMEOUT');
  assert.equal(fallbackCopy.summary, '模型服务响应超时');
  assert.equal(fallbackCopy.detail, '规划请求没有在时限内完成，已保留原任务和已完成步骤。');
  // 端口按 `toLowerCase().startsWith('en')` 判语言，故以 en 开头的任意标签都走英文包
  const englishish = buildAgentPlannerDiagnostic({ locale: 'English-British', cause: 'timeout' });
  assert.equal(englishish.phaseLabel, 'Planning');
  assert.equal(englishish.summary, 'Model service timed out');
  assert.equal(buildAgentPlannerDiagnostic({ cause: 'timeout' }).phaseLabel, '规划阶段');
});

test('执行诊断：错误码兜底 EXECUTION_ACTION_FAILED，commandId 只从 recovery 取，retryable 取决于 recovery', () => {
  const diagnostic = buildAgentExecutionDiagnostic({
    execution: { raw: { errorCode: 'node_create_failed' } },
    step: 4,
  });
  assert.equal(diagnostic.phase, 'execution');
  assert.equal(diagnostic.phaseLabel, '执行阶段');
  assert.equal(diagnostic.errorCode, 'NODE_CREATE_FAILED');
  assert.equal(diagnostic.sourceErrorCode, '');
  assert.equal(diagnostic.commandId, '');
  assert.equal(diagnostic.step, 5);
  assert.equal(diagnostic.retryable, false);
  assert.equal(diagnostic.summary, '画布动作执行失败');
  const withRecovery = buildAgentExecutionDiagnostic({
    recovery: { failedAction: { type: ' generation.run ' } },
    locale: 'en-US',
  });
  assert.equal(withRecovery.retryable, true);
  assert.equal(withRecovery.commandId, 'generation.run');
  assert.equal(withRecovery.errorCode, 'EXECUTION_ACTION_FAILED');
  assert.equal(withRecovery.phaseLabel, 'Execution');
  assert.equal(withRecovery.summary, 'Canvas action failed');
  assert.equal(withRecovery.step, 1);
});

test('执行诊断：completedSteps 显式数值优先，否则数 results 中 ok!==false 的条数', () => {
  const results = [{ ok: true }, { ok: false }, {}, { ok: null }, { ok: 'yes' }];
  assert.equal(buildAgentExecutionDiagnostic({ execution: { results } }).completedSteps, 4);
  assert.equal(
    buildAgentExecutionDiagnostic({ execution: { results }, completedSteps: 0 }).completedSteps,
    0,
  );
  assert.equal(
    buildAgentExecutionDiagnostic({ execution: { results }, completedSteps: 9.7 }).completedSteps,
    9,
  );
  assert.equal(
    buildAgentExecutionDiagnostic({ execution: { results }, completedSteps: 'abc' }).completedSteps,
    4,
  );
  assert.equal(buildAgentExecutionDiagnostic({ execution: {} }).completedSteps, 0);
  assert.equal(buildAgentExecutionDiagnostic({ execution: { results: 'no' } }).completedSteps, 0);
});

test('恢复方案：三个选项顺序固定，editRequest 带 trim 后截 4000 的草稿', () => {
  const zh = buildAgentPlannerRecovery({ originalMessage: '  帮我建一个节点  ' });
  assert.deepEqual(
    zh.options.map((option) => option.id),
    ['retryPlanner', 'editRequest', 'changeModel'],
  );
  assert.deepEqual(
    zh.options.map((option) => option.label),
    ['自动修复并继续', '修改需求', '换模型'],
  );
  assert.equal(zh.options[1].draft, '帮我建一个节点');
  assert.equal(zh.kind, 'planner');
  const en = buildAgentPlannerRecovery({ locale: 'en-US', originalMessage: 'x'.repeat(4500) });
  assert.deepEqual(
    en.options.map((option) => option.label),
    ['Repair and continue', 'Edit request', 'Change model'],
  );
  assert.equal(en.options[1].draft.length, 4000);
  assert.equal(buildAgentPlannerRecovery({}).options[1].draft, '');
});

test('内部导出与语言包：internals 冻结，中英键集对称且错误码文案成对', () => {
  assert.equal(Object.isFrozen(agentFailureDiagnosticInternals), true);
  assert.deepEqual(Object.keys(agentFailureDiagnosticInternals).sort(), [
    'classifyPlannerFailure',
    'normalizeErrorCode',
  ]);
  const zhKeys = Object.keys(
    buildAgentPlannerRecovery({ locale: 'zh-CN' }).options.reduce(
      (acc, option) => ({ ...acc, [option.id]: 1 }),
      {},
    ),
  );
  const enKeys = Object.keys(
    buildAgentPlannerRecovery({ locale: 'en-US' }).options.reduce(
      (acc, option) => ({ ...acc, [option.id]: 1 }),
      {},
    ),
  );
  assert.deepEqual(zhKeys, enKeys);
  for (const locale of ['zh-CN', 'en-US']) {
    for (const code of [
      'PLANNER_AUTH_ERROR',
      'PLANNER_RATE_LIMITED',
      'PLANNER_TIMEOUT',
      'PLANNER_NETWORK_ERROR',
      'PLANNER_NO_ACTION',
      'PLANNER_REPORTED_FAILURE',
      'PLANNER_INVALID_ACTION',
      'PLANNER_UNSUPPORTED_ACTION',
      'PLANNER_REQUEST_ERROR',
      'EXECUTION_ACTION_FAILED',
    ]) {
      const diagnostic = buildAgentPlannerDiagnostic({
        locale,
        validation: { errorCode: code === 'PLANNER_UNSUPPORTED_ACTION' ? 'UNKNOWN_AGENT_ACTION' : 'OTHER' },
        reason: code === 'PLANNER_NO_ACTION' ? 'no_action' : '',
        cause: code === 'PLANNER_AUTH_ERROR' ? '401' : code === 'PLANNER_RATE_LIMITED' ? '429' : '',
      });
      assert.equal(typeof diagnostic.summary, 'string');
      assert.ok(diagnostic.summary.length > 0, `${locale} ${code}`);
      assert.ok(diagnostic.detail.length > 0, `${locale} ${code}`);
    }
  }
});
