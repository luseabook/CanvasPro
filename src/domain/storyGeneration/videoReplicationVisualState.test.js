import test from 'node:test';
import assert from 'node:assert/strict';

import { connectReplicationClipStates, replicationVisualFields } from './videoReplicationVisualState.js';

const spatialEnd = [{ subject: 'A', landmark: 'table', relation: 'left' }];

test('videoReplicationVisualState: fields trim strings and retain boolean staging', () => {
  const result = replicationVisualFields({
    sceneKey: ' room ',
    entryState: ' enter ',
    screenText: ' sign ',
    speechSubtitles: ' subtitle ',
    hasStaging: true,
    ignored: 'value',
  });
  assert.equal(result.sceneKey, 'room');
  assert.equal(result.entryState, 'enter');
  assert.equal(result.screenText, 'sign');
  assert.equal(result.speechSubtitles, 'subtitle');
  assert.equal(result.hasStaging, true);
  assert.equal('ignored' in result, false);
});

test('videoReplicationVisualState: same-scene staging carries the previous end state', () => {
  const clips = [
    { shots: [{ sceneKey: 'room', spatialEnd }] },
    { shots: [{ sceneKey: 'room', spatialStart: [] }, { sceneKey: 'room' }] },
  ];
  const result = connectReplicationClipStates(clips);
  assert.equal(result[0].replicationStagingHandoff, true);
  assert.equal(result[1].replicationStagingHandoff, false);
  assert.deepEqual(result[1].shots[0].spatialStart, spatialEnd);
  assert.deepEqual(clips[1].shots[0].spatialStart, []);
});

test('videoReplicationVisualState: different scenes do not create a handoff', () => {
  const result = connectReplicationClipStates([
    { shots: [{ sceneKey: 'room', spatialEnd }] },
    { shots: [{ sceneKey: 'street', spatialStart: [] }] },
  ]);
  assert.equal(result[0].replicationStagingHandoff, false);
  assert.deepEqual(result[1].shots[0].spatialStart, []);
});
