import { getAgentEditableTurn, AGENT_REPLY_VERSION_LIMIT } from './agentReplyVersions.js';
import { agentConversationActionText } from './agentConversationActionText.js';
import { agentIconSvg } from './agentPanelElements.js';
export function createAgentConversationActions({
  messagesEl: messagesEl,
  runtime: runtime,
  getBusy: getBusy,
  setBusy: setBusy2,
  getPresentation: getPresentation,
  onResult: onResult,
  setNotice: setNotice,
  replyActions: replyActions = [],
}) {
  let el = null,
    value = '';
  const run = (item, handler, key) => {
    const el2 = document['createElement']('button');
    return (
      (el2['type'] = 'button'),
      (el2['className'] = ('agent-message-action ' + (key || ''))['trim']()),
      (el2['textContent'] = item),
      el2['addEventListener']('click', (event) => {
        event['stopPropagation']();
        if (!getBusy()) handler();
      }),
      el2
    );
  };
  function destroy() {
    (el?.['remove'](), (el = null));
  }
  async function run2(itemId, message) {
    if (getBusy()) return;
    (destroy(), setNotice(''), setBusy2(!![], { stoppable: !![] }));
    const el3 = getPresentation()['appendWaiting']();
    try {
      const response = await runtime['reviseAssistantTurn']({
        itemId: itemId,
        ...(message === undefined ? {} : { message: message }),
      });
      onResult(response);
      if (response?.['ok'] === ![] && !response['stale']) setNotice(response['reply']);
    } catch (error) {
      setNotice(error['message']);
    } finally {
      const index = Boolean(el3['parentNode']);
      getPresentation()['removeWaiting'](el3);
      if (index) setBusy2(![]);
    }
  }
  function run3(result, data) {
    (destroy(), (el = document['createElement']('div')), (el['className'] = 'agent-message-editor'));
    const el4 = document['createElement']('textarea');
    ((el4['className'] = 'agent-message-edit-input'),
      el4['setAttribute']('aria-label', agentConversationActionText('edit')),
      (el4['rows'] = 0x4),
      (el4['value'] = result['user']['content']));
    const el5 = run(
      agentConversationActionText('save'),
      () => {
        if (el4['value']['trim']()) void run2(result['itemId'], el4['value']['trim']());
      },
      'agent-message-edit-save',
    );
    (el4['addEventListener']('input', () => {
      el5['disabled'] = !el4['value']['trim']();
    }),
      el4['addEventListener']('keydown', (event2) => {
        event2['stopPropagation']();
        if (event2['key'] === 'Escape') destroy();
        if ((event2['ctrlKey'] || event2['metaKey']) && event2['key'] === 'Enter' && !event2['isComposing'])
          el5['click']();
      }),
      el['append'](el4, run(agentConversationActionText('cancel'), destroy), el5),
      data['append'](el),
      el4['focus']());
  }
  function render() {
    if (typeof runtime['reviseAssistantTurn'] !== 'function') return;
    const itemId2 = getAgentEditableTurn(runtime['sessionStore']['getHistory']()),
      list = [...messagesEl['querySelectorAll']('.agent-message:not(.agent-message--typing)')],
      index2 = itemId2?.['assistant']['replyVersions'],
      options = itemId2
        ? itemId2['itemId'] +
          ':' +
          (index2?.['activeIndex'] || 0x0) +
          ':' +
          (index2?.['versions']['length'] || 0x1) +
          ':' +
          agentConversationActionText('retry')
        : '',
      target = messagesEl['querySelector']('.agent-message-actions');
    if (
      options === value &&
      target &&
      (!itemId2 || list['length'] === runtime['sessionStore']['getHistory']()['length'])
    ) {
      run4();
      return;
    }
    if (getBusy() && target) {
      run4();
      return;
    }
    (destroy(),
      messagesEl['querySelectorAll']('.agent-message-actions')['forEach']((el6) => el6['remove']()),
      (value = options));
    if (!itemId2 || list['length'] !== runtime['sessionStore']['getHistory']()['length']) return;
    const el7 = list['at'](-0x2),
      source = list['at'](-0x1),
      next = document['createElement']('div');
    next['className'] = 'agent-message-actions';
    const el8 = run(agentConversationActionText('edit'), () => run3(itemId2, el7), 'agent-message-edit');
    ((el8['title'] = agentConversationActionText('edit')),
      el8['setAttribute']('aria-label', agentConversationActionText('edit')),
      (el8['innerHTML'] = agentIconSvg('edit')),
      next['append'](el8));
    const current = document['createElement']('div');
    ((current['className'] = 'agent-message-actions'),
      current['append'](
        run(
          agentConversationActionText('retry'),
          () => void run2(itemId2['itemId']),
          'agent-message-regenerate',
        ),
      ));
    if (itemId2['assistant']['status'] === 'chat')
      replyActions['forEach']((entry) => {
        current['append'](
          run(
            entry['label'],
            () => {
              try {
                entry['apply'](itemId2['assistant']['content']);
              } catch (error2) {
                setNotice(error2['message']);
              }
            },
            entry['className'],
          ),
        );
      });
    if (index2?.['versions']['length'] > 0x1) {
      const el9 = run(
          '‹',
          () =>
            onResult(
              runtime['selectAssistantVersion']({
                itemId: itemId2['itemId'],
                index: index2['activeIndex'] - 0x1,
              }),
            ),
          'agent-message-version-prev',
        ),
        el10 = run(
          '›',
          () =>
            onResult(
              runtime['selectAssistantVersion']({
                itemId: itemId2['itemId'],
                index: index2['activeIndex'] + 0x1,
              }),
            ),
          'agent-message-version-next',
        );
      (el9['setAttribute']('aria-label', agentConversationActionText('previous')),
        el10['setAttribute']('aria-label', agentConversationActionText('next')));
      const el11 = document['createElement']('span');
      ((el11['className'] = 'agent-message-version-count'),
        el11['setAttribute']('aria-label', agentConversationActionText('version')),
        (el11['textContent'] = index2['activeIndex'] + 0x1 + ' / ' + index2['versions']['length']),
        current['append'](el9, el11, el10));
    }
    ((el7['querySelector']('.agent-message-footer') || el7)['append'](next),
      source['append'](current),
      run4());
  }
  function run4() {
    const agentEditableTurn = getAgentEditableTurn(runtime['sessionStore']['getHistory']())?.['assistant'][
      'replyVersions'
    ];
    messagesEl['querySelectorAll']('.agent-message-action')['forEach']((el12) => {
      el12['disabled'] =
        getBusy() ||
        (el12['classList']['contains']('agent-message-version-prev') &&
          !agentEditableTurn?.['activeIndex']) ||
        (el12['classList']['contains']('agent-message-version-next') &&
          agentEditableTurn?.['activeIndex'] === agentEditableTurn?.['versions']['length'] - 0x1) ||
        ((el12['classList']['contains']('agent-message-regenerate') ||
          el12['classList']['contains']('agent-message-edit')) &&
          agentEditableTurn?.['versions']['length'] >= AGENT_REPLY_VERSION_LIMIT);
    });
  }
  return {
    render: render,
    setBusy() {
      if (getBusy()) destroy();
      render();
    },
    destroy: destroy,
  };
}
