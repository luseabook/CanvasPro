export function bindImageMattingAction(_0x3b27af) {
  const { toolbarEl: _0x301187, nodeId: _0xeff8b3, ImageMattingController: _0x755a34 } = _0x3b27af,
    _0x541d79 = _0x301187.querySelector('.act-matting');
  _0x541d79 &&
    _0x541d79.addEventListener('click', (_0x45f285) => {
      (_0x45f285.stopPropagation(),
        window.v2FocusOnNode && window.v2FocusOnNode(_0xeff8b3),
        _0x755a34.init(_0xeff8b3));
    });
}
