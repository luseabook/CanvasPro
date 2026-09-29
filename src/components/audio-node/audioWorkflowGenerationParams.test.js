import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAudioWorkflowGenerationParams } from './audioWorkflowGenerationParams.js';

test('audioWorkflowGenerationParams: merges defaults, saved params, and extras', () => {
  assert.deepEqual(
    buildAudioWorkflowGenerationParams({
      schemaDefaults: { speakerId: 'schema-speaker', voiceMode: 'default', steps: 8, locale: 'zh' },
      savedParams: { speakerId: ' saved-speaker ', voiceMode: ' custom ', temperature: 0.7 },
      currentParams: {},
      extraParams: { steps: 12 },
      targetHasSpeakerId: true,
    }),
    {
      steps: 12,
      locale: 'zh',
      temperature: 0.7,
      speakerId: 'saved-speaker',
      voiceMode: 'custom',
    },
  );
});

test('audioWorkflowGenerationParams: current speaker fields override persisted values', () => {
  assert.deepEqual(
    buildAudioWorkflowGenerationParams({
      savedParams: { speakerId: 'saved-speaker' },
      currentParams: { voiceMode: 'default' },
      targetHasSpeakerId: true,
    }),
    { speakerId: '', voiceMode: 'default' },
  );
});

test('audioWorkflowGenerationParams: removes voice fields for targets without speaker support', () => {
  assert.deepEqual(
    buildAudioWorkflowGenerationParams({
      savedParams: { speakerId: 'saved-speaker', voiceMode: 'custom', temperature: 1 },
      targetHasSpeakerId: false,
    }),
    { temperature: 1 },
  );
});
