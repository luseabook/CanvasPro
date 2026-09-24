import path from 'node:path';

export const FUNASR_MODEL_DIR_NAME = 'funasr';

function normalizePathText(value) {
  return String(value || '').trim();
}

function pathBasenameEquals(candidate, expectedBasename) {
  return (
    path.basename(path.resolve(candidate)).toLowerCase() ===
    String(expectedBasename).toLowerCase()
  );
}

function sameResolvedPath(left, right) {
  return path.resolve(left) === path.resolve(right);
}

export function inferFileSaveRootDirFromManagedPaths(managedPaths = {}) {
  const managedCandidates = [
      [managedPaths.canvasDir, 'projects'],
      [managedPaths.dataDir, 'data'],
      [managedPaths.outputDir, 'output'],
    ]
      .map(([candidate, expectedBasename]) => [normalizePathText(candidate), expectedBasename])
      .filter(([candidate]) => !!candidate),
    parentDirs = managedCandidates
      .filter(([candidate, expectedBasename]) => pathBasenameEquals(candidate, expectedBasename))
      .map(([candidate]) => path.dirname(path.resolve(candidate)));

  if (parentDirs.length >= 2) {
    const firstParentDir = parentDirs[0];
    if (parentDirs.every((parentDir) => sameResolvedPath(parentDir, firstParentDir))) {
      return firstParentDir;
    }
  }

  const dataDir = normalizePathText(managedPaths.dataDir);
  if (dataDir && pathBasenameEquals(dataDir, 'data')) return path.dirname(path.resolve(dataDir));

  const outputDir = normalizePathText(managedPaths.outputDir);
  if (outputDir && pathBasenameEquals(outputDir, 'output')) {
    return path.dirname(path.resolve(outputDir));
  }

  const canvasDir = normalizePathText(managedPaths.canvasDir);
  if (canvasDir && pathBasenameEquals(canvasDir, 'projects')) {
    return path.dirname(path.resolve(canvasDir));
  }

  return '';
}

export function resolveFunasrModelRootDir(settings = {}, { fallbackDataDir = '' } = {}) {
  const configuredRootDir = normalizePathText(settings?.fileSavePathsMeta?.rootDir),
    rootDir =
      configuredRootDir ||
      inferFileSaveRootDirFromManagedPaths(settings?.fileSavePaths || {}) ||
      normalizePathText(fallbackDataDir);
  return rootDir ? path.join(path.resolve(rootDir), FUNASR_MODEL_DIR_NAME) : '';
}
