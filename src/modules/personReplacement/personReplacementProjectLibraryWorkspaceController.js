import {
  normalizePersonReplacementProjectLibrary,
  removePersonReplacementProject,
} from './personReplacementProjectLibrary.js';
import {
  canCollectPersonReplacementProject,
  createImportedPersonReplacementProject,
  createPersonReplacementProjectPackagePayload,
} from './personReplacementProjectPackage.js';
function normalizeText(_0x4b1568) {
  return String(_0x4b1568 ?? '')['trim']();
}
export function createPersonReplacementProjectLibraryWorkspaceController({
  getProject: _0x5932de,
  getLibrary: _0x524fcd,
  setLibrary: _0xfdc8f8,
  getProjectById: _0x5ff5f9,
  rememberProject: _0x1d038b,
  hasActiveProjectTask: _0x573d69,
  isProcessing: _0x368945,
  replaceProject: _0x316da4,
  createApplicationProject: _0x15cf21,
  createInitialProject: _0x1270d0,
  createId: _0x7a10ca,
  now: _0x363247,
  cloneJson: _0x25ede5,
  syncWorkspace: _0x3561eb,
  schedulePersistence: _0x2322c0,
  snapshot: _0x1a7d1e,
  releaseAllSourcePreviews: _0x3cea51,
  openProject: _0x1f13f0,
  projectPackages: _0x1c4d9d,
  showToast: _0x473205,
} = {}) {
  function _0x34fb6e(_0x5e303a, _0x77fabc) {
    const _0x5c0318 = normalizeText(_0x5e303a),
      _0x26caa1 = _0x524fcd(),
      _0x5c7d52 = _0x26caa1['projects']['find']((_0x428404) => _0x428404['id'] === _0x5c0318);
    if (!_0x5c7d52 || typeof _0x77fabc !== 'function') return null;
    const _0x214429 = _0x15cf21(
      { ..._0x77fabc(_0x25ede5(_0x5c7d52)), id: _0x5c0318, updatedAt: _0x363247() },
      _0x5c7d52,
    );
    return (
      _0xfdc8f8(
        normalizePersonReplacementProjectLibrary({
          ..._0x26caa1,
          currentProjectId: _0x26caa1['currentProjectId'],
          projects: _0x26caa1['projects']['map']((_0x58e9cb) =>
            _0x58e9cb['id'] === _0x5c0318 ? _0x214429 : _0x58e9cb,
          ),
        }),
      ),
      _0x5932de()['id'] === _0x5c0318 &&
        _0x316da4(_0x214429, {
          persist: ![],
          presentation: 'none',
          reason: 'update-library-project',
          touchUpdatedAt: ![],
        }),
      _0x3561eb(),
      _0x2322c0(),
      _0x1a7d1e()
    );
  }
  const _0x13365e = ({ projectId: _0x1fad77, title: _0x3c97aa } = {}) =>
    _0x34fb6e(_0x1fad77, (_0x3a9614) => ({
      ..._0x3a9614,
      title: normalizeText(_0x3c97aa) || '未命名人物替换项目',
    }));
  function _0x40a14b({ projectId: _0x4c4d64 } = {}) {
    const _0x27e897 = _0x524fcd(),
      _0x50798b = _0x27e897['projects']['find']((_0x4ad34b) => _0x4ad34b['id'] === normalizeText(_0x4c4d64));
    if (!_0x50798b) return null;
    const _0x10179e = _0x363247(),
      _0x4e26e7 = _0x15cf21({
        ..._0x25ede5(_0x50798b),
        id: _0x7a10ca('person-replacement'),
        title: (normalizeText(_0x50798b['title']) || '未命名人物替换项目') + ' 副本',
        archivedAt: 0x0,
        createdAt: _0x10179e,
        updatedAt: _0x10179e,
        output: { ...(_0x50798b['output'] || {}), canvasBinding: {} },
        workspace: {
          ...(_0x50798b['workspace'] || {}),
          view: 'home',
          openProjectMenuId: '',
          pendingDeleteProjectId: '',
        },
      });
    return (
      _0xfdc8f8(
        normalizePersonReplacementProjectLibrary({
          ..._0x27e897,
          currentProjectId: _0x27e897['currentProjectId'],
          projects: [_0x4e26e7, ..._0x27e897['projects']],
        }),
      ),
      _0x3561eb(),
      _0x2322c0(),
      _0x473205('项目副本已创建。', 'success'),
      _0x1a7d1e()
    );
  }
  async function _0x4123e3({ projectId: _0x59a5fd } = {}) {
    const _0x4371b5 = normalizeText(_0x59a5fd);
    if (_0x4371b5 === normalizeText(_0x5932de()['id'])) _0x1d038b();
    const _0x5b868c = _0x5ff5f9(_0x4371b5);
    if (!_0x5b868c) return (_0x473205('人物替换项目不存在。', 'error'), null);
    if (_0x573d69(_0x4371b5) || !canCollectPersonReplacementProject(_0x5b868c))
      return (_0x473205('项目仍有任务处理中，请完成后再收集。', 'info'), null);
    if (typeof _0x1c4d9d?.['exportProject'] !== 'function')
      return (_0x473205('当前环境不支持收集项目。', 'error'), null);
    return await _0x1c4d9d['exportProject']({
      projectType: 'person-replacement',
      projectId: _0x4371b5,
      projectName: _0x5b868c['title'],
      projectData: createPersonReplacementProjectPackagePayload(_0x5b868c),
    });
  }
  async function _0x3cc7be() {
    if (typeof _0x1c4d9d?.['importProject'] !== 'function')
      return (_0x473205('当前环境不支持导入项目。', 'error'), null);
    return await _0x1c4d9d['importProject']();
  }
  function _0x564303(_0x1055cb = {}) {
    if (normalizeText(_0x1055cb['projectType']) !== 'person-replacement') return null;
    const _0x1082b7 = _0x363247(),
      _0x268f39 = createImportedPersonReplacementProject(_0x1055cb['projectData'] || _0x1055cb['data'], {
        projectId: _0x7a10ca('person-replacement'),
        now: _0x1082b7,
      });
    _0x1d038b();
    const _0x279dd3 = _0x524fcd();
    return (
      _0xfdc8f8(
        normalizePersonReplacementProjectLibrary({
          ..._0x279dd3,
          currentProjectId: _0x268f39['id'],
          projects: [
            _0x268f39,
            ..._0x279dd3['projects']['filter']((_0x3a6d2a) => _0x3a6d2a['id'] !== _0x268f39['id']),
          ],
        }),
      ),
      _0x3561eb(),
      _0x2322c0({ immediate: !![] }),
      _0x1f13f0(_0x268f39['id']),
      _0x25ede5(_0x268f39)
    );
  }
  const _0x583946 = ({ projectId: _0x341c9b, archived: _0x5a9f1b } = {}) =>
    _0x34fb6e(_0x341c9b, (_0x8cdcbf) => ({ ..._0x8cdcbf, archivedAt: _0x5a9f1b ? Date['now']() : 0x0 }));
  function _0x1478eb({ projectId: _0x1d7b0e } = {}) {
    const _0x3f100c = normalizeText(_0x1d7b0e),
      _0x268cba = _0x524fcd();
    if (!_0x268cba['projects']['some']((_0x164d84) => _0x164d84['id'] === _0x3f100c)) return null;
    if (_0x573d69(_0x3f100c))
      return (
        _0x473205(
          _0x368945() ? '当前项目正在后台处理，暂时不能删除。' : '当前项目仍有任务处理中，暂时不能删除。',
          'info',
        ),
        null
      );
    return (
      _0xfdc8f8(removePersonReplacementProject(_0x268cba, _0x3f100c)),
      _0x3cea51(_0x3f100c),
      _0x5932de()['id'] === _0x3f100c &&
        _0x316da4(_0x1270d0(), {
          persist: ![],
          presentation: 'none',
          reason: 'delete-project',
          touchUpdatedAt: ![],
        }),
      _0x3561eb(),
      _0x2322c0(),
      _0x473205('人物替换项目已删除。', 'success'),
      _0x1a7d1e()
    );
  }
  return Object['freeze']({
    archiveProject: _0x583946,
    collectProject: _0x4123e3,
    deleteProject: _0x1478eb,
    duplicateProject: _0x40a14b,
    importProjectPackage: _0x3cc7be,
    importProjectPackageResult: _0x564303,
    renameProject: _0x13365e,
  });
}
