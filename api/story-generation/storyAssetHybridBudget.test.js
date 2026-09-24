import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORY_ASSET_EVIDENCE_BODY_MAX_CHARACTERS,
  STORY_ASSET_CANDIDATE_MAX_ITEMS_PER_KIND,
  STORY_ASSET_CANDIDATE_MAX_CHARACTERS_PER_KIND,
  STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
  createBudgetedStoryAssetEvidenceProject,
  createStoryAssetAuthoritativeSourceFingerprint,
  estimateStoryAssetFocusedOutputTokens,
  estimateStoryAssetCompactOutputTokens,
  resolveStoryAssetFocusedOutputMode,
  assertStoryAssetFocusedOutputCapacity,
} from './storyAssetHybridBudget.js';

const names = (count, prefix) => Array.from({ length: count }, (_, index) => prefix + index);
const candidates = (count, prefix, evidence = '') =>
  names(count, prefix).map((name) => ({
    name,
    evidence: evidence || '证据' + name,
    sourceSceneRefs: ['s1'],
    sourceChapterIds: ['e1'],
  }));

test('exposes the budget constants', () => {
  assert.equal(STORY_ASSET_EVIDENCE_BODY_MAX_CHARACTERS, 12000);
  assert.equal(STORY_ASSET_CANDIDATE_MAX_ITEMS_PER_KIND, 64);
  assert.equal(STORY_ASSET_CANDIDATE_MAX_CHARACTERS_PER_KIND, 8000);
  assert.equal(STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS, 16384);
});

test('source fingerprints are FNV-1a over the authoritative scene fields', () => {
  const scenes = [
    {
      ref: 'a',
      episodeRef: 'e1',
      source: 's',
      heading: '客厅',
      characters: ['张三', '李四'],
      body: '正文',
      ignored: 'x',
    },
    { ref: 'b', body: null },
  ];
  // Gold value computed by an independent Python FNV-1a over UTF-16 code units.
  assert.equal(createStoryAssetAuthoritativeSourceFingerprint(scenes), 'source-v1-2-13-debc6686');
  assert.equal(createStoryAssetAuthoritativeSourceFingerprint(), 'source-v1-0-0-811c9dc5');
  const changed = [{ ...scenes[0], body: '正文！' }, scenes[1]];
  assert.notEqual(createStoryAssetAuthoritativeSourceFingerprint(changed), 'source-v1-2-13-debc6686');
  assert.equal(
    createStoryAssetAuthoritativeSourceFingerprint([{ ...scenes[0], ignored: 'y' }, scenes[1]]),
    'source-v1-2-13-debc6686',
  );
});

test('output token estimates use per-kind rates', () => {
  assert.equal(
    estimateStoryAssetFocusedOutputTokens({
      kind: 'character',
      requiredAssetCount: 2,
      candidateAssetCount: 1,
    }),
    768 + 3 * 720,
  );
  assert.equal(estimateStoryAssetFocusedOutputTokens({ kind: 'prop', requiredAssetCount: 1 }), 768 + 420);
  assert.equal(
    estimateStoryAssetFocusedOutputTokens({ kind: 'bogus', requiredAssetCount: 1, candidateAssetCount: -3 }),
    768 + 480,
  );
  assert.equal(estimateStoryAssetFocusedOutputTokens(), 768);
  assert.equal(
    estimateStoryAssetCompactOutputTokens({
      kind: 'character',
      requiredAssetCount: 2,
      candidateAssetCount: 1,
    }),
    128 + 3 * 768,
  );
  assert.equal(
    estimateStoryAssetCompactOutputTokens({ kind: 'prop', candidateAssetCount: 2.9 }),
    128 + 2 * 512,
  );
  assert.equal(estimateStoryAssetCompactOutputTokens({ kind: 'bogus', requiredAssetCount: 1 }), 128 + 576);
});

test('small lanes stay verbose and candidates are deduplicated against required names', () => {
  const result = resolveStoryAssetFocusedOutputMode({
    requiredAssetNamesByKind: { scene: ['卧室'], prop: [] },
    candidateAssetsByKind: {
      scene: ['客厅', '客 厅!', { name: '卧室' }, '', { name: '书房' }],
      prop: [{ name: '钥匙' }],
    },
  });
  assert.equal(result.mode, 'verbose');
  assert.deepEqual(result.modeByKind, { character: 'verbose', scene: 'verbose', prop: 'verbose' });
  assert.deepEqual(result.candidateAssetsByKind, {
    character: [],
    scene: ['客厅', { name: '书房' }],
    prop: [{ name: '钥匙' }],
  });
  assert.deepEqual(result.laneDetails[1], {
    kind: 'scene',
    requiredAssetCount: 1,
    candidateAssetCount: 2,
    verboseOutputTokens: 768 + 3 * 480,
    compactOutputTokens: 128 + 3 * 576,
    mode: 'verbose',
    selectedCandidateAssetCount: 2,
  });
  assert.equal(result.maxOutputTokens, 16384);
  assert.equal(result.verboseSafeMaximum, 13107);
  assert.equal(result.verboseMaxItemsPerKind, 16);
  assert.equal(result.compactSafeMaximum, 13107);
});

test('oversized lanes switch to compact with a fair candidate subset', () => {
  const pool = candidates(10, '候选');
  const result = resolveStoryAssetFocusedOutputMode({
    requiredAssetNamesByKind: { character: names(10, '角色') },
    candidateAssetsByKind: { character: pool },
  });
  assert.equal(result.mode, 'mixed');
  assert.equal(result.modeByKind.character, 'compact');
  assert.deepEqual(
    result.candidateAssetsByKind.character.map((item) => pool.indexOf(item)),
    [0, 4, 9, 2, 6, 1],
  );
  assert.deepEqual(result.laneDetails[0], {
    kind: 'character',
    requiredAssetCount: 10,
    candidateAssetCount: 10,
    verboseOutputTokens: 768 + 20 * 720,
    compactOutputTokens: 128 + 16 * 768,
    mode: 'compact',
    selectedCandidateAssetCount: 6,
  });
});

test('compact candidate selection also respects the serialized contract budget', () => {
  const result = resolveStoryAssetFocusedOutputMode({
    candidateAssetsByKind: { prop: candidates(40, '道具', '很长的证据'.repeat(60)) },
  });
  assert.equal(result.modeByKind.prop, 'compact');
  // Token budget alone would allow floor((13107 - 128) / 512) = 25 candidates.
  assert.equal(result.laneDetails[2].selectedCandidateAssetCount, 19);
  assert.equal(result.candidateAssetsByKind.prop.length, 19);
});

test('lanes whose required assets exceed compact capacity stop before the API call', () => {
  assert.throws(
    () => resolveStoryAssetFocusedOutputMode({ requiredAssetNamesByKind: { character: names(20, '角色') } }),
    (error) => {
      assert.equal(
        error.message,
        'character 资产即使使用紧凑输出仍预计需要 15488 tokens，超过单次输出容量 13107 的安全预算；已在调用 API 前安全停止。',
      );
      assert.equal(error.type, 'ASSET_OUTPUT_CAPACITY');
      assert.deepEqual(error.capacityDetails, {
        kind: 'character',
        requiredAssetCount: 20,
        candidateAssetCount: 0,
        estimatedOutputTokens: 15488,
        verboseEstimatedOutputTokens: 15168,
        maxOutputTokens: 16384,
        compactSafeMaximum: 13107,
        attemptedMode: 'compact',
      });
      return true;
    },
  );
});

test('a smaller output limit moves only lanes above the verbose safe maximum', () => {
  const result = resolveStoryAssetFocusedOutputMode({
    requiredAssetNamesByKind: { scene: ['客厅'] },
    maxOutputTokens: 1000,
  });
  // Empty lanes still cost the 768-token verbose base, which fits under floor(1000 * 0.8).
  assert.equal(result.mode, 'mixed');
  assert.deepEqual(result.modeByKind, { character: 'verbose', scene: 'compact', prop: 'verbose' });
  assert.equal(result.compactSafeMaximum, 800);
  assert.deepEqual(
    result.laneDetails.map((lane) => lane.compactOutputTokens),
    [128, 704, 128],
  );
});

test('the verbose capacity assertion checks each kind', () => {
  assert.equal(
    assertStoryAssetFocusedOutputCapacity({
      requiredAssetNamesByKind: { scene: names(3, '场景') },
      maxOutputTokens: 3000,
    }),
    undefined,
  );
  assert.equal(assertStoryAssetFocusedOutputCapacity(), undefined);
  assert.throws(
    () =>
      assertStoryAssetFocusedOutputCapacity({
        requiredAssetNamesByKind: { scene: names(3, '场景') },
        candidateAssetsByKind: { scene: [1, 2] },
        maxOutputTokens: 3000,
      }),
    (error) => {
      assert.equal(
        error.message,
        'scene 资产预计输出 3168 tokens，超过单次输出容量 3000；已在调用 API 前安全停止。',
      );
      assert.equal(error.type, 'ASSET_OUTPUT_CAPACITY');
      assert.deepEqual(error.capacityDetails, {
        kind: 'scene',
        requiredAssetCount: 3,
        candidateAssetCount: 2,
        estimatedOutputTokens: 3168,
        maxOutputTokens: 3000,
      });
      return true;
    },
  );
});

const PROJECT = { title: 'T', chapters: [{ id: 'e1', title: '一' }, { id: 'e2' }], extra: { a: 1 } };
const SCENES = [
  {
    ref: 's1',
    episodeRef: 'e1',
    heading: '客厅',
    characters: ['张三', '王五'],
    body: '0123456789'.repeat(10),
  },
  {
    ref: 's2',
    episodeRef: 'e1',
    heading: '卧室',
    characters: ['李四'],
    body: 'PP-UIE 本地候选：钥匙\n证据原文：短正文十个字符啊',
  },
  { ref: 's3', body: '无集' },
];

test('the evidence project samples bodies fairly and marks hard-required context', () => {
  const evidence = {
    hardRequired: [
      { kind: 'scene', name: '客厅', hardSourceSceneRefs: ['s1'] },
      { kind: 'character', name: '张三', hardSourceSceneRefs: ['s1'] },
    ],
  };
  const project = createBudgetedStoryAssetEvidenceProject(PROJECT, SCENES, {
    requirementEvidence: evidence,
    bodyCharacterBudget: 30,
  });
  assert.deepEqual(project, {
    title: 'T',
    extra: { a: 1 },
    chapters: [
      {
        id: 'e1',
        title: '一',
        content: '场景：客厅\n已知出场角色：张三\n01234\n…\n8901\n…\n56789\n\n短正文十个字符啊',
      },
      { id: 'e2', content: '' },
    ],
  });
  assert.notEqual(project.extra, PROJECT.extra);
  assert.equal('content' in PROJECT.chapters[0], false);
});

test('the evidence project can include every heading and cast list', () => {
  const project = createBudgetedStoryAssetEvidenceProject(PROJECT, SCENES, {
    includeAllSceneHeadings: true,
    includeAllSceneCharacters: true,
    bodyCharacterBudget: 8,
  });
  assert.equal(
    project.chapters[0].content,
    '场景：客厅\n已知出场角色：张三、王五\n012\n\n场景：卧室\n已知出场角色：李四\n短正文',
  );
  assert.deepEqual(createBudgetedStoryAssetEvidenceProject({}, SCENES), { chapters: [] });
  assert.deepEqual(
    createBudgetedStoryAssetEvidenceProject(PROJECT, null, { bodyCharacterBudget: 0 }).chapters[0].content,
    '',
  );
});
