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
  sessionStore: _0x3860ff,
  replyFromMessage: _0x3179d7,
  prepareExternalInformation: _0x255c37,
  startRun: _0x1fead8,
  isActiveRun: _0x43d160,
  createStoppedReply: _0x215da5,
  createFailedReply: _0x553665,
  getSignal: _0x6dc78b,
  text: _0x8141f6,
  handleUserMessage: _0xdf1534,
} = {}) {
  let _0x389255 = null;
  const _0xb0eabf = () => _0x3860ff['getHistory']?.() || [],
    _0x12e810 = () => getAgentPendingAssistantChoice(_0xb0eabf()),
    _0x176686 = () => String(_0x3860ff['getActiveConversation']?.()?.['id'] || ''),
    _0x32588b = (_0x406a87) => _0x3860ff['emitAssistantStream']?.(_0x406a87),
    _0x5cbe17 = () => ({ ..._0x215da5(), assistantHandled: !![], stale: !![] }),
    _0x400e65 = (_0x4f399e) =>
      _0x553665(_0x4f399e?.['message'] || String(_0x4f399e), {
        assistantHandled: !![],
        notice: _0x4f399e?.['message'] || String(_0x4f399e),
        responseChannel: 'assistant.message',
        ...(_0x12e810() || {}),
      }),
    _0x1e7477 = (_0x45e6fe) =>
      _0x176686() === _0x45e6fe['conversationId'] &&
      _0x3860ff['getCurrentRun']?.()?.['id'] === _0x45e6fe['runId'],
    _0x135264 = (_0x2a6c8f) =>
      _0x3860ff['isConversationLoaded']?.(_0x2a6c8f['conversationId']) ?? _0x1e7477(_0x2a6c8f),
    _0xeebebc = (_0x2369a0) => {
      const _0x4652ea = getAgentEditableTurn(_0xb0eabf());
      if (
        _0x389255 ||
        _0x3860ff['getPendingPlan']?.() ||
        _0x3860ff['getPendingLoopRun']?.() ||
        _0x3860ff['getPendingClarification']?.() ||
        !_0x4652ea ||
        _0x4652ea['itemId'] !== _0x2369a0
      )
        return null;
      return _0x4652ea;
    };
  function _0x16a574(_0x5c53f8, _0x22a6d0 = null) {
    if (_0x389255 !== _0x5c53f8) return;
    let _0x45596f = null;
    try {
      if (_0x22a6d0 && _0x1e7477(_0x5c53f8)) {
        if (_0x5c53f8['revision']) {
          const _0x4c8b8b = _0xb0eabf(),
            _0x159a0d = getAgentEditableTurn(_0x4c8b8b);
          if (_0x159a0d?.['itemId'] !== _0x5c53f8['revision']['itemId'])
            throw new Error('对话内容已变化，请重新发送消息');
          const _0x23c9d6 = appendAgentReplyVersion(_0x159a0d, _0x5c53f8['message'], _0x22a6d0);
          _0x3860ff['replaceConversationMessages'](
            [
              ..._0x4c8b8b['slice'](0x0, -0x2),
              { ..._0x159a0d['user'], content: _0x5c53f8['message'] },
              { ..._0x159a0d['assistant'], ..._0x22a6d0, replyVersions: _0x23c9d6 },
            ],
            { conversationId: _0x5c53f8['conversationId'] },
          );
        } else _0x3860ff['pushHistory']?.(_0x22a6d0);
      }
    } catch (_0x51a9be) {
      _0x45596f = _0x51a9be;
    }
    return (
      (_0x389255 = null),
      _0x32588b({
        type: 'end',
        runId: _0x5c53f8['runId'],
        history: _0x1e7477(_0x5c53f8) ? _0xb0eabf() : null,
        discard: !_0x22a6d0 || Boolean(_0x45596f),
      }),
      _0x45596f
    );
  }
  function _0x468ff9() {
    const _0x328656 = _0x389255;
    if (!_0x328656) return ![];
    const _0x5978b8 = _0x16a574(
      _0x328656,
      _0x1e7477(_0x328656) && (_0x328656['prose'] || !_0x328656['revision'])
        ? {
            role: 'assistant',
            status: 'stopped',
            content: _0x328656['prose'] || _0x8141f6('runStopped'),
            assistantContext: { skillIds: _0x328656['skillIds'] },
          }
        : null,
    );
    return { error: _0x5978b8 };
  }
  return {
    getPendingChoice: _0x12e810,
    stop: _0x468ff9,
    revise({ itemId: _0x1ac648, message: _0x4b6652 } = {}) {
      const _0x4c37b4 = _0xeebebc(_0x1ac648);
      if (!_0x4c37b4) return _0x553665(_0x8141f6('noPendingClarification'));
      if (_0x4c37b4['assistant']['replyVersions']?.['versions']['length'] >= AGENT_REPLY_VERSION_LIMIT)
        return _0x553665(agentConversationActionText('limit'));
      const _0x30a05d = String(_0x4b6652 ?? _0x4c37b4['user']['content'])['trim']();
      if (!_0x30a05d) return _0x553665(_0x8141f6('emptyMessage'));
      const _0x80d6b7 = [..._0xb0eabf()['slice'](0x0, -0x2), { ..._0x4c37b4['user'], content: _0x30a05d }];
      return this['handle'](
        _0x30a05d,
        {
          revision: _0x4c37b4,
          history: _0x80d6b7,
          conversationHistory: _0x80d6b7,
          assistantChoice: !![],
          selectedSkillIds: _0x4c37b4['assistant']['assistantContext']['skillIds'] || [],
        },
        _0x1fead8(),
      );
    },
    selectVersion({ itemId: _0x2330a6, index: _0x2a8e9e } = {}) {
      if (!_0xeebebc(_0x2330a6)) return _0x553665(_0x8141f6('noPendingClarification'));
      const _0x59d48d = selectAgentReplyVersion(_0xb0eabf(), _0x2330a6, _0x2a8e9e);
      try {
        if (
          !_0x59d48d ||
          !_0x3860ff['replaceConversationMessages'](_0x59d48d, { conversationId: _0x176686() })
        )
          return _0x553665(_0x8141f6('noPendingClarification'));
        return { ok: !![], status: 'chat', assistantHandled: !![], ...(_0x12e810() || {}) };
      } catch (_0x2dfce7) {
        return _0x400e65(_0x2dfce7);
      }
    },
    answerChoice(_0x40e250, { questionId: _0x4cd07b } = {}) {
      const _0x73b708 = _0x12e810(),
        _0x30f2cf = _0x73b708?.['options']['find']((_0x3da717) => _0x3da717['id'] === _0x40e250);
      if (!_0x30f2cf || _0x73b708['questionId'] !== _0x4cd07b)
        return _0x553665(_0x8141f6('noPendingClarification'));
      return _0xdf1534(_0x30f2cf['label'], { assistantChoice: !![] });
    },
    async handle(_0x5ba738, _0x59898d, _0xaa597) {
      const _0x3ddf9b = _0x6dc78b(),
        _0xf2bdbb = {
          runId: _0xaa597,
          conversationId: _0x176686(),
          message: _0x5ba738,
          revision: _0x59898d['revision'],
          prose: '',
          skillIds: _0x59898d['selectedSkillIds'] || [],
        };
      ((_0x389255 = _0xf2bdbb),
        _0x32588b({ type: 'start', runId: _0xaa597, revision: Boolean(_0xf2bdbb['revision']) }));
      try {
        const _0x24a350 = await _0x255c37({
          message: _0x5ba738,
          documentFiles: _0x59898d['documentFiles'],
          signal: _0x3ddf9b,
        });
        if (
          _0x389255 !== _0xf2bdbb ||
          !_0x43d160(_0xaa597) ||
          _0x3ddf9b?.['aborted'] ||
          !_0x1e7477(_0xf2bdbb)
        )
          return _0x5cbe17();
        const _0x10479a = await _0x3179d7(_0x5ba738, {
          ..._0x59898d,
          externalInformation: _0x24a350,
          signal: _0x3ddf9b,
          onSkillsSelected: (_0x59b7fc) => {
            _0xf2bdbb['skillIds'] = _0x59b7fc['map']((_0x454bc2) => _0x454bc2['id']);
          },
          onText: (_0xc9ab31) => {
            if (
              _0x389255 !== _0xf2bdbb ||
              !_0x43d160(_0xaa597) ||
              _0x3ddf9b?.['aborted'] ||
              !_0x135264(_0xf2bdbb)
            )
              return;
            ((_0xf2bdbb['prose'] = getAgentStreamingProse(_0xc9ab31)),
              _0x32588b({ type: 'text', runId: _0xaa597, text: _0xf2bdbb['prose'] }));
          },
        });
        if (
          _0x389255 !== _0xf2bdbb ||
          !_0x43d160(_0xaa597) ||
          _0x3ddf9b?.['aborted'] ||
          !_0x1e7477(_0xf2bdbb)
        )
          return _0x5cbe17();
        const _0x28ee8d = normalizeAgentAssistantReply(_0x10479a);
        if (!_0x28ee8d['reply']) throw new Error(_0x8141f6('plannerFailed'));
        const _0x4365c6 = _0x16a574(_0xf2bdbb, {
          role: 'assistant',
          status: 'chat',
          content: _0x28ee8d['reply'],
          assistantContext: {
            skillIds: _0x10479a['selectedSkillIds'] || [],
            ...(_0x28ee8d['options']
              ? { choice: { question: _0x28ee8d['question'], options: _0x28ee8d['options'] } }
              : {}),
          },
        });
        if (_0x4365c6)
          return (
            _0x3860ff['setCurrentRun']?.({ id: _0xaa597, status: 'failed', stopped: ![] }),
            _0x400e65(_0x4365c6)
          );
        return (
          _0x3860ff['setCurrentRun']?.({ id: _0xaa597, status: 'chat', stopped: ![] }),
          {
            ok: !![],
            ..._0x28ee8d,
            assistantHandled: !![],
            responseChannel: 'assistant.message',
            ...(_0x12e810() || {}),
          }
        );
      } catch (_0x3bba4e) {
        if (
          _0x389255 !== _0xf2bdbb ||
          !_0x43d160(_0xaa597) ||
          _0x3ddf9b?.['aborted'] ||
          !_0x1e7477(_0xf2bdbb)
        )
          return _0x5cbe17();
        const _0x103450 = _0x3bba4e?.['message'] || _0x8141f6('plannerFailed'),
          _0x3490cf = _0x16a574(
            _0xf2bdbb,
            _0xf2bdbb['prose'] || !_0xf2bdbb['revision']
              ? {
                  role: 'assistant',
                  status: 'failed',
                  content: _0xf2bdbb['prose'] || _0x103450,
                  assistantContext: { skillIds: _0xf2bdbb['skillIds'] },
                }
              : null,
          );
        return (
          _0x3860ff['setCurrentRun']?.({ id: _0xaa597, status: 'failed', stopped: ![] }),
          _0x400e65(_0x3490cf || _0x103450)
        );
      }
    },
  };
}
