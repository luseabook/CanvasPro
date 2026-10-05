import { createCollaborationSelect } from './collaborationSelect.js';
export function createCollaborationInvitation({
  root: root,
  element: element,
  button: button,
  input: input,
  actions: actions,
  getState: getState,
  feedback: feedback,
}) {
  const value = element('div', 'collaboration-invite-heading');
  value['append'](element('h4', '', '邀请成员'));
  const item = element('div', 'collaboration-invite-settings');
  (value['append'](item), root['append'](value));
  let key = 'editor';
  const el = element('button', 'collaboration-button collaboration-invite-role', '可编辑');
  ((el['type'] = 'button'),
    el['setAttribute']('aria-label', '邀请权限'),
    el['setAttribute']('aria-pressed', 'true'),
    item['append'](el),
    el['addEventListener']('click', () => {
      ((key = key === 'editor' ? 'viewer' : 'editor'),
        (el['textContent'] = key === 'editor' ? '可编辑' : '只读'),
        el['setAttribute']('aria-pressed', String(key === 'editor')),
        invalidate());
    }));
  const el2 = element('select', 'collaboration-input');
  for (const [index, result] of [
    ['permanent', '永久'],
    ['1d', '1 天'],
    ['3d', '3 天'],
    ['7d', '7 天'],
  ]) {
    const el3 = element('option', '', result);
    ((el3['value'] = index), el2['append'](el3));
  }
  item['append'](el2);
  const collaborationSelect = createCollaborationSelect(el2, '邀请有效期'),
    data = element('div', 'collaboration-invitation-row');
  root['append'](data);
  const el4 = input('邀请信息', data, { placeholder: '获取后可反复分享' });
  ((el4['readOnly'] = !![]),
    root['append'](
      element(
        'p',
        'collaboration-subtle',
        '默认永久有效。结束联机或关机不会作废邀请，房主重开原画布后可继续使用。',
      ),
    ));
  let options = '',
    target = '',
    source = 0;
  function invalidate() {
    (source++, (el4['value'] = ''), (el5['textContent'] = '获取邀请'));
  }
  async function run() {
    const next = getState()['session']?.['roomId'],
      current = source,
      entry = await actions['invite'](key, el6['value'], el2['value']);
    if (current !== source || next !== getState()['session']?.['roomId'])
      throw new Error('邀请设置已变化，请重新获取邀请');
    ((el4['value'] = entry), (el5['textContent'] = '复制邀请'));
  }
  const el5 = button(
    '获取邀请',
    async () => {
      if (!el4['value']) {
        (await run(), feedback('邀请已就绪，相同权限和有效期会复用未失效的邀请'));
        return;
      }
      (await actions['copy'](el4['value']), feedback('邀请信息已复制'));
    },
    data,
  );
  el5['classList']['add']('collaboration-primary');
  const el7 = element('details', 'collaboration-network');
  (el7['append'](element('summary', '', '局域网连接')), root['append'](el7));
  const el8 = element('label', 'collaboration-field', '房主网络地址'),
    el6 = element('select', 'collaboration-input');
  (el8['append'](el6), el7['append'](el8));
  const collaborationSelect2 = createCollaborationSelect(el6, '房主网络地址');
  return (
    el7['append'](
      element(
        'p',
        'collaboration-subtle',
        '长期协作请使用固定局域网 IP 或稳定 VPN 地址；房主网络地址改变后需重新分享邀请。',
      ),
    ),
    el2['addEventListener']('change', invalidate),
    el6['addEventListener']('change', invalidate),
    {
      setBusy(record) {
        el5['disabled'] = record;
      },
      invalidate: invalidate,
      close() {
        (collaborationSelect['close'](), collaborationSelect2['close']());
      },
      render(payload) {
        const enabled = payload['session'];
        root['hidden'] = !enabled || !['owner', 'admin']['includes'](enabled['role']);
        const handle = enabled ? enabled['roomId'] + ':' + enabled['role'] : '';
        options !== handle && ((options = handle), invalidate(), (el7['open'] = ![]));
        const list = enabled?.['hostAddresses'] || [],
          state = JSON['stringify'](list);
        if (state !== target) {
          target = state;
          const config = el6['value'];
          el6['replaceChildren']();
          for (const scope of list) {
            const el9 = element('option', '', scope);
            ((el9['value'] = scope), el6['append'](el9));
          }
          if (!list['length']) {
            const el10 = element('option', '', '未发现局域网地址，仅限本机测试');
            ((el10['value'] = ''), el6['append'](el10));
          }
          if (list['includes'](config)) el6['value'] = config;
          if (el6['value'] !== config) invalidate();
        }
        ((el8['hidden'] = !enabled?.['hosting']),
          (el7['hidden'] = !enabled?.['hosting']),
          collaborationSelect['sync'](),
          collaborationSelect2['sync']());
      },
    }
  );
}
