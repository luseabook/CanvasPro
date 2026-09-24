import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldUseCreativeDefaults } from './agentClarificationPolicy.js';

const OK_MESSAGE = '帮我生成一张产品图片';

function base(overrides = {}) {
  return {
    userMessage: OK_MESSAGE,
    plan: { status: 'need_clarification', question: '' },
    agentContext: { commands: [{ id: 'node.create' }] },
    ...overrides,
  };
}

test('happy path: 需要澄清 + 明确创作请求 + 命令表含 node.create', () => {
  assert.equal(shouldUseCreativeDefaults(base()), true);
});

test('plan 状态不是 need_clarification 时直接为假', () => {
  assert.equal(shouldUseCreativeDefaults(base({ plan: { status: 'success' } })), false);
  assert.equal(shouldUseCreativeDefaults(base({ plan: {} })), false);
  assert.equal(shouldUseCreativeDefaults(), false);
});

test('已有工具结果（toolResultCount > 0）时不再套用创作缺省', () => {
  assert.equal(shouldUseCreativeDefaults(base({ toolResultCount: 1 })), false);
  assert.equal(shouldUseCreativeDefaults(base({ toolResultCount: '0' })), true);
  assert.equal(shouldUseCreativeDefaults(base({ toolResultCount: null })), true);
});

test('消息未命中创作创建模式时为假', () => {
  assert.equal(shouldUseCreativeDefaults(base({ userMessage: '帮我整理一下画布' })), false);
  assert.equal(shouldUseCreativeDefaults(base({ userMessage: '' })), false);
});

test('英文创作消息亦可命中', () => {
  assert.equal(
    shouldUseCreativeDefaults(base({ userMessage: 'please create a poster for the launch' })),
    true,
  );
});

test('命令表须含 node.create：缺失、非数组、大小写不符皆为假', () => {
  assert.equal(
    shouldUseCreativeDefaults(base({ agentContext: { commands: [{ id: 'graph.connect' }] } })),
    false,
  );
  assert.equal(shouldUseCreativeDefaults(base({ agentContext: { commands: 'node.create' } })), false);
  assert.equal(
    shouldUseCreativeDefaults(base({ agentContext: { commands: [{ id: 'Node.create' }] } })),
    false,
  );
  assert.equal(shouldUseCreativeDefaults(base({ agentContext: null })), false);
});

test('命令表允许裸字符串项，且空串/空白项被过滤', () => {
  assert.equal(
    shouldUseCreativeDefaults(base({ agentContext: { commands: ['', '  ', 'node.create'] } })),
    true,
  );
});

test('澄清问题命中「不可推断输入」模式时为假，且回落 reply 字段', () => {
  assert.equal(
    shouldUseCreativeDefaults(base({ plan: { status: 'need_clarification', question: '请选择参考图' } })),
    false,
  );
  assert.equal(
    shouldUseCreativeDefaults(
      base({ plan: { status: 'need_clarification', reply: 'Which node should I use?' } }),
    ),
    false,
  );
  assert.equal(
    shouldUseCreativeDefaults(base({ plan: { status: 'need_clarification', question: '要什么风格？' } })),
    true,
  );
});

test('问题为空串时回落 plan.reply', () => {
  assert.equal(
    shouldUseCreativeDefaults(
      base({ plan: { status: 'need_clarification', question: '', reply: '请上传文件' } }),
    ),
    false,
  );
});
