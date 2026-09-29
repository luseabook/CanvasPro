export function createPromptExpansionMotion(_0x2a31f9) {
  const _0x1058cf = _0x2a31f9['ownerDocument']['defaultView'];
  let _0xaf0b64 = null,
    _0x58e367 = null;
  function _0x225114() {
    const _0x52ccac = _0xaf0b64;
    ((_0xaf0b64 = null), _0x52ccac?.['cancel'](), _0x58e367?.['cancel'](), (_0x58e367 = null));
  }
  function _0x1f92d7(
    _0x5a8c77,
    _0x3fd019,
    { overlay: _0x34c6f4, closing: closing = ![], onFinish: _0x50fad0 } = {},
  ) {
    const _0x172298 = _0x34c6f4 ? _0x1058cf['getComputedStyle'](_0x34c6f4)['opacity'] : '1';
    _0x225114();
    if (_0x1058cf['matchMedia']('(prefers-reduced-motion: reduce)')['matches']) {
      _0x50fad0?.();
      return;
    }
    const _0x51437d = _0x2a31f9['getBoundingClientRect'](),
      _0x5c738b = _0x3fd019 || _0x51437d;
    if (!_0x51437d['width'] || !_0x51437d['height'] || !_0x5a8c77?.['width'] || !_0x5c738b['width']) {
      _0x50fad0?.();
      return;
    }
    const _0x1b6cef = (_0x237532) =>
        'translate(' +
        (_0x237532['x'] - _0x51437d['x']) +
        'px,\x20' +
        (_0x237532['y'] - _0x51437d['y']) +
        'px) scale(' +
        _0x237532['width'] / _0x51437d['width'] +
        ',\x20' +
        _0x237532['height'] / _0x51437d['height'] +
        ')',
      _0x50bfe7 = {
        duration: closing ? 0xf0 : 0x140,
        easing: 'cubic-bezier(0.22,\x201,\x200.36,\x201)',
        fill: 'both',
      },
      _0x1f7ec9 = _0x2a31f9['animate'](
        [
          { transform: _0x1b6cef(_0x5a8c77), transformOrigin: '0\x200', filter: 'blur(0px)' },
          { offset: 0.35, filter: 'blur(1.5px)' },
          { transform: _0x1b6cef(_0x5c738b), transformOrigin: '0 0', filter: 'blur(0px)' },
        ],
        _0x50bfe7,
      );
    ((_0x1f7ec9['id'] = 'prompt-expansion'),
      (_0xaf0b64 = _0x1f7ec9),
      _0x34c6f4 &&
        (_0x58e367 = _0x34c6f4['animate']({ opacity: closing ? [_0x172298, 0x0] : [0x0, 0x1] }, _0x50bfe7)),
      _0x1f7ec9['finished']
        ['then'](() => {
          if (_0xaf0b64 !== _0x1f7ec9) return;
          (_0x225114(), _0x50fad0?.());
        })
        ['catch'](() => {}));
  }
  return { play: _0x1f92d7, cancel: _0x225114 };
}
