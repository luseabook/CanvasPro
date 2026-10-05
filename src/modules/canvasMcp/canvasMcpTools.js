const CANVAS_WRITES = new Set(['nodes', 'edges', 'selection', 'viewport', 'history', 'generationTasks']),
  PRIVATE_NAMESPACES = new Set(['agent', 'clipboard', 'video', 'audio', 'image']),
  SENSITIVE_KEY =
    /api.?key|secret|token|authorization|cookie|credential|headers|manifestBundle|executionManifest|providerConfig/i;
function toolSchema(list) {
  if (Array['isArray'](list)) return list['map'](toolSchema);
  if (!list || typeof list !== 'object') return list;
  const enabled = Object['fromEntries'](
    Object['entries'](list)['map'](([value, item]) => [value, toolSchema(item)]),
  );
  if (enabled['type'] === 'array' && !enabled['items']) enabled['items'] = {};
  return enabled;
}
export function sanitizeMcpResult(list2, count = 0) {
  if (count > 18) return '[depth limit]';
  if (typeof list2 === 'string') {
    if (/^data:|^blob:/i['test'](list2)) return '[inline media omitted]';
    return list2['length'] > 24000 ? list2['slice'](0, 24000) + '…[truncated]' : list2;
  }
  if (Array['isArray'](list2)) {
    if (list2['length'] > 2000)
      throw new Error(
        'Result has too many entries; request a smaller selection. Do not resubmit a mutation.',
      );
    return list2['map']((key) => sanitizeMcpResult(key, count + 1));
  }
  if (list2 && typeof list2 === 'object')
    return Object['fromEntries'](
      Object['entries'](list2)
        ['filter'](([index, result]) => !SENSITIVE_KEY['test'](index) && typeof result !== 'function')
        ['map'](([data, options]) => [data, sanitizeMcpResult(options, count + 1)]),
    );
  return list2;
}
export function canExposeCanvasCommand(target, { allowGeneration: allowGeneration = false } = {}) {
  const source = target['capabilitySchema'] || {};
  if (!Array['isArray'](source['writes']) || source['requiresSystemAccess']) return false;
  if (!['safe', 'confirm']['includes'](target['riskLevel'])) return false;
  if (PRIVATE_NAMESPACES['has'](target['id']['split']('.')[0])) return false;
  if (source['writes']['some']((next) => !CANVAS_WRITES['has'](next))) return false;
  if (
    source['writes']['includes']('generationTasks') &&
    target['id'] !== 'generation.cancel' &&
    !allowGeneration
  )
    return false;
  return true;
}
export function buildCanvasMcpTools(current, entry = {}) {
  const list3 = current['list']()['filter']((record) => canExposeCanvasCommand(record, entry)),
    tools = list3['map']((description) => ({
      name: 'canvas_' + description['id']['replaceAll']('.', '_'),
      description:
        description['description'] +
        ' Uses the connected canvas. ' +
        (description['capabilitySchema']['writes']['includes']('generationTasks')
          ? 'Generation may consume provider credits; follow the user\'s authorized scope. '
          : '') +
        'Reuse requestKey when retrying an uncertain submission.',
      inputSchema: {
        type: 'object',
        properties: {
          ...toolSchema(description['argsSchema']['properties']),
          requestKey: {
            type: 'string',
            minLength: 8,
            maxLength: 100,
            description:
              'Unique operation ID; reuse only when retrying exactly the same call.',
          },
        },
        required: [...description['argsSchema']['required'], 'requestKey'],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: description['capabilitySchema']['writes']['length'] === 0,
        destructiveHint: false,
        openWorldHint: description['capabilitySchema']['writes']['includes']('generationTasks'),
      },
    }));
  if (new Set(tools['map']((error) => error['name']))['size'] !== tools['length'])
    throw new Error('Canvas MCP tool name collision');
  return (
    tools['push']({
      name: 'canvas_models',
      description:
        'Discover current model manifests. Search by query/kind, then pass modelId to retrieve editable fields and input slots. Does not expose provider credentials or execution payloads.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          kind: { type: 'string', enum: ['text', 'image', 'video', 'audio'] },
          modelId: { type: 'string' },
          offset: { type: 'integer', minimum: 0 },
          requestKey: { type: 'string', minLength: 8, maxLength: 100 },
        },
        required: ['requestKey'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    }),
    {
      tools: tools,
      commandIds: new Map(list3['map']((payload, handle) => [tools[handle]['name'], payload['id']])),
    }
  );
}
export function describeCanvasMcpModels(list4, enabled2 = {}) {
  const enabled3 = String(enabled2['query'] || '')['toLowerCase'](),
    total = list4['filter'](
      (error2) =>
        (!enabled2['kind'] || error2['kind'] === enabled2['kind']) &&
        (!enabled2['modelId'] || error2['modelId'] === enabled2['modelId']) &&
        (!enabled3 ||
          [error2['modelId'], error2['displayName'], error2['name'], error2['label'], error2['provider']][
            'some'
          ]((state) =>
            String(state || '')
              ['toLowerCase']()
              ['includes'](enabled3),
          )),
    ),
    nextOffset = Number['isInteger'](enabled2['offset']) ? Math['max'](0, enabled2['offset']) : 0;
  return sanitizeMcpResult({
    total: total['length'],
    nextOffset: nextOffset + 20 < total['length'] ? nextOffset + 20 : null,
    models: total['slice'](nextOffset, nextOffset + 20)['map']((modelId) => ({
      modelId: modelId['modelId'],
      name: modelId['displayName'] || modelId['name'] || modelId['label'],
      kind: modelId['kind'],
      provider: modelId['provider'],
      ...(enabled2['modelId']
        ? {
            fields: modelId['uiSchema']?.['fields'] || [],
            inputSlots: modelId['inputSlots'] || modelId['uiSchema']?.['inputSlots'] || {},
          }
        : {}),
    })),
  });
}
