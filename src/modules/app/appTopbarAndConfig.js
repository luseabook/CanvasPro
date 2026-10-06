import { registerSidebarSubmenu } from '../sidebarSubmenuController.js';
import { createProviderSettingsController } from './appTopbarProviderConnection.js';
export function createAppTopbarAndConfig({
  store: store,
  fetchApiConfigFromServer: fetchApiConfigFromServer,
  getApiConfigSnapshot: getApiConfigSnapshot,
  saveApiConfigToServer: saveApiConfigToServer,
  testProviderConnections: testProviderConnections,
  discoverCustomProvider: discoverCustomProvider,
  analyzeCustomProviderDocumentation: analyzeCustomProviderDocumentation,
  buildCustomProviderManifestDraft: buildCustomProviderManifestDraft,
  validateCustomProviderManifestDraft: validateCustomProviderManifestDraft,
  saveCustomProviderManifestBundle: saveCustomProviderManifestBundle,
  listCustomProviderManifestBundles: listCustomProviderManifestBundles,
  deleteCustomProviderManifestBundle: deleteCustomProviderManifestBundle,
  refreshManifestModelNodeUis: refreshManifestModelNodeUis,
  fetchDreaminaCliStatusFromServer: fetchDreaminaCliStatusFromServer,
  fetchDreaminaCliLoginRuntimeFromServer: fetchDreaminaCliLoginRuntimeFromServer,
  startDreaminaHeadlessLoginFromServer: startDreaminaHeadlessLoginFromServer,
  startDreaminaHeadlessReloginFromServer: startDreaminaHeadlessReloginFromServer,
  startDreaminaWebLoginFromServer: startDreaminaWebLoginFromServer,
  importDreaminaLoginResponseFromServer: importDreaminaLoginResponseFromServer,
  logoutDreaminaFromServer: logoutDreaminaFromServer,
  buildDreaminaQrImageUrl: buildDreaminaQrImageUrl,
  showError: showError,
} = {}) {
  const destroy = createProviderSettingsController({
    store: store,
    configPort: {
      fetchConfig: fetchApiConfigFromServer,
      getConfigSnapshot: getApiConfigSnapshot,
      saveConfig: saveApiConfigToServer,
      testConnections: testProviderConnections,
    },
    customProviderPort: {
      discoverCustomProvider: discoverCustomProvider,
      analyzeCustomProviderDocumentation: analyzeCustomProviderDocumentation,
      buildCustomProviderManifestDraft: buildCustomProviderManifestDraft,
      validateCustomProviderManifestDraft: validateCustomProviderManifestDraft,
      saveCustomProviderManifestBundle: saveCustomProviderManifestBundle,
      listCustomProviderManifestBundles: listCustomProviderManifestBundles,
      deleteCustomProviderManifestBundle: deleteCustomProviderManifestBundle,
    },
    dreaminaPort: {
      fetchDreaminaCliStatusFromServer: fetchDreaminaCliStatusFromServer,
      fetchDreaminaCliLoginRuntimeFromServer: fetchDreaminaCliLoginRuntimeFromServer,
      startDreaminaHeadlessLoginFromServer: startDreaminaHeadlessLoginFromServer,
      startDreaminaHeadlessReloginFromServer: startDreaminaHeadlessReloginFromServer,
      startDreaminaWebLoginFromServer: startDreaminaWebLoginFromServer,
      importDreaminaLoginResponseFromServer: importDreaminaLoginResponseFromServer,
      logoutDreaminaFromServer: logoutDreaminaFromServer,
      buildDreaminaQrImageUrl: buildDreaminaQrImageUrl,
    },
    uiPort: { refreshManifestModelNodeUis: refreshManifestModelNodeUis, showError: showError },
  });
  function run() {
    const el = document.getElementById('projectNameText');
    el &&
      (el.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        (event.preventDefault(), el.blur());
      }),
      el.addEventListener('click', () => {
        el.focus();
      }));
    const button = document.getElementById('userAvatar'),
      panel = document.getElementById('avatarMenu');
    button &&
      panel &&
      registerSidebarSubmenu({
        key: 'settings',
        button: button,
        panel: panel,
        openClass: 'open',
        isOpen: () => panel.classList.contains('open'),
      });
  }
  function init() {
    (run(), destroy.init());
  }
  return { destroy: destroy.destroy, init: init };
}
