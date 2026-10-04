import { buildVideoRequest } from './RunningHubAdapter.js';
import { processInputImages } from '../imageUploadApi.js';
export async function buildRunningHubImportedAudioRequest(nodeId, prompt, model, args) {
  const value = { ...nodeId, model: model['modelManifest']['modelId'] };
  for (const item of [nodeId['audioRefs'], nodeId['videoRefs'], nodeId['imageRefs']]) {
    for (const response of Array['isArray'](item) ? item : []) {
      if (response?.['refSlot'] && response?.['url']) value[response['refSlot']] = response['url'];
    }
  }
  const providerProfileId = await buildVideoRequest(value, prompt, {
    ...args,
    processInputImages: processInputImages,
  });
  return {
    ...providerProfileId,
    headers: {
      ...providerProfileId['headers'],
      ...(nodeId['installId'] ? { 'X-AIC-Install-Id': nodeId['installId'] } : {}),
    },
    meta: {
      provider: 'runninghubwf',
      adapterType: 'workflow',
      queryMode: model['executionManifest']['queryMode'],
      providerProfileId: providerProfileId['providerProfileId'],
      rhProviderProfileId: providerProfileId['providerProfileId'],
      apiUrl: providerProfileId['runningHubApiUrl'],
      audioWorkflowKey: model['modelManifest']['modelId'],
      model: model['modelManifest']['modelId'],
      executionId: model['executionManifest']['id'],
      nodeId: nodeId['nodeId'] || '',
      installId: nodeId['installId'] || '',
      prompt: prompt,
    },
  };
}
