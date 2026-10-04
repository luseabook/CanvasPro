import { createCanvasCommandError } from './commandRegistry.js';
import nodeRuntimeRegistry from '../../core/nodeRuntimeRegistry.js';
function getState(value) {
  return value.store?.getStateRaw?.() || value.store?.getState?.() || {};
}
function getNode(item, key) {
  const index = String(key || '').trim();
  return index ? getState(item).nodes?.[index] || null : null;
}
function getNodeRuntime(result, data) {
  const map = result.nodeRuntimeRegistry || nodeRuntimeRegistry;
  return map?.get?.(data) || null;
}
function validateNodeId(
  options = {},
  target = {},
  message = 'generation command',
  { allowOptions: allowOptions = false } = {},
) {
  const nodeId = String(options.nodeId || '').trim();
  if (!nodeId) return { ok: false, errorCode: 'MISSING_NODE_ID', message: message + ' requires nodeId.' };
  if (!getNode(target, nodeId))
    return { ok: false, errorCode: 'NODE_NOT_FOUND', message: 'Canvas node not found: ' + nodeId };
  return {
    args: {
      nodeId: nodeId,
      options: allowOptions && options.options && typeof options.options === 'object' ? options.options : {},
    },
  };
}
async function cancelViaRuntime(source, store) {
  const next = store.generationRuntime || {};
  if (typeof next.cancelTask !== 'function')
    throw createCanvasCommandError(
      'GENERATION_CANCEL_UNAVAILABLE',
      'generation.cancel did not find public cancelGeneration() or a task runtime cancel entry.',
    );
  const response = await next.cancelTask(source.nodeId, {
    store: store.store,
    abortLocal: true,
  });
  if (!response?.ok)
    throw createCanvasCommandError(
      'GENERATION_CANCEL_UNAVAILABLE',
      'generation.cancel did not find a cancellable public generation task.',
      response || null,
    );
  return response;
}
function getStoreStatus(isGenerating = {}) {
  return {
    jobStatus: String(
      isGenerating.jobStatus ||
        isGenerating.storyboardScript?.jobStatus ||
        (isGenerating.isGenerating ? 'running' : 'idle'),
    ),
    isGenerating:
      isGenerating.isGenerating === true ||
      isGenerating.storyboardScript?.isGenerating === true ||
      String(isGenerating.storyboardScript?.jobStatus || '') === 'running',
    taskId: String(isGenerating.taskId || isGenerating.rhTaskId || isGenerating.asyncTaskId || ''),
  };
}
export function registerGenerationCommands(current) {
  (current.register({
    id: 'generation.run',
    description: 'Run generation for a canvas node.',
    riskLevel: 'confirm',
    argsSchema: {
      required: ['nodeId'],
      properties: { nodeId: { type: 'string' }, options: { type: 'object' } },
      defaults: { options: {} },
    },
    capabilitySchema: {
      reads: ['nodes', 'nodeRuntimeRegistry'],
      writes: ['nodes', 'generationTasks'],
      requiresMountedRuntime: true,
    },
    returnSchema: { aliasFields: ['nodeId', 'value'] },
    validate(options2 = {}, entry = {}) {
      return validateNodeId(options2, entry, 'generation.run', { allowOptions: true });
    },
    async execute(nodeId2, record) {
      const nodeRuntime = getNodeRuntime(record, nodeId2.nodeId);
      if (!nodeRuntime)
        throw createCanvasCommandError(
          'GENERATION_NODE_NOT_MOUNTED',
          'Canvas node generation runtime is not registered: ' + nodeId2.nodeId,
          { nodeId: nodeId2.nodeId },
        );
      if (typeof nodeRuntime.runGeneration !== 'function')
        throw createCanvasCommandError(
          'GENERATION_RUN_UNAVAILABLE',
          'generation.run did not find a registered runGeneration() entry for the node.',
          { nodeId: nodeId2.nodeId },
        );
      const value2 = await nodeRuntime.runGeneration(nodeId2.options);
      return { nodeId: nodeId2.nodeId, value: value2 };
    },
  }),
    current.register({
      id: 'generation.cancel',
      description: 'Cancel generation for a canvas node.',
      riskLevel: 'confirm',
      argsSchema: {
        required: ['nodeId'],
        properties: { nodeId: { type: 'string' }, options: { type: 'object' } },
        defaults: { options: {} },
      },
      capabilitySchema: {
        reads: ['nodes', 'nodeRuntimeRegistry', 'generationRuntime'],
        writes: ['nodes', 'generationTasks'],
        requiresMountedRuntime: false,
      },
      returnSchema: { aliasFields: ['nodeId', 'value', 'source'] },
      validate(options3 = {}, payload = {}) {
        return validateNodeId(options3, payload, 'generation.cancel', { allowOptions: true });
      },
      async execute(nodeId3, handle) {
        const nodeRuntime2 = getNodeRuntime(handle, nodeId3.nodeId);
        if (typeof nodeRuntime2?.cancelGeneration === 'function') {
          const value3 = await nodeRuntime2.cancelGeneration(nodeId3.options);
          if (value3?.ok === false)
            throw createCanvasCommandError(
              'GENERATION_CANCEL_UNAVAILABLE',
              value3.message || 'generation.cancel was rejected by the node.',
              value3,
            );
          return { nodeId: nodeId3.nodeId, value: value3, source: 'node' };
        }
        const value4 = await cancelViaRuntime(nodeId3, handle);
        return { nodeId: nodeId3.nodeId, value: value4, source: 'runtime' };
      },
    }),
    current.register({
      id: 'generation.resume',
      description: 'Resume generation for a canvas node.',
      riskLevel: 'confirm',
      argsSchema: {
        required: ['nodeId'],
        properties: { nodeId: { type: 'string' }, options: { type: 'object' } },
        defaults: { options: {} },
      },
      capabilitySchema: {
        reads: ['nodes', 'nodeRuntimeRegistry'],
        writes: ['nodes', 'generationTasks'],
        requiresMountedRuntime: true,
      },
      returnSchema: { aliasFields: ['nodeId', 'value'] },
      validate(options4 = {}, state = {}) {
        return validateNodeId(options4, state, 'generation.resume', { allowOptions: true });
      },
      async execute(nodeId4, config) {
        const nodeRuntime3 = getNodeRuntime(config, nodeId4.nodeId);
        if (typeof nodeRuntime3?.resumeGeneration !== 'function')
          throw createCanvasCommandError(
            'GENERATION_RESUME_UNAVAILABLE',
            'generation.resume did not find a registered resumeGeneration() entry for the node.',
            { nodeId: nodeId4.nodeId },
          );
        const value5 = await nodeRuntime3.resumeGeneration(nodeId4.options);
        return { nodeId: nodeId4.nodeId, value: value5 };
      },
    }),
    current.register({
      id: 'generation.getStatus',
      description: 'Get generation status for a canvas node.',
      riskLevel: 'safe',
      argsSchema: { required: ['nodeId'], properties: { nodeId: { type: 'string' } } },
      capabilitySchema: { reads: ['nodes', 'nodeRuntimeRegistry'], writes: [] },
      returnSchema: { aliasFields: ['nodeId', 'status', 'source'] },
      validate(options5 = {}, scope = {}) {
        return validateNodeId(options5, scope, 'generation.getStatus');
      },
      execute(nodeId5, input) {
        const status = getNodeRuntime(input, nodeId5.nodeId);
        if (typeof status?.getGenerationStatus === 'function')
          return { nodeId: nodeId5.nodeId, status: status.getGenerationStatus(), source: 'node' };
        return {
          nodeId: nodeId5.nodeId,
          status: getStoreStatus(getNode(input, nodeId5.nodeId) || {}),
          source: 'store',
        };
      },
    }));
}
