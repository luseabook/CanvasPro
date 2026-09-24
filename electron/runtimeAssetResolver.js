import path from 'node:path';
const RUNTIME_DIRNAME = 'runtime',
  DEV_RUNTIME_DIR = path.join('.electron-runtime', 'runtime'),
  CERTIFI_CA_BUNDLE_RELATIVE_PATH = path.join('site-packages', 'certifi', 'cacert.pem');
function normalizeRoot(value) {
  return String(value || '').trim();
}
function getDirectoryEntryName(entry) {
  return typeof entry === 'string' ? entry : String(entry?.name || '');
}
function isDirectoryEntry(entry) {
  return typeof entry?.isDirectory === 'function' ? entry.isDirectory() : true;
}
function collectPythonLibCaBundleCandidates({ pythonRoot: pythonRoot, readdirSync: readdirSync }) {
  const libDir = path.join(pythonRoot, 'lib');
  let entries = [];
  try {
    entries = readdirSync(libDir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => isDirectoryEntry(entry))
    .map((entry) => getDirectoryEntryName(entry))
    .filter((name) => /^python\d+(?:\.\d+)*$/i.test(name))
    .map((name) => path.join(libDir, name, CERTIFI_CA_BUNDLE_RELATIVE_PATH));
}
export function resolveRuntimeRoot({
  appIsPackaged: appIsPackaged = false,
  appRoot: appRoot = '',
  resourcesPath: resourcesPath = '',
} = {}) {
  const baseDir = normalizeRoot(appIsPackaged ? resourcesPath : appRoot);
  if (!baseDir) return '';
  return appIsPackaged
    ? path.join(baseDir, RUNTIME_DIRNAME)
    : path.join(baseDir, DEV_RUNTIME_DIR);
}
export function resolveRuntimeToolPath({
  name: name,
  runtimeRoot: runtimeRoot,
  appIsPackaged: appIsPackaged = true,
  appRoot: appRoot = '',
  platform: platform = process.platform,
  existsSync: existsSync = () => false,
} = {}) {
  const toolName = String(name || '').trim(),
    baseDir = normalizeRoot(runtimeRoot);
  if (!toolName || !baseDir) return '';
  const executableName =
      platform === 'win32' && !toolName.toLowerCase().endsWith('.exe')
        ? toolName + '.exe'
        : toolName,
    candidates = [path.join(baseDir, 'ffmpeg', 'bin', executableName)];
  return (
    !appIsPackaged &&
      platform === 'win32' &&
      normalizeRoot(appRoot) &&
      candidates.unshift(path.join(appRoot, 'vendor', 'ffmpeg', 'windows-x64', 'bin', executableName)),
    candidates.find((candidate) => existsSync(candidate)) || ''
  );
}
export function resolveRuntimeDreaminaCliPath({
  runtimeRoot: runtimeRoot,
  platform: platform = process.platform,
  existsSync: existsSync = () => false,
} = {}) {
  const baseDir = normalizeRoot(runtimeRoot);
  if (!baseDir) return '';
  const executableName = platform === 'win32' ? 'dreamina.exe' : 'dreamina',
    candidate = path.join(baseDir, 'dreamina', executableName);
  return existsSync(candidate) ? candidate : '';
}
export function resolveRuntimePythonCaBundlePath({
  runtimeRoot: runtimeRoot,
  existsSync: existsSync = () => false,
  readdirSync: readdirSync = () => [],
} = {}) {
  const baseDir = normalizeRoot(runtimeRoot);
  if (!baseDir) return '';
  const pythonRoot = path.join(baseDir, 'python'),
    candidates = [
      path.join(baseDir, 'backend', 'certifi', 'cacert.pem'),
      path.join(pythonRoot, 'Lib', CERTIFI_CA_BUNDLE_RELATIVE_PATH),
      ...collectPythonLibCaBundleCandidates({ pythonRoot: pythonRoot, readdirSync: readdirSync }),
    ];
  return candidates.find((candidate) => existsSync(candidate)) || '';
}
export function buildRuntimePythonCertificateEnv({
  runtimeRoot: runtimeRoot,
  existsSync: existsSync = () => false,
  readdirSync: readdirSync = () => [],
  env: env = {},
} = {}) {
  const existingBundle = [env.REQUESTS_CA_BUNDLE, env.SSL_CERT_FILE]
      .map((candidate) => normalizeRoot(candidate))
      .find((candidate) => candidate && existsSync(candidate)),
    caBundle =
      existingBundle ||
      resolveRuntimePythonCaBundlePath({
        runtimeRoot: runtimeRoot,
        existsSync: existsSync,
        readdirSync: readdirSync,
      });
  if (!caBundle) return {};
  return { SSL_CERT_FILE: caBundle, REQUESTS_CA_BUNDLE: caBundle };
}
export function buildRuntimeToolEnv({
  runtimeRoot: runtimeRoot,
  appIsPackaged: appIsPackaged = true,
  appRoot: appRoot = '',
  platform: platform = process.platform,
  existsSync: existsSync = () => false,
} = {}) {
  const codexCliPath = normalizeRoot(runtimeRoot)
    ? path.join(runtimeRoot, 'codex', platform === 'win32' ? 'codex.exe' : 'codex')
    : '';
  return {
    AIC_FFMPEG_EXE: resolveRuntimeToolPath({
      name: 'ffmpeg',
      runtimeRoot: runtimeRoot,
      appIsPackaged: appIsPackaged,
      appRoot: appRoot,
      platform: platform,
      existsSync: existsSync,
    }),
    AIC_FFPROBE_EXE: resolveRuntimeToolPath({
      name: 'ffprobe',
      runtimeRoot: runtimeRoot,
      appIsPackaged: appIsPackaged,
      appRoot: appRoot,
      platform: platform,
      existsSync: existsSync,
    }),
    AIC_DREAMINA_CLI_EXE: resolveRuntimeDreaminaCliPath({
      runtimeRoot: runtimeRoot,
      platform: platform,
      existsSync: existsSync,
    }),
    ...(codexCliPath && existsSync(codexCliPath) ? { AIC_CODEX_CLI_EXE: codexCliPath } : {}),
  };
}
