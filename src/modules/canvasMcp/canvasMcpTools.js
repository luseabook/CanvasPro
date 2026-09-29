const CANVAS_WRITES = new Set(['nodes', 'edges', 'selection', 'viewport', 'history', 'generationTasks']),
  PRIVATE_NAMESPACES = new Set(['agent', 'clipboard', 'video', 'audio', 'image']),
  SENSITIVE_KEY =
    /api.?key|secret|token|authorization|cookie|credential|headers|manifestBundle|executionManifest|providerConfig/i;
function toolSchema(_0x3f91ed) {
  if (Array['isArray'](_0x3f91ed)) return _0x3f91ed['map'](toolSchema);
  if (!_0x3f91ed || typeof _0x3f91ed !== 'object') return _0x3f91ed;
  const _0x1535df = Object['fromEntries'](
    Object['entries'](_0x3f91ed)['map'](([_0x4e28aa, _0x396d20]) => [_0x4e28aa, toolSchema(_0x396d20)]),
  );
  if (_0x1535df['type'] === 'array' && !_0x1535df['items']) _0x1535df['items'] = {};
  return _0x1535df;
}
export function sanitizeMcpResult(_0x12c741, _0x5402a8 = 0x0) {
  if (_0x5402a8 > 0x12) return '[depth limit]';
  if (typeof _0x12c741 === 'string') {
    if (/^data:|^blob:/i['test'](_0x12c741)) return '[inline media omitted]';
    return _0x12c741['length'] > 0x5dc0 ? _0x12c741['slice'](0x0, 0x5dc0) + '…[truncated]' : _0x12c741;
  }
  if (Array['isArray'](_0x12c741)) {
    if (_0x12c741['length'] > 0x7d0)
      throw new Error(
        'Result has too many entries; request a smaller selection. Do not resubmit a mutation.',
      );
    return _0x12c741['map']((_0x7e0110) => sanitizeMcpResult(_0x7e0110, _0x5402a8 + 0x1));
  }
  if (_0x12c741 && typeof _0x12c741 === 'object')
    return Object['fromEntries'](
      Object['entries'](_0x12c741)
        ['filter'](
          ([_0x183cad, _0x39b07f]) => !SENSITIVE_KEY['test'](_0x183cad) && typeof _0x39b07f !== 'function',
        )
        ['map'](([_0x283215, _0x2e891d]) => [_0x283215, sanitizeMcpResult(_0x2e891d, _0x5402a8 + 0x1)]),
    );
  return _0x12c741;
}
export function canExposeCanvasCommand(_0x5bb542, { allowGeneration: allowGeneration = ![] } = {}) {
  const _0x23b27b = _0x5bb542['capabilitySchema'] || {};
  if (!Array['isArray'](_0x23b27b['writes']) || _0x23b27b['requiresSystemAccess']) return ![];
  if (!['safe', 'confirm']['includes'](_0x5bb542['riskLevel'])) return ![];
  if (PRIVATE_NAMESPACES['has'](_0x5bb542['id']['split']('.')[0x0])) return ![];
  if (_0x23b27b['writes']['some']((_0x19f25f) => !CANVAS_WRITES['has'](_0x19f25f))) return ![];
  if (
    _0x23b27b['writes']['includes']('generationTasks') &&
    _0x5bb542['id'] !== 'generation.cancel' &&
    !allowGeneration
  )
    return ![];
  return !![];
}
export function buildCanvasMcpTools(_0x3336f3, _0x5d534f = {}) {
  const _0x12be1c = _0x3336f3['list']()['filter']((_0xc8fbce) =>
      canExposeCanvasCommand(_0xc8fbce, _0x5d534f),
    ),
    _0x795631 = _0x12be1c['map']((_0x36430f) => ({
      name: 'canvas_' + _0x36430f['id']['replaceAll']('.', '_'),
      description:
        _0x36430f['description'] +
        ' Uses the connected canvas. ' +
        (_0x36430f['capabilitySchema']['writes']['includes']('generationTasks')
          ? 'Generation\x20may\x20consume\x20provider\x20credits;\x20follow\x20the\x20user\x27s\x20authorized\x20scope.\x20'
          : '') +
        'Reuse\x20requestKey\x20when\x20retrying\x20an\x20uncertain\x20submission.',
      inputSchema: {
        type: 'object',
        properties: {
          ...toolSchema(_0x36430f['argsSchema']['properties']),
          requestKey: {
            type: 'string',
            minLength: 0x8,
            maxLength: 0x64,
            description:
              'Unique\x20operation\x20ID;\x20reuse\x20only\x20when\x20retrying\x20exactly\x20the\x20same\x20call.',
          },
        },
        required: [..._0x36430f['argsSchema']['required'], 'requestKey'],
        additionalProperties: ![],
      },
      annotations: {
        readOnlyHint: _0x36430f['capabilitySchema']['writes']['length'] === 0x0,
        destructiveHint: ![],
        openWorldHint: _0x36430f['capabilitySchema']['writes']['includes']('generationTasks'),
      },
    }));
  if (new Set(_0x795631['map']((_0x235a31) => _0x235a31['name']))['size'] !== _0x795631['length'])
    throw new Error('Canvas MCP tool name collision');
  return (
    _0x795631['push']({
      name: 'canvas_models',
      description:
        'Discover current model manifests. Search by query/kind, then pass modelId to retrieve editable fields and input slots. Does not expose provider credentials or execution payloads.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          kind: { type: 'string', enum: ['text', 'image', 'video', 'audio'] },
          modelId: { type: 'string' },
          offset: { type: 'integer', minimum: 0x0 },
          requestKey: { type: 'string', minLength: 0x8, maxLength: 0x64 },
        },
        required: ['requestKey'],
        additionalProperties: ![],
      },
      annotations: { readOnlyHint: !![], destructiveHint: ![], openWorldHint: ![] },
    }),
    {
      tools: _0x795631,
      commandIds: new Map(
        _0x12be1c['map']((_0x32e8d4, _0x232370) => [_0x795631[_0x232370]['name'], _0x32e8d4['id']]),
      ),
    }
  );
}
export function describeCanvasMcpModels(_0x2aeccf, _0x225b51 = {}) {
  const _0x1dfb9d = String(_0x225b51['query'] || '')['toLowerCase'](),
    _0x294ba0 = _0x2aeccf['filter'](
      (_0x180be2) =>
        (!_0x225b51['kind'] || _0x180be2['kind'] === _0x225b51['kind']) &&
        (!_0x225b51['modelId'] || _0x180be2['modelId'] === _0x225b51['modelId']) &&
        (!_0x1dfb9d ||
          [
            _0x180be2['modelId'],
            _0x180be2['displayName'],
            _0x180be2['name'],
            _0x180be2['label'],
            _0x180be2['provider'],
          ]['some']((_0x223ee4) =>
            String(_0x223ee4 || '')
              ['toLowerCase']()
              ['includes'](_0x1dfb9d),
          )),
    ),
    _0x4fb8be = Number['isInteger'](_0x225b51['offset']) ? Math['max'](0x0, _0x225b51['offset']) : 0x0;
  return sanitizeMcpResult({
    total: _0x294ba0['length'],
    nextOffset: _0x4fb8be + 0x14 < _0x294ba0['length'] ? _0x4fb8be + 0x14 : null,
    models: _0x294ba0['slice'](_0x4fb8be, _0x4fb8be + 0x14)['map']((_0x77c398) => ({
      modelId: _0x77c398['modelId'],
      name: _0x77c398['displayName'] || _0x77c398['name'] || _0x77c398['label'],
      kind: _0x77c398['kind'],
      provider: _0x77c398['provider'],
      ...(_0x225b51['modelId']
        ? {
            fields: _0x77c398['uiSchema']?.['fields'] || [],
            inputSlots: _0x77c398['inputSlots'] || _0x77c398['uiSchema']?.['inputSlots'] || {},
          }
        : {}),
    })),
  });
}
