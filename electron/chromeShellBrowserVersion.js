import { spawnSync } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { unlinkSync } from 'node:fs';
import path from 'node:path';
import { resolveWindowsSystemToolPath } from './windowsSystemTools.js';
export const DEFAULT_MIN_CHROME_VERSION = '148.0.7778.280';
export const DEFAULT_MIN_EDGE_VERSION = '148.0.0.0';
export const DEFAULT_MIN_CHROMIUM_VERSION = DEFAULT_MIN_CHROME_VERSION;
const VERSION_CHECK_TIMEOUT_MS = 0x1388,
  SUPPORTED_BROWSER_KINDS = new Set(['chrome', 'edge', 'chromium']),
  WINDOWS_BROWSER_PATH_ENV_NAME = 'AIC_CHROME_SHELL_BROWSER_PATH_BASE64',
  WINDOWS_VERSION_SCRIPT = [
    '$encodedTarget = $env:' + WINDOWS_BROWSER_PATH_ENV_NAME,
    'if (-not $encodedTarget) { exit 2 }',
    '$target = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($encodedTarget))',
    'if\x20(-not\x20$target)\x20{\x20exit\x202\x20}',
    '$item = Get-Item -LiteralPath $target -ErrorAction Stop',
    '[Console]::Out.Write($item.VersionInfo.ProductVersion)',
  ]['join'](';\x20');
function parseVersionParts(value) {
  const match = String(value || '')['match'](/\b(\d+(?:\.\d+){1,3})\b/);
  if (!match) return null;
  const parts = match[0x1]['split']('.')['map']((part) => Number['parseInt'](part, 0xa));
  if (parts['some']((part) => !Number['isFinite'](part) || part < 0x0)) return null;
  while (parts['length'] < 0x4) parts['push'](0x0);
  return { text: match[0x1], parts: parts };
}
export function compareBrowserVersions(left, right) {
  const leftParsed = parseVersionParts(left),
    rightParsed = parseVersionParts(right);
  if (!leftParsed || !rightParsed) return null;
  for (let index = 0x0; index < 0x4; index += 0x1) {
    if (leftParsed['parts'][index] < rightParsed['parts'][index]) return -0x1;
    if (leftParsed['parts'][index] > rightParsed['parts'][index]) return 0x1;
  }
  return 0x0;
}
export function identifyChromeShellBrowser(browserPath) {
  const baseName = path['basename'](String(browserPath || ''))['toLowerCase']();
  if (
    baseName === 'chrome.exe' ||
    baseName === 'chrome' ||
    baseName === 'google chrome' ||
    baseName === 'google-chrome' ||
    baseName === 'google-chrome-stable'
  )
    return 'chrome';
  if (
    baseName === 'msedge.exe' ||
    baseName === 'msedge' ||
    baseName === 'microsoft edge' ||
    baseName === 'microsoft-edge' ||
    baseName === 'microsoft-edge-stable'
  )
    return 'edge';
  if (baseName === 'chromium' || baseName === 'chromium-browser') return 'chromium';
  return 'unknown';
}
function extractVersionFromProcessResult(result) {
  if (result?.['status'] !== 0x0 || result?.['error'] || result?.['signal']) return '';
  return parseVersionParts(result?.['stdout'])?.['text'] || '';
}
export function readBrowserExecutableVersion({
  browserPath: browserPath,
  env: env = process['env'],
  platform: platform = process['platform'],
  spawnProcess: spawnProcess = spawnSync,
} = {}) {
  const resolvedPath = String(browserPath || '')['trim']();
  if (!resolvedPath) return '';
  try {
    if (platform === 'win32') {
      const processResult = spawnProcess(
        resolveWindowsSystemToolPath('powershell', { env: env }),
        [
          '-NoLogo',
          '-NoProfile',
          '-NonInteractive',
          '-ExecutionPolicy',
          'Bypass',
          '-Command',
          WINDOWS_VERSION_SCRIPT,
        ],
        {
          encoding: 'utf8',
          env: {
            ...env,
            [WINDOWS_BROWSER_PATH_ENV_NAME]: Buffer['from'](resolvedPath, 'utf8')['toString']('base64'),
          },
          timeout: VERSION_CHECK_TIMEOUT_MS,
          windowsHide: true,
        },
      );
      return extractVersionFromProcessResult(processResult);
    }
    const processResult = spawnProcess(resolvedPath, ['--version'], {
      encoding: 'utf8',
      timeout: VERSION_CHECK_TIMEOUT_MS,
      windowsHide: true,
    });
    return extractVersionFromProcessResult(processResult);
  } catch {
    return '';
  }
}
function resolveMinimumBrowserVersion(browserKind, env = process['env']) {
  const envName =
      browserKind === 'edge'
        ? 'AIC_CHROME_SHELL_MIN_EDGE_VERSION'
        : browserKind === 'chromium'
          ? 'AIC_CHROME_SHELL_MIN_CHROMIUM_VERSION'
          : 'AIC_CHROME_SHELL_MIN_CHROME_VERSION',
    configuredVersion = parseVersionParts(env?.[envName])?.['text'];
  if (configuredVersion) return configuredVersion;
  if (browserKind === 'edge') return DEFAULT_MIN_EDGE_VERSION;
  if (browserKind === 'chromium') return DEFAULT_MIN_CHROMIUM_VERSION;
  return DEFAULT_MIN_CHROME_VERSION;
}
function clearRememberedBrowserChoice(preferencePath, unlink = unlinkSync) {
  if (!preferencePath) return;
  try {
    unlink(preferencePath);
  } catch {}
}
export function inspectChromeShellBrowserVersion({
  browserPath: browserPath,
  env: env = process['env'],
  platform: platform = process['platform'],
  spawnProcess: spawnProcess = spawnSync,
} = {}) {
  const browserKind = identifyChromeShellBrowser(browserPath),
    minimumVersion = resolveMinimumBrowserVersion(browserKind, env);
  if (!SUPPORTED_BROWSER_KINDS['has'](browserKind))
    return {
      browserKind: browserKind,
      browserPath: String(browserPath || ''),
      version: '',
      minimumVersion: minimumVersion,
      checked: false,
      outdated: true,
      reason: 'unsupported-browser',
    };
  const version = readBrowserExecutableVersion({
      browserPath: browserPath,
      env: env,
      platform: platform,
      spawnProcess: spawnProcess,
    }),
    comparison = compareBrowserVersions(version, minimumVersion);
  if (comparison === null)
    return {
      browserKind: browserKind,
      browserPath: String(browserPath || ''),
      version: '',
      minimumVersion: minimumVersion,
      checked: false,
      outdated: true,
      reason: 'version-unavailable',
    };
  return {
    browserKind: browserKind,
    browserPath: String(browserPath || ''),
    version: version,
    minimumVersion: minimumVersion,
    checked: true,
    outdated: comparison < 0x0,
    reason: comparison < 0x0 ? 'version-too-old' : 'supported',
  };
}
export async function checkChromeShellBrowserVersionBeforeLaunch({
  browserPath: browserPath,
  edgeBrowserPath: edgeBrowserPath = '',
  preferencePath: preferencePath = '',
  env: env = process['env'],
  platform: platform = process['platform'],
  spawnProcess: spawnProcess = spawnSync,
  logEvent: logEvent = null,
  unlink: unlink = unlinkSync,
} = {}) {
  clearRememberedBrowserChoice(preferencePath, unlink);
  const inspection = inspectChromeShellBrowserVersion({
    browserPath: browserPath,
    env: env,
    platform: platform,
    spawnProcess: spawnProcess,
  });
  logEvent?.({
    type: 'chrome_shell.browser_version_checked',
    level: inspection['outdated'] ? 'warn' : 'info',
    source: 'main',
    message:
      inspection['reason'] === 'version-unavailable'
        ? 'Browser version could not be verified'
        : inspection['outdated']
          ? 'Browser version is below the supported minimum'
          : 'Browser version check completed',
    context: inspection,
  });
  if (inspection['checked'] && !inspection['outdated'])
    return {
      continueLaunch: true,
      action: 'continue',
      browserPath: inspection['browserPath'],
      inspection: inspection,
    };
  let fallbackInspection = null;
  if (edgeBrowserPath && path['resolve'](edgeBrowserPath) !== path['resolve'](inspection['browserPath'])) {
    ((fallbackInspection = inspectChromeShellBrowserVersion({
      browserPath: edgeBrowserPath,
      env: env,
      platform: platform,
      spawnProcess: spawnProcess,
    })),
      logEvent?.({
        type: 'chrome_shell.fallback_browser_version_checked',
        level: fallbackInspection['checked'] && !fallbackInspection['outdated'] ? 'info' : 'warn',
        source: 'main',
        message: 'Fallback\x20browser\x20version\x20check\x20completed',
        context: fallbackInspection,
      }));
    if (fallbackInspection['checked'] && !fallbackInspection['outdated'])
      return (
        logEvent?.({
          type: 'chrome_shell.safe_browser_fallback_selected',
          level: 'warn',
          source: 'main',
          message: 'Unsafe primary browser was replaced with a validated Edge fallback',
          context: { primary: inspection, fallback: fallbackInspection },
        }),
        {
          continueLaunch: true,
          action: 'edge-fallback',
          browserPath: fallbackInspection['browserPath'],
          inspection: inspection,
          fallbackInspection: fallbackInspection,
        }
      );
  }
  return (
    logEvent?.({
      type: 'chrome_shell.electron_fallback_required',
      level: 'error',
      source: 'main',
      message: 'No validated external browser is available; Electron fallback is required',
      context: { primary: inspection, fallback: fallbackInspection },
    }),
    {
      continueLaunch: false,
      action: 'electron-fallback',
      browserPath: inspection['browserPath'],
      inspection: inspection,
      fallbackInspection: fallbackInspection,
    }
  );
}
export const __chromeShellBrowserVersionForTest = {
  WINDOWS_VERSION_SCRIPT: WINDOWS_VERSION_SCRIPT,
  clearRememberedBrowserChoice: clearRememberedBrowserChoice,
  parseVersionParts: parseVersionParts,
  resolveMinimumBrowserVersion: resolveMinimumBrowserVersion,
};
