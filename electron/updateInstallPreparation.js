import { terminateProcessTree } from './backendProcessTermination.js';
import { runCleanupSteps } from '../src/utils/cleanupSteps.js';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function isPidRunning(pid) {
  try { process.kill(pid, 0); return true; }
  catch (error) { return error?.code === 'EPERM'; }
}
async function waitForPidExit(pid, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (!isPidRunning(pid)) return true;
    await delay(100);
  }
  return !isPidRunning(pid);
}
export function createUpdateInstallPreparation({
  timeoutMs = 4000,
  getSpawnedServer = () => null,
  clearSpawnedServer = () => {},
  markQuittingForUpdate = () => {},
  getMainWindow = () => null,
  requestRendererRecoverySnapshot,
  destroyScreenshotOverlayWindow = () => {},
  stopAllPowerSaveBlockers = () => {},
  logEvent = () => {},
  terminate = terminateProcessTree,
  waitForExit = waitForPidExit,
} = {}) {
  let pending = null;
  const log = event => { try { logEvent(event); } catch {} };
  async function stopSpawnedServerForUpdate() {
    const child = getSpawnedServer();
    if (!child) return true;
    if (child.exitCode != null || child.signalCode != null) { clearSpawnedServer(child); return true; }
    const pid = Number(child.pid);
    // A process whose spawn has not settled must not be forgotten or treated as stopped.
    if (!Number.isInteger(pid) || pid <= 0) return false;
    try { terminate(pid, { force: false }); } catch {}
    let exited = await waitForExit(pid, timeoutMs);
    if (!exited) {
      try { terminate(pid, { force: true }); } catch {}
      exited = await waitForExit(pid, 1000);
    }
    if (exited) clearSpawnedServer(child);
    return exited;
  }
  async function prepare() {
    const window = getMainWindow();
    if (window && !window.isDestroyed()) {
      if (typeof requestRendererRecoverySnapshot !== 'function') throw new Error('Cannot install update without a persistence handshake');
      const result = await requestRendererRecoverySnapshot(window, 'update-install');
      if (result?.success !== true && result?.reason !== 'clean') {
        log({ type: 'updater.recovery_snapshot_before_install_failed', level: 'warn', source: 'main', message: 'Update installation cancelled because saving did not complete' });
        throw new Error('保存尚未完成，已取消安装更新。请保存后重试。');
      }
    }
    if (!await stopSpawnedServerForUpdate()) {
      log({ type: 'updater.backend_stop_timeout', level: 'warn', source: 'main', message: 'Update installation cancelled: backend process is still running' });
      throw new Error('后台服务尚未停止，已取消安装更新。请稍后重试。');
    }
    markQuittingForUpdate();
    log({ type: 'updater.prepare_install', level: 'info', source: 'main', message: 'Preparing application for update install' });
    runCleanupSteps([destroyScreenshotOverlayWindow, stopAllPowerSaveBlockers], {
      onError: error => log({ type: 'updater.cleanup_failed', level: 'warn', source: 'main', message: 'An update cleanup step failed', error }),
    });
  }
  return {
    stopSpawnedServerForUpdate,
    prepareForUpdateInstall() {
      if (!pending) pending = prepare().finally(() => { pending = null; });
      return pending;
    },
  };
}
