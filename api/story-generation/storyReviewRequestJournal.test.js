import test from 'node:test';
import assert from 'node:assert/strict';
import {
  requestStoryReviewRepairs,
  invokeCheckpointedStoryReview,
  assertStoryReviewResolved,
} from './storyReviewRequestJournal.js';

function makeRepairHarness() {
  const calls = { prompts: [], invokes: [], parses: [] };
  return {
    calls,
    buildPrompt: (chunk) => {
      calls.prompts.push(chunk.map((clip) => clip.ref));
      return 'prompt:' + chunk.map((clip) => clip.ref).join(',');
    },
    invoke: async (payload, stepId) => {
      calls.invokes.push([payload, stepId]);
      return { text: stepId };
    },
    parseResponse: (response, refs) => {
      calls.parses.push([response, refs]);
      return refs.map((ref) => [ref, response.text + '/' + ref]);
    },
  };
}

test('repairs are requested two clips at a time with chunked step ids', async () => {
  const harness = makeRepairHarness();
  const result = await requestStoryReviewRepairs({
    failedClips: [{ ref: 'a' }, { ref: 'b' }, { ref: 'c' }],
    buildPrompt: harness.buildPrompt,
    invoke: harness.invoke,
    parseResponse: harness.parseResponse,
    stepId: 'repair',
    systemPrompt: 'SYS',
  });
  assert.deepEqual(harness.calls.prompts, [['a', 'b'], ['c']]);
  assert.deepEqual(harness.calls.invokes, [
    [{ prompt: 'prompt:a,b', systemPrompt: 'SYS' }, 'repair:chunk-1'],
    [{ prompt: 'prompt:c', systemPrompt: 'SYS' }, 'repair:chunk-2'],
  ]);
  assert.deepEqual(
    harness.calls.parses.map(([, refs]) => refs),
    [['a', 'b'], ['c']],
  );
  assert.ok(result instanceof Map);
  assert.deepEqual(
    [...result],
    [
      ['a', 'repair:chunk-1/a'],
      ['b', 'repair:chunk-1/b'],
      ['c', 'repair:chunk-2/c'],
    ],
  );
});

test('two or fewer clips use the plain step id', async () => {
  const harness = makeRepairHarness();
  await requestStoryReviewRepairs({
    failedClips: [{ ref: 'a' }, { ref: 'b' }],
    buildPrompt: harness.buildPrompt,
    invoke: harness.invoke,
    parseResponse: harness.parseResponse,
    stepId: 'repair',
    systemPrompt: 'SYS',
  });
  assert.deepEqual(
    harness.calls.invokes.map(([, stepId]) => stepId),
    ['repair'],
  );
});

test('no failed clips means no requests and an empty map', async () => {
  const harness = makeRepairHarness();
  const result = await requestStoryReviewRepairs({
    failedClips: [],
    buildPrompt: harness.buildPrompt,
    invoke: harness.invoke,
    parseResponse: harness.parseResponse,
    stepId: 's',
  });
  assert.equal(result.size, 0);
  assert.equal(harness.calls.invokes.length, 0);
});

test('a journaled response is replayed without invoking', async () => {
  const draft = { responses: { k: '{"ok":1}' } };
  const result = await invokeCheckpointedStoryReview({
    draft,
    key: 'k',
    invoke: async () => assert.fail('must not invoke'),
    checkpoint: async () => assert.fail('must not checkpoint'),
  });
  assert.deepEqual(result, { text: '{"ok":1}' });
});

test('a fresh response is journaled as text and checkpointed', async () => {
  const draft = { responses: { old: 'x' } };
  const original = draft.responses;
  let checkpoints = 0;
  const response = { text: 'new-text', extra: 1 };
  const result = await invokeCheckpointedStoryReview({
    draft,
    key: 'k',
    invoke: async () => response,
    checkpoint: async () => {
      checkpoints += 1;
      assert.equal(draft.responses.k, 'new-text');
    },
  });
  assert.equal(result, response);
  assert.equal(checkpoints, 1);
  assert.deepEqual(draft.responses, { old: 'x', k: 'new-text' });
  assert.notEqual(draft.responses, original);
});

test('a failed invoke marks the draft retryable, checkpoints and rethrows', async () => {
  const draft = { status: 'running' };
  const failure = new Error('boom');
  let checkpoints = 0;
  await assert.rejects(
    invokeCheckpointedStoryReview({
      draft,
      key: 'k',
      invoke: async () => {
        throw failure;
      },
      checkpoint: async () => {
        checkpoints += 1;
      },
    }),
    failure,
  );
  assert.equal(draft.status, 'failed_retryable');
  assert.equal(failure.storyReviewInterrupted, true);
  assert.equal(checkpoints, 1);
  assert.equal(draft.responses, undefined);
});

test('assertStoryReviewResolved is a no-op when nothing is unresolved', () => {
  const draft = { status: 'running', responses: { a: 'x' }, batches: [] };
  assert.equal(assertStoryReviewResolved(draft, new Set()), undefined);
  assert.deepEqual(draft, { status: 'running', responses: { a: 'x' }, batches: [] });
});

test('unresolved clips reset their batches and abort with the clip list', () => {
  const draft = {
    status: 'running',
    completedClips: [1],
    responses: { a: 'x' },
    batches: [
      { clipRefs: ['a', 'b'], status: 'done', assessments: [] },
      { clipRefs: ['c'], status: 'done' },
      { clipRefs: ['d'], status: 'done' },
    ],
  };
  assert.throws(() => assertStoryReviewResolved(draft, new Set(['b', 'c'])), {
    message: '片段 b、c 尚未通过审片，已保留进度，可继续处理；未提交未通过的结果。',
  });
  assert.equal(draft.status, 'failed_retryable');
  assert.equal(draft.completedClips, null);
  assert.deepEqual(draft.responses, {});
  assert.deepEqual(
    draft.batches.map((batch) => batch.status),
    ['reviewed', 'pending', 'done'],
  );
});
