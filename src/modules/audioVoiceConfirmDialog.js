let audioVoiceConfirmSequence = 0x0;
function createElement(_0x5e2f85, _0x3814f6, _0x3902a0 = '', _0x527c27 = '') {
  const _0x5f32d6 = _0x5e2f85['createElement'](_0x3814f6);
  if (_0x3902a0) _0x5f32d6['className'] = _0x3902a0;
  if (_0x527c27) _0x5f32d6['textContent'] = _0x527c27;
  return _0x5f32d6;
}
export function createAudioVoiceConfirmDialog({
  root: _0x415314,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
} = {}) {
  let _0x4e6c91 = null;
  const _0x32b187 = (_0x102aaa = ![]) => {
      const _0x39fdf3 = _0x4e6c91;
      if (!_0x39fdf3) return;
      ((_0x4e6c91 = null),
        documentObject?.['removeEventListener']?.('keydown', _0x39fdf3['handleKeydown'], !![]),
        _0x39fdf3['overlay']?.['remove']?.(),
        _0x39fdf3['resolve']?.(_0x102aaa === !![]),
        _0x39fdf3['returnFocus']?.['focus']?.());
    },
    _0x2b90dc = ({
      className: className = '',
      title: title = '',
      message: message = '',
      cancelLabel: cancelLabel = '取消',
      confirmLabel: confirmLabel = '确定',
      returnFocus: _0x2494aa,
    } = {}) => {
      _0x32b187(![]);
      const _0x4b53f2 = documentObject?.['body'] || _0x415314;
      if (!_0x4b53f2 || typeof documentObject?.['createElement'] !== 'function')
        return Promise['resolve'](![]);
      return new Promise((_0x936eae) => {
        const _0x3a33b = createElement(
            documentObject,
            'div',
            ('custom-confirm-overlay ' + className)['trim'](),
          ),
          _0x3b3dbe = createElement(documentObject, 'div', 'custom-confirm-box'),
          _0x72d6bb = ++audioVoiceConfirmSequence,
          _0x25d4b8 = 'audio-voice-action-confirm-title-' + _0x72d6bb,
          _0x300753 = 'audio-voice-action-confirm-message-' + _0x72d6bb;
        (_0x3b3dbe['setAttribute']('role', 'dialog'),
          _0x3b3dbe['setAttribute']('aria-modal', 'true'),
          _0x3b3dbe['setAttribute']('aria-labelledby', _0x25d4b8),
          _0x3b3dbe['setAttribute']('aria-describedby', _0x300753));
        const _0x1d9924 = createElement(documentObject, 'div', 'confirm-title', title);
        _0x1d9924['id'] = _0x25d4b8;
        const _0x133018 = createElement(documentObject, 'div', 'confirm-msg', message);
        _0x133018['id'] = _0x300753;
        const _0x7f9f47 = createElement(documentObject, 'div', 'confirm-btns'),
          _0x219a6e = createElement(documentObject, 'button', 'confirm-btn confirm-cancel', cancelLabel);
        _0x219a6e['type'] = 'button';
        const _0x5bd50e = createElement(documentObject, 'button', 'confirm-btn confirm-ok', confirmLabel);
        ((_0x5bd50e['type'] = 'button'),
          _0x7f9f47['append'](_0x219a6e, _0x5bd50e),
          _0x3b3dbe['append'](_0x1d9924, _0x133018, _0x7f9f47),
          _0x3a33b['appendChild'](_0x3b3dbe));
        const _0x3bc07b = (_0x204d3e) => {
            if (_0x4e6c91?.['overlay'] !== _0x3a33b) return;
            _0x32b187(_0x204d3e);
          },
          _0x10643c = (_0x208bb3) => {
            if (_0x208bb3['key'] === 'Escape') (_0x208bb3['preventDefault']?.(), _0x3bc07b(![]));
            else _0x208bb3['key'] === 'Enter' && (_0x208bb3['preventDefault']?.(), _0x3bc07b(!![]));
          };
        ((_0x4e6c91 = {
          overlay: _0x3a33b,
          resolve: _0x936eae,
          returnFocus: _0x2494aa,
          handleKeydown: _0x10643c,
        }),
          _0x219a6e['addEventListener']('click', () => _0x3bc07b(![])),
          _0x5bd50e['addEventListener']('click', () => _0x3bc07b(!![])),
          _0x3a33b['addEventListener']('click', (_0x2a51a7) => {
            if (_0x2a51a7['target'] === _0x3a33b) _0x3bc07b(![]);
          }),
          documentObject?.['addEventListener']?.('keydown', _0x10643c, !![]),
          _0x4b53f2['appendChild'](_0x3a33b),
          windowObject?.['setTimeout']?.(() => _0x219a6e['focus']?.(), 0x0));
      });
    };
  return Object['freeze']({ confirm: _0x2b90dc, close: _0x32b187, destroy: () => _0x32b187(![]) });
}
