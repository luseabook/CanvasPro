import { createAgentInformationCapabilityOperations } from '../agentInformationCapabilityOperations.js';
import { createAgentSkillCapabilityOperations } from '../agentSkillCapabilityOperations.js';
import { createClipboardCapabilityOperations } from '../clipboardCapabilityOperations.js';
import { createDiagnosticsCapabilityOperations } from '../diagnosticsCapabilityOperations.js';
import { createProjectCapabilityOperations } from '../projectCapabilityOperations.js';
import { createSecureSettingsCapabilityOperations } from '../secureSettingsCapabilityOperations.js';

export function buildMainIpcHandlerDeps(_0x5ccc30 = {}) {
  const {
    app: _0x585c64,
    readAppVersionFromIndexHtml: _0x3c3fec,
    getStableDeviceId: _0x59fe63,
    getUpdaterController: _0x378bc5,
    getBackgroundCompletionNotifier: _0x453315,
    getSecureSettingsStore: _0x387384,
    normalizeSecureSettingsKeys: _0x36e4d2,
    fileReferencesFormat: _0x1bfc7f,
    createClipboardNativeImage: _0x1ea5e6,
    screenshotOverlayController: _0x2aeaaa,
    globalTextPresetShortcutController: _0x4cd9d8,
    globalCaptureWindowController: _0x331d63,
    normalizeClipboardFileReferences: _0x1452fb,
    parseClipboardFileReferencesFromText: _0x353f7f,
    openDesktopProject: _0x2548fd,
    saveDesktopProject: _0x3ac7cc,
    exportDesktopProjectPackage: _0x3459d9,
    importDesktopProjectPackage: _0x16e552,
    handleRendererUnsavedState: _0x23a370,
    listRecentProjects: _0x2caa25,
    removeRecentProject: _0x57fa15,
    getRecentProjectsStorePath: _0x51b8ce,
    syncSystemRecentDocumentsBestEffort: _0x1f0479,
    pendingExternalProjectOpenRequests: _0x301657,
    writeDesktopRecoverySnapshot: _0x265b8c,
    getDesktopRecoverySnapshotInfo: _0x147283,
    readDesktopRecoverySnapshot: _0x327880,
    clearDesktopRecoverySnapshot: _0x5091a5,
    importAssetToLibrary: _0x16da28,
    importRemoteAssetToLibrary: _0xab118b,
    createLocalPreviewUrl: _0x150ad3,
    resolveLocalVirtualPath: _0x14c124,
    resolveKnownFolder: _0x3d31ee,
    openExternalUrl: _0x517bec,
    getWebPreviewViewManager: _0x5e31e7,
    selectDirectory: _0x301f0a,
    listNotificationSoundMp3Files: _0x2321d9,
    listSystemNotificationSoundFiles: _0x3d984e,
    openSystemNotificationSoundFolder: _0x892c17,
    getMediaTaskQueue: _0x3fd375,
    getLocalAssetCleanupManager: _0xe3d06,
    diagnostics: _0x5df58b,
    logDir: _0x1c3e40,
    logDiagnosticEvent: _0x5934cd,
  } = _0x5ccc30;
  const forwardPackageOperation =
    (_0x2dd0d6) =>
    (_0x3a1b8e = {}, _0x4d1d35 = {}) => {
      if (typeof _0x2dd0d6 !== 'function') throw new Error('Project package operation is unavailable');
      const _0x11a8a2 = typeof _0x4d1d35?.onProgress === 'function' ? _0x4d1d35.onProgress : null,
        _0x5dcbfa = {
          operationId: _0x3a1b8e?.operationId || 'desktop-http-bridge',
          ..._0x3a1b8e,
        };
      return _0x2dd0d6(
        _0x5dcbfa,
        _0x11a8a2 ? { sender: { send: (_0x1dce29, _0x1be0f3) => _0x11a8a2(_0x1be0f3) } } : {},
      );
    };
  const clipboardOperations = createClipboardCapabilityOperations({
      clipboardApi: _0x5ccc30.clipboardApi,
      fileReferencesFormat: _0x1bfc7f,
      createClipboardNativeImage: _0x1ea5e6,
      normalizeClipboardFileReferences: _0x1452fb,
      parseClipboardFileReferencesFromText: _0x353f7f,
    }),
    secureSettingsOperations = createSecureSettingsCapabilityOperations({
      getSecureSettingsStore: _0x387384,
      normalizeSecureSettingsKeys: _0x36e4d2,
    }),
    agentInformationOperations = createAgentInformationCapabilityOperations(),
    agentSkillOperations = createAgentSkillCapabilityOperations({
      getUserDataRoot:
        typeof _0x5ccc30.getUserDataRoot === 'function'
          ? _0x5ccc30.getUserDataRoot
          : () => _0x585c64?.getPath?.('userData') || '',
      showOpenDialog: _0x5ccc30.showOpenDialog,
      openFolder: _0x5ccc30.openFolder,
    }),
    projectOperations = createProjectCapabilityOperations({
      exportDesktopProjectPackage: forwardPackageOperation(_0x3459d9),
      importDesktopProjectPackage: forwardPackageOperation(_0x16e552),
      handleRendererUnsavedState: _0x23a370,
      getRecentProjectsStorePath: _0x51b8ce,
      syncSystemRecentDocumentsBestEffort: _0x1f0479,
      pendingExternalProjectOpenRequests: _0x301657,
      getCanvasProjectDir: _0x5ccc30.getCanvasProjectDir,
      showOpenDialog: _0x5ccc30.showOpenDialog,
      showSaveDialog: _0x5ccc30.showSaveDialog,
      getRecoverySnapshotPath: _0x5ccc30.getRecoverySnapshotPath,
      writeRecoverySnapshotFile: _0x5ccc30.writeRecoverySnapshotFile,
      getRecoverySnapshotFileInfo: _0x5ccc30.getRecoverySnapshotFileInfo,
      readRecoverySnapshotFile: _0x5ccc30.readRecoverySnapshotFile,
      removeRecoverySnapshotFile: _0x5ccc30.removeRecoverySnapshotFile,
      logDiagnosticEvent: _0x5934cd,
    }),
    diagnosticsOperations = createDiagnosticsCapabilityOperations({
      diagnostics: _0x5df58b,
      logDir: _0x1c3e40,
      showSaveDialog: _0x5ccc30.showSaveDialog,
      openFolder: _0x5ccc30.openFolder,
    });
  return {
    clipboardOperations: clipboardOperations,
    secureSettingsOperations: secureSettingsOperations,
    agentInformationOperations: agentInformationOperations,
    agentSkillOperations: agentSkillOperations,
    projectOperations: projectOperations,
    diagnosticsOperations: diagnosticsOperations,
    getAppVersion: () => _0x3c3fec() || _0x585c64.getVersion(),
    getStableDeviceId: _0x59fe63,
    getUpdaterController: _0x378bc5,
    getBackgroundCompletionNotifier: _0x453315,
    getSecureSettingsStore: _0x387384,
    normalizeSecureSettingsKeys: _0x36e4d2,
    fileReferencesFormat: _0x1bfc7f,
    createClipboardNativeImage: _0x1ea5e6,
    captureDesktopDisplay: _0x2aeaaa.captureDesktopDisplay,
    configureGlobalScreenshotShortcut: _0x2aeaaa.configureGlobalScreenshotShortcut,
    consumeGlobalScreenshotCaptureEvents: _0x2aeaaa.consumeGlobalScreenshotCaptureEvents,
    getGlobalScreenshotShortcutStatus: _0x2aeaaa.getGlobalScreenshotShortcutStatus,
    configureGlobalTextPresetShortcut: _0x4cd9d8?.configureGlobalShortcut,
    chooseGlobalCaptureWindowAction: _0x331d63?.['chooseAction'],
    cancelGlobalCaptureWindow: _0x331d63?.['cancel'],
    setGlobalCaptureWindowExpanded: _0x331d63?.['setExpanded'],
    acknowledgeGlobalCaptureWindowPresentation: _0x331d63?.['didPresent'],
    consumeGlobalTextPresetEvents: _0x4cd9d8?.consumeEvents,
    claimGlobalTextPresetEvent: _0x4cd9d8?.claimEvent,
    acknowledgeGlobalTextPresetEvent: _0x4cd9d8?.acknowledgeEvent,
    getGlobalTextPresetShortcutStatus: _0x4cd9d8?.getShortcutStatus,
    handleScreenshotOverlayConfirm: _0x2aeaaa.handleScreenshotOverlayConfirm,
    handleScreenshotOverlayCancel: _0x2aeaaa.handleScreenshotOverlayCancel,
    normalizeClipboardFileReferences: _0x1452fb,
    parseClipboardFileReferencesFromText: _0x353f7f,
    openDesktopProject: _0x2548fd,
    saveDesktopProject: _0x3ac7cc,
    exportDesktopProjectPackage: _0x3459d9,
    importDesktopProjectPackage: _0x16e552,
    exportFullProjectPackage: _0x5ccc30.exportFullProjectPackage,
    restoreFullProjectPackage: _0x5ccc30.restoreFullProjectPackage,
    handleRendererUnsavedState: _0x23a370,
    listRecentProjects: () => _0x2caa25(_0x51b8ce()),
    removeRecentProject: (_0x49b8f1) => {
      const _0x3daaee = _0x57fa15(_0x51b8ce(), _0x49b8f1);
      return (_0x1f0479(), _0x3daaee);
    },
    consumeExternalOpenRequests: () => _0x301657.splice(0, _0x301657.length),
    writeDesktopRecoverySnapshot: _0x265b8c,
    getDesktopRecoverySnapshotInfo: _0x147283,
    readDesktopRecoverySnapshot: _0x327880,
    clearDesktopRecoverySnapshot: _0x5091a5,
    importAssetToLibrary: _0x16da28,
    importRemoteAssetToLibrary: _0xab118b,
    consumeAssetUpdateEvents: _0x5ccc30.consumeAssetUpdateEvents,
    getDataDir: _0x5ccc30.getDataDir,
    createLocalPreviewUrl: _0x150ad3,
    resolveLocalVirtualPath: _0x14c124,
    getNodeExportWindow: _0x5ccc30.getNodeExportWindow,
    isNodeExportAppUrl: _0x5ccc30.isNodeExportAppUrl,
    getTimelineExportTool: _0x5ccc30.getTimelineExportTool,
    getNodeExportRoots: _0x5ccc30.getNodeExportRoots,
    exportSelectedNodesPackage: _0x5ccc30.exportSelectedNodesPackage,
    saveMediaFile: _0x5ccc30.saveMediaFile,
    saveTextFile: _0x5ccc30.saveTextFile,
    saveMediaFiles: _0x5ccc30.saveMediaFiles,
    saveTimeline: _0x5ccc30.saveTimeline,
    openJianying: _0x5ccc30.openJianying,
    readLegacyRendererStorageMigration: _0x5ccc30.readLegacyRendererStorageMigration,
    completeLegacyRendererStorageMigration: _0x5ccc30.completeLegacyRendererStorageMigration,
    resolveKnownFolder: _0x3d31ee,
    openExternalUrl: _0x517bec,
    getWebPreviewViewManager: _0x5e31e7,
    selectDirectory: _0x301f0a,
    listNotificationSoundMp3Files: _0x2321d9,
    listSystemNotificationSoundFiles: _0x3d984e,
    openSystemNotificationSoundFolder: _0x892c17,
    playNotificationSound: _0x5ccc30.playNotificationSound,
    getMediaTaskQueue: _0x3fd375,
    ...(typeof _0x5ccc30.getMediaTaskHistory === 'function'
      ? { getMediaTaskHistory: _0x5ccc30.getMediaTaskHistory }
      : {}),
    getLocalAssetCleanupManager: _0xe3d06,
    diagnostics: _0x5df58b,
    logDir: _0x1c3e40,
    logDiagnosticEvent: _0x5934cd,
  };
}
export function createMainIpcHandlerInstaller({ registerIpcHandlers: _0x3e2818, context: _0x4dace2 } = {}) {
  if (typeof _0x3e2818 !== 'function') throw new TypeError('registerIpcHandlers must be a function');
  let _0x126f03 = false;
  return function _0x3a8e52() {
    if (_0x126f03) return false;
    return ((_0x126f03 = true), _0x3e2818(buildMainIpcHandlerDeps(_0x4dace2)), true);
  };
}
