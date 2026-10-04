import { normalizeProviderId, resolveModelExecution } from '../../manifests/index.js';
function resolveTaskModelExecution(value, item) {
  const providerHint = normalizeProviderId(item);
  return resolveModelExecution(value, { providerHint: providerHint }) || resolveModelExecution(value);
}
function resolveTaskProviderIds(key, index) {
  const taskModelExecution = resolveTaskModelExecution(key, index);
  return [
    normalizeProviderId(index),
    normalizeProviderId(taskModelExecution?.modelManifest?.provider),
    normalizeProviderId(taskModelExecution?.executionManifest?.provider),
  ].filter(Boolean);
}
export const isRunningHubTaskModel = (result, data) => {
  const list = resolveTaskProviderIds(result, data);
  return list.includes('runninghub') || list.includes('runninghubwf');
};
export const isRunningHubModelApiTaskModel = (options, target) => {
  const taskModelExecution2 = resolveTaskModelExecution(options, target),
    list2 = resolveTaskProviderIds(options, target);
  return (
    list2.includes('runninghub') &&
    taskModelExecution2?.modelManifest?.adapterType === 'modelApi' &&
    taskModelExecution2?.executionManifest?.adapterType === 'modelApi'
  );
};
export const isDreaminaTaskModel = (source, next) => {
  return resolveTaskProviderIds(source, next).includes('dreamina');
};
export const buildRunningHubTaskPatch = ({
  taskId: taskId = '',
  status: status = 'pending',
  startedAt: startedAt = 0,
  recovering: recovering = false,
  useOpenapiQuery: useOpenapiQuery = false,
} = {}) => ({
  rhTaskId: String(taskId || '').trim(),
  rhTaskStatus: String(status || 'pending').trim() || 'pending',
  rhTaskStartedAt: Number(startedAt || 0),
  rhTaskRecovering: recovering === true,
  rhTaskUseOpenapiQuery: useOpenapiQuery === true,
});
export const buildDreaminaTaskPatch = ({
  submitId: submitId = '',
  status: status = 'pending',
  phase: phase = 'generating',
  label: label = '生成中',
  startedAt: startedAt = 0,
  recovering: recovering = false,
} = {}) => ({
  dreaminaSubmitId: String(submitId || '').trim(),
  dreaminaTaskStatus: String(status || 'pending').trim() || 'pending',
  dreaminaTaskPhase: String(phase || 'generating').trim() || 'generating',
  dreaminaTaskLabel: String(label || '生成中').trim() || '生成中',
  dreaminaTaskStartedAt: Number(startedAt || 0),
  dreaminaTaskLastCheckedAt: Date.now(),
  dreaminaTaskRecovering: recovering === true,
  dreaminaTaskLastRaw: {},
});
export const buildAsyncTaskPatch = ({
  provider: provider = '',
  kind: kind = 'image',
  taskId: taskId = '',
  status: status = 'pending',
  startedAt: startedAt = 0,
  recovering: recovering = false,
} = {}) => ({
  asyncTaskProvider: String(provider || '').trim(),
  asyncTaskKind: String(kind || 'image').trim() || 'image',
  asyncTaskId: String(taskId || '').trim(),
  asyncTaskStatus: String(status || 'pending').trim() || 'pending',
  asyncTaskStartedAt: Number(startedAt || 0),
  asyncTaskRecovering: recovering === true,
});
export const persistRunningHubResumeCache = () => {
  try {
    window._triggerLocalCacheSave?.();
  } catch {}
};
