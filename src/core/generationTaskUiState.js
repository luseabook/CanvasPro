const RUNNING_STATUSES = new Set(['running', 'processing', 'generating', 'in_progress', 'in-progress']),
  QUEUED_STATUSES = new Set(['pending', 'queued', 'queueing', 'waiting', 'submitted']),
  SUBMITTING_STATUSES = new Set(['submitting', 'submit']),
  SUCCESS_STATUSES = new Set(['success', 'succeeded', 'completed', 'complete', 'done', 'finished', 'finish']),
  ERROR_STATUSES = new Set(['error', 'failed', 'fail']),
  CANCELLED_STATUSES = new Set(['cancelled', 'canceled']),
  RECOVERING_FIELDS = Object.freeze(['rhTaskRecovering', 'dreaminaTaskRecovering', 'asyncTaskRecovering']),
  STATUS_FIELDS = Object.freeze([
    'jobStatus',
    'rhTaskStatus',
    'dreaminaTaskStatus',
    'dreaminaTaskPhase',
    'asyncTaskStatus',
    'mediaTaskStatus',
  ]),
  MESSAGE_FIELDS = Object.freeze([
    'jobError',
    'rhStatusMessage',
    'dreaminaTaskLabel',
    'asyncTaskError',
    'mediaTaskError',
    'error',
    'statusMessage',
  ]),
  IDLE_STATUSES = new Set(['idle', '']);
function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}
function isNonIdleStatus(item) {
  return !IDLE_STATUSES.has(normalizeStatus(item));
}
function hasActiveTaskFamily(enabled) {
  if (!enabled || typeof enabled !== 'object') return false;
  return (
    enabled.rhTaskRecovering === true ||
    enabled.dreaminaTaskRecovering === true ||
    enabled.asyncTaskRecovering === true ||
    !!String(enabled.rhTaskId || '').trim() ||
    !!String(enabled.dreaminaSubmitId || '').trim() ||
    !!String(enabled.asyncTaskId || '').trim() ||
    isNonIdleStatus(enabled.rhTaskStatus) ||
    isNonIdleStatus(enabled.dreaminaTaskStatus) ||
    isNonIdleStatus(enabled.asyncTaskStatus)
  );
}
function collectStatuses(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object') return [];
  if (hasActiveTaskFamily(enabled2)) {
    const list = [enabled2.jobStatus];
    return (
      (enabled2.rhTaskRecovering === true ||
        !!String(enabled2.rhTaskId || '').trim() ||
        isNonIdleStatus(enabled2.rhTaskStatus)) &&
        list.push(enabled2.rhTaskStatus),
      (enabled2.dreaminaTaskRecovering === true ||
        !!String(enabled2.dreaminaSubmitId || '').trim() ||
        isNonIdleStatus(enabled2.dreaminaTaskStatus)) &&
        list.push(enabled2.dreaminaTaskStatus, enabled2.dreaminaTaskPhase),
      (enabled2.asyncTaskRecovering === true ||
        !!String(enabled2.asyncTaskId || '').trim() ||
        isNonIdleStatus(enabled2.asyncTaskStatus)) &&
        list.push(enabled2.asyncTaskStatus),
      list.map(normalizeStatus).filter(Boolean)
    );
  }
  return STATUS_FIELDS.map((item2) => normalizeStatus(enabled2[item2])).filter(Boolean);
}
function hasAnyStatus(list2, map) {
  return list2.some((item3) => map.has(item3));
}
function hasRecoveringFlag(enabled3) {
  if (!enabled3 || typeof enabled3 !== 'object') return false;
  return RECOVERING_FIELDS.some((item4) => enabled3[item4] === true);
}
export function resolveGenerationUiState(key) {
  const statuses = collectStatuses(key);
  if (hasAnyStatus(statuses, ERROR_STATUSES)) return 'error';
  if (hasAnyStatus(statuses, CANCELLED_STATUSES)) return 'cancelled';
  if (hasAnyStatus(statuses, SUCCESS_STATUSES)) return 'success';
  if (hasRecoveringFlag(key)) return 'recovering';
  if (hasAnyStatus(statuses, RUNNING_STATUSES)) return 'running';
  if (hasAnyStatus(statuses, QUEUED_STATUSES)) return 'queued';
  if (hasAnyStatus(statuses, SUBMITTING_STATUSES)) return 'submitting';
  if (key?.isGenerating === true) return 'running';
  return 'idle';
}
export function isTaskRunning(index) {
  return ['submitting', 'queued', 'running', 'recovering'].includes(resolveGenerationUiState(index));
}
export function isTaskTerminal(result) {
  return ['success', 'error', 'cancelled'].includes(resolveGenerationUiState(result));
}
export function isTaskFailed(data) {
  return resolveGenerationUiState(data) === 'error';
}
export function isTaskCancelled(options) {
  return resolveGenerationUiState(options) === 'cancelled';
}
export function shouldShowGenerationBusyUi(target) {
  return isTaskRunning(target);
}
export function shouldShowGenerationResultLoadingUi(source, { hasResult: hasResult = false } = {}) {
  return hasResult !== true && shouldShowGenerationBusyUi(source);
}
export function shouldAllowCancel(
  next,
  { cancellable: cancellable = false, cancelInFlight: cancelInFlight = false } = {},
) {
  return cancellable === true && isTaskRunning(next) && cancelInFlight !== true;
}
export function resolveGenerationButtonMode(
  current,
  { cancellable: cancellable = false, cancelInFlight: cancelInFlight = false } = {},
) {
  const state = resolveGenerationUiState(current),
    busy = isTaskRunning(current),
    canCancel = shouldAllowCancel(current, { cancellable: cancellable, cancelInFlight: cancelInFlight });
  return {
    state: state,
    busy: busy,
    canCancel: canCancel,
    disabled: busy ? !canCancel || cancelInFlight === true : false,
    cursor: busy && (!canCancel || cancelInFlight === true) ? 'var(--unavailable-cursor)' : '',
  };
}
export function getTaskMessage(enabled4) {
  if (!enabled4 || typeof enabled4 !== 'object') return '';
  for (const entry of MESSAGE_FIELDS) {
    const record = String(enabled4[entry] || '').trim();
    if (record) return record;
  }
  return '';
}
export function isDreaminaTaskTerminal(payload) {
  const handle = [
    normalizeStatus(payload?.dreaminaTaskStatus),
    normalizeStatus(payload?.dreaminaTaskPhase),
  ].filter(Boolean);
  return (
    hasAnyStatus(handle, ERROR_STATUSES) ||
    hasAnyStatus(handle, CANCELLED_STATUSES) ||
    hasAnyStatus(handle, SUCCESS_STATUSES)
  );
}
