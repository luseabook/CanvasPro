import { createAgentAssistantConversationRuntime } from './agentAssistantConversationRuntime.js';
export function createAgentTextConversationRuntime({
  sessionStore: sessionStore,
  assistant: assistant,
  getContext: getContext = () => ({}),
} = {}) {
  let abortController = null,
    value = 0x0,
    id = '',
    enabled = ![];
  const createFailedReply = (item, args = {}) => ({
      ok: ![],
      status: 'failed',
      reply: String(item),
      ...args,
    }),
    createStoppedReply = () => ({ ok: !![], status: 'stopped', reply: '已停止生成' });
  function startRun() {
    return (
      (abortController = new AbortController()),
      (id = 'agent-text-' + ++value),
      sessionStore['setCurrentRun']({ id: id, status: 'planning', stopped: ![] }),
      id
    );
  }
  const getPendingAssistantChoice = createAgentAssistantConversationRuntime({
    sessionStore: sessionStore,
    startRun: startRun,
    isActiveRun: (key) => !enabled && id === key,
    getSignal: () => abortController?.['signal'],
    createStoppedReply: createStoppedReply,
    createFailedReply: createFailedReply,
    text: (index) =>
      ({ runStopped: '已停止生成', emptyMessage: '请输入创作要求', plannerFailed: '回复失败，请重试' })[
        index
      ] || '当前对话已变化，请重新发送',
    prepareExternalInformation: async () => null,
    replyFromMessage: (message, history) =>
      assistant({
        ...history,
        message: message,
        context: getContext(),
        history: history['history'] || sessionStore['getHistory'](),
      }),
    handleUserMessage: handleUserMessage,
  });
  async function handleUserMessage(result) {
    if (enabled) return createFailedReply('会话已关闭');
    if (
      abortController &&
      !abortController['signal']['aborted'] &&
      sessionStore['getCurrentRun']()?.['status'] === 'planning'
    )
      return createFailedReply('请等待当前回复或先停止');
    const content = String(result || '')['trim']();
    if (!content) return createFailedReply('请输入创作要求');
    return (
      sessionStore['pushHistory']({ role: 'user', content: content }),
      getPendingAssistantChoice['handle'](content, {}, startRun())
    );
  }
  function stop() {
    const notice = getPendingAssistantChoice['stop']();
    return (
      abortController?.['abort'](),
      (id = ''),
      sessionStore['stopCurrentRun'](),
      { ...createStoppedReply(), ...(notice?.['error'] ? { notice: notice['error']['message'] } : {}) }
    );
  }
  return {
    sessionStore: sessionStore,
    handleUserMessage: handleUserMessage,
    stop: stop,
    getPendingAssistantChoice: getPendingAssistantChoice['getPendingChoice'],
    answerAssistantChoice: getPendingAssistantChoice['answerChoice'],
    reviseAssistantTurn: (data) => getPendingAssistantChoice['revise'](data),
    selectAssistantVersion: getPendingAssistantChoice['selectVersion'],
    listConversations: () => sessionStore['listConversations'](),
    getActiveConversation: () => sessionStore['getActiveConversation'](),
    startNewConversation() {
      return (stop(), sessionStore['startNewConversation']());
    },
    switchConversation(options) {
      return (stop(), sessionStore['switchConversation'](options));
    },
    deleteConversation(target) {
      if (String(target || '')['trim']() === sessionStore['getActiveConversation']()?.['id']) stop();
      return sessionStore['deleteConversation'](target);
    },
    dispose() {
      try {
        stop();
      } catch {
      } finally {
        (abortController?.['abort'](), (id = ''), (enabled = !![]));
      }
    },
  };
}
