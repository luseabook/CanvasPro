import test from 'node:test';
import assert from 'node:assert/strict';

import {
  VOLCENGINE_DOUBAO_AUDIO_GENERATION_EXECUTION_ID,
  VOLCENGINE_DOUBAO_AUDIO_GENERATION_MODEL_ID,
  VOLCENGINE_TTS_EXECUTION_ID,
  VOLCENGINE_TTS_MODEL_ID,
  volcengineAudioModelApiExecutionManifests,
  volcengineAudioModelApiModelManifests,
  volcengineDoubaoAudioGenerationExecutionManifest,
  volcengineDoubaoAudioGenerationModelManifest,
  volcengineSpeechTtsExecutionManifest,
  volcengineSpeechTtsModelManifest,
} from './volcengineAudioModelApiManifests.js';

test('volcengineAudioModelApiManifests: exports linked TTS model and execution manifests', () => {
  assert.equal(volcengineSpeechTtsModelManifest.modelId, VOLCENGINE_TTS_MODEL_ID);
  assert.equal(volcengineSpeechTtsModelManifest.executionId, VOLCENGINE_TTS_EXECUTION_ID);
  assert.deepEqual(volcengineSpeechTtsModelManifest.aliases, [
    'volcengine-speech/doubao-seed-tts-2-0',
    'doubao-seed-tts-2-0',
    'seed-tts-2.0',
  ]);
  assert.deepEqual(volcengineSpeechTtsModelManifest.inputSlots.allowedKinds, ['text']);
  assert.deepEqual(volcengineSpeechTtsModelManifest.inputSlots.maxByKind, {
    image: 0,
    video: 0,
    audio: 0,
  });
  assert.equal(volcengineSpeechTtsModelManifest.inputSlots.minByKind.text, 1);
  assert.deepEqual(
    volcengineSpeechTtsModelManifest.uiSchema.fields.map((field) => field.id),
    ['voiceType', 'speakerId', 'speechRate', 'loudnessRate', 'pitch', 'format', 'sampleRate'],
  );
  assert.equal(volcengineSpeechTtsModelManifest.extensions.audioMenu.order, 10);
  assert.equal(
    volcengineSpeechTtsModelManifest.extensions.credentialAuthorization.capability,
    'tts',
  );
  assert.equal(volcengineSpeechTtsExecutionManifest.id, VOLCENGINE_TTS_EXECUTION_ID);
  assert.equal(volcengineSpeechTtsExecutionManifest.model, 'seed-tts-2.0');
  assert.equal(volcengineSpeechTtsExecutionManifest.extensions.resourceId, 'seed-tts-2.0');
});

test('volcengineAudioModelApiManifests: exports Doubao audio input slots and response mapping', () => {
  assert.equal(
    volcengineDoubaoAudioGenerationModelManifest.modelId,
    VOLCENGINE_DOUBAO_AUDIO_GENERATION_MODEL_ID,
  );
  assert.equal(
    volcengineDoubaoAudioGenerationModelManifest.executionId,
    VOLCENGINE_DOUBAO_AUDIO_GENERATION_EXECUTION_ID,
  );
  assert.equal(volcengineDoubaoAudioGenerationModelManifest.prompt.maxLength, 3000);
  assert.deepEqual(
    volcengineDoubaoAudioGenerationModelManifest.inputSlots.fixedSlots.map((slot) => slot.id),
    ['audio1', 'audio2', 'audio3'],
  );
  assert.equal(volcengineDoubaoAudioGenerationModelManifest.inputSlots.maxByKind.audio, 3);
  assert.deepEqual(
    volcengineDoubaoAudioGenerationModelManifest.uiSchema.fields.map((field) => field.id),
    ['pitch', 'speechRate', 'loudnessRate', 'format'],
  );
  assert.equal(volcengineDoubaoAudioGenerationModelManifest.extensions.audioMenu.order, 20);
  assert.equal(
    volcengineDoubaoAudioGenerationExecutionManifest.responseMapping.base64AudioField,
    'audio',
  );
  assert.deepEqual(
    volcengineDoubaoAudioGenerationExecutionManifest.responseMapping.resultPaths,
    ['url', 'data.url', 'audio_url'],
  );
  assert.equal(
    volcengineDoubaoAudioGenerationExecutionManifest.extensions.bodyResolver,
    'volcengineDoubaoAudioGeneration',
  );

  assert.equal(Object.isFrozen(volcengineAudioModelApiModelManifests), true);
  assert.equal(Object.isFrozen(volcengineAudioModelApiExecutionManifests), true);
  assert.deepEqual(
    volcengineAudioModelApiModelManifests.map((manifest) => manifest.modelId),
    [VOLCENGINE_TTS_MODEL_ID, VOLCENGINE_DOUBAO_AUDIO_GENERATION_MODEL_ID],
  );
  assert.deepEqual(
    volcengineAudioModelApiExecutionManifests.map((manifest) => manifest.id),
    [VOLCENGINE_TTS_EXECUTION_ID, VOLCENGINE_DOUBAO_AUDIO_GENERATION_EXECUTION_ID],
  );
});
