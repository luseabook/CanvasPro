import test from 'node:test';
import assert from 'node:assert/strict';

import {
  REPLICATION_CONTENT_TYPES,
  normalizeReplicationContentType,
  replicationRoutePolicy,
  resolveReplicationContentType,
} from './videoReplicationContentRouting.js';

test('videoReplicationContentRouting: normalize only accepts supported content types', () => {
  assert.deepEqual(REPLICATION_CONTENT_TYPES, ['story', 'narrated_story', 'advertisement', 'unknown']);
  for (const type of REPLICATION_CONTENT_TYPES) {
    assert.equal(normalizeReplicationContentType(type), type);
  }
  assert.equal(normalizeReplicationContentType('STORY'), 'unknown');
  assert.equal(normalizeReplicationContentType(undefined), 'unknown');
});

test('videoReplicationContentRouting: route policy always excludes generated speech subtitles', () => {
  for (const type of REPLICATION_CONTENT_TYPES) {
    const policy = replicationRoutePolicy(type);
    assert.equal(policy.contentType, type);
    assert.equal(policy.includeSpeechSubtitles, false);
    assert.equal(typeof policy.instruction, 'string');
    assert.ok(policy.instruction.length > 40);
  }
});

test('videoReplicationContentRouting: resolve picks the first known type', () => {
  assert.equal(resolveReplicationContentType('bad', 'advertisement', 'story'), 'advertisement');
  assert.equal(resolveReplicationContentType('', null, 'unknown'), 'unknown');
});
