import test from 'node:test';
import assert from 'node:assert/strict';
import { PERSON_REPLACEMENT_ORIENTATION_ENABLED } from './personReplacementCapabilities.js';

test('personReplacementCapabilities: 朝向能力当前关闭', () => {
  assert.equal(PERSON_REPLACEMENT_ORIENTATION_ENABLED, false);
});
