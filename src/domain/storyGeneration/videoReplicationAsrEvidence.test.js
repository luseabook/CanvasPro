import test from 'node:test';
import assert from 'node:assert/strict';

import {
  attachAsrSourceEvidence,
  buildReplicationAsrWords,
  createAsrVisualOutput,
  hydrateAsrSource,
} from './videoReplicationAsrEvidence.js';

test('videoReplicationAsrEvidence builds word-level timing evidence', () => {
  const words = buildReplicationAsrWords({
    raw: { result: { text: 'Hi there.' } },
    utterances: [
      {
        text: 'Hi there.',
        start_time: 1000,
        end_time: 2500,
        additions: { speaker: 'speaker-1' },
        words: [
          { text: 'Hi', start_time: 1000, end_time: 1400 },
          { text: ' there.', start_time: 1400, end_time: 2500 },
        ],
      },
    ],
  });

  assert.deepEqual(words, [
    {
      text: 'Hi',
      startSec: 1,
      endSec: 1.4,
      id: 0,
      utteranceIndex: 0,
      acousticSpeakerId: 'speaker-1',
    },
    {
      text: ' there.',
      startSec: 1.4,
      endSec: 2.5,
      id: 1,
      utteranceIndex: 0,
      acousticSpeakerId: 'speaker-1',
    },
  ]);
});

test('videoReplicationAsrEvidence rejects inconsistent transcript text', () => {
  assert.throws(
    () =>
      buildReplicationAsrWords({
        raw: { result: { text: 'Different text' } },
        utterances: [{ text: 'Original text', start_time: 0, end_time: 1000 }],
      }),
    Error,
  );
});

test('videoReplicationAsrEvidence adds speech assignments to a cloned schema', () => {
  const input = {
    schema: {
      properties: {
        events: {
          items: {
            properties: {
              dialogue: {},
              voiceover: {},
              speechOrder: {},
              shots: {
                items: {
                  properties: { speechRefs: {} },
                  required: ['speechRefs'],
                },
              },
            },
            required: ['dialogue', 'voiceover', 'speechOrder'],
          },
        },
      },
      required: ['events'],
    },
  };

  const output = createAsrVisualOutput(input);
  const eventProperties = output.schema.properties.events.items.properties;
  const shotProperties = eventProperties.shots.items.properties;

  assert.equal('dialogue' in eventProperties, false);
  assert.equal('voiceover' in eventProperties, false);
  assert.equal('speechOrder' in eventProperties, false);
  assert.equal('speechRefs' in shotProperties, false);
  assert.deepEqual(output.schema.properties.speechAssignments.items.required, [
    'fromWord',
    'toWord',
    'kind',
    'speakerId',
    'uncertain',
  ]);
  assert.equal(output.schema.required.includes('speechAssignments'), true);
  assert.equal('dialogue' in input.schema.properties.events.items.properties, true);
});

test('videoReplicationAsrEvidence hydrates speech onto matching events and shots', () => {
  const source = {
    videoObserved: true,
    characters: [{ id: 'character-1' }],
    speechAssignments: [
      {
        fromWord: 0,
        toWord: 0,
        kind: 'dialogue',
        speakerId: 'character-1',
        uncertain: false,
      },
    ],
    events: [
      {
        id: 'event-1',
        startSec: 0,
        endSec: 2,
        shots: [{ id: 'shot-1', startSec: 0, endSec: 2 }],
      },
    ],
  };
  const words = [
    {
      id: 0,
      text: 'Hello',
      startSec: 0.2,
      endSec: 0.8,
      utteranceIndex: 0,
      acousticSpeakerId: 'speaker-1',
    },
  ];

  const hydrated = hydrateAsrSource(source, { status: 'ok' }, words);

  assert.equal(hydrated.events[0].dialogue.length, 1);
  assert.equal(hydrated.events[0].dialogue[0].text, 'Hello');
  assert.equal(hydrated.events[0].dialogue[0].speakerId, 'character-1');
  assert.deepEqual(hydrated.events[0].shots[0].speechRefs, ['dialogue:0']);
  assert.equal('dialogue' in source.events[0], false);
});

test('videoReplicationAsrEvidence attaches source timing to generated speech', () => {
  const draft = {
    events: [
      {
        dialogue: [{ text: 'Hello', startSec: 0, endSec: 0, words: [] }],
        voiceover: [],
      },
    ],
  };
  const source = {
    events: [
      {
        dialogue: [
          {
            startSec: 1,
            endSec: 2,
            words: [{ text: 'Hello', startSec: 1, endSec: 2 }],
          },
        ],
        voiceover: [],
      },
    ],
  };
  const evidence = [{ id: 'evidence-1' }];

  const attached = attachAsrSourceEvidence(draft, source, evidence);

  assert.equal(attached.events[0].dialogue[0].startSec, 1);
  assert.equal(attached.events[0].dialogue[0].endSec, 2);
  assert.equal(attached.events[0].dialogue[0].timingSource, 'asr');
  assert.equal(attached.speechEvidence, evidence);
});
