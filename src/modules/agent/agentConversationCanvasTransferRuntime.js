import { resolveAgentConversationCanvasTransfer } from './agentConversationCanvasTransfer.js';
function getSelectedNodeIds(_0x3ff76c = {}) {
  return Array['from'](
    new Set(
      (Array['isArray'](_0x3ff76c['selectedNodeIds']) ? _0x3ff76c['selectedNodeIds'] : [])
        ['map']((_0x329e41) => String(_0x329e41 || '')['trim']())
        ['filter'](Boolean),
    ),
  );
}
export function createAgentConversationCanvasTransferRuntime({
  sessionStore: _0x77362b,
  readCanvasState: _0x50b661,
  executeActions: _0x594bb2,
  handlePlan: _0x1918f6,
  buildExecutionGuard: _0x5783b9,
  isActiveRun: _0x5c3a85,
  createStoppedReply: _0x4427d5,
  commandContext: _0x12ac21,
  text: _0x58ec8e,
} = {}) {
  function _0x47ff16(
    _0x1f192e,
    _0x399769,
    { ok: ok = !![], status: status = 'chat', extra: extra = {} } = {},
  ) {
    return (
      _0x77362b['pushHistory']?.({ role: 'assistant', status: status, content: _0x399769, ...extra }),
      _0x77362b['setCurrentRun']?.({ id: _0x1f192e, status: status, stopped: ![] }),
      {
        ok: ok,
        status: status,
        reply: _0x399769,
        message: _0x399769,
        responseChannel: 'canvas.tool',
        ...extra,
      }
    );
  }
  async function _0x3edbd4(_0x4d26f7, _0x262bf8, _0x335636) {
    const _0x624dda = getSelectedNodeIds(_0x50b661?.() || {});
    if (_0x624dda['length'] !== 0x1) return _0x47ff16(_0x335636, _0x58ec8e('promptTransferTargetRequired'));
    const _0x2793fd = {
        type: _0x4d26f7['mode'] === 'append' ? 'node.appendPrompt' : 'node.setPrompt',
        args: { nodeId: _0x624dda[0x0], text: _0x4d26f7['content'] },
      },
      _0x42b20c = await _0x1918f6(
        { status: 'ready', reply: _0x58ec8e('promptTransferCompleted'), actions: [_0x2793fd] },
        {
          agentContext: {},
          userMessage: _0x262bf8,
          turnId: _0x335636,
          confirmationReply: _0x58ec8e('promptTransferConfirmation'),
          completionReply: _0x58ec8e('promptTransferCompleted'),
        },
      );
    return (
      _0x5c3a85(_0x335636) &&
        _0x77362b['setCurrentRun']?.({ id: _0x335636, status: _0x42b20c['status'], stopped: ![] }),
      { ..._0x42b20c, responseChannel: 'canvas.tool' }
    );
  }
  async function _0xbc61f9(_0x146419, _0x420a69) {
    const _0x40447d = resolveAgentConversationCanvasTransfer({
      message: _0x146419,
      history: _0x77362b['getHistory']?.() || [],
    });
    if (!_0x40447d) return null;
    _0x77362b['recordTrace']?.({
      type: 'agent_turn_routed',
      channel: 'canvas.tool',
      reason:
        _0x40447d['target'] === 'selected_prompt'
          ? 'conversation-prompt-transfer'
          : 'conversation-text-transfer',
    });
    if (!_0x40447d['content']) return _0x47ff16(_0x420a69, _0x58ec8e('textSourceMissing'));
    if (_0x40447d['target'] === 'selected_prompt') return _0x3edbd4(_0x40447d, _0x146419, _0x420a69);
    const _0x43be89 = {
        type: 'node.create',
        args: { type: _0x40447d['nodeType'], prompt: _0x40447d['content'] },
      },
      _0x2c3e9a = await _0x594bb2([_0x43be89], { commandContext: _0x12ac21, ..._0x5783b9(_0x420a69) });
    if (!_0x5c3a85(_0x420a69)) return _0x4427d5();
    const _0x168e72 = _0x2c3e9a['ok']
      ? _0x58ec8e('textPlacedOnCanvas')
      : _0x2c3e9a['message'] || _0x58ec8e('actionExecutionFailed');
    return _0x47ff16(_0x420a69, _0x168e72, {
      ok: _0x2c3e9a['ok'],
      status: _0x2c3e9a['ok'] ? 'success' : 'failed',
      extra: { plan: { status: 'ready', reply: _0x168e72, actions: [_0x43be89] }, execution: _0x2c3e9a },
    });
  }
  return Object['freeze']({ handle: _0xbc61f9 });
}
