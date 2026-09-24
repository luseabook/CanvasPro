import { post } from '../../api/apiBase.js';
import { deferredMediaPreview, withDeferredMediaFiles } from '../../api/deferredMediaApi.js';
import { CHROME_SHELL_STARTUP_READY_EVENT } from './chromeShellStartupReadiness.js';
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']),
  LONG_DESKTOP_REQUEST_TIMEOUT_MS = 0x1e * 0x3c * 0x3e8,
  CHROME_SHELL_STARTUP_READY_REQUEST_TIMEOUT_MS = 0x5dc,
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
  return globalThis['window'] || null;
}
function getElectronApi() {
  const _0x37204c = getWindowObject()?.['electronAPI'] || null;
  return _0x37204c?.['__aicDesktopHttpShim'] === !![] ? null : _0x37204c;
}
function getDesktopApi() {
  const _0x110fb6 = getWindowObject()?.['aiCanvasDesktop'] || null;
  return _0x110fb6?.['__aicDesktopHttpShim'] === !![] ? null : _0x110fb6;
}
function isFunction(_0x5f55bb) {
  return typeof _0x5f55bb === 'function';
}
function isLoopbackAppOrigin() {
  try {
    const _0x163188 = globalThis['location'];
    if (!_0x163188 || !/^https?:$/i['test'](String(_0x163188['protocol'] || ''))) return ![];
    return LOOPBACK_HOSTS['has'](String(_0x163188['hostname'] || '')['toLowerCase']());
  } catch {
    return ![];
  }
}
function hasChromeShellRuntimeHint() {
  const _0x46c18a = getWindowObject();
  if (_0x46c18a?.['__AIC_CHROME_SHELL__'] || _0x46c18a?.['__AIC_DESKTOP_HTTP_BRIDGE__']) return !![];
  try {
    const _0x1b71a8 = new URLSearchParams(globalThis['location']?.['search'] || '');
    return String(_0x1b71a8['get']('aicRuntime') || '')['toLowerCase']() === 'chrome-shell';
  } catch {
    return ![];
  }
}
function normalizeHttpBridgeResult(_0x50d4a2) {
  if (!_0x50d4a2?.['success']) throw new Error(_0x50d4a2?.['error'] || 'Desktop bridge request failed');
  const _0x441569 = _0x50d4a2['data'];
  if (
    !_0x441569 ||
    typeof _0x441569 !== 'object' ||
    !Object['prototype']['hasOwnProperty']['call'](_0x441569, 'success')
  )
    return _0x441569;
  if (_0x441569['success'] === ![] && _0x441569['canceled'] === !![]) return _0x441569;
  if (_0x441569['success'] === ![])
    throw new Error(_0x441569['error'] || _0x441569['message'] || 'Desktop bridge request failed');
  if (Object['prototype']['hasOwnProperty']['call'](_0x441569, 'data')) return _0x441569['data'];
  return _0x441569;
}
function resolveDesktopBridgeRequestTimeout(_0x208150, _0x97ac0b = {}) {
  if (
    String(_0x208150 || '') === CHROME_SHELL_STARTUP_READY_PATH &&
    _0x97ac0b?.['type'] === CHROME_SHELL_STARTUP_READY_EVENT
  )
    return CHROME_SHELL_STARTUP_READY_REQUEST_TIMEOUT_MS;
  return LONG_DESKTOP_REQUEST_PATHS['has'](String(_0x208150 || ''))
    ? LONG_DESKTOP_REQUEST_TIMEOUT_MS
    : undefined;
}
async function postDesktopBridge(_0x79592b, _0x3f0f2e = {}) {
  return normalizeHttpBridgeResult(
    await post(_0x79592b, _0x3f0f2e, resolveDesktopBridgeRequestTimeout(_0x79592b, _0x3f0f2e)),
  );
}
async function normalizeDesktopHttpPayload(_0x36f1e3) {
  if (_0x36f1e3 instanceof ArrayBuffer) return Array['from'](new Uint8Array(_0x36f1e3));
  if (ArrayBuffer['isView'](_0x36f1e3))
    return Array['from'](
      new Uint8Array(_0x36f1e3['buffer'], _0x36f1e3['byteOffset'], _0x36f1e3['byteLength']),
    );
  if (typeof Blob !== 'undefined' && _0x36f1e3 instanceof Blob)
    return Array['from'](new Uint8Array(await _0x36f1e3['arrayBuffer']()));
  if (Array['isArray'](_0x36f1e3))
    return Promise['all'](_0x36f1e3['map']((_0x466261) => normalizeDesktopHttpPayload(_0x466261)));
  if (!_0x36f1e3 || typeof _0x36f1e3 !== 'object') return _0x36f1e3;
  const _0x4064a8 = await Promise['all'](
    Object['entries'](_0x36f1e3)['map'](async ([_0x30d614, _0x11d198]) => [
      _0x30d614,
      await normalizeDesktopHttpPayload(_0x11d198),
    ]),
  );
  return Object['fromEntries'](_0x4064a8);
}
function chromeShellPost(_0x5a03ed, _0x50c7ff = {}) {
  if (!desktopBridge['isChromeShell']) return undefined;
  return normalizeDesktopHttpPayload(_0x50c7ff)['then']((_0x16cf1b) =>
    postDesktopBridge(_0x5a03ed, _0x16cf1b),
  );
}
function chromeShellPostOperationResult(_0x53c234, _0x8006ce = {}) {
  if (!desktopBridge['isChromeShell']) return undefined;
  return normalizeDesktopHttpPayload(_0x8006ce)['then'](async (_0x445491) => {
    const _0x1f0be6 = await post(
      _0x53c234,
      _0x445491,
      resolveDesktopBridgeRequestTimeout(_0x53c234, _0x445491),
    );
    if (!_0x1f0be6?.['success']) throw new Error(_0x1f0be6?.['error'] || 'Desktop bridge request failed');
    const _0xcd183e = _0x1f0be6['data'];
    if (_0xcd183e?.['success'] === ![])
      throw new Error(_0xcd183e?.['error'] || 'Desktop bridge request failed');
    return _0xcd183e && Object['prototype']['hasOwnProperty']['call'](_0xcd183e, 'data')
      ? _0xcd183e['data']
      : _0xcd183e;
  });
}
async function writeChromeShellRecoverySnapshotBeforeInstall() {
  if (!desktopBridge['isChromeShell']) return null;
  const _0x42c059 = getWindowObject()?.['__aiCanvasWriteRecoverySnapshotForClose'];
  if (typeof _0x42c059 !== 'function') return null;
  return _0x42c059('update-install');
}
function createLatestOnlyChromeShellPoster(_0xb5174f) {
  let _0x3dc91b = null,
    _0xc35f0d = null;
  const _0x14e722 = async () => {
    try {
      while (_0x3dc91b) {
        const _0x36a9d6 = _0x3dc91b;
        ((_0x3dc91b = null), await chromeShellPost(_0xb5174f, _0x36a9d6));
      }
      return { ok: !![] };
    } finally {
      _0xc35f0d = null;
    }
  };
  return (_0x447c66 = {}) => {
    _0x3dc91b = _0x447c66;
    if (!_0xc35f0d) _0xc35f0d = _0x14e722();
    return _0xc35f0d;
  };
}
let chromeShellUnsavedStatePoster = null;
function postChromeShellUnsavedState(_0x4d8ca6) {
  if (!desktopBridge['isChromeShell']) return undefined;
  return (
    !chromeShellUnsavedStatePoster &&
      (chromeShellUnsavedStatePoster = createLatestOnlyChromeShellPoster(
        '/api/v2/desktop/project/set-unsaved-state',
      )),
    chromeShellUnsavedStatePoster(_0x4d8ca6)
  );
}
function subscribeByPolling(
  _0x1c017c,
  _0x2ee4be,
  {
    intervalMs: intervalMs = 0x3e8,
    extractItems: extractItems = (_0x2208c7) => _0x2208c7,
    getKey: getKey = (_0x53703e) => JSON['stringify'](_0x53703e),
  } = {},
) {
  if (!desktopBridge['isChromeShell'] || typeof _0x2ee4be !== 'function') return () => {};
  let _0x40159c = ![];
  const _0x84dc39 = new Map(),
    _0x130ad5 = async () => {
      if (_0x40159c) return;
      try {
        const _0x327e9e = await _0x1c017c();
        if (_0x40159c) return;
        const _0x4a6b11 = extractItems(_0x327e9e);
        if (Array['isArray'](_0x4a6b11))
          for (const _0x157ee8 of _0x4a6b11) {
            if (_0x40159c) break;
            const _0x6cdf16 = getKey(_0x157ee8),
              _0x313e25 = JSON['stringify'](_0x157ee8 || {});
            if (_0x84dc39['get'](_0x6cdf16) === _0x313e25) continue;
            (_0x84dc39['set'](_0x6cdf16, _0x313e25), _0x2ee4be(_0x157ee8));
          }
        else {
          if (_0x4a6b11 && typeof _0x4a6b11 === 'object') {
            const _0x17626f = getKey(_0x4a6b11),
              _0x384e38 = JSON['stringify'](_0x4a6b11 || {});
            _0x84dc39['get'](_0x17626f) !== _0x384e38 &&
              (_0x84dc39['set'](_0x17626f, _0x384e38), _0x2ee4be(_0x4a6b11));
          }
        }
      } catch {}
      if (!_0x40159c) setTimeout(_0x130ad5, intervalMs);
    };
  return (
    setTimeout(_0x130ad5, 0x0),
    () => {
      _0x40159c = !![];
    }
  );
}
function subscribeToConsumedBatch(_0x3939e6, _0x2d0521, { intervalMs: intervalMs = 0x1f4 } = {}) {
  if (!desktopBridge['isChromeShell'] || typeof _0x2d0521 !== 'function') return () => {};
  let _0x55cef7 = ![];
  const _0x421f56 = async () => {
    if (_0x55cef7) return;
    try {
      const _0x1d3957 = await _0x3939e6();
      if (_0x55cef7) return;
      if (Array['isArray'](_0x1d3957) && _0x1d3957['length'] > 0x0) _0x2d0521(_0x1d3957);
    } catch {}
    if (!_0x55cef7) setTimeout(_0x421f56, intervalMs);
  };
  return (
    setTimeout(_0x421f56, 0x0),
    () => {
      _0x55cef7 = !![];
    }
  );
}
function updaterEventFromStateSnapshot(_0x5920ba = {}) {
  if (!_0x5920ba || typeof _0x5920ba !== 'object') return null;
  if (typeof _0x5920ba['type'] === 'string' && _0x5920ba['type']) return _0x5920ba;
  if (_0x5920ba['latestEvent'] && typeof _0x5920ba['latestEvent']['type'] === 'string')
    return _0x5920ba['latestEvent'];
  const _0x26ced2 = String(_0x5920ba['state'] || '');
  if (!_0x26ced2 || _0x26ced2 === 'idle') return null;
  const _0x5dd418 = {
      checking: 'checking',
      available: 'available',
      downloading: 'download-started',
      downloaded: 'downloaded',
      error: 'download-failed',
      installing: 'installing',
    },
    _0x2225bd = _0x5dd418[_0x26ced2];
  if (!_0x2225bd) return null;
  return {
    type: _0x2225bd,
    state: _0x26ced2,
    info: _0x5920ba['latestInfo'] || null,
    retryCount: Number(_0x5920ba['retryCount'] || 0x0),
    maxRetries: Number(_0x5920ba['maxRetries'] || 0x0),
  };
}
function subscribeToUpdaterState(_0x1fa34a, _0x4f075f, _0x4e6b4 = subscribeByPolling) {
  if (typeof _0x4f075f !== 'function') return () => {};
  return _0x4e6b4(
    _0x1fa34a,
    (_0x30a88a) => {
      const _0x5342f9 = updaterEventFromStateSnapshot(_0x30a88a);
      if (_0x5342f9) _0x4f075f(_0x5342f9);
    },
    { intervalMs: 0xbb8, getKey: () => 'updater-state' },
  );
}
function subscribeByLongPolling(_0xe24dee, _0x58379f) {
  if (!desktopBridge['isChromeShell'] || typeof _0x58379f !== 'function') return () => {};
  let _0x1b1522 = ![];
  const _0x4de41e = (_0xec9309) => new Promise((_0x5c4f88) => setTimeout(_0x5c4f88, _0xec9309)),
    _0x5b721b = async () => {
      while (!_0x1b1522) {
        let _0x3ae272 = 0x0;
        try {
          const _0x2c0660 = await _0xe24dee();
          if (_0x1b1522) break;
          const _0x2c0165 = Array['isArray'](_0x2c0660) ? _0x2c0660 : [];
          ((_0x3ae272 = _0x2c0165['length']), _0x2c0165['forEach']((_0x11c5f5) => _0x58379f(_0x11c5f5)));
        } catch {
          if (!_0x1b1522) await _0x4de41e(0xfa);
          continue;
        }
        if (!_0x1b1522 && _0x3ae272 === 0x0) await _0x4de41e(0x18);
      }
    };
  return (
    void _0x5b721b(),
    () => {
      _0x1b1522 = !![];
    }
  );
}
function getGroup(_0x4c8a7c, _0x4d4180) {
  const _0x540dca = _0x4c8a7c?.[_0x4d4180];
  return _0x540dca && typeof _0x540dca === 'object' ? _0x540dca : null;
}
function unavailable(_0x944416) {
  return () => {
    throw new Error(_0x944416 + ' unavailable');
  };
}
const syncChromeShellWebPreviewViews = createLatestOnlyChromeShellPoster(
  '/api/v2/desktop/web-preview/sync-views',
);
export const desktopBridge = {
  get usesHttpCompat() {
    const _0x43098e = getWindowObject();
    return (
      _0x43098e?.['electronAPI']?.['__aicDesktopHttpShim'] === !![] ||
      _0x43098e?.['aiCanvasDesktop']?.['__aicDesktopHttpShim'] === !![] ||
      desktopBridge['isChromeShell']
    );
  },
  get isElectron() {
    return !!getDesktopApi()?.['isElectron'] || !!getElectronApi();
  },
  get isChromeShell() {
    return !getElectronApi() && isLoopbackAppOrigin() && hasChromeShellRuntimeHint();
  },
  app: {
    isAvailable() {
      return !!getDesktopApi() || desktopBridge['isChromeShell'];
    },
    getAppVersion: (..._0x58efec) =>
      getDesktopApi()?.['getAppVersion']?.(..._0x58efec) ??
      chromeShellPost('/api/v2/desktop/app/get-version', _0x58efec[0x0]) ??
      Promise['resolve'](''),
    getDeviceId: (..._0x2d4b80) =>
      getDesktopApi()?.['getDeviceId']?.(..._0x2d4b80) ??
      chromeShellPost('/api/v2/desktop/app/get-device-id', _0x2d4b80[0x0]) ??
      Promise['resolve'](''),
    checkForUpdates: (..._0x4a271d) =>
      getDesktopApi()?.['checkForUpdates']?.(..._0x4a271d) ??
      chromeShellPost('/api/v2/desktop/app/check-for-updates', _0x4a271d[0x0]) ??
      Promise['resolve'](null),
    getUpdateState: (..._0x569ff0) =>
      getDesktopApi()?.['getUpdateState']?.(..._0x569ff0) ??
      chromeShellPost('/api/v2/desktop/app/update-state', _0x569ff0[0x0]) ??
      Promise['resolve'](null),
    downloadUpdate: (..._0x44d78d) =>
      getDesktopApi()?.['downloadUpdate']?.(..._0x44d78d) ??
      chromeShellPost('/api/v2/desktop/app/download-update', _0x44d78d[0x0]) ??
      Promise['resolve'](null),
    cancelUpdateDownload: (..._0x34e3a7) =>
      getDesktopApi()?.['cancelUpdateDownload']?.(..._0x34e3a7) ??
      chromeShellPost('/api/v2/desktop/app/cancel-update-download', _0x34e3a7[0x0]) ??
      Promise['resolve'](null),
    installDownloadedUpdate: async (..._0x5da028) => {
      return (
        await writeChromeShellRecoverySnapshotBeforeInstall(),
        getDesktopApi()?.['installDownloadedUpdate']?.(..._0x5da028) ??
          chromeShellPost('/api/v2/desktop/app/install-downloaded-update', _0x5da028[0x0]) ??
          null
      );
    },
    onUpdaterEvent: (_0x19aed2) =>
      getDesktopApi()?.['onUpdaterEvent']?.(_0x19aed2) ||
      subscribeToUpdaterState(() => desktopBridge['app']['getUpdateState'](), _0x19aed2),
  },
  project: {
    get api() {
      return getGroup(getElectronApi(), 'project');
    },
    isAvailable() {
      return !!desktopBridge['project']['api'] || desktopBridge['isChromeShell'];
    },
    open: (..._0x24e54c) =>
      desktopBridge['project']['api']?.['open']?.(..._0x24e54c) ??
      chromeShellPost('/api/v2/desktop/project/open', _0x24e54c[0x0]),
    save: (..._0x1598db) =>
      desktopBridge['project']['api']?.['save']?.(..._0x1598db) ??
      chromeShellPost('/api/v2/desktop/project/save', _0x1598db[0x0]),
    exportPackage: (..._0x2ff9a3) =>
      withDeferredMediaFiles(
        _0x2ff9a3,
        () =>
          desktopBridge['project']['api']?.['exportPackage']?.(..._0x2ff9a3) ??
          chromeShellPost('/api/v2/desktop/project/export-package', _0x2ff9a3[0x0]),
      ),
    importPackage: (..._0x51b645) =>
      desktopBridge['project']['api']?.['importPackage']?.(..._0x51b645) ??
      chromeShellPost('/api/v2/desktop/project/import-package', _0x51b645[0x0]),
    listRecent: (..._0x5ab989) =>
      desktopBridge['project']['api']?.['listRecent']?.(..._0x5ab989) ??
      chromeShellPost('/api/v2/desktop/project/list-recent', _0x5ab989[0x0]),
    removeRecent: (..._0x25de45) =>
      desktopBridge['project']['api']?.['removeRecent']?.(..._0x25de45) ??
      chromeShellPost('/api/v2/desktop/project/remove-recent', _0x25de45[0x0]),
    clearRecoverySnapshot: (..._0x517f9e) =>
      desktopBridge['project']['api']?.['clearRecoverySnapshot']?.(..._0x517f9e) ??
      chromeShellPost('/api/v2/desktop/project/clear-recovery-snapshot', _0x517f9e[0x0]),
    writeRecoverySnapshot: (..._0x31b343) =>
      desktopBridge['project']['api']?.['writeRecoverySnapshot']?.(..._0x31b343) ??
      chromeShellPost('/api/v2/desktop/project/write-recovery-snapshot', _0x31b343[0x0]),
    getRecoverySnapshotInfo: (..._0x52441f) =>
      desktopBridge['project']['api']?.['getRecoverySnapshotInfo']?.(..._0x52441f) ??
      chromeShellPost('/api/v2/desktop/project/get-recovery-snapshot-info', _0x52441f[0x0]),
    readRecoverySnapshot: (..._0x204094) =>
      desktopBridge['project']['api']?.['readRecoverySnapshot']?.(..._0x204094) ??
      chromeShellPost('/api/v2/desktop/project/read-recovery-snapshot', _0x204094[0x0]),
    setUnsavedState: (..._0x635f0a) =>
      desktopBridge['project']['api']?.['setUnsavedState']?.(..._0x635f0a) ??
      postChromeShellUnsavedState(_0x635f0a[0x0]),
    consumeExternalOpenRequests: (..._0x562f69) =>
      desktopBridge['project']['api']?.['consumeExternalOpenRequests']?.(..._0x562f69) ??
      chromeShellPost('/api/v2/desktop/project/consume-external-open-requests', _0x562f69[0x0]),
    onExternalOpen: (_0x4cc71c) =>
      desktopBridge['project']['api']?.['onExternalOpen']?.(_0x4cc71c) ||
      subscribeToConsumedBatch(
        () => chromeShellPost('/api/v2/desktop/project/consume-external-open-requests', {}),
        _0x4cc71c,
        { intervalMs: 0x1f4 },
      ),
    onPackageProgress: (_0x311122) =>
      desktopBridge['project']['api']?.['onPackageProgress']?.(_0x311122) ||
      subscribeByPolling(
        () => chromeShellPost('/api/v2/desktop/project/consume-package-progress-events', {}),
        _0x311122,
        {
          intervalMs: 0xfa,
          extractItems: (_0xc69f8d) => (Array['isArray'](_0xc69f8d) ? _0xc69f8d : []),
          getKey: (_0x5c15a8) =>
            String(
              _0x5c15a8?.['createdAt'] || _0x5c15a8?.['operationId'] || JSON['stringify'](_0x5c15a8 || {}),
            ),
        },
      ),
  },
  shell: {
    isAvailable() {
      const _0x2d7ebf = getElectronApi();
      return (
        isFunction(_0x2d7ebf?.['shell']?.['openExternal']) ||
        isFunction(_0x2d7ebf?.['openExternal']) ||
        desktopBridge['isChromeShell']
      );
    },
    canShowItemInFolder() {
      return isFunction(getElectronApi()?.['showItemInFolder']) || desktopBridge['isChromeShell'];
    },
    canOpenKnownFolder() {
      return isFunction(getElectronApi()?.['openKnownFolder']) || desktopBridge['isChromeShell'];
    },
    showItemInFolder: (_0x302839) =>
      getElectronApi()?.['showItemInFolder']?.(_0x302839) ??
      chromeShellPost('/api/v2/desktop/shell/show-item-in-folder', _0x302839) ??
      unavailable('showItemInFolder')(),
    openKnownFolder: (_0x5d11bc) =>
      getElectronApi()?.['openKnownFolder']?.(_0x5d11bc) ??
      chromeShellPost('/api/v2/desktop/shell/open-known-folder', _0x5d11bc) ??
      unavailable('openKnownFolder')(),
    openExternal(_0x5e1005) {
      const _0xda1bd4 = getElectronApi()?.['shell']?.['openExternal'] || getElectronApi()?.['openExternal'];
      if (isFunction(_0xda1bd4)) return _0xda1bd4(_0x5e1005);
      const _0x963a1d = chromeShellPost('/api/v2/desktop/shell/open-external', { url: _0x5e1005 });
      if (_0x963a1d) return _0x963a1d;
      if (typeof globalThis['open'] === 'function')
        return (
          globalThis['open'](String(_0x5e1005 || ''), '_blank', 'noopener,noreferrer'),
          Promise['resolve']({ ok: !![], fallback: 'browser' })
        );
      return Promise['resolve']({ ok: ![], error: 'openExternal\x20unavailable' });
    },
  },
  mediaPreview: {
    isAvailable() {
      return isFunction(getElectronApi()?.['getLocalPreviewUrl']) || desktopBridge['isChromeShell'];
    },
    async getLocalPreviewUrl(_0x3ef41 = {}) {
      const _0xdd385f = deferredMediaPreview(_0x3ef41);
      if (_0xdd385f) return _0xdd385f;
      const _0x2ef30d = getElectronApi()?.['getLocalPreviewUrl'];
      if (isFunction(_0x2ef30d)) return _0x2ef30d(_0x3ef41);
      if (!desktopBridge['isChromeShell']) throw new Error('Local preview bridge unavailable');
      return postDesktopBridge('/api/v2/desktop/local-preview', _0x3ef41);
    },
  },
  assetImport: {
    isAvailable() {
      return !!getElectronApi() || desktopBridge['isChromeShell'];
    },
    canImportAsset() {
      return isFunction(getElectronApi()?.['importAsset']) || desktopBridge['isChromeShell'];
    },
    canImportRemoteAsset() {
      return isFunction(getElectronApi()?.['importRemoteAsset']) || desktopBridge['isChromeShell'];
    },
    canImportLocalFile() {
      return isFunction(getElectronApi()?.['importLocalFile']) || desktopBridge['isChromeShell'];
    },
    canResolveFilePath() {
      return !!getElectronApi() || desktopBridge['isChromeShell'];
    },
    canSubscribeUpdates() {
      return isFunction(getElectronApi()?.['onAssetUpdated']) || desktopBridge['isChromeShell'];
    },
    importAsset: (..._0x1f5c1b) =>
      withDeferredMediaFiles(
        _0x1f5c1b,
        () =>
          getElectronApi()?.['importAsset']?.(..._0x1f5c1b) ??
          chromeShellPost('/api/v2/desktop/asset/import', _0x1f5c1b[0x0]),
      ),
    importRemoteAsset: (..._0xdb817f) =>
      withDeferredMediaFiles(
        _0xdb817f,
        () =>
          getElectronApi()?.['importRemoteAsset']?.(..._0xdb817f) ??
          chromeShellPost('/api/v2/desktop/asset/import-remote', _0xdb817f[0x0]),
      ),
    importLocalFile: (..._0xaea58f) =>
      withDeferredMediaFiles(
        _0xaea58f,
        () =>
          getElectronApi()?.['importLocalFile']?.(..._0xaea58f) ??
          chromeShellPost('/api/v2/desktop/file/import-local', _0xaea58f[0x0]),
      ),
    getPathForFile: (..._0x4b0b73) => getElectronApi()?.['getPathForFile']?.(..._0x4b0b73) || '',
    onAssetUpdated: (_0x43a8fe) =>
      getElectronApi()?.['onAssetUpdated']?.(_0x43a8fe) ||
      subscribeByPolling(() => chromeShellPost('/api/v2/desktop/asset/consume-updates', {}), _0x43a8fe, {
        intervalMs: 0x1f4,
        extractItems: (_0x211983) => (Array['isArray'](_0x211983) ? _0x211983 : []),
        getKey: (_0x5944b3) => String(_0x5944b3?.['assetId'] || JSON['stringify'](_0x5944b3 || {})),
      }),
  },
  dialog: {
    isAvailable() {
      return isFunction(getElectronApi()?.['selectDirectory']) || desktopBridge['isChromeShell'];
    },
    selectDirectory: (..._0x4a4b8f) =>
      getElectronApi()?.['selectDirectory']?.(..._0x4a4b8f) ??
      chromeShellPost('/api/v2/desktop/dialog/select-directory', _0x4a4b8f[0x0]),
  },
  webPreview: {
    get api() {
      return getGroup(getElectronApi(), 'webPreview');
    },
    get surfaceMode() {
      return (
        desktopBridge['webPreview']['api']?.['surfaceMode'] ||
        (desktopBridge['isChromeShell'] ? 'remote-snapshot' : '')
      );
    },
    isAvailable() {
      return isFunction(desktopBridge['webPreview']['api']?.['syncViews']) || desktopBridge['isChromeShell'];
    },
    syncViews: (..._0x1ef41b) =>
      desktopBridge['webPreview']['api']?.['syncViews']?.(..._0x1ef41b) ??
      chromeShellPost('/api/v2/desktop/web-preview/sync-views', _0x1ef41b[0x0]),
    syncViewsFast: (..._0x67de14) =>
      desktopBridge['webPreview']['api']?.['syncViewsFast']?.(..._0x67de14) ??
      desktopBridge['webPreview']['api']?.['syncViews']?.(..._0x67de14) ??
      syncChromeShellWebPreviewViews(_0x67de14[0x0]),
    disposeViews: (..._0xd60f91) =>
      desktopBridge['webPreview']['api']?.['disposeViews']?.(..._0xd60f91) ??
      chromeShellPost('/api/v2/desktop/web-preview/dispose-views', _0xd60f91[0x0]),
    controlView: (..._0xedd6e7) =>
      desktopBridge['webPreview']['api']?.['controlView']?.(..._0xedd6e7) ??
      chromeShellPost('/api/v2/desktop/web-preview/control-view', _0xedd6e7[0x0]),
    onEvent: (_0x3362e9) =>
      desktopBridge['webPreview']['api']?.['onEvent']?.(_0x3362e9) ||
      subscribeByLongPolling(
        () => chromeShellPost('/api/v2/desktop/web-preview/wait-events', { waitMs: 0x3e8 }),
        _0x3362e9,
      ),
  },
  customAiApps: {
    get api() {
      return getGroup(getElectronApi(), 'customAiApps');
    },
    isAvailable() {
      return !!desktopBridge['customAiApps']['api'] || desktopBridge['isChromeShell'];
    },
    read: (..._0x3a4420) =>
      desktopBridge['customAiApps']['api']?.['read']?.(..._0x3a4420) ??
      chromeShellPost('/api/v2/desktop/custom-ai-apps/read', _0x3a4420[0x0]),
    write: (..._0x421456) =>
      desktopBridge['customAiApps']['api']?.['write']?.(..._0x421456) ??
      chromeShellPost('/api/v2/desktop/custom-ai-apps/write', _0x421456[0x0]),
  },
  agentSkills: {
    get api() {
      return getGroup(getElectronApi(), 'agentSkills');
    },
    isAvailable() {
      return !!desktopBridge['agentSkills']['api'] || desktopBridge['isChromeShell'];
    },
    list: (..._0x507082) =>
      desktopBridge['agentSkills']['api']?.['list']?.(..._0x507082) ??
      chromeShellPostOperationResult('/api/v2/desktop/agent-skills/list', _0x507082[0x0]),
    openRoot: (..._0x42fce3) =>
      desktopBridge['agentSkills']['api']?.['openRoot']?.(..._0x42fce3) ??
      chromeShellPostOperationResult('/api/v2/desktop/agent-skills/open-root', _0x42fce3[0x0]),
    installFromFolder: (..._0x33edfc) =>
      desktopBridge['agentSkills']['api']?.['installFromFolder']?.(..._0x33edfc) ??
      chromeShellPostOperationResult('/api/v2/desktop/agent-skills/install-folder', _0x33edfc[0x0]),
    saveManaged: (..._0x21e257) =>
      desktopBridge['agentSkills']['api']?.['saveManaged']?.(..._0x21e257) ??
      chromeShellPostOperationResult('/api/v2/desktop/agent-skills/save-managed', _0x21e257[0x0]),
    deleteInstalled: (..._0x281f33) =>
      desktopBridge['agentSkills']['api']?.['deleteInstalled']?.(..._0x281f33) ??
      chromeShellPostOperationResult('/api/v2/desktop/agent-skills/delete-installed', _0x281f33[0x0]),
  },
  agentInformation: {
    get api() {
      return getGroup(getElectronApi(), 'agentInformation');
    },
    isAvailable() {
      return !!desktopBridge['agentInformation']['api'] || desktopBridge['isChromeShell'];
    },
    readUrl: (..._0xe3caa0) =>
      desktopBridge['agentInformation']['api']?.['readUrl']?.(..._0xe3caa0) ??
      chromeShellPostOperationResult('/api/v2/desktop/agent-information/read-url', _0xe3caa0[0x0]),
  },
  storageMigration: {
    isAvailable() {
      return desktopBridge['isChromeShell'];
    },
    read: () => chromeShellPost('/api/v2/desktop/storage-migration/read', {}),
    complete: (_0x3f8791) => chromeShellPost('/api/v2/desktop/storage-migration/complete', _0x3f8791),
  },
  secureSettings: {
    get api() {
      return getGroup(getElectronApi(), 'secureSettings');
    },
    get: (..._0x5aa77c) =>
      desktopBridge['secureSettings']['api']?.['get']?.(..._0x5aa77c) ??
      chromeShellPost('/api/v2/desktop/secure-settings/get', _0x5aa77c[0x0]),
    set: (..._0x27d3a9) =>
      desktopBridge['secureSettings']['api']?.['set']?.(..._0x27d3a9) ??
      chromeShellPost('/api/v2/desktop/secure-settings/set', _0x27d3a9[0x0]),
    delete: (..._0x3e02cb) =>
      desktopBridge['secureSettings']['api']?.['delete']?.(..._0x3e02cb) ??
      chromeShellPost('/api/v2/desktop/secure-settings/delete', _0x3e02cb[0x0]),
  },
  mediaTask: {
    get api() {
      return getGroup(getElectronApi(), 'mediaTask');
    },
    isAvailable() {
      return !!desktopBridge['mediaTask']['api'] || desktopBridge['isChromeShell'];
    },
    enqueue: (..._0x1ab65c) =>
      withDeferredMediaFiles(
        _0x1ab65c,
        () =>
          desktopBridge['mediaTask']['api']?.['enqueue']?.(..._0x1ab65c) ??
          chromeShellPost('/api/v2/desktop/media-task/enqueue', _0x1ab65c[0x0]),
      ),
    cancel: (..._0x5dcb6b) =>
      desktopBridge['mediaTask']['api']?.['cancel']?.(..._0x5dcb6b) ??
      chromeShellPost('/api/v2/desktop/media-task/cancel', _0x5dcb6b[0x0]),
    list: (..._0x1d474c) =>
      desktopBridge['mediaTask']['api']?.['list']?.(..._0x1d474c) ??
      chromeShellPost('/api/v2/desktop/media-task/list', _0x1d474c[0x0]),
    onUpdate: (_0x59a0b7) =>
      desktopBridge['mediaTask']['api']?.['onUpdate']?.(_0x59a0b7) ||
      subscribeByPolling(() => desktopBridge['mediaTask']['list']({ limit: 0x78 }), _0x59a0b7, {
        intervalMs: 0x3e8,
        extractItems: (_0x1a43e2) =>
          Array['isArray'](_0x1a43e2?.['tasks'])
            ? _0x1a43e2['tasks']
            : Array['isArray'](_0x1a43e2)
              ? _0x1a43e2
              : [],
        getKey: (_0xbf1e4c) => String(_0xbf1e4c?.['taskId'] || JSON['stringify'](_0xbf1e4c || {})),
      }),
  },
  diagnostics: {
    get api() {
      return getGroup(getElectronApi(), 'diagnostics');
    },
    isAvailable() {
      return !!desktopBridge['diagnostics']['api'] || desktopBridge['isChromeShell'];
    },
    logEvent: (..._0x1674b2) =>
      desktopBridge['diagnostics']['api']?.['logEvent']?.(..._0x1674b2) ??
      chromeShellPost('/api/v2/desktop/diagnostics/log-event', _0x1674b2[0x0]),
    createPackage: (..._0x3e07ee) =>
      desktopBridge['diagnostics']['api']?.['createPackage']?.(..._0x3e07ee) ??
      chromeShellPost('/api/v2/desktop/diagnostics/create-package', _0x3e07ee[0x0]),
    openLogsFolder: (..._0x2ada03) =>
      desktopBridge['diagnostics']['api']?.['openLogsFolder']?.(..._0x2ada03) ??
      chromeShellPost('/api/v2/desktop/diagnostics/open-logs-folder', _0x2ada03[0x0]),
  },
  nodeExport: {
    openJianying: () =>
      desktopBridge['nodeExport']['api']?.['openJianying']?.() ??
      chromeShellPost('/api/v2/desktop/node-export/open-jianying', {}) ??
      unavailable('nodeExport.openJianying')(),
    saveTimeline: (..._0x57c15e) =>
      withDeferredMediaFiles(
        _0x57c15e,
        () =>
          desktopBridge['nodeExport']['api']?.['saveTimeline']?.(..._0x57c15e) ??
          chromeShellPost('/api/v2/desktop/node-export/save-timeline', _0x57c15e[0x0]) ??
          unavailable('nodeExport.saveTimeline')(),
      ),
    get api() {
      return getGroup(getElectronApi(), 'nodeExport');
    },
    isAvailable() {
      return (
        isFunction(desktopBridge['nodeExport']['api']?.['exportSelected']) ||
        isFunction(desktopBridge['nodeExport']['api']?.['saveMedia']) ||
        isFunction(desktopBridge['nodeExport']['api']?.['saveText']) ||
        isFunction(desktopBridge['nodeExport']['api']?.['saveMediaFiles']) ||
        isFunction(desktopBridge['nodeExport']['api']?.['saveTimeline']) ||
        desktopBridge['isChromeShell']
      );
    },
    canSaveMedia() {
      return isFunction(desktopBridge['nodeExport']['api']?.['saveMedia']) || desktopBridge['isChromeShell'];
    },
    canSaveText() {
      return isFunction(desktopBridge['nodeExport']['api']?.['saveText']) || desktopBridge['isChromeShell'];
    },
    canSaveMediaFiles() {
      return (
        isFunction(desktopBridge['nodeExport']['api']?.['saveMediaFiles']) || desktopBridge['isChromeShell']
      );
    },
    exportSelected: (..._0x2c79e9) =>
      withDeferredMediaFiles(
        _0x2c79e9,
        () =>
          desktopBridge['nodeExport']['api']?.['exportSelected']?.(..._0x2c79e9) ??
          chromeShellPost('/api/v2/desktop/node-export/export-selected', _0x2c79e9[0x0]) ??
          unavailable('nodeExport.exportSelected')(),
      ),
    saveMedia: (..._0x2e1916) =>
      withDeferredMediaFiles(
        _0x2e1916,
        () =>
          desktopBridge['nodeExport']['api']?.['saveMedia']?.(..._0x2e1916) ??
          chromeShellPost('/api/v2/desktop/node-export/save-media', _0x2e1916[0x0]) ??
          unavailable('nodeExport.saveMedia')(),
      ),
    saveText: (..._0xb014a7) =>
      desktopBridge['nodeExport']['api']?.['saveText']?.(..._0xb014a7) ??
      chromeShellPost('/api/v2/desktop/node-export/save-text', _0xb014a7[0x0]) ??
      unavailable('nodeExport.saveText')(),
    saveMediaFiles: (..._0x74ca19) =>
      withDeferredMediaFiles(
        _0x74ca19,
        () =>
          desktopBridge['nodeExport']['api']?.['saveMediaFiles']?.(..._0x74ca19) ??
          chromeShellPost('/api/v2/desktop/node-export/save-media-files', _0x74ca19[0x0]) ??
          unavailable('nodeExport.saveMediaFiles')(),
      ),
  },
  notification: {
    get api() {
      return getGroup(getElectronApi(), 'notification');
    },
    isAvailable() {
      return (
        isFunction(desktopBridge['notification']['api']?.['showGenerationComplete']) ||
        desktopBridge['isChromeShell']
      );
    },
    updateGlobalShortcut: (_0xcc1bba) =>
      desktopBridge['notification']['api']?.['updateGlobalShortcut']?.(_0xcc1bba) ??
      chromeShellPost('/api/v2/desktop/notification/update-global-shortcut', _0xcc1bba),
    acknowledge: (_0x23581f) =>
      desktopBridge['notification']['api']?.['acknowledge']?.(_0x23581f) ??
      chromeShellPost('/api/v2/desktop/notification/acknowledge', _0x23581f),
    showGenerationComplete: (..._0x3f1de9) =>
      desktopBridge['notification']['api']?.['showGenerationComplete']?.(..._0x3f1de9) ??
      chromeShellPost('/api/v2/desktop/notification/show-generation-complete', _0x3f1de9[0x0]) ??
      Promise['resolve']({ success: !![], shown: ![], reason: 'unavailable' }),
    onGenerationCompleteClick: (_0x2c8011) =>
      desktopBridge['notification']['api']?.['onGenerationCompleteClick']?.(_0x2c8011) ||
      subscribeByPolling(
        () => chromeShellPost('/api/v2/desktop/notification/consume-generation-complete-clicks', {}),
        _0x2c8011,
        {
          intervalMs: 0x190,
          extractItems: (_0x406f41) => (Array['isArray'](_0x406f41) ? _0x406f41 : []),
          getKey: (_0x4c1d31) =>
            String(_0x4c1d31?.['eventId'] || _0x4c1d31?.['createdAt'] || JSON['stringify'](_0x4c1d31 || {})),
        },
      ),
  },
  screenshot: {
    get api() {
      return getGroup(getElectronApi(), 'screenshot');
    },
    isAvailable() {
      return !!desktopBridge['screenshot']['api'] || desktopBridge['isChromeShell'];
    },
    captureDisplay: (..._0x270fcc) =>
      desktopBridge['screenshot']['api']?.['captureDisplay']?.(..._0x270fcc) ??
      chromeShellPost('/api/v2/desktop/screenshot/capture-display', _0x270fcc[0x0]),
    updateGlobalShortcut: (..._0xc6f4c3) =>
      desktopBridge['screenshot']['api']?.['updateGlobalShortcut']?.(..._0xc6f4c3) ??
      chromeShellPost('/api/v2/desktop/screenshot/update-global-shortcut', _0xc6f4c3[0x0]),
    onGlobalCapture: (_0x1a2017) =>
      desktopBridge['screenshot']['api']?.['onGlobalCapture']?.(_0x1a2017) ||
      subscribeByPolling(
        () => chromeShellPost('/api/v2/desktop/screenshot/consume-global-capture-events', {}),
        _0x1a2017,
        {
          intervalMs: 0x96,
          extractItems: (_0x35fa3a) => (Array['isArray'](_0x35fa3a) ? _0x35fa3a : []),
          getKey: (_0x2520ae) =>
            String(_0x2520ae?.['createdAt'] || _0x2520ae?.['source'] || JSON['stringify'](_0x2520ae || {})),
        },
      ),
    onGlobalShortcutStatus: (_0x313afd) =>
      desktopBridge['screenshot']['api']?.['onGlobalShortcutStatus']?.(_0x313afd) ||
      subscribeByPolling(
        () => chromeShellPost('/api/v2/desktop/screenshot/get-global-shortcut-status', {}),
        _0x313afd,
        { intervalMs: 0x3e8, getKey: () => 'global-shortcut-status' },
      ),
  },
  textPreset: {
    get api() {
      return getGroup(getElectronApi(), 'textPreset');
    },
    isAvailable() {
      return !!desktopBridge['textPreset']['api'] || desktopBridge['isChromeShell'];
    },
    updateGlobalShortcut: (..._0x135234) =>
      desktopBridge['textPreset']['api']?.['updateGlobalShortcut']?.(..._0x135234) ??
      chromeShellPost('/api/v2/desktop/text-preset/update-global-shortcut', _0x135234[0x0]),
    claimEvent: (_0x2d29ae) =>
      desktopBridge['textPreset']['api']?.['claimEvent']?.(_0x2d29ae) ??
      chromeShellPost('/api/v2/desktop/text-preset/claim-event', _0x2d29ae),
    acknowledgeEvent: (_0xde4d5a) =>
      desktopBridge['textPreset']['api']?.['acknowledgeEvent']?.(_0xde4d5a) ??
      chromeShellPost('/api/v2/desktop/text-preset/acknowledge-event', _0xde4d5a),
    onSelectedText: (_0x2e5533) =>
      desktopBridge['textPreset']['api']?.['onSelectedText']?.(_0x2e5533) ||
      subscribeToConsumedBatch(
        () => chromeShellPost('/api/v2/desktop/text-preset/consume-events', {}),
        (_0x43a6fa) => _0x43a6fa['forEach']((_0x475681) => _0x2e5533(_0x475681)),
        { intervalMs: 0x96 },
      ),
    onGlobalShortcutStatus: (_0x2df59e) =>
      desktopBridge['textPreset']['api']?.['onGlobalShortcutStatus']?.(_0x2df59e) ||
      subscribeByPolling(
        () => chromeShellPost('/api/v2/desktop/text-preset/get-global-shortcut-status', {}),
        _0x2df59e,
        { intervalMs: 0x3e8, getKey: () => 'global-text-preset-shortcut-status' },
      ),
  },
  notificationSound: {
    get api() {
      return getGroup(getElectronApi() || getWindowObject()?.['electronAPI'], 'notificationSound');
    },
    isAvailable() {
      return !!desktopBridge['notificationSound']['api'] || desktopBridge['isChromeShell'];
    },
    listMp3Files: (..._0x5b762b) =>
      desktopBridge['notificationSound']['api']?.['listMp3Files']?.(..._0x5b762b) ??
      chromeShellPost('/api/v2/desktop/notification-sound/list-mp3-files', _0x5b762b[0x0]),
    listSystemSounds: (..._0x5b3c57) =>
      desktopBridge['notificationSound']['api']?.['listSystemSounds']?.(..._0x5b3c57) ??
      chromeShellPost('/api/v2/desktop/notification-sound/list-system-sounds', _0x5b3c57[0x0]),
    openSystemSoundFolder: (..._0x41dd6c) =>
      desktopBridge['notificationSound']['api']?.['openSystemSoundFolder']?.(..._0x41dd6c) ??
      chromeShellPost('/api/v2/desktop/notification-sound/open-system-sound-folder', _0x41dd6c[0x0]),
    play: (..._0x3283d8) =>
      desktopBridge['notificationSound']['api']?.['play']?.(..._0x3283d8) ??
      chromeShellPost('/api/v2/desktop/notification-sound/play', _0x3283d8[0x0]),
  },
  localAssetCleanup: {
    get api() {
      return getGroup(getElectronApi(), 'localAssetCleanup');
    },
    isAvailable() {
      return !!desktopBridge['localAssetCleanup']['api'] || desktopBridge['isChromeShell'];
    },
    scan: (..._0x1ce693) =>
      desktopBridge['localAssetCleanup']['api']?.['scan']?.(..._0x1ce693) ??
      chromeShellPost('/api/v2/desktop/local-asset-cleanup/scan', _0x1ce693[0x0]),
    trash: (..._0x2db8f7) =>
      desktopBridge['localAssetCleanup']['api']?.['trash']?.(..._0x2db8f7) ??
      chromeShellPost('/api/v2/desktop/local-asset-cleanup/trash', _0x2db8f7[0x0]),
  },
  clipboard: {
    get api() {
      return getGroup(getElectronApi(), 'clipboard');
    },
    canUseImages() {
      return (
        isFunction(desktopBridge['clipboard']['api']?.['writeImage']) ||
        isFunction(desktopBridge['clipboard']['api']?.['readImage']) ||
        desktopBridge['isChromeShell']
      );
    },
    canUseFiles() {
      return !!desktopBridge['clipboard']['api'] || desktopBridge['isChromeShell'];
    },
    canUseText() {
      return !!desktopBridge['clipboard']['api'] || desktopBridge['isChromeShell'];
    },
    writeImage: (..._0x15fe3b) => desktopBridge['clipboard']['api']?.['writeImage']?.(..._0x15fe3b),
    readImage: (..._0x575f0a) =>
      desktopBridge['clipboard']['api']?.['readImage']?.(..._0x575f0a) ??
      chromeShellPost('/api/v2/desktop/clipboard/read-image'),
    writeFileReferences: (..._0x32bb9d) =>
      desktopBridge['clipboard']['api']?.['writeFileReferences']?.(..._0x32bb9d) ??
      chromeShellPost('/api/v2/desktop/clipboard/write-file-references', _0x32bb9d[0x0]),
    readFileReferences: (..._0x15258a) =>
      desktopBridge['clipboard']['api']?.['readFileReferences']?.(..._0x15258a) ??
      chromeShellPost('/api/v2/desktop/clipboard/read-file-references', _0x15258a[0x0]),
    writeText: (..._0x38fe42) =>
      desktopBridge['clipboard']['api']?.['writeText']?.(..._0x38fe42) ??
      chromeShellPost('/api/v2/desktop/clipboard/write-text', _0x38fe42[0x0]),
    readText: (..._0x3dbf02) =>
      desktopBridge['clipboard']['api']?.['readText']?.(..._0x3dbf02) ??
      chromeShellPost('/api/v2/desktop/clipboard/read-text', _0x3dbf02[0x0]),
  },
  canvasVisualSnapshot: {
    get api() {
      return getGroup(getElectronApi(), 'canvasVisualSnapshot');
    },
    isAvailable() {
      return isFunction(desktopBridge['canvasVisualSnapshot']['api']?.['capturePage']);
    },
    capturePage: (..._0x6bd9fa) =>
      desktopBridge['canvasVisualSnapshot']['api']?.['capturePage']?.(..._0x6bd9fa),
  },
};
export function installDesktopBridgeCompat() {
  const _0x261593 = getWindowObject();
  if (
    !_0x261593 ||
    !desktopBridge['isChromeShell'] ||
    _0x261593['electronAPI'] ||
    _0x261593['aiCanvasDesktop']
  )
    return ![];
  return (
    (_0x261593['__AIC_CHROME_SHELL__'] = !![]),
    (_0x261593['aiCanvasDesktop'] = {
      __aicDesktopHttpShim: !![],
      isElectron: ![],
      getAppVersion: (_0x41f792) => chromeShellPost('/api/v2/desktop/app/get-version', _0x41f792),
      getDeviceId: (_0x65e347) => chromeShellPost('/api/v2/desktop/app/get-device-id', _0x65e347),
      checkForUpdates: (_0x22fffa) => chromeShellPost('/api/v2/desktop/app/check-for-updates', _0x22fffa),
      getUpdateState: (_0x4c28c0) => chromeShellPost('/api/v2/desktop/app/update-state', _0x4c28c0),
      downloadUpdate: (_0x20a5ec) => chromeShellPost('/api/v2/desktop/app/download-update', _0x20a5ec),
      cancelUpdateDownload: (_0x185229) =>
        chromeShellPost('/api/v2/desktop/app/cancel-update-download', _0x185229),
      installDownloadedUpdate: async (_0x452144) => {
        return (
          await writeChromeShellRecoverySnapshotBeforeInstall(),
          chromeShellPost('/api/v2/desktop/app/install-downloaded-update', _0x452144)
        );
      },
      onUpdaterEvent: (_0x50e51d) =>
        subscribeToUpdaterState(() => chromeShellPost('/api/v2/desktop/app/update-state', {}), _0x50e51d),
    }),
    (_0x261593['electronAPI'] = {
      __aicDesktopHttpShim: !![],
      project: {
        open: (_0x345b15) => chromeShellPost('/api/v2/desktop/project/open', _0x345b15),
        save: (_0x2dd9af) => chromeShellPost('/api/v2/desktop/project/save', _0x2dd9af),
        exportPackage: (_0x53b83e) => chromeShellPost('/api/v2/desktop/project/export-package', _0x53b83e),
        importPackage: (_0x38dc2e) => chromeShellPost('/api/v2/desktop/project/import-package', _0x38dc2e),
        listRecent: (_0x3491cc) => chromeShellPost('/api/v2/desktop/project/list-recent', _0x3491cc),
        removeRecent: (_0x5a22c4) => chromeShellPost('/api/v2/desktop/project/remove-recent', _0x5a22c4),
        setUnsavedState: (_0x43a0db) => postChromeShellUnsavedState(_0x43a0db),
        writeRecoverySnapshot: (_0x5c9632) =>
          chromeShellPost('/api/v2/desktop/project/write-recovery-snapshot', _0x5c9632),
        getRecoverySnapshotInfo: (_0x5197f3) =>
          chromeShellPost('/api/v2/desktop/project/get-recovery-snapshot-info', _0x5197f3),
        readRecoverySnapshot: (_0x49397d) =>
          chromeShellPost('/api/v2/desktop/project/read-recovery-snapshot', _0x49397d),
        clearRecoverySnapshot: (_0x214ada) =>
          chromeShellPost('/api/v2/desktop/project/clear-recovery-snapshot', _0x214ada),
        consumeExternalOpenRequests: (_0x57fe35) =>
          chromeShellPost('/api/v2/desktop/project/consume-external-open-requests', _0x57fe35),
        onExternalOpen: (_0x91103a) =>
          subscribeToConsumedBatch(
            () => chromeShellPost('/api/v2/desktop/project/consume-external-open-requests', {}),
            _0x91103a,
            { intervalMs: 0x1f4 },
          ),
        onPackageProgress: (_0x4b9a4b) =>
          subscribeByPolling(
            () => chromeShellPost('/api/v2/desktop/project/consume-package-progress-events', {}),
            _0x4b9a4b,
            {
              intervalMs: 0xfa,
              extractItems: (_0x578159) => (Array['isArray'](_0x578159) ? _0x578159 : []),
              getKey: (_0x7bd33b) =>
                String(
                  _0x7bd33b?.['createdAt'] ||
                    _0x7bd33b?.['operationId'] ||
                    JSON['stringify'](_0x7bd33b || {}),
                ),
            },
          ),
      },
      importAsset: (_0x1444b9) => chromeShellPost('/api/v2/desktop/asset/import', _0x1444b9),
      importRemoteAsset: (_0x194d82) => chromeShellPost('/api/v2/desktop/asset/import-remote', _0x194d82),
      importLocalFile: (_0x3c40ac) => chromeShellPost('/api/v2/desktop/file/import-local', _0x3c40ac),
      getPathForFile: (_0x12f03e) => String(_0x12f03e?.['path'] || ''),
      getLocalPreviewUrl: (_0x556c35) => postDesktopBridge('/api/v2/desktop/local-preview', _0x556c35),
      selectDirectory: (_0x4b1049) => chromeShellPost('/api/v2/desktop/dialog/select-directory', _0x4b1049),
      showItemInFolder: (_0x5b04fc) =>
        chromeShellPost('/api/v2/desktop/shell/show-item-in-folder', _0x5b04fc),
      openKnownFolder: (_0x462b5f) => chromeShellPost('/api/v2/desktop/shell/open-known-folder', _0x462b5f),
      openExternal: (_0x80ce35) => chromeShellPost('/api/v2/desktop/shell/open-external', { url: _0x80ce35 }),
      shell: {
        openExternal: (_0x53828b) =>
          chromeShellPost('/api/v2/desktop/shell/open-external', { url: _0x53828b }),
      },
      webPreview: {
        surfaceMode: 'remote-snapshot',
        syncViews: (_0x1defb2) => chromeShellPost('/api/v2/desktop/web-preview/sync-views', _0x1defb2),
        syncViewsFast: (_0x1d4455) => syncChromeShellWebPreviewViews(_0x1d4455),
        disposeViews: (_0x187539) => chromeShellPost('/api/v2/desktop/web-preview/dispose-views', _0x187539),
        controlView: (_0x5a84b1) => chromeShellPost('/api/v2/desktop/web-preview/control-view', _0x5a84b1),
        onEvent: (_0x213a20) =>
          subscribeByLongPolling(
            () => chromeShellPost('/api/v2/desktop/web-preview/wait-events', { waitMs: 0x3e8 }),
            _0x213a20,
          ),
      },
      secureSettings: {
        get: (_0x4fc265) => chromeShellPost('/api/v2/desktop/secure-settings/get', _0x4fc265),
        set: (_0x1dc092) => chromeShellPost('/api/v2/desktop/secure-settings/set', _0x1dc092),
        delete: (_0x1d4a44) => chromeShellPost('/api/v2/desktop/secure-settings/delete', _0x1d4a44),
      },
      customAiApps: {
        read: (_0x21bb68) => chromeShellPost('/api/v2/desktop/custom-ai-apps/read', _0x21bb68),
        write: (_0x34302c) => chromeShellPost('/api/v2/desktop/custom-ai-apps/write', _0x34302c),
      },
      agentInformation: {
        readUrl: (_0x20a044) => chromeShellPost('/api/v2/desktop/agent-information/read-url', _0x20a044),
      },
      mediaTask: {
        enqueue: (_0x5bef54) => chromeShellPost('/api/v2/desktop/media-task/enqueue', _0x5bef54),
        cancel: (_0x2f25ae) => chromeShellPost('/api/v2/desktop/media-task/cancel', _0x2f25ae),
        list: (_0x1ef4e9) => chromeShellPost('/api/v2/desktop/media-task/list', _0x1ef4e9),
        onUpdate: (_0x346f84) =>
          subscribeByPolling(
            () => chromeShellPost('/api/v2/desktop/media-task/list', { limit: 0x78 }),
            _0x346f84,
            {
              intervalMs: 0x3e8,
              extractItems: (_0xafeff5) =>
                Array['isArray'](_0xafeff5?.['tasks'])
                  ? _0xafeff5['tasks']
                  : Array['isArray'](_0xafeff5)
                    ? _0xafeff5
                    : [],
              getKey: (_0x40033b) => String(_0x40033b?.['taskId'] || JSON['stringify'](_0x40033b || {})),
            },
          ),
      },
      diagnostics: {
        logEvent: (_0x1704e2) => desktopBridge['diagnostics']['logEvent'](_0x1704e2),
        createPackage: (_0x36815b) => desktopBridge['diagnostics']['createPackage'](_0x36815b),
        openLogsFolder: (_0x299c0f) => desktopBridge['diagnostics']['openLogsFolder'](_0x299c0f),
      },
      notification: {
        showGenerationComplete: (_0x12a685) =>
          desktopBridge['notification']['showGenerationComplete'](_0x12a685),
        onGenerationCompleteClick: (_0x51579c) =>
          desktopBridge['notification']['onGenerationCompleteClick'](_0x51579c),
      },
      notificationSound: {
        listMp3Files: (_0x1f8b65) =>
          chromeShellPost('/api/v2/desktop/notification-sound/list-mp3-files', _0x1f8b65),
        listSystemSounds: (_0x519463) =>
          chromeShellPost('/api/v2/desktop/notification-sound/list-system-sounds', _0x519463),
        openSystemSoundFolder: (_0x234bff) =>
          chromeShellPost('/api/v2/desktop/notification-sound/open-system-sound-folder', _0x234bff),
        play: (_0x173680) => chromeShellPost('/api/v2/desktop/notification-sound/play', _0x173680),
      },
      localAssetCleanup: {
        scan: (_0x121f70) => chromeShellPost('/api/v2/desktop/local-asset-cleanup/scan', _0x121f70),
        trash: (_0x79c71b) => chromeShellPost('/api/v2/desktop/local-asset-cleanup/trash', _0x79c71b),
      },
      nodeExport: {
        exportSelected: (_0x4da22b) =>
          chromeShellPost('/api/v2/desktop/node-export/export-selected', _0x4da22b),
        saveMedia: (_0x29b744) => chromeShellPost('/api/v2/desktop/node-export/save-media', _0x29b744),
        saveText: (_0x38b5a4) => chromeShellPost('/api/v2/desktop/node-export/save-text', _0x38b5a4),
        saveMediaFiles: (_0x12f998) =>
          chromeShellPost('/api/v2/desktop/node-export/save-media-files', _0x12f998),
        saveTimeline: (_0x528ba1) => chromeShellPost('/api/v2/desktop/node-export/save-timeline', _0x528ba1),
        openJianying: () => chromeShellPost('/api/v2/desktop/node-export/open-jianying', {}),
      },
      screenshot: {
        captureDisplay: (_0x4e8c14) =>
          chromeShellPost('/api/v2/desktop/screenshot/capture-display', _0x4e8c14),
        updateGlobalShortcut: (_0xac9927) =>
          chromeShellPost('/api/v2/desktop/screenshot/update-global-shortcut', _0xac9927),
        onGlobalCapture: (_0x36311a) =>
          subscribeByPolling(
            () => chromeShellPost('/api/v2/desktop/screenshot/consume-global-capture-events', {}),
            _0x36311a,
            {
              intervalMs: 0x96,
              extractItems: (_0x407393) => (Array['isArray'](_0x407393) ? _0x407393 : []),
              getKey: (_0x37bf84) =>
                String(
                  _0x37bf84?.['createdAt'] || _0x37bf84?.['source'] || JSON['stringify'](_0x37bf84 || {}),
                ),
            },
          ),
        onGlobalShortcutStatus: (_0x2ae003) =>
          subscribeByPolling(
            () => chromeShellPost('/api/v2/desktop/screenshot/get-global-shortcut-status', {}),
            _0x2ae003,
            { intervalMs: 0x3e8, getKey: () => 'global-shortcut-status' },
          ),
      },
      textPreset: {
        claimEvent: (_0x5797fd) => chromeShellPost('/api/v2/desktop/text-preset/claim-event', _0x5797fd),
        acknowledgeEvent: (_0x44b876) =>
          chromeShellPost('/api/v2/desktop/text-preset/acknowledge-event', _0x44b876),
        updateGlobalShortcut: (_0x281a90) =>
          chromeShellPost('/api/v2/desktop/text-preset/update-global-shortcut', _0x281a90),
        onSelectedText: (_0x36db97) =>
          subscribeToConsumedBatch(
            () => chromeShellPost('/api/v2/desktop/text-preset/consume-events', {}),
            (_0x2f7ef5) => _0x2f7ef5['forEach']((_0x16dc0d) => _0x36db97(_0x16dc0d)),
            { intervalMs: 0x96 },
          ),
        onGlobalShortcutStatus: (_0x42004c) =>
          subscribeByPolling(
            () => chromeShellPost('/api/v2/desktop/text-preset/get-global-shortcut-status', {}),
            _0x42004c,
            { intervalMs: 0x3e8, getKey: () => 'global-text-preset-shortcut-status' },
          ),
      },
      clipboard: {
        writeText: (_0x535168) => chromeShellPost('/api/v2/desktop/clipboard/write-text', _0x535168),
        readText: (_0x2d9455) => chromeShellPost('/api/v2/desktop/clipboard/read-text', _0x2d9455),
        writeFileReferences: (_0xf97d0d) =>
          chromeShellPost('/api/v2/desktop/clipboard/write-file-references', _0xf97d0d),
        readFileReferences: (_0xdae75f) =>
          chromeShellPost('/api/v2/desktop/clipboard/read-file-references', _0xdae75f),
      },
      onAssetUpdated: (_0x397f09) =>
        subscribeByPolling(() => chromeShellPost('/api/v2/desktop/asset/consume-updates', {}), _0x397f09, {
          intervalMs: 0x1f4,
          extractItems: (_0x396733) => (Array['isArray'](_0x396733) ? _0x396733 : []),
          getKey: (_0x5e5e21) => String(_0x5e5e21?.['assetId'] || JSON['stringify'](_0x5e5e21 || {})),
        }),
      logDragImport: (_0x230980, _0x244613) =>
        desktopBridge['diagnostics']['logEvent']({
          type: 'import.drag_profile',
          level: 'debug',
          source: 'renderer',
          message: 'Drag\x20import\x20profile',
          context: { label: _0x230980, ...(_0x244613 || {}) },
        }),
    }),
    !![]
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
