import { createContextMenuIcon } from '../../components/contextMenuIcon.js';
export function createCollaborationLobby({
  root: root,
  head: head,
  actions: actions,
  element: element,
  button: button,
  input: input,
  run: run,
  isBusy: isBusy,
}) {
  let value = 'host',
    item = ![],
    enabled = '';
  const el = element('div', 'collaboration-profile'),
    el2 = input('协作昵称', el);
  ((el2['maxLength'] = 32),
    el2['addEventListener']('change', () => actions['setDisplayName'](el2['value'])));
  const el3 = element('button', 'collaboration-button collaboration-quiet');
  ((el3['type'] = 'button'),
    el3['setAttribute']('aria-label', '修改协作昵称'),
    el3['append'](createContextMenuIcon('edit')),
    el3['addEventListener']('click', () => {
      (el2['focus'](), el2['select']());
    }),
    el['append'](el3),
    head['insertBefore'](el, head['lastChild']));
  const el4 = element('div', 'collaboration-tabs');
  (el4['setAttribute']('role', 'tablist'), el4['setAttribute']('aria-label', '协作方式'));
  const list = {},
    key = {};
  root['append'](el4);
  for (const [index, result] of [
    ['host', '开房'],
    ['join', '加入'],
  ]) {
    const el5 = element('button', 'collaboration-button collaboration-tab', result);
    ((el5['type'] = 'button'),
      (el5['id'] = 'collaboration-' + index + '-tab'),
      el5['setAttribute']('role', 'tab'),
      el5['setAttribute']('aria-controls', 'collaboration-' + index + '-view'),
      el5['addEventListener']('click', () => run2(index)),
      el5['addEventListener']('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End']['includes'](event['key'])) return;
        (event['preventDefault'](),
          run2(
            event['key'] === 'Home'
              ? 'host'
              : event['key'] === 'End'
                ? 'join'
                : value === 'host'
                  ? 'join'
                  : 'host',
          ),
          key[value]['focus']());
      }));
    const el6 = element('div', 'collaboration-lobby-view');
    ((el6['id'] = 'collaboration-' + index + '-view'),
      el6['setAttribute']('role', 'tabpanel'),
      el6['setAttribute']('aria-labelledby', el5['id']),
      (key[index] = el5),
      (list[index] = el6),
      el4['append'](el5),
      root['append'](el6));
  }
  function run2(data) {
    if (enabled && data !== enabled) return;
    if (data !== value) resetHostChoice();
    ((value = data), (el4['dataset']['mode'] = value));
    for (const options of Object['keys'](list)) {
      ((list[options]['hidden'] = !!enabled || options !== value),
        (key[options]['disabled'] = !!enabled && options !== enabled),
        key[options]['setAttribute']('aria-selected', String(options === value)),
        (key[options]['tabIndex'] = options === value ? 0 : -1));
    }
  }
  const el7 = element('div', 'collaboration-current');
  el7['append'](createContextMenuIcon('source', { size: 28 }));
  const target = element('div', 'collaboration-current-text'),
    el8 = element('span', 'collaboration-node-count collaboration-subtle');
  (target['append'](element('strong', '', '当前画布'), el8), el7['append'](target));
  let enabled2 = '',
    enabled3 = ![];
  const source = element('div', 'collaboration-host-actions');
  el7['append'](source);
  const el9 = element('button', 'collaboration-button collaboration-primary', '立即开房');
  ((el9['type'] = 'button'),
    source['append'](el9),
    el9['addEventListener']('click', () => {
      if (!enabled2) return run(el9, () => actions['create']());
      ((enabled3 = !![]),
        (el9['hidden'] = !![]),
        (el10['hidden'] = ![]),
        el7['classList']['add']('is-choosing'),
        el11['focus']());
    }));
  const el10 = element('div', 'collaboration-host-choice');
  ((el10['hidden'] = !![]),
    el10['setAttribute']('role', 'group'),
    el10['setAttribute']('aria-label', '恢复上次协作或新建协作'),
    source['append'](el10));
  const el11 = button('恢复上次', () => actions['resume'](), el10);
  (el11['classList']['add']('collaboration-primary'),
    button('新建协作', () => actions['create']({ fresh: !![] }), el10));
  function resetHostChoice() {
    ((enabled3 = ![]),
      (el9['hidden'] = ![]),
      (el10['hidden'] = !![]),
      el7['classList']['remove']('is-choosing'));
  }
  (el10['addEventListener']('keydown', (event2) => {
    if (event2['key'] !== 'Escape' || el10['querySelector']('[aria-busy="true"]')) return;
    (event2['preventDefault'](), event2['stopPropagation'](), resetHostChoice(), el9['focus']());
  }),
    list['host']['append'](el7));
  const el12 = element('div', 'collaboration-section');
  ((el12['hidden'] = !![]), el12['setAttribute']('aria-label', '协作端口恢复'));
  const el13 = element('p', 'collaboration-subtle'),
    next = element('div', 'collaboration-actions'),
    el14 = button('重试原端口', () => actions['retryHostPort'](), next, '正在重试协作连接…'),
    el15 = button('更换端口并继续', () => actions['retryHostPort'](!![]), next, '正在更换协作端口…');
  (el12['append'](
    el13,
    element(
      'p',
      'collaboration-subtle',
      '更换后，本机所有房间的旧邀请地址将不可用。房间与画布保留，请生成并重新发送邀请信息。',
    ),
    next,
  ),
    list['host']['append'](el12),
    list['join']['append'](
      element('h3', '', '加入协作画布'),
      element('p', 'collaboration-subtle', '粘贴房主发来的邀请信息，即可加入。'),
    ));
  const el16 = input('邀请连接信息', list['join'], { placeholder: '粘贴房主生成的 AICLAN2.…' }),
    el17 = button('加入协作', () => actions['join'](el16['value']['trim']()), list['join']);
  (el17['classList']['add']('collaboration-primary'),
    (el17['disabled'] = !![]),
    el16['addEventListener']('input', () => {
      el17['disabled'] = isBusy() || !el16['value']['trim']();
    }),
    el16['addEventListener']('keydown', (event3) => {
      event3['key'] === 'Enter' && !event3['isComposing'] && (event3['preventDefault'](), el17['click']());
    }));
  const el18 = element('div', 'collaboration-lobby-footer'),
    el19 = element('div', 'collaboration-session-slot');
  root['append'](el19);
  const el20 = element('div', 'collaboration-session-controls');
  root['append'](el20);
  const current = element('span', 'collaboration-subtle', '已使用本机画布授权'),
    entry = element('details', 'collaboration-help'),
    record = element('summary', '', '连接说明');
  return (
    record['prepend'](createContextMenuIcon('details')),
    entry['append'](
      record,
      element(
        'p',
        'collaboration-subtle',
        '本机作为房主，成员通过局域网或 VPN 连接。加入先同步节点，素材按需从房主读取，视频分段播放；房主离线后协作暂停。成员新增素材只传给房主，生成费用由发起人自己的模型账号承担。',
      ),
      element(
        'p',
        'collaboration-subtle',
        '本机文件分片续传，单文件上限 2 GiB，房间素材总量上限 5 GiB；临时或远程素材上限 256 MiB。再次协作时打开原画布开房；项目文件只能由房主保存。',
      ),
    ),
    el18['append'](current, entry),
    root['append'](el18),
    run2('host'),
    {
      resetHostChoice: resetHostChoice,
      mountSession(payload) {
        el19['append'](payload);
      },
      mountSessionControls(...args) {
        el20['append'](...args);
      },
      render(enabled4) {
        ((el12['hidden'] = !enabled4['hostPortConflict'] || !!enabled4['session']),
          (el13['textContent'] = enabled4['hostPortConflict']?.['message'] || ''),
          (el14['disabled'] = el15['disabled'] = isBusy()),
          (el9['disabled'] = isBusy()),
          (el['hidden'] = root['hidden'] || !!enabled4['session']),
          (el4['hidden'] = !!enabled4['session']),
          (el18['hidden'] = !!enabled4['session']),
          (el20['hidden'] = !enabled4['session']),
          (el2['readOnly'] = !!enabled4['session']),
          (el3['hidden'] = !!enabled4['session']));
        if (document['activeElement'] !== el2) el2['value'] = enabled4['displayName'] || '成员';
        enabled = enabled4['session'] ? (enabled4['session']['role'] === 'owner' ? 'host' : 'join') : '';
        if (enabled) run2(enabled);
        else {
          if (item) run2('host');
        }
        ((el19['hidden'] = !enabled4['session']),
          (item = !!enabled4['session']),
          (el8['textContent'] = (enabled4['nodeCount'] || 0) + ' 个节点'));
        const handle =
          enabled4['resumeRoom'] && !enabled4['session']
            ? enabled4['resumeRoom']['canvasId'] +
              ':' +
              enabled4['resumeRoom']['roomId'] +
              ':' +
              enabled4['resumeRoom']['hosting']
            : '';
        if (enabled3 && handle !== enabled2) resetHostChoice();
        enabled2 = handle;
        if (!el17['hasAttribute']('aria-busy')) el17['disabled'] = !el16['value']['trim']();
      },
    }
  );
}
