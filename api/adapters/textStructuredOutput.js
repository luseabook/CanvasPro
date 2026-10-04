function normalizeSchemaName(value) {
  const list = String(value || '')['trim']();
  if (!list || list['length'] > 0x40 || !/^[A-Za-z0-9_-]+$/['test'](list))
    throw new Error('结构化输出名称必须是\x201\x20至\x2064\x20位字母、数字、下划线或连字符。');
  return list;
}
export function normalizeTextStructuredOutput(strict) {
  if (strict == null) return null;
  if (!strict || typeof strict !== 'object' || Array['isArray'](strict))
    throw new Error('结构化输出配置必须是对象。');
  const schema = strict['schema'];
  if (!schema || typeof schema !== 'object' || Array['isArray'](schema))
    throw new Error('结构化输出配置缺少 JSON Schema。');
  return {
    name: normalizeSchemaName(strict['name']),
    schema: schema,
    strict: strict['strict'] !== ![],
    fallback: strict['fallback'] === 'prompt' ? 'prompt' : 'none',
  };
}
export function buildChatCompletionsStructuredOutput(item, { mode: mode = 'json_schema' } = {}) {
  const name = normalizeTextStructuredOutput(item);
  if (!name) return {};
  if (mode === 'none') return {};
  if (mode === 'json_object') return { response_format: { type: 'json_object' } };
  return {
    response_format: {
      type: 'json_schema',
      json_schema: { name: name['name'], strict: name['strict'], schema: name['schema'] },
    },
  };
}
export function buildTextStructuredOutputSystemPrompt(key, index, { mode: mode = 'json_schema' } = {}) {
  const result = String(key || 'You\x20are\x20a\x20helpful\x20assistant.')['trim'](),
    textStructuredOutput = normalizeTextStructuredOutput(index);
  if (!textStructuredOutput || mode === 'json_schema') return result;
  return [
    result,
    '',
    'STRUCTURED OUTPUT CONTRACT (highest priority):',
    'Return exactly one valid JSON object that satisfies the JSON Schema below.',
    'Do not explain, do not use Markdown or code fences, and do not add text before or after the JSON object.',
    'JSON Schema: ' + JSON['stringify'](textStructuredOutput['schema']),
  ]['join']('\x0a');
}
export function buildResponsesStructuredOutput(data) {
  const name2 = normalizeTextStructuredOutput(data);
  if (!name2) return {};
  return {
    text: {
      format: {
        type: 'json_schema',
        name: name2['name'],
        strict: name2['strict'],
        schema: name2['schema'],
      },
    },
  };
}
export function getTextStructuredOutputRequestMeta(options, { mode: mode = 'json_schema' } = {}) {
  const name3 = normalizeTextStructuredOutput(options);
  return name3
    ? {
        name: name3['name'],
        fallback: name3['fallback'],
        ...(mode !== 'json_schema' ? { mode: mode } : {}),
      }
    : null;
}
export function shouldFallbackTextStructuredOutput(target, source) {
  return target?.['fallback'] === 'prompt' && [0x190, 0x1a6]['includes'](Number(source));
}
