import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveAudioVoiceCompositeState } from './audioVoiceCompositeState.js';

test('resolveAudioVoiceCompositeState: explicit custom mode enables the custom area', () => {
  assert.deepEqual(
    resolveAudioVoiceCompositeState({
      voiceTypeValue: 'voice-1',
      voiceTypeLabel: '  女声  ',
      speakerIdValue: ' speaker-1 ',
      voiceModeValue: 'custom',
    }),
    {
      voiceTypeValue: 'voice-1',
      voiceTypeLabel: '女声',
      speakerIdValue: 'speaker-1',
      voiceModeValue: 'custom',
      defaultModeValue: 'default',
      customModeValue: 'custom',
      isCustomMode: true,
      customAreaDisabled: false,
      defaultAreaDisabled: true,
      customAreaClassName: '',
      defaultAreaClassName: ' is-disabled',
      triggerLabel: '自定义音色',
    },
  );
});

test('resolveAudioVoiceCompositeState: a speaker selects custom mode when no mode is explicit', () => {
  const result = resolveAudioVoiceCompositeState({
    voiceTypeValue: 'voice-fallback',
    voiceTypeLabel: '',
    speakerIdValue: 'speaker-1',
  });

  assert.equal(result.isCustomMode, true);
  assert.equal(result.voiceTypeLabel, '');
});

test('resolveAudioVoiceCompositeState: explicit default mode overrides speaker evidence', () => {
  const result = resolveAudioVoiceCompositeState({
    voiceTypeLabel: '标准音色',
    speakerIdValue: 'speaker-1',
    voiceModeValue: 'default',
  });

  assert.equal(result.isCustomMode, false);
  assert.equal(result.customAreaDisabled, true);
  assert.equal(result.defaultAreaDisabled, false);
  assert.equal(result.customAreaClassName, ' is-disabled');
  assert.equal(result.defaultAreaClassName, '');
  assert.equal(result.triggerLabel, '音色："标准音色"');
});
