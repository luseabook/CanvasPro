import { registerResourceUploadEntry } from './resourceEntry.js';
import { createProjectLifecycle } from './projectLifecycle.js';
import { registerAppGlobalEvents } from './globalEvents.js';
export function bootstrapAppProject({
  store: store,
  CanvasTabManager: CanvasTabManager,
  project: project,
  loadCustomPresets: loadCustomPresets,
  migrateLegacyThumbnailsInMultiData: migrateLegacyThumbnailsInMultiData,
  sanitizeMultiCanvasDataForPersistence: sanitizeMultiCanvasDataForPersistence,
  commit: commit,
  patchStoreSourceNodeNamesFromFileName: patchStoreSourceNodeNamesFromFileName,
  applySourceNamesFromFileNameToCanvas: applySourceNamesFromFileNameToCanvas,
  uploadFile: uploadFile,
  getBaseName: getBaseName,
} = {}) {
  const map = new URLSearchParams(window.location.search),
    enabled = map.get('id');
  window.currentProjectId = enabled || 'default_v2_project';
  !enabled && console.log('[main] 未指定项目 ID，使用默认: ' + window.currentProjectId + ' ');
  registerResourceUploadEntry({
    store: store,
    uploadFile: uploadFile,
    getBaseName: getBaseName,
    getCurrentProjectId: () => window.currentProjectId,
  });
  const onBeforeUnload = createProjectLifecycle({
    store: store,
    CanvasTabManager: CanvasTabManager,
    project: project,
    loadCustomPresets: loadCustomPresets,
    migrateLegacyThumbnailsInMultiData: migrateLegacyThumbnailsInMultiData,
    sanitizeMultiCanvasDataForPersistence: sanitizeMultiCanvasDataForPersistence,
    commit: commit,
    patchStoreSourceNodeNamesFromFileName: patchStoreSourceNodeNamesFromFileName,
    applySourceNamesFromFileNameToCanvas: applySourceNamesFromFileNameToCanvas,
  });
  return (
    onBeforeUnload.bindHeaderProjectNameAutoSave(),
    onBeforeUnload.bindPersistRevisionAutoSave(),
    registerAppGlobalEvents({
      onBeforeUnload: onBeforeUnload.onBeforeUnload,
      onPageHide: onBeforeUnload.onPageHide,
      onVisibilityChange: onBeforeUnload.onVisibilityChange,
      onDocumentDragEnter: onBeforeUnload.onDocumentDragEnter,
      onDocumentDragOver: onBeforeUnload.onDocumentDragOver,
      onDocumentDrop: onBeforeUnload.onDocumentDrop,
      onBoot: onBeforeUnload.initApp,
    }),
    onBeforeUnload
  );
}
