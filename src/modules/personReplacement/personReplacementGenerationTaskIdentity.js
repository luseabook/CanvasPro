const ACTIVE_GENERATION_TASK_STATUSES = new Set(['queued', 'submitting', 'running']);
export const PERSON_REPLACEMENT_GENERATION_TASK_IDENTITY_FIELDS = Object.freeze([
  'taskId',
  'modelId',
  'provider',
  'providerProfileId',
  'executionId',
]);
function normalizeText(value) {
  return String(value ?? '').trim();
}
function firstText(...args) {
  for (const item of args) {
    const text = normalizeText(item);
    if (text) return text;
  }
  return '';
}
function firstPositiveNumber(...args2) {
  for (const key of args2) {
    const count = Number(key);
    if (Number.isFinite(count) && count > 0) return count;
  }
  return 0;
}
export function isPersonReplacementGenerationTaskActive(response) {
  const index = response && typeof response === 'object' ? response.status : response;
  return ACTIVE_GENERATION_TASK_STATUSES.has(normalizeText(index).toLowerCase());
}
export function normalizePersonReplacementGenerationTaskIdentity(options = {}) {
  const result = options && typeof options === 'object' && !Array.isArray(options) ? options : {},
    args3 = Object.fromEntries(
      PERSON_REPLACEMENT_GENERATION_TASK_IDENTITY_FIELDS.flatMap((data) => {
        const text2 = normalizeText(result[data]);
        return text2 ? [[data, text2]] : [];
      }),
    ),
    startedAt = firstPositiveNumber(result.startedAt);
  return {
    ...args3,
    ...(startedAt ? { startedAt: startedAt } : {}),
    ...(result.useOpenapiQuery === true ? { useOpenapiQuery: true } : {}),
  };
}
export function projectPersonReplacementGenerationTaskIdentity({
  taskId: taskId = '',
  meta: meta = {},
  defaults: defaults = {},
} = {}) {
  const useOpenapiQuery = meta && typeof meta === 'object' ? meta : {},
    target = defaults && typeof defaults === 'object' ? defaults : {};
  return normalizePersonReplacementGenerationTaskIdentity({
    taskId: firstText(useOpenapiQuery.taskId, taskId, target.taskId),
    modelId: firstText(useOpenapiQuery.modelId, target.modelId),
    provider: firstText(useOpenapiQuery.provider, target.provider),
    providerProfileId: firstText(
      useOpenapiQuery.providerProfileId,
      useOpenapiQuery.rhProviderProfileId,
      target.providerProfileId,
      target.rhProviderProfileId,
    ),
    executionId: firstText(useOpenapiQuery.executionId, target.executionId),
    startedAt: firstPositiveNumber(useOpenapiQuery.startedAt, target.startedAt),
    useOpenapiQuery: useOpenapiQuery.useOpenapiQuery === true || target.useOpenapiQuery === true,
  });
}
export function hasPersonReplacementGenerationTaskIdentityChanged(options2 = {}, source = {}) {
  const personReplacementGenerationTaskIdentity = normalizePersonReplacementGenerationTaskIdentity(options2),
    personReplacementGenerationTaskIdentity2 = normalizePersonReplacementGenerationTaskIdentity(source);
  return [...PERSON_REPLACEMENT_GENERATION_TASK_IDENTITY_FIELDS, 'startedAt', 'useOpenapiQuery'].some(
    (next) =>
      !Object.is(
        personReplacementGenerationTaskIdentity[next],
        personReplacementGenerationTaskIdentity2[next],
      ),
  );
}
export function getRecoverablePersonReplacementGenerationTask(options3 = {}) {
  const response2 = options3 && typeof options3 === 'object' && !Array.isArray(options3) ? options3 : {},
    args4 = normalizePersonReplacementGenerationTaskIdentity(response2);
  if (!isPersonReplacementGenerationTaskActive(response2) || !args4.taskId || !args4.modelId)
    return null;
  return {
    status: normalizeText(response2.status).toLowerCase(),
    ...args4,
    requestId: normalizeText(response2.requestId),
  };
}
