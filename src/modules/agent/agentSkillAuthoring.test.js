import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENT_SKILL_AUTHORING_TARGET_KIND,
  isAgentSkillAuthoringIntent,
  isAgentSkillAuthoringCancelMessage,
  normalizeAgentSkillAuthoringResult,
  requestNormalizedAgentSkillDraft,
  createAvailableAgentSkillId,
} from './agentSkillAuthoring.js';

const VALID_DEFINITION = {
  id: 'Shot-Reviewer',
  title: '分镜审校',
  description: '按镜头检查提示词与画面一致性',
  triggers: ['审校分镜', 'review shots'],
  instructions: '逐镜列出问题并给出修改建议。',
};

test('技能创作目标类型常量', () => {
  assert.equal(AGENT_SKILL_AUTHORING_TARGET_KIND, 'agent-skill-authoring');
});

test('创作意图：创建动词与技能词相邻（32 字内）即命中，中英皆可', () => {
  for (const text of ['帮我创建一个技能', '新建一个 技能', '生成技能：分镜审校', 'create a new skill']) {
    assert.equal(isAgentSkillAuthoringIntent(text), true, text);
  }
  for (const text of ['写一个Skills', '制作技能', 'skill 先创建', 'define skill']) {
    assert.equal(isAgentSkillAuthoringIntent(text), true, text);
  }
});

test('创作意图：反义与提问式一律判否', () => {
  for (const text of [
    '不要创建技能',
    '别新建技能了',
    '不用生成技能',
    'do not create a skill',
    "don't make a skill",
  ]) {
    assert.equal(isAgentSkillAuthoringIntent(text), false, text);
  }
  for (const text of [
    '如何创建技能',
    '怎么新建技能',
    '怎样制作技能',
    'how to create a skill',
    'how do i build skill',
  ]) {
    assert.equal(isAgentSkillAuthoringIntent(text), false, text);
  }
});

test('创作意图：空串与不含创建动词的句子判否，动词表外的词序变体不认', () => {
  assert.equal(isAgentSkillAuthoringIntent(''), false);
  assert.equal(isAgentSkillAuthoringIntent('   '), false);
  assert.equal(isAgentSkillAuthoringIntent(null), false);
  assert.equal(isAgentSkillAuthoringIntent('今天天气不错'), false);
  assert.equal(isAgentSkillAuthoringIntent('this skill is great'), false);
  assert.equal(isAgentSkillAuthoringIntent('技能先建一个'), false);
});

test('取消语：全锚定短句白名单，尾部标点可选一个', () => {
  for (const text of ['取消', '取消创建', '不创建了', '算了', 'cancel', 'never mind', '算了。', 'Cancel！']) {
    assert.equal(isAgentSkillAuthoringCancelMessage(text), true, text);
  }
  for (const text of ['', '算了啊', '取消这个任务', 'never  mind  ok', 'cancel it']) {
    assert.equal(isAgentSkillAuthoringCancelMessage(text), false, text);
  }
});

test('创作结果归一：null / 字符串 / 数组返回结构化失败，缺省实参走序列化器（端口现状）', () => {
  for (const bad of [null, 'x', 7, []]) {
    const res = normalizeAgentSkillAuthoringResult(bad);
    assert.equal(res.ok, false, JSON.stringify(bad));
    assert.equal(res.status, 'failed');
    assert.equal(res.errorCode, 'SKILL_AUTHORING_INVALID');
    assert.match(res.message, /invalid result/);
  }
  assert.equal(normalizeAgentSkillAuthoringResult().errorCode, 'INVALID_SKILL_ID');
});

test('创作结果归一：need_clarification 需要问题文本，选项非数组时给空数组且截到 6', () => {
  const res = normalizeAgentSkillAuthoringResult({
    status: 'need_clarification',
    question: '要给哪个业务线用？',
    options: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  });
  assert.equal(res.ok, true);
  assert.equal(res.status, 'need_clarification');
  assert.equal(res.question, '要给哪个业务线用？');
  assert.equal(res.reply, '要给哪个业务线用？');
  assert.deepEqual(res.options, ['a', 'b', 'c', 'd', 'e', 'f']);
  assert.deepEqual(
    normalizeAgentSkillAuthoringResult({ status: 'need_clarification', question: 'q' }).options,
    [],
  );
  assert.equal(
    normalizeAgentSkillAuthoringResult({ status: 'need_clarification' }).errorCode,
    'SKILL_AUTHORING_QUESTION_MISSING',
  );
});

test('创作结果归一：failed 透传错误码与文案，缺省走 SKILL_AUTHORING_FAILED', () => {
  const res = normalizeAgentSkillAuthoringResult({
    status: 'failed',
    errorCode: 'MODEL_TIMEOUT',
    reply: '模型超时',
  });
  assert.equal(res.ok, false);
  assert.equal(res.errorCode, 'MODEL_TIMEOUT');
  assert.equal(res.message, '模型超时');
  assert.equal(normalizeAgentSkillAuthoringResult({ status: 'failed' }).errorCode, 'SKILL_AUTHORING_FAILED');
});

test('创作结果归一：合法草稿经序列化后只回 5 个字段，id 被归一小写', () => {
  const res = normalizeAgentSkillAuthoringResult({ definition: VALID_DEFINITION, reply: '已生成' });
  assert.equal(res.ok, true);
  assert.equal(res.status, 'ready');
  assert.equal(res.reply, '已生成');
  assert.deepEqual(Object.keys(res.definition).sort(), [
    'description',
    'id',
    'instructions',
    'title',
    'triggers',
  ]);
  assert.equal(res.definition.id, 'shot-reviewer');
  assert.deepEqual(res.definition.triggers, ['审校分镜', 'review shots']);
});

test('创作结果归一：定义不合法时返回序列化器的错误码', () => {
  assert.equal(normalizeAgentSkillAuthoringResult({ definition: {} }).errorCode, 'INVALID_SKILL_ID');
  assert.equal(
    normalizeAgentSkillAuthoringResult({ definition: { id: 'ok-id' } }).errorCode,
    'MISSING_SKILL_DESCRIPTION',
  );
  assert.equal(
    normalizeAgentSkillAuthoringResult({
      definition: { id: 'ok-id', description: 'd' },
    }).errorCode,
    'MISSING_SKILL_INSTRUCTIONS',
  );
});

test('创作请求：author 不可用时给 UNAVAILABLE，且不抛异常', async () => {
  for (const author of [undefined, null, 'x']) {
    const res = await requestNormalizedAgentSkillDraft({ author, payload: {} });
    assert.equal(res.errorCode, 'SKILL_AUTHORING_UNAVAILABLE');
    assert.equal(res.ok, false);
  }
});

test('创作请求：首次即合法则不重试，显式 failed 也不重试', async () => {
  let calls = 0;
  const ok = await requestNormalizedAgentSkillDraft({
    author: () => {
      calls += 1;
      return { definition: VALID_DEFINITION };
    },
  });
  assert.equal(ok.status, 'ready');
  assert.equal(calls, 1);

  calls = 0;
  const traces = [];
  const failed = await requestNormalizedAgentSkillDraft({
    author: () => {
      calls += 1;
      return { status: 'failed', reply: '模型拒绝' };
    },
    onTrace: (trace) => traces.push(trace),
  });
  assert.equal(failed.errorCode, 'SKILL_AUTHORING_FAILED');
  assert.equal(calls, 1);
  assert.deepEqual(traces, []);
});

test('创作请求：结构不合规则带 repairReason 重试一次，只重试一次', async () => {
  const payloads = [];
  const traces = [];
  const res = await requestNormalizedAgentSkillDraft({
    author: (payload) => {
      payloads.push(payload);
      if (payloads.length === 1) return { definition: { id: 'Bad Id!' } };
      return { definition: VALID_DEFINITION };
    },
    payload: { draftHint: 'x' },
    onTrace: (trace) => traces.push(trace),
  });
  assert.equal(payloads.length, 2);
  assert.equal(payloads[0].draftHint, 'x');
  assert.equal(payloads[1].draftHint, 'x');
  assert.equal(
    payloads[1].repairReason,
    'INVALID_SKILL_ID: Skill name must use lowercase letters, numbers, and hyphens.',
  );
  assert.deepEqual(traces, [{ type: 'agent_skill_authoring_schema_retry', errorCode: 'INVALID_SKILL_ID' }]);
  assert.equal(res.status, 'ready');
});

test('创作请求：重试后仍不合法则把第二次的失败原样返回', async () => {
  const res = await requestNormalizedAgentSkillDraft({
    author: () => ({ status: 'need_clarification' }),
  });
  assert.equal(res.errorCode, 'SKILL_AUTHORING_QUESTION_MISSING');
});

test('可用技能 id：slug 归一，冲突时从 2 起加后缀，已带后缀则续号', () => {
  assert.equal(createAvailableAgentSkillId('My Skill'), 'my-skill');
  assert.equal(createAvailableAgentSkillId('  My   Skill  ', ['other']), 'my-skill');
  assert.equal(createAvailableAgentSkillId('my skill', ['MY-SKILL']), 'my-skill-2');
  assert.equal(createAvailableAgentSkillId('my skill', ['my-skill', 'my-skill-2']), 'my-skill-3');
  assert.equal(createAvailableAgentSkillId('shot', ['shot', 'shot-2', 'shot-3']), 'shot-4');
});

test('可用技能 id：空回落 skill，非法字符折叠为连字符并去首尾，集合里的空项被丢弃', () => {
  assert.equal(createAvailableAgentSkillId('', ['a']), 'skill');
  assert.equal(createAvailableAgentSkillId('__agent__core__', ['a']), 'agent-core');
  assert.equal(createAvailableAgentSkillId('skill', [null, '', '   ', 'other']), 'skill');
  assert.equal(createAvailableAgentSkillId('skill', ['skill', '']), 'skill-2');
});

test('可用技能 id：基础名超过 64 字时截断到 64，加后缀时再为后缀让位', () => {
  const base = 'a'.repeat(70);
  assert.equal(createAvailableAgentSkillId(base, []), 'a'.repeat(64));
  const collision = createAvailableAgentSkillId(base, ['a'.repeat(64)]);
  assert.equal(collision.length, 64);
  assert.ok(collision.endsWith('-2'));
  assert.equal(collision, 'a'.repeat(62) + '-2');
});
