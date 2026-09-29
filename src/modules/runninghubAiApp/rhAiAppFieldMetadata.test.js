import test from 'node:test';
import assert from 'node:assert/strict';
import { getRunningHubFieldOptions, inferRunningHubFieldMetadata } from './rhAiAppFieldMetadata.js';

test('getRunningHubFieldOptions ignores any field that is not a LIST', () => {
  assert.deepEqual(getRunningHubFieldOptions({ fieldType: 'IMAGE' }), []);
  assert.deepEqual(getRunningHubFieldOptions({ fieldType: 'list', fieldData: [] }), []);
  assert.deepEqual(getRunningHubFieldOptions(), []);
});

test('getRunningHubFieldOptions parses a JSON string fieldData', () => {
  assert.deepEqual(
    getRunningHubFieldOptions({
      fieldType: 'LIST',
      fieldData: '[{"index":1,"name":"first"},{"index":2,"name":"second"}]',
    }),
    [
      { value: '1', label: 'first' },
      { value: '2', label: 'second' },
    ],
  );
});

test('getRunningHubFieldOptions drops malformed JSON instead of throwing', () => {
  assert.deepEqual(getRunningHubFieldOptions({ fieldType: 'LIST', fieldData: '{not json' }), []);
});

test('getRunningHubFieldOptions returns nothing when fieldData is not an array', () => {
  assert.deepEqual(getRunningHubFieldOptions({ fieldType: 'LIST', fieldData: '{"index":1}' }), []);
  assert.deepEqual(getRunningHubFieldOptions({ fieldType: 'LIST', fieldData: null }), []);
});

test('getRunningHubFieldOptions keeps only entries with an own usable index', () => {
  assert.deepEqual(
    getRunningHubFieldOptions({
      fieldType: 'LIST',
      fieldData: [
        { index: 'a', name: 'kept' },
        { index: 3 },
        { index: true, name: 'flag' },
        { index: null, name: 'null index' },
        { index: undefined, name: 'undefined index' },
        { name: 'missing index' },
        { notExisting: 'x', name: 'no index' },
        null,
      ],
    }),
    [
      { value: 'a', label: 'kept' },
      { value: '3', label: '3' },
      { value: 'true', label: 'flag' },
    ],
  );
});

test('getRunningHubFieldOptions falls back to the index when name is absent', () => {
  assert.deepEqual(getRunningHubFieldOptions({ fieldType: 'LIST', fieldData: [{ index: 0 }] }), [
    { value: '0', label: '0' },
  ]);
  assert.deepEqual(getRunningHubFieldOptions({ fieldType: 'LIST', fieldData: [{ index: 7, name: '' }] }), [
    { value: '7', label: '' },
  ]);
});

test('inferRunningHubFieldMetadata locks a media kind for IMAGE, VIDEO and AUDIO', () => {
  assert.deepEqual(inferRunningHubFieldMetadata({ fieldType: 'IMAGE' }), {
    componentKind: 'image',
    componentKindLocked: true,
    componentKindOptions: ['image'],
    controlType: 'text',
    controlTypeLocked: true,
    controlTypeOptions: [],
  });
  assert.equal(inferRunningHubFieldMetadata({ fieldType: 'video' }).componentKind, 'video');
  assert.equal(inferRunningHubFieldMetadata({ fieldType: 'audio' }).componentKind, 'audio');
});

test('inferRunningHubFieldMetadata locks select for a LIST field with options', () => {
  assert.deepEqual(
    inferRunningHubFieldMetadata({ fieldType: 'LIST', fieldData: [{ index: 1, name: 'one' }] }),
    {
      componentKind: 'param',
      componentKindLocked: true,
      componentKindOptions: ['param'],
      controlType: 'select',
      controlTypeLocked: true,
      controlTypeOptions: ['select'],
    },
  );
});

test('inferRunningHubFieldMetadata returns null when nothing can be inferred', () => {
  assert.equal(inferRunningHubFieldMetadata({ fieldType: 'TEXT' }), null);
  assert.equal(inferRunningHubFieldMetadata({ fieldType: 'LIST', fieldData: [] }), null);
  assert.equal(inferRunningHubFieldMetadata(), null);
});
