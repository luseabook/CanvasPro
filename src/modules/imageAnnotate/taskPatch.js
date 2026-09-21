import { normalizeProviderId, resolveModelExecution } from '../../manifests/index.js';
function resolveTaskModelExecution(_0x33d138, _0x3c48b7) {
  const _0x302555 = normalizeProviderId(_0x3c48b7);
  return resolveModelExecution(_0x33d138, { providerHint: _0x302555 }) || resolveModelExecution(_0x33d138);
}
function resolveTaskProviderIds(_0x3b5b0f, _0xbe117e) {
  const _0x8b291d = resolveTaskModelExecution(_0x3b5b0f, _0xbe117e);
  return [
    normalizeProviderId(_0xbe117e),
    normalizeProviderId(_0x8b291d?.modelManifest?.provider),
    normalizeProviderId(_0x8b291d?.executionManifest?.provider),
  ].filter(Boolean);
}
export const isRunningHubTaskModel = (_0x6caae0, _0x4d817d) => {
  const _0x57ad14 = resolveTaskProviderIds(_0x6caae0, _0x4d817d);
  return _0x57ad14.includes('runninghub') || _0x57ad14.includes('runninghubwf');
};
export const isRunningHubModelApiTaskModel = (_0x25b602, _0xb679c1) => {
  const _0x8bcdf4 = resolveTaskModelExecution(_0x25b602, _0xb679c1),
    _0x12055e = resolveTaskProviderIds(_0x25b602, _0xb679c1);
  return (
    _0x12055e.includes('runninghub') &&
    _0x8bcdf4?.modelManifest?.adapterType === 'modelApi' &&
    _0x8bcdf4?.executionManifest?.adapterType === 'modelApi'
  );
};
export const isDreaminaTaskModel = (_0x377f66, _0x5236a8) => {
  return resolveTaskProviderIds(_0x377f66, _0x5236a8).includes('dreamina');
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
