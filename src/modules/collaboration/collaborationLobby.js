import { createContextMenuIcon } from '../../components/contextMenuIcon.js';
export function createCollaborationLobby({
  root: _0x3da446,
  head: _0x4d0904,
  actions: _0x5dc183,
  element: _0x307411,
  button: _0x4aed21,
  input: _0x4bd469,
  run: _0x55ba96,
  isBusy: _0x36add9,
}) {
  let _0x345a2b = 'host',
    _0xd9ed03 = ![],
    _0x3701cb = '';
  const _0x73e260 = _0x307411('div', 'collaboration-profile'),
    _0x2e501e = _0x4bd469('协作昵称', _0x73e260);
  ((_0x2e501e['maxLength'] = 0x20),
    _0x2e501e['addEventListener']('change', () => _0x5dc183['setDisplayName'](_0x2e501e['value'])));
  const _0x1b1824 = _0x307411('button', 'collaboration-button collaboration-quiet');
  ((_0x1b1824['type'] = 'button'),
    _0x1b1824['setAttribute']('aria-label', '修改协作昵称'),
    _0x1b1824['append'](createContextMenuIcon('edit')),
    _0x1b1824['addEventListener']('click', () => {
      (_0x2e501e['focus'](), _0x2e501e['select']());
    }),
    _0x73e260['append'](_0x1b1824),
    _0x4d0904['insertBefore'](_0x73e260, _0x4d0904['lastChild']));
  const _0x3b32c6 = _0x307411('div', 'collaboration-tabs');
  (_0x3b32c6['setAttribute']('role', 'tablist'), _0x3b32c6['setAttribute']('aria-label', '协作方式'));
  const _0xf45bf2 = {},
    _0x3c6bfd = {};
  _0x3da446['append'](_0x3b32c6);
  for (const [_0x5f4083, _0x507687] of [
    ['host', '开房'],
    ['join', '加入'],
  ]) {
    const _0x413806 = _0x307411('button', 'collaboration-button collaboration-tab', _0x507687);
    ((_0x413806['type'] = 'button'),
      (_0x413806['id'] = 'collaboration-' + _0x5f4083 + '-tab'),
      _0x413806['setAttribute']('role', 'tab'),
      _0x413806['setAttribute']('aria-controls', 'collaboration-' + _0x5f4083 + '-view'),
      _0x413806['addEventListener']('click', () => _0x4e4633(_0x5f4083)),
      _0x413806['addEventListener']('keydown', (_0x345a5a) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End']['includes'](_0x345a5a['key'])) return;
        (_0x345a5a['preventDefault'](),
          _0x4e4633(
            _0x345a5a['key'] === 'Home'
              ? 'host'
              : _0x345a5a['key'] === 'End'
                ? 'join'
                : _0x345a2b === 'host'
                  ? 'join'
                  : 'host',
          ),
          _0x3c6bfd[_0x345a2b]['focus']());
      }));
    const _0x40bf6f = _0x307411('div', 'collaboration-lobby-view');
    ((_0x40bf6f['id'] = 'collaboration-' + _0x5f4083 + '-view'),
      _0x40bf6f['setAttribute']('role', 'tabpanel'),
      _0x40bf6f['setAttribute']('aria-labelledby', _0x413806['id']),
      (_0x3c6bfd[_0x5f4083] = _0x413806),
      (_0xf45bf2[_0x5f4083] = _0x40bf6f),
      _0x3b32c6['append'](_0x413806),
      _0x3da446['append'](_0x40bf6f));
  }
  function _0x4e4633(_0xc3ea01) {
    if (_0x3701cb && _0xc3ea01 !== _0x3701cb) return;
    if (_0xc3ea01 !== _0x345a2b) _0x5bc31e();
    ((_0x345a2b = _0xc3ea01), (_0x3b32c6['dataset']['mode'] = _0x345a2b));
    for (const _0x39e8b6 of Object['keys'](_0xf45bf2)) {
      ((_0xf45bf2[_0x39e8b6]['hidden'] = !!_0x3701cb || _0x39e8b6 !== _0x345a2b),
        (_0x3c6bfd[_0x39e8b6]['disabled'] = !!_0x3701cb && _0x39e8b6 !== _0x3701cb),
        _0x3c6bfd[_0x39e8b6]['setAttribute']('aria-selected', String(_0x39e8b6 === _0x345a2b)),
        (_0x3c6bfd[_0x39e8b6]['tabIndex'] = _0x39e8b6 === _0x345a2b ? 0x0 : -0x1));
    }
  }
  const _0x2dd8cc = _0x307411('div', 'collaboration-current');
  _0x2dd8cc['append'](createContextMenuIcon('source', { size: 0x1c }));
  const _0x425ef4 = _0x307411('div', 'collaboration-current-text'),
    _0x2a7fb5 = _0x307411('span', 'collaboration-node-count collaboration-subtle');
  (_0x425ef4['append'](_0x307411('strong', '', '当前画布'), _0x2a7fb5), _0x2dd8cc['append'](_0x425ef4));
  let _0x13c481 = '',
    _0x379ab7 = ![];
  const _0x2bc5cc = _0x307411('div', 'collaboration-host-actions');
  _0x2dd8cc['append'](_0x2bc5cc);
  const _0x11504e = _0x307411('button', 'collaboration-button collaboration-primary', '立即开房');
  ((_0x11504e['type'] = 'button'),
    _0x2bc5cc['append'](_0x11504e),
    _0x11504e['addEventListener']('click', () => {
      if (!_0x13c481) return _0x55ba96(_0x11504e, () => _0x5dc183['create']());
      ((_0x379ab7 = !![]),
        (_0x11504e['hidden'] = !![]),
        (_0x2117ec['hidden'] = ![]),
        _0x2dd8cc['classList']['add']('is-choosing'),
        _0x226cad['focus']());
    }));
  const _0x2117ec = _0x307411('div', 'collaboration-host-choice');
  ((_0x2117ec['hidden'] = !![]),
    _0x2117ec['setAttribute']('role', 'group'),
    _0x2117ec['setAttribute']('aria-label', '恢复上次协作或新建协作'),
    _0x2bc5cc['append'](_0x2117ec));
  const _0x226cad = _0x4aed21('恢复上次', () => _0x5dc183['resume'](), _0x2117ec);
  (_0x226cad['classList']['add']('collaboration-primary'),
    _0x4aed21('新建协作', () => _0x5dc183['create']({ fresh: !![] }), _0x2117ec));
  function _0x5bc31e() {
    ((_0x379ab7 = ![]),
      (_0x11504e['hidden'] = ![]),
      (_0x2117ec['hidden'] = !![]),
      _0x2dd8cc['classList']['remove']('is-choosing'));
  }
  (_0x2117ec['addEventListener']('keydown', (_0x58685b) => {
    if (_0x58685b['key'] !== 'Escape' || _0x2117ec['querySelector']('[aria-busy="true"]')) return;
    (_0x58685b['preventDefault'](), _0x58685b['stopPropagation'](), _0x5bc31e(), _0x11504e['focus']());
  }),
    _0xf45bf2['host']['append'](_0x2dd8cc));
  const _0x3dd440 = _0x307411('div', 'collaboration-section');
  ((_0x3dd440['hidden'] = !![]), _0x3dd440['setAttribute']('aria-label', '协作端口恢复'));
  const _0x8f8222 = _0x307411('p', 'collaboration-subtle'),
    _0xf9fd13 = _0x307411('div', 'collaboration-actions'),
    _0x3918a8 = _0x4aed21('重试原端口', () => _0x5dc183['retryHostPort'](), _0xf9fd13, '正在重试协作连接…'),
    _0x342a08 = _0x4aed21(
      '更换端口并继续',
      () => _0x5dc183['retryHostPort'](!![]),
      _0xf9fd13,
      '正在更换协作端口…',
    );
  (_0x3dd440['append'](
    _0x8f8222,
    _0x307411(
      'p',
      'collaboration-subtle',
      '更换后，本机所有房间的旧邀请地址将不可用。房间与画布保留，请生成并重新发送邀请信息。',
    ),
    _0xf9fd13,
  ),
    _0xf45bf2['host']['append'](_0x3dd440),
    _0xf45bf2['join']['append'](
      _0x307411('h3', '', '加入协作画布'),
      _0x307411('p', 'collaboration-subtle', '粘贴房主发来的邀请信息，即可加入。'),
    ));
  const _0x4fab50 = _0x4bd469('邀请连接信息', _0xf45bf2['join'], { placeholder: '粘贴房主生成的 AICLAN2.…' }),
    _0x1d8d5e = _0x4aed21(
      '加入协作',
      () => _0x5dc183['join'](_0x4fab50['value']['trim']()),
      _0xf45bf2['join'],
    );
  (_0x1d8d5e['classList']['add']('collaboration-primary'),
    (_0x1d8d5e['disabled'] = !![]),
    _0x4fab50['addEventListener']('input', () => {
      _0x1d8d5e['disabled'] = _0x36add9() || !_0x4fab50['value']['trim']();
    }),
    _0x4fab50['addEventListener']('keydown', (_0xfa7be2) => {
      _0xfa7be2['key'] === 'Enter' &&
        !_0xfa7be2['isComposing'] &&
        (_0xfa7be2['preventDefault'](), _0x1d8d5e['click']());
    }));
  const _0x3046d1 = _0x307411('div', 'collaboration-lobby-footer'),
    _0x5f1abc = _0x307411('div', 'collaboration-session-slot');
  _0x3da446['append'](_0x5f1abc);
  const _0x5cc0c7 = _0x307411('div', 'collaboration-session-controls');
  _0x3da446['append'](_0x5cc0c7);
  const _0x59ac8a = _0x307411('span', 'collaboration-subtle', '已使用本机画布授权'),
    _0x3f67a0 = _0x307411('details', 'collaboration-help'),
    _0x22bc7f = _0x307411('summary', '', '连接说明');
  return (
    _0x22bc7f['prepend'](createContextMenuIcon('details')),
    _0x3f67a0['append'](
      _0x22bc7f,
      _0x307411(
        'p',
        'collaboration-subtle',
        '本机作为房主，成员通过局域网或 VPN 连接。加入先同步节点，素材按需从房主读取，视频分段播放；房主离线后协作暂停。成员新增素材只传给房主，生成费用由发起人自己的模型账号承担。',
      ),
      _0x307411(
        'p',
        'collaboration-subtle',
        '本机文件分片续传，单文件上限 2 GiB，房间素材总量上限 5 GiB；临时或远程素材上限 256 MiB。再次协作时打开原画布开房；项目文件只能由房主保存。',
      ),
    ),
    _0x3046d1['append'](_0x59ac8a, _0x3f67a0),
    _0x3da446['append'](_0x3046d1),
    _0x4e4633('host'),
    {
      resetHostChoice: _0x5bc31e,
      mountSession(_0x38fb77) {
        _0x5f1abc['append'](_0x38fb77);
      },
      mountSessionControls(..._0x4a79ed) {
        _0x5cc0c7['append'](..._0x4a79ed);
      },
      render(_0x34da36) {
        ((_0x3dd440['hidden'] = !_0x34da36['hostPortConflict'] || !!_0x34da36['session']),
          (_0x8f8222['textContent'] = _0x34da36['hostPortConflict']?.['message'] || ''),
          (_0x3918a8['disabled'] = _0x342a08['disabled'] = _0x36add9()),
          (_0x11504e['disabled'] = _0x36add9()),
          (_0x73e260['hidden'] = _0x3da446['hidden'] || !!_0x34da36['session']),
          (_0x3b32c6['hidden'] = !!_0x34da36['session']),
          (_0x3046d1['hidden'] = !!_0x34da36['session']),
          (_0x5cc0c7['hidden'] = !_0x34da36['session']),
          (_0x2e501e['readOnly'] = !!_0x34da36['session']),
          (_0x1b1824['hidden'] = !!_0x34da36['session']));
        if (document['activeElement'] !== _0x2e501e) _0x2e501e['value'] = _0x34da36['displayName'] || '成员';
        _0x3701cb = _0x34da36['session'] ? (_0x34da36['session']['role'] === 'owner' ? 'host' : 'join') : '';
        if (_0x3701cb) _0x4e4633(_0x3701cb);
        else {
          if (_0xd9ed03) _0x4e4633('host');
        }
        ((_0x5f1abc['hidden'] = !_0x34da36['session']),
          (_0xd9ed03 = !!_0x34da36['session']),
          (_0x2a7fb5['textContent'] = (_0x34da36['nodeCount'] || 0x0) + ' 个节点'));
        const _0x1d754f =
          _0x34da36['resumeRoom'] && !_0x34da36['session']
            ? _0x34da36['resumeRoom']['canvasId'] +
              ':' +
              _0x34da36['resumeRoom']['roomId'] +
              ':' +
              _0x34da36['resumeRoom']['hosting']
            : '';
        if (_0x379ab7 && _0x1d754f !== _0x13c481) _0x5bc31e();
        _0x13c481 = _0x1d754f;
        if (!_0x1d8d5e['hasAttribute']('aria-busy')) _0x1d8d5e['disabled'] = !_0x4fab50['value']['trim']();
      },
    }
  );
}
