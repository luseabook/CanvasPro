import test from 'node:test';
import assert from 'node:assert/strict';

import {
  REPLICATION_SPEECH_ROUTING_GUIDANCE,
  buildVideoReplicationSpeechPolicy,
  buildVideoReplicationSpeechReviewContext,
  getVideoReplicationSpeechGuidance,
} from './videoReplicationSpeechPolicy.js';

function createSourceAnalysis() {
  return {
    events: [
      {
        id: 'mixed',
        startSec: 0,
        endSec: 4,
        visual: 'mixed',
        dialogue: [{ kind: 'dialogue', text: 'Dialogue' }],
        voiceover: [
          { kind: 'narration', text: 'Narration' },
          { kind: 'narration', text: ' ' },
        ],
        uncertainties: [],
      },
      {
        id: 'uncertain',
        startSec: 4,
        endSec: 8,
        visual: 'uncertain',
        dialogue: [{ kind: 'dialogue', text: '[听不清]', uncertain: true }],
        voiceover: [{ kind: 'inner_monologue', text: 'Thought' }],
        uncertainties: ['音轨不清'],
      },
      {
        id: 'silent',
        startSec: 8,
        endSec: 10,
        visual: 'silent',
        dialogue: [],
        voiceover: [],
        uncertainties: [],
      },
    ],
  };
}

test('videoReplicationSpeechPolicy: summarizes dialogue, voiceover, uncertainty, and silence', () => {
  const policy = buildVideoReplicationSpeechPolicy(createSourceAnalysis());

  assert.equal(policy.schemaVersion, 1);
  assert.deepEqual(policy.events, [
    {
      eventId: 'mixed',
      startSec: 0,
      endSec: 4,
      mode: 'mixed',
      dialogueCount: 1,
      voiceoverCount: 1,
      voiceoverKinds: ['narration'],
    },
    {
      eventId: 'uncertain',
      startSec: 4,
      endSec: 8,
      mode: 'uncertain',
      dialogueCount: 1,
      voiceoverCount: 1,
      voiceoverKinds: ['inner_monologue'],
    },
    {
      eventId: 'silent',
      startSec: 8,
      endSec: 10,
      mode: 'no_speech',
      dialogueCount: 0,
      voiceoverCount: 0,
      voiceoverKinds: [],
    },
  ]);
  assert.equal(buildVideoReplicationSpeechPolicy(null), null);
});

test('videoReplicationSpeechPolicy: guidance requires source evidence and locked timing', () => {
  assert.match(REPLICATION_SPEECH_ROUTING_GUIDANCE, /speechOrder/u);
  assert.match(REPLICATION_SPEECH_ROUTING_GUIDANCE, /speechRefs/u);
  assert.match(REPLICATION_SPEECH_ROUTING_GUIDANCE, /保持原时间范围/u);
  assert.equal(
    getVideoReplicationSpeechGuidance({
      replication: { sourceAnalysis: createSourceAnalysis() },
    }),
    REPLICATION_SPEECH_ROUTING_GUIDANCE,
  );
  assert.equal(getVideoReplicationSpeechGuidance({}), '');
});

test('videoReplicationSpeechPolicy: review context projects source speech without timing metadata', () => {
  const sourceAnalysis = createSourceAnalysis();
  const context = buildVideoReplicationSpeechReviewContext({
    replication: { sourceAnalysis },
  });

  assert.deepEqual(
    context.speechPolicy,
    buildVideoReplicationSpeechPolicy(sourceAnalysis),
  );
  assert.equal(context.speechGuidance, REPLICATION_SPEECH_ROUTING_GUIDANCE);
  assert.deepEqual(context.sourceSpeechEvents[0], {
    eventId: 'mixed',
    visual: 'mixed',
    dialogue: sourceAnalysis.events[0].dialogue,
    voiceover: sourceAnalysis.events[0].voiceover,
    uncertainties: [],
  });
  assert.deepEqual(buildVideoReplicationSpeechReviewContext({}), {});
});
