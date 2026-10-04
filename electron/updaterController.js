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
function normalizeRetryDelays(value) {
  return (Array.isArray(value) ? value : DEFAULT_DOWNLOAD_RETRY_DELAYS_MS)
    .map((item) => Number(item))
    .filter((count) => Number.isFinite(count) && count >= 0);
}
function getErrorMessage(key, index) {
  // Raw updater exceptions may contain entire HTTP responses and request URLs.
  // Keep technical details in diagnostics, not in renderer notifications.
  return index || '应用更新失败，请稍后重试。';
}
function waitForRetry(handler, result) {
  return new Promise((data) => {
    handler(data, result);
  });
}
export function createUpdaterController(options2 = {}) {
  const enabled = options2.autoUpdater;
  if (!enabled) throw new Error('autoUpdater is required');
  const run =
      typeof options2.normalizeInfo === 'function' ? options2.normalizeInfo : (target) => target || null,
    handler2 = typeof options2.logEvent === 'function' ? options2.logEvent : () => {},
    handler3 = typeof options2.sendEvent === 'function' ? options2.sendEvent : () => {},
    handler4 = typeof options2.setProgressBar === 'function' ? options2.setProgressBar : () => {},
    handler5 =
      typeof options2.prepareBeforeInstall === 'function'
        ? options2.prepareBeforeInstall
        : typeof options2.stopBeforeInstall === 'function'
          ? options2.stopBeforeInstall
          : () => {},
    source = typeof options2.setTimeoutFn === 'function' ? options2.setTimeoutFn : setTimeout,
    maxRetries = normalizeRetryDelays(options2.retryDelaysMs),
    handler6 = () => {
      if (typeof options2.isPackaged === 'function') return Boolean(options2.isPackaged());
      return Boolean(options2.isPackaged);
    };
  let next = false,
    state = UPDATER_STATES.IDLE,
    latestInfo = null,
    latestEvent = null,
    current = null,
    retryCount = 0,
    manual2 = false;
  let checkPromise = null;
  let checkErrorReported = false;
  let updaterEventSequence = 0;
  function getState() {
    return {
      state: state,
      latestEvent: latestEvent,
      latestInfo: latestInfo,
      retryCount: retryCount,
      maxRetries: maxRetries.length,
      canCheck: true,
      canDownload: state === UPDATER_STATES.AVAILABLE || state === UPDATER_STATES.ERROR,
      canInstall: state === UPDATER_STATES.DOWNLOADED,
    };
  }
  function run2(entry) {
    state = entry;
  }
  function run3(type, args = {}) {
    const record = { type: type, state: state, eventId: ++updaterEventSequence, ...args };
    latestEvent = record;
    if (record.info) latestInfo = record.info;
    return (handler3(record), record);
  }
  function run4(type2, level, message, context = {}, error2 = null) {
    handler2({
      type: type2,
      level: level,
      source: 'main',
      message: message,
      context: context,
      ...(error2 ? { error: error2 } : {}),
    });
  }
  function run5(payload, handle, config, scope = {}) {
    (run2(UPDATER_STATES.ERROR), handler4(-1), run4(payload, 'error', handle, scope, config));
  }
  function reportCheckError(error, manual) {
    if (checkErrorReported) return;
    checkErrorReported = true;
    run5('updater.check_failed', 'Application update check failed', error, { manual });
    run3('error', {
      info: latestInfo,
      message: getErrorMessage(error, '暂时无法检查更新，请稍后重试。'),
      manual,
    });
  }
  function installHandlers() {
    if (next) return;
    ((next = true),
      (enabled.autoDownload = false),
      (enabled.autoInstallOnAppQuit = false),
      enabled.on('error', (input) => {
        if (state === UPDATER_STATES.DOWNLOADING) {
          run4(
            'updater.download_error_event',
            'error',
            'Application updater emitted an error while downloading',
            { retryCount: retryCount },
            input,
          );
          return;
        }
        reportCheckError(input, manual2);
      }),
      enabled.on('checking-for-update', () => {
        (run2(UPDATER_STATES.CHECKING),
          run4('updater.checking', 'info', 'Checking for application update'),
          run3('checking', { info: latestInfo, manual: manual2 }));
      }),
      enabled.on('update-available', (version) => {
        ((latestInfo = run(version)),
          (retryCount = 0),
          run2(UPDATER_STATES.AVAILABLE),
          run4('updater.available', 'info', 'Application update available', {
            version: version?.version || '',
          }),
          run3('available', { info: latestInfo, manual: manual2 }),
          (manual2 = false));
      }),
      enabled.on('update-not-available', (version2) => {
        ((latestInfo = run(version2)),
          (retryCount = 0),
          run2(UPDATER_STATES.IDLE),
          handler4(-1),
          run4('updater.not_available', 'info', 'Application update not available', {
            version: version2?.version || '',
          }),
          run3('not-available', { info: latestInfo, manual: manual2 }),
          (manual2 = false));
      }),
      enabled.on('download-progress', (output) => {
        const percent = Math.max(0, Math.min(100, Number(output?.percent || 0)));
        (run2(UPDATER_STATES.DOWNLOADING),
          handler4(percent / 100),
          run3('download-progress', {
            info: latestInfo,
            percent: percent,
            transferred: Number(output?.transferred || 0),
            total: Number(output?.total || 0),
            bytesPerSecond: Number(output?.bytesPerSecond || 0),
            retryCount: retryCount,
            maxRetries: maxRetries.length,
          }));
      }),
      enabled.on('update-downloaded', (version3) => {
        ((latestInfo = run(version3)),
          (retryCount = 0),
          run2(UPDATER_STATES.DOWNLOADED),
          handler4(-1),
          run4('updater.downloaded', 'info', 'Application update downloaded', {
            version: version3?.version || '',
          }),
          run3('downloaded', { info: latestInfo }));
      }));
  }
  function checkForUpdates(options = {}) {
    installHandlers();
    if (!handler6())
      return Promise.resolve({ ok: false, skipped: true, reason: 'not-packaged', state: state });
    if (checkPromise) {
      manual2 = manual2 || options.manual === true;
      return checkPromise;
    }
    checkErrorReported = false;
    manual2 = options.manual === true;
    run2(UPDATER_STATES.CHECKING);
    checkPromise = Promise.resolve()
      .then(() => enabled.checkForUpdates())
      .then(() => ({ ok: !checkErrorReported, state: state }))
      .catch((error) => {
        reportCheckError(error, manual2);
        throw error;
      })
      .finally(() => {
        checkPromise = null;
        manual2 = false;
      });
    return checkPromise;
  }
  async function run6(retryCount2) {
    ((retryCount = retryCount2),
      run2(UPDATER_STATES.DOWNLOADING),
      run3(retryCount2 === 0 ? 'download-started' : 'download-retry', {
        info: latestInfo,
        retryCount: retryCount2,
        maxRetries: maxRetries.length,
        retryDelayMs: retryCount2 > 0 ? maxRetries[retryCount2 - 1] || 0 : 0,
      }));
    try {
      return (await enabled.downloadUpdate(), { ok: true, state: state });
    } catch (value2) {
      const retryDelayMs = maxRetries[retryCount2];
      run4(
        'updater.download_failed',
        'error',
        'Application update download failed',
        { attempt: retryCount2 + 1, maxAttempts: maxRetries.length + 1, version: latestInfo?.version || '' },
        value2,
      );
      if (Number.isFinite(retryDelayMs))
        return (
          run4('updater.download_retry', 'warn', 'Retrying application update download', {
            retryCount: retryCount2 + 1,
            retryDelayMs: retryDelayMs,
            version: latestInfo?.version || '',
          }),
          await waitForRetry(source, retryDelayMs),
          run6(retryCount2 + 1)
        );
      ((retryCount = maxRetries.length),
        run5('updater.download_exhausted', 'Application update download retries exhausted', value2, {
          retryCount: retryCount,
          version: latestInfo?.version || '',
        }),
        run3('download-failed', {
          info: latestInfo,
          retryCount: retryCount,
          maxRetries: maxRetries.length,
          message: getErrorMessage(value2, '下载更新失败，请稍后再试'),
        }));
      throw value2;
    }
  }
  async function downloadUpdate() {
    installHandlers();
    if (current) return current;
    return (
      (current = run6(0).finally(() => {
        current = null;
      })),
      current
    );
  }
  async function installDownloadedUpdate() {
    (installHandlers(),
      run2(UPDATER_STATES.INSTALLING),
      run4('updater.install_requested', 'info', 'Application update install requested', {
        version: latestInfo?.version || '',
      }),
      run3('installing', { info: latestInfo }));
    try {
      return (
        await Promise.resolve(handler5()),
        enabled.quitAndInstall(false, true),
        { ok: true, state: state }
      );
    } catch (value3) {
      (run5('updater.install_failed', 'Application update install failed', value3, {
        version: latestInfo?.version || '',
      }),
        run3('error', {
          info: latestInfo,
          message: getErrorMessage(value3, '保存或重启安装未完成，请保存工程后重试。'),
          manual: true,
        }));
      throw value3;
    }
  }
  return {
    installHandlers: installHandlers,
    checkForUpdates: checkForUpdates,
    downloadUpdate: downloadUpdate,
    installDownloadedUpdate: installDownloadedUpdate,
    getState: getState,
    getLatestEvent: () => latestEvent,
  };
}
