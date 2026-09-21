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
function normalizeStatus(_0x323e1b) {
  return String(_0x323e1b || '')
    .trim()
    .toLowerCase();
}
function isNonIdleStatus(_0x366c48) {
  return !IDLE_STATUSES.has(normalizeStatus(_0x366c48));
}
function hasActiveTaskFamily(_0x553657) {
  if (!_0x553657 || typeof _0x553657 !== 'object') return false;
  return (
    _0x553657.rhTaskRecovering === true ||
    _0x553657.dreaminaTaskRecovering === true ||
    _0x553657.asyncTaskRecovering === true ||
    !!String(_0x553657.rhTaskId || '').trim() ||
    !!String(_0x553657.dreaminaSubmitId || '').trim() ||
    !!String(_0x553657.asyncTaskId || '').trim() ||
    isNonIdleStatus(_0x553657.rhTaskStatus) ||
    isNonIdleStatus(_0x553657.dreaminaTaskStatus) ||
    isNonIdleStatus(_0x553657.asyncTaskStatus)
  );
}
function collectStatuses(_0x1c86a9) {
  if (!_0x1c86a9 || typeof _0x1c86a9 !== 'object') return [];
  if (hasActiveTaskFamily(_0x1c86a9)) {
    const _0x89983 = [_0x1c86a9.jobStatus];
    return (
      (_0x1c86a9.rhTaskRecovering === true ||
        !!String(_0x1c86a9.rhTaskId || '').trim() ||
        isNonIdleStatus(_0x1c86a9.rhTaskStatus)) &&
        _0x89983.push(_0x1c86a9.rhTaskStatus),
      (_0x1c86a9.dreaminaTaskRecovering === true ||
        !!String(_0x1c86a9.dreaminaSubmitId || '').trim() ||
        isNonIdleStatus(_0x1c86a9.dreaminaTaskStatus)) &&
        _0x89983.push(_0x1c86a9.dreaminaTaskStatus, _0x1c86a9.dreaminaTaskPhase),
      (_0x1c86a9.asyncTaskRecovering === true ||
        !!String(_0x1c86a9.asyncTaskId || '').trim() ||
        isNonIdleStatus(_0x1c86a9.asyncTaskStatus)) &&
        _0x89983.push(_0x1c86a9.asyncTaskStatus),
      _0x89983.map(normalizeStatus).filter(Boolean)
    );
  }
  return STATUS_FIELDS.map((_0x4a8f30) => normalizeStatus(_0x1c86a9[_0x4a8f30])).filter(Boolean);
}
function hasAnyStatus(_0xa4a3b4, _0x4d5355) {
  return _0xa4a3b4.some((_0x2daa4d) => _0x4d5355.has(_0x2daa4d));
}
function hasRecoveringFlag(_0x29b1d6) {
  if (!_0x29b1d6 || typeof _0x29b1d6 !== 'object') return false;
  return RECOVERING_FIELDS.some((_0x2d9191) => _0x29b1d6[_0x2d9191] === true);
}
export function resolveGenerationUiState(_0x59c44d) {
  const _0x19446e = collectStatuses(_0x59c44d);
  if (hasAnyStatus(_0x19446e, ERROR_STATUSES)) return 'error';
  if (hasAnyStatus(_0x19446e, CANCELLED_STATUSES)) return 'cancelled';
  if (hasAnyStatus(_0x19446e, SUCCESS_STATUSES)) return 'success';
  if (hasRecoveringFlag(_0x59c44d)) return 'recovering';
  if (hasAnyStatus(_0x19446e, RUNNING_STATUSES)) return 'running';
  if (hasAnyStatus(_0x19446e, QUEUED_STATUSES)) return 'queued';
  if (hasAnyStatus(_0x19446e, SUBMITTING_STATUSES)) return 'submitting';
  if (_0x59c44d?.isGenerating === true) return 'running';
  return 'idle';
}
export function isTaskRunning(_0x41e2f0) {
  return ['submitting', 'queued', 'running', 'recovering'].includes(resolveGenerationUiState(_0x41e2f0));
}
export function isTaskTerminal(_0x597c02) {
  return ['success', 'error', 'cancelled'].includes(resolveGenerationUiState(_0x597c02));
}
export function isTaskFailed(_0x4459cd) {
  return resolveGenerationUiState(_0x4459cd) === 'error';
}
export function isTaskCancelled(_0x516e3b) {
  return resolveGenerationUiState(_0x516e3b) === 'cancelled';
}
export function shouldShowGenerationBusyUi(_0x2e5e5f) {
  return isTaskRunning(_0x2e5e5f);
}
export function shouldShowGenerationResultLoadingUi(_0x1d14dc, { hasResult: hasResult = false } = {}) {
  return hasResult !== true && shouldShowGenerationBusyUi(_0x1d14dc);
}
export function shouldAllowCancel(
  _0x38b886,
  { cancellable: cancellable = false, cancelInFlight: cancelInFlight = false } = {},
) {
  return cancellable === true && isTaskRunning(_0x38b886) && cancelInFlight !== true;
}
export function resolveGenerationButtonMode(
  _0xa12ef2,
  { cancellable: cancellable = false, cancelInFlight: cancelInFlight = false } = {},
) {
  const _0x216f88 = resolveGenerationUiState(_0xa12ef2),
    _0xd344e7 = isTaskRunning(_0xa12ef2),
    _0x270e21 = shouldAllowCancel(_0xa12ef2, { cancellable: cancellable, cancelInFlight: cancelInFlight });
  return {
    state: _0x216f88,
    busy: _0xd344e7,
    canCancel: _0x270e21,
    disabled: _0xd344e7 ? !_0x270e21 || cancelInFlight === true : false,
    cursor: _0xd344e7 && (!_0x270e21 || cancelInFlight === true) ? 'var(--unavailable-cursor)' : '',
  };
}
export function getTaskMessage(_0x2c40f2) {
  if (!_0x2c40f2 || typeof _0x2c40f2 !== 'object') return '';
  for (const _0x470bfa of MESSAGE_FIELDS) {
    const _0x112e49 = String(_0x2c40f2[_0x470bfa] || '').trim();
    if (_0x112e49) return _0x112e49;
  }
  return '';
}
export function isDreaminaTaskTerminal(_0x2c53c0) {
  const _0x32db93 = [
    normalizeStatus(_0x2c53c0?.dreaminaTaskStatus),
    normalizeStatus(_0x2c53c0?.dreaminaTaskPhase),
  ].filter(Boolean);
  return (
    hasAnyStatus(_0x32db93, ERROR_STATUSES) ||
    hasAnyStatus(_0x32db93, CANCELLED_STATUSES) ||
    hasAnyStatus(_0x32db93, SUCCESS_STATUSES)
  );
}
