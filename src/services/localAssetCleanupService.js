import { t } from '../i18n/index.js';
function getCleanupApi() {
  const _0x7ce00f = globalThis.window?.electronAPI?.localAssetCleanup;
  return _0x7ce00f && typeof _0x7ce00f === 'object' ? _0x7ce00f : null;
}
function cleanupText(_0x1bb069, _0x5c65c7 = {}) {
  return t('settings.fileSave.cleanupRuntime.' + _0x1bb069, _0x5c65c7);
}
export function canUseLocalAssetCleanup() {
  const _0x1def3d = getCleanupApi();
  return !!(_0x1def3d && typeof _0x1def3d.scan === 'function' && typeof _0x1def3d.trash === 'function');
}
export function getCurrentProjectSnapshotForCleanup() {
  const _0x5c1697 = globalThis.window?.CanvasTabManager;
  if (!_0x5c1697 || typeof _0x5c1697.getMultiDataSnapshot !== 'function') return null;
  try {
    return (
      _0x5c1697.getMultiDataSnapshot({ sanitizeForPersistence: false, captureVisualSnapshot: false }) || null
    );
  } catch {
    return null;
  }
}
export async function scanLocalAssetCleanup(_0x36974a = {}) {
  const _0x185506 = getCleanupApi();
  if (!canUseLocalAssetCleanup()) throw new Error(cleanupText('notSupported'));
  const _0x4d44a5 = Object.prototype.hasOwnProperty.call(_0x36974a, 'currentProjectSnapshot')
    ? _0x36974a.currentProjectSnapshot
    : getCurrentProjectSnapshotForCleanup();
  return await _0x185506.scan({
    currentProjectSnapshot: _0x4d44a5,
    ...(_0x36974a?.scope ? { scope: _0x36974a.scope } : {}),
  });
}
export async function scanLegacyLocalAssetCleanup(_0x4d74d3 = {}) {
  return await scanLocalAssetCleanup({ ..._0x4d74d3, scope: 'legacy-defaults' });
}
export async function trashLocalAssetCleanup(_0x307d30, _0x4c02b2, _0x46dd6e = {}) {
  const _0x3f9a61 = getCleanupApi();
  if (!canUseLocalAssetCleanup()) throw new Error(cleanupText('notSupported'));
  const _0x55dcc0 = typeof _0x307d30 === 'string' ? _0x307d30 : String(_0x307d30?.scanId || '').trim(),
    _0x29db84 = typeof _0x307d30 === 'string' ? '' : String(_0x307d30?.scope || '').trim(),
    _0x2348d5 = Object.prototype.hasOwnProperty.call(_0x46dd6e, 'currentProjectSnapshot')
      ? _0x46dd6e.currentProjectSnapshot
      : getCurrentProjectSnapshotForCleanup();
  return await _0x3f9a61.trash({
    scanId: _0x55dcc0,
    localPaths: Array.isArray(_0x4c02b2) ? _0x4c02b2 : [],
    currentProjectSnapshot: _0x2348d5,
    ...(_0x46dd6e?.scope || _0x29db84 ? { scope: _0x46dd6e?.scope || _0x29db84 } : {}),
  });
}
export function formatCleanupBytes(_0x43e525) {
  const _0x2bfb38 = Number(_0x43e525 || 0);
  if (!Number.isFinite(_0x2bfb38) || _0x2bfb38 <= 0) return '0 B';
  const _0x43016f = ['B', 'KB', 'MB', 'GB', 'TB'];
  let _0x5461f6 = _0x2bfb38,
    _0x37add4 = 0;
  while (_0x5461f6 >= 0x400 && _0x37add4 < _0x43016f.length - 1) {
    ((_0x5461f6 /= 0x400), (_0x37add4 += 1));
  }
  const _0x115993 = _0x5461f6 >= 100 || _0x37add4 === 0 ? 0 : _0x5461f6 >= 10 ? 1 : 2;
  return _0x5461f6.toFixed(_0x115993) + ' ' + _0x43016f[_0x37add4];
}
export function summarizeLocalAssetCleanupScan(_0x125249 = {}) {
  const _0x1822ce = Number(_0x125249?.orphanCount || 0),
    _0x2bc743 = Number(_0x125249?.candidateCount || 0),
    _0x28588d = Number(_0x125249?.orphanBytes || 0);
  if (!_0x125249?.ok) return cleanupText('scanIncomplete');
  if (_0x1822ce <= 0) return cleanupText('scanEmptySummary', { candidateCount: _0x2bc743 });
  return cleanupText('scanFoundSummary', {
    candidateCount: _0x2bc743,
    orphanCount: _0x1822ce,
    orphanBytes: formatCleanupBytes(_0x28588d),
  });
}
