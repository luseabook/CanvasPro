import path from 'node:path';
import { buildLocalAssetCleanupRoots } from './localAssetCleanup.js';
function isSameResolvedPath(_0x94094f, _0x5242d4, _0x51b88f = process.platform) {
  try {
    const _0x164a02 = path.resolve(String(_0x94094f || '')),
      _0x42876d = path.resolve(String(_0x5242d4 || ''));
    return _0x51b88f === 'win32' || _0x51b88f === 'darwin'
      ? _0x164a02.toLowerCase() === _0x42876d.toLowerCase()
      : _0x164a02 === _0x42876d;
  } catch {
    return false;
  }
}
function getLegacyDefaultFileSavePaths({
  appIsPackaged: _0x2212c8,
  legacyFilesRoot: _0x37e2a1,
  storageRoot: _0x3478ac,
  platform: platform = process.platform,
}) {
  if (!_0x2212c8) return {};
  if (!_0x37e2a1 || isSameResolvedPath(_0x37e2a1, _0x3478ac, platform)) return {};
  return {
    canvasDir: path.join(_0x37e2a1, 'Canvas Project'),
    dataDir: path.join(_0x37e2a1, 'data'),
    outputDir: path.join(_0x37e2a1, 'output'),
  };
}
function buildLegacyDefaults({
  dataDir: _0x462f92,
  recentProjectsStorePath: _0x32da05,
  recoverySnapshotPath: _0x759473,
}) {
  const _0x18a888 = String(_0x462f92 || '').trim();
  return {
    canvasDir: '',
    outputDir: '',
    dataDir: '',
    uploadsDir: '',
    assetsDir: _0x18a888 ? path.join(_0x18a888, 'assets') : '',
    workflowsDir: _0x18a888 ? path.join(_0x18a888, 'workflows') : '',
    workflowThumbsDir: _0x18a888 ? path.join(_0x18a888, 'workflows', 'thumbs') : '',
    recentProjectsStorePath: _0x32da05,
    recoverySnapshotPath: _0x759473,
  };
}
export async function readFileSavePathsForLocalCleanup({
  requestLocalJson: _0x1b0539,
  logDiagnosticEvent: _0x179576,
}) {
  try {
    const _0x3e359d = await _0x1b0539('/api/v2/user/settings.json');
    return _0x3e359d?.fileSavePaths && typeof _0x3e359d.fileSavePaths === 'object'
      ? _0x3e359d.fileSavePaths
      : {};
  } catch (_0x591403) {
    return (
      _0x179576?.({
        type: 'local_asset_cleanup.settings_read_failed',
        level: 'warn',
        source: 'main',
        message: 'Failed to read current file save paths for local asset cleanup',
        error: _0x591403,
      }),
      {}
    );
  }
}
export function createLocalAssetCleanupRootsResolver({
  appIsPackaged: _0x45ce94,
  legacyFilesRoot: _0x5d5a1f,
  storageRoot: _0x59c506,
  getCurrentDefaults: _0x2132a5,
  readCurrentFileSavePaths: _0x24a904,
  platform: platform = process.platform,
}) {
  return async function _0x507aa3(_0x390390 = {}) {
    const _0x40d3ab = String(_0x390390?.scope || 'current').trim(),
      _0x3abdec = _0x2132a5?.() || {},
      _0xc80251 =
        _0x40d3ab === 'legacy-defaults'
          ? getLegacyDefaultFileSavePaths({
              appIsPackaged: _0x45ce94,
              legacyFilesRoot: _0x5d5a1f,
              storageRoot: _0x59c506,
              platform: platform,
            })
          : await _0x24a904?.();
    return buildLocalAssetCleanupRoots({
      fileSavePaths: _0xc80251,
      defaults:
        _0x40d3ab === 'legacy-defaults'
          ? buildLegacyDefaults({
              dataDir: _0xc80251?.dataDir,
              recentProjectsStorePath: _0x3abdec.recentProjectsStorePath,
              recoverySnapshotPath: _0x3abdec.recoverySnapshotPath,
            })
          : _0x3abdec,
    });
  };
}
