import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { identifyChromeShellBrowser } from './chromeShellBrowserVersion.js';
import { attachChromeShellStartupDiagnostics } from './chromeShellStartupDiagnostics.js';
import { prepareWindowsChromeShellTaskbarIdentity } from './windowsTaskbarIdentity.js';
const TRUE_RE = /^(1|true|yes|on)$/i,
  FALSE_RE = /^(0|false|no|off)$/i,
  DEFAULT_EARLY_EXIT_GRACE_MS = 5000,
  CHROME_SHELL_SPAWN_ERROR_CODE = 'CHROME_SHELL_SPAWN_ERROR',
  WINDOWS_ACTIVATION_TIMEOUT_MS = 6000,
  TRACKED_CLOSE_GRACE_MS = 1500,
  TRACKED_CLOSE_FORCE_MS = 2500,
  BACKGROUND_RESPONSIVENESS_ARGS = Object.freeze([
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
  ]);
function envFlag(source, key) {
  const raw = String(source?.[key] || '').trim();
  if (!raw) return null;
  if (TRUE_RE.test(raw)) return true;
  if (FALSE_RE.test(raw)) return false;
  return null;
}
export function shouldUseChromeShellRuntime(
  env = process.env,
  { appIsPackaged: appIsPackaged = false, platform: platform = process.platform } = {},
) {
  const runtime = String(env?.AIC_CANVAS_RUNTIME || '')
    .trim()
    .toLowerCase();
  if (
    envFlag(env, 'AIC_USE_ELECTRON_CANVAS') === true &&
    !(appIsPackaged && (platform === 'win32' || platform === 'darwin'))
  )
    return false;
  if (runtime === 'electron' || runtime === 'browser-window') return false;
  if (runtime === 'chrome-shell' || runtime === 'edge-shell') return true;
  if (envFlag(env, 'AIC_USE_CHROME_SHELL') === true) return true;
  return true;
}
export function shouldQuitWhenAllElectronWindowsClosed({
  platform: platform = process.platform,
  useChromeShellRuntime: useChromeShellRuntime = false,
} = {}) {
  if (useChromeShellRuntime) return false;
  return platform !== 'darwin';
}
export function isChromeShellLaunchActive(launch) {
  const childProcess = launch?.process;
  if (!childProcess) return false;
  return (
    childProcess.exitCode == null && childProcess.signalCode == null && childProcess.killed !== true
  );
}
export function buildChromeShellAppUrl(appUrl, { appIsPackaged: appIsPackaged = false } = {}) {
  const url = new URL(String(appUrl || 'http://127.0.0.1:8777/'));
  return (
    url.searchParams.set('aicRuntime', 'chrome-shell'),
    appIsPackaged
      ? url.searchParams.set('aicPackaged', '1')
      : url.searchParams.delete('aicPackaged'),
    url.href
  );
}
export function resolveChromeShellAppIdentity(appUrl) {
  try {
    const url = new URL(String(appUrl || ''));
    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.username ||
      url.password ||
      url.searchParams.get('aicRuntime') !== 'chrome-shell'
    )
      return '';
    return url.protocol + '//' + url.host + url.pathname;
  } catch {
    return '';
  }
}
function candidatePathsForPlatform(env = process.env, platform = process.platform) {
  if (platform === 'win32') {
    const programFiles = env.ProgramFiles || env.PROGRAMFILES || '',
      programFilesX86 = env['ProgramFiles(x86)'] || env.PROGRAMFILES_X86 || '',
      localAppData = env.LOCALAPPDATA || '';
    return [
      path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    ].filter(Boolean);
  }
  if (platform === 'darwin')
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
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
  env: env = process.env,
  platform: platform = process.platform,
  exists: exists = existsSync,
  preferredBrowser: preferredBrowser = 'auto',
} = {}) {
  const preferred = ['chrome', 'edge'].includes(String(preferredBrowser).toLowerCase())
      ? String(preferredBrowser).toLowerCase()
      : 'auto',
    matchesPreferred = (candidate) => {
      if (preferred === 'auto') return true;
      const base = path.basename(String(candidate || '')).toLowerCase();
      return preferred === 'chrome'
        ? ['chrome.exe', 'chrome', 'google chrome', 'google-chrome', 'google-chrome-stable'].includes(
            base,
          )
        : ['msedge.exe', 'msedge', 'microsoft edge', 'microsoft-edge', 'microsoft-edge-stable'].includes(
            base,
          );
    },
    configured = String(env.AIC_CHROME_SHELL_BROWSER || '').trim();
  if (configured && matchesPreferred(configured)) {
    const isPath = /[\\/]/.test(configured) || path.isAbsolute(configured);
    if (!isPath || exists(configured)) return configured;
  }
  return (
    candidatePathsForPlatform(env, platform)
      .filter(matchesPreferred)
      .find((candidate) => exists(candidate)) || ''
  );
}
export function resolveChromeShellProfileDir({
  app: app,
  env: env = process.env,
  browserPath: browserPath = '',
} = {}) {
  const configured = String(env.AIC_CHROME_SHELL_PROFILE_DIR || '').trim();
  if (configured) return path.resolve(configured);
  const baseDir = app?.getPath?.('sessionData') || app?.getPath?.('userData') || process.cwd(),
    browser = identifyChromeShellBrowser(browserPath || env.AIC_CHROME_SHELL_BROWSER),
    profileName =
      browser === 'edge'
        ? 'edge-shell-profile'
        : browser === 'chromium'
          ? 'chromium-shell-profile'
          : 'chrome-shell-profile';
  return path.join(baseDir, profileName);
}
export function prepareChromeShellTaskbarIdentity({
  app: app,
  env: env = process.env,
  platform: platform = process.platform,
  windowsTaskbarIdentity: windowsTaskbarIdentity = null,
  exists: exists = existsSync,
  spawnProcess: spawnProcess = spawn,
  logEvent: logEvent = null,
} = {}) {
  if (!windowsTaskbarIdentity) return Promise.resolve(null);
  const browserPath = resolveChromeShellBrowserExecutable({ env: env, platform: platform, exists: exists });
  if (!browserPath) return Promise.resolve(null);
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
function resolveRemoteDebuggingPort(env = process.env) {
  const raw = String(env.AIC_CHROME_SHELL_REMOTE_DEBUGGING_PORT || '').trim();
  if (!/^\d+$/.test(raw)) return '';
  const port = Number.parseInt(raw, 10);
  return port > 0 && port <= 0xffff ? String(port) : '';
}
function shouldActivateChromeShellWindow({
  env: env = process.env,
  platform: platform = process.platform,
} = {}) {
  if (platform !== 'win32' && platform !== 'darwin') return false;
  return envFlag(env, 'AIC_CHROME_SHELL_ACTIVATE_WINDOW') !== false;
}
function resolveBackgroundResponsivenessArgs(env = process.env) {
  if (envFlag(env, 'AIC_CHROME_SHELL_PREVENT_BACKGROUND_THROTTLING') === false) return [];
  return [...BACKGROUND_RESPONSIVENESS_ARGS];
}
function resolveBackgroundModeArgs(env = process.env) {
  if (envFlag(env, 'AIC_CHROME_SHELL_DISABLE_BACKGROUND_MODE') === false) return [];
  return ['--disable-background-mode'];
}
function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}
function readJsonObject(filePath, readFile = readFileSync) {
  try {
    const text = readFile(filePath, 'utf8'),
      parsed = JSON.parse(String(text || '{}'));
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
  disableDevTools: disableDevTools = false,
  mkdir: mkdir = mkdirSync,
  readFile: readFile = readFileSync,
  writeFile: writeFile = writeFileSync,
} = {}) {
  const defaultDir = path.join(String(profileDir || ''), 'Default');
  mkdir(defaultDir, { recursive: true });
  const preferencesPath = path.join(defaultDir, 'Preferences'),
    existing = readChromePreferences(preferencesPath, readFile),
    devtools = isPlainObject(existing.devtools) ? existing.devtools : {},
    devtoolsWithoutAvailability = { ...devtools };
  delete devtoolsWithoutAvailability.availability;
  const preferences = {
    ...existing,
    credentials_enable_service: false,
    autofill: {
      ...(existing.autofill && typeof existing.autofill === 'object' ? existing.autofill : {}),
      credit_card_enabled: false,
      profile_enabled: false,
    },
    profile: {
      ...(existing.profile && typeof existing.profile === 'object' ? existing.profile : {}),
      password_manager_enabled: false,
    },
    devtools: disableDevTools ? { ...devtools, availability: 2 } : devtoolsWithoutAvailability,
  };
  return (
    writeFile(preferencesPath, JSON.stringify(preferences, null, 2) + '\n', 'utf8'),
    { preferencesPath: preferencesPath, preferences: preferences }
  );
}
function readPositiveInteger(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
}
function readFiniteInteger(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}
function readNonNegativeInteger(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.round(parsed);
}
function resolveEarlyExitGraceMs(env = process.env) {
  const raw = String(env.AIC_CHROME_SHELL_EARLY_EXIT_GRACE_MS || '').trim();
  if (!raw) return DEFAULT_EARLY_EXIT_GRACE_MS;
  return readNonNegativeInteger(raw, DEFAULT_EARLY_EXIT_GRACE_MS);
}
function isCleanEarlyChromeShellExit({ code: code, signal: signal, runtimeMs: runtimeMs, graceMs: graceMs }) {
  return code === 0 && !signal && graceMs > 0 && runtimeMs >= 0 && runtimeMs < graceMs;
}
export function normalizeChromeShellSpawnError(error) {
  if (error?.code === CHROME_SHELL_SPAWN_ERROR_CODE) return error;
  const message = String(error?.message || '').trim(),
    normalized = new Error(
      message ? 'Chrome shell process failed to start: ' + message : 'Chrome shell process failed to start',
    );
  return (
    (normalized.name = 'ChromeShellSpawnError'),
    (normalized.code = CHROME_SHELL_SPAWN_ERROR_CODE),
    (normalized.cause = error),
    (normalized.details = {
      originalCode: String(error?.code || ''),
      errno: error?.errno ?? null,
      syscall: String(error?.syscall || ''),
      path: String(error?.path || ''),
    }),
    normalized
  );
}
function buildWindowsActivationScript(pid) {
  const targetPid = readPositiveInteger(pid);
  if (!targetPid) return '';
  return ('\n$targetPid = ' +
    targetPid +
    '\n$deadline = [DateTime]::UtcNow.AddMilliseconds(' +
    WINDOWS_ACTIVATION_TIMEOUT_MS +
    ')\n$typeDefinition = @\'\nusing System;\nusing System.Text;\nusing System.Runtime.InteropServices;\npublic static class AicChromeShellWindowActivator {\n  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);\n  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);\n  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);\n  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr hWnd);\n  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);\n  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);\n  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);\n  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);\n  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);\n  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }\n}\n\'@\nAdd-Type -TypeDefinition $typeDefinition -ErrorAction SilentlyContinue\nwhile ([DateTime]::UtcNow -lt $deadline) {\n  $script:shown = $false\n  [AicChromeShellWindowActivator]::EnumWindows({\n    param($hWnd, $lParam)\n    $windowProcessId = [uint32]0\n    [void][AicChromeShellWindowActivator]::GetWindowThreadProcessId($hWnd, [ref]$windowProcessId)\n    if ([int]$windowProcessId -ne $targetPid) { return $true }\n    $len = [AicChromeShellWindowActivator]::GetWindowTextLength($hWnd)\n    $text = New-Object System.Text.StringBuilder ([Math]::Max(256, $len + 1))\n    [void][AicChromeShellWindowActivator]::GetWindowText($hWnd, $text, $text.Capacity)\n    $title = $text.ToString()\n    $rect = New-Object AicChromeShellWindowActivator+RECT\n    [void][AicChromeShellWindowActivator]::GetWindowRect($hWnd, [ref]$rect)\n    $width = $rect.Right - $rect.Left\n    $height = $rect.Bottom - $rect.Top\n    $looksLikeAppWindow = $title -like \'*updream canvas*\' -or $title -like \'*AI CanvasPro*\' -or ($width -gt 300 -and $height -gt 300 -and $title -notmatch \'IME\')\n    if (-not $looksLikeAppWindow) { return $true }\n    [void][AicChromeShellWindowActivator]::ShowWindow($hWnd, 9)\n    [void][AicChromeShellWindowActivator]::SetForegroundWindow($hWnd)\n    $script:shown = $true\n    return $false\n  }, [IntPtr]::Zero) | Out-Null\n  if ($script:shown) { exit 0 }\n  Start-Sleep -Milliseconds 200\n}\nexit 0\n').trim();
}
function buildMacActivationScript(pid) {
  const targetPid = readPositiveInteger(pid);
  if (!targetPid) return '';
  return [
    'ObjC.import("AppKit");',
    'const app = $.NSRunningApplication.runningApplicationWithProcessIdentifier(' + targetPid + ');',
    'if (app) {',
    '  app.activateWithOptions($.NSApplicationActivateAllWindows | $.NSApplicationActivateIgnoringOtherApps);',
    '}',
  ].join('\n');
}
export function activateChromeShellWindowSoon({
  child: child,
  env: env = process.env,
  platform: platform = process.platform,
  spawnProcess: spawnProcess = spawn,
} = {}) {
  if (!shouldActivateChromeShellWindow({ env: env, platform: platform })) return null;
  const targetPid = readPositiveInteger(child?.pid);
  if (!targetPid) return null;
  try {
    const helper =
      platform === 'darwin'
        ? spawnProcess('osascript', ['-l', 'JavaScript', '-e', buildMacActivationScript(targetPid)], {
            stdio: 'ignore',
            detached: true,
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
            { stdio: 'ignore', windowsHide: true, detached: true },
          );
    return (helper?.unref?.(), helper || null);
  } catch {
    return null;
  }
}
function buildWindowsChromeShellFocusScript() {
  return ('\n$focusMode = [Environment]::GetEnvironmentVariable("AIC_CHROME_SHELL_FOCUS_MODE")\n$windowAction = [Environment]::GetEnvironmentVariable("AIC_CHROME_SHELL_WINDOW_ACTION")\n$targetPidText = [Environment]::GetEnvironmentVariable("AIC_CHROME_SHELL_TARGET_PID")\n$expectedBrowserPath = [Environment]::GetEnvironmentVariable("AIC_CHROME_SHELL_EXPECTED_BROWSER_PATH")\n$expectedProfileDir = [Environment]::GetEnvironmentVariable("AIC_CHROME_SHELL_EXPECTED_PROFILE_DIR")\n$expectedAppBaseUrl = [Environment]::GetEnvironmentVariable("AIC_CHROME_SHELL_EXPECTED_APP_BASE_URL")\n$timeoutText = [Environment]::GetEnvironmentVariable("AIC_CHROME_SHELL_FOCUS_TIMEOUT_MS")\n$targetPid = 0\n$timeoutMs = ' +
    WINDOWS_ACTIVATION_TIMEOUT_MS +
    '\n[void][int]::TryParse($targetPidText, [ref]$targetPid)\n[void][int]::TryParse($timeoutText, [ref]$timeoutMs)\n$typeDefinition = @\'\nusing System;\nusing System.Text;\nusing System.Runtime.InteropServices;\npublic static class AicChromeShellFocus {\n  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);\n  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);\n  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);\n  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);\n  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr hWnd);\n  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);\n  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);\n  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);\n  [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr hWnd);\n  [DllImport("user32.dll", SetLastError = true)] public static extern bool PostMessage(IntPtr hWnd, uint message, IntPtr wParam, IntPtr lParam);\n  [DllImport("kernel32.dll", SetLastError = true)] public static extern IntPtr OpenProcess(uint access, bool inheritHandle, uint processId);\n  [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)] public static extern bool QueryFullProcessImageName(IntPtr process, uint flags, StringBuilder path, ref uint size);\n  [DllImport("kernel32.dll")] public static extern bool CloseHandle(IntPtr handle);\n  [DllImport("shell32.dll", CharSet = CharSet.Unicode, SetLastError = true)] public static extern IntPtr CommandLineToArgvW(string commandLine, out int argumentCount);\n  [DllImport("kernel32.dll", SetLastError = true)] public static extern IntPtr LocalFree(IntPtr memory);\n  public static string GetProcessPath(uint processId) {\n    IntPtr process = OpenProcess(0x1000, false, processId);\n    if (process == IntPtr.Zero) return "";\n    try {\n      StringBuilder path = new StringBuilder(32768);\n      uint size = (uint)path.Capacity;\n      return QueryFullProcessImageName(process, 0, path, ref size) ? path.ToString() : "";\n    } finally {\n      CloseHandle(process);\n    }\n  }\n  public static string[] SplitCommandLine(string commandLine) {\n    if (String.IsNullOrWhiteSpace(commandLine)) return new string[0];\n    int argumentCount = 0;\n    IntPtr argumentList = CommandLineToArgvW(commandLine, out argumentCount);\n    if (argumentList == IntPtr.Zero || argumentCount <= 0) return new string[0];\n    try {\n      string[] arguments = new string[argumentCount];\n      for (int index = 0; index < argumentCount; index++) {\n        IntPtr argument = Marshal.ReadIntPtr(argumentList, index * IntPtr.Size);\n        arguments[index] = Marshal.PtrToStringUni(argument) ?? "";\n      }\n      return arguments;\n    } finally {\n      LocalFree(argumentList);\n    }\n  }\n}\n\'@\ntry { Add-Type -TypeDefinition $typeDefinition -ErrorAction Stop } catch { exit 2 }\n$expectedFullPath = ""\n$expectedFullProfileDir = ""\n$expectedAppUri = $null\nif (-not [String]::IsNullOrWhiteSpace($expectedBrowserPath)) {\n  try { $expectedFullPath = [IO.Path]::GetFullPath($expectedBrowserPath) } catch { exit 2 }\n}\nif (-not [String]::IsNullOrWhiteSpace($expectedProfileDir)) {\n  try { $expectedFullProfileDir = [IO.Path]::GetFullPath($expectedProfileDir) } catch { exit 2 }\n}\nif (-not [String]::IsNullOrWhiteSpace($expectedAppBaseUrl)) {\n  try {\n    $expectedAppUri = [Uri]$expectedAppBaseUrl\n  } catch { exit 2 }\n}\nif ($focusMode -eq "detached" -and (\n  [String]::IsNullOrWhiteSpace($expectedFullPath) -or\n  [String]::IsNullOrWhiteSpace($expectedFullProfileDir) -or\n  $null -eq $expectedAppUri\n)) { exit 2 }\nfunction Test-AicChromeShellLaunchIdentity([uint32]$processId) {\n  try {\n    $record = Get-CimInstance Win32_Process -Filter ("ProcessId = " + $processId) -ErrorAction Stop\n  } catch {\n    return $false\n  }\n  if ($null -eq $record) { return $false }\n  $hasExpectedProfile = $false\n  $hasExpectedApp = $false\n  foreach ($argument in [AicChromeShellFocus]::SplitCommandLine([string]$record.CommandLine)) {\n    if ($argument.StartsWith("--user-data-dir=", [StringComparison]::OrdinalIgnoreCase)) {\n      try {\n        $candidateProfile = [IO.Path]::GetFullPath($argument.Substring(16))\n        $hasExpectedProfile = [String]::Equals(\n          $candidateProfile,\n          $expectedFullProfileDir,\n          [StringComparison]::OrdinalIgnoreCase\n        )\n      } catch {\n        $hasExpectedProfile = $false\n      }\n    }\n    if ($argument.StartsWith("--app=", [StringComparison]::OrdinalIgnoreCase)) {\n      try {\n        $candidateAppUri = [Uri]$argument.Substring(6)\n        $hasExpectedApp = (\n          [String]::Equals($candidateAppUri.Scheme, $expectedAppUri.Scheme, [StringComparison]::OrdinalIgnoreCase) -and\n          [String]::Equals($candidateAppUri.Host, $expectedAppUri.Host, [StringComparison]::OrdinalIgnoreCase) -and\n          $candidateAppUri.Port -eq $expectedAppUri.Port -and\n          [String]::Equals($candidateAppUri.AbsolutePath, $expectedAppUri.AbsolutePath, [StringComparison]::Ordinal) -and\n          $candidateAppUri.Query -match \'(?:^|[?&])aicRuntime=chrome-shell(?:&|$)\'\n        )\n      } catch {\n        $hasExpectedApp = $false\n      }\n    }\n  }\n  return $hasExpectedProfile -and $hasExpectedApp\n}\n$deadline = [DateTime]::UtcNow.AddMilliseconds($timeoutMs)\n$script:targetWindow = [IntPtr]::Zero\nwhile ([DateTime]::UtcNow -lt $deadline) {\n  if ($windowAction -eq "close" -and $script:targetWindow -ne [IntPtr]::Zero) {\n    if (-not [AicChromeShellFocus]::IsWindow($script:targetWindow)) { exit 0 }\n    Start-Sleep -Milliseconds 100\n    continue\n  }\n  $script:succeeded = $false\n  [AicChromeShellFocus]::EnumWindows({\n    param($hWnd, $lParam)\n    if (-not [AicChromeShellFocus]::IsWindowVisible($hWnd)) { return $true }\n    $windowProcessId = [uint32]0\n    [void][AicChromeShellFocus]::GetWindowThreadProcessId($hWnd, [ref]$windowProcessId)\n    if ($focusMode -eq "tracked" -and [int]$windowProcessId -ne $targetPid) { return $true }\n    $len = [AicChromeShellFocus]::GetWindowTextLength($hWnd)\n    $text = New-Object System.Text.StringBuilder ([Math]::Max(256, $len + 1))\n    [void][AicChromeShellFocus]::GetWindowText($hWnd, $text, $text.Capacity)\n    $title = $text.ToString()\n    if ($focusMode -eq "detached" -and $title -notlike "*updream canvas*" -and $title -notlike "*AI CanvasPro*" -and $title -notlike "*AI Canvas*") { return $true }\n    if (-not [String]::IsNullOrWhiteSpace($expectedFullPath)) {\n      $processPath = [AicChromeShellFocus]::GetProcessPath($windowProcessId)\n      if ([String]::IsNullOrWhiteSpace($processPath)) { return $true }\n      try { $processPath = [IO.Path]::GetFullPath($processPath) } catch { return $true }\n      if (-not [String]::Equals($processPath, $expectedFullPath, [StringComparison]::OrdinalIgnoreCase)) { return $true }\n    }\n    if ($focusMode -eq "detached" -and -not (Test-AicChromeShellLaunchIdentity $windowProcessId)) { return $true }\n    if ($windowAction -eq "close") {\n      if ([AicChromeShellFocus]::PostMessage($hWnd, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero)) {\n        $script:targetWindow = $hWnd\n        return $false\n      }\n      return $true\n    }\n    if ([AicChromeShellFocus]::IsIconic($hWnd)) {\n      [void][AicChromeShellFocus]::ShowWindow($hWnd, 9)\n    }\n    [void][AicChromeShellFocus]::SetForegroundWindow($hWnd)\n    $script:succeeded = $true\n    return $false\n  }, [IntPtr]::Zero) | Out-Null\n  if ($script:succeeded) { exit 0 }\n  Start-Sleep -Milliseconds 150\n}\nexit 1\n').trim();
}
function encodePowerShellCommand(script) {
  return Buffer.from(String(script || ''), 'utf16le').toString('base64');
}
function resolveChromeShellFocusTarget(launch) {
  const detached = launch?.detached === true,
    browserPath = String(launch?.browserPath || '').trim(),
    profileDir = String(launch?.profileDir || '').trim(),
    appIdentity = resolveChromeShellAppIdentity(launch?.appUrl);
  if (detached) {
    if (!path.win32.isAbsolute(browserPath) || !path.win32.isAbsolute(profileDir) || !appIdentity)
      return null;
    return {
      mode: 'detached',
      targetPid: 0,
      expectedBrowserPath: browserPath,
      expectedProfileDir: profileDir,
      expectedAppIdentity: appIdentity,
    };
  }
  const targetPid = readPositiveInteger(launch?.process?.pid);
  if (!targetPid || !isChromeShellLaunchActive(launch)) return null;
  return {
    mode: 'tracked',
    targetPid: targetPid,
    expectedBrowserPath: path.win32.isAbsolute(browserPath) ? browserPath : '',
    expectedProfileDir: '',
    expectedAppIdentity: '',
  };
}
export async function controlChromeShellLaunchWindow({
  launch: launch,
  action: action = 'focus',
  env: env = process.env,
  platform: platform = process.platform,
  spawnProcess: spawnProcess = spawn,
  timeoutMs: timeoutMs = WINDOWS_ACTIVATION_TIMEOUT_MS,
  setTimeoutFn: setTimeoutFn = setTimeout,
  clearTimeoutFn: clearTimeoutFn = clearTimeout,
} = {}) {
  if (platform !== 'win32') return false;
  const normalizedAction = String(action || '')
    .trim()
    .toLowerCase();
  if (normalizedAction !== 'focus' && normalizedAction !== 'close') return false;
  const target = resolveChromeShellFocusTarget(launch);
  if (!target) return false;
  const resolvedTimeoutMs = Math.max(
    100,
    Math.min(10000, readNonNegativeInteger(timeoutMs, WINDOWS_ACTIVATION_TIMEOUT_MS)),
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
        windowsHide: true,
        env: {
          ...env,
          AIC_CHROME_SHELL_FOCUS_MODE: target.mode,
          AIC_CHROME_SHELL_WINDOW_ACTION: normalizedAction,
          AIC_CHROME_SHELL_TARGET_PID: String(target.targetPid),
          AIC_CHROME_SHELL_EXPECTED_BROWSER_PATH: target.expectedBrowserPath,
          AIC_CHROME_SHELL_EXPECTED_PROFILE_DIR: target.expectedProfileDir,
          AIC_CHROME_SHELL_EXPECTED_APP_BASE_URL: target.expectedAppIdentity,
          AIC_CHROME_SHELL_FOCUS_TIMEOUT_MS: String(resolvedTimeoutMs),
        },
      },
    );
  } catch {
    return false;
  }
  if (typeof helper?.once !== 'function') return false;
  return new Promise((resolve) => {
    let settled = false,
      timer = null;
    const finish = (succeeded) => {
      if (settled) return;
      settled = true;
      if (timer !== null) clearTimeoutFn(timer);
      resolve(succeeded === true);
    };
    (helper.once('error', () => finish(false)),
      helper.once('exit', (exitCode) => finish(exitCode === 0)),
      (timer = setTimeoutFn(() => {
        try {
          helper.kill?.();
        } catch {}
        finish(false);
      }, resolvedTimeoutMs + 1000)));
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
    (child?.exitCode !== null && child?.exitCode !== undefined) ||
    (child?.signalCode !== null && child?.signalCode !== undefined);
  if (hasExited()) return Promise.resolve(true);
  return new Promise((resolve) => {
    let settled = false,
      timer = null,
      onExit = null;
    const finish = (exited) => {
      if (settled) return;
      settled = true;
      if (timer !== null) clearTimeoutFn(timer);
      (child?.off?.('exit', onExit), resolve(exited === true));
    };
    ((onExit = () => finish(true)), child?.once?.('exit', onExit));
    const timeoutTimer = setTimeoutFn(() => finish(hasExited()), Math.max(0, Number(timeoutMs) || 0));
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
      settled = false,
      timer = null;
    const finish = (succeeded) => {
        if (settled) return;
        settled = true;
        if (timer !== null) clearTimeoutFn(timer);
        resolve(succeeded === true);
      },
      args = ['/PID', String(pid), '/T'];
    if (force) args.push('/F');
    try {
      helper = spawnProcess('taskkill.exe', args, { windowsHide: true, stdio: 'ignore' });
    } catch {
      finish(false);
      return;
    }
    if (typeof helper?.once !== 'function') {
      finish(false);
      return;
    }
    (helper.once('error', () => finish(false)),
      helper.once('exit', (exitCode) => finish(exitCode === 0)));
    const timeoutTimer = setTimeoutFn(
      () => {
        try {
          helper.kill?.();
        } catch {}
        finish(false);
      },
      Math.max(100, Number(timeoutMs) || 0),
    );
    if (settled) clearTimeoutFn(timeoutTimer);
    else timer = timeoutTimer;
  });
}
export async function closeChromeShellLaunchForUpdate({
  launch: launch,
  env: env = process.env,
  platform: platform = process.platform,
  spawnProcess: spawnProcess = spawn,
  controlWindow: controlWindow = controlChromeShellLaunchWindow,
  setTimeoutFn: setTimeoutFn = setTimeout,
  clearTimeoutFn: clearTimeoutFn = clearTimeout,
  gracefulTimeoutMs: gracefulTimeoutMs = TRACKED_CLOSE_GRACE_MS,
  forceTimeoutMs: forceTimeoutMs = TRACKED_CLOSE_FORCE_MS,
} = {}) {
  if (!launch) return true;
  if (launch.detached === true)
    return controlWindow({
      launch: launch,
      action: 'close',
      env: env,
      platform: platform,
      spawnProcess: spawnProcess,
      setTimeoutFn: setTimeoutFn,
      clearTimeoutFn: clearTimeoutFn,
    });
  const child = launch.process;
  if (
    !child ||
    (child.exitCode !== null && child.exitCode !== undefined) ||
    (child.signalCode !== null && child.signalCode !== undefined)
  )
    return true;
  if (platform === 'win32' && readPositiveInteger(child.pid)) {
    await runWindowsTaskkill({
      pid: child.pid,
      force: false,
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
      return true;
    return (
      await runWindowsTaskkill({
        pid: child.pid,
        force: true,
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
    child.kill?.();
  } catch {
    return (
      (child.exitCode !== null && child.exitCode !== undefined) ||
      (child.signalCode !== null && child.signalCode !== undefined)
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
  const state = String(record.show_state || record.state || '').toLowerCase(),
    fullscreen =
      record.fullscreen === true ||
      record.isFullscreen === true ||
      record.is_fullscreen === true ||
      state.includes('fullscreen'),
    maximized =
      record.maximized === true ||
      record.isMaximized === true ||
      record.is_maximized === true ||
      state.includes('maximized');
  return { fullscreen: fullscreen, maximized: maximized };
}
function normalizeChromeWindowPlacement(placement = {}) {
  if (!isPlainObject(placement)) return null;
  const left = readFiniteInteger(placement.left),
    top = readFiniteInteger(placement.top),
    right = readFiniteInteger(placement.right),
    bottom = readFiniteInteger(placement.bottom),
    width =
      readPositiveInteger(placement.width) ||
      (left !== null && right !== null ? Math.max(0, right - left) : 0),
    height =
      readPositiveInteger(placement.height) ||
      (top !== null && bottom !== null ? Math.max(0, bottom - top) : 0),
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
  if (placement) placements.push(placement);
  return (
    Object.values(node).forEach((value) => {
      collectChromeAppWindowPlacements(value, placements);
    }),
    placements
  );
}
function pickChromeAppWindowPlacement(preferences = {}) {
  const placements = collectChromeAppWindowPlacements(preferences?.browser?.app_window_placement);
  if (placements.length <= 0) return null;
  return [...placements].sort((a, b) => {
    const score = (placement) =>
      (placement.fullscreen ? 1000000000 : 0) +
      (placement.maximized ? 100000000 : 0) +
      placement.width * placement.height;
    return score(b) - score(a);
  })[0];
}
function readLegacyElectronWindowState(profileDir, readFile = readFileSync) {
  const statePath = path.join(path.dirname(String(profileDir || '')), 'window-state.json'),
    state = readJsonObject(statePath, readFile),
    width = readPositiveInteger(state.width),
    height = readPositiveInteger(state.height),
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
  const workArea = isPlainObject(display?.workArea) ? display.workArea : display;
  if (!isPlainObject(workArea)) return null;
  const x = readFiniteInteger(workArea.x),
    y = readFiniteInteger(workArea.y),
    width = readPositiveInteger(workArea.width),
    height = readPositiveInteger(workArea.height);
  if (x === null || y === null || !width || !height) return null;
  return { x: x, y: y, width: width, height: height };
}
function hasReasonableDisplayIntersection(windowState, workArea) {
  const overlapWidth = Math.max(
      0,
      Math.min(windowState.x + windowState.width, workArea.x + workArea.width) -
        Math.max(windowState.x, workArea.x),
    ),
    overlapHeight = Math.max(
      0,
      Math.min(windowState.y + windowState.height, workArea.y + workArea.height) -
        Math.max(windowState.y, workArea.y),
    ),
    minWidth = Math.min(240, Math.max(1, windowState.width * 0.2)),
    minHeight = Math.min(120, Math.max(1, windowState.height * 0.2));
  return overlapWidth >= minWidth && overlapHeight >= minHeight;
}
function distanceFromWindowCenterToWorkArea(windowState, workArea) {
  const centerX = windowState.x + windowState.width / 2,
    centerY = windowState.y + windowState.height / 2,
    clampedX = Math.min(Math.max(centerX, workArea.x), workArea.x + workArea.width),
    clampedY = Math.min(Math.max(centerY, workArea.y), workArea.y + workArea.height);
  return (centerX - clampedX) ** 2 + (centerY - clampedY) ** 2;
}
function constrainWindowStateToDisplayWorkAreas(windowState, displayWorkAreas) {
  if (
    !Array.isArray(displayWorkAreas) ||
    !windowState ||
    windowState.fullscreen ||
    windowState.maximized ||
    windowState.x === null ||
    windowState.y === null
  )
    return windowState;
  const workAreas = displayWorkAreas.map((display) => normalizeDisplayWorkArea(display)).filter(
    Boolean,
  );
  if (workAreas.length <= 0) return { ...windowState, x: null, y: null };
  if (workAreas.some((workArea) => hasReasonableDisplayIntersection(windowState, workArea)))
    return windowState;
  const nearest = [...workAreas].sort(
      (a, b) =>
        distanceFromWindowCenterToWorkArea(windowState, a) -
        distanceFromWindowCenterToWorkArea(windowState, b),
    )[0],
    width = Math.min(windowState.width, nearest.width),
    height = Math.min(windowState.height, nearest.height);
  return {
    ...windowState,
    x: nearest.x + Math.round((nearest.width - width) / 2),
    y: nearest.y + Math.round((nearest.height - height) / 2),
    width: width,
    height: height,
  };
}
function buildWindowStartupArgs(windowState) {
  if (!windowState) return [];
  if (windowState.fullscreen) return ['--start-fullscreen'];
  if (windowState.maximized) return ['--start-maximized'];
  if (!windowState.width || !windowState.height) return [];
  const args = ['--window-size=' + windowState.width + ',' + windowState.height];
  return (
    windowState.x !== null &&
      windowState.y !== null &&
      args.unshift('--window-position=' + windowState.x + ',' + windowState.y),
    args
  );
}
export function resolveChromeShellWindowStartupArgs({
  profileDir: profileDir,
  readFile: readFile = readFileSync,
  displayWorkAreas: displayWorkAreas = null,
} = {}) {
  const preferencesPath = path.join(String(profileDir || ''), 'Default', 'Preferences'),
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
  env: env = process.env,
  platform: platform = process.platform,
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
  now: now = () => Date.now(),
  displayWorkAreas: displayWorkAreas = null,
} = {}) {
  const browserPath = resolveChromeShellBrowserExecutable({ env: env, platform: platform, exists: exists });
  if (!browserPath) throw new Error('Chrome or Edge executable not found');
  const profileDir = resolveChromeShellProfileDir({ app: app, env: env, browserPath: browserPath });
  mkdir(profileDir, { recursive: true });
  const appIsPackaged = app?.isPackaged === true;
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
    spawnedAt = 0;
  try {
    ((spawnedAt = now()),
      (child = spawnProcess(browserPath, args, {
        stdio: ['ignore', 'ignore', 'pipe'],
        windowsHide: false,
      })));
  } catch (spawnError) {
    taskbarIdentity?.cancel?.();
    throw normalizeChromeShellSpawnError(spawnError);
  }
  const launch = {
    startupDiagnostics: attachChromeShellStartupDiagnostics(child),
    browserPath: browserPath,
    profileDir: profileDir,
    appUrl: resolvedAppUrl,
    process: child,
    spawnedAt: spawnedAt,
    detached: false,
    spawnError: null,
  };
  return (
    child?.once?.('error', (processError) => {
      const normalized = normalizeChromeShellSpawnError(processError);
      ((launch.spawnError = normalized), taskbarIdentity?.cancel?.(), onError?.(normalized));
    }),
    typeof onExit === 'function' &&
      child?.once?.('exit', (code, signal) =>
        onExit({ code: code, signal: signal, spawnedAt: spawnedAt }),
      ),
    taskbarIdentity?.attach(child),
    activateChromeShellWindowSoon({
      child: child,
      env: env,
      platform: platform,
      spawnProcess: spawnProcess,
    }),
    launch
  );
}
function shouldQuitWhenChromeShellExits(env = process.env) {
  return envFlag(env, 'AIC_CHROME_SHELL_KEEP_LAUNCHER') !== true;
}
export async function launchChromeShellWithLifecycle({
  app: app,
  appUrl: appUrl,
  env: env = process.env,
  platform: platform = process.platform,
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
  now: now = () => Date.now(),
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
        const runtimeMs = Math.max(0, now() - spawnedAt),
          context = { code: code, signal: signal, runtimeMs: runtimeMs };
        if (isCleanEarlyChromeShellExit({ ...context, graceMs: earlyExitGraceMs })) {
          if (launch) launch.detached = true;
          (logEvent?.({
            type: 'chrome_shell.early_exit_ignored',
            level: 'warn',
            source: 'main',
            message: 'Chrome shell process exited before the app-window grace period elapsed',
            context: {
              ...context,
              graceMs: earlyExitGraceMs,
              profileDir: launch?.profileDir || '',
              appUrl: launch?.appUrl || '',
            },
          }),
            onClosed?.({ ...context, detached: true }));
          return;
        }
        if (launch) launch.detached = false;
        logEvent?.({
          type: 'chrome_shell.exited',
          level: 'info',
          source: 'main',
          message: 'Chrome shell process exited',
          context: context,
        });
        const keepOpen = onClosed?.({ ...context, detached: false }) !== false;
        keepOpen && shouldQuitWhenChromeShellExits(env) && app?.quit?.();
      },
      onError: (error) => {
        const normalized = normalizeChromeShellSpawnError(error);
        if (launch) launch.spawnError = normalized;
        (logEvent?.({
          type: 'chrome_shell.spawn_error',
          level: 'error',
          source: 'main',
          message: 'Chrome shell process failed',
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
        browserPath: launch.browserPath,
        profileDir: launch.profileDir,
        appUrl: launch.appUrl,
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
