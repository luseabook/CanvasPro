import { createWorkspacePersistenceCoordinator } from '../workspacePersistenceCoordinator.js';
import {
  canCollectStoryProject,
  createImportedStoryProjectEntry,
  createStoryProjectPackagePayload,
} from './storyProjectPackage.js';
function normalizeText(_0x304845) {
  return String(_0x304845 ?? '')['trim']();
}
const TRANSIENT_ACTIONS = new Set([
    'toggle-script-selection',
    'cancel-script-selection',
    'select-all-script-episodes',
    'select-script-episode',
    'toggle-project-sort-menu',
    'toggle-project-menu',
    'request-inline-regeneration',
    'cancel-inline-regeneration',
    'toggle-clip-adjustment',
    'toggle-clip-prompt-history',
    'toggle-clip-adjustment-mode',
    'select-clip-adjustment-mode',
    'choose-script',
    'choose-rewrite-script',
    'choose-replication-videos',
    'reupload-replication-video',
    'preview-replication-video',
    'extract-assets-experimental',
    'cancel-asset-selection',
    'toggle-all-assets',
    'add-library-assets-to-project',
    'toggle-clip-selection',
    'select-all-clips',
    'cancel-clip-selection',
    'toggle-canvas-sync-menu',
    'export-current-clip',
    'export-episode-clips',
  ]),
  UI_ACTIONS = new Set(['episode-back', 'previous-step', 'paste-script']);
export function createStoryProjectPersistenceWorkspaceController({
  state: _0x1b6501,
  projectData: _0x2c17c4,
  windowObject: _0x1b3a09,
  saveWorkspace: _0x2d9fce,
  projectPackages: _0x1f21d3,
  advanceProjectSession: _0x2beb08,
  openStoredProject: _0x1b7430,
  render: _0x5212a7,
  showToast: _0x29d8ee,
  onPersistenceState: onPersistenceState = () => {},
} = {}) {
  const _0x315bdf = () => _0x2c17c4['syncCurrentEntry'](),
    _0xce4ed8 = createWorkspacePersistenceCoordinator({
      ready: ![],
      debounceMs: 0x3e8,
      maxWaitMs: 0x1388,
      save: _0x2d9fce,
      getSnapshot: () => _0x2c17c4['createSnapshot'](),
      setTimeoutFn: _0x1b3a09?.['setTimeout']?.['bind']?.(_0x1b3a09),
      clearTimeoutFn: _0x1b3a09?.['clearTimeout']?.['bind']?.(_0x1b3a09),
      onStateChange: onPersistenceState,
      onError: (_0x13d583) => {
        console['warn']('[storyWorkspace] 自动保存失败', _0x13d583);
      },
    });
  function _0x412af9() {
    if (!_0xce4ed8['isReady']() || typeof _0x2d9fce !== 'function') return Promise['resolve'](![]);
    return _0xce4ed8['flush']({ force: !![] })
      ['then'](() => !![])
      ['catch'](() => ![]);
  }
  function _0x9e0a89({ immediate: immediate = ![], uiOnly: uiOnly = ![], action: action = '' } = {}) {
    if (!immediate && TRANSIENT_ACTIONS['has'](action)) return;
    _0xce4ed8['schedule']({
      immediate: immediate,
      delayMs: uiOnly || UI_ACTIONS['has'](action) ? 0x1388 : 0x3e8,
    });
  }
  function _0x25e3d1() {
    const _0x150c5d = new Set(
        _0x1b6501['projects']
          ['map']((_0x51c865) => normalizeText(_0x51c865?.['id'] || _0x51c865?.['data']?.['project']?.['id']))
          ['filter'](Boolean),
      ),
      _0x395c40 = 'story-' + Date['now']() + '-import';
    let _0x2df550 = _0x395c40,
      _0x50c62a = 0x2;
    while (_0x150c5d['has'](_0x2df550)) {
      ((_0x2df550 = _0x395c40 + '-' + _0x50c62a), (_0x50c62a += 0x1));
    }
    return _0x2df550;
  }
  async function _0x3c5cb6(_0x31c23f) {
    _0x315bdf();
    const _0x4c2283 = normalizeText(_0x31c23f),
      _0x43d7d4 = _0x2c17c4['getEntry'](_0x4c2283);
    _0x1b6501['openProjectMenuId'] = '';
    if (!_0x43d7d4?.['data']?.['project']) return (_0x29d8ee('剧本项目不存在。', 'error'), _0x5212a7(), null);
    if (!canCollectStoryProject(_0x43d7d4))
      return (_0x29d8ee('项目仍有任务处理中，请完成后再收集。', 'info'), _0x5212a7(), null);
    if (typeof _0x1f21d3?.['exportProject'] !== 'function')
      return (_0x29d8ee('当前环境不支持收集项目。', 'error'), _0x5212a7(), null);
    return (
      _0x5212a7(),
      await _0x1f21d3['exportProject']({
        projectType: 'story',
        projectId: _0x4c2283,
        projectName: _0x43d7d4['title'] || _0x43d7d4['data']['project']['title'],
        projectData: createStoryProjectPackagePayload(_0x43d7d4),
      })
    );
  }
  async function _0x35a493() {
    if (typeof _0x1f21d3?.['importProject'] !== 'function')
      return (_0x29d8ee('当前环境不支持导入项目。', 'error'), null);
    return await _0x1f21d3['importProject']();
  }
  function _0x37e2db(_0x560633 = {}) {
    if (normalizeText(_0x560633['projectType']) !== 'story') return null;
    const _0x5f04eb = createImportedStoryProjectEntry(_0x560633['projectData'] || _0x560633['data'], {
      projectId: _0x25e3d1(),
    });
    return (
      _0x315bdf(),
      _0x2c17c4['addEntry'](_0x5f04eb),
      _0x2beb08(_0x5f04eb['id']),
      (_0x1b6501['openProjectMenuId'] = ''),
      (_0x1b6501['pendingDeleteProjectId'] = ''),
      _0x9e0a89({ immediate: !![] }),
      _0x1b7430(_0x5f04eb['id']),
      JSON['parse'](JSON['stringify'](_0x5f04eb))
    );
  }
  return Object['freeze']({
    collectStoredProject: _0x3c5cb6,
    coordinator: _0xce4ed8,
    importProjectPackage: _0x35a493,
    importProjectPackageResult: _0x37e2db,
    persistNow: _0x412af9,
    schedule: _0x9e0a89,
    syncCurrentProjectEntry: _0x315bdf,
  });
}
