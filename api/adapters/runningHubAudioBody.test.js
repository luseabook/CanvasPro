import test from 'node:test';
import assert from 'node:assert/strict';

import { buildRunningHubAudioBody } from './runningHubAudioBody.js';

test('runningHubAudioBody: builds Suno single and custom request bodies', () => {
  assert.deepEqual(
    buildRunningHubAudioBody({
      modelType: 'suno-single',
      params: { title: '-', make_instrumental: 'true' },
      prompt: 'hello',
    }),
    {
      description: 'hello',
      make_instrumental: 'true',
    },
  );

  assert.deepEqual(
    buildRunningHubAudioBody({
      modelType: 'suno-custom',
      params: { tags: ' ', title: '-' },
      prompt: 'lyrics',
    }),
    {
      prompt: 'lyrics',
      tags: 'pop',
      title: 'Untitled',
    },
  );
});

test('runningHubAudioBody: builds MiniMax TTS and music bodies', () => {
  const tts = buildRunningHubAudioBody({
    modelType: 'minimax-tts',
    params: {
      customVoiceId: ' voice-1 ',
      speed: 1.25,
      pitch: 2,
      emotion: 'calm',
      pronunciation_dict: [{ from: 'A', to: 'B' }],
    },
    prompt: 'speak',
  });
  assert.equal(tts.text, 'speak');
  assert.equal(tts.voice_id, 'voice-1');
  assert.equal(tts.speed, 1.25);
  assert.equal(tts.pitch, 2);
  assert.deepEqual(tts.pronunciation_dict, [{ from: 'A', to: 'B' }]);
  assert.equal(tts.enable_base64_output, false);

  assert.deepEqual(
    buildRunningHubAudioBody({
      modelType: 'minimax-music-instrumental',
      params: {},
      prompt: 'piano',
    }),
    {
      prompt: 'piano',
      is_instrumental: true,
      sampleRate: '44100',
      bitrate: '256000',
      format: 'mp3',
    },
  );

  assert.deepEqual(
    buildRunningHubAudioBody({
      modelType: 'minimax-music',
      params: { prompt: 'pop song', lyricsOptimizer: 'true' },
      prompt: 'lyrics',
    }),
    {
      lyrics: 'lyrics',
      prompt: 'pop song',
      is_instrumental: false,
      lyricsOptimizer: true,
      sampleRate: '44100',
      bitrate: '256000',
      format: 'mp3',
    },
  );
});

test('runningHubAudioBody: keeps the generic body with uploaded audio', () => {
  assert.deepEqual(
    buildRunningHubAudioBody({
      modelType: 'other',
      params: { custom: 1 },
      prompt: 'do it',
      uploadedAudioUrl: 'https://cdn.example/audio.mp3',
    }),
    {
      prompt: 'do it',
      audioUrl: 'https://cdn.example/audio.mp3',
      custom: 1,
    },
  );
});
