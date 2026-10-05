import { isRunningHubWorkflowQueueTarget } from '../../../api/runningHubWorkflowQueue.js';
import { resolveModelExecution } from '../../manifests/index.js';
const DEFAULT_NON_RUNNINGHUB_CHARACTER_IMAGE_BATCH_CONCURRENCY = 2;
function normalizeTargetCount(value) {
  return Math['max'](1, Math['trunc'](Number(value) || 1));
}
export function resolvePersonReplacementCharacterImageBatchConcurrency({
  targetCount: targetCount = 1,
  modelId: modelId = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
} = {}) {
  const targetCount2 = normalizeTargetCount(targetCount),
    modelExecution = resolveModelExecution(modelId, { providerHint: provider }),
    item = modelExecution?.['executionManifest'],
    key = {
      model: String(modelId || '')['trim'](),
      provider: String(provider || '')['trim'](),
      providerProfileId: String(providerProfileId || '')['trim'](),
    };
  if (
    isRunningHubWorkflowQueueTarget({
      providerId: modelExecution?.['modelManifest']?.['provider'] || provider,
      adapterType: item?.['adapterType'],
      executionManifest: item,
      payload: key,
    })
  )
    return targetCount2;
  return Math['min'](targetCount2, DEFAULT_NON_RUNNINGHUB_CHARACTER_IMAGE_BATCH_CONCURRENCY);
}
