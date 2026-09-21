import { createCanvasCommandError } from './commandRegistry.js';
import nodeRuntimeRegistry from '../../core/nodeRuntimeRegistry.js';
function getState(_0x29231c) {
  return _0x29231c.store?.getStateRaw?.() || _0x29231c.store?.getState?.() || {};
}
function getNode(_0x48f147, _0x29f100) {
  const _0xa510f6 = String(_0x29f100 || '').trim();
  return _0xa510f6 ? getState(_0x48f147).nodes?.[_0xa510f6] || null : null;
}
function getNodeRuntime(_0x2e5d8a, _0x234b65) {
  const _0x53b77a = _0x2e5d8a.nodeRuntimeRegistry || nodeRuntimeRegistry;
  return _0x53b77a?.get?.(_0x234b65) || null;
}
function validateNodeId(
  _0x5eb08e = {},
  _0x521d71 = {},
  _0x26aeb5 = 'generation command',
  { allowOptions: allowOptions = false } = {},
) {
  const _0x127536 = String(_0x5eb08e.nodeId || '').trim();
  if (!_0x127536)
    return { ok: false, errorCode: 'MISSING_NODE_ID', message: _0x26aeb5 + ' requires nodeId.' };
  if (!getNode(_0x521d71, _0x127536))
    return { ok: false, errorCode: 'NODE_NOT_FOUND', message: 'Canvas node not found: ' + _0x127536 };
  return {
    args: {
      nodeId: _0x127536,
      options:
        allowOptions && _0x5eb08e.options && typeof _0x5eb08e.options === 'object' ? _0x5eb08e.options : {},
    },
  };
}
async function cancelViaRuntime(_0x51ba9f, _0x2f087e) {
  const _0x18518d = _0x2f087e.generationRuntime || {};
  if (typeof _0x18518d.cancelTask !== 'function')
    throw createCanvasCommandError(
      'GENERATION_CANCEL_UNAVAILABLE',
      'generation.cancel did not find public cancelGeneration() or a task runtime cancel entry.',
    );
  const _0x113bc0 = await _0x18518d.cancelTask(_0x51ba9f.nodeId, {
    store: _0x2f087e.store,
    abortLocal: true,
  });
  if (!_0x113bc0?.ok)
    throw createCanvasCommandError(
      'GENERATION_CANCEL_UNAVAILABLE',
      'generation.cancel did not find a cancellable public generation task.',
      _0x113bc0 || null,
    );
  return _0x113bc0;
}
function getStoreStatus(_0x389a5b = {}) {
  return {
    jobStatus: String(
      _0x389a5b.jobStatus ||
        _0x389a5b.storyboardScript?.jobStatus ||
        (_0x389a5b.isGenerating ? 'running' : 'idle'),
    ),
    isGenerating:
      _0x389a5b.isGenerating === true ||
      _0x389a5b.storyboardScript?.isGenerating === true ||
      String(_0x389a5b.storyboardScript?.jobStatus || '') === 'running',
    taskId: String(_0x389a5b.taskId || _0x389a5b.rhTaskId || _0x389a5b.asyncTaskId || ''),
  };
}
export function registerGenerationCommands(_0x89f422) {
  (_0x89f422.register({
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
    validate(_0x5e8e9 = {}, _0x162ea8 = {}) {
      return validateNodeId(_0x5e8e9, _0x162ea8, 'generation.run', { allowOptions: true });
    },
    async execute(_0x301dd, _0x1e9027) {
      const _0x1a2bb9 = getNodeRuntime(_0x1e9027, _0x301dd.nodeId);
      if (!_0x1a2bb9)
        throw createCanvasCommandError(
          'GENERATION_NODE_NOT_MOUNTED',
          'Canvas node generation runtime is not registered: ' + _0x301dd.nodeId,
          { nodeId: _0x301dd.nodeId },
        );
      if (typeof _0x1a2bb9.runGeneration !== 'function')
        throw createCanvasCommandError(
          'GENERATION_RUN_UNAVAILABLE',
          'generation.run did not find a registered runGeneration() entry for the node.',
          { nodeId: _0x301dd.nodeId },
        );
      const _0x38604c = await _0x1a2bb9.runGeneration(_0x301dd.options);
      return { nodeId: _0x301dd.nodeId, value: _0x38604c };
    },
  }),
    _0x89f422.register({
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
      validate(_0x1d3ffa = {}, _0xa3c054 = {}) {
        return validateNodeId(_0x1d3ffa, _0xa3c054, 'generation.cancel', { allowOptions: true });
      },
      async execute(_0x302e19, _0x23bbbc) {
        const _0x357da1 = getNodeRuntime(_0x23bbbc, _0x302e19.nodeId);
        if (typeof _0x357da1?.cancelGeneration === 'function') {
          const _0x1fe7b4 = await _0x357da1.cancelGeneration(_0x302e19.options);
          if (_0x1fe7b4?.ok === false)
            throw createCanvasCommandError(
              'GENERATION_CANCEL_UNAVAILABLE',
              _0x1fe7b4.message || 'generation.cancel was rejected by the node.',
              _0x1fe7b4,
            );
          return { nodeId: _0x302e19.nodeId, value: _0x1fe7b4, source: 'node' };
        }
        const _0x5119d9 = await cancelViaRuntime(_0x302e19, _0x23bbbc);
        return { nodeId: _0x302e19.nodeId, value: _0x5119d9, source: 'runtime' };
      },
    }),
    _0x89f422.register({
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
      validate(_0x57d6e4 = {}, _0x473937 = {}) {
        return validateNodeId(_0x57d6e4, _0x473937, 'generation.resume', { allowOptions: true });
      },
      async execute(_0xe3c29f, _0x34c4dd) {
        const _0x468018 = getNodeRuntime(_0x34c4dd, _0xe3c29f.nodeId);
        if (typeof _0x468018?.resumeGeneration !== 'function')
          throw createCanvasCommandError(
            'GENERATION_RESUME_UNAVAILABLE',
            'generation.resume did not find a registered resumeGeneration() entry for the node.',
            { nodeId: _0xe3c29f.nodeId },
          );
        const _0x2845bd = await _0x468018.resumeGeneration(_0xe3c29f.options);
        return { nodeId: _0xe3c29f.nodeId, value: _0x2845bd };
      },
    }),
    _0x89f422.register({
      id: 'generation.getStatus',
      description: 'Get generation status for a canvas node.',
      riskLevel: 'safe',
      argsSchema: { required: ['nodeId'], properties: { nodeId: { type: 'string' } } },
      capabilitySchema: { reads: ['nodes', 'nodeRuntimeRegistry'], writes: [] },
      returnSchema: { aliasFields: ['nodeId', 'status', 'source'] },
      validate(_0x14cecd = {}, _0x5f3512 = {}) {
        return validateNodeId(_0x14cecd, _0x5f3512, 'generation.getStatus');
      },
      execute(_0x19265c, _0x2d7e38) {
        const _0x4a1161 = getNodeRuntime(_0x2d7e38, _0x19265c.nodeId);
        if (typeof _0x4a1161?.getGenerationStatus === 'function')
          return { nodeId: _0x19265c.nodeId, status: _0x4a1161.getGenerationStatus(), source: 'node' };
        return {
          nodeId: _0x19265c.nodeId,
          status: getStoreStatus(getNode(_0x2d7e38, _0x19265c.nodeId) || {}),
          source: 'store',
        };
      },
    }));
}
