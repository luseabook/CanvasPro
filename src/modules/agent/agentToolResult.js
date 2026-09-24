const DEFAULT_MAX_CHARS = 0x1770,
  DEFAULT_MAX_STRING_CHARS = 0x320,
  DEFAULT_MAX_ARRAY_ITEMS = 0xc,
  DEFAULT_MAX_DEPTH = 0x5,
  SENSITIVE_OR_BULKY_KEYS = new Set([
    'authorization',
    'apikey',
    'api_key',
    'base64',
    'blob',
    'body',
    'buffer',
    'bytes',
    'data',
    'headers',
    'raw',
    'request',
    'response',
    'secret',
    'token',
  ]);
function truncateText(_0x8b317f, _0x40d60f = DEFAULT_MAX_STRING_CHARS) {
  const _0x44f22b = String(_0x8b317f || '');
  if (_0x44f22b['length'] <= _0x40d60f) return _0x44f22b;
  return _0x44f22b['slice'](0x0, Math['max'](0x0, _0x40d60f - 0x3)) + '...';
}
function sanitizeValue(
  _0xf3aec,
  {
    depth: depth = 0x0,
    maxDepth: maxDepth = DEFAULT_MAX_DEPTH,
    maxArrayItems: maxArrayItems = DEFAULT_MAX_ARRAY_ITEMS,
    maxStringChars: maxStringChars = DEFAULT_MAX_STRING_CHARS,
  } = {},
) {
  if (_0xf3aec == null || typeof _0xf3aec === 'number' || typeof _0xf3aec === 'boolean') return _0xf3aec;
  if (typeof _0xf3aec === 'string') return truncateText(_0xf3aec, maxStringChars);
  if (depth >= maxDepth) return '[truncated]';
  if (Array['isArray'](_0xf3aec))
    return _0xf3aec['slice'](0x0, maxArrayItems)['map']((_0x457776) =>
      sanitizeValue(_0x457776, {
        depth: depth + 0x1,
        maxDepth: maxDepth,
        maxArrayItems: maxArrayItems,
        maxStringChars: maxStringChars,
      }),
    );
  if (typeof _0xf3aec !== 'object') return String(_0xf3aec);
  const _0x53f9af = {};
  for (const [_0xc7fd6e, _0x378272] of Object['entries'](_0xf3aec)) {
    if (SENSITIVE_OR_BULKY_KEYS['has'](String(_0xc7fd6e || '')['toLowerCase']())) continue;
    _0x53f9af[_0xc7fd6e] = sanitizeValue(_0x378272, {
      depth: depth + 0x1,
      maxDepth: maxDepth,
      maxArrayItems: maxArrayItems,
      maxStringChars: maxStringChars,
    });
  }
  return _0x53f9af;
}
function trimToBudget(_0x445a70, _0x328152 = DEFAULT_MAX_CHARS) {
  let _0x520af2 = JSON['stringify'](_0x445a70);
  if (_0x520af2['length'] <= _0x328152) return _0x445a70;
  const _0x4a6712 = {
    ok: _0x445a70?.['ok'] === !![],
    status: String(_0x445a70?.['status'] || ''),
    commandId: String(_0x445a70?.['commandId'] || ''),
    errorCode: String(_0x445a70?.['errorCode'] || ''),
    message: truncateText(_0x445a70?.['message'] || '', Math['max'](0xa0, _0x328152 - 0x140)),
    truncated: !![],
  };
  _0x520af2 = JSON['stringify'](_0x4a6712);
  if (_0x520af2['length'] <= _0x328152) return _0x4a6712;
  return {
    ok: _0x4a6712['ok'],
    status: _0x4a6712['status'],
    commandId: _0x4a6712['commandId'],
    truncated: !![],
  };
}
export function sanitizeAgentToolResult(_0x4fe59c, _0x5141fd = {}) {
  return trimToBudget(sanitizeValue(_0x4fe59c, _0x5141fd), _0x5141fd['maxChars']);
}
function getActionResponse(_0xabca00 = {}) {
  const _0x3d9184 = Array['isArray'](_0xabca00['results']) ? _0xabca00['results'] : [];
  return _0x3d9184['at'](-0x1) || {};
}
function normalizeStringArray(_0x34dca5) {
  return Array['isArray'](_0x34dca5)
    ? [...new Set(_0x34dca5['map']((_0x420df0) => String(_0x420df0 || '')['trim']())['filter'](Boolean))]
    : [];
}
export function deriveAgentCapabilityDiscovery({ action: action = {}, execution: execution = {} } = {}) {
  if (execution['ok'] !== !![]) return { commandIds: [], modelIds: [] };
  const _0x4b5445 = String(action['type'] || ''),
    _0x326292 = getActionResponse(execution)?.['result'] || {};
  if (_0x4b5445 === 'agent.capabilities.search')
    return { commandIds: normalizeStringArray(_0x326292['commandIds']), modelIds: [] };
  if (_0x4b5445 === 'agent.command.describe' && _0x326292['found'] !== ![])
    return {
      commandIds: normalizeStringArray([_0x326292['commandId'] || action['args']?.['commandId']]),
      modelIds: [],
    };
  if (_0x4b5445 === 'agent.models.search')
    return { commandIds: [], modelIds: normalizeStringArray(_0x326292['modelIds']) };
  return { commandIds: [], modelIds: [] };
}
export function buildAgentToolResult({
  step: step = 0x0,
  action: action = {},
  execution: execution = {},
} = {}) {
  const _0x2055d3 = getActionResponse(execution);
  return sanitizeAgentToolResult({
    step: Number(step) || 0x0,
    commandId: String(action['type'] || _0x2055d3['commandId'] || ''),
    ok: execution['ok'] === !![],
    status: String(execution['status'] || (execution['ok'] === !![] ? 'success' : 'failed')),
    errorCode: String(execution['errorCode'] || _0x2055d3['errorCode'] || ''),
    message: String(execution['message'] || _0x2055d3['message'] || ''),
    result: _0x2055d3['result'],
    verification: _0x2055d3['verification'],
    alias: String(_0x2055d3['alias'] || action['alias'] || action['as'] || ''),
  });
}
function collectIds(_0x39b01c, _0x4c2211, _0x5355ba) {
  if (!_0x39b01c || typeof _0x39b01c !== 'object') return;
  for (const _0x35b26c of _0x4c2211) {
    const _0x14a560 = String(_0x39b01c[_0x35b26c] || '')['trim']();
    if (_0x14a560) _0x5355ba['add'](_0x14a560);
  }
  for (const _0x5ef463 of _0x4c2211['map']((_0x15bf79) => _0x15bf79 + 's')) {
    for (const _0x184006 of Array['isArray'](_0x39b01c[_0x5ef463]) ? _0x39b01c[_0x5ef463] : []) {
      const _0x125334 = String(_0x184006 || '')['trim']();
      if (_0x125334) _0x5355ba['add'](_0x125334);
    }
  }
}
export function deriveAgentRuntimeProvenance({
  action: action = {},
  execution: execution = {},
  previous: previous = {},
} = {}) {
  const _0x4ca2e9 = new Set(Array['isArray'](previous['createdNodeIds']) ? previous['createdNodeIds'] : []),
    _0x5df764 = new Set(Array['isArray'](previous['createdEdgeIds']) ? previous['createdEdgeIds'] : []),
    _0x706293 = getActionResponse(execution);
  return (
    execution['ok'] === !![] &&
      ['node.create', 'node.createConnected', 'node.duplicate', 'collage.createFromSelection']['includes'](
        String(action['type'] || ''),
      ) &&
      collectIds(_0x706293['result'], ['nodeId', 'id'], _0x4ca2e9),
    execution['ok'] === !![] &&
      String(action['type'] || '') === 'graph.connect' &&
      collectIds(_0x706293['result'], ['edgeId', 'id'], _0x5df764),
    { createdNodeIds: [..._0x4ca2e9], createdEdgeIds: [..._0x5df764] }
  );
}
export function fingerprintAgentAction(_0x12fddc = {}) {
  const _0x462e7f = JSON['stringify']({
    type: String(_0x12fddc['type'] || ''),
    args: _0x12fddc['args'] && typeof _0x12fddc['args'] === 'object' ? _0x12fddc['args'] : {},
  });
  let _0x3bea4a = 0x811c9dc5;
  for (let _0x10fc62 = 0x0; _0x10fc62 < _0x462e7f['length']; _0x10fc62 += 0x1) {
    ((_0x3bea4a ^= _0x462e7f['charCodeAt'](_0x10fc62)), (_0x3bea4a = Math['imul'](_0x3bea4a, 0x1000193)));
  }
  return 'agent-action-' + (_0x3bea4a >>> 0x0)['toString'](0x10)['padStart'](0x8, '0');
}
