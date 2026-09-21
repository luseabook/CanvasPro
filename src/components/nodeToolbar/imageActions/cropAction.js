export function bindImageCropAction(_0x243f28) {
  const { toolbarEl: _0x48d138, nodeId: _0x55700c, ImageCropController: _0x1697be } = _0x243f28,
    _0x522b62 = _0x48d138.querySelector('.act-crop');
  _0x522b62 &&
    _0x522b62.addEventListener('click', (_0x5cd58c) => {
      (_0x5cd58c.stopPropagation(),
        window.v2FocusOnNode
          ? (window.v2FocusOnNode(_0x55700c, 120, 0x320),
            setTimeout(() => {
              _0x1697be.init(_0x55700c);
            }, 0x258))
          : _0x1697be.init(_0x55700c));
    });
}
