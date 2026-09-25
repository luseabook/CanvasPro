const RUN_KIND = 'story-summary-run',
  RUN_VERSION = 0x1,
  MAX_INVOCATIONS = 0x8,
  MAX_RAW_RESPONSE_CHARACTERS = 0x1d4c0;
let sequence = 0x0;
function normalizeText(_0x2f1d4c) {
  return String(_0x2f1d4c || '')['trim']();
}
function cloneJson(_0x2db363) {
  if (_0x2db363 == null) return _0x2db363;
  return JSON['parse'](JSON['stringify'](_0x2db363));
}
function stableSerialize(_0x2c510b) {
  if (Array['isArray'](_0x2c510b)) return '[' + _0x2c510b['map'](stableSerialize)['join'](',') + ']';
  if (_0x2c510b && typeof _0x2c510b === 'object')
    return (
      '{' +
      Object['keys'](_0x2c510b)
        ['sort']()
        ['map']((_0x74c25d) => JSON['stringify'](_0x74c25d) + ':' + stableSerialize(_0x2c510b[_0x74c25d]))
        ['join'](',') +
      '}'
    );
  return JSON['stringify'](_0x2c510b ?? null);
}
function fingerprint(_0x3f54ac) {
  const _0x2d6c78 = stableSerialize(_0x3f54ac);
  let _0x5de1f6 = 0x811c9dc5;
  for (let _0x177edf = 0x0; _0x177edf < _0x2d6c78['length']; _0x177edf += 0x1) {
    ((_0x5de1f6 ^= _0x2d6c78['charCodeAt'](_0x177edf)), (_0x5de1f6 = Math['imul'](_0x5de1f6, 0x1000193)));
  }
  return 'fnv1a-' + (_0x5de1f6 >>> 0x0)['toString'](0x10)['padStart'](0x8, '0');
}
function createInput({ project: project = {}, request: request = {} } = {}) {
  return {
    projectId: normalizeText(project['id']),
    sourceFingerprint: fingerprint({
      mode: request['mode'],
      scriptMode: request['scriptMode'],
      idea: request['idea'],
      sourceText: request['sourceText'],
      fileName: request['fileName'],
      rewriteInstruction: request['rewriteInstruction'],
      visualStyle: request['visualStyle'],
      planning: request['planning'],
    }),
    execution: {
      modelId: normalizeText(request['model'] || request['modelId']),
      provider: normalizeText(request['provider']),
      providerProfileId: normalizeText(request['providerProfileId']),
    },
    promptVersion: request['mode'] === 'rewrite' ? 'story-summary-rewrite/v1' : 'story-summary/v3',
    schemaVersion: 'story-summary/v2',
  };
}
function normalizeInvocation(_0xd32edd = {}) {
  return {
    id: normalizeText(_0xd32edd['id']),
    stepId: normalizeText(_0xd32edd['stepId']),
    attempt: Math['max'](0x1, Math['trunc'](Number(_0xd32edd['attempt']) || 0x1)),
    state: normalizeText(_0xd32edd['state']),
    requestFingerprint: normalizeText(_0xd32edd['requestFingerprint']),
    rawResponse: String(_0xd32edd['rawResponse'] || '')['slice'](0x0, MAX_RAW_RESPONSE_CHARACTERS),
    error: normalizeText(_0xd32edd['error']),
    preparedAt: Math['max'](0x0, Number(_0xd32edd['preparedAt'] || 0x0)),
    completedAt: Math['max'](0x0, Number(_0xd32edd['completedAt'] || 0x0)),
    retryAuthorizedAt: Math['max'](0x0, Number(_0xd32edd['retryAuthorizedAt'] || 0x0)),
  };
}
export function normalizeStorySummaryRun(_0x2b6cc1) {
  const _0x3a8e15 = _0x2b6cc1?.['kind'] === RUN_KIND && _0x2b6cc1?.['run'] ? _0x2b6cc1['run'] : _0x2b6cc1;
  if (_0x3a8e15?.['kind'] !== RUN_KIND || Number(_0x3a8e15?.['version']) !== RUN_VERSION) return null;
  return {
    kind: RUN_KIND,
    version: RUN_VERSION,
    id: normalizeText(_0x3a8e15['id']),
    status: normalizeText(_0x3a8e15['status']) || 'running',
    inputFingerprint: normalizeText(_0x3a8e15['inputFingerprint']),
    input: cloneJson(_0x3a8e15['input'] || {}),
    invocations: (Array['isArray'](_0x3a8e15['invocations']) ? _0x3a8e15['invocations'] : [])
      ['map'](normalizeInvocation)
      ['filter']((_0x1fc27d) => _0x1fc27d['id'] && _0x1fc27d['stepId'])
      ['slice'](-MAX_INVOCATIONS),
    candidateArtifact: cloneJson(_0x3a8e15['candidateArtifact'] || null),
    error: normalizeText(_0x3a8e15['error']),
    createdAt: Math['max'](0x0, Number(_0x3a8e15['createdAt'] || 0x0)) || Date['now'](),
    updatedAt: Math['max'](0x0, Number(_0x3a8e15['updatedAt'] || 0x0)) || Date['now'](),
  };
}
function createRun(_0x17d3e6) {
  const _0x284cd6 = createInput(_0x17d3e6),
    _0x3e9b19 = Date['now']();
  return (
    (sequence += 0x1),
    {
      kind: RUN_KIND,
      version: RUN_VERSION,
      id: 'story-summary:' + (_0x284cd6['projectId'] || 'project') + ':' + _0x3e9b19 + ':' + sequence,
      status: 'running',
      inputFingerprint: fingerprint(_0x284cd6),
      input: _0x284cd6,
      invocations: [],
      candidateArtifact: null,
      error: '',
      createdAt: _0x3e9b19,
      updatedAt: _0x3e9b19,
    }
  );
}
function canResume(_0x4f1559, _0x261852) {
  if (!_0x4f1559 || !['running', 'failed_retryable', 'ready_to_commit']['includes'](_0x4f1559['status']))
    return ![];
  return (
    _0x4f1559['inputFingerprint'] ===
    fingerprint(
      createInput({
        ..._0x261852,
        request: {
          ..._0x261852['request'],
          model: _0x4f1559['input']['execution']['modelId'],
          modelId: _0x4f1559['input']['execution']['modelId'],
          provider: _0x4f1559['input']['execution']['provider'],
          providerProfileId: _0x4f1559['input']['execution']['providerProfileId'],
        },
      }),
    )
  );
}
function requiresPaidRetry(_0x5ebc7c) {
  if (_0x5ebc7c['status'] === 'ready_to_commit' && _0x5ebc7c['candidateArtifact']) return ![];
  return _0x5ebc7c['invocations']['some'](
    (_0x52dcd6) =>
      !_0x52dcd6['retryAuthorizedAt'] &&
      ['prepared', 'outcome-unknown', 'completed']['includes'](_0x52dcd6['state']),
  );
}
export function createStorySummaryRunRecorder({
  project: project = {},
  request: request = {},
  resumePayload: resumePayload = null,
  onChange: onChange = null,
} = {}) {
  const _0x4b39f8 = normalizeStorySummaryRun(resumePayload);
  let _0x3d9eda = canResume(_0x4b39f8, { project: project, request: request })
    ? _0x4b39f8
    : createRun({ project: project, request: request });
  const _0x374a35 = async () => {
    ((_0x3d9eda['updatedAt'] = Date['now']()), await onChange?.(cloneJson(_0x3d9eda)));
  };
  return Object['freeze']({
    get execution() {
      return cloneJson(_0x3d9eda['input']['execution']);
    },
    get candidateArtifact() {
      return _0x3d9eda['status'] === 'ready_to_commit' ? cloneJson(_0x3d9eda['candidateArtifact']) : null;
    },
    get requiresPaidRetry() {
      return requiresPaidRetry(_0x3d9eda);
    },
    payload: () => ({ kind: RUN_KIND, run: cloneJson(_0x3d9eda) }),
    async start() {
      (!(_0x3d9eda['status'] === 'ready_to_commit' && _0x3d9eda['candidateArtifact']) &&
        ((_0x3d9eda['status'] = 'running'), (_0x3d9eda['error'] = '')),
        await _0x374a35());
    },
    async authorizePaidRetry() {
      const _0x19738e = Date['now']();
      ((_0x3d9eda['invocations'] = _0x3d9eda['invocations']['map']((_0x46cc0a) =>
        !_0x46cc0a['retryAuthorizedAt'] &&
        ['prepared', 'outcome-unknown', 'completed']['includes'](_0x46cc0a['state'])
          ? { ..._0x46cc0a, retryAuthorizedAt: _0x19738e }
          : _0x46cc0a,
      )),
        await _0x374a35());
    },
    async onInvocation(_0xc4b56 = {}) {
      const _0x4a4f27 = Date['now']();
      if (_0xc4b56['state'] === 'prepared')
        ((sequence += 0x1),
          _0x3d9eda['invocations']['push'](
            normalizeInvocation({
              id:
                _0x3d9eda['id'] +
                ':' +
                normalizeText(_0xc4b56['stepId']) +
                ':' +
                _0xc4b56['attempt'] +
                ':' +
                sequence,
              stepId: _0xc4b56['stepId'],
              attempt: _0xc4b56['attempt'],
              state: 'prepared',
              requestFingerprint: fingerprint({
                model: _0xc4b56['requestPayload']?.['model'],
                provider: _0xc4b56['requestPayload']?.['provider'],
                prompt: _0xc4b56['requestPayload']?.['prompt'],
              }),
              preparedAt: _0x4a4f27,
            }),
          ));
      else {
        const _0x48b87e = [..._0x3d9eda['invocations']]
          ['reverse']()
          ['find'](
            (_0x5b6aac) =>
              _0x5b6aac['stepId'] === normalizeText(_0xc4b56['stepId']) &&
              _0x5b6aac['attempt'] === Math['max'](0x1, Math['trunc'](Number(_0xc4b56['attempt']) || 0x1)) &&
              _0x5b6aac['state'] === 'prepared',
          );
        _0x48b87e &&
          ((_0x48b87e['state'] = normalizeText(_0xc4b56['state'])),
          (_0x48b87e['rawResponse'] = String(_0xc4b56['rawResponse'] || '')['slice'](
            0x0,
            MAX_RAW_RESPONSE_CHARACTERS,
          )),
          (_0x48b87e['error'] = normalizeText(_0xc4b56['error'])),
          (_0x48b87e['completedAt'] = _0x4a4f27));
      }
      ((_0x3d9eda['invocations'] = _0x3d9eda['invocations']['slice'](-MAX_INVOCATIONS)), await _0x374a35());
    },
    async ready(_0x5bdad5) {
      ((_0x3d9eda['status'] = 'ready_to_commit'),
        (_0x3d9eda['candidateArtifact'] = cloneJson(_0x5bdad5)),
        await _0x374a35());
    },
    async failed(_0x3e029e) {
      ((_0x3d9eda['status'] = 'failed_retryable'),
        (_0x3d9eda['error'] = normalizeText(_0x3e029e?.['message'] || _0x3e029e)),
        await _0x374a35());
    },
    async succeeded() {
      ((_0x3d9eda['status'] = 'succeeded'),
        (_0x3d9eda['candidateArtifact'] = null),
        (_0x3d9eda['error'] = ''),
        await _0x374a35());
    },
  });
}
