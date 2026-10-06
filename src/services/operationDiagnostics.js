import { logDiagnosticEvent } from './diagnosticsService.js';
import { createDiagnosticOperation } from '../utils/diagnosticOperationRecorder.js';
const activeOperations = new Map();
export function diagnosticReference(value) {
  let item = 0x811c9dc5;
  for (const key of String(value || '')) {
    item = Math.imul(item ^ key.charCodeAt(0), 0x1000193);
  }
  return (item >>> 0).toString(36);
}
export function getDiagnosticOperationsSnapshot() {
  const index = Date.now();
  return {
    activeCount: activeOperations.size,
    sampledCount: Math.min(20, activeOperations.size),
    active: [...activeOperations.values()].slice(0, 20).map((args) => ({
      ...args,
      elapsedMs: Math.max(0, index - args.startedAt),
    })),
  };
}
export async function runDiagnosticOperation(type, context, result) {
  const diagnosticOperation = createDiagnosticOperation({
      type: type,
      context: context,
      logEvent: logDiagnosticEvent,
    }),
    { metadata: metadata } = diagnosticOperation,
    { operationId: operationId } = metadata;
  if (activeOperations.size < 200) activeOperations.set(operationId, { type: type, ...metadata });
  try {
    return await diagnosticOperation.run(result);
  } finally {
    activeOperations.delete(operationId);
  }
}
