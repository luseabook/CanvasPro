export const RUNNINGHUB_WORKFLOW_POLL_INTERVAL_MS = 2000;
export const RUNNINGHUB_WORKFLOW_POLL_TIMEOUT_MS = 60 * 60 * 1000;
export const RUNNINGHUB_WORKFLOW_POLL_MAX_COUNT = Math['ceil'](
  RUNNINGHUB_WORKFLOW_POLL_TIMEOUT_MS / RUNNINGHUB_WORKFLOW_POLL_INTERVAL_MS,
);
function normalizePositiveInteger(value, fallback) {
  const numeric = Number(value);
  return Number['isFinite'](numeric) && numeric > 0 ? Math['trunc'](numeric) : fallback;
}
export function resolveRunningHubWorkflowPollingPolicy(options = {}) {
  const rawInterval = Number(options?.['pollIntervalMs']),
    pollIntervalMs =
      options?.['pollIntervalMs'] === undefined
        ? RUNNINGHUB_WORKFLOW_POLL_INTERVAL_MS
        : Math['max'](0, Number['isFinite'](rawInterval) ? Math['trunc'](rawInterval) : 0),
    pollTimeoutMs = normalizePositiveInteger(options?.['pollTimeoutMs'], RUNNINGHUB_WORKFLOW_POLL_TIMEOUT_MS),
    derivedMaxPolls = Math['ceil'](
      pollTimeoutMs / Math['max'](pollIntervalMs, RUNNINGHUB_WORKFLOW_POLL_INTERVAL_MS),
    ),
    maxPolls = normalizePositiveInteger(options?.['maxPolls'], derivedMaxPolls);
  return { pollIntervalMs: pollIntervalMs, pollTimeoutMs: pollTimeoutMs, maxPolls: maxPolls };
}
export function hasRunningHubWorkflowPollingTimedOut(startedAt, timeoutMs, nowMs = Date['now']()) {
  const started = Number(startedAt),
    timeout = normalizePositiveInteger(timeoutMs, RUNNINGHUB_WORKFLOW_POLL_TIMEOUT_MS),
    now = Number(nowMs);
  if (!Number['isFinite'](started) || !Number['isFinite'](now)) return ![];
  return now - started >= timeout;
}
