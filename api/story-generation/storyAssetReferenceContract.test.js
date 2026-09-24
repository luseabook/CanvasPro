import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveStoryGenerationAssetRef,
  resolveStoryGenerationAppearanceRef,
  normalizeStoryGenerationAssetReferences,
  STORY_ASSET_REFERENCE_RULES,
  buildStoryAssetReferenceContract,
} from './storyAssetReferenceContract.js';

test('asset refs prefer ref, then planningRef, then id, then a positional fallback', () => {
  assert.equal(
    resolveStoryGenerationAssetRef({ ref: ' hero  one ', planningRef: 'p', id: 'i' }, 0),
    'hero-one',
  );
  assert.equal(resolveStoryGenerationAssetRef({ planningRef: 'p', id: 'i' }, 0), 'p');
  assert.equal(resolveStoryGenerationAssetRef({ id: 'i' }, 0), 'i');
  assert.equal(resolveStoryGenerationAssetRef({}, 2), 'asset-3');
  assert.equal(resolveStoryGenerationAssetRef(), 'asset-1');
});

test('appearance refs prefer planningRef, then ref, then id, else empty', () => {
  assert.equal(resolveStoryGenerationAppearanceRef({ planningRef: 'p 1', ref: 'r', id: 'i' }), 'p-1');
  assert.equal(resolveStoryGenerationAppearanceRef({ ref: 'r', id: 'i' }), 'r');
  assert.equal(resolveStoryGenerationAppearanceRef({ id: 'i' }), 'i');
  assert.equal(resolveStoryGenerationAppearanceRef({}), '');
  assert.equal(resolveStoryGenerationAppearanceRef(null), '');
});

test('normalizeStoryGenerationAssetReferences rewrites refs without mutating input', () => {
  const assets = [
    { ref: 'a b', name: '张三', appearances: [{ ref: 'x y', prompt: 'p' }, {}] },
    { id: 'prop-1', appearances: 'bad' },
    { name: '无引用' },
  ];
  const result = normalizeStoryGenerationAssetReferences(assets);
  assert.deepEqual(result, [
    { ref: 'a-b', name: '张三', appearances: [{ ref: 'x-y', prompt: 'p' }, { ref: '' }] },
    { id: 'prop-1', ref: 'prop-1', appearances: [] },
    { name: '无引用', ref: 'asset-3', appearances: [] },
  ]);
  assert.equal(assets[0].ref, 'a b');
  assert.equal(assets[0].appearances[1].ref, undefined);
  assert.deepEqual(normalizeStoryGenerationAssetReferences(null), []);
  assert.deepEqual(normalizeStoryGenerationAssetReferences(), []);
});

test('reference rules are three prompt strings', () => {
  assert.equal(STORY_ASSET_REFERENCE_RULES.length, 3);
  assert.ok(STORY_ASSET_REFERENCE_RULES[0].startsWith('assetRef 必须逐字使用 assets 中的 ref'));
  assert.ok(STORY_ASSET_REFERENCE_RULES[1].includes('appearanceRef 必须是空字符串'));
});

test('buildStoryAssetReferenceContract lists allowed appearance refs per asset', () => {
  assert.deepEqual(
    buildStoryAssetReferenceContract([
      { ref: 'a', appearances: [{ ref: 'a1' }, {}] },
      { ref: 'b', appearances: [] },
      { ref: null },
    ]),
    [
      { assetRef: 'a', allowedAppearanceRefs: ['a1', ''] },
      { assetRef: 'b', allowedAppearanceRefs: [''] },
      { assetRef: '', allowedAppearanceRefs: [''] },
    ],
  );
  assert.deepEqual(buildStoryAssetReferenceContract(), []);
});

test('buildStoryAssetReferenceContract requires an array when a value is passed', () => {
  assert.throws(() => buildStoryAssetReferenceContract(null), TypeError);
});
