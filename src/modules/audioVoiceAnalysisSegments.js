function firstNonEmptySpeakerValue(...args) {
  for (const value of args) {
    if (value === null || value === undefined) continue;
    const item = String(value).trim();
    if (item) return item;
  }
  return '';
}
function normalizeSharedAnalyzeSegment(args2 = {}) {
  return {
    ...args2,
    id: String(args2.id || ''),
    startMs: Number(args2.startMs || 0),
    endMs: Number(args2.endMs || 0),
    sourceText: String(args2.sourceText || ''),
    targetText: '',
    speakerId: String(args2.speakerId || ''),
    speaker: String(args2.speaker || ''),
    sourceAudioLocalPath: String(args2.sourceAudioLocalPath || ''),
    sourceAudioUrl: String(args2.sourceAudioUrl || ''),
  };
}
export function normalizeAudioVoiceAnalyzeSegments(options = {}, key = {}) {
  const list = Array.isArray(options?.segments) ? options.segments : [],
    handler =
      typeof key?.normalizeSegment === 'function'
        ? key.normalizeSegment
        : normalizeSharedAnalyzeSegment;
  return list.map((id, index) => {
    const speakerId = firstNonEmptySpeakerValue(
        id?.speakerId,
        id?.speaker,
        id?.speaker_id,
        id?.spk,
        id?.speakerInfo?.speakerId,
        id?.speakerInfo?.speaker_id,
        id?.speaker_info?.speakerId,
        id?.speaker_info?.speaker_id,
        id?.label,
      ),
      speaker = firstNonEmptySpeakerValue(
        id?.speaker,
        id?.spk,
        id?.speakerLabel,
        id?.speaker_label,
        id?.label,
        speakerId,
      );
    return handler({
      id: id?.id || 'audio-voice-segment-' + (index + 1),
      startMs: id?.startMs,
      endMs: id?.endMs,
      sourceText: id?.sourceText || '',
      targetText: '',
      speakerId: speakerId,
      speaker: speaker,
      sourceAudioLocalPath: id?.sourceAudioLocalPath,
      sourceAudioUrl: id?.sourceAudioUrl,
      sourceAudioReady: true,
      convertedAudioReady: false,
      activeAudio: 'source',
      status: 'detected',
    });
  });
}
