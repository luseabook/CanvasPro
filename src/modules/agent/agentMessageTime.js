import { createAgentElement } from './agentPanelElements.js';
export function updateAgentMessageTime(_0x4b8bbc, _0x3443e6) {
  const _0x48ed0d = new Date(Number(_0x3443e6));
  if (!_0x4b8bbc || !(Number(_0x3443e6) > 0x0) || !Number['isFinite'](_0x48ed0d['getTime']())) return ![];
  return (
    _0x4b8bbc['setAttribute']('datetime', _0x48ed0d['toISOString']()),
    (_0x4b8bbc['textContent'] =
      _0x48ed0d['getHours']() + ':' + String(_0x48ed0d['getMinutes']())['padStart'](0x2, '0')),
    (_0x4b8bbc['title'] = _0x48ed0d['toLocaleString']()),
    !![]
  );
}
export function createAgentMessageTime(_0x180eac) {
  const _0x4d6808 = createAgentElement('time', 'agent-message-time');
  return updateAgentMessageTime(_0x4d6808, _0x180eac) ? _0x4d6808 : null;
}
