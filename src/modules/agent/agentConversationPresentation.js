import { renderMarkdownToHtml } from '../../components/aigenText/markdownRenderer.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { formatAgentAssistantMarkdown } from './agentAssistantMarkdown.js';
import { agentPanelText, formatAgentPanelText } from './agentPanelText.js';
import { scrollAgentMessageListToEnd } from './agentConversationScroll.js';
import { createAgentRunStatusPresentation } from './agentRunStatusPresentation.js';
import { createAgentConversationStreamingPresentation } from './agentConversationStreamingPresentation.js';
import { createAgentMessageTime } from './agentMessageTime.js';
export const AGENT_CONVERSATION_INPUT_REF_LIMIT = 0xc;
export { formatAgentAssistantMarkdown };
function getTaskResultEntryKey(_0x15a641 = {}) {
  const _0x27bdcd = String(_0x15a641['messageType'] || _0x15a641['type'] || '')['trim']();
  if (_0x27bdcd !== 'task_result') return '';
  const _0x14d088 = _0x15a641['task'] && typeof _0x15a641['task'] === 'object' ? _0x15a641['task'] : {},
    _0x2a1da7 = String(_0x14d088['taskId'] || '')['trim'](),
    _0x2283cb = String(_0x14d088['nodeId'] || '')['trim'](),
    _0x4a6043 = String(_0x14d088['status'] || _0x15a641['status'] || '')['trim']();
  if (!_0x2a1da7 && !_0x2283cb) return '';
  return _0x2a1da7 + '\x00' + _0x2283cb + '\x00' + _0x4a6043;
}
function createEl(_0x4a9ee7, _0x1f0d08 = '', _0x49e7e3 = '') {
  const _0x3243fb = document['createElement'](_0x4a9ee7);
  if (_0x1f0d08) _0x3243fb['className'] = _0x1f0d08;
  if (_0x49e7e3) _0x3243fb['textContent'] = _0x49e7e3;
  return _0x3243fb;
}
function normalizeMessageClassSegment(_0x4adc2f = '') {
  return String(_0x4adc2f || '')
    ['trim']()
    ['toLowerCase']()
    ['replace'](/_/g, '-')
    ['replace'](/[^a-z0-9_-]+/g, '-');
}
export function normalizeAgentRenderableMediaUrl(_0x19dfcb) {
  const _0xb99fee = String(_0x19dfcb || '')['trim']();
  if (!_0xb99fee) return '';
  if (/^https?:\/\//i['test'](_0xb99fee) || _0xb99fee['startsWith']('/')) return _0xb99fee;
  if (/^data:image\//i['test'](_0xb99fee) && _0xb99fee['length'] <= 0xc350) return _0xb99fee;
  return localPathToUrl(_0xb99fee) || '';
}
function normalizeTaskImageMediaItems(_0xbc125a = {}) {
  const _0x55cafb = _0xbc125a?.['media'];
  if (!_0x55cafb || _0x55cafb['kind'] !== 'image') return [];
  const _0x4d7dc6 =
    Array['isArray'](_0x55cafb['items']) && _0x55cafb['items']['length'] > 0x0
      ? _0x55cafb['items']
      : [_0x55cafb];
  return _0x4d7dc6['map']((_0x2c82ad) => {
    const _0x35b7c7 = normalizeAgentRenderableMediaUrl(_0x2c82ad?.['url'] || _0x2c82ad?.['thumbUrl']),
      _0x2301f2 = normalizeAgentRenderableMediaUrl(_0x2c82ad?.['thumbUrl'] || _0x2c82ad?.['url']);
    if (!_0x35b7c7 && !_0x2301f2) return null;
    return {
      url: _0x35b7c7 || _0x2301f2,
      thumbUrl: _0x2301f2 || _0x35b7c7,
      name: String(_0x2c82ad?.['name'] || _0x55cafb['name'] || _0xbc125a['nodeId'] || '')['trim'](),
    };
  })['filter'](Boolean);
}
function buildAgentMessageCopyText(_0x10ceab = '', _0x4a44c4 = null) {
  const _0x6b4fba = [String(_0x10ceab || '')['trim']()]['filter'](Boolean),
    _0x598f1f =
      _0x4a44c4?.['media']?.['kind'] === 'image'
        ? Array['isArray'](_0x4a44c4['media']['items']) && _0x4a44c4['media']['items']['length'] > 0x0
          ? _0x4a44c4['media']['items']
          : [_0x4a44c4['media']]
        : [],
    _0x5d33bc = String(_0x4a44c4?.['media']?.['name'] || _0x4a44c4?.['nodeId'] || '')['trim']();
  return (
    _0x5d33bc &&
      _0x6b4fba['push'](
        '' + agentPanelText('copyMessageNodeLabel') + agentPanelText('copyMessageSeparator') + _0x5d33bc,
      ),
    _0x598f1f['forEach']((_0x11092d, _0x450467) => {
      const _0x23494b = String(_0x11092d?.['url'] || _0x11092d?.['thumbUrl'] || '')['trim']();
      if (!_0x23494b) return;
      _0x6b4fba['push'](
        '' +
          agentPanelText('copyMessageImageLabel') +
          (_0x598f1f['length'] > 0x1 ? _0x450467 + 0x1 : '') +
          agentPanelText('copyMessageSeparator') +
          _0x23494b,
      );
    }),
    _0x6b4fba['join']('\x0a')
  );
}
function appendTaskImageMedia(_0xe33a8a, _0x36765c = {}, { onImagePreview: onImagePreview = null } = {}) {
  const _0x173f92 = normalizeTaskImageMediaItems(_0x36765c);
  if (_0x173f92['length'] === 0x0) return;
  const _0x461c91 = createEl('div', 'agent-message-media-grid');
  (_0x461c91['classList']['toggle']('is-multiple', _0x173f92['length'] > 0x1),
    _0x173f92['forEach']((_0xa95322, _0x5b4532) => {
      const _0x1f2f1d = createEl('button', 'agent-message-media-card');
      ((_0x1f2f1d['type'] = 'button'),
        (_0x1f2f1d['title'] = agentPanelText('imageResultOpen')),
        _0x1f2f1d['setAttribute']('aria-label', _0xa95322['name'] || agentPanelText('imageResultOpen')),
        (_0x1f2f1d['dataset']['imageUrl'] = _0xa95322['url']),
        (_0x1f2f1d['dataset']['imageName'] = _0xa95322['name'] || _0x36765c['nodeId'] || ''));
      const _0x1e4ba4 = createEl('img', 'agent-message-media-image');
      ((_0x1e4ba4['src'] = _0xa95322['thumbUrl']),
        (_0x1e4ba4['alt'] = _0xa95322['name'] || _0x36765c['nodeId'] || ''),
        (_0x1e4ba4['draggable'] = ![]),
        _0x1f2f1d['appendChild'](_0x1e4ba4),
        _0xa95322['name'] &&
          _0x1f2f1d['appendChild'](
            createEl(
              'span',
              'agent-message-media-name',
              _0x173f92['length'] > 0x1 ? _0xa95322['name'] + '\x20' + (_0x5b4532 + 0x1) : _0xa95322['name'],
            ),
          ),
        _0x1f2f1d['addEventListener']('click', (_0x501324) => {
          (_0x501324['preventDefault']?.(),
            _0x501324['stopPropagation']?.(),
            onImagePreview?.(_0xa95322['url'], _0xa95322['name'] || _0x36765c['nodeId'] || ''));
        }),
        _0x461c91['appendChild'](_0x1f2f1d));
    }),
    _0xe33a8a['appendChild'](_0x461c91));
}
function appendMessageInputRefs(_0x162ca9, _0x260ade = []) {
  const _0x57044a = (Array['isArray'](_0x260ade) ? _0x260ade : [])
    ['filter']((_0x5e5a21) => String(_0x5e5a21?.['nodeId'] || _0x5e5a21?.['id'] || '')['trim']())
    ['slice'](0x0, AGENT_CONVERSATION_INPUT_REF_LIMIT);
  if (_0x57044a['length'] === 0x0) return;
  const _0xa68597 = createEl('div', 'agent-message-input-refs');
  (_0xa68597['setAttribute']('role', 'list'),
    _0x57044a['forEach']((_0x79d00a) => {
      const _0x4357f6 = String(_0x79d00a['nodeId'] || _0x79d00a['id'] || '')['trim'](),
        _0x125079 = String(_0x79d00a['label'] || _0x79d00a['name'] || _0x4357f6)['trim'](),
        _0x21c8f0 = createEl('div', 'agent-message-input-ref');
      ((_0x21c8f0['dataset']['inputRefId'] = _0x4357f6),
        _0x21c8f0['setAttribute']('role', 'listitem'),
        (_0x21c8f0['title'] = _0x125079));
      if (_0x79d00a['thumbUrl']) {
        const _0x24a288 = createEl('img', 'agent-message-input-ref-thumb');
        ((_0x24a288['src'] = _0x79d00a['thumbUrl']),
          (_0x24a288['alt'] = _0x125079),
          (_0x24a288['draggable'] = ![]),
          _0x21c8f0['appendChild'](_0x24a288));
      } else {
        const _0x2a6569 = createEl(
          'div',
          'agent-message-input-ref-fallback',
          String(_0x79d00a['kind'] || 'node')
            ['slice'](0x0, 0x3)
            ['toUpperCase'](),
        );
        (_0x2a6569['setAttribute']('aria-hidden', 'true'), _0x21c8f0['appendChild'](_0x2a6569));
      }
      if (_0x125079) _0x21c8f0['appendChild'](createEl('span', 'agent-message-input-ref-name', _0x125079));
      _0xa68597['appendChild'](_0x21c8f0);
    }),
    _0x162ca9['appendChild'](_0xa68597));
}
function appendFailureDiagnostic(_0x5a3705, _0x38f428 = null) {
  if (!_0x38f428 || typeof _0x38f428 !== 'object' || !_0x38f428['summary']) return;
  const _0x2f176f = createEl('section', 'agent-diagnostic');
  ((_0x2f176f['hidden'] = ![]), _0x2f176f['setAttribute']('aria-label', agentPanelText('diagnosticTitle')));
  const _0x66d5c9 = createEl('div', 'agent-diagnostic-header');
  _0x66d5c9['append'](
    createEl('span', 'agent-diagnostic-title', agentPanelText('diagnosticTitle')),
    createEl('span', 'agent-diagnostic-phase', _0x38f428['phaseLabel'] || _0x38f428['phase'] || ''),
  );
  const _0xdc35b0 = createEl('div', 'agent-diagnostic-summary', _0x38f428['summary']),
    _0x17bf3c = createEl('div', 'agent-diagnostic-meta');
  _0x17bf3c['append'](
    createEl(
      'span',
      'agent-diagnostic-meta-item',
      formatAgentPanelText('diagnosticStep', { step: Math['max'](0x1, Number(_0x38f428['step'] || 0x1)) }),
    ),
    createEl(
      'span',
      'agent-diagnostic-meta-item',
      formatAgentPanelText('diagnosticCompleted', {
        count: Math['max'](0x0, Number(_0x38f428['completedSteps'] || 0x0)),
      }),
    ),
  );
  const _0x43e739 = createEl('div', 'agent-diagnostic-detail');
  _0x43e739['hidden'] = !![];
  if (_0x38f428['detail']) _0x43e739['appendChild'](createEl('div', '', _0x38f428['detail']));
  _0x38f428['errorCode'] &&
    _0x43e739['appendChild'](
      createEl(
        'code',
        'agent-diagnostic-code',
        formatAgentPanelText('diagnosticErrorCode', { code: _0x38f428['errorCode'] }),
      ),
    );
  const _0x3672c6 = createEl('button', 'agent-diagnostic-toggle', agentPanelText('diagnosticDetails'));
  ((_0x3672c6['type'] = 'button'),
    _0x3672c6['setAttribute']('aria-expanded', 'false'),
    _0x3672c6['addEventListener']('click', () => {
      const _0x23d38f = _0x43e739['hidden'] === !![];
      ((_0x43e739['hidden'] = !_0x23d38f),
        _0x3672c6['setAttribute']('aria-expanded', _0x23d38f ? 'true' : 'false'),
        (_0x3672c6['textContent'] = agentPanelText(
          _0x23d38f ? 'diagnosticDetailsHide' : 'diagnosticDetails',
        )));
    }),
    _0x2f176f['append'](_0x66d5c9, _0xdc35b0, _0x17bf3c, _0x3672c6, _0x43e739),
    _0x5a3705['appendChild'](_0x2f176f));
}
function appendMessageToList(
  _0x4a2912,
  _0x5f3baa,
  _0x5b1592,
  {
    messageType: messageType = 'text',
    status: status = '',
    task: task = null,
    inputRefs: inputRefs = [],
    diagnostic: diagnostic = null,
    onCopy: onCopy = null,
    onImagePreview: onImagePreview = null,
    copyIconHtml: copyIconHtml = '',
    ts: ts = Date['now'](),
  } = {},
) {
  const _0x5dbc00 = String(_0x5f3baa || '') === 'user' ? 'user' : 'assistant',
    _0x217ec0 = ['agent-message', 'agent-message--' + _0x5dbc00],
    _0xe6a298 = normalizeMessageClassSegment(messageType);
  _0xe6a298 && _0xe6a298 !== 'text' && _0x217ec0['push']('agent-message--' + _0xe6a298);
  const _0x2a1f18 = normalizeMessageClassSegment(status);
  if (_0x2a1f18) _0x217ec0['push']('agent-message--status-' + _0x2a1f18);
  const _0x112307 = createEl('div', _0x217ec0['join']('\x20')),
    _0x496f6f = String(_0x5b1592 || '');
  (typeof HTMLElement === 'undefined' || !(_0x112307 instanceof HTMLElement)) &&
    (_0x112307['textContent'] = _0x496f6f);
  const _0x38c763 = createEl('div', 'agent-message-body');
  _0x38c763['textContent'] = _0x496f6f;
  if (_0x5dbc00 === 'assistant' && (!_0xe6a298 || _0xe6a298 === 'text')) {
    _0x112307['classList']['add']('agent-message--rich');
    const _0x59f433 = renderMarkdownToHtml(formatAgentAssistantMarkdown(_0x496f6f));
    if (_0x59f433) _0x38c763['innerHTML'] = _0x59f433;
  }
  const _0x2a66cb = _0x5dbc00 === 'user' ? createEl('div', 'agent-message-bubble') : _0x112307;
  if (_0x2a66cb !== _0x112307) _0x112307['appendChild'](_0x2a66cb);
  (_0x2a66cb['appendChild'](_0x38c763),
    appendFailureDiagnostic(_0x2a66cb, diagnostic),
    appendMessageInputRefs(_0x2a66cb, inputRefs),
    appendTaskImageMedia(_0x2a66cb, task, { onImagePreview: onImagePreview }));
  const _0x22aded = _0x5dbc00 === 'user' ? createEl('div', 'agent-message-footer') : null;
  if (_0x22aded) {
    const _0x1e83f5 = createAgentMessageTime(ts);
    if (_0x1e83f5) _0x22aded['appendChild'](_0x1e83f5);
    _0x112307['appendChild'](_0x22aded);
  }
  const _0x1cfcd3 = buildAgentMessageCopyText(_0x496f6f, task);
  ((_0x112307['agentMessageCopyText'] = _0x1cfcd3), (_0x112307['agentMessageContent'] = _0x496f6f));
  if (_0x1cfcd3) {
    const _0x4e541b = createEl('button', 'agent-message-copy-btn');
    ((_0x4e541b['type'] = 'button'),
      (_0x4e541b['title'] = agentPanelText('copyMessage')),
      _0x4e541b['setAttribute']('aria-label', agentPanelText('copyMessage')),
      (_0x4e541b['innerHTML'] = copyIconHtml),
      _0x4e541b['addEventListener']('click', (_0x1e222f) => {
        (_0x1e222f['preventDefault']?.(),
          _0x1e222f['stopPropagation']?.(),
          onCopy?.(_0x112307['agentMessageCopyText']));
      }),
      (_0x22aded || _0x112307)['appendChild'](_0x4e541b));
  }
  return (_0x4a2912['appendChild'](_0x112307), scrollAgentMessageListToEnd(_0x4a2912), _0x112307);
}
function removeElement(_0x19e975) {
  if (!_0x19e975?.['parentNode']) return;
  if (typeof _0x19e975['remove'] === 'function') {
    _0x19e975['remove']();
    return;
  }
  const _0x1c7af9 = _0x19e975['parentNode'],
    _0x4fde51 = _0x1c7af9['children']?.['indexOf']?.(_0x19e975) ?? -0x1;
  if (_0x4fde51 >= 0x0) _0x1c7af9['children']['splice'](_0x4fde51, 0x1);
  _0x19e975['parentNode'] = null;
}
export function createAgentConversationPresentation({
  messagesEl: _0x4d9205,
  runStepsEl: _0x1638dc,
  sessionStore: sessionStore = null,
  getHistory: getHistory = () => [],
  onCopy: onCopy = null,
  onImagePreview: onImagePreview = null,
  copyIconHtml: copyIconHtml = '',
  onMessagesChanged: onMessagesChanged = null,
  onConversationInvalidated: onConversationInvalidated = null,
} = {}) {
  if (!_0x4d9205 || !_0x1638dc)
    throw new TypeError('[agentConversationPresentation] messagesEl and runStepsEl are required');
  let _0x52490f = ![],
    _0x4ad737 = ![],
    _0x4a9f0e = ![];
  const _0x15f85f = new Set();
  let _0x5ab0db = ![];
  const _0x5dcda9 = createAgentRunStatusPresentation({ root: _0x1638dc }),
    _0x235725 = createAgentConversationStreamingPresentation({
      messagesEl: _0x4d9205,
      appendEntry: _0x1c3a7c,
      onSettled: () => {
        ((_0x4a9f0e = ![]), (_0x4ad737 = _0x15f85f['size'] > 0x0), _0x34c100());
      },
    }),
    _0x544a0a = sessionStore?.['subscribeAssistantStream']?.(_0x235725['handle']);
  function _0x34c100() {
    onMessagesChanged?.({ hasMessages: _0x4d9205['children']['length'] > 0x0 });
  }
  function _0x38cde8(_0x375cf6, _0x3d046e, _0x5bd917 = {}) {
    const _0x46aecf = appendMessageToList(_0x4d9205, _0x375cf6, _0x3d046e, {
      ..._0x5bd917,
      onCopy: _0x5bd917['onCopy'] || onCopy,
      onImagePreview: _0x5bd917['onImagePreview'] || onImagePreview,
      copyIconHtml: _0x5bd917['copyIconHtml'] || copyIconHtml,
    });
    return (_0x34c100(), _0x46aecf);
  }
  function _0x1c3a7c(_0x466ff6 = {}) {
    return _0x38cde8(_0x466ff6['role'], _0x466ff6['content'] || _0x466ff6['status'] || '', {
      messageType: _0x466ff6['messageType'] || _0x466ff6['type'] || 'text',
      status: _0x466ff6['status'] || '',
      task: _0x466ff6['task'] || null,
      inputRefs: _0x466ff6['inputRefs'] || [],
      diagnostic: _0x466ff6['diagnostic'] || null,
      ts: _0x466ff6['ts'] || null,
    });
  }
  function _0x6adc10(_0x1e277a = getHistory()) {
    (_0x4d9205['replaceChildren'](),
      (Array['isArray'](_0x1e277a) ? _0x1e277a : [])['forEach']((_0x2a79d8) => {
        appendMessageToList(_0x4d9205, _0x2a79d8['role'], _0x2a79d8['content'] || _0x2a79d8['status'] || '', {
          messageType: _0x2a79d8['messageType'] || _0x2a79d8['type'] || 'text',
          status: _0x2a79d8['status'] || '',
          task: _0x2a79d8['task'] || null,
          inputRefs: _0x2a79d8['inputRefs'] || [],
          diagnostic: _0x2a79d8['diagnostic'] || null,
          ts: _0x2a79d8['ts'] || null,
          onCopy: onCopy,
          onImagePreview: onImagePreview,
          copyIconHtml: copyIconHtml,
        });
      }),
      _0x34c100());
  }
  function _0x2c0769(_0x4d9eb5 = {}) {
    _0x5dcda9['render'](_0x4d9eb5);
  }
  function _0x403ee8(_0x4e49df = {}) {
    const _0x199011 = _0x4e49df['sessionProjectionParity'];
    if (!_0x199011 || typeof _0x199011 !== 'object') {
      (delete _0x4d9205['dataset']['sessionProjection'],
        delete _0x4d9205['dataset']['sessionProjectionMismatches']);
      return;
    }
    ((_0x4d9205['dataset']['sessionProjection'] = _0x199011['ok'] === !![] ? 'matched' : 'mismatch'),
      Array['isArray'](_0x199011['mismatches']) && _0x199011['mismatches']['length'] > 0x0
        ? (_0x4d9205['dataset']['sessionProjectionMismatches'] = _0x199011['mismatches']['join'](','))
        : delete _0x4d9205['dataset']['sessionProjectionMismatches']);
  }
  function _0x109a5c({ history: history = getHistory(), sessionSnapshot: sessionSnapshot = {} } = {}) {
    (_0x6adc10(history), _0x2c0769(sessionSnapshot), _0x403ee8(sessionSnapshot));
  }
  function _0x50e24f() {
    const _0x3efeee = createEl('div', 'agent-message agent-message--assistant agent-message--typing'),
      _0x175a7f = createEl('span', 'agent-typing-label', agentPanelText('waiting')),
      _0x1240d7 = createEl('span', 'agent-typing-dots');
    return (
      _0x1240d7['append'](createEl('span'), createEl('span'), createEl('span')),
      _0x3efeee['append'](_0x175a7f, _0x1240d7),
      _0x4d9205['appendChild'](_0x3efeee),
      scrollAgentMessageListToEnd(_0x4d9205),
      _0x34c100(),
      _0x3efeee
    );
  }
  function _0x2d8b9c(_0x41c3fe) {
    (removeElement(_0x41c3fe), _0x34c100());
  }
  function _0x3affbf(_0x410b7e) {
    _0x52490f = _0x410b7e === !![];
    if (_0x52490f || !_0x4ad737 || _0x5ab0db) return;
    ((_0x4ad737 = ![]),
      (_0x4a9f0e = ![]),
      _0x15f85f['clear'](),
      onConversationInvalidated?.({ historyOnly: !![] }));
  }
  function _0x536857({ taskMessages: taskMessages = [] } = {}) {
    ((Array['isArray'](taskMessages) ? taskMessages : [])['forEach']((_0x2007fc) => {
      const _0x387c30 = getTaskResultEntryKey(_0x2007fc);
      if (_0x387c30) _0x15f85f['delete'](_0x387c30);
    }),
      (_0x4ad737 = _0x4a9f0e || _0x15f85f['size'] > 0x0));
  }
  let _0x491caf = !![];
  const _0xcd0d33 = sessionStore?.['subscribe']?.((_0x4c51ed, _0x546229 = {}) => {
    if (_0x491caf) {
      _0x491caf = ![];
      return;
    }
    if (_0x5ab0db) return;
    _0x403ee8(_0x4c51ed || {});
    if (_0x546229?.['type'] === 'history_replaced') {
      if (!_0x52490f) _0x235725['reconcile'](getHistory());
      return;
    }
    if (_0x52490f) {
      _0x546229?.['type'] === 'run_event' && _0x2c0769(_0x4c51ed || {});
      const _0x3179da = getTaskResultEntryKey(_0x546229?.['entry']);
      if (_0x3179da) ((_0x4ad737 = !![]), _0x15f85f['add'](_0x3179da));
      else
        _0x546229?.['type'] === 'history' && _0x546229['entry'] && ((_0x4ad737 = !![]), (_0x4a9f0e = !![]));
      return;
    }
    if (_0x546229?.['type'] === 'history' && _0x546229['entry']) {
      (_0x1c3a7c(_0x546229['entry']), _0x2c0769(_0x4c51ed || {}));
      return;
    }
    onConversationInvalidated?.();
  });
  return Object['freeze']({
    appendEntry: _0x1c3a7c,
    appendMessage: _0x38cde8,
    appendWaiting: _0x50e24f,
    removeWaiting: _0x2d8b9c,
    render: _0x109a5c,
    renderMessages: _0x6adc10,
    renderRunSteps: _0x2c0769,
    setBusy: _0x3affbf,
    acknowledgeSessionState: _0x536857,
    destroy() {
      ((_0x5ab0db = !![]),
        (_0x4ad737 = ![]),
        (_0x4a9f0e = ![]),
        _0x15f85f['clear'](),
        _0x5dcda9['destroy'](),
        _0x235725['destroy'](),
        _0x544a0a?.(),
        _0xcd0d33?.());
    },
  });
}
