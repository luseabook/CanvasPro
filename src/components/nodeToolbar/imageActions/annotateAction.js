export function bindImageAnnotateAction(_0x2afacb) {
  const { toolbarEl: _0xc8058f, nodeId: _0x5a1698, ImageAnnotateController: _0x64fabf } = _0x2afacb,
    _0x4a8c89 = _0xc8058f.querySelector('.act-annotate');
  _0x4a8c89 &&
    _0x4a8c89.addEventListener('click', (_0x3bec1d) => {
      (_0x3bec1d.stopPropagation(),
        window.v2FocusOnNode && window.v2FocusOnNode(_0x5a1698),
        _0x64fabf.init(_0x5a1698));
    });
}
