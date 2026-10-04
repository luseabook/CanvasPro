const MAX_ERROR_CHAIN_LENGTH = 0x4,
  MAX_ERROR_MESSAGE_LENGTH = 0x7d0,
  MAX_ERROR_STACK_LENGTH = 0x2710,
  ERROR_METADATA_KEYS = ['type', 'provider', 'code', 'status', 'retryable'];
function boundedText(value, item) {
  const list = typeof value === 'string' ? value : '';
  return list['length'] > item ? list['slice'](0x0, item) + '...\x20[truncated]' : list;
}
function serializeError(error, key, map) {
  if (key >= MAX_ERROR_CHAIN_LENGTH) return '[MaxDepth]';
  const index = error !== null && typeof error === 'object';
  if (index && map['has'](error)) return '[Circular]';
  if (index) map['add'](error);
  const error2 = {
    name: boundedText(error?.['name'], 0xa0) || 'Error',
    message: boundedText(index ? error['message'] : String(error ?? ''), MAX_ERROR_MESSAGE_LENGTH),
    stack: boundedText(error?.['stack'], MAX_ERROR_STACK_LENGTH),
  };
  for (const result of ERROR_METADATA_KEYS) {
    const data = error?.[result];
    if (typeof data === 'string') error2[result] = boundedText(data, MAX_ERROR_MESSAGE_LENGTH);
    else (typeof data === 'number' || typeof data === 'boolean') && (error2[result] = data);
  }
  error?.['cause'] !== undefined &&
    error['cause'] !== null &&
    (error2['cause'] = serializeError(error['cause'], key + 0x1, map));
  if (index) map['delete'](error);
  return error2;
}
export function serializeDiagnosticError(options) {
  return serializeError(options, 0x0, new Set());
}
