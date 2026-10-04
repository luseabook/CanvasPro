import { getWorkspaceProjectTaskPresentation } from '../workspaceProjectHome.js';
const ACTIVE_STATUSES = new Set(['queued', 'submitting', 'pending', 'running', 'recovering']),
  TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'cancelled', 'interrupted']),
  MAX_PERSISTED_TASKS = 0x3c;
function normalizeText(value) {
  return String(value || '')['trim']();
}
function normalizeStatus(item, key = 'running') {
  const text = normalizeText(item)['toLowerCase']();
  if (ACTIVE_STATUSES['has'](text) || TERMINAL_STATUSES['has'](text)) return text;
  return key;
}
function normalizeScope(options = {}) {
  const index = options && typeof options === 'object' && !Array['isArray'](options) ? options : {};
  return Object['fromEntries'](
    Object['entries'](index)
      ['map'](([result, data]) => [normalizeText(result), normalizeText(data)])
      ['filter'](([target, source]) => target && source),
  );
}
function getProject(options2 = {}) {
  return options2?.['project'] &&
    typeof options2['project'] === 'object' &&
    !Array['isArray'](options2['project'])
    ? options2['project']
    : null;
}
function cloneSerializable(enabled) {
  if (!enabled || typeof enabled !== 'object') return null;
  try {
    return JSON['parse'](JSON['stringify'](enabled));
  } catch {
    return null;
  }
}
function normalizeBatch(next) {
  const args = cloneSerializable(next);
  if (!args || Array['isArray'](args)) return null;
  const id = normalizeText(args['id']),
    type = normalizeText(args['type']);
  if (!id || !type) return null;
  const total = Math['max'](0x0, Math['trunc'](Number(args['total']) || 0x0)),
    completed = Math['max'](
      0x0,
      Math['min'](total || Number['MAX_SAFE_INTEGER'], Math['trunc'](Number(args['completed']) || 0x0)),
    );
  return {
    ...args,
    id: id,
    type: type,
    total: total,
    completed: completed,
    label: normalizeText(args['label']),
  };
}
function countLogicalTasks(list = []) {
  return new Set(
    list['map']((current) =>
      current['batch']?.['id'] ? 'batch:' + current['batch']['id'] : 'task:' + current['id'],
    ),
  )['size'];
}
function pruneTasks(list2 = []) {
  const args2 = list2['filter']((response) => ACTIVE_STATUSES['has'](response['status'])),
    list3 = list2['filter']((response2) => !ACTIVE_STATUSES['has'](response2['status']))['sort'](
      (entry, record) => Number(record['updatedAt'] || 0x0) - Number(entry['updatedAt'] || 0x0),
    );
  return [...args2, ...list3['slice'](0x0, MAX_PERSISTED_TASKS)];
}
export function buildStoryBackgroundTaskId(payload, handle = {}) {
  const text2 = normalizeText(payload) || 'task',
    scope = normalizeScope(handle),
    state = Object['keys'](scope)
      ['sort']()
      ['map']((config) => config + ':' + scope[config])
      ['join'](':');
  return state ? text2 + ':' + state : text2;
}
export function normalizeStoryBackgroundTask(options3 = {}) {
  const resumable = options3 && typeof options3 === 'object' && !Array['isArray'](options3) ? options3 : {},
    type2 = normalizeText(resumable['type']) || 'task',
    scope2 = normalizeScope(resumable['scope']),
    id2 = normalizeText(resumable['id']) || buildStoryBackgroundTaskId(type2, scope2),
    status2 = normalizeStatus(resumable['status']),
    startedAt = Math['max'](0x0, Number(resumable['startedAt'] || 0x0)) || Date['now'](),
    updatedAt = Math['max'](startedAt, Number(resumable['updatedAt'] || 0x0) || startedAt),
    finishedAt = TERMINAL_STATUSES['has'](status2)
      ? Math['max'](updatedAt, Number(resumable['finishedAt'] || 0x0) || updatedAt)
      : 0x0;
  return {
    id: id2,
    type: type2,
    scope: scope2,
    label: normalizeText(resumable['label']) || '生成任务',
    message: normalizeText(resumable['message']),
    status: status2,
    resumable: resumable['resumable'] === !![],
    remoteTaskId: normalizeText(resumable['remoteTaskId'] || resumable['taskId']),
    modelId: normalizeText(resumable['modelId']),
    provider: normalizeText(resumable['provider']),
    providerProfileId: normalizeText(resumable['providerProfileId']),
    executionId: normalizeText(resumable['executionId']),
    resumePayload: cloneSerializable(resumable['resumePayload']),
    batch: normalizeBatch(resumable['batch']),
    error: normalizeText(resumable['error']),
    startedAt: startedAt,
    updatedAt: updatedAt,
    finishedAt: finishedAt,
  };
}
export function getStoryBackgroundTasks(options4 = {}) {
  const project = getProject(options4);
  if (!project || !Array['isArray'](project['backgroundTasks'])) return [];
  return project['backgroundTasks']
    ['map']((input) => normalizeStoryBackgroundTask(input))
    ['filter']((output) => output['id']);
}
export function setStoryBackgroundTasks(options5 = {}, value2 = []) {
  const project2 = getProject(options5);
  if (!project2) return [];
  const pruneTasks2 = pruneTasks(
    (Array['isArray'](value2) ? value2 : [])
      ['map']((value3) => normalizeStoryBackgroundTask(value3))
      ['filter']((value4) => value4['id']),
  );
  return ((project2['backgroundTasks'] = pruneTasks2), pruneTasks2);
}
export function startStoryBackgroundTask(options6 = {}, response3 = {}) {
  const updatedAt2 = Date['now'](),
    storyBackgroundTask = normalizeStoryBackgroundTask({
      ...response3,
      status: normalizeStatus(response3['status'], 'running'),
      startedAt: Number(response3['startedAt'] || 0x0) || updatedAt2,
      updatedAt: updatedAt2,
      finishedAt: 0x0,
      error: '',
    }),
    args3 = getStoryBackgroundTasks(options6)['filter'](
      (value5) => value5['id'] !== storyBackgroundTask['id'],
    );
  return (setStoryBackgroundTasks(options6, [storyBackgroundTask, ...args3]), storyBackgroundTask);
}
export function updateStoryBackgroundTask(options7 = {}, value6 = '', response4 = {}) {
  const id3 = normalizeText(value6);
  if (!id3) return null;
  const list4 = getStoryBackgroundTasks(options7),
    count = list4['findIndex']((value7) => value7['id'] === id3);
  if (count < 0x0) return null;
  const response5 = list4[count],
    status3 = response4['status']
      ? normalizeStatus(response4['status'], response5['status'])
      : response5['status'],
    startedAt2 = Date['now'](),
    startedAt3 = TERMINAL_STATUSES['has'](response5['status']) && ACTIVE_STATUSES['has'](status3),
    storyBackgroundTask2 = normalizeStoryBackgroundTask({
      ...response5,
      ...(startedAt3 ? { batch: null, error: '', startedAt: startedAt2, finishedAt: 0x0 } : {}),
      ...response4,
      id: id3,
      status: status3,
      startedAt: startedAt3 ? Number(response4['startedAt'] || 0x0) || startedAt2 : response5['startedAt'],
      updatedAt: startedAt2,
      finishedAt: TERMINAL_STATUSES['has'](status3)
        ? Number(response4['finishedAt'] || 0x0) || startedAt2
        : 0x0,
    });
  return (
    (list4[count] = storyBackgroundTask2),
    setStoryBackgroundTasks(options7, list4),
    storyBackgroundTask2
  );
}
export function updateStoryBackgroundTaskBatch(options8 = {}, value8 = '', value9 = {}) {
  const id4 = normalizeText(value8),
    args4 = cloneSerializable(value9);
  if (!id4 || !args4 || Array['isArray'](args4)) return 0x0;
  const list5 = getStoryBackgroundTasks(options8);
  let value10 = 0x0;
  const updatedAt3 = Date['now'](),
    value11 = list5['map']((response6) => {
      if (!ACTIVE_STATUSES['has'](response6['status']) || response6['batch']?.['id'] !== id4)
        return response6;
      return (
        (value10 += 0x1),
        normalizeStoryBackgroundTask({
          ...response6,
          batch: { ...response6['batch'], ...args4, id: id4 },
          updatedAt: updatedAt3,
        })
      );
    });
  if (value10) setStoryBackgroundTasks(options8, value11);
  return value10;
}
export function finishStoryBackgroundTask(
  options9 = {},
  value12 = '',
  { status: status = 'succeeded', message: message = '', error: error = '', ...args5 } = {},
) {
  const status4 = TERMINAL_STATUSES['has'](normalizeText(status)['toLowerCase']())
    ? normalizeText(status)['toLowerCase']()
    : 'succeeded';
  return updateStoryBackgroundTask(options9, value12, {
    ...args5,
    status: status4,
    message: message,
    error: error,
    finishedAt: Date['now'](),
  });
}
export function interruptStoryBackgroundTasks(
  options10 = {},
  {
    includeResumable: includeResumable = ![],
    message: message = '应用已关闭或项目上下文已切换，请重新发起任务。',
  } = {},
) {
  const list6 = getStoryBackgroundTasks(options10);
  let value13 = 0x0;
  const value14 = list6['map']((response7) => {
    if (!ACTIVE_STATUSES['has'](response7['status'])) return response7;
    if (!includeResumable && response7['resumable'] && response7['remoteTaskId']) return response7;
    return (
      (value13 += 0x1),
      normalizeStoryBackgroundTask({
        ...response7,
        status: 'interrupted',
        message: message,
        error: message,
        updatedAt: Date['now'](),
        finishedAt: Date['now'](),
      })
    );
  });
  if (value13) setStoryBackgroundTasks(options10, value14);
  return value13;
}
export function getStoryBackgroundTaskSummary(options11 = {}) {
  const list7 = getStoryBackgroundTasks(options11),
    activeTasks = list7['filter']((response8) => ACTIVE_STATUSES['has'](response8['status'])),
    failedTasks = list7['filter'](
      (response9) => response9['status'] === 'failed' || response9['status'] === 'interrupted',
    ),
    activeCount = countLogicalTasks(activeTasks),
    failedCount = countLogicalTasks(failedTasks);
  return {
    ...getWorkspaceProjectTaskPresentation({ activeCount: activeCount, failedCount: failedCount }),
    activeTasks: activeTasks,
    failedTasks: failedTasks,
  };
}
export function isStoryBackgroundTaskActive(response10 = {}) {
  return ACTIVE_STATUSES['has'](normalizeStatus(response10['status']));
}
