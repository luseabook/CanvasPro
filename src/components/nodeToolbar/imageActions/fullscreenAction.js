export function bindImageFullscreenAction(_0x398e51) {
  const { toolbarEl: _0x1e12a6, getNodeData: _0x2eb0ff, openNodeImagePreview: _0x1ae106 } = _0x398e51,
    _0x4523b8 = _0x1e12a6.querySelector('.act-fullscreen');
  _0x4523b8 &&
    _0x4523b8.addEventListener('click', (_0x1bb6b0) => {
      _0x1bb6b0.stopPropagation();
      const _0x3ad879 = _0x2eb0ff();
      if (_0x3ad879) _0x1ae106(_0x3ad879);
    });
}
