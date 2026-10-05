import { createAgentElement } from './agentPanelElements.js';
export function updateAgentMessageTime(el, value) {
  const item = new Date(Number(value));
  if (!el || !(Number(value) > 0) || !Number['isFinite'](item['getTime']())) return ![];
  return (
    el['setAttribute']('datetime', item['toISOString']()),
    (el['textContent'] = item['getHours']() + ':' + String(item['getMinutes']())['padStart'](2, '0')),
    (el['title'] = item['toLocaleString']()),
    !![]
  );
}
export function createAgentMessageTime(key) {
  const agentElement = createAgentElement('time', 'agent-message-time');
  return updateAgentMessageTime(agentElement, key) ? agentElement : null;
}
