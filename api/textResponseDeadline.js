export function createTextResponseDeadline(
  _0x2b2148,
  {
    timeoutMs: timeoutMs = null,
    firstChunkTimeoutMs: firstChunkTimeoutMs = null,
    idleTimeoutMs: idleTimeoutMs = null,
    signal: _0x402833,
  } = {},
) {
  let _0x381480 = null,
    _0x58480f = null,
    _0xc73180 = null;
  const _0x10a4bd = (_0x33ab0f) => {
      if (_0x381480) return;
      ((_0x381480 = _0x33ab0f), void _0x2b2148['cancel']()['catch'](() => {}));
    },
    _0x261d9a = (_0x4599a5) =>
      _0x10a4bd(
        Object['assign'](new Error('文本请求' + _0x4599a5 + '超时，未提交不完整结果'), {
          type: 'TIMEOUT',
          timeoutPhase: _0x4599a5,
        }),
      ),
    _0x4b7c75 = timeoutMs == null ? null : setTimeout(() => _0x261d9a('总时长'), Math['max'](0x1, timeoutMs));
  if (firstChunkTimeoutMs != null)
    _0xc73180 = setTimeout(() => _0x261d9a('首次响应'), Math['max'](0x1, firstChunkTimeoutMs));
  const _0x38b3f5 = () => _0x10a4bd(new DOMException('Request aborted', 'AbortError'));
  _0x402833?.['addEventListener']('abort', _0x38b3f5, { once: !![] });
  if (_0x402833?.['aborted']) _0x38b3f5();
  return {
    activity() {
      (clearTimeout(_0xc73180), clearTimeout(_0x58480f));
      if (idleTimeoutMs != null)
        _0x58480f = setTimeout(() => _0x261d9a('输出停滞'), Math['max'](0x1, idleTimeoutMs));
    },
    check() {
      if (_0x381480) throw _0x381480;
    },
    dispose() {
      (clearTimeout(_0x4b7c75),
        clearTimeout(_0xc73180),
        clearTimeout(_0x58480f),
        _0x402833?.['removeEventListener']('abort', _0x38b3f5));
    },
  };
}
export async function readTextResponseBody(_0x2e67e9, _0x4d903c = {}) {
  const _0x23fd5e = _0x2e67e9['body']?.['getReader']();
  if (!_0x23fd5e) return '';
  const _0x2714fd = createTextResponseDeadline(_0x23fd5e, _0x4d903c),
    _0x4e59a5 = new TextDecoder();
  let _0x3c0fd3 = '';
  try {
    while (!![]) {
      const { value: _0x3ce60b, done: _0x1b4dd6 } = await _0x23fd5e['read']();
      _0x2714fd['check']();
      if (_0x1b4dd6) return _0x3c0fd3 + _0x4e59a5['decode']();
      (_0x2714fd['activity'](), (_0x3c0fd3 += _0x4e59a5['decode'](_0x3ce60b, { stream: !![] })));
    }
  } catch (_0x4e43be) {
    _0x4e43be['partialText'] = _0x3c0fd3;
    throw _0x4e43be;
  } finally {
    (_0x2714fd['dispose'](), await _0x23fd5e['cancel']()['catch'](() => {}), _0x23fd5e['releaseLock']());
  }
}
