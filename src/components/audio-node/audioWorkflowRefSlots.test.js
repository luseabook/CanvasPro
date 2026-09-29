import test from 'node:test';
import assert from 'node:assert/strict';

import {
  doesAudioWorkflowSupportMultipleAudioInputs,
  getAudioWorkflowInputLimit,
  getAudioWorkflowSlots,
  normalizeAudioWorkflowRefSlots,
} from './audioWorkflowRefSlots.js';

test('audioWorkflowRefSlots: reads fixed audio slots from the model manifest', () => {
  assert.deepEqual(getAudioWorkflowSlots('indextts2_clone'), [
    { slot: 'audioRef', kind: 'audio', label: '克隆声音', required: true },
    { slot: 'audio2', kind: 'audio', label: '音频2', required: false },
  ]);
  assert.equal(getAudioWorkflowInputLimit('indextts2_clone'), 2);
  assert.equal(doesAudioWorkflowSupportMultipleAudioInputs('indextts2_clone'), true);
});

test('audioWorkflowRefSlots: falls back to one required audio reference for unknown models', () => {
  assert.deepEqual(getAudioWorkflowSlots('missing/model'), [
    { slot: 'audioRef', kind: 'audio', label: '音频参考', required: true },
  ]);
  assert.equal(getAudioWorkflowInputLimit('missing/model'), 1);
  assert.equal(doesAudioWorkflowSupportMultipleAudioInputs('missing/model'), false);
});

test('audioWorkflowRefSlots: repairs invalid and duplicate ref slots while preserving input data', () => {
  const inputs = [
    { id: 'one', refSlot: 'missing' },
    { id: 'two', refSlot: 'audioTarget', label: 'Target' },
  ];
  assert.deepEqual(normalizeAudioWorkflowRefSlots(inputs, 'voice_convert'), [
    { id: 'one', refSlot: 'audioRef' },
    { id: 'two', refSlot: 'audioTarget', label: 'Target' },
  ]);
  assert.deepEqual(normalizeAudioWorkflowRefSlots([{ id: 'audio' }], 'missing/model'), [
    { id: 'audio', refSlot: 'audioRef' },
  ]);
});
