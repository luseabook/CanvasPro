const RUN_KIND = 'story-summary-run',
  RUN_VERSION = 1,
  MAX_INVOCATIONS = 8,
  MAX_RAW_RESPONSE_CHARACTERS = 120000;
let sequence = 0;
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
function fingerprint(index) {
  const list2 = stableSerialize(index);
  let result = 0x811c9dc5;
  for (let data = 0; data < list2['length']; data += 1) {
    ((result ^= list2['charCodeAt'](data)), (result = Math['imul'](result, 0x1000193)));
  }
  return 'fnv1a-' + (result >>> 0)['toString'](16)['padStart'](8, '0');
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
function normalizeInvocation(options = {}) {
  return {
    id: normalizeText(options['id']),
    stepId: normalizeText(options['stepId']),
    attempt: Math['max'](1, Math['trunc'](Number(options['attempt']) || 1)),
    state: normalizeText(options['state']),
    requestFingerprint: normalizeText(options['requestFingerprint']),
    rawResponse: String(options['rawResponse'] || '')['slice'](0, MAX_RAW_RESPONSE_CHARACTERS),
    error: normalizeText(options['error']),
    preparedAt: Math['max'](0, Number(options['preparedAt'] || 0)),
    completedAt: Math['max'](0, Number(options['completedAt'] || 0)),
    retryAuthorizedAt: Math['max'](0, Number(options['retryAuthorizedAt'] || 0)),
  };
}
export function normalizeStorySummaryRun(target) {
  const response = target?.['kind'] === RUN_KIND && target?.['run'] ? target['run'] : target;
  if (response?.['kind'] !== RUN_KIND || Number(response?.['version']) !== RUN_VERSION) return null;
  return {
    kind: RUN_KIND,
    version: RUN_VERSION,
    id: normalizeText(response['id']),
    status: normalizeText(response['status']) || 'running',
    inputFingerprint: normalizeText(response['inputFingerprint']),
    input: cloneJson(response['input'] || {}),
    invocations: (Array['isArray'](response['invocations']) ? response['invocations'] : [])
      ['map'](normalizeInvocation)
      ['filter']((source) => source['id'] && source['stepId'])
      ['slice'](-MAX_INVOCATIONS),
    candidateArtifact: cloneJson(response['candidateArtifact'] || null),
    error: normalizeText(response['error']),
    createdAt: Math['max'](0, Number(response['createdAt'] || 0)) || Date['now'](),
    updatedAt: Math['max'](0, Number(response['updatedAt'] || 0)) || Date['now'](),
  };
}
function createRun(next) {
  const input = createInput(next),
    createdAt = Date['now']();
  return (
    (sequence += 1),
    {
      kind: RUN_KIND,
      version: RUN_VERSION,
      id: 'story-summary:' + (input['projectId'] || 'project') + ':' + createdAt + ':' + sequence,
      status: 'running',
      inputFingerprint: fingerprint(input),
      input: input,
      invocations: [],
      candidateArtifact: null,
      error: '',
      createdAt: createdAt,
      updatedAt: createdAt,
    }
  );
}
function canResume(model, args) {
  if (!model || !['running', 'failed_retryable', 'ready_to_commit']['includes'](model['status'])) return ![];
  return (
    model['inputFingerprint'] ===
    fingerprint(
      createInput({
        ...args,
        request: {
          ...args['request'],
          model: model['input']['execution']['modelId'],
          modelId: model['input']['execution']['modelId'],
          provider: model['input']['execution']['provider'],
          providerProfileId: model['input']['execution']['providerProfileId'],
        },
      }),
    )
  );
}
function requiresPaidRetry(response2) {
  if (response2['status'] === 'ready_to_commit' && response2['candidateArtifact']) return ![];
  return response2['invocations']['some'](
    (enabled) =>
      !enabled['retryAuthorizedAt'] &&
      ['prepared', 'outcome-unknown', 'completed']['includes'](enabled['state']),
  );
}
export function createStorySummaryRunRecorder({
  project: project = {},
  request: request = {},
  resumePayload: resumePayload = null,
  onChange: onChange = null,
} = {}) {
  const storySummaryRun = normalizeStorySummaryRun(resumePayload);
  let id = canResume(storySummaryRun, { project: project, request: request })
    ? storySummaryRun
    : createRun({ project: project, request: request });
  const run = async () => {
    ((id['updatedAt'] = Date['now']()), await onChange?.(cloneJson(id)));
  };
  return Object['freeze']({
    get execution() {
      return cloneJson(id['input']['execution']);
    },
    get candidateArtifact() {
      return id['status'] === 'ready_to_commit' ? cloneJson(id['candidateArtifact']) : null;
    },
    get requiresPaidRetry() {
      return requiresPaidRetry(id);
    },
    payload: () => ({ kind: RUN_KIND, run: cloneJson(id) }),
    async start() {
      (!(id['status'] === 'ready_to_commit' && id['candidateArtifact']) &&
        ((id['status'] = 'running'), (id['error'] = '')),
        await run());
    },
    async authorizePaidRetry() {
      const retryAuthorizedAt = Date['now']();
      ((id['invocations'] = id['invocations']['map']((args2) =>
        !args2['retryAuthorizedAt'] &&
        ['prepared', 'outcome-unknown', 'completed']['includes'](args2['state'])
          ? { ...args2, retryAuthorizedAt: retryAuthorizedAt }
          : args2,
      )),
        await run());
    },
    async onInvocation(stepId = {}) {
      const preparedAt = Date['now']();
      if (stepId['state'] === 'prepared')
        ((sequence += 1),
          id['invocations']['push'](
            normalizeInvocation({
              id: id['id'] + ':' + normalizeText(stepId['stepId']) + ':' + stepId['attempt'] + ':' + sequence,
              stepId: stepId['stepId'],
              attempt: stepId['attempt'],
              state: 'prepared',
              requestFingerprint: fingerprint({
                model: stepId['requestPayload']?.['model'],
                provider: stepId['requestPayload']?.['provider'],
                prompt: stepId['requestPayload']?.['prompt'],
              }),
              preparedAt: preparedAt,
            }),
          ));
      else {
        const current = [...id['invocations']]
          ['reverse']()
          ['find'](
            (entry) =>
              entry['stepId'] === normalizeText(stepId['stepId']) &&
              entry['attempt'] === Math['max'](1, Math['trunc'](Number(stepId['attempt']) || 1)) &&
              entry['state'] === 'prepared',
          );
        current &&
          ((current['state'] = normalizeText(stepId['state'])),
          (current['rawResponse'] = String(stepId['rawResponse'] || '')['slice'](
            0,
            MAX_RAW_RESPONSE_CHARACTERS,
          )),
          (current['error'] = normalizeText(stepId['error'])),
          (current['completedAt'] = preparedAt));
      }
      ((id['invocations'] = id['invocations']['slice'](-MAX_INVOCATIONS)), await run());
    },
    async ready(record) {
      ((id['status'] = 'ready_to_commit'), (id['candidateArtifact'] = cloneJson(record)), await run());
    },
    async failed(error) {
      ((id['status'] = 'failed_retryable'),
        (id['error'] = normalizeText(error?.['message'] || error)),
        await run());
    },
    async succeeded() {
      ((id['status'] = 'succeeded'), (id['candidateArtifact'] = null), (id['error'] = ''), await run());
    },
  });
}
