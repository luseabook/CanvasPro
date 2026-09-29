import test from 'node:test';
import assert from 'node:assert/strict';

import { volcengineDoubaoAudioGeneration } from './volcengineAudioResolvers.js';

test('volcengineAudioResolvers: builds Doubao audio requests and normalizes references', () => {
  const result = volcengineDoubaoAudioGeneration({
    currentBody: { text_prompt: 'Read this in @音频1 voice' },
    inputAudios: ['https://cdn.test/ref-1.wav'],
    payload: {
      model: 'volcengine/seed-audio-1.0',
      generationParams: { format: 'WAV', pitch: 8.7, speechRate: 200, loudnessRate: -80 },
    },
  });

  assert.equal(result.model, 'seed-audio-1.0');
  assert.equal(result.text_prompt, 'Read this in @audio1 voice');
  assert.deepEqual(result.references, [{ audio_url: 'https://cdn.test/ref-1.wav' }]);
  assert.deepEqual(result.audio_config, {
    format: 'wav',
    sample_rate: 24000,
    pitch_rate: 9,
    speech_rate: 100,
    loudness_rate: -50,
  });
  assert.deepEqual(result.watermark, {});
});

test('volcengineAudioResolvers: adds default mentions and caps references at three', () => {
  const result = volcengineDoubaoAudioGeneration({
    currentBody: { text_prompt: 'Synth voice' },
    inputAudios: ['a', 'b', 'c', 'd'],
    payload: {},
    modelToken: 'seed-audio-1.0',
  });

  assert.match(result.text_prompt, /请参考 @audio1、@audio2、@audio3 的声音特征，Synth voice/);
  assert.equal(result.references.length, 3);
  assert.equal(result.audio_config.format, 'mp3');
});

test('volcengineAudioResolvers: requires prompt text', () => {
  assert.throws(
    () => volcengineDoubaoAudioGeneration({ currentBody: {}, payload: { prompt: '' } }),
    /需要输入合成文本或效果提示词/,
  );
});
