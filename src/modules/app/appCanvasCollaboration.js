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
  store: _0x22ffd1,
  canvasTabs: _0x17fb7a,
  ensureInstallId: _0x22d81e,
  ensureDeviceId: _0x471673,
  resetHistory: _0x3fe8f7,
  focusNode: _0xd20415,
  windowObject: windowObject = window,
}) {
  const _0x4fe8de = document['querySelector']('.header-right');
  if (!_0x4fe8de) return null;
  let _0x36b1d2 = ![];
  const _0x2ff83d = document['createElement']('div');
  _0x2ff83d['className'] = 'collaboration-controls';
  const _0x44f1dc = createCollaborationConnectionIndicator(),
    _0x2052d3 = document['createElement']('span');
  ((_0x2052d3['className'] = 'collaboration-status'), _0x2052d3['setAttribute']('role', 'status'));
  const _0x51c14f = document['createElement']('button');
  ((_0x51c14f['className'] = 'collaboration-button collaboration-people'), (_0x51c14f['type'] = 'button'));
  const _0x1eb950 = document['createElement']('button');
  ((_0x1eb950['className'] = 'collaboration-button collaboration-entry'),
    (_0x1eb950['type'] = 'button'),
    _0x1eb950['setAttribute']('aria-haspopup', 'dialog'),
    _0x1eb950['setAttribute']('aria-expanded', 'false'));
  const _0x27f393 = document['createElement']('span');
  (_0x1eb950['append'](createSharedProjectIcon(), _0x27f393),
    _0x2ff83d['append'](_0x2052d3, _0x51c14f, _0x44f1dc['element'], _0x1eb950),
    _0x4fe8de['insertBefore'](_0x2ff83d, _0x4fe8de['querySelector']('#canvasVersionBadge')));
  let _0x342460 = '';
  function _0x273016(_0x496a31) {
    const _0x81b3ab = onlineCollaborationActors(_0x496a31, _0x514b73['getState']()['actorId']),
      _0x39d46f = (_0x496a31?.['members'] || [])['filter']((_0x291ddd) => _0x81b3ab['has'](_0x291ddd['id'])),
      _0x12e765 = JSON['stringify'](
        _0x39d46f['map']((_0xb0bcfc) => [_0xb0bcfc['id'], _0xb0bcfc['name'], _0xb0bcfc['colorIndex']]),
      );
    ((_0x51c14f['hidden'] = !_0x496a31),
      _0x51c14f['setAttribute']('aria-label', '查看协作成员，' + _0x39d46f['length'] + ' 人在线'));
    if (_0x12e765 === _0x342460) return;
    ((_0x342460 = _0x12e765), _0x51c14f['replaceChildren']());
    for (const _0x361d39 of _0x39d46f['slice'](0x0, 0x3)) {
      const _0x2d48f7 = document['createElement']('span');
      ((_0x2d48f7['className'] = 'collaboration-avatar'),
        (_0x2d48f7['textContent'] = _0x361d39['name']['slice'](0x0, 0x1)),
        _0x2d48f7['style']['setProperty']('--member-color', collaborationMemberColor(_0x361d39)),
        (_0x2d48f7['title'] = _0x361d39['name']),
        _0x51c14f['append'](_0x2d48f7));
    }
    if (_0x39d46f['length'] > 0x3 || !_0x39d46f['length']) {
      const _0x585104 = document['createElement']('span');
      ((_0x585104['textContent'] = _0x39d46f['length'] ? '+' + (_0x39d46f['length'] - 0x3) : '成员'),
        _0x51c14f['append'](_0x585104));
    }
  }
  const _0x514b73 = createCollaborationApplication({
      store: _0x22ffd1,
      canvasTabs: _0x17fb7a,
      ensureInstallId: _0x22d81e,
      ensureDeviceId: _0x471673,
      resetHistory: _0x3fe8f7,
      saveProject: () => windowObject['_v2SaveProjectFromShortcut']?.({ waitForDialog: !![] }),
      onNotice: (_0x453209) => showToast(_0x453209),
      onComment: (_0x2c9b83) => _0x271fb5(_0x2c9b83),
      onChange(_0xb5497a) {
        _0x437852();
        if (['blocked', 'offline']['includes'](_0xb5497a['session']?.['status']))
          _0x2be5ce['feedback'](_0xb5497a['session']['message']);
      },
      onPresence(_0xc9787e) {
        !_0x36b1d2 &&
          (_0x44f1dc['update'](_0xc9787e),
          _0x273016(_0xc9787e),
          _0x2be5ce['renderPresence'](),
          _0x4f3a4b['redraw']());
      },
    }),
    _0x5a3e86 = createCollaborationComments({ store: _0x22ffd1, getSession: _0x514b73['getSession'] });
  function _0x26c8aa(_0xa6bdf2, _0x349e46) {
    if (!_0x22ffd1['getStateRaw']()['nodes'][_0xa6bdf2]) return;
    (_0x514b73['getSession']()?.['follow'](''), _0xd20415?.(_0xa6bdf2, 0x60, 0x1f4));
    if (_0x349e46) _0x5a3e86['open'](_0xa6bdf2);
  }
  const _0x271fb5 = createCollaborationCommentNotifications({
      getSession: _0x514b73['getSession'],
      hasNode: (_0x1cfab2) => !!_0x22ffd1['getStateRaw']()['nodes'][_0x1cfab2],
      getNode: (_0x5cb2aa) => _0x22ffd1['getStateRaw']()['nodes'][_0x5cb2aa],
      openNode: _0x26c8aa,
    }),
    _0x12266d = createCollaborationChat({
      store: _0x22ffd1,
      getSession: _0x514b73['getSession'],
      openNode: (_0x456f4f) => _0x26c8aa(_0x456f4f, ![]),
    }),
    _0x4c6ec2 = bindCollaborationChatInput({
      chat: _0x12266d,
      store: _0x22ffd1,
      resolveShortcutActionForEvent: resolveShortcutActionForEvent,
      isRecording: isRecording,
      windowObject: windowObject,
    }),
    _0x4f3a4b = createCollaborationPresence({
      store: _0x22ffd1,
      getSession: _0x514b73['getSession'],
      drawComments: (_0x141432) =>
        drawCollaborationCommentMarkers({ ..._0x141432, comments: _0x5a3e86, chat: _0x12266d }),
    }),
    _0x54a267 = bindCollaborationEditors({ store: _0x22ffd1, windowObject: windowObject });
  function _0x437852() {
    if (_0x36b1d2) return;
    const _0x4a969e = _0x514b73['getState']()['session'];
    (_0x44f1dc['update'](_0x4a969e),
      (_0x27f393['textContent'] = _0x4a969e
        ? '协作中\x20·\x20' + (_0x4a969e['hosting'] ? '房主' : '成员')
        : isSubscriptionActive(_0x22ffd1['getStateRaw']()['subscription'] || {})
          ? '开启协作'
          : '协作 · 需激活'),
      _0x1eb950['classList']['toggle']('is-active', !!_0x4a969e));
    const _0x28ede4 = _0x4a969e?.['status'] === 'connecting';
    (_0x1eb950['setAttribute']('aria-busy', String(!!_0x28ede4)),
      (_0x2052d3['textContent'] = _0x4a969e
        ? _0x4a969e['status'] === 'online'
          ? ''
          : _0x4a969e['status'] === 'offline'
            ? '连接中断'
            : _0x4a969e['status'] === 'blocked'
              ? '协作已暂停'
              : '连接中'
        : ''),
      (_0x2052d3['title'] = _0x4a969e?.['status'] === 'online' ? '' : _0x4a969e?.['message'] || ''),
      (_0x2052d3['hidden'] = !_0x4a969e || _0x4a969e['status'] === 'online'),
      _0x273016(_0x4a969e),
      _0x2be5ce['render'](),
      _0x4f3a4b['redraw'](),
      _0x5a3e86['update'](),
      _0x12266d['update']());
  }
  const _0x2be5ce = createCollaborationPanel({
    actions: {
      ..._0x514b73['actions'],
      activate: () => windowObject['openSubscriptionDialog']?.(),
      copy: (_0x13d5e7) => navigator['clipboard']['writeText'](_0x13d5e7),
      refreshReview: () => _0x514b73['getSession']()?.['review']['refresh'](undefined, !![]),
      hasReviewNode: (_0x5a0714) => !!_0x22ffd1['getStateRaw']()['nodes'][_0x5a0714],
      openReviewNode: _0x26c8aa,
    },
    getState: _0x514b73['getState'],
    anchor: _0x1eb950,
    keepOpenOnOutside: (_0x4794de) => !!_0x4794de['closest']?.('#fabBtn,\x20.agent-sidebar'),
  });
  function _0x1a200b() {
    (_0x2be5ce['show'](), void _0x514b73['ensureAuthenticated']()['catch'](() => {}));
  }
  (_0x1eb950['addEventListener']('click', () => {
    (_0x2be5ce['toggle'](), void _0x514b73['ensureAuthenticated']()['catch'](() => {}));
  }),
    _0x51c14f['addEventListener']('click', _0x1a200b));
  const _0x380a77 = document['createElement']('button');
  ((_0x380a77['type'] = 'button'),
    (_0x380a77['className'] = 'cpd-new-btn'),
    (_0x380a77['textContent'] = '协作画布'),
    _0x380a77['addEventListener']('click', _0x1a200b),
    document['querySelector']('.cpd-footer')?.['append'](_0x380a77));
  const _0x2bcacd = _0x22ffd1['subscribeSelector']((_0x19f861) => _0x19f861['subscription'], _0x437852);
  windowObject['addEventListener']('aicanvas:active-canvas-changed', _0x514b73['refreshCanvas']);
  const _0xc72572 = (_0x4cda08) => {
    const _0xe4b8e3 = _0x514b73['getSession']();
    _0xe4b8e3 &&
      !_0xe4b8e3['canDetach']() &&
      (_0x4cda08['preventDefault'](), (_0x4cda08['returnValue'] = ''));
  };
  return (
    windowObject['addEventListener']('beforeunload', _0xc72572),
    _0x437852(),
    {
      show: _0x1a200b,
      getSession: _0x514b73['getSession'],
      destroy() {
        ((_0x36b1d2 = !![]), _0x54a267(), _0x4c6ec2(), _0x12266d['destroy']());
        const _0x493a77 = _0x514b73['destroy']();
        return (
          _0x2bcacd(),
          _0x2be5ce['destroy'](),
          _0x4f3a4b['destroy'](),
          _0x5a3e86['destroy'](),
          _0x2ff83d['remove'](),
          _0x380a77['remove'](),
          windowObject['removeEventListener']('beforeunload', _0xc72572),
          windowObject['removeEventListener']('aicanvas:active-canvas-changed', _0x514b73['refreshCanvas']),
          _0x493a77
        );
      },
    }
  );
}
