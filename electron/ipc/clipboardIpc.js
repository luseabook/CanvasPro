import { clipboard } from 'electron';
import { createClipboardCapabilityOperations } from '../clipboardCapabilityOperations.js';

export function registerClipboardIpcHandlers({
  ipcMain,
  clipboardOperations,
  fileReferencesFormat,
  createClipboardNativeImage,
  normalizeClipboardFileReferences,
  parseClipboardFileReferencesFromText,
}) {
  const operations =
    clipboardOperations ||
    createClipboardCapabilityOperations({
      clipboardApi: clipboard,
      fileReferencesFormat,
      createClipboardNativeImage,
      normalizeClipboardFileReferences,
      parseClipboardFileReferencesFromText,
    });
  ipcMain.handle('clipboard:writeImage', (_event, payload = {}) => operations.writeImage(payload)),
    ipcMain.handle('clipboard:readImage', () => operations.readImage()),
    ipcMain.handle('clipboard:writeFileReferences', (_event, payload = {}) =>
      operations.writeFileReferences(payload),
    ),
    ipcMain.handle('clipboard:readFileReferences', () => operations.readFileReferences()),
    ipcMain.handle('clipboard:writeText', (_event, payload = {}) => operations.writeText(payload)),
    ipcMain.handle('clipboard:readText', () => operations.readText());
}
