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
  { allowOptions: allowOptions = false } = {}
) {
  const nodeId = String(options.nodeId || '').trim();
  if (!nodeId)
    return { ok: false, errorCode: 'MISSING_NODE_ID', message: message + ' requires nodeId.' };
  if (!getNode(target, nodeId))
    return { ok: false, errorCode: 'NODE_NOT_FOUND', message: 'Canvas node not found: ' + nodeId };
  return {
    args: {
      nodeId: nodeId,
      options:
        allowOptions && options.options && typeof options.options === 'object'
          ? options.options
          : {},
    },
  };
}
async function cancelViaRuntime(source, store) {
  const next = store.generationRuntime || {};
  if (typeof next.cancelTask !== 'function')
    throw createCanvasCommandError(
      'GENERATION_CANCEL_UNAVAILABLE',
      'generation.cancel did not find public cancelGeneration() or a task runtime cancel entry.'
    );
  const response = await next.cancelTask(source.nodeId, {
    store: store.store,
    abortLocal: true,
  });
  if (!response?.ok)
    throw createCanvasCommandError(
      'GENERATION_CANCEL_UNAVAILABLE',
      'generation.cancel did not find a cancellable public generation task.',
      response || null
    );
  return response;
}
function getStoreStatus(isGenerating = {}) {
  return {
    jobStatus: String(
      isGenerating.jobStatus ||
        isGenerating.storyboardScript?.jobStatus ||
        (isGenerating.isGenerating ? 'running' : 'idle')
    ),
    isGenerating:
      isGenerating.isGenerating === true ||
      isGenerating.storyboardScript?.isGenerating === true ||
      String(isGenerating.storyboardScript?.jobStatus || '') === 'running',
    taskId: String(isGenerating.taskId || isGenerating.rhTaskId || isGenerating.asyncTaskId || ''),
  };
}
function pickGenerationTaskId(result = {}, node = {}) {
  return String(
    result?.taskId ||
      result?.targetTaskId ||
      result?.result?.taskId ||
      node.taskId ||
      node.rhTaskId ||
      node.asyncTaskId ||
      ''
  ).trim();
}
function normalizeGenerationStatus(result = {}, node = {}) {
  const rawStatus =
    result?.status ||
    result?.jobStatus ||
    result?.result?.status ||
    node.jobStatus ||
    node.rhTaskStatus ||
    node.asyncTaskStatus ||
    '';
  const normalized = String(rawStatus || '')
    .trim()
    .toLowerCase();
  if (normalized) return normalized;
  if (result?.ok === false) return 'failed';
  if (result?.ok === true) return 'success';
  return '';
}
// 「失败」和「没开始」是两类不同的结果：前者要报错，后者要提示去检查提示词/输入/凭据。
// 分开判定，错误码才不会一律变成 GENERATION_RUN_FAILED。
const GENERATION_FAILURE_STATUSES = new Set(['failed', 'fail', 'error', 'cancelled', 'canceled']),
  GENERATION_NOT_STARTED_STATUSES = new Set(['', 'idle', 'ready']);
function isGenerationFailureStatus(status = '') {
  return GENERATION_FAILURE_STATUSES.has(
    String(status || '')
      .trim()
      .toLowerCase()
  );
}
function summarizeGenerationRunResult(nodeId, result, options = {}) {
  const node = getNode(options, nodeId) || {},
    taskId = pickGenerationTaskId(result, node),
    normalizedStatus = String(normalizeGenerationStatus(result, node) || '')
      .trim()
      .toLowerCase(),
    storeStatus = getStoreStatus(node),
    notStarted =
      GENERATION_NOT_STARTED_STATUSES.has(normalizedStatus) &&
      !taskId &&
      storeStatus.isGenerating !== true,
    failed = result?.ok === false || isGenerationFailureStatus(normalizedStatus) || notStarted;
  return {
    nodeId: nodeId,
    targetNodeId: String(result?.targetNodeId || nodeId),
    status: failed ? 'failed' : normalizedStatus,
    taskId: taskId,
    ...(failed
      ? {
          errorCode: String(
            result?.errorCode || (notStarted ? 'GENERATION_NOT_STARTED' : 'GENERATION_RUN_FAILED')
          ),
          message: String(
            result?.message ||
              (notStarted
                ? 'Generation did not start. Check the node prompt, required inputs, and credentials.'
                : 'Generation failed.')
          ),
        }
      : {}),
    value: result,
  };
}
function validateBatchNodeIds(options = {}, target = {}) {
  const nodeIds = Array.isArray(options.nodeIds)
    ? [...new Set(options.nodeIds.map((id) => String(id || '').trim()).filter(Boolean))]
    : [];
  if (nodeIds.length === 0)
    return {
      ok: false,
      errorCode: 'MISSING_NODE_IDS',
      message: 'generation.runBatch requires nodeIds.',
    };
  if (nodeIds.length > 12)
    return {
      ok: false,
      errorCode: 'GENERATION_BATCH_TOO_LARGE',
      message: 'generation.runBatch supports at most 12 nodes per batch.',
    };
  for (const nodeId of nodeIds) {
    if (!getNode(target, nodeId))
      return {
        ok: false,
        errorCode: 'NODE_NOT_FOUND',
        message: 'Canvas node not found: ' + nodeId,
      };
  }
  return {
    args: {
      nodeIds: nodeIds,
      options: options.options && typeof options.options === 'object' ? options.options : {},
    },
  };
}
function summarizeBatchStatus(results = []) {
  const statuses = results.map((entry) => String(entry.status || '').toLowerCase());
  if (statuses.length === 0) return '';
  if (statuses.every((status) => status === statuses[0])) return statuses[0];
  // 「有失败」优先于「还有在跑」：用户最需要知道的是这批里有没成的。
  if (statuses.some((status) => status === 'failed' || status === 'error')) return 'partial_failed';
  if (statuses.some((status) => ['submitted', 'pending', 'running'].includes(status)))
    return 'pending';
  return 'mixed';
}
export function registerGenerationCommands(current) {
  (current.register({
    id: 'generation.runBatch',
    description:
      'Run generation for multiple prepared canvas nodes as one confirmed batch. Prefer this when two or more nodes should start generation together.',
    riskLevel: 'confirm',
    argsSchema: {
      required: ['nodeIds'],
      properties: {
        nodeIds: { type: 'array', items: { type: 'string' }, maxItems: 12 },
        options: { type: 'object' },
      },
      defaults: { options: {} },
    },
    capabilitySchema: {
      reads: ['nodes', 'nodeRuntimeRegistry'],
      writes: ['nodes', 'generationTasks'],
      requiresMountedRuntime: false,
    },
    returnSchema: { aliasFields: ['nodeIds', 'status', 'results'] },
    validate(options = {}, target = {}) {
      return validateBatchNodeIds(options, target);
    },
    async execute(batchArgs, record) {
      for (const nodeId of batchArgs.nodeIds) {
        const nodeRuntime = getNodeRuntime(record, nodeId);
        if (!nodeRuntime)
          throw createCanvasCommandError(
            'GENERATION_NODE_NOT_MOUNTED',
            'Canvas node generation runtime is not registered: ' + nodeId,
            { nodeId: nodeId }
          );
        if (typeof nodeRuntime.runGeneration !== 'function')
          throw createCanvasCommandError(
            'GENERATION_RUN_UNAVAILABLE',
            'generation.runBatch did not find runGeneration() for node: ' + nodeId,
            { nodeId: nodeId }
          );
      }
      const results = await Promise.all(
          batchArgs.nodeIds.map(async (nodeId) => {
            try {
              const runResult = await getNodeRuntime(record, nodeId).runGeneration(
                batchArgs.options
              );
              return summarizeGenerationRunResult(nodeId, runResult, record);
            } catch (error) {
              // 单节点失败不打断整批：其余节点可能已经提交成功，全部回滚反而更糟。
              return {
                nodeId: nodeId,
                targetNodeId: nodeId,
                status: 'failed',
                taskId: '',
                errorCode: String(error?.errorCode || 'GENERATION_RUN_FAILED'),
                message: String(error?.message || 'Generation failed.'),
              };
            }
          })
        ),
        failedResults = results.filter((entry) => isGenerationFailureStatus(entry.status));
      // 全军覆没才整体报错；部分成功要原样返回，让调用方看到哪些成了。
      if (failedResults.length === results.length)
        throw createCanvasCommandError(
          'GENERATION_BATCH_NOT_STARTED',
          failedResults[0]?.message || 'No generation task in the batch was started.',
          { nodeIds: [...batchArgs.nodeIds], results: results }
        );
      return {
        nodeIds: [...batchArgs.nodeIds],
        status: summarizeBatchStatus(results),
        results: results,
      };
    },
  }),
    current.register({
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
        requiresMountedRuntime: false,
      },
      returnSchema: { aliasFields: ['nodeId', 'targetNodeId', 'status', 'taskId', 'value'] },
      validate(options2 = {}, entry = {}) {
        return validateNodeId(options2, entry, 'generation.run', { allowOptions: true });
      },
      async execute(nodeId2, record) {
        const nodeRuntime = getNodeRuntime(record, nodeId2.nodeId);
        if (!nodeRuntime)
          throw createCanvasCommandError(
            'GENERATION_NODE_NOT_MOUNTED',
            'Canvas node generation runtime is not registered: ' + nodeId2.nodeId,
            { nodeId: nodeId2.nodeId }
          );
        if (typeof nodeRuntime.runGeneration !== 'function')
          throw createCanvasCommandError(
            'GENERATION_RUN_UNAVAILABLE',
            'generation.run did not find a registered runGeneration() entry for the node.',
            { nodeId: nodeId2.nodeId }
          );
        const runResult = await nodeRuntime.runGeneration(nodeId2.options),
          summary = summarizeGenerationRunResult(nodeId2.nodeId, runResult, record);
        // 以前直接把原始返回值丢回去，失败在调用方看来也是「成功」。
        // 归一化后按状态抛错，Agent 的后置校验才能看见失败。
        if (isGenerationFailureStatus(summary.status))
          throw createCanvasCommandError(
            summary.errorCode || 'GENERATION_RUN_FAILED',
            summary.message || 'Generation failed.',
            summary
          );
        return summary;
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
              value3
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
            { nodeId: nodeId4.nodeId }
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
