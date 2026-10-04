const MAX_TRACE_SKILLS = 0x4,
  MAX_TRACE_INSTRUCTIONS_CHARS = 0x7d0,
  MAX_TRACE_RESOURCE_NAMES = 0xc;
function truncateText(value, item) {
  const list = String(value || '')['trim']();
  return list['length'] <= item ? list : list['slice'](0x0, Math['max'](0x0, item - 0x3)) + '...';
}
function normalizePromptSkill(options = {}) {
  const id = String(options['id'] || '')
    ['trim']()
    ['slice'](0x0, 0x40);
  if (!id) return null;
  const list2 = [
    ...(Array['isArray'](options['resourceNames']) ? options['resourceNames'] : []),
    ...(Array['isArray'](options['resources'])
      ? options['resources']['map']((error) => error?.['name'])
      : []),
  ];
  return {
    id: id,
    title: truncateText(options['title'] || id, 0x78),
    description: truncateText(options['description'] || '', 0x1f4),
    source: String(options['source'] || '')
      ['trim']()
      ['slice'](0x0, 0x28),
    instructions: truncateText(options['instructions'] || '', MAX_TRACE_INSTRUCTIONS_CHARS),
    resourceNames: [...new Set(list2['map']((key) => truncateText(key, 0xa0))['filter'](Boolean))]['slice'](
      0x0,
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
    skillIds = list3['map'](normalizePromptSkill)['filter'](Boolean)['slice'](0x0, MAX_TRACE_SKILLS);
  if (skillIds['length'] === 0x0) return null;
  return {
    type: 'agent_skill_context_injected',
    channel: String(channel || '')
      ['trim']()
      ['slice'](0x0, 0x50),
    skillIds: skillIds['map']((data) => data['id']),
    skills: skillIds,
  };
}
