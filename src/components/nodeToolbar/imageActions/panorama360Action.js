import { t } from '../../../i18n/index.js';
const PANORAMA360_LEGACY_LABELS = Object.freeze(['360°全景图', '360全景图']);
function panorama360Text(value, item = {}) {
  return t('nodeToolbar.panorama360.' + value, item);
}
function uniqueList(list) {
  return Array.from(new Set(list.map((item2) => String(item2 || '').trim()).filter(Boolean)));
}
function panorama360OutputText({ status: status = '', error: error = '' } = {}) {
  const outputText = panorama360Text('outputText', { model: panorama360Text('modelLabel') }),
    outputText2 = status
      ? panorama360Text('outputTextWithStatus', { outputText: outputText, status: status })
      : outputText;
  return error
    ? panorama360Text('outputTextWithError', { outputText: outputText2, error: error })
    : outputText2;
}
export function bindImagePanorama360Action(key) {
  const {
      toolbarEl: toolbarEl,
      nodeId: nodeId,
      getNodeData: getNodeData,
      store: store,
      submitTask: submitTask,
      buildSourceMediaNodePayload: buildSourceMediaNodePayload,
      resolveCanvasImagePreviewUrl: resolveCanvasImagePreviewUrl,
      localPathToUrl: localPathToUrl,
      buildImageGenerationFailurePatch: buildImageGenerationFailurePatch,
      buildImageGenerationResultPatch: buildImageGenerationResultPatch,
      calcDisplaySizeByMedia: calcDisplaySizeByMedia,
      resumeRunningHubImageTask: resumeRunningHubImageTask,
      runRunninghubAiApp: runRunninghubAiApp,
      processInputImages: processInputImages,
      getProviderConfig: getProviderConfig,
      ensureConfig: ensureConfig,
      calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode,
      bindRunningHubToolbarTaskButton: bindRunningHubToolbarTaskButton,
      cancelRunningHubResultTask: cancelRunningHubResultTask,
      findRunningHubToolbarTaskForNode: findRunningHubToolbarTaskForNode,
      isRunningHubToolbarTaskCancelled: isRunningHubToolbarTaskCancelled,
      buildToolbarImageFields: buildToolbarImageFields,
      saveOutputImageResult: saveOutputImageResult,
      extractFirstImageUrl: extractFirstImageUrl,
      parseRhCode: parseRhCode,
      parseRhTaskId: parseRhTaskId,
      resolveApiInputRatioBasis: resolveApiInputRatioBasis,
      resolveFinalResultDisplaySize: resolveFinalResultDisplaySize,
      createToolbarCancelledError: createToolbarCancelledError,
      isToolbarCancelledError: isToolbarCancelledError,
      createLocalSaveFailureError: createLocalSaveFailureError,
      isLocalSaveFailure: isLocalSaveFailure,
      throwIfToolbarTaskCancelled: throwIfToolbarTaskCancelled,
      cancelRunningHubRemoteTaskQuietly: cancelRunningHubRemoteTaskQuietly,
      focusToolbarTaskNodes: focusToolbarTaskNodes,
      notifyImageToolbarTaskChange: notifyImageToolbarTaskChange,
      buildClearedImageMediaFields: buildClearedImageMediaFields,
      IMAGE_LOCAL_SAVE_FAILURE_MESSAGE: IMAGE_LOCAL_SAVE_FAILURE_MESSAGE,
    } = key,
    button = toolbarEl.querySelector('.act-panorama-360');
  if (button) {
    const appId = '2044874075721441281',
      modelId = 'runninghub/' + appId,
      nodeId2 = '147';
    let index = false;
    const run = (enabled) => {
      ((index = !!enabled), (button.style.opacity = enabled ? '0.65' : '1'));
      const el = button.querySelector('svg');
      if (el) {
        if (enabled) el.classList.add('v2-spinning');
        else el.classList.remove('v2-spinning');
      }
    };
    (bindRunningHubToolbarTaskButton({
      button: button,
      getTask: () =>
        findRunningHubToolbarTaskForNode(nodeId, {
          models: [modelId],
          taskTypes: ['image-panorama-360'],
          outputTextIncludes: uniqueList([...PANORAMA360_LEGACY_LABELS, panorama360Text('modelLabel')]),
          nameIncludes: uniqueList([...PANORAMA360_LEGACY_LABELS, panorama360Text('resultName')]),
        }),
      cancelTask: (result) =>
        cancelRunningHubResultTask(result, {
          name: panorama360Text('cancelledName'),
          outputText: panorama360OutputText({ status: panorama360Text('status.cancelled') }),
          notifyMessage: panorama360Text('cancelledToast'),
        }),
      cancelTooltip: panorama360Text('cancelTooltip'),
    }),
      button.addEventListener('click', (event) => {
        (event.stopPropagation(), event.preventDefault());
        if (index) {
          window.showToast?.(panorama360Text('busy'), 'info');
          return;
        }
        void (async () => {
          let width = null,
            sourceUrl = '',
            imageUrl = '',
            localPath = '',
            resumedImage = null;
          try {
            run(true);
            const data = getNodeData() || {},
              options = data?.localPath || (data?.images && data.images[data.mainImageIndex || 0]?.localPath),
              imgUrl = localPathToUrl(options) || resolveCanvasImagePreviewUrl(data);
            if (!imgUrl) {
              window.showToast?.(panorama360Text('noProcessableImage'), 'error');
              return;
            }
            await ensureConfig();
            const target = getProviderConfig('runninghubwf'),
              apiKey = String(target?.apiKey || '').trim();
            if (!apiKey) {
              window.showToast?.(panorama360Text('apiKeyMissing'), 'error');
              return;
            }
            const sourceNodeId = store.getState().nodes[nodeId] || data;
            if (!sourceNodeId) {
              window.showToast?.(panorama360Text('sourceNodeMissing'), 'error');
              return;
            }
            const inputBasis = await resolveApiInputRatioBasis(sourceNodeId, imgUrl),
              { width: width2, height: height } = calcDisplaySizeByMedia(inputBasis.width, inputBasis.height),
              { x: x, y: y } = calcSafeSpawnPosNearNode(store.getState().nodes, sourceNodeId, width2, height),
              id = 'source-image-panorama-360-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
              outputText3 = panorama360OutputText(),
              response = await submitTask({
                sourceNodeId: sourceNodeId.id,
                trigger: 'toolbar',
                taskType: 'image-panorama-360',
                provider: 'runninghubwf',
                adapterType: 'workflow',
                modelId: modelId,
                executionId: 'runninghub.image-panorama-360',
                payload: {
                  apiKey: apiKey,
                  imgUrl: imgUrl,
                  inputBasis: inputBasis,
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
                    name: panorama360Text('processingName'),
                    src: '',
                    outputText: outputText3,
                    localPath: '',
                    fileName: 'panorama_360_' + Date.now() + '.png',
                    provider: 'runninghubwf',
                    model: modelId,
                    rhTaskUseOpenapiQuery: true,
                    ...startPatch,
                    ...protocolPatch,
                    generationStartTime: startedAt,
                    rhTaskStartedAt: startedAt,
                  }),
                submit: async (source, signal) => {
                  focusToolbarTaskNodes(sourceNodeId.id, signal.targetNodeId);
                  const next = await processInputImages([source.imgUrl], apiKey, {
                      applyInputQualityProfile: true,
                      provider: 'runninghub',
                    }),
                    fieldValue = String(next?.[0] || '').trim();
                  if (!fieldValue) throw new Error(panorama360Text('uploadFailed'));
                  throwIfToolbarTaskCancelled(signal.targetNodeId);
                  const error2 = await runRunninghubAiApp(
                      {
                        apiKey: apiKey,
                        appId: appId,
                        nodeInfoList: [
                          {
                            nodeId: nodeId2,
                            fieldName: 'image',
                            fieldValue: fieldValue,
                            description: 'image',
                          },
                        ],
                        instanceType: 'default',
                        usePersonalQueue: 'false',
                      },
                      { signal: signal.signal },
                    ),
                    count = parseRhCode(error2);
                  if (count !== null && count !== 0)
                    throw new Error(
                      String(error2?.msg || error2?.message || panorama360Text('createTaskFailed')),
                    );
                  const taskId = parseRhTaskId(error2);
                  if (taskId) signal.onTaskId(taskId);
                  if (isRunningHubToolbarTaskCancelled(signal.targetNodeId)) {
                    await cancelRunningHubRemoteTaskQuietly({
                      apiKey: apiKey,
                      taskId: taskId,
                      label: 'Panorama360',
                    });
                    throw createToolbarCancelledError();
                  }
                  return taskId
                    ? { taskId: taskId }
                    : { result: { resultUrl: extractFirstImageUrl(error2) } };
                },
                poll: async ({ taskId: taskId2, targetNodeId: targetNodeId }) => {
                  const current = await resumeRunningHubImageTask(
                    taskId2,
                    { provider: 'runninghubwf', model: modelId, apiKey: apiKey },
                    { useOpenapiQuery: true, softTimeout: true },
                  );
                  if (current?.pending) return current;
                  throwIfToolbarTaskCancelled(targetNodeId);
                  const resumedImage2 =
                    current?.isBatch && Array.isArray(current.images) ? current.images[0] : current;
                  if (!resumedImage2 || resumedImage2.error)
                    throw new Error(String(resumedImage2?.error || panorama360Text('missingResultImage')));
                  const resultUrl = String(
                    resumedImage2.sourceUrl ||
                      resumedImage2.imageUrl ||
                      resumedImage2.thumbUrl ||
                      resumedImage2.src ||
                      '',
                  ).trim();
                  if (!resultUrl) throw new Error(panorama360Text('missingResultImage'));
                  return { resultUrl: resultUrl, resumedImage: resumedImage2 };
                },
                cancel: ({ taskId: taskId3 }) =>
                  cancelRunningHubRemoteTaskQuietly({
                    apiKey: apiKey,
                    taskId: taskId3,
                    label: 'Panorama360',
                  }),
                resultBuilder: async (entry, taskKey) => {
                  const thumbUrl = String(entry?.resultUrl || '').trim();
                  if (!thumbUrl) throw new Error(panorama360Text('missingResultImage'));
                  ((sourceUrl = thumbUrl), (resumedImage = entry?.resumedImage || null));
                  let record;
                  try {
                    record = await saveOutputImageResult(thumbUrl, {
                      resumedImage: resumedImage,
                      ext: 'png',
                      includeSrc: true,
                      taskKey: taskKey.taskId ? 'runninghubwf:image:' + taskKey.taskId : '',
                    });
                  } catch (payload) {
                    (console.warn('[Panorama360] saveOutputFromUrlToServer failed:', payload),
                      (record = {
                        localPath: '',
                        thumbUrl: thumbUrl,
                        fields: buildToolbarImageFields({
                          localPath: '',
                          resultUrl: thumbUrl,
                          thumbUrl: thumbUrl,
                          includeSrc: true,
                        }),
                      }));
                  }
                  ((imageUrl = record.thumbUrl || thumbUrl), (localPath = record.localPath || ''));
                  const args = record.fields;
                  width = await resolveFinalResultDisplaySize(inputBasis, {
                    localPath: localPath,
                    imageUrl: imageUrl || thumbUrl,
                    sourceUrl: thumbUrl,
                    thumbUrl: imageUrl,
                    src: imageUrl || thumbUrl,
                  });
                  if (!localPath) throw createLocalSaveFailureError();
                  return {
                    name: panorama360Text('resultName'),
                    ...buildImageGenerationResultPatch(args, { startedAt: taskKey.startedAt }),
                    ...args,
                    sourceUrl: thumbUrl || args.sourceUrl || '',
                    fileName:
                      resumedImage?.fileName || args.fileName || 'panorama_360_' + Date.now() + '.png',
                    width: width.width,
                    height: width.height,
                    outputText: outputText3,
                  };
                },
                failureBuilder: async (error3, startedAt2) => {
                  const error4 =
                    error3 instanceof Error
                      ? error3.message
                      : String(error3 || panorama360Text('unknownError'));
                  if (isLocalSaveFailure(error3))
                    return (
                      (width ||= await resolveFinalResultDisplaySize(inputBasis, {
                        localPath: localPath,
                        imageUrl: imageUrl || sourceUrl,
                        sourceUrl: sourceUrl,
                        thumbUrl: imageUrl,
                        src: imageUrl || sourceUrl,
                      })),
                      {
                        name: panorama360Text('resultName'),
                        ...buildClearedImageMediaFields(),
                        fileName: 'panorama_360_' + Date.now() + '.png',
                        width: width.width,
                        height: width.height,
                        outputText: outputText3,
                        ...buildImageGenerationFailurePatch({
                          error: IMAGE_LOCAL_SAVE_FAILURE_MESSAGE,
                          startedAt: startedAt2.startedAt,
                        }),
                        rhStatusMessage: IMAGE_LOCAL_SAVE_FAILURE_MESSAGE,
                      }
                    );
                  return {
                    name: panorama360Text('failedName'),
                    ...buildImageGenerationFailurePatch({ error: error4, startedAt: startedAt2.startedAt }),
                    outputText: panorama360Text('outputTextWithError', {
                      outputText: outputText3,
                      error: error4,
                    }),
                  };
                },
                cancelledBuilder: () => ({
                  name: panorama360Text('cancelledName'),
                  outputText: panorama360OutputText({ status: panorama360Text('status.cancelled') }),
                }),
              });
            if (response.status === 'success') window.showToast?.(panorama360Text('successToast'), 'success');
            else {
              if (response.status === 'pending') window.showToast?.(panorama360Text('pendingToast'), 'info');
              else {
                if (response.status === 'failed') {
                  if (isLocalSaveFailure(response.error))
                    window.showToast?.('⚠️ ' + IMAGE_LOCAL_SAVE_FAILURE_MESSAGE, 'warn');
                  else {
                    const error5 =
                      response.error instanceof Error
                        ? response.error.message
                        : String(response.error || panorama360Text('unknownError'));
                    window.showToast?.(panorama360Text('failedWithError', { error: error5 }), 'error');
                  }
                } else
                  response.status === 'cancelled' &&
                    window.showToast?.(panorama360Text('cancelledToast'), 'info');
              }
            }
          } catch (error6) {
            const error7 =
              error6 instanceof Error ? error6.message : String(error6 || panorama360Text('unknownError'));
            if (isToolbarCancelledError(error6)) {
              window.showToast?.(panorama360Text('cancelledToast'), 'info');
              return;
            }
            window.showToast?.(panorama360Text('failedWithError', { error: error7 }), 'error');
          } finally {
            run(false);
          }
        })();
      }));
  }
}
