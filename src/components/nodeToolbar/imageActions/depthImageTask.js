import { generateImage } from '../../../../api/aiImageApi.js';
import { resolveCanvasImageSourceUrl } from '../../../services/canvasMediaLocalService.js';
import { getImageGenerationResultError } from '../../aigenImage/imageGenerationResultRenderer.js';
import { resolveModelExecution, sanitizeModelUiSchemaParams } from '../../../manifests/index.js';
import { RH_IMAGE_DEPTH_MODEL_ID } from '../../../manifests/image/runninghub/runningHubImageDepthManifest.js';
import { showProviderApiKeyMissingToast } from '../../../modules/providerApiKeyMissingToast.js';
import { t } from '../../../i18n/index.js';
export const IMAGE_DEPTH_TASK_TYPE = 'image-depth';
export const imageDepthText = (value) => t('nodeToolbar.imageDepth.' + value);
export async function submitImageDepthTask(item, key, sourceNodeId, isTargetCurrent) {
  const {
      store: store,
      ensureConfig: ensureConfig,
      getProviderConfig: getProviderConfig,
      submitTask: submitTask,
      generateId: generateId,
      calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode,
      calcDisplaySizeByMedia: calcDisplaySizeByMedia,
      buildSourceMediaNodePayload: buildSourceMediaNodePayload,
      buildImageGenerationResultPatch: buildImageGenerationResultPatch,
      buildImageGenerationFailurePatch: buildImageGenerationFailurePatch,
      cancelRunningHubRemoteTaskQuietly: cancelRunningHubRemoteTaskQuietly,
      notifyImageToolbarTaskChange: notifyImageToolbarTaskChange,
      generateImage: generateImage2 = generateImage,
    } = item,
    canvasImageSourceUrl = resolveCanvasImageSourceUrl(
      sourceNodeId['images']?.[sourceNodeId['mainImageIndex'] || 0] || sourceNodeId,
    );
  if (!canvasImageSourceUrl) throw new Error(imageDepthText('missingImage'));
  const modelExecution = resolveModelExecution(RH_IMAGE_DEPTH_MODEL_ID);
  if (!modelExecution) throw new Error(imageDepthText('missingWorkflow'));
  const { modelManifest: modelManifest, executionManifest: executionManifest } = modelExecution,
    generationParams = sanitizeModelUiSchemaParams(modelManifest['modelId'], key['generationParams']);
  await ensureConfig();
  if (!isTargetCurrent()) return null;
  const apiKey = getProviderConfig(key['providerProfileId'] || modelManifest['provider']) || {},
    providerId = key['providerProfileId'] || apiKey['providerProfileId'];
  if (!String(apiKey['apiKey'] || '')['trim']())
    return (
      showProviderApiKeyMissingToast(imageDepthText('missingKey'), {
        providerId: providerId || modelManifest['provider'],
      }),
      null
    );
  const box = calcDisplaySizeByMedia(sourceNodeId['width'] || 300, sourceNodeId['height'] || 300),
    args = calcSafeSpawnPosNearNode(
      (store['getStateRaw']?.() || store['getState']())['nodes'],
      sourceNodeId,
      box['width'],
      box['height'],
    ),
    id = generateId('source-image-depth');
  return submitTask(
    {
      sourceNodeId: sourceNodeId['id'],
      trigger: 'toolbar',
      taskType: IMAGE_DEPTH_TASK_TYPE,
      provider: modelManifest['provider'],
      adapterType: modelManifest['adapterType'],
      modelId: modelManifest['modelId'],
      executionId: executionManifest['id'],
      payload: {
        model: modelManifest['modelId'],
        provider: modelManifest['provider'],
        providerProfileId: providerId,
        apiKey: apiKey['apiKey'],
        runningHubApiUrl: apiKey['apiUrl'],
        inputUrls: [canvasImageSourceUrl],
        prompt: '',
        generationParams: generationParams,
        ...generationParams,
      },
      cancellable: !![],
      resumable: !![],
      pauseOnAbort: 'afterTaskId',
      onTaskChange: notifyImageToolbarTaskChange,
      createTargetNode: ({ startPatch: startPatch, protocolPatch: protocolPatch }) =>
        buildSourceMediaNodePayload({
          id: id,
          type: 'source-image',
          ...args,
          ...box,
          name: imageDepthText('processing'),
          src: '',
          localPath: '',
          provider: modelManifest['provider'],
          model: modelManifest['modelId'],
          rhTaskUseOpenapiQuery: !![],
          ...startPatch,
          ...protocolPatch,
        }),
      submit: async (index, signal) => {
        if (isTargetCurrent()) store['setSelectedNodes']([signal['targetNodeId']]);
        const result = await generateImage2(index, {
            signal: signal['signal'],
            runningHubWorkflowQueueLease: signal['runningHubWorkflowQueueLease'],
            onRunningHubWorkflowQueueChange: signal['onRunningHubWorkflowQueueChange'],
            onTaskMeta: ({ taskId: taskId }) => signal['onTaskId']?.(taskId),
          }),
          imageGenerationResultError = getImageGenerationResultError(result);
        if (imageGenerationResultError) throw new Error(imageGenerationResultError);
        return result;
      },
      cancel: ({ taskId: taskId2 }) =>
        cancelRunningHubRemoteTaskQuietly({
          taskId: taskId2,
          apiKey: apiKey['apiKey'],
          providerProfileId: providerId,
          label: 'ImageDepth',
        }),
      resultBuilder: (data, startedAt) => ({
        ...buildImageGenerationResultPatch(data, { startedAt: startedAt['startedAt'] }),
        name: imageDepthText('result'),
        needsAutoResize: !![],
      }),
      failureBuilder: (error, startedAt2) => ({
        ...buildImageGenerationFailurePatch({
          error: error['message'] || String(error),
          startedAt: startedAt2['startedAt'],
        }),
        name: imageDepthText('failed'),
      }),
      cancelledBuilder: () => ({ name: imageDepthText('cancelled') }),
    },
    { store: store, isTargetCurrent: isTargetCurrent },
  );
}
