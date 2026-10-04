import { registerMediaTaskHistoryIpc } from '../mediaTaskHistoryIpc.js';
export function registerMediaTaskIpcHandlers({
  ipcMain: ipcMain,
  getMediaTaskQueue: getMediaTaskQueue,
  ...historyDependencies
}) {
  registerMediaTaskHistoryIpc({ ipcMain: ipcMain, ...historyDependencies });
  (ipcMain.handle('mediaTask:enqueue', (value, item) => {
    return getMediaTaskQueue().enqueue(item || {});
  }),
    ipcMain.handle('mediaTask:cancel', (key, index) => {
      return getMediaTaskQueue().cancel(index?.taskId || '');
    }),
    ipcMain.handle('mediaTask:list', (result, limit) => {
      return getMediaTaskQueue().list({
        limit: limit?.limit || 100,
        ...(limit?.taskId !== undefined ? { taskId: limit.taskId } : {}),
      });
    }));
}
