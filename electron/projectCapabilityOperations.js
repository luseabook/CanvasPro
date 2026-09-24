import path from 'node:path';
import { mkdirSync, promises } from 'node:fs';
import * as desktopProjectFileStore from '../src/services/desktopProjectFileStore.js';
import { createDiagnosticOperation } from '../src/utils/diagnosticOperationRecorder.js';

function normalizeProjectPayload(payload) {
  return payload || {};
}
function normalizeOperationContext(context) {
  return context || {};
}
function formatOperationError(error) {
  return String(error?.message || error);
}
function normalizePositiveTimestamp(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : 0;
}

export function buildProjectOpenResponse(
  projectPath,
  data,
  recent,
  {
    stripProjectFileExtension: stripProjectFileExtension = desktopProjectFileStore
      .stripProjectFileExtension,
  } = {},
) {
  const filename = recent?.filename || path.basename(projectPath),
    name = recent?.name || stripProjectFileExtension(filename);
  return {
    success: true,
    canceled: false,
    projectId: stripProjectFileExtension(filename),
    projectName: name,
    filename: filename,
    recentId: recent?.recentId || '',
    displayPath: recent?.displayPath || projectPath,
    lastModified: Number(recent?.lastModified || 0) || 0,
    data: data,
  };
}

export function createProjectCapabilityOperations({
  exportDesktopProjectPackage: exportDesktopProjectPackage,
  importDesktopProjectPackage: importDesktopProjectPackage,
  handleRendererUnsavedState: handleRendererUnsavedState,
  getRecentProjectsStorePath: getRecentProjectsStorePath,
  syncSystemRecentDocumentsBestEffort: syncSystemRecentDocumentsBestEffort,
  pendingExternalProjectOpenRequests: pendingExternalProjectOpenRequests,
  getCanvasProjectDir: getCanvasProjectDir,
  showOpenDialog: showOpenDialog,
  showSaveDialog: showSaveDialog,
  projectFileStore: projectFileStore = desktopProjectFileStore,
  supportedProjectFileExtensions: supportedProjectFileExtensions = desktopProjectFileStore
    .SUPPORTED_PROJECT_FILE_EXTENSIONS,
  getRecoverySnapshotPath: getRecoverySnapshotPath,
  writeRecoverySnapshotFile: writeRecoverySnapshotFile,
  getRecoverySnapshotFileInfo: getRecoverySnapshotFileInfo,
  readRecoverySnapshotFile: readRecoverySnapshotFile,
  removeRecoverySnapshotFile: removeRecoverySnapshotFile,
  statPath: statPath = (target) => promises.stat(target),
  logDiagnosticEvent: logDiagnosticEvent,
} = {}) {
  function buildProjectFileFilters() {
    return [
      {
        name: 'SHUO Canvas Project',
        extensions: supportedProjectFileExtensions.map((extension) =>
          String(extension || '').replace(/^\./, ''),
        ),
      },
    ];
  }

  function openProjectPath(projectPath, { source: source = 'dialog' } = {}) {
    const resolved = path.resolve(String(projectPath || '')),
      data = projectFileStore.readProjectJson(resolved),
      recent = projectFileStore.upsertRecentProject(getRecentProjectsStorePath(), resolved, {
        name: projectFileStore.stripProjectFileExtension(path.basename(resolved)),
      });
    return (
      syncSystemRecentDocumentsBestEffort(),
      {
        ...buildProjectOpenResponse(resolved, data, recent, {
          stripProjectFileExtension: projectFileStore.stripProjectFileExtension,
        }),
        source: source,
      }
    );
  }

  async function readFileLastModified(filePath) {
    const trimmed = String(filePath || '').trim();
    if (!trimmed || !path.isAbsolute(trimmed)) return 0;
    try {
      const stats = await statPath(trimmed);
      return stats.isFile() ? Math.round(stats.mtimeMs) : 0;
    } catch {
      return 0;
    }
  }

  async function resolveCurrentProjectLastModified(payload = {}, snapshot = {}) {
    const candidates = [
        normalizePositiveTimestamp(
          payload?.lastKnownProjectLastModified ?? payload?.lastModified,
        ),
      ],
      recentId = String(payload?.recentId || snapshot?.recentId || '').trim();
    let recentPath = '';
    if (recentId) {
      const recent = await projectFileStore.findRecentProject(
        getRecentProjectsStorePath(),
        recentId,
      );
      candidates.push(normalizePositiveTimestamp(recent?.lastModified));
      recentPath = recent?.path || '';
    }
    const displayPaths = [
      ...new Set(
        [payload?.displayPath, snapshot?.displayPath].filter(
          (displayPath) => displayPath && displayPath !== recentPath,
        ),
      ),
    ];
    candidates.push(...(await Promise.all(displayPaths.map(readFileLastModified))));
    return Math.max(0, ...candidates);
  }

  const operations = {
    async open(payload) {
      const input = normalizeProjectPayload(payload),
        recentStorePath = getRecentProjectsStorePath(),
        recentId = String(input?.recentId || '').trim();
      let targetPath = '';
      if (recentId) {
        const recent = await projectFileStore.findRecentProject(recentStorePath, recentId);
        if (!recent) throw new Error('最近项目不存在');
        if (!recent.exists) throw new Error('最近项目文件不存在');
        targetPath = recent.path;
      } else {
        mkdirSync(getCanvasProjectDir(), { recursive: true });
        const selection = await showOpenDialog({
          title: '打开项目',
          defaultPath: getCanvasProjectDir(),
          properties: ['openFile'],
          filters: buildProjectFileFilters(),
        });
        if (selection.canceled || !selection.filePaths?.[0]) return { success: false, canceled: true };
        targetPath = selection.filePaths[0];
      }
      return openProjectPath(targetPath, { source: recentId ? 'recent' : 'dialog' });
    },
    async save(payload) {
      const input = normalizeProjectPayload(payload),
        recentStorePath = getRecentProjectsStorePath(),
        mode = String(input?.mode || 'save').trim() === 'saveAs' ? 'saveAs' : 'save',
        projectName = projectFileStore.sanitizeProjectName(
          input?.projectName || input?.projectId || '未命名画布',
        );
      let targetPath = '';
      if (mode === 'save') {
        const recentId = String(input?.recentId || '').trim(),
          recent = recentId ? await projectFileStore.findRecentProject(recentStorePath, recentId) : null;
        targetPath =
          recent?.path || projectFileStore.buildDefaultProjectPath(getCanvasProjectDir(), projectName);
      } else {
        mkdirSync(getCanvasProjectDir(), { recursive: true });
        const selection = await showSaveDialog({
          title: '另存为项目',
          defaultPath: projectFileStore.buildDefaultProjectPath(getCanvasProjectDir(), projectName),
          filters: buildProjectFileFilters(),
        });
        if (selection.canceled || !selection.filePath) return { success: false, canceled: true };
        targetPath = projectFileStore.withJsonProjectExtension(selection.filePath);
      }
      projectFileStore.writeProjectJson(targetPath, input?.multiData || {}, {
        allowEmptyOverwrite: input?.allowEmptyOverwrite === true,
      });
      const recent = projectFileStore.upsertRecentProject(recentStorePath, targetPath, { name: projectName });
      return (
        syncSystemRecentDocumentsBestEffort(),
        {
          success: true,
          canceled: false,
          projectId: projectFileStore.stripProjectFileExtension(recent.filename || ''),
          projectName: recent.name,
          filename: recent.filename,
          recentId: recent.recentId,
          displayPath: recent.displayPath,
          lastModified: recent.lastModified,
        }
      );
    },
    openPath(projectPath, options) {
      return openProjectPath(projectPath, options);
    },
    exportPackage(payload, context) {
      return exportDesktopProjectPackage(normalizeProjectPayload(payload), normalizeOperationContext(context));
    },
    importPackage(payload, context) {
      return importDesktopProjectPackage(normalizeProjectPayload(payload), normalizeOperationContext(context));
    },
    setUnsavedState(payload) {
      return handleRendererUnsavedState(normalizeProjectPayload(payload));
    },
    listRecent() {
      return projectFileStore.listRecentProjects(getRecentProjectsStorePath());
    },
    async removeRecent(payload) {
      const recentId = normalizeProjectPayload(payload).recentId || '',
        remaining = await projectFileStore.removeRecentProject(getRecentProjectsStorePath(), recentId);
      return (syncSystemRecentDocumentsBestEffort(), remaining);
    },
    consumeExternalOpenRequests() {
      return pendingExternalProjectOpenRequests.splice(0, pendingExternalProjectOpenRequests.length);
    },
    writeRecoverySnapshot(payload) {
      try {
        const snapshot = writeRecoverySnapshotFile(getRecoverySnapshotPath(), normalizeProjectPayload(payload));
        return {
          success: true,
          savedAt: snapshot.savedAt,
          projectId: snapshot.projectId,
          projectName: snapshot.projectName,
        };
      } catch (error) {
        return { success: false, error: formatOperationError(error) };
      }
    },
    async getRecoverySnapshotInfo(payload) {
      try {
        const snapshotPath = getRecoverySnapshotPath(),
          snapshot = await readRecoverySnapshotFile(snapshotPath),
          currentLastModified = snapshot
            ? await resolveCurrentProjectLastModified(normalizeProjectPayload(payload), snapshot || {})
            : normalizePositiveTimestamp(
                payload?.lastKnownProjectLastModified ?? payload?.lastModified,
              );
        return await getRecoverySnapshotFileInfo(snapshotPath, {
          currentLastModified: currentLastModified,
          snapshot: snapshot,
        });
      } catch (error) {
        return {
          exists: false,
          isNewerThanProject: false,
          savedAt: 0,
          currentLastModified: 0,
          error: formatOperationError(error),
        };
      }
    },
    async readRecoverySnapshot() {
      try {
        const snapshot = await readRecoverySnapshotFile(getRecoverySnapshotPath());
        if (!snapshot) return { success: false, exists: false, canceled: false };
        return {
          success: true,
          exists: true,
          canceled: false,
          recovery: true,
          projectId: snapshot.projectId,
          projectName: snapshot.projectName,
          filename: snapshot.filename,
          recentId: snapshot.recentId,
          displayPath: snapshot.displayPath,
          lastModified: snapshot.lastKnownProjectLastModified,
          recoverySavedAt: snapshot.savedAt,
          data: snapshot.data,
        };
      } catch (error) {
        return { success: false, exists: false, error: formatOperationError(error) };
      }
    },
    clearRecoverySnapshot() {
      try {
        return (removeRecoverySnapshotFile(getRecoverySnapshotPath()), { success: true });
      } catch (error) {
        return { success: false, error: formatOperationError(error) };
      }
    },
  };

  const wrapWithDiagnostics = (operationName) => (payload) =>
    createDiagnosticOperation({
      type: 'project.desktop_' + operationName,
      source: 'main',
      logEvent: logDiagnosticEvent,
      context: {
        mode: payload?.['mode'] === 'saveAs' ? 'saveAs' : operationName,
        canvasCount: Array.isArray(payload?.multiData?.canvases)
          ? payload.multiData.canvases.length
          : 0,
      },
    })['run'](() => operations[operationName](payload));

  return Object.freeze({
    ...operations,
    open: wrapWithDiagnostics('open'),
    save: wrapWithDiagnostics('save'),
  });
}
