import { ipcMain } from 'electron';
import { registerAgentInformationIpcHandlers } from './agentInformationIpc.js';
import { registerAgentSkillsIpcHandlers } from './agentSkillsIpc.js';
import { registerAppIpcHandlers } from './appIpc.js';
import { registerCanvasVisualSnapshotIpcHandlers } from './canvasVisualSnapshotIpc.js';
import { registerClipboardIpcHandlers } from './clipboardIpc.js';
import { registerCustomAiAppIpcHandlers } from './customAiAppIpc.js';
import { registerDesktopBridgeIpcHandlers } from './desktopBridgeIpc.js';
import { registerDiagnosticsIpcHandlers } from './diagnosticsIpc.js';
import { registerFileIpcHandlers } from './fileIpc.js';
import { registerLocalAssetCleanupIpcHandlers } from './localAssetCleanupIpc.js';
import { registerMediaTaskIpcHandlers } from './mediaTaskIpc.js';
import { registerNodeMediaExportIpcHandlers } from './nodeMediaExportIpc.js';
import { registerNodeExportIpcHandlers } from './nodeExportIpc.js';
import { registerTimelineExportIpcHandlers } from './timelineExportIpc.js';
import { registerProjectIpcHandlers } from './projectIpc.js';
import { registerScreenshotIpcHandlers } from './screenshotIpc.js';
import { registerSecureSettingsIpcHandlers } from './secureSettingsIpc.js';
import { registerTextPresetIpcHandlers } from './textPresetIpc.js';
import { registerWebPreviewIpcHandlers } from './webPreviewIpc.js';
export function registerIpcHandlers(_0x4d2473) {
  const _0x14a149 = { ipcMain: ipcMain, ..._0x4d2473 };
  (registerAppIpcHandlers(_0x14a149),
    registerAgentInformationIpcHandlers(_0x14a149),
    registerAgentSkillsIpcHandlers(_0x14a149),
    registerCanvasVisualSnapshotIpcHandlers(_0x14a149),
    registerCustomAiAppIpcHandlers(_0x14a149),
    registerSecureSettingsIpcHandlers(_0x14a149),
    registerClipboardIpcHandlers(_0x14a149),
    registerScreenshotIpcHandlers(_0x14a149),
    registerTextPresetIpcHandlers(_0x14a149),
    registerProjectIpcHandlers(_0x14a149),
    registerFileIpcHandlers(_0x14a149),
    registerMediaTaskIpcHandlers(_0x14a149),
    registerNodeMediaExportIpcHandlers(_0x14a149),
    registerNodeExportIpcHandlers(_0x14a149),
    registerTimelineExportIpcHandlers(_0x14a149),
    registerLocalAssetCleanupIpcHandlers(_0x14a149),
    registerDiagnosticsIpcHandlers(_0x14a149),
    registerWebPreviewIpcHandlers(_0x14a149),
    registerDesktopBridgeIpcHandlers({
      ipcMain: ipcMain,
      capabilityHandlers: _0x4d2473,
      logDiagnosticEvent: _0x4d2473.logDiagnosticEvent,
    }));
}
