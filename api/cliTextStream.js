import { buildApiUrl } from './apiBase.js';
import { readTextEventStream } from './textEventStream.js';
export async function requestCliTextStream(
  _0xdc6dde,
  { onText: _0x546809, signal: _0x5a5a69, timeoutMs: timeoutMs = 0x1e848 },
) {
  const _0x52a0d8 = new AbortController(),
    _0x5aef43 = () => _0x52a0d8['abort']();
  _0x5a5a69?.['addEventListener']('abort', _0x5aef43, { once: !![] });
  if (_0x5a5a69?.['aborted']) _0x5aef43();
  const _0xfb480c = timeoutMs == null ? null : setTimeout(_0x5aef43, timeoutMs);
  try {
    const _0x4c5b87 = await fetch(buildApiUrl('/api/v2/cli-providers/generate-text'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON['stringify']({ ..._0xdc6dde, stream: !![] }),
      signal: _0x52a0d8['signal'],
    });
    if (!_0x4c5b87['ok'] || !_0x4c5b87['headers']['get']('content-type')?.['includes']('text/event-stream')) {
      const _0x3db17a = await _0x4c5b87['json']();
      throw new Error(
        _0x3db17a['error']?.['message'] ||
          _0x3db17a['error'] ||
          _0x3db17a['message'] ||
          'CLI 流式接口不可用，请重启应用后重试',
      );
    }
    const _0x345db1 = await readTextEventStream(_0x4c5b87, {
      onText: _0x546809,
      signal: _0x52a0d8['signal'],
    });
    return { text: _0x345db1['text'], provider: _0xdc6dde['provider'] };
  } catch (_0x4c9a2d) {
    if (_0x52a0d8['signal']['aborted'] && !_0x5a5a69?.['aborted'])
      throw new Error('CLI 回答超时，已保留收到的内容');
    throw _0x4c9a2d;
  } finally {
    (clearTimeout(_0xfb480c), _0x5a5a69?.['removeEventListener']('abort', _0x5aef43));
  }
}
