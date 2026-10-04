import { createFullProjectPackageController } from './fullProjectPackageController.js';
import path from 'node:path';
import {
  PROJECT_PACKAGE_FILE_EXTENSION,
  exportProjectPackageToPath,
  importProjectPackageFromPath,
  withProjectPackageExtension,
} from './projectPackageService.js';
import { sanitizeProjectName } from '../src/services/desktopProjectFileStore.js';
function trimText(value) {
  return String(value || '').trim();
}
function getProjectPackageDialogFilters() {
  return [
    { name: 'Canvas Project Package', extensions: [PROJECT_PACKAGE_FILE_EXTENSION.replace(/^\./, '')] },
  ];
}
function resolveProjectPackageImportPath(options = {}) {
  const trimText2 = trimText(options?.path);
  if (!trimText2) return '';
  if (!path.isAbsolute(trimText2)) throw new Error('项目包路径必须是绝对路径');
  if (path.extname(trimText2).toLowerCase() !== PROJECT_PACKAGE_FILE_EXTENSION)
    throw new Error('只支持 .aicpkg 项目包');
  return path.resolve(trimText2);
}
function toProjectPackageBlockedResult(item) {
  const code = String(item?.code || '');
  if (code === 'MISSING_LOCAL_ASSETS') {
    const missing = Array.isArray(item?.missing) ? item.missing.filter(Boolean) : [];
    return {
      success: false,
      canceled: false,
      blocked: true,
      code: code,
      message: '收集失败：当前项目引用的本地素材文件不存在',
      missing: missing,
    };
  }
  if (code === 'REMOTE_MEDIA_NOT_LOCALIZED') {
    const remoteMedia = Array.isArray(item?.remoteMedia) ? item.remoteMedia.filter(Boolean) : [];
    return {
      success: false,
      canceled: false,
      blocked: true,
      code: code,
      message: '收集失败：当前项目还有未本地化的远程素材',
      remoteMedia: remoteMedia,
    };
  }
  return null;
}
function normalizeProgressPayload(error = {}) {
  const key = Number(error?.progress),
    index = Number(error?.current),
    data = Number(error?.total);
  return {
    phase: trimText(error?.phase) || 'working',
    message: trimText(error?.message),
    progress: Number.isFinite(key) ? Math.max(0, Math.min(1, key)) : null,
    current: Number.isFinite(index) ? index : null,
    total: Number.isFinite(data) ? data : null,
  };
}
function emitPackageProgress(enabled, target, source = {}) {
  if (!enabled || typeof enabled.send !== 'function') return;
  const operationId = trimText(target);
  if (!operationId) return;
  enabled.send('project:packageProgress', {
    operationId: operationId,
    ...normalizeProgressPayload(source),
  });
}
export function createProjectPackageController({
  app: app,
  dialog: dialog,
  getMainWindow: getMainWindow = () => null,
  consumeExternalPackageTicket,
  getCanvasProjectDir: getCanvasProjectDir,
  getOutputDir: getOutputDir,
  getUploadsDir: getUploadsDir,
  getAssetsDir: getAssetsDir,
  getWorkflowsDir: getWorkflowsDir,
  readAppVersion: readAppVersion,
  upsertRecentProject: upsertRecentProject,
  getRecentProjectsStorePath: getRecentProjectsStorePath,
  syncSystemRecentDocumentsBestEffort: syncSystemRecentDocumentsBestEffort,
  buildProjectOpenResponse: buildProjectOpenResponse,
} = {}) {
  const roots = () => ({
      canvasRoot: getCanvasProjectDir(),
      outputRoot: getOutputDir(),
      uploadsRoot: getUploadsDir(),
      assetsRoot: getAssetsDir(),
      workflowsRoot: getWorkflowsDir(),
      workflowThumbsRoot: path.join(getWorkflowsDir(), 'thumbs'),
    }),
    defaultPath = (next) => {
      const sanitizeProjectName2 = sanitizeProjectName(next || '未命名画布');
      let current = '';
      try {
        current = app.getPath('downloads');
      } catch {}
      return path.join(
        current || getCanvasProjectDir(),
        '' + sanitizeProjectName2 + PROJECT_PACKAGE_FILE_EXTENSION,
      );
    },
    exportDesktopProjectPackage = async (multiData = {}, entry = {}) => {
      const projectName = sanitizeProjectName(multiData?.projectName || multiData?.projectId || '未命名画布'),
        trimText3 = trimText(multiData?.operationId),
        record = entry?.sender || null,
        enabled2 = await dialog.showSaveDialog(getMainWindow(), {
          title: '收集当前项目',
          defaultPath: defaultPath(projectName),
          filters: getProjectPackageDialogFilters(),
        });
      if (enabled2.canceled || !enabled2.filePath) return { success: false, canceled: true };
      try {
        return await exportProjectPackageToPath({
          outputPath: withProjectPackageExtension(enabled2.filePath),
          multiData: multiData?.multiData || {},
          projectId: multiData?.projectId || '',
          projectName: projectName,
          appVersion: readAppVersion(),
          roots: roots(),
          onProgress: (payload) => emitPackageProgress(record, trimText3, payload),
        });
      } catch (handle) {
        const toProjectPackageBlockedResult2 = toProjectPackageBlockedResult(handle);
        if (toProjectPackageBlockedResult2) return toProjectPackageBlockedResult2;
        throw handle;
      }
    },
    importDesktopProjectPackage = async (source2 = {}, state = {}) => {
      const trimText4 = trimText(source2?.operationId),
        config = state?.sender || null;
      let packagePath = resolveProjectPackageImportPath(source2);
      if (!packagePath) {
        const enabled3 = await dialog.showOpenDialog(getMainWindow(), {
          title: '加载项目包',
          defaultPath: getCanvasProjectDir(),
          properties: ['openFile'],
          filters: getProjectPackageDialogFilters(),
        });
        if (enabled3.canceled || !enabled3.filePaths?.[0]) return { success: false, canceled: true };
        packagePath = enabled3.filePaths[0];
      }
      emitPackageProgress(config, trimText4, { phase: 'importing', message: '正在读取项目包...' });
      const name = await importProjectPackageFromPath({
          packagePath: packagePath,
          roots: roots(),
          projectRoot: getCanvasProjectDir(),
          tempRoot: app.getPath('temp'),
        }),
        scope = upsertRecentProject(getRecentProjectsStorePath(), name.projectPath, {
          name: name.projectName,
        });
      return (
        syncSystemRecentDocumentsBestEffort(),
        {
          ...buildProjectOpenResponse(name.projectPath, name.data, scope),
          source: source2?.path ? 'package-drop' : 'package-dialog',
          imported: true,
          packagePath: packagePath,
          assetsCount: name.assetsCount,
        }
      );
    };
  return {
    exportDesktopProjectPackage: exportDesktopProjectPackage,
    importDesktopProjectPackage: importDesktopProjectPackage,
    ...createFullProjectPackageController({
      dialog: dialog,
      getMainWindow,
      getRoots: roots,
      consumeExternalPackageTicket,
      getProjectRoot: getCanvasProjectDir,
      getTempRoot: () => app.getPath('temp'),
      getDownloadsRoot: () => {
        try {
          return app.getPath('downloads');
        } catch {
          return getCanvasProjectDir();
        }
      },
      readAppVersion: readAppVersion,
      emitProgress: emitPackageProgress,
      registerResult: (result) => {
        const recent = upsertRecentProject(getRecentProjectsStorePath(), result.projectPath, {
          name: result.projectName,
        });
        syncSystemRecentDocumentsBestEffort();
        return buildProjectOpenResponse(result.projectPath, result.data, recent);
      },
    }),
  };
}
