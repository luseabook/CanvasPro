import { localPathToUrl } from '../../utils/localMediaPath.js';
const PERSON_REPLACEMENT_VOICE_SEPARATION_STATUSES = new Set([
    'idle',
    'submitting',
    'running',
    'succeeded',
    'failed',
    'cancelled',
  ]),
  PERSON_REPLACEMENT_ACTIVE_VOICE_SEPARATION_STATUSES = new Set(['submitting', 'running']);
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function normalizePersonReplacementVoiceSeparationState(options = {}) {
  const response = options && typeof options === 'object' ? options : {},
    text = normalizeText(response['status'])['toLowerCase']();
  return {
    sourceId: normalizeText(response['sourceId']),
    status: PERSON_REPLACEMENT_VOICE_SEPARATION_STATUSES['has'](text) ? text : 'idle',
    requestId: normalizeText(response['requestId']),
    inputRevision: normalizeText(response['inputRevision']),
    taskId: normalizeText(response['taskId']),
    providerProfileId: normalizeText(response['providerProfileId']),
    startedAt: normalizeText(response['startedAt']),
    completedAt: normalizeText(response['completedAt']),
    vocalsAudioRef: normalizeText(response['vocalsAudioRef']),
    vocalsAudioUrl: normalizeText(response['vocalsAudioUrl']),
    backgroundAudioRef: normalizeText(response['backgroundAudioRef']),
    backgroundAudioUrl: normalizeText(response['backgroundAudioUrl']),
    error: normalizeText(response['error']),
  };
}
export function normalizePersonReplacementVoiceSeparationsBySourceId(options2 = {}) {
  const item = options2 && typeof options2 === 'object' && !Array['isArray'](options2) ? options2 : {};
  return Object['fromEntries'](
    Object['entries'](item)
      ['map'](([key, args]) => {
        const sourceId = normalizeText(key || args?.['sourceId']);
        return sourceId
          ? [sourceId, normalizePersonReplacementVoiceSeparationState({ ...args, sourceId: sourceId })]
          : null;
      })
      ['filter'](Boolean),
  );
}
export function resolvePersonReplacementVoiceSeparationState(options3 = {}, index = '') {
  const sourceId2 = normalizeText(index);
  return normalizePersonReplacementVoiceSeparationState({
    ...(options3?.['audio']?.['voiceSeparationsBySourceId']?.[sourceId2] || {}),
    sourceId: sourceId2,
  });
}
export function updatePersonReplacementVoiceSeparationState(args2 = {}, result = {}) {
  const personReplacementVoiceSeparationState = normalizePersonReplacementVoiceSeparationState(result);
  if (!personReplacementVoiceSeparationState['sourceId']) return args2;
  return {
    ...args2,
    voiceSeparationsBySourceId: {
      ...normalizePersonReplacementVoiceSeparationsBySourceId(args2['voiceSeparationsBySourceId']),
      [personReplacementVoiceSeparationState['sourceId']]: personReplacementVoiceSeparationState,
    },
  };
}
export function isPersonReplacementVoiceSeparationActive(options4 = {}) {
  return PERSON_REPLACEMENT_ACTIVE_VOICE_SEPARATION_STATUSES['has'](
    normalizePersonReplacementVoiceSeparationState(options4)['status'],
  );
}
export function resolvePersonReplacementVoiceInput(options5 = {}, data = '') {
  const text2 = normalizeText(data),
    source2 = (Array['isArray'](options5?.['sources']) ? options5['sources'] : [])['find'](
      (target) => normalizeText(target?.['id']) === text2,
    ),
    separation = resolvePersonReplacementVoiceSeparationState(options5, text2),
    kind = normalizeText(separation['vocalsAudioRef'] || separation['vocalsAudioUrl']);
  return {
    kind: kind ? 'clean-vocals' : 'original-video',
    mediaRef: kind || normalizeText(source2?.['videoRef']),
    audioUrl: normalizeText(
      separation['vocalsAudioUrl'] || localPathToUrl(separation['vocalsAudioRef']) || kind,
    ),
    separation: separation,
    source: source2,
  };
}
export function createPersonReplacementVoiceSeparationRevision({
  project: project = {},
  source: source = {},
} = {}) {
  return JSON['stringify']({
    projectId: normalizeText(project?.['id']),
    sourceId: normalizeText(source?.['id']),
    videoRef: normalizeText(source?.['videoRef']),
  });
}
