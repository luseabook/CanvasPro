function getManager(handler) {
  const enabled = typeof handler === 'function' ? handler() : null;
  if (!enabled) throw new Error('浏览器服务尚未就绪');
  return enabled;
}
export function registerWebPreviewIpcHandlers({
  ipcMain: ipcMain,
  getWebPreviewViewManager: getWebPreviewViewManager,
}) {
  const run = (value) => getManager(getWebPreviewViewManager).syncViews(value);
  (ipcMain.handle('webPreview:syncViews', (item, key = {}) => {
    return run(key);
  }),
    ipcMain.on?.('webPreview:syncViewsFast', (index, result = {}) => {
      Promise.resolve()
        .then(() => run(result))
        .catch(() => {});
    }),
    ipcMain.handle('webPreview:disposeViews', (data, options = {}) => {
      return getManager(getWebPreviewViewManager).disposeViews(options);
    }),
    ipcMain.handle('webPreview:controlView', (target, source = {}) => {
      return getManager(getWebPreviewViewManager).controlView(source);
    }));
}
