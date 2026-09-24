import { createAgentElement } from './agentPanelElements.js';
export function renderAgentConversationChoices(
  _0x79a560,
  _0x2baf7b,
  _0x14f066,
  _0x3b4e66,
  _0x19f37f = null,
  {
    onAnswer: onAnswer = null,
    onWaitingStart: onWaitingStart = null,
    onWaitingEnd: onWaitingEnd = null,
  } = {},
) {
  _0x79a560['replaceChildren']();
  const _0x20d8a1 = Array['isArray'](_0x2baf7b?.['options']) ? _0x2baf7b['options'] : [];
  _0x79a560['hidden'] = _0x20d8a1['length'] === 0x0;
  let _0x479285 = ![];
  for (const _0x21ef30 of _0x20d8a1) {
    const _0x441300 = createAgentElement('button', 'agent-option-btn', _0x21ef30['label']);
    ((_0x441300['type'] = 'button'),
      _0x441300['addEventListener']('click', async () => {
        if (_0x479285 || _0x441300['disabled']) return;
        _0x479285 = !![];
        const _0x49d908 = String(_0x21ef30['label'] || _0x21ef30['id'] || '')['trim']();
        (onAnswer?.(_0x49d908), (_0x79a560['hidden'] = !![]), _0x19f37f?.(!![]));
        const _0x237eb6 = onWaitingStart?.();
        try {
          const _0x4be29a =
            _0x2baf7b?.['responseChannel'] === 'assistant.message'
              ? await _0x14f066['answerAssistantChoice'](_0x21ef30['id'], {
                  questionId: _0x2baf7b['questionId'],
                })
              : await _0x14f066['answerClarification'](_0x21ef30['id'], { displayAnswer: _0x49d908 });
          _0x3b4e66(_0x4be29a);
        } catch (_0x2c3a4e) {
          _0x3b4e66({
            ok: ![],
            status: 'failed',
            reply: _0x2c3a4e?.['message'] || 'Agent clarification failed.',
          });
        } finally {
          const _0x543db3 = !_0x237eb6 || Boolean(_0x237eb6['parentNode']);
          onWaitingEnd?.(_0x237eb6);
          if (_0x543db3) _0x19f37f?.(![]);
        }
      }),
      _0x79a560['appendChild'](_0x441300));
  }
}
