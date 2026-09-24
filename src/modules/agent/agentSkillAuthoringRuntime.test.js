import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentSkillAuthoringRuntime } from './agentSkillAuthoringRuntime.js';
import { AGENT_SKILL_AUTHORING_TARGET_KIND } from './agentSkillAuthoring.js';

function makeStore(over = {}) {
  const s = {
    history: [],
    traces: [],
    pending: over.pending ?? null,
    runs: [],
    getHistory: () => s.history,
    pushHistory: (entry) => s.history.push(entry),
    recordTrace: (t) => s.traces.push(t),
    setPendingClarification: (p) => (s.pending = p),
    clearPendingClarification: () => (s.pending = null),
    getPendingClarification: () => s.pending,
    setCurrentRun: (r) => s.runs.push(r),
  };
  return s;
}

const ready = (id = 'my-skill', title = 'My') => ({
  status: 'ready',
  definition: { id, title, description: 'd', triggers: ['t'], instructions: 'i' },
});

function makeRuntime(over = {}) {
  const sessionStore = makeStore(over);
  const calls = [];
  const saves = [];
  const runtime = createAgentSkillAuthoringRuntime({
    sessionStore,
    skillRegistry: 'skillRegistry' in over ? over.skillRegistry : { listSkills: () => over.skills ?? [] },
    author: 'author' in over ? over.author : async (payload) => (calls.push(payload), over.draft ?? ready()),
    saveSkill:
      'saveSkill' in over
        ? over.saveSkill
        : async (definition) => {
            saves.push(definition);
            return { success: true };
          },
    localeProvider: over.localeProvider ?? (() => over.locale ?? 'zh-CN'),
    isActiveRun: over.isActiveRun,
  });
  return { runtime, sessionStore, calls, saves };
}

test('创作运行时：只暴露 isAvailable / matches / getPending / run / answer 五个入口', () => {
  const { runtime } = makeRuntime();
  assert.deepEqual(Object.keys(runtime), ['isAvailable', 'matches', 'getPending', 'run', 'answer']);
});

test('创作运行时：isAvailable 同时要求 author 与 saveSkill 为函数，缺一即不可用', () => {
  const store = makeStore();
  const both = createAgentSkillAuthoringRuntime({
    sessionStore: store,
    author: () => ({}),
    saveSkill: async () => ({}),
  });
  const noSave = createAgentSkillAuthoringRuntime({ sessionStore: store, author: () => ({}) });
  const noAuthor = createAgentSkillAuthoringRuntime({ sessionStore: store, saveSkill: async () => ({}) });
  const empty = createAgentSkillAuthoringRuntime({});
  assert.deepEqual(
    [both.isAvailable(), noSave.isAvailable(), noAuthor.isAvailable(), empty.isAvailable()],
    [true, false, false, false],
  );
});

test('创作运行时：matches 在非可用状态直接判否，可用时透传意图判定', () => {
  const store = makeStore();
  const off = createAgentSkillAuthoringRuntime({ sessionStore: store });
  const on = createAgentSkillAuthoringRuntime({
    sessionStore: store,
    author: () => ({}),
    saveSkill: async () => ({}),
  });
  assert.equal(off.matches('帮我创建一个技能'), false);
  assert.equal(on.matches('帮我创建一个技能'), true);
  assert.equal(on.matches('把画布变成红色'), false);
});

test('创作运行时：意图词表覆盖中英两种语序，问句与否定式排除', () => {
  const { runtime } = makeRuntime();
  const results = {};
  for (const message of [
    '帮我创建一个技能',
    '新建一个 Skill',
    'create a skill',
    'build skill 一下',
    '技能新建',
    '不要创建技能',
    '如何创建技能',
    'how to create a skill',
    '今天天气',
  ]) {
    results[message] = runtime.matches(message);
  }
  assert.deepEqual(results, {
    帮我创建一个技能: true,
    '新建一个 Skill': true,
    'create a skill': true,
    'build skill 一下': true,
    技能新建: true,
    不要创建技能: false,
    如何创建技能: false,
    'how to create a skill': false,
    今天天气: false,
  });
});

test('创作运行时：run 成功后写历史 + 当前 run + 两条 trace，并把定义原样交给 saveSkill', async () => {
  const { runtime, sessionStore, calls, saves } = makeRuntime();
  const r = await runtime.run({ message: '创建一个技能', runId: 'r1' });
  assert.deepEqual(r, {
    ok: true,
    status: 'success',
    reply: '已创建 Skill「My」（$my-skill）。现在可以直接说“用 $my-skill …”来使用。',
    skill: {
      mode: 'create',
      id: 'my-skill',
      title: 'My',
      description: 'd',
      triggers: ['t'],
      instructions: 'i',
    },
    responseChannel: 'skill.authoring',
  });
  assert.deepEqual(sessionStore.history, [
    { role: 'assistant', status: 'success', content: r.reply, turnId: 'r1' },
  ]);
  assert.deepEqual(sessionStore.runs, [{ id: 'r1', status: 'success', stopped: false }]);
  assert.deepEqual(
    sessionStore.traces.map((t) => t.type),
    ['agent_turn_routed', 'agent_skill_created'],
  );
  assert.deepEqual(sessionStore.traces[0], {
    type: 'agent_turn_routed',
    channel: 'skill.authoring',
    reason: 'skill-authoring-request',
  });
  assert.deepEqual(Object.keys(calls[0]), [
    'operation',
    'message',
    'originalMessage',
    'clarificationAnswer',
    'history',
    'existingSkills',
    'signal',
    'onTrace',
  ]);
  assert.equal(calls[0].operation, 'create');
  assert.deepEqual(saves, [r.skill]);
});

test('创作运行时：originalMessage 缺省时回落到 message，续答时 reason 变体', async () => {
  const { runtime, sessionStore, calls } = makeRuntime();
  await runtime.run({ message: 'm', clarificationAnswer: 'ans' });
  assert.equal(calls[0].originalMessage, 'm');
  assert.equal(calls[0].clarificationAnswer, 'ans');
  assert.equal(sessionStore.traces[0].reason, 'skill-authoring-continuation');
});

test('创作运行时：id 撞车时自动加序号并留 trace，saveSkill 收到的是修复后的 id', async () => {
  const { runtime, sessionStore, saves } = makeRuntime({
    skills: [{ id: 'my-skill', title: 'X' }, { id: 'other' }],
  });
  const r = await runtime.run({ message: 'm' });
  assert.equal(r.skill.id, 'my-skill-2');
  assert.deepEqual(
    sessionStore.traces.map((t) => t.type),
    ['agent_turn_routed', 'agent_skill_duplicate_id_repaired', 'agent_skill_created'],
  );
  assert.deepEqual(sessionStore.traces[1], {
    type: 'agent_skill_duplicate_id_repaired',
    requestedId: 'my-skill',
    skillId: 'my-skill-2',
  });
  assert.equal(saves[0].id, 'my-skill-2');
});

test('创作运行时：existingSkills 目录按 listSkills→listCatalog 兜底，只留 id/title 且 title 截 120、条目截 100', async () => {
  const { runtime, calls } = makeRuntime({
    skillRegistry: {
      listCatalog: () =>
        [{ id: 'keep', title: 'K'.repeat(300) }, { id: '  ' }, { title: 'noId' }].concat(
          Array.from({ length: 200 }, (_, i) => ({ id: 's' + i })),
        ),
    },
  });
  await runtime.run({ message: 'm' });
  const existing = calls[0].existingSkills;
  assert.equal(existing.length, 100);
  assert.deepEqual(Object.keys(existing[0]), ['id', 'title']);
  assert.equal(existing[0].id, 'keep');
  assert.equal(existing[0].title.length, 120);
  assert.equal(existing[0].title, 'K'.repeat(120));
});

test('创作运行时：existingSkills 是硬切片（无省略号），payload.history 直接共享会话历史数组', async () => {
  const { runtime, calls, sessionStore } = makeRuntime({ skillRegistry: null });
  sessionStore.history.push({ role: 'user', content: 'prev' });
  await runtime.run({ message: 'm' });
  assert.deepEqual(calls[0].existingSkills, []);
  assert.equal(calls[0].history, sessionStore.history);
  assert.equal(sessionStore.history.length, 2);
});

test('创作运行时：need_clarification 会写入带 targetKind 的挂起项并返回 ok=true', async () => {
  const { runtime, sessionStore } = makeRuntime({
    draft: { status: 'need_clarification', question: 'Q?', options: ['a', 'b'] },
  });
  const r = await runtime.run({ message: 'm', originalMessage: 'orig', runId: 'r1' });
  assert.deepEqual(r, {
    ok: true,
    status: 'need_clarification',
    reply: 'Q?',
    question: 'Q?',
    options: ['a', 'b'],
    responseChannel: 'skill.authoring',
  });
  assert.deepEqual(sessionStore.pending, {
    originalMessage: 'orig',
    question: 'Q?',
    reply: 'Q?',
    options: ['a', 'b'],
    targetKind: AGENT_SKILL_AUTHORING_TARGET_KIND,
  });
  assert.equal(sessionStore.history[0].status, 'need_clarification');
  assert.equal(sessionStore.history[0].content, 'Q?');
});

test('创作运行时：挂起项 targetKind 不匹配时 getPending 与 answer 双双落空', async () => {
  const { runtime, sessionStore } = makeRuntime();
  sessionStore.pending = { targetKind: 'something-else', originalMessage: 'o' };
  assert.equal(runtime.getPending(), null);
  assert.equal(await runtime.answer({ answer: 'x' }), null);
});

test('创作运行时：answer 命中取消语直接 cancelled 并落历史，但不清挂起项', async () => {
  const { runtime, sessionStore } = makeRuntime();
  const r = await runtime.answer({
    answer: '取消',
    pending: { targetKind: AGENT_SKILL_AUTHORING_TARGET_KIND, originalMessage: 'o' },
    runId: 'r7',
  });
  assert.deepEqual(r, {
    ok: true,
    status: 'cancelled',
    reply: '已取消创建 Skill。',
    responseChannel: 'skill.authoring',
  });
  assert.deepEqual(sessionStore.history, [
    { role: 'assistant', status: 'cancelled', content: '已取消创建 Skill。', turnId: 'r7' },
  ]);
});

test('创作运行时：answer 续答时把答案同时作为 message 与 clarificationAnswer 下传', async () => {
  const { runtime, calls } = makeRuntime();
  await runtime.answer({
    answer: '一个做笔记的技能',
    pending: { targetKind: AGENT_SKILL_AUTHORING_TARGET_KIND, originalMessage: 'orig' },
    runId: 'r1',
  });
  assert.deepEqual(
    [calls[0].message, calls[0].clarificationAnswer, calls[0].originalMessage],
    ['一个做笔记的技能', '一个做笔记的技能', 'orig'],
  );
  assert.equal(calls[0].signal, null);
});

test('创作运行时：模型返回失败态时 reply 直接用模型 message（英文原文照抄）', async () => {
  const { runtime, sessionStore } = makeRuntime({
    draft: { status: 'failed', errorCode: 'X', reply: 'boom' },
  });
  assert.deepEqual(await runtime.run({ message: 'm', runId: 'r1' }), {
    ok: false,
    status: 'failed',
    reply: 'boom',
    errorCode: 'X',
    responseChannel: 'skill.authoring',
  });
  assert.deepEqual(sessionStore.runs, [{ id: 'r1', status: 'failed', stopped: false }]);
});

test('创作运行时：author 抛异常时 errorCode 固定 SKILL_AUTHORING_FAILED，reply 是原始异常 message', async () => {
  const { runtime } = makeRuntime({
    author: async () => {
      throw new Error('net down');
    },
  });
  assert.deepEqual(await runtime.run({ message: 'm' }), {
    ok: false,
    status: 'failed',
    reply: 'net down',
    errorCode: 'SKILL_AUTHORING_FAILED',
    responseChannel: 'skill.authoring',
  });
});

test('创作运行时：author 非函数时兜底文案未被本地化，直接透出英文', async () => {
  const { runtime } = makeRuntime({ author: null });
  const r = await runtime.run({ message: 'm' });
  assert.deepEqual(
    [r.status, r.errorCode, r.reply],
    ['failed', 'SKILL_AUTHORING_UNAVAILABLE', 'Skill authoring is unavailable.'],
  );
});

test('创作运行时：isActiveRun 为假时两处闸门都返回 stopped 且不落历史', async () => {
  const first = makeRuntime({ isActiveRun: () => false });
  assert.deepEqual(await first.runtime.run({ message: 'm', runId: 'r9' }), {
    ok: false,
    status: 'stopped',
    reply: 'Skill 创建已停止。',
    responseChannel: 'skill.authoring',
  });
  assert.deepEqual([first.sessionStore.history, first.sessionStore.runs], [[], []]);
  const seen = [];
  const lateRuntime = createAgentSkillAuthoringRuntime({
    sessionStore: makeStore(),
    author: async () => ready('late'),
    saveSkill: async (definition) => {
      seen.push(definition.id);
      return { success: true };
    },
    isActiveRun: (runId) => runId !== 'stale',
  });
  assert.equal((await lateRuntime.run({ message: 'm', runId: 'stale' })).status, 'stopped');
  assert.deepEqual(seen, []);
  assert.equal((await lateRuntime.run({ message: 'm', runId: 'fresh' })).status, 'success');
  assert.deepEqual(seen, ['late']);
});

test('创作运行时：保存撞 SKILL_ALREADY_INSTALLED 时换 id 重试一次，二次仍失败才报错', async () => {
  let n = 0;
  const { runtime, sessionStore, saves } = makeRuntime({
    saveSkill: async (definition) => {
      n += 1;
      saves.push(definition.id);
      return n === 1 ? { success: false, errorCode: 'SKILL_ALREADY_INSTALLED' } : { success: true };
    },
  });
  const r = await runtime.run({ message: 'm' });
  assert.deepEqual([r.status, r.skill.id], ['success', 'my-skill-2']);
  assert.deepEqual(saves, ['my-skill', 'my-skill-2']);
  assert.deepEqual(
    sessionStore.traces.map((t) => t.type),
    ['agent_turn_routed', 'agent_skill_duplicate_id_repaired', 'agent_skill_created'],
  );
  assert.deepEqual(sessionStore.traces[1], {
    type: 'agent_skill_duplicate_id_repaired',
    requestedId: 'my-skill',
    skillId: 'my-skill-2',
    reason: 'save-race',
  });
});

test('创作运行时：保存返回 success!==true 时按 errorCode 选文案，未知码回落通用失败', async () => {
  const table = {
    SKILL_ALREADY_INSTALLED:
      'Skill「$my-skill-2」已经存在，我没有覆盖它。可以换一个名称，或在 Skill 管理中编辑现有版本。',
    SKILL_SAVE_UNAVAILABLE: '当前无法保存 Skill，请确认正在桌面版中运行并重试。',
    SKILL_REFRESH_AFTER_SAVE_FAILED: 'Skill 已保存，但列表刷新失败。请打开 Skill 管理器点击刷新。',
    WHATEVER: 'Skill 创建失败，请重试。',
  };
  for (const [errorCode, expected] of Object.entries(table)) {
    const { runtime } = makeRuntime({ saveSkill: async () => ({ success: false, errorCode }) });
    const r = await runtime.run({ message: 'm' });
    assert.deepEqual([r.ok, r.status, r.errorCode, r.reply], [false, 'failed', errorCode, expected]);
  }
  const { runtime } = makeRuntime({ saveSkill: async () => ({ success: false }) });
  assert.equal((await runtime.run({ message: 'm' })).errorCode, 'SKILL_SAVE_FAILED');
});

test('创作运行时：保存阶段抛异常统一记为 SKILL_SAVE_FAILED 且不透出异常原文', async () => {
  const { runtime, sessionStore } = makeRuntime({
    saveSkill: async () => {
      throw new Error('disk full');
    },
  });
  const r = await runtime.run({ message: 'm' });
  assert.deepEqual(
    [r.status, r.errorCode, r.reply],
    ['failed', 'SKILL_SAVE_FAILED', 'Skill 创建失败，请重试。'],
  );
  assert.equal(sessionStore.history[0].turnId, '');
});

test('创作运行时：成功路径清掉挂起项，失败路径保留', async () => {
  const ok = makeRuntime({ pending: { targetKind: AGENT_SKILL_AUTHORING_TARGET_KIND } });
  await ok.runtime.run({ message: 'm' });
  assert.equal(ok.sessionStore.pending, null);
  const bad = makeRuntime({
    pending: { targetKind: AGENT_SKILL_AUTHORING_TARGET_KIND },
    saveSkill: async () => ({ success: false }),
  });
  await bad.runtime.run({ message: 'm' });
  assert.notEqual(bad.sessionStore.pending, null);
});

test('创作运行时：locale 以 en 前缀判英文，其余一律中文；取文案发生在成功分支', async () => {
  const en = makeRuntime({ locale: 'en-US' });
  assert.equal(
    (await en.runtime.run({ message: 'm' })).reply,
    'Created Skill “My” ($my-skill). You can now say “Use $my-skill …”.',
  );
  for (const locale of ['en', 'EN', 'en-GB', 'english']) {
    const r = makeRuntime({ localeProvider: () => locale });
    assert.ok((await r.runtime.run({ message: 'm' })).reply.startsWith('Created'), locale);
  }
  for (const locale of ['zh-CN', 'zh-TW', 'fr-FR', '']) {
    const r = makeRuntime({ localeProvider: () => locale });
    assert.ok((await r.runtime.run({ message: 'm' })).reply.startsWith('已创建'), locale);
  }
  const thrown = makeRuntime({
    localeProvider: () => {
      throw new Error('boom');
    },
  });
  await assert.rejects(() => thrown.runtime.run({ message: 'm' }), /boom/);
});

test('创作运行时：localeProvider 缺省时按 zh-CN 出文案，sessionStore 缺席也不抛', async () => {
  const bare = createAgentSkillAuthoringRuntime({
    author: async () => ready('x1', 'T'),
    saveSkill: async (d) => ({ success: true, ...d }),
  });
  const r = await bare.run({ message: 'm' });
  assert.deepEqual(
    [r.status, r.skill.id, r.reply],
    ['success', 'x1', '已创建 Skill「T」（$x1）。现在可以直接说“用 $x1 …”来使用。'],
  );
});

test('创作运行时：无 sessionStore 时 trace/历史全部静默丢弃，结果仍然成功', async () => {
  const rt = createAgentSkillAuthoringRuntime({
    author: async (payload) => {
      assert.deepEqual(payload.history, []);
      return ready('z', 'Z');
    },
    saveSkill: async () => ({ success: true }),
  });
  assert.equal((await rt.run({ message: 'm' })).status, 'success');
});
