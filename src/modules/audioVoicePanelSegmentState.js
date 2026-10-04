import { pickAudioDurationSec } from '../services/audioMetadataService.js';
import { localPathToUrl, normalizeLocalPath } from '../utils/localMediaPath.js';
const AUDIO_VOICE_HISTORY_LIMIT = 0x5;
export function firstNonEmptyString(...args) {
  for (const value of args) {
    const item = String(value || '')['trim']();
    if (item) return item;
  }
  return '';
}
export function resolveSegmentLocalAudioUrl(key, index) {
  return firstNonEmptyString(key, localPathToUrl(index));
}
function normalizeAudioVoiceHistoryEntry(options = {}) {
  const localPath = normalizeLocalPath(options['localPath'] || options['convertedAudioLocalPath'] || ''),
    audioUrl = resolveSegmentLocalAudioUrl(
      firstNonEmptyString(options['audioUrl'], options['src'], options['convertedAudioUrl']),
      localPath,
    );
  if (!audioUrl && !localPath) return null;
  const createdAt = Number(options['createdAt'] || 0x0) || Date['now']();
  return {
    id: String(options['id'] || 'audio-voice-history-' + createdAt)['trim'](),
    createdAt: createdAt,
    modelId: String(options['modelId'] || '')['trim'](),
    modelLabel: String(options['modelLabel'] || '')['trim'](),
    localPath: localPath,
    audioUrl: audioUrl,
    audioDuration: pickAudioDurationSec(options['audioDuration'], options['duration']),
  };
}
export function normalizeAudioVoiceHistory(list = []) {
  const list2 = [],
    map = new Set();
  for (const result of Array['isArray'](list) ? list : []) {
    const audioVoiceHistoryEntry = normalizeAudioVoiceHistoryEntry(result);
    if (!audioVoiceHistoryEntry) continue;
    const data = audioVoiceHistoryEntry['localPath'] + '::' + audioVoiceHistoryEntry['audioUrl'];
    if (map['has'](data)) continue;
    (map['add'](data), list2['push'](audioVoiceHistoryEntry));
  }
  return list2['sort'](
    (target, source) => Number(source['createdAt'] || 0x0) - Number(target['createdAt'] || 0x0),
  )['slice'](0x0, AUDIO_VOICE_HISTORY_LIMIT);
}
export function buildAudioVoiceHistoryEntry(localPath2 = {}, id = {}) {
  const createdAt2 = Number(id['createdAt'] || 0x0) || Date['now']();
  return normalizeAudioVoiceHistoryEntry({
    id: id['id'] || 'audio-voice-history-' + createdAt2 + '-' + Math['round'](Math['random']() * 0x3e8),
    createdAt: createdAt2,
    modelId: id['modelId'],
    modelLabel: id['modelLabel'],
    localPath: localPath2['localPath'],
    audioUrl: firstNonEmptyString(localPath2['audioUrl'], localPath2['src']),
    audioDuration: localPath2['audioDuration'],
  });
}
export function prependAudioVoiceHistory(list3 = [], next = null) {
  return prependAudioVoiceHistoryEntries(list3, next);
}
export function prependAudioVoiceHistoryEntries(list4 = [], current = []) {
  const args2 = Array['isArray'](current) ? current : [current];
  return normalizeAudioVoiceHistory([...args2, ...(Array['isArray'](list4) ? list4 : [])]['filter'](Boolean));
}
export function createAudioVoicePayloadError(entry) {
  const error = new Error(entry);
  return ((error['code'] = entry), error);
}
export function getVisibleAudioVoiceSegments(list5 = []) {
  return list5['filter']((response) => response['status'] !== 'removed');
}
function normalizeAudioVoiceModelSelectionMode(record) {
  const payload = String(record || '')
    ['trim']()
    ['toLowerCase']();
  return payload === 'segment' || payload === 'global' ? payload : '';
}
function hasAudioVoiceGenerationRecord(response2 = {}, handle = '') {
  const state = String(handle || '')['trim']();
  return (
    response2['isGenerating'] === !![] ||
    String(response2['status'] || '')
      ['trim']()
      ['toLowerCase']() === 'generating' ||
    Number(response2['generationStartTime'] || response2['rhTaskStartedAt'] || 0x0) > 0x0 ||
    !!String(response2['rhTaskId'] || '')['trim']() ||
    (Array['isArray'](response2['convertedAudioHistory']) &&
      response2['convertedAudioHistory']['some'](
        (config) => String(config?.['modelId'] || '')['trim']() === state,
      ))
  );
}
export function normalizeAudioVoiceSegmentModelSelection(args3 = {}, scope = '') {
  const voiceModelId = String(args3['voiceModelId'] || '')['trim'](),
    taskModelId = String(args3['taskModelId'] || '')['trim'](),
    voiceModelId2 = normalizeAudioVoiceModelSelectionMode(args3['voiceModelSelectionMode']);
  if (voiceModelId2)
    return {
      ...args3,
      voiceModelId: voiceModelId2 === 'segment' ? voiceModelId : '',
      voiceModelSelectionMode: voiceModelId2,
      taskModelId: taskModelId,
    };
  const input = String(scope || '')['trim'](),
    output =
      !!voiceModelId &&
      voiceModelId === input &&
      (!taskModelId || taskModelId === voiceModelId) &&
      hasAudioVoiceGenerationRecord(args3, voiceModelId);
  if (output)
    return {
      ...args3,
      voiceModelId: '',
      voiceModelSelectionMode: 'global',
      taskModelId: taskModelId || voiceModelId,
    };
  return {
    ...args3,
    voiceModelId: voiceModelId,
    voiceModelSelectionMode: voiceModelId ? 'segment' : 'global',
    taskModelId: taskModelId,
  };
}
export function cloneAudioVoiceSegment(imitateToneEnabled = {}) {
  const value2 = String(imitateToneEnabled['voiceModelId'] || '')['trim'](),
    voiceModelId3 =
      normalizeAudioVoiceModelSelectionMode(imitateToneEnabled['voiceModelSelectionMode']) ||
      (value2 ? '' : 'global');
  return {
    id: String(imitateToneEnabled['id'] || 'segment-' + Date['now']()),
    startMs: Number(imitateToneEnabled['startMs'] || 0x0),
    endMs: Number(imitateToneEnabled['endMs'] || 0x0),
    sourceText: String(imitateToneEnabled['sourceText'] || ''),
    targetText: String(imitateToneEnabled['targetText'] || ''),
    ...(String(imitateToneEnabled['speakerId'] || '')['trim']()
      ? { speakerId: String(imitateToneEnabled['speakerId'])['trim']() }
      : {}),
    ...(String(imitateToneEnabled['speaker'] || '')['trim']()
      ? { speaker: String(imitateToneEnabled['speaker'])['trim']() }
      : {}),
    sourceAudioLocalPath: normalizeLocalPath(imitateToneEnabled['sourceAudioLocalPath'] || ''),
    sourceAudioUrl: resolveSegmentLocalAudioUrl(
      imitateToneEnabled['sourceAudioUrl'],
      imitateToneEnabled['sourceAudioLocalPath'],
    ),
    sourceClipBaseAudioLocalPath: normalizeLocalPath(
      imitateToneEnabled['sourceClipBaseAudioLocalPath'] || '',
    ),
    sourceClipBaseAudioUrl: resolveSegmentLocalAudioUrl(
      imitateToneEnabled['sourceClipBaseAudioUrl'],
      imitateToneEnabled['sourceClipBaseAudioLocalPath'],
    ),
    sourceClipBaseStartMs: Math['max'](
      0x0,
      Math['round'](Number(imitateToneEnabled['sourceClipBaseStartMs']) || 0x0),
    ),
    sourceClipBaseEndMs: Math['max'](
      0x0,
      Math['round'](Number(imitateToneEnabled['sourceClipBaseEndMs']) || 0x0),
    ),
    convertedAudioLocalPath: normalizeLocalPath(imitateToneEnabled['convertedAudioLocalPath'] || ''),
    convertedAudioUrl: resolveSegmentLocalAudioUrl(
      imitateToneEnabled['convertedAudioUrl'],
      imitateToneEnabled['convertedAudioLocalPath'],
    ),
    convertedAudioDuration: pickAudioDurationSec(
      imitateToneEnabled['convertedAudioDuration'],
      imitateToneEnabled['audioDuration'],
    ),
    voiceRefNodeId: String(imitateToneEnabled['voiceRefNodeId'] || ''),
    voiceRefAudioLocalPath: normalizeLocalPath(imitateToneEnabled['voiceRefAudioLocalPath'] || ''),
    voiceRefAudioUrl: resolveSegmentLocalAudioUrl(
      imitateToneEnabled['voiceRefAudioUrl'],
      imitateToneEnabled['voiceRefAudioLocalPath'],
    ),
    voiceRefName: String(imitateToneEnabled['voiceRefName'] || ''),
    voiceRefImageUrl: String(imitateToneEnabled['voiceRefImageUrl'] || ''),
    voiceModelId: voiceModelId3 === 'global' ? '' : value2,
    voiceModelSelectionMode: voiceModelId3,
    taskModelId: String(imitateToneEnabled['taskModelId'] || '')['trim'](),
    imitateToneEnabled: imitateToneEnabled['imitateToneEnabled'] === !![],
    sourceAudioReady:
      imitateToneEnabled['sourceAudioReady'] === !![] ||
      !!resolveSegmentLocalAudioUrl(
        imitateToneEnabled['sourceAudioUrl'],
        imitateToneEnabled['sourceAudioLocalPath'],
      ),
    convertedAudioReady: imitateToneEnabled['convertedAudioReady'] === !![],
    activeAudio: imitateToneEnabled['activeAudio'] === 'converted' ? 'converted' : 'source',
    status: String(imitateToneEnabled['status'] || 'detected'),
    needsSourceAudioRecut: imitateToneEnabled['needsSourceAudioRecut'] === !![],
    error: String(imitateToneEnabled['error'] || ''),
    rhTaskId: String(imitateToneEnabled['rhTaskId'] || ''),
    rhTaskStatus: String(imitateToneEnabled['rhTaskStatus'] || ''),
    rhStatusMessage: String(imitateToneEnabled['rhStatusMessage'] || ''),
    rhTaskStartedAt: Number(imitateToneEnabled['rhTaskStartedAt'] || 0x0) || 0x0,
    rhTaskUseOpenapiQuery: imitateToneEnabled['rhTaskUseOpenapiQuery'] === !![],
    isGenerating: imitateToneEnabled['isGenerating'] === !![],
    jobStatus: String(imitateToneEnabled['jobStatus'] || ''),
    jobError: imitateToneEnabled['jobError'] == null ? null : String(imitateToneEnabled['jobError'] || ''),
    generationStartTime: Number(imitateToneEnabled['generationStartTime'] || 0x0) || 0x0,
    generationDuration:
      imitateToneEnabled['generationDuration'] === null ||
      imitateToneEnabled['generationDuration'] === undefined
        ? null
        : Math['max'](0x0, Number(imitateToneEnabled['generationDuration'] || 0x0) || 0x0),
    convertedAudioHistory: normalizeAudioVoiceHistory(imitateToneEnabled['convertedAudioHistory']),
  };
}
export function createAudioVoiceSegmentAfter(options2 = {}, value3 = null) {
  const startMs = Number(options2['endMs'] || 0x0),
    endMs = value3
      ? Math['max'](startMs + 0xc8, Math['round']((startMs + Number(value3['startMs'] || startMs)) / 0x2))
      : startMs + 0x5dc;
  return {
    id: 'mock-insert-' + Date['now']() + '-' + Math['round'](Math['random']() * 0x3e8),
    startMs: startMs,
    endMs: endMs,
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
