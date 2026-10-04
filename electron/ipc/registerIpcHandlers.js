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
export function registerIpcHandlers(capabilityHandlers) {
  const value = { ipcMain: ipcMain, ...capabilityHandlers };
  (registerAppIpcHandlers(value),
    registerAgentInformationIpcHandlers(value),
    registerAgentSkillsIpcHandlers(value),
    registerCanvasVisualSnapshotIpcHandlers(value),
    registerCustomAiAppIpcHandlers(value),
    registerSecureSettingsIpcHandlers(value),
    registerClipboardIpcHandlers(value),
    registerScreenshotIpcHandlers(value),
    registerTextPresetIpcHandlers(value),
    registerProjectIpcHandlers(value),
    registerFileIpcHandlers(value),
    registerMediaTaskIpcHandlers(value),
    registerNodeMediaExportIpcHandlers(value),
    registerNodeExportIpcHandlers(value),
    registerTimelineExportIpcHandlers(value),
    registerLocalAssetCleanupIpcHandlers(value),
    registerDiagnosticsIpcHandlers(value),
    registerWebPreviewIpcHandlers(value),
    registerDesktopBridgeIpcHandlers({
      ipcMain: ipcMain,
      capabilityHandlers: capabilityHandlers,
      logDiagnosticEvent: capabilityHandlers.logDiagnosticEvent,
    }));
}
