import {
  buildStoryBackgroundTaskId,
  getStoryBackgroundTasks,
  isStoryBackgroundTaskActive,
} from './storyBackgroundTasks.js';
import {
  cancelStoryEpisodeSplitBatch,
  finalizeStoryEpisodeSplitBatch,
  resetStoryEpisodeSplitBatchState,
  runStoryEpisodeSplitBatchQueue,
} from './storyEpisodeSplitBatchExecution.js';
import { createStoryEpisodeSplitRunRecorder } from './storyEpisodeSplitRun.js';
import { createStoryEpisodeScriptGuard } from './storyScriptRevision.js';
import { getStoryEpisodeSplitDeliveryMessage } from './storyClipQualityPresentation.js';
import {
  prepareStoryReplicationGenerationEpisode,
  assertStoryReplicationGenerationCurrent,
} from './storyReplicationGenerationPreparation.js';
import { runStoryEpisodeSplitQualityReview } from './storyEpisodeSplitQualityApplication.js';
import { applyReplicationSegmentPlan } from '../../domain/storyGeneration/videoReplicationSegmentPlan.js';
import { applyReplicationAsrDelivery } from '../../domain/storyGeneration/videoReplicationAsrDelivery.js';
import { buildVideoReplicationGenerationAssets } from '../../domain/storyGeneration/videoReplicationGenerationAssets.js';
import { mergeStoryEpisodeSplit } from './storyPlanningData.js';
import {
  getStoryEpisodeBatchControlState,
  getStoryEpisodeBatchTargets,
  setStoryEpisodeSplitRunning,
} from './storyPlanningTaskState.js';
import { normalizeStoryPromptMode, resolveStoryPromptModeDefaultVideoModelId } from './storyPromptModes.js';
import { createStoryTaskBatchCancellationRegistry } from './storyTaskBatchCancellation.js';
import {
  initializeStoryEpisodeVideoGenerationDurations,
  resolveStoryVideoClipDurationConstraints,
} from './storyVideoGenerationSettings.js';
import { resolveStoryWorkspaceModelId } from './storyWorkspaceModelCatalog.js';
import { createStoryEpisodeSplitDeveloperDiagnostics } from './storyWorkspaceDeveloperDiagnostics.js';
import {
  getStoryEpisodeSplitPaidRetryChoice,
  isStoryEpisodeExperimentalSplitAvailable,
  shouldUseStoryEpisodeExperimentalSplit,
  resolveStoryEpisodeExperimentalErrorMessage,
} from './storyEpisodeSplitPresentationPolicy.js';
export {
  isStoryEpisodeExperimentalSplitAvailable,
  shouldUseStoryEpisodeExperimentalSplit,
  resolveStoryEpisodeExperimentalErrorMessage,
} from './storyEpisodeSplitPresentationPolicy.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function cloneData(item) {
  return JSON['parse'](JSON['stringify'](item));
}
function requireFunctions(key, index) {
  for (const [result, data] of Object['entries'](index)) {
    if (typeof data !== 'function') throw new TypeError(key + ' requires ' + result + '.');
  }
}
export function createStoryEpisodeSplitWorkspaceController({
  state: state,
  windowObject: windowObject = globalThis['window'] || globalThis,
  operations: operations = {},
  projectTasks: projectTasks = {},
  persistence: persistence = {},
  presentation: presentation = {},
  getPlanningContext: getPlanningContext,
} = {}) {
  if (!state || typeof state !== 'object')
    throw new TypeError('Story episode split requires workspace state.');
  (requireFunctions('Story episode split project tasks', {
    createProjectToken: projectTasks['createProjectToken'],
    createTaskBatch: projectTasks['createTaskBatch'],
    finishBackgroundTask: projectTasks['finishBackgroundTask'],
    isCurrent: projectTasks['isCurrent'],
    isLive: projectTasks['isLive'],
    startBackgroundTask: projectTasks['startBackgroundTask'],
    syncProjectEntry: projectTasks['syncProjectEntry'],
    syncTaskBatch: projectTasks['syncTaskBatch'],
    updateBackgroundTask: projectTasks['updateBackgroundTask'],
    updateBackgroundTaskBatch: projectTasks['updateBackgroundTaskBatch'],
  }),
    requireFunctions('Story episode split persistence', {
      isDurableRequired: persistence['isDurableRequired'],
      persistNow: persistence['persistNow'],
      schedule: persistence['schedule'],
    }),
    requireFunctions('Story episode split presentation', {
      getGenerationControl: presentation['getGenerationControl'],
      notifyComplete: presentation['notifyComplete'],
      notifyGenerationResult: presentation['notifyGenerationResult'],
      openEpisode: presentation['openEpisode'],
      render: presentation['render'],
      requestChoice: presentation['requestChoice'],
      showTaskResult: presentation['showTaskResult'],
      showToast: presentation['showToast'],
    }));
  if (typeof getPlanningContext !== 'function')
    throw new TypeError('Story episode split requires getPlanningContext.');
  const isCancellationRequested = createStoryTaskBatchCancellationRegistry();
  function run() {
    return projectTasks['createProjectToken'](state);
  }
  function run2(options, target, sourceMode, args = {}) {
    const promptMode = normalizeStoryPromptMode(
        args['promptMode'] || sourceMode?.['data']?.['project']?.['planning']?.['promptMode'],
        { allowDeveloperModes: !![] },
      ),
      storyPromptModeDefaultVideoModelId = resolveStoryPromptModeDefaultVideoModelId(promptMode),
      videoModelId = resolveStoryWorkspaceModelId(
        'video',
        storyPromptModeDefaultVideoModelId ||
          sourceMode?.['modelSettings']?.['models']?.['video'] ||
          state['models']['video'],
      ),
      storyEpisodeSplit = mergeStoryEpisodeSplit(options, target, {
        ...args,
        promptMode: promptMode,
        videoModelId: videoModelId,
        sourceMode: sourceMode?.['data']?.['project']?.['sourceMode'],
        includeDialogueVoiceGuidance:
          sourceMode?.['data']?.['project']?.['sourceMode'] === 'video-replication',
      });
    return (
      initializeStoryEpisodeVideoGenerationDurations(storyEpisodeSplit, videoModelId),
      storyEpisodeSplit
    );
  }
  function run3({
    episode: episode,
    projectToken: projectToken,
    backgroundTaskId: backgroundTaskId,
    context: context,
    mode: mode,
    promptExperiment: promptExperiment = ![],
  }) {
    const resumePayload = getStoryBackgroundTasks(projectToken['data'])['find'](
      (source) => source['id'] === backgroundTaskId,
    );
    return createStoryEpisodeSplitRunRecorder({
      project: context['project'],
      episode: episode,
      assets: projectToken['data']['assets'],
      constraints: context['project']['planning'],
      execution: {
        modelId: context['model'],
        provider: context['provider'],
        providerProfileId: context['providerProfileId'],
      },
      mode: mode,
      promptExperiment: promptExperiment,
      resumePayload: resumePayload?.['resumePayload'],
      onChange: async (modelId) => {
        (projectTasks['updateBackgroundTask'](projectToken, backgroundTaskId, {
          resumable: !![],
          modelId: modelId['input']['execution']['modelId'],
          provider: modelId['input']['execution']['provider'],
          resumePayload: { kind: modelId['kind'], run: modelId },
        }),
          projectTasks['syncProjectEntry'](projectToken));
        const enabled = await persistence['persistNow']();
        if (persistence['isDurableRequired']() && !enabled)
          throw new Error('分镜运行记录保存失败，已停止模型请求。');
      },
    });
  }
  async function run4(enabled2, next) {
    if (!enabled2['requiresPaidRetry']) return !![];
    const current = await presentation['requestChoice'](getStoryEpisodeSplitPaidRetryChoice(next));
    if (current !== 'retry') return ![];
    return (await enabled2['authorizePaidRetry'](), !![]);
  }
  function run5({
    episode: episode2,
    projectToken: projectToken2,
    context: context2,
    splitRun: splitRun,
    repairDraft: repairDraft2,
    onProgress: onProgress,
  }) {
    return {
      project: context2['project'],
      episode: episode2,
      assets: buildVideoReplicationGenerationAssets(projectToken2['data']['assets'], context2['project']),
      constraints: context2['project']['planning'],
      clipDurationConstraints: resolveStoryVideoClipDurationConstraints(
        resolveStoryWorkspaceModelId(
          'video',
          projectToken2['modelSettings']?.['models']?.['video'] || state['models']['video'],
        ),
      ),
      model: splitRun['execution']['modelId'],
      provider: splitRun['execution']['provider'],
      providerProfileId: splitRun['execution']['providerProfileId'],
      repairDraft: repairDraft2,
      onInvocation: splitRun['onInvocation'],
      diagnostics: createStoryEpisodeSplitDeveloperDiagnostics(windowObject),
      onProgress: onProgress,
    };
  }
  function run6({
    episode: episode3,
    projectToken: projectToken3,
    context: context3,
    splitRun: splitRun2,
    promptExperiment: promptExperiment2,
    onProgress: onProgress2,
  }) {
    const args2 = projectToken3['data'],
      previousEpisode = args2['episodes']['findIndex']((entry) => entry['id'] === episode3['id']),
      resumeDraft = splitRun2['checkpoint'] || episode3?.['experimentalSplitDraft'];
    return {
      project: context3['project'],
      episode: episode3,
      previousEpisode: previousEpisode > 0 ? args2['episodes'][previousEpisode - 1] : null,
      nextEpisode: previousEpisode >= 0 ? args2['episodes'][previousEpisode + 1] || null : null,
      assets: buildVideoReplicationGenerationAssets(args2['assets'], context3['project']),
      constraints: context3['project']['planning'],
      model: splitRun2['execution']['modelId'],
      provider: splitRun2['execution']['provider'],
      providerProfileId: splitRun2['execution']['providerProfileId'],
      promptExperiment: promptExperiment2 === !![],
      resumeDraft: resumeDraft?.['status'] === 'completed' ? null : resumeDraft || null,
      onInvocation: splitRun2['onInvocation'],
      diagnostics: createStoryEpisodeSplitDeveloperDiagnostics(windowObject),
      onCheckpoint: async (record) => {
        if (!projectTasks['isLive'](projectToken3)) return;
        const count = args2['episodes']['findIndex']((payload) => payload['id'] === episode3['id']);
        if (count < 0) return;
        ((args2['episodes'][count] = {
          ...args2['episodes'][count],
          experimentalSplitDraft: cloneData(record),
        }),
          await splitRun2['saveCheckpoint'](record));
      },
      onProgress: onProgress2,
    };
  }
  async function run7(
    episodeId,
    projectToken4,
    {
      batch: batch = null,
      experimental: experimental = ![],
      experimentalLabel: experimentalLabel = ![],
      promptExperiment: promptExperiment = ![],
      repairDraft: repairDraft = null,
    } = {},
  ) {
    if (!projectTasks['isLive'](projectToken4)) return null;
    const projectData = projectToken4['data'],
      context4 = getPlanningContext(projectData, projectToken4),
      storyEpisodeScriptGuard = createStoryEpisodeScriptGuard(() => projectToken4['data'], episodeId);
    episodeId = storyEpisodeScriptGuard['episode'];
    const type = experimental ? 'episode-split-experimental' : 'episode-split',
      backgroundTaskId2 = buildStoryBackgroundTaskId(type, { episodeId: episodeId['id'] }),
      modelId2 = run3({
        episode: episodeId,
        projectToken: projectToken4,
        backgroundTaskId: backgroundTaskId2,
        context: context4,
        mode: experimental ? 'experimental' : 'standard',
        promptExperiment: promptExperiment,
      });
    if (!(await run4(modelId2, episodeId))) return null;
    projectTasks['startBackgroundTask'](projectToken4, {
      id: backgroundTaskId2,
      modelId: modelId2['execution']['modelId'],
      provider: modelId2['execution']['provider'],
      providerProfileId: modelId2['execution']['providerProfileId'],
      type: type,
      scope: { episodeId: episodeId['id'] },
      label: experimentalLabel
        ? '实验分批拆分第 ' + (episodeId['number'] || '') + ' 集'
        : '拆分第 ' + (episodeId['number'] || '') + ' 集分镜',
      message: experimental ? '正在规划整集分镜蓝图' : '正在生成分镜脚本',
      batch: batch,
      resumable: !![],
      resumePayload: modelId2['payload'](),
    });
    const onProgress3 = ({ message: message } = {}) => {
      if (!projectTasks['isLive'](projectToken4)) return;
      projectTasks['updateBackgroundTask'](projectToken4, backgroundTaskId2, {
        status: 'running',
        message: normalizeText(message) || '正在生成分镜脚本',
      });
    };
    let result2 = null,
      promptInputKey;
    try {
      await modelId2['start']();
      const episode4 = await prepareStoryReplicationGenerationEpisode({
        episode: episodeId,
        projectData: projectData,
        onProgress: onProgress3,
        isActive: () => projectTasks['isLive'](projectToken4),
      });
      promptInputKey = episode4['replication']?.['generationInputKey'];
      if (modelId2['candidateArtifact']) result2 = modelId2['candidateArtifact'];
      else {
        if (modelId2['generatedCandidate']) result2 = modelId2['generatedCandidate'];
        else
          experimental
            ? (result2 = await operations['splitExperimental'](
                run6({
                  episode: episode4,
                  projectToken: projectToken4,
                  context: context4,
                  splitRun: modelId2,
                  promptExperiment: promptExperiment,
                  onProgress: onProgress3,
                }),
              ))
            : (result2 = await operations['splitStandard'](
                run5({
                  episode: episode4,
                  projectToken: projectToken4,
                  context: context4,
                  splitRun: modelId2,
                  repairDraft: repairDraft,
                  onProgress: onProgress3,
                }),
              ));
      }
      (assertStoryReplicationGenerationCurrent(projectData, episode4),
        storyEpisodeScriptGuard['assertCurrent']());
      if (!modelId2['candidateArtifact'] && !modelId2['generatedCandidate'])
        await modelId2['saveGeneratedCandidate'](result2);
      ((result2 = applyReplicationSegmentPlan(result2, episode4)),
        (result2 = applyReplicationAsrDelivery(
          result2,
          episode4,
          projectData['project'],
          projectData['assets'],
        )),
        (result2 = await runStoryEpisodeSplitQualityReview({
          reviewEpisodeSplit: operations['review'],
          result: result2,
          episode: episode4,
          context: context4,
          projectData: projectData,
          splitRun: modelId2,
          onProgress: onProgress3,
        })),
        (result2 = applyReplicationSegmentPlan(result2, episode4)),
        (result2 = applyReplicationAsrDelivery(
          result2,
          episode4,
          projectData['project'],
          projectData['assets'],
        )));
      if (!modelId2['candidateArtifact']) await modelId2['ready'](result2);
      (assertStoryReplicationGenerationCurrent(projectData, episode4),
        storyEpisodeScriptGuard['assertCurrent']());
    } catch (splitDraft) {
      await modelId2['failed'](splitDraft)['catch'](() => {});
      if (projectTasks['isLive'](projectToken4)) {
        if (storyEpisodeScriptGuard['isCurrent']() && experimental && splitDraft?.['experimentalDraft']) {
          const count2 = projectData['episodes']['findIndex']((handle) => handle['id'] === episodeId['id']);
          count2 >= 0 &&
            ((projectData['episodes'][count2] = {
              ...projectData['episodes'][count2],
              experimentalSplitDraft: cloneData(splitDraft['experimentalDraft']),
            }),
            projectTasks['syncProjectEntry'](projectToken4),
            persistence['schedule']({ immediate: !![] }));
        } else {
          if (storyEpisodeScriptGuard['isCurrent']() && !experimental && splitDraft?.['partialResult']) {
            const count3 = projectData['episodes']['findIndex']((config) => config['id'] === episodeId['id']);
            count3 >= 0 &&
              ((projectData['episodes'][count3] = {
                ...projectData['episodes'][count3],
                splitDraft: splitDraft['partialResult'],
              }),
              persistence['schedule']({ immediate: !![] }));
          }
        }
        const error = experimental
          ? resolveStoryEpisodeExperimentalErrorMessage(splitDraft, {
              retryActionLabel: experimentalLabel ? '开发测试' : '生成分镜脚本',
            })
          : splitDraft?.['message'] || '分集拆分失败。';
        projectTasks['finishBackgroundTask'](projectToken4, backgroundTaskId2, {
          status: 'failed',
          message: experimentalLabel
            ? '第 ' + (episodeId['number'] || '') + ' 集实验分批拆分失败'
            : splitDraft?.['partialResult']
              ? '第 ' + (episodeId['number'] || '') + ' 集本次返回未完全通过，已保存原始结果'
              : '第 ' + (episodeId['number'] || '') + ' 集分镜拆分失败',
          error: error,
          resumable: !![],
          resumePayload: modelId2['payload'](),
        });
      }
      throw splitDraft;
    }
    if (!projectTasks['isLive'](projectToken4)) return null;
    const args3 = run2(episodeId, result2, projectToken4, {
      assets: projectData['assets'],
      preserveMedia: !![],
      visualStyle: context4['visualStyle'],
      promptMode: context4['project']['planning']?.['promptMode'],
      ...(experimental ? { includeContinuityHandoffs: !![] } : {}),
    });
    (delete args3['splitDraft'],
      delete args3['experimentalSplitDraft'],
      (args3['splitQualityReview'] = result2['qualityReview']));
    if (episodeId['replication']?.['sourceAnalysis'])
      args3['replication'] = {
        ...args3['replication'],
        promptInputKey: promptInputKey,
        promptsStale: ![],
      };
    const count4 = projectData['episodes']['findIndex']((scope) => scope['id'] === episodeId['id']);
    if (count4 >= 0) projectData['episodes'][count4] = args3;
    return (
      await modelId2['succeeded'](),
      projectTasks['finishBackgroundTask'](projectToken4, backgroundTaskId2, {
        status: 'succeeded',
        message: getStoryEpisodeSplitDeliveryMessage(args3),
        resumable: ![],
        resumePayload: modelId2['payload'](),
      }),
      args3
    );
  }
  function recoverDraft(input) {
    if (typeof operations['recoverDraft'] !== 'function')
      return (presentation['showToast']('分镜本地恢复能力尚未初始化。', 'error'), ![]);
    const output = run(),
      assets = output['data'],
      count5 = assets['episodes']['findIndex']((value2) => value2['id'] === input);
    if (count5 < 0) return ![];
    const episode5 = assets['episodes'][count5];
    if (!episode5?.['splitDraft'])
      return (presentation['showToast']('当前分集没有已保存的返回可供恢复。', 'info'), ![]);
    try {
      const project = getPlanningContext(assets, output),
        value3 = operations['recoverDraft']({
          project: project['project'],
          episode: episode5,
          assets: assets['assets'],
          constraints: project['project']['planning'],
          draft: episode5['splitDraft'],
        }),
        value4 = run2(episode5, value3, output, {
          assets: assets['assets'],
          preserveMedia: !![],
          visualStyle: project['visualStyle'],
          promptMode: project['project']['planning']?.['promptMode'],
        });
      return (
        delete value4['splitDraft'],
        delete value4['experimentalSplitDraft'],
        (assets['episodes'][count5] = value4),
        persistence['schedule']({ immediate: !![] }),
        presentation['render'](),
        presentation['showToast'](
          '第 ' +
            (value4['number'] || '') +
            ' 集已在本地恢复为 ' +
            value4['clips']['length'] +
            ' 个片段；未调用模型。',
          'success',
        ),
        !![]
      );
    } catch (error2) {
      return (
        presentation['showTaskResult'](
          (normalizeText(error2?.['message']) || '已保存结果仍无法在本地恢复。') + '（未调用模型。）',
          'error',
          error2,
        ),
        ![]
      );
    }
  }
  async function run8(
    value5,
    {
      explicitExperimental: explicitExperimental = ![],
      openAfter: openAfter = ![],
      repairDraft: repairDraft = ![],
    } = {},
  ) {
    if (explicitExperimental && !isStoryEpisodeExperimentalSplitAvailable(windowObject)) return ![];
    const el = presentation['getGenerationControl'](value5);
    if (el['disabled']) return ![];
    const experimental2 = explicitExperimental || shouldUseStoryEpisodeExperimentalSplit(state),
      value6 = experimental2 ? operations['splitExperimental'] : operations['splitStandard'];
    if (typeof value6 !== 'function')
      return (
        presentation['showToast'](
          explicitExperimental ? '实验分批拆分 Agent 尚未初始化。' : '分镜拆分 Agent 尚未初始化。',
          'error',
        ),
        ![]
      );
    const enabled3 = state['data']['episodes']['find']((value7) => value7['id'] === value5);
    if (!enabled3) return ![];
    setStoryEpisodeSplitRunning(state, enabled3['id'], !![]);
    const value8 = run();
    presentation['render']();
    try {
      const episodeId2 = await run7(enabled3, value8, {
        experimental: experimental2,
        experimentalLabel: explicitExperimental,
        promptExperiment: explicitExperimental,
        repairDraft: repairDraft === !![] ? enabled3['splitDraft'] : null,
      });
      if (!episodeId2 || !projectTasks['isLive'](value8)) return ![];
      return (
        persistence['schedule']({ immediate: !![] }),
        explicitExperimental
          ? presentation['notifyComplete'](
              '第 ' +
                episodeId2['number'] +
                ' 集实验分批拆分：' +
                getStoryEpisodeSplitDeliveryMessage(episodeId2),
              value8,
              { episodeId: episodeId2['id'], clipId: episodeId2['clips'][0]?.['id'] },
              {
                notificationMessage:
                  '第 ' + episodeId2['number'] + ' 集：' + getStoryEpisodeSplitDeliveryMessage(episodeId2),
              },
            )
          : presentation['notifyComplete'](
              '第 ' + episodeId2['number'] + ' 集：' + getStoryEpisodeSplitDeliveryMessage(episodeId2),
              value8,
              { episodeId: episodeId2['id'], clipId: episodeId2['clips'][0]?.['id'] },
              {
                notificationMessage:
                  '第 ' + episodeId2['number'] + ' 集：' + getStoryEpisodeSplitDeliveryMessage(episodeId2),
              },
            ),
        openAfter &&
          projectTasks['isCurrent'](value8) &&
          (setStoryEpisodeSplitRunning(state, enabled3['id'], ![]),
          await presentation['openEpisode'](episodeId2['id'], episodeId2['clips'][0]?.['id'])),
        !![]
      );
    } catch (error3) {
      if (!projectTasks['isLive'](value8)) return ![];
      return (
        presentation['showTaskResult'](
          experimental2
            ? resolveStoryEpisodeExperimentalErrorMessage(error3, {
                retryActionLabel: explicitExperimental ? '开发测试' : '生成分镜脚本',
              })
            : error3?.['message'] || '分集拆分失败。',
          'error',
          error3,
        ),
        ![]
      );
    } finally {
      projectTasks['isCurrent'](value8) &&
        (setStoryEpisodeSplitRunning(state, enabled3['id'], ![]), presentation['render']());
    }
  }
  async function run9({ selectionMode: selectionMode = ![], experimental: experimental = !![] } = {}) {
    if (getStoryEpisodeBatchControlState(state)['disabled']) return ![];
    if (
      (experimental && typeof operations['splitExperimental'] !== 'function') ||
      (!experimental && typeof operations['splitStandard'] !== 'function')
    )
      return (presentation['showToast']('分镜拆分 Agent 尚未初始化。', 'error'), ![]);
    const map = new Set(
        (Array['isArray'](state['splittingEpisodeIds']) ? state['splittingEpisodeIds'] : [])
          ['map']((value9) => normalizeText(value9))
          ['filter'](Boolean),
      ),
      total = getStoryEpisodeBatchTargets(
        state['data']['episodes'],
        state['selectedEpisodeIds'],
        selectionMode,
      )['filter']((value10) => !map['has'](normalizeText(value10?.['id'])));
    if (!total['length']) return (presentation['showToast']('请先选择需要拆分的分集。', 'info'), ![]);
    const operation = selectionMode ? 'splitting-selected' : 'splitting-all',
      value11 = selectionMode ? '正在拆分选中分集' : '正在批量拆分',
      targetEpisodeIds = total['map']((value12) => normalizeText(value12['id']))['filter'](Boolean);
    (targetEpisodeIds['forEach']((value13) => setStoryEpisodeSplitRunning(state, value13, !![])),
      (state['episodeBatchSplitOperation'] = operation),
      (state['episodeBatchSplitStatus'] = value11 + ' 1/' + total['length']),
      (state['episodeBatchSplitCancelRequested'] = ![]));
    const projectToken5 = run(),
      value14 = projectToken5['data'],
      batchId = projectTasks['createTaskBatch']('episode-splits', {
        operation: operation,
        total: total['length'],
        completed: 0,
        targetEpisodeIds: targetEpisodeIds,
        pendingEpisodeIds: targetEpisodeIds,
        cancelRequested: ![],
        label: state['episodeBatchSplitStatus'],
      });
    ((state['episodeBatchSplitId'] = batchId['id']), presentation['render']());
    try {
      const pendingTargets = await runStoryEpisodeSplitBatchQueue({
        targets: total,
        batchId: batchId['id'],
        isLive: () => projectTasks['isLive'](projectToken5),
        isCancellationRequested: isCancellationRequested['isRequested'],
        resolveTarget: (value15) =>
          value14['episodes']['find'](
            (value16) => normalizeText(value16?.['id']) === normalizeText(value15?.['id']),
          ),
        createMissingTargetError: (value17) =>
          new Error('第 ' + (value17?.['number'] || '') + ' 集不存在，无法拆分。'),
        runTarget: (value18) => run7(value18, projectToken5, { batch: batchId, experimental: experimental }),
        onTargetSettled: ({
          target: target2,
          index: index2,
          completed: completed,
          pendingTargets: pendingTargets2,
        }) => {
          const text = normalizeText(target2?.['id']),
            label = value11 + ' ' + (index2 + 1) + '/' + total['length'];
          projectTasks['syncTaskBatch'](projectToken5, batchId, {
            completed: completed,
            pendingEpisodeIds: pendingTargets2['map']((value19) => normalizeText(value19?.['id']))['filter'](
              Boolean,
            ),
            label: label,
          });
          if (projectTasks['isCurrent'](projectToken5)) {
            if (text) setStoryEpisodeSplitRunning(state, text, ![]);
            ((state['episodeBatchSplitStatus'] = label), presentation['render']());
          }
          persistence['schedule']();
        },
      });
      if (pendingTargets['status'] === 'interrupted') return ![];
      return finalizeStoryEpisodeSplitBatch({
        result: {
          ...pendingTargets,
          pendingTargets: pendingTargets['pendingTargets']
            ['map']((value20) => normalizeText(value20?.['id']))
            ['filter'](Boolean),
        },
        batch: batchId,
        projectToken: projectToken5,
        experimental: experimental,
        selectionMode: selectionMode,
        syncBatch: (value21) => projectTasks['syncTaskBatch'](projectToken5, batchId, value21),
        persist: () => persistence['schedule']({ immediate: !![] }),
        showToast: presentation['showToast'],
        resolveErrorMessage: (error4) =>
          experimental
            ? resolveStoryEpisodeExperimentalErrorMessage(error4, { retryActionLabel: '批量拆分' })
            : normalizeText(error4?.['message']) || '分镜拆分失败。',
        notifyFailure: (value22, value23) =>
          presentation['notifyGenerationResult'](value22, projectToken5, { step: 3 }, value23),
        notifySuccess: (value24, value25) =>
          presentation['notifyComplete'](value24, projectToken5, { step: 3 }, value25),
      });
    } finally {
      (isCancellationRequested['clear'](batchId['id']),
        projectTasks['isCurrent'](projectToken5) &&
          (targetEpisodeIds['forEach']((value26) => setStoryEpisodeSplitRunning(state, value26, ![])),
          resetStoryEpisodeSplitBatchState(state),
          presentation['render']()));
    }
  }
  function cancelBatch() {
    const value27 = run();
    return cancelStoryEpisodeSplitBatch({
      state: state,
      tasks: getStoryBackgroundTasks(state['data']),
      isTaskActive: isStoryBackgroundTaskActive,
      requestCancellation: isCancellationRequested['request'],
      updateBatch: (value28, value29) => projectTasks['updateBackgroundTaskBatch'](value27, value28, value29),
      setEpisodeRunning: (value30, value31) => setStoryEpisodeSplitRunning(state, value30, value31),
      showToast: presentation['showToast'],
      render: presentation['render'],
    });
  }
  return Object['freeze']({
    cancelBatch: cancelBatch,
    recoverDraft: recoverDraft,
    splitBatch: ({ selectionMode: selectionMode = ![] } = {}) =>
      run9({
        selectionMode: selectionMode,
        experimental: shouldUseStoryEpisodeExperimentalSplit(state),
      }),
    splitEpisode: (value32, value33 = {}) => run8(value32, value33),
    splitEpisodeExperimental: (value34) => run8(value34, { explicitExperimental: !![] }),
  });
}
