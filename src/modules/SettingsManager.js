import {
  applyGridDotsPref,
  applyGridDotsPrefFromStorage,
  initAppearanceSettings,
  readGridDotsPref,
  setGridDotsPref,
} from './settings/appearanceSettings.js';
import { initCanvasAlignmentSettings } from './settings/canvasAlignmentSettings.js';
import { initCanvasControlSettings } from './settings/canvasControlSettings.js';
import {
  bindCollaborationSettings,
  bindHostAttentionSettings,
} from './collaboration/collaborationPreferences.js';
import { applyImageVideoNodeResizePref, initNodeBehaviorSettings } from './settings/nodeBehaviorSettings.js';
import { initSettingsPanelEvents } from './settings/panelSettings.js';
import { initApiSettings } from './settings/apiSettings.js';
import { initFileSaveSettings } from './settings/fileSaveSettings.js';
import { initDownloadNamingSettings } from './settings/downloadNamingSettings.js';
import { initLocalAssetCleanupSettings } from './settings/localAssetCleanupSettings.js';
import { initDiagnosticsSettings } from './settings/diagnosticsSettings.js';
import { initImageInputUploadQualitySettings } from './settings/imageInputUploadQualitySettings.js';
import { initCompletionSoundSettings } from './settings/completionSoundSettings.js';
import { initObjectStorageSettings } from './settings/objectStorageSettings.js';
import { initNodeManagerSettings } from './settings/nodeManagerSettings.js';
const SettingsManager = {
  init(uiStore = {}) {
    (initSettingsPanelEvents(),
      initAppearanceSettings({
        uiStore: uiStore['uiStore'],
        getCanvasPresentationContext: uiStore['getCanvasPresentationContext'],
      }),
      initNodeManagerSettings({ uiStore: uiStore['uiStore'] }),
      initCanvasAlignmentSettings(),
      initCanvasControlSettings(),
      bindCollaborationSettings(document['getElementById']('collaborationOffscreenMembersGroup')),
      bindHostAttentionSettings(document['getElementById']('collaborationHostAttentionGroup')),
      initNodeBehaviorSettings(),
      initDownloadNamingSettings(),
      initImageInputUploadQualitySettings(),
      initCompletionSoundSettings(),
      initObjectStorageSettings(),
      initApiSettings(),
      initFileSaveSettings(),
      initLocalAssetCleanupSettings(),
      initDiagnosticsSettings({ graphStore: uiStore['graphStore'] }));
  },
  applyGridDotsPref: applyGridDotsPref,
  applyGridDotsPrefFromStorage: applyGridDotsPrefFromStorage,
  readGridDotsPref: readGridDotsPref,
  setGridDotsPref: setGridDotsPref,
  applyImageVideoNodeResizePref: applyImageVideoNodeResizePref,
};
export default SettingsManager;
export { SettingsManager };
