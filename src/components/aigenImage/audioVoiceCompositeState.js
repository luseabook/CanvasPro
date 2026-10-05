function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function resolveAudioVoiceCompositeState({
  voiceTypeValue: voiceTypeValue = '',
  voiceTypeLabel: voiceTypeLabel = '',
  speakerIdValue: speakerIdValue = '',
  voiceModeValue: voiceModeValue = '',
  defaultModeValue: defaultModeValue = 'default',
  customModeValue: customModeValue = 'custom',
} = {}) {
  const speakerIdValue2 = normalizeText(speakerIdValue),
    voiceModeValue2 = normalizeText(voiceModeValue),
    defaultModeValue2 = normalizeText(defaultModeValue) || 'default',
    customModeValue2 = normalizeText(customModeValue) || 'custom',
    voiceTypeLabel2 = String(voiceTypeLabel ?? voiceTypeValue ?? '')['trim'](),
    isCustomMode = voiceModeValue2 ? voiceModeValue2 === customModeValue2 : speakerIdValue2['length'] > 0;
  return {
    voiceTypeValue: voiceTypeValue,
    voiceTypeLabel: voiceTypeLabel2,
    speakerIdValue: speakerIdValue2,
    voiceModeValue: voiceModeValue2,
    defaultModeValue: defaultModeValue2,
    customModeValue: customModeValue2,
    isCustomMode: isCustomMode,
    customAreaDisabled: !isCustomMode,
    defaultAreaDisabled: isCustomMode,
    customAreaClassName: isCustomMode ? '' : ' is-disabled',
    defaultAreaClassName: isCustomMode ? ' is-disabled' : '',
    triggerLabel: isCustomMode ? '自定义音色' : '音色："' + voiceTypeLabel2 + '"',
  };
}
