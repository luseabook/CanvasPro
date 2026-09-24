import path from 'node:path';

import { inferFileSaveRootDirFromManagedPaths } from './funasrModelRoot.js';

export const SORTFORMER_MODEL_DIR_NAME = 'sortformer';

function normalizePathText(value) {
  return String(value || '').trim();
}

export function resolveSortformerModelRootDir(settings = {}, { fallbackDataDir = '' } = {}) {
  const configuredRootDir = normalizePathText(settings?.fileSavePathsMeta?.rootDir),
    rootDir =
      configuredRootDir ||
      inferFileSaveRootDirFromManagedPaths(settings?.fileSavePaths || {}) ||
      normalizePathText(fallbackDataDir);
  return rootDir ? path.join(path.resolve(rootDir), SORTFORMER_MODEL_DIR_NAME) : '';
}
