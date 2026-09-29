import { getWorkspaceProjectTaskPresentation } from '../workspaceProjectHome.js';
const ACTIVE_STATUSES = new Set(['queued', 'submitting', 'pending', 'running', 'recovering']),
  TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'cancelled', 'interrupted']),
  MAX_PERSISTED_TASKS = 0x3c;
function normalizeText(_0x5bc0f5) {
  return String(_0x5bc0f5 || '')['trim']();
}
function normalizeStatus(_0x1c2459, _0x47a518 = 'running') {
  const _0x351346 = normalizeText(_0x1c2459)['toLowerCase']();
  if (ACTIVE_STATUSES['has'](_0x351346) || TERMINAL_STATUSES['has'](_0x351346)) return _0x351346;
  return _0x47a518;
}
function normalizeScope(_0x2bd597 = {}) {
  const _0x43fba9 =
    _0x2bd597 && typeof _0x2bd597 === 'object' && !Array['isArray'](_0x2bd597) ? _0x2bd597 : {};
  return Object['fromEntries'](
    Object['entries'](_0x43fba9)
      ['map'](([_0x429a9a, _0x5c7b37]) => [normalizeText(_0x429a9a), normalizeText(_0x5c7b37)])
      ['filter'](([_0x5cbe3f, _0x4f3de8]) => _0x5cbe3f && _0x4f3de8),
  );
}
function getProject(_0x2a61fa = {}) {
  return _0x2a61fa?.['project'] &&
    typeof _0x2a61fa['project'] === 'object' &&
    !Array['isArray'](_0x2a61fa['project'])
    ? _0x2a61fa['project']
    : null;
}
function cloneSerializable(_0x164077) {
  if (!_0x164077 || typeof _0x164077 !== 'object') return null;
  try {
    return JSON['parse'](JSON['stringify'](_0x164077));
  } catch {
    return null;
  }
}
function normalizeBatch(_0x37250a) {
  const _0x47deff = cloneSerializable(_0x37250a);
  if (!_0x47deff || Array['isArray'](_0x47deff)) return null;
  const _0x1ef363 = normalizeText(_0x47deff['id']),
    _0x168b7d = normalizeText(_0x47deff['type']);
  if (!_0x1ef363 || !_0x168b7d) return null;
  const _0x30fb42 = Math['max'](0x0, Math['trunc'](Number(_0x47deff['total']) || 0x0)),
    _0x5d1c4a = Math['max'](
      0x0,
      Math['min'](
        _0x30fb42 || Number['MAX_SAFE_INTEGER'],
        Math['trunc'](Number(_0x47deff['completed']) || 0x0),
      ),
    );
  return {
    ..._0x47deff,
    id: _0x1ef363,
    type: _0x168b7d,
    total: _0x30fb42,
    completed: _0x5d1c4a,
    label: normalizeText(_0x47deff['label']),
  };
}
function countLogicalTasks(_0x421682 = []) {
  return new Set(
    _0x421682['map']((_0x10ee77) =>
      _0x10ee77['batch']?.['id'] ? 'batch:' + _0x10ee77['batch']['id'] : 'task:' + _0x10ee77['id'],
    ),
  )['size'];
}
function pruneTasks(_0x83221a = []) {
  const _0x171c9a = _0x83221a['filter']((_0x4d6d7f) => ACTIVE_STATUSES['has'](_0x4d6d7f['status'])),
    _0x1085fe = _0x83221a['filter']((_0x481f9c) => !ACTIVE_STATUSES['has'](_0x481f9c['status']))['sort'](
      (_0x5a2fed, _0x18bb21) => Number(_0x18bb21['updatedAt'] || 0x0) - Number(_0x5a2fed['updatedAt'] || 0x0),
    );
  return [..._0x171c9a, ..._0x1085fe['slice'](0x0, MAX_PERSISTED_TASKS)];
}
export function buildStoryBackgroundTaskId(_0x588e58, _0x27b0bc = {}) {
  const _0x46076d = normalizeText(_0x588e58) || 'task',
    _0x6ac151 = normalizeScope(_0x27b0bc),
    _0x7e456e = Object['keys'](_0x6ac151)
      ['sort']()
      ['map']((_0x61fcf4) => _0x61fcf4 + ':' + _0x6ac151[_0x61fcf4])
      ['join'](':');
  return _0x7e456e ? _0x46076d + ':' + _0x7e456e : _0x46076d;
}
export function normalizeStoryBackgroundTask(_0x345b88 = {}) {
  const _0x23f769 =
      _0x345b88 && typeof _0x345b88 === 'object' && !Array['isArray'](_0x345b88) ? _0x345b88 : {},
    _0x5bba9d = normalizeText(_0x23f769['type']) || 'task',
    _0x5e7fa9 = normalizeScope(_0x23f769['scope']),
    _0x467ed7 = normalizeText(_0x23f769['id']) || buildStoryBackgroundTaskId(_0x5bba9d, _0x5e7fa9),
    _0x190812 = normalizeStatus(_0x23f769['status']),
    _0x3adb1d = Math['max'](0x0, Number(_0x23f769['startedAt'] || 0x0)) || Date['now'](),
    _0x4c3665 = Math['max'](_0x3adb1d, Number(_0x23f769['updatedAt'] || 0x0) || _0x3adb1d),
    _0x346021 = TERMINAL_STATUSES['has'](_0x190812)
      ? Math['max'](_0x4c3665, Number(_0x23f769['finishedAt'] || 0x0) || _0x4c3665)
      : 0x0;
  return {
    id: _0x467ed7,
    type: _0x5bba9d,
    scope: _0x5e7fa9,
    label: normalizeText(_0x23f769['label']) || '生成任务',
    message: normalizeText(_0x23f769['message']),
    status: _0x190812,
    resumable: _0x23f769['resumable'] === !![],
    remoteTaskId: normalizeText(_0x23f769['remoteTaskId'] || _0x23f769['taskId']),
    modelId: normalizeText(_0x23f769['modelId']),
    provider: normalizeText(_0x23f769['provider']),
    providerProfileId: normalizeText(_0x23f769['providerProfileId']),
    executionId: normalizeText(_0x23f769['executionId']),
    resumePayload: cloneSerializable(_0x23f769['resumePayload']),
    batch: normalizeBatch(_0x23f769['batch']),
    error: normalizeText(_0x23f769['error']),
    startedAt: _0x3adb1d,
    updatedAt: _0x4c3665,
    finishedAt: _0x346021,
  };
}
export function getStoryBackgroundTasks(_0x567c54 = {}) {
  const _0x142a87 = getProject(_0x567c54);
  if (!_0x142a87 || !Array['isArray'](_0x142a87['backgroundTasks'])) return [];
  return _0x142a87['backgroundTasks']
    ['map']((_0x10453d) => normalizeStoryBackgroundTask(_0x10453d))
    ['filter']((_0x2b871c) => _0x2b871c['id']);
}
export function setStoryBackgroundTasks(_0x16d8de = {}, _0x493dec = []) {
  const _0x3cc26a = getProject(_0x16d8de);
  if (!_0x3cc26a) return [];
  const _0x416c55 = pruneTasks(
    (Array['isArray'](_0x493dec) ? _0x493dec : [])
      ['map']((_0x24b144) => normalizeStoryBackgroundTask(_0x24b144))
      ['filter']((_0x2daed8) => _0x2daed8['id']),
  );
  return ((_0x3cc26a['backgroundTasks'] = _0x416c55), _0x416c55);
}
export function startStoryBackgroundTask(_0xe67dc2 = {}, _0x59c7e6 = {}) {
  const _0x1046ef = Date['now'](),
    _0x377f7a = normalizeStoryBackgroundTask({
      ..._0x59c7e6,
      status: normalizeStatus(_0x59c7e6['status'], 'running'),
      startedAt: Number(_0x59c7e6['startedAt'] || 0x0) || _0x1046ef,
      updatedAt: _0x1046ef,
      finishedAt: 0x0,
      error: '',
    }),
    _0x28d75d = getStoryBackgroundTasks(_0xe67dc2)['filter'](
      (_0x2dd821) => _0x2dd821['id'] !== _0x377f7a['id'],
    );
  return (setStoryBackgroundTasks(_0xe67dc2, [_0x377f7a, ..._0x28d75d]), _0x377f7a);
}
export function updateStoryBackgroundTask(_0x49ac62 = {}, _0x206702 = '', _0x55a8f9 = {}) {
  const _0x1d26df = normalizeText(_0x206702);
  if (!_0x1d26df) return null;
  const _0x457570 = getStoryBackgroundTasks(_0x49ac62),
    _0x510e98 = _0x457570['findIndex']((_0x3716b8) => _0x3716b8['id'] === _0x1d26df);
  if (_0x510e98 < 0x0) return null;
  const _0x199dd1 = _0x457570[_0x510e98],
    _0x271446 = _0x55a8f9['status']
      ? normalizeStatus(_0x55a8f9['status'], _0x199dd1['status'])
      : _0x199dd1['status'],
    _0x407767 = Date['now'](),
    _0x22058c = TERMINAL_STATUSES['has'](_0x199dd1['status']) && ACTIVE_STATUSES['has'](_0x271446),
    _0x4233ab = normalizeStoryBackgroundTask({
      ..._0x199dd1,
      ...(_0x22058c ? { batch: null, error: '', startedAt: _0x407767, finishedAt: 0x0 } : {}),
      ..._0x55a8f9,
      id: _0x1d26df,
      status: _0x271446,
      startedAt: _0x22058c ? Number(_0x55a8f9['startedAt'] || 0x0) || _0x407767 : _0x199dd1['startedAt'],
      updatedAt: _0x407767,
      finishedAt: TERMINAL_STATUSES['has'](_0x271446)
        ? Number(_0x55a8f9['finishedAt'] || 0x0) || _0x407767
        : 0x0,
    });
  return ((_0x457570[_0x510e98] = _0x4233ab), setStoryBackgroundTasks(_0x49ac62, _0x457570), _0x4233ab);
}
export function updateStoryBackgroundTaskBatch(_0xc5e9c4 = {}, _0x578177 = '', _0x1a8da6 = {}) {
  const _0x3c5cbc = normalizeText(_0x578177),
    _0x93c61f = cloneSerializable(_0x1a8da6);
  if (!_0x3c5cbc || !_0x93c61f || Array['isArray'](_0x93c61f)) return 0x0;
  const _0x1360a3 = getStoryBackgroundTasks(_0xc5e9c4);
  let _0x52d26a = 0x0;
  const _0x40c825 = Date['now'](),
    _0xc9dc22 = _0x1360a3['map']((_0x420606) => {
      if (!ACTIVE_STATUSES['has'](_0x420606['status']) || _0x420606['batch']?.['id'] !== _0x3c5cbc)
        return _0x420606;
      return (
        (_0x52d26a += 0x1),
        normalizeStoryBackgroundTask({
          ..._0x420606,
          batch: { ..._0x420606['batch'], ..._0x93c61f, id: _0x3c5cbc },
          updatedAt: _0x40c825,
        })
      );
    });
  if (_0x52d26a) setStoryBackgroundTasks(_0xc5e9c4, _0xc9dc22);
  return _0x52d26a;
}
export function finishStoryBackgroundTask(
  _0x25d437 = {},
  _0x26f98e = '',
  { status: status = 'succeeded', message: message = '', error: error = '', ..._0x37aed9 } = {},
) {
  const _0x5c8ccc = TERMINAL_STATUSES['has'](normalizeText(status)['toLowerCase']())
    ? normalizeText(status)['toLowerCase']()
    : 'succeeded';
  return updateStoryBackgroundTask(_0x25d437, _0x26f98e, {
    ..._0x37aed9,
    status: _0x5c8ccc,
    message: message,
    error: error,
    finishedAt: Date['now'](),
  });
}
export function interruptStoryBackgroundTasks(
  _0x48ccec = {},
  {
    includeResumable: includeResumable = ![],
    message: message = '应用已关闭或项目上下文已切换，请重新发起任务。',
  } = {},
) {
  const _0xfb6227 = getStoryBackgroundTasks(_0x48ccec);
  let _0x59a8c5 = 0x0;
  const _0x17cade = _0xfb6227['map']((_0x3bb777) => {
    if (!ACTIVE_STATUSES['has'](_0x3bb777['status'])) return _0x3bb777;
    if (!includeResumable && _0x3bb777['resumable'] && _0x3bb777['remoteTaskId']) return _0x3bb777;
    return (
      (_0x59a8c5 += 0x1),
      normalizeStoryBackgroundTask({
        ..._0x3bb777,
        status: 'interrupted',
        message: message,
        error: message,
        updatedAt: Date['now'](),
        finishedAt: Date['now'](),
      })
    );
  });
  if (_0x59a8c5) setStoryBackgroundTasks(_0x48ccec, _0x17cade);
  return _0x59a8c5;
}
export function getStoryBackgroundTaskSummary(_0x31594b = {}) {
  const _0x46e5f8 = getStoryBackgroundTasks(_0x31594b),
    _0x388652 = _0x46e5f8['filter']((_0x48d903) => ACTIVE_STATUSES['has'](_0x48d903['status'])),
    _0x50fece = _0x46e5f8['filter'](
      (_0x5688ae) => _0x5688ae['status'] === 'failed' || _0x5688ae['status'] === 'interrupted',
    ),
    _0xd5fcdf = countLogicalTasks(_0x388652),
    _0x36a497 = countLogicalTasks(_0x50fece);
  return {
    ...getWorkspaceProjectTaskPresentation({ activeCount: _0xd5fcdf, failedCount: _0x36a497 }),
    activeTasks: _0x388652,
    failedTasks: _0x50fece,
  };
}
export function isStoryBackgroundTaskActive(_0x781e6c = {}) {
  return ACTIVE_STATUSES['has'](normalizeStatus(_0x781e6c['status']));
}
