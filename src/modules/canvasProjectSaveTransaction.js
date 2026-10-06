import { assertCanvasProjectSaveAllowed } from '../services/canvasProjectAccess.js';
const latestSaves = new WeakMap();
export function captureCanvasProjectSaveTransaction({
  manager: manager,
  exportSource: exportSource,
  projectContext: projectContext,
  rename: rename = false,
} = {}) {
  assertCanvasProjectSaveAllowed(exportSource.multiData, manager);
  const canvasId = exportSource.multiData?.activeCanvasId,
    value = Object.freeze({
      manager: manager,
      token: Symbol('canvas-save'),
      canvasId: canvasId,
      exportSource: exportSource,
      projectContext: { ...(manager?.getCanvasProjectContext?.(canvasId) || projectContext) },
      originalCanvasName: manager?._canvases?.find((item) => item.id === canvasId)?.name,
      checkpoint: manager?.captureCanvasSaveCheckpoint?.(canvasId, {
        ...(rename ? { name: exportSource.projectName } : {}),
      }),
    });
  if (manager) {
    if (!latestSaves.has(manager)) latestSaves.set(manager, new Map());
    latestSaves.get(manager).set(canvasId, value.token);
  }
  return value;
}
export function commitCanvasProjectSave(key, index, { rename: rename = false } = {}) {
  const { manager: manager2, canvasId: canvasId2, checkpoint: checkpoint, exportSource: exportSource2 } = key,
    error = manager2?._canvases?.find((result) => result.id === canvasId2);
  if (!error || latestSaves.get(manager2)?.get(canvasId2) !== key.token) return false;
  (releaseCanvasProjectSave(key), manager2.setCanvasProjectContext?.(canvasId2, index));
  if (rename && error.name === key.originalCanvasName)
    manager2.renameCanvas?.(canvasId2, exportSource2.projectName);
  return (
    manager2.markCanvasClean?.(canvasId2, { checkpoint: checkpoint }),
    manager2.renderTabs?.(),
    true
  );
}
export function releaseCanvasProjectSave(enabled) {
  if (!enabled) return;
  const map = latestSaves.get(enabled.manager);
  if (map?.get(enabled.canvasId) === enabled.token) map.delete(enabled.canvasId);
}
