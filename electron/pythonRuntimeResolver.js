import path from 'node:path';
export function resolvePreferredRuntimePythonCommand({
  existsSync: existsSync,
  fallbackCommand: fallbackCommand = '',
  platform: platform = process.platform,
  runtimeRoot: runtimeRoot = '',
} = {}) {
  const candidates =
    platform === 'win32'
      ? [
          path.join(runtimeRoot, 'python', 'python.exe'),
          path.join(runtimeRoot, 'python', 'Scripts', 'python.exe'),
          fallbackCommand,
        ]
      : [
          path.join(runtimeRoot, 'python', 'bin', 'python3'),
          path.join(runtimeRoot, 'python', 'bin', 'python'),
          fallbackCommand,
        ];
  return candidates.find((candidate) => (path.isAbsolute(candidate) ? existsSync(candidate) : true));
}
const ASR_RUNTIME_DIRNAME = 'asr',
  RUNTIME_DIRNAME = 'runtime',
  CURRENT_STATE_FILENAME = 'current.json';
function normalizeRoot(value) {
  return String(value || '').trim();
}
function isSameOrInsidePath(candidate, baseDir) {
  const resolvedCandidate = path.resolve(candidate),
    resolvedBaseDir = path.resolve(baseDir),
    relativePath = path.relative(resolvedBaseDir, resolvedCandidate);
  return (
    relativePath === '' ||
    (!!relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath))
  );
}
export function resolveAsrRuntimeBaseDir(userDataRoot = '') {
  const root = normalizeRoot(userDataRoot);
  return root ? path.join(root, RUNTIME_DIRNAME, ASR_RUNTIME_DIRNAME) : '';
}
export function resolveAsrRuntimeStatePath(userDataRoot = '') {
  const baseDir = resolveAsrRuntimeBaseDir(userDataRoot);
  return baseDir ? path.join(baseDir, CURRENT_STATE_FILENAME) : '';
}
export function normalizeAsrRuntimeVersion(version = '') {
  const text = String(version || '').trim();
  return text.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'unknown';
}
export function resolveAsrRuntimeInstallDir({ userDataRoot: userDataRoot = '', version: version = '' } = {}) {
  const baseDir = resolveAsrRuntimeBaseDir(userDataRoot);
  if (!baseDir) return '';
  return path.join(baseDir, 'versions', normalizeAsrRuntimeVersion(version));
}
export function readInstalledAsrRuntimeState({
  userDataRoot: userDataRoot = '',
  existsSync: existsSync = () => false,
  readFileSync: readFileSync = () => '',
} = {}) {
  const statePath = resolveAsrRuntimeStatePath(userDataRoot);
  if (!statePath || !existsSync(statePath)) return null;
  try {
    const state = JSON.parse(String(readFileSync(statePath, 'utf8') || '{}')),
      runtimeRoot = normalizeRoot(state?.runtimeRoot),
      baseDir = resolveAsrRuntimeBaseDir(userDataRoot);
    if (!baseDir || !isSameOrInsidePath(runtimeRoot, baseDir)) return null;
    if (!runtimeRoot || !existsSync(runtimeRoot)) return null;
    return {
      version: String(state?.version || ''),
      runtimeRoot: runtimeRoot,
      platform: String(state?.platform || ''),
      arch: String(state?.arch || ''),
      installedAt: Number(state?.installedAt || 0) || 0,
    };
  } catch {
    return null;
  }
}
export function resolveAsrRuntimePythonCommand({
  userDataRoot: userDataRoot = '',
  existsSync: existsSync = () => false,
  readFileSync: readFileSync = () => '',
  fallbackCommand: fallbackCommand = '',
  platform: platform = process.platform,
} = {}) {
  const state = readInstalledAsrRuntimeState({
    userDataRoot: userDataRoot,
    existsSync: existsSync,
    readFileSync: readFileSync,
  });
  if (!state?.runtimeRoot) return fallbackCommand;
  return resolvePreferredRuntimePythonCommand({
    existsSync: existsSync,
    fallbackCommand: fallbackCommand,
    platform: platform,
    runtimeRoot: state.runtimeRoot,
  });
}
