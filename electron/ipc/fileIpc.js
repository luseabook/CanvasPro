import { mkdirSync } from 'node:fs';

import { shell } from 'electron';

import { sanitizeLocalPreviewRequest } from '../localPreviewRequest.js';

function isDragImportProfilingEnabled() {
  return /^(1|true|yes|on)$/i.test(String(process.env.AIC_DRAG_IMPORT_PROFILING || '').trim());
}

function logDragImportProfile(event, payload = {}) {
  if (!isDragImportProfilingEnabled()) {
    return;
  }
  console.log(`[drag-import-prof] ${event}`, payload);
}

export function registerFileIpcHandlers({
  ipcMain,
  importAssetToLibrary,
  importRemoteAssetToLibrary,
  createLocalPreviewUrl,
  resolveLocalVirtualPath,
  resolveKnownFolder,
  openExternalUrl,
  selectDirectory,
  listNotificationSoundMp3Files,
  listSystemNotificationSoundFiles,
  openSystemNotificationSoundFolder,
  playNotificationSound,
}) {
  ipcMain.handle('asset:import', async (_event, payload) => {
    return await importAssetToLibrary(payload || {});
  });

  ipcMain.handle('asset:importRemote', async (_event, payload) => {
    if (typeof importRemoteAssetToLibrary !== 'function') {
      throw new Error('当前环境不支持远程素材导入');
    }
    return await importRemoteAssetToLibrary(payload || {});
  });

  ipcMain.handle('file:importLocalFile', async (_event, payload) => {
    return await importAssetToLibrary(payload || {});
  });

  ipcMain.handle('file:getLocalPreviewUrl', (_event, payload) => {
    const request = sanitizeLocalPreviewRequest(payload || {});
    const url = createLocalPreviewUrl(request);
    logDragImportProfile('main:preview-url:created', {
      t: Date.now(),
      name: payload?.name || '',
      url,
    });
    return { url };
  });

  ipcMain.handle('dialog:selectDirectory', async (_event, payload) => {
    if (typeof selectDirectory !== 'function') {
      throw new Error('当前环境不支持选择目录');
    }
    return await selectDirectory(payload || {});
  });

  ipcMain.handle('notificationSound:listMp3Files', async (_event, payload) => {
    if (typeof listNotificationSoundMp3Files !== 'function') {
      throw new Error('当前环境不支持读取提示音目录');
    }
    return await listNotificationSoundMp3Files(payload || {});
  });

  ipcMain.handle('notificationSound:listSystemSounds', async () => {
    if (typeof listSystemNotificationSoundFiles !== 'function') {
      throw new Error('当前环境不支持读取系统提示音目录');
    }
    return await listSystemNotificationSoundFiles();
  });

  ipcMain.handle('notificationSound:openSystemSoundFolder', async () => {
    if (typeof openSystemNotificationSoundFolder !== 'function') {
      throw new Error('当前环境不支持打开系统提示音目录');
    }
    return await openSystemNotificationSoundFolder();
  });

  ipcMain.handle('notificationSound:play', async (_event, payload) => {
    if (typeof playNotificationSound !== 'function') {
      throw new Error('当前环境不支持播放提示音');
    }
    return await playNotificationSound(payload || {});
  });

  ipcMain.handle('shell:showItemInFolder', (_event, payload) => {
    const absolutePath = resolveLocalVirtualPath(payload?.localPath || '');
    if (!absolutePath) {
      throw new Error('不允许定位该路径');
    }
    shell.showItemInFolder(absolutePath);
    return { ok: true };
  });

  ipcMain.handle('shell:openKnownFolder', (_event, payload) => {
    const knownFolderPath = resolveKnownFolder(payload?.kind || '');
    if (!knownFolderPath) {
      throw new Error('不允许打开该目录');
    }
    mkdirSync(knownFolderPath, { recursive: true });
    void shell.openPath(knownFolderPath);
    return { ok: true };
  });

  ipcMain.handle('shell:openExternal', (_event, payload) => {
    const result = openExternalUrl(payload?.url || payload);
    if (!result.ok) {
      throw new Error(result.error || '不允许打开该外部链接');
    }
    return result;
  });
}
