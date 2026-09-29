import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AUDIO_VOICE_PANEL_OPEN_EVENT } from './audioVoicePanelEvents.js';

test('AUDIO_VOICE_PANEL_OPEN_EVENT is the frozen panel-open event name', () => {
  assert.equal(typeof AUDIO_VOICE_PANEL_OPEN_EVENT, 'string');
  assert.equal(AUDIO_VOICE_PANEL_OPEN_EVENT, 'audioVoicePanel:open');
});

test('AUDIO_VOICE_PANEL_OPEN_EVENT keeps its colon namespace separator', () => {
  assert.equal(AUDIO_VOICE_PANEL_OPEN_EVENT.split(':').length, 2);
  assert.equal(AUDIO_VOICE_PANEL_OPEN_EVENT.split(':')[0], 'audioVoicePanel');
  assert.equal(AUDIO_VOICE_PANEL_OPEN_EVENT.split(':')[1], 'open');
});
