import test from 'node:test';
import assert from 'node:assert/strict';

import { buildStoryReplicationTimelinePrompt } from './storyReplicationTimelinePrompt.js';

test('storyReplicationTimelinePrompt: uses ASR timing relative to the clip source', () => {
  const prompt = buildStoryReplicationTimelinePrompt({
    clip: {
      sourceStartSec: 5,
      replicationContentType: 'story',
      promptMode: 'seedance-2.0',
      replicationSpeechEvents: [
        {
          id: 'event-1',
          dialogue: [
            {
              text: 'Hello',
              timingSource: 'asr',
              speakerId: 'speaker-1',
              startSec: 6,
              endSec: 8,
            },
          ],
          voiceover: [],
          shots: [],
        },
      ],
    },
    shots: [
      {
        durationSec: 4,
        visual: 'A room',
        camera: 'Static camera',
        audio: '',
        dialogue: 'Hello',
        voiceover: '',
        assetUsages: [{ assetRef: 'character-1', appearanceRef: 'appearance-1' }],
      },
    ],
    assets: [
      {
        id: 'character-1',
        kind: 'character',
        name: 'Alice',
        description: 'Test character',
        replicationSource: { ref: 'speaker-1' },
        appearances: [{ id: 'appearance-1', name: 'Alice' }],
      },
    ],
    visualStyle: 'Cinematic',
  });

  assert.match(prompt, /Alice/u);
  assert.match(prompt, /Hello/u);
});

test('storyReplicationTimelinePrompt: merges coincident voice channels in fallback timing', () => {
  const prompt = buildStoryReplicationTimelinePrompt({
    clip: {
      replicationContentType: 'story',
      promptMode: 'seedance-2.0',
      replicationCharacters: [{ id: 'character-1', name: 'Alice' }],
    },
    shots: [
      {
        durationSec: 4,
        visual: 'A room',
        camera: 'Static camera',
        audio: '',
        dialogue: 'Alice\uff1aWorld',
        voiceover: '\u65c1\u767d\uff1aHello',
        assetUsages: [{ assetRef: 'character-1', appearanceRef: 'appearance-1' }],
      },
    ],
    assets: [
      {
        id: 'character-1',
        kind: 'character',
        name: 'Alice',
        description: 'Test character',
        appearances: [{ id: 'appearance-1', name: 'Alice' }],
      },
    ],
    visualStyle: '',
  });

  assert.match(prompt, /Hello/u);
  assert.match(prompt, /World/u);
  assert.ok(prompt.indexOf('Hello') < prompt.indexOf('World'));
});
