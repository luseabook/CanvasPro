export const AGENT_MESSAGE_CONTENT_LIMIT = 0x7d00;
export function compactAgentConversationText(_0x46bf7a, _0xea8773) {
  const _0x5e52b2 = String(_0x46bf7a || '');
  if (_0x5e52b2['length'] <= _0xea8773) return _0x5e52b2;
  const _0x1151c2 = '\x0a[…\x20middle\x20omitted\x20…]\x0a',
    _0x1e2433 = Math['max'](0x0, _0xea8773 - _0x1151c2['length']),
    _0x348db3 = Math['floor'](_0x1e2433 * 0.4),
    _0x4b0e4a = _0x1e2433 - _0x348db3;
  return ('' +
    _0x5e52b2['slice'](0x0, _0x348db3) +
    _0x1151c2 +
    (_0x4b0e4a ? _0x5e52b2['slice'](-_0x4b0e4a) : ''))['slice'](0x0, _0xea8773);
}
