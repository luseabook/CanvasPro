import test from 'node:test';
import assert from 'node:assert/strict';

import { applyUiSchemaFieldOverrides } from './uiSchemaFieldOverrides.js';

test('applyUiSchemaFieldOverrides: overlays matching fields without mutating input', () => {
  const fields = [
    { id: 'prompt', type: 'text', label: 'Prompt' },
    { id: 'steps', type: 'number' },
  ];
  const result = applyUiSchemaFieldOverrides(fields, {
    prompt: { label: 'Description', required: true },
  });

  assert.deepEqual(result, [
    { id: 'prompt', type: 'text', label: 'Description', required: true },
    { id: 'steps', type: 'number' },
  ]);
  assert.notEqual(result[0], fields[0]);
  assert.equal(result[1], fields[1]);
  assert.equal(fields[0].label, 'Prompt');
});

test('applyUiSchemaFieldOverrides: ignores unknown and non-object overrides', () => {
  const fields = [{ id: 'prompt', label: 'Prompt' }, { id: 'scale' }];
  const result = applyUiSchemaFieldOverrides(fields, {
    prompt: 'invalid',
    missing: { label: 'Missing' },
  });

  assert.deepEqual(result, fields);
  assert.equal(result[0], fields[0]);
  assert.equal(result[1], fields[1]);
});

test('applyUiSchemaFieldOverrides: returns an empty list for malformed input', () => {
  assert.deepEqual(applyUiSchemaFieldOverrides(null, {}), []);
  assert.deepEqual(applyUiSchemaFieldOverrides('field', null), []);
});
