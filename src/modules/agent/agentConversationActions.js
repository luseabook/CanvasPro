import { getAgentEditableTurn, AGENT_REPLY_VERSION_LIMIT } from './agentReplyVersions.js';
import { agentConversationActionText } from './agentConversationActionText.js';
import { agentIconSvg } from './agentPanelElements.js';
export function createAgentConversationActions({
  messagesEl: _0x50b3bf,
  runtime: _0x405285,
  getBusy: _0x24ad09,
  setBusy: _0x35ed28,
  getPresentation: _0x21c6de,
  onResult: _0xc35622,
  setNotice: _0x3e9af4,
  replyActions: replyActions = [],
}) {
  let _0x286c3a = null,
    _0x3a8da2 = '';
  const _0x44d302 = (_0x42025c, _0x569062, _0x1fade8) => {
    const _0x2d152d = document['createElement']('button');
    return (
      (_0x2d152d['type'] = 'button'),
      (_0x2d152d['className'] = ('agent-message-action ' + (_0x1fade8 || ''))['trim']()),
      (_0x2d152d['textContent'] = _0x42025c),
      _0x2d152d['addEventListener']('click', (_0x115310) => {
        _0x115310['stopPropagation']();
        if (!_0x24ad09()) _0x569062();
      }),
      _0x2d152d
    );
  };
  function _0x1dc792() {
    (_0x286c3a?.['remove'](), (_0x286c3a = null));
  }
  async function _0x3c99ba(_0x499e00, _0x39a379) {
    if (_0x24ad09()) return;
    (_0x1dc792(), _0x3e9af4(''), _0x35ed28(!![], { stoppable: !![] }));
    const _0x3cac7e = _0x21c6de()['appendWaiting']();
    try {
      const _0x5d3f86 = await _0x405285['reviseAssistantTurn']({
        itemId: _0x499e00,
        ...(_0x39a379 === undefined ? {} : { message: _0x39a379 }),
      });
      _0xc35622(_0x5d3f86);
      if (_0x5d3f86?.['ok'] === ![] && !_0x5d3f86['stale']) _0x3e9af4(_0x5d3f86['reply']);
    } catch (_0x1bde25) {
      _0x3e9af4(_0x1bde25['message']);
    } finally {
      const _0x3b6e88 = Boolean(_0x3cac7e['parentNode']);
      _0x21c6de()['removeWaiting'](_0x3cac7e);
      if (_0x3b6e88) _0x35ed28(![]);
    }
  }
  function _0xe36320(_0xfdf66d, _0x5d118f) {
    (_0x1dc792(),
      (_0x286c3a = document['createElement']('div')),
      (_0x286c3a['className'] = 'agent-message-editor'));
    const _0x507637 = document['createElement']('textarea');
    ((_0x507637['className'] = 'agent-message-edit-input'),
      _0x507637['setAttribute']('aria-label', agentConversationActionText('edit')),
      (_0x507637['rows'] = 0x4),
      (_0x507637['value'] = _0xfdf66d['user']['content']));
    const _0x40c888 = _0x44d302(
      agentConversationActionText('save'),
      () => {
        if (_0x507637['value']['trim']()) void _0x3c99ba(_0xfdf66d['itemId'], _0x507637['value']['trim']());
      },
      'agent-message-edit-save',
    );
    (_0x507637['addEventListener']('input', () => {
      _0x40c888['disabled'] = !_0x507637['value']['trim']();
    }),
      _0x507637['addEventListener']('keydown', (_0x2cf9d2) => {
        _0x2cf9d2['stopPropagation']();
        if (_0x2cf9d2['key'] === 'Escape') _0x1dc792();
        if (
          (_0x2cf9d2['ctrlKey'] || _0x2cf9d2['metaKey']) &&
          _0x2cf9d2['key'] === 'Enter' &&
          !_0x2cf9d2['isComposing']
        )
          _0x40c888['click']();
      }),
      _0x286c3a['append'](_0x507637, _0x44d302(agentConversationActionText('cancel'), _0x1dc792), _0x40c888),
      _0x5d118f['append'](_0x286c3a),
      _0x507637['focus']());
  }
  function _0x151e9f() {
    if (typeof _0x405285['reviseAssistantTurn'] !== 'function') return;
    const _0x152357 = getAgentEditableTurn(_0x405285['sessionStore']['getHistory']()),
      _0x5c9217 = [..._0x50b3bf['querySelectorAll']('.agent-message:not(.agent-message--typing)')],
      _0x283979 = _0x152357?.['assistant']['replyVersions'],
      _0x3de3a5 = _0x152357
        ? _0x152357['itemId'] +
          ':' +
          (_0x283979?.['activeIndex'] || 0x0) +
          ':' +
          (_0x283979?.['versions']['length'] || 0x1) +
          ':' +
          agentConversationActionText('retry')
        : '',
      _0x4f6b7f = _0x50b3bf['querySelector']('.agent-message-actions');
    if (
      _0x3de3a5 === _0x3a8da2 &&
      _0x4f6b7f &&
      (!_0x152357 || _0x5c9217['length'] === _0x405285['sessionStore']['getHistory']()['length'])
    ) {
      _0x1e7fe0();
      return;
    }
    if (_0x24ad09() && _0x4f6b7f) {
      _0x1e7fe0();
      return;
    }
    (_0x1dc792(),
      _0x50b3bf['querySelectorAll']('.agent-message-actions')['forEach']((_0x4892bb) =>
        _0x4892bb['remove'](),
      ),
      (_0x3a8da2 = _0x3de3a5));
    if (!_0x152357 || _0x5c9217['length'] !== _0x405285['sessionStore']['getHistory']()['length']) return;
    const _0x39332c = _0x5c9217['at'](-0x2),
      _0x155c4d = _0x5c9217['at'](-0x1),
      _0x21216f = document['createElement']('div');
    _0x21216f['className'] = 'agent-message-actions';
    const _0x878883 = _0x44d302(
      agentConversationActionText('edit'),
      () => _0xe36320(_0x152357, _0x39332c),
      'agent-message-edit',
    );
    ((_0x878883['title'] = agentConversationActionText('edit')),
      _0x878883['setAttribute']('aria-label', agentConversationActionText('edit')),
      (_0x878883['innerHTML'] = agentIconSvg('edit')),
      _0x21216f['append'](_0x878883));
    const _0x3c12d8 = document['createElement']('div');
    ((_0x3c12d8['className'] = 'agent-message-actions'),
      _0x3c12d8['append'](
        _0x44d302(
          agentConversationActionText('retry'),
          () => void _0x3c99ba(_0x152357['itemId']),
          'agent-message-regenerate',
        ),
      ));
    if (_0x152357['assistant']['status'] === 'chat')
      replyActions['forEach']((_0xe9f45a) => {
        _0x3c12d8['append'](
          _0x44d302(
            _0xe9f45a['label'],
            () => {
              try {
                _0xe9f45a['apply'](_0x152357['assistant']['content']);
              } catch (_0x2b9f2e) {
                _0x3e9af4(_0x2b9f2e['message']);
              }
            },
            _0xe9f45a['className'],
          ),
        );
      });
    if (_0x283979?.['versions']['length'] > 0x1) {
      const _0x1353ee = _0x44d302(
          '‹',
          () =>
            _0xc35622(
              _0x405285['selectAssistantVersion']({
                itemId: _0x152357['itemId'],
                index: _0x283979['activeIndex'] - 0x1,
              }),
            ),
          'agent-message-version-prev',
        ),
        _0xf78665 = _0x44d302(
          '›',
          () =>
            _0xc35622(
              _0x405285['selectAssistantVersion']({
                itemId: _0x152357['itemId'],
                index: _0x283979['activeIndex'] + 0x1,
              }),
            ),
          'agent-message-version-next',
        );
      (_0x1353ee['setAttribute']('aria-label', agentConversationActionText('previous')),
        _0xf78665['setAttribute']('aria-label', agentConversationActionText('next')));
      const _0x37107c = document['createElement']('span');
      ((_0x37107c['className'] = 'agent-message-version-count'),
        _0x37107c['setAttribute']('aria-label', agentConversationActionText('version')),
        (_0x37107c['textContent'] = _0x283979['activeIndex'] + 0x1 + ' / ' + _0x283979['versions']['length']),
        _0x3c12d8['append'](_0x1353ee, _0x37107c, _0xf78665));
    }
    ((_0x39332c['querySelector']('.agent-message-footer') || _0x39332c)['append'](_0x21216f),
      _0x155c4d['append'](_0x3c12d8),
      _0x1e7fe0());
  }
  function _0x1e7fe0() {
    const _0x33631a = getAgentEditableTurn(_0x405285['sessionStore']['getHistory']())?.['assistant'][
      'replyVersions'
    ];
    _0x50b3bf['querySelectorAll']('.agent-message-action')['forEach']((_0x43695c) => {
      _0x43695c['disabled'] =
        _0x24ad09() ||
        (_0x43695c['classList']['contains']('agent-message-version-prev') && !_0x33631a?.['activeIndex']) ||
        (_0x43695c['classList']['contains']('agent-message-version-next') &&
          _0x33631a?.['activeIndex'] === _0x33631a?.['versions']['length'] - 0x1) ||
        ((_0x43695c['classList']['contains']('agent-message-regenerate') ||
          _0x43695c['classList']['contains']('agent-message-edit')) &&
          _0x33631a?.['versions']['length'] >= AGENT_REPLY_VERSION_LIMIT);
    });
  }
  return {
    render: _0x151e9f,
    setBusy() {
      if (_0x24ad09()) _0x1dc792();
      _0x151e9f();
    },
    destroy: _0x1dc792,
  };
}
