import test from 'node:test';
import assert from 'node:assert/strict';
import { completeReplicationMissingClips } from './storyReplicationMissingClips.js';

function makeRequest() {
  return {
    model: 'm',
    prompt: JSON.stringify({
      task: 'replicate',
      sourceVideoEvidence: { segmentPlan: [{ ref: 's1' }, { ref: 's2' }, { ref: 's3' }] },
      timingContract: { clips: [{ ref: 's1' }, { ref: 's2' }, { ref: 's3' }] },
      requirements: ['r0'],
    }),
    structuredOutput: {
      schema: {
        properties: {
          clips: { minItems: 3, maxItems: 3, items: { properties: { ref: { type: 'string' } } } },
        },
      },
    },
  };
}

const partial = JSON.stringify({ title: 'T', clips: [{ ref: 's1', v: 1 }] });

test('responses that cannot be analysed are returned unchanged', async () => {
  const invoke = async () => assert.fail('must not invoke');
  const response = { text: partial };
  assert.equal(await completeReplicationMissingClips(response, { prompt: 'not json' }, invoke), response);
  assert.equal(await completeReplicationMissingClips('not json', makeRequest(), invoke), 'not json');
  const noPlan = { prompt: JSON.stringify({ sourceVideoEvidence: {} }) };
  assert.equal(await completeReplicationMissingClips(partial, noPlan, invoke), partial);
  const empty = JSON.stringify({ clips: [] });
  assert.equal(await completeReplicationMissingClips(empty, makeRequest(), invoke), empty);
});

test('unknown, duplicate or already complete clips are returned unchanged', async () => {
  const invoke = async () => assert.fail('must not invoke');
  for (const clips of [
    [{ ref: 's9' }],
    [{ ref: 's1' }, { ref: 's1' }],
    [{ ref: 's1' }, { ref: 's2' }, { ref: 's3' }],
  ]) {
    const response = JSON.stringify({ clips });
    assert.equal(await completeReplicationMissingClips(response, makeRequest(), invoke), response);
  }
});

test('missing clips are requested once and merged back in plan order', async () => {
  const request = makeRequest();
  const originalPrompt = request.prompt;
  let sent;
  const result = await completeReplicationMissingClips(partial, request, async (payload) => {
    sent = payload;
    return {
      text: JSON.stringify({
        clips: [
          { ref: 's3', v: 3 },
          { ref: 's2', v: 2 },
        ],
      }),
    };
  });
  assert.deepEqual(JSON.parse(result), {
    title: 'T',
    clips: [
      { ref: 's1', v: 1 },
      { ref: 's2', v: 2 },
      { ref: 's3', v: 3 },
    ],
  });
  const prompt = JSON.parse(sent.prompt);
  assert.equal(prompt.task, 'complete_missing_replication_clips');
  assert.deepEqual(prompt.sourceVideoEvidence.segmentPlan, [{ ref: 's2' }, { ref: 's3' }]);
  assert.deepEqual(prompt.timingContract.clips, [{ ref: 's2' }, { ref: 's3' }]);
  assert.equal(prompt.requirements.length, 2);
  assert.ok(prompt.requirements[1].startsWith('上次只返回了 s1。本次只补齐 s2、s3，每个编号恰好一次'));
  assert.equal(sent.model, 'm');
  assert.deepEqual(sent.structuredOutput.schema.properties.clips.minItems, 2);
  assert.deepEqual(sent.structuredOutput.schema.properties.clips.maxItems, 2);
  assert.deepEqual(sent.structuredOutput.schema.properties.clips.items.properties.ref, {
    type: 'string',
    enum: ['s2', 's3'],
  });
  assert.equal(request.prompt, originalPrompt);
  assert.equal(request.structuredOutput.schema.properties.clips.minItems, 3);
});

test('object responses keep their other fields', async () => {
  const response = { text: partial, finishReason: 'stop' };
  const result = await completeReplicationMissingClips(response, makeRequest(), async () =>
    JSON.stringify({ clips: [{ ref: 's2' }, { ref: 's3' }] }),
  );
  assert.equal(result.finishReason, 'stop');
  assert.deepEqual(
    JSON.parse(result.text).clips.map((clip) => clip.ref),
    ['s1', 's2', 's3'],
  );
});

test('requests without timing contract or schema still work', async () => {
  const request = {
    prompt: JSON.stringify({ sourceVideoEvidence: { segmentPlan: [{ ref: 's1' }, { ref: 's2' }] } }),
  };
  let sent;
  await completeReplicationMissingClips(
    partial,
    request,
    async (payload) => ((sent = payload), '{"clips":[{"ref":"s2"}]}'),
  );
  const prompt = JSON.parse(sent.prompt);
  assert.equal('timingContract' in prompt, false);
  assert.equal(prompt.requirements.length, 1);
  assert.equal('structuredOutput' in sent, false);
});

function assertMissingClipsError(error, message) {
  assert.equal(error.code, 'REPLICATION_MISSING_CLIPS');
  assert.equal(error.partialResponse, partial);
  assert.deepEqual(error.missingClipRefs, ['s2', 's3']);
  assert.ok(error.message.startsWith(message), error.message);
  return true;
}

test('an unparseable completion keeps the partial response on the error', async () => {
  await assert.rejects(
    completeReplicationMissingClips(partial, makeRequest(), async () => 'garbage'),
    (error) => {
      assertMissingClipsError(error, '缺失片段补生成未完成，已返回片段保留：');
      assert.ok(error.cause instanceof Error);
      return true;
    },
  );
});

test('a completion with the wrong count is not retried', async () => {
  await assert.rejects(
    completeReplicationMissingClips(partial, makeRequest(), async () => '{"clips":[{"ref":"s2"}]}'),
    (error) => assertMissingClipsError(error, '一次补生成后仍缺少片段，已返回内容保留，未继续重试。'),
  );
});

test('a completion with duplicate or foreign refs does not overwrite anything', async () => {
  for (const clips of [
    [{ ref: 's2' }, { ref: 's2' }],
    [{ ref: 's1' }, { ref: 's2' }],
  ]) {
    await assert.rejects(
      completeReplicationMissingClips(partial, makeRequest(), async () => JSON.stringify({ clips })),
      (error) => assertMissingClipsError(error, '补生成包含重复或非缺失片段编号，未覆盖已返回内容。'),
    );
  }
});
