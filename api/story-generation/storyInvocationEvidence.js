import { withStoryRequestPolicy } from './storyRequestPolicy.js';
function classifyRequestFailure(_0x25f710) {
  return _0x25f710?.['safeToRetry'] === !![] || _0x25f710?.['requestSubmitted'] === ![]
    ? 'not-submitted'
    : 'outcome-unknown';
}
export function createStoryInvocationLifecycle(
  _0x9632db,
  _0x148216,
  { serializeResponse: serializeResponse = (_0x51ea5f) => _0x51ea5f } = {},
) {
  if (typeof _0x148216 !== 'function') return {};
  return {
    onRequest: ({ attempt: _0x31d082, requestPayload: _0xe5c94d }) =>
      _0x148216({ state: 'prepared', stepId: _0x9632db, attempt: _0x31d082, requestPayload: _0xe5c94d }),
    onResponse: ({ attempt: _0x5835d1, response: _0x34ab43, requestPayload: _0x28f32e }) =>
      _0x148216({
        state: 'completed',
        stepId: _0x9632db,
        attempt: _0x5835d1,
        requestPayload: _0x28f32e,
        rawResponse: serializeResponse(_0x34ab43),
      }),
    onRequestError: ({ attempt: _0x51480e, error: _0x25a303, requestPayload: _0x1158d5 }) =>
      _0x148216({
        state: classifyRequestFailure(_0x25a303),
        stepId: _0x9632db,
        attempt: _0x51480e,
        requestPayload: _0x1158d5,
        error: _0x25a303?.['message'] || String(_0x25a303 || '模型请求失败'),
      }),
  };
}
export async function invokeStoryGenerationRequest({
  request: _0x4e001b,
  requestPayload: _0x2b8cc6,
  stepId: _0x543ee4,
  attempt: _0xf9d89b,
  onInvocation: onInvocation = null,
  allowTruncatedOutput: allowTruncatedOutput = ![],
  serializeResponse: serializeResponse = (_0x4626cc) =>
    typeof _0x4626cc === 'string' ? _0x4626cc : (_0x4626cc?.['text'] ?? JSON['stringify'](_0x4626cc)),
} = {}) {
  _0x2b8cc6 = withStoryRequestPolicy(_0x2b8cc6);
  if (allowTruncatedOutput) _0x2b8cc6 = { ..._0x2b8cc6, allowTruncatedOutput: !![] };
  await onInvocation?.({
    state: 'prepared',
    stepId: _0x543ee4,
    attempt: _0xf9d89b,
    requestPayload: _0x2b8cc6,
  });
  let _0x23dbdc;
  const _0x228cbf = Date['now']();
  let _0x3fc0ec = null,
    _0x3bc7e1 = 0x0;
  const _0x432fda = (_0x368b83 = '') => ({
    elapsedMs: Date['now']() - _0x228cbf,
    firstTextMs: _0x3fc0ec,
    streamUpdates: _0x3bc7e1,
    responseCharacters: String(_0x368b83)['length'],
    responseBytes: new TextEncoder()['encode'](String(_0x368b83))['length'],
  });
  try {
    _0x23dbdc = await _0x4e001b({
      ..._0x2b8cc6,
      onText: (_0x4d7877) => {
        if (String(_0x4d7877)['trim']()) _0x3fc0ec ??= Date['now']() - _0x228cbf;
        ((_0x3bc7e1 += 0x1), _0x2b8cc6['onText']?.(_0x4d7877));
      },
    });
    const _0x3b72ff = String(_0x23dbdc?.['finishReason'] || '')['toLowerCase']();
    if (
      ['content_filter', 'incomplete']['includes'](_0x3b72ff) ||
      (!allowTruncatedOutput && ['length', 'max_tokens', 'max_output_tokens']['includes'](_0x3b72ff))
    )
      throw Object['assign'](new Error('模型输出未完整结束，已保留返回内容，未提交片段。'), {
        type: 'OUTPUT_TRUNCATED',
        partialText: serializeResponse(_0x23dbdc),
      });
  } catch (_0x28f93b) {
    await onInvocation?.({
      state: classifyRequestFailure(_0x28f93b),
      stepId: _0x543ee4,
      attempt: _0xf9d89b,
      requestPayload: _0x2b8cc6,
      error: _0x28f93b?.['message'] || String(_0x28f93b || '模型请求失败'),
      rawResponse: _0x28f93b?.['partialText'] || '',
      metrics: _0x432fda(_0x28f93b?.['partialText'] || ''),
    });
    throw _0x28f93b;
  }
  const _0x340acc = serializeResponse(_0x23dbdc);
  return (
    await onInvocation?.({
      state: 'completed',
      stepId: _0x543ee4,
      attempt: _0xf9d89b,
      requestPayload: _0x2b8cc6,
      rawResponse: _0x340acc,
      metrics: _0x432fda(_0x340acc),
    }),
    _0x23dbdc
  );
}
