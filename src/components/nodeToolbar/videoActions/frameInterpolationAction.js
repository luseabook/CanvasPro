import { RH_VIDEO_FRAME_INTERPOLATION_MODEL_ID, resolveModelExecution } from '../../../manifests/index.js';
import { t } from '../../../i18n/index.js';
function frameInterpolationText(value, item = {}) {
  return t('nodeToolbar.videoFrameInterpolation.' + value, item);
}
function uniqueList(list) {
  return Array.from(new Set(list.map((item2) => String(item2 || '').trim()).filter(Boolean)));
}
function getFrameTaskOutputText(status, { error: error = '' } = {}) {
  const outputText = frameInterpolationText('outputText', {
    model: frameInterpolationText('modelLabel'),
    status: status,
  });
  return error
    ? frameInterpolationText('outputTextWithError', { outputText: outputText, error: error })
    : outputText;
}
function getFrameTaskOutputTextIncludes(key) {
  return uniqueList([...(key?.toolbarTaskOutputTextIncludes || []), frameInterpolationText('modelLabel')]);
}
function getVideoFrameInterpolationConfig() {
  const modelId = resolveModelExecution(RH_VIDEO_FRAME_INTERPOLATION_MODEL_ID),
    enabled = modelId?.modelManifest?.extensions?.videoFrameInterpolation || null,
    sourceVideoNode = modelId?.executionManifest?.mapping?.sourceVideoNode || null,
    appId = String(modelId?.executionManifest?.appId || modelId?.executionManifest?.workflowId || '').trim(),
    taskType = String(enabled?.taskType || '').trim();
  if (!modelId || !enabled || !sourceVideoNode || !appId || !taskType)
    throw new Error('Video frame interpolation manifest extension missing');
  return {
    modelId: modelId.modelManifest.modelId,
    provider: modelId.modelManifest.provider,
    adapterType: modelId.modelManifest.adapterType,
    executionId: modelId.executionManifest.id,
    appId: appId,
    taskType: taskType,
    toolbarTaskOutputTextIncludes: Array.isArray(enabled.toolbarTaskOutputTextIncludes)
      ? enabled.toolbarTaskOutputTextIncludes.map((item3) => String(item3 || '').trim()).filter(Boolean)
      : [],
    sourceVideoNode: sourceVideoNode,
    instanceType: modelId.executionManifest.instanceType?.defaultValue || 'default',
  };
}
export function bindVideoFrameInterpolationAction(index) {
  const {
      toolbarEl: toolbarEl,
      nodeData: nodeData,
      store: store,
      submitTask: submitTask,
      createRunningHubTaskStateMachine: createRunningHubTaskStateMachine,
      runRunninghubAiApp: runRunninghubAiApp,
      resumeRunninghubWorkflowTask: resumeRunninghubWorkflowTask,
      processInputVideos: processInputVideos,
      getProviderConfig: getProviderConfig,
      ensureConfig: ensureConfig,
      calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode,
      buildSourceMediaNodePayload: buildSourceMediaNodePayload,
      getAutoMediaSizeByShortSide: getAutoMediaSizeByShortSide,
      buildCanvasLocalVideoFields: buildCanvasLocalVideoFields,
      buildVideoGenerationFailurePatch: buildVideoGenerationFailurePatch,
      buildVideoGenerationResultPatch: buildVideoGenerationResultPatch,
      bindRunningHubToolbarTaskButton: bindRunningHubToolbarTaskButton,
      cancelRunningHubResultTask: cancelRunningHubResultTask,
      findRunningHubToolbarTaskForNode: findRunningHubToolbarTaskForNode,
      isRunningHubToolbarTaskCancelled: isRunningHubToolbarTaskCancelled,
      notifyRunningHubToolbarTasksChanged: notifyRunningHubToolbarTasksChanged,
      _getCurrentVideoUrl: _getCurrentVideoUrl,
      _ensureVideoHdDurationAllowed: _ensureVideoHdDurationAllowed,
      _extractFirstUrl: _extractFirstUrl,
      _saveRemoteVideoResult: _saveRemoteVideoResult,
    } = index,
    taskType2 = getVideoFrameInterpolationConfig(),
    result = createRunningHubTaskStateMachine(),
    outId = result.state,
    button = toolbarEl.querySelector('.act-replace');
  button &&
    (result.bindButton(button),
    bindRunningHubToolbarTaskButton({
      button: button,
      getTask: () =>
        findRunningHubToolbarTaskForNode(nodeData.id, {
          models: [taskType2.modelId],
          taskTypes: [taskType2.taskType],
          outputTextIncludes: getFrameTaskOutputTextIncludes(taskType2),
        }),
      cancelTask: async (data) => {
        try {
          if (outId.active && String(outId.outNodeId || '') === data.outId)
            try {
              await result.cancel();
            } catch (options) {
              console.warn('[VideoFrameInterpolation] cancel request failed:', options);
            }
          return await cancelRunningHubResultTask(data, {
            name: frameInterpolationText('cancelledName'),
            outputText: getFrameTaskOutputText(frameInterpolationText('status.cancelled')),
            notifyMessage: frameInterpolationText('cancelledToast'),
          });
        } finally {
          outId.active && String(outId.outNodeId || '') === data.outId && result.reset(button);
        }
      },
      cancelTooltip: frameInterpolationText('cancelTooltip'),
    }),
    button.addEventListener('click', (event) => {
      (event.stopPropagation(), event.preventDefault());
      if (outId.active) {
        (async () => {
          let target = null;
          try {
            const source = outId.outNodeId
              ? {
                  outId: outId.outNodeId,
                  targetNodeId: outId.outNodeId,
                  taskId: outId.taskId,
                  apiKey: outId.apiKey,
                  sourceNodeId: nodeData.id,
                }
              : null;
            source
              ? await cancelRunningHubResultTask(source, {
                  name: frameInterpolationText('cancelledName'),
                  outputText: getFrameTaskOutputText(frameInterpolationText('status.cancelled')),
                  notifyMessage: frameInterpolationText('cancelledToast'),
                })
              : (await result.cancel(), window.showToast?.(frameInterpolationText('taskCancelled'), 'info'));
          } catch (next) {
            target = next;
          }
          try {
            target && console.warn('[VideoFrameInterpolation] cancel request failed:', target);
          } finally {
            result.reset(button);
          }
        })();
        return;
      }
      (async () => {
        let id = null;
        const startedAt = Date.now(),
          abortController = new AbortController();
        try {
          const sourceNodeId = store.getState().nodes?.[nodeData.id];
          if (!sourceNodeId) {
            window.showToast?.(frameInterpolationText('sourceNodeMissing'), 'error');
            return;
          }
          const inputVideoUrl = _getCurrentVideoUrl();
          if (!inputVideoUrl) {
            window.showToast?.(frameInterpolationText('noProcessableVideo'), 'error');
            return;
          }
          if (!(await _ensureVideoHdDurationAllowed(inputVideoUrl))) return;
          await ensureConfig();
          const current = getProviderConfig('runninghubwf'),
            apiKey = String(current?.apiKey || '').trim();
          if (!apiKey) {
            window.showToast?.(frameInterpolationText('apiKeyMissing'), 'error');
            return;
          }
          const entry = sourceNodeId.width || 300,
            record = sourceNodeId.height || 300,
            { width: width, height: height } = getAutoMediaSizeByShortSide(entry, record),
            { x: x, y: y } = calcSafeSpawnPosNearNode(store.getState().nodes, sourceNodeId, width, height);
          id = 'source-video-frame-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
          const response = await submitTask(
            {
              sourceNodeId: sourceNodeId.id,
              trigger: 'toolbar',
              taskType: taskType2.taskType,
              provider: taskType2.provider,
              adapterType: taskType2.adapterType,
              modelId: taskType2.modelId,
              executionId: taskType2.executionId,
              payload: { apiKey: apiKey, inputVideoUrl: inputVideoUrl, appId: taskType2.appId },
              cancellable: true,
              resumable: true,
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
                  name: frameInterpolationText('processingName'),
                  src: '',
                  localPath: '',
                  fileName: 'frame_' + Date.now() + '.mp4',
                  ...startPatch,
                  provider: taskType2.provider,
                  model: taskType2.modelId,
                  rhTaskUseOpenapiQuery: true,
                  ...protocolPatch,
                  outputText: getFrameTaskOutputText(frameInterpolationText('status.processing')),
                }),
              cancel: async ({ taskId: taskId }) => {
                if (!apiKey || !taskId) return;
                await cancelRunningHubResultTask(
                  { outId: id, taskId: taskId, sourceNodeId: sourceNodeId.id, apiKey: apiKey },
                  {
                    name: frameInterpolationText('cancelledName'),
                    outputText: getFrameTaskOutputText(frameInterpolationText('status.cancelled')),
                    notify: false,
                  },
                );
              },
              submit: async (appId2, outNodeId) => {
                (result.activate({
                  button: button,
                  apiKey: apiKey,
                  abortController: abortController,
                  outNodeId: outNodeId.targetNodeId,
                }),
                  store.setSelectedNodes([outNodeId.targetNodeId]));
                typeof window.v2FocusOnNodes === 'function'
                  ? window.v2FocusOnNodes([sourceNodeId.id, outNodeId.targetNodeId])
                  : window.v2FocusOnNode?.(outNodeId.targetNodeId);
                window.showToast?.(frameInterpolationText('uploading'), 'info');
                const payload = await processInputVideos([appId2.inputVideoUrl], apiKey),
                  fieldValue = payload[0];
                if (!fieldValue) throw new Error(frameInterpolationText('uploadNoDownloadUrl'));
                if (isRunningHubToolbarTaskCancelled(outNodeId.targetNodeId)) throw new Error('CANCELLED');
                window.showToast?.(frameInterpolationText('processingToast'), 'info');
                const handle = await runRunninghubAiApp(
                    {
                      apiKey: apiKey,
                      appId: appId2.appId,
                      nodeInfoList: [
                        {
                          nodeId: String(taskType2.sourceVideoNode.nodeId || ''),
                          fieldName: String(taskType2.sourceVideoNode.fieldName || ''),
                          fieldValue: fieldValue,
                          description: String(
                            taskType2.sourceVideoNode.description ||
                              taskType2.sourceVideoNode.fieldName ||
                              'video',
                          ),
                        },
                      ],
                      instanceType: taskType2.instanceType,
                      usePersonalQueue: 'false',
                    },
                    { signal: outNodeId.signal },
                  ),
                  taskId2 = String(
                    handle?.data?.taskId || handle?.data?.task_id || handle?.taskId || handle?.task_id || '',
                  ).trim();
                if (!taskId2) throw new Error(frameInterpolationText('taskIdMissing'));
                (result.setTaskId(taskId2), outNodeId.onTaskId?.(taskId2));
                if (result.isCancelled() || isRunningHubToolbarTaskCancelled(outNodeId.targetNodeId)) {
                  await cancelRunningHubResultTask(
                    {
                      outId: outNodeId.targetNodeId,
                      taskId: taskId2,
                      sourceNodeId: sourceNodeId.id,
                      apiKey: apiKey,
                    },
                    {
                      name: frameInterpolationText('cancelledName'),
                      outputText: getFrameTaskOutputText(frameInterpolationText('status.cancelled')),
                      notify: false,
                    },
                  );
                  throw new Error('CANCELLED');
                }
                return { taskId: taskId2 };
              },
              poll: async ({ taskId: taskId3, signal: signal, targetNodeId: targetNodeId2 }) => {
                const state = await resumeRunninghubWorkflowTask(
                  { apiKey: apiKey, taskId: taskId3 },
                  { signal: signal, useOpenapiQuery: true },
                );
                if (isRunningHubToolbarTaskCancelled(targetNodeId2)) throw new Error('CANCELLED');
                const resultUrl = _extractFirstUrl(state);
                if (!resultUrl) throw new Error(frameInterpolationText('missingOutputUrl'));
                const localPath = await _saveRemoteVideoResult(resultUrl);
                if (isRunningHubToolbarTaskCancelled(targetNodeId2)) throw new Error('CANCELLED');
                if (!localPath) throw new Error(frameInterpolationText('localSaveFailed'));
                return {
                  resultUrl: resultUrl,
                  localVideoFields: buildCanvasLocalVideoFields({
                    localPath: localPath,
                    videoUrl: resultUrl,
                  }),
                };
              },
              resultBuilder: ({ localVideoFields: localVideoFields }) => {
                const duration =
                  Date.now() - Number(store.getState().nodes?.[id]?.generationStartTime || startedAt);
                return {
                  name: frameInterpolationText('resultName'),
                  ...buildVideoGenerationResultPatch(localVideoFields, { duration: duration }),
                  ...localVideoFields,
                  fileName: 'frame_' + Date.now() + '.mp4',
                  outputText: getFrameTaskOutputText(frameInterpolationText('status.complete')),
                };
              },
              failureBuilder: (error2) => {
                const name = error2 instanceof Error ? error2.message : String(error2 || ''),
                  duration2 =
                    Date.now() - Number(store.getState().nodes?.[id]?.generationStartTime || startedAt);
                return {
                  name:
                    name === frameInterpolationText('localSaveFailed')
                      ? frameInterpolationText('resultName')
                      : frameInterpolationText('failedName'),
                  ...buildVideoGenerationFailurePatch({ error: name, duration: duration2 }),
                  ...(name === frameInterpolationText('localSaveFailed')
                    ? {
                        src: '',
                        videoUrl: '',
                        localPath: '',
                        thumbUrl: '',
                        videoMetaSrc: '',
                        fileName: 'frame_' + Date.now() + '.mp4',
                        rhStatusMessage: name,
                      }
                    : {}),
                  outputText:
                    name === frameInterpolationText('localSaveFailed')
                      ? getFrameTaskOutputText(frameInterpolationText('status.failed'))
                      : getFrameTaskOutputText(frameInterpolationText('status.failed'), { error: name }),
                };
              },
              cancelledBuilder: () => ({
                name: frameInterpolationText('cancelledName'),
                outputText: getFrameTaskOutputText(frameInterpolationText('status.cancelled')),
              }),
            },
            { store: store, abortController: abortController, startedAt: startedAt },
          );
          if (response.status === 'success')
            (window._triggerLocalCacheSave?.(),
              window.showToast?.(frameInterpolationText('successToast'), 'success'));
          else {
            if (response.status === 'cancelled')
              !outId.cancelRequested && window.showToast?.(frameInterpolationText('taskCancelled'), 'info');
            else {
              if (response.status === 'failed') {
                const error3 =
                  response.error instanceof Error ? response.error.message : String(response.error || '');
                window.showToast?.(frameInterpolationText('failedWithError', { error: error3 }), 'error');
              }
            }
          }
        } catch (error4) {
          const error5 = error4 instanceof Error ? error4.message : String(error4 || ''),
            config =
              outId.cancelRequested ||
              result.isCancelled() ||
              error5 === 'CANCELLED' ||
              error5 === frameInterpolationText('taskCancelled') ||
              error5 === '任务已取消' ||
              error5.includes('aborted');
          config
            ? !outId.cancelRequested && window.showToast?.(frameInterpolationText('taskCancelled'), 'info')
            : window.showToast?.(frameInterpolationText('failedWithError', { error: error5 }), 'error');
        } finally {
          result.reset(button);
        }
      })();
    }));
}
