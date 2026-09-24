import { dialog } from 'electron';
import { createNodeMediaExporter, assertNodeExportSender } from '../nodeMediaExportService.js';
import { NODE_MEDIA_EXPORT_LIMITS } from '../../src/modules/nodeExport/nodeMediaExportModel.js';

export function registerNodeMediaExportIpcHandlers({ ipcMain, getNodeExportWindow, isNodeExportAppUrl,
  getNodeExportRoots, resolveLocalVirtualPath }) {
  const assertSender = event => assertNodeExportSender(event, getNodeExportWindow(), isNodeExportAppUrl);
  const exporter = createNodeMediaExporter({
    getRoots: getNodeExportRoots, resolveLocalVirtualPath,
    async chooseDirectory() {
      const result = await dialog.showOpenDialog(getNodeExportWindow(), {
        title: '选择媒体导出父目录（将创建独立子目录）', properties: ['openDirectory', 'createDirectory'],
      });
      return result.canceled ? '' : result.filePaths[0];
    },
    async confirmExport({ directory, items, totalBytes, failedCount }) {
      const result = await dialog.showMessageBox(getNodeExportWindow(), {
        type: 'question', title: '确认导出本地媒体', message: `复制 ${items.length} 个本地媒体文件？`,
        detail: `目标父目录：${directory}\n总大小：${(totalBytes / 1024 / 1024).toFixed(1)} MiB\n预检失败：${failedCount} 项（不会复制）\n\n${items.map(item => item.fileName).join('\n')}\n\n创建新子目录、不覆盖原文件、不联网、不生成媒体。开始后不能在此批中取消；关闭或刷新界面不回滚已写入文件。导出清单含节点标识与名称，请妥善保管。`,
        buttons: ['取消', '确认复制'], defaultId: 0, cancelId: 0, noLink: true,
      });
      return result.response === 1;
    },
  });
  ipcMain.handle('nodeMediaExport:capabilities', event => {
    assertSender(event);
    return { available: true, localOnly: true, limits: NODE_MEDIA_EXPORT_LIMITS };
  });
  ipcMain.handle('nodeMediaExport:exportSelected', async (event, payload) => {
    assertSender(event);
    return exporter(payload, { assertActive: () => assertSender(event) });
  });
}
