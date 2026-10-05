const STORY_EPISODE_OUTLINE_RUN_KIND = 'story-episode-outline-run',
  STORY_EPISODE_OUTLINE_RUN_VERSION = 1,
  STORY_EPISODE_OUTLINE_STAGE_VERSION = '2',
  STORY_EPISODE_OUTLINE_SCHEMA_VERSION = 'story-episode-outline/v2',
  STORY_EPISODE_OUTLINE_PROMPT_VERSION = 'episode-outline-planning/v3',
  MAX_INVOCATIONS = 24,
  MAX_RAW_RESPONSE_CHARACTERS = 80000;
let runSequence = 0;
function normalizeText(value) {
  return String(value || '')['trim']();
}
function cloneJson(item) {
  if (item == null) return item;
  return JSON['parse'](JSON['stringify'](item));
}
function stableSerialize(list) {
  if (Array['isArray'](list)) return '[' + list['map'](stableSerialize)['join'](',') + ']';
  if (list && typeof list === 'object')
    return (
      '{' +
      Object['keys'](list)
        ['sort']()
        ['map']((key) => JSON['stringify'](key) + ':' + stableSerialize(list[key]))
        ['join'](',') +
      '}'
    );
  return JSON['stringify'](list ?? null);
}
function fingerprintValue(index) {
  const list2 = stableSerialize(index);
  let result = 0x811c9dc5;
  for (let data = 0; data < list2['length']; data += 1) {
    ((result ^= list2['charCodeAt'](data)), (result = Math['imul'](result, 0x1000193)));
  }
  return 'fnv1a-' + (result >>> 0)['toString'](16)['padStart'](8, '0');
}
function createRunId(options) {
  return (
    (runSequence += 1),
    'episode-planning:' + (normalizeText(options) || 'project') + ':' + Date['now']() + ':' + runSequence
  );
}
function getRunInput({
  project: project = {},
  constraints: constraints = {},
  execution: execution = {},
} = {}) {
  return {
    projectId: normalizeText(project['id']),
    summaryRevision: Math['max'](0, Math['trunc'](Number(project['summaryRevision']) || 0)),
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
function normalizeInvocation(options2 = {}) {
  return {
    id: normalizeText(options2['id']),
    stepId: normalizeText(options2['stepId']),
    attempt: Math['max'](1, Math['trunc'](Number(options2['attempt']) || 1)),
    state: normalizeText(options2['state']),
    requestFingerprint: normalizeText(options2['requestFingerprint']),
    rawResponse: String(options2['rawResponse'] || '')['slice'](0, MAX_RAW_RESPONSE_CHARACTERS),
    error: normalizeText(options2['error']),
    preparedAt: Math['max'](0, Number(options2['preparedAt'] || 0)),
    completedAt: Math['max'](0, Number(options2['completedAt'] || 0)),
    retryAuthorizedAt: Math['max'](0, Number(options2['retryAuthorizedAt'] || 0)),
  };
}
export function normalizeStoryEpisodeOutlineRun(regenerationMode2) {
  if (
    !regenerationMode2 ||
    typeof regenerationMode2 !== 'object' ||
    Array['isArray'](regenerationMode2) ||
    regenerationMode2['kind'] !== STORY_EPISODE_OUTLINE_RUN_KIND ||
    Number(regenerationMode2['version']) !== STORY_EPISODE_OUTLINE_RUN_VERSION
  )
    return null;
  return {
    kind: STORY_EPISODE_OUTLINE_RUN_KIND,
    version: STORY_EPISODE_OUTLINE_RUN_VERSION,
    id: normalizeText(regenerationMode2['id']),
    status: normalizeText(regenerationMode2['status']) || 'running',
    inputFingerprint: normalizeText(regenerationMode2['inputFingerprint']),
    input: cloneJson(regenerationMode2['input'] || {}),
    regenerationMode: regenerationMode2['regenerationMode'] === 'rebuild' ? 'rebuild' : 'preserve',
    checkpoint: cloneJson(regenerationMode2['checkpoint'] || null),
    invocations: (Array['isArray'](regenerationMode2['invocations']) ? regenerationMode2['invocations'] : [])
      ['map'](normalizeInvocation)
      ['filter']((target) => target['id'] && target['stepId'])
      ['slice'](-MAX_INVOCATIONS),
    candidateArtifact: cloneJson(regenerationMode2['candidateArtifact'] || null),
    errorCode: normalizeText(regenerationMode2['errorCode']),
    error: normalizeText(regenerationMode2['error']),
    createdAt: Math['max'](0, Number(regenerationMode2['createdAt'] || 0)) || Date['now'](),
    updatedAt: Math['max'](0, Number(regenerationMode2['updatedAt'] || 0)) || Date['now'](),
  };
}
export function getStoryEpisodeOutlineRunFromTask(options3 = {}) {
  const source = options3?.['resumePayload'];
  if (source?.['kind'] !== STORY_EPISODE_OUTLINE_RUN_KIND) return null;
  return normalizeStoryEpisodeOutlineRun(source['run']);
}
export function createStoryEpisodeOutlineRun({
  project: project = {},
  constraints: constraints = {},
  execution: execution = {},
  regenerationMode: regenerationMode = 'preserve',
} = {}) {
  const input = getRunInput({ project: project, constraints: constraints, execution: execution }),
    createdAt = Date['now']();
  return {
    kind: STORY_EPISODE_OUTLINE_RUN_KIND,
    version: STORY_EPISODE_OUTLINE_RUN_VERSION,
    id: createRunId(project['id']),
    status: 'running',
    inputFingerprint: fingerprintValue(input),
    input: input,
    regenerationMode: regenerationMode === 'rebuild' ? 'rebuild' : 'preserve',
    checkpoint: null,
    invocations: [],
    candidateArtifact: null,
    errorCode: '',
    error: '',
    createdAt: createdAt,
    updatedAt: createdAt,
  };
}
export function canResumeStoryEpisodeOutlineRun(next, current = {}) {
  const response = normalizeStoryEpisodeOutlineRun(next);
  if (!response || !['running', 'failed_retryable', 'ready_to_commit']['includes'](response['status']))
    return false;
  const runInput = getRunInput(current);
  return response['inputFingerprint'] === fingerprintValue(runInput);
}
export function storyEpisodeOutlineRunRequiresPaidRetry(entry) {
  const storyEpisodeOutlineRun = normalizeStoryEpisodeOutlineRun(entry);
  return (
    storyEpisodeOutlineRun?.['invocations']['some'](
      (enabled) =>
        ['prepared', 'outcome-unknown']['includes'](enabled['state']) && !enabled['retryAuthorizedAt'],
    ) === true
  );
}
export function authorizeStoryEpisodeOutlinePaidRetry(record) {
  const storyEpisodeOutlineRun2 = normalizeStoryEpisodeOutlineRun(record);
  if (!storyEpisodeOutlineRun2) return null;
  const retryAuthorizedAt = Date['now']();
  return (
    (storyEpisodeOutlineRun2['invocations'] = storyEpisodeOutlineRun2['invocations']['map']((args) =>
      ['prepared', 'outcome-unknown']['includes'](args['state']) && !args['retryAuthorizedAt']
        ? { ...args, retryAuthorizedAt: retryAuthorizedAt }
        : args,
    )),
    (storyEpisodeOutlineRun2['updatedAt'] = retryAuthorizedAt),
    storyEpisodeOutlineRun2
  );
}
export function createStoryEpisodeOutlineRunPayload(payload) {
  return { kind: STORY_EPISODE_OUTLINE_RUN_KIND, run: cloneJson(normalizeStoryEpisodeOutlineRun(payload)) };
}
export function completeStoryEpisodeOutlineRun(handle) {
  const args2 = normalizeStoryEpisodeOutlineRun(handle);
  if (!args2) return null;
  return {
    ...args2,
    status: 'succeeded',
    candidateArtifact: null,
    errorCode: '',
    error: '',
    updatedAt: Date['now'](),
  };
}
function createInvocationId(state, config) {
  return (
    state['id'] +
    ':' +
    config['stepId'] +
    ':' +
    config['attempt'] +
    ':' +
    (state['invocations']['length'] + 1)
  );
}
function getPersistedResumeResponses(response2) {
  if (response2['status'] !== 'running') return {};
  return response2['invocations']['reduce']((scope, attempt) => {
    return (
      attempt['state'] === 'completed' &&
        attempt['rawResponse'] &&
        (scope[attempt['stepId']] = {
          attempt: attempt['attempt'],
          response: attempt['rawResponse'],
        }),
      scope
    );
  }, {});
}
function getErrorCode(error) {
  return (
    normalizeText(error?.['code']) ||
    (/应返回.*实际返回|校验|缺少|引用/['test'](normalizeText(error?.['message']))
      ? 'MODEL_OUTPUT_VALIDATION_FAILED'
      : 'STORY_EPISODE_PLANNING_FAILED')
  );
}
export function createStoryEpisodeOutlineApplication({ planEpisodes: planEpisodes } = {}) {
  if (typeof planEpisodes !== 'function') throw new TypeError('planEpisodes must be a function');
  async function execute({
    project: project = {},
    constraints: constraints = {},
    execution: execution = {},
    regenerationMode: regenerationMode = 'preserve',
    resumeRun: resumeRun = null,
    onRunChange: onRunChange = null,
    onProgress: onProgress = null,
  } = {}) {
    const response3 = normalizeStoryEpisodeOutlineRun(resumeRun),
      execution2 = response3?.['input']?.['execution'] || execution,
      resumed = canResumeStoryEpisodeOutlineRun(response3, {
        project: project,
        constraints: constraints,
        execution: execution2,
      });
    if (resumed && response3['status'] === 'ready_to_commit' && response3['candidateArtifact'])
      return { result: cloneJson(response3['candidateArtifact']), run: cloneJson(response3), resumed: true };
    let model = resumed
      ? response3
      : createStoryEpisodeOutlineRun({
          project: project,
          constraints: constraints,
          execution: execution,
          regenerationMode: regenerationMode,
        });
    const resumeResponses = model['status'] === 'running';
    ((model['status'] = 'running'),
      (model['errorCode'] = ''),
      (model['error'] = ''),
      (model['updatedAt'] = Date['now']()),
      await onRunChange?.(cloneJson(model)));
    try {
      const result2 = await planEpisodes({
        project: project,
        constraints: constraints,
        model: model['input']['execution']['modelId'],
        provider: model['input']['execution']['provider'],
        providerProfileId: model['input']['execution']['providerProfileId'],
        resumeCheckpoint: cloneJson(model['checkpoint']),
        resumeResponses: resumeResponses ? getPersistedResumeResponses(model) : {},
        onProgress: onProgress,
        onCheckpoint: async (output) => {
          ((model['checkpoint'] = cloneJson(output)),
            (model['updatedAt'] = Date['now']()),
            await onRunChange?.(cloneJson(model)));
        },
        onInvocation: async (stepId = {}) => {
          const preparedAt = Date['now']();
          if (stepId['state'] === 'prepared')
            model['invocations']['push'](
              normalizeInvocation({
                id: createInvocationId(model, stepId),
                stepId: stepId['stepId'],
                attempt: stepId['attempt'],
                state: 'prepared',
                requestFingerprint: fingerprintValue({
                  model: stepId['requestPayload']?.['model'],
                  provider: stepId['requestPayload']?.['provider'],
                  prompt: stepId['requestPayload']?.['prompt'],
                  structuredOutput: stepId['requestPayload']?.['structuredOutput'],
                }),
                preparedAt: preparedAt,
              }),
            );
          else {
            const value2 = [...model['invocations']]
              ['reverse']()
              ['find'](
                (value3) =>
                  value3['stepId'] === normalizeText(stepId['stepId']) &&
                  value3['attempt'] === Math['max'](1, Math['trunc'](Number(stepId['attempt']) || 1)) &&
                  value3['state'] === 'prepared',
              );
            value2 &&
              ((value2['state'] = normalizeText(stepId['state'])),
              (value2['rawResponse'] = String(stepId['rawResponse'] || '')['slice'](
                0,
                MAX_RAW_RESPONSE_CHARACTERS,
              )),
              (value2['error'] = normalizeText(stepId['error'])),
              (value2['completedAt'] = preparedAt));
          }
          ((model['invocations'] = model['invocations']['slice'](-MAX_INVOCATIONS)),
            (model['updatedAt'] = preparedAt),
            await onRunChange?.(cloneJson(model)));
        },
      });
      return (
        (model['status'] = 'ready_to_commit'),
        (model['candidateArtifact'] = cloneJson(result2)),
        (model['updatedAt'] = Date['now']()),
        await onRunChange?.(cloneJson(model)),
        { result: result2, run: cloneJson(model), resumed: resumed }
      );
    } catch (error2) {
      ((model['status'] = 'failed_retryable'),
        (model['errorCode'] = getErrorCode(error2)),
        (model['error'] = normalizeText(error2?.['message'] || error2)),
        (model['updatedAt'] = Date['now']()),
        await onRunChange?.(cloneJson(model)),
        (error2['storyEpisodeOutlineRun'] = cloneJson(model)));
      throw error2;
    }
  }
  return Object['freeze']({ execute: execute });
}
export function createStoryEpisodeOutlineWorkspaceController({
  state: state2,
  planEpisodes: planEpisodes2,
  host: host = {},
} = {}) {
  const enabled2 =
    typeof planEpisodes2 === 'function'
      ? createStoryEpisodeOutlineApplication({ planEpisodes: planEpisodes2 })
      : null;
  async function execute2({ confirmRegeneration: confirmRegeneration = true } = {}) {
    if (state2['storyPlanningOperation']) return false;
    if (!enabled2) return (host['showToast']?.('分集规划 Agent 尚未初始化。', 'error'), false);
    if (!normalizeText(state2['data']['project']?.['summary']))
      return (host['showToast']?.('请先生成剧本摘要。', 'warn'), false);
    const selectedEpisodeId = host['createProjectTaskToken'](),
      value4 = selectedEpisodeId['data'],
      modelId = host['getPlanningContext'](value4, selectedEpisodeId),
      execution3 = {
        modelId: modelId['model'],
        provider: modelId['provider'],
        providerProfileId: modelId['providerProfileId'],
      },
      id = 'episode-planning',
      storyBackgroundTasks = getStoryBackgroundTasks(value4)['find']((value5) => value5['id'] === id);
    let execution4 = getStoryEpisodeOutlineRunFromTask(storyBackgroundTasks);
    const resumeRun2 = canResumeStoryEpisodeOutlineRun(execution4, {
      project: modelId['project'],
      constraints: modelId['project']['planning'],
      execution: execution4?.['input']?.['execution'] || execution3,
    });
    let regenerationMode3 = resumeRun2 ? execution4['regenerationMode'] : 'preserve';
    if (!resumeRun2 && confirmRegeneration && state2['data']['episodes']['length']) {
      regenerationMode3 = await host['requestRegenerationMode']?.({
        title: '重新规划分集',
        message: '重新生成分集大纲会清空受影响的完整分集剧本，请确认是否继续。',
      });
      if (!regenerationMode3) return false;
    }
    if (resumeRun2 && storyEpisodeOutlineRunRequiresPaidRetry(execution4)) {
      const value6 = await host['requestChoice']?.({
        overlayId: 'story-episode-planning-paid-retry-overlay',
        title: '上次模型请求结果未知',
        message: '上次请求可能已经提交并计费，但没有收到确定结果。只有你确认后才会重新请求当前批次。',
        fallbackValue: null,
        choices: [
          { label: '暂不重试', value: null, autofocus: true },
          { label: '确认重新请求', value: 'retry', primary: true },
        ],
      });
      if (value6 !== 'retry') return false;
      execution4 = authorizeStoryEpisodeOutlinePaidRetry(execution4);
    }
    const value7 = state2['data']['episodes']['length'];
    host['setPlanningOperation']('planning-episode-outlines', '正在生成所有分集大纲');
    const onRunChange2 = async (status) => {
      const args3 = {
          type: 'episode-planning',
          label: '生成分集大纲',
          status: status['status'] === 'failed_retryable' ? 'failed' : 'running',
          resumable: true,
          modelId: status['input']['execution']['modelId'],
          provider: status['input']['execution']['provider'],
          message: status['error'] || state2['storyPlanningStatus'],
          error: status['error'],
          resumePayload: createStoryEpisodeOutlineRunPayload(status),
        },
        storyBackgroundTasks2 = getStoryBackgroundTasks(value4)['find']((value8) => value8['id'] === id);
      if (storyBackgroundTasks2) host['updateBackgroundTask'](selectedEpisodeId, id, args3);
      else host['startBackgroundTask'](selectedEpisodeId, { id: id, ...args3 });
      const enabled3 = await host['persistNow']();
      if (host['persistenceRequired']?.() && !enabled3)
        throw new Error('分集大纲运行记录保存失败，已停止模型请求。');
    };
    try {
      const value9 = await enabled2['execute']({
        project: modelId['project'],
        constraints: modelId['project']['planning'],
        execution: execution3,
        regenerationMode: regenerationMode3,
        resumeRun: resumeRun2 ? execution4 : null,
        onRunChange: onRunChange2,
        onProgress: ({ message: message } = {}) => {
          if (!host['isProjectTaskLive'](selectedEpisodeId)) return;
          const message2 = normalizeText(message) || '正在生成所有分集大纲';
          (host['updateBackgroundTask'](selectedEpisodeId, id, { status: 'running', message: message2 }),
            host['isProjectTaskCurrent'](selectedEpisodeId) &&
              ((state2['storyPlanningStatus'] = message2), host['syncPlanningLoading']()));
        },
      });
      if (!host['isProjectTaskLive'](selectedEpisodeId)) return false;
      const assets = invalidateStoryPlanningDownstream(value4, { clearEpisodeOutlines: true });
      ((assets['project']['storyFacts'] = [
        ...new Set([
          ...normalizeGeneratedStoryContinuityFacts(assets['project']['continuityFacts']),
          ...normalizeGeneratedStoryContinuityFacts(value9['result']?.['storyFacts']),
        ]),
      ]),
        (assets['episodes'] = mergeStoryEpisodePlans(assets['episodes'], value9['result']?.['episodes'], {
          assets: assets['assets'],
          preserveMedia: false,
        })),
        (selectedEpisodeId['data'] = assets),
        host['registerProjectData'](selectedEpisodeId),
        (selectedEpisodeId['data']['project']['outlineStatus'] = 'completed'),
        (selectedEpisodeId['data']['project']['outlineSourceSummaryRevision'] = Math['max'](
          0,
          Math['trunc'](Number(selectedEpisodeId['data']['project']['summaryRevision']) || 0),
        )));
      host['isProjectTaskCurrent'](selectedEpisodeId) &&
        ((state2['data'] = selectedEpisodeId['data']),
        host['resetDownstreamUi']({
          selectedEpisodeId: selectedEpisodeId['data']['episodes'][0]?.['id'] || '',
        }));
      host['schedulePersistence']({ immediate: true });
      const value10 = Math['max'](0, selectedEpisodeId['data']['episodes']['length'] - value7);
      return (
        host['notifyComplete'](
          value10
            ? '分集规划完成，新增 ' + value10 + ' 集。'
            : '已规划 ' + selectedEpisodeId['data']['episodes']['length'] + ' 集。',
          selectedEpisodeId,
          { step: 1, outlineSectionId: 'episodes' },
          { notificationMessage: '分集大纲生成完成。' },
        ),
        host['finishBackgroundTask'](selectedEpisodeId, id, {
          status: 'succeeded',
          message: '已规划 ' + selectedEpisodeId['data']['episodes']['length'] + ' 集',
          resumable: false,
          resumePayload: createStoryEpisodeOutlineRunPayload(completeStoryEpisodeOutlineRun(value9['run'])),
        }),
        await host['persistNow'](),
        host['isProjectTaskCurrent'](selectedEpisodeId) &&
          ((state2['storyPlanningOperation'] = ''), (state2['storyPlanningStatus'] = ''), host['render']()),
        true
      );
    } catch (error3) {
      if (!host['isProjectTaskLive'](selectedEpisodeId)) return false;
      host['finishBackgroundTask'](selectedEpisodeId, id, {
        status: 'failed',
        message: '分集规划失败',
        error: error3?.['message'] || '分集规划失败。',
        resumable: true,
        ...(error3?.['storyEpisodeOutlineRun']
          ? { resumePayload: createStoryEpisodeOutlineRunPayload(error3['storyEpisodeOutlineRun']) }
          : {}),
      });
      const text = normalizeText(error3?.['message']);
      return (
        host['showTaskResultToast'](
          text ? text + ' 已有大纲和下游内容均已保留。' : '分集规划失败，已有大纲和下游内容均已保留。',
          'error',
          error3,
        ),
        false
      );
    } finally {
      host['isProjectTaskCurrent'](selectedEpisodeId) &&
        state2['storyPlanningOperation'] === 'planning-episode-outlines' &&
        ((state2['storyPlanningOperation'] = ''), (state2['storyPlanningStatus'] = ''), host['render']());
    }
  }
  return Object['freeze']({ execute: execute2 });
}
import { getStoryBackgroundTasks } from './storyBackgroundTasks.js';
import { mergeStoryEpisodePlans } from './storyPlanningData.js';
import {
  invalidateStoryPlanningDownstream,
  normalizeGeneratedStoryContinuityFacts,
} from './storyProjectPlanning.js';
