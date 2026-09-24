import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveAgentSkillMatch,
  normalizeAgentSkillUsageSnapshots,
  buildSelectedAgentSkillUsage,
  agentSkillUsageInternals,
} from './agentSkillUsage.js';

test('显式 $id 调用优先命中，且 matchedText 带 $ 前缀', () => {
  assert.deepEqual(resolveAgentSkillMatch({ id: 'copy-writer', title: '文案' }, '帮我 $copy-writer 一下'), {
    kind: 'explicit',
    matchedText: '$copy-writer',
  });
});

test('显式匹配要求前后边界：前邻字母或后连字符均不算', () => {
  assert.equal(resolveAgentSkillMatch({ id: 'copy-writer' }, 'x$copy-writer').kind, 'id');
  assert.equal(resolveAgentSkillMatch({ id: 'copy-writer' }, '$copy-writer-lite').kind, 'id');
  assert.equal(resolveAgentSkillMatch({ id: 'copy-writer' }, '$copy-writer。').kind, 'explicit');
});

test('显式匹配大小写不敏感但回显原 id', () => {
  const out = resolveAgentSkillMatch({ id: 'copy-writer' }, 'USE $COPY-WRITER NOW');
  assert.deepEqual(out, { kind: 'explicit', matchedText: '$copy-writer' });
});

test('id 中的正则元字符被转义', () => {
  assert.equal(resolveAgentSkillMatch({ id: 'a.b' }, 'see $a.b').kind, 'explicit');
  assert.equal(resolveAgentSkillMatch({ id: 'a.b' }, 'see $axb').kind, 'semantic');
});

test('无 id 时按 title → triggers → id 子串 → semantic 依次回落', () => {
  const skill = { id: 'copy-writer', title: '产品文案', triggers: ['改写卖点', '  ', '写标语'] };
  assert.deepEqual(resolveAgentSkillMatch(skill, '帮我写产品文案'), {
    kind: 'title',
    matchedText: '产品文案',
  });
  assert.deepEqual(resolveAgentSkillMatch(skill, '这里需要改写卖点'), {
    kind: 'trigger',
    matchedText: '改写卖点',
  });
  assert.deepEqual(resolveAgentSkillMatch(skill, 'COPY-WRITER 呢'), {
    kind: 'id',
    matchedText: 'copy-writer',
  });
  assert.deepEqual(resolveAgentSkillMatch(skill, '随便说点什么'), { kind: 'semantic', matchedText: '' });
});

test('title/triggers 空白项被忽略，缺字段不抛', () => {
  assert.equal(resolveAgentSkillMatch({}, 'anything').kind, 'semantic');
  assert.equal(resolveAgentSkillMatch({ triggers: ['  '] }, '触发').kind, 'semantic');
  assert.equal(resolveAgentSkillMatch({ title: '  ' }, '触发').kind, 'semantic');
});

test('normalize 丢弃无 id 项、截断各字段并最多留 4 项', () => {
  const items = Array.from({ length: 6 }, (_, i) => ({ id: 's' + i }));
  const out = normalizeAgentSkillUsageSnapshots(items);
  assert.equal(out.length, 4);
  assert.deepEqual(
    out.map((x) => x.id),
    ['s0', 's1', 's2', 's3'],
  );
  assert.equal(out[0].title, 's0');
  assert.deepEqual(out[0].match, { kind: 'semantic', matchedText: '' });
  assert.deepEqual(out[0].resourceNames, []);
  assert.equal(normalizeAgentSkillUsageSnapshots([{ id: '  ' }, { id: 'ok' }]).length, 1);
  assert.deepEqual(normalizeAgentSkillUsageSnapshots(null), []);
});

test('normalize 对 id/title/description/instructions/matchedText 各自限长', () => {
  const [row] = normalizeAgentSkillUsageSnapshots([
    {
      id: 'x'.repeat(100),
      title: 't'.repeat(300),
      description: 'd'.repeat(700),
      instructions: 'i'.repeat(3000),
      match: { kind: 'explicit-ish-and-long'.repeat(4), matchedText: 'm'.repeat(300) },
      source: '  installed  ',
    },
  ]);
  assert.equal(row.id.length, 64);
  assert.equal(row.title.length, 120);
  assert.equal(row.description.length, 500);
  assert.equal(row.instructions.length, 2000);
  assert.equal(row.match.kind.length, 32);
  assert.equal(row.match.matchedText.length, 160);
  assert.equal(row.source, 'installed');
});

test('normalize 的资源名去重、去空并最多 12 项', () => {
  const [row] = normalizeAgentSkillUsageSnapshots([
    { id: 's', resourceNames: [' a ', 'a', '', null, ...Array.from({ length: 20 }, (_, i) => 'r' + i)] },
  ]);
  assert.equal(row.resourceNames[0], 'a');
  assert.equal(row.resourceNames.length, 12);
});

test('normalize 对 match 非对象者按空对象处理', () => {
  const [row] = normalizeAgentSkillUsageSnapshots([{ id: 's', match: 'explicit' }]);
  assert.deepEqual(row.match, { kind: 'semantic', matchedText: '' });
});

test('buildSelected 无技能时返回 null，channel 限长 80', () => {
  assert.equal(buildSelectedAgentSkillUsage({ context: { skills: [] } }), null);
  assert.equal(buildSelectedAgentSkillUsage({}), null);
  const out = buildSelectedAgentSkillUsage({
    context: { skills: [{ id: 'a', title: 'A' }, { id: 'b' }] },
    userMessage: '用 $b 处理',
    channel: 'c'.repeat(120),
  });
  assert.equal(out.type, 'skill.selected');
  assert.equal(out.channel.length, 80);
  assert.deepEqual(out.skillIds, ['a', 'b']);
  assert.deepEqual(
    out.skillSnapshots.map((s) => s.match.kind),
    ['semantic', 'explicit'],
  );
});

test('buildSelected 沿用 normalize 的 4 项上限', () => {
  const out = buildSelectedAgentSkillUsage({
    context: { skills: Array.from({ length: 9 }, (_, i) => ({ id: 's' + i })) },
  });
  assert.equal(out.skillIds.length, 4);
});

test('内部工具冻结且 truncateText 以 3 字符省略号收尾', () => {
  assert.equal(Object.isFrozen(agentSkillUsageInternals), true);
  assert.equal(agentSkillUsageInternals.truncateText('abcdef', 5), 'ab...');
  assert.equal(agentSkillUsageInternals.truncateText('abcdef', 6), 'abcdef');
  assert.equal(agentSkillUsageInternals.truncateText('abcdef', 2), '...');
  assert.equal(agentSkillUsageInternals.truncateText(null, 5), '');
  assert.deepEqual(agentSkillUsageInternals.normalizeResourceNames({ resources: [{ name: ' x ' }, 'y'] }), [
    'x',
  ]);
});
