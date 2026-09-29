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
function normalizeText(_0x257a4c) {
  return String(_0x257a4c ?? '')['trim']();
}
export function isPersonReplacementVideoGenerationActive(_0xb2889b) {
  return isPersonReplacementGenerationTaskActive(_0xb2889b);
}
export function normalizePersonReplacementVideoGenerationState(_0xa58554 = {}, _0xb0baf0 = '') {
  const _0x4d803e =
      _0xa58554 && typeof _0xa58554 === 'object' && !Array['isArray'](_0xa58554) ? _0xa58554 : {},
    _0x52229b = normalizeText(_0x4d803e['status'])['toLowerCase'](),
    _0x23c7d9 = normalizeText(_0x4d803e['requestId']),
    _0x1bc23a = normalizePersonReplacementGenerationTaskIdentity(_0x4d803e),
    _0x322e7d = Number(_0x4d803e['queueIndex']),
    _0x8443f8 = Number(_0x4d803e['queueLength']);
  return {
    status: PERSON_REPLACEMENT_VIDEO_GENERATION_STATUSES['has'](_0x52229b) ? _0x52229b : 'idle',
    shotId: normalizeText(_0x4d803e['shotId']) || normalizeText(_0xb0baf0),
    error: normalizeText(_0x4d803e['error']),
    ...(_0x23c7d9 ? { requestId: _0x23c7d9 } : {}),
    ..._0x1bc23a,
    ...(Number['isFinite'](_0x322e7d) ? { queueIndex: _0x322e7d } : {}),
    ...(Number['isFinite'](_0x8443f8) && _0x8443f8 >= 0x0 ? { queueLength: _0x8443f8 } : {}),
  };
}
export function getRecoverablePersonReplacementVideoTask(_0x151ffa = {}) {
  return getRecoverablePersonReplacementGenerationTask(
    normalizePersonReplacementVideoGenerationState(_0x151ffa),
  );
}
export function normalizePersonReplacementVideoGenerationsByShotId(
  _0x53998d = {},
  _0x1f1b7b = [],
  _0xf27014 = {},
) {
  const _0x4506c5 = new Set(
      (Array['isArray'](_0x1f1b7b) ? _0x1f1b7b : [])
        ['map']((_0x54b72d) => normalizeText(_0x54b72d?.['id']))
        ['filter'](Boolean),
    ),
    _0xc7dbed = _0x53998d && typeof _0x53998d === 'object' && !Array['isArray'](_0x53998d) ? _0x53998d : {},
    _0x2f3461 = Object['fromEntries'](
      Object['entries'](_0xc7dbed)['flatMap'](([_0x46aff3, _0x3cab62]) => {
        const _0x13fa28 = normalizeText(_0x46aff3);
        if (!_0x4506c5['has'](_0x13fa28)) return [];
        return [[_0x13fa28, normalizePersonReplacementVideoGenerationState(_0x3cab62, _0x13fa28)]];
      }),
    ),
    _0x3681cd = normalizePersonReplacementVideoGenerationState(_0xf27014);
  return (
    _0x4506c5['has'](_0x3681cd['shotId']) &&
      !_0x2f3461[_0x3681cd['shotId']] &&
      (_0x2f3461[_0x3681cd['shotId']] = _0x3681cd),
    _0x2f3461
  );
}
export function resolvePersonReplacementVideoGenerationState(_0x907bb0 = {}, _0x1010b4 = '') {
  const _0x38d408 = normalizeText(_0x1010b4),
    _0x27c353 = _0x907bb0?.['videoGenerationsByShotId']?.[_0x38d408];
  if (_0x27c353 && typeof _0x27c353 === 'object')
    return normalizePersonReplacementVideoGenerationState(_0x27c353, _0x38d408);
  const _0x33fa8a = normalizePersonReplacementVideoGenerationState(_0x907bb0?.['videoGeneration']);
  return _0x33fa8a['shotId'] === _0x38d408
    ? _0x33fa8a
    : normalizePersonReplacementVideoGenerationState({}, _0x38d408);
}
export function updatePersonReplacementVideoGenerationState(_0x286884 = {}, _0x2e0343 = {}) {
  const _0x394bfe = normalizePersonReplacementVideoGenerationState(_0x2e0343);
  if (!_0x394bfe['shotId']) return { ..._0x286884 };
  const _0x2b28ac = {
      ...(_0x286884?.['videoGenerationsByShotId'] &&
      typeof _0x286884['videoGenerationsByShotId'] === 'object' &&
      !Array['isArray'](_0x286884['videoGenerationsByShotId'])
        ? _0x286884['videoGenerationsByShotId']
        : {}),
      [_0x394bfe['shotId']]: _0x394bfe,
    },
    _0x128fe9 = normalizePersonReplacementVideoGenerationState(_0x286884?.['videoGeneration']),
    _0x1083ac =
      isPersonReplacementVideoGenerationActive(_0x128fe9) &&
      isPersonReplacementVideoGenerationActive(_0x2b28ac[_0x128fe9['shotId']])
        ? _0x2b28ac[_0x128fe9['shotId']]
        : null,
    _0x526d0d = Object['values'](_0x2b28ac)['find'](isPersonReplacementVideoGenerationActive),
    _0x270767 = isPersonReplacementVideoGenerationActive(_0x394bfe)
      ? _0x394bfe
      : _0x1083ac ||
        _0x526d0d ||
        (_0x394bfe['status'] === 'idle' ? normalizePersonReplacementVideoGenerationState() : _0x394bfe);
  return { ..._0x286884, videoGeneration: _0x270767, videoGenerationsByShotId: _0x2b28ac };
}
function createVideoGenerationUiRevision(_0x4da16d = {}, _0x15c157 = '') {
  const _0x747522 = normalizeText(_0x15c157),
    _0x2af585 = (Array['isArray'](_0x4da16d?.['shots']) ? _0x4da16d['shots'] : [])['find'](
      (_0x20ca3c) => normalizeText(_0x20ca3c?.['id']) === _0x747522,
    );
  return JSON['stringify']({
    shotId: _0x747522,
    videoRef: normalizeText(_0x2af585?.['videoRef']),
    videoIterationReferenceRef: normalizeText(_0x2af585?.['videoIterationReferenceRef']),
    videoIterationInputRef: normalizeText(_0x2af585?.['videoIterationInputRef']),
    keyframeRef: normalizeText(_0x2af585?.['keyframeRef']),
    isReversed: _0x2af585?.['isReversed'] === !![],
    materializedIsReversed: _0x2af585?.['materializedIsReversed'] === !![],
    materializationStatus: normalizeText(_0x2af585?.['materializationStatus']),
    generationStatus: normalizeText(_0x2af585?.['generationStatus']),
    error: normalizeText(_0x2af585?.['error']),
    resultVideoRef: normalizeText(_0x2af585?.['resultVideoRef']),
    replacementVideo: _0x2af585?.['replacementVideo'] || null,
    replacementVideoInputsBySlot: _0x2af585?.['replacementVideoInputsBySlot'] || null,
    generation: resolvePersonReplacementVideoGenerationState(_0x4da16d?.['workspace'], _0x747522),
  });
}
function createVideoGenerationTimelineRevision(_0x17b9c1 = {}) {
  return JSON['stringify'](
    (Array['isArray'](_0x17b9c1?.['shots']) ? _0x17b9c1['shots'] : [])['map']((_0x2ee0af) =>
      createVideoGenerationUiRevision(_0x17b9c1, _0x2ee0af?.['id']),
    ),
  );
}
export function resolvePersonReplacementVideoGenerationUiRefreshScope(_0x2b8970 = {}, _0x27857e = {}) {
  const _0x168224 = normalizeText(_0x27857e?.['workspace']?.['selectedShotId']);
  if (
    createVideoGenerationUiRevision(_0x2b8970, _0x168224) !==
    createVideoGenerationUiRevision(_0x27857e, _0x168224)
  )
    return 'selected-shot';
  return createVideoGenerationTimelineRevision(_0x2b8970) !== createVideoGenerationTimelineRevision(_0x27857e)
    ? 'timeline'
    : '';
}
