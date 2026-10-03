import { execFileSync } from 'node:child_process';
import { resolveWindowsSystemToolPath } from './windowsSystemTools.js';

export function terminateProcessTree(
  pid,
  {
    platform = process.platform,
    force = false,
    env = process.env,
    resolveTaskkill = () => resolveWindowsSystemToolPath('taskkill', { env }),
    execFileSync: execFileSyncFn = execFileSync,
  } = {},
) {
  const normalizedPid = Number(pid);
  if (!Number.isInteger(normalizedPid) || normalizedPid <= 0) return false;

  if (platform === 'win32') {
    const args = ['/PID', String(normalizedPid), '/T'];
    if (force) args.push('/F');
    execFileSyncFn(resolveTaskkill(), args, { stdio: 'ignore', windowsHide: true });
    return true;
  }

  process.kill(normalizedPid, force ? 'SIGKILL' : 'SIGTERM');
  return true;
}

export function stopSpawnedServerProcess(
  child,
  {
    platform = process.platform,
    env = process.env,
    terminate = (pid, options) => terminateProcessTree(pid, { platform, env, ...options }),
  } = {},
) {
  if (!child) return false;

  const pid = Number(child.pid);
  if (Number.isInteger(pid) && pid > 0) {
    try {
      terminate(pid, { force: true });
      return true;
    } catch {}
  }

  try {
    child.kill?.();
  } catch {}
  return true;
}
