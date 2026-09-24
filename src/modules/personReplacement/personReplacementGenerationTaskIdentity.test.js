import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERSON_REPLACEMENT_GENERATION_TASK_IDENTITY_FIELDS,
  isPersonReplacementGenerationTaskActive,
  normalizePersonReplacementGenerationTaskIdentity,
  projectPersonReplacementGenerationTaskIdentity,
  hasPersonReplacementGenerationTaskIdentityChanged,
  getRecoverablePersonReplacementGenerationTask,
} from './personReplacementGenerationTaskIdentity.js';

test('generationTaskIdentity: 身份字段表冻结且恰好 5 项', () => {
  assert.equal(Object.isFrozen(PERSON_REPLACEMENT_GENERATION_TASK_IDENTITY_FIELDS), true);
  assert.deepEqual(PERSON_REPLACEMENT_GENERATION_TASK_IDENTITY_FIELDS, [
    'taskId',
    'modelId',
    'provider',
    'providerProfileId',
    'executionId',
  ]);
});

test('generationTaskIdentity: isActive 仅认 queued/submitting/running（去空白、大小写无关）', () => {
  for (const s of ['queued', 'submitting', 'running', ' Running ', 'RUNNING']) {
    assert.equal(isPersonReplacementGenerationTaskActive(s), true, String(s));
    assert.equal(isPersonReplacementGenerationTaskActive({ status: s }), true, String(s));
  }
  for (const s of ['done', 'failed', 'succeeded', '', 'queuedx', 'submit']) {
    assert.equal(isPersonReplacementGenerationTaskActive(s), false, String(s));
  }
  assert.equal(isPersonReplacementGenerationTaskActive(undefined), false);
  assert.equal(isPersonReplacementGenerationTaskActive({}), false);
  assert.equal(isPersonReplacementGenerationTaskActive(null), false);
});

test('generationTaskIdentity: normalize 取字符串字段、丢空、判非正数 startedAt、严格 true 才带 useOpenapiQuery', () => {
  assert.deepEqual(normalizePersonReplacementGenerationTaskIdentity({}), {});
  assert.deepEqual(normalizePersonReplacementGenerationTaskIdentity(null), {});
  assert.deepEqual(normalizePersonReplacementGenerationTaskIdentity([]), {});
  assert.deepEqual(
    normalizePersonReplacementGenerationTaskIdentity({
      taskId: '  t1  ',
      modelId: ' m1 ',
      provider: '   ',
      providerProfileId: 0,
      executionId: ' e1 ',
      startedAt: '1700000000000',
      useOpenapiQuery: true,
    }),
    {
      taskId: 't1',
      modelId: 'm1',
      providerProfileId: '0',
      executionId: 'e1',
      startedAt: 1700000000000,
      useOpenapiQuery: true,
    },
  );
});

test('generationTaskIdentity: startedAt 仅收有限正数、useOpenapiQuery 仅收严格 true', () => {
  assert.deepEqual(normalizePersonReplacementGenerationTaskIdentity({ startedAt: 0 }), {});
  assert.deepEqual(normalizePersonReplacementGenerationTaskIdentity({ startedAt: -5 }), {});
  assert.deepEqual(normalizePersonReplacementGenerationTaskIdentity({ startedAt: 'abc' }), {});
  assert.deepEqual(normalizePersonReplacementGenerationTaskIdentity({ startedAt: Infinity }), {});
  assert.deepEqual(normalizePersonReplacementGenerationTaskIdentity({ useOpenapiQuery: 1 }), {});
  assert.deepEqual(normalizePersonReplacementGenerationTaskIdentity({ useOpenapiQuery: 'true' }), {});
});

test('generationTaskIdentity: project 优先级 meta > 显式 taskId > defaults，并兼容 rhProviderProfileId', () => {
  assert.deepEqual(
    projectPersonReplacementGenerationTaskIdentity({
      taskId: 'arg',
      meta: { taskId: 'meta', modelId: 'mm', rhProviderProfileId: 'rh' },
      defaults: { taskId: 'def', modelId: 'dm', provider: 'dp', executionId: 'de', startedAt: 7 },
    }),
    {
      taskId: 'meta',
      modelId: 'mm',
      provider: 'dp',
      providerProfileId: 'rh',
      executionId: 'de',
      startedAt: 7,
    },
  );
  assert.deepEqual(
    projectPersonReplacementGenerationTaskIdentity({
      taskId: 'arg',
      meta: {},
      defaults: { modelId: 'dm' },
    }),
    { taskId: 'arg', modelId: 'dm' },
  );
  assert.deepEqual(projectPersonReplacementGenerationTaskIdentity(), {});
  assert.deepEqual(
    projectPersonReplacementGenerationTaskIdentity({
      meta: { useOpenapiQuery: false },
      defaults: { useOpenapiQuery: true },
    }),
    { useOpenapiQuery: true },
  );
});

test('generationTaskIdentity: hasChanged 归一化后逐字段 Object.is 比较（含 startedAt/useOpenapiQuery）', () => {
  assert.equal(hasPersonReplacementGenerationTaskIdentityChanged({}, {}), false);
  assert.equal(hasPersonReplacementGenerationTaskIdentityChanged(null, undefined), false);
  assert.equal(hasPersonReplacementGenerationTaskIdentityChanged({ taskId: ' a ' }, { taskId: 'a' }), false);
  assert.equal(hasPersonReplacementGenerationTaskIdentityChanged({ taskId: 'a' }, { taskId: 'b' }), true);
  assert.equal(hasPersonReplacementGenerationTaskIdentityChanged({ startedAt: 1 }, { startedAt: 2 }), true);
  assert.equal(hasPersonReplacementGenerationTaskIdentityChanged({}, { useOpenapiQuery: true }), true);
  assert.equal(hasPersonReplacementGenerationTaskIdentityChanged({ executionId: 'x' }, {}), true);
});

test('generationTaskIdentity: getRecoverable 需任务活跃且 taskId 与 modelId 齐备', () => {
  assert.equal(getRecoverablePersonReplacementGenerationTask(), null);
  assert.equal(
    getRecoverablePersonReplacementGenerationTask({ status: 'done', taskId: 't', modelId: 'm' }),
    null,
  );
  assert.equal(getRecoverablePersonReplacementGenerationTask({ status: 'running', taskId: 't' }), null);
  assert.equal(getRecoverablePersonReplacementGenerationTask({ status: 'running', modelId: 'm' }), null);
  assert.deepEqual(
    getRecoverablePersonReplacementGenerationTask({
      status: ' Running ',
      taskId: 't1',
      modelId: 'm1',
      requestId: ' r1 ',
      startedAt: 3,
    }),
    { status: 'running', taskId: 't1', modelId: 'm1', startedAt: 3, requestId: 'r1' },
  );
});
