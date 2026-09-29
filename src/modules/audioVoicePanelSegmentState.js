import { pickAudioDurationSec } from '../services/audioMetadataService.js';
import { localPathToUrl, normalizeLocalPath } from '../utils/localMediaPath.js';
const AUDIO_VOICE_HISTORY_LIMIT = 0x5;
export function firstNonEmptyString(..._0x1ebd61) {
  for (const _0x22b661 of _0x1ebd61) {
    const _0x5d68a8 = String(_0x22b661 || '')['trim']();
    if (_0x5d68a8) return _0x5d68a8;
  }
  return '';
}
export function resolveSegmentLocalAudioUrl(_0x5339a0, _0x100e59) {
  return firstNonEmptyString(_0x5339a0, localPathToUrl(_0x100e59));
}
function normalizeAudioVoiceHistoryEntry(_0x379196 = {}) {
  const _0x376d7b = normalizeLocalPath(_0x379196['localPath'] || _0x379196['convertedAudioLocalPath'] || ''),
    _0x20f5ea = resolveSegmentLocalAudioUrl(
      firstNonEmptyString(_0x379196['audioUrl'], _0x379196['src'], _0x379196['convertedAudioUrl']),
      _0x376d7b,
    );
  if (!_0x20f5ea && !_0x376d7b) return null;
  const _0x43dac3 = Number(_0x379196['createdAt'] || 0x0) || Date['now']();
  return {
    id: String(_0x379196['id'] || 'audio-voice-history-' + _0x43dac3)['trim'](),
    createdAt: _0x43dac3,
    modelId: String(_0x379196['modelId'] || '')['trim'](),
    modelLabel: String(_0x379196['modelLabel'] || '')['trim'](),
    localPath: _0x376d7b,
    audioUrl: _0x20f5ea,
    audioDuration: pickAudioDurationSec(_0x379196['audioDuration'], _0x379196['duration']),
  };
}
export function normalizeAudioVoiceHistory(_0x366304 = []) {
  const _0x323449 = [],
    _0x55a80c = new Set();
  for (const _0x4ae7a1 of Array['isArray'](_0x366304) ? _0x366304 : []) {
    const _0xf49bec = normalizeAudioVoiceHistoryEntry(_0x4ae7a1);
    if (!_0xf49bec) continue;
    const _0x4cbcfe = _0xf49bec['localPath'] + '::' + _0xf49bec['audioUrl'];
    if (_0x55a80c['has'](_0x4cbcfe)) continue;
    (_0x55a80c['add'](_0x4cbcfe), _0x323449['push'](_0xf49bec));
  }
  return _0x323449['sort'](
    (_0x46d3dd, _0x3e2ab3) => Number(_0x3e2ab3['createdAt'] || 0x0) - Number(_0x46d3dd['createdAt'] || 0x0),
  )['slice'](0x0, AUDIO_VOICE_HISTORY_LIMIT);
}
export function buildAudioVoiceHistoryEntry(_0x5a50e1 = {}, _0x1ad689 = {}) {
  const _0xf7d39e = Number(_0x1ad689['createdAt'] || 0x0) || Date['now']();
  return normalizeAudioVoiceHistoryEntry({
    id: _0x1ad689['id'] || 'audio-voice-history-' + _0xf7d39e + '-' + Math['round'](Math['random']() * 0x3e8),
    createdAt: _0xf7d39e,
    modelId: _0x1ad689['modelId'],
    modelLabel: _0x1ad689['modelLabel'],
    localPath: _0x5a50e1['localPath'],
    audioUrl: firstNonEmptyString(_0x5a50e1['audioUrl'], _0x5a50e1['src']),
    audioDuration: _0x5a50e1['audioDuration'],
  });
}
export function prependAudioVoiceHistory(_0x20f48d = [], _0x54bf8a = null) {
  return prependAudioVoiceHistoryEntries(_0x20f48d, _0x54bf8a);
}
export function prependAudioVoiceHistoryEntries(_0x428f74 = [], _0xab4c15 = []) {
  const _0x21d5d0 = Array['isArray'](_0xab4c15) ? _0xab4c15 : [_0xab4c15];
  return normalizeAudioVoiceHistory(
    [..._0x21d5d0, ...(Array['isArray'](_0x428f74) ? _0x428f74 : [])]['filter'](Boolean),
  );
}
export function createAudioVoicePayloadError(_0x5c93b2) {
  const _0x26dbca = new Error(_0x5c93b2);
  return ((_0x26dbca['code'] = _0x5c93b2), _0x26dbca);
}
export function getVisibleAudioVoiceSegments(_0x209b6f = []) {
  return _0x209b6f['filter']((_0x2db0c6) => _0x2db0c6['status'] !== 'removed');
}
function normalizeAudioVoiceModelSelectionMode(_0xa4cc9c) {
  const _0x5133c5 = String(_0xa4cc9c || '')
    ['trim']()
    ['toLowerCase']();
  return _0x5133c5 === 'segment' || _0x5133c5 === 'global' ? _0x5133c5 : '';
}
function hasAudioVoiceGenerationRecord(_0x36a4c6 = {}, _0x2a4b51 = '') {
  const _0x3192c = String(_0x2a4b51 || '')['trim']();
  return (
    _0x36a4c6['isGenerating'] === !![] ||
    String(_0x36a4c6['status'] || '')
      ['trim']()
      ['toLowerCase']() === 'generating' ||
    Number(_0x36a4c6['generationStartTime'] || _0x36a4c6['rhTaskStartedAt'] || 0x0) > 0x0 ||
    !!String(_0x36a4c6['rhTaskId'] || '')['trim']() ||
    (Array['isArray'](_0x36a4c6['convertedAudioHistory']) &&
      _0x36a4c6['convertedAudioHistory']['some'](
        (_0x5bdddc) => String(_0x5bdddc?.['modelId'] || '')['trim']() === _0x3192c,
      ))
  );
}
export function normalizeAudioVoiceSegmentModelSelection(_0x2d2f0a = {}, _0x58e1d1 = '') {
  const _0x1cf8c8 = String(_0x2d2f0a['voiceModelId'] || '')['trim'](),
    _0x2f0a74 = String(_0x2d2f0a['taskModelId'] || '')['trim'](),
    _0x10455f = normalizeAudioVoiceModelSelectionMode(_0x2d2f0a['voiceModelSelectionMode']);
  if (_0x10455f)
    return {
      ..._0x2d2f0a,
      voiceModelId: _0x10455f === 'segment' ? _0x1cf8c8 : '',
      voiceModelSelectionMode: _0x10455f,
      taskModelId: _0x2f0a74,
    };
  const _0x36fb53 = String(_0x58e1d1 || '')['trim'](),
    _0x2b5d12 =
      !!_0x1cf8c8 &&
      _0x1cf8c8 === _0x36fb53 &&
      (!_0x2f0a74 || _0x2f0a74 === _0x1cf8c8) &&
      hasAudioVoiceGenerationRecord(_0x2d2f0a, _0x1cf8c8);
  if (_0x2b5d12)
    return {
      ..._0x2d2f0a,
      voiceModelId: '',
      voiceModelSelectionMode: 'global',
      taskModelId: _0x2f0a74 || _0x1cf8c8,
    };
  return {
    ..._0x2d2f0a,
    voiceModelId: _0x1cf8c8,
    voiceModelSelectionMode: _0x1cf8c8 ? 'segment' : 'global',
    taskModelId: _0x2f0a74,
  };
}
export function cloneAudioVoiceSegment(_0x4a092b = {}) {
  const _0x583fa6 = String(_0x4a092b['voiceModelId'] || '')['trim'](),
    _0x189271 =
      normalizeAudioVoiceModelSelectionMode(_0x4a092b['voiceModelSelectionMode']) ||
      (_0x583fa6 ? '' : 'global');
  return {
    id: String(_0x4a092b['id'] || 'segment-' + Date['now']()),
    startMs: Number(_0x4a092b['startMs'] || 0x0),
    endMs: Number(_0x4a092b['endMs'] || 0x0),
    sourceText: String(_0x4a092b['sourceText'] || ''),
    targetText: String(_0x4a092b['targetText'] || ''),
    ...(String(_0x4a092b['speakerId'] || '')['trim']()
      ? { speakerId: String(_0x4a092b['speakerId'])['trim']() }
      : {}),
    ...(String(_0x4a092b['speaker'] || '')['trim']()
      ? { speaker: String(_0x4a092b['speaker'])['trim']() }
      : {}),
    sourceAudioLocalPath: normalizeLocalPath(_0x4a092b['sourceAudioLocalPath'] || ''),
    sourceAudioUrl: resolveSegmentLocalAudioUrl(
      _0x4a092b['sourceAudioUrl'],
      _0x4a092b['sourceAudioLocalPath'],
    ),
    sourceClipBaseAudioLocalPath: normalizeLocalPath(_0x4a092b['sourceClipBaseAudioLocalPath'] || ''),
    sourceClipBaseAudioUrl: resolveSegmentLocalAudioUrl(
      _0x4a092b['sourceClipBaseAudioUrl'],
      _0x4a092b['sourceClipBaseAudioLocalPath'],
    ),
    sourceClipBaseStartMs: Math['max'](0x0, Math['round'](Number(_0x4a092b['sourceClipBaseStartMs']) || 0x0)),
    sourceClipBaseEndMs: Math['max'](0x0, Math['round'](Number(_0x4a092b['sourceClipBaseEndMs']) || 0x0)),
    convertedAudioLocalPath: normalizeLocalPath(_0x4a092b['convertedAudioLocalPath'] || ''),
    convertedAudioUrl: resolveSegmentLocalAudioUrl(
      _0x4a092b['convertedAudioUrl'],
      _0x4a092b['convertedAudioLocalPath'],
    ),
    convertedAudioDuration: pickAudioDurationSec(
      _0x4a092b['convertedAudioDuration'],
      _0x4a092b['audioDuration'],
    ),
    voiceRefNodeId: String(_0x4a092b['voiceRefNodeId'] || ''),
    voiceRefAudioLocalPath: normalizeLocalPath(_0x4a092b['voiceRefAudioLocalPath'] || ''),
    voiceRefAudioUrl: resolveSegmentLocalAudioUrl(
      _0x4a092b['voiceRefAudioUrl'],
      _0x4a092b['voiceRefAudioLocalPath'],
    ),
    voiceRefName: String(_0x4a092b['voiceRefName'] || ''),
    voiceRefImageUrl: String(_0x4a092b['voiceRefImageUrl'] || ''),
    voiceModelId: _0x189271 === 'global' ? '' : _0x583fa6,
    voiceModelSelectionMode: _0x189271,
    taskModelId: String(_0x4a092b['taskModelId'] || '')['trim'](),
    imitateToneEnabled: _0x4a092b['imitateToneEnabled'] === !![],
    sourceAudioReady:
      _0x4a092b['sourceAudioReady'] === !![] ||
      !!resolveSegmentLocalAudioUrl(_0x4a092b['sourceAudioUrl'], _0x4a092b['sourceAudioLocalPath']),
    convertedAudioReady: _0x4a092b['convertedAudioReady'] === !![],
    activeAudio: _0x4a092b['activeAudio'] === 'converted' ? 'converted' : 'source',
    status: String(_0x4a092b['status'] || 'detected'),
    needsSourceAudioRecut: _0x4a092b['needsSourceAudioRecut'] === !![],
    error: String(_0x4a092b['error'] || ''),
    rhTaskId: String(_0x4a092b['rhTaskId'] || ''),
    rhTaskStatus: String(_0x4a092b['rhTaskStatus'] || ''),
    rhStatusMessage: String(_0x4a092b['rhStatusMessage'] || ''),
    rhTaskStartedAt: Number(_0x4a092b['rhTaskStartedAt'] || 0x0) || 0x0,
    rhTaskUseOpenapiQuery: _0x4a092b['rhTaskUseOpenapiQuery'] === !![],
    isGenerating: _0x4a092b['isGenerating'] === !![],
    jobStatus: String(_0x4a092b['jobStatus'] || ''),
    jobError: _0x4a092b['jobError'] == null ? null : String(_0x4a092b['jobError'] || ''),
    generationStartTime: Number(_0x4a092b['generationStartTime'] || 0x0) || 0x0,
    generationDuration:
      _0x4a092b['generationDuration'] === null || _0x4a092b['generationDuration'] === undefined
        ? null
        : Math['max'](0x0, Number(_0x4a092b['generationDuration'] || 0x0) || 0x0),
    convertedAudioHistory: normalizeAudioVoiceHistory(_0x4a092b['convertedAudioHistory']),
  };
}
export function createAudioVoiceSegmentAfter(_0x4d72b4 = {}, _0x490fc8 = null) {
  const _0x4b0556 = Number(_0x4d72b4['endMs'] || 0x0),
    _0x540a1a = _0x490fc8
      ? Math['max'](
          _0x4b0556 + 0xc8,
          Math['round']((_0x4b0556 + Number(_0x490fc8['startMs'] || _0x4b0556)) / 0x2),
        )
      : _0x4b0556 + 0x5dc;
  return {
    id: 'mock-insert-' + Date['now']() + '-' + Math['round'](Math['random']() * 0x3e8),
    startMs: _0x4b0556,
    endMs: _0x540a1a,
    sourceText: '',
    targetText: '',
    sourceAudioLocalPath: '',
    sourceAudioUrl: '',
    convertedAudioLocalPath: '',
    convertedAudioUrl: '',
    convertedAudioDuration: 0x0,
    voiceRefNodeId: '',
    voiceRefAudioLocalPath: '',
    voiceRefAudioUrl: '',
    voiceModelId: '',
    voiceModelSelectionMode: 'global',
    taskModelId: '',
    imitateToneEnabled: ![],
    sourceAudioReady: ![],
    convertedAudioReady: ![],
    activeAudio: 'source',
    status: 'edited',
  };
}
