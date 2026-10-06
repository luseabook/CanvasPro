import { post } from '../../api/apiBase.js';
import { deferredMediaPreview, withDeferredMediaFiles } from '../../api/deferredMediaApi.js';
import { CHROME_SHELL_STARTUP_READY_EVENT } from './chromeShellStartupReadiness.js';
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']),
  LONG_DESKTOP_REQUEST_TIMEOUT_MS = 30 * 60 * 1000,
  CHROME_SHELL_STARTUP_READY_REQUEST_TIMEOUT_MS = 1500,
  CHROME_SHELL_STARTUP_READY_PATH = '/api/v2/desktop/diagnostics/log-event',
  LONG_DESKTOP_REQUEST_PATHS = new Set([
    '/api/v2/desktop/project/export-package',
    '/api/v2/desktop/project/import-package',
    '/api/v2/desktop/node-export/save-media',
    '/api/v2/desktop/node-export/save-media-files',
    '/api/v2/desktop/node-export/save-timeline',
    '/api/v2/desktop/asset/import',
    '/api/v2/desktop/agent-skills/install-folder',
  ]);
function getWindowObject() {
  return globalThis.window || null;
}
function getElectronApi() {
  const windowObject = getWindowObject()?.electronAPI || null;
  return windowObject?.__aicDesktopHttpShim === true ? null : windowObject;
}
function getDesktopApi() {
  const windowObject2 = getWindowObject()?.aiCanvasDesktop || null;
  return windowObject2?.__aicDesktopHttpShim === true ? null : windowObject2;
}
function isFunction(value) {
  return typeof value === 'function';
}
function isLoopbackAppOrigin() {
  try {
    const enabled = globalThis.location;
    if (!enabled || !/^https?:$/i.test(String(enabled.protocol || ''))) return false;
    return LOOPBACK_HOSTS.has(String(enabled.hostname || '').toLowerCase());
  } catch {
    return false;
  }
}
function hasChromeShellRuntimeHint() {
  const windowObject3 = getWindowObject();
  if (windowObject3?.__AIC_CHROME_SHELL__ || windowObject3?.__AIC_DESKTOP_HTTP_BRIDGE__) return true;
  try {
    const map = new URLSearchParams(globalThis.location?.search || '');
    return String(map.get('aicRuntime') || '').toLowerCase() === 'chrome-shell';
  } catch {
    return false;
  }
}
function normalizeHttpBridgeResult(response) {
  if (!response?.success) throw new Error(response?.error || 'Desktop bridge request failed');
  const error = response.data;
  if (!error || typeof error !== 'object' || !Object.prototype.hasOwnProperty.call(error, 'success'))
    return error;
  if (error.success === false && error.canceled === true) return error;
  if (error.success === false)
    throw new Error(error.error || error.message || 'Desktop bridge request failed');
  if (Object.prototype.hasOwnProperty.call(error, 'data')) return error.data;
  return error;
}
function resolveDesktopBridgeRequestTimeout(item, key = {}) {
  if (
    String(item || '') === CHROME_SHELL_STARTUP_READY_PATH &&
    key?.type === CHROME_SHELL_STARTUP_READY_EVENT
  )
    return CHROME_SHELL_STARTUP_READY_REQUEST_TIMEOUT_MS;
  return LONG_DESKTOP_REQUEST_PATHS.has(String(item || '')) ? LONG_DESKTOP_REQUEST_TIMEOUT_MS : undefined;
}
async function postDesktopBridge(index, result = {}) {
  return normalizeHttpBridgeResult(
    await post(index, result, resolveDesktopBridgeRequestTimeout(index, result)),
  );
}
async function normalizeDesktopHttpPayload(list) {
  if (list instanceof ArrayBuffer) return Array.from(new Uint8Array(list));
  if (ArrayBuffer.isView(list))
    return Array.from(new Uint8Array(list.buffer, list.byteOffset, list.byteLength));
  if (typeof Blob !== 'undefined' && list instanceof Blob)
    return Array.from(new Uint8Array(await list.arrayBuffer()));
  if (Array.isArray(list)) return Promise.all(list.map((data) => normalizeDesktopHttpPayload(data)));
  if (!list || typeof list !== 'object') return list;
  const options = await Promise.all(
    Object.entries(list).map(async ([target, source]) => [
      target,
      await normalizeDesktopHttpPayload(source),
    ]),
  );
  return Object.fromEntries(options);
}
function chromeShellPost(next, current = {}) {
  if (!desktopBridge.isChromeShell) return undefined;
  return normalizeDesktopHttpPayload(current).then((entry) => postDesktopBridge(next, entry));
}
function chromeShellPostOperationResult(record, payload = {}) {
  if (!desktopBridge.isChromeShell) return undefined;
  return normalizeDesktopHttpPayload(payload).then(async (handle) => {
    const response2 = await post(record, handle, resolveDesktopBridgeRequestTimeout(record, handle));
    if (!response2?.success) throw new Error(response2?.error || 'Desktop bridge request failed');
    const response3 = response2.data;
    if (response3?.success === false)
      throw new Error(response3?.error || 'Desktop bridge request failed');
    return response3 && Object.prototype.hasOwnProperty.call(response3, 'data')
      ? response3.data
      : response3;
  });
}
async function writeChromeShellRecoverySnapshotBeforeInstall() {
  if (!desktopBridge.isChromeShell) return null;
  const run = getWindowObject()?.__aiCanvasWriteRecoverySnapshotForClose;
  if (typeof run !== 'function') return null;
  return run('update-install');
}
function createLatestOnlyChromeShellPoster(state) {
  let value2 = null,
    enabled2 = null;
  const run2 = async () => {
    try {
      while (value2) {
        const config = value2;
        ((value2 = null), await chromeShellPost(state, config));
      }
      return { ok: true };
    } finally {
      enabled2 = null;
    }
  };
  return (options2 = {}) => {
    value2 = options2;
    if (!enabled2) enabled2 = run2();
    return enabled2;
  };
}
let chromeShellUnsavedStatePoster = null;
function postChromeShellUnsavedState(scope) {
  if (!desktopBridge.isChromeShell) return undefined;
  return (
    !chromeShellUnsavedStatePoster &&
      (chromeShellUnsavedStatePoster = createLatestOnlyChromeShellPoster(
        '/api/v2/desktop/project/set-unsaved-state',
      )),
    chromeShellUnsavedStatePoster(scope)
  );
}
function subscribeByPolling(
  handler,
  handler2,
  {
    intervalMs: intervalMs = 1000,
    extractItems: extractItems = (input) => input,
    getKey: getKey = (output) => JSON.stringify(output),
  } = {},
) {
  if (!desktopBridge.isChromeShell || typeof handler2 !== 'function') return () => {};
  let enabled3 = false;
  const map2 = new Map(),
    async2 = async () => {
      if (enabled3) return;
      try {
        const value3 = await handler();
        if (enabled3) return;
        const extractItems2 = extractItems(value3);
        if (Array.isArray(extractItems2))
          for (const value4 of extractItems2) {
            if (enabled3) break;
            const key2 = getKey(value4),
              value5 = JSON.stringify(value4 || {});
            if (map2.get(key2) === value5) continue;
            (map2.set(key2, value5), handler2(value4));
          }
        else {
          if (extractItems2 && typeof extractItems2 === 'object') {
            const key3 = getKey(extractItems2),
              value6 = JSON.stringify(extractItems2 || {});
            map2.get(key3) !== value6 && (map2.set(key3, value6), handler2(extractItems2));
          }
        }
      } catch {}
      if (!enabled3) setTimeout(async2, intervalMs);
    };
  return (
    setTimeout(async2, 0),
    () => {
      enabled3 = true;
    }
  );
}
function subscribeToConsumedBatch(handler3, handler4, { intervalMs: intervalMs = 500 } = {}) {
  if (!desktopBridge.isChromeShell || typeof handler4 !== 'function') return () => {};
  let enabled4 = false;
  const async3 = async () => {
    if (enabled4) return;
    try {
      const list2 = await handler3();
      if (enabled4) return;
      if (Array.isArray(list2) && list2.length > 0) handler4(list2);
    } catch {}
    if (!enabled4) setTimeout(async3, intervalMs);
  };
  return (
    setTimeout(async3, 0),
    () => {
      enabled4 = true;
    }
  );
}
function updaterEventFromStateSnapshot(info = {}) {
  if (!info || typeof info !== 'object') return null;
  if (typeof info.type === 'string' && info.type) return info;
  if (info.latestEvent && typeof info.latestEvent.type === 'string') return info.latestEvent;
  const state2 = String(info.state || '');
  if (!state2 || state2 === 'idle') return null;
  const value7 = {
      checking: 'checking',
      available: 'available',
      downloading: 'download-started',
      downloaded: 'downloaded',
      error: 'download-failed',
      installing: 'installing',
    },
    type = value7[state2];
  if (!type) return null;
  return {
    type: type,
    state: state2,
    info: info.latestInfo || null,
    retryCount: Number(info.retryCount || 0),
    maxRetries: Number(info.maxRetries || 0),
  };
}
function subscribeToUpdaterState(value8, handler5, handler6 = subscribeByPolling) {
  if (typeof handler5 !== 'function') return () => {};
  return handler6(
    value8,
    (value9) => {
      const updaterEventFromStateSnapshot2 = updaterEventFromStateSnapshot(value9);
      if (updaterEventFromStateSnapshot2) handler5(updaterEventFromStateSnapshot2);
    },
    { intervalMs: 3000, getKey: () => 'updater-state' },
  );
}
function subscribeByLongPolling(handler7, handler8) {
  if (!desktopBridge.isChromeShell || typeof handler8 !== 'function') return () => {};
  let enabled5 = false;
  const run3 = (value10) => new Promise((value11) => setTimeout(value11, value10)),
    handler9 = async () => {
      while (!enabled5) {
        let count = 0;
        try {
          const value12 = await handler7();
          if (enabled5) break;
          const list3 = Array.isArray(value12) ? value12 : [];
          ((count = list3.length), list3.forEach((value13) => handler8(value13)));
        } catch {
          if (!enabled5) await run3(250);
          continue;
        }
        if (!enabled5 && count === 0) await run3(24);
      }
    };
  return (
    void handler9(),
    () => {
      enabled5 = true;
    }
  );
}
function getGroup(value14, value15) {
  const value16 = value14?.[value15];
  return value16 && typeof value16 === 'object' ? value16 : null;
}
function unavailable(value17) {
  return () => {
    throw new Error(value17 + ' unavailable');
  };
}
const syncChromeShellWebPreviewViews = createLatestOnlyChromeShellPoster(
  '/api/v2/desktop/web-preview/sync-views',
);
export const desktopBridge = {
  get usesHttpCompat() {
    const windowObject4 = getWindowObject();
    return (
      windowObject4?.electronAPI?.__aicDesktopHttpShim === true ||
      windowObject4?.aiCanvasDesktop?.__aicDesktopHttpShim === true ||
      desktopBridge.isChromeShell
    );
  },
  get isElectron() {
    return !!getDesktopApi()?.isElectron || !!getElectronApi();
  },
  get isChromeShell() {
    return !getElectronApi() && isLoopbackAppOrigin() && hasChromeShellRuntimeHint();
  },
  app: {
    isAvailable() {
      return !!getDesktopApi() || desktopBridge.isChromeShell;
    },
    getAppVersion: (...args) =>
      getDesktopApi()?.getAppVersion?.(...args) ??
      chromeShellPost('/api/v2/desktop/app/get-version', args[0]) ??
      Promise.resolve(''),
    getDeviceId: (...args2) =>
      getDesktopApi()?.getDeviceId?.(...args2) ??
      chromeShellPost('/api/v2/desktop/app/get-device-id', args2[0]) ??
      Promise.resolve(''),
    checkForUpdates: (...args3) =>
      getDesktopApi()?.checkForUpdates?.(...args3) ??
      chromeShellPost('/api/v2/desktop/app/check-for-updates', args3[0]) ??
      Promise.resolve(null),
    getUpdateState: (...args4) =>
      getDesktopApi()?.getUpdateState?.(...args4) ??
      chromeShellPost('/api/v2/desktop/app/update-state', args4[0]) ??
      Promise.resolve(null),
    downloadUpdate: (...args5) =>
      getDesktopApi()?.downloadUpdate?.(...args5) ??
      chromeShellPost('/api/v2/desktop/app/download-update', args5[0]) ??
      Promise.resolve(null),
    cancelUpdateDownload: (...args6) =>
      getDesktopApi()?.cancelUpdateDownload?.(...args6) ??
      chromeShellPost('/api/v2/desktop/app/cancel-update-download', args6[0]) ??
      Promise.resolve(null),
    installDownloadedUpdate: async (...args7) => {
      return (
        await writeChromeShellRecoverySnapshotBeforeInstall(),
        getDesktopApi()?.installDownloadedUpdate?.(...args7) ??
          chromeShellPost('/api/v2/desktop/app/install-downloaded-update', args7[0]) ??
          null
      );
    },
    onUpdaterEvent: (value18) =>
      getDesktopApi()?.onUpdaterEvent?.(value18) ||
      subscribeToUpdaterState(() => desktopBridge.app.getUpdateState(), value18),
  },
  project: {
    get api() {
      return getGroup(getElectronApi(), 'project');
    },
    isAvailable() {
      return !!desktopBridge.project.api || desktopBridge.isChromeShell;
    },
    open: (...args8) =>
      desktopBridge.project.api?.open?.(...args8) ??
      chromeShellPost('/api/v2/desktop/project/open', args8[0]),
    save: (...args9) =>
      desktopBridge.project.api?.save?.(...args9) ??
      chromeShellPost('/api/v2/desktop/project/save', args9[0]),
    exportPackage: (...args10) =>
      withDeferredMediaFiles(
        args10,
        () =>
          desktopBridge.project.api?.exportPackage?.(...args10) ??
          chromeShellPost('/api/v2/desktop/project/export-package', args10[0]),
      ),
    importPackage: (...args11) =>
      desktopBridge.project.api?.importPackage?.(...args11) ??
      chromeShellPost('/api/v2/desktop/project/import-package', args11[0]),
    listRecent: (...args12) =>
      desktopBridge.project.api?.listRecent?.(...args12) ??
      chromeShellPost('/api/v2/desktop/project/list-recent', args12[0]),
    removeRecent: (...args13) =>
      desktopBridge.project.api?.removeRecent?.(...args13) ??
      chromeShellPost('/api/v2/desktop/project/remove-recent', args13[0]),
    clearRecoverySnapshot: (...args14) =>
      desktopBridge.project.api?.clearRecoverySnapshot?.(...args14) ??
      chromeShellPost('/api/v2/desktop/project/clear-recovery-snapshot', args14[0]),
    writeRecoverySnapshot: (...args15) =>
      desktopBridge.project.api?.writeRecoverySnapshot?.(...args15) ??
      chromeShellPost('/api/v2/desktop/project/write-recovery-snapshot', args15[0]),
    // A compatibility-guarded writer. Deliberately a getter that yields `undefined`
    // when the host does not implement the guard: the renderer must be able to tell
    // "this host is too old to write safely" apart from "this host is available"
    // before it persists a recovery snapshot.
    get writeRecoverySnapshotIfCompatible() {
      const hostApi = desktopBridge.project.api;
      if (isFunction(hostApi?.writeRecoverySnapshotIfCompatible))
        return (...args) => hostApi.writeRecoverySnapshotIfCompatible(...args);
      if (desktopBridge.isChromeShell)
        return (...args) =>
          chromeShellPost('/api/v2/desktop/project/write-recovery-snapshot-if-compatible', args[0]);
      return undefined;
    },
    getRecoverySnapshotInfo: (...args16) =>
      desktopBridge.project.api?.getRecoverySnapshotInfo?.(...args16) ??
      chromeShellPost('/api/v2/desktop/project/get-recovery-snapshot-info', args16[0]),
    readRecoverySnapshot: (...args17) =>
      desktopBridge.project.api?.readRecoverySnapshot?.(...args17) ??
      chromeShellPost('/api/v2/desktop/project/read-recovery-snapshot', args17[0]),
    setUnsavedState: (...args18) =>
      desktopBridge.project.api?.setUnsavedState?.(...args18) ??
      postChromeShellUnsavedState(args18[0]),
    consumeExternalOpenRequests: (...args19) =>
      desktopBridge.project.api?.consumeExternalOpenRequests?.(...args19) ??
      chromeShellPost('/api/v2/desktop/project/consume-external-open-requests', args19[0]),
    onExternalOpen: (value19) =>
      desktopBridge.project.api?.onExternalOpen?.(value19) ||
      subscribeToConsumedBatch(
        () => chromeShellPost('/api/v2/desktop/project/consume-external-open-requests', {}),
        value19,
        { intervalMs: 500 },
      ),
    onPackageProgress: (value20) =>
      desktopBridge.project.api?.onPackageProgress?.(value20) ||
      subscribeByPolling(
        () => chromeShellPost('/api/v2/desktop/project/consume-package-progress-events', {}),
        value20,
        {
          intervalMs: 250,
          extractItems: (value21) => (Array.isArray(value21) ? value21 : []),
          getKey: (value22) =>
            String(value22?.createdAt || value22?.operationId || JSON.stringify(value22 || {})),
        },
      ),
  },
  shell: {
    isAvailable() {
      const electronApi = getElectronApi();
      return (
        isFunction(electronApi?.shell?.openExternal) ||
        isFunction(electronApi?.openExternal) ||
        desktopBridge.isChromeShell
      );
    },
    canShowItemInFolder() {
      return isFunction(getElectronApi()?.showItemInFolder) || desktopBridge.isChromeShell;
    },
    canOpenKnownFolder() {
      return isFunction(getElectronApi()?.openKnownFolder) || desktopBridge.isChromeShell;
    },
    showItemInFolder: (value23) =>
      getElectronApi()?.showItemInFolder?.(value23) ??
      chromeShellPost('/api/v2/desktop/shell/show-item-in-folder', value23) ??
      unavailable('showItemInFolder')(),
    openKnownFolder: (value24) =>
      getElectronApi()?.openKnownFolder?.(value24) ??
      chromeShellPost('/api/v2/desktop/shell/open-known-folder', value24) ??
      unavailable('openKnownFolder')(),
    openExternal(url) {
      const run4 = getElectronApi()?.shell?.openExternal || getElectronApi()?.openExternal;
      if (isFunction(run4)) return run4(url);
      const chromeShellPost2 = chromeShellPost('/api/v2/desktop/shell/open-external', { url: url });
      if (chromeShellPost2) return chromeShellPost2;
      if (typeof globalThis.open === 'function')
        return (
          globalThis.open(String(url || ''), '_blank', 'noopener,noreferrer'),
          Promise.resolve({ ok: true, fallback: 'browser' })
        );
      return Promise.resolve({ ok: false, error: 'openExternal unavailable' });
    },
  },
  mediaPreview: {
    isAvailable() {
      return isFunction(getElectronApi()?.getLocalPreviewUrl) || desktopBridge.isChromeShell;
    },
    async getLocalPreviewUrl(options3 = {}) {
      const deferredMediaPreview2 = deferredMediaPreview(options3);
      if (deferredMediaPreview2) return deferredMediaPreview2;
      const run5 = getElectronApi()?.getLocalPreviewUrl;
      if (isFunction(run5)) return run5(options3);
      if (!desktopBridge.isChromeShell) throw new Error('Local preview bridge unavailable');
      return postDesktopBridge('/api/v2/desktop/local-preview', options3);
    },
  },
  assetImport: {
    isAvailable() {
      return !!getElectronApi() || desktopBridge.isChromeShell;
    },
    canImportAsset() {
      return isFunction(getElectronApi()?.importAsset) || desktopBridge.isChromeShell;
    },
    canImportRemoteAsset() {
      return isFunction(getElectronApi()?.importRemoteAsset) || desktopBridge.isChromeShell;
    },
    canImportLocalFile() {
      return isFunction(getElectronApi()?.importLocalFile) || desktopBridge.isChromeShell;
    },
    canResolveFilePath() {
      return !!getElectronApi() || desktopBridge.isChromeShell;
    },
    canSubscribeUpdates() {
      return isFunction(getElectronApi()?.onAssetUpdated) || desktopBridge.isChromeShell;
    },
    importAsset: (...args20) =>
      withDeferredMediaFiles(
        args20,
        () =>
          getElectronApi()?.importAsset?.(...args20) ??
          chromeShellPost('/api/v2/desktop/asset/import', args20[0]),
      ),
    importRemoteAsset: (...args21) =>
      withDeferredMediaFiles(
        args21,
        () =>
          getElectronApi()?.importRemoteAsset?.(...args21) ??
          chromeShellPost('/api/v2/desktop/asset/import-remote', args21[0]),
      ),
    importLocalFile: (...args22) =>
      withDeferredMediaFiles(
        args22,
        () =>
          getElectronApi()?.importLocalFile?.(...args22) ??
          chromeShellPost('/api/v2/desktop/file/import-local', args22[0]),
      ),
    getPathForFile: (...args23) => getElectronApi()?.getPathForFile?.(...args23) || '',
    onAssetUpdated: (value25) =>
      getElectronApi()?.onAssetUpdated?.(value25) ||
      subscribeByPolling(() => chromeShellPost('/api/v2/desktop/asset/consume-updates', {}), value25, {
        intervalMs: 500,
        extractItems: (value26) => (Array.isArray(value26) ? value26 : []),
        getKey: (value27) => String(value27?.assetId || JSON.stringify(value27 || {})),
      }),
  },
  dialog: {
    isAvailable() {
      return isFunction(getElectronApi()?.selectDirectory) || desktopBridge.isChromeShell;
    },
    selectDirectory: (...args24) =>
      getElectronApi()?.selectDirectory?.(...args24) ??
      chromeShellPost('/api/v2/desktop/dialog/select-directory', args24[0]),
  },
  webPreview: {
    get api() {
      return getGroup(getElectronApi(), 'webPreview');
    },
    get surfaceMode() {
      return (
        desktopBridge.webPreview.api?.surfaceMode ||
        (desktopBridge.isChromeShell ? 'remote-snapshot' : '')
      );
    },
    isAvailable() {
      return isFunction(desktopBridge.webPreview.api?.syncViews) || desktopBridge.isChromeShell;
    },
    syncViews: (...args25) =>
      desktopBridge.webPreview.api?.syncViews?.(...args25) ??
      chromeShellPost('/api/v2/desktop/web-preview/sync-views', args25[0]),
    syncViewsFast: (...args26) =>
      desktopBridge.webPreview.api?.syncViewsFast?.(...args26) ??
      desktopBridge.webPreview.api?.syncViews?.(...args26) ??
      syncChromeShellWebPreviewViews(args26[0]),
    disposeViews: (...args27) =>
      desktopBridge.webPreview.api?.disposeViews?.(...args27) ??
      chromeShellPost('/api/v2/desktop/web-preview/dispose-views', args27[0]),
    controlView: (...args28) =>
      desktopBridge.webPreview.api?.controlView?.(...args28) ??
      chromeShellPost('/api/v2/desktop/web-preview/control-view', args28[0]),
    onEvent: (value28) =>
      desktopBridge.webPreview.api?.onEvent?.(value28) ||
      subscribeByLongPolling(
        () => chromeShellPost('/api/v2/desktop/web-preview/wait-events', { waitMs: 1000 }),
        value28,
      ),
  },
  customAiApps: {
    get api() {
      return getGroup(getElectronApi(), 'customAiApps');
    },
    isAvailable() {
      return !!desktopBridge.customAiApps.api || desktopBridge.isChromeShell;
    },
    read: (...args29) =>
      desktopBridge.customAiApps.api?.read?.(...args29) ??
      chromeShellPost('/api/v2/desktop/custom-ai-apps/read', args29[0]),
    write: (...args30) =>
      desktopBridge.customAiApps.api?.write?.(...args30) ??
      chromeShellPost('/api/v2/desktop/custom-ai-apps/write', args30[0]),
  },
  agentSkills: {
    get api() {
      return getGroup(getElectronApi(), 'agentSkills');
    },
    isAvailable() {
      return !!desktopBridge.agentSkills.api || desktopBridge.isChromeShell;
    },
    list: (...args31) =>
      desktopBridge.agentSkills.api?.list?.(...args31) ??
      chromeShellPostOperationResult('/api/v2/desktop/agent-skills/list', args31[0]),
    openRoot: (...args32) =>
      desktopBridge.agentSkills.api?.openRoot?.(...args32) ??
      chromeShellPostOperationResult('/api/v2/desktop/agent-skills/open-root', args32[0]),
    installFromFolder: (...args33) =>
      desktopBridge.agentSkills.api?.installFromFolder?.(...args33) ??
      chromeShellPostOperationResult('/api/v2/desktop/agent-skills/install-folder', args33[0]),
    saveManaged: (...args34) =>
      desktopBridge.agentSkills.api?.saveManaged?.(...args34) ??
      chromeShellPostOperationResult('/api/v2/desktop/agent-skills/save-managed', args34[0]),
    deleteInstalled: (...args35) =>
      desktopBridge.agentSkills.api?.deleteInstalled?.(...args35) ??
      chromeShellPostOperationResult('/api/v2/desktop/agent-skills/delete-installed', args35[0]),
  },
  agentInformation: {
    get api() {
      return getGroup(getElectronApi(), 'agentInformation');
    },
    isAvailable() {
      return !!desktopBridge.agentInformation.api || desktopBridge.isChromeShell;
    },
    readUrl: (...args36) =>
      desktopBridge.agentInformation.api?.readUrl?.(...args36) ??
      chromeShellPostOperationResult('/api/v2/desktop/agent-information/read-url', args36[0]),
  },
  storageMigration: {
    isAvailable() {
      return desktopBridge.isChromeShell;
    },
    read: () => chromeShellPost('/api/v2/desktop/storage-migration/read', {}),
    complete: (value29) => chromeShellPost('/api/v2/desktop/storage-migration/complete', value29),
  },
  secureSettings: {
    get api() {
      return getGroup(getElectronApi(), 'secureSettings');
    },
    get: (...args37) =>
      desktopBridge.secureSettings.api?.get?.(...args37) ??
      chromeShellPost('/api/v2/desktop/secure-settings/get', args37[0]),
    set: (...args38) =>
      desktopBridge.secureSettings.api?.set?.(...args38) ??
      chromeShellPost('/api/v2/desktop/secure-settings/set', args38[0]),
    delete: (...args39) =>
      desktopBridge.secureSettings.api?.delete?.(...args39) ??
      chromeShellPost('/api/v2/desktop/secure-settings/delete', args39[0]),
  },
  mediaTask: {
    get api() {
      return getGroup(getElectronApi(), 'mediaTask');
    },
    isAvailable() {
      return !!desktopBridge.mediaTask.api || desktopBridge.isChromeShell;
    },
    enqueue: (...args40) =>
      withDeferredMediaFiles(
        args40,
        () =>
          desktopBridge.mediaTask.api?.enqueue?.(...args40) ??
          chromeShellPost('/api/v2/desktop/media-task/enqueue', args40[0]),
      ),
    cancel: (...args41) =>
      desktopBridge.mediaTask.api?.cancel?.(...args41) ??
      chromeShellPost('/api/v2/desktop/media-task/cancel', args41[0]),
    list: (...args42) =>
      desktopBridge.mediaTask.api?.list?.(...args42) ??
      chromeShellPost('/api/v2/desktop/media-task/list', args42[0]),
    onUpdate: (value30) =>
      desktopBridge.mediaTask.api?.onUpdate?.(value30) ||
      subscribeByPolling(() => desktopBridge.mediaTask.list({ limit: 120 }), value30, {
        intervalMs: 1000,
        extractItems: (value31) =>
          Array.isArray(value31?.tasks) ? value31.tasks : Array.isArray(value31) ? value31 : [],
        getKey: (value32) => String(value32?.taskId || JSON.stringify(value32 || {})),
      }),
  },
  diagnostics: {
    get api() {
      return getGroup(getElectronApi(), 'diagnostics');
    },
    isAvailable() {
      return !!desktopBridge.diagnostics.api || desktopBridge.isChromeShell;
    },
    logEvent: (...args43) =>
      desktopBridge.diagnostics.api?.logEvent?.(...args43) ??
      chromeShellPost('/api/v2/desktop/diagnostics/log-event', args43[0]),
    createPackage: (...args44) =>
      desktopBridge.diagnostics.api?.createPackage?.(...args44) ??
      chromeShellPost('/api/v2/desktop/diagnostics/create-package', args44[0]),
    openLogsFolder: (...args45) =>
      desktopBridge.diagnostics.api?.openLogsFolder?.(...args45) ??
      chromeShellPost('/api/v2/desktop/diagnostics/open-logs-folder', args45[0]),
  },
  nodeExport: {
    openJianying: () =>
      desktopBridge.nodeExport.api?.openJianying?.() ??
      chromeShellPost('/api/v2/desktop/node-export/open-jianying', {}) ??
      unavailable('nodeExport.openJianying')(),
    saveTimeline: (...args46) =>
      withDeferredMediaFiles(
        args46,
        () =>
          desktopBridge.nodeExport.api?.saveTimeline?.(...args46) ??
          chromeShellPost('/api/v2/desktop/node-export/save-timeline', args46[0]) ??
          unavailable('nodeExport.saveTimeline')(),
      ),
    get api() {
      return getGroup(getElectronApi(), 'nodeExport');
    },
    isAvailable() {
      return (
        isFunction(desktopBridge.nodeExport.api?.exportSelected) ||
        isFunction(desktopBridge.nodeExport.api?.saveMedia) ||
        isFunction(desktopBridge.nodeExport.api?.saveText) ||
        isFunction(desktopBridge.nodeExport.api?.saveMediaFiles) ||
        isFunction(desktopBridge.nodeExport.api?.saveTimeline) ||
        desktopBridge.isChromeShell
      );
    },
    canSaveMedia() {
      return isFunction(desktopBridge.nodeExport.api?.saveMedia) || desktopBridge.isChromeShell;
    },
    canSaveText() {
      return isFunction(desktopBridge.nodeExport.api?.saveText) || desktopBridge.isChromeShell;
    },
    canSaveMediaFiles() {
      return (
        isFunction(desktopBridge.nodeExport.api?.saveMediaFiles) || desktopBridge.isChromeShell
      );
    },
    exportSelected: (...args47) =>
      withDeferredMediaFiles(
        args47,
        () =>
          desktopBridge.nodeExport.api?.exportSelected?.(...args47) ??
          chromeShellPost('/api/v2/desktop/node-export/export-selected', args47[0]) ??
          unavailable('nodeExport.exportSelected')(),
      ),
    saveMedia: (...args48) =>
      withDeferredMediaFiles(
        args48,
        () =>
          desktopBridge.nodeExport.api?.saveMedia?.(...args48) ??
          chromeShellPost('/api/v2/desktop/node-export/save-media', args48[0]) ??
          unavailable('nodeExport.saveMedia')(),
      ),
    saveText: (...args49) =>
      desktopBridge.nodeExport.api?.saveText?.(...args49) ??
      chromeShellPost('/api/v2/desktop/node-export/save-text', args49[0]) ??
      unavailable('nodeExport.saveText')(),
    saveMediaFiles: (...args50) =>
      withDeferredMediaFiles(
        args50,
        () =>
          desktopBridge.nodeExport.api?.saveMediaFiles?.(...args50) ??
          chromeShellPost('/api/v2/desktop/node-export/save-media-files', args50[0]) ??
          unavailable('nodeExport.saveMediaFiles')(),
      ),
  },
  notification: {
    get api() {
      return getGroup(getElectronApi(), 'notification');
    },
    isAvailable() {
      return (
        isFunction(desktopBridge.notification.api?.showGenerationComplete) ||
        desktopBridge.isChromeShell
      );
    },
    updateGlobalShortcut: (value33) =>
      desktopBridge.notification.api?.updateGlobalShortcut?.(value33) ??
      chromeShellPost('/api/v2/desktop/notification/update-global-shortcut', value33),
    acknowledge: (value34) =>
      desktopBridge.notification.api?.acknowledge?.(value34) ??
      chromeShellPost('/api/v2/desktop/notification/acknowledge', value34),
    showGenerationComplete: (...args51) =>
      desktopBridge.notification.api?.showGenerationComplete?.(...args51) ??
      chromeShellPost('/api/v2/desktop/notification/show-generation-complete', args51[0]) ??
      Promise.resolve({ success: true, shown: false, reason: 'unavailable' }),
    onGenerationCompleteClick: (value35) =>
      desktopBridge.notification.api?.onGenerationCompleteClick?.(value35) ||
      subscribeByPolling(
        () => chromeShellPost('/api/v2/desktop/notification/consume-generation-complete-clicks', {}),
        value35,
        {
          intervalMs: 400,
          extractItems: (value36) => (Array.isArray(value36) ? value36 : []),
          getKey: (value37) =>
            String(value37?.eventId || value37?.createdAt || JSON.stringify(value37 || {})),
        },
      ),
  },
  screenshot: {
    get api() {
      return getGroup(getElectronApi(), 'screenshot');
    },
    isAvailable() {
      return !!desktopBridge.screenshot.api || desktopBridge.isChromeShell;
    },
    captureDisplay: (...args52) =>
      desktopBridge.screenshot.api?.captureDisplay?.(...args52) ??
      chromeShellPost('/api/v2/desktop/screenshot/capture-display', args52[0]),
    updateGlobalShortcut: (...args53) =>
      desktopBridge.screenshot.api?.updateGlobalShortcut?.(...args53) ??
      chromeShellPost('/api/v2/desktop/screenshot/update-global-shortcut', args53[0]),
    onGlobalCapture: (value38) =>
      desktopBridge.screenshot.api?.onGlobalCapture?.(value38) ||
      subscribeByPolling(
        () => chromeShellPost('/api/v2/desktop/screenshot/consume-global-capture-events', {}),
        value38,
        {
          intervalMs: 150,
          extractItems: (value39) => (Array.isArray(value39) ? value39 : []),
          getKey: (value40) =>
            String(value40?.createdAt || value40?.source || JSON.stringify(value40 || {})),
        },
      ),
    onGlobalShortcutStatus: (value41) =>
      desktopBridge.screenshot.api?.onGlobalShortcutStatus?.(value41) ||
      subscribeByPolling(
        () => chromeShellPost('/api/v2/desktop/screenshot/get-global-shortcut-status', {}),
        value41,
        { intervalMs: 1000, getKey: () => 'global-shortcut-status' },
      ),
  },
  textPreset: {
    get api() {
      return getGroup(getElectronApi(), 'textPreset');
    },
    isAvailable() {
      return !!desktopBridge.textPreset.api || desktopBridge.isChromeShell;
    },
    updateGlobalShortcut: (...args54) =>
      desktopBridge.textPreset.api?.updateGlobalShortcut?.(...args54) ??
      chromeShellPost('/api/v2/desktop/text-preset/update-global-shortcut', args54[0]),
    claimEvent: (value42) =>
      desktopBridge.textPreset.api?.claimEvent?.(value42) ??
      chromeShellPost('/api/v2/desktop/text-preset/claim-event', value42),
    acknowledgeEvent: (value43) =>
      desktopBridge.textPreset.api?.acknowledgeEvent?.(value43) ??
      chromeShellPost('/api/v2/desktop/text-preset/acknowledge-event', value43),
    onSelectedText: (handler10) =>
      desktopBridge.textPreset.api?.onSelectedText?.(handler10) ||
      subscribeToConsumedBatch(
        () => chromeShellPost('/api/v2/desktop/text-preset/consume-events', {}),
        (list4) => list4.forEach((value44) => handler10(value44)),
        { intervalMs: 150 },
      ),
    onGlobalShortcutStatus: (value45) =>
      desktopBridge.textPreset.api?.onGlobalShortcutStatus?.(value45) ||
      subscribeByPolling(
        () => chromeShellPost('/api/v2/desktop/text-preset/get-global-shortcut-status', {}),
        value45,
        { intervalMs: 1000, getKey: () => 'global-text-preset-shortcut-status' },
      ),
  },
  notificationSound: {
    get api() {
      return getGroup(getElectronApi() || getWindowObject()?.electronAPI, 'notificationSound');
    },
    isAvailable() {
      return !!desktopBridge.notificationSound.api || desktopBridge.isChromeShell;
    },
    listMp3Files: (...args55) =>
      desktopBridge.notificationSound.api?.listMp3Files?.(...args55) ??
      chromeShellPost('/api/v2/desktop/notification-sound/list-mp3-files', args55[0]),
    listSystemSounds: (...args56) =>
      desktopBridge.notificationSound.api?.listSystemSounds?.(...args56) ??
      chromeShellPost('/api/v2/desktop/notification-sound/list-system-sounds', args56[0]),
    openSystemSoundFolder: (...args57) =>
      desktopBridge.notificationSound.api?.openSystemSoundFolder?.(...args57) ??
      chromeShellPost('/api/v2/desktop/notification-sound/open-system-sound-folder', args57[0]),
    play: (...args58) =>
      desktopBridge.notificationSound.api?.play?.(...args58) ??
      chromeShellPost('/api/v2/desktop/notification-sound/play', args58[0]),
  },
  localAssetCleanup: {
    get api() {
      return getGroup(getElectronApi(), 'localAssetCleanup');
    },
    isAvailable() {
      return !!desktopBridge.localAssetCleanup.api || desktopBridge.isChromeShell;
    },
    scan: (...args59) =>
      desktopBridge.localAssetCleanup.api?.scan?.(...args59) ??
      chromeShellPost('/api/v2/desktop/local-asset-cleanup/scan', args59[0]),
    trash: (...args60) =>
      desktopBridge.localAssetCleanup.api?.trash?.(...args60) ??
      chromeShellPost('/api/v2/desktop/local-asset-cleanup/trash', args60[0]),
  },
  clipboard: {
    get api() {
      return getGroup(getElectronApi(), 'clipboard');
    },
    canUseImages() {
      return (
        isFunction(desktopBridge.clipboard.api?.writeImage) ||
        isFunction(desktopBridge.clipboard.api?.readImage) ||
        desktopBridge.isChromeShell
      );
    },
    canUseFiles() {
      return !!desktopBridge.clipboard.api || desktopBridge.isChromeShell;
    },
    canUseText() {
      return !!desktopBridge.clipboard.api || desktopBridge.isChromeShell;
    },
    writeImage: (...args61) => desktopBridge.clipboard.api?.writeImage?.(...args61),
    readImage: (...args62) =>
      desktopBridge.clipboard.api?.readImage?.(...args62) ??
      chromeShellPost('/api/v2/desktop/clipboard/read-image'),
    writeFileReferences: (...args63) =>
      desktopBridge.clipboard.api?.writeFileReferences?.(...args63) ??
      chromeShellPost('/api/v2/desktop/clipboard/write-file-references', args63[0]),
    readFileReferences: (...args64) =>
      desktopBridge.clipboard.api?.readFileReferences?.(...args64) ??
      chromeShellPost('/api/v2/desktop/clipboard/read-file-references', args64[0]),
    writeText: (...args65) =>
      desktopBridge.clipboard.api?.writeText?.(...args65) ??
      chromeShellPost('/api/v2/desktop/clipboard/write-text', args65[0]),
    readText: (...args66) =>
      desktopBridge.clipboard.api?.readText?.(...args66) ??
      chromeShellPost('/api/v2/desktop/clipboard/read-text', args66[0]),
  },
  canvasVisualSnapshot: {
    get api() {
      return getGroup(getElectronApi(), 'canvasVisualSnapshot');
    },
    isAvailable() {
      return isFunction(desktopBridge.canvasVisualSnapshot.api?.capturePage);
    },
    capturePage: (...args67) => desktopBridge.canvasVisualSnapshot.api?.capturePage?.(...args67),
  },
};
export function installDesktopBridgeCompat() {
  const windowObject5 = getWindowObject();
  if (
    !windowObject5 ||
    !desktopBridge.isChromeShell ||
    windowObject5.electronAPI ||
    windowObject5.aiCanvasDesktop
  )
    return false;
  return (
    (windowObject5.__AIC_CHROME_SHELL__ = true),
    (windowObject5.aiCanvasDesktop = {
      __aicDesktopHttpShim: true,
      isElectron: false,
      getAppVersion: (value46) => chromeShellPost('/api/v2/desktop/app/get-version', value46),
      getDeviceId: (value47) => chromeShellPost('/api/v2/desktop/app/get-device-id', value47),
      checkForUpdates: (value48) => chromeShellPost('/api/v2/desktop/app/check-for-updates', value48),
      getUpdateState: (value49) => chromeShellPost('/api/v2/desktop/app/update-state', value49),
      downloadUpdate: (value50) => chromeShellPost('/api/v2/desktop/app/download-update', value50),
      cancelUpdateDownload: (value51) =>
        chromeShellPost('/api/v2/desktop/app/cancel-update-download', value51),
      installDownloadedUpdate: async (value52) => {
        return (
          await writeChromeShellRecoverySnapshotBeforeInstall(),
          chromeShellPost('/api/v2/desktop/app/install-downloaded-update', value52)
        );
      },
      onUpdaterEvent: (value53) =>
        subscribeToUpdaterState(() => chromeShellPost('/api/v2/desktop/app/update-state', {}), value53),
    }),
    (windowObject5.electronAPI = {
      __aicDesktopHttpShim: true,
      project: {
        open: (value54) => chromeShellPost('/api/v2/desktop/project/open', value54),
        save: (value55) => chromeShellPost('/api/v2/desktop/project/save', value55),
        exportPackage: (value56) => chromeShellPost('/api/v2/desktop/project/export-package', value56),
        importPackage: (value57) => chromeShellPost('/api/v2/desktop/project/import-package', value57),
        listRecent: (value58) => chromeShellPost('/api/v2/desktop/project/list-recent', value58),
        removeRecent: (value59) => chromeShellPost('/api/v2/desktop/project/remove-recent', value59),
        setUnsavedState: (value60) => postChromeShellUnsavedState(value60),
        writeRecoverySnapshot: (value61) =>
          chromeShellPost('/api/v2/desktop/project/write-recovery-snapshot', value61),
        getRecoverySnapshotInfo: (value62) =>
          chromeShellPost('/api/v2/desktop/project/get-recovery-snapshot-info', value62),
        readRecoverySnapshot: (value63) =>
          chromeShellPost('/api/v2/desktop/project/read-recovery-snapshot', value63),
        clearRecoverySnapshot: (value64) =>
          chromeShellPost('/api/v2/desktop/project/clear-recovery-snapshot', value64),
        consumeExternalOpenRequests: (value65) =>
          chromeShellPost('/api/v2/desktop/project/consume-external-open-requests', value65),
        onExternalOpen: (value66) =>
          subscribeToConsumedBatch(
            () => chromeShellPost('/api/v2/desktop/project/consume-external-open-requests', {}),
            value66,
            { intervalMs: 500 },
          ),
        onPackageProgress: (value67) =>
          subscribeByPolling(
            () => chromeShellPost('/api/v2/desktop/project/consume-package-progress-events', {}),
            value67,
            {
              intervalMs: 250,
              extractItems: (value68) => (Array.isArray(value68) ? value68 : []),
              getKey: (value69) =>
                String(
                  value69?.createdAt || value69?.operationId || JSON.stringify(value69 || {}),
                ),
            },
          ),
      },
      importAsset: (value70) => chromeShellPost('/api/v2/desktop/asset/import', value70),
      importRemoteAsset: (value71) => chromeShellPost('/api/v2/desktop/asset/import-remote', value71),
      importLocalFile: (value72) => chromeShellPost('/api/v2/desktop/file/import-local', value72),
      getPathForFile: (value73) => String(value73?.path || ''),
      getLocalPreviewUrl: (value74) => postDesktopBridge('/api/v2/desktop/local-preview', value74),
      selectDirectory: (value75) => chromeShellPost('/api/v2/desktop/dialog/select-directory', value75),
      showItemInFolder: (value76) => chromeShellPost('/api/v2/desktop/shell/show-item-in-folder', value76),
      openKnownFolder: (value77) => chromeShellPost('/api/v2/desktop/shell/open-known-folder', value77),
      openExternal: (url2) => chromeShellPost('/api/v2/desktop/shell/open-external', { url: url2 }),
      shell: {
        openExternal: (url3) => chromeShellPost('/api/v2/desktop/shell/open-external', { url: url3 }),
      },
      webPreview: {
        surfaceMode: 'remote-snapshot',
        syncViews: (value78) => chromeShellPost('/api/v2/desktop/web-preview/sync-views', value78),
        syncViewsFast: (value79) => syncChromeShellWebPreviewViews(value79),
        disposeViews: (value80) => chromeShellPost('/api/v2/desktop/web-preview/dispose-views', value80),
        controlView: (value81) => chromeShellPost('/api/v2/desktop/web-preview/control-view', value81),
        onEvent: (value82) =>
          subscribeByLongPolling(
            () => chromeShellPost('/api/v2/desktop/web-preview/wait-events', { waitMs: 1000 }),
            value82,
          ),
      },
      secureSettings: {
        get: (value83) => chromeShellPost('/api/v2/desktop/secure-settings/get', value83),
        set: (value84) => chromeShellPost('/api/v2/desktop/secure-settings/set', value84),
        delete: (value85) => chromeShellPost('/api/v2/desktop/secure-settings/delete', value85),
      },
      customAiApps: {
        read: (value86) => chromeShellPost('/api/v2/desktop/custom-ai-apps/read', value86),
        write: (value87) => chromeShellPost('/api/v2/desktop/custom-ai-apps/write', value87),
      },
      agentInformation: {
        readUrl: (value88) => chromeShellPost('/api/v2/desktop/agent-information/read-url', value88),
      },
      mediaTask: {
        enqueue: (value89) => chromeShellPost('/api/v2/desktop/media-task/enqueue', value89),
        cancel: (value90) => chromeShellPost('/api/v2/desktop/media-task/cancel', value90),
        list: (value91) => chromeShellPost('/api/v2/desktop/media-task/list', value91),
        onUpdate: (value92) =>
          subscribeByPolling(
            () => chromeShellPost('/api/v2/desktop/media-task/list', { limit: 120 }),
            value92,
            {
              intervalMs: 1000,
              extractItems: (value93) =>
                Array.isArray(value93?.tasks)
                  ? value93.tasks
                  : Array.isArray(value93)
                    ? value93
                    : [],
              getKey: (value94) => String(value94?.taskId || JSON.stringify(value94 || {})),
            },
          ),
      },
      diagnostics: {
        logEvent: (value95) => desktopBridge.diagnostics.logEvent(value95),
        createPackage: (value96) => desktopBridge.diagnostics.createPackage(value96),
        openLogsFolder: (value97) => desktopBridge.diagnostics.openLogsFolder(value97),
      },
      notification: {
        showGenerationComplete: (value98) => desktopBridge.notification.showGenerationComplete(value98),
        onGenerationCompleteClick: (value99) =>
          desktopBridge.notification.onGenerationCompleteClick(value99),
      },
      notificationSound: {
        listMp3Files: (value100) =>
          chromeShellPost('/api/v2/desktop/notification-sound/list-mp3-files', value100),
        listSystemSounds: (value101) =>
          chromeShellPost('/api/v2/desktop/notification-sound/list-system-sounds', value101),
        openSystemSoundFolder: (value102) =>
          chromeShellPost('/api/v2/desktop/notification-sound/open-system-sound-folder', value102),
        play: (value103) => chromeShellPost('/api/v2/desktop/notification-sound/play', value103),
      },
      localAssetCleanup: {
        scan: (value104) => chromeShellPost('/api/v2/desktop/local-asset-cleanup/scan', value104),
        trash: (value105) => chromeShellPost('/api/v2/desktop/local-asset-cleanup/trash', value105),
      },
      nodeExport: {
        exportSelected: (value106) =>
          chromeShellPost('/api/v2/desktop/node-export/export-selected', value106),
        saveMedia: (value107) => chromeShellPost('/api/v2/desktop/node-export/save-media', value107),
        saveText: (value108) => chromeShellPost('/api/v2/desktop/node-export/save-text', value108),
        saveMediaFiles: (value109) =>
          chromeShellPost('/api/v2/desktop/node-export/save-media-files', value109),
        saveTimeline: (value110) => chromeShellPost('/api/v2/desktop/node-export/save-timeline', value110),
        openJianying: () => chromeShellPost('/api/v2/desktop/node-export/open-jianying', {}),
      },
      screenshot: {
        captureDisplay: (value111) => chromeShellPost('/api/v2/desktop/screenshot/capture-display', value111),
        updateGlobalShortcut: (value112) =>
          chromeShellPost('/api/v2/desktop/screenshot/update-global-shortcut', value112),
        onGlobalCapture: (value113) =>
          subscribeByPolling(
            () => chromeShellPost('/api/v2/desktop/screenshot/consume-global-capture-events', {}),
            value113,
            {
              intervalMs: 150,
              extractItems: (value114) => (Array.isArray(value114) ? value114 : []),
              getKey: (value115) =>
                String(value115?.createdAt || value115?.source || JSON.stringify(value115 || {})),
            },
          ),
        onGlobalShortcutStatus: (value116) =>
          subscribeByPolling(
            () => chromeShellPost('/api/v2/desktop/screenshot/get-global-shortcut-status', {}),
            value116,
            { intervalMs: 1000, getKey: () => 'global-shortcut-status' },
          ),
      },
      textPreset: {
        claimEvent: (value117) => chromeShellPost('/api/v2/desktop/text-preset/claim-event', value117),
        acknowledgeEvent: (value118) =>
          chromeShellPost('/api/v2/desktop/text-preset/acknowledge-event', value118),
        updateGlobalShortcut: (value119) =>
          chromeShellPost('/api/v2/desktop/text-preset/update-global-shortcut', value119),
        onSelectedText: (handler11) =>
          subscribeToConsumedBatch(
            () => chromeShellPost('/api/v2/desktop/text-preset/consume-events', {}),
            (list5) => list5.forEach((value120) => handler11(value120)),
            { intervalMs: 150 },
          ),
        onGlobalShortcutStatus: (value121) =>
          subscribeByPolling(
            () => chromeShellPost('/api/v2/desktop/text-preset/get-global-shortcut-status', {}),
            value121,
            { intervalMs: 1000, getKey: () => 'global-text-preset-shortcut-status' },
          ),
      },
      clipboard: {
        writeText: (value122) => chromeShellPost('/api/v2/desktop/clipboard/write-text', value122),
        readText: (value123) => chromeShellPost('/api/v2/desktop/clipboard/read-text', value123),
        writeFileReferences: (value124) =>
          chromeShellPost('/api/v2/desktop/clipboard/write-file-references', value124),
        readFileReferences: (value125) =>
          chromeShellPost('/api/v2/desktop/clipboard/read-file-references', value125),
      },
      onAssetUpdated: (value126) =>
        subscribeByPolling(() => chromeShellPost('/api/v2/desktop/asset/consume-updates', {}), value126, {
          intervalMs: 500,
          extractItems: (value127) => (Array.isArray(value127) ? value127 : []),
          getKey: (value128) => String(value128?.assetId || JSON.stringify(value128 || {})),
        }),
      logDragImport: (label, value129) =>
        desktopBridge.diagnostics.logEvent({
          type: 'import.drag_profile',
          level: 'debug',
          source: 'renderer',
          message: 'Drag import profile',
          context: { label: label, ...(value129 || {}) },
        }),
    }),
    true
  );
}
export function getDesktopBridge() {
  return desktopBridge;
}
export const __desktopBridgeForTest = {
  hasChromeShellRuntimeHint: hasChromeShellRuntimeHint,
  isLoopbackAppOrigin: isLoopbackAppOrigin,
  normalizeDesktopHttpPayload: normalizeDesktopHttpPayload,
  resolveDesktopBridgeRequestTimeout: resolveDesktopBridgeRequestTimeout,
  subscribeToConsumedBatch: subscribeToConsumedBatch,
  subscribeToUpdaterState: subscribeToUpdaterState,
  writeChromeShellRecoverySnapshotBeforeInstall: writeChromeShellRecoverySnapshotBeforeInstall,
};
