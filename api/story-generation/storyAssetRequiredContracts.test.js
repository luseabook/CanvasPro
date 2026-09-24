import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createStoryAssetRequiredContractsByKind,
  lockStoryAssetRequiredSourceChapterIds,
} from './storyAssetRequiredContracts.js';

test('defaults produce empty lists for every asset kind', () => {
  assert.deepEqual(createStoryAssetRequiredContractsByKind(), { character: [], scene: [], prop: [] });
});

test('character contracts combine evidence refs, chapter ids, role and traits', () => {
  const result = createStoryAssetRequiredContractsByKind({
    project: { characters: [{ name: '张三', roleType: 'protagonist', fixedTraits: ['黑发', '高个'] }] },
    requirementEvidence: {
      hardRequired: [{ kind: 'character', name: '张三', sourceSceneRefs: ['s1', 's2'] }],
    },
    sourceScenes: [
      { ref: 's1', episodeRef: 'e1' },
      { ref: 's2', episodeRef: 'e1' },
    ],
    requiredAssetNamesByKind: { character: ['张三', ' 张三 '] },
  });
  assert.deepEqual(result.character, [
    {
      name: '张三',
      sourceSceneRefs: ['s1', 's2'],
      sourceChapterIds: ['e1'],
      role: '主角',
      fixedTraits: '黑发、高个',
    },
  ]);
  assert.deepEqual(result.scene, []);
  assert.deepEqual(result.prop, []);
});

test('hardSourceSceneRefs take precedence over sourceSceneRefs', () => {
  const result = createStoryAssetRequiredContractsByKind({
    requirementEvidence: {
      hardRequired: [{ kind: 'prop', name: '长剑', hardSourceSceneRefs: ['h1'], sourceSceneRefs: ['s1'] }],
    },
    requiredAssetNamesByKind: { prop: ['长 剑'] },
  });
  assert.deepEqual(result.prop, [{ name: '长 剑', sourceSceneRefs: ['h1'], sourceChapterIds: [] }]);
});

test('parenthetical notes are ignored for exact matches', () => {
  const result = createStoryAssetRequiredContractsByKind({
    requirementEvidence: {
      hardRequired: [
        { kind: 'character', name: '张三（少年）', sourceSceneRefs: ['s1'] },
        { kind: 'character', name: '房东张三', sourceSceneRefs: ['s9'] },
      ],
    },
    requiredAssetNamesByKind: { character: ['张三'] },
  });
  assert.deepEqual(result.character[0].sourceSceneRefs, ['s1']);
});

test('character aliases strip occupational prefixes for fuzzy matches', () => {
  const result = createStoryAssetRequiredContractsByKind({
    requirementEvidence: { hardRequired: [{ kind: 'character', name: '房东王姐', sourceSceneRefs: ['s3'] }] },
    requiredAssetNamesByKind: { character: ['王姐'] },
  });
  assert.deepEqual(result.character, [
    { name: '王姐', sourceSceneRefs: ['s3'], sourceChapterIds: [], role: '配角' },
  ]);
});

test('scene names fall back to identity-key containment', () => {
  const result = createStoryAssetRequiredContractsByKind({
    requirementEvidence: {
      hardRequired: [{ kind: 'scene', name: '日 内 张三的客厅', sourceSceneRefs: ['s3'] }],
    },
    sourceScenes: [{ ref: 's3', episodeRef: 'e2' }],
    requiredAssetNamesByKind: { scene: ['客厅'] },
  });
  assert.deepEqual(result.scene, [{ name: '客厅', sourceSceneRefs: ['s3'], sourceChapterIds: ['e2'] }]);
});

test('evidence of another kind is never used', () => {
  const result = createStoryAssetRequiredContractsByKind({
    requirementEvidence: { hardRequired: [{ kind: 'prop', name: '张三', sourceSceneRefs: ['s1'] }] },
    requiredAssetNamesByKind: { character: ['张三'] },
  });
  assert.deepEqual(result.character[0].sourceSceneRefs, []);
});

test('character roles are normalized and traits truncated to 160 characters', () => {
  const characters = [
    { name: '甲', roleType: 'villain' },
    { name: '乙', role: 'extra' },
    { name: '丙', role: 'hero' },
    { name: '丁', roleType: '导师', fixedTraits: '长'.repeat(200) },
  ];
  const result = createStoryAssetRequiredContractsByKind({
    project: { characters },
    requiredAssetNamesByKind: { character: ['甲', '乙', '丙', '丁'] },
  });
  assert.deepEqual(
    result.character.map((item) => item.role),
    ['反派', '路人', '主角', '配角'],
  );
  assert.equal(result.character[3].fixedTraits.length, 160);
  assert.equal('fixedTraits' in result.character[0], false);
});

test('lock returns a copy with an empty asset list when assets are missing', () => {
  const input = { title: 'x' };
  const result = lockStoryAssetRequiredSourceChapterIds(input);
  assert.deepEqual(result, { title: 'x', assets: [] });
  assert.notEqual(result, input);
});

test('lock overwrites chapter ids and role from exactly matching contracts', () => {
  const result = lockStoryAssetRequiredSourceChapterIds(
    {
      other: 1,
      assets: [
        { kind: 'character', name: '张三', role: '配角', sourceChapterIds: ['x'], appearances: [{ id: 1 }] },
      ],
    },
    { character: [{ name: '张三', role: '主角', sourceChapterIds: ['e1'] }] },
    { character: [{ name: '张三', role: '配角', sourceChapterIds: ['e2', 'e1'] }] },
  );
  assert.deepEqual(result, {
    other: 1,
    assets: [
      {
        kind: 'character',
        name: '张三',
        role: '主角',
        sourceChapterIds: ['e1', 'e2'],
        appearances: [{ id: 1, sourceChapterIds: ['e1', 'e2'] }],
      },
    ],
  });
});

test('lock ignores roles outside the allowed set', () => {
  const [asset] = lockStoryAssetRequiredSourceChapterIds(
    { assets: [{ kind: 'character', name: '张三', role: '配角' }] },
    { character: [{ name: '张三', role: 'boss', sourceChapterIds: ['e1'] }] },
  ).assets;
  assert.deepEqual(asset, {
    kind: 'character',
    name: '张三',
    role: '配角',
    sourceChapterIds: ['e1'],
    appearances: [],
  });
});

test('lock keeps assets by reference when nothing usable matches', () => {
  const unmatched = { kind: 'prop', name: '盾' };
  const noChapters = { kind: 'prop', name: '剑' };
  const result = lockStoryAssetRequiredSourceChapterIds(
    { assets: [unmatched, noChapters] },
    { prop: [{ name: '剑', sourceChapterIds: [] }] },
  );
  assert.equal(result.assets[0], unmatched);
  assert.equal(result.assets[1], noChapters);
});

test('lock refuses ambiguous fuzzy scene matches', () => {
  const asset = { kind: 'scene', name: '客厅' };
  const contracts = {
    scene: [
      { name: '张三的客厅', sourceChapterIds: ['e1'] },
      { name: '李四的客厅', sourceChapterIds: ['e2'] },
    ],
  };
  assert.equal(lockStoryAssetRequiredSourceChapterIds({ assets: [asset] }, contracts).assets[0], asset);
  const single = lockStoryAssetRequiredSourceChapterIds({ assets: [asset] }, { scene: [contracts.scene[0]] });
  assert.deepEqual(single.assets[0], {
    kind: 'scene',
    name: '客厅',
    sourceChapterIds: ['e1'],
    appearances: [],
  });
});
