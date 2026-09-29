import { cancelTask, resumeTask, submitTask } from '../../core/generationTaskRuntime.js';
import {
  createGenerationCancelPlanFromNode,
  createGenerationResumePlanFromNode,
  createGenerationSubmitPlan,
} from '../../core/generationExecutionPlan.js';
import { buildRunningHubTaskPatch } from '../../core/generationTaskProtocolState.js';
import { shouldShowGenerationBusyUi } from '../../core/generationTaskUiState.js';
import { getModelManifest } from '../../manifests/index.js';
const DEFAULT_RUNTIME = Object['freeze']({
  cancelTask: cancelTask,
  resumeTask: resumeTask,
  submitTask: submitTask,
});
function normalizeProvider(_0x5bc89e, _0x5d54c3 = 'runninghubwf') {
  return String(_0x5bc89e || _0x5d54c3)
    ['trim']()
    ['toLowerCase']();
}
function isRunningHubProvider(_0x382d91) {
  return _0x382d91 === 'runninghubwf' || _0x382d91 === 'runninghub';
}
function supportsAudioTaskCancellation(_0x2bf088 = {}) {
  const _0x5d8fdf = getModelManifest(_0x2bf088['audioWorkflowKey'] || _0x2bf088['model'] || '');
  return _0x5d8fdf
    ? _0x5d8fdf['cancellable'] === !![]
    : normalizeProvider(_0x2bf088['provider']) === 'runninghubwf';
}
function getResultPatch(_0x20d446) {
  if (_0x20d446?.['patch'] && typeof _0x20d446['patch'] === 'object') return _0x20d446['patch'];
  return _0x20d446 && typeof _0x20d446 === 'object' ? _0x20d446 : {};
}
function isAbortLike(_0x3ece93, _0xd92b9e) {
  return (
    _0xd92b9e?.['aborted'] === !![] ||
    _0x3ece93?.['name'] === 'AbortError' ||
    _0x3ece93?.['message'] === 'CANCELLED'
  );
}
function throwIfAborted(_0x59bfe8) {
  if (_0x59bfe8?.['aborted'] !== !![]) return;
  const _0x86b8ce = new Error('CANCELLED');
  _0x86b8ce['name'] = 'AbortError';
  throw _0x86b8ce;
}
export function createAudioNodeTaskOrchestration(_0x179409 = {}) {
  const {
    nodeId: _0x114757,
    store: _0xecc112,
    runtime: runtime = DEFAULT_RUNTIME,
    api: api = {},
    ensureConfig: ensureConfig = async () => {},
    getProviderConfig: getProviderConfig = () => ({}),
    buildResultPatch: buildResultPatch = async () => ({}),
    afterResultCommit: afterResultCommit = () => {},
    persistTaskState: persistTaskState = () => {},
    setBusyState: setBusyState = () => {},
    setLoading: setLoading = () => {},
    onSuccess: onSuccess = () => {},
    onFailure: onFailure = () => {},
    now: now = () => Date['now'](),
    createAbortController: createAbortController = () => new AbortController(),
    messages: messages = {},
  } = _0x179409;
  if (!String(_0x114757 || '')['trim']())
    throw new Error('[audioTaskOrchestration]\x20nodeId\x20is\x20required');
  if (!_0xecc112 || typeof _0xecc112['getState'] !== 'function')
    throw new Error('[audioTaskOrchestration] store is required');
  let _0x1cae52 = ![],
    _0x466268 = null,
    _0x7b2224 = null,
    _0x3ab923 = null,
    _0x5324b5 = null,
    _0x1e73bd = '',
    _0xc5e21d = '',
    _0x29ce90 = '',
    _0x4941ae = '',
    _0x2b94d2 = ![],
    _0x5960b6 = ![],
    _0x2fe015 = ![];
  const _0x52465a = () => _0xecc112['getState']()?.['nodes']?.[_0x114757] || {},
    _0x56eb30 = (_0x250ea5, _0x2f81a5) => {
      if (typeof _0x250ea5?.['updateTaskNode'] === 'function') return _0x250ea5['updateTaskNode'](_0x2f81a5);
      return (_0xecc112['updateNodeData'](_0x114757, _0x2f81a5), !![]);
    },
    _0x4eba51 = (_0x416f80, _0x38df10) => {
      const _0x7d09c2 = messages[_0x416f80];
      if (typeof _0x7d09c2 === 'function') return _0x7d09c2() || _0x38df10;
      return _0x7d09c2 || _0x38df10;
    },
    _0x10bcdf = (_0x2844c4 = {}) => {
      try {
        const _0x491752 = persistTaskState(_0x2844c4);
        _0x491752?.['catch']?.(() => {});
      } catch {}
    },
    _0x188fba = () => {
      const _0x3fe414 = _0x52465a(),
        _0x16d0c8 = shouldShowGenerationBusyUi(_0x3fe414);
      return (
        setBusyState({
          isGenerating: _0x16d0c8,
          cancelInFlight: _0x5960b6,
          taskId: String(_0xc5e21d || _0x3fe414['rhTaskId'] || _0x3fe414['taskId'] || ''),
        }),
        setLoading(_0x16d0c8),
        _0x16d0c8
      );
    },
    _0x1ec13e = ({ resetRecovering: resetRecovering = ![] } = {}) => {
      (_0x5324b5 && _0x5324b5['signal']['aborted'] !== !![] && _0x5324b5['abort'](),
        (_0x5324b5 = null),
        (_0x1e73bd = ''),
        (_0x3ab923 = null),
        resetRecovering &&
          _0x52465a()['rhTaskRecovering'] === !![] &&
          (_0xecc112['updateNodeData'](_0x114757, { rhTaskRecovering: ![] }),
          _0x10bcdf({ patch: { rhTaskRecovering: ![] } })));
    },
    _0x1695c9 = async (_0x4a743c, _0x59b632) => ({
      ...getResultPatch(await buildResultPatch(_0x4a743c, _0x59b632['startedAt'], _0x59b632)),
      rhStatusMessage: null,
      rhStatusCode: null,
    }),
    _0xe8dea0 = (_0x5644b5) => ({
      rhStatusMessage: _0x5644b5?.['message'] || _0x4eba51('generationFailed', 'Audio generation failed'),
      rhStatusCode: Number['isFinite'](Number(_0x5644b5?.['code'])) ? Number(_0x5644b5['code']) : null,
    }),
    _0x5e6cc9 = () => ({
      audioUrl: '',
      src: '',
      localPath: '',
      rhStatusMessage: _0x4eba51('interrupted', 'Audio\x20generation\x20interrupted'),
    }),
    _0x8ca2b3 = (_0x1eb909) => {
      const _0x81edc2 = normalizeProvider(_0x1eb909['provider']),
        _0xad7441 = {
          provider: _0x1eb909['provider'],
          audioWorkflowKey: _0x1eb909['audioWorkflowKey'],
          audioWorkflowLabel: _0x1eb909['audioWorkflowLabel'],
          model: _0x1eb909['audioWorkflowKey'],
        };
      return (
        isRunningHubProvider(_0x81edc2) && (_0xad7441['rhTaskUseOpenapiQuery'] = !![]),
        _0x81edc2 === 'runninghubwf' && (_0xad7441['rhInstanceType'] = _0x1eb909['rhInstanceType']),
        isRunningHubProvider(_0x81edc2) &&
          _0x1eb909['providerProfileId'] &&
          ((_0xad7441['providerProfileId'] = _0x1eb909['providerProfileId']),
          (_0xad7441['rhProviderProfileId'] = _0x1eb909['providerProfileId'])),
        _0xad7441
      );
    };
  async function _0x35bfbe({ payload: _0x193c33, startedAt: startedAt = now() } = {}) {
    if (_0x1cae52) return { ok: ![], status: 'disposed' };
    if (_0x466268) return _0x466268;
    if (!_0x193c33 || typeof _0x193c33 !== 'object')
      throw new Error('[audioTaskOrchestration] payload is required');
    _0x1ec13e({ resetRecovering: !![] });
    const _0x5cfef0 = normalizeProvider(_0x193c33['provider']),
      _0x2334ce = createAbortController();
    ((_0x7b2224 = _0x2334ce),
      (_0x2b94d2 = ![]),
      (_0x5960b6 = ![]),
      (_0x2fe015 = ![]),
      (_0xc5e21d = ''),
      (_0x29ce90 = String(_0x193c33['apiKey'] || '')['trim']()),
      (_0x4941ae = String(_0x193c33['providerProfileId'] || _0x193c33['rhProviderProfileId'] || '')[
        'trim'
      ]()),
      setBusyState({ isGenerating: !![], cancelInFlight: ![], taskId: '' }),
      setLoading(!![]));
    const _0x3dc427 = createGenerationSubmitPlan({
        kind: 'audio',
        sourceNodeId: _0x114757,
        targetNodeId: _0x114757,
        trigger: 'node',
        taskType: 'audio-generation',
        provider: _0x5cfef0,
        adapterType: _0x193c33['adapterType'] || 'workflow',
        modelId: _0x193c33['audioWorkflowKey'] || _0x52465a()['model'] || '',
        executionId: _0x193c33['executionId'],
        payload: _0x193c33,
        cancellable: supportsAudioTaskCancellation(_0x193c33),
        resumable: isRunningHubProvider(_0x5cfef0),
        pauseOnAbort: isRunningHubProvider(_0x5cfef0) ? 'afterTaskId' : ![],
        startBuilder: () => _0x8ca2b3(_0x193c33),
        persistTaskState: _0x10bcdf,
        submit: async (_0x572a82, _0x24c1c1) =>
          api['generateAudio'](_0x193c33, {
            signal: _0x2334ce['signal'],
            runningHubWorkflowQueueLease: _0x24c1c1['runningHubWorkflowQueueLease'],
            onTaskMeta: (_0x30eb58 = {}) => {
              const _0x31f8d4 = String(_0x30eb58['taskId'] || '')['trim']();
              if (!_0x31f8d4) return;
              ((_0x4941ae = String(
                _0x30eb58['providerProfileId'] || _0x30eb58['rhProviderProfileId'] || _0x4941ae,
              )['trim']()),
                (_0xc5e21d = _0x31f8d4),
                (_0x29ce90 =
                  String(_0x30eb58['apiKey'] || '')['trim']() ||
                  String(_0x193c33['apiKey'] || '')['trim']() ||
                  _0x29ce90),
                _0x24c1c1['onTaskId'](_0x31f8d4),
                _0x56eb30(_0x24c1c1, {
                  rhTaskUseOpenapiQuery: _0x30eb58['useOpenapiQuery'] === !![],
                  ...(_0x4941ae
                    ? {
                        taskProviderProfileId: _0x4941ae,
                        providerProfileId: _0x4941ae,
                        rhProviderProfileId: _0x4941ae,
                      }
                    : {}),
                }),
                _0x10bcdf({ taskId: _0x31f8d4 }),
                _0x2b94d2 && !_0x5960b6 && !_0x2fe015 && void _0x4a298a());
            },
            onTaskId: (_0x4190d7) => {
              const _0x1c79a3 = String(_0x4190d7 || '')['trim']();
              if (!_0x1c79a3) return;
              ((_0xc5e21d = _0x1c79a3),
                _0x24c1c1['onTaskId'](_0x1c79a3),
                _0x56eb30(_0x24c1c1, { rhTaskUseOpenapiQuery: !![] }),
                _0x10bcdf({ taskId: _0x1c79a3 }),
                _0x2b94d2 && !_0x5960b6 && !_0x2fe015 && void _0x4a298a());
            },
          }),
        cancel: async ({ taskId: _0x591a98 }) => {
          const _0x5d6275 = String(_0x29ce90 || _0x193c33['apiKey'] || '')['trim']();
          if (!_0x5d6275 || !_0x591a98) return;
          ((_0x2fe015 = !![]),
            await api['cancelRunningHubAudioTask']?.({
              apiKey: _0x5d6275,
              taskId: _0x591a98,
              ...(_0x4941ae || _0x193c33?.['providerProfileId'] || _0x193c33?.['rhProviderProfileId']
                ? {
                    providerProfileId:
                      _0x4941ae || _0x193c33?.['providerProfileId'] || _0x193c33?.['rhProviderProfileId'],
                  }
                : {}),
            }));
        },
        resultBuilder: _0x1695c9,
        failureBuilder: _0xe8dea0,
        cancelledBuilder: _0x5e6cc9,
        parseError: (_0x25c78d) =>
          _0x25c78d?.['message'] || _0x4eba51('generationFailed', 'Audio generation failed'),
      }),
      _0xbd706e = runtime['submitTask'](_0x3dc427, {
        store: _0xecc112,
        startedAt: startedAt,
        abortController: _0x2334ce,
      })
        ['then'](async (_0x8d9ad7) => {
          if (_0x8d9ad7?.['status'] === 'success' && !_0x1cae52 && _0x2334ce['signal']['aborted'] !== !![]) {
            const _0x172255 = getResultPatch(_0x8d9ad7['patch'] || _0x52465a());
            (await afterResultCommit(_0x172255, startedAt, _0x8d9ad7),
              await onSuccess(_0x8d9ad7, { recovering: ![], payload: _0x193c33 }));
          } else
            _0x8d9ad7?.['status'] === 'failed' &&
              !_0x1cae52 &&
              (await onFailure(_0x8d9ad7['error'], { payload: _0x193c33, result: _0x8d9ad7 }));
          return _0x8d9ad7;
        })
        ['finally'](() => {
          _0x466268 = null;
          if (_0x7b2224 === _0x2334ce) _0x7b2224 = null;
          const _0x4486c4 = _0x1cae52 ? ![] : _0x188fba();
          (!_0x4486c4 && ((_0xc5e21d = ''), !_0x2b94d2 && ((_0x29ce90 = ''), (_0x4941ae = ''))),
            (_0x2b94d2 = ![]),
            (_0x5960b6 = ![]),
            (_0x2fe015 = ![]));
        });
    return ((_0x466268 = _0xbd706e), _0xbd706e);
  }
  async function _0x4a298a() {
    if (!supportsAudioTaskCancellation(_0x52465a())) return { ok: ![], reason: 'not-cancellable' };
    _0x2b94d2 = !![];
    if (_0x5960b6) return { ok: !![], status: 'cancelling' };
    _0x5960b6 = !![];
    const _0xa44d3 = _0x52465a(),
      _0x26dc6f = String(_0xc5e21d || _0xa44d3['rhTaskId'] || '')['trim']();
    _0xc5e21d = _0x26dc6f;
    let _0x1790ef = String(_0x29ce90 || '')['trim']();
    const _0x43a566 = String(
      _0x4941ae ||
        _0xa44d3['taskProviderProfileId'] ||
        _0xa44d3['providerProfileId'] ||
        _0xa44d3['rhProviderProfileId'] ||
        '',
    )['trim']();
    if (!_0x1790ef)
      try {
        (await ensureConfig(),
          (_0x1790ef = String(getProviderConfig(_0x43a566 || 'runninghubwf')?.['apiKey'] || '')['trim']()));
      } catch {}
    _0x29ce90 = _0x1790ef;
    const _0x5aade5 = Number(_0xa44d3['generationStartTime'] || _0xa44d3['rhTaskStartedAt'] || 0x0),
      _0x4cf190 =
        _0xa44d3['generationDuration'] != null
          ? _0xa44d3['generationDuration']
          : _0x5aade5 > 0x0
            ? Math['max'](0x0, now() - _0x5aade5)
            : 0x0,
      _0x2c079f = createGenerationCancelPlanFromNode({
        kind: 'audio',
        node: _0xa44d3,
        payload: _0xa44d3,
        sourceNodeId: _0x114757,
        targetNodeId: _0x114757,
        trigger: 'node',
        taskType: 'audio-generation',
        taskProtocol: 'workflow',
        provider: normalizeProvider(_0xa44d3['provider']),
        adapterType: _0xa44d3['adapterType'] || 'workflow',
        modelId: _0xa44d3['audioWorkflowKey'] || _0xa44d3['model'] || '',
        executionId: _0xa44d3['executionId'],
        taskId: _0x26dc6f,
        startedAt: _0x5aade5,
        cancellable: supportsAudioTaskCancellation(_0xa44d3),
        resumable: !![],
        persistTaskState: _0x10bcdf,
      }),
      _0x42ad62 = ({ remoteResult: _0x98ab23, remoteError: _0x4f817a, startedAt: _0x23bda9 } = {}) => {
        const _0x2af585 = Number(_0x98ab23?.['code']),
          _0x53feba = !_0x26dc6f
            ? _0x4eba51(
                'interruptedMissingTaskId',
                'Audio generation interrupted before task id was available',
              )
            : _0x4f817a
              ? _0x4f817a['message'] || _0x4eba51('cancelFailed', 'Cancel failed')
              : _0x2af585 === 0x0
                ? _0x4eba51('cancelSuccess', 'Cancelled')
                : _0x2af585 === 0x327
                  ? _0x4eba51('cancelTaskMissing', 'Task no longer exists')
                  : _0x98ab23?.['msg'] || _0x4eba51('cancelFailed', 'Cancel failed');
        return {
          audioUrl: '',
          src: '',
          localPath: '',
          generationDuration: _0x4cf190,
          rhStatusMessage: _0x53feba,
          rhStatusCode: !_0x26dc6f ? 0x32d : Number['isFinite'](_0x2af585) ? _0x2af585 : null,
          ...buildRunningHubTaskPatch({
            taskId: _0x26dc6f,
            status: 'cancelled',
            startedAt: Number(_0x23bda9 || _0x5aade5 || 0x0),
            recovering: ![],
            useOpenapiQuery: _0xa44d3['rhTaskUseOpenapiQuery'] === !![],
          }),
        };
      };
    setBusyState({ isGenerating: !![], cancelInFlight: !![], taskId: _0x26dc6f });
    try {
      return (
        (_0x2fe015 = !![]),
        await runtime['cancelTask'](_0x114757, {
          store: _0xecc112,
          taskId: _0x26dc6f,
          cancellable: !![],
          cancel: async ({ taskId: _0x49d082 }) => {
            if (!_0x1790ef) throw new Error(_0x4eba51('missingApiKey', 'RunningHub API key is required'));
            return api['cancelRunningHubAudioTask']?.({
              apiKey: _0x1790ef,
              taskId: _0x49d082,
              ...(_0x43a566 || _0xa44d3?.['providerProfileId'] || _0xa44d3?.['rhProviderProfileId']
                ? {
                    providerProfileId:
                      _0x43a566 || _0xa44d3?.['providerProfileId'] || _0xa44d3?.['rhProviderProfileId'],
                  }
                : {}),
            });
          },
          cancelledBuilder: _0x42ad62,
          persistTaskState: _0x10bcdf,
          spec: { ..._0x2c079f, cancelledBuilder: _0x42ad62 },
        })
      );
    } finally {
      ((_0x5960b6 = ![]), (_0x2fe015 = ![]));
      const _0x16044c = _0x188fba();
      !_0x16044c && ((_0xc5e21d = ''), (_0x29ce90 = ''), (_0x4941ae = ''), (_0x2b94d2 = ![]));
    }
  }
  async function _0x3c20cb({ payload: _0x5f3154, startedAt: _0x581e41 } = {}) {
    if (_0x1cae52) return { ok: ![], status: 'disposed' };
    const _0x2c4202 = _0x52465a(),
      _0x5a4d2c = normalizeProvider(_0x2c4202['provider']),
      _0x4b13d7 = String(_0x2c4202['rhTaskId'] || '')['trim'](),
      _0x498ace = String(_0x2c4202['rhTaskStatus'] || '')
        ['trim']()
        ['toLowerCase']();
    if (
      !isRunningHubProvider(_0x5a4d2c) ||
      !_0x4b13d7 ||
      ['success', 'failed', 'idle', 'cancelled', 'canceled']['includes'](_0x498ace)
    )
      return (_0x1ec13e(), null);
    if (_0x1e73bd === _0x4b13d7 && _0x3ab923) return _0x3ab923;
    if (!_0x5f3154 || typeof _0x5f3154 !== 'object')
      throw new Error('[audioTaskOrchestration] resume payload is required');
    const _0x1faeca = Number(
        _0x581e41 || _0x2c4202['rhTaskStartedAt'] || _0x2c4202['generationStartTime'] || now(),
      ),
      _0x371918 = createAbortController();
    ((_0x5324b5 = _0x371918), (_0x1e73bd = _0x4b13d7), (_0xc5e21d = _0x4b13d7));
    const _0x15bfa1 = String(
      _0x2c4202['taskProviderProfileId'] ||
        _0x2c4202['providerProfileId'] ||
        _0x2c4202['rhProviderProfileId'] ||
        _0x5f3154['providerProfileId'] ||
        _0x5f3154['rhProviderProfileId'] ||
        '',
    )['trim']();
    _0x4941ae = _0x15bfa1;
    const _0x5a2e95 = {
      ..._0x5f3154,
      useOpenapiQuery: _0x2c4202['rhTaskUseOpenapiQuery'] !== ![],
      ...(_0x15bfa1 ? { providerProfileId: _0x15bfa1, rhProviderProfileId: _0x15bfa1 } : {}),
    };
    let _0x7e6cb5 = String(_0x5f3154['apiKey'] || _0x29ce90 || '')['trim']();
    if (!_0x7e6cb5)
      try {
        (await ensureConfig(),
          (_0x7e6cb5 = String(getProviderConfig(_0x15bfa1 || 'runninghubwf')?.['apiKey'] || '')['trim']()));
      } catch {}
    ((_0x29ce90 = _0x7e6cb5),
      setBusyState({ isGenerating: !![], cancelInFlight: ![], taskId: _0x4b13d7 }),
      setLoading(!![]));
    const _0x4acdeb = createGenerationResumePlanFromNode({
        kind: 'audio',
        node: _0x2c4202,
        payload: _0x5a2e95,
        sourceNodeId: _0x114757,
        targetNodeId: _0x114757,
        trigger: 'node',
        taskType: 'audio-generation',
        taskProtocol: 'workflow',
        provider: normalizeProvider(_0x5a2e95['provider'], _0x5a4d2c),
        adapterType: _0x5a2e95['adapterType'] || 'workflow',
        modelId: _0x5a2e95['audioWorkflowKey'] || _0x2c4202['model'] || '',
        executionId: _0x5a2e95['executionId'],
        taskId: _0x4b13d7,
        startedAt: _0x1faeca,
        cancellable: supportsAudioTaskCancellation(_0x5a2e95),
        resumable: !![],
        pauseOnAbort: !![],
        startBuilder: () => _0x8ca2b3(_0x5a2e95),
        persistTaskState: _0x10bcdf,
        poll: async () => {
          return (
            throwIfAborted(_0x371918['signal']),
            api['resumeRunningHubAudioTask'](_0x4b13d7, _0x5a2e95, {
              signal: _0x371918['signal'],
              useOpenapiQuery: _0x5a2e95['useOpenapiQuery'],
            })
          );
        },
        resultBuilder: async (_0x97fa0a, _0x508e8b) => ({
          ...(await _0x1695c9(_0x97fa0a, _0x508e8b)),
          rhStatusMessage: null,
          rhStatusCode: null,
          ...buildRunningHubTaskPatch({
            taskId: _0x4b13d7,
            status: 'success',
            startedAt: _0x508e8b['startedAt'],
            recovering: ![],
            useOpenapiQuery: _0x5a2e95['useOpenapiQuery'],
          }),
        }),
        failureBuilder: (_0x6e5bc4, _0x3a56e1) => ({
          ..._0xe8dea0(_0x6e5bc4),
          ...buildRunningHubTaskPatch({
            taskId: _0x4b13d7,
            status: 'failed',
            startedAt: _0x3a56e1['startedAt'],
            recovering: ![],
            useOpenapiQuery: _0x5a2e95['useOpenapiQuery'],
          }),
        }),
        cancelledBuilder: (_0xef4c00) => ({
          ..._0x5e6cc9(),
          ...buildRunningHubTaskPatch({
            taskId: _0x4b13d7,
            status: 'cancelled',
            startedAt: _0xef4c00['startedAt'],
            recovering: ![],
            useOpenapiQuery: _0x5a2e95['useOpenapiQuery'],
          }),
        }),
        parseError: (_0x4401b2) =>
          _0x4401b2?.['message'] || _0x4eba51('generationFailed', 'Audio generation failed'),
      }),
      _0x2e1c55 = runtime['resumeTask'](_0x4acdeb, {
        store: _0xecc112,
        startedAt: _0x1faeca,
        abortController: _0x371918,
      })
        ['then'](async (_0x48f49e) => {
          if (_0x48f49e?.['status'] === 'success' && !_0x1cae52 && _0x371918['signal']['aborted'] !== !![]) {
            const _0x4c6be1 = getResultPatch(_0x48f49e['patch'] || _0x52465a());
            (await afterResultCommit(_0x4c6be1, _0x1faeca, _0x48f49e),
              await onSuccess(_0x48f49e, { recovering: !![], payload: _0x5a2e95 }));
          } else
            _0x48f49e?.['status'] === 'failed' &&
              !_0x1cae52 &&
              (await onFailure(_0x48f49e['error'], {
                payload: _0x5a2e95,
                result: _0x48f49e,
                recovering: !![],
              }));
          return _0x48f49e;
        })
        ['catch']((_0x259080) => {
          if (isAbortLike(_0x259080, _0x371918['signal']))
            return { ok: !![], status: 'pending', paused: !![] };
          throw _0x259080;
        })
        ['finally'](() => {
          if (_0x5324b5 === _0x371918) _0x5324b5 = null;
          if (_0x1e73bd === _0x4b13d7) _0x1e73bd = '';
          _0x3ab923 = null;
          const _0x5b36ff = _0x1cae52 ? ![] : _0x188fba();
          if (!_0x5b36ff) _0xc5e21d = '';
        });
    return ((_0x3ab923 = _0x2e1c55), _0x2e1c55);
  }
  function _0x5b5f54() {
    const _0x1435ce = _0x52465a(),
      _0x9ec6d5 = String(
        _0x1435ce['jobStatus'] || _0x1435ce['rhTaskStatus'] || (_0x466268 || _0x3ab923 ? 'running' : 'idle'),
      );
    return {
      nodeId: _0x114757,
      jobStatus: _0x9ec6d5,
      isGenerating: !!_0x466268 || !!_0x3ab923 || _0x9ec6d5 === 'running' || _0x9ec6d5 === 'pending',
      taskId: String(_0xc5e21d || _0x1435ce['rhTaskId'] || _0x1435ce['taskId'] || ''),
      cancellable: supportsAudioTaskCancellation(_0x1435ce),
      resumable: Boolean(_0x1435ce['rhTaskId']),
      cancelInFlight: _0x5960b6,
    };
  }
  function _0x93b12({ preserveTask: preserveTask = ![] } = {}) {
    _0x1cae52 = !![];
    !preserveTask && _0x7b2224 && !_0x7b2224['signal']['aborted'] && _0x7b2224['abort']();
    _0x7b2224 = null;
    if (!preserveTask) _0x1ec13e();
  }
  return Object['freeze']({
    runGeneration: _0x35bfbe,
    cancelGeneration: _0x4a298a,
    getGenerationStatus: _0x5b5f54,
    resetRecovery: _0x1ec13e,
    resumeIfNeeded: _0x3c20cb,
    dispose: _0x93b12,
  });
}
