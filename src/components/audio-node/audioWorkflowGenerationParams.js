function getPlainParams(args) {
  return args && typeof args === 'object' && !Array.isArray(args) ? { ...args } : {};
}
function hasOwnParam(value, item) {
  return Object.prototype.hasOwnProperty.call(value, item);
}
function resolvePersistedVoiceParams(key, index) {
  const hasOwnParam2 = hasOwnParam(index, 'speakerId') || hasOwnParam(index, 'voiceMode'),
    result = String(key.speakerId ?? '').trim(),
    speakerId = hasOwnParam2 ? String(index.speakerId ?? '').trim() : result,
    voiceMode = hasOwnParam2
      ? String(index.voiceMode ?? (speakerId ? 'custom' : 'default')).trim()
      : String(key.voiceMode ?? (speakerId ? 'custom' : 'default')).trim();
  return { speakerId: speakerId, voiceMode: voiceMode };
}
export function buildAudioWorkflowGenerationParams({
  schemaDefaults: schemaDefaults = {},
  savedParams: savedParams = {},
  currentParams: currentParams = {},
  extraParams: extraParams = {},
  targetHasSpeakerId: targetHasSpeakerId = false,
} = {}) {
  const args2 = getPlainParams(savedParams),
    plainParams = getPlainParams(currentParams),
    persistedVoiceParams = resolvePersistedVoiceParams(args2, plainParams);
  (delete args2.speakerId, delete args2.voiceMode);
  const data = { ...getPlainParams(schemaDefaults), ...args2, ...getPlainParams(extraParams) };
  return (
    targetHasSpeakerId &&
      ((data.speakerId = persistedVoiceParams.speakerId),
      (data.voiceMode = persistedVoiceParams.voiceMode)),
    data
  );
}
