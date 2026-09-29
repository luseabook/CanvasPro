import { resolveJobStatusFromTaskStatus } from '../src/core/generationTaskLifecycle.js';
const RUNNINGHUB_PENDING_STATUSES = new Set([
  'running',
  'pending',
  'queued',
  'processing',
  'submitted',
  'waiting',
]);
function collectRunningHubTaskStatuses(_0x1ff926, _0x139537, _0x63c4fe) {
  if (!_0x1ff926 || typeof _0x1ff926 !== 'object' || _0x63c4fe['has'](_0x1ff926)) return;
  _0x63c4fe['add'](_0x1ff926);
  if (Array['isArray'](_0x1ff926)) {
    _0x1ff926['forEach']((_0x566858) => collectRunningHubTaskStatuses(_0x566858, _0x139537, _0x63c4fe));
    return;
  }
  ([_0x1ff926['status'], _0x1ff926['taskStatus'], _0x1ff926['task_status']]
    ['map']((_0x1e0d43) => String(_0x1e0d43 || '')['trim']())
    ['filter'](Boolean)
    ['forEach']((_0x5df554) => _0x139537['push'](_0x5df554)),
    [
      _0x1ff926['data'],
      _0x1ff926['result'],
      _0x1ff926['results'],
      _0x1ff926['output'],
      _0x1ff926['response'],
    ]['forEach']((_0x3d680c) => collectRunningHubTaskStatuses(_0x3d680c, _0x139537, _0x63c4fe)));
}
export function resolveRunningHubTaskLifecycleStatus(_0x470e08) {
  const _0xf8696a = [];
  collectRunningHubTaskStatuses(_0x470e08, _0xf8696a, new Set());
  const _0x20d1e1 = _0xf8696a['map']((_0x5f8d76) => resolveJobStatusFromTaskStatus(_0x5f8d76, null))[
    'filter'
  ](Boolean);
  if (_0x20d1e1['includes']('cancelled')) return 'cancelled';
  if (_0x20d1e1['includes']('error')) return 'error';
  if (_0x20d1e1['includes']('success')) return 'success';
  if (
    _0xf8696a['some']((_0x38318d) =>
      RUNNINGHUB_PENDING_STATUSES['has'](String(_0x38318d)['trim']()['toLowerCase']()),
    )
  )
    return 'running';
  return '';
}
