import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AUDIO_VOICE_TRANSLATION_MODEL_ID,
  AUDIO_VOICE_TRANSLATION_PROVIDER_ID,
  translateAudioVoiceSegments,
} from './audioVoiceTranslationApi.js';

test('audioVoiceTranslationApi: rejects unsupported languages before requesting', async () => {
  let called = false;
  await assert.rejects(
    translateAudioVoiceSegments({
      languageId: 'unsupported',
      segments: [{ id: 's1', sourceText: 'hello' }],
      request: async () => {
        called = true;
      },
    }),
  );
  assert.equal(called, false);
});

test('audioVoiceTranslationApi: builds a translation request and parses results', async () => {
  const calls = [];
  const segments = [{ id: 's1', sourceText: 'hello', startMs: 0, endMs: 1000, durationMs: 1000 }];
  const result = await translateAudioVoiceSegments({
    languageId: 'en',
    segments,
    request: async (params) => {
      calls.push(params);
      return {
        text: JSON.stringify({
          translations: [{ id: 's1', targetText: 'Hello' }],
        }),
      };
    },
  });

  assert.deepEqual(result, [{ id: 's1', targetText: 'Hello' }]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].provider, AUDIO_VOICE_TRANSLATION_PROVIDER_ID);
  assert.equal(calls[0].model, AUDIO_VOICE_TRANSLATION_MODEL_ID);
  assert.deepEqual(calls[0].thinking, { type: 'disabled' });
  assert.equal(calls[0].structuredOutput.name, 'audio_voice_translation');
  assert.match(calls[0].prompt, /"targetLanguage"/);
  assert.match(calls[0].systemPrompt, /audiovisual dialogue translator/);
});

test('audioVoiceTranslationApi: rejects incomplete translation results', async () => {
  await assert.rejects(
    translateAudioVoiceSegments({
      languageId: 'ja',
      segments: [
        { id: 's1', sourceText: 'hello' },
        { id: 's2', sourceText: 'world' },
      ],
      request: async () => ({
        text: JSON.stringify({
          translations: [{ id: 's1', targetText: 'translated' }],
        }),
      }),
    }),
  );
});
