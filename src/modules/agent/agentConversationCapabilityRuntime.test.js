import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentConversationCapabilityRuntime } from './agentConversationCapabilityRuntime.js';

const SKILL = {
  id: 'brand-tone',
  title: '品牌口吻',
  source: 'installed',
  enabled: true,
  description: '统一品牌语气',
  triggers: ['语气'],
  instructions: '按品牌语气输出',
};

function make(over = {}) {
  const traces = [];
  const pushes = [];
  const runs = [];
  const calls = { saveSkill: 0, deleteSkill: [], setSkillEnabled: [], execute: [] };
  const memory = { brandVoice: [], preferredModels: [], namingRules: [], preferences: [] };
  const sessionStore = {
    pending: null,
    getHistory: () => [],
    getActiveConversation: () => ({ id: 'c1' }),
    getCurrentRun: () => ({ id: 'r1', status: 'planning' }),
    recordTrace: (event) => traces.push(event),
    pushHistory: (entry) => pushes.push(entry),
    setCurrentRun: (entry) => runs.push(entry),
    recordRunEvent: () => {},
    getPendingClarification: () => sessionStore.pending,
    setPendingClarification: (clarification) => (sessionStore.pending = clarification),
    clearPendingClarification: () => (sessionStore.pending = null),
  };
  const projectMemoryStore =
    over.projectMemoryStore === null
      ? null
      : {
          getMemory: () => memory,
          remember: (records) => (
            records.forEach((record) => memory[record.category].push(record.value)),
            { added: records, memory }
          ),
          forget: () => ({ removed: 0, memory }),
          clearMemory: () => ((memory.brandVoice.length = 0), { memory }),
        };
  const capability = createAgentConversationCapabilityRuntime({
    sessionStore,
    skillRegistry: { listSkills: () => (over.noSkills ? [] : [SKILL]) },
    author: over.noAuthor ? null : async () => ({ name: 'brand-tone', instructions: '按品牌语气输出' }),
    saveSkill: over.noAuthor ? null : async () => ({ ok: true, skill: SKILL, saved: ++calls.saveSkill }),
    deleteSkill: (input) => (calls.deleteSkill.push(input), { success: true }),
    setSkillEnabled: (...args) => (calls.setSkillEnabled.push(args), true),
    projectMemoryStore,
    externalToolRegistry: {
      has: () => true,
      execute: (input) => (
        calls.execute.push(input),
        { ok: true, toolId: input.toolId, result: { text: '附件正文' } }
      ),
    },
    localeProvider: () => 'zh-CN',
    isActiveRun: () => true,
  });
  return { capability, sessionStore, traces, pushes, runs, calls, memory };
}

test('对话能力运行时：只暴露三个能力入口', () => {
  const { capability } = make();
  assert.deepEqual(Object.keys(capability), [
    'getPendingSkillConversation',
    'handleCommand',
    'prepareExternalInformation',
  ]);
});

test('对话能力运行时：普通创作请求两条能力链都不接管', async () => {
  const { capability, traces, pushes } = make();
  assert.equal(await capability.handleCommand({ message: '帮我画一只猫', runId: 'r1' }), null);
  assert.deepEqual(traces, []);
  assert.deepEqual(pushes, []);
});

test('对话能力运行时：缺参数时按不接管处理且不抛错', async () => {
  const { capability } = make();
  assert.equal(await capability.handleCommand(), null);
});

test('对话能力运行时：项目记忆写入会记路由、回写历史并推进运行态', async () => {
  const { capability, traces, pushes, memory } = make();
  const result = await capability.handleCommand({ message: '记住：品牌语气年轻直接', runId: 'r7' });
  assert.deepEqual(result, {
    ok: true,
    status: 'success',
    reply: '已记入当前项目长期记忆：品牌语气：年轻直接。',
    responseChannel: 'project.memory',
    projectMemory: {
      brandVoice: ['年轻直接'],
      preferredModels: [],
      namingRules: [],
      preferences: [],
    },
  });
  assert.deepEqual(traces, [
    { type: 'agent_turn_routed', channel: 'project.memory', reason: 'project-memory-remember' },
  ]);
  assert.deepEqual(pushes, [{ role: 'assistant', status: 'success', content: result.reply, turnId: 'r7' }]);
  assert.deepEqual(memory.brandVoice, ['年轻直接']);
});

test('对话能力运行时：记忆为空时查看给出引导话术', async () => {
  const { capability } = make();
  const result = await capability.handleCommand({ message: '查看项目记忆', runId: 'r1' });
  assert.equal(result.responseChannel, 'project.memory');
  assert.equal(result.reply, '当前项目还没有长期记忆。你可以说“记住：品牌语气年轻直接”。');
});

test('对话能力运行时：清空记忆走清除分支', async () => {
  const { capability, memory } = make();
  await capability.handleCommand({ message: '记住：品牌语气年轻直接', runId: 'r1' });
  const result = await capability.handleCommand({ message: '清空项目记忆', runId: 'r1' });
  assert.equal(result.reply, '已清空当前项目长期记忆。');
  assert.deepEqual(memory.brandVoice, []);
});

test('对话能力运行时：无项目记忆仓库时记忆链不接管，技能链仍可用', async () => {
  const { capability } = make({ projectMemoryStore: null });
  assert.equal(await capability.handleCommand({ message: '记住：品牌语气年轻直接', runId: 'r1' }), null);
  const result = await capability.handleCommand({ message: '停用品牌口吻', runId: 'r1' });
  assert.equal(result.responseChannel, 'skill.lifecycle');
  assert.equal(result.ok, true);
});

test('对话能力运行时：技能链优先于项目记忆链，命中后不再回退', async () => {
  const { capability, traces, memory } = make();
  const result = await capability.handleCommand({
    message: '停用技能并记住：品牌语气年轻直接',
    runId: 'r1',
  });
  assert.equal(result.responseChannel, 'skill.lifecycle');
  assert.equal(result.status, 'need_clarification');
  assert.equal(result.reply, '请指定要停用的 Skill，例如回复“$brand-tone”。');
  assert.deepEqual(traces, [
    { type: 'agent_turn_routed', channel: 'skill.lifecycle', reason: 'skill-lifecycle-disable' },
  ]);
  assert.deepEqual(memory.brandVoice, []);
});

test('对话能力运行时：技能缺依赖时技能链不接管，请求整体交回上层', async () => {
  const { capability, traces } = make({ noAuthor: true });
  assert.equal(await capability.handleCommand({ message: '创建一个技能', runId: 'r1' }), null);
  assert.deepEqual(traces, []);
});

test('对话能力运行时：待确认对象会直接路由回技能链，忽略项目记忆意图', async () => {
  const { capability, sessionStore, memory, traces } = make();
  const first = await capability.handleCommand({ message: '删除品牌口吻', runId: 'r1' });
  assert.equal(first.status, 'need_clarification');
  assert.equal(sessionStore.pending.phase, 'delete-confirmation');
  assert.equal(sessionStore.pending.skillId, 'brand-tone');
  const result = await capability.handleCommand({
    message: '记住：品牌语气年轻直接',
    pendingSkillConversation: sessionStore.pending,
    runId: 'r2',
  });
  assert.equal(result.responseChannel, 'skill.lifecycle');
  assert.equal(result.status, 'need_clarification');
  assert.equal(result.reply, first.reply);
  assert.deepEqual(memory.brandVoice, []);
  assert.deepEqual(traces, [
    { type: 'agent_turn_routed', channel: 'skill.lifecycle', reason: 'skill-lifecycle-delete' },
  ]);
});

test('对话能力运行时：确认删除会复用注入的 deleteSkill 并清空待确认态', async () => {
  const { capability, sessionStore, calls } = make();
  await capability.handleCommand({ message: '删除品牌口吻', runId: 'r1' });
  const result = await capability.handleCommand({
    message: '确认删除',
    pendingSkillConversation: capability.getPendingSkillConversation(),
    runId: 'r2',
  });
  assert.equal(result.responseChannel, 'skill.lifecycle');
  assert.equal(result.reply, '已删除 Skill「品牌口吻」（$brand-tone）。');
  assert.deepEqual(calls.deleteSkill, [{ id: 'brand-tone', confirmed: true }]);
  assert.equal(sessionStore.pending, null);
});

test('对话能力运行时：待确认态只能用 pendingSkillConversation 传入，写成 pending 会被记忆链截走', async () => {
  const { capability, memory } = make();
  await capability.handleCommand({ message: '删除品牌口吻', runId: 'r1' });
  const wrong = await capability.handleCommand({
    message: '记住：品牌语气年轻直接',
    pending: capability.getPendingSkillConversation(),
    runId: 'r2',
  });
  assert.equal(wrong.responseChannel, 'project.memory');
  assert.deepEqual(memory.brandVoice, ['年轻直接']);
});

test('对话能力运行时：技能操作会复用注入的开关回调', async () => {
  const { capability, calls } = make();
  const result = await capability.handleCommand({ message: '停用品牌口吻', runId: 'r1' });
  assert.equal(result.reply, '已停用 Skill「品牌口吻」（$brand-tone）。');
  assert.equal(result.skillId, 'brand-tone');
  assert.equal(result.enabled, false);
  assert.deepEqual(calls.setSkillEnabled, [['brand-tone', false]]);
});

test('对话能力运行时：getPendingSkillConversation 代理技能链待确认态', async () => {
  const { capability, sessionStore } = make();
  assert.equal(capability.getPendingSkillConversation(), null);
  await capability.handleCommand({ message: '删除品牌口吻', runId: 'r1' });
  assert.equal(capability.getPendingSkillConversation(), sessionStore.pending);
  sessionStore.pending = { targetKind: 'agent-skill-authoring', foo: 1 };
  const passthrough = capability.getPendingSkillConversation();
  assert.equal(passthrough?.targetKind, 'agent-skill-authoring');
  assert.equal(passthrough?.foo, 1);
});

test('对话能力运行时：外部信息准备直接代理外部工具仓库', async () => {
  const { capability, calls } = make();
  assert.equal(await capability.prepareExternalInformation({ message: '帮我画一只猫' }), null);
  const result = await capability.prepareExternalInformation({
    message: '看下附件内容',
    documentFiles: [{ name: 'spec.pdf' }],
    signal: null,
  });
  assert.equal(result.reason, 'attached-document');
  assert.deepEqual(
    calls.execute.map((entry) => entry.args.file.name),
    ['spec.pdf'],
  );
});
