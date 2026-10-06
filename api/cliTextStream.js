import { buildApiUrl } from './apiBase.js';
import { readTextEventStream } from './textEventStream.js';
export async function requestCliTextStream(
  provider,
  { onText: onText, signal: signal, timeoutMs: timeoutMs = 125000 },
) {
  const signal2 = new AbortController(),
    handler = () => signal2.abort();
  signal?.addEventListener('abort', handler, { once: true });
  if (signal?.aborted) handler();
  const value = timeoutMs == null ? null : setTimeout(handler, timeoutMs);
  try {
    const response = await fetch(buildApiUrl('/api/v2/cli-providers/generate-text'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ ...provider, stream: true }),
      signal: signal2.signal,
    });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/event-stream')) {
      const error = await response.json();
      throw new Error(
        error.error?.message ||
          error.error ||
          error.message ||
          'CLI 流式接口不可用，请重启应用后重试',
      );
    }
    const text = await readTextEventStream(response, {
      onText: onText,
      signal: signal2.signal,
    });
    return { text: text.text, provider: provider.provider };
  } catch (item) {
    if (signal2.signal.aborted && !signal?.aborted)
      throw new Error('CLI 回答超时，已保留收到的内容');
    throw item;
  } finally {
    (clearTimeout(value), signal?.removeEventListener('abort', handler));
  }
}
