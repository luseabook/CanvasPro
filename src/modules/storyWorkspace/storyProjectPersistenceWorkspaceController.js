import { createWorkspacePersistenceCoordinator } from '../workspacePersistenceCoordinator.js';
import {
  canCollectStoryProject,
  createImportedStoryProjectEntry,
  createStoryProjectPackagePayload,
} from './storyProjectPackage.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
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
    'choose-novel',
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
  state: state,
  projectData: projectData,
  windowObject: windowObject,
  saveWorkspace: saveWorkspace,
  projectPackages: projectPackages,
  advanceProjectSession: advanceProjectSession,
  openStoredProject: openStoredProject,
  render: render,
  showToast: showToast,
  onPersistenceState: onPersistenceState = () => {},
} = {}) {
  const syncCurrentProjectEntry = () => projectData['syncCurrentEntry'](),
    coordinator = createWorkspacePersistenceCoordinator({
      ready: false,
      debounceMs: 1000,
      maxWaitMs: 5000,
      save: saveWorkspace,
      getSnapshot: () => projectData['createSnapshot'](),
      setTimeoutFn: windowObject?.['setTimeout']?.['bind']?.(windowObject),
      clearTimeoutFn: windowObject?.['clearTimeout']?.['bind']?.(windowObject),
      onStateChange: onPersistenceState,
      onError: (item) => {
        console['warn']('[storyWorkspace] 自动保存失败', item);
      },
    });
  function persistNow() {
    if (!coordinator['isReady']() || typeof saveWorkspace !== 'function') return Promise['resolve'](false);
    return coordinator['flush']({ force: true })
      ['then'](() => true)
      ['catch'](() => false);
  }
  function schedule({ immediate: immediate = false, uiOnly: uiOnly = false, action: action = '' } = {}) {
    if (!immediate && TRANSIENT_ACTIONS['has'](action)) return;
    coordinator['schedule']({
      immediate: immediate,
      delayMs: uiOnly || UI_ACTIONS['has'](action) ? 5000 : 1000,
    });
  }
  function projectId() {
    const map = new Set(
        state['projects']
          ['map']((key) => normalizeText(key?.['id'] || key?.['data']?.['project']?.['id']))
          ['filter'](Boolean),
      ),
      index = 'story-' + Date['now']() + '-import';
    let result = index,
      data = 2;
    while (map['has'](result)) {
      ((result = index + '-' + data), (data += 1));
    }
    return result;
  }
  async function collectStoredProject(options) {
    syncCurrentProjectEntry();
    const projectId2 = normalizeText(options),
      projectName = projectData['getEntry'](projectId2);
    state['openProjectMenuId'] = '';
    if (!projectName?.['data']?.['project']) return (showToast('剧本项目不存在。', 'error'), render(), null);
    if (!canCollectStoryProject(projectName))
      return (showToast('项目仍有任务处理中，请完成后再收集。', 'info'), render(), null);
    if (typeof projectPackages?.['exportProject'] !== 'function')
      return (showToast('当前环境不支持收集项目。', 'error'), render(), null);
    return (
      render(),
      await projectPackages['exportProject']({
        projectType: 'story',
        projectId: projectId2,
        projectName: projectName['title'] || projectName['data']['project']['title'],
        projectData: createStoryProjectPackagePayload(projectName),
      })
    );
  }
  async function importProjectPackage() {
    if (typeof projectPackages?.['importProject'] !== 'function')
      return (showToast('当前环境不支持导入项目。', 'error'), null);
    return await projectPackages['importProject']();
  }
  function importProjectPackageResult(options2 = {}) {
    if (normalizeText(options2['projectType']) !== 'story') return null;
    const importedStoryProjectEntry = createImportedStoryProjectEntry(
      options2['projectData'] || options2['data'],
      {
        projectId: projectId(),
      },
    );
    return (
      syncCurrentProjectEntry(),
      projectData['addEntry'](importedStoryProjectEntry),
      advanceProjectSession(importedStoryProjectEntry['id']),
      (state['openProjectMenuId'] = ''),
      (state['pendingDeleteProjectId'] = ''),
      schedule({ immediate: true }),
      openStoredProject(importedStoryProjectEntry['id']),
      JSON['parse'](JSON['stringify'](importedStoryProjectEntry))
    );
  }
  return Object['freeze']({
    collectStoredProject: collectStoredProject,
    coordinator: coordinator,
    importProjectPackage: importProjectPackage,
    importProjectPackageResult: importProjectPackageResult,
    persistNow: persistNow,
    schedule: schedule,
    syncCurrentProjectEntry: syncCurrentProjectEntry,
  });
}
