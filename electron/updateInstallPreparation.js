import { execFileSync } from 'node:child_process';
const DEFAULT_UPDATE_INSTALL_CLEANUP_TIMEOUT_MS = 0xfa0;
function delay(_0x281469) {
  return new Promise((_0x4637bf) => {
    setTimeout(_0x4637bf, _0x281469);
  });
}
function isPidRunning(_0x86d0f6) {
  if (!Number.isInteger(_0x86d0f6) || _0x86d0f6 <= 0) return false;
  try {
    return (process.kill(_0x86d0f6, 0), true);
  } catch (_0x583723) {
    return _0x583723?.code === 'EPERM';
  }
}
async function waitForPidExit(_0x44616d, _0x497568) {
  if (!Number.isInteger(_0x44616d) || _0x44616d <= 0) return true;
  const _0x20637f = Date.now();
  while (Date.now() - _0x20637f < _0x497568) {
    if (!isPidRunning(_0x44616d)) return true;
    await delay(120);
  }
  return !isPidRunning(_0x44616d);
}
function terminateProcessTree(_0x1a2745, { force: force = false } = {}) {
  if (!Number.isInteger(_0x1a2745) || _0x1a2745 <= 0) return;
  if (process.platform === 'win32') {
    const _0x5f561a = ['/PID', String(_0x1a2745), '/T'];
    if (force) _0x5f561a.push('/F');
    execFileSync('taskkill', _0x5f561a, { stdio: 'ignore', windowsHide: true });
    return;
  }
  process.kill(_0x1a2745, force ? 'SIGKILL' : 'SIGTERM');
}
export function createUpdateInstallPreparation(_0x44fe64 = {}) {
  const _0x16ba28 =
      Number(_0x44fe64.timeoutMs) > 0
        ? Number(_0x44fe64.timeoutMs)
        : DEFAULT_UPDATE_INSTALL_CLEANUP_TIMEOUT_MS,
    _0x58c655 = typeof _0x44fe64.getSpawnedServer === 'function' ? _0x44fe64.getSpawnedServer : () => null,
    _0x5268c2 = typeof _0x44fe64.clearSpawnedServer === 'function' ? _0x44fe64.clearSpawnedServer : () => {},
    _0x330ada =
      typeof _0x44fe64.markQuittingForUpdate === 'function' ? _0x44fe64.markQuittingForUpdate : () => {},
    _0x381303 = typeof _0x44fe64.getMainWindow === 'function' ? _0x44fe64.getMainWindow : () => null,
    _0x1abdd3 =
      typeof _0x44fe64.getRendererProjectState === 'function'
        ? _0x44fe64.getRendererProjectState
        : () => ({}),
    _0x353527 =
      typeof _0x44fe64.requestRendererRecoverySnapshot === 'function'
        ? _0x44fe64.requestRendererRecoverySnapshot
        : null,
    _0x16cb56 =
      typeof _0x44fe64.destroyScreenshotOverlayWindow === 'function'
        ? _0x44fe64.destroyScreenshotOverlayWindow
        : () => {},
    _0x28e972 =
      typeof _0x44fe64.stopAllPowerSaveBlockers === 'function'
        ? _0x44fe64.stopAllPowerSaveBlockers
        : () => {},
    _0x347c25 = typeof _0x44fe64.logEvent === 'function' ? _0x44fe64.logEvent : () => {};
  async function _0x44b84d() {
    const _0x5cedb1 = _0x58c655();
    if (!_0x5cedb1) return true;
    const _0x5ed899 = Number(_0x5cedb1.pid || 0);
    if (!Number.isInteger(_0x5ed899) || _0x5ed899 <= 0) return (_0x5268c2(_0x5cedb1), true);
    try {
      terminateProcessTree(_0x5ed899, { force: false });
    } catch (_0x1a4e8d) {
      console.warn('[electron] failed to stop backend before update install:', _0x1a4e8d);
    }
    let _0x1a673f = await waitForPidExit(_0x5ed899, _0x16ba28);
    if (!_0x1a673f) {
      try {
        terminateProcessTree(_0x5ed899, { force: true });
      } catch (_0x443b93) {
        console.warn('[electron] failed to force stop backend before update install:', _0x443b93);
      }
      _0x1a673f = await waitForPidExit(_0x5ed899, 0x3e8);
    }
    return (_0x5268c2(_0x5cedb1), _0x1a673f);
  }
  async function _0xf0905d() {
    const _0x4c8236 = _0x1abdd3();
    if (_0x4c8236?.hasUnsavedChanges !== true) return true;
    const _0x5a96ce = _0x381303();
    if (!_0x5a96ce || _0x5a96ce.isDestroyed?.() || !_0x353527) {
      throw new Error('未保存工程无法生成更新前恢复快照，已取消安装');
    }
    try {
      const _0x408ed6 = await _0x353527(_0x5a96ce, 'update-install');
      if (_0x408ed6?.success !== true)
        throw new Error(_0x408ed6?.reason || _0x408ed6?.error || '未保存工程恢复快照失败，已取消安装');
      return true;
    } catch (_0x142a2e) {
      _0x347c25({
        type: 'updater.recovery_snapshot_before_install_failed',
        level: 'warn',
        source: 'main',
        message: 'Recovery snapshot before update install failed',
        error: _0x142a2e,
      });
      throw new Error('未保存工程恢复快照失败，已取消安装: ' + String(_0x142a2e?.message || _0x142a2e));
    }
  }
  async function _0x253f26() {
    await _0xf0905d();
    _0x330ada();
    _0x347c25({
      type: 'updater.prepare_install',
      level: 'info',
      source: 'main',
      message: 'Preparing application for update install',
    });
    try {
      _0x16cb56();
    } catch (_0x48d330) {
      console.warn('[electron] failed to destroy screenshot overlay before update:', _0x48d330);
    }
    try {
      _0x28e972();
    } catch (_0x2938b7) {
      console.warn('[electron] failed to stop power save blockers before update:', _0x2938b7);
    }
    const _0x46def1 = await _0x44b84d();
    !_0x46def1 &&
      _0x347c25({
        type: 'updater.backend_stop_timeout',
        level: 'warn',
        source: 'main',
        message: 'Backend process did not exit before update install',
      });
  }
  return { prepareForUpdateInstall: _0x253f26, stopSpawnedServerForUpdate: _0x44b84d };
}
