export function bindImageResetSizeAction(_0x10b0fb) {
  const {
      toolbarEl: _0x12f7bd,
      nodeId: _0x18e1fb,
      getStateSnapshot: _0x255e1f,
      executeCommand: _0xb12360,
    } = _0x10b0fb,
    _0x59e78e = _0x12f7bd.querySelector('.act-reset-size');
  _0x59e78e &&
    _0x59e78e.addEventListener('click', (_0x2fc9c9) => {
      _0x2fc9c9.stopPropagation();
      if (_0x255e1f().ui?.imageVideoNodeResizeEnabled !== true) return;
      _0xb12360('reset_source_media_size', { ids: [_0x18e1fb] });
    });
}
