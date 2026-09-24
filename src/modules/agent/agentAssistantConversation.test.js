import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeAgentAssistantContext,
  normalizeAgentAssistantReply,
  getAgentPendingAssistantChoice,
  getAgentContinuationSkillIds,
} from './agentAssistantConversation.js';

function choiceFixture(overrides = {}) {
  return {
    question: '要先出分镜还是先出主视觉？',
    options: [
      { id: 'storyboard', label: '先出分镜' },
      { id: 'keyvisual', label: '先出主视觉' },
    ],
    ...overrides,
  };
}

test('助手上下文：非对象判 null，数组因缺 Array 校验而当成对象处理（端口现状）', () => {
  for (const bad of [null, undefined, 'x', 7]) {
    assert.equal(normalizeAgentAssistantContext(bad), null, JSON.stringify(bad));
  }
  assert.deepEqual(normalizeAgentAssistantContext([]), { skillIds: [] });
  assert.deepEqual(normalizeAgentAssistantContext({}), { skillIds: [] });
});

test('助手上下文：skillIds 只收小写字母数字连字符、去重并截到 2 个', () => {
  const long = 'x'.repeat(65);
  assert.deepEqual(
    normalizeAgentAssistantContext({
      skillIds: ['skill-a', 'skill-a', 'skill-b', 'Skill C', '-lead', '1ok', long],
    }),
    { skillIds: ['skill-a', 'skill-b'] },
  );
  assert.deepEqual(normalizeAgentAssistantContext({ skillIds: 'not-an-array' }), { skillIds: [] });
});

test('选择题归一：至少 2 个有效选项，按 id 去重，缺 id 或缺 label 直接丢', () => {
  assert.deepEqual(normalizeAgentAssistantContext({ choice: choiceFixture() }), {
    skillIds: [],
    choice: choiceFixture(),
  });
  assert.equal(
    normalizeAgentAssistantContext({ choice: { question: 'q', options: [{ id: 'a', label: 'A' }] } }).choice,
    undefined,
  );
  assert.deepEqual(
    normalizeAgentAssistantContext({
      choice: {
        question: 'q',
        options: [
          { id: 'a', label: 'A' },
          { id: 'a', label: 'dup' },
          { id: '', label: 'no id' },
          { id: 'b' },
          { id: 'b', label: 'B' },
          { id: 'c', label: 'C' },
          { id: 'd', label: 'D' },
        ],
      },
    }).choice.options,
    [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ],
  );
});

test('选择题归一：问题文本首尾空白被去掉并截断到 600 字', () => {
  const q = '  ' + '问'.repeat(700) + '  ';
  const res = normalizeAgentAssistantContext({
    choice: {
      question: q,
      options: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
    },
  });
  assert.equal(res.choice.question.length, 600);
  assert.equal(res.choice.question, '问'.repeat(600));
});

test('助手回复：纯字符串状态恒为 chat', () => {
  assert.deepEqual(normalizeAgentAssistantReply('  你好  '), { status: 'chat', reply: '你好' });
  assert.deepEqual(normalizeAgentAssistantReply({ message: '用 message 字段' }), {
    status: 'chat',
    reply: '用 message 字段',
  });
});

test('助手回复：围栏内 JSON 解析后选项铺平到顶层，剥栏又被追加问题（端口现状）', () => {
  const payload = JSON.stringify(choiceFixture());
  const res = normalizeAgentAssistantReply('先看方案。\n```agent-choice\n' + payload + '\n```');
  assert.equal(res.reply, '先看方案。\n\n要先出分镜还是先出主视觉？');
  assert.equal(res.question, '要先出分镜还是先出主视觉？');
  assert.deepEqual(res.options, choiceFixture().options);
  assert.equal(res.choice, undefined);
});

test('助手回复：围栏内 JSON 非法时选项判空，但围栏文本仍被剥离（端口现状）', () => {
  const res = normalizeAgentAssistantReply('正文\n```agent-choice\n{not json\n```');
  assert.equal(res.reply, '正文');
  assert.equal(res.question, undefined);
});

test('助手回复：正文未包含问题时把问题追加到末尾（两段空行）', () => {
  const res = normalizeAgentAssistantReply({
    reply: '好的',
    choice: choiceFixture(),
  });
  assert.equal(res.reply, '好的\n\n要先出分镜还是先出主视觉？');
  assert.deepEqual(res.options, choiceFixture().options);
  const kept = normalizeAgentAssistantReply({
    reply: '要先出分镜还是先出主视觉？',
    choice: choiceFixture(),
  });
  assert.equal(kept.reply, '要先出分镜还是先出主视觉？');
});

test('待答选择题：仅 assistant + chat 且带合法选项时返回，含 questionId 与通道', () => {
  const history = [
    {
      role: 'assistant',
      status: 'chat',
      itemId: 'item-9',
      assistantContext: { choice: choiceFixture() },
    },
  ];
  const pending = getAgentPendingAssistantChoice(history);
  assert.equal(pending.responseChannel, 'assistant.message');
  assert.equal(pending.questionId, 'item-9:0');
  assert.deepEqual(pending.options, choiceFixture().options);

  assert.equal(getAgentPendingAssistantChoice([{ role: 'user', status: 'chat' }]), null);
  assert.equal(getAgentPendingAssistantChoice([{ role: 'assistant', status: 'success' }]), null);
  assert.equal(getAgentPendingAssistantChoice([]), null);
});

test('待答选择题：questionId 回落链 itemId → turnId → ts:长度，并拼上活动版本号', () => {
  assert.equal(
    getAgentPendingAssistantChoice([
      {
        role: 'assistant',
        status: 'chat',
        turnId: 'turn-3',
        assistantContext: { choice: choiceFixture() },
        replyVersions: { activeIndex: 2 },
      },
    ]).questionId,
    'turn-3:2',
  );
  assert.equal(
    getAgentPendingAssistantChoice([
      { role: 'assistant', status: 'chat', ts: 111, assistantContext: { choice: choiceFixture() } },
    ]).questionId,
    '111:1:0',
  );
});

test('待答选择题：只看最后一条文本消息（非 text 的 messageType 被跳过）', () => {
  const text = {
    role: 'assistant',
    status: 'chat',
    itemId: 'a',
    assistantContext: { choice: choiceFixture() },
  };
  const res = getAgentPendingAssistantChoice([
    text,
    { role: 'user', messageType: 'tool', status: 'chat' },
    { role: 'assistant', messageType: 'card', status: 'running' },
  ]);
  assert.equal(res?.questionId, 'a:0');
});

test('续问技能继承：命中续问语义时继承上一条助手消息的 skillIds', () => {
  const history = [
    { role: 'assistant', status: 'chat', assistantContext: { skillIds: ['skill-a', 'skill-b'] } },
  ];
  assert.deepEqual(getAgentContinuationSkillIds('继续', history), ['skill-a', 'skill-b']);
  assert.deepEqual(getAgentContinuationSkillIds('接着说', history), ['skill-a', 'skill-b']);
  assert.deepEqual(getAgentContinuationSkillIds('继续', []), []);
});

test('续问技能继承：助手状态白名单外的状态不继承', () => {
  for (const status of ['success', 'pending']) {
    assert.deepEqual(
      getAgentContinuationSkillIds('继续', [
        { role: 'assistant', status, assistantContext: { skillIds: ['skill-a'] } },
      ]),
      [],
      status,
    );
  }
  assert.deepEqual(
    getAgentContinuationSkillIds('继续', [
      { role: 'assistant', status: 'stopped', assistantContext: { skillIds: ['skill-c'] } },
    ]),
    ['skill-c'],
  );
});

test('续问技能继承：自定义回答只有在存在待答选择题时才继承', () => {
  const msg = '帮我建一个图片节点';
  const plain = [{ role: 'assistant', status: 'chat', assistantContext: { skillIds: ['skill-a'] } }];
  assert.deepEqual(getAgentContinuationSkillIds(msg, plain), []);
  const withChoice = [
    {
      role: 'assistant',
      status: 'chat',
      itemId: 'i1',
      assistantContext: { skillIds: ['skill-a'], choice: choiceFixture() },
    },
  ];
  assert.deepEqual(getAgentContinuationSkillIds(msg, withChoice), ['skill-a']);
});
