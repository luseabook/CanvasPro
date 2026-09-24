import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENT_SKILL_LIFECYCLE_TARGET_KIND,
  detectAgentSkillLifecycleIntent,
  resolveAgentSkillLifecycleTarget,
  isAgentSkillLifecycleConfirmMessage,
  isAgentSkillLifecycleCancelMessage,
} from './agentSkillLifecycle.js';

const INSTALLED = [
  { id: 'copy-writer', title: '产品文案', description: '写产品文案', source: 'installed' },
  { id: 'report-helper', title: '报表助手', description: '生成报表', source: 'installed' },
];

test('目标类型常量', () => {
  assert.equal(AGENT_SKILL_LIFECYCLE_TARGET_KIND, 'agent-skill-lifecycle');
});

test('空文本、提问式、否定式一律不判定意图', () => {
  assert.equal(detectAgentSkillLifecycleIntent('', INSTALLED), '');
  assert.equal(detectAgentSkillLifecycleIntent('  ', INSTALLED), '');
  assert.equal(detectAgentSkillLifecycleIntent('如何停用 copy-writer', INSTALLED), '');
  assert.equal(detectAgentSkillLifecycleIntent('why delete copy-writer', INSTALLED), '');
  assert.equal(detectAgentSkillLifecycleIntent('不要删除 copy-writer', INSTALLED), '');
  assert.equal(detectAgentSkillLifecycleIntent("don't delete the copy-writer skill", INSTALLED), '');
});

test('缺少技能主语且无已安装技能命中时不判定', () => {
  assert.equal(detectAgentSkillLifecycleIntent('删除它', INSTALLED), '');
  assert.equal(detectAgentSkillLifecycleIntent('删除', []), '');
  assert.equal(
    detectAgentSkillLifecycleIntent('删除 报表助手', [{ id: 'x', title: '报表助手', source: 'builtin' }]),
    '',
  );
});

test('主语可来自 skill/skills/技能 字样或 $id / id 提及', () => {
  assert.equal(detectAgentSkillLifecycleIntent('停用 Skill', INSTALLED), 'disable');
  assert.equal(detectAgentSkillLifecycleIntent('删除技能', INSTALLED), 'delete');
  assert.equal(detectAgentSkillLifecycleIntent('停用 $report-helper', INSTALLED), 'disable');
  assert.equal(detectAgentSkillLifecycleIntent('删除 copy-writer', INSTALLED), 'delete');
});

test('操作按固定优先级取首个命中：delete > clone > disable > enable > update > inspect', () => {
  assert.equal(detectAgentSkillLifecycleIntent('复制并删除技能', INSTALLED), 'delete');
  assert.equal(detectAgentSkillLifecycleIntent('克隆技能', INSTALLED), 'clone');
  assert.equal(detectAgentSkillLifecycleIntent('启用并复制技能', INSTALLED), 'clone');
  assert.equal(detectAgentSkillLifecycleIntent('关闭技能', INSTALLED), 'disable');
  assert.equal(detectAgentSkillLifecycleIntent('恢复使用技能', INSTALLED), 'enable');
  assert.equal(detectAgentSkillLifecycleIntent('查看技能详情', INSTALLED), 'inspect');
  assert.equal(detectAgentSkillLifecycleIntent('修改技能', INSTALLED), 'update');
  assert.equal(detectAgentSkillLifecycleIntent('turn off the skill', INSTALLED), 'disable');
  assert.equal(detectAgentSkillLifecycleIntent('turn on my skill', INSTALLED), 'enable');
});

test('id 与 title 先从文本中抹除，避免其字面内容干扰操作判定', () => {
  assert.equal(detectAgentSkillLifecycleIntent('查看 copy-writer', INSTALLED), 'inspect');
  assert.equal(detectAgentSkillLifecycleIntent('把 /report-helper 删掉', INSTALLED), '');
});

test('title 为空串时 replaceAll 会在每字符间插入空格从而令判定失效（端口现状）', () => {
  const skills = [{ id: 'solo', title: '', source: 'installed' }];
  assert.equal(detectAgentSkillLifecycleIntent('delete solo skill', skills), '');
});

test('无操作命中时返回空串', () => {
  assert.equal(detectAgentSkillLifecycleIntent('技能不错', INSTALLED), '');
});

test('resolve：显式 $id 与 /id 命中或报 not_found', () => {
  assert.deepEqual(resolveAgentSkillLifecycleTarget('$copy-writer', INSTALLED), {
    status: 'resolved',
    skill: INSTALLED[0],
  });
  assert.deepEqual(resolveAgentSkillLifecycleTarget('/Report-Helper', INSTALLED), {
    status: 'resolved',
    skill: INSTALLED[1],
  });
  assert.deepEqual(resolveAgentSkillLifecycleTarget('$ghost', INSTALLED), {
    status: 'not_found',
    requestedId: 'ghost',
  });
});

test('resolve：id/title 子串唯一命中与多命中歧义', () => {
  assert.deepEqual(resolveAgentSkillLifecycleTarget('帮我改产品文案', INSTALLED).status, 'resolved');
  const dup = [
    { id: 'a-one', title: '文案助手', source: 'installed' },
    { id: 'b-two', title: '文案工具', source: 'installed' },
  ];
  assert.equal(resolveAgentSkillLifecycleTarget('删除文案助手与文案工具', dup).status, 'ambiguous');
});

test('resolve：中文子串剥离动词后回落到 title/description', () => {
  const skills = [{ id: 'report-helper', title: '报表助手', description: '生成报表', source: 'installed' }];
  assert.deepEqual(resolveAgentSkillLifecycleTarget('删除报表', skills), {
    status: 'resolved',
    skill: skills[0],
  });
  const two = [
    { id: 'r1', title: '报表助手', description: '', source: 'installed' },
    { id: 'r2', title: '报表统计', description: '', source: 'installed' },
  ];
  assert.equal(resolveAgentSkillLifecycleTarget('删除报表', two).status, 'ambiguous');
});

test('resolve：皆不命中时返回 missing 并带全部已安装技能', () => {
  const out = resolveAgentSkillLifecycleTarget('zzz', INSTALLED);
  assert.equal(out.status, 'missing');
  assert.equal(out.skills.length, 2);
});

test('resolve：入参非数组与缺省入参安全', () => {
  assert.deepEqual(resolveAgentSkillLifecycleTarget(), { status: 'missing', skills: [] });
  assert.equal(resolveAgentSkillLifecycleTarget('$a', null).status, 'not_found');
});

test('确认话术白名单严格整句匹配', () => {
  for (const msg of ['确认', '确认删除', '确定删除。', '是', '继续删除', 'delete', 'Confirm!', 'yes'])
    assert.equal(isAgentSkillLifecycleConfirmMessage(msg), true, msg);
  for (const msg of ['确认删除 copy-writer', '不确认', 'cancel', ''])
    assert.equal(isAgentSkillLifecycleConfirmMessage(msg), false, msg);
});

test('取消话术白名单严格整句匹配', () => {
  for (const msg of [
    '取消',
    '取消删除',
    '取消操作。',
    '不删了',
    '先别删',
    '算了',
    'cancel.',
    'never mind',
    'NO',
  ])
    assert.equal(isAgentSkillLifecycleCancelMessage(msg), true, msg);
  for (const msg of ['取消全部', '别取消', '确认', ''])
    assert.equal(isAgentSkillLifecycleCancelMessage(msg), false, msg);
});
