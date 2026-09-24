import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentSkillLifecycleRuntime } from './agentSkillLifecycleRuntime.js';
import { AGENT_SKILL_LIFECYCLE_TARGET_KIND } from './agentSkillLifecycle.js';

function makeStore(pending = null) {
  const s = {
    history: [],
    traces: [],
    pending,
    getHistory: () => s.history,
    pushHistory: (entry) => s.history.push(entry),
    recordTrace: (t) => s.traces.push(t),
    setPendingClarification: (p) => (s.pending = p),
    clearPendingClarification: () => (s.pending = null),
    getPendingClarification: () => s.pending,
    setCurrentRun: () => {},
  };
  return s;
}

const SKILLS = () => [
  {
    id: 'cat-fact',
    title: '猫咪趣闻',
    description: '讲猫',
    triggers: ['猫'],
    instructions: 'i1',
    source: 'installed',
    managedBy: 'shuo-canvas',
    enabled: true,
  },
  {
    id: 'dog-fact',
    title: '狗狗趣闻',
    description: '讲狗',
    triggers: [],
    instructions: '',
    source: 'installed',
    managedBy: 'shuo-canvas',
    enabled: false,
  },
  { id: 'foreign', title: '外部包', source: 'installed', managedBy: 'someone-else' },
  { id: 'bare', source: 'installed' },
  { id: 'vendor-skill', title: 'Vendor', source: 'vendor', managedBy: 'shuo-canvas' },
];

const readyDraft = (id = 'cat-fact', title = '新猫咪') => ({
  status: 'ready',
  definition: { id, title, description: 'd', triggers: ['t'], instructions: 'i' },
});

function make(over = {}) {
  const sessionStore = makeStore(over.pending);
  const calls = [];
  const saves = [];
  const deletes = [];
  const enabledCalls = [];
  const skills = over.skills ?? SKILLS();
  const registry =
    'registry' in over ? over.registry : { listSkills: () => skills, ...(over.registryExtras ?? {}) };
  const runtime = createAgentSkillLifecycleRuntime({
    sessionStore,
    skillRegistry: registry,
    author:
      'author' in over ? over.author : async (payload) => (calls.push(payload), over.draft ?? readyDraft()),
    saveSkill:
      'saveSkill' in over
        ? over.saveSkill
        : async (definition) => {
            saves.push(definition);
            return { success: true };
          },
    deleteSkill:
      'deleteSkill' in over
        ? over.deleteSkill
        : async (arg) => {
            deletes.push(arg);
            return { success: true };
          },
    setSkillEnabled: over.setSkillEnabled,
    localeProvider: over.localeProvider ?? (() => over.locale ?? 'zh-CN'),
    isActiveRun: over.isActiveRun,
  });
  return { runtime, sessionStore, calls, saves, deletes, enabledCalls, skills };
}

const pendingFor = (over) => ({
  targetKind: AGENT_SKILL_LIFECYCLE_TARGET_KIND,
  question: 'Q',
  originalMessage: 'o',
  ...over,
});

test('生命周期运行时：四个入口 + getPending 的 targetKind 闸门', async () => {
  const { runtime, sessionStore } = make();
  assert.deepEqual(Object.keys(runtime), ['getPending', 'matches', 'run', 'answer']);
  sessionStore.pending = pendingFor({ phase: 'delete-confirmation' });
  assert.deepEqual(runtime.getPending(), sessionStore.pending);
  sessionStore.pending = { targetKind: 'agent-skill-authoring', phase: 'delete-confirmation' };
  assert.equal(runtime.getPending(), null);
  assert.equal(await runtime.answer({ answer: '确认删除' }), null);
  assert.equal(await runtime.answer({ answer: 'x', pending: null }), null);
});

test('生命周期运行时：matches 只看意图识别，不受 author / saveSkill 可用性影响', () => {
  const { runtime } = make({ author: null, saveSkill: null });
  assert.deepEqual(
    [
      runtime.matches('停用 cat-fact'),
      runtime.matches('今天天气'),
      runtime.matches('如何停用技能？'),
      runtime.matches('不要停用 cat-fact'),
      runtime.matches(''),
    ],
    [true, false, false, false, false],
  );
});

test('生命周期运行时：inspect 走纯读路径，不调模型不写盘', async () => {
  const { runtime, calls, saves, sessionStore } = make();
  const r = await runtime.run({ message: '查看 cat-fact 技能', runId: 'r7' });
  assert.deepEqual(r, {
    ok: true,
    status: 'success',
    reply: 'Skill「猫咪趣闻」（$cat-fact）\n状态：已启用\n描述：讲猫\n触发词：猫\n说明：\ni1',
    responseChannel: 'skill.lifecycle',
    skill: {
      id: 'cat-fact',
      title: '猫咪趣闻',
      description: '讲猫',
      triggers: ['猫'],
      instructions: 'i1',
      source: 'installed',
      editable: true,
      enabled: true,
    },
  });
  assert.deepEqual([calls.length, saves.length], [0, 0]);
  assert.deepEqual(
    sessionStore.traces.map((t) => t.type),
    ['agent_turn_routed'],
  );
  assert.deepEqual(sessionStore.history.at(-1), {
    role: 'assistant',
    status: 'success',
    content: r.reply,
    turnId: 'r7',
  });
});

test('生命周期运行时：inspect 的缺省字段用 - 占位，triggers 用顿号连接，enabled 缺省视为启用', async () => {
  const { runtime } = make();
  assert.equal(
    (await runtime.run({ message: '查看 dog-fact 详情', runId: 'r' })).reply,
    'Skill「狗狗趣闻」（$dog-fact）\n状态：已停用\n描述：讲狗\n触发词：-\n说明：\n-',
  );
  assert.equal(
    (await runtime.run({ message: '查看 bare 详情', runId: 'r' })).reply,
    'Skill「bare」（$bare）\n状态：已启用\n描述：-\n触发词：-\n说明：\n-',
  );
});

test('生命周期运行时：en-US 的 inspect 模板改用 \n 分隔与英文标签', async () => {
  const { runtime } = make({ locale: 'en-US' });
  const r = await runtime.run({ message: 'inspect cat-fact', runId: 'r' });
  assert.equal(
    r.reply,
    'Skill “猫咪趣闻” ($cat-fact)\nStatus: enabled\nDescription: 讲猫\nTriggers: 猫\nInstructions:\ni1',
  );
});

test('生命周期运行时：未识别意图一律返回 null（含问句与否定式）', async () => {
  const { runtime, sessionStore } = make();
  for (const message of ['今天天气', '如何停用技能', '不要删除 cat-fact', '']) {
    assert.equal(await runtime.run({ message }), null);
  }
  assert.equal(await runtime.run({ message: undefined }), null);
  assert.deepEqual(sessionStore.traces, []);
});

test('生命周期运行时：只有 $id 或 /id 形态才判 not_found，裸串匹配不到时改为追问', async () => {
  const { runtime } = make();
  assert.deepEqual(await runtime.run({ message: '查看 $ghost 技能', runId: 'r' }), {
    ok: false,
    status: 'failed',
    reply: '没有找到 Skill「$ghost」。请检查 ID 后重试。',
    responseChannel: 'skill.lifecycle',
    errorCode: 'SKILL_NOT_FOUND',
  });
  const r = await runtime.run({ message: '查看 nope-xyz 技能', originalMessage: 'om', runId: 'r' });
  assert.deepEqual(
    [r.status, r.question],
    ['need_clarification', '请指定要查看的 Skill，例如回复“$cat-fact”。'],
  );
});

test('生命周期运行时：目标缺失时写入 target-selection 挂起项，示例 id 取安装表首项', async () => {
  const { runtime, sessionStore } = make();
  await runtime.run({ message: '停用技能', operation: 'disable', originalMessage: 'om', runId: 'r' });
  assert.deepEqual(sessionStore.pending, {
    originalMessage: 'om',
    question: '请指定要停用的 Skill，例如回复“$cat-fact”。',
    reply: '请指定要停用的 Skill，例如回复“$cat-fact”。',
    options: [],
    targetKind: AGENT_SKILL_LIFECYCLE_TARGET_KIND,
    operation: 'disable',
    skillId: '',
    phase: 'target-selection',
  });
  assert.deepEqual(sessionStore.history.at(-1).status, 'need_clarification');
});

test('生命周期运行时：注册表缺席时示例 id 回落到字面量 skill-id，target 文案仍可用', async () => {
  for (const registry of [null, {}, { listSkills: () => null }]) {
    const { runtime } = make({ registry });
    const r = await runtime.run({ message: '停用技能', operation: 'enable' });
    assert.equal(r.question, '请指定要启用的 Skill，例如回复“$skill-id”。');
    assert.equal(r.options.length, 0);
  }
});

test('生命周期运行时：非 installed 来源根本进不了目标解析，只有 installed+外部 managedBy 触发只读', async () => {
  const { runtime } = make();
  assert.deepEqual(await runtime.run({ message: '修改 foreign 技能', operation: 'update' }), {
    ok: false,
    status: 'failed',
    reply: 'Skill「$foreign」是第三方导入包，不能通过对话修改或复制。',
    responseChannel: 'skill.lifecycle',
    errorCode: 'SKILL_NOT_EDITABLE',
  });
  assert.equal(
    (await runtime.run({ message: '修改 bare 技能', operation: 'update' })).errorCode,
    'SKILL_NOT_EDITABLE',
  );
  assert.equal(
    (await runtime.run({ message: '停用 vendor-skill', operation: 'disable' })).status,
    'need_clarification',
  );
  // 但 $id 形态只查安装表，vendor 条目直接判 not_found 而不是追问
  assert.deepEqual(await runtime.run({ message: '修改 $vendor-skill', operation: 'update' }), {
    ok: false,
    status: 'failed',
    reply: '没有找到 Skill「$vendor-skill」。请检查 ID 后重试。',
    responseChannel: 'skill.lifecycle',
    errorCode: 'SKILL_NOT_FOUND',
  });
});

test('生命周期运行时：enable / disable 默认回落到 registry.setSkillEnabled，缺方法时静默判失败', async () => {
  const withRegistry = make({ registryExtras: { setSkillEnabled: (id, value) => true } });
  const r = await withRegistry.runtime.run({ message: '启用 dog-fact', operation: 'enable', runId: 'r' });
  assert.deepEqual(r, {
    ok: true,
    status: 'success',
    reply: '已启用 Skill「狗狗趣闻」（$dog-fact）。',
    responseChannel: 'skill.lifecycle',
    skillId: 'dog-fact',
    enabled: true,
  });
  assert.equal(
    (await withRegistry.runtime.run({ message: '停用 cat-fact', operation: 'disable' })).enabled,
    false,
  );
  const broken = make();
  assert.deepEqual(await broken.runtime.run({ message: '启用 cat-fact', operation: 'enable' }), {
    ok: false,
    status: 'failed',
    reply: 'Skill 操作失败，请重试。',
    responseChannel: 'skill.lifecycle',
    errorCode: 'SKILL_ENABLE_STATE_FAILED',
  });
  const falsy = make({ setSkillEnabled: async () => false });
  assert.equal(
    (await falsy.runtime.run({ message: '启用 cat-fact', operation: 'enable' })).errorCode,
    'SKILL_ENABLE_STATE_FAILED',
  );
  const thrown = make({
    setSkillEnabled: async () => {
      throw new Error('locked');
    },
  });
  assert.equal(
    (await thrown.runtime.run({ message: '启用 cat-fact', operation: 'enable' })).errorCode,
    'SKILL_ENABLE_STATE_FAILED',
  );
});

test('生命周期运行时：delete 两段式确认，未确认时原样重问且保留挂起项', async () => {
  const { runtime, sessionStore, deletes } = make();
  const first = await runtime.run({
    message: '删除 cat-fact',
    operation: 'delete',
    originalMessage: 'om',
    runId: 'r',
  });
  assert.deepEqual(first.status, 'need_clarification');
  assert.deepEqual(sessionStore.pending, {
    originalMessage: 'om',
    question: first.question,
    reply: first.question,
    options: [],
    targetKind: AGENT_SKILL_LIFECYCLE_TARGET_KIND,
    operation: 'delete',
    skillId: 'cat-fact',
    phase: 'delete-confirmation',
  });
  const again = await runtime.answer({ answer: '也许吧', runId: 'r' });
  assert.deepEqual([again.status, again.reply], ['need_clarification', first.question]);
  assert.deepEqual(deletes, []);
  const yes = await runtime.answer({ answer: '确认删除', runId: 'r' });
  assert.deepEqual(yes, {
    ok: true,
    status: 'success',
    reply: '已删除 Skill「猫咪趣闻」（$cat-fact）。',
    responseChannel: 'skill.lifecycle',
    skillId: 'cat-fact',
  });
  assert.deepEqual(deletes, [{ id: 'cat-fact', confirmed: true }]);
  assert.equal(sessionStore.pending, null);
});

test('生命周期运行时：取消语优先于 phase 分派，并清掉挂起项', async () => {
  const { runtime, sessionStore, deletes } = make({
    pending: pendingFor({ phase: 'delete-confirmation', skillId: 'cat-fact' }),
  });
  const r = await runtime.answer({ answer: '取消', runId: 'r' });
  assert.deepEqual(r, {
    ok: true,
    status: 'cancelled',
    reply: '已取消 Skill 操作。',
    responseChannel: 'skill.lifecycle',
  });
  assert.deepEqual(deletes, []);
  assert.equal(sessionStore.pending, null);
});

test('生命周期运行时：target-selection 阶段的续答会带 operation 重新进 run，其它 phase 回落 run 兜底', async () => {
  const { runtime, sessionStore } = make({
    pending: pendingFor({ phase: 'target-selection', operation: 'inspect', skillId: '' }),
  });
  const r = await runtime.answer({ answer: 'cat-fact', runId: 'r' });
  assert.deepEqual([r.status, r.skill.id], ['success', 'cat-fact']);
  // inspect 分支不会清挂起项：只有写操作成功后才 clearPendingClarification
  assert.deepEqual(
    sessionStore.pending,
    pendingFor({ phase: 'target-selection', operation: 'inspect', skillId: '' }),
  );
});

test('生命周期运行时：delete-confirmation 下目标消失即 not_found，deleteSkill 缺席即 unavailable', async () => {
  const gone = make({ pending: pendingFor({ phase: 'delete-confirmation', skillId: 'ghost' }) });
  assert.equal((await gone.runtime.answer({ answer: '确认删除' })).errorCode, 'SKILL_NOT_FOUND');
  const unavailable = make({
    deleteSkill: null,
    pending: pendingFor({ phase: 'delete-confirmation', skillId: 'cat-fact' }),
  });
  assert.deepEqual(await unavailable.runtime.answer({ answer: '确认删除' }), {
    ok: false,
    status: 'failed',
    reply: '当前无法完成 Skill 操作，请确认正在桌面版中运行并重试。',
    responseChannel: 'skill.lifecycle',
    errorCode: 'SKILL_DELETE_UNAVAILABLE',
  });
});

test('生命周期运行时：删除失败码透传，抛异常记 SKILL_DELETE_FAILED，停跑后返回 stopped', async () => {
  const denied = make({
    deleteSkill: async () => ({ success: false, errorCode: 'SKILL_DELETE_DENIED' }),
    pending: pendingFor({ phase: 'delete-confirmation', skillId: 'cat-fact' }),
  });
  assert.equal((await denied.runtime.answer({ answer: '确认删除' })).errorCode, 'SKILL_DELETE_DENIED');
  const noCode = make({
    deleteSkill: async () => ({ success: false }),
    pending: pendingFor({ phase: 'delete-confirmation', skillId: 'cat-fact' }),
  });
  assert.equal((await noCode.runtime.answer({ answer: '确认删除' })).errorCode, 'SKILL_DELETE_FAILED');
  const thrown = make({
    deleteSkill: async () => {
      throw new Error('locked');
    },
    pending: pendingFor({ phase: 'delete-confirmation', skillId: 'cat-fact' }),
  });
  assert.equal((await thrown.runtime.answer({ answer: '确认删除' })).errorCode, 'SKILL_DELETE_FAILED');
  const stopped = make({
    deleteSkill: async () => ({ success: true }),
    isActiveRun: () => false,
    pending: pendingFor({ phase: 'delete-confirmation', skillId: 'cat-fact' }),
  });
  assert.equal((await stopped.runtime.answer({ answer: '确认删除' })).status, 'stopped');
  assert.deepEqual(
    stopped.sessionStore.history.map((h) => h.status),
    ['stopped'],
  );
});

test('生命周期运行时：update / clone 走创作闸门，author 或 saveSkill 缺失即 unavailable', async () => {
  for (const over of [{ author: null }, { saveSkill: null }, { author: null, saveSkill: null }]) {
    const { runtime } = make(over);
    assert.deepEqual(await runtime.run({ message: '修改 cat-fact', operation: 'update' }), {
      ok: false,
      status: 'failed',
      reply: '当前无法完成 Skill 操作，请确认正在桌面版中运行并重试。',
      responseChannel: 'skill.lifecycle',
      errorCode: 'SKILL_LIFECYCLE_UNAVAILABLE',
    });
  }
});

test('生命周期运行时：update 载荷带 targetSkill 与安装表摘要，id 被强制回写为目标 id', async () => {
  const { runtime, calls, sessionStore } = make({ draft: readyDraft('totally-other', 'T') });
  const r = await runtime.run({
    message: '把 cat-fact 讲得更短',
    operation: 'update',
    runId: 'r',
    signal: 'SIG',
  });
  assert.deepEqual(
    [calls[0].operation, calls[0].targetSkill.id, calls[0].signal],
    ['update', 'cat-fact', 'SIG'],
  );
  assert.deepEqual(calls[0].existingSkills, [
    { id: 'cat-fact', title: '猫咪趣闻' },
    { id: 'dog-fact', title: '狗狗趣闻' },
    { id: 'foreign', title: '外部包' },
    { id: 'bare', title: 'bare' },
  ]);
  assert.deepEqual(Object.keys(calls[0]), [
    'operation',
    'message',
    'originalMessage',
    'clarificationAnswer',
    'targetSkill',
    'history',
    'existingSkills',
    'signal',
    'onTrace',
  ]);
  assert.deepEqual([r.skill.id, r.skill.mode], ['cat-fact', 'update']);
  assert.deepEqual(
    sessionStore.traces.map((t) => t.type),
    ['agent_turn_routed', 'agent_skill_update_id_repaired'],
  );
  assert.equal(r.reply, '已更新 Skill「T」（$cat-fact），ID 保持不变。');
});

test('生命周期运行时：clone 走 create 模式并让 id 避让，同名 draft id 不追加序号', async () => {
  const same = make({ draft: readyDraft('cat-fact', '副本') });
  assert.equal(
    (await same.runtime.run({ message: '复制 cat-fact', operation: 'clone' })).skill.id,
    'cat-fact-2',
  );
  const other = make({ draft: readyDraft('brand-new', '副本') });
  const r = await other.runtime.run({ message: '复制 cat-fact', operation: 'clone' });
  assert.deepEqual([r.skill.id, r.skill.mode], ['brand-new', 'create']);
  assert.equal(r.reply, '已复制为 Skill「副本」（$brand-new）。');
});

test('生命周期运行时：clone 保存撞车时换 id 重试，update 撞车不重试', async () => {
  let n = 0;
  const clone = make({
    saveSkill: async (d) => {
      n += 1;
      return n === 1 ? { success: false, errorCode: 'SKILL_ALREADY_INSTALLED' } : { success: true };
    },
  });
  const r = await clone.runtime.run({ message: '复制 dog-fact', operation: 'clone' });
  assert.deepEqual([r.status, r.skill.id], ['success', 'cat-fact-3']);
  const update = make({ saveSkill: async () => ({ success: false, errorCode: 'SKILL_ALREADY_INSTALLED' }) });
  assert.deepEqual(await update.runtime.run({ message: '修改 dog-fact', operation: 'update' }), {
    ok: false,
    status: 'failed',
    reply: 'Skill 操作失败，请重试。',
    responseChannel: 'skill.lifecycle',
    errorCode: 'SKILL_ALREADY_INSTALLED',
  });
});

test('生命周期运行时：创作期 need_clarification 会记住 skillId 与 phase 以便续跑', async () => {
  const { runtime, sessionStore } = make({
    draft: { status: 'need_clarification', question: '改哪里？', options: ['a'] },
  });
  const r = await runtime.run({ message: '修改 cat-fact', operation: 'update', originalMessage: 'om' });
  assert.deepEqual([r.status, r.question, r.options], ['need_clarification', '改哪里？', ['a']]);
  assert.deepEqual(sessionStore.pending, {
    originalMessage: 'om',
    question: '改哪里？',
    reply: '改哪里？',
    // 挂起项里的 options 恒为空数组：模型给的候选项只回给 UI，不入库
    options: [],
    targetKind: AGENT_SKILL_LIFECYCLE_TARGET_KIND,
    operation: 'update',
    skillId: 'cat-fact',
    phase: 'authoring-clarification',
  });
  const next = make({ draft: readyDraft('cat-fact', 'V2') });
  next.sessionStore.pending = pendingFor({
    phase: 'authoring-clarification',
    skillId: 'cat-fact',
    operation: 'update',
  });
  const continued = await next.runtime.answer({ answer: '把描述改短', runId: 'r' });
  assert.deepEqual(
    [continued.status, next.calls[0].clarificationAnswer, next.calls[0].operation],
    ['success', '把描述改短', 'update'],
  );
  next.sessionStore.pending = pendingFor({
    phase: 'authoring-clarification',
    skillId: 'ghost',
    operation: 'update',
  });
  assert.equal((await next.runtime.answer({ answer: '改短' })).errorCode, 'SKILL_NOT_FOUND');
});

test('生命周期运行时：模型失败与异常原文都被当作 reply 透出，不做本地化', async () => {
  const failed = make({ draft: { status: 'failed', errorCode: 'NOPE', message: 'bad model output' } });
  assert.deepEqual(await failed.runtime.run({ message: '修改 cat-fact', operation: 'update' }), {
    ok: false,
    status: 'failed',
    reply: 'bad model output',
    responseChannel: 'skill.lifecycle',
    errorCode: 'NOPE',
  });
  const thrown = make({
    author: async () => {
      throw new Error('llm 500');
    },
  });
  const r = await thrown.runtime.run({ message: '修改 cat-fact', operation: 'update' });
  assert.deepEqual([r.reply, r.errorCode], ['llm 500', 'SKILL_AUTHORING_FAILED']);
});

test('生命周期运行时：未识别的 operation 字符串一律落到创作分支并按 create 保存', async () => {
  const { runtime, saves } = make();
  const r = await runtime.run({ message: '查看 cat-fact 技能', operation: 'frobnicate' });
  assert.deepEqual([r.status, r.skill.mode, saves[0].mode], ['success', 'create', 'create']);
  assert.equal(r.reply, '已复制为 Skill「新猫咪」（$cat-fact-2）。');
});

test('生命周期运行时：目标解析歧义时不猜，直接追问', async () => {
  const { runtime } = make({
    skills: [
      { id: 'a-b', title: '同名', source: 'installed', managedBy: 'shuo-canvas' },
      { id: 'c-d', title: '同名', source: 'installed', managedBy: 'shuo-canvas' },
    ],
  });
  const r = await runtime.run({ message: '停用 同名', operation: 'disable' });
  assert.deepEqual([r.status, r.question], ['need_clarification', '请指定要停用的 Skill，例如回复“$a-b”。']);
});

test('生命周期运行时：ok 位由 status 决定，stopped / failed 为假、其余为真', async () => {
  const { runtime } = make({ isActiveRun: () => false });
  assert.equal((await runtime.run({ message: '修改 cat-fact', operation: 'update' })).ok, false);
  const failing = make({ saveSkill: async () => ({ success: false }) });
  assert.equal((await failing.runtime.run({ message: '修改 cat-fact', operation: 'update' })).ok, false);
  const inspect = make();
  assert.equal((await inspect.runtime.run({ message: '查看 cat-fact', operation: 'inspect' })).ok, true);
});

test('生命周期运行时：locale 前缀判定与创作侧一致（en 前缀英文，其余中文）', async () => {
  for (const locale of ['en-US', 'EN', 'english']) {
    const { runtime } = make({ locale });
    assert.ok(
      (await runtime.run({ message: '查看 cat-fact', operation: 'inspect' })).reply.startsWith(
        'Skill “猫咪趣闻” ($cat-fact)\nStatus',
      ),
      locale,
    );
  }
  for (const locale of ['zh-CN', 'fr-FR', '']) {
    const { runtime } = make({ locale });
    assert.ok(
      (await runtime.run({ message: '查看 cat-fact', operation: 'inspect' })).reply.includes('状态：'),
      locale,
    );
  }
});

test('生命周期运行时：构造参数全缺也不抛，run 只会退化为追问，answer 恒为 null', async () => {
  const bare = createAgentSkillLifecycleRuntime({});
  assert.equal(bare.getPending(), null);
  // matches 只看意图：技能列表为空时，含「技能」的措辞依旧算命中
  assert.equal(bare.matches('停用技能'), true);
  assert.equal(bare.matches('今天天气'), false);
  // 没有注册表就解析不出目标，先追问而不是报 unavailable
  const a = await bare.run({ message: '停用技能', operation: 'disable' });
  assert.deepEqual(
    [a.status, a.question],
    ['need_clarification', '请指定要停用的 Skill，例如回复“$skill-id”。'],
  );
  const b = await bare.run({ message: '停用技能' });
  assert.equal(b.status, 'need_clarification');
  assert.equal(await bare.answer({ answer: '确认删除' }), null);
});
