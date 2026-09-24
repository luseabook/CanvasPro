export const RUNNINGHUB_WORKFLOW_POLL_INTERVAL_MS = 0x7d0;
export const RUNNINGHUB_WORKFLOW_POLL_TIMEOUT_MS = 0x3c * 0x3c * 0x3e8;
export const RUNNINGHUB_WORKFLOW_POLL_MAX_COUNT = Math['ceil'](
  RUNNINGHUB_WORKFLOW_POLL_TIMEOUT_MS / RUNNINGHUB_WORKFLOW_POLL_INTERVAL_MS,
);
function normalizePositiveInteger(_0x2f900a, _0x2356f6) {
  const _0x29515f = Number(_0x2f900a);
  return Number['isFinite'](_0x29515f) && _0x29515f > 0x0 ? Math['trunc'](_0x29515f) : _0x2356f6;
}
export function resolveRunningHubWorkflowPollingPolicy(_0x59c631 = {}) {
  const _0x3bc492 = Number(_0x59c631?.['pollIntervalMs']),
    _0x15bd40 =
      _0x59c631?.['pollIntervalMs'] === undefined
        ? RUNNINGHUB_WORKFLOW_POLL_INTERVAL_MS
        : Math['max'](0x0, Number['isFinite'](_0x3bc492) ? Math['trunc'](_0x3bc492) : 0x0),
    _0x400fc9 = normalizePositiveInteger(_0x59c631?.['pollTimeoutMs'], RUNNINGHUB_WORKFLOW_POLL_TIMEOUT_MS),
    _0x48a38c = Math['ceil'](_0x400fc9 / Math['max'](_0x15bd40, RUNNINGHUB_WORKFLOW_POLL_INTERVAL_MS)),
    _0x484387 = normalizePositiveInteger(_0x59c631?.['maxPolls'], _0x48a38c);
  return { pollIntervalMs: _0x15bd40, pollTimeoutMs: _0x400fc9, maxPolls: _0x484387 };
}
export function hasRunningHubWorkflowPollingTimedOut(_0x402fa9, _0x154b4e, _0x251f4c = Date['now']()) {
  const _0xf4c6b8 = Number(_0x402fa9),
    _0x6a8398 = normalizePositiveInteger(_0x154b4e, RUNNINGHUB_WORKFLOW_POLL_TIMEOUT_MS),
    _0x2c335e = Number(_0x251f4c);
  if (!Number['isFinite'](_0xf4c6b8) || !Number['isFinite'](_0x2c335e)) return ![];
  return _0x2c335e - _0xf4c6b8 >= _0x6a8398;
}
