import { loadProject, resolveCanvasData, saveProject } from './projectService.js';
import { sanitizeMultiCanvasDataForPersistence } from '../utils/thumbnailPersistence.js';
import { requireOpenedProjectDocument } from './projectDocumentGuard.js';
import {
  captureRecoverySnapshotBeforeSave,
  clearRecoverySnapshotAfterSave,
} from './recoverySnapshotSaveGuard.js';
import { discardStagedProjectPackage, stageProjectPackageFile } from '../../api/projectPackageApi.js';
function getDesktopProjectApi() {
  const enabled = globalThis.window?.electronAPI?.project;
  if (!enabled || typeof enabled !== 'object') return null;
  return enabled;
}
function isAutoDefaultRecentProject(error) {
  const value = String(error?.filename || '')
      .trim()
      .toLowerCase(),
    item = String(error?.name || '').trim(),
    key = String(error?.displayPath || error?.path || '');
  return (
    /\.(?:aicanvas|aicproj|json)$/i.test(value) &&
    value.replace(/\.(?:aicanvas|aicproj|json)$/i, '') === '默认画布' &&
    item === '默认画布' &&
    /(^|[\\/])user[\\/]Canvas Project[\\/]/i.test(key)
  );
}
export function canUseDesktopProjectApi() {
  const ctx = getDesktopProjectApi();
  return !!(
    ctx &&
    typeof ctx.open === 'function' &&
    typeof ctx.save === 'function' &&
    typeof ctx.listRecent === 'function' &&
    typeof ctx.removeRecent === 'function'
  );
}
export function normalizeDesktopProjectOpenResult(args) {
  if (!args || args.canceled) return args || { canceled: true };
  return { ...args, multiData: resolveCanvasData(requireOpenedProjectDocument(args)) };
}
export async function openDesktopProject(recentId = {}) {
  const desktopProjectApi = getDesktopProjectApi();
  if (!desktopProjectApi || typeof desktopProjectApi.open !== 'function')
    throw new Error('Electron project API is unavailable');
  const index = await desktopProjectApi.open({ recentId: recentId.recentId || '' });
  return normalizeDesktopProjectOpenResult(index);
}
export async function saveDesktopProject(projectName2, result, projectId2 = {}) {
  const multiData = sanitizeMultiCanvasDataForPersistence(result || {}),
    ctx2 = getDesktopProjectApi();
  if (ctx2 && typeof ctx2.save === 'function') {
    const recoveryBeforeSave = await captureRecoverySnapshotBeforeSave(ctx2);
    const response = await ctx2.save({
      projectName: projectName2,
      projectId: projectId2.projectId || globalThis.window?.currentProjectId || '',
      recentId: projectId2.recentId || globalThis.window?._v2CurrentRecentProjectId || '',
      mode: projectId2.mode || 'save',
      multiData: multiData,
    });
    if (response?.success) await clearRecoverySnapshotAfterSave(ctx2, recoveryBeforeSave, response);
    return response;
  }
  return await saveProject(projectName2, multiData);
}
export async function exportDesktopProjectPackage(projectName3, data, projectId3 = {}) {
  const multiData2 = sanitizeMultiCanvasDataForPersistence(data || {}),
    desktopProjectApi2 = getDesktopProjectApi();
  if (!desktopProjectApi2 || typeof desktopProjectApi2.exportPackage !== 'function')
    throw new Error('Electron project package export API is unavailable');
  return await desktopProjectApi2.exportPackage({
    projectName: projectName3,
    projectId: projectId3.projectId || globalThis.window?.currentProjectId || '',
    recentId: projectId3.recentId || globalThis.window?._v2CurrentRecentProjectId || '',
    displayPath: projectId3.displayPath || globalThis.window?._v2CurrentProjectDisplayPath || '',
    operationId: projectId3.operationId || '',
    multiData: multiData2,
  });
}
export async function importDesktopProjectPackage(path = {}) {
  const desktopProjectApi3 = getDesktopProjectApi();
  if (!desktopProjectApi3 || typeof desktopProjectApi3.importPackage !== 'function')
    throw new Error('Electron project package import API is unavailable');
  const options = await desktopProjectApi3.importPackage({
    path: path.path || '',
    operationId: path.operationId || '',
  });
  return normalizeDesktopProjectOpenResult(options);
}
export async function listDesktopRecentProjects() {
  const desktopProjectApi4 = getDesktopProjectApi();
  if (!desktopProjectApi4 || typeof desktopProjectApi4.listRecent !== 'function') return [];
  const list = await desktopProjectApi4.listRecent();
  return Array.isArray(list) ? list.filter((item2) => !isAutoDefaultRecentProject(item2)) : [];
}
export async function removeDesktopRecentProject(recentId2) {
  const desktopProjectApi5 = getDesktopProjectApi();
  if (!desktopProjectApi5 || typeof desktopProjectApi5.removeRecent !== 'function') return [];
  const target = await desktopProjectApi5.removeRecent({ recentId: recentId2 });
  return Array.isArray(target) ? target : [];
}
export async function loadProjectWithFallback(source) {
  return await loadProject(source);
}
export async function exportDesktopWorkspaceProjectPackage({
  projectType: projectType,
  projectId: projectId = '',
  projectName: projectName = '',
  projectData: projectData,
  operationId: operationId = '',
} = {}) {
  const desktopProjectApi6 = getDesktopProjectApi();
  if (!desktopProjectApi6 || typeof desktopProjectApi6['exportPackage'] !== 'function')
    throw new Error('Electron project package export API is unavailable');
  return await desktopProjectApi6['exportPackage']({
    projectType: projectType,
    projectId: projectId,
    projectName: projectName,
    projectData: projectData,
    operationId: operationId,
  });
}

export async function importDesktopWorkspaceProjectPackage(signal = {}) {
  const desktopProjectApi7 = getDesktopProjectApi();
  if (!desktopProjectApi7 || typeof desktopProjectApi7['importPackage'] !== 'function')
    throw new Error('Electron project package import API is unavailable');
  let stageProjectPackageFile2 = null;
  try {
    let path2 = String(signal['path'] || '')['trim']();
    !path2 &&
      signal['file'] &&
      ((stageProjectPackageFile2 = await stageProjectPackageFile(signal['file'], {
        signal: signal['signal'],
      })),
      (path2 = stageProjectPackageFile2['path']));
    const next = await desktopProjectApi7['importPackage']({
      path: path2,
      operationId: signal['operationId'] || '',
    });
    return next;
  } finally {
    if (stageProjectPackageFile2?.['stageId'])
      try {
        await discardStagedProjectPackage(stageProjectPackageFile2['stageId']);
      } catch (current) {
        console['warn']('[desktopProjectService] 清理暂存项目包失败:', current);
      }
  }
}
