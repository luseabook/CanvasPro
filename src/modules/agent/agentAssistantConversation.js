import { isAgentConversationContinuation, isAgentCustomChoiceAnswer } from './agentConversationIntent.js';
function normalizeChoice(enabled) {
  if (!enabled || typeof enabled !== 'object') return null;
  const question = String(enabled.question || '')
      .trim()
      .slice(0, 600),
    map = new Set(),
    options = (Array.isArray(enabled.options) ? enabled.options : [])
      .flatMap((value) => {
        const id = String(value?.id || '')
            .trim()
            .slice(0, 80),
          label = String(value?.label || '')
            .trim()
            .slice(0, 240);
        if (!id || !label || map.has(id)) return [];
        return (map.add(id), [{ id: id, label: label }]);
      })
      .slice(0, 3);
  return question && options.length >= 2 ? { question: question, options: options } : null;
}
export function normalizeAgentAssistantContext(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object') return null;
  const skillIds = [
      ...new Set(
        (Array.isArray(enabled2.skillIds) ? enabled2.skillIds : []).filter(
          (item) => typeof item === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(item),
        ),
      ),
    ].slice(0, 2),
    choice = normalizeChoice(enabled2.choice);
  return { skillIds: skillIds, ...(choice ? { choice: choice } : {}) };
}
export function normalizeAgentAssistantReply(error) {
  let reply = String(typeof error === 'string' ? error : error?.reply || error?.message || '').trim(),
    choice2 = normalizeChoice(error?.choice || error);
  const key = /(?:^|\n)```agent-choice\s*\n([\s\S]*?)\n```\s*$/u.exec(reply);
  if (key) {
    try {
      choice2 = normalizeChoice(JSON.parse(key[1]));
    } catch {
      choice2 = null;
    }
    reply = reply.slice(0, key.index).trim();
  }
  if (choice2 && !reply.includes(choice2.question))
    reply = [reply, choice2.question].filter(Boolean).join('\n\n');
  return { status: 'chat', reply: reply, ...(choice2 || {}) };
}
function latestConversationMessage(list = []) {
  return (
    list.findLast((enabled3) => !enabled3.messageType || enabled3.messageType === 'text') || null
  );
}
export function getAgentPendingAssistantChoice(list2 = []) {
  const response = latestConversationMessage(list2);
  if (response?.role !== 'assistant' || response.status !== 'chat') return null;
  const args = normalizeAgentAssistantContext(response.assistantContext)?.choice;
  if (!args) return null;
  return {
    ...args,
    questionId:
      (response.itemId || response.turnId || response.ts + ':' + list2.length) +
      ':' +
      (response.replyVersions?.activeIndex || 0),
    responseChannel: 'assistant.message',
  };
}
export function getAgentContinuationSkillIds(index, result = []) {
  const agentPendingAssistantChoice = getAgentPendingAssistantChoice(result);
  if (
    !isAgentConversationContinuation(index) &&
    !(agentPendingAssistantChoice && isAgentCustomChoiceAnswer(index))
  )
    return [];
  const response2 = latestConversationMessage(result);
  return response2?.role === 'assistant' && ['chat', 'stopped', 'failed'].includes(response2.status)
    ? normalizeAgentAssistantContext(response2.assistantContext)?.skillIds || []
    : [];
}
