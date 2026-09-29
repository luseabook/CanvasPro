import { runTaskBatchQueue } from '../core/taskBatchExecution.js';
function normalizeText(_0x4d362c) {
  return String(_0x4d362c || '')['trim']();
}
export function createAudioVoiceGenerationOwnerKey(_0x364e4c, _0x131f7a) {
  return (normalizeText(_0x364e4c) || 'source') + '\x1f' + normalizeText(_0x131f7a);
}
export function normalizeAudioVoiceBatchConcurrencyLimit(_0xd4a5d3, _0x44f553 = 0x1) {
  const _0x23359d = Number(_0x44f553),
    _0x4cb063 =
      Number['isFinite'](_0x23359d) && _0x23359d > 0x0 ? Math['max'](0x1, Math['floor'](_0x23359d)) : 0x1,
    _0xb63ddd = Number(_0xd4a5d3);
  if (!Number['isFinite'](_0xb63ddd) || _0xb63ddd <= 0x0) return _0x4cb063;
  return Math['max'](0x1, Math['floor'](_0xb63ddd));
}
export function resolveAudioVoiceProviderBatchConcurrency(_0x1592d7 = {}, _0x2812da = {}, _0x1d07e8 = 0x1) {
  const _0x181db8 = normalizeText(_0x2812da?.['provider'])['toLowerCase'](),
    _0x2b696f = normalizeText(_0x2812da?.['adapterType'])['toLowerCase'](),
    _0x2cbf9f = _0x181db8 === 'runninghubwf' || (_0x181db8 === 'runninghub' && _0x2b696f === 'workflow'),
    _0x1138dc = _0x181db8 === 'runninghub' && _0x2b696f === 'modelapi';
  if (_0x2cbf9f)
    return normalizeAudioVoiceBatchConcurrencyLimit(
      _0x1592d7['workflowConcurrentLimit'] ??
        _0x1592d7['runninghubWorkflowConcurrentLimit'] ??
        _0x1592d7['concurrentLimit'],
      _0x1d07e8,
    );
  if (_0x1138dc)
    return normalizeAudioVoiceBatchConcurrencyLimit(
      _0x1592d7['modelConcurrentLimit'] ??
        _0x1592d7['runninghubModelConcurrentLimit'] ??
        _0x1592d7['concurrentLimit'],
      _0x1d07e8,
    );
  return normalizeAudioVoiceBatchConcurrencyLimit(_0x1592d7['concurrentLimit'], _0x1d07e8);
}
export async function resolveAudioVoiceProviderBatchConcurrencyWithProbe(
  _0x399591 = {},
  _0x1b12e2 = {},
  _0x37a7c2 = {},
) {
  const _0x824a5 = resolveAudioVoiceProviderBatchConcurrency(_0x399591, _0x1b12e2),
    _0x33b161 = normalizeText(_0x1b12e2?.['provider'])['toLowerCase'](),
    _0x556eff = normalizeText(_0x1b12e2?.['adapterType'])['toLowerCase'](),
    _0x1d9b69 = _0x33b161 === 'runninghubwf' || (_0x33b161 === 'runninghub' && _0x556eff === 'workflow'),
    _0x496ba7 =
      typeof _0x37a7c2['fetchRunningHubWorkflowQueueStatus'] === 'function'
        ? _0x37a7c2['fetchRunningHubWorkflowQueueStatus']
        : null,
    _0x1272fe = normalizeText(_0x399591?.['apiKey']);
  if (!_0x1d9b69 || !_0x496ba7 || !_0x1272fe) return _0x824a5;
  const _0x53956a = await _0x496ba7(_0x399591)['catch'](() => null);
  return normalizeAudioVoiceBatchConcurrencyLimit(_0x53956a?.['concurrentLimit'] ?? _0x824a5, _0x824a5);
}
export async function runAudioVoiceBatchGenerationQueue(_0x3aec70 = [], _0x4ad996, _0x33130a = {}) {
  const _0x27a742 = Array['isArray'](_0x3aec70) ? _0x3aec70['filter'](Boolean) : [];
  if (!_0x27a742['length'] || typeof _0x4ad996 !== 'function') return [];
  return runTaskBatchQueue({
    targets: _0x27a742,
    concurrency: _0x33130a['concurrency'],
    shouldStop: _0x33130a['shouldStop'],
    onTargetStart: _0x33130a['onTargetStart'],
    onTargetSettled: _0x33130a['onTargetSettled'],
    runTarget: _0x4ad996,
  });
}
export function createAudioVoiceGenerationTaskStoreAdapter({
  sourceNodeId: sourceNodeId = '',
  segmentId: segmentId = '',
  targetNodeId: targetNodeId = '',
  readCurrentSourceNodeId: readCurrentSourceNodeId = () => '',
  readCurrentSegment: readCurrentSegment = () => ({}),
  updateCurrentSegment: updateCurrentSegment = () => {},
  readPersistedSnapshot: readPersistedSnapshot = () => null,
  writePersistedSnapshot: writePersistedSnapshot = () => {},
  buildTaskNode: buildTaskNode = (_0x5553ea) => _0x5553ea,
} = {}) {
  const _0x22d85f = normalizeText(sourceNodeId),
    _0xdf1614 = normalizeText(segmentId),
    _0x3109c3 = normalizeText(targetNodeId);
  function _0x27aff6() {
    return normalizeText(readCurrentSourceNodeId()) === _0x22d85f;
  }
  function _0x38082a() {
    if (_0x27aff6()) return readCurrentSegment(_0xdf1614) || {};
    const _0x1d3599 = readPersistedSnapshot(_0x22d85f);
    return (
      _0x1d3599?.['segments']?.['find']((_0x12b269) => normalizeText(_0x12b269?.['id']) === _0xdf1614) || {}
    );
  }
  return {
    getState() {
      return { nodes: { [_0x3109c3]: buildTaskNode(_0x38082a()) } };
    },
    updateNodeData(_0x14db1f, _0x380ba2 = {}) {
      if (normalizeText(_0x14db1f) !== _0x3109c3) return;
      if (_0x27aff6()) {
        updateCurrentSegment(_0xdf1614, _0x380ba2);
        return;
      }
      const _0x426c79 = readPersistedSnapshot(_0x22d85f);
      if (!_0x426c79 || !Array['isArray'](_0x426c79['segments'])) return;
      const _0x1dcd59 = _0x426c79['segments']['findIndex'](
        (_0x2290d0) => normalizeText(_0x2290d0?.['id']) === _0xdf1614,
      );
      if (_0x1dcd59 < 0x0) return;
      writePersistedSnapshot(_0x22d85f, {
        ..._0x426c79,
        segments: _0x426c79['segments']['map']((_0x12240f, _0x31c26c) =>
          _0x31c26c === _0x1dcd59 ? { ..._0x12240f, ..._0x380ba2 } : _0x12240f,
        ),
      });
    },
    addNode() {},
  };
}
export function createAudioVoiceGenerationTaskOrchestration({ createStore: _0x228ff5 } = {}) {
  if (typeof _0x228ff5 !== 'function')
    throw new Error('[audioVoiceGeneration]\x20createStore\x20is\x20required');
  const _0xdd1433 = new Map(),
    _0x1fe670 = new Map();
  let _0xad8658 = 0x0;
  function _0x58c313(_0xfb52c7 = {}) {
    const _0xfde080 = normalizeText(_0xfb52c7['sourceNodeId']),
      _0x499382 = normalizeText(_0xfb52c7['segmentId']),
      _0x59eae9 = normalizeText(_0xfb52c7['targetNodeId']);
    return {
      sourceNodeId: _0xfde080,
      segmentId: _0x499382,
      targetNodeId: _0x59eae9,
      key: createAudioVoiceGenerationOwnerKey(_0xfde080, _0x499382),
    };
  }
  function _0xd48e33(_0x51a493 = {}) {
    const _0x146198 = _0x58c313(_0x51a493),
      _0xfd10ca = _0xdd1433['get'](_0x146198['key']);
    if (_0xfd10ca) return _0xfd10ca;
    const _0x1e2fd4 = { ..._0x146198, store: null };
    return (
      (_0x1e2fd4['store'] = _0x228ff5(_0x1e2fd4)),
      _0xdd1433['set'](_0x1e2fd4['key'], _0x1e2fd4),
      _0x1e2fd4
    );
  }
  function _0x4d17f7(_0x51052a = {}) {
    return _0xd48e33(_0x51052a)['store'];
  }
  function _0x10c88d(_0x4a7a00 = {}, { abortController: abortController = null } = {}) {
    const _0x3ab6a3 = _0xd48e33(_0x4a7a00),
      _0x5d4b72 = _0x1fe670['get'](_0x3ab6a3['key']);
    if (_0x5d4b72) return _0x5d4b72;
    const _0x1c50ac = {
      ..._0x3ab6a3,
      id: ++_0xad8658,
      abortController: abortController,
      apiKey: '',
      cancelInFlight: ![],
      cancelRequested: ![],
    };
    return (_0x1fe670['set'](_0x3ab6a3['key'], _0x1c50ac), _0x1c50ac);
  }
  function _0x1ee879(_0x5de730, _0x2cbc77) {
    return _0x1fe670['get'](createAudioVoiceGenerationOwnerKey(_0x5de730, _0x2cbc77)) || null;
  }
  function _0xebc933(_0x1b488c) {
    return !!_0x1b488c && _0x1fe670['get'](_0x1b488c['key']) === _0x1b488c;
  }
  function _0x138f6a(_0x258071) {
    if (!_0xebc933(_0x258071)) return ![];
    return (_0x1fe670['delete'](_0x258071['key']), !![]);
  }
  function _0x50f659(_0x40616c, _0x1f403a) {
    if (!_0xebc933(_0x40616c)) return ![];
    _0x40616c['cancelInFlight'] = _0x1f403a === !![];
    if (_0x40616c['cancelInFlight']) _0x40616c['cancelRequested'] = !![];
    return !![];
  }
  return {
    begin: _0x10c88d,
    finish: _0x138f6a,
    getRun: _0x1ee879,
    getStore: _0x4d17f7,
    isCancelInFlight: (_0x5cd61a, _0x292f70) => _0x1ee879(_0x5cd61a, _0x292f70)?.['cancelInFlight'] === !![],
    isCurrent: _0xebc933,
    setCancelInFlight: _0x50f659,
  };
}
