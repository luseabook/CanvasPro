function normalizeSchemaName(_0x4a38d9) {
  const _0x5089ef = String(_0x4a38d9 || '')['trim']();
  if (!_0x5089ef || _0x5089ef['length'] > 0x40 || !/^[A-Za-z0-9_-]+$/['test'](_0x5089ef))
    throw new Error('结构化输出名称必须是\x201\x20至\x2064\x20位字母、数字、下划线或连字符。');
  return _0x5089ef;
}
export function normalizeTextStructuredOutput(_0x23906a) {
  if (_0x23906a == null) return null;
  if (!_0x23906a || typeof _0x23906a !== 'object' || Array['isArray'](_0x23906a))
    throw new Error('结构化输出配置必须是对象。');
  const _0x13bc1b = _0x23906a['schema'];
  if (!_0x13bc1b || typeof _0x13bc1b !== 'object' || Array['isArray'](_0x13bc1b))
    throw new Error('结构化输出配置缺少 JSON Schema。');
  return {
    name: normalizeSchemaName(_0x23906a['name']),
    schema: _0x13bc1b,
    strict: _0x23906a['strict'] !== ![],
    fallback: _0x23906a['fallback'] === 'prompt' ? 'prompt' : 'none',
  };
}
export function buildChatCompletionsStructuredOutput(_0x180a54, { mode: mode = 'json_schema' } = {}) {
  const _0x2c62b8 = normalizeTextStructuredOutput(_0x180a54);
  if (!_0x2c62b8) return {};
  if (mode === 'none') return {};
  if (mode === 'json_object') return { response_format: { type: 'json_object' } };
  return {
    response_format: {
      type: 'json_schema',
      json_schema: { name: _0x2c62b8['name'], strict: _0x2c62b8['strict'], schema: _0x2c62b8['schema'] },
    },
  };
}
export function buildTextStructuredOutputSystemPrompt(
  _0x17247c,
  _0x4dd488,
  { mode: mode = 'json_schema' } = {},
) {
  const _0x123ef3 = String(_0x17247c || 'You\x20are\x20a\x20helpful\x20assistant.')['trim'](),
    _0x474643 = normalizeTextStructuredOutput(_0x4dd488);
  if (!_0x474643 || mode === 'json_schema') return _0x123ef3;
  return [
    _0x123ef3,
    '',
    'STRUCTURED OUTPUT CONTRACT (highest priority):',
    'Return exactly one valid JSON object that satisfies the JSON Schema below.',
    'Do not explain, do not use Markdown or code fences, and do not add text before or after the JSON object.',
    'JSON Schema: ' + JSON['stringify'](_0x474643['schema']),
  ]['join']('\x0a');
}
export function buildResponsesStructuredOutput(_0x93f90c) {
  const _0x3da2a3 = normalizeTextStructuredOutput(_0x93f90c);
  if (!_0x3da2a3) return {};
  return {
    text: {
      format: {
        type: 'json_schema',
        name: _0x3da2a3['name'],
        strict: _0x3da2a3['strict'],
        schema: _0x3da2a3['schema'],
      },
    },
  };
}
export function getTextStructuredOutputRequestMeta(_0x1078c2, { mode: mode = 'json_schema' } = {}) {
  const _0x4dd2ee = normalizeTextStructuredOutput(_0x1078c2);
  return _0x4dd2ee
    ? {
        name: _0x4dd2ee['name'],
        fallback: _0x4dd2ee['fallback'],
        ...(mode !== 'json_schema' ? { mode: mode } : {}),
      }
    : null;
}
export function shouldFallbackTextStructuredOutput(_0x46b238, _0x1a77f7) {
  return _0x46b238?.['fallback'] === 'prompt' && [0x190, 0x1a6]['includes'](Number(_0x1a77f7));
}
