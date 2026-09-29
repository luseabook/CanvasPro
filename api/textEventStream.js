import { createTextResponseDeadline } from './textResponseDeadline.js';
export function visibleTextStreamContent(_0x435648) {
  let _0x3eff18 = String(_0x435648 || '')['replace'](/<think>[\s\S]*?(?:<\/think>\n?|$)/gu, '');
  for (let _0x4c4ae6 = Math['min'](0x6, _0x3eff18['length']); _0x4c4ae6 > 0x0; _0x4c4ae6--) {
    if ('<think>'['startsWith'](_0x3eff18['slice'](-_0x4c4ae6))) {
      _0x3eff18 = _0x3eff18['slice'](0x0, -_0x4c4ae6);
      break;
    }
  }
  return _0x3eff18;
}
export function enableTextRequestStreaming(_0x5c4ec9, _0x2e6a54, _0x3928e0 = ![]) {
  if (typeof _0x2e6a54 !== 'function' && _0x3928e0 !== !![]) return _0x5c4ec9;
  const _0x222f21 = String(_0x5c4ec9?.['body']?.['apiUrl'] || _0x5c4ec9?.['url'] || '');
  if (/:generateContent(?:\?|$)/u['test'](_0x222f21) && Array['isArray'](_0x5c4ec9['body']?.['contents'])) {
    const _0xf463f9 = new URL(_0x222f21['replace'](':generateContent', ':streamGenerateContent'));
    return (
      _0xf463f9['searchParams']['set']('alt', 'sse'),
      _0x5c4ec9['isProxy']
        ? { ..._0x5c4ec9, textStream: !![], body: { ..._0x5c4ec9['body'], apiUrl: _0xf463f9['href'] } }
        : { ..._0x5c4ec9, textStream: !![], url: _0xf463f9['href'] }
    );
  }
  const _0x21fc3b = String(_0x5c4ec9?.['body']?.['apiUrl'] || _0x5c4ec9?.['url'] || '')['split']('?')[0x0],
    _0x374bb4 =
      /(?:\/chat\/completions|\/responses|\/proxy\/completions)\/?$/u['test'](_0x21fc3b) ||
      _0x5c4ec9?.['url'] === '/api/v2/proxy/completions';
  if (
    (typeof _0x2e6a54 !== 'function' && _0x3928e0 !== !![]) ||
    !_0x374bb4 ||
    !(Array['isArray'](_0x5c4ec9['body']?.['messages']) || Array['isArray'](_0x5c4ec9['body']?.['input']))
  )
    return _0x5c4ec9;
  return { ..._0x5c4ec9, body: { ..._0x5c4ec9['body'], stream: !![] } };
}
export function shouldRetryWithoutTextStreaming(_0x17c0a0, _0x4c9605, _0x5395d0) {
  return (
    _0x17c0a0?.['body']?.['stream'] === !![] &&
    [0x190, 0x1a6]['includes'](_0x4c9605) &&
    /\bstream(?:ing)?\b|流式/iu['test'](_0x5395d0) &&
    /not supported|unsupported|not available|must be false|不支持|不允许/iu['test'](_0x5395d0)
  );
}
export async function readTextEventStream(
  _0x3dae40,
  {
    onText: _0x246331,
    signal: _0x176956,
    timeoutMs: timeoutMs = null,
    firstChunkTimeoutMs: firstChunkTimeoutMs = null,
    idleTimeoutMs: idleTimeoutMs = null,
    allowTruncatedOutput: allowTruncatedOutput = ![],
  } = {},
) {
  const _0x5e8567 = _0x3dae40['body']['getReader'](),
    _0xdf41b = new TextDecoder();
  let _0x477781 = '',
    _0x54c94e = '',
    _0xba0fa2 = ![],
    _0x4b9ef3 = '',
    _0x755b85 = null;
  const _0x1a3a00 = createTextResponseDeadline(_0x5e8567, {
    signal: _0x176956,
    timeoutMs: timeoutMs,
    firstChunkTimeoutMs: firstChunkTimeoutMs,
    idleTimeoutMs: idleTimeoutMs,
  });
  function _0x29a184(_0x2e5141) {
    const _0x4b4574 = _0x2e5141['split'](/\r?\n/u)
      ['filter']((_0xa1a936) => _0xa1a936['startsWith']('data:'))
      ['map']((_0x217b13) => _0x217b13['slice'](0x5)['replace'](/^ /u, ''))
      ['join']('\x0a');
    if (!_0x4b4574['trim']()) return;
    if (_0x4b4574['trim']() === '[DONE]') {
      _0xba0fa2 = !![];
      return;
    }
    const _0x1802b4 = JSON['parse'](_0x4b4574);
    if (_0x1802b4['error'] || ['error', 'response.failed']['includes'](_0x1802b4['type']))
      throw new Error(
        _0x1802b4['error']?.['message'] ||
          _0x1802b4['response']?.['error']?.['message'] ||
          '回答流中断，请重试',
      );
    const _0x440b51 = _0x1802b4['choices']?.['find']((_0x3de3d8) => !_0x3de3d8['index']) || null;
    let _0xe9ee36 = _0x440b51?.['delta']?.['content'];
    const _0x22e517 = _0x1802b4['candidates']?.['find']((_0x265f6c) => !_0x265f6c['index']);
    _0x22e517 &&
      ((_0xe9ee36 = (_0x22e517['content']?.['parts'] || [])
        ['filter']((_0xbaadc8) => _0xbaadc8['thought'] !== !![])
        ['map']((_0x5b5a9a) => (typeof _0x5b5a9a['text'] === 'string' ? _0x5b5a9a['text'] : ''))
        ['join']('')),
      (_0x755b85 = _0x1802b4));
    if (_0x1802b4['type'] === 'response.output_text.delta') _0xe9ee36 = _0x1802b4['delta'];
    if (typeof _0xe9ee36 === 'string' && _0xe9ee36) {
      _0x54c94e += _0xe9ee36;
      if (_0x54c94e['length'] > 0xf4240) throw new Error('回答超过长度限制，请分段生成');
      _0x246331?.(visibleTextStreamContent(_0x54c94e));
    }
    if (_0x440b51?.['finish_reason']) {
      _0x4b9ef3 = _0x440b51['finish_reason'];
      if (
        !['stop', 'end_turn']['includes'](_0x4b9ef3) &&
        !(allowTruncatedOutput && ['length', 'max_tokens', 'max_output_tokens']['includes'](_0x4b9ef3))
      )
        throw Object['assign'](new Error('回答未正常完成（' + _0x4b9ef3 + '），未提交不完整结果'), {
          type: 'OUTPUT_TRUNCATED',
        });
      _0xba0fa2 = !![];
    }
    if (_0x1802b4['promptFeedback']?.['blockReason'])
      throw new Error('回答被拦截（' + _0x1802b4['promptFeedback']['blockReason'] + '）');
    if (_0x22e517?.['finishReason']) {
      _0x4b9ef3 = _0x22e517['finishReason'];
      if (_0x4b9ef3 !== 'STOP')
        throw Object['assign'](new Error('回答未正常完成（' + _0x4b9ef3 + '），未提交不完整结果'), {
          type: 'OUTPUT_TRUNCATED',
        });
      _0xba0fa2 = !![];
    }
    if (_0x1802b4['type'] === 'response.incomplete') throw new Error('回答未完整结束，请重试或分段生成');
    _0x1802b4['type'] === 'response.completed' && ((_0xba0fa2 = !![]), (_0x755b85 = _0x1802b4['response']));
  }
  try {
    while (!![]) {
      const { value: _0x5a4e6a, done: _0x33d5c9 } = await _0x5e8567['read']();
      _0x1a3a00['check']();
      if (_0x5a4e6a?.['length']) _0x1a3a00['activity']();
      _0x477781 += _0x33d5c9 ? _0xdf41b['decode']() : _0xdf41b['decode'](_0x5a4e6a, { stream: !![] });
      let _0x28880e;
      while ((_0x28880e = /\r?\n\r?\n/u['exec'](_0x477781))) {
        (_0x29a184(_0x477781['slice'](0x0, _0x28880e['index'])),
          (_0x477781 = _0x477781['slice'](_0x28880e['index'] + _0x28880e[0x0]['length'])));
      }
      if (_0x477781['length'] > 0x1e8480) throw new Error('回答流格式异常');
      if (_0x33d5c9) break;
      if (_0xba0fa2 && _0x477781['trim']() === '') break;
    }
    if (_0x477781['trim']()) _0x29a184(_0x477781);
    if (!_0xba0fa2) throw new Error('回答流意外中断，未收到结束标记');
    const _0x42d4a7 = visibleTextStreamContent(_0x54c94e);
    if (!_0x42d4a7['trim']()) throw new Error('服务端未返回文本内容');
    return { text: _0x42d4a7, finishReason: _0x4b9ef3, finalResponse: _0x755b85 };
  } catch (_0x2d082c) {
    ((_0x2d082c['partialText'] = visibleTextStreamContent(_0x54c94e)),
      (_0x2d082c['finishReason'] = _0x4b9ef3));
    throw _0x2d082c;
  } finally {
    (_0x1a3a00['dispose'](), await _0x5e8567['cancel']()['catch'](() => {}), _0x5e8567['releaseLock']());
  }
}
