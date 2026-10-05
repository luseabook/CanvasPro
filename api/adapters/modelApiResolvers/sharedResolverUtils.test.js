import test from 'node:test';
import assert from 'node:assert/strict';

import {
  appendUniqueUrl,
  isPresentValue,
  normalizeInputList,
  normalizeInputUrlsBySlot,
  normalizeKlingKeepOriginalSound,
  normalizeOptionalIntegerInRange,
  normalizePositiveInteger,
  replaceKlingO1PromptImageReferences,
  stripPrefix,
} from './sharedResolverUtils.js';

test('sharedResolverUtils: normalizes prefixes, values, integers, and lists', () => {
  assert.equal(stripPrefix('  gen_value  ', 'gen_'), 'value');
  assert.equal(stripPrefix('other', 'gen_'), 'other');
  assert.equal(isPresentValue(' x '), true);
  assert.equal(isPresentValue('   '), false);
  assert.equal(isPresentValue(null), false);
  assert.equal(normalizePositiveInteger('12px', 5), 12);
  assert.equal(normalizePositiveInteger('', 5), 5);
  assert.equal(normalizePositiveInteger('-1', 5), 5);
  assert.equal(normalizeOptionalIntegerInRange('9.8', { min: 1.2, max: 5.9 }), 5);
  assert.equal(normalizeOptionalIntegerInRange('', { min: 1, max: 5 }), null);
  assert.deepEqual(normalizeInputList([' a ', '', null, 'b']), ['a', 'b']);
});

test('sharedResolverUtils: normalizes slot maps and appends unique URLs', () => {
  assert.deepEqual(normalizeInputUrlsBySlot({ first: ' a ', empty: '', missing: null }), {
    first: 'a',
  });
  assert.deepEqual(normalizeInputUrlsBySlot(['not-an-object']), {});

  const urls = ['a'];
  appendUniqueUrl(urls, ' a ');
  appendUniqueUrl(urls, ' b ');
  assert.deepEqual(urls, ['a', 'b']);
});

test('sharedResolverUtils: normalizes Kling booleans and image references', () => {
  assert.equal(normalizeKlingKeepOriginalSound(true), true);
  assert.equal(normalizeKlingKeepOriginalSound(' YES '), true);
  assert.equal(normalizeKlingKeepOriginalSound('0'), false);
  assert.equal(normalizeKlingKeepOriginalSound(undefined), false);

  assert.equal(
    replaceKlingO1PromptImageReferences('图片1 and @图片2, 图片3, 图4', 3),
    '<<<image_1>>> and <<<image_2>>>, <<<image_3>>>, 图4',
  );
  assert.equal(replaceKlingO1PromptImageReferences('图1', 0), '图1');
});
