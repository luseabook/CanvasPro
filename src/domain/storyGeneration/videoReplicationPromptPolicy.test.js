import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REPLICATION_CONTENT_RULE,
  REPLICATION_SOURCE_SPEECH_RULE,
  REPLICATION_SPEECH_OUTPUT_RULE,
  REPLICATION_TIMELINE_RULE,
  REPLICATION_VISUAL_RULE,
  assertReplicationRepairTiming,
  buildReplicationReviewRequest,
  getReplicationGenerationSystemPrompt,
  getReplicationLockedTiming,
  projectReplicationPromptEvidence,
  serializeReplicationGenerationPrompt,
} from './videoReplicationPromptPolicy.js';
import {
  REPLICATION_SOURCE_CUT_RULE,
  REPLICATION_TIMING_RULE,
} from './videoReplicationTimingContract.js';
import { REPLICATION_CONTENT_TYPES } from './videoReplicationContentRouting.js';

function makeClip() {
  return {
    ref: 'c1',
    durationSec: 10,
    sourceStartSec: 100,
    sourceEndSec: 110,
    events: [
      {
        startSec: 100,
        endSec: 110,
        shots: [
          { startSec: 100, endSec: 104 },
          { startSec: 104, endSec: 110 },
        ],
      },
    ],
  };
}

function makeProject(contentType = 'story', promptMode = 'seedance-2.0', generationPrepared = false) {
  return {
    promptMode,
    replication: {
      sourceAnalysis: { contentType, events: [] },
      segmentPlan: [makeClip()],
      generationPrepared,
    },
    adaptation: { audioLanguage: 'en' },
  };
}

function makePrompt(promptMode = 'seedance-2.0') {
  return {
    task: 'generate_video_replication',
    schemaVersion: 'v1',
    promptMode,
    episode: { ref: 'ep1', title: 'Title', text: 'Script', scenes: [{ code: 's1' }] },
    sourceVideoEvidence: {
      sourceDurationSec: 10,
      sourceLanguage: 'zh',
      contentType: 'story',
      contentTypeReason: 'reason',
      characters: [{ id: 'ch1' }],
      speechPolicy: 'policy',
      segmentPlan: [makeClip()],
      events: [{ id: 'e1' }],
      adaptation: {
        targetLocale: 'en',
        audioLanguage: 'en',
        characterBindings: [{ id: 'b1' }],
        replacements: [{ assetId: 'a1', assetRef: 'r1', targetName: 'T', original: 'O', extra: 'drop' }],
      },
    },
    assets: [{ id: 'a1' }],
    scenes: [{ code: 's1' }],
    constraints: { clipMaxSeconds: 10 },
    clipMaxSeconds: 10,
  };
}

test('videoReplicationPromptPolicy: 规则常量与生成系统提示稳定', () => {
  for (const rule of [
    REPLICATION_SOURCE_SPEECH_RULE,
    REPLICATION_TIMELINE_RULE,
    REPLICATION_CONTENT_RULE,
    REPLICATION_VISUAL_RULE,
    REPLICATION_SPEECH_OUTPUT_RULE,
  ]) {
    assert.equal(typeof rule, 'string');
    assert.ok(rule.length > 100);
  }
  assert.match(REPLICATION_SOURCE_SPEECH_RULE, /speechOrder|uncertain/);
  assert.match(REPLICATION_TIMELINE_RULE, /segmentPlan/);

  const systemPrompt = getReplicationGenerationSystemPrompt();
  assert.ok(systemPrompt.includes('你将原片观察记录转换成可执行的视频分镜'));
  assert.ok(systemPrompt.includes(REPLICATION_CONTENT_RULE));
  assert.ok(systemPrompt.includes(REPLICATION_TIMELINE_RULE));
  assert.equal(systemPrompt.split('\n').length, 3);
});

test('videoReplicationPromptPolicy: 证据投影按 ref 过滤片段并裁剪替换项', () => {
  const clipA = { ref: 'a', durationSec: 5 };
  const clipB = { ref: 'b', durationSec: 5 };
  const input = {
    sourceDurationSec: 10,
    sourceLanguage: 'zh',
    contentType: 'story',
    contentTypeReason: 'reason',
    characters: [{ id: 'ch1' }],
    speechPolicy: 'policy',
    segmentPlan: [clipA, clipB],
    events: [{ id: 'event' }],
    adaptation: {
      targetLocale: 'en',
      audioLanguage: 'en',
      characterBindings: [{ id: 'b1' }],
      replacements: [{ assetId: 'a1', assetRef: 'r1', targetName: 'T', original: 'O', extra: 'drop' }],
    },
  };

  assert.equal(projectReplicationPromptEvidence(null), null);
  const projected = projectReplicationPromptEvidence(input, new Set(['b']));
  assert.deepEqual(projected.segmentPlan, [clipB]);
  assert.equal(projected.events, undefined);
  assert.deepEqual(projected.adaptation, {
    targetLocale: 'en',
    audioLanguage: 'en',
    characterBindings: [{ id: 'b1' }],
    replacements: [{ assetId: 'a1', assetRef: 'r1', targetName: 'T', original: 'O' }],
  });

  const fallback = projectReplicationPromptEvidence(input);
  assert.deepEqual(fallback.segmentPlan, [clipA, clipB]);
  const noPlan = projectReplicationPromptEvidence({ ...input, segmentPlan: [] });
  assert.deepEqual(noPlan.events, [{ id: 'event' }]);
  assert.equal(noPlan.segmentPlan, undefined);
});

test('videoReplicationPromptPolicy: 序列化提示词按模式输出时间字段与路线', () => {
  const prompt = makePrompt('seedance-2.0');
  const legacy = JSON.parse(
    serializeReplicationGenerationPrompt(prompt, makeProject('story', 'seedance-2.0', false)),
  );
  assert.equal(legacy.task, 'generate_video_replication');
  assert.equal(legacy.promptMode, 'seedance-2.0');
  assert.equal(legacy.episode.preparedScript, undefined);
  assert.equal(legacy.timingContract.unit, 'seconds');
  assert.equal(legacy.promptRoute.contentType, 'story');
  assert.equal(legacy.availableRoutes, undefined);
  // 0.8.0 起 REPLICATION_VISUAL_RULE 只用于审查 criteria，不再进入生成 requirements
  assert.ok(!legacy.requirements.includes(REPLICATION_VISUAL_RULE));
  assert.ok(legacy.requirements.includes(REPLICATION_SOURCE_CUT_RULE));
  assert.ok(!legacy.requirements.includes(REPLICATION_TIMING_RULE));
  assert.doesNotMatch(legacy.outputFormat, /"startSec"/);
  assert.deepEqual(legacy.sourceVideoEvidence.adaptation.replacements, [
    { assetId: 'a1', assetRef: 'r1', targetName: 'T', original: 'O' },
  ]);

  const continuous = JSON.parse(
    serializeReplicationGenerationPrompt(
      makePrompt('seedance-2.5'),
      makeProject('story', 'seedance-2.5', true),
    ),
  );
  assert.equal(continuous.episode.preparedScript, 'Script');
  assert.equal(continuous.timingContract.unit, 'seconds');
  assert.ok(continuous.requirements.includes(REPLICATION_TIMING_RULE));
  assert.match(continuous.outputFormat, /"startSec":局部起秒,"endSec":局部止秒,/);

  const unknown = JSON.parse(
    serializeReplicationGenerationPrompt(
      makePrompt('seedance-2.0'),
      makeProject('unknown', 'seedance-2.0', false),
    ),
  );
  assert.equal(unknown.promptRoute.contentType, 'unknown');
  assert.deepEqual(
    unknown.availableRoutes.map((route) => route.contentType),
    REPLICATION_CONTENT_TYPES,
  );

  assert.equal(serializeReplicationGenerationPrompt(prompt, {}), JSON.stringify(prompt));
});

test('videoReplicationPromptPolicy: 锁定时间优先取 segmentPlan 并累计镜头切点', () => {
  const clip = {
    ref: 'c1',
    durationSec: 10,
    sourceStartSec: 100,
    sourceEndSec: 110,
    shots: [{ durationSec: 2 }, { durationSec: 3 }, { durationSec: 5 }],
  };
  const project = {
    replication: { segmentPlan: [{ ref: 'c1', durationSec: 12, sourceStartSec: 50, sourceEndSec: 62 }] },
  };
  assert.deepEqual(getReplicationLockedTiming(clip, project), {
    durationSec: 12,
    sourceStartSec: 50,
    sourceEndSec: 62,
    shotBoundaries: [2, 5],
  });
  assert.deepEqual(getReplicationLockedTiming(clip, { replication: { segmentPlan: [] } }), {
    durationSec: 10,
    sourceStartSec: 100,
    sourceEndSec: 110,
    shotBoundaries: [2, 5],
  });
  assert.deepEqual(getReplicationLockedTiming({ ref: 'c1', durationSec: 10 }, {}), {
    durationSec: 10,
    sourceStartSec: undefined,
    sourceEndSec: undefined,
    shotBoundaries: [],
  });
});

test('videoReplicationPromptPolicy: 审查请求重建路线、时间合同与系统提示', () => {
  const project = {
    promptMode: 'seedance-2.5',
    replication: { segmentPlan: [makeClip()], sourceAnalysis: { contentType: 'story', events: [] } },
    adaptation: { audioLanguage: 'en' },
  };
  const sourceAnalysis = {
    sourceDurationSec: 10,
    sourceLanguage: 'zh',
    contentType: 'story',
    contentTypeReason: 'reason',
    characters: [],
    speechPolicy: 'policy',
    events: [{ id: 'e1' }],
    adaptation: { audioLanguage: 'en' },
  };
  const request = {
    prompt: JSON.stringify({
      task: 'review_story_episode_split_quality',
      schemaVersion: 'v1',
      episodeRef: 'ep1',
      assets: [{ id: 'a1' }],
      productionLimits: { maxClipDurationSeconds: 10 },
      outputContract: 'base contract',
      batchRef: 'batch-1',
      phase: 'review',
      clips: [{ ref: 'c1', replicationContentType: 'story' }],
      neighboringClips: [{ ref: 'c0' }],
      localSignals: { tone: 'x' },
    }),
    systemPrompt: 'old',
    model: 'm',
  };
  const result = buildReplicationReviewRequest(request, sourceAnalysis, project, {
    promptMode: 'seedance-2.5',
  });
  assert.equal(result.model, 'm');
  assert.notEqual(result.systemPrompt, 'old');

  const parsed = JSON.parse(result.prompt);
  assert.equal(parsed.task, 'review_story_episode_split_quality');
  assert.equal(parsed.episodeRef, 'ep1');
  assert.equal(parsed.timingContract.unit, 'seconds');
  assert.equal(parsed.timingContract.clips[0].ref, 'c1');
  assert.deepEqual(parsed.sourceVideoEvidence.events, [{ id: 'e1' }]);
  assert.equal(parsed.sourceVideoEvidence.segmentPlan, undefined);
  assert.deepEqual(parsed.assets, [{ id: 'a1' }]);
  assert.deepEqual(parsed.productionLimits, { maxClipDurationSeconds: 10 });
  assert.equal(parsed.promptRoute.contentType, 'story');
  assert.equal(
    parsed.outputContract,
    'base contract；复刻片段保留 creativeIntent，shots 还须原样保留 sourceShotId、shootingContent、sceneKey、sceneVisualStyle、textElements、spatialStart、spatialEnd。',
  );
  assert.equal(parsed.batchRef, 'batch-1');
  assert.equal(parsed.phase, 'review');
  assert.deepEqual(parsed.neighboringClips, [{ ref: 'c0' }]);
  assert.deepEqual(parsed.localSignals, { tone: 'x' });
  assert.ok(parsed.criteria.includes(REPLICATION_VISUAL_RULE));
  assert.ok(result.systemPrompt.includes('你在核对已识别的原片证据'));
  assert.ok(result.systemPrompt.includes(REPLICATION_TIMING_RULE));
  assert.ok(result.systemPrompt.includes('en'));
});

test('videoReplicationPromptPolicy: 修补请求去掉 timingBudget 并锁定原片切点', () => {
  const clip = {
    ref: 'c1',
    durationSec: 10,
    sourceStartSec: 100,
    sourceEndSec: 110,
    shots: [{ durationSec: 4 }, { durationSec: 6 }],
  };
  const project = {
    promptMode: 'seedance-2.0',
    replication: { segmentPlan: [clip], sourceAnalysis: { contentType: 'advertisement', events: [] } },
  };
  const request = {
    prompt: JSON.stringify({
      task: 'repair_story_episode_split_quality',
      schemaVersion: 'v1',
      episodeRef: 'ep1',
      assets: [],
      productionLimits: { maxClipDurationSeconds: 10 },
      outputContract: '',
      repairRound: 2,
      failedClips: [{ clip, timingBudget: 12, issues: [{ code: 'x' }] }],
      readOnlyNeighboringClips: [{ ref: 'c0' }],
      allowedAssetReferences: ['r1'],
    }),
    systemPrompt: 'old',
  };
  const result = buildReplicationReviewRequest(
    request,
    { contentType: 'advertisement', events: [] },
    project,
    { promptMode: 'seedance-2.0' },
  );
  const parsed = JSON.parse(result.prompt);
  assert.equal(parsed.task, 'repair_story_episode_split_quality');
  assert.equal(parsed.repairRound, 2);
  assert.equal(parsed.failedClips.length, 1);
  assert.equal(parsed.failedClips[0].timingBudget, undefined);
  assert.deepEqual(parsed.failedClips[0].lockedTiming, {
    durationSec: 10,
    sourceStartSec: 100,
    sourceEndSec: 110,
    shotBoundaries: [4],
  });
  assert.deepEqual(parsed.failedClips[0].issues, [{ code: 'x' }]);
  assert.deepEqual(parsed.readOnlyNeighboringClips, [{ ref: 'c0' }]);
  assert.deepEqual(parsed.allowedAssetReferences, ['r1']);
  assert.ok(parsed.instruction.includes(REPLICATION_VISUAL_RULE));
  assert.ok(parsed.instruction.includes(REPLICATION_SPEECH_OUTPUT_RULE));
  assert.ok(result.systemPrompt.includes('局部纠错员'));
  assert.ok(!result.systemPrompt.includes(REPLICATION_TIMING_RULE));
});

test('videoReplicationPromptPolicy: 修补时间校验锁定引用、时长、切点与整数秒', () => {
  const clip = {
    ref: 'c1',
    durationSec: 10,
    sourceStartSec: 100,
    sourceEndSec: 110,
    shots: [{ durationSec: 4 }, { durationSec: 6 }],
  };
  const project = {
    replication: {
      segmentPlan: [clip],
      sourceAnalysis: {
        events: [
          {
            startSec: 100,
            endSec: 110,
            shots: [
              { startSec: 100, endSec: 104 },
              { startSec: 104, endSec: 110 },
            ],
          },
        ],
      },
    },
  };
  const valid = [
    {
      ref: 'c1',
      durationSec: 10,
      sourceStartSec: 100,
      sourceEndSec: 110,
      shots: [
        { durationSec: 4, startSec: 0, endSec: 4 },
        { durationSec: 6, startSec: 4, endSec: 10 },
      ],
    },
  ];

  assert.doesNotThrow(() =>
    assertReplicationRepairTiming(valid, clip, project, { promptMode: 'seedance-2.5' }),
  );
  assert.throws(() => assertReplicationRepairTiming([], clip, project), /不得改变片段数量或引用/);
  assert.throws(
    () => assertReplicationRepairTiming([{ ...valid[0], ref: 'c2' }], clip, project),
    /不得改变片段数量或引用/,
  );
  assert.throws(
    () =>
      assertReplicationRepairTiming(
        [
          {
            ...valid[0],
            durationSec: 9,
            shots: [
              { durationSec: 4, startSec: 0, endSec: 4 },
              { durationSec: 5, startSec: 4, endSec: 9 },
            ],
          },
        ],
        clip,
        project,
      ),
    /时间已锁定/,
  );
  assert.throws(
    () => assertReplicationRepairTiming([{ ...valid[0], sourceStartSec: 99 }], clip, project),
    /禁止改变原片范围或片段总时长/,
  );
  assert.throws(
    () =>
      assertReplicationRepairTiming(
        [
          {
            ...valid[0],
            shots: [
              { durationSec: 4.5, startSec: 0, endSec: 4.5 },
              { durationSec: 5.5, startSec: 4.5, endSec: 10 },
            ],
          },
        ],
        clip,
        project,
        { promptMode: 'seedance-2.5' },
      ),
    /复刻修补不得移动或删除已有镜头切点/,
  );
  assert.throws(
    () =>
      assertReplicationRepairTiming(
        [
          {
            ...valid[0],
            shots: [
              { durationSec: 4, startSec: 0, endSec: 4 },
              { durationSec: 6, startSec: 5, endSec: 10 },
            ],
          },
        ],
        clip,
        project,
      ),
    /镜头时间无效/,
  );
  assert.throws(
    () =>
      assertReplicationRepairTiming(
        [
          {
            ...valid[0],
            shots: [
              { durationSec: 5, startSec: 0, endSec: 5 },
              { durationSec: 5, startSec: 5, endSec: 10 },
            ],
          },
        ],
        clip,
        project,
      ),
    /不得移动或删除已有镜头切点/,
  );
  assert.throws(
    () =>
      assertReplicationRepairTiming(
        [
          {
            ...valid[0],
            shots: [
              { durationSec: 2, startSec: 0, endSec: 2 },
              { durationSec: 2, startSec: 2, endSec: 4 },
              { durationSec: 3, startSec: 4, endSec: 7 },
              { durationSec: 3, startSec: 7, endSec: 10 },
            ],
          },
        ],
        clip,
        project,
      ),
    /缺少原片逐镜依据/,
  );

  const fractionalClip = {
    ref: 'c1',
    durationSec: 10,
    sourceStartSec: 100,
    sourceEndSec: 110,
    shots: [{ durationSec: 4.5 }, { durationSec: 5.5 }],
  };
  const fractionalProject = {
    replication: {
      segmentPlan: [fractionalClip],
      sourceAnalysis: {
        events: [
          {
            startSec: 100,
            endSec: 110,
            shots: [
              { startSec: 100, endSec: 104.5 },
              { startSec: 104.5, endSec: 110 },
            ],
          },
        ],
      },
    },
  };
  assert.doesNotThrow(() =>
    assertReplicationRepairTiming(
      [
        {
          ref: 'c1',
          durationSec: 10,
          sourceStartSec: 100,
          sourceEndSec: 110,
          shots: [
            { durationSec: 4.5, startSec: 0, endSec: 4.5 },
            { durationSec: 5.5, startSec: 4.5, endSec: 10 },
          ],
        },
      ],
      fractionalClip,
      fractionalProject,
      { promptMode: 'seedance-2.0' },
    ),
  );
});
