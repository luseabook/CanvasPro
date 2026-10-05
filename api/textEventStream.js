import { createTextResponseDeadline } from './textResponseDeadline.js';
export function visibleTextStreamContent(value) {
  let list = String(value || '')['replace'](/<think>[\s\S]*?(?:<\/think>\n?|$)/gu, '');
  for (let count = Math['min'](6, list['length']); count > 0; count--) {
    if ('<think>'['startsWith'](list['slice'](-count))) {
      list = list['slice'](0, -count);
      break;
    }
  }
  return list;
}
export function enableTextRequestStreaming(dom, item, key = false) {
  if (typeof item !== 'function' && key !== true) return dom;
  const index = String(dom?.['body']?.['apiUrl'] || dom?.['url'] || '');
  if (/:generateContent(?:\?|$)/u['test'](index) && Array['isArray'](dom['body']?.['contents'])) {
    const apiUrl = new URL(index['replace'](':generateContent', ':streamGenerateContent'));
    return (
      apiUrl['searchParams']['set']('alt', 'sse'),
      dom['isProxy']
        ? { ...dom, textStream: true, body: { ...dom['body'], apiUrl: apiUrl['href'] } }
        : { ...dom, textStream: true, url: apiUrl['href'] }
    );
  }
  const result = String(dom?.['body']?.['apiUrl'] || dom?.['url'] || '')['split']('?')[0],
    enabled =
      /(?:\/chat\/completions|\/responses|\/proxy\/completions)\/?$/u['test'](result) ||
      dom?.['url'] === '/api/v2/proxy/completions';
  if (
    (typeof item !== 'function' && key !== true) ||
    !enabled ||
    !(Array['isArray'](dom['body']?.['messages']) || Array['isArray'](dom['body']?.['input']))
  )
    return dom;
  return { ...dom, body: { ...dom['body'], stream: true } };
}
export function shouldRetryWithoutTextStreaming(dom2, data, options) {
  return (
    dom2?.['body']?.['stream'] === true &&
    [400, 422]['includes'](data) &&
    /\bstream(?:ing)?\b|流式/iu['test'](options) &&
    /not supported|unsupported|not available|must be false|不支持|不允许/iu['test'](options)
  );
}
export async function readTextEventStream(
  dom3,
  {
    onText: onText,
    signal: signal,
    timeoutMs: timeoutMs = null,
    firstChunkTimeoutMs: firstChunkTimeoutMs = null,
    idleTimeoutMs: idleTimeoutMs = null,
    allowTruncatedOutput: allowTruncatedOutput = false,
  } = {},
) {
  const target = dom3['body']['getReader'](),
    textDecoder = new TextDecoder();
  let list2 = '',
    list3 = '',
    enabled2 = false,
    finishReason = '',
    finalResponse = null;
  const textResponseDeadline = createTextResponseDeadline(target, {
    signal: signal,
    timeoutMs: timeoutMs,
    firstChunkTimeoutMs: firstChunkTimeoutMs,
    idleTimeoutMs: idleTimeoutMs,
  });
  function run(source) {
    const enabled3 = source['split'](/\r?\n/u)
      ['filter']((next) => next['startsWith']('data:'))
      ['map']((list4) => list4['slice'](5)['replace'](/^ /u, ''))
      ['join']('\n');
    if (!enabled3['trim']()) return;
    if (enabled3['trim']() === '[DONE]') {
      enabled2 = true;
      return;
    }
    const current = JSON['parse'](enabled3);
    if (current['error'] || ['error', 'response.failed']['includes'](current['type']))
      throw new Error(
        current['error']?.['message'] || current['response']?.['error']?.['message'] || '回答流中断，请重试',
      );
    const entry = current['choices']?.['find']((enabled4) => !enabled4['index']) || null;
    let record = entry?.['delta']?.['content'];
    const payload = current['candidates']?.['find']((enabled5) => !enabled5['index']);
    payload &&
      ((record = (payload['content']?.['parts'] || [])
        ['filter']((handle) => handle['thought'] !== true)
        ['map']((response) => (typeof response['text'] === 'string' ? response['text'] : ''))
        ['join']('')),
      (finalResponse = current));
    if (current['type'] === 'response.output_text.delta') record = current['delta'];
    if (typeof record === 'string' && record) {
      list3 += record;
      if (list3['length'] > 1000000) throw new Error('回答超过长度限制，请分段生成');
      onText?.(visibleTextStreamContent(list3));
    }
    if (entry?.['finish_reason']) {
      finishReason = entry['finish_reason'];
      if (
        !['stop', 'end_turn']['includes'](finishReason) &&
        !(allowTruncatedOutput && ['length', 'max_tokens', 'max_output_tokens']['includes'](finishReason))
      )
        throw Object['assign'](new Error('回答未正常完成（' + finishReason + '），未提交不完整结果'), {
          type: 'OUTPUT_TRUNCATED',
        });
      enabled2 = true;
    }
    if (current['promptFeedback']?.['blockReason'])
      throw new Error('回答被拦截（' + current['promptFeedback']['blockReason'] + '）');
    if (payload?.['finishReason']) {
      finishReason = payload['finishReason'];
      if (finishReason !== 'STOP')
        throw Object['assign'](new Error('回答未正常完成（' + finishReason + '），未提交不完整结果'), {
          type: 'OUTPUT_TRUNCATED',
        });
      enabled2 = true;
    }
    if (current['type'] === 'response.incomplete') throw new Error('回答未完整结束，请重试或分段生成');
    current['type'] === 'response.completed' && ((enabled2 = true), (finalResponse = current['response']));
  }
  try {
    while (true) {
      const { value: value2, done: done } = await target['read']();
      textResponseDeadline['check']();
      if (value2?.['length']) textResponseDeadline['activity']();
      list2 += done ? textDecoder['decode']() : textDecoder['decode'](value2, { stream: true });
      let state;
      while ((state = /\r?\n\r?\n/u['exec'](list2))) {
        (run(list2['slice'](0, state['index'])),
          (list2 = list2['slice'](state['index'] + state[0]['length'])));
      }
      if (list2['length'] > 2000000) throw new Error('回答流格式异常');
      if (done) break;
      if (enabled2 && list2['trim']() === '') break;
    }
    if (list2['trim']()) run(list2);
    if (!enabled2) throw new Error('回答流意外中断，未收到结束标记');
    const text = visibleTextStreamContent(list3);
    if (!text['trim']()) throw new Error('服务端未返回文本内容');
    return { text: text, finishReason: finishReason, finalResponse: finalResponse };
  } catch (config) {
    ((config['partialText'] = visibleTextStreamContent(list3)), (config['finishReason'] = finishReason));
    throw config;
  } finally {
    (textResponseDeadline['dispose'](), await target['cancel']()['catch'](() => {}), target['releaseLock']());
  }
}
