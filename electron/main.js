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
    ? // Keep a profile folder of our own. The historical 'AI CanvasPro' name is now also
      // claimed by the separately installed SHUO Canvas build, and two Electron apps sharing
      // one profile folder cannot both hold the single-instance lock: whichever starts second
      // exits silently, which is what stopped the packaged app from opening.
      'CanvasPro'
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
  LEGACY_PACKAGED_FILES_ROOT =
    LEGACY_PACKAGED_FILES_ROOTS[0] || (process.env.AIC_STORAGE_ROOT ? PACKAGED_FILES_ROOT : APP_ROOT),
  HOST = '127.0.0.1',
  // 8790 keeps the default clear of the SHUO Canvas install, whose bundled backend binds 8777.
  PORT = Number.parseInt(process.env.AICANVAS_PORT || '8790', 10) || 8790,
  APP_ORIGIN = 'http://' + HOST + ':' + PORT,
  APP_URL = APP_ORIGIN + '/',
  SERVER_READY_TIMEOUT_MS = 30000,
  SERVER_READY_INTERVAL_MS = 400,
  LOCAL_ACCESS_TOKEN = randomBytes(32).toString('hex'),
  SERVER_ID_HEADER = 'x-aicanvas-server',
  SERVER_ID_VALUE = APP_DISPLAY_NAME,
  LOCAL_PREVIEW_SCHEME = 'aic-local-preview',
  LOCAL_PREVIEW_TTL_MS = 12 * 60 * 60 * 1000,
  CLIPBOARD_FILE_REFERENCES_FORMAT = 'application/x-ai-canvas-file-references',
  RECOVERY_SNAPSHOT_FILENAME = 'recovery-snapshot.json',
  GLOBAL_SCREENSHOT_ACCELERATOR = 'Alt+Q',
  GLOBAL_CAPTURE_LAUNCHER_ACCELERATOR = 'Control+Alt+Shift+C',
  SERVER_RESTART_BASE_DELAY_MS = 1000,
  SERVER_RESTART_MAX_DELAY_MS = 30000,
  SERVER_RESTART_MAX_ATTEMPTS = 5;
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
  app,
  getSpawnedServer: () => spawnedServer,
  probeServer: () => probeServer(),
  clearPortBeforeStart: () => clearPortBeforeStart(),
  ensureServerRunning: () => ensureServerRunning(),
});
const desktopQuitCoordinator = createDesktopQuitCoordinator({
  app,
  getMainWindow: () => mainWindow,
  shouldBypassClose: () => isQuittingForUpdate,
  beginShutdown: () => desktopStartupLifecycle.beginQuit(),
  onError: (error) =>
    logDiagnosticEvent({ type: 'app.shutdown_cleanup_failed', level: 'warn', source: 'main', error }),
  cleanup: () =>
    runCleanupSteps(
      [
        () => localRuntimeKeepAlive.stop(),
        () => backgroundCompletionNotifier.dispose(),
        () => screenshotOverlayController.uninstallGlobalScreenshotShortcut(),
        () => screenshotOverlayController.destroyScreenshotOverlayWindow(),
        () => globalShortcut.unregisterAll(),
        () => globalCaptureWindowController.destroy(),
        () => stopSpawnedServer(),
        () => stopAllPowerSaveBlockers(),
      ],
      {
        onError: (error) =>
          logDiagnosticEvent({ type: 'app.shutdown_cleanup_failed', level: 'warn', source: 'main', error }),
      },
    ),
});
function isDragImportProfilingEnabled() {
  return /^(1|true|yes|on)$/i.test(String(process.env.AIC_DRAG_IMPORT_PROFILING || '').trim());
}
function logDragImportProfile(value, item = {}) {
  if (!isDragImportProfilingEnabled()) return;
  console.log('[drag-import-prof] ' + value, item);
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
const DEFAULT_WINDOW_STATE = { width: 1440, height: 960, isMaximized: false },
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
function logDiagnosticEvent(options2 = {}) {
  return diagnostics.logEvent(options2);
}
const localRuntimeKeepAlive = createLocalRuntimeKeepAliveController({
  getWindow: () => mainWindow,
  requestLocalJson: requestLocalJson,
  setPowerSaveBlocker: setPowerSaveBlocker,
  logDiagnosticEvent: logDiagnosticEvent,
});
function normalizeTaskbarProgress(key) {
  const count = Number(key);
  if (!Number.isFinite(count) || count < 0) return null;
  return Math.max(0, Math.min(1, count));
}
function refreshTaskbarProgress() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const index = taskbarProgressSources.get('updater') ?? taskbarProgressSources.get('media') ?? null;
  mainWindow.setProgressBar(index == null ? -1 : index);
}
function setTaskbarProgressSource(data, next) {
  const enabled = String(data || '').trim();
  if (!enabled) return;
  const taskbarProgress = normalizeTaskbarProgress(next);
  (taskbarProgress == null
    ? taskbarProgressSources.delete(enabled)
    : taskbarProgressSources.set(enabled, taskbarProgress),
    refreshTaskbarProgress());
}
function setPowerSaveBlocker(current, entry, record = 'prevent-display-sleep') {
  const reason = String(current || '').trim();
  if (!reason) return;
  const type = record === 'prevent-app-suspension' ? 'prevent-app-suspension' : 'prevent-display-sleep';
  if (entry) {
    if (powerSaveBlockerReasons.has(reason)) return;
    const blockerId = powerSaveBlocker.start(type);
    (powerSaveBlockerReasons.set(reason, blockerId),
      logDiagnosticEvent({
        type: 'power_save_blocker.started',
        level: 'info',
        source: 'main',
        message: 'Power save blocker started',
        context: { reason: reason, blockerId: blockerId, type: type },
      }));
    return;
  }
  const blockerId2 = powerSaveBlockerReasons.get(reason);
  if (blockerId2 == null) return;
  powerSaveBlockerReasons.delete(reason);
  try {
    powerSaveBlocker.isStarted(blockerId2) && powerSaveBlocker.stop(blockerId2);
  } catch (handle) {
    console.warn('[electron] failed to stop power save blocker:', handle);
  }
  logDiagnosticEvent({
    type: 'power_save_blocker.stopped',
    level: 'info',
    source: 'main',
    message: 'Power save blocker stopped',
    context: { reason: reason, blockerId: blockerId2 },
  });
}
function stopAllPowerSaveBlockers() {
  for (const state of [...powerSaveBlockerReasons.keys()]) {
    setPowerSaveBlocker(state, false);
  }
}
function normalizeWindowState(scope) {
  const isMaximized = scope && typeof scope === 'object' ? scope : {},
    box = isMaximized.bounds && typeof isMaximized.bounds === 'object' ? isMaximized.bounds : isMaximized,
    count2 = Number.parseInt(box.width, 10),
    count3 = Number.parseInt(box.height, 10),
    input = Number.parseInt(box.x, 10),
    output = Number.parseInt(box.y, 10),
    box2 = {
      width: Number.isFinite(count2) && count2 >= 1024 ? count2 : DEFAULT_WINDOW_STATE.width,
      height: Number.isFinite(count3) && count3 >= 720 ? count3 : DEFAULT_WINDOW_STATE.height,
      isMaximized: isMaximized.isMaximized === true,
    };
  return (Number.isFinite(input) && Number.isFinite(output) && ((box2.x = input), (box2.y = output)), box2);
}
function isWindowStateOnDisplay(x) {
  if (!Number.isFinite(x?.x) || !Number.isFinite(x?.y)) return true;
  const box3 = { x: x.x, y: x.y, width: x.width, height: x.height };
  return screen.getAllDisplays().some(({ workArea: workArea }) => {
    return (
      box3.x < workArea.x + workArea.width &&
      box3.x + box3.width > workArea.x &&
      box3.y < workArea.y + workArea.height &&
      box3.y + box3.height > workArea.y
    );
  });
}
function readWindowState() {
  try {
    const box4 = normalizeWindowState(JSON.parse(readFileSync(WINDOW_STATE_PATH, 'utf8')));
    return (!isWindowStateOnDisplay(box4) && (delete box4.x, delete box4.y), box4);
  } catch {
    return { ...DEFAULT_WINDOW_STATE };
  }
}
function writeWindowState(isMaximized2) {
  if (!isMaximized2 || isMaximized2.isDestroyed()) return;
  const args = isMaximized2.getBounds(),
    windowState = normalizeWindowState({ ...args, isMaximized: isMaximized2.isMaximized() }),
    value2 = WINDOW_STATE_PATH + '.' + process.pid + '.' + Date.now() + '.tmp';
  try {
    (mkdirSync(path.dirname(WINDOW_STATE_PATH), { recursive: true }),
      writeFileSync(value2, JSON.stringify(windowState, null, 2) + '\n', 'utf8'),
      renameSync(value2, WINDOW_STATE_PATH));
  } catch (value3) {
    console.warn('[electron] failed to save window state:', value3);
  }
}
function installWindowStatePersistence(value4) {
  let setTimeout2 = null;
  const value5 = () => {
    if (setTimeout2) clearTimeout(setTimeout2);
    setTimeout2 = setTimeout(() => {
      ((setTimeout2 = null), writeWindowState(value4));
    }, 400);
  };
  (value4.on('move', value5),
    value4.on('resize', value5),
    value4.on('maximize', value5),
    value4.on('unmaximize', value5),
    value4.on('close', () => {
      (setTimeout2 && (clearTimeout(setTimeout2), (setTimeout2 = null)), writeWindowState(value4));
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
function probeServer(timeout = 1200) {
  return new Promise((handler) => {
    const value6 = http.get(
      APP_ORIGIN + '/api/v2/runtime/info',
      { timeout: timeout, headers: { 'X-AIC-Local-Token': LOCAL_ACCESS_TOKEN } },
      (response2) => {
        const value7 = String(response2.headers[SERVER_ID_HEADER] || '');
        (response2.resume(), handler(response2.statusCode === 200 && value7 === SERVER_ID_VALUE));
      },
    );
    (value6.on('timeout', () => {
      (value6.destroy(), handler(false));
    }),
      value6.on('error', () => {
        handler(false);
      }));
  });
}
function requestLocalJson(path2, timeout2 = 1600) {
  return new Promise((handler2, handler3) => {
    const value8 = http.request(
      {
        hostname: HOST,
        port: PORT,
        path: path2,
        method: 'GET',
        timeout: timeout2,
        headers: { 'X-AIC-Local-Token': LOCAL_ACCESS_TOKEN },
      },
      (value9) => {
        const list = [];
        (value9.on('data', (value10) => list.push(Buffer.from(value10))),
          value9.on('end', () => {
            const value11 = Buffer.concat(list).toString('utf8');
            if (value9.statusCode < 200 || value9.statusCode >= 300) {
              handler3(new Error(value11 || 'HTTP ' + value9.statusCode));
              return;
            }
            try {
              handler2(value11 ? JSON.parse(value11) : {});
            } catch (value12) {
              handler3(value12);
            }
          }));
      },
    );
    (value8.on('timeout', () => {
      value8.destroy(new Error('Local service request timed out'));
    }),
      value8.on('error', handler3),
      value8.end());
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
        .executeJavaScript(
          `window.dispatchEvent(new CustomEvent('canvas:product-display-name', { detail: ${payload} }));`,
        )
        .catch(() => {});
    }
  } catch {}
}
async function clearPortBeforeStart(value13 = null) {
  if (process.env.AIC_DISABLE_PORT_RECLAIM === '1') {
    if (!(await probeTcpPortAvailable({ host: HOST, port: PORT })))
      throw new Error('Independent test port is occupied; no existing process was stopped');
    return;
  }
  const backendCommand = resolveBackendLaunch();
  return reclaimStartupPort({
    port: PORT,
    env: process.env,
    collectListeningPortPids: collectListeningPortPids,
    probePortAvailable: () => probeTcpPortAvailable({ host: HOST, port: PORT }),
    confirmRuntimeIdentity: async ({ pids: pids }) => {
      if (!(await probeServer())) return [];
      return findVerifiedBackendProcessPids({
        pids: pids,
        appIsPackaged: app.isPackaged,
        appRoot: APP_ROOT,
        backendCommand: backendCommand.command,
        host: HOST,
        port: PORT,
        platform: process.platform,
        env: process.env,
      });
    },
    terminateProcess: (value14) => {
      if (process.platform === 'win32') {
        const windowsSystemToolPath = resolveWindowsSystemToolPath('taskkill', { env: process.env });
        execFileSync(windowsSystemToolPath, ['/PID', String(value14), '/F', '/T'], {
          stdio: 'ignore',
          windowsHide: true,
        });
      } else process.kill(value14, 'SIGTERM');
    },
    delayFn: delay,
    onReclaim: () =>
      value13?.({
        kind: 'loading',
        title: APP_DISPLAY_NAME + ' 正在启动',
        detail: '正在恢复上次未关闭的运行环境。',
        hint: '启动完成后会自动进入画布。',
      }),
    onEnumerationUnavailable: ({ error: error2 }) => {
      logDiagnosticEvent({
        type: 'startup_port.enumeration_unavailable',
        level: 'warn',
        source: 'main',
        message: 'Startup port listener enumeration failed; the port is free, continuing startup',
        context: { port: PORT, resolution: 'port-free-continue', ...(error2?.details || {}) },
      });
    },
  });
}
function resolvePythonCommand() {
  if (!app.isPackaged && process.env.AIC_TEST_PYTHON) return process.env.AIC_TEST_PYTHON;
  if (app.isPackaged) {
    const list2 =
      process.platform === 'win32'
        ? [
            path.join(RUNTIME_ROOT, 'python', 'python.exe'),
            path.join(RUNTIME_ROOT, 'python', 'Scripts', 'python.exe'),
          ]
        : [
            path.join(RUNTIME_ROOT, 'python', 'bin', 'python3'),
            path.join(RUNTIME_ROOT, 'python', 'bin', 'python'),
          ];
    return list2.find((item2) => existsSync(item2)) || list2[0];
  }
  const list3 =
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
  return list3.find((item3) => {
    return path.isAbsolute(item3) ? existsSync(item3) : true;
  });
}
function resolveBackendLaunch() {
  return resolveBackendLaunchSpec({
    appIsPackaged: app.isPackaged,
    appRoot: APP_ROOT,
    runtimeRoot: RUNTIME_ROOT,
    platform: process.platform,
    existsSync: existsSync,
    pythonCommand: resolvePythonCommand(),
  });
}
function resolveRuntimeTool(enabled2) {
  const value15 = process.platform === 'win32' && !enabled2.endsWith('.exe') ? enabled2 + '.exe' : enabled2,
    value16 = path.join(RUNTIME_ROOT, 'ffmpeg', 'bin', value15);
  return existsSync(value16) ? value16 : '';
}
function buildPackagedServerEnv() {
  const value17 = app.getPath('userData'),
    storageRoot = getStorageRoot();
  return {
    AIC_CLIENT_CONFIG_PATH: path.join(value17, 'client-config.json'),
    AIC_CLIENT_CONFIG_OVERRIDE_PATH: path.join(value17, 'client-config.local.json'),
    AIC_SUBSCRIPTION_STATUS_PATH: path.join(value17, 'subscription-status.json'),
    AIC_USER_DIR: path.join(value17, 'user'),
    AIC_CANVAS_DIR: path.join(storageRoot, 'projects'),
    AIC_DATA_DIR: path.join(storageRoot, 'data'),
    AIC_OUTPUT_DIR: path.join(storageRoot, 'output'),
    AIC_UPLOADS_DIR: path.join(storageRoot, 'data', 'uploads'),
    AIC_ASSETS_DIR: path.join(storageRoot, 'data', 'assets'),
    AIC_WORKFLOWS_DIR: path.join(storageRoot, 'data', 'workflows'),
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
    createContextMenu: (value18) => Menu.buildFromTemplate(value18),
    logDiagnosticEvent: logDiagnosticEvent,
  }),
  importRemoteAssetToLibrary = createRemoteAssetImporter({
    importAssetToLibrary: importAssetToLibrary,
    getWebPreviewEntry: (value19, value20) => webPreviewViewManager._getEntry(value19, value20),
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
    openPath: (value21) => shell.openPath(value21),
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
      showOpenDialog: (options) => foregroundDialogs.showOpenDialog(options),
      openFolder: (folderPath) =>
        openShellFolder(folderPath, { shellApi: shell, logEvent: logDiagnosticEvent }),
      getCanvasProjectDir: getCanvasProjectDir,
      showSaveDialog: (options) => foregroundDialogs.showSaveDialog(options),
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
  if (process.env.AIC_USER_DATA_ROOT)
    return readUserSettingsFromFilesSync([path.join(getUserRoot(), 'settings.json')]);
  const value22 = process.env.LOCALAPPDATA || app.getPath('userData');
  return readUserSettingsFromFilesSync([
    path.join(getUserRoot(), 'settings.json'),
    path.join(APP_ROOT, 'user', 'settings.json'),
    path.join(value22, 'AI-CanvasPro', 'settings.json'),
  ]);
}
function readConfiguredFileSavePathsSync() {
  const configuredUserSettingsSync = readConfiguredUserSettingsSync()?.fileSavePaths;
  return configuredUserSettingsSync && typeof configuredUserSettingsSync === 'object'
    ? configuredUserSettingsSync
    : {};
}
function getConfiguredPath(value23, value24) {
  const value25 = String(readConfiguredFileSavePathsSync()?.[value23] || '').trim();
  return value25 ? path.resolve(value25) : value24;
}
function getDataDir() {
  const configuredFileSavePathsSync = readConfiguredFileSavePathsSync(),
    value26 = String(configuredFileSavePathsSync?.dataDir || '').trim();
  if (value26) return path.resolve(value26);
  const value27 = String(configuredFileSavePathsSync?.tempDir || '').trim();
  if (value27) {
    const value28 = path.resolve(value27);
    return path.basename(value28).toLowerCase() === 'uploads' ? path.dirname(value28) : value28;
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
  const configuredFileSavePathsSync2 = readConfiguredFileSavePathsSync();
  if (
    !String(configuredFileSavePathsSync2?.dataDir || '').trim() &&
    String(configuredFileSavePathsSync2?.tempDir || '').trim()
  )
    return path.resolve(configuredFileSavePathsSync2.tempDir);
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
function sanitizeUploadFilename(value29) {
  const value30 = path.basename(String(value29 || 'upload'));
  return value30.replace(/[\\/:*?"<>|]/g, '_').trim() || 'upload';
}
function allocateUniqueUploadPath(value31, value32) {
  const safeFilename = sanitizeUploadFilename(value32),
    error3 = path.parse(safeFilename),
    value33 = error3.name || 'upload',
    value34 = error3.ext || '',
    value35 = Date.now();
  for (let count4 = 0; count4 < 1000; count4 += 1) {
    const storedFilename =
        count4 === 0
          ? safeFilename
          : value33 + '_' + value35 + '_' + String(count4).padStart(3, '0') + value34,
      targetPath = path.join(value31, storedFilename);
    if (!existsSync(targetPath))
      return { safeFilename: safeFilename, storedFilename: storedFilename, targetPath: targetPath };
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
      createImageFromPath: (value36) => nativeImage.createFromPath(value36),
      createImageDerivatives: createImageDerivativeWorker({ BrowserWindow: BrowserWindow }),
      probeVideoPlaybackInfo: mediaTaskRuntime.probeVideoPlaybackInfoForImport,
      publishAssetUpdate: (value37) => {
        assetUpdateEvents.push(value37);
        mainWindow?.webContents?.send('asset:updated', value37);
      },
      shouldBufferAssetUpdates: () => false,
      isImportLoggingEnabled: isAssetImportLoggingEnabled,
    })),
    assetCapabilityOperations
  );
}
function toAssetLocalPath(...args2) {
  return getAssetCapabilityOperations().toAssetLocalPath(...args2);
}
function updateAssetRecord(value38, value39, value40 = {}) {
  return getAssetCapabilityOperations().updateAssetRecord(value38, value39, value40);
}
function sendAssetUpdated(value41) {
  return getAssetCapabilityOperations().sendAssetUpdated(value41);
}
function importAssetToLibrary(options3 = {}) {
  return getAssetCapabilityOperations().importAssetToLibrary(options3);
}
function isImageImportPayload(options4 = {}, value42 = '') {
  const value43 = String(options4?.type || '').toLowerCase();
  if (value43.startsWith('image/')) return true;
  return /\.(?:png|jpe?g|webp|gif|bmp|avif)$/i.test(String(value42 || ''));
}
const localPreviewProtocolRuntime = createLocalPreviewProtocolRuntime({
  protocol: protocol,
  scheme: LOCAL_PREVIEW_SCHEME,
  appOrigin: APP_ORIGIN,
  ttlMs: LOCAL_PREVIEW_TTL_MS,
  resolveLocalVirtualPath: resolveLocalVirtualPath,
});
function createLocalPreviewUrl(options5 = {}) {
  return localPreviewProtocolRuntime.createUrl(options5);
}
function installLocalPreviewProtocol() {
  localPreviewProtocolRuntime.install();
}
function resizeImageToMaxEdge(value44, value45) {
  const box5 = value44.getSize(),
    count5 = Number(box5.width) || 0,
    count6 = Number(box5.height) || 0;
  if (count5 <= 0 || count6 <= 0) return null;
  const value46 = Math.max(count5, count6);
  if (value46 <= value45) return value44;
  const value47 = value45 / value46;
  return value44.resize({
    width: Math.max(1, Math.round(count5 * value47)),
    height: Math.max(1, Math.round(count6 * value47)),
    quality: 'best',
  });
}
function writeLocalImageDerivatives(value48, value49, value50) {
  const value51 = nativeImage.createFromPath(value50),
    box6 = value51.getSize(),
    originalWidth = Number(box6.width) || 0,
    originalHeight = Number(box6.height) || 0;
  if (value51.isEmpty() || originalWidth <= 0 || originalHeight <= 0) return {};
  const value52 = path.parse(value49).name || 'image',
    value53 = path.join('_derived', 'display', value52 + '.display.png'),
    value54 = path.join('_derived', 'thumb', value52 + '.thumb.png'),
    value55 = path.join(value48, value53),
    value56 = path.join(value48, value54);
  (mkdirSync(path.dirname(value55), { recursive: true }),
    mkdirSync(path.dirname(value56), { recursive: true }));
  const maxEdge = resizeImageToMaxEdge(value51, 1280),
    maxEdge2 = resizeImageToMaxEdge(value51, 320);
  if (!maxEdge || !maxEdge2) return {};
  (writeFileSync(value55, maxEdge.toPNG()), writeFileSync(value56, maxEdge2.toPNG()));
  const localPath = 'data/uploads/' + value49,
    displayLocalPath = 'data/uploads/' + value53.replace(/\\/g, '/'),
    thumbLocalPath = 'data/uploads/' + value54.replace(/\\/g, '/');
  return {
    localPath: localPath,
    originalLocalPath: localPath,
    displayLocalPath: displayLocalPath,
    thumbLocalPath: thumbLocalPath,
    originalWidth: originalWidth,
    originalHeight: originalHeight,
    originalUrl: '/' + localPath,
    displayUrl: '/' + displayLocalPath,
    thumbUrl: '/' + thumbLocalPath,
  };
}
function getRuntimeToolOrFallback(value57) {
  return resolveRuntimeTool(value57) || value57;
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
  publishTaskUpdate: (value58) => mainWindow?.webContents?.send('mediaTask:update', value58),
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
  return mediaTaskRuntime.getQueue();
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
async function generateAssetVideoPoster(value59) {
  const localVirtualPath = resolveLocalVirtualPath(value59.originalLocalPath);
  if (!localVirtualPath) throw new Error('Invalid video asset path');
  const value60 = path.join(getAssetsDir(), 'derived', 'video');
  mkdirSync(value60, { recursive: true });
  const value61 = path.join(value60, value59.assetId + '.poster.jpg');
  return (
    !existsSync(value61) &&
      (await runToolCapture(
        getRuntimeToolOrFallback('ffmpeg'),
        ['-y', '-ss', '0.1', '-i', localVirtualPath, '-frames:v', '1', '-vf', 'scale=640:-2', value61],
        { cwd: APP_ROOT },
      )),
    { posterLocalPath: toAssetLocalPath('derived', 'video', value59.assetId + '.poster.jpg') }
  );
}
function buildWaveformJsonFromFloat32(value62, value63 = 190) {
  const value64 = value62.buffer.slice(value62.byteOffset, value62.byteOffset + value62.byteLength),
    list4 = new Float32Array(value64, 0, Math.floor(value62.byteLength / 4)),
    value65 = list4.length,
    samples = Math.max(40, Math.min(400, Number(value63) || 190)),
    value66 = Math.max(1, Math.floor(value65 / samples)),
    peaks = [];
  for (let value67 = 0; value67 < samples; value67 += 1) {
    const value68 = value67 * value66,
      value69 = Math.min(value65, value68 + value66);
    let value70 = 0;
    for (let value71 = value68; value71 < value69; value71 += 1) {
      const value72 = Math.abs(Number(list4[value71]) || 0);
      if (value72 > value70) value70 = value72;
    }
    peaks.push(Number(Math.min(1, value70).toFixed(4)));
  }
  return { version: 1, samples: samples, peaks: peaks };
}
async function generateAssetAudioWaveform(value73) {
  const localVirtualPath2 = resolveLocalVirtualPath(value73.originalLocalPath);
  if (!localVirtualPath2) throw new Error('Invalid audio asset path');
  const value74 = path.join(getAssetsDir(), 'derived', 'audio');
  mkdirSync(value74, { recursive: true });
  const value75 = path.join(value74, value73.assetId + '.waveform.json');
  if (!existsSync(value75)) {
    const runToolCapture2 = await runToolCapture(
      getRuntimeToolOrFallback('ffmpeg'),
      ['-v', 'error', '-i', localVirtualPath2, '-ac', '1', '-ar', '8000', '-f', 'f32le', 'pipe:1'],
      { cwd: APP_ROOT },
    );
    writeFileSync(value75, JSON.stringify(buildWaveformJsonFromFloat32(runToolCapture2)) + '\n', 'utf8');
  }
  return { waveformLocalPath: toAssetLocalPath('derived', 'audio', value73.assetId + '.waveform.json') };
}
function importLocalFileToUploads(name = {}) {
  const t = Date.now(),
    sourcePath = String(name?.path || '').trim();
  logDragImportProfile('main:import:start', {
    t: t,
    name: name?.name || '',
    type: name?.type || '',
    sourcePath: sourcePath,
  });
  if (!sourcePath) throw new Error('缺少文件路径');
  if (!path.isAbsolute(sourcePath)) throw new Error('文件路径必须是绝对路径');
  const sourceRealPath = realpathSync(sourcePath),
    size = statSync(sourceRealPath);
  if (!size.isFile()) throw new Error('只支持导入文件');
  const uploadsDir = getUploadsDir();
  mkdirSync(uploadsDir, { recursive: true });
  const {
      safeFilename: safeFilename2,
      storedFilename: storedFilename2,
      targetPath: targetPath2,
    } = allocateUniqueUploadPath(uploadsDir, name?.name || path.basename(sourceRealPath)),
    t2 = Date.now();
  (logDragImportProfile('main:copy:start', {
    t: t2,
    sourceRealPath: sourceRealPath,
    targetPath: targetPath2,
    size: size.size,
  }),
    copyFileSync(sourceRealPath, targetPath2),
    logDragImportProfile('main:copy:done', {
      t: Date.now(),
      elapsedMs: Date.now() - t2,
      targetPath: targetPath2,
    }));
  const localPath2 = 'data/uploads/' + storedFilename2,
    t3 = Date.now();
  isImageImportPayload(name, sourceRealPath) &&
    logDragImportProfile('main:derivative:start', { t: t3, targetPath: targetPath2 });
  const displayLocalPath2 = isImageImportPayload(name, sourceRealPath)
    ? writeLocalImageDerivatives(uploadsDir, storedFilename2, targetPath2)
    : {};
  isImageImportPayload(name, sourceRealPath) &&
    logDragImportProfile('main:derivative:done', {
      t: Date.now(),
      elapsedMs: Date.now() - t3,
      displayLocalPath: displayLocalPath2.displayLocalPath || '',
      thumbLocalPath: displayLocalPath2.thumbLocalPath || '',
      originalWidth: displayLocalPath2.originalWidth || 0,
      originalHeight: displayLocalPath2.originalHeight || 0,
    });
  const localPath3 = {
    success: true,
    url: '/' + localPath2,
    localPath: localPath2,
    ...displayLocalPath2,
    filename: safeFilename2,
    storedFilename: storedFilename2,
    size: size.size,
    type: String(name?.type || ''),
  };
  return (
    logDragImportProfile('main:import:done', {
      t: Date.now(),
      elapsedMs: Date.now() - t,
      localPath: localPath3.localPath,
      displayLocalPath: localPath3.displayLocalPath || '',
      thumbLocalPath: localPath3.thumbLocalPath || '',
    }),
    localPath3
  );
}
function installLocalApiTokenHeader() {
  if (localApiTokenHeaderInstalled) return;
  ((localApiTokenHeaderInstalled = true),
    session.defaultSession.webRequest.onBeforeSendHeaders(
      { urls: [APP_ORIGIN + '/*', 'http://localhost:' + PORT + '/*'] },
      (args3, handler4) => {
        handler4({
          requestHeaders: { ...args3.requestHeaders, 'X-AIC-Local-Token': LOCAL_ACCESS_TOKEN },
        });
      },
    ));
}
async function waitForServerReady(value76 = null) {
  const value77 = Date.now();
  while (Date.now() - value77 < SERVER_READY_TIMEOUT_MS) {
    desktopStartupLifecycle.assertStarting();
    if (await probeServer()) {
      desktopStartupLifecycle.assertStarting();
      return true;
    }
    const value78 = Date.now() - value77;
    (value76?.({
      kind: 'loading',
      title: APP_DISPLAY_NAME + ' 正在启动',
      detail: '正在准备画布环境。',
      hint:
        '已等待 ' +
        Math.ceil(value78 / 1000) +
        ' 秒，预计最多需要 ' +
        Math.ceil(SERVER_READY_TIMEOUT_MS / 1000) +
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
  const attempt = serverRestartAttempts + 1,
    delayMs = Math.min(
      SERVER_RESTART_BASE_DELAY_MS * Math.pow(2, serverRestartAttempts),
      SERVER_RESTART_MAX_DELAY_MS,
    );
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
      .catch((error4) => {
        logDiagnosticEvent({
          type: 'backend.restart_failed',
          level: 'error',
          source: 'main',
          message: 'Local Python service restart failed',
          error: error4,
          context: { attempt: attempt, port: PORT },
        });
        scheduleServerRestart();
      });
  }, delayMs);
  if (typeof serverRestartTimer.unref === 'function') serverRestartTimer.unref();
}
async function ensureServerRunning(value79 = null) {
  desktopStartupLifecycle.assertStarting();
  value79?.({
    kind: 'loading',
    title: APP_DISPLAY_NAME + ' 正在启动',
    detail: '正在准备画布环境。',
    hint: '启动完成后会自动进入画布。',
  });
  if (await probeServer())
    return (
      value79?.({
        kind: 'loading',
        title: APP_DISPLAY_NAME + ' 正在启动',
        detail: '正在打开画布。',
        hint: '',
      }),
      'reused'
    );
  desktopStartupLifecycle.assertStarting();
  const command = resolvePythonCommand();
  value79?.({
    kind: 'loading',
    title: APP_DISPLAY_NAME + ' 正在启动',
    detail: '正在加载本地工作环境。',
    hint: '启动完成后会自动进入画布。',
  });
  const writeStream = createWriteStream(SERVER_LOG_PATH, { flags: 'a' });
  writeStream.write(
    '\n[' +
      new Date().toISOString() +
      '] starting ' +
      command +
      ' server.py --host=' +
      HOST +
      ' --port=' +
      PORT +
      '\n',
  );
  let error5 = null;
  let launchedServer = null;
  ((launchedServer = spawnedServer =
    spawn(command, ['server.py', '--host=' + HOST, '--port=' + PORT], {
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
    launchedServer.stdout?.pipe(writeStream, { end: false }),
    launchedServer.stderr?.pipe(writeStream, { end: false }),
    launchedServer.once('spawn', () => {
      if (desktopQuitCoordinator.isQuitting()) stopSpawnedServerProcess(launchedServer);
    }),
    launchedServer.once('error', (error6) => {
      ((error5 = error6),
        writeStream.write(
          '[' +
            new Date().toISOString() +
            '] spawn error: ' +
            (error6?.stack || error6?.message || error6) +
            '\n',
        ),
        logDiagnosticEvent({
          type: 'backend.spawn_error',
          level: 'error',
          source: 'main',
          message: 'Failed to spawn local Python service',
          error: error6,
          context: { command: command, port: PORT },
        }),
        value79?.({
          kind: 'error',
          title: APP_DISPLAY_NAME + ' 启动失败',
          detail: '启动本地工作环境失败。',
          hint: '请重启应用，若仍失败请导出诊断日志。',
        }));
    }),
    launchedServer.once('close', (code, signal) => {
      (writeStream.write(
        '[' + new Date().toISOString() + '] exited code=' + (code ?? '') + ' signal=' + (signal ?? '') + '\n',
      ),
        writeStream.end(),
        (code !== 0 || signal) &&
          logDiagnosticEvent({
            type: 'backend.exited',
            level: 'warn',
            source: 'main',
            message: 'Local Python service exited',
            context: { code: code, signal: signal, port: PORT },
          }),
        spawnedServer === launchedServer && (spawnedServer = null),
        serverShutdownRequested || scheduleServerRestart());
    }));
  const waitForServerReady2 = await waitForServerReady(value79);
  if (!waitForServerReady2) {
    (stopSpawnedServer(),
      logDiagnosticEvent({
        type: 'backend.ready_timeout',
        level: 'error',
        source: 'main',
        message: 'Local Python service did not become ready',
        context: { appUrl: APP_URL, timeoutMs: SERVER_READY_TIMEOUT_MS },
      }));
    if (error5)
      throw new Error('Failed to start ' + APP_DISPLAY_NAME + ' server: ' + (error5.message || error5));
    throw new Error(APP_DISPLAY_NAME + ' server did not become ready at ' + APP_URL);
  }
  return (
    // A ready backend clears the backoff so a later crash gets a full retry budget again.
    (serverRestartAttempts = 0),
    value79?.({
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
function normalizeVirtualLocalPath(value80) {
  const enabled3 = String(value80 || '').trim();
  if (!enabled3) return '';
  if (/^(?:file|javascript|data|blob):/i.test(enabled3)) return '';
  if (/^https?:/i.test(enabled3))
    try {
      const uRL = new URL(enabled3),
        value81 = String(uRL.hostname || '').toLowerCase();
      if (value81 !== 'localhost' && value81 !== '127.0.0.1' && value81 !== '::1' && value81 !== '[::1]')
        return '';
      return normalizeVirtualLocalPath(uRL.pathname);
    } catch {
      return '';
    }
  const value82 = enabled3.replace(/\\/g, '/');
  if (/^[a-z][a-z0-9+.-]*:/i.test(value82)) return '';
  if (/^[a-zA-Z]:\//.test(value82) || value82.startsWith('//')) return '';
  let decodeURIComponent2 = value82.split(/[?#]/, 1)[0];
  try {
    decodeURIComponent2 = decodeURIComponent(decodeURIComponent2);
  } catch {}
  const enabled4 = path.posix.normalize(decodeURIComponent2.replace(/^\/+/, ''));
  if (!enabled4 || enabled4 === '.' || enabled4 === '..' || enabled4.startsWith('../')) return '';
  if (
    !enabled4.startsWith('data/assets/') &&
    !enabled4.startsWith('data/uploads/') &&
    !enabled4.startsWith('output/')
  )
    return '';
  return enabled4;
}
function resolveLocalVirtualPath(value83) {
  const list5 = normalizeVirtualLocalPath(value83);
  if (!list5) return '';
  const value84 = [
    ['data/assets/', getAssetsDir()],
    ['data/uploads/', getUploadsDir()],
    ['output/', getOutputDir()],
  ];
  for (const [list6, value85] of value84) {
    if (!list5.startsWith(list6)) continue;
    return resolveExistingPathWithinRoot(value85, list5.slice(list6.length));
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
function normalizeSecureSettingsKeys(event2 = {}) {
  const list7 = Array.isArray(event2?.keys) ? event2.keys : [event2?.key];
  return list7.map((item4) => String(item4 || '').trim()).filter(isAllowedSecureSettingKey);
}
function syncSystemRecentDocumentsBestEffort() {
  if (process.env.AIC_USER_DATA_ROOT)
    return { ok: true, count: 0, paths: [], skipped: 'independent-profile' };
  try {
    return syncRecentProjectsToSystemRecentDocuments({
      app: app,
      recentStorePath: getRecentProjectsStorePath(),
    });
  } catch (error7) {
    return (
      console.warn('[electron] sync recent documents failed:', error7),
      { ok: false, error: String(error7?.message || error7), count: 0, paths: [] }
    );
  }
}
function resolveClipboardAbsoluteFilePath(value86) {
  let enabled5 = String(value86 || '').trim();
  if (!enabled5) return '';
  enabled5 = enabled5.replace(/^"|"$/g, '');
  if (/^file:\/\//i.test(enabled5))
    try {
      enabled5 = fileURLToPath(enabled5);
    } catch {
      return '';
    }
  if (!path.isAbsolute(enabled5)) return '';
  try {
    const realpathSync2 = realpathSync(enabled5),
      statSync2 = statSync(realpathSync2);
    return statSync2.isFile() ? realpathSync2 : '';
  } catch {
    return '';
  }
}
function resolveClipboardImagePath(options6 = {}) {
  const clipboardAbsoluteFilePath = resolveClipboardAbsoluteFilePath(options6?.absolutePath);
  if (clipboardAbsoluteFilePath) return clipboardAbsoluteFilePath;
  const enabled6 = String(options6?.localPath || '').trim();
  if (!enabled6) return '';
  const localVirtualPath3 = resolveLocalVirtualPath(enabled6);
  if (!localVirtualPath3) return '';
  try {
    const statSync3 = statSync(localVirtualPath3);
    return statSync3.isFile() ? localVirtualPath3 : '';
  } catch {
    return '';
  }
}
function createClipboardNativeImage(options7 = {}) {
  const value87 = String(options7?.pngBase64 || '').trim();
  if (value87) return nativeImage.createFromBuffer(Buffer.from(value87, 'base64'));
  const clipboardImagePath = resolveClipboardImagePath(options7);
  if (!clipboardImagePath) return nativeImage.createEmpty();
  return nativeImage.createFromPath(clipboardImagePath);
}
function getMimeTypeForClipboardFile(value88) {
  const value89 = path.extname(String(value88 || '')).toLowerCase(),
    value90 = {
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
  return value90[value89] || 'application/octet-stream';
}
function buildClipboardFileMeta(path3) {
  const statSync4 = statSync(path3);
  return {
    path: path3,
    name: path.basename(path3),
    type: getMimeTypeForClipboardFile(path3),
    size: Number(statSync4.size || 0) || 0,
  };
}
function normalizeClipboardFileReferences(list8 = []) {
  const map = new Set(),
    list9 = [];
  return (
    (Array.isArray(list8) ? list8 : [list8]).forEach((item5) => {
      const value91 = item5 && typeof item5 === 'object' ? item5.path : item5,
        clipboardAbsoluteFilePath2 = resolveClipboardAbsoluteFilePath(value91);
      if (!clipboardAbsoluteFilePath2) return;
      const value92 =
        process.platform === 'win32' || process.platform === 'darwin'
          ? clipboardAbsoluteFilePath2.toLowerCase()
          : clipboardAbsoluteFilePath2;
      if (map.has(value92)) return;
      (map.add(value92), list9.push(buildClipboardFileMeta(clipboardAbsoluteFilePath2)));
    }),
    list9
  );
}
function parseClipboardFileReferencesFromText(value93) {
  const value94 = String(value93 || '')
    .split(/\r?\n/)
    .map((item6) => item6.trim())
    .filter(Boolean);
  return normalizeClipboardFileReferences(value94);
}
function resolveKnownFolder(value95) {
  const value96 = String(value95 || '').trim();
  if (value96 === 'assets') return getAssetsDir();
  if (value96 === 'output') return getOutputDir();
  if (value96 === 'project') return getCanvasProjectDir();
  return '';
}
function getLocalAssetCleanupManager() {
  if (localAssetCleanupManager) return localAssetCleanupManager;
  return (
    (localAssetCleanupManager = createLocalAssetCleanupManager({
      trashItem: (value97) => shell.trashItem(value97),
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
      extensions: SUPPORTED_PROJECT_FILE_EXTENSIONS.map((item7) => item7.replace(/^\./, '')),
    },
  ];
}
function normalizePositiveTimestamp(value98) {
  const count7 = Number(value98);
  return Number.isFinite(count7) && count7 > 0 ? Math.round(count7) : 0;
}
function getFileLastModified(value99) {
  const enabled7 = String(value99 || '').trim();
  if (!enabled7 || !path.isAbsolute(enabled7)) return 0;
  try {
    const statSync5 = statSync(enabled7);
    return statSync5.isFile() ? Math.round(statSync5.mtimeMs) : 0;
  } catch {
    return 0;
  }
}
function resolveCurrentProjectLastModified(options8 = {}, value100 = {}) {
  const list10 = [
      normalizePositiveTimestamp(options8?.lastKnownProjectLastModified ?? options8?.lastModified),
    ],
    value101 = String(options8?.recentId || value100?.recentId || '').trim();
  if (value101) {
    const recentProject = findRecentProject(getRecentProjectsStorePath(), value101);
    (list10.push(normalizePositiveTimestamp(recentProject?.lastModified)),
      list10.push(getFileLastModified(recentProject?.path)));
  }
  return (
    list10.push(getFileLastModified(options8?.displayPath)),
    list10.push(getFileLastModified(value100?.displayPath)),
    Math.max(0, ...list10)
  );
}
function getDesktopRecoverySnapshotInfo(options9 = {}) {
  const recoverySnapshotPath = getRecoverySnapshotPath(),
    recoverySnapshot = readRecoverySnapshot(recoverySnapshotPath),
    currentLastModified = resolveCurrentProjectLastModified(options9, recoverySnapshot || {});
  return getRecoverySnapshotInfo(recoverySnapshotPath, { currentLastModified: currentLastModified });
}
function writeDesktopRecoverySnapshot(options10 = {}) {
  const savedAt = writeRecoverySnapshot(getRecoverySnapshotPath(), options10);
  return {
    success: true,
    savedAt: savedAt.savedAt,
    projectId: savedAt.projectId,
    projectName: savedAt.projectName,
  };
}
function readDesktopRecoverySnapshot() {
  const projectId = readRecoverySnapshot(getRecoverySnapshotPath());
  if (!projectId) return { success: false, exists: false, canceled: false };
  return {
    success: true,
    exists: true,
    canceled: false,
    recovery: true,
    projectId: projectId.projectId,
    projectName: projectId.projectName,
    filename: projectId.filename,
    recentId: projectId.recentId,
    displayPath: projectId.displayPath,
    lastModified: projectId.lastKnownProjectLastModified,
    recoverySavedAt: projectId.savedAt,
    data: projectId.data,
  };
}
function clearDesktopRecoverySnapshot(expected = {}) {
  return clearRecoverySnapshotIfMatches(getRecoverySnapshotPath(), expected);
}
function normalizeWindowProjectName(value102) {
  return String(value102 || '')
    .replace(/\s+/g, ' ')
    .trim();
}
function updateMainWindowUnsavedState(enabled8 = mainWindow) {
  if (!enabled8 || enabled8.isDestroyed()) return;
  const value103 = rendererProjectState.hasUnsavedChanges === true,
    windowProjectName = normalizeWindowProjectName(rendererProjectState.projectName),
    value104 = windowProjectName ? windowProjectName + ' - ' + APP_DISPLAY_NAME : APP_DISPLAY_NAME;
  enabled8.setTitle('' + value104 + (value103 ? ' *' : ''));
  try {
    enabled8.setDocumentEdited(value103);
  } catch {}
}
function handleRendererUnsavedState(hasUnsavedChanges = {}) {
  ((rendererProjectState = {
    hasUnsavedChanges: hasUnsavedChanges?.hasUnsavedChanges === true || hasUnsavedChanges?.dirty === true,
    projectName: normalizeWindowProjectName(hasUnsavedChanges?.projectName),
  }),
    updateMainWindowUnsavedState());
}
function buildProjectOpenResponse(value105, data2, recentId) {
  const filename = recentId?.filename || path.basename(value105),
    projectName = recentId?.name || stripProjectFileExtension(filename);
  return {
    success: true,
    canceled: false,
    projectId: stripProjectFileExtension(filename),
    projectName: projectName,
    filename: filename,
    recentId: recentId?.recentId || '',
    displayPath: recentId?.displayPath || value105,
    lastModified: Number(recentId?.lastModified || 0) || 0,
    data: data2,
  };
}
function openProjectFileByPath(value106, { source: source = 'dialog' } = {}) {
  const value107 = path.resolve(String(value106 || '')),
    projectJson = readProjectJson(value107),
    upsertRecentProject2 = upsertRecentProject(getRecentProjectsStorePath(), value107, {
      name: stripProjectFileExtension(path.basename(value107)),
    });
  return (
    syncSystemRecentDocumentsBestEffort(),
    { ...buildProjectOpenResponse(value107, projectJson, upsertRecentProject2), source: source }
  );
}
function enqueueExternalProjectOpenRequest(args4) {
  if (!args4 || typeof args4 !== 'object') return;
  (pendingExternalProjectOpenRequests.push({ ...args4, queuedAt: Date.now() }),
    mainWindow?.webContents?.send('project:externalOpenAvailable'));
}
function findFirstSupportedProjectPackagePathFromArgs(value108) {
  const value109 = Array.isArray(value108) ? value108 : [];
  for (const value110 of value109) {
    const enabled9 = String(value110 || '')
      .trim()
      .replace(/^"|"$/g, '');
    if (!enabled9 || !path.isAbsolute(enabled9) || path.extname(enabled9).toLowerCase() !== '.aicpkg')
      continue;
    try {
      if (statSync(enabled9).isFile()) return path.resolve(enabled9);
    } catch {}
  }
  return '';
}
function queueExternalProjectOpenPath(value111, source2) {
  const firstSupportedProjectPackagePathFromArgs = findFirstSupportedProjectPackagePathFromArgs([value111]),
    filePath =
      firstSupportedProjectPackagePathFromArgs ||
      findFirstSupportedProjectPathFromArgs([value111], { mustExist: true });
  if (!filePath) return false;
  try {
    (enqueueExternalProjectOpenRequest(
      firstSupportedProjectPackagePathFromArgs
        ? externalPackageTickets.issueRequest(filePath, source2)
        : openProjectFileByPath(filePath, { source: source2 }),
    ),
      logDiagnosticEvent({
        type: 'project.external_open_queued',
        level: 'info',
        source: 'main',
        message: 'External project open queued',
        context: { source: source2, filePath: filePath },
      }));
  } catch (error8) {
    (logDiagnosticEvent({
      type: 'project.external_open_failed',
      level: 'error',
      source: 'main',
      message: 'External project open failed',
      error: error8,
      context: { source: source2, filePath: filePath },
    }),
      enqueueExternalProjectOpenRequest({
        success: false,
        canceled: false,
        source: source2,
        ...(firstSupportedProjectPackagePathFromArgs ? {} : { filePath: filePath }),
        filename: path.basename(filePath),
        error: String(error8?.message || error8),
      }));
  }
  return true;
}
function queueExternalProjectOpenFromArgs(value112, value113) {
  const firstSupportedProjectPackagePathFromArgs2 =
    findFirstSupportedProjectPackagePathFromArgs(value112) ||
    findFirstSupportedProjectPathFromArgs(value112, { mustExist: true });
  return firstSupportedProjectPackagePathFromArgs2
    ? queueExternalProjectOpenPath(firstSupportedProjectPackagePathFromArgs2, value113)
    : false;
}
async function openDesktopProject(options11 = {}) {
  const recentProjectsStorePath = getRecentProjectsStorePath(),
    source3 = String(options11?.recentId || '').trim();
  let value114 = '';
  if (source3) {
    const recentProject2 = findRecentProject(recentProjectsStorePath, source3);
    if (!recentProject2) throw new Error('最近项目不存在');
    if (!recentProject2.exists) throw new Error('最近项目文件不存在');
    value114 = recentProject2.path;
  } else {
    mkdirSync(getCanvasProjectDir(), { recursive: true });
    const enabled10 = await foregroundDialogs.showOpenDialog({
      title: '打开项目',
      defaultPath: getCanvasProjectDir(),
      properties: ['openFile'],
      filters: getProjectDialogFilters(),
    });
    if (enabled10.canceled || !enabled10.filePaths?.[0]) return { success: false, canceled: true };
    value114 = enabled10.filePaths[0];
  }
  return openProjectFileByPath(value114, { source: source3 ? 'recent' : 'dialog' });
}
function normalizeDialogOptionText(value115, value116 = '', value117 = 180) {
  const list11 = String(value115 || '')
    .replace(/\0/g, '')
    .trim();
  if (!list11) return value116;
  return list11.slice(0, value117);
}
async function selectDirectory(options12 = {}) {
  const title = normalizeDialogOptionText(options12?.title, '选择保存目录', 80),
    dialogOptionText = normalizeDialogOptionText(options12?.defaultPath, '', 1024),
    value118 = { title: title, properties: ['openDirectory', 'createDirectory'] };
  if (dialogOptionText) value118.defaultPath = dialogOptionText;
  const path4 = await foregroundDialogs.showOpenDialog(value118);
  if (path4.canceled || !path4.filePaths?.[0]) return { success: false, canceled: true };
  return { success: true, canceled: false, path: path4.filePaths[0] };
}
async function saveDesktopProject(options13 = {}) {
  const recentProjectsStorePath2 = getRecentProjectsStorePath(),
    value119 = String(options13?.mode || 'save').trim() === 'saveAs' ? 'saveAs' : 'save',
    name2 = sanitizeProjectName(options13?.projectName || options13?.projectId || '未命名画布');
  let withJsonProjectExtension2 = '';
  if (value119 === 'save') {
    const value120 = String(options13?.recentId || '').trim(),
      value121 = value120 ? findRecentProject(recentProjectsStorePath2, value120) : null;
    withJsonProjectExtension2 = value121?.path || buildDefaultProjectPath(getCanvasProjectDir(), name2);
  } else {
    mkdirSync(getCanvasProjectDir(), { recursive: true });
    const enabled11 = await foregroundDialogs.showSaveDialog({
      title: '另存为项目',
      defaultPath: buildDefaultProjectPath(getCanvasProjectDir(), name2),
      filters: getProjectDialogFilters(),
    });
    if (enabled11.canceled || !enabled11.filePath) return { success: false, canceled: true };
    withJsonProjectExtension2 = withJsonProjectExtension(enabled11.filePath);
  }
  writeProjectJson(withJsonProjectExtension2, options13?.multiData || {});
  const projectName2 = upsertRecentProject(recentProjectsStorePath2, withJsonProjectExtension2, {
    name: name2,
  });
  return (
    syncSystemRecentDocumentsBestEffort(),
    {
      success: true,
      canceled: false,
      projectId: stripProjectFileExtension(projectName2.filename || ''),
      projectName: projectName2.name,
      filename: projectName2.filename,
      recentId: projectName2.recentId,
      displayPath: projectName2.displayPath,
      lastModified: projectName2.lastModified,
    }
  );
}
function readAppVersionFromIndexHtml() {
  try {
    const fileSync = readFileSync(path.join(APP_ROOT, 'index.html'), 'utf8'),
      value122 = fileSync.match(/<meta\s+name=["']app-version["']\s+content=["']([^"']+)["']/i);
    return String(value122?.[1] || '').trim();
  } catch {
    return '';
  }
}
function getAutoUpdater() {
  return (!autoUpdaterInstance && (autoUpdaterInstance = electron_updater.autoUpdater), autoUpdaterInstance);
}
function handleUpdaterEvent(options14 = {}) {
  const value123 = String(options14.type || '');
  if (value123 === 'download-started' || value123 === 'download-retry') {
    (setTaskbarProgressSource('updater', 0), setPowerSaveBlocker('updater', true));
    return;
  }
  if (value123 === 'download-progress') {
    setPowerSaveBlocker('updater', true);
    return;
  }
  (value123 === 'downloaded' ||
    value123 === 'download-failed' ||
    value123 === 'error' ||
    value123 === 'not-available') &&
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
        clearSpawnedServer: (value124) => {
          if (spawnedServer === value124) spawnedServer = null;
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
        setProgressBar: (value125) => {
          setTaskbarProgressSource('updater', value125);
        },
        sendEvent: (value126) => {
          latestUpdaterEvent = value126;
          if (value126?.info) latestUpdaterInfo = value126.info;
          handleUpdaterEvent(value126);
          if (!mainWindow || mainWindow.isDestroyed()) return;
          mainWindow.webContents.send('appUpdater:event', value126);
        },
      })),
    updaterController
  );
}
function readLocalPreviewVideoUrl() {
  try {
    const fileSync2 = readFileSync(path.join(APP_ROOT, 'release_notes.txt'), 'utf8'),
      extractPreviewVideoUrlFromNotes2 = extractPreviewVideoUrlFromNotes(fileSync2);
    if (extractPreviewVideoUrlFromNotes2) return extractPreviewVideoUrlFromNotes2;
  } catch {}
  try {
    const fileSync3 = readFileSync(path.join(APP_ROOT, 'release_video_url.txt'), 'utf8');
    return (
      fileSync3
        .split(/\r?\n/)
        .map((item8) => item8.trim())
        .find((enabled12) => enabled12 && !enabled12.startsWith('#')) || ''
    );
  } catch {
    return '';
  }
}
function normalizeUpdaterInfo(value127) {
  return normalizeUpdaterInfoPayload(value127, { readLocalPreviewVideoUrl: readLocalPreviewVideoUrl });
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
      .catch((value128) => {
        console.warn('[electron][updater] check failed:', value128);
      }));
}
function loadCanvasWindow(enabled13 = mainWindow) {
  if (!enabled13 || enabled13.isDestroyed()) return;
  void enabled13.loadURL(APP_URL);
}
const rendererNavigationGuard = createRendererNavigationGuard({
  getMainWindow: () => mainWindow,
  requestSnapshot: requestRendererRecoverySnapshot,
  shouldPrepare: (window) => window.webContents.getURL().startsWith(APP_ORIGIN),
  onFailure: async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: ['返回并保存'],
      defaultId: 0,
      cancelId: 0,
      message: '保存未完成，已取消重载。',
      detail: '后台服务和当前窗口保持运行。请保存后重试。',
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
    } catch (error9) {
      (console.error('[electron] backend restart failed:', error9),
        logDiagnosticEvent({
          type: 'backend.restart_failed',
          level: 'error',
          source: 'main',
          message: 'Backend restart failed',
          error: error9,
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
    reloadCanvas: (ignoreCache) =>
      rendererNavigationGuard.run('renderer-reload', (window) => {
        if (ignoreCache) window.webContents.reloadIgnoringCache();
        else window.webContents.reload();
      }),
    relaunchElectron: () => desktopQuitCoordinator.requestRelaunch(),
  }),
    installLocalApiTokenHeader());
  const { isMaximized: isMaximized3, ...args5 } = readWindowState();
  ((rendererProjectState = { hasUnsavedChanges: false, projectName: '' }),
    (mainWindow = new BrowserWindow({
      ...args5,
      minWidth: 1024,
      minHeight: 720,
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
      (isMaximized3 && mainWindow?.maximize(),
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
    mainWindow.webContents.on('did-fail-load', (value129, errorCode, errorDescription, url) => {
      logDiagnosticEvent({
        type: 'renderer.load_failed',
        level: 'error',
        source: 'main',
        message: 'Renderer failed to load',
        context: { errorCode: errorCode, errorDescription: errorDescription, url: url },
      });
    }),
    mainWindow.webContents.on('render-process-gone', (value130, context = {}) => {
      logDiagnosticEvent({
        type: 'renderer.process_gone',
        level: 'error',
        source: 'main',
        message: 'Renderer process exited unexpectedly',
        context: context,
      });
    }),
    mainWindow.webContents.setWindowOpenHandler(({ url: url2 }) => {
      return (openExternalUrl(url2), { action: 'deny' });
    }),
    mainWindow.webContents.on('will-navigate', (event3, value131) => {
      if (isLocalAppUrl(value131)) return;
      (event3.preventDefault(), openExternalUrl(value131));
    }),
    mainWindow.on('focus', () => void localRuntimeKeepAlive.start('focus')),
    mainWindow.on('show', () => void localRuntimeKeepAlive.start('show')),
    mainWindow.on('restore', () => void localRuntimeKeepAlive.start('restore')),
    mainWindow.on('hide', () => void localRuntimeKeepAlive.refresh('hide')),
    mainWindow.on('minimize', () => void localRuntimeKeepAlive.refresh('minimize')),
    mainWindow.webContents.on('will-prevent-unload', () => desktopQuitCoordinator.cancelQuit()),
    mainWindow.on('closed', () => {
      mainWindow = null;
      runCleanupSteps(
        [
          () => webPreviewViewManager.disposeViews(),
          () => localRuntimeKeepAlive.stop(),
          () => desktopQuitCoordinator.mainWindowClosed(),
        ],
        {
          onError: (error) =>
            logDiagnosticEvent({ type: 'app.window_cleanup_failed', level: 'warn', source: 'main', error }),
        },
      );
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
    process.env.AIC_DISABLE_GLOBAL_CAPTURE !== '1' &&
      screenshotOverlayController.installGlobalScreenshotShortcut(),
    process.env.AIC_DISABLE_GLOBAL_CAPTURE !== '1' &&
      globalTextPresetShortcutController.installGlobalShortcut(),
    queueExternalProjectOpenFromArgs(process.argv, 'startup'),
    await desktopStartupLifecycle.prepareBackend(),
    desktopStartupLifecycle.assertStarting(),
    void refreshProductDisplayName(),
    void localRuntimeKeepAlive.start('server-ready'),
    loadCanvasWindow());
}
function handleStartupFailure(error10) {
  if (error10?.code === 'AIC_DESKTOP_STARTUP_CANCELLED') return;
  (console.error('[electron] startup failed:', error10),
    logDiagnosticEvent({
      type: 'app.startup_failed',
      level: 'error',
      source: 'main',
      message: 'Application startup failed',
      error: error10,
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
    app.on('open-file', (event4, value132) => {
      (event4.preventDefault(), queueExternalProjectOpenPath(value132, 'open-file'), focusMainWindow());
    }),
    app.whenReady().then(() => {
      void startApp().catch(handleStartupFailure);
    }),
    app.on('second-instance', (value133, value134) => {
      (focusMainWindow(), queueExternalProjectOpenFromArgs(value134, 'second-instance'));
    }),
    app.on('activate', () => {
      (!mainWindow || mainWindow.isDestroyed()) &&
        void startApp().catch((error11) => {
          (console.error('[electron] activate failed:', error11),
            logDiagnosticEvent({
              type: 'app.activate_failed',
              level: 'error',
              source: 'main',
              message: 'Application activate failed',
              error: error11,
            }));
        });
    }),
    app.on('window-all-closed', () => {
      process.platform !== 'darwin' && app.quit();
    }),
    app.on('before-quit', (event) => desktopQuitCoordinator.beforeQuit(event)),
    app.on('will-quit', () => desktopQuitCoordinator.willQuit()));
}
GOT_SINGLE_INSTANCE_LOCK && installAppLifecycleHandlers();
(process.on('uncaughtException', (error12) => {
  (logDiagnosticEvent({
    type: 'main.uncaught_exception',
    level: 'error',
    source: 'main',
    message: 'Uncaught exception in Electron main process',
    error: error12,
  }),
    console.error('[electron] uncaught exception:', error12));
}),
  process.on('unhandledRejection', (error13) => {
    (logDiagnosticEvent({
      type: 'main.unhandled_rejection',
      level: 'error',
      source: 'main',
      message: 'Unhandled rejection in Electron main process',
      error: error13 instanceof Error ? error13 : null,
      context: error13 instanceof Error ? {} : { reason: String(error13) },
    }),
      console.error('[electron] unhandled rejection:', error13));
  }));
