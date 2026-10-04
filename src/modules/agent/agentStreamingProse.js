export function getAgentStreamingProse(value) {
  const list = String(value || ''),
    item = /(?:^|\n)```agent-choice(?:\s|$)/u['exec'](list);
  if (item) return list['slice'](0x0, item['index'])['trimEnd']();
  const key = list['lastIndexOf']('\x0a') + 0x1,
    index = list['slice'](key);
  if ('```agent-choice'['startsWith'](index)) return list['slice'](0x0, key)['trimEnd']();
  return list;
}
