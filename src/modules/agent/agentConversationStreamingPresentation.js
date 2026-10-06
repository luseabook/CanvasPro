import { renderMarkdownToHtml } from '../../components/aigenText/markdownRenderer.js';
import { formatAgentAssistantMarkdown } from './agentAssistantMarkdown.js';
import { scrollAgentMessageListToEnd, scrollAgentMessageListTo } from './agentConversationScroll.js';
import { updateAgentMessageTime } from './agentMessageTime.js';
export function updateAgentMessageBody(el, response) {
  const value = String(response.content || response.status || '');
  if (el.agentMessageContent !== value) {
    const el2 = el.querySelector('.agent-message-body');
    if (response.role === 'assistant')
      el2.innerHTML = renderMarkdownToHtml(formatAgentAssistantMarkdown(value));
    else el2.textContent = value;
    ((el.agentMessageContent = value), (el.agentMessageCopyText = value));
  }
  for (const item of [...el.classList]) {
    if (item.startsWith('agent-message--status-')) el.classList.remove(item);
  }
  if (response.status) el.classList.add('agent-message--status-' + response.status);
  ((el.dataset.messageId = response.itemId || ''),
    updateAgentMessageTime(el.querySelector('.agent-message-time'), response.ts));
}
export function createAgentConversationStreamingPresentation({
  messagesEl: messagesEl,
  appendEntry: appendEntry,
  onSettled: onSettled,
}) {
  let content = null,
    requestAnimationFrame2 = null;
  const run = () => messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 64,
    handler = (handler2) => {
      const key = run(),
        index = messagesEl.scrollTop;
      handler2();
      if (key) scrollAgentMessageListToEnd(messagesEl);
      else scrollAgentMessageListTo(messagesEl, index);
    };
  function reconcile(list) {
    (handler(() => {
      const list2 = [...messagesEl.querySelectorAll('.agent-message:not(.agent-message--typing)')];
      (list.forEach((result, data) => {
        if (list2[data]) updateAgentMessageBody(list2[data], result);
        else appendEntry(result);
      }),
        list2.slice(list.length).forEach((el3) => el3.remove()));
    }),
      onSettled?.());
  }
  function run2() {
    requestAnimationFrame2 = null;
    if (!content?.text) return;
    handler(() => {
      if (!content.item) {
        content.item = appendEntry({ role: 'assistant', content: content.text, status: 'streaming' });
        const options = messagesEl.querySelector('.agent-message--typing');
        if (options) messagesEl.insertBefore(content.item, options);
      }
      updateAgentMessageBody(content.item, {
        role: 'assistant',
        content: content.text,
        status: 'streaming',
      });
    });
  }
  return {
    reconcile: reconcile,
    handle(id) {
      if (id.type === 'start') {
        if (requestAnimationFrame2 !== null) cancelAnimationFrame(requestAnimationFrame2);
        ((content = { id: id.runId, revision: id.revision, text: '', item: null }),
          (requestAnimationFrame2 = null));
      } else {
        if (id.runId === content?.id && id.type === 'text') {
          content.text = id.text;
          if (requestAnimationFrame2 === null) requestAnimationFrame2 = requestAnimationFrame(run2);
        } else {
          if (id.runId === content?.id && id.type === 'end') {
            if (requestAnimationFrame2 !== null) cancelAnimationFrame(requestAnimationFrame2);
            if (id.discard || content.revision) content.item?.remove();
            ((content = null), (requestAnimationFrame2 = null));
            if (id.history) reconcile(id.history);
            else onSettled?.();
          }
        }
      }
    },
    destroy() {
      if (requestAnimationFrame2 !== null) cancelAnimationFrame(requestAnimationFrame2);
      ((content = null), (requestAnimationFrame2 = null));
    },
  };
}
