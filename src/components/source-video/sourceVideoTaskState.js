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
  _0x5a73e2,
  { error: error = '', startedAt: startedAt = 0x0, duration: duration = null } = {},
) {
  const _0x357332 =
      String(error?.['message'] || error || sourceVideoText('recovery.taskFailed'))['trim']() ||
      sourceVideoText('recovery.taskFailed'),
    _0x36ddf9 = String(_0x5a73e2?.['outputText'] || '')['trim'](),
    _0x428769 = _0x36ddf9
      ? _0x36ddf9 + '\x0a' + sourceVideoText('recovery.failedWithMessage', { message: _0x357332 })
      : sourceVideoText('recovery.failedWithMessage', { message: _0x357332 });
  return {
    ...buildVideoGenerationFailurePatch({
      error: _0x357332,
      startedAt: startedAt,
      duration: duration,
      clearMediaFields: ![],
    }),
    outputText: _0x428769,
  };
}
function asStringArray(_0x276e22) {
  return Array['isArray'](_0x276e22)
    ? _0x276e22['map']((_0x5749ae) => String(_0x5749ae || '')['trim']())['filter'](Boolean)
    : [];
}
function createManagedNameRegex(_0x5d964b, _0x52eed7, _0x42c6a0) {
  const _0x2b4419 = String(_0x5d964b || '')['trim']();
  if (!_0x2b4419) return /^$/;
  try {
    return new RegExp(_0x2b4419);
  } catch {
    throw new Error(
      '[source-video] invalid sourceVideoTaskName pattern for ' +
        (_0x52eed7?.['modelId'] || '') +
        '/' +
        (_0x42c6a0 || ''),
    );
  }
}
function getSourceVideoTaskNameConfigs(_0x4a669c) {
  const _0x1fe8f1 = _0x4a669c?.['extensions'] || {};
  if (Array['isArray'](_0x1fe8f1['sourceVideoTaskNameRules'])) return _0x1fe8f1['sourceVideoTaskNameRules'];
  return _0x1fe8f1['sourceVideoTaskName'] ? [_0x1fe8f1['sourceVideoTaskName']] : [];
}
function createSourceVideoTaskNameRule(_0x5d6a94, _0x432b0b) {
  if (!_0x5d6a94 || !_0x432b0b) return null;
  const _0x41b44b = String(_0x432b0b['modelId'] || _0x5d6a94['modelId'] || '')
      ['trim']()
      ['toLowerCase'](),
    _0x47dc75 = String(_0x432b0b['key'] || _0x41b44b || 'sourceVideoTask')['trim']();
  return {
    key: _0x47dc75,
    matchModel: _0x432b0b['matchModel'] !== ![],
    models: new Set(_0x41b44b ? [_0x41b44b] : []),
    textNeedles: asStringArray(_0x432b0b['textNeedles']),
    managedNameRe: createManagedNameRegex(_0x432b0b['managedNamePattern'], _0x5d6a94, _0x47dc75),
    names: { ...(_0x432b0b['names'] || {}) },
  };
}
function buildSourceVideoTaskNameRules() {
  return listModelManifests()
    ['flatMap']((_0x1a602d) =>
      getSourceVideoTaskNameConfigs(_0x1a602d)['map']((_0x4124dc) =>
        createSourceVideoTaskNameRule(_0x1a602d, _0x4124dc),
      ),
    )
    ['filter'](Boolean);
}
const RH_VIDEO_TASK_NAME_RULES = buildSourceVideoTaskNameRules();
function normalizeRunningHubVideoStatus(_0x4c8baa) {
  const _0x4eca0b = String(_0x4c8baa || '')
    ['trim']()
    ['toLowerCase']();
  for (const [_0x38a670, _0x5d800a] of Object['entries'](RH_VIDEO_STATUS_ALIASES)) {
    if (_0x5d800a['has'](_0x4eca0b)) return _0x38a670;
  }
  return _0x4eca0b;
}
export function isRunningHubVideoTask(_0x38c1c9) {
  if (!_0x38c1c9 || typeof _0x38c1c9 !== 'object') return ![];
  const _0xd67ac9 = normalizeProviderId(_0x38c1c9['provider']);
  if (_0xd67ac9 === 'runninghubwf' || _0xd67ac9 === 'runninghub') return !![];
  const _0x11ac08 = resolveModelExecution(_0x38c1c9['model'], { providerHint: _0xd67ac9 }),
    _0x15772b = normalizeProviderId(_0x11ac08?.['modelManifest']?.['provider']),
    _0x50e806 = normalizeProviderId(_0x11ac08?.['executionManifest']?.['provider']);
  return _0x15772b === 'runninghubwf' || _0x50e806 === 'runninghubwf';
}
function resolveRunningHubVideoTaskNameRule(_0x432a4f) {
  if (!isRunningHubVideoTask(_0x432a4f)) return '';
  const _0x268baa = String(_0x432a4f?.['model'] || '')
      ['trim']()
      ['toLowerCase'](),
    _0x308deb = String(_0x432a4f?.['name'] || '')['trim'](),
    _0x5d864f = String(_0x432a4f?.['outputText'] || ''),
    _0x565317 = RH_VIDEO_TASK_NAME_RULES['find'](
      (_0x6355dd) => _0x308deb && _0x6355dd['managedNameRe']['test'](_0x308deb),
    );
  if (_0x565317) return _0x565317;
  const _0x1595ef = RH_VIDEO_TASK_NAME_RULES['find']((_0x4f546d) =>
    _0x4f546d['textNeedles']['some']((_0x422286) => _0x5d864f['includes'](_0x422286)),
  );
  if (_0x1595ef) return _0x1595ef;
  return (
    RH_VIDEO_TASK_NAME_RULES['find']((_0x57b034) => {
      if (_0x57b034['matchModel'] !== ![] && _0x57b034['models']?.['has'](_0x268baa)) return !![];
      return ![];
    }) || null
  );
}
export function resolveRunningHubVideoStatusName(_0x20fe22, _0x3bfbb3) {
  const _0x44117d = resolveRunningHubVideoTaskNameRule(_0x20fe22);
  if (!_0x44117d?.['names']) return '';
  const _0xe6502d = String(_0x20fe22?.['name'] || '')['trim']();
  if (!_0xe6502d || !_0x44117d['managedNameRe']['test'](_0xe6502d)) return '';
  return _0x44117d['names'][normalizeRunningHubVideoStatus(_0x3bfbb3)] || '';
}
function buildChangedPatch(_0xf004e5, _0x23d5df) {
  const _0x115305 = {};
  for (const [_0x100d20, _0x3342ff] of Object['entries'](_0x23d5df || {})) {
    if (!Object['is'](_0xf004e5?.[_0x100d20], _0x3342ff)) _0x115305[_0x100d20] = _0x3342ff;
  }
  return _0x115305;
}
export function buildRunningHubVideoTerminalStatePatch(_0x3409a1, _0x10d3fb, _0x3932fd) {
  if (!isRunningHubVideoTask(_0x3409a1)) return null;
  const _0x19a2e4 = normalizeRunningHubVideoStatus(_0x10d3fb || _0x3409a1?.['rhTaskStatus']);
  if (!['success', 'failed', 'cancelled']['includes'](_0x19a2e4)) return null;
  const _0x3e7d89 = { isGenerating: ![], rhTaskStatus: _0x19a2e4, rhTaskRecovering: ![] };
  if (_0x19a2e4 === 'success') _0x3e7d89['jobStatus'] = 'success';
  if (_0x19a2e4 === 'failed') _0x3e7d89['jobStatus'] = 'error';
  if (_0x19a2e4 === 'cancelled') _0x3e7d89['jobStatus'] = null;
  typeof _0x3409a1?.['generationDuration'] !== 'number' && (_0x3e7d89['generationDuration'] = _0x3932fd);
  const _0x1be3b4 = resolveRunningHubVideoStatusName(_0x3409a1, _0x19a2e4);
  if (_0x1be3b4) _0x3e7d89['name'] = _0x1be3b4;
  const _0x4e7a7c = buildChangedPatch(_0x3409a1, _0x3e7d89);
  return Object['keys'](_0x4e7a7c)['length'] > 0x0 ? _0x4e7a7c : null;
}
export function resolveSourceVideoGenerationFailureMessage(_0x3b4c11 = {}) {
  if (!isTaskFailed(_0x3b4c11)) return '';
  const _0xe1de20 = Array['isArray'](_0x3b4c11?.['videos']) ? _0x3b4c11['videos'] : [],
    _0x512b29 = Math['max'](0x0, Number(_0x3b4c11?.['mainVideoIndex']) || 0x0),
    _0x16880c = _0xe1de20[_0x512b29] || _0xe1de20[0x0] || null;
  return (
    String(_0x16880c?.['error'] || '')['trim']() ||
    getTaskMessage(_0x3b4c11) ||
    sourceVideoText('recovery.taskFailed')
  );
}
