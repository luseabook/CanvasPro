import { t } from '../i18n/index.js';
const TASK_TERMINAL_STATUS = new Set([
    'success',
    'succeeded',
    'completed',
    'complete',
    'done',
    'finished',
    'finish',
    'failed',
    'fail',
    'error',
    'cancelled',
    'canceled',
    'idle',
  ]),
  TASK_FAILURE_STATUS = new Set(['failed', 'fail', 'error']),
  TASK_CANCELLED_STATUS = new Set(['cancelled', 'canceled']);
function normalizeStatus(_0xee3ad) {
  return String(_0xee3ad || '')
    .trim()
    .toLowerCase();
}
function buildGenerationDurationPatch({ startedAt: startedAt = 0, duration: duration = null } = {}) {
  const _0x3bc36b = Number(duration);
  if (duration !== null && duration !== undefined && Number.isFinite(_0x3bc36b) && _0x3bc36b >= 0)
    return { generationDuration: _0x3bc36b };
  const _0x1c9075 = Number(startedAt);
  if (Number.isFinite(_0x1c9075) && _0x1c9075 > 0)
    return { generationDuration: Math.max(0, Date.now() - _0x1c9075) };
  return {};
}
export function isGenerationTaskTerminalStatus(_0x37bd6b) {
  return TASK_TERMINAL_STATUS.has(normalizeStatus(_0x37bd6b));
}
export function isGenerationTaskFailureStatus(_0x55613a) {
  return TASK_FAILURE_STATUS.has(normalizeStatus(_0x55613a));
}
export function isGenerationTaskCancelledStatus(_0x3c32d9) {
  return TASK_CANCELLED_STATUS.has(normalizeStatus(_0x3c32d9));
}
export function resolveJobStatusFromTaskStatus(_0x292ee2, _0x5838b7 = null) {
  const _0x11b5a2 = normalizeStatus(_0x292ee2);
  if (TASK_FAILURE_STATUS.has(_0x11b5a2)) return 'error';
  if (TASK_CANCELLED_STATUS.has(_0x11b5a2)) return 'cancelled';
  if (
    _0x11b5a2 === 'success' ||
    _0x11b5a2 === 'succeeded' ||
    _0x11b5a2 === 'completed' ||
    _0x11b5a2 === 'complete' ||
    _0x11b5a2 === 'done' ||
    _0x11b5a2 === 'finished' ||
    _0x11b5a2 === 'finish'
  )
    return 'success';
  if (_0x11b5a2 === 'idle') return _0x5838b7;
  return _0x5838b7;
}
export function buildGenerationStartPatch({ startedAt: startedAt = Date.now() } = {}) {
  return {
    isGenerating: true,
    jobStatus: 'running',
    jobError: null,
    generationStartTime: Number(startedAt || 0) || Date.now(),
    generationDuration: null,
  };
}
export function buildGenerationSuccessPatch({ startedAt: startedAt = 0, duration: duration = null } = {}) {
  return {
    isGenerating: false,
    jobStatus: 'success',
    jobError: null,
    ...buildGenerationDurationPatch({ startedAt: startedAt, duration: duration }),
  };
}
export function buildGenerationFailurePatch({
  error: error = '',
  startedAt: startedAt = 0,
  duration: duration = null,
} = {}) {
  const _0x3379b1 = t('coreUi.generationTask.generateFailed'),
    _0x3eab6c = String(error || _0x3379b1).trim() || _0x3379b1;
  return {
    isGenerating: false,
    jobStatus: 'error',
    jobError: _0x3eab6c,
    ...buildGenerationDurationPatch({ startedAt: startedAt, duration: duration }),
  };
}
export function buildGenerationCancelledPatch({ startedAt: startedAt = 0, duration: duration = null } = {}) {
  return {
    isGenerating: false,
    jobStatus: 'cancelled',
    jobError: null,
    ...buildGenerationDurationPatch({ startedAt: startedAt, duration: duration }),
  };
}
