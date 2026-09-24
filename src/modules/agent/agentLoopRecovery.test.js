import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAgentLoopActionBudget,
  isAgentLoopRecoveryEditMessage,
  isAgentLoopRetryMessage,
  recordAgentLoopActionBudgetResult,
  shouldRetryAgentLoopNoop,
  validateAgentLoopActionBudget,
} from './agentLoopRecovery.js';

test('重试判定：整句白名单，只允许纯标点与固定短句，多一个字即不认', () => {
  assert.equal(isAgentLoopRetryMessage('重试'), true);
  assert.equal(isAgentLoopRetryMessage('再试一次'), true);
  assert.equal(isAgentLoopRetryMessage('请重试。'), true);
  assert.equal(isAgentLoopRetryMessage('继续'), true);
  assert.equal(isAgentLoopRetryMessage('？？'), true);
  assert.equal(isAgentLoopRetryMessage('?？'), true);
  // 字符类只含问号 ⇒ 混入感叹号即失配
  assert.equal(isAgentLoopRetryMessage('？！'), false);
  assert.equal(isAgentLoopRetryMessage('Retry!!'), true);
  assert.equal(isAgentLoopRetryMessage(' try again '), true);
  assert.equal(isAgentLoopRetryMessage('resume.'), true);
  // 锚定 ^…$ ⇒ 任何前后缀都判否
  assert.equal(isAgentLoopRetryMessage('继续生成'), false);
  assert.equal(isAgentLoopRetryMessage('retry now'), false);
  assert.equal(isAgentLoopRetryMessage('帮我重试这个任务'), false);
  assert.equal(isAgentLoopRetryMessage('重试？好的'), false);
  // 空串与仅空白先被 trim 拦下
  assert.equal(isAgentLoopRetryMessage(''), false);
  assert.equal(isAgentLoopRetryMessage('   '), false);
  assert.equal(isAgentLoopRetryMessage(), false);
  assert.equal(isAgentLoopRetryMessage(null), false);
});

test('恢复编辑判定：正则不锚定，中英换模型/改提示词/上次失败三类均可命中', () => {
  assert.equal(isAgentLoopRecoveryEditMessage('刚才的生成失败了'), true);
  assert.equal(isAgentLoopRecoveryEditMessage('上次任务节点有问题'), true);
  assert.equal(isAgentLoopRecoveryEditMessage('修改提示词里的背景'), true);
  assert.equal(isAgentLoopRecoveryEditMessage('原生成改成竖版'), true);
  assert.equal(isAgentLoopRecoveryEditMessage('换成别的模型'), true);
  assert.equal(isAgentLoopRecoveryEditMessage('修改需求为赛博朋克'), true);
  assert.equal(isAgentLoopRecoveryEditMessage('please change the model'), true);
  assert.equal(isAgentLoopRecoveryEditMessage('edit my prompt a bit'), true);
  assert.equal(isAgentLoopRecoveryEditMessage('replace that model now'), true);
  // 「模型改成 X」句式里没有第二个「模型」⇒ 不命中，端口现状
  assert.equal(isAgentLoopRecoveryEditMessage('把模型改成 seedance'), false);
  assert.equal(isAgentLoopRecoveryEditMessage('画一只猫'), false);
  assert.equal(isAgentLoopRecoveryEditMessage(''), false);
  assert.equal(isAgentLoopRecoveryEditMessage(), false);
});

test('空转重试判定：四个条件同时成立才重试，status 为 chat 时永不重试', () => {
  const base = { hasActionIntent: true, toolResultCount: 0, retryCount: 0, status: '' };
  assert.equal(shouldRetryAgentLoopNoop(base), true);
  assert.equal(shouldRetryAgentLoopNoop({ ...base, status: 'ok' }), true);
  // 无动作意图
  assert.equal(shouldRetryAgentLoopNoop({ ...base, hasActionIntent: false }), false);
  assert.equal(shouldRetryAgentLoopNoop({ ...base, hasActionIntent: undefined }), false);
  assert.equal(shouldRetryAgentLoopNoop({}), false);
  // 已有工具结果（非零、字符串数字、NaN 三种都算否决）
  assert.equal(shouldRetryAgentLoopNoop({ ...base, toolResultCount: 1 }), false);
  assert.equal(shouldRetryAgentLoopNoop({ ...base, toolResultCount: '2' }), false);
  assert.equal(shouldRetryAgentLoopNoop({ ...base, toolResultCount: 'abc' }), false);
  assert.equal(shouldRetryAgentLoopNoop({ ...base, toolResultCount: '0' }), true);
  // 只允许一次重试
  assert.equal(shouldRetryAgentLoopNoop({ ...base, retryCount: 1 }), false);
  assert.equal(shouldRetryAgentLoopNoop({ ...base, retryCount: -1 }), true);
  assert.equal(shouldRetryAgentLoopNoop({ ...base, retryCount: 'x' }), false);
  // chat 状态硬否决
  assert.equal(shouldRetryAgentLoopNoop({ ...base, status: 'chat' }), false);
  assert.equal(shouldRetryAgentLoopNoop({ ...base, status: null }), true);
});

test('动作预算：从消息取副本数提示，取不到即 0 且初始已用为 0', () => {
  assert.deepEqual(createAgentLoopActionBudget('复制3份'), {
    duplicateNodeLimit: 3,
    duplicatedNodeCount: 0,
  });
  assert.deepEqual(createAgentLoopActionBudget('来5个副本'), {
    duplicateNodeLimit: 5,
    duplicatedNodeCount: 0,
  });
  // 无提示 ⇒ undefined 经 `|| 0x0` 回落 0
  for (const message of ['', null, undefined, '画一只猫', '复制 15 份']) {
    assert.deepEqual(
      createAgentLoopActionBudget(message),
      {
        duplicateNodeLimit: 0,
        duplicatedNodeCount: 0,
      },
      JSON.stringify(message),
    );
  }
  assert.deepEqual(createAgentLoopActionBudget(), { duplicateNodeLimit: 0, duplicatedNodeCount: 0 });
});

test('预算校验：非 node.duplicate 或上限为 0 时直接放行且不回统计量', () => {
  assert.deepEqual(validateAgentLoopActionBudget({ type: 'node.delete' }, { duplicateNodeLimit: 1 }), {
    ok: true,
  });
  assert.deepEqual(validateAgentLoopActionBudget({ type: 'node.duplicate' }, { duplicateNodeLimit: 0 }), {
    ok: true,
  });
  assert.deepEqual(validateAgentLoopActionBudget({ type: 'node.duplicate' }, {}), { ok: true });
  assert.deepEqual(validateAgentLoopActionBudget({}, { duplicateNodeLimit: 2 }), { ok: true });
  assert.deepEqual(validateAgentLoopActionBudget(), { ok: true });
});

test('预算校验：计划数按 ids 长度乘 copies，copies 至少 1 且向下取整，上限为负钳到 0', () => {
  const ok = validateAgentLoopActionBudget(
    { type: 'node.duplicate', args: { ids: ['a', 'b'], copies: 2 } },
    { duplicateNodeLimit: 5, duplicatedNodeCount: 1 },
  );
  assert.deepEqual(ok, { ok: true, planned: 4, remaining: 4 });
  // 无 ids ⇒ 视作 1 个目标；copies 缺失/非法 ⇒ 1
  assert.equal(
    validateAgentLoopActionBudget({ type: 'node.duplicate' }, { duplicateNodeLimit: 3 }).planned,
    1,
  );
  assert.equal(
    validateAgentLoopActionBudget(
      { type: 'node.duplicate', args: { ids: [], copies: 0 } },
      { duplicateNodeLimit: 3 },
    ).planned,
    1,
  );
  assert.equal(
    validateAgentLoopActionBudget(
      { type: 'node.duplicate', args: { copies: 2.9 } },
      { duplicateNodeLimit: 3 },
    ).planned,
    2,
  );
  assert.equal(
    validateAgentLoopActionBudget({ type: 'node.duplicate', args: { copies: -4 } }, { duplicateNodeLimit: 3 })
      .planned,
    1,
  );
  // 字符串数字可参与计算，但非数字字符串走 `Number(x||1)` ⇒ NaN，端口现状
  assert.equal(
    validateAgentLoopActionBudget(
      { type: 'node.duplicate', args: { copies: '2' } },
      { duplicateNodeLimit: 3 },
    ).planned,
    2,
  );
  const nanPlanned = validateAgentLoopActionBudget(
    { type: 'node.duplicate', args: { copies: 'x' } },
    { duplicateNodeLimit: 3 },
  );
  assert.equal(Number.isNaN(nanPlanned.planned), true);
  assert.equal(nanPlanned.ok, false);
  assert.equal(nanPlanned.errorCode, 'DUPLICATE_BUDGET_EXCEEDED');
  // 上限本身非法同样出 NaN
  assert.equal(
    Number.isNaN(
      validateAgentLoopActionBudget(
        { type: 'node.duplicate', args: { copies: 1 } },
        { duplicateNodeLimit: 'x' },
      ).remaining,
    ),
    true,
  );
  // 已用量为负 ⇒ remaining 钳到 0
  const clamped = validateAgentLoopActionBudget(
    { type: 'node.duplicate', args: { copies: 1 } },
    { duplicateNodeLimit: 2, duplicatedNodeCount: -7 },
  );
  assert.deepEqual(clamped, { ok: true, planned: 1, remaining: 2 });
  assert.equal(
    validateAgentLoopActionBudget(
      { type: 'node.duplicate', args: { copies: 1 } },
      { duplicateNodeLimit: 2, duplicatedNodeCount: 2 },
    ).ok,
    false,
  );
});

test('预算校验：超额时返回完整拒绝对象，恰好等于剩余额度仍算通过', () => {
  const exact = validateAgentLoopActionBudget(
    { type: 'node.duplicate', args: { ids: ['a', 'b'], copies: 3 } },
    { duplicateNodeLimit: 6, duplicatedNodeCount: 0 },
  );
  assert.deepEqual(exact, { ok: true, planned: 6, remaining: 6 });
  const rejected = validateAgentLoopActionBudget(
    { type: 'node.duplicate', args: { ids: ['a', 'b'], copies: 3 } },
    { duplicateNodeLimit: 6, duplicatedNodeCount: 1 },
  );
  assert.deepEqual(rejected, {
    ok: false,
    errorCode: 'DUPLICATE_BUDGET_EXCEEDED',
    limit: 6,
    completed: 1,
    planned: 6,
    remaining: 5,
  });
});

test('预算记账：仅 node.duplicate 且 ok 严格为 true 才累加，否则原对象直接返回', () => {
  const budget = { duplicateNodeLimit: 5, duplicatedNodeCount: 2 };
  const passthrough = [
    [budget, { type: 'node.delete' }, { ok: true, results: [] }],
    [budget, { type: 'node.duplicate' }, { ok: false }],
    [budget, { type: 'node.duplicate' }, { ok: 'true' }],
    [budget, { type: 'node.duplicate' }, undefined],
    [budget, {}, { ok: true, results: [{ result: { nodeIds: ['x'] } }] }],
  ];
  for (const args of passthrough) {
    // 未累加时返回的是同一个引用，不是副本
    assert.equal(recordAgentLoopActionBudgetResult(...args), budget);
  }
  const counted = recordAgentLoopActionBudgetResult(
    budget,
    { type: 'node.duplicate' },
    {
      ok: true,
      results: [{ result: { nodeIds: ['a', 'b'] } }, { result: { nodeIds: ['c', 'd', 'e'] } }],
    },
  );
  // 只取最后一条 results，累加到既有计数上
  assert.deepEqual(counted, { duplicateNodeLimit: 5, duplicatedNodeCount: 5 });
  assert.equal(budget.duplicatedNodeCount, 2);
});

test('预算记账：nodeIds 优先于 ids，两者皆缺或非数组时增量为 0', () => {
  const budget = { duplicateNodeLimit: 3, duplicatedNodeCount: 1 };
  assert.equal(
    recordAgentLoopActionBudgetResult(
      budget,
      { type: 'node.duplicate' },
      {
        ok: true,
        results: [{ result: { nodeIds: ['a', 'b'], ids: ['z'] } }],
      },
    ).duplicatedNodeCount,
    3,
  );
  assert.equal(
    recordAgentLoopActionBudgetResult(
      budget,
      { type: 'node.duplicate' },
      {
        ok: true,
        results: [{ result: { ids: ['z', 'y'] } }],
      },
    ).duplicatedNodeCount,
    3,
  );
  for (const result of [{}, { nodeIds: 'ab' }, { nodeIds: null }, { ids: [] }, null]) {
    assert.equal(
      recordAgentLoopActionBudgetResult(budget, { type: 'node.duplicate' }, { ok: true, results: [result] })
        .duplicatedNodeCount,
      1,
      JSON.stringify(result),
    );
  }
  // results 不是数组 ⇒ 取不到末项，增量 0
  assert.equal(
    recordAgentLoopActionBudgetResult(budget, { type: 'node.duplicate' }, { ok: true, results: 'x' })
      .duplicatedNodeCount,
    1,
  );
  // 既有计数为负 ⇒ 先钳 0 再累加
  assert.equal(
    recordAgentLoopActionBudgetResult(
      { duplicateNodeLimit: 3, duplicatedNodeCount: -9 },
      { type: 'node.duplicate' },
      {
        ok: true,
        results: [{ result: { nodeIds: ['a', 'b'] } }],
      },
    ).duplicatedNodeCount,
    2,
  );
});
