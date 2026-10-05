const DEFAULT_MAX_CHARS = 6000,
  DEFAULT_MAX_STRING_CHARS = 800,
  DEFAULT_MAX_ARRAY_ITEMS = 12,
  DEFAULT_MAX_DEPTH = 5,
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
function truncateText(value, item = DEFAULT_MAX_STRING_CHARS) {
  const list = String(value || '');
  if (list['length'] <= item) return list;
  return list['slice'](0, Math['max'](0, item - 3)) + '...';
}
function sanitizeValue(
  list2,
  {
    depth: depth = 0,
    maxDepth: maxDepth = DEFAULT_MAX_DEPTH,
    maxArrayItems: maxArrayItems = DEFAULT_MAX_ARRAY_ITEMS,
    maxStringChars: maxStringChars = DEFAULT_MAX_STRING_CHARS,
  } = {},
) {
  if (list2 == null || typeof list2 === 'number' || typeof list2 === 'boolean') return list2;
  if (typeof list2 === 'string') return truncateText(list2, maxStringChars);
  if (depth >= maxDepth) return '[truncated]';
  if (Array['isArray'](list2))
    return list2['slice'](0, maxArrayItems)['map']((key) =>
      sanitizeValue(key, {
        depth: depth + 1,
        maxDepth: maxDepth,
        maxArrayItems: maxArrayItems,
        maxStringChars: maxStringChars,
      }),
    );
  if (typeof list2 !== 'object') return String(list2);
  const index = {};
  for (const [result, data] of Object['entries'](list2)) {
    if (SENSITIVE_OR_BULKY_KEYS['has'](String(result || '')['toLowerCase']())) continue;
    index[result] = sanitizeValue(data, {
      depth: depth + 1,
      maxDepth: maxDepth,
      maxArrayItems: maxArrayItems,
      maxStringChars: maxStringChars,
    });
  }
  return index;
}
function trimToBudget(ok, options = DEFAULT_MAX_CHARS) {
  let list3 = JSON['stringify'](ok);
  if (list3['length'] <= options) return ok;
  const ok2 = {
    ok: ok?.['ok'] === true,
    status: String(ok?.['status'] || ''),
    commandId: String(ok?.['commandId'] || ''),
    errorCode: String(ok?.['errorCode'] || ''),
    message: truncateText(ok?.['message'] || '', Math['max'](160, options - 320)),
    truncated: true,
  };
  list3 = JSON['stringify'](ok2);
  if (list3['length'] <= options) return ok2;
  return {
    ok: ok2['ok'],
    status: ok2['status'],
    commandId: ok2['commandId'],
    truncated: true,
  };
}
export function sanitizeAgentToolResult(target, source = {}) {
  return trimToBudget(sanitizeValue(target, source), source['maxChars']);
}
function getActionResponse(options2 = {}) {
  const next = Array['isArray'](options2['results']) ? options2['results'] : [];
  return next['at'](-1) || {};
}
function normalizeStringArray(list4) {
  return Array['isArray'](list4)
    ? [...new Set(list4['map']((current) => String(current || '')['trim']())['filter'](Boolean))]
    : [];
}
export function deriveAgentCapabilityDiscovery({ action: action = {}, execution: execution = {} } = {}) {
  if (execution['ok'] !== true) return { commandIds: [], modelIds: [] };
  const entry = String(action['type'] || ''),
    actionResponse = getActionResponse(execution)?.['result'] || {};
  if (entry === 'agent.capabilities.search')
    return { commandIds: normalizeStringArray(actionResponse['commandIds']), modelIds: [] };
  if (entry === 'agent.command.describe' && actionResponse['found'] !== false)
    return {
      commandIds: normalizeStringArray([actionResponse['commandId'] || action['args']?.['commandId']]),
      modelIds: [],
    };
  if (entry === 'agent.models.search')
    return { commandIds: [], modelIds: normalizeStringArray(actionResponse['modelIds']) };
  return { commandIds: [], modelIds: [] };
}
export function buildAgentToolResult({
  step: step = 0,
  action: action = {},
  execution: execution = {},
} = {}) {
  const result2 = getActionResponse(execution);
  return sanitizeAgentToolResult({
    step: Number(step) || 0,
    commandId: String(action['type'] || result2['commandId'] || ''),
    ok: execution['ok'] === true,
    status: String(execution['status'] || (execution['ok'] === true ? 'success' : 'failed')),
    errorCode: String(execution['errorCode'] || result2['errorCode'] || ''),
    message: String(execution['message'] || result2['message'] || ''),
    result: result2['result'],
    verification: result2['verification'],
    alias: String(result2['alias'] || action['alias'] || action['as'] || ''),
  });
}
function collectIds(enabled, list5, record) {
  if (!enabled || typeof enabled !== 'object') return;
  for (const payload of list5) {
    const handle = String(enabled[payload] || '')['trim']();
    if (handle) record['add'](handle);
  }
  for (const state of list5['map']((config) => config + 's')) {
    for (const scope of Array['isArray'](enabled[state]) ? enabled[state] : []) {
      const input = String(scope || '')['trim']();
      if (input) record['add'](input);
    }
  }
}
export function deriveAgentRuntimeProvenance({
  action: action = {},
  execution: execution = {},
  previous: previous = {},
} = {}) {
  const args = new Set(Array['isArray'](previous['createdNodeIds']) ? previous['createdNodeIds'] : []),
    args2 = new Set(Array['isArray'](previous['createdEdgeIds']) ? previous['createdEdgeIds'] : []),
    actionResponse2 = getActionResponse(execution);
  return (
    execution['ok'] === true &&
      ['node.create', 'node.createConnected', 'node.duplicate', 'collage.createFromSelection']['includes'](
        String(action['type'] || ''),
      ) &&
      collectIds(actionResponse2['result'], ['nodeId', 'id'], args),
    execution['ok'] === true &&
      String(action['type'] || '') === 'graph.connect' &&
      collectIds(actionResponse2['result'], ['edgeId', 'id'], args2),
    { createdNodeIds: [...args], createdEdgeIds: [...args2] }
  );
}
export function fingerprintAgentAction(args3 = {}) {
  const list6 = JSON['stringify']({
    type: String(args3['type'] || ''),
    args: args3['args'] && typeof args3['args'] === 'object' ? args3['args'] : {},
  });
  let output = 0x811c9dc5;
  for (let value2 = 0; value2 < list6['length']; value2 += 1) {
    ((output ^= list6['charCodeAt'](value2)), (output = Math['imul'](output, 0x1000193)));
  }
  return 'agent-action-' + (output >>> 0)['toString'](16)['padStart'](8, '0');
}
