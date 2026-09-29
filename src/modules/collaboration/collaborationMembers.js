import { collaborationMemberColor } from './collaborationMemberColor.js';
import { createCollaborationSelect } from './collaborationSelect.js';
import { createCollaborationNicknameEditor } from './collaborationNicknameEditor.js';
const ROLES = { owner: '房主', admin: '管理员', editor: '可编辑', viewer: '只读' };
export function onlineCollaborationActors(_0x7be009, _0xc56f6d) {
  const _0x35bcb7 = new Set(
    (_0x7be009?.['presence'] || [])
      ['filter']((_0x202f93) => !_0x202f93['expiresAt'] || _0x202f93['expiresAt'] * 0x3e8 > Date['now']())
      ['map']((_0x16787c) => _0x16787c['actorId']),
  );
  if (_0x7be009 && _0xc56f6d && !['offline', 'blocked']['includes'](_0x7be009['status']))
    _0x35bcb7['add'](_0xc56f6d);
  return _0x35bcb7;
}
export function createCollaborationMembers({
  root: _0x41b2d2,
  element: _0x291bd3,
  button: _0x388c70,
  run: _0x5241c7,
  actions: _0x272dfe,
  confirmAction: _0x477365,
  getState: _0x43e629,
}) {
  let _0x209e48 = '';
  const _0x332032 = new Map();
  function _0x2eec32(_0x2f44e0) {
    const _0x3e5e95 = _0x2f44e0['session'],
      _0x31f22e = JSON['stringify']([
        _0x3e5e95?.['roomId'],
        _0x2f44e0['actorId'],
        _0x3e5e95?.['role'],
        _0x3e5e95?.['members'],
      ]);
    if (_0x31f22e !== _0x209e48) {
      _0x209e48 = _0x31f22e;
      const _0x1e99c1 = new Set((_0x3e5e95?.['members'] || [])['map']((_0x33c47d) => _0x33c47d['id']));
      for (const [_0x55499e, _0x170d72] of _0x332032)
        !_0x1e99c1['has'](_0x55499e) &&
          (_0x170d72['nickname']?.['destroy'](),
          _0x170d72['permission']?.['destroy'](),
          _0x170d72['row']['remove'](),
          _0x332032['delete'](_0x55499e));
      for (const _0x23b93b of _0x3e5e95?.['members'] || []) {
        const _0x179786 = JSON['stringify']([
            _0x3e5e95['roomId'],
            _0x2f44e0['actorId'],
            _0x3e5e95['role'],
            _0x23b93b['id'] === _0x2f44e0['actorId'] ? { ..._0x23b93b, name: undefined } : _0x23b93b,
          ]),
          _0x2b189b = _0x332032['get'](_0x23b93b['id']);
        if (_0x2b189b?.['key'] === _0x179786) {
          _0x2b189b['name'] !== _0x23b93b['name'] &&
            ((_0x2b189b['label']['textContent'] = _0x23b93b['name'] + '（你）'),
            (_0x2b189b['avatar']['textContent'] = _0x23b93b['name']['slice'](0x0, 0x1)),
            (_0x2b189b['name'] = _0x23b93b['name']),
            _0x2b189b['nickname']?.['update'](_0x23b93b['name']));
          continue;
        }
        (_0x2b189b?.['nickname']?.['destroy'](),
          _0x332032['get'](_0x23b93b['id'])?.['permission']?.['destroy'](),
          _0x332032['get'](_0x23b93b['id'])?.['row']['remove']());
        const _0x1ee712 = _0x291bd3('div', 'collaboration-member');
        _0x1ee712['style']['setProperty']('--member-color', collaborationMemberColor(_0x23b93b));
        const _0x2fe12f = _0x23b93b['id'] === _0x2f44e0['actorId'],
          _0x114c60 = _0x291bd3(
            'span',
            'collaboration-member-name',
            '' + _0x23b93b['name'] + (_0x2fe12f ? '（你）' : ''),
          ),
          _0x1582fb = _0x291bd3('span', 'collaboration-member-online');
        _0x1582fb['setAttribute']('role', 'img');
        const _0x252059 = _0x291bd3('div', 'collaboration-member-actions'),
          _0x4702fb = _0x291bd3('span', 'collaboration-avatar', _0x23b93b['name']['slice'](0x0, 0x1));
        _0x1ee712['append'](_0x4702fb, _0x114c60, _0x1582fb, _0x252059);
        const _0x4e4667 =
          !_0x2fe12f &&
          _0x23b93b['role'] !== 'owner' &&
          (_0x3e5e95['role'] === 'owner' || (_0x3e5e95['role'] === 'admin' && _0x23b93b['role'] !== 'admin'));
        if (!_0x4e4667)
          _0x252059['append'](_0x291bd3('span', 'collaboration-member-role', ROLES[_0x23b93b['role']]));
        let _0x2fc007, _0x192fc8;
        if (!_0x2fe12f) {
          ((_0x2fc007 = _0x388c70(
            '跟随',
            () =>
              _0x272dfe['follow'](
                _0x43e629()['session']?.['followActorId'] === _0x23b93b['id'] ? '' : _0x23b93b['id'],
              ),
            _0x252059,
            ![],
          )),
            _0x2fc007['setAttribute']('aria-label', '跟随 ' + _0x23b93b['name']));
          if (_0x4e4667) {
            const _0x13ac78 = _0x291bd3('select', 'collaboration-input');
            _0x13ac78['setAttribute']('aria-label', _0x23b93b['name'] + '的权限');
            for (const _0x5e4f88 of _0x3e5e95['role'] === 'owner'
              ? ['admin', 'editor', 'viewer']
              : ['editor', 'viewer']) {
              const _0x3443a5 = _0x291bd3('option', '', ROLES[_0x5e4f88]);
              ((_0x3443a5['value'] = _0x5e4f88), _0x13ac78['append'](_0x3443a5));
            }
            ((_0x13ac78['value'] = _0x23b93b['role']),
              _0x252059['append'](_0x13ac78),
              (_0x192fc8 = createCollaborationSelect(_0x13ac78, _0x23b93b['name'] + '的权限')),
              _0x13ac78['addEventListener']('change', async () => {
                const _0x5dc832 = await _0x5241c7(_0x192fc8['trigger'], async () => {
                  try {
                    await _0x272dfe['member'](_0x23b93b['id'], _0x13ac78['value']);
                  } catch (_0x8393fc) {
                    ((_0x13ac78['value'] = _0x23b93b['role']), _0x192fc8['sync']());
                    throw _0x8393fc;
                  }
                });
                _0x5dc832 === ![] && ((_0x13ac78['value'] = _0x23b93b['role']), _0x192fc8['sync']());
              }));
            const _0x2da3e8 = _0x388c70(
              '移除',
              () =>
                _0x477365('移除 ' + _0x23b93b['name'] + ' 并使现有邀请信息失效？', () =>
                  _0x272dfe['remove'](_0x23b93b['id']),
                ),
              _0x252059,
            );
            (_0x2da3e8['classList']['add']('collaboration-danger'),
              _0x2da3e8['setAttribute']('aria-label', '移除 ' + _0x23b93b['name']));
          }
        }
        const _0x196ae1 = _0x2fe12f
          ? createCollaborationNicknameEditor({
              row: _0x1ee712,
              controls: _0x252059,
              element: _0x291bd3,
              button: _0x388c70,
              run: _0x5241c7,
              actions: _0x272dfe,
              getState: _0x43e629,
              person: _0x23b93b,
            })
          : null;
        _0x332032['set'](_0x23b93b['id'], {
          online: _0x1582fb,
          follow: _0x2fc007,
          permission: _0x192fc8,
          nickname: _0x196ae1,
          avatar: _0x4702fb,
          label: _0x114c60,
          row: _0x1ee712,
          key: _0x179786,
          name: _0x23b93b['name'],
        });
      }
      (_0x3e5e95?.['members'] || [])['forEach']((_0x2e0a3e, _0x1ce9b3) => {
        const _0x34c779 = _0x332032['get'](_0x2e0a3e['id'])['row'];
        if (_0x41b2d2['children'][_0x1ce9b3] !== _0x34c779)
          _0x41b2d2['insertBefore'](_0x34c779, _0x41b2d2['children'][_0x1ce9b3] || null);
      });
    }
    const _0x37366e = onlineCollaborationActors(_0x3e5e95, _0x2f44e0['actorId']);
    for (const [_0x163533, _0xc175cc] of _0x332032) {
      const _0x4ba3c5 = _0x37366e['has'](_0x163533),
        _0x54bb00 = _0x3e5e95['followActorId'] === _0x163533;
      (_0xc175cc['isOnline'] !== _0x4ba3c5 &&
        ((_0xc175cc['online']['dataset']['online'] = String(_0x4ba3c5)),
        _0xc175cc['online']['setAttribute']('aria-label', _0x4ba3c5 ? '在线' : '离线')),
        _0xc175cc['follow'] &&
          (_0xc175cc['isOnline'] !== _0x4ba3c5 || _0xc175cc['following'] !== _0x54bb00) &&
          ((_0xc175cc['follow']['disabled'] = !_0x54bb00 && !_0x4ba3c5),
          (_0xc175cc['follow']['textContent'] = _0x54bb00 ? '中止跟随' : '跟随'),
          _0xc175cc['follow']['setAttribute']('aria-pressed', String(_0x54bb00)),
          _0xc175cc['follow']['setAttribute'](
            'aria-label',
            _0xc175cc['follow']['textContent'] + '\x20' + _0xc175cc['name'],
          )),
        (_0xc175cc['isOnline'] = _0x4ba3c5),
        (_0xc175cc['following'] = _0x54bb00));
    }
    return _0x37366e['size'];
  }
  return {
    render: _0x2eec32,
    close() {
      for (const _0x56e7bd of _0x332032['values']()) {
        (_0x56e7bd['permission']?.['close'](), _0x56e7bd['nickname']?.['close']());
      }
    },
    destroy() {
      for (const _0x25c4ca of _0x332032['values']()) {
        (_0x25c4ca['permission']?.['destroy'](), _0x25c4ca['nickname']?.['destroy']());
      }
      _0x332032['clear']();
    },
  };
}
