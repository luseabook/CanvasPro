import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RH_AUDIO_HELPER_IDS,
  RH_AUDIO_RESPONSE_MAPPING,
  audioSelect,
  audioSlider,
  audioSlot,
  audioText,
  audioTextarea,
  audioToggle,
  constantMapping,
  createRunningHubAudioCatalogEntry,
  paramMapping,
  promptMapping,
  runningHubAudioHelperExecutionManifests,
  slotMapping,
} from './runningHubAudioCatalogShared.js';

test('runningHubAudioCatalogShared: field helpers expose stable UI contracts', () => {
  assert.deepEqual(audioText('text', 'Text', 'Help'), {
    id: 'text',
    label: 'Text',
    type: 'text',
    placement: 'advanced',
    defaultValue: '',
    allowEmpty: true,
    description: 'Help',
    showInfoTip: true,
  });
  assert.equal(audioTextarea('area', 'Area').type, 'textarea');
  assert.deepEqual(audioSelect('mode', 'Mode', ['a'], 'a').options, [
    { value: 'a', label: 'a', selectedLabel: 'a' },
  ]);
  assert.equal(audioSlider('level', 'Level', 0, 10, 5, 2).step, 2);
  assert.equal(audioToggle('toggle', 'Toggle').defaultValue, false);
  assert.equal(audioSlot('audio', 'Audio', true).required, true);
});

test('runningHubAudioCatalogShared: mapping helpers use prompt, param, constant, and slots', () => {
  assert.deepEqual(promptMapping('text'), { path: 'text', from: 'prompt' });
  assert.deepEqual(paramMapping('voice', 'voiceId'), {
    path: 'voice',
    from: 'param',
    field: 'generationParams.voiceId',
    omitWhenEmpty: true,
  });
  assert.deepEqual(constantMapping('kind', 'audio'), { path: 'kind', from: 'constant', value: 'audio' });
  assert.deepEqual(slotMapping('audios', 1), {
    path: 'audios',
    from: 'inputAudios',
    transform: { name: 'audioSlot', slot: 1 },
    omitWhenEmpty: true,
  });
});

test('runningHubAudioCatalogShared: catalog entries produce model and execution manifests', () => {
  const entry = createRunningHubAudioCatalogEntry({
    id: 'mureka/vocal-clone',
    name: 'Clone',
    endpoint: '/openapi/v2/mureka/vocal-clone',
    docId: 123,
    fields: [audioText('voice', 'Voice')],
    slots: [audioSlot('audio', 'Audio', true)],
    mapping: [paramMapping('voice', 'voice')],
  });
  assert.equal(entry.model.modelId, 'runninghub/mureka/vocal-clone');
  assert.equal(entry.execution.id, 'runninghub.model-api.audio.mureka.vocal-clone.v1');
  assert.deepEqual(entry.model.inputSlots.allowedKinds, ['text', 'audio']);
  assert.equal(entry.model.inputSlots.fixedSlots.length, 1);
  assert.deepEqual(entry.execution.bodyMapping, [
    { path: 'text', from: 'prompt' },
    { path: 'voice', from: 'param', field: 'generationParams.voice', omitWhenEmpty: true },
  ]);
  assert.equal(entry.execution.responseMapping.taskIdPath, RH_AUDIO_RESPONSE_MAPPING.taskIdPath);
  assert.deepEqual(entry.execution.responseMapping.resultPaths, RH_AUDIO_RESPONSE_MAPPING.resultPaths);
});

test('runningHubAudioCatalogShared: helper execution manifests are frozen and complete', () => {
  assert.equal(runningHubAudioHelperExecutionManifests.length, 3);
  assert.deepEqual(
    runningHubAudioHelperExecutionManifests.map((manifest) => manifest.id),
    [RH_AUDIO_HELPER_IDS.murekaUpload, RH_AUDIO_HELPER_IDS.murekaClone, RH_AUDIO_HELPER_IDS.coverPreprocess],
  );
  for (const manifest of runningHubAudioHelperExecutionManifests) {
    assert.equal(Object.isFrozen(manifest), true);
    assert.deepEqual(manifest.responseMapping.resultPaths, ['results[].text']);
    assert.equal(manifest.method, 'POST');
  }
});
