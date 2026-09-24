import test from 'node:test';
import assert from 'node:assert/strict';

const mod = await import('./agentSkillRegistry.js');
const { normalizeRuntimeAgentSkill, createAgentSkillRegistryCore, agentSkillRegistryInternals } = mod;

const skillPackage = (name, description = '用于测试的技能', body = '执行步骤') => ({
  packageId: 'pkg-' + name,
  markdown: '---\nname: ' + name + '\ndescription: ' + description + '\n---\n' + body,
});

test('模块具名导出按字母序稳定', () => {
  assert.deepEqual(Object.keys(mod), [
    'agentSkillRegistryInternals',
    'createAgentSkillRegistryCore',
    'normalizeRuntimeAgentSkill',
  ]);
});

test('normalizeRuntimeAgentSkill：空对象即补齐全部默认值', () => {
  assert.deepEqual(normalizeRuntimeAgentSkill({}), {
    schemaVersion: 1,
    id: '',
    title: '',
    description: '',
    category: 'canvas',
    version: 'built-in',
    riskLevel: 'safe',
    appliesWhen: [],
    triggers: [],
    requiredInputs: [],
    missingInputQuestions: [],
    recommendedModelKind: '',
    defaultParams: {},
    commands: [],
    manualOnly: false,
    managedBy: '',
    instructions: '',
    source: 'built-in',
    packageId: '',
    resourceNames: [],
    resources: [],
    execution: { scriptsAvailable: false, scriptsEnabled: false },
  });
});

test('normalizeRuntimeAgentSkill：id 回落 name 并强制小写，title 回落 id', () => {
  const s = normalizeRuntimeAgentSkill({ name: 'My-Skill' });
  assert.equal(s.id, 'my-skill');
  assert.equal(s.title, 'My-Skill');
  // 只有 id（无 title/name 之外的标题）时标题等于原始 id 字符串。
  assert.equal(normalizeRuntimeAgentSkill({ id: 'ABC' }).id, 'abc');
  assert.equal(normalizeRuntimeAgentSkill({ id: 'ABC' }).title, 'ABC');
});

test('normalizeRuntimeAgentSkill：逐字段截断长度取自端口常量', () => {
  const long = 'x'.repeat(2000);
  const s = normalizeRuntimeAgentSkill({
    id: long,
    title: long,
    description: long,
    category: long,
    version: long,
    riskLevel: long,
    managedBy: long,
    source: long,
    packageId: long,
    recommendedModelKind: long,
    instructions: 'y'.repeat(30000),
  });
  assert.deepEqual(
    {
      id: s.id.length,
      title: s.title.length,
      description: s.description.length,
      category: s.category.length,
      version: s.version.length,
      riskLevel: s.riskLevel.length,
      managedBy: s.managedBy.length,
      source: s.source.length,
      packageId: s.packageId.length,
      recommendedModelKind: s.recommendedModelKind.length,
      instructions: s.instructions.length,
    },
    {
      id: 64,
      title: 120,
      description: 600,
      category: 80,
      version: 40,
      riskLevel: 20,
      managedBy: 80,
      source: 40,
      packageId: 100,
      recommendedModelKind: 40,
      instructions: 24576,
    },
  );
});

test('normalizeRuntimeAgentSkill：字符串数组去重、逐条截断、上限 40，且 null 元素被丢弃', () => {
  const s = normalizeRuntimeAgentSkill({
    triggers: ['a', 'a', '  b  ', null, '', 123, ...Array.from({ length: 50 }, (_, i) => 't' + i)],
    resourceNames: Array.from({ length: 40 }, (_, i) => 'r' + i),
  });
  assert.equal(s.triggers[0], 'a');
  assert.equal(s.triggers[1], 'b');
  assert.equal(s.triggers[2], '123');
  assert.equal(s.triggers.length, 40);
  assert.equal(new Set(s.triggers).size, 40);
  // resourceNames 上限来自第二个入参 0x18。
  assert.equal(s.resourceNames.length, 24);
  assert.deepEqual(normalizeRuntimeAgentSkill({ triggers: 'not-an-array' }).triggers, []);
});

test('normalizeRuntimeAgentSkill：resources 需 name 与 content 齐备，上限 24 条 / 16384 字符', () => {
  const s = normalizeRuntimeAgentSkill({
    resources: [
      { name: 'a', content: 'x' },
      { name: 'a', content: 'x' },
      { name: '', content: 'y' },
      { name: 'b', content: '' },
      { name: 'c', content: 'z'.repeat(20000) },
      ...Array.from({ length: 40 }, (_, i) => ({ name: 'n' + i, content: 'v' + i })),
    ],
  });
  assert.equal(s.resources.length, 24);
  assert.deepEqual(s.resources[0], { name: 'a', content: 'x' });
  assert.equal(s.resources.find((r) => r.name === 'c').content.length, 16384);
  assert.equal(
    s.resources.some((r) => !r.name || !r.content),
    false,
  );
  assert.deepEqual(normalizeRuntimeAgentSkill({ resources: 'not-an-array' }).resources, []);
  // 端口现状（未打补丁）：map 的默认参数只兜 undefined，数组里的 null 直接取 name 抛错。
  assert.throws(() => normalizeRuntimeAgentSkill({ resources: [null] }), TypeError);
});

test('normalizeRuntimeAgentSkill：defaultParams 浅拷贝、scriptsEnabled 恒为 false', () => {
  const params = { size: '1024', nested: { a: 1 } };
  const s = normalizeRuntimeAgentSkill({
    id: 'x',
    defaultParams: params,
    execution: { scriptsAvailable: true },
  });
  assert.notEqual(s.defaultParams, params);
  assert.equal(s.defaultParams.nested, params.nested);
  assert.equal(s.execution.scriptsAvailable, true);
  assert.equal(s.execution.scriptsEnabled, false);
  assert.deepEqual(normalizeRuntimeAgentSkill({ defaultParams: 'str' }).defaultParams, {});
});

test('createAgentSkillRegistryCore：内建技能按 id 过滤并参与列表', () => {
  const core = createAgentSkillRegistryCore({
    builtInSkills: [{ id: 'gen-image' }, { id: '   ' }, {}, null].slice(0, 3),
  });
  assert.deepEqual(
    core.listSkills().map((s) => s.id),
    ['gen-image'],
  );
  assert.equal(core.getState().builtInCount, 1);
  assert.equal(core.getState().installedCount, 0);
  assert.equal(core.getState().rootPath, '');
  assert.deepEqual(core.getState().diagnostics, []);
});

test('listSkills 返回深拷贝，改返回值不污染注册表', () => {
  const core = createAgentSkillRegistryCore({
    builtInSkills: [{ id: 'a', defaultParams: { w: 1 }, resources: [{ name: 'r', content: 'c' }] }],
  });
  const first = core.listSkills()[0];
  first.defaultParams.w = 99;
  first.resources[0].content = 'tampered';
  first.execution.scriptsAvailable = true;
  const second = core.listSkills()[0];
  assert.deepEqual(second.defaultParams, { w: 1 });
  assert.equal(second.resources[0].content, 'c');
  assert.equal(second.execution.scriptsAvailable, false);
});

test('setDisabledSkillIds 与 setSkillEnabled：id 归一化强度不一致，未知 id 返回 false', () => {
  const core = createAgentSkillRegistryCore({ builtInSkills: [{ id: 'a' }, { id: 'b' }] });
  // 端口现状（未打补丁）：setDisabledSkillIds 只 trim 不小写，setSkillEnabled 会小写。
  assert.deepEqual(core.setDisabledSkillIds([' A ', 'a', '', 'b']), ['A', 'a', 'b']);
  assert.deepEqual(
    core.listSkills().map((s) => [s.id, s.enabled]),
    [
      ['a', false],
      ['b', false],
    ],
  );
  // 大写残留是死条目：启用技能 'a' 只 delete 小写形态。
  assert.equal(core.setSkillEnabled('  A  ', true), true);
  assert.deepEqual(core.getState().disabledSkillIds, ['A', 'b']);
  assert.deepEqual(
    core.listSkills().map((s) => [s.id, s.enabled]),
    [
      ['a', true],
      ['b', false],
    ],
  );
  assert.equal(core.setSkillEnabled('missing', false), false);
  assert.equal(core.setSkillEnabled('', false), false);
  assert.deepEqual(core.getState().disabledSkillIds, ['A', 'b']);
  assert.equal(core.setSkillEnabled('b'), true);
  assert.deepEqual(core.getState().disabledSkillIds, ['A']);
  assert.equal(core.listSkills()[1].enabled, true);
});

test('replaceInstalledPackages：解析成功入库，失败与重复 id 落诊断', () => {
  const core = createAgentSkillRegistryCore({ builtInSkills: [{ id: 'dup' }] });
  const result = core.replaceInstalledPackages(
    [
      skillPackage('ok-skill'),
      { packageId: 'pkg-bad', markdown: '没有 frontmatter' },
      skillPackage('dup'),
      skillPackage('Bad Id'),
      skillPackage('second-skill'),
    ],
    { rootPath: 'C:\\skills', diagnostics: [{ ok: false, errorCode: 'PREEXISTING' }] },
  );
  assert.equal(result.available, true);
  assert.equal(result.loaded, 2);
  assert.equal(result.rootPath, 'C:\\skills');
  assert.deepEqual(
    result.diagnostics.map((d) => d.errorCode),
    ['PREEXISTING', 'MISSING_SKILL_FRONTMATTER', 'DUPLICATE_SKILL_ID', 'INVALID_SKILL_ID'],
  );
  assert.deepEqual(
    core.listSkills().map((s) => [s.id, s.source]),
    [
      ['dup', 'built-in'],
      ['ok-skill', 'installed'],
      ['second-skill', 'installed'],
    ],
  );
  // 重复 id 之间也会互斥（第二个 dup 已在集合里）。
  const again = core.replaceInstalledPackages([skillPackage('x'), skillPackage('x')]);
  assert.equal(again.loaded, 1);
  assert.equal(again.diagnostics.filter((d) => d.errorCode === 'DUPLICATE_SKILL_ID').length, 1);
});

test('replaceInstalledPackages：非数组入参与 rootPath 截断 500', () => {
  const core = createAgentSkillRegistryCore({});
  assert.deepEqual(core.replaceInstalledPackages(), {
    available: true,
    loaded: 0,
    rootPath: '',
    diagnostics: [],
  });
  const r = core.replaceInstalledPackages(null, { rootPath: 'r'.repeat(900), diagnostics: 'x' });
  assert.equal(r.rootPath.length, 500);
  assert.deepEqual(r.diagnostics, []);
});

test('listCatalog 只暴露摘要字段，editable 需 installed 且 managedBy 为 shuo-canvas', () => {
  const core = createAgentSkillRegistryCore({ builtInSkills: [{ id: 'bi', managedBy: 'shuo-canvas' }] });
  core.replaceInstalledPackages([skillPackage('managed')]);
  const catalog = core.listCatalog();
  assert.deepEqual(Object.keys(catalog[0]), [
    'id',
    'title',
    'description',
    'category',
    'version',
    'source',
    'riskLevel',
    'recommendedModelKind',
    'manualOnly',
    'editable',
    'enabled',
  ]);
  assert.deepEqual(
    catalog.map((c) => [c.id, c.editable]),
    [
      ['bi', false],
      ['managed', false],
    ],
  );
  // 只有解析器写出的 managedBy 才会 editable；这里手工注入 installed 技能验证。
  const core2 = createAgentSkillRegistryCore({});
  core2.replaceInstalledPackages([skillPackage('mine')]);
  const raw = core2.listSkills();
  assert.equal(raw[0].managedBy, '');
});

test('select：默认取前 2，非有限值回落 2，负值与零取空', () => {
  const core = createAgentSkillRegistryCore({
    builtInSkills: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    scoreBuiltInSkill: () => 1,
  });
  assert.deepEqual(
    core.select({}).map((s) => s.id),
    ['a', 'b'],
  );
  assert.deepEqual(
    core.select({ maxSkills: 'abc' }).map((s) => s.id),
    ['a', 'b'],
  );
  assert.deepEqual(core.select({ maxSkills: 0 }), []);
  assert.deepEqual(core.select({ maxSkills: -5 }), []);
  assert.deepEqual(
    core.select({ maxSkills: 10 }).map((s) => s.id),
    ['a', 'b', 'c'],
  );
  // 分数为 0 的技能被丢弃，包括禁用技能不参选。
  assert.deepEqual(core.select({ maxSkills: 10, ...{} }).length, 3);
  core.setSkillEnabled('b', false);
  assert.deepEqual(
    core.select({ maxSkills: 10 }).map((s) => s.id),
    ['a', 'c'],
  );
});

test('select：内建走注入评分、installed 走内置评分，同分保持原序', () => {
  const seen = [];
  const core = createAgentSkillRegistryCore({
    builtInSkills: [{ id: 'bi-low' }, { id: 'bi-high' }],
    scoreBuiltInSkill: (skill, ctx) => {
      seen.push([skill.id, ctx.userMessage]);
      return skill.id === 'bi-low' ? 5 : 9;
    },
  });
  core.replaceInstalledPackages([
    {
      packageId: 'p1',
      markdown:
        '---\nname: hit\ndescription: 生成产品图\nmetadata:\n  triggers:\n    - 生成产品图\n---\n步骤',
    },
  ]);
  const picked = core.select({ maxSkills: 10, userMessage: '生成产品图' });
  assert.deepEqual(
    picked.map((s) => s.id),
    ['hit', 'bi-high', 'bi-low'],
  );
  assert.deepEqual(seen, [
    ['bi-low', '生成产品图'],
    ['bi-high', '生成产品图'],
  ]);
});

test('scoreInstalledSkill：manualOnly 未被点名即 0 分，点名加 1000', () => {
  const scored = (over) =>
    agentSkillRegistryInternals.scoreInstalledSkill(
      normalizeRuntimeAgentSkill({ id: 'manual', title: 'Manual', ...over }),
      { userMessage: over.userMessage },
    );
  assert.equal(scored({ manualOnly: true, userMessage: '帮我整理资料' }), 0);
  assert.equal(scored({ manualOnly: true, userMessage: '$manual 帮我整理' }), 1000);
  assert.equal(scored({ userMessage: '$manual 帮我整理' }), 1000);
  // 非 manualOnly 且无匹配线索时为 0 分，不会进入 select。
  assert.equal(scored({ userMessage: '今天天气不错' }), 0);
});

test('scoreInstalledSkill：trigger 与 appliesWhen 命中各加 240，targetKind 再 +40', () => {
  const skill = normalizeRuntimeAgentSkill({
    id: 's',
    triggers: ['排列节点'],
    appliesWhen: ['网格'],
  });
  assert.equal(agentSkillRegistryInternals.scoreInstalledSkill(skill, { userMessage: '排列节点' }), 240);
  assert.equal(agentSkillRegistryInternals.scoreInstalledSkill(skill, { userMessage: '网格 排列节点' }), 480);
  assert.equal(
    agentSkillRegistryInternals.scoreInstalledSkill(
      normalizeRuntimeAgentSkill({ id: 's', triggers: ['排列节点'], recommendedModelKind: 'image' }),
      { userMessage: '排列节点', targetKind: 'image' },
    ),
    280,
  );
  // 0 分时 targetKind 不再加分。
  assert.equal(
    agentSkillRegistryInternals.scoreInstalledSkill(
      normalizeRuntimeAgentSkill({ id: 's', recommendedModelKind: 'image' }),
      { userMessage: '无关文本', targetKind: 'image' },
    ),
    0,
  );
});

test('scoreDescriptionRelevance：按 60 分一档、命中数取去重词集、上限 180', () => {
  const f = agentSkillRegistryInternals.scoreDescriptionRelevance;
  // “排列节点”切出 排列/列节/节点/排列节/列节点 五个去重词，全部命中 → 300 分被截到 180。
  assert.equal(f('排列节点', { title: '排列节点', description: '' }), 180);
  assert.equal(f('排列 节点 对齐', { title: '排列', description: '节点' }), 120);
  assert.equal(f('排列 节点', { title: '排列', description: '节点' }), 120);
  assert.equal(f('排列', { title: '排列', description: '' }), 60);
  assert.equal(f('', { title: '排列', description: '节点' }), 0);
  assert.equal(f('完全无关', { title: '排列', description: '节点' }), 0);
  // 查询词为空集时提前返回 0，不看目标文本。
  assert.equal(f('!!!', { title: '排列', description: '节点' }), 0);
});

test('collectRelevanceTerms：英文按 2+ 字符 token，中文切 2/3gram 并滤掉停用词', () => {
  const terms = agentSkillRegistryInternals.collectRelevanceTerms('生成图片 Arrange nodes ai');
  assert.equal(terms.has('ai'), true);
  assert.equal(terms.has('a'), false);
  assert.equal(terms.has('arrange'), true);
  assert.equal(terms.has('nodes'), true);
  assert.equal(terms.has('生成图'), true);
  assert.equal(terms.has('成图片'), true);
  assert.equal(terms.has('生成'), true);
  // 停用词表只精确匹配 2gram：3gram 从不受停用词影响。
  const ignored = agentSkillRegistryInternals.collectRelevanceTerms('使用一个内容');
  assert.equal(ignored.has('使用'), false);
  assert.equal(ignored.has('一个'), false);
  assert.equal(ignored.has('内容'), false);
  assert.equal(ignored.has('用一个'), true);
  assert.equal(ignored.has('个内容'), true);
});

test('isExplicitSkillRequest：ASCII id 需 $ 或 / 前缀，标题按词边界匹配', () => {
  const f = agentSkillRegistryInternals.isExplicitSkillRequest;
  assert.equal(f('$my-skill 帮我', { id: 'my-skill', title: '' }), true);
  assert.equal(f('/my-skill 帮我', { id: 'my-skill', title: '' }), true);
  assert.equal(f('my-skill 帮我', { id: 'my-skill', title: '' }), false);
  assert.equal(f('xmy-skill 帮我', { id: 'my-skill', title: '' }), false);
  assert.equal(f('$my-skillx 帮我', { id: 'my-skill', title: '' }), false);
  assert.equal(f('请用 My Skill 处理', { id: 'my-skill', title: 'My Skill' }), true);
  assert.equal(f('my skill 处理', { id: '', title: 'My Skill' }), true);
  // 中文紧邻英文标题不算边界：`(?:^|[^\p{L}\p{N}_-])` 里 `\p{L}` 含汉字。
  assert.equal(f('请用My Skill处理', { id: '', title: 'My Skill' }), false);
  // 端口现状（未打补丁）：id 支路恒以 prefixed:true 调用，非 ASCII 引用也要求 $ 或 / 前缀，
  // 只有 title 支路才走大小写不敏感的子串包含回落。
  assert.equal(f('生成图片', { id: '生成图片', title: '' }), false);
  assert.equal(f('$生成图片', { id: '生成图片', title: '' }), true);
  assert.equal(f('帮我生成图片', { id: '生成图片', title: '生成图片' }), true);
  assert.equal(f('', { id: 'my-skill', title: 'x' }), false);
  assert.equal(f('hello', { id: '', title: '' }), false);
});

test('getState 与 diagnostics 返回拷贝，调用方改不动内部状态', () => {
  const core = createAgentSkillRegistryCore({});
  const r = core.replaceInstalledPackages([{ packageId: 'p', markdown: 'bad' }]);
  r.diagnostics[0].errorCode = 'TAMPERED';
  const state = core.getState();
  assert.equal(state.diagnostics[0].errorCode, 'MISSING_SKILL_FRONTMATTER');
  state.disabledSkillIds.push('ghost');
  assert.deepEqual(core.getState().disabledSkillIds, []);
});
