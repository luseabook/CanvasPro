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
function normalizeText(_0x1015ff) {
  return String(_0x1015ff ?? '')['trim']();
}
export function normalizePersonReplacementVoiceSeparationState(_0x3044cb = {}) {
  const _0x11e176 = _0x3044cb && typeof _0x3044cb === 'object' ? _0x3044cb : {},
    _0x993383 = normalizeText(_0x11e176['status'])['toLowerCase']();
  return {
    sourceId: normalizeText(_0x11e176['sourceId']),
    status: PERSON_REPLACEMENT_VOICE_SEPARATION_STATUSES['has'](_0x993383) ? _0x993383 : 'idle',
    requestId: normalizeText(_0x11e176['requestId']),
    inputRevision: normalizeText(_0x11e176['inputRevision']),
    taskId: normalizeText(_0x11e176['taskId']),
    providerProfileId: normalizeText(_0x11e176['providerProfileId']),
    startedAt: normalizeText(_0x11e176['startedAt']),
    completedAt: normalizeText(_0x11e176['completedAt']),
    vocalsAudioRef: normalizeText(_0x11e176['vocalsAudioRef']),
    vocalsAudioUrl: normalizeText(_0x11e176['vocalsAudioUrl']),
    backgroundAudioRef: normalizeText(_0x11e176['backgroundAudioRef']),
    backgroundAudioUrl: normalizeText(_0x11e176['backgroundAudioUrl']),
    error: normalizeText(_0x11e176['error']),
  };
}
export function normalizePersonReplacementVoiceSeparationsBySourceId(_0x3b8ab4 = {}) {
  const _0x3ad337 =
    _0x3b8ab4 && typeof _0x3b8ab4 === 'object' && !Array['isArray'](_0x3b8ab4) ? _0x3b8ab4 : {};
  return Object['fromEntries'](
    Object['entries'](_0x3ad337)
      ['map'](([_0x19bdec, _0x5eb3d2]) => {
        const _0x24f64d = normalizeText(_0x19bdec || _0x5eb3d2?.['sourceId']);
        return _0x24f64d
          ? [_0x24f64d, normalizePersonReplacementVoiceSeparationState({ ..._0x5eb3d2, sourceId: _0x24f64d })]
          : null;
      })
      ['filter'](Boolean),
  );
}
export function resolvePersonReplacementVoiceSeparationState(_0x85c900 = {}, _0x51fffe = '') {
  const _0x305c20 = normalizeText(_0x51fffe);
  return normalizePersonReplacementVoiceSeparationState({
    ...(_0x85c900?.['audio']?.['voiceSeparationsBySourceId']?.[_0x305c20] || {}),
    sourceId: _0x305c20,
  });
}
export function updatePersonReplacementVoiceSeparationState(_0x3af312 = {}, _0x189a5f = {}) {
  const _0x2e093e = normalizePersonReplacementVoiceSeparationState(_0x189a5f);
  if (!_0x2e093e['sourceId']) return _0x3af312;
  return {
    ..._0x3af312,
    voiceSeparationsBySourceId: {
      ...normalizePersonReplacementVoiceSeparationsBySourceId(_0x3af312['voiceSeparationsBySourceId']),
      [_0x2e093e['sourceId']]: _0x2e093e,
    },
  };
}
export function isPersonReplacementVoiceSeparationActive(_0x51c367 = {}) {
  return PERSON_REPLACEMENT_ACTIVE_VOICE_SEPARATION_STATUSES['has'](
    normalizePersonReplacementVoiceSeparationState(_0x51c367)['status'],
  );
}
export function resolvePersonReplacementVoiceInput(_0x504c42 = {}, _0x9730be = '') {
  const _0x59d732 = normalizeText(_0x9730be),
    _0x3a3389 = (Array['isArray'](_0x504c42?.['sources']) ? _0x504c42['sources'] : [])['find'](
      (_0x5513ae) => normalizeText(_0x5513ae?.['id']) === _0x59d732,
    ),
    _0x13588e = resolvePersonReplacementVoiceSeparationState(_0x504c42, _0x59d732),
    _0x302aa8 = normalizeText(_0x13588e['vocalsAudioRef'] || _0x13588e['vocalsAudioUrl']);
  return {
    kind: _0x302aa8 ? 'clean-vocals' : 'original-video',
    mediaRef: _0x302aa8 || normalizeText(_0x3a3389?.['videoRef']),
    audioUrl: normalizeText(
      _0x13588e['vocalsAudioUrl'] || localPathToUrl(_0x13588e['vocalsAudioRef']) || _0x302aa8,
    ),
    separation: _0x13588e,
    source: _0x3a3389,
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
