import { MediaTaskHistoryStore } from './mediaTaskHistoryStore.js';
import {
  app,
  autoUpdater,
  BrowserWindow,
  dialog,
  globalShortcut,
  Menu,
  nativeImage,
  Notification,
  powerSaveBlocker,
  protocol,
  safeStorage,
  screen,
  session,
  shell,
  WebContentsView,
} from 'electron';
import electron_updater from 'electron-updater';
import { openShellFolder } from './shellItemRevealer.js';
import { resolveBackendLaunchSpec } from './backendLaunchResolver.js';
import { findVerifiedBackendProcessPids } from './backendProcessIdentity.js';
import { stopSpawnedServerProcess } from './backendProcessTermination.js';
import { createDesktopStartupLifecycle } from './desktopStartupLifecycle.js';
import { createDesktopQuitCoordinator } from './desktopQuitCoordinator.js';
import { createRendererNavigationGuard } from './rendererNavigationGuard.js';
import { runCleanupSteps } from '../src/utils/cleanupSteps.js';
import { reclaimStartupPort } from './startupPortRecovery.js';
import { collectListeningPortPids, probeTcpPortAvailable } from './startupPortInspector.js';
import { resolveWindowsSystemToolPath } from './windowsSystemTools.js';
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  copyFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installAppMenu } from './appMenu.js';
import { createAssetCapabilityOperations } from './assetCapabilityOperations.js';
import { createAssetUpdateEventBuffer } from './assetUpdateEventBuffer.js';
import { resolveAsrRuntimePythonCommand } from './asrRuntimeResolver.js';
import { createBailianAsrConfigResolver } from './bailianAsrConfig.js';
import { createDeviceIdentityManager } from './deviceIdentity.js';
import { createForegroundDialogPresenter } from './dialogPresenter.js';
import { createDiagnosticsManager } from './diagnostics.js';
import { createDoubaoAsrConfigResolver } from './doubaoAsrConfig.js';
import { formatExternalUrlForLog, normalizeExternalUrl } from './externalLinks.js';
import { installDevReloadShortcuts } from './devReloadShortcuts.js';
import { resolveExistingPathWithinRoot } from './localPathContainment.js';
import { createStartupHelpers } from './mainStartupHelpers.js';
import { readUserSettingsFromFilesSync } from './fileSaveSettingsReader.js';
import { resolveFunasrModelRootDir } from './funasrModelRoot.js';
import { createLocalAssetCleanupManager } from './localAssetCleanup.js';
import { createLocalPreviewProtocolRuntime } from './localPreviewProtocolRuntime.js';
import {
  createLocalAssetCleanupRootsResolver,
  readFileSavePathsForLocalCleanup,
} from './localAssetCleanupRoots.js';
import { MediaTaskQueue } from './mediaTaskQueue.js';
import { resolvePreferredRuntimePythonCommand } from './pythonRuntimeResolver.js';
import { syncRecentProjectsToSystemRecentDocuments } from './recentDocuments.js';
import { installRecoverySnapshotBeforeClose, requestRendererRecoverySnapshot } from './recoverySnapshot.js';
import { createSecureSettingsStore, isAllowedSecureSettingKey } from './secureSettingsStore.js';
import { createScreenshotOverlayController } from './screenshotOverlayController.js';
import { createGlobalCaptureControllers } from './globalCaptureControllers.js';
import { createImageDerivativeWorker } from './imageDerivativeWorker.js';
import { buildLegacyFileSavePathEnv, createStorageRoots } from './storageRoots.js';
import { runToolCapture } from './toolCapture.js';
import { createUpdaterController } from './updaterController.js';
import { extractPreviewVideoUrlFromNotes, normalizeUpdaterInfoPayload } from './updaterInfoNormalizer.js';
import { createUpdateInstallPreparation } from './updateInstallPreparation.js';
import { createProjectPackageController } from './projectPackageController.js';
import { createExternalPackageTickets } from './externalPackageTickets.js';
import {
  createSystemNotificationSoundFileService,
  listNotificationSoundMp3Files,
} from './notificationSoundFiles.js';
import { createBackgroundCompletionNotifier } from './backgroundCompletionNotification.js';
import { createNodeExportController } from './nodeExportController.js';
import { createLegacyRendererStorageMigration } from './legacyRendererStorageMigration.js';
import { activateMainWindow } from './mainWindowActivation.js';
import { createMainIpcHandlerInstaller } from './ipc/mainIpcSetup.js';
import { createLocalRuntimeKeepAliveController } from './localRuntimeKeepAlive.js';
import { configureRendererResponsiveness } from './rendererResponsiveness.js';
import { createRemoteAssetImporter } from './remoteAssetImport.js';
import { buildRuntimePythonCertificateEnv } from './runtimeAssetResolver.js';
import { createWebPreviewViewManager } from './webPreviewViewManager.js';
import { createMediaTaskRuntime } from './mediaTaskRuntime.js';
import {
  buildDefaultProjectPath,
  clearRecoverySnapshotIfMatches,
  findFirstSupportedProjectPathFromArgs,
  findRecentProject,
  getRecoverySnapshotInfo,
  listRecentProjects,
  readProjectJson,
  readRecoverySnapshot,
  removeRecentProject,
  sanitizeProjectName,
  stripProjectFileExtension,
  SUPPORTED_PROJECT_FILE_EXTENSIONS,
  upsertRecentProject,
  withJsonProjectExtension,
  writeProjectJson,
  writeRecoverySnapshot,
} from '../src/services/desktopProjectFileStore.js';
import { registerIpcHandlers } from './ipc/registerIpcHandlers.js';
let APP_DISPLAY_NAME = 'Canvas';
const APP_DATA_DIRECTORY_NAME = /^canvas$/iu.test(app.getName() || '')
  ? // Production keeps its historical folder, so an existing install keeps its projects and
    // settings. Note the packaged name is 'canvas' from package.json, not the product name.
    'AI CanvasPro'
  : // A side-by-side test build carries its own productName in package.json (see
    // electron-builder.win.dev.cjs), so it gets its own folder instead of sharing data.
    app.getName() || 'AI CanvasPro',
  APP_USER_DATA_ROOT = process.env.AIC_USER_DATA_ROOT
    ? path.resolve(process.env.AIC_USER_DATA_ROOT)
    : path.join(app.getPath('appData'), APP_DATA_DIRECTORY_NAME),
  __filename = fileURLToPath(import.meta.url),
  __dirname = path.dirname(__filename),
  APP_ROOT = app.isPackaged ? app.getAppPath() : path.resolve(__dirname, '..'),
  RUNTIME_ROOT = app.isPackaged
    ? path.join(process.resourcesPath, 'runtime')
    : path.join(APP_ROOT, '.electron-runtime', 'runtime'),
  STORAGE_ROOTS = createStorageRoots({
    appIsPackaged: app.isPackaged,
    appRoot: APP_ROOT,
    processExecPath: process.execPath,
    userDataRoot: APP_USER_DATA_ROOT,
    localAppData: process.env.LOCALAPPDATA,
    storageRootOverride: process.env.AIC_STORAGE_ROOT,
  }),
  PACKAGED_INSTALL_ROOT = STORAGE_ROOTS.installRoot,
  PACKAGED_INSTALL_DATA_ROOT = STORAGE_ROOTS.installDataRoot,
  PACKAGED_FILES_ROOT = STORAGE_ROOTS.storageRoot,
  LEGACY_PACKAGED_FILES_ROOTS = STORAGE_ROOTS.legacyFilesRoots,
  LEGACY_PACKAGED_FILES_ROOT = LEGACY_PACKAGED_FILES_ROOTS[0] || (process.env.AIC_STORAGE_ROOT ? PACKAGED_FILES_ROOT : APP_ROOT),
  HOST = '127.0.0.1',
  PORT = Number.parseInt(process.env.AICANVAS_PORT || '8777', 10) || 0x2249,
  APP_ORIGIN = 'http://' + HOST + ':' + PORT,
  APP_URL = APP_ORIGIN + '/',
  SERVER_READY_TIMEOUT_MS = 0x7530,
  SERVER_READY_INTERVAL_MS = 0x190,
  LOCAL_ACCESS_TOKEN = randomBytes(32).toString('hex'),
  SERVER_ID_HEADER = 'x-aicanvas-server',
  SERVER_ID_VALUE = APP_DISPLAY_NAME,
  LOCAL_PREVIEW_SCHEME = 'aic-local-preview',
  LOCAL_PREVIEW_TTL_MS = 12 * 60 * 60 * 0x3e8,
  CLIPBOARD_FILE_REFERENCES_FORMAT = 'application/x-ai-canvas-file-references',
  RECOVERY_SNAPSHOT_FILENAME = 'recovery-snapshot.json',
  GLOBAL_SCREENSHOT_ACCELERATOR = 'Alt+Q',
  GLOBAL_CAPTURE_LAUNCHER_ACCELERATOR = 'Control+Alt+Shift+C',
  SERVER_RESTART_BASE_DELAY_MS = 0x3e8,
  SERVER_RESTART_MAX_DELAY_MS = 0x7530,
  SERVER_RESTART_MAX_ATTEMPTS = 0x5;
let mainWindow = null,
  spawnedServer = null,
  serverRestartTimer = null,
  serverRestartAttempts = 0,
  serverShutdownRequested = false,
  updaterHandlersInstalled = false,
  updateCheckStarted = false,
  autoUpdaterInstance = null,
  updaterController = null,
  localApiTokenHeaderInstalled = false,
  latestUpdaterEvent = null,
  latestUpdaterInfo = null,
  backendRestartInProgress = false,
  mediaTaskHistory = null,
  localAssetCleanupManager = null,
  assetUpdateEvents = createAssetUpdateEventBuffer(),
  secureSettingsStore = null,
  updateInstallPreparation = null;
const desktopStartupLifecycle = createDesktopStartupLifecycle({
  app, getSpawnedServer: () => spawnedServer, probeServer: () => probeServer(),
  clearPortBeforeStart: () => clearPortBeforeStart(), ensureServerRunning: () => ensureServerRunning(),
});
const desktopQuitCoordinator = createDesktopQuitCoordinator({
  app, getMainWindow: () => mainWindow,
  shouldBypassClose: () => isQuittingForUpdate,
  beginShutdown: () => desktopStartupLifecycle.beginQuit(),
  onError: error => logDiagnosticEvent({ type: 'app.shutdown_cleanup_failed', level: 'warn', source: 'main', error }),
  cleanup: () => runCleanupSteps([
    () => localRuntimeKeepAlive.stop(),
    () => backgroundCompletionNotifier.dispose(),
    () => screenshotOverlayController.uninstallGlobalScreenshotShortcut(),
    () => screenshotOverlayController.destroyScreenshotOverlayWindow(),
    () => globalShortcut.unregisterAll(),
    () => globalCaptureWindowController.destroy(),
    () => stopSpawnedServer(),
    () => stopAllPowerSaveBlockers(),
  ], { onError: error => logDiagnosticEvent({ type: 'app.shutdown_cleanup_failed', level: 'warn', source: 'main', error }) }),
});
function isDragImportProfilingEnabled() {
  return /^(1|true|yes|on)$/i.test(String(process.env.AIC_DRAG_IMPORT_PROFILING || '').trim());
}
function logDragImportProfile(_0x360efc, _0x31e2f1 = {}) {
  if (!isDragImportProfilingEnabled()) return;
  console.log('[drag-import-prof] ' + _0x360efc, _0x31e2f1);
}
function isAssetImportLoggingEnabled() {
  return /^(1|true|yes|on)$/i.test(String(process.env.AIC_ASSET_IMPORT_LOG || '').trim());
}
let rendererProjectState = { hasUnsavedChanges: false, projectName: '' },
  isQuittingForUpdate = false;
const pendingExternalProjectOpenRequests = [],
  externalPackageTickets = createExternalPackageTickets(),
  taskbarProgressSources = new Map(),
  powerSaveBlockerReasons = new Map();
(configureRendererResponsiveness(app),
  protocol.registerSchemesAsPrivileged([
    {
      scheme: LOCAL_PREVIEW_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
    },
  ]),
  app.setName(APP_DISPLAY_NAME));
const USER_DATA_DIR = APP_USER_DATA_ROOT;
(mkdirSync(USER_DATA_DIR, { recursive: true }), app.setPath('userData', USER_DATA_DIR));
const GOT_SINGLE_INSTANCE_LOCK = app.requestSingleInstanceLock();
!GOT_SINGLE_INSTANCE_LOCK && (app.exit(0), process.exit(0));
const LOG_DIR = path.join(USER_DATA_DIR, 'logs'),
  SERVER_LOG_PATH = path.join(LOG_DIR, 'server.log'),
  WINDOW_STATE_PATH = path.join(USER_DATA_DIR, 'window-state.json');
mkdirSync(LOG_DIR, { recursive: true });
const DEFAULT_WINDOW_STATE = { width: 0x5a0, height: 0x3c0, isMaximized: false },
  diagnostics = createDiagnosticsManager({
    app: app,
    logDir: LOG_DIR,
    diagnosticsDir: path.join(LOG_DIR, 'diagnostics'),
    serverLogPath: SERVER_LOG_PATH,
    getMetadata: async () => ({
      app: {
        name: APP_DISPLAY_NAME,
        version: readAppVersionFromIndexHtml() || app.getVersion(),
        packaged: app.isPackaged,
        appPathType: app.isPackaged ? 'packaged' : 'development',
      },
      runtime: {
        electron: process.versions.electron || '',
        chrome: process.versions.chrome || '',
        node: process.versions.node || '',
        v8: process.versions.v8 || '',
      },
      backend: {
        url: APP_URL,
        spawned: Boolean(spawnedServer),
        pid: spawnedServer?.pid || null,
        ready: await probeServer(),
      },
      updater: {
        ...(updaterController?.getState?.() || {}),
        latestEvent: latestUpdaterEvent || null,
        latestInfo: latestUpdaterInfo || null,
      },
      paths: { logs: 'userData/logs', diagnostics: 'userData/logs/diagnostics or Downloads' },
    }),
  }),
  screenshotOverlayController = createScreenshotOverlayController({
    appRoot: APP_ROOT,
    dirname: __dirname,
    accelerator: GLOBAL_SCREENSHOT_ACCELERATOR,
    getMainWindow: () => mainWindow,
    focusCanvas: () => focusMainWindow(),
    logDiagnosticEvent: logDiagnosticEvent,
  });
const { globalCaptureWindowController, globalTextPresetShortcutController } = createGlobalCaptureControllers({
  dirname: __dirname,
  accelerator: GLOBAL_CAPTURE_LAUNCHER_ACCELERATOR,
  globalShortcutApi: globalShortcut,
  focusCanvas: () => focusMainWindow(),
  getMainWindow: () => mainWindow,
  logDiagnosticEvent: logDiagnosticEvent,
});
diagnostics.ensureInitialFiles();
function logDiagnosticEvent(_0x5dc451 = {}) {
  return diagnostics.logEvent(_0x5dc451);
}
const localRuntimeKeepAlive = createLocalRuntimeKeepAliveController({
  getWindow: () => mainWindow,
  requestLocalJson: requestLocalJson,
  setPowerSaveBlocker: setPowerSaveBlocker,
  logDiagnosticEvent: logDiagnosticEvent,
});
function normalizeTaskbarProgress(_0x12dd54) {
  const _0x320f3a = Number(_0x12dd54);
  if (!Number.isFinite(_0x320f3a) || _0x320f3a < 0) return null;
  return Math.max(0, Math.min(1, _0x320f3a));
}
function refreshTaskbarProgress() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const _0x5c55aa = taskbarProgressSources.get('updater') ?? taskbarProgressSources.get('media') ?? null;
  mainWindow.setProgressBar(_0x5c55aa == null ? -1 : _0x5c55aa);
}
function setTaskbarProgressSource(_0x1ace5a, _0x1e326e) {
  const _0x3b8d56 = String(_0x1ace5a || '').trim();
  if (!_0x3b8d56) return;
  const _0x4055bf = normalizeTaskbarProgress(_0x1e326e);
  (_0x4055bf == null
    ? taskbarProgressSources.delete(_0x3b8d56)
    : taskbarProgressSources.set(_0x3b8d56, _0x4055bf),
    refreshTaskbarProgress());
}
function setPowerSaveBlocker(_0x189f5f, _0x3f65a8, _0x38a89c = 'prevent-display-sleep') {
  const _0x27e6c7 = String(_0x189f5f || '').trim();
  if (!_0x27e6c7) return;
  const _0x3b3ccf =
    _0x38a89c === 'prevent-app-suspension' ? 'prevent-app-suspension' : 'prevent-display-sleep';
  if (_0x3f65a8) {
    if (powerSaveBlockerReasons.has(_0x27e6c7)) return;
    const _0x152e9a = powerSaveBlocker.start(_0x3b3ccf);
    (powerSaveBlockerReasons.set(_0x27e6c7, _0x152e9a),
      logDiagnosticEvent({
        type: 'power_save_blocker.started',
        level: 'info',
        source: 'main',
        message: 'Power save blocker started',
        context: { reason: _0x27e6c7, blockerId: _0x152e9a, type: _0x3b3ccf },
      }));
    return;
  }
  const _0x45f1cf = powerSaveBlockerReasons.get(_0x27e6c7);
  if (_0x45f1cf == null) return;
  powerSaveBlockerReasons.delete(_0x27e6c7);
  try {
    powerSaveBlocker.isStarted(_0x45f1cf) && powerSaveBlocker.stop(_0x45f1cf);
  } catch (_0x4c4cc9) {
    console.warn('[electron] failed to stop power save blocker:', _0x4c4cc9);
  }
  logDiagnosticEvent({
    type: 'power_save_blocker.stopped',
    level: 'info',
    source: 'main',
    message: 'Power save blocker stopped',
    context: { reason: _0x27e6c7, blockerId: _0x45f1cf },
  });
}
function stopAllPowerSaveBlockers() {
  for (const _0xbf5f5 of [...powerSaveBlockerReasons.keys()]) {
    setPowerSaveBlocker(_0xbf5f5, false);
  }
}
function normalizeWindowState(_0x108899) {
  const _0x1c2365 = _0x108899 && typeof _0x108899 === 'object' ? _0x108899 : {},
    _0x331df0 = _0x1c2365.bounds && typeof _0x1c2365.bounds === 'object' ? _0x1c2365.bounds : _0x1c2365,
    _0x295587 = Number.parseInt(_0x331df0.width, 10),
    _0x521588 = Number.parseInt(_0x331df0.height, 10),
    _0x202349 = Number.parseInt(_0x331df0.x, 10),
    _0x23fe8c = Number.parseInt(_0x331df0.y, 10),
    _0x3825a6 = {
      width: Number.isFinite(_0x295587) && _0x295587 >= 0x400 ? _0x295587 : DEFAULT_WINDOW_STATE.width,
      height: Number.isFinite(_0x521588) && _0x521588 >= 0x2d0 ? _0x521588 : DEFAULT_WINDOW_STATE.height,
      isMaximized: _0x1c2365.isMaximized === true,
    };
  return (
    Number.isFinite(_0x202349) &&
      Number.isFinite(_0x23fe8c) &&
      ((_0x3825a6.x = _0x202349), (_0x3825a6.y = _0x23fe8c)),
    _0x3825a6
  );
}
function isWindowStateOnDisplay(_0x3bf012) {
  if (!Number.isFinite(_0x3bf012?.x) || !Number.isFinite(_0x3bf012?.y)) return true;
  const _0x2a1ed1 = { x: _0x3bf012.x, y: _0x3bf012.y, width: _0x3bf012.width, height: _0x3bf012.height };
  return screen.getAllDisplays().some(({ workArea: _0x4b15f }) => {
    return (
      _0x2a1ed1.x < _0x4b15f.x + _0x4b15f.width &&
      _0x2a1ed1.x + _0x2a1ed1.width > _0x4b15f.x &&
      _0x2a1ed1.y < _0x4b15f.y + _0x4b15f.height &&
      _0x2a1ed1.y + _0x2a1ed1.height > _0x4b15f.y
    );
  });
}
function readWindowState() {
  try {
    const _0x121fb6 = normalizeWindowState(JSON.parse(readFileSync(WINDOW_STATE_PATH, 'utf8')));
    return (!isWindowStateOnDisplay(_0x121fb6) && (delete _0x121fb6.x, delete _0x121fb6.y), _0x121fb6);
  } catch {
    return { ...DEFAULT_WINDOW_STATE };
  }
}
function writeWindowState(_0x36b286) {
  if (!_0x36b286 || _0x36b286.isDestroyed()) return;
  const _0x41daad = _0x36b286.getBounds(),
    _0x429ea2 = normalizeWindowState({ ..._0x41daad, isMaximized: _0x36b286.isMaximized() }),
    _0x31dd01 = WINDOW_STATE_PATH + '.' + process.pid + '.' + Date.now() + '.tmp';
  try {
    (mkdirSync(path.dirname(WINDOW_STATE_PATH), { recursive: true }),
      writeFileSync(_0x31dd01, JSON.stringify(_0x429ea2, null, 2) + '\n', 'utf8'),
      renameSync(_0x31dd01, WINDOW_STATE_PATH));
  } catch (_0x19d5c9) {
    console.warn('[electron] failed to save window state:', _0x19d5c9);
  }
}
function installWindowStatePersistence(_0x1bfc6b) {
  let _0x501a6e = null;
  const _0x17bed2 = () => {
    if (_0x501a6e) clearTimeout(_0x501a6e);
    _0x501a6e = setTimeout(() => {
      ((_0x501a6e = null), writeWindowState(_0x1bfc6b));
    }, 0x190);
  };
  (_0x1bfc6b.on('move', _0x17bed2),
    _0x1bfc6b.on('resize', _0x17bed2),
    _0x1bfc6b.on('maximize', _0x17bed2),
    _0x1bfc6b.on('unmaximize', _0x17bed2),
    _0x1bfc6b.on('close', () => {
      (_0x501a6e && (clearTimeout(_0x501a6e), (_0x501a6e = null)), writeWindowState(_0x1bfc6b));
    }));
}
const { delay, loadStartupStatus, isLocalAppUrl, openExternalUrl } = createStartupHelpers({
  appDisplayName: () => APP_DISPLAY_NAME,
  appOrigin: APP_ORIGIN,
  getMainWindow: () => mainWindow,
  logDiagnosticEvent: logDiagnosticEvent,
  shellApi: shell,
  normalizeExternalUrl: normalizeExternalUrl,
  formatExternalUrlForLog: formatExternalUrlForLog,
});
function probeServer(_0x1837ce = 0x4b0) {
  return new Promise((_0x5164e0) => {
    const _0x35c039 = http.get(APP_ORIGIN + '/api/v2/runtime/info', { timeout: _0x1837ce, headers: { 'X-AIC-Local-Token': LOCAL_ACCESS_TOKEN } }, (_0x2aa121) => {
      const _0xc711b1 = String(_0x2aa121.headers[SERVER_ID_HEADER] || '');
      (_0x2aa121.resume(), _0x5164e0(_0x2aa121.statusCode === 200 && _0xc711b1 === SERVER_ID_VALUE));
    });
    (_0x35c039.on('timeout', () => {
      (_0x35c039.destroy(), _0x5164e0(false));
    }),
      _0x35c039.on('error', () => {
        _0x5164e0(false);
      }));
  });
}
function requestLocalJson(_0x52adc2, _0x3c3cdb = 0x640) {
  return new Promise((_0x3219d9, _0x19bd8c) => {
    const _0x2869fe = http.request(
      {
        hostname: HOST,
        port: PORT,
        path: _0x52adc2,
        method: 'GET',
        timeout: _0x3c3cdb,
        headers: { 'X-AIC-Local-Token': LOCAL_ACCESS_TOKEN },
      },
      (_0x4d8f32) => {
        const _0x439deb = [];
        (_0x4d8f32.on('data', (_0x5bfeb0) => _0x439deb.push(Buffer.from(_0x5bfeb0))),
          _0x4d8f32.on('end', () => {
            const _0x528203 = Buffer.concat(_0x439deb).toString('utf8');
            if (_0x4d8f32.statusCode < 200 || _0x4d8f32.statusCode >= 0x12c) {
              _0x19bd8c(new Error(_0x528203 || 'HTTP ' + _0x4d8f32.statusCode));
              return;
            }
            try {
              _0x3219d9(_0x528203 ? JSON.parse(_0x528203) : {});
            } catch (_0x4d8814) {
              _0x19bd8c(_0x4d8814);
            }
          }));
      },
    );
    (_0x2869fe.on('timeout', () => {
      _0x2869fe.destroy(new Error('Local service request timed out'));
    }),
      _0x2869fe.on('error', _0x19bd8c),
      _0x2869fe.end());
  });
}
async function refreshProductDisplayName() {
  try {
    const response = await requestLocalJson('/api/client-config?refresh=1', 8000);
    const config = response?.data && typeof response.data === 'object' ? response.data : response;
    const displayName = String(config?.product_display_name || config?.productDisplayName || '')
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .trim()
      .slice(0, 80);
    if (!displayName) return;
    APP_DISPLAY_NAME = displayName;
    app.setName(APP_DISPLAY_NAME);
    if (mainWindow && !mainWindow.isDestroyed()) {
      updateMainWindowUnsavedState(mainWindow);
      const payload = JSON.stringify({ displayName: APP_DISPLAY_NAME });
      void mainWindow.webContents
        .executeJavaScript(`window.dispatchEvent(new CustomEvent('canvas:product-display-name', { detail: ${payload} }));`)
        .catch(() => {});
    }
  } catch {}
}
async function clearPortBeforeStart(_0x2f1d77 = null) {
  if (process.env.AIC_DISABLE_PORT_RECLAIM === '1') {
    if (!await probeTcpPortAvailable({ host: HOST, port: PORT })) throw new Error('Independent test port is occupied; no existing process was stopped');
    return;
  }
  const _0x1a93c4 = resolveBackendLaunch();
  return reclaimStartupPort({
    port: PORT,
    env: process['env'],
    collectListeningPortPids: collectListeningPortPids,
    probePortAvailable: () => probeTcpPortAvailable({ host: HOST, port: PORT }),
    confirmRuntimeIdentity: async ({ pids: _0x41c8de }) => {
      if (!(await probeServer())) return [];
      return findVerifiedBackendProcessPids({
        pids: _0x41c8de,
        appIsPackaged: app['isPackaged'],
        appRoot: APP_ROOT,
        backendCommand: _0x1a93c4['command'],
        host: HOST,
        port: PORT,
        platform: process['platform'],
        env: process['env'],
      });
    },
    terminateProcess: (_0x4b7f0e) => {
      if (process['platform'] === 'win32') {
        const _0x5c1a92 = resolveWindowsSystemToolPath('taskkill', { env: process['env'] });
        execFileSync(_0x5c1a92, ['/PID', String(_0x4b7f0e), '/F', '/T'], {
          stdio: 'ignore',
          windowsHide: !![],
        });
      } else process['kill'](_0x4b7f0e, 'SIGTERM');
    },
    delayFn: delay,
    onReclaim: () =>
      _0x2f1d77?.({
        kind: 'loading',
        title: APP_DISPLAY_NAME + '\x20正在启动',
        detail: '正在恢复上次未关闭的运行环境。',
        hint: '启动完成后会自动进入画布。',
      }),
    onEnumerationUnavailable: ({ error: _0x3e0b91 }) => {
      logDiagnosticEvent({
        type: 'startup_port.enumeration_unavailable',
        level: 'warn',
        source: 'main',
        message: 'Startup port listener enumeration failed; the port is free, continuing startup',
        context: { port: PORT, resolution: 'port-free-continue', ...(_0x3e0b91?.['details'] || {}) },
      });
    },
  });
}
function resolvePythonCommand() {
  if (!app.isPackaged && process.env.AIC_TEST_PYTHON) return process.env.AIC_TEST_PYTHON;
  if (app.isPackaged) {
    const _0x495dd7 =
      process.platform === 'win32'
        ? [
            path.join(RUNTIME_ROOT, 'python', 'python.exe'),
            path.join(RUNTIME_ROOT, 'python', 'Scripts', 'python.exe'),
          ]
        : [
            path.join(RUNTIME_ROOT, 'python', 'bin', 'python3'),
            path.join(RUNTIME_ROOT, 'python', 'bin', 'python'),
          ];
    return _0x495dd7.find((_0x181c85) => existsSync(_0x181c85)) || _0x495dd7[0];
  }
  const _0x464336 =
    process.platform === 'win32'
      ? [
          path.join(APP_ROOT, 'venv', 'python.exe'),
          path.join(APP_ROOT, 'venv', 'Scripts', 'python.exe'),
          'python',
        ]
      : [
          path.join(APP_ROOT, 'venv', 'bin', 'python3'),
          path.join(APP_ROOT, 'venv', 'bin', 'python'),
          'python3',
          'python',
        ];
  return _0x464336.find((_0x4e4abd) => {
    return path.isAbsolute(_0x4e4abd) ? existsSync(_0x4e4abd) : true;
  });
}
function resolveBackendLaunch() {
  return resolveBackendLaunchSpec({
    appIsPackaged: app['isPackaged'],
    appRoot: APP_ROOT,
    runtimeRoot: RUNTIME_ROOT,
    platform: process['platform'],
    existsSync: existsSync,
    pythonCommand: resolvePythonCommand(),
  });
}
function resolveRuntimeTool(_0x361b25) {
  const _0x1771b =
      process.platform === 'win32' && !_0x361b25.endsWith('.exe') ? _0x361b25 + '.exe' : _0x361b25,
    _0x2777c8 = path.join(RUNTIME_ROOT, 'ffmpeg', 'bin', _0x1771b);
  return existsSync(_0x2777c8) ? _0x2777c8 : '';
}
function buildPackagedServerEnv() {
  const _0x438439 = app.getPath('userData'),
    _0x20ca3d = getStorageRoot();
  return {
    AIC_CLIENT_CONFIG_PATH: path.join(_0x438439, 'client-config.json'),
    AIC_CLIENT_CONFIG_OVERRIDE_PATH: path.join(_0x438439, 'client-config.local.json'),
    AIC_SUBSCRIPTION_STATUS_PATH: path.join(_0x438439, 'subscription-status.json'),
    AIC_USER_DIR: path.join(_0x438439, 'user'),
    AIC_CANVAS_DIR: path.join(_0x20ca3d, 'projects'),
    AIC_DATA_DIR: path.join(_0x20ca3d, 'data'),
    AIC_OUTPUT_DIR: path.join(_0x20ca3d, 'output'),
    AIC_UPLOADS_DIR: path.join(_0x20ca3d, 'data', 'uploads'),
    AIC_ASSETS_DIR: path.join(_0x20ca3d, 'data', 'assets'),
    AIC_WORKFLOWS_DIR: path.join(_0x20ca3d, 'data', 'workflows'),
    ...buildLegacyFileSavePathEnv(LEGACY_PACKAGED_FILES_ROOTS),
    AIC_FFMPEG_EXE: resolveRuntimeTool('ffmpeg'),
    AIC_FFPROBE_EXE: resolveRuntimeTool('ffprobe'),
  };
}
function getStorageRoot() {
  return PACKAGED_FILES_ROOT;
}
function getUserRoot() {
  return path.join(app.getPath('userData'), 'user');
}
const { getStableDeviceId } = createDeviceIdentityManager({
    app: app,
    appRoot: APP_ROOT,
    getUserRoot: getUserRoot,
    isolatedProfile: Boolean(process.env.AIC_USER_DATA_ROOT),
    logEvent: logDiagnosticEvent,
  }),
  webPreviewViewManager = createWebPreviewViewManager({
    WebContentsView: WebContentsView,
    BrowserWindow: BrowserWindow,
    getMainWindow: () => mainWindow,
    openExternalUrl: openExternalUrl,
    createContextMenu: (_0x22307f) => Menu.buildFromTemplate(_0x22307f),
    logDiagnosticEvent: logDiagnosticEvent,
  }),
  importRemoteAssetToLibrary = createRemoteAssetImporter({
    importAssetToLibrary: importAssetToLibrary,
    getWebPreviewEntry: (_0x4ef2b5, _0x449443) => webPreviewViewManager._getEntry(_0x4ef2b5, _0x449443),
    tempRoot: app.getPath('temp'),
  }),
  projectPackageController = createProjectPackageController({
    app: app,
    dialog: dialog,
    getMainWindow: () => mainWindow,
    consumeExternalPackageTicket: (ticket) => externalPackageTickets.consume(ticket),
    getCanvasProjectDir: getCanvasProjectDir,
    getOutputDir: getOutputDir,
    getUploadsDir: getUploadsDir,
    getAssetsDir: getAssetsDir,
    getWorkflowsDir: getWorkflowsDir,
    readAppVersion: () => readAppVersionFromIndexHtml() || app.getVersion(),
    upsertRecentProject: upsertRecentProject,
    getRecentProjectsStorePath: getRecentProjectsStorePath,
    syncSystemRecentDocumentsBestEffort: syncSystemRecentDocumentsBestEffort,
    buildProjectOpenResponse: buildProjectOpenResponse,
  }),
  systemNotificationSoundFiles = createSystemNotificationSoundFileService({
    appRoot: APP_ROOT,
    openPath: (_0x2dfed3) => shell.openPath(_0x2dfed3),
    beep: () => shell.beep(),
    logEvent: logDiagnosticEvent,
  }),
  backgroundCompletionNotifier = createBackgroundCompletionNotifier({
    Notification: Notification,
    globalShortcutApi: globalShortcut,
    getMainWindow: () => mainWindow,
    focusMainWindow: focusMainWindow,
    onClick: (event) =>
      mainWindow &&
      !mainWindow.isDestroyed?.() &&
      mainWindow.webContents?.send?.('notification:generationCompleteClicked', event),
    logEvent: logDiagnosticEvent,
    resolveNotificationIconPath: resolveLocalVirtualPath,
    appName: () => APP_DISPLAY_NAME,
  }),
  nodeExportController = createNodeExportController({
    app: app,
    dialog: dialog,
    getMainWindow: () => mainWindow,
    resolveLocalVirtualPath: resolveLocalVirtualPath,
    getNodeExportRoots: getNodeExportRoots,
    getRuntimeToolOrFallback: getRuntimeToolOrFallback,
    openPath: (target) => shell.openPath(target),
  }),
  legacyRendererStorageMigration = createLegacyRendererStorageMigration({
    userDataDir: USER_DATA_DIR,
    appUrl: APP_URL,
  }),
  foregroundDialogs = createForegroundDialogPresenter({
    app: app,
    dialog: dialog,
    getMainWindow: () => mainWindow,
    shouldUseOwnerWindow: () => false,
  }),
  installIpcHandlers = createMainIpcHandlerInstaller({
    registerIpcHandlers: registerIpcHandlers,
    context: {
      app: app,
      readAppVersionFromIndexHtml: readAppVersionFromIndexHtml,
      getStableDeviceId: getStableDeviceId,
      getUpdaterController: getUpdaterController,
      getBackgroundCompletionNotifier: () => backgroundCompletionNotifier,
      getSecureSettingsStore: getSecureSettingsStore,
      normalizeSecureSettingsKeys: normalizeSecureSettingsKeys,
      fileReferencesFormat: CLIPBOARD_FILE_REFERENCES_FORMAT,
      createClipboardNativeImage: createClipboardNativeImage,
      screenshotOverlayController: screenshotOverlayController,
      globalTextPresetShortcutController: globalTextPresetShortcutController,
      globalCaptureWindowController: globalCaptureWindowController,
      normalizeClipboardFileReferences: normalizeClipboardFileReferences,
      parseClipboardFileReferencesFromText: parseClipboardFileReferencesFromText,
      openDesktopProject: openDesktopProject,
      saveDesktopProject: saveDesktopProject,
      ...projectPackageController,
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
      consumeAssetUpdateEvents: () => assetUpdateEvents.consume(),
      getDataDir: getDataDir,
      createLocalPreviewUrl: createLocalPreviewUrl,
      resolveLocalVirtualPath: resolveLocalVirtualPath,
      getNodeExportWindow: () => mainWindow,
      isNodeExportAppUrl: isLocalAppUrl,
      getTimelineExportTool: getRuntimeToolOrFallback,
      getNodeExportRoots: getNodeExportRoots,
      resolveKnownFolder: resolveKnownFolder,
      openExternalUrl: openExternalUrl,
      getWebPreviewViewManager: () => webPreviewViewManager,
      selectDirectory: selectDirectory,
      listNotificationSoundMp3Files: listNotificationSoundMp3Files,
      ...systemNotificationSoundFiles,
      ...nodeExportController,
      readLegacyRendererStorageMigration: () => legacyRendererStorageMigration.read(),
      completeLegacyRendererStorageMigration: (payload) => legacyRendererStorageMigration.complete(payload),
      getMediaTaskQueue: getMediaTaskQueue,
      getMediaTaskHistory: getMediaTaskHistory,
      getLocalAssetCleanupManager: getLocalAssetCleanupManager,
      diagnostics: diagnostics,
      logDir: LOG_DIR,
      logDiagnosticEvent: logDiagnosticEvent,
      showOpenDialog: (options) => foregroundDialogs['showOpenDialog'](options),
      openFolder: (folderPath) =>
        openShellFolder(folderPath, { shellApi: shell, logEvent: logDiagnosticEvent }),
      getCanvasProjectDir: getCanvasProjectDir,
      showSaveDialog: (options) => foregroundDialogs['showSaveDialog'](options),
      getRecoverySnapshotPath: getRecoverySnapshotPath,
      writeRecoverySnapshotFile: (snapshotPath, payload) => writeRecoverySnapshot(snapshotPath, payload),
      getRecoverySnapshotFileInfo: (snapshotPath, options) => getRecoverySnapshotInfo(snapshotPath, options),
      readRecoverySnapshotFile: (snapshotPath) => readRecoverySnapshot(snapshotPath),
      removeRecoverySnapshotFile: (snapshotPath) => {
        const info = getRecoverySnapshotInfo(snapshotPath);
        if (!info?.exists) return;
        if (info.invalid)
          throw Object.assign(new Error('恢复快照无法识别，已保留原文件'), {
            code: 'RECOVERY_SNAPSHOT_PROTECTED',
          });
        const snapshot = readRecoverySnapshot(snapshotPath);
        const result = clearRecoverySnapshotIfMatches(snapshotPath, {
          projectId: snapshot?.projectId || '',
          revision: snapshot?.revision || '',
        });
        if (!result?.cleared)
          throw Object.assign(new Error('恢复快照身份已变化，未删除'), {
            code: 'RECOVERY_SNAPSHOT_PROTECTED',
          });
      },
    },
  });
function readConfiguredUserSettingsSync() {
  if (process.env.AIC_USER_DATA_ROOT) return readUserSettingsFromFilesSync([path.join(getUserRoot(), 'settings.json')]);
  const _0x313bd1 = process.env.LOCALAPPDATA || app.getPath('userData');
  return readUserSettingsFromFilesSync([
    path.join(getUserRoot(), 'settings.json'),
    path.join(APP_ROOT, 'user', 'settings.json'),
    path.join(_0x313bd1, 'AI-CanvasPro', 'settings.json'),
  ]);
}
function readConfiguredFileSavePathsSync() {
  const _0x1752c3 = readConfiguredUserSettingsSync()?.fileSavePaths;
  return _0x1752c3 && typeof _0x1752c3 === 'object' ? _0x1752c3 : {};
}
function getConfiguredPath(_0x5a9030, _0x344d0e) {
  const _0x2396ed = String(readConfiguredFileSavePathsSync()?.[_0x5a9030] || '').trim();
  return _0x2396ed ? path.resolve(_0x2396ed) : _0x344d0e;
}
function getDataDir() {
  const _0x5e50f6 = readConfiguredFileSavePathsSync(),
    _0x11472 = String(_0x5e50f6?.dataDir || '').trim();
  if (_0x11472) return path.resolve(_0x11472);
  const _0x3f05c1 = String(_0x5e50f6?.tempDir || '').trim();
  if (_0x3f05c1) {
    const _0x2d25ab = path.resolve(_0x3f05c1);
    return path.basename(_0x2d25ab).toLowerCase() === 'uploads' ? path.dirname(_0x2d25ab) : _0x2d25ab;
  }
  return path.join(getStorageRoot(), 'data');
}
function getCanvasProjectDir() {
  return getConfiguredPath('canvasDir', path.join(getStorageRoot(), 'projects'));
}
function getRecentProjectsStorePath() {
  return path.join(app.getPath('userData'), 'recent-projects.json');
}
function getSecureSettingsStorePath() {
  return path.join(app.getPath('userData'), 'secure-settings.json');
}
function getRecoverySnapshotPath() {
  return path.join(app.getPath('userData'), RECOVERY_SNAPSHOT_FILENAME);
}
function getUploadsDir() {
  const _0x2f3eb3 = readConfiguredFileSavePathsSync();
  if (!String(_0x2f3eb3?.dataDir || '').trim() && String(_0x2f3eb3?.tempDir || '').trim())
    return path.resolve(_0x2f3eb3.tempDir);
  return path.join(getDataDir(), 'uploads');
}
function getOutputDir() {
  return getConfiguredPath('outputDir', path.join(getStorageRoot(), 'output'));
}
function getAssetsDir() {
  return path.join(getDataDir(), 'assets');
}
function getWorkflowsDir() {
  return path.join(getDataDir(), 'workflows');
}
function getFunasrModelRootDir() {
  return resolveFunasrModelRootDir(readConfiguredUserSettingsSync(), { fallbackDataDir: getDataDir() });
}
function getNodeExportRoots() {
  return { 'data/assets/': getAssetsDir(), 'data/uploads/': getUploadsDir(), 'output/': getOutputDir() };
}
function sanitizeUploadFilename(_0x37401a) {
  const _0x56794b = path.basename(String(_0x37401a || 'upload'));
  return _0x56794b.replace(/[\\/:*?"<>|]/g, '_').trim() || 'upload';
}
function allocateUniqueUploadPath(_0x90d177, _0x1b3578) {
  const _0xfc28b4 = sanitizeUploadFilename(_0x1b3578),
    _0x118a3b = path.parse(_0xfc28b4),
    _0x268c9b = _0x118a3b.name || 'upload',
    _0x1ebf0c = _0x118a3b.ext || '',
    _0x49aa7d = Date.now();
  for (let _0x12814b = 0; _0x12814b < 0x3e8; _0x12814b += 1) {
    const _0x3d8a3b =
        _0x12814b === 0
          ? _0xfc28b4
          : _0x268c9b + '_' + _0x49aa7d + '_' + String(_0x12814b).padStart(3, '0') + _0x1ebf0c,
      _0x3cc922 = path.join(_0x90d177, _0x3d8a3b);
    if (!existsSync(_0x3cc922))
      return { safeFilename: _0xfc28b4, storedFilename: _0x3d8a3b, targetPath: _0x3cc922 };
  }
  throw new Error('Unable to allocate unique upload filename');
}
let assetCapabilityOperations = null;
function getAssetCapabilityOperations() {
  if (assetCapabilityOperations) return assetCapabilityOperations;
  return (
    (assetCapabilityOperations = createAssetCapabilityOperations({
      getAssetsDir: getAssetsDir,
      getMediaTaskQueue: getMediaTaskQueue,
      createImageFromPath: (_0x77de3b) => nativeImage.createFromPath(_0x77de3b),
      createImageDerivatives: createImageDerivativeWorker({ BrowserWindow: BrowserWindow }),
      probeVideoPlaybackInfo: mediaTaskRuntime['probeVideoPlaybackInfoForImport'],
      publishAssetUpdate: (_0x32e876) => {
        assetUpdateEvents.push(_0x32e876);
        mainWindow?.webContents?.send('asset:updated', _0x32e876);
      },
      shouldBufferAssetUpdates: () => false,
      isImportLoggingEnabled: isAssetImportLoggingEnabled,
    })),
    assetCapabilityOperations
  );
}
function toAssetLocalPath(..._0x2b272) {
  return getAssetCapabilityOperations().toAssetLocalPath(..._0x2b272);
}
function updateAssetRecord(_0x641c55, _0x3cc888, _0x1b6d0a = {}) {
  return getAssetCapabilityOperations().updateAssetRecord(_0x641c55, _0x3cc888, _0x1b6d0a);
}
function sendAssetUpdated(_0x25fef6) {
  return getAssetCapabilityOperations().sendAssetUpdated(_0x25fef6);
}
function importAssetToLibrary(_0xefcc02 = {}) {
  return getAssetCapabilityOperations().importAssetToLibrary(_0xefcc02);
}
function isImageImportPayload(_0x58c09b = {}, _0x538515 = '') {
  const _0x2072c3 = String(_0x58c09b?.type || '').toLowerCase();
  if (_0x2072c3.startsWith('image/')) return true;
  return /\.(?:png|jpe?g|webp|gif|bmp|avif)$/i.test(String(_0x538515 || ''));
}
const localPreviewProtocolRuntime = createLocalPreviewProtocolRuntime({
  protocol: protocol,
  scheme: LOCAL_PREVIEW_SCHEME,
  appOrigin: APP_ORIGIN,
  ttlMs: LOCAL_PREVIEW_TTL_MS,
  resolveLocalVirtualPath: resolveLocalVirtualPath,
});
function createLocalPreviewUrl(_0x5199a4 = {}) {
  return localPreviewProtocolRuntime['createUrl'](_0x5199a4);
}
function installLocalPreviewProtocol() {
  localPreviewProtocolRuntime['install']();
}
function resizeImageToMaxEdge(_0x23ae91, _0x1aa5ab) {
  const _0x175281 = _0x23ae91.getSize(),
    _0x4dad55 = Number(_0x175281.width) || 0,
    _0x36012f = Number(_0x175281.height) || 0;
  if (_0x4dad55 <= 0 || _0x36012f <= 0) return null;
  const _0x4ac961 = Math.max(_0x4dad55, _0x36012f);
  if (_0x4ac961 <= _0x1aa5ab) return _0x23ae91;
  const _0xa8ff64 = _0x1aa5ab / _0x4ac961;
  return _0x23ae91.resize({
    width: Math.max(1, Math.round(_0x4dad55 * _0xa8ff64)),
    height: Math.max(1, Math.round(_0x36012f * _0xa8ff64)),
    quality: 'best',
  });
}
function writeLocalImageDerivatives(_0x94f1cb, _0x5c57d8, _0xf725ba) {
  const _0x59f3aa = nativeImage.createFromPath(_0xf725ba),
    _0x45d2b8 = _0x59f3aa.getSize(),
    _0x5b48fa = Number(_0x45d2b8.width) || 0,
    _0x277a8d = Number(_0x45d2b8.height) || 0;
  if (_0x59f3aa.isEmpty() || _0x5b48fa <= 0 || _0x277a8d <= 0) return {};
  const _0x1f5817 = path.parse(_0x5c57d8).name || 'image',
    _0x4b5a6b = path.join('_derived', 'display', _0x1f5817 + '.display.png'),
    _0x4a6d9e = path.join('_derived', 'thumb', _0x1f5817 + '.thumb.png'),
    _0x1f2ef3 = path.join(_0x94f1cb, _0x4b5a6b),
    _0x1bad9e = path.join(_0x94f1cb, _0x4a6d9e);
  (mkdirSync(path.dirname(_0x1f2ef3), { recursive: true }),
    mkdirSync(path.dirname(_0x1bad9e), { recursive: true }));
  const _0x5d70ff = resizeImageToMaxEdge(_0x59f3aa, 0x500),
    _0x39b01e = resizeImageToMaxEdge(_0x59f3aa, 0x140);
  if (!_0x5d70ff || !_0x39b01e) return {};
  (writeFileSync(_0x1f2ef3, _0x5d70ff.toPNG()), writeFileSync(_0x1bad9e, _0x39b01e.toPNG()));
  const _0x46da48 = 'data/uploads/' + _0x5c57d8,
    _0x23a605 = 'data/uploads/' + _0x4b5a6b.replace(/\\/g, '/'),
    _0x45da1a = 'data/uploads/' + _0x4a6d9e.replace(/\\/g, '/');
  return {
    localPath: _0x46da48,
    originalLocalPath: _0x46da48,
    displayLocalPath: _0x23a605,
    thumbLocalPath: _0x45da1a,
    originalWidth: _0x5b48fa,
    originalHeight: _0x277a8d,
    originalUrl: '/' + _0x46da48,
    displayUrl: '/' + _0x23a605,
    thumbUrl: '/' + _0x45da1a,
  };
}
function getRuntimeToolOrFallback(_0x3f1481) {
  return resolveRuntimeTool(_0x3f1481) || _0x3f1481;
}
function getMediaTaskHistory() {
  if (!mediaTaskHistory)
    mediaTaskHistory = new MediaTaskHistoryStore({ storageRoot: STORAGE_ROOTS.storageRoot });
  return mediaTaskHistory;
}
class MediaTaskQueueWithHistory extends MediaTaskQueue {
  constructor(options) {
    super({
      ...options,
      onSnapshot: (snapshot, task) => getMediaTaskHistory().observe(snapshot, task),
    });
  }
}
const mediaTaskRuntime = createMediaTaskRuntime({
  appRoot: APP_ROOT,
  platform: process.platform,
  env: process.env,
  getRuntimeToolOrFallback: getRuntimeToolOrFallback,
  getAssetsDir: getAssetsDir,
  getOutputDir: getOutputDir,
  resolveLocalVirtualPath: resolveLocalVirtualPath,
  updateAssetRecord: updateAssetRecord,
  sendAssetUpdated: sendAssetUpdated,
  setTaskbarProgressSource: setTaskbarProgressSource,
  setPowerSaveBlocker: setPowerSaveBlocker,
  NotificationCtor: Notification,
  focusMainWindow: focusMainWindow,
  publishTaskUpdate: (_0x4f9c1d) => mainWindow?.webContents?.send('mediaTask:update', _0x4f9c1d),
  getDoubaoAsrConfig: () => resolveDoubaoAsrConfig(),
  getBailianAsrConfig: () => resolveBailianAsrConfig(),
  getPythonCertificateEnv: getRuntimePythonCertificateEnv,
  getFunasrModelRootDir: getFunasrModelRootDir,
  getUserDataRoot: () => app.getPath('userData'),
  resolveFallbackPythonCommand: resolveMediaTaskFallbackPythonCommand,
  resolvePythonCommand: resolveMediaTaskPythonCommand,
  MediaTaskQueueCtor: MediaTaskQueueWithHistory,
});
function getMediaTaskQueue() {
  return mediaTaskRuntime['getQueue']();
}
function getRuntimePythonCertificateEnv() {
  return buildRuntimePythonCertificateEnv({
    runtimeRoot: RUNTIME_ROOT,
    existsSync: existsSync,
    readdirSync: readdirSync,
    env: process.env,
  });
}
function resolveMediaTaskFallbackPythonCommand() {
  return resolvePreferredRuntimePythonCommand({
    existsSync: existsSync,
    fallbackCommand: resolvePythonCommand(),
    platform: process.platform,
    runtimeRoot: RUNTIME_ROOT,
  });
}
function resolveMediaTaskPythonCommand() {
  return resolveAsrRuntimePythonCommand({
    userDataRoot: app.getPath('userData'),
    existsSync: existsSync,
    readFileSync: readFileSync,
    fallbackCommand: resolveMediaTaskFallbackPythonCommand(),
    platform: process.platform,
  });
}
async function generateAssetVideoPoster(_0x1f7495) {
  const _0x3eaf68 = resolveLocalVirtualPath(_0x1f7495.originalLocalPath);
  if (!_0x3eaf68) throw new Error('Invalid video asset path');
  const _0x45ce2d = path.join(getAssetsDir(), 'derived', 'video');
  mkdirSync(_0x45ce2d, { recursive: true });
  const _0x5424ea = path.join(_0x45ce2d, _0x1f7495.assetId + '.poster.jpg');
  return (
    !existsSync(_0x5424ea) &&
      (await runToolCapture(
        getRuntimeToolOrFallback('ffmpeg'),
        ['-y', '-ss', '0.1', '-i', _0x3eaf68, '-frames:v', '1', '-vf', 'scale=640:-2', _0x5424ea],
        { cwd: APP_ROOT },
      )),
    { posterLocalPath: toAssetLocalPath('derived', 'video', _0x1f7495.assetId + '.poster.jpg') }
  );
}
function buildWaveformJsonFromFloat32(_0x1715d6, _0x521205 = 190) {
  const _0x323812 = _0x1715d6.buffer.slice(_0x1715d6.byteOffset, _0x1715d6.byteOffset + _0x1715d6.byteLength),
    _0x48f1e6 = new Float32Array(_0x323812, 0, Math.floor(_0x1715d6.byteLength / 4)),
    _0x119c77 = _0x48f1e6.length,
    _0x51b86c = Math.max(40, Math.min(0x190, Number(_0x521205) || 190)),
    _0x243f58 = Math.max(1, Math.floor(_0x119c77 / _0x51b86c)),
    _0x1e3c2e = [];
  for (let _0x559b9a = 0; _0x559b9a < _0x51b86c; _0x559b9a += 1) {
    const _0x1ef408 = _0x559b9a * _0x243f58,
      _0x284800 = Math.min(_0x119c77, _0x1ef408 + _0x243f58);
    let _0x5d2800 = 0;
    for (let _0x3c6f38 = _0x1ef408; _0x3c6f38 < _0x284800; _0x3c6f38 += 1) {
      const _0x49814f = Math.abs(Number(_0x48f1e6[_0x3c6f38]) || 0);
      if (_0x49814f > _0x5d2800) _0x5d2800 = _0x49814f;
    }
    _0x1e3c2e.push(Number(Math.min(1, _0x5d2800).toFixed(4)));
  }
  return { version: 1, samples: _0x51b86c, peaks: _0x1e3c2e };
}
async function generateAssetAudioWaveform(_0x55fe24) {
  const _0x4ee89b = resolveLocalVirtualPath(_0x55fe24.originalLocalPath);
  if (!_0x4ee89b) throw new Error('Invalid audio asset path');
  const _0x4a4b1b = path.join(getAssetsDir(), 'derived', 'audio');
  mkdirSync(_0x4a4b1b, { recursive: true });
  const _0x28fac6 = path.join(_0x4a4b1b, _0x55fe24.assetId + '.waveform.json');
  if (!existsSync(_0x28fac6)) {
    const _0x181b3b = await runToolCapture(
      getRuntimeToolOrFallback('ffmpeg'),
      ['-v', 'error', '-i', _0x4ee89b, '-ac', '1', '-ar', '8000', '-f', 'f32le', 'pipe:1'],
      { cwd: APP_ROOT },
    );
    writeFileSync(_0x28fac6, JSON.stringify(buildWaveformJsonFromFloat32(_0x181b3b)) + '\n', 'utf8');
  }
  return { waveformLocalPath: toAssetLocalPath('derived', 'audio', _0x55fe24.assetId + '.waveform.json') };
}
function importLocalFileToUploads(_0x20e1cd = {}) {
  const _0x41da73 = Date.now(),
    _0x1c58b9 = String(_0x20e1cd?.path || '').trim();
  logDragImportProfile('main:import:start', {
    t: _0x41da73,
    name: _0x20e1cd?.name || '',
    type: _0x20e1cd?.type || '',
    sourcePath: _0x1c58b9,
  });
  if (!_0x1c58b9) throw new Error('缺少文件路径');
  if (!path.isAbsolute(_0x1c58b9)) throw new Error('文件路径必须是绝对路径');
  const _0x3ead90 = realpathSync(_0x1c58b9),
    _0x7b5fbb = statSync(_0x3ead90);
  if (!_0x7b5fbb.isFile()) throw new Error('只支持导入文件');
  const _0x397223 = getUploadsDir();
  mkdirSync(_0x397223, { recursive: true });
  const {
      safeFilename: _0x2de28a,
      storedFilename: _0x3df3c5,
      targetPath: _0x4e3975,
    } = allocateUniqueUploadPath(_0x397223, _0x20e1cd?.name || path.basename(_0x3ead90)),
    _0x2bed01 = Date.now();
  (logDragImportProfile('main:copy:start', {
    t: _0x2bed01,
    sourceRealPath: _0x3ead90,
    targetPath: _0x4e3975,
    size: _0x7b5fbb.size,
  }),
    copyFileSync(_0x3ead90, _0x4e3975),
    logDragImportProfile('main:copy:done', {
      t: Date.now(),
      elapsedMs: Date.now() - _0x2bed01,
      targetPath: _0x4e3975,
    }));
  const _0x326ca4 = 'data/uploads/' + _0x3df3c5,
    _0x5ccbeb = Date.now();
  isImageImportPayload(_0x20e1cd, _0x3ead90) &&
    logDragImportProfile('main:derivative:start', { t: _0x5ccbeb, targetPath: _0x4e3975 });
  const _0x303f59 = isImageImportPayload(_0x20e1cd, _0x3ead90)
    ? writeLocalImageDerivatives(_0x397223, _0x3df3c5, _0x4e3975)
    : {};
  isImageImportPayload(_0x20e1cd, _0x3ead90) &&
    logDragImportProfile('main:derivative:done', {
      t: Date.now(),
      elapsedMs: Date.now() - _0x5ccbeb,
      displayLocalPath: _0x303f59.displayLocalPath || '',
      thumbLocalPath: _0x303f59.thumbLocalPath || '',
      originalWidth: _0x303f59.originalWidth || 0,
      originalHeight: _0x303f59.originalHeight || 0,
    });
  const _0x19a3d8 = {
    success: true,
    url: '/' + _0x326ca4,
    localPath: _0x326ca4,
    ..._0x303f59,
    filename: _0x2de28a,
    storedFilename: _0x3df3c5,
    size: _0x7b5fbb.size,
    type: String(_0x20e1cd?.type || ''),
  };
  return (
    logDragImportProfile('main:import:done', {
      t: Date.now(),
      elapsedMs: Date.now() - _0x41da73,
      localPath: _0x19a3d8.localPath,
      displayLocalPath: _0x19a3d8.displayLocalPath || '',
      thumbLocalPath: _0x19a3d8.thumbLocalPath || '',
    }),
    _0x19a3d8
  );
}
function installLocalApiTokenHeader() {
  if (localApiTokenHeaderInstalled) return;
  ((localApiTokenHeaderInstalled = true),
    session.defaultSession.webRequest.onBeforeSendHeaders(
      { urls: [APP_ORIGIN + '/*', 'http://localhost:' + PORT + '/*'] },
      (_0x329894, _0x8bf78f) => {
        _0x8bf78f({
          requestHeaders: { ..._0x329894.requestHeaders, 'X-AIC-Local-Token': LOCAL_ACCESS_TOKEN },
        });
      },
    ));
}
async function waitForServerReady(_0x1ca88f = null) {
  const _0x15991e = Date.now();
  while (Date.now() - _0x15991e < SERVER_READY_TIMEOUT_MS) {
    desktopStartupLifecycle.assertStarting();
    if (await probeServer()) { desktopStartupLifecycle.assertStarting(); return true; }
    const _0x53bc8d = Date.now() - _0x15991e;
    (_0x1ca88f?.({
      kind: 'loading',
      title: APP_DISPLAY_NAME + ' 正在启动',
      detail: '正在准备画布环境。',
      hint:
        '已等待 ' +
        Math.ceil(_0x53bc8d / 0x3e8) +
        ' 秒，预计最多需要 ' +
        Math.ceil(SERVER_READY_TIMEOUT_MS / 0x3e8) +
        ' 秒。',
    }),
      await delay(SERVER_READY_INTERVAL_MS));
  }
  return false;
}
// The local backend can die on its own (crash, killed from Task Manager, port stolen).
// Nothing used to bring it back, so the renderer stayed on the disconnect banner until the
// app was restarted by hand. Re-spawn with capped exponential backoff instead.
function scheduleServerRestart() {
  if (serverShutdownRequested || serverRestartTimer) return;
  if (serverRestartAttempts >= SERVER_RESTART_MAX_ATTEMPTS) {
    logDiagnosticEvent({
      type: 'backend.restart_exhausted',
      level: 'error',
      source: 'main',
      message: 'Local Python service restart attempts exhausted',
      context: { attempts: serverRestartAttempts, port: PORT },
    });
    return;
  }
  const attempt = serverRestartAttempts + 0x1,
    delayMs = Math['min'](SERVER_RESTART_BASE_DELAY_MS * Math['pow'](0x2, serverRestartAttempts), SERVER_RESTART_MAX_DELAY_MS);
  serverRestartAttempts = attempt;
  logDiagnosticEvent({
    type: 'backend.restart_scheduled',
    level: 'warn',
    source: 'main',
    message: 'Local Python service exited; scheduling restart',
    context: { attempt: attempt, delayMs: delayMs, port: PORT },
  });
  serverRestartTimer = setTimeout(() => {
    serverRestartTimer = null;
    if (serverShutdownRequested || spawnedServer) return;
    void ensureServerRunning()
      .then(() => {
        serverRestartAttempts = 0;
        logDiagnosticEvent({
          type: 'backend.restart_succeeded',
          level: 'info',
          source: 'main',
          message: 'Local Python service restarted',
          context: { attempt: attempt, port: PORT },
        });
      })
      .catch((_0x5c2f18) => {
        logDiagnosticEvent({
          type: 'backend.restart_failed',
          level: 'error',
          source: 'main',
          message: 'Local Python service restart failed',
          error: _0x5c2f18,
          context: { attempt: attempt, port: PORT },
        });
        scheduleServerRestart();
      });
  }, delayMs);
  if (typeof serverRestartTimer['unref'] === 'function') serverRestartTimer['unref']();
}
async function ensureServerRunning(_0x4c8dab = null) {
  desktopStartupLifecycle.assertStarting();
  _0x4c8dab?.({
    kind: 'loading',
    title: APP_DISPLAY_NAME + ' 正在启动',
    detail: '正在准备画布环境。',
    hint: '启动完成后会自动进入画布。',
  });
  if (await probeServer())
    return (
      _0x4c8dab?.({
        kind: 'loading',
        title: APP_DISPLAY_NAME + ' 正在启动',
        detail: '正在打开画布。',
        hint: '',
      }),
      'reused'
    );
  desktopStartupLifecycle.assertStarting();
  const _0x247828 = resolvePythonCommand();
  _0x4c8dab?.({
    kind: 'loading',
    title: APP_DISPLAY_NAME + ' 正在启动',
    detail: '正在加载本地工作环境。',
    hint: '启动完成后会自动进入画布。',
  });
  const _0x4ca931 = createWriteStream(SERVER_LOG_PATH, { flags: 'a' });
  _0x4ca931.write(
    '\n[' +
      new Date().toISOString() +
      '] starting ' +
      _0x247828 +
      ' server.py --host=' +
      HOST +
      ' --port=' +
      PORT +
      '\n',
  );
  let _0x52dc35 = null;
  let launchedServer = null;
  ((launchedServer = spawnedServer = spawn(_0x247828, ['server.py', '--host=' + HOST, '--port=' + PORT], {
    cwd: APP_ROOT,
    env: {
      ...process.env,
      AICANVAS_PORT: String(PORT),
      AIC_LOCAL_TOKEN: LOCAL_ACCESS_TOKEN,
      ...buildPackagedServerEnv(),
      ...(app.isPackaged
        ? {
            AIC_SUBSCRIPTION_API_BASE: '',
            AIC_ALLOW_SUBSCRIPTION_API_OVERRIDE: '',
            AIC_DEV_MODE: '',
          }
        : {}),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })),
    launchedServer.stdout?.pipe(_0x4ca931, { end: false }),
    launchedServer.stderr?.pipe(_0x4ca931, { end: false }),
    launchedServer.once('spawn', () => {
      if (desktopQuitCoordinator.isQuitting()) stopSpawnedServerProcess(launchedServer);
    }),
    launchedServer.once('error', (_0x4f5417) => {
      ((_0x52dc35 = _0x4f5417),
        _0x4ca931.write(
          '[' +
            new Date().toISOString() +
            '] spawn error: ' +
            (_0x4f5417?.stack || _0x4f5417?.message || _0x4f5417) +
            '\n',
        ),
        logDiagnosticEvent({
          type: 'backend.spawn_error',
          level: 'error',
          source: 'main',
          message: 'Failed to spawn local Python service',
          error: _0x4f5417,
          context: { command: _0x247828, port: PORT },
        }),
        _0x4c8dab?.({
          kind: 'error',
          title: APP_DISPLAY_NAME + ' 启动失败',
          detail: '启动本地工作环境失败。',
          hint: '请重启应用，若仍失败请导出诊断日志。',
        }));
    }),
    launchedServer.once('close', (_0x4daa93, _0x2ae6fd) => {
      (_0x4ca931.write(
        '[' +
          new Date().toISOString() +
          '] exited code=' +
          (_0x4daa93 ?? '') +
          ' signal=' +
          (_0x2ae6fd ?? '') +
          '\n',
      ),
        _0x4ca931.end(),
        (_0x4daa93 !== 0 || _0x2ae6fd) &&
          logDiagnosticEvent({
            type: 'backend.exited',
            level: 'warn',
            source: 'main',
            message: 'Local Python service exited',
            context: { code: _0x4daa93, signal: _0x2ae6fd, port: PORT },
          }),
        (spawnedServer === launchedServer && (spawnedServer = null)),
        serverShutdownRequested || scheduleServerRestart());
    }));
  const _0x69f021 = await waitForServerReady(_0x4c8dab);
  if (!_0x69f021) {
    (stopSpawnedServer(),
      logDiagnosticEvent({
        type: 'backend.ready_timeout',
        level: 'error',
        source: 'main',
        message: 'Local Python service did not become ready',
        context: { appUrl: APP_URL, timeoutMs: SERVER_READY_TIMEOUT_MS },
      }));
    if (_0x52dc35)
      throw new Error('Failed to start ' + APP_DISPLAY_NAME + ' server: ' + (_0x52dc35.message || _0x52dc35));
    throw new Error(APP_DISPLAY_NAME + ' server did not become ready at ' + APP_URL);
  }
  return (
    // A ready backend clears the backoff so a later crash gets a full retry budget again.
    (serverRestartAttempts = 0),
    _0x4c8dab?.({
      kind: 'loading',
      title: APP_DISPLAY_NAME + ' 正在启动',
      detail: '正在打开画布。',
      hint: '',
    }),
    'started'
  );
}
function stopSpawnedServer() {
  serverShutdownRequested = true;
  if (serverRestartTimer) (clearTimeout(serverRestartTimer), (serverRestartTimer = null));
  if (!spawnedServer || (serverRestartAttempts === 0 && spawnedServer.killed)) return;
  try {
    stopSpawnedServerProcess(spawnedServer, {
      platform: process.platform,
      env: process.env,
    });
  } catch {
  } finally {
    spawnedServer = null;
  }
}
function focusMainWindow() {
  return activateMainWindow({ app: app, window: mainWindow });
}
function normalizeVirtualLocalPath(_0x3d0848) {
  const _0x48a40e = String(_0x3d0848 || '').trim();
  if (!_0x48a40e) return '';
  if (/^(?:file|javascript|data|blob):/i.test(_0x48a40e)) return '';
  if (/^https?:/i.test(_0x48a40e))
    try {
      const _0x54e018 = new URL(_0x48a40e),
        _0x1e95a0 = String(_0x54e018.hostname || '').toLowerCase();
      if (
        _0x1e95a0 !== 'localhost' &&
        _0x1e95a0 !== '127.0.0.1' &&
        _0x1e95a0 !== '::1' &&
        _0x1e95a0 !== '[::1]'
      )
        return '';
      return normalizeVirtualLocalPath(_0x54e018.pathname);
    } catch {
      return '';
    }
  const _0x1e271c = _0x48a40e.replace(/\\/g, '/');
  if (/^[a-z][a-z0-9+.-]*:/i.test(_0x1e271c)) return '';
  if (/^[a-zA-Z]:\//.test(_0x1e271c) || _0x1e271c.startsWith('//')) return '';
  let _0x4c6153 = _0x1e271c.split(/[?#]/, 1)[0];
  try {
    _0x4c6153 = decodeURIComponent(_0x4c6153);
  } catch {}
  const _0x46ae0c = path.posix.normalize(_0x4c6153.replace(/^\/+/, ''));
  if (!_0x46ae0c || _0x46ae0c === '.' || _0x46ae0c === '..' || _0x46ae0c.startsWith('../')) return '';
  if (
    !_0x46ae0c.startsWith('data/assets/') &&
    !_0x46ae0c.startsWith('data/uploads/') &&
    !_0x46ae0c.startsWith('output/')
  )
    return '';
  return _0x46ae0c;
}
function resolveLocalVirtualPath(_0x58ee55) {
  const _0x3805dd = normalizeVirtualLocalPath(_0x58ee55);
  if (!_0x3805dd) return '';
  const _0x3d6711 = [
    ['data/assets/', getAssetsDir()],
    ['data/uploads/', getUploadsDir()],
    ['output/', getOutputDir()],
  ];
  for (const [_0x102d98, _0x563725] of _0x3d6711) {
    if (!_0x3805dd.startsWith(_0x102d98)) continue;
    return resolveExistingPathWithinRoot(_0x563725, _0x3805dd.slice(_0x102d98.length));
  }
  return '';
}
function getSecureSettingsStore() {
  return (
    !secureSettingsStore &&
      (secureSettingsStore = createSecureSettingsStore({
        filePath: getSecureSettingsStorePath(),
        safeStorage: safeStorage,
      })),
    secureSettingsStore
  );
}
const resolveDoubaoAsrConfig = createDoubaoAsrConfigResolver({
    appRoot: process.env.AIC_USER_DATA_ROOT ? APP_USER_DATA_ROOT : APP_ROOT,
    getSecureSettingsStore: getSecureSettingsStore,
    getUserRoot: getUserRoot,
    processEnv: process.env,
  }),
  resolveBailianAsrConfig = createBailianAsrConfigResolver({
    getSecureSettingsStore: getSecureSettingsStore,
    getUserRoot: getUserRoot,
  });
function normalizeSecureSettingsKeys(_0x1dd1d4 = {}) {
  const _0x1ce6f4 = Array.isArray(_0x1dd1d4?.keys) ? _0x1dd1d4.keys : [_0x1dd1d4?.key];
  return _0x1ce6f4.map((_0x2f6168) => String(_0x2f6168 || '').trim()).filter(isAllowedSecureSettingKey);
}
function syncSystemRecentDocumentsBestEffort() {
  if (process.env.AIC_USER_DATA_ROOT) return { ok: true, count: 0, paths: [], skipped: 'independent-profile' };
  try {
    return syncRecentProjectsToSystemRecentDocuments({
      app: app,
      recentStorePath: getRecentProjectsStorePath(),
    });
  } catch (_0x243ee6) {
    return (
      console.warn('[electron] sync recent documents failed:', _0x243ee6),
      { ok: false, error: String(_0x243ee6?.message || _0x243ee6), count: 0, paths: [] }
    );
  }
}
function resolveClipboardAbsoluteFilePath(_0x16c93b) {
  let _0x504e40 = String(_0x16c93b || '').trim();
  if (!_0x504e40) return '';
  _0x504e40 = _0x504e40.replace(/^"|"$/g, '');
  if (/^file:\/\//i.test(_0x504e40))
    try {
      _0x504e40 = fileURLToPath(_0x504e40);
    } catch {
      return '';
    }
  if (!path.isAbsolute(_0x504e40)) return '';
  try {
    const _0x301a62 = realpathSync(_0x504e40),
      _0x17fd3e = statSync(_0x301a62);
    return _0x17fd3e.isFile() ? _0x301a62 : '';
  } catch {
    return '';
  }
}
function resolveClipboardImagePath(_0x3fb8c9 = {}) {
  const _0x130e5f = resolveClipboardAbsoluteFilePath(_0x3fb8c9?.absolutePath);
  if (_0x130e5f) return _0x130e5f;
  const _0x18e1f9 = String(_0x3fb8c9?.localPath || '').trim();
  if (!_0x18e1f9) return '';
  const _0x9ecb23 = resolveLocalVirtualPath(_0x18e1f9);
  if (!_0x9ecb23) return '';
  try {
    const _0x219dfd = statSync(_0x9ecb23);
    return _0x219dfd.isFile() ? _0x9ecb23 : '';
  } catch {
    return '';
  }
}
function createClipboardNativeImage(_0x5d120a = {}) {
  const _0x1d8570 = String(_0x5d120a?.pngBase64 || '').trim();
  if (_0x1d8570) return nativeImage.createFromBuffer(Buffer.from(_0x1d8570, 'base64'));
  const _0x23bfd7 = resolveClipboardImagePath(_0x5d120a);
  if (!_0x23bfd7) return nativeImage.createEmpty();
  return nativeImage.createFromPath(_0x23bfd7);
}
function getMimeTypeForClipboardFile(_0x5b06f7) {
  const _0x356e62 = path.extname(String(_0x5b06f7 || '')).toLowerCase(),
    _0x4d376b = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.avif': 'image/avif',
      '.mp4': 'video/mp4',
      '.m4v': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.ogg': 'audio/ogg',
      '.flac': 'audio/flac',
      '.txt': 'text/plain',
    };
  return _0x4d376b[_0x356e62] || 'application/octet-stream';
}
function buildClipboardFileMeta(_0x4d6d5f) {
  const _0x936a2e = statSync(_0x4d6d5f);
  return {
    path: _0x4d6d5f,
    name: path.basename(_0x4d6d5f),
    type: getMimeTypeForClipboardFile(_0x4d6d5f),
    size: Number(_0x936a2e.size || 0) || 0,
  };
}
function normalizeClipboardFileReferences(_0x53fbaf = []) {
  const _0x1ec3cd = new Set(),
    _0x49d00d = [];
  return (
    (Array.isArray(_0x53fbaf) ? _0x53fbaf : [_0x53fbaf]).forEach((_0x99f40d) => {
      const _0x4eaa71 = _0x99f40d && typeof _0x99f40d === 'object' ? _0x99f40d.path : _0x99f40d,
        _0xdd83a6 = resolveClipboardAbsoluteFilePath(_0x4eaa71);
      if (!_0xdd83a6) return;
      const _0x501bc0 =
        process.platform === 'win32' || process.platform === 'darwin' ? _0xdd83a6.toLowerCase() : _0xdd83a6;
      if (_0x1ec3cd.has(_0x501bc0)) return;
      (_0x1ec3cd.add(_0x501bc0), _0x49d00d.push(buildClipboardFileMeta(_0xdd83a6)));
    }),
    _0x49d00d
  );
}
function parseClipboardFileReferencesFromText(_0x447eec) {
  const _0x2e6960 = String(_0x447eec || '')
    .split(/\r?\n/)
    .map((_0x21a8ae) => _0x21a8ae.trim())
    .filter(Boolean);
  return normalizeClipboardFileReferences(_0x2e6960);
}
function resolveKnownFolder(_0x127dee) {
  const _0x1f6b8d = String(_0x127dee || '').trim();
  if (_0x1f6b8d === 'assets') return getAssetsDir();
  if (_0x1f6b8d === 'output') return getOutputDir();
  if (_0x1f6b8d === 'project') return getCanvasProjectDir();
  return '';
}
function getLocalAssetCleanupManager() {
  if (localAssetCleanupManager) return localAssetCleanupManager;
  return (
    (localAssetCleanupManager = createLocalAssetCleanupManager({
      trashItem: (_0x1713d9) => shell.trashItem(_0x1713d9),
      getRoots: createLocalAssetCleanupRootsResolver({
        appIsPackaged: app.isPackaged,
        legacyFilesRoot: LEGACY_PACKAGED_FILES_ROOT,
        storageRoot: getStorageRoot(),
        readCurrentFileSavePaths: () =>
          readFileSavePathsForLocalCleanup({
            requestLocalJson: requestLocalJson,
            logDiagnosticEvent: logDiagnosticEvent,
          }),
        getCurrentDefaults: () => ({
          canvasDir: getCanvasProjectDir(),
          outputDir: getOutputDir(),
          dataDir: getDataDir(),
          uploadsDir: getUploadsDir(),
          assetsDir: getAssetsDir(),
          workflowsDir: getWorkflowsDir(),
          workflowThumbsDir: path.join(getWorkflowsDir(), 'thumbs'),
          recentProjectsStorePath: getRecentProjectsStorePath(),
          recoverySnapshotPath: getRecoverySnapshotPath(),
        }),
      }),
    })),
    localAssetCleanupManager
  );
}
function getProjectDialogFilters() {
  return [
    {
      name: 'Canvas Project',
      extensions: SUPPORTED_PROJECT_FILE_EXTENSIONS.map((_0x51baab) => _0x51baab.replace(/^\./, '')),
    },
  ];
}
function normalizePositiveTimestamp(_0x1f86c6) {
  const _0x489db1 = Number(_0x1f86c6);
  return Number.isFinite(_0x489db1) && _0x489db1 > 0 ? Math.round(_0x489db1) : 0;
}
function getFileLastModified(_0x17a399) {
  const _0x33ea5a = String(_0x17a399 || '').trim();
  if (!_0x33ea5a || !path.isAbsolute(_0x33ea5a)) return 0;
  try {
    const _0x77d132 = statSync(_0x33ea5a);
    return _0x77d132.isFile() ? Math.round(_0x77d132.mtimeMs) : 0;
  } catch {
    return 0;
  }
}
function resolveCurrentProjectLastModified(_0x33d2ee = {}, _0x5e1dd4 = {}) {
  const _0x284254 = [
      normalizePositiveTimestamp(_0x33d2ee?.lastKnownProjectLastModified ?? _0x33d2ee?.lastModified),
    ],
    _0x30b028 = String(_0x33d2ee?.recentId || _0x5e1dd4?.recentId || '').trim();
  if (_0x30b028) {
    const _0x493e20 = findRecentProject(getRecentProjectsStorePath(), _0x30b028);
    (_0x284254.push(normalizePositiveTimestamp(_0x493e20?.lastModified)),
      _0x284254.push(getFileLastModified(_0x493e20?.path)));
  }
  return (
    _0x284254.push(getFileLastModified(_0x33d2ee?.displayPath)),
    _0x284254.push(getFileLastModified(_0x5e1dd4?.displayPath)),
    Math.max(0, ..._0x284254)
  );
}
function getDesktopRecoverySnapshotInfo(_0x319d75 = {}) {
  const _0x40903c = getRecoverySnapshotPath(),
    _0x13ab4b = readRecoverySnapshot(_0x40903c),
    _0x28530e = resolveCurrentProjectLastModified(_0x319d75, _0x13ab4b || {});
  return getRecoverySnapshotInfo(_0x40903c, { currentLastModified: _0x28530e });
}
function writeDesktopRecoverySnapshot(_0x43cb2f = {}) {
  const _0x1da14c = writeRecoverySnapshot(getRecoverySnapshotPath(), _0x43cb2f);
  return {
    success: true,
    savedAt: _0x1da14c.savedAt,
    projectId: _0x1da14c.projectId,
    projectName: _0x1da14c.projectName,
  };
}
function readDesktopRecoverySnapshot() {
  const _0x2c0a6c = readRecoverySnapshot(getRecoverySnapshotPath());
  if (!_0x2c0a6c) return { success: false, exists: false, canceled: false };
  return {
    success: true,
    exists: true,
    canceled: false,
    recovery: true,
    projectId: _0x2c0a6c.projectId,
    projectName: _0x2c0a6c.projectName,
    filename: _0x2c0a6c.filename,
    recentId: _0x2c0a6c.recentId,
    displayPath: _0x2c0a6c.displayPath,
    lastModified: _0x2c0a6c.lastKnownProjectLastModified,
    recoverySavedAt: _0x2c0a6c.savedAt,
    data: _0x2c0a6c.data,
  };
}
function clearDesktopRecoverySnapshot(expected = {}) {
  return clearRecoverySnapshotIfMatches(getRecoverySnapshotPath(), expected);
}
function normalizeWindowProjectName(_0x105cee) {
  return String(_0x105cee || '')
    .replace(/\s+/g, ' ')
    .trim();
}
function updateMainWindowUnsavedState(_0x1caf6a = mainWindow) {
  if (!_0x1caf6a || _0x1caf6a.isDestroyed()) return;
  const _0x142fbb = rendererProjectState.hasUnsavedChanges === true,
    _0x2b3c89 = normalizeWindowProjectName(rendererProjectState.projectName),
    _0x59b0dc = _0x2b3c89 ? _0x2b3c89 + ' - ' + APP_DISPLAY_NAME : APP_DISPLAY_NAME;
  _0x1caf6a.setTitle('' + _0x59b0dc + (_0x142fbb ? ' *' : ''));
  try {
    _0x1caf6a.setDocumentEdited(_0x142fbb);
  } catch {}
}
function handleRendererUnsavedState(_0x4da546 = {}) {
  ((rendererProjectState = {
    hasUnsavedChanges: _0x4da546?.hasUnsavedChanges === true || _0x4da546?.dirty === true,
    projectName: normalizeWindowProjectName(_0x4da546?.projectName),
  }),
    updateMainWindowUnsavedState());
}
function buildProjectOpenResponse(_0x4924ea, _0xd347d2, _0x520db5) {
  const _0x32ced4 = _0x520db5?.filename || path.basename(_0x4924ea),
    _0x535a94 = _0x520db5?.name || stripProjectFileExtension(_0x32ced4);
  return {
    success: true,
    canceled: false,
    projectId: stripProjectFileExtension(_0x32ced4),
    projectName: _0x535a94,
    filename: _0x32ced4,
    recentId: _0x520db5?.recentId || '',
    displayPath: _0x520db5?.displayPath || _0x4924ea,
    lastModified: Number(_0x520db5?.lastModified || 0) || 0,
    data: _0xd347d2,
  };
}
function openProjectFileByPath(_0x5ca01c, { source: source = 'dialog' } = {}) {
  const _0x336931 = path.resolve(String(_0x5ca01c || '')),
    _0x1470f3 = readProjectJson(_0x336931),
    _0x108db2 = upsertRecentProject(getRecentProjectsStorePath(), _0x336931, {
      name: stripProjectFileExtension(path.basename(_0x336931)),
    });
  return (
    syncSystemRecentDocumentsBestEffort(),
    { ...buildProjectOpenResponse(_0x336931, _0x1470f3, _0x108db2), source: source }
  );
}
function enqueueExternalProjectOpenRequest(_0x5117a6) {
  if (!_0x5117a6 || typeof _0x5117a6 !== 'object') return;
  (pendingExternalProjectOpenRequests.push({ ..._0x5117a6, queuedAt: Date.now() }),
    mainWindow?.webContents?.send('project:externalOpenAvailable'));
}
function findFirstSupportedProjectPackagePathFromArgs(_0x313dc0) {
  const _0x24be12 = Array.isArray(_0x313dc0) ? _0x313dc0 : [];
  for (const _0x175433 of _0x24be12) {
    const _0x996145 = String(_0x175433 || '')
      .trim()
      .replace(/^"|"$/g, '');
    if (!_0x996145 || !path.isAbsolute(_0x996145) || path.extname(_0x996145).toLowerCase() !== '.aicpkg')
      continue;
    try {
      if (statSync(_0x996145).isFile()) return path.resolve(_0x996145);
    } catch {}
  }
  return '';
}
function queueExternalProjectOpenPath(_0x21dd9b, _0x45bd5a) {
  const _0x3005a4 = findFirstSupportedProjectPackagePathFromArgs([_0x21dd9b]),
    _0x1c0d2b = _0x3005a4 || findFirstSupportedProjectPathFromArgs([_0x21dd9b], { mustExist: true });
  if (!_0x1c0d2b) return false;
  try {
    (enqueueExternalProjectOpenRequest(
      _0x3005a4
        ? externalPackageTickets.issueRequest(_0x1c0d2b, _0x45bd5a)
        : openProjectFileByPath(_0x1c0d2b, { source: _0x45bd5a }),
    ),
      logDiagnosticEvent({
        type: 'project.external_open_queued',
        level: 'info',
        source: 'main',
        message: 'External project open queued',
        context: { source: _0x45bd5a, filePath: _0x1c0d2b },
      }));
  } catch (_0x5a3bc6) {
    (logDiagnosticEvent({
      type: 'project.external_open_failed',
      level: 'error',
      source: 'main',
      message: 'External project open failed',
      error: _0x5a3bc6,
      context: { source: _0x45bd5a, filePath: _0x1c0d2b },
    }),
      enqueueExternalProjectOpenRequest({
        success: false,
        canceled: false,
        source: _0x45bd5a,
        ...(_0x3005a4 ? {} : { filePath: _0x1c0d2b }),
        filename: path.basename(_0x1c0d2b),
        error: String(_0x5a3bc6?.message || _0x5a3bc6),
      }));
  }
  return true;
}
function queueExternalProjectOpenFromArgs(_0x41c42f, _0x89aa78) {
  const _0x353451 =
    findFirstSupportedProjectPackagePathFromArgs(_0x41c42f) ||
    findFirstSupportedProjectPathFromArgs(_0x41c42f, { mustExist: true });
  return _0x353451 ? queueExternalProjectOpenPath(_0x353451, _0x89aa78) : false;
}
async function openDesktopProject(_0xc1f192 = {}) {
  const _0x4b7162 = getRecentProjectsStorePath(),
    _0x24c047 = String(_0xc1f192?.recentId || '').trim();
  let _0x180de5 = '';
  if (_0x24c047) {
    const _0x3a70b5 = findRecentProject(_0x4b7162, _0x24c047);
    if (!_0x3a70b5) throw new Error('最近项目不存在');
    if (!_0x3a70b5.exists) throw new Error('最近项目文件不存在');
    _0x180de5 = _0x3a70b5.path;
  } else {
    mkdirSync(getCanvasProjectDir(), { recursive: true });
    const _0x1c11ba = await foregroundDialogs['showOpenDialog']({
      title: '打开项目',
      defaultPath: getCanvasProjectDir(),
      properties: ['openFile'],
      filters: getProjectDialogFilters(),
    });
    if (_0x1c11ba.canceled || !_0x1c11ba.filePaths?.[0]) return { success: false, canceled: true };
    _0x180de5 = _0x1c11ba.filePaths[0];
  }
  return openProjectFileByPath(_0x180de5, { source: _0x24c047 ? 'recent' : 'dialog' });
}
function normalizeDialogOptionText(_0x1ba3f4, _0x2861fa = '', _0x1f48d4 = 180) {
  const _0x36c1f0 = String(_0x1ba3f4 || '')
    .replace(/\0/g, '')
    .trim();
  if (!_0x36c1f0) return _0x2861fa;
  return _0x36c1f0.slice(0, _0x1f48d4);
}
async function selectDirectory(_0x29dc3e = {}) {
  const _0xb57192 = normalizeDialogOptionText(_0x29dc3e?.title, '选择保存目录', 80),
    _0x393ca2 = normalizeDialogOptionText(_0x29dc3e?.defaultPath, '', 0x400),
    _0x1d2d94 = { title: _0xb57192, properties: ['openDirectory', 'createDirectory'] };
  if (_0x393ca2) _0x1d2d94.defaultPath = _0x393ca2;
  const _0x517886 = await foregroundDialogs['showOpenDialog'](_0x1d2d94);
  if (_0x517886.canceled || !_0x517886.filePaths?.[0]) return { success: false, canceled: true };
  return { success: true, canceled: false, path: _0x517886.filePaths[0] };
}
async function saveDesktopProject(_0x443ccd = {}) {
  const _0x3ce1b3 = getRecentProjectsStorePath(),
    _0x59bc62 = String(_0x443ccd?.mode || 'save').trim() === 'saveAs' ? 'saveAs' : 'save',
    _0x19b19f = sanitizeProjectName(_0x443ccd?.projectName || _0x443ccd?.projectId || '未命名画布');
  let _0xb557a0 = '';
  if (_0x59bc62 === 'save') {
    const _0xae3c5b = String(_0x443ccd?.recentId || '').trim(),
      _0x54ef11 = _0xae3c5b ? findRecentProject(_0x3ce1b3, _0xae3c5b) : null;
    _0xb557a0 = _0x54ef11?.path || buildDefaultProjectPath(getCanvasProjectDir(), _0x19b19f);
  } else {
    mkdirSync(getCanvasProjectDir(), { recursive: true });
    const _0x25f61c = await foregroundDialogs['showSaveDialog']({
      title: '另存为项目',
      defaultPath: buildDefaultProjectPath(getCanvasProjectDir(), _0x19b19f),
      filters: getProjectDialogFilters(),
    });
    if (_0x25f61c.canceled || !_0x25f61c.filePath) return { success: false, canceled: true };
    _0xb557a0 = withJsonProjectExtension(_0x25f61c.filePath);
  }
  writeProjectJson(_0xb557a0, _0x443ccd?.multiData || {});
  const _0xd0c779 = upsertRecentProject(_0x3ce1b3, _0xb557a0, { name: _0x19b19f });
  return (
    syncSystemRecentDocumentsBestEffort(),
    {
      success: true,
      canceled: false,
      projectId: stripProjectFileExtension(_0xd0c779.filename || ''),
      projectName: _0xd0c779.name,
      filename: _0xd0c779.filename,
      recentId: _0xd0c779.recentId,
      displayPath: _0xd0c779.displayPath,
      lastModified: _0xd0c779.lastModified,
    }
  );
}
function readAppVersionFromIndexHtml() {
  try {
    const _0x3c8db2 = readFileSync(path.join(APP_ROOT, 'index.html'), 'utf8'),
      _0x3ec2e3 = _0x3c8db2.match(/<meta\s+name=["']app-version["']\s+content=["']([^"']+)["']/i);
    return String(_0x3ec2e3?.[1] || '').trim();
  } catch {
    return '';
  }
}
function getAutoUpdater() {
  return (!autoUpdaterInstance && (autoUpdaterInstance = electron_updater.autoUpdater), autoUpdaterInstance);
}
function handleUpdaterEvent(_0x7ba7c2 = {}) {
  const _0x4477d4 = String(_0x7ba7c2.type || '');
  if (_0x4477d4 === 'download-started' || _0x4477d4 === 'download-retry') {
    (setTaskbarProgressSource('updater', 0), setPowerSaveBlocker('updater', true));
    return;
  }
  if (_0x4477d4 === 'download-progress') {
    setPowerSaveBlocker('updater', true);
    return;
  }
  (_0x4477d4 === 'downloaded' ||
    _0x4477d4 === 'download-failed' ||
    _0x4477d4 === 'error' ||
    _0x4477d4 === 'not-available') &&
    (setTaskbarProgressSource('updater', -1), setPowerSaveBlocker('updater', false));
}
function markQuittingForUpdate() {
  isQuittingForUpdate = true;
}
function getUpdateInstallPreparation() {
  return (
    !updateInstallPreparation &&
      (updateInstallPreparation = createUpdateInstallPreparation({
        getSpawnedServer: () => spawnedServer,
        clearSpawnedServer: (_0x589f48) => {
          if (spawnedServer === _0x589f48) spawnedServer = null;
        },
        markQuittingForUpdate: markQuittingForUpdate,
        getMainWindow: () => mainWindow,
        getRendererProjectState: () => rendererProjectState,
        requestRendererRecoverySnapshot: requestRendererRecoverySnapshot,
        destroyScreenshotOverlayWindow: () => screenshotOverlayController.destroyScreenshotOverlayWindow(),
        stopAllPowerSaveBlockers: stopAllPowerSaveBlockers,
        logEvent: logDiagnosticEvent,
      })),
    updateInstallPreparation
  );
}
function getUpdaterController() {
  return (
    !updaterController &&
      (updaterController = createUpdaterController({
        autoUpdater: getAutoUpdater(),
        isPackaged: () => app.isPackaged,
        normalizeInfo: normalizeUpdaterInfo,
        logEvent: logDiagnosticEvent,
        prepareBeforeInstall: () => getUpdateInstallPreparation().prepareForUpdateInstall(),
        setProgressBar: (_0xc21bb2) => {
          setTaskbarProgressSource('updater', _0xc21bb2);
        },
        sendEvent: (_0x1855a7) => {
          latestUpdaterEvent = _0x1855a7;
          if (_0x1855a7?.info) latestUpdaterInfo = _0x1855a7.info;
          handleUpdaterEvent(_0x1855a7);
          if (!mainWindow || mainWindow.isDestroyed()) return;
          mainWindow.webContents.send('appUpdater:event', _0x1855a7);
        },
      })),
    updaterController
  );
}
function readLocalPreviewVideoUrl() {
  try {
    const _0x386813 = readFileSync(path.join(APP_ROOT, 'release_notes.txt'), 'utf8'),
      _0x805a7c = extractPreviewVideoUrlFromNotes(_0x386813);
    if (_0x805a7c) return _0x805a7c;
  } catch {}
  try {
    const _0x32a5ab = readFileSync(path.join(APP_ROOT, 'release_video_url.txt'), 'utf8');
    return (
      _0x32a5ab
        .split(/\r?\n/)
        .map((_0x4e8615) => _0x4e8615.trim())
        .find((_0x239cd0) => _0x239cd0 && !_0x239cd0.startsWith('#')) || ''
    );
  } catch {
    return '';
  }
}
function normalizeUpdaterInfo(_0x494f8a) {
  return normalizeUpdaterInfoPayload(_0x494f8a, { readLocalPreviewVideoUrl: readLocalPreviewVideoUrl });
}
function installUpdaterHandlers() {
  if (updaterHandlersInstalled) return;
  ((updaterHandlersInstalled = true), getUpdaterController().installHandlers());
}
function scheduleUpdateCheck() {
  if (!app.isPackaged || updateCheckStarted) return;
  ((updateCheckStarted = true),
    installUpdaterHandlers(),
    getUpdaterController()
      .checkForUpdates()
      .catch((_0x4fde7b) => {
        console.warn('[electron][updater] check failed:', _0x4fde7b);
      }));
}
function loadCanvasWindow(_0x386651 = mainWindow) {
  if (!_0x386651 || _0x386651.isDestroyed()) return;
  void _0x386651.loadURL(APP_URL);
}
const rendererNavigationGuard = createRendererNavigationGuard({
  getMainWindow: () => mainWindow,
  requestSnapshot: requestRendererRecoverySnapshot,
  shouldPrepare: window => window.webContents.getURL().startsWith(APP_ORIGIN),
  onFailure: async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    await dialog.showMessageBox(mainWindow, {
      type: 'warning', buttons: ['返回并保存'], defaultId: 0, cancelId: 0,
      message: '保存未完成，已取消重载。', detail: '后台服务和当前窗口保持运行。请保存后重试。',
    });
  },
});
async function restartBackendAndReload() {
  if (app.isPackaged || backendRestartInProgress) return;
  return rendererNavigationGuard.run('backend-restart', async () => {
    backendRestartInProgress = true;
    try {
      (loadStartupStatus({
        kind: 'loading',
        title: APP_DISPLAY_NAME + ' 正在重新启动',
        detail: '正在重新加载画布环境。',
        hint: '完成后会自动回到画布。',
      }),
        localRuntimeKeepAlive.stop(),
        stopSpawnedServer(),
        await clearPortBeforeStart(loadStartupStatus),
        await ensureServerRunning(loadStartupStatus),
        void refreshProductDisplayName(),
        void localRuntimeKeepAlive.start('backend-restart'),
        loadCanvasWindow());
    } catch (_0x19ab58) {
      (console.error('[electron] backend restart failed:', _0x19ab58),
        logDiagnosticEvent({
          type: 'backend.restart_failed',
          level: 'error',
          source: 'main',
          message: 'Backend restart failed',
          error: _0x19ab58,
        }),
        loadStartupStatus({
          kind: 'error',
          title: APP_DISPLAY_NAME + ' 重新启动失败',
          detail: '画布环境重新加载失败。',
          hint: '请重启应用，若仍失败请导出诊断日志。',
        }));
    } finally {
      backendRestartInProgress = false;
    }
  });
}
function createMainWindow() {
  (installAppMenu({
    app: app,
    Menu: Menu,
    shell: shell,
    getMainWindow: () => mainWindow,
    logDir: LOG_DIR,
    restartBackendAndReload: restartBackendAndReload,
    reloadCanvas: ignoreCache => rendererNavigationGuard.run('renderer-reload', window => {
      if (ignoreCache) window.webContents.reloadIgnoringCache();
      else window.webContents.reload();
    }),
    relaunchElectron: () => desktopQuitCoordinator.requestRelaunch(),
  }),
    installLocalApiTokenHeader());
  const { isMaximized: _0x5cd38b, ..._0x7e79c } = readWindowState();
  ((rendererProjectState = { hasUnsavedChanges: false, projectName: '' }),
    (mainWindow = new BrowserWindow({
      ..._0x7e79c,
      minWidth: 0x400,
      minHeight: 0x2d0,
      title: APP_DISPLAY_NAME,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        backgroundThrottling: false,
      },
    })),
    installDevReloadShortcuts(mainWindow),
    installWindowStatePersistence(mainWindow),
    installRecoverySnapshotBeforeClose(mainWindow, {
      getRendererProjectState: () => rendererProjectState,
      shouldBypassClose: () => isQuittingForUpdate,
      shouldPrepareRenderer: () => mainWindow?.webContents.getURL().startsWith(APP_ORIGIN) === true,
      onCloseCancelled: () => desktopQuitCoordinator.cancelQuit(),
      logEvent: logDiagnosticEvent,
      confirmCloseWithoutSnapshot: async (result) => {
        if (!mainWindow || mainWindow.isDestroyed()) return false;
        const zh = String(app.getLocale() || '')
          .toLowerCase()
          .startsWith('zh');
        const { response } = await dialog.showMessageBox(mainWindow, {
          type: 'warning',
          defaultId: 0,
          cancelId: 0,
          noLink: true,
          title: zh ? '保存未完成' : 'Saving did not complete',
          message: zh
            ? '工作区保存或恢复快照未完成，关闭将可能丢失未保存修改。'
            : 'Workspace saving or recovery did not complete. Closing may lose unsaved changes.',
          detail: zh
            ? '建议返回并保存后重试。已有恢复文件会继续保留；超时或保存错误不会自动放弃修改。'
            : 'Return and save, then retry. Existing recovery files are preserved; errors never silently discard changes.',
          buttons: zh
            ? ['返回并保存', '放弃未保存修改并关闭']
            : ['Return and save', 'Discard unsaved changes and close'],
        });
        return response === 1;
      },
    }),
    refreshTaskbarProgress(),
    mainWindow.once('ready-to-show', () => {
      (_0x5cd38b && mainWindow?.maximize(),
        mainWindow?.show(),
        scheduleUpdateCheck(),
        void localRuntimeKeepAlive.start('ready-to-show'));
    }),
    mainWindow.webContents.on('did-finish-load', () => {
      (latestUpdaterEvent && mainWindow?.webContents.send('appUpdater:event', latestUpdaterEvent),
        pendingExternalProjectOpenRequests.length > 0 &&
          mainWindow?.webContents.send('project:externalOpenAvailable'),
        screenshotOverlayController.sendGlobalScreenshotShortcutStatus(),
        globalTextPresetShortcutController?.sendShortcutStatus?.(),
        void localRuntimeKeepAlive.start('did-finish-load'));
    }),
    mainWindow.webContents.on('did-fail-load', (_0x1ab568, _0x41801f, _0x1dd0e3, _0x2b0724) => {
      logDiagnosticEvent({
        type: 'renderer.load_failed',
        level: 'error',
        source: 'main',
        message: 'Renderer failed to load',
        context: { errorCode: _0x41801f, errorDescription: _0x1dd0e3, url: _0x2b0724 },
      });
    }),
    mainWindow.webContents.on('render-process-gone', (_0x138fd6, _0x5ba87c = {}) => {
      logDiagnosticEvent({
        type: 'renderer.process_gone',
        level: 'error',
        source: 'main',
        message: 'Renderer process exited unexpectedly',
        context: _0x5ba87c,
      });
    }),
    mainWindow.webContents.setWindowOpenHandler(({ url: _0x214ced }) => {
      return (openExternalUrl(_0x214ced), { action: 'deny' });
    }),
    mainWindow.webContents.on('will-navigate', (_0x4724c6, _0x378e1f) => {
      if (isLocalAppUrl(_0x378e1f)) return;
      (_0x4724c6.preventDefault(), openExternalUrl(_0x378e1f));
    }),
    mainWindow.on('focus', () => void localRuntimeKeepAlive.start('focus')),
    mainWindow.on('show', () => void localRuntimeKeepAlive.start('show')),
    mainWindow.on('restore', () => void localRuntimeKeepAlive.start('restore')),
    mainWindow.on('hide', () => void localRuntimeKeepAlive.refresh('hide')),
    mainWindow.on('minimize', () => void localRuntimeKeepAlive.refresh('minimize')),
    mainWindow.webContents.on('will-prevent-unload', () => desktopQuitCoordinator.cancelQuit()),
    mainWindow.on('closed', () => {
      mainWindow = null;
      runCleanupSteps([
        () => webPreviewViewManager.disposeViews(),
        () => localRuntimeKeepAlive.stop(),
        () => desktopQuitCoordinator.mainWindowClosed(),
      ], { onError: error => logDiagnosticEvent({ type: 'app.window_cleanup_failed', level: 'warn', source: 'main', error }) });
    }),
    mainWindow.on('unresponsive', () => {
      logDiagnosticEvent({
        type: 'renderer.unresponsive',
        level: 'warn',
        source: 'main',
        message: 'Renderer became unresponsive',
      });
    }));
}
async function startApp() {
  if (!desktopStartupLifecycle.requestStart()) return;
  (installLocalPreviewProtocol(),
    installIpcHandlers(),
    process.env.AIC_DISABLE_GLOBAL_CAPTURE !== '1' && void globalCaptureWindowController.prewarm(),
    createMainWindow(),
    process.env.AIC_DISABLE_GLOBAL_CAPTURE !== '1' && screenshotOverlayController.installGlobalScreenshotShortcut(),
    process.env.AIC_DISABLE_GLOBAL_CAPTURE !== '1' && globalTextPresetShortcutController.installGlobalShortcut(),
    queueExternalProjectOpenFromArgs(process.argv, 'startup'),
    await desktopStartupLifecycle.prepareBackend(),
    desktopStartupLifecycle.assertStarting(),
    void refreshProductDisplayName(),
    void localRuntimeKeepAlive.start('server-ready'),
    loadCanvasWindow());
}
function handleStartupFailure(_0xf40367) {
  if (_0xf40367?.code === 'AIC_DESKTOP_STARTUP_CANCELLED') return;
  (console.error('[electron] startup failed:', _0xf40367),
    logDiagnosticEvent({
      type: 'app.startup_failed',
      level: 'error',
      source: 'main',
      message: 'Application startup failed',
      error: _0xf40367,
    }),
    loadStartupStatus({
      kind: 'error',
      title: APP_DISPLAY_NAME + ' 启动失败',
      detail: '应用启动时遇到问题。',
      hint: '请重启应用，若仍失败请导出诊断日志。',
    }));
}
function installAppLifecycleHandlers() {
  (autoUpdater.on('before-quit-for-update', markQuittingForUpdate),
    app.on('open-file', (_0x3089e5, _0x3d356c) => {
      (_0x3089e5.preventDefault(), queueExternalProjectOpenPath(_0x3d356c, 'open-file'), focusMainWindow());
    }),
    app.whenReady().then(() => {
      void startApp().catch(handleStartupFailure);
    }),
    app.on('second-instance', (_0xd446bc, _0x34cc3e) => {
      (focusMainWindow(), queueExternalProjectOpenFromArgs(_0x34cc3e, 'second-instance'));
    }),
    app.on('activate', () => {
      (!mainWindow || mainWindow.isDestroyed()) &&
        void startApp().catch((_0x109634) => {
          (console.error('[electron] activate failed:', _0x109634),
            logDiagnosticEvent({
              type: 'app.activate_failed',
              level: 'error',
              source: 'main',
              message: 'Application activate failed',
              error: _0x109634,
            }));
        });
    }),
    app.on('window-all-closed', () => {
      process.platform !== 'darwin' && app.quit();
    }),
    app.on('before-quit', event => desktopQuitCoordinator.beforeQuit(event)),
    app.on('will-quit', () => desktopQuitCoordinator.willQuit()));
}
GOT_SINGLE_INSTANCE_LOCK && installAppLifecycleHandlers();
(process.on('uncaughtException', (_0x48adb1) => {
  (logDiagnosticEvent({
    type: 'main.uncaught_exception',
    level: 'error',
    source: 'main',
    message: 'Uncaught exception in Electron main process',
    error: _0x48adb1,
  }),
    console.error('[electron] uncaught exception:', _0x48adb1));
}),
  process.on('unhandledRejection', (_0x285137) => {
    (logDiagnosticEvent({
      type: 'main.unhandled_rejection',
      level: 'error',
      source: 'main',
      message: 'Unhandled rejection in Electron main process',
      error: _0x285137 instanceof Error ? _0x285137 : null,
      context: _0x285137 instanceof Error ? {} : { reason: String(_0x285137) },
    }),
      console.error('[electron] unhandled rejection:', _0x285137));
  }));
