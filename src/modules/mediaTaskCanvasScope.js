// Renderer-only ownership. A canvas/tab ID alone can be reused by another project;
// the live nodes object changes whenever the store hydrates a different snapshot.
const taskScopes = new Map();

export function captureMediaTaskCanvasScope(store, host = globalThis.window) {
  const nodes = store?.getStateRaw?.()?.nodes;
  if (!nodes || typeof nodes !== 'object') return null;
  const canvasId = host?.CanvasTabManager?.getActiveCanvasId?.();
  return { nodes, canvasId: typeof canvasId === 'string' ? canvasId : '' };
}

export function isMediaTaskCanvasCurrent(scope, store, host = globalThis.window) {
  const current = captureMediaTaskCanvasScope(store, host);
  return !!scope && !!current && scope.nodes === current.nodes && scope.canvasId === current.canvasId;
}

export function registerMediaTaskCanvasScope(taskId, scope) {
  if (!taskId || taskScopes.has(taskId)) throw new Error('Media task ID already reserved; check the existing task');
  taskScopes.set(taskId, scope);
}

export function mayApplyMediaTaskUpdate(taskId, store, host = globalThis.window) {
  return isMediaTaskCanvasCurrent(taskScopes.get(taskId), store, host);
}

export function releaseMediaTaskCanvasScope(taskId) {
  taskScopes.delete(taskId);
}
