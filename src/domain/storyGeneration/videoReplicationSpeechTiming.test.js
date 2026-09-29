import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findReplicationAsrSpeechRange,
  inspectReplicationSpeechTiming,
  resolveReplicationSpeechTiming,
} from './videoReplicationSpeechTiming.js';

test('videoReplicationSpeechTiming: single-part ASR range is relative to the clip', () => {
  const event = {
    id: 'event-1',
    dialogue: [
      {
        text: '你好',
        timingSource: 'asr',
        speakerId: 'speaker-1',
        startSec: 6,
        endSec: 8,
      },
    ],
    voiceover: [],
    shots: [],
  };

  const range = resolveReplicationSpeechTiming({
    clip: {
      sourceStartSec: 5,
      replicationSpeechEvents: [event],
    },
    shot: { startSec: 0, endSec: 10, audio: '' },
    kind: 'dialogue',
    parts: [{ text: '你好' }],
    durationSec: 12,
  });

  assert.deepEqual(range, { startSec: 1, endSec: 3 });
  assert.deepEqual(findReplicationAsrSpeechRange([event], 'dialogue', '你好'), {
    startSec: 6,
    endSec: 8,
  });
});

test('videoReplicationSpeechTiming: contiguous multi-part ASR refs use their outer bounds', () => {
  const event = {
    id: 'event-1',
    dialogue: [
      {
        text: '你好',
        timingSource: 'asr',
        speakerId: 'speaker-1',
        startSec: 2,
        endSec: 3,
      },
      {
        text: '世界',
        timingSource: 'asr',
        speakerId: 'speaker-1',
        startSec: 3,
        endSec: 4,
      },
    ],
    voiceover: [],
    shots: [],
  };

  const range = resolveReplicationSpeechTiming({
    clip: { replicationSpeechEvents: [event] },
    shot: { startSec: 0, endSec: 6, audio: '' },
    kind: 'dialogue',
    parts: [{ text: '你好' }, { text: '世界' }],
    durationSec: 6,
  });

  assert.deepEqual(range, { startSec: 2, endSec: 4 });
});

test('videoReplicationSpeechTiming: shot evidence intersects with explicit voiceover timing', () => {
  const event = {
    id: 'event-1',
    dialogue: [],
    voiceover: [
      {
        text: '旁白',
        timingSource: 'estimate',
        speakerId: 'speaker-1',
        startSec: 0,
        endSec: 10,
      },
    ],
    shots: [
      { startSec: 5, endSec: 7, speechRefs: ['voiceover:0'] },
      { startSec: 7, endSec: 9, speechRefs: ['voiceover:0'] },
    ],
  };

  const range = resolveReplicationSpeechTiming({
    clip: { replicationSpeechEvents: [event] },
    shot: { startSec: 4, endSec: 12, audio: '画外音时间：5.5-6.5秒' },
    kind: 'voiceover',
    parts: [{ text: '旁白' }],
    durationSec: 12,
  });

  assert.deepEqual(range, { startSec: 5.5, endSec: 6.5 });
});

test('videoReplicationSpeechTiming: unresolved continuation falls back and is reported', () => {
  const ambiguousEvent = {
    id: 'event-1',
    startSec: 0,
    endSec: 4,
    dialogue: [],
    voiceover: [
      { text: '续', timingSource: 'estimate', speakerId: 'speaker-1', startSec: 0, endSec: 2 },
      { text: '后文', timingSource: 'estimate', speakerId: 'speaker-1', startSec: 2, endSec: 4 },
    ],
    shots: [],
  };
  const clip = {
    ref: 'clip-1',
    shots: [
      {
        durationSec: 2,
        dialogue: '',
        voiceover: '旁白：续',
        audio: '接续上一镜头',
      },
    ],
  };

  const range = resolveReplicationSpeechTiming({
    clip: { ...clip, replicationSpeechEvents: [ambiguousEvent] },
    shot: { startSec: 0, endSec: 2, audio: '接续上一镜头' },
    kind: 'voiceover',
    parts: [{ text: '续' }],
    durationSec: 2,
  });
  assert.deepEqual(range, { startSec: 0, endSec: 2, uncertain: true });

  const issues = inspectReplicationSpeechTiming(
    { clips: [clip] },
    { replication: { segmentPlan: [{ ref: 'clip-1', events: [ambiguousEvent] }] } },
  );
  assert.deepEqual(
    issues.map((issue) => issue.code),
    ['replication_speech_timing_uncertain'],
  );
  assert.equal(issues[0].shotIndex, 0);
});

