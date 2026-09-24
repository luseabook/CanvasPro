import { assertNodeExportSender } from '../nodeMediaExportService.js';

export function registerNodeExportIpcHandlers({
  ipcMain,
  exportSelectedNodesPackage,
  saveMediaFile,
  saveTextFile,
  saveMediaFiles,
  saveTimeline,
  openJianying,
  getNodeExportWindow,
  isNodeExportAppUrl,
}) {
  // These handlers write to user-chosen files, so keep them on the main app window only.
  const assertSender = (event) =>
    assertNodeExportSender(event, getNodeExportWindow?.(), isNodeExportAppUrl);
  ipcMain.handle('nodeExport:openJianying', async () => {
    if (typeof openJianying !== 'function') return { success: false, error: '当前环境无法打开剪映' };
    return openJianying();
  });
  ipcMain.handle('nodeExport:saveTimeline', async (event, payload) => {
    assertSender(event);
    if (typeof saveTimeline !== 'function') throw new Error('当前环境不支持导出剪辑工程');
    return saveTimeline(payload || {});
  });
  ipcMain.handle('nodeExport:exportSelected', async (event, payload) => {
    assertSender(event);
    if (typeof exportSelectedNodesPackage !== 'function')
      throw new Error('当前环境不支持批量下载节点');
    return await exportSelectedNodesPackage(payload || {});
  });
  ipcMain.handle('nodeExport:saveMedia', async (event, payload) => {
    assertSender(event);
    if (typeof saveMediaFile !== 'function') throw new Error('当前环境不支持保存媒体文件');
    return await saveMediaFile(payload || {});
  });
  ipcMain.handle('nodeExport:saveText', async (event, payload) => {
    assertSender(event);
    if (typeof saveTextFile !== 'function') throw new Error('当前环境不支持保存文本文件');
    return await saveTextFile(payload || {});
  });
  ipcMain.handle('nodeExport:saveMediaFiles', async (event, payload) => {
    assertSender(event);
    if (typeof saveMediaFiles !== 'function') throw new Error('当前环境不支持批量保存媒体文件');
    return await saveMediaFiles(payload || {});
  });
}
