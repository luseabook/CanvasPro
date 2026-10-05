import { beginModalInteraction } from '../../services/modalInteractionScope.js';
import { createCollaborationLobby } from './collaborationLobby.js';
import { createCollaborationMembers } from './collaborationMembers.js';
import { createCollaborationInvitation } from './collaborationInvitation.js';
import { createCollaborationActivity } from './collaborationActivity.js';
import { createContextMenuIcon } from '../../components/contextMenuIcon.js';
import { ADVANCED_SETTINGS_TUNE_ICON_MARKUP } from '../../components/sharedIconMarkup.js';
const ROLE_NAMES = { owner: '房主', admin: '管理员', editor: '可编辑', viewer: '只读' },
  QUIET_SYNC_MESSAGES = new Set(['已同步', '正在同步修改', '房主已接收修改 · 项目文件由房主保存']);
function element(value, item = '', key = '') {
  const el = document['createElement'](value);
  ((el['className'] = item), (el['textContent'] = key));
  if (value === 'summary') el['tabIndex'] = 0;
  return el;
}
export function createCollaborationPanel({
  actions: actions,
  getState: getState,
  anchor: anchor = null,
  keepOpenOnOutside: keepOpenOnOutside = () => ![],
}) {
  const root = element('dialog', 'collaboration-dialog');
  root['setAttribute']('aria-labelledby', 'collaboration-title');
  const head = element('div', 'collaboration-heading'),
    element2 = element('h2', '', '画布协作');
  element2['id'] = 'collaboration-title';
  const el2 = element('button', 'collaboration-button collaboration-quiet collaboration-close');
  ((el2['type'] = 'button'),
    el2['setAttribute']('aria-label', '关闭'),
    el2['append'](createContextMenuIcon('cancel')),
    head['append'](element2, el2));
  const el3 = element('p', 'collaboration-feedback');
  (el3['setAttribute']('role', 'status'),
    el3['setAttribute']('aria-live', 'polite'),
    head['insertBefore'](el3, el2));
  const element3 = element('div', 'collaboration-body'),
    enabled = {};
  let run = () => {},
    enabled2 = ![];
  function run2() {
    !enabled2 &&
      ((enabled2 = !![]),
      (run = beginModalInteraction({
        root: root,
        onClose: onClose,
        returnFocus: anchor || undefined,
      })));
  }
  let enabled3 = ![],
    enabled4 = ![],
    index = '',
    result = '',
    data = '';
  function run3(options) {
    const element4 = element('section', 'collaboration-section');
    return (element3['append'](element4), (enabled[options] = element4), element4);
  }
  function button(target, handler, source, next) {
    const el4 = element('button', 'collaboration-button', target);
    return (
      (el4['type'] = 'button'),
      el4['addEventListener']('click', () => {
        if (next !== ![]) return run4(el4, handler, next);
        try {
          handler();
        } catch (error) {
          ((enabled4 = !![]), (el3['hidden'] = ![]), (el3['textContent'] = error['message']));
        }
      }),
      source['append'](el4),
      el4
    );
  }
  function input(current, entry, { type: type = 'text', placeholder: placeholder = '' } = {}) {
    const element5 = element('label', 'collaboration-field', current),
      element6 = element('input', 'collaboration-input');
    return (
      (element6['type'] = type),
      (element6['placeholder'] = placeholder),
      (element6['autocomplete'] = 'off'),
      element5['append'](element6),
      entry['append'](element5),
      element6
    );
  }
  async function run4(el5, handler2, record = '正在处理…') {
    if (enabled3) return ![];
    ((enabled3 = !![]),
      (enabled4 = ![]),
      (el5['disabled'] = !![]),
      el5['setAttribute']('aria-busy', 'true'),
      collaborationInvitation['setBusy'](!![]),
      (el3['hidden'] = ![]),
      el3['classList']['add']('is-pending'),
      (el3['textContent'] = record));
    try {
      await handler2();
      if (el3['textContent'] === record)
        el3['textContent'] = getState()['session']?.['message'] || '操作完成';
    } catch (error2) {
      ((enabled4 = !![]),
        (el3['textContent'] =
          error2['name'] === 'AbortError' ? '操作已取消' : error2['message'] || '操作失败，请重试'));
    } finally {
      ((enabled3 = ![]),
        (el5['disabled'] = ![]),
        collaborationInvitation['setBusy'](![]),
        el5['removeAttribute']('aria-busy'),
        el3['classList']['remove']('is-pending'),
        render());
    }
    return !![];
  }
  const payload = run3('auth');
  payload['append'](element('p', '', '自动使用当前设备已激活的画布授权，无需再次填写激活码。'));
  const el6 = button('重新验证', () => actions['authenticate'](), payload),
    el7 = button(
      '激活画布',
      () => {
        (run5(), actions['activate']());
      },
      payload,
    ),
    root2 = run3('lobby'),
    collaborationLobby = createCollaborationLobby({
      root: root2,
      head: head,
      actions: actions,
      element: element,
      button: button,
      input: input,
      run: run4,
      isBusy: () => enabled3,
    }),
    root3 = run3('active');
  collaborationLobby['mountSession'](root3);
  const element7 = element('div', 'collaboration-room-header');
  (root3['append'](element7), element7['append'](createContextMenuIcon('source', { size: 28 })));
  const element8 = element('div', 'collaboration-room-info');
  element7['append'](element8);
  const el8 = element('h3'),
    el9 = element('span', 'collaboration-room-role-badge'),
    el10 = element('p', 'collaboration-subtle collaboration-room-status');
  element8['append'](el8, el9, el10);
  const el11 = element('div', 'collaboration-session-footer');
  el11['append'](element('span', 'collaboration-subtle', '项目由房主保存'));
  const element9 = element('div', 'collaboration-disconnect-slot');
  el11['append'](element9);
  const el12 = element('button', 'collaboration-button', '结束本次联机');
  el12['type'] = 'button';
  const el13 = element('div', 'collaboration-disconnect-confirm');
  ((el13['hidden'] = !![]),
    el13['setAttribute']('role', 'group'),
    el13['setAttribute']('aria-label', '确定结束本次联机'),
    element9['append'](el12, el13));
  let enabled5 = '',
    signal = null;
  function run6(enabled6 = ![]) {
    ((enabled5 = ''),
      (el12['hidden'] = ![]),
      (el13['hidden'] = !![]),
      el11['classList']['remove']('is-confirming'));
    if (enabled6 && root['open'] && getState()['session']) el12['focus']();
  }
  async function run7(enabled7 = ![]) {
    if (!enabled5 || getState()['session']?.['roomId'] !== enabled5) {
      run6();
      return;
    }
    signal = new AbortController();
    try {
      if (enabled7)
        (run({ restoreFocus: ![] }),
          (enabled2 = ![]),
          await actions['saveAndDisconnect']({ signal: signal['signal'] }));
      else await actions['disconnect']({ signal: signal['signal'], preserveDraft: !![] });
    } finally {
      ((signal = null), run6(!![]));
    }
  }
  const el14 = button('确定', () => run7(), el13, '正在结束联机…');
  el14['classList']['add']('collaboration-danger');
  const el15 = button('保存并确定', () => run7(!![]), el13, '正在保存项目并结束联机…');
  el15['classList']['add']('collaboration-primary');
  const el16 = element('button', 'collaboration-button', '取消');
  ((el16['type'] = 'button'),
    el16['addEventListener']('click', () => {
      if (signal) signal['abort']();
      else {
        if (!enabled3) run6(!![]);
      }
    }),
    el13['prepend'](el16),
    el12['addEventListener']('click', () => {
      if (enabled3 || !getState()['session']) return;
      ((enabled5 = getState()['session']['roomId']),
        (el12['hidden'] = !![]),
        (el13['hidden'] = ![]),
        el16['focus'](),
        el11['classList']['add']('is-confirming'));
    }),
    el13['addEventListener']('keydown', (event) => {
      if (event['key'] === 'Escape') {
        (event['preventDefault'](), event['stopPropagation']());
        if (signal) signal['abort']();
        else {
          if (!enabled3) run6(!![]);
        }
      }
    }));
  const root4 = element('div', 'collaboration-invite-section');
  root3['append'](root4);
  const collaborationInvitation = createCollaborationInvitation({
      root: root4,
      element: element,
      button: button,
      input: input,
      actions: actions,
      getState: getState,
      feedback: (handle) => {
        el3['textContent'] = handle;
      },
    }),
    element10 = element('div', 'collaboration-member-heading');
  root3['append'](element10);
  const el17 = element('h4');
  element10['append'](el17);
  const root5 = element('div', 'collaboration-list collaboration-members');
  (root5['setAttribute']('aria-label', '协作成员'), root3['append'](root5));
  const el18 = button('召集成员到我的视角', () => actions['summon'](), root3);
  (el18['classList']['add']('collaboration-text-action', 'collaboration-summon'),
    el18['prepend'](createContextMenuIcon('select-all')));
  const collaborationMembers = createCollaborationMembers({
      root: root5,
      element: element,
      button: button,
      run: run4,
      actions: actions,
      confirmAction: confirmAction,
      getState: getState,
    }),
    element11 = element('details', 'collaboration-management'),
    element12 = element('summary', '', '房间设置'),
    el19 = element('span');
  ((el19['innerHTML'] = ADVANCED_SETTINGS_TUNE_ICON_MARKUP),
    element12['prepend'](el19),
    element11['append'](element12));
  const element13 = element('div', 'collaboration-actions');
  element11['append'](element13);
  const el20 = button(
      '使所有邀请信息失效',
      async () => {
        (await actions['revokeInvites'](), collaborationInvitation['invalidate']());
      },
      element13,
    ),
    el21 = button(
      '关闭协作',
      () =>
        confirmAction('关闭后所有成员将无法访问此房间，本机内容保留。确认关闭？', () =>
          actions['closeRoom'](),
        ),
      element13,
    ),
    el22 = button(
      '退出成员列表',
      () => confirmAction('退出后需要使用有效邀请重新加入，确认退出？', () => actions['leaveRoom']()),
      element13,
    ),
    element14 = element('div', 'collaboration-task-list');
  root3['append'](element14);
  const collaborationActivity = createCollaborationActivity({
      root: root3,
      getState: getState,
      actions: actions,
    }),
    el23 = element('div', 'collaboration-section');
  root3['append'](el23);
  const el24 = element('p');
  (el23['append'](el24),
    button(
      '使用房主版本',
      () =>
        confirmAction('放弃这些冲突节点的本机修改，使用房主版本？', () => actions['resolveConflicts'](![])),
      el23,
    ),
    button(
      '提交本机版本',
      () =>
        confirmAction('用本机内容重新提交这些冲突节点？房主会再次检查权限和节点占用。', () =>
          actions['resolveConflicts'](!![]),
        ),
      el23,
    ));
  const el25 = element('p', 'collaboration-subtle');
  (root3['append'](el25), collaborationLobby['mountSessionControls'](element11, el11));
  const el26 = run3('confirmation');
  el26['hidden'] = !![];
  const el27 = element('p');
  el26['append'](el27);
  let value2 = null,
    state = '';
  (button(
    '确认',
    async () => {
      const config = value2;
      ((value2 = null), (el26['hidden'] = !![]));
      if (getState()['session']?.['roomId'] === state) await config?.();
    },
    el26,
  ),
    button(
      '取消',
      () => {
        ((value2 = null), (el26['hidden'] = !![]));
      },
      el26,
    ));
  function confirmAction(scope, output) {
    ((state = getState()['session']?.['roomId']),
      (el27['textContent'] = scope),
      (value2 = output),
      (el26['hidden'] = ![]),
      el26['querySelector']('button')['focus']());
  }
  (root['append'](head, element3), document['body']['append'](root));
  let requestAnimationFrame2 = 0,
    value3 = '';
  function run5(restoreFocus = !![]) {
    (cancelAnimationFrame(requestAnimationFrame2),
      collaborationInvitation['close'](),
      collaborationMembers['close'](),
      collaborationLobby['resetHostChoice'](),
      run6(),
      (value2 = null),
      (el26['hidden'] = !![]),
      run({ restoreFocus: restoreFocus }),
      (enabled2 = ![]),
      root['close'](),
      anchor?.['setAttribute']('aria-expanded', 'false'));
  }
  function onClose() {
    run5();
  }
  (el2['addEventListener']('click', onClose),
    root['addEventListener']('cancel', (event2) => {
      (event2['preventDefault'](), onClose());
    }));
  const value4 = (event3) => {
    if (!root['open']) return;
    if (root['contains'](event3['target'])) {
      run2();
      return;
    }
    if (anchor?.['contains'](event3['target'])) return;
    if (keepOpenOnOutside(event3['target']))
      (collaborationInvitation['close'](),
        collaborationMembers['close'](),
        run({ restoreFocus: ![] }),
        (enabled2 = ![]));
    else run5(![]);
  };
  document['addEventListener']('pointerdown', value4, !![]);
  function run8() {
    const box = anchor?.['getBoundingClientRect'](),
      value5 = Math['min'](box?.['bottom'] || 48, window['innerHeight'] / 3) + 10,
      value6 = Math['max'](
        12,
        Math['min'](
          window['innerWidth'] - (box?.['right'] || window['innerWidth'] - 16),
          window['innerWidth'] - root['offsetWidth'] - 12,
        ),
      ),
      value7 = value5 + ':' + value6;
    value7 !== value3 &&
      ((value3 = value7),
      root['style']['setProperty']('--collaboration-top', value5 + 'px'),
      root['style']['setProperty']('--collaboration-right', value6 + 'px'));
    if (root['open']) requestAnimationFrame2 = requestAnimationFrame(run8);
  }
  function render() {
    const enabled8 = getState();
    el15['hidden'] = !enabled8['session']?.['hosting'];
    const value8 = enabled8['session']?.['roomId'] || '';
    value8 !== index && ((index = value8), (enabled4 = ![]));
    if (enabled5 && enabled8['session']?.['roomId'] !== enabled5) run6();
    state && enabled8['session']?.['roomId'] !== state && ((value2 = null), (el26['hidden'] = !![]));
    ((enabled['auth']['hidden'] = !!enabled8['authenticated'] && !enabled8['authenticating']),
      (enabled['lobby']['hidden'] =
        (!enabled8['authenticated'] || !!enabled8['authenticating']) && !enabled8['session']),
      (enabled['active']['hidden'] = !enabled8['session']),
      collaborationLobby['render'](enabled8),
      collaborationInvitation['render'](enabled8),
      collaborationActivity['render']());
    const value9 = collaborationMembers['render'](enabled8);
    (root['classList']['toggle']('is-lobby', !enabled['lobby']['hidden']),
      root['classList']['toggle']('is-session', !!enabled8['session']),
      (el6['hidden'] = !!enabled8['authenticating']),
      (el7['hidden'] = enabled8['authError']?.['code'] !== 'ACTIVATION_REQUIRED'));
    const value10 = enabled8['session']?.['status'] === 'connecting';
    root['setAttribute']('aria-busy', String(enabled3 || !!enabled8['authenticating'] || value10));
    if (!enabled3) {
      el3['classList']['toggle']('is-pending', !!enabled8['authenticating'] || value10);
      if (enabled8['authenticating']) el3['textContent'] = '正在验证当前设备的画布授权…';
      else {
        if (enabled8['authError']) el3['textContent'] = enabled8['authError']['message'];
        else {
          if (el3['textContent'] === '正在验证当前设备的画布授权…') el3['textContent'] = '';
        }
      }
    }
    const value11 = enabled8['session']?.['message'] || '';
    if (!enabled3 && !enabled4 && value11 && value11 !== result) el3['textContent'] = value11;
    ((result = value11),
      (el3['hidden'] =
        !enabled3 && !enabled8['authenticating'] && QUIET_SYNC_MESSAGES['has'](el3['textContent'])));
    !enabled8['session'] && ((el26['hidden'] = !![]), (value2 = null));
    if (enabled8['session']) {
      ((el8['textContent'] = enabled8['session']['name']),
        (el9['textContent'] = ROLE_NAMES[enabled8['session']['role']]),
        (el10['textContent'] =
          (enabled8['session']['hosting'] ? '本机开房' : '已加入房间') + ' · ' + value9 + ' 人在线'),
        (el10['dataset']['status'] = enabled8['session']['status'] || 'connecting'),
        (el17['textContent'] = '成员 · ' + (enabled8['session']['members']?.['length'] || 0)),
        (el18['hidden'] = enabled8['session']['role'] !== 'owner'),
        (el23['hidden'] = !enabled8['session']['conflicts']?.['length']),
        (el24['textContent'] =
          '以下节点或连线存在冲突，其他内容可继续协作：' +
          (enabled8['session']['conflicts'] || [])['map']((value12) => value12['id'])['join']('、')),
        (el25['textContent'] = enabled8['session']['recoveryError'] || ''),
        (el25['hidden'] = !enabled8['session']['recoveryError']));
      const enabled9 = ['owner', 'admin']['includes'](enabled8['session']['role']);
      ((el20['hidden'] = !enabled9),
        (el21['hidden'] = enabled8['session']['role'] !== 'owner'),
        (el22['hidden'] = enabled8['session']['role'] === 'owner'));
      const value13 = JSON['stringify']([enabled8['session']['jobs'], enabled8['session']['role']]);
      if (value13 !== data) {
        ((data = value13), element14['replaceChildren']());
        for (const value14 of (enabled8['session']['jobs'] || [])['filter'](
          (response) => response['status'] === 'running',
        )) {
          element14['append'](
            element(
              'p',
              '',
              '节点 ' +
                value14['node'] +
                ' 正在由' +
                (enabled8['session']['members']['find']((value15) => value15['id'] === value14['actor'])?.[
                  'name'
                ] || '成员') +
                '生成',
            ),
          );
          if (value14['actor'] === enabled8['actorId'] || enabled8['session']['role'] === 'owner')
            button(
              '处理离线任务',
              () =>
                confirmAction(
                  '请先确认模型服务中的任务已停止或结束。此操作只解除协作占用，不会取消模型服务中的任务，确认已结束？',
                  () => actions['resolveTask'](value14),
                ),
              element14,
            );
        }
      }
    }
  }
  return {
    show() {
      if (!root['open']) el3['textContent'] = getState()['session']?.['message'] || '';
      render();
      if (root['open']) return;
      (root['show'](), run8(), anchor?.['setAttribute']('aria-expanded', 'true'), run2());
    },
    toggle() {
      if (root['open']) onClose();
      else this['show']();
    },
    render: render,
    renderPresence() {
      if (!root['open']) return;
      const value16 = getState(),
        value17 = collaborationMembers['render'](value16);
      if (value16['session']) {
        const value18 =
          (value16['session']['hosting'] ? '本机开房' : '已加入房间') + ' · ' + value17 + ' 人在线';
        if (el10['textContent'] !== value18) el10['textContent'] = value18;
      }
    },
    feedback(value19) {
      !enabled3 && !enabled4 && ((el3['hidden'] = ![]), (el3['textContent'] = value19));
    },
    destroy() {
      (cancelAnimationFrame(requestAnimationFrame2),
        collaborationInvitation['close'](),
        collaborationMembers['destroy'](),
        run(),
        document['removeEventListener']('pointerdown', value4, !![]),
        root['remove']());
    },
  };
}
