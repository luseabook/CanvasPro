export const ACTIVE_TASK_STATUSES = new Set(['waiting', 'processing']);
export const TERMINAL_TASK_STATUSES = new Set(['complete', 'failed', 'cancelled', 'untracked']);
export function normalizeTaskCenterStatus(_0x3ed53e) {
  const _0x5bd098 = String(_0x3ed53e || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x5bd098 === 'untracked') return _0x5bd098;
  if (['waiting', 'queued', 'paused']['includes'](_0x5bd098)) return 'waiting';
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
    ]['includes'](_0x5bd098)
  )
    return 'processing';
  if (['complete', 'completed', 'success', 'succeeded']['includes'](_0x5bd098)) return 'complete';
  if (['failed', 'error', 'interrupted']['includes'](_0x5bd098)) return 'failed';
  if (['cancelled', 'canceled']['includes'](_0x5bd098)) return 'cancelled';
  return '';
}
export function pruneTaskCenterRecords(_0x302f0b, _0x9b39bb = 0x78) {
  const _0x47e8f2 = _0x302f0b['filter']((_0x136a31) => ACTIVE_TASK_STATUSES['has'](_0x136a31['status'])),
    _0xe1ca81 = _0x302f0b['filter']((_0x333b1e) => !ACTIVE_TASK_STATUSES['has'](_0x333b1e['status']))['sort'](
      (_0x22ed13, _0x5b9afb) =>
        Number(_0x5b9afb['finishedAt'] || _0x5b9afb['createdAt'] || 0x0) -
        Number(_0x22ed13['finishedAt'] || _0x22ed13['createdAt'] || 0x0),
    );
  return [..._0x47e8f2, ..._0xe1ca81['slice'](0x0, _0x9b39bb)];
}
