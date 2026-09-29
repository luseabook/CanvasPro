import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatReplicationSpatial,
  formatReplicationText,
  normalizeReplicationVisualContract,
  replicationVisualSchema,
} from './videoReplicationVisualContract.js';

test('videoReplicationVisualContract: schema describes scene, text, and spatial evidence', () => {
  const schema = replicationVisualSchema();
  assert.deepEqual(Object.keys(schema), ['sceneKey', 'textElements', 'spatialStart', 'spatialEnd']);
  assert.deepEqual(schema.textElements.items.properties.kind.enum, [
    'physical',
    'graphic',
    'speech_subtitle',
    'uncertain',
  ]);
  assert.deepEqual(schema.spatialStart.items.required, [
    'subject',
    'landmark',
    'relation',
    'facing',
    'pose',
    'heldObject',
  ]);
});

test('videoReplicationVisualContract: normalization trims text and repairs unknown kinds', () => {
  const result = normalizeReplicationVisualContract({
    textElements: [{ kind: 'bad', text: ' A ', carrier: ' sign ', placement: ' top ' }],
    spatialStart: [
      {
        subject: ' Alice ',
        landmark: ' desk',
        relation: ' behind',
        facing: ' left',
        pose: 7,
        heldObject: null,
      },
    ],
  });
  assert.deepEqual(result.textElements, [
    { kind: 'uncertain', text: 'A', carrier: 'sign', placement: 'top' },
  ]);
  assert.deepEqual(result.spatialStart, [
    { subject: 'Alice', landmark: 'desk', relation: 'behind', facing: 'left', pose: '', heldObject: '' },
  ]);
});

test('videoReplicationVisualContract: formatting keeps complete spatial records', () => {
  const formatted = formatReplicationSpatial([
    { subject: 'Alice', landmark: 'desk', relation: 'behind', facing: 'left', pose: 'standing' },
    { subject: 'Ignored', landmark: '', relation: 'near' },
  ]);
  assert.match(formatted, /Alice/);
  assert.match(formatted, /desk/);
  assert.match(formatted, /standing/);
  assert.doesNotMatch(formatted, /Ignored/);
});

test('videoReplicationVisualContract: generated text excludes subtitles unless explicitly allowed', () => {
  const entries = [
    { kind: 'physical', text: 'OPEN', carrier: 'sign', placement: 'door' },
    { kind: 'speech_subtitle', text: 'hello', carrier: 'screen', placement: 'bottom' },
  ];
  assert.match(formatReplicationText(entries), /OPEN/);
  assert.doesNotMatch(formatReplicationText(entries), /hello/);
  assert.match(formatReplicationText(entries, true), /hello/);
});
