import {
  reviewElement,
  reviewTime,
  reviewAvatar,
  reviewSendButton,
  colorMemberName,
} from './collaborationReviewDom.js';
import { createContextMenuIcon } from '../../components/contextMenuIcon.js';
import { createCollaborationChatState } from './collaborationChatState.js';
import { bindCollaborationChatPosition } from './collaborationChatPosition.js';
import { showToast } from '../../services/toastService.js';
import { updateNodeReference } from './collaborationNodeReference.js';
import { bindTextareaMentions } from '../../components/shared/textareaMentions.js';
export function createCollaborationChat({ store: _0x45dc5d, getSession: _0x23ead6, openNode: _0x5ef9dd }) {
  const _0xf7a11c = reviewElement('section', 'collaboration-chat');
  ((_0xf7a11c['hidden'] = !![]),
    _0xf7a11c['setAttribute']('aria-label', '协作聊天'),
    _0xf7a11c['setAttribute']('popover', 'manual'));
  const _0x1c97aa = reviewElement('button', 'collaboration-chat-bubble');
  (_0x1c97aa['setAttribute']('aria-label', '展开协作聊天'),
    _0x1c97aa['append'](createContextMenuIcon('comment')));
  const _0xef9801 = reviewElement('span', 'collaboration-chat-badge');
  _0x1c97aa['append'](_0xef9801);
  const _0x194be2 = reviewElement('div', 'collaboration-chat-panel'),
    _0x3b92be = reviewElement('div', 'collaboration-chat-header');
  _0x3b92be['append'](reviewElement('strong', '', '协作聊天'));
  const _0x25f10c = reviewElement('span', 'collaboration-subtle');
  _0x3b92be['append'](_0x25f10c);
  const _0x1466ee = reviewElement('button', 'collaboration-button', '收起');
  _0x3b92be['append'](_0x1466ee);
  const _0x267ae1 = reviewElement('p', 'collaboration-chat-status');
  _0x267ae1['setAttribute']('role', 'status');
  const _0x103b2e = reviewElement('button', 'collaboration-button', '重新加载'),
    _0x331acc = reviewElement('div', 'collaboration-chat-messages');
  (_0x331acc['setAttribute']('aria-label', '聊天记录'),
    (_0x331acc['tabIndex'] = 0x0),
    (_0x331acc['dataset']['readonlyTextSelectionRoot'] = 'true'));
  const _0x3536c4 = reviewElement('button', 'collaboration-button', '加载更早消息');
  _0x331acc['append'](_0x3536c4);
  const _0x383814 = reviewElement('p', 'collaboration-subtle', '和成员聊聊，输入 @ 引用节点或提及成员');
  _0x331acc['append'](_0x383814);
  const _0x55d80c = reviewElement('form', 'collaboration-chat-composer'),
    _0x343a9a = reviewElement('div', 'collaboration-chat-refs'),
    _0x7423af = reviewElement('textarea', 'collaboration-input');
  ((_0x7423af['maxLength'] = 0x7d0),
    (_0x7423af['rows'] = 0x3),
    (_0x7423af['placeholder'] = '发送消息，@ 节点或成员'),
    _0x7423af['setAttribute']('aria-label', '聊天消息'));
  const _0x448a2f = reviewElement('div', 'collaboration-chat-picker');
  ((_0x448a2f['hidden'] = !![]), _0x448a2f['setAttribute']('aria-label', '引用节点或成员'));
  const _0x5e45d3 = reviewElement('div', 'collaboration-actions'),
    _0x9084d7 = reviewElement('button', 'collaboration-button', '@ 引用'),
    _0xa3f0e8 = reviewElement('button', 'collaboration-button', '加入所选节点'),
    _0x441b3b = reviewElement('button', 'collaboration-button\x20collaboration-primary', '发送');
  ((_0x441b3b['type'] = 'submit'),
    _0x5e45d3['append'](_0x9084d7, _0xa3f0e8, _0x441b3b),
    _0x55d80c['append'](_0x343a9a, _0x7423af, _0x448a2f, _0x5e45d3));
  const _0x1d3cb9 = reviewElement('div', 'collaboration-chat-resize');
  (_0x1d3cb9['setAttribute']('aria-label', '拖动调整聊天框大小'),
    _0x194be2['append'](_0x3b92be, _0x267ae1, _0x103b2e, _0x331acc, _0x55d80c, _0x1d3cb9),
    _0xf7a11c['append'](_0x1c97aa, _0x194be2),
    document['body']['append'](_0xf7a11c));
  const _0x389f27 = bindCollaborationChatPosition({
    root: _0xf7a11c,
    handles: [_0x3b92be, _0x1c97aa],
    resizeHandle: _0x1d3cb9,
  });
  let _0x4dc5cb = !![],
    _0x2ab25e = null,
    _0x3bdc4e = '',
    _0x4f1128 = ![];
  const _0x2069f3 = new Map(),
    _0x358ceb = createCollaborationChatState({
      getSession: _0x23ead6,
      onChange: _0x3b3d20,
      onMention(_0x32d088) {
        const _0x11d81d = _0x23ead6();
        showToast(_0x32d088['name'] + ' 在协作聊天中提到了你', 'ok', 0x1770, {
          onClick() {
            if (_0x4f1128 || _0x23ead6() !== _0x11d81d) return;
            _0x278de0();
            const _0x38575e = () => {
              if (_0x4f1128 || _0x23ead6() !== _0x11d81d || !_0x4dc5cb) return;
              const _0x1e3263 = _0x2069f3['get'](_0x32d088['id']);
              if (_0x1e3263)
                _0x331acc['scrollTop'] +=
                  _0x1e3263['getBoundingClientRect']()['top'] -
                  _0x331acc['getBoundingClientRect']()['top'] -
                  (_0x331acc['clientHeight'] - _0x1e3263['offsetHeight']) / 0x2;
            };
            (_0x38575e(),
              Promise['allSettled'](
                _0xf7a11c['getAnimations']()['map']((_0x5b7399) => _0x5b7399['finished']),
              )['then'](_0x38575e));
          },
        });
      },
    }),
    _0x20f67b = bindTextareaMentions({
      input: _0x7423af,
      trigger: _0x9084d7,
      menu: _0x448a2f,
      optionRole: 'button',
      getCandidates(_0x2127cd) {
        const _0x15c886 = (_0x409384) =>
          String(_0x409384)['toLocaleLowerCase']()['includes'](_0x2127cd['toLocaleLowerCase']());
        return [
          ...(_0x15c886('所有人') ? [{ id: '@all', kind: 'mentions', label: '@所有人' }] : []),
          ...(_0x2ab25e?.['state']['members'] || [])
            ['filter']((_0x518d26) => _0x15c886(_0x518d26['name']))
            ['map']((_0x1674e6) => ({
              id: _0x1674e6['id'],
              kind: 'mentions',
              label: '@' + _0x1674e6['name'],
              visual: reviewAvatar(_0x1674e6),
            })),
          ...Object['values'](_0x45dc5d['getStateRaw']()['nodes'])
            ['filter']((_0x2b98c1) => _0x15c886(_0x2b98c1['name'] || _0x2b98c1['id']))
            ['map']((_0x2c20d4) => ({
              id: _0x2c20d4['id'],
              kind: 'nodeIds',
              label: _0x2c20d4['name'] || _0x2c20d4['id'],
            })),
        ];
      },
      onSelect(_0x2d9b4e, _0x291cfd) {
        const _0x4befc0 = _0x358ceb['snapshot'](),
          _0x50144e = [
            ...new Set([
              ..._0x4befc0[_0x2d9b4e['kind']],
              ...(_0x2d9b4e['id'] === '@all'
                ? _0x2ab25e['state']['members']['map']((_0x4cff39) => _0x4cff39['id'])
                : [_0x2d9b4e['id']]),
            ]),
          ];
        if (_0x50144e['length'] > 0x14)
          return showToast('每条消息最多引用 20 个节点或提及 20 位成员', 'warn');
        const _0x446680 = _0x291cfd['typed']
          ? _0x4befc0['body']['slice'](0x0, _0x291cfd['start']) + _0x4befc0['body']['slice'](_0x291cfd['end'])
          : _0x4befc0['body'];
        (_0x358ceb['edit']({ [_0x2d9b4e['kind']]: _0x50144e, body: _0x446680 }),
          _0x7423af['setSelectionRange'](_0x291cfd['start'], _0x291cfd['start']));
      },
    });
  function _0x239a2d(_0x562be6) {
    if (!_0x45dc5d['getStateRaw']()['nodes'][_0x562be6]) return showToast('该节点已删除', 'ok');
    _0x5ef9dd(_0x562be6);
  }
  function _0x3b3d20(_0x2f4f8a) {
    if (_0x4f1128) return;
    const _0x3a23d5 = _0x23ead6();
    _0x3a23d5 !== _0x2ab25e &&
      ((_0x2ab25e = _0x3a23d5),
      _0x2069f3['clear'](),
      _0x331acc['replaceChildren'](_0x3536c4, _0x383814),
      (_0x3bdc4e = ''),
      _0x20f67b['close']());
    _0xf7a11c['hidden'] = !_0x2ab25e;
    if (!_0x2ab25e) {
      if (_0xf7a11c['matches'](':popover-open')) _0xf7a11c['hidePopover']();
      return;
    }
    if (!_0xf7a11c['matches'](':popover-open')) _0xf7a11c['showPopover']();
    (_0xf7a11c['classList']['toggle']('is-collapsed', !_0x4dc5cb),
      (_0x194be2['hidden'] = !_0x4dc5cb),
      (_0x1c97aa['hidden'] = _0x4dc5cb),
      (_0xef9801['hidden'] = !_0x2f4f8a['unread']),
      (_0xef9801['textContent'] = _0x2f4f8a['mentioned']
        ? '@'
        : String(Math['min'](_0x2f4f8a['unread'], 0x63))),
      _0x1c97aa['setAttribute'](
        'aria-label',
        _0x2f4f8a['unread']
          ? '展开协作聊天，' +
              _0x2f4f8a['unread'] +
              ' 条未读' +
              (_0x2f4f8a['mentioned'] ? '，有人提及你' : '')
          : '展开协作聊天',
      ),
      (_0x25f10c['textContent'] = (_0x2ab25e['state']['members']?.['length'] || 0x0) + '\x20位成员'),
      (_0x267ae1['textContent'] =
        _0x2f4f8a['error'] ||
        (_0x2f4f8a['sending']
          ? '正在发送…'
          : _0x2f4f8a['loading']
            ? '正在加载…'
            : _0x2ab25e['state']['status'] !== 'online'
              ? '连接未就绪，消息将在发送时尝试连接'
              : '')),
      (_0x267ae1['hidden'] = !_0x267ae1['textContent']),
      (_0x103b2e['hidden'] = !_0x2f4f8a['error'] || _0x2f4f8a['sending']),
      (_0x103b2e['disabled'] = _0x2f4f8a['loading']),
      (_0x441b3b['disabled'] =
        _0x2f4f8a['sending'] || (!_0x2f4f8a['body']['trim']() && !_0x2f4f8a['nodeIds']['length'])),
      _0x441b3b['setAttribute']('aria-busy', String(_0x2f4f8a['sending'])),
      reviewSendButton(_0x441b3b, _0x2f4f8a['sending']));
    for (const _0x3c0ca8 of [_0x7423af, _0x9084d7, _0xa3f0e8]) _0x3c0ca8['disabled'] = _0x2f4f8a['sending'];
    if (_0x7423af['value'] !== _0x2f4f8a['body']) _0x7423af['value'] = _0x2f4f8a['body'];
    const _0x5b9db2 = _0x331acc['scrollHeight'] - _0x331acc['scrollTop'] - _0x331acc['clientHeight'] < 0x28,
      _0x42953e = _0x331acc['scrollHeight'],
      _0xdcd314 = _0x331acc['scrollTop'],
      _0x3f29ad = _0x383814['nextSibling']?.['dataset']['messageId'],
      _0xc95860 = _0x3f29ad && _0x2f4f8a['messages'][0x0]?.['id'] !== _0x3f29ad;
    let _0x3d6b15 = _0x383814['nextSibling'];
    for (const _0x2443fb of _0x2f4f8a['messages']) {
      let _0x39dc70 = _0x2069f3['get'](_0x2443fb['id']);
      if (!_0x39dc70) {
        ((_0x39dc70 = reviewElement('article', 'collaboration-chat-message')),
          (_0x39dc70['dataset']['messageId'] = _0x2443fb['id']),
          _0x39dc70['classList']['toggle']('is-self', _0x2443fb['actor'] === _0x2ab25e['state']['actorId']),
          _0x39dc70['classList']['toggle'](
            'is-mentioned',
            _0x2443fb['mentions']['includes'](_0x2ab25e['state']['actorId']),
          ));
        const _0x2e712d = reviewElement('div', 'collaboration-chat-meta');
        (_0x2e712d['append'](
          reviewElement('strong', '', _0x2443fb['name']),
          reviewElement('time', '', reviewTime(_0x2443fb['created'])),
        ),
          (_0x2e712d['firstChild']['dataset']['memberId'] = _0x2443fb['actor']));
        const _0x3a1381 = reviewElement('div', 'collaboration-message-bubble');
        (_0x3a1381['append'](reviewElement('p', '', _0x2443fb['body'])),
          _0x39dc70['append'](
            reviewAvatar(
              _0x2ab25e['state']['members']?.['find'](
                (_0x129aa0) => _0x129aa0['id'] === _0x2443fb['actor'],
              ) || { id: _0x2443fb['actor'], name: _0x2443fb['name'] },
            ),
            _0x2e712d,
            _0x3a1381,
          ));
        for (const _0x3fff29 of _0x2443fb['mentions']) {
          const _0x5404c2 = reviewElement(
            'button',
            'collaboration-chat-mention',
            '@' +
              (_0x2ab25e['state']['members']?.['find']((_0x169b2f) => _0x169b2f['id'] === _0x3fff29)?.[
                'name'
              ] || '已离开的成员'),
          );
          ((_0x5404c2['dataset']['memberId'] = _0x3fff29),
            _0x5404c2['addEventListener']('click', () => {
              const _0x2fb465 = _0x358ceb['snapshot']();
              if (_0x2fb465['sending']) return;
              if (!_0x2ab25e?.['state']['members']?.['some']((_0x2034bc) => _0x2034bc['id'] === _0x3fff29))
                return showToast('该成员已离开房间', 'ok');
              const _0x55df19 = [...new Set([..._0x2fb465['mentions'], _0x3fff29])];
              if (_0x55df19['length'] > 0x14) return showToast('每条消息最多提及 20 位成员', 'warn');
              (_0x358ceb['edit']({ mentions: _0x55df19 }), _0x7423af['focus']({ preventScroll: !![] }));
            }),
            _0x3a1381['append'](_0x5404c2));
        }
        for (const _0xaf204a of _0x2443fb['nodes']) {
          const _0x248afb = reviewElement('button', 'collaboration-button collaboration-chat-node');
          ((_0x248afb['dataset']['nodeId'] = _0xaf204a['id']),
            (_0x248afb['dataset']['referenceName'] = _0xaf204a['name']),
            _0x248afb['addEventListener']('click', () => _0x239a2d(_0xaf204a['id'])),
            _0x3a1381['append'](_0x248afb));
        }
        _0x2069f3['set'](_0x2443fb['id'], _0x39dc70);
      }
      if (_0x39dc70 !== _0x3d6b15) _0x331acc['insertBefore'](_0x39dc70, _0x3d6b15);
      _0x3d6b15 = _0x39dc70['nextSibling'];
    }
    ((_0x383814['hidden'] = !!_0x2f4f8a['messages']['length']),
      (_0x3536c4['hidden'] = !_0x2f4f8a['hasMore']),
      (_0x3536c4['disabled'] = _0x2f4f8a['loading']));
    for (const _0x3fe493 of _0x331acc['querySelectorAll']('[data-member-id]'))
      colorMemberName(
        _0x3fe493,
        _0x2ab25e['state']['members']?.['find'](
          (_0x524e94) => _0x524e94['id'] === _0x3fe493['dataset']['memberId'],
        ) || { id: _0x3fe493['dataset']['memberId'] },
      );
    for (const _0x5d72e0 of _0x331acc['querySelectorAll']('[data-node-id]'))
      updateNodeReference(
        _0x5d72e0,
        _0x45dc5d['getStateRaw']()['nodes'][_0x5d72e0['dataset']['nodeId']],
        _0x5d72e0['dataset']['referenceName'],
        { compact: !![] },
      );
    if (_0xc95860) _0x331acc['scrollTop'] = _0xdcd314 + _0x331acc['scrollHeight'] - _0x42953e;
    else {
      if (_0x5b9db2) _0x331acc['scrollTop'] = _0x331acc['scrollHeight'];
    }
    const _0x3e141b = JSON['stringify']([
      _0x2f4f8a['nodeIds'],
      _0x2f4f8a['mentions'],
      _0x2f4f8a['sending'],
      _0x2f4f8a['nodeIds']['map']((_0x1ba3c0) => _0x45dc5d['getStateRaw']()['nodes'][_0x1ba3c0]?.['name']),
      _0x2ab25e['state']['members'],
    ]);
    if (_0x3e141b !== _0x3bdc4e) {
      ((_0x3bdc4e = _0x3e141b), _0x343a9a['replaceChildren']());
      for (const [_0x515840, _0x596dbc] of [
        ['nodeIds', _0x2f4f8a['nodeIds']],
        ['mentions', _0x2f4f8a['mentions']],
      ])
        for (const _0x2398b8 of _0x596dbc) {
          const _0x1a1ad4 = _0x45dc5d['getStateRaw']()['nodes'][_0x2398b8],
            _0x2e65ba =
              _0x515840 === 'nodeIds'
                ? _0x1a1ad4
                  ? _0x1a1ad4['name'] || _0x2398b8
                  : '已删除节点'
                : '@' +
                  (_0x2ab25e['state']['members']?.['find']((_0x5d0803) => _0x5d0803['id'] === _0x2398b8)?.[
                    'name'
                  ] || '已离开成员');
          if (_0x515840 === 'nodeIds') {
            const _0xcecb61 = reviewElement('span');
            ((_0xcecb61['dataset']['nodeId'] = _0x2398b8), _0x343a9a['append'](_0xcecb61));
          } else {
            const _0x35af84 = reviewElement('button', 'collaboration-button', _0x2e65ba + '\x20×');
            ((_0x35af84['disabled'] = _0x2f4f8a['sending']),
              _0x35af84['setAttribute']('aria-label', '移除引用 ' + _0x2e65ba),
              colorMemberName(
                _0x35af84,
                _0x2ab25e['state']['members']?.['find']((_0xee575e) => _0xee575e['id'] === _0x2398b8) || {
                  id: _0x2398b8,
                },
              ),
              _0x35af84['addEventListener']('click', () =>
                _0x358ceb['edit']({
                  mentions: _0x358ceb['snapshot']()['mentions']['filter'](
                    (_0x320e69) => _0x320e69 !== _0x2398b8,
                  ),
                }),
              ),
              _0x343a9a['append'](_0x35af84));
          }
        }
    }
    for (const _0x2032bb of _0x343a9a['querySelectorAll']('[data-node-id]')) {
      const _0x24b9d8 = _0x2032bb['dataset']['nodeId'];
      updateNodeReference(_0x2032bb, _0x45dc5d['getStateRaw']()['nodes'][_0x24b9d8], '已删除节点', {
        compact: !![],
        onOpen: () => _0x239a2d(_0x24b9d8),
        onRemove: () =>
          _0x358ceb['edit']({
            nodeIds: _0x358ceb['snapshot']()['nodeIds']['filter']((_0x483390) => _0x483390 !== _0x24b9d8),
          }),
      });
      for (const _0x1ed9a1 of _0x2032bb['querySelectorAll']('button'))
        _0x1ed9a1['disabled'] = _0x2f4f8a['sending'];
    }
    _0x389f27['place']();
  }
  function _0x11a778(_0x358c03) {
    if (_0x4dc5cb === _0x358c03) return;
    const _0x52454b = _0xf7a11c['getBoundingClientRect']();
    (_0xf7a11c['getAnimations']()['forEach']((_0x6c2e93) => _0x6c2e93['cancel']()),
      (_0x4dc5cb = _0x358c03),
      _0x20f67b['close'](),
      _0x358ceb['setVisible'](_0x358c03),
      _0x389f27['place']());
    const _0x2f7199 = _0xf7a11c['getBoundingClientRect']();
    !matchMedia('(prefers-reduced-motion: reduce)')['matches'] &&
      _0xf7a11c['animate'](
        [
          {
            width: _0x52454b['width'] + 'px',
            height: _0x52454b['height'] + 'px',
            borderRadius: _0x358c03 ? '24px' : '16px',
          },
          {
            width: _0x2f7199['width'] + 'px',
            height: _0x2f7199['height'] + 'px',
            borderRadius: _0x358c03 ? '16px' : '24px',
          },
        ],
        { duration: 0xdc, easing: 'cubic-bezier(.2,.8,.2,1)' },
      );
  }
  function _0x278de0() {
    (_0x11a778(!![]), _0x7423af['focus']({ preventScroll: !![] }));
  }
  function _0x433612() {
    (_0x11a778(![]), _0x1c97aa['focus']({ preventScroll: !![] }));
  }
  function _0x3937c0(_0x31e31d) {
    if (!_0x23ead6() || _0x358ceb['snapshot']()['sending']) return ![];
    const _0x2ac7c7 = [
      ...new Set([
        ..._0x358ceb['snapshot']()['nodeIds'],
        ..._0x31e31d['filter']((_0xed9879) => !!_0x45dc5d['getStateRaw']()['nodes'][_0xed9879]),
      ]),
    ];
    if (_0x2ac7c7['length'] > 0x14) return (showToast('每条消息最多引用 20 个节点，请分批发送', 'warn'), ![]);
    return (_0x358ceb['edit']({ nodeIds: _0x2ac7c7 }), _0x278de0(), !![]);
  }
  (_0x7423af['addEventListener']('input', () => _0x358ceb['edit']({ body: _0x7423af['value'] })),
    _0x7423af['addEventListener']('keydown', (_0x160b0d) => {
      if (_0x160b0d['isComposing']) return;
      _0x160b0d['key'] === 'Enter' &&
        !_0x160b0d['shiftKey'] &&
        (_0x160b0d['preventDefault'](), void _0x358ceb['send']());
    }),
    _0xf7a11c['addEventListener']('keydown', (_0x42c204) => {
      if (_0x42c204['key'] === 'Escape') {
        (_0x42c204['preventDefault'](), _0x42c204['stopPropagation']());
        if (_0x20f67b['isOpen']()) (_0x20f67b['close'](), _0x7423af['focus']());
        else _0x433612();
      }
    }),
    _0x55d80c['addEventListener']('submit', (_0x58024e) => {
      (_0x58024e['preventDefault'](), _0x20f67b['close'](), void _0x358ceb['send']());
    }),
    _0xa3f0e8['addEventListener']('click', () =>
      _0x3937c0([...(_0x45dc5d['getStateRaw']()['selectedNodeIds'] || [])]),
    ),
    _0x1c97aa['addEventListener']('click', _0x278de0),
    _0x1466ee['addEventListener']('click', _0x433612),
    _0x3536c4['addEventListener']('click', () => void _0x358ceb['older']()),
    _0x103b2e['addEventListener']('click', () => void _0x358ceb['refresh']()));
  const _0x2d3efd = _0x45dc5d['subscribeSelector'](
    (_0x3eca3b) => _0x3eca3b['_nodesRev'],
    () => _0x3b3d20(_0x358ceb['snapshot']()),
  );
  return (
    _0x358ceb['setVisible'](!![]),
    {
      update: _0x358ceb['sync'],
      addNodes: _0x3937c0,
      isOpen: () => !!_0x23ead6() && _0x4dc5cb,
      root: _0xf7a11c,
      destroy() {
        ((_0x4f1128 = !![]),
          _0x20f67b['destroy'](),
          _0x358ceb['destroy'](),
          _0x2d3efd(),
          _0x389f27['destroy'](),
          _0xf7a11c['remove']());
      },
    }
  );
}
