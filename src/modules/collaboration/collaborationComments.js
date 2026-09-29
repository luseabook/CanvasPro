import { beginModalInteraction } from '../../services/modalInteractionScope.js';
import { bindTextareaMentions } from '../../components/shared/textareaMentions.js';
import { reviewElement, reviewSendButton } from './collaborationReviewDom.js';
import { renderCommentThreads } from './collaborationCommentThreads.js';
import { updateNodeReference } from './collaborationNodeReference.js';
export function createCollaborationComments({ store: _0x941af3, getSession: _0xaa2891 }) {
  const _0x326b59 = reviewElement('div', 'collaboration-comments');
  (_0x326b59['setAttribute']('popover', 'manual'),
    _0x326b59['setAttribute']('role', 'dialog'),
    _0x326b59['setAttribute']('aria-label', '节点评论'));
  const _0x43ecaf = reviewElement('div', 'collaboration-heading'),
    _0x482fe0 = reviewElement('h3', '', '节点评论'),
    _0xda53cf = reviewElement('button', 'collaboration-button', '关闭');
  _0x43ecaf['append'](_0x482fe0, _0xda53cf);
  const _0x2bc8d4 = reviewElement('div', 'collaboration-comment-node-preview'),
    _0xa8f36e = reviewElement('p', 'collaboration-feedback');
  _0xa8f36e['setAttribute']('role', 'status');
  const _0x205a81 = reviewElement('div', 'collaboration-comment-list');
  _0x205a81['setAttribute']('aria-label', '评论内容');
  const _0x1ff332 = reviewElement('button', 'collaboration-button', '重新加载评论');
  _0x1ff332['hidden'] = !![];
  const _0x38d78d = reviewElement('form', 'collaboration-comment-composer'),
    _0x2d045c = reviewElement('div', 'collaboration-actions'),
    _0x4f6a60 = reviewElement('span'),
    _0x237f37 = reviewElement('button', 'collaboration-button', '取消回复');
  (_0x2d045c['append'](_0x4f6a60, _0x237f37), (_0x2d045c['hidden'] = !![]));
  const _0x4cbe2a = reviewElement('textarea', 'collaboration-input');
  ((_0x4cbe2a['maxLength'] = 0x7d0),
    (_0x4cbe2a['rows'] = 0x3),
    _0x4cbe2a['setAttribute']('aria-label', '评论内容输入'),
    (_0x4cbe2a['placeholder'] = '写下建议，可 @成员'));
  const _0x138686 = reviewElement('div', 'collaboration-actions'),
    _0x2a2638 = reviewElement('button', 'collaboration-button', '@成员');
  (_0x2a2638['setAttribute']('aria-label', '提及成员'), _0x138686['append'](_0x2a2638));
  const _0x23fbc6 = reviewElement('div');
  _0x23fbc6['setAttribute']('aria-label', '提及成员');
  const _0x3df55c = reviewElement('button', 'collaboration-button\x20collaboration-primary', '发送');
  ((_0x3df55c['type'] = 'submit'),
    reviewSendButton(_0x3df55c),
    _0x138686['append'](_0x3df55c),
    _0x38d78d['append'](_0x2d045c, _0x4cbe2a, _0x138686),
    _0x326b59['append'](_0x43ecaf, _0x2bc8d4, _0xa8f36e, _0x1ff332, _0x205a81, _0x38d78d, _0x23fbc6),
    document['body']['append'](_0x326b59));
  const _0xc1a6d4 = bindTextareaMentions({
    input: _0x4cbe2a,
    trigger: _0x2a2638,
    menu: _0x23fbc6,
    getCandidates(_0x4301df) {
      return [{ id: '@all', name: '所有人' }, ...(_0x43b508?.['state']['members'] || [])]
        ['filter']((_0x6ab489) =>
          _0x6ab489['name']['toLocaleLowerCase']()['includes'](_0x4301df['toLocaleLowerCase']()),
        )
        ['map']((_0x285d1c) => ({
          id: _0x285d1c['id'],
          name: _0x285d1c['name'],
          label: _0x285d1c['id'] === '@all' ? '@所有人' : _0x285d1c['name'],
        }));
    },
    onSelect(_0x3de3f2, { start: _0x2934e3, end: _0x13e0a2 }) {
      if (_0x1ddcf1 || !_0x3caa24) return;
      const _0x530c8c = '@' + _0x3de3f2['name'] + '\x20';
      if (_0x4cbe2a['value']['length'] - (_0x13e0a2 - _0x2934e3) + _0x530c8c['length'] > 0x7d0) return;
      (_0x4cbe2a['setRangeText'](_0x530c8c, _0x2934e3, _0x13e0a2, 'end'),
        (_0x3caa24['mentions'][_0x3de3f2['id']] = _0x3de3f2['name']),
        _0x3ba179());
    },
  });
  let _0x43b508 = null,
    _0x460f63 = '',
    _0x45dd90 = 0x0,
    _0xa3195 = -0x1,
    _0x95362f = ![],
    _0x1ddcf1 = ![],
    _0x3b505e = [],
    _0x52e4fa = '',
    _0x16a5f7 = () => {},
    _0x4c24a2 = null,
    _0x3caa24 = null,
    _0x4e1404 = -0x1,
    _0x51b37e = { x: 0x0, y: 0x0 },
    _0x1bd25e = !![];
  const _0x33fc0e = new Map(),
    _0x1fdd48 = () => !!_0x460f63 && _0x326b59['matches'](':popover-open');
  function _0x7d0062(_0x20a174) {
    return _0x20a174 === _0x45dd90 && _0x1fdd48() && _0xaa2891() === _0x43b508;
  }
  function _0x3ba179() {
    _0x3caa24 && ((_0x3caa24['body'] = _0x4cbe2a['value']), (_0x3caa24['requestId'] = null));
  }
  function _0x26ffd5() {
    ((_0x4cbe2a['value'] = _0x3caa24['body']),
      (_0x2d045c['hidden'] = !_0x3caa24['threadId']),
      (_0x4f6a60['textContent'] = _0x3caa24['threadId'] ? '回复 ' + _0x3caa24['replyName'] : ''));
  }
  function _0x140f63(_0x546dd2 = !![]) {
    (_0x45dd90++, _0xc1a6d4['close'](), _0x16a5f7({ restoreFocus: _0x546dd2 }), (_0x16a5f7 = () => {}));
    if (_0x326b59['matches'](':popover-open')) _0x326b59['hidePopover']();
    ((_0x460f63 = ''), (_0x95362f = ![]), (_0x1ddcf1 = ![]));
  }
  function _0x550476(_0x52d03f = _0x51b37e) {
    ((_0x51b37e = { x: _0x52d03f['x'], y: _0x52d03f['y'] }),
      _0x326b59['style']['setProperty'](
        '--comment-left',
        Math['max'](
          0x8,
          Math['min'](_0x52d03f['x'] + 0xa, window['innerWidth'] - _0x326b59['offsetWidth'] - 0x8),
        ) + 'px',
      ),
      _0x326b59['style']['setProperty'](
        '--comment-top',
        Math['max'](
          0x8,
          Math['min'](_0x52d03f['y'], window['innerHeight'] - _0x326b59['offsetHeight'] - 0x8),
        ) + 'px',
      ));
  }
  function _0x35742d() {
    const _0x3e0e66 =
        _0x1bd25e || _0x205a81['scrollHeight'] - _0x205a81['clientHeight'] - _0x205a81['scrollTop'] < 0x28,
      _0x3c22b9 = JSON['stringify']([_0x3b505e, _0x43b508['state']['members'], _0x43b508['state']['role']]);
    _0x3c22b9 !== _0x52e4fa &&
      ((_0x52e4fa = _0x3c22b9),
      renderCommentThreads({
        list: _0x205a81,
        comments: _0x3b505e,
        session: _0x43b508,
        reply(_0x515dcb) {
          if (_0x1ddcf1) return;
          ((_0x3caa24['threadId'] = _0x515dcb['id']),
            (_0x3caa24['replyName'] =
              _0x43b508['state']['members']['find']((_0x3f2792) => _0x3f2792['id'] === _0x515dcb['actor'])?.[
                'name'
              ] || _0x515dcb['name']),
            (_0x3caa24['requestId'] = null),
            _0x26ffd5(),
            _0x4cbe2a['focus']());
        },
        resolve(_0x513241, _0x27f888) {
          void _0x5ad080(_0x27f888, () =>
            _0x43b508['review']['write']('commentResolve', {
              nodeId: _0x460f63,
              threadId: _0x513241['id'],
              resolved: !_0x513241['resolved'],
            }),
          );
        },
      }));
    _0x550476();
    if (_0x3e0e66) _0x205a81['scrollTop'] = _0x205a81['scrollHeight'];
  }
  async function _0x7d7de3() {
    if (!_0x1fdd48() || _0x95362f || !_0x43b508?.['review']) return;
    const _0x2b2e43 = _0x45dd90,
      _0x5bc4a9 = _0x460f63,
      _0x5b47ce = _0x43b508;
    ((_0x95362f = !![]), (_0x1ff332['hidden'] = !![]));
    !_0x1ddcf1 && ((_0xa8f36e['textContent'] = '正在加载评论…'), _0xa8f36e['classList']['add']('is-pending'));
    try {
      const _0x51ebaf = await _0x5b47ce['review']['readNode'](_0x5bc4a9);
      if (!_0x7d0062(_0x2b2e43)) return;
      ((_0x3b505e = _0x51ebaf['comments']), (_0xa3195 = _0x51ebaf['revision']));
      if (!_0x1ddcf1) _0xa8f36e['textContent'] = '';
      (_0x35742d(), (_0x1bd25e = ![]));
    } catch (_0x363367) {
      _0x7d0062(_0x2b2e43) &&
        ((_0xa8f36e['textContent'] = _0x363367['message']), (_0x1ff332['hidden'] = ![]));
    } finally {
      if (_0x7d0062(_0x2b2e43)) {
        _0x95362f = ![];
        if (!_0x1ddcf1) _0xa8f36e['classList']['remove']('is-pending');
        if (_0x1ff332['hidden'] && _0xa3195 < _0x43b508['review']['snapshot']()['revision']) void _0x7d7de3();
      }
    }
  }
  async function _0x5ad080(_0x1b74c7, _0x5f13e6) {
    if (_0x1ddcf1 || !_0x1fdd48()) return;
    const _0x53bc48 = _0x45dd90;
    ((_0x1ddcf1 = !![]),
      (_0x1b74c7['disabled'] = !![]),
      _0x1b74c7['setAttribute']('aria-busy', 'true'),
      _0xc1a6d4['close'](),
      (_0x4cbe2a['disabled'] = !![]),
      (_0x3df55c['disabled'] = !![]),
      (_0x2a2638['disabled'] = !![]),
      (_0xa8f36e['textContent'] = '正在保存评论…'),
      _0xa8f36e['classList']['add']('is-pending'));
    try {
      await _0x5f13e6();
      if (_0x7d0062(_0x53bc48)) {
        (_0x26ffd5(), await _0x7d7de3());
        if (_0x7d0062(_0x53bc48) && _0x1ff332['hidden']) _0xa8f36e['textContent'] = '已保存';
      }
    } catch (_0x4b5ea8) {
      if (_0x7d0062(_0x53bc48)) _0xa8f36e['textContent'] = _0x4b5ea8['message'] || '保存失败，请重试';
    } finally {
      _0x7d0062(_0x53bc48) &&
        ((_0x1ddcf1 = ![]),
        (_0x1b74c7['disabled'] = ![]),
        _0x1b74c7['removeAttribute']('aria-busy'),
        (_0x4cbe2a['disabled'] = !_0x941af3['getStateRaw']()['nodes'][_0x460f63]),
        (_0x3df55c['disabled'] = _0x4cbe2a['disabled']),
        (_0x2a2638['disabled'] = _0x4cbe2a['disabled']),
        _0xa8f36e['classList']['remove']('is-pending'));
    }
  }
  (_0x4cbe2a['addEventListener']('input', _0x3ba179),
    _0x4cbe2a['addEventListener']('keydown', (_0x157c6f) => {
      _0x157c6f['key'] === 'Enter' &&
        !_0x157c6f['shiftKey'] &&
        !_0x157c6f['isComposing'] &&
        (_0x157c6f['preventDefault'](), _0x38d78d['requestSubmit']());
    }),
    _0x237f37['addEventListener']('click', () => {
      if (_0x1ddcf1) return;
      ((_0x3caa24['threadId'] = ''), (_0x3caa24['requestId'] = null), _0x26ffd5(), _0x4cbe2a['focus']());
    }),
    _0x38d78d['addEventListener']('submit', (_0x586e97) => {
      _0x586e97['preventDefault']();
      if (!_0x3caa24['body']['trim']() || _0x1ddcf1) return;
      const _0x26d658 = _0x43b508,
        _0x5dbf69 = _0x460f63,
        _0x1bab07 = _0x3caa24,
        _0x2e0588 = (_0x1bab07['requestId'] ||= crypto['randomUUID']()),
        _0x3e353a = {
          nodeId: _0x5dbf69,
          commentId: _0x2e0588,
          body: _0x1bab07['body'],
          threadId: _0x1bab07['threadId'],
          mentions: [
            ...new Set(
              Object['entries'](_0x1bab07['mentions'])
                ['filter'](([, _0x3a46d3]) => _0x1bab07['body']['includes']('@' + _0x3a46d3))
                ['flatMap'](([_0xd9f468]) =>
                  _0xd9f468 === '@all'
                    ? _0x26d658['state']['members']['map']((_0x5ceea9) => _0x5ceea9['id'])
                    : [_0xd9f468],
                ),
            ),
          ],
        };
      void _0x5ad080(_0x3df55c, async () => {
        await _0x26d658['review']['write']('commentAdd', _0x3e353a);
        if (_0x26d658 === _0x43b508 && _0x5dbf69 === _0x460f63) _0x1bd25e = !![];
        if (_0x1bab07['requestId'] === _0x2e0588)
          Object['assign'](_0x1bab07, { body: '', threadId: '', mentions: {}, requestId: null });
      });
    }),
    _0x1ff332['addEventListener']('click', () => void _0x7d7de3()),
    _0xda53cf['addEventListener']('click', () => _0x140f63()));
  const _0x31243a = (_0x168b55) => {
    if (
      _0x1fdd48() &&
      !_0x326b59['contains'](_0x168b55['target']) &&
      !_0x4c24a2?.['contains'](_0x168b55['target'])
    )
      _0x140f63(![]);
  };
  document['addEventListener']('pointerdown', _0x31243a, !![]);
  function _0x5d9bd3() {
    _0xaa2891() !== _0x43b508 &&
      (_0x140f63(![]), (_0x43b508 = _0xaa2891()), _0x33fc0e['clear'](), (_0x4e1404 = -0x1));
    if (!_0x1fdd48()) return;
    const _0x24dec0 = _0x941af3['getStateRaw']()['nodes'][_0x460f63];
    (updateNodeReference(_0x2bc8d4, _0x24dec0, _0x460f63),
      (_0x482fe0['textContent'] = _0x24dec0
        ? (_0x24dec0['name'] || _0x460f63) + ' · 评论'
        : '节点已删除 · 评论'));
    if (!_0x1ddcf1) _0x4cbe2a['disabled'] = _0x3df55c['disabled'] = _0x2a2638['disabled'] = !_0x24dec0;
    const _0x13fbd9 = JSON['stringify'](
      _0x43b508['state']['members']['map']((_0x2290e3) => [_0x2290e3['id'], _0x2290e3['name']]),
    );
    _0x23fbc6['dataset']['members'] !== _0x13fbd9 &&
      ((_0x23fbc6['dataset']['members'] = _0x13fbd9), _0xc1a6d4['refresh']());
    const _0x5c3dd9 = _0x43b508['review']['snapshot']()['revision'];
    if (_0x5c3dd9 !== _0x4e1404) {
      _0x4e1404 = _0x5c3dd9;
      if (_0x5c3dd9 > _0xa3195) void _0x7d7de3();
    }
    _0x35742d();
  }
  return {
    open(_0x496e77, _0xc7844) {
      _0x140f63(![]);
      if (_0x43b508 !== _0xaa2891()) _0x33fc0e['clear']();
      _0x43b508 = _0xaa2891();
      if (!_0x43b508?.['review']) return;
      ((_0x460f63 = _0x496e77),
        (_0x4c24a2 = _0xc7844),
        (_0xa3195 = -0x1),
        (_0x4e1404 = -0x1),
        (_0x3b505e = []),
        (_0x52e4fa = ''),
        (_0x1bd25e = !![]));
      if (!_0x33fc0e['has'](_0x496e77))
        _0x33fc0e['set'](_0x496e77, { body: '', threadId: '', mentions: {}, requestId: null });
      ((_0x3caa24 = _0x33fc0e['get'](_0x496e77)),
        _0x26ffd5(),
        _0x3df55c['removeAttribute']('aria-busy'),
        _0xa8f36e['classList']['remove']('is-pending'),
        _0x326b59['showPopover']());
      if (_0xc7844) {
        const _0x5208b5 = _0xc7844['getBoundingClientRect']();
        _0x550476({ x: _0x5208b5['right'], y: _0x5208b5['bottom'] });
      } else _0x550476({ x: window['innerWidth'] / 0x2, y: window['innerHeight'] / 0x3 });
      ((_0x16a5f7 = beginModalInteraction({
        root: _0x326b59,
        onClose: _0x140f63,
        returnFocus: _0xc7844,
        preferredSelector: 'textarea',
      })),
        _0x5d9bd3(),
        void _0x7d7de3());
    },
    update: _0x5d9bd3,
    position: _0x550476,
    nodeId: () => _0x460f63,
    destroy() {
      (_0x140f63(![]),
        _0xc1a6d4['destroy'](),
        _0x326b59['remove'](),
        document['removeEventListener']('pointerdown', _0x31243a, !![]));
    },
  };
}
