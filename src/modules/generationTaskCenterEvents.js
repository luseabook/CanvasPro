import { ACTIVE_TASK_STATUSES, pruneTaskCenterRecords } from './taskCenterModel.js';
export const GENERATION_TASK_CENTER_EVENT = 'aicanvas:generation-task-center:update';
const snapshots = new WeakMap();

export function listGenerationTaskCenterUpdates(value = globalThis['window']) {
  return value ? [...(snapshots['get'](value)?.['values']() || [])] : [];
}

export function publishTaskCenterSnapshot(item, list, key = globalThis['window']) {
  const map = new Set(list['map']((index) => index['taskId']));
  for (const response of listGenerationTaskCenterUpdates(key)) {
    if (response['source'] !== item['source'] || response['projectId'] !== item['projectId']) continue;
    if (map['has'](response['taskId']) || !ACTIVE_TASK_STATUSES['has'](response['status'])) continue;
    emitGenerationTaskCenterUpdate(
      { ...response, status: 'untracked', cancellable: ![], message: '', finishedAt: Date['now']() },
      key,
    );
  }
  list['forEach']((result) => emitGenerationTaskCenterUpdate(result, key));
}

export function emitGenerationTaskCenterUpdate(detail = {}, enabled = globalThis['window']) {
  if (!detail || typeof detail !== 'object' || !enabled) return ![];
  if (typeof enabled['dispatchEvent'] !== 'function') return ![];
  const enabled2 = String(detail['taskId'] || '');
  if (!enabled2) return ![];
  const map2 = snapshots['get'](enabled) || new Map(),
    data = map2['get'](enabled2);
  if (data && JSON['stringify'](data) === JSON['stringify'](detail)) return ![];
  (map2['set'](enabled2, detail),
    snapshots['set'](
      enabled,
      new Map(
        pruneTaskCenterRecords([...map2['values']()])['map']((options) => [options['taskId'], options]),
      ),
    ));
  const run =
      typeof globalThis['CustomEvent'] === 'function'
        ? globalThis['CustomEvent']
        : typeof enabled['CustomEvent'] === 'function'
          ? enabled['CustomEvent']
          : null,
    target = run
      ? new run(GENERATION_TASK_CENTER_EVENT, { detail: detail })
      : { type: GENERATION_TASK_CENTER_EVENT, detail: detail };
  return (enabled['dispatchEvent'](target), !![]);
}
