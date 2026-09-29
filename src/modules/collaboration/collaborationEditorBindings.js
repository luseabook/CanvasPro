import { NODE_EDITOR_COMMIT_EVENT } from '../../core/nodeEditorCommit.js';
export function bindCollaborationEditors({
  store: _0x52c3de,
  documentObject: documentObject = document,
  windowObject: windowObject = window,
}) {
  const _0x411c26 = new Map();
  let _0x4c494c = ![],
    _0x28ffe2 = ![];
  const _0x35d759 = (_0x1bdb23) => ('value' in _0x1bdb23 ? _0x1bdb23['value'] : _0x1bdb23['innerHTML']),
    _0x2a6c64 = (_0x34cd5e) => {
      if (
        !_0x34cd5e['changed'] ||
        _0x52c3de['getGraphMutationPolicy']?.() !== _0x34cd5e['policy'] ||
        _0x35d759(_0x34cd5e['target']) !== _0x34cd5e['draft']
      )
        return;
      if ('value' in _0x34cd5e['target']) _0x34cd5e['target']['value'] = _0x34cd5e['before'];
      else _0x34cd5e['target']['innerHTML'] = _0x34cd5e['before'];
    };
  function _0xa4d700(_0x32afd8, _0x1ae94b) {
    _0x4c494c = !![];
    try {
      _0x32afd8['dispatchEvent'](
        _0x1ae94b === 'input'
          ? new windowObject['InputEvent']('input', { bubbles: !![], inputType: 'insertText' })
          : new windowObject['Event'](_0x1ae94b, { bubbles: _0x1ae94b === 'change' }),
      );
    } finally {
      _0x4c494c = ![];
    }
  }
  function _0x52508e(_0x198691, _0x44b89c = ![]) {
    if (_0x411c26['get'](_0x198691['target']) !== _0x198691) return;
    if (_0x44b89c) {
      _0x2a6c64(_0x198691);
      if (_0x198691['blurred'] && _0x198691['target']['isConnected']) _0xa4d700(_0x198691['target'], 'blur');
    }
    _0x411c26['delete'](_0x198691['target']);
    if (_0x198691['busy'] === null) _0x198691['target']['removeAttribute']('aria-busy');
    else _0x198691['target']['setAttribute']('aria-busy', _0x198691['busy']);
    queueMicrotask(() => _0x198691['handle']['finish']());
  }
  function _0x211486(_0x37e221) {
    if (
      _0x28ffe2 ||
      _0x411c26['get'](_0x37e221['target']) !== _0x37e221 ||
      _0x37e221['waiting'] ||
      _0x37e221['composing']
    )
      return;
    if (!_0x37e221['target']['isConnected'] || !_0x37e221['handle']['allowed']()) {
      _0x52508e(_0x37e221, !![]);
      return;
    }
    _0x37e221['target']['removeAttribute']('aria-busy');
    try {
      for (const _0x1c7eaf of _0x37e221['commits']['values']()) _0x1c7eaf();
      (_0x37e221['commits']['clear'](),
        _0x37e221['changed'] && ((_0x37e221['changed'] = ![]), _0xa4d700(_0x37e221['target'], 'input')),
        _0x37e221['change'] && ((_0x37e221['change'] = ![]), _0xa4d700(_0x37e221['target'], 'change')),
        (_0x37e221['before'] = _0x35d759(_0x37e221['target'])),
        _0x37e221['blurred'] && (_0xa4d700(_0x37e221['target'], 'blur'), _0x52508e(_0x37e221)));
    } catch (_0x47c0cc) {
      (_0x52508e(_0x37e221, !![]),
        windowObject['showToast']?.(_0x47c0cc['message'] || '节点暂时无法编辑', 'warning'));
    }
  }
  function _0x14311e(_0x3637f1) {
    if (_0x4c494c || _0x28ffe2) return;
    const _0x352391 = _0x3637f1['target'];
    if (
      !_0x352391['matches']?.(
        'textarea,\x20input:not([type=\x22file\x22]):not([type=\x22button\x22]):not([type=\x22submit\x22]),\x20[contenteditable=\x22true\x22]',
      ) ||
      _0x352391['readOnly'] ||
      _0x352391['disabled']
    )
      return;
    const _0x39f930 = _0x352391['closest']('[data-node-id]')?.['dataset']['nodeId'];
    if (!_0x39f930 || !_0x52c3de['getStateRaw']()['nodes'][_0x39f930]) return;
    const _0x5083ba = _0x411c26['get'](_0x352391);
    if (_0x5083ba && (_0x5083ba['waiting'] || _0x5083ba['handle']['allowed']()))
      return ((_0x5083ba['blurred'] = ![]), _0x5083ba);
    if (_0x5083ba) _0x52508e(_0x5083ba, !![]);
    const _0x4d19ba = _0x52c3de['getGraphMutationPolicy']?.(),
      _0x2916b9 = _0x4d19ba?.['beginInteraction']?.([_0x39f930]);
    if (!_0x2916b9) return;
    const _0x191924 = {
      target: _0x352391,
      handle: _0x2916b9,
      policy: _0x4d19ba,
      before: _0x35d759(_0x352391),
      busy: _0x352391['getAttribute']('aria-busy'),
      commits: new Map(),
      changed: ![],
      composing: ![],
      blurred: ![],
      waiting: !_0x2916b9['ready'],
    };
    _0x411c26['set'](_0x352391, _0x191924);
    if (_0x191924['waiting']) _0x352391['setAttribute']('aria-busy', 'true');
    return (
      void _0x2916b9['wait']['then'](
        () => {
          ((_0x191924['waiting'] = ![]), _0x211486(_0x191924));
        },
        () => _0x52508e(_0x191924, !![]),
      ),
      _0x191924
    );
  }
  function _0x442305(_0x10dba8) {
    if (_0x4c494c) return;
    const _0xeca5de = _0x14311e(_0x10dba8);
    if (_0xeca5de && !_0xeca5de['waiting'] && !_0xeca5de['handle']['allowed']())
      _0x10dba8['preventDefault']();
  }
  function _0x1502cc(_0x537dd0) {
    if (_0x4c494c) return;
    const _0x1ad9bc = _0x411c26['get'](_0x537dd0['target']);
    if (!_0x1ad9bc) return;
    if (_0x1ad9bc['waiting'] || _0x1ad9bc['composing'] || !_0x1ad9bc['handle']['allowed']()) {
      ((_0x1ad9bc['changed'] = !![]), (_0x1ad9bc['draft'] = _0x35d759(_0x1ad9bc['target'])));
      if (_0x537dd0['type'] === 'change') _0x1ad9bc['change'] = !![];
      _0x537dd0['stopImmediatePropagation']();
    } else _0x1ad9bc['before'] = _0x35d759(_0x1ad9bc['target']);
  }
  function _0x2a895f(_0x174ba3) {
    if (_0x4c494c) return;
    const _0x1e76fe = _0x411c26['get'](_0x174ba3['target']);
    if (!_0x1e76fe) return;
    if (_0x1e76fe['waiting'] || _0x1e76fe['composing'])
      ((_0x1e76fe['blurred'] = !![]), _0x174ba3['stopImmediatePropagation']());
    else _0x52508e(_0x1e76fe);
  }
  function _0x4e02be(_0x4ec056) {
    const _0x404322 =
      _0x4ec056['type'] === 'compositionstart' ? _0x14311e(_0x4ec056) : _0x411c26['get'](_0x4ec056['target']);
    if (!_0x404322) return;
    _0x404322['composing'] = _0x4ec056['type'] === 'compositionstart';
    if (!_0x404322['composing']) queueMicrotask(() => _0x211486(_0x404322));
  }
  function _0x3992fd(_0xfaf423) {
    const _0x576b88 = _0x411c26['get'](_0xfaf423['target']);
    if (!_0x576b88 || (!_0x576b88['waiting'] && !_0x576b88['composing'] && _0x576b88['handle']['allowed']()))
      return;
    (_0xfaf423['preventDefault'](),
      (_0x576b88['changed'] = !![]),
      (_0x576b88['draft'] = _0x35d759(_0x576b88['target'])));
    if (typeof _0xfaf423['detail']?.['commit'] === 'function')
      _0x576b88['commits']['set'](_0xfaf423['detail']['key'], _0xfaf423['detail']['commit']);
  }
  const _0x22e112 = {
      focusin: _0x14311e,
      keydown: _0x14311e,
      paste: _0x14311e,
      cut: _0x14311e,
      beforeinput: _0x442305,
      input: _0x1502cc,
      change: _0x1502cc,
      blur: _0x2a895f,
      compositionstart: _0x4e02be,
      compositionend: _0x4e02be,
      [NODE_EDITOR_COMMIT_EVENT]: _0x3992fd,
    },
    _0x233b8f = new windowObject['MutationObserver'](() => {
      for (const _0x51e1e9 of _0x411c26['values']())
        if (!_0x51e1e9['target']['isConnected']) _0x52508e(_0x51e1e9, !![]);
    });
  _0x233b8f['observe'](documentObject['body'], { childList: !![], subtree: !![] });
  for (const [_0x257a48, _0x21e797] of Object['entries'](_0x22e112))
    documentObject['addEventListener'](_0x257a48, _0x21e797, !![]);
  const _0xe4cf1e = () => {
    for (const _0x3989b9 of _0x411c26['values']()) {
      (_0x3989b9['target']['blur'](), _0x52508e(_0x3989b9, _0x3989b9['waiting'] || _0x3989b9['composing']));
    }
  };
  return (
    windowObject['addEventListener']('blur', _0xe4cf1e),
    () => {
      ((_0x28ffe2 = !![]), _0x233b8f['disconnect']());
      for (const _0x5013d4 of _0x411c26['values']()) _0x52508e(_0x5013d4, !![]);
      for (const [_0x491ef6, _0x4b1272] of Object['entries'](_0x22e112))
        documentObject['removeEventListener'](_0x491ef6, _0x4b1272, !![]);
      windowObject['removeEventListener']('blur', _0xe4cf1e);
    }
  );
}
