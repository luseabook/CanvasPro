import {
  finishStoryBackgroundTask,
  startStoryBackgroundTask,
  updateStoryBackgroundTask,
  updateStoryBackgroundTaskBatch,
} from './storyBackgroundTasks.js';
import {
  deriveStoryProjectTaskState,
  reconcileStoryClipVideoBackgroundTasks,
} from './storyProjectTaskState.js';
import {
  advanceStoryProjectSession,
  createStoryProjectTaskToken,
  isStoryProjectTaskTokenCurrent,
  isStoryProjectTaskTokenLive,
} from './storyProjectTaskToken.js';
import { isStoryAssetVoiceLoading } from './storyAssetGenerationState.js';
import { reportStoryTaskCenter } from './storyTaskCenterProjection.js';
import { getProviderConfig } from '../../../api/configApi.js';
function normalizeText(value) {
  return String(value || '')['trim']();
}
function cloneData(item) {
  return JSON['parse'](JSON['stringify'](item));
}
export function createStoryProjectTaskWorkspaceController({
  state: state,
  activeClipGenerationControllers: activeClipGenerationControllers,
  activeBackgroundExecutions: activeBackgroundExecutions,
  activeBackgroundRecoveries: activeBackgroundRecoveries,
  replicationAnalysisPromises: replicationAnalysisPromises,
  replicationSourceFileByEpisodeKey: replicationSourceFileByEpisodeKey,
  projectData: projectData,
  getWorkspaceDestroyed: getWorkspaceDestroyed = () => ![],
  stopAssetBreakdownProgress: stopAssetBreakdownProgress = () => {},
  schedulePersistence: schedulePersistence = () => {},
  render: render = () => {},
} = {}) {
  if (!state || typeof state !== 'object')
    throw new TypeError('Story project tasks require workspace state.');
  for (const [key, enabled] of Object['entries']({
    activeClipGenerationControllers: activeClipGenerationControllers,
    activeBackgroundExecutions: activeBackgroundExecutions,
    activeBackgroundRecoveries: activeBackgroundRecoveries,
    replicationAnalysisPromises: replicationAnalysisPromises,
    replicationSourceFileByEpisodeKey: replicationSourceFileByEpisodeKey,
    projectData: projectData,
  })) {
    if (!enabled || typeof enabled !== 'object')
      throw new TypeError('Story project tasks require ' + key + '.');
  }
  let index = 0;
  const run = () => getWorkspaceDestroyed() === !![],
    resetTaskState = () => {
      (Object['assign'](state, deriveStoryProjectTaskState()), (state['exportingAssetAppearanceKey'] = ''));
    },
    restoreTaskState = (result = state['data']) => {
      (reconcileStoryClipVideoBackgroundTasks(result),
        reportStoryTaskCenter(result),
        resetTaskState(),
        Object['assign'](state, deriveStoryProjectTaskState(result)),
        state['characterVoiceEditor'] &&
          (state['characterVoiceEditor']['isGenerating'] = isStoryAssetVoiceLoading(
            state,
            state['characterVoiceEditor']['assetId'],
          )));
    },
    invalidateRuntime = (data) => {
      const id = normalizeText(data);
      if (!id) return ![];
      for (const [enabled2, options] of activeClipGenerationControllers) {
        if (!enabled2['startsWith'](id + ':')) continue;
        (options['pause'](), activeClipGenerationControllers['delete'](enabled2));
      }
      for (const target of activeBackgroundExecutions) {
        target['startsWith'](id + ':') && activeBackgroundExecutions['delete'](target);
      }
      for (const source of activeBackgroundRecoveries) {
        source['startsWith'](id + ':') && activeBackgroundRecoveries['delete'](source);
      }
      replicationAnalysisPromises['delete'](id);
      for (const next of replicationSourceFileByEpisodeKey['keys']()) {
        next['startsWith'](id + ':') && replicationSourceFileByEpisodeKey['delete'](next);
      }
      return (
        projectData['releaseData'](id),
        advanceStoryProjectSession(state, id),
        reportStoryTaskCenter({ project: { id: id, backgroundTasks: [] } }),
        !![]
      );
    },
    beginSession = ({ invalidateCurrentProject: invalidateCurrentProject = ![] } = {}) => {
      const text = normalizeText(state['data']?.['project']?.['id']);
      if (invalidateCurrentProject) invalidateRuntime(text);
      return (
        stopAssetBreakdownProgress({ clearState: !![] }),
        resetTaskState(),
        createStoryProjectTaskToken(state)
      );
    },
    createTokenForData = (data2 = state['data']) => {
      const current = projectData['getEntry'](data2?.['project']?.['id']),
        storyProjectTaskToken = createStoryProjectTaskToken({ ...state, data: data2 });
      return (
        (storyProjectTaskToken['projectTitleEdited'] =
          data2 === state['data']
            ? state['projectTitleEdited'] === !![]
            : current?.['projectTitleEdited'] === !![]),
        storyProjectTaskToken
      );
    },
    isCurrent = (entry) => isStoryProjectTaskTokenCurrent(state, entry) && !run(),
    isLive = (record) => isStoryProjectTaskTokenLive(state, record) && !run(),
    registerProjectData = (payload) => isLive(payload) && projectData['registerTaskData'](payload),
    getBackgroundExecutionKey = (handle, config) => {
      const text2 = normalizeText(handle?.['projectId']),
        text3 = normalizeText(config);
      return text2 && text3 ? text2 + ':' + text3 : '';
    },
    syncProjectEntry = (scope) => isLive(scope) && projectData['syncTaskEntry'](scope),
    persistChange = (input, { refreshHome: refreshHome = ![] } = {}) => {
      if (!isLive(input)) return;
      (syncProjectEntry(input),
        reportStoryTaskCenter(input?.['data']),
        schedulePersistence({ immediate: !![] }),
        refreshHome && state['view'] === 'home' && !run() && render({ capturePageState: ![] }));
    },
    startBackgroundTask = (enabled3, providerProfileId = {}, { refreshHome: refreshHome = !![] } = {}) => {
      if (!enabled3?.['data']?.['project']) return null;
      registerProjectData(enabled3);
      const startStoryBackgroundTask2 = startStoryBackgroundTask(enabled3['data'], {
          ...providerProfileId,
          providerProfileId:
            providerProfileId['providerProfileId'] ||
            (providerProfileId['provider']
              ? getProviderConfig(providerProfileId['provider'])?.['providerProfileId']
              : ''),
        }),
        output = getBackgroundExecutionKey(
          enabled3,
          startStoryBackgroundTask2?.['id'] || providerProfileId['id'],
        );
      if (output) activeBackgroundExecutions['add'](output);
      return (persistChange(enabled3, { refreshHome: refreshHome }), startStoryBackgroundTask2);
    },
    updateBackgroundTask = (enabled4, value2, value3 = {}, { refreshHome: refreshHome = !![] } = {}) => {
      if (!enabled4?.['data']?.['project']) return null;
      const updateStoryBackgroundTask2 = updateStoryBackgroundTask(enabled4['data'], value2, value3);
      if (updateStoryBackgroundTask2) persistChange(enabled4, { refreshHome: refreshHome });
      return updateStoryBackgroundTask2;
    },
    updateBackgroundTaskBatch = (enabled5, value4, value5 = {}) => {
      if (!enabled5?.['data']?.['project']) return 0;
      const updateStoryBackgroundTaskBatch2 = updateStoryBackgroundTaskBatch(
        enabled5['data'],
        value4,
        value5,
      );
      if (updateStoryBackgroundTaskBatch2) persistChange(enabled5, { refreshHome: !![] });
      return updateStoryBackgroundTaskBatch2;
    },
    createTaskBatch = (value6, value7 = {}) => {
      const text4 = normalizeText(state['data']?.['project']?.['id']) || 'project';
      return (
        (index += 1),
        {
          ...cloneData(value7),
          id: (normalizeText(value6) || 'batch') + ':' + text4 + ':' + Date['now']() + ':' + index,
          type: normalizeText(value6) || 'batch',
          total: Math['max'](0, Math['trunc'](Number(value7['total']) || 0)),
          completed: Math['max'](0, Math['trunc'](Number(value7['completed']) || 0)),
          label: normalizeText(value7['label']),
        }
      );
    },
    syncTaskBatch = (value8, enabled6, value9 = {}) => {
      if (!enabled6?.['id']) return null;
      return (
        Object['assign'](enabled6, cloneData(value9)),
        updateBackgroundTaskBatch(value8, enabled6['id'], enabled6),
        enabled6
      );
    },
    finishBackgroundTask = (enabled7, value10, value11 = {}, { refreshHome: refreshHome = !![] } = {}) => {
      if (!enabled7?.['data']?.['project']) return null;
      const finishStoryBackgroundTask2 = finishStoryBackgroundTask(enabled7['data'], value10, value11);
      if (finishStoryBackgroundTask2) persistChange(enabled7, { refreshHome: refreshHome });
      const value12 = getBackgroundExecutionKey(enabled7, value10);
      if (value12) activeBackgroundExecutions['delete'](value12);
      return finishStoryBackgroundTask2;
    };
  return Object['freeze']({
    advanceProjectSession: advanceStoryProjectSession,
    beginSession: beginSession,
    createProjectToken: createStoryProjectTaskToken,
    createTaskBatch: createTaskBatch,
    createTokenForData: createTokenForData,
    finishBackgroundTask: finishBackgroundTask,
    getBackgroundExecutionKey: getBackgroundExecutionKey,
    invalidateRuntime: invalidateRuntime,
    isCurrent: isCurrent,
    isLive: isLive,
    persistChange: persistChange,
    registerProjectData: registerProjectData,
    resetTaskState: resetTaskState,
    restoreTaskState: restoreTaskState,
    startBackgroundTask: startBackgroundTask,
    syncProjectEntry: syncProjectEntry,
    syncTaskBatch: syncTaskBatch,
    updateBackgroundTask: updateBackgroundTask,
    updateBackgroundTaskBatch: updateBackgroundTaskBatch,
  });
}
