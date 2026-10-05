import { Buffer } from 'node:buffer';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describeSystemCommandFailure, resolveWindowsSystemToolPath } from './windowsSystemTools.js';
const WINDOWS_PID_ENV_NAME = 'AIC_BACKEND_IDENTITY_PIDS_BASE64',
  PROCESS_QUERY_TIMEOUT_MS = 5000,
  WINDOWS_PROCESS_QUERY_SCRIPT = ('\n$encodedPids = [Environment]::GetEnvironmentVariable("' +
    WINDOWS_PID_ENV_NAME +
    '")\nif ([String]::IsNullOrWhiteSpace($encodedPids)) { exit 2 }\n$pidJson = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($encodedPids))\n$requestedPids = @(ConvertFrom-Json $pidJson)\n$rows = @()\nforeach ($requestedPid in $requestedPids) {\n  $numericPid = 0\n  if (-not [int]::TryParse([string]$requestedPid, [ref]$numericPid)) { continue }\n  try {\n    $record = Get-CimInstance Win32_Process -Filter ("ProcessId = " + $numericPid) -ErrorAction Stop\n  } catch {\n    continue\n  }\n  if ($null -eq $record) { continue }\n  $rows += [pscustomobject]@{\n    pid = [int]$record.ProcessId\n    executablePath = [string]$record.ExecutablePath\n    commandLine = [string]$record.CommandLine\n  }\n}\n$json = ConvertTo-Json -InputObject @($rows) -Compress\n$encodedRows = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json))\n[Console]::Out.Write($encodedRows)\n')[
    'trim'
  ]();
function normalizePids(pids = []) {
  return [
    ...new Set(
      (Array['isArray'](pids) ? pids : [])
        ['map']((pid) => Number(pid))
        ['filter']((normalizedPid) => Number['isInteger'](normalizedPid) && normalizedPid > 0),
    ),
  ];
}
function createIdentityError(message, cause = null, details = null) {
  const error = new Error(message);
  error['code'] = 'AIC_STARTUP_PORT_IDENTITY_CHECK_FAILED';
  if (cause) error['cause'] = cause;
  if (details) error['details'] = details;
  return error;
}
function normalizeExecutablePath(value, platform) {
  const text = String(value || '')
    ['trim']()
    ['replace'](/^"|"$/g, '');
  if (!text) return '';
  return platform === 'win32'
    ? path['win32']['normalize'](text)['toLowerCase']()
    : path['posix']['normalize'](text);
}
function normalizeCommandLine(value, platform) {
  const text = String(value || '')['trim']();
  return platform === 'win32' ? text['replace'](/\\/g, '/')['toLowerCase']() : text;
}
function hasBackendLaunchArguments(commandLine, { host: host, port: port }) {
  return (
    commandLine['includes']('--host=' + String(host || '')) &&
    commandLine['includes']('--port=' + Number(port))
  );
}
export function isExpectedBackendProcess(processInfo = {}, expectations = {}) {
  const platform = expectations['platform'] || process['platform'],
    pathImpl = platform === 'win32' ? path['win32'] : path['posix'],
    executablePath = normalizeExecutablePath(processInfo['executablePath'], platform),
    backendCommandPath = normalizeExecutablePath(expectations['backendCommand'], platform),
    commandLine = normalizeCommandLine(processInfo['commandLine'], platform);
  if (!backendCommandPath || !commandLine || !hasBackendLaunchArguments(commandLine, expectations))
    return false;
  if (expectations['appIsPackaged']) {
    if (platform === 'win32') return executablePath === backendCommandPath;
    return executablePath === backendCommandPath || commandLine['includes'](backendCommandPath);
  }
  if (pathImpl['isAbsolute'](String(expectations['backendCommand'] || ''))) {
    if (executablePath !== backendCommandPath) return false;
  } else {
    const basename = pathImpl['basename'](executablePath || commandLine)['toLowerCase']();
    if (!/^python(?:3(?:\.\d+)?)?(?:\.exe)?$/['test'](basename)) return false;
  }
  const serverScriptPath = normalizeCommandLine(
    pathImpl['join'](String(expectations['appRoot'] || ''), 'server.py'),
    platform,
  );
  return (
    commandLine['includes'](serverScriptPath) || /(?:^|[\s"'])server\.py(?:[\s"']|$)/i['test'](commandLine)
  );
}
function inspectWindowsBackendProcesses({ pids: pids, env: env, spawnProcess: spawnProcess }) {
  const powershellPath = resolveWindowsSystemToolPath('powershell', { env: env });
  let result;
  try {
    result = spawnProcess(
      powershellPath,
      [
        '-NoLogo',
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        WINDOWS_PROCESS_QUERY_SCRIPT,
      ],
      {
        encoding: 'utf8',
        env: {
          ...env,
          [WINDOWS_PID_ENV_NAME]: Buffer['from'](JSON['stringify'](pids), 'utf8')['toString']('base64'),
        },
        timeout: PROCESS_QUERY_TIMEOUT_MS,
        windowsHide: true,
      },
    );
  } catch (cause) {
    throw createIdentityError(
      'Failed to inspect Windows processes that own the startup port',
      cause,
      { command: powershellPath, failure: describeSystemCommandFailure(cause) },
    );
  }
  if (result?.['status'] !== 0 || result?.['error'] || result?.['signal'])
    throw createIdentityError(
      'Failed to inspect Windows processes that own the startup port',
      result?.['error'] || null,
      {
        command: powershellPath,
        failure: {
          ...describeSystemCommandFailure(result),
          ...describeSystemCommandFailure(result?.['error']),
        },
      },
    );
  try {
    const json = Buffer['from'](String(result['stdout'] || '')['trim'](), 'base64')['toString']('utf8'),
      rows = JSON['parse'](json || '[]');
    return Array['isArray'](rows) ? rows : [];
  } catch (error) {
    throw createIdentityError('Windows process identity output was invalid', error);
  }
}
function inspectPosixBackendProcesses({ pids: pids, spawnProcess: spawnProcess }) {
  const rows = [];
  for (const pid of pids) {
    const result = spawnProcess('ps', ['-p', String(pid), '-o', 'comm=', '-o', 'args='], {
      encoding: 'utf8',
      timeout: PROCESS_QUERY_TIMEOUT_MS,
    });
    if (result?.['status'] === 1) continue;
    if (result?.['status'] !== 0 || result?.['error'] || result?.['signal'])
      throw createIdentityError(
        'Failed to inspect process ' + pid + ' that owns the startup port',
        result?.['error'] || null,
      );
    const commandLine = String(result['stdout'] || '')['trim']();
    if (commandLine) rows['push']({ pid: pid, executablePath: '', commandLine: commandLine });
  }
  return rows;
}
export function inspectBackendProcesses({
  pids: pids,
  platform: platform = process['platform'],
  env: env = process['env'],
  spawnProcess: spawnProcess = spawnSync,
} = {}) {
  const normalizedPids = normalizePids(pids);
  if (normalizedPids['length'] === 0) return [];
  return platform === 'win32'
    ? inspectWindowsBackendProcesses({ pids: normalizedPids, env: env, spawnProcess: spawnProcess })
    : inspectPosixBackendProcesses({ pids: normalizedPids, spawnProcess: spawnProcess });
}
export function findVerifiedBackendProcessPids({
  pids: pids,
  appIsPackaged: appIsPackaged,
  appRoot: appRoot,
  backendCommand: backendCommand,
  host: host,
  port: port,
  platform: platform = process['platform'],
  env: env = process['env'],
  inspectProcesses: inspectProcesses = (pids) =>
    inspectBackendProcesses({ pids: pids, platform: platform, env: env }),
} = {}) {
  const normalizedPids = normalizePids(pids),
    pidSet = new Set(normalizedPids),
    expectations = {
      appIsPackaged: appIsPackaged,
      appRoot: appRoot,
      backendCommand: backendCommand,
      host: host,
      port: port,
      platform: platform,
    };
  return normalizePids(
    inspectProcesses(normalizedPids)
      ['filter'](
        (processInfo) =>
          pidSet['has'](Number(processInfo?.['pid'])) && isExpectedBackendProcess(processInfo, expectations),
      )
      ['map']((processInfo) => processInfo['pid']),
  );
}
export const __backendProcessIdentityForTest = {
  WINDOWS_PROCESS_QUERY_SCRIPT: WINDOWS_PROCESS_QUERY_SCRIPT,
  normalizeExecutablePath: normalizeExecutablePath,
};
