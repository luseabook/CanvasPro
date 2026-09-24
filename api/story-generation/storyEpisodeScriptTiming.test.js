import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createStoryEpisodeScriptRuntimeGuidance,
  inspectStoryEpisodeScriptTiming,
  resolveStoryEpisodeSplitTimingBudget,
  assertStoryEpisodeSplitTiming,
  requestStoryEpisodeScriptTimingReview,
  preserveStoryEpisodeScriptWithoutTimingReview,
  ensureStoryEpisodeScriptTiming,
} from './storyEpisodeScriptTiming.js';

const SCRIPT = {
  scenes: [
    { ref: 's1', body: '张三：“你好世界”\n旁白：夜深了\n字幕：“第一天”\n李四：他走了\n动作描写没有冒号' },
    { ref: 's2', body: 'VO: hello world 42' },
  ],
};

test('runtime guidance switches between adaptation budget and content density', () => {
  const budget = createStoryEpisodeScriptRuntimeGuidance({ estimatedDurationSeconds: 90 });
  assert.equal(budget.basis, 'episode-outline-and-current-story-content');
  assert.equal(budget.outlineEstimateSeconds, 90);
  assert.equal(budget.enforcement, 'adaptation-budget');
  assert.equal(budget.rules.length, 4);
  assert.ok(budget.rules[0].startsWith('大纲预计时长是当前分集的改编预算'));
  const density = createStoryEpisodeScriptRuntimeGuidance({ durationSeconds: 'x' });
  assert.equal(density.outlineEstimateSeconds, null);
  assert.equal(density.enforcement, 'content-density');
  assert.ok(density.rules[0].startsWith('没有预计时长时'));
  assert.equal(createStoryEpisodeScriptRuntimeGuidance(null).enforcement, 'content-density');
});

test('inspection counts only quoted dialogue and narrator lines', () => {
  const result = inspectStoryEpisodeScriptTiming(SCRIPT, { durationSeconds: 60 });
  assert.equal(result.status, 'observed');
  assert.equal(result.outlineEstimateSeconds, 60);
  assert.equal(result.spokenUnits, 10);
  assert.equal(result.minimumSpokenDurationSeconds, 2);
  assert.ok(result.reason.includes('每秒 5 字/词'));
  assert.ok(result.reason.includes('至少需要 2 秒'));
});

test('inspection without dialogue reports zero and defers to review', () => {
  const result = inspectStoryEpisodeScriptTiming({ scenes: [{ body: '他慢慢走进房间。' }, {}] });
  assert.equal(result.outlineEstimateSeconds, 0);
  assert.equal(result.spokenUnits, 0);
  assert.equal(result.minimumSpokenDurationSeconds, 0);
  assert.ok(result.reason.startsWith('本集没有可可靠提取的对白或旁白'));
  assert.equal(inspectStoryEpisodeScriptTiming().spokenUnits, 0);
});

test('long speaker prefixes are not treated as dialogue', () => {
  const body = '这是一段非常非常长的描写文字超过了二十四个字符的限制所以不算说话人：“不算”';
  assert.equal(inspectStoryEpisodeScriptTiming({ scenes: [{ body }] }).spokenUnits, 0);
});

const review = (overrides = {}) => ({
  verdict: 'pass',
  naturalDurationSeconds: 70,
  reasonableRangeSeconds: { minimum: 60, maximum: 80 },
  sceneTimings: [
    {
      sceneRef: 's1',
      spokenSeconds: 10,
      nonOverlappingActionSeconds: 20,
      pauseAndTransitionSeconds: 5,
      totalSeconds: 35,
      basis: 'b1',
    },
    { sceneRef: '', totalSeconds: 10 },
    { sceneRef: 's2', spokenSeconds: -1, totalSeconds: 35, basis: 'b2' },
  ],
  ...overrides,
});

test('split timing budget derives target and production ranges from the review', () => {
  const budget = resolveStoryEpisodeSplitTimingBudget({ script: { timingReview: review() } });
  assert.equal(budget.basis, 'independent-script-timing-review');
  assert.equal(budget.targetDurationSeconds, 70);
  assert.deepEqual(budget.reasonableRangeSeconds, { minimum: 60, maximum: 80 });
  assert.deepEqual(budget.allowedProductionRangeSeconds, { minimum: 48, maximum: 96 });
  assert.deepEqual(
    budget.sceneTimings.map((scene) => [
      scene.sceneRef,
      scene.spokenSeconds,
      scene.pauseAndTransitionSeconds,
    ]),
    [
      ['s1', 10, 5],
      ['s2', null, null],
    ],
  );
  const midpoint = resolveStoryEpisodeSplitTimingBudget({
    script: { timingReview: review({ naturalDurationSeconds: 100 }) },
  });
  assert.equal(midpoint.targetDurationSeconds, 70);
});

test('no budget without a usable review', () => {
  assert.equal(resolveStoryEpisodeSplitTimingBudget(), null);
  assert.equal(
    resolveStoryEpisodeSplitTimingBudget({
      script: { timingReview: review({ verdict: 'timing_uncertain' }) },
    }),
    null,
  );
  assert.equal(
    resolveStoryEpisodeSplitTimingBudget({
      script: { timingReview: review({ reasonableRangeSeconds: { minimum: 90, maximum: 80 } }) },
    }),
    null,
  );
  assert.equal(
    resolveStoryEpisodeSplitTimingBudget({
      script: { timingReview: review({ reasonableRangeSeconds: null }) },
    }),
    null,
  );
});

test('split timing assertion accepts totals inside the production range', () => {
  const episode = { script: { timingReview: review() } };
  const split = { clips: [{ durationSec: 30 }, { durationSec: 18 }, { durationSec: 'x' }] };
  assert.equal(assertStoryEpisodeSplitTiming(split, episode), split);
  const explicit = { totalDurationSeconds: 96, clips: [] };
  assert.equal(assertStoryEpisodeSplitTiming(explicit, episode), explicit);
  const unchecked = { totalDurationSeconds: 1 };
  assert.equal(assertStoryEpisodeSplitTiming(unchecked, {}), unchecked);
});

test('split timing assertion rejects totals outside the production range', () => {
  assert.throws(
    () =>
      assertStoryEpisodeSplitTiming({ clips: [{ durationSec: 20 }] }, { script: { timingReview: review() } }),
    (error) => {
      assert.equal(
        error.message,
        '分镜总时长 20 秒偏离本集正文独立审时区间 60-80 秒（允许制作浮动 48-96 秒），本次结果未通过。',
      );
      assert.equal(error.code, 'STORY_EPISODE_SPLIT_TIMING_MISMATCH');
      assert.deepEqual(error.timing, {
        totalDurationSeconds: 20,
        reasonableRangeSeconds: { minimum: 60, maximum: 80 },
        allowedRangeSeconds: { minimum: 48, maximum: 96 },
      });
      return true;
    },
  );
});

const LEDGER = [
  {
    sceneRef: 's1',
    spokenSeconds: 10,
    nonOverlappingActionSeconds: 20,
    pauseAndTransitionSeconds: 5,
    totalSeconds: 35,
    basis: 'b1',
  },
  {
    sceneRef: 's2',
    spokenSeconds: 5,
    nonOverlappingActionSeconds: 25,
    pauseAndTransitionSeconds: 5,
    totalSeconds: 35,
    basis: 'b2',
  },
];
function runReview(response, options = {}) {
  const sent = [];
  const promise = requestStoryEpisodeScriptTimingReview({
    request: async (payload) => (
      sent.push(payload),
      typeof response === 'string' ? response : JSON.stringify(response)
    ),
    requestPayload: { model: 'm' },
    episode: { number: 2.7, title: ' 第二集 ', synopsis: '梗概', hook: '钩子' },
    script: SCRIPT,
    ...options,
  });
  return { promise, sent };
}

test('timing review request builds an independent measurement prompt', async () => {
  const { promise, sent } = runReview({
    verdict: 'pass',
    naturalDurationSeconds: 70,
    reasonableRangeSeconds: { minimum: 60, maximum: 80 },
    sceneTimings: LEDGER,
  });
  const result = await promise;
  assert.deepEqual(result, {
    verdict: 'pass',
    naturalDurationSeconds: 70,
    reasonableRangeSeconds: { minimum: 60, maximum: 80 },
    sceneTimings: LEDGER.map((scene) => ({ ...scene, concurrentActionNotes: '' })),
    reason: '',
    findings: [],
  });
  const [payload] = sent;
  assert.equal(payload.model, 'm');
  assert.equal(payload.temperature, 0.1);
  assert.deepEqual(payload.thinking, { type: 'disabled' });
  assert.equal(payload.maxOutputTokens, 8192);
  assert.ok(payload.systemPrompt.startsWith('你是短剧分集剧本的独立时长审查员。'));
  const prompt = JSON.parse(payload.prompt);
  assert.equal(prompt.task, 'review_story_episode_script_timing');
  assert.equal(prompt.schemaVersion, 2);
  assert.equal(prompt.reviewMode, 'independent');
  assert.deepEqual(prompt.episode, { number: 2, title: '第二集', synopsis: '梗概', hook: '钩子' });
  assert.deepEqual(prompt.script, SCRIPT);
  assert.equal('previousReview' in prompt, false);
  assert.equal(prompt.criteria.length, 7);
});

test('a challenge review embeds the previous review and extra criteria', async () => {
  const prior = { verdict: 'pass', naturalDurationSeconds: 70 };
  const { promise, sent } = runReview(
    {
      verdict: 'pass',
      naturalDurationSeconds: 70,
      reasonableRangeSeconds: { minimum: 60, maximum: 80 },
      sceneTimings: LEDGER,
    },
    { priorReview: prior, episode: {} },
  );
  await promise;
  const prompt = JSON.parse(sent[0].prompt);
  assert.equal(prompt.reviewMode, 'challenge_previous_review');
  assert.deepEqual(prompt.previousReview, prior);
  assert.equal(prompt.criteria.length, 10);
  assert.equal(prompt.episode.number, 1);
});

test('non-pass verdicts need a reason and normalized findings', async () => {
  const findings = [
    { sceneRef: 's1', issue: '重复解释', evidence: '台词A', suggestion: '删去' },
    { foo: 1 },
    '纯文本',
    null,
    ...Array.from({ length: 12 }, (_, index) => '问题' + index),
  ];
  const { promise } = runReview({
    verdict: 'weird',
    reason: '有重复',
    findings,
    naturalDurationSeconds: 70,
    reasonableRangeSeconds: { minimum: 60, maximum: 80 },
    sceneTimings: LEDGER,
  });
  const result = await promise;
  assert.equal(result.verdict, 'needs_revision');
  assert.equal(result.findings.length, 12);
  assert.deepEqual(result.findings.slice(0, 3), [
    '[s1] 重复解释 证据：台词A 建议：删去',
    '{"foo":1}',
    '纯文本',
  ]);
  const missing = runReview({
    verdict: 'needs_revision',
    reason: '有重复',
    findings: [],
    naturalDurationSeconds: 70,
    reasonableRangeSeconds: { minimum: 60, maximum: 80 },
  });
  await assert.rejects(missing.promise, { message: '时长审查 Agent 的问题结论缺少可定位证据。' });
});

test('timing review rejects invalid durations and ranges', async () => {
  await assert.rejects(runReview('').promise, { message: '时长审查 Agent 未返回有效 JSON。' });
  await assert.rejects(runReview({ verdict: 'pass' }).promise, {
    message: '时长审查 Agent 未返回有效自然时长。',
  });
  await assert.rejects(
    runReview({
      verdict: 'pass',
      naturalDurationSeconds: 90,
      reasonableRangeSeconds: { minimum: 60, maximum: 80 },
    }).promise,
    { message: '时长审查 Agent 返回的自然时长区间无效。' },
  );
});

test('timing review validates the per-scene ledger', async () => {
  const base = {
    verdict: 'pass',
    naturalDurationSeconds: 70,
    reasonableRangeSeconds: { minimum: 60, maximum: 80 },
  };
  const cases = [
    [[LEDGER[0]], '时长审查 Agent 未返回覆盖全部场次的逐场时长账本。'],
    [[LEDGER[1], LEDGER[0]], '时长审查 Agent 的逐场账本顺序或场次引用无效：应为 s1。'],
    [[{ ...LEDGER[0], basis: '' }, LEDGER[1]], '时长审查 Agent 的 s1 逐场账本不完整。'],
    [[{ ...LEDGER[0], totalSeconds: 50 }, LEDGER[1]], '时长审查 Agent 的 s1 分项时间无法合计到本场总时长。'],
    [
      [{ ...LEDGER[0], totalSeconds: 25, spokenSeconds: 0, nonOverlappingActionSeconds: 20 }, LEDGER[1]],
      '时长审查 Agent 的逐场总计与整集自然时长不一致。',
    ],
  ];
  for (const [sceneTimings, message] of cases) {
    await assert.rejects(runReview({ ...base, sceneTimings }).promise, { message });
  }
  const tolerant = await runReview({ ...base, sceneTimings: [{ ...LEDGER[0], totalSeconds: 37 }, LEDGER[1]] })
    .promise;
  assert.equal(tolerant.sceneTimings[0].totalSeconds, 37);
  const noScenes = await runReview(base, { script: {} }).promise;
  assert.deepEqual(noScenes.sceneTimings, []);
});

test('preserving without review keeps the script and marks timing uncertain', () => {
  const result = preserveStoryEpisodeScriptWithoutTimingReview(
    { title: 'T', scenes: SCRIPT.scenes },
    { estimatedDurationSeconds: 45 },
    new Error('超时'),
  );
  assert.equal(result.title, 'T');
  assert.deepEqual(result.timingReview, {
    verdict: 'timing_uncertain',
    naturalDurationSeconds: null,
    reasonableRangeSeconds: null,
    sceneTimings: [],
    reason: '时长审查未完成，已保留正文，不再阻塞本集。原因：超时',
    findings: [],
    reviewPasses: 0,
    reviewAgreement: 'review-unavailable',
    outlineEstimateSeconds: 45,
    outlineEstimateMismatch: false,
    spokenUnits: 10,
    minimumSpokenDurationSeconds: 2,
  });
  assert.equal(
    preserveStoryEpisodeScriptWithoutTimingReview({}, {}).timingReview.reason,
    '时长审查未完成，已保留正文，不再阻塞本集。',
  );
  assert.equal(
    preserveStoryEpisodeScriptWithoutTimingReview({}, {}).timingReview.outlineEstimateSeconds,
    null,
  );
});

const verdict = (value, minimum, maximum, extra = {}) => ({
  verdict: value,
  naturalDurationSeconds: (minimum + maximum) / 2,
  reasonableRangeSeconds: { minimum, maximum },
  sceneTimings: [],
  reason: value + '-reason',
  findings: value === 'pass' ? [] : [value + '-finding'],
  ...extra,
});
async function ensureWith(reviews, episode = {}) {
  const calls = [];
  const result = await ensureStoryEpisodeScriptTiming({
    scriptResult: { title: 'T', scenes: SCRIPT.scenes },
    episode,
    review: async (script, phase, prior) => {
      calls.push([phase, prior]);
      const next = reviews.shift();
      if (next instanceof Error) throw next;
      return next;
    },
  });
  return { result, calls, timing: result.timingReview };
}

test('a single passing review is accepted and compared with the outline estimate', async () => {
  const { timing, calls } = await ensureWith([verdict('pass', 60, 80)], { estimatedDurationSeconds: 120 });
  assert.deepEqual(calls, [['timing-review', null]]);
  assert.equal(timing.verdict, 'pass');
  assert.equal(timing.reviewPasses, 1);
  assert.equal(timing.reviewAgreement, 'single-pass');
  assert.equal('previousReview' in timing, false);
  assert.equal(timing.outlineEstimateSeconds, 120);
  assert.equal(timing.outlineEstimateMismatch, true);
  assert.equal(timing.spokenUnits, 10);
  const inside = await ensureWith([verdict('pass', 60, 80)], { estimatedDurationSeconds: 70 });
  assert.equal(inside.timing.outlineEstimateMismatch, false);
});

test('a disputed quality verdict is rechecked and kept as needs_revision', async () => {
  const first = verdict('needs_revision', 60, 80);
  const { timing, calls } = await ensureWith([first, verdict('pass', 70, 90)], {
    estimatedDurationSeconds: 200,
  });
  assert.deepEqual(calls, [
    ['timing-review', null],
    ['timing-recheck', first],
  ]);
  assert.equal(timing.verdict, 'needs_revision');
  assert.equal(timing.reviewAgreement, 'quality-disagreement');
  assert.ok(timing.reason.startsWith('两次审查对正文质量结论不一致'));
  assert.ok(timing.reason.endsWith('第二次审查：pass-reason'));
  assert.deepEqual(timing.findings, ['needs_revision-finding']);
  assert.equal(timing.reviewPasses, 2);
  assert.deepEqual(timing.previousReview, first);
  assert.equal(timing.outlineEstimateMismatch, false);
});

test('agreeing revision verdicts merge their findings', async () => {
  const { timing } = await ensureWith([
    verdict('needs_revision', 60, 80, { findings: ['a', 'b'] }),
    verdict('needs_revision', 70, 90, { findings: ['b', 'c'] }),
  ]);
  assert.equal(timing.reviewAgreement, 'overlapping-ranges');
  assert.equal(timing.reason, 'needs_revision-reason');
  assert.deepEqual(timing.findings, ['a', 'b', 'c']);
});

test('a pass below the spoken floor is rechecked', async () => {
  const floor = { scenes: [{ body: '旁白：' + '字'.repeat(500) }] };
  const run = async (reviews) => {
    const result = await ensureStoryEpisodeScriptTiming({
      scriptResult: floor,
      episode: {},
      review: async () => reviews.shift(),
    });
    return result.timingReview;
  };
  const accepted = await run([verdict('pass', 30, 60), verdict('pass', 50, 120)]);
  assert.equal(accepted.verdict, 'pass');
  assert.equal(accepted.reviewAgreement, 'overlapping-ranges');
  assert.equal(accepted.minimumSpokenDurationSeconds, 100);
  const below = await run([verdict('pass', 30, 60), verdict('pass', 40, 70)]);
  assert.equal(below.verdict, 'timing_uncertain');
  assert.equal(below.reviewAgreement, 'below-spoken-floor');
  assert.ok(below.reason.startsWith('两次模型审时均低于对白本身至少需要的 100 秒。'));
  assert.equal(below.findings.at(-1).includes('至少需要 100 秒'), true);
});

test('non-overlapping recheck ranges mark timing uncertain', async () => {
  const { timing } = await ensureWith([verdict('needs_revision', 60, 80), verdict('pass', 100, 120)]);
  assert.equal(timing.verdict, 'timing_uncertain');
  assert.equal(timing.reviewAgreement, 'conflicting-ranges');
  assert.ok(timing.reason.startsWith('两次独立审时区间不重叠：第一次 60-80 秒，第二次 100-120 秒。'));
  assert.deepEqual(timing.findings, ['第一次审时：needs_revision-reason']);
});

test('review failures preserve the script instead of blocking', async () => {
  const { timing } = await ensureWith([new Error('模型超时')]);
  assert.equal(timing.verdict, 'timing_uncertain');
  assert.equal(timing.reviewAgreement, 'review-unavailable');
  assert.equal(timing.reason, '时长审查未完成，已保留正文，不再阻塞本集。原因：模型超时');
});
