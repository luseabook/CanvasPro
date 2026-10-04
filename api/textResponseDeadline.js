export function createTextResponseDeadline(
  value,
  {
    timeoutMs: timeoutMs = null,
    firstChunkTimeoutMs: firstChunkTimeoutMs = null,
    idleTimeoutMs: idleTimeoutMs = null,
    signal: signal,
  } = {},
) {
  let item = null,
    setTimeout2 = null,
    setTimeout3 = null;
  const run = (key) => {
      if (item) return;
      ((item = key), void value['cancel']()['catch'](() => {}));
    },
    handler = (timeoutPhase) =>
      run(
        Object['assign'](new Error('文本请求' + timeoutPhase + '超时，未提交不完整结果'), {
          type: 'TIMEOUT',
          timeoutPhase: timeoutPhase,
        }),
      ),
    index = timeoutMs == null ? null : setTimeout(() => handler('总时长'), Math['max'](0x1, timeoutMs));
  if (firstChunkTimeoutMs != null)
    setTimeout3 = setTimeout(() => handler('首次响应'), Math['max'](0x1, firstChunkTimeoutMs));
  const run2 = () => run(new DOMException('Request aborted', 'AbortError'));
  signal?.['addEventListener']('abort', run2, { once: !![] });
  if (signal?.['aborted']) run2();
  return {
    activity() {
      (clearTimeout(setTimeout3), clearTimeout(setTimeout2));
      if (idleTimeoutMs != null)
        setTimeout2 = setTimeout(() => handler('输出停滞'), Math['max'](0x1, idleTimeoutMs));
    },
    check() {
      if (item) throw item;
    },
    dispose() {
      (clearTimeout(index),
        clearTimeout(setTimeout3),
        clearTimeout(setTimeout2),
        signal?.['removeEventListener']('abort', run2));
    },
  };
}
export async function readTextResponseBody(dom, result = {}) {
  const enabled = dom['body']?.['getReader']();
  if (!enabled) return '';
  const textResponseDeadline = createTextResponseDeadline(enabled, result),
    textDecoder = new TextDecoder();
  let data = '';
  try {
    while (!![]) {
      const { value: value2, done: done } = await enabled['read']();
      textResponseDeadline['check']();
      if (done) return data + textDecoder['decode']();
      (textResponseDeadline['activity'](), (data += textDecoder['decode'](value2, { stream: !![] })));
    }
  } catch (options) {
    options['partialText'] = data;
    throw options;
  } finally {
    (textResponseDeadline['dispose'](),
      await enabled['cancel']()['catch'](() => {}),
      enabled['releaseLock']());
  }
}
