import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MANAGED_AGENT_SKILL_OWNER,
  agentSkillPackageInternals,
  parseAgentSkillMarkdown,
  serializeManagedAgentSkillDefinition,
} from './agentSkillPackage.js';

const VALID_MARKDOWN = [
  '---',
  'name: storyboard-helper',
  'description: Helps draft storyboards',
  'metadata:',
  '  title: Storyboard Helper',
  '  triggers:',
  '    - "分镜"',
  '  applies-when:',
  '    - canvas-has-selection',
  '  canvas-commands:',
  '    - storyboard.create',
  '  risk-level: low',
  '---',
  'Do the thing.',
].join('\n');

test('parseAgentSkillMarkdown reads frontmatter, body, and defaults', () => {
  const result = parseAgentSkillMarkdown(VALID_MARKDOWN);
  assert.equal(result.ok, true);
  const { skill } = result;
  assert.equal(skill.schemaVersion, 1);
  assert.equal(skill.id, 'storyboard-helper');
  assert.equal(skill.title, 'Storyboard Helper');
  assert.equal(skill.description, 'Helps draft storyboards');
  assert.equal(skill.category, 'general');
  assert.equal(skill.version, 'local');
  assert.equal(skill.riskLevel, 'low');
  assert.deepEqual(skill.triggers, ['分镜']);
  assert.deepEqual(skill.appliesWhen, ['canvas-has-selection']);
  assert.deepEqual(skill.commands, ['storyboard.create']);
  assert.deepEqual(skill.requiredInputs, []);
  assert.deepEqual(skill.missingInputQuestions, []);
  assert.deepEqual(skill.defaultParams, {});
  assert.equal(skill.manualOnly, false);
  assert.equal(skill.instructions, 'Do the thing.');
  assert.equal(skill.source, 'installed');
  assert.equal(skill.packageId, 'storyboard-helper');
  assert.deepEqual(skill.execution, { scriptsAvailable: false, scriptsEnabled: false });
});

test('parseAgentSkillMarkdown takes packageId, source, and resource context from options', () => {
  const result = parseAgentSkillMarkdown('\uFEFF' + VALID_MARKDOWN, {
    packageId: 'my-folder',
    source: 'builtin',
    resourceNames: ['references/a.md', 'references/a.md', '', 'references/b.json'],
    resources: [
      { name: 'references/a.md', content: 'A' },
      { name: 'references/empty.md', content: '   ' },
    ],
    hasScripts: true,
  });
  assert.equal(result.ok, true);
  assert.equal(result.skill.packageId, 'my-folder');
  assert.equal(result.skill.source, 'builtin');
  assert.deepEqual(result.skill.resourceNames, ['references/a.md', 'references/b.json']);
  assert.deepEqual(result.skill.resources, [{ name: 'references/a.md', content: 'A' }]);
  assert.deepEqual(result.skill.execution, { scriptsAvailable: true, scriptsEnabled: false });
});

test('frontmatter top-level keys win over defaults and metadata is read second', () => {
  const markdown = [
    '---',
    'name: alpha',
    'title: Top Title',
    'description: Top description',
    'category: story',
    'version: 2.1.0',
    'risk-level: high',
    'triggers: a, b , a',
    'managed-by: shuo-canvas',
    'scriptsEnabled: false',
    '---',
    'Body',
  ].join('\n');
  const result = parseAgentSkillMarkdown(markdown);
  assert.equal(result.ok, true);
  assert.equal(result.skill.title, 'Top Title');
  assert.equal(result.skill.category, 'story');
  assert.equal(result.skill.version, '2.1.0');
  assert.equal(result.skill.riskLevel, 'high');
  assert.deepEqual(result.skill.triggers, ['a', 'b']);
  assert.equal(result.skill.managedBy, MANAGED_AGENT_SKILL_OWNER);
});

test('parseAgentSkillMarkdown rejects invalid documents', () => {
  const cases = [
    ['plain text without frontmatter', 'MISSING_SKILL_FRONTMATTER'],
    ['---\nname: BAD NAME\ndescription: d\n---\nbody', 'INVALID_SKILL_ID'],
    ['---\nname: ok-id\n---\nbody', 'MISSING_SKILL_DESCRIPTION'],
    ['---\nname: ok-id\ndescription: d\nscriptsEnabled: true\n---\nbody', 'SKILL_SCRIPTS_NOT_SUPPORTED'],
    ['x'.repeat(128 * 1024 + 1), 'SKILL_MD_TOO_LARGE'],
  ];
  for (const [markdown, errorCode] of cases) {
    const result = parseAgentSkillMarkdown(markdown, { packageId: 'pkg' });
    assert.equal(result.ok, false, errorCode);
    assert.equal(result.errorCode, errorCode);
    assert.equal(result.packageId, 'pkg');
    assert.equal(typeof result.message, 'string');
  }
});

test('parseAgentSkillMarkdown truncates long instructions', () => {
  const result = parseAgentSkillMarkdown(
    '---\nname: long-body\ndescription: d\n---\n' + 'y'.repeat(30 * 1024),
  );
  assert.equal(result.ok, true);
  assert.equal(result.skill.instructions.length, 24 * 1024);
});

test('serializeManagedAgentSkillDefinition round-trips through the parser', () => {
  const serialized = serializeManagedAgentSkillDefinition({
    id: 'My-Skill',
    title: 'My Skill',
    description: 'Does a thing',
    triggers: ['one', 'two'],
    instructions: 'Step 1\nStep 2',
  });
  assert.equal(serialized.ok, true);
  assert.equal(serialized.definition.id, 'my-skill');
  assert.equal(serialized.definition.managedBy, MANAGED_AGENT_SKILL_OWNER);
  assert.match(serialized.markdown, /^---\nname: my-skill\n/);
  assert.match(serialized.markdown, /\n  managed-by: shuo-canvas\n/);
  assert.match(serialized.markdown, /\n  triggers:\n    - "one"\n    - "two"\n/);

  const parsed = parseAgentSkillMarkdown(serialized.markdown, { packageId: 'my-skill' });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.skill.id, 'my-skill');
  assert.equal(parsed.skill.title, 'My Skill');
  assert.equal(parsed.skill.description, 'Does a thing');
  assert.deepEqual(parsed.skill.triggers, ['one', 'two']);
  assert.equal(parsed.skill.instructions, 'Step 1\nStep 2');
  assert.equal(parsed.skill.managedBy, MANAGED_AGENT_SKILL_OWNER);
});

test('serializeManagedAgentSkillDefinition rejects bad input', () => {
  assert.equal(serializeManagedAgentSkillDefinition({ id: 'Bad Id', description: 'd', instructions: 'i' }).errorCode, 'INVALID_SKILL_ID');
  assert.equal(serializeManagedAgentSkillDefinition({ id: 'ok', description: '', instructions: 'i' }).errorCode, 'MISSING_SKILL_DESCRIPTION');
  assert.equal(serializeManagedAgentSkillDefinition({ id: 'ok', description: 'd', instructions: '  ' }).errorCode, 'MISSING_SKILL_INSTRUCTIONS');
});

test('exposed internals parse scalars and quote yaml strings', () => {
  const { parseScalar, yamlQuoted, parseFrontmatter } = agentSkillPackageInternals;
  assert.equal(parseScalar('true'), true);
  assert.equal(parseScalar('null'), null);
  assert.equal(parseScalar('12.5'), 12.5);
  assert.deepEqual(parseScalar('[1,2]'), [1, 2]);
  assert.equal(parseScalar("'quoted'"), 'quoted');
  assert.equal(parseScalar('plain'), 'plain');
  assert.equal(yamlQuoted('a"b'), '"a\\"b"');
  assert.deepEqual(parseFrontmatter('name: x\nnested:\n  a: 1\nlist:\n  - one'), {
    name: 'x',
    nested: { a: 1 },
    list: ['one'],
  });
});
