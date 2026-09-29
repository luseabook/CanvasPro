import { ACTIVE_TASK_STATUSES, pruneTaskCenterRecords } from './taskCenterModel.js';
export const GENERATION_TASK_CENTER_EVENT = 'aicanvas:generation-task-center:update';
const snapshots = new WeakMap();

export function listGenerationTaskCenterUpdates(_0x4c4715 = globalThis['window']) {
  return _0x4c4715 ? [...(snapshots['get'](_0x4c4715)?.['values']() || [])] : [];
}

export function publishTaskCenterSnapshot(_0x3340c7, _0x3c4873, _0x187ed5 = globalThis['window']) {
  const _0x28f41b = new Set(_0x3c4873['map']((_0x2835e0) => _0x2835e0['taskId']));
  for (const _0xc165c6 of listGenerationTaskCenterUpdates(_0x187ed5)) {
    if (_0xc165c6['source'] !== _0x3340c7['source'] || _0xc165c6['projectId'] !== _0x3340c7['projectId'])
      continue;
    if (_0x28f41b['has'](_0xc165c6['taskId']) || !ACTIVE_TASK_STATUSES['has'](_0xc165c6['status'])) continue;
    emitGenerationTaskCenterUpdate(
      { ..._0xc165c6, status: 'untracked', cancellable: ![], message: '', finishedAt: Date['now']() },
      _0x187ed5,
    );
  }
  _0x3c4873['forEach']((_0x4fdd85) => emitGenerationTaskCenterUpdate(_0x4fdd85, _0x187ed5));
}

export function emitGenerationTaskCenterUpdate(_0x202ec1 = {}, _0x2e5ecc = globalThis['window']) {
  if (!_0x202ec1 || typeof _0x202ec1 !== 'object' || !_0x2e5ecc) return ![];
  if (typeof _0x2e5ecc['dispatchEvent'] !== 'function') return ![];
  const _0xe88b36 = String(_0x202ec1['taskId'] || '');
  if (!_0xe88b36) return ![];
  const _0x494208 = snapshots['get'](_0x2e5ecc) || new Map(),
    _0x5a1908 = _0x494208['get'](_0xe88b36);
  if (_0x5a1908 && JSON['stringify'](_0x5a1908) === JSON['stringify'](_0x202ec1)) return ![];
  (_0x494208['set'](_0xe88b36, _0x202ec1),
    snapshots['set'](
      _0x2e5ecc,
      new Map(
        pruneTaskCenterRecords([..._0x494208['values']()])['map']((_0x2c202b) => [
          _0x2c202b['taskId'],
          _0x2c202b,
        ]),
      ),
    ));
  const _0x44cb58 =
      typeof globalThis['CustomEvent'] === 'function'
        ? globalThis['CustomEvent']
        : typeof _0x2e5ecc['CustomEvent'] === 'function'
          ? _0x2e5ecc['CustomEvent']
          : null,
    _0x54c21f = _0x44cb58
      ? new _0x44cb58(GENERATION_TASK_CENTER_EVENT, { detail: _0x202ec1 })
      : { type: GENERATION_TASK_CENTER_EVENT, detail: _0x202ec1 };
  return (_0x2e5ecc['dispatchEvent'](_0x54c21f), !![]);
}
