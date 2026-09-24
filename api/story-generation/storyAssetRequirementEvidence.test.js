import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORY_ASSET_REQUIREMENT_EVIDENCE_SCHEMA_VERSION,
  createStoryAssetActionPropCandidates,
  createStoryAssetRequirementEvidencePlan,
  getHardRequiredStoryAssetNames,
  getHardRequiredStorySceneRefs,
  getHardRequiredStoryAssetNamesForScene,
  createStoryAssetOptionalCandidatesByKind,
  createStoryAssetOptionalCandidateNamesByKind,
  getUntrustedUploadFallbackStoryCharacterNames,
  isNarrativeStoryCharacterFragment,
} from './storyAssetRequirementEvidence.js';

const PLAN_SCENES = [
  {
    ref: 's1',
    episodeRef: 'e1',
    heading: '客厅',
    characters: ['张三', '李四', ' '],
    body: '第一集：《雨夜》\n张三翻开《密约》逐页核对。墙上挂着《星空》。',
    localEntityCandidates: { character: ['王五'], scene: ['天台'], prop: ['手电筒'] },
  },
  {
    ref: 's2',
    episodeRef: 'e2',
    heading: '客厅',
    source: 'upload-fallback',
    characters: ['赵六'],
    body: '王五走上天台，手电筒亮着。',
    localEntityCandidates: { character: ['王五', '忽然转身的人', '无'], prop: ['手电筒', '编号-1'] },
  },
];

test('schema version is 1', () => {
  assert.equal(STORY_ASSET_REQUIREMENT_EVIDENCE_SCHEMA_VERSION, 1);
});

test('action prop candidates come from direct-object and 把/将 phrases', () => {
  const result = createStoryAssetActionPropCandidates([
    {
      ref: 's1',
      episodeRef: 'e1',
      body: '张三从口袋里掏出一把钥匙，然后把《密约》交给李四。他拿起了手机看了一眼。',
    },
    { ref: 's2', episodeRef: 'e2', body: '李四取出钥匙。王五握住他的手。' },
    { ref: '', body: '取出钥匙' },
    { ref: 's3' },
  ]);
  assert.deepEqual(
    result.map((item) => [item.name, item.sourceSceneRefs, item.sourceChapterIds, item.confidence]),
    [
      ['钥匙', ['s1', 's2'], ['e1', 'e2'], 1],
      ['密约', ['s1'], ['e1'], 1],
      ['手机', ['s1'], ['e1'], 1],
    ],
  );
  assert.equal(
    result[0].evidence,
    '张三从口袋里掏出一把钥匙，然后把《密约》交给李四。他拿起了手机看了一眼。',
  );
  assert.deepEqual(createStoryAssetActionPropCandidates('bad'), []);
});

test('action prop candidates keep a known demonstrative remainder', () => {
  const [candidate] = createStoryAssetActionPropCandidates([{ ref: 's', body: '她拿起这些材料。' }]);
  assert.equal(candidate.name, '些材料');
});

test('the evidence plan tiers headings, cast, local candidates and quoted titles', () => {
  const plan = createStoryAssetRequirementEvidencePlan(PLAN_SCENES);
  assert.equal(plan.schemaVersion, 1);
  const summarize = (entries) =>
    entries.map((entry) => [entry.kind, entry.name, entry.reasonCodes.join('+')]);
  assert.deepEqual(summarize(plan.hardRequired), [
    ['scene', '客厅', 'structured-scene-heading+upload-fallback-heading'],
    ['character', '张三', 'structured-scene-character'],
    ['character', '李四', 'structured-scene-character'],
    ['prop', '密约', 'physical-prop-context'],
  ]);
  assert.deepEqual(summarize(plan.optionalCandidates), [
    ['prop', '星空', 'quoted-title-candidate'],
    ['character', '赵六', 'upload-fallback-imported-character'],
    ['character', '王五', 'verified-local-entity-candidate'],
    ['prop', '手电筒', 'verified-local-entity-candidate'],
  ]);
  assert.deepEqual(summarize(plan.ignored), [['prop', '雨夜', 'structural-story-title']]);
  const livingRoom = plan.hardRequired[0];
  assert.equal(livingRoom.tier, 'hard-required');
  assert.deepEqual(livingRoom.sourceSceneRefs, ['s1', 's2']);
  assert.deepEqual(livingRoom.hardSourceSceneRefs, ['s1']);
  assert.deepEqual(livingRoom.optionalSourceSceneRefs, ['s2']);
  assert.deepEqual(plan.hardRequired[3].contexts, [
    '第一集：《雨夜》\n张三翻开《密约》逐页核对。墙上挂着《星空》。',
  ]);
});

test('the evidence plan tolerates empty input', () => {
  assert.deepEqual(createStoryAssetRequirementEvidencePlan(), {
    schemaVersion: 1,
    hardRequired: [],
    optionalCandidates: [],
    ignored: [],
  });
  assert.deepEqual(createStoryAssetRequirementEvidencePlan('bad').hardRequired, []);
});

test('hard-required getters filter by kind and scene', () => {
  const plan = createStoryAssetRequirementEvidencePlan(PLAN_SCENES);
  assert.deepEqual(getHardRequiredStoryAssetNames(plan, 'prop'), ['密约']);
  assert.deepEqual(getHardRequiredStoryAssetNames(plan, 'character'), ['张三', '李四']);
  assert.deepEqual(getHardRequiredStoryAssetNames(), []);
  assert.deepEqual(getHardRequiredStorySceneRefs(plan), ['s1']);
  assert.deepEqual(getHardRequiredStoryAssetNamesForScene(plan, 'character', ' s1 '), ['张三', '李四']);
  assert.deepEqual(getHardRequiredStoryAssetNamesForScene(plan, 'scene', 's2'), []);
  assert.deepEqual(getHardRequiredStoryAssetNamesForScene(plan, 'character', ''), []);
});

test('scene getters fall back to sourceSceneRefs without hard refs', () => {
  const plan = { hardRequired: [{ kind: 'scene', name: '街道', sourceSceneRefs: ['x1'] }] };
  assert.deepEqual(getHardRequiredStorySceneRefs(plan), ['x1']);
  assert.deepEqual(getHardRequiredStoryAssetNamesForScene(plan, 'scene', 'x1'), ['街道']);
});

test('optional candidates need usable names and evidence in the source text', () => {
  assert.deepEqual(createStoryAssetOptionalCandidatesByKind(PLAN_SCENES), {
    character: [
      {
        name: '王五',
        evidence: '王五走上天台，手电筒亮着。',
        sourceSceneRefs: ['s2'],
        sourceChapterIds: ['e2'],
      },
    ],
    scene: [],
    prop: [
      {
        name: '手电筒',
        evidence: '王五走上天台，手电筒亮着。',
        sourceSceneRefs: ['s2'],
        sourceChapterIds: ['e2'],
      },
    ],
  });
  assert.deepEqual(createStoryAssetOptionalCandidateNamesByKind(PLAN_SCENES), {
    character: ['王五'],
    scene: [],
    prop: ['手电筒'],
  });
  assert.deepEqual(createStoryAssetOptionalCandidateNamesByKind(), { character: [], scene: [], prop: [] });
});

test('local candidate evidence can come from a separate source scene', () => {
  const summary = [{ ref: 'x', body: 'PP-UIE 本地候选：钥匙', localEntityCandidates: { prop: ['钥匙'] } }];
  assert.deepEqual(
    createStoryAssetOptionalCandidatesByKind(summary, [{ ref: 'x', episodeRef: 'E', body: '原文里有钥匙' }])
      .prop,
    [{ name: '钥匙', evidence: '原文里有钥匙', sourceSceneRefs: ['x'], sourceChapterIds: ['E'] }],
  );
});

function makeScenes(count, perScene) {
  return Array.from({ length: count }, (_, index) => {
    const ref = 's' + (index + 1);
    const names = perScene.map((suffix) => '物品' + ref + suffix);
    return {
      ref,
      episodeRef: 'ep-' + ref,
      body: names.join('，') + '。',
      localEntityCandidates: { prop: names },
    };
  });
}

test('item budgets pick scenes anchor-first, then round-robin', () => {
  const scenes = makeScenes(5, ['甲', '乙']);
  const names = (options) =>
    createStoryAssetOptionalCandidatesByKind(scenes, scenes, options).prop.map((item) => item.name);
  assert.equal(names().length, 10);
  assert.deepEqual(names({ maxItemsPerKind: 3 }), ['物品s1甲', '物品s3甲', '物品s5甲']);
  assert.deepEqual(names({ maxItemsPerKind: 7 }), [
    '物品s1甲',
    '物品s3甲',
    '物品s5甲',
    '物品s2甲',
    '物品s4甲',
    '物品s1乙',
    '物品s3乙',
  ]);
});

test('character budgets count the serialized candidate size', () => {
  const scenes = makeScenes(2, ['甲']);
  const all = createStoryAssetOptionalCandidatesByKind(scenes, scenes, { maxItemsPerKind: 1 }).prop;
  const size = JSON.stringify({ kind: 'prop', ...all[0] }).length;
  assert.equal(
    createStoryAssetOptionalCandidatesByKind(scenes, scenes, { maxCharactersPerKind: size + 1 }).prop.length,
    0,
  );
  assert.equal(
    createStoryAssetOptionalCandidatesByKind(scenes, scenes, { maxCharactersPerKind: size + 2 }).prop.length,
    1,
  );
});

test('repeated candidates keep at most three fairly spread scene refs', () => {
  const scenes = ['r1', 'r2', 'r3', 'r4', 'r5'].map((ref) => ({
    ref,
    episodeRef: 'ep-' + ref,
    body: '钥匙。',
    localEntityCandidates: { prop: ['钥匙'] },
  }));
  assert.deepEqual(createStoryAssetOptionalCandidatesByKind(scenes).prop, [
    {
      name: '钥匙',
      evidence: '钥匙。',
      sourceSceneRefs: ['r1', 'r3', 'r5'],
      sourceChapterIds: ['ep-r1', 'ep-r3', 'ep-r5'],
    },
  ]);
});

const CROSS = [
  {
    ref: 'a',
    episodeRef: 'e',
    body: '青龙出现了。白虎来了。',
    localEntityCandidates: { character: ['青龙', '白虎'], prop: ['青龙', '白虎'] },
    localEntityEvidence: [
      { kind: 'character', text: '青龙', probability: 0.9 },
      { kind: 'prop', text: '青龙', probability: 0.7 },
      { kind: 'character', text: '白虎', probability: 0.8 },
      { kind: 'prop', text: '白虎', probability: 0.7 },
    ],
  },
];

test('names claimed by several kinds need a confident winner', () => {
  assert.deepEqual(createStoryAssetOptionalCandidateNamesByKind(CROSS), {
    character: ['青龙'],
    scene: [],
    prop: [],
  });
});

test('hard-required kinds override cross-kind conflicts', () => {
  const result = createStoryAssetOptionalCandidatesByKind(CROSS, CROSS, {
    hardRequiredAssetNamesByKind: { prop: ['白虎'] },
  });
  assert.deepEqual(
    result.character.map((item) => item.name),
    ['青龙'],
  );
  assert.deepEqual(
    result.prop.map((item) => item.name),
    ['白虎'],
  );
  const heading = [
    {
      ref: 'h',
      heading: '青龙',
      body: '青龙出现了。',
      localEntityCandidates: { character: ['青龙'], scene: ['青龙'] },
    },
  ];
  assert.deepEqual(createStoryAssetOptionalCandidateNamesByKind(heading), {
    character: [],
    scene: ['青龙'],
    prop: [],
  });
});

test('untrusted upload-fallback characters exclude corroborated names', () => {
  const scenes = [
    {
      ref: 'u1',
      source: 'upload-fallback',
      characters: ['赵六', '王五', '张三'],
      body: '王五来了。',
      localEntityCandidates: { character: ['王五'] },
    },
    { ref: 'u2', characters: ['张三'], body: '张三在。' },
  ];
  const plan = createStoryAssetRequirementEvidencePlan(scenes);
  assert.deepEqual(getUntrustedUploadFallbackStoryCharacterNames(plan, scenes), ['赵六']);
  assert.deepEqual(getUntrustedUploadFallbackStoryCharacterNames(), []);
});

test('narrative fragments are long or contain action words', () => {
  assert.equal(isNarrativeStoryCharacterFragment('张三'), false);
  assert.equal(isNarrativeStoryCharacterFragment('他缓缓'), true);
  assert.equal(isNarrativeStoryCharacterFragment('一二三四五六七八九'), true);
  assert.equal(isNarrativeStoryCharacterFragment(), false);
});
