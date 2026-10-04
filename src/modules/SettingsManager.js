import {
  applyGridDotsPref,
  applyGridDotsPrefFromStorage,
  initAppearanceSettings,
} from './settings/appearanceSettings.js';
import { initCanvasAlignmentSettings } from './settings/canvasAlignmentSettings.js';
import { applyImageVideoNodeResizePref, initNodeBehaviorSettings } from './settings/nodeBehaviorSettings.js';
import { initSettingsPanelEvents } from './settings/panelSettings.js';
import { initApiSettings } from './settings/apiSettings.js';
import { initFileSaveSettings } from './settings/fileSaveSettings.js';
import { initLocalAssetCleanupSettings } from './settings/localAssetCleanupSettings.js';
import { initDiagnosticsSettings } from './settings/diagnosticsSettings.js';
import { initImageInputUploadQualitySettings } from './settings/imageInputUploadQualitySettings.js';
import { initCompletionSoundSettings } from './settings/completionSoundSettings.js';
const SettingsManager = {
  init(uiStore = {}) {
    (initSettingsPanelEvents(),
      initAppearanceSettings({ uiStore: uiStore.uiStore }),
      initCanvasAlignmentSettings(),
      initNodeBehaviorSettings(),
      initImageInputUploadQualitySettings(),
      initCompletionSoundSettings(),
      initApiSettings(),
      initFileSaveSettings(),
      initLocalAssetCleanupSettings(),
      initDiagnosticsSettings({ graphStore: uiStore.graphStore }));
  },
  applyGridDotsPref: applyGridDotsPref,
  applyGridDotsPrefFromStorage: applyGridDotsPrefFromStorage,
  applyImageVideoNodeResizePref: applyImageVideoNodeResizePref,
};
export default SettingsManager;
export { SettingsManager };
