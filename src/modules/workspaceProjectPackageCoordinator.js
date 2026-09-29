import {
  exportDesktopWorkspaceProjectPackage,
  importDesktopWorkspaceProjectPackage,
} from '../services/desktopProjectService.js';
import { desktopBridge } from '../services/desktopBridge.js';
export const WORKSPACE_PROJECT_PACKAGE_TYPES = Object['freeze']({
  canvas: 'canvas',
  story: 'story',
  personReplacement: 'person-replacement',
});
const PROJECT_PACKAGE_EXTENSION = '.aicpkg';
function normalizeText(_0x45a67b) {
  return String(_0x45a67b ?? '')['trim']();
}
function createOperationId(_0x15ff8d) {
  const _0x1af7c3 = globalThis['crypto']?.['randomUUID']?.();
  return _0x15ff8d + '-' + (_0x1af7c3 || Date['now']() + '-' + Math['round'](Math['random']() * 0x186a0));
}
export function isWorkspaceProjectPackageFile(_0x4cbd86) {
  return normalizeText(_0x4cbd86?.['name'])['toLowerCase']()['endsWith'](PROJECT_PACKAGE_EXTENSION);
}
export function getWorkspaceProjectPackageFile(_0x51389c) {
  return [...(_0x51389c?.['files'] || [])]['find'](isWorkspaceProjectPackageFile) || null;
}
export function hasWorkspaceProjectPackageDrag(_0x791f1) {
  return (
    Boolean(getWorkspaceProjectPackageFile(_0x791f1)) ||
    [...(_0x791f1?.['items'] || [])]['some'](
      (_0x5100a2) =>
        _0x5100a2?.['kind'] === 'file' &&
        normalizeText(_0x5100a2?.['getAsFile']?.()?.['name'])
          ['toLowerCase']()
          ['endsWith'](PROJECT_PACKAGE_EXTENSION),
    )
  );
}
function getPackageBlockedMessage(_0x535686 = {}) {
  if (_0x535686['code'] === 'MISSING_LOCAL_ASSETS') return '收集失败：项目引用的本地素材文件不存在。';
  if (_0x535686['code'] === 'REMOTE_MEDIA_NOT_LOCALIZED') return '收集失败：项目仍有未保存到本地的远程素材。';
  return normalizeText(_0x535686['message']) || '项目收集失败。';
}
function subscribeProgress(_0x41619c, _0x5d0313) {
  if (!desktopBridge['project']['isAvailable']()) return () => {};
  const _0x2e6647 = desktopBridge['project']['onPackageProgress']((_0x501c18 = {}) => {
    if (normalizeText(_0x501c18['operationId']) !== _0x41619c) return;
    const _0x80c541 = _0x501c18['progress'] == null ? Number['NaN'] : Number(_0x501c18['progress']),
      _0x10742b = { text: normalizeText(_0x501c18['message']) || '正在处理项目包...' };
    (Number['isFinite'](_0x80c541) && (_0x10742b['progress'] = Math['max'](0x0, Math['min'](0x1, _0x80c541))),
      _0x5d0313?.['updateGlobalLoading']?.(_0x10742b));
  });
  return typeof _0x2e6647 === 'function' ? _0x2e6647 : () => {};
}
export function createWorkspaceProjectPackageCoordinator({
  windowObject: windowObject = globalThis['window'],
  getStoryWorkspace: getStoryWorkspace = () => null,
  getReplacementStudio: getReplacementStudio = () => null,
  openCanvasProjectPackage: openCanvasProjectPackage = (_0x26f2da) =>
    windowObject?.['_v2LoadImportedCanvasProjectPackage']?.(_0x26f2da),
  requestWorkspaceMode: requestWorkspaceMode = () => ![],
  showToast: showToast = (..._0x56c148) => windowObject?.['showToast']?.(..._0x56c148),
} = {}) {
  let _0x1bb6f6 = null,
    _0x5c2d19 = null;
  async function _0x1403db({
    projectType: _0x4fb95a,
    projectId: _0x284b4f,
    projectName: _0x19dcbe,
    projectData: _0x3fdab2,
  } = {}) {
    const _0x315a4a = createOperationId('collect-workspace-project'),
      _0x100bb9 = subscribeProgress(_0x315a4a, windowObject);
    windowObject?.['showGlobalLoading']?.('正在收集项目...');
    try {
      const _0x37eae9 = await exportDesktopWorkspaceProjectPackage({
        projectType: _0x4fb95a,
        projectId: _0x284b4f,
        projectName: _0x19dcbe,
        projectData: _0x3fdab2,
        operationId: _0x315a4a,
      });
      if (!_0x37eae9 || _0x37eae9['canceled']) return _0x37eae9;
      if (_0x37eae9['blocked'] || _0x37eae9['success'] === ![])
        return (showToast(getPackageBlockedMessage(_0x37eae9), 'error'), _0x37eae9);
      return (showToast('项目已收集为“' + (_0x37eae9['filename'] || '项目包') + '”。', 'success'), _0x37eae9);
    } catch (_0x523c37) {
      return (
        console['error']('[workspaceProjectPackage] export failed', _0x523c37),
        showToast(_0x523c37?.['message'] || '项目收集失败。', 'error'),
        null
      );
    } finally {
      (_0x100bb9(), windowObject?.['hideGlobalLoading']?.());
    }
  }
  function _0x434842(_0x3e125c = {}) {
    if (_0x5c2d19) return (showToast('已有项目正在收集，请稍候。', 'info'), _0x5c2d19);
    if (_0x1bb6f6) return (showToast('项目包正在导入，请完成后再收集。', 'info'), _0x1bb6f6);
    return (
      (_0x5c2d19 = _0x1403db(_0x3e125c)['finally'](() => {
        _0x5c2d19 = null;
      })),
      _0x5c2d19
    );
  }
  async function _0x5ba4b3(_0x3a457c) {
    const _0x1672db = normalizeText(_0x3a457c?.['projectType']) || WORKSPACE_PROJECT_PACKAGE_TYPES['canvas'];
    if (_0x1672db === WORKSPACE_PROJECT_PACKAGE_TYPES['story']) {
      const _0x197dd5 = await getStoryWorkspace()?.['importProjectPackageResult']?.(_0x3a457c);
      if (!_0x197dd5) throw new Error('剧本项目导入失败。');
      return (
        requestWorkspaceMode(getStoryWorkspace()?.['getProjectWorkspaceMode']?.() || 'story'),
        _0x197dd5
      );
    }
    if (_0x1672db === WORKSPACE_PROJECT_PACKAGE_TYPES['personReplacement']) {
      const _0x48d549 = await getReplacementStudio()?.['importProjectPackageResult']?.(_0x3a457c);
      if (!_0x48d549) throw new Error('人物替换项目导入失败。');
      return (requestWorkspaceMode('person-replacement'), _0x48d549);
    }
    if (_0x1672db === WORKSPACE_PROJECT_PACKAGE_TYPES['canvas']) {
      const _0x42db3c = await openCanvasProjectPackage(_0x3a457c);
      if (!_0x42db3c) throw new Error('画布项目导入失败。');
      return (requestWorkspaceMode('canvas'), _0x42db3c);
    }
    throw new Error('不支持的项目包类型：' + _0x1672db);
  }
  async function _0x2023e7({ path: path = '', file: file = null } = {}) {
    const _0x2a99d7 = createOperationId('import-workspace-project'),
      _0x109adb = subscribeProgress(_0x2a99d7, windowObject);
    windowObject?.['showGlobalLoading']?.('正在读取项目包...');
    try {
      const _0x3ecdd6 = await importDesktopWorkspaceProjectPackage({
        path: path,
        file: file,
        operationId: _0x2a99d7,
      });
      if (!_0x3ecdd6 || _0x3ecdd6['canceled']) return _0x3ecdd6;
      windowObject?.['updateGlobalLoading']?.({ text: '正在导入项目...' });
      const _0x302041 = await _0x5ba4b3(_0x3ecdd6);
      return (
        showToast('“' + (_0x3ecdd6['projectName'] || '项目') + '”已导入。', 'success'),
        { result: _0x3ecdd6, imported: _0x302041 }
      );
    } catch (_0x368e0f) {
      return (
        console['error']('[workspaceProjectPackage] import failed', _0x368e0f),
        showToast(_0x368e0f?.['message'] || '项目包导入失败。', 'error'),
        null
      );
    } finally {
      (_0x109adb(), windowObject?.['hideGlobalLoading']?.());
    }
  }
  function _0x1bf725(_0x528b77 = {}) {
    if (_0x1bb6f6) return (showToast('已有项目包正在导入，请稍候。', 'info'), _0x1bb6f6);
    if (_0x5c2d19) return (showToast('项目正在收集，请完成后再导入。', 'info'), _0x5c2d19);
    return (
      (_0x1bb6f6 = _0x2023e7(_0x528b77)['finally'](() => {
        _0x1bb6f6 = null;
      })),
      _0x1bb6f6
    );
  }
  function _0x2a32cd(_0x238a8b) {
    const _0x56929a = getWorkspaceProjectPackageFile(_0x238a8b?.['dataTransfer']);
    if (!_0x56929a) return ![];
    (_0x238a8b['preventDefault']?.(), _0x238a8b['stopPropagation']?.());
    const _0x58a86b = normalizeText(_0x56929a['path']);
    return (void _0x1bf725(_0x58a86b ? { path: _0x58a86b } : { file: _0x56929a }), !![]);
  }
  return Object['freeze']({
    applyImportedProject: _0x5ba4b3,
    exportProject: _0x434842,
    hasProjectPackageDrag: hasWorkspaceProjectPackageDrag,
    importProject: _0x1bf725,
    importProjectFromDrop: _0x2a32cd,
    isExporting: () => Boolean(_0x5c2d19),
    isImporting: () => Boolean(_0x1bb6f6),
  });
}
