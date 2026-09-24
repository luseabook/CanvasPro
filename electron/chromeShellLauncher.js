import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { identifyChromeShellBrowser } from './chromeShellBrowserVersion.js';
import { attachChromeShellStartupDiagnostics } from './chromeShellStartupDiagnostics.js';
import { prepareWindowsChromeShellTaskbarIdentity } from './windowsTaskbarIdentity.js';
const TRUE_RE = /^(1|true|yes|on)$/i,
  FALSE_RE = /^(0|false|no|off)$/i,
  DEFAULT_EARLY_EXIT_GRACE_MS = 0x1388,
  CHROME_SHELL_SPAWN_ERROR_CODE = 'CHROME_SHELL_SPAWN_ERROR',
  WINDOWS_ACTIVATION_TIMEOUT_MS = 0x1770,
  TRACKED_CLOSE_GRACE_MS = 0x5dc,
  TRACKED_CLOSE_FORCE_MS = 0x9c4,
  BACKGROUND_RESPONSIVENESS_ARGS = Object['freeze']([
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
  ]);
function envFlag(source, key) {
  const raw = String(source?.[key] || '')['trim']();
  if (!raw) return null;
  if (TRUE_RE['test'](raw)) return !![];
  if (FALSE_RE['test'](raw)) return ![];
  return null;
}
export function shouldUseChromeShellRuntime(
  env = process['env'],
  { appIsPackaged: appIsPackaged = ![], platform: platform = process['platform'] } = {},
) {
  const runtime = String(env?.['AIC_CANVAS_RUNTIME'] || '')
    ['trim']()
    ['toLowerCase']();
  if (
    envFlag(env, 'AIC_USE_ELECTRON_CANVAS') === !![] &&
    !(appIsPackaged && (platform === 'win32' || platform === 'darwin'))
  )
    return ![];
  if (runtime === 'electron' || runtime === 'browser-window') return ![];
  if (runtime === 'chrome-shell' || runtime === 'edge-shell') return !![];
  if (envFlag(env, 'AIC_USE_CHROME_SHELL') === !![]) return !![];
  return !![];
}
export function shouldQuitWhenAllElectronWindowsClosed({
  platform: platform = process['platform'],
  useChromeShellRuntime: useChromeShellRuntime = ![],
} = {}) {
  if (useChromeShellRuntime) return ![];
  return platform !== 'darwin';
}
export function isChromeShellLaunchActive(launch) {
  const childProcess = launch?.['process'];
  if (!childProcess) return ![];
  return (
    childProcess['exitCode'] == null && childProcess['signalCode'] == null && childProcess['killed'] !== !![]
  );
}
export function buildChromeShellAppUrl(appUrl, { appIsPackaged: appIsPackaged = ![] } = {}) {
  const url = new URL(String(appUrl || 'http://127.0.0.1:8777/'));
  return (
    url['searchParams']['set']('aicRuntime', 'chrome-shell'),
    appIsPackaged
      ? url['searchParams']['set']('aicPackaged', '1')
      : url['searchParams']['delete']('aicPackaged'),
    url['href']
  );
}
export function resolveChromeShellAppIdentity(appUrl) {
  try {
    const url = new URL(String(appUrl || ''));
    if (
      (url['protocol'] !== 'http:' && url['protocol'] !== 'https:') ||
      url['username'] ||
      url['password'] ||
      url['searchParams']['get']('aicRuntime') !== 'chrome-shell'
    )
      return '';
    return url['protocol'] + '//' + url['host'] + url['pathname'];
  } catch {
    return '';
  }
}
function candidatePathsForPlatform(env = process['env'], platform = process['platform']) {
  if (platform === 'win32') {
    const programFiles = env['ProgramFiles'] || env['PROGRAMFILES'] || '',
      programFilesX86 = env['ProgramFiles(x86)'] || env['PROGRAMFILES_X86'] || '',
      localAppData = env['LOCALAPPDATA'] || '';
    return [
      path['join'](programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path['join'](programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path['join'](localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path['join'](programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path['join'](programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path['join'](localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    ]['filter'](Boolean);
  }
  if (platform === 'darwin')
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft\x20Edge.app/Contents/MacOS/Microsoft\x20Edge',
    ];
  return [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
    '/usr/bin/microsoft-edge-stable',
  ];
}
export function resolveChromeShellBrowserExecutable({
  env: env = process['env'],
  platform: platform = process['platform'],
  exists: exists = existsSync,
  preferredBrowser: preferredBrowser = 'auto',
} = {}) {
  const preferred = ['chrome', 'edge']['includes'](String(preferredBrowser)['toLowerCase']())
      ? String(preferredBrowser)['toLowerCase']()
      : 'auto',
    matchesPreferred = (candidate) => {
      if (preferred === 'auto') return !![];
      const base = path['basename'](String(candidate || ''))['toLowerCase']();
      return preferred === 'chrome'
        ? ['chrome.exe', 'chrome', 'google\x20chrome', 'google-chrome', 'google-chrome-stable']['includes'](
            base,
          )
        : ['msedge.exe', 'msedge', 'microsoft edge', 'microsoft-edge', 'microsoft-edge-stable']['includes'](
            base,
          );
    },
    configured = String(env['AIC_CHROME_SHELL_BROWSER'] || '')['trim']();
  if (configured && matchesPreferred(configured)) {
    const isPath = /[\\/]/['test'](configured) || path['isAbsolute'](configured);
    if (!isPath || exists(configured)) return configured;
  }
  return (
    candidatePathsForPlatform(env, platform)
      ['filter'](matchesPreferred)
      ['find']((candidate) => exists(candidate)) || ''
  );
}
export function resolveChromeShellProfileDir({
  app: app,
  env: env = process['env'],
  browserPath: browserPath = '',
} = {}) {
  const configured = String(env['AIC_CHROME_SHELL_PROFILE_DIR'] || '')['trim']();
  if (configured) return path['resolve'](configured);
  const baseDir = app?.['getPath']?.('sessionData') || app?.['getPath']?.('userData') || process['cwd'](),
    browser = identifyChromeShellBrowser(browserPath || env['AIC_CHROME_SHELL_BROWSER']),
    profileName =
      browser === 'edge'
        ? 'edge-shell-profile'
        : browser === 'chromium'
          ? 'chromium-shell-profile'
          : 'chrome-shell-profile';
  return path['join'](baseDir, profileName);
}
export function prepareChromeShellTaskbarIdentity({
  app: app,
  env: env = process['env'],
  platform: platform = process['platform'],
  windowsTaskbarIdentity: windowsTaskbarIdentity = null,
  exists: exists = existsSync,
  spawnProcess: spawnProcess = spawn,
  logEvent: logEvent = null,
} = {}) {
  if (!windowsTaskbarIdentity) return Promise['resolve'](null);
  const browserPath = resolveChromeShellBrowserExecutable({ env: env, platform: platform, exists: exists });
  if (!browserPath) return Promise['resolve'](null);
  const profileDir = resolveChromeShellProfileDir({ app: app, env: env, browserPath: browserPath });
  return prepareWindowsChromeShellTaskbarIdentity({
    browserPath: browserPath,
    profileDir: profileDir,
    platform: platform,
    spawnProcess: spawnProcess,
    logEvent: logEvent,
    ...windowsTaskbarIdentity,
  });
}
function resolveRemoteDebuggingPort(env = process['env']) {
  const raw = String(env['AIC_CHROME_SHELL_REMOTE_DEBUGGING_PORT'] || '')['trim']();
  if (!/^\d+$/['test'](raw)) return '';
  const port = Number['parseInt'](raw, 0xa);
  return port > 0x0 && port <= 0xffff ? String(port) : '';
}
function shouldActivateChromeShellWindow({
  env: env = process['env'],
  platform: platform = process['platform'],
} = {}) {
  if (platform !== 'win32' && platform !== 'darwin') return ![];
  return envFlag(env, 'AIC_CHROME_SHELL_ACTIVATE_WINDOW') !== ![];
}
function resolveBackgroundResponsivenessArgs(env = process['env']) {
  if (envFlag(env, 'AIC_CHROME_SHELL_PREVENT_BACKGROUND_THROTTLING') === ![]) return [];
  return [...BACKGROUND_RESPONSIVENESS_ARGS];
}
function resolveBackgroundModeArgs(env = process['env']) {
  if (envFlag(env, 'AIC_CHROME_SHELL_DISABLE_BACKGROUND_MODE') === ![]) return [];
  return ['--disable-background-mode'];
}
function isPlainObject(value) {
  return value && typeof value === 'object' && !Array['isArray'](value);
}
function readJsonObject(filePath, readFile = readFileSync) {
  try {
    const text = readFile(filePath, 'utf8'),
      parsed = JSON['parse'](String(text || '{}'));
    return isPlainObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
function readChromePreferences(filePath, readFile = readFileSync) {
  return readJsonObject(filePath, readFile);
}
export function writeChromeShellPreferences({
  profileDir: profileDir,
  disableDevTools: disableDevTools = ![],
  mkdir: mkdir = mkdirSync,
  readFile: readFile = readFileSync,
  writeFile: writeFile = writeFileSync,
} = {}) {
  const defaultDir = path['join'](String(profileDir || ''), 'Default');
  mkdir(defaultDir, { recursive: !![] });
  const preferencesPath = path['join'](defaultDir, 'Preferences'),
    existing = readChromePreferences(preferencesPath, readFile),
    devtools = isPlainObject(existing['devtools']) ? existing['devtools'] : {},
    devtoolsWithoutAvailability = { ...devtools };
  delete devtoolsWithoutAvailability['availability'];
  const preferences = {
    ...existing,
    credentials_enable_service: ![],
    autofill: {
      ...(existing['autofill'] && typeof existing['autofill'] === 'object' ? existing['autofill'] : {}),
      credit_card_enabled: ![],
      profile_enabled: ![],
    },
    profile: {
      ...(existing['profile'] && typeof existing['profile'] === 'object' ? existing['profile'] : {}),
      password_manager_enabled: ![],
    },
    devtools: disableDevTools ? { ...devtools, availability: 0x2 } : devtoolsWithoutAvailability,
  };
  return (
    writeFile(preferencesPath, JSON['stringify'](preferences, null, 0x2) + '\x0a', 'utf8'),
    { preferencesPath: preferencesPath, preferences: preferences }
  );
}
function readPositiveInteger(value) {
  const parsed = Number(value);
  return Number['isFinite'](parsed) && parsed > 0x0 ? Math['round'](parsed) : 0x0;
}
function readFiniteInteger(value) {
  const parsed = Number(value);
  return Number['isFinite'](parsed) ? Math['round'](parsed) : null;
}
function readNonNegativeInteger(value, fallback = 0x0) {
  const parsed = Number(value);
  if (!Number['isFinite'](parsed) || parsed < 0x0) return fallback;
  return Math['round'](parsed);
}
function resolveEarlyExitGraceMs(env = process['env']) {
  const raw = String(env['AIC_CHROME_SHELL_EARLY_EXIT_GRACE_MS'] || '')['trim']();
  if (!raw) return DEFAULT_EARLY_EXIT_GRACE_MS;
  return readNonNegativeInteger(raw, DEFAULT_EARLY_EXIT_GRACE_MS);
}
function isCleanEarlyChromeShellExit({ code: code, signal: signal, runtimeMs: runtimeMs, graceMs: graceMs }) {
  return code === 0x0 && !signal && graceMs > 0x0 && runtimeMs >= 0x0 && runtimeMs < graceMs;
}
export function normalizeChromeShellSpawnError(error) {
  if (error?.['code'] === CHROME_SHELL_SPAWN_ERROR_CODE) return error;
  const message = String(error?.['message'] || '')['trim'](),
    normalized = new Error(
      message ? 'Chrome shell process failed to start: ' + message : 'Chrome shell process failed to start',
    );
  return (
    (normalized['name'] = 'ChromeShellSpawnError'),
    (normalized['code'] = CHROME_SHELL_SPAWN_ERROR_CODE),
    (normalized['cause'] = error),
    (normalized['details'] = {
      originalCode: String(error?.['code'] || ''),
      errno: error?.['errno'] ?? null,
      syscall: String(error?.['syscall'] || ''),
      path: String(error?.['path'] || ''),
    }),
    normalized
  );
}
function buildWindowsActivationScript(pid) {
  const targetPid = readPositiveInteger(pid);
  if (!targetPid) return '';
  return ('\x0a$targetPid\x20=\x20' +
    targetPid +
    '\x0a$deadline\x20=\x20[DateTime]::UtcNow.AddMilliseconds(' +
    WINDOWS_ACTIVATION_TIMEOUT_MS +
    ')\n$typeDefinition = @\'\nusing System;\nusing System.Text;\nusing System.Runtime.InteropServices;\npublic static class AicChromeShellWindowActivator {\n  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);\n  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);\n  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);\n  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr hWnd);\n  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);\n  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);\n  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);\n  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);\n  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);\n  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }\n}\n\'@\nAdd-Type -TypeDefinition $typeDefinition -ErrorAction SilentlyContinue\nwhile ([DateTime]::UtcNow -lt $deadline) {\n  $script:shown = $false\n  [AicChromeShellWindowActivator]::EnumWindows({\n    param($hWnd, $lParam)\n    $windowProcessId = [uint32]0\n    [void][AicChromeShellWindowActivator]::GetWindowThreadProcessId($hWnd, [ref]$windowProcessId)\n    if ([int]$windowProcessId -ne $targetPid) { return $true }\n    $len = [AicChromeShellWindowActivator]::GetWindowTextLength($hWnd)\n    $text = New-Object System.Text.StringBuilder ([Math]::Max(256, $len + 1))\n    [void][AicChromeShellWindowActivator]::GetWindowText($hWnd, $text, $text.Capacity)\n    $title = $text.ToString()\n    $rect = New-Object AicChromeShellWindowActivator+RECT\n    [void][AicChromeShellWindowActivator]::GetWindowRect($hWnd, [ref]$rect)\n    $width = $rect.Right - $rect.Left\n    $height = $rect.Bottom - $rect.Top\n    $looksLikeAppWindow = $title -like \'*AI CanvasPro*\' -or $title -like \'*AI Canvas*\' -or ($width -gt 300 -and $height -gt 300 -and $title -notmatch \'IME\')\n    if (-not $looksLikeAppWindow) { return $true }\n    [void][AicChromeShellWindowActivator]::ShowWindow($hWnd, 9)\n    [void][AicChromeShellWindowActivator]::SetForegroundWindow($hWnd)\n    $script:shown = $true\n    return $false\n  }, [IntPtr]::Zero) | Out-Null\n  if ($script:shown) { exit 0 }\n  Start-Sleep -Milliseconds 200\n}\nexit 0\n')[
    'trim'
  ]();
}
function buildMacActivationScript(pid) {
  const targetPid = readPositiveInteger(pid);
  if (!targetPid) return '';
  return [
    'ObjC.import(\x22AppKit\x22);',
    'const\x20app\x20=\x20$.NSRunningApplication.runningApplicationWithProcessIdentifier(' + targetPid + ');',
    'if\x20(app)\x20{',
    '  app.activateWithOptions($.NSApplicationActivateAllWindows | $.NSApplicationActivateIgnoringOtherApps);',
    '}',
  ]['join']('\x0a');
}
export function activateChromeShellWindowSoon({
  child: child,
  env: env = process['env'],
  platform: platform = process['platform'],
  spawnProcess: spawnProcess = spawn,
} = {}) {
  if (!shouldActivateChromeShellWindow({ env: env, platform: platform })) return null;
  const targetPid = readPositiveInteger(child?.['pid']);
  if (!targetPid) return null;
  try {
    const helper =
      platform === 'darwin'
        ? spawnProcess('osascript', ['-l', 'JavaScript', '-e', buildMacActivationScript(targetPid)], {
            stdio: 'ignore',
            detached: !![],
          })
        : spawnProcess(
            'powershell.exe',
            [
              '-NoLogo',
              '-NoProfile',
              '-ExecutionPolicy',
              'Bypass',
              '-Command',
              buildWindowsActivationScript(targetPid),
            ],
            { stdio: 'ignore', windowsHide: !![], detached: !![] },
          );
    return (helper?.['unref']?.(), helper || null);
  } catch {
    return null;
  }
}
function buildWindowsChromeShellFocusScript() {
  return ('\n$focusMode = [Environment]::GetEnvironmentVariable("AIC_CHROME_SHELL_FOCUS_MODE")\n$windowAction = [Environment]::GetEnvironmentVariable("AIC_CHROME_SHELL_WINDOW_ACTION")\n$targetPidText = [Environment]::GetEnvironmentVariable("AIC_CHROME_SHELL_TARGET_PID")\n$expectedBrowserPath = [Environment]::GetEnvironmentVariable("AIC_CHROME_SHELL_EXPECTED_BROWSER_PATH")\n$expectedProfileDir = [Environment]::GetEnvironmentVariable("AIC_CHROME_SHELL_EXPECTED_PROFILE_DIR")\n$expectedAppBaseUrl = [Environment]::GetEnvironmentVariable("AIC_CHROME_SHELL_EXPECTED_APP_BASE_URL")\n$timeoutText = [Environment]::GetEnvironmentVariable("AIC_CHROME_SHELL_FOCUS_TIMEOUT_MS")\n$targetPid = 0\n$timeoutMs = ' +
    WINDOWS_ACTIVATION_TIMEOUT_MS +
    '\x0a[void][int]::TryParse($targetPidText,\x20[ref]$targetPid)\x0a[void][int]::TryParse($timeoutText,\x20[ref]$timeoutMs)\x0a$typeDefinition\x20=\x20@\x27\x0ausing\x20System;\x0ausing\x20System.Text;\x0ausing\x20System.Runtime.InteropServices;\x0apublic\x20static\x20class\x20AicChromeShellFocus\x20{\x0a\x20\x20public\x20delegate\x20bool\x20EnumWindowsProc(IntPtr\x20hWnd,\x20IntPtr\x20lParam);\x0a\x20\x20[DllImport(\x22user32.dll\x22)]\x20public\x20static\x20extern\x20bool\x20EnumWindows(EnumWindowsProc\x20lpEnumFunc,\x20IntPtr\x20lParam);\x0a\x20\x20[DllImport(\x22user32.dll\x22)]\x20public\x20static\x20extern\x20bool\x20IsWindowVisible(IntPtr\x20hWnd);\x0a\x20\x20[DllImport(\x22user32.dll\x22,\x20CharSet\x20=\x20CharSet.Unicode)]\x20public\x20static\x20extern\x20int\x20GetWindowText(IntPtr\x20hWnd,\x20StringBuilder\x20text,\x20int\x20count);\x0a\x20\x20[DllImport(\x22user32.dll\x22)]\x20public\x20static\x20extern\x20int\x20GetWindowTextLength(IntPtr\x20hWnd);\x0a\x20\x20[DllImport(\x22user32.dll\x22)]\x20public\x20static\x20extern\x20uint\x20GetWindowThreadProcessId(IntPtr\x20hWnd,\x20out\x20uint\x20processId);\x0a\x20\x20[DllImport(\x22user32.dll\x22)]\x20public\x20static\x20extern\x20bool\x20ShowWindow(IntPtr\x20hWnd,\x20int\x20nCmdShow);\x0a\x20\x20[DllImport(\x22user32.dll\x22)]\x20public\x20static\x20extern\x20bool\x20SetForegroundWindow(IntPtr\x20hWnd);\x0a\x20\x20[DllImport(\x22user32.dll\x22)]\x20public\x20static\x20extern\x20bool\x20IsWindow(IntPtr\x20hWnd);\x0a\x20\x20[DllImport(\x22user32.dll\x22,\x20SetLastError\x20=\x20true)]\x20public\x20static\x20extern\x20bool\x20PostMessage(IntPtr\x20hWnd,\x20uint\x20message,\x20IntPtr\x20wParam,\x20IntPtr\x20lParam);\x0a\x20\x20[DllImport(\x22kernel32.dll\x22,\x20SetLastError\x20=\x20true)]\x20public\x20static\x20extern\x20IntPtr\x20OpenProcess(uint\x20access,\x20bool\x20inheritHandle,\x20uint\x20processId);\x0a\x20\x20[DllImport(\x22kernel32.dll\x22,\x20CharSet\x20=\x20CharSet.Unicode,\x20SetLastError\x20=\x20true)]\x20public\x20static\x20extern\x20bool\x20QueryFullProcessImageName(IntPtr\x20process,\x20uint\x20flags,\x20StringBuilder\x20path,\x20ref\x20uint\x20size);\x0a\x20\x20[DllImport(\x22kernel32.dll\x22)]\x20public\x20static\x20extern\x20bool\x20CloseHandle(IntPtr\x20handle);\x0a\x20\x20[DllImport(\x22shell32.dll\x22,\x20CharSet\x20=\x20CharSet.Unicode,\x20SetLastError\x20=\x20true)]\x20public\x20static\x20extern\x20IntPtr\x20CommandLineToArgvW(string\x20commandLine,\x20out\x20int\x20argumentCount);\x0a\x20\x20[DllImport(\x22kernel32.dll\x22,\x20SetLastError\x20=\x20true)]\x20public\x20static\x20extern\x20IntPtr\x20LocalFree(IntPtr\x20memory);\x0a\x20\x20public\x20static\x20string\x20GetProcessPath(uint\x20processId)\x20{\x0a\x20\x20\x20\x20IntPtr\x20process\x20=\x20OpenProcess(0x1000,\x20false,\x20processId);\x0a\x20\x20\x20\x20if\x20(process\x20==\x20IntPtr.Zero)\x20return\x20\x22\x22;\x0a\x20\x20\x20\x20try\x20{\x0a\x20\x20\x20\x20\x20\x20StringBuilder\x20path\x20=\x20new\x20StringBuilder(32768);\x0a\x20\x20\x20\x20\x20\x20uint\x20size\x20=\x20(uint)path.Capacity;\x0a\x20\x20\x20\x20\x20\x20return\x20QueryFullProcessImageName(process,\x200,\x20path,\x20ref\x20size)\x20?\x20path.ToString()\x20:\x20\x22\x22;\x0a\x20\x20\x20\x20}\x20finally\x20{\x0a\x20\x20\x20\x20\x20\x20CloseHandle(process);\x0a\x20\x20\x20\x20}\x0a\x20\x20}\x0a\x20\x20public\x20static\x20string[]\x20SplitCommandLine(string\x20commandLine)\x20{\x0a\x20\x20\x20\x20if\x20(String.IsNullOrWhiteSpace(commandLine))\x20return\x20new\x20string[0];\x0a\x20\x20\x20\x20int\x20argumentCount\x20=\x200;\x0a\x20\x20\x20\x20IntPtr\x20argumentList\x20=\x20CommandLineToArgvW(commandLine,\x20out\x20argumentCount);\x0a\x20\x20\x20\x20if\x20(argumentList\x20==\x20IntPtr.Zero\x20||\x20argumentCount\x20<=\x200)\x20return\x20new\x20string[0];\x0a\x20\x20\x20\x20try\x20{\x0a\x20\x20\x20\x20\x20\x20string[]\x20arguments\x20=\x20new\x20string[argumentCount];\x0a\x20\x20\x20\x20\x20\x20for\x20(int\x20index\x20=\x200;\x20index\x20<\x20argumentCount;\x20index++)\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20IntPtr\x20argument\x20=\x20Marshal.ReadIntPtr(argumentList,\x20index\x20*\x20IntPtr.Size);\x0a\x20\x20\x20\x20\x20\x20\x20\x20arguments[index]\x20=\x20Marshal.PtrToStringUni(argument)\x20??\x20\x22\x22;\x0a\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20return\x20arguments;\x0a\x20\x20\x20\x20}\x20finally\x20{\x0a\x20\x20\x20\x20\x20\x20LocalFree(argumentList);\x0a\x20\x20\x20\x20}\x0a\x20\x20}\x0a}\x0a\x27@\x0atry\x20{\x20Add-Type\x20-TypeDefinition\x20$typeDefinition\x20-ErrorAction\x20Stop\x20}\x20catch\x20{\x20exit\x202\x20}\x0a$expectedFullPath\x20=\x20\x22\x22\x0a$expectedFullProfileDir\x20=\x20\x22\x22\x0a$expectedAppUri\x20=\x20$null\x0aif\x20(-not\x20[String]::IsNullOrWhiteSpace($expectedBrowserPath))\x20{\x0a\x20\x20try\x20{\x20$expectedFullPath\x20=\x20[IO.Path]::GetFullPath($expectedBrowserPath)\x20}\x20catch\x20{\x20exit\x202\x20}\x0a}\x0aif\x20(-not\x20[String]::IsNullOrWhiteSpace($expectedProfileDir))\x20{\x0a\x20\x20try\x20{\x20$expectedFullProfileDir\x20=\x20[IO.Path]::GetFullPath($expectedProfileDir)\x20}\x20catch\x20{\x20exit\x202\x20}\x0a}\x0aif\x20(-not\x20[String]::IsNullOrWhiteSpace($expectedAppBaseUrl))\x20{\x0a\x20\x20try\x20{\x0a\x20\x20\x20\x20$expectedAppUri\x20=\x20[Uri]$expectedAppBaseUrl\x0a\x20\x20}\x20catch\x20{\x20exit\x202\x20}\x0a}\x0aif\x20($focusMode\x20-eq\x20\x22detached\x22\x20-and\x20(\x0a\x20\x20[String]::IsNullOrWhiteSpace($expectedFullPath)\x20-or\x0a\x20\x20[String]::IsNullOrWhiteSpace($expectedFullProfileDir)\x20-or\x0a\x20\x20$null\x20-eq\x20$expectedAppUri\x0a))\x20{\x20exit\x202\x20}\x0afunction\x20Test-AicChromeShellLaunchIdentity([uint32]$processId)\x20{\x0a\x20\x20try\x20{\x0a\x20\x20\x20\x20$record\x20=\x20Get-CimInstance\x20Win32_Process\x20-Filter\x20(\x22ProcessId\x20=\x20\x22\x20+\x20$processId)\x20-ErrorAction\x20Stop\x0a\x20\x20}\x20catch\x20{\x0a\x20\x20\x20\x20return\x20$false\x0a\x20\x20}\x0a\x20\x20if\x20($null\x20-eq\x20$record)\x20{\x20return\x20$false\x20}\x0a\x20\x20$hasExpectedProfile\x20=\x20$false\x0a\x20\x20$hasExpectedApp\x20=\x20$false\x0a\x20\x20foreach\x20($argument\x20in\x20[AicChromeShellFocus]::SplitCommandLine([string]$record.CommandLine))\x20{\x0a\x20\x20\x20\x20if\x20($argument.StartsWith(\x22--user-data-dir=\x22,\x20[StringComparison]::OrdinalIgnoreCase))\x20{\x0a\x20\x20\x20\x20\x20\x20try\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20$candidateProfile\x20=\x20[IO.Path]::GetFullPath($argument.Substring(16))\x0a\x20\x20\x20\x20\x20\x20\x20\x20$hasExpectedProfile\x20=\x20[String]::Equals(\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20$candidateProfile,\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20$expectedFullProfileDir,\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20[StringComparison]::OrdinalIgnoreCase\x0a\x20\x20\x20\x20\x20\x20\x20\x20)\x0a\x20\x20\x20\x20\x20\x20}\x20catch\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20$hasExpectedProfile\x20=\x20$false\x0a\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20}\x0a\x20\x20\x20\x20if\x20($argument.StartsWith(\x22--app=\x22,\x20[StringComparison]::OrdinalIgnoreCase))\x20{\x0a\x20\x20\x20\x20\x20\x20try\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20$candidateAppUri\x20=\x20[Uri]$argument.Substring(6)\x0a\x20\x20\x20\x20\x20\x20\x20\x20$hasExpectedApp\x20=\x20(\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20[String]::Equals($candidateAppUri.Scheme,\x20$expectedAppUri.Scheme,\x20[StringComparison]::OrdinalIgnoreCase)\x20-and\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20[String]::Equals($candidateAppUri.Host,\x20$expectedAppUri.Host,\x20[StringComparison]::OrdinalIgnoreCase)\x20-and\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20$candidateAppUri.Port\x20-eq\x20$expectedAppUri.Port\x20-and\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20[String]::Equals($candidateAppUri.AbsolutePath,\x20$expectedAppUri.AbsolutePath,\x20[StringComparison]::Ordinal)\x20-and\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20$candidateAppUri.Query\x20-match\x20\x27(?:^|[?&])aicRuntime=chrome-shell(?:&|$)\x27\x0a\x20\x20\x20\x20\x20\x20\x20\x20)\x0a\x20\x20\x20\x20\x20\x20}\x20catch\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20$hasExpectedApp\x20=\x20$false\x0a\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20}\x0a\x20\x20}\x0a\x20\x20return\x20$hasExpectedProfile\x20-and\x20$hasExpectedApp\x0a}\x0a$deadline\x20=\x20[DateTime]::UtcNow.AddMilliseconds($timeoutMs)\x0a$script:targetWindow\x20=\x20[IntPtr]::Zero\x0awhile\x20([DateTime]::UtcNow\x20-lt\x20$deadline)\x20{\x0a\x20\x20if\x20($windowAction\x20-eq\x20\x22close\x22\x20-and\x20$script:targetWindow\x20-ne\x20[IntPtr]::Zero)\x20{\x0a\x20\x20\x20\x20if\x20(-not\x20[AicChromeShellFocus]::IsWindow($script:targetWindow))\x20{\x20exit\x200\x20}\x0a\x20\x20\x20\x20Start-Sleep\x20-Milliseconds\x20100\x0a\x20\x20\x20\x20continue\x0a\x20\x20}\x0a\x20\x20$script:succeeded\x20=\x20$false\x0a\x20\x20[AicChromeShellFocus]::EnumWindows({\x0a\x20\x20\x20\x20param($hWnd,\x20$lParam)\x0a\x20\x20\x20\x20if\x20(-not\x20[AicChromeShellFocus]::IsWindowVisible($hWnd))\x20{\x20return\x20$true\x20}\x0a\x20\x20\x20\x20$windowProcessId\x20=\x20[uint32]0\x0a\x20\x20\x20\x20[void][AicChromeShellFocus]::GetWindowThreadProcessId($hWnd,\x20[ref]$windowProcessId)\x0a\x20\x20\x20\x20if\x20($focusMode\x20-eq\x20\x22tracked\x22\x20-and\x20[int]$windowProcessId\x20-ne\x20$targetPid)\x20{\x20return\x20$true\x20}\x0a\x20\x20\x20\x20$len\x20=\x20[AicChromeShellFocus]::GetWindowTextLength($hWnd)\x0a\x20\x20\x20\x20$text\x20=\x20New-Object\x20System.Text.StringBuilder\x20([Math]::Max(256,\x20$len\x20+\x201))\x0a\x20\x20\x20\x20[void][AicChromeShellFocus]::GetWindowText($hWnd,\x20$text,\x20$text.Capacity)\x0a\x20\x20\x20\x20$title\x20=\x20$text.ToString()\x0a\x20\x20\x20\x20if\x20($focusMode\x20-eq\x20\x22detached\x22\x20-and\x20$title\x20-notlike\x20\x22*AI\x20CanvasPro*\x22\x20-and\x20$title\x20-notlike\x20\x22*AI\x20Canvas*\x22)\x20{\x20return\x20$true\x20}\x0a\x20\x20\x20\x20if\x20(-not\x20[String]::IsNullOrWhiteSpace($expectedFullPath))\x20{\x0a\x20\x20\x20\x20\x20\x20$processPath\x20=\x20[AicChromeShellFocus]::GetProcessPath($windowProcessId)\x0a\x20\x20\x20\x20\x20\x20if\x20([String]::IsNullOrWhiteSpace($processPath))\x20{\x20return\x20$true\x20}\x0a\x20\x20\x20\x20\x20\x20try\x20{\x20$processPath\x20=\x20[IO.Path]::GetFullPath($processPath)\x20}\x20catch\x20{\x20return\x20$true\x20}\x0a\x20\x20\x20\x20\x20\x20if\x20(-not\x20[String]::Equals($processPath,\x20$expectedFullPath,\x20[StringComparison]::OrdinalIgnoreCase))\x20{\x20return\x20$true\x20}\x0a\x20\x20\x20\x20}\x0a\x20\x20\x20\x20if\x20($focusMode\x20-eq\x20\x22detached\x22\x20-and\x20-not\x20(Test-AicChromeShellLaunchIdentity\x20$windowProcessId))\x20{\x20return\x20$true\x20}\x0a\x20\x20\x20\x20if\x20($windowAction\x20-eq\x20\x22close\x22)\x20{\x0a\x20\x20\x20\x20\x20\x20if\x20([AicChromeShellFocus]::PostMessage($hWnd,\x200x0010,\x20[IntPtr]::Zero,\x20[IntPtr]::Zero))\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20$script:targetWindow\x20=\x20$hWnd\x0a\x20\x20\x20\x20\x20\x20\x20\x20return\x20$false\x0a\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20return\x20$true\x0a\x20\x20\x20\x20}\x0a\x20\x20\x20\x20if\x20([AicChromeShellFocus]::IsIconic($hWnd))\x20{\x0a\x20\x20\x20\x20\x20\x20[void][AicChromeShellFocus]::ShowWindow($hWnd,\x209)\x0a\x20\x20\x20\x20}\x0a\x20\x20\x20\x20[void][AicChromeShellFocus]::SetForegroundWindow($hWnd)\x0a\x20\x20\x20\x20$script:succeeded\x20=\x20$true\x0a\x20\x20\x20\x20return\x20$false\x0a\x20\x20},\x20[IntPtr]::Zero)\x20|\x20Out-Null\x0a\x20\x20if\x20($script:succeeded)\x20{\x20exit\x200\x20}\x0a\x20\x20Start-Sleep\x20-Milliseconds\x20150\x0a}\x0aexit\x201\x0a')[
    'trim'
  ]();
}
function encodePowerShellCommand(script) {
  return Buffer['from'](String(script || ''), 'utf16le')['toString']('base64');
}
function resolveChromeShellFocusTarget(launch) {
  const detached = launch?.['detached'] === !![],
    browserPath = String(launch?.['browserPath'] || '')['trim'](),
    profileDir = String(launch?.['profileDir'] || '')['trim'](),
    appIdentity = resolveChromeShellAppIdentity(launch?.['appUrl']);
  if (detached) {
    if (!path['win32']['isAbsolute'](browserPath) || !path['win32']['isAbsolute'](profileDir) || !appIdentity)
      return null;
    return {
      mode: 'detached',
      targetPid: 0x0,
      expectedBrowserPath: browserPath,
      expectedProfileDir: profileDir,
      expectedAppIdentity: appIdentity,
    };
  }
  const targetPid = readPositiveInteger(launch?.['process']?.['pid']);
  if (!targetPid || !isChromeShellLaunchActive(launch)) return null;
  return {
    mode: 'tracked',
    targetPid: targetPid,
    expectedBrowserPath: path['win32']['isAbsolute'](browserPath) ? browserPath : '',
    expectedProfileDir: '',
    expectedAppIdentity: '',
  };
}
export async function controlChromeShellLaunchWindow({
  launch: launch,
  action: action = 'focus',
  env: env = process['env'],
  platform: platform = process['platform'],
  spawnProcess: spawnProcess = spawn,
  timeoutMs: timeoutMs = WINDOWS_ACTIVATION_TIMEOUT_MS,
  setTimeoutFn: setTimeoutFn = setTimeout,
  clearTimeoutFn: clearTimeoutFn = clearTimeout,
} = {}) {
  if (platform !== 'win32') return ![];
  const normalizedAction = String(action || '')
    ['trim']()
    ['toLowerCase']();
  if (normalizedAction !== 'focus' && normalizedAction !== 'close') return ![];
  const target = resolveChromeShellFocusTarget(launch);
  if (!target) return ![];
  const resolvedTimeoutMs = Math['max'](
    0x64,
    Math['min'](0x2710, readNonNegativeInteger(timeoutMs, WINDOWS_ACTIVATION_TIMEOUT_MS)),
  );
  let helper;
  try {
    helper = spawnProcess(
      'powershell.exe',
      [
        '-NoLogo',
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-EncodedCommand',
        encodePowerShellCommand(buildWindowsChromeShellFocusScript()),
      ],
      {
        stdio: 'ignore',
        windowsHide: !![],
        env: {
          ...env,
          AIC_CHROME_SHELL_FOCUS_MODE: target['mode'],
          AIC_CHROME_SHELL_WINDOW_ACTION: normalizedAction,
          AIC_CHROME_SHELL_TARGET_PID: String(target['targetPid']),
          AIC_CHROME_SHELL_EXPECTED_BROWSER_PATH: target['expectedBrowserPath'],
          AIC_CHROME_SHELL_EXPECTED_PROFILE_DIR: target['expectedProfileDir'],
          AIC_CHROME_SHELL_EXPECTED_APP_BASE_URL: target['expectedAppIdentity'],
          AIC_CHROME_SHELL_FOCUS_TIMEOUT_MS: String(resolvedTimeoutMs),
        },
      },
    );
  } catch {
    return ![];
  }
  if (typeof helper?.['once'] !== 'function') return ![];
  return new Promise((resolve) => {
    let settled = ![],
      timer = null;
    const finish = (succeeded) => {
      if (settled) return;
      settled = !![];
      if (timer !== null) clearTimeoutFn(timer);
      resolve(succeeded === !![]);
    };
    (helper['once']('error', () => finish(![])),
      helper['once']('exit', (exitCode) => finish(exitCode === 0x0)),
      (timer = setTimeoutFn(() => {
        try {
          helper['kill']?.();
        } catch {}
        finish(![]);
      }, resolvedTimeoutMs + 0x3e8)));
  });
}
export function focusChromeShellLaunchWindow(options = {}) {
  return controlChromeShellLaunchWindow({ ...options, action: 'focus' });
}
function waitForChromeShellProcessExit({
  child: child,
  timeoutMs: timeoutMs,
  setTimeoutFn: setTimeoutFn,
  clearTimeoutFn: clearTimeoutFn,
}) {
  const hasExited = () =>
    (child?.['exitCode'] !== null && child?.['exitCode'] !== undefined) ||
    (child?.['signalCode'] !== null && child?.['signalCode'] !== undefined);
  if (hasExited()) return Promise['resolve'](!![]);
  return new Promise((resolve) => {
    let settled = ![],
      timer = null,
      onExit = null;
    const finish = (exited) => {
      if (settled) return;
      settled = !![];
      if (timer !== null) clearTimeoutFn(timer);
      (child?.['off']?.('exit', onExit), resolve(exited === !![]));
    };
    ((onExit = () => finish(!![])), child?.['once']?.('exit', onExit));
    const timeoutTimer = setTimeoutFn(() => finish(hasExited()), Math['max'](0x0, Number(timeoutMs) || 0x0));
    if (settled) clearTimeoutFn(timeoutTimer);
    else timer = timeoutTimer;
  });
}
function runWindowsTaskkill({
  pid: pid,
  force: force,
  spawnProcess: spawnProcess,
  timeoutMs: timeoutMs,
  setTimeoutFn: setTimeoutFn,
  clearTimeoutFn: clearTimeoutFn,
}) {
  return new Promise((resolve) => {
    let helper = null,
      settled = ![],
      timer = null;
    const finish = (succeeded) => {
        if (settled) return;
        settled = !![];
        if (timer !== null) clearTimeoutFn(timer);
        resolve(succeeded === !![]);
      },
      args = ['/PID', String(pid), '/T'];
    if (force) args['push']('/F');
    try {
      helper = spawnProcess('taskkill.exe', args, { windowsHide: !![], stdio: 'ignore' });
    } catch {
      finish(![]);
      return;
    }
    if (typeof helper?.['once'] !== 'function') {
      finish(![]);
      return;
    }
    (helper['once']('error', () => finish(![])),
      helper['once']('exit', (exitCode) => finish(exitCode === 0x0)));
    const timeoutTimer = setTimeoutFn(
      () => {
        try {
          helper['kill']?.();
        } catch {}
        finish(![]);
      },
      Math['max'](0x64, Number(timeoutMs) || 0x0),
    );
    if (settled) clearTimeoutFn(timeoutTimer);
    else timer = timeoutTimer;
  });
}
export async function closeChromeShellLaunchForUpdate({
  launch: launch,
  env: env = process['env'],
  platform: platform = process['platform'],
  spawnProcess: spawnProcess = spawn,
  controlWindow: controlWindow = controlChromeShellLaunchWindow,
  setTimeoutFn: setTimeoutFn = setTimeout,
  clearTimeoutFn: clearTimeoutFn = clearTimeout,
  gracefulTimeoutMs: gracefulTimeoutMs = TRACKED_CLOSE_GRACE_MS,
  forceTimeoutMs: forceTimeoutMs = TRACKED_CLOSE_FORCE_MS,
} = {}) {
  if (!launch) return !![];
  if (launch['detached'] === !![])
    return controlWindow({
      launch: launch,
      action: 'close',
      env: env,
      platform: platform,
      spawnProcess: spawnProcess,
      setTimeoutFn: setTimeoutFn,
      clearTimeoutFn: clearTimeoutFn,
    });
  const child = launch['process'];
  if (
    !child ||
    (child['exitCode'] !== null && child['exitCode'] !== undefined) ||
    (child['signalCode'] !== null && child['signalCode'] !== undefined)
  )
    return !![];
  if (platform === 'win32' && readPositiveInteger(child['pid'])) {
    await runWindowsTaskkill({
      pid: child['pid'],
      force: ![],
      spawnProcess: spawnProcess,
      timeoutMs: gracefulTimeoutMs,
      setTimeoutFn: setTimeoutFn,
      clearTimeoutFn: clearTimeoutFn,
    });
    if (
      await waitForChromeShellProcessExit({
        child: child,
        timeoutMs: gracefulTimeoutMs,
        setTimeoutFn: setTimeoutFn,
        clearTimeoutFn: clearTimeoutFn,
      })
    )
      return !![];
    return (
      await runWindowsTaskkill({
        pid: child['pid'],
        force: !![],
        spawnProcess: spawnProcess,
        timeoutMs: forceTimeoutMs,
        setTimeoutFn: setTimeoutFn,
        clearTimeoutFn: clearTimeoutFn,
      }),
      waitForChromeShellProcessExit({
        child: child,
        timeoutMs: forceTimeoutMs,
        setTimeoutFn: setTimeoutFn,
        clearTimeoutFn: clearTimeoutFn,
      })
    );
  }
  try {
    child['kill']?.();
  } catch {
    return (
      (child['exitCode'] !== null && child['exitCode'] !== undefined) ||
      (child['signalCode'] !== null && child['signalCode'] !== undefined)
    );
  }
  return waitForChromeShellProcessExit({
    child: child,
    timeoutMs: gracefulTimeoutMs,
    setTimeoutFn: setTimeoutFn,
    clearTimeoutFn: clearTimeoutFn,
  });
}
function normalizeWindowMode(record = {}) {
  const state = String(record['show_state'] || record['state'] || '')['toLowerCase'](),
    fullscreen =
      record['fullscreen'] === !![] ||
      record['isFullscreen'] === !![] ||
      record['is_fullscreen'] === !![] ||
      state['includes']('fullscreen'),
    maximized =
      record['maximized'] === !![] ||
      record['isMaximized'] === !![] ||
      record['is_maximized'] === !![] ||
      state['includes']('maximized');
  return { fullscreen: fullscreen, maximized: maximized };
}
function normalizeChromeWindowPlacement(placement = {}) {
  if (!isPlainObject(placement)) return null;
  const left = readFiniteInteger(placement['left']),
    top = readFiniteInteger(placement['top']),
    right = readFiniteInteger(placement['right']),
    bottom = readFiniteInteger(placement['bottom']),
    width =
      readPositiveInteger(placement['width']) ||
      (left !== null && right !== null ? Math['max'](0x0, right - left) : 0x0),
    height =
      readPositiveInteger(placement['height']) ||
      (top !== null && bottom !== null ? Math['max'](0x0, bottom - top) : 0x0),
    { fullscreen: fullscreen, maximized: maximized } = normalizeWindowMode(placement);
  if (!fullscreen && !maximized && (!width || !height)) return null;
  return {
    fullscreen: fullscreen,
    maximized: maximized,
    x: left,
    y: top,
    width: width,
    height: height,
  };
}
function collectChromeAppWindowPlacements(node, placements = []) {
  if (!isPlainObject(node)) return placements;
  const placement = normalizeChromeWindowPlacement(node);
  if (placement) placements['push'](placement);
  return (
    Object['values'](node)['forEach']((value) => {
      collectChromeAppWindowPlacements(value, placements);
    }),
    placements
  );
}
function pickChromeAppWindowPlacement(preferences = {}) {
  const placements = collectChromeAppWindowPlacements(preferences?.['browser']?.['app_window_placement']);
  if (placements['length'] <= 0x0) return null;
  return [...placements]['sort']((a, b) => {
    const score = (placement) =>
      (placement['fullscreen'] ? 0x3b9aca00 : 0x0) +
      (placement['maximized'] ? 0x5f5e100 : 0x0) +
      placement['width'] * placement['height'];
    return score(b) - score(a);
  })[0x0];
}
function readLegacyElectronWindowState(profileDir, readFile = readFileSync) {
  const statePath = path['join'](path['dirname'](String(profileDir || '')), 'window-state.json'),
    state = readJsonObject(statePath, readFile),
    width = readPositiveInteger(state['width']),
    height = readPositiveInteger(state['height']),
    { fullscreen: fullscreen, maximized: maximized } = normalizeWindowMode(state);
  if (!fullscreen && !maximized && (!width || !height)) return null;
  return {
    fullscreen: fullscreen,
    maximized: maximized,
    x: null,
    y: null,
    width: width,
    height: height,
  };
}
function normalizeDisplayWorkArea(display) {
  const workArea = isPlainObject(display?.['workArea']) ? display['workArea'] : display;
  if (!isPlainObject(workArea)) return null;
  const x = readFiniteInteger(workArea['x']),
    y = readFiniteInteger(workArea['y']),
    width = readPositiveInteger(workArea['width']),
    height = readPositiveInteger(workArea['height']);
  if (x === null || y === null || !width || !height) return null;
  return { x: x, y: y, width: width, height: height };
}
function hasReasonableDisplayIntersection(windowState, workArea) {
  const overlapWidth = Math['max'](
      0x0,
      Math['min'](windowState['x'] + windowState['width'], workArea['x'] + workArea['width']) -
        Math['max'](windowState['x'], workArea['x']),
    ),
    overlapHeight = Math['max'](
      0x0,
      Math['min'](windowState['y'] + windowState['height'], workArea['y'] + workArea['height']) -
        Math['max'](windowState['y'], workArea['y']),
    ),
    minWidth = Math['min'](0xf0, Math['max'](0x1, windowState['width'] * 0.2)),
    minHeight = Math['min'](0x78, Math['max'](0x1, windowState['height'] * 0.2));
  return overlapWidth >= minWidth && overlapHeight >= minHeight;
}
function distanceFromWindowCenterToWorkArea(windowState, workArea) {
  const centerX = windowState['x'] + windowState['width'] / 0x2,
    centerY = windowState['y'] + windowState['height'] / 0x2,
    clampedX = Math['min'](Math['max'](centerX, workArea['x']), workArea['x'] + workArea['width']),
    clampedY = Math['min'](Math['max'](centerY, workArea['y']), workArea['y'] + workArea['height']);
  return (centerX - clampedX) ** 0x2 + (centerY - clampedY) ** 0x2;
}
function constrainWindowStateToDisplayWorkAreas(windowState, displayWorkAreas) {
  if (
    !Array['isArray'](displayWorkAreas) ||
    !windowState ||
    windowState['fullscreen'] ||
    windowState['maximized'] ||
    windowState['x'] === null ||
    windowState['y'] === null
  )
    return windowState;
  const workAreas = displayWorkAreas['map']((display) => normalizeDisplayWorkArea(display))['filter'](
    Boolean,
  );
  if (workAreas['length'] <= 0x0) return { ...windowState, x: null, y: null };
  if (workAreas['some']((workArea) => hasReasonableDisplayIntersection(windowState, workArea)))
    return windowState;
  const nearest = [...workAreas]['sort'](
      (a, b) =>
        distanceFromWindowCenterToWorkArea(windowState, a) -
        distanceFromWindowCenterToWorkArea(windowState, b),
    )[0x0],
    width = Math['min'](windowState['width'], nearest['width']),
    height = Math['min'](windowState['height'], nearest['height']);
  return {
    ...windowState,
    x: nearest['x'] + Math['round']((nearest['width'] - width) / 0x2),
    y: nearest['y'] + Math['round']((nearest['height'] - height) / 0x2),
    width: width,
    height: height,
  };
}
function buildWindowStartupArgs(windowState) {
  if (!windowState) return [];
  if (windowState['fullscreen']) return ['--start-fullscreen'];
  if (windowState['maximized']) return ['--start-maximized'];
  if (!windowState['width'] || !windowState['height']) return [];
  const args = ['--window-size=' + windowState['width'] + ',' + windowState['height']];
  return (
    windowState['x'] !== null &&
      windowState['y'] !== null &&
      args['unshift']('--window-position=' + windowState['x'] + ',' + windowState['y']),
    args
  );
}
export function resolveChromeShellWindowStartupArgs({
  profileDir: profileDir,
  readFile: readFile = readFileSync,
  displayWorkAreas: displayWorkAreas = null,
} = {}) {
  const preferencesPath = path['join'](String(profileDir || ''), 'Default', 'Preferences'),
    preferences = readChromePreferences(preferencesPath, readFile);
  return buildWindowStartupArgs(
    constrainWindowStateToDisplayWorkAreas(
      pickChromeAppWindowPlacement(preferences) || readLegacyElectronWindowState(profileDir, readFile),
      displayWorkAreas,
    ),
  );
}
export async function launchChromeShell({
  app: app,
  appUrl: appUrl,
  env: env = process['env'],
  platform: platform = process['platform'],
  windowsTaskbarIdentity: windowsTaskbarIdentity = null,
  windowsTaskbarIdentityPreparation: windowsTaskbarIdentityPreparation = null,
  exists: exists = existsSync,
  mkdir: mkdir = mkdirSync,
  readFile: readFile = readFileSync,
  writeFile: writeFile = writeFileSync,
  spawnProcess: spawnProcess = spawn,
  logEvent: logEvent = null,
  onExit: onExit = null,
  onError: onError = null,
  now: now = () => Date['now'](),
  displayWorkAreas: displayWorkAreas = null,
} = {}) {
  const browserPath = resolveChromeShellBrowserExecutable({ env: env, platform: platform, exists: exists });
  if (!browserPath) throw new Error('Chrome or Edge executable not found');
  const profileDir = resolveChromeShellProfileDir({ app: app, env: env, browserPath: browserPath });
  mkdir(profileDir, { recursive: !![] });
  const appIsPackaged = app?.['isPackaged'] === !![];
  writeChromeShellPreferences({
    profileDir: profileDir,
    disableDevTools: appIsPackaged,
    mkdir: mkdir,
    readFile: readFile,
    writeFile: writeFile,
  });
  const resolvedAppUrl = buildChromeShellAppUrl(appUrl, { appIsPackaged: appIsPackaged }),
    remoteDebuggingPort = resolveRemoteDebuggingPort(env),
    windowStartupArgs = resolveChromeShellWindowStartupArgs({
      profileDir: profileDir,
      readFile: readFile,
      displayWorkAreas: displayWorkAreas,
    }),
    args = [
      '--user-data-dir=' + profileDir,
      '--no-first-run',
      '--no-default-browser-check',
      '--enable-logging=stderr',
      '--autoplay-policy=no-user-gesture-required',
      ...resolveBackgroundModeArgs(env),
      ...resolveBackgroundResponsivenessArgs(env),
      ...windowStartupArgs,
      ...(remoteDebuggingPort ? ['--remote-debugging-port=' + remoteDebuggingPort] : []),
      '--app=' + resolvedAppUrl,
    ],
    taskbarIdentity = windowsTaskbarIdentityPreparation
      ? await windowsTaskbarIdentityPreparation
      : await prepareWindowsChromeShellTaskbarIdentity({
          browserPath: browserPath,
          profileDir: profileDir,
          platform: platform,
          spawnProcess: spawnProcess,
          logEvent: logEvent,
          ...windowsTaskbarIdentity,
        });
  let child,
    spawnedAt = 0x0;
  try {
    ((spawnedAt = now()),
      (child = spawnProcess(browserPath, args, {
        stdio: ['ignore', 'ignore', 'pipe'],
        windowsHide: ![],
      })));
  } catch (spawnError) {
    taskbarIdentity?.['cancel']?.();
    throw normalizeChromeShellSpawnError(spawnError);
  }
  const launch = {
    startupDiagnostics: attachChromeShellStartupDiagnostics(child),
    browserPath: browserPath,
    profileDir: profileDir,
    appUrl: resolvedAppUrl,
    process: child,
    spawnedAt: spawnedAt,
    detached: ![],
    spawnError: null,
  };
  return (
    child?.['once']?.('error', (processError) => {
      const normalized = normalizeChromeShellSpawnError(processError);
      ((launch['spawnError'] = normalized), taskbarIdentity?.['cancel']?.(), onError?.(normalized));
    }),
    typeof onExit === 'function' &&
      child?.['once']?.('exit', (code, signal) =>
        onExit({ code: code, signal: signal, spawnedAt: spawnedAt }),
      ),
    taskbarIdentity?.['attach'](child),
    activateChromeShellWindowSoon({
      child: child,
      env: env,
      platform: platform,
      spawnProcess: spawnProcess,
    }),
    launch
  );
}
function shouldQuitWhenChromeShellExits(env = process['env']) {
  return envFlag(env, 'AIC_CHROME_SHELL_KEEP_LAUNCHER') !== !![];
}
export async function launchChromeShellWithLifecycle({
  app: app,
  appUrl: appUrl,
  env: env = process['env'],
  platform: platform = process['platform'],
  windowsTaskbarIdentity: windowsTaskbarIdentity = null,
  windowsTaskbarIdentityPreparation: windowsTaskbarIdentityPreparation = null,
  exists: exists = existsSync,
  mkdir: mkdir = mkdirSync,
  readFile: readFile = readFileSync,
  writeFile: writeFile = writeFileSync,
  spawnProcess: spawnProcess = spawn,
  logEvent: logEvent = null,
  onClosed: onClosed = null,
  onLaunchError: onLaunchError = null,
  now: now = () => Date['now'](),
  displayWorkAreas: displayWorkAreas = null,
} = {}) {
  const earlyExitGraceMs = resolveEarlyExitGraceMs(env);
  let launch = null;
  return (
    (launch = await launchChromeShell({
      app: app,
      appUrl: appUrl,
      env: env,
      platform: platform,
      windowsTaskbarIdentity: windowsTaskbarIdentity,
      windowsTaskbarIdentityPreparation: windowsTaskbarIdentityPreparation,
      exists: exists,
      mkdir: mkdir,
      readFile: readFile,
      writeFile: writeFile,
      spawnProcess: spawnProcess,
      logEvent: logEvent,
      now: now,
      displayWorkAreas: displayWorkAreas,
      onExit: ({ code: code, signal: signal, spawnedAt: spawnedAt }) => {
        const runtimeMs = Math['max'](0x0, now() - spawnedAt),
          context = { code: code, signal: signal, runtimeMs: runtimeMs };
        if (isCleanEarlyChromeShellExit({ ...context, graceMs: earlyExitGraceMs })) {
          if (launch) launch['detached'] = !![];
          (logEvent?.({
            type: 'chrome_shell.early_exit_ignored',
            level: 'warn',
            source: 'main',
            message: 'Chrome shell process exited before the app-window grace period elapsed',
            context: {
              ...context,
              graceMs: earlyExitGraceMs,
              profileDir: launch?.['profileDir'] || '',
              appUrl: launch?.['appUrl'] || '',
            },
          }),
            onClosed?.({ ...context, detached: !![] }));
          return;
        }
        if (launch) launch['detached'] = ![];
        logEvent?.({
          type: 'chrome_shell.exited',
          level: 'info',
          source: 'main',
          message: 'Chrome shell process exited',
          context: context,
        });
        const keepOpen = onClosed?.({ ...context, detached: ![] }) !== ![];
        keepOpen && shouldQuitWhenChromeShellExits(env) && app?.['quit']?.();
      },
      onError: (error) => {
        const normalized = normalizeChromeShellSpawnError(error);
        if (launch) launch['spawnError'] = normalized;
        (logEvent?.({
          type: 'chrome_shell.spawn_error',
          level: 'error',
          source: 'main',
          message: 'Chrome\x20shell\x20process\x20failed',
          error: normalized,
        }),
          onLaunchError?.(normalized));
      },
    })),
    logEvent?.({
      type: 'chrome_shell.launched',
      level: 'info',
      source: 'main',
      message: 'Chrome shell launched',
      context: {
        browserPath: launch['browserPath'],
        profileDir: launch['profileDir'],
        appUrl: launch['appUrl'],
      },
    }),
    launch
  );
}
export const __chromeShellLauncherForTest = {
  candidatePathsForPlatform: candidatePathsForPlatform,
  envFlag: envFlag,
  resolveRemoteDebuggingPort: resolveRemoteDebuggingPort,
  shouldQuitWhenChromeShellExits: shouldQuitWhenChromeShellExits,
};
