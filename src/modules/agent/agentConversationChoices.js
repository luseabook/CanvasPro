import { createAgentElement } from './agentPanelElements.js';
export function renderAgentConversationChoices(
  el,
  questionId,
  value,
  handler,
  item = null,
  {
    onAnswer: onAnswer = null,
    onWaitingStart: onWaitingStart = null,
    onWaitingEnd: onWaitingEnd = null,
  } = {},
) {
  el.replaceChildren();
  const list = Array.isArray(questionId?.options) ? questionId.options : [];
  el.hidden = list.length === 0;
  let key = false;
  for (const index of list) {
    const el2 = createAgentElement('button', 'agent-option-btn', index.label);
    ((el2.type = 'button'),
      el2.addEventListener('click', async () => {
        if (key || el2.disabled) return;
        key = true;
        const displayAnswer = String(index.label || index.id || '').trim();
        (onAnswer?.(displayAnswer), (el.hidden = true), item?.(true));
        const el3 = onWaitingStart?.();
        try {
          const result =
            questionId?.responseChannel === 'assistant.message'
              ? await value.answerAssistantChoice(index.id, {
                  questionId: questionId.questionId,
                })
              : await value.answerClarification(index.id, { displayAnswer: displayAnswer });
          handler(result);
        } catch (reply) {
          handler({
            ok: false,
            status: 'failed',
            reply: reply?.message || 'Agent clarification failed.',
          });
        } finally {
          const data = !el3 || Boolean(el3.parentNode);
          onWaitingEnd?.(el3);
          if (data) item?.(false);
        }
      }),
      el.appendChild(el2));
  }
}
