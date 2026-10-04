import { getModelProvider } from '../config/modelConfig.js';
import { normalizeProviderId, resolveModelExecution, resolveModelProvider } from '../manifests/index.js';
const RUNNINGHUB_TASK_PROVIDERS = new Set(['runninghub', 'runninghubwf']);
function addProviderId(value, item) {
  const providerId = normalizeProviderId(item);
  if (providerId) value.add(providerId);
}
export function resolveImageTaskExecution(key, index = '') {
  const providerHint = normalizeProviderId(index);
  return resolveModelExecution(key, { providerHint: providerHint }) || resolveModelExecution(key);
}
export function getImageTaskProviderIds(result, data = '') {
  const options = new Set();
  (addProviderId(options, data),
    addProviderId(options, resolveModelProvider(result, data, { allowPrefixInference: false })));
  const imageTaskExecution = resolveImageTaskExecution(result, data);
  return (
    addProviderId(options, imageTaskExecution?.modelManifest?.provider),
    addProviderId(options, imageTaskExecution?.executionManifest?.provider),
    options
  );
}
export function resolveImageTaskProvider(target, source = '', next = 'grsai') {
  const providerId2 = normalizeProviderId(source);
  if (providerId2) return providerId2;
  const modelProvider = resolveModelProvider(target, '', {
    allowProviderHint: false,
    allowPrefixInference: false,
  });
  if (modelProvider) return modelProvider;
  return normalizeProviderId(getModelProvider(String(target || '').trim())) || normalizeProviderId(next);
}
export function isRunningHubImageTaskModel(current, entry = '') {
  const args = getImageTaskProviderIds(current, entry);
  return [...args].some((item2) => RUNNINGHUB_TASK_PROVIDERS.has(item2));
}
export function isDreaminaImageTaskModel(record, payload = '') {
  return getImageTaskProviderIds(record, payload).has('dreamina');
}
export function isRunningHubModelApiImageTask(handle, state = '') {
  const map = getImageTaskProviderIds(handle, state);
  if (!map.has('runninghub')) return false;
  const imageTaskExecution2 = resolveImageTaskExecution(handle, state);
  return (
    imageTaskExecution2?.modelManifest?.adapterType === 'modelApi' &&
    imageTaskExecution2?.executionManifest?.adapterType === 'modelApi'
  );
}
export function shouldUseRunningHubOpenapiQuery(config, scope = '') {
  if (!isRunningHubImageTaskModel(config, scope)) return false;
  if (isRunningHubModelApiImageTask(config, scope)) return true;
  const imageTaskExecution3 = resolveImageTaskExecution(config, scope)?.executionManifest;
  return (
    imageTaskExecution3?.queryMode === 'openapi-v2-query' ||
    imageTaskExecution3?.submitMode === 'openapi-v2-ai-app'
  );
}
