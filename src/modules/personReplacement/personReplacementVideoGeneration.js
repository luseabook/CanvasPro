import {
  getRecoverablePersonReplacementGenerationTask,
  isPersonReplacementGenerationTaskActive,
  normalizePersonReplacementGenerationTaskIdentity,
} from './personReplacementGenerationTaskIdentity.js';
const PERSON_REPLACEMENT_VIDEO_GENERATION_STATUSES = new Set([
  'idle',
  'queued',
  'submitting',
  'running',
  'succeeded',
  'failed',
]);
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function isPersonReplacementVideoGenerationActive(item) {
  return isPersonReplacementGenerationTaskActive(item);
}
export function normalizePersonReplacementVideoGenerationState(options = {}, key = '') {
  const response = options && typeof options === 'object' && !Array['isArray'](options) ? options : {},
    text = normalizeText(response['status'])['toLowerCase'](),
    requestId = normalizeText(response['requestId']),
    args = normalizePersonReplacementGenerationTaskIdentity(response),
    queueIndex = Number(response['queueIndex']),
    queueLength = Number(response['queueLength']);
  return {
    status: PERSON_REPLACEMENT_VIDEO_GENERATION_STATUSES['has'](text) ? text : 'idle',
    shotId: normalizeText(response['shotId']) || normalizeText(key),
    error: normalizeText(response['error']),
    ...(requestId ? { requestId: requestId } : {}),
    ...args,
    ...(Number['isFinite'](queueIndex) ? { queueIndex: queueIndex } : {}),
    ...(Number['isFinite'](queueLength) && queueLength >= 0x0 ? { queueLength: queueLength } : {}),
  };
}
export function getRecoverablePersonReplacementVideoTask(options2 = {}) {
  return getRecoverablePersonReplacementGenerationTask(
    normalizePersonReplacementVideoGenerationState(options2),
  );
}
export function normalizePersonReplacementVideoGenerationsByShotId(options3 = {}, index = [], result = {}) {
  const map = new Set(
      (Array['isArray'](index) ? index : [])['map']((data) => normalizeText(data?.['id']))['filter'](Boolean),
    ),
    target = options3 && typeof options3 === 'object' && !Array['isArray'](options3) ? options3 : {},
    enabled = Object['fromEntries'](
      Object['entries'](target)['flatMap'](([source, next]) => {
        const text2 = normalizeText(source);
        if (!map['has'](text2)) return [];
        return [[text2, normalizePersonReplacementVideoGenerationState(next, text2)]];
      }),
    ),
    personReplacementVideoGenerationState = normalizePersonReplacementVideoGenerationState(result);
  return (
    map['has'](personReplacementVideoGenerationState['shotId']) &&
      !enabled[personReplacementVideoGenerationState['shotId']] &&
      (enabled[personReplacementVideoGenerationState['shotId']] = personReplacementVideoGenerationState),
    enabled
  );
}
export function resolvePersonReplacementVideoGenerationState(options4 = {}, current = '') {
  const text3 = normalizeText(current),
    entry = options4?.['videoGenerationsByShotId']?.[text3];
  if (entry && typeof entry === 'object') return normalizePersonReplacementVideoGenerationState(entry, text3);
  const personReplacementVideoGenerationState2 = normalizePersonReplacementVideoGenerationState(
    options4?.['videoGeneration'],
  );
  return personReplacementVideoGenerationState2['shotId'] === text3
    ? personReplacementVideoGenerationState2
    : normalizePersonReplacementVideoGenerationState({}, text3);
}
export function updatePersonReplacementVideoGenerationState(args2 = {}, record = {}) {
  const response2 = normalizePersonReplacementVideoGenerationState(record);
  if (!response2['shotId']) return { ...args2 };
  const videoGenerationsByShotId = {
      ...(args2?.['videoGenerationsByShotId'] &&
      typeof args2['videoGenerationsByShotId'] === 'object' &&
      !Array['isArray'](args2['videoGenerationsByShotId'])
        ? args2['videoGenerationsByShotId']
        : {}),
      [response2['shotId']]: response2,
    },
    personReplacementVideoGenerationState3 = normalizePersonReplacementVideoGenerationState(
      args2?.['videoGeneration'],
    ),
    isPersonReplacementVideoGenerationActive2 =
      isPersonReplacementVideoGenerationActive(personReplacementVideoGenerationState3) &&
      isPersonReplacementVideoGenerationActive(
        videoGenerationsByShotId[personReplacementVideoGenerationState3['shotId']],
      )
        ? videoGenerationsByShotId[personReplacementVideoGenerationState3['shotId']]
        : null,
    payload = Object['values'](videoGenerationsByShotId)['find'](isPersonReplacementVideoGenerationActive),
    videoGeneration = isPersonReplacementVideoGenerationActive(response2)
      ? response2
      : isPersonReplacementVideoGenerationActive2 ||
        payload ||
        (response2['status'] === 'idle' ? normalizePersonReplacementVideoGenerationState() : response2);
  return { ...args2, videoGeneration: videoGeneration, videoGenerationsByShotId: videoGenerationsByShotId };
}
function createVideoGenerationUiRevision(options5 = {}, handle = '') {
  const shotId = normalizeText(handle),
    isReversed = (Array['isArray'](options5?.['shots']) ? options5['shots'] : [])['find'](
      (state) => normalizeText(state?.['id']) === shotId,
    );
  return JSON['stringify']({
    shotId: shotId,
    videoRef: normalizeText(isReversed?.['videoRef']),
    videoIterationReferenceRef: normalizeText(isReversed?.['videoIterationReferenceRef']),
    videoIterationInputRef: normalizeText(isReversed?.['videoIterationInputRef']),
    keyframeRef: normalizeText(isReversed?.['keyframeRef']),
    isReversed: isReversed?.['isReversed'] === !![],
    materializedIsReversed: isReversed?.['materializedIsReversed'] === !![],
    materializationStatus: normalizeText(isReversed?.['materializationStatus']),
    generationStatus: normalizeText(isReversed?.['generationStatus']),
    error: normalizeText(isReversed?.['error']),
    resultVideoRef: normalizeText(isReversed?.['resultVideoRef']),
    replacementVideo: isReversed?.['replacementVideo'] || null,
    replacementVideoInputsBySlot: isReversed?.['replacementVideoInputsBySlot'] || null,
    generation: resolvePersonReplacementVideoGenerationState(options5?.['workspace'], shotId),
  });
}
function createVideoGenerationTimelineRevision(options6 = {}) {
  return JSON['stringify'](
    (Array['isArray'](options6?.['shots']) ? options6['shots'] : [])['map']((config) =>
      createVideoGenerationUiRevision(options6, config?.['id']),
    ),
  );
}
export function resolvePersonReplacementVideoGenerationUiRefreshScope(options7 = {}, scope = {}) {
  const text4 = normalizeText(scope?.['workspace']?.['selectedShotId']);
  if (createVideoGenerationUiRevision(options7, text4) !== createVideoGenerationUiRevision(scope, text4))
    return 'selected-shot';
  return createVideoGenerationTimelineRevision(options7) !== createVideoGenerationTimelineRevision(scope)
    ? 'timeline'
    : '';
}
