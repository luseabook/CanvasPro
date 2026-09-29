import test from 'node:test';
import assert from 'node:assert/strict';

import { buildInjectedAgentSkillTrace } from './agentSkillTrace.js';

test('agentSkillTrace: normalizes, deduplicates, and limits injected skill metadata', () => {
  const skills = Array.from({ length: 5 }, (_, index) => ({
    id: `skill-${index + 1}`,
    title: `Skill ${index + 1}`,
    description: `Description ${index + 1}`,
    resourceNames: ['a', 'a', 'b', ...Array.from({ length: 15 }, (_, n) => `r-${n}`)],
    instructions: 'x'.repeat(2100),
  }));
  const trace = buildInjectedAgentSkillTrace(JSON.stringify({ skills }), {
    channel: 'agent.chat',
  });

  assert.equal(trace.type, 'agent_skill_context_injected');
  assert.equal(trace.channel, 'agent.chat');
  assert.deepEqual(trace.skillIds, ['skill-1', 'skill-2', 'skill-3', 'skill-4']);
  assert.equal(trace.skills.length, 4);
  assert.equal(trace.skills[0].resourceNames.length, 12);
  assert.deepEqual(trace.skills[0].resourceNames.slice(0, 3), ['a', 'b', 'r-0']);
  assert.equal(trace.skills[0].instructions.length, 2000);
  assert.match(trace.skills[0].instructions, /\.\.\.$/);
});

test('agentSkillTrace: supports nested context and rejects invalid or empty payloads', () => {
  const nested = buildInjectedAgentSkillTrace(
    JSON.stringify({
      context: {
        skills: [
          {
            id: 'nested',
            title: '',
            resources: [{ name: 'resource.md' }, { name: ' resource.md ' }],
          },
        ],
      },
    }),
  );

  assert.equal(nested.skillIds[0], 'nested');
  assert.equal(nested.skills[0].title, 'nested');
  assert.deepEqual(nested.skills[0].resourceNames, ['resource.md']);
  assert.equal(buildInjectedAgentSkillTrace('not-json'), null);
  assert.equal(buildInjectedAgentSkillTrace(JSON.stringify({ skills: [] })), null);
  assert.equal(buildInjectedAgentSkillTrace(JSON.stringify({ skills: [{ title: 'missing id' }] })), null);
});
