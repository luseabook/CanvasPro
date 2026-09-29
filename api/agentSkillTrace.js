const MAX_TRACE_SKILLS = 0x4,
  MAX_TRACE_INSTRUCTIONS_CHARS = 0x7d0,
  MAX_TRACE_RESOURCE_NAMES = 0xc;
function truncateText(_0x4a07aa, _0x495714) {
  const _0x277863 = String(_0x4a07aa || '')['trim']();
  return _0x277863['length'] <= _0x495714
    ? _0x277863
    : _0x277863['slice'](0x0, Math['max'](0x0, _0x495714 - 0x3)) + '...';
}
function normalizePromptSkill(_0x327fed = {}) {
  const _0x3853a2 = String(_0x327fed['id'] || '')
    ['trim']()
    ['slice'](0x0, 0x40);
  if (!_0x3853a2) return null;
  const _0x18e76b = [
    ...(Array['isArray'](_0x327fed['resourceNames']) ? _0x327fed['resourceNames'] : []),
    ...(Array['isArray'](_0x327fed['resources'])
      ? _0x327fed['resources']['map']((_0x4776e1) => _0x4776e1?.['name'])
      : []),
  ];
  return {
    id: _0x3853a2,
    title: truncateText(_0x327fed['title'] || _0x3853a2, 0x78),
    description: truncateText(_0x327fed['description'] || '', 0x1f4),
    source: String(_0x327fed['source'] || '')
      ['trim']()
      ['slice'](0x0, 0x28),
    instructions: truncateText(_0x327fed['instructions'] || '', MAX_TRACE_INSTRUCTIONS_CHARS),
    resourceNames: [
      ...new Set(_0x18e76b['map']((_0x2f1fa2) => truncateText(_0x2f1fa2, 0xa0))['filter'](Boolean)),
    ]['slice'](0x0, MAX_TRACE_RESOURCE_NAMES),
  };
}
export function buildInjectedAgentSkillTrace(_0x366d27 = '', { channel: channel = '' } = {}) {
  let _0x1dd430 = null;
  try {
    _0x1dd430 = JSON['parse'](String(_0x366d27 || ''));
  } catch {
    return null;
  }
  const _0x19b1f9 = Array['isArray'](_0x1dd430?.['skills'])
      ? _0x1dd430['skills']
      : Array['isArray'](_0x1dd430?.['context']?.['skills'])
        ? _0x1dd430['context']['skills']
        : [],
    _0x19809b = _0x19b1f9['map'](normalizePromptSkill)['filter'](Boolean)['slice'](0x0, MAX_TRACE_SKILLS);
  if (_0x19809b['length'] === 0x0) return null;
  return {
    type: 'agent_skill_context_injected',
    channel: String(channel || '')
      ['trim']()
      ['slice'](0x0, 0x50),
    skillIds: _0x19809b['map']((_0x2f3678) => _0x2f3678['id']),
    skills: _0x19809b,
  };
}
