import test from 'node:test';
import assert from 'node:assert/strict';

import {
  REPLICATION_SPEECH_INTEGRITY_GUIDANCE,
  getReplicationSourceSpeechReviewReasons,
  inspectReplicationSpeechIntegrity,
  replicationSpeechParts,
} from './videoReplicationSpeechIntegrity.js';

function sourceEvent(overrides = {}) {
  return {
    id: 'event-1',
    startSec: 0,
    endSec: 5,
    visual: '',
    dialogue: [],
    voiceover: [],
    shots: [
      {
        id: 'source-shot-1',
        startSec: 0,
        endSec: 5,
        visual: '',
        camera: '',
        speechRefs: [],
      },
    ],
    ...overrides,
  };
}

test('videoReplicationSpeechIntegrity: parses labelled lines and strips display quotes', () => {
  assert.deepEqual(
    replicationSpeechParts(
      '\n旁白：“前句”\n人物:你好\n没有标签\n空行后：\n',
      'dialogue',
    ),
    [
      { kind: 'dialogue', text: '前句' },
      { kind: 'dialogue', text: '你好' },
      { kind: 'dialogue', text: '没有标签' },
      { kind: 'dialogue', text: '空行后：' },
    ],
  );
});

test('videoReplicationSpeechIntegrity: guidance keeps the source evidence contract visible', () => {
  assert.match(REPLICATION_SPEECH_INTEGRITY_GUIDANCE, /speechOrder/u);
  assert.match(REPLICATION_SPEECH_INTEGRITY_GUIDANCE, /speechRefs/u);
  assert.match(REPLICATION_SPEECH_INTEGRITY_GUIDANCE, /逐句检查/u);
});

test('videoReplicationSpeechIntegrity: source review reports gaps, likely misclassification, and internal cuts', () => {
  const reasons = getReplicationSourceSpeechReviewReasons(
    {
      events: [
        sourceEvent({
          visual: '人物说道',
          voiceover: [{ text: '旁白' }],
          shots: [
            {
              id: 'source-shot-1',
              startSec: 0,
              endSec: 10,
              visual: '镜头切至近景',
              camera: '固定',
              speechRefs: [],
            },
          ],
          endSec: 10,
        }),
      ],
    },
    { durationSec: 12 },
  );

  assert.equal(reasons.length, 3);
  assert.match(reasons[0], /10-12秒缺少逐镜画面记录/u);
  assert.match(reasons[1], /人声全部被归为画外音/u);
  assert.match(reasons[2], /单个 shot 内描述多个机位切换/u);
});

test('videoReplicationSpeechIntegrity: duplicate generated speech is reported once per repeated line', () => {
  const context = {
    replication: {
      segmentPlan: [
        {
          ref: 'clip-1',
          events: [sourceEvent({ dialogue: [{ text: '你好世界' }] })],
        },
      ],
    },
  };
  const issues = inspectReplicationSpeechIntegrity(
    {
      clips: [
        {
          ref: 'clip-1',
          shots: [
            { dialogue: '甲：你好世界', voiceover: '' },
            { dialogue: '甲：你好世界', voiceover: '' },
          ],
        },
      ],
    },
    context,
  );

  const duplicate = issues.find(
    (issue) => issue.code === 'replication_speech_duplicate',
  );
  assert.deepEqual(
    issues.map((issue) => issue.code),
    ['replication_speech_duplicate', 'replication_speech_mismatch'],
  );
  assert.equal(duplicate.clipRef, 'clip-1');
  assert.equal(duplicate.shotIndex, 0);
  assert.match(duplicate.message, /重复转写/u);
});

test('videoReplicationSpeechIntegrity: rewritten source speech is a mismatch', () => {
  const context = {
    replication: {
      segmentPlan: [
        {
          ref: 'clip-1',
          events: [sourceEvent({ dialogue: [{ text: '你好世界' }] })],
        },
      ],
    },
  };
  const issues = inspectReplicationSpeechIntegrity(
    {
      clips: [
        {
          ref: 'clip-1',
          shots: [{ dialogue: '甲：你好呀', voiceover: '' }],
        },
      ],
    },
    context,
  );

  assert.deepEqual(
    issues.map((issue) => issue.code),
    ['replication_speech_mismatch'],
  );
});

test('videoReplicationSpeechIntegrity: channel order must follow the source speech order', () => {
  const source = sourceEvent({
    dialogue: [
      {
        text: '乙',
        speakerId: 'speaker-1',
        timingSource: 'asr',
        startSec: 0,
        endSec: 1,
      },
    ],
    voiceover: [
      {
        text: '甲',
        speakerId: 'speaker-1',
        timingSource: 'asr',
        startSec: 4,
        endSec: 5,
      },
    ],
    speechOrder: ['voiceover:0', 'dialogue:0'],
  });
  const issues = inspectReplicationSpeechIntegrity(
    {
      clips: [
        {
          ref: 'clip-1',
          shots: [
            {
              dialogue: '乙',
              voiceover: '旁白：甲',
            },
          ],
        },
      ],
    },
    { replication: { segmentPlan: [{ ref: 'clip-1', events: [source] }] } },
  );

  assert.deepEqual(
    issues.map((issue) => issue.code),
    ['replication_speech_order'],
  );
});
