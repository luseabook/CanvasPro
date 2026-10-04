export const ACTIVE_TASK_STATUSES = new Set(['waiting', 'processing']);
export const TERMINAL_TASK_STATUSES = new Set(['complete', 'failed', 'cancelled', 'untracked']);
export function normalizeTaskCenterStatus(value) {
  const item = String(value || '')
    ['trim']()
    ['toLowerCase']();
  if (item === 'untracked') return item;
  if (['waiting', 'queued', 'paused']['includes'](item)) return 'waiting';
  if (
    [
      'processing',
      'running',
      'submitting',
      'pending',
      'recovering',
      'uploading',
      'cutting',
      'extracting-keyframes',
      'detecting',
      'identifying',
    ]['includes'](item)
  )
    return 'processing';
  if (['complete', 'completed', 'success', 'succeeded']['includes'](item)) return 'complete';
  if (['failed', 'error', 'interrupted']['includes'](item)) return 'failed';
  if (['cancelled', 'canceled']['includes'](item)) return 'cancelled';
  return '';
}
export function pruneTaskCenterRecords(list, key = 0x78) {
  const args = list['filter']((response) => ACTIVE_TASK_STATUSES['has'](response['status'])),
    list2 = list['filter']((response2) => !ACTIVE_TASK_STATUSES['has'](response2['status']))['sort'](
      (index, result) =>
        Number(result['finishedAt'] || result['createdAt'] || 0x0) -
        Number(index['finishedAt'] || index['createdAt'] || 0x0),
    );
  return [...args, ...list2['slice'](0x0, key)];
}
