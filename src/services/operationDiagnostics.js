import { logDiagnosticEvent } from './diagnosticsService.js';
import { createDiagnosticOperation } from '../utils/diagnosticOperationRecorder.js';
const activeOperations = new Map();
export function diagnosticReference(_0x314bc6) {
  let _0x37bbe8 = 0x811c9dc5;
  for (const _0x15e235 of String(_0x314bc6 || '')) {
    _0x37bbe8 = Math['imul'](_0x37bbe8 ^ _0x15e235['charCodeAt'](0x0), 0x1000193);
  }
  return (_0x37bbe8 >>> 0x0)['toString'](0x24);
}
export function getDiagnosticOperationsSnapshot() {
  const _0x2c1560 = Date['now']();
  return {
    activeCount: activeOperations['size'],
    sampledCount: Math['min'](0x14, activeOperations['size']),
    active: [...activeOperations['values']()]
      ['slice'](0x0, 0x14)
      ['map']((_0x5eca15) => ({
        ..._0x5eca15,
        elapsedMs: Math['max'](0x0, _0x2c1560 - _0x5eca15['startedAt']),
      })),
  };
}
export async function runDiagnosticOperation(_0x26f06f, _0x180176, _0x568f8d) {
  const _0x1649ce = createDiagnosticOperation({
      type: _0x26f06f,
      context: _0x180176,
      logEvent: logDiagnosticEvent,
    }),
    { metadata: _0x1f517e } = _0x1649ce,
    { operationId: _0xc8c9df } = _0x1f517e;
  if (activeOperations['size'] < 0xc8) activeOperations['set'](_0xc8c9df, { type: _0x26f06f, ..._0x1f517e });
  try {
    return await _0x1649ce['run'](_0x568f8d);
  } finally {
    activeOperations['delete'](_0xc8c9df);
  }
}
