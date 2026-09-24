import { spawn } from 'node:child_process';

const WINDOWS_EXPLORER_COMMAND = 'explorer.exe';
const WINDOWS_EXPLORER_SPAWN_OPTIONS = Object.freeze({ stdio: 'ignore', windowsHide: false, detached: true });

function emitDiagnostic(logEvent, payload) {
  if (typeof logEvent !== 'function') return;
  try {
    logEvent({ source: 'main', ...payload });
  } catch {}
}

function ignorePromiseRejection(promise) {
  promise?.catch?.(() => {});
}

function launchDedicatedWindowsExplorer({ args, action, spawnProcess, logEvent, fallback }) {
  emitDiagnostic(logEvent, {
    type: 'shell.explorer_window_requested',
    level: 'info',
    message: 'Dedicated Explorer window requested',
    context: { action, strategy: 'new-explorer-window' },
  });
  let child;
  try {
    child = spawnProcess(WINDOWS_EXPLORER_COMMAND, args, WINDOWS_EXPLORER_SPAWN_OPTIONS);
  } catch (error) {
    emitDiagnostic(logEvent, {
      type: 'shell.explorer_window_failed',
      level: 'error',
      message: 'Dedicated Explorer window failed to start',
      error,
      context: { action, strategy: 'new-explorer-window', phase: 'spawn' },
    });
    return null;
  }
  if (!child) {
    emitDiagnostic(logEvent, {
      type: 'shell.explorer_window_failed',
      level: 'error',
      message: 'Dedicated Explorer window returned no process',
      context: { action, strategy: 'new-explorer-window', phase: 'spawn' },
    });
    return null;
  }
  child.once?.('spawn', () => {
    emitDiagnostic(logEvent, {
      type: 'shell.explorer_window_spawned',
      level: 'info',
      message: 'Dedicated Explorer process started',
      context: { action, strategy: 'new-explorer-window' },
    });
  });
  child.once?.('error', (error) => {
    emitDiagnostic(logEvent, {
      type: 'shell.explorer_window_failed',
      level: 'error',
      message: 'Dedicated Explorer process emitted an error',
      error,
      context: { action, strategy: 'new-explorer-window', phase: 'process' },
    });
    try {
      fallback();
    } catch {}
  });
  child.unref?.();
  return child;
}

export function revealShellItemInFolder(
  targetPath,
  { shellApi, platform = process.platform, spawnProcess = spawn, logEvent } = {},
) {
  if (typeof shellApi?.showItemInFolder !== 'function')
    throw new TypeError('shellApi.showItemInFolder must be a function');
  if (platform !== 'win32') {
    shellApi.showItemInFolder(targetPath);
    return { foregroundRequested: false };
  }
  const fallback = () => shellApi.showItemInFolder(targetPath);
  const child = launchDedicatedWindowsExplorer({
    args: ['/n,/select,' + String(targetPath || '')],
    action: 'reveal-item',
    spawnProcess,
    logEvent,
    fallback,
  });
  if (child) return { foregroundRequested: true, strategy: 'new-explorer-window' };
  fallback();
  return { foregroundRequested: false, strategy: 'electron-shell-fallback' };
}

export function openShellFolder(
  folderPath,
  { shellApi, platform = process.platform, spawnProcess = spawn, logEvent } = {},
) {
  if (typeof shellApi?.openPath !== 'function') throw new TypeError('shellApi.openPath must be a function');
  const openPath = () => {
    ignorePromiseRejection(shellApi.openPath(folderPath));
  };
  if (platform !== 'win32') {
    openPath();
    return { foregroundRequested: false };
  }
  const child = launchDedicatedWindowsExplorer({
    args: ['/n,' + String(folderPath || '')],
    action: 'open-folder',
    spawnProcess,
    logEvent,
    fallback: openPath,
  });
  if (child) return { foregroundRequested: true, strategy: 'new-explorer-window' };
  openPath();
  return { foregroundRequested: false, strategy: 'electron-shell-fallback' };
}
