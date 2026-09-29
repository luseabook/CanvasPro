import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RUNNINGHUB_DEFAULT_INSTANCE_TYPE,
  RUNNINGHUB_PLUS_INSTANCE_TYPE,
  RUNNINGHUB_ULTRA_INSTANCE_TYPE,
  RUNNINGHUB_INSTANCE_OPTIONS,
  RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES,
  normalizeRunningHubInstanceType,
  getRunningHubInstanceTypeLabel,
} from './runningHubInstanceTypes.js';

test('names the three instance types', () => {
  assert.equal(RUNNINGHUB_DEFAULT_INSTANCE_TYPE, 'default');
  assert.equal(RUNNINGHUB_PLUS_INSTANCE_TYPE, 'plus');
  assert.equal(RUNNINGHUB_ULTRA_INSTANCE_TYPE, 'ultra');
});

test('freezes the option list with its memory labels', () => {
  assert.equal(Object.isFrozen(RUNNINGHUB_INSTANCE_OPTIONS), true);
  assert.deepEqual(
    RUNNINGHUB_INSTANCE_OPTIONS.map((option) => ({ ...option })),
    [
      { value: 'default', label: '24G' },
      { value: 'plus', label: '48G' },
      { value: 'ultra', label: '84G' },
    ],
  );
  for (const option of RUNNINGHUB_INSTANCE_OPTIONS) assert.equal(Object.isFrozen(option), true);
});

test('freezes the allowed value list in option order', () => {
  assert.deepEqual([...RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES], ['default', 'plus', 'ultra']);
  assert.equal(Object.isFrozen(RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES), true);
});

test('normalizes every supported type, trimming and lowercasing first', () => {
  assert.equal(normalizeRunningHubInstanceType('plus'), 'plus');
  assert.equal(normalizeRunningHubInstanceType('  PLUS  '), 'plus');
  assert.equal(normalizeRunningHubInstanceType('ultra'), 'ultra');
  assert.equal(normalizeRunningHubInstanceType('Ultra'), 'ultra');
  assert.equal(normalizeRunningHubInstanceType('default'), 'default');
});

test('falls back to the default type for unknown or nullish input', () => {
  for (const value of ['mega', '', ' ', null, undefined, 0, {}]) {
    assert.equal(normalizeRunningHubInstanceType(value), 'default');
  }
});

test('labels each normalized type with its memory size', () => {
  assert.equal(getRunningHubInstanceTypeLabel('plus'), '48G');
  assert.equal(getRunningHubInstanceTypeLabel('  ULTRA '), '84G');
  assert.equal(getRunningHubInstanceTypeLabel('default'), '24G');
  assert.equal(getRunningHubInstanceTypeLabel(undefined), '24G');
  assert.equal(getRunningHubInstanceTypeLabel('mega'), '24G');
});
