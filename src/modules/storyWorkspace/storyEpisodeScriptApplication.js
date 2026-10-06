import { buildStoryBackgroundTaskId, getStoryBackgroundTasks } from './storyBackgroundTasks.js';
import {
  canGenerateStoryEpisodeScript,
  getNextStoryEpisodeScriptIndex,
  mergeStoryEpisodeScript,
  saveStoryEpisodeScriptDraft,
} from './storyPlanningData.js';
import { invalidateStoryPlanningDownstream } from './storyProjectPlanning.js';
const RUN_KIND = 'story-episode-script-run',
  RUN_VERSION = 1,
  STAGE_VERSION = '1',
  PROMPT_VERSION = 'episode-script/v2',
  SCHEMA_VERSION = 'story-episode-script/v2',
  MAX_INVOCATIONS = 8,
  MAX_RAW_RESPONSE_CHARACTERS = 120000,
  SCRIPT_RESPONSE_STEPS = new Set(['generation', 'repair', 'content-revision']),
  OPTIONAL_POST_GENERATION_STEPS = new Set(['timing-review', 'timing-recheck', 'content-revision']);
let runSequence = 0;
function normalizeText(value) {
  return String(value || '').trim();
}
function cloneJson(item) {
  if (item == null) return item;
  return JSON.parse(JSON.stringify(item));
}
function stableSerialize(list) {
  if (Array.isArray(list)) return '[' + list.map(stableSerialize).join(',') + ']';
  if (list && typeof list === 'object')
    return (
      '{' +
      Object.keys(list)
        .sort()
        .map((key) => JSON.stringify(key) + ':' + stableSerialize(list[key]))
        .join(',') +
      '}'
    );
  return JSON.stringify(list ?? null);
}
function fingerprintValue(index) {
  const list2 = stableSerialize(index);
  let result = 0x811c9dc5;
  for (let data = 0; data < list2.length; data += 1) {
    ((result ^= list2.charCodeAt(data)), (result = Math.imul(result, 0x1000193)));
  }
  return 'fnv1a-' + (result >>> 0).toString(16).padStart(8, '0');
}
function getEpisodeRef(options = {}, target = 0) {
  return (
    normalizeText(options.ref || options.planningRef || options.id) || 'episode-' + (target + 1)
  );
}
function getRunInput({
  project: project = {},
  episode: episode = {},
  episodeIndex: episodeIndex = 0,
  previousEpisode: previousEpisode = null,
  nextEpisode: nextEpisode = null,
  execution: execution = {},
  regeneration: regeneration = false,
} = {}) {
  return {
    projectId: normalizeText(project.id),
    summaryRevision: Math.max(0, Math.trunc(Number(project.summaryRevision) || 0)),
    outlineRevision: Math.max(0, Math.trunc(Number(project.outlineSourceSummaryRevision) || 0)),
    scriptMode: normalizeText(project.scriptMode) || 'plot',
    episodeIndex: Math.max(0, Math.trunc(Number(episodeIndex) || 0)),
    episodeRef: getEpisodeRef(episode, episodeIndex),
    episodeFingerprint: fingerprintValue({
      title: episode.title,
      synopsis: episode.synopsis,
      hook: episode.hook,
      continuityFacts: episode.continuityFacts,
      endingState: episode.endingState,
      existingScript: regeneration ? episode.script?.fullText : '',
    }),
    previousEpisodeFingerprint: fingerprintValue({
      ref: getEpisodeRef(previousEpisode || {}, Math.max(0, episodeIndex - 1)),
      script: previousEpisode?.script?.fullText,
      endingState: previousEpisode?.endingState,
    }),
    nextEpisodeFingerprint: fingerprintValue({
      ref: getEpisodeRef(nextEpisode || {}, episodeIndex + 1),
      synopsis: nextEpisode?.synopsis,
      hook: nextEpisode?.hook,
    }),
    regeneration: regeneration === true,
    execution: {
      modelId: normalizeText(execution.modelId),
      provider: normalizeText(execution.provider),
      providerProfileId: normalizeText(execution.providerProfileId),
    },
    stageVersion: STAGE_VERSION,
    promptVersion: PROMPT_VERSION,
    schemaVersion: SCHEMA_VERSION,
  };
}
function normalizeInvocation(options2 = {}) {
  return {
    id: normalizeText(options2.id),
    stepId: normalizeText(options2.stepId),
    attempt: Math.max(1, Math.trunc(Number(options2.attempt) || 1)),
    state: normalizeText(options2.state),
    requestFingerprint: normalizeText(options2.requestFingerprint),
    rawResponse: String(options2.rawResponse || '').slice(0, MAX_RAW_RESPONSE_CHARACTERS),
    error: normalizeText(options2.error),
    preparedAt: Math.max(0, Number(options2.preparedAt || 0)),
    completedAt: Math.max(0, Number(options2.completedAt || 0)),
    retryAuthorizedAt: Math.max(0, Number(options2.retryAuthorizedAt || 0)),
  };
}
export function normalizeStoryEpisodeScriptRun(response) {
  if (
    !response ||
    typeof response !== 'object' ||
    Array.isArray(response) ||
    response.kind !== RUN_KIND ||
    Number(response.version) !== RUN_VERSION
  )
    return null;
  return {
    kind: RUN_KIND,
    version: RUN_VERSION,
    id: normalizeText(response.id),
    status: normalizeText(response.status) || 'running',
    inputFingerprint: normalizeText(response.inputFingerprint),
    input: cloneJson(response.input || {}),
    checkpoint: cloneJson(response.checkpoint || null),
    invocations: (Array.isArray(response.invocations) ? response.invocations : [])
      .map(normalizeInvocation)
      .filter((source) => source.id && source.stepId)
      .slice(-MAX_INVOCATIONS),
    candidateArtifact: cloneJson(response.candidateArtifact || null),
    errorCode: normalizeText(response.errorCode),
    error: normalizeText(response.error),
    createdAt: Math.max(0, Number(response.createdAt || 0)) || Date.now(),
    updatedAt: Math.max(0, Number(response.updatedAt || 0)) || Date.now(),
  };
}
function createRun(options3 = {}) {
  const input = getRunInput(options3),
    createdAt = Date.now();
  return (
    (runSequence += 1),
    {
      kind: RUN_KIND,
      version: RUN_VERSION,
      id:
        'episode-script:' +
        (input.projectId || 'project') +
        ':' +
        input.episodeRef +
        ':' +
        createdAt +
        ':' +
        runSequence,
      status: 'running',
      inputFingerprint: fingerprintValue(input),
      input: input,
      checkpoint: null,
      invocations: [],
      candidateArtifact: null,
      errorCode: '',
      error: '',
      createdAt: createdAt,
      updatedAt: createdAt,
    }
  );
}
function canResumeRun(next, args = {}) {
  const execution2 = normalizeStoryEpisodeScriptRun(next);
  if (!execution2 || !['running', 'failed_retryable', 'ready_to_commit'].includes(execution2.status))
    return false;
  const current =
    execution2.status === 'failed_retryable' &&
    execution2.errorCode === 'MODEL_CREDENTIAL_MISSING' &&
    execution2.invocations.length === 0 &&
    !execution2.checkpoint &&
    !execution2.candidateArtifact;
  if (current) return false;
  const fingerprintValue2 =
      fingerprintValue(getRunInput(args).execution) !== fingerprintValue(execution2.input.execution),
    enabled =
      execution2.candidateArtifact ||
      execution2.checkpoint?.repairDraft?.rawResponses?.some((response2) =>
        normalizeText(response2?.text),
      ) ||
      execution2.invocations.some((entry) => entry.state === 'completed' && entry.rawResponse);
  if (
    execution2.status === 'failed_retryable' &&
    fingerprintValue2 &&
    !enabled &&
    !runRequiresPaidRetry(execution2)
  )
    return false;
  return (
    execution2.inputFingerprint ===
    fingerprintValue(getRunInput({ ...args, execution: execution2.input.execution }))
  );
}
function runRequiresPaidRetry(record) {
  const storyEpisodeScriptRun = normalizeStoryEpisodeScriptRun(record);
  if (!storyEpisodeScriptRun) return false;
  const list3 = storyEpisodeScriptRun.invocations.filter(
    (enabled2) =>
      ['prepared', 'outcome-unknown'].includes(enabled2.state) && !enabled2.retryAuthorizedAt,
  );
  if (!list3.length) return false;
  const enabled3 = storyEpisodeScriptRun.invocations.some(
    (payload) =>
      SCRIPT_RESPONSE_STEPS.has(payload.stepId) &&
      payload.state === 'completed' &&
      payload.rawResponse,
  );
  return !enabled3 || list3.some((handle) => !OPTIONAL_POST_GENERATION_STEPS.has(handle.stepId));
}
function authorizePaidRetry(state) {
  const storyEpisodeScriptRun2 = normalizeStoryEpisodeScriptRun(state);
  if (!storyEpisodeScriptRun2) return null;
  const retryAuthorizedAt = Date.now();
  return (
    (storyEpisodeScriptRun2.invocations = storyEpisodeScriptRun2.invocations.map((args2) =>
      ['prepared', 'outcome-unknown'].includes(args2.state) && !args2.retryAuthorizedAt
        ? { ...args2, retryAuthorizedAt: retryAuthorizedAt }
        : args2,
    )),
    (storyEpisodeScriptRun2.updatedAt = retryAuthorizedAt),
    storyEpisodeScriptRun2
  );
}
function createRunPayload(config) {
  return { kind: RUN_KIND, run: cloneJson(normalizeStoryEpisodeScriptRun(config)) };
}
function getRunFromTask(options4 = {}) {
  return options4?.resumePayload?.kind === RUN_KIND
    ? normalizeStoryEpisodeScriptRun(options4.resumePayload.run)
    : null;
}
function completeRun(scope) {
  const args3 = normalizeStoryEpisodeScriptRun(scope);
  return args3
    ? {
        ...args3,
        status: 'succeeded',
        candidateArtifact: null,
        checkpoint: null,
        errorCode: '',
        error: '',
        updatedAt: Date.now(),
      }
    : null;
}
function mergeRepairDrafts(episodeRef, output) {
  const value2 =
      output?.scriptDraft && typeof output.scriptDraft === 'object'
        ? cloneJson(output.scriptDraft)
        : null,
    value3 =
      episodeRef.checkpoint?.repairDraft && typeof episodeRef.checkpoint.repairDraft === 'object'
        ? cloneJson(episodeRef.checkpoint.repairDraft)
        : null,
    list4 = [
      ...(Array.isArray(value2?.rawResponses) ? value2.rawResponses : []),
      ...(Array.isArray(value3?.rawResponses) ? value3.rawResponses : []),
      ...episodeRef.invocations
        .filter((value4) => value4.state === 'completed' && value4.rawResponse)
        .map((attempt) => ({
          attempt: attempt.attempt,
          phase: attempt.stepId,
          text: attempt.rawResponse,
        })),
    ],
    rawResponses = [
      ...new Map(
        list4.map((response3) => [
          Math.max(1, Math.trunc(Number(response3?.attempt) || 1)) +
            ':' +
            String(response3?.text || ''),
          response3,
        ]),
      ).values(),
    ],
    value5 = episodeRef.invocations.some(
      (value6) =>
        SCRIPT_RESPONSE_STEPS.has(value6.stepId) &&
        value6.state === 'completed' &&
        value6.rawResponse,
    ),
    value7 = episodeRef.invocations.some(
      (enabled4) =>
        OPTIONAL_POST_GENERATION_STEPS.has(enabled4.stepId) &&
        ['prepared', 'outcome-unknown'].includes(enabled4.state) &&
        !enabled4.retryAuthorizedAt,
    ),
    value8 = value5 && value7;
  if (!rawResponses.length) return value3 || value2;
  return {
    ...(value2 || {}),
    ...(value3 || {}),
    status: 'failed',
    episodeRef: episodeRef.input.episodeRef,
    attempts: Math.max(
      1,
      ...rawResponses.map((value9) => Math.trunc(Number(value9?.attempt) || 0)),
    ),
    rawResponses: rawResponses,
    ...(value8 ? { skipPostGenerationReview: true } : {}),
  };
}
function getErrorCode(value10) {
  return normalizeText(value10?.code) || 'STORY_EPISODE_SCRIPT_FAILED';
}
export function createStoryEpisodeScriptApplication({ generateEpisodeScript: generateEpisodeScript } = {}) {
  if (typeof generateEpisodeScript !== 'function')
    throw new TypeError('generateEpisodeScript must be a function');
  async function execute(project2 = {}) {
    const response4 = normalizeStoryEpisodeScriptRun(project2.resumeRun),
      resumed = canResumeRun(response4, project2);
    if (resumed && response4.status === 'ready_to_commit' && response4.candidateArtifact)
      return { result: cloneJson(response4.candidateArtifact), run: cloneJson(response4), resumed: true };
    let model = resumed ? response4 : createRun(project2);
    ((model.status = 'running'),
      (model.errorCode = ''),
      (model.error = ''),
      (model.updatedAt = Date.now()),
      await project2.onRunChange?.(cloneJson(model)));
    try {
      const result2 = await generateEpisodeScript({
        project: project2.project,
        episode: project2.episode,
        previousEpisode: project2.previousEpisode,
        nextEpisode: project2.nextEpisode,
        model: model.input.execution.modelId,
        provider: model.input.execution.provider,
        providerProfileId: model.input.execution.providerProfileId,
        repairDraft: mergeRepairDrafts(model, project2.episode),
        onProgress: project2.onProgress,
        onInvocation: async (stepId = {}) => {
          const preparedAt = Date.now();
          if (stepId.state === 'prepared')
            model.invocations.push(
              normalizeInvocation({
                id:
                  model.id +
                  ':' +
                  stepId.stepId +
                  ':' +
                  stepId.attempt +
                  ':' +
                  (model.invocations.length + 1),
                stepId: stepId.stepId,
                attempt: stepId.attempt,
                state: 'prepared',
                requestFingerprint: fingerprintValue({
                  model: stepId.requestPayload?.model,
                  provider: stepId.requestPayload?.provider,
                  prompt: stepId.requestPayload?.prompt,
                }),
                preparedAt: preparedAt,
              }),
            );
          else {
            const value11 = [...model.invocations]
              .reverse()
              .find(
                (value12) =>
                  value12.stepId === normalizeText(stepId.stepId) &&
                  value12.attempt === Math.max(1, Math.trunc(Number(stepId.attempt) || 1)) &&
                  value12.state === 'prepared',
              );
            value11 &&
              ((value11.state = normalizeText(stepId.state)),
              (value11.rawResponse = String(stepId.rawResponse || '').slice(
                0,
                MAX_RAW_RESPONSE_CHARACTERS,
              )),
              (value11.error = normalizeText(stepId.error)),
              (value11.completedAt = preparedAt));
          }
          ((model.invocations = model.invocations.slice(-MAX_INVOCATIONS)),
            (model.updatedAt = preparedAt),
            await project2.onRunChange?.(cloneJson(model)));
        },
      });
      return (
        (model.status = 'ready_to_commit'),
        (model.candidateArtifact = cloneJson(result2)),
        (model.checkpoint = null),
        (model.updatedAt = Date.now()),
        await project2.onRunChange?.(cloneJson(model)),
        { result: result2, run: cloneJson(model), resumed: resumed }
      );
    } catch (error) {
      const repairDraft =
        error?.partialResult &&
        typeof error.partialResult === 'object' &&
        !Array.isArray(error.partialResult)
          ? cloneJson(error.partialResult)
          : null;
      ((model.status = 'failed_retryable'),
        (model.checkpoint = repairDraft ? { repairDraft: repairDraft } : model.checkpoint),
        (model.errorCode = getErrorCode(error)),
        (model.error = normalizeText(error?.message || error)),
        (model.updatedAt = Date.now()),
        await project2.onRunChange?.(cloneJson(model)),
        (error.storyEpisodeScriptRun = cloneJson(model)));
      throw error;
    }
  }
  return Object.freeze({ execute: execute });
}
export function createStoryEpisodeScriptWorkspaceController({
  state: state2,
  generateEpisodeScript: generateEpisodeScript2,
  host: host = {},
} = {}) {
  const enabled5 =
    typeof generateEpisodeScript2 === 'function'
      ? createStoryEpisodeScriptApplication({ generateEpisodeScript: generateEpisodeScript2 })
      : null;
  async function request(
    episodeId,
    value13 = host.createProjectTaskToken(),
    { batch: batch = null, regeneration: regeneration = false } = {},
  ) {
    const value14 = value13.data;
    if (!host.isProjectTaskLive(value13)) return null;
    if (value14?.project?.sourceMode === 'upload-original')
      throw new Error('上传剧本保持原稿，不支持 AI 扩写分集正文。');
    if (!enabled5) throw new Error('完整分集剧本 Agent 尚未初始化。');
    const episodeIndex2 = value14.episodes.findIndex((value15) => value15.id === episodeId.id);
    if (
      episodeIndex2 < 0 ||
      (!regeneration && !canGenerateStoryEpisodeScript(value14.episodes, episodeIndex2))
    )
      throw new Error(
        '必须按顺序生成剧本；当前应先生成第 ' +
          (getNextStoryEpisodeScriptIndex(value14.episodes) + 1) +
          ' 集。',
      );
    const modelId = host.getPlanningContext(value14, value13),
      previousEpisode2 = episodeIndex2 > 0 ? value14.episodes[episodeIndex2 - 1] : null,
      nextEpisode2 = value14.episodes[episodeIndex2 + 1] || null,
      execution3 = {
        modelId: modelId.model,
        provider: modelId.provider,
        providerProfileId: modelId.providerProfileId,
      },
      id = buildStoryBackgroundTaskId('episode-script', { episodeId: episodeId.id }),
      storyBackgroundTasks = getStoryBackgroundTasks(value14).find((value16) => value16.id === id);
    let runFromTask = getRunFromTask(storyBackgroundTasks);
    const args4 = {
        project: modelId.project,
        episode: episodeId,
        episodeIndex: episodeIndex2,
        previousEpisode: previousEpisode2,
        nextEpisode: nextEpisode2,
        execution: execution3,
        regeneration: regeneration,
      },
      resumeRun = canResumeRun(runFromTask, args4);
    if (resumeRun && runRequiresPaidRetry(runFromTask)) {
      const value17 = await host.requestChoice({
        overlayId: 'story-episode-script-paid-retry-' + episodeId.id,
        title: '第 ' + (episodeIndex2 + 1) + ' 集正文生成结果未知',
        message:
          '上次正文生成或正文修复请求可能已经提交并计费，但没有收到确定结果。只有你确认后才会再次请求正文。',
        fallbackValue: null,
        choices: [
          { label: '暂不重试', value: null, autofocus: true },
          { label: '确认重新请求正文', value: 'retry', primary: true },
        ],
      });
      if (value17 !== 'retry') throw new Error('已停止重复请求本集剧本。');
      runFromTask = authorizePaidRetry(runFromTask);
    }
    const onRunChange = async (status) => {
      const args5 = {
          type: 'episode-script',
          scope: { episodeId: episodeId.id },
          label: '生成第 ' + (episodeIndex2 + 1) + ' 集完整剧本',
          status: status.status === 'failed_retryable' ? 'failed' : 'running',
          resumable: true,
          modelId: status.input.execution.modelId,
          provider: status.input.execution.provider,
          message: status.error || state2.episodeScriptGenerationStatus,
          error: status.error,
          resumePayload: createRunPayload(status),
          batch: batch,
        },
        storyBackgroundTasks2 = getStoryBackgroundTasks(value14).find((value18) => value18.id === id);
      if (storyBackgroundTasks2) host.updateBackgroundTask(value13, id, args5);
      else host.startBackgroundTask(value13, { id: id, ...args5 });
      const enabled6 = await host.persistNow();
      if (host.persistenceRequired() && !enabled6)
        throw new Error('分集剧本运行记录保存失败，已停止模型请求。');
    };
    try {
      const value19 = await enabled5.execute({
        ...args4,
        resumeRun: resumeRun ? runFromTask : null,
        onRunChange: onRunChange,
        onProgress: ({ message: message } = {}) => {
          if (!host.isProjectTaskLive(value13)) return;
          const message2 =
            normalizeText(message) || '正在生成第 ' + (episodeIndex2 + 1) + ' 集完整剧本';
          (host.updateBackgroundTask(value13, id, { status: 'running', message: message2 }),
            host.isProjectTaskCurrent(value13) &&
              ((state2.episodeScriptGenerationStatus = message2), host.renderPlanningProgress()));
        },
      });
      if (!host.isProjectTaskLive(value13)) return null;
      let episode2 = value14;
      regeneration
        ? ((episode2 = invalidateStoryPlanningDownstream(value14, {
            episodeScriptStartIndex: episodeIndex2,
          })),
          (episode2.episodes[episodeIndex2] = mergeStoryEpisodeScript(
            episode2.episodes[episodeIndex2],
            value19.result,
          )),
          (value13.data = episode2),
          host.registerProjectData(value13),
          host.isProjectTaskCurrent(value13) &&
            ((state2.data = episode2), host.resetDownstreamUi({ selectedEpisodeId: episodeId.id })))
        : (episode2.episodes[episodeIndex2] = mergeStoryEpisodeScript(episodeId, value19.result));
      const compiled = host.syncCompiledScripts(episode2);
      return (
        host.finishBackgroundTask(value13, id, {
          status: 'succeeded',
          message: '第 ' + (episodeIndex2 + 1) + ' 集完整剧本已生成',
          resumable: false,
          resumePayload: createRunPayload(completeRun(value19.run)),
        }),
        host.schedulePersistence({ immediate: true }),
        await host.persistNow(),
        { episode: episode2.episodes[episodeIndex2], compiled: compiled }
      );
    } catch (error2) {
      if (host.isProjectTaskLive(value13)) {
        const message3 =
          error2?.partialResult &&
          typeof error2.partialResult === 'object' &&
          !Array.isArray(error2.partialResult)
            ? cloneJson(error2.partialResult)
            : null;
        (message3 &&
          ((value14.episodes[episodeIndex2] = saveStoryEpisodeScriptDraft(
            value14.episodes[episodeIndex2],
            message3,
          )),
          host.schedulePersistence({ immediate: true })),
          host.finishBackgroundTask(value13, id, {
            status: 'failed',
            message: message3
              ? '第 ' + (episodeIndex2 + 1) + ' 集返回已保存，可继续修复'
              : '第 ' + (episodeIndex2 + 1) + ' 集剧本生成失败',
            error: error2?.message || '完整分集剧本生成失败。',
            resumable: true,
            ...(error2?.storyEpisodeScriptRun
              ? { resumePayload: createRunPayload(error2.storyEpisodeScriptRun) }
              : {}),
          }));
      }
      throw error2;
    }
  }
  return Object.freeze({ request: request });
}
