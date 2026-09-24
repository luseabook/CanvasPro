import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePositiveNumber, normalizeStringArray, normalizeText } from './storyGenerationValues.js';

test('normalizeText stringifies and trims, mapping falsy values to empty string', () => {
  assert.equal(normalizeText('  a  '), 'a');
  assert.equal(normalizeText(12), '12');
  assert.equal(normalizeText(null), '');
  assert.equal(normalizeText(undefined), '');
  assert.equal(normalizeText(0), '');
});

test('normalizeStringArray trims, drops empties and de-duplicates in order', () => {
  assert.deepEqual(normalizeStringArray(['a', ' a ', '', null, 'b', 'a']), ['a', 'b']);
  assert.deepEqual(normalizeStringArray([]), []);
});

test('normalizeStringArray returns an empty array for non-arrays', () => {
  assert.deepEqual(normalizeStringArray('a,b'), []);
  assert.deepEqual(normalizeStringArray(null), []);
  assert.deepEqual(normalizeStringArray({ 0: 'a', length: 1 }), []);
});

test('normalizePositiveNumber keeps finite positive numbers and zeroes the rest', () => {
  assert.equal(normalizePositiveNumber('3.5'), 3.5);
  assert.equal(normalizePositiveNumber(7), 7);
  assert.equal(normalizePositiveNumber(0), 0);
  assert.equal(normalizePositiveNumber(-1), 0);
  assert.equal(normalizePositiveNumber('abc'), 0);
  assert.equal(normalizePositiveNumber(Infinity), 0);
  assert.equal(normalizePositiveNumber(null), 0);
});
