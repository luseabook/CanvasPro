import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryInvocationLifecycle, invokeStoryGenerationRequest } from './storyInvocationEvidence.js';

const POLICY = { stream: true, streamTimeouts: { idleMs: 180000, totalMs: 1800000 } };

test('lifecycle is empty without an invocation handler', () => {
  assert.deepEqual(createStoryInvocationLifecycle('s', null), {});
  assert.deepEqual(createStoryInvocationLifecycle('s'), {});
});

test('lifecycle forwards prepared and completed events', () => {
  const events = [];
  const lifecycle = createStoryInvocationLifecycle('summary', (event) => (events.push(event), 'ret'), {
    serializeResponse: (value) => 'S:' + value,
  });
  assert.deepEqual(Object.keys(lifecycle), ['onRequest', 'onResponse', 'onRequestError']);
  assert.equal(lifecycle.onRequest({ attempt: 1, requestPayload: { p: 1 } }), 'ret');
  lifecycle.onResponse({ attempt: 1, response: 'raw', requestPayload: { p: 1 } });
  assert.deepEqual(events, [
    { state: 'prepared', stepId: 'summary', attempt: 1, requestPayload: { p: 1 } },
    { state: 'completed', stepId: 'summary', attempt: 1, requestPayload: { p: 1 }, rawResponse: 'S:raw' },
  ]);
});

test('lifecycle response serialization defaults to identity', () => {
  const events = [];
  const response = { text: 'x' };
  createStoryInvocationLifecycle('s', (event) => events.push(event)).onResponse({ attempt: 2, response });
  assert.equal(events[0].rawResponse, response);
});

test('lifecycle classifies request failures', () => {
  const events = [];
  const lifecycle = createStoryInvocationLifecycle('s', (event) => events.push(event));
  lifecycle.onRequestError({ attempt: 1, error: Object.assign(new Error('a'), { safeToRetry: true }) });
  lifecycle.onRequestError({ attempt: 1, error: Object.assign(new Error('b'), { requestSubmitted: false }) });
  lifecycle.onRequestError({ attempt: 1, error: new Error('c') });
  lifecycle.onRequestError({ attempt: 1, error: 'plain' });
  lifecycle.onRequestError({ attempt: 1, error: null });
  assert.deepEqual(
    events.map((event) => [event.state, event.error]),
    [
      ['not-submitted', 'a'],
      ['not-submitted', 'b'],
      ['outcome-unknown', 'c'],
      ['outcome-unknown', 'plain'],
      ['outcome-unknown', '模型请求失败'],
    ],
  );
});

test('invoke applies the stream policy, tracks stream text and reports metrics', async () => {
  const events = [];
  const forwarded = [];
  let sentPayload;
  const response = await invokeStoryGenerationRequest({
    request: async (payload) => {
      sentPayload = payload;
      payload.onText('  ');
      payload.onText('你');
      payload.onText('好');
      return '你好';
    },
    requestPayload: { prompt: 'p', onText: (value) => forwarded.push(value) },
    stepId: 'step',
    attempt: 3,
    onInvocation: (event) => events.push(event),
  });
  assert.equal(response, '你好');
  assert.equal(sentPayload.stream, true);
  assert.deepEqual(sentPayload.streamTimeouts, POLICY.streamTimeouts);
  assert.equal('allowTruncatedOutput' in sentPayload, false);
  assert.deepEqual(forwarded, ['  ', '你', '好']);
  assert.deepEqual(
    events.map((event) => event.state),
    ['prepared', 'completed'],
  );
  assert.equal(events[0].stepId, 'step');
  assert.equal(events[0].attempt, 3);
  assert.equal(events[0].requestPayload.prompt, 'p');
  assert.equal(events[1].rawResponse, '你好');
  const { metrics } = events[1];
  assert.deepEqual(Object.keys(metrics), [
    'elapsedMs',
    'firstTextMs',
    'streamUpdates',
    'responseCharacters',
    'responseBytes',
  ]);
  assert.equal(metrics.streamUpdates, 3);
  assert.equal(typeof metrics.firstTextMs, 'number');
  assert.equal(metrics.responseCharacters, 2);
  assert.equal(metrics.responseBytes, 6);
});

test('first-text timing stays null when no visible text streams', async () => {
  const events = [];
  await invokeStoryGenerationRequest({
    request: async () => 'x',
    requestPayload: {},
    onInvocation: (event) => events.push(event),
  });
  assert.equal(events[1].metrics.firstTextMs, null);
  assert.equal(events[1].metrics.streamUpdates, 0);
});

test('default serialization uses text, else JSON', async () => {
  const events = [];
  await invokeStoryGenerationRequest({
    request: async () => ({ text: 'T', finishReason: 'stop' }),
    requestPayload: {},
    onInvocation: (event) => events.push(event),
  });
  await invokeStoryGenerationRequest({
    request: async () => ({ value: 1 }),
    requestPayload: {},
    onInvocation: (event) => events.push(event),
  });
  assert.deepEqual(
    events.filter((event) => event.state === 'completed').map((event) => event.rawResponse),
    ['T', '{"value":1}'],
  );
});

test('truncated output is rejected with partial text unless explicitly allowed', async () => {
  for (const finishReason of ['length', 'MAX_TOKENS', 'max_output_tokens']) {
    const events = [];
    await assert.rejects(
      invokeStoryGenerationRequest({
        request: async () => ({ text: '半截', finishReason }),
        requestPayload: {},
        onInvocation: (event) => events.push(event),
      }),
      (error) => {
        assert.equal(error.message, '模型输出未完整结束，已保留返回内容，未提交片段。');
        assert.equal(error.type, 'OUTPUT_TRUNCATED');
        assert.equal(error.partialText, '半截');
        return true;
      },
    );
    assert.equal(events[1].state, 'outcome-unknown');
    assert.equal(events[1].rawResponse, '半截');
    assert.equal(events[1].metrics.responseCharacters, 2);
  }
  let sentPayload;
  const allowed = await invokeStoryGenerationRequest({
    request: async (payload) => ((sentPayload = payload), { text: '半截', finishReason: 'length' }),
    requestPayload: {},
    allowTruncatedOutput: true,
  });
  assert.equal(allowed.text, '半截');
  assert.equal(sentPayload.allowTruncatedOutput, true);
});

test('filtered or incomplete output is always rejected', async () => {
  for (const finishReason of ['content_filter', 'incomplete']) {
    await assert.rejects(
      invokeStoryGenerationRequest({
        request: async () => ({ text: 'x', finishReason }),
        requestPayload: {},
        allowTruncatedOutput: true,
      }),
      { type: 'OUTPUT_TRUNCATED' },
    );
  }
});

test('request errors are classified and rethrown', async () => {
  const events = [];
  const failure = Object.assign(new Error('offline'), { safeToRetry: true });
  await assert.rejects(
    invokeStoryGenerationRequest({
      request: async () => {
        throw failure;
      },
      requestPayload: {},
      stepId: 's',
      attempt: 1,
      onInvocation: (event) => events.push(event),
    }),
    failure,
  );
  assert.equal(events[1].state, 'not-submitted');
  assert.equal(events[1].error, 'offline');
  assert.equal(events[1].rawResponse, '');
  assert.equal(events[1].metrics.responseBytes, 0);
});

test('a missing request function surfaces as a TypeError', async () => {
  await assert.rejects(invokeStoryGenerationRequest(), TypeError);
});
