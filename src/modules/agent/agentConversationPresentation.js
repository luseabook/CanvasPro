import { renderMarkdownToHtml } from '../../components/aigenText/markdownRenderer.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { formatAgentAssistantMarkdown } from './agentAssistantMarkdown.js';
import { agentPanelText, formatAgentPanelText } from './agentPanelText.js';
import { scrollAgentMessageListToEnd } from './agentConversationScroll.js';
import { createAgentRunStatusPresentation } from './agentRunStatusPresentation.js';
import { createAgentConversationStreamingPresentation } from './agentConversationStreamingPresentation.js';
import { createAgentMessageTime } from './agentMessageTime.js';
export const AGENT_CONVERSATION_INPUT_REF_LIMIT = 12;
export { formatAgentAssistantMarkdown };
function getTaskResultEntryKey(response = {}) {
  const value = String(response['messageType'] || response['type'] || '')['trim']();
  if (value !== 'task_result') return '';
  const response2 = response['task'] && typeof response['task'] === 'object' ? response['task'] : {},
    enabled = String(response2['taskId'] || '')['trim'](),
    enabled2 = String(response2['nodeId'] || '')['trim'](),
    item = String(response2['status'] || response['status'] || '')['trim']();
  if (!enabled && !enabled2) return '';
  return enabled + '\x00' + enabled2 + '\x00' + item;
}
function createEl(key, index = '', result = '') {
  const el = document['createElement'](key);
  if (index) el['className'] = index;
  if (result) el['textContent'] = result;
  return el;
}
function normalizeMessageClassSegment(data = '') {
  return String(data || '')
    ['trim']()
    ['toLowerCase']()
    ['replace'](/_/g, '-')
    ['replace'](/[^a-z0-9_-]+/g, '-');
}
export function normalizeAgentRenderableMediaUrl(options) {
  const list = String(options || '')['trim']();
  if (!list) return '';
  if (/^https?:\/\//i['test'](list) || list['startsWith']('/')) return list;
  if (/^data:image\//i['test'](list) && list['length'] <= 50000) return list;
  return localPathToUrl(list) || '';
}
function normalizeTaskImageMediaItems(options2 = {}) {
  const error = options2?.['media'];
  if (!error || error['kind'] !== 'image') return [];
  const list2 = Array['isArray'](error['items']) && error['items']['length'] > 0 ? error['items'] : [error];
  return list2['map']((error2) => {
    const url = normalizeAgentRenderableMediaUrl(error2?.['url'] || error2?.['thumbUrl']),
      thumbUrl = normalizeAgentRenderableMediaUrl(error2?.['thumbUrl'] || error2?.['url']);
    if (!url && !thumbUrl) return null;
    return {
      url: url || thumbUrl,
      thumbUrl: thumbUrl || url,
      name: String(error2?.['name'] || error['name'] || options2['nodeId'] || '')['trim'](),
    };
  })['filter'](Boolean);
}
function buildAgentMessageCopyText(target = '', source = null) {
  const list3 = [String(target || '')['trim']()]['filter'](Boolean),
    list4 =
      source?.['media']?.['kind'] === 'image'
        ? Array['isArray'](source['media']['items']) && source['media']['items']['length'] > 0
          ? source['media']['items']
          : [source['media']]
        : [],
    next = String(source?.['media']?.['name'] || source?.['nodeId'] || '')['trim']();
  return (
    next &&
      list3['push'](
        '' + agentPanelText('copyMessageNodeLabel') + agentPanelText('copyMessageSeparator') + next,
      ),
    list4['forEach']((response3, current) => {
      const enabled3 = String(response3?.['url'] || response3?.['thumbUrl'] || '')['trim']();
      if (!enabled3) return;
      list3['push'](
        '' +
          agentPanelText('copyMessageImageLabel') +
          (list4['length'] > 1 ? current + 1 : '') +
          agentPanelText('copyMessageSeparator') +
          enabled3,
      );
    }),
    list3['join']('\n')
  );
}
function appendTaskImageMedia(el2, entry = {}, { onImagePreview: onImagePreview = null } = {}) {
  const list5 = normalizeTaskImageMediaItems(entry);
  if (list5['length'] === 0) return;
  const el3 = createEl('div', 'agent-message-media-grid');
  (el3['classList']['toggle']('is-multiple', list5['length'] > 1),
    list5['forEach']((error3, record) => {
      const el4 = createEl('button', 'agent-message-media-card');
      ((el4['type'] = 'button'),
        (el4['title'] = agentPanelText('imageResultOpen')),
        el4['setAttribute']('aria-label', error3['name'] || agentPanelText('imageResultOpen')),
        (el4['dataset']['imageUrl'] = error3['url']),
        (el4['dataset']['imageName'] = error3['name'] || entry['nodeId'] || ''));
      const el5 = createEl('img', 'agent-message-media-image');
      ((el5['src'] = error3['thumbUrl']),
        (el5['alt'] = error3['name'] || entry['nodeId'] || ''),
        (el5['draggable'] = ![]),
        el4['appendChild'](el5),
        error3['name'] &&
          el4['appendChild'](
            createEl(
              'span',
              'agent-message-media-name',
              list5['length'] > 1 ? error3['name'] + ' ' + (record + 1) : error3['name'],
            ),
          ),
        el4['addEventListener']('click', (event) => {
          (event['preventDefault']?.(),
            event['stopPropagation']?.(),
            onImagePreview?.(error3['url'], error3['name'] || entry['nodeId'] || ''));
        }),
        el3['appendChild'](el4));
    }),
    el2['appendChild'](el3));
}
function appendMessageInputRefs(el6, payload = []) {
  const list6 = (Array['isArray'](payload) ? payload : [])
    ['filter']((handle) => String(handle?.['nodeId'] || handle?.['id'] || '')['trim']())
    ['slice'](0, AGENT_CONVERSATION_INPUT_REF_LIMIT);
  if (list6['length'] === 0) return;
  const el7 = createEl('div', 'agent-message-input-refs');
  (el7['setAttribute']('role', 'list'),
    list6['forEach']((error4) => {
      const state = String(error4['nodeId'] || error4['id'] || '')['trim'](),
        config = String(error4['label'] || error4['name'] || state)['trim'](),
        el8 = createEl('div', 'agent-message-input-ref');
      ((el8['dataset']['inputRefId'] = state),
        el8['setAttribute']('role', 'listitem'),
        (el8['title'] = config));
      if (error4['thumbUrl']) {
        const el9 = createEl('img', 'agent-message-input-ref-thumb');
        ((el9['src'] = error4['thumbUrl']),
          (el9['alt'] = config),
          (el9['draggable'] = ![]),
          el8['appendChild'](el9));
      } else {
        const el10 = createEl(
          'div',
          'agent-message-input-ref-fallback',
          String(error4['kind'] || 'node')
            ['slice'](0, 3)
            ['toUpperCase'](),
        );
        (el10['setAttribute']('aria-hidden', 'true'), el8['appendChild'](el10));
      }
      if (config) el8['appendChild'](createEl('span', 'agent-message-input-ref-name', config));
      el7['appendChild'](el8);
    }),
    el6['appendChild'](el7));
}
function appendFailureDiagnostic(el11, code = null) {
  if (!code || typeof code !== 'object' || !code['summary']) return;
  const el12 = createEl('section', 'agent-diagnostic');
  ((el12['hidden'] = ![]), el12['setAttribute']('aria-label', agentPanelText('diagnosticTitle')));
  const el13 = createEl('div', 'agent-diagnostic-header');
  el13['append'](
    createEl('span', 'agent-diagnostic-title', agentPanelText('diagnosticTitle')),
    createEl('span', 'agent-diagnostic-phase', code['phaseLabel'] || code['phase'] || ''),
  );
  const el14 = createEl('div', 'agent-diagnostic-summary', code['summary']),
    el15 = createEl('div', 'agent-diagnostic-meta');
  el15['append'](
    createEl(
      'span',
      'agent-diagnostic-meta-item',
      formatAgentPanelText('diagnosticStep', { step: Math['max'](1, Number(code['step'] || 1)) }),
    ),
    createEl(
      'span',
      'agent-diagnostic-meta-item',
      formatAgentPanelText('diagnosticCompleted', {
        count: Math['max'](0, Number(code['completedSteps'] || 0)),
      }),
    ),
  );
  const el16 = createEl('div', 'agent-diagnostic-detail');
  el16['hidden'] = !![];
  if (code['detail']) el16['appendChild'](createEl('div', '', code['detail']));
  code['errorCode'] &&
    el16['appendChild'](
      createEl(
        'code',
        'agent-diagnostic-code',
        formatAgentPanelText('diagnosticErrorCode', { code: code['errorCode'] }),
      ),
    );
  const el17 = createEl('button', 'agent-diagnostic-toggle', agentPanelText('diagnosticDetails'));
  ((el17['type'] = 'button'),
    el17['setAttribute']('aria-expanded', 'false'),
    el17['addEventListener']('click', () => {
      const enabled4 = el16['hidden'] === !![];
      ((el16['hidden'] = !enabled4),
        el17['setAttribute']('aria-expanded', enabled4 ? 'true' : 'false'),
        (el17['textContent'] = agentPanelText(enabled4 ? 'diagnosticDetailsHide' : 'diagnosticDetails')));
    }),
    el12['append'](el13, el14, el15, el17, el16),
    el11['appendChild'](el12));
}
function appendMessageToList(
  el18,
  scope,
  input,
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
  const output = String(scope || '') === 'user' ? 'user' : 'assistant',
    list7 = ['agent-message', 'agent-message--' + output],
    messageClassSegment = normalizeMessageClassSegment(messageType);
  messageClassSegment &&
    messageClassSegment !== 'text' &&
    list7['push']('agent-message--' + messageClassSegment);
  const messageClassSegment2 = normalizeMessageClassSegment(status);
  if (messageClassSegment2) list7['push']('agent-message--status-' + messageClassSegment2);
  const el19 = createEl('div', list7['join'](' ')),
    value2 = String(input || '');
  (typeof HTMLElement === 'undefined' || !(el19 instanceof HTMLElement)) && (el19['textContent'] = value2);
  const el20 = createEl('div', 'agent-message-body');
  el20['textContent'] = value2;
  if (output === 'assistant' && (!messageClassSegment || messageClassSegment === 'text')) {
    el19['classList']['add']('agent-message--rich');
    const html = renderMarkdownToHtml(formatAgentAssistantMarkdown(value2));
    if (html) el20['innerHTML'] = html;
  }
  const el21 = output === 'user' ? createEl('div', 'agent-message-bubble') : el19;
  if (el21 !== el19) el19['appendChild'](el21);
  (el21['appendChild'](el20),
    appendFailureDiagnostic(el21, diagnostic),
    appendMessageInputRefs(el21, inputRefs),
    appendTaskImageMedia(el21, task, { onImagePreview: onImagePreview }));
  const el22 = output === 'user' ? createEl('div', 'agent-message-footer') : null;
  if (el22) {
    const agentMessageTime = createAgentMessageTime(ts);
    if (agentMessageTime) el22['appendChild'](agentMessageTime);
    el19['appendChild'](el22);
  }
  const agentMessageCopyText = buildAgentMessageCopyText(value2, task);
  ((el19['agentMessageCopyText'] = agentMessageCopyText), (el19['agentMessageContent'] = value2));
  if (agentMessageCopyText) {
    const el23 = createEl('button', 'agent-message-copy-btn');
    ((el23['type'] = 'button'),
      (el23['title'] = agentPanelText('copyMessage')),
      el23['setAttribute']('aria-label', agentPanelText('copyMessage')),
      (el23['innerHTML'] = copyIconHtml),
      el23['addEventListener']('click', (event2) => {
        (event2['preventDefault']?.(), event2['stopPropagation']?.(), onCopy?.(el19['agentMessageCopyText']));
      }),
      (el22 || el19)['appendChild'](el23));
  }
  return (el18['appendChild'](el19), scrollAgentMessageListToEnd(el18), el19);
}
function removeElement(el24) {
  if (!el24?.['parentNode']) return;
  if (typeof el24['remove'] === 'function') {
    el24['remove']();
    return;
  }
  const el25 = el24['parentNode'],
    count = el25['children']?.['indexOf']?.(el24) ?? -1;
  if (count >= 0) el25['children']['splice'](count, 1);
  el24['parentNode'] = null;
}
export function createAgentConversationPresentation({
  messagesEl: messagesEl,
  runStepsEl: runStepsEl,
  sessionStore: sessionStore = null,
  getHistory: getHistory = () => [],
  onCopy: onCopy = null,
  onImagePreview: onImagePreview = null,
  copyIconHtml: copyIconHtml = '',
  onMessagesChanged: onMessagesChanged = null,
  onConversationInvalidated: onConversationInvalidated = null,
} = {}) {
  if (!messagesEl || !runStepsEl)
    throw new TypeError('[agentConversationPresentation] messagesEl and runStepsEl are required');
  let enabled5 = ![],
    enabled6 = ![],
    enabled7 = ![];
  const map = new Set();
  let value3 = ![];
  const agentRunStatusPresentation = createAgentRunStatusPresentation({ root: runStepsEl }),
    agentConversationStreamingPresentation = createAgentConversationStreamingPresentation({
      messagesEl: messagesEl,
      appendEntry: appendEntry,
      onSettled: () => {
        ((enabled7 = ![]), (enabled6 = map['size'] > 0), run());
      },
    }),
    value4 = sessionStore?.['subscribeAssistantStream']?.(agentConversationStreamingPresentation['handle']);
  function run() {
    onMessagesChanged?.({ hasMessages: messagesEl['children']['length'] > 0 });
  }
  function appendMessage(value5, value6, onCopy2 = {}) {
    const list8 = appendMessageToList(messagesEl, value5, value6, {
      ...onCopy2,
      onCopy: onCopy2['onCopy'] || onCopy,
      onImagePreview: onCopy2['onImagePreview'] || onImagePreview,
      copyIconHtml: onCopy2['copyIconHtml'] || copyIconHtml,
    });
    return (run(), list8);
  }
  function appendEntry(messageType2 = {}) {
    return appendMessage(messageType2['role'], messageType2['content'] || messageType2['status'] || '', {
      messageType: messageType2['messageType'] || messageType2['type'] || 'text',
      status: messageType2['status'] || '',
      task: messageType2['task'] || null,
      inputRefs: messageType2['inputRefs'] || [],
      diagnostic: messageType2['diagnostic'] || null,
      ts: messageType2['ts'] || null,
    });
  }
  function renderMessages(history2 = getHistory()) {
    (messagesEl['replaceChildren'](),
      (Array['isArray'](history2) ? history2 : [])['forEach']((messageType3) => {
        appendMessageToList(
          messagesEl,
          messageType3['role'],
          messageType3['content'] || messageType3['status'] || '',
          {
            messageType: messageType3['messageType'] || messageType3['type'] || 'text',
            status: messageType3['status'] || '',
            task: messageType3['task'] || null,
            inputRefs: messageType3['inputRefs'] || [],
            diagnostic: messageType3['diagnostic'] || null,
            ts: messageType3['ts'] || null,
            onCopy: onCopy,
            onImagePreview: onImagePreview,
            copyIconHtml: copyIconHtml,
          },
        );
      }),
      run());
  }
  function renderRunSteps(options3 = {}) {
    agentRunStatusPresentation['render'](options3);
  }
  function run2(options4 = {}) {
    const response4 = options4['sessionProjectionParity'];
    if (!response4 || typeof response4 !== 'object') {
      (delete messagesEl['dataset']['sessionProjection'],
        delete messagesEl['dataset']['sessionProjectionMismatches']);
      return;
    }
    ((messagesEl['dataset']['sessionProjection'] = response4['ok'] === !![] ? 'matched' : 'mismatch'),
      Array['isArray'](response4['mismatches']) && response4['mismatches']['length'] > 0
        ? (messagesEl['dataset']['sessionProjectionMismatches'] = response4['mismatches']['join'](','))
        : delete messagesEl['dataset']['sessionProjectionMismatches']);
  }
  function render({ history: history = getHistory(), sessionSnapshot: sessionSnapshot = {} } = {}) {
    (renderMessages(history), renderRunSteps(sessionSnapshot), run2(sessionSnapshot));
  }
  function appendWaiting() {
    const el26 = createEl('div', 'agent-message agent-message--assistant agent-message--typing'),
      el27 = createEl('span', 'agent-typing-label', agentPanelText('waiting')),
      el28 = createEl('span', 'agent-typing-dots');
    return (
      el28['append'](createEl('span'), createEl('span'), createEl('span')),
      el26['append'](el27, el28),
      messagesEl['appendChild'](el26),
      scrollAgentMessageListToEnd(messagesEl),
      run(),
      el26
    );
  }
  function removeWaiting(value7) {
    (removeElement(value7), run());
  }
  function setBusy(value8) {
    enabled5 = value8 === !![];
    if (enabled5 || !enabled6 || value3) return;
    ((enabled6 = ![]), (enabled7 = ![]), map['clear'](), onConversationInvalidated?.({ historyOnly: !![] }));
  }
  function acknowledgeSessionState({ taskMessages: taskMessages = [] } = {}) {
    ((Array['isArray'](taskMessages) ? taskMessages : [])['forEach']((value9) => {
      const taskResultEntryKey = getTaskResultEntryKey(value9);
      if (taskResultEntryKey) map['delete'](taskResultEntryKey);
    }),
      (enabled6 = enabled7 || map['size'] > 0));
  }
  let value10 = !![];
  const value11 = sessionStore?.['subscribe']?.((value12, value13 = {}) => {
    if (value10) {
      value10 = ![];
      return;
    }
    if (value3) return;
    run2(value12 || {});
    if (value13?.['type'] === 'history_replaced') {
      if (!enabled5) agentConversationStreamingPresentation['reconcile'](getHistory());
      return;
    }
    if (enabled5) {
      value13?.['type'] === 'run_event' && renderRunSteps(value12 || {});
      const taskResultEntryKey2 = getTaskResultEntryKey(value13?.['entry']);
      if (taskResultEntryKey2) ((enabled6 = !![]), map['add'](taskResultEntryKey2));
      else value13?.['type'] === 'history' && value13['entry'] && ((enabled6 = !![]), (enabled7 = !![]));
      return;
    }
    if (value13?.['type'] === 'history' && value13['entry']) {
      (appendEntry(value13['entry']), renderRunSteps(value12 || {}));
      return;
    }
    onConversationInvalidated?.();
  });
  return Object['freeze']({
    appendEntry: appendEntry,
    appendMessage: appendMessage,
    appendWaiting: appendWaiting,
    removeWaiting: removeWaiting,
    render: render,
    renderMessages: renderMessages,
    renderRunSteps: renderRunSteps,
    setBusy: setBusy,
    acknowledgeSessionState: acknowledgeSessionState,
    destroy() {
      ((value3 = !![]),
        (enabled6 = ![]),
        (enabled7 = ![]),
        map['clear'](),
        agentRunStatusPresentation['destroy'](),
        agentConversationStreamingPresentation['destroy'](),
        value4?.(),
        value11?.());
    },
  });
}
