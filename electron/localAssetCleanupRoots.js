import path from 'node:path';
import { buildLocalAssetCleanupRoots } from './localAssetCleanup.js';
function isSameResolvedPath(value, item, key = process.platform) {
  try {
    const index = path.resolve(String(value || '')),
      result = path.resolve(String(item || ''));
    return key === 'win32' || key === 'darwin'
      ? index.toLowerCase() === result.toLowerCase()
      : index === result;
  } catch {
    return false;
  }
}
function getLegacyDefaultFileSavePaths({
  appIsPackaged: appIsPackaged,
  legacyFilesRoot: legacyFilesRoot,
  storageRoot: storageRoot,
  platform: platform = process.platform,
}) {
  if (!appIsPackaged) return {};
  if (!legacyFilesRoot || isSameResolvedPath(legacyFilesRoot, storageRoot, platform)) return {};
  return {
    canvasDir: path.join(legacyFilesRoot, 'Canvas Project'),
    dataDir: path.join(legacyFilesRoot, 'data'),
    outputDir: path.join(legacyFilesRoot, 'output'),
  };
}
function buildLegacyDefaults({
  dataDir: dataDir,
  recentProjectsStorePath: recentProjectsStorePath,
  recoverySnapshotPath: recoverySnapshotPath,
}) {
  const assetsDir = String(dataDir || '').trim();
  return {
    canvasDir: '',
    outputDir: '',
    dataDir: '',
    uploadsDir: '',
    assetsDir: assetsDir ? path.join(assetsDir, 'assets') : '',
    workflowsDir: assetsDir ? path.join(assetsDir, 'workflows') : '',
    workflowThumbsDir: assetsDir ? path.join(assetsDir, 'workflows', 'thumbs') : '',
    recentProjectsStorePath: recentProjectsStorePath,
    recoverySnapshotPath: recoverySnapshotPath,
  };
}
export async function readFileSavePathsForLocalCleanup({
  requestLocalJson: requestLocalJson,
  logDiagnosticEvent: logDiagnosticEvent,
}) {
  try {
    const data = await requestLocalJson('/api/v2/user/settings.json');
    return data?.fileSavePaths && typeof data.fileSavePaths === 'object' ? data.fileSavePaths : {};
  } catch (error) {
    return (
      logDiagnosticEvent?.({
        type: 'local_asset_cleanup.settings_read_failed',
        level: 'warn',
        source: 'main',
        message: 'Failed to read current file save paths for local asset cleanup',
        error: error,
      }),
      {}
    );
  }
}
export function createLocalAssetCleanupRootsResolver({
  appIsPackaged: appIsPackaged2,
  legacyFilesRoot: legacyFilesRoot2,
  storageRoot: storageRoot2,
  getCurrentDefaults: getCurrentDefaults,
  readCurrentFileSavePaths: readCurrentFileSavePaths,
  platform: platform = process.platform,
}) {
  return async function run(options = {}) {
    const defaults = String(options?.scope || 'current').trim(),
      recentProjectsStorePath2 = getCurrentDefaults?.() || {},
      fileSavePaths =
        defaults === 'legacy-defaults'
          ? getLegacyDefaultFileSavePaths({
              appIsPackaged: appIsPackaged2,
              legacyFilesRoot: legacyFilesRoot2,
              storageRoot: storageRoot2,
              platform: platform,
            })
          : await readCurrentFileSavePaths?.();
    return buildLocalAssetCleanupRoots({
      fileSavePaths: fileSavePaths,
      defaults:
        defaults === 'legacy-defaults'
          ? buildLegacyDefaults({
              dataDir: fileSavePaths?.dataDir,
              recentProjectsStorePath: recentProjectsStorePath2.recentProjectsStorePath,
              recoverySnapshotPath: recentProjectsStorePath2.recoverySnapshotPath,
            })
          : recentProjectsStorePath2,
    });
  };
}
