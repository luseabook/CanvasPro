import path from 'node:path';
import {
  isSupportedProjectFileExtension,
  listRecentProjects,
} from '../src/services/desktopProjectFileStore.js';
export function canUseSystemRecentDocuments(_0xc3cb2e = process.platform) {
  return _0xc3cb2e === 'darwin' || _0xc3cb2e === 'win32';
}
export function normalizeSystemRecentDocumentItems(_0x364949 = []) {
  if (!Array.isArray(_0x364949)) return [];
  return _0x364949
    .filter((_0x546608) => _0x546608 && _0x546608.exists !== false)
    .map((_0x2fe464) => String(_0x2fe464.path || '').trim())
    .filter((_0xeeb397) => path.isAbsolute(_0xeeb397))
    .filter((_0xe2b1a9) => isSupportedProjectFileExtension(_0xe2b1a9));
}
export function syncSystemRecentDocuments({
  app: _0x1aa2ce,
  items: _0x4faf7b,
  platform: platform = process.platform,
} = {}) {
  if (!canUseSystemRecentDocuments(platform)) return { ok: true, skipped: 'platform', count: 0, paths: [] };
  if (
    typeof _0x1aa2ce?.clearRecentDocuments !== 'function' ||
    typeof _0x1aa2ce?.addRecentDocument !== 'function'
  )
    return { ok: false, error: 'Recent document API is unavailable', count: 0, paths: [] };
  const _0x319a54 = normalizeSystemRecentDocumentItems(_0x4faf7b),
    _0x4f1e7b = [..._0x319a54].reverse();
  return (
    _0x1aa2ce.clearRecentDocuments(),
    _0x4f1e7b.forEach((_0x174efc) => {
      _0x1aa2ce.addRecentDocument(_0x174efc);
    }),
    { ok: true, count: _0x319a54.length, paths: _0x319a54 }
  );
}
export function syncRecentProjectsToSystemRecentDocuments({
  app: _0x3d0763,
  recentStorePath: _0x1ab553,
  listRecentProjectsImpl: listRecentProjectsImpl = listRecentProjects,
  platform: platform = process.platform,
} = {}) {
  const _0x4e2474 = listRecentProjectsImpl(_0x1ab553);
  return syncSystemRecentDocuments({ app: _0x3d0763, items: _0x4e2474, platform: platform });
}
