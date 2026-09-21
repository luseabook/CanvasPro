export function bindVideoResetSizeAction(_0x34b8e8) {
  const {
      toolbarEl: _0x15dd89,
      nodeData: _0x5cf846,
      getStateSnapshot: _0x368f9d,
      executeCommand: _0x118343,
    } = _0x34b8e8,
    _0x44857e = _0x15dd89.querySelector('.act-reset-size');
  _0x44857e &&
    _0x44857e.addEventListener('click', (_0x20022b) => {
      _0x20022b.stopPropagation();
      if (_0x368f9d().ui?.imageVideoNodeResizeEnabled !== true) return;
      if (!_0x5cf846?.id) return;
      _0x118343('reset_source_media_size', { ids: [_0x5cf846.id] });
    });
}
