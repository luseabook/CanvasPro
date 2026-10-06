import {
  exportDesktopWorkspaceProjectPackage,
  importDesktopWorkspaceProjectPackage,
} from '../services/desktopProjectService.js';
import { desktopBridge } from '../services/desktopBridge.js';
export const WORKSPACE_PROJECT_PACKAGE_TYPES = Object.freeze({
  canvas: 'canvas',
  story: 'story',
  personReplacement: 'person-replacement',
});
const PROJECT_PACKAGE_EXTENSION = '.aicpkg';
function normalizeText(value) {
  return String(value ?? '').trim();
}
function createOperationId(item) {
  const key = globalThis.crypto?.randomUUID?.();
  return item + '-' + (key || Date.now() + '-' + Math.round(Math.random() * 100000));
}
export function isWorkspaceProjectPackageFile(error) {
  return normalizeText(error?.name).toLowerCase().endsWith(PROJECT_PACKAGE_EXTENSION);
}
export function getWorkspaceProjectPackageFile(index) {
  return [...(index?.files || [])].find(isWorkspaceProjectPackageFile) || null;
}
export function hasWorkspaceProjectPackageDrag(result) {
  return (
    Boolean(getWorkspaceProjectPackageFile(result)) ||
    [...(result?.items || [])].some(
      (data) =>
        data?.kind === 'file' &&
        normalizeText(data?.getAsFile?.()?.name)
          .toLowerCase()
          .endsWith(PROJECT_PACKAGE_EXTENSION),
    )
  );
}
function getPackageBlockedMessage(error2 = {}) {
  if (error2.code === 'MISSING_LOCAL_ASSETS') return '收集失败：项目引用的本地素材文件不存在。';
  if (error2.code === 'REMOTE_MEDIA_NOT_LOCALIZED') return '收集失败：项目仍有未保存到本地的远程素材。';
  return normalizeText(error2.message) || '项目收集失败。';
}
function subscribeProgress(options, target) {
  if (!desktopBridge.project.isAvailable()) return () => {};
  const source = desktopBridge.project.onPackageProgress((error3 = {}) => {
    if (normalizeText(error3.operationId) !== options) return;
    const next = error3.progress == null ? Number.NaN : Number(error3.progress),
      current = { text: normalizeText(error3.message) || '正在处理项目包...' };
    (Number.isFinite(next) && (current.progress = Math.max(0, Math.min(1, next))),
      target?.updateGlobalLoading?.(current));
  });
  return typeof source === 'function' ? source : () => {};
}
export function createWorkspaceProjectPackageCoordinator({
  windowObject: windowObject = globalThis.window,
  getStoryWorkspace: getStoryWorkspace = () => null,
  getReplacementStudio: getReplacementStudio = () => null,
  openCanvasProjectPackage: openCanvasProjectPackage = (entry) =>
    windowObject?._v2LoadImportedCanvasProjectPackage?.(entry),
  requestWorkspaceMode: requestWorkspaceMode = () => false,
  showToast: showToast = (...args) => windowObject?.showToast?.(...args),
} = {}) {
  let record = null,
    payload = null;
  async function run({
    projectType: projectType,
    projectId: projectId,
    projectName: projectName,
    projectData: projectData,
  } = {}) {
    const operationId = createOperationId('collect-workspace-project'),
      handler = subscribeProgress(operationId, windowObject);
    windowObject?.showGlobalLoading?.('正在收集项目...');
    try {
      const response = await exportDesktopWorkspaceProjectPackage({
        projectType: projectType,
        projectId: projectId,
        projectName: projectName,
        projectData: projectData,
        operationId: operationId,
      });
      if (!response || response.canceled) return response;
      if (response.blocked || response.success === false)
        return (showToast(getPackageBlockedMessage(response), 'error'), response);
      return (showToast('项目已收集为“' + (response.filename || '项目包') + '”。', 'success'), response);
    } catch (error4) {
      return (
        console.error('[workspaceProjectPackage] export failed', error4),
        showToast(error4?.message || '项目收集失败。', 'error'),
        null
      );
    } finally {
      (handler(), windowObject?.hideGlobalLoading?.());
    }
  }
  function exportProject(options2 = {}) {
    if (payload) return (showToast('已有项目正在收集，请稍候。', 'info'), payload);
    if (record) return (showToast('项目包正在导入，请完成后再收集。', 'info'), record);
    return (
      (payload = run(options2).finally(() => {
        payload = null;
      })),
      payload
    );
  }
  async function applyImportedProject(handle) {
    const text = normalizeText(handle?.projectType) || WORKSPACE_PROJECT_PACKAGE_TYPES.canvas;
    if (text === WORKSPACE_PROJECT_PACKAGE_TYPES.story) {
      const storyWorkspace = await getStoryWorkspace()?.importProjectPackageResult?.(handle);
      if (!storyWorkspace) throw new Error('剧本项目导入失败。');
      return (
        requestWorkspaceMode(getStoryWorkspace()?.getProjectWorkspaceMode?.() || 'story'),
        storyWorkspace
      );
    }
    if (text === WORKSPACE_PROJECT_PACKAGE_TYPES.personReplacement) {
      const replacementStudio = await getReplacementStudio()?.importProjectPackageResult?.(handle);
      if (!replacementStudio) throw new Error('人物替换项目导入失败。');
      return (requestWorkspaceMode('person-replacement'), replacementStudio);
    }
    if (text === WORKSPACE_PROJECT_PACKAGE_TYPES.canvas) {
      const openCanvasProjectPackage2 = await openCanvasProjectPackage(handle);
      if (!openCanvasProjectPackage2) throw new Error('画布项目导入失败。');
      return (requestWorkspaceMode('canvas'), openCanvasProjectPackage2);
    }
    throw new Error('不支持的项目包类型：' + text);
  }
  async function run2({ path: path = '', file: file = null } = {}) {
    const operationId2 = createOperationId('import-workspace-project'),
      handler2 = subscribeProgress(operationId2, windowObject);
    windowObject?.showGlobalLoading?.('正在读取项目包...');
    try {
      const result2 = await importDesktopWorkspaceProjectPackage({
        path: path,
        file: file,
        operationId: operationId2,
      });
      if (!result2 || result2.canceled) return result2;
      windowObject?.updateGlobalLoading?.({ text: '正在导入项目...' });
      const imported = await applyImportedProject(result2);
      return (
        showToast('“' + (result2.projectName || '项目') + '”已导入。', 'success'),
        { result: result2, imported: imported }
      );
    } catch (error5) {
      return (
        console.error('[workspaceProjectPackage] import failed', error5),
        showToast(error5?.message || '项目包导入失败。', 'error'),
        null
      );
    } finally {
      (handler2(), windowObject?.hideGlobalLoading?.());
    }
  }
  function importProject(options3 = {}) {
    if (record) return (showToast('已有项目包正在导入，请稍候。', 'info'), record);
    if (payload) return (showToast('项目正在收集，请完成后再导入。', 'info'), payload);
    return (
      (record = run2(options3).finally(() => {
        record = null;
      })),
      record
    );
  }
  function importProjectFromDrop(event) {
    const file2 = getWorkspaceProjectPackageFile(event?.dataTransfer);
    if (!file2) return false;
    (event.preventDefault?.(), event.stopPropagation?.());
    const path2 = normalizeText(file2.path);
    return (void importProject(path2 ? { path: path2 } : { file: file2 }), true);
  }
  return Object.freeze({
    applyImportedProject: applyImportedProject,
    exportProject: exportProject,
    hasProjectPackageDrag: hasWorkspaceProjectPackageDrag,
    importProject: importProject,
    importProjectFromDrop: importProjectFromDrop,
    isExporting: () => Boolean(payload),
    isImporting: () => Boolean(record),
  });
}
