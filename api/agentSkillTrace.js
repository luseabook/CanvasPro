const MAX_TRACE_SKILLS = 4,
  MAX_TRACE_INSTRUCTIONS_CHARS = 2000,
  MAX_TRACE_RESOURCE_NAMES = 12;
function truncateText(value, item) {
  const list = String(value || '')['trim']();
  return list['length'] <= item ? list : list['slice'](0, Math['max'](0, item - 3)) + '...';
}
function normalizePromptSkill(options = {}) {
  const id = String(options['id'] || '')
    ['trim']()
    ['slice'](0, 64);
  if (!id) return null;
  const list2 = [
    ...(Array['isArray'](options['resourceNames']) ? options['resourceNames'] : []),
    ...(Array['isArray'](options['resources'])
      ? options['resources']['map']((error) => error?.['name'])
      : []),
  ];
  return {
    id: id,
    title: truncateText(options['title'] || id, 120),
    description: truncateText(options['description'] || '', 500),
    source: String(options['source'] || '')
      ['trim']()
      ['slice'](0, 40),
    instructions: truncateText(options['instructions'] || '', MAX_TRACE_INSTRUCTIONS_CHARS),
    resourceNames: [...new Set(list2['map']((key) => truncateText(key, 160))['filter'](Boolean))]['slice'](
      0,
      MAX_TRACE_RESOURCE_NAMES,
    ),
  };
}
export function buildInjectedAgentSkillTrace(index = '', { channel: channel = '' } = {}) {
  let result = null;
  try {
    result = JSON['parse'](String(index || ''));
  } catch {
    return null;
  }
  const list3 = Array['isArray'](result?.['skills'])
      ? result['skills']
      : Array['isArray'](result?.['context']?.['skills'])
        ? result['context']['skills']
        : [],
    skillIds = list3['map'](normalizePromptSkill)['filter'](Boolean)['slice'](0, MAX_TRACE_SKILLS);
  if (skillIds['length'] === 0) return null;
  return {
    type: 'agent_skill_context_injected',
    channel: String(channel || '')
      ['trim']()
      ['slice'](0, 80),
    skillIds: skillIds['map']((data) => data['id']),
    skills: skillIds,
  };
}
