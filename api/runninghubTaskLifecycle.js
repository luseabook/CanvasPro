import { resolveJobStatusFromTaskStatus } from '../src/core/generationTaskLifecycle.js';
const RUNNINGHUB_PENDING_STATUSES = new Set([
  'running',
  'pending',
  'queued',
  'processing',
  'submitted',
  'waiting',
]);
function collectRunningHubTaskStatuses(list, list2, map) {
  if (!list || typeof list !== 'object' || map.has(list)) return;
  map.add(list);
  if (Array.isArray(list)) {
    list.forEach((value) => collectRunningHubTaskStatuses(value, list2, map));
    return;
  }
  ([list.status, list.taskStatus, list.task_status]
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .forEach((key) => list2.push(key)),
    [list.data, list.result, list.results, list.output, list.response].forEach((index) =>
      collectRunningHubTaskStatuses(index, list2, map),
    ));
}
export function resolveRunningHubTaskLifecycleStatus(result) {
  const list3 = [];
  collectRunningHubTaskStatuses(result, list3, new Set());
  const list4 = list3.map((data) => resolveJobStatusFromTaskStatus(data, null)).filter(Boolean);
  if (list4.includes('cancelled')) return 'cancelled';
  if (list4.includes('error')) return 'error';
  if (list4.includes('success')) return 'success';
  if (
    list3.some((options) => RUNNINGHUB_PENDING_STATUSES.has(String(options).trim().toLowerCase()))
  )
    return 'running';
  return '';
}
