import { createCollaborationSelect } from './collaborationSelect.js';
export function createCollaborationInvitation({
  root: _0x358944,
  element: _0x349657,
  button: _0x233990,
  input: _0x5ae231,
  actions: _0x4bf424,
  getState: _0x4c8f05,
  feedback: _0x186948,
}) {
  const _0x337351 = _0x349657('div', 'collaboration-invite-heading');
  _0x337351['append'](_0x349657('h4', '', '邀请成员'));
  const _0x9a8f0b = _0x349657('div', 'collaboration-invite-settings');
  (_0x337351['append'](_0x9a8f0b), _0x358944['append'](_0x337351));
  let _0x7063fe = 'editor';
  const _0x410bc7 = _0x349657('button', 'collaboration-button collaboration-invite-role', '可编辑');
  ((_0x410bc7['type'] = 'button'),
    _0x410bc7['setAttribute']('aria-label', '邀请权限'),
    _0x410bc7['setAttribute']('aria-pressed', 'true'),
    _0x9a8f0b['append'](_0x410bc7),
    _0x410bc7['addEventListener']('click', () => {
      ((_0x7063fe = _0x7063fe === 'editor' ? 'viewer' : 'editor'),
        (_0x410bc7['textContent'] = _0x7063fe === 'editor' ? '可编辑' : '只读'),
        _0x410bc7['setAttribute']('aria-pressed', String(_0x7063fe === 'editor')),
        _0xe049eb());
    }));
  const _0x525162 = _0x349657('select', 'collaboration-input');
  for (const [_0x30cbe7, _0x30d469] of [
    ['permanent', '永久'],
    ['1d', '1 天'],
    ['3d', '3 天'],
    ['7d', '7 天'],
  ]) {
    const _0x3d2b7d = _0x349657('option', '', _0x30d469);
    ((_0x3d2b7d['value'] = _0x30cbe7), _0x525162['append'](_0x3d2b7d));
  }
  _0x9a8f0b['append'](_0x525162);
  const _0x208077 = createCollaborationSelect(_0x525162, '邀请有效期'),
    _0x2e2f92 = _0x349657('div', 'collaboration-invitation-row');
  _0x358944['append'](_0x2e2f92);
  const _0x16e2b3 = _0x5ae231('邀请信息', _0x2e2f92, { placeholder: '获取后可反复分享' });
  ((_0x16e2b3['readOnly'] = !![]),
    _0x358944['append'](
      _0x349657(
        'p',
        'collaboration-subtle',
        '默认永久有效。结束联机或关机不会作废邀请，房主重开原画布后可继续使用。',
      ),
    ));
  let _0x4b8918 = '',
    _0x1a268d = '',
    _0x379365 = 0x0;
  function _0xe049eb() {
    (_0x379365++, (_0x16e2b3['value'] = ''), (_0x5e7711['textContent'] = '获取邀请'));
  }
  async function _0x47f57e() {
    const _0xd79208 = _0x4c8f05()['session']?.['roomId'],
      _0x4487d5 = _0x379365,
      _0x388705 = await _0x4bf424['invite'](_0x7063fe, _0x9d5ec0['value'], _0x525162['value']);
    if (_0x4487d5 !== _0x379365 || _0xd79208 !== _0x4c8f05()['session']?.['roomId'])
      throw new Error('邀请设置已变化，请重新获取邀请');
    ((_0x16e2b3['value'] = _0x388705), (_0x5e7711['textContent'] = '复制邀请'));
  }
  const _0x5e7711 = _0x233990(
    '获取邀请',
    async () => {
      if (!_0x16e2b3['value']) {
        (await _0x47f57e(), _0x186948('邀请已就绪，相同权限和有效期会复用未失效的邀请'));
        return;
      }
      (await _0x4bf424['copy'](_0x16e2b3['value']), _0x186948('邀请信息已复制'));
    },
    _0x2e2f92,
  );
  _0x5e7711['classList']['add']('collaboration-primary');
  const _0x1b6c22 = _0x349657('details', 'collaboration-network');
  (_0x1b6c22['append'](_0x349657('summary', '', '局域网连接')), _0x358944['append'](_0x1b6c22));
  const _0x2be1e9 = _0x349657('label', 'collaboration-field', '房主网络地址'),
    _0x9d5ec0 = _0x349657('select', 'collaboration-input');
  (_0x2be1e9['append'](_0x9d5ec0), _0x1b6c22['append'](_0x2be1e9));
  const _0x49481d = createCollaborationSelect(_0x9d5ec0, '房主网络地址');
  return (
    _0x1b6c22['append'](
      _0x349657(
        'p',
        'collaboration-subtle',
        '长期协作请使用固定局域网 IP 或稳定 VPN 地址；房主网络地址改变后需重新分享邀请。',
      ),
    ),
    _0x525162['addEventListener']('change', _0xe049eb),
    _0x9d5ec0['addEventListener']('change', _0xe049eb),
    {
      setBusy(_0x387966) {
        _0x5e7711['disabled'] = _0x387966;
      },
      invalidate: _0xe049eb,
      close() {
        (_0x208077['close'](), _0x49481d['close']());
      },
      render(_0x33986a) {
        const _0x49fc48 = _0x33986a['session'];
        _0x358944['hidden'] = !_0x49fc48 || !['owner', 'admin']['includes'](_0x49fc48['role']);
        const _0x592183 = _0x49fc48 ? _0x49fc48['roomId'] + ':' + _0x49fc48['role'] : '';
        _0x4b8918 !== _0x592183 && ((_0x4b8918 = _0x592183), _0xe049eb(), (_0x1b6c22['open'] = ![]));
        const _0x1cf281 = _0x49fc48?.['hostAddresses'] || [],
          _0xfaddd1 = JSON['stringify'](_0x1cf281);
        if (_0xfaddd1 !== _0x1a268d) {
          _0x1a268d = _0xfaddd1;
          const _0xbfb4f9 = _0x9d5ec0['value'];
          _0x9d5ec0['replaceChildren']();
          for (const _0x3d6f17 of _0x1cf281) {
            const _0x8adc9d = _0x349657('option', '', _0x3d6f17);
            ((_0x8adc9d['value'] = _0x3d6f17), _0x9d5ec0['append'](_0x8adc9d));
          }
          if (!_0x1cf281['length']) {
            const _0x4c7174 = _0x349657('option', '', '未发现局域网地址，仅限本机测试');
            ((_0x4c7174['value'] = ''), _0x9d5ec0['append'](_0x4c7174));
          }
          if (_0x1cf281['includes'](_0xbfb4f9)) _0x9d5ec0['value'] = _0xbfb4f9;
          if (_0x9d5ec0['value'] !== _0xbfb4f9) _0xe049eb();
        }
        ((_0x2be1e9['hidden'] = !_0x49fc48?.['hosting']),
          (_0x1b6c22['hidden'] = !_0x49fc48?.['hosting']),
          _0x208077['sync'](),
          _0x49481d['sync']());
      },
    }
  );
}
