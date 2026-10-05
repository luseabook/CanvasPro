import test from 'node:test';
import assert from 'node:assert/strict';

import { validateRunningHubAudioParameters } from './runningHubAudioValidation.js';

function createManifest(overrides = {}) {
  return {
    uiSchema: {
      fields: [
        { id: 'speaker', type: 'text', label: 'Speaker' },
        { id: 'speed', type: 'slider', min: 0.5, max: 2, step: 0.1, label: 'Speed' },
        {
          id: 'format',
          type: 'select',
          label: 'Format',
          options: [{ value: 'mp3' }, { value: 'wav' }],
        },
      ],
    },
    inputSlots: {
      maxByKind: { audio: 2, image: 0 },
      fixedSlots: [{ id: 'audioRef', kind: 'audio', required: true, label: 'Reference' }],
    },
    ...overrides,
  };
}

test('runningHubAudioValidation: accepts a valid parameter set', () => {
  assert.doesNotThrow(() =>
    validateRunningHubAudioParameters(
      createManifest(),
      {
        promptRequired: true,
        promptMaxLength: 20,
        rules: {
          minLengths: { speaker: 2 },
          audioExtensions: ['mp3'],
          maxAudioBytes: 100,
          audioDuration: { min: 1, max: 60 },
        },
      },
      'hello',
      { speaker: 'Alice', speed: 1.2, format: 'mp3' },
      [
        {
          refSlot: 'audioRef',
          url: 'https://cdn.example/ref.mp3',
          size: 20,
          duration: 5,
        },
      ],
      [],
    ),
  );
});

test('runningHubAudioValidation: enforces prompt limits and weighted Chinese counts', () => {
  assert.throws(
    () =>
      validateRunningHubAudioParameters(
        createManifest(),
        {
          promptRequired: true,
          promptMaxLength: 4,
          rules: { weightedChinesePrompt: true },
        },
        '你好a',
        {},
        [],
        [],
      ),
    /4/,
  );

  assert.throws(() =>
    validateRunningHubAudioParameters(
      createManifest(),
      { promptRequired: true, promptMaxLength: 10 },
      '',
      {},
      [],
      [],
    ),
  );
});

test('runningHubAudioValidation: validates fields, ranges, and options', () => {
  const workflow = {
    rules: {
      requiredFields: ['speaker'],
      minLengths: { speaker: 2 },
    },
  };
  const manifest = createManifest();

  assert.throws(() =>
    validateRunningHubAudioParameters(manifest, workflow, 'hello', { speaker: '' }, [], []),
  );
  assert.throws(() =>
    validateRunningHubAudioParameters(
      manifest,
      workflow,
      'hello',
      { speaker: 'Alice', speed: 3, format: 'mp3' },
      [],
      [],
    ),
  );
  assert.throws(() =>
    validateRunningHubAudioParameters(
      manifest,
      workflow,
      'hello',
      { speaker: 'Alice', speed: 1, format: 'ogg' },
      [],
      [],
    ),
  );
});

test('runningHubAudioValidation: validates input slots, files, and duplicates', () => {
  const manifest = createManifest();
  const workflow = {
    rules: {
      audioExtensions: ['mp3'],
      maxAudioBytes: 100,
      audioDuration: { min: 1, max: 60 },
    },
  };

  assert.throws(() => validateRunningHubAudioParameters(manifest, workflow, 'hello', {}, [], []));
  assert.throws(() =>
    validateRunningHubAudioParameters(
      manifest,
      workflow,
      'hello',
      {},
      [{ refSlot: 'audioRef', url: 'https://cdn.example/a.wav', size: 10, duration: 5 }],
      [],
    ),
  );
  assert.throws(() =>
    validateRunningHubAudioParameters(
      manifest,
      workflow,
      'hello',
      {},
      [
        { refSlot: 'audioRef', url: 'https://cdn.example/a.mp3', size: 10, duration: 5 },
        { refSlot: 'audioRef', url: 'https://cdn.example/b.mp3', size: 10, duration: 5 },
      ],
      [],
    ),
  );
  assert.throws(() =>
    validateRunningHubAudioParameters(
      manifest,
      workflow,
      'hello',
      {},
      [
        { refSlot: 'audioRef', url: 'https://cdn.example/a.mp3', size: 10, duration: 5 },
        { refSlot: 'audio2', url: 'https://cdn.example/b.mp3', size: 10, duration: 5 },
        { refSlot: 'audio3', url: 'https://cdn.example/c.mp3', size: 10, duration: 5 },
      ],
      [],
    ),
  );
});
