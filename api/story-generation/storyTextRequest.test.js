import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStoryTextProviderProfilePayload,
  assertPlanningModel,
  getResultText,
  requestStrictResult,
} from './storyTextRequest.js';

const parseJson = (response) => {
  const value = JSON.parse(getResultText(response));
  if (!value.ok) throw new Error('missing ok');
  return value;
};

test('buildStoryTextProviderProfilePayload trims the id and omits empty ids', () => {
  assert.deepEqual(buildStoryTextProviderProfilePayload(' p1 '), { providerProfileId: 'p1' });
  assert.deepEqual(buildStoryTextProviderProfilePayload(''), {});
  assert.deepEqual(buildStoryTextProviderProfilePayload('   '), {});
  assert.deepEqual(buildStoryTextProviderProfilePayload(), {});
});

test('assertPlanningModel requires both a model and a provider', () => {
  assert.doesNotThrow(() => assertPlanningModel('gpt', 'openai'));
  for (const [model, provider] of [
    ['', 'openai'],
    ['gpt', ''],
    [' ', ' '],
    [undefined, undefined],
  ]) {
    assert.throws(() => assertPlanningModel(model, provider), { message: '请先选择可用的文本模型。' });
  }
});

test('getResultText reads strings and text-like fields in priority order', () => {
  assert.equal(getResultText('raw'), 'raw');
  assert.equal(getResultText({ text: 'a', outputText: 'b', content: 'c' }), 'a');
  assert.equal(getResultText({ outputText: 'b', content: 'c' }), 'b');
  assert.equal(getResultText({ content: 'c' }), 'c');
  assert.equal(getResultText(null), '');
  assert.equal(getResultText(undefined), '');
  assert.equal(getResultText(0), '');
});

test('getResultText returns other objects as-is (source quirk)', () => {
  const response = { foo: 1 };
  assert.equal(getResultText(response), response);
});

test('requestStrictResult returns the parsed first response and fires callbacks', async () => {
  const events = [];
  const payload = { prompt: '{"q":1}', temperature: 0.7 };
  const result = await requestStrictResult({
    request: async (requestPayload) => {
      events.push(['request', requestPayload]);
      return { text: '{"ok":true}' };
    },
    requestPayload: payload,
    parse: parseJson,
    outputContract: 'ok boolean',
    onRequest: (event) => events.push(['onRequest', event]),
    onResponse: (event) => events.push(['onResponse', event]),
  });
  assert.deepEqual(result, { ok: true });
  assert.deepEqual(events, [
    ['onRequest', { attempt: 1, requestPayload: payload }],
    ['request', payload],
    ['onResponse', { attempt: 1, response: { text: '{"ok":true}' }, requestPayload: payload }],
  ]);
});

test('requestStrictResult retries once with a repair prompt after a parse failure', async () => {
  const payloads = [];
  const responses = [' {"ok":false} ', '{"ok":true}'];
  const payload = { model: 'm', prompt: '{"task":"x"}', temperature: 0.7 };
  const result = await requestStrictResult({
    request: async (requestPayload) => {
      payloads.push(requestPayload);
      return responses.shift();
    },
    requestPayload: payload,
    parse: parseJson,
    outputContract: 'ok boolean',
    retryTemperature: 0.2,
  });
  assert.deepEqual(result, { ok: true });
  assert.equal(payloads.length, 2);
  assert.equal(payloads[0], payload);
  assert.equal(payloads[1].model, 'm');
  assert.equal(payloads[1].temperature, 0.2);
  assert.deepEqual(JSON.parse(payloads[1].prompt), {
    task: 'repair_invalid_agent_response',
    originalRequest: { task: 'x' },
    rejectionReason: 'missing ok',
    rejectedResponse: '{"ok":false}',
    instruction: '重新执行原任务，只返回符合要求的严格 JSON 对象。',
    outputContract: 'ok boolean',
  });
});

test('repair prompt carries a custom instruction and validation details', async () => {
  const payloads = [];
  let calls = 0;
  await requestStrictResult({
    request: async (requestPayload) => {
      payloads.push(requestPayload);
      return 'r' + calls;
    },
    requestPayload: { prompt: '{}' },
    parse: () => {
      calls += 1;
      if (calls === 1) {
        const error = new Error('bad shape');
        error.validationDetails = ['scenes[0].body'];
        throw error;
      }
      return 'done';
    },
    outputContract: 'c',
    repairInstruction: ' 只修复 JSON ',
  });
  const retry = JSON.parse(payloads[1].prompt);
  assert.deepEqual(retry.validationDetails, ['scenes[0].body']);
  assert.equal(retry.instruction, '只修复 JSON');
  assert.equal(retry.rejectedResponse, 'r0');
});

test('retry keeps the original temperature when retryTemperature is undefined', async () => {
  const payloads = [];
  const responses = ['{"ok":false}', '{"ok":true}'];
  await requestStrictResult({
    request: async (requestPayload) => {
      payloads.push(requestPayload);
      return responses.shift();
    },
    requestPayload: { prompt: '{}', temperature: 0.7 },
    parse: parseJson,
  });
  assert.equal(payloads[1].temperature, 0.7);
});

test('retryTemperature null is coerced to 0 (source quirk)', async () => {
  const payloads = [];
  const responses = ['{"ok":false}', '{"ok":true}'];
  await requestStrictResult({
    request: async (requestPayload) => {
      payloads.push(requestPayload);
      return responses.shift();
    },
    requestPayload: { prompt: '{}', temperature: 0.7 },
    parse: parseJson,
    retryTemperature: null,
  });
  assert.equal(payloads[1].temperature, 0);
});

test('requestStrictResult rethrows the last parse error when attempts run out', async () => {
  let calls = 0;
  await assert.rejects(
    requestStrictResult({
      request: async () => {
        calls += 1;
        return '{"ok":false}';
      },
      requestPayload: { prompt: '{}' },
      parse: parseJson,
    }),
    { message: 'missing ok' },
  );
  assert.equal(calls, 2);
});

test('maxAttempts is floored to at least one attempt', async () => {
  for (const maxAttempts of [0, 'abc', 1.9]) {
    let calls = 0;
    await assert.rejects(
      requestStrictResult({
        request: async () => {
          calls += 1;
          return '{"ok":false}';
        },
        requestPayload: { prompt: '{}' },
        parse: parseJson,
        maxAttempts,
      }),
      { message: 'missing ok' },
    );
    assert.equal(calls, 1);
  }
});

test('a non-JSON original prompt fails on the retry path', async () => {
  await assert.rejects(
    requestStrictResult({
      request: async () => '{"ok":false}',
      requestPayload: { prompt: 'plain text' },
      parse: parseJson,
    }),
    SyntaxError,
  );
});

test('request errors are reported through onRequestError and rethrown', async () => {
  const failure = new Error('network down');
  const events = [];
  const payload = { prompt: '{}' };
  await assert.rejects(
    requestStrictResult({
      request: async () => {
        throw failure;
      },
      requestPayload: payload,
      parse: parseJson,
      onRequestError: (event) => events.push(event),
    }),
    failure,
  );
  assert.deepEqual(events, [{ attempt: 1, error: failure, requestPayload: payload }]);
});

test('resumeResponse parses a stored response without calling request', async () => {
  const result = await requestStrictResult({
    request: async () => assert.fail('request must not be called'),
    requestPayload: { prompt: '{}' },
    parse: parseJson,
    resumeResponse: { attempt: 1, response: '{"ok":true}' },
  });
  assert.deepEqual(result, { ok: true });
});

test('resumeResponse with attempt 0 is ignored', async () => {
  let calls = 0;
  const result = await requestStrictResult({
    request: async () => {
      calls += 1;
      return '{"ok":true}';
    },
    requestPayload: { prompt: '{}' },
    parse: parseJson,
    resumeResponse: { attempt: 0, response: '{"ok":false}' },
  });
  assert.deepEqual(result, { ok: true });
  assert.equal(calls, 1);
});

test('a failed resumed response on attempt 1 continues with one retry', async () => {
  const payloads = [];
  const result = await requestStrictResult({
    request: async (requestPayload) => {
      payloads.push(requestPayload);
      return '{"ok":true}';
    },
    requestPayload: { prompt: '{"a":1}' },
    parse: parseJson,
    resumeResponse: { attempt: 1, response: '{"ok":false}' },
  });
  assert.deepEqual(result, { ok: true });
  assert.equal(payloads.length, 1);
  assert.equal(JSON.parse(payloads[0].prompt).task, 'repair_invalid_agent_response');
});

test('resume attempts are clamped to maxAttempts', async () => {
  await assert.rejects(
    requestStrictResult({
      request: async () => assert.fail('request must not be called'),
      requestPayload: { prompt: '{}' },
      parse: parseJson,
      resumeResponse: { attempt: 5, response: '{"ok":false}' },
    }),
    { message: 'missing ok' },
  );
});

test('an exhausted resume without a response throws the generic failure', async () => {
  await assert.rejects(
    requestStrictResult({
      request: async () => assert.fail('request must not be called'),
      requestPayload: { prompt: '{}' },
      parse: parseJson,
      resumeResponse: { attempt: 2 },
    }),
    { message: 'Agent 返回结果校验失败。' },
  );
});
