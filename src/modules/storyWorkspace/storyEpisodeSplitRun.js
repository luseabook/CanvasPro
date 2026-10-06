import { buildVideoReplicationSourceEvidence } from '../../domain/storyGeneration/videoReplicationSourceAnalysis.js';
const RUN_KIND = 'story-episode-split-run',
  RUN_VERSION = 1,
  MAX_INVOCATIONS = 32,
  MAX_RAW_RESPONSE_CHARACTERS = 160000;
let sequence = 0;
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
function fingerprint(index) {
  const list2 = stableSerialize(index);
  let result = 0x811c9dc5;
  for (let data = 0; data < list2.length; data += 1) {
    ((result ^= list2.charCodeAt(data)), (result = Math.imul(result, 0x1000193)));
  }
  return 'fnv1a-' + (result >>> 0).toString(16).padStart(8, '0');
}
function normalizeExecution(options = {}) {
  return {
    modelId: normalizeText(options.modelId),
    provider: normalizeText(options.provider),
    providerProfileId: normalizeText(options.providerProfileId),
  };
}
function fingerprintAppearance(args = {}) {
  const target = { ...args };
  for (const source of ['scriptFacts', 'visualDesign', 'referenceImageUrl']) {
    if (!normalizeText(target[source])) delete target[source];
  }
  return target;
}
function createInput(
  {
    project: project = {},
    episode: episode = {},
    assets: assets = [],
    constraints: constraints = {},
    execution: execution = {},
    mode: mode = 'standard',
    promptExperiment: promptExperiment = false,
  } = {},
  appearances = true,
) {
  return {
    projectId: normalizeText(project.id),
    episodeId: normalizeText(episode.id),
    episodeRef: normalizeText(episode.ref || episode.planningRef || episode.id),
    mode: normalizeText(mode) || 'standard',
    promptExperiment: promptExperiment === true,
    promptMode: normalizeText(constraints?.promptMode),
    sourceFingerprint: fingerprint({
      scriptMode: project.scriptMode,
      summaryRevision: project.summaryRevision,
      outlineRevision: project.outlineSourceSummaryRevision,
      ...(project.sourceMode === 'video-replication'
        ? {
            replication: project.replication,
            sourceEvidence: buildVideoReplicationSourceEvidence(episode, project, assets),
          }
        : {}),
      episode: {
        title: episode.title,
        synopsis: episode.synopsis,
        hook: episode.hook,
        script: episode.script?.fullText,
        scenes: episode.script?.scenes,
      },
      assets: (Array.isArray(assets) ? assets : []).map((id) => ({
        id: id?.id,
        ref: id?.ref,
        name: id?.name,
        kind: id?.kind,
        ...(project.sourceMode === 'video-replication'
          ? { description: id?.description, prompt: id?.prompt }
          : {}),
        appearances:
          appearances && Array.isArray(id?.appearances)
            ? id.appearances.map(fingerprintAppearance)
            : id?.appearances,
      })),
      constraints: constraints,
    }),
    execution: normalizeExecution(execution),
    promptVersion:
      project.sourceMode === 'video-replication'
        ? episode.replication?.sourceAnalysis?.speechEvidence
          ? 'replication-asr/v5-observed-picture'
          : 'replication-segment-plan/v6-user-review'
        : mode === 'experimental'
          ? 'episode-split-experimental/v3'
          : 'episode-split/v2',
    schemaVersion: 'story-episode-split/v2',
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
    metrics: cloneJson(options2.metrics || null),
  };
}
export function normalizeStoryEpisodeSplitRun(next) {
  const response = next?.kind === RUN_KIND && next?.run ? next.run : next;
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
    checkpointAt: Math.max(0, Number(response.checkpointAt || 0)),
    qualityReview: cloneJson(response.qualityReview || null),
    generatedCandidate: cloneJson(response.generatedCandidate || null),
    invocations: (Array.isArray(response.invocations) ? response.invocations : [])
      .map(normalizeInvocation)
      .filter((current) => current.id && current.stepId)
      .slice(-MAX_INVOCATIONS),
    candidateArtifact: cloneJson(response.candidateArtifact || null),
    error: normalizeText(response.error),
    createdAt: Math.max(0, Number(response.createdAt || 0)) || Date.now(),
    updatedAt: Math.max(0, Number(response.updatedAt || 0)) || Date.now(),
  };
}
function createRun(entry) {
  const input = createInput(entry),
    createdAt = Date.now();
  return (
    (sequence += 1),
    {
      kind: RUN_KIND,
      version: RUN_VERSION,
      id:
        'episode-split:' +
        (input.projectId || 'project') +
        ':' +
        (input.episodeId || input.episodeRef) +
        ':' +
        createdAt +
        ':' +
        sequence,
      status: 'running',
      inputFingerprint: fingerprint(input),
      input: input,
      checkpoint: null,
      checkpointAt: 0,
      qualityReview: null,
      generatedCandidate: null,
      invocations: [],
      candidateArtifact: null,
      error: '',
      createdAt: createdAt,
      updatedAt: createdAt,
    }
  );
}
function isResumable(execution2, args2) {
  if (!execution2 || !['running', 'failed_retryable', 'ready_to_commit'].includes(execution2.status))
    return false;
  const record = execution2.status === 'ready_to_commit' && execution2.candidateArtifact,
    payload = { ...args2, ...(record ? { execution: execution2.input.execution } : {}) };
  return (
    execution2.inputFingerprint === fingerprint(createInput(payload)) ||
    execution2.inputFingerprint === fingerprint(createInput(payload, false))
  );
}
function hasUncommittedPaidCall(response2) {
  if (response2.status === 'ready_to_commit' && response2.candidateArtifact) return false;
  return response2.invocations.some((handle) => {
    if (handle.retryAuthorizedAt) return false;
    if (['prepared', 'outcome-unknown'].includes(handle.state)) return true;
    return handle.state === 'completed' && handle.completedAt > response2.checkpointAt;
  });
}
export function createStoryEpisodeSplitRunRecorder({
  resumePayload: resumePayload = null,
  onChange: onChange = null,
  ...args3
} = {}) {
  const storyEpisodeSplitRun = normalizeStoryEpisodeSplitRun(resumePayload);
  let id2 = isResumable(storyEpisodeSplitRun, args3) ? storyEpisodeSplitRun : createRun(args3);
  const run = async () => {
      ((id2.updatedAt = Date.now()), await onChange?.(cloneJson(id2)));
    },
    payload2 = () => ({ kind: RUN_KIND, run: cloneJson(id2) });
  return Object.freeze({
    get execution() {
      return cloneJson(id2.input.execution);
    },
    get checkpoint() {
      return cloneJson(id2.checkpoint);
    },
    get candidateArtifact() {
      return id2.status === 'ready_to_commit' ? cloneJson(id2.candidateArtifact) : null;
    },
    get qualityReview() {
      return cloneJson(id2.qualityReview);
    },
    get generatedCandidate() {
      return cloneJson(id2.generatedCandidate);
    },
    get requiresPaidRetry() {
      return hasUncommittedPaidCall(id2);
    },
    payload: payload2,
    async start() {
      (!(id2.status === 'ready_to_commit' && id2.candidateArtifact) &&
        ((id2.status = 'running'), (id2.error = '')),
        await run());
    },
    async authorizePaidRetry() {
      const retryAuthorizedAt = Date.now();
      ((id2.invocations = id2.invocations.map((args4) =>
        !args4.retryAuthorizedAt &&
        (['prepared', 'outcome-unknown'].includes(args4.state) ||
          (args4.state === 'completed' && args4.completedAt > id2.checkpointAt))
          ? { ...args4, retryAuthorizedAt: retryAuthorizedAt }
          : args4,
      )),
        await run());
    },
    async onInvocation(stepId = {}) {
      const preparedAt = Date.now();
      if (stepId.state === 'prepared')
        ((sequence += 1),
          id2.invocations.push(
            normalizeInvocation({
              id:
                id2.id + ':' + normalizeText(stepId.stepId) + ':' + stepId.attempt + ':' + sequence,
              stepId: stepId.stepId,
              attempt: stepId.attempt,
              state: 'prepared',
              requestFingerprint: fingerprint({
                model: stepId.requestPayload?.model,
                provider: stepId.requestPayload?.provider,
                prompt: stepId.requestPayload?.prompt,
              }),
              preparedAt: preparedAt,
            }),
          ));
      else {
        const state = [...id2.invocations]
          .reverse()
          .find(
            (config) =>
              config.stepId === normalizeText(stepId.stepId) &&
              config.attempt === Math.max(1, Math.trunc(Number(stepId.attempt) || 1)) &&
              config.state === 'prepared',
          );
        state &&
          ((state.state = normalizeText(stepId.state)),
          (state.rawResponse = String(stepId.rawResponse || '').slice(
            0,
            MAX_RAW_RESPONSE_CHARACTERS,
          )),
          (state.error = normalizeText(stepId.error)),
          (state.completedAt = preparedAt),
          (state.metrics = cloneJson(stepId.metrics || null)));
      }
      ((id2.invocations = id2.invocations.slice(-MAX_INVOCATIONS)), await run());
    },
    async saveCheckpoint(scope) {
      ((id2.checkpoint = cloneJson(scope || null)), (id2.checkpointAt = Date.now()), await run());
    },
    async saveQualityReview(output) {
      ((id2.qualityReview = cloneJson(output || null)),
        (id2.checkpointAt = Date.now()),
        await run());
    },
    async saveGeneratedCandidate(value2) {
      ((id2.generatedCandidate = cloneJson(value2)), (id2.checkpointAt = Date.now()), await run());
    },
    async ready(value3) {
      ((id2.status = 'ready_to_commit'),
        (id2.candidateArtifact = cloneJson(value3)),
        (id2.checkpointAt = Date.now()),
        await run());
    },
    async failed(error) {
      ((id2.status = 'failed_retryable'), (id2.error = normalizeText(error?.message || error)));
      const value4 = error?.experimentalDraft || error?.partialResult;
      (value4 && ((id2.checkpoint = cloneJson(value4)), (id2.checkpointAt = Date.now())),
        await run());
    },
    async succeeded() {
      ((id2.status = 'succeeded'),
        (id2.candidateArtifact = null),
        (id2.generatedCandidate = null),
        (id2.checkpoint = null),
        (id2.qualityReview = null),
        (id2.checkpointAt = Date.now()),
        (id2.error = ''),
        await run());
    },
  });
}
