import { buildVideoReplicationSourceEvidence } from '../../domain/storyGeneration/videoReplicationSourceAnalysis.js';
const RUN_KIND = 'story-episode-split-run',
  RUN_VERSION = 0x1,
  MAX_INVOCATIONS = 0x20,
  MAX_RAW_RESPONSE_CHARACTERS = 0x27100;
let sequence = 0x0;
function normalizeText(_0xd8ee43) {
  return String(_0xd8ee43 || '')['trim']();
}
function cloneJson(_0xe4be06) {
  if (_0xe4be06 == null) return _0xe4be06;
  return JSON['parse'](JSON['stringify'](_0xe4be06));
}
function stableSerialize(_0x59530f) {
  if (Array['isArray'](_0x59530f)) return '[' + _0x59530f['map'](stableSerialize)['join'](',') + ']';
  if (_0x59530f && typeof _0x59530f === 'object')
    return (
      '{' +
      Object['keys'](_0x59530f)
        ['sort']()
        ['map']((_0x3d2cb7) => JSON['stringify'](_0x3d2cb7) + ':' + stableSerialize(_0x59530f[_0x3d2cb7]))
        ['join'](',') +
      '}'
    );
  return JSON['stringify'](_0x59530f ?? null);
}
function fingerprint(_0x3a77f7) {
  const _0x5ce9cd = stableSerialize(_0x3a77f7);
  let _0x45db22 = 0x811c9dc5;
  for (let _0x23946e = 0x0; _0x23946e < _0x5ce9cd['length']; _0x23946e += 0x1) {
    ((_0x45db22 ^= _0x5ce9cd['charCodeAt'](_0x23946e)), (_0x45db22 = Math['imul'](_0x45db22, 0x1000193)));
  }
  return 'fnv1a-' + (_0x45db22 >>> 0x0)['toString'](0x10)['padStart'](0x8, '0');
}
function normalizeExecution(_0x59ce33 = {}) {
  return {
    modelId: normalizeText(_0x59ce33['modelId']),
    provider: normalizeText(_0x59ce33['provider']),
    providerProfileId: normalizeText(_0x59ce33['providerProfileId']),
  };
}
function fingerprintAppearance(_0x1d19d3 = {}) {
  const _0x5bdf51 = { ..._0x1d19d3 };
  for (const _0x36f3e5 of ['scriptFacts', 'visualDesign', 'referenceImageUrl']) {
    if (!normalizeText(_0x5bdf51[_0x36f3e5])) delete _0x5bdf51[_0x36f3e5];
  }
  return _0x5bdf51;
}
function createInput(
  {
    project: project = {},
    episode: episode = {},
    assets: assets = [],
    constraints: constraints = {},
    execution: execution = {},
    mode: mode = 'standard',
    promptExperiment: promptExperiment = ![],
  } = {},
  _0x1e206f = !![],
) {
  return {
    projectId: normalizeText(project['id']),
    episodeId: normalizeText(episode['id']),
    episodeRef: normalizeText(episode['ref'] || episode['planningRef'] || episode['id']),
    mode: normalizeText(mode) || 'standard',
    promptExperiment: promptExperiment === !![],
    promptMode: normalizeText(constraints?.['promptMode']),
    sourceFingerprint: fingerprint({
      scriptMode: project['scriptMode'],
      summaryRevision: project['summaryRevision'],
      outlineRevision: project['outlineSourceSummaryRevision'],
      ...(project['sourceMode'] === 'video-replication'
        ? {
            replication: project['replication'],
            sourceEvidence: buildVideoReplicationSourceEvidence(episode, project, assets),
          }
        : {}),
      episode: {
        title: episode['title'],
        synopsis: episode['synopsis'],
        hook: episode['hook'],
        script: episode['script']?.['fullText'],
        scenes: episode['script']?.['scenes'],
      },
      assets: (Array['isArray'](assets) ? assets : [])['map']((_0x24ce60) => ({
        id: _0x24ce60?.['id'],
        ref: _0x24ce60?.['ref'],
        name: _0x24ce60?.['name'],
        kind: _0x24ce60?.['kind'],
        ...(project['sourceMode'] === 'video-replication'
          ? { description: _0x24ce60?.['description'], prompt: _0x24ce60?.['prompt'] }
          : {}),
        appearances:
          _0x1e206f && Array['isArray'](_0x24ce60?.['appearances'])
            ? _0x24ce60['appearances']['map'](fingerprintAppearance)
            : _0x24ce60?.['appearances'],
      })),
      constraints: constraints,
    }),
    execution: normalizeExecution(execution),
    promptVersion:
      project['sourceMode'] === 'video-replication'
        ? episode['replication']?.['sourceAnalysis']?.['speechEvidence']
          ? 'replication-asr/v5-observed-picture'
          : 'replication-segment-plan/v6-user-review'
        : mode === 'experimental'
          ? 'episode-split-experimental/v3'
          : 'episode-split/v2',
    schemaVersion: 'story-episode-split/v2',
  };
}
function normalizeInvocation(_0x5b690a = {}) {
  return {
    id: normalizeText(_0x5b690a['id']),
    stepId: normalizeText(_0x5b690a['stepId']),
    attempt: Math['max'](0x1, Math['trunc'](Number(_0x5b690a['attempt']) || 0x1)),
    state: normalizeText(_0x5b690a['state']),
    requestFingerprint: normalizeText(_0x5b690a['requestFingerprint']),
    rawResponse: String(_0x5b690a['rawResponse'] || '')['slice'](0x0, MAX_RAW_RESPONSE_CHARACTERS),
    error: normalizeText(_0x5b690a['error']),
    preparedAt: Math['max'](0x0, Number(_0x5b690a['preparedAt'] || 0x0)),
    completedAt: Math['max'](0x0, Number(_0x5b690a['completedAt'] || 0x0)),
    retryAuthorizedAt: Math['max'](0x0, Number(_0x5b690a['retryAuthorizedAt'] || 0x0)),
    metrics: cloneJson(_0x5b690a['metrics'] || null),
  };
}
export function normalizeStoryEpisodeSplitRun(_0x4f248) {
  const _0x40ecb8 = _0x4f248?.['kind'] === RUN_KIND && _0x4f248?.['run'] ? _0x4f248['run'] : _0x4f248;
  if (
    !_0x40ecb8 ||
    typeof _0x40ecb8 !== 'object' ||
    Array['isArray'](_0x40ecb8) ||
    _0x40ecb8['kind'] !== RUN_KIND ||
    Number(_0x40ecb8['version']) !== RUN_VERSION
  )
    return null;
  return {
    kind: RUN_KIND,
    version: RUN_VERSION,
    id: normalizeText(_0x40ecb8['id']),
    status: normalizeText(_0x40ecb8['status']) || 'running',
    inputFingerprint: normalizeText(_0x40ecb8['inputFingerprint']),
    input: cloneJson(_0x40ecb8['input'] || {}),
    checkpoint: cloneJson(_0x40ecb8['checkpoint'] || null),
    checkpointAt: Math['max'](0x0, Number(_0x40ecb8['checkpointAt'] || 0x0)),
    qualityReview: cloneJson(_0x40ecb8['qualityReview'] || null),
    generatedCandidate: cloneJson(_0x40ecb8['generatedCandidate'] || null),
    invocations: (Array['isArray'](_0x40ecb8['invocations']) ? _0x40ecb8['invocations'] : [])
      ['map'](normalizeInvocation)
      ['filter']((_0x4ff74c) => _0x4ff74c['id'] && _0x4ff74c['stepId'])
      ['slice'](-MAX_INVOCATIONS),
    candidateArtifact: cloneJson(_0x40ecb8['candidateArtifact'] || null),
    error: normalizeText(_0x40ecb8['error']),
    createdAt: Math['max'](0x0, Number(_0x40ecb8['createdAt'] || 0x0)) || Date['now'](),
    updatedAt: Math['max'](0x0, Number(_0x40ecb8['updatedAt'] || 0x0)) || Date['now'](),
  };
}
function createRun(_0x59616b) {
  const _0x911205 = createInput(_0x59616b),
    _0x368b51 = Date['now']();
  return (
    (sequence += 0x1),
    {
      kind: RUN_KIND,
      version: RUN_VERSION,
      id:
        'episode-split:' +
        (_0x911205['projectId'] || 'project') +
        ':' +
        (_0x911205['episodeId'] || _0x911205['episodeRef']) +
        ':' +
        _0x368b51 +
        ':' +
        sequence,
      status: 'running',
      inputFingerprint: fingerprint(_0x911205),
      input: _0x911205,
      checkpoint: null,
      checkpointAt: 0x0,
      qualityReview: null,
      generatedCandidate: null,
      invocations: [],
      candidateArtifact: null,
      error: '',
      createdAt: _0x368b51,
      updatedAt: _0x368b51,
    }
  );
}
function isResumable(_0x272720, _0x57a7dc) {
  if (!_0x272720 || !['running', 'failed_retryable', 'ready_to_commit']['includes'](_0x272720['status']))
    return ![];
  const _0xadb01e = _0x272720['status'] === 'ready_to_commit' && _0x272720['candidateArtifact'],
    _0x126a8b = { ..._0x57a7dc, ...(_0xadb01e ? { execution: _0x272720['input']['execution'] } : {}) };
  return (
    _0x272720['inputFingerprint'] === fingerprint(createInput(_0x126a8b)) ||
    _0x272720['inputFingerprint'] === fingerprint(createInput(_0x126a8b, ![]))
  );
}
function hasUncommittedPaidCall(_0x373d31) {
  if (_0x373d31['status'] === 'ready_to_commit' && _0x373d31['candidateArtifact']) return ![];
  return _0x373d31['invocations']['some']((_0x185c57) => {
    if (_0x185c57['retryAuthorizedAt']) return ![];
    if (['prepared', 'outcome-unknown']['includes'](_0x185c57['state'])) return !![];
    return _0x185c57['state'] === 'completed' && _0x185c57['completedAt'] > _0x373d31['checkpointAt'];
  });
}
export function createStoryEpisodeSplitRunRecorder({
  resumePayload: resumePayload = null,
  onChange: onChange = null,
  ..._0x85e705
} = {}) {
  const _0x4a00d7 = normalizeStoryEpisodeSplitRun(resumePayload);
  let _0x294420 = isResumable(_0x4a00d7, _0x85e705) ? _0x4a00d7 : createRun(_0x85e705);
  const _0x5b901f = async () => {
      ((_0x294420['updatedAt'] = Date['now']()), await onChange?.(cloneJson(_0x294420)));
    },
    _0x3530e0 = () => ({ kind: RUN_KIND, run: cloneJson(_0x294420) });
  return Object['freeze']({
    get execution() {
      return cloneJson(_0x294420['input']['execution']);
    },
    get checkpoint() {
      return cloneJson(_0x294420['checkpoint']);
    },
    get candidateArtifact() {
      return _0x294420['status'] === 'ready_to_commit' ? cloneJson(_0x294420['candidateArtifact']) : null;
    },
    get qualityReview() {
      return cloneJson(_0x294420['qualityReview']);
    },
    get generatedCandidate() {
      return cloneJson(_0x294420['generatedCandidate']);
    },
    get requiresPaidRetry() {
      return hasUncommittedPaidCall(_0x294420);
    },
    payload: _0x3530e0,
    async start() {
      (!(_0x294420['status'] === 'ready_to_commit' && _0x294420['candidateArtifact']) &&
        ((_0x294420['status'] = 'running'), (_0x294420['error'] = '')),
        await _0x5b901f());
    },
    async authorizePaidRetry() {
      const _0x4ab12e = Date['now']();
      ((_0x294420['invocations'] = _0x294420['invocations']['map']((_0xa51542) =>
        !_0xa51542['retryAuthorizedAt'] &&
        (['prepared', 'outcome-unknown']['includes'](_0xa51542['state']) ||
          (_0xa51542['state'] === 'completed' && _0xa51542['completedAt'] > _0x294420['checkpointAt']))
          ? { ..._0xa51542, retryAuthorizedAt: _0x4ab12e }
          : _0xa51542,
      )),
        await _0x5b901f());
    },
    async onInvocation(_0x42bdf4 = {}) {
      const _0x3348d7 = Date['now']();
      if (_0x42bdf4['state'] === 'prepared')
        ((sequence += 0x1),
          _0x294420['invocations']['push'](
            normalizeInvocation({
              id:
                _0x294420['id'] +
                ':' +
                normalizeText(_0x42bdf4['stepId']) +
                ':' +
                _0x42bdf4['attempt'] +
                ':' +
                sequence,
              stepId: _0x42bdf4['stepId'],
              attempt: _0x42bdf4['attempt'],
              state: 'prepared',
              requestFingerprint: fingerprint({
                model: _0x42bdf4['requestPayload']?.['model'],
                provider: _0x42bdf4['requestPayload']?.['provider'],
                prompt: _0x42bdf4['requestPayload']?.['prompt'],
              }),
              preparedAt: _0x3348d7,
            }),
          ));
      else {
        const _0xd208dc = [..._0x294420['invocations']]
          ['reverse']()
          ['find'](
            (_0x54856a) =>
              _0x54856a['stepId'] === normalizeText(_0x42bdf4['stepId']) &&
              _0x54856a['attempt'] === Math['max'](0x1, Math['trunc'](Number(_0x42bdf4['attempt']) || 0x1)) &&
              _0x54856a['state'] === 'prepared',
          );
        _0xd208dc &&
          ((_0xd208dc['state'] = normalizeText(_0x42bdf4['state'])),
          (_0xd208dc['rawResponse'] = String(_0x42bdf4['rawResponse'] || '')['slice'](
            0x0,
            MAX_RAW_RESPONSE_CHARACTERS,
          )),
          (_0xd208dc['error'] = normalizeText(_0x42bdf4['error'])),
          (_0xd208dc['completedAt'] = _0x3348d7),
          (_0xd208dc['metrics'] = cloneJson(_0x42bdf4['metrics'] || null)));
      }
      ((_0x294420['invocations'] = _0x294420['invocations']['slice'](-MAX_INVOCATIONS)), await _0x5b901f());
    },
    async saveCheckpoint(_0x5ca685) {
      ((_0x294420['checkpoint'] = cloneJson(_0x5ca685 || null)),
        (_0x294420['checkpointAt'] = Date['now']()),
        await _0x5b901f());
    },
    async saveQualityReview(_0x2e603e) {
      ((_0x294420['qualityReview'] = cloneJson(_0x2e603e || null)),
        (_0x294420['checkpointAt'] = Date['now']()),
        await _0x5b901f());
    },
    async saveGeneratedCandidate(_0x10ff1f) {
      ((_0x294420['generatedCandidate'] = cloneJson(_0x10ff1f)),
        (_0x294420['checkpointAt'] = Date['now']()),
        await _0x5b901f());
    },
    async ready(_0x41b903) {
      ((_0x294420['status'] = 'ready_to_commit'),
        (_0x294420['candidateArtifact'] = cloneJson(_0x41b903)),
        (_0x294420['checkpointAt'] = Date['now']()),
        await _0x5b901f());
    },
    async failed(_0x2bab8e) {
      ((_0x294420['status'] = 'failed_retryable'),
        (_0x294420['error'] = normalizeText(_0x2bab8e?.['message'] || _0x2bab8e)));
      const _0x1d05f9 = _0x2bab8e?.['experimentalDraft'] || _0x2bab8e?.['partialResult'];
      (_0x1d05f9 &&
        ((_0x294420['checkpoint'] = cloneJson(_0x1d05f9)), (_0x294420['checkpointAt'] = Date['now']())),
        await _0x5b901f());
    },
    async succeeded() {
      ((_0x294420['status'] = 'succeeded'),
        (_0x294420['candidateArtifact'] = null),
        (_0x294420['generatedCandidate'] = null),
        (_0x294420['checkpoint'] = null),
        (_0x294420['qualityReview'] = null),
        (_0x294420['checkpointAt'] = Date['now']()),
        (_0x294420['error'] = ''),
        await _0x5b901f());
    },
  });
}
