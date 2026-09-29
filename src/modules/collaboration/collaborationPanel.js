import { beginModalInteraction } from '../../services/modalInteractionScope.js';
import { createCollaborationLobby } from './collaborationLobby.js';
import { createCollaborationMembers } from './collaborationMembers.js';
import { createCollaborationInvitation } from './collaborationInvitation.js';
import { createCollaborationActivity } from './collaborationActivity.js';
import { createContextMenuIcon } from '../../components/contextMenuIcon.js';
import { ADVANCED_SETTINGS_TUNE_ICON_MARKUP } from '../../components/sharedIconMarkup.js';
const ROLE_NAMES = { owner: '房主', admin: '管理员', editor: '可编辑', viewer: '只读' },
  QUIET_SYNC_MESSAGES = new Set(['已同步', '正在同步修改', '房主已接收修改\x20·\x20项目文件由房主保存']);
function element(_0x3955d5, _0x82e11d = '', _0x4c0dd8 = '') {
  const _0x967ca1 = document['createElement'](_0x3955d5);
  ((_0x967ca1['className'] = _0x82e11d), (_0x967ca1['textContent'] = _0x4c0dd8));
  if (_0x3955d5 === 'summary') _0x967ca1['tabIndex'] = 0x0;
  return _0x967ca1;
}
export function createCollaborationPanel({
  actions: _0x1fb3ad,
  getState: _0xf2157,
  anchor: anchor = null,
  keepOpenOnOutside: keepOpenOnOutside = () => ![],
}) {
  const _0x303af2 = element('dialog', 'collaboration-dialog');
  _0x303af2['setAttribute']('aria-labelledby', 'collaboration-title');
  const _0x3a2f69 = element('div', 'collaboration-heading'),
    _0x511a86 = element('h2', '', '画布协作');
  _0x511a86['id'] = 'collaboration-title';
  const _0x104c24 = element('button', 'collaboration-button collaboration-quiet collaboration-close');
  ((_0x104c24['type'] = 'button'),
    _0x104c24['setAttribute']('aria-label', '关闭'),
    _0x104c24['append'](createContextMenuIcon('cancel')),
    _0x3a2f69['append'](_0x511a86, _0x104c24));
  const _0x562e28 = element('p', 'collaboration-feedback');
  (_0x562e28['setAttribute']('role', 'status'),
    _0x562e28['setAttribute']('aria-live', 'polite'),
    _0x3a2f69['insertBefore'](_0x562e28, _0x104c24));
  const _0x129fe4 = element('div', 'collaboration-body'),
    _0x55d432 = {};
  let _0x278e30 = () => {},
    _0x41ad0f = ![];
  function _0x2a4279() {
    !_0x41ad0f &&
      ((_0x41ad0f = !![]),
      (_0x278e30 = beginModalInteraction({
        root: _0x303af2,
        onClose: _0x1f9d81,
        returnFocus: anchor || undefined,
      })));
  }
  let _0x190019 = ![],
    _0xf15485 = ![],
    _0x1db7c6 = '',
    _0x2ba0a7 = '',
    _0x168316 = '';
  function _0x6a02d(_0x387ba6) {
    const _0x29c7ba = element('section', 'collaboration-section');
    return (_0x129fe4['append'](_0x29c7ba), (_0x55d432[_0x387ba6] = _0x29c7ba), _0x29c7ba);
  }
  function _0x213183(_0x58fb88, _0x1d7a0c, _0x13cd7d, _0x3a7789) {
    const _0x520bde = element('button', 'collaboration-button', _0x58fb88);
    return (
      (_0x520bde['type'] = 'button'),
      _0x520bde['addEventListener']('click', () => {
        if (_0x3a7789 !== ![]) return _0x36d149(_0x520bde, _0x1d7a0c, _0x3a7789);
        try {
          _0x1d7a0c();
        } catch (_0x32fca7) {
          ((_0xf15485 = !![]),
            (_0x562e28['hidden'] = ![]),
            (_0x562e28['textContent'] = _0x32fca7['message']));
        }
      }),
      _0x13cd7d['append'](_0x520bde),
      _0x520bde
    );
  }
  function _0x356eb7(_0x2291f2, _0x284fcb, { type: type = 'text', placeholder: placeholder = '' } = {}) {
    const _0x16e748 = element('label', 'collaboration-field', _0x2291f2),
      _0x1b4ea8 = element('input', 'collaboration-input');
    return (
      (_0x1b4ea8['type'] = type),
      (_0x1b4ea8['placeholder'] = placeholder),
      (_0x1b4ea8['autocomplete'] = 'off'),
      _0x16e748['append'](_0x1b4ea8),
      _0x284fcb['append'](_0x16e748),
      _0x1b4ea8
    );
  }
  async function _0x36d149(_0x3bbb7e, _0x572be7, _0x5b5d06 = '正在处理…') {
    if (_0x190019) return ![];
    ((_0x190019 = !![]),
      (_0xf15485 = ![]),
      (_0x3bbb7e['disabled'] = !![]),
      _0x3bbb7e['setAttribute']('aria-busy', 'true'),
      _0x3491c2['setBusy'](!![]),
      (_0x562e28['hidden'] = ![]),
      _0x562e28['classList']['add']('is-pending'),
      (_0x562e28['textContent'] = _0x5b5d06));
    try {
      await _0x572be7();
      if (_0x562e28['textContent'] === _0x5b5d06)
        _0x562e28['textContent'] = _0xf2157()['session']?.['message'] || '操作完成';
    } catch (_0x46b0aa) {
      ((_0xf15485 = !![]),
        (_0x562e28['textContent'] =
          _0x46b0aa['name'] === 'AbortError' ? '操作已取消' : _0x46b0aa['message'] || '操作失败，请重试'));
    } finally {
      ((_0x190019 = ![]),
        (_0x3bbb7e['disabled'] = ![]),
        _0x3491c2['setBusy'](![]),
        _0x3bbb7e['removeAttribute']('aria-busy'),
        _0x562e28['classList']['remove']('is-pending'),
        _0x15b1b5());
    }
    return !![];
  }
  const _0x45b84f = _0x6a02d('auth');
  _0x45b84f['append'](element('p', '', '自动使用当前设备已激活的画布授权，无需再次填写激活码。'));
  const _0x1c834b = _0x213183('重新验证', () => _0x1fb3ad['authenticate'](), _0x45b84f),
    _0x1da256 = _0x213183(
      '激活画布',
      () => {
        (_0x13c1cc(), _0x1fb3ad['activate']());
      },
      _0x45b84f,
    ),
    _0xbcd4ab = _0x6a02d('lobby'),
    _0x1b3e3a = createCollaborationLobby({
      root: _0xbcd4ab,
      head: _0x3a2f69,
      actions: _0x1fb3ad,
      element: element,
      button: _0x213183,
      input: _0x356eb7,
      run: _0x36d149,
      isBusy: () => _0x190019,
    }),
    _0xb9401e = _0x6a02d('active');
  _0x1b3e3a['mountSession'](_0xb9401e);
  const _0x1eb148 = element('div', 'collaboration-room-header');
  (_0xb9401e['append'](_0x1eb148), _0x1eb148['append'](createContextMenuIcon('source', { size: 0x1c })));
  const _0x2ca5d0 = element('div', 'collaboration-room-info');
  _0x1eb148['append'](_0x2ca5d0);
  const _0xbb91f8 = element('h3'),
    _0x574a8e = element('span', 'collaboration-room-role-badge'),
    _0x66df98 = element('p', 'collaboration-subtle collaboration-room-status');
  _0x2ca5d0['append'](_0xbb91f8, _0x574a8e, _0x66df98);
  const _0x5d85f0 = element('div', 'collaboration-session-footer');
  _0x5d85f0['append'](element('span', 'collaboration-subtle', '项目由房主保存'));
  const _0x3adad1 = element('div', 'collaboration-disconnect-slot');
  _0x5d85f0['append'](_0x3adad1);
  const _0x142c4b = element('button', 'collaboration-button', '结束本次联机');
  _0x142c4b['type'] = 'button';
  const _0x2a57e8 = element('div', 'collaboration-disconnect-confirm');
  ((_0x2a57e8['hidden'] = !![]),
    _0x2a57e8['setAttribute']('role', 'group'),
    _0x2a57e8['setAttribute']('aria-label', '确定结束本次联机'),
    _0x3adad1['append'](_0x142c4b, _0x2a57e8));
  let _0x38b42d = '',
    _0x5554c6 = null;
  function _0x144934(_0xe58927 = ![]) {
    ((_0x38b42d = ''),
      (_0x142c4b['hidden'] = ![]),
      (_0x2a57e8['hidden'] = !![]),
      _0x5d85f0['classList']['remove']('is-confirming'));
    if (_0xe58927 && _0x303af2['open'] && _0xf2157()['session']) _0x142c4b['focus']();
  }
  async function _0x804a5a(_0xa91025 = ![]) {
    if (!_0x38b42d || _0xf2157()['session']?.['roomId'] !== _0x38b42d) {
      _0x144934();
      return;
    }
    _0x5554c6 = new AbortController();
    try {
      if (_0xa91025)
        (_0x278e30({ restoreFocus: ![] }),
          (_0x41ad0f = ![]),
          await _0x1fb3ad['saveAndDisconnect']({ signal: _0x5554c6['signal'] }));
      else await _0x1fb3ad['disconnect']({ signal: _0x5554c6['signal'], preserveDraft: !![] });
    } finally {
      ((_0x5554c6 = null), _0x144934(!![]));
    }
  }
  const _0x2d48f3 = _0x213183('确定', () => _0x804a5a(), _0x2a57e8, '正在结束联机…');
  _0x2d48f3['classList']['add']('collaboration-danger');
  const _0x9b35bd = _0x213183('保存并确定', () => _0x804a5a(!![]), _0x2a57e8, '正在保存项目并结束联机…');
  _0x9b35bd['classList']['add']('collaboration-primary');
  const _0x1e3a55 = element('button', 'collaboration-button', '取消');
  ((_0x1e3a55['type'] = 'button'),
    _0x1e3a55['addEventListener']('click', () => {
      if (_0x5554c6) _0x5554c6['abort']();
      else {
        if (!_0x190019) _0x144934(!![]);
      }
    }),
    _0x2a57e8['prepend'](_0x1e3a55),
    _0x142c4b['addEventListener']('click', () => {
      if (_0x190019 || !_0xf2157()['session']) return;
      ((_0x38b42d = _0xf2157()['session']['roomId']),
        (_0x142c4b['hidden'] = !![]),
        (_0x2a57e8['hidden'] = ![]),
        _0x1e3a55['focus'](),
        _0x5d85f0['classList']['add']('is-confirming'));
    }),
    _0x2a57e8['addEventListener']('keydown', (_0x2d4959) => {
      if (_0x2d4959['key'] === 'Escape') {
        (_0x2d4959['preventDefault'](), _0x2d4959['stopPropagation']());
        if (_0x5554c6) _0x5554c6['abort']();
        else {
          if (!_0x190019) _0x144934(!![]);
        }
      }
    }));
  const _0x13df22 = element('div', 'collaboration-invite-section');
  _0xb9401e['append'](_0x13df22);
  const _0x3491c2 = createCollaborationInvitation({
      root: _0x13df22,
      element: element,
      button: _0x213183,
      input: _0x356eb7,
      actions: _0x1fb3ad,
      getState: _0xf2157,
      feedback: (_0x56f1d8) => {
        _0x562e28['textContent'] = _0x56f1d8;
      },
    }),
    _0x4c2770 = element('div', 'collaboration-member-heading');
  _0xb9401e['append'](_0x4c2770);
  const _0x4e7cc3 = element('h4');
  _0x4c2770['append'](_0x4e7cc3);
  const _0x3c675f = element('div', 'collaboration-list\x20collaboration-members');
  (_0x3c675f['setAttribute']('aria-label', '协作成员'), _0xb9401e['append'](_0x3c675f));
  const _0x262dfb = _0x213183('召集成员到我的视角', () => _0x1fb3ad['summon'](), _0xb9401e);
  (_0x262dfb['classList']['add']('collaboration-text-action', 'collaboration-summon'),
    _0x262dfb['prepend'](createContextMenuIcon('select-all')));
  const _0x36314e = createCollaborationMembers({
      root: _0x3c675f,
      element: element,
      button: _0x213183,
      run: _0x36d149,
      actions: _0x1fb3ad,
      confirmAction: _0xe018da,
      getState: _0xf2157,
    }),
    _0x3264c1 = element('details', 'collaboration-management'),
    _0x4b37bc = element('summary', '', '房间设置'),
    _0x2a0e68 = element('span');
  ((_0x2a0e68['innerHTML'] = ADVANCED_SETTINGS_TUNE_ICON_MARKUP),
    _0x4b37bc['prepend'](_0x2a0e68),
    _0x3264c1['append'](_0x4b37bc));
  const _0x1701ec = element('div', 'collaboration-actions');
  _0x3264c1['append'](_0x1701ec);
  const _0x7738e5 = _0x213183(
      '使所有邀请信息失效',
      async () => {
        (await _0x1fb3ad['revokeInvites'](), _0x3491c2['invalidate']());
      },
      _0x1701ec,
    ),
    _0x432897 = _0x213183(
      '关闭协作',
      () =>
        _0xe018da('关闭后所有成员将无法访问此房间，本机内容保留。确认关闭？', () => _0x1fb3ad['closeRoom']()),
      _0x1701ec,
    ),
    _0x5d64ca = _0x213183(
      '退出成员列表',
      () => _0xe018da('退出后需要使用有效邀请重新加入，确认退出？', () => _0x1fb3ad['leaveRoom']()),
      _0x1701ec,
    ),
    _0x256ab8 = element('div', 'collaboration-task-list');
  _0xb9401e['append'](_0x256ab8);
  const _0x5e4007 = createCollaborationActivity({ root: _0xb9401e, getState: _0xf2157, actions: _0x1fb3ad }),
    _0x22d3da = element('div', 'collaboration-section');
  _0xb9401e['append'](_0x22d3da);
  const _0x21ae20 = element('p');
  (_0x22d3da['append'](_0x21ae20),
    _0x213183(
      '使用房主版本',
      () => _0xe018da('放弃这些冲突节点的本机修改，使用房主版本？', () => _0x1fb3ad['resolveConflicts'](![])),
      _0x22d3da,
    ),
    _0x213183(
      '提交本机版本',
      () =>
        _0xe018da('用本机内容重新提交这些冲突节点？房主会再次检查权限和节点占用。', () =>
          _0x1fb3ad['resolveConflicts'](!![]),
        ),
      _0x22d3da,
    ));
  const _0x3fc104 = element('p', 'collaboration-subtle');
  (_0xb9401e['append'](_0x3fc104), _0x1b3e3a['mountSessionControls'](_0x3264c1, _0x5d85f0));
  const _0x13c6db = _0x6a02d('confirmation');
  _0x13c6db['hidden'] = !![];
  const _0x3a0259 = element('p');
  _0x13c6db['append'](_0x3a0259);
  let _0x2ee53c = null,
    _0x196d98 = '';
  (_0x213183(
    '确认',
    async () => {
      const _0x38ee00 = _0x2ee53c;
      ((_0x2ee53c = null), (_0x13c6db['hidden'] = !![]));
      if (_0xf2157()['session']?.['roomId'] === _0x196d98) await _0x38ee00?.();
    },
    _0x13c6db,
  ),
    _0x213183(
      '取消',
      () => {
        ((_0x2ee53c = null), (_0x13c6db['hidden'] = !![]));
      },
      _0x13c6db,
    ));
  function _0xe018da(_0x3a780e, _0x2d7561) {
    ((_0x196d98 = _0xf2157()['session']?.['roomId']),
      (_0x3a0259['textContent'] = _0x3a780e),
      (_0x2ee53c = _0x2d7561),
      (_0x13c6db['hidden'] = ![]),
      _0x13c6db['querySelector']('button')['focus']());
  }
  (_0x303af2['append'](_0x3a2f69, _0x129fe4), document['body']['append'](_0x303af2));
  let _0x5b6410 = 0x0,
    _0x2b0e11 = '';
  function _0x13c1cc(_0x2e87e7 = !![]) {
    (cancelAnimationFrame(_0x5b6410),
      _0x3491c2['close'](),
      _0x36314e['close'](),
      _0x1b3e3a['resetHostChoice'](),
      _0x144934(),
      (_0x2ee53c = null),
      (_0x13c6db['hidden'] = !![]),
      _0x278e30({ restoreFocus: _0x2e87e7 }),
      (_0x41ad0f = ![]),
      _0x303af2['close'](),
      anchor?.['setAttribute']('aria-expanded', 'false'));
  }
  function _0x1f9d81() {
    _0x13c1cc();
  }
  (_0x104c24['addEventListener']('click', _0x1f9d81),
    _0x303af2['addEventListener']('cancel', (_0x494b47) => {
      (_0x494b47['preventDefault'](), _0x1f9d81());
    }));
  const _0x1e975d = (_0x2abdac) => {
    if (!_0x303af2['open']) return;
    if (_0x303af2['contains'](_0x2abdac['target'])) {
      _0x2a4279();
      return;
    }
    if (anchor?.['contains'](_0x2abdac['target'])) return;
    if (keepOpenOnOutside(_0x2abdac['target']))
      (_0x3491c2['close'](), _0x36314e['close'](), _0x278e30({ restoreFocus: ![] }), (_0x41ad0f = ![]));
    else _0x13c1cc(![]);
  };
  document['addEventListener']('pointerdown', _0x1e975d, !![]);
  function _0x1e962c() {
    const _0x101ec4 = anchor?.['getBoundingClientRect'](),
      _0x18812c = Math['min'](_0x101ec4?.['bottom'] || 0x30, window['innerHeight'] / 0x3) + 0xa,
      _0x52ab10 = Math['max'](
        0xc,
        Math['min'](
          window['innerWidth'] - (_0x101ec4?.['right'] || window['innerWidth'] - 0x10),
          window['innerWidth'] - _0x303af2['offsetWidth'] - 0xc,
        ),
      ),
      _0xf279d3 = _0x18812c + ':' + _0x52ab10;
    _0xf279d3 !== _0x2b0e11 &&
      ((_0x2b0e11 = _0xf279d3),
      _0x303af2['style']['setProperty']('--collaboration-top', _0x18812c + 'px'),
      _0x303af2['style']['setProperty']('--collaboration-right', _0x52ab10 + 'px'));
    if (_0x303af2['open']) _0x5b6410 = requestAnimationFrame(_0x1e962c);
  }
  function _0x15b1b5() {
    const _0x48ac9f = _0xf2157();
    _0x9b35bd['hidden'] = !_0x48ac9f['session']?.['hosting'];
    const _0x11d300 = _0x48ac9f['session']?.['roomId'] || '';
    _0x11d300 !== _0x1db7c6 && ((_0x1db7c6 = _0x11d300), (_0xf15485 = ![]));
    if (_0x38b42d && _0x48ac9f['session']?.['roomId'] !== _0x38b42d) _0x144934();
    _0x196d98 &&
      _0x48ac9f['session']?.['roomId'] !== _0x196d98 &&
      ((_0x2ee53c = null), (_0x13c6db['hidden'] = !![]));
    ((_0x55d432['auth']['hidden'] = !!_0x48ac9f['authenticated'] && !_0x48ac9f['authenticating']),
      (_0x55d432['lobby']['hidden'] =
        (!_0x48ac9f['authenticated'] || !!_0x48ac9f['authenticating']) && !_0x48ac9f['session']),
      (_0x55d432['active']['hidden'] = !_0x48ac9f['session']),
      _0x1b3e3a['render'](_0x48ac9f),
      _0x3491c2['render'](_0x48ac9f),
      _0x5e4007['render']());
    const _0x410ff4 = _0x36314e['render'](_0x48ac9f);
    (_0x303af2['classList']['toggle']('is-lobby', !_0x55d432['lobby']['hidden']),
      _0x303af2['classList']['toggle']('is-session', !!_0x48ac9f['session']),
      (_0x1c834b['hidden'] = !!_0x48ac9f['authenticating']),
      (_0x1da256['hidden'] = _0x48ac9f['authError']?.['code'] !== 'ACTIVATION_REQUIRED'));
    const _0x30e21d = _0x48ac9f['session']?.['status'] === 'connecting';
    _0x303af2['setAttribute']('aria-busy', String(_0x190019 || !!_0x48ac9f['authenticating'] || _0x30e21d));
    if (!_0x190019) {
      _0x562e28['classList']['toggle']('is-pending', !!_0x48ac9f['authenticating'] || _0x30e21d);
      if (_0x48ac9f['authenticating']) _0x562e28['textContent'] = '正在验证当前设备的画布授权…';
      else {
        if (_0x48ac9f['authError']) _0x562e28['textContent'] = _0x48ac9f['authError']['message'];
        else {
          if (_0x562e28['textContent'] === '正在验证当前设备的画布授权…') _0x562e28['textContent'] = '';
        }
      }
    }
    const _0x59086d = _0x48ac9f['session']?.['message'] || '';
    if (!_0x190019 && !_0xf15485 && _0x59086d && _0x59086d !== _0x2ba0a7)
      _0x562e28['textContent'] = _0x59086d;
    ((_0x2ba0a7 = _0x59086d),
      (_0x562e28['hidden'] =
        !_0x190019 && !_0x48ac9f['authenticating'] && QUIET_SYNC_MESSAGES['has'](_0x562e28['textContent'])));
    !_0x48ac9f['session'] && ((_0x13c6db['hidden'] = !![]), (_0x2ee53c = null));
    if (_0x48ac9f['session']) {
      ((_0xbb91f8['textContent'] = _0x48ac9f['session']['name']),
        (_0x574a8e['textContent'] = ROLE_NAMES[_0x48ac9f['session']['role']]),
        (_0x66df98['textContent'] =
          (_0x48ac9f['session']['hosting'] ? '本机开房' : '已加入房间') + ' · ' + _0x410ff4 + ' 人在线'),
        (_0x66df98['dataset']['status'] = _0x48ac9f['session']['status'] || 'connecting'),
        (_0x4e7cc3['textContent'] = '成员\x20·\x20' + (_0x48ac9f['session']['members']?.['length'] || 0x0)),
        (_0x262dfb['hidden'] = _0x48ac9f['session']['role'] !== 'owner'),
        (_0x22d3da['hidden'] = !_0x48ac9f['session']['conflicts']?.['length']),
        (_0x21ae20['textContent'] =
          '以下节点或连线存在冲突，其他内容可继续协作：' +
          (_0x48ac9f['session']['conflicts'] || [])['map']((_0x40863f) => _0x40863f['id'])['join']('、')),
        (_0x3fc104['textContent'] = _0x48ac9f['session']['recoveryError'] || ''),
        (_0x3fc104['hidden'] = !_0x48ac9f['session']['recoveryError']));
      const _0x4a6f2a = ['owner', 'admin']['includes'](_0x48ac9f['session']['role']);
      ((_0x7738e5['hidden'] = !_0x4a6f2a),
        (_0x432897['hidden'] = _0x48ac9f['session']['role'] !== 'owner'),
        (_0x5d64ca['hidden'] = _0x48ac9f['session']['role'] === 'owner'));
      const _0x47f369 = JSON['stringify']([_0x48ac9f['session']['jobs'], _0x48ac9f['session']['role']]);
      if (_0x47f369 !== _0x168316) {
        ((_0x168316 = _0x47f369), _0x256ab8['replaceChildren']());
        for (const _0xd47fe3 of (_0x48ac9f['session']['jobs'] || [])['filter'](
          (_0x431a21) => _0x431a21['status'] === 'running',
        )) {
          _0x256ab8['append'](
            element(
              'p',
              '',
              '节点 ' +
                _0xd47fe3['node'] +
                ' 正在由' +
                (_0x48ac9f['session']['members']['find'](
                  (_0x411ae9) => _0x411ae9['id'] === _0xd47fe3['actor'],
                )?.['name'] || '成员') +
                '生成',
            ),
          );
          if (_0xd47fe3['actor'] === _0x48ac9f['actorId'] || _0x48ac9f['session']['role'] === 'owner')
            _0x213183(
              '处理离线任务',
              () =>
                _0xe018da(
                  '请先确认模型服务中的任务已停止或结束。此操作只解除协作占用，不会取消模型服务中的任务，确认已结束？',
                  () => _0x1fb3ad['resolveTask'](_0xd47fe3),
                ),
              _0x256ab8,
            );
        }
      }
    }
  }
  return {
    show() {
      if (!_0x303af2['open']) _0x562e28['textContent'] = _0xf2157()['session']?.['message'] || '';
      _0x15b1b5();
      if (_0x303af2['open']) return;
      (_0x303af2['show'](), _0x1e962c(), anchor?.['setAttribute']('aria-expanded', 'true'), _0x2a4279());
    },
    toggle() {
      if (_0x303af2['open']) _0x1f9d81();
      else this['show']();
    },
    render: _0x15b1b5,
    renderPresence() {
      if (!_0x303af2['open']) return;
      const _0x1a6d5f = _0xf2157(),
        _0x48cfff = _0x36314e['render'](_0x1a6d5f);
      if (_0x1a6d5f['session']) {
        const _0x4b7cfa =
          (_0x1a6d5f['session']['hosting'] ? '本机开房' : '已加入房间') +
          '\x20·\x20' +
          _0x48cfff +
          '\x20人在线';
        if (_0x66df98['textContent'] !== _0x4b7cfa) _0x66df98['textContent'] = _0x4b7cfa;
      }
    },
    feedback(_0x539ce9) {
      !_0x190019 && !_0xf15485 && ((_0x562e28['hidden'] = ![]), (_0x562e28['textContent'] = _0x539ce9));
    },
    destroy() {
      (cancelAnimationFrame(_0x5b6410),
        _0x3491c2['close'](),
        _0x36314e['destroy'](),
        _0x278e30(),
        document['removeEventListener']('pointerdown', _0x1e975d, !![]),
        _0x303af2['remove']());
    },
  };
}
