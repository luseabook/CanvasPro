import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION,
  createStoryAssetContractClientKey,
  createStoryAssetPromptContracts,
  createStoryAssetExtractionStructuredOutput,
} from './storyAssetExtractionRequest.js';

test('compact response schema version is 2', () => {
  assert.equal(STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION, 2);
});

test('client keys match independently computed FNV-1a vectors', () => {
  assert.equal(
    createStoryAssetContractClientKey({ kind: 'character', tier: 'required', name: 'Alice' }),
    'cr-bcbbca2d',
  );
  assert.equal(
    createStoryAssetContractClientKey({
      kind: 'scene',
      tier: 'optional',
      name: '客厅',
      sourceSceneRefs: ['s2', 's1'],
    }),
    'so-49cc41e3',
  );
  assert.equal(createStoryAssetContractClientKey(), 'ao-e37ed925');
});

test('client keys ignore whitespace, punctuation, case, width and ref order', () => {
  const base = createStoryAssetContractClientKey({
    kind: 'prop',
    tier: 'required',
    name: 'Magic Sword',
    sourceSceneRefs: ['s1', 's2'],
  });
  assert.match(base, /^pr-[0-9a-f]{8}$/);
  assert.equal(
    createStoryAssetContractClientKey({
      kind: ' prop ',
      tier: 'required',
      name: ' ＭＡＧＩＣ-sword! ',
      sourceSceneRefs: ['s2', ' s1 ', 's1', ''],
    }),
    base,
  );
});

test('any tier other than required is optional', () => {
  const optional = createStoryAssetContractClientKey({ kind: 'prop', tier: 'optional', name: 'x' });
  assert.match(optional, /^po-/);
  assert.equal(createStoryAssetContractClientKey({ kind: 'prop', tier: 'weird', name: 'x' }), optional);
  assert.notEqual(
    createStoryAssetContractClientKey({ kind: 'prop', tier: 'required', name: 'x' }).slice(3),
    optional.slice(3),
  );
});

test('prompt contracts are empty without names or candidates', () => {
  assert.deepEqual(createStoryAssetPromptContracts(), { payload: {}, requirements: [] });
  assert.deepEqual(createStoryAssetPromptContracts(['character'], {}, {}), { payload: {}, requirements: [] });
});

test('required assets are deduplicated per requested kind', () => {
  const result = createStoryAssetPromptContracts(['character'], {
    character: ['张三', ' 张三 ', '李四', ''],
    scene: ['客厅'],
  });
  assert.deepEqual(result.payload, {
    requiredAssets: [
      { kind: 'character', name: '张三' },
      { kind: 'character', name: '李四' },
    ],
  });
  assert.equal(result.requirements.length, 1);
  assert.ok(result.requirements[0].startsWith('requiredAssets 是由剧本结构确定的最低覆盖清单'));
});

test('client keys and details are attached only when requested', () => {
  const details = {
    character: [
      { name: '张三', sourceSceneRefs: ['s1'], sourceChapterIds: ['c1'], role: '主角', fixedTraits: '红衣' },
    ],
    scene: [{ name: '客厅', sourceSceneRefs: ['s1'], role: '主角', fixedTraits: '暖光' }],
  };
  const result = createStoryAssetPromptContracts(
    ['character', 'scene'],
    { character: ['张三'], scene: ['客厅'] },
    null,
    details,
    { includeClientKeys: true },
  );
  assert.deepEqual(result.payload.requiredAssets, [
    {
      kind: 'character',
      name: '张三',
      clientKey: createStoryAssetContractClientKey({
        kind: 'character',
        tier: 'required',
        name: '张三',
        sourceSceneRefs: ['s1'],
      }),
      sourceSceneRefs: ['s1'],
      sourceChapterIds: ['c1'],
      role: '主角',
      fixedTraits: '红衣',
    },
    {
      kind: 'scene',
      name: '客厅',
      clientKey: createStoryAssetContractClientKey({
        kind: 'scene',
        tier: 'required',
        name: '客厅',
        sourceSceneRefs: ['s1'],
      }),
      sourceSceneRefs: ['s1'],
    },
  ]);
  const plain = createStoryAssetPromptContracts(['character'], { character: ['张三'] }, null, details);
  assert.deepEqual(plain.payload.requiredAssets, [{ kind: 'character', name: '张三' }]);
});

test('candidates keep the first entry per name and cap refs at three', () => {
  const result = createStoryAssetPromptContracts(['prop'], null, {
    prop: [
      '剑',
      { name: '剑', evidence: '重复' },
      { name: '盾', evidence: ' 他举起盾 ', sourceSceneRefs: ['a', 'b', 'c', 'd'], sourceChapterIds: ['c1'] },
      '',
      null,
      { name: '  ' },
    ],
  });
  assert.deepEqual(result.payload, {
    candidateAssets: [
      { kind: 'prop', name: '剑' },
      {
        kind: 'prop',
        name: '盾',
        evidence: '他举起盾',
        sourceSceneRefs: ['a', 'b', 'c'],
        sourceChapterIds: ['c1'],
      },
    ],
  });
  assert.equal(result.requirements.length, 1);
  assert.ok(result.requirements[0].startsWith('candidateAssets 只是本地召回线索'));
});

test('candidate client keys use the optional tier', () => {
  const result = createStoryAssetPromptContracts(
    ['prop'],
    null,
    { prop: [{ name: '剑', sourceSceneRefs: ['s1'] }] },
    null,
    {
      includeClientKeys: true,
    },
  );
  assert.equal(
    result.payload.candidateAssets[0].clientKey,
    createStoryAssetContractClientKey({
      kind: 'prop',
      tier: 'optional',
      name: '剑',
      sourceSceneRefs: ['s1'],
    }),
  );
});

test('required and candidate requirements are listed in that order', () => {
  const result = createStoryAssetPromptContracts(['prop'], { prop: ['剑'] }, { prop: ['剑'] }, null, {
    includeClientKeys: true,
  });
  assert.deepEqual(Object.keys(result.payload), ['requiredAssets', 'candidateAssets']);
  assert.equal(result.requirements.length, 2);
  assert.ok(result.requirements[0].startsWith('requiredAssets'));
  assert.ok(result.requirements[1].startsWith('candidateAssets'));
});

test('colliding client keys stop before any API call', () => {
  const candidates = { prop: ['长剑', '长 剑'] };
  assert.throws(
    () => createStoryAssetPromptContracts(['prop'], null, candidates, null, { includeClientKeys: true }),
    {
      message: '资产合同生成了重复 clientKey，已在调用 API 前安全停止。',
    },
  );
  assert.equal(createStoryAssetPromptContracts(['prop'], null, candidates).payload.candidateAssets.length, 2);
});

test('structured output defaults to the detailed schema with prompt fallback', () => {
  assert.deepEqual(createStoryAssetExtractionStructuredOutput(), {
    name: 'story_asset_all_detailed_v2',
    schema: undefined,
    strict: true,
    fallback: 'prompt',
  });
});

test('structured output names compact schemas by kind and version', () => {
  const schema = { type: 'object' };
  const result = createStoryAssetExtractionStructuredOutput({
    assetKinds: ['character', ' scene ', 'character'],
    schema,
    fallback: 'none',
    mode: 'compact',
  });
  assert.deepEqual(result, {
    name: 'story_asset_character_scene_compact_v2',
    schema,
    strict: true,
    fallback: 'none',
  });
  assert.equal(result.schema, schema);
  assert.equal(createStoryAssetExtractionStructuredOutput({ fallback: 'other' }).fallback, 'prompt');
});
