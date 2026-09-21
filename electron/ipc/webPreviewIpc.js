function getManager(_0x199ccb) {
  const _0x48e0a8 = typeof _0x199ccb === 'function' ? _0x199ccb() : null;
  if (!_0x48e0a8) throw new Error('浏览器服务尚未就绪');
  return _0x48e0a8;
}
export function registerWebPreviewIpcHandlers({ ipcMain: _0x375afb, getWebPreviewViewManager: _0x300ab8 }) {
  const _0x465af8 = (_0x4282bb) => getManager(_0x300ab8).syncViews(_0x4282bb);
  (_0x375afb.handle('webPreview:syncViews', (_0x2c4045, _0x268d07 = {}) => {
    return _0x465af8(_0x268d07);
  }),
    _0x375afb.on?.('webPreview:syncViewsFast', (_0x21416d, _0x2faa08 = {}) => {
      Promise.resolve()
        .then(() => _0x465af8(_0x2faa08))
        .catch(() => {});
    }),
    _0x375afb.handle('webPreview:disposeViews', (_0x380bf9, _0x26fe2a = {}) => {
      return getManager(_0x300ab8).disposeViews(_0x26fe2a);
    }),
    _0x375afb.handle('webPreview:controlView', (_0x36296d, _0x39f90a = {}) => {
      return getManager(_0x300ab8).controlView(_0x39f90a);
    }));
}
