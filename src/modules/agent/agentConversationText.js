export const AGENT_MESSAGE_CONTENT_LIMIT = 32000;
export function compactAgentConversationText(value, item) {
  const list = String(value || '');
  if (list['length'] <= item) return list;
  const list2 = '\n[… middle omitted …]\n',
    key = Math['max'](0, item - list2['length']),
    index = Math['floor'](key * 0.4),
    result = key - index;
  return ('' + list['slice'](0, index) + list2 + (result ? list['slice'](-result) : ''))['slice'](
    0,
    item,
  );
}
