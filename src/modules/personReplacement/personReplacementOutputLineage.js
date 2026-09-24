export const PERSON_REPLACEMENT_OUTPUT_TRANSITIONS = Object['freeze']({
  INVALIDATE: 'invalidate',
  FINAL_MUX_INVALIDATE: 'final-mux-invalidate',
  SOURCE_GRAPH_CHANGED: 'source-graph-changed',
  COMPOSITION_SUCCEEDED: 'composition-succeeded',
  FINAL_MUX_SUCCEEDED: 'final-mux-succeeded',
});
function normalizeText(_0x175924) {
  return String(_0x175924 ?? '')['trim']();
}
function invalidateOutput(_0x2a441a) {
  const _0x2be53c = _0x2a441a['output'] || {},
    _0x3e0b2c = Boolean(
      normalizeText(_0x2be53c['originalMasterRef']) &&
      normalizeText(_0x2be53c['visualMasterRef'] || _0x2be53c['finalVideoRef']),
    );
  if (_0x3e0b2c)
    return {
      ..._0x2a441a,
      output: { ..._0x2be53c, composeStatus: 'pending' },
      workspace: { ...(_0x2a441a['workspace'] || {}), compositePreviewMode: 'full' },
    };
  return {
    ..._0x2a441a,
    audio: { ...(_0x2a441a['audio'] || {}), originalAudioRef: '' },
    output: {
      ..._0x2be53c,
      originalMasterRef: '',
      visualMasterRef: '',
      finalVideoRef: '',
      finalAudioTrack: '',
      composeStatus: 'pending',
      composedShotIds: [],
    },
    workspace: { ...(_0x2a441a['workspace'] || {}), compositePreviewMode: 'shot' },
  };
}
function completeComposition(_0x5aaf0f, _0xd7fbd7) {
  const _0x13c9e6 = normalizeText(_0xd7fbd7['originalMasterRef']),
    _0x82ef0 = normalizeText(_0xd7fbd7['visualMasterRef']);
  if (!_0x13c9e6 || !_0x82ef0)
    throw new TypeError(
      'Replacement\x20Studio\x20composition\x20requires\x20original\x20and\x20visual\x20masters',
    );
  const _0x35e59a = Array['isArray'](_0xd7fbd7['composedShotIds'])
    ? _0xd7fbd7['composedShotIds']['map'](normalizeText)['filter'](Boolean)
    : [];
  return {
    ..._0x5aaf0f,
    status: 'completed',
    audio: { ...(_0x5aaf0f['audio'] || {}), originalAudioRef: _0x13c9e6 },
    output: {
      ...(_0x5aaf0f['output'] || {}),
      originalMasterRef: _0x13c9e6,
      visualMasterRef: _0x82ef0,
      finalVideoRef: '',
      finalAudioTrack: '',
      composeStatus: 'succeeded',
      composedShotIds: _0x35e59a,
    },
    workspace: { ...(_0x5aaf0f['workspace'] || {}), compositePreviewMode: 'full' },
  };
}
function invalidateFinalMux(_0x62376d) {
  return { ..._0x62376d, output: { ...(_0x62376d['output'] || {}), finalVideoRef: '', finalAudioTrack: '' } };
}
function applySourceGraphChange(_0x424a22, _0x3b9b56) {
  return {
    ..._0x424a22,
    audio: {
      ...(_0x424a22['audio'] || {}),
      originalAudioRef: normalizeText(_0x3b9b56['nextOriginalAudioRef']),
    },
    output: {
      ...(_0x424a22['output'] || {}),
      originalMasterRef: '',
      visualMasterRef: '',
      finalVideoRef: '',
      finalAudioTrack: '',
      composeStatus: normalizeText(_0x3b9b56['composeStatus']) || 'pending',
      composedShotIds: [],
    },
    workspace: { ...(_0x424a22['workspace'] || {}), compositePreviewMode: 'shot' },
  };
}
function completeFinalMux(_0x5df3ed, _0xea04fa) {
  const _0x538d41 = normalizeText(_0xea04fa['finalVideoRef']),
    _0x306198 = normalizeText(_0xea04fa['finalAudioTrack']);
  if (!_0x538d41 || !['original', 'replacement']['includes'](_0x306198))
    throw new TypeError('Replacement Studio final mux requires a video and audio track');
  return {
    ..._0x5df3ed,
    output: { ...(_0x5df3ed['output'] || {}), finalVideoRef: _0x538d41, finalAudioTrack: _0x306198 },
  };
}
export function transitionPersonReplacementOutput(_0x2acc24 = {}, _0xb9fa64 = {}) {
  const _0x2d0d1f = normalizeText(_0xb9fa64['type']);
  if (_0x2d0d1f === PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['INVALIDATE']) return invalidateOutput(_0x2acc24);
  if (_0x2d0d1f === PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['FINAL_MUX_INVALIDATE'])
    return invalidateFinalMux(_0x2acc24);
  if (_0x2d0d1f === PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['SOURCE_GRAPH_CHANGED'])
    return applySourceGraphChange(_0x2acc24, _0xb9fa64);
  if (_0x2d0d1f === PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['COMPOSITION_SUCCEEDED'])
    return completeComposition(_0x2acc24, _0xb9fa64);
  if (_0x2d0d1f === PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['FINAL_MUX_SUCCEEDED'])
    return completeFinalMux(_0x2acc24, _0xb9fa64);
  throw new TypeError('Unknown\x20Replacement\x20Studio\x20output\x20transition:\x20' + _0x2d0d1f);
}
