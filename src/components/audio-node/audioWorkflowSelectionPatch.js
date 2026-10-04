import { getModelManifest } from '../../manifests/index.js';
import { buildModelProviderProfileSelectionPatch } from '../../modules/modelProviderProfileSelection.js';
import { buildModelUiSchemaDefaultParams } from '../aigenImage/uiSchemaRenderer.js';
import { buildAudioWorkflowGenerationParams } from './audioWorkflowGenerationParams.js';
function getPlainParams(args) {
  return args && typeof args === 'object' && !Array['isArray'](args) ? { ...args } : {};
}
function arePlainParamsEqual(value, item) {
  return JSON['stringify'](getPlainParams(value)) === JSON['stringify'](getPlainParams(item));
}
function getWorkflowKey(options = {}) {
  return String(options?.['key'] || options?.['modelId'] || '')['trim']();
}
function buildAudioWorkflowProviderProfilePatch(key, index) {
  return buildModelProviderProfileSelectionPatch(key, index);
}
export function getAudioWorkflowUiSchemaField(result = '', data = '') {
  const enabled = String(data || '')['trim']();
  if (!enabled) return null;
  const modelManifest = getModelManifest(String(result || '')['trim']())?.['uiSchema']?.['fields'];
  if (!Array['isArray'](modelManifest)) return null;
  return modelManifest['find']((target) => String(target?.['id'] || '')['trim']() === enabled) || null;
}
export function doesAudioWorkflowSchemaHaveField(source = '', next = '') {
  return !!getAudioWorkflowUiSchemaField(source, next);
}
export function buildAudioWorkflowGenerationParamsPatch({
  nodeData: nodeData = {},
  workflowKey: workflowKey = '',
  extraParams: extraParams = {},
  currentModelKey: currentModelKey = '',
} = {}) {
  const current = String(workflowKey || '')['trim'](),
    entry = String(currentModelKey || nodeData?.['model'] || nodeData?.['audioWorkflowKey'] || '')['trim'](),
    plainParams = getPlainParams(nodeData?.['generationParamsByModel']),
    plainParams2 = getPlainParams(nodeData?.['generationParams']);
  entry && (plainParams[entry] = plainParams2);
  const audioWorkflowGenerationParams = buildAudioWorkflowGenerationParams({
    schemaDefaults: buildModelUiSchemaDefaultParams(current),
    savedParams: getPlainParams(plainParams[current]),
    currentParams: plainParams2,
    extraParams: extraParams,
    targetHasSpeakerId: doesAudioWorkflowSchemaHaveField(current, 'speakerId'),
  });
  if (current) plainParams[current] = audioWorkflowGenerationParams;
  return { generationParams: audioWorkflowGenerationParams, generationParamsByModel: plainParams };
}
export function buildAudioWorkflowSelectionPatch({
  nodeData: nodeData = {},
  workflow: workflow = {},
  extraParams: extraParams = {},
} = {}) {
  const workflowKey2 = getWorkflowKey(workflow);
  if (!workflowKey2) return {};
  const record = String(workflow?.['provider'] || 'runninghubwf')['trim']();
  return {
    provider: record,
    audioWorkflowKey: workflowKey2,
    audioWorkflowLabel: workflow?.['label'] || '',
    model: workflowKey2,
    ...buildAudioWorkflowProviderProfilePatch(nodeData, workflowKey2),
    ...buildAudioWorkflowGenerationParamsPatch({
      nodeData: nodeData,
      workflowKey: workflowKey2,
      extraParams: extraParams,
    }),
  };
}
export function buildAudioWorkflowDefaultSyncPatch({
  nodeData: nodeData = {},
  workflow: workflow = {},
} = {}) {
  const workflowKey3 = getWorkflowKey(workflow);
  if (!workflowKey3) return {};
  const payload = {},
    handle = String(workflow?.['provider'] || 'runninghubwf')['trim']();
  if (nodeData['provider'] !== handle) payload['provider'] = handle;
  nodeData['audioWorkflowKey'] !== workflowKey3 && (payload['audioWorkflowKey'] = workflowKey3);
  nodeData['audioWorkflowLabel'] !== workflow?.['label'] &&
    (payload['audioWorkflowLabel'] = workflow?.['label'] || '');
  if (nodeData['model'] !== workflowKey3) payload['model'] = workflowKey3;
  const audioWorkflowProviderProfilePatch = buildAudioWorkflowProviderProfilePatch(nodeData, workflowKey3);
  audioWorkflowProviderProfilePatch['providerProfileId'] !== undefined &&
    audioWorkflowProviderProfilePatch['providerProfileId'] !== nodeData['providerProfileId'] &&
    (payload['providerProfileId'] = audioWorkflowProviderProfilePatch['providerProfileId']);
  audioWorkflowProviderProfilePatch['providerProfileIdByModel'] !== undefined &&
    !arePlainParamsEqual(
      audioWorkflowProviderProfilePatch['providerProfileIdByModel'],
      nodeData['providerProfileIdByModel'],
    ) &&
    (payload['providerProfileIdByModel'] = audioWorkflowProviderProfilePatch['providerProfileIdByModel']);
  audioWorkflowProviderProfilePatch['rhProviderProfileId'] !== undefined &&
    audioWorkflowProviderProfilePatch['rhProviderProfileId'] !== nodeData['rhProviderProfileId'] &&
    (audioWorkflowProviderProfilePatch['rhProviderProfileId'] ||
      Object['hasOwn'](nodeData, 'rhProviderProfileId')) &&
    (payload['rhProviderProfileId'] = audioWorkflowProviderProfilePatch['rhProviderProfileId']);
  const audioWorkflowGenerationParamsPatch = buildAudioWorkflowGenerationParamsPatch({
    nodeData: nodeData,
    workflowKey: workflowKey3,
    currentModelKey: payload['model'] ? workflowKey3 : '',
  });
  return (
    (!arePlainParamsEqual(
      audioWorkflowGenerationParamsPatch['generationParams'],
      nodeData['generationParams'],
    ) ||
      !arePlainParamsEqual(
        audioWorkflowGenerationParamsPatch['generationParamsByModel'],
        nodeData['generationParamsByModel'],
      )) &&
      ((payload['generationParams'] = audioWorkflowGenerationParamsPatch['generationParams']),
      (payload['generationParamsByModel'] = audioWorkflowGenerationParamsPatch['generationParamsByModel'])),
    payload
  );
}
