export function createCanvasCommandSuccess({
  commandId: commandId,
  result: result = null,
  message: message = '',
  riskLevel: riskLevel = 'safe',
} = {}) {
  return {
    ok: true,
    commandId: String(commandId || ''),
    result: result,
    message: String(message || commandId || 'Canvas command executed.'),
    riskLevel: String(riskLevel || 'safe'),
  };
}
export function createCanvasCommandFailure({
  commandId: commandId2,
  errorCode: errorCode = 'CANVAS_COMMAND_ERROR',
  message: message = 'Canvas command failed.',
  details: details = undefined,
} = {}) {
  const value = {
    ok: false,
    commandId: String(commandId2 || ''),
    errorCode: String(errorCode || 'CANVAS_COMMAND_ERROR'),
    message: String(message || 'Canvas command failed.'),
  };
  if (details !== undefined && details !== null) value.details = details;
  return value;
}
export function isCanvasCommandFailure(response) {
  return response && typeof response === 'object' && response.ok === false;
}
