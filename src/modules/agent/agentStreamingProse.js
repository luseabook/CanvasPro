export function getAgentStreamingProse(value) {
  const list = String(value || ''),
    item = /(?:^|\n)```agent-choice(?:\s|$)/u['exec'](list);
  if (item) return list['slice'](0, item['index'])['trimEnd']();
  const key = list['lastIndexOf']('\n') + 1,
    index = list['slice'](key);
  if ('```agent-choice'['startsWith'](index)) return list['slice'](0, key)['trimEnd']();
  return list;
}
