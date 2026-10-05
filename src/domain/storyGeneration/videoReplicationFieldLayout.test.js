import test from 'node:test';
import assert from 'node:assert/strict';

import { separateReplicationGeneratedFields } from './videoReplicationFieldLayout.js';

test('videoReplicationFieldLayout removes a duplicated final visual sentence', () => {
  const result = separateReplicationGeneratedFields({
    visual: 'Alice enters the room。 medium shot',
    camera: 'medium shot',
  });

  assert.equal(result.visual, 'Alice enters the room。');
  assert.equal(result.camera, 'medium shot');
});

test('videoReplicationFieldLayout keeps quoted visual text', () => {
  const result = separateReplicationGeneratedFields({
    visual: 'Alice enters the room. "medium shot"',
    camera: 'medium shot',
  });

  assert.equal(result.visual, 'Alice enters the room. "medium shot"');
});
