import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findReplicationAsrSpeechRange,
  getReplicationEventSpeech,
  orderReplicationShotSpeech,
} from './videoReplicationSpeechOrder.js';

test('videoReplicationSpeechOrder: single-kind events keep their source order', () => {
  const events = getReplicationEventSpeech({
    voiceover: [{ text: 'v1' }, { text: 'v2' }],
    dialogue: [],
  });
  assert.deepEqual(
    events.map(({ kind, key, text }) => ({ kind, key, text })),
    [
      { kind: 'voiceover', key: 'voiceover:0', text: 'v1' },
      { kind: 'voiceover', key: 'voiceover:1', text: 'v2' },
    ],
  );
});

test('videoReplicationSpeechOrder: explicit speechOrder must be a complete permutation', () => {
  const ordered = getReplicationEventSpeech({
    voiceover: [{ text: 'v' }],
    dialogue: [{ text: 'd' }],
    speechOrder: ['dialogue:0', 'voiceover:0'],
  });
  assert.deepEqual(
    ordered.map((entry) => entry.key),
    ['dialogue:0', 'voiceover:0'],
  );
  assert.equal(
    getReplicationEventSpeech({
      voiceover: [{ text: 'v' }],
      dialogue: [{ text: 'd' }],
      speechOrder: ['dialogue:0', 'dialogue:0'],
    }),
    null,
  );
  assert.equal(
    getReplicationEventSpeech({
      voiceover: [{ text: 'v' }],
      dialogue: [{ text: 'd' }],
      speechOrder: ['dialogue:0', 'missing'],
    }),
    null,
  );
});

test('videoReplicationSpeechOrder: ASR ranges follow speaker and kind boundaries', () => {
  const shots = [
    {
      voiceover: [{ text: 'A', speakerId: 's1', timingSource: 'asr', startSec: 0, endSec: 1 }],
      dialogue: [],
    },
    {
      voiceover: [{ text: 'B', speakerId: 's1', timingSource: 'asr', startSec: 5, endSec: 6 }],
      dialogue: [],
    },
  ];
  assert.deepEqual(findReplicationAsrSpeechRange(shots, 'voiceover', 'A'), {
    startSec: 0,
    endSec: 1,
  });
  assert.deepEqual(findReplicationAsrSpeechRange(shots, 'voiceover', 'B'), {
    startSec: 5,
    endSec: 6,
  });
});

test('videoReplicationSpeechOrder: orders parts by ASR start and returns null without a match', () => {
  const shots = [
    {
      voiceover: [{ text: 'A', speakerId: 's1', timingSource: 'asr', startSec: 0, endSec: 1 }],
      dialogue: [],
    },
    {
      voiceover: [{ text: 'B', speakerId: 's1', timingSource: 'asr', startSec: 5, endSec: 6 }],
      dialogue: [],
    },
  ];
  const parts = [
    { kind: 'voiceover', text: 'B' },
    { kind: 'voiceover', text: 'A' },
  ];
  assert.deepEqual(orderReplicationShotSpeech(parts, shots), [
    { kind: 'voiceover', text: 'A' },
    { kind: 'voiceover', text: 'B' },
  ]);
  assert.equal(orderReplicationShotSpeech(parts, []), null);
});
