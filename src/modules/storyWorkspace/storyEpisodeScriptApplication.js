import { buildStoryBackgroundTaskId, getStoryBackgroundTasks } from './storyBackgroundTasks.js';
import {
  canGenerateStoryEpisodeScript,
  getNextStoryEpisodeScriptIndex,
  mergeStoryEpisodeScript,
  saveStoryEpisodeScriptDraft,
} from './storyPlanningData.js';
import { invalidateStoryPlanningDownstream } from './storyProjectPlanning.js';
const RUN_KIND = 'story-episode-script-run',
  RUN_VERSION = 0x1,
  STAGE_VERSION = '1',
  PROMPT_VERSION = 'episode-script/v2',
  SCHEMA_VERSION = 'story-episode-script/v2',
  MAX_INVOCATIONS = 0x8,
  MAX_RAW_RESPONSE_CHARACTERS = 0x1d4c0,
  SCRIPT_RESPONSE_STEPS = new Set(['generation', 'repair', 'content-revision']),
  OPTIONAL_POST_GENERATION_STEPS = new Set(['timing-review', 'timing-recheck', 'content-revision']);
let runSequence = 0x0;
function normalizeText(_0x8e872d) {
  return String(_0x8e872d || '')['trim']();
}
function cloneJson(_0x5817b7) {
  if (_0x5817b7 == null) return _0x5817b7;
  return JSON['parse'](JSON['stringify'](_0x5817b7));
}
function stableSerialize(_0x5cf023) {
  if (Array['isArray'](_0x5cf023)) return '[' + _0x5cf023['map'](stableSerialize)['join'](',') + ']';
  if (_0x5cf023 && typeof _0x5cf023 === 'object')
    return (
      '{' +
      Object['keys'](_0x5cf023)
        ['sort']()
        ['map']((_0x195fd7) => JSON['stringify'](_0x195fd7) + ':' + stableSerialize(_0x5cf023[_0x195fd7]))
        ['join'](',') +
      '}'
    );
  return JSON['stringify'](_0x5cf023 ?? null);
}
function fingerprintValue(_0x4415e2) {
  const _0x44795f = stableSerialize(_0x4415e2);
  let _0x2bfff5 = 0x811c9dc5;
  for (let _0x19179f = 0x0; _0x19179f < _0x44795f['length']; _0x19179f += 0x1) {
    ((_0x2bfff5 ^= _0x44795f['charCodeAt'](_0x19179f)), (_0x2bfff5 = Math['imul'](_0x2bfff5, 0x1000193)));
  }
  return 'fnv1a-' + (_0x2bfff5 >>> 0x0)['toString'](0x10)['padStart'](0x8, '0');
}
function getEpisodeRef(_0xfa2b64 = {}, _0x599d38 = 0x0) {
  return (
    normalizeText(_0xfa2b64['ref'] || _0xfa2b64['planningRef'] || _0xfa2b64['id']) ||
    'episode-' + (_0x599d38 + 0x1)
  );
}
function getRunInput({
  project: project = {},
  episode: episode = {},
  episodeIndex: episodeIndex = 0x0,
  previousEpisode: previousEpisode = null,
  nextEpisode: nextEpisode = null,
  execution: execution = {},
  regeneration: regeneration = ![],
} = {}) {
  return {
    projectId: normalizeText(project['id']),
    summaryRevision: Math['max'](0x0, Math['trunc'](Number(project['summaryRevision']) || 0x0)),
    outlineRevision: Math['max'](0x0, Math['trunc'](Number(project['outlineSourceSummaryRevision']) || 0x0)),
    scriptMode: normalizeText(project['scriptMode']) || 'plot',
    episodeIndex: Math['max'](0x0, Math['trunc'](Number(episodeIndex) || 0x0)),
    episodeRef: getEpisodeRef(episode, episodeIndex),
    episodeFingerprint: fingerprintValue({
      title: episode['title'],
      synopsis: episode['synopsis'],
      hook: episode['hook'],
      continuityFacts: episode['continuityFacts'],
      endingState: episode['endingState'],
      existingScript: regeneration ? episode['script']?.['fullText'] : '',
    }),
    previousEpisodeFingerprint: fingerprintValue({
      ref: getEpisodeRef(previousEpisode || {}, Math['max'](0x0, episodeIndex - 0x1)),
      script: previousEpisode?.['script']?.['fullText'],
      endingState: previousEpisode?.['endingState'],
    }),
    nextEpisodeFingerprint: fingerprintValue({
      ref: getEpisodeRef(nextEpisode || {}, episodeIndex + 0x1),
      synopsis: nextEpisode?.['synopsis'],
      hook: nextEpisode?.['hook'],
    }),
    regeneration: regeneration === !![],
    execution: {
      modelId: normalizeText(execution['modelId']),
      provider: normalizeText(execution['provider']),
      providerProfileId: normalizeText(execution['providerProfileId']),
    },
    stageVersion: STAGE_VERSION,
    promptVersion: PROMPT_VERSION,
    schemaVersion: SCHEMA_VERSION,
  };
}
function normalizeInvocation(_0x5c1055 = {}) {
  return {
    id: normalizeText(_0x5c1055['id']),
    stepId: normalizeText(_0x5c1055['stepId']),
    attempt: Math['max'](0x1, Math['trunc'](Number(_0x5c1055['attempt']) || 0x1)),
    state: normalizeText(_0x5c1055['state']),
    requestFingerprint: normalizeText(_0x5c1055['requestFingerprint']),
    rawResponse: String(_0x5c1055['rawResponse'] || '')['slice'](0x0, MAX_RAW_RESPONSE_CHARACTERS),
    error: normalizeText(_0x5c1055['error']),
    preparedAt: Math['max'](0x0, Number(_0x5c1055['preparedAt'] || 0x0)),
    completedAt: Math['max'](0x0, Number(_0x5c1055['completedAt'] || 0x0)),
    retryAuthorizedAt: Math['max'](0x0, Number(_0x5c1055['retryAuthorizedAt'] || 0x0)),
  };
}
export function normalizeStoryEpisodeScriptRun(_0x55324f) {
  if (
    !_0x55324f ||
    typeof _0x55324f !== 'object' ||
    Array['isArray'](_0x55324f) ||
    _0x55324f['kind'] !== RUN_KIND ||
    Number(_0x55324f['version']) !== RUN_VERSION
  )
    return null;
  return {
    kind: RUN_KIND,
    version: RUN_VERSION,
    id: normalizeText(_0x55324f['id']),
    status: normalizeText(_0x55324f['status']) || 'running',
    inputFingerprint: normalizeText(_0x55324f['inputFingerprint']),
    input: cloneJson(_0x55324f['input'] || {}),
    checkpoint: cloneJson(_0x55324f['checkpoint'] || null),
    invocations: (Array['isArray'](_0x55324f['invocations']) ? _0x55324f['invocations'] : [])
      ['map'](normalizeInvocation)
      ['filter']((_0x133465) => _0x133465['id'] && _0x133465['stepId'])
      ['slice'](-MAX_INVOCATIONS),
    candidateArtifact: cloneJson(_0x55324f['candidateArtifact'] || null),
    errorCode: normalizeText(_0x55324f['errorCode']),
    error: normalizeText(_0x55324f['error']),
    createdAt: Math['max'](0x0, Number(_0x55324f['createdAt'] || 0x0)) || Date['now'](),
    updatedAt: Math['max'](0x0, Number(_0x55324f['updatedAt'] || 0x0)) || Date['now'](),
  };
}
function createRun(_0x527eed = {}) {
  const _0x59e40b = getRunInput(_0x527eed),
    _0x54180e = Date['now']();
  return (
    (runSequence += 0x1),
    {
      kind: RUN_KIND,
      version: RUN_VERSION,
      id:
        'episode-script:' +
        (_0x59e40b['projectId'] || 'project') +
        ':' +
        _0x59e40b['episodeRef'] +
        ':' +
        _0x54180e +
        ':' +
        runSequence,
      status: 'running',
      inputFingerprint: fingerprintValue(_0x59e40b),
      input: _0x59e40b,
      checkpoint: null,
      invocations: [],
      candidateArtifact: null,
      errorCode: '',
      error: '',
      createdAt: _0x54180e,
      updatedAt: _0x54180e,
    }
  );
}
function canResumeRun(_0x984c04, _0x519118 = {}) {
  const _0x455935 = normalizeStoryEpisodeScriptRun(_0x984c04);
  if (!_0x455935 || !['running', 'failed_retryable', 'ready_to_commit']['includes'](_0x455935['status']))
    return ![];
  const _0xde4330 =
    _0x455935['status'] === 'failed_retryable' &&
    _0x455935['errorCode'] === 'MODEL_CREDENTIAL_MISSING' &&
    _0x455935['invocations']['length'] === 0x0 &&
    !_0x455935['checkpoint'] &&
    !_0x455935['candidateArtifact'];
  if (_0xde4330) return ![];
  const _0x510750 =
      fingerprintValue(getRunInput(_0x519118)['execution']) !==
      fingerprintValue(_0x455935['input']['execution']),
    _0x51cff3 =
      _0x455935['candidateArtifact'] ||
      _0x455935['checkpoint']?.['repairDraft']?.['rawResponses']?.['some']((_0x535099) =>
        normalizeText(_0x535099?.['text']),
      ) ||
      _0x455935['invocations']['some'](
        (_0x1701d5) => _0x1701d5['state'] === 'completed' && _0x1701d5['rawResponse'],
      );
  if (
    _0x455935['status'] === 'failed_retryable' &&
    _0x510750 &&
    !_0x51cff3 &&
    !runRequiresPaidRetry(_0x455935)
  )
    return ![];
  return (
    _0x455935['inputFingerprint'] ===
    fingerprintValue(getRunInput({ ..._0x519118, execution: _0x455935['input']['execution'] }))
  );
}
function runRequiresPaidRetry(_0x334b6d) {
  const _0x33ec42 = normalizeStoryEpisodeScriptRun(_0x334b6d);
  if (!_0x33ec42) return ![];
  const _0x36f49c = _0x33ec42['invocations']['filter'](
    (_0x569206) =>
      ['prepared', 'outcome-unknown']['includes'](_0x569206['state']) && !_0x569206['retryAuthorizedAt'],
  );
  if (!_0x36f49c['length']) return ![];
  const _0x762306 = _0x33ec42['invocations']['some'](
    (_0x3c77a0) =>
      SCRIPT_RESPONSE_STEPS['has'](_0x3c77a0['stepId']) &&
      _0x3c77a0['state'] === 'completed' &&
      _0x3c77a0['rawResponse'],
  );
  return (
    !_0x762306 || _0x36f49c['some']((_0xebad4) => !OPTIONAL_POST_GENERATION_STEPS['has'](_0xebad4['stepId']))
  );
}
function authorizePaidRetry(_0x1fcd78) {
  const _0x2bfa1a = normalizeStoryEpisodeScriptRun(_0x1fcd78);
  if (!_0x2bfa1a) return null;
  const _0x4c736d = Date['now']();
  return (
    (_0x2bfa1a['invocations'] = _0x2bfa1a['invocations']['map']((_0x471821) =>
      ['prepared', 'outcome-unknown']['includes'](_0x471821['state']) && !_0x471821['retryAuthorizedAt']
        ? { ..._0x471821, retryAuthorizedAt: _0x4c736d }
        : _0x471821,
    )),
    (_0x2bfa1a['updatedAt'] = _0x4c736d),
    _0x2bfa1a
  );
}
function createRunPayload(_0x39069b) {
  return { kind: RUN_KIND, run: cloneJson(normalizeStoryEpisodeScriptRun(_0x39069b)) };
}
function getRunFromTask(_0x4ca3d9 = {}) {
  return _0x4ca3d9?.['resumePayload']?.['kind'] === RUN_KIND
    ? normalizeStoryEpisodeScriptRun(_0x4ca3d9['resumePayload']['run'])
    : null;
}
function completeRun(_0x5b9fd1) {
  const _0x4ff614 = normalizeStoryEpisodeScriptRun(_0x5b9fd1);
  return _0x4ff614
    ? {
        ..._0x4ff614,
        status: 'succeeded',
        candidateArtifact: null,
        checkpoint: null,
        errorCode: '',
        error: '',
        updatedAt: Date['now'](),
      }
    : null;
}
function mergeRepairDrafts(_0x2cbe57, _0x319ced) {
  const _0x59a600 =
      _0x319ced?.['scriptDraft'] && typeof _0x319ced['scriptDraft'] === 'object'
        ? cloneJson(_0x319ced['scriptDraft'])
        : null,
    _0x629430 =
      _0x2cbe57['checkpoint']?.['repairDraft'] && typeof _0x2cbe57['checkpoint']['repairDraft'] === 'object'
        ? cloneJson(_0x2cbe57['checkpoint']['repairDraft'])
        : null,
    _0x3b2e5e = [
      ...(Array['isArray'](_0x59a600?.['rawResponses']) ? _0x59a600['rawResponses'] : []),
      ...(Array['isArray'](_0x629430?.['rawResponses']) ? _0x629430['rawResponses'] : []),
      ..._0x2cbe57['invocations']
        ['filter']((_0x3168f5) => _0x3168f5['state'] === 'completed' && _0x3168f5['rawResponse'])
        ['map']((_0x51e3de) => ({
          attempt: _0x51e3de['attempt'],
          phase: _0x51e3de['stepId'],
          text: _0x51e3de['rawResponse'],
        })),
    ],
    _0x5dc41d = [
      ...new Map(
        _0x3b2e5e['map']((_0x726416) => [
          Math['max'](0x1, Math['trunc'](Number(_0x726416?.['attempt']) || 0x1)) +
            ':' +
            String(_0x726416?.['text'] || ''),
          _0x726416,
        ]),
      )['values'](),
    ],
    _0x57ab64 = _0x2cbe57['invocations']['some'](
      (_0x45894c) =>
        SCRIPT_RESPONSE_STEPS['has'](_0x45894c['stepId']) &&
        _0x45894c['state'] === 'completed' &&
        _0x45894c['rawResponse'],
    ),
    _0x2b4b02 = _0x2cbe57['invocations']['some'](
      (_0x4f360f) =>
        OPTIONAL_POST_GENERATION_STEPS['has'](_0x4f360f['stepId']) &&
        ['prepared', 'outcome-unknown']['includes'](_0x4f360f['state']) &&
        !_0x4f360f['retryAuthorizedAt'],
    ),
    _0x592228 = _0x57ab64 && _0x2b4b02;
  if (!_0x5dc41d['length']) return _0x629430 || _0x59a600;
  return {
    ...(_0x59a600 || {}),
    ...(_0x629430 || {}),
    status: 'failed',
    episodeRef: _0x2cbe57['input']['episodeRef'],
    attempts: Math['max'](
      0x1,
      ..._0x5dc41d['map']((_0x809aa5) => Math['trunc'](Number(_0x809aa5?.['attempt']) || 0x0)),
    ),
    rawResponses: _0x5dc41d,
    ...(_0x592228 ? { skipPostGenerationReview: !![] } : {}),
  };
}
function getErrorCode(_0x18c72a) {
  return normalizeText(_0x18c72a?.['code']) || 'STORY_EPISODE_SCRIPT_FAILED';
}
export function createStoryEpisodeScriptApplication({ generateEpisodeScript: _0x5ed54b } = {}) {
  if (typeof _0x5ed54b !== 'function')
    throw new TypeError('generateEpisodeScript\x20must\x20be\x20a\x20function');
  async function _0x1f2326(_0x3a4f56 = {}) {
    const _0x41d654 = normalizeStoryEpisodeScriptRun(_0x3a4f56['resumeRun']),
      _0x156f08 = canResumeRun(_0x41d654, _0x3a4f56);
    if (_0x156f08 && _0x41d654['status'] === 'ready_to_commit' && _0x41d654['candidateArtifact'])
      return { result: cloneJson(_0x41d654['candidateArtifact']), run: cloneJson(_0x41d654), resumed: !![] };
    let _0x14ca45 = _0x156f08 ? _0x41d654 : createRun(_0x3a4f56);
    ((_0x14ca45['status'] = 'running'),
      (_0x14ca45['errorCode'] = ''),
      (_0x14ca45['error'] = ''),
      (_0x14ca45['updatedAt'] = Date['now']()),
      await _0x3a4f56['onRunChange']?.(cloneJson(_0x14ca45)));
    try {
      const _0xc4acc0 = await _0x5ed54b({
        project: _0x3a4f56['project'],
        episode: _0x3a4f56['episode'],
        previousEpisode: _0x3a4f56['previousEpisode'],
        nextEpisode: _0x3a4f56['nextEpisode'],
        model: _0x14ca45['input']['execution']['modelId'],
        provider: _0x14ca45['input']['execution']['provider'],
        providerProfileId: _0x14ca45['input']['execution']['providerProfileId'],
        repairDraft: mergeRepairDrafts(_0x14ca45, _0x3a4f56['episode']),
        onProgress: _0x3a4f56['onProgress'],
        onInvocation: async (_0x2ea68f = {}) => {
          const _0x916a67 = Date['now']();
          if (_0x2ea68f['state'] === 'prepared')
            _0x14ca45['invocations']['push'](
              normalizeInvocation({
                id:
                  _0x14ca45['id'] +
                  ':' +
                  _0x2ea68f['stepId'] +
                  ':' +
                  _0x2ea68f['attempt'] +
                  ':' +
                  (_0x14ca45['invocations']['length'] + 0x1),
                stepId: _0x2ea68f['stepId'],
                attempt: _0x2ea68f['attempt'],
                state: 'prepared',
                requestFingerprint: fingerprintValue({
                  model: _0x2ea68f['requestPayload']?.['model'],
                  provider: _0x2ea68f['requestPayload']?.['provider'],
                  prompt: _0x2ea68f['requestPayload']?.['prompt'],
                }),
                preparedAt: _0x916a67,
              }),
            );
          else {
            const _0x442ac8 = [..._0x14ca45['invocations']]
              ['reverse']()
              ['find'](
                (_0x15decf) =>
                  _0x15decf['stepId'] === normalizeText(_0x2ea68f['stepId']) &&
                  _0x15decf['attempt'] ===
                    Math['max'](0x1, Math['trunc'](Number(_0x2ea68f['attempt']) || 0x1)) &&
                  _0x15decf['state'] === 'prepared',
              );
            _0x442ac8 &&
              ((_0x442ac8['state'] = normalizeText(_0x2ea68f['state'])),
              (_0x442ac8['rawResponse'] = String(_0x2ea68f['rawResponse'] || '')['slice'](
                0x0,
                MAX_RAW_RESPONSE_CHARACTERS,
              )),
              (_0x442ac8['error'] = normalizeText(_0x2ea68f['error'])),
              (_0x442ac8['completedAt'] = _0x916a67));
          }
          ((_0x14ca45['invocations'] = _0x14ca45['invocations']['slice'](-MAX_INVOCATIONS)),
            (_0x14ca45['updatedAt'] = _0x916a67),
            await _0x3a4f56['onRunChange']?.(cloneJson(_0x14ca45)));
        },
      });
      return (
        (_0x14ca45['status'] = 'ready_to_commit'),
        (_0x14ca45['candidateArtifact'] = cloneJson(_0xc4acc0)),
        (_0x14ca45['checkpoint'] = null),
        (_0x14ca45['updatedAt'] = Date['now']()),
        await _0x3a4f56['onRunChange']?.(cloneJson(_0x14ca45)),
        { result: _0xc4acc0, run: cloneJson(_0x14ca45), resumed: _0x156f08 }
      );
    } catch (_0x1b618b) {
      const _0x316c7c =
        _0x1b618b?.['partialResult'] &&
        typeof _0x1b618b['partialResult'] === 'object' &&
        !Array['isArray'](_0x1b618b['partialResult'])
          ? cloneJson(_0x1b618b['partialResult'])
          : null;
      ((_0x14ca45['status'] = 'failed_retryable'),
        (_0x14ca45['checkpoint'] = _0x316c7c ? { repairDraft: _0x316c7c } : _0x14ca45['checkpoint']),
        (_0x14ca45['errorCode'] = getErrorCode(_0x1b618b)),
        (_0x14ca45['error'] = normalizeText(_0x1b618b?.['message'] || _0x1b618b)),
        (_0x14ca45['updatedAt'] = Date['now']()),
        await _0x3a4f56['onRunChange']?.(cloneJson(_0x14ca45)),
        (_0x1b618b['storyEpisodeScriptRun'] = cloneJson(_0x14ca45)));
      throw _0x1b618b;
    }
  }
  return Object['freeze']({ execute: _0x1f2326 });
}
export function createStoryEpisodeScriptWorkspaceController({
  state: _0x2e701c,
  generateEpisodeScript: _0x4a95ad,
  host: host = {},
} = {}) {
  const _0x39bb9e =
    typeof _0x4a95ad === 'function'
      ? createStoryEpisodeScriptApplication({ generateEpisodeScript: _0x4a95ad })
      : null;
  async function _0x302a91(
    _0x207fd3,
    _0x1b615f = host['createProjectTaskToken'](),
    { batch: batch = null, regeneration: regeneration = ![] } = {},
  ) {
    const _0x54788b = _0x1b615f['data'];
    if (!host['isProjectTaskLive'](_0x1b615f)) return null;
    if (_0x54788b?.['project']?.['sourceMode'] === 'upload-original')
      throw new Error('上传剧本保持原稿，不支持 AI 扩写分集正文。');
    if (!_0x39bb9e) throw new Error('完整分集剧本 Agent 尚未初始化。');
    const _0x413654 = _0x54788b['episodes']['findIndex']((_0x449124) => _0x449124['id'] === _0x207fd3['id']);
    if (
      _0x413654 < 0x0 ||
      (!regeneration && !canGenerateStoryEpisodeScript(_0x54788b['episodes'], _0x413654))
    )
      throw new Error(
        '必须按顺序生成剧本；当前应先生成第\x20' +
          (getNextStoryEpisodeScriptIndex(_0x54788b['episodes']) + 0x1) +
          '\x20集。',
      );
    const _0x3d1cb9 = host['getPlanningContext'](_0x54788b, _0x1b615f),
      _0x1a1814 = _0x413654 > 0x0 ? _0x54788b['episodes'][_0x413654 - 0x1] : null,
      _0xd1315b = _0x54788b['episodes'][_0x413654 + 0x1] || null,
      _0x426a20 = {
        modelId: _0x3d1cb9['model'],
        provider: _0x3d1cb9['provider'],
        providerProfileId: _0x3d1cb9['providerProfileId'],
      },
      _0x5ae97c = buildStoryBackgroundTaskId('episode-script', { episodeId: _0x207fd3['id'] }),
      _0x52072f = getStoryBackgroundTasks(_0x54788b)['find']((_0x3c314f) => _0x3c314f['id'] === _0x5ae97c);
    let _0x3c0633 = getRunFromTask(_0x52072f);
    const _0x1db087 = {
        project: _0x3d1cb9['project'],
        episode: _0x207fd3,
        episodeIndex: _0x413654,
        previousEpisode: _0x1a1814,
        nextEpisode: _0xd1315b,
        execution: _0x426a20,
        regeneration: regeneration,
      },
      _0x5a8d99 = canResumeRun(_0x3c0633, _0x1db087);
    if (_0x5a8d99 && runRequiresPaidRetry(_0x3c0633)) {
      const _0x561217 = await host['requestChoice']({
        overlayId: 'story-episode-script-paid-retry-' + _0x207fd3['id'],
        title: '第\x20' + (_0x413654 + 0x1) + ' 集正文生成结果未知',
        message:
          '上次正文生成或正文修复请求可能已经提交并计费，但没有收到确定结果。只有你确认后才会再次请求正文。',
        fallbackValue: null,
        choices: [
          { label: '暂不重试', value: null, autofocus: !![] },
          { label: '确认重新请求正文', value: 'retry', primary: !![] },
        ],
      });
      if (_0x561217 !== 'retry') throw new Error('已停止重复请求本集剧本。');
      _0x3c0633 = authorizePaidRetry(_0x3c0633);
    }
    const _0x5bb536 = async (_0x143b31) => {
      const _0xc0e62f = {
          type: 'episode-script',
          scope: { episodeId: _0x207fd3['id'] },
          label: '生成第 ' + (_0x413654 + 0x1) + ' 集完整剧本',
          status: _0x143b31['status'] === 'failed_retryable' ? 'failed' : 'running',
          resumable: !![],
          modelId: _0x143b31['input']['execution']['modelId'],
          provider: _0x143b31['input']['execution']['provider'],
          message: _0x143b31['error'] || _0x2e701c['episodeScriptGenerationStatus'],
          error: _0x143b31['error'],
          resumePayload: createRunPayload(_0x143b31),
          batch: batch,
        },
        _0x4da50f = getStoryBackgroundTasks(_0x54788b)['find']((_0x53f732) => _0x53f732['id'] === _0x5ae97c);
      if (_0x4da50f) host['updateBackgroundTask'](_0x1b615f, _0x5ae97c, _0xc0e62f);
      else host['startBackgroundTask'](_0x1b615f, { id: _0x5ae97c, ..._0xc0e62f });
      const _0x924fd0 = await host['persistNow']();
      if (host['persistenceRequired']() && !_0x924fd0)
        throw new Error('分集剧本运行记录保存失败，已停止模型请求。');
    };
    try {
      const _0x2c39de = await _0x39bb9e['execute']({
        ..._0x1db087,
        resumeRun: _0x5a8d99 ? _0x3c0633 : null,
        onRunChange: _0x5bb536,
        onProgress: ({ message: _0x34f8e2 } = {}) => {
          if (!host['isProjectTaskLive'](_0x1b615f)) return;
          const _0x203a1a =
            normalizeText(_0x34f8e2) || '正在生成第\x20' + (_0x413654 + 0x1) + '\x20集完整剧本';
          (host['updateBackgroundTask'](_0x1b615f, _0x5ae97c, { status: 'running', message: _0x203a1a }),
            host['isProjectTaskCurrent'](_0x1b615f) &&
              ((_0x2e701c['episodeScriptGenerationStatus'] = _0x203a1a), host['renderPlanningProgress']()));
        },
      });
      if (!host['isProjectTaskLive'](_0x1b615f)) return null;
      let _0x56a9e0 = _0x54788b;
      regeneration
        ? ((_0x56a9e0 = invalidateStoryPlanningDownstream(_0x54788b, { episodeScriptStartIndex: _0x413654 })),
          (_0x56a9e0['episodes'][_0x413654] = mergeStoryEpisodeScript(
            _0x56a9e0['episodes'][_0x413654],
            _0x2c39de['result'],
          )),
          (_0x1b615f['data'] = _0x56a9e0),
          host['registerProjectData'](_0x1b615f),
          host['isProjectTaskCurrent'](_0x1b615f) &&
            ((_0x2e701c['data'] = _0x56a9e0),
            host['resetDownstreamUi']({ selectedEpisodeId: _0x207fd3['id'] })))
        : (_0x56a9e0['episodes'][_0x413654] = mergeStoryEpisodeScript(_0x207fd3, _0x2c39de['result']));
      const _0x15e59f = host['syncCompiledScripts'](_0x56a9e0);
      return (
        host['finishBackgroundTask'](_0x1b615f, _0x5ae97c, {
          status: 'succeeded',
          message: '第\x20' + (_0x413654 + 0x1) + ' 集完整剧本已生成',
          resumable: ![],
          resumePayload: createRunPayload(completeRun(_0x2c39de['run'])),
        }),
        host['schedulePersistence']({ immediate: !![] }),
        await host['persistNow'](),
        { episode: _0x56a9e0['episodes'][_0x413654], compiled: _0x15e59f }
      );
    } catch (_0x17fdcf) {
      if (host['isProjectTaskLive'](_0x1b615f)) {
        const _0x4c2910 =
          _0x17fdcf?.['partialResult'] &&
          typeof _0x17fdcf['partialResult'] === 'object' &&
          !Array['isArray'](_0x17fdcf['partialResult'])
            ? cloneJson(_0x17fdcf['partialResult'])
            : null;
        (_0x4c2910 &&
          ((_0x54788b['episodes'][_0x413654] = saveStoryEpisodeScriptDraft(
            _0x54788b['episodes'][_0x413654],
            _0x4c2910,
          )),
          host['schedulePersistence']({ immediate: !![] })),
          host['finishBackgroundTask'](_0x1b615f, _0x5ae97c, {
            status: 'failed',
            message: _0x4c2910
              ? '第\x20' + (_0x413654 + 0x1) + ' 集返回已保存，可继续修复'
              : '第\x20' + (_0x413654 + 0x1) + ' 集剧本生成失败',
            error: _0x17fdcf?.['message'] || '完整分集剧本生成失败。',
            resumable: !![],
            ...(_0x17fdcf?.['storyEpisodeScriptRun']
              ? { resumePayload: createRunPayload(_0x17fdcf['storyEpisodeScriptRun']) }
              : {}),
          }));
      }
      throw _0x17fdcf;
    }
  }
  return Object['freeze']({ request: _0x302a91 });
}
