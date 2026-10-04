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
function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}
function buildGenerationDurationPatch({ startedAt: startedAt = 0, duration: duration = null } = {}) {
  const generationDuration = Number(duration);
  if (
    duration !== null &&
    duration !== undefined &&
    Number.isFinite(generationDuration) &&
    generationDuration >= 0
  )
    return { generationDuration: generationDuration };
  const count = Number(startedAt);
  if (Number.isFinite(count) && count > 0) return { generationDuration: Math.max(0, Date.now() - count) };
  return {};
}
export function isGenerationTaskTerminalStatus(item) {
  return TASK_TERMINAL_STATUS.has(normalizeStatus(item));
}
export function isGenerationTaskFailureStatus(key) {
  return TASK_FAILURE_STATUS.has(normalizeStatus(key));
}
export function isGenerationTaskCancelledStatus(index) {
  return TASK_CANCELLED_STATUS.has(normalizeStatus(index));
}
export function resolveJobStatusFromTaskStatus(result, data = null) {
  const status = normalizeStatus(result);
  if (TASK_FAILURE_STATUS.has(status)) return 'error';
  if (TASK_CANCELLED_STATUS.has(status)) return 'cancelled';
  if (
    status === 'success' ||
    status === 'succeeded' ||
    status === 'completed' ||
    status === 'complete' ||
    status === 'done' ||
    status === 'finished' ||
    status === 'finish'
  )
    return 'success';
  if (status === 'idle') return data;
  return data;
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
  const t2 = t('coreUi.generationTask.generateFailed'),
    jobError = String(error || t2).trim() || t2;
  return {
    isGenerating: false,
    jobStatus: 'error',
    jobError: jobError,
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
