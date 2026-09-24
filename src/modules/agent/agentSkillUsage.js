const MAX_SKILL_USAGE_ITEMS = 0x4,
  MAX_SKILL_USAGE_TEXT_CHARS = 0x7d0,
  MAX_SKILL_USAGE_DESCRIPTION_CHARS = 0x1f4,
  MAX_SKILL_USAGE_RESOURCE_NAMES = 0xc;
function truncateText(_0xa7dbad, _0x59fcf4) {
  const _0xfc099b = String(_0xa7dbad || '')['trim']();
  return _0xfc099b['length'] <= _0x59fcf4
    ? _0xfc099b
    : _0xfc099b['slice'](0x0, Math['max'](0x0, _0x59fcf4 - 0x3)) + '...';
}
function normalizeResourceNames(_0x4f7175 = {}) {
  const _0x40287a = Array['isArray'](_0x4f7175['resources']) ? _0x4f7175['resources'] : [],
    _0x216921 = _0x40287a['map']((_0x284a3c) => String(_0x284a3c?.['name'] || '')['trim']())['filter'](
      Boolean,
    );
  return [...new Set(_0x216921)]['slice'](0x0, MAX_SKILL_USAGE_RESOURCE_NAMES);
}
function includesText(_0x13a768, _0x552444) {
  const _0x34cd87 = String(_0x13a768 || '')['toLocaleLowerCase'](),
    _0x4b35ff = String(_0x552444 || '')
      ['trim']()
      ['toLocaleLowerCase']();
  return Boolean(_0x4b35ff && _0x34cd87['includes'](_0x4b35ff));
}
export function resolveAgentSkillMatch(_0x350a17 = {}, _0x22967f = '') {
  const _0x51d35c = String(_0x350a17['id'] || '')['trim']();
  if (
    _0x51d35c &&
    new RegExp(
      '(?:^|[^a-z0-9_-])\\$' + _0x51d35c['replace'](/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![a-z0-9_-])',
      'i',
    )['test'](_0x22967f)
  )
    return { kind: 'explicit', matchedText: '$' + _0x51d35c };
  const _0x36ff9d = String(_0x350a17['title'] || '')['trim']();
  if (_0x36ff9d && includesText(_0x22967f, _0x36ff9d)) return { kind: 'title', matchedText: _0x36ff9d };
  const _0x300eed = (Array['isArray'](_0x350a17['triggers']) ? _0x350a17['triggers'] : [])
    ['map']((_0x5ea7a4) => String(_0x5ea7a4 || '')['trim']())
    ['find']((_0x291f70) => includesText(_0x22967f, _0x291f70));
  if (_0x300eed) return { kind: 'trigger', matchedText: _0x300eed };
  if (_0x51d35c && includesText(_0x22967f, _0x51d35c)) return { kind: 'id', matchedText: _0x51d35c };
  return { kind: 'semantic', matchedText: '' };
}
export function normalizeAgentSkillUsageSnapshots(_0x5d7be9 = []) {
  return (Array['isArray'](_0x5d7be9) ? _0x5d7be9 : [])
    ['map']((_0x3b0b76 = {}) => {
      const _0xc3e31e = String(_0x3b0b76['id'] || '')
        ['trim']()
        ['slice'](0x0, 0x40);
      if (!_0xc3e31e) return null;
      const _0xe296a7 =
        _0x3b0b76['match'] && typeof _0x3b0b76['match'] === 'object' ? _0x3b0b76['match'] : {};
      return {
        id: _0xc3e31e,
        title: truncateText(_0x3b0b76['title'] || _0xc3e31e, 0x78),
        description: truncateText(_0x3b0b76['description'] || '', MAX_SKILL_USAGE_DESCRIPTION_CHARS),
        source: String(_0x3b0b76['source'] || '')
          ['trim']()
          ['slice'](0x0, 0x28),
        match: {
          kind: String(_0xe296a7['kind'] || 'semantic')
            ['trim']()
            ['slice'](0x0, 0x20),
          matchedText: truncateText(_0xe296a7['matchedText'] || '', 0xa0),
        },
        instructions: truncateText(_0x3b0b76['instructions'] || '', MAX_SKILL_USAGE_TEXT_CHARS),
        resourceNames: [
          ...new Set(
            (Array['isArray'](_0x3b0b76['resourceNames']) ? _0x3b0b76['resourceNames'] : [])
              ['map']((_0x2796f0) => truncateText(_0x2796f0, 0xa0))
              ['filter'](Boolean),
          ),
        ]['slice'](0x0, MAX_SKILL_USAGE_RESOURCE_NAMES),
      };
    })
    ['filter'](Boolean)
    ['slice'](0x0, MAX_SKILL_USAGE_ITEMS);
}
export function buildSelectedAgentSkillUsage({
  context: context = {},
  userMessage: userMessage = '',
  channel: channel = '',
} = {}) {
  const _0x5b93e5 = normalizeAgentSkillUsageSnapshots(
    (Array['isArray'](context['skills']) ? context['skills'] : [])['map']((_0x50d2d6) => ({
      ..._0x50d2d6,
      match: resolveAgentSkillMatch(_0x50d2d6, userMessage),
      resourceNames: normalizeResourceNames(_0x50d2d6),
    })),
  );
  if (_0x5b93e5['length'] === 0x0) return null;
  return {
    type: 'skill.selected',
    channel: String(channel || '')
      ['trim']()
      ['slice'](0x0, 0x50),
    skillIds: _0x5b93e5['map']((_0x7531f6) => _0x7531f6['id']),
    skillSnapshots: _0x5b93e5,
  };
}
export const agentSkillUsageInternals = Object['freeze']({
  normalizeResourceNames: normalizeResourceNames,
  truncateText: truncateText,
});
