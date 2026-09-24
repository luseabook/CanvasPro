import { spawn } from 'node:child_process';
import { mkdirSync, realpathSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function normalizeText(value, maxLength = 0x400) {
  return String(value || '')
    .replace(/\0/g, '')
    .trim()
    .slice(0, maxLength);
}
export async function listNotificationSoundMp3Files(payload = {}) {
  const directory = normalizeText(payload?.directory);
  if (!directory) return { success: true, files: [] };
  if (!path.isAbsolute(directory)) throw new Error('提示音目录必须是绝对路径');
  const resolvedDir = realpathSync(directory),
    stats = statSync(resolvedDir);
  if (!stats.isDirectory()) throw new Error('提示音目录不存在或不是文件夹');
  const files = readdirSync(resolvedDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.mp3$/i.test(entry.name))
    .map((entry) => ({ name: entry.name, path: path.join(resolvedDir, entry.name) }))
    .sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'))
    .slice(0, 200);
  return { success: true, directory: resolvedDir, files: files };
}
function clampVolume(value) {
  const volume = Number(value);
  if (!Number.isFinite(volume)) return 0.7;
  return Math.max(0, Math.min(1, volume));
}
function escapePowerShellSingleQuoted(value) {
  return String(value || '').replace(/'/g, "''");
}
function pathToFileUri(targetPath) {
  return pathToFileURL(path.resolve(targetPath)).href;
}
function resolveNotificationSoundPath(rawPath, appRoot) {
  const requested = normalizeText(rawPath);
  if (!requested) throw new Error('提示音文件不能为空');
  const isRelative = !path.isAbsolute(requested),
    rootDir = path.resolve(appRoot || '.'),
    resolved = isRelative ? path.resolve(rootDir, requested) : path.resolve(requested);
  if (isRelative && resolved !== rootDir && !resolved.startsWith('' + rootDir + path.sep))
    throw new Error('提示音相对路径超出应用目录');
  const stats = statSync(resolved);
  if (!stats.isFile()) throw new Error('提示音文件不存在或不是文件');
  return resolved;
}
export async function playNotificationSoundFile(
  payload = {},
  {
    appRoot: appRoot = '.',
    platform: platform = process.platform,
    spawnProcess: spawnProcess = spawn,
    logEvent: logEvent = null,
  } = {},
) {
  const soundPath = resolveNotificationSoundPath(
      payload?.filePath || payload?.path || payload?.selectedFilePath,
      appRoot,
    ),
    volume = clampVolume(payload?.volume);
  if (platform !== 'win32')
    return { success: false, played: false, reason: 'unsupported-platform', path: soundPath };
  const script = [
      "$ErrorActionPreference='Stop'",
      'Add-Type -AssemblyName PresentationCore',
      '$player=New-Object System.Windows.Media.MediaPlayer',
      "$player.Open([Uri]'" + escapePowerShellSingleQuoted(pathToFileUri(soundPath)) + "')",
      '$player.Volume=' + volume.toFixed(3),
      '$player.Play()',
      'Start-Sleep -Milliseconds 750',
      "if (-not $player.NaturalDuration.HasTimeSpan -and $player.Position.TotalMilliseconds -le 0) { $player.Close(); throw 'Notification sound failed to start' }",
      '$durationMs=1750',
      'if ($player.NaturalDuration.HasTimeSpan) { $durationMs=[Math]::Ceiling($player.NaturalDuration.TimeSpan.TotalMilliseconds-$player.Position.TotalMilliseconds)+100 }',
      '$durationMs=[Math]::Min(30000,[Math]::Max(100,$durationMs))',
      'Start-Sleep -Milliseconds $durationMs',
      '$player.Close()',
    ].join('; '),
    buildFailure = (reason, extra = {}) => {
      const failure = extra.error;
      return (
        logEvent?.({
          type: 'notification_sound.play_failed',
          level: 'warn',
          source: 'main',
          message: 'Notification sound playback failed',
          error: failure ? String(failure?.message || failure) : '',
          context: { filePath: soundPath, reason: reason, ...extra, error: undefined },
        }),
        {
          success: false,
          played: false,
          reason: reason,
          path: soundPath,
          volume: volume,
          ...extra,
          ...(failure ? { error: String(failure?.message || failure) } : {}),
        }
      );
    };
  let playerProcess;
  try {
    playerProcess = spawnProcess(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
      { stdio: 'ignore', windowsHide: true },
    );
  } catch (spawnError) {
    return buildFailure('spawn-error', { error: spawnError });
  }
  if (!playerProcess || typeof playerProcess.once !== 'function')
    return buildFailure('invalid-player-process');
  return await new Promise((resolve) => {
    let settled = false;
    const settle = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    playerProcess.once('error', (error) => {
      settle(buildFailure('spawn-error', { error: error }));
    });
    playerProcess.once('exit', (exitCode, signal) => {
      if (exitCode === 0) {
        settle({ success: true, played: true, path: soundPath, volume: volume });
        return;
      }
      settle(buildFailure('player-exit', { exitCode: exitCode, signal: signal || '' }));
    });
  });
}
export function createSystemNotificationSoundFileService({
  appRoot,
  openPath,
  beep,
  platform = process.platform,
  spawnProcess = spawn,
  logEvent = null,
} = {}) {
  const resolveSoundDir = () => path.join(appRoot || '.', 'assets', 'sounds');
  return {
    async listSystemNotificationSoundFiles() {
      const result = await listNotificationSoundMp3Files({ directory: resolveSoundDir() });
      return {
        ...result,
        files: result.files.map((file) => ({
          ...file,
          playbackUrl: '/assets/sounds/' + encodeURIComponent(file.name),
        })),
      };
    },
    async openSystemNotificationSoundFolder() {
      const soundDir = resolveSoundDir();
      mkdirSync(soundDir, { recursive: true });
      if (typeof openPath === 'function') await openPath(soundDir);
      return { success: true, path: soundDir };
    },
    playNotificationSound(payload = {}) {
      if (payload.system === true) {
        if (typeof beep !== 'function') return { success: false, played: false, reason: 'unavailable' };
        return (beep(), { success: true, played: true, system: true });
      }
      return playNotificationSoundFile(payload, {
        appRoot: appRoot,
        platform: platform,
        spawnProcess: spawnProcess,
        logEvent: logEvent,
      });
    },
  };
}
