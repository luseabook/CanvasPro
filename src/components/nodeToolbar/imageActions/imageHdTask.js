import { t } from '../../../i18n/index.js';
import { resolveModelExecution, sanitizeModelUiSchemaParams } from '../../../manifests/index.js';
import { buildRunningHubNodeInfoListFromManifest } from '../../../../api/adapters/RunningHubWorkflowMappingAdapter.js';
import { resolveRunningHubWorkflowResourceId } from '../../../../api/adapters/RunningHubAdapter.js';
import { showProviderApiKeyMissingToast } from '../../../modules/providerApiKeyMissingToast.js';
export function imageHdText(value, item = {}) {
  return t('nodeToolbar.imageHd.' + value, item);
}
export function imageHdOutputText({
  model: model = imageHdText('modelLabel'),
  resolution: resolution = '',
  status: status = '',
  error: error = '',
} = {}) {
  const outputText = imageHdText('outputText', {
      model: model,
      prompt: imageHdText('promptLabel'),
      resolution: resolution,
    }),
    outputText2 = status
      ? imageHdText('outputTextWithStatus', { outputText: outputText, status: status })
      : outputText;
  return error ? imageHdText('outputTextWithError', { outputText: outputText2, error: error }) : outputText2;
}
export async function submitImageHdTask(key, index, isTargetCurrent) {
  const {
      toolbarEl: toolbarEl,
      nodeId: nodeId,
      getNodeData: getNodeData,
      _hdTaskMachine: _hdTaskMachine,
      store: store,
      submitTask: submitTask,
      buildSourceMediaNodePayload: buildSourceMediaNodePayload,
      buildImageGenerationFailurePatch: buildImageGenerationFailurePatch,
      buildImageGenerationResultPatch: buildImageGenerationResultPatch,
      calcDisplaySizeByMedia: calcDisplaySizeByMedia,
      runRunninghubWorkflow: runRunninghubWorkflow,
      runRunninghubAiApp: runRunninghubAiApp,
      resumeRunninghubWorkflowTask: resumeRunninghubWorkflowTask,
      processInputImages: processInputImages,
      parseRhTaskId: parseRhTaskId,
      getProviderConfig: getProviderConfig,
      ensureConfig: ensureConfig,
      calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode,
      isRunningHubToolbarTaskCancelled: isRunningHubToolbarTaskCancelled,
      saveRemoteImageResultLocally: saveRemoteImageResultLocally,
      extractFirstImageUrl: extractFirstImageUrl,
      resolveApiInputRatioBasis: resolveApiInputRatioBasis,
      resolveFinalResultDisplaySize: resolveFinalResultDisplaySize,
      createToolbarCancelledError: createToolbarCancelledError,
      isToolbarCancelledError: isToolbarCancelledError,
      createLocalSaveFailureError: createLocalSaveFailureError,
      isLocalSaveFailure: isLocalSaveFailure,
      throwIfToolbarTaskCancelled: throwIfToolbarTaskCancelled,
      cancelRunningHubRemoteTaskQuietly: cancelRunningHubRemoteTaskQuietly,
      selectToolbarTaskNode: selectToolbarTaskNode,
      notifyImageToolbarTaskChange: notifyImageToolbarTaskChange,
      buildClearedImageMediaFields: buildClearedImageMediaFields,
      IMAGE_LOCAL_SAVE_FAILURE_MESSAGE: IMAGE_LOCAL_SAVE_FAILURE_MESSAGE,
    } = key,
    modelExecution = resolveModelExecution(index['modelId']);
  if (!modelExecution) throw new Error('高清工作流配置缺失');
  const { modelManifest: modelManifest, executionManifest: executionManifest } = modelExecution,
    handler = { 'runninghub-task-create': runRunninghubWorkflow, 'openapi-v2-ai-app': runRunninghubAiApp }[
      executionManifest['submitMode']
    ];
  if (!handler) throw new Error('不支持的高清提交方式：' + executionManifest['submitMode']);
  const rhTaskUseOpenapiQuery = executionManifest['queryMode'] === 'openapi-v2-query',
    generationParams = sanitizeModelUiSchemaParams(modelManifest['modelId'], index['generationParams']),
    resolution2 = generationParams['rhResolution'],
    button = toolbarEl['querySelector']('.act-hd'),
    result = nodeId,
    el = button['querySelector']('svg');
  if (el) el['classList']['add']('v2-spinning');
  const abortController = new AbortController();
  let taskId = '',
    apiKey = '',
    providerId = '',
    runningHubApiUrl = '',
    width = null,
    imageUrl = '',
    thumbUrl = '',
    localPath = '';
  try {
    const data = getNodeData(),
      options = data?.['images']?.[data['mainImageIndex'] || 0] || data,
      target = options?.['originalLocalPath'] || options?.['localPath'],
      imgUrl = target ? '/' + target : options?.['sourceUrl'] || options?.['imageUrl'] || options?.['src'];
    if (!imgUrl) {
      window['showToast']?.(imageHdText('noProcessableImage'), 'error');
      return;
    }
    await ensureConfig();
    if (!isTargetCurrent()) return;
    const source = getProviderConfig(index['providerProfileId'] || modelManifest['provider']);
    ((apiKey = String(source?.['apiKey'] || '')['trim']()),
      (providerId = String(index['providerProfileId'] || source?.['providerProfileId'] || '')['trim']()),
      (runningHubApiUrl = String(source?.['apiUrl'] || '')['trim']()));
    if (!apiKey) {
      showProviderApiKeyMissingToast(imageHdText('apiKeyMissing'), {
        providerId: providerId || 'runninghubwf',
        type: 'error',
      });
      return;
    }
    const sourceNodeId = store['getState']()['nodes'][result] || data;
    if (!sourceNodeId) {
      window['showToast']?.(imageHdText('sourceNodeMissing'), 'error');
      return;
    }
    const inputBasis = await resolveApiInputRatioBasis(sourceNodeId, imgUrl),
      { width: width2, height: height } = calcDisplaySizeByMedia(inputBasis['width'], inputBasis['height']),
      { x: x, y: y } = calcSafeSpawnPosNearNode(store['getState']()['nodes'], sourceNodeId, width2, height);
    if (!isTargetCurrent()) return;
    const workflowId = resolveRunningHubWorkflowResourceId(executionManifest, {
        providerProfileId: providerId,
      }),
      modelId = modelManifest['modelId'],
      id = 'source-image-hd-' + Date['now']() + '-' + Math['random']()['toString'](36)['slice'](2, 6),
      outputText3 = imageHdOutputText({ model: modelManifest['displayName'], resolution: resolution2 }),
      response = await submitTask(
        {
          sourceNodeId: sourceNodeId['id'],
          trigger: 'toolbar',
          taskType: 'image-hd',
          provider: 'runninghubwf',
          adapterType: 'workflow',
          modelId: modelId,
          executionId: executionManifest['id'],
          payload: {
            apiKey: apiKey,
            providerProfileId: providerId,
            runningHubApiUrl: runningHubApiUrl,
            imgUrl: imgUrl,
            inputBasis: inputBasis,
            generationParams: generationParams,
            outputText: outputText3,
          },
          cancellable: true,
          resumable: true,
          onTaskChange: notifyImageToolbarTaskChange,
          createTargetNode: ({
            startedAt: startedAt,
            startPatch: startPatch,
            protocolPatch: protocolPatch,
          }) =>
            buildSourceMediaNodePayload({
              id: id,
              type: 'source-image',
              x: x,
              y: y,
              width: width2,
              height: height,
              needsAutoResize: false,
              name: imageHdText('processingName'),
              src: '',
              outputText: outputText3,
              localPath: '',
              fileName: 'hd_' + Date['now']() + '.jpg',
              provider: 'runninghubwf',
              model: modelId,
              rhTaskUseOpenapiQuery: rhTaskUseOpenapiQuery,
              ...startPatch,
              ...protocolPatch,
              generationStartTime: startedAt,
              rhTaskStartedAt: startedAt,
            }),
          submit: async (apiUrl, outNodeId) => {
            (selectToolbarTaskNode(outNodeId['targetNodeId']),
              _hdTaskMachine['activate']({
                button: button,
                apiKey: apiKey,
                providerProfileId: providerId,
                abortController: abortController,
                outNodeId: outNodeId['targetNodeId'],
              }));
            const list = await processInputImages([apiUrl['imgUrl']], apiUrl['apiKey'], {
              applyInputQualityProfile: true,
              provider: 'runninghub',
              apiUrl: apiUrl['runningHubApiUrl'],
            });
            if (list['length'] === 0) throw new Error(imageHdText('uploadEmpty'));
            const enabled = String(list[0] || '')['trim']();
            if (!enabled) throw new Error(imageHdText('uploadFailed'));
            throwIfToolbarTaskCancelled(outNodeId['targetNodeId']);
            const next = await handler(
              {
                apiKey: apiUrl['apiKey'],
                providerProfileId: apiUrl['providerProfileId'],
                runningHubApiUrl: apiUrl['runningHubApiUrl'],
                workflowId: workflowId,
                addMetadata: false,
                nodeInfoList: await buildRunningHubNodeInfoListFromManifest({
                  mapping: executionManifest['mapping'],
                  payload: apiUrl,
                  sourceResolvers: { imageInput: () => enabled },
                }),
                instanceType: apiUrl['generationParams'][executionManifest['instanceType']['field']],
                usePersonalQueue: 'false',
              },
              {
                signal: abortController['signal'],
                runningHubWorkflowQueueLease: outNodeId['runningHubWorkflowQueueLease'],
              },
            );
            taskId = parseRhTaskId(next);
            if (!taskId) throw new Error(imageHdText('taskIdMissing'));
            (_hdTaskMachine['setTaskId'](taskId), outNodeId['onTaskId'](taskId));
            if (
              _hdTaskMachine['isCancelled']() ||
              isRunningHubToolbarTaskCancelled(outNodeId['targetNodeId'])
            ) {
              await cancelRunningHubRemoteTaskQuietly({
                apiKey: apiUrl['apiKey'],
                taskId: taskId,
                label: 'ImageHD',
                providerProfileId: apiUrl['providerProfileId'],
              });
              throw createToolbarCancelledError();
            }
            return { taskId: taskId };
          },
          poll: async ({ taskId: taskId2, signal: signal, targetNodeId: targetNodeId }) => {
            if (_hdTaskMachine['isCancelled']() || isRunningHubToolbarTaskCancelled(targetNodeId))
              throw createToolbarCancelledError();
            const current = await resumeRunninghubWorkflowTask(
              {
                apiKey: apiKey,
                taskId: taskId2,
                providerProfileId: providerId,
                runningHubApiUrl: runningHubApiUrl,
              },
              { signal: signal, taskKind: 'image', useOpenapiQuery: rhTaskUseOpenapiQuery },
            );
            if (_hdTaskMachine['isCancelled']() || isRunningHubToolbarTaskCancelled(targetNodeId))
              throw createToolbarCancelledError();
            const resultUrl = extractFirstImageUrl(current);
            if (!resultUrl) throw new Error(imageHdText('missingResultImage'));
            return { resultUrl: resultUrl };
          },
          cancel: ({ taskId: taskId3 }) =>
            cancelRunningHubRemoteTaskQuietly({
              apiKey: apiKey,
              taskId: taskId3,
              label: 'ImageHD',
              providerProfileId: providerId,
            }),
          resultBuilder: async (entry, startedAt2) => {
            const imageUrl2 = String(entry?.['resultUrl'] || '')['trim']();
            if (!imageUrl2) throw new Error(imageHdText('missingResultImage'));
            imageUrl = imageUrl2;
            let args = null;
            try {
              args = await saveRemoteImageResultLocally(imageUrl2, {
                projectId: window['currentProjectId'] || 'default_v2_project',
                includeSrc: true,
              });
            } catch (record) {
              console['error']('保存图片失败:', record);
            }
            ((localPath = args?.['localPath'] || ''), (thumbUrl = args?.['thumbUrl'] || imageUrl2));
            if (!localPath) throw createLocalSaveFailureError();
            return (
              (width = await resolveFinalResultDisplaySize(inputBasis, {
                localPath: localPath,
                imageUrl: imageUrl2,
                sourceUrl: imageUrl2,
                thumbUrl: thumbUrl,
                src: thumbUrl || imageUrl2,
              })),
              {
                name: imageHdText('resultName'),
                ...buildImageGenerationResultPatch(args['fields'], { startedAt: startedAt2['startedAt'] }),
                ...args['fields'],
                fileName: 'hd_' + Date['now']() + '.jpg',
                width: width['width'],
                height: width['height'],
                outputText: outputText3,
              }
            );
          },
          failureBuilder: async (error2, startedAt3) => {
            const error3 =
              error2 instanceof Error ? error2['message'] : String(error2 || imageHdText('unknownError'));
            if (isLocalSaveFailure(error2))
              return (
                (width ||= await resolveFinalResultDisplaySize(inputBasis, {
                  localPath: localPath,
                  imageUrl: imageUrl,
                  sourceUrl: imageUrl,
                  thumbUrl: thumbUrl,
                  src: thumbUrl || imageUrl,
                })),
                {
                  name: imageHdText('resultName'),
                  ...buildClearedImageMediaFields(),
                  width: width['width'],
                  height: width['height'],
                  outputText: outputText3,
                  ...buildImageGenerationFailurePatch({
                    error: IMAGE_LOCAL_SAVE_FAILURE_MESSAGE,
                    startedAt: startedAt3['startedAt'],
                  }),
                  rhStatusMessage: IMAGE_LOCAL_SAVE_FAILURE_MESSAGE,
                }
              );
            return {
              name: imageHdText('failedName'),
              ...buildImageGenerationFailurePatch({ error: error3, startedAt: startedAt3['startedAt'] }),
              outputText: imageHdText('outputTextWithError', { outputText: outputText3, error: error3 }),
            };
          },
          cancelledBuilder: () => ({
            name: imageHdText('cancelledName'),
            outputText: imageHdOutputText({
              model: modelManifest['displayName'],
              resolution: resolution2,
              status: imageHdText('status.cancelled'),
            }),
          }),
        },
        { abortController: abortController, store: store, isTargetCurrent: isTargetCurrent },
      );
    if (response['status'] === 'success') window['showToast']?.(imageHdText('successToast'), 'success');
    else {
      if (response['status'] === 'failed') {
        if (isLocalSaveFailure(response['error']))
          window['showToast']?.('⚠️ ' + IMAGE_LOCAL_SAVE_FAILURE_MESSAGE, 'warn');
        else {
          const error4 =
            response['error'] instanceof Error
              ? response['error']['message']
              : String(response['error'] || imageHdText('unknownError'));
          window['showToast']?.(imageHdText('failedWithError', { error: error4 }), 'error');
        }
      } else
        response['status'] === 'cancelled' && window['showToast']?.(imageHdText('cancelledToast'), 'info');
    }
  } catch (error5) {
    const error6 = error5 instanceof Error ? error5['message'] : String(error5 || '');
    isToolbarCancelledError(error5)
      ? window['showToast']?.(imageHdText('cancelledToast'), 'info')
      : (console['error']('RH高清放大失败:', error5),
        window['showToast']?.(imageHdText('failedWithError', { error: error6 }), 'error'));
  } finally {
    if (el) el['classList']['remove']('v2-spinning');
    _hdTaskMachine['reset'](button);
  }
}
