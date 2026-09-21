import { registerResourceUploadEntry } from './resourceEntry.js';
import { createProjectLifecycle } from './projectLifecycle.js';
import { registerAppGlobalEvents } from './globalEvents.js';
export function bootstrapAppProject({
  store: _0x382d5e,
  CanvasTabManager: _0x5001ac,
  project: _0x43b124,
  loadCustomPresets: _0x10d742,
  migrateLegacyThumbnailsInMultiData: _0x2d4e97,
  sanitizeMultiCanvasDataForPersistence: _0x180c2d,
  commit: _0xda1e16,
  patchStoreSourceNodeNamesFromFileName: _0xdc0764,
  applySourceNamesFromFileNameToCanvas: _0x3b983c,
  uploadFile: _0x15f280,
  getBaseName: _0x52602e,
} = {}) {
  const _0x57afe3 = new URLSearchParams(window.location.search),
    _0x491159 = _0x57afe3.get('id');
  window.currentProjectId = _0x491159 || 'default_v2_project';
  !_0x491159 && console.log('[main] 未指定项目 ID，使用默认: ' + window.currentProjectId + ' ');
  registerResourceUploadEntry({
    store: _0x382d5e,
    uploadFile: _0x15f280,
    getBaseName: _0x52602e,
    getCurrentProjectId: () => window.currentProjectId,
  });
  const _0x2c392a = createProjectLifecycle({
    store: _0x382d5e,
    CanvasTabManager: _0x5001ac,
    project: _0x43b124,
    loadCustomPresets: _0x10d742,
    migrateLegacyThumbnailsInMultiData: _0x2d4e97,
    sanitizeMultiCanvasDataForPersistence: _0x180c2d,
    commit: _0xda1e16,
    patchStoreSourceNodeNamesFromFileName: _0xdc0764,
    applySourceNamesFromFileNameToCanvas: _0x3b983c,
  });
  return (
    _0x2c392a.bindLogoProjectSave(),
    _0x2c392a.bindHeaderProjectNameAutoSave(),
    _0x2c392a.bindPersistRevisionAutoSave(),
    registerAppGlobalEvents({
      onBeforeUnload: _0x2c392a.onBeforeUnload,
      onPageHide: _0x2c392a.onPageHide,
      onVisibilityChange: _0x2c392a.onVisibilityChange,
      onDocumentDragEnter: _0x2c392a.onDocumentDragEnter,
      onDocumentDragOver: _0x2c392a.onDocumentDragOver,
      onDocumentDrop: _0x2c392a.onDocumentDrop,
      onBoot: _0x2c392a.initApp,
    }),
    _0x2c392a
  );
}
