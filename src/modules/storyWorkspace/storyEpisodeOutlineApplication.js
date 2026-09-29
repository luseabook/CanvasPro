const STORY_EPISODE_OUTLINE_RUN_KIND = 'story-episode-outline-run',
  STORY_EPISODE_OUTLINE_RUN_VERSION = 0x1,
  STORY_EPISODE_OUTLINE_STAGE_VERSION = '2',
  STORY_EPISODE_OUTLINE_SCHEMA_VERSION = 'story-episode-outline/v2',
  STORY_EPISODE_OUTLINE_PROMPT_VERSION = 'episode-outline-planning/v3',
  MAX_INVOCATIONS = 0x18,
  MAX_RAW_RESPONSE_CHARACTERS = 0x13880;
let runSequence = 0x0;
function normalizeText(_0x32d783) {
  return String(_0x32d783 || '')['trim']();
}
function cloneJson(_0x4e3842) {
  if (_0x4e3842 == null) return _0x4e3842;
  return JSON['parse'](JSON['stringify'](_0x4e3842));
}
function stableSerialize(_0x18532d) {
  if (Array['isArray'](_0x18532d)) return '[' + _0x18532d['map'](stableSerialize)['join'](',') + ']';
  if (_0x18532d && typeof _0x18532d === 'object')
    return (
      '{' +
      Object['keys'](_0x18532d)
        ['sort']()
        ['map']((_0x4ca6e9) => JSON['stringify'](_0x4ca6e9) + ':' + stableSerialize(_0x18532d[_0x4ca6e9]))
        ['join'](',') +
      '}'
    );
  return JSON['stringify'](_0x18532d ?? null);
}
function fingerprintValue(_0x358310) {
  const _0x5dcf92 = stableSerialize(_0x358310);
  let _0x34d3f0 = 0x811c9dc5;
  for (let _0x4454a3 = 0x0; _0x4454a3 < _0x5dcf92['length']; _0x4454a3 += 0x1) {
    ((_0x34d3f0 ^= _0x5dcf92['charCodeAt'](_0x4454a3)), (_0x34d3f0 = Math['imul'](_0x34d3f0, 0x1000193)));
  }
  return 'fnv1a-' + (_0x34d3f0 >>> 0x0)['toString'](0x10)['padStart'](0x8, '0');
}
function createRunId(_0x3e9337) {
  return (
    (runSequence += 0x1),
    'episode-planning:' + (normalizeText(_0x3e9337) || 'project') + ':' + Date['now']() + ':' + runSequence
  );
}
function getRunInput({
  project: project = {},
  constraints: constraints = {},
  execution: execution = {},
} = {}) {
  return {
    projectId: normalizeText(project['id']),
    summaryRevision: Math['max'](0x0, Math['trunc'](Number(project['summaryRevision']) || 0x0)),
    summaryFingerprint: fingerprintValue({
      summary: normalizeText(project['summary']),
      storyContract: project['storyContract'] || null,
      plotBeats: Array['isArray'](project['plotBeats']) ? project['plotBeats'] : [],
      continuityFacts: Array['isArray'](project['continuityFacts']) ? project['continuityFacts'] : [],
    }),
    scriptMode: normalizeText(project['scriptMode']) || 'plot',
    constraints: cloneJson(constraints || {}),
    execution: {
      modelId: normalizeText(execution['modelId']),
      provider: normalizeText(execution['provider']),
      providerProfileId: normalizeText(execution['providerProfileId']),
    },
    stageVersion: STORY_EPISODE_OUTLINE_STAGE_VERSION,
    promptVersion: STORY_EPISODE_OUTLINE_PROMPT_VERSION,
    schemaVersion: STORY_EPISODE_OUTLINE_SCHEMA_VERSION,
  };
}
function normalizeInvocation(_0x32f181 = {}) {
  return {
    id: normalizeText(_0x32f181['id']),
    stepId: normalizeText(_0x32f181['stepId']),
    attempt: Math['max'](0x1, Math['trunc'](Number(_0x32f181['attempt']) || 0x1)),
    state: normalizeText(_0x32f181['state']),
    requestFingerprint: normalizeText(_0x32f181['requestFingerprint']),
    rawResponse: String(_0x32f181['rawResponse'] || '')['slice'](0x0, MAX_RAW_RESPONSE_CHARACTERS),
    error: normalizeText(_0x32f181['error']),
    preparedAt: Math['max'](0x0, Number(_0x32f181['preparedAt'] || 0x0)),
    completedAt: Math['max'](0x0, Number(_0x32f181['completedAt'] || 0x0)),
    retryAuthorizedAt: Math['max'](0x0, Number(_0x32f181['retryAuthorizedAt'] || 0x0)),
  };
}
export function normalizeStoryEpisodeOutlineRun(_0x220e74) {
  if (
    !_0x220e74 ||
    typeof _0x220e74 !== 'object' ||
    Array['isArray'](_0x220e74) ||
    _0x220e74['kind'] !== STORY_EPISODE_OUTLINE_RUN_KIND ||
    Number(_0x220e74['version']) !== STORY_EPISODE_OUTLINE_RUN_VERSION
  )
    return null;
  return {
    kind: STORY_EPISODE_OUTLINE_RUN_KIND,
    version: STORY_EPISODE_OUTLINE_RUN_VERSION,
    id: normalizeText(_0x220e74['id']),
    status: normalizeText(_0x220e74['status']) || 'running',
    inputFingerprint: normalizeText(_0x220e74['inputFingerprint']),
    input: cloneJson(_0x220e74['input'] || {}),
    regenerationMode: _0x220e74['regenerationMode'] === 'rebuild' ? 'rebuild' : 'preserve',
    checkpoint: cloneJson(_0x220e74['checkpoint'] || null),
    invocations: (Array['isArray'](_0x220e74['invocations']) ? _0x220e74['invocations'] : [])
      ['map'](normalizeInvocation)
      ['filter']((_0x5b60a3) => _0x5b60a3['id'] && _0x5b60a3['stepId'])
      ['slice'](-MAX_INVOCATIONS),
    candidateArtifact: cloneJson(_0x220e74['candidateArtifact'] || null),
    errorCode: normalizeText(_0x220e74['errorCode']),
    error: normalizeText(_0x220e74['error']),
    createdAt: Math['max'](0x0, Number(_0x220e74['createdAt'] || 0x0)) || Date['now'](),
    updatedAt: Math['max'](0x0, Number(_0x220e74['updatedAt'] || 0x0)) || Date['now'](),
  };
}
export function getStoryEpisodeOutlineRunFromTask(_0x2e4ef2 = {}) {
  const _0x2435c2 = _0x2e4ef2?.['resumePayload'];
  if (_0x2435c2?.['kind'] !== STORY_EPISODE_OUTLINE_RUN_KIND) return null;
  return normalizeStoryEpisodeOutlineRun(_0x2435c2['run']);
}
export function createStoryEpisodeOutlineRun({
  project: project = {},
  constraints: constraints = {},
  execution: execution = {},
  regenerationMode: regenerationMode = 'preserve',
} = {}) {
  const _0x38a978 = getRunInput({ project: project, constraints: constraints, execution: execution }),
    _0x450dba = Date['now']();
  return {
    kind: STORY_EPISODE_OUTLINE_RUN_KIND,
    version: STORY_EPISODE_OUTLINE_RUN_VERSION,
    id: createRunId(project['id']),
    status: 'running',
    inputFingerprint: fingerprintValue(_0x38a978),
    input: _0x38a978,
    regenerationMode: regenerationMode === 'rebuild' ? 'rebuild' : 'preserve',
    checkpoint: null,
    invocations: [],
    candidateArtifact: null,
    errorCode: '',
    error: '',
    createdAt: _0x450dba,
    updatedAt: _0x450dba,
  };
}
export function canResumeStoryEpisodeOutlineRun(_0x21b7fb, _0x201a4b = {}) {
  const _0x5b348f = normalizeStoryEpisodeOutlineRun(_0x21b7fb);
  if (!_0x5b348f || !['running', 'failed_retryable', 'ready_to_commit']['includes'](_0x5b348f['status']))
    return ![];
  const _0x533398 = getRunInput(_0x201a4b);
  return _0x5b348f['inputFingerprint'] === fingerprintValue(_0x533398);
}
export function storyEpisodeOutlineRunRequiresPaidRetry(_0x535b27) {
  const _0x309c9f = normalizeStoryEpisodeOutlineRun(_0x535b27);
  return (
    _0x309c9f?.['invocations']['some'](
      (_0x5ecc10) =>
        ['prepared', 'outcome-unknown']['includes'](_0x5ecc10['state']) && !_0x5ecc10['retryAuthorizedAt'],
    ) === !![]
  );
}
export function authorizeStoryEpisodeOutlinePaidRetry(_0x48bab1) {
  const _0x384a6a = normalizeStoryEpisodeOutlineRun(_0x48bab1);
  if (!_0x384a6a) return null;
  const _0xf4340c = Date['now']();
  return (
    (_0x384a6a['invocations'] = _0x384a6a['invocations']['map']((_0x105c8c) =>
      ['prepared', 'outcome-unknown']['includes'](_0x105c8c['state']) && !_0x105c8c['retryAuthorizedAt']
        ? { ..._0x105c8c, retryAuthorizedAt: _0xf4340c }
        : _0x105c8c,
    )),
    (_0x384a6a['updatedAt'] = _0xf4340c),
    _0x384a6a
  );
}
export function createStoryEpisodeOutlineRunPayload(_0x251c09) {
  return { kind: STORY_EPISODE_OUTLINE_RUN_KIND, run: cloneJson(normalizeStoryEpisodeOutlineRun(_0x251c09)) };
}
export function completeStoryEpisodeOutlineRun(_0x341cee) {
  const _0x35229c = normalizeStoryEpisodeOutlineRun(_0x341cee);
  if (!_0x35229c) return null;
  return {
    ..._0x35229c,
    status: 'succeeded',
    candidateArtifact: null,
    errorCode: '',
    error: '',
    updatedAt: Date['now'](),
  };
}
function createInvocationId(_0x326298, _0xa386b3) {
  return (
    _0x326298['id'] +
    ':' +
    _0xa386b3['stepId'] +
    ':' +
    _0xa386b3['attempt'] +
    ':' +
    (_0x326298['invocations']['length'] + 0x1)
  );
}
function getPersistedResumeResponses(_0x16ce49) {
  if (_0x16ce49['status'] !== 'running') return {};
  return _0x16ce49['invocations']['reduce']((_0x43f0c5, _0x4d06cd) => {
    return (
      _0x4d06cd['state'] === 'completed' &&
        _0x4d06cd['rawResponse'] &&
        (_0x43f0c5[_0x4d06cd['stepId']] = {
          attempt: _0x4d06cd['attempt'],
          response: _0x4d06cd['rawResponse'],
        }),
      _0x43f0c5
    );
  }, {});
}
function getErrorCode(_0x5c2414) {
  return (
    normalizeText(_0x5c2414?.['code']) ||
    (/应返回.*实际返回|校验|缺少|引用/['test'](normalizeText(_0x5c2414?.['message']))
      ? 'MODEL_OUTPUT_VALIDATION_FAILED'
      : 'STORY_EPISODE_PLANNING_FAILED')
  );
}
export function createStoryEpisodeOutlineApplication({ planEpisodes: _0x24c766 } = {}) {
  if (typeof _0x24c766 !== 'function') throw new TypeError('planEpisodes must be a function');
  async function _0x4b57dd({
    project: project = {},
    constraints: constraints = {},
    execution: execution = {},
    regenerationMode: regenerationMode = 'preserve',
    resumeRun: resumeRun = null,
    onRunChange: onRunChange = null,
    onProgress: onProgress = null,
  } = {}) {
    const _0x4ce624 = normalizeStoryEpisodeOutlineRun(resumeRun),
      _0x54ed52 = _0x4ce624?.['input']?.['execution'] || execution,
      _0x2609be = canResumeStoryEpisodeOutlineRun(_0x4ce624, {
        project: project,
        constraints: constraints,
        execution: _0x54ed52,
      });
    if (_0x2609be && _0x4ce624['status'] === 'ready_to_commit' && _0x4ce624['candidateArtifact'])
      return { result: cloneJson(_0x4ce624['candidateArtifact']), run: cloneJson(_0x4ce624), resumed: !![] };
    let _0x23fca4 = _0x2609be
      ? _0x4ce624
      : createStoryEpisodeOutlineRun({
          project: project,
          constraints: constraints,
          execution: execution,
          regenerationMode: regenerationMode,
        });
    const _0x5e3fc0 = _0x23fca4['status'] === 'running';
    ((_0x23fca4['status'] = 'running'),
      (_0x23fca4['errorCode'] = ''),
      (_0x23fca4['error'] = ''),
      (_0x23fca4['updatedAt'] = Date['now']()),
      await onRunChange?.(cloneJson(_0x23fca4)));
    try {
      const _0x5e77fc = await _0x24c766({
        project: project,
        constraints: constraints,
        model: _0x23fca4['input']['execution']['modelId'],
        provider: _0x23fca4['input']['execution']['provider'],
        providerProfileId: _0x23fca4['input']['execution']['providerProfileId'],
        resumeCheckpoint: cloneJson(_0x23fca4['checkpoint']),
        resumeResponses: _0x5e3fc0 ? getPersistedResumeResponses(_0x23fca4) : {},
        onProgress: onProgress,
        onCheckpoint: async (_0x315231) => {
          ((_0x23fca4['checkpoint'] = cloneJson(_0x315231)),
            (_0x23fca4['updatedAt'] = Date['now']()),
            await onRunChange?.(cloneJson(_0x23fca4)));
        },
        onInvocation: async (_0x51a3b2 = {}) => {
          const _0x46d009 = Date['now']();
          if (_0x51a3b2['state'] === 'prepared')
            _0x23fca4['invocations']['push'](
              normalizeInvocation({
                id: createInvocationId(_0x23fca4, _0x51a3b2),
                stepId: _0x51a3b2['stepId'],
                attempt: _0x51a3b2['attempt'],
                state: 'prepared',
                requestFingerprint: fingerprintValue({
                  model: _0x51a3b2['requestPayload']?.['model'],
                  provider: _0x51a3b2['requestPayload']?.['provider'],
                  prompt: _0x51a3b2['requestPayload']?.['prompt'],
                  structuredOutput: _0x51a3b2['requestPayload']?.['structuredOutput'],
                }),
                preparedAt: _0x46d009,
              }),
            );
          else {
            const _0x98aabf = [..._0x23fca4['invocations']]
              ['reverse']()
              ['find'](
                (_0x1edea1) =>
                  _0x1edea1['stepId'] === normalizeText(_0x51a3b2['stepId']) &&
                  _0x1edea1['attempt'] ===
                    Math['max'](0x1, Math['trunc'](Number(_0x51a3b2['attempt']) || 0x1)) &&
                  _0x1edea1['state'] === 'prepared',
              );
            _0x98aabf &&
              ((_0x98aabf['state'] = normalizeText(_0x51a3b2['state'])),
              (_0x98aabf['rawResponse'] = String(_0x51a3b2['rawResponse'] || '')['slice'](
                0x0,
                MAX_RAW_RESPONSE_CHARACTERS,
              )),
              (_0x98aabf['error'] = normalizeText(_0x51a3b2['error'])),
              (_0x98aabf['completedAt'] = _0x46d009));
          }
          ((_0x23fca4['invocations'] = _0x23fca4['invocations']['slice'](-MAX_INVOCATIONS)),
            (_0x23fca4['updatedAt'] = _0x46d009),
            await onRunChange?.(cloneJson(_0x23fca4)));
        },
      });
      return (
        (_0x23fca4['status'] = 'ready_to_commit'),
        (_0x23fca4['candidateArtifact'] = cloneJson(_0x5e77fc)),
        (_0x23fca4['updatedAt'] = Date['now']()),
        await onRunChange?.(cloneJson(_0x23fca4)),
        { result: _0x5e77fc, run: cloneJson(_0x23fca4), resumed: _0x2609be }
      );
    } catch (_0x43bb7b) {
      ((_0x23fca4['status'] = 'failed_retryable'),
        (_0x23fca4['errorCode'] = getErrorCode(_0x43bb7b)),
        (_0x23fca4['error'] = normalizeText(_0x43bb7b?.['message'] || _0x43bb7b)),
        (_0x23fca4['updatedAt'] = Date['now']()),
        await onRunChange?.(cloneJson(_0x23fca4)),
        (_0x43bb7b['storyEpisodeOutlineRun'] = cloneJson(_0x23fca4)));
      throw _0x43bb7b;
    }
  }
  return Object['freeze']({ execute: _0x4b57dd });
}
export function createStoryEpisodeOutlineWorkspaceController({
  state: _0x18db86,
  planEpisodes: _0x55c769,
  host: host = {},
} = {}) {
  const _0xf2ae97 =
    typeof _0x55c769 === 'function'
      ? createStoryEpisodeOutlineApplication({ planEpisodes: _0x55c769 })
      : null;
  async function _0x29a58f({ confirmRegeneration: confirmRegeneration = !![] } = {}) {
    if (_0x18db86['storyPlanningOperation']) return ![];
    if (!_0xf2ae97) return (host['showToast']?.('分集规划\x20Agent\x20尚未初始化。', 'error'), ![]);
    if (!normalizeText(_0x18db86['data']['project']?.['summary']))
      return (host['showToast']?.('请先生成剧本摘要。', 'warn'), ![]);
    const _0x25b7b7 = host['createProjectTaskToken'](),
      _0x222364 = _0x25b7b7['data'],
      _0x19f2f0 = host['getPlanningContext'](_0x222364, _0x25b7b7),
      _0x2ad76f = {
        modelId: _0x19f2f0['model'],
        provider: _0x19f2f0['provider'],
        providerProfileId: _0x19f2f0['providerProfileId'],
      },
      _0x4db387 = 'episode-planning',
      _0x3a6435 = getStoryBackgroundTasks(_0x222364)['find']((_0x529af3) => _0x529af3['id'] === _0x4db387);
    let _0x267d90 = getStoryEpisodeOutlineRunFromTask(_0x3a6435);
    const _0x49aa03 = canResumeStoryEpisodeOutlineRun(_0x267d90, {
      project: _0x19f2f0['project'],
      constraints: _0x19f2f0['project']['planning'],
      execution: _0x267d90?.['input']?.['execution'] || _0x2ad76f,
    });
    let _0x40f605 = _0x49aa03 ? _0x267d90['regenerationMode'] : 'preserve';
    if (!_0x49aa03 && confirmRegeneration && _0x18db86['data']['episodes']['length']) {
      _0x40f605 = await host['requestRegenerationMode']?.({
        title: '重新规划分集',
        message: '重新生成分集大纲会清空受影响的完整分集剧本，请确认是否继续。',
      });
      if (!_0x40f605) return ![];
    }
    if (_0x49aa03 && storyEpisodeOutlineRunRequiresPaidRetry(_0x267d90)) {
      const _0x4a93b8 = await host['requestChoice']?.({
        overlayId: 'story-episode-planning-paid-retry-overlay',
        title: '上次模型请求结果未知',
        message: '上次请求可能已经提交并计费，但没有收到确定结果。只有你确认后才会重新请求当前批次。',
        fallbackValue: null,
        choices: [
          { label: '暂不重试', value: null, autofocus: !![] },
          { label: '确认重新请求', value: 'retry', primary: !![] },
        ],
      });
      if (_0x4a93b8 !== 'retry') return ![];
      _0x267d90 = authorizeStoryEpisodeOutlinePaidRetry(_0x267d90);
    }
    const _0x16763b = _0x18db86['data']['episodes']['length'];
    host['setPlanningOperation']('planning-episode-outlines', '正在生成所有分集大纲');
    const _0x3eeed5 = async (_0x5e2571) => {
      const _0x4b1541 = {
          type: 'episode-planning',
          label: '生成分集大纲',
          status: _0x5e2571['status'] === 'failed_retryable' ? 'failed' : 'running',
          resumable: !![],
          modelId: _0x5e2571['input']['execution']['modelId'],
          provider: _0x5e2571['input']['execution']['provider'],
          message: _0x5e2571['error'] || _0x18db86['storyPlanningStatus'],
          error: _0x5e2571['error'],
          resumePayload: createStoryEpisodeOutlineRunPayload(_0x5e2571),
        },
        _0x1ea24b = getStoryBackgroundTasks(_0x222364)['find']((_0x837631) => _0x837631['id'] === _0x4db387);
      if (_0x1ea24b) host['updateBackgroundTask'](_0x25b7b7, _0x4db387, _0x4b1541);
      else host['startBackgroundTask'](_0x25b7b7, { id: _0x4db387, ..._0x4b1541 });
      const _0x51f2ca = await host['persistNow']();
      if (host['persistenceRequired']?.() && !_0x51f2ca)
        throw new Error('分集大纲运行记录保存失败，已停止模型请求。');
    };
    try {
      const _0xcdbe8b = await _0xf2ae97['execute']({
        project: _0x19f2f0['project'],
        constraints: _0x19f2f0['project']['planning'],
        execution: _0x2ad76f,
        regenerationMode: _0x40f605,
        resumeRun: _0x49aa03 ? _0x267d90 : null,
        onRunChange: _0x3eeed5,
        onProgress: ({ message: _0xc2ef87 } = {}) => {
          if (!host['isProjectTaskLive'](_0x25b7b7)) return;
          const _0x177483 = normalizeText(_0xc2ef87) || '正在生成所有分集大纲';
          (host['updateBackgroundTask'](_0x25b7b7, _0x4db387, { status: 'running', message: _0x177483 }),
            host['isProjectTaskCurrent'](_0x25b7b7) &&
              ((_0x18db86['storyPlanningStatus'] = _0x177483), host['syncPlanningLoading']()));
        },
      });
      if (!host['isProjectTaskLive'](_0x25b7b7)) return ![];
      const _0x595104 = invalidateStoryPlanningDownstream(_0x222364, { clearEpisodeOutlines: !![] });
      ((_0x595104['project']['storyFacts'] = [
        ...new Set([
          ...normalizeGeneratedStoryContinuityFacts(_0x595104['project']['continuityFacts']),
          ...normalizeGeneratedStoryContinuityFacts(_0xcdbe8b['result']?.['storyFacts']),
        ]),
      ]),
        (_0x595104['episodes'] = mergeStoryEpisodePlans(
          _0x595104['episodes'],
          _0xcdbe8b['result']?.['episodes'],
          { assets: _0x595104['assets'], preserveMedia: ![] },
        )),
        (_0x25b7b7['data'] = _0x595104),
        host['registerProjectData'](_0x25b7b7),
        (_0x25b7b7['data']['project']['outlineStatus'] = 'completed'),
        (_0x25b7b7['data']['project']['outlineSourceSummaryRevision'] = Math['max'](
          0x0,
          Math['trunc'](Number(_0x25b7b7['data']['project']['summaryRevision']) || 0x0),
        )));
      host['isProjectTaskCurrent'](_0x25b7b7) &&
        ((_0x18db86['data'] = _0x25b7b7['data']),
        host['resetDownstreamUi']({ selectedEpisodeId: _0x25b7b7['data']['episodes'][0x0]?.['id'] || '' }));
      host['schedulePersistence']({ immediate: !![] });
      const _0x42ef8b = Math['max'](0x0, _0x25b7b7['data']['episodes']['length'] - _0x16763b);
      return (
        host['notifyComplete'](
          _0x42ef8b
            ? '分集规划完成，新增 ' + _0x42ef8b + '\x20集。'
            : '已规划 ' + _0x25b7b7['data']['episodes']['length'] + ' 集。',
          _0x25b7b7,
          { step: 0x1, outlineSectionId: 'episodes' },
          { notificationMessage: '分集大纲生成完成。' },
        ),
        host['finishBackgroundTask'](_0x25b7b7, _0x4db387, {
          status: 'succeeded',
          message: '已规划 ' + _0x25b7b7['data']['episodes']['length'] + '\x20集',
          resumable: ![],
          resumePayload: createStoryEpisodeOutlineRunPayload(
            completeStoryEpisodeOutlineRun(_0xcdbe8b['run']),
          ),
        }),
        await host['persistNow'](),
        host['isProjectTaskCurrent'](_0x25b7b7) &&
          ((_0x18db86['storyPlanningOperation'] = ''),
          (_0x18db86['storyPlanningStatus'] = ''),
          host['render']()),
        !![]
      );
    } catch (_0x293090) {
      if (!host['isProjectTaskLive'](_0x25b7b7)) return ![];
      host['finishBackgroundTask'](_0x25b7b7, _0x4db387, {
        status: 'failed',
        message: '分集规划失败',
        error: _0x293090?.['message'] || '分集规划失败。',
        resumable: !![],
        ...(_0x293090?.['storyEpisodeOutlineRun']
          ? { resumePayload: createStoryEpisodeOutlineRunPayload(_0x293090['storyEpisodeOutlineRun']) }
          : {}),
      });
      const _0xb03fbd = normalizeText(_0x293090?.['message']);
      return (
        host['showTaskResultToast'](
          _0xb03fbd
            ? _0xb03fbd + '\x20已有大纲和下游内容均已保留。'
            : '分集规划失败，已有大纲和下游内容均已保留。',
          'error',
          _0x293090,
        ),
        ![]
      );
    } finally {
      host['isProjectTaskCurrent'](_0x25b7b7) &&
        _0x18db86['storyPlanningOperation'] === 'planning-episode-outlines' &&
        ((_0x18db86['storyPlanningOperation'] = ''),
        (_0x18db86['storyPlanningStatus'] = ''),
        host['render']());
    }
  }
  return Object['freeze']({ execute: _0x29a58f });
}
import { getStoryBackgroundTasks } from './storyBackgroundTasks.js';
import { mergeStoryEpisodePlans } from './storyPlanningData.js';
import {
  invalidateStoryPlanningDownstream,
  normalizeGeneratedStoryContinuityFacts,
} from './storyProjectPlanning.js';
