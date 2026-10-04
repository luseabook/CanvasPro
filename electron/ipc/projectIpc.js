import { assertNodeExportSender } from '../nodeMediaExportService.js';
import { FULL_PACKAGE_LIMITS } from '../../src/modules/projectPackage/fullProjectPackageModel.js';
export function registerProjectIpcHandlers({
  ipcMain: ipcMain,
  exportFullProjectPackage,
  restoreFullProjectPackage,
  getNodeExportWindow,
  isNodeExportAppUrl,
  openDesktopProject: openDesktopProject,
  saveDesktopProject: saveDesktopProject,
  exportDesktopProjectPackage: exportDesktopProjectPackage,
  importDesktopProjectPackage: importDesktopProjectPackage,
  handleRendererUnsavedState: handleRendererUnsavedState,
  listRecentProjects: listRecentProjects,
  removeRecentProject: removeRecentProject,
  consumeExternalOpenRequests: consumeExternalOpenRequests,
  writeDesktopRecoverySnapshot: writeDesktopRecoverySnapshot,
  getDesktopRecoverySnapshotInfo: getDesktopRecoverySnapshotInfo,
  readDesktopRecoverySnapshot: readDesktopRecoverySnapshot,
  clearDesktopRecoverySnapshot: clearDesktopRecoverySnapshot,
}) {
  const assertFullSender = (event) =>
    assertNodeExportSender(event, getNodeExportWindow(), isNodeExportAppUrl);
  ipcMain.handle('project:fullPackageCapabilities', (event) => {
    assertFullSender(event);
    if (typeof exportFullProjectPackage !== 'function' || typeof restoreFullProjectPackage !== 'function')
      throw new Error('完整工程包宿主未就绪，请更新并重启');
    return { version: 1, externalPackageTickets: 1, limits: FULL_PACKAGE_LIMITS };
  });
  for (const [channel, action] of [
    ['project:exportFullPackage', exportFullProjectPackage],
    ['project:restoreFullPackage', restoreFullProjectPackage],
  ]) {
    ipcMain.handle(channel, (event, payload) => {
      assertFullSender(event);
      if (typeof action !== 'function') throw new Error('完整工程包宿主未就绪，请更新并重启');
      return action(payload || {}, { sender: event.sender, assertActive: () => assertFullSender(event) });
    });
  }
  (ipcMain.handle('project:open', (value, item) => {
    return openDesktopProject(item || {});
  }),
    ipcMain.handle('project:save', (key, index) => {
      return saveDesktopProject(index || {});
    }),
    ipcMain.handle('project:exportPackage', async (sender, result) => {
      return await exportDesktopProjectPackage(result || {}, { sender: sender?.sender || null });
    }),
    ipcMain.handle('project:importPackage', async (sender2, data) => {
      return await importDesktopProjectPackage(data || {}, { sender: sender2?.sender || null });
    }),
    ipcMain.on('project:setUnsavedState', (options, target = {}) => {
      handleRendererUnsavedState(target);
    }),
    ipcMain.handle('project:listRecent', () => {
      return listRecentProjects();
    }),
    ipcMain.handle('project:removeRecent', (source, next) => {
      return removeRecentProject(next?.recentId || '');
    }),
    ipcMain.handle('project:consumeExternalOpenRequests', (event) => {
      // Consuming removes queued requests and can expose parsed project contents.
      assertFullSender(event);
      return consumeExternalOpenRequests();
    }),
    ipcMain.handle('project:writeRecoverySnapshot', (current, entry = {}) => {
      try {
        return writeDesktopRecoverySnapshot(entry || {});
      } catch (code) {
        return { success: false, code: code?.code || '', error: String(code?.message || code) };
      }
    }),
    ipcMain.handle('project:getRecoverySnapshotInfo', (record, handle = {}) => {
      try {
        return getDesktopRecoverySnapshotInfo(handle || {});
      } catch (error) {
        return {
          exists: false,
          isNewerThanProject: false,
          savedAt: 0,
          currentLastModified: 0,
          error: String(error?.message || error),
        };
      }
    }),
    ipcMain.handle('project:readRecoverySnapshot', () => {
      try {
        return readDesktopRecoverySnapshot();
      } catch (error2) {
        return { success: false, exists: false, error: String(error2?.message || error2) };
      }
    }),
    ipcMain.handle('project:clearRecoverySnapshot', (event, expected = {}) => {
      assertFullSender(event);
      try {
        return clearDesktopRecoverySnapshot(expected || {});
      } catch (error3) {
        return { success: false, cleared: false, error: String(error3?.message || error3) };
      }
    }));
}
