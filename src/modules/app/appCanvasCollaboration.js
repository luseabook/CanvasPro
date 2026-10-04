import { createCollaborationApplication } from '../collaboration/collaborationApplication.js';
import { createCollaborationPanel } from '../collaboration/collaborationPanel.js';
import { createCollaborationPresence } from '../collaboration/collaborationPresence.js';
import { isSubscriptionActive } from '../subscriptionAccess.js';
import { createCollaborationConnectionIndicator } from '../collaboration/collaborationConnectionIndicator.js';
import { onlineCollaborationActors } from '../collaboration/collaborationMembers.js';
import { collaborationMemberColor } from '../collaboration/collaborationMemberColor.js';
import { createSharedProjectIcon } from '../../components/sharedProjectIcon.js';
import { showToast } from '../../services/toastService.js';
import { bindCollaborationEditors } from '../collaboration/collaborationEditorBindings.js';
import { createCollaborationComments } from '../collaboration/collaborationComments.js';
import { drawCollaborationCommentMarkers } from '../collaboration/collaborationCommentMarkers.js';
import { createCollaborationCommentNotifications } from '../collaboration/collaborationCommentNotifications.js';
import { createCollaborationChat } from '../collaboration/collaborationChat.js';
import { bindCollaborationChatInput } from '../collaboration/collaborationChatInput.js';
import { resolveShortcutActionForEvent, isRecording } from '../shortcuts.js';
export function initCanvasCollaboration({
  store: store,
  canvasTabs: canvasTabs,
  ensureInstallId: ensureInstallId,
  ensureDeviceId: ensureDeviceId,
  resetHistory: resetHistory,
  focusNode: focusNode,
  windowObject: windowObject = window,
}) {
  const el = document['querySelector']('.header-right');
  if (!el) return null;
  let enabled = ![];
  const el2 = document['createElement']('div');
  el2['className'] = 'collaboration-controls';
  const collaborationConnectionIndicator = createCollaborationConnectionIndicator(),
    el3 = document['createElement']('span');
  ((el3['className'] = 'collaboration-status'), el3['setAttribute']('role', 'status'));
  const el4 = document['createElement']('button');
  ((el4['className'] = 'collaboration-button collaboration-people'), (el4['type'] = 'button'));
  const anchor = document['createElement']('button');
  ((anchor['className'] = 'collaboration-button collaboration-entry'),
    (anchor['type'] = 'button'),
    anchor['setAttribute']('aria-haspopup', 'dialog'),
    anchor['setAttribute']('aria-expanded', 'false'));
  const el5 = document['createElement']('span');
  (anchor['append'](createSharedProjectIcon(), el5),
    el2['append'](el3, el4, collaborationConnectionIndicator['element'], anchor),
    el['insertBefore'](el2, el['querySelector']('#canvasVersionBadge')));
  let value = '';
  function run(enabled2) {
    const map = onlineCollaborationActors(enabled2, getSession['getState']()['actorId']),
      list = (enabled2?.['members'] || [])['filter']((item) => map['has'](item['id'])),
      key = JSON['stringify'](list['map']((error) => [error['id'], error['name'], error['colorIndex']]));
    ((el4['hidden'] = !enabled2),
      el4['setAttribute']('aria-label', '查看协作成员，' + list['length'] + ' 人在线'));
    if (key === value) return;
    ((value = key), el4['replaceChildren']());
    for (const error2 of list['slice'](0x0, 0x3)) {
      const el6 = document['createElement']('span');
      ((el6['className'] = 'collaboration-avatar'),
        (el6['textContent'] = error2['name']['slice'](0x0, 0x1)),
        el6['style']['setProperty']('--member-color', collaborationMemberColor(error2)),
        (el6['title'] = error2['name']),
        el4['append'](el6));
    }
    if (list['length'] > 0x3 || !list['length']) {
      const el7 = document['createElement']('span');
      ((el7['textContent'] = list['length'] ? '+' + (list['length'] - 0x3) : '成员'), el4['append'](el7));
    }
  }
  const getSession = createCollaborationApplication({
      store: store,
      canvasTabs: canvasTabs,
      ensureInstallId: ensureInstallId,
      ensureDeviceId: ensureDeviceId,
      resetHistory: resetHistory,
      saveProject: () => windowObject['_v2SaveProjectFromShortcut']?.({ waitForDialog: !![] }),
      onNotice: (index) => showToast(index),
      onComment: (result) => run2(result),
      onChange(data) {
        run3();
        if (['blocked', 'offline']['includes'](data['session']?.['status']))
          collaborationPanel['feedback'](data['session']['message']);
      },
      onPresence(options) {
        !enabled &&
          (collaborationConnectionIndicator['update'](options),
          run(options),
          collaborationPanel['renderPresence'](),
          collaborationPresence['redraw']());
      },
    }),
    comments = createCollaborationComments({ store: store, getSession: getSession['getSession'] });
  function openNode(target, source) {
    if (!store['getStateRaw']()['nodes'][target]) return;
    (getSession['getSession']()?.['follow'](''), focusNode?.(target, 0x60, 0x1f4));
    if (source) comments['open'](target);
  }
  const run2 = createCollaborationCommentNotifications({
      getSession: getSession['getSession'],
      hasNode: (next) => !!store['getStateRaw']()['nodes'][next],
      getNode: (current) => store['getStateRaw']()['nodes'][current],
      openNode: openNode,
    }),
    chat = createCollaborationChat({
      store: store,
      getSession: getSession['getSession'],
      openNode: (entry) => openNode(entry, ![]),
    }),
    handler = bindCollaborationChatInput({
      chat: chat,
      store: store,
      resolveShortcutActionForEvent: resolveShortcutActionForEvent,
      isRecording: isRecording,
      windowObject: windowObject,
    }),
    collaborationPresence = createCollaborationPresence({
      store: store,
      getSession: getSession['getSession'],
      drawComments: (args) => drawCollaborationCommentMarkers({ ...args, comments: comments, chat: chat }),
    }),
    handler2 = bindCollaborationEditors({ store: store, windowObject: windowObject });
  function run3() {
    if (enabled) return;
    const error3 = getSession['getState']()['session'];
    (collaborationConnectionIndicator['update'](error3),
      (el5['textContent'] = error3
        ? '协作中\x20·\x20' + (error3['hosting'] ? '房主' : '成员')
        : isSubscriptionActive(store['getStateRaw']()['subscription'] || {})
          ? '开启协作'
          : '协作 · 需激活'),
      anchor['classList']['toggle']('is-active', !!error3));
    const enabled3 = error3?.['status'] === 'connecting';
    (anchor['setAttribute']('aria-busy', String(!!enabled3)),
      (el3['textContent'] = error3
        ? error3['status'] === 'online'
          ? ''
          : error3['status'] === 'offline'
            ? '连接中断'
            : error3['status'] === 'blocked'
              ? '协作已暂停'
              : '连接中'
        : ''),
      (el3['title'] = error3?.['status'] === 'online' ? '' : error3?.['message'] || ''),
      (el3['hidden'] = !error3 || error3['status'] === 'online'),
      run(error3),
      collaborationPanel['render'](),
      collaborationPresence['redraw'](),
      comments['update'](),
      chat['update']());
  }
  const collaborationPanel = createCollaborationPanel({
    actions: {
      ...getSession['actions'],
      activate: () => windowObject['openSubscriptionDialog']?.(),
      copy: (record) => navigator['clipboard']['writeText'](record),
      refreshReview: () => getSession['getSession']()?.['review']['refresh'](undefined, !![]),
      hasReviewNode: (payload) => !!store['getStateRaw']()['nodes'][payload],
      openReviewNode: openNode,
    },
    getState: getSession['getState'],
    anchor: anchor,
    keepOpenOnOutside: (el8) => !!el8['closest']?.('#fabBtn,\x20.agent-sidebar'),
  });
  function show() {
    (collaborationPanel['show'](), void getSession['ensureAuthenticated']()['catch'](() => {}));
  }
  (anchor['addEventListener']('click', () => {
    (collaborationPanel['toggle'](), void getSession['ensureAuthenticated']()['catch'](() => {}));
  }),
    el4['addEventListener']('click', show));
  const el9 = document['createElement']('button');
  ((el9['type'] = 'button'),
    (el9['className'] = 'cpd-new-btn'),
    (el9['textContent'] = '协作画布'),
    el9['addEventListener']('click', show),
    document['querySelector']('.cpd-footer')?.['append'](el9));
  const run4 = store['subscribeSelector']((handle) => handle['subscription'], run3);
  windowObject['addEventListener']('aicanvas:active-canvas-changed', getSession['refreshCanvas']);
  const state = (event) => {
    const enabled4 = getSession['getSession']();
    enabled4 && !enabled4['canDetach']() && (event['preventDefault'](), (event['returnValue'] = ''));
  };
  return (
    windowObject['addEventListener']('beforeunload', state),
    run3(),
    {
      show: show,
      getSession: getSession['getSession'],
      destroy() {
        ((enabled = !![]), handler2(), handler(), chat['destroy']());
        const config = getSession['destroy']();
        return (
          run4(),
          collaborationPanel['destroy'](),
          collaborationPresence['destroy'](),
          comments['destroy'](),
          el2['remove'](),
          el9['remove'](),
          windowObject['removeEventListener']('beforeunload', state),
          windowObject['removeEventListener']('aicanvas:active-canvas-changed', getSession['refreshCanvas']),
          config
        );
      },
    }
  );
}
