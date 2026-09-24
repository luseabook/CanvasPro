import http from 'node:http';
import { mkdirSync } from 'node:fs';
import electron from 'electron';
import { createCustomAiAppStorage } from './customAiAppStorage.js';
import { openShellFolder, revealShellItemInFolder } from './shellItemRevealer.js';

const MAX_BODY_BYTES = 64 * 1024 * 1024;
const DEFAULT_CLOSE_GRACE_MS = 750;
const MAX_CLOSE_GRACE_MS = 5000;
const TOKEN_HEADER = 'x-aic-desktop-bridge-token';
const PROGRESS_EVENT_LIMIT = 80;
const { shell = {} } = typeof electron === 'object' && electron ? electron : {};

function normalizeCloseGraceMs(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_CLOSE_GRACE_MS;
  return Math.min(Math.trunc(parsed), MAX_CLOSE_GRACE_MS);
}

function createDesktopHttpBridgeCloseError(cause) {
  const message = String(cause?.message || cause || 'Unknown close failure');
  const error = new Error('Desktop HTTP bridge close failed: ' + message);
  error.code = 'DESKTOP_HTTP_BRIDGE_CLOSE_FAILED';
  if (cause) error.cause = cause;
  return error;
}

function jsonResponse(response, statusCode, payload) {
  const body = Buffer.from(JSON.stringify(payload || {}) + '\n', 'utf8');
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': String(body.length),
    'Cache-Control': 'no-store',
  });
  response.end(body);
}

function normalizePathname(rawUrl) {
  try {
    return new URL(rawUrl || '/', 'http://127.0.0.1').pathname.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let received = 0;
    request.on('data', (chunk) => {
      received += chunk.length;
      if (received > MAX_BODY_BYTES) {
        reject(new Error('REQUEST_BODY_TOO_LARGE'));
        request.destroy();
        return;
      }
      chunks.push(Buffer.from(chunk));
    });
    request.on('error', reject);
    request.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        resolve(parsed && typeof parsed === 'object' ? parsed : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

function requireToken(request, token) {
  const expected = String(token || '').trim();
  if (!expected) return false;
  const received = String(request.headers[TOKEN_HEADER] || '').trim();
  return received === expected;
}

function safeCall(handler, payload) {
  return Promise.resolve().then(() => handler(payload || {}));
}

export function createDesktopHttpBridgeHandlers(context = {}) {
  const getUpdaterController = () => context.getUpdaterController?.(),
    getBackgroundCompletionNotifier = () => context.getBackgroundCompletionNotifier?.(),
    revealItemInFolder =
      typeof context.revealItemInFolder === 'function'
        ? context.revealItemInFolder
        : (targetPath) =>
            revealShellItemInFolder(targetPath, { shellApi: shell, logEvent: context.logDiagnosticEvent }),
    openFolder =
      typeof context.openFolder === 'function'
        ? context.openFolder
        : (folderPath) => openShellFolder(folderPath, { shellApi: shell, logEvent: context.logDiagnosticEvent });
  const requireSecureSettings = () => {
      const operations = context.secureSettingsOperations;
      if (!operations) throw new Error('Secure settings capability operations are unavailable');
      return operations;
    },
    requireClipboard = () => {
      const operations = context.clipboardOperations;
      if (!operations) throw new Error('Clipboard capability operations are unavailable');
      return operations;
    },
    requireProject = () => {
      const operations = context.projectOperations;
      if (!operations) throw new Error('Project capability operations are unavailable');
      return operations;
    },
    requireAgentSkill = () => {
      const operations = context.agentSkillOperations;
      if (!operations) throw new Error('Agent Skill capability operations are unavailable');
      return operations;
    },
    requireAgentInformation = () => {
      const operations = context.agentInformationOperations;
      if (!operations) throw new Error('Agent information capability operations are unavailable');
      return operations;
    };
  const packageProgressEvents = [];
  let customAiAppStorage = null;
  const getCustomAiAppStorage = () => {
    if (!customAiAppStorage)
      customAiAppStorage = createCustomAiAppStorage({ getDataDir: context.getDataDir });
    return customAiAppStorage;
  };
  function recordPackageProgress(payload = {}) {
    packageProgressEvents.push({ ...(payload || {}), createdAt: Date.now() });
    while (packageProgressEvents.length > PROGRESS_EVENT_LIMIT) packageProgressEvents.shift();
  }
  function drainPackageProgressEvents() {
    return packageProgressEvents.splice(0, packageProgressEvents.length);
  }
  function buildOperationContext() {
    return { onProgress: recordPackageProgress };
  }
  function requireWebPreviewViewManager() {
    const manager = context.getWebPreviewViewManager?.();
    if (!manager) throw new Error('Browser node runtime is unavailable');
    return manager;
  }
  function importStagedLocalFile(payload = {}) {
    const input = payload && typeof payload === 'object' ? payload : {};
    const localPath = String(input.localPath || '').trim();
    if (!localPath) throw new Error('Staged localPath is required');
    if (
      Object.prototype.hasOwnProperty.call(input, 'path') ||
      Object.prototype.hasOwnProperty.call(input, 'bytes')
    )
      throw new Error('Raw paths and bytes are not allowed over the desktop HTTP bridge');
    const resolved = context.resolveLocalVirtualPath?.(localPath) || '';
    if (!resolved) throw new Error('Path is not allowed');
    const { localPath: _staged, ...rest } = input;
    return context.importAssetToLibrary?.({ ...rest, path: resolved });
  }
  return new Map([
    ['/api/v2/desktop/app/get-version', () => context.getAppVersion?.() || ''],
    ['/api/v2/desktop/app/get-device-id', (payload) => context.getStableDeviceId?.(payload) || ''],
    ['/api/v2/desktop/app/update-state', () => getUpdaterController()?.getState?.() || null],
    [
      '/api/v2/desktop/app/check-for-updates',
      () => getUpdaterController()?.checkForUpdates?.({ manual: true }) || null,
    ],
    ['/api/v2/desktop/app/download-update', () => getUpdaterController()?.downloadUpdate?.() || null],
    ['/api/v2/desktop/app/cancel-update-download', () => getUpdaterController()?.cancelDownload?.() || null],
    [
      '/api/v2/desktop/app/install-downloaded-update',
      () => getUpdaterController()?.installDownloadedUpdate?.() || null,
    ],
    [
      '/api/v2/desktop/notification/show-generation-complete',
      (payload) => {
        const notifier = getBackgroundCompletionNotifier();
        if (!notifier?.showGenerationComplete) return { success: true, shown: false, reason: 'unavailable' };
        return notifier.showGenerationComplete(payload || {});
      },
    ],
    [
      '/api/v2/desktop/notification/consume-generation-complete-clicks',
      () => getBackgroundCompletionNotifier()?.consumeClickEvents?.() || [],
    ],
    [
      '/api/v2/desktop/notification/update-global-shortcut',
      (payload) => getBackgroundCompletionNotifier()?.updateGlobalShortcut(payload || {}),
    ],
    [
      '/api/v2/desktop/notification/acknowledge',
      (payload) => getBackgroundCompletionNotifier()?.acknowledge(payload || {}),
    ],
    ['/api/v2/desktop/secure-settings/get', (payload) => requireSecureSettings().get(payload)],
    ['/api/v2/desktop/secure-settings/set', (payload) => requireSecureSettings().set(payload)],
    ['/api/v2/desktop/secure-settings/delete', (payload) => requireSecureSettings().delete(payload)],
    ['/api/v2/desktop/custom-ai-apps/read', () => getCustomAiAppStorage().read()],
    ['/api/v2/desktop/custom-ai-apps/write', (payload) => getCustomAiAppStorage().write(payload || {})],
    ['/api/v2/desktop/agent-skills/list', () => requireAgentSkill().list()],
    ['/api/v2/desktop/agent-skills/open-root', () => requireAgentSkill().openRoot()],
    ['/api/v2/desktop/agent-skills/install-folder', () => requireAgentSkill().installFromFolder()],
    ['/api/v2/desktop/agent-skills/save-managed', (payload) => requireAgentSkill().saveManagedDefinition(payload)],
    ['/api/v2/desktop/agent-skills/delete-installed', (payload) => requireAgentSkill().deleteInstalled(payload)],
    ['/api/v2/desktop/agent-information/read-url', (payload) => requireAgentInformation().readUrl(payload)],
    [
      '/api/v2/desktop/storage-migration/read',
      () => context.readLegacyRendererStorageMigration?.() || { available: false },
    ],
    [
      '/api/v2/desktop/storage-migration/complete',
      (payload) => context.completeLegacyRendererStorageMigration?.(payload) || { success: false },
    ],
    ['/api/v2/desktop/project/open', (payload) => requireProject().open(payload)],
    ['/api/v2/desktop/project/save', (payload) => requireProject().save(payload)],
    [
      '/api/v2/desktop/project/export-package',
      (payload) => requireProject().exportPackage(payload, buildOperationContext()),
    ],
    [
      '/api/v2/desktop/project/import-package',
      (payload) => requireProject().importPackage(payload, buildOperationContext()),
    ],
    ['/api/v2/desktop/project/consume-package-progress-events', () => drainPackageProgressEvents()],
    ['/api/v2/desktop/project/list-recent', () => requireProject().listRecent()],
    ['/api/v2/desktop/project/remove-recent', (payload) => requireProject().removeRecent(payload)],
    ['/api/v2/desktop/project/set-unsaved-state', (payload) => requireProject().setUnsavedState(payload)],
    [
      '/api/v2/desktop/project/consume-external-open-requests',
      () => requireProject().consumeExternalOpenRequests(),
    ],
    [
      '/api/v2/desktop/project/write-recovery-snapshot',
      (payload) => requireProject().writeRecoverySnapshot(payload),
    ],
    [
      '/api/v2/desktop/project/get-recovery-snapshot-info',
      (payload) => requireProject().getRecoverySnapshotInfo(payload),
    ],
    ['/api/v2/desktop/project/read-recovery-snapshot', () => requireProject().readRecoverySnapshot()],
    ['/api/v2/desktop/project/clear-recovery-snapshot', () => requireProject().clearRecoverySnapshot()],
    ['/api/v2/desktop/asset/import', (payload) => importStagedLocalFile(payload)],
    [
      '/api/v2/desktop/asset/import-remote',
      (payload) => context.importRemoteAssetToLibrary?.(payload),
    ],
    ['/api/v2/desktop/asset/consume-updates', () => context.consumeAssetUpdateEvents?.() || []],
    ['/api/v2/desktop/file/import-local', (payload) => importStagedLocalFile(payload)],
    ['/api/v2/desktop/dialog/select-directory', (payload) => context.selectDirectory?.(payload)],
    [
      '/api/v2/desktop/shell/show-item-in-folder',
      (payload) => {
        const resolved = context.resolveLocalVirtualPath?.(payload?.localPath || '');
        if (!resolved) throw new Error('Path is not allowed');
        revealItemInFolder(resolved);
        return { ok: true };
      },
    ],
    [
      '/api/v2/desktop/shell/open-known-folder',
      (payload) => {
        const folder = context.resolveKnownFolder?.(payload?.kind || '');
        if (!folder) throw new Error('Folder is not allowed');
        mkdirSync(folder, { recursive: true });
        openFolder(folder);
        return { ok: true };
      },
    ],
    [
      '/api/v2/desktop/shell/open-external',
      (payload) => context.openExternalUrl?.(payload?.url || payload),
    ],
    ['/api/v2/desktop/web-preview/sync-views', (payload) => requireWebPreviewViewManager().syncViews(payload || {})],
    [
      '/api/v2/desktop/web-preview/dispose-views',
      (payload) => requireWebPreviewViewManager().disposeViews(payload || {}),
    ],
    [
      '/api/v2/desktop/web-preview/control-view',
      (payload) => requireWebPreviewViewManager().controlView(payload || {}),
    ],
    ['/api/v2/desktop/web-preview/consume-events', () => requireWebPreviewViewManager().consumeEvents?.() || []],
    [
      '/api/v2/desktop/web-preview/wait-events',
      (payload) => {
        const manager = requireWebPreviewViewManager();
        return manager.waitForEvents?.(payload || {}) || manager.consumeEvents?.() || [];
      },
    ],
    [
      '/api/v2/desktop/notification-sound/list-mp3-files',
      (payload) => context.listNotificationSoundMp3Files?.(payload),
    ],
    ['/api/v2/desktop/notification-sound/list-system-sounds', () => context.listSystemNotificationSoundFiles?.()],
    [
      '/api/v2/desktop/notification-sound/open-system-sound-folder',
      () => context.openSystemNotificationSoundFolder?.(),
    ],
    ['/api/v2/desktop/notification-sound/play', (payload) => context.playNotificationSound?.(payload)],
    [
      '/api/v2/desktop/media-task/enqueue',
      (payload) => context.getMediaTaskQueue?.()['enqueue'](payload || {}),
    ],
    [
      '/api/v2/desktop/media-task/cancel',
      (payload) => {
        const queue = context.getMediaTaskQueue?.(),
          taskId = payload?.taskId || '';
        if (payload?.onlyIfWaiting === true) return queue?.cancel(taskId, { onlyIfWaiting: true });
        return queue?.cancel(taskId);
      },
    ],
    [
      '/api/v2/desktop/media-task/list',
      (payload) => context.getMediaTaskQueue?.()['list']({ limit: payload?.limit || 100 }),
    ],
    [
      '/api/v2/desktop/local-asset-cleanup/scan',
      (payload) => context.getLocalAssetCleanupManager?.()['scan'](payload || {}),
    ],
    [
      '/api/v2/desktop/local-asset-cleanup/trash',
      (payload) => context.getLocalAssetCleanupManager?.()['trash'](payload || {}),
    ],
    [
      '/api/v2/desktop/diagnostics/log-event',
      (payload) => context.logDiagnosticEvent?.({ ...(payload || {}), source: payload?.source || 'renderer' }),
    ],
    [
      '/api/v2/desktop/diagnostics/create-package',
      (payload) => context.diagnosticsOperations?.createPackage(payload || {}),
    ],
    [
      '/api/v2/desktop/diagnostics/open-logs-folder',
      () => context.diagnosticsOperations?.openLogsFolder(),
    ],
    [
      '/api/v2/desktop/node-export/export-selected',
      (payload) => context.exportSelectedNodesPackage?.(payload || {}),
    ],
    ['/api/v2/desktop/node-export/save-media', (payload) => context.saveMediaFile?.(payload || {})],
    ['/api/v2/desktop/node-export/save-text', (payload) => context.saveTextFile?.(payload || {})],
    ['/api/v2/desktop/node-export/save-media-files', (payload) => context.saveMediaFiles?.(payload || {})],
    ['/api/v2/desktop/node-export/save-timeline', (payload) => context.saveTimeline?.(payload || {})],
    ['/api/v2/desktop/node-export/open-jianying', () => context.openJianying?.()],
    ['/api/v2/desktop/screenshot/capture-display', () => context.captureDesktopDisplay?.()],
    [
      '/api/v2/desktop/screenshot/update-global-shortcut',
      (payload) => context.configureGlobalScreenshotShortcut?.(payload),
    ],
    [
      '/api/v2/desktop/screenshot/consume-global-capture-events',
      () => context.consumeGlobalScreenshotCaptureEvents?.() || [],
    ],
    [
      '/api/v2/desktop/screenshot/get-global-shortcut-status',
      () => context.getGlobalScreenshotShortcutStatus?.() || null,
    ],
    [
      '/api/v2/desktop/text-preset/update-global-shortcut',
      (payload) => context.configureGlobalTextPresetShortcut?.(payload),
    ],
    [
      '/api/v2/desktop/text-preset/consume-events',
      () => context.consumeGlobalTextPresetEvents?.() || [],
    ],
    [
      '/api/v2/desktop/text-preset/claim-event',
      (payload) => context.claimGlobalTextPresetEvent?.(payload) || { ok: false },
    ],
    [
      '/api/v2/desktop/text-preset/acknowledge-event',
      (payload) => context.acknowledgeGlobalTextPresetEvent?.(payload) || { ok: false },
    ],
    [
      '/api/v2/desktop/text-preset/get-global-shortcut-status',
      () => context.getGlobalTextPresetShortcutStatus?.() || null,
    ],
    ['/api/v2/desktop/clipboard/write-text', (payload) => requireClipboard().writeText(payload)],
    ['/api/v2/desktop/clipboard/read-text', () => requireClipboard().readText()],
    ['/api/v2/desktop/clipboard/read-image', () => requireClipboard().readImage()],
    [
      '/api/v2/desktop/clipboard/write-file-references',
      (payload) => requireClipboard().writeFileReferences(payload),
    ],
    ['/api/v2/desktop/clipboard/read-file-references', () => requireClipboard().readFileReferences()],
  ]);
}

export function startDesktopHttpBridge({
  token,
  handlers,
  logEvent = null,
  closeGraceMs = DEFAULT_CLOSE_GRACE_MS,
} = {}) {
  const routeTable = handlers instanceof Map ? handlers : createDesktopHttpBridgeHandlers(handlers);
  const openSockets = new Set();
  const server = http.createServer(async (request, response) => {
    if (request.method !== 'POST') {
      jsonResponse(response, 405, { success: false, error: 'Method not allowed' });
      return;
    }
    if (!requireToken(request, token)) {
      jsonResponse(response, 403, { success: false, error: 'Forbidden' });
      return;
    }
    const pathname = normalizePathname(request.url);
    const handler = routeTable.get(pathname);
    if (typeof handler !== 'function') {
      jsonResponse(response, 404, { success: false, error: 'Desktop bridge route not found' });
      return;
    }
    try {
      const payload = await readJsonBody(request);
      const data = await safeCall(handler, payload);
      jsonResponse(response, 200, { success: true, data });
    } catch (error) {
      const message =
        error?.message === 'REQUEST_BODY_TOO_LARGE'
          ? 'Request body too large'
          : String(error?.message || error);
      logEvent?.({
        type: 'desktop_http_bridge.request_failed',
        level: 'warn',
        source: 'main',
        message,
        error,
        context: { path: pathname },
      });
      jsonResponse(response, message === 'Request body too large' ? 413 : 500, {
        success: false,
        error: message,
      });
    }
  });
  server.on('connection', (socket) => {
    openSockets.add(socket);
    socket.once('close', () => openSockets.delete(socket));
  });
  const resolvedCloseGraceMs = normalizeCloseGraceMs(closeGraceMs);
  let closePromise = null;
  const close = () => {
    if (closePromise) return closePromise;
    closePromise = new Promise((resolve, reject) => {
      let settled = false,
        graceTimer = null;
      const finish = (failure = null) => {
        if (settled) return;
        settled = true;
        if (graceTimer) clearTimeout(graceTimer);
        if (failure) {
          reject(createDesktopHttpBridgeCloseError(failure));
          return;
        }
        resolve();
      };
      const forceClose = (failure = null) => {
        let firstFailure = failure;
        try {
          server.closeAllConnections?.();
        } catch (error) {
          firstFailure = error;
        }
        for (const socket of openSockets) {
          try {
            socket.destroy();
          } catch (error) {
            firstFailure ||= error;
          }
        }
        finish(firstFailure);
      };
      try {
        server.close((error) => finish(error || null));
        server.closeIdleConnections?.();
        if (!settled) {
          graceTimer = setTimeout(forceClose, resolvedCloseGraceMs);
          graceTimer.unref?.();
        }
      } catch (error) {
        forceClose(error);
      }
    });
    void closePromise.catch((error) => {
      try {
        logEvent?.({
          type: 'desktop_http_bridge.close_failed',
          level: 'error',
          source: 'main',
          message: error.message,
          error,
          context: { closeGraceMs: resolvedCloseGraceMs },
        });
      } catch {}
    });
    return closePromise;
  };
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve({ url: 'http://127.0.0.1:' + port, token: String(token || ''), close });
    });
  });
}
