import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
function terminateProcessTree(childProcess, platform = process['platform']) {
  if (!childProcess) return;
  if (platform === 'win32' && Number['isInteger'](childProcess['pid']) && childProcess['pid'] > 0)
    try {
      const killer = spawn('taskkill.exe', ['/pid', String(childProcess['pid']), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
      killer['unref']?.();
      return;
    } catch {}
  try {
    childProcess['kill']?.();
  } catch {}
}
export function resolveChromeBrowserWorkerProfileDir({
  mainProfileDir: mainProfileDir,
  env: env = process['env'],
} = {}) {
  const override = String(env['AIC_CHROME_BROWSER_NODE_PROFILE_DIR'] || '')['trim']();
  if (override) return path['resolve'](override);
  const resolvedMain = path['resolve'](String(mainProfileDir || process['cwd']()));
  return path['join'](path['dirname'](resolvedMain), 'chrome-browser-node-profile');
}
export function launchChromeBrowserWorker({
  browserPath: browserPath,
  mainProfileDir: mainProfileDir,
  env: env = process['env'],
  platform: platform = process['platform'],
  mkdir: mkdir = mkdirSync,
  spawnProcess: spawnProcess = spawn,
  terminateProcess: terminateProcess = terminateProcessTree,
  onExit: onExit = null,
  onError: onError = null,
} = {}) {
  const executable = String(browserPath || '')['trim']();
  if (!executable) throw new Error('Chrome browser worker executable is required');
  const profileDir = resolveChromeBrowserWorkerProfileDir({ mainProfileDir: mainProfileDir, env: env });
  mkdir(profileDir, { recursive: true });
  const args = [
      '--user-data-dir=' + profileDir,
      '--headless=new',
      '--no-first-run',
      '--no-default-browser-check',
      '--autoplay-policy=no-user-gesture-required',
      '--remote-debugging-pipe',
      'about:blank',
    ],
    childProcess = spawnProcess(executable, args, {
      stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
  (childProcess?.['once']?.('exit', (code, signal) => onExit?.({ code: code, signal: signal })),
    childProcess?.['once']?.('error', (error) => onError?.(error)));
  let disposed = false;
  return {
    browserPath: executable,
    profileDir: profileDir,
    process: childProcess,
    devToolsPipe:
      childProcess?.['stdio']?.[3] && childProcess?.['stdio']?.[4]
        ? { writable: childProcess['stdio'][3], readable: childProcess['stdio'][4] }
        : null,
    dispose() {
      if (disposed) return;
      ((disposed = true), terminateProcess(childProcess, platform));
    },
  };
}
export const __chromeBrowserWorkerForTest = { terminateProcessTree: terminateProcessTree };
