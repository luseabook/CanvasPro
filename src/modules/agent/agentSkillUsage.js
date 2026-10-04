const MAX_SKILL_USAGE_ITEMS = 0x4,
  MAX_SKILL_USAGE_TEXT_CHARS = 0x7d0,
  MAX_SKILL_USAGE_DESCRIPTION_CHARS = 0x1f4,
  MAX_SKILL_USAGE_RESOURCE_NAMES = 0xc;
function truncateText(value, item) {
  const list = String(value || '')['trim']();
  return list['length'] <= item ? list : list['slice'](0x0, Math['max'](0x0, item - 0x3)) + '...';
}
function normalizeResourceNames(options = {}) {
  const list2 = Array['isArray'](options['resources']) ? options['resources'] : [],
    key = list2['map']((error) => String(error?.['name'] || '')['trim']())['filter'](Boolean);
  return [...new Set(key)]['slice'](0x0, MAX_SKILL_USAGE_RESOURCE_NAMES);
}
function includesText(index, result) {
  const list3 = String(index || '')['toLocaleLowerCase'](),
    data = String(result || '')
      ['trim']()
      ['toLocaleLowerCase']();
  return Boolean(data && list3['includes'](data));
}
export function resolveAgentSkillMatch(options2 = {}, target = '') {
  const matchedText = String(options2['id'] || '')['trim']();
  if (
    matchedText &&
    new RegExp(
      '(?:^|[^a-z0-9_-])\\$' + matchedText['replace'](/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![a-z0-9_-])',
      'i',
    )['test'](target)
  )
    return { kind: 'explicit', matchedText: '$' + matchedText };
  const matchedText2 = String(options2['title'] || '')['trim']();
  if (matchedText2 && includesText(target, matchedText2)) return { kind: 'title', matchedText: matchedText2 };
  const matchedText3 = (Array['isArray'](options2['triggers']) ? options2['triggers'] : [])
    ['map']((source) => String(source || '')['trim']())
    ['find']((next) => includesText(target, next));
  if (matchedText3) return { kind: 'trigger', matchedText: matchedText3 };
  if (matchedText && includesText(target, matchedText)) return { kind: 'id', matchedText: matchedText };
  return { kind: 'semantic', matchedText: '' };
}
export function normalizeAgentSkillUsageSnapshots(list4 = []) {
  return (Array['isArray'](list4) ? list4 : [])
    ['map']((options3 = {}) => {
      const id = String(options3['id'] || '')
        ['trim']()
        ['slice'](0x0, 0x40);
      if (!id) return null;
      const current = options3['match'] && typeof options3['match'] === 'object' ? options3['match'] : {};
      return {
        id: id,
        title: truncateText(options3['title'] || id, 0x78),
        description: truncateText(options3['description'] || '', MAX_SKILL_USAGE_DESCRIPTION_CHARS),
        source: String(options3['source'] || '')
          ['trim']()
          ['slice'](0x0, 0x28),
        match: {
          kind: String(current['kind'] || 'semantic')
            ['trim']()
            ['slice'](0x0, 0x20),
          matchedText: truncateText(current['matchedText'] || '', 0xa0),
        },
        instructions: truncateText(options3['instructions'] || '', MAX_SKILL_USAGE_TEXT_CHARS),
        resourceNames: [
          ...new Set(
            (Array['isArray'](options3['resourceNames']) ? options3['resourceNames'] : [])
              ['map']((entry) => truncateText(entry, 0xa0))
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
  const skillIds = normalizeAgentSkillUsageSnapshots(
    (Array['isArray'](context['skills']) ? context['skills'] : [])['map']((args) => ({
      ...args,
      match: resolveAgentSkillMatch(args, userMessage),
      resourceNames: normalizeResourceNames(args),
    })),
  );
  if (skillIds['length'] === 0x0) return null;
  return {
    type: 'skill.selected',
    channel: String(channel || '')
      ['trim']()
      ['slice'](0x0, 0x50),
    skillIds: skillIds['map']((record) => record['id']),
    skillSnapshots: skillIds,
  };
}
export const agentSkillUsageInternals = Object['freeze']({
  normalizeResourceNames: normalizeResourceNames,
  truncateText: truncateText,
});
