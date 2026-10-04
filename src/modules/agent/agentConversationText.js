export const AGENT_MESSAGE_CONTENT_LIMIT = 0x7d00;
export function compactAgentConversationText(value, item) {
  const list = String(value || '');
  if (list['length'] <= item) return list;
  const list2 = '\x0a[…\x20middle\x20omitted\x20…]\x0a',
    key = Math['max'](0x0, item - list2['length']),
    index = Math['floor'](key * 0.4),
    result = key - index;
  return ('' + list['slice'](0x0, index) + list2 + (result ? list['slice'](-result) : ''))['slice'](
    0x0,
    item,
  );
}
