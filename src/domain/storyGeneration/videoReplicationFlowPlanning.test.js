import test from 'node:test';
import assert from 'node:assert/strict';

import {
  compileReplicationFlow,
  finalizeReplicationFlow,
} from './videoReplicationFlowPlanning.js';

function createSource() {
  return {
    videoObserved: true,
    title: 'Test source',
    characters: [
      {
        id: 'character-1',
        name: 'Alice',
        appearance: 'red coat',
      },
    ],
    shots: [
      {
        id: 'shot-1',
        startSec: 0,
        endSec: 4,
        characterIds: ['character-1'],
        visual: 'Alice walks through the room.',
        camera: 'wide shot',
        sound: '',
        uncertainty: '',
      },
      {
        id: 'shot-2',
        startSec: 4,
        endSec: 8,
        characterIds: ['character-1'],
        visual: 'Alice stops at the window.',
        camera: 'close shot',
        sound: '',
        uncertainty: '',
      },
    ],
    speech: [
      {
        id: 'speech-1',
        startSec: 1,
        endSec: 3,
        parts: [
          {
            speakerId: 'character-1',
            kind: 'dialogue',
            text: 'Hello there.',
            uncertainty: '',
          },
        ],
      },
    ],
  };
}

test('videoReplicationFlowPlanning compiles a source into bounded clips', () => {
  const clips = compileReplicationFlow(createSource(), 5, {
    promptMode: 'seedance-2.0',
  });

  assert.equal(clips.length, 2);
  assert.equal(clips[0].sourceStartSec, 0);
  assert.equal(clips[0].sourceEndSec, 4);
  assert.deepEqual(clips[0].sourceShotIds, ['shot-1']);
  assert.deepEqual(clips[0].speechIds, ['speech-1']);
  assert.deepEqual(clips[1].sourceShotIds, ['shot-2']);
});

test('videoReplicationFlowPlanning finalizes valid and invalid sources without throwing', () => {
  const valid = finalizeReplicationFlow(createSource(), {
    durationSec: 8,
    maxSeconds: 5,
    promptMode: 'seedance-2.0',
  });
  assert.equal(valid.status, 'passed');
  assert.equal(valid.clips.length, 2);

  const invalid = finalizeReplicationFlow(createSource(), {
    durationSec: 0,
    maxSeconds: 5,
    promptMode: 'seedance-2.0',
  });
  assert.equal(invalid.status, 'needs-attention');
  assert.equal(invalid.clips.length, 0);
  assert.equal(invalid.notes.at(-1).code, 'output-invalid');
  assert.equal(invalid.notes.at(-1).blocking, true);
});
