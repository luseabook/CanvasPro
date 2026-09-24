import { createAgentAssistantConversationRuntime } from './agentAssistantConversationRuntime.js';
export function createAgentTextConversationRuntime({
  sessionStore: _0x3fa27e,
  assistant: _0x1a2f8a,
  getContext: getContext = () => ({}),
} = {}) {
  let _0x3f3f53 = null,
    _0x124fc7 = 0x0,
    _0x593748 = '',
    _0x539f49 = ![];
  const _0x449fee = (_0x452dfd, _0x1a7f7d = {}) => ({
      ok: ![],
      status: 'failed',
      reply: String(_0x452dfd),
      ..._0x1a7f7d,
    }),
    _0x670ea2 = () => ({ ok: !![], status: 'stopped', reply: '已停止生成' });
  function _0x750be8() {
    return (
      (_0x3f3f53 = new AbortController()),
      (_0x593748 = 'agent-text-' + ++_0x124fc7),
      _0x3fa27e['setCurrentRun']({ id: _0x593748, status: 'planning', stopped: ![] }),
      _0x593748
    );
  }
  const _0x169e9e = createAgentAssistantConversationRuntime({
    sessionStore: _0x3fa27e,
    startRun: _0x750be8,
    isActiveRun: (_0x59a4f8) => !_0x539f49 && _0x593748 === _0x59a4f8,
    getSignal: () => _0x3f3f53?.['signal'],
    createStoppedReply: _0x670ea2,
    createFailedReply: _0x449fee,
    text: (_0x377613) =>
      ({ runStopped: '已停止生成', emptyMessage: '请输入创作要求', plannerFailed: '回复失败，请重试' })[
        _0x377613
      ] || '当前对话已变化，请重新发送',
    prepareExternalInformation: async () => null,
    replyFromMessage: (_0x30826a, _0x33dee9) =>
      _0x1a2f8a({
        ..._0x33dee9,
        message: _0x30826a,
        context: getContext(),
        history: _0x33dee9['history'] || _0x3fa27e['getHistory'](),
      }),
    handleUserMessage: _0x303761,
  });
  async function _0x303761(_0x21647d) {
    if (_0x539f49) return _0x449fee('会话已关闭');
    if (
      _0x3f3f53 &&
      !_0x3f3f53['signal']['aborted'] &&
      _0x3fa27e['getCurrentRun']()?.['status'] === 'planning'
    )
      return _0x449fee('请等待当前回复或先停止');
    const _0x378f7e = String(_0x21647d || '')['trim']();
    if (!_0x378f7e) return _0x449fee('请输入创作要求');
    return (
      _0x3fa27e['pushHistory']({ role: 'user', content: _0x378f7e }),
      _0x169e9e['handle'](_0x378f7e, {}, _0x750be8())
    );
  }
  function _0x5ac6a6() {
    const _0x3f24b0 = _0x169e9e['stop']();
    return (
      _0x3f3f53?.['abort'](),
      (_0x593748 = ''),
      _0x3fa27e['stopCurrentRun'](),
      { ..._0x670ea2(), ...(_0x3f24b0?.['error'] ? { notice: _0x3f24b0['error']['message'] } : {}) }
    );
  }
  return {
    sessionStore: _0x3fa27e,
    handleUserMessage: _0x303761,
    stop: _0x5ac6a6,
    getPendingAssistantChoice: _0x169e9e['getPendingChoice'],
    answerAssistantChoice: _0x169e9e['answerChoice'],
    reviseAssistantTurn: (_0x1d60ea) => _0x169e9e['revise'](_0x1d60ea),
    selectAssistantVersion: _0x169e9e['selectVersion'],
    listConversations: () => _0x3fa27e['listConversations'](),
    getActiveConversation: () => _0x3fa27e['getActiveConversation'](),
    startNewConversation() {
      return (_0x5ac6a6(), _0x3fa27e['startNewConversation']());
    },
    switchConversation(_0x595d1d) {
      return (_0x5ac6a6(), _0x3fa27e['switchConversation'](_0x595d1d));
    },
    deleteConversation(_0x42efed) {
      if (String(_0x42efed || '')['trim']() === _0x3fa27e['getActiveConversation']()?.['id']) _0x5ac6a6();
      return _0x3fa27e['deleteConversation'](_0x42efed);
    },
    dispose() {
      try {
        _0x5ac6a6();
      } catch {
      } finally {
        (_0x3f3f53?.['abort'](), (_0x593748 = ''), (_0x539f49 = !![]));
      }
    },
  };
}
