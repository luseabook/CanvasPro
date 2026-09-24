import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseReviewResponse,
  parseRepairResponse,
  requestStoryReviewOutput,
} from './storyReviewOutputContract.js';

const CONTEXT = { episodeRef: 'e1', batchRef: 'b1', clipRefs: ['a', 'b'] };
const pass = (clipRef) => ({ clipRef, verdict: 'pass', issues: [] });
const review = (assessments, extra = {}) =>
  JSON.stringify({ episodeRef: 'e1', batchRef: 'b1', assessments, ...extra });

test('parseReviewResponse returns normalized assessments in clip order', () => {
  const result = parseReviewResponse(
    {
      text: review([
        {
          clipRef: ' b ',
          verdict: 'repair',
          issues: [{ reason: ' 太快 ' }, { code: 'x' }, { code: 'pace', repairInstruction: '放慢' }],
        },
        { clipRef: 'a', verdict: 'pass', issues: null },
      ]),
    },
    CONTEXT,
  );
  assert.deepEqual(result, [
    { clipRef: 'a', verdict: 'pass', issues: [] },
    {
      clipRef: 'b',
      verdict: 'repair',
      issues: [
        { code: 'other', reason: '太快', repairInstruction: '' },
        { code: 'pace', reason: '', repairInstruction: '放慢' },
      ],
    },
  ]);
});

test('parseReviewResponse checks episode and batch identity', () => {
  assert.throws(() => parseReviewResponse(JSON.stringify({ batchRef: 'b1', assessments: [] }), CONTEXT), {
    message: '审片结果缺少 episodeRef。',
  });
  assert.throws(() => parseReviewResponse(review([], { episodeRef: 'e2' }), CONTEXT), {
    message: '审片结果与当前分集不一致。',
  });
  assert.throws(() => parseReviewResponse(review([], { batchRef: 'b2' }), CONTEXT), {
    message: '审片结果与当前批次不一致。',
  });
  assert.throws(() => parseReviewResponse(review('x'), CONTEXT), {
    message: '审片结果缺少 assessments 数组。',
  });
  assert.throws(() => parseReviewResponse('', CONTEXT), { message: '审片 Agent 未返回有效 JSON。' });
});

test('clips outside the batch are fatal for reviews', () => {
  assert.throws(() => parseReviewResponse(review([pass('a'), pass('b'), pass('z')]), CONTEXT), {
    message: '审片结果包含当前批次之外的片段 z。',
  });
  assert.throws(() => parseReviewResponse(review([pass('a'), pass('b'), {}]), CONTEXT), {
    message: '审片结果包含当前批次之外的片段 （空引用）。',
  });
});

test('missing, duplicate and invalid assessments are reported together', () => {
  assert.throws(() => parseReviewResponse(review([pass('a'), pass('a')]), CONTEXT), {
    message: '审片结果包含重复片段引用 a。；审片结果遗漏片段 b。',
  });
  assert.throws(
    () =>
      parseReviewResponse(
        review([
          { clipRef: 'a', verdict: 'repair', issues: [{ code: 'only-code' }] },
          { clipRef: 'b', verdict: 'maybe' },
        ]),
        CONTEXT,
      ),
    { message: '片段 a 的审片结论无效，不能视为通过。；片段 b 的审片结论无效，不能视为通过。' },
  );
});

test('assessment shape rules', () => {
  assert.throws(
    () => parseReviewResponse(review([{ clipRef: 'a', verdict: 'pass', issues: 'x' }, pass('b')]), CONTEXT),
    {
      message: '片段 a 的 issues 必须是数组。',
    },
  );
  assert.throws(
    () => parseReviewResponse(review([{ clipRef: 'a', verdict: 'pass', issues: [{}] }, pass('b')]), CONTEXT),
    {
      message: '片段 a 的审片结论与问题列表矛盾。',
    },
  );
});

test('parseRepairResponse maps each failed clip to its replacement clips', () => {
  const response = JSON.stringify({
    episodeRef: 'e1',
    repairs: [
      { sourceClipRef: 'a', clips: [{ ref: 'a-part-1' }] },
      { sourceClipRef: 'x', clips: [] },
    ],
  });
  const result = parseRepairResponse(response, { episodeRef: 'e1', failedClipRefs: ['a'] });
  assert.deepEqual([...result], [['a', [{ ref: 'a-part-1' }]]]);
  assert.throws(
    () =>
      parseRepairResponse(
        JSON.stringify({ episodeRef: 'e1', repairs: [{ sourceClipRef: 'a', clips: [] }] }),
        { episodeRef: 'e1', failedClipRefs: ['a'] },
      ),
    { message: '片段 a 的修复结果缺少 clips。' },
  );
  assert.throws(() => parseRepairResponse('', { episodeRef: 'e1', failedClipRefs: ['a'] }), {
    message: '修复 Agent 未返回有效 JSON。',
  });
});

function makeReviewRun(responses, draft = {}) {
  const invokes = [];
  const progress = [];
  let checkpoints = 0;
  const payload = {
    model: 'm',
    prompt: JSON.stringify({
      task: 'review_story_episode_split_quality',
      episodeRef: 'e1',
      batchRef: 'b1',
      clips: [{ ref: 'a' }, { ref: 'b' }],
    }),
  };
  const run = () =>
    requestStoryReviewOutput({
      payload,
      stepId: 'review',
      key: 'k',
      draft,
      invoke: async (requestPayload, stepId) => {
        invokes.push([JSON.parse(requestPayload.prompt), stepId, requestPayload.model]);
        return responses.shift();
      },
      checkpoint: async () => {
        checkpoints += 1;
      },
      onProgress: (event) => progress.push(event),
    });
  return { run, invokes, progress, draft, checkpoints: () => checkpoints };
}

test('review protocol completion re-asks only for missing clips', async () => {
  const harness = makeReviewRun([review([pass('a')]), review([pass('b')])]);
  const result = await harness.run();
  assert.deepEqual(JSON.parse(result.text), {
    episodeRef: 'e1',
    batchRef: 'b1',
    assessments: [pass('a'), pass('b')],
  });
  assert.equal(harness.invokes.length, 2);
  const [first, second] = harness.invokes;
  assert.equal(first[1], 'review:protocol-0');
  assert.equal(first[2], 'm');
  assert.deepEqual(first[0].requiredClipRefs, ['a', 'b']);
  assert.equal('protocolCorrection' in first[0], false);
  assert.equal(first[0].outputTemplate.assessments.length, 2);
  assert.equal(second[1], 'review:protocol-1');
  assert.deepEqual(second[0].clips, [{ ref: 'b' }]);
  assert.deepEqual(second[0].requiredClipRefs, ['b']);
  assert.deepEqual(second[0].protocolCorrection.errors, ['审片结果遗漏片段 b。']);
  assert.deepEqual(harness.progress, [
    { stage: 'reviewing-episode-split-quality', message: '正在补全审片返回格式，剩余 1 个片段（本轮 2/3）' },
  ]);
  assert.deepEqual(harness.draft.protocolProgress, {});
  assert.equal(harness.checkpoints(), 3);
});

test('thrown inspection errors are carried into the next round', async () => {
  const harness = makeReviewRun([
    review([pass('a'), pass('b')], { episodeRef: 'e9' }),
    review([pass('a'), pass('b')]),
  ]);
  await harness.run();
  assert.deepEqual(harness.invokes[1][0].protocolCorrection.errors, ['审片结果与当前分集不一致。']);
});

test('three failed rounds abort with a resumable protocol error', async () => {
  const bad = review([]);
  const harness = makeReviewRun([bad, bad, bad, bad]);
  await assert.rejects(harness.run(), (error) => {
    assert.equal(error.code, 'STORY_REVIEW_PROTOCOL');
    assert.ok(error.message.startsWith('审片协议补全达到本轮上限，未解决片段 a、b：审片结果遗漏片段 a。'));
    return true;
  });
  assert.equal(harness.invokes.length, 3);
  assert.equal(harness.draft.protocolProgress.k.attempt, 3);
});

test('saved progress resumes with the remaining clips and attempt counter', async () => {
  const draft = { protocolProgress: { k: { accepted: { a: pass('a') }, attempt: 2, errors: ['旧错误'] } } };
  const harness = makeReviewRun([review([pass('b')])], draft);
  const result = await harness.run();
  assert.equal(harness.invokes.length, 1);
  assert.equal(harness.invokes[0][1], 'review:protocol-2');
  assert.deepEqual(harness.invokes[0][0].requiredClipRefs, ['b']);
  assert.equal(harness.progress[0].message, '正在补全审片返回格式，剩余 1 个片段（本轮 1/3）');
  assert.deepEqual(JSON.parse(result.text).assessments, [pass('a'), pass('b')]);
});

test('repair protocol returns repairs without a batch ref', async () => {
  const invokes = [];
  const draft = {};
  const payload = {
    prompt: JSON.stringify({
      task: 'repair_story_episode_split_quality',
      episodeRef: 'e1',
      batchRef: 'ignored',
      failedClips: [{ clip: { ref: 'a', visual: '旧' } }],
    }),
  };
  const result = await requestStoryReviewOutput({
    payload,
    stepId: 'repair',
    key: 'r',
    draft,
    invoke: async (requestPayload) => {
      invokes.push(JSON.parse(requestPayload.prompt));
      return JSON.stringify({
        episodeRef: 'e1',
        repairs: [{ sourceClipRef: 'a', clips: [{ ref: 'a-part-1' }] }],
      });
    },
    checkpoint: async () => {},
  });
  assert.deepEqual(invokes[0].outputTemplate, {
    episodeRef: 'e1',
    repairs: [{ sourceClipRef: 'a', clips: [{ ref: 'a-part-1', visual: '旧' }] }],
  });
  assert.deepEqual(JSON.parse(result.text), {
    episodeRef: 'e1',
    repairs: [{ sourceClipRef: 'a', clips: [{ ref: 'a-part-1' }] }],
  });
});
