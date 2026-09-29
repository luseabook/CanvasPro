import nodeRuntimeRegistry from '../../core/nodeRuntimeRegistry.js';
import { createCanvasCommandError } from './commandRegistry.js';
const TASK_ID_KEYS = new Set([
  'taskId',
  'task_id',
  'rhTaskId',
  'asyncTaskId',
  'dreaminaSubmitId',
  'submitId',
]);
function getState(_0x180ebc) {
  return _0x180ebc['store']?.['getStateRaw']?.() || _0x180ebc['store']?.['getState']?.() || {};
}
function getNode(_0x2ed79d, _0x22759a) {
  const _0x489745 = String(_0x22759a || '')['trim']();
  return _0x489745 ? getState(_0x2ed79d)['nodes']?.[_0x489745] || null : null;
}
function getNodeRuntime(_0x4963d5, _0x54326b) {
  const _0x3780db = _0x4963d5['nodeRuntimeRegistry'] || nodeRuntimeRegistry;
  return typeof _0x3780db?.['resolve'] === 'function'
    ? _0x3780db['resolve'](_0x54326b, { store: _0x4963d5['store'] })
    : _0x3780db?.['get']?.(_0x54326b) || null;
}
function trimString(_0x241572) {
  return typeof _0x241572 === 'string' ? _0x241572['trim']() : '';
}
function positiveNumber(_0x1dec10, _0x32d82e) {
  const _0x17bb82 = Number(_0x1dec10);
  return Number['isFinite'](_0x17bb82) && _0x17bb82 >= 0x0 ? _0x17bb82 : _0x32d82e;
}
function collectTaskIds(_0x5e5441, _0x82ecc2, _0x38e449 = 0x0) {
  if (!_0x5e5441 || typeof _0x5e5441 !== 'object' || _0x38e449 > 0x4) return;
  if (Array['isArray'](_0x5e5441)) {
    for (const _0x376d92 of _0x5e5441) collectTaskIds(_0x376d92, _0x82ecc2, _0x38e449 + 0x1);
    return;
  }
  for (const [_0x6380a2, _0x2b5753] of Object['entries'](_0x5e5441)) {
    if (TASK_ID_KEYS['has'](_0x6380a2)) {
      const _0x5e4f02 = trimString(_0x2b5753);
      if (_0x5e4f02) _0x82ecc2['add'](_0x5e4f02);
    }
    if (_0x2b5753 && typeof _0x2b5753 === 'object') collectTaskIds(_0x2b5753, _0x82ecc2, _0x38e449 + 0x1);
  }
}
function nodeHasTaskId(_0x180bbd = {}, _0x1b9e26 = '') {
  const _0x5c6371 = trimString(_0x1b9e26);
  if (!_0x5c6371) return ![];
  const _0x1a58ee = new Set();
  return (collectTaskIds(_0x180bbd, _0x1a58ee), _0x1a58ee['has'](_0x5c6371));
}
function getSelectedNodeIds(_0xb8a823) {
  const _0x17cfb3 = getState(_0xb8a823)['selectedNodeIds'];
  return Array['isArray'](_0x17cfb3)
    ? _0x17cfb3['map']((_0x7a5ba1) => trimString(_0x7a5ba1))['filter'](Boolean)
    : [];
}
function pushExistingNodeId(_0x217827, _0x142b5d, _0x8c1099, _0x45f562) {
  const _0x1737a8 = trimString(_0x45f562);
  if (!_0x1737a8 || _0x142b5d['has'](_0x1737a8)) return;
  if (!getNode(_0x8c1099, _0x1737a8))
    throw createCanvasCommandError('NODE_NOT_FOUND', 'Canvas\x20node\x20not\x20found:\x20' + _0x1737a8, {
      nodeId: _0x1737a8,
    });
  (_0x217827['push'](_0x1737a8), _0x142b5d['add'](_0x1737a8));
}
function resolveTaskTargetNodeIds(_0x34ff9c = {}, _0x4db74b = {}) {
  const _0x5ceb01 = [],
    _0x5a946a = new Set();
  if (Array['isArray'](_0x34ff9c['ids']) && _0x34ff9c['ids']['length'] > 0x0) {
    for (const _0x28ea88 of _0x34ff9c['ids']) pushExistingNodeId(_0x5ceb01, _0x5a946a, _0x4db74b, _0x28ea88);
  }
  (pushExistingNodeId(_0x5ceb01, _0x5a946a, _0x4db74b, _0x34ff9c['nodeId']),
    pushExistingNodeId(_0x5ceb01, _0x5a946a, _0x4db74b, _0x34ff9c['targetNodeId']),
    pushExistingNodeId(_0x5ceb01, _0x5a946a, _0x4db74b, _0x34ff9c['resultNodeId']));
  const _0x2cb63e = trimString(_0x34ff9c['taskId']);
  if (_0x2cb63e)
    for (const [_0x4edf34, _0x4a953f] of Object['entries'](getState(_0x4db74b)['nodes'] || {})) {
      if (nodeHasTaskId(_0x4a953f, _0x2cb63e)) pushExistingNodeId(_0x5ceb01, _0x5a946a, _0x4db74b, _0x4edf34);
    }
  if (_0x5ceb01['length'] === 0x0 && !_0x2cb63e)
    for (const _0x5a2d3f of getSelectedNodeIds(_0x4db74b)) {
      pushExistingNodeId(_0x5ceb01, _0x5a946a, _0x4db74b, _0x5a2d3f);
    }
  if (_0x5ceb01['length'] === 0x0)
    throw createCanvasCommandError(
      'TASK_TARGET_NOT_FOUND',
      'Task target node was not found. Provide nodeId, ids, resultNodeId, or taskId.',
      { taskId: _0x2cb63e },
    );
  return _0x5ceb01;
}
function normalizeStatus(_0x492798 = {}, _0x1d6501 = {}) {
  const _0x2a9c8f =
      _0x492798?.['status'] ||
      _0x492798?.['jobStatus'] ||
      _0x492798?.['result']?.['status'] ||
      _0x1d6501['jobStatus'] ||
      _0x1d6501['rhTaskStatus'] ||
      _0x1d6501['asyncTaskStatus'] ||
      '',
    _0x3720e9 = trimString(_0x2a9c8f)['toLowerCase']();
  if (_0x3720e9) return _0x3720e9;
  if (_0x492798?.['ok'] === ![]) return 'failed';
  if (_0x492798?.['ok'] === !![]) return 'success';
  return '';
}
function pickTaskId(_0x2e92b6 = {}, _0x427a89 = {}, _0x4ac711 = '') {
  return trimString(
    _0x2e92b6?.['taskId'] ||
      _0x2e92b6?.['targetTaskId'] ||
      _0x2e92b6?.['result']?.['taskId'] ||
      _0x427a89['taskId'] ||
      _0x427a89['rhTaskId'] ||
      _0x427a89['asyncTaskId'] ||
      _0x4ac711,
  );
}
export function registerTaskCommands(_0x76781f) {
  (_0x76781f['register']({
    id: 'task.focusResult',
    description: 'Focus\x20the\x20canvas\x20viewport\x20on\x20a\x20task\x20result\x20node.',
    riskLevel: 'safe',
    argsSchema: {
      properties: {
        taskId: { type: 'string' },
        nodeId: { type: 'string' },
        targetNodeId: { type: 'string' },
        resultNodeId: { type: 'string' },
        ids: { type: 'array', items: { type: 'string' } },
        padding: { type: 'number' },
        durationMs: { type: 'number' },
        options: { type: 'object' },
      },
      defaults: { padding: 0x50, durationMs: 0x320 },
      selectionFallback: !![],
    },
    capabilitySchema: {
      reads: ['nodes', 'selection'],
      writes: ['viewport'],
      selectionFallback: !![],
      requiresMountedRuntime: ![],
    },
    returnSchema: { aliasFields: ['taskId', 'nodeIds', 'focused'] },
    validate(_0x10f8d2 = {}, _0x204bb9 = {}) {
      if (typeof _0x204bb9['focusNodes'] !== 'function')
        return {
          ok: ![],
          errorCode: 'VIEWPORT_FOCUS_UNAVAILABLE',
          message: 'task.focusResult requires a viewport focus service.',
        };
      try {
        return {
          args: {
            ..._0x10f8d2,
            nodeIds: resolveTaskTargetNodeIds(_0x10f8d2, _0x204bb9),
            taskId: trimString(_0x10f8d2['taskId']),
            padding: positiveNumber(_0x10f8d2['padding'], 0x50),
            durationMs: positiveNumber(_0x10f8d2['durationMs'], 0x320),
            options:
              _0x10f8d2['options'] &&
              typeof _0x10f8d2['options'] === 'object' &&
              !Array['isArray'](_0x10f8d2['options'])
                ? _0x10f8d2['options']
                : {},
          },
        };
      } catch (_0x74628b) {
        return {
          ok: ![],
          errorCode: _0x74628b['errorCode'] || 'TASK_TARGET_NOT_FOUND',
          message: _0x74628b['message'],
          details: _0x74628b['details'],
        };
      }
    },
    execute(_0xb5e71, _0x4662fc) {
      const _0x45ccf7 = _0x4662fc['focusNodes'](
        _0xb5e71['nodeIds'],
        _0xb5e71['padding'],
        _0xb5e71['durationMs'],
        { source: 'task.focusResult', taskId: _0xb5e71['taskId'], ..._0xb5e71['options'] },
      );
      return { taskId: _0xb5e71['taskId'], nodeIds: _0xb5e71['nodeIds'], focused: _0x45ccf7 !== ![] };
    },
  }),
    _0x76781f['register']({
      id: 'task.retry',
      description: 'Retry generation for a task result node through its mounted runtime.',
      riskLevel: 'confirm',
      argsSchema: {
        properties: {
          taskId: { type: 'string' },
          nodeId: { type: 'string' },
          targetNodeId: { type: 'string' },
          resultNodeId: { type: 'string' },
          options: { type: 'object' },
        },
        selectionFallback: !![],
      },
      capabilitySchema: {
        reads: ['nodes', 'selection', 'nodeRuntimeRegistry'],
        writes: ['nodes', 'generationTasks'],
        selectionFallback: !![],
        requiresMountedRuntime: ![],
      },
      returnSchema: { aliasFields: ['nodeId', 'targetNodeId', 'status', 'taskId', 'value'] },
      validate(_0x26d128 = {}, _0x1f496a = {}) {
        try {
          const _0x36c35a = resolveTaskTargetNodeIds(_0x26d128, _0x1f496a);
          if (_0x36c35a['length'] !== 0x1)
            return {
              ok: ![],
              errorCode: 'AMBIGUOUS_TASK_TARGET',
              message: 'task.retry requires exactly one target node.',
              details: { nodeIds: _0x36c35a },
            };
          return {
            args: {
              ..._0x26d128,
              nodeId: _0x36c35a[0x0],
              taskId: trimString(_0x26d128['taskId']),
              options:
                _0x26d128['options'] &&
                typeof _0x26d128['options'] === 'object' &&
                !Array['isArray'](_0x26d128['options'])
                  ? _0x26d128['options']
                  : {},
            },
          };
        } catch (_0x415c09) {
          return {
            ok: ![],
            errorCode: _0x415c09['errorCode'] || 'TASK_TARGET_NOT_FOUND',
            message: _0x415c09['message'],
            details: _0x415c09['details'],
          };
        }
      },
      async execute(_0x55b702, _0x5b68de) {
        const _0x2fe421 = getNodeRuntime(_0x5b68de, _0x55b702['nodeId']);
        if (typeof _0x2fe421?.['runGeneration'] !== 'function')
          throw createCanvasCommandError(
            'TASK_RETRY_UNAVAILABLE',
            'task.retry did not find a registered runGeneration() entry for the node.',
            { nodeId: _0x55b702['nodeId'] },
          );
        const _0x2c0ade = {
          ..._0x55b702['options'],
          source: _0x55b702['options']['source'] || 'task.retry',
          retry: !![],
        };
        if (_0x55b702['taskId'] && !_0x2c0ade['taskId']) _0x2c0ade['taskId'] = _0x55b702['taskId'];
        const _0x32ebab = await _0x2fe421['runGeneration'](_0x2c0ade),
          _0x2bfccd = getNode(_0x5b68de, _0x55b702['nodeId']) || {};
        return {
          nodeId: _0x55b702['nodeId'],
          targetNodeId: trimString(_0x32ebab?.['targetNodeId']) || _0x55b702['nodeId'],
          status: normalizeStatus(_0x32ebab, _0x2bfccd),
          taskId: pickTaskId(_0x32ebab, _0x2bfccd, _0x55b702['taskId']),
          value: _0x32ebab,
        };
      },
    }));
}
