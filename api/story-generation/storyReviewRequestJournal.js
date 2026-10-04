import { getResultText } from './storyTextRequest.js';
export async function requestStoryReviewRepairs({
  failedClips: failedClips,
  buildPrompt: buildPrompt,
  invoke: invoke,
  parseResponse: parseResponse,
  stepId: stepId,
  systemPrompt: systemPrompt,
}) {
  const map = new Map(),
    value = 0x2;
  for (let item = 0x0; item < failedClips['length']; item += value) {
    const list = failedClips['slice'](item, item + value),
      key = failedClips['length'] > value ? stepId + ':chunk-' + (item / value + 0x1) : stepId,
      index = await invoke({ prompt: buildPrompt(list), systemPrompt: systemPrompt }, key);
    for (const [result, data] of parseResponse(
      index,
      list['map']((options) => options['ref']),
    ))
      map['set'](result, data);
  }
  return map;
}
export async function invokeCheckpointedStoryReview({
  draft: draft,
  key: key2,
  invoke: invoke2,
  checkpoint: checkpoint,
}) {
  const text = draft['responses']?.[key2];
  if (typeof text === 'string') return { text: text };
  try {
    const target = await invoke2();
    return (
      (draft['responses'] = { ...(draft['responses'] || {}), [key2]: getResultText(target) }),
      await checkpoint(),
      target
    );
  } catch (source) {
    ((draft['status'] = 'failed_retryable'), (source['storyReviewInterrupted'] = !![]), await checkpoint());
    throw source;
  }
}
export function assertStoryReviewResolved(response, map2) {
  if (!map2['size']) return;
  ((response['status'] = 'failed_retryable'),
    (response['completedClips'] = null),
    (response['responses'] = {}));
  for (const response2 of response['batches']) {
    response2['clipRefs']['some']((next) => map2['has'](next)) &&
      (response2['status'] = Array['isArray'](response2['assessments']) ? 'reviewed' : 'pending');
  }
  throw new Error(
    '片段 ' + [...map2]['join']('、') + ' 尚未通过审片，已保留进度，可继续处理；未提交未通过的结果。',
  );
}
