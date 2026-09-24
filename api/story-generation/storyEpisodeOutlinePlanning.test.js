import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryEpisodeOutlinePlanningApi } from './storyEpisodeOutlinePlanning.js';
import { parseStrictJson } from '../utils/strictJson.js';
import {
  normalizePositiveNumber,
  normalizeStringArray,
  normalizeText,
} from '../utils/storyGenerationValues.js';
import {
  assertPlanningModel,
  buildStoryTextProviderProfilePayload,
  getResultText,
  requestStrictResult,
} from './storyTextRequest.js';
import { createStorySummaryBlueprint } from './storySummaryBlueprint.js';

// Test doubles stand in only for collaborators from src/domain/storyGeneration, which this repo does not have.
const blueprint = createStorySummaryBlueprint({
  normalizeStoryScriptMode: (mode) => mode,
  validateStoryPlanningConstraints: () => ({}),
});
const normalizeState = (state) => ({
  characters: normalizeStringArray(state?.characters),
  props: normalizeStringArray(state?.props),
  unresolvedThreads: normalizeStringArray(state?.unresolvedThreads),
});
function makeApi(overrides = {}) {
  return createStoryEpisodeOutlinePlanningApi({
    generateText: async () => assert.fail('default request must not be used'),
    parseStrictJson,
    normalizeText,
    normalizeStringArray,
    normalizeStoryContinuityFacts: (facts) => normalizeStringArray(facts).slice(0, 12),
    normalizeStoryContinuityState: normalizeState,
    hasStoryContinuityState: (state) =>
      Boolean(state && (state.characters.length || state.props.length || state.unresolvedThreads.length)),
    normalizePositiveNumber,
    normalizeStorySummaryCharacter: blueprint.normalizeStorySummaryCharacter,
    normalizeStoryContract: blueprint.normalizeStoryContract,
    normalizeStoryPlotBeat: blueprint.normalizeStoryPlotBeat,
    normalizeStoryScriptMode: (mode) => (mode === 'narration' ? 'narration' : 'plot'),
    normalizeStoryPlanningConstraints: ({ episodeCount }) => ({
      episodeCount: Math.max(1, Math.trunc(Number(episodeCount) || 1)),
    }),
    resolveStoryPlanningConstraints: (project, constraints) => ({
      episodeCount: constraints?.episodeCount || project?.episodeCount || 3,
    }),
    getResultText,
    assertPlanningModel,
    buildStoryTextProviderProfilePayload,
    requestStrictResult,
    STORY_EPISODE_OUTLINE_SCHEMA_VERSION: 7,
    STORY_SCRIPT_MODE_NARRATION: 'narration',
    STORY_EPISODE_OUTLINE_BATCH_SIZE: 5,
    STORY_SUMMARY_MAX_PLOT_BEATS: 8,
    STORY_CONTINUITY_MAX_FACTS: 12,
    STORY_CONTINUITY_MAX_CHARACTER_STATES: 6,
    STORY_CONTINUITY_MAX_PROP_STATES: 6,
    STORY_CONTINUITY_MAX_UNRESOLVED_THREADS: 6,
    STORY_TEXT_REQUEST_TIMEOUT_MS: 1234,
    STORY_TEXT_MAX_OUTPUT_TOKENS: 5678,
    ...overrides,
  });
}

const PROJECT = {
  title: '雨夜',
  storySummary: '梗概',
  logline: '一句话',
  storyBackground: '背景',
  continuityFacts: ['张三是侦探'],
  storyFacts: ['张三是侦探', '钥匙在李四手里'],
  characters: [
    { name: '张三', roleType: '主角', coreTags: ['侦探'], visualAppearance: '风衣', profile: 'p' },
    { name: '李四', roleType: '反派' },
  ],
};
const state = (text) => ({ characters: ['张三：' + text], props: [], unresolvedThreads: [] });
const skeletonEpisode = (n) => ({
  ref: 'episode-' + n,
  number: n,
  title: '第' + n + '集',
  coreBeat: '推进' + n,
  endingEvent: '结束' + n,
  activeCharacters: n % 2 ? ['张三'] : ['李四'],
});
const detailEpisode = (n) => ({
  ref: 'episode-' + n,
  number: n,
  title: '第' + n + '集',
  synopsis: '简介' + n,
  hook: '钩子' + n,
  continuityFacts: ['事实' + n],
  endingState: state('状态' + n),
});
const completeEpisode = (n) => ({ ...skeletonEpisode(n), ...detailEpisode(n), estimatedDurationSeconds: 60 });

function makeRouter(handlers) {
  const calls = [];
  const request = async (payload) => {
    const prompt = JSON.parse(payload.prompt);
    const key = prompt.task === 'repair_invalid_agent_response' ? 'repair' : prompt.phase || prompt.task;
    calls.push({ key, prompt, payload });
    const handler = handlers[key];
    if (!handler) assert.fail('unexpected request ' + key);
    const response = handler(prompt, calls.length);
    return typeof response === 'string' ? response : JSON.stringify(response);
  };
  return { request, calls };
}

test('the factory exposes the planning api and checkpoint version', () => {
  const api = makeApi();
  assert.deepEqual(Object.keys(api), [
    'buildStoryNarrativeSummary',
    'buildStoryEpisodeOutlinePrompt',
    'parseStoryEpisodeOutlineSkeletonResult',
    'createStoryEpisodeOutlineBatches',
    'buildStoryEpisodeOutlineBatchPrompt',
    'parseStoryEpisodeOutlineBatchResult',
    'parseStoryEpisodeOutlineResult',
    'planStoryEpisodeOutlines',
    'STORY_EPISODE_OUTLINE_CHECKPOINT_VERSION',
  ]);
  assert.equal(api.STORY_EPISODE_OUTLINE_CHECKPOINT_VERSION, 1);
});

test('the narrative summary merges story facts and trims character fields', () => {
  const summary = makeApi().buildStoryNarrativeSummary(PROJECT);
  assert.equal(summary.summary, '梗概');
  assert.equal(summary.background, '背景');
  assert.deepEqual(summary.storyFacts, ['张三是侦探', '钥匙在李四手里']);
  assert.deepEqual(Object.keys(summary.characters[0]), [
    'ref',
    'name',
    'roleType',
    'fixedTraits',
    'coreTags',
    'profile',
    'motivation',
    'relationships',
    'personality',
    'arc',
  ]);
  assert.equal(summary.characters[1].ref, 'character-2');
  assert.throws(() => makeApi().buildStoryNarrativeSummary({ title: 'T', summary: 'S' }), {
    message: '请先生成剧本摘要。',
  });
});

test('the single-pass prompt asks for the complete outline', () => {
  const prompt = JSON.parse(
    makeApi().buildStoryEpisodeOutlinePrompt({
      project: { ...PROJECT, scriptMode: 'narration' },
      constraints: { episodeCount: 10 },
    }),
  );
  assert.equal(prompt.task, 'plan_story_episode_outlines');
  assert.equal(prompt.schemaVersion, 7);
  assert.equal(prompt.phase, 'complete');
  assert.equal(prompt.scriptMode, 'narration');
  assert.deepEqual(prompt.constraints, { episodeCount: 10 });
  assert.equal(prompt.requirements.length, 15);
  assert.equal(
    prompt.requirements[0],
    '目标生成约 10 集，建议保持在 9-10 集；不要求机械凑满，但不得超过 10 集。',
  );
  assert.ok(prompt.requirements.at(-1).startsWith('按第三人称旁白'));
  assert.deepEqual(Object.keys(prompt.outputSchema.episodes[0]).slice(-4), [
    'hook',
    'continuityFacts',
    'endingState',
    'estimatedDurationSeconds',
  ]);
  const plot = JSON.parse(
    makeApi().buildStoryEpisodeOutlinePrompt({ project: PROJECT, constraints: { episodeCount: 1 } }),
  );
  assert.equal(plot.requirements[0], '目标生成约 1 集，建议保持在 1-1 集；不要求机械凑满，但不得超过 1 集。');
  assert.ok(plot.requirements.at(-1).startsWith('按人物行动'));
});

test('skeleton parsing renumbers episodes and validates the arc', () => {
  const api = makeApi();
  const result = api.parseStoryEpisodeOutlineSkeletonResult(
    JSON.stringify({
      storyFacts: ['a', 'a'],
      episodes: [
        { ...skeletonEpisode(1), number: 9 },
        { ...skeletonEpisode(2), ref: '' },
      ],
    }),
    { episodeCount: 3 },
  );
  assert.deepEqual(result, {
    schemaVersion: 7,
    storyFacts: ['a'],
    episodes: [
      { ...skeletonEpisode(1), number: 1 },
      { ...skeletonEpisode(2), ref: 'episode-2' },
    ],
  });
  const parse =
    (episodes, episodeCount = 3) =>
    () =>
      api.parseStoryEpisodeOutlineSkeletonResult(JSON.stringify({ episodes }), { episodeCount });
  assert.throws(() => api.parseStoryEpisodeOutlineSkeletonResult(''), {
    message: 'Agent 未返回全剧分集骨架。',
  });
  assert.throws(parse([]), { message: 'Agent 返回结果没有可用全剧分集骨架。' });
  assert.throws(parse([skeletonEpisode(1), { ...skeletonEpisode(2), endingEvent: '' }]), {
    message: 'Agent 返回的第 2 集骨架缺少标题、核心推进或结束事件。',
  });
  assert.throws(parse([skeletonEpisode(1), skeletonEpisode(2)], 1), {
    message: 'Agent 返回了 2 集分集骨架，超过 1 集上限。',
  });
  assert.throws(parse([skeletonEpisode(1), { ...skeletonEpisode(2), ref: 'episode-1' }]), {
    message: 'Agent 返回了重复的分集骨架引用。',
  });
});

test('outline batches split episodes by the configured size', () => {
  const api = makeApi();
  const episodes = Array.from({ length: 12 }, (_, index) => index + 1);
  assert.deepEqual(
    api.createStoryEpisodeOutlineBatches(episodes).map((batch) => batch.length),
    [5, 5, 2],
  );
  assert.deepEqual(
    api.createStoryEpisodeOutlineBatches(episodes, { batchSize: 7 }).map((batch) => batch.length),
    [7, 5],
  );
  assert.deepEqual(api.createStoryEpisodeOutlineBatches('bad'), []);
});

test('batch prompts carry arc context, the next episode and prior ending state', () => {
  const api = makeApi();
  const skeleton = { storyFacts: ['f'], episodes: [1, 2, 3].map(skeletonEpisode) };
  const prompt = JSON.parse(
    api.buildStoryEpisodeOutlineBatchPrompt({
      project: PROJECT,
      constraints: { episodeCount: 3 },
      skeleton,
      batchEpisodes: [skeleton.episodes[0]],
      batchIndex: 1,
      batchTotal: 3,
      previousEndingState: state('开场'),
    }),
  );
  assert.equal(prompt.task, 'plan_story_episode_outline_batch');
  assert.equal(prompt.phase, 'detail');
  assert.deepEqual(prompt.storyFacts, ['f']);
  assert.deepEqual(prompt.storyArc[1], { number: 2, coreBeat: '推进2', endingEvent: '结束2' });
  assert.deepEqual(prompt.batch, { index: 1, total: 3, episodes: [skeleton.episodes[0]] });
  assert.deepEqual(prompt.continuity, {
    previousEndingState: state('开场'),
    nextEpisode: skeleton.episodes[1],
  });
  assert.deepEqual(
    prompt.storyContext.characters.map((character) => character.name),
    ['张三', '李四'],
  );
  assert.equal(prompt.requirements.length, 10);
  const last = JSON.parse(
    api.buildStoryEpisodeOutlineBatchPrompt({
      project: PROJECT,
      skeleton,
      batchEpisodes: [skeleton.episodes[2]],
      previousEndingState: {},
    }),
  );
  assert.deepEqual(last.continuity, { previousEndingState: null, nextEpisode: null });
  assert.deepEqual(
    last.storyContext.characters.map((character) => character.name),
    ['张三'],
  );
  assert.throws(() => api.buildStoryEpisodeOutlineBatchPrompt({ project: PROJECT }), {
    message: '当前没有可细化的分集骨架。',
  });
});

test('batch results must match the expected refs and carry ending states', () => {
  const api = makeApi();
  const expected = [skeletonEpisode(1), skeletonEpisode(2)];
  const result = api.parseStoryEpisodeOutlineBatchResult(
    JSON.stringify({
      episodes: [
        { ...detailEpisode(1), estimatedDurationSeconds: 45 },
        { ...detailEpisode(2), title: '', estimatedDurationSeconds: -1 },
      ],
    }),
    { expectedEpisodes: expected },
  );
  assert.equal(result.schemaVersion, 7);
  assert.deepEqual(result.episodes[0], {
    ...skeletonEpisode(1),
    ...detailEpisode(1),
    sourceChapterIds: [],
    assetRefs: [],
    estimatedDurationSeconds: 45,
  });
  assert.equal(result.episodes[1].title, '第2集');
  assert.equal('estimatedDurationSeconds' in result.episodes[1], false);
  const parse = (episodes) => () =>
    api.parseStoryEpisodeOutlineBatchResult(JSON.stringify({ episodes }), { expectedEpisodes: expected });
  assert.throws(parse([detailEpisode(1)]), { message: 'Agent 应返回 2 集分集大纲，实际返回 1 集。' });
  assert.throws(parse([detailEpisode(2), detailEpisode(1)]), {
    message: 'Agent 返回的第 1 个分集引用应为 episode-1。',
  });
  assert.throws(parse([detailEpisode(1), { ...detailEpisode(2), hook: '' }]), {
    message: 'Agent 返回的分集“第2集”缺少简介或钩子。',
  });
  assert.throws(parse([detailEpisode(1), { ...detailEpisode(2), title: '', endingState: {} }]), {
    message: 'Agent 返回的分集“episode-2”缺少有效结束状态。',
  });
});

test('complete outline parsing drops unusable episodes and enforces limits', () => {
  const api = makeApi();
  const result = api.parseStoryEpisodeOutlineResult(
    JSON.stringify({
      storyFacts: ['f'],
      episodes: [completeEpisode(1), { ...completeEpisode(2), synopsis: '' }, completeEpisode(3)],
    }),
    { episodeCount: 5 },
  );
  assert.deepEqual(result.constraints, { episodeCount: 5 });
  assert.deepEqual(
    result.episodes.map((episode) => [episode.ref, episode.number]),
    [
      ['episode-1', 1],
      ['episode-3', 3],
    ],
  );
  assert.equal(result.episodes[0].estimatedDurationSeconds, 60);
  const parse =
    (episodes, episodeCount = 3) =>
    () =>
      api.parseStoryEpisodeOutlineResult(JSON.stringify({ episodes }), { episodeCount });
  assert.throws(parse([{ ...completeEpisode(1), hook: '' }]), {
    message: 'Agent 返回结果没有可用分集大纲。',
  });
  assert.throws(parse([completeEpisode(1), completeEpisode(2)], 1), {
    message: 'Agent 返回了 2 集分集大纲，超过 1 集上限。',
  });
  assert.throws(parse([completeEpisode(1), { ...completeEpisode(2), ref: 'episode-1' }]), {
    message: 'Agent 返回了重复的分集引用。',
  });
});

test('planning requires a text model', async () => {
  await assert.rejects(makeApi().planStoryEpisodeOutlines({ project: PROJECT }), {
    message: '请先选择可用的文本模型。',
  });
});

test('twenty or fewer episodes are planned in one complete request', async () => {
  const router = makeRouter({
    complete: () => ({ storyFacts: ['f'], episodes: [1, 2, 3].map(completeEpisode) }),
  });
  const progress = [];
  const events = [];
  const result = await makeApi().planStoryEpisodeOutlines({
    project: PROJECT,
    constraints: { episodeCount: 3 },
    model: 'm',
    provider: 'p',
    providerProfileId: 'profile-1',
    request: router.request,
    onProgress: (event) => progress.push(event),
    onInvocation: (event) => events.push([event.state, event.stepId]),
  });
  assert.equal(router.calls.length, 1);
  const { payload } = router.calls[0];
  assert.equal(payload.model, 'm');
  assert.equal(payload.providerProfileId, 'profile-1');
  assert.equal(payload.temperature, 0.35);
  assert.equal(payload.timeoutMs, 1234);
  assert.equal(payload.maxOutputTokens, 5678);
  assert.equal(payload.structuredOutput.name, 'story_episode_outlines_complete');
  assert.equal(payload.structuredOutput.schema.properties.episodes.maxItems, 3);
  assert.deepEqual(progress, [
    { stage: 'planning-episode-outlines', current: 1, total: 1, message: '正在一次生成全部 3 集分集大纲' },
  ]);
  assert.deepEqual(events, [
    ['prepared', 'complete'],
    ['completed', 'complete'],
  ]);
  assert.equal(result.episodes.length, 3);
  assert.equal('outlineTimingReview' in result.episodes[0], false);
});

test('an incomplete single-pass outline is repaired once and then rejected', async () => {
  const broken = { episodes: [{ ...completeEpisode(1), coreBeat: '' }] };
  const router = makeRouter({ complete: () => broken, repair: () => broken });
  await assert.rejects(
    makeApi().planStoryEpisodeOutlines({
      project: PROJECT,
      model: 'm',
      provider: 'p',
      request: router.request,
    }),
    { message: 'Agent 返回的第 1 集缺少核心推进、结束事件或有效结束状态。' },
  );
  assert.deepEqual(
    router.calls.map((call) => call.key),
    ['complete', 'repair'],
  );
  assert.equal(router.calls[1].payload.temperature, 0.15);
});

test('single-pass planning replays a journaled response and rejects batch checkpoints', async () => {
  const response = JSON.stringify({ episodes: [1, 2, 3].map(completeEpisode) });
  const result = await makeApi().planStoryEpisodeOutlines({
    project: PROJECT,
    model: 'm',
    provider: 'p',
    request: async () => assert.fail('must not request'),
    resumeResponses: { complete: { attempt: 1, response } },
  });
  assert.equal(result.episodes.length, 3);
  await assert.rejects(
    makeApi().planStoryEpisodeOutlines({
      project: PROJECT,
      model: 'm',
      provider: 'p',
      resumeCheckpoint: { version: 1 },
    }),
    { code: 'CHECKPOINT_INCOMPATIBLE', message: '单次分集大纲与旧分批断点不兼容，不能安全续跑。' },
  );
});

test('original creative projects get an independent outline timing review', async () => {
  const router = makeRouter({
    complete: () => ({ episodes: [1, 2].map(completeEpisode) }),
    review_story_episode_outline_timing: () => ({
      episodes: [
        {
          ref: 'episode-1',
          naturalDurationSeconds: 70,
          reasonableRangeSeconds: { minimum: 50, maximum: 80 },
          reason: 'ok',
        },
        {
          ref: 'episode-2',
          naturalDurationSeconds: 120,
          reasonableRangeSeconds: { minimum: 100, maximum: 140 },
          findings: [{ ref: 'episode-2', issue: '动作多', evidence: '追逐' }, '', 'x'],
        },
      ],
    }),
  });
  const progress = [];
  const result = await makeApi().planStoryEpisodeOutlines({
    project: { ...PROJECT, originalCreative: '原创点子', episodeCount: 2 },
    model: 'm',
    provider: 'p',
    request: router.request,
    onProgress: (event) => progress.push(event.stage),
  });
  assert.deepEqual(progress, ['planning-episode-outlines', 'reviewing-episode-outline-timing']);
  const review = router.calls[1];
  assert.equal(review.payload.temperature, 0.1);
  assert.equal(review.prompt.schemaVersion, 1);
  assert.equal(review.prompt.criteria.length, 5);
  assert.deepEqual(
    result.episodes.map((episode) => episode.estimatedDurationSeconds),
    [70, 120],
  );
  assert.deepEqual(result.episodes[0].outlineTimingReview, {
    ref: 'episode-1',
    verdict: 'consistent',
    naturalDurationSeconds: 70,
    reasonableRangeSeconds: { minimum: 50, maximum: 80 },
    reason: 'ok',
    findings: [],
  });
  assert.equal(result.episodes[1].outlineTimingReview.verdict, 'estimate_mismatch');
  assert.deepEqual(result.episodes[1].outlineTimingReview.findings, ['[episode-2] 动作多 证据：追逐', 'x']);
});

test('outline timing reviews are not retried when invalid', async () => {
  const router = makeRouter({
    complete: () => ({ episodes: [completeEpisode(1)] }),
    review_story_episode_outline_timing: () => ({
      episodes: [
        {
          ref: 'episode-1',
          naturalDurationSeconds: 90,
          reasonableRangeSeconds: { minimum: 10, maximum: 20 },
        },
      ],
    }),
  });
  await assert.rejects(
    makeApi().planStoryEpisodeOutlines({
      project: { ...PROJECT, originalCreative: 'x', episodeCount: 1 },
      model: 'm',
      provider: 'p',
      request: router.request,
    }),
    { message: '第 1 集大纲审时区间无效。' },
  );
  assert.equal(router.calls.length, 2);
});

function detailHandler(prompt) {
  return { episodes: prompt.batch.episodes.map((episode) => detailEpisode(episode.number)) };
}

test('long series plan a skeleton and then detail batches with checkpoints', async () => {
  const router = makeRouter({
    skeleton: () => ({
      storyFacts: ['f'],
      episodes: Array.from({ length: 22 }, (_, index) => skeletonEpisode(index + 1)),
    }),
    detail: detailHandler,
  });
  const checkpoints = [];
  const progress = [];
  const result = await makeApi().planStoryEpisodeOutlines({
    project: PROJECT,
    constraints: { episodeCount: 22 },
    model: 'm',
    provider: 'p',
    request: router.request,
    onCheckpoint: async (checkpoint) => checkpoints.push(checkpoint),
    onProgress: (event) => progress.push(event.message),
  });
  assert.deepEqual(
    router.calls.map((call) => call.key),
    ['skeleton', 'detail', 'detail', 'detail', 'detail', 'detail'],
  );
  assert.equal(router.calls[0].payload.structuredOutput.name, 'story_episode_outline_skeleton');
  assert.equal(router.calls[2].payload.structuredOutput.name, 'story_episode_outline_batch_2');
  assert.equal(router.calls[2].payload.temperature, 0.3);
  assert.deepEqual(router.calls[2].prompt.continuity.previousEndingState, state('状态5'));
  assert.equal(router.calls[1].prompt.continuity.previousEndingState, null);
  assert.deepEqual(progress.slice(0, 3), [
    '正在规划全剧分集骨架',
    '正在细化第 1-5 集大纲（1/5）',
    '正在细化第 6-10 集大纲（2/5）',
  ]);
  assert.equal(progress.at(-1), '正在细化第 21-22 集大纲（5/5）');
  assert.deepEqual(
    checkpoints.map((checkpoint) => [checkpoint.nextBatchIndex, checkpoint.plannedEpisodes.length]),
    [
      [0, 0],
      [1, 5],
      [2, 10],
      [3, 15],
      [4, 20],
      [5, 22],
    ],
  );
  assert.deepEqual(checkpoints[3].previousEndingState, state('状态15'));
  assert.equal(result.schemaVersion, 7);
  assert.deepEqual(result.constraints, { episodeCount: 22 });
  assert.deepEqual(result.storyFacts, ['f']);
  assert.equal(result.episodes.length, 22);
  assert.equal(result.episodes[21].synopsis, '简介22');
});

test('batch planning resumes from a compatible checkpoint', async () => {
  const skeleton = {
    storyFacts: ['f'],
    episodes: Array.from({ length: 22 }, (_, index) => skeletonEpisode(index + 1)),
  };
  const planned = Array.from({ length: 15 }, (_, index) => ({
    ...skeletonEpisode(index + 1),
    ...detailEpisode(index + 1),
  }));
  const router = makeRouter({ detail: detailHandler });
  const result = await makeApi().planStoryEpisodeOutlines({
    project: PROJECT,
    constraints: { episodeCount: 22 },
    model: 'm',
    provider: 'p',
    request: router.request,
    resumeCheckpoint: { version: 1, episodeCount: 22, skeleton, plannedEpisodes: planned, nextBatchIndex: 3 },
  });
  assert.equal(router.calls.length, 2);
  assert.deepEqual(router.calls[0].prompt.continuity.previousEndingState, state('状态15'));
  assert.equal(result.episodes.length, 22);
});

test('incompatible or incomplete checkpoints stop batch planning', async () => {
  const skeleton = { episodes: Array.from({ length: 22 }, (_, index) => skeletonEpisode(index + 1)) };
  const plan = (resumeCheckpoint) =>
    makeApi().planStoryEpisodeOutlines({
      project: PROJECT,
      constraints: { episodeCount: 22 },
      model: 'm',
      provider: 'p',
      resumeCheckpoint,
    });
  await assert.rejects(plan({ version: 2, episodeCount: 22, skeleton, plannedEpisodes: [] }), {
    code: 'CHECKPOINT_INCOMPATIBLE',
    message: '分集大纲断点版本或输入不兼容，不能安全续跑。',
  });
  await assert.rejects(plan({ version: 1, episodeCount: 21, skeleton, plannedEpisodes: [] }), {
    code: 'CHECKPOINT_INCOMPATIBLE',
  });
  await assert.rejects(
    plan({ version: 1, episodeCount: 22, skeleton, plannedEpisodes: [], nextBatchIndex: 1 }),
    {
      code: 'CHECKPOINT_INCOMPATIBLE',
      message: '分集大纲断点内容不完整，不能安全续跑。',
    },
  );
  await assert.rejects(
    plan({ version: 1, episodeCount: 22, skeleton, plannedEpisodes: [], nextBatchIndex: 6 }),
    {
      message: '分集大纲断点内容不完整，不能安全续跑。',
    },
  );
});

test('the single-pass threshold is exactly twenty episodes', async () => {
  const twenty = makeRouter({ complete: () => ({ episodes: [completeEpisode(1)] }) });
  await makeApi().planStoryEpisodeOutlines({
    project: PROJECT,
    constraints: { episodeCount: 20 },
    model: 'm',
    provider: 'p',
    request: twenty.request,
  });
  assert.deepEqual(
    twenty.calls.map((call) => call.key),
    ['complete'],
  );
  const skeleton = { episodes: [skeletonEpisode(1)] };
  const twentyOne = makeRouter({ skeleton: () => skeleton, detail: detailHandler });
  await makeApi().planStoryEpisodeOutlines({
    project: PROJECT,
    constraints: { episodeCount: 21 },
    model: 'm',
    provider: 'p',
    request: twentyOne.request,
  });
  assert.deepEqual(
    twentyOne.calls.map((call) => call.key),
    ['skeleton', 'detail'],
  );
});
