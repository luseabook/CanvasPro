import { withStoryRequestPolicy } from './storyRequestPolicy.js';
function classifyRequestFailure(value) {
  return value?.['safeToRetry'] === !![] || value?.['requestSubmitted'] === ![]
    ? 'not-submitted'
    : 'outcome-unknown';
}
export function createStoryInvocationLifecycle(
  stepId,
  handler,
  { serializeResponse: serializeResponse = (item) => item } = {},
) {
  if (typeof handler !== 'function') return {};
  return {
    onRequest: ({ attempt: attempt, requestPayload: requestPayload }) =>
      handler({ state: 'prepared', stepId: stepId, attempt: attempt, requestPayload: requestPayload }),
    onResponse: ({ attempt: attempt2, response: response, requestPayload: requestPayload2 }) =>
      handler({
        state: 'completed',
        stepId: stepId,
        attempt: attempt2,
        requestPayload: requestPayload2,
        rawResponse: serializeResponse(response),
      }),
    onRequestError: ({ attempt: attempt3, error: error, requestPayload: requestPayload3 }) =>
      handler({
        state: classifyRequestFailure(error),
        stepId: stepId,
        attempt: attempt3,
        requestPayload: requestPayload3,
        error: error?.['message'] || String(error || '模型请求失败'),
      }),
  };
}
export async function invokeStoryGenerationRequest({
  request: request,
  requestPayload: requestPayload4,
  stepId: stepId2,
  attempt: attempt4,
  onInvocation: onInvocation = null,
  allowTruncatedOutput: allowTruncatedOutput = ![],
  serializeResponse: serializeResponse = (response2) =>
    typeof response2 === 'string' ? response2 : (response2?.['text'] ?? JSON['stringify'](response2)),
} = {}) {
  requestPayload4 = withStoryRequestPolicy(requestPayload4);
  if (allowTruncatedOutput) requestPayload4 = { ...requestPayload4, allowTruncatedOutput: !![] };
  await onInvocation?.({
    state: 'prepared',
    stepId: stepId2,
    attempt: attempt4,
    requestPayload: requestPayload4,
  });
  let key;
  const index = Date['now']();
  let firstTextMs = null,
    streamUpdates = 0x0;
  const metrics = (result = '') => ({
    elapsedMs: Date['now']() - index,
    firstTextMs: firstTextMs,
    streamUpdates: streamUpdates,
    responseCharacters: String(result)['length'],
    responseBytes: new TextEncoder()['encode'](String(result))['length'],
  });
  try {
    key = await request({
      ...requestPayload4,
      onText: (data) => {
        if (String(data)['trim']()) firstTextMs ??= Date['now']() - index;
        ((streamUpdates += 0x1), requestPayload4['onText']?.(data));
      },
    });
    const options = String(key?.['finishReason'] || '')['toLowerCase']();
    if (
      ['content_filter', 'incomplete']['includes'](options) ||
      (!allowTruncatedOutput && ['length', 'max_tokens', 'max_output_tokens']['includes'](options))
    )
      throw Object['assign'](new Error('模型输出未完整结束，已保留返回内容，未提交片段。'), {
        type: 'OUTPUT_TRUNCATED',
        partialText: serializeResponse(key),
      });
  } catch (error2) {
    await onInvocation?.({
      state: classifyRequestFailure(error2),
      stepId: stepId2,
      attempt: attempt4,
      requestPayload: requestPayload4,
      error: error2?.['message'] || String(error2 || '模型请求失败'),
      rawResponse: error2?.['partialText'] || '',
      metrics: metrics(error2?.['partialText'] || ''),
    });
    throw error2;
  }
  const rawResponse = serializeResponse(key);
  return (
    await onInvocation?.({
      state: 'completed',
      stepId: stepId2,
      attempt: attempt4,
      requestPayload: requestPayload4,
      rawResponse: rawResponse,
      metrics: metrics(rawResponse),
    }),
    key
  );
}
