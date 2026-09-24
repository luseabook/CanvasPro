function normalizeText(_0x13089a) {
  return String(_0x13089a || '')['trim']();
}
export function buildStoryTextProviderProfilePayload(_0x2d821e) {
  const _0x1d3227 = normalizeText(_0x2d821e);
  return _0x1d3227 ? { providerProfileId: _0x1d3227 } : {};
}
export function assertPlanningModel(_0x3c5b37, _0x124208) {
  if (!normalizeText(_0x3c5b37) || !normalizeText(_0x124208)) throw new Error('请先选择可用的文本模型。');
}
export function getResultText(_0x1d493b) {
  if (typeof _0x1d493b === 'string') return _0x1d493b;
  return _0x1d493b?.['text'] || _0x1d493b?.['outputText'] || _0x1d493b?.['content'] || _0x1d493b || '';
}
function buildRetryPrompt(
  _0x422d1a,
  _0x378d25,
  _0x533b45,
  { instruction: instruction = '', rejectedResponse: rejectedResponse = '' } = {},
) {
  return JSON['stringify']({
    task: 'repair_invalid_agent_response',
    originalRequest: JSON['parse'](_0x422d1a),
    rejectionReason: normalizeText(_0x378d25?.['message'] || _0x378d25),
    ...(_0x378d25?.['validationDetails'] ? { validationDetails: _0x378d25['validationDetails'] } : {}),
    rejectedResponse: normalizeText(rejectedResponse),
    instruction: normalizeText(instruction) || '重新执行原任务，只返回符合要求的严格\x20JSON\x20对象。',
    outputContract: _0x533b45,
  });
}
export async function requestStrictResult({
  request: _0x5ebcff,
  requestPayload: _0x589779,
  parse: _0x1901f6,
  outputContract: _0x46cf67,
  maxAttempts: maxAttempts = 0x2,
  repairInstruction: repairInstruction = '',
  retryTemperature: _0x2bcade,
  resumeResponse: resumeResponse = null,
  onRequest: onRequest = null,
  onResponse: onResponse = null,
  onRequestError: onRequestError = null,
}) {
  const _0x5d71e9 = Math['max'](0x1, Math['floor'](Number(maxAttempts) || 0x1)),
    _0x278c2f = Math['max'](
      0x0,
      Math['min'](_0x5d71e9, Math['trunc'](Number(resumeResponse?.['attempt']) || 0x0)),
    );
  let _0x186a70 = _0x278c2f,
    _0xff120c = _0x278c2f > 0x0 ? resumeResponse?.['response'] : undefined,
    _0x4355a5 = _0x589779;
  while (_0x186a70 < _0x5d71e9 || _0xff120c !== undefined) {
    if (_0xff120c === undefined) {
      ((_0x186a70 += 0x1), await onRequest?.({ attempt: _0x186a70, requestPayload: _0x4355a5 }));
      try {
        _0xff120c = await _0x5ebcff(_0x4355a5);
      } catch (_0xb238d1) {
        await onRequestError?.({ attempt: _0x186a70, error: _0xb238d1, requestPayload: _0x4355a5 });
        throw _0xb238d1;
      }
      await onResponse?.({ attempt: _0x186a70, response: _0xff120c, requestPayload: _0x4355a5 });
    }
    try {
      return _0x1901f6(_0xff120c);
    } catch (_0x321cd7) {
      if (_0x186a70 >= _0x5d71e9) throw _0x321cd7;
      const _0x84d8aa = buildRetryPrompt(_0x589779['prompt'], _0x321cd7, _0x46cf67, {
        instruction: repairInstruction,
        rejectedResponse: getResultText(_0xff120c),
      });
      ((_0x4355a5 = {
        ..._0x589779,
        ...(Number['isFinite'](Number(_0x2bcade)) ? { temperature: Number(_0x2bcade) } : {}),
        prompt: _0x84d8aa,
      }),
        (_0xff120c = undefined));
    }
  }
  throw new Error('Agent\x20返回结果校验失败。');
}
