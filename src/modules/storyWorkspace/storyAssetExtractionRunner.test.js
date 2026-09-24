import test from 'node:test';
import assert from 'node:assert/strict';
import { runStoryAssetExtractionToCompletion } from './storyAssetExtractionRunner.js';

const continuation = (draft) =>
  Object.assign(new Error('continue'), {
    type: 'ASSET_EXTRACTION_CONTINUE_REQUIRED',
    isContinuation: true,
    assetExtractionDraft: draft,
  });

test('execute is required', async () => {
  await assert.rejects(runStoryAssetExtractionToCompletion(), {
    name: 'TypeError',
    message: '素材提取自动续跑缺少 execute 函数。',
  });
});

test('a finished run returns the execute result', async () => {
  const seen = [];
  const result = await runStoryAssetExtractionToCompletion({
    initialResumeDraft: { status: 'x' },
    execute: async (draft) => (seen.push(draft), 'done'),
  });
  assert.equal(result, 'done');
  assert.deepEqual(seen, [{ status: 'x' }]);
});

test('continuations resume from the returned draft while progress advances', async () => {
  const drafts = [
    { status: 'running', progress: { current: 1, total: 3 } },
    { status: 'running', progress: { current: 2, total: 3 } },
  ];
  const seen = [];
  const continued = [];
  const result = await runStoryAssetExtractionToCompletion({
    execute: async (draft) => {
      seen.push(draft);
      if (seen.length <= drafts.length) throw continuation(drafts[seen.length - 1]);
      return 'complete';
    },
    onContinuation: async (draft, error) => continued.push([draft, error.type]),
  });
  assert.equal(result, 'complete');
  assert.deepEqual(seen, [null, drafts[0], drafts[1]]);
  assert.deepEqual(continued, [
    [drafts[0], 'ASSET_EXTRACTION_CONTINUE_REQUIRED'],
    [drafts[1], 'ASSET_EXTRACTION_CONTINUE_REQUIRED'],
  ]);
});

test('other errors and unflagged continuations are rethrown as is', async () => {
  const plain = new Error('boom');
  await assert.rejects(
    runStoryAssetExtractionToCompletion({
      execute: async () => {
        throw plain;
      },
    }),
    (error) => error === plain,
  );
  const unflagged = Object.assign(continuation({ status: 'x' }), { isContinuation: 'yes' });
  await assert.rejects(
    runStoryAssetExtractionToCompletion({
      execute: async () => {
        throw unflagged;
      },
    }),
    (error) => error === unflagged,
  );
});

test('continuations without a draft stop with a typed error', async () => {
  const error = continuation([]);
  await assert.rejects(
    runStoryAssetExtractionToCompletion({
      execute: async () => {
        throw error;
      },
    }),
    {
      type: 'ASSET_EXTRACTION_CONTINUATION_DRAFT_MISSING',
      message: '素材提取要求继续，但没有返回可恢复的检查点。',
      cause: error,
    },
  );
});

test('a continuation without new progress stops to avoid paying twice', async () => {
  const initial = {
    strategy: 's',
    completedAssets: [{ ref: 'b' }, { ref: 'a' }],
    inventoryBatches: [
      { id: 'i1', status: 'done', sourceSceneRefs: ['s2', 's1'], completedAssetRefs: ['b', 'a'] },
    ],
    progress: { current: '2.9', total: 4 },
    ignored: 'changes here do not count',
  };
  const same = {
    strategy: 's ',
    completedAssets: [{ id: 'a' }, { ref: 'b' }, {}],
    inventoryBatches: [
      { batchId: 'i1', status: 'done', sourceSceneRefs: ['s1', 's2', ''], completedAssetRefs: ['a', 'b'] },
    ],
    progress: { current: 2, total: 4 },
    ignored: 'different',
  };
  let calls = 0;
  await assert.rejects(
    runStoryAssetExtractionToCompletion({
      initialResumeDraft: initial,
      execute: async () => {
        calls += 1;
        throw continuation(same);
      },
    }),
    {
      type: 'ASSET_EXTRACTION_CONTINUATION_STALLED',
      message: '素材提取连续两轮没有产生新进度，已停止自动续跑以避免重复计费。',
    },
  );
  assert.equal(calls, 1);
});

test('inactive runs abort before and between executions', async () => {
  await assert.rejects(
    runStoryAssetExtractionToCompletion({ execute: async () => 'x', isActive: () => false }),
    {
      type: 'ASSET_EXTRACTION_ABORTED',
      message: '素材提取所属项目已切换或任务已结束。',
    },
  );
  let active = true;
  await assert.rejects(
    runStoryAssetExtractionToCompletion({
      execute: async () => {
        throw continuation({ status: 'running' });
      },
      onContinuation: () => {
        active = false;
      },
      isActive: () => active,
    }),
    { type: 'ASSET_EXTRACTION_ABORTED' },
  );
});
