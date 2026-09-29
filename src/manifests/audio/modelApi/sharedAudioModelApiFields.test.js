import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createAudioModelApiExecutionManifest,
  createAudioModelApiManifest,
  VOLCENGINE_FORMAT_FIELD,
  VOLCENGINE_SAMPLE_RATE_FIELD,
  VOLCENGINE_VOICE_TYPE_FIELD,
} from './sharedAudioModelApiFields.js';

test('sharedAudioModelApiFields: creates a frozen model manifest with defaults', () => {
  const manifest = createAudioModelApiManifest({
    modelId: 'vendor/tts',
    executionId: 'vendor.model-api.audio.tts.v1',
    provider: 'vendor',
    displayName: 'Vendor TTS',
    fields: [{ id: 'voice' }],
  });

  assert.equal(Object.isFrozen(manifest), true);
  assert.equal(manifest.kind, 'audio');
  assert.equal(manifest.adapterType, 'modelApi');
  assert.equal(manifest.icon, 'images/volcengine.svg');
  assert.deepEqual(manifest.inputSlots.allowedKinds, ['text']);
  assert.deepEqual(manifest.inputSlots.maxByKind, { image: 0, video: 0, audio: 0 });
  assert.deepEqual(manifest.capabilities, {
    inputKinds: ['text', 'audio'],
    outputType: 'audio',
    fixedAssetSlots: [],
  });
});

test('sharedAudioModelApiFields: preserves audio input slots and extensions', () => {
  const manifest = createAudioModelApiManifest({
    modelId: 'vendor/clone',
    executionId: 'vendor.model-api.audio.clone.v1',
    provider: 'vendor',
    displayName: 'Clone',
    modelType: 'voiceClone',
    extensions: { source: 'test' },
    inputSlots: {
      allowedKinds: ['text', 'audio'],
      minByKind: { audio: 1 },
      maxByKind: { audio: 1 },
      fixedSlots: [{ id: 'referenceAudio', kind: 'audio' }],
    },
  });

  assert.deepEqual(manifest.extensions, { source: 'test', modelType: 'voiceClone' });
  assert.deepEqual(manifest.capabilities.fixedAssetSlots, ['referenceAudio']);
  assert.deepEqual(manifest.inputSlots.allowedKinds, ['text', 'audio']);
  assert.equal(manifest.inputSlots.fixedSlots[0].id, 'referenceAudio');
});

test('sharedAudioModelApiFields: creates execution mappings and shared fields', () => {
  const execution = createAudioModelApiExecutionManifest({
    id: 'vendor.model-api.audio.tts.v1',
    provider: 'vendor',
    model: 'tts-1',
    endpoint: '/v1/audio',
    headers: { Authorization: 'Bearer token' },
    bodyMapping: [{ path: 'text', from: 'prompt' }],
  });

  assert.equal(Object.isFrozen(execution), true);
  assert.equal(execution.method, 'POST');
  assert.equal(execution.headers['Content-Type'], 'application/json');
  assert.equal(execution.headers.Authorization, 'Bearer token');
  assert.equal(execution.responseMapping.statusSuccessValue, 0);
  assert.deepEqual(execution.result.audioPaths, ['data']);
  assert.equal(VOLCENGINE_VOICE_TYPE_FIELD.defaultValue, 'zh_female_vv_uranus_bigtts');
  assert.equal(VOLCENGINE_FORMAT_FIELD.defaultValue, 'mp3');
  assert.equal(VOLCENGINE_SAMPLE_RATE_FIELD.defaultValue, 24000);
});
