export function createCanvasCommandSuccess({
  commandId: _0x360dab,
  result: result = null,
  message: message = '',
  riskLevel: riskLevel = 'safe',
} = {}) {
  return {
    ok: true,
    commandId: String(_0x360dab || ''),
    result: result,
    message: String(message || _0x360dab || 'Canvas command executed.'),
    riskLevel: String(riskLevel || 'safe'),
  };
}
export function createCanvasCommandFailure({
  commandId: _0x106965,
  errorCode: errorCode = 'CANVAS_COMMAND_ERROR',
  message: message = 'Canvas command failed.',
  details: details = undefined,
} = {}) {
  const _0x5792e9 = {
    ok: false,
    commandId: String(_0x106965 || ''),
    errorCode: String(errorCode || 'CANVAS_COMMAND_ERROR'),
    message: String(message || 'Canvas command failed.'),
  };
  if (details !== undefined && details !== null) _0x5792e9.details = details;
  return _0x5792e9;
}
export function isCanvasCommandFailure(_0x3430fc) {
  return _0x3430fc && typeof _0x3430fc === 'object' && _0x3430fc.ok === false;
}
