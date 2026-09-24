import { loadProject, resolveCanvasData, saveProject } from './projectService.js';
import { sanitizeMultiCanvasDataForPersistence } from '../utils/thumbnailPersistence.js';
import { requireOpenedProjectDocument } from './projectDocumentGuard.js';
import { captureRecoverySnapshotBeforeSave, clearRecoverySnapshotAfterSave } from './recoverySnapshotSaveGuard.js';
function getDesktopProjectApi() {
  const _0x257dc7 = globalThis.window?.electronAPI?.project;
  if (!_0x257dc7 || typeof _0x257dc7 !== 'object') return null;
  return _0x257dc7;
}
function isAutoDefaultRecentProject(_0x55a42a) {
  const _0x5f800 = String(_0x55a42a?.filename || '')
      .trim()
      .toLowerCase(),
    _0x4ec36d = String(_0x55a42a?.name || '').trim(),
    _0xcf7ae1 = String(_0x55a42a?.displayPath || _0x55a42a?.path || '');
  return (
    /\.(?:aicanvas|aicproj|json)$/i.test(_0x5f800) &&
    _0x5f800.replace(/\.(?:aicanvas|aicproj|json)$/i, '') === '默认画布' &&
    _0x4ec36d === '默认画布' &&
    /(^|[\\/])user[\\/]Canvas Project[\\/]/i.test(_0xcf7ae1)
  );
}
export function canUseDesktopProjectApi() {
  const _0x424bad = getDesktopProjectApi();
  return !!(
    _0x424bad &&
    typeof _0x424bad.open === 'function' &&
    typeof _0x424bad.save === 'function' &&
    typeof _0x424bad.listRecent === 'function' &&
    typeof _0x424bad.removeRecent === 'function'
  );
}
export function normalizeDesktopProjectOpenResult(_0x4b1d99) {
  if (!_0x4b1d99 || _0x4b1d99.canceled) return _0x4b1d99 || { canceled: true };
  return { ..._0x4b1d99, multiData: resolveCanvasData(requireOpenedProjectDocument(_0x4b1d99)) };
}
export async function openDesktopProject(_0x2d7c36 = {}) {
  const _0x2370f7 = getDesktopProjectApi();
  if (!_0x2370f7 || typeof _0x2370f7.open !== 'function')
    throw new Error('Electron project API is unavailable');
  const _0x2beded = await _0x2370f7.open({ recentId: _0x2d7c36.recentId || '' });
  return normalizeDesktopProjectOpenResult(_0x2beded);
}
export async function saveDesktopProject(_0x377ffa, _0x264b61, _0x3f258b = {}) {
  const _0x12fc53 = sanitizeMultiCanvasDataForPersistence(_0x264b61 || {}),
    _0x247655 = getDesktopProjectApi();
  if (_0x247655 && typeof _0x247655.save === 'function') {
    const recoveryBeforeSave = await captureRecoverySnapshotBeforeSave(_0x247655);
    const _0x34b37f = await _0x247655.save({
      projectName: _0x377ffa,
      projectId: _0x3f258b.projectId || globalThis.window?.currentProjectId || '',
      recentId: _0x3f258b.recentId || globalThis.window?._v2CurrentRecentProjectId || '',
      mode: _0x3f258b.mode || 'save',
      multiData: _0x12fc53,
    });
    if (_0x34b37f?.success) await clearRecoverySnapshotAfterSave(_0x247655, recoveryBeforeSave, _0x34b37f);
    return _0x34b37f;
  }
  return await saveProject(_0x377ffa, _0x12fc53);
}
export async function exportDesktopProjectPackage(_0x4da155, _0x3d808a, _0x3b7688 = {}) {
  const _0x48d7fe = sanitizeMultiCanvasDataForPersistence(_0x3d808a || {}),
    _0x245ff0 = getDesktopProjectApi();
  if (!_0x245ff0 || typeof _0x245ff0.exportPackage !== 'function')
    throw new Error('Electron project package export API is unavailable');
  return await _0x245ff0.exportPackage({
    projectName: _0x4da155,
    projectId: _0x3b7688.projectId || globalThis.window?.currentProjectId || '',
    recentId: _0x3b7688.recentId || globalThis.window?._v2CurrentRecentProjectId || '',
    displayPath: _0x3b7688.displayPath || globalThis.window?._v2CurrentProjectDisplayPath || '',
    operationId: _0x3b7688.operationId || '',
    multiData: _0x48d7fe,
  });
}
export async function importDesktopProjectPackage(_0x50868e = {}) {
  const _0x3f8c8b = getDesktopProjectApi();
  if (!_0x3f8c8b || typeof _0x3f8c8b.importPackage !== 'function')
    throw new Error('Electron project package import API is unavailable');
  const _0x11b605 = await _0x3f8c8b.importPackage({
    path: _0x50868e.path || '',
    operationId: _0x50868e.operationId || '',
  });
  return normalizeDesktopProjectOpenResult(_0x11b605);
}
export async function listDesktopRecentProjects() {
  const _0x29134b = getDesktopProjectApi();
  if (!_0x29134b || typeof _0x29134b.listRecent !== 'function') return [];
  const _0x28f249 = await _0x29134b.listRecent();
  return Array.isArray(_0x28f249)
    ? _0x28f249.filter((_0x56a82a) => !isAutoDefaultRecentProject(_0x56a82a))
    : [];
}
export async function removeDesktopRecentProject(_0x36f495) {
  const _0x4de6c3 = getDesktopProjectApi();
  if (!_0x4de6c3 || typeof _0x4de6c3.removeRecent !== 'function') return [];
  const _0x4b0173 = await _0x4de6c3.removeRecent({ recentId: _0x36f495 });
  return Array.isArray(_0x4b0173) ? _0x4b0173 : [];
}
export async function loadProjectWithFallback(_0x22938c) {
  return await loadProject(_0x22938c);
}
