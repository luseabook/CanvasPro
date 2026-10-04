import path from 'node:path';
import {
  isSupportedProjectFileExtension,
  listRecentProjects,
} from '../src/services/desktopProjectFileStore.js';
export function canUseSystemRecentDocuments(value = process.platform) {
  return value === 'darwin' || value === 'win32';
}
export function normalizeSystemRecentDocumentItems(list = []) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && item.exists !== false)
    .map((item2) => String(item2.path || '').trim())
    .filter((item3) => path.isAbsolute(item3))
    .filter((item4) => isSupportedProjectFileExtension(item4));
}
export function syncSystemRecentDocuments({
  app: app,
  items: items,
  platform: platform = process.platform,
} = {}) {
  if (!canUseSystemRecentDocuments(platform)) return { ok: true, skipped: 'platform', count: 0, paths: [] };
  if (typeof app?.clearRecentDocuments !== 'function' || typeof app?.addRecentDocument !== 'function')
    return { ok: false, error: 'Recent document API is unavailable', count: 0, paths: [] };
  const count = normalizeSystemRecentDocumentItems(items),
    list2 = [...count].reverse();
  return (
    app.clearRecentDocuments(),
    list2.forEach((item5) => {
      app.addRecentDocument(item5);
    }),
    { ok: true, count: count.length, paths: count }
  );
}
export function syncRecentProjectsToSystemRecentDocuments({
  app: app2,
  recentStorePath: recentStorePath,
  listRecentProjectsImpl: listRecentProjectsImpl = listRecentProjects,
  platform: platform = process.platform,
} = {}) {
  const items2 = listRecentProjectsImpl(recentStorePath);
  return syncSystemRecentDocuments({ app: app2, items: items2, platform: platform });
}
