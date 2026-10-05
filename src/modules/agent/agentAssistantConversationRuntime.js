import {
  getAgentPendingAssistantChoice,
  normalizeAgentAssistantReply,
} from './agentAssistantConversation.js';
import {
  getAgentEditableTurn,
  appendAgentReplyVersion,
  selectAgentReplyVersion,
  AGENT_REPLY_VERSION_LIMIT,
} from './agentReplyVersions.js';
import { getAgentStreamingProse } from './agentStreamingProse.js';
import { agentConversationActionText } from './agentConversationActionText.js';
export function createAgentAssistantConversationRuntime({
  sessionStore: sessionStore,
  replyFromMessage: replyFromMessage,
  prepareExternalInformation: prepareExternalInformation,
  startRun: startRun,
  isActiveRun: isActiveRun,
  createStoppedReply: createStoppedReply,
  createFailedReply: createFailedReply,
  getSignal: getSignal,
  text: text,
  handleUserMessage: handleUserMessage,
} = {}) {
  let value = null;
  const run = () => sessionStore['getHistory']?.() || [],
    getPendingChoice = () => getAgentPendingAssistantChoice(run()),
    conversationId = () => String(sessionStore['getActiveConversation']?.()?.['id'] || ''),
    handler = (item) => sessionStore['emitAssistantStream']?.(item),
    handler2 = () => ({ ...createStoppedReply(), assistantHandled: true, stale: true }),
    handler3 = (notice) =>
      createFailedReply(notice?.['message'] || String(notice), {
        assistantHandled: true,
        notice: notice?.['message'] || String(notice),
        responseChannel: 'assistant.message',
        ...(getPendingChoice() || {}),
      }),
    history = (key) =>
      conversationId() === key['conversationId'] &&
      sessionStore['getCurrentRun']?.()?.['id'] === key['runId'],
    handler4 = (index) => sessionStore['isConversationLoaded']?.(index['conversationId']) ?? history(index),
    handler5 = (result) => {
      const agentEditableTurn = getAgentEditableTurn(run());
      if (
        value ||
        sessionStore['getPendingPlan']?.() ||
        sessionStore['getPendingLoopRun']?.() ||
        sessionStore['getPendingClarification']?.() ||
        !agentEditableTurn ||
        agentEditableTurn['itemId'] !== result
      )
        return null;
      return agentEditableTurn;
    };
  function run2(content, args = null) {
    if (value !== content) return;
    let data = null;
    try {
      if (args && history(content)) {
        if (content['revision']) {
          const list = run(),
            args2 = getAgentEditableTurn(list);
          if (args2?.['itemId'] !== content['revision']['itemId'])
            throw new Error('对话内容已变化，请重新发送消息');
          const replyVersions = appendAgentReplyVersion(args2, content['message'], args);
          sessionStore['replaceConversationMessages'](
            [
              ...list['slice'](0, -2),
              { ...args2['user'], content: content['message'] },
              { ...args2['assistant'], ...args, replyVersions: replyVersions },
            ],
            { conversationId: content['conversationId'] },
          );
        } else sessionStore['pushHistory']?.(args);
      }
    } catch (options) {
      data = options;
    }
    return (
      (value = null),
      handler({
        type: 'end',
        runId: content['runId'],
        history: history(content) ? run() : null,
        discard: !args || Boolean(data),
      }),
      data
    );
  }
  function stop() {
    const content2 = value;
    if (!content2) return false;
    const error = run2(
      content2,
      history(content2) && (content2['prose'] || !content2['revision'])
        ? {
            role: 'assistant',
            status: 'stopped',
            content: content2['prose'] || text('runStopped'),
            assistantContext: { skillIds: content2['skillIds'] },
          }
        : null,
    );
    return { error: error };
  }
  return {
    getPendingChoice: getPendingChoice,
    stop: stop,
    revise({ itemId: itemId, message: message } = {}) {
      const revision = handler5(itemId);
      if (!revision) return createFailedReply(text('noPendingClarification'));
      if (revision['assistant']['replyVersions']?.['versions']['length'] >= AGENT_REPLY_VERSION_LIMIT)
        return createFailedReply(agentConversationActionText('limit'));
      const content3 = String(message ?? revision['user']['content'])['trim']();
      if (!content3) return createFailedReply(text('emptyMessage'));
      const history2 = [...run()['slice'](0, -2), { ...revision['user'], content: content3 }];
      return this['handle'](
        content3,
        {
          revision: revision,
          history: history2,
          conversationHistory: history2,
          assistantChoice: true,
          selectedSkillIds: revision['assistant']['assistantContext']['skillIds'] || [],
        },
        startRun(),
      );
    },
    selectVersion({ itemId: itemId2, index: index2 } = {}) {
      if (!handler5(itemId2)) return createFailedReply(text('noPendingClarification'));
      const agentReplyVersion = selectAgentReplyVersion(run(), itemId2, index2);
      try {
        if (
          !agentReplyVersion ||
          !sessionStore['replaceConversationMessages'](agentReplyVersion, {
            conversationId: conversationId(),
          })
        )
          return createFailedReply(text('noPendingClarification'));
        return { ok: true, status: 'chat', assistantHandled: true, ...(getPendingChoice() || {}) };
      } catch (target) {
        return handler3(target);
      }
    },
    answerChoice(source, { questionId: questionId } = {}) {
      const next = getPendingChoice(),
        enabled = next?.['options']['find']((current) => current['id'] === source);
      if (!enabled || next['questionId'] !== questionId)
        return createFailedReply(text('noPendingClarification'));
      return handleUserMessage(enabled['label'], { assistantChoice: true });
    },
    async handle(message2, revision2, runId) {
      const signal = getSignal(),
        text2 = {
          runId: runId,
          conversationId: conversationId(),
          message: message2,
          revision: revision2['revision'],
          prose: '',
          skillIds: revision2['selectedSkillIds'] || [],
        };
      ((value = text2), handler({ type: 'start', runId: runId, revision: Boolean(text2['revision']) }));
      try {
        const externalInformation = await prepareExternalInformation({
          message: message2,
          documentFiles: revision2['documentFiles'],
          signal: signal,
        });
        if (value !== text2 || !isActiveRun(runId) || signal?.['aborted'] || !history(text2))
          return handler2();
        const skillIds = await replyFromMessage(message2, {
          ...revision2,
          externalInformation: externalInformation,
          signal: signal,
          onSkillsSelected: (list2) => {
            text2['skillIds'] = list2['map']((entry) => entry['id']);
          },
          onText: (record) => {
            if (value !== text2 || !isActiveRun(runId) || signal?.['aborted'] || !handler4(text2)) return;
            ((text2['prose'] = getAgentStreamingProse(record)),
              handler({ type: 'text', runId: runId, text: text2['prose'] }));
          },
        });
        if (value !== text2 || !isActiveRun(runId) || signal?.['aborted'] || !history(text2))
          return handler2();
        const content4 = normalizeAgentAssistantReply(skillIds);
        if (!content4['reply']) throw new Error(text('plannerFailed'));
        const payload = run2(text2, {
          role: 'assistant',
          status: 'chat',
          content: content4['reply'],
          assistantContext: {
            skillIds: skillIds['selectedSkillIds'] || [],
            ...(content4['options']
              ? { choice: { question: content4['question'], options: content4['options'] } }
              : {}),
          },
        });
        if (payload)
          return (
            sessionStore['setCurrentRun']?.({ id: runId, status: 'failed', stopped: false }),
            handler3(payload)
          );
        return (
          sessionStore['setCurrentRun']?.({ id: runId, status: 'chat', stopped: false }),
          {
            ok: true,
            ...content4,
            assistantHandled: true,
            responseChannel: 'assistant.message',
            ...(getPendingChoice() || {}),
          }
        );
      } catch (error2) {
        if (value !== text2 || !isActiveRun(runId) || signal?.['aborted'] || !history(text2))
          return handler2();
        const state = error2?.['message'] || text('plannerFailed'),
          config = run2(
            text2,
            text2['prose'] || !text2['revision']
              ? {
                  role: 'assistant',
                  status: 'failed',
                  content: text2['prose'] || state,
                  assistantContext: { skillIds: text2['skillIds'] },
                }
              : null,
          );
        return (
          sessionStore['setCurrentRun']?.({ id: runId, status: 'failed', stopped: false }),
          handler3(config || state)
        );
      }
    },
  };
}
