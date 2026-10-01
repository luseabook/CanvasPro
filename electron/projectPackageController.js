import { createFullProjectPackageController } from './fullProjectPackageController.js';
import path from 'node:path';
import {
  PROJECT_PACKAGE_FILE_EXTENSION,
  exportProjectPackageToPath,
  importProjectPackageFromPath,
  withProjectPackageExtension,
} from './projectPackageService.js';
import { sanitizeProjectName } from '../src/services/desktopProjectFileStore.js';
function trimText(_0x5e4a49) {
  return String(_0x5e4a49 || '').trim();
}
function getProjectPackageDialogFilters() {
  return [
    { name: 'Canvas Project Package', extensions: [PROJECT_PACKAGE_FILE_EXTENSION.replace(/^\./, '')] },
  ];
}
function resolveProjectPackageImportPath(_0x17318a = {}) {
  const _0x52fb19 = trimText(_0x17318a?.path);
  if (!_0x52fb19) return '';
  if (!path.isAbsolute(_0x52fb19)) throw new Error('项目包路径必须是绝对路径');
  if (path.extname(_0x52fb19).toLowerCase() !== PROJECT_PACKAGE_FILE_EXTENSION)
    throw new Error('只支持 .aicpkg 项目包');
  return path.resolve(_0x52fb19);
}
function toProjectPackageBlockedResult(_0x3cdd0f) {
  const _0x318695 = String(_0x3cdd0f?.code || '');
  if (_0x318695 === 'MISSING_LOCAL_ASSETS') {
    const _0x36aea5 = Array.isArray(_0x3cdd0f?.missing) ? _0x3cdd0f.missing.filter(Boolean) : [];
    return {
      success: false,
      canceled: false,
      blocked: true,
      code: _0x318695,
      message: '收集失败：当前项目引用的本地素材文件不存在',
      missing: _0x36aea5,
    };
  }
  if (_0x318695 === 'REMOTE_MEDIA_NOT_LOCALIZED') {
    const _0x3f84bb = Array.isArray(_0x3cdd0f?.remoteMedia) ? _0x3cdd0f.remoteMedia.filter(Boolean) : [];
    return {
      success: false,
      canceled: false,
      blocked: true,
      code: _0x318695,
      message: '收集失败：当前项目还有未本地化的远程素材',
      remoteMedia: _0x3f84bb,
    };
  }
  return null;
}
function normalizeProgressPayload(_0x5119c7 = {}) {
  const _0x44c80d = Number(_0x5119c7?.progress),
    _0x1ea944 = Number(_0x5119c7?.current),
    _0x13e65b = Number(_0x5119c7?.total);
  return {
    phase: trimText(_0x5119c7?.phase) || 'working',
    message: trimText(_0x5119c7?.message),
    progress: Number.isFinite(_0x44c80d) ? Math.max(0, Math.min(1, _0x44c80d)) : null,
    current: Number.isFinite(_0x1ea944) ? _0x1ea944 : null,
    total: Number.isFinite(_0x13e65b) ? _0x13e65b : null,
  };
}
function emitPackageProgress(_0x159974, _0x655444, _0x57dbac = {}) {
  if (!_0x159974 || typeof _0x159974.send !== 'function') return;
  const _0x4dacc5 = trimText(_0x655444);
  if (!_0x4dacc5) return;
  _0x159974.send('project:packageProgress', {
    operationId: _0x4dacc5,
    ...normalizeProgressPayload(_0x57dbac),
  });
}
export function createProjectPackageController({
  app: _0x154eee,
  dialog: _0x3d08af,
  getMainWindow: getMainWindow = () => null,
  consumeExternalPackageTicket,
  getCanvasProjectDir: _0x2fc1f5,
  getOutputDir: _0x5e3fb1,
  getUploadsDir: _0x518e0d,
  getAssetsDir: _0x301414,
  getWorkflowsDir: _0x574fd5,
  readAppVersion: _0x59478a,
  upsertRecentProject: _0xded5d2,
  getRecentProjectsStorePath: _0x5ef5b0,
  syncSystemRecentDocumentsBestEffort: _0x5601cb,
  buildProjectOpenResponse: _0x187714,
} = {}) {
  const _0x339ace = () => ({
      canvasRoot: _0x2fc1f5(),
      outputRoot: _0x5e3fb1(),
      uploadsRoot: _0x518e0d(),
      assetsRoot: _0x301414(),
      workflowsRoot: _0x574fd5(),
      workflowThumbsRoot: path.join(_0x574fd5(), 'thumbs'),
    }),
    _0x2b961b = (_0x5e0d48) => {
      const _0x4cd473 = sanitizeProjectName(_0x5e0d48 || '未命名画布');
      let _0x361683 = '';
      try {
        _0x361683 = _0x154eee.getPath('downloads');
      } catch {}
      return path.join(_0x361683 || _0x2fc1f5(), '' + _0x4cd473 + PROJECT_PACKAGE_FILE_EXTENSION);
    },
    _0x4c38c2 = async (_0x5ce080 = {}, _0x58196e = {}) => {
      const _0x289f93 = sanitizeProjectName(_0x5ce080?.projectName || _0x5ce080?.projectId || '未命名画布'),
        _0x38c61d = trimText(_0x5ce080?.operationId),
        _0x4e4de4 = _0x58196e?.sender || null,
        _0x48c115 = await _0x3d08af.showSaveDialog(getMainWindow(), {
          title: '收集当前项目',
          defaultPath: _0x2b961b(_0x289f93),
          filters: getProjectPackageDialogFilters(),
        });
      if (_0x48c115.canceled || !_0x48c115.filePath) return { success: false, canceled: true };
      try {
        return await exportProjectPackageToPath({
          outputPath: withProjectPackageExtension(_0x48c115.filePath),
          multiData: _0x5ce080?.multiData || {},
          projectId: _0x5ce080?.projectId || '',
          projectName: _0x289f93,
          appVersion: _0x59478a(),
          roots: _0x339ace(),
          onProgress: (_0x3d91d2) => emitPackageProgress(_0x4e4de4, _0x38c61d, _0x3d91d2),
        });
      } catch (_0x3ce695) {
        const _0x1e92dd = toProjectPackageBlockedResult(_0x3ce695);
        if (_0x1e92dd) return _0x1e92dd;
        throw _0x3ce695;
      }
    },
    _0x262930 = async (_0x537442 = {}, _0x48d9d7 = {}) => {
      const _0x2f807b = trimText(_0x537442?.operationId),
        _0x5c0da6 = _0x48d9d7?.sender || null;
      let _0x276904 = resolveProjectPackageImportPath(_0x537442);
      if (!_0x276904) {
        const _0x2c0d94 = await _0x3d08af.showOpenDialog(getMainWindow(), {
          title: '加载项目包',
          defaultPath: _0x2fc1f5(),
          properties: ['openFile'],
          filters: getProjectPackageDialogFilters(),
        });
        if (_0x2c0d94.canceled || !_0x2c0d94.filePaths?.[0]) return { success: false, canceled: true };
        _0x276904 = _0x2c0d94.filePaths[0];
      }
      emitPackageProgress(_0x5c0da6, _0x2f807b, { phase: 'importing', message: '正在读取项目包...' });
      const _0x1148b9 = await importProjectPackageFromPath({
          packagePath: _0x276904,
          roots: _0x339ace(),
          projectRoot: _0x2fc1f5(),
          tempRoot: _0x154eee.getPath('temp'),
        }),
        _0x1fb031 = _0xded5d2(_0x5ef5b0(), _0x1148b9.projectPath, { name: _0x1148b9.projectName });
      return (
        _0x5601cb(),
        {
          ..._0x187714(_0x1148b9.projectPath, _0x1148b9.data, _0x1fb031),
          source: _0x537442?.path ? 'package-drop' : 'package-dialog',
          imported: true,
          packagePath: _0x276904,
          assetsCount: _0x1148b9.assetsCount,
        }
      );
    };
  return { exportDesktopProjectPackage: _0x4c38c2, importDesktopProjectPackage: _0x262930,
    ...createFullProjectPackageController({ dialog: _0x3d08af, getMainWindow, getRoots: _0x339ace,
      consumeExternalPackageTicket,
      getProjectRoot: _0x2fc1f5, getTempRoot: () => _0x154eee.getPath('temp'),
      getDownloadsRoot: () => { try { return _0x154eee.getPath('downloads'); } catch { return _0x2fc1f5(); } },
      readAppVersion: _0x59478a, emitProgress: emitPackageProgress,
      registerResult: result => {
        const recent = _0xded5d2(_0x5ef5b0(), result.projectPath, { name: result.projectName });
        _0x5601cb(); return _0x187714(result.projectPath, result.data, recent);
      },
    }),
  };
}
