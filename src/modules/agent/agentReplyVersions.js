import { normalizeAgentAssistantContext } from './agentAssistantConversation.js';
import { AGENT_MESSAGE_CONTENT_LIMIT, compactAgentConversationText } from './agentConversationText.js';
export const AGENT_REPLY_VERSION_LIMIT = 0x14;
export const agentMessageKey = (_0x4cae4d) =>
  String(_0x4cae4d?.['itemId'] || _0x4cae4d?.['ts'] + ':' + _0x4cae4d?.['role']);
export function normalizeAgentReplyVersions(_0x33a580) {
  if (!Array['isArray'](_0x33a580?.['versions'])) return null;
  const _0x51a5b7 = _0x33a580['versions']
    ['slice'](0x0, AGENT_REPLY_VERSION_LIMIT)
    ['map']((_0x22bfbd) => ({
      prompt: compactAgentConversationText(_0x22bfbd?.['prompt'], AGENT_MESSAGE_CONTENT_LIMIT),
      reply: compactAgentConversationText(_0x22bfbd?.['reply'], AGENT_MESSAGE_CONTENT_LIMIT),
      status: ['chat', 'stopped', 'failed']['includes'](_0x22bfbd?.['status']) ? _0x22bfbd['status'] : 'chat',
      assistantContext: normalizeAgentAssistantContext(_0x22bfbd?.['assistantContext']) || { skillIds: [] },
    }))
    ['filter']((_0x1b52e5) => _0x1b52e5['prompt'] && _0x1b52e5['reply']);
  if (!_0x51a5b7['length']) return null;
  const _0x47f364 = Math['min'](
    _0x51a5b7['length'] - 0x1,
    Math['max'](0x0, Math['trunc'](Number(_0x33a580['activeIndex'])) || 0x0),
  );
  return { activeIndex: _0x47f364, versions: _0x51a5b7 };
}
export function normalizeAgentReplyVersionChange(_0x990337) {
  if (!_0x990337 || !Array['isArray'](_0x990337['append'])) return null;
  return {
    activeIndex: Math['min'](
      AGENT_REPLY_VERSION_LIMIT - 0x1,
      Math['max'](0x0, Math['trunc'](Number(_0x990337['activeIndex'])) || 0x0),
    ),
    append: normalizeAgentReplyVersions({ versions: _0x990337['append'] })?.['versions'] || [],
  };
}
export function createAgentReplyVersionChange(_0x18718e, _0xa7ea5f) {
  const _0x391866 = normalizeAgentReplyVersions(_0x18718e['replyVersions']);
  if (!_0x391866) return null;
  const _0x5709ce = normalizeAgentReplyVersions(_0xa7ea5f?.['replyVersions']);
  return {
    activeIndex: _0x391866['activeIndex'],
    append: _0x391866['versions']['slice'](_0x5709ce?.['versions']['length'] || 0x0),
  };
}
export function applyAgentReplyVersionChange(_0x3218d6, _0x3ceda7) {
  const _0x1eaa2b = normalizeAgentReplyVersions(_0x3218d6?.['replyVersions']);
  return normalizeAgentReplyVersions({
    activeIndex: _0x3ceda7['activeIndex'],
    versions: [...(_0x1eaa2b?.['versions'] || []), ..._0x3ceda7['append']],
  });
}
export function getAgentEditableTurn(_0x4fbc69 = []) {
  const _0x18cbc0 = _0x4fbc69['at'](-0x1),
    _0x1ebdb0 = _0x4fbc69['at'](-0x2);
  if (
    _0x1ebdb0?.['role'] !== 'user' ||
    _0x18cbc0?.['role'] !== 'assistant' ||
    !_0x18cbc0['assistantContext'] ||
    !['chat', 'stopped', 'failed']['includes'](_0x18cbc0['status']) ||
    _0x1ebdb0['inputRefs']?.['length'] ||
    (_0x1ebdb0['messageType'] && _0x1ebdb0['messageType'] !== 'text') ||
    (_0x18cbc0['messageType'] && _0x18cbc0['messageType'] !== 'text')
  )
    return null;
  return { user: _0x1ebdb0, assistant: _0x18cbc0, itemId: agentMessageKey(_0x18cbc0) };
}
export function appendAgentReplyVersion(_0x2f965b, _0x839a7a, _0x281a23) {
  const _0x5243c3 = normalizeAgentReplyVersions(_0x2f965b['assistant']['replyVersions']) || {
    activeIndex: 0x0,
    versions: [
      {
        prompt: _0x2f965b['user']['content'],
        reply: _0x2f965b['assistant']['content'],
        status: _0x2f965b['assistant']['status'],
        assistantContext: _0x2f965b['assistant']['assistantContext'],
      },
    ],
  };
  if (_0x5243c3['versions']['length'] >= AGENT_REPLY_VERSION_LIMIT)
    throw new Error('回答版本已达上限，请发送新消息继续');
  const _0x242cf8 = [
    ..._0x5243c3['versions'],
    {
      prompt: _0x839a7a,
      reply: _0x281a23['content'],
      status: _0x281a23['status'],
      assistantContext: _0x281a23['assistantContext'],
    },
  ];
  return normalizeAgentReplyVersions({ activeIndex: _0x242cf8['length'] - 0x1, versions: _0x242cf8 });
}
export function selectAgentReplyVersion(_0x1c125b, _0x242e94, _0x14aabe) {
  const _0x520e70 = getAgentEditableTurn(_0x1c125b),
    _0x312409 = normalizeAgentReplyVersions(_0x520e70?.['assistant']['replyVersions']);
  if (
    !_0x520e70 ||
    _0x520e70['itemId'] !== _0x242e94 ||
    !Number['isInteger'](_0x14aabe) ||
    !_0x312409?.['versions'][_0x14aabe]
  )
    return null;
  const _0x4a4ee3 = _0x312409['versions'][_0x14aabe];
  return [
    ..._0x1c125b['slice'](0x0, -0x2),
    { ..._0x520e70['user'], content: _0x4a4ee3['prompt'] },
    {
      ..._0x520e70['assistant'],
      content: _0x4a4ee3['reply'],
      status: _0x4a4ee3['status'],
      assistantContext: _0x4a4ee3['assistantContext'],
      replyVersions: { ..._0x312409, activeIndex: _0x14aabe },
    },
  ];
}
