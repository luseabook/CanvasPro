import { normalizeProviderId, resolveModelExecution } from '../../manifests/index.js';
import { isCustomAiAppManifest, resolveCustomAiAppNodeManifest } from '../shared/rhAiAppNodeBehavior.js';
import { hasRunningHubVideoWorkflowUiPlacement } from './runningHubVideoUiSchema.js';
function resolveExecution(value, providerHint) {
  return resolveModelExecution(value, { providerHint: providerHint }) || resolveModelExecution(value) || null;
}
function isRunningHubVideoWorkflowExecution(item) {
  return (
    normalizeProviderId(item?.['modelManifest']?.['provider']) === 'runninghubwf' &&
    item?.['modelManifest']?.['adapterType'] === 'workflow' &&
    item?.['executionManifest']?.['adapterType'] === 'workflow'
  );
}
function hasModelUiSchemaPlacement(key, index) {
  const enabled = String(index || '')
    ['trim']()
    ['toLowerCase']();
  if (!enabled) return ![];
  const list = Array['isArray'](key?.['uiSchema']?.['fields']) ? key['uiSchema']['fields'] : [];
  return list['some']((result) => {
    return (
      String(result?.['placement'] || '')
        ['trim']()
        ['toLowerCase']() === enabled
    );
  });
}
export function isRunningHubVideoWorkflowModel(data, options) {
  return isRunningHubVideoWorkflowExecution(resolveExecution(data, options));
}
export function resolveVideoAdvancedSchemaTarget(
  options2 = {},
  { fallbackNodeData: fallbackNodeData = {}, buildRunningHubNodeData: buildRunningHubNodeData } = {},
) {
  const nodeData = options2 || {},
    args = fallbackNodeData || {},
    model = String(nodeData?.['model'] || args?.['model'] || '')['trim']();
  if (!model) return null;
  const provider = nodeData?.['provider'] || args?.['provider'],
    execution = resolveExecution(model, provider),
    customAiAppNodeManifest = resolveCustomAiAppNodeManifest({
      ...args,
      ...nodeData,
      model: model,
      provider: provider,
    });
  if (isCustomAiAppManifest(customAiAppNodeManifest || execution?.['modelManifest'])) {
    const target = customAiAppNodeManifest || execution?.['modelManifest'];
    return hasModelUiSchemaPlacement(target, 'advanced')
      ? { modelId: model, nodeData: buildRunningHubNodeData?.(nodeData) || nodeData, placement: 'advanced' }
      : null;
  }
  if (isRunningHubVideoWorkflowExecution(execution)) {
    if (execution?.['modelManifest']?.['extensions']?.['rhAiApp'])
      return hasRunningHubVideoWorkflowUiPlacement(model, 'advanced')
        ? { modelId: model, nodeData: buildRunningHubNodeData?.(nodeData) || nodeData, placement: 'advanced' }
        : null;
    return hasRunningHubVideoWorkflowUiPlacement(model, 'videoAdvanced')
      ? {
          modelId: model,
          nodeData: buildRunningHubNodeData?.(nodeData) || nodeData,
          placement: 'videoAdvanced',
        }
      : null;
  }
  if (
    execution?.['modelManifest']?.['adapterType'] !== 'modelApi' ||
    execution?.['modelManifest']?.['kind'] !== 'video'
  )
    return null;
  const modelId = String(
    execution?.['canonicalModelId'] || execution?.['modelManifest']?.['modelId'] || model,
  )['trim']();
  return modelId ? { modelId: modelId, nodeData: nodeData, placement: 'advanced' } : null;
}
