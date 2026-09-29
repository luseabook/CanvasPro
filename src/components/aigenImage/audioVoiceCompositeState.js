function normalizeText(_0x3840cf) {
  return String(_0x3840cf ?? '')['trim']();
}
export function resolveAudioVoiceCompositeState({
  voiceTypeValue: voiceTypeValue = '',
  voiceTypeLabel: voiceTypeLabel = '',
  speakerIdValue: speakerIdValue = '',
  voiceModeValue: voiceModeValue = '',
  defaultModeValue: defaultModeValue = 'default',
  customModeValue: customModeValue = 'custom',
} = {}) {
  const _0x553763 = normalizeText(speakerIdValue),
    _0x1ae3f7 = normalizeText(voiceModeValue),
    _0x5c94c1 = normalizeText(defaultModeValue) || 'default',
    _0x598a95 = normalizeText(customModeValue) || 'custom',
    _0x64fd96 = String(voiceTypeLabel ?? voiceTypeValue ?? '')['trim'](),
    _0x2df6a3 = _0x1ae3f7 ? _0x1ae3f7 === _0x598a95 : _0x553763['length'] > 0x0;
  return {
    voiceTypeValue: voiceTypeValue,
    voiceTypeLabel: _0x64fd96,
    speakerIdValue: _0x553763,
    voiceModeValue: _0x1ae3f7,
    defaultModeValue: _0x5c94c1,
    customModeValue: _0x598a95,
    isCustomMode: _0x2df6a3,
    customAreaDisabled: !_0x2df6a3,
    defaultAreaDisabled: _0x2df6a3,
    customAreaClassName: _0x2df6a3 ? '' : ' is-disabled',
    defaultAreaClassName: _0x2df6a3 ? '\x20is-disabled' : '',
    triggerLabel: _0x2df6a3 ? '自定义音色' : '音色："' + _0x64fd96 + '\x22',
  };
}
