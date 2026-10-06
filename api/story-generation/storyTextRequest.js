function normalizeText(value) {
  return String(value || '').trim();
}
export function buildStoryTextProviderProfilePayload(item) {
  const providerProfileId = normalizeText(item);
  return providerProfileId ? { providerProfileId: providerProfileId } : {};
}
export function assertPlanningModel(key, index) {
  if (!normalizeText(key) || !normalizeText(index)) throw new Error('请先选择可用的文本模型。');
}
export function getResultText(response) {
  if (typeof response === 'string') return response;
  return response?.text || response?.outputText || response?.content || response || '';
}
function buildRetryPrompt(
  result,
  validationDetails,
  outputContract,
  { instruction: instruction = '', rejectedResponse: rejectedResponse = '' } = {},
) {
  return JSON.stringify({
    task: 'repair_invalid_agent_response',
    originalRequest: JSON.parse(result),
    rejectionReason: normalizeText(validationDetails?.message || validationDetails),
    ...(validationDetails?.validationDetails
      ? { validationDetails: validationDetails.validationDetails }
      : {}),
    rejectedResponse: normalizeText(rejectedResponse),
    instruction: normalizeText(instruction) || '重新执行原任务，只返回符合要求的严格 JSON 对象。',
    outputContract: outputContract,
  });
}
export async function requestStrictResult({
  request: request,
  requestPayload: requestPayload,
  parse: parse,
  outputContract: outputContract2,
  maxAttempts: maxAttempts = 2,
  repairInstruction: repairInstruction = '',
  retryTemperature: retryTemperature,
  resumeResponse: resumeResponse = null,
  onRequest: onRequest = null,
  onResponse: onResponse = null,
  onRequestError: onRequestError = null,
}) {
  const data = Math.max(1, Math.floor(Number(maxAttempts) || 1)),
    count = Math.max(0, Math.min(data, Math.trunc(Number(resumeResponse?.attempt) || 0)));
  let attempt = count,
    response2 = count > 0 ? resumeResponse?.response : undefined,
    requestPayload2 = requestPayload;
  while (attempt < data || response2 !== undefined) {
    if (response2 === undefined) {
      ((attempt += 1), await onRequest?.({ attempt: attempt, requestPayload: requestPayload2 }));
      try {
        response2 = await request(requestPayload2);
      } catch (error) {
        await onRequestError?.({ attempt: attempt, error: error, requestPayload: requestPayload2 });
        throw error;
      }
      await onResponse?.({ attempt: attempt, response: response2, requestPayload: requestPayload2 });
    }
    try {
      return parse(response2);
    } catch (options) {
      if (attempt >= data) throw options;
      const prompt = buildRetryPrompt(requestPayload.prompt, options, outputContract2, {
        instruction: repairInstruction,
        rejectedResponse: getResultText(response2),
      });
      ((requestPayload2 = {
        ...requestPayload,
        ...(Number.isFinite(Number(retryTemperature)) ? { temperature: Number(retryTemperature) } : {}),
        prompt: prompt,
      }),
        (response2 = undefined));
    }
  }
  throw new Error('Agent 返回结果校验失败。');
}
