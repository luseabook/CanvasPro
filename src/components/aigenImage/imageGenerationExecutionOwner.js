import { createAIGenerateNodeTaskOrchestrationModule } from './taskOrchestrationModule.js';
import { isWorkflowModel } from '../../manifests/index.js';
import { submitTask, resumeTask, cancelTask } from '../../core/generationTaskRuntime.js';
import { getGenerationRatioMediaSize } from '../../modules/generationRatioSource.js';
const readState = (_0x134c97) => _0x134c97['getStateRaw']?.() || _0x134c97['getState'](),
  cancelled = (_0x13004a) => ({
    ok: ![],
    status: 'cancelled',
    reason: 'target-changed',
    targetNodeId: _0x13004a,
  });
export function createImageGenerationExecutionOwner({
  store: _0x5f5798,
  getScopeId: _0x3a539f,
  dependencies: dependencies = {},
}) {
  if (!_0x5f5798 || typeof _0x3a539f !== 'function')
    throw new TypeError('Image\x20execution\x20requires\x20a\x20Store\x20and\x20canvas\x20scope\x20reader');
  const _0x572f6a = new Map();
  let _0x484292 = ![];
  function _0x3028c3(_0x4c4d46, _0x30bd1f) {
    let _0x55477b = null,
      _0x26b74c = ![],
      _0x49b151 = null,
      _0x52d12f = ![];
    const _0x48e45c = () =>
        !_0x484292 &&
        !_0x26b74c &&
        _0x3a539f() === _0x30bd1f &&
        readState(_0x5f5798)['nodes']?.[_0x4c4d46]?.['type'] === 'ai-image',
      _0x5c9fa1 = () => _0x55477b?.['store'] || _0x5f5798,
      _0x30b79d = () =>
        (_0x55477b?.['background'] === !![] || _0x48e45c()) && !!readState(_0x5c9fa1())['nodes']?.[_0x4c4d46],
      _0x52fd19 = {
        getState: () => (_0x30b79d() ? readState(_0x5c9fa1()) : { nodes: {}, edges: {} }),
        getStateRaw: () => _0x52fd19['getState'](),
        getIncomingEdges: (_0x471d41) =>
          _0x30b79d() ? _0x5c9fa1()['getIncomingEdges']?.(_0x471d41) || [] : [],
        updateNodeData: (_0x339d7c, _0x30295f) => {
          if (_0x30b79d() && readState(_0x5c9fa1())['nodes']?.[_0x339d7c])
            _0x5c9fa1()['updateNodeData'](_0x339d7c, _0x30295f);
        },
      },
      _0x46d732 = () => {
        if (_0x48e45c()) _0x49b151?.['onStateChange']?.(_0x3d3a12['getGenerationStatus']());
      },
      _0x57bf44 = async (_0x51365e, _0x3fceab, _0x419528) => {
        if (!_0x48e45c()) return cancelled(_0x4c4d46);
        return _0x51365e(
          {
            ..._0x3fceab,
            startBuilder: async (_0x4c17e3) => {
              return ((_0x55477b = _0x4c17e3), _0x3fceab['startBuilder']?.(_0x4c17e3));
            },
            onTaskStart: (_0x308d9b) => {
              const _0x280430 = _0x3fceab['onTaskStart']?.(_0x308d9b);
              return (_0x46d732(), _0x280430);
            },
          },
          { ..._0x419528, store: _0x5c9fa1(), taskScopeId: _0x30bd1f, isTargetCurrent: _0x48e45c },
        );
      },
      _0x59484e = createAIGenerateNodeTaskOrchestrationModule({
        ...dependencies,
        store: _0x52fd19,
        isTargetCurrent: _0x48e45c,
        startLoading: _0x46d732,
        stopLoading: _0x46d732,
        getInputRatioSize: ({ nodeData: _0x3788c7, edge: _0x57ba7c, includeNodeFrame: _0xb7e62 }) =>
          getGenerationRatioMediaSize(_0x3788c7, _0x57ba7c, { includeNodeFrame: _0xb7e62 }),
        taskRuntime: {
          submitTask: (_0x2062a4, _0x429aba) => _0x57bf44(submitTask, _0x2062a4, _0x429aba),
          resumeTask: (_0x24fe8f, _0x48a411) => _0x57bf44(resumeTask, _0x24fe8f, _0x48a411),
          cancelTask: (_0x117072, _0x5e6ee2) => cancelTask(_0x117072, { ..._0x5e6ee2, store: _0x5c9fa1() }),
        },
      }),
      _0x1e97eb = Object['assign'](Object['create'](_0x59484e), {
        nodeId: _0x4c4d46,
        _data: readState(_0x5f5798)['nodes'][_0x4c4d46],
        _isRunninghubWorkflowModel: isWorkflowModel,
        _updateSubmitButtonState: _0x46d732,
      }),
      _0x13a22c = async (_0x2e1fec, _0x2cc812) => {
        if (!_0x48e45c()) return cancelled(_0x4c4d46);
        if (_0x52d12f) return { ok: ![], status: 'running', targetNodeId: _0x4c4d46 };
        (_0x49b151?.['flushPrompt']?.(), (_0x55477b = null), (_0x52d12f = !![]), _0x46d732());
        try {
          return await _0x2e1fec['apply'](_0x1e97eb, _0x2cc812);
        } finally {
          ((_0x52d12f = ![]), _0x46d732());
        }
      },
      _0x3d3a12 = {
        buildPayload: (_0x5d453d) => {
          if (!_0x48e45c()) return null;
          return (_0x49b151?.['flushPrompt']?.(), _0x1e97eb['_buildPayload'](_0x5d453d));
        },
        runGeneration: (_0x36c26f = {}) => _0x13a22c(_0x59484e['runGeneration'], [_0x36c26f]),
        runPreset: (_0x477409, _0x9a1c10 = {}) => _0x13a22c(_0x59484e['_onGenerate'], [_0x477409, _0x9a1c10]),
        getGenerationStatus: () => ({
          ..._0x1e97eb['getGenerationStatus'](),
          submitting: _0x52d12f && !_0x55477b,
          isGenerating: _0x52d12f || _0x1e97eb['getGenerationStatus']()['isGenerating'],
        }),
        cancelGeneration: async () => {
          if (!_0x55477b)
            return (
              _0x49b151?.['onStateChange']?.({
                ..._0x3d3a12['getGenerationStatus'](),
                isGenerating: ![],
                submitting: ![],
                jobStatus: 'cancelled',
              }),
              (_0x26b74c = !![]),
              { ok: !![], status: 'cancelled', reason: 'user-cancelled', targetNodeId: _0x4c4d46 }
            );
          if (
            _0x1e97eb['_isRunninghubWorkflowModel'](
              _0x1e97eb['_data']?.['model'],
              _0x1e97eb['_data']?.['provider'],
            )
          )
            return _0x1e97eb['cancelGeneration']();
          return cancelTask(_0x4c4d46, { store: _0x5c9fa1(), abortLocal: !![] });
        },
        resumeGeneration: () => {
          const _0x890e13 = _0x52fd19['getState']()['nodes']?.[_0x4c4d46] || {};
          if (
            _0x52d12f ||
            !(
              _0x1e97eb['_isRunningHubRecoverableRunningTask'](_0x890e13) ||
              _0x1e97eb['_isDreaminaRecoverableRunningTask'](_0x890e13) ||
              _0x1e97eb['_isAsyncRecoverableRunningTask'](_0x890e13) ||
              _0x1e97eb['_shouldFallbackRegenerateAsyncTask'](_0x890e13)
            )
          )
            return _0x3d3a12['getGenerationStatus']();
          return _0x13a22c(async function () {
            return (
              await this['_maybeResumeRunningHubTaskImpl'](),
              await this['_maybeResumeDreaminaTaskImpl'](),
              await this['_maybeResumeAsyncTaskImpl'](),
              await Promise['all'](
                [
                  this['_rhResumePromise'],
                  this['_dreaminaResumePromise'],
                  this['_asyncResumePromise'],
                  this['_asyncFallbackRegeneratePromise'],
                ]['filter'](Boolean),
              ),
              this['getGenerationStatus']()
            );
          }, []);
        },
        attachPresentation(_0x28b896) {
          return (
            (_0x49b151 = _0x28b896),
            _0x46d732(),
            () => {
              if (_0x49b151 === _0x28b896) _0x49b151 = null;
            }
          );
        },
        reconcile() {
          if (!_0x48e45c()) _0x49b151 = null;
          if (_0x55477b?.['background'] === !![]) return;
          if (!_0x48e45c()) {
            _0x26b74c = !![];
            if (_0x55477b && _0x52d12f) void cancelTask(_0x4c4d46, { store: _0x5c9fa1(), abortLocal: !![] });
          }
        },
        isReusable: () => !_0x26b74c,
        isPending: () => _0x52d12f,
        dispose() {
          ((_0x26b74c = !![]), (_0x49b151 = null));
          if (_0x55477b && _0x52d12f) void cancelTask(_0x4c4d46, { store: _0x5c9fa1(), abortLocal: !![] });
        },
      };
    return _0x3d3a12;
  }
  let _0x8c365a = readState(_0x5f5798)['nodes'],
    _0x1af744 = readState(_0x5f5798)['_nodesRev'],
    _0x286f0b = readState(_0x5f5798)['_nodeMembershipRev'],
    _0x3da863 = _0x3a539f();
  const _0x36c681 = _0x5f5798['subscribeRaw']?.((_0x85ac83) => {
    const _0x5ce0fe = _0x3a539f();
    if (
      _0x85ac83['_nodesRev'] !== undefined &&
      _0x8c365a === _0x85ac83['nodes'] &&
      _0x1af744 === _0x85ac83['_nodesRev'] &&
      _0x3da863 === _0x5ce0fe
    )
      return;
    const _0x5e8529 =
      _0x8c365a !== _0x85ac83['nodes'] ||
      _0x286f0b !== _0x85ac83['_nodeMembershipRev'] ||
      _0x3da863 !== _0x5ce0fe;
    ((_0x8c365a = _0x85ac83['nodes']),
      (_0x1af744 = _0x85ac83['_nodesRev']),
      (_0x286f0b = _0x85ac83['_nodeMembershipRev']),
      (_0x3da863 = _0x5ce0fe));
    for (const [_0x5bdbb2, _0x54c1d7] of _0x572f6a) {
      for (const [_0x95dc0c, _0x172d95] of _0x54c1d7) {
        _0x172d95['reconcile']();
        if (!_0x172d95['isPending']() && (_0x5bdbb2 !== _0x3a539f() || !_0x172d95['isReusable']()))
          _0x54c1d7['delete'](_0x95dc0c);
      }
      if (!_0x54c1d7['size']) _0x572f6a['delete'](_0x5bdbb2);
    }
    if (_0x5e8529) _0x1fc171();
  });
  let _0x55a281 = ![];
  function _0x1fc171() {
    if (_0x484292 || _0x55a281) return;
    ((_0x55a281 = !![]),
      queueMicrotask(() => {
        _0x55a281 = ![];
        if (_0x484292) return;
        for (const _0x25cfd6 of Object['values'](readState(_0x5f5798)['nodes'] || {})) {
          _0x25cfd6['type'] === 'ai-image' &&
            (_0x25cfd6['isGenerating'] ||
              _0x25cfd6['rhTaskId'] ||
              _0x25cfd6['asyncTaskId'] ||
              _0x25cfd6['dreaminaSubmitId']) &&
            Promise['resolve'](_0x47c383['resolve'](_0x25cfd6['id'])?.['resumeGeneration']())['catch'](
              (_0xf29fbd) => console['error']('[imageGenerationExecution] recovery failed', _0xf29fbd),
            );
        }
      }));
  }
  const _0x47c383 = {
    resolve(_0x485544, _0x2d9e2c = {}) {
      if (
        _0x484292 ||
        (_0x2d9e2c['store'] && _0x2d9e2c['store'] !== _0x5f5798) ||
        readState(_0x5f5798)['nodes']?.[_0x485544]?.['type'] !== 'ai-image'
      )
        return null;
      const _0x238a8d = _0x3a539f();
      let _0x3c3b1b = _0x572f6a['get'](_0x238a8d);
      !_0x3c3b1b && ((_0x3c3b1b = new Map()), _0x572f6a['set'](_0x238a8d, _0x3c3b1b));
      let _0x2efa71 = _0x3c3b1b['get'](_0x485544);
      return (
        !_0x2efa71?.['isReusable']() &&
          ((_0x2efa71 = _0x3028c3(_0x485544, _0x238a8d)), _0x3c3b1b['set'](_0x485544, _0x2efa71)),
        _0x2efa71
      );
    },
    dispose() {
      ((_0x484292 = !![]), _0x36c681?.());
      for (const _0x1c1ac6 of _0x572f6a['values']())
        for (const _0x1d2b67 of _0x1c1ac6['values']()) _0x1d2b67['dispose']();
      _0x572f6a['clear']();
    },
  };
  return (_0x1fc171(), _0x47c383);
}
