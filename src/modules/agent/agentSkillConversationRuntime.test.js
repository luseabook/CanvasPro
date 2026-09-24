import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentSkillConversationRuntime } from './agentSkillConversationRuntime.js';
import { AGENT_SKILL_LIFECYCLE_TARGET_KIND } from './agentSkillLifecycle.js';

const SKILLS = () => [
  {
    id: 'cat-fact',
    title: '猫咪趣闻',
    description: '讲猫',
    triggers: [],
    instructions: 'i',
    source: 'installed',
    managedBy: 'shuo-canvas',
    enabled: true,
  },
];

function make(over = {}) {
  const sessionStore = {
    history: [],
    pending: over.pending ?? null,
    getHistory: () => sessionStore.history,
    pushHistory: (e) => sessionStore.history.push(e),
    recordTrace: () => {},
    setPendingClarification: (p) => (sessionStore.pending = p),
    clearPendingClarification: () => (sessionStore.pending = null),
    getPendingClarification: () => sessionStore.pending,
    setCurrentRun: () => {},
  };
  const saves = [];
  const runtime = createAgentSkillConversationRuntime({
    sessionStore,
    skillRegistry: { listSkills: SKILLS },
    author:
      'author' in over
        ? over.author
        : async () => ({
            status: 'ready',
            definition: {
              id: 'new-skill',
              title: '新技能',
              description: 'd',
              triggers: [],
              instructions: 'i',
            },
          }),
    saveSkill: async (d) => (saves.push(d), { success: true }),
    deleteSkill: async () => ({ success: true }),
    setSkillEnabled: async () => true,
  });
  return { runtime, sessionStore, saves };
}

test('技能会话门面：只暴露 getPending 与 handle 两个入口', () => {
  const { runtime } = make();
  assert.deepEqual(Object.keys(runtime), ['getPending', 'handle']);
});

test('技能会话门面：无挂起项时按「生命周期优先、创作次之」分派', async () => {
  const { runtime, saves } = make();
  const r = await runtime.handle({ message: '停用 cat-fact', runId: 'r' });
  assert.deepEqual([r.status, r.responseChannel], ['success', 'skill.lifecycle']);
  assert.deepEqual(saves, []);
  const c = await runtime.handle({ message: '帮我创建一个技能', runId: 'r' });
  assert.deepEqual([c.status, c.responseChannel], ['success', 'skill.authoring']);
  assert.equal(saves.length, 1);
});

test('技能会话门面：两条链都不命中时返回 null 交给上层', async () => {
  const { runtime, saves } = make();
  assert.equal(await runtime.handle({ message: '今天天气不错' }), null);
  assert.deepEqual(saves, []);
});

test('技能会话门面：handle 无实参时按空消息处理并返回 null', async () => {
  const { runtime } = make();
  assert.equal(await runtime.handle(), null);
});

test('技能会话门面：pending 带生命周期 targetKind 时走 answer 分支', async () => {
  const {
    runtime,
    sessionStore,
    deletes = [],
  } = make({
    pending: {
      targetKind: AGENT_SKILL_LIFECYCLE_TARGET_KIND,
      phase: 'delete-confirmation',
      operation: 'delete',
      skillId: 'cat-fact',
      question: '确认删除？',
      originalMessage: '删除 cat-fact',
    },
  });
  const r = await runtime.handle({ message: '确认删除', pending: sessionStore.pending, runId: 'r' });
  assert.deepEqual([r.status, r.reply], ['success', '已删除 Skill「猫咪趣闻」（$cat-fact）。']);
  assert.equal(sessionStore.pending, null);
});

test('技能会话门面：pending 属创作态时由创作链接手，生命周期链不参与', async () => {
  const { runtime, sessionStore, saves } = make({
    pending: {
      targetKind: 'agent-skill-authoring',
      phase: 'authoring-clarification',
      operation: 'create',
      question: '想要什么技能？',
      originalMessage: '建个技能',
    },
  });
  const r = await runtime.handle({ message: '一个讲猫咪的技能', pending: sessionStore.pending, runId: 'r' });
  assert.deepEqual([r.status, r.responseChannel], ['success', 'skill.authoring']);
  assert.equal(saves.length, 1);
  assert.equal(sessionStore.pending, null);
});

test('技能会话门面：pending 的 targetKind 缺省时按创作链处理（非生命周期即创作）', async () => {
  const { runtime } = make();
  const r = await runtime.handle({
    message: '一个讲猫咪的技能',
    pending: { phase: 'authoring-clarification', question: 'q', originalMessage: 'om' },
  });
  assert.equal(r.responseChannel, 'skill.authoring');
});

test('技能会话门面：getPending 优先返回生命周期挂起项，无则回落创作挂起项', async () => {
  const { runtime, sessionStore } = make();
  assert.equal(runtime.getPending(), null);
  sessionStore.pending = { targetKind: 'agent-skill-authoring', phase: 'x' };
  // 创作链的 getPending 也被同一 store 驱动，因此这里读到的就是当前挂起项
  assert.deepEqual(runtime.getPending(), { targetKind: 'agent-skill-authoring', phase: 'x' });
  sessionStore.pending = { targetKind: AGENT_SKILL_LIFECYCLE_TARGET_KIND, phase: 'delete-confirmation' };
  assert.equal(runtime.getPending().targetKind, AGENT_SKILL_LIFECYCLE_TARGET_KIND);
});

test('技能会话门面：创作链缺 author 或 saveSkill 时整条链不命中，由上层继续处理', async () => {
  const { runtime } = make({ author: null });
  // 创作链的 matches 以 isAvailable()（author 与 saveSkill 都是函数）为前置门槛，
  // 因此缺少任一依赖时门面直接返回 null，而不是产出 SKILL_AUTHORING_UNAVAILABLE 回复。
  assert.equal(await runtime.handle({ message: '帮我创建一个技能', runId: 'r' }), null);
});

test('技能会话门面：构造参数全缺时生命周期链仍会接管停用意图并追问，其余交回上层', async () => {
  const runtime = createAgentSkillConversationRuntime();
  assert.equal(runtime.getPending(), null);
  assert.deepEqual(await runtime.handle({ message: '停用技能' }), {
    ok: true,
    status: 'need_clarification',
    reply: '请指定要停用的 Skill，例如回复“$skill-id”。',
    responseChannel: 'skill.lifecycle',
    question: '请指定要停用的 Skill，例如回复“$skill-id”。',
    options: [],
  });
  assert.equal(await runtime.handle({ message: '今天天气不错' }), null);
});
