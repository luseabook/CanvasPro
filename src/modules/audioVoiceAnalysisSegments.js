function firstNonEmptySpeakerValue(..._0x23989c) {
  for (const _0x38df4e of _0x23989c) {
    if (_0x38df4e === null || _0x38df4e === undefined) continue;
    const _0x4c042e = String(_0x38df4e)['trim']();
    if (_0x4c042e) return _0x4c042e;
  }
  return '';
}
function normalizeSharedAnalyzeSegment(_0x2bc44f = {}) {
  return {
    ..._0x2bc44f,
    id: String(_0x2bc44f['id'] || ''),
    startMs: Number(_0x2bc44f['startMs'] || 0x0),
    endMs: Number(_0x2bc44f['endMs'] || 0x0),
    sourceText: String(_0x2bc44f['sourceText'] || ''),
    targetText: '',
    speakerId: String(_0x2bc44f['speakerId'] || ''),
    speaker: String(_0x2bc44f['speaker'] || ''),
    sourceAudioLocalPath: String(_0x2bc44f['sourceAudioLocalPath'] || ''),
    sourceAudioUrl: String(_0x2bc44f['sourceAudioUrl'] || ''),
  };
}
export function normalizeAudioVoiceAnalyzeSegments(_0x555e9f = {}, _0xe02519 = {}) {
  const _0x2dbba2 = Array['isArray'](_0x555e9f?.['segments']) ? _0x555e9f['segments'] : [],
    _0x15b1d4 =
      typeof _0xe02519?.['normalizeSegment'] === 'function'
        ? _0xe02519['normalizeSegment']
        : normalizeSharedAnalyzeSegment;
  return _0x2dbba2['map']((_0x739c64, _0x327fe4) => {
    const _0x53fc9b = firstNonEmptySpeakerValue(
        _0x739c64?.['speakerId'],
        _0x739c64?.['speaker'],
        _0x739c64?.['speaker_id'],
        _0x739c64?.['spk'],
        _0x739c64?.['speakerInfo']?.['speakerId'],
        _0x739c64?.['speakerInfo']?.['speaker_id'],
        _0x739c64?.['speaker_info']?.['speakerId'],
        _0x739c64?.['speaker_info']?.['speaker_id'],
        _0x739c64?.['label'],
      ),
      _0x30c797 = firstNonEmptySpeakerValue(
        _0x739c64?.['speaker'],
        _0x739c64?.['spk'],
        _0x739c64?.['speakerLabel'],
        _0x739c64?.['speaker_label'],
        _0x739c64?.['label'],
        _0x53fc9b,
      );
    return _0x15b1d4({
      id: _0x739c64?.['id'] || 'audio-voice-segment-' + (_0x327fe4 + 0x1),
      startMs: _0x739c64?.['startMs'],
      endMs: _0x739c64?.['endMs'],
      sourceText: _0x739c64?.['sourceText'] || '',
      targetText: '',
      speakerId: _0x53fc9b,
      speaker: _0x30c797,
      sourceAudioLocalPath: _0x739c64?.['sourceAudioLocalPath'],
      sourceAudioUrl: _0x739c64?.['sourceAudioUrl'],
      sourceAudioReady: !![],
      convertedAudioReady: ![],
      activeAudio: 'source',
      status: 'detected',
    });
  });
}
