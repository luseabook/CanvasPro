import { renderMarkdownToHtml } from '../../components/aigenText/markdownRenderer.js';
import { formatAgentAssistantMarkdown } from './agentAssistantMarkdown.js';
import { scrollAgentMessageListToEnd, scrollAgentMessageListTo } from './agentConversationScroll.js';
import { updateAgentMessageTime } from './agentMessageTime.js';
export function updateAgentMessageBody(_0x2284ca, _0x396965) {
  const _0x160046 = String(_0x396965['content'] || _0x396965['status'] || '');
  if (_0x2284ca['agentMessageContent'] !== _0x160046) {
    const _0x3e3c78 = _0x2284ca['querySelector']('.agent-message-body');
    if (_0x396965['role'] === 'assistant')
      _0x3e3c78['innerHTML'] = renderMarkdownToHtml(formatAgentAssistantMarkdown(_0x160046));
    else _0x3e3c78['textContent'] = _0x160046;
    ((_0x2284ca['agentMessageContent'] = _0x160046), (_0x2284ca['agentMessageCopyText'] = _0x160046));
  }
  for (const _0x1bf636 of [..._0x2284ca['classList']]) {
    if (_0x1bf636['startsWith']('agent-message--status-')) _0x2284ca['classList']['remove'](_0x1bf636);
  }
  if (_0x396965['status']) _0x2284ca['classList']['add']('agent-message--status-' + _0x396965['status']);
  ((_0x2284ca['dataset']['messageId'] = _0x396965['itemId'] || ''),
    updateAgentMessageTime(_0x2284ca['querySelector']('.agent-message-time'), _0x396965['ts']));
}
export function createAgentConversationStreamingPresentation({
  messagesEl: _0xe8e4e,
  appendEntry: _0x599c82,
  onSettled: _0x215b1d,
}) {
  let _0x45858c = null,
    _0x2341ba = null;
  const _0x2a0f0e = () => _0xe8e4e['scrollHeight'] - _0xe8e4e['scrollTop'] - _0xe8e4e['clientHeight'] < 0x40,
    _0x327341 = (_0x5f0e37) => {
      const _0x10f45e = _0x2a0f0e(),
        _0x402535 = _0xe8e4e['scrollTop'];
      _0x5f0e37();
      if (_0x10f45e) scrollAgentMessageListToEnd(_0xe8e4e);
      else scrollAgentMessageListTo(_0xe8e4e, _0x402535);
    };
  function _0x13cf04(_0x450dc6) {
    (_0x327341(() => {
      const _0x1ce1e8 = [..._0xe8e4e['querySelectorAll']('.agent-message:not(.agent-message--typing)')];
      (_0x450dc6['forEach']((_0x341e81, _0x12352d) => {
        if (_0x1ce1e8[_0x12352d]) updateAgentMessageBody(_0x1ce1e8[_0x12352d], _0x341e81);
        else _0x599c82(_0x341e81);
      }),
        _0x1ce1e8['slice'](_0x450dc6['length'])['forEach']((_0x2c7e0e) => _0x2c7e0e['remove']()));
    }),
      _0x215b1d?.());
  }
  function _0xda78a4() {
    _0x2341ba = null;
    if (!_0x45858c?.['text']) return;
    _0x327341(() => {
      if (!_0x45858c['item']) {
        _0x45858c['item'] = _0x599c82({ role: 'assistant', content: _0x45858c['text'], status: 'streaming' });
        const _0x28a7c1 = _0xe8e4e['querySelector']('.agent-message--typing');
        if (_0x28a7c1) _0xe8e4e['insertBefore'](_0x45858c['item'], _0x28a7c1);
      }
      updateAgentMessageBody(_0x45858c['item'], {
        role: 'assistant',
        content: _0x45858c['text'],
        status: 'streaming',
      });
    });
  }
  return {
    reconcile: _0x13cf04,
    handle(_0x49aaf8) {
      if (_0x49aaf8['type'] === 'start') {
        if (_0x2341ba !== null) cancelAnimationFrame(_0x2341ba);
        ((_0x45858c = { id: _0x49aaf8['runId'], revision: _0x49aaf8['revision'], text: '', item: null }),
          (_0x2341ba = null));
      } else {
        if (_0x49aaf8['runId'] === _0x45858c?.['id'] && _0x49aaf8['type'] === 'text') {
          _0x45858c['text'] = _0x49aaf8['text'];
          if (_0x2341ba === null) _0x2341ba = requestAnimationFrame(_0xda78a4);
        } else {
          if (_0x49aaf8['runId'] === _0x45858c?.['id'] && _0x49aaf8['type'] === 'end') {
            if (_0x2341ba !== null) cancelAnimationFrame(_0x2341ba);
            if (_0x49aaf8['discard'] || _0x45858c['revision']) _0x45858c['item']?.['remove']();
            ((_0x45858c = null), (_0x2341ba = null));
            if (_0x49aaf8['history']) _0x13cf04(_0x49aaf8['history']);
            else _0x215b1d?.();
          }
        }
      }
    },
    destroy() {
      if (_0x2341ba !== null) cancelAnimationFrame(_0x2341ba);
      ((_0x45858c = null), (_0x2341ba = null));
    },
  };
}
