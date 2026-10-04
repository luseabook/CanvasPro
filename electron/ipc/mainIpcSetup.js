import { createAgentInformationCapabilityOperations } from '../agentInformationCapabilityOperations.js';
import { createAgentSkillCapabilityOperations } from '../agentSkillCapabilityOperations.js';
import { createClipboardCapabilityOperations } from '../clipboardCapabilityOperations.js';
import { createDiagnosticsCapabilityOperations } from '../diagnosticsCapabilityOperations.js';
import { createProjectCapabilityOperations } from '../projectCapabilityOperations.js';
import { createSecureSettingsCapabilityOperations } from '../secureSettingsCapabilityOperations.js';

export function buildMainIpcHandlerDeps(clipboardApi = {}) {
  const {
    app: app,
    readAppVersionFromIndexHtml: readAppVersionFromIndexHtml,
    getStableDeviceId: getStableDeviceId,
    getUpdaterController: getUpdaterController,
    getBackgroundCompletionNotifier: getBackgroundCompletionNotifier,
    getSecureSettingsStore: getSecureSettingsStore,
    normalizeSecureSettingsKeys: normalizeSecureSettingsKeys,
    fileReferencesFormat: fileReferencesFormat,
    createClipboardNativeImage: createClipboardNativeImage,
    screenshotOverlayController: screenshotOverlayController,
    globalTextPresetShortcutController: globalTextPresetShortcutController,
    globalCaptureWindowController: globalCaptureWindowController,
    normalizeClipboardFileReferences: normalizeClipboardFileReferences,
    parseClipboardFileReferencesFromText: parseClipboardFileReferencesFromText,
    openDesktopProject: openDesktopProject,
    saveDesktopProject: saveDesktopProject,
    exportDesktopProjectPackage: exportDesktopProjectPackage,
    importDesktopProjectPackage: importDesktopProjectPackage,
    handleRendererUnsavedState: handleRendererUnsavedState,
    listRecentProjects: listRecentProjects,
    removeRecentProject: removeRecentProject,
    getRecentProjectsStorePath: getRecentProjectsStorePath,
    syncSystemRecentDocumentsBestEffort: syncSystemRecentDocumentsBestEffort,
    pendingExternalProjectOpenRequests: pendingExternalProjectOpenRequests,
    writeDesktopRecoverySnapshot: writeDesktopRecoverySnapshot,
    getDesktopRecoverySnapshotInfo: getDesktopRecoverySnapshotInfo,
    readDesktopRecoverySnapshot: readDesktopRecoverySnapshot,
    clearDesktopRecoverySnapshot: clearDesktopRecoverySnapshot,
    importAssetToLibrary: importAssetToLibrary,
    importRemoteAssetToLibrary: importRemoteAssetToLibrary,
    createLocalPreviewUrl: createLocalPreviewUrl,
    resolveLocalVirtualPath: resolveLocalVirtualPath,
    resolveKnownFolder: resolveKnownFolder,
    openExternalUrl: openExternalUrl,
    getWebPreviewViewManager: getWebPreviewViewManager,
    selectDirectory: selectDirectory,
    listNotificationSoundMp3Files: listNotificationSoundMp3Files,
    listSystemNotificationSoundFiles: listSystemNotificationSoundFiles,
    openSystemNotificationSoundFolder: openSystemNotificationSoundFolder,
    getMediaTaskQueue: getMediaTaskQueue,
    getLocalAssetCleanupManager: getLocalAssetCleanupManager,
    diagnostics: diagnostics,
    logDir: logDir,
    logDiagnosticEvent: logDiagnosticEvent,
  } = clipboardApi;
  const forwardPackageOperation =
    (handler) =>
    (operationId = {}, value = {}) => {
      if (typeof handler !== 'function') throw new Error('Project package operation is unavailable');
      const run = typeof value?.onProgress === 'function' ? value.onProgress : null,
        item = {
          operationId: operationId?.operationId || 'desktop-http-bridge',
          ...operationId,
        };
      return handler(item, run ? { sender: { send: (key, index) => run(index) } } : {});
    };
  const clipboardOperations = createClipboardCapabilityOperations({
      clipboardApi: clipboardApi.clipboardApi,
      fileReferencesFormat: fileReferencesFormat,
      createClipboardNativeImage: createClipboardNativeImage,
      normalizeClipboardFileReferences: normalizeClipboardFileReferences,
      parseClipboardFileReferencesFromText: parseClipboardFileReferencesFromText,
    }),
    secureSettingsOperations = createSecureSettingsCapabilityOperations({
      getSecureSettingsStore: getSecureSettingsStore,
      normalizeSecureSettingsKeys: normalizeSecureSettingsKeys,
    }),
    agentInformationOperations = createAgentInformationCapabilityOperations(),
    agentSkillOperations = createAgentSkillCapabilityOperations({
      getUserDataRoot:
        typeof clipboardApi.getUserDataRoot === 'function'
          ? clipboardApi.getUserDataRoot
          : () => app?.getPath?.('userData') || '',
      showOpenDialog: clipboardApi.showOpenDialog,
      openFolder: clipboardApi.openFolder,
    }),
    projectOperations = createProjectCapabilityOperations({
      exportDesktopProjectPackage: forwardPackageOperation(exportDesktopProjectPackage),
      importDesktopProjectPackage: forwardPackageOperation(importDesktopProjectPackage),
      handleRendererUnsavedState: handleRendererUnsavedState,
      getRecentProjectsStorePath: getRecentProjectsStorePath,
      syncSystemRecentDocumentsBestEffort: syncSystemRecentDocumentsBestEffort,
      pendingExternalProjectOpenRequests: pendingExternalProjectOpenRequests,
      getCanvasProjectDir: clipboardApi.getCanvasProjectDir,
      showOpenDialog: clipboardApi.showOpenDialog,
      showSaveDialog: clipboardApi.showSaveDialog,
      getRecoverySnapshotPath: clipboardApi.getRecoverySnapshotPath,
      writeRecoverySnapshotFile: clipboardApi.writeRecoverySnapshotFile,
      getRecoverySnapshotFileInfo: clipboardApi.getRecoverySnapshotFileInfo,
      readRecoverySnapshotFile: clipboardApi.readRecoverySnapshotFile,
      removeRecoverySnapshotFile: clipboardApi.removeRecoverySnapshotFile,
      logDiagnosticEvent: logDiagnosticEvent,
    }),
    diagnosticsOperations = createDiagnosticsCapabilityOperations({
      diagnostics: diagnostics,
      logDir: logDir,
      showSaveDialog: clipboardApi.showSaveDialog,
      openFolder: clipboardApi.openFolder,
    });
  return {
    clipboardOperations: clipboardOperations,
    secureSettingsOperations: secureSettingsOperations,
    agentInformationOperations: agentInformationOperations,
    agentSkillOperations: agentSkillOperations,
    projectOperations: projectOperations,
    diagnosticsOperations: diagnosticsOperations,
    getAppVersion: () => readAppVersionFromIndexHtml() || app.getVersion(),
    getStableDeviceId: getStableDeviceId,
    getUpdaterController: getUpdaterController,
    getBackgroundCompletionNotifier: getBackgroundCompletionNotifier,
    getSecureSettingsStore: getSecureSettingsStore,
    normalizeSecureSettingsKeys: normalizeSecureSettingsKeys,
    fileReferencesFormat: fileReferencesFormat,
    createClipboardNativeImage: createClipboardNativeImage,
    captureDesktopDisplay: screenshotOverlayController.captureDesktopDisplay,
    configureGlobalScreenshotShortcut: screenshotOverlayController.configureGlobalScreenshotShortcut,
    consumeGlobalScreenshotCaptureEvents: screenshotOverlayController.consumeGlobalScreenshotCaptureEvents,
    getGlobalScreenshotShortcutStatus: screenshotOverlayController.getGlobalScreenshotShortcutStatus,
    configureGlobalTextPresetShortcut: globalTextPresetShortcutController?.configureGlobalShortcut,
    chooseGlobalCaptureWindowAction: globalCaptureWindowController?.['chooseAction'],
    cancelGlobalCaptureWindow: globalCaptureWindowController?.['cancel'],
    setGlobalCaptureWindowExpanded: globalCaptureWindowController?.['setExpanded'],
    acknowledgeGlobalCaptureWindowPresentation: globalCaptureWindowController?.['didPresent'],
    consumeGlobalTextPresetEvents: globalTextPresetShortcutController?.consumeEvents,
    claimGlobalTextPresetEvent: globalTextPresetShortcutController?.claimEvent,
    acknowledgeGlobalTextPresetEvent: globalTextPresetShortcutController?.acknowledgeEvent,
    getGlobalTextPresetShortcutStatus: globalTextPresetShortcutController?.getShortcutStatus,
    handleScreenshotOverlayConfirm: screenshotOverlayController.handleScreenshotOverlayConfirm,
    handleScreenshotOverlayCancel: screenshotOverlayController.handleScreenshotOverlayCancel,
    normalizeClipboardFileReferences: normalizeClipboardFileReferences,
    parseClipboardFileReferencesFromText: parseClipboardFileReferencesFromText,
    openDesktopProject: openDesktopProject,
    saveDesktopProject: saveDesktopProject,
    exportDesktopProjectPackage: exportDesktopProjectPackage,
    importDesktopProjectPackage: importDesktopProjectPackage,
    exportFullProjectPackage: clipboardApi.exportFullProjectPackage,
    restoreFullProjectPackage: clipboardApi.restoreFullProjectPackage,
    handleRendererUnsavedState: handleRendererUnsavedState,
    listRecentProjects: () => listRecentProjects(getRecentProjectsStorePath()),
    removeRecentProject: (result) => {
      const data = removeRecentProject(getRecentProjectsStorePath(), result);
      return (syncSystemRecentDocumentsBestEffort(), data);
    },
    consumeExternalOpenRequests: () =>
      pendingExternalProjectOpenRequests.splice(0, pendingExternalProjectOpenRequests.length),
    writeDesktopRecoverySnapshot: writeDesktopRecoverySnapshot,
    getDesktopRecoverySnapshotInfo: getDesktopRecoverySnapshotInfo,
    readDesktopRecoverySnapshot: readDesktopRecoverySnapshot,
    clearDesktopRecoverySnapshot: clearDesktopRecoverySnapshot,
    importAssetToLibrary: importAssetToLibrary,
    importRemoteAssetToLibrary: importRemoteAssetToLibrary,
    consumeAssetUpdateEvents: clipboardApi.consumeAssetUpdateEvents,
    getDataDir: clipboardApi.getDataDir,
    createLocalPreviewUrl: createLocalPreviewUrl,
    resolveLocalVirtualPath: resolveLocalVirtualPath,
    getNodeExportWindow: clipboardApi.getNodeExportWindow,
    isNodeExportAppUrl: clipboardApi.isNodeExportAppUrl,
    getTimelineExportTool: clipboardApi.getTimelineExportTool,
    getNodeExportRoots: clipboardApi.getNodeExportRoots,
    exportSelectedNodesPackage: clipboardApi.exportSelectedNodesPackage,
    saveMediaFile: clipboardApi.saveMediaFile,
    saveTextFile: clipboardApi.saveTextFile,
    saveMediaFiles: clipboardApi.saveMediaFiles,
    saveTimeline: clipboardApi.saveTimeline,
    openJianying: clipboardApi.openJianying,
    readLegacyRendererStorageMigration: clipboardApi.readLegacyRendererStorageMigration,
    completeLegacyRendererStorageMigration: clipboardApi.completeLegacyRendererStorageMigration,
    resolveKnownFolder: resolveKnownFolder,
    openExternalUrl: openExternalUrl,
    getWebPreviewViewManager: getWebPreviewViewManager,
    selectDirectory: selectDirectory,
    listNotificationSoundMp3Files: listNotificationSoundMp3Files,
    listSystemNotificationSoundFiles: listSystemNotificationSoundFiles,
    openSystemNotificationSoundFolder: openSystemNotificationSoundFolder,
    playNotificationSound: clipboardApi.playNotificationSound,
    getMediaTaskQueue: getMediaTaskQueue,
    ...(typeof clipboardApi.getMediaTaskHistory === 'function'
      ? { getMediaTaskHistory: clipboardApi.getMediaTaskHistory }
      : {}),
    getLocalAssetCleanupManager: getLocalAssetCleanupManager,
    diagnostics: diagnostics,
    logDir: logDir,
    logDiagnosticEvent: logDiagnosticEvent,
  };
}
export function createMainIpcHandlerInstaller({
  registerIpcHandlers: registerIpcHandlers,
  context: context,
} = {}) {
  if (typeof registerIpcHandlers !== 'function')
    throw new TypeError('registerIpcHandlers must be a function');
  let options = false;
  return function run2() {
    if (options) return false;
    return ((options = true), registerIpcHandlers(buildMainIpcHandlerDeps(context)), true);
  };
}
