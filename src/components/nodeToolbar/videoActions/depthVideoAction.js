import { RH_VIDEO_DEPTH_MODEL_ID, resolveModelExecution } from '../../../manifests/index.js';
import { t } from '../../../i18n/index.js';
import { showProviderApiKeyMissingToast } from '../../../modules/providerApiKeyMissingToast.js';
import { openVideoDepthEditor } from './videoDepthEditor.js';
function uniqueList(list) {
  return Array['from'](new Set(list['map']((value) => String(value || '')['trim']())['filter'](Boolean)));
}
function getDepthVideoActionConfig() {
  const modelId = resolveModelExecution(RH_VIDEO_DEPTH_MODEL_ID),
    enabled = modelId?.['modelManifest']?.['extensions']?.['videoToolbarAction'];
  if (
    !modelId?.['modelManifest'] ||
    !modelId?.['executionManifest'] ||
    !enabled?.['action'] ||
    !enabled?.['taskType'] ||
    !enabled?.['i18nKey']
  )
    throw new Error('Video depth toolbar manifest extension missing');
  return {
    modelId: modelId['modelManifest']['modelId'],
    provider: modelId['modelManifest']['provider'],
    adapterType: modelId['modelManifest']['adapterType'],
    executionId: modelId['executionManifest']['id'],
    instanceType: modelId['executionManifest']['instanceType']?.['defaultValue'] || 'default',
    action: String(enabled['action']),
    taskType: String(enabled['taskType']),
    i18nKey: String(enabled['i18nKey']),
    nodeIdPrefix: String(enabled['nodeIdPrefix'] || 'source-video-result'),
    fileNamePrefix: String(enabled['fileNamePrefix'] || 'video_result'),
    toolbarTaskOutputTextIncludes: Array['isArray'](enabled['toolbarTaskOutputTextIncludes'])
      ? enabled['toolbarTaskOutputTextIncludes']
      : [],
  };
}
function getActionText(item, key, index = {}) {
  return t('nodeToolbar.' + item['i18nKey'] + '.' + key, index);
}
function getOutputText(result, status, { error: error = '' } = {}) {
  const outputText = getActionText(result, 'outputText', {
    model: getActionText(result, 'modelLabel'),
    status: status,
  });
  return error
    ? getActionText(result, 'outputTextWithError', { outputText: outputText, error: error })
    : outputText;
}
export function bindVideoDepthAction(data) {
  const {
      toolbarEl: toolbarEl,
      nodeData: nodeData,
      store: store,
      submitTask: submitTask,
      generateVideo: generateVideo,
      createRunningHubTaskStateMachine: createRunningHubTaskStateMachine,
      getProviderConfig: getProviderConfig,
      ensureConfig: ensureConfig,
      calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode,
      buildSourceMediaNodePayload: buildSourceMediaNodePayload,
      getAutoMediaSizeByShortSide: getAutoMediaSizeByShortSide,
      buildVideoGenerationFailurePatch: buildVideoGenerationFailurePatch,
      buildVideoGenerationResultPatch: buildVideoGenerationResultPatch,
      bindRunningHubToolbarTaskButton: bindRunningHubToolbarTaskButton,
      cancelRunningHubResultTask: cancelRunningHubResultTask,
      cancelRunningHubRemoteTaskQuietly: cancelRunningHubRemoteTaskQuietly,
      findRunningHubToolbarTaskForNode: findRunningHubToolbarTaskForNode,
      notifyRunningHubToolbarTasksChanged: notifyRunningHubToolbarTasksChanged,
      _getCurrentVideoUrl: _getCurrentVideoUrl,
      openDepthPanel: openDepthPanel = openVideoDepthEditor,
    } = data,
    modelId2 = getDepthVideoActionConfig(),
    button = toolbarEl['querySelector']('.act-' + modelId2['action']);
  if (!button) return;
  const options = createRunningHubTaskStateMachine(),
    outId = options['state'],
    name = (target, source = {}) => getActionText(modelId2, target, source),
    outputText2 = (next, current) => getOutputText(modelId2, next, current),
    outputText3 = () => outputText2(name('status.cancelled'));
  let enabled2 = ![];
  (options['bindButton'](button),
    bindRunningHubToolbarTaskButton({
      button: button,
      getTask: () =>
        findRunningHubToolbarTaskForNode(nodeData['id'], {
          models: [modelId2['modelId']],
          taskTypes: [modelId2['taskType']],
          outputTextIncludes: uniqueList([...modelId2['toolbarTaskOutputTextIncludes'], name('modelLabel')]),
        }),
      cancelTask: (entry) =>
        cancelRunningHubResultTask(entry, {
          name: name('cancelledName'),
          outputText: outputText3(),
          notifyMessage: name('cancelledToast'),
        }),
      cancelTooltip: name('cancelTooltip'),
    }),
    button['addEventListener']('click', (event) => {
      (event['stopPropagation'](), event['preventDefault']());
      if (enabled2) return;
      if (outId['active']) {
        void (async () => {
          try {
            outId['outNodeId']
              ? await cancelRunningHubResultTask(
                  {
                    outId: outId['outNodeId'],
                    taskId: outId['taskId'],
                    apiKey: outId['apiKey'],
                    providerProfileId: outId['providerProfileId'],
                    sourceNodeId: nodeData['id'],
                  },
                  {
                    name: name('cancelledName'),
                    outputText: outputText3(),
                    notifyMessage: name('cancelledToast'),
                  },
                )
              : await options['cancel']();
          } finally {
            options['reset'](button);
          }
        })();
        return;
      }
      void (async () => {
        let startedAt;
        const record = globalThis['window']?.['currentProjectId'],
          abortController = new AbortController();
        try {
          let sourceNodeId = store['getState']()['nodes']?.[nodeData['id']];
          if (!sourceNodeId) {
            window['showToast']?.(name('sourceNodeMissing'), 'error');
            return;
          }
          const videoUrl = _getCurrentVideoUrl();
          if (!videoUrl) {
            window['showToast']?.(name('noProcessableVideo'), 'error');
            return;
          }
          ((enabled2 = !![]),
            data['closeToolbarMoreMenu']?.(),
            globalThis['window']?.['v2FocusOnNode']?.(sourceNodeId['id']));
          const generationParams = await openDepthPanel({
            store: store,
            sourceNodeId: sourceNodeId['id'],
            videoUrl: videoUrl,
            modelId: modelId2['modelId'],
            returnFocus: button,
          });
          if (!generationParams) return;
          sourceNodeId = store['getState']()['nodes']?.[nodeData['id']];
          if (!sourceNodeId) return;
          await ensureConfig();
          if (window['currentProjectId'] !== record || !store['getState']()['nodes']?.[nodeData['id']])
            return;
          startedAt = Date['now']();
          const payload = getProviderConfig(generationParams['providerProfileId'] || 'runninghubwf') || {},
            apiKey = String(payload['apiKey'] || '')['trim'](),
            providerId = String(generationParams['providerProfileId'] || payload['providerProfileId'] || '')[
              'trim'
            ](),
            runningHubApiUrl = String(payload['apiUrl'] || '')['trim']();
          if (!apiKey) {
            showProviderApiKeyMissingToast(name('apiKeyMissing'), {
              providerId: providerId || 'runninghubwf',
              type: 'error',
            });
            return;
          }
          const { width: width, height: height } = getAutoMediaSizeByShortSide(
              sourceNodeId['width'] || 300,
              sourceNodeId['height'] || 300,
            ),
            { x: x, y: y } = calcSafeSpawnPosNearNode(
              store['getState']()['nodes'],
              sourceNodeId,
              width,
              height,
            ),
            id =
              modelId2['nodeIdPrefix'] +
              '-' +
              Date['now']() +
              '-' +
              Math['random']()['toString'](36)['slice'](2, 6),
            fileName = () => modelId2['fileNamePrefix'] + '_' + Date['now']() + '.mp4',
            response = await submitTask(
              {
                sourceNodeId: sourceNodeId['id'],
                trigger: 'toolbar',
                taskType: modelId2['taskType'],
                provider: modelId2['provider'],
                adapterType: modelId2['adapterType'],
                modelId: modelId2['modelId'],
                executionId: modelId2['executionId'],
                payload: {
                  apiKey: apiKey,
                  provider: modelId2['provider'],
                  model: modelId2['modelId'],
                  providerProfileId: providerId,
                  rhProviderProfileId: providerId,
                  runningHubApiUrl: runningHubApiUrl,
                  videoUrl: videoUrl,
                  generationParams: generationParams['generationParams'],
                  rhInstanceType:
                    generationParams['generationParams']?.['rhInstanceType'] || modelId2['instanceType'],
                  prompt: '',
                },
                cancellable: !![],
                resumable: !![],
                pauseOnAbort: 'afterTaskId',
                onTaskChange: ({ sourceNodeId: sourceNodeId2, targetNodeId: targetNodeId }) =>
                  notifyRunningHubToolbarTasksChanged({ sourceNodeId: sourceNodeId2, outId: targetNodeId }),
                createTargetNode: ({ startPatch: startPatch, protocolPatch: protocolPatch }) =>
                  buildSourceMediaNodePayload({
                    id: id,
                    type: 'source-video',
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                    name: name('processingName'),
                    src: '',
                    localPath: '',
                    fileName: fileName(),
                    ...startPatch,
                    provider: modelId2['provider'],
                    model: modelId2['modelId'],
                    rhTaskUseOpenapiQuery: !![],
                    ...protocolPatch,
                    outputText: outputText2(name('status.processing')),
                  }),
                cancel: ({ taskId: taskId }) =>
                  cancelRunningHubRemoteTaskQuietly({
                    apiKey: apiKey,
                    taskId: taskId,
                    label: 'VideoDepth',
                    providerProfileId: providerId,
                  }),
                submit: async (handle, outNodeId) => {
                  (options['activate']({
                    button: button,
                    apiKey: apiKey,
                    providerProfileId: providerId,
                    abortController: abortController,
                    outNodeId: outNodeId['targetNodeId'],
                  }),
                    store['setSelectedNodes']([outNodeId['targetNodeId']]),
                    window['showToast']?.(name('uploading'), 'info'));
                  let enabled3 = ![];
                  return generateVideo(handle, {
                    signal: outNodeId['signal'],
                    runningHubWorkflowQueueLease: outNodeId['runningHubWorkflowQueueLease'],
                    onRunningHubWorkflowQueueChange: outNodeId['onRunningHubWorkflowQueueChange'],
                    onTaskMeta: ({ taskId: taskId2 }) => {
                      const state = String(taskId2 || '')['trim']();
                      (state && (options['setTaskId'](state), outNodeId['onTaskId']?.(state)),
                        !enabled3 &&
                          ((enabled3 = !![]), window['showToast']?.(name('processingToast'), 'info')));
                    },
                  });
                },
                resultBuilder: (config, startedAt2) => ({
                  name: name('resultName'),
                  ...buildVideoGenerationResultPatch(config, { startedAt: startedAt2['startedAt'] }),
                  fileName: fileName(),
                  outputText: outputText2(name('status.complete')),
                }),
                failureBuilder: (error2, startedAt3) => {
                  const error3 = error2 instanceof Error ? error2['message'] : String(error2 || '');
                  return {
                    name: name('failedName'),
                    ...buildVideoGenerationFailurePatch({
                      error: error3,
                      startedAt: startedAt3['startedAt'],
                    }),
                    fileName: fileName(),
                    outputText: outputText2(name('status.failed'), { error: error3 }),
                  };
                },
                cancelledBuilder: () => ({ name: name('cancelledName'), outputText: outputText3() }),
              },
              { store: store, abortController: abortController, startedAt: startedAt },
            );
          if (response['status'] === 'success')
            (window['_triggerLocalCacheSave']?.(), window['showToast']?.(name('successToast'), 'success'));
          else {
            if (response['status'] === 'failed') {
              const error4 =
                response['error'] instanceof Error
                  ? response['error']['message']
                  : String(response['error'] || '');
              window['showToast']?.(name('failedWithError', { error: error4 }), 'error');
            } else
              response['status'] === 'cancelled' && window['showToast']?.(name('cancelledToast'), 'info');
          }
        } catch (error5) {
          const error6 = error5 instanceof Error ? error5['message'] : String(error5 || ''),
            enabled4 =
              outId['cancelRequested'] ||
              options['isCancelled']() ||
              error6 === 'CANCELLED' ||
              error6['includes']('aborted');
          !enabled4 && window['showToast']?.(name('failedWithError', { error: error6 }), 'error');
        } finally {
          ((enabled2 = ![]), options['reset'](button));
        }
      })();
    }));
}
