import { normalizeAgentAssistantContext } from './agentAssistantConversation.js';
import { AGENT_MESSAGE_CONTENT_LIMIT, compactAgentConversationText } from './agentConversationText.js';
export const AGENT_REPLY_VERSION_LIMIT = 20;
export const agentMessageKey = (value) => String(value?.['itemId'] || value?.['ts'] + ':' + value?.['role']);
export function normalizeAgentReplyVersions(item) {
  if (!Array['isArray'](item?.['versions'])) return null;
  const versions2 = item['versions']
    ['slice'](0, AGENT_REPLY_VERSION_LIMIT)
    ['map']((response) => ({
      prompt: compactAgentConversationText(response?.['prompt'], AGENT_MESSAGE_CONTENT_LIMIT),
      reply: compactAgentConversationText(response?.['reply'], AGENT_MESSAGE_CONTENT_LIMIT),
      status: ['chat', 'stopped', 'failed']['includes'](response?.['status']) ? response['status'] : 'chat',
      assistantContext: normalizeAgentAssistantContext(response?.['assistantContext']) || { skillIds: [] },
    }))
    ['filter']((key) => key['prompt'] && key['reply']);
  if (!versions2['length']) return null;
  const activeIndex2 = Math['min'](
    versions2['length'] - 1,
    Math['max'](0, Math['trunc'](Number(item['activeIndex'])) || 0),
  );
  return { activeIndex: activeIndex2, versions: versions2 };
}
export function normalizeAgentReplyVersionChange(versions3) {
  if (!versions3 || !Array['isArray'](versions3['append'])) return null;
  return {
    activeIndex: Math['min'](
      AGENT_REPLY_VERSION_LIMIT - 1,
      Math['max'](0, Math['trunc'](Number(versions3['activeIndex'])) || 0),
    ),
    append: normalizeAgentReplyVersions({ versions: versions3['append'] })?.['versions'] || [],
  };
}
export function createAgentReplyVersionChange(index, result) {
  const activeIndex3 = normalizeAgentReplyVersions(index['replyVersions']);
  if (!activeIndex3) return null;
  const agentReplyVersions = normalizeAgentReplyVersions(result?.['replyVersions']);
  return {
    activeIndex: activeIndex3['activeIndex'],
    append: activeIndex3['versions']['slice'](agentReplyVersions?.['versions']['length'] || 0),
  };
}
export function applyAgentReplyVersionChange(data, activeIndex4) {
  const agentReplyVersions2 = normalizeAgentReplyVersions(data?.['replyVersions']);
  return normalizeAgentReplyVersions({
    activeIndex: activeIndex4['activeIndex'],
    versions: [...(agentReplyVersions2?.['versions'] || []), ...activeIndex4['append']],
  });
}
export function getAgentEditableTurn(list = []) {
  const assistant = list['at'](-1),
    user = list['at'](-2);
  if (
    user?.['role'] !== 'user' ||
    assistant?.['role'] !== 'assistant' ||
    !assistant['assistantContext'] ||
    !['chat', 'stopped', 'failed']['includes'](assistant['status']) ||
    user['inputRefs']?.['length'] ||
    (user['messageType'] && user['messageType'] !== 'text') ||
    (assistant['messageType'] && assistant['messageType'] !== 'text')
  )
    return null;
  return { user: user, assistant: assistant, itemId: agentMessageKey(assistant) };
}
export function appendAgentReplyVersion(prompt, prompt2, reply) {
  const args = normalizeAgentReplyVersions(prompt['assistant']['replyVersions']) || {
    activeIndex: 0,
    versions: [
      {
        prompt: prompt['user']['content'],
        reply: prompt['assistant']['content'],
        status: prompt['assistant']['status'],
        assistantContext: prompt['assistant']['assistantContext'],
      },
    ],
  };
  if (args['versions']['length'] >= AGENT_REPLY_VERSION_LIMIT)
    throw new Error('回答版本已达上限，请发送新消息继续');
  const activeIndex5 = [
    ...args['versions'],
    {
      prompt: prompt2,
      reply: reply['content'],
      status: reply['status'],
      assistantContext: reply['assistantContext'],
    },
  ];
  return normalizeAgentReplyVersions({ activeIndex: activeIndex5['length'] - 1, versions: activeIndex5 });
}
export function selectAgentReplyVersion(list2, options, activeIndex6) {
  const args2 = getAgentEditableTurn(list2),
    args3 = normalizeAgentReplyVersions(args2?.['assistant']['replyVersions']);
  if (
    !args2 ||
    args2['itemId'] !== options ||
    !Number['isInteger'](activeIndex6) ||
    !args3?.['versions'][activeIndex6]
  )
    return null;
  const content = args3['versions'][activeIndex6];
  return [
    ...list2['slice'](0, -2),
    { ...args2['user'], content: content['prompt'] },
    {
      ...args2['assistant'],
      content: content['reply'],
      status: content['status'],
      assistantContext: content['assistantContext'],
      replyVersions: { ...args3, activeIndex: activeIndex6 },
    },
  ];
}
