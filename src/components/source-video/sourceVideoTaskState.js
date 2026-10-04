import {
  getModelManifest,
  listModelManifests,
  normalizeProviderId,
  resolveModelExecution,
  RH_VIDEO_MATTING_MODEL_ID,
} from '../../manifests/index.js';
import { getTaskMessage, isTaskFailed } from '../../core/generationTaskUiState.js';
import { buildVideoGenerationFailurePatch } from '../video-node/videoGenerationResultRenderer.js';
import { sourceVideoText } from './sourceVideoRuntime.js';
const RH_VIDEO_STATUS_ALIASES = {
  success: new Set(['success', 'succeeded', 'completed', 'complete', 'done']),
  failed: new Set(['failed', 'fail', 'error']),
  cancelled: new Set(['cancelled', 'canceled']),
  pending: new Set(['pending', 'queued', 'submitted']),
  running: new Set(['running', 'processing', 'generating']),
};
export function getVideoMattingModelId() {
  return (
    getModelManifest(RH_VIDEO_MATTING_MODEL_ID)?.['extensions']?.['videoKeying']?.['modelId'] ||
    RH_VIDEO_MATTING_MODEL_ID
  );
}
export function buildSourceVideoRecoveryFailurePatch(
  value,
  { error: error = '', startedAt: startedAt = 0x0, duration: duration = null } = {},
) {
  const message =
      String(error?.['message'] || error || sourceVideoText('recovery.taskFailed'))['trim']() ||
      sourceVideoText('recovery.taskFailed'),
    item = String(value?.['outputText'] || '')['trim'](),
    outputText = item
      ? item + '\x0a' + sourceVideoText('recovery.failedWithMessage', { message: message })
      : sourceVideoText('recovery.failedWithMessage', { message: message });
  return {
    ...buildVideoGenerationFailurePatch({
      error: message,
      startedAt: startedAt,
      duration: duration,
      clearMediaFields: ![],
    }),
    outputText: outputText,
  };
}
function asStringArray(list) {
  return Array['isArray'](list) ? list['map']((key) => String(key || '')['trim']())['filter'](Boolean) : [];
}
function createManagedNameRegex(index, result, data) {
  const enabled = String(index || '')['trim']();
  if (!enabled) return /^$/;
  try {
    return new RegExp(enabled);
  } catch {
    throw new Error(
      '[source-video] invalid sourceVideoTaskName pattern for ' +
        (result?.['modelId'] || '') +
        '/' +
        (data || ''),
    );
  }
}
function getSourceVideoTaskNameConfigs(options) {
  const target = options?.['extensions'] || {};
  if (Array['isArray'](target['sourceVideoTaskNameRules'])) return target['sourceVideoTaskNameRules'];
  return target['sourceVideoTaskName'] ? [target['sourceVideoTaskName']] : [];
}
function createSourceVideoTaskNameRule(enabled2, matchModel) {
  if (!enabled2 || !matchModel) return null;
  const source = String(matchModel['modelId'] || enabled2['modelId'] || '')
      ['trim']()
      ['toLowerCase'](),
    key2 = String(matchModel['key'] || source || 'sourceVideoTask')['trim']();
  return {
    key: key2,
    matchModel: matchModel['matchModel'] !== ![],
    models: new Set(source ? [source] : []),
    textNeedles: asStringArray(matchModel['textNeedles']),
    managedNameRe: createManagedNameRegex(matchModel['managedNamePattern'], enabled2, key2),
    names: { ...(matchModel['names'] || {}) },
  };
}
function buildSourceVideoTaskNameRules() {
  return listModelManifests()
    ['flatMap']((next) =>
      getSourceVideoTaskNameConfigs(next)['map']((current) => createSourceVideoTaskNameRule(next, current)),
    )
    ['filter'](Boolean);
}
const RH_VIDEO_TASK_NAME_RULES = buildSourceVideoTaskNameRules();
function normalizeRunningHubVideoStatus(entry) {
  const record = String(entry || '')
    ['trim']()
    ['toLowerCase']();
  for (const [payload, map] of Object['entries'](RH_VIDEO_STATUS_ALIASES)) {
    if (map['has'](record)) return payload;
  }
  return record;
}
export function isRunningHubVideoTask(enabled3) {
  if (!enabled3 || typeof enabled3 !== 'object') return ![];
  const providerHint = normalizeProviderId(enabled3['provider']);
  if (providerHint === 'runninghubwf' || providerHint === 'runninghub') return !![];
  const modelExecution = resolveModelExecution(enabled3['model'], { providerHint: providerHint }),
    providerId = normalizeProviderId(modelExecution?.['modelManifest']?.['provider']),
    providerId2 = normalizeProviderId(modelExecution?.['executionManifest']?.['provider']);
  return providerId === 'runninghubwf' || providerId2 === 'runninghubwf';
}
function resolveRunningHubVideoTaskNameRule(error2) {
  if (!isRunningHubVideoTask(error2)) return '';
  const handle = String(error2?.['model'] || '')
      ['trim']()
      ['toLowerCase'](),
    state = String(error2?.['name'] || '')['trim'](),
    list2 = String(error2?.['outputText'] || ''),
    config = RH_VIDEO_TASK_NAME_RULES['find']((scope) => state && scope['managedNameRe']['test'](state));
  if (config) return config;
  const input = RH_VIDEO_TASK_NAME_RULES['find']((output) =>
    output['textNeedles']['some']((value2) => list2['includes'](value2)),
  );
  if (input) return input;
  return (
    RH_VIDEO_TASK_NAME_RULES['find']((value3) => {
      if (value3['matchModel'] !== ![] && value3['models']?.['has'](handle)) return !![];
      return ![];
    }) || null
  );
}
export function resolveRunningHubVideoStatusName(error3, value4) {
  const runningHubVideoTaskNameRule = resolveRunningHubVideoTaskNameRule(error3);
  if (!runningHubVideoTaskNameRule?.['names']) return '';
  const enabled4 = String(error3?.['name'] || '')['trim']();
  if (!enabled4 || !runningHubVideoTaskNameRule['managedNameRe']['test'](enabled4)) return '';
  return runningHubVideoTaskNameRule['names'][normalizeRunningHubVideoStatus(value4)] || '';
}
function buildChangedPatch(value5, value6) {
  const value7 = {};
  for (const [value8, value9] of Object['entries'](value6 || {})) {
    if (!Object['is'](value5?.[value8], value9)) value7[value8] = value9;
  }
  return value7;
}
export function buildRunningHubVideoTerminalStatePatch(value10, value11, value12) {
  if (!isRunningHubVideoTask(value10)) return null;
  const rhTaskStatus = normalizeRunningHubVideoStatus(value11 || value10?.['rhTaskStatus']);
  if (!['success', 'failed', 'cancelled']['includes'](rhTaskStatus)) return null;
  const error4 = { isGenerating: ![], rhTaskStatus: rhTaskStatus, rhTaskRecovering: ![] };
  if (rhTaskStatus === 'success') error4['jobStatus'] = 'success';
  if (rhTaskStatus === 'failed') error4['jobStatus'] = 'error';
  if (rhTaskStatus === 'cancelled') error4['jobStatus'] = null;
  typeof value10?.['generationDuration'] !== 'number' && (error4['generationDuration'] = value12);
  const runningHubVideoStatusName = resolveRunningHubVideoStatusName(value10, rhTaskStatus);
  if (runningHubVideoStatusName) error4['name'] = runningHubVideoStatusName;
  const changedPatch = buildChangedPatch(value10, error4);
  return Object['keys'](changedPatch)['length'] > 0x0 ? changedPatch : null;
}
export function resolveSourceVideoGenerationFailureMessage(options2 = {}) {
  if (!isTaskFailed(options2)) return '';
  const value13 = Array['isArray'](options2?.['videos']) ? options2['videos'] : [],
    value14 = Math['max'](0x0, Number(options2?.['mainVideoIndex']) || 0x0),
    value15 = value13[value14] || value13[0x0] || null;
  return (
    String(value15?.['error'] || '')['trim']() ||
    getTaskMessage(options2) ||
    sourceVideoText('recovery.taskFailed')
  );
}
