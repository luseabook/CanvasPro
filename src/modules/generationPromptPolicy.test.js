import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROMPT_EMPTY_POLICIES,
  PROMPT_EMPTY_POLICY_VALUES,
  countPromptCharacters,
  evaluateGenerationPromptBoundary,
  resolveGenerationPromptPolicy,
} from './generationPromptPolicy.js';

const manifestWith = (prompt) => ({ prompt });

test('generationPromptPolicy: 空策略常量是冻结的，取值固定', () => {
  assert.deepEqual(PROMPT_EMPTY_POLICIES, {
    BLOCK: 'block',
    ALLOW_WITH_INPUT: 'allowWithInput',
    ALLOW: 'allow',
  });
  assert.deepEqual(PROMPT_EMPTY_POLICY_VALUES, ['block', 'allowWithInput', 'allow']);
  assert.equal(Object.isFrozen(PROMPT_EMPTY_POLICIES), true);
  assert.equal(Object.isFrozen(PROMPT_EMPTY_POLICY_VALUES), true);
});

test('generationPromptPolicy: countPromptCharacters 先去掉首尾空白', () => {
  assert.equal(countPromptCharacters('  abc  '), 3);
  assert.equal(countPromptCharacters('中文字'), 3);
  assert.equal(countPromptCharacters('   '), 0);
});

test('generationPromptPolicy: countPromptCharacters 按码点计数，代理对只算一个', () => {
  assert.equal('😀'.length, 2, 'JS 字符串长度是按 UTF-16 单元算的，这里正是要纠正的地方');
  assert.equal(countPromptCharacters('😀'), 1);
  assert.equal(countPromptCharacters('a😀b'), 3);
});

test('generationPromptPolicy: countPromptCharacters 对空值返回 0', () => {
  assert.equal(countPromptCharacters(''), 0);
  assert.equal(countPromptCharacters(null), 0);
  assert.equal(countPromptCharacters(undefined), 0);
});

test('generationPromptPolicy: 拿不到清单时回落到 block / 长度 1 / source=default', () => {
  const policy = resolveGenerationPromptPolicy();
  assert.equal(policy.emptyPolicy, 'block');
  assert.equal(policy.minLength, 1);
  assert.equal(policy.source, 'default');
  assert.equal(policy.modelManifest, null);
  assert.equal(policy.executionManifest, null);
});

test('generationPromptPolicy: 清单里的策略非法时同样回落，但清单对象原样带回', () => {
  const policy = resolveGenerationPromptPolicy({
    modelManifest: manifestWith({ emptyPolicy: 'nope', minLength: -3 }),
    executionManifest: { adapterType: 'modelApi' },
  });
  assert.equal(policy.emptyPolicy, 'block');
  assert.equal(policy.minLength, 1);
  assert.equal(policy.source, 'default');
  assert.equal(policy.modelManifest.prompt.emptyPolicy, 'nope');
  assert.equal(policy.modelManifest.prompt.minLength, -3);
});

test('generationPromptPolicy: 清单里的合法策略与长度原样生效，source 标为 manifest', () => {
  const policy = resolveGenerationPromptPolicy({
    modelManifest: manifestWith({ emptyPolicy: 'allowWithInput', minLength: 5 }),
    executionManifest: { adapterType: 'modelApi' },
  });
  assert.equal(policy.emptyPolicy, 'allowWithInput');
  assert.equal(policy.minLength, 5);
  assert.equal(policy.source, 'manifest');
  assert.equal(policy.executionManifest.adapterType, 'modelApi');
});

test('generationPromptPolicy: 只有 workflow 且厂商归一为 runninghubwf 时才默认放行空提示', () => {
  const allow = resolveGenerationPromptPolicy({
    provider: 'runninghubwf',
    modelManifest: { adapterType: 'workflow' },
    executionManifest: { adapterType: 'workflow' },
  });
  assert.equal(allow.emptyPolicy, 'allow');
  assert.equal(allow.source, 'default');

  const block = resolveGenerationPromptPolicy({
    provider: 'runninghubwf',
    modelManifest: { adapterType: 'modelApi' },
    executionManifest: { adapterType: 'modelApi' },
  });
  assert.equal(block.emptyPolicy, 'block');
});

test('generationPromptPolicy: 达到最小长度即放行，短于最小长度但不是空则报 promptTooShort', () => {
  const base = {
    modelManifest: manifestWith({ minLength: 3 }),
    executionManifest: { adapterType: 'modelApi' },
  };
  const ok = evaluateGenerationPromptBoundary({ ...base, promptText: '  abc ' });
  assert.equal(ok.ok, true);
  assert.equal(ok.reason, '');
  assert.equal(ok.promptLength, 3);

  const tooShort = evaluateGenerationPromptBoundary({ ...base, promptText: 'ab' });
  assert.equal(tooShort.ok, false);
  assert.equal(tooShort.reason, 'promptTooShort');
  assert.equal(tooShort.promptLength, 2);
});

test('generationPromptPolicy: 空提示按空策略分流，allowWithInput 只在真的有输入时放行', () => {
  const withPolicy = (emptyPolicy) => ({
    modelManifest: manifestWith({ emptyPolicy }),
    executionManifest: { adapterType: 'modelApi' },
  });

  assert.equal(evaluateGenerationPromptBoundary({ ...withPolicy('allow'), promptText: '' }).ok, true);

  const allowed = evaluateGenerationPromptBoundary({
    ...withPolicy('allowWithInput'),
    promptText: '',
    hasInput: true,
  });
  assert.equal(allowed.ok, true);
  assert.equal(allowed.reason, '');

  const rejected = evaluateGenerationPromptBoundary({
    ...withPolicy('allowWithInput'),
    promptText: '',
    hasInput: false,
  });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.reason, 'promptOrInputRequired');

  const blocked = evaluateGenerationPromptBoundary({ ...withPolicy('block'), promptText: '' });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'promptRequired');
});

test('generationPromptPolicy: 边界结果会把策略字段一起带出', () => {
  const result = evaluateGenerationPromptBoundary({
    modelManifest: manifestWith({ emptyPolicy: 'allow', minLength: 2 }),
    executionManifest: { adapterType: 'modelApi' },
    promptText: '',
  });
  assert.equal(result.emptyPolicy, 'allow');
  assert.equal(result.minLength, 2);
  assert.equal(result.source, 'manifest');
  assert.equal(result.promptLength, 0);
});
