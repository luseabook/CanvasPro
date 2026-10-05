import { buildStoryBackgroundTaskId, getStoryBackgroundTasks } from './storyBackgroundTasks.js';
import {
  createStoryClipGenerationController,
  getRecoverableStoryClipVideoTask,
} from './storyClipGeneration.js';
import { deriveStoryEpisodeStatus } from './storyPlanningData.js';
import { resolveModelExecution } from '../../manifests/index.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function createStoryClipVideoTaskWorkspaceController({
  state: state,
  activeControllers: activeControllers,
  createProjectToken: createProjectToken,
  createProjectTokenForData: createProjectTokenForData,
  isProjectTaskLive: isProjectTaskLive,
  isProjectTaskCurrent: isProjectTaskCurrent,
  registerProjectData: registerProjectData,
  startBackgroundTask: startBackgroundTask,
  updateBackgroundTask: updateBackgroundTask,
  finishBackgroundTask: finishBackgroundTask,
  syncProjectEntry: syncProjectEntry,
  restoreProjectTaskState: restoreProjectTaskState,
  schedulePersistence: schedulePersistence,
  refreshEpisodeCard: refreshEpisodeCard,
  refreshClipGeneration: refreshClipGeneration,
  render: render,
  showTaskResultToast: showTaskResultToast,
  showNavigableTaskResultToast: showNavigableTaskResultToast,
  getWorkspaceDestroyed: getWorkspaceDestroyed = () => ![],
  windowObject: windowObject = globalThis['window'] || globalThis,
} = {}) {
  if (
    !state ||
    !(activeControllers instanceof Map) ||
    typeof createProjectToken !== 'function' ||
    typeof createProjectTokenForData !== 'function' ||
    typeof isProjectTaskLive !== 'function' ||
    typeof isProjectTaskCurrent !== 'function' ||
    typeof registerProjectData !== 'function' ||
    typeof startBackgroundTask !== 'function' ||
    typeof updateBackgroundTask !== 'function' ||
    typeof finishBackgroundTask !== 'function' ||
    typeof syncProjectEntry !== 'function' ||
    typeof restoreProjectTaskState !== 'function' ||
    typeof schedulePersistence !== 'function' ||
    typeof refreshEpisodeCard !== 'function' ||
    typeof refreshClipGeneration !== 'function' ||
    typeof render !== 'function'
  )
    throw new TypeError('Story clip video tasks require project, persistence, and presentation adapters.');
  const run = () => getWorkspaceDestroyed() === !![],
    replaceClip = (item, key, enabled, index = state['data']) => {
      const response = index?.['episodes']?.['find']((result) => result['id'] === item),
        count = response?.['clips']?.['findIndex']((data) => data['id'] === key) ?? -1;
      if (!response || count < 0 || !enabled) return ![];
      return (
        (response['clips'][count] = enabled),
        (response['status'] = deriveStoryEpisodeStatus(response['clips'])),
        !![]
      );
    },
    getGenerationKey = (options, target, source) =>
      [options, target, source]['map'](normalizeText)['join'](':'),
    syncBackgroundTask = (next, episodeId, clipId, current, { batch: batch = null } = {}) => {
      const remoteTaskId =
          current?.['generation'] && typeof current['generation'] === 'object' ? current['generation'] : {},
        status = normalizeText(remoteTaskId['status'])['toLowerCase']();
      if (!status || status === 'idle') return null;
      const id = buildStoryBackgroundTaskId('clip-video', { episodeId: episodeId, clipId: clipId }),
        args = {
          type: 'clip-video',
          scope: { episodeId: episodeId, clipId: clipId },
          label: '生成片段视频',
          message: normalizeText(remoteTaskId['error']) || '正在等待视频生成结果',
          status: status,
          resumable: Boolean(normalizeText(remoteTaskId['taskId'])),
          remoteTaskId: remoteTaskId['taskId'],
          modelId: remoteTaskId['modelId'] || current?.['modelId'],
          provider: remoteTaskId['provider'] || current?.['provider'],
          providerProfileId: remoteTaskId['providerProfileId'],
          executionId: remoteTaskId['executionId'],
        };
      if (batch) args['batch'] = batch;
      const storyBackgroundTasks = getStoryBackgroundTasks(next['data'])['find'](
        (entry) => entry['id'] === id,
      );
      if (['pending', 'queued', 'recovering', 'running', 'submitting']['includes'](status))
        return storyBackgroundTasks
          ? updateBackgroundTask(next, id, args)
          : startBackgroundTask(next, { id: id, ...args });
      if (!storyBackgroundTasks) return null;
      if (['success', 'succeeded', 'completed', 'done']['includes'](status))
        return finishBackgroundTask(next, id, { status: 'succeeded', message: '片段视频生成完成' });
      if (['cancelled', 'canceled']['includes'](status))
        return finishBackgroundTask(next, id, { status: 'cancelled', message: '片段视频任务已取消' });
      if (['failed', 'error']['includes'](status))
        return finishBackgroundTask(next, id, {
          status: 'failed',
          message: '片段视频生成失败',
          error: remoteTaskId['error'] || '片段视频生成失败。',
        });
      return null;
    },
    createGenerationController = (record, payload, handle, config = null, batch2 = null) => {
      const scope = record['data'];
      return createStoryClipGenerationController({
        getClip: () => {
          const input = scope?.['episodes']?.['find']((output) => output['id'] === payload);
          return input?.['clips']?.['find']((value2) => value2['id'] === handle) || config;
        },
        updateClip: (value3) => {
          if (!isProjectTaskLive(record)) return;
          (replaceClip(payload, handle, value3, scope),
            syncBackgroundTask(record, payload, handle, value3, { batch: batch2 }),
            syncProjectEntry(record),
            schedulePersistence({ immediate: !![] }));
          if (!isProjectTaskCurrent(record)) return;
          restoreProjectTaskState(scope);
          if (state['view'] === 'project' && state['step'] === 3) {
            refreshEpisodeCard(payload);
            return;
          }
          if (
            state['view'] === 'episode' &&
            normalizeText(state['selectedEpisodeId']) === normalizeText(payload) &&
            state['selectedClipId'] === handle
          ) {
            if (!refreshClipGeneration()) render();
          }
        },
      });
    },
    waitForRecoveryManifest = async (providerHint, value4 = 15000) => {
      const value5 = Date['now']();
      while (!run()) {
        const modelExecution = resolveModelExecution(providerHint['modelId'], {
          providerHint: providerHint['provider'],
        });
        if (modelExecution?.['modelManifest'] && modelExecution?.['executionManifest']) return !![];
        if (Date['now']() - value5 >= value4) return ![];
        await new Promise((value6) => windowObject['setTimeout'](value6, 250));
      }
      return ![];
    },
    resumeTask = async ({
      episodeId: episodeId2,
      clipId: clipId2,
      recovery: recovery,
      projectToken: projectToken = createProjectToken(state),
    }) => {
      registerProjectData(projectToken);
      const value7 = getGenerationKey(projectToken['projectId'], episodeId2, clipId2);
      if (activeControllers['has'](value7) || run()) return ![];
      const enabled2 = await waitForRecoveryManifest(recovery);
      if (!isProjectTaskLive(projectToken) || activeControllers['has'](value7)) return ![];
      if (!enabled2) {
        const value8 = projectToken['data']?.['episodes']?.['find']((value9) => value9['id'] === episodeId2),
          args2 = value8?.['clips']?.['find']((value10) => value10['id'] === clipId2);
        if (args2) {
          const value11 = {
            ...args2,
            generation: {
              ...args2['generation'],
              status: 'failed',
              error: '视频模型缺少 manifest 或 execution manifest：' + recovery['modelId'],
            },
          };
          (replaceClip(episodeId2, clipId2, value11, projectToken['data']),
            syncBackgroundTask(projectToken, episodeId2, clipId2, value11),
            schedulePersistence({ immediate: !![] }));
          if (isProjectTaskCurrent(projectToken)) {
            restoreProjectTaskState(projectToken['data']);
            if (state['view'] === 'project' && state['step'] === 3) refreshEpisodeCard(episodeId2);
            else
              state['view'] === 'episode' &&
                normalizeText(state['selectedEpisodeId']) === normalizeText(episodeId2) &&
                render();
          }
        }
        return ![];
      }
      const value12 = projectToken['data']?.['episodes']?.['find']((value13) => value13['id'] === episodeId2),
        enabled3 = value12?.['clips']?.['find']((value14) => value14['id'] === clipId2);
      if (!enabled3 || !getRecoverableStoryClipVideoTask(enabled3)) return ![];
      const value15 = createGenerationController(projectToken, episodeId2, clipId2, enabled3);
      activeControllers['set'](value7, value15);
      try {
        const response2 = await value15['resume']({
          projectId: projectToken['projectId'],
          episodeId: episodeId2,
          taskId: recovery['taskId'],
          modelId: recovery['modelId'],
          provider: recovery['provider'],
          providerProfileId: recovery['providerProfileId'],
          executionId: recovery['executionId'],
          startedAt: recovery['startedAt'],
        });
        if (!isProjectTaskLive(projectToken)) return ![];
        return (
          response2?.['status'] === 'success' &&
            showNavigableTaskResultToast?.('片段视频任务已恢复并生成完成。', 'success', projectToken, {
              episodeId: episodeId2,
              clipId: clipId2,
            }),
          schedulePersistence({ immediate: !![] }),
          response2?.['status'] === 'success' || response2?.['status'] === 'pending'
        );
      } catch (error) {
        if (!isProjectTaskLive(projectToken)) return ![];
        const value16 = projectToken['data']?.['episodes']?.['find'](
            (value17) => value17['id'] === episodeId2,
          ),
          args3 = value16?.['clips']?.['find']((value18) => value18['id'] === clipId2);
        if (args3) {
          const value19 = {
            ...args3,
            generation: {
              ...args3['generation'],
              status: 'failed',
              error: error?.['message'] || '片段视频任务恢复失败。',
            },
          };
          (replaceClip(episodeId2, clipId2, value19, projectToken['data']),
            syncBackgroundTask(projectToken, episodeId2, clipId2, value19),
            schedulePersistence({ immediate: !![] }));
        }
        return (
          showTaskResultToast?.(error?.['message'] || '片段视频任务恢复失败。', 'error', {
            episodeId: episodeId2,
            clipId: clipId2,
            taskId: recovery['taskId'],
            error: error,
          }),
          ![]
        );
      } finally {
        activeControllers['get'](value7) === value15 && activeControllers['delete'](value7);
        if (isProjectTaskCurrent(projectToken)) {
          restoreProjectTaskState(projectToken['data']);
          if (state['view'] === 'project' && state['step'] === 3) refreshEpisodeCard(episodeId2);
          else
            state['view'] === 'episode' &&
              normalizeText(state['selectedEpisodeId']) === normalizeText(episodeId2) &&
              render();
        }
      }
    },
    resumeTasks = (value20 = state['data']) => {
      const projectToken2 = createProjectTokenForData(value20),
        list = [];
      for (const episodeId3 of value20?.['episodes'] || []) {
        for (const clipId3 of episodeId3?.['clips'] || []) {
          const recovery2 = getRecoverableStoryClipVideoTask(clipId3);
          if (!recovery2) continue;
          list['push']({ episodeId: episodeId3['id'], clipId: clipId3['id'], recovery: recovery2 });
        }
      }
      return (
        list['forEach']((args4) => {
          void resumeTask({ ...args4, projectToken: projectToken2 });
        }),
        list['length']
      );
    };
  return Object['freeze']({
    createGenerationController: createGenerationController,
    getGenerationKey: getGenerationKey,
    replaceClip: replaceClip,
    resumeTask: resumeTask,
    resumeTasks: resumeTasks,
    syncBackgroundTask: syncBackgroundTask,
    waitForRecoveryManifest: waitForRecoveryManifest,
  });
}
