import { t } from '../i18n/index.js';
function getCleanupApi() {
  const value = globalThis.window?.electronAPI?.localAssetCleanup;
  return value && typeof value === 'object' ? value : null;
}
function cleanupText(item, key = {}) {
  return t('settings.fileSave.cleanupRuntime.' + item, key);
}
export function canUseLocalAssetCleanup() {
  const cleanupApi = getCleanupApi();
  return !!(cleanupApi && typeof cleanupApi.scan === 'function' && typeof cleanupApi.trash === 'function');
}
export function getCurrentProjectSnapshotForCleanup() {
  const enabled = globalThis.window?.CanvasTabManager;
  if (!enabled || typeof enabled.getMultiDataSnapshot !== 'function') return null;
  try {
    return (
      enabled.getMultiDataSnapshot({ sanitizeForPersistence: false, captureVisualSnapshot: false }) || null
    );
  } catch {
    return null;
  }
}
export async function scanLocalAssetCleanup(scope = {}) {
  const cleanupApi2 = getCleanupApi();
  if (!canUseLocalAssetCleanup()) throw new Error(cleanupText('notSupported'));
  const currentProjectSnapshot = Object.prototype.hasOwnProperty.call(scope, 'currentProjectSnapshot')
    ? scope.currentProjectSnapshot
    : getCurrentProjectSnapshotForCleanup();
  return await cleanupApi2.scan({
    currentProjectSnapshot: currentProjectSnapshot,
    ...(scope?.scope ? { scope: scope.scope } : {}),
  });
}
export async function scanLegacyLocalAssetCleanup(args = {}) {
  return await scanLocalAssetCleanup({ ...args, scope: 'legacy-defaults' });
}
export async function trashLocalAssetCleanup(index, result, scope2 = {}) {
  const cleanupApi3 = getCleanupApi();
  if (!canUseLocalAssetCleanup()) throw new Error(cleanupText('notSupported'));
  const scanId = typeof index === 'string' ? index : String(index?.scanId || '').trim(),
    data = typeof index === 'string' ? '' : String(index?.scope || '').trim(),
    currentProjectSnapshot2 = Object.prototype.hasOwnProperty.call(scope2, 'currentProjectSnapshot')
      ? scope2.currentProjectSnapshot
      : getCurrentProjectSnapshotForCleanup();
  return await cleanupApi3.trash({
    scanId: scanId,
    localPaths: Array.isArray(result) ? result : [],
    currentProjectSnapshot: currentProjectSnapshot2,
    ...(scope2?.scope || data ? { scope: scope2?.scope || data } : {}),
  });
}
export function formatCleanupBytes(options) {
  const count = Number(options || 0);
  if (!Number.isFinite(count) || count <= 0) return '0 B';
  const list = ['B', 'KB', 'MB', 'GB', 'TB'];
  let count2 = count,
    count3 = 0;
  while (count2 >= 0x400 && count3 < list.length - 1) {
    ((count2 /= 0x400), (count3 += 1));
  }
  const target = count2 >= 100 || count3 === 0 ? 0 : count2 >= 10 ? 1 : 2;
  return count2.toFixed(target) + ' ' + list[count3];
}
export function summarizeLocalAssetCleanupScan(response = {}) {
  const orphanCount = Number(response?.orphanCount || 0),
    candidateCount = Number(response?.candidateCount || 0),
    source = Number(response?.orphanBytes || 0);
  if (!response?.ok) return cleanupText('scanIncomplete');
  if (orphanCount <= 0) return cleanupText('scanEmptySummary', { candidateCount: candidateCount });
  return cleanupText('scanFoundSummary', {
    candidateCount: candidateCount,
    orphanCount: orphanCount,
    orphanBytes: formatCleanupBytes(source),
  });
}
