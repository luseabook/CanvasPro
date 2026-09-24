import { focusFirstElement, restoreFocus, trapTabKey } from '../utils/focusTrap.js';
const scopes = [];
export function hasActiveModalInteraction() {
  return scopes['some'](({ root: _0x41fad0 }) => _0x41fad0['isConnected'] !== ![]);
}
export function beginModalInteraction({
  root: _0x252e4f,
  onClose: _0x2fc2bf,
  onSuspend: _0x3c76c2,
  returnFocus: _0x34939f,
  preferredSelector: preferredSelector = '',
}) {
  if (!_0x252e4f) return () => {};
  const _0x1823bb = _0x252e4f['ownerDocument'] || globalThis['document'],
    _0x115a99 = _0x1823bb?.['defaultView'] || globalThis['window'],
    _0x784e71 = { root: _0x252e4f, onSuspend: _0x3c76c2 },
    _0x52a74a = _0x34939f || _0x1823bb?.['activeElement'],
    _0x385b88 = () => scopes['at'](-0x1) === _0x784e71,
    _0x514a3b = (_0x214ec5) => {
      if (!_0x385b88()) return;
      trapTabKey(_0x214ec5, _0x252e4f, _0x1823bb);
    },
    _0x42d9d9 = (_0x49e324) => {
      _0x385b88() &&
        !_0x252e4f['contains']?.(_0x49e324['target']) &&
        focusFirstElement(_0x252e4f, { preferredSelector: preferredSelector });
    },
    _0x507191 = (_0x195073) => {
      if (!_0x385b88()) return;
      (_0x195073['type'] === 'keydown' &&
        _0x195073['key'] === 'Escape' &&
        !_0x195073['isComposing'] &&
        !_0x195073['defaultPrevented'] &&
        (_0x195073['preventDefault'](), _0x2fc2bf?.()),
        _0x195073['stopPropagation']());
    };
  (scopes['at'](-0x1)?.['onSuspend']?.(),
    scopes['push'](_0x784e71),
    _0x115a99?.['addEventListener']?.('keydown', _0x514a3b, !![]),
    _0x1823bb?.['addEventListener']?.('focusin', _0x42d9d9),
    _0x252e4f['addEventListener']?.('keydown', _0x507191),
    _0x252e4f['addEventListener']?.('keyup', _0x507191),
    focusFirstElement(_0x252e4f, { preferredSelector: preferredSelector }));
  let _0x2391bf = ![];
  return ({ restoreFocus: _0x39e83f = !![] } = {}) => {
    if (_0x2391bf) return;
    _0x2391bf = !![];
    const _0xc0352e = _0x385b88();
    (scopes['splice'](scopes['indexOf'](_0x784e71), 0x1),
      _0x115a99?.['removeEventListener']?.('keydown', _0x514a3b, !![]),
      _0x1823bb?.['removeEventListener']?.('focusin', _0x42d9d9),
      _0x252e4f['removeEventListener']?.('keydown', _0x507191),
      _0x252e4f['removeEventListener']?.('keyup', _0x507191));
    if (_0xc0352e && _0x39e83f) restoreFocus(_0x52a74a, _0x1823bb);
  };
}
