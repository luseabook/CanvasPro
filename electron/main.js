import {
  app,
  autoUpdater,
  BrowserWindow,
  dialog,
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
import { execFileSync, spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import {
  copyFileSync,
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { installAppMenu } from './appMenu.js';
import { createDeviceIdentityManager } from './deviceIdentity.js';
import { createDiagnosticsManager } from './diagnostics.js';
import { formatExternalUrlForLog, normalizeExternalUrl } from './externalLinks.js';
import { createLocalAssetCleanupManager } from './localAssetCleanup.js';
import {
  createLocalAssetCleanupRootsResolver,
  readFileSavePathsForLocalCleanup,
} from './localAssetCleanupRoots.js';
import { MediaTaskQueue } from './mediaTaskQueue.js';
import { registerSharedMediaTaskHandlers } from './mediaTasks/registerSharedMediaTaskHandlers.js';
import { syncRecentProjectsToSystemRecentDocuments } from './recentDocuments.js';
import { installRecoverySnapshotBeforeClose, requestRendererRecoverySnapshot } from './recoverySnapshot.js';
import { createSecureSettingsStore } from './secureSettingsStore.js';
import { createScreenshotOverlayController } from './screenshotOverlayController.js';
import { buildLegacyFileSavePathEnv, createStorageRoots } from './storageRoots.js';
import { createUpdaterController } from './updaterController.js';
import { extractPreviewVideoUrlFromNotes, normalizeUpdaterInfoPayload } from './updaterInfoNormalizer.js';
import { createUpdateInstallPreparation } from './updateInstallPreparation.js';
import { createProjectPackageController } from './projectPackageController.js';
import {
  createSystemNotificationSoundFileService,
  listNotificationSoundMp3Files,
} from './notificationSoundFiles.js';
import { createBackgroundCompletionNotifier } from './backgroundCompletionNotification.js';
import { activateMainWindow } from './mainWindowActivation.js';
import { createMainIpcHandlerInstaller } from './ipc/mainIpcSetup.js';
import { createLocalRuntimeKeepAliveController } from './localRuntimeKeepAlive.js';
import { configureRendererResponsiveness } from './rendererResponsiveness.js';
import { createRemoteAssetImporter } from './remoteAssetImport.js';
import { createWebPreviewViewManager } from './webPreviewViewManager.js';
import {
  buildDefaultProjectPath,
  findFirstSupportedProjectPathFromArgs,
  findRecentProject,
  getRecoverySnapshotInfo,
  listRecentProjects,
  readProjectJson,
  readRecoverySnapshot,
  removeRecentProject,
  removeRecoverySnapshot,
  sanitizeProjectName,
  stripProjectFileExtension,
  SUPPORTED_PROJECT_FILE_EXTENSIONS,
  upsertRecentProject,
  withJsonProjectExtension,
  writeProjectJson,
  writeRecoverySnapshot,
} from '../src/services/desktopProjectFileStore.js';
import { registerIpcHandlers } from './ipc/registerIpcHandlers.js';
const APP_DISPLAY_NAME = 'AI CanvasPro',
  APP_USER_DATA_ROOT = path.join(app.getPath('appData'), APP_DISPLAY_NAME),
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
  }),
  PACKAGED_INSTALL_ROOT = STORAGE_ROOTS.installRoot,
  PACKAGED_INSTALL_DATA_ROOT = STORAGE_ROOTS.installDataRoot,
  PACKAGED_FILES_ROOT = STORAGE_ROOTS.storageRoot,
  LEGACY_PACKAGED_FILES_ROOTS = STORAGE_ROOTS.legacyFilesRoots,
  LEGACY_PACKAGED_FILES_ROOT = LEGACY_PACKAGED_FILES_ROOTS[0] || APP_ROOT,
  HOST = '127.0.0.1',
  PORT = Number.parseInt(process.env.AICANVAS_PORT || '8777', 10) || 0x2249,
  APP_ORIGIN = 'http://' + HOST + ':' + PORT,
  APP_URL = APP_ORIGIN + '/',
  SERVER_READY_TIMEOUT_MS = 0x7530,
  SERVER_READY_INTERVAL_MS = 0x190,
  LOCAL_ACCESS_TOKEN = randomBytes(32).toString('hex'),
  SERVER_ID_HEADER = 'x-aicanvas-server',
  SERVER_ID_VALUE = 'AI CanvasPro',
  LOCAL_PREVIEW_SCHEME = 'aic-local-preview',
  LOCAL_PREVIEW_TTL_MS = 12 * 60 * 60 * 0x3e8,
  LONG_MEDIA_TASK_NOTIFICATION_MS = 0x4e20,
  VIDEO_PROXY_TRANSCODE_PRESET = 'veryfast',
  VIDEO_PROXY_TRANSCODE_CRF = '23',
  CLIPBOARD_FILE_REFERENCES_FORMAT = 'application/x-ai-canvas-file-references',
  RECOVERY_SNAPSHOT_FILENAME = 'recovery-snapshot.json',
  GLOBAL_SCREENSHOT_ACCELERATOR = 'Alt+Q';
let mainWindow = null,
  spawnedServer = null,
  updaterHandlersInstalled = false,
  updateCheckStarted = false,
  autoUpdaterInstance = null,
  updaterController = null,
  localApiTokenHeaderInstalled = false,
  latestUpdaterEvent = null,
  latestUpdaterInfo = null,
  localPreviewProtocolInstalled = false,
  backendRestartInProgress = false,
  mediaTaskQueue = null,
  localAssetCleanupManager = null,
  secureSettingsStore = null,
  updateInstallPreparation = null,
  mediaTaskActivity = { activeCount: 0, waitingCount: 0, totalCount: 0, progress: 0, activeTasks: [] };
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
  localPreviewEntries = new Map(),
  taskbarProgressSources = new Map(),
  powerSaveBlockerReasons = new Map(),
  notifiedMediaTaskIds = new Set();
(configureRendererResponsiveness(app),
  protocol.registerSchemesAsPrivileged([
    {
      scheme: LOCAL_PREVIEW_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
    },
  ]),
  app.setName(APP_DISPLAY_NAME));
const GOT_SINGLE_INSTANCE_LOCK = app.requestSingleInstanceLock();
!GOT_SINGLE_INSTANCE_LOCK && (app.exit(0), process.exit(0));
const USER_DATA_DIR = APP_USER_DATA_ROOT;
(mkdirSync(USER_DATA_DIR, { recursive: true }), app.setPath('userData', USER_DATA_DIR));
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
function delay(_0x3c4423) {
  return new Promise((_0x520c29) => {
    setTimeout(_0x520c29, _0x3c4423);
  });
}
function escapeHtml(_0x1255c9) {
  return String(_0x1255c9 ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function createStartupHtml(_0x53f3ac = {}) {
  const _0x253e9e = String(_0x53f3ac.kind || 'loading'),
    _0x1f323a = escapeHtml(_0x53f3ac.title || APP_DISPLAY_NAME + ' 正在启动'),
    _0x5a6a01 = escapeHtml(_0x53f3ac.detail || ''),
    _0x4cf970 = escapeHtml(_0x53f3ac.hint || ''),
    _0x1d57bb = _0x253e9e === 'error';
  return (
    '<!doctype html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>' +
    _0x1f323a +
    '</title>\n  <style>\n    :root {\n      color-scheme: light dark;\n      font-family: "Segoe UI", Arial, sans-serif;\n      background: Canvas;\n      color: CanvasText;\n    }\n    body {\n      margin: 0;\n      min-height: 100vh;\n      display: grid;\n      place-items: center;\n      background: Canvas;\n    }\n    main {\n      width: min(560px, calc(100vw - 56px));\n    }\n    h1 {\n      margin: 0 0 14px;\n      font-size: 24px;\n      font-weight: 650;\n      letter-spacing: 0;\n    }\n    p {\n      margin: 8px 0;\n      color: GrayText;\n      line-height: 1.55;\n      font-size: 14px;\n    }\n    .mark {\n      width: 40px;\n      height: 40px;\n      border-radius: 50%;\n      margin-bottom: 22px;\n      border: 3px solid ' +
    (_0x1d57bb ? 'Mark' : 'AccentColor') +
    ';\n      border-top-color: transparent;\n      animation: ' +
    (_0x1d57bb ? 'none' : 'spin 0.9s linear infinite') +
    ';\n    }\n    @keyframes spin {\n      to { transform: rotate(360deg); }\n    }\n  </style>\n</head>\n<body>\n  <main>\n    <div class="mark"></div>\n    <h1>' +
    _0x1f323a +
    '</h1>\n    ' +
    (_0x5a6a01 ? '<p>' + _0x5a6a01 + '</p>' : '') +
    '\n    ' +
    (_0x4cf970 ? '<p>' + _0x4cf970 + '</p>' : '') +
    '\n  </main>\n</body>\n</html>'
  );
}
function loadStartupStatus(_0x405305) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const _0x1cf295 = createStartupHtml(_0x405305);
  void mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(_0x1cf295));
}
function isLocalAppUrl(_0x1d5923) {
  try {
    const _0x3111e1 = new URL(_0x1d5923);
    return _0x3111e1.origin === APP_ORIGIN;
  } catch {
    return false;
  }
}
function openExternalUrl(_0x35e6f8) {
  const _0x3243cb = normalizeExternalUrl(_0x35e6f8);
  if (!_0x3243cb)
    return (
      logDiagnosticEvent({
        type: 'external_link.blocked',
        level: 'warn',
        source: 'main',
        message: 'Blocked external link',
        context: { reason: 'invalid-or-disallowed-protocol' },
      }),
      { ok: false, error: '不允许打开该外部链接' }
    );
  return (
    void shell.openExternal(_0x3243cb),
    logDiagnosticEvent({
      type: 'external_link.opened',
      level: 'info',
      source: 'main',
      message: 'Opened external link',
      context: { url: formatExternalUrlForLog(_0x3243cb) },
    }),
    { ok: true, url: _0x3243cb }
  );
}
function probeServer(_0x1837ce = 0x4b0) {
  return new Promise((_0x5164e0) => {
    const _0x35c039 = http.get(APP_ORIGIN + '/api/v2/runtime/info', { timeout: _0x1837ce }, (_0x2aa121) => {
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
function collectListeningPortPids(_0x460820) {
  try {
    if (process.platform === 'win32') {
      const _0x134e44 = execFileSync('netstat', ['-ano', '-p', 'tcp'], {
        encoding: 'utf8',
        windowsHide: true,
      });
      return _0x134e44
        .split(/\r?\n/)
        .map((_0x3f1035) => _0x3f1035.trim())
        .filter((_0x22361a) => _0x22361a.includes('LISTENING'))
        .map((_0x4ee0df) => _0x4ee0df.split(/\s+/))
        .filter((_0x460f88) => _0x460f88.length >= 5 && _0x460f88[1]?.endsWith(':' + _0x460820))
        .map((_0x52635f) => Number.parseInt(_0x52635f[4], 10))
        .filter((_0x4d167d) => Number.isInteger(_0x4d167d) && _0x4d167d > 0 && _0x4d167d !== process.pid);
    }
    const _0x4d9c71 = execFileSync('lsof', ['-nP', '-iTCP:' + _0x460820, '-sTCP:LISTEN', '-t'], {
      encoding: 'utf8',
      windowsHide: true,
    });
    return _0x4d9c71
      .split(/\r?\n/)
      .map((_0x23cb1c) => Number.parseInt(_0x23cb1c.trim(), 10))
      .filter((_0x3a6338) => Number.isInteger(_0x3a6338) && _0x3a6338 > 0 && _0x3a6338 !== process.pid);
  } catch {
    return [];
  }
}
async function clearPortBeforeStart(_0x49ed70 = null) {
  const _0x3baafe = [...new Set(collectListeningPortPids(PORT))];
  if (!_0x3baafe.length) return;
  _0x49ed70?.({
    kind: 'loading',
    title: APP_DISPLAY_NAME + ' 正在启动',
    detail: '正在恢复上次未关闭的运行环境。',
    hint: '启动完成后会自动进入画布。',
  });
  for (const _0x29e71a of _0x3baafe) {
    try {
      process.platform === 'win32'
        ? execFileSync('taskkill', ['/PID', String(_0x29e71a), '/F', '/T'], {
            stdio: 'ignore',
            windowsHide: true,
          })
        : process.kill(_0x29e71a, 'SIGTERM');
    } catch (_0x57c25c) {
      console.warn('[electron] failed to clear port ' + PORT + ' pid ' + _0x29e71a + ':', _0x57c25c);
    }
  }
  await delay(0x320);
}
function resolvePythonCommand() {
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
  }),
  backgroundCompletionNotifier = createBackgroundCompletionNotifier({
    Notification: Notification,
    getMainWindow: () => mainWindow,
    focusMainWindow: focusMainWindow,
    appName: APP_DISPLAY_NAME,
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
      createLocalPreviewUrl: createLocalPreviewUrl,
      resolveLocalVirtualPath: resolveLocalVirtualPath,
      resolveKnownFolder: resolveKnownFolder,
      openExternalUrl: openExternalUrl,
      getWebPreviewViewManager: () => webPreviewViewManager,
      selectDirectory: selectDirectory,
      listNotificationSoundMp3Files: listNotificationSoundMp3Files,
      ...systemNotificationSoundFiles,
      getMediaTaskQueue: getMediaTaskQueue,
      getLocalAssetCleanupManager: getLocalAssetCleanupManager,
      diagnostics: diagnostics,
      logDir: LOG_DIR,
      logDiagnosticEvent: logDiagnosticEvent,
    },
  });
function readJsonFileSyncSafe(_0x36ea93) {
  try {
    return JSON.parse(readFileSync(_0x36ea93, 'utf8').replace(/^\uFEFF/, ''));
  } catch {
    return {};
  }
}
function readConfiguredFileSavePathsSync() {
  const _0x313bd1 = process.env.LOCALAPPDATA || app.getPath('userData'),
    _0x246912 = [
      path.join(getUserRoot(), 'settings.json'),
      path.join(APP_ROOT, 'user', 'settings.json'),
      path.join(_0x313bd1, 'AI-CanvasPro', 'settings.json'),
    ];
  for (const _0x2e28ea of _0x246912) {
    const _0x45ca76 = readJsonFileSyncSafe(_0x2e28ea),
      _0x1752c3 = _0x45ca76?.fileSavePaths;
    if (_0x1752c3 && typeof _0x1752c3 === 'object') return _0x1752c3;
  }
  return {};
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
function getAssetOriginalDir() {
  return path.join(getAssetsDir(), 'original');
}
function getAssetIndexPath() {
  return path.join(getAssetsDir(), 'assets.index.json');
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
function getSafeOriginalExtension(_0x380c09, _0x388044 = '') {
  const _0x2b070a = path.extname(sanitizeUploadFilename(_0x380c09)).toLowerCase();
  if (_0x2b070a && _0x2b070a.length <= 12) return _0x2b070a;
  const _0x1cbd06 = String(_0x388044 || '')
      .split(';')[0]
      .trim()
      .toLowerCase(),
    _0x59103e = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/bmp': '.bmp',
      'image/avif': '.avif',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
      'audio/mpeg': '.mp3',
      'audio/mp3': '.mp3',
      'audio/wav': '.wav',
      'audio/x-wav': '.wav',
      'audio/mp4': '.m4a',
      'audio/x-m4a': '.m4a',
      'audio/aac': '.aac',
      'audio/ogg': '.ogg',
      'audio/flac': '.flac',
      'audio/webm': '.webm',
    };
  return _0x59103e[_0x1cbd06] || '.bin';
}
function classifyAssetKind(_0x19c63e = '', _0x540606 = '') {
  const _0x452cc2 = String(_0x540606 || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (_0x452cc2.startsWith('image/')) return 'image';
  if (_0x452cc2.startsWith('video/')) return 'video';
  if (_0x452cc2.startsWith('audio/')) return 'audio';
  const _0x924f90 = path.extname(String(_0x19c63e || '')).toLowerCase();
  if (/\.(?:png|jpe?g|webp|gif|bmp|avif|svg)$/i.test(_0x924f90)) return 'image';
  if (/\.(?:mp4|webm|mov|m4v|avi|mkv)$/i.test(_0x924f90)) return 'video';
  if (/\.(?:mp3|wav|m4a|aac|ogg|flac|opus|webm)$/i.test(_0x924f90)) return 'audio';
  return 'file';
}
function hashBuffer(_0x36059c) {
  return createHash('sha256').update(_0x36059c).digest('hex');
}
function readAssetIndex() {
  try {
    const _0x5950a8 = JSON.parse(readFileSync(getAssetIndexPath(), 'utf8'));
    if (_0x5950a8 && typeof _0x5950a8 === 'object')
      return {
        version: 1,
        assets: _0x5950a8.assets && typeof _0x5950a8.assets === 'object' ? _0x5950a8.assets : {},
      };
  } catch {}
  return { version: 1, assets: {} };
}
function writeAssetIndex(_0x2ccf63) {
  const _0x497415 = getAssetIndexPath();
  mkdirSync(path.dirname(_0x497415), { recursive: true });
  const _0x29887c = {
      version: 1,
      assets: _0x2ccf63?.assets && typeof _0x2ccf63.assets === 'object' ? _0x2ccf63.assets : {},
    },
    _0x11002e = _0x497415 + '.' + process.pid + '.' + Date.now() + '.tmp';
  (writeFileSync(_0x11002e, JSON.stringify(_0x29887c, null, 2) + '\n', 'utf8'),
    renameSync(_0x11002e, _0x497415));
}
function toAssetLocalPath(..._0x2b272) {
  return ['data', 'assets', ..._0x2b272].filter(Boolean).join('/').replace(/\\/g, '/');
}
function buildAssetResponse(
  _0x401db6,
  { reused: reused = false, derivativeStatus: derivativeStatus = '' } = {},
) {
  const _0x4c53c1 =
    _0x401db6.kind === 'image' || _0x401db6.kind === 'video'
      ? _0x401db6.displayLocalPath || _0x401db6.originalLocalPath
      : _0x401db6.originalLocalPath;
  return {
    success: true,
    assetId: _0x401db6.assetId,
    reused: !!reused,
    kind: _0x401db6.kind,
    url: _0x4c53c1 ? '/' + _0x4c53c1 : '',
    localPath: _0x401db6.originalLocalPath || '',
    originalLocalPath: _0x401db6.originalLocalPath || '',
    displayLocalPath: _0x401db6.displayLocalPath || '',
    thumbLocalPath: _0x401db6.thumbLocalPath || _0x401db6.posterLocalPath || '',
    posterLocalPath: _0x401db6.posterLocalPath || '',
    waveformLocalPath: _0x401db6.waveformLocalPath || '',
    filename: _0x401db6.originalName || _0x401db6.filename || '',
    storedFilename: path.basename(_0x401db6.originalLocalPath || ''),
    size: Number(_0x401db6.size || 0),
    type: _0x401db6.mimeType || '',
    derivativeStatus: derivativeStatus || _0x401db6.status || '',
    status: _0x401db6.status || '',
    mediaTaskId: _0x401db6.mediaTaskId || '',
    mediaTaskKind: _0x401db6.mediaTaskKind || '',
    mediaTaskStatus: _0x401db6.mediaTaskStatus || '',
    mediaTaskProgress: Number(_0x401db6.mediaTaskProgress || 0) || 0,
    mediaTaskError: _0x401db6.mediaTaskError || '',
    videoProxyStatus: _0x401db6.videoProxyStatus || '',
    videoCodec: _0x401db6.videoCodec || '',
    videoWidth: Number(_0x401db6.videoWidth || _0x401db6.width || 0) || 0,
    videoHeight: Number(_0x401db6.videoHeight || _0x401db6.height || 0) || 0,
    videoDuration: Number(_0x401db6.videoDuration || 0) || 0,
    videoFps: Number(_0x401db6.videoFps || 0) || 0,
    width: Number(_0x401db6.width || _0x401db6.videoWidth || 0) || 0,
    height: Number(_0x401db6.height || _0x401db6.videoHeight || 0) || 0,
    originalUrl: _0x401db6.originalLocalPath ? '/' + _0x401db6.originalLocalPath : '',
    displayUrl: _0x401db6.displayLocalPath ? '/' + _0x401db6.displayLocalPath : '',
    thumbUrl: _0x401db6.thumbLocalPath
      ? '/' + _0x401db6.thumbLocalPath
      : _0x401db6.posterLocalPath
        ? '/' + _0x401db6.posterLocalPath
        : '',
    posterUrl: _0x401db6.posterLocalPath ? '/' + _0x401db6.posterLocalPath : '',
    waveformUrl: _0x401db6.waveformLocalPath ? '/' + _0x401db6.waveformLocalPath : '',
  };
}
function isImageImportPayload(_0x58c09b = {}, _0x538515 = '') {
  const _0x2072c3 = String(_0x58c09b?.type || '').toLowerCase();
  if (_0x2072c3.startsWith('image/')) return true;
  return /\.(?:png|jpe?g|webp|gif|bmp|avif)$/i.test(String(_0x538515 || ''));
}
function isPreviewableLocalMedia(_0x125462 = {}, _0x493a35 = '') {
  const _0x1dea16 = String(_0x125462?.type || '').toLowerCase();
  if (_0x1dea16.startsWith('image/') || _0x1dea16.startsWith('video/') || _0x1dea16.startsWith('audio/'))
    return true;
  return /\.(?:png|jpe?g|webp|gif|bmp|avif|mp4|webm|mov|m4v|mp3|wav|m4a|aac|ogg|flac)$/i.test(
    String(_0x493a35 || ''),
  );
}
function getMimeTypeForPreview(_0x12abd9, _0x4eb249 = '') {
  const _0x4498cf = String(_0x4eb249 || '').toLowerCase();
  if (_0x4498cf.startsWith('image/') || _0x4498cf.startsWith('video/') || _0x4498cf.startsWith('audio/'))
    return _0x4498cf;
  const _0x3d3e11 = path.extname(String(_0x12abd9 || '')).toLowerCase(),
    _0x4d3a0d = {
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
    };
  return _0x4d3a0d[_0x3d3e11] || 'application/octet-stream';
}
function resolveLocalPreviewSourcePath(_0x3fbf54 = {}) {
  const _0x516ae3 = String(_0x3fbf54?.path || '').trim();
  return _0x516ae3 || resolveLocalVirtualPath(_0x3fbf54?.localPath || _0x3fbf54?.url || _0x3fbf54?.src || '');
}
function cleanupLocalPreviewEntries() {
  const _0x4e5b38 = Date.now();
  for (const [_0x32d2e3, _0x461ab2] of localPreviewEntries.entries()) {
    (!_0x461ab2 || Number(_0x461ab2.expiresAt || 0) <= _0x4e5b38) && localPreviewEntries.delete(_0x32d2e3);
  }
}
function parseRangeHeader(_0x4f6756, _0x18ec43) {
  const _0x4c72d2 = String(_0x4f6756 || '').match(/^bytes=(\d*)-(\d*)$/);
  if (!_0x4c72d2) return null;
  const _0x5b2e97 = _0x4c72d2[1],
    _0x308a94 = _0x4c72d2[2];
  let _0x2ee03f = _0x5b2e97 ? Number.parseInt(_0x5b2e97, 10) : 0,
    _0x3ffa72 = _0x308a94 ? Number.parseInt(_0x308a94, 10) : _0x18ec43 - 1;
  if (!_0x5b2e97 && _0x308a94) {
    const _0x3653da = Number.parseInt(_0x308a94, 10);
    ((_0x2ee03f = Math.max(0, _0x18ec43 - _0x3653da)), (_0x3ffa72 = _0x18ec43 - 1));
  }
  if (!Number.isInteger(_0x2ee03f) || !Number.isInteger(_0x3ffa72)) return null;
  if (_0x2ee03f < 0 || _0x3ffa72 < _0x2ee03f || _0x2ee03f >= _0x18ec43) return null;
  return { start: _0x2ee03f, end: Math.min(_0x3ffa72, _0x18ec43 - 1) };
}
function createLocalPreviewUrl(_0x5199a4 = {}) {
  const _0x33cf04 = resolveLocalPreviewSourcePath(_0x5199a4);
  if (!_0x33cf04) throw new Error('缺少文件路径');
  if (!path.isAbsolute(_0x33cf04)) throw new Error('文件路径必须是绝对路径');
  const _0x3a3808 = realpathSync(_0x33cf04),
    _0x15f4b1 = statSync(_0x3a3808);
  if (!_0x15f4b1.isFile()) throw new Error('只支持预览文件');
  if (!isPreviewableLocalMedia(_0x5199a4, _0x3a3808)) throw new Error('只支持图片或视频快速预览');
  cleanupLocalPreviewEntries();
  const _0x567a6c = randomBytes(24).toString('hex'),
    _0x35ccb4 = getMimeTypeForPreview(_0x3a3808, _0x5199a4?.type || '');
  localPreviewEntries.set(_0x567a6c, {
    path: _0x3a3808,
    mimeType: _0x35ccb4,
    size: _0x15f4b1.size,
    expiresAt: Date.now() + LOCAL_PREVIEW_TTL_MS,
  });
  const _0x5d285b = encodeURIComponent(path.basename(_0x3a3808));
  return LOCAL_PREVIEW_SCHEME + '://preview/' + _0x567a6c + '/' + _0x5d285b;
}
function installLocalPreviewProtocol() {
  if (localPreviewProtocolInstalled) return;
  ((localPreviewProtocolInstalled = true),
    protocol.handle(LOCAL_PREVIEW_SCHEME, (_0x17294b) => {
      try {
        cleanupLocalPreviewEntries();
        const _0x27903a = new URL(_0x17294b.url),
          _0xa467e6 = decodeURIComponent(_0x27903a.pathname.split('/').filter(Boolean)[0] || ''),
          _0x2606a1 = localPreviewEntries.get(_0xa467e6);
        if (!_0x2606a1) return new Response('Preview not found', { status: 0x194 });
        const _0x46f2a4 = statSync(_0x2606a1.path);
        if (!_0x46f2a4.isFile())
          return (
            localPreviewEntries.delete(_0xa467e6),
            new Response('Preview not found', { status: 0x194 })
          );
        const _0x167f10 = _0x46f2a4.size,
          _0x2e7bbf = parseRangeHeader(_0x17294b.headers.get('range'), _0x167f10),
          _0x56d392 = {
            'Content-Type': _0x2606a1.mimeType,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'private, max-age=' + Math.floor(LOCAL_PREVIEW_TTL_MS / 0x3e8) + ', immutable',
          };
        if (_0x2e7bbf)
          return (
            (_0x56d392['Content-Range'] = 'bytes ' + _0x2e7bbf.start + '-' + _0x2e7bbf.end + '/' + _0x167f10),
            (_0x56d392['Content-Length'] = String(_0x2e7bbf.end - _0x2e7bbf.start + 1)),
            new Response(
              Readable.toWeb(
                createReadStream(_0x2606a1.path, { start: _0x2e7bbf.start, end: _0x2e7bbf.end }),
              ),
              { status: 206, headers: _0x56d392 },
            )
          );
        return (
          (_0x56d392['Content-Length'] = String(_0x167f10)),
          new Response(Readable.toWeb(createReadStream(_0x2606a1.path)), { status: 200, headers: _0x56d392 })
        );
      } catch (_0x4fd074) {
        return (
          console.warn('[electron] local preview failed:', _0x4fd074),
          new Response('Preview failed', { status: 0x1f4 })
        );
      }
    }));
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
function writeAssetImageDerivatives(_0x2ad072, _0x3f183a) {
  const _0x45e33d = nativeImage.createFromPath(_0x3f183a),
    _0x5c0efb = _0x45e33d.getSize(),
    _0x3b947e = Number(_0x5c0efb.width) || 0,
    _0x1614c8 = Number(_0x5c0efb.height) || 0;
  if (_0x45e33d.isEmpty() || _0x3b947e <= 0 || _0x1614c8 <= 0) return {};
  const _0x3a6b7a = path.join(getAssetsDir(), 'derived', 'image');
  mkdirSync(_0x3a6b7a, { recursive: true });
  const _0x2850db = path.join(_0x3a6b7a, _0x2ad072 + '.display.png'),
    _0x322d69 = path.join(_0x3a6b7a, _0x2ad072 + '.thumb.png'),
    _0x4b8f9f = resizeImageToMaxEdge(_0x45e33d, 0x500),
    _0x431804 = resizeImageToMaxEdge(_0x45e33d, 0x140);
  if (!_0x4b8f9f || !_0x431804) return {};
  if (!existsSync(_0x2850db)) writeFileSync(_0x2850db, _0x4b8f9f.toPNG());
  if (!existsSync(_0x322d69)) writeFileSync(_0x322d69, _0x431804.toPNG());
  return {
    displayLocalPath: toAssetLocalPath('derived', 'image', _0x2ad072 + '.display.png'),
    thumbLocalPath: toAssetLocalPath('derived', 'image', _0x2ad072 + '.thumb.png'),
    originalWidth: _0x3b947e,
    originalHeight: _0x1614c8,
  };
}
function bufferFromImportPayload(_0x3c1f8c = {}) {
  const _0x3f7504 = _0x3c1f8c?.bytes;
  if (!_0x3f7504) return null;
  if (Buffer.isBuffer(_0x3f7504)) return _0x3f7504;
  if (_0x3f7504 instanceof ArrayBuffer) return Buffer.from(_0x3f7504);
  if (ArrayBuffer.isView(_0x3f7504))
    return Buffer.from(_0x3f7504.buffer, _0x3f7504.byteOffset, _0x3f7504.byteLength);
  if (Array.isArray(_0x3f7504)) return Buffer.from(_0x3f7504);
  return null;
}
function runToolCapture(_0x5a780a, _0x50fe43, { input: input = null } = {}) {
  return new Promise((_0x37f518, _0x2a2c77) => {
    const _0x63f2db = spawn(_0x5a780a, _0x50fe43, {
        cwd: APP_ROOT,
        stdio: input ? ['pipe', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      }),
      _0x4940d3 = [],
      _0x390f3b = [];
    (_0x63f2db.stdout?.on('data', (_0x372e7f) => _0x4940d3.push(Buffer.from(_0x372e7f))),
      _0x63f2db.stderr?.on('data', (_0x13e09b) => _0x390f3b.push(Buffer.from(_0x13e09b))),
      _0x63f2db.once('error', _0x2a2c77),
      _0x63f2db.once('exit', (_0x4c18fb) => {
        if (_0x4c18fb === 0) {
          _0x37f518(Buffer.concat(_0x4940d3));
          return;
        }
        _0x2a2c77(
          new Error(Buffer.concat(_0x390f3b).toString('utf8') || _0x5a780a + ' exited with ' + _0x4c18fb),
        );
      }),
      input && _0x63f2db.stdin && _0x63f2db.stdin.end(input));
  });
}
async function readFfprobeJsonCapture(_0x1b73d6, _0x168c1d = 'FFprobe failed') {
  const _0x444d45 = await runToolCapture(getRuntimeToolOrFallback('ffprobe'), _0x1b73d6),
    _0x3d072e = _0x444d45.toString('utf8').trim();
  if (!_0x3d072e) throw new Error(_0x168c1d);
  try {
    return JSON.parse(_0x3d072e);
  } catch {
    throw new Error(_0x168c1d);
  }
}
function getRuntimeToolOrFallback(_0x3f1481) {
  return resolveRuntimeTool(_0x3f1481) || _0x3f1481;
}
function createOutputFilename(_0x1421a9, _0x42f36d) {
  const _0x1758a9 = String(_0x1421a9 || 'media').replace(/[^a-z0-9_-]/gi, '_') || 'media',
    _0x12b074 =
      String(_0x42f36d || 'bin')
        .replace(/^\.+/, '')
        .replace(/[^a-z0-9]/gi, '') || 'bin';
  return _0x1758a9 + '_' + Date.now() + '_' + randomBytes(3).toString('hex') + '.' + _0x12b074;
}
function toOutputLocalPath(..._0x8463d5) {
  return ['output', ..._0x8463d5].filter(Boolean).join('/').replace(/\\/g, '/');
}
async function hashFileSha256(_0x1beae9) {
  return await new Promise((_0x263b31, _0x4cd134) => {
    const _0x59d054 = createHash('sha256'),
      _0x196ec2 = createReadStream(_0x1beae9);
    (_0x196ec2.on('data', (_0x5c467b) => _0x59d054.update(_0x5c467b)),
      _0x196ec2.once('error', _0x4cd134),
      _0x196ec2.once('end', () => _0x263b31(_0x59d054.digest('hex'))));
  });
}
async function copyFileStreaming(_0x5c138b, _0x2ff28b) {
  (mkdirSync(path.dirname(_0x2ff28b), { recursive: true }),
    await pipeline(createReadStream(_0x5c138b), createWriteStream(_0x2ff28b)));
}
function resolveMediaTaskSource(_0x556ea7) {
  const _0x4e6b19 = resolveLocalVirtualPath(_0x556ea7);
  if (!_0x4e6b19) throw new Error('Invalid media source path');
  return _0x4e6b19;
}
async function readFfprobeJson(_0x34d795, _0x3db9c1, _0x1084c9, _0x15978f = 'FFprobe failed') {
  const _0xdcd08f = await _0x34d795.runProcess(_0x3db9c1, getRuntimeToolOrFallback('ffprobe'), _0x1084c9),
    _0xba0be9 = _0xdcd08f.stdout.toString('utf8').trim();
  if (!_0xba0be9) throw new Error(_0x15978f);
  try {
    return JSON.parse(_0xba0be9);
  } catch {
    throw new Error(_0x15978f);
  }
}
function parseFfprobeRatio(_0x1e3ef9) {
  const _0x5cec66 = String(_0x1e3ef9 || '').trim();
  if (!_0x5cec66) return 0;
  if (!_0x5cec66.includes('/')) return Number(_0x5cec66) || 0;
  const [_0x5e73f7, _0xf893d] = _0x5cec66.split('/'),
    _0x3a31ae = Number(_0xf893d);
  if (!_0x3a31ae) return 0;
  return (Number(_0x5e73f7) || 0) / _0x3a31ae;
}
async function ffprobeVideoMeta(_0x2032a2, _0x251cae, _0x47e608) {
  const _0x5688b8 = await readFfprobeJson(_0x2032a2, _0x251cae, [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'format=duration:stream=avg_frame_rate,r_frame_rate,nb_frames,duration,width,height',
      '-of',
      'json',
      _0x47e608,
    ]),
    _0x3fc23d = Array.isArray(_0x5688b8.streams) && _0x5688b8.streams[0] ? _0x5688b8.streams[0] : {},
    _0x1687f5 = _0x5688b8.format || {},
    _0x3da064 = Number(_0x1687f5.duration || 0) || Number(_0x3fc23d.duration || 0) || 0,
    _0x10d5cd = parseFfprobeRatio(_0x3fc23d.avg_frame_rate) || parseFfprobeRatio(_0x3fc23d.r_frame_rate) || 0,
    _0xd7a9e3 = Math.trunc(Number(_0x3fc23d.width || 0)) || 0,
    _0x5bc6e9 = Math.trunc(Number(_0x3fc23d.height || 0)) || 0;
  return { duration: _0x3da064, fps: _0x10d5cd, width: _0xd7a9e3, height: _0x5bc6e9 };
}
async function ffprobeHasAudio(_0x4a2ce6, _0x51a063, _0xcb7e50) {
  try {
    const _0x179d72 = await _0x4a2ce6.runProcess(_0x51a063, getRuntimeToolOrFallback('ffprobe'), [
      '-v',
      'error',
      '-select_streams',
      'a:0',
      '-show_entries',
      'stream=codec_type',
      '-of',
      'default=nw=1:nk=1',
      _0xcb7e50,
    ]);
    return _0x179d72.stdout.toString('utf8').toLowerCase().includes('audio');
  } catch {
    return false;
  }
}
async function ffprobeVideoPlaybackInfo(_0x442e67, _0x5815fa, _0x290709) {
  const _0x4fa7fe = await readFfprobeJson(_0x442e67, _0x5815fa, [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'format=duration,format_name:stream=codec_name,codec_tag_string,pix_fmt,profile,width,height',
      '-of',
      'json',
      _0x290709,
    ]),
    _0x36d4d8 = Array.isArray(_0x4fa7fe.streams) && _0x4fa7fe.streams[0] ? _0x4fa7fe.streams[0] : {},
    _0x310112 = _0x4fa7fe.format || {};
  return {
    codecName: String(_0x36d4d8.codec_name || '')
      .trim()
      .toLowerCase(),
    codecTag: String(_0x36d4d8.codec_tag_string || '')
      .trim()
      .toLowerCase(),
    pixelFormat: String(_0x36d4d8.pix_fmt || '')
      .trim()
      .toLowerCase(),
    profile: String(_0x36d4d8.profile || '').trim(),
    formatName: String(_0x310112.format_name || '')
      .trim()
      .toLowerCase(),
    duration: Number(_0x310112.duration || 0) || 0,
    width: Math.trunc(Number(_0x36d4d8.width || 0)) || 0,
    height: Math.trunc(Number(_0x36d4d8.height || 0)) || 0,
  };
}
async function ffprobeVideoPlaybackInfoForImport(_0x228029) {
  const _0x43e074 = await readFfprobeJsonCapture([
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'format=duration,format_name:stream=avg_frame_rate,r_frame_rate,codec_name,codec_tag_string,pix_fmt,profile,width,height',
      '-of',
      'json',
      _0x228029,
    ]),
    _0x24cf6a = Array.isArray(_0x43e074.streams) && _0x43e074.streams[0] ? _0x43e074.streams[0] : {},
    _0x2c9141 = _0x43e074.format || {};
  return {
    codecName: String(_0x24cf6a.codec_name || '')
      .trim()
      .toLowerCase(),
    codecTag: String(_0x24cf6a.codec_tag_string || '')
      .trim()
      .toLowerCase(),
    pixelFormat: String(_0x24cf6a.pix_fmt || '')
      .trim()
      .toLowerCase(),
    profile: String(_0x24cf6a.profile || '').trim(),
    formatName: String(_0x2c9141.format_name || '')
      .trim()
      .toLowerCase(),
    duration: Number(_0x2c9141.duration || 0) || 0,
    fps: parseFfprobeRatio(_0x24cf6a.avg_frame_rate) || parseFfprobeRatio(_0x24cf6a.r_frame_rate) || 0,
    width: Math.trunc(Number(_0x24cf6a.width || 0)) || 0,
    height: Math.trunc(Number(_0x24cf6a.height || 0)) || 0,
  };
}
function needsBrowserVideoProxy(_0x16304d = {}) {
  const _0x40598a = String(_0x16304d.codecName || '').toLowerCase(),
    _0x472a31 = String(_0x16304d.pixelFormat || '').toLowerCase(),
    _0x1d84f2 = String(_0x16304d.formatName || '').toLowerCase();
  if (!_0x40598a) return true;
  if (_0x40598a === 'h264') return !!_0x472a31 && _0x472a31 !== 'yuv420p' && _0x472a31 !== 'yuvj420p';
  if (_0x40598a === 'vp8' || _0x40598a === 'vp9')
    return !_0x1d84f2.includes('webm') && !_0x1d84f2.includes('matroska');
  if (_0x40598a === 'av1') return false;
  return true;
}
function getVideoProxyPaths(_0x3ada33) {
  const _0x4dfee4 = path.join(getAssetsDir(), 'derived', 'video'),
    _0x5f16d2 = _0x3ada33 + '.proxy.mp4';
  return {
    derivedDir: _0x4dfee4,
    proxyAbs: path.join(_0x4dfee4, _0x5f16d2),
    proxyLocalPath: toAssetLocalPath('derived', 'video', _0x5f16d2),
  };
}
async function ensureAssetVideoPlaybackProxy(_0x2f7cf4, _0x517479, _0x1b8f01, _0x4078e2) {
  const _0x1c160b = await ffprobeVideoPlaybackInfo(_0x517479, _0x2f7cf4, _0x1b8f01);
  if (!needsBrowserVideoProxy(_0x1c160b))
    return {
      displayLocalPath: '',
      displayUrl: '',
      videoProxyStatus: 'not_required',
      videoCodec: _0x1c160b.codecName,
    };
  const {
    derivedDir: _0x592d87,
    proxyAbs: _0x126ab,
    proxyLocalPath: _0x4c4d0b,
  } = getVideoProxyPaths(_0x4078e2);
  mkdirSync(_0x592d87, { recursive: true });
  let _0x1daee3 = false;
  try {
    _0x1daee3 = existsSync(_0x126ab) && statSync(_0x126ab).size > 0;
  } catch {
    _0x1daee3 = false;
  }
  if (!_0x1daee3) {
    const _0x34dec8 = _0x126ab + '.' + process.pid + '.' + Date.now() + '.tmp.mp4';
    try {
      (await _0x517479.runProcess(
        _0x2f7cf4,
        getRuntimeToolOrFallback('ffmpeg'),
        [
          '-y',
          '-i',
          _0x1b8f01,
          '-map',
          '0:v:0',
          '-map',
          '0:a?',
          '-dn',
          '-sn',
          '-c:v',
          'libx264',
          '-pix_fmt',
          'yuv420p',
          '-profile:v',
          'high',
          '-preset',
          VIDEO_PROXY_TRANSCODE_PRESET,
          '-crf',
          VIDEO_PROXY_TRANSCODE_CRF,
          '-c:a',
          'aac',
          '-b:a',
          '192k',
          '-movflags',
          '+faststart',
          _0x34dec8,
        ],
        { durationSec: _0x1c160b.duration, progressMessage: 'Transcoding video' },
      ),
        renameSync(_0x34dec8, _0x126ab));
    } catch (_0x26fb61) {
      try {
        if (existsSync(_0x34dec8)) unlinkSync(_0x34dec8);
      } catch {}
      throw _0x26fb61;
    }
  }
  return {
    displayLocalPath: _0x4c4d0b,
    displayUrl: '/' + _0x4c4d0b,
    videoProxyStatus: 'generated',
    videoCodec: _0x1c160b.codecName,
  };
}
function buildMediaTaskStatePatch(_0x4cd5aa) {
  const _0x327832 = String(_0x4cd5aa?.status || ''),
    _0x4512f8 = {
      mediaTaskId: _0x4cd5aa?.taskId || '',
      mediaTaskKind: _0x4cd5aa?.kind || '',
      mediaTaskStatus: _0x327832,
      mediaTaskProgress: Number(_0x4cd5aa?.progress || 0) || 0,
      mediaTaskError: _0x4cd5aa?.error || '',
    };
  if (_0x327832 === 'waiting' || _0x327832 === 'processing')
    ((_0x4512f8.isGenerating = true), (_0x4512f8.jobStatus = 'running'));
  else {
    if (_0x327832 === 'complete') ((_0x4512f8.isGenerating = false), (_0x4512f8.jobStatus = 'success'));
    else {
      if (_0x327832 === 'failed')
        ((_0x4512f8.isGenerating = false),
          (_0x4512f8.jobStatus = 'error'),
          (_0x4512f8.jobError = _0x4512f8.mediaTaskError || 'Media task failed'));
      else _0x327832 === 'cancelled' && ((_0x4512f8.isGenerating = false), (_0x4512f8.jobStatus = null));
    }
  }
  return _0x4512f8;
}
function getMediaTaskDisplayName(_0x2a4b19) {
  const _0x3cf059 = String(_0x2a4b19 || '').trim(),
    _0x555de1 = {
      videoPoster: '视频处理',
      audioWaveform: '音频波形',
      videoFirstFrame: '视频封面',
      videoCut: '视频剪辑',
      videoReverse: '视频倒放',
      audioCut: '音频剪辑',
      videoAudioSeparate: '音频分离',
      videoCompose: '视频合成',
      audioCompose: '音频合并',
      mediaClipExport: '剪辑导出',
    };
  return _0x555de1[_0x3cf059] || '媒体任务';
}
function formatNotificationBody(_0x5142fc, _0x58396d) {
  const _0x1a8e8a = String(_0x5142fc || _0x58396d || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (_0x1a8e8a.length <= 180) return _0x1a8e8a;
  return _0x1a8e8a.slice(0, 177) + '...';
}
function handleMediaTaskActivity(_0x52d446 = {}) {
  mediaTaskActivity = {
    activeCount: Number(_0x52d446.activeCount || 0) || 0,
    waitingCount: Number(_0x52d446.waitingCount || 0) || 0,
    totalCount: Number(_0x52d446.totalCount || 0) || 0,
    progress: Number(_0x52d446.progress || 0) || 0,
    activeTasks: Array.isArray(_0x52d446.activeTasks) ? _0x52d446.activeTasks : [],
  };
  const _0x2c7e81 = mediaTaskActivity.activeCount > 0;
  (setTaskbarProgressSource('media', _0x2c7e81 ? Math.max(0.01, mediaTaskActivity.progress) : -1),
    setPowerSaveBlocker('media', _0x2c7e81));
}
function maybeNotifyLongMediaTask(_0x4b709f = {}) {
  const _0xc132ea = String(_0x4b709f.status || '');
  if (_0xc132ea !== 'complete' && _0xc132ea !== 'failed') return;
  const _0x5c37e7 = String(_0x4b709f.taskId || '').trim();
  if (!_0x5c37e7 || notifiedMediaTaskIds.has(_0x5c37e7)) return;
  const _0x1461f0 = Number(_0x4b709f.startedAt || 0) || 0,
    _0x1bbdc8 = Number(_0x4b709f.finishedAt || Date.now()) || Date.now();
  if (!_0x1461f0 || _0x1bbdc8 - _0x1461f0 < LONG_MEDIA_TASK_NOTIFICATION_MS) return;
  if (typeof Notification?.isSupported === 'function' && !Notification.isSupported()) return;
  notifiedMediaTaskIds.add(_0x5c37e7);
  notifiedMediaTaskIds.size > 0x1f4 &&
    notifiedMediaTaskIds.delete(notifiedMediaTaskIds.values().next().value);
  const _0x46e0cc = getMediaTaskDisplayName(_0x4b709f.kind),
    _0x22a2da = _0xc132ea === 'failed';
  try {
    const _0x118d5f = new Notification({
      title: '' + _0x46e0cc + (_0x22a2da ? '失败' : '完成'),
      body: _0x22a2da
        ? formatNotificationBody(_0x4b709f.error, '任务处理失败。')
        : formatNotificationBody('', '长时间媒体任务已处理完成。'),
    });
    (_0x118d5f.on('click', () => {
      focusMainWindow();
    }),
      _0x118d5f.show());
  } catch (_0x307d07) {
    console.warn('[electron] failed to show media task notification:', _0x307d07);
  }
}
function sendMediaTaskUpdate(_0x191a65) {
  const _0x414725 = String(_0x191a65?.status || '');
  if (_0x191a65?.assetId && (_0x414725 === 'failed' || _0x414725 === 'cancelled')) {
    const _0x1114fa = updateAssetRecord(_0x191a65.assetId, {
      status: _0x414725 === 'cancelled' ? 'partial' : 'partial',
      error: _0x191a65.error || _0x414725,
      mediaTaskId: _0x191a65.taskId || '',
      mediaTaskKind: _0x191a65.kind || '',
      mediaTaskStatus: _0x414725,
      mediaTaskProgress: Number(_0x191a65.progress || 0) || 0,
      mediaTaskError: _0x191a65.error || '',
    });
    sendAssetUpdated(_0x1114fa);
  }
  (maybeNotifyLongMediaTask(_0x191a65), mainWindow?.webContents?.send('mediaTask:update', _0x191a65));
}
function getMediaTaskQueue() {
  if (mediaTaskQueue) return mediaTaskQueue;
  return (
    (mediaTaskQueue = new MediaTaskQueue({
      concurrency: 2,
      onUpdate: sendMediaTaskUpdate,
      onActivity: handleMediaTaskActivity,
    })),
    mediaTaskQueue.setHandler('videoPoster', async (_0x337600, _0x4c7922) => {
      const _0x176b7e = _0x337600.payload.originalLocalPath || _0x337600.payload.src,
        _0x4c4d16 = resolveMediaTaskSource(_0x176b7e),
        _0x48d197 =
          String(_0x337600.payload.assetId || '').trim() ||
          createHash('sha1').update(_0x176b7e).digest('hex'),
        _0x34bc05 = path.join(getAssetsDir(), 'derived', 'video');
      mkdirSync(_0x34bc05, { recursive: true });
      const _0x37182b = path.join(_0x34bc05, _0x48d197 + '.poster.jpg'),
        _0x2b57c8 = toAssetLocalPath('derived', 'video', _0x48d197 + '.poster.jpg'),
        _0x1d92d7 = await ensureAssetVideoPlaybackProxy(_0x337600, _0x4c7922, _0x4c4d16, _0x48d197);
      !existsSync(_0x37182b) &&
        (await _0x4c7922.runProcess(_0x337600, getRuntimeToolOrFallback('ffmpeg'), [
          '-y',
          '-ss',
          '0.1',
          '-i',
          _0x4c4d16,
          '-frames:v',
          '1',
          '-vf',
          'scale=640:-2',
          _0x37182b,
        ]));
      const _0x5c0504 = {
        ..._0x1d92d7,
        posterLocalPath: _0x2b57c8,
        thumbLocalPath: _0x2b57c8,
        posterUrl: '/' + _0x2b57c8,
        thumbUrl: '/' + _0x2b57c8,
      };
      if (_0x337600.payload.assetId) {
        const _0x7a5bb6 = updateAssetRecord(_0x337600.payload.assetId, {
          ..._0x5c0504,
          status: 'ready',
          error: '',
          mediaTaskId: _0x337600.id,
          mediaTaskKind: _0x337600.kind,
          mediaTaskStatus: 'complete',
          mediaTaskProgress: 1,
          mediaTaskError: '',
        });
        sendAssetUpdated(_0x7a5bb6);
      }
      return _0x5c0504;
    }),
    mediaTaskQueue.setHandler('audioWaveform', async (_0x2a1450, _0x340e8b) => {
      const _0x5ab76e = _0x2a1450.payload.originalLocalPath || _0x2a1450.payload.src,
        _0x42e9a8 = resolveMediaTaskSource(_0x5ab76e),
        _0x175465 =
          String(_0x2a1450.payload.assetId || '').trim() ||
          createHash('sha1').update(_0x5ab76e).digest('hex'),
        _0x54cdb0 = path.join(getAssetsDir(), 'derived', 'audio');
      mkdirSync(_0x54cdb0, { recursive: true });
      const _0x5ac1e3 = path.join(_0x54cdb0, _0x175465 + '.waveform.json'),
        _0x4f29a9 = toAssetLocalPath('derived', 'audio', _0x175465 + '.waveform.json');
      if (!existsSync(_0x5ac1e3)) {
        const _0x3fa52a = await _0x340e8b.runProcess(_0x2a1450, getRuntimeToolOrFallback('ffmpeg'), [
          '-v',
          'error',
          '-i',
          _0x42e9a8,
          '-ac',
          '1',
          '-ar',
          '8000',
          '-f',
          'f32le',
          'pipe:1',
        ]);
        writeFileSync(
          _0x5ac1e3,
          JSON.stringify(buildWaveformJsonFromFloat32(_0x3fa52a.stdout)) + '\n',
          'utf8',
        );
      }
      const _0x5f44a7 = { waveformLocalPath: _0x4f29a9, waveformUrl: '/' + _0x4f29a9 };
      if (_0x2a1450.payload.assetId) {
        const _0x4261db = updateAssetRecord(_0x2a1450.payload.assetId, {
          ..._0x5f44a7,
          status: 'ready',
          error: '',
          mediaTaskId: _0x2a1450.id,
          mediaTaskKind: _0x2a1450.kind,
          mediaTaskStatus: 'complete',
          mediaTaskProgress: 1,
          mediaTaskError: '',
        });
        sendAssetUpdated(_0x4261db);
      }
      return _0x5f44a7;
    }),
    mediaTaskQueue.setHandler('videoFirstFrame', async (_0x106eb2, _0x21293f) => {
      const _0x3b63b9 = String(_0x106eb2.payload.src || '').trim(),
        _0x157fac = resolveMediaTaskSource(_0x3b63b9),
        _0x495353 = statSync(_0x157fac),
        _0x4b3bad = _0x3b63b9.replace(/^\/+/, '') + '|' + _0x495353.mtimeMs + '|' + _0x495353.size,
        _0x1512ef = createHash('sha1').update(_0x4b3bad).digest('hex').slice(0, 12),
        _0x168141 = path.join(getOutputDir(), 'VideoThumbs');
      mkdirSync(_0x168141, { recursive: true });
      const _0x30abaf = 'vthumb_' + _0x1512ef + '.jpg',
        _0x131b8b = path.join(_0x168141, _0x30abaf),
        _0x1618b4 = toOutputLocalPath('VideoThumbs', _0x30abaf);
      return (
        !existsSync(_0x131b8b) &&
          (await _0x21293f.runProcess(_0x106eb2, getRuntimeToolOrFallback('ffmpeg'), [
            '-y',
            '-ss',
            '0',
            '-i',
            _0x157fac,
            '-frames:v',
            '1',
            '-vf',
            'scale=240:-2',
            '-q:v',
            '8',
            '-an',
            _0x131b8b,
          ])),
        { success: true, localPath: _0x1618b4, path: _0x1618b4, url: '/' + _0x1618b4 }
      );
    }),
    mediaTaskQueue.setHandler('videoCut', async (_0x1acf1b, _0x5b9563) => {
      const _0x2ce1aa = resolveMediaTaskSource(_0x1acf1b.payload.src),
        _0x1e85f = Math.max(0, Number(_0x1acf1b.payload.args?.start ?? _0x1acf1b.payload.start ?? 0) || 0),
        _0x4c4808 = Math.max(0, Number(_0x1acf1b.payload.args?.end ?? _0x1acf1b.payload.end ?? 0) || 0);
      if (!(_0x4c4808 > _0x1e85f)) throw new Error('Invalid video cut range');
      const _0x7d99f2 = ((_0x2d11e0) => ([16, 24, 30].includes(_0x2d11e0) ? _0x2d11e0 : 0))(
          Math.round(
            Number(_0x1acf1b.payload.args?.fps ?? _0x1acf1b.payload.fps ?? _0x1acf1b.payload.frameRate),
          ),
        ),
        _0x48b3c4 = path.join(getOutputDir(), 'CutVideo');
      mkdirSync(_0x48b3c4, { recursive: true });
      const _0xa86f8 = createOutputFilename('cut', 'mp4'),
        _0xa89839 = path.join(_0x48b3c4, _0xa86f8),
        _0x572b97 = toOutputLocalPath('CutVideo', _0xa86f8);
      return (
        await _0x5b9563.runProcess(
          _0x1acf1b,
          getRuntimeToolOrFallback('ffmpeg'),
          [
            '-y',
            '-ss',
            String(_0x1e85f),
            '-i',
            _0x2ce1aa,
            '-t',
            String(_0x4c4808 - _0x1e85f),
            '-c:v',
            'libx264',
            '-pix_fmt',
            'yuv420p',
            '-profile:v',
            'high',
            '-preset',
            'fast',
            '-c:a',
            'aac',
            ...(_0x7d99f2 ? ['-r', String(_0x7d99f2)] : []),
            '-movflags',
            '+faststart',
            _0xa89839,
          ],
          { durationSec: _0x4c4808 - _0x1e85f, progressMessage: 'Cutting video' },
        ),
        { success: true, filename: _0xa86f8, path: _0x572b97, localPath: _0x572b97, url: '/' + _0x572b97 }
      );
    }),
    mediaTaskQueue.setHandler('audioCut', async (_0x4a38a3, _0x3251bf) => {
      const _0x139a3c = resolveMediaTaskSource(_0x4a38a3.payload.src),
        _0x362386 = Math.max(0, Number(_0x4a38a3.payload.args?.start ?? _0x4a38a3.payload.start ?? 0) || 0),
        _0x2b9681 = Math.max(0, Number(_0x4a38a3.payload.args?.end ?? _0x4a38a3.payload.end ?? 0) || 0);
      if (!(_0x2b9681 > _0x362386)) throw new Error('Invalid audio cut range');
      const _0x28a042 = path.join(getOutputDir(), 'CutAudio');
      mkdirSync(_0x28a042, { recursive: true });
      const _0x156700 = createOutputFilename('cut', 'mp3'),
        _0x246f61 = path.join(_0x28a042, _0x156700),
        _0x4abc62 = toOutputLocalPath('CutAudio', _0x156700);
      return (
        await _0x3251bf.runProcess(
          _0x4a38a3,
          getRuntimeToolOrFallback('ffmpeg'),
          [
            '-y',
            '-i',
            _0x139a3c,
            '-ss',
            String(_0x362386),
            '-t',
            String(_0x2b9681 - _0x362386),
            '-vn',
            '-c:a',
            'libmp3lame',
            '-b:a',
            '192k',
            _0x246f61,
          ],
          { durationSec: _0x2b9681 - _0x362386, progressMessage: 'Cutting audio' },
        ),
        { success: true, filename: _0x156700, path: _0x4abc62, localPath: _0x4abc62, url: '/' + _0x4abc62 }
      );
    }),
    mediaTaskQueue.setHandler('videoAudioSeparate', async (_0x220956, _0x57b3da) => {
      const _0x209fa1 = resolveMediaTaskSource(_0x220956.payload.src),
        _0x568c3b = await ffprobeVideoMeta(_0x57b3da, _0x220956, _0x209fa1);
      if (!_0x568c3b.width || !_0x568c3b.height) throw new Error('Source video has no video stream');
      if (!(await ffprobeHasAudio(_0x57b3da, _0x220956, _0x209fa1)))
        throw new Error('Source video has no audio stream');
      const _0x1bd5f9 = path.join(getOutputDir(), 'SeparateVideo'),
        _0x156d50 = path.join(getOutputDir(), 'SeparateAudio');
      (mkdirSync(_0x1bd5f9, { recursive: true }), mkdirSync(_0x156d50, { recursive: true }));
      const _0xb18f86 = createOutputFilename('video', 'mp4'),
        _0x4abfaf = createOutputFilename('audio', 'mp3'),
        _0x30f9d9 = path.join(_0x1bd5f9, _0xb18f86),
        _0x3355b8 = path.join(_0x156d50, _0x4abfaf);
      (await _0x57b3da.runProcess(
        _0x220956,
        getRuntimeToolOrFallback('ffmpeg'),
        ['-y', '-i', _0x209fa1, '-map', '0:v:0', '-an', '-c:v', 'copy', _0x30f9d9],
        { durationSec: _0x568c3b.duration || 0, initialProgress: 0.05, progressMessage: 'Extracting video' },
      ),
        _0x57b3da.emitProgress(_0x220956, 0.55, 'Extracting audio'),
        await _0x57b3da.runProcess(
          _0x220956,
          getRuntimeToolOrFallback('ffmpeg'),
          ['-y', '-i', _0x209fa1, '-map', '0:a:0', '-vn', '-c:a', 'libmp3lame', '-b:a', '192k', _0x3355b8],
          {
            durationSec: _0x568c3b.duration || 0,
            initialProgress: 0.55,
            progressMessage: 'Extracting audio',
          },
        ));
      const _0x5c4a5a = toOutputLocalPath('SeparateVideo', _0xb18f86),
        _0x1a4c90 = toOutputLocalPath('SeparateAudio', _0x4abfaf);
      return {
        success: true,
        video: { filename: _0xb18f86, path: _0x5c4a5a, localPath: _0x5c4a5a, url: '/' + _0x5c4a5a },
        audio: { filename: _0x4abfaf, path: _0x1a4c90, localPath: _0x1a4c90, url: '/' + _0x1a4c90 },
      };
    }),
    registerSharedMediaTaskHandlers(mediaTaskQueue, {
      createOutputFilename: createOutputFilename,
      ffprobeHasAudio: ffprobeHasAudio,
      ffprobeVideoMeta: ffprobeVideoMeta,
      getOutputDir: getOutputDir,
      getRuntimeToolOrFallback: getRuntimeToolOrFallback,
      resolveMediaTaskSource: resolveMediaTaskSource,
      toOutputLocalPath: toOutputLocalPath,
    }),
    mediaTaskQueue.setHandler('videoCompose', async (_0x101bde, _0x1cd9c3) => {
      const _0x4db164 = Array.isArray(_0x101bde.payload.srcs)
          ? _0x101bde.payload.srcs
          : Array.isArray(_0x101bde.payload.args?.srcs)
            ? _0x101bde.payload.args.srcs
            : [],
        _0x4803cf = _0x4db164.map((_0x4f71e2) => resolveMediaTaskSource(_0x4f71e2));
      if (_0x4803cf.length < 2) throw new Error('Invalid video compose sources');
      const _0x47ef96 = await ffprobeVideoMeta(_0x1cd9c3, _0x101bde, _0x4803cf[0]);
      if (!_0x47ef96.width || !_0x47ef96.height) throw new Error('FFprobe failed: missing width/height');
      const _0x268991 = await Promise.all(
          _0x4803cf.map((_0x51350c) => ffprobeHasAudio(_0x1cd9c3, _0x101bde, _0x51350c)),
        ),
        _0x3590ce = _0x268991.every(Boolean),
        _0x2553b1 = path.join(getOutputDir(), 'ComposeVideo');
      mkdirSync(_0x2553b1, { recursive: true });
      const _0x566d38 = createOutputFilename('compose', 'mp4'),
        _0x14de95 = path.join(_0x2553b1, _0x566d38),
        _0x31136a = toOutputLocalPath('ComposeVideo', _0x566d38),
        _0x56e128 = Math.max(1, Math.round(_0x47ef96.fps || 30)),
        _0x27202e = [];
      _0x4803cf.forEach((_0x13d222, _0x57eb0d) => {
        (_0x27202e.push(
          '[' +
            _0x57eb0d +
            ':v]scale=' +
            _0x47ef96.width +
            ':' +
            _0x47ef96.height +
            ':force_original_aspect_ratio=decrease,pad=' +
            _0x47ef96.width +
            ':' +
            _0x47ef96.height +
            ':(ow-iw)/2:(oh-ih)/2,setsar=1,fps=' +
            _0x56e128 +
            ',format=yuv420p,setpts=PTS-STARTPTS[v' +
            _0x57eb0d +
            ']',
        ),
          _0x3590ce &&
            _0x27202e.push(
              '[' +
                _0x57eb0d +
                ':a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS[a' +
                _0x57eb0d +
                ']',
            ));
      });
      _0x3590ce
        ? _0x27202e.push(
            _0x4803cf.map((_0x58baef, _0x418d41) => '[v' + _0x418d41 + '][a' + _0x418d41 + ']').join('') +
              'concat=n=' +
              _0x4803cf.length +
              ':v=1:a=1[v][a]',
          )
        : _0x27202e.push(
            _0x4803cf.map((_0x3aebaa, _0x2b0350) => '[v' + _0x2b0350 + ']').join('') +
              'concat=n=' +
              _0x4803cf.length +
              ':v=1:a=0[v]',
          );
      const _0x30518e = ['-y'];
      (_0x4803cf.forEach((_0x525e9d) => _0x30518e.push('-i', _0x525e9d)),
        _0x30518e.push('-filter_complex', _0x27202e.join(';'), '-map', '[v]'));
      if (_0x3590ce) _0x30518e.push('-map', '[a]');
      return (
        _0x30518e.push(
          '-c:v',
          'libx264',
          '-preset',
          'fast',
          '-c:a',
          'aac',
          '-movflags',
          '+faststart',
          _0x14de95,
        ),
        await _0x1cd9c3.runProcess(_0x101bde, getRuntimeToolOrFallback('ffmpeg'), _0x30518e, {
          durationSec: Number(_0x101bde.payload.args?.duration || 0) || _0x47ef96.duration || 0,
          progressMessage: 'Composing video',
        }),
        { success: true, filename: _0x566d38, path: _0x31136a, localPath: _0x31136a, url: '/' + _0x31136a }
      );
    }),
    mediaTaskQueue
  );
}
async function generateAssetVideoPoster(_0x1f7495) {
  const _0x3eaf68 = resolveLocalVirtualPath(_0x1f7495.originalLocalPath);
  if (!_0x3eaf68) throw new Error('Invalid video asset path');
  const _0x45ce2d = path.join(getAssetsDir(), 'derived', 'video');
  mkdirSync(_0x45ce2d, { recursive: true });
  const _0x5424ea = path.join(_0x45ce2d, _0x1f7495.assetId + '.poster.jpg');
  return (
    !existsSync(_0x5424ea) &&
      (await runToolCapture(getRuntimeToolOrFallback('ffmpeg'), [
        '-y',
        '-ss',
        '0.1',
        '-i',
        _0x3eaf68,
        '-frames:v',
        '1',
        '-vf',
        'scale=640:-2',
        _0x5424ea,
      ])),
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
    const _0x181b3b = await runToolCapture(getRuntimeToolOrFallback('ffmpeg'), [
      '-v',
      'error',
      '-i',
      _0x4ee89b,
      '-ac',
      '1',
      '-ar',
      '8000',
      '-f',
      'f32le',
      'pipe:1',
    ]);
    writeFileSync(_0x28fac6, JSON.stringify(buildWaveformJsonFromFloat32(_0x181b3b)) + '\n', 'utf8');
  }
  return { waveformLocalPath: toAssetLocalPath('derived', 'audio', _0x55fe24.assetId + '.waveform.json') };
}
function updateAssetRecord(_0x641c55, _0x3cc888) {
  const _0x25d1bb = readAssetIndex(),
    _0x1d60b7 = _0x25d1bb.assets[_0x641c55];
  if (!_0x1d60b7) return null;
  const _0x43abf5 = { ..._0x1d60b7, ..._0x3cc888, updatedAt: new Date().toISOString() };
  return ((_0x25d1bb.assets[_0x641c55] = _0x43abf5), writeAssetIndex(_0x25d1bb), _0x43abf5);
}
function sendAssetUpdated(_0x25fef6) {
  if (!_0x25fef6) return;
  mainWindow?.webContents?.send('asset:updated', buildAssetResponse(_0x25fef6));
}
function isVideoAssetReady(_0xd3c395 = {}) {
  if (_0xd3c395.kind !== 'video') return false;
  return Boolean(
    _0xd3c395.posterLocalPath &&
    (_0xd3c395.displayLocalPath || _0xd3c395.videoProxyStatus === 'not_required'),
  );
}
function scheduleAssetDerivatives(_0x2f7356) {
  if (!_0x2f7356 || _0x2f7356.status === 'ready') return;
  if (_0x2f7356.kind !== 'video' && _0x2f7356.kind !== 'audio') return;
  const _0x449b85 = _0x2f7356.kind === 'video' ? 'videoPoster' : 'audioWaveform',
    _0x45b40e = getMediaTaskQueue().enqueue({
      kind: _0x449b85,
      assetId: _0x2f7356.assetId,
      src: _0x2f7356.originalLocalPath,
      originalLocalPath: _0x2f7356.originalLocalPath,
    }),
    _0x1d041f = updateAssetRecord(_0x2f7356.assetId, {
      status: 'processing',
      error: '',
      mediaTaskId: _0x45b40e.taskId,
      mediaTaskKind: _0x45b40e.kind,
      mediaTaskStatus: _0x45b40e.status,
      mediaTaskProgress: _0x45b40e.progress,
      mediaTaskError: '',
    });
  return (sendAssetUpdated(_0x1d041f), _0x45b40e);
}
async function importAssetToLibrary(_0xefcc02 = {}) {
  const _0x522474 = Date.now(),
    _0x4d3c61 = String(_0xefcc02?.path || '').trim(),
    _0x2d0b5e = bufferFromImportPayload(_0xefcc02);
  if (!_0x4d3c61 && !_0x2d0b5e) throw new Error('缺少文件路径或文件内容');
  const _0x326025 = _0x4d3c61 ? realpathSync(_0x4d3c61) : '';
  let _0x143b4d = null;
  if (_0x326025) {
    if (!path.isAbsolute(_0x326025)) throw new Error('文件路径必须是绝对路径');
    _0x143b4d = statSync(_0x326025);
    if (!_0x143b4d.isFile()) throw new Error('只支持导入文件');
  }
  const _0x476a51 = sanitizeUploadFilename(
      _0xefcc02?.name || (_0x326025 ? path.basename(_0x326025) : 'asset'),
    ),
    _0x4b2eee = String(_0xefcc02?.type || '').trim(),
    _0x3f4e4d = _0x2d0b5e ? hashBuffer(_0x2d0b5e) : await hashFileSha256(_0x326025),
    _0xa4b16d = classifyAssetKind(_0x476a51, _0x4b2eee),
    _0x3f1635 = getSafeOriginalExtension(_0x476a51, _0x4b2eee),
    _0x5898a6 = getAssetOriginalDir();
  mkdirSync(_0x5898a6, { recursive: true });
  const _0x3fc983 = path.join(_0x5898a6, '' + _0x3f4e4d + _0x3f1635),
    _0x409804 = toAssetLocalPath('original', '' + _0x3f4e4d + _0x3f1635),
    _0xb65f38 = existsSync(_0x3fc983);
  !_0xb65f38 &&
    (_0x2d0b5e ? writeFileSync(_0x3fc983, _0x2d0b5e) : await copyFileStreaming(_0x326025, _0x3fc983));
  const _0x4adb93 = new Date().toISOString(),
    _0x26a1da = readAssetIndex(),
    _0x10a02b = _0x26a1da.assets[_0x3f4e4d] || {};
  let _0x34d102 = {
    ..._0x10a02b,
    assetId: _0x3f4e4d,
    kind: _0xa4b16d,
    originalName: _0x476a51,
    filename: _0x476a51,
    mimeType: _0x4b2eee,
    size: _0x2d0b5e ? _0x2d0b5e.length : Number(_0x143b4d?.size || 0),
    sha256: _0x3f4e4d,
    originalLocalPath: _0x409804,
    createdAt: _0x10a02b.createdAt || _0x4adb93,
    updatedAt: _0x4adb93,
    status: _0x10a02b.status || (_0xa4b16d === 'image' || _0xa4b16d === 'file' ? 'ready' : 'processing'),
    error: _0x10a02b.error || '',
  };
  if (_0xa4b16d === 'image')
    try {
      _0x34d102 = {
        ..._0x34d102,
        ...writeAssetImageDerivatives(_0x3f4e4d, _0x3fc983),
        status: 'ready',
        error: '',
      };
    } catch (_0x34e262) {
      ((_0x34d102 = { ..._0x34d102, status: 'partial', error: String(_0x34e262?.message || _0x34e262) }),
        console.warn('[electron] image asset derivative failed:', _0x34e262));
    }
  else {
    if (_0xa4b16d === 'video') {
      try {
        const _0x5c5f36 = await ffprobeVideoPlaybackInfoForImport(_0x3fc983),
          _0x3ed666 = needsBrowserVideoProxy(_0x5c5f36);
        _0x34d102 = {
          ..._0x34d102,
          videoCodec: _0x5c5f36.codecName,
          videoWidth: _0x5c5f36.width,
          videoHeight: _0x5c5f36.height,
          width: _0x5c5f36.width,
          height: _0x5c5f36.height,
          videoDuration: _0x5c5f36.duration,
          videoFps: _0x5c5f36.fps,
          videoProxyStatus: _0x3ed666
            ? _0x34d102.displayLocalPath
              ? 'generated'
              : 'processing'
            : 'not_required',
        };
      } catch (_0x54e609) {
        ((_0x34d102 = {
          ..._0x34d102,
          videoProxyStatus: _0x34d102.displayLocalPath ? 'generated' : 'processing',
          error: _0x34d102.error || String(_0x54e609?.message || _0x54e609),
        }),
          console.warn('[electron] video asset metadata probe failed:', _0x54e609));
      }
      _0x34d102.status = isVideoAssetReady(_0x34d102) ? 'ready' : 'processing';
    } else _0xa4b16d === 'audio' && (_0x34d102.status = _0x34d102.waveformLocalPath ? 'ready' : 'processing');
  }
  ((_0x26a1da.assets[_0x3f4e4d] = _0x34d102), writeAssetIndex(_0x26a1da));
  const _0x454c4b = scheduleAssetDerivatives(_0x34d102);
  return (
    _0x454c4b &&
      (_0x34d102 = {
        ..._0x34d102,
        status: 'processing',
        mediaTaskId: _0x454c4b.taskId,
        mediaTaskKind: _0x454c4b.kind,
        mediaTaskStatus: _0x454c4b.status,
        mediaTaskProgress: _0x454c4b.progress,
        mediaTaskError: '',
      }),
    isAssetImportLoggingEnabled() &&
      console.log('[asset-import] done', {
        t: Date.now(),
        elapsedMs: Date.now() - _0x522474,
        assetId: _0x3f4e4d,
        kind: _0xa4b16d,
        reused: _0xb65f38,
        originalLocalPath: _0x409804,
        status: _0x34d102.status,
      }),
    buildAssetResponse(_0x34d102, { reused: _0xb65f38, derivativeStatus: _0x34d102.status })
  );
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
      { urls: [APP_ORIGIN + '/api/*', 'http://localhost:' + PORT + '/api/*'] },
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
    if (await probeServer()) return true;
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
async function ensureServerRunning(_0x4c8dab = null) {
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
  ((spawnedServer = spawn(_0x247828, ['server.py', '--host=' + HOST, '--port=' + PORT], {
    cwd: APP_ROOT,
    env: {
      ...process.env,
      AICANVAS_PORT: String(PORT),
      AIC_LOCAL_TOKEN: LOCAL_ACCESS_TOKEN,
      ...buildPackagedServerEnv(),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })),
    spawnedServer.stdout?.pipe(_0x4ca931, { end: false }),
    spawnedServer.stderr?.pipe(_0x4ca931, { end: false }),
    spawnedServer.once('error', (_0x4f5417) => {
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
    spawnedServer.once('exit', (_0x4daa93, _0x2ae6fd) => {
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
        (spawnedServer = null));
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
  if (!spawnedServer || spawnedServer.killed) return;
  try {
    spawnedServer.kill();
  } catch {
  } finally {
    spawnedServer = null;
  }
}
function focusMainWindow() {
  return activateMainWindow({ app: app, window: mainWindow });
}
function isPathInside(_0x44e6da, _0x410115) {
  try {
    const _0x53e6fd = path.resolve(_0x44e6da),
      _0x2dba7a = path.resolve(_0x410115);
    return _0x53e6fd === _0x2dba7a || _0x53e6fd.startsWith('' + _0x2dba7a + path.sep);
  } catch {
    return false;
  }
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
    const _0x56f846 = _0x3805dd.slice(_0x102d98.length),
      _0x86e42d = path.resolve(_0x563725, _0x56f846);
    return isPathInside(_0x86e42d, _0x563725) ? _0x86e42d : '';
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
function normalizeSecureSettingsKeys(_0x1dd1d4 = {}) {
  const _0x1ce6f4 = Array.isArray(_0x1dd1d4?.keys) ? _0x1dd1d4.keys : [_0x1dd1d4?.key];
  return _0x1ce6f4.map((_0x2f6168) => String(_0x2f6168 || '').trim()).filter(Boolean);
}
function syncSystemRecentDocumentsBestEffort() {
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
      name: 'AI CanvasPro Project',
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
function clearDesktopRecoverySnapshot() {
  return (removeRecoverySnapshot(getRecoverySnapshotPath()), { success: true });
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
        ? {
            success: true,
            canceled: false,
            kind: 'projectPackage',
            path: _0x1c0d2b,
            filePath: _0x1c0d2b,
            filename: path.basename(_0x1c0d2b),
            source: _0x45bd5a,
          }
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
        filePath: _0x1c0d2b,
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
    const _0x1c11ba = await dialog.showOpenDialog(mainWindow, {
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
  const _0x517886 = mainWindow
    ? await dialog.showOpenDialog(mainWindow, _0x1d2d94)
    : await dialog.showOpenDialog(_0x1d2d94);
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
    const _0x25f61c = await dialog.showSaveDialog(mainWindow, {
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
function installDevReloadShortcuts(_0x58c5ab) {
  if (app.isPackaged || !_0x58c5ab) return;
  _0x58c5ab.webContents.on('before-input-event', (_0x2b1db3, _0xd8d3d2) => {
    if (_0xd8d3d2?.type !== 'keyDown') return;
    const _0x17ba2b = String(_0xd8d3d2.key || '').toLowerCase(),
      _0x585720 = _0x17ba2b === 'f5' || ((_0xd8d3d2.control || _0xd8d3d2.meta) && _0x17ba2b === 'r');
    if (!_0x585720) return;
    _0x2b1db3.preventDefault();
    if (_0xd8d3d2.shift) {
      _0x58c5ab.webContents.reloadIgnoringCache();
      return;
    }
    _0x58c5ab.webContents.reload();
  });
}
function loadCanvasWindow(_0x386651 = mainWindow) {
  if (!_0x386651 || _0x386651.isDestroyed()) return;
  void _0x386651.loadURL(APP_URL);
}
async function restartBackendAndReload() {
  if (app.isPackaged || backendRestartInProgress) return;
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
}
function createMainWindow() {
  (installAppMenu({
    app: app,
    Menu: Menu,
    shell: shell,
    getMainWindow: () => mainWindow,
    logDir: LOG_DIR,
    restartBackendAndReload: restartBackendAndReload,
    stopSpawnedServer: stopSpawnedServer,
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
      logEvent: logDiagnosticEvent,
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
    mainWindow.on('closed', () => {
      (webPreviewViewManager.disposeViews(), localRuntimeKeepAlive.stop(), (mainWindow = null));
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
  (installLocalPreviewProtocol(),
    installIpcHandlers(),
    createMainWindow(),
    screenshotOverlayController.installGlobalScreenshotShortcut(),
    queueExternalProjectOpenFromArgs(process.argv, 'startup'),
    await clearPortBeforeStart(),
    await ensureServerRunning(),
    void localRuntimeKeepAlive.start('server-ready'),
    loadCanvasWindow());
}
function handleStartupFailure(_0xf40367) {
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
      BrowserWindow.getAllWindows().length === 0 &&
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
    app.on('before-quit', () => {
      (screenshotOverlayController.destroyScreenshotOverlayWindow(),
        localRuntimeKeepAlive.stop(),
        stopSpawnedServer(),
        stopAllPowerSaveBlockers());
    }),
    app.on('will-quit', () => {
      screenshotOverlayController.uninstallGlobalScreenshotShortcut();
    }));
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
