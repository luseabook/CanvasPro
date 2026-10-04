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
function getState(value) {
  return value['store']?.['getStateRaw']?.() || value['store']?.['getState']?.() || {};
}
function getNode(item, key) {
  const index = String(key || '')['trim']();
  return index ? getState(item)['nodes']?.[index] || null : null;
}
function getNodeRuntime(store, result) {
  const promise = store['nodeRuntimeRegistry'] || nodeRuntimeRegistry;
  return typeof promise?.['resolve'] === 'function'
    ? promise['resolve'](result, { store: store['store'] })
    : promise?.['get']?.(result) || null;
}
function trimString(data) {
  return typeof data === 'string' ? data['trim']() : '';
}
function positiveNumber(options, target) {
  const count = Number(options);
  return Number['isFinite'](count) && count >= 0x0 ? count : target;
}
function collectTaskIds(enabled, source, count2 = 0x0) {
  if (!enabled || typeof enabled !== 'object' || count2 > 0x4) return;
  if (Array['isArray'](enabled)) {
    for (const next of enabled) collectTaskIds(next, source, count2 + 0x1);
    return;
  }
  for (const [current, entry] of Object['entries'](enabled)) {
    if (TASK_ID_KEYS['has'](current)) {
      const trimString2 = trimString(entry);
      if (trimString2) source['add'](trimString2);
    }
    if (entry && typeof entry === 'object') collectTaskIds(entry, source, count2 + 0x1);
  }
}
function nodeHasTaskId(options2 = {}, record = '') {
  const trimString3 = trimString(record);
  if (!trimString3) return ![];
  const map = new Set();
  return (collectTaskIds(options2, map), map['has'](trimString3));
}
function getSelectedNodeIds(payload) {
  const list = getState(payload)['selectedNodeIds'];
  return Array['isArray'](list) ? list['map']((handle) => trimString(handle))['filter'](Boolean) : [];
}
function pushExistingNodeId(list2, map2, state, config) {
  const nodeId = trimString(config);
  if (!nodeId || map2['has'](nodeId)) return;
  if (!getNode(state, nodeId))
    throw createCanvasCommandError('NODE_NOT_FOUND', 'Canvas\x20node\x20not\x20found:\x20' + nodeId, {
      nodeId: nodeId,
    });
  (list2['push'](nodeId), map2['add'](nodeId));
}
function resolveTaskTargetNodeIds(options3 = {}, scope = {}) {
  const list3 = [],
    input = new Set();
  if (Array['isArray'](options3['ids']) && options3['ids']['length'] > 0x0) {
    for (const output of options3['ids']) pushExistingNodeId(list3, input, scope, output);
  }
  (pushExistingNodeId(list3, input, scope, options3['nodeId']),
    pushExistingNodeId(list3, input, scope, options3['targetNodeId']),
    pushExistingNodeId(list3, input, scope, options3['resultNodeId']));
  const taskId = trimString(options3['taskId']);
  if (taskId)
    for (const [value2, value3] of Object['entries'](getState(scope)['nodes'] || {})) {
      if (nodeHasTaskId(value3, taskId)) pushExistingNodeId(list3, input, scope, value2);
    }
  if (list3['length'] === 0x0 && !taskId)
    for (const value4 of getSelectedNodeIds(scope)) {
      pushExistingNodeId(list3, input, scope, value4);
    }
  if (list3['length'] === 0x0)
    throw createCanvasCommandError(
      'TASK_TARGET_NOT_FOUND',
      'Task target node was not found. Provide nodeId, ids, resultNodeId, or taskId.',
      { taskId: taskId },
    );
  return list3;
}
function normalizeStatus(response = {}, value5 = {}) {
  const value6 =
      response?.['status'] ||
      response?.['jobStatus'] ||
      response?.['result']?.['status'] ||
      value5['jobStatus'] ||
      value5['rhTaskStatus'] ||
      value5['asyncTaskStatus'] ||
      '',
    trimString4 = trimString(value6)['toLowerCase']();
  if (trimString4) return trimString4;
  if (response?.['ok'] === ![]) return 'failed';
  if (response?.['ok'] === !![]) return 'success';
  return '';
}
function pickTaskId(options4 = {}, value7 = {}, value8 = '') {
  return trimString(
    options4?.['taskId'] ||
      options4?.['targetTaskId'] ||
      options4?.['result']?.['taskId'] ||
      value7['taskId'] ||
      value7['rhTaskId'] ||
      value7['asyncTaskId'] ||
      value8,
  );
}
export function registerTaskCommands(value9) {
  (value9['register']({
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
    validate(options5 = {}, value10 = {}) {
      if (typeof value10['focusNodes'] !== 'function')
        return {
          ok: ![],
          errorCode: 'VIEWPORT_FOCUS_UNAVAILABLE',
          message: 'task.focusResult requires a viewport focus service.',
        };
      try {
        return {
          args: {
            ...options5,
            nodeIds: resolveTaskTargetNodeIds(options5, value10),
            taskId: trimString(options5['taskId']),
            padding: positiveNumber(options5['padding'], 0x50),
            durationMs: positiveNumber(options5['durationMs'], 0x320),
            options:
              options5['options'] &&
              typeof options5['options'] === 'object' &&
              !Array['isArray'](options5['options'])
                ? options5['options']
                : {},
          },
        };
      } catch (errorCode) {
        return {
          ok: ![],
          errorCode: errorCode['errorCode'] || 'TASK_TARGET_NOT_FOUND',
          message: errorCode['message'],
          details: errorCode['details'],
        };
      }
    },
    execute(taskId2, value11) {
      const focused = value11['focusNodes'](taskId2['nodeIds'], taskId2['padding'], taskId2['durationMs'], {
        source: 'task.focusResult',
        taskId: taskId2['taskId'],
        ...taskId2['options'],
      });
      return { taskId: taskId2['taskId'], nodeIds: taskId2['nodeIds'], focused: focused !== ![] };
    },
  }),
    value9['register']({
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
      validate(options6 = {}, value12 = {}) {
        try {
          const nodeIds = resolveTaskTargetNodeIds(options6, value12);
          if (nodeIds['length'] !== 0x1)
            return {
              ok: ![],
              errorCode: 'AMBIGUOUS_TASK_TARGET',
              message: 'task.retry requires exactly one target node.',
              details: { nodeIds: nodeIds },
            };
          return {
            args: {
              ...options6,
              nodeId: nodeIds[0x0],
              taskId: trimString(options6['taskId']),
              options:
                options6['options'] &&
                typeof options6['options'] === 'object' &&
                !Array['isArray'](options6['options'])
                  ? options6['options']
                  : {},
            },
          };
        } catch (errorCode2) {
          return {
            ok: ![],
            errorCode: errorCode2['errorCode'] || 'TASK_TARGET_NOT_FOUND',
            message: errorCode2['message'],
            details: errorCode2['details'],
          };
        }
      },
      async execute(nodeId2, value13) {
        const nodeRuntime = getNodeRuntime(value13, nodeId2['nodeId']);
        if (typeof nodeRuntime?.['runGeneration'] !== 'function')
          throw createCanvasCommandError(
            'TASK_RETRY_UNAVAILABLE',
            'task.retry did not find a registered runGeneration() entry for the node.',
            { nodeId: nodeId2['nodeId'] },
          );
        const enabled2 = {
          ...nodeId2['options'],
          source: nodeId2['options']['source'] || 'task.retry',
          retry: !![],
        };
        if (nodeId2['taskId'] && !enabled2['taskId']) enabled2['taskId'] = nodeId2['taskId'];
        const value14 = await nodeRuntime['runGeneration'](enabled2),
          node = getNode(value13, nodeId2['nodeId']) || {};
        return {
          nodeId: nodeId2['nodeId'],
          targetNodeId: trimString(value14?.['targetNodeId']) || nodeId2['nodeId'],
          status: normalizeStatus(value14, node),
          taskId: pickTaskId(value14, node, nodeId2['taskId']),
          value: value14,
        };
      },
    }));
}
