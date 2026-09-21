export const UPDATER_STATES = Object.freeze({
  IDLE: 'idle',
  CHECKING: 'checking',
  AVAILABLE: 'available',
  DOWNLOADING: 'downloading',
  DOWNLOADED: 'downloaded',
  INSTALLING: 'installing',
  ERROR: 'error',
});
const DEFAULT_DOWNLOAD_RETRY_DELAYS_MS = [0xbb8, 0x2710];
function normalizeRetryDelays(_0x5dfc3d) {
  return (Array.isArray(_0x5dfc3d) ? _0x5dfc3d : DEFAULT_DOWNLOAD_RETRY_DELAYS_MS)
    .map((_0x16f427) => Number(_0x16f427))
    .filter((_0x4632f2) => Number.isFinite(_0x4632f2) && _0x4632f2 >= 0);
}
function getErrorMessage(_0x53d0f6, _0x20ce65) {
  return _0x53d0f6?.message ? String(_0x53d0f6.message) : _0x20ce65;
}
function waitForRetry(_0x1bb0a9, _0x16ce19) {
  return new Promise((_0x16f97a) => {
    _0x1bb0a9(_0x16f97a, _0x16ce19);
  });
}
export function createUpdaterController(_0xfc6c5e = {}) {
  const _0x5775d8 = _0xfc6c5e.autoUpdater;
  if (!_0x5775d8) throw new Error('autoUpdater is required');
  const _0x49c840 =
      typeof _0xfc6c5e.normalizeInfo === 'function'
        ? _0xfc6c5e.normalizeInfo
        : (_0x120636) => _0x120636 || null,
    _0x3dbc79 = typeof _0xfc6c5e.logEvent === 'function' ? _0xfc6c5e.logEvent : () => {},
    _0x59037f = typeof _0xfc6c5e.sendEvent === 'function' ? _0xfc6c5e.sendEvent : () => {},
    _0x25fdd2 = typeof _0xfc6c5e.setProgressBar === 'function' ? _0xfc6c5e.setProgressBar : () => {},
    _0x41b952 =
      typeof _0xfc6c5e.prepareBeforeInstall === 'function'
        ? _0xfc6c5e.prepareBeforeInstall
        : typeof _0xfc6c5e.stopBeforeInstall === 'function'
          ? _0xfc6c5e.stopBeforeInstall
          : () => {},
    _0x4226d8 = typeof _0xfc6c5e.setTimeoutFn === 'function' ? _0xfc6c5e.setTimeoutFn : setTimeout,
    _0x3ddc17 = normalizeRetryDelays(_0xfc6c5e.retryDelaysMs),
    _0x283e82 = () => {
      if (typeof _0xfc6c5e.isPackaged === 'function') return Boolean(_0xfc6c5e.isPackaged());
      return Boolean(_0xfc6c5e.isPackaged);
    };
  let _0x509440 = false,
    _0x283bb9 = UPDATER_STATES.IDLE,
    _0x3adb5b = null,
    _0x2ee29f = null,
    _0x37cc95 = null,
    _0x4a1cb0 = 0,
    _0x348df0 = false;
  function _0x72ba3c() {
    return {
      state: _0x283bb9,
      latestEvent: _0x2ee29f,
      latestInfo: _0x3adb5b,
      retryCount: _0x4a1cb0,
      maxRetries: _0x3ddc17.length,
      canCheck: true,
      canDownload: _0x283bb9 === UPDATER_STATES.AVAILABLE || _0x283bb9 === UPDATER_STATES.ERROR,
      canInstall: _0x283bb9 === UPDATER_STATES.DOWNLOADED,
    };
  }
  function _0x52daf2(_0x5f3e34) {
    _0x283bb9 = _0x5f3e34;
  }
  function _0x5042cb(_0x32f792, _0x509cdf = {}) {
    const _0x3bee79 = { type: _0x32f792, state: _0x283bb9, ..._0x509cdf };
    _0x2ee29f = _0x3bee79;
    if (_0x3bee79.info) _0x3adb5b = _0x3bee79.info;
    return (_0x59037f(_0x3bee79), _0x3bee79);
  }
  function _0x273cb5(_0x36abd3, _0x2f8fde, _0x3bef38, _0x59a46 = {}, _0x3cf9f6 = null) {
    _0x3dbc79({
      type: _0x36abd3,
      level: _0x2f8fde,
      source: 'main',
      message: _0x3bef38,
      context: _0x59a46,
      ...(_0x3cf9f6 ? { error: _0x3cf9f6 } : {}),
    });
  }
  function _0x2581ff(_0x80ed80, _0x14ad70, _0x54deb9, _0x3179cf = {}) {
    (_0x52daf2(UPDATER_STATES.ERROR),
      _0x25fdd2(-1),
      _0x273cb5(_0x80ed80, 'error', _0x14ad70, _0x3179cf, _0x54deb9));
  }
  function _0x5000be() {
    if (_0x509440) return;
    ((_0x509440 = true),
      (_0x5775d8.autoDownload = false),
      (_0x5775d8.autoInstallOnAppQuit = false),
      _0x5775d8.on('error', (_0x572908) => {
        if (_0x283bb9 === UPDATER_STATES.DOWNLOADING) {
          _0x273cb5(
            'updater.download_error_event',
            'error',
            'Application updater emitted an error while downloading',
            { retryCount: _0x4a1cb0 },
            _0x572908,
          );
          return;
        }
        (_0x2581ff('updater.error', 'Application updater failed', _0x572908),
          _0x5042cb('error', {
            info: _0x3adb5b,
            message: getErrorMessage(_0x572908, '应用更新检查失败'),
            manual: _0x348df0,
          }),
          (_0x348df0 = false));
      }),
      _0x5775d8.on('checking-for-update', () => {
        (_0x52daf2(UPDATER_STATES.CHECKING),
          _0x273cb5('updater.checking', 'info', 'Checking for application update'),
          _0x5042cb('checking', { info: _0x3adb5b, manual: _0x348df0 }));
      }),
      _0x5775d8.on('update-available', (_0xc4e999) => {
        ((_0x3adb5b = _0x49c840(_0xc4e999)),
          (_0x4a1cb0 = 0),
          _0x52daf2(UPDATER_STATES.AVAILABLE),
          _0x273cb5('updater.available', 'info', 'Application update available', {
            version: _0xc4e999?.version || '',
          }),
          _0x5042cb('available', { info: _0x3adb5b, manual: _0x348df0 }),
          (_0x348df0 = false));
      }),
      _0x5775d8.on('update-not-available', (_0x3774d4) => {
        ((_0x3adb5b = _0x49c840(_0x3774d4)),
          (_0x4a1cb0 = 0),
          _0x52daf2(UPDATER_STATES.IDLE),
          _0x25fdd2(-1),
          _0x273cb5('updater.not_available', 'info', 'Application update not available', {
            version: _0x3774d4?.version || '',
          }),
          _0x5042cb('not-available', { info: _0x3adb5b, manual: _0x348df0 }),
          (_0x348df0 = false));
      }),
      _0x5775d8.on('download-progress', (_0x5ee9b2) => {
        const _0x3ceb47 = Math.max(0, Math.min(100, Number(_0x5ee9b2?.percent || 0)));
        (_0x52daf2(UPDATER_STATES.DOWNLOADING),
          _0x25fdd2(_0x3ceb47 / 100),
          _0x5042cb('download-progress', {
            info: _0x3adb5b,
            percent: _0x3ceb47,
            transferred: Number(_0x5ee9b2?.transferred || 0),
            total: Number(_0x5ee9b2?.total || 0),
            bytesPerSecond: Number(_0x5ee9b2?.bytesPerSecond || 0),
            retryCount: _0x4a1cb0,
            maxRetries: _0x3ddc17.length,
          }));
      }),
      _0x5775d8.on('update-downloaded', (_0x34c289) => {
        ((_0x3adb5b = _0x49c840(_0x34c289)),
          (_0x4a1cb0 = 0),
          _0x52daf2(UPDATER_STATES.DOWNLOADED),
          _0x25fdd2(-1),
          _0x273cb5('updater.downloaded', 'info', 'Application update downloaded', {
            version: _0x34c289?.version || '',
          }),
          _0x5042cb('downloaded', { info: _0x3adb5b }));
      }));
  }
  async function _0x4b95e7(_0xff094b = {}) {
    _0x5000be();
    if (!_0x283e82()) return { ok: false, skipped: true, reason: 'not-packaged', state: _0x283bb9 };
    (_0x52daf2(UPDATER_STATES.CHECKING), (_0x348df0 = Boolean(_0xff094b.manual)));
    try {
      return (await _0x5775d8.checkForUpdates(), { ok: true, state: _0x283bb9 });
    } catch (_0x1af229) {
      (_0x2581ff('updater.check_failed', 'Application update check failed', _0x1af229, {
        manual: Boolean(_0xff094b.manual),
      }),
        _0x5042cb('error', {
          info: _0x3adb5b,
          message: getErrorMessage(_0x1af229, '应用更新检查失败，请稍后再试'),
          manual: _0x348df0,
        }),
        (_0x348df0 = false));
      throw _0x1af229;
    }
  }
  async function _0x3c9917(_0x4f3a95) {
    ((_0x4a1cb0 = _0x4f3a95),
      _0x52daf2(UPDATER_STATES.DOWNLOADING),
      _0x5042cb(_0x4f3a95 === 0 ? 'download-started' : 'download-retry', {
        info: _0x3adb5b,
        retryCount: _0x4f3a95,
        maxRetries: _0x3ddc17.length,
        retryDelayMs: _0x4f3a95 > 0 ? _0x3ddc17[_0x4f3a95 - 1] || 0 : 0,
      }));
    try {
      return (await _0x5775d8.downloadUpdate(), { ok: true, state: _0x283bb9 });
    } catch (_0x34a05b) {
      const _0xde2101 = _0x3ddc17[_0x4f3a95];
      _0x273cb5(
        'updater.download_failed',
        'error',
        'Application update download failed',
        { attempt: _0x4f3a95 + 1, maxAttempts: _0x3ddc17.length + 1, version: _0x3adb5b?.version || '' },
        _0x34a05b,
      );
      if (Number.isFinite(_0xde2101))
        return (
          _0x273cb5('updater.download_retry', 'warn', 'Retrying application update download', {
            retryCount: _0x4f3a95 + 1,
            retryDelayMs: _0xde2101,
            version: _0x3adb5b?.version || '',
          }),
          await waitForRetry(_0x4226d8, _0xde2101),
          _0x3c9917(_0x4f3a95 + 1)
        );
      ((_0x4a1cb0 = _0x3ddc17.length),
        _0x2581ff('updater.download_exhausted', 'Application update download retries exhausted', _0x34a05b, {
          retryCount: _0x4a1cb0,
          version: _0x3adb5b?.version || '',
        }),
        _0x5042cb('download-failed', {
          info: _0x3adb5b,
          retryCount: _0x4a1cb0,
          maxRetries: _0x3ddc17.length,
          message: getErrorMessage(_0x34a05b, '下载更新失败，请稍后再试'),
        }));
      throw _0x34a05b;
    }
  }
  async function _0x458029() {
    _0x5000be();
    if (_0x37cc95) return _0x37cc95;
    return (
      (_0x37cc95 = _0x3c9917(0).finally(() => {
        _0x37cc95 = null;
      })),
      _0x37cc95
    );
  }
  async function _0xa2e7d4() {
    (_0x5000be(),
      _0x52daf2(UPDATER_STATES.INSTALLING),
      _0x273cb5('updater.install_requested', 'info', 'Application update install requested', {
        version: _0x3adb5b?.version || '',
      }),
      _0x5042cb('installing', { info: _0x3adb5b }));
    try {
      return (
        await Promise.resolve(_0x41b952()),
        _0x5775d8.quitAndInstall(false, true),
        { ok: true, state: _0x283bb9 }
      );
    } catch (_0x3760a7) {
      (_0x2581ff('updater.install_failed', 'Application update install failed', _0x3760a7, {
        version: _0x3adb5b?.version || '',
      }),
        _0x5042cb('error', {
          info: _0x3adb5b,
          message: getErrorMessage(_0x3760a7, '重启安装失败，请稍后再试'),
        }));
      throw _0x3760a7;
    }
  }
  return {
    installHandlers: _0x5000be,
    checkForUpdates: _0x4b95e7,
    downloadUpdate: _0x458029,
    installDownloadedUpdate: _0xa2e7d4,
    getState: _0x72ba3c,
    getLatestEvent: () => _0x2ee29f,
  };
}
