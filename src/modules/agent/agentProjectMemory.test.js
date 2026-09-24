import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENT_PROJECT_MEMORY_SCHEMA_VERSION,
  AGENT_PROJECT_MEMORY_ENTRY_LIMIT,
  AGENT_PROJECT_MEMORY_TEXT_LIMIT,
  AGENT_PROJECT_MEMORY_CATEGORIES,
  normalizeAgentProjectMemory,
  isAgentProjectMemoryEmpty,
  compactAgentProjectMemoryForPrompt,
  detectAgentProjectMemoryIntent,
} from './agentProjectMemory.js';

test('常量契约：schema 版本 1、条目上限 12、文本上限 240、四类冻结', () => {
  assert.equal(AGENT_PROJECT_MEMORY_SCHEMA_VERSION, 1);
  assert.equal(AGENT_PROJECT_MEMORY_ENTRY_LIMIT, 12);
  assert.equal(AGENT_PROJECT_MEMORY_TEXT_LIMIT, 240);
  assert.deepEqual(AGENT_PROJECT_MEMORY_CATEGORIES, [
    'brandVoice',
    'preferredModels',
    'namingRules',
    'preferences',
  ]);
  assert.equal(Object.isFrozen(AGENT_PROJECT_MEMORY_CATEGORIES), true);
});

test('归一化：折叠空白、trim、截 240，大小写不敏感去重，保留最后 12 条', () => {
  const memory = normalizeAgentProjectMemory({
    brandVoice: ['  专业   且   克制 \n 换行 ', 'A'.repeat(300), 'dup', 'DUP '],
  });
  assert.equal(memory.brandVoice[0], '专业 且 克制 换行');
  assert.equal(memory.brandVoice[1].length, 240);
  assert.deepEqual(memory.brandVoice.slice(2), ['dup']);
  const many = normalizeAgentProjectMemory({
    preferences: Array.from({ length: 15 }, (_, index) => `p${index}`),
  });
  assert.equal(many.preferences.length, 12);
  assert.equal(many.preferences[0], 'p3');
  assert.equal(many.preferences.at(-1), 'p14');
});

test('归一化：四类之外的键被忽略，非数组入参得到空桶，非对象入参也不抛错', () => {
  const memory = normalizeAgentProjectMemory({
    brandVoice: 'not-an-array',
    preferredModels: null,
    namingRules: undefined,
    preferences: ['ok', '', '   '],
    unknownCategory: ['x'],
  });
  assert.deepEqual(Object.keys(memory), [
    'schemaVersion',
    'projectId',
    'brandVoice',
    'preferredModels',
    'namingRules',
    'preferences',
    'updatedAt',
  ]);
  assert.deepEqual(memory.brandVoice, []);
  assert.deepEqual(memory.preferredModels, []);
  assert.deepEqual(memory.namingRules, []);
  assert.deepEqual(memory.preferences, ['ok']);
  assert.deepEqual(normalizeAgentProjectMemory(['x']), {
    schemaVersion: 1,
    projectId: 'default_v2_project',
    brandVoice: [],
    preferredModels: [],
    namingRules: [],
    preferences: [],
    updatedAt: 0,
  });
  assert.equal(normalizeAgentProjectMemory().projectId, 'default_v2_project');
});

test('归一化：入参 projectId 优先于记忆体自身，且截 160；updatedAt 走 Number 短路再夹非负', () => {
  assert.equal(normalizeAgentProjectMemory({ projectId: 'fromBody' }, {}).projectId, 'fromBody');
  assert.equal(
    normalizeAgentProjectMemory({ projectId: 'fromBody' }, { projectId: 'fromOpts' }).projectId,
    'fromOpts',
  );
  assert.equal(normalizeAgentProjectMemory({}, { projectId: 'p'.repeat(200) }).projectId.length, 160);
  assert.equal(normalizeAgentProjectMemory({ updatedAt: 5 }, { now: 9 }).updatedAt, 5);
  assert.equal(normalizeAgentProjectMemory({ updatedAt: '12' }, { now: 9 }).updatedAt, 12);
  assert.equal(normalizeAgentProjectMemory({ updatedAt: 0 }, { now: 9 }).updatedAt, 9);
  assert.equal(normalizeAgentProjectMemory({}, { now: 9 }).updatedAt, 9);
  assert.equal(normalizeAgentProjectMemory({}, { now: -1 }).updatedAt, 0);
  // 真值但非有限数（含负数）会短路掉 now，最终夹回 0
  assert.equal(normalizeAgentProjectMemory({ updatedAt: 'abc' }, { now: 9 }).updatedAt, 0);
  assert.equal(normalizeAgentProjectMemory({ updatedAt: -5 }, { now: 9 }).updatedAt, 0);
  assert.equal(normalizeAgentProjectMemory({ updatedAt: 'abc' }, { now: 'abc' }).updatedAt, 0);
});

test('空判定：仅四类全空才算空，含只留空串的桶', () => {
  assert.equal(isAgentProjectMemoryEmpty({}), true);
  assert.equal(isAgentProjectMemoryEmpty({ brandVoice: ['  ', ''] }), true);
  assert.equal(isAgentProjectMemoryEmpty({ namingRules: ['中文编号'] }), false);
  assert.equal(isAgentProjectMemoryEmpty(null), true);
});

test('提示词压缩：空记忆返回 null，非空时只保留有内容的类别键', () => {
  assert.equal(compactAgentProjectMemoryForPrompt({}), null);
  assert.equal(compactAgentProjectMemoryForPrompt({ preferences: [''] }), null);
  assert.deepEqual(
    compactAgentProjectMemoryForPrompt({
      brandVoice: ['专业'],
      preferredModels: [],
      namingRules: ['中文编号'],
      projectId: 'p1',
    }),
    { brandVoice: ['专业'], namingRules: ['中文编号'] },
  );
  assert.equal(Object.keys(compactAgentProjectMemoryForPrompt({ preferences: ['x'] })).length, 1);
});

test('意图识别：查看类整句命中 inspect，中英皆可且允许尾随标点', () => {
  for (const text of [
    '查看这个项目的记忆',
    '请告诉我当前项目的偏好？',
    '你还记得这个项目的什么。',
    'show this project memory',
    'list project preferences!',
    "what do you remember about this project's memory?",
  ]) {
    assert.deepEqual(detectAgentProjectMemoryIntent(text), { operation: 'inspect' }, text);
  }
});

test('意图识别：清空类命中 clear，优先级低于 inspect', () => {
  for (const text of [
    '清空这个项目的记忆',
    '请删除项目的长期偏好。',
    'reset this project memory',
    'clear project preferences',
  ]) {
    assert.deepEqual(detectAgentProjectMemoryIntent(text), { operation: 'clear' }, text);
  }
  assert.deepEqual(detectAgentProjectMemoryIntent('查看项目的记忆'), { operation: 'inspect' });
});

test('意图识别：forget 去掉前缀与项目范围词后给出类别与查询', () => {
  assert.deepEqual(detectAgentProjectMemoryIntent('忘记 模型：gpt-4o'), {
    operation: 'forget',
    category: 'preferredModels',
    query: 'gpt-4o',
  });
  assert.deepEqual(detectAgentProjectMemoryIntent('forget：brand voice'), {
    operation: 'forget',
    category: 'brandVoice',
    query: '',
  });
  assert.deepEqual(detectAgentProjectMemoryIntent('移除这个项目的命名规则'), {
    operation: 'forget',
    category: 'namingRules',
    query: '',
  });
  const vague = detectAgentProjectMemoryIntent('忘记 明天开会');
  assert.equal(vague.operation, 'forget');
  assert.equal(vague.category, '');
  assert.equal(vague.query, '明天开会');
});

test('意图识别：能力提问不算 remember，普通陈述也不算', () => {
  assert.equal(detectAgentProjectMemoryIntent('你能长期记住我的偏好'), null);
  assert.equal(detectAgentProjectMemoryIntent('do you remember this project?'), null);
  assert.equal(detectAgentProjectMemoryIntent('帮我建一个图片节点'), null);
  assert.equal(detectAgentProjectMemoryIntent(''), null);
  assert.equal(detectAgentProjectMemoryIntent('    '), null);
});

test('意图识别：记住前缀触发 remember，并按分号与换行拆条、逐条分类清洗', () => {
  assert.deepEqual(detectAgentProjectMemoryIntent('记住：品牌语气要专业；节点名用中文编号'), {
    operation: 'remember',
    records: [
      { category: 'brandVoice', value: '要专业' },
      { category: 'namingRules', value: '中文编号' },
    ],
  });
  assert.deepEqual(detectAgentProjectMemoryIntent('记住：模型用 gpt-4o；文件名带日期'), {
    operation: 'remember',
    records: [
      { category: 'preferredModels', value: 'gpt-4o' },
      { category: 'namingRules', value: '带日期' },
    ],
  });
  // 换行在切分前就被折叠为空格，因此换行分隔的多条会合并成一条
  assert.deepEqual(detectAgentProjectMemoryIntent('记住：模型用 gpt-4o\n文件名带日期'), {
    operation: 'remember',
    records: [{ category: 'preferredModels', value: 'gpt-4o 文件名带日期' }],
  });
});

test('意图识别：以后 / 本项目 / for this project 前缀同样算 remember，无法清洗出内容时返回 null', () => {
  assert.deepEqual(detectAgentProjectMemoryIntent('以后都优先使用 gpt-4o'), {
    operation: 'remember',
    records: [{ category: 'preferredModels', value: 'gpt-4o' }],
  });
  assert.deepEqual(detectAgentProjectMemoryIntent('这个项目：偏好简洁文案'), {
    operation: 'remember',
    records: [{ category: 'preferences', value: '简洁文案' }],
  });
  assert.deepEqual(detectAgentProjectMemoryIntent('for this project 命名用中文'), {
    operation: 'remember',
    records: [{ category: 'namingRules', value: '中文' }],
  });
  assert.equal(detectAgentProjectMemoryIntent('记住：品牌语气'), null);
  assert.equal(detectAgentProjectMemoryIntent('这个项目很重要'), null);
});

test('清洗顺序：记住前缀 → 项目范围 → 未来前缀 → 类别标签 → 模型动词 → 首尾标点', () => {
  // 类别标签后紧跟「都选用」时端口的模型动词正则不匹配，动词会留在值里
  assert.deepEqual(detectAgentProjectMemoryIntent('请帮我长期记住：这个项目的默认模型都选用 seedream'), {
    operation: 'remember',
    records: [{ category: 'preferredModels', value: '都选用 seedream' }],
  });
  assert.deepEqual(detectAgentProjectMemoryIntent('记住：默认模型用 seedream'), {
    operation: 'remember',
    records: [{ category: 'preferredModels', value: 'seedream' }],
  });
  assert.deepEqual(detectAgentProjectMemoryIntent('记住：文案风格是，轻松幽默。'), {
    operation: 'remember',
    records: [{ category: 'brandVoice', value: '轻松幽默' }],
  });
  assert.deepEqual(detectAgentProjectMemoryIntent('记住：其他偏好：导出 4K'), {
    operation: 'remember',
    records: [{ category: 'preferences', value: '导出 4K' }],
  });
});
