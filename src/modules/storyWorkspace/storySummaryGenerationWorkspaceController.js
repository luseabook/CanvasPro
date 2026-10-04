import { buildStoryBackgroundTaskId, getStoryBackgroundTasks } from './storyBackgroundTasks.js';
import { getStoryHomeSummaryTaskCopy, resolveStoryHomeGenerationMode } from './storyHomeRewrite.js';
import {
  applyGeneratedStoryResult,
  buildStoryHomeGenerationRequest,
  buildStorySummaryRegenerationRequest,
  createGeneratedStoryProjectData,
  createUploadedStoryProjectData,
  invalidateStoryPlanningDownstream,
} from './storyProjectPlanning.js';
import { createStorySummaryRunRecorder } from './storySummaryRun.js';
import { applyStoryPromptModeVideoModelDefault } from './storyVideoGenerationSettings.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function createStorySummaryGenerationWorkspaceController({
  state: state,
  windowObject: windowObject = globalThis['window'] || globalThis,
  generateStory: generateStory,
  startReplicationFromHome: startReplicationFromHome,
  createProjectToken: createProjectToken,
  beginProjectSession: beginProjectSession,
  isProjectTaskLive: isProjectTaskLive,
  isProjectTaskCurrent: isProjectTaskCurrent,
  registerProjectData: registerProjectData,
  startBackgroundTask: startBackgroundTask,
  updateBackgroundTask: updateBackgroundTask,
  finishBackgroundTask: finishBackgroundTask,
  syncProjectEntry: syncProjectEntry,
  syncCurrentProjectEntry: syncCurrentProjectEntry,
  persistNow: persistNow,
  schedulePersistence: schedulePersistence,
  requiresDurableRunPersistence: requiresDurableRunPersistence,
  openProject: openProject,
  render: render,
  showToast: showToast,
  showTaskResultToast: showTaskResultToast,
  notifyTextTaskComplete: notifyTextTaskComplete,
  requestChoice: requestChoice,
  extractProjectAssets: extractProjectAssets,
  resetDownstreamUi: resetDownstreamUi,
  reportApiError: reportApiError,
} = {}) {
  if (
    !state ||
    typeof startReplicationFromHome !== 'function' ||
    typeof createProjectToken !== 'function' ||
    typeof beginProjectSession !== 'function' ||
    typeof isProjectTaskLive !== 'function' ||
    typeof isProjectTaskCurrent !== 'function' ||
    typeof registerProjectData !== 'function' ||
    typeof startBackgroundTask !== 'function' ||
    typeof updateBackgroundTask !== 'function' ||
    typeof finishBackgroundTask !== 'function' ||
    typeof syncProjectEntry !== 'function' ||
    typeof syncCurrentProjectEntry !== 'function' ||
    typeof persistNow !== 'function' ||
    typeof schedulePersistence !== 'function' ||
    typeof requiresDurableRunPersistence !== 'function' ||
    typeof openProject !== 'function' ||
    typeof render !== 'function' ||
    typeof showToast !== 'function' ||
    typeof showTaskResultToast !== 'function' ||
    typeof notifyTextTaskComplete !== 'function' ||
    typeof requestChoice !== 'function' ||
    typeof extractProjectAssets !== 'function' ||
    typeof resetDownstreamUi !== 'function' ||
    typeof reportApiError !== 'function'
  )
    throw new TypeError('Story summary generation requires project, persistence, and presentation adapters.');
  const run = (item) => {
    ((state['assetSelectionMode'] = ![]),
      (state['selectedAssetIds'] = []),
      (state['assetAppearanceIndexes'] = {}),
      (state['scriptSelectionMode'] = ![]),
      (state['selectedScriptEpisodeIds'] = []),
      (state['scriptGenerationFocusMode'] = ![]),
      (state['outlineSectionOpenState'] = {}),
      (state['scriptMode'] = item));
  };
  function createPersistedRun(project, fileName, key) {
    const resumePayload = getStoryBackgroundTasks(project['data'])['find']((index) => index['id'] === key),
      request = {
        ...fileName,
        fileName: fileName['fileName'] || fileName['scriptFileName'],
        model: fileName['model'] || fileName['modelId'],
        planning: fileName['planning'] || {
          episodeCount: fileName['episodeCount'],
          sceneMaxSeconds: fileName['sceneMaxSeconds'],
          promptMode: fileName['promptMode'],
        },
      };
    return createStorySummaryRunRecorder({
      project: project['data']['project'],
      request: request,
      resumePayload: resumePayload?.['resumePayload'],
      onChange: async (resumable) => {
        (updateBackgroundTask(project, key, {
          resumable: resumable['status'] !== 'succeeded',
          modelId: resumable['input']['execution']['modelId'],
          provider: resumable['input']['execution']['provider'],
          resumePayload: { kind: resumable['kind'], run: resumable },
        }),
          syncProjectEntry(project));
        const enabled = await persistNow();
        if (requiresDurableRunPersistence() && !enabled)
          throw new Error('剧本摘要运行记录保存失败，已停止模型请求。');
      },
    });
  }
  async function authorizePaidRetry(enabled2) {
    if (!enabled2['requiresPaidRetry']) return !![];
    const result = await requestChoice({
      overlayId: 'story-summary-paid-retry',
      title: '上次剧本摘要请求结果尚未安全提交',
      message: '上次请求可能已经计费，或响应尚未完成本地提交。确认后才会再次调用模型。',
      fallbackValue: null,
      choices: [
        { label: '暂不重试', value: null, autofocus: !![] },
        { label: '确认重新请求', value: 'retry', primary: !![] },
      ],
    });
    if (result !== 'retry') return ![];
    return (await enabled2['authorizePaidRetry'](), !![]);
  }
  function run2() {
    const mode = resolveStoryHomeGenerationMode(state);
    return buildStoryHomeGenerationRequest({
      mode: mode,
      scriptMode: state['scriptMode'],
      modelId: state['models']['text'],
      provider: state['textProvider'],
      providerProfileId: state['textProviderProfileId'],
      scriptFileName: state['scriptFileName'],
      scriptText: state['scriptText'],
      idea: state['idea'],
      rewriteInstruction: mode === 'rewrite' ? state['idea'] : '',
      aspectRatio: state['data']['project']?.['aspectRatio'],
      styleId: state['data']['project']?.['videoStyleId'],
      stylePrompt: state['data']['project']?.['videoStylePrompt'],
      videoStyle: state['data']['project']?.['videoStyle'],
      episodeCount: state['data']['project']?.['planning']?.['episodeCount'],
      sceneMaxSeconds: state['data']['project']?.['planning']?.['sceneMaxSeconds'],
      promptMode: state['data']['project']?.['planning']?.['promptMode'],
      allowDeveloperPromptModes: state['developerModeAvailable'],
    });
  }
  async function generateFromHome() {
    if (state['isGeneratingStory']) return;
    if (state['homeTab'] === 'replication') return startReplicationFromHome();
    const detail = run2();
    if (!detail['ok']) {
      showToast(detail['error'], 'warn');
      return;
    }
    (windowObject?.['dispatchEvent']?.(
      new CustomEvent('storyWorkspace:generateRequested', { detail: detail }),
    ),
      syncCurrentProjectEntry(),
      applyStoryPromptModeVideoModelDefault(state, detail['promptMode']));
    if (detail['mode'] === 'upload') {
      try {
        (beginProjectSession(),
          (state['data'] = createUploadedStoryProjectData({
            projectId: 'story-' + Date['now'](),
            request: detail,
            allowDeveloperPromptModes: state['developerModeAvailable'],
          })),
          (state['projectTitleEdited'] = ![]),
          (state['hasCreatedProject'] = !![]),
          run('plot'),
          openProject({ resetStep: !![] }),
          schedulePersistence({ immediate: !![] }),
          windowObject?.['dispatchEvent']?.(
            new CustomEvent('storyWorkspace:storyImported', {
              detail: {
                mode: detail['mode'],
                modelId: detail['modelId'],
                provider: detail['provider'],
                episodeCount: state['data']['episodes']['length'],
              },
            }),
          ),
          showTaskResultToast(
            '已按原剧本导入 ' + state['data']['episodes']['length'] + ' 集，未扩写正文。',
            'success',
          ),
          await extractProjectAssets({ advance: !![] }));
      } catch (error) {
        showTaskResultToast(error?.['message'] || '剧本导入失败，请检查原始文本。', 'error', error);
      }
      return;
    }
    if (typeof generateStory !== 'function') {
      showToast('剧情 Agent 尚未初始化。', 'error');
      return;
    }
    (beginProjectSession(),
      (state['data'] = createGeneratedStoryProjectData(
        {},
        {
          projectId: 'story-' + Date['now'](),
          request: detail,
          allowDeveloperPromptModes: state['developerModeAvailable'],
        },
      )),
      (state['data']['project']['summaryStatus'] = 'generating'),
      (state['projectTitleEdited'] = ![]),
      (state['hasCreatedProject'] = !![]));
    const projectTitleEdited = createProjectToken(),
      id = buildStoryBackgroundTaskId('story-summary'),
      resumePayload2 = createPersistedRun(projectTitleEdited, detail, id),
      label = getStoryHomeSummaryTaskCopy(detail['mode']);
    (startBackgroundTask(projectTitleEdited, {
      id: id,
      type: 'story-summary',
      label: label['label'],
      message: label['message'],
      resumable: !![],
      resumePayload: resumePayload2['payload'](),
    }),
      run(detail['scriptMode']),
      (state['isGeneratingStory'] = !![]),
      (state['generationStatus'] = label['status']),
      openProject({ resetStep: !![] }),
      schedulePersistence({ immediate: !![] }));
    try {
      await resumePayload2['start']();
      const result2 =
        resumePayload2['candidateArtifact'] ||
        (await generateStory({
          mode: detail['mode'],
          scriptMode: detail['scriptMode'],
          idea: detail['idea'],
          sourceText: detail['sourceText'],
          fileName: detail['scriptFileName'],
          rewriteInstruction: detail['rewriteInstruction'],
          model: resumePayload2['execution']['modelId'],
          provider: resumePayload2['execution']['provider'],
          providerProfileId: resumePayload2['execution']['providerProfileId'],
          aspectRatio: detail['aspectRatio'],
          visualStyle: detail['visualStyle'],
          planning: {
            episodeCount: detail['episodeCount'],
            sceneMaxSeconds: detail['sceneMaxSeconds'],
            promptMode: detail['promptMode'],
          },
          onInvocation: resumePayload2['onInvocation'],
          onProgress: ({ message: message } = {}) => {
            if (!isProjectTaskLive(projectTitleEdited)) return;
            const message2 = normalizeText(message) || '正在生成剧本摘要';
            updateBackgroundTask(projectTitleEdited, id, { status: 'running', message: message2 });
            if (isProjectTaskCurrent(projectTitleEdited)) {
              state['generationStatus'] = message2;
              if (state['view'] === 'project' && state['step'] === 0x1) render();
            }
          },
        }));
      if (!resumePayload2['candidateArtifact']) await resumePayload2['ready'](result2);
      if (!isProjectTaskLive(projectTitleEdited)) return ![];
      ((projectTitleEdited['data'] = applyGeneratedStoryResult(projectTitleEdited['data'], result2, {
        projectTitleEdited: projectTitleEdited['projectTitleEdited'],
      })),
        registerProjectData(projectTitleEdited),
        (projectTitleEdited['data']['project']['summaryStatus'] = 'completed'),
        (projectTitleEdited['data']['project']['outlineStatus'] = 'pending'));
      isProjectTaskCurrent(projectTitleEdited) &&
        ((state['data'] = projectTitleEdited['data']),
        (state['isGeneratingStory'] = ![]),
        (state['generationStatus'] = ''));
      (windowObject?.['dispatchEvent']?.(
        new CustomEvent('storyWorkspace:storyGenerated', {
          detail: {
            mode: detail['mode'],
            scriptMode: detail['scriptMode'],
            modelId: detail['modelId'],
            provider: detail['provider'],
            aspectRatio: detail['aspectRatio'],
            styleId: detail['styleId'],
            visualStyle: detail['visualStyle'],
            result: result2,
          },
        }),
      ),
        finishBackgroundTask(projectTitleEdited, id, {
          status: 'succeeded',
          message: '剧本摘要生成完成',
          resumable: ![],
        }),
        await resumePayload2['succeeded'](),
        notifyTextTaskComplete('剧本摘要生成完成。', projectTitleEdited, {
          step: 0x1,
          outlineSectionId: 'summary',
        }),
        schedulePersistence({ immediate: !![] }));
      if (isProjectTaskCurrent(projectTitleEdited)) render();
      return !![];
    } catch (error2) {
      if (!isProjectTaskLive(projectTitleEdited)) return ![];
      return (
        await resumePayload2['failed'](error2)['catch'](() => {}),
        (projectTitleEdited['data']['project']['summaryStatus'] = 'error'),
        finishBackgroundTask(projectTitleEdited, id, {
          status: 'failed',
          message: '剧本摘要生成失败',
          error: error2?.['message'] || '剧本摘要生成失败，请稍后重试。',
          resumable: !![],
          resumePayload: resumePayload2['payload'](),
        }),
        isProjectTaskCurrent(projectTitleEdited) &&
          ((state['isGeneratingStory'] = ![]), (state['generationStatus'] = ''), render()),
        showTaskResultToast(error2?.['message'] || '剧本摘要生成失败，请稍后重试。', 'error', error2),
        ![]
      );
    }
  }
  async function regenerateSummary() {
    if (state['isGeneratingStory'] || state['storyPlanningOperation']) return ![];
    if (typeof generateStory !== 'function') return (showToast('剧情 Agent 尚未初始化。', 'error'), ![]);
    const mode2 = buildStorySummaryRegenerationRequest(state['data']['project'], {
      modelId: state['models']['text'],
      provider: state['textProvider'],
      providerProfileId: state['textProviderProfileId'],
      allowDeveloperPromptModes: state['developerModeAvailable'],
    });
    if (!mode2['ok']) return (showToast(mode2['error'], 'warn'), ![]);
    const projectTitleEdited2 = createProjectToken(),
      id2 = buildStoryBackgroundTaskId('story-summary'),
      resumePayload3 = createPersistedRun(projectTitleEdited2, mode2, id2);
    if (!(await authorizePaidRetry(resumePayload3))) return ![];
    ((state['isGeneratingStory'] = !![]),
      (state['generationStatus'] = '正在根据原始创意重新生成剧本摘要...'),
      (state['data']['project']['summaryStatus'] = 'generating'),
      startBackgroundTask(projectTitleEdited2, {
        id: id2,
        type: 'story-summary',
        label: '重新生成剧本摘要',
        message: state['generationStatus'],
        resumable: !![],
        resumePayload: resumePayload3['payload'](),
      }),
      render());
    try {
      await resumePayload3['start']();
      const result3 =
        resumePayload3['candidateArtifact'] ||
        (await generateStory({
          ...mode2,
          model: resumePayload3['execution']['modelId'],
          provider: resumePayload3['execution']['provider'],
          providerProfileId: resumePayload3['execution']['providerProfileId'],
          onInvocation: resumePayload3['onInvocation'],
          onProgress: ({ message: message3 } = {}) => {
            if (!isProjectTaskLive(projectTitleEdited2)) return;
            const message4 = normalizeText(message3) || '正在重新生成剧本摘要';
            updateBackgroundTask(projectTitleEdited2, id2, { status: 'running', message: message4 });
            if (isProjectTaskCurrent(projectTitleEdited2)) {
              state['generationStatus'] = message4;
              if (state['view'] === 'project' && state['step'] === 0x1) render();
            }
          },
        }));
      if (!resumePayload3['candidateArtifact']) await resumePayload3['ready'](result3);
      if (!isProjectTaskLive(projectTitleEdited2)) return ![];
      return (
        (projectTitleEdited2['data'] = applyGeneratedStoryResult(projectTitleEdited2['data'], result3, {
          projectTitleEdited: projectTitleEdited2['projectTitleEdited'],
        })),
        (projectTitleEdited2['data'] = invalidateStoryPlanningDownstream(projectTitleEdited2['data'], {
          clearEpisodeOutlines: !![],
        })),
        registerProjectData(projectTitleEdited2),
        (projectTitleEdited2['data']['project']['summaryStatus'] = 'completed'),
        isProjectTaskCurrent(projectTitleEdited2) &&
          ((state['data'] = projectTitleEdited2['data']), resetDownstreamUi()),
        windowObject?.['dispatchEvent']?.(
          new CustomEvent('storyWorkspace:storyGenerated', {
            detail: {
              mode: mode2['mode'],
              modelId: mode2['model'],
              provider: mode2['provider'],
              aspectRatio: mode2['aspectRatio'],
              visualStyle: mode2['visualStyle'],
              regenerated: !![],
              result: result3,
            },
          }),
        ),
        schedulePersistence({ immediate: !![] }),
        finishBackgroundTask(projectTitleEdited2, id2, {
          status: 'succeeded',
          message: '剧本摘要重新生成完成',
          resumable: ![],
        }),
        await resumePayload3['succeeded'](),
        notifyTextTaskComplete('剧本摘要已重新生成。', projectTitleEdited2, {
          step: 0x1,
          outlineSectionId: 'summary',
        }),
        !![]
      );
    } catch (error3) {
      if (!isProjectTaskLive(projectTitleEdited2)) return ![];
      return (
        await resumePayload3['failed'](error3)['catch'](() => {}),
        (projectTitleEdited2['data']['project']['summaryStatus'] = normalizeText(
          projectTitleEdited2['data']['project']['summary'],
        )
          ? 'completed'
          : 'error'),
        reportApiError('regenerate-story-summary', error3, {
          model: mode2['model'],
          provider: mode2['provider'],
        }),
        finishBackgroundTask(projectTitleEdited2, id2, {
          status: 'failed',
          message: '剧本摘要重新生成失败',
          error: error3?.['message'] || '剧本摘要重新生成失败。',
          resumable: !![],
          resumePayload: resumePayload3['payload'](),
        }),
        showTaskResultToast(
          error3?.['message'] || '剧本摘要重新生成失败，原摘要和下游内容均已保留。',
          'error',
          error3,
        ),
        ![]
      );
    } finally {
      isProjectTaskCurrent(projectTitleEdited2) &&
        ((state['isGeneratingStory'] = ![]), (state['generationStatus'] = ''), render());
    }
  }
  return {
    preview: async ({ home: home = ![], captureRequest: captureRequest }) => {
      if (windowObject?.['DEV_MODE'] !== !![]) throw new Error('仅开发者模式可调试请求');
      const model = home
        ? run2()
        : buildStorySummaryRegenerationRequest(state['data']['project'], {
            modelId: state['models']['text'],
            provider: state['textProvider'],
            providerProfileId: state['textProviderProfileId'],
            allowDeveloperPromptModes: state['developerModeAvailable'],
          });
      if (!model['ok']) throw new Error(model['error']);
      if (typeof generateStory !== 'function') throw new Error('剧情 Agent 尚未初始化');
      return generateStory({
        ...model,
        model: model['model'] || model['modelId'],
        fileName: model['fileName'] || model['scriptFileName'],
        planning: model['planning'] || {
          episodeCount: model['episodeCount'],
          sceneMaxSeconds: model['sceneMaxSeconds'],
          promptMode: model['promptMode'],
        },
        request: captureRequest,
      });
    },
    authorizePaidRetry: authorizePaidRetry,
    createPersistedRun: createPersistedRun,
    generateFromHome: generateFromHome,
    regenerateSummary: regenerateSummary,
  };
}
